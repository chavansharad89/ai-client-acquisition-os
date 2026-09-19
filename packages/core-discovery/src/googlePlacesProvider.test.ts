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
        return [{ name: 'Acme Co', websiteUri: 'https://acme.example.com' }];
      }),
    );

    const candidates = await provider.discover(seedSearch());

    expect(seenQuery).toContain('Website development');
    expect(seenQuery).toContain('Restaurants');
    expect(seenQuery).toContain('Mumbai');
    expect(seenQuery).toContain('website');
    expect(seenQuery).toContain('redesign');
    expect(candidates).toEqual([{ name: 'Acme Co', website: 'https://acme.example.com' }]);
  });

  it('passes through a missing name/website untouched — normalizeCandidate is the validity gate, not this provider', async () => {
    const provider = createGooglePlacesDiscoveryProvider(
      fakeClient(() => [{ name: null, websiteUri: null }]),
    );

    const candidates = await provider.discover(seedSearch());

    expect(candidates).toEqual([{ name: null, website: null }]);
  });

  it('returns an empty array when the client finds nothing', async () => {
    const provider = createGooglePlacesDiscoveryProvider(fakeClient(() => []));

    expect(await provider.discover(seedSearch())).toEqual([]);
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
