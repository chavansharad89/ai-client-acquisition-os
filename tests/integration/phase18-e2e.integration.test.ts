import { randomUUID } from 'node:crypto';

import { createPgAiUsageEventRepository, toNewAiUsageEventInput } from '@acos/core-ai-usage';
import {
  createGooglePlacesDiscoveryProvider,
  createPgCompanyRepository,
  createPgProspectRepository,
  type ExternalDiscoveryClient,
} from '@acos/core-discovery';
import { createPgIdentityRepository, mintUserSession } from '@acos/core-identity';
import { createPgOpportunityRepository } from '@acos/core-opportunity';
import {
  createAnthropicResearchModel,
  createAnthropicResearchProvider,
  createHttpSourceDocumentProvider,
  createPgResearchSignalRepository,
} from '@acos/core-research';
import { createPgSearchRepository, createSearch, type SearchDeps } from '@acos/core-search';
import {
  createPgServiceProfileRepository,
  createServiceProfile,
  type ServiceProfileInput,
} from '@acos/core-service-profile';
import { claimAndProcessNextSearch, type SearchWorkerDeps } from '@acos/worker/searchWorker';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// Phase 18 primary acceptance test (scope doc §31): proves
//   Search -> real GooglePlacesDiscoveryProvider -> Discovery persistence
//   -> real HttpSourceDocumentProvider -> real AnthropicResearchProvider
//   -> Research persistence -> R-29 usage event -> Opportunity
// end to end against real PostgreSQL, with deterministic fakes standing
// in ONLY at the external-vendor boundary (Google Places HTTP client,
// homepage fetch, Anthropic SDK client) — no live network call anywhere
// in this suite. Mirrors search-worker.integration.test.ts's own
// "end-to-end pipeline" test, which proves the same shape with the
// Phase 17 trivial fakes; this one proves it with the Phase 18
// production provider code.
// -----------------------------------------------------------------------

const suite = suiteDatabase('phase18_e2e');

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
    signals: createPgResearchSignalRepository(db.client),
    opportunities: createPgOpportunityRepository(db.client),
    aiUsageEvents: createPgAiUsageEventRepository(db.client),
  };
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `phase18-e2e.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
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

async function createPendingSearch(base: ReturnType<typeof repos>, token: string) {
  const profile = await createServiceProfile(base, token, sampleProfileInput());
  return createSearch(base as unknown as SearchDeps, token, { serviceProfileId: profile.id });
}

const ARTICLE_HTML = `
<!doctype html>
<html><head><title>Acme Robotics</title></head>
<body><article>
  <h1>Acme Robotics</h1>
  <p>Acme Robotics builds autonomous warehouse robots for mid-size logistics
  companies across North America. Founded in 2019, the company has shipped
  over four hundred units to more than sixty customers, focusing on
  picking, packing and inventory reconciliation workflows that previously
  required manual labor. Our engineering team is based in Austin, Texas.</p>
  <p>We are actively hiring warehouse automation engineers and a content
  marketing lead to help tell our customers' stories.</p>
</article></body></html>
`;

function unknownField() {
  return { classification: 'UNKNOWN' as const, value: null, evidence: [], basis: null, confidence: 0 };
}

/** A minimal, schema-valid LeadResearch — this suite proves plumbing, not research quality. */
function fakeAnthropicMessage(id: string) {
  return {
    id,
    stop_reason: 'end_turn',
    content: [
      {
        type: 'text',
        text: JSON.stringify({
          companySummary: unknownField(),
          businessModel: unknownField(),
          targetCustomers: unknownField(),
          visibleProblems: [],
          growthOpportunities: [],
          aiOpportunities: [],
          websiteIssues: [],
          contentOpportunities: [],
          automationOpportunities: [],
          recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
          confidence: 40,
          gaps: [],
        }),
      },
    ],
    usage: { input_tokens: 500, output_tokens: 200 },
  };
}

function buildDeps(
  base: ReturnType<typeof repos>,
  domain: string,
  workerId = `worker_${randomUUID()}`,
): SearchWorkerDeps {
  const discoveryClient: ExternalDiscoveryClient = {
    async searchText() {
      return [{ name: 'Acme Robotics', websiteUri: `https://${domain}` }];
    },
  };

  const sourceDocuments = createHttpSourceDocumentProvider({
    fetchImpl: (async (url: string | URL) => {
      expect(String(url)).toBe(`https://${domain}`);
      return new Response(ARTICLE_HTML, { status: 200, headers: { 'content-type': 'text/html' } });
    }) as typeof fetch,
  });

  const anthropicMessageId = `msg_${randomUUID()}`;
  const fakeAnthropicClient = {
    messages: {
      stream: () => ({ finalMessage: async () => fakeAnthropicMessage(anthropicMessageId) }),
    },
  } as never;
  const model = createAnthropicResearchModel({ client: fakeAnthropicClient });

  return {
    searches: base.searches,
    companies: base.companies,
    prospects: base.prospects,
    discoveryProvider: createGooglePlacesDiscoveryProvider(discoveryClient),
    signals: base.signals,
    researchProvider: (userId: string) =>
      createAnthropicResearchProvider({
        model,
        sourceDocuments,
        onUsage: (usage, requestKind, prospectId) =>
          base.aiUsageEvents
            .recordEvent(userId, prospectId, toNewAiUsageEventInput(usage, requestKind), new Date())
            .then(() => undefined),
      }),
    opportunities: base.opportunities,
    workerId,
  };
}

describe('Phase 18 end-to-end pipeline (real Postgres, fake external vendors)', () => {
  it('Search -> real Discovery -> real source acquisition -> real Research -> R-29 usage -> Opportunity, all persisted', async () => {
    const a = await createUserAndSession('e2e');
    const base = repos();
    const search = await createPendingSearch(base, a.token);
    const domain = `acme-e2e-${randomUUID()}.example.com`;

    const outcome = await claimAndProcessNextSearch(buildDeps(base, domain));

    expect(outcome).toMatchObject({
      outcome: 'completed',
      searchId: search.id,
      prospectsProcessed: 1,
    });

    const finalSearch = await base.searches.getById(a.userId, search.id);
    expect(finalSearch!.status).toBe('COMPLETE');

    const { db } = suite.require();

    const { rows: companyRows } = await db.client.query(
      `SELECT user_id FROM companies WHERE normalized_domain = $1`,
      [domain],
    );
    expect(companyRows).toHaveLength(1);
    expect(companyRows[0].user_id).toBe(a.userId);

    const { rows: signalRows } = await db.client.query(
      `SELECT rs.id FROM research_signals rs
         JOIN prospects p ON p.id = rs.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1 AND rs.superseded_at IS NULL`,
      [domain],
    );
    expect(signalRows.length).toBeGreaterThan(0);

    const { rows: usageRows } = await db.client.query(
      `SELECT aue.provider, aue.user_id FROM ai_usage_events aue
         JOIN prospects p ON p.id = aue.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1`,
      [domain],
    );
    expect(usageRows).toHaveLength(1);
    expect(usageRows[0].provider).toBe('anthropic');
    expect(usageRows[0].user_id).toBe(a.userId);

    const { rows: opportunityRows } = await db.client.query(
      `SELECT o.user_id FROM opportunities o
         JOIN prospects p ON p.id = o.prospect_id
         JOIN companies c ON c.id = p.company_id
        WHERE c.normalized_domain = $1`,
      [domain],
    );
    expect(opportunityRows).toHaveLength(1);
    expect(opportunityRows[0].user_id).toBe(a.userId);
  });
});
