import { JSDOM, VirtualConsole } from 'jsdom';
import { Readability } from '@mozilla/readability';

import type { SourceDocument } from './provenance';

// Source-document acquisition boundary (Phase 18) — a capability
// researchLead() already requires (its sourceDocuments input) but that
// nothing in this repository previously supplied. Frozen to
// homepage-only, exactly one document per prospect (O-18-03): no
// secondary-page crawling, no ranking, no generalized crawler. This file
// performs retrieval/extraction ONLY — no AI research, no ResearchSignal
// construction, no Opportunity/Search-state involvement.
// -----------------------------------------------------------------------
// Two distinct, non-conflated failure outcomes (see the Phase 18 plan's
// retry/error-taxonomy correction):
//   - Transient (network/timeout/5xx) -> SourceFetchTransportError,
//     retried once internally, then THROWN — never silently swallowed
//     into an empty result, so a caller cannot mistake infrastructure
//     noise for "this site has nothing useful to research."
//   - Permanent/unusable (4xx, non-HTML, empty/short extraction) ->
//     resolves to [] (no throw) — a legitimate "found nothing" result,
//     never fabricated text.
// -----------------------------------------------------------------------

export interface SourceDocumentTarget {
  companyName: string;
  normalizedDomain: string;
}

export interface SourceDocumentProvider {
  fetchSourceDocuments(target: SourceDocumentTarget): Promise<readonly SourceDocument[]>;
}

/** Transient — network failure, timeout, or 5xx. Bounded-retried once inside this provider, then thrown. */
export class SourceFetchTransportError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'SourceFetchTransportError';
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

export interface HttpSourceDocumentProviderOptions {
  timeoutMs?: number;
  maxBytes?: number;
  userAgent?: string;
  fetchImpl?: typeof fetch;
  /** Injectable for deterministic tests. */
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_MAX_BYTES = 2_000_000;
const DEFAULT_USER_AGENT = 'ACOS-ResearchBot/1.0';
const MIN_EXTRACTED_CHARS = 200;
const RETRY_DELAY_MS = 500;

const isRetryableStatus = (status: number): boolean => status >= 500;

async function readBodyBounded(response: Response, maxBytes: number): Promise<string | null> {
  if (!response.body) return response.text();

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let received = 0;
  let text = '';
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > maxBytes) {
      await reader.cancel();
      return null;
    }
    text += decoder.decode(value, { stream: true });
  }
  text += decoder.decode();
  return text;
}

async function fetchHomepage(
  url: string,
  options: Required<Pick<HttpSourceDocumentProviderOptions, 'timeoutMs' | 'maxBytes' | 'userAgent'>> & {
    fetchImpl: typeof fetch;
  },
): Promise<{ kind: 'ok'; html: string } | { kind: 'unusable' }> {
  const { fetchImpl } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'user-agent': options.userAgent, accept: 'text/html' },
      signal: controller.signal,
    });
  } catch (cause) {
    if (controller.signal.aborted) {
      throw new SourceFetchTransportError(`source fetch timed out after ${options.timeoutMs}ms`);
    }
    throw new SourceFetchTransportError('source fetch failed', { cause });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    if (isRetryableStatus(response.status)) {
      throw new SourceFetchTransportError(`source fetch failed with status ${response.status}`);
    }
    return { kind: 'unusable' };
  }

  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    return { kind: 'unusable' };
  }

  const html = await readBodyBounded(response, options.maxBytes);
  if (html === null) return { kind: 'unusable' };

  return { kind: 'ok', html };
}

function extractText(html: string): string | null {
  let dom: JSDOM;
  try {
    // jsdom's default virtual console forwards its own internal
    // "jsdomError" events (e.g. malformed CSS it fails to parse, as seen
    // live on mumbaiwebdesign.in) to the real console, dumping the raw
    // offending CSS/stack to stderr for every such page. A silent
    // VirtualConsole (no listeners) absorbs those without throwing —
    // jsdom itself already isolates the parse failure and never lets it
    // affect extraction; this just stops the log flood.
    dom = new JSDOM(html, { virtualConsole: new VirtualConsole() });
  } catch {
    return null;
  }
  try {
    const article = new Readability(dom.window.document).parse();
    const text = article?.textContent?.trim().replace(/\s+/g, ' ') ?? '';
    return text.length >= MIN_EXTRACTED_CHARS ? text : null;
  } catch {
    return null;
  }
}

/**
 * Homepage-only source acquisition (O-18-03, frozen): fetches exactly
 * `https://{normalizedDomain}` and produces at most one SourceDocument,
 * labeled "Homepage". No secondary pages, no ranking, no crawler.
 */
export function createHttpSourceDocumentProvider(
  options: HttpSourceDocumentProviderOptions = {},
): SourceDocumentProvider {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
  const userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  return {
    async fetchSourceDocuments(target) {
      const url = `https://${target.normalizedDomain}`;

      let result: { kind: 'ok'; html: string } | { kind: 'unusable' };
      try {
        result = await fetchHomepage(url, { timeoutMs, maxBytes, userAgent, fetchImpl });
      } catch (error) {
        if (!(error instanceof SourceFetchTransportError)) throw error;
        await sleep(RETRY_DELAY_MS);
        result = await fetchHomepage(url, { timeoutMs, maxBytes, userAgent, fetchImpl });
      }

      if (result.kind === 'unusable') return [];

      const text = extractText(result.html);
      if (text === null) return [];

      return [{ label: 'Homepage', url, text }];
    },
  };
}
