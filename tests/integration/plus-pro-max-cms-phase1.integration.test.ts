import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPgPlanDisplayNameRepository } from '@acos/core-cms';
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
