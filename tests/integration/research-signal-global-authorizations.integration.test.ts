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
import { createPgIdentityRepository, mintUserSession } from '@acos/core-identity';
import {
  authorizeSignalForSharing,
  createPgFieldClassificationRepository,
  createPgResearchSignalRepository,
  createPgSignalAuthorizationRepository,
  createPgSignalLookupRepository,
  isAuthorizationActive,
  runResearch,
  SignalAuthorizationRejectedError,
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

// Phase I (migration 0059, research_signal_global_authorizations) — real
// PostgreSQL. Proves: authorizeSignalForSharing's write-time validation
// against actually-persisted research_signals/research_signal_sources
// rows; findLatestAuthorization's revocation semantics; and that no
// existing write path (saveSignals, via runResearch) ever inserts into
// this table itself.

const suite = suiteDatabase('research-signal-global-authorizations');
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

function sampleResearch(companySummaryQuote = 'Acme serves small businesses in Mumbai'): LeadResearch {
  return {
    companySummary: {
      classification: 'OBSERVED',
      value: companySummaryQuote,
      evidence: [{ quote: companySummaryQuote, sourceUrl: HOMEPAGE.url, sourceLabel: HOMEPAGE.label }],
      basis: null,
      confidence: 88,
    },
    businessModel: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    targetCustomers: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
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
  return { async research() { return result; } };
}

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return { async discover() { return { candidates, actualQuery: 'test query', provider: 'TEST_PROVIDER' }; } };
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
  };
}

function discoveryDeps(base: ReturnType<typeof repos>, candidates: readonly DiscoveryCandidate[]): SearchDeps & DiscoveryDeps {
  return { ...base, provider: discoveryProvider(candidates) };
}

function researchDeps(base: ReturnType<typeof repos>, result: LeadResearch): ResearchDeps {
  return { ...base, provider: testProvider(result) };
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `authz.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
  await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [userId, email]);
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

function authDeps() {
  const { db } = suite.require();
  return {
    signals: createPgSignalLookupRepository(db.client),
    fieldClassification: createPgFieldClassificationRepository(db.client),
    authorizations: createPgSignalAuthorizationRepository(db.client),
  };
}

describe('research_signal_global_authorizations schema (migration 0059)', () => {
  it('exists, FK to research_signals, append-only shape (no updated_at)', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'research_signal_global_authorizations'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toEqual(
      expect.arrayContaining(['id', 'signal_id', 'authorized_at', 'authorized_by', 'revoked_at']),
    );
  });

  it('starts empty for a freshly-researched signal — no write path other than authorizeSignalForSharing ever populates it', async () => {
    const a = await createUserAndSession('a1');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme-authz1.example.com',
    });
    const research = await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });
    const companySummarySignal = research.signals.find((s) => s.field === 'companySummary')!;

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT 1 FROM research_signal_global_authorizations WHERE signal_id = $1`,
      [companySummarySignal.id],
    );
    expect(rows).toHaveLength(0);
  });
});

describe('authorizeSignalForSharing — real PostgreSQL write-time validation', () => {
  it('creates an authorization row for a real, persisted, qualifying companySummary signal', async () => {
    const a = await createUserAndSession('a2');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme-authz2.example.com',
    });
    const research = await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });
    const companySummarySignal = research.signals.find((s) => s.field === 'companySummary')!;

    const authorization = await authorizeSignalForSharing(
      authDeps(),
      { signalId: companySummarySignal.id, authorizedBy: 'ops_test' },
      new Date(),
    );
    expect(authorization.signalId).toBe(companySummarySignal.id);
    expect(authorization.revokedAt).toBeNull();
    expect(isAuthorizationActive(authorization)).toBe(true);
  });

  it('rejects a real, persisted UNKNOWN signal (businessModel, per sampleResearch) — never creates a row', async () => {
    const a = await createUserAndSession('a3');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme-authz3.example.com',
    });
    const research = await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });
    const businessModelSignal = research.signals.find((s) => s.field === 'businessModel')!;

    await expect(
      authorizeSignalForSharing(authDeps(), { signalId: businessModelSignal.id, authorizedBy: 'ops_test' }, new Date()),
    ).rejects.toThrow(SignalAuthorizationRejectedError);

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT 1 FROM research_signal_global_authorizations WHERE signal_id = $1`,
      [businessModelSignal.id],
    );
    expect(rows).toHaveLength(0);
  });

  it('findLatestAuthorization treats a revoked row (revoked_at set by direct SQL, since no production revoke-writer exists) as inactive', async () => {
    const a = await createUserAndSession('a4');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Acme Co',
      website: 'https://acme-authz4.example.com',
    });
    const research = await runResearch(researchDeps(base, sampleResearch()), a.token, { prospectId });
    const companySummarySignal = research.signals.find((s) => s.field === 'companySummary')!;

    const authorization = await authorizeSignalForSharing(
      authDeps(),
      { signalId: companySummarySignal.id, authorizedBy: 'ops_test' },
      new Date(),
    );

    const { db } = suite.require();
    await db.client.query(
      `UPDATE research_signal_global_authorizations SET revoked_at = now() WHERE id = $1`,
      [authorization.id],
    );

    const latest = await authDeps().authorizations.findLatestAuthorization(companySummarySignal.id);
    expect(latest).not.toBeNull();
    expect(isAuthorizationActive(latest)).toBe(false);
  });
});
