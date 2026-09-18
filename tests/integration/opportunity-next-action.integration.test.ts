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
  getOpportunityNextAction,
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
import { randomUUID } from 'node:crypto';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// Opportunity Next Action (Phase 13, R-20/AC-21) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves @acos/core-opportunity's getOpportunityNextAction() end to end:
// derived (never persisted — no migration, no new column) from a real
// Opportunity row's `state`/`needDetected`/`staleness` (migrations
// 0017 and 0019), composing unmodified with Phase 9 (createOpportunity)
// and Phase 12 (classifyOpportunityStaleness), and enforcing the same
// ownership boundary as every other Opportunity read. Mirrors
// tests/integration/opportunity-staleness.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('opportunity_next_action');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const CAREERS = { url: 'https://acme.test/careers', label: 'careers' };

function researchWithSignal(): LeadResearch {
  return {
    companySummary: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    businessModel: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
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
    companySummary: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    businessModel: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
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
  const email = `opportunity-next-action.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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

describe('getOpportunityNextAction', () => {
  it('recommends CONSIDER_OFFER for a freshly created, NEW Opportunity with a detected offer', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const action = await getOpportunityNextAction(opportunityDeps(base), a.token, opportunity.id);

    expect(action).toEqual({ kind: 'CONSIDER_OFFER', label: expect.any(String) });
  });

  it('recommends HOLD end to end when research found no evidence (AC-14 NO SUITABLE OFFER)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, unmatchedResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const action = await getOpportunityNextAction(opportunityDeps(base), a.token, opportunity.id);

    expect(action.kind).toBe('HOLD');
  });

  it('recommends REFRESH_RESEARCH once Phase 12 classifyOpportunityStaleness has persisted STALE', async () => {
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

    const later = new Date(observedAt.getTime() + 60 * 86_400_000);
    await classifyOpportunityStaleness(opportunityScoreDeps(base), a.token, opportunity.id, later);

    const action = await getOpportunityNextAction(
      opportunityDeps(base),
      a.token,
      opportunity.id,
      later,
    );

    expect(action.kind).toBe('REFRESH_RESEARCH');
  });

  it('recommends REFRESH_RESEARCH once Phase 12 classifyOpportunityStaleness has persisted SUPERSEDED', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    await classifyOpportunityStaleness(opportunityScoreDeps(base), a.token, opportunity.id);

    const rd2 = researchDeps(base, unmatchedResearch());
    await runResearch(rd2, a.token, { prospectId });
    await classifyOpportunityStaleness(opportunityScoreDeps(base), a.token, opportunity.id);

    const action = await getOpportunityNextAction(opportunityDeps(base), a.token, opportunity.id);

    expect(action.kind).toBe('REFRESH_RESEARCH');
  });

  it('is a pure read — the Opportunity row is unchanged after the call', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await getOpportunityNextAction(opportunityDeps(base), a.token, opportunity.id);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT state, staleness, staleness_computed_at, updated_at FROM opportunities WHERE id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { state: string }).state).toBe('NEW');
    expect((rows[0] as { staleness: string }).staleness).toBe('FRESH');
    expect(
      (rows[0] as { staleness_computed_at: Date | null }).staleness_computed_at,
    ).toBeNull();
    expect((rows[0] as { updated_at: Date }).updated_at).toEqual(opportunity.updatedAt);
  });

  it('is deterministic — repeated calls against the same persisted row recommend identically', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const first = await getOpportunityNextAction(opportunityDeps(base), a.token, opportunity.id);
    const second = await getOpportunityNextAction(opportunityDeps(base), a.token, opportunity.id);

    expect(second).toEqual(first);
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const base = repos();
    await expect(
      getOpportunityNextAction(opportunityDeps(base), null, 'irrelevant'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it('an unknown opportunityId is rejected', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(
      getOpportunityNextAction(opportunityDeps(base), a.token, 'does-not-exist'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it("a different authenticated user cannot read another user's Opportunity — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, researchWithSignal());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await expect(
      getOpportunityNextAction(opportunityDeps(base), b.token, opportunity.id),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });
});
