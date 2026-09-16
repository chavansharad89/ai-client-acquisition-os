import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import type {
  ServiceProfileFields,
  ServiceProfileInput,
  ServiceProfileRepository,
  StoredServiceProfile,
} from '@acos/core-service-profile';
import { describe, expect, it } from 'vitest';

import {
  SearchIdempotencyKeyConflictError,
  SearchInvalidTransitionError,
  SearchServiceProfileNotFoundError,
} from './errors';
import { createSearch, getSearch, listSearches, transitionSearch } from './service';
import { fakeSearchRepository } from './testSupport';

// UNIT tests (fakes only — see
// tests/integration/search.integration.test.ts for the real-Postgres
// proof of the same ownership boundary and snapshot immutability).

function fakeIdentity(sessions: Record<string, StoredSessionToken>): IdentityRepository {
  return {
    async createUser() {
      throw new Error('not used by these tests');
    },
    async findUserByEmail() {
      throw new Error('not used by these tests');
    },
    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },
    async saveSessionToken() {
      throw new Error('not used by these tests');
    },
  };
}

function sessionFor(rawToken: string, userId: string): Record<string, StoredSessionToken> {
  return {
    [hashAccessToken(rawToken)]: {
      userId,
      expiresAt: new Date(Date.now() + 60_000),
      revokedAt: null,
    },
  };
}

/**
 * A minimal local fake of core-service-profile's ServiceProfileRepository
 * — not that package's own fake (unexported, internal to its src/), just
 * enough behaviour for this package's tests to seed and read profiles.
 */
function fakeServiceProfileRepository(): ServiceProfileRepository & {
  rows: StoredServiceProfile[];
} {
  const rows: StoredServiceProfile[] = [];
  let counter = 0;

  return {
    rows,
    async create(userId: string, input: ServiceProfileFields, now: Date) {
      counter += 1;
      const created: StoredServiceProfile = {
        id: `svcprofile_${counter}`,
        userId,
        ...input,
        createdAt: now,
        updatedAt: now,
      };
      rows.push(created);
      return created;
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
    async list(userId: string) {
      return rows.filter((row) => row.userId === userId);
    },
    async update(userId: string, id: string, input: ServiceProfileFields, now: Date) {
      const index = rows.findIndex((row) => row.id === id && row.userId === userId);
      if (index === -1) return null;
      const updated: StoredServiceProfile = { ...rows[index]!, ...input, updatedAt: now };
      rows[index] = updated;
      return updated;
    },
    async delete(userId: string, id: string) {
      const index = rows.findIndex((row) => row.id === id && row.userId === userId);
      if (index === -1) return false;
      rows.splice(index, 1);
      return true;
    },
  };
}

function sampleProfileInput(overrides: Partial<ServiceProfileInput> = {}): ServiceProfileInput {
  return {
    service: 'Content writing',
    targetCustomer: 'D2C restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST'],
    keywords: ['content', 'writer'],
    rationale: 'They are hiring for content.',
    ...overrides,
  };
}

async function deps() {
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
  });
  const profiles = fakeServiceProfileRepository();
  const searches = fakeSearchRepository();

  const profileA: StoredServiceProfile = await profiles.create(
    'user_a',
    sampleProfileInput(),
    new Date('2026-01-01T00:00:00.000Z'),
  );
  const profileB: StoredServiceProfile = await profiles.create(
    'user_b',
    sampleProfileInput({ service: 'SEO audits' }),
    new Date('2026-01-01T00:00:00.000Z'),
  );

  return { identity, profiles, searches, profileA, profileB };
}

describe('creation + snapshot', () => {
  it('starts a PENDING Search snapshotting the owned profile', async () => {
    const d = await deps();
    const created = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });

    expect(created.userId).toBe('user_a');
    expect(created.serviceProfileId).toBe(d.profileA.id);
    expect(created.status).toBe('PENDING');
    expect(created.parameters).toEqual({
      service: 'Content writing',
      targetCustomer: 'D2C restaurants',
      geography: 'Mumbai',
      minProjectValuePaise: 3_000_000,
      triggers: ['JOB_POST'],
      keywords: ['content', 'writer'],
      rationale: 'They are hiring for content.',
    });
    expect(created.attempts).toBe(0);
    expect(created.lastError).toBeNull();
  });

  it('a later ServiceProfile edit does not change an existing Search snapshot', async () => {
    const d = await deps();
    const created = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });

    await d.profiles.update(
      'user_a',
      d.profileA.id,
      sampleProfileInput({ service: 'Rewritten service' }),
      new Date(),
    );

    const reread = await getSearch(d, 'token-a', created.id);
    expect(reread?.parameters.service).toBe('Content writing');
  });

  it('a serviceProfileId belonging to another user is treated as not found', async () => {
    const d = await deps();
    await expect(
      createSearch(d, 'token-a', { serviceProfileId: d.profileB.id }),
    ).rejects.toBeInstanceOf(SearchServiceProfileNotFoundError);
  });

  it('an unknown serviceProfileId is rejected', async () => {
    const d = await deps();
    await expect(
      createSearch(d, 'token-a', { serviceProfileId: 'does-not-exist' }),
    ).rejects.toBeInstanceOf(SearchServiceProfileNotFoundError);
  });
});

describe('idempotency', () => {
  it('replaying the same key for the same profile returns the original Search', async () => {
    const d = await deps();
    const first = await createSearch(d, 'token-a', {
      serviceProfileId: d.profileA.id,
      idempotencyKey: 'attempt-1',
    });
    const second = await createSearch(d, 'token-a', {
      serviceProfileId: d.profileA.id,
      idempotencyKey: 'attempt-1',
    });
    expect(second.id).toBe(first.id);
    expect(d.searches.rows).toHaveLength(1);
  });

  it('reusing a key for a different profile is a conflict, not a replay', async () => {
    const d = await deps();
    const otherProfile = await d.profiles.create(
      'user_a',
      sampleProfileInput({ service: 'SEO audits' }),
      new Date(),
    );
    await createSearch(d, 'token-a', {
      serviceProfileId: d.profileA.id,
      idempotencyKey: 'attempt-1',
    });
    await expect(
      createSearch(d, 'token-a', {
        serviceProfileId: otherProfile.id,
        idempotencyKey: 'attempt-1',
      }),
    ).rejects.toBeInstanceOf(SearchIdempotencyKeyConflictError);
  });
});

describe('ownership', () => {
  it('a different user cannot retrieve the Search', async () => {
    const d = await deps();
    const created = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });
    const asB = await getSearch(d, 'token-b', created.id);
    expect(asB).toBeNull();
  });

  it('a different user cannot transition the Search', async () => {
    const d = await deps();
    const created = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });
    const result = await transitionSearch(d, 'token-b', created.id, { status: 'RUNNING' });
    expect(result).toBeNull();

    const stillPending = await getSearch(d, 'token-a', created.id);
    expect(stillPending?.status).toBe('PENDING');
  });

  it('a user sees only their own searches in the list', async () => {
    const d = await deps();
    const mine = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });
    await createSearch(d, 'token-b', { serviceProfileId: d.profileB.id });

    const list = await listSearches(d, 'token-a');
    expect(list.map((s) => s.id)).toEqual([mine.id]);
  });
});

describe('lifecycle transitions', () => {
  it('PENDING -> RUNNING -> COMPLETE is permitted and increments attempts on claim', async () => {
    const d = await deps();
    const created = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });

    const running = await transitionSearch(d, 'token-a', created.id, { status: 'RUNNING' });
    expect(running?.status).toBe('RUNNING');
    expect(running?.attempts).toBe(1);

    const complete = await transitionSearch(d, 'token-a', created.id, { status: 'COMPLETE' });
    expect(complete?.status).toBe('COMPLETE');
  });

  it('RUNNING -> FAILED records the error', async () => {
    const d = await deps();
    const created = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });
    await transitionSearch(d, 'token-a', created.id, { status: 'RUNNING' });

    const failed = await transitionSearch(d, 'token-a', created.id, {
      status: 'FAILED',
      error: 'provider timeout',
    });
    expect(failed?.status).toBe('FAILED');
    expect(failed?.lastError).toBe('provider timeout');
  });

  it('PENDING -> CANCELLED is permitted', async () => {
    const d = await deps();
    const created = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });
    const cancelled = await transitionSearch(d, 'token-a', created.id, { status: 'CANCELLED' });
    expect(cancelled?.status).toBe('CANCELLED');
  });

  it('rejects an invalid transition (PENDING -> COMPLETE)', async () => {
    const d = await deps();
    const created = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });
    await expect(
      transitionSearch(d, 'token-a', created.id, { status: 'COMPLETE' }),
    ).rejects.toBeInstanceOf(SearchInvalidTransitionError);
  });

  it('rejects any transition out of a terminal state', async () => {
    const d = await deps();
    const created = await createSearch(d, 'token-a', { serviceProfileId: d.profileA.id });
    await transitionSearch(d, 'token-a', created.id, { status: 'CANCELLED' });

    await expect(
      transitionSearch(d, 'token-a', created.id, { status: 'RUNNING' }),
    ).rejects.toBeInstanceOf(SearchInvalidTransitionError);
  });
});

describe('identity boundary', () => {
  it('the created Search is owned by the authenticated user, never a value smuggled through input', async () => {
    const d = await deps();
    const input = {
      serviceProfileId: d.profileA.id,
      userId: 'user_b',
    } as unknown as Parameters<typeof createSearch>[2];
    const created = await createSearch(d, 'token-a', input);
    expect(created.userId).toBe('user_a');
  });

  it('an unauthenticated call never reaches the repository', async () => {
    const d = await deps();
    await expect(createSearch(d, null, { serviceProfileId: d.profileA.id })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    expect(d.searches.rows).toHaveLength(0);
  });

  it('an unknown token never reaches the repository', async () => {
    const d = await deps();
    await expect(listSearches(d, 'not-a-real-token')).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
