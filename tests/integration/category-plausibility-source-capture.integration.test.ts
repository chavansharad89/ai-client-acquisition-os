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
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// A11-P1 M-2 source capture — real PostgreSQL (migration 0028).
// -----------------------------------------------------------------------
// Authorization A11-P1-IMPL-AUTH-001 §6: T3 (traceability), T4 (hash
// integrity, re-checked by the database itself), T5 (multiple sources)
// and T6 (persist, then retrieve through the repository). The provider
// is a fake that reports its supplied documents the same way the real
// providers do (onSourceDocumentsSupplied); no live provider is called.
// -----------------------------------------------------------------------

const suite = suiteDatabase('source_capture');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const FETCHED_AT = new Date('2026-09-26T10:00:00.000Z');
const SUPPLIED = [
  { label: 'Homepage', url: 'https://acme.example.com', text: 'Acme serves  restaurants — “exact” text ✓' },
  { label: 'About', url: 'https://acme.example.com/about', text: 'A second, distinct model-seen document.' },
];

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

const capturingProvider: ResearchProvider = {
  async research(input) {
    await input.onSourceDocumentsSupplied?.({
      documents: SUPPLIED,
      fetchedAt: FETCHED_AT,
      extractionMethod: 'test-extraction',
    });
    return sampleResearch();
  },
};

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
  const email = `capture.${label}.${randomUUID().replace(/-/g, '')}@example.com`;
  await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [userId, email]);
  const minted = await mintUserSession(createPgIdentityRepository(db.client), { id: userId, email });
  return { userId, token: minted.token };
}

async function researchedDetermination(token: string, userId: string) {
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

  const researchDeps: ResearchDeps = { ...base, provider: capturingProvider };
  await runResearch(researchDeps, token, { prospectId });

  const determination = await base.categoryPlausibility.getCurrentByProspectId(userId, prospectId);
  return { base, searchId: running.id, prospectId, determination: determination! };
}

describe('category_plausibility_source_documents (migration 0028)', () => {
  it('T6/T5/T3: persists every model-seen document and reads it back exactly, traceable to its determination', async () => {
    const a = await createUserAndSession('a');
    const { base, searchId, prospectId, determination } = await researchedDetermination(a.token, a.userId);

    const docs = await base.categoryPlausibility.listSourceDocumentsByDeterminationId(a.userId, determination.id);

    expect(docs.map((doc) => doc.documentIndex)).toEqual([0, 1]);
    expect(docs.map((doc) => doc.text)).toEqual(SUPPLIED.map((doc) => doc.text)); // byte-exact round trip
    expect(docs.map((doc) => doc.label)).toEqual(SUPPLIED.map((doc) => doc.label));
    expect(docs.map((doc) => doc.url)).toEqual(SUPPLIED.map((doc) => doc.url));
    for (const doc of docs) {
      expect(doc).toMatchObject({
        determinationId: determination.id,
        searchId,
        prospectId,
        captureKind: MODEL_SEEN_SOURCE,
        extractionMethod: 'test-extraction',
      });
      expect(doc.fetchedAt.getTime()).toBe(FETCHED_AT.getTime());
    }
  });

  it('T4: the stored hash is the SHA-256 of the stored text — checked by the database, not only by the writer', async () => {
    const a = await createUserAndSession('a');
    const { base, determination } = await researchedDetermination(a.token, a.userId);
    const { db } = suite.require();

    const { rows } = await db.client.query(
      `SELECT content_sha256, encode(sha256(convert_to(source_text, 'UTF8')), 'hex') AS recomputed
         FROM category_plausibility_source_documents WHERE determination_id = $1`,
      [determination.id],
    );
    expect(rows).toHaveLength(SUPPLIED.length);
    for (const row of rows as { content_sha256: string; recomputed: string }[]) {
      expect(row.content_sha256).toBe(row.recomputed);
    }
    const docs = await base.categoryPlausibility.listSourceDocumentsByDeterminationId(a.userId, determination.id);
    expect(docs.map((doc) => doc.contentSha256)).toEqual(SUPPLIED.map((doc) => sourceContentSha256(doc.text)));
  });

  it("reads are ownership-scoped: another user sees none of this determination's sources", async () => {
    const a = await createUserAndSession('a');
    const b = await createUserAndSession('b');
    const { base, determination } = await researchedDetermination(a.token, a.userId);

    expect(await base.categoryPlausibility.listSourceDocumentsByDeterminationId(b.userId, determination.id)).toEqual(
      [],
    );
  });

  it('the schema admits only MODEL_SEEN_SOURCE captures and one row per (determination, position)', async () => {
    const a = await createUserAndSession('a');
    const { determination } = await researchedDetermination(a.token, a.userId);
    const { db } = suite.require();
    const insert = (kind: string, index: number) =>
      db.client.query(
        `INSERT INTO category_plausibility_source_documents
           (id, determination_id, document_index, source_label, source_url, source_text,
            content_sha256, capture_kind, extraction_method, fetched_at)
         VALUES (gen_random_uuid()::text, $1, $2, 'x', 'https://x.example.com', 'x', $3, $4, 'm', now())`,
        [determination.id, index, sourceContentSha256('x'), kind],
      );

    await expect(insert('FACILITATOR_SNAPSHOT', 9)).rejects.toThrow();
    await expect(insert(MODEL_SEEN_SOURCE, 0)).rejects.toThrow(); // position 0 already captured
  });
});
