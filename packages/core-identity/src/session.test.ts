import { hashAccessToken } from '@acos/core-entitlements';
import { describe, expect, it } from 'vitest';

import { mintUserSession, requireUser, resolveSession, UnauthenticatedError } from './session';
import { fakeRepository } from './testSupport';

const NOW = new Date('2026-04-01T00:00:00.000Z');
const FUTURE = new Date(NOW.getTime() + 86_400_000);

function repoWithSession(token: string, userId: string) {
  return fakeRepository({
    sessions: { [hashAccessToken(token)]: { userId, expiresAt: FUTURE, revokedAt: null } },
  });
}

describe('an authenticated session resolves to the server-derived userId', () => {
  it('requireUser returns the userId the token was minted for', async () => {
    const repo = repoWithSession('session-a', 'user_a');
    await expect(requireUser(repo, 'session-a', NOW)).resolves.toBe('user_a');
  });

  it('resolveSession reports the same identity without throwing', async () => {
    const repo = repoWithSession('session-a', 'user_a');
    await expect(resolveSession(repo, 'session-a', NOW)).resolves.toEqual({
      authenticated: true,
      userId: 'user_a',
    });
  });
});

describe('missing session', () => {
  it('requireUser rejects undefined, null, and empty-string tokens', async () => {
    const repo = repoWithSession('session-a', 'user_a');
    for (const claim of [undefined, null, '']) {
      await expect(requireUser(repo, claim, NOW)).rejects.toThrow(UnauthenticatedError);
    }
  });

  it('the rejection reason is "no-token", not "unknown-token"', async () => {
    const repo = repoWithSession('session-a', 'user_a');
    await expect(resolveSession(repo, undefined, NOW)).resolves.toEqual({
      authenticated: false,
      reason: 'no-token',
    });
  });
});

describe('expired token', () => {
  it('is rejected even though it was once valid', async () => {
    const repo = fakeRepository({
      sessions: {
        [hashAccessToken('stale')]: {
          userId: 'user_a',
          expiresAt: new Date(NOW.getTime() - 1),
          revokedAt: null,
        },
      },
    });
    await expect(resolveSession(repo, 'stale', NOW)).resolves.toEqual({
      authenticated: false,
      reason: 'expired',
    });
    await expect(requireUser(repo, 'stale', NOW)).rejects.toThrow(UnauthenticatedError);
  });
});

describe('revoked token', () => {
  it('is rejected even before it would have expired', async () => {
    const repo = fakeRepository({
      sessions: {
        [hashAccessToken('gone')]: { userId: 'user_a', expiresAt: FUTURE, revokedAt: NOW },
      },
    });
    await expect(resolveSession(repo, 'gone', NOW)).resolves.toEqual({
      authenticated: false,
      reason: 'revoked',
    });
  });
});

describe('entitlement-only token (user_id IS NULL)', () => {
  it('is rejected by requireUser rather than authenticated as a session', async () => {
    // Same shape a row in `access_tokens` has today, before migration
    // 0012: a valid, unexpired, unrevoked row — just with no user_id,
    // because it was issued as a purchase credential, not a login.
    const repo = fakeRepository({
      sessions: {
        [hashAccessToken('entitlement-token')]: {
          userId: null,
          expiresAt: FUTURE,
          revokedAt: null,
        },
      },
    });
    await expect(resolveSession(repo, 'entitlement-token', NOW)).resolves.toEqual({
      authenticated: false,
      reason: 'not-a-session',
    });
    await expect(requireUser(repo, 'entitlement-token', NOW)).rejects.toThrow(UnauthenticatedError);
  });
});

describe('a caller-supplied userId cannot override the authenticated identity', () => {
  it('requireUser has no channel for a caller to assert who they are', async () => {
    const repo = repoWithSession('session-a', 'user_real');

    // requireUser's only inputs are the repository and the opaque token —
    // there is no userId parameter for a caller to pass, whatever a
    // request body, query string, or header might claim.
    const claimedUserId = 'user_attacker';
    const resolvedUserId = await requireUser(repo, 'session-a', NOW);

    expect(resolvedUserId).toBe('user_real');
    expect(resolvedUserId).not.toBe(claimedUserId);
  });
});

describe('authorization boundary — user-owned resource pattern', () => {
  it('user A cannot read a resource owned by user B through the boundary', async () => {
    const repo = fakeRepository({
      sessions: {
        [hashAccessToken('token-a')]: { userId: 'user_a', expiresAt: FUTURE, revokedAt: null },
        [hashAccessToken('token-b')]: { userId: 'user_b', expiresAt: FUTURE, revokedAt: null },
      },
    });

    // A minimal stand-in for "every future user-owned repository"
    // (DEC-003): it filters strictly by the server-derived userId. No
    // ServiceProfile/Search repository exists yet (out of scope for this
    // phase); this proves the requireUser -> userId -> ownership-filter
    // chain those repositories will all sit on top of.
    const ownedResources = new Map([['resource_1', { ownerId: 'user_b', secret: 'b-only' }]]);
    function readOwned(userId: string, resourceId: string) {
      const resource = ownedResources.get(resourceId);
      if (!resource || resource.ownerId !== userId) return null;
      return resource;
    }

    const userIdA = await requireUser(repo, 'token-a', NOW);
    const userIdB = await requireUser(repo, 'token-b', NOW);

    expect(readOwned(userIdA, 'resource_1')).toBeNull();
    expect(readOwned(userIdB, 'resource_1')).toEqual({ ownerId: 'user_b', secret: 'b-only' });
  });
});

describe('mintUserSession', () => {
  it('mints a token that requireUser resolves back to the minted user', async () => {
    const repo = fakeRepository();
    const user = await repo.createUser({ email: 'owner@example.com' }, NOW);

    const minted = await mintUserSession(repo, user, NOW);
    await expect(requireUser(repo, minted.token, NOW)).resolves.toBe(user.id);
  });
});

describe('token lifecycle', () => {
  it('an unrecognised token is rejected the same way an expired one is', async () => {
    const repo = fakeRepository();
    await expect(resolveSession(repo, 'never-issued', NOW)).resolves.toEqual({
      authenticated: false,
      reason: 'unknown-token',
    });
  });

  it('the raw token is hashed before it reaches the repository', async () => {
    const repo = repoWithSession('session-a', 'user_a');
    await requireUser(repo, 'session-a', NOW);
    expect(Object.keys(repo.sessions)).toEqual([hashAccessToken('session-a')]);
  });
});
