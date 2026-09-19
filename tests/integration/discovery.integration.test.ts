import { randomUUID } from 'node:crypto';

import {
  createGooglePlacesDiscoveryProvider,
  createPgCompanyRepository,
  createPgProspectRepository,
  runDiscovery,
  DiscoveryInvalidSearchStateError,
  DiscoverySearchNotFoundError,
  type DiscoveryCandidate,
  type DiscoveryDeps,
  type DiscoveryProvider,
  type ExternalDiscoveryClient,
} from '@acos/core-discovery';
import {
  createPgIdentityRepository,
  mintUserSession,
  UnauthenticatedError,
} from '@acos/core-identity';
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

// Discovery ownership + dedup + state gating — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0015's schema plus @acos/core-discovery's repository
// enforce, at the database itself: cross-user isolation, the
// UNIQUE(search_id, company_id) and UNIQUE(user_id, normalized_domain)
// dedup constraints (R-08/PFR-11/DEC-005/G-02), and that discovery only
// runs against a RUNNING Search. Mirrors
// tests/integration/search.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('discovery');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function testProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return candidates;
    },
  };
}

function deps(provider: DiscoveryProvider): SearchDeps & DiscoveryDeps {
  const { db } = suite.require();
  return {
    identity: createPgIdentityRepository(db.client),
    profiles: createPgServiceProfileRepository(db.client),
    searches: createPgSearchRepository(db.client),
    companies: createPgCompanyRepository(db.client),
    prospects: createPgProspectRepository(db.client),
    provider,
  };
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `discovery.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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

async function createRunningSearch(
  d: SearchDeps,
  token: string,
  overrides: Partial<ServiceProfileInput> = {},
): Promise<StoredSearch> {
  const profile = await createServiceProfile(d, token, sampleProfileInput(overrides));
  const created = await createSearch(d, token, { serviceProfileId: profile.id });
  const running = await transitionSearch(d, token, created.id, { status: 'RUNNING' });
  return running!;
}

describe('Discovery schema (migration 0015)', () => {
  it('the search_id/company_id dedup constraint exists in the real database', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'prospects' AND indexname = 'prospects_search_id_company_id_key'`,
    );
    expect(rows).toHaveLength(1);
  });

  it('the per-user normalized_domain identity constraint exists in the real database', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT indexname FROM pg_indexes
        WHERE tablename = 'companies' AND indexname = 'companies_user_id_normalized_domain_key'`,
    );
    expect(rows).toHaveLength(1);
  });
});

describe('Discovery execution', () => {
  it('an authenticated user discovers businesses against their own RUNNING Search', async () => {
    const a = await createUserAndSession('a');
    const d = deps(
      testProvider([
        { name: 'Acme Co', website: 'https://Acme.example.com/' },
        { name: 'Beta LLC', website: 'http://www.beta.example.com' },
      ]),
    );
    const search = await createRunningSearch(d, a.token);

    const result = await runDiscovery(d, a.token, { searchId: search.id });

    expect(result.companies).toHaveLength(2);
    expect(result.prospects).toHaveLength(2);
    expect(result.skipped).toBe(0);
    for (const company of result.companies) expect(company.userId).toBe(a.userId);
    for (const prospect of result.prospects) {
      expect(prospect.userId).toBe(a.userId);
      expect(prospect.searchId).toBe(search.id);
      expect(prospect.status).toBe('DISCOVERED');
    }
  });

  it('rejects an unauthenticated request before touching the repository', async () => {
    const d = deps(testProvider([]));
    await expect(runDiscovery(d, null, { searchId: 'irrelevant' })).rejects.toBeInstanceOf(
      UnauthenticatedError,
    );
  });

  it('a different authenticated user cannot discover against the Search — treated as not found', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const d = deps(testProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]));
    const search = await createRunningSearch(d, a.token);

    await expect(runDiscovery(d, b.token, { searchId: search.id })).rejects.toBeInstanceOf(
      DiscoverySearchNotFoundError,
    );
  });

  it('the production GooglePlacesDiscoveryProvider persists real candidates through the same path (Phase 18)', async () => {
    // Proves Search -> createGooglePlacesDiscoveryProvider -> Discovery
    // service -> Discovery persistence, with a deterministic fake
    // ExternalDiscoveryClient standing in for the real Google Places API
    // (Phase 18 scope doc §26.B) — no live network call.
    const fakeClient: ExternalDiscoveryClient = {
      async searchText(query) {
        expect(query).toContain('Website development');
        expect(query).toContain('Restaurants');
        expect(query).toContain('Mumbai');
        return [
          { name: 'Acme Co', websiteUri: 'https://acme.example.com' },
          { name: null, websiteUri: null }, // malformed — dropped by normalizeCandidate downstream
        ];
      },
    };

    const a = await createUserAndSession('places');
    const d = deps(createGooglePlacesDiscoveryProvider(fakeClient));
    const search = await createRunningSearch(d, a.token);

    const result = await runDiscovery(d, a.token, { searchId: search.id });

    expect(result.companies).toHaveLength(1);
    expect(result.companies[0]?.normalizedDomain).toBe('acme.example.com');
    expect(result.skipped).toBe(1);
    expect(result.prospects[0]?.userId).toBe(a.userId);
  });

  it('discovery cannot execute against a Search that has not been claimed (still PENDING)', async () => {
    const a = await createUserAndSession('a');
    const d = deps(testProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]));
    const profile = await createServiceProfile(d, a.token, sampleProfileInput());
    const pending = await createSearch(d, a.token, { serviceProfileId: profile.id });

    await expect(runDiscovery(d, a.token, { searchId: pending.id })).rejects.toBeInstanceOf(
      DiscoveryInvalidSearchStateError,
    );
  });

  it('duplicate discovery within the same Search does not create duplicate Company or Prospect rows', async () => {
    const a = await createUserAndSession('a');
    const d = deps(testProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]));
    const search = await createRunningSearch(d, a.token);

    await runDiscovery(d, a.token, { searchId: search.id });
    await runDiscovery(d, a.token, { searchId: search.id });

    const { db } = suite.require();
    const companyCount = await db.client.query(
      `SELECT count(*)::int AS n FROM companies WHERE user_id = $1`,
      [a.userId],
    );
    const prospectCount = await db.client.query(
      `SELECT count(*)::int AS n FROM prospects WHERE search_id = $1`,
      [search.id],
    );
    expect(companyCount.rows[0].n).toBe(1);
    expect(prospectCount.rows[0].n).toBe(1);
  });

  it('the same business rediscovered in a later Search reuses the same Company row', async () => {
    const a = await createUserAndSession('a');
    const d = deps(testProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]));

    const firstSearch = await createRunningSearch(d, a.token);
    const firstResult = await runDiscovery(d, a.token, { searchId: firstSearch.id });

    const secondSearch = await createRunningSearch(d, a.token, { service: 'SEO audits' });
    const secondResult = await runDiscovery(d, a.token, { searchId: secondSearch.id });

    expect(secondResult.companies[0]?.id).toBe(firstResult.companies[0]?.id);
    expect(secondResult.prospects[0]?.id).not.toBe(firstResult.prospects[0]?.id);

    const { db } = suite.require();
    const companyCount = await db.client.query(
      `SELECT count(*)::int AS n FROM companies WHERE user_id = $1`,
      [a.userId],
    );
    expect(companyCount.rows[0].n).toBe(1);
  });

  it('invalid or incomplete provider candidates are skipped, not persisted', async () => {
    const a = await createUserAndSession('a');
    const d = deps(
      testProvider([
        { name: 'Acme Co', website: 'https://acme.example.com' },
        { name: '', website: 'https://noname.example.com' },
        { name: 'No Website Co', website: null },
      ]),
    );
    const search = await createRunningSearch(d, a.token);

    const result = await runDiscovery(d, a.token, { searchId: search.id });

    expect(result.companies).toHaveLength(1);
    expect(result.skipped).toBe(2);
  });
});
