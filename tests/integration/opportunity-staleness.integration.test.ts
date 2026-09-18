import { randomUUID } from 'node:crypto';

import { SIGNAL_FRESH_DAYS } from '@acos/core-acquisition';
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
  classifyOpportunityStaleness,
  createOpportunity,
  createPgOpportunityRepository,
  createPgOpportunityScoreRepository,
  OpportunityNotFoundError,
  type OpportunityDeps,
  type OpportunityScoreDeps,
} from '@acos/core-opportunity';
import {
  createPgResearchSignalRepository,
  runResearch,
  type LeadResearch,
  type ResearchDeps,
  type ResearchProvider,
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

// Opportunity staleness (migration 0019) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0019's schema plus @acos/core-opportunity's
// classifyOpportunityStaleness() enforce, at the database itself: the
// FRESH default at creation, ownership (staleness is a column on the
// already-owned `opportunities` row, not an inherited-ownership table),
// and that @acos/core-acquisition's classifyStaleness() is reused
// unmodified end to end from persisted ResearchSignal rows through a
// persisted Opportunity. Mirrors
// tests/integration/opportunity-score.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('opportunity_staleness');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const CAREERS = { url: 'https://acme.test/careers', label: 'careers' };

function researchWithSignal(): LeadResearch {
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
  const email = `opportunity-staleness.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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

describe('opportunities.staleness (migration 0019)', () => {
  it('defaults to FRESH with no computed-at timestamp at creation', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    expect(opportunity.staleness).toBe('FRESH');
    expect(opportunity.stalenessComputedAt).toBeNull();

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT staleness, staleness_computed_at FROM opportunities WHERE id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { staleness: string }).staleness).toBe('FRESH');
    expect((rows[0] as { staleness_computed_at: Date | null }).staleness_computed_at).toBeNull();
  });

  it('enforces the FRESH/STALE/SUPERSEDED check constraint', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const { db } = suite.require();
    await expect(
      db.client.query(`UPDATE opportunities SET staleness = 'BOGUS' WHERE id = $1`, [
        opportunity.id,
      ]),
    ).rejects.toThrow(/opportunities_staleness_check/);
  });
});

describe('classifyOpportunityStaleness', () => {
  it('classifies FRESH end to end from a recently observed ResearchSignal (R-19)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const now = new Date('2026-07-01T09:00:00.000Z');
    const classified = await classifyOpportunityStaleness(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
      now,
    );

    expect(classified.staleness).toBe('FRESH');
    expect(classified.stalenessComputedAt).toEqual(now);
  });

  it('classifies STALE once the observed signal has aged past SIGNAL_FRESH_DAYS', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    const observedAt = new Date('2026-01-01T00:00:00.000Z');
    await runResearch(rd, a.token, { prospectId }, observedAt);
    const opportunity = await createOpportunity(
      opportunityDeps(base),
      a.token,
      { prospectId },
      observedAt,
    );

    const later = new Date(observedAt.getTime() + (SIGNAL_FRESH_DAYS + 5) * 86_400_000);
    const classified = await classifyOpportunityStaleness(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
      later,
    );

    expect(classified.staleness).toBe('STALE');
  });

  it('classifies SUPERSEDED when research found nothing to persist as evidence', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, unmatchedResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const classified = await classifyOpportunityStaleness(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
    );

    expect(classified.staleness).toBe('SUPERSEDED');
  });

  it('re-research superseding prior signals moves a previously FRESH Opportunity to SUPERSEDED', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const first = await classifyOpportunityStaleness(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
    );
    expect(first.staleness).toBe('FRESH');

    const rd2 = researchDeps(base, unmatchedResearch());
    await runResearch(rd2, a.token, { prospectId });

    const second = await classifyOpportunityStaleness(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
    );
    expect(second.staleness).toBe('SUPERSEDED');
  });

  it('does not mutate `state`, `offer`, or `updated_at`', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const classified = await classifyOpportunityStaleness(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
      new Date('2026-07-01T09:00:00.000Z'),
    );

    expect(classified.state).toBe(opportunity.state);
    expect(classified.offer).toEqual(opportunity.offer);
    expect(classified.updatedAt).toEqual(opportunity.updatedAt);
  });

  it('is deterministic — reclassifying with unchanged signals produces the same result', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    const now = new Date('2026-07-01T09:00:00.000Z');

    const first = await classifyOpportunityStaleness(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
      now,
    );
    const second = await classifyOpportunityStaleness(
      opportunityScoreDeps(base),
      a.token,
      opportunity.id,
      now,
    );

    expect(second.staleness).toBe(first.staleness);
    expect(second.stalenessComputedAt).toEqual(first.stalenessComputedAt);
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const base = repos();
    await expect(
      classifyOpportunityStaleness(opportunityScoreDeps(base), null, 'irrelevant'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("a different authenticated user cannot classify another user's Opportunity — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await expect(
      classifyOpportunityStaleness(opportunityScoreDeps(base), b.token, opportunity.id),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);

    const { db } = suite.require();
    const { rows } = await db.client.query(`SELECT staleness FROM opportunities WHERE id = $1`, [
      opportunity.id,
    ]);
    expect((rows[0] as { staleness: string }).staleness).toBe('FRESH');
  });

  it('an unknown opportunityId is rejected', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(
      classifyOpportunityStaleness(opportunityScoreDeps(base), a.token, 'does-not-exist'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });
});
