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
  createPgPersonalizationRepository,
  evaluateOpportunityPersonalization,
  evaluatePersonalizationForOwner,
  getOpportunityPersonalization,
  GENERATOR_VERSION,
  type PersonalizationDeps,
} from '@acos/core-personalization';
import {
  createPgQualificationRepository,
  evaluateQualificationForOwner,
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

// Personalization persistence (migration 0023) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0023's schema plus @acos/core-personalization's
// evaluateOpportunityPersonalization()/getOpportunityPersonalization()
// enforce, at the database itself: DEC-008 ownership inheritance
// (personalizations carries no user_id — ownership resolved via
// opportunity_id -> opportunities.user_id), one current personalization
// per Opportunity (UNIQUE(opportunity_id)), R-42's eligibility gate
// (only a QUALIFIED Qualification produces a row), and
// generate -> persist -> read back round-trips the exact evidence/offer
// the generator produced. Mirrors
// tests/integration/qualification.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('personalization');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const WEBSITE = { url: 'https://acme.test', label: 'homepage' };

function matchingResearch(): LeadResearch {
  return {
    companySummary: {
      classification: 'OBSERVED',
      value: 'needs a website redesign',
      evidence: [{ quote: 'needs a website redesign', sourceUrl: WEBSITE.url, sourceLabel: WEBSITE.label }],
      basis: null,
      confidence: 88,
    },
    businessModel: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    targetCustomers: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    visibleProblems: [],
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
    personalizations: createPgPersonalizationRepository(db.client),
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

function personalizationDeps(base: ReturnType<typeof repos>): PersonalizationDeps {
  return base;
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `personalization.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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
    service: 'Website development',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 15_000_000,
    // companySummary (the field matchingResearch() populates) maps to
    // ResearchSourceKind 'WEBSITE' via @acos/core-research's FIELD_KIND.
    triggers: ['WEBSITE'],
    keywords: ['redesign'],
    rationale: 'They need a website refresh ({signal}).',
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

describe('personalizations schema (migration 0023)', () => {
  it('personalizations exists, carries no user_id, references opportunities', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'personalizations'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toContain('opportunity_id');
    expect(columns).not.toContain('user_id');
    expect(columns).toContain('evidence');
    expect(columns).toContain('generator_version');
  });

  it('enforces one current personalization per Opportunity', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'personalizations' AND indexname = 'personalizations_opportunity_id_key'`,
    );
    expect(rows).toHaveLength(1);
  });
});

describe('evaluateOpportunityPersonalization', () => {
  it('R-45: generate -> persist -> read back for a QUALIFIED Opportunity', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    const qualification = await evaluateQualificationForOwner(base, a.userId, opportunity.id);
    expect(qualification.state).toBe('QUALIFIED');

    const now = new Date('2026-07-01T10:00:00.000Z');
    const stored = await evaluateOpportunityPersonalization(
      personalizationDeps(base),
      a.token,
      opportunity.id,
      now,
    );

    expect(stored).not.toBeNull();
    expect(stored!.opportunityId).toBe(opportunity.id);
    expect(stored!.prospectId).toBe(prospectId);
    expect(stored!.state).toBe('GENERATED');
    expect(stored!.offerService).toBe('Website development');
    expect(stored!.generatorVersion).toBe(GENERATOR_VERSION);
    expect(stored!.generatedAt).toEqual(now);
    expect(stored!.evidence.length).toBeGreaterThan(0);
    expect(stored!.evidence.every((item) => qualification.evidenceSignalIds.includes(item.signalId))).toBe(
      true,
    );
    expect(stored!.openingContext).toContain('Acme Co');
    expect(stored!.valueProposition).toContain('Website development');

    const fetched = await getOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id);
    expect(fetched).toEqual(stored);
  });

  it('R-42: NOT_QUALIFIED (needDetected=false) produces no Personalization', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, unmatchedResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    expect(opportunity.needDetected).toBe(false);
    const qualification = await evaluateQualificationForOwner(base, a.userId, opportunity.id);
    expect(qualification.state).toBe('NOT_QUALIFIED');

    const result = await evaluateOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id);

    expect(result).toBeNull();
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM personalizations WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { count: number }).count).toBe(0);
  });

  it('R-42: INSUFFICIENT_EVIDENCE produces no Personalization', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    await evaluateQualificationForOwner(base, a.userId, opportunity.id);

    // A second Research run supersedes the only evidentiary signal.
    await runResearch(researchDeps(base, unmatchedResearch()), a.token, { prospectId });
    const qualification = await evaluateQualificationForOwner(base, a.userId, opportunity.id);
    expect(qualification.state).toBe('INSUFFICIENT_EVIDENCE');

    const result = await evaluateOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id);

    expect(result).toBeNull();
  });

  it('R-42: a missing Qualification (never evaluated) produces no Personalization', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    // Qualification is deliberately never evaluated.

    const result = await evaluateOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id);

    expect(result).toBeNull();
  });

  it('R-42: never modifies Qualification — the row is byte-for-byte unchanged after Personalization runs', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    const qualification = await evaluateQualificationForOwner(base, a.userId, opportunity.id);

    await evaluateOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id);

    const { db } = suite.require();
    const { rows } = await db.client.query(`SELECT updated_at FROM qualifications WHERE id = $1`, [
      qualification.id,
    ]);
    expect((rows[0] as { updated_at: Date }).updated_at).toEqual(qualification.updatedAt);
  });

  it('R-49/R-50: idempotency — repeated evaluation of unchanged inputs overwrites the same row, no duplicates', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    await evaluateQualificationForOwner(base, a.userId, opportunity.id);

    const first = await evaluateOpportunityPersonalization(
      personalizationDeps(base),
      a.token,
      opportunity.id,
      new Date('2026-07-01T09:00:00.000Z'),
    );
    const second = await evaluateOpportunityPersonalization(
      personalizationDeps(base),
      a.token,
      opportunity.id,
      new Date('2026-07-05T09:00:00.000Z'),
    );

    expect(second!.id).toBe(first!.id);
    expect(second!.openingContext).toBe(first!.openingContext);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM personalizations WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { count: number }).count).toBe(1);
  });

  it('a Qualification that later moves away from QUALIFIED leaves the existing Personalization row untouched', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    await evaluateQualificationForOwner(base, a.userId, opportunity.id);
    const first = await evaluateOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id);
    expect(first).not.toBeNull();

    await runResearch(researchDeps(base, unmatchedResearch()), a.token, { prospectId });
    const qualification = await evaluateQualificationForOwner(base, a.userId, opportunity.id);
    expect(qualification.state).toBe('INSUFFICIENT_EVIDENCE');

    const second = await evaluateOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id);
    expect(second).toBeNull(); // R-42: not (re-)generated

    const stillThere = await getOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id);
    expect(stillThere).toEqual(first); // R-49/R-52: existing row left exactly as it was
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const base = repos();
    await expect(
      evaluateOpportunityPersonalization(personalizationDeps(base), null, 'irrelevant'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("a different authenticated user cannot evaluate another user's Opportunity — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    await evaluateQualificationForOwner(base, a.userId, opportunity.id);

    await expect(
      evaluateOpportunityPersonalization(personalizationDeps(base), b.token, opportunity.id),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it('an unknown opportunityId is rejected', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(
      evaluateOpportunityPersonalization(personalizationDeps(base), a.token, 'does-not-exist'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });
});

describe('getOpportunityPersonalization', () => {
  it('returns null when the Opportunity has never been personalized', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await expect(
      getOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id),
    ).resolves.toBeNull();
  });

  it("a different user cannot retrieve user A's personalization — isolation via the ownership join", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await runResearch(researchDeps(base, matchingResearch()), a.token, { prospectId });
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    await evaluateQualificationForOwner(base, a.userId, opportunity.id);
    await evaluateOpportunityPersonalization(personalizationDeps(base), a.token, opportunity.id);

    await expect(
      getOpportunityPersonalization(personalizationDeps(base), b.token, opportunity.id),
    ).resolves.toBeNull();
  });
});
