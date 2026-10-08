import { describe, expect, it } from 'vitest';

import { hashAccessToken } from './accessToken';
import {
  CLAIM_TOKEN_TTL_MS,
  claimTokenHashesMatch,
  evaluateClaimToken,
  mintClaimToken,
  type StoredClaimToken,
} from './claimToken';
import { fakeRepository } from './testSupport';

const NOW = new Date('2026-04-01T00:00:00.000Z');

describe('mintClaimToken', () => {
  it('mints a high-entropy token whose hash matches hashAccessToken', () => {
    const minted = mintClaimToken(NOW);
    expect(minted.token.length).toBeGreaterThan(20);
    expect(minted.tokenHash).toBe(hashAccessToken(minted.token));
  });

  it('expires CLAIM_TOKEN_TTL_MS (24h, DEC-014 D2) after mint time, not access_tokens 30-day TTL', () => {
    const minted = mintClaimToken(NOW);
    expect(minted.expiresAt.getTime()).toBe(NOW.getTime() + CLAIM_TOKEN_TTL_MS);
    expect(CLAIM_TOKEN_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('mints a different token every time', () => {
    expect(mintClaimToken(NOW).token).not.toBe(mintClaimToken(NOW).token);
  });
});

describe('evaluateClaimToken', () => {
  const base: StoredClaimToken = {
    orderId: 'order_1',
    customerEmail: 'buyer@example.com',
    expiresAt: new Date(NOW.getTime() + 60_000),
    claimedAt: null,
    invalidatedAt: null,
  };

  it('rejects an unknown token', () => {
    expect(evaluateClaimToken(null, NOW)).toEqual({ valid: false, reason: 'unknown' });
  });

  it('accepts a live, unclaimed token and returns its order/email', () => {
    expect(evaluateClaimToken(base, NOW)).toEqual({
      valid: true,
      orderId: 'order_1',
      customerEmail: 'buyer@example.com',
    });
  });

  it('rejects an already-claimed token', () => {
    const claimed = { ...base, claimedAt: NOW };
    expect(evaluateClaimToken(claimed, NOW)).toEqual({ valid: false, reason: 'already-claimed' });
  });

  it('rejects an expired token', () => {
    const expired = { ...base, expiresAt: new Date(NOW.getTime() - 1) };
    expect(evaluateClaimToken(expired, NOW)).toEqual({ valid: false, reason: 'expired' });
  });

  it('checks claimed-ness before expiry (claimed takes priority)', () => {
    const both = { ...base, claimedAt: NOW, expiresAt: new Date(NOW.getTime() - 1) };
    expect(evaluateClaimToken(both, NOW)).toEqual({ valid: false, reason: 'already-claimed' });
  });

  it('rejects a superseded token (DEC-014 D4: an earlier, unused link invalidated by a newer one)', () => {
    const superseded = { ...base, invalidatedAt: NOW };
    expect(evaluateClaimToken(superseded, NOW)).toEqual({ valid: false, reason: 'superseded' });
  });

  it('checks claimed-ness before invalidation (a consumed token cannot be "just superseded")', () => {
    const both = { ...base, claimedAt: NOW, invalidatedAt: NOW };
    expect(evaluateClaimToken(both, NOW)).toEqual({ valid: false, reason: 'already-claimed' });
  });
});

describe('claimTokenHashesMatch', () => {
  it('matches identical hashes and rejects differing or mismatched-length ones', () => {
    expect(claimTokenHashesMatch('abc', 'abc')).toBe(true);
    expect(claimTokenHashesMatch('abc', 'abd')).toBe(false);
    expect(claimTokenHashesMatch('abc', 'abcd')).toBe(false);
  });
});

describe('single-use claim, end to end against the fake repository', () => {
  it('a claim token can be consumed exactly once — the second attempt is rejected', async () => {
    const repo = fakeRepository();
    const minted = mintClaimToken(NOW);
    await repo.saveClaimToken({
      tokenHash: minted.tokenHash,
      orderId: 'order_1',
      customerEmail: 'Buyer@Example.com',
      expiresAt: minted.expiresAt,
      now: NOW,
    });

    const stored = await repo.findClaimToken(minted.tokenHash);
    expect(evaluateClaimToken(stored, NOW)).toEqual({
      valid: true,
      orderId: 'order_1',
      customerEmail: 'buyer@example.com', // normalised, lowercase — server-derived
    });

    const firstClaim = await repo.markClaimTokenClaimed(minted.tokenHash, NOW);
    expect(firstClaim).toBe(true);

    const secondClaim = await repo.markClaimTokenClaimed(minted.tokenHash, NOW);
    expect(secondClaim).toBe(false);

    const afterClaim = await repo.findClaimToken(minted.tokenHash);
    expect(evaluateClaimToken(afterClaim, NOW)).toEqual({ valid: false, reason: 'already-claimed' });
  });

  it('two concurrent consume attempts (simulated sequentially) have exactly one winner', async () => {
    const repo = fakeRepository();
    const minted = mintClaimToken(NOW);
    await repo.saveClaimToken({
      tokenHash: minted.tokenHash,
      orderId: 'order_1',
      customerEmail: 'buyer@example.com',
      expiresAt: minted.expiresAt,
      now: NOW,
    });

    const results = await Promise.all([
      repo.markClaimTokenClaimed(minted.tokenHash, NOW),
      repo.markClaimTokenClaimed(minted.tokenHash, NOW),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('latest-token-wins: issuing a second claim token for the same order invalidates the first (DEC-014 D4)', async () => {
    const repo = fakeRepository();
    const first = mintClaimToken(NOW);
    await repo.saveClaimToken({
      tokenHash: first.tokenHash,
      orderId: 'order_1',
      customerEmail: 'buyer@example.com',
      expiresAt: first.expiresAt,
      now: NOW,
    });

    const later = new Date(NOW.getTime() + 60_000);
    const second = mintClaimToken(later);
    await repo.saveClaimToken({
      tokenHash: second.tokenHash,
      orderId: 'order_1',
      customerEmail: 'buyer@example.com',
      expiresAt: second.expiresAt,
      now: later,
    });

    const firstStored = await repo.findClaimToken(first.tokenHash);
    expect(evaluateClaimToken(firstStored, later)).toEqual({ valid: false, reason: 'superseded' });

    const secondStored = await repo.findClaimToken(second.tokenHash);
    expect(evaluateClaimToken(secondStored, later)).toEqual({
      valid: true,
      orderId: 'order_1',
      customerEmail: 'buyer@example.com',
    });
  });

  it('a consumed token is not revived when a later token for the same order is issued', async () => {
    const repo = fakeRepository();
    const first = mintClaimToken(NOW);
    await repo.saveClaimToken({
      tokenHash: first.tokenHash,
      orderId: 'order_1',
      customerEmail: 'buyer@example.com',
      expiresAt: first.expiresAt,
      now: NOW,
    });
    await repo.markClaimTokenClaimed(first.tokenHash, NOW);

    const later = new Date(NOW.getTime() + 60_000);
    const second = mintClaimToken(later);
    await repo.saveClaimToken({
      tokenHash: second.tokenHash,
      orderId: 'order_1',
      customerEmail: 'buyer@example.com',
      expiresAt: second.expiresAt,
      now: later,
    });

    const firstStored = await repo.findClaimToken(first.tokenHash);
    // Still rejected as already-claimed, never flipped to superseded —
    // saveClaimToken's invalidation only touches claimedAt IS NULL rows.
    expect(evaluateClaimToken(firstStored, later)).toEqual({ valid: false, reason: 'already-claimed' });
  });
});
