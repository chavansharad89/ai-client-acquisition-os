import { randomUUID } from 'node:crypto';

import {
  createPgCompanyRepository,
  createPgProspectRepository,
  runDiscovery,
  type DiscoveryCandidate,
  type DiscoveryDeps,
  type DiscoveryProvider,
} from '@acos/core-discovery';
import { createPgIdentityRepository, mintUserSession } from '@acos/core-identity';
import {
  createOpportunity,
  createPgFeedbackRepository,
  createPgOpportunityRepository,
  createPgOpportunityScoreRepository,
  getOpportunity,
  rankOpportunities,
  scoreOpportunity,
  type OpportunityDeps,
} from '@acos/core-opportunity';
import { createPgQualificationRepository } from '@acos/core-qualification';
import {
  createPgResearchSignalRepository,
  type LeadResearch,
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
import { claimAndProcessNextSearch, type SearchWorkerDeps } from '@acos/worker/searchWorker';
import { NextRequest } from 'next/server';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { ADMIN_URL } from './support/pgIndexHarness';
import { suiteDatabase } from './support/suiteDb';

// apps/web's Client Finder MVP surface — route-handler-level wiring, real
// Postgres.
// -----------------------------------------------------------------------
// Every other integration test in this repository calls a @acos/core-*
// service function directly. That proves the function is correct; it
// does not prove a Next.js API route parses the request, reads the
// session cookie, forwards the raw token untouched, and maps the typed
// errors correctly — the same gap tests/integration/webhook-route.
// integration.test.ts exists to close for the payments webhook. This
// file imports the actual `apps/web/app/api/**/route.ts` modules and
// invokes their exported POST/GET with real NextRequest objects, against
// a real database.
//
// This is ENGINEERING VERIFICATION ONLY. It proves the wiring is
// correct; it says nothing about whether a real person would find the
// resulting opportunities useful or would contact the businesses shown —
// that is §9's real-user validation gate, unaddressed by this file on
// purpose (see requirement/MVP_SCOPE_BOUNDARY.md §9).
// -----------------------------------------------------------------------

const suite = suiteDatabase('client_finder_web');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function baseEnv(dbUrl: string): void {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = dbUrl;
  // loadEnv() validates the whole schema even though this app's Client
  // Finder routes read only DATABASE_URL — see webhook-route.integration
  // .test.ts's identical comment for why every var must still be present.
  process.env.RAZORPAY_KEY_ID = 'rzp_test_cf';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_cf';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_cf';
  process.env.META_PIXEL_ID = '1234567890';
  process.env.META_CAPI_ACCESS_TOKEN = 'meta_token_cf';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-cf-not-real';
  process.env.DOWNLOAD_GRANT_SECRET = 'd'.repeat(48);
  process.env.GOOGLE_PLACES_API_KEY = 'places-key-cf-not-real';
}

interface RouteModules {
  authSession: { POST: (r: NextRequest) => Promise<Response>; GET: (r: NextRequest) => Promise<Response> };
  serviceProfiles: { POST: (r: NextRequest) => Promise<Response>; GET: (r: NextRequest) => Promise<Response> };
  searches: { POST: (r: NextRequest) => Promise<Response>; GET: (r: NextRequest) => Promise<Response> };
  feedback: {
    POST: (r: NextRequest, ctx: { params: { id: string } }) => Promise<Response>;
    GET: (r: NextRequest, ctx: { params: { id: string } }) => Promise<Response>;
  };
}

async function freshRoutes(dbUrl: string): Promise<RouteModules> {
  baseEnv(dbUrl);
  vi.resetModules();
  const authSession = await import('../../apps/web/app/api/auth/session/route');
  const serviceProfiles = await import('../../apps/web/app/api/service-profiles/route');
  const searches = await import('../../apps/web/app/api/searches/route');
  const feedback = await import('../../apps/web/app/api/opportunities/[id]/feedback/route');
  const db = await import('../../apps/web/src/server/db');
  current = db.closeClientFinderPool;
  return { authSession, serviceProfiles, searches, feedback } as unknown as RouteModules;
}

let current: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (current) {
    await current().catch(() => undefined);
    current = null;
  }
});

function jsonRequest(url: string, method: string, body?: unknown, cookie?: string): NextRequest {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (cookie) headers.cookie = cookie;
  return new NextRequest(url, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function seedUser(label: string): Promise<{ userId: string; email: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `cf-web.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
  await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [
    userId,
    email,
  ]);
  const identity = createPgIdentityRepository(db.client);
  const minted = await mintUserSession(identity, { id: userId, email });
  return { userId, email, token: minted.token };
}

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
    scores: createPgOpportunityScoreRepository(db.client),
    feedback: createPgFeedbackRepository(db.client),
  };
}

function sampleProfileInput(overrides: Partial<ServiceProfileInput> = {}): ServiceProfileInput {
  return {
    service: 'Website redesign',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['WEBSITE'],
    keywords: ['redesign'],
    rationale: 'No mobile-friendly site ({signal}) — a redesign fixes it directly.',
    ...overrides,
  };
}

function discoveryProvider(candidates: readonly DiscoveryCandidate[]): DiscoveryProvider {
  return {
    async discover() {
      return candidates;
    },
  };
}

/** Direct-service seeding for an Opportunity, exactly as opportunity-feedback.integration.test.ts does — fake DiscoveryProvider, no live vendor call. */
async function createOpportunityFor(token: string) {
  const base = repos();
  const d: SearchDeps & DiscoveryDeps = {
    ...base,
    provider: discoveryProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]),
  };
  const profile = await createServiceProfile(d, token, sampleProfileInput());
  const created = await createSearch(d, token, { serviceProfileId: profile.id });
  const running = (await transitionSearch(d, token, created.id, { status: 'RUNNING' }))!;
  const result = await runDiscovery(d, token, { searchId: running.id });
  const prospectId = result.prospects[0]!.id;
  const opportunityDeps: OpportunityDeps = base;
  return createOpportunity(opportunityDeps, token, { prospectId });
}

describe('POST/GET /api/auth/session', () => {
  it('mints a session cookie for an existing user (happy path)', async () => {
    if (!suite.reachable()) {
      console.warn(`Skipped: PostgreSQL not reachable at ${ADMIN_URL}`);
      return;
    }
    const { db } = suite.require();
    const email = `cf-web.login.${randomUUID().replace(/-/g, '')}@example.com`;
    await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [
      `user_login_${randomUUID().replace(/-/g, '')}`,
      email,
    ]);

    const routes = await freshRoutes(db.url);
    const response = await routes.authSession.POST(
      jsonRequest('http://localhost/api/auth/session', 'POST', { email }),
    );
    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toMatch(/acos_session=/);
  });

  it('rejects an email with no provisioned account (404) — MVP never self-service-signs-up a caller', async () => {
    if (!suite.reachable()) return;
    const { db } = suite.require();
    const routes = await freshRoutes(db.url);
    const response = await routes.authSession.POST(
      jsonRequest('http://localhost/api/auth/session', 'POST', {
        email: `no-such-user.${randomUUID()}@example.com`,
      }),
    );
    expect(response.status).toBe(404);
  });

  it('rejects an invalid body (400)', async () => {
    if (!suite.reachable()) return;
    const { db } = suite.require();
    const routes = await freshRoutes(db.url);
    const response = await routes.authSession.POST(
      jsonRequest('http://localhost/api/auth/session', 'POST', { email: 'not-an-email' }),
    );
    expect(response.status).toBe(400);
  });
});

describe('POST /api/service-profiles', () => {
  it('creates a profile owned by the authenticated caller (happy path)', async () => {
    if (!suite.reachable()) return;
    const { db } = suite.require();
    const user = await seedUser('sp_ok');
    const routes = await freshRoutes(db.url);
    const response = await routes.serviceProfiles.POST(
      jsonRequest(
        'http://localhost/api/service-profiles',
        'POST',
        sampleProfileInput(),
        `acos_session=${user.token}`,
      ),
    );
    expect(response.status).toBe(201);
    const body = (await response.json()) as { userId: string };
    expect(body.userId).toBe(user.userId);
  });

  it('rejects an unauthenticated caller (401)', async () => {
    if (!suite.reachable()) return;
    const { db } = suite.require();
    const routes = await freshRoutes(db.url);
    const response = await routes.serviceProfiles.POST(
      jsonRequest('http://localhost/api/service-profiles', 'POST', sampleProfileInput()),
    );
    expect(response.status).toBe(401);
  });

  it('rejects invalid input (400)', async () => {
    if (!suite.reachable()) return;
    const { db } = suite.require();
    const user = await seedUser('sp_invalid');
    const routes = await freshRoutes(db.url);
    const response = await routes.serviceProfiles.POST(
      jsonRequest(
        'http://localhost/api/service-profiles',
        'POST',
        sampleProfileInput({ service: '' }),
        `acos_session=${user.token}`,
      ),
    );
    expect(response.status).toBe(400);
  });
});

describe('POST /api/searches', () => {
  it('starts a Search from the caller\'s own ServiceProfile (happy path)', async () => {
    if (!suite.reachable()) return;
    const { db } = suite.require();
    const user = await seedUser('search_ok');
    const routes = await freshRoutes(db.url);

    const profileResponse = await routes.serviceProfiles.POST(
      jsonRequest(
        'http://localhost/api/service-profiles',
        'POST',
        sampleProfileInput(),
        `acos_session=${user.token}`,
      ),
    );
    const profile = (await profileResponse.json()) as { id: string };

    const searchResponse = await routes.searches.POST(
      jsonRequest(
        'http://localhost/api/searches',
        'POST',
        { serviceProfileId: profile.id },
        `acos_session=${user.token}`,
      ),
    );
    expect(searchResponse.status).toBe(201);
    const search = (await searchResponse.json()) as { userId: string; status: string };
    expect(search.userId).toBe(user.userId);
    expect(search.status).toBe('PENDING');
  });

  it('rejects an unauthenticated caller (401)', async () => {
    if (!suite.reachable()) return;
    const { db } = suite.require();
    const routes = await freshRoutes(db.url);
    const response = await routes.searches.POST(
      jsonRequest('http://localhost/api/searches', 'POST', { serviceProfileId: 'nonexistent' }),
    );
    expect(response.status).toBe(401);
  });

  it("rejects a serviceProfileId belonging to a different user (404) — no client-supplied ownership", async () => {
    if (!suite.reachable()) return;
    const { db } = suite.require();
    const owner = await seedUser('search_owner');
    const attacker = await seedUser('search_attacker');
    const routes = await freshRoutes(db.url);

    const profileResponse = await routes.serviceProfiles.POST(
      jsonRequest(
        'http://localhost/api/service-profiles',
        'POST',
        sampleProfileInput(),
        `acos_session=${owner.token}`,
      ),
    );
    const profile = (await profileResponse.json()) as { id: string };

    const response = await routes.searches.POST(
      jsonRequest(
        'http://localhost/api/searches',
        'POST',
        { serviceProfileId: profile.id },
        `acos_session=${attacker.token}`,
      ),
    );
    expect(response.status).toBe(404);
  });

  it('rejects invalid input (400)', async () => {
    if (!suite.reachable()) return;
    const { db } = suite.require();
    const user = await seedUser('search_invalid');
    const routes = await freshRoutes(db.url);
    const response = await routes.searches.POST(
      jsonRequest('http://localhost/api/searches', 'POST', {}, `acos_session=${user.token}`),
    );
    expect(response.status).toBe(400);
  });
});

describe('POST/GET /api/opportunities/:id/feedback', () => {
  it('records useful/not-useful + reason for the caller\'s own Opportunity (happy path)', async () => {
    if (!suite.reachable()) return;
    const user = await seedUser('fb_ok');
    const { db } = suite.require();
    const opportunity = await createOpportunityFor(user.token);
    const routes = await freshRoutes(db.url);

    const response = await routes.feedback.POST(
      jsonRequest(
        `http://localhost/api/opportunities/${opportunity.id}/feedback`,
        'POST',
        { useful: true, reason: 'Real, unmet need — worth a message.' },
        `acos_session=${user.token}`,
      ),
      { params: { id: opportunity.id } },
    );
    expect(response.status).toBe(200);
    const body = (await response.json()) as { useful: boolean; userId: string };
    expect(body.useful).toBe(true);
    expect(body.userId).toBe(user.userId);
  });

  it('rejects an unauthenticated caller (401)', async () => {
    if (!suite.reachable()) return;
    const user = await seedUser('fb_unauth');
    const opportunity = await createOpportunityFor(user.token);
    const { db } = suite.require();
    const routes = await freshRoutes(db.url);

    const response = await routes.feedback.POST(
      jsonRequest(`http://localhost/api/opportunities/${opportunity.id}/feedback`, 'POST', {
        useful: true,
        reason: 'x',
      }),
      { params: { id: opportunity.id } },
    );
    expect(response.status).toBe(401);
  });

  it("rejects a different user's attempt to read or write this Opportunity's feedback (404/not-found) — cross-user isolation", async () => {
    if (!suite.reachable()) return;
    const owner = await seedUser('fb_owner');
    const attacker = await seedUser('fb_attacker');
    const opportunity = await createOpportunityFor(owner.token);
    const { db } = suite.require();
    const routes = await freshRoutes(db.url);

    const writeResponse = await routes.feedback.POST(
      jsonRequest(
        `http://localhost/api/opportunities/${opportunity.id}/feedback`,
        'POST',
        { useful: false, reason: 'trying to write another user\'s row' },
        `acos_session=${attacker.token}`,
      ),
      { params: { id: opportunity.id } },
    );
    expect(writeResponse.status).toBe(404);

    // Owner's own feedback must be unaffected by the rejected attempt.
    const ownRead = await routes.feedback.GET(
      jsonRequest(
        `http://localhost/api/opportunities/${opportunity.id}/feedback`,
        'GET',
        undefined,
        `acos_session=${owner.token}`,
      ),
      { params: { id: opportunity.id } },
    );
    expect(ownRead.status).toBe(200);
    expect(await ownRead.json()).toBeNull();
  });

  it('rejects invalid input (400)', async () => {
    if (!suite.reachable()) return;
    const user = await seedUser('fb_invalid');
    const opportunity = await createOpportunityFor(user.token);
    const { db } = suite.require();
    const routes = await freshRoutes(db.url);

    const response = await routes.feedback.POST(
      jsonRequest(
        `http://localhost/api/opportunities/${opportunity.id}/feedback`,
        'POST',
        { useful: 'yes', reason: '' },
        `acos_session=${user.token}`,
      ),
      { params: { id: opportunity.id } },
    );
    expect(response.status).toBe(400);
  });
});

describe('user-facing engineering path (ENGINEERING VERIFICATION ONLY — not real-user validation)', () => {
  it(
    'authenticated user -> creates service/search via HTTP -> worker-equivalent pipeline runs ' +
      '-> opportunity becomes available -> ranked results readable -> prospect detail readable ' +
      '-> feedback submitted via HTTP',
    async () => {
      if (!suite.reachable()) return;
      const user = await seedUser('journey');
      const { db } = suite.require();
      const routes = await freshRoutes(db.url);

      // 1. DEFINE SERVICE + 2. INITIATE SEARCH, through the real HTTP routes.
      const profileResponse = await routes.serviceProfiles.POST(
        jsonRequest(
          'http://localhost/api/service-profiles',
          'POST',
          sampleProfileInput(),
          `acos_session=${user.token}`,
        ),
      );
      expect(profileResponse.status).toBe(201);
      const profile = (await profileResponse.json()) as { id: string };

      const searchResponse = await routes.searches.POST(
        jsonRequest(
          'http://localhost/api/searches',
          'POST',
          { serviceProfileId: profile.id },
          `acos_session=${user.token}`,
        ),
      );
      expect(searchResponse.status).toBe(201);
      const search = (await searchResponse.json()) as { id: string };

      // 3. WORKER EXECUTES: this repository's real worker orchestration
      // (Phase 17/18) claims PENDING searches out-of-process. Here — as
      // every other integration test in this suite does — the pipeline
      // stages are invoked directly with a fake DiscoveryProvider, never
      // a live vendor call.
      const base = repos();
      const d: SearchDeps & DiscoveryDeps = {
        ...base,
        provider: discoveryProvider([{ name: 'Acme Co', website: 'https://acme.example.com' }]),
      };
      const running = (await transitionSearch(d, user.token, search.id, { status: 'RUNNING' }))!;
      const discovered = await runDiscovery(d, user.token, { searchId: running.id });
      const prospectId = discovered.prospects[0]!.id;

      const opportunity = await createOpportunity(base, user.token, { prospectId });
      await scoreOpportunity({ identity: base.identity, opportunities: base.opportunities, signals: base.signals, scores: base.scores }, user.token, opportunity.id);

      // 4. RESULTS: the same read the /opportunities Server Component page
      // uses (rankOpportunities + getOpportunity), proving the ranked
      // list is actually populated for this user.
      const ranked = await rankOpportunities(base, user.token);
      expect(ranked.some((entry) => entry.opportunityId === opportunity.id)).toBe(true);

      // 5. PROSPECT DETAIL: the same read the /opportunities/[id] page uses.
      const detail = await getOpportunity(base, user.token, opportunity.id);
      expect(detail.id).toBe(opportunity.id);

      // 6. FEEDBACK, through the real HTTP route.
      const feedbackResponse = await routes.feedback.POST(
        jsonRequest(
          `http://localhost/api/opportunities/${opportunity.id}/feedback`,
          'POST',
          { useful: true, reason: 'Engineering-verified path, not a real-user judgment.' },
          `acos_session=${user.token}`,
        ),
        { params: { id: opportunity.id } },
      );
      expect(feedbackResponse.status).toBe(200);
    },
  );
});

// ---- MVP composite E2E proof --------------------------------------------
// Closes the last documented MVP verification gap (see
// requirement/MVP_SCOPE_BOUNDARY.md §10): unlike the "user-facing
// engineering path" journey above — which drives Discovery by calling
// transitionSearch()+runDiscovery() directly — this test proves the same
// journey through the actual worker claim path, claimAndProcessNextSearch(),
// against a Search this test itself created via the real HTTP route, with
// Qualification supplied through workerDeps so the real pipeline exercises
// it (search-worker.integration.test.ts's own suite never supplies
// `qualifications`). TEST-ONLY: no production code changed.

function compositeProfileInput(): ServiceProfileInput {
  return {
    service: 'AI content system',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 15_000_000,
    triggers: ['WEBSITE'],
    keywords: ['content', 'writer'],
    rationale: 'They are hiring for content ({signal}) — a system delivers it without a headcount.',
  };
}

/** Deterministic fake ResearchProvider — same fixture shape as search-worker.integration.test.ts's matchingResearch(), reused locally per that file's own module-boundary convention (each integration test file defines its own fakes). One OBSERVED visibleProblems signal, matching compositeProfileInput()'s keywords, so Need Detection + Qualification's EVIDENCE_PRESENT both pass on real evidence (Phase 24 Scenario E). */
function compositeMatchingResearch(): LeadResearch {
  const source = { url: 'https://acme.test/careers', label: 'careers' };
  return {
    companySummary: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    businessModel: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    targetCustomers: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    visibleProblems: [
      {
        classification: 'OBSERVED',
        value: 'hiring a content writer',
        evidence: [
          { quote: 'hiring a content writer', sourceUrl: source.url, sourceLabel: source.label },
        ],
        basis: null,
        confidence: 88,
      },
    ],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 55,
    gaps: [],
  };
}

function compositeResearchProvider(result: LeadResearch): ResearchProvider {
  return {
    async research() {
      return result;
    },
  };
}

describe(
  'MVP composite E2E proof (ENGINEERING VERIFICATION ONLY — not real-user validation)',
  () => {
    it(
      'authenticated user -> service profile -> HTTP-created Search -> real worker claim ' +
        '(claimAndProcessNextSearch) -> Discovery -> Research -> evidence-backed Opportunity -> ' +
        'Qualification -> Scoring -> Ranking -> detail read -> HTTP feedback, as one continuous journey',
      async () => {
        if (!suite.reachable()) return;
        const user = await seedUser('composite');
        const { db } = suite.require();
        const routes = await freshRoutes(db.url);
        const base = repos();

        // This suite's database is shared across every test in this file
        // (suiteDatabase() is per-suite, not per-test — see suiteDb.ts), and
        // cleanup() only deletes explicitly-tracked rows. An earlier test
        // above (`POST /api/searches` "happy path") creates a Search via
        // HTTP and never transitions it, leaving it PENDING. Since
        // claimAndProcessNextSearch() claims whatever is next in the global
        // queue, it must be empty before this test creates its own Search —
        // otherwise it could claim that unrelated leftover row instead of
        // proving the claim against the Search this test creates below.
        // Draining is safe: every Search here was itself created against a
        // fake, non-live provider, and an empty DiscoveryProvider leaves no
        // Prospect/Opportunity trace.
        const drainDeps: SearchWorkerDeps = {
          searches: base.searches,
          companies: base.companies,
          prospects: base.prospects,
          discoveryProvider: discoveryProvider([]),
          signals: base.signals,
          researchProvider: () => compositeResearchProvider(compositeMatchingResearch()),
          opportunities: base.opportunities,
          workerId: `worker_composite_drain_${randomUUID()}`,
        };
        for (
          let drained = await claimAndProcessNextSearch(drainDeps);
          drained.outcome !== 'empty';
          drained = await claimAndProcessNextSearch(drainDeps)
        ) {
          // consume leftover PENDING Searches from earlier tests
        }

        // 1. DEFINE SERVICE, through the real HTTP route.
        const profileResponse = await routes.serviceProfiles.POST(
          jsonRequest(
            'http://localhost/api/service-profiles',
            'POST',
            compositeProfileInput(),
            `acos_session=${user.token}`,
          ),
        );
        expect(profileResponse.status).toBe(201);
        const profile = (await profileResponse.json()) as { id: string };

        // 2. HTTP POST /api/searches — the real route handler, never
        // createSearch() called directly. Captures the persisted Search id
        // and verifies its initial state.
        const searchResponse = await routes.searches.POST(
          jsonRequest(
            'http://localhost/api/searches',
            'POST',
            { serviceProfileId: profile.id },
            `acos_session=${user.token}`,
          ),
        );
        expect(searchResponse.status).toBe(201);
        const search = (await searchResponse.json()) as {
          id: string;
          userId: string;
          status: string;
        };
        expect(search.userId).toBe(user.userId);
        expect(search.status).toBe('PENDING');

        // 3. REAL WORKER CLAIM PATH: claimAndProcessNextSearch(), never a
        // manual transitionSearch()+runDiscovery() call — the same worker
        // harness convention as search-worker.integration.test.ts, but with
        // `qualifications` supplied so the real pipeline exercises
        // Qualification end to end.
        const qualifications = createPgQualificationRepository(db.client);
        const domain = `composite-${randomUUID()}.example.com`;
        const workerDeps: SearchWorkerDeps = {
          searches: base.searches,
          companies: base.companies,
          prospects: base.prospects,
          discoveryProvider: discoveryProvider([
            { name: 'Composite Co', website: `https://${domain}` },
          ]),
          signals: base.signals,
          researchProvider: () => compositeResearchProvider(compositeMatchingResearch()),
          opportunities: base.opportunities,
          qualifications,
          workerId: `worker_composite_${randomUUID()}`,
        };

        const outcome = await claimAndProcessNextSearch(workerDeps);
        expect(outcome).toMatchObject({
          outcome: 'completed',
          searchId: search.id,
          prospectsProcessed: 1,
        });

        const finalSearch = await base.searches.getById(user.userId, search.id);
        expect(finalSearch!.status).toBe('COMPLETE');

        // 4/5. DISCOVERY -> RESEARCH: real persisted rows under the Search
        // owner, with OBSERVED evidence (Phase 24 Scenario E contract).
        const { rows: prospectRows } = await db.client.query(
          `SELECT p.id FROM prospects p JOIN companies c ON c.id = p.company_id
            WHERE c.normalized_domain = $1 AND p.user_id = $2`,
          [domain, user.userId],
        );
        expect(prospectRows).toHaveLength(1);
        const prospectId = prospectRows[0].id as string;

        const signals = await base.signals.listByProspect(user.userId, prospectId);
        expect(signals.length).toBeGreaterThan(0);
        expect(signals.some((s) => s.classification === 'OBSERVED')).toBe(true);

        // 6. OPPORTUNITY + QUALIFICATION: created and evaluated by the real
        // worker pipeline itself (not invoked directly by this test).
        const opportunity = await base.opportunities.findByProspectId(user.userId, prospectId);
        expect(opportunity).not.toBeNull();
        expect(opportunity!.needDetected).toBe(true);

        const qualification = await qualifications.getByOpportunityId(
          user.userId,
          opportunity!.id,
        );
        expect(qualification).not.toBeNull();
        expect(qualification!.state).toBe('QUALIFIED');

        // 7. SCORING: the existing scoreOpportunity() — deliberately not
        // part of the worker pipeline (Phase 17 scope lock), so this test
        // reaches it the same way the "user-facing engineering path" test
        // above does.
        await scoreOpportunity(
          {
            identity: base.identity,
            opportunities: base.opportunities,
            signals: base.signals,
            scores: base.scores,
          },
          user.token,
          opportunity!.id,
        );

        // 8. RANKING: the existing rankOpportunities().
        const ranked = await rankOpportunities(base, user.token);
        expect(ranked.some((entry) => entry.opportunityId === opportunity!.id)).toBe(true);

        // 9. DETAIL: the existing getOpportunity() — the same read the
        // /opportunities/[id] page uses.
        const detail = await getOpportunity(base, user.token, opportunity!.id);
        expect(detail.id).toBe(opportunity!.id);
        expect(detail.needDetected).toBe(true);

        // 10. FEEDBACK, through the real HTTP route — never recordFeedback()
        // called directly.
        const feedbackResponse = await routes.feedback.POST(
          jsonRequest(
            `http://localhost/api/opportunities/${opportunity!.id}/feedback`,
            'POST',
            { useful: true, reason: 'Composite MVP proof — evidence-backed and qualified.' },
            `acos_session=${user.token}`,
          ),
          { params: { id: opportunity!.id } },
        );
        expect(feedbackResponse.status).toBe(200);
        const feedbackBody = (await feedbackResponse.json()) as {
          useful: boolean;
          userId: string;
        };
        expect(feedbackBody.useful).toBe(true);
        expect(feedbackBody.userId).toBe(user.userId);
      },
      30_000,
    );
  },
);
