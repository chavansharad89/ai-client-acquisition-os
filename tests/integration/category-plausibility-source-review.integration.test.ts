import { randomUUID } from 'node:crypto';

import {
  createPgCompanyRepository,
  createPgProspectRepository,
  runDiscovery,
  type DiscoveryDeps,
} from '@acos/core-discovery';
import { createPgIdentityRepository, mintUserSession } from '@acos/core-identity';
import {
  createPgCategoryPlausibilityRepository,
  createPgResearchSignalRepository,
  MODEL_SEEN_SOURCE,
  runResearch,
  sourceContentSha256,
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
import { createPgServiceProfileRepository, createServiceProfile } from '@acos/core-service-profile';
import { NextRequest } from 'next/server';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// Q-1 reviewer read path — real route handler + real PostgreSQL.
// -----------------------------------------------------------------------
// GET /api/category-plausibility/determinations/:id/source-documents,
// invoked with real NextRequest objects the same way
// client-finder-web.integration.test.ts invokes the feedback route.
// Seeding uses a fake ResearchProvider that reports its supplied
// documents (as source-capture.integration.test.ts does); no live
// provider, no external fetch.
// -----------------------------------------------------------------------

const suite = suiteDatabase('source_review');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const FETCHED_AT = new Date('2026-09-26T10:00:00.000Z');
const SUPPLIED = [
  { label: 'Homepage', url: 'https://acme.example.com', text: 'Acme serves  restaurants — “exact” text ✓' },
  { label: 'About', url: 'https://acme.example.com/about', text: '  leading/trailing\twhitespace kept\n\n' },
];

function baseEnv(dbUrl: string): void {
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = dbUrl;
  // loadEnv() validates the whole schema — see client-finder-web.integration.test.ts.
  process.env.RAZORPAY_KEY_ID = 'rzp_test_sr';
  process.env.RAZORPAY_KEY_SECRET = 'rzp_secret_sr';
  process.env.RAZORPAY_WEBHOOK_SECRET = 'whsec_sr';
  process.env.META_PIXEL_ID = '1234567890';
  process.env.META_CAPI_ACCESS_TOKEN = 'meta_token_sr';
  process.env.ANTHROPIC_API_KEY = 'sk-ant-sr-not-real';
  process.env.DOWNLOAD_GRANT_SECRET = 'd'.repeat(48);
  process.env.GOOGLE_PLACES_API_KEY = 'places-key-sr-not-real';
}

type GetRoute = (r: NextRequest, ctx: { params: { id: string } }) => Promise<Response>;

let closePool: (() => Promise<void>) | null = null;

afterEach(async () => {
  if (closePool) {
    await closePool().catch(() => undefined);
    closePool = null;
  }
});

async function freshRoute(): Promise<GetRoute> {
  baseEnv(suite.require().db.url);
  vi.resetModules();
  const route = await import('../../apps/web/app/api/category-plausibility/determinations/[id]/source-documents/route');
  const db = await import('../../apps/web/src/server/db');
  closePool = db.closeClientFinderPool;
  return route.GET as GetRoute;
}

function get(route: GetRoute, determinationId: string, token?: string): Promise<Response> {
  const headers: Record<string, string> = {};
  if (token) headers.cookie = `acos_session=${token}`;
  const request = new NextRequest(
    `http://localhost/api/category-plausibility/determinations/${determinationId}/source-documents`,
    { method: 'GET', headers },
  );
  return route(request, { params: { id: determinationId } });
}

function sampleResearch(): LeadResearch {
  const unknownField = { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 };
  return {
    companySummary: unknownField,
    businessModel: unknownField,
    targetCustomers: unknownField,
    categoryPlausibility: [],
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 40,
    gaps: [],
  } as unknown as LeadResearch;
}

function provider(documents: typeof SUPPLIED): ResearchProvider {
  return {
    async research(input) {
      if (documents.length > 0) {
        await input.onSourceDocumentsSupplied?.({ documents, fetchedAt: FETCHED_AT, extractionMethod: 'test-extraction' });
      }
      return sampleResearch();
    },
  };
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
    categoryPlausibility: createPgCategoryPlausibilityRepository(db.client),
  };
}

async function createUserAndSession(label: string): Promise<{ userId: string; token: string }> {
  const { db } = suite.require();
  const userId = `user_${label}_${randomUUID().replace(/-/g, '')}`;
  const email = `review.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
  await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [userId, email]);
  const minted = await mintUserSession(createPgIdentityRepository(db.client), { id: userId, email });
  return { userId, token: minted.token };
}

async function researchedDetermination(token: string, userId: string, documents = SUPPLIED) {
  const base = repos();
  const d: SearchDeps & DiscoveryDeps = {
    ...base,
    provider: {
      async discover() {
        return [{ name: 'Acme Co', website: 'https://acme.example.com' }];
      },
    },
  };
  const profile = await createServiceProfile(d, token, {
    service: 'Website development',
    targetCustomer: 'Restaurants; Cafes',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['JOB_POST'],
    keywords: ['website'],
    rationale: 'They lack a working website.',
  });
  const created = await createSearch(d, token, { serviceProfileId: profile.id });
  const running = (await transitionSearch(d, token, created.id, { status: 'RUNNING' }))!;
  const { prospects } = await runDiscovery(d, token, { searchId: running.id });
  const prospectId = prospects[0]!.id;

  const researchDeps: ResearchDeps = { ...base, provider: provider(documents) };
  await runResearch(researchDeps, token, { prospectId });

  const determination = (await base.categoryPlausibility.getCurrentByProspectId(userId, prospectId))!;
  return { searchId: running.id, prospectId, determinationId: determination.id };
}

interface ReviewDocument {
  id: string;
  determinationId: string;
  searchId: string;
  prospectId: string;
  documentIndex: number;
  label: string;
  url: string;
  text: string;
  contentSha256: string;
  captureKind: string;
  extractionMethod: string;
  fetchedAt: string;
}

/** Full-row snapshot of every table the read path could conceivably touch. */
async function snapshot(): Promise<unknown> {
  const { db } = suite.require();
  const tables = [
    'category_plausibility_source_documents',
    'category_plausibility_determinations',
    'searches',
    'prospects',
    'opportunities',
  ];
  const out: Record<string, unknown> = {};
  for (const table of tables) {
    out[table] = (await db.client.query(`SELECT to_jsonb(t) AS row FROM ${table} t ORDER BY t.id`)).rows;
  }
  return out;
}

describe('GET /api/category-plausibility/determinations/:id/source-documents (Q-1)', () => {
  it('Q1-T1/T2/T3: the authenticated owner retrieves the exact persisted source text with full traceability', async () => {
    const a = await createUserAndSession('a');
    const { searchId, prospectId, determinationId } = await researchedDetermination(a.token, a.userId);
    const route = await freshRoute();

    const res = await get(route, determinationId, a.token);
    expect(res.status).toBe(200);
    const docs = (await res.json()) as ReviewDocument[];

    // T1
    expect(docs).toHaveLength(SUPPLIED.length);

    // T2 — value-for-value against both the supplied text and the persisted column, and byte-for-byte as UTF-8
    const { db } = suite.require();
    const persisted = (
      await db.client.query(
        `SELECT source_text FROM category_plausibility_source_documents WHERE determination_id = $1 ORDER BY document_index`,
        [determinationId],
      )
    ).rows.map((row: { source_text: string }) => row.source_text);
    expect(docs.map((doc) => doc.text)).toEqual(persisted);
    expect(docs.map((doc) => doc.text)).toEqual(SUPPLIED.map((doc) => doc.text));
    docs.forEach((doc, i) => {
      expect(Buffer.from(doc.text, 'utf8').equals(Buffer.from(SUPPLIED[i]!.text, 'utf8'))).toBe(true);
      expect(doc.contentSha256).toBe(sourceContentSha256(SUPPLIED[i]!.text));
    });

    // T3
    docs.forEach((doc, i) => {
      expect(doc).toMatchObject({
        determinationId,
        searchId,
        prospectId,
        documentIndex: i,
        label: SUPPLIED[i]!.label,
        url: SUPPLIED[i]!.url,
        captureKind: MODEL_SEEN_SOURCE,
        extractionMethod: 'test-extraction',
        fetchedAt: FETCHED_AT.toISOString(),
      });
    });
  });

  it('Q1-T4: an unauthenticated request is rejected (401) with no source content', async () => {
    const a = await createUserAndSession('a');
    const { determinationId } = await researchedDetermination(a.token, a.userId);
    const route = await freshRoute();

    for (const token of [undefined, 'not-a-real-session']) {
      const res = await get(route, determinationId, token);
      expect(res.status).toBe(401);
      const body = await res.text();
      expect(body).not.toContain('Acme serves');
      expect(body).not.toContain('acme.example.com');
    }
  });

  it("Q1-T5: another authenticated user cannot retrieve the owner's documents, even knowing the determination id", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const { determinationId } = await researchedDetermination(a.token, a.userId);
    const route = await freshRoute();

    const res = await get(route, determinationId, b.token);
    expect(res.status).toBe(200);
    const body = await res.text();
    expect(JSON.parse(body)).toEqual([]);
    expect(body).not.toContain('Acme serves');
    expect(body).not.toContain('acme.example.com');
  });

  it('Q1-T6: retrieval performs no network fetch (no provider, no re-fetch of sourceUrl)', async () => {
    const a = await createUserAndSession('a');
    const { determinationId } = await researchedDetermination(a.token, a.userId);
    const route = await freshRoute();

    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    try {
      const res = await get(route, determinationId, a.token);
      expect(res.status).toBe(200);
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      fetchSpy.mockRestore();
    }
  });

  it('Q1-T7: retrieval is read-only — no source-document, determination, Search, Prospect or Opportunity row changes', async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const { determinationId } = await researchedDetermination(a.token, a.userId);
    const route = await freshRoute();

    const before = await snapshot();
    await get(route, determinationId, a.token);
    await get(route, determinationId, b.token);
    await get(route, determinationId);
    expect(await snapshot()).toEqual(before);
  });

  it('Q1-T8: a missing determination, or one with no captured sources, returns [] (existing not-found-for-unowned-or-missing convention)', async () => {
    const a = await createUserAndSession('a');
    const { determinationId: empty } = await researchedDetermination(a.token, a.userId, []);
    const route = await freshRoute();

    const missing = await get(route, `det_${randomUUID()}`, a.token);
    expect(missing.status).toBe(200);
    expect(await missing.json()).toEqual([]);

    const none = await get(route, empty, a.token);
    expect(none.status).toBe(200);
    expect(await none.json()).toEqual([]);
  });
});
