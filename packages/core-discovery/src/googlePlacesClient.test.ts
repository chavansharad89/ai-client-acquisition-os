import { describe, expect, it, vi } from 'vitest';

import {
  createGooglePlacesClient,
  DiscoveryClientError,
  DiscoveryTransportError,
} from './googlePlacesClient';

// Phase 18 — Google Places API (New) client. All external calls are
// faked at the fetch boundary (no live network), matching the repo's
// universal convention of dependency-injected fakes rather than a
// mocking library.

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createGooglePlacesClient', () => {
  it('sends the api key header, field mask, and query, and normalizes a successful response', async () => {
    const fetchImpl = vi.fn(async (url: string | URL, init?: RequestInit) => {
      expect(String(url)).toBe('https://places.googleapis.com/v1/places:searchText');
      const headers = init?.headers as Record<string, string>;
      expect(headers['X-Goog-Api-Key']).toBe('test-key');
      expect(headers['X-Goog-FieldMask']).toBe(
        'places.id,places.displayName,places.websiteUri,places.businessStatus',
      );
      expect(JSON.parse(init?.body as string)).toEqual({ textQuery: 'plumbers in Pune' });
      return jsonResponse(200, {
        places: [
          {
            id: 'ChIJabc123',
            displayName: { text: 'Acme Plumbing' },
            websiteUri: 'https://acme.example.com',
            businessStatus: 'OPERATIONAL',
          },
        ],
      });
    });

    const client = createGooglePlacesClient({ apiKey: 'test-key', fetchImpl: fetchImpl as typeof fetch });
    const results = await client.searchText('plumbers in Pune');

    expect(results).toEqual([
      {
        name: 'Acme Plumbing',
        websiteUri: 'https://acme.example.com',
        businessStatus: 'OPERATIONAL',
        placeId: 'ChIJabc123',
      },
    ]);
  });

  // Global Entity Architecture (ENGINEERING_SPECIFICATION_FINAL.md Q1, D21/D22).
  it('extracts placeId when present; normalizes a missing or malformed id to null', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        places: [
          { id: 'ChIJxyz789', displayName: { text: 'Has Id Co' }, websiteUri: 'https://hasid.example.com' },
          { displayName: { text: 'No Id Co' }, websiteUri: 'https://noid.example.com' },
          { id: 12345, displayName: { text: 'Malformed Id Co' }, websiteUri: 'https://malformed.example.com' },
        ],
      }),
    );
    const client = createGooglePlacesClient({ apiKey: 'k', fetchImpl: fetchImpl as typeof fetch });

    const results = await client.searchText('q');

    expect(results[0]?.placeId).toBe('ChIJxyz789');
    expect(results[1]?.placeId).toBeNull();
    expect(results[2]?.placeId).toBeNull();
  });

  // Billing-tier regression test, mirroring the existing businessStatus
  // precedent (D11): places.id must be present in the field mask without
  // changing the request's billing tier (externally verified — `id` is
  // Text Search Essentials/IDs-Only, strictly below the Enterprise tier
  // `websiteUri` already incurs).
  it('includes places.id in the field mask without introducing a second, higher-tier field request', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      const headers = init?.headers as Record<string, string>;
      const mask = headers['X-Goog-FieldMask'] ?? '';
      expect(mask.split(',')).toEqual([
        'places.id',
        'places.displayName',
        'places.websiteUri',
        'places.businessStatus',
      ]);
      return jsonResponse(200, { places: [] });
    });
    const client = createGooglePlacesClient({ apiKey: 'k', fetchImpl: fetchImpl as typeof fetch });

    await client.searchText('q');
  });

  // Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D11/D16).
  it('extracts businessStatus when present, and normalizes a missing businessStatus to null', async () => {
    const fetchImpl = vi.fn(async () =>
      jsonResponse(200, {
        places: [
          { displayName: { text: 'Closed Co' }, websiteUri: 'https://closed.example.com', businessStatus: 'CLOSED_PERMANENTLY' },
          { displayName: { text: 'No Status Co' }, websiteUri: 'https://nostatus.example.com' },
        ],
      }),
    );
    const client = createGooglePlacesClient({ apiKey: 'k', fetchImpl: fetchImpl as typeof fetch });

    const results = await client.searchText('q');

    expect(results[0]?.businessStatus).toBe('CLOSED_PERMANENTLY');
    expect(results[1]?.businessStatus).toBeNull();
  });

  it('normalizes a non-object place entry to a fully-null result, including placeId', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { places: [null] }));
    const client = createGooglePlacesClient({ apiKey: 'k', fetchImpl: fetchImpl as typeof fetch });

    const results = await client.searchText('q');

    expect(results).toEqual([
      { name: null, websiteUri: null, businessStatus: null, placeId: null },
    ]);
  });

  it('returns an empty array for an empty places list', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { places: [] }));
    const client = createGooglePlacesClient({ apiKey: 'k', fetchImpl: fetchImpl as typeof fetch });

    expect(await client.searchText('nothing here')).toEqual([]);
  });

  it('returns an empty array for a malformed (non-object, non-places) body rather than throwing', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(200, { unexpected: true }));
    const client = createGooglePlacesClient({ apiKey: 'k', fetchImpl: fetchImpl as typeof fetch });

    expect(await client.searchText('q')).toEqual([]);
  });

  it('throws DiscoveryClientError (non-retryable) for a non-JSON response', async () => {
    const fetchImpl = vi.fn(
      async () => new Response('not json', { status: 200, headers: { 'content-type': 'text/plain' } }),
    );
    const client = createGooglePlacesClient({ apiKey: 'k', fetchImpl: fetchImpl as typeof fetch });

    await expect(client.searchText('q')).rejects.toBeInstanceOf(DiscoveryClientError);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('throws DiscoveryClientError (non-retryable) for a 401, without retrying', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(401, { error: 'unauthorized' }));
    const client = createGooglePlacesClient({ apiKey: 'bad-key', fetchImpl: fetchImpl as typeof fetch });

    await expect(client.searchText('q')).rejects.toMatchObject({
      name: 'DiscoveryClientError',
      status: 401,
    });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('retries a 429, then succeeds on the second attempt', async () => {
    let calls = 0;
    const fetchImpl = vi.fn(async () => {
      calls += 1;
      if (calls === 1) return jsonResponse(429, {});
      return jsonResponse(200, { places: [] });
    });
    const sleep = vi.fn(async () => undefined);
    const client = createGooglePlacesClient({ apiKey: 'k', fetchImpl: fetchImpl as typeof fetch, sleep });

    const results = await client.searchText('q');

    expect(results).toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('throws DiscoveryTransportError after exhausting its bounded retries on repeated 5xx', async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(503, {}));
    const sleep = vi.fn(async () => undefined);
    const client = createGooglePlacesClient({ apiKey: 'k', fetchImpl: fetchImpl as typeof fetch, sleep });

    await expect(client.searchText('q')).rejects.toBeInstanceOf(DiscoveryTransportError);
    // 1 initial attempt + 2 retries = 3 total calls, per the ≤2-retries budget.
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('throws DiscoveryTransportError on a request timeout', async () => {
    const fetchImpl = vi.fn(async (_url: string | URL, init?: RequestInit) => {
      return new Promise<Response>((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
      });
    });
    const sleep = vi.fn(async () => undefined);
    const client = createGooglePlacesClient({
      apiKey: 'k',
      timeoutMs: 5,
      fetchImpl: fetchImpl as typeof fetch,
      sleep,
    });

    await expect(client.searchText('q')).rejects.toBeInstanceOf(DiscoveryTransportError);
  });
});
