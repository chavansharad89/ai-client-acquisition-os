import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';

import {
  createPgCompanyRepository,
  createPgEntityRepository,
  createPgProspectRepository,
  type DiscoveryCandidate,
  type DiscoveryProvider,
} from '@acos/core-discovery';
import { createPgIdentityRepository, mintUserSession } from '@acos/core-identity';
import { createPgOpportunityRepository } from '@acos/core-opportunity';
import {
  createPgResearchSignalCacheRepository,
  createPgResearchSignalRepository,
  createPgTargetCustomerMatchRepository,
  type DeterministicSignal,
  type LeadResearch,
  type ModelResult,
  type ResearchModel,
  type ResearchProvider,
  type ResearchProviderInput,
  type ServiceSignalCatalogue,
  type SourceDocumentProvider,
} from '@acos/core-research';
import { createPgSearchRepository, createSearch, type SearchDeps } from '@acos/core-search';
import {
  createPgServiceProfileRepository,
  createServiceProfile,
  type ServiceProfileInput,
} from '@acos/core-service-profile';
import { claimAndProcessNextSearch, type SearchWorkerDeps } from '@acos/worker/searchWorker';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createHistoricalServiceProfile } from './support/historicalServiceProfile';
import { suiteDatabase } from './support/suiteDb';

// Real-Postgres proof of R-34 worker orchestration: claim concurrency,
// lease recovery, bounded-retry exhaustion, end-to-end pipeline
// execution, and R-33 cross-user isolation.
// -----------------------------------------------------------------------
// The unit suite (apps/worker/src/searchWorker/worker.test.ts) proves the
// orchestration logic against fakes; only real PostgreSQL can prove that
// `FOR UPDATE SKIP LOCKED` genuinely prevents two connections from
// claiming the same row, and that every write lands under the correct
// owner at the database level.
// -----------------------------------------------------------------------

const suite = suiteDatabase('search_worker');
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
    signalCache: createPgResearchSignalCacheRepository(db.client),
  };
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `search-worker.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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

/** Creates a PENDING Search for `token`, ready for a worker to claim — never transitions it itself. */
async function createPendingSearch(base: ReturnType<typeof repos>, token: string) {
  const profile = await createServiceProfile(base, token, sampleProfileInput());
  return createSearch(base as SearchDeps, token, { serviceProfileId: profile.id });
}

/**
 * K5-D2: a historical-style PENDING Search for the PCG-4/TCM-wiring
 * test only — a real, non-sentinel targetCustomer, so
 * parseTargetSegments(targetCustomer).length > 0 and the
 * targetCustomerMatch write path actually runs. See
 * ./support/historicalServiceProfile.ts. Every other test in this file
 * keeps using createPendingSearch() (a NEW-style search) unchanged.
 */
async function createHistoricalPendingSearch(base: ReturnType<typeof repos>, userId: string, token: string) {
  const profile = await createHistoricalServiceProfile(base.profiles, userId, sampleProfileInput());
  return createSearch(base as SearchDeps, token, { serviceProfileId: profile.id });
}

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return { candidates, actualQuery: 'test query', provider: 'TEST_PROVIDER' };
    },
  };
}

function researchProvider(result: LeadResearch): ResearchProvider {
  return {
    async research() {
      return result;
    },
  };
}

function matchingResearch(): LeadResearch {
  const source = { url: 'https://acme.test/careers', label: 'careers' };
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
          { quote: 'hiring a content writer', sourceUrl: source.url, sourceLabel: source.label },
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
 * matchingResearch() above (a single OBSERVED signal — sufficient for
 * a historical-style search, but no longer sufficient on its own for a
 * NEW Service+Geography-only search, see
 * @acos/core-opportunity's hasCredibleNeedEvidence()), this carries
 * TWO independent OBSERVED, full-confidence signals from distinct
 * fields, both matching this file's "AI & Automation" catalogue
 * vocabulary ('workflow automation', 'business process automation') —
 * credible enough to establish NEED_DETECTED even under the new,
 * stronger bar. Used only by the one test that needs a NEW search to
 * actually reach a detected need; every other test keeps using
 * matchingResearch() unchanged.
 */
function credibleNeedResearch(): LeadResearch {
  const unknownField = { classification: 'UNKNOWN' as const, value: null, evidence: [], basis: null, confidence: 0 };
  const source = { url: 'https://acme.test/careers', label: 'careers' };
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
            sourceUrl: source.url,
            sourceLabel: source.label,
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
            sourceUrl: source.url,
            sourceLabel: source.label,
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

/**
 * Unlike matchingResearch() above, companySummary is OBSERVED (not
 * UNKNOWN) — core-research's recordCacheableSignals() only indexes a
 * signal into research_signal_cache_index when its classification is
 * not UNKNOWN (see packages/core-research/src/service.ts). Used to seed
 * a genuinely reusable WEBSITE-kind cache entry.
 */
function cacheableResearch(): LeadResearch {
  const source = { url: 'https://acme.test/about', label: 'homepage' };
  return {
    companySummary: {
      classification: 'OBSERVED',
      value: 'Sells widgets online',
      evidence: [{ quote: 'Sells widgets online', sourceUrl: source.url, sourceLabel: source.label }],
      basis: null,
      confidence: 80,
    },
    businessModel: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    targetCustomers: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    categoryPlausibility: [],
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 50,
    gaps: [],
  };
}

/** Counts invocations and returns `result` from every call. */
function countingResearchProvider(result: LeadResearch): {
  provider: ResearchProvider;
  calls: () => number;
  lastInput: () => ResearchProviderInput | undefined;
} {
  let calls = 0;
  let last: ResearchProviderInput | undefined;
  return {
    provider: {
      async research(input) {
        calls += 1;
        last = input;
        return result;
      },
    },
    calls: () => calls,
    lastInput: () => last,
  };
}

/**
 * A fake SourceDocumentProvider that counts fetches — used to prove PO-4
 * (pre-admission fetch reuse): Pass 1 (fetchPreAdmissionDocuments) must
 * fetch once, and Research must reuse that result rather than fetching
 * the homepage again.
 */
function countingSourceDocumentProvider(
  text: string,
): { provider: SourceDocumentProvider; calls: () => number } {
  let calls = 0;
  return {
    provider: {
      extractionMethod: 'test-extraction',
      async fetchSourceDocuments() {
        calls += 1;
        return [{ label: 'homepage', url: 'https://acme.test/', text }];
      },
    },
    calls: () => calls,
  };
}

/**
 * A ResearchProvider that mirrors createAnthropicResearchProvider's own
 * PO-4 reuse contract (packages/core-research/src/
 * anthropicResearchProvider.ts): fetch only when the caller did not
 * already supply pre-admission documents. A hand-rolled fake rather than
 * the real Anthropic-backed provider, consistent with every other
 * `researchProvider()` fixture in this file — none of them exercise the
 * real AI engine.
 */
function reuseAwareResearchProvider(
  sourceDocuments: SourceDocumentProvider,
  result: LeadResearch,
): { provider: ResearchProvider; lastInput: () => ResearchProviderInput | undefined } {
  let last: ResearchProviderInput | undefined;
  return {
    provider: {
      async research(input) {
        last = input;
        if (!input.suppliedSourceDocuments) {
          await sourceDocuments.fetchSourceDocuments({
            companyName: input.companyName,
            normalizedDomain: input.normalizedDomain,
          });
        }
        return result;
      },
    },
    lastInput: () => last,
  };
}

/**
 * Phase 5: a deterministic signal catalogue that always reports one
 * qualifying, top-reliability, Primary-dimension signal — the same
 * approved test seam apps/worker/src/searchWorker/worker.test.ts's own
 * qualifyingSignalCatalogue() uses, reproduced locally here since this
 * suite does not import that unexported test helper. Needed so the
 * admitted candidate genuinely clears the Phase 5 admission gate
 * (evaluateAdmission) and Research actually runs, rather than the
 * candidate being denied admission by default.
 */
function qualifyingSignalCatalogue(): ServiceSignalCatalogue {
  return {
    service: 'test',
    evaluate(): readonly DeterministicSignal[] {
      return [
        {
          signal: {
            kind: 'WEBSITE',
            signal: 'qualifying deterministic signal (test fixture)',
            confidence: 100,
            observedAt: new Date(),
          },
          dimension: 'NEED_OPPORTUNITY_GAP',
          field: 'test.qualifyingSignal',
        },
      ];
    },
  };
}

function workerDeps(
  base: ReturnType<typeof repos>,
  overrides: Partial<SearchWorkerDeps> = {},
): SearchWorkerDeps {
  return {
    searches: base.searches,
    companies: base.companies,
    prospects: base.prospects,
    entities: base.entities,
    discoveryProvider: discoveryProvider([
      { name: 'Acme Co', website: `https://acme-${randomUUID()}.example.com` },
    ]),
    signals: base.signals,
    researchProvider: () => researchProvider(matchingResearch()),
    opportunities: base.opportunities,
    workerId: `worker_${randomUUID()}`,
    ...overrides,
  };
}

describe('claim concurrency (real Postgres)', () => {
  it('N concurrently claiming connections never claim the same Search twice', async () => {
    const { db } = suite.require();
    const a = await createUserAndSession('claim_a');
    const base = repos();

    const SEARCH_COUNT = 5;
    const searches = [];
    for (let i = 0; i < SEARCH_COUNT; i += 1) {
      searches.push(await createPendingSearch(base, a.token));
    }

    const pool = new Pool({ connectionString: db.url, max: SEARCH_COUNT + 2 });
    try {
      const claimants = Array.from({ length: SEARCH_COUNT }, (_, i) => {
        const repo = createPgSearchRepository(pool);
        return repo.claimNextPending({
          workerId: `concurrent_worker_${i}`,
          now: new Date(),
          leaseExpiresAt: new Date(Date.now() + 60_000),
        });
      });
      const claimed = await Promise.all(claimants);

      const claimedIds = claimed.filter((c) => c !== null).map((c) => c!.id);
      expect(new Set(claimedIds).size).toBe(claimedIds.length);
      expect(claimedIds.sort()).toEqual(searches.map((s) => s.id).sort());

      // One more claimant, with nothing left PENDING, gets nothing.
      const extra = await createPgSearchRepository(pool).claimNextPending({
        workerId: 'late_worker',
        now: new Date(),
        leaseExpiresAt: new Date(Date.now() + 60_000),
      });
      expect(extra).toBeNull();
    } finally {
      await pool.end();
    }
  }, 30_000);
});

describe('lease recovery (real Postgres)', () => {
  it('an expired RUNNING lease returns to PENDING, preserving attempts and last_error, and can be reclaimed by another worker', async () => {
    const a = await createUserAndSession('lease_a');
    const base = repos();
    const search = await createPendingSearch(base, a.token);

    const claimed = await base.searches.claimNextPending({
      workerId: 'crashed_worker',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() - 1000), // already expired
    });
    expect(claimed!.id).toBe(search.id);

    const recovered = await base.searches.releaseExpiredLeases({ now: new Date() });
    expect(recovered).toBeGreaterThanOrEqual(1);

    const afterRelease = await base.searches.getById(a.userId, search.id);
    expect(afterRelease!.status).toBe('PENDING');
    expect(afterRelease!.leaseOwner).toBeNull();
    expect(afterRelease!.attempts).toBe(1); // not charged for the crash

    const reclaimed = await base.searches.claimNextPending({
      workerId: 'replacement_worker',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() + 60_000),
    });
    expect(reclaimed!.id).toBe(search.id);
    expect(reclaimed!.leaseOwner).toBe('replacement_worker');
    expect(reclaimed!.attempts).toBe(2);
  });

  it('a lease that has NOT expired is left untouched', async () => {
    const a = await createUserAndSession('lease_b');
    const base = repos();
    const search = await createPendingSearch(base, a.token);
    await base.searches.claimNextPending({
      workerId: 'live_worker',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() + 60_000),
    });

    const recovered = await base.searches.releaseExpiredLeases({ now: new Date() });

    const row = await base.searches.getById(a.userId, search.id);
    expect(row!.status).toBe('RUNNING');
    expect(row!.leaseOwner).toBe('live_worker');
    // Other suites may leave their own expired leases behind; this
    // assertion only cares that THIS row was not touched, above.
    void recovered;
  });
});

describe('retry / terminal failure (real Postgres)', () => {
  it('the first two failed attempts return to PENDING; the third transitions to FAILED and stops automatic retry', async () => {
    const a = await createUserAndSession('retry_a');
    const base = repos();
    const search = await createPendingSearch(base, a.token);
    const failingDiscovery: DiscoveryProvider = {
      async discover() {
        throw new Error('discovery provider unavailable');
      },
    };

    const first = await claimAndProcessNextSearch(
      workerDeps(base, { discoveryProvider: failingDiscovery }),
    );
    expect(first).toMatchObject({ outcome: 'retry', searchId: search.id, attempts: 1 });
    expect((await base.searches.getById(a.userId, search.id))!.status).toBe('PENDING');

    const second = await claimAndProcessNextSearch(
      workerDeps(base, { discoveryProvider: failingDiscovery }),
    );
    expect(second).toMatchObject({ outcome: 'retry', searchId: search.id, attempts: 2 });

    const third = await claimAndProcessNextSearch(
      workerDeps(base, { discoveryProvider: failingDiscovery }),
    );
    expect(third).toMatchObject({ outcome: 'failed', searchId: search.id, attempts: 3 });
    const failedRow = await base.searches.getById(a.userId, search.id);
    expect(failedRow!.status).toBe('FAILED');
    expect(failedRow!.lastError).toContain('discovery provider unavailable');

    // No fourth automatic attempt: nothing PENDING left to claim.
    const fourth = await claimAndProcessNextSearch(
      workerDeps(base, { discoveryProvider: failingDiscovery }),
    );
    expect(fourth).toEqual({ outcome: 'empty' });
  });
});

describe('end-to-end pipeline (real Postgres)', () => {
  it('Search -> Discovery -> Research -> Opportunity persists real rows under the Search owner, and completes the Search', async () => {
    const a = await createUserAndSession('e2e_a');
    const base = repos();
    const search = await createPendingSearch(base, a.token);
    const domain = `acme-${randomUUID()}.example.com`;

    const outcome = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Acme Co', website: `https://${domain}` }]),
        // Phase 5: Research only runs for an admitted candidate — without
        // a qualifying deterministic signal, admission denies by default.
        signalCatalogue: qualifyingSignalCatalogue(),
        // K5-D1: this is a NEW Service+Geography-only search
        // (createPendingSearch), so a single weak signal (the file's
        // default matchingResearch()) is no longer sufficient to
        // establish NEED_DETECTED — credibleNeedResearch() supplies
        // the >=2-independent-signal evidence the new sufficiency gate
        // requires.
        researchProvider: () => researchProvider(credibleNeedResearch()),
      }),
    );

    expect(outcome).toMatchObject({
      outcome: 'completed',
      searchId: search.id,
      prospectsProcessed: 1,
    });

    const finalSearch = await base.searches.getById(a.userId, search.id);
    expect(finalSearch!.status).toBe('COMPLETE');
    expect(finalSearch!.completedAt).not.toBeNull();

    const { db } = suite.require();
    const { rows: companyRows } = await db.client.query(
      `SELECT user_id FROM companies WHERE normalized_domain = $1`,
      [domain],
    );
    expect(companyRows).toHaveLength(1);
    expect(companyRows[0].user_id).toBe(a.userId);

    const { rows: prospectRows } = await db.client.query(
      `SELECT p.user_id FROM prospects p JOIN companies c ON c.id = p.company_id WHERE c.normalized_domain = $1`,
      [domain],
    );
    expect(prospectRows).toHaveLength(1);
    expect(prospectRows[0].user_id).toBe(a.userId);

    const { rows: signalRows } = await db.client.query(
      `SELECT rs.field FROM research_signals rs
         JOIN prospects p ON p.id = rs.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1 AND rs.superseded_at IS NULL`,
      [domain],
    );
    expect(signalRows.length).toBeGreaterThan(0);

    const { rows: opportunityRows } = await db.client.query(
      `SELECT o.user_id, o.need_detected, o.ai_enrichment, o.ai_enrichment_reason FROM opportunities o
         JOIN prospects p ON p.id = o.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1`,
      [domain],
    );
    expect(opportunityRows).toHaveLength(1);
    expect(opportunityRows[0].user_id).toBe(a.userId);
    expect(opportunityRows[0].need_detected).toBe(true);
    // Phase 6 (migration 0047): a successful admitted Research run is
    // AI_ENRICHED with a null reason, read back from the real row —
    // not just asserted against a fake repository.
    expect(opportunityRows[0].ai_enrichment).toBe('AI_ENRICHED');
    expect(opportunityRows[0].ai_enrichment_reason).toBeNull();
  });
});

describe('target customer match (PCG-4 production wiring, real Postgres)', () => {
  it("claimAndProcessNextSearch's own targetCustomerMatch wiring writes a real target_customer_match_determinations row — not just runResearchForOwner called directly", async () => {
    const a = await createUserAndSession('tcmatch_a');
    const base = repos();
    const search = await createHistoricalPendingSearch(base, a.userId, a.token);
    const domain = `acme-${randomUUID()}.example.com`;
    const { db } = suite.require();
    const repository = createPgTargetCustomerMatchRepository(db.client);
    const model: ResearchModel = async (): Promise<ModelResult> => ({ kind: 'json', value: { findings: [] } });

    const outcome = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Acme Co', website: `https://${domain}` }]),
        targetCustomerMatch: {
          repository,
          model: { model, modelId: 'test-model', providerId: 'test-provider' },
        },
        // Phase 5: runResearchForOwner's targetCustomerMatch wiring only
        // runs when Research itself runs, which requires admission.
        signalCatalogue: qualifyingSignalCatalogue(),
      }),
    );

    expect(outcome).toMatchObject({ outcome: 'completed', searchId: search.id, prospectsProcessed: 1 });

    const { rows: determinationRows } = await db.client.query(
      `SELECT t.model, t.provider FROM target_customer_match_determinations t
         JOIN prospects p ON p.id = t.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1 AND t.superseded_at IS NULL`,
      [domain],
    );
    expect(determinationRows).toHaveLength(1);
    expect(determinationRows[0].model).toBe('test-model');
    expect(determinationRows[0].provider).toBe('test-provider');
  });
});

describe('R-33 isolation gate (real Postgres)', () => {
  it("processing User A's and User B's Searches never cross-attributes Company/Prospect/ResearchSignal/Opportunity rows", async () => {
    const a = await createUserAndSession('iso_a');
    const b = await createUserAndSession('iso_b');
    const base = repos();
    const searchA = await createPendingSearch(base, a.token);
    const searchB = await createPendingSearch(base, b.token);
    const domain = `shared-${randomUUID()}.example.com`; // SAME domain, discovered by both users independently

    const outcomeA = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Shared Co', website: `https://${domain}` }]),
      }),
    );
    const outcomeB = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Shared Co', website: `https://${domain}` }]),
      }),
    );

    const claimedIds = [outcomeA, outcomeB]
      .map((o) => ('searchId' in o ? o.searchId : null))
      .sort();
    expect(claimedIds).toEqual([searchA.id, searchB.id].sort());

    const { db } = suite.require();
    const { rows: companyRows } = await db.client.query(
      `SELECT user_id FROM companies WHERE normalized_domain = $1 ORDER BY user_id`,
      [domain],
    );
    // Company ownership is per-user (DEC-005) — each user gets their own row for the same domain.
    expect(companyRows.map((r: { user_id: string }) => r.user_id).sort()).toEqual(
      [a.userId, b.userId].sort(),
    );

    const { rows: opportunityRows } = await db.client.query(
      `SELECT o.user_id FROM opportunities o
         JOIN prospects p ON p.id = o.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1`,
      [domain],
    );
    expect(opportunityRows.map((r: { user_id: string }) => r.user_id).sort()).toEqual(
      [a.userId, b.userId].sort(),
    );

    // Direct cross-user read attempt: User B's repository call for User A's Search must see nothing.
    expect(await base.searches.getById(b.userId, searchA.id)).toBeNull();
    expect(await base.searches.getById(a.userId, searchB.id)).toBeNull();
  });

  it('a stale (fenced) worker cannot overwrite a Search another worker has since reclaimed and completed', async () => {
    const a = await createUserAndSession('fence_a');
    const base = repos();
    const search = await createPendingSearch(base, a.token);

    // Worker 1 claims with an already-expired lease (simulating a stall).
    await base.searches.claimNextPending({
      workerId: 'stale_worker',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() - 1000),
    });
    await base.searches.releaseExpiredLeases({ now: new Date() });

    // Worker 2 reclaims and completes it for real.
    const reclaimed = await base.searches.claimNextPending({
      workerId: 'live_worker',
      now: new Date(),
      leaseExpiresAt: new Date(Date.now() + 60_000),
    });
    expect(reclaimed!.id).toBe(search.id);
    const completed = await base.searches.completeClaimed({
      id: search.id,
      workerId: 'live_worker',
      now: new Date(),
    });
    expect(completed).toBe(true);

    // The stale worker, unaware it was fenced, tries to settle the SAME row — must be refused.
    const staleComplete = await base.searches.completeClaimed({
      id: search.id,
      workerId: 'stale_worker',
      now: new Date(),
    });
    const staleFailure = await base.searches.recordAttemptFailure({
      id: search.id,
      workerId: 'stale_worker',
      now: new Date(),
      error: 'stale write attempt',
      maxAttempts: 3,
    });
    expect(staleComplete).toBe(false);
    expect(staleFailure).toBeNull();

    const finalRow = await base.searches.getById(a.userId, search.id);
    expect(finalRow!.status).toBe('COMPLETE');
  });
});

describe('Phase 5 orchestration gaps (real Postgres)', () => {
  it('a fresh cache hit consumes zero AI escalation units and never calls Research', async () => {
    const a = await createUserAndSession('cache_a');
    const base = repos();
    const domain = `cached-${randomUUID()}.example.com`;

    // Arrange: a prior Search for the same user+domain whose Research
    // produced reusable (non-UNKNOWN) WEBSITE evidence, seeding
    // research_signal_cache_index for (userId, domain, 'WEBSITE').
    const seedSearch = await createPendingSearch(base, a.token);
    const seedOutcome = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Acme Co', website: `https://${domain}` }]),
        signalCatalogue: qualifyingSignalCatalogue(),
        signalCache: base.signalCache,
        researchProvider: () => researchProvider(cacheableResearch()),
      }),
    );
    expect(seedOutcome).toMatchObject({ outcome: 'completed', searchId: seedSearch.id });

    // Act: a second, independent Search for the SAME user+domain. A
    // researchProvider that counts calls proves AI is never reached —
    // if this test regresses, consumeAiEscalationUnit would be called
    // AND Research would run, both detectable below.
    const search = await createPendingSearch(base, a.token);
    const counting = countingResearchProvider(matchingResearch());

    const outcome = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Acme Co', website: `https://${domain}` }]),
        signalCatalogue: qualifyingSignalCatalogue(),
        signalCache: base.signalCache,
        researchProvider: () => counting.provider,
      }),
    );

    expect(outcome).toMatchObject({
      outcome: 'completed',
      searchId: search.id,
      prospectsProcessed: 1,
    });
    expect(counting.calls()).toBe(0);

    const finalRow = await base.searches.getById(a.userId, search.id);
    expect(finalRow!.status).toBe('COMPLETE');
    expect(finalRow!.aiEscalationUnitsConsumed).toBe(0);
  });

  it("pre-admission's fetched source document is reused by Research, not fetched a second time", async () => {
    const a = await createUserAndSession('preadmission_a');
    const base = repos();
    const domain = `preadmission-${randomUUID()}.example.com`;

    const fetcher = countingSourceDocumentProvider('Acme sells widgets. Hiring a content writer.');
    const research = reuseAwareResearchProvider(fetcher.provider, matchingResearch());
    const search = await createPendingSearch(base, a.token);

    const outcome = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Acme Co', website: `https://${domain}` }]),
        signalCatalogue: qualifyingSignalCatalogue(),
        sourceDocuments: fetcher.provider,
        researchProvider: () => research.provider,
      }),
    );

    expect(outcome).toMatchObject({ outcome: 'completed', searchId: search.id, prospectsProcessed: 1 });
    // Fetched exactly once — during Pass 1 (fetchPreAdmissionDocuments).
    // If Research fetched again instead of reusing the supplied
    // document, this would be 2.
    expect(fetcher.calls()).toBe(1);
    // And Research genuinely received what Pass 1 fetched, rather than
    // running with no documents at all.
    expect(research.lastInput()?.suppliedSourceDocuments?.documents).toEqual([
      { label: 'homepage', url: 'https://acme.test/', text: 'Acme sells widgets. Hiring a content writer.' },
    ]);
  });

  it('a Search where no candidate is admitted still completes, with zero AI escalation and no Research/TCM call', async () => {
    const a = await createUserAndSession('zeroai_a');
    const base = repos();
    const domain = `zeroai-${randomUUID()}.example.com`;
    const search = await createPendingSearch(base, a.token);
    const counting = countingResearchProvider(matchingResearch());

    const outcome = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Acme Co', website: `https://${domain}` }]),
        // No signalCatalogue override: zero deterministic signals, so
        // evaluateAdmission admits nothing — every candidate takes the
        // "not admitted" branch in processOneCandidate (deterministic-
        // only persist), never reaching the cache check or AI budget.
        researchProvider: () => counting.provider,
      }),
    );

    expect(outcome).toMatchObject({
      outcome: 'completed',
      searchId: search.id,
      prospectsProcessed: 1,
    });
    expect(counting.calls()).toBe(0);

    const finalRow = await base.searches.getById(a.userId, search.id);
    expect(finalRow!.status).toBe('COMPLETE');
    expect(finalRow!.completedAt).not.toBeNull();
    expect(finalRow!.aiEscalationUnitsConsumed).toBe(0);
  });
});

// Phase 6 (migration 0047) — real-Postgres provenance round-trip.
// -----------------------------------------------------------------------
// The branches above (claim concurrency, lease recovery, retry, Phase 5
// orchestration) and the unit suite (apps/worker/src/searchWorker/
// worker.test.ts) already prove processOneCandidate's control flow
// against fakes. What they do not prove is that the resulting
// ai_enrichment / ai_enrichment_reason actually land in the real
// `opportunities` row via recordAiEnrichmentForOwner -> pgRepository's
// UPDATE — this section closes exactly that gap for the three
// DETERMINISTIC_ONLY branches, including the one (candidate-level
// Research/TCM failure) where the Search must still complete.
// -----------------------------------------------------------------------
describe('Phase 6 AI enrichment provenance (real Postgres)', () => {
  async function opportunityProvenance(domain: string) {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT o.ai_enrichment, o.ai_enrichment_reason FROM opportunities o
         JOIN prospects p ON p.id = o.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1`,
      [domain],
    );
    return rows as Array<{ ai_enrichment: string; ai_enrichment_reason: string | null }>;
  }

  async function activeSignalCount(domain: string): Promise<number> {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT rs.field FROM research_signals rs
         JOIN prospects p ON p.id = rs.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1 AND rs.superseded_at IS NULL`,
      [domain],
    );
    return rows.length;
  }

  it('a not-admitted candidate persists DETERMINISTIC_ONLY/NOT_ESCALATED on the real Opportunity row, and completes the Search', async () => {
    const a = await createUserAndSession('provenance_notadmitted');
    const base = repos();
    const domain = `provenance-notadmitted-${randomUUID()}.example.com`;
    const search = await createPendingSearch(base, a.token);
    const counting = countingResearchProvider(matchingResearch());

    const outcome = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Acme Co', website: `https://${domain}` }]),
        // No signalCatalogue override: zero deterministic signals, so
        // evaluateAdmission admits nothing (same gate as the Phase 5
        // "no candidate admitted" case above).
        researchProvider: () => counting.provider,
      }),
    );

    expect(outcome).toMatchObject({ outcome: 'completed', searchId: search.id, prospectsProcessed: 1 });
    expect(counting.calls()).toBe(0);

    const finalSearch = await base.searches.getById(a.userId, search.id);
    expect(finalSearch!.status).toBe('COMPLETE');

    const rows = await opportunityProvenance(domain);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.ai_enrichment).toBe('DETERMINISTIC_ONLY');
    expect(rows[0]!.ai_enrichment_reason).toBe('NOT_ESCALATED');
  });

  it('an admitted candidate whose AI-escalation budget is already exhausted persists DETERMINISTIC_ONLY/PROVIDER_EXHAUSTED with deterministic evidence still recorded, and completes the Search', async () => {
    const a = await createUserAndSession('provenance_exhausted');
    const base = repos();
    const domain = `provenance-exhausted-${randomUUID()}.example.com`;
    const search = await createPendingSearch(base, a.token);
    const counting = countingResearchProvider(matchingResearch());

    // Force consumeAiEscalationUnit's "exhausted" outcome deterministically
    // (AI_ESCALATION_BUDGET = 10) rather than spending 10 real candidates.
    const { db } = suite.require();
    await db.client.query(`UPDATE searches SET ai_escalation_units_consumed = 10 WHERE id = $1`, [
      search.id,
    ]);

    const outcome = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Acme Co', website: `https://${domain}` }]),
        signalCatalogue: qualifyingSignalCatalogue(),
        researchProvider: () => counting.provider,
      }),
    );

    expect(outcome).toMatchObject({ outcome: 'completed', searchId: search.id, prospectsProcessed: 1 });
    expect(counting.calls()).toBe(0);

    const finalSearch = await base.searches.getById(a.userId, search.id);
    expect(finalSearch!.status).toBe('COMPLETE');

    const rows = await opportunityProvenance(domain);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.ai_enrichment).toBe('DETERMINISTIC_ONLY');
    expect(rows[0]!.ai_enrichment_reason).toBe('PROVIDER_EXHAUSTED');
    // Case 8: deterministic evidence (the qualifying signal that admitted
    // this candidate) remains available even on a deterministic-only path.
    expect(await activeSignalCount(domain)).toBeGreaterThan(0);
  });

  it('a candidate-level Research/TCM failure persists DETERMINISTIC_ONLY/ESCALATION_FAILED with deterministic evidence still recorded, and does not fail the Search', async () => {
    const a = await createUserAndSession('provenance_escfailed');
    const base = repos();
    const domain = `provenance-escfailed-${randomUUID()}.example.com`;
    const search = await createPendingSearch(base, a.token);
    const failingResearch: ResearchProvider = {
      async research() {
        throw new Error('research provider failed (test fixture)');
      },
    };

    const outcome = await claimAndProcessNextSearch(
      workerDeps(base, {
        discoveryProvider: discoveryProvider([{ name: 'Acme Co', website: `https://${domain}` }]),
        signalCatalogue: qualifyingSignalCatalogue(),
        researchProvider: () => failingResearch,
      }),
    );

    // The candidate-level AI failure is caught inside processOneCandidate
    // (worker.ts) — it must never propagate into claimAndProcessNextSearch's
    // own retry/failure handling.
    expect(outcome).toMatchObject({ outcome: 'completed', searchId: search.id, prospectsProcessed: 1 });

    const finalSearch = await base.searches.getById(a.userId, search.id);
    expect(finalSearch!.status).toBe('COMPLETE');
    expect(finalSearch!.completedAt).not.toBeNull();

    const rows = await opportunityProvenance(domain);
    expect(rows).toHaveLength(1);
    expect(rows[0]!.ai_enrichment).toBe('DETERMINISTIC_ONLY');
    expect(rows[0]!.ai_enrichment_reason).toBe('ESCALATION_FAILED');
    expect(await activeSignalCount(domain)).toBeGreaterThan(0);
  });
});
