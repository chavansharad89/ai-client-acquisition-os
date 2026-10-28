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
  createOpportunity,
  createPgOpportunityRepository,
  createPgOpportunityScoreRepository,
  OpportunityNotFoundError,
  recordAiEnrichmentForOwner,
  type OpportunityDeps,
} from '@acos/core-opportunity';
import { createPgResearchSignalRepository } from '@acos/core-research';
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
import { Pool } from 'pg';

import { suiteDatabase } from './support/suiteDb';

// Opportunity AI enrichment provenance (Phase 6, migration 0047) — real
// PostgreSQL.
// -----------------------------------------------------------------------
// Proves migration 0047's schema (default, CHECK constraints) plus
// @acos/core-opportunity's recordAiEnrichmentForOwner() end to end:
// ownership (scoped the same way updateStaleness already is), the
// DETERMINISTIC_ONLY default at creation, and reclassify-in-place on a
// second call — never a duplicate row. Mirrors
// tests/integration/opportunity-staleness.integration.test.ts.
// -----------------------------------------------------------------------

const suite = suiteDatabase('opportunity_ai_enrichment');
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
    opportunities: createPgOpportunityRepository(db.client),
    scores: createPgOpportunityScoreRepository(db.client),
  };
}

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return { candidates, actualQuery: 'test query', provider: 'TEST_PROVIDER' };
    },
  };
}

function discoveryDeps(
  base: ReturnType<typeof repos>,
  candidates: readonly DiscoveryCandidate[],
): SearchDeps & DiscoveryDeps {
  return { ...base, provider: discoveryProvider(candidates) };
}

function opportunityDeps(base: ReturnType<typeof repos>): OpportunityDeps {
  return base;
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `opportunity-ai-enrichment.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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
    service: 'AI & Automation',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 15_000_000,
    triggers: ['WEBSITE'],
    keywords: ['content', 'writer'],
    rationale: 'They are hiring for content ({signal}) — a system delivers it without a headcount.',
    ...overrides,
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

describe('opportunities.ai_enrichment (migration 0047)', () => {
  it('defaults to DETERMINISTIC_ONLY with a null reason at creation', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);

    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    expect(opportunity.aiEnrichment).toBe('DETERMINISTIC_ONLY');
    expect(opportunity.aiEnrichmentReason).toBeNull();

    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT ai_enrichment, ai_enrichment_reason FROM opportunities WHERE id = $1`,
      [opportunity.id],
    );
    expect((rows[0] as { ai_enrichment: string }).ai_enrichment).toBe('DETERMINISTIC_ONLY');
    expect((rows[0] as { ai_enrichment_reason: string | null }).ai_enrichment_reason).toBeNull();
  });

  it('enforces the AI_ENRICHED/DETERMINISTIC_ONLY check constraint', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const { db } = suite.require();
    await expect(
      db.client.query(`UPDATE opportunities SET ai_enrichment = 'BOGUS' WHERE id = $1`, [
        opportunity.id,
      ]),
    ).rejects.toThrow(/opportunities_ai_enrichment_check/);
  });

  it('enforces the NOT_ESCALATED/ESCALATION_FAILED/PROVIDER_EXHAUSTED reason check constraint', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const { db } = suite.require();
    await expect(
      db.client.query(`UPDATE opportunities SET ai_enrichment_reason = 'BOGUS' WHERE id = $1`, [
        opportunity.id,
      ]),
    ).rejects.toThrow(/opportunities_ai_enrichment_reason_check/);
  });

  it('allows a null reason (AI_ENRICHED) — the reason check constraint never rejects NULL', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const { db } = suite.require();
    await expect(
      db.client.query(
        `UPDATE opportunities SET ai_enrichment = 'AI_ENRICHED', ai_enrichment_reason = NULL WHERE id = $1`,
        [opportunity.id],
      ),
    ).resolves.toBeDefined();
  });
});

describe('recordAiEnrichmentForOwner', () => {
  it('records AI_ENRICHED with a null reason, end to end against real Postgres', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const updated = await recordAiEnrichmentForOwner(
      opportunityDeps(base),
      a.userId,
      opportunity.id,
      'AI_ENRICHED',
      null,
    );

    expect(updated.aiEnrichment).toBe('AI_ENRICHED');
    expect(updated.aiEnrichmentReason).toBeNull();
  });

  it('reclassifies an existing Opportunity in place on a second call — never a duplicate row', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await recordAiEnrichmentForOwner(
      opportunityDeps(base),
      a.userId,
      opportunity.id,
      'DETERMINISTIC_ONLY',
      'PROVIDER_EXHAUSTED',
    );
    const reclassified = await recordAiEnrichmentForOwner(
      opportunityDeps(base),
      a.userId,
      opportunity.id,
      'AI_ENRICHED',
      null,
    );

    expect(reclassified.id).toBe(opportunity.id);
    expect(reclassified.aiEnrichment).toBe('AI_ENRICHED');
    expect(reclassified.aiEnrichmentReason).toBeNull();

    const { db } = suite.require();
    const { rows } = await db.client.query(`SELECT count(*) FROM opportunities WHERE id = $1`, [
      opportunity.id,
    ]);
    expect(Number((rows[0] as { count: string }).count)).toBe(1);
  });

  it('does not mutate `state`, `offer`, or `staleness`', async () => {
    const a = await createUserAndSession('a');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    const updated = await recordAiEnrichmentForOwner(
      opportunityDeps(base),
      a.userId,
      opportunity.id,
      'AI_ENRICHED',
      null,
    );

    expect(updated.state).toBe(opportunity.state);
    expect(updated.offer).toEqual(opportunity.offer);
    expect(updated.staleness).toBe(opportunity.staleness);
  });

  it("a different authenticated user cannot record provenance on another user's Opportunity — treated as not found", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const base = repos();
    const { prospectId } = await createProspect(base, a.token);
    const opportunity = await createOpportunity(opportunityDeps(base), a.token, { prospectId });

    await expect(
      recordAiEnrichmentForOwner(opportunityDeps(base), b.userId, opportunity.id, 'AI_ENRICHED', null),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);

    const { db } = suite.require();
    const { rows } = await db.client.query(`SELECT ai_enrichment FROM opportunities WHERE id = $1`, [
      opportunity.id,
    ]);
    expect((rows[0] as { ai_enrichment: string }).ai_enrichment).toBe('DETERMINISTIC_ONLY');
  });

  it('an unknown opportunityId is rejected', async () => {
    const a = await createUserAndSession('a');
    const base = repos();

    await expect(
      recordAiEnrichmentForOwner(opportunityDeps(base), a.userId, 'does-not-exist', 'AI_ENRICHED', null),
    ).rejects.toBeInstanceOf(OpportunityNotFoundError);
  });
});
