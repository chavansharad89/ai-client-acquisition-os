import { describe, expect, it } from 'vitest';

import { fakeRepository } from './testSupport';

const NOW = new Date('2026-04-01T00:00:00.000Z');

// Entitlement↔account linkage (DEC-010 §8, DEC-011) — the authorization
// gate moves from `entitlements.customer_email` to `entitlements.user_id`
// once a claim links them, and NEVER by comparing users.email to
// entitlements.customer_email directly.
describe('linkEntitlementsToUser', () => {
  it('links every existing unlinked entitlement for the email to the given user', async () => {
    const repo = fakeRepository();
    await repo.grant({ customerEmail: 'buyer@example.com', productSlug: 'ai_income_99', orderId: 'o1' }, NOW);
    await repo.grant(
      { customerEmail: 'buyer@example.com', productSlug: 'ai_freelancing_499', orderId: 'o2' },
      NOW,
    );

    await repo.linkEntitlementsToUser('Buyer@Example.com', 'user_1', NOW);

    const linked = await repo.listActiveByUser('user_1');
    expect(linked.map((e) => e.productSlug).sort()).toEqual(['ai_freelancing_499', 'ai_income_99']);
  });

  it('does not relink an entitlement that is already linked to a different user', async () => {
    const repo = fakeRepository();
    await repo.grant({ customerEmail: 'buyer@example.com', productSlug: 'ai_income_99', orderId: 'o1' }, NOW);
    await repo.linkEntitlementsToUser('buyer@example.com', 'user_1', NOW);

    // A second account somehow sharing the same email string (should not
    // happen given users.email uniqueness, but the repository method
    // itself must not silently reassign ownership either way).
    await repo.linkEntitlementsToUser('buyer@example.com', 'user_2', NOW);

    expect(await repo.listActiveByUser('user_1')).toHaveLength(1);
    expect(await repo.listActiveByUser('user_2')).toHaveLength(0);
  });

  it('an authenticated user with no linked entitlements sees an empty library, not an error', async () => {
    const repo = fakeRepository();
    expect(await repo.listActiveByUser('user_nobody')).toEqual([]);
  });

  it('listActiveByUser never returns an entitlement by matching email alone — only by user_id', async () => {
    const repo = fakeRepository();
    await repo.grant({ customerEmail: 'buyer@example.com', productSlug: 'ai_income_99', orderId: 'o1' }, NOW);
    // Never linked to any user.
    expect(await repo.listActiveByUser('user_1')).toEqual([]);
  });
});
