import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import type { SearchRepository, SearchStatus, StoredSearch } from '@acos/core-search';
import { describe, expect, it } from 'vitest';

import { DiscoveryInvalidSearchStateError, DiscoverySearchNotFoundError } from './errors';
import { normalizeDomain } from './normalize';
import { runDiscovery } from './service';
import {
  fakeCompanyRepository,
  fakeDiscoveryProvider,
  fakeProspectRepository,
} from './testSupport';

// UNIT tests (fakes only — see
// tests/integration/discovery.integration.test.ts for the real-Postgres
// proof of the same ownership boundary and dedup constraints).

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
 * A minimal local fake of @acos/core-search's SearchRepository — not that
 * package's own fake (unexported, internal to its src/), just enough
 * behaviour for this package's tests to seed a Search in a chosen status
 * and read it back scoped by owner.
 */
function fakeSearchRepository(
  seed: StoredSearch[] = [],
): SearchRepository & { rows: StoredSearch[] } {
  const rows = [...seed];

  return {
    rows,
    async create() {
      throw new Error('not used by these tests');
    },
    async findByIdempotencyKey() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
    async list(userId: string) {
      return rows.filter((row) => row.userId === userId);
    },
    async transition(userId: string, id: string, from: SearchStatus, to: SearchStatus) {
      const index = rows.findIndex(
        (row) => row.id === id && row.userId === userId && row.status === from,
      );
      if (index === -1) return null;
      const updated = { ...rows[index]!, status: to };
      rows[index] = updated;
      return updated;
    },
    async claimNextPending() {
      throw new Error('not used by these tests');
    },
    async releaseExpiredLeases() {
      throw new Error('not used by these tests');
    },
    async completeClaimed() {
      throw new Error('not used by these tests');
    },
    async recordAttemptFailure() {
      throw new Error('not used by these tests');
    },
  };
}

function seedSearch(overrides: Partial<StoredSearch> = {}): StoredSearch {
  return {
    id: 'search_1',
    userId: 'user_a',
    serviceProfileId: 'svcprofile_1',
    status: 'RUNNING',
    parameters: {
      service: 'Website development',
      targetCustomer: 'Restaurants',
      geography: 'Mumbai',
      minProjectValuePaise: 3_000_000,
      triggers: ['JOB_POST'],
      keywords: ['website', 'redesign'],
      rationale: 'They lack a working website.',
    },
    attempts: 1,
    lastError: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    idempotencyKey: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function deps(searchSeed: StoredSearch[], candidates: Parameters<typeof fakeDiscoveryProvider>[0]) {
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
    ...sessionFor('entitlement-token', null as unknown as string),
  });
  return {
    identity,
    searches: fakeSearchRepository(searchSeed),
    companies: fakeCompanyRepository(),
    prospects: fakeProspectRepository(),
    provider: fakeDiscoveryProvider(candidates),
  };
}

describe('discovery execution', () => {
  it('an authenticated user discovers businesses against their own RUNNING Search', async () => {
    const search = seedSearch();
    const d = deps(
      [search],
      [
        { name: 'Acme Co', website: 'https://acme.example.com' },
        { name: 'Beta LLC', website: 'https://beta.example.com' },
      ],
    );

    const result = await runDiscovery(d, 'token-a', { searchId: search.id });

    expect(result.searchId).toBe(search.id);
    expect(result.companies).toHaveLength(2);
    expect(result.prospects).toHaveLength(2);
    expect(result.skipped).toBe(0);
    for (const company of result.companies) expect(company.userId).toBe('user_a');
    for (const prospect of result.prospects) {
      expect(prospect.userId).toBe('user_a');
      expect(prospect.searchId).toBe(search.id);
      expect(prospect.status).toBe('DISCOVERED');
    }
  });

  it('an unauthenticated call never reaches the repository or provider', async () => {
    const search = seedSearch();
    const d = deps([search], [{ name: 'Acme Co', website: 'https://acme.example.com' }]);

    await expect(runDiscovery(d, null, { searchId: search.id })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    expect(d.companies.rows).toHaveLength(0);
    expect(d.prospects.rows).toHaveLength(0);
  });

  it('an entitlement-only token (user_id IS NULL) is rejected, not authenticated as a session', async () => {
    const search = seedSearch();
    const d = deps([search], []);

    await expect(
      runDiscovery(d, 'entitlement-token', { searchId: search.id }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('a caller-supplied userId in the input cannot override the authenticated identity', async () => {
    const search = seedSearch();
    const d = deps([search], [{ name: 'Acme Co', website: 'https://acme.example.com' }]);

    const input = {
      searchId: search.id,
      userId: 'user_b',
    } as unknown as Parameters<typeof runDiscovery>[2];
    const result = await runDiscovery(d, 'token-a', input);

    expect(result.companies[0]?.userId).toBe('user_a');
  });

  it('a Search owned by another user is treated as not found', async () => {
    const search = seedSearch({ userId: 'user_b' });
    const d = deps([search], []);

    await expect(runDiscovery(d, 'token-a', { searchId: search.id })).rejects.toBeInstanceOf(
      DiscoverySearchNotFoundError,
    );
  });

  it('an unknown searchId is rejected', async () => {
    const d = deps([], []);

    await expect(runDiscovery(d, 'token-a', { searchId: 'does-not-exist' })).rejects.toBeInstanceOf(
      DiscoverySearchNotFoundError,
    );
  });

  it('discovery cannot execute against a Search that is not RUNNING', async () => {
    const search = seedSearch({ status: 'PENDING' });
    const d = deps([search], []);

    await expect(runDiscovery(d, 'token-a', { searchId: search.id })).rejects.toBeInstanceOf(
      DiscoveryInvalidSearchStateError,
    );
  });

  it('duplicate candidates within one run do not create duplicate Company or Prospect rows', async () => {
    const search = seedSearch();
    const d = deps(
      [search],
      [
        { name: 'Acme Co', website: 'https://acme.example.com' },
        { name: 'Acme Co (again)', website: 'https://www.acme.example.com/' },
      ],
    );

    const result = await runDiscovery(d, 'token-a', { searchId: search.id });

    expect(result.companies).toHaveLength(2);
    expect(new Set(result.companies.map((c) => c.id)).size).toBe(1);
    expect(d.companies.rows).toHaveLength(1);
    expect(d.prospects.rows).toHaveLength(1);
  });

  it('re-running discovery for the same Search is idempotent', async () => {
    const search = seedSearch();
    const d = deps([search], [{ name: 'Acme Co', website: 'https://acme.example.com' }]);

    await runDiscovery(d, 'token-a', { searchId: search.id });
    await runDiscovery(d, 'token-a', { searchId: search.id });

    expect(d.companies.rows).toHaveLength(1);
    expect(d.prospects.rows).toHaveLength(1);
  });

  it('invalid or incomplete provider candidates are skipped, not persisted or thrown', async () => {
    const search = seedSearch();
    const d = deps(
      [search],
      [
        { name: 'Acme Co', website: 'https://acme.example.com' },
        { name: '', website: 'https://noname.example.com' },
        { name: 'No Website Co', website: null },
        { name: 'Bad URL Co', website: 'not a url and no dots' },
        {},
      ],
    );

    const result = await runDiscovery(d, 'token-a', { searchId: search.id });

    expect(result.companies).toHaveLength(1);
    expect(result.skipped).toBe(4);
  });
});

describe('normalizeDomain', () => {
  it('is deterministic across protocol, www, trailing slash and case differences', () => {
    const variants = [
      'https://Acme.example.com/',
      'http://www.acme.example.com',
      'acme.example.com',
      'https://acme.example.com:443/path?x=1',
    ];
    const normalized = variants.map(normalizeDomain);
    expect(new Set(normalized).size).toBe(1);
    expect(normalized[0]).toBe('acme.example.com');
  });

  it('returns null for an unusable value', () => {
    expect(normalizeDomain('')).toBeNull();
    expect(normalizeDomain('   ')).toBeNull();
    expect(normalizeDomain('not a url and no dots')).toBeNull();
  });
});
