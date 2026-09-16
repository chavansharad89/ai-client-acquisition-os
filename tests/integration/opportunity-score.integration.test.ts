import { randomUUID } from 'node:crypto';

import { scoreProspect, type ProspectInput } from '@acos/core-acquisition';
import {
  createPgCompanyRepository,
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

import { suiteDatabase } from './support/suiteDb';

// OpportunityScore persistence (migration 0018) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0018's schema plus @acos/core-opportunity's
// scoreOpportunity()/getOpportunityScore() enforce, at the database
// itself: DEC-008 ownership inheritance (opportunity_scores carries no
// user_id — ownership resolved via opportunity_id -> opportunities.user_id),
// one current score per Opportunity (UNIQUE(opportunity_id)), and that
// @acos/core-acquisition's scoreProspect() is reused unmodified end to
// end from persisted ResearchSignal rows through a persisted Opportunity's
// offer. Mirrors tests/integration/opportunity.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('opportunity_score');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

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
      return candidates;
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
    service: 'AI content system',
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

/** Mirrors @acos/core-opportunity's private neutralScoringInputs()/serviceFitFromOffer() — see service.ts. */
function expectedInput(
  storedSignals: readonly StoredResearchSignal[],
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

describe('opportunity_scores schema (migration 0018)', () => {
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
});

describe('scoreOpportunity', () => {
  it('persists a seven-factor score with every factor field, matching a direct scoreProspect() call (R-14/R-15/R-17)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    const now = new Date('2026-07-01T09:00:00.000Z');

    const stored = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id, now);

    const storedSignals = await base.signals.listByProspect(a.userId, prospectId);
    const expected = scoreProspect(
      expectedInput(storedSignals, {
        fit: opportunity.offer!.fit,
        service: opportunity.offer!.service,
      }),
      now,
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
    expect(stored.scoredAt).toEqual(now);

    const serviceFit = stored.factors.find((f) => f.factor === 'serviceFit')!;
    expect(serviceFit.basis).toBe('OBSERVED');
    expect(serviceFit.raw).toBeCloseTo(opportunity.offer!.fit / 100, 5);

    const byFactor = Object.fromEntries(stored.factors.map((f) => [f.factor, f]));
    expect(byFactor.icpFit!.basis).toBe('UNKNOWN');
    expect(byFactor.abilityToPay!.basis).toBe('UNKNOWN');
    expect(byFactor.urgency!.basis).toBe('UNKNOWN');
  });

  it('AC-14: an Opportunity with NO SUITABLE OFFER scores serviceFit as UNKNOWN, never a fabricated offer', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, unmatchedResearch());
    await runResearch(rd, a.token, { prospectId });

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    expect(opportunity.offer).toBeUndefined();

    const stored = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id);
    const serviceFit = stored.factors.find((f) => f.factor === 'serviceFit')!;

    expect(serviceFit.basis).toBe('UNKNOWN');
    expect(serviceFit.raw).toBe(0);
    expect(serviceFit.points).toBe(0);
  });

  it('is deterministic — the same Opportunity scored twice with the same signals produces an identical score', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    const now = new Date('2026-07-01T09:00:00.000Z');

    const first = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id, now);
    const second = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id, now);

    expect(second.total).toBe(first.total);
    expect(second.band).toBe(first.band);
    expect(second.factors).toEqual(first.factors);
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
