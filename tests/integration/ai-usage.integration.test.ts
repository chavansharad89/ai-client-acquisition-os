import { randomUUID } from 'node:crypto';

import {
  createPgAiUsageEventRepository,
  listAiUsageEvents,
  recordAiUsageEvent,
  runMeteredResearch,
  type AiUsageDeps,
} from '@acos/core-ai-usage';
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
  leadResearchSchema,
  ResearchProspectNotFoundError,
  type LeadResearch,
  type ModelInvocationUsage,
  type ModelResult,
  type ResearchInput,
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
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// AI usage metering (migration 0021, R-29) — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0021's schema plus @acos/core-ai-usage's persistence
// layer enforce, at the database itself: top-level user_id ownership
// (scope lock D3, NOT DEC-008's inheritance exception), the
// (provider, provider_message_id) idempotency constraint (D8), that
// every metered invocation of a research run survives — including
// repair rounds as separate rows (D1) — and that a failed provider call
// creates no row at all (D7). Mirrors
// tests/integration/opportunity-feedback.integration.test.ts's isolation
// pattern and tests/integration/research.integration.test.ts's Prospect
// fixture helpers.
// -----------------------------------------------------------------------

const suite = suiteDatabase('ai_usage');

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
    usageEvents: createPgAiUsageEventRepository(db.client),
  };
}

function usageDeps(base: ReturnType<typeof repos>): AiUsageDeps {
  return base;
}

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return candidates;
    },
  };
}

function discoveryDeps(
  base: ReturnType<typeof repos>,
  candidates: readonly DiscoveryCandidate[],
): SearchDeps & DiscoveryDeps {
  return { ...base, provider: discoveryProvider(candidates) };
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

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `ai-usage.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
  await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [
    userId,
    email,
  ]);

  const identity = createPgIdentityRepository(db.client);
  const minted = await mintUserSession(identity, { id: userId, email });
  return { userId, token: minted.token };
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

function sampleUsage(overrides: Partial<ModelInvocationUsage> = {}): ModelInvocationUsage {
  return {
    provider: 'anthropic',
    model: 'claude-opus-5',
    providerMessageId: `msg_${randomUUID()}`,
    inputTokens: 1200,
    outputTokens: 340,
    cacheCreationInputTokens: null,
    cacheReadInputTokens: null,
    ...overrides,
  };
}

const HOMEPAGE = {
  label: 'homepage',
  url: 'https://acme.test/about',
  text: 'Acme sells robotics.',
};

const researchInput: ResearchInput = {
  companyName: 'Acme Robotics',
  websiteUrl: 'https://acme.test',
  sourceDocuments: [HOMEPAGE],
};

function validResearch(): LeadResearch {
  const claim = {
    classification: 'OBSERVED' as const,
    value: 'Acme sells robotics',
    evidence: [
      { quote: 'Acme sells robotics.', sourceUrl: HOMEPAGE.url, sourceLabel: HOMEPAGE.label },
    ],
    basis: null,
    confidence: 90,
  };
  const unknown = {
    classification: 'UNKNOWN' as const,
    value: null,
    evidence: [],
    basis: null,
    confidence: 0,
  };
  return leadResearchSchema.parse({
    companySummary: claim,
    businessModel: unknown,
    targetCustomers: unknown,
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'AI content system', rationale: 'x', basedOn: [] },
    confidence: 70,
    gaps: [],
  });
}

function okResult(providerMessageId: string): ModelResult {
  return {
    kind: 'json',
    value: validResearch(),
    usage: sampleUsage({ providerMessageId }),
  };
}

describe('ai_usage_events schema (migration 0021)', () => {
  it('exists, carries its own user_id, references prospects, and has no monetary column', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'ai_usage_events'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toContain('user_id');
    expect(columns).toContain('prospect_id');
    expect(columns).toContain('provider');
    expect(columns).toContain('model');
    expect(columns).toContain('provider_message_id');
    expect(columns).toContain('input_tokens');
    expect(columns).toContain('output_tokens');
    for (const forbidden of ['currency', 'cost', 'price', 'amount', 'pricing_version']) {
      expect(columns).not.toContain(forbidden);
    }
  });

  it('enforces uniqueness on (provider, provider_message_id)', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'ai_usage_events'
          AND indexname = 'ai_usage_events_provider_provider_message_id_key'`,
    );
    expect(rows).toHaveLength(1);
  });
});

describe('recordAiUsageEvent / listAiUsageEvents', () => {
  it('persists under the authenticated user and the given Prospect, and survives a fresh read (AC16-11)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);

    const stored = await recordAiUsageEvent(
      usageDeps(base),
      a.token,
      prospectId,
      sampleUsage(),
      'initial',
    );
    expect(stored.userId).toBe(a.userId);
    expect(stored.prospectId).toBe(prospectId);

    const freshBase = repos();
    const fetched = await listAiUsageEvents(usageDeps(freshBase), a.token, prospectId);
    expect(fetched).toHaveLength(1);
    expect(fetched[0]!.id).toBe(stored.id);
  });

  it('rejects an unauthenticated write', async () => {
    const base = repos();
    await expect(
      recordAiUsageEvent(usageDeps(base), null, 'irrelevant', sampleUsage(), 'initial'),
    ).rejects.toBeInstanceOf(UnauthenticatedError);
  });

  it("a different user cannot record usage against another user's Prospect — no row created (AC16-09/R-33)", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);

    await expect(
      recordAiUsageEvent(usageDeps(base), b.token, prospectId, sampleUsage(), 'initial'),
    ).rejects.toBeInstanceOf(ResearchProspectNotFoundError);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM ai_usage_events WHERE prospect_id = $1`,
      [prospectId],
    );
    expect((rows[0] as { count: number }).count).toBe(0);
  });

  it("a different user cannot read user A's usage events — isolation via Prospect ownership (AC16-08/AC16-12/R-33)", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    await recordAiUsageEvent(usageDeps(base), a.token, prospectId, sampleUsage(), 'initial');

    await expect(listAiUsageEvents(usageDeps(base), b.token, prospectId)).rejects.toBeInstanceOf(
      ResearchProspectNotFoundError,
    );

    const stillThere = await listAiUsageEvents(usageDeps(base), a.token, prospectId);
    expect(stillThere).toHaveLength(1);
  });

  it('recording the same (provider, providerMessageId) twice does not create a duplicate row (D8/AC16-09)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const usage = sampleUsage();

    const first = await recordAiUsageEvent(usageDeps(base), a.token, prospectId, usage, 'initial');
    const second = await recordAiUsageEvent(usageDeps(base), a.token, prospectId, usage, 'initial');

    expect(second.id).toBe(first.id);
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT count(*)::int AS count FROM ai_usage_events WHERE provider_message_id = $1`,
      [usage.providerMessageId],
    );
    expect((rows[0] as { count: number }).count).toBe(1);
  });
});

describe('runMeteredResearch', () => {
  it('meters a successful invocation exactly once, with exact token/model/provider persistence (AC16-01/02/04/05/06)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const model = vi.fn().mockResolvedValue(okResult('msg_single'));

    await runMeteredResearch(usageDeps(base), a.token, prospectId, model, researchInput);

    const events = await listAiUsageEvents(usageDeps(base), a.token, prospectId);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      provider: 'anthropic',
      model: 'claude-opus-5',
      providerMessageId: 'msg_single',
      inputTokens: 1200,
      outputTokens: 340,
      requestKind: 'initial',
    });
    expect(events[0]!.cacheCreationInputTokens).toBeNull();
    expect(events[0]!.cacheReadInputTokens).toBeNull();
  });

  it('retries produce separate usage events (AC16-03)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const broken = {
      ...validResearch(),
      companySummary: { ...validResearch().companySummary, evidence: [] },
    };
    const model = vi
      .fn()
      .mockResolvedValueOnce({
        kind: 'json',
        value: broken,
        usage: sampleUsage({ providerMessageId: 'msg_r1' }),
      })
      .mockResolvedValueOnce(okResult('msg_r2'));

    await runMeteredResearch(usageDeps(base), a.token, prospectId, model, researchInput, {
      sleep: async () => {},
    });

    const events = await listAiUsageEvents(usageDeps(base), a.token, prospectId);
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.requestKind).sort()).toEqual(['initial', 'repair']);
  });

  it('a failed provider call creates no usage event (AC16-10/D7)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const model = vi
      .fn()
      .mockRejectedValue(Object.assign(new Error('bad request'), { status: 400 }));

    await expect(
      runMeteredResearch(usageDeps(base), a.token, prospectId, model, researchInput, {
        sleep: async () => {},
      }),
    ).rejects.toThrow();

    const events = await listAiUsageEvents(usageDeps(base), a.token, prospectId);
    expect(events).toHaveLength(0);
  });

  it('usage events survive a fresh repository instance (AC16-11)', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const model = vi.fn().mockResolvedValue(okResult('msg_durable'));

    await runMeteredResearch(usageDeps(base), a.token, prospectId, model, researchInput);

    const freshBase = repos();
    const events = await listAiUsageEvents(usageDeps(freshBase), a.token, prospectId);
    expect(events).toHaveLength(1);
    expect(events[0]!.providerMessageId).toBe('msg_durable');
  });
});
