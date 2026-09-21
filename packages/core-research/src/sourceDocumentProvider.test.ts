import { describe, expect, it, vi } from 'vitest';

import { createHttpSourceDocumentProvider, SourceFetchTransportError } from './sourceDocumentProvider';

// Phase 18 — homepage-only source acquisition (O-18-03, frozen). No live
// network: fetch is injected. The two outcomes below are deliberately
// NOT conflated (see anthropicResearchProvider.ts's own note on this):
// a transient transport failure THROWS, a permanent/unusable page
// RESOLVES to [] — never fabricated text either way.

const ARTICLE_HTML = `
<!doctype html>
<html><head><title>Acme Robotics</title></head>
<body>
  <article>
    <h1>Acme Robotics</h1>
    <p>Acme Robotics builds autonomous warehouse robots for mid-size logistics
    companies across North America. Founded in 2019, the company has shipped
    over four hundred units to more than sixty customers, focusing on
    picking, packing and inventory reconciliation workflows that previously
    required manual labor. Our engineering team is based in Austin, Texas,
    and our robots are designed to integrate with existing warehouse
    management systems without requiring a full facility retrofit.</p>
    <p>We are actively hiring warehouse automation engineers and a content
    marketing lead to help tell our customers' stories.</p>
  </article>
</body></html>
`;

function htmlResponse(body: string, status = 200): Response {
  return new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8' } });
}

describe('createHttpSourceDocumentProvider', () => {
  it('fetches the homepage and extracts readable text, preserving label and url exactly', async () => {
    const fetchImpl = vi.fn(async (url: string | URL) => {
      expect(String(url)).toBe('https://acme.example.com');
      return htmlResponse(ARTICLE_HTML);
    });
    const provider = createHttpSourceDocumentProvider({ fetchImpl: fetchImpl as typeof fetch });

    const docs = await provider.fetchSourceDocuments({
      companyName: 'Acme Robotics',
      normalizedDomain: 'acme.example.com',
    });

    expect(docs).toHaveLength(1);
    expect(docs[0]!.label).toBe('Homepage');
    expect(docs[0]!.url).toBe('https://acme.example.com');
    expect(docs[0]!.text).toContain('Acme Robotics builds autonomous warehouse robots');
  });

  it('resolves to [] for a non-HTML content-type — never fabricated text', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    const provider = createHttpSourceDocumentProvider({ fetchImpl: fetchImpl as typeof fetch });

    const docs = await provider.fetchSourceDocuments({
      companyName: 'Acme',
      normalizedDomain: 'acme.example.com',
    });

    expect(docs).toEqual([]);
  });

  it('resolves to [] when the extracted text is too short to be usable', async () => {
    const fetchImpl = vi.fn(async () => htmlResponse('<html><body><p>Hi.</p></body></html>'));
    const provider = createHttpSourceDocumentProvider({ fetchImpl: fetchImpl as typeof fetch });

    const docs = await provider.fetchSourceDocuments({
      companyName: 'Acme',
      normalizedDomain: 'acme.example.com',
    });

    expect(docs).toEqual([]);
  });

  it('resolves to [] for a client-rendered SPA shell with zero server-rendered text — Readability returns null, not just a short string', async () => {
    // Real-world regression: amitdwivedi.in (a Hostinger-Horizons-built
    // React/Vite SPA) serves this exact shape for every request — 200
    // OK, content-type text/html, identical byte-for-byte regardless of
    // User-Agent (confirmed live: no bot-detection, no prerendering) —
    // and the server-rendered document contains no text anywhere: no
    // body content, no meta description, no Open Graph tags, only a
    // mount point and script tags. Readability.parse() legitimately
    // returns null here (not just under-threshold text, as the "Hi."
    // case above exercises) because there is genuinely nothing to
    // extract without executing the page's JavaScript — which Phase
    // 18's frozen, no-headless-browser scope correctly never attempts.
    // InsufficientEvidenceError is the correct downstream outcome, not
    // a defect: there is no legitimate homepage evidence to acquire.
    const spaShellHtml = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="generator" content="Hostinger Horizons" />
    <title>Hostinger Horizons</title>
    <script type="module" crossorigin src="/assets/index-89c4af11.js"></script>
    <link rel="stylesheet" href="/assets/index-abf24b1d.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;
    const fetchImpl = vi.fn(async () => htmlResponse(spaShellHtml));
    const provider = createHttpSourceDocumentProvider({ fetchImpl: fetchImpl as typeof fetch });

    const docs = await provider.fetchSourceDocuments({
      companyName: 'Amit Dwivedi Website Design and Development',
      normalizedDomain: 'amitdwivedi.in',
    });

    expect(docs).toEqual([]);
    // Correctly classified as unusable, not transient — never retried.
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('resolves to [] on a non-retryable 404, without retrying', async () => {
    const fetchImpl = vi.fn(async () => htmlResponse('not found', 404));
    const provider = createHttpSourceDocumentProvider({ fetchImpl: fetchImpl as typeof fetch });

    const docs = await provider.fetchSourceDocuments({
      companyName: 'Acme',
      normalizedDomain: 'acme.example.com',
    });

    expect(docs).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('resolves to [] when the body exceeds the configured size cap', async () => {
    const fetchImpl = vi.fn(async () => htmlResponse('<html><body>' + 'a'.repeat(1000) + '</body></html>'));
    const provider = createHttpSourceDocumentProvider({
      fetchImpl: fetchImpl as typeof fetch,
      maxBytes: 100,
    });

    const docs = await provider.fetchSourceDocuments({
      companyName: 'Acme',
      normalizedDomain: 'acme.example.com',
    });

    expect(docs).toEqual([]);
  });

  it('throws SourceFetchTransportError — not []  — after one bounded retry on repeated 5xx', async () => {
    const fetchImpl = vi.fn(async () => htmlResponse('server error', 503));
    const sleep = vi.fn(async () => undefined);
    const provider = createHttpSourceDocumentProvider({ fetchImpl: fetchImpl as typeof fetch, sleep });

    await expect(
      provider.fetchSourceDocuments({ companyName: 'Acme', normalizedDomain: 'acme.example.com' }),
    ).rejects.toBeInstanceOf(SourceFetchTransportError);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('recovers from a single transient failure via its one bounded retry', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return htmlResponse('server error', 503);
      return htmlResponse(ARTICLE_HTML);
    });
    const sleep = vi.fn(async () => undefined);
    const provider = createHttpSourceDocumentProvider({ fetchImpl: fetchImpl as typeof fetch, sleep });

    const docs = await provider.fetchSourceDocuments({
      companyName: 'Acme',
      normalizedDomain: 'acme.example.com',
    });

    expect(docs).toHaveLength(1);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('throws SourceFetchTransportError on a network failure, after its bounded retry', async () => {
    const fetchImpl = vi.fn(async () => {
      throw new Error('ECONNRESET');
    });
    const sleep = vi.fn(async () => undefined);
    const provider = createHttpSourceDocumentProvider({ fetchImpl: fetchImpl as typeof fetch, sleep });

    await expect(
      provider.fetchSourceDocuments({ companyName: 'Acme', normalizedDomain: 'acme.example.com' }),
    ).rejects.toBeInstanceOf(SourceFetchTransportError);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('throws SourceFetchTransportError on a request timeout', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    });
    const sleep = vi.fn(async () => undefined);
    const provider = createHttpSourceDocumentProvider({
      fetchImpl: fetchImpl as typeof fetch,
      timeoutMs: 5,
      sleep,
    });

    await expect(
      provider.fetchSourceDocuments({ companyName: 'Acme', normalizedDomain: 'acme.example.com' }),
    ).rejects.toBeInstanceOf(SourceFetchTransportError);
  });
});
