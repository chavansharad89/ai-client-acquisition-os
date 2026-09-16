import { randomUUID } from 'node:crypto';

import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import {
  ACCESS_TOKEN_TTL_MS,
  authorizeDownload,
  createDownloadGrant,
  createPgEntitlementRepository,
  hashAccessToken,
  mintAccessToken,
  resolveAccess,
  type EntitlementRepository,
} from '@acos/core-entitlements';

import { isValidProductId } from '@acos/catalog';

import { seedCapturedPayment, seedOrder } from '../fixtures/idempotency-duplicates';
import { suiteDatabase } from './support/suiteDb';

// Digital delivery — real PostgreSQL.
// -----------------------------------------------------------------------
// Covers the path the requirement names: order -> entitlement -> access,
// and every way that path must NOT be walkable. The triggers from
// migration 0004 are exercised here, not mocked: an entitlement cannot
// exist without a captured payment, and cannot name a product or customer
// its order did not.
// -----------------------------------------------------------------------

const suite = suiteDatabase('entitle');
const SECRET = 'integration-download-secret';
const STARTER = 'ai_income_99';
const LAUNCH = 'ai_freelancing_499';
const SYSTEM = 'ai_client_acquisition_1499';
const ASSET = 'starter-prompt-library';

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function repository(): EntitlementRepository {
  return createPgEntitlementRepository(suite.require().db.client);
}

/** A paid order for `productSlug`, returning the order id and buyer email. */
async function paidOrder(
  productSlug: string,
  suffix: string,
): Promise<{ orderId: string; email: string }> {
  const { db, context } = suite.require();
  const orderId = await seedOrder(db.client, context, suffix);
  await db.client.query(`UPDATE orders SET product_slug = $2 WHERE id = $1`, [
    orderId,
    productSlug,
  ]);
  await seedCapturedPayment(db.client, context, orderId, suffix);
  const { rows } = await db.client.query(`SELECT customer_email FROM orders WHERE id = $1`, [
    orderId,
  ]);
  return { orderId, email: String(rows[0].customer_email).toLowerCase() };
}

async function issueToken(email: string): Promise<string> {
  const minted = mintAccessToken(new Date());
  await repository().saveAccessToken({
    tokenHash: minted.tokenHash,
    customerEmail: email,
    expiresAt: minted.expiresAt,
    now: new Date(),
  });
  return minted.token;
}

describe('order -> entitlement -> access', () => {
  it('a paid order becomes an entitlement, and that entitlement opens the product', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'flow');
    const repo = repository();

    const grant = await repo.grant(
      { customerEmail: email, productSlug: STARTER, orderId },
      new Date(),
    );
    expect(grant.outcome).toBe('granted');

    const token = await issueToken(email);
    const access = await resolveAccess(repo, token);

    expect(access.granted).toBe(true);
    if (!access.granted) return;
    expect(access.funnel.accessible).toEqual([STARTER]);
  });

  it('the top tier unlocks every lower kit from one purchase', async () => {
    const { orderId, email } = await paidOrder(SYSTEM, 'toptier');
    const repo = repository();
    await repo.grant({ customerEmail: email, productSlug: SYSTEM, orderId }, new Date());

    const access = await resolveAccess(repo, await issueToken(email));
    expect(access.granted && access.funnel.accessible).toEqual([STARTER, LAUNCH, SYSTEM]);
  });
});

describe('access is never granted by the browser', () => {
  it('no cookie means no entitlement, even for a real paying customer', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'nocookie');
    const repo = repository();
    await repo.grant({ customerEmail: email, productSlug: STARTER, orderId }, new Date());

    for (const claim of [undefined, null, '', 'localStorage-says-i-paid']) {
      const access = await resolveAccess(repo, claim);
      expect(access.granted, String(claim)).toBe(false);
      expect(access.funnel.accessible).toEqual([]);
    }
  });

  it('a forged token that is not in the database grants nothing', async () => {
    const { orderId, email } = await paidOrder(SYSTEM, 'forged');
    const repo = repository();
    await repo.grant({ customerEmail: email, productSlug: SYSTEM, orderId }, new Date());

    expect((await resolveAccess(repo, mintAccessToken().token)).granted).toBe(false);
  });

  it('only the hash is stored — the database never holds a usable token', async () => {
    const { email } = await paidOrder(STARTER, 'hashonly');
    const token = await issueToken(email);
    const { db } = suite.require();

    // Scoped to the token this test minted. `seedOrder` writes a constant
    // customer_email for every order, and access_tokens has no order_id
    // so cleanup cannot scope it — rows accumulate across the suite, and
    // an unordered `rows[0]` returned whichever token an earlier test had
    // left behind.
    const { rows } = await db.client.query(
      `SELECT token_hash FROM access_tokens
        WHERE customer_email = $1 AND token_hash = $2`,
      [email, hashAccessToken(token)],
    );
    // The hash IS in the table, exactly once...
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe(token);

    const { rows: leaked } = await db.client.query(
      `SELECT count(*)::int AS n FROM access_tokens WHERE token_hash = $1`,
      [token],
    );
    expect(leaked[0].n).toBe(0);
  });

  it('an expired token stops working', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'expired');
    const repo = repository();
    await repo.grant({ customerEmail: email, productSlug: STARTER, orderId }, new Date());

    // Derived from the TTL, not a magic number. This used to back-date
    // minting by 100_000_000 ms (~1.16 days), which only expires a token
    // if the TTL is under ~28 hours — it is 30 days, so `expiresAt`
    // landed a month in the FUTURE and the token was never expired.
    const wellPastExpiry = new Date(Date.now() - ACCESS_TOKEN_TTL_MS - 60_000);
    const minted = mintAccessToken(wellPastExpiry);
    await repo.saveAccessToken({
      tokenHash: minted.tokenHash,
      customerEmail: email,
      expiresAt: minted.expiresAt,
      now: wellPastExpiry,
    });

    expect((await resolveAccess(repo, minted.token)).granted).toBe(false);
  });
});

describe('duplicate purchase handling', () => {
  it('granting the same product twice yields one entitlement row', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'dup1');
    const second = await paidOrder(STARTER, 'dup2');
    const repo = repository();

    const first = await repo.grant(
      { customerEmail: email, productSlug: STARTER, orderId },
      new Date(),
    );
    const again = await repo.grant(
      { customerEmail: email, productSlug: STARTER, orderId: second.orderId },
      new Date(),
    );

    expect(first.outcome).toBe('granted');
    expect(again.outcome).toBe('already-held');

    const { rows } = await suite
      .require()
      .db.client.query(
        `SELECT count(*)::int AS n FROM entitlements WHERE customer_email = $1 AND product_slug = $2`,
        [email, STARTER],
      );
    expect(rows[0].n).toBe(1);
  });

  it('keeps the provenance of the FIRST order, not the duplicate', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'prov1');
    const second = await paidOrder(STARTER, 'prov2');
    const repo = repository();

    await repo.grant({ customerEmail: email, productSlug: STARTER, orderId }, new Date());
    const again = await repo.grant(
      { customerEmail: email, productSlug: STARTER, orderId: second.orderId },
      new Date(),
    );

    // The order that actually paid for the access keeps the record.
    expect(again.entitlement.orderId).toBe(orderId);
  });

  it('concurrent grants still produce exactly one row', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'race');
    const repo = repository();

    const results = await Promise.all(
      Array.from({ length: 4 }, () =>
        repo.grant({ customerEmail: email, productSlug: STARTER, orderId }, new Date()),
      ),
    );

    expect(results.filter((r) => r.outcome === 'granted')).toHaveLength(1);
    const { rows } = await suite
      .require()
      .db.client.query(`SELECT count(*)::int AS n FROM entitlements WHERE customer_email = $1`, [
        email,
      ]);
    expect(rows[0].n).toBe(1);
  });
});

describe('the database refuses an unearned entitlement', () => {
  it('rejects an entitlement for an order with no captured payment', async () => {
    const { db, context } = suite.require();
    const orderId = await seedOrder(db.client, context, 'unpaid');
    const { rows } = await db.client.query(
      `SELECT customer_email, product_slug FROM orders WHERE id = $1`,
      [orderId],
    );

    // Vary ONLY the invariant under test. Granting a different product to
    // a different customer violates three rules at once, and PostgreSQL
    // fires BEFORE triggers alphabetically — so
    // entitlement_matches_order_product raised first and the missing
    // payment was never reached.
    // Narrowed with the catalog's own guard rather than cast: the column
    // is `string` to the type system, and a fixture that drifts off the
    // catalog should fail here loudly rather than be asserted through.
    const orderProduct = String(rows[0].product_slug);
    expect(isValidProductId(orderProduct)).toBe(true);
    if (!isValidProductId(orderProduct)) return;

    await expect(
      repository().grant(
        {
          customerEmail: String(rows[0].customer_email),
          productSlug: orderProduct,
          orderId,
        },
        new Date(),
      ),
    ).rejects.toThrow(/entitlement_requires_captured_payment/);
  });

  it('rejects an entitlement for a different product than the order bought', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'mismatch');
    await expect(
      repository().grant({ customerEmail: email, productSlug: SYSTEM, orderId }, new Date()),
    ).rejects.toThrow(/entitlement_matches_order_product/);
  });

  it('rejects an entitlement for a different customer than the order', async () => {
    const { orderId } = await paidOrder(STARTER, 'wrongcust');
    await expect(
      repository().grant(
        { customerEmail: 'someone.else@example.com', productSlug: STARTER, orderId },
        new Date(),
      ),
    ).rejects.toThrow(/entitlement_matches_order_customer/);
  });
});

describe('revocation', () => {
  it('closes access without deleting the audit trail', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'revoke');
    const repo = repository();
    const granted = await repo.grant(
      { customerEmail: email, productSlug: STARTER, orderId },
      new Date(),
    );
    const token = await issueToken(email);

    expect(await repo.listActive(email)).toHaveLength(1);
    expect(await repo.revoke(granted.entitlement.id, 'refund', new Date())).toBe(true);

    expect(await repo.listActive(email)).toHaveLength(0);
    const access = await resolveAccess(repo, token);
    expect(access.granted && access.funnel.accessible).toEqual([]);

    const { rows } = await suite
      .require()
      .db.client.query(`SELECT revoked_reason FROM entitlements WHERE id = $1`, [
        granted.entitlement.id,
      ]);
    expect(rows[0].revoked_reason).toBe('refund'); // row survives
  });

  it('revoking twice reports false rather than moving the date', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'revoke2');
    const repo = repository();
    const granted = await repo.grant(
      { customerEmail: email, productSlug: STARTER, orderId },
      new Date(),
    );
    await repo.revoke(granted.entitlement.id, 'refund', new Date());
    expect(await repo.revoke(granted.entitlement.id, 'again', new Date())).toBe(false);
  });
});

describe('downloads', () => {
  it('a real customer with a real link gets the file', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'dl');
    const repo = repository();
    await repo.grant({ customerEmail: email, productSlug: STARTER, orderId }, new Date());
    const token = await issueToken(email);

    const result = await authorizeDownload({
      repository: repo,
      accessToken: token,
      grant: createDownloadGrant(
        { productId: STARTER, assetId: ASSET, customerEmail: email },
        SECRET,
      ),
      productId: STARTER,
      assetId: ASSET,
      grantSecret: SECRET,
    });

    expect(result.allowed).toBe(true);
    if (!result.allowed) return;
    expect(result.asset.storageKey).toBe('ai_income_99/prompt-library.pdf');
  });

  it('a stranger with a genuine link is refused', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'stranger');
    const repo = repository();
    await repo.grant({ customerEmail: email, productSlug: STARTER, orderId }, new Date());

    const genuineLink = createDownloadGrant(
      { productId: STARTER, assetId: ASSET, customerEmail: email },
      SECRET,
    );

    // No session at all — the link alone is worthless.
    const result = await authorizeDownload({
      repository: repo,
      accessToken: undefined,
      grant: genuineLink,
      productId: STARTER,
      assetId: ASSET,
      grantSecret: SECRET,
    });
    expect(result).toMatchObject({ allowed: false, reason: 'no-session' });
  });

  it('a revoked customer can no longer download', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'dlrevoked');
    const repo = repository();
    const granted = await repo.grant(
      { customerEmail: email, productSlug: STARTER, orderId },
      new Date(),
    );
    const token = await issueToken(email);
    await repo.revoke(granted.entitlement.id, 'chargeback', new Date());

    const result = await authorizeDownload({
      repository: repo,
      accessToken: token,
      grant: createDownloadGrant(
        { productId: STARTER, assetId: ASSET, customerEmail: email },
        SECRET,
      ),
      productId: STARTER,
      assetId: ASSET,
      grantSecret: SECRET,
    });
    expect(result).toMatchObject({ allowed: false, reason: 'not-entitled' });
  });

  it('a customer cannot download a kit above their tier', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'above');
    const repo = repository();
    await repo.grant({ customerEmail: email, productSlug: STARTER, orderId }, new Date());
    const token = await issueToken(email);

    const result = await authorizeDownload({
      repository: repo,
      accessToken: token,
      grant: createDownloadGrant(
        { productId: SYSTEM, assetId: 'system-walkthrough', customerEmail: email },
        SECRET,
      ),
      productId: SYSTEM,
      assetId: 'system-walkthrough',
      grantSecret: SECRET,
    });
    expect(result).toMatchObject({ allowed: false, reason: 'not-entitled' });
  });
});

describe('email identity', () => {
  it('case never forks one customer into two', async () => {
    const { orderId, email } = await paidOrder(STARTER, 'case');
    const repo = repository();
    await repo.grant(
      { customerEmail: email.toUpperCase(), productSlug: STARTER, orderId },
      new Date(),
    );
    expect(await repo.listActive(email)).toHaveLength(1);
    expect(await repo.listActive(email.toUpperCase())).toHaveLength(1);
  });

  it('the lowercase CHECK is enforced by the database itself', async () => {
    const { orderId } = await paidOrder(STARTER, 'upper');
    const { db } = suite.require();

    // The CHECK is SHADOWED on this path. PostgreSQL runs BEFORE triggers
    // before CHECK constraints, and entitlements_match_order compares
    // NEW.customer_email case-sensitively against lower(order email) — so
    // every mixed-case value is rejected by the trigger and the CHECK is
    // never reached. That makes the CHECK defence-in-depth for a path
    // where the trigger is not in play (a bulk load, a disabled trigger),
    // which is exactly the situation reproduced here.
    //
    // Inside a transaction, so the disable is rolled back with everything
    // else and no other test can observe the table without its trigger.
    await db.client.query('BEGIN');
    try {
      await db.client.query('ALTER TABLE entitlements DISABLE TRIGGER entitlements_match_order');
      await expect(
        db.client.query(
          `INSERT INTO entitlements (id, customer_email, product_slug, order_id, updated_at)
             VALUES ($1, 'MiXeD@Example.com', $2, $3, now())`,
          [`ent_${randomUUID()}`, STARTER, orderId],
        ),
      ).rejects.toThrow(/entitlements_email_lowercase/);
    } finally {
      await db.client.query('ROLLBACK');
    }

    // And the trigger is back, unharmed.
    const { rows } = await db.client.query(
      `SELECT tgenabled FROM pg_trigger WHERE tgname = 'entitlements_match_order'`,
    );
    expect(rows[0].tgenabled).toBe('O');
  });
});
