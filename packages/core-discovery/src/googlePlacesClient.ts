// Vendor-neutral external Discovery client boundary (Phase 18).
// -----------------------------------------------------------------------
// The only file in this package that knows Google Places API (New)
// exists. ExternalDiscoveryClient/ExternalDiscoveryResult are shaped for
// this package's own needs (name + website only, matching
// DiscoveryCandidate) — no Google request/response type ever escapes
// this file, mirroring @acos/core-capi's HttpTransport boundary and
// @acos/core-research's anthropicModel.ts ("the only file that imports
// the SDK").
// -----------------------------------------------------------------------

export interface ExternalDiscoveryResult {
  name: string | null;
  websiteUri: string | null;
}

export interface ExternalDiscoveryClient {
  searchText(query: string): Promise<readonly ExternalDiscoveryResult[]>;
}

/** Transient — network failure, timeout, 429, or 5xx. Bounded-retried inside this client. */
export class DiscoveryTransportError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'DiscoveryTransportError';
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

/** Permanent — bad credentials, malformed request, or an unparseable response. Never retried. */
export class DiscoveryClientError extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
    options?: { cause?: unknown },
  ) {
    super(message);
    this.name = 'DiscoveryClientError';
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

export interface GooglePlacesClientOptions {
  apiKey: string;
  baseUrl?: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
  /** Injectable for deterministic tests. */
  sleep?: (ms: number) => Promise<void>;
}

const DEFAULT_BASE_URL = 'https://places.googleapis.com/v1';
const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;
const RETRY_DELAYS_MS = [250, 500];

const isRetryableStatus = (status: number): boolean => status === 429 || status >= 500;

/**
 * Minimal field mask — display name and website URI only, matching
 * DiscoveryCandidate exactly. Never requests ratings/reviews/photos/
 * hours/phone (Phase 18 scope doc §8: prefer the smallest viable mask).
 */
const FIELD_MASK = 'places.displayName,places.websiteUri';

async function performRequest(
  query: string,
  options: Required<Pick<GooglePlacesClientOptions, 'apiKey' | 'baseUrl' | 'timeoutMs'>> & {
    fetchImpl: typeof fetch;
  },
): Promise<readonly ExternalDiscoveryResult[]> {
  const { fetchImpl } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), options.timeoutMs);

  let response: Response;
  try {
    response = await fetchImpl(`${options.baseUrl}/places:searchText`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'X-Goog-Api-Key': options.apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({ textQuery: query }),
      signal: controller.signal,
    });
  } catch (cause) {
    if (controller.signal.aborted) {
      throw new DiscoveryTransportError(`Google Places request timed out after ${options.timeoutMs}ms`);
    }
    throw new DiscoveryTransportError('Google Places request failed', { cause });
  } finally {
    clearTimeout(timer);
  }

  if (!response.ok) {
    if (isRetryableStatus(response.status)) {
      throw new DiscoveryTransportError(`Google Places request failed with status ${response.status}`);
    }
    throw new DiscoveryClientError(
      `Google Places request rejected with status ${response.status}`,
      response.status,
    );
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch (cause) {
    throw new DiscoveryClientError('Google Places returned a non-JSON response', response.status, {
      cause,
    });
  }

  return normalizeResponseBody(body);
}

function normalizeResponseBody(body: unknown): readonly ExternalDiscoveryResult[] {
  if (body === null || typeof body !== 'object' || !('places' in body)) return [];
  const places = (body as { places?: unknown }).places;
  if (!Array.isArray(places)) return [];

  return places.map((place): ExternalDiscoveryResult => {
    if (place === null || typeof place !== 'object') return { name: null, websiteUri: null };
    const displayName = (place as { displayName?: unknown }).displayName;
    const name =
      displayName !== null && typeof displayName === 'object' && 'text' in displayName
        ? ((displayName as { text?: unknown }).text as string | undefined) ?? null
        : typeof displayName === 'string'
          ? displayName
          : null;
    const websiteUri = (place as { websiteUri?: unknown }).websiteUri;
    return { name, websiteUri: typeof websiteUri === 'string' ? websiteUri : null };
  });
}

/**
 * Google Places API (New) text-search client. Bounded internal retry
 * (≤2 attempts, fixed short backoff) absorbs a single transient blip
 * without consuming a whole worker Search-attempt (Phase 18 scope doc
 * §18-20); a permanent failure (bad key, malformed request) is thrown
 * immediately, never retried.
 */
export function createGooglePlacesClient(options: GooglePlacesClientOptions): ExternalDiscoveryClient {
  const baseUrl = options.baseUrl ?? DEFAULT_BASE_URL;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchImpl = options.fetchImpl ?? fetch;
  const sleep = options.sleep ?? ((ms: number) => new Promise((resolve) => setTimeout(resolve, ms)));

  return {
    async searchText(query: string) {
      let lastError: unknown;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
        try {
          return await performRequest(query, { apiKey: options.apiKey, baseUrl, timeoutMs, fetchImpl });
        } catch (error) {
          if (!(error instanceof DiscoveryTransportError) || attempt === MAX_RETRIES) {
            throw error;
          }
          lastError = error;
          await sleep(RETRY_DELAYS_MS[attempt] ?? RETRY_DELAYS_MS[RETRY_DELAYS_MS.length - 1]!);
        }
      }
      throw lastError;
    },
  };
}
