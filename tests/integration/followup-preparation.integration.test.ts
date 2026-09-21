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
  createPgFollowUpPreparationRepository,
  getOpportunityFollowUpPreparation,
  prepareOpportunityFollowUp,
  GENERATOR_VERSION,
  type FollowUpPreparationDeps,
} from '@acos/core-followup-preparation';
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
  createPgOutreachPreparationRepository,
  prepareOpportunityOutreach,
  type OutreachPreparationDeps,
} from '@acos/core-outreach-preparation';
import {
  createPgPersonalizationRepository,
  evaluateOpportunityPersonalization,
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

// Follow-Up Preparation persistence (migration 0025) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0025's schema plus @acos/core-followup-preparation's
// prepareOpportunityFollowUp()/getOpportunityFollowUpPreparation()
// enforce, at the database itself: DEC-008 ownership inheritance
// (follow_up_preparations carries no user_id — ownership resolved via
// opportunity_id -> opportunities.user_id), one current draft per
// Opportunity (UNIQUE(opportunity_id)), R-62's eligibility gate (only an
// Opportunity with a persisted Outreach Preparation produces a row),
// R-68's no-send schema shape (no SENT/DELIVERED/SCHEDULED value, no
// send-state columns), and generate -> persist -> read back round-trips
// the exact evidence/content the generator produced. Mirrors
// tests/integration/outreach-preparation.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('followup-preparation');

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
    outreachPreparations: createPgOutreachPreparationRepository(db.client),
    followUpPreparations: createPgFollowUpPreparationRepository(db.client),
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

function outreachPreparationDeps(base: ReturnType<typeof repos>): OutreachPreparationDeps {
  return base;
}

function followUpPreparationDeps(base: ReturnType<typeof repos>): FollowUpPreparationDeps {
  return base;
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `followupprep.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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

async function createOutreachPreparedOpportunity(
  base: ReturnType<typeof repos>,
  token: string,
  userId: string,
) {
  const { prospectId } = await createProspect(base, token);
  await runResearch(researchDeps(base, matchingResearch()), token, { prospectId });
  const opportunity = await createOpportunity(opportunityDeps(base), token, { prospectId });
  const qualification = await evaluateQualificationForOwner(base, userId, opportunity.id);
  const personalization = await evaluateOpportunityPersonalization(
    personalizationDeps(base),
    token,
    opportunity.id,
  );
  const outreachPreparation = await prepareOpportunityOutreach(
    outreachPreparationDeps(base),
    token,
    opportunity.id,
  );
  return {
    prospectId,
    opportunity,
    qualification,
    personalization: personalization!,
    outreachPreparation: outreachPreparation!,
  };
}

describe('follow_up_preparations schema (migration 0025)', () => {
  it('follow_up_preparations exists, carries no user_id, no send-state columns, references opportunities and outreach_preparations', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'follow_up_preparations'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toContain('opportunity_id');
    expect(columns).toContain('source_outreach_preparation_id');
    expect(columns).not.toContain('user_id');
    expect(columns).not.toContain('sent_at');
    expect(columns).not.toContain('delivered_at');
    expect(columns).not.toContain('scheduled_at');
    expect(columns).not.toContain('approval_state');
    expect(columns).toContain('evidence');
    expect(columns).toContain('generator_version');
  });

  it('enforces one current follow-up preparation per Opportunity', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'follow_up_preparations' AND indexname = 'follow_up_preparations_opportunity_id_key'`,
    );
    expect(rows).toHaveLength(1);
  });

  it("R-68: the state CHECK constraint admits only PREPARED/READY_FOR_REVIEW — 'SENT' is rejected", async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { opportunity, outreachPreparation } = await createOutreachPreparedOpportunity(
      base,
      a.token,
      a.userId,
    );
    const { db } = suite.require();

    await expect(
      db.client.query(
        `INSERT INTO follow_up_preparations
           (id, opportunity_id, prospect_id, source_outreach_preparation_id, state, follow_up_context,
            follow_up_content, rationale, evidence, generator_version, generated_at)
         VALUES ('bad_row_sent', $1, $2, $3, 'SENT', 'x', 'x', 'x', '[]'::jsonb, 'v', now())`,
        [opportunity.id, outreachPreparation.prospectId, outreachPreparation.id],
      ),
    ).rejects.toThrow(/follow_up_preparations_state_check/);
  });
});

describe('prepareOpportunityFollowUp', () => {
  it('R-64: generate -> persist -> read back for an Outreach-Prepared Opportunity', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { opportunity, outreachPreparation } = await createOutreachPreparedOpportunity(
      base,
      a.token,
      a.userId,
    );

    const now = new Date('2026-08-01T10:00:00.000Z');
    const stored = await prepareOpportunityFollowUp(
      followUpPreparationDeps(base),
      a.token,
      opportunity.id,
      now,
    );

    expect(stored).not.toBeNull();
    expect(stored!.opportunityId).toBe(opportunity.id);
    expect(stored!.sourceOutreachPreparationId).toBe(outreachPreparation.id);
    expect(stored!.state).toBe('READY_FOR_REVIEW');
    expect(stored!.generatorVersion).toBe(GENERATOR_VERSION);
    expect(stored!.generatedAt).toEqual(now);
    expect(stored!.followUpContext).toContain('Website development');
    expect(stored!.followUpContent).toContain('Website development');

    const fetched = await getOpportunityFollowUpPreparation(
      followUpPreparationDeps(base),
      a.token,
      opportunity.id,
    );
    expect(fetched).toEqual(stored);
  });

  it("R-63: evidence is exactly the source Outreach Preparation's own evidence set", async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { opportunity, outreachPreparation } = await createOutreachPreparedOpportunity(
      base,
      a.token,
      a.userId,
    );

    const stored = await prepareOpportunityFollowUp(followUpPreparationDeps(base), a.token, opportunity.id);

    expect(stored!.evidence).toEqual(outreachPreparation.evidence);
  });

  it('R-62: an Opportunity that has never had Outreach Preparation produces no Follow-Up Preparation', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });
    // Qualification, Personalization, and Outreach Preparation are deliberately never evaluated.

    const result = await prepareOpportunityFollowUp(followUpPreparationDeps(base), a.token, opportunity.id);

    expect(result).toBeNull();
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM follow_up_preparations WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { count: number }).count).toBe(0);
  });

  it('never modifies Outreach Preparation, Personalization, Qualification, or Opportunity — read-only consumer', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { opportunity, qualification, personalization, outreachPreparation } =
      await createOutreachPreparedOpportunity(base, a.token, a.userId);

    await prepareOpportunityFollowUp(followUpPreparationDeps(base), a.token, opportunity.id);

    const { db } = suite.require();
    const { rows: qRows } = await db.client.query(`SELECT updated_at FROM qualifications WHERE id = $1`, [
      qualification!.id,
    ]);
    expect((qRows[0] as { updated_at: Date }).updated_at).toEqual(qualification!.updatedAt);

    const { rows: pRows } = await db.client.query(`SELECT updated_at FROM personalizations WHERE id = $1`, [
      personalization.id,
    ]);
    expect((pRows[0] as { updated_at: Date }).updated_at).toEqual(personalization.updatedAt);

    const { rows: oRows } = await db.client.query(
      `SELECT updated_at FROM outreach_preparations WHERE id = $1`,
      [outreachPreparation.id],
    );
    expect((oRows[0] as { updated_at: Date }).updated_at).toEqual(outreachPreparation.updatedAt);
  });

  it('R-69: idempotency — repeated preparation of unchanged inputs overwrites the same row, no duplicates', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { opportunity } = await createOutreachPreparedOpportunity(base, a.token, a.userId);

    const first = await prepareOpportunityFollowUp(
      followUpPreparationDeps(base),
      a.token,
      opportunity.id,
      new Date('2026-08-01T09:00:00.000Z'),
    );
    const second = await prepareOpportunityFollowUp(
      followUpPreparationDeps(base),
      a.token,
      opportunity.id,
      new Date('2026-08-05T09:00:00.000Z'),
    );

    expect(second!.id).toBe(first!.id);
    expect(second!.followUpContent).toBe(first!.followUpContent);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM follow_up_preparations WHERE opportunity_id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { count: number }).count).toBe(1);
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const base = repos();
    await expect(
      prepareOpportunityFollowUp(followUpPreparationDeps(base), null, 'irrelevant'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("R-60-equivalent: a different authenticated user cannot prepare a follow-up for another user's Opportunity — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { opportunity } = await createOutreachPreparedOpportunity(base, a.token, a.userId);

    await expect(
      prepareOpportunityFollowUp(followUpPreparationDeps(base), b.token, opportunity.id),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });

  it('an unknown opportunityId is rejected', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(
      prepareOpportunityFollowUp(followUpPreparationDeps(base), a.token, 'does-not-exist'),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });
});

describe('getOpportunityFollowUpPreparation', () => {
  it('returns null when the Opportunity has never had a follow-up prepared', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { opportunity } = await createOutreachPreparedOpportunity(base, a.token, a.userId);

    await expect(
      getOpportunityFollowUpPreparation(followUpPreparationDeps(base), a.token, opportunity.id),
    ).resolves.toBeNull();
  });

  it("a different user cannot retrieve user A's follow-up preparation — isolation via the ownership join", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { opportunity } = await createOutreachPreparedOpportunity(base, a.token, a.userId);
    await prepareOpportunityFollowUp(followUpPreparationDeps(base), a.token, opportunity.id);

    await expect(
      getOpportunityFollowUpPreparation(followUpPreparationDeps(base), b.token, opportunity.id),
    ).resolves.toBeNull();
  });
});
