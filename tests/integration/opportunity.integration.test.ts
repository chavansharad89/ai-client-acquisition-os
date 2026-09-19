import { randomUUID } from 'node:crypto';

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
  OpportunityProspectNotFoundError,
  type OpportunityDeps,
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

// Opportunity ownership + need/offer model — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0017's schema plus @acos/core-opportunity's
// persistence layer enforce, at the database itself: top-level user_id
// ownership (unlike research_signals' inherited ownership), one
// Opportunity per Prospect, the need/offer all-or-nothing CHECK, and
// that suggestOffers() is reused unmodified end to end from persisted
// ResearchSignal rows through the caller's own Search-snapshot
// ServiceProfile. Mirrors tests/integration/research.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('opportunity');

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
    recommendedService: {
      service: 'NONE',
      rationale: 'insufficient evidence to recommend one',
      basedOn: [],
    },
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
    recommendedService: {
      service: 'NONE',
      rationale: 'insufficient evidence to recommend one',
      basedOn: [],
    },
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

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `opportunity.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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
    // visibleProblems maps to kind WEBSITE (see @acos/core-research's
    // persist.ts FIELD_KIND — the research engine never produces
    // JOB_POST/FUNDING/LINKEDIN/REVIEW/MANUAL today).
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

describe('opportunities schema (migration 0017)', () => {
  it('opportunities exists, carries its own user_id, references prospects', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'opportunities'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toContain('user_id');
    expect(columns).toContain('prospect_id');
    expect(columns).toContain('state');
  });

  it('enforces one Opportunity per Prospect', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'opportunities' AND indexname = 'opportunities_prospect_id_key'`,
    );
    expect(rows).toHaveLength(1);
  });
});

describe('createOpportunity', () => {
  it("detects a need and recommends an offer from the caller's own Prospect, persisted with its state (R-11/R-12/R-13)", async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    expect(opportunity.userId).toBe(a.userId);
    expect(opportunity.prospectId).toBe(prospectId);
    expect(opportunity.state).toBe('NEW');
    expect(opportunity.needDetected).toBe(true);
    expect(opportunity.offer?.service).toBe('AI content system');
    expect(opportunity.offer?.basedOn).toEqual(['hiring a content writer']);
  });

  it('AC-13/AC-14: a Prospect with no matching evidence persists NO SUITABLE OFFER, not a default to the service', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, unmatchedResearch());
    await runResearch(rd, a.token, { prospectId });

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    expect(opportunity.needDetected).toBe(false);
    expect(opportunity.offer).toBeUndefined();

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT recommended_service, offer_rationale, offer_fit FROM opportunities WHERE id = $1`,
      [opportunity.id],
    );
    expect(rows[0]).toEqual({
      recommended_service: null,
      offer_rationale: null,
      offer_fit: null,
    });
  });

  it('a Prospect never researched (no signals) also persists NO SUITABLE OFFER', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    expect(opportunity.needDetected).toBe(false);
    expect(opportunity.offer).toBeUndefined();
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const base = repos();
    await expect(
      createOpportunity(opportunityDeps(base), null, { prospectId: 'irrelevant' }),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('a different authenticated user cannot create an Opportunity against the Prospect — treated as not found', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });

    await expect(
      createOpportunity(opportunityDeps(base), b.token, { prospectId }),
    ).rejects.toBeInstanceOf(OpportunityProspectNotFoundError);
  });

  it('an unknown prospectId is rejected', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(
      createOpportunity(opportunityDeps(base), a.token, { prospectId: 'does-not-exist' }),
    ).rejects.toBeInstanceOf(OpportunityProspectNotFoundError);
  });

  it('a second Opportunity for the same Prospect violates the unique constraint', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });

    await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await expect(
      createOpportunity(opportunityDeps(base), a.token, { prospectId }),
    ).rejects.toThrow();
  });
});
