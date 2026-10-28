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
  /**
   * Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D11/D16):
   * Google's documented businessStatus enum
   * ('OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'), or
   * null when the field was not returned for this place. D11's
   * verification confirmed this field adds no billing-tier cost beyond
   * what websiteUri already incurs (Text Search Pro vs. the Enterprise
   * tier already in effect).
   */
  businessStatus: string | null;
  /**
   * Global Entity Architecture (CF-GLOBAL-ENTITY-ARCH-PO-DEC-001 D21;
   * ENGINEERING_SPECIFICATION_FINAL.md Q1): Google's provider-stable
   * Place ID, or null when the field was not returned for this place.
   * Externally verified (Google Maps Platform billing/data-fields docs)
   * to belong to the lowest documented SKU tier (Text Search Essentials,
   * IDs Only) — strictly below the Enterprise tier websiteUri already
   * incurs, so requesting it does not change the billing tier. Not
   * consumed by normalizeCandidate()/NormalizedCandidate — this is
   * identity evidence for the future Entity resolver, not a discovery
   * normalization input.
   */
  placeId: string | null;
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
 * Phase 18 scope doc §8's "smallest viable mask" principle, extended by
 * Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D1/D11/D16):
 * businessStatus is the one additional field authorized, to produce
 * deterministic Entity-Reality evidence. Still never requests
 * ratings/reviews/photos/hours/phone — those remain out of scope.
 * D11's verification: businessStatus is a Text Search Pro field;
 * websiteUri is already a Text Search Enterprise field, so adding this
 * field does not raise the request's billing tier.
 *
 * Extended again by the Global Entity Architecture
 * (ENGINEERING_SPECIFICATION_FINAL.md Q1): places.id is added to
 * capture the provider-stable Place ID required for Entity identity
 * resolution (D21/D22). Externally verified against Google Maps
 * Platform's own usage-and-billing/data-fields documentation: `id`
 * belongs to the lowest tier (Text Search Essentials, IDs Only),
 * strictly below the Enterprise tier `websiteUri` already incurs, and
 * billing is charged at the single highest tier requested — so this
 * addition does not raise the billing tier.
 */
const FIELD_MASK = 'places.id,places.displayName,places.websiteUri,places.businessStatus';

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
    if (place === null || typeof place !== 'object') {
      return { name: null, websiteUri: null, businessStatus: null, placeId: null };
    }
    const displayName = (place as { displayName?: unknown }).displayName;
    const name =
      displayName !== null && typeof displayName === 'object' && 'text' in displayName
        ? ((displayName as { text?: unknown }).text as string | undefined) ?? null
        : typeof displayName === 'string'
          ? displayName
          : null;
    const websiteUri = (place as { websiteUri?: unknown }).websiteUri;
    const businessStatus = (place as { businessStatus?: unknown }).businessStatus;
    const id = (place as { id?: unknown }).id;
    return {
      name,
      websiteUri: typeof websiteUri === 'string' ? websiteUri : null,
      businessStatus: typeof businessStatus === 'string' ? businessStatus : null,
      // A present-but-malformed `id` is treated as absent, never as a
      // parse error that drops the whole candidate (same pattern as a
      // malformed website).
      placeId: typeof id === 'string' ? id : null,
    };
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
