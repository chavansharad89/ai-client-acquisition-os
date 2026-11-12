import { randomUUID } from 'node:crypto';

import {
  rankByUniversalProfile,
  unknownRankingProfile,
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
  rankOpportunities,
  scoreOpportunity,
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
import { Pool } from 'pg';

import { suiteDatabase } from './support/suiteDb';

// Opportunity ranking (Phase 11, R-15/AC-17; qualitative since Phase 3) —
// real PostgreSQL.
// -----------------------------------------------------------------------
// Proves @acos/core-opportunity's rankOpportunities() orders real,
// persisted OpportunityScore rows (migration 0018/0044) lexicographically
// by dimension tier, enforces ownership at the SQL boundary (JOIN
// opportunities, same pattern as scorePgRepository.ts's
// getByOpportunityId), and is a pure read — no schema change of its own,
// no mutation of any existing row. Mirrors
// tests/integration/opportunity-score.integration.test.ts. Most
// scenarios seed scores directly via scores.upsert() with hand-built
// UniversalRankingProfile values (the same technique service.test.ts's
// unit tests use) so ordering is precisely controllable; one test exercises
// the full realistic chain via a real scoreOpportunity() call.
// -----------------------------------------------------------------------

const suite = suiteDatabase('opportunity_ranking');
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
  const email = `opportunity-ranking.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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

/** Creates one Search and runs Discovery over `candidates` in one call — order-preserved (core-discovery's runDiscovery). */
async function createProspects(
  base: ReturnType<typeof repos>,
  token: string,
  candidates: readonly DiscoveryCandidate[],
): Promise<{ search: StoredSearch; prospectIds: string[] }> {
  const d = discoveryDeps(base, candidates);
  const profile = await createServiceProfile(d, token, sampleProfileInput());
  const created = await createSearch(d, token, { serviceProfileId: profile.id });
  const running = (await transitionSearch(d, token, created.id, { status: 'RUNNING' }))!;
  const result = await runDiscovery(d, token, { searchId: running.id });
  return { search: running, prospectIds: result.prospects.map((p) => p.id) };
}

/** A ranking profile for seeding, overriding only the dimension(s) a test cares about. */
function sampleRanking(overrides: Partial<UniversalRankingProfile> = {}): UniversalRankingProfile {
  return { ...unknownRankingProfile(), needOpportunity: 'MODERATE', ...overrides };
}

describe('rankOpportunities', () => {
  it('orders real, persisted OpportunityScores by Primary-dimension tier, descending (R-15/AC-17)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectIds } = await createProspects(base, a.token, [
      { name: 'Acme Co', website: 'https://acme.example.com' },
      { name: 'Beta Co', website: 'https://beta.example.com' },
      { name: 'Gamma Co', website: 'https://gamma.example.com' },
    ]);

    const opp1 = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[0]!,
    });
    const opp2 = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[1]!,
    });
    const opp3 = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[2]!,
    });

    await base.scores.upsert(opp1.id, sampleRanking({ needOpportunity: 'MODERATE' }), [], 'v1', new Date());
    await base.scores.upsert(opp2.id, sampleRanking({ needOpportunity: 'WEAK' }), [], 'v1', new Date());
    await base.scores.upsert(opp3.id, sampleRanking({ needOpportunity: 'STRONG' }), [], 'v1', new Date());

    const ranked = await rankOpportunities(opportunityScoreDeps(base), a.token);

    expect(ranked.map((r) => r.opportunityId)).toEqual([opp3.id, opp1.id, opp2.id]);
    expect(ranked.map((r) => r.rank)).toEqual([1, 2, 3]);
  });

  it('enforces ownership at the SQL boundary — a different user never sees these rows, even when ranked higher', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();

    const forA = await createProspects(base, a.token, [
      { name: 'Acme Co', website: 'https://acme.example.com' },
    ]);
    const forB = await createProspects(base, b.token, [
      { name: 'Beta Co', website: 'https://beta.example.com' },
    ]);

    const oppA = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: forA.prospectIds[0]!,
    });
    const oppB = await createOpportunity(opportunityDeps(base), b.token, {
      prospectId: forB.prospectIds[0]!,
    });

    await base.scores.upsert(oppA.id, sampleRanking({ needOpportunity: 'WEAK' }), [], 'v1', new Date());
    await base.scores.upsert(oppB.id, sampleRanking({ needOpportunity: 'STRONG' }), [], 'v1', new Date());

    const rankedForA = await rankOpportunities(opportunityScoreDeps(base), a.token);

    expect(rankedForA).toHaveLength(1);
    expect(rankedForA[0]!.opportunityId).toBe(oppA.id);
  });

  it('produces an identical order across repeated calls against the same persisted data (AC-17)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectIds } = await createProspects(base, a.token, [
      { name: 'Acme Co', website: 'https://acme.example.com' },
      { name: 'Beta Co', website: 'https://beta.example.com' },
    ]);
    const opp1 = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[0]!,
    });
    const opp2 = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[1]!,
    });
    await base.scores.upsert(opp1.id, sampleRanking({ needOpportunity: 'STRONG' }), [], 'v1', new Date());
    await base.scores.upsert(opp2.id, sampleRanking({ needOpportunity: 'WEAK' }), [], 'v1', new Date());

    const first = await rankOpportunities(opportunityScoreDeps(base), a.token);
    const second = await rankOpportunities(opportunityScoreDeps(base), a.token);

    expect(second).toEqual(first);
  });

  it('excludes an Opportunity that has never been scored', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectIds } = await createProspects(base, a.token, [
      { name: 'Acme Co', website: 'https://acme.example.com' },
      { name: 'Beta Co', website: 'https://beta.example.com' },
    ]);
    const scored = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[0]!,
    });
    const unscored = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[1]!,
    });
    await base.scores.upsert(scored.id, sampleRanking(), [], 'v1', new Date());

    const ranked = await rankOpportunities(opportunityScoreDeps(base), a.token);

    expect(ranked).toHaveLength(1);
    expect(ranked[0]!.opportunityId).toBe(scored.id);
    expect(ranked.some((r) => r.opportunityId === unscored.id)).toBe(false);
  });

  it('never eliminates a candidate — an UNKNOWN-on-every-dimension Opportunity still appears, ranked, not removed', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectIds } = await createProspects(base, a.token, [
      { name: 'Acme Co', website: 'https://acme.example.com' },
      { name: 'Beta Co', website: 'https://beta.example.com' },
    ]);
    const strong = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[0]!,
    });
    const noEvidence = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[1]!,
    });
    await base.scores.upsert(strong.id, sampleRanking({ needOpportunity: 'STRONG' }), [], 'v1', new Date());
    await base.scores.upsert(noEvidence.id, unknownRankingProfile(), [], 'v1', new Date());

    const ranked = await rankOpportunities(opportunityScoreDeps(base), a.token);

    expect(ranked.map((r) => r.opportunityId)).toEqual([strong.id, noEvidence.id]);
    expect(ranked).toHaveLength(2);
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const base = repos();
    await expect(rankOpportunities(opportunityScoreDeps(base), null)).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('returns an empty array when the user has no scored Opportunities', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(rankOpportunities(opportunityScoreDeps(base), a.token)).resolves.toEqual([]);
  });

  it('is a pure read — ranking does not mutate the persisted OpportunityScore row', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectIds } = await createProspects(base, a.token, [
      { name: 'Acme Co', website: 'https://acme.example.com' },
    ]);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[0]!,
    });
    const stored = await base.scores.upsert(opportunity.id, sampleRanking(), [], 'v1', new Date());

    await rankOpportunities(opportunityScoreDeps(base), a.token);

    const { rows } = await suite
      .require()
      .db.client.query(
        `SELECT factors, scorer_version FROM opportunity_scores WHERE opportunity_id = $1`,
        [opportunity.id],
      );
    // Scoped to this test's own Opportunity, not a table-wide count — the
    // suite database is shared across every test in this file (one
    // database per suite, not per test; see suiteDb.ts), so other tests'
    // rows are legitimately still present here.
    expect(rows).toHaveLength(1);
    expect((rows[0] as { factors: UniversalRankingProfile }).factors).toEqual(stored.ranking);
    expect((rows[0] as { scorer_version: string }).scorer_version).toBe(stored.rankerVersion);
  });

  it('full chain: Search → Prospect → ResearchSignal → Opportunity → OpportunityScore → Rank', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectIds } = await createProspects(base, a.token, [
      { name: 'Acme Co', website: 'https://acme.example.com' },
    ]);
    const rd = researchDeps(base, matchingResearch());
    await runResearch(rd, a.token, { prospectId: prospectIds[0]! });

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, {
      prospectId: prospectIds[0]!,
    });
    const scored = await scoreOpportunity(opportunityScoreDeps(base), a.token, opportunity.id);

    const ranked = await rankOpportunities(opportunityScoreDeps(base), a.token);

    expect(ranked).toEqual([{ opportunityId: opportunity.id, rank: 1, score: scored }]);
  });
});
