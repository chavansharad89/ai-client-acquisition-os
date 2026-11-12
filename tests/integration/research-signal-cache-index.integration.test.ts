import { randomUUID } from 'node:crypto';

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
} from '@acos/core-identity';
import {
  createPgResearchSignalCacheRepository,
  createPgResearchSignalRepository,
  lookupCachedSignalForOwner,
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
} from '@acos/core-search';
import {
  createPgServiceProfileRepository,
  createServiceProfile,
  type ServiceProfileInput,
} from '@acos/core-service-profile';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';

import { suiteDatabase } from './support/suiteDb';

// Migration 0045 (research_signal_cache_index) — Phase 4 same-freelancer
// cache-first evidence reuse (CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-
// 001), real PostgreSQL. Proves: the cache key is scoped to (user_id,
// normalized_domain, signal_kind) and never crosses freelancers; a cache
// hit re-reads the authoritative research_signals/research_signal_sources
// rows verbatim (provenance/observedAt/confidence unmodified); non-
// reusable evidence (UNKNOWN classification) is never indexed; freshness
// is never silently treated as fresh; the kind CHECK constraint refuses
// PUBLIC_INTENT/FIRST_PARTY (owner-specific intent-intake kinds, not
// public/non-owner-specific factual evidence). Mirrors
// tests/integration/research.integration.test.ts's setup conventions.

const suite = suiteDatabase('research-signal-cache-index');
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

const HOMEPAGE = { url: 'https://example.test/about', label: 'homepage' };

function sampleResearch(): LeadResearch {
  return {
    companySummary: {
      classification: 'OBSERVED',
      value: 'Sells widgets',
      evidence: [{ quote: 'Sells widgets', sourceUrl: HOMEPAGE.url, sourceLabel: HOMEPAGE.label }],
      basis: null,
      confidence: 88,
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

function testProvider(result: LeadResearch): ResearchProvider {
  return {
    async research() {
      return result;
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
    signalCache: createPgResearchSignalCacheRepository(db.client),
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

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `cache.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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
    service: 'Web & Software Development',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST'],
    keywords: ['website', 'redesign'],
    rationale: 'They lack a working website.',
    ...overrides,
  };
}

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return { candidates, actualQuery: 'test query', provider: 'TEST_PROVIDER' };
    },
  };
}

async function createProspectFor(
  base: ReturnType<typeof repos>,
  token: string,
  candidate: DiscoveryCandidate,
): Promise<{ prospectId: string }> {
  const d = discoveryDeps(base, [candidate]);
  const profile = await createServiceProfile(d, token, sampleProfileInput());
  const created = await createSearch(d, token, { serviceProfileId: profile.id });
  const running = (await transitionSearch(d, token, created.id, { status: 'RUNNING' }))!;
  const result = await runDiscovery(d, token, { searchId: running.id });
  return { prospectId: result.prospects[0]!.id };
}

describe('research_signal_cache_index schema (migration 0045)', () => {
  it('exists, keyed by (user_id, normalized_domain, signal_kind), pointing at research_signals', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'research_signal_cache_index'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toEqual(
      expect.arrayContaining(['user_id', 'normalized_domain', 'signal_kind', 'signal_id', 'observed_at']),
    );
  });

  it('has the (user_id, normalized_domain, signal_kind) lookup index', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'research_signal_cache_index' AND indexname = 'research_signal_cache_index_lookup_idx'`,
    );
    expect(rows).toHaveLength(1);
  });

  it('refuses PUBLIC_INTENT/FIRST_PARTY — owner-specific intent-intake kinds are not public/non-owner-specific factual evidence', async () => {
    const { db } = suite.require();
    const a = await createUserAndSession('kindcheck');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Kindcheck Co',
      website: 'https://kindcheck.example.com',
    });
    const research = await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });
    const anySignalId = research.signals[0]!.id;

    await expect(
      db.client.query(
        `INSERT INTO research_signal_cache_index
           (id, user_id, normalized_domain, signal_kind, signal_id, observed_at)
         VALUES (gen_random_uuid()::text, $1, 'kindcheck.example.com', 'PUBLIC_INTENT', $2, now())`,
        [a.userId, anySignalId],
      ),
    ).rejects.toThrow();
  });
});

describe('Phase 4 cache-first lookup — real PostgreSQL', () => {
  it('1. same freelancer + same domain + reusable signal => cache hit', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme.example.com',
    });
    await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });

    const result = await lookupCachedSignalForOwner(base.signalCache, a.userId, 'acme.example.com', 'WEBSITE');
    expect(result.outcome).toBe('hit');
    expect(result.signals.length).toBeGreaterThan(0);
  });

  it('2. same freelancer + different domain => miss', async () => {
    const a = await createUserAndSession('a2');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme2.example.com',
    });
    await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });

    const result = await lookupCachedSignalForOwner(base.signalCache, a.userId, 'other.example.com', 'WEBSITE');
    expect(result.outcome).toBe('none');
  });

  it('3. different freelancer + same domain => miss (no cross-freelancer cache is introduced)', async () => {
    const a = await createUserAndSession('a3');
    const b = await createUserAndSession('b3');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme3.example.com',
    });
    await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });

    const sameUser = await lookupCachedSignalForOwner(base.signalCache, a.userId, 'acme3.example.com', 'WEBSITE');
    const otherUser = await lookupCachedSignalForOwner(base.signalCache, b.userId, 'acme3.example.com', 'WEBSITE');
    expect(sameUser.outcome).toBe('hit');
    expect(otherUser.outcome).toBe('none');
  });

  it('4. non-reusable evidence (UNKNOWN classification) is never indexed => miss even though the signal was persisted', async () => {
    const a = await createUserAndSession('a4');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme4.example.com',
    });
    const research = await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });

    const unknownSignal = research.signals.find((s) => s.classification === 'UNKNOWN');
    expect(unknownSignal).toBeDefined();

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT 1 FROM research_signal_cache_index WHERE signal_id = $1`,
      [unknownSignal!.id],
    );
    expect(rows).toHaveLength(0);
  });

  it('5. recently-observed WEBSITE evidence is fresh under CF-SIGNAL-FRESHNESS-PO-DEC-001\'s 30-day window', async () => {
    const a = await createUserAndSession('a5');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme5.example.com',
    });
    await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });

    const result = await lookupCachedSignalForOwner(base.signalCache, a.userId, 'acme5.example.com', 'WEBSITE');
    expect(result.freshness).toBe('fresh');
  });

  it('6. cache hit returns original provenance/timestamp — same evidence as a direct ResearchSignal read', async () => {
    const a = await createUserAndSession('a6');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme6.example.com',
    });
    const research = await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });
    const observed = research.signals.find((s) => s.classification === 'OBSERVED')!;

    const result = await lookupCachedSignalForOwner(base.signalCache, a.userId, 'acme6.example.com', 'WEBSITE');
    const [hit] = result.signals;
    expect(hit?.id).toBe(observed.id);
    expect(hit?.observedAt).toEqual(observed.observedAt);
    expect(hit?.confidence).toBe(observed.confidence);
    expect(hit?.sources).toEqual(observed.sources);
  });

  it('7. conflicting evidence for the same (user, domain, kind) coexists — not collapsed or overwritten (CF-CACHE-CONFLICT-PO-DEC-001)', async () => {
    const a = await createUserAndSession('a7');
    const base = repos();
    const candidate = { name: 'Acme Co', website: 'https://acme7.example.com' };

    // Two different searches against the same (user, domain): companies
    // dedup by (user_id, normalized_domain), but prospects dedup by
    // (search_id, company_id) — so this yields two distinct prospects,
    // each with its own, independently-superseded research_signals rows.
    const first = await createProspectFor(base, a.token, candidate);
    const r1 = await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId: first.prospectId });

    const second = await createProspectFor(base, a.token, candidate);
    const conflicting: LeadResearch = {
      ...sampleResearch(),
      companySummary: {
        classification: 'OBSERVED',
        value: 'Acme has since pivoted away from widgets',
        evidence: [
          {
            quote: 'Acme has since pivoted away from widgets',
            sourceUrl: HOMEPAGE.url,
            sourceLabel: HOMEPAGE.label,
          },
        ],
        basis: null,
        confidence: 61,
      },
    };
    const r2 = await runResearch(researchDeps(base, conflicting), a.token, { prospectId: second.prospectId });

    expect(first.prospectId).not.toBe(second.prospectId);
    const firstSignal = r1.signals.find((s) => s.field === 'companySummary')!;
    const secondSignal = r2.signals.find((s) => s.field === 'companySummary')!;
    expect(firstSignal.id).not.toBe(secondSignal.id);

    const result = await lookupCachedSignalForOwner(base.signalCache, a.userId, 'acme7.example.com', 'WEBSITE');
    expect(result.outcome).toBe('hit');
    expect(result.signals.length).toBeGreaterThanOrEqual(2);

    const returnedIds = result.signals.map((s) => s.id);
    expect(returnedIds).toEqual(expect.arrayContaining([firstSignal.id, secondSignal.id]));

    const returnedFirst = result.signals.find((s) => s.id === firstSignal.id)!;
    const returnedSecond = result.signals.find((s) => s.id === secondSignal.id)!;
    // Independent provenance/confidence preserved — neither overwrites the other.
    expect(returnedFirst.confidence).toBe(88);
    expect(returnedSecond.confidence).toBe(61);
    expect(returnedFirst.signal).not.toBe(returnedSecond.signal);
    expect(returnedFirst.sources).toEqual(firstSignal.sources);
    expect(returnedSecond.sources).toEqual(secondSignal.sources);
  });
});
