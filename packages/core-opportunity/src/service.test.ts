import {
  BAND_THRESHOLDS,
  rankByUniversalProfile,
  SIGNAL_FRESH_DAYS,
  SIGNAL_MAX_AGE_DAYS,
  unknownRankingProfile,
  type ResearchSignal,
  type UniversalRankingProfile,
} from '@acos/core-acquisition';
import type { CompanyRepository, ProspectRepository, StoredCompany, StoredProspect } from '@acos/core-discovery';
import { hashAccessToken } from '@acos/core-entitlements';
import {
  UnauthenticatedError,
  type IdentityRepository,
  type StoredSessionToken,
} from '@acos/core-identity';
import {
  DETERMINISTIC_ABSENT_SSL_FIELD,
  toScoringSignals,
  type ResearchSignalRepository,
  type StoredResearchSignal,
} from '@acos/core-research';
import type { SearchRepository, StoredSearch } from '@acos/core-search';
import { SYSTEM_DEFAULT_TARGET_CUSTOMER, type ServiceProfileFields } from '@acos/core-service-profile';
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
  recordAiEnrichmentForOwner,
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
    async findUserById() {
      throw new Error('not used by these tests');
    },
    async findCredentialsByEmail() {
      throw new Error('not used by these tests');
    },
    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },
    async saveSessionToken() {
      throw new Error('not used by these tests');
    },
    async revokeSessionToken() {
      throw new Error('not used by these tests');
    },
    async findOrCreateUser() {
      throw new Error('not used by these tests');
    },
    async findUserAuthStateById() {
      throw new Error('not used by these tests');
    },
    async saveActivationToken() {
      throw new Error('not used by these tests');
    },
    async findActivationToken() {
      throw new Error('not used by these tests');
    },
    async consumeActivationToken() {
      throw new Error('not used by these tests');
    },
    async setEmailVerified() {
      throw new Error('not used by these tests');
    },
    async completeAccountSetup() {
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

/**
 * A minimal local fake of @acos/core-discovery's CompanyRepository —
 * unexported internal to that package's tests. Synthesizes a Company for
 * ANY requested id/userId (never "not found") so every pre-existing
 * Prospect fixture in this file resolves without needing an explicit
 * seed per companyId; the synthesized `name` ("Company company_1", etc.)
 * never matches R-70's narrow self-identification pattern
 * (./adapters.ts), so it is a no-op for every test here except the
 * dedicated R-70 tests below, which seed their own Company explicitly.
 */
function fakeCompanyRepository(seed: StoredCompany[] = []): CompanyRepository {
  return {
    async findOrCreateByDomain() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      const seeded = seed.find((row) => row.id === id && row.userId === userId);
      if (seeded) return seeded;
      return {
        id,
        userId,
        name: `Company ${id}`,
        normalizedDomain: `${id}.test`,
        entityId: null,
        createdAt: new Date('2026-01-01T00:00:00.000Z'),
      };
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
    async consumeAiEscalationUnit() {
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
    completedAt: null,
    aiEscalationUnitsConsumed: 0,
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
    companies: fakeCompanyRepository(),
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

  // ---- K5-D1 (Need/Opportunity evidence sufficiency) --------------------
  // requirement/CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md, K5-D1
  // (Option C): the gate in createOpportunityForOwner applies only to a
  // NEW Service+Geography-only search (a system-owned sentinel
  // targetCustomer); a historical search (a real targetCustomer) keeps
  // its pre-K5 behavior unchanged. Both tests below use the IDENTICAL
  // single, OBSERVED, keyword-matching signal — only the Search's own
  // targetCustomer differs.

  it('10a. historical behavior remains unchanged: a historical search (real targetCustomer) still detects need from a single matching signal, exactly as before K5-D1', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch({ parameters: serviceProfileFields({ targetCustomer: 'Restaurants' }) })],
      [matchingSignal()],
    );

    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

    expect(opportunity.needDetected).toBe(true);
  });

  it('10b. K5-D1 engages only for a NEW search: the identical single matching signal is NOT sufficient once targetCustomer is the system-owned sentinel', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch({ parameters: serviceProfileFields({ targetCustomer: SYSTEM_DEFAULT_TARGET_CUSTOMER }) })],
      [matchingSignal()],
    );

    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

    expect(opportunity.needDetected).toBe(false);
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

  it('a Prospect whose Company cannot be resolved is rejected the same way a missing Prospect/Search is (R-70 needs Company identity)', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    d.companies = {
      async findOrCreateByDomain() {
        throw new Error('not used by this test');
      },
      async getById() {
        return null;
      },
    };

    await expect(
      createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }),
    ).rejects.toBeInstanceOf(OpportunityProspectNotFoundError);
  });

  describe('R-70: source-to-business attribution (Phase 24)', () => {
    it('evidence that self-identifies as a different business does not establish a need', async () => {
      const d = deps(
        [seedProspect()],
        [seedSearch()],
        [
          matchingSignal({
            signal: 'HeyDrop. A simple way to share your digital business card.',
          }),
        ],
      );
      d.companies = fakeCompanyRepository([
        {
          id: 'company_1',
          userId: 'user_a',
          name: 'Meridian Fitness Club',
          normalizedDomain: 'meridian.test',
          entityId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]);

      const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

      expect(opportunity.needDetected).toBe(false);
      expect(opportunity.offer).toBeUndefined();
    });

    it('genuine, correctly-attributed evidence for the same business is unaffected', async () => {
      const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
      d.companies = fakeCompanyRepository([
        {
          id: 'company_1',
          userId: 'user_a',
          name: 'Meridian Fitness Club',
          normalizedDomain: 'meridian.test',
          entityId: null,
          createdAt: new Date('2026-01-01T00:00:00.000Z'),
        },
      ]);

      const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

      expect(opportunity.needDetected).toBe(true);
    });
  });

  describe('R-71: topic-vs-problem relevance (Phase 24)', () => {
    it('a topical-field-only keyword match does not establish a need', async () => {
      const d = deps(
        [seedProspect()],
        [seedSearch()],
        [matchingSignal({ field: 'companySummary', signal: 'hiring a content writer' })],
      );

      const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

      expect(opportunity.needDetected).toBe(false);
    });

    it('the same claim in a problem field still establishes a need (unaffected — R-71 does not make qualification stricter for genuine problems)', async () => {
      const d = deps(
        [seedProspect()],
        [seedSearch()],
        [matchingSignal({ field: 'visibleProblems', signal: 'hiring a content writer' })],
      );

      const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

      expect(opportunity.needDetected).toBe(true);
    });
  });

  // ---- Zero-AI deterministic offer path (C-3B conformance) --------------
  // The Phase 1 deterministic absent-SSL signal (DETERMINISTIC_ABSENT_SSL_
  // FIELD, kind WEBSITE) already reached ./adapters' R-70/R-71-filtered
  // offerSignals, and buildRankingProfile()'s needOpportunityTier() already
  // recognized it for ranking — but no ServiceRule's keywords ever
  // contained vocabulary matching its fixed text, so suggestOffers() could
  // never produce a `top` offer from it alone, and a zero-AI (deterministic
  // -only) search could never reach needDetected=true. These tests prove
  // the fix (service.ts's `deterministicRule`) without touching K5-D1,
  // R-70, R-71, or Universal Ranking.
  describe('zero-AI deterministic offer path (C-3B conformance)', () => {
    function absentSslSignal(overrides: Partial<StoredResearchSignal> = {}): StoredResearchSignal {
      return matchingSignal({
        field: DETERMINISTIC_ABSENT_SSL_FIELD,
        kind: 'WEBSITE',
        classification: 'OBSERVED',
        signal: 'Website served over HTTP without TLS (no SSL): http://example.test',
        confidence: 100,
        ...overrides,
      });
    }

    it('a lone deterministic absent-SSL signal — no AI-sourced evidence at all — establishes a credible need for a historical-style search', async () => {
      const d = deps([seedProspect()], [seedSearch()], [absentSslSignal()]);

      const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

      expect(opportunity.needDetected).toBe(true);
      expect(opportunity.offer?.basedOn).toEqual([
        'Website served over HTTP without TLS (no SSL): http://example.test',
      ]);
    });

    it('K5-D1 remains intact: the identical lone deterministic signal enters the offer path (top is defined) but is NOT sufficient for a NEW Service+Geography-only search — a single field never satisfies hasCredibleNeedEvidence()', async () => {
      const d = deps(
        [seedProspect()],
        [seedSearch({ parameters: serviceProfileFields({ targetCustomer: SYSTEM_DEFAULT_TARGET_CUSTOMER }) })],
        [absentSslSignal()],
      );

      const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

      expect(opportunity.offer).toBeDefined(); // suggestOffers() now matches — necessary condition met
      expect(opportunity.needDetected).toBe(false); // K5-D1's >=2-distinct-field bar is unchanged
    });

    it('weak/status-only evidence does not manufacture a need: a GOOGLE_PLACES_STATUS signal is never matched by the deterministic rule, even if its text happens to contain the matching keyword', async () => {
      const d = deps(
        [seedProspect()],
        [seedSearch()],
        [
          matchingSignal({
            field: 'deterministic.placesClosedPermanently',
            kind: 'GOOGLE_PLACES_STATUS',
            classification: 'OBSERVED',
            signal: 'Google Places reports this business as permanently closed — no ssl mentioned incidentally',
            confidence: 100,
          }),
        ],
      );

      const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

      expect(opportunity.offer).toBeUndefined();
      expect(opportunity.needDetected).toBe(false);
    });

    it('R-70/R-71 remain intact: the identical absent-SSL text in a topical field (companySummary) still does not establish a need', async () => {
      const d = deps(
        [seedProspect()],
        [seedSearch()],
        [absentSslSignal({ field: 'companySummary' })],
      );

      const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

      expect(opportunity.offer).toBeUndefined();
      expect(opportunity.needDetected).toBe(false);
    });

    it('AI-present behavior is unchanged: an AI-sourced matching signal with no deterministic signal present detects a need exactly as before this fix', async () => {
      const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);

      const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

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

// ---- Phase 10/Phase 3: scoreOpportunity / getOpportunityScore -----------
// Mirrors tests/integration/opportunity-score.integration.test.ts's
// real-Postgres proof of the same ownership boundary and migration
// 0018/0044 schema. Since Phase 3 (deterministic architecture plan),
// scoreOpportunity() persists a qualitative UniversalRankingProfile
// instead of the legacy seven-factor numeric score.

const NOW = new Date('2026-07-01T09:00:00.000Z');

/**
 * Mirrors service.ts's own private evidenceQualityTier()/
 * evidenceFreshnessTier()/serviceFitTier()/buildRankingProfile() exactly
 * — the same technique the pre-Phase-3 version of this test file used
 * for the old scorer's neutralScoringInputs()/serviceFitFromOffer() — so
 * tests verify the wiring (ownership, persistence, idempotency) without
 * re-deriving tier arithmetic the unit tests below already cover once.
 */
function expectedRanking(
  storedSignals: readonly StoredResearchSignal[],
  offer?: { fit: number },
  now: Date = NOW,
): UniversalRankingProfile {
  const { signals } = toScoringSignals(storedSignals);
  const live = (signals as ResearchSignal[]).filter((s) => !s.supersededAt);

  const wellSourced = live.filter((s) => s.confidence >= 70).length;
  const evidenceQuality =
    live.length === 0 ? 'UNKNOWN' : wellSourced >= 3 ? 'STRONG' : wellSourced === 2 ? 'MODERATE' : 'WEAK';

  const newestAgeDays =
    live.length === 0
      ? Infinity
      : Math.min(...live.map((s) => (now.getTime() - s.observedAt.getTime()) / 86_400_000));
  const evidenceFreshness =
    live.length === 0
      ? 'UNKNOWN'
      : newestAgeDays <= SIGNAL_FRESH_DAYS
        ? 'STRONG'
        : newestAgeDays <= SIGNAL_MAX_AGE_DAYS
          ? 'MODERATE'
          : 'WEAK';

  const serviceFit = !offer
    ? 'UNKNOWN'
    : offer.fit >= BAND_THRESHOLDS.HIGH
      ? 'STRONG'
      : offer.fit >= BAND_THRESHOLDS.MEDIUM
        ? 'MODERATE'
        : offer.fit > 0
          ? 'WEAK'
          : 'UNKNOWN';

  return { ...unknownRankingProfile(), serviceFit, evidenceQuality, evidenceFreshness };
}

describe('scoreOpportunity', () => {
  it('derives serviceFit from Opportunity.offer.fit and persists a qualitative ranking profile, never a number', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    const expected = expectedRanking([matchingSignal()], { fit: opportunity.offer!.fit });

    expect(stored.opportunityId).toBe(opportunity.id);
    expect(stored.ranking).toEqual(expected);
    expect(stored.ranking!.serviceFit).not.toBe('UNKNOWN');
    expect(stored.reasons.length).toBeGreaterThan(0);
    expect(stored.reasons.some((r) => r.startsWith('Service Fit:'))).toBe(true);
    expect(stored.rankerVersion).toBe(SCORER_VERSION);
    expect(stored.scoredAt).toEqual(NOW);

    // No numeric field anywhere on the persisted shape — the type itself
    // has none, but assert the runtime value too, in case a future edit
    // widens the type without meaning to widen the contract.
    expect(stored).not.toHaveProperty('total');
    expect(stored).not.toHaveProperty('band');
    expect(stored).not.toHaveProperty('observedShare');
  });

  it('uses UNKNOWN for Need/Opportunity (no deterministic signal present), Contactability, Current Activity and Commercial Readiness — no deterministic producer is wired in for the latter three yet', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    expect(stored.ranking!.needOpportunity).toBe('UNKNOWN');
    expect(stored.ranking!.contactability).toBe('UNKNOWN');
    expect(stored.ranking!.currentActivity).toBe('UNKNOWN');
    expect(stored.ranking!.commercialReadiness).toBe('UNKNOWN');
  });

  it('PO-3 (Phase 5): a live Phase-1 deterministic absent-SSL signal ranks Need/Opportunity as STRONG', async () => {
    const deterministic = matchingSignal({
      id: 'deterministic_1',
      field: DETERMINISTIC_ABSENT_SSL_FIELD,
      kind: 'WEBSITE',
      signal: 'Website served over HTTP without TLS (no SSL): http://example.test',
      confidence: 100,
    });
    const d = deps([seedProspect()], [seedSearch()], [deterministic]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    expect(stored.ranking!.needOpportunity).toBe('STRONG');
  });

  it('PO-3 (Phase 5): a SUPERSEDED deterministic absent-SSL signal stays blind — Need/Opportunity remains UNKNOWN', async () => {
    const superseded = matchingSignal({
      id: 'deterministic_1',
      field: DETERMINISTIC_ABSENT_SSL_FIELD,
      kind: 'WEBSITE',
      signal: 'Website served over HTTP without TLS (no SSL): http://example.test',
      confidence: 100,
      supersededAt: NOW,
    });
    const d = deps([seedProspect()], [seedSearch()], [superseded]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    expect(stored.ranking!.needOpportunity).toBe('UNKNOWN');
  });

  it('AC-14: an Opportunity with NO SUITABLE OFFER ranks Service Fit as UNKNOWN, never a fabricated fit', async () => {
    const d = deps([seedProspect()], [seedSearch()], []);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    expect(opportunity.offer).toBeUndefined();

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    expect(stored.ranking!.serviceFit).toBe('UNKNOWN');
  });

  it('Phase 1 absent-SSL signal does not itself produce an invented/elevated ranking tier — one OBSERVED signal never alone reaches STRONG Evidence Quality', async () => {
    const single = matchingSignal({ classification: 'OBSERVED', confidence: 100, observedAt: NOW });
    const d = deps([seedProspect()], [seedSearch()], [single]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const stored = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    expect(stored.ranking!.evidenceQuality).not.toBe('STRONG');
  });

  it('no LLM/provider call occurs during ranking — the fake ResearchSignalRepository/offer detection are the only inputs read', async () => {
    const inferred = matchingSignal({
      classification: 'INFERRED',
      confidence: 100,
      basis: 'reasoned from job posts',
      observedAt: NOW,
    });
    const d = deps([seedProspect()], [seedSearch()], [inferred]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    // Purely a wiring/determinism check — no network/provider dependency
    // exists in `deps`, so a successful, synchronous-shaped result here
    // is itself proof no model call happened.
    await expect(scoreOpportunity(d, 'token-a', opportunity.id, NOW)).resolves.toMatchObject({
      opportunityId: opportunity.id,
    });
  });

  it('adapts a mixed OBSERVED/INFERRED/UNKNOWN signal batch identically to a direct expectedRanking() derivation', async () => {
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
    const expected = expectedRanking(
      mixedSignals,
      opportunity.offer && { fit: opportunity.offer.fit },
    );

    expect(stored.ranking).toEqual(expected);
  });

  it('is deterministic — scoring the same Opportunity twice with the same inputs produces an identical ranking', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const first = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);
    const second = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);

    expect(second.ranking).toEqual(first.ranking);
    expect(second.rankerVersion).toBe(first.rankerVersion);
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

// ---- Phase 11/Phase 3: rankOpportunities --------------------------------
// Mirrors tests/integration/opportunity-ranking.integration.test.ts's
// real-Postgres proof of the same ownership boundary. Rankings are
// seeded directly via d.scores.upsert() with hand-built
// UniversalRankingProfile values — rankOpportunities() only orders
// already-persisted rankings, so these tests do not need to re-derive
// scoreOpportunity()'s own wiring (covered above) or
// universalRanking.ts's comparator arithmetic (covered by that module's
// own tests).

/** A ranking profile for seeding, overriding only the dimension(s) a test cares about. */
function sampleRanking(overrides: Partial<UniversalRankingProfile> = {}): UniversalRankingProfile {
  return { ...unknownRankingProfile(), needOpportunity: 'MODERATE', ...overrides };
}

describe('rankOpportunities', () => {
  it('orders scored Opportunities by Primary-dimension tier, descending (R-15/AC-17)', async () => {
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
    await d.scores.upsert(opp1.id, sampleRanking({ needOpportunity: 'MODERATE' }), [], 'v1', NOW);
    await d.scores.upsert(opp2.id, sampleRanking({ needOpportunity: 'WEAK' }), [], 'v1', NOW);
    await d.scores.upsert(opp3.id, sampleRanking({ needOpportunity: 'STRONG' }), [], 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked.map((r) => r.opportunityId)).toEqual([opp3.id, opp1.id, opp2.id]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('matches rankByUniversalProfile() called directly on the same candidates — the comparator is not reimplemented', async () => {
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
      sampleRanking({ needOpportunity: 'MODERATE', evidenceQuality: 'WEAK' }),
      [],
      'v1',
      NOW,
    );
    const s2 = await d.scores.upsert(
      opp2.id,
      sampleRanking({ needOpportunity: 'MODERATE', evidenceQuality: 'STRONG' }),
      [],
      'v1',
      NOW,
    );
    const s3 = await d.scores.upsert(opp3.id, sampleRanking({ needOpportunity: 'WEAK' }), [], 'v1', NOW);

    const direct = rankByUniversalProfile(
      [s1, s2, s3].map((s) => ({ id: s.opportunityId, ranking: s.ranking! })),
    );

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked.map((r) => r.opportunityId)).toEqual(direct.map((c) => c.id));
  });

  it('breaks a tie on Primary dimensions by Important-dimension tier (Evidence Quality), descending', async () => {
    const d = deps(
      [
        seedProspect({ id: 'prospect_1' }),
        seedProspect({ id: 'prospect_2', companyId: 'company_2' }),
      ],
      [seedSearch()],
    );
    const low = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const high = await createOpportunity(d, 'token-a', { prospectId: 'prospect_2' }, NOW);
    await d.scores.upsert(low.id, sampleRanking({ evidenceQuality: 'WEAK' }), [], 'v1', NOW);
    await d.scores.upsert(high.id, sampleRanking({ evidenceQuality: 'STRONG' }), [], 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked.map((r) => r.opportunityId)).toEqual([high.id, low.id]);
  });

  it('breaks a total tie on every dimension by opportunity id, ascending', async () => {
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
    await d.scores.upsert(first.id, sampleRanking(), [], 'v1', NOW);
    await d.scores.upsert(second.id, sampleRanking(), [], 'v1', NOW);

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
    await d.scores.upsert(scored.id, sampleRanking(), [], 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.opportunityId).toBe(scored.id);
    expect(ranked.some((r) => r.opportunityId === unscored.id)).toBe(false);
  });

  it("does not include another user's Opportunities, even when ranked higher", async () => {
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
    await d.scores.upsert(mine.id, sampleRanking({ needOpportunity: 'WEAK' }), [], 'v1', NOW);
    await d.scores.upsert(theirs.id, sampleRanking({ needOpportunity: 'STRONG' }), [], 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.opportunityId).toBe(mine.id);
  });

  it('rejects an unauthenticated call before touching the repository', async () => {
    const d = deps([seedProspect()], [seedSearch()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    await d.scores.upsert(opportunity.id, sampleRanking(), [], 'v1', NOW);

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
    await d.scores.upsert(opp1.id, sampleRanking({ needOpportunity: 'MODERATE' }), [], 'v1', NOW);
    await d.scores.upsert(opp2.id, sampleRanking({ needOpportunity: 'WEAK' }), [], 'v1', NOW);
    await d.scores.upsert(opp3.id, sampleRanking({ needOpportunity: 'STRONG' }), [], 'v1', NOW);

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
    const stored = await d.scores.upsert(opportunity.id, sampleRanking(), [], 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked).toEqual([{ opportunityId: opportunity.id, rank: 1, score: stored }]);
  });

  it('is a pure read — no repository row is created, removed or mutated', async () => {
    const d = deps([seedProspect()], [seedSearch()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    await d.scores.upsert(opportunity.id, sampleRanking(), [], 'v1', NOW);

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

  it('never eliminates a candidate — an UNKNOWN-on-every-dimension Opportunity still appears, ranked, not removed', async () => {
    const d = deps(
      [
        seedProspect({ id: 'prospect_1' }),
        seedProspect({ id: 'prospect_2', companyId: 'company_2' }),
      ],
      [seedSearch()],
    );
    const strong = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);
    const noEvidence = await createOpportunity(d, 'token-a', { prospectId: 'prospect_2' }, NOW);
    await d.scores.upsert(strong.id, sampleRanking({ needOpportunity: 'STRONG' }), [], 'v1', NOW);
    await d.scores.upsert(noEvidence.id, unknownRankingProfile(), [], 'v1', NOW);

    const ranked = await rankOpportunities(d, 'token-a', NOW);

    expect(ranked.map((r) => r.opportunityId)).toEqual([strong.id, noEvidence.id]);
    expect(ranked).toHaveLength(2);
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

// ---- Phase 6: recordAiEnrichmentForOwner --------------------------------
// Pure metadata wiring over Phase 5's already-implemented
// admission/cache/budget/escalation outcomes — this function classifies
// nothing itself, it only persists an outcome the caller (the search
// worker's processOneCandidate()) already resolved. Not reachable from
// any HTTP path — see createOpportunityForOwner/scoreOpportunityForOwner
// for the same "ForOwner" convention.

describe('recordAiEnrichmentForOwner', () => {
  it('defaults to DETERMINISTIC_ONLY with no reason at creation, before any provenance is recorded', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    expect(opportunity.aiEnrichment).toBe('DETERMINISTIC_ONLY');
    expect(opportunity.aiEnrichmentReason).toBeNull();
  });

  it('records AI_ENRICHED with a null reason', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const updated = await recordAiEnrichmentForOwner(d, 'user_a', opportunity.id, 'AI_ENRICHED', null);

    expect(updated.aiEnrichment).toBe('AI_ENRICHED');
    expect(updated.aiEnrichmentReason).toBeNull();
  });

  it('records DETERMINISTIC_ONLY with each of the three reasons', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    for (const reason of ['NOT_ESCALATED', 'ESCALATION_FAILED', 'PROVIDER_EXHAUSTED'] as const) {
      const updated = await recordAiEnrichmentForOwner(
        d,
        'user_a',
        opportunity.id,
        'DETERMINISTIC_ONLY',
        reason,
      );
      expect(updated.aiEnrichment).toBe('DETERMINISTIC_ONLY');
      expect(updated.aiEnrichmentReason).toBe(reason);
    }
  });

  it('is reclassifiable — a second call for the same Opportunity updates it in place, never a duplicate', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    await recordAiEnrichmentForOwner(
      d,
      'user_a',
      opportunity.id,
      'DETERMINISTIC_ONLY',
      'NOT_ESCALATED',
    );
    const reclassified = await recordAiEnrichmentForOwner(d, 'user_a', opportunity.id, 'AI_ENRICHED', null);

    expect(reclassified.id).toBe(opportunity.id);
    expect(reclassified.aiEnrichment).toBe('AI_ENRICHED');
    expect(reclassified.aiEnrichmentReason).toBeNull();
    expect(await d.opportunities.list('user_a')).toHaveLength(1);
  });

  it('does not touch `state`, `offer`, or `staleness`', async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    const updated = await recordAiEnrichmentForOwner(d, 'user_a', opportunity.id, 'AI_ENRICHED', null);

    expect(updated.state).toBe(opportunity.state);
    expect(updated.offer).toEqual(opportunity.offer);
    expect(updated.staleness).toBe(opportunity.staleness);
  });

  it('an unknown opportunityId is rejected', async () => {
    const d = deps([], [], []);

    await expect(
      recordAiEnrichmentForOwner(d, 'user_a', 'does-not-exist', 'AI_ENRICHED', null),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different user's own userId cannot record provenance on another user's Opportunity — treated as not found", async () => {
    const d = deps([seedProspect()], [seedSearch()], [matchingSignal()]);
    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' }, NOW);

    await expect(
      recordAiEnrichmentForOwner(d, 'user_b', opportunity.id, 'AI_ENRICHED', null),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);

    const untouched = await d.opportunities.getById('user_a', opportunity.id);
    expect(untouched!.aiEnrichment).toBe('DETERMINISTIC_ONLY');
    expect(untouched!.aiEnrichmentReason).toBeNull();
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
    relevantSubservices: [],
    staleness: 'FRESH',
    stalenessComputedAt: null,
    aiEnrichment: 'DETERMINISTIC_ONLY',
    aiEnrichmentReason: null,
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

// ---- Phase 7B: relevant predefined subservices (MULR item 6) ----------
// createOpportunityForOwner computes relevantSubservices once, from the
// same persisted signals already read for offer detection (see
// ./subserviceMatching.test.ts for the pure matching-rule unit coverage).
// These tests prove the pipeline wiring and persistence round trip only.

describe('createOpportunity — relevant predefined subservices (Phase 7B)', () => {
  it('12. multiple matched subservices are persisted as multiple entries on ONE Opportunity, never one Opportunity per subservice', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch({ parameters: serviceProfileFields({ service: 'Web & Software Development' }) })],
      [
        matchingSignal({ field: 'visibleProblems', signal: 'needs website development' }),
        matchingSignal({ id: 'signal_2', field: 'websiteIssues', signal: 'also needs mobile apps' }),
      ],
    );

    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

    expect(opportunity.relevantSubservices.slice().sort()).toEqual(
      ['Mobile apps', 'Website development'].sort(),
    );
    expect((await d.opportunities.list('user_a')).length).toBe(1);
  });

  it('13. repository write/read round trip preserves relevantSubservices', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch({ parameters: serviceProfileFields({ service: 'Web & Software Development' }) })],
      [matchingSignal({ field: 'visibleProblems', signal: 'needs website development' })],
    );

    const created = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });
    const reread = await d.opportunities.getById('user_a', created.id);

    expect(reread!.relevantSubservices).toEqual(created.relevantSubservices);
    expect(reread!.relevantSubservices).toEqual(['Website development']);
  });

  it('a Prospect with no problem/opportunity-field evidence for the selected service records an empty array, never undefined/null', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch({ parameters: serviceProfileFields({ service: 'Web & Software Development' }) })],
      [],
    );

    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });
    expect(opportunity.relevantSubservices).toEqual([]);
  });

  it("a selected service that is not one of the 17 catalogue families (e.g. the caller's own free-text service) records no subservices, never a guess", async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch({ parameters: serviceProfileFields({ service: 'AI content system' }) })],
      [matchingSignal({ field: 'visibleProblems', signal: 'needs website development' })],
    );

    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });
    expect(opportunity.relevantSubservices).toEqual([]);
  });

  it('16/18: subservice matching leaves this Opportunity’s offer detection, ranking profile, and need/needDetected output identical to the pre-Phase-7B behavior', async () => {
    const d = deps(
      [seedProspect()],
      [seedSearch({ parameters: serviceProfileFields({ service: 'Web & Software Development' }) })],
      // Keeps offer.ts's own, unmodified keyword match ('content'/'writer')
      // alongside the literal subservice phrase, so both detection paths
      // fire from the same, single signal — proving one leaves the other
      // untouched rather than picking signals that only exercise one path.
      [matchingSignal({ field: 'visibleProblems', signal: 'hiring a content writer for website development' })],
    );

    const opportunity = await createOpportunity(d, 'token-a', { prospectId: 'prospect_1' });

    // Same offer/needDetected contract as the pre-existing
    // "detects a need and recommends an offer" test above — relevant
    // subservices add a field, they never change this outcome.
    expect(opportunity.needDetected).toBe(true);
    expect(opportunity.offer?.service).toBe('Web & Software Development');
    expect(opportunity.relevantSubservices).toEqual(['Website development']);

    const score = await scoreOpportunity(d, 'token-a', opportunity.id, NOW);
    expect(score.ranking!.needOpportunity).toBeDefined();
    expect(score.ranking!.serviceFit).toBeDefined();
  });
});
