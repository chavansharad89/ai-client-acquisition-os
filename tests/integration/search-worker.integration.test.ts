import { randomUUID } from 'node:crypto';

import { Pool } from 'pg';

import {
  createPgCompanyRepository,
  createPgProspectRepository,
  type DiscoveryCandidate,
  type DiscoveryProvider,
} from '@acos/core-discovery';
import { createPgIdentityRepository, mintUserSession } from '@acos/core-identity';
import { createPgOpportunityRepository } from '@acos/core-opportunity';
import {
  createPgResearchSignalRepository,
  type LeadResearch,
  type ResearchProvider,
} from '@acos/core-research';
import { createPgSearchRepository, createSearch, type SearchDeps } from '@acos/core-search';
import {
  createPgServiceProfileRepository,
  createServiceProfile,
  type ServiceProfileInput,
} from '@acos/core-service-profile';
import { claimAndProcessNextSearch, type SearchWorkerDeps } from '@acos/worker/searchWorker';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

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

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

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

/** Creates a PENDING Search for `token`, ready for a worker to claim — never transitions it itself. */
async function createPendingSearch(base: ReturnType<typeof repos>, token: string) {
  const profile = await createServiceProfile(base, token, sampleProfileInput());
  return createSearch(base as SearchDeps, token, { serviceProfileId: profile.id });
}

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return candidates;
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

function workerDeps(
  base: ReturnType<typeof repos>,
  overrides: Partial<SearchWorkerDeps> = {},
): SearchWorkerDeps {
  return {
    searches: base.searches,
    companies: base.companies,
    prospects: base.prospects,
    discoveryProvider: discoveryProvider([
      { name: 'Acme Co', website: `https://acme-${randomUUID()}.example.com` },
    ]),
    signals: base.signals,
    researchProvider: researchProvider(matchingResearch()),
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
      }),
    );

    expect(outcome).toMatchObject({
      outcome: 'completed',
      searchId: search.id,
      prospectsProcessed: 1,
    });

    const finalSearch = await base.searches.getById(a.userId, search.id);
    expect(finalSearch!.status).toBe('COMPLETE');

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
      `SELECT o.user_id, o.need_detected FROM opportunities o
         JOIN prospects p ON p.id = o.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1`,
      [domain],
    );
    expect(opportunityRows).toHaveLength(1);
    expect(opportunityRows[0].user_id).toBe(a.userId);
    expect(opportunityRows[0].need_detected).toBe(true);
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
