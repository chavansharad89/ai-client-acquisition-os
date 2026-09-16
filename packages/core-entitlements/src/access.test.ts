import { describe, expect, it } from 'vitest';

import { requireProductAccess, resolveAccess } from './access';
import { hashAccessToken, mintAccessToken } from './accessToken';
import { fakeRepository } from './testSupport';
import type { Entitlement } from './types';

const NOW = new Date('2026-04-01T00:00:00.000Z');
const EMAIL = 'buyer@example.com';

const entitlement = (productSlug: string, over: Partial<Entitlement> = {}): Entitlement => ({
  id: `ent_${productSlug}`,
  customerEmail: EMAIL,
  productSlug: productSlug as never,
  orderId: 'order_1',
  grantedAt: NOW,
  revokedAt: null,
  ...over,
});

function repoWithToken(token: string, entitlements: Entitlement[] = []) {
  return fakeRepository({
    entitlements,
    tokens: {
      [hashAccessToken(token)]: {
        customerEmail: EMAIL,
        expiresAt: new Date(NOW.getTime() + 86_400_000),
        revokedAt: null,
      },
    },
  });
}

describe('access is resolved from the server, never from the client', () => {
  it('no token means no access, whatever the client claims', async () => {
    const repo = repoWithToken('valid', [entitlement('ai_income_99')]);
    for (const claim of [undefined, null, '']) {
      const result = await resolveAccess(repo, claim, NOW);
      expect(result.granted).toBe(false);
      expect(result.funnel.accessible).toEqual([]);
    }
  });

  it('an unrecognised token grants nothing, even for a real customer', async () => {
    const repo = repoWithToken('valid', [entitlement('ai_client_acquisition_1499')]);
    const result = await resolveAccess(repo, 'a-token-i-made-up', NOW);
    expect(result).toMatchObject({ granted: false, reason: 'invalid-token' });
  });

  it('entitlements come from the database, not from the token', async () => {
    const repo = repoWithToken('valid', [entitlement('ai_freelancing_499')]);
    const result = await resolveAccess(repo, 'valid', NOW);
    expect(result.granted).toBe(true);
    if (!result.granted) return;
    // The ladder expands the single purchase into two accessible products.
    expect(result.funnel.accessible).toEqual(['ai_income_99', 'ai_freelancing_499']);
  });

  it('the raw token is hashed before it reaches storage', async () => {
    const repo = repoWithToken('valid');
    await resolveAccess(repo, 'valid', NOW);
    expect(repo.lookups).toEqual([hashAccessToken('valid')]);
    expect(repo.lookups[0]).not.toBe('valid');
    expect(repo.lookups[0]).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('token lifecycle', () => {
  it('an expired token is rejected', async () => {
    const repo = fakeRepository({
      entitlements: [entitlement('ai_income_99')],
      tokens: {
        [hashAccessToken('old')]: {
          customerEmail: EMAIL,
          expiresAt: new Date(NOW.getTime() - 1),
          revokedAt: null,
        },
      },
    });
    expect(await resolveAccess(repo, 'old', NOW)).toMatchObject({ granted: false });
  });

  it('a revoked token is rejected even before it expires', async () => {
    const repo = fakeRepository({
      tokens: {
        [hashAccessToken('gone')]: {
          customerEmail: EMAIL,
          expiresAt: new Date(NOW.getTime() + 86_400_000),
          revokedAt: NOW,
        },
      },
    });
    expect(await resolveAccess(repo, 'gone', NOW)).toMatchObject({ granted: false });
  });

  it('a minted token is unguessable and stored only as a digest', () => {
    const a = mintAccessToken(NOW);
    const b = mintAccessToken(NOW);
    expect(a.token).not.toBe(b.token);
    expect(a.token.length).toBeGreaterThanOrEqual(43); // 32 bytes, base64url
    expect(a.tokenHash).toBe(hashAccessToken(a.token));
    expect(a.tokenHash).not.toContain(a.token);
  });
});

describe('direct URL protection', () => {
  it('an anonymous visitor is refused a paid product', async () => {
    const repo = repoWithToken('valid');
    const result = await requireProductAccess(repo, undefined, 'ai_income_99', NOW);
    expect(result).toMatchObject({ granted: false, reason: 'no-token' });
  });

  it('a customer is refused a product above their tier', async () => {
    const repo = repoWithToken('valid', [entitlement('ai_income_99')]);
    const result = await requireProductAccess(repo, 'valid', 'ai_client_acquisition_1499', NOW);
    expect(result).toMatchObject({ granted: false, reason: 'not-entitled' });
  });

  it('distinguishes "who are you" from "you cannot open this"', async () => {
    // Two different journeys: one goes to checkout, one to the upsell.
    const repo = repoWithToken('valid', [entitlement('ai_income_99')]);
    const anon = await requireProductAccess(repo, undefined, 'ai_income_99', NOW);
    const wrong = await requireProductAccess(repo, 'valid', 'ai_freelancing_499', NOW);
    expect(anon.granted || wrong.granted).toBe(false);
    expect((anon as { reason: string }).reason).not.toBe((wrong as { reason: string }).reason);
  });

  it('a customer is allowed a product granted by implication', async () => {
    const repo = repoWithToken('valid', [entitlement('ai_client_acquisition_1499')]);
    const result = await requireProductAccess(repo, 'valid', 'ai_income_99', NOW);
    expect(result.granted).toBe(true);
  });

  it('a revoked entitlement closes the door again', async () => {
    const repo = repoWithToken('valid', [entitlement('ai_income_99', { revokedAt: NOW })]);
    const result = await requireProductAccess(repo, 'valid', 'ai_income_99', NOW);
    expect(result).toMatchObject({ granted: false, reason: 'not-entitled' });
  });
});

describe('duplicate purchase at the repository level', () => {
  it('granting twice yields one entitlement', async () => {
    const repo = fakeRepository();
    const input = { customerEmail: EMAIL, productSlug: 'ai_income_99' as const, orderId: 'o1' };

    const first = await repo.grant(input, NOW);
    const second = await repo.grant({ ...input, orderId: 'o2' }, NOW);

    expect(first.outcome).toBe('granted');
    expect(second.outcome).toBe('already-held');
    expect(repo.entitlements).toHaveLength(1);
  });

  it('email case never forks a customer into two', async () => {
    const repo = fakeRepository();
    await repo.grant(
      { customerEmail: 'Buyer@Example.com', productSlug: 'ai_income_99', orderId: 'o1' },
      NOW,
    );
    const second = await repo.grant(
      { customerEmail: 'buyer@example.com', productSlug: 'ai_income_99', orderId: 'o2' },
      NOW,
    );
    expect(second.outcome).toBe('already-held');
    expect(repo.entitlements).toHaveLength(1);
  });
});
