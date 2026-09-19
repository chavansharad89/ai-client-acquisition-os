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
      expect(headers['X-Goog-FieldMask']).toBe('places.displayName,places.websiteUri');
      expect(JSON.parse(init?.body as string)).toEqual({ textQuery: 'plumbers in Pune' });
      return jsonResponse(200, {
        places: [{ displayName: { text: 'Acme Plumbing' }, websiteUri: 'https://acme.example.com' }],
      });
    });

    const client = createGooglePlacesClient({ apiKey: 'test-key', fetchImpl: fetchImpl as typeof fetch });
    const results = await client.searchText('plumbers in Pune');

    expect(results).toEqual([{ name: 'Acme Plumbing', websiteUri: 'https://acme.example.com' }]);
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
