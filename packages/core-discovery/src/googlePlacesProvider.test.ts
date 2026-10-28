import type { StoredSearch } from '@acos/core-search';
import { describe, expect, it } from 'vitest';

import type { ExternalDiscoveryClient, ExternalDiscoveryResult } from './googlePlacesClient';
import { createGooglePlacesDiscoveryProvider } from './googlePlacesProvider';

function seedSearch(overrides: Partial<StoredSearch> = {}): StoredSearch {
  return {
    id: 'search_1',
    userId: 'user_a',
    serviceProfileId: 'svcprofile_1',
    status: 'RUNNING',
    parameters: {
      service: 'Website development',
      targetCustomer: 'Restaurants',
      geography: 'Mumbai',
      minProjectValuePaise: 3_000_000,
      triggers: ['JOB_POST'],
      keywords: ['website', 'redesign'],
      rationale: 'They lack a working website.',
    },
    attempts: 0,
    lastError: null,
    leaseOwner: null,
    leaseExpiresAt: null,
    idempotencyKey: null,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  };
}

function fakeClient(
  handler: (query: string) => readonly ExternalDiscoveryResult[] | Promise<never>,
): ExternalDiscoveryClient {
  return {
    async searchText(query) {
      const result = handler(query);
      return result instanceof Promise ? result : result;
    },
  };
}

describe('createGooglePlacesDiscoveryProvider', () => {
  it('builds a query from the Search parameters and maps results to DiscoveryCandidate', async () => {
    let seenQuery = '';
    const provider = createGooglePlacesDiscoveryProvider(
      fakeClient((query) => {
        seenQuery = query;
        return [
          {
            name: 'Acme Co',
            websiteUri: 'https://acme.example.com',
            businessStatus: 'OPERATIONAL',
            placeId: 'ChIJacme',
          },
        ];
      }),
    );

    const result = await provider.discover(seedSearch());

    expect(seenQuery).toContain('Website development');
    expect(seenQuery).toContain('Mumbai');
    expect(seenQuery).toContain('website');
    expect(seenQuery).toContain('redesign');
    // CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002 D2/D4: no
    // target-customer clause in the query, even when parameters.targetCustomer
    // carries a real (e.g. historical) value.
    expect(seenQuery).not.toContain('Restaurants');
    expect(result.candidates).toEqual([
      {
        name: 'Acme Co',
        website: 'https://acme.example.com',
        businessStatus: 'OPERATIONAL',
        placeId: 'ChIJacme',
      },
    ]);
    // Global Entity Architecture (D21/C-7): DiscoveryResult now also
    // carries the literal query sent and this provider's stable name,
    // for DiscoveryEvent provenance.
    expect(result.actualQuery).toBe(seenQuery);
    expect(result.provider).toBe('GOOGLE_PLACES');
  });

  it('passes through a missing name/website untouched — normalizeCandidate is the validity gate, not this provider', async () => {
    const provider = createGooglePlacesDiscoveryProvider(
      fakeClient(() => [{ name: null, websiteUri: null, businessStatus: null, placeId: null }]),
    );

    const result = await provider.discover(seedSearch());

    expect(result.candidates).toEqual([{ name: null, website: null, businessStatus: null, placeId: null }]);
  });

  // Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D16).
  it('maps businessStatus through from the client result to DiscoveryCandidate', async () => {
    const provider = createGooglePlacesDiscoveryProvider(
      fakeClient(() => [
        {
          name: 'Closed Co',
          websiteUri: 'https://closed.example.com',
          businessStatus: 'CLOSED_PERMANENTLY',
          placeId: null,
        },
      ]),
    );

    const [candidate] = (await provider.discover(seedSearch())).candidates;

    expect(candidate?.businessStatus).toBe('CLOSED_PERMANENTLY');
  });

  // Global Entity Architecture (ENGINEERING_SPECIFICATION_FINAL.md Q1, D21/D22).
  it('maps placeId through from the client result to DiscoveryCandidate', async () => {
    const provider = createGooglePlacesDiscoveryProvider(
      fakeClient(() => [
        {
          name: 'Has Id Co',
          websiteUri: 'https://hasid.example.com',
          businessStatus: null,
          placeId: 'ChIJhasid',
        },
      ]),
    );

    const [candidate] = (await provider.discover(seedSearch())).candidates;

    expect(candidate?.placeId).toBe('ChIJhasid');
  });

  it('returns an empty candidates array when the client finds nothing', async () => {
    const provider = createGooglePlacesDiscoveryProvider(fakeClient(() => []));

    expect((await provider.discover(seedSearch())).candidates).toEqual([]);
  });

  it('propagates a client error rather than swallowing it', async () => {
    const provider = createGooglePlacesDiscoveryProvider({
      async searchText() {
        throw new Error('places api unavailable');
      },
    });

    await expect(provider.discover(seedSearch())).rejects.toThrow('places api unavailable');
  });
});
