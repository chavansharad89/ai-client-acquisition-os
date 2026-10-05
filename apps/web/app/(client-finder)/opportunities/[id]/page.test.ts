import { fakeAiUsageEventRepository, type AiUsageRequestKind } from '@acos/core-ai-usage';
import type { ProspectRepository, StoredProspect } from '@acos/core-discovery';
import { hashAccessToken } from '@acos/core-entitlements';
import type { IdentityRepository, StoredSessionToken } from '@acos/core-identity';
import {
  ResearchProspectNotFoundError,
  type CategoryPlausibilityRepository,
  type StoredCategoryPlausibilityDetermination,
} from '@acos/core-research';
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
  }),
  getOpportunityScore: async () => null,
  getOpportunityNextAction: async () => ({ label: 'Review' }),
  getFeedback: async () => null,
}));

vi.mock('@acos/core-research', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-research')>()),
  listResearchSignals: async () => [],
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
    async findUserByEmail() {
      throw new Error('not used by these tests');
    },
    async findSessionToken(tokenHash: string) {
      return sessions[tokenHash] ?? null;
    },
    async saveSessionToken() {
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

let usageEvents: ReturnType<typeof fakeAiUsageEventRepository>;

beforeEach(() => {
  state.token = 'tok-a';
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
        return id === 'company_prospect_a' ? { id, name: 'Fixture Bistro' } : null;
      },
    },
    categoryPlausibility: fakeCategoryPlausibility([{ userId: 'user_a', determination: DETERMINATION }]),
    usageEvents,
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
