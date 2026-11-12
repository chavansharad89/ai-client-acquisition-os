import { randomUUID } from 'node:crypto';

import {
  createGooglePlacesDiscoveryProvider,
  createPgCompanyRepository,
  createPgEntityRepository,
  createPgProspectRepository,
  runDiscovery,
  DiscoveryInvalidSearchStateError,
  DiscoverySearchNotFoundError,
  type DiscoveryCandidate,
  type DiscoveryDeps,
  type DiscoveryProvider,
  type DiscoveryResult,
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
  type NewSearchServiceProfileInput,
} from '@acos/core-service-profile';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';

import { suiteDatabase } from './support/suiteDb';

// Discovery ownership + dedup + state gating — real PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0015's schema plus @acos/core-discovery's repository
// enforce, at the database itself: cross-user isolation, the
// UNIQUE(search_id, company_id) and UNIQUE(user_id, normalized_domain)
// dedup constraints (R-08/PFR-11/DEC-005/G-02), and that discovery only
// runs against a RUNNING Search. Mirrors
// tests/integration/search.integration.test.ts.
//
// Global Entity Architecture: EntityRepository needs a real `pg.Pool`
// (it pins one connection per transaction via `pool.connect()`), not the
// single `pg.Client` the suite harness exposes as `db.client` — a
// separate Pool connected to the SAME suite database is created here,
// mirroring tests/integration/lead-unlock.integration.test.ts's own
// pattern for `createPgLeadUnlockRepository`'s identical need.
// -----------------------------------------------------------------------

const suite = suiteDatabase('discovery');
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

function testProvider(
  candidates: readonly DiscoveryCandidate[],
  options: { provider?: string; actualQuery?: string } = {},
): DiscoveryProvider {
  return {
    async discover() {
      return {
        candidates,
        actualQuery: options.actualQuery ?? 'test query',
        provider: options.provider ?? 'TEST_PROVIDER',
      } satisfies DiscoveryResult;
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
    entities: createPgEntityRepository(entityPool!),
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

function sampleProfileInput(
  overrides: Partial<NewSearchServiceProfileInput> = {},
): NewSearchServiceProfileInput {
  return {
    service: 'Web & Software Development',
    geography: 'Mumbai',
    ...overrides,
  };
}

async function createRunningSearch(
  d: SearchDeps,
  token: string,
  overrides: Partial<NewSearchServiceProfileInput> = {},
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
        expect(query).toContain('Web & Software Development');
        expect(query).toContain('Mumbai');
        return [
          {
            name: 'Acme Co',
            websiteUri: 'https://acme.example.com',
            businessStatus: 'OPERATIONAL',
            placeId: 'ChIJacmeintegration',
          },
          { name: null, websiteUri: null, businessStatus: null, placeId: null }, // malformed — dropped by normalizeCandidate downstream
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

    const secondSearch = await createRunningSearch(d, a.token, { service: 'Digital Marketing' });
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

    // Global Entity Architecture (C-1): "No Website Co" is no longer
    // skipped — a wholly absent website is accepted, persisted with a
    // null normalized_domain. Only the empty-name candidate is skipped.
    expect(result.companies).toHaveLength(2);
    expect(result.skipped).toBe(1);
    expect(result.companies.some((c) => c.normalizedDomain === null)).toBe(true);
  });

  it('a failed-normalization candidate is logged to discovery_attempts, never creates a DiscoveryEvent or Entity (OQ-8)', async () => {
    const a = await createUserAndSession('a');
    const d = deps(
      testProvider(
        [
          { name: '', website: 'https://noname.example.com' },
          { name: 'Bad URL Co', website: 'not a url and no dots' },
        ],
        { provider: 'TEST_PROVIDER', actualQuery: 'plumbers in Pune' },
      ),
    );
    const search = await createRunningSearch(d, a.token);

    const result = await runDiscovery(d, a.token, { searchId: search.id });
    expect(result.skipped).toBe(2);

    const { db } = suite.require();
    const attempts = await db.client.query(
      `SELECT failure_reason FROM discovery_attempts WHERE search_id = $1 ORDER BY failure_reason`,
      [search.id],
    );
    expect(attempts.rows.map((r: { failure_reason: string }) => r.failure_reason)).toEqual([
      'MISSING_NAME',
      'MISSING_WEBSITE_UNPARSEABLE',
    ]);

    const events = await db.client.query(
      `SELECT count(*)::int AS n FROM discovery_events WHERE search_id = $1`,
      [search.id],
    );
    expect(events.rows[0].n).toBe(0);
  });

  it('Place ID alone resolves an existing Entity across two separate discoveries (OQ-1)', async () => {
    const a = await createUserAndSession('a');
    const d1 = deps(
      testProvider([{ name: 'Acme Co', website: 'https://acme.example.com', placeId: 'ChIJsameplace' }]),
    );
    const firstSearch = await createRunningSearch(d1, a.token);
    const first = await runDiscovery(d1, a.token, { searchId: firstSearch.id });

    // A second discovery, same Place ID, but a DIFFERENT domain this
    // time — proves the resolver matched on Place ID alone (OQ-1), not
    // on the (unrelated) domain-based Company dedup index.
    const d2 = deps(
      testProvider([
        { name: 'Acme Co Rebranded', website: 'https://acme-new.example.com', placeId: 'ChIJsameplace' },
      ]),
    );
    const secondSearch = await createRunningSearch(d2, a.token, { service: 'Digital Marketing' });
    const second = await runDiscovery(d2, a.token, { searchId: secondSearch.id });

    expect(first.companies[0]?.entityId).not.toBeNull();
    expect(second.companies[0]?.entityId).toBe(first.companies[0]?.entityId);
    // Different domain -> NOT the same Company row, even though it IS
    // the same resolved Entity (Company dedup and Entity identity are
    // deliberately separate mechanisms).
    expect(second.companies[0]?.id).not.toBe(first.companies[0]?.id);

    const { db } = suite.require();
    const entityCount = await db.client.query(
      `SELECT count(DISTINCT entity_id)::int AS n FROM discovery_events WHERE search_id = ANY($1::text[])`,
      [[firstSearch.id, secondSearch.id]],
    );
    expect(entityCount.rows[0].n).toBe(1);
  });
});
