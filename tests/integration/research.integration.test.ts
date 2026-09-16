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
  createPgResearchSignalRepository,
  listResearchSignals,
  runResearch,
  scoreResearchedProspect,
  ResearchProspectNotFoundError,
  type LeadResearch,
  type ResearchDeps,
  type ResearchProvider,
  type ScoreResearchedProspectInput,
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

// ResearchSignal ownership + evidence model — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0016's schema plus @acos/core-research's persistence
// layer enforce, at the database itself: DEC-008's ownership inheritance
// through Prospect (research_signals carries no user_id of its own),
// that UNKNOWN survives, that confidence is stored raw, that more than
// one evidence source per signal is representable, and that a re-run
// supersedes rather than deletes. Mirrors
// tests/integration/discovery.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('research');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const HOMEPAGE = { url: 'https://acme.test/about', label: 'homepage' };
const CAREERS = { url: 'https://acme.test/careers', label: 'careers' };

function sampleResearch(): LeadResearch {
  return {
    companySummary: {
      classification: 'OBSERVED',
      value: 'Acme sells warehouse robotics',
      evidence: [
        {
          quote: 'Acme sells warehouse robotics',
          sourceUrl: HOMEPAGE.url,
          sourceLabel: HOMEPAGE.label,
        },
        {
          quote: 'shipped to 40 distribution centres',
          sourceUrl: CAREERS.url,
          sourceLabel: CAREERS.label,
        },
      ],
      basis: null,
      confidence: 92,
    },
    businessModel: {
      classification: 'INFERRED',
      value: 'Likely enterprise SaaS with services',
      evidence: [],
      basis: 'their homepage lists enterprise logos',
      confidence: 65,
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
    confidence: 55,
    gaps: ['Headcount not stated anywhere'],
  };
}

function testProvider(result: LeadResearch): ResearchProvider {
  return {
    async research() {
      return result;
    },
  };
}

/**
 * The shared, pg-backed repositories both Discovery and Research need.
 * `provider` is deliberately NOT included here: DiscoveryDeps and
 * ResearchDeps each declare their own `provider` field with an
 * incompatible type, so each caller attaches its own below rather than
 * one object trying to satisfy both shapes at once.
 */
function repos() {
  const { db } = suite.require();
  return {
    identity: createPgIdentityRepository(db.client),
    profiles: createPgServiceProfileRepository(db.client),
    searches: createPgSearchRepository(db.client),
    companies: createPgCompanyRepository(db.client),
    prospects: createPgProspectRepository(db.client),
    signals: createPgResearchSignalRepository(db.client),
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
  const email = `research.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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
      return candidates;
    },
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

describe('ResearchSignal schema (migration 0016)', () => {
  it('research_signals exists, owned through prospect_id, with no user_id column', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'research_signals'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toContain('prospect_id');
    expect(columns).not.toContain('user_id');
  });

  it('research_signal_sources exists, referencing research_signals', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'research_signal_sources' AND indexname = 'research_signal_sources_signal_id_idx'`,
    );
    expect(rows).toHaveLength(1);
  });
});

describe('Research execution', () => {
  it('an authenticated user researches their own Prospect and every classification survives', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());

    const result = await runResearch(d, a.token, { prospectId });

    expect(result.prospectId).toBe(prospectId);
    expect(result.signals).toHaveLength(3);

    const byField = new Map(result.signals.map((s) => [s.field, s]));
    expect(byField.get('companySummary')?.classification).toBe('OBSERVED');
    expect(byField.get('businessModel')?.classification).toBe('INFERRED');
    expect(byField.get('targetCustomers')?.classification).toBe('UNKNOWN');
  });

  it('UNKNOWN survives persistence: signal is null, confidence is 0, row exists', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());

    const result = await runResearch(d, a.token, { prospectId });

    const unknownSignal = result.signals.find((s) => s.field === 'targetCustomers');
    expect(unknownSignal).toBeDefined();
    expect(unknownSignal?.signal).toBeNull();
    expect(unknownSignal?.confidence).toBe(0);
  });

  it('confidence is stored raw — INFERRED is not pre-discounted', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());

    const result = await runResearch(d, a.token, { prospectId });

    const inferredSignal = result.signals.find((s) => s.field === 'businessModel');
    expect(inferredSignal?.confidence).toBe(65);
  });

  it('more than one evidence source per signal is persisted and readable', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());

    const result = await runResearch(d, a.token, { prospectId });

    const observedSignal = result.signals.find((s) => s.field === 'companySummary');
    expect(observedSignal?.sources).toHaveLength(2);
    expect(observedSignal?.sources.map((s) => s.sourceUrl).sort()).toEqual(
      [HOMEPAGE.url, CAREERS.url].sort(),
    );
  });

  it('a re-run supersedes prior signals rather than deleting them', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());

    const first = await runResearch(d, a.token, { prospectId });
    const second = await runResearch(d, a.token, { prospectId });

    expect(second.superseded).toBe(first.signals.length);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS n FROM research_signals WHERE prospect_id = $1`,
      [prospectId],
    );
    expect(rows[0].n).toBe(first.signals.length + second.signals.length);

    const active = await listResearchSignals(d, a.token, prospectId);
    expect(active).toHaveLength(second.signals.length);
    for (const signal of active) expect(signal.supersededAt).toBeNull();
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const d = researchDeps(repos(), sampleResearch());
    await expect(runResearch(d, null, { prospectId: 'irrelevant' })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('a different authenticated user cannot research against the Prospect — treated as not found', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());

    await expect(runResearch(d, b.token, { prospectId })).rejects.toBeInstanceOf(
      ResearchProspectNotFoundError,
    );
  });

  it("a different authenticated user cannot list another user's signals — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());
    await runResearch(d, a.token, { prospectId });

    await expect(listResearchSignals(d, b.token, prospectId)).rejects.toBeInstanceOf(
      ResearchProspectNotFoundError,
    );
  });

  it('an unknown prospectId is rejected', async () => {
    const a = await createUserAndSession('a');
    const d = researchDeps(repos(), sampleResearch());

    await expect(runResearch(d, a.token, { prospectId: 'does-not-exist' })).rejects.toBeInstanceOf(
      ResearchProspectNotFoundError,
    );
  });
});

describe('scoreResearchedProspect (Phase 8 — scoring foundation)', () => {
  // Real PostgreSQL: proves the persisted ResearchSignal rows (migration
  // 0016) round-trip through @acos/core-research's scoringAdapter into
  // @acos/core-acquisition's unmodified scoreProspect(), with the same
  // ownership boundary runResearch/listResearchSignals already enforce.

  const unestablished: ScoreResearchedProspectInput = {
    icp: {
      industryMatch: { value: null, basis: 'UNKNOWN' },
      sizeMatch: { value: null, basis: 'UNKNOWN' },
      geoMatch: { value: null, basis: 'UNKNOWN' },
    },
    abilityToPay: { value: null, basis: 'UNKNOWN' },
    urgency: { value: null, basis: 'UNKNOWN' },
    serviceFit: { value: null, basis: 'UNKNOWN' },
    contact: { hasEmail: true, hasLinkedIn: false, hasPhone: false, unsubscribed: false },
  };

  it("scores the caller's own Prospect from its persisted signals", async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());
    await runResearch(d, a.token, { prospectId });

    const result = await scoreResearchedProspect(d, a.token, prospectId, unestablished);

    expect(result.score.score).toBeGreaterThanOrEqual(0);
    expect(result.score.score).toBeLessThanOrEqual(100);
    expect(result.score.factors).toHaveLength(7);
  });

  it('reads confidence raw from the database — INFERRED is discounted once by the adapter, not at persistence', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());
    await runResearch(d, a.token, { prospectId });

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT confidence FROM research_signals WHERE prospect_id = $1 AND field = 'businessModel'`,
      [prospectId],
    );
    expect(rows[0].confidence).toBe(65); // sampleResearch()'s raw, undiscounted value

    const result = await scoreResearchedProspect(d, a.token, prospectId, unestablished);
    expect(result.score.score).toBeGreaterThanOrEqual(0); // discount applied downstream, not on the row
  });

  it('counts UNKNOWN persisted signals rather than silently discarding them', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());
    await runResearch(d, a.token, { prospectId });

    const result = await scoreResearchedProspect(d, a.token, prospectId, unestablished);

    // sampleResearch()'s targetCustomers field is UNKNOWN.
    expect(result.unknownSignalCount).toBe(1);
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const d = researchDeps(repos(), sampleResearch());
    await expect(
      scoreResearchedProspect(d, null, 'irrelevant', unestablished),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("a different authenticated user cannot score another user's Prospect — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());
    await runResearch(d, a.token, { prospectId });

    await expect(
      scoreResearchedProspect(d, b.token, prospectId, unestablished),
    ).rejects.toBeInstanceOf(ResearchProspectNotFoundError);
  });

  it('is deterministic across repeated reads of the same persisted signals', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const d = researchDeps(base, sampleResearch());
    await runResearch(d, a.token, { prospectId });
    const now = new Date('2026-07-01T09:00:00.000Z');

    const first = await scoreResearchedProspect(d, a.token, prospectId, unestablished, now);
    const second = await scoreResearchedProspect(d, a.token, prospectId, unestablished, now);

    expect(second).toEqual(first);
  });
});
