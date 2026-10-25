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
  createPgResearchSignalRepository,
  detectPlacesEntityReality,
  saveDeterministicSignals,
} from '@acos/core-research';
import { createPgSearchRepository, createSearch, transitionSearch, type SearchDeps } from '@acos/core-search';
import { createPgServiceProfileRepository, createServiceProfile, type ServiceProfileInput } from '@acos/core-service-profile';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { Pool } from 'pg';

import { suiteDatabase } from './support/suiteDb';

// Migration 0049 (research_signal_google_places_status_kind) — Phase 8
// (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D11/D16), real
// PostgreSQL. Proves: the research_signals.kind CHECK constraint accepts
// GOOGLE_PLACES_STATUS, a round-tripped row keeps its field marker and
// classification, and the constraint still refuses an unrecognized kind
// (regression: the widened CHECK did not accidentally become
// unconstrained). Mirrors research-signal-cache-index.integration.test.ts's
// setup conventions.

const suite = suiteDatabase('google-places-status-signal');
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

function discoveryDeps(
  base: ReturnType<typeof repos>,
  candidates: readonly DiscoveryCandidate[],
): SearchDeps & DiscoveryDeps {
  return { ...base, provider: discoveryProvider(candidates) };
}

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return { candidates, actualQuery: 'test query', provider: 'TEST_PROVIDER' };
    },
  };
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `places.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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

describe('research_signals.kind CHECK constraint (migration 0049)', () => {
  it('accepts GOOGLE_PLACES_STATUS and round-trips the signal exactly', async () => {
    const a = await createUserAndSession('round-trip');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Closed Co',
      website: 'https://closed-roundtrip.example.com',
      businessStatus: 'CLOSED_PERMANENTLY',
    });

    const now = new Date();
    const entry = detectPlacesEntityReality('CLOSED_PERMANENTLY', now)!;
    await saveDeterministicSignals(base.signals, prospectId, [entry], now);

    const active = await base.signals.listByProspect(a.userId, prospectId);
    const placesSignal = active.find((row) => row.kind === 'GOOGLE_PLACES_STATUS');
    expect(placesSignal).toBeDefined();
    expect(placesSignal!.field).toBe(entry.field);
    expect(placesSignal!.classification).toBe('OBSERVED');
    expect(placesSignal!.confidence).toBe(100);
    expect(placesSignal!.observedAt).toEqual(now);
  });

  it('still refuses an unrecognized kind — the widened CHECK did not become unconstrained', async () => {
    const { db } = suite.require();
    const a = await createUserAndSession('kind-regression');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Regression Co',
      website: 'https://regression.example.com',
    });

    await expect(
      db.client.query(
        `INSERT INTO research_signals
           (id, prospect_id, field, kind, classification, signal, confidence, basis, observed_at, created_at, updated_at)
         VALUES (gen_random_uuid()::text, $1, 'test.field', 'NOT_A_REAL_KIND', 'OBSERVED', 'x', 100, NULL, now(), now(), now())`,
        [prospectId],
      ),
    ).rejects.toThrow();
  });

  it('CLOSED_TEMPORARILY persists alongside the pre-existing kinds without disturbing them', async () => {
    const a = await createUserAndSession('coexist');
    const base = repos();
    const { prospectId } = await createProspectFor(base, a.token, {
      name: 'Paused Co',
      website: 'https://paused-coexist.example.com',
      businessStatus: 'CLOSED_TEMPORARILY',
    });

    const now = new Date();
    const entry = detectPlacesEntityReality('CLOSED_TEMPORARILY', now)!;
    await saveDeterministicSignals(base.signals, prospectId, [entry], now);

    const active = await base.signals.listByProspect(a.userId, prospectId);
    expect(active.some((row) => row.kind === 'GOOGLE_PLACES_STATUS')).toBe(true);
  });
});
