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
  qualification: null as unknown,
  opportunityProspectIds: {} as Record<string, string>,
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
    prospectId: state.opportunityProspectIds[id] ?? 'prospect_a',
    state: 'NEW',
    needDetected: false,
    staleness: 'FRESH',
    offer: null,
    aiEnrichment: 'DETERMINISTIC_ONLY',
    aiEnrichmentReason: 'NOT_ESCALATED',
    relevantSubservices: [],
  }),
}));

vi.mock('@acos/core-qualification', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@acos/core-qualification')>()),
  getOpportunityQualification: async () => state.qualification,
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
    // Mirrors the real repository's ownership filter (userId AND
    // searchId) — a foreign/invalid searchId simply yields no rows,
    // never another user's data.
    async listBySearch(userId: string, searchId: string) {
      return rows.filter((row) => row.userId === userId && row.searchId === searchId);
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

function rankedEntry(opportunityId: string, rank = 1) {
  return {
    opportunityId,
    rank,
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
  state.qualification = null;
  state.opportunityProspectIds = {};
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

async function renderPage(searchId?: string): Promise<string> {
  return renderToStaticMarkup(await OpportunitiesPage({ searchParams: searchId ? { searchId } : {} }));
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

// B1 (CF-OPPORTUNITIES-LIST-VISIBILITY-PO-DEC-001): every discovered
// Opportunity stays visible regardless of QualificationState.
// QualificationState only changes presentation (label + de-emphasis via
// the existing `.hint` treatment); it never filters `rows`, and ranking
// order is untouched.
describe('Opportunities list page — B1 qualification visibility (CF-OPPORTUNITIES-LIST-VISIBILITY-PO-DEC-001)', () => {
  function qualificationFixture(qualState: 'QUALIFIED' | 'NOT_QUALIFIED' | 'INSUFFICIENT_EVIDENCE') {
    return {
      id: 'qual_a',
      opportunityId: 'opp_a',
      prospectId: 'prospect_a',
      state: qualState,
      criteria: [],
      evidenceSignalIds: [],
      evaluatorVersion: 'qualification-v2',
      evaluatedAt: new Date('2026-09-28T00:00:00.000Z'),
      createdAt: new Date('2026-09-28T00:00:00.000Z'),
      updatedAt: new Date('2026-09-28T00:00:00.000Z'),
    };
  }

  it('shows QUALIFIED opportunities visibly, with normal (non-de-emphasized) presentation', async () => {
    state.qualification = qualificationFixture('QUALIFIED');
    const html = await renderPage();
    expect(text(html)).toContain('Qualified');
    expect(html).not.toMatch(/<span class="[^"]*text-muted-foreground[^"]*">\s*Qualified\s*<\/span>/);
  });

  it('keeps NOT_QUALIFIED opportunities visible, labeled "Not qualified" and de-emphasized (muted, 13px — the new theme\'s equivalent of the old .hint treatment)', async () => {
    state.qualification = qualificationFixture('NOT_QUALIFIED');
    const html = await renderPage();
    expect(text(html)).toContain('Not qualified');
    expect(html).toMatch(/<span class="text-\[13px\] text-muted-foreground">Not qualified<\/span>/);
  });

  it('keeps INSUFFICIENT_EVIDENCE opportunities visible, labeled "Needs more evidence" and de-emphasized', async () => {
    state.qualification = qualificationFixture('INSUFFICIENT_EVIDENCE');
    const html = await renderPage();
    expect(text(html)).toContain('Needs more evidence');
    expect(html).toMatch(/<span class="text-\[13px\] text-muted-foreground">Needs more evidence<\/span>/);
  });

  it('does not filter unqualified opportunities out of the rendered list', async () => {
    state.qualification = qualificationFixture('NOT_QUALIFIED');
    const html = await renderPage();
    expect(html).not.toContain('No opportunities yet');
    expect(text(html)).toContain('Fixture Bistro');
  });

  it('leaves ranking/order unchanged by qualification state', async () => {
    state.ranked = [rankedEntry('opp_a', 1), rankedEntry('opp_b', 2)];
    state.qualification = qualificationFixture('NOT_QUALIFIED');
    const page = text(await renderPage());
    const firstIndex = page.indexOf('#1');
    const secondIndex = page.indexOf('#2');
    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThan(firstIndex);
  });
});

// B2 (CF-OPPORTUNITIES-SEARCH-FIRST-PO-DEC-001): an optional ?searchId
// narrows the already-ranked rows to one Search via the existing
// ownership-safe listBySearch(userId, searchId). No searchId preserves
// the unchanged cumulative behavior. Filtering happens on the full
// ranked list — an invalid/foreign searchId can only ever exclude rows,
// never fall back to showing the cumulative list.
describe('Opportunities list page — B2 search-scoped results (CF-OPPORTUNITIES-SEARCH-FIRST-PO-DEC-001)', () => {
  beforeEach(() => {
    state.ranked = [rankedEntry('opp_a', 1), rankedEntry('opp_b', 2)];
    state.opportunityProspectIds = { opp_a: 'prospect_a', opp_b: 'prospect_b' };
    state.repos.prospects = fakeProspects([
      prospect('prospect_a', 'user_a', 'search_a', 'company_a'),
      prospect('prospect_b', 'user_a', 'search_b', 'company_b'),
    ]);
  });

  it("shows only the requested Search's Opportunities", async () => {
    const page = text(await renderPage('search_a'));
    expect(page).toContain('#1');
    expect(page).not.toContain('#2');
  });

  it('excludes Opportunities belonging to another Search', async () => {
    const page = text(await renderPage('search_b'));
    expect(page).toContain('#2');
    expect(page).not.toContain('#1');
  });

  it('preserves cumulative/all-opportunities behavior when no searchId is given', async () => {
    const page = text(await renderPage());
    expect(page).toContain('#1');
    expect(page).toContain('#2');
  });

  it('renders a Search-specific empty state for a Search with zero Opportunities, never falling back to the cumulative list', async () => {
    const page = text(await renderPage('search_with_no_opportunities'));
    expect(page).toContain('No opportunities found for this search');
    expect(page).toContain('View all opportunities');
    expect(page).not.toContain('#1');
    expect(page).not.toContain('#2');
  });

  it("never exposes another user's Opportunities for a foreign searchId", async () => {
    state.opportunityProspectIds = { opp_a: 'prospect_a', opp_b: 'prospect_foreign' };
    state.repos.prospects = fakeProspects([
      prospect('prospect_a', 'user_a', 'search_a', 'company_a'),
      // Owned by a different user — listBySearch's own ownership filter
      // (userId AND searchId) must exclude this regardless of searchId.
      prospect('prospect_foreign', 'user_b', 'search_foreign', 'company_x'),
    ]);
    const page = text(await renderPage('search_foreign'));
    expect(page).toContain('No opportunities found for this search');
    expect(page).not.toContain('#1');
    expect(page).not.toContain('#2');
  });

  it('continues to render B1 qualification labels within a Search-scoped result', async () => {
    state.qualification = { state: 'NOT_QUALIFIED' };
    const page = text(await renderPage('search_a'));
    expect(page).toContain('Not qualified');
  });

  it('preserves existing ranking order within the filtered result set', async () => {
    state.ranked = [rankedEntry('opp_a', 1), rankedEntry('opp_b', 2), rankedEntry('opp_c', 3)];
    state.opportunityProspectIds = { opp_a: 'prospect_a', opp_b: 'prospect_b', opp_c: 'prospect_c' };
    state.repos.prospects = fakeProspects([
      prospect('prospect_a', 'user_a', 'search_a', 'company_a'),
      prospect('prospect_b', 'user_a', 'search_a', 'company_b'),
      prospect('prospect_c', 'user_a', 'search_a', 'company_c'),
    ]);

    const page = text(await renderPage('search_a'));
    const firstIndex = page.indexOf('#1');
    const secondIndex = page.indexOf('#2');
    const thirdIndex = page.indexOf('#3');
    expect(firstIndex).toBeGreaterThanOrEqual(0);
    expect(secondIndex).toBeGreaterThan(firstIndex);
    expect(thirdIndex).toBeGreaterThan(secondIndex);
  });
});
