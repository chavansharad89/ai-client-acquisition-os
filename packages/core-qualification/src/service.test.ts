import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import { OpportunityNotFoundError, type OpportunityRepository, type StoredOpportunity } from '@acos/core-opportunity';
import type { ResearchSignalRepository, StoredResearchSignal } from '@acos/core-research';
import { describe, expect, it } from 'vitest';

import {
  evaluateOpportunityQualification,
  evaluateQualificationForOwner,
  EVALUATOR_VERSION,
  getOpportunityQualification,
  type QualificationDeps,
} from './service';
import { fakeQualificationRepository } from './testSupport';

// UNIT tests (fakes only — local fakes of other packages' repository
// interfaces, mirroring apps/worker/src/searchWorker/worker.test.ts's own
// convention: never that other package's unexported testSupport.ts). See
// tests/integration/qualification.integration.test.ts for the
// real-Postgres proof of the same ownership boundary and migration 0022
// schema.

const NOW = new Date('2026-03-01T00:00:00.000Z');

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

/** A minimal local fake of @acos/core-opportunity's OpportunityRepository — unexported internal to that package's own tests too. */
function fakeOpportunityRepository(seed: StoredOpportunity[] = []): OpportunityRepository {
  const rows = [...seed];
  return {
    async create() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
    async findByProspectId() {
      throw new Error('not used by these tests');
    },
    async list() {
      throw new Error('not used by these tests');
    },
    async updateStaleness() {
      throw new Error('not used by these tests');
    },
  };
}

/**
 * A minimal local fake of @acos/core-research's ResearchSignalRepository.
 * Shares the `seed` array by reference (not a copy) so a caller can
 * mutate it in place — e.g. to simulate a signal being superseded
 * between two evaluations — and have `listByProspect` observe the change.
 */
function fakeResearchSignalRepository(seed: StoredResearchSignal[] = []): ResearchSignalRepository {
  const rows = seed;
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

function seedOpportunity(overrides: Partial<StoredOpportunity> = {}): StoredOpportunity {
  return {
    id: 'opportunity_1',
    userId: 'user_a',
    prospectId: 'prospect_1',
    state: 'NEW',
    needDetected: true,
    offer: {
      service: 'AI content system',
      rationale: 'They are hiring for content.',
      estimatedValuePaise: 15_000_000,
      fit: 80,
      basedOn: ['hiring a content writer'],
    },
    staleness: 'FRESH',
    stalenessComputedAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

function seedSignal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_1',
    field: 'visibleProblems',
    kind: 'JOB_POST',
    classification: 'OBSERVED',
    signal: 'hiring a content writer',
    confidence: 88,
    basis: null,
    observedAt: NOW,
    supersededAt: null,
    sources: [],
    ...overrides,
  };
}

function deps(
  opportunities: StoredOpportunity[],
  signals: StoredResearchSignal[] = [],
): QualificationDeps {
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
  });
  const opportunityRepo = fakeOpportunityRepository(opportunities);
  return {
    identity,
    opportunities: opportunityRepo,
    signals: fakeResearchSignalRepository(signals),
    qualifications: fakeQualificationRepository(opportunities),
  };
}

describe('evaluateOpportunityQualification / evaluateQualificationForOwner', () => {
  it('evaluates and persists a QUALIFIED result for a caller\'s own Opportunity', async () => {
    const d = deps([seedOpportunity()], [seedSignal()]);

    const stored = await evaluateOpportunityQualification(d, 'token-a', 'opportunity_1', NOW);

    expect(stored.state).toBe('QUALIFIED');
    expect(stored.opportunityId).toBe('opportunity_1');
    expect(stored.prospectId).toBe('prospect_1');
    expect(stored.evaluatorVersion).toBe(EVALUATOR_VERSION);
    expect(stored.evaluatedAt).toEqual(NOW);
  });

  it('rejects an unauthenticated request before touching any repository', async () => {
    const d = deps([seedOpportunity()]);
    await expect(
      evaluateOpportunityQualification(d, null, 'opportunity_1'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('throws OpportunityNotFoundError for an unknown opportunityId (R-37: "no qualifying Opportunity")', async () => {
    const d = deps([]);
    await expect(
      evaluateQualificationForOwner(d, 'user_a', 'does-not-exist', NOW),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different user's Opportunity is treated as not found — ownership isolation", async () => {
    const d = deps([seedOpportunity({ userId: 'user_a' })], [seedSignal()]);

    await expect(
      evaluateOpportunityQualification(d, 'token-b', 'opportunity_1'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it('idempotency: repeated evaluation of unchanged evidence overwrites the same row, no duplicates', async () => {
    const d = deps([seedOpportunity()], [seedSignal()]);

    const first = await evaluateQualificationForOwner(d, 'user_a', 'opportunity_1', NOW);
    const later = new Date(NOW.getTime() + 60_000);
    const second = await evaluateQualificationForOwner(d, 'user_a', 'opportunity_1', later);

    expect(second.id).toBe(first.id);
    expect(second.state).toBe(first.state);
    expect(second.criteria).toEqual(first.criteria);
    expect(second.evaluatedAt).toEqual(later);

    const repo = d.qualifications as ReturnType<typeof fakeQualificationRepository>;
    expect(repo.rows.filter((row) => row.opportunityId === 'opportunity_1')).toHaveLength(1);
  });

  it('re-evaluation: evidence superseded between two calls changes the persisted state', async () => {
    const signal = seedSignal();
    const opportunities = [seedOpportunity()];
    const identity = fakeIdentity({ ...sessionFor('token-a', 'user_a') });
    const signalRows = [signal];
    const opportunityRepo = fakeOpportunityRepository(opportunities);
    const d: QualificationDeps = {
      identity,
      opportunities: opportunityRepo,
      signals: fakeResearchSignalRepository(signalRows),
      qualifications: fakeQualificationRepository(opportunities),
    };

    const first = await evaluateQualificationForOwner(d, 'user_a', 'opportunity_1', NOW);
    expect(first.state).toBe('QUALIFIED');

    // Simulate a re-research run superseding the only evidentiary signal.
    signalRows[0] = { ...signal, supersededAt: NOW };

    const second = await evaluateQualificationForOwner(
      d,
      'user_a',
      'opportunity_1',
      new Date(NOW.getTime() + 60_000),
    );

    expect(second.state).toBe('INSUFFICIENT_EVIDENCE');
    expect(second.id).toBe(first.id); // same row, replaced — not a second row
  });
});

describe('getOpportunityQualification', () => {
  it('returns the persisted qualification for the caller', async () => {
    const d = deps([seedOpportunity()], [seedSignal()]);
    const stored = await evaluateOpportunityQualification(d, 'token-a', 'opportunity_1', NOW);

    const fetched = await getOpportunityQualification(d, 'token-a', 'opportunity_1');
    expect(fetched).toEqual(stored);
  });

  it('returns null when the Opportunity has never been evaluated', async () => {
    const d = deps([seedOpportunity()], [seedSignal()]);
    await expect(
      getOpportunityQualification(d, 'token-a', 'opportunity_1'),
    ).resolves.toBeNull();
  });

  it("a different user cannot retrieve user A's qualification result", async () => {
    const d = deps([seedOpportunity()], [seedSignal()]);
    await evaluateOpportunityQualification(d, 'token-a', 'opportunity_1', NOW);

    await expect(
      getOpportunityQualification(d, 'token-b', 'opportunity_1'),
    ).resolves.toBeNull();
  });
});
