import { fakeAiUsageEventRepository, type AiUsageRequestKind } from '@acos/core-ai-usage';
import type { ProspectRepository, StoredProspect } from '@acos/core-discovery';
import { hashAccessToken } from '@acos/core-entitlements';
import type { IdentityRepository, StoredSessionToken } from '@acos/core-identity';
import {
  ResearchProspectNotFoundError,
  type CategoryPlausibilityRepository,
  type StoredCategoryPlausibilityDetermination,
  type StoredResearchSignal,
} from '@acos/core-research';
import {
  CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG,
  fakeSubscriptionPeriodRepository,
  type LeadUnlock,
  type LeadUnlockRepository,
  type SubscriptionPeriod,
  type SubscriptionPeriodRepository,
} from '@acos/core-subscriptions';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// UNIT render test (fakes only — no database, no network) for the
// Opportunity detail page's P8/D11 evidence surface: determination
// identifiers, target segments, stored segment fields, and the Prospect's
// AI usage events. The real page component is rendered; the real
// getCategoryPlausibilityDetermination / listAiUsageEvents /
// resolveBusinessIdentity run against in-memory repositories, so their
// ownership checks are exercised, not bypassed. Only reads unrelated to
// this evidence (Opportunity lookup, score, signals, Qualification and
// the later preparation stages) are stubbed.

const state = vi.hoisted(() => ({
  token: 'tok-a' as string | undefined,
  repos: {} as Record<string, unknown>,
  signals: [] as unknown[],
  aiEnrichment: 'AI_ENRICHED' as 'AI_ENRICHED' | 'DETERMINISTIC_ONLY',
  aiEnrichmentReason: null as 'NOT_ESCALATED' | 'ESCALATION_FAILED' | 'PROVIDER_EXHAUSTED' | null,
  relevantSubservices: [] as readonly string[],
  score: null as unknown,
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  notFound: () => {
    throw new Error('NOT_FOUND');
  },
}));

vi.mock('../../../../src/server/session', () => ({
  readSessionTokenFromServerComponent: () => state.token,
}));

vi.mock('../../../../src/server/clientFinderRepositories', () => ({
  clientFinderRepositories: () => state.repos,
}));

// This page records an 'opportunity_reviewed' funnel event (ED-9/B-1) via
// a real Postgres pool — stubbed here exactly like every other
// persistence dependency above: a unit render test proves the page's
// markup, not database wiring (see tests/integration for that).
vi.mock('../../../../src/server/db', () => ({ getPool: () => ({}) }));
vi.mock('@acos/core-funnel-events', () => ({ recordFunnelEvent: async () => true }));

vi.mock('@acos/core-opportunity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-opportunity')>()),
  getOpportunity: async (_repos: unknown, _token: unknown, id: string) => ({
    id,
    prospectId: 'prospect_a',
    state: 'NEW',
    needDetected: true,
    staleness: 'FRESH',
    offer: null,
    aiEnrichment: state.aiEnrichment,
    aiEnrichmentReason: state.aiEnrichmentReason,
    relevantSubservices: state.relevantSubservices,
  }),
  getOpportunityScore: async () => state.score,
  getOpportunityNextAction: async () => ({ label: 'Review' }),
  getFeedback: async () => null,
}));

vi.mock('@acos/core-research', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-research')>()),
  listResearchSignals: async () => state.signals,
}));

vi.mock('@acos/core-qualification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-qualification')>()),
  getOpportunityQualification: async () => null,
}));

vi.mock('@acos/core-personalization', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-personalization')>()),
  getOpportunityPersonalization: async () => null,
}));

vi.mock('@acos/core-outreach-preparation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-outreach-preparation')>()),
  getOpportunityOutreachPreparation: async () => null,
}));

vi.mock('@acos/core-followup-preparation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-followup-preparation')>()),
  getOpportunityFollowUpPreparation: async () => null,
}));

// Vitest compiles page.tsx's JSX with the classic runtime (tsconfig has
// `jsx: preserve` for Next), which references a global `React`. Next's own
// compiler supplies that; here the test does, without touching config.
(globalThis as { React?: typeof React }).React = React;
const { default: OpportunityDetailPage } = await import('./page');

function fakeIdentity(sessions: Record<string, StoredSessionToken>): IdentityRepository {
  return {
    async createUser() {
      throw new Error('not used by these tests');
    },
    async findOrCreateUser() {
      throw new Error('not used by these tests');
    },
    async findUserByEmail() {
      throw new Error('not used by these tests');
    },
    async findUserById() {
      throw new Error('not used by these tests');
    },
    async findCredentialsByEmail() {
      throw new Error('not used by these tests');
    },
    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },
    async saveSessionToken() {
      throw new Error('not used by these tests');
    },
    async revokeSessionToken() {
      throw new Error('not used by these tests');
    },
    async findUserAuthStateById() {
      throw new Error('not used by these tests');
    },
    async saveActivationToken() {
      throw new Error('not used by these tests');
    },
    async findActivationToken() {
      throw new Error('not used by these tests');
    },
    async consumeActivationToken() {
      throw new Error('not used by these tests');
    },
    async setEmailVerified() {
      throw new Error('not used by these tests');
    },
    async completeAccountSetup() {
      throw new Error('not used by these tests');
    },
  };
}

function sessionFor(rawToken: string, userId: string): Record<string, StoredSessionToken> {
  return {
    [hashAccessToken(rawToken)]: { userId, expiresAt: new Date(Date.now() + 60_000), revokedAt: null },
  };
}

function fakeProspects(rows: StoredProspect[]): ProspectRepository {
  return {
    async findOrCreate() {
      throw new Error('not used by these tests');
    },
    async listBySearch() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
  };
}

function prospect(id: string, userId: string, searchId: string): StoredProspect {
  return {
    id,
    userId,
    searchId,
    companyId: `company_${id}`,
    status: 'DISCOVERED',
    createdAt: new Date('2026-09-01T00:00:00.000Z'),
  };
}

const DETERMINATION: StoredCategoryPlausibilityDetermination = {
  id: 'det_7f3a',
  searchId: 'search_a',
  prospectId: 'prospect_a',
  targetCustomer: 'Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators',
  targetSegments: ['Restaurants, Cafes', 'Boutique Retailers & E-commerce Brands', 'Hotels, Resorts & Tour Operators'],
  aggregateResult: 'MATCH',
  segmentResults: [
    {
      segment: 'Restaurants, Cafes',
      fit: 'MATCH',
      rationale: 'The homepage lists a dine-in menu.',
      evidence: [{ quote: 'Our dine-in menu', sourceUrl: 'https://fixture.test/', sourceLabel: 'Homepage' }],
      confidence: 82,
      basis: 'CITED_SOURCE_EVIDENCE',
      classification: 'OBSERVED',
    },
    {
      segment: 'Boutique Retailers & E-commerce Brands',
      fit: 'UNKNOWN',
      rationale: null,
      evidence: [],
      confidence: 0,
      basis: 'MODEL_REPORTED_INSUFFICIENT_EVIDENCE',
      classification: 'UNKNOWN',
    },
    // Pre-F-1 row shape: confidence/basis/classification not stored.
    { segment: 'Hotels, Resorts & Tour Operators', fit: 'UNKNOWN', rationale: null, evidence: [] },
  ],
  observedAt: new Date('2026-09-28T10:15:00.000Z'),
  supersededAt: null,
};

function fakeCategoryPlausibility(
  rows: { userId: string; determination: StoredCategoryPlausibilityDetermination }[],
): CategoryPlausibilityRepository {
  return {
    async supersedePrevious() {
      throw new Error('not used by these tests');
    },
    async save() {
      throw new Error('not used by these tests');
    },
    async listBySearchAndProspect() {
      throw new Error('not used by these tests');
    },
    async getCurrentByProspectId(userId: string, prospectId: string) {
      return (
        rows.find((row) => row.userId === userId && row.determination.prospectId === prospectId)?.determination ??
        null
      );
    },
    async isCategoryPlausibilityApplicableForProspectId() {
      throw new Error('not used by these tests');
    },
  };
}

async function seedEvent(
  usageEvents: ReturnType<typeof fakeAiUsageEventRepository>,
  userId: string,
  prospectId: string,
  event: { provider: string; model: string; requestKind: AiUsageRequestKind; providerMessageId: string; at: string },
) {
  await usageEvents.recordEvent(
    userId,
    prospectId,
    {
      provider: event.provider,
      model: event.model,
      requestKind: event.requestKind,
      providerMessageId: event.providerMessageId,
      inputTokens: 100,
      outputTokens: 50,
      cacheCreationInputTokens: null,
      cacheReadInputTokens: null,
    },
    new Date(event.at),
  );
}

// Phase 0 regression-safety hardening (AUTH_COMMERCIAL_IMPLEMENTATION_
// IMPACT_AUDIT.md §15 item 2): this previously keyed only on `userId` and
// ignored `productSlug`/`now`, so it could not fail a test that queried
// the wrong slug or a since-expired period. It now delegates to
// `fakeSubscriptionPeriodRepository`, the same real-formula fake used by
// access.test.ts and leadUnlockService.test.ts. `activationAt` defaults
// to "yesterday" relative to the real clock (not a fixed calendar date)
// so this stays active regardless of when the suite runs; pass
// `activationAt`/`durationDays` explicitly to construct an expired or
// not-yet-active period.
function fakeSubscriptionPeriods(
  activeUserIds: readonly string[] = [],
  overrides: { productSlug?: string; activationAt?: Date; durationDays?: number } = {},
): SubscriptionPeriodRepository {
  const periods: SubscriptionPeriod[] = activeUserIds.map((userId) => ({
    id: 'sub_period_a',
    userId,
    productSlug: overrides.productSlug ?? CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG,
    razorpaySubscriptionId: 'rzp_sub_a',
    razorpayPaymentId: 'rzp_pay_a',
    activationAt: overrides.activationAt ?? new Date(Date.now() - 24 * 60 * 60 * 1000),
    durationDays: overrides.durationDays ?? 30,
    refundedAt: null,
    createdAt: new Date('2026-09-28T00:00:00.000Z'),
    updatedAt: new Date('2026-09-28T00:00:00.000Z'),
  }));
  return fakeSubscriptionPeriodRepository(periods);
}

function fakeLeadUnlocks(existing: Record<string, LeadUnlock> = {}): LeadUnlockRepository {
  return {
    async findByUserAndOpportunity(userId, opportunityId) {
      return existing[`${userId}:${opportunityId}`] ?? null;
    },
    async revealAtomically() {
      throw new Error('not used by these tests');
    },
  };
}

let usageEvents: ReturnType<typeof fakeAiUsageEventRepository>;

beforeEach(() => {
  state.token = 'tok-a';
  state.signals = [];
  state.aiEnrichment = 'AI_ENRICHED';
  state.aiEnrichmentReason = null;
  state.relevantSubservices = [];
  state.score = null;
  usageEvents = fakeAiUsageEventRepository();
  state.repos = {
    identity: fakeIdentity({ ...sessionFor('tok-a', 'user_a'), ...sessionFor('tok-b', 'user_b') }),
    prospects: fakeProspects([
      prospect('prospect_a', 'user_a', 'search_a'),
      prospect('prospect_a2', 'user_a', 'search_a2'),
      prospect('prospect_b', 'user_b', 'search_b'),
    ]),
    companies: {
      async getById(_userId: string, id: string) {
        return id === 'company_prospect_a' ? { id, name: 'Fixture Bistro', normalizedDomain: 'fixturebistro.com' } : null;
      },
    },
    categoryPlausibility: fakeCategoryPlausibility([{ userId: 'user_a', determination: DETERMINATION }]),
    usageEvents,
    // Default: no active subscription anywhere, no prior unlock anywhere —
    // the most restrictive/safe default (Phase 2 Parts 2/3). Tests that
    // need a subscriber or an existing unlock override these two keys.
    subscriptionPeriods: fakeSubscriptionPeriods([]),
    leadUnlocks: fakeLeadUnlocks({}),
  };
});

async function renderPage(): Promise<string> {
  return renderToStaticMarkup(await OpportunityDetailPage({ params: { id: 'opp_a' } }));
}

/** Visible text only, entities decoded, whitespace collapsed. */
function text(html: string): string {
  return html
    .replace(/<!-- -->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

describe('Opportunity detail page — P8/D11 evidence', () => {
  it('shows the determination identifiers, ordered target segments and stored segment fields', async () => {
    const html = await renderPage();
    const page = text(html);

    expect(page).toContain('Determination ID det_7f3a');
    expect(page).toContain('Determined 2026-09-28T10:15:00.000Z');
    expect(page).toContain('Search ID search_a');
    expect(page).toContain('Prospect ID prospect_a');

    expect(page).toContain('Target segments (3):');
    const orderedList = html.match(/<ol>(.*?)<\/ol>/)?.[1] ?? '';
    const listed = [...orderedList.matchAll(/<li>(.*?)<\/li>/g)].map((m) => text(m[1]!));
    expect(listed).toEqual([...DETERMINATION.targetSegments]);

    expect(page).toContain('Restaurants, Cafes — MATCH');
    expect(page).toContain('Classification: OBSERVED · Confidence: 82 · Basis: CITED_SOURCE_EVIDENCE');
    expect(page).toContain('Homepage : "Our dine-in menu"');
  });

  it('shows a stored UNKNOWN confidence of 0 and ABSENT for fields a pre-F-1 segment lacks', async () => {
    const page = text(await renderPage());

    expect(page).toContain('Boutique Retailers & E-commerce Brands — UNKNOWN');
    expect(page).toContain('Classification: UNKNOWN · Confidence: 0 · Basis: MODEL_REPORTED_INSUFFICIENT_EVIDENCE');
    expect(page).toContain('Hotels, Resorts & Tour Operators — UNKNOWN');
    expect(page).toContain('Classification: ABSENT · Confidence: ABSENT · Basis: ABSENT');
  });

  it("shows each of the Prospect's AI usage events with provider, model, request_kind and timestamp", async () => {
    await seedEvent(usageEvents, 'user_a', 'prospect_a', {
      provider: 'anthropic',
      model: 'claude-opus-5',
      requestKind: 'initial',
      providerMessageId: 'msg_1',
      at: '2026-09-28T10:14:00.000Z',
    });
    await seedEvent(usageEvents, 'user_a', 'prospect_a', {
      provider: 'anthropic',
      model: 'claude-opus-5',
      requestKind: 'repair',
      providerMessageId: 'msg_2',
      at: '2026-09-28T10:14:30.000Z',
    });

    const page = text(await renderPage());

    expect(page).toContain('2026-09-28T10:14:00.000Z — provider anthropic, model claude-opus-5, request_kind initial');
    expect(page).toContain('2026-09-28T10:14:30.000Z — provider anthropic, model claude-opus-5, request_kind repair');
  });

  it('reports fallback invoked NO without a fallback event, and YES with the recorded fallback provider', async () => {
    await seedEvent(usageEvents, 'user_a', 'prospect_a', {
      provider: 'anthropic',
      model: 'claude-opus-5',
      requestKind: 'initial',
      providerMessageId: 'msg_1',
      at: '2026-09-28T10:14:00.000Z',
    });

    const withoutFallback = text(await renderPage());
    expect(withoutFallback).toContain('Fallback invoked: NO · Provider recorded: anthropic');

    await seedEvent(usageEvents, 'user_a', 'prospect_a', {
      provider: 'openai',
      model: 'gpt-fixture',
      requestKind: 'fallback',
      providerMessageId: 'msg_3',
      at: '2026-09-28T10:14:45.000Z',
    });

    const withFallback = text(await renderPage());
    expect(withFallback).toContain('Fallback invoked: YES · Provider recorded on fallback events: openai');
    expect(withFallback).toContain('provider openai, model gpt-fixture, request_kind fallback');
  });

  it("does not expose usage events of another user or of the user's other Prospects", async () => {
    await seedEvent(usageEvents, 'user_a', 'prospect_a', {
      provider: 'anthropic',
      model: 'claude-opus-5',
      requestKind: 'initial',
      providerMessageId: 'msg_own',
      at: '2026-09-28T10:14:00.000Z',
    });
    await seedEvent(usageEvents, 'user_b', 'prospect_b', {
      provider: 'gemini',
      model: 'other-user-model',
      requestKind: 'fallback',
      providerMessageId: 'msg_other_user',
      at: '2026-09-28T10:20:00.000Z',
    });
    await seedEvent(usageEvents, 'user_a', 'prospect_a2', {
      provider: 'openai',
      model: 'other-prospect-model',
      requestKind: 'initial',
      providerMessageId: 'msg_other_prospect',
      at: '2026-09-28T10:21:00.000Z',
    });
    // Same Prospect id recorded under a different user must not leak either.
    await seedEvent(usageEvents, 'user_b', 'prospect_a', {
      provider: 'gemini',
      model: 'cross-user-same-prospect-model',
      requestKind: 'initial',
      providerMessageId: 'msg_cross',
      at: '2026-09-28T10:22:00.000Z',
    });

    const page = text(await renderPage());

    expect(page).toContain('provider anthropic, model claude-opus-5, request_kind initial');
    expect(page).not.toContain('other-user-model');
    expect(page).not.toContain('other-prospect-model');
    expect(page).not.toContain('cross-user-same-prospect-model');
    expect(page).not.toContain('gemini');
    expect(page).toContain('Fallback invoked: NO');
  });

  it("a different user's session cannot render this Prospect's evidence", async () => {
    state.token = 'tok-b';
    await expect(renderPage()).rejects.toBeInstanceOf(ResearchProspectNotFoundError);
  });
});

/** The ranking section's own `<ul>...</ul>` inner HTML, scoped away from the Evidence/Qualification lists elsewhere on the page. */
function rankingSectionHtml(html: string): string {
  return html.match(/<h2>Ranking<\/h2>\s*<ul>(.*?)<\/ul>/s)?.[1] ?? '';
}

function scoreWithRanking(ranking: Record<string, 'STRONG' | 'MODERATE' | 'WEAK' | 'UNKNOWN'>) {
  return {
    id: 'score_a',
    opportunityId: 'opp_a',
    ranking,
    reasons: ['fixture reason'],
    rankerVersion: 'v1',
    scoredAt: new Date('2026-09-28T00:00:00.000Z'),
    createdAt: new Date('2026-09-28T00:00:00.000Z'),
  };
}

// C-4 (CLIENT_FINDER_C_SERIES_PRODUCT_OWNER_DECISION_RECORD.md): UNKNOWN is
// a valid internal ranking state that must never be shown as literal
// "UNKNOWN" text — the dimension is hidden instead, with no fabricated
// replacement value, for all seven dimensions including Primary ones.
describe('Opportunity detail page — C-4 UNKNOWN ranking dimension visibility', () => {
  it('hides an UNKNOWN Primary dimension (needOpportunity)', async () => {
    state.score = scoreWithRanking({
      needOpportunity: 'UNKNOWN',
      serviceFit: 'STRONG',
      evidenceQuality: 'STRONG',
      evidenceFreshness: 'STRONG',
      contactability: 'STRONG',
      currentActivity: 'STRONG',
      commercialReadiness: 'STRONG',
    });
    const section = rankingSectionHtml(await renderPage());
    expect(section).not.toContain('needOpportunity:');
  });

  it('hides an UNKNOWN Important dimension (evidenceQuality)', async () => {
    state.score = scoreWithRanking({
      needOpportunity: 'STRONG',
      serviceFit: 'STRONG',
      evidenceQuality: 'UNKNOWN',
      evidenceFreshness: 'STRONG',
      contactability: 'STRONG',
      currentActivity: 'STRONG',
      commercialReadiness: 'STRONG',
    });
    const section = rankingSectionHtml(await renderPage());
    expect(section).not.toContain('evidenceQuality:');
  });

  it('hides an UNKNOWN Supporting dimension (contactability)', async () => {
    state.score = scoreWithRanking({
      needOpportunity: 'STRONG',
      serviceFit: 'STRONG',
      evidenceQuality: 'STRONG',
      evidenceFreshness: 'STRONG',
      contactability: 'UNKNOWN',
      currentActivity: 'STRONG',
      commercialReadiness: 'STRONG',
    });
    const section = rankingSectionHtml(await renderPage());
    expect(section).not.toContain('contactability:');
  });

  it('keeps every known (non-UNKNOWN) dimension visible with its real tier', async () => {
    state.score = scoreWithRanking({
      needOpportunity: 'STRONG',
      serviceFit: 'MODERATE',
      evidenceQuality: 'WEAK',
      evidenceFreshness: 'UNKNOWN',
      contactability: 'UNKNOWN',
      currentActivity: 'UNKNOWN',
      commercialReadiness: 'STRONG',
    });
    const section = text(rankingSectionHtml(await renderPage()));
    expect(section).toContain('needOpportunity: STRONG');
    expect(section).toContain('serviceFit: MODERATE');
    expect(section).toContain('evidenceQuality: WEAK');
    expect(section).toContain('commercialReadiness: STRONG');
  });

  it('never renders the literal word UNKNOWN in the ranking section, and never substitutes a fabricated tier for it', async () => {
    state.score = scoreWithRanking({
      needOpportunity: 'UNKNOWN',
      serviceFit: 'UNKNOWN',
      evidenceQuality: 'UNKNOWN',
      evidenceFreshness: 'UNKNOWN',
      contactability: 'STRONG',
      currentActivity: 'UNKNOWN',
      commercialReadiness: 'UNKNOWN',
    });
    const section = rankingSectionHtml(await renderPage());
    expect(section).not.toContain('UNKNOWN');
    // Only the one known dimension renders — no placeholder item stands in for the six hidden ones.
    const items = [...section.matchAll(/<li>(.*?)<\/li>/g)];
    expect(items).toHaveLength(1);
    expect(text(items[0]![1]!)).toBe('contactability: STRONG');
  });
});

// Regression coverage for the real production incident: a legacy
// prospectScore-v1 score (written before migration 0044) has
// score.ranking === null (scorePgRepository.ts's mapRow() no longer
// reinterprets its old seven-factor array as a UniversalRankingProfile).
// This page must render that case without throwing "Objects are not
// valid as a React child" — the qualitative ranking list is simply
// absent, while the pre-existing, already-correct reasons text still
// renders.
describe('Opportunity detail page — legacy (pre-migration-0044) score compatibility', () => {
  it('renders without error when ranking is null, omits the ranking list, and still shows reasons', async () => {
    state.score = {
      id: 'score_a',
      opportunityId: 'opp_a',
      ranking: null,
      reasons: ['Observed: hiring a content writer (+17)'],
      rankerVersion: 'prospectScore-v1',
      scoredAt: new Date('2026-09-28T00:00:00.000Z'),
      createdAt: new Date('2026-09-28T00:00:00.000Z'),
    };

    const html = await renderPage();

    expect(html).toContain('<h2>Ranking</h2>');
    expect(html).not.toMatch(/<h2>Ranking<\/h2>\s*<ul>/);
    expect(text(html)).toContain('Observed: hiring a content writer (+17)');
  });
});

// Phase 7A: candidate-level AI enrichment provenance (MULR item 9). Renders
// the already-persisted StoredOpportunity.aiEnrichment/aiEnrichmentReason
// exactly as stored — nothing here recomputes or redefines those values.
describe('Opportunity detail page — Phase 7A AI enrichment provenance', () => {
  it('renders AI_ENRICHED with no reason shown', async () => {
    state.aiEnrichment = 'AI_ENRICHED';
    state.aiEnrichmentReason = null;

    const page = text(await renderPage());

    expect(page).toContain('AI enrichment AI_ENRICHED');
    expect(page).not.toContain('AI enrichment reason');
  });

  it('renders DETERMINISTIC_ONLY with reason NOT_ESCALATED', async () => {
    state.aiEnrichment = 'DETERMINISTIC_ONLY';
    state.aiEnrichmentReason = 'NOT_ESCALATED';

    const page = text(await renderPage());

    expect(page).toContain('AI enrichment DETERMINISTIC_ONLY');
    expect(page).toContain('AI enrichment reason NOT_ESCALATED');
  });

  it('renders DETERMINISTIC_ONLY with reason ESCALATION_FAILED', async () => {
    state.aiEnrichment = 'DETERMINISTIC_ONLY';
    state.aiEnrichmentReason = 'ESCALATION_FAILED';

    const page = text(await renderPage());

    expect(page).toContain('AI enrichment DETERMINISTIC_ONLY');
    expect(page).toContain('AI enrichment reason ESCALATION_FAILED');
  });

  it('renders DETERMINISTIC_ONLY with reason PROVIDER_EXHAUSTED', async () => {
    state.aiEnrichment = 'DETERMINISTIC_ONLY';
    state.aiEnrichmentReason = 'PROVIDER_EXHAUSTED';

    const page = text(await renderPage());

    expect(page).toContain('AI enrichment DETERMINISTIC_ONLY');
    expect(page).toContain('AI enrichment reason PROVIDER_EXHAUSTED');
  });

  it('does not render an "AI enrichment reason" row when AI_ENRICHED even if a stale reason value were present', async () => {
    state.aiEnrichment = 'AI_ENRICHED';
    // Defensive: authoritative values always pair AI_ENRICHED with
    // reason = NULL, but the UI must not display a reason row for
    // AI_ENRICHED regardless of what the stored reason value is.
    state.aiEnrichmentReason = 'NOT_ESCALATED';

    const page = text(await renderPage());

    expect(page).toContain('AI enrichment AI_ENRICHED');
    expect(page).not.toContain('AI enrichment reason');
  });
});

// Phase 7B: relevant predefined subservices (MULR item 6). Renders the
// already-persisted StoredOpportunity.relevantSubservices exactly as
// stored — nothing here recomputes or redefines the matching.
describe('Opportunity detail page — Phase 7B relevant subservices', () => {
  it('14. renders a "Relevant subservices" section listing each matched subservice when present', async () => {
    state.relevantSubservices = ['Website development', 'Mobile apps'];

    const page = text(await renderPage());

    expect(page).toContain('Relevant subservices');
    expect(page).toContain('Website development');
    expect(page).toContain('Mobile apps');
  });

  it('15. omits the "Relevant subservices" section entirely when none matched', async () => {
    state.relevantSubservices = [];

    const page = text(await renderPage());

    expect(page).not.toContain('Relevant subservices');
  });
});

function signalWithQuote(quote: string, claim: string | null = null): StoredResearchSignal {
  return {
    id: 'signal_1',
    prospectId: 'prospect_a',
    field: 'visibleProblems',
    kind: 'WEBSITE',
    classification: 'OBSERVED',
    signal: claim,
    confidence: 70,
    basis: null,
    observedAt: new Date('2026-09-28T09:00:00.000Z'),
    supersededAt: null,
    sources: [{ id: 'source_1', sourceUrl: 'https://fixture.test/contact', sourceLabel: 'Contact page', sourceQuote: quote }],
  };
}

// ₹1,499 Client Finder subscription — Phase 2 Part 1 (contact-evidence
// leak fix) and Parts 2/3 (subscription status + unlock UI) regression
// coverage.
describe('Opportunity detail page — ₹1,499 Client Finder subscription contact access', () => {
  it('masks a personal email found in a source quote before unlock, and never renders the raw value', async () => {
    state.signals = [signalWithQuote('Reach the owner at jane.doe@gmail.com for a quote.')];

    const page = text(await renderPage());

    expect(page).not.toContain('jane.doe@gmail.com');
    expect(page).toContain('[contact hidden — unlock to view]');
  });

  it('masks a phone number found in a signal claim before unlock, and never renders the raw value', async () => {
    state.signals = [signalWithQuote('See homepage for details.', 'Call 98765 43210 to book a table.')];

    const page = text(await renderPage());

    expect(page).not.toContain('98765 43210');
    expect(page).toContain('[contact hidden — unlock to view]');
  });

  it('leaves evidence with no contact identifier exactly as stored', async () => {
    state.signals = [signalWithQuote('Posted a job listing for a front-of-house manager.')];

    const page = text(await renderPage());

    expect(page).toContain('Posted a job listing for a front-of-house manager.');
    expect(page).not.toContain('[contact hidden — unlock to view]');
  });

  it('a non-subscriber with no prior unlock sees a subscribe prompt, never an Unlock Contact button', async () => {
    state.signals = [signalWithQuote('Email owner@personalmail.com for bookings.')];
    (state.repos as Record<string, unknown>).subscriptionPeriods = fakeSubscriptionPeriods([]);
    (state.repos as Record<string, unknown>).leadUnlocks = fakeLeadUnlocks({});

    const html = await renderPage();
    const page = text(html);

    expect(page).toContain('Client Finder subscription: Not active');
    expect(page).toContain('Contact information is available for this opportunity.');
    expect(page).toContain('An active ₹1,499 Client Finder subscription is required to unlock it.');
    expect(page).not.toContain('Unlock Contact');
    expect(page).not.toContain('owner@personalmail.com');
    expect(html).toContain(`/checkout/${CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG}`);
  });

  it('an active subscriber with a qualifying contact and no prior unlock sees the Unlock Contact action', async () => {
    state.signals = [signalWithQuote('Email owner@personalmail.com for bookings.')];
    (state.repos as Record<string, unknown>).subscriptionPeriods = fakeSubscriptionPeriods(['user_a']);
    (state.repos as Record<string, unknown>).leadUnlocks = fakeLeadUnlocks({});

    const page = text(await renderPage());

    expect(page).toContain('Client Finder subscription: Active');
    expect(page).toContain('Unlock Contact');
    expect(page).not.toContain('owner@personalmail.com');
  });

  it('a subscriber with an EXPIRED period sees a subscribe prompt, not Unlock Contact', async () => {
    state.signals = [signalWithQuote('Email owner@personalmail.com for bookings.')];
    (state.repos as Record<string, unknown>).subscriptionPeriods = fakeSubscriptionPeriods(['user_a'], {
      activationAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
      durationDays: 30,
    });
    (state.repos as Record<string, unknown>).leadUnlocks = fakeLeadUnlocks({});

    const page = text(await renderPage());

    expect(page).toContain('Client Finder subscription: Not active');
    expect(page).not.toContain('Unlock Contact');
  });

  it('a subscriber whose only active period is for a DIFFERENT product sees a subscribe prompt, not Unlock Contact', async () => {
    state.signals = [signalWithQuote('Email owner@personalmail.com for bookings.')];
    (state.repos as Record<string, unknown>).subscriptionPeriods = fakeSubscriptionPeriods(['user_a'], {
      productSlug: 'ai_freelancing_499',
    });
    (state.repos as Record<string, unknown>).leadUnlocks = fakeLeadUnlocks({});

    const page = text(await renderPage());

    expect(page).toContain('Client Finder subscription: Not active');
    expect(page).not.toContain('Unlock Contact');
  });

  it('an active subscriber with no qualifying contact sees no contact details found, and no Unlock button', async () => {
    state.signals = [signalWithQuote('We are open Monday to Saturday.')];
    (state.repos as Record<string, unknown>).subscriptionPeriods = fakeSubscriptionPeriods(['user_a']);

    const page = text(await renderPage());

    expect(page).toContain('No contact details were found in the research evidence for this opportunity.');
    expect(page).not.toContain('Unlock Contact');
  });

  it('a previously unlocked opportunity renders its revealed contacts directly, independent of today’s subscription state', async () => {
    state.signals = [signalWithQuote('Email owner@personalmail.com for bookings.')];
    (state.repos as Record<string, unknown>).subscriptionPeriods = fakeSubscriptionPeriods([]); // expired/none today
    (state.repos as Record<string, unknown>).leadUnlocks = fakeLeadUnlocks({
      'user_a:opp_a': {
        id: 'unlock_1',
        userId: 'user_a',
        opportunityId: 'opp_a',
        subscriptionPeriodId: 'sub_period_old',
        unlockedAt: new Date('2026-09-01T00:00:00.000Z'),
        createdAt: new Date('2026-09-01T00:00:00.000Z'),
        contacts: [{ kind: 'PERSONAL_EMAIL', value: 'owner@personalmail.com' }],
      },
    });

    const page = text(await renderPage());

    expect(page).toContain('Unlocked');
    expect(page).toContain('Personal email: owner@personalmail.com');
    // The Evidence section's own rendering of the same text is still masked —
    // the only place the raw value may legitimately appear is this reveal.
    expect(page).toContain('[contact hidden — unlock to view]');
  });
});
