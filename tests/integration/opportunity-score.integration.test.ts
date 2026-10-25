import { randomUUID } from 'node:crypto';

import {
  BAND_THRESHOLDS,
  SIGNAL_FRESH_DAYS,
  SIGNAL_MAX_AGE_DAYS,
  unknownRankingProfile,
  type ResearchSignal,
  type UniversalRankingProfile,
} from '@acos/core-acquisition';
import {
  createPgCompanyRepository,
  createPgEntityRepository,
  createPgProspectRepository,
  runDiscovery,
  type DiscoveryCandidate,
  type DiscoveryDeps,
  type DiscoveryProvider,
} from '@acos/core-discovery';
import {
  createPgIdentityRepository,
  mintUserSession,
  UnauthenticatedError,
} from '@acos/core-identity';
import {
  createOpportunity,
  createPgOpportunityRepository,
  createPgOpportunityScoreRepository,
  getOpportunityScore,
  OpportunityNotFoundError,
  scoreOpportunity,
  SCORER_VERSION,
  type OpportunityDeps,
  type OpportunityScoreDeps,
} from '@acos/core-opportunity';
import {
  createPgResearchSignalRepository,
  runResearch,
  toScoringSignals,
  type LeadResearch,
  type ResearchDeps,
  type ResearchProvider,
  type StoredResearchSignal,
} from '@acos/core-research';
import {
  createPgSearchRepository,
  createSearch,
  transitionSearch,
  type SearchDeps,
  type StoredSearch,
} from '@acos/core-search';
import {
  createPgServiceProfileRepository,
  createServiceProfile,
  type ServiceProfileInput,
} from '@acos/core-service-profile';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';

import { suiteDatabase } from './support/suiteDb';

// OpportunityScore persistence (migration 0018, qualitative shape since
// migration 0044 / Phase 3) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0018/0044's schema plus @acos/core-opportunity's
// scoreOpportunity()/getOpportunityScore() enforce, at the database
// itself: DEC-008 ownership inheritance (opportunity_scores carries no
// user_id — ownership resolved via opportunity_id -> opportunities.user_id),
// one current score per Opportunity (UNIQUE(opportunity_id)), and that
// the qualitative UniversalRankingProfile is derived end to end from
// persisted ResearchSignal rows through a persisted Opportunity's offer
// — never a numeric score. Mirrors tests/integration/opportunity.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('opportunity_score');
let entityPool: Pool | undefined;

beforeAll(async () => {
  await suite.setup();
  if (suite.reachable()) entityPool = new Pool({ connectionString: suite.require().db.url });
}, 60_000);
afterEach(() => suite.cleanup());
afterAll(async () => {
  await entityPool?.end();
  await suite.teardown();
});

const CAREERS = { url: 'https://acme.test/careers', label: 'careers' };

function matchingResearch(): LeadResearch {
  return {
    companySummary: {
      classification: 'UNKNOWN',
      value: null,
      evidence: [],
      basis: null,
      confidence: 0,
    },
    businessModel: {
      classification: 'UNKNOWN',
      value: null,
      evidence: [],
      basis: null,
      confidence: 0,
    },
    targetCustomers: {
      classification: 'UNKNOWN',
      value: null,
      evidence: [],
      basis: null,
      confidence: 0,
    },
    categoryPlausibility: [],
    visibleProblems: [
      {
        classification: 'OBSERVED',
        value: 'hiring a content writer',
        evidence: [
          { quote: 'hiring a content writer', sourceUrl: CAREERS.url, sourceLabel: CAREERS.label },
        ],
        basis: null,
        confidence: 88,
      },
    ],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 55,
    gaps: [],
  };
}

/**
 * K5-D1 (CF-NEED-OPPORTUNITY-SUFFICIENCY-PO-DEC-001): unlike
 * matchingResearch() above (a single OBSERVED signal — no longer
 * sufficient on its own for a NEW Service+Geography-only search, see
 * @acos/core-opportunity's hasCredibleNeedEvidence()), this carries
 * TWO independent OBSERVED, full-confidence signals from distinct
 * fields, both matching sampleProfileInput()'s "AI & Automation"
 * catalogue vocabulary — credible enough to establish NEED_DETECTED
 * (and therefore a defined opportunity.offer) under the new, stronger
 * bar.
 */
function credibleNeedResearch(): LeadResearch {
  const unknownField = { classification: 'UNKNOWN' as const, value: null, evidence: [], basis: null, confidence: 0 };
  return {
    companySummary: unknownField,
    businessModel: unknownField,
    targetCustomers: unknownField,
    categoryPlausibility: [],
    visibleProblems: [
      {
        classification: 'OBSERVED',
        value:
          'the support team manually processes every order — workflow automation would eliminate this bottleneck',
        evidence: [
          {
            quote: 'the support team manually processes every order',
            sourceUrl: CAREERS.url,
            sourceLabel: CAREERS.label,
          },
        ],
        basis: null,
        confidence: 100,
      },
    ],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [
      {
        classification: 'OBSERVED',
        value: 'manual data entry across spreadsheets is error-prone and could use business process automation',
        evidence: [
          {
            quote: 'manual data entry across spreadsheets is error-prone',
            sourceUrl: CAREERS.url,
            sourceLabel: CAREERS.label,
          },
        ],
        basis: null,
        confidence: 100,
      },
    ],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 90,
    gaps: [],
  };
}

function unmatchedResearch(): LeadResearch {
  return {
    companySummary: {
      classification: 'UNKNOWN',
      value: null,
      evidence: [],
      basis: null,
      confidence: 0,
    },
    businessModel: {
      classification: 'UNKNOWN',
      value: null,
      evidence: [],
      basis: null,
      confidence: 0,
    },
    targetCustomers: {
      classification: 'UNKNOWN',
      value: null,
      evidence: [],
      basis: null,
      confidence: 0,
    },
    categoryPlausibility: [],
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 20,
    gaps: ['no signals found'],
  };
}

function testProvider(result: LeadResearch): ResearchProvider {
  return {
    async research() {
      return result;
    },
  };
}

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return { candidates, actualQuery: 'test query', provider: 'TEST_PROVIDER' };
    },
  };
}

function repos() {
  const { db } = suite.require();
  return {
    identity: createPgIdentityRepository(db.client),
    profiles: createPgServiceProfileRepository(db.client),
    searches: createPgSearchRepository(db.client),
    companies: createPgCompanyRepository(db.client),
    prospects: createPgProspectRepository(db.client),
    entities: createPgEntityRepository(entityPool!),
    signals: createPgResearchSignalRepository(db.client),
    opportunities: createPgOpportunityRepository(db.client),
    scores: createPgOpportunityScoreRepository(db.client),
  };
}

function discoveryDeps(
  base: ReturnType<typeof repos>,
  candidates: readonly DiscoveryCandidate[],
): SearchDeps & DiscoveryDeps {
  return { ...base, provider: discoveryProvider(candidates) };
}

function researchDeps(base: ReturnType<typeof repos>, result: LeadResearch): ResearchDeps {
  return { ...base, provider: testProvider(result) };
}

function opportunityDeps(base: ReturnType<typeof repos>): OpportunityDeps {
  return base;
}

function opportunityScoreDeps(base: ReturnType<typeof repos>): OpportunityScoreDeps {
  return base;
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `opportunity-score.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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
    service: 'AI & Automation',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 15_000_000,
    triggers: ['WEBSITE'],
    keywords: ['content', 'writer'],
    rationale: 'They are hiring for content ({signal}) — a system delivers it without a headcount.',
    ...overrides,
  };
}

async function createProspect(
  base: ReturnType<typeof repos>,
  token: string,
): Promise<{ search: StoredSearch; prospectId: string }> {
  const d = discoveryDeps(base, [{ name: 'Acme Co', website: 'https://acme.example.com' }]);
  const profile = await createServiceProfile(d, token, sampleProfileInput());
  const created = await createSearch(d, token, { serviceProfileId: profile.id });
  const running = (await transitionSearch(d, token, created.id, { status: 'RUNNING' }))!;

  const result = await runDiscovery(d, token, { searchId: running.id });
  return { search: running, prospectId: result.prospects[0]!.id };
}

/**
 * Mirrors @acos/core-opportunity's private evidenceQualityTier()/
 * evidenceFreshnessTier()/serviceFitTier()/buildRankingProfile() exactly
 * (see service.ts) — the same technique this test file's pre-Phase-3
 * version used for the old scorer's neutralScoringInputs()/
 * serviceFitFromOffer().
 */
function expectedRanking(
  storedSignals: readonly StoredResearchSignal[],
  offer?: { fit: number },
  now: Date = new Date('2026-07-01T09:00:00.000Z'),
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

describe('opportunity_scores schema (migration 0018, nullable legacy columns since migration 0044)', () => {
  it('opportunity_scores exists, carries no user_id, references opportunities', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'opportunity_scores'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toContain('opportunity_id');
    expect(columns).not.toContain('user_id');
    expect(columns).toContain('factors');
    expect(columns).toContain('scorer_version');
  });

  it('enforces one current score per Opportunity', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'opportunity_scores' AND indexname = 'opportunity_scores_opportunity_id_key'`,
    );
    expect(rows).toHaveLength(1);
  });

  it('migration 0044: total/band/observed_share are nullable — the qualitative model has no numeric value for them', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name, is_nullable FROM information_schema.columns
        WHERE table_name = 'opportunity_scores' AND column_name IN ('total', 'band', 'observed_share')`,
    );
    const byColumn = Object.fromEntries(
      (rows as { column_name: string; is_nullable: string }[]).map((r) => [r.column_name, r.is_nullable]),
    );
    expect(byColumn.total).toBe('YES');
    expect(byColumn.band).toBe('YES');
    expect(byColumn.observed_share).toBe('YES');
  });

  // The three tests below were added in response to a review that
  // believed the qualitative ranking path writes STRONG/MODERATE/WEAK/
  // UNKNOWN into `band`, which would violate band's original
  // CHECK (band IN ('HIGH','MEDIUM','LOW')) — migration 0044 left that
  // CHECK untouched. It does not, in fact, write there: scorePgRepository.ts's
  // upsert() sets `band = NULL` unconditionally and puts the
  // UniversalRankingProfile in `factors` (JSONB, no CHECK) instead. These
  // tests prove that directly against the real column/constraint, not
  // just through the application type.

  it('the qualitative ranking path writes band = NULL at the database level, never a tier string', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT band FROM opportunity_scores WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { band: string | null }).band).toBeNull();
  });

  it("band's original CHECK is untouched: a historical HIGH/MEDIUM/LOW value still inserts, and an invalid value is still rejected", async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId: p1 } = await createProspect(base, a.token);
    const historical = await createOpportunity(opportunityDeps(base), a.token, { prospectId: p1 });

    const { db } = suite.require();

    for (const value of ['HIGH', 'MEDIUM', 'LOW']) {
      await db.client.query(
        `INSERT INTO opportunity_scores
           (id, opportunity_id, total, band, factors, observed_share, scorer_version, scored_at)
         VALUES (gen_random_uuid()::text, $1, 50, $2, '{}'::jsonb, 0.5, 'legacy-check', now())
         ON CONFLICT (opportunity_id) DO UPDATE SET band = EXCLUDED.band, total = EXCLUDED.total`,
        [historical.id, value],
      );
      const { rows } = await db.client.query(
        `SELECT band FROM opportunity_scores WHERE opportunity_id = $1`,
        [historical.id],
      );
      expect((rows[0] as { band: string }).band).toBe(value);
    }

    await expect(
      db.client.query(
        `UPDATE opportunity_scores SET band = 'NOT_A_REAL_BAND' WHERE opportunity_id = $1`,
        [historical.id],
      ),
    ).rejects.toThrow(/opportunity_scores_band_check/);

    // STRONG/MODERATE/WEAK/UNKNOWN are the application's tier vocabulary
    // for the `factors` JSONB column, never values the `band` CHECK is
    // asked to accept — confirmed rejected here, by design, not a bug.
    await expect(
      db.client.query(`UPDATE opportunity_scores SET band = 'STRONG' WHERE opportunity_id = $1`, [
        historical.id,
      ]),
    ).rejects.toThrow(/opportunity_scores_band_check/);
  });

  // Regression coverage for the Review-button 500 (real production
  // incident): a row written before migration 0044 by the decommissioned
  // numeric scorer ('prospectScore-v1') still physically holds the old
  // seven-factor array in `factors` — never the new per-dimension
  // UniversalRankingProfile. scorePgRepository.ts's mapRow() must not
  // reinterpret that array as a ranking profile (which previously made
  // Object.entries(score.ranking) yield raw FactorScore objects as
  // "tiers", crashing the opportunity detail page's React render).
  it('a legacy prospectScore-v1 row never exposes its old seven-factor array as a UniversalRankingProfile — ranking comes back null', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const { db } = suite.require();
    const legacyFactors = [
      { raw: 0, basis: 'UNKNOWN', factor: 'icpFit', points: 0, reason: 'Not established: no ICP attributes could be determined', weight: 20 },
      { raw: 0.85, basis: 'OBSERVED', factor: 'visibleProblem', points: 17, reason: 'Observed: hiring a content writer', weight: 20 },
    ];
    const legacyReasons = ['Observed: hiring a content writer (+17)', 'Not established: no ICP attributes could be determined (no contribution)'];
    await db.client.query(
      `INSERT INTO opportunity_scores
         (id, opportunity_id, total, band, factors, reasons, observed_share, cap, scorer_version, scored_at)
       VALUES (gen_random_uuid()::text, $1, 27, 'LOW', $2::jsonb, $3, 1, NULL, 'prospectScore-v1', now())
       ON CONFLICT (opportunity_id) DO UPDATE SET
         total = EXCLUDED.total, band = EXCLUDED.band, factors = EXCLUDED.factors,
         reasons = EXCLUDED.reasons, observed_share = EXCLUDED.observed_share, scorer_version = EXCLUDED.scorer_version`,
      [opportunity.id, JSON.stringify(legacyFactors), legacyReasons],
    );

    const result = await getOpportunityScore(opportunityScoreDeps(base), a.token, opportunity.id);

    expect(result).not.toBeNull();
    expect(result!.ranking).toBeNull();
    // The reasons column is already correctly formatted text for both
    // legacy and current rows — unaffected by the ranking fix.
    expect(result!.reasons).toEqual(legacyReasons);
    expect(result!.rankerVersion).toBe('prospectScore-v1');
  });

  it('a current universalRanking-v1 row still exposes its real ranking profile unchanged', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id);

    const result = await getOpportunityScore(opportunityScoreDeps(base), a.token, opportunity.id);

    expect(result).not.toBeNull();
    expect(result!.rankerVersion).toBe(SCORER_VERSION);
    expect(result!.ranking).not.toBeNull();
    // A real profile — every dimension present, each a valid tier, never
    // the array shape the legacy test above proves is rejected.
    expect(Object.keys(result!.ranking!).sort()).toEqual(
      ['commercialReadiness', 'contactability', 'currentActivity', 'evidenceFreshness', 'evidenceQuality', 'needOpportunity', 'serviceFit'].sort(),
    );
  });
});

describe('scoreOpportunity', () => {
  it('persists a qualitative ranking profile, matching a direct expectedRanking() derivation, never a number (R-14/R-15/R-17, Phase 3)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    // K5-D1: a NEW search requires credible, corroborated evidence —
    // matchingResearch()'s single weak signal no longer establishes
    // NEED_DETECTED, so opportunity.offer would be undefined.
    const rd = researchDeps(base, credibleNeedResearch());
    await runResearch(rd, a.token, { prospectId });

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    const now = new Date('2026-07-01T09:00:00.000Z');

    const stored = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id, now);

    const storedSignals = await base.signals.listByProspect(a.userId, prospectId);
    const expected = expectedRanking(storedSignals, { fit: opportunity.offer!.fit }, now);

    expect(stored.opportunityId).toBe(opportunity.id);
    expect(stored.ranking).toEqual(expected);
    expect(stored.ranking!.serviceFit).not.toBe('UNKNOWN');
    expect(stored.reasons.length).toBeGreaterThan(0);
    expect(stored.rankerVersion).toBe(SCORER_VERSION);
    expect(stored.scoredAt).toEqual(now);

    expect(stored).not.toHaveProperty('total');
    expect(stored).not.toHaveProperty('band');
    expect(stored).not.toHaveProperty('observedShare');

    expect(stored.ranking!.needOpportunity).toBe('UNKNOWN');
    expect(stored.ranking!.contactability).toBe('UNKNOWN');
  });

  it('AC-14: an Opportunity with NO SUITABLE OFFER ranks Service Fit as UNKNOWN, never a fabricated fit', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, unmatchedResearch());
    await runResearch(rd, a.token, { prospectId });

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    expect(opportunity.offer).toBeUndefined();

    const stored = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id);

    expect(stored.ranking!.serviceFit).toBe('UNKNOWN');
  });

  it('is deterministic — the same Opportunity scored twice with the same signals produces an identical ranking', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    const now = new Date('2026-07-01T09:00:00.000Z');

    const first = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id, now);
    const second = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id, now);

    expect(second.ranking).toEqual(first.ranking);
  });

  it('re-scoring replaces the current row — UNIQUE(opportunity_id), never a second row', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const first = await scoreOpportunity(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
      new Date('2026-07-01T09:00:00.000Z'),
    );
    const second = await scoreOpportunity(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
      new Date('2026-07-05T09:00:00.000Z'),
    );

    expect(second.id).toBe(first.id);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM opportunity_scores WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { count: number }).count).toBe(1);
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const base = repos();
    await expect(
      scoreOpportunity(opportunityScoreDeps(base), null, 'irrelevant'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("a different authenticated user cannot score another user's Opportunity — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await expect(
      scoreOpportunity(opportunityScoreDeps(base), b.token, opportunity.id),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it('an unknown opportunityId is rejected', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(
      scoreOpportunity(opportunityScoreDeps(base), a.token, 'does-not-exist'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });
});

describe('getOpportunityScore', () => {
  it('retrieves the persisted score through the service', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    const stored = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id);

    const fetched = await getOpportunityScore(opportunityScoreDeps(base), a.token, opportunity.id);
    expect(fetched).toEqual(stored);
  });

  it('returns null when the Opportunity has never been scored', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await expect(
      getOpportunityScore(opportunityScoreDeps(base), a.token, opportunity.id),
    ).resolves.toBeNull();
  });

  it("a different user cannot retrieve user A's score — isolation via the ownership join, not retrieve-then-filter", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id);

    await expect(
      getOpportunityScore(opportunityScoreDeps(base), b.token, opportunity.id),
    ).resolves.toBeNull();
  });

  it('rejects an unauthenticated read', async () => {
    const base = repos();
    await expect(
      getOpportunityScore(opportunityScoreDeps(base), null, 'irrelevant'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });
});
