import { createHash } from 'node:crypto';

import type { SqlExecutor } from '@acos/core-entitlements';
import { describe, expect, it } from 'vitest';

import { createAnthropicResearchProvider } from './anthropicResearchProvider';
import {
  createPgCategoryPlausibilityRepository,
  sourceContentSha256,
} from './categoryPlausibilityPgRepository';
import { MODEL_SEEN_SOURCE, type CapturedSourceDocumentInput } from './categoryPlausibilityRepository';
import { ResearchProviderError } from './errors';
import { createFallbackResearchProvider } from './fallbackResearchProvider';
import type { SuppliedSourceDocuments } from './provider';
import type { ModelResult, ResearchModel } from './researcher';
import type { LeadResearch } from './schema';
import {
  createHttpSourceDocumentProvider,
  HTTP_HOMEPAGE_EXTRACTION_METHOD,
  type SourceDocumentProvider,
} from './sourceDocumentProvider';

// A11-P1 M-2 source capture (authorization A11-P1-IMPL-AUTH-001, §6).
// No live network, provider or database: fetch, model and SqlExecutor are
// all injected. The Postgres round-trip (T6) is proven in
// tests/integration/category-plausibility-source-capture.integration.test.ts.

const unknownField = () => ({
  classification: 'UNKNOWN' as const,
  value: null,
  evidence: [],
  basis: null,
  confidence: 0,
});

function sampleLeadResearch(): LeadResearch {
  return {
    companySummary: unknownField(),
    businessModel: unknownField(),
    targetCustomers: unknownField(),
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

/** A fake model that records the prompt it was actually sent. */
function recordingModel(): { model: ResearchModel; prompts: string[] } {
  const prompts: string[] = [];
  const model: ResearchModel = async (request) => {
    prompts.push(request.messages[0]!.content);
    return { kind: 'json', value: sampleLeadResearch() } satisfies ModelResult;
  };
  return { model, prompts };
}

/** The document bodies exactly as rendered into the prompt by buildUserMessage(). */
function documentBodiesInPrompt(prompt: string): string[] {
  return [...prompt.matchAll(/--- DOCUMENT \d+ ---\nLabel: [^\n]*\nURL: [^\n]*\n\n([^\n]*)\n/g)].map(
    (match) => match[1]!,
  );
}

function fixedSources(docs: readonly { label: string; url: string; text: string }[]): SourceDocumentProvider {
  return {
    async fetchSourceDocuments() {
      return docs;
    },
  };
}

const INPUT = {
  prospectId: 'prospect_1',
  companyId: 'company_1',
  companyName: 'Acme Robotics',
  normalizedDomain: 'acme.example.com',
};

describe('T1 — exactness: the captured text is the text the model received', () => {
  it('captures, byte for byte, the document text rendered into the model prompt', async () => {
    const text = 'Acme Robotics builds autonomous warehouse robots. '.repeat(6).trim();
    const { model, prompts } = recordingModel();
    const captures: SuppliedSourceDocuments[] = [];

    const provider = createAnthropicResearchProvider({
      model,
      sourceDocuments: fixedSources([{ label: 'Homepage', url: 'https://acme.example.com', text }]),
    });
    await provider.research({ ...INPUT, onSourceDocumentsSupplied: (s) => void captures.push(s) });

    expect(captures).toHaveLength(1);
    const captured = captures[0]!.documents[0]!.text;
    expect(documentBodiesInPrompt(prompts[0]!)).toEqual([captured]);
    expect(Buffer.from(captured, 'utf8').equals(Buffer.from(text, 'utf8'))).toBe(true);
  });

  it('captures the post-parse value: researchInputSchema trims, so the capture is trimmed too', async () => {
    const raw = `   ${'Padded source text that the schema will trim. '.repeat(5)}   `;
    const { model, prompts } = recordingModel();
    const captures: SuppliedSourceDocuments[] = [];

    const provider = createAnthropicResearchProvider({
      model,
      sourceDocuments: fixedSources([{ label: ' Homepage ', url: 'https://acme.example.com', text: raw }]),
    });
    await provider.research({ ...INPUT, onSourceDocumentsSupplied: (s) => void captures.push(s) });

    const captured = captures[0]!.documents[0]!;
    expect(captured.text).toBe(raw.trim());
    expect(captured.text).not.toBe(raw);
    expect(captured.label).toBe('Homepage');
    expect(documentBodiesInPrompt(prompts[0]!)).toEqual([captured.text]);
  });
});

describe('T2 — transformation boundary: extracted text, never raw HTML or a re-extraction', () => {
  const ARTICLE_HTML = `<!doctype html><html><head><title>Acme</title>
    <script>window.tracking = "<not visible>";</script></head>
    <body><article><h1>Acme Robotics</h1>
    <p>Acme Robotics   builds autonomous
       warehouse robots for mid-size logistics companies across North America.
       Founded in 2019, the company has shipped over four hundred units to more
       than sixty customers, focusing on picking, packing and inventory
       reconciliation workflows that previously required manual labor.</p>
    </article></body></html>`;

  it('persists the Readability/whitespace-collapsed provider input, declared with its extraction method', async () => {
    let fetches = 0;
    const fetchImpl = (async () => {
      fetches += 1;
      return new Response(ARTICLE_HTML, { status: 200, headers: { 'content-type': 'text/html' } });
    }) as typeof fetch;
    const { model, prompts } = recordingModel();
    const captures: SuppliedSourceDocuments[] = [];

    const provider = createAnthropicResearchProvider({
      model,
      sourceDocuments: createHttpSourceDocumentProvider({ fetchImpl }),
    });
    await provider.research({ ...INPUT, onSourceDocumentsSupplied: (s) => void captures.push(s) });

    const capture = captures[0]!;
    const captured = capture.documents[0]!.text;
    expect(fetches).toBe(1); // captured from the single fetch, never re-fetched
    expect(capture.extractionMethod).toBe(HTTP_HOMEPAGE_EXTRACTION_METHOD);
    expect(documentBodiesInPrompt(prompts[0]!)).toEqual([captured]);
    expect(captured).not.toContain('<');
    expect(captured).not.toContain('window.tracking');
    expect(captured).not.toMatch(/\s{2,}/);
    expect(captured).toContain('Acme Robotics builds autonomous warehouse robots');
  });

  it("records 'UNDECLARED' rather than guessing when a provider declares no extraction method", async () => {
    const captures: SuppliedSourceDocuments[] = [];
    const provider = createAnthropicResearchProvider({
      model: recordingModel().model,
      sourceDocuments: fixedSources([{ label: 'Homepage', url: 'https://acme.example.com', text: 'x'.repeat(300) }]),
    });
    await provider.research({ ...INPUT, onSourceDocumentsSupplied: (s) => void captures.push(s) });

    expect(captures[0]!.extractionMethod).toBe('UNDECLARED');
    expect(captures[0]!.fetchedAt).toBeInstanceOf(Date);
  });

  it('fallback chain: every attempt reports identical documents; the last call is the returning attempt', async () => {
    const text = 'Fallback source text seen by both attempts. '.repeat(6).trim();
    const secondary = recordingModel();
    const captures: SuppliedSourceDocuments[] = [];

    const provider = createFallbackResearchProvider({
      sourceDocuments: fixedSources([{ label: 'Homepage', url: 'https://acme.example.com', text }]),
      attempts: [
        {
          provider: 'primary',
          model: async () => {
            throw new ResearchProviderError('authentication failed', 401, false);
          },
        },
        { provider: 'secondary', model: secondary.model },
      ],
    });
    await provider.research({ ...INPUT, onSourceDocumentsSupplied: (s) => void captures.push(s) });

    expect(captures).toHaveLength(2);
    expect(captures[0]!.documents).toEqual(captures[1]!.documents);
    expect(captures[0]!.fetchedAt).toBe(captures[1]!.fetchedAt); // one fetch for the whole chain
    expect(documentBodiesInPrompt(secondary.prompts[0]!)).toEqual([captures[1]!.documents[0]!.text]);
  });
});

describe('T4 — hash integrity', () => {
  it('is lower-case hex SHA-256 of the exact UTF-8 text', () => {
    expect(sourceContentSha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    const text = 'Café — naïve “quotes” ✓';
    expect(sourceContentSha256(text)).toBe(createHash('sha256').update(Buffer.from(text, 'utf8')).digest('hex'));
  });

  it('is sensitive to any change, including whitespace', () => {
    expect(sourceContentSha256('a b')).not.toBe(sourceContentSha256('a  b'));
    expect(sourceContentSha256('a b')).not.toBe(sourceContentSha256(' a b'));
  });
});

/** Records every query; answers INSERT...RETURNING / SELECT with the rows supplied. */
function recordingSql(respond: (sql: string, params: readonly unknown[]) => unknown[] = () => []) {
  const calls: { sql: string; params: readonly unknown[] }[] = [];
  const sql: SqlExecutor = {
    async query(text, params = []) {
      calls.push({ sql: text, params });
      const rows = respond(text, params);
      return { rows, rowCount: rows.length };
    },
  };
  return { sql, calls };
}

const DETERMINATION_ROW = {
  id: 'det_1',
  search_id: 'search_1',
  prospect_id: 'prospect_1',
  target_customer: 'Restaurants',
  target_segments: ['Restaurants'],
  aggregate_result: 'UNKNOWN',
  segment_results: [],
  observed_at: new Date('2026-09-26T00:00:00.000Z'),
  superseded_at: null,
};

const DETERMINATION_INPUT = {
  searchId: 'search_1',
  prospectId: 'prospect_1',
  targetCustomer: 'Restaurants',
  targetSegments: ['Restaurants'],
  aggregateResult: 'UNKNOWN' as const,
  segmentResults: [],
};

describe('pg repository — M-2 write/read mapping (recorded SQL; real DB in the integration suite)', () => {
  const fetchedAt = new Date('2026-09-26T00:00:00.000Z');
  const docs: CapturedSourceDocumentInput[] = [
    { label: 'Homepage', url: 'https://a.example.com', text: 'first  exact text', fetchedAt, extractionMethod: 'm' },
    { label: 'About', url: 'https://a.example.com/about', text: 'second exact text', fetchedAt, extractionMethod: 'm' },
  ];

  it('T1/T4/T5: writes each document once, text untouched, hash of that same text, in supplied order, one statement', async () => {
    const { sql, calls } = recordingSql(() => [DETERMINATION_ROW]);
    const repo = createPgCategoryPlausibilityRepository(sql);

    const saved = await repo.save(DETERMINATION_INPUT, fetchedAt, docs);

    expect(saved.id).toBe('det_1');
    expect(calls).toHaveLength(1);
    const { sql: text, params } = calls[0]!;
    expect(text).toContain('INSERT INTO category_plausibility_determinations');
    expect(text).toContain('INSERT INTO category_plausibility_source_documents');
    expect(text).toContain('WITH ORDINALITY');
    expect(params[7]).toEqual(['Homepage', 'About']);
    expect(params[8]).toEqual(['https://a.example.com', 'https://a.example.com/about']);
    expect(params[9]).toEqual(['first  exact text', 'second exact text']); // double space preserved
    expect(params[10]).toEqual(docs.map((d) => sourceContentSha256(d.text)));
    expect(params[13]).toBe(MODEL_SEEN_SOURCE);
  });

  it('T7: with no source documents, the pre-existing single INSERT is issued unchanged', async () => {
    const { sql, calls } = recordingSql(() => [DETERMINATION_ROW]);
    const repo = createPgCategoryPlausibilityRepository(sql);

    await repo.save(DETERMINATION_INPUT, fetchedAt);

    expect(calls).toHaveLength(1);
    expect(calls[0]!.sql).not.toContain('category_plausibility_source_documents');
    expect(calls[0]!.params).toHaveLength(7);
  });

  it('T3/T6: reads back ownership-scoped, ordered, with Search/Prospect traceability from the determination', async () => {
    const { sql, calls } = recordingSql(() => [
      {
        id: 'src_1',
        determination_id: 'det_1',
        search_id: 'search_1',
        prospect_id: 'prospect_1',
        document_index: 0,
        source_label: 'Homepage',
        source_url: 'https://a.example.com',
        source_text: 'first  exact text',
        content_sha256: sourceContentSha256('first  exact text'),
        capture_kind: 'MODEL_SEEN_SOURCE',
        extraction_method: 'm',
        fetched_at: fetchedAt,
      },
    ]);
    const repo = createPgCategoryPlausibilityRepository(sql);

    const [doc] = await repo.listSourceDocumentsByDeterminationId('user_a', 'det_1');

    expect(calls[0]!.sql).toContain('JOIN prospects p ON p.id = d.prospect_id');
    expect(calls[0]!.sql).toContain('ORDER BY s.document_index');
    expect(calls[0]!.params).toEqual(['user_a', 'det_1']);
    expect(doc).toEqual({
      id: 'src_1',
      determinationId: 'det_1',
      searchId: 'search_1',
      prospectId: 'prospect_1',
      documentIndex: 0,
      label: 'Homepage',
      url: 'https://a.example.com',
      text: 'first  exact text',
      contentSha256: sourceContentSha256('first  exact text'),
      captureKind: MODEL_SEEN_SOURCE,
      extractionMethod: 'm',
      fetchedAt,
    });
  });
});
