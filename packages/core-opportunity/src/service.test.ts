import {
  rankProspects,
  scoreProspect,
  type ProspectInput,
  type ProspectScore,
} from '@acos/core-acquisition';
import type { ProspectRepository, StoredProspect } from '@acos/core-discovery';
import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import {
  toScoringSignals,
  type ResearchSignalRepository,
  type StoredResearchSignal,
} from '@acos/core-research';
import type { SearchRepository, StoredSearch } from '@acos/core-search';
import type { ServiceProfileFields } from '@acos/core-service-profile';
import { describe, expect, it } from 'vitest';

import {
  CreateOpportunityValidationError,
  FeedbackValidationError,
  OpportunityNotFoundError,
  OpportunityProspectNotFoundError,
} from './errors';
import {
  classifyOpportunityStaleness,
  createOpportunity,
  getFeedback,
  getOpportunityNextAction,
  getOpportunityScore,
  getOpportunityTrackingSummary,
  rankOpportunities,
  recordFeedback,
  scoreOpportunity,
  SCORER_VERSION,
  type OpportunityDeps,
  type OpportunityFeedbackDeps,
  type OpportunityScoreDeps,
} from './service';
import {
  fakeFeedbackRepository,
  fakeOpportunityRepository,
  fakeOpportunityScoreRepository,
} from './testSupport';
import type { StoredOpportunity } from './types';

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
): OpportunityDeps & OpportunityScoreDeps & OpportunityFeedbackDeps {
  const identity = fakeIdentity({
    ...sessionFor('token-a', 'user_a'),
    ...sessionFor('token-b', 'user_b'),
  });
  const opportunities = fakeOpportunityRepository();
  return {
    identity,
    prospects: fakeProspectRepository(prospects),
    searches: fakeSearchRepository(searches),
    signals: fakeResearchSignalRepository(signals),
    opportunities,
    scores: fakeOpportunityScoreRepository(opportunities.rows),
    feedback: fakeFeedbackRepository(),
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

// ---- Phase 10: scoreOpportunity / getOpportunityScore -------------------
// Mirrors tests/integration/opportunity-score.integration.test.ts's
// real-Postgres proof of the same ownership boundary and migration
// 0018 schema.

const NOW = new Date('2026-07-01T09:00:00.000Z');

/**
 * Builds the exact ProspectInput scoreOpportunity() is documented to
 * construct (see service.ts's neutralScoringInputs()/
 * serviceFitFromOffer()), so tests can verify the wiring produces
 * precisely what a direct scoreProspect() call would — without
 * re-deriving prospectScore.ts's own arithmetic (covered by that
 * package's own prospectScore.test.ts) and without inventing any new
 * detection logic of its own.
 */
function expectedInput(
  storedSignals: StoredResearchSignal[],
  offer?: { fit: number; service: string },
): ProspectInput {
  const { signals } = toScoringSignals(storedSignals);
  return {
    signals,
    icp: {
      industryMatch: { value: null, basis: 'UNKNOWN' },
      sizeMatch: { value: null, basis: 'UNKNOWN' },
      geoMatch: { value: null, basis: 'UNKNOWN' },
    },
    abilityToPay: { value: null, basis: 'UNKNOWN' },
    urgency: { value: null, basis: 'UNKNOWN' },
    serviceFit: offer
      ? {
          value: offer.fit,
          basis: 'OBSERVED',
          note: `service fit ${offer.fit}/100 (recommended offer: ${offer.service})`,
        }
      : { value: null, basis: 'UNKNOWN' },
    contact: { hasEmail: false, hasLinkedIn: false, hasPhone: false, unsubscribed: false },
  };
}

describe('scoreOpportunity', () => {
  it('derives serviceFit from Opportunity.offer.fit and persists every factor (weight/raw/points/basis/reason)', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    const expected = scoreProspect(
      expectedInput([matchingSignal()], {
        fit: opportunity.offer!.fit,
        service: opportunity.offer!.service,
      }),
      NOW,
    );

    expect(stored.opportunityId).toBe(opportunity.id);
    expect(stored.total).toBe(expected.score);
    expect(stored.band).toBe(expected.band);
    expect(stored.factors).toHaveLength(7);
    expect(stored.factors).toEqual(expected.factors);
    expect(stored.reasons).toEqual(expected.reasons);
    expect(stored.observedShare).toBe(expected.observedShare);
    expect(stored.cap).toEqual(expected.cap);
    expect(stored.scorerVersion).toBe(SCORER_VERSION);
    expect(stored.scoredAt).toEqual(NOW);

    const serviceFit = stored.factors.find((f) => f.factor === 'serviceFit')!;
    expect(serviceFit.basis).toBe('OBSERVED');
    expect(serviceFit.raw).toBeCloseTo(opportunity.offer!.fit / 100, 5);
  });

  it('uses the scorer’s neutral/UNKNOWN representation for icp, abilityToPay, urgency and contact — never inventing detection logic', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);
    const byFactor = Object.fromEntries(stored.factors.map((f) => [f.factor, f]));

    expect(byFactor.icpFit!.basis).toBe('UNKNOWN');
    expect(byFactor.icpFit!.points).toBe(0);
    expect(byFactor.abilityToPay!.basis).toBe('UNKNOWN');
    expect(byFactor.abilityToPay!.points).toBe(0);
    expect(byFactor.urgency!.basis).toBe('UNKNOWN');
    expect(byFactor.urgency!.points).toBe(0);
    // contactability has no UNKNOWN basis in the scorer's own contract
    // (prospectScore.ts always reports it OBSERVED) — "no channels known"
    // is expressed as zero channels, not a fabricated one.
    expect(byFactor.contactability!.raw).toBe(0);
    expect(byFactor.contactability!.points).toBe(0);
  });

  it('AC-14: an Opportunity with NO SUITABLE OFFER scores serviceFit as UNKNOWN, never a fabricated offer', async () => {
    const d = deps([seedProspect()], [seedSearch()], []);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    expect(opportunity.offer).toBeUndefined();

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);
    const serviceFit = stored.factors.find((f) => f.factor === 'serviceFit')!;

    expect(serviceFit.basis).toBe('UNKNOWN');
    expect(serviceFit.raw).toBe(0);
    expect(serviceFit.points).toBe(0);
  });

  it('applies the inference discount exactly once for an INFERRED signal reaching the scorer', async () => {
    // 100 halved ONCE by toScoringSignals -> 50 -> just clears
    // prospectScore.ts's own confidence>=50 gate for visibleProblem, so
    // the signal counts at raw 0.5. A second, doubled discount would
    // produce 25 -> below the gate -> raw 0, basis UNKNOWN instead.
    const inferred = matchingSignal({
      classification: 'INFERRED',
      confidence: 100,
      basis: 'reasoned from job posts',
      observedAt: NOW,
    });
    const d = deps([seedProspect()], [seedSearch()], [inferred]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);
    const visibleProblem = stored.factors.find((f) => f.factor === 'visibleProblem')!;

    expect(visibleProblem.basis).toBe('OBSERVED');
    expect(visibleProblem.raw).toBeCloseTo(0.5, 5);
  });

  it('adapts a mixed OBSERVED/INFERRED/UNKNOWN signal batch identically to a direct scoreProspect() call', async () => {
    const observed = matchingSignal({ id: 's1', classification: 'OBSERVED', confidence: 90 });
    const inferred = matchingSignal({
      id: 's2',
      classification: 'INFERRED',
      confidence: 60,
      basis: 'reasoned',
      kind: 'REVIEW',
      signal: 'slow support response times',
    });
    const unknown = matchingSignal({
      id: 's3',
      classification: 'UNKNOWN',
      signal: null,
      confidence: 0,
    });
    const mixedSignals = [observed, inferred, unknown];
    const d = deps([seedProspect()], [seedSearch()], mixedSignals);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);
    const expected = scoreProspect(
      expectedInput(
        mixedSignals,
        opportunity.offer && { fit: opportunity.offer.fit, service: opportunity.offer.service },
      ),
      NOW,
    );

    expect(stored.factors).toEqual(expected.factors);
    expect(stored.total).toBe(expected.score);
  });

  it('is deterministic — scoring the same Opportunity twice with the same inputs produces an identical score', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const first = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);
    const second = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    expect(second.total).toBe(first.total);
    expect(second.band).toBe(first.band);
    expect(second.factors).toEqual(first.factors);
    expect(second.scorerVersion).toBe(first.scorerVersion);
  });

  it('re-scoring replaces the current score in place — one row per Opportunity, never a second', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const first = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);
    const later = new Date(NOW.getTime() + 86_400_000);
    const second = await scoreOpportunity(d, 'token-a', opportunity.id, later);

    expect(second.id).toBe(first.id);
    expect(second.scoredAt).toEqual(later);

    const current = await getOpportunityScore(d, 'token-a', opportunity.id, later);
    expect(current).toEqual(second);
  });

  it('rejects an unauthenticated call before touching any repository', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    await expect(scoreOpportunity(d, null, opportunity.id)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('a different authenticated user cannot score another user’s Opportunity — treated as not found', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    await expect(scoreOpportunity(d, 'token-b', opportunity.id, NOW)).rejects.toBeInstanceOf(
      OpportunityNotFoundError,
    );
  });

  it('an unknown opportunityId is rejected', async () => {
    const d = deps([], [], []);

    await expect(scoreOpportunity(d, 'token-a', 'does-not-exist', NOW)).rejects.toBeInstanceOf(
      OpportunityNotFoundError,
    );
  });
});

describe('getOpportunityScore', () => {
  it('returns null when the Opportunity has never been scored', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    await expect(getOpportunityScore(d, 'token-a', opportunity.id, NOW)).resolves.toBeNull();
  });

  it('returns the persisted score after scoreOpportunity', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    await expect(getOpportunityScore(d, 'token-a', opportunity.id, NOW)).resolves.toEqual(stored);
  });

  it('a different user cannot read another user’s OpportunityScore — isolation, not retrieve-then-filter', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    await expect(getOpportunityScore(d, 'token-b', opportunity.id, NOW)).resolves.toBeNull();
  });

  it('rejects an unauthenticated read', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    await expect(getOpportunityScore(d, null, opportunity.id, NOW)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });
});

// ---- Phase 11: rankOpportunities ----------------------------------------
// Mirrors tests/integration/opportunity-ranking.integration.test.ts's
// real-Postgres proof of the same ownership boundary. Scores are seeded
// directly via d.scores.upsert() with hand-built ProspectScore values —
// rankOpportunities() only orders already-persisted scores, so these
// tests do not need to re-derive scoreOpportunity()'s own wiring
// (covered above) or prospectScore.ts's arithmetic (covered by that
// package's own tests).

/** A minimal, valid ProspectScore for seeding — only `score`/`observedShare`/`id` drive ranking order. */
function sampleScore(overrides: Partial<ProspectScore> = {}): ProspectScore {
  const base: ProspectScore = {
    score: 50,
    band: 'MEDIUM',
    factors: [
      {
        factor: 'icpFit',
        weight: 20,
        raw: 0.5,
        points: 10,
        basis: 'OBSERVED',
        reason: 'Observed: sample signal',
      },
    ],
    reasons: ['Observed: sample signal (+10)'],
    observedShare: 0.5,
  };
  return { ...base, ...overrides };
}

describe('rankOpportunities', () => {
  it('orders scored Opportunities by total score, descending (R-15/AC-17)', async () => {
    const d = deps(
      [
        seedProspect({ id: 'prospect_1' }),
        seedProspect({ id: 'prospect_2', companyId: 'company_2' }),
        seedProspect({ id: 'prospect_3', companyId: 'company_3' }),
      ],
      [seedSearch()],
    );
    const opp1 = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const opp2 = await createOpportunity(d, 'token-a', { prospectId: 'prospect_2' }, NOW);
    const opp3 = await createOpportunity(d, 'token-a', { prospectId: 'prospect_3' }, NOW);
    await d.scores.upsert(opp1.id, sampleScore({ score: 80 }), 'v1', NOW);
    await d.scores.upsert(opp2.id, sampleScore({ score: 50 }), 'v1', NOW);
    await d.scores.upsert(opp3.id, sampleScore({ score: 90 }), 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked.map((r) => r.opportunityId)).toEqual([opp3.id, opp1.id, opp2.id]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('matches rankProspects() called directly on the same candidates — the comparator is not reimplemented', async () => {
    const d = deps(
      [
        seedProspect({ id: 'prospect_1' }),
        seedProspect({ id: 'prospect_2', companyId: 'company_2' }),
        seedProspect({ id: 'prospect_3', companyId: 'company_3' }),
      ],
      [seedSearch()],
    );
    const opp1 = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const opp2 = await createOpportunity(d, 'token-a', { prospectId: 'prospect_2' }, NOW);
    const opp3 = await createOpportunity(d, 'token-a', { prospectId: 'prospect_3' }, NOW);
    const s1 = await d.scores.upsert(
      opp1.id,
      sampleScore({ score: 65, observedShare: 0.4 }),
      'v1',
      NOW,
    );
    const s2 = await d.scores.upsert(
      opp2.id,
      sampleScore({ score: 65, observedShare: 0.9 }),
      'v1',
      NOW,
    );
    const s3 = await d.scores.upsert(
      opp3.id,
      sampleScore({ score: 30, observedShare: 0.1 }),
      'v1',
      NOW,
    );

    const direct = rankProspects(
      [s1, s2, s3].map((s) => ({
        id: s.opportunityId,
        score: {
          score: s.total,
          band: s.band,
          factors: s.factors,
          reasons: s.reasons,
          observedShare: s.observedShare,
          ...(s.cap !== undefined ? { cap: s.cap } : {}),
        },
      })),
    );

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked.map((r) => r.opportunityId)).toEqual(direct.map((c) => c.id));
  });

  it('breaks a tie on total score by observedShare, descending', async () => {
    const d = deps(
      [
        seedProspect({ id: 'prospect_1' }),
        seedProspect({ id: 'prospect_2', companyId: 'company_2' }),
      ],
      [seedSearch()],
    );
    const low = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const high = await createOpportunity(d, 'token-a', { prospectId: 'prospect_2' }, NOW);
    await d.scores.upsert(low.id, sampleScore({ score: 70, observedShare: 0.2 }), 'v1', NOW);
    await d.scores.upsert(high.id, sampleScore({ score: 70, observedShare: 0.8 }), 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked.map((r) => r.opportunityId)).toEqual([high.id, low.id]);
  });

  it('breaks a tie on total score and observedShare by opportunity id, ascending', async () => {
    const d = deps(
      [
        seedProspect({ id: 'prospect_1' }),
        seedProspect({ id: 'prospect_2', companyId: 'company_2' }),
      ],
      [seedSearch()],
    );
    const first = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const second = await createOpportunity(d, 'token-a', { prospectId: 'prospect_2' }, NOW);
    expect(first.id < second.id).toBe(true);
    await d.scores.upsert(first.id, sampleScore({ score: 60, observedShare: 0.5 }), 'v1', NOW);
    await d.scores.upsert(second.id, sampleScore({ score: 60, observedShare: 0.5 }), 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked.map((r) => r.opportunityId)).toEqual([first.id, second.id]);
  });

  it('excludes an Opportunity that has never been scored', async () => {
    const d = deps(
      [
        seedProspect({ id: 'prospect_1' }),
        seedProspect({ id: 'prospect_2', companyId: 'company_2' }),
      ],
      [seedSearch()],
    );
    const scored = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const unscored = await createOpportunity(d, 'token-a', { prospectId: 'prospect_2' }, NOW);
    await d.scores.upsert(scored.id, sampleScore(), 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.opportunityId).toBe(scored.id);
    expect(ranked.some((r) => r.opportunityId === unscored.id)).toBe(false);
  });

  it("does not include another user's Opportunities, even when scored higher", async () => {
    const d = deps(
      [
        seedProspect({ id: 'prospect_1' }),
        seedProspect({
          id: 'prospect_2',
          userId: 'user_b',
          searchId: 'search_2',
          companyId: 'company_2',
        }),
      ],
      [seedSearch(), seedSearch({ id: 'search_2', userId: 'user_b' })],
    );
    const mine = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const theirs = await createOpportunity(d, 'token-b', { prospectId: 'prospect_2' }, NOW);
    await d.scores.upsert(mine.id, sampleScore({ score: 40 }), 'v1', NOW);
    await d.scores.upsert(theirs.id, sampleScore({ score: 99 }), 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.opportunityId).toBe(mine.id);
  });

  it('rejects an unauthenticated call before touching the repository', async () => {
    const d = deps([seedProspect()], [seedSearch()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    await d.scores.upsert(opportunity.id, sampleScore(), 'v1', NOW);

    await expect(rankOpportunities(d, null, NOW)).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('is deterministic — two identical calls produce an identical order', async () => {
    const d = deps(
      [
        seedProspect({ id: 'prospect_1' }),
        seedProspect({ id: 'prospect_2', companyId: 'company_2' }),
        seedProspect({ id: 'prospect_3', companyId: 'company_3' }),
      ],
      [seedSearch()],
    );
    const opp1 = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const opp2 = await createOpportunity(d, 'token-a', { prospectId: 'prospect_2' }, NOW);
    const opp3 = await createOpportunity(d, 'token-a', { prospectId: 'prospect_3' }, NOW);
    await d.scores.upsert(opp1.id, sampleScore({ score: 80 }), 'v1', NOW);
    await d.scores.upsert(opp2.id, sampleScore({ score: 50 }), 'v1', NOW);
    await d.scores.upsert(opp3.id, sampleScore({ score: 90 }), 'v1', NOW);

    const first = await rankOpportunities(d, 'token-a', NOW);
    const second = await rankOpportunities(d, 'token-a', NOW);

    expect(second).toEqual(first);
  });

  it('returns an empty array when the user has no scored Opportunities', async () => {
    const d = deps([], []);

    await expect(rankOpportunities(d, 'token-a', NOW)).resolves.toEqual([]);
  });

  it('ranks a single scored Opportunity as rank 1', async () => {
    const d = deps([seedProspect()], [seedSearch()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const stored = await d.scores.upsert(opportunity.id, sampleScore(), 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked).toEqual([{ opportunityId: opportunity.id, rank: 1, score: stored }]);
  });

  it('is a pure read — no repository row is created, removed or mutated', async () => {
    const d = deps([seedProspect()], [seedSearch()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    await d.scores.upsert(opportunity.id, sampleScore(), 'v1', NOW);

    const opportunities = d.opportunities as ReturnType<typeof fakeOpportunityRepository>;
    const scores = d.scores as ReturnType<typeof fakeOpportunityScoreRepository>;
    const opportunityRows = opportunities.rows;
    const scoreRows = scores.rows;

    await rankOpportunities(d, 'token-a', NOW);

    expect(opportunities.rows).toBe(opportunityRows);
    expect(scores.rows).toBe(scoreRows);
    expect(opportunities.rows).toHaveLength(1);
    expect(scores.rows).toHaveLength(1);
  });
});

// ---- Phase 12: classifyOpportunityStaleness (R-19) -----------------------
// Mirrors tests/integration/opportunity-staleness.integration.test.ts's
// real-Postgres proof of the same ownership boundary and migration 0019
// schema.

describe('classifyOpportunityStaleness', () => {
  it('is FRESH at creation before any classification has run', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    expect(opportunity.staleness).toBe('FRESH');
    expect(opportunity.stalenessComputedAt).toBeNull();
  });

  it('classifies FRESH when the active signal is recent (R-19)', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch()],
      [matchingSignal({ observedAt: new Date('2026-06-30T00:00:00.000Z') })],
    );
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const classified = await classifyOpportunityStaleness(d, 'token-a', opportunity.id, NOW);

    expect(classified.staleness).toBe('FRESH');
    expect(classified.stalenessComputedAt).toEqual(NOW);
  });

  it('classifies STALE when the active signal has aged past SIGNAL_FRESH_DAYS', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch()],
      [matchingSignal({ observedAt: new Date('2026-01-01T00:00:00.000Z') })],
    );
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const classified = await classifyOpportunityStaleness(d, 'token-a', opportunity.id, NOW);

    expect(classified.staleness).toBe('STALE');
  });

  it('classifies SUPERSEDED when the Prospect has no currently-active signal', async () => {
    const d = deps([seedProspect()], [seedSearch()], []);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const classified = await classifyOpportunityStaleness(d, 'token-a', opportunity.id, NOW);

    expect(classified.staleness).toBe('SUPERSEDED');
  });

  it('persists the classification — a second read sees it without re-classifying', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch()],
      [matchingSignal({ observedAt: new Date('2026-06-30T00:00:00.000Z') })],
    );
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    await classifyOpportunityStaleness(d, 'token-a', opportunity.id, NOW);

    const fetched = await d.opportunities.getById('user_a', opportunity.id);

    expect(fetched!.staleness).toBe('FRESH');
    expect(fetched!.stalenessComputedAt).toEqual(NOW);
  });

  it('does not touch `state`, `offer`, or any other field', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const classified = await classifyOpportunityStaleness(d, 'token-a', opportunity.id, NOW);

    expect(classified.state).toBe(opportunity.state);
    expect(classified.offer).toEqual(opportunity.offer);
    expect(classified.needDetected).toBe(opportunity.needDetected);
  });

  it('is deterministic — reclassifying with the same signals and `now` produces the same result', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const first = await classifyOpportunityStaleness(d, 'token-a', opportunity.id, NOW);
    const second = await classifyOpportunityStaleness(d, 'token-a', opportunity.id, NOW);

    expect(second.staleness).toBe(first.staleness);
  });

  it('rejects an unauthenticated call before touching the repository', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    await expect(classifyOpportunityStaleness(d, null, opportunity.id, NOW)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );

    const untouched = await d.opportunities.getById('user_a', opportunity.id);
    expect(untouched!.staleness).toBe('FRESH');
    expect(untouched!.stalenessComputedAt).toBeNull();
  });

  it('an unknown opportunityId is rejected', async () => {
    const d = deps([], [], []);

    await expect(
      classifyOpportunityStaleness(d, 'token-a', 'does-not-exist', NOW),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different authenticated user cannot classify another user's Opportunity — treated as not found", async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    await expect(
      classifyOpportunityStaleness(d, 'token-b', opportunity.id, NOW),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });
});

// ---- Phase 13: getOpportunityNextAction (R-20/AC-21) ---------------------
// Mirrors tests/integration/opportunity-next-action.integration.test.ts's
// real-Postgres proof of the same ownership boundary.

/** A fully custom StoredOpportunity row, for states/combinations the real
 * service cannot yet produce (e.g. RESEARCHED — no transition into it is
 * implemented by this phase; see service.ts's createOpportunity doc). */
function seedOpportunity(overrides: Partial<StoredOpportunity> = {}): StoredOpportunity {
  return {
    id: 'opportunity_1',
    userId: 'user_a',
    prospectId: 'prospect_1',
    state: 'NEW',
    needDetected: true,
    offer: {
      service: 'AI content system',
      rationale: 'hiring a content writer',
      estimatedValuePaise: 5_000_000,
      fit: 80,
      basedOn: ['signal_1'],
    },
    staleness: 'FRESH',
    stalenessComputedAt: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

describe('getOpportunityNextAction', () => {
  it('recommends CONSIDER_OFFER for a freshly created, NEW, FRESH opportunity', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const action = await getOpportunityNextAction(d, 'token-a', opportunity.id, NOW);

    expect(action.kind).toBe('CONSIDER_OFFER');
  });

  it('recommends HOLD when no need was detected (AC-14 NO SUITABLE OFFER)', async () => {
    const d = deps([seedProspect()], [seedSearch()], []);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const action = await getOpportunityNextAction(d, 'token-a', opportunity.id, NOW);

    expect(action.kind).toBe('HOLD');
  });

  it('recommends REFRESH_RESEARCH once Phase 12 staleness classification has marked the evidence STALE', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch()],
      [matchingSignal({ observedAt: new Date('2026-01-01T00:00:00.000Z') })],
    );
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    await classifyOpportunityStaleness(d, 'token-a', opportunity.id, NOW);

    const action = await getOpportunityNextAction(d, 'token-a', opportunity.id, NOW);

    expect(action.kind).toBe('REFRESH_RESEARCH');
  });

  it('recommends REFRESH_RESEARCH once Phase 12 staleness classification has marked the evidence SUPERSEDED', async () => {
    const d = deps([seedProspect()], [seedSearch()], []);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    // needDetected is false here (no signals), so seed a detected offer
    // directly to isolate the staleness precedence from the HOLD case.
    const opportunities = d.opportunities as ReturnType<typeof fakeOpportunityRepository>;
    opportunities.rows[0] = { ...opportunities.rows[0]!, needDetected: true };
    await classifyOpportunityStaleness(d, 'token-a', opportunity.id, NOW);

    const action = await getOpportunityNextAction(d, 'token-a', opportunity.id, NOW);

    expect(action.kind).toBe('REFRESH_RESEARCH');
  });

  it('recommends REVIEW_EVIDENCE for a RESEARCHED, FRESH opportunity', async () => {
    const opportunities = fakeOpportunityRepository([
      seedOpportunity({ state: 'RESEARCHED', staleness: 'FRESH' }),
    ]);
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    const action = await getOpportunityNextAction(
      { identity, opportunities },
      'token-a',
      'opportunity_1',
      NOW,
    );

    expect(action.kind).toBe('REVIEW_EVIDENCE');
  });

  it('never persists or mutates the Opportunity — a pure read', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));
    const before = { ...opportunities.rows[0]! };

    await getOpportunityNextAction({ identity, opportunities }, 'token-a', 'opportunity_1', NOW);

    expect(opportunities.rows[0]).toEqual(before);
  });

  it('is deterministic — the same persisted Opportunity recommends identically every call', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    const first = await getOpportunityNextAction(
      { identity, opportunities },
      'token-a',
      'opportunity_1',
      NOW,
    );
    const second = await getOpportunityNextAction(
      { identity, opportunities },
      'token-a',
      'opportunity_1',
      NOW,
    );

    expect(second).toEqual(first);
  });

  it('rejects an unauthenticated call', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      getOpportunityNextAction({ identity, opportunities }, null, 'opportunity_1', NOW),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('an unknown opportunityId is rejected', async () => {
    const opportunities = fakeOpportunityRepository([]);
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      getOpportunityNextAction({ identity, opportunities }, 'token-a', 'does-not-exist', NOW),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different authenticated user cannot read another user's Opportunity — treated as not found", async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const identity = fakeIdentity({
      ...sessionFor('token-a', 'user_a'),
      ...sessionFor('token-b', 'user_b'),
    });

    await expect(
      getOpportunityNextAction({ identity, opportunities }, 'token-b', 'opportunity_1', NOW),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });
});

describe('recordFeedback', () => {
  it('persists a useful verdict with a free-text reason (R-21/AC-22)', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    const stored = await recordFeedback(
      { identity, opportunities, feedback },
      'token-a',
      'opportunity_1',
      { useful: true, reason: 'The prospect already has an internal team.' },
      NOW,
    );

    expect(stored.userId).toBe('user_a');
    expect(stored.opportunityId).toBe('opportunity_1');
    expect(stored.useful).toBe(true);
    expect(stored.reason).toBe('The prospect already has an internal team.');
  });

  it('persists an arbitrary free-text reason exactly as supplied — never categorized or rewritten', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));
    const reason = 'Great fit but timing is off — following up next quarter, per the call notes.';

    const stored = await recordFeedback(
      { identity, opportunities, feedback },
      'token-a',
      'opportunity_1',
      { useful: false, reason },
      NOW,
    );

    expect(stored.reason).toBe(reason);
  });

  it('resubmitting replaces the current verdict in place — one row per Opportunity, never a second', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    const first = await recordFeedback(
      { identity, opportunities, feedback },
      'token-a',
      'opportunity_1',
      { useful: true, reason: 'first reason' },
      NOW,
    );
    const later = new Date(NOW.getTime() + 86_400_000);
    const second = await recordFeedback(
      { identity, opportunities, feedback },
      'token-a',
      'opportunity_1',
      { useful: false, reason: 'changed my mind' },
      later,
    );

    expect(second.id).toBe(first.id);
    expect(second.useful).toBe(false);
    expect(second.reason).toBe('changed my mind');
    expect(feedback.rows).toHaveLength(1);
  });

  it('rejects a missing reason before touching any repository', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      recordFeedback(
        { identity, opportunities, feedback },
        'token-a',
        'opportunity_1',
        { useful: true, reason: '' },
        NOW,
      ),
    ).rejects.toBeInstanceOf(FeedbackValidationError);
    expect(feedback.rows).toHaveLength(0);
  });

  it('rejects a non-boolean `useful`', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      recordFeedback(
        { identity, opportunities, feedback },
        'token-a',
        'opportunity_1',
        { useful: 'yes' as unknown as boolean, reason: 'a reason' },
        NOW,
      ),
    ).rejects.toBeInstanceOf(FeedbackValidationError);
  });

  it('rejects an unauthenticated call before touching any repository', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      recordFeedback(
        { identity, opportunities, feedback },
        null,
        'opportunity_1',
        { useful: true, reason: 'a reason' },
        NOW,
      ),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
    expect(feedback.rows).toHaveLength(0);
  });

  it('an unknown opportunityId is rejected', async () => {
    const opportunities = fakeOpportunityRepository([]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      recordFeedback(
        { identity, opportunities, feedback },
        'token-a',
        'does-not-exist',
        { useful: true, reason: 'a reason' },
        NOW,
      ),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different authenticated user cannot record feedback against another user's Opportunity — treated as not found", async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity({
      ...sessionFor('token-a', 'user_a'),
      ...sessionFor('token-b', 'user_b'),
    });

    await expect(
      recordFeedback(
        { identity, opportunities, feedback },
        'token-b',
        'opportunity_1',
        { useful: true, reason: 'a reason' },
        NOW,
      ),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
    expect(feedback.rows).toHaveLength(0);
  });
});

describe('getFeedback', () => {
  it('returns null when no feedback has been recorded yet', async () => {
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      getFeedback({ identity, feedback }, 'token-a', 'opportunity_1', NOW),
    ).resolves.toBeNull();
  });

  it('returns the persisted feedback after recordFeedback', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    const stored = await recordFeedback(
      { identity, opportunities, feedback },
      'token-a',
      'opportunity_1',
      { useful: true, reason: 'a reason' },
      NOW,
    );

    await expect(
      getFeedback({ identity, feedback }, 'token-a', 'opportunity_1', NOW),
    ).resolves.toEqual(stored);
  });

  it("a different user cannot read user A's feedback — isolation via Feedback's own userId, not retrieve-then-filter", async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity({
      ...sessionFor('token-a', 'user_a'),
      ...sessionFor('token-b', 'user_b'),
    });

    await recordFeedback(
      { identity, opportunities, feedback },
      'token-a',
      'opportunity_1',
      { useful: true, reason: 'a reason' },
      NOW,
    );

    await expect(
      getFeedback({ identity, feedback }, 'token-b', 'opportunity_1', NOW),
    ).resolves.toBeNull();
  });

  it('rejects an unauthenticated read', async () => {
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      getFeedback({ identity, feedback }, null, 'opportunity_1', NOW),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});

describe('getOpportunityTrackingSummary', () => {
  it('reports all zeros for a caller with no Opportunities (R-27 basic outcome tracking)', async () => {
    const opportunities = fakeOpportunityRepository();
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      getOpportunityTrackingSummary({ identity, opportunities, feedback }, 'token-a', NOW),
    ).resolves.toEqual({
      created: 0,
      actioned: 0,
      useful: 0,
      notUseful: 0,
      actionedRate: 0,
    });
  });

  it('counts "created" from deps.opportunities.list — every Opportunity, actioned or not', async () => {
    const opportunities = fakeOpportunityRepository([
      seedOpportunity({ id: 'opportunity_1' }),
      seedOpportunity({ id: 'opportunity_2' }),
      seedOpportunity({ id: 'opportunity_3' }),
    ]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    const summary = await getOpportunityTrackingSummary(
      { identity, opportunities, feedback },
      'token-a',
      NOW,
    );

    expect(summary.created).toBe(3);
    expect(summary.actioned).toBe(0);
    expect(summary.actionedRate).toBe(0);
  });

  it('counts "actioned" from recorded Feedback and breaks it down by useful/notUseful (R-21)', async () => {
    const opportunities = fakeOpportunityRepository([
      seedOpportunity({ id: 'opportunity_1' }),
      seedOpportunity({ id: 'opportunity_2' }),
      seedOpportunity({ id: 'opportunity_3' }),
      seedOpportunity({ id: 'opportunity_4' }),
    ]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));
    const deps = { identity, opportunities, feedback };

    await recordFeedback(deps, 'token-a', 'opportunity_1', { useful: true, reason: 'good fit' });
    await recordFeedback(deps, 'token-a', 'opportunity_2', { useful: true, reason: 'good fit' });
    await recordFeedback(deps, 'token-a', 'opportunity_3', { useful: false, reason: 'no budget' });
    // opportunity_4 left without feedback — not yet actioned.

    const summary = await getOpportunityTrackingSummary(deps, 'token-a', NOW);

    expect(summary).toEqual({
      created: 4,
      actioned: 3,
      useful: 2,
      notUseful: 1,
      actionedRate: 0.75,
    });
  });

  it('resubmitting feedback for the same Opportunity does not double-count "actioned" (migration 0020 UNIQUE(opportunity_id))', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity({ id: 'opportunity_1' })]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));
    const deps = { identity, opportunities, feedback };

    await recordFeedback(deps, 'token-a', 'opportunity_1', { useful: true, reason: 'first' });
    await recordFeedback(deps, 'token-a', 'opportunity_1', { useful: false, reason: 'changed' });

    const summary = await getOpportunityTrackingSummary(deps, 'token-a', NOW);

    expect(summary.created).toBe(1);
    expect(summary.actioned).toBe(1);
    expect(summary.useful).toBe(0);
    expect(summary.notUseful).toBe(1);
  });

  it('is deterministic — repeated calls over unchanged data return an equal result', async () => {
    const opportunities = fakeOpportunityRepository([
      seedOpportunity({ id: 'opportunity_1' }),
      seedOpportunity({ id: 'opportunity_2' }),
    ]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));
    const deps = { identity, opportunities, feedback };

    await recordFeedback(deps, 'token-a', 'opportunity_1', { useful: true, reason: 'x' });

    const first = await getOpportunityTrackingSummary(deps, 'token-a', NOW);
    const second = await getOpportunityTrackingSummary(deps, 'token-a', NOW);

    expect(second).toEqual(first);
  });

  it("a different user's summary never includes user A's Opportunities or Feedback — isolation via each repository's own user_id filter, not retrieve-then-filter", async () => {
    const opportunities = fakeOpportunityRepository([
      seedOpportunity({ id: 'opportunity_1', userId: 'user_a' }),
    ]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity({
      ...sessionFor('token-a', 'user_a'),
      ...sessionFor('token-b', 'user_b'),
    });
    const deps = { identity, opportunities, feedback };

    await recordFeedback(deps, 'token-a', 'opportunity_1', { useful: true, reason: 'x' });

    await expect(getOpportunityTrackingSummary(deps, 'token-b', NOW)).resolves.toEqual({
      created: 0,
      actioned: 0,
      useful: 0,
      notUseful: 0,
      actionedRate: 0,
    });
    // user A's own summary is unaffected by user B's (empty) read.
    await expect(getOpportunityTrackingSummary(deps, 'token-a', NOW)).resolves.toEqual({
      created: 1,
      actioned: 1,
      useful: 1,
      notUseful: 0,
      actionedRate: 1,
    });
  });

  it('rejects an unauthenticated request before touching either repository', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      getOpportunityTrackingSummary({ identity, opportunities, feedback }, null, NOW),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('rejects a revoked/unknown token the same way every other Phase 9-14 read does', async () => {
    const opportunities = fakeOpportunityRepository([seedOpportunity()]);
    const feedback = fakeFeedbackRepository();
    const identity = fakeIdentity(sessionFor('token-a', 'user_a'));

    await expect(
      getOpportunityTrackingSummary({ identity, opportunities, feedback }, 'not-a-real-token', NOW),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
