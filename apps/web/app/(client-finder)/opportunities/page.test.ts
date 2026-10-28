import type { EntityRepository, StoredCompany, StoredProspect } from '@acos/core-discovery';
import { hashAccessToken } from '@acos/core-entitlements';
import type { IdentityRepository, StoredSessionToken } from '@acos/core-identity';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// UNIT render test (fakes only — no database, no network) for the
// Opportunities list page's C-7 "Why found" presentation. "Why found" is
// derived ONLY from the structured discovery provenance C-5 already
// persists (`EntityRepository.getDiscoveryEvent`) via
// `resolveWhyFound()` (src/server/clientFinderView.ts) — that function
// runs for real here against fake repositories, exactly like
// `resolveBusinessIdentity` already does in the detail-page tests. No
// free-text `whyFound` field exists anywhere in these fakes.

const state = vi.hoisted(() => ({
  token: 'tok-a' as string | undefined,
  repos: {} as Record<string, unknown>,
  ranked: [] as unknown[],
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
}));

vi.mock('../../../src/server/session', () => ({
  readSessionTokenFromServerComponent: () => state.token,
}));

vi.mock('../../../src/server/clientFinderRepositories', () => ({
  clientFinderRepositories: () => state.repos,
}));

vi.mock('@acos/core-opportunity', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-opportunity')>()),
  rankOpportunities: async () => state.ranked,
  getOpportunity: async (_repos: unknown, _token: unknown, id: string) => ({
    id,
    prospectId: 'prospect_a',
    state: 'NEW',
    needDetected: false,
    staleness: 'FRESH',
    offer: null,
    aiEnrichment: 'DETERMINISTIC_ONLY',
    aiEnrichmentReason: 'NOT_ESCALATED',
    relevantSubservices: [],
  }),
}));

vi.mock('@acos/core-subscriptions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-subscriptions')>()),
  getClientFinderSubscriptionStatus: async () => ({ active: false, expiresAt: null }),
}));

(globalThis as { React?: typeof React }).React = React;
const { default: OpportunitiesPage } = await import('./page');

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

function fakeProspects(rows: StoredProspect[]) {
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

function prospect(id: string, userId: string, searchId: string, companyId: string): StoredProspect {
  return { id, userId, searchId, companyId, status: 'DISCOVERED', createdAt: new Date('2026-09-01T00:00:00.000Z') };
}

function fakeCompanies(rows: StoredCompany[]) {
  return {
    async findOrCreateByDomain() {
      throw new Error('not used by these tests');
    },
    async getById(userId: string, id: string) {
      return rows.find((row) => row.id === id && row.userId === userId) ?? null;
    },
  };
}

function company(id: string, userId: string, name: string, entityId: string | null): StoredCompany {
  return { id, userId, name, normalizedDomain: 'fixture.test', entityId, createdAt: new Date('2026-09-01T00:00:00.000Z') };
}

/** Only `getDiscoveryEvent` is implemented — every other method throws, since C-7 reads only that one. */
function fakeEntities(
  events: Record<string, { provider: string; query: string; discoveredAt: Date }>,
): EntityRepository {
  return {
    async resolveAndPersistCandidate() {
      throw new Error('not used by these tests');
    },
    async recordFailedAttempt() {
      throw new Error('not used by these tests');
    },
    async recordStatusObservation() {
      throw new Error('not used by these tests');
    },
    async getStatusObservations() {
      throw new Error('not used by these tests');
    },
    async getDiscoveryEvent(searchId: string, entityId: string) {
      return events[`${searchId}:${entityId}`] ?? null;
    },
  };
}

function rankedEntry(opportunityId: string) {
  return {
    opportunityId,
    rank: 1,
    score: {
      id: `score_${opportunityId}`,
      opportunityId,
      ranking: {
        needOpportunity: 'UNKNOWN',
        serviceFit: 'UNKNOWN',
        evidenceQuality: 'UNKNOWN',
        evidenceFreshness: 'UNKNOWN',
        contactability: 'UNKNOWN',
        currentActivity: 'UNKNOWN',
        commercialReadiness: 'UNKNOWN',
      },
      reasons: ['fixture reason'],
      rankerVersion: 'v1',
      scoredAt: new Date('2026-09-28T00:00:00.000Z'),
      createdAt: new Date('2026-09-28T00:00:00.000Z'),
    },
  };
}

beforeEach(() => {
  state.token = 'tok-a';
  state.ranked = [rankedEntry('opp_a')];
  state.repos = {
    identity: fakeIdentity(sessionFor('tok-a', 'user_a')),
    prospects: fakeProspects([prospect('prospect_a', 'user_a', 'search_a', 'company_a')]),
    companies: fakeCompanies([company('company_a', 'user_a', 'Fixture Bistro', 'entity_a')]),
    entities: fakeEntities({
      'search_a:entity_a': {
        provider: 'GOOGLE_PLACES',
        query: 'Web Development in Mumbai',
        discoveredAt: new Date('2026-09-02T00:00:00.000Z'),
      },
    }),
  };
});

async function renderPage(): Promise<string> {
  return renderToStaticMarkup(await OpportunitiesPage());
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

// C-7 (CLIENT_FINDER_C_SERIES_PRODUCT_OWNER_DECISION_RECORD.md): "Why
// found" is derived from the structured discovery provenance C-5
// persists, never from an arbitrary free-text field, and never invented
// when that provenance is missing.
describe('Opportunities list page — C-7 "Why found"', () => {
  it('derives "Why found" from the existing persisted discovery provenance', async () => {
    const page = text(await renderPage());
    expect(page).toContain('Found through Google Places for "Web Development in Mumbai"');
  });

  it('does not persist or read any arbitrary free-text whyFound field — only provider/query/discoveredAt', async () => {
    // The fake EntityRepository's getDiscoveryEvent is the sole provenance
    // source; it is typed to return only { provider, query, discoveredAt }
    // (core-discovery's DiscoveryEventRecord) — there is no whyFound-shaped
    // field for a caller to read even if one were (wrongly) stored.
    const event = await state.repos.entities as EntityRepository;
    const row = await event.getDiscoveryEvent('search_a', 'entity_a');
    expect(row).toEqual({
      provider: 'GOOGLE_PLACES',
      query: 'Web Development in Mumbai',
      discoveredAt: new Date('2026-09-02T00:00:00.000Z'),
    });
    expect(Object.keys(row!)).toEqual(['provider', 'query', 'discoveredAt']);
  });

  it('renders nothing for "Why found" when no discovery provenance exists (missing entityId), instead of inventing text', async () => {
    state.repos.companies = fakeCompanies([company('company_a', 'user_a', 'Fixture Bistro', null)]);
    const page = text(await renderPage());
    expect(page).not.toContain('Found through');
    expect(page).not.toContain('undefined');
    expect(page).not.toContain('null');
  });

  it('renders nothing for "Why found" when the company has an entityId but no matching DiscoveryEvent row exists, instead of inventing text', async () => {
    state.repos.entities = fakeEntities({});
    const page = text(await renderPage());
    expect(page).not.toContain('Found through');
    expect(page).not.toContain('undefined');
    expect(page).not.toContain('null');
  });
});

// Regression coverage: a legacy prospectScore-v1 row (written before
// migration 0044) has score.ranking === null. The list row must still
// render — no "Cannot read properties of null (reading 'needOpportunity')"
// — simply omitting the Need/Opportunity · Service Fit fragment.
describe('Opportunities list page — legacy (pre-migration-0044) score compatibility', () => {
  it('renders without error when ranking is null and omits the ranking fragment', async () => {
    state.ranked = [
      {
        opportunityId: 'opp_a',
        rank: 1,
        score: {
          id: 'score_opp_a',
          opportunityId: 'opp_a',
          ranking: null,
          reasons: ['Observed: hiring a content writer (+17)'],
          rankerVersion: 'prospectScore-v1',
          scoredAt: new Date('2026-09-28T00:00:00.000Z'),
          createdAt: new Date('2026-09-28T00:00:00.000Z'),
        },
      },
    ];

    const page = text(await renderPage());

    expect(page).not.toContain('Need/Opportunity:');
    expect(page).not.toContain('Service Fit:');
    expect(page).toContain('No suitable offer detected');
  });
});
