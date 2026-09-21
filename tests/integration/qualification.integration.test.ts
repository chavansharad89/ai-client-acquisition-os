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
  OpportunityNotFoundError,
  type OpportunityDeps,
} from '@acos/core-opportunity';
import {
  createPgQualificationRepository,
  evaluateOpportunityQualification,
  evaluateQualificationForOwner,
  EVALUATOR_VERSION,
  getOpportunityQualification,
  type QualificationDeps,
} from '@acos/core-qualification';
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

// Qualification persistence (migration 0022) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0022's schema plus @acos/core-qualification's
// evaluateOpportunityQualification()/getOpportunityQualification()
// enforce, at the database itself: DEC-008 ownership inheritance
// (qualifications carries no user_id — ownership resolved via
// opportunity_id -> opportunities.user_id), one current qualification per
// Opportunity (UNIQUE(opportunity_id)), and evaluate -> persist -> read
// back round-trips the exact state/criteria/evidence produced by the
// evaluator. Mirrors tests/integration/opportunity-score.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('qualification');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const CAREERS = { url: 'https://acme.test/careers', label: 'careers' };

function matchingResearch(): LeadResearch {
  return {
    companySummary: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    businessModel: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    targetCustomers: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
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
    targetCustomers: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
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
    qualifications: createPgQualificationRepository(db.client),
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

function qualificationDeps(base: ReturnType<typeof repos>): QualificationDeps {
  return base;
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `qualification.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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
    // visibleProblems (the field matchingResearch() populates) maps to
    // ResearchSourceKind 'WEBSITE' via @acos/core-research's FIELD_KIND —
    // not 'JOB_POST' — see opportunity-score.integration.test.ts's own
    // sampleProfileInput() for the same trigger choice.
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

describe('qualifications schema (migration 0022)', () => {
  it('qualifications exists, carries no user_id, references opportunities', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'qualifications'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toContain('opportunity_id');
    expect(columns).not.toContain('user_id');
    expect(columns).toContain('criteria');
    expect(columns).toContain('evaluator_version');
  });

  it('enforces one current qualification per Opportunity', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'qualifications' AND indexname = 'qualifications_opportunity_id_key'`,
    );
    expect(rows).toHaveLength(1);
  });
});

describe('evaluateOpportunityQualification', () => {
  it('evaluate -> persist -> read back: same state + criteria + evidence references', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    const now = new Date('2026-07-01T09:00:00.000Z');

    const stored = await evaluateOpportunityQualification(
      qualificationDeps(base),
      a.token,
      opportunity.id,
      now,
    );

    expect(stored.state).toBe('QUALIFIED');
    expect(stored.opportunityId).toBe(opportunity.id);
    expect(stored.prospectId).toBe(prospectId);
    expect(stored.evaluatorVersion).toBe(EVALUATOR_VERSION);
    expect(stored.evaluatedAt).toEqual(now);
    expect(stored.evidenceSignalIds.length).toBeGreaterThan(0);

    const fetched = await getOpportunityQualification(qualificationDeps(base), a.token, opportunity.id);
    expect(fetched).toEqual(stored);
  });

  it('AC-14: an Opportunity with NO SUITABLE OFFER (needDetected=false) is NOT_QUALIFIED (Decision D1)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, unmatchedResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    expect(opportunity.needDetected).toBe(false);

    const stored = await evaluateOpportunityQualification(qualificationDeps(base), a.token, opportunity.id);

    expect(stored.state).toBe('NOT_QUALIFIED');
    expect(stored.criteria).toHaveLength(1);
  });

  it('idempotency: repeated evaluation of unchanged evidence overwrites the same row — no duplicates', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const first = await evaluateOpportunityQualification(
      qualificationDeps(base),
      a.token,
      opportunity.id,
      new Date('2026-07-01T09:00:00.000Z'),
    );
    const second = await evaluateOpportunityQualification(
      qualificationDeps(base),
      a.token,
      opportunity.id,
      new Date('2026-07-05T09:00:00.000Z'),
    );

    expect(second.id).toBe(first.id);
    expect(second.state).toBe(first.state);
    expect(second.criteria).toEqual(first.criteria);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM qualifications WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { count: number }).count).toBe(1);
  });

  it('re-evaluation: superseding the evidentiary signal changes the persisted state on the next explicit call', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const first = await evaluateOpportunityQualification(qualificationDeps(base), a.token, opportunity.id);
    expect(first.state).toBe('QUALIFIED');

    // A second Research run supersedes the prior signals with an empty result.
    await runResearch(researchDeps(base, unmatchedResearch()), a.token, { prospectId });

    const second = await evaluateQualificationForOwner(base, a.userId, opportunity.id, new Date());

    expect(second.id).toBe(first.id);
    expect(second.state).toBe('INSUFFICIENT_EVIDENCE');

    // The original ResearchSignal rows are superseded, never deleted or
    // mutated in place — unmatchedResearch() still persists live UNKNOWN
    // rows for the unclaimed fields (Observation model: UNKNOWN survives
    // persistence), so the live-and-evidentiary count is what must be
    // zero, not the raw live-row count.
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM research_signals
        WHERE prospect_id = $1 AND superseded_at IS NULL AND classification != 'UNKNOWN'`,
      [prospectId],
    );
    expect((rows[0] as { count: number }).count).toBe(0);
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const base = repos();
    await expect(
      evaluateOpportunityQualification(qualificationDeps(base), null, 'irrelevant'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("a different authenticated user cannot evaluate another user's Opportunity — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await expect(
      evaluateOpportunityQualification(qualificationDeps(base), b.token, opportunity.id),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it('an unknown opportunityId is rejected', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(
      evaluateOpportunityQualification(qualificationDeps(base), a.token, 'does-not-exist'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });
});

describe('getOpportunityQualification', () => {
  it('returns null when the Opportunity has never been evaluated', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await expect(
      getOpportunityQualification(qualificationDeps(base), a.token, opportunity.id),
    ).resolves.toBeNull();
  });

  it("a different user cannot retrieve user A's qualification — isolation via the ownership join", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    await evaluateOpportunityQualification(qualificationDeps(base), a.token, opportunity.id);

    await expect(
      getOpportunityQualification(qualificationDeps(base), b.token, opportunity.id),
    ).resolves.toBeNull();
  });
});
