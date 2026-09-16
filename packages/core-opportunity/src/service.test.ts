import type { ProspectRepository, StoredProspect } from '@acos/core-discovery';
import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import type { ResearchSignalRepository, StoredResearchSignal } from '@acos/core-research';
import type { SearchRepository, StoredSearch } from '@acos/core-search';
import type { ServiceProfileFields } from '@acos/core-service-profile';
import { describe, expect, it } from 'vitest';

import { CreateOpportunityValidationError, OpportunityProspectNotFoundError } from './errors';
import { createOpportunity, type OpportunityDeps } from './service';
import { fakeOpportunityRepository } from './testSupport';

// UNIT tests (fakes only — see
// tests/integration/opportunity.integration.test.ts for the real-Postgres
// proof of the same ownership boundary and the migration 0017 schema).
// Mirrors @acos/core-research's service.test.ts conventions.

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

/** A minimal local fake of @acos/core-discovery's ProspectRepository — unexported internal to that package's tests. */
function fakeProspectRepository(seed: StoredProspect[] = []): ProspectRepository {
  const rows = [...seed];
  return {
    async findOrCreate() {
      throw new Error('not used by these tests');
    },
    async listBySearch() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
  };
}

/** A minimal local fake of @acos/core-search's SearchRepository — unexported internal to that package's tests. */
function fakeSearchRepository(seed: StoredSearch[] = []): SearchRepository {
  const rows = [...seed];
  return {
    async create() {
      throw new Error('not used by these tests');
    },
    async findByIdempotencyKey() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
    async list() {
      throw new Error('not used by these tests');
    },
    async transition() {
      throw new Error('not used by these tests');
    },
  };
}

/** A minimal local fake of @acos/core-research's ResearchSignalRepository — unexported internal to that package's tests. */
function fakeResearchSignalRepository(seed: StoredResearchSignal[] = []): ResearchSignalRepository {
  const rows = [...seed];
  return {
    async supersedePrevious() {
      throw new Error('not used by these tests');
    },
    async saveSignals() {
      throw new Error('not used by these tests');
    },
    async listByProspect(userId: string, prospectId: string) {
      return rows.filter((row) => row.prospectId === prospectId && row.supersededAt === null);
    },
  };
}

function seedProspect(overrides: Partial<StoredProspect> = {}): StoredProspect {
  return {
    id: 'prospect_1',
    userId: 'user_a',
    searchId: 'search_1',
    companyId: 'company_1',
    status: 'DISCOVERED',
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function serviceProfileFields(overrides: Partial<ServiceProfileFields> = {}): ServiceProfileFields {
  return {
    service: 'AI content system',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST'],
    keywords: ['content', 'writer'],
    rationale: 'They are hiring for content ({signal}) — a system delivers it without a headcount.',
    ...overrides,
  };
}

function seedSearch(overrides: Partial<StoredSearch> = {}): StoredSearch {
  return {
    id: 'search_1',
    userId: 'user_a',
    serviceProfileId: 'profile_1',
    status: 'RUNNING',
    parameters: serviceProfileFields(),
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

const HOMEPAGE = { url: 'https://acme.test/careers', label: 'careers' };

function matchingSignal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_1',
    field: 'visibleProblems',
    kind: 'JOB_POST',
    classification: 'OBSERVED',
    signal: 'hiring a content writer',
    confidence: 88,
    basis: null,
    observedAt: new Date('2026-01-01T00:00:00.000Z'),
    supersededAt: null,
    sources: [
      { id: 'source_1', sourceUrl: HOMEPAGE.url, sourceQuote: 'x', sourceLabel: HOMEPAGE.label },
    ],
    ...overrides,
  };
}

function deps(
  prospects: StoredProspect[],
  searches: StoredSearch[],
  signals: StoredResearchSignal[] = [],
): OpportunityDeps {
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
  });
  return {
    identity,
    prospects: fakeProspectRepository(prospects),
    searches: fakeSearchRepository(searches),
    signals: fakeResearchSignalRepository(signals),
    opportunities: fakeOpportunityRepository(),
  };
}

describe('createOpportunity', () => {
  it("detects a need and recommends an offer from the caller's own Prospect (R-11/R-12/R-13)", async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);

    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

    expect(opportunity.userId).toBe('user_a');
    expect(opportunity.prospectId).toBe('prospect_1');
    expect(opportunity.state).toBe('NEW');
    expect(opportunity.needDetected).toBe(true);
    expect(opportunity.offer).toEqual({
      service: 'AI content system',
      rationale:
        'They are hiring for content (hiring a content writer) — a system delivers it without a headcount.',
      estimatedValuePaise: 3_000_000,
      fit: 88,
      basedOn: ['hiring a content writer'],
    });
  });

  it('AC-13/AC-14: insufficient evidence records no detected need and NO SUITABLE OFFER, never a default to the caller’s own service', async () => {
    const d = deps([seedProspect()], [seedSearch()], []);

    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

    expect(opportunity.needDetected).toBe(false);
    expect(opportunity.offer).toBeUndefined();
  });

  it('a Prospect with only non-matching signals also records NO SUITABLE OFFER', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch()],
      [matchingSignal({ signal: 'nothing relevant here', kind: 'REVIEW' })],
    );

    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

    expect(opportunity.needDetected).toBe(false);
    expect(opportunity.offer).toBeUndefined();
  });

  it('created at state NEW', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });
    expect(opportunity.state).toBe('NEW');
  });

  it('rejects an unauthenticated call before touching any repository', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);

    await expect(createOpportunity(d, null, { prospectId: 'prospect_1' })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
    await expect(d.opportunities.list('user_a')).resolves.toHaveLength(0);
  });

  it('an unknown prospectId is rejected', async () => {
    const d = deps([], [], []);

    await expect(
      createOpportunity(d, 'token-a', { prospectId: 'does-not-exist' }),
    ).rejects.toBeInstanceOf(OpportunityProspectNotFoundError);
  });

  it('a Prospect owned by another user is treated as not found — never accepts a caller-supplied userId', async () => {
    const d = deps(
      [seedProspect({ userId: 'user_b' })],
      [seedSearch({ userId: 'user_b' })],
      [matchingSignal()],
    );

    await expect(
      createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }),
    ).rejects.toBeInstanceOf(OpportunityProspectNotFoundError);
  });

  it('rejects a missing prospectId before any repository call', async () => {
    const d = deps([], [], []);

    await expect(createOpportunity(d, 'token-a', { prospectId: '' })).rejects.toBeInstanceOf(
      CreateOpportunityValidationError,
    );
  });

  it('is deterministic across repeated calls given the same signals and profile', async () => {
    const d1 = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const d2 = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const now = new Date('2026-07-01T09:00:00.000Z');

    const first = await createOpportunity(d1, 'token-a', { prospectId: 'prospect_1' }, now);
    const second = await createOpportunity(d2, 'token-a', { prospectId: 'prospect_1' }, now);

    expect(second.needDetected).toEqual(first.needDetected);
    expect(second.offer).toEqual(first.offer);
    expect(second.state).toEqual(first.state);
  });
});
