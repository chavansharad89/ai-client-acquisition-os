import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  archiveContentItem,
  createAsset,
  createPgCmsAdminRepository,
  createPgContentItemRepository,
  createPgPlanDisplayNameRepository,
  getPublishedContentItemForPlans,
  NotCmsAdminError,
  requireCmsAdmin,
  setLifecycleStatus,
} from '@acos/core-cms';
import {
  convertLinkedCmsEntitlementsToSubscriptionPeriods,
  createPgSubscriptionPeriodRepository,
  findActiveCmsPlans,
  permittedContentPlans,
} from '@acos/core-subscriptions';

import { ADMIN_URL, createTempDatabase, serverReachable, type TempDatabase } from './support/pgIndexHarness';

// Plus/Pro/Max CMS, Phase 1 — against real PostgreSQL (mirrors
// subscription-webhook.integration.test.ts's own conventions). Covers:
//   - migration 0063's backfill_cms_30day_subscription_periods():
//     converts existing dev ai_income_99/ai_freelancing_499
//     entitlements into 30-day subscription_periods rows, per the
//     Product Owner's "FINAL PO CLARIFICATION" (no grandfathering).
//   - the resulting active/expired behavior through the real
//     SubscriptionPeriodRepository.
//   - permittedContentPlans' Max -> Plus+Pro+Max inheritance against a
//     real Max subscription_periods row.
//   - plan_display_names (migration 0061) read/write via the real
//     Postgres-backed repository.
//   - that historical entitlements/orders/payments rows are never
//     deleted or mutated by the backfill.

const DAY_MS = 24 * 60 * 60 * 1000;

let reachable = false;
const open: TempDatabase[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  while (open.length > 0) await open.pop()!.drop();
});

async function freshDb(label: string): Promise<TempDatabase> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, {});
  open.push(db);
  return db;
}

async function seedUser(db: TempDatabase, suffix: string): Promise<string> {
  const id = `user_${suffix}`;
  await db.client.query(`INSERT INTO users (id, email) VALUES ($1, $2)`, [
    id,
    `buyer_${suffix}@example.test`,
  ]);
  return id;
}

/** A fully paid-for one-time entitlement (order + CAPTURED payment + entitlement row), optionally linked to a user and dated in the past. */
async function seedLegacyEntitlement(
  db: TempDatabase,
  opts: {
    suffix: string;
    productSlug: 'ai_income_99' | 'ai_freelancing_499';
    userId: string | null;
    grantedAt: Date;
    revoked?: boolean;
  },
): Promise<{ entitlementId: string; razorpayPaymentId: string }> {
  const email = `buyer_${opts.suffix}@example.test`;
  const amountPaise = opts.productSlug === 'ai_income_99' ? 9_900 : 49_900;
  const productName = opts.productSlug === 'ai_income_99' ? 'AI Income Starter Kit' : 'AI Freelancing Launch Kit';
  const orderId = `order_${opts.suffix}`;
  const razorpayPaymentId = `pay_${opts.suffix}`;
  const entitlementId = `ent_${opts.suffix}`;

  await db.client.query(
    `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug,
                         product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'INR', 'PAID', now())`,
    [orderId, `rzp_${orderId}`, email, opts.productSlug, productName, amountPaise],
  );
  await db.client.query(
    `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, $3, $4, 'INR', 'CAPTURED', now())`,
    [`payrow_${opts.suffix}`, razorpayPaymentId, orderId, amountPaise],
  );
  await db.client.query(
    `INSERT INTO entitlements (id, customer_email, product_slug, order_id, granted_at,
                               revoked_at, user_id, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())`,
    [
      entitlementId,
      email,
      opts.productSlug,
      orderId,
      opts.grantedAt,
      opts.revoked ? new Date() : null,
      opts.userId,
    ],
  );

  return { entitlementId, razorpayPaymentId };
}

async function runBackfill(db: TempDatabase): Promise<number> {
  const { rows } = await db.client.query(
    `SELECT inserted_count FROM backfill_cms_30day_subscription_periods()`,
  );
  return Number((rows[0] as { inserted_count: string | number }).inserted_count);
}

describe('Plus/Pro/Max CMS Phase 1 — 30-day entitlement backfill (migration 0063)', () => {
  it('converts a still-within-30-days legacy Plus entitlement into an ACTIVE subscription_periods row', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'active-plus');
    const grantedAt = new Date(Date.now() - 10 * DAY_MS); // 10 days ago
    await seedLegacyEntitlement(db, {
      suffix: 'active-plus',
      productSlug: 'ai_income_99',
      userId,
      grantedAt,
    });

    const insertedCount = await runBackfill(db);
    expect(insertedCount).toBe(1);

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const active = await subscriptionPeriods.findActiveForUser(userId, 'ai_income_99', new Date());
    expect(active).not.toBeNull();
    expect(active?.durationDays).toBe(30);
    expect(active?.activationAt.getTime()).toBe(grantedAt.getTime());
    expect(active?.razorpaySubscriptionId).toMatch(/^legacy-onetime:/);

    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted).toEqual(new Set(['ai_income_99']));
  });

  it('converts a more-than-30-days-old legacy Pro entitlement into an EXPIRED subscription_periods row (no grandfathering)', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'expired-pro');
    const grantedAt = new Date(Date.now() - 40 * DAY_MS); // 40 days ago
    await seedLegacyEntitlement(db, {
      suffix: 'expired-pro',
      productSlug: 'ai_freelancing_499',
      userId,
      grantedAt,
    });

    await runBackfill(db);

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const active = await subscriptionPeriods.findActiveForUser(userId, 'ai_freelancing_499', new Date());
    expect(active).toBeNull();

    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted.size).toBe(0);

    // The historical entitlement row itself is untouched, not deleted.
    const { rows } = await db.client.query(
      `SELECT revoked_at FROM entitlements WHERE user_id = $1 AND product_slug = 'ai_freelancing_499'`,
      [userId],
    );
    expect(rows).toHaveLength(1);
    expect((rows[0] as { revoked_at: Date | null }).revoked_at).toBeNull();
  });

  it('is idempotent — calling the backfill twice inserts no duplicate rows', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'idempotent');
    await seedLegacyEntitlement(db, {
      suffix: 'idempotent',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 5 * DAY_MS),
    });

    const first = await runBackfill(db);
    const second = await runBackfill(db);
    expect(first).toBe(1);
    expect(second).toBe(0);

    const { rows } = await db.client.query(
      `SELECT count(*) AS c FROM subscription_periods WHERE user_id = $1`,
      [userId],
    );
    expect(Number((rows[0] as { c: string }).c)).toBe(1);
  });

  it('does NOT convert a revoked entitlement', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'revoked');
    await seedLegacyEntitlement(db, {
      suffix: 'revoked',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 5 * DAY_MS),
      revoked: true,
    });

    const insertedCount = await runBackfill(db);
    expect(insertedCount).toBe(0);

    const { rows } = await db.client.query(`SELECT count(*) AS c FROM subscription_periods`);
    expect(Number((rows[0] as { c: string }).c)).toBe(0);
  });

  it('does NOT convert an entitlement never claimed into an account (user_id IS NULL)', async () => {
    const db = await freshDb('cms1');
    await seedLegacyEntitlement(db, {
      suffix: 'unclaimed',
      productSlug: 'ai_income_99',
      userId: null,
      grantedAt: new Date(Date.now() - 5 * DAY_MS),
    });

    const insertedCount = await runBackfill(db);
    expect(insertedCount).toBe(0);
  });

  it('Max -> Plus + Pro + Max: a real active Max subscription_periods row grants the full permitted set, with no content duplication', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'max-holder');

    await db.client.query(
      `INSERT INTO subscription_periods (id, user_id, product_slug, razorpay_subscription_id,
                                         razorpay_payment_id, activation_at, duration_days, updated_at)
       VALUES ($1, $2, 'ai_client_acquisition_1499_subscription', $3, $4, $5, 30, now())`,
      [
        'sp_max_1',
        userId,
        'sub_max_1',
        'pay_max_1',
        new Date(Date.now() - 1 * DAY_MS),
      ],
    );

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const active = await findActiveCmsPlans({ subscriptionPeriods }, userId);
    expect(active).toEqual(new Set(['ai_client_acquisition_1499_subscription']));

    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted).toEqual(
      new Set(['ai_income_99', 'ai_freelancing_499', 'ai_client_acquisition_1499_subscription']),
    );
  });

  it('an EXPIRED Max subscription grants nothing — no Plus/Pro/Max access', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'max-expired');

    await db.client.query(
      `INSERT INTO subscription_periods (id, user_id, product_slug, razorpay_subscription_id,
                                         razorpay_payment_id, activation_at, duration_days, updated_at)
       VALUES ($1, $2, 'ai_client_acquisition_1499_subscription', $3, $4, $5, 30, now())`,
      [
        'sp_max_expired',
        userId,
        'sub_max_expired',
        'pay_max_expired',
        new Date(Date.now() - 45 * DAY_MS),
      ],
    );

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted.size).toBe(0);
  });

  it('plan_display_names: real Postgres-backed repository round-trips an override without touching ProductId/catalog data', async () => {
    const db = await freshDb('cms1');
    const repo = createPgPlanDisplayNameRepository(db.client);

    expect(await repo.findByProductId('ai_income_99')).toBeNull();

    const written = await repo.upsert('ai_income_99', 'Plus', 'admin-1');
    expect(written.displayName).toBe('Plus');

    const read = await repo.findByProductId('ai_income_99');
    expect(read?.displayName).toBe('Plus');

    // A rename is a plain upsert, not a new identity.
    const renamed = await repo.upsert('ai_income_99', 'Starter', 'admin-1');
    expect(renamed.displayName).toBe('Starter');
    const { rows } = await db.client.query(`SELECT count(*) AS c FROM plan_display_names`);
    expect(Number((rows[0] as { c: string }).c)).toBe(1); // upsert, not a second row
  });

  describe('content_items schema (migration 0062) — no application consumer yet, constraints only', () => {
    it('allows a CONTAINER with an ASSET child under the same plan', async () => {
      const db = await freshDb('cms1');
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, title, status)
         VALUES ('chapter_1', 'ai_income_99', 'CONTAINER', 'Chapter 1', 'DRAFT')`,
      );
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, parent_id, node_type, asset_kind, title, storage_key, bytes, status)
         VALUES ('asset_1', 'ai_income_99', 'chapter_1', 'ASSET', 'pdf', 'Lesson 1', 'ai_income_99/lesson1.pdf', 1000, 'PUBLISHED')`,
      );
      const { rows } = await db.client.query(`SELECT count(*) AS c FROM content_items`);
      expect(Number((rows[0] as { c: string }).c)).toBe(2);
    });

    it('rejects an ASSET with no storage_key (node-shape constraint)', async () => {
      const db = await freshDb('cms1');
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, bytes, status)
           VALUES ('bad_asset', 'ai_income_99', 'ASSET', 'pdf', 'Broken', 1000, 'DRAFT')`,
        ),
      ).rejects.toThrow();
    });

    it('rejects a CONTAINER that carries a storage_key (node-shape constraint)', async () => {
      const db = await freshDb('cms1');
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, node_type, title, storage_key, status)
           VALUES ('bad_container', 'ai_income_99', 'CONTAINER', 'Broken', 'should-not-be-here', 'DRAFT')`,
        ),
      ).rejects.toThrow();
    });

    it('rejects a child whose owning_product_id differs from its parent (plan-match trigger)', async () => {
      const db = await freshDb('cms1');
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, title, status)
         VALUES ('plus_chapter', 'ai_income_99', 'CONTAINER', 'Plus Chapter', 'DRAFT')`,
      );
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, parent_id, node_type, asset_kind, title, storage_key, bytes, status)
           VALUES ('pro_asset_under_plus', 'ai_freelancing_499', 'plus_chapter', 'ASSET', 'pdf', 'Mismatched', 'x.pdf', 10, 'DRAFT')`,
        ),
      ).rejects.toThrow();
    });

    it('rejects ARCHIVED without archived_at, and vice versa (archived-consistency constraint)', async () => {
      const db = await freshDb('cms1');
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, node_type, title, status)
           VALUES ('archived_no_ts', 'ai_income_99', 'CONTAINER', 'Broken', 'ARCHIVED')`,
        ),
      ).rejects.toThrow();
    });
  });

  describe('content_items replacement/retention schema (migration 0066, CMS-PO-010(R2) Phase 1) — no application consumer yet, constraints only', () => {
    async function seedPublishedAsset(db: TempDatabase, id: string, owningProductId = 'ai_income_99') {
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
         VALUES ($1, $2, 'ASSET', 'pdf', 'Published Asset', $3, 1000, 'PUBLISHED')`,
        [id, owningProductId, `cms/${owningProductId}/assets/${id}.pdf`],
      );
    }

    it('A. a normal published asset with no replacement fields remains valid (pre-existing behaviour unaffected)', async () => {
      const db = await freshDb('cms1');
      await seedPublishedAsset(db, 'asset_a_normal');
      const { rows } = await db.client.query(
        `SELECT replaces_content_item_id, previous_storage_key, previous_storage_retention_until
           FROM content_items WHERE id = 'asset_a_normal'`,
      );
      expect(rows[0]).toMatchObject({
        replaces_content_item_id: null,
        previous_storage_key: null,
        previous_storage_retention_until: null,
      });
    });

    it('B. a valid pending replacement (same product, ASSET, DRAFT, replacement pointer populated) is accepted', async () => {
      const db = await freshDb('cms1');
      await seedPublishedAsset(db, 'asset_b_live');
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
         VALUES ('asset_b_pending', 'ai_income_99', 'ASSET', 'pdf', 'Pending Replacement', 'cms/ai_income_99/assets/asset_b_pending.pdf', 2000, 'DRAFT', 'asset_b_live')`,
      );
      const { rows } = await db.client.query(
        `SELECT replaces_content_item_id FROM content_items WHERE id = 'asset_b_pending'`,
      );
      expect(rows[0].replaces_content_item_id).toBe('asset_b_live');
    });

    it('C1. rejects a CONTAINER carrying a replacement pointer (replacement-shape constraint)', async () => {
      const db = await freshDb('cms1');
      await seedPublishedAsset(db, 'asset_c1_live');
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, node_type, title, status, replaces_content_item_id)
           VALUES ('bad_c1_container', 'ai_income_99', 'CONTAINER', 'Broken', 'DRAFT', 'asset_c1_live')`,
        ),
      ).rejects.toThrow();
    });

    it('C2. rejects a PUBLISHED row carrying a replacement pointer (replacement-shape constraint)', async () => {
      const db = await freshDb('cms1');
      await seedPublishedAsset(db, 'asset_c2_live');
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
           VALUES ('bad_c2_published', 'ai_income_99', 'ASSET', 'pdf', 'Broken', 'cms/ai_income_99/assets/bad_c2_published.pdf', 10, 'PUBLISHED', 'asset_c2_live')`,
        ),
      ).rejects.toThrow();
    });

    it('C3. rejects an ARCHIVED row carrying a replacement pointer (replacement-shape constraint)', async () => {
      const db = await freshDb('cms1');
      await seedPublishedAsset(db, 'asset_c3_live');
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, archived_at, replaces_content_item_id)
           VALUES ('bad_c3_archived', 'ai_income_99', 'ASSET', 'pdf', 'Broken', 'cms/ai_income_99/assets/bad_c3_archived.pdf', 10, 'ARCHIVED', now(), 'asset_c3_live')`,
        ),
      ).rejects.toThrow();
    });

    it('C4. rejects a cross-product replacement (replacement-same-product trigger)', async () => {
      const db = await freshDb('cms1');
      await seedPublishedAsset(db, 'asset_c4_live', 'ai_income_99');
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
           VALUES ('bad_c4_cross_product', 'ai_freelancing_499', 'ASSET', 'pdf', 'Broken', 'cms/ai_freelancing_499/assets/bad_c4_cross_product.pdf', 10, 'DRAFT', 'asset_c4_live')`,
        ),
      ).rejects.toThrow(/owning_product_id/);
    });

    it('D. at most one pending replacement per logical asset — the first succeeds, a second fails on the database\'s own uniqueness, not application logic', async () => {
      const db = await freshDb('cms1');
      await seedPublishedAsset(db, 'asset_d_live');
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
         VALUES ('asset_d_pending_1', 'ai_income_99', 'ASSET', 'pdf', 'First Pending', 'cms/ai_income_99/assets/asset_d_pending_1.pdf', 10, 'DRAFT', 'asset_d_live')`,
      );
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
           VALUES ('asset_d_pending_2', 'ai_income_99', 'ASSET', 'pdf', 'Second Pending', 'cms/ai_income_99/assets/asset_d_pending_2.pdf', 10, 'DRAFT', 'asset_d_live')`,
        ),
      ).rejects.toThrow(/duplicate key value violates unique constraint/);
    });

    it('E. valid previous-object retention metadata (key + retention timestamp populated together) is accepted', async () => {
      const db = await freshDb('cms1');
      const retentionUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await db.client.query(
        `INSERT INTO content_items
              (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status,
               previous_storage_key, previous_storage_retention_until)
         VALUES ('asset_e_live', 'ai_income_99', 'ASSET', 'pdf', 'Published After Replacement',
                 'cms/ai_income_99/assets/asset_e_pending.pdf', 2000, 'PUBLISHED',
                 'cms/ai_income_99/assets/asset_e_live.pdf', $1)`,
        [retentionUntil],
      );
      const { rows } = await db.client.query(
        `SELECT previous_storage_key, previous_storage_retention_until FROM content_items WHERE id = 'asset_e_live'`,
      );
      expect(rows[0].previous_storage_key).toBe('cms/ai_income_99/assets/asset_e_live.pdf');
      expect(rows[0].previous_storage_retention_until).not.toBeNull();
    });

    it('F1. rejects previous_storage_key populated with previous_storage_retention_until NULL (previous-storage-consistency constraint)', async () => {
      const db = await freshDb('cms1');
      await expect(
        db.client.query(
          `INSERT INTO content_items
                (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, previous_storage_key)
           VALUES ('bad_f1_key_only', 'ai_income_99', 'ASSET', 'pdf', 'Broken',
                   'cms/ai_income_99/assets/bad_f1_key_only.pdf', 10, 'PUBLISHED', 'cms/ai_income_99/assets/orphan.pdf')`,
        ),
      ).rejects.toThrow();
    });

    it('F2. rejects previous_storage_retention_until populated with previous_storage_key NULL (previous-storage-consistency constraint)', async () => {
      const db = await freshDb('cms1');
      await expect(
        db.client.query(
          `INSERT INTO content_items
                (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, previous_storage_retention_until)
           VALUES ('bad_f2_timestamp_only', 'ai_income_99', 'ASSET', 'pdf', 'Broken',
                   'cms/ai_income_99/assets/bad_f2_timestamp_only.pdf', 10, 'PUBLISHED', now() + interval '30 days')`,
        ),
      ).rejects.toThrow();
    });

    it('G. existing unrelated content (a plain CONTAINER/ASSET hierarchy with none of the new columns) remains valid', async () => {
      const db = await freshDb('cms1');
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, title, status)
         VALUES ('g_chapter', 'ai_freelancing_499', 'CONTAINER', 'Unrelated Chapter', 'DRAFT')`,
      );
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, parent_id, node_type, asset_kind, title, storage_key, bytes, status)
         VALUES ('g_asset', 'ai_freelancing_499', 'g_chapter', 'ASSET', 'video', 'Unrelated Lesson', 'cms/ai_freelancing_499/assets/g_asset.mp4', 5000, 'PUBLISHED')`,
      );
      const { rows } = await db.client.query(`SELECT count(*) AS c FROM content_items WHERE id IN ('g_chapter', 'g_asset')`);
      expect(Number((rows[0] as { c: string }).c)).toBe(2);
    });

    it('H. existing archived content (no replacement/retention fields set) remains valid', async () => {
      const db = await freshDb('cms1');
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, title, status, archived_at)
         VALUES ('h_archived_container', 'ai_income_99', 'CONTAINER', 'Archived Chapter', 'ARCHIVED', now())`,
      );
      const { rows } = await db.client.query(`SELECT status FROM content_items WHERE id = 'h_archived_container'`);
      expect(rows[0].status).toBe('ARCHIVED');
    });

    it('I. existing parent/child plan invariants (migration 0062 trigger) remain enforced alongside the new replacement trigger', async () => {
      const db = await freshDb('cms1');
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, title, status)
         VALUES ('i_plus_chapter', 'ai_income_99', 'CONTAINER', 'Plus Chapter', 'DRAFT')`,
      );
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, parent_id, node_type, asset_kind, title, storage_key, bytes, status)
           VALUES ('i_pro_asset_under_plus', 'ai_freelancing_499', 'i_plus_chapter', 'ASSET', 'pdf', 'Mismatched', 'x.pdf', 10, 'DRAFT')`,
        ),
      ).rejects.toThrow();
    });

    it('a live asset cannot be deleted while a pending replacement still references it (ON DELETE RESTRICT)', async () => {
      const db = await freshDb('cms1');
      await seedPublishedAsset(db, 'asset_restrict_live');
      await db.client.query(
        `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
         VALUES ('asset_restrict_pending', 'ai_income_99', 'ASSET', 'pdf', 'Pending', 'cms/ai_income_99/assets/asset_restrict_pending.pdf', 10, 'DRAFT', 'asset_restrict_live')`,
      );
      await expect(
        db.client.query(`DELETE FROM content_items WHERE id = 'asset_restrict_live'`),
      ).rejects.toThrow();
    });

    it('rejects a row that claims to replace itself (not-self-replacement constraint)', async () => {
      const db = await freshDb('cms1');
      await expect(
        db.client.query(
          `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status, replaces_content_item_id)
           VALUES ('asset_self_replace', 'ai_income_99', 'ASSET', 'pdf', 'Broken', 'cms/ai_income_99/assets/asset_self_replace.pdf', 10, 'DRAFT', 'asset_self_replace')`,
        ),
      ).rejects.toThrow();
    });
  });
});

describe('convertLinkedCmsEntitlementsToSubscriptionPeriods — live, per-signup 30-day conversion (FINAL PRODUCT RULE: no non-expiring Plus/Pro purchase path)', () => {
  it('a newly-linked Plus entitlement converts to an ACTIVE 30-day subscription_periods row', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'live-plus');
    const grantedAt = new Date(Date.now() - 1 * DAY_MS); // purchased yesterday
    await seedLegacyEntitlement(db, {
      suffix: 'live-plus',
      productSlug: 'ai_income_99',
      userId, // already "linked" — mirrors post-linkEntitlementsToUser state
      grantedAt,
    });

    const insertedCount = await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);
    expect(insertedCount).toBe(1);

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const active = await subscriptionPeriods.findActiveForUser(userId, 'ai_income_99', new Date());
    expect(active).not.toBeNull();
    expect(active?.durationDays).toBe(30);
    expect(active?.activationAt.getTime()).toBe(grantedAt.getTime());
    // Distinguishable from migration 0063's historical-backfill rows.
    expect(active?.razorpaySubscriptionId).toMatch(/^onetime-order:/);

    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted).toEqual(new Set(['ai_income_99']));
  });

  it('a newly-linked Pro entitlement converts to an ACTIVE 30-day subscription_periods row', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'live-pro');
    await seedLegacyEntitlement(db, {
      suffix: 'live-pro',
      productSlug: 'ai_freelancing_499',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });

    const insertedCount = await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);
    expect(insertedCount).toBe(1);

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted).toEqual(new Set(['ai_freelancing_499']));
  });

  it('does NOT create perpetual/non-expiring canonical access — a purchase from 40 days ago converts straight to EXPIRED', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'live-old-plus');
    await seedLegacyEntitlement(db, {
      suffix: 'live-old-plus',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 40 * DAY_MS),
    });

    await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const active = await subscriptionPeriods.findActiveForUser(userId, 'ai_income_99', new Date());
    expect(active).toBeNull();
    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted.size).toBe(0);
  });

  it('is idempotent — calling it twice for the same user (e.g. a retried signup) inserts no duplicate period', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'live-idempotent');
    await seedLegacyEntitlement(db, {
      suffix: 'live-idempotent',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });

    const first = await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);
    const second = await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);
    expect(first).toBe(1);
    expect(second).toBe(0);

    const { rows } = await db.client.query(
      `SELECT count(*) AS c FROM subscription_periods WHERE user_id = $1`,
      [userId],
    );
    expect(Number((rows[0] as { c: string }).c)).toBe(1);
  });

  it('converts both Plus and Pro in one call when an existing account links a second product (the "existing-account" signup branch)', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'live-both');
    await seedLegacyEntitlement(db, {
      suffix: 'live-both-plus',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });
    await seedLegacyEntitlement(db, {
      suffix: 'live-both-pro',
      productSlug: 'ai_freelancing_499',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });

    const insertedCount = await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);
    expect(insertedCount).toBe(2);

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted).toEqual(new Set(['ai_income_99', 'ai_freelancing_499']));
  });

  it('a different user is unaffected (scoped strictly by user_id)', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'live-scope-a');
    const otherUserId = await seedUser(db, 'live-scope-b');
    await seedLegacyEntitlement(db, {
      suffix: 'live-scope-a',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });

    const insertedForOther = await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, otherUserId);
    expect(insertedForOther).toBe(0);

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    expect((await permittedContentPlans({ subscriptionPeriods }, otherUserId)).size).toBe(0);
    expect((await permittedContentPlans({ subscriptionPeriods }, userId)).size).toBe(0); // not yet converted for userId either
  });
});

async function runCleanup(db: TempDatabase): Promise<number> {
  const { rows } = await db.client.query(`SELECT deleted_count FROM retire_legacy_plus_pro_entitlements()`);
  return Number((rows[0] as { deleted_count: string | number }).deleted_count);
}

describe('retire_legacy_plus_pro_entitlements — migration 0064 cleanup (FINAL PRODUCT RULE: no legacy perpetual-access data retained in dev)', () => {
  it('deletes a CLAIMED, already-converted Plus entitlement', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'cleanup-plus');
    const { entitlementId } = await seedLegacyEntitlement(db, {
      suffix: 'cleanup-plus',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });
    await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);

    const deletedCount = await runCleanup(db);
    expect(deletedCount).toBe(1);

    const { rows } = await db.client.query(`SELECT 1 FROM entitlements WHERE id = $1`, [entitlementId]);
    expect(rows).toHaveLength(0);
  });

  it('deletes a CLAIMED, already-converted Pro entitlement', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'cleanup-pro');
    const { entitlementId } = await seedLegacyEntitlement(db, {
      suffix: 'cleanup-pro',
      productSlug: 'ai_freelancing_499',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });
    await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);

    const deletedCount = await runCleanup(db);
    expect(deletedCount).toBe(1);

    const { rows } = await db.client.query(`SELECT 1 FROM entitlements WHERE id = $1`, [entitlementId]);
    expect(rows).toHaveLength(0);
  });

  it('does NOT delete an UNCLAIMED Plus/Pro entitlement (user_id IS NULL — a still-pending claim)', async () => {
    const db = await freshDb('cms1');
    const { entitlementId } = await seedLegacyEntitlement(db, {
      suffix: 'cleanup-unclaimed',
      productSlug: 'ai_income_99',
      userId: null,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });

    const deletedCount = await runCleanup(db);
    expect(deletedCount).toBe(0);

    const { rows } = await db.client.query(`SELECT 1 FROM entitlements WHERE id = $1`, [entitlementId]);
    expect(rows).toHaveLength(1);
  });

  it('does NOT delete a claimed Plus/Pro entitlement that was never converted (no matching subscription_periods row)', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'cleanup-unconverted');
    const { entitlementId } = await seedLegacyEntitlement(db, {
      suffix: 'cleanup-unconverted',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });
    // Deliberately NOT calling convertLinkedCmsEntitlementsToSubscriptionPeriods.

    const deletedCount = await runCleanup(db);
    expect(deletedCount).toBe(0);

    const { rows } = await db.client.query(`SELECT 1 FROM entitlements WHERE id = $1`, [entitlementId]);
    expect(rows).toHaveLength(1);
  });

  it('does NOT delete a revoked Plus/Pro entitlement (never converted either, left as historical refund evidence)', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'cleanup-revoked');
    const { entitlementId } = await seedLegacyEntitlement(db, {
      suffix: 'cleanup-revoked',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
      revoked: true,
    });

    const deletedCount = await runCleanup(db);
    expect(deletedCount).toBe(0);

    const { rows } = await db.client.query(`SELECT 1 FROM entitlements WHERE id = $1`, [entitlementId]);
    expect(rows).toHaveLength(1);
  });

  it('does NOT touch the retired one-time ai_client_acquisition_1499 SKU entitlement, Max subscription_periods, or unrelated entitlements', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'cleanup-unrelated');

    // An unrelated, non-CMS retired-SKU entitlement for the same user.
    await db.client.query(
      `INSERT INTO orders (id, razorpay_order_id, customer_email, product_slug, product_name, amount_paise, currency, status, updated_at)
       VALUES ('order_retired', 'rzp_order_retired', 'buyer_cleanup-unrelated@example.test', 'ai_client_acquisition_1499', 'AI Client Acquisition System', 149900, 'INR', 'PAID', now())`,
    );
    await db.client.query(
      `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise, currency, status, updated_at)
       VALUES ('pay_retired', 'rzp_pay_retired', 'order_retired', 149900, 'INR', 'CAPTURED', now())`,
    );
    const retiredEntitlementId = 'ent_retired';
    await db.client.query(
      `INSERT INTO entitlements (id, customer_email, product_slug, order_id, granted_at, user_id, updated_at)
       VALUES ($1, 'buyer_cleanup-unrelated@example.test', 'ai_client_acquisition_1499', 'order_retired', now(), $2, now())`,
      [retiredEntitlementId, userId],
    );

    // A Max subscription_periods row for the same user.
    await db.client.query(
      `INSERT INTO subscription_periods (id, user_id, product_slug, razorpay_subscription_id, razorpay_payment_id, activation_at, duration_days, updated_at)
       VALUES ('sp_max_unrelated', $1, 'ai_client_acquisition_1499_subscription', 'sub_unrelated', 'pay_sub_unrelated', now(), 30, now())`,
      [userId],
    );

    // Plus the cleanup target itself, so this test proves selectivity, not just absence of collateral damage.
    await seedLegacyEntitlement(db, {
      suffix: 'cleanup-unrelated',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });
    await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);

    const deletedCount = await runCleanup(db);
    expect(deletedCount).toBe(1); // only the Plus row

    const { rows: retiredRows } = await db.client.query(`SELECT 1 FROM entitlements WHERE id = $1`, [
      retiredEntitlementId,
    ]);
    expect(retiredRows).toHaveLength(1);

    const { rows: maxRows } = await db.client.query(`SELECT 1 FROM subscription_periods WHERE id = 'sp_max_unrelated'`);
    expect(maxRows).toHaveLength(1);
  });

  it('preserves orders and payments for the deleted entitlement', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'cleanup-history');
    await seedLegacyEntitlement(db, {
      suffix: 'cleanup-history',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });
    await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);

    await runCleanup(db);

    const { rows: orderRows } = await db.client.query(`SELECT status FROM orders WHERE id = 'order_cleanup-history'`);
    expect(orderRows).toHaveLength(1);
    const { rows: paymentRows } = await db.client.query(
      `SELECT status FROM payments WHERE order_id = 'order_cleanup-history'`,
    );
    expect(paymentRows).toHaveLength(1);
    expect((paymentRows[0] as { status: string }).status).toBe('CAPTURED');
  });

  it('is idempotent — rerunning deletes nothing further and raises no error', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'cleanup-idempotent');
    await seedLegacyEntitlement(db, {
      suffix: 'cleanup-idempotent',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS),
    });
    await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);

    const first = await runCleanup(db);
    const second = await runCleanup(db);
    expect(first).toBe(1);
    expect(second).toBe(0);
  });

  it('after cleanup, canonical access still comes from subscription_periods alone — the deleted entitlement is not required for ongoing access', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'cleanup-still-active');
    await seedLegacyEntitlement(db, {
      suffix: 'cleanup-still-active',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 1 * DAY_MS), // still within 30 days
    });
    await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);
    await runCleanup(db);

    const { rows } = await db.client.query(`SELECT count(*) AS c FROM entitlements WHERE user_id = $1`, [userId]);
    expect(Number((rows[0] as { c: string }).c)).toBe(0); // entitlement is gone

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted).toEqual(new Set(['ai_income_99'])); // access still correctly granted
  });

  it('after cleanup, an EXPIRED subscription correctly denies access even though the entitlement is also gone', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'cleanup-now-expired');
    await seedLegacyEntitlement(db, {
      suffix: 'cleanup-now-expired',
      productSlug: 'ai_income_99',
      userId,
      grantedAt: new Date(Date.now() - 40 * DAY_MS), // already stale
    });
    await convertLinkedCmsEntitlementsToSubscriptionPeriods(db.client, userId);
    await runCleanup(db);

    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted.size).toBe(0);
  });
});

describe('cms_admins (migration 0065, CMS-PO-006(R3)) — real Postgres-backed admin authorization', () => {
  it('findByUserId returns null for a user with no membership row', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'admin-none');
    const cmsAdmins = createPgCmsAdminRepository(db.client);

    expect(await cmsAdmins.findByUserId(userId)).toBeNull();
    await expect(requireCmsAdmin({ cmsAdmins }, userId)).rejects.toBeInstanceOf(NotCmsAdminError);
  });

  it('a row inserted directly (modeling trusted-operator provisioning) grants requireCmsAdmin, and deleting it revokes it', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'admin-granted');
    const cmsAdmins = createPgCmsAdminRepository(db.client);

    // This migration itself inserts no rows; provisioning is an
    // operator's own direct database action, modeled here as a plain
    // INSERT rather than through any application write path (none
    // exists this phase).
    await db.client.query(`INSERT INTO cms_admins (user_id, created_by) VALUES ($1, $2)`, [
      userId,
      'operator-test',
    ]);

    const admin = await requireCmsAdmin({ cmsAdmins }, userId);
    expect(admin.userId).toBe(userId);
    expect(admin.createdBy).toBe('operator-test');

    await db.client.query(`DELETE FROM cms_admins WHERE user_id = $1`, [userId]);

    await expect(requireCmsAdmin({ cmsAdmins }, userId)).rejects.toBeInstanceOf(NotCmsAdminError);
  });

  it('database uniqueness prevents duplicate membership for the same user', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'admin-dup');

    await db.client.query(`INSERT INTO cms_admins (user_id) VALUES ($1)`, [userId]);

    await expect(db.client.query(`INSERT INTO cms_admins (user_id) VALUES ($1)`, [userId])).rejects.toThrow(
      /duplicate key value violates unique constraint/,
    );
  });

  it('an active Max subscription does not, by itself, satisfy requireCmsAdmin', async () => {
    const db = await freshDb('cms1');
    const userId = await seedUser(db, 'admin-max-subscriber');
    await db.client.query(
      `INSERT INTO subscription_periods
            (id, user_id, product_slug, razorpay_subscription_id, razorpay_payment_id, activation_at, duration_days)
       VALUES (gen_random_uuid()::text, $1, 'ai_client_acquisition_1499_subscription', 'sub_test', 'pay_test', now(), 30)`,
      [userId],
    );
    const cmsAdmins = createPgCmsAdminRepository(db.client);

    await expect(requireCmsAdmin({ cmsAdmins }, userId)).rejects.toBeInstanceOf(NotCmsAdminError);
  });
});

describe('content_item_obsolete_objects schema (migration 0067, CMS-PO-010(R2)) — no application consumer yet, constraints only', () => {
  async function seedLiveAsset(db: TempDatabase, id: string) {
    await db.client.query(
      `INSERT INTO content_items (id, owning_product_id, node_type, asset_kind, title, storage_key, bytes, status)
       VALUES ($1, 'ai_income_99', 'ASSET', 'pdf', 'Live Asset', $2, 1000, 'PUBLISHED')`,
      [id, `cms/ai_income_99/assets/${id}.pdf`],
    );
  }

  it('1. records one obsolete object for a logical asset', async () => {
    const db = await freshDb('obs1');
    await seedLiveAsset(db, 'obs1_live');
    await db.client.query(
      `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
       VALUES ('obs1_live', 'cms/ai_income_99/assets/obs1_v1.pdf', now() + interval '30 days')`,
    );
    const { rows } = await db.client.query(
      `SELECT count(*) AS c FROM content_item_obsolete_objects WHERE content_item_id = 'obs1_live'`,
    );
    expect(Number((rows[0] as { c: string }).c)).toBe(1);
  });

  it('2/3/7/8. multiple obsolete objects for the SAME logical asset coexist, each with its own retention deadline -- a second (or third) replacement never overwrites an earlier retention record', async () => {
    const db = await freshDb('obs2');
    await seedLiveAsset(db, 'obs2_live');
    await db.client.query(
      `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
       VALUES ('obs2_live', 'cms/ai_income_99/assets/obs2_v1.pdf', now() + interval '30 days')`,
    );
    await db.client.query(
      `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
       VALUES ('obs2_live', 'cms/ai_income_99/assets/obs2_v2.pdf', now() + interval '20 days')`,
    );
    await db.client.query(
      `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
       VALUES ('obs2_live', 'cms/ai_income_99/assets/obs2_v3.pdf', now() + interval '10 days')`,
    );

    const { rows } = await db.client.query(
      `SELECT storage_key, retention_until FROM content_item_obsolete_objects
        WHERE content_item_id = 'obs2_live' ORDER BY retention_until`,
    );
    expect(rows).toHaveLength(3); // all three coexist -- no overwrite
    expect((rows as { storage_key: string }[]).map((r) => r.storage_key)).toEqual([
      'cms/ai_income_99/assets/obs2_v3.pdf',
      'cms/ai_income_99/assets/obs2_v2.pdf',
      'cms/ai_income_99/assets/obs2_v1.pdf',
    ]); // each retains its OWN, independent deadline
  });

  it('5/6. retention_until correctly distinguishes not-yet-eligible from eligible-for-cleanup objects', async () => {
    const db = await freshDb('obs3');
    await seedLiveAsset(db, 'obs3_live');
    await db.client.query(
      `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
       VALUES ('obs3_live', 'cms/ai_income_99/assets/obs3_not_yet.pdf', now() + interval '30 days')`,
    );
    await db.client.query(
      `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
       VALUES ('obs3_live', 'cms/ai_income_99/assets/obs3_eligible.pdf', now() - interval '1 day')`,
    );

    const { rows } = await db.client.query(
      `SELECT storage_key FROM content_item_obsolete_objects WHERE retention_until <= now() AND content_item_id = 'obs3_live'`,
    );
    expect(rows).toEqual([{ storage_key: 'cms/ai_income_99/assets/obs3_eligible.pdf' }]);
  });

  it('rejects a NULL content_item_id, storage_key, or retention_until', async () => {
    const db = await freshDb('obs4');
    await seedLiveAsset(db, 'obs4_live');
    await expect(
      db.client.query(
        `INSERT INTO content_item_obsolete_objects (storage_key, retention_until) VALUES ('x', now())`,
      ),
    ).rejects.toThrow();
    await expect(
      db.client.query(
        `INSERT INTO content_item_obsolete_objects (content_item_id, retention_until) VALUES ('obs4_live', now())`,
      ),
    ).rejects.toThrow();
    await expect(
      db.client.query(
        `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key) VALUES ('obs4_live', 'x')`,
      ),
    ).rejects.toThrow();
  });

  it('rejects a content_item_id that does not exist (FK)', async () => {
    const db = await freshDb('obs5');
    await expect(
      db.client.query(
        `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
         VALUES ('does-not-exist', 'x', now())`,
      ),
    ).rejects.toThrow();
  });

  it('rejects a duplicate storage_key (unique constraint -- every generated key is globally unique by construction)', async () => {
    const db = await freshDb('obs6');
    await seedLiveAsset(db, 'obs6_live_a');
    await seedLiveAsset(db, 'obs6_live_b');
    await db.client.query(
      `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
       VALUES ('obs6_live_a', 'cms/ai_income_99/assets/obs6_shared.pdf', now() + interval '30 days')`,
    );
    await expect(
      db.client.query(
        `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
         VALUES ('obs6_live_b', 'cms/ai_income_99/assets/obs6_shared.pdf', now() + interval '30 days')`,
      ),
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });

  it('a live asset cannot be deleted while an obsolete-object record still references it (ON DELETE RESTRICT)', async () => {
    const db = await freshDb('obs7');
    await seedLiveAsset(db, 'obs7_live');
    await db.client.query(
      `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
       VALUES ('obs7_live', 'cms/ai_income_99/assets/obs7_v1.pdf', now() + interval '30 days')`,
    );
    await expect(db.client.query(`DELETE FROM content_items WHERE id = 'obs7_live'`)).rejects.toThrow();
  });

  it('12. the retention_until and content_item_id indexes exist, supporting the future cleanup job\'s queries', async () => {
    const db = await freshDb('obs8');
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'content_item_obsolete_objects'`,
    );
    const names = (rows as { indexname: string }[]).map((r) => r.indexname);
    expect(names).toContain('content_item_obsolete_objects_retention_until_idx');
    expect(names).toContain('content_item_obsolete_objects_content_item_id_idx');
    const { rows: ciIndexRows } = await db.client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'content_items' AND indexname = 'content_items_storage_key_idx'`,
    );
    expect(ciIndexRows).toHaveLength(1);
  });

  it('migration 0066\'s previous_storage_key/previous_storage_retention_until columns remain present and unmodified (left unused-but-retained, not removed)', async () => {
    const db = await freshDb('obs9');
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'content_items'
          AND column_name IN ('previous_storage_key', 'previous_storage_retention_until')`,
    );
    expect(rows).toHaveLength(2);
  });

  // NOTE: tests 9/10/11 from the Part 9 test plan (failed publish leaves
  // no orphan row / leaves the current asset unchanged / leaves the
  // pending replacement intact) are NOT included here. They exercise
  // publishReplacementTransaction's atomicity, which is application code
  // this migration-only phase deliberately does not touch yet -- writing
  // them now would mean testing code that doesn't exist. They belong to
  // the phase that wires this table into that transaction.
});

describe('cms_asset_upload_sessions schema (migration 0068, CMS-PO-010(R2)-G) — no application consumer yet, constraints only', () => {
  // DESIGN + MIGRATION PHASE ONLY: requestAssetUploadAuthorization()/
  // completeAssetUpload() (assetIngestionService.ts) and the
  // abandoned-upload cleanup job (apps/worker's cmsCleanup module) do
  // not read or write this table yet -- these tests exercise the schema
  // itself (constraints/indexes/query shape) against a real, throwaway
  // Postgres database, never acos_dev. Wiring tests belong to the phase
  // that actually reads/writes through this table from application code.

  it('1. records one upload-session row with id/storage_key/owning_product_id, and defaults created_at without the caller supplying one', async () => {
    const db = await freshDb('ups1');
    await db.client.query(
      `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id)
       VALUES ('ups1_session', 'cms/ai_income_99/assets/ups1_session.pdf', 'ai_income_99')`,
    );
    const { rows } = await db.client.query(
      `SELECT id, storage_key, owning_product_id, created_at,
              (created_at <= now() AND created_at >= now() - interval '1 minute') AS created_recently
         FROM cms_asset_upload_sessions WHERE id = 'ups1_session'`,
    );
    expect(rows).toHaveLength(1);
    const row = rows[0] as {
      id: string;
      storage_key: string;
      owning_product_id: string;
      created_at: Date;
      created_recently: boolean;
    };
    expect(row.storage_key).toBe('cms/ai_income_99/assets/ups1_session.pdf');
    expect(row.owning_product_id).toBe('ai_income_99');
    expect(row.created_at).toBeInstanceOf(Date);
    // Compared entirely in SQL (server-clock-relative), never against the
    // test process's own Date.now() -- the two clocks need not agree on
    // timezone/offset for this assertion to be meaningful.
    expect(row.created_recently).toBe(true);
  });

  it('rejects a NULL id, storage_key, or owning_product_id', async () => {
    const db = await freshDb('ups2');
    await expect(
      db.client.query(
        `INSERT INTO cms_asset_upload_sessions (storage_key, owning_product_id) VALUES ('x', 'ai_income_99')`,
      ),
    ).rejects.toThrow();
    await expect(
      db.client.query(`INSERT INTO cms_asset_upload_sessions (id, owning_product_id) VALUES ('ups2_a', 'ai_income_99')`),
    ).rejects.toThrow();
    await expect(
      db.client.query(`INSERT INTO cms_asset_upload_sessions (id, storage_key) VALUES ('ups2_b', 'x')`),
    ).rejects.toThrow();
  });

  it('rejects a duplicate id (primary key)', async () => {
    const db = await freshDb('ups3');
    await db.client.query(
      `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id)
       VALUES ('ups3_session', 'cms/ai_income_99/assets/ups3_a.pdf', 'ai_income_99')`,
    );
    await expect(
      db.client.query(
        `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id)
         VALUES ('ups3_session', 'cms/ai_income_99/assets/ups3_b.pdf', 'ai_income_99')`,
      ),
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });

  it('rejects a duplicate storage_key (unique constraint -- every generated key is globally unique by construction)', async () => {
    const db = await freshDb('ups4');
    await db.client.query(
      `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id)
       VALUES ('ups4_a', 'cms/ai_income_99/assets/ups4_shared.pdf', 'ai_income_99')`,
    );
    await expect(
      db.client.query(
        `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id)
         VALUES ('ups4_b', 'cms/ai_income_99/assets/ups4_shared.pdf', 'ai_income_99')`,
      ),
    ).rejects.toThrow(/duplicate key value violates unique constraint/);
  });

  it('has NO foreign key to content_items -- a storage_key naming a content_items row that does not (yet) exist is a normal, valid state', async () => {
    const db = await freshDb('ups5');
    // The whole point of this table: an upload session is authorized
    // BEFORE any content_items row exists for it. This must succeed.
    await expect(
      db.client.query(
        `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id)
         VALUES ('ups5_session', 'cms/ai_income_99/assets/ups5_session.pdf', 'ai_income_99')`,
      ),
    ).resolves.toBeDefined();
  });

  it('the abandoned-upload cleanup job\'s retention-age query (created_at <= now() - 24h) distinguishes eligible from not-yet-eligible sessions', async () => {
    const db = await freshDb('ups6');
    await db.client.query(
      `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id, created_at)
       VALUES ('ups6_old', 'cms/ai_income_99/assets/ups6_old.pdf', 'ai_income_99', now() - interval '25 hours')`,
    );
    await db.client.query(
      `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id, created_at)
       VALUES ('ups6_recent', 'cms/ai_income_99/assets/ups6_recent.pdf', 'ai_income_99', now() - interval '1 hour')`,
    );

    const { rows } = await db.client.query(
      `SELECT id FROM cms_asset_upload_sessions WHERE created_at <= now() - interval '24 hours'`,
    );
    expect(rows).toEqual([{ id: 'ups6_old' }]);
  });

  it('the created_at index exists, supporting the abandoned-upload cleanup job\'s query', async () => {
    const db = await freshDb('ups7');
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'cms_asset_upload_sessions'`,
    );
    const names = (rows as { indexname: string }[]).map((r) => r.indexname);
    expect(names).toContain('cms_asset_upload_sessions_created_at_idx');
    expect(names).toContain('cms_asset_upload_sessions_pkey');
  });

  it('deleting the row (consumption by completion or cleanup) leaves no trace and no error on a second delete', async () => {
    const db = await freshDb('ups8');
    await db.client.query(
      `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id)
       VALUES ('ups8_session', 'cms/ai_income_99/assets/ups8_session.pdf', 'ai_income_99')`,
    );
    await db.client.query(`DELETE FROM cms_asset_upload_sessions WHERE id = 'ups8_session'`);
    const { rows } = await db.client.query(`SELECT id FROM cms_asset_upload_sessions WHERE id = 'ups8_session'`);
    expect(rows).toEqual([]);
    await expect(
      db.client.query(`DELETE FROM cms_asset_upload_sessions WHERE id = 'ups8_session'`),
    ).resolves.toBeDefined(); // idempotent -- affects 0 rows, never an error
  });

  it('migrations 0066 and 0067 remain unmodified by this migration', async () => {
    const db = await freshDb('ups9');
    const { rows: obsoleteTableRows } = await db.client.query(
      `SELECT indexname FROM pg_indexes WHERE tablename = 'content_item_obsolete_objects'`,
    );
    const obsoleteIndexNames = (obsoleteTableRows as { indexname: string }[]).map((r) => r.indexname);
    expect(obsoleteIndexNames).toContain('content_item_obsolete_objects_retention_until_idx');
    expect(obsoleteIndexNames).toContain('content_item_obsolete_objects_content_item_id_idx');

    const { rows: replacementColumnRows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns
        WHERE table_name = 'content_items'
          AND column_name IN ('previous_storage_key', 'previous_storage_retention_until', 'replaces_content_item_id')`,
    );
    expect(replacementColumnRows).toHaveLength(3);
  });
});

describe('CMS-PO-010(R3) — ordinary archive/reactivation regression: a real ASSET\'s physical storage_key survives both transitions unchanged', () => {
  it('ARCHIVED leaves storage_key/asset_kind/bytes untouched, creates no obsolete-object row, and hides the asset from an entitled customer; PUBLISHED again restores customer access on the SAME storage_key', async () => {
    const db = await freshDb('r3archive');
    const userId = await seedUser(db, 'r3-archive-customer');
    // A real, active ai_income_99 entitlement -- the same direct
    // subscription_periods insert this file's own Max test above uses,
    // just for ai_income_99 instead.
    await db.client.query(
      `INSERT INTO subscription_periods (id, user_id, product_slug, razorpay_subscription_id,
                                         razorpay_payment_id, activation_at, duration_days, updated_at)
       VALUES ($1, $2, 'ai_income_99', $3, $4, $5, 30, now())`,
      ['sp_r3_archive', userId, 'sub_r3_archive', 'pay_r3_archive', new Date(Date.now() - 1 * DAY_MS)],
    );
    const subscriptionPeriods = createPgSubscriptionPeriodRepository(db.client);
    const permitted = await permittedContentPlans({ subscriptionPeriods }, userId);
    expect(permitted.has('ai_income_99')).toBe(true);

    const contentItems = createPgContentItemRepository(db.client);
    const originalStorageKey = 'cms/ai_income_99/assets/r3-archive-regression.pdf';
    const created = await createAsset(
      { contentItems },
      {
        owningProductId: 'ai_income_99',
        parentId: null,
        title: 'R3 Archive Regression Asset',
        assetKind: 'pdf',
        storageKey: originalStorageKey,
        bytes: '1234',
      },
    );
    await setLifecycleStatus({ contentItems }, created.id, 'PUBLISHED');

    // Sanity: entitled customer can see it while PUBLISHED, before the
    // archive step this test actually exercises.
    const beforeArchive = await getPublishedContentItemForPlans({ contentItems }, created.id, permitted);
    expect(beforeArchive?.storageKey).toBe(originalStorageKey);

    // STEP 1 -- ARCHIVE, through the real existing lifecycle path
    // (contentService.ts's archiveContentItem, the exact function
    // POST /api/cms/admin/content/[id]/status calls).
    const archived = await archiveContentItem({ contentItems }, created.id);
    expect(archived.status).toBe('ARCHIVED');
    expect(archived.archivedAt).not.toBeNull();
    expect(archived.storageKey).toBe(originalStorageKey); // EXACTLY unchanged
    expect(archived.assetKind).toBe('pdf');
    expect(archived.bytes).toBe('1234');

    const { rows: obsoleteAfterArchive } = await db.client.query(
      `SELECT 1 FROM content_item_obsolete_objects WHERE content_item_id = $1`,
      [created.id],
    );
    expect(obsoleteAfterArchive).toHaveLength(0); // CMS-PO-010(R3): ordinary archive creates no bookkeeping row

    // Customer access is gone while ARCHIVED -- same entitlement, same
    // id, now invisible (getPublishedContentItemForPlans returns null
    // for anything that is not currently PUBLISHED).
    const whileArchived = await getPublishedContentItemForPlans({ contentItems }, created.id, permitted);
    expect(whileArchived).toBeNull();

    // STEP 2 -- REACTIVATE (ARCHIVED -> PUBLISHED), through the same
    // real lifecycle path.
    const reactivated = await setLifecycleStatus({ contentItems }, created.id, 'PUBLISHED');
    expect(reactivated.status).toBe('PUBLISHED');
    expect(reactivated.archivedAt).toBeNull();
    expect(reactivated.id).toBe(created.id); // same logical content item, never recreated
    expect(reactivated.storageKey).toBe(originalStorageKey); // EXACTLY the original value

    const { rows: obsoleteAfterReactivate } = await db.client.query(
      `SELECT 1 FROM content_item_obsolete_objects WHERE content_item_id = $1`,
      [created.id],
    );
    expect(obsoleteAfterReactivate).toHaveLength(0); // still none -- reactivation creates no bookkeeping either

    // The same entitled customer can access/download it again, on the
    // physical object that was never touched throughout either
    // transition.
    const afterReactivate = await getPublishedContentItemForPlans({ contentItems }, created.id, permitted);
    expect(afterReactivate?.storageKey).toBe(originalStorageKey);
  });
});
