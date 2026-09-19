import { randomUUID } from 'node:crypto';

import {
  createPgIdentityRepository,
  mintUserSession,
  UnauthenticatedError,
} from '@acos/core-identity';
import {
  createPgSearchRepository,
  createSearch,
  getSearch,
  listSearches,
  transitionSearch,
  SearchIdempotencyKeyConflictError,
  SearchInvalidTransitionError,
  SearchServiceProfileNotFoundError,
  type SearchDeps,
} from '@acos/core-search';
import {
  createPgServiceProfileRepository,
  createServiceProfile,
  type ServiceProfileInput,
} from '@acos/core-service-profile';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// Search ownership + lifecycle — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0014's schema plus @acos/core-search's repository
// enforce, at the database itself: cross-user isolation, the immutable
// parameter snapshot (DEC-007), and the fixed lifecycle graph — not just
// application-level checks. Mirrors
// tests/integration/service-profile.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('search');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function deps(): SearchDeps {
  const { db } = suite.require();
  return {
    identity: createPgIdentityRepository(db.client),
    profiles: createPgServiceProfileRepository(db.client),
    searches: createPgSearchRepository(db.client),
  };
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `search.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
  await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [
    userId,
    email,
  ]);

  const identity = createPgIdentityRepository(db.client);
  const minted = await mintUserSession(identity, { id: userId, email });
  return { userId, token: minted.token };
}

function sampleProfileInput(overrides: Partial<ServiceProfileInput> = {}): ServiceProfileInput {
  return {
    service: 'Website development',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST'],
    keywords: ['website', 'redesign'],
    rationale: 'They lack a working website.',
    ...overrides,
  };
}

async function createOwnedProfile(
  d: SearchDeps,
  token: string,
  overrides: Partial<ServiceProfileInput> = {},
) {
  return createServiceProfile(d, token, sampleProfileInput(overrides));
}

describe('Search creation + snapshot', () => {
  it('an authenticated user starts a PENDING Search snapshotting their profile', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);

    const created = await createSearch(d, a.token, { serviceProfileId: profile.id });
    expect(created.userId).toBe(a.userId);
    expect(created.serviceProfileId).toBe(profile.id);
    expect(created.status).toBe('PENDING');
    expect(created.parameters).toEqual({
      service: 'Website development',
      targetCustomer: 'Restaurants',
      geography: 'Mumbai',
      minProjectValuePaise: 3_000_000,
      triggers: ['JOB_POST'],
      keywords: ['website', 'redesign'],
      rationale: 'They lack a working website.',
    });
  });

  it('editing the ServiceProfile after creating a Search does not change the Search snapshot', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createSearch(d, a.token, { serviceProfileId: profile.id });

    await d.profiles.update(
      a.userId,
      profile.id,
      sampleProfileInput({ service: 'Rewritten after search creation' }),
      new Date(),
    );

    const reread = await getSearch(d, a.token, created.id);
    expect(reread?.parameters.service).toBe('Website development');
  });

  it('a serviceProfileId owned by another user is treated as not found', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profileB = await createOwnedProfile(d, b.token);

    await expect(
      createSearch(d, a.token, { serviceProfileId: profileB.id }),
    ).rejects.toBeInstanceOf(SearchServiceProfileNotFoundError);
  });
});

describe('Search idempotency', () => {
  it('replaying the same key for the same profile returns the original Search, not a second row', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);

    const first = await createSearch(d, a.token, {
      serviceProfileId: profile.id,
      idempotencyKey: 'attempt-1',
    });
    const second = await createSearch(d, a.token, {
      serviceProfileId: profile.id,
      idempotencyKey: 'attempt-1',
    });

    expect(second.id).toBe(first.id);
    const all = await listSearches(d, a.token);
    expect(all).toHaveLength(1);
  });

  it('reusing a key for a different profile is a conflict, not a replay', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const otherProfile = await createOwnedProfile(d, a.token, { service: 'SEO audits' });

    await createSearch(d, a.token, {
      serviceProfileId: profile.id,
      idempotencyKey: 'attempt-1',
    });

    await expect(
      createSearch(d, a.token, {
        serviceProfileId: otherProfile.id,
        idempotencyKey: 'attempt-1',
      }),
    ).rejects.toBeInstanceOf(SearchIdempotencyKeyConflictError);
  });

  it('the same idempotency key is independent per user (unique index is scoped to user_id)', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profileA = await createOwnedProfile(d, a.token);
    const profileB = await createOwnedProfile(d, b.token, { service: 'SEO audits' });

    const searchA = await createSearch(d, a.token, {
      serviceProfileId: profileA.id,
      idempotencyKey: 'shared-key',
    });
    const searchB = await createSearch(d, b.token, {
      serviceProfileId: profileB.id,
      idempotencyKey: 'shared-key',
    });

    expect(searchA.id).not.toBe(searchB.id);
    expect(searchA.userId).toBe(a.userId);
    expect(searchB.userId).toBe(b.userId);
  });
});

describe('Search ownership', () => {
  it('a different authenticated user cannot retrieve the Search', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createSearch(d, a.token, { serviceProfileId: profile.id });

    const asB = await getSearch(d, b.token, created.id);
    expect(asB).toBeNull();
  });

  it('a different authenticated user cannot transition the Search', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createSearch(d, a.token, { serviceProfileId: profile.id });

    const result = await transitionSearch(d, b.token, created.id, { status: 'RUNNING' });
    expect(result).toBeNull();

    const stillPending = await getSearch(d, a.token, created.id);
    expect(stillPending?.status).toBe('PENDING');
  });

  it('the owner sees only their own searches', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps();
    const profileA = await createOwnedProfile(d, a.token);
    const profileB = await createOwnedProfile(d, b.token, { service: 'SEO audits' });

    const mine = await createSearch(d, a.token, { serviceProfileId: profileA.id });
    await createSearch(d, b.token, { serviceProfileId: profileB.id });

    const aList = await listSearches(d, a.token);
    expect(aList.map((s) => s.id)).toEqual([mine.id]);
  });
});

describe('Search lifecycle', () => {
  it('persists PENDING -> RUNNING -> COMPLETE', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createSearch(d, a.token, { serviceProfileId: profile.id });

    const running = await transitionSearch(d, a.token, created.id, { status: 'RUNNING' });
    expect(running?.status).toBe('RUNNING');
    expect(running?.attempts).toBe(1);

    const complete = await transitionSearch(d, a.token, created.id, { status: 'COMPLETE' });
    expect(complete?.status).toBe('COMPLETE');
  });

  it('rejects an invalid transition (PENDING -> COMPLETE) and leaves the row unchanged', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createSearch(d, a.token, { serviceProfileId: profile.id });

    await expect(
      transitionSearch(d, a.token, created.id, { status: 'COMPLETE' }),
    ).rejects.toBeInstanceOf(SearchInvalidTransitionError);

    const stillPending = await getSearch(d, a.token, created.id);
    expect(stillPending?.status).toBe('PENDING');
  });

  it('rejects a transition out of a terminal state', async () => {
    const a = await createUserAndSession('a');
    const d = deps();
    const profile = await createOwnedProfile(d, a.token);
    const created = await createSearch(d, a.token, { serviceProfileId: profile.id });
    await transitionSearch(d, a.token, created.id, { status: 'CANCELLED' });

    await expect(
      transitionSearch(d, a.token, created.id, { status: 'RUNNING' }),
    ).rejects.toBeInstanceOf(SearchInvalidTransitionError);
  });
});

describe('identity boundary', () => {
  it('an unauthenticated call is rejected before the repository runs', async () => {
    const d = deps();
    await expect(createSearch(d, null, { serviceProfileId: 'irrelevant' })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('a revoked/unknown token cannot list another user’s searches', async () => {
    const d = deps();
    await expect(listSearches(d, 'not-a-real-token')).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
