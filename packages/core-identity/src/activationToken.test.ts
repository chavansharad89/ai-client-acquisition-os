import { hashAccessToken } from '@acos/core-entitlements';
import { describe, expect, it } from 'vitest';

import {
  ACTIVATION_TOKEN_TTL_MS,
  evaluateActivationToken,
  mintActivationToken,
  type StoredActivationToken,
} from './activationToken';
import { fakeRepository } from './testSupport';

const NOW = new Date('2026-04-01T00:00:00.000Z');

describe('mintActivationToken', () => {
  it('mints a high-entropy token whose hash matches hashAccessToken', () => {
    const minted = mintActivationToken(NOW);
    expect(minted.token.length).toBeGreaterThan(20);
    expect(minted.tokenHash).toBe(hashAccessToken(minted.token));
  });

  it('expires ACTIVATION_TOKEN_TTL_MS (24h, AUTH-PO-06/07/21) after mint time', () => {
    const minted = mintActivationToken(NOW);
    expect(minted.expiresAt.getTime()).toBe(NOW.getTime() + ACTIVATION_TOKEN_TTL_MS);
    expect(ACTIVATION_TOKEN_TTL_MS).toBe(24 * 60 * 60 * 1000);
  });

  it('mints a different token every time', () => {
    expect(mintActivationToken(NOW).token).not.toBe(mintActivationToken(NOW).token);
  });
});

describe('evaluateActivationToken', () => {
  const base: StoredActivationToken = {
    userId: 'user_1',
    expiresAt: new Date(NOW.getTime() + 60_000),
    consumedAt: null,
    invalidatedAt: null,
  };

  it('rejects an unknown token', () => {
    expect(evaluateActivationToken(null, NOW)).toEqual({ valid: false, reason: 'unknown' });
  });

  it('accepts a live, unconsumed token and returns its userId', () => {
    expect(evaluateActivationToken(base, NOW)).toEqual({ valid: true, userId: 'user_1' });
  });

  it('rejects an already-consumed token', () => {
    const consumed = { ...base, consumedAt: NOW };
    expect(evaluateActivationToken(consumed, NOW)).toEqual({ valid: false, reason: 'already-consumed' });
  });

  it('rejects an expired token', () => {
    const expired = { ...base, expiresAt: new Date(NOW.getTime() - 1) };
    expect(evaluateActivationToken(expired, NOW)).toEqual({ valid: false, reason: 'expired' });
  });

  it('rejects a superseded token (resend invalidates the prior link)', () => {
    const superseded = { ...base, invalidatedAt: NOW };
    expect(evaluateActivationToken(superseded, NOW)).toEqual({ valid: false, reason: 'superseded' });
  });

  it('checks consumed-ness before invalidation (a used token cannot be "just superseded")', () => {
    const both = { ...base, consumedAt: NOW, invalidatedAt: NOW };
    expect(evaluateActivationToken(both, NOW)).toEqual({ valid: false, reason: 'already-consumed' });
  });
});

describe('single-use activation, end to end against the fake repository', () => {
  it('an activation token can be consumed exactly once — the second attempt is rejected', async () => {
    const repo = fakeRepository();
    const minted = mintActivationToken(NOW);
    await repo.saveActivationToken({
      tokenHash: minted.tokenHash,
      userId: 'user_1',
      expiresAt: minted.expiresAt,
      now: NOW,
    });

    const stored = await repo.findActivationToken(minted.tokenHash);
    expect(evaluateActivationToken(stored, NOW)).toEqual({ valid: true, userId: 'user_1' });

    const firstConsume = await repo.consumeActivationToken(minted.tokenHash, NOW);
    expect(firstConsume).toBe(true);

    const secondConsume = await repo.consumeActivationToken(minted.tokenHash, NOW);
    expect(secondConsume).toBe(false);

    const afterConsume = await repo.findActivationToken(minted.tokenHash);
    expect(evaluateActivationToken(afterConsume, NOW)).toEqual({ valid: false, reason: 'already-consumed' });
  });

  it('two concurrent consume attempts (simulated sequentially) have exactly one winner', async () => {
    const repo = fakeRepository();
    const minted = mintActivationToken(NOW);
    await repo.saveActivationToken({
      tokenHash: minted.tokenHash,
      userId: 'user_1',
      expiresAt: minted.expiresAt,
      now: NOW,
    });

    const results = await Promise.all([
      repo.consumeActivationToken(minted.tokenHash, NOW),
      repo.consumeActivationToken(minted.tokenHash, NOW),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('latest-token-wins: issuing a second token for the same user invalidates the first (AUTH-PO-07)', async () => {
    const repo = fakeRepository();
    const first = mintActivationToken(NOW);
    await repo.saveActivationToken({
      tokenHash: first.tokenHash,
      userId: 'user_1',
      expiresAt: first.expiresAt,
      now: NOW,
    });

    const later = new Date(NOW.getTime() + 60_000);
    const second = mintActivationToken(later);
    await repo.saveActivationToken({
      tokenHash: second.tokenHash,
      userId: 'user_1',
      expiresAt: second.expiresAt,
      now: later,
    });

    const firstStored = await repo.findActivationToken(first.tokenHash);
    expect(evaluateActivationToken(firstStored, later)).toEqual({ valid: false, reason: 'superseded' });

    const secondStored = await repo.findActivationToken(second.tokenHash);
    expect(evaluateActivationToken(secondStored, later)).toEqual({ valid: true, userId: 'user_1' });
  });

  it('a different user_id\'s live token is unaffected by another user\'s resend', async () => {
    const repo = fakeRepository();
    const forUser1 = mintActivationToken(NOW);
    await repo.saveActivationToken({
      tokenHash: forUser1.tokenHash,
      userId: 'user_1',
      expiresAt: forUser1.expiresAt,
      now: NOW,
    });

    const forUser2 = mintActivationToken(NOW);
    await repo.saveActivationToken({
      tokenHash: forUser2.tokenHash,
      userId: 'user_2',
      expiresAt: forUser2.expiresAt,
      now: NOW,
    });

    const stored1 = await repo.findActivationToken(forUser1.tokenHash);
    expect(evaluateActivationToken(stored1, NOW)).toEqual({ valid: true, userId: 'user_1' });
  });

  it('a consumed token is not revived when a later token for the same user is issued', async () => {
    const repo = fakeRepository();
    const first = mintActivationToken(NOW);
    await repo.saveActivationToken({
      tokenHash: first.tokenHash,
      userId: 'user_1',
      expiresAt: first.expiresAt,
      now: NOW,
    });
    await repo.consumeActivationToken(first.tokenHash, NOW);

    const later = new Date(NOW.getTime() + 60_000);
    const second = mintActivationToken(later);
    await repo.saveActivationToken({
      tokenHash: second.tokenHash,
      userId: 'user_1',
      expiresAt: second.expiresAt,
      now: later,
    });

    const firstStored = await repo.findActivationToken(first.tokenHash);
    expect(evaluateActivationToken(firstStored, later)).toEqual({ valid: false, reason: 'already-consumed' });
  });
});
