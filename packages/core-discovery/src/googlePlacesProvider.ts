import type { ExternalDiscoveryClient } from './googlePlacesClient';
import type { DiscoveryCandidate, DiscoveryProvider } from './provider';

// Concrete production DiscoveryProvider (Phase 18) — composes the
// vendor-neutral ExternalDiscoveryClient behind the frozen
// DiscoveryProvider contract. Owns query construction and raw-result
// mapping only; normalizeCandidate() (./normalize.ts, unmodified)
// remains the sole validity gate, and this file never touches userId —
// ownership is entirely the caller's (runDiscoveryForOwner) concern.

function buildQuery(search: Parameters<DiscoveryProvider['discover']>[0]): string {
  const { service, targetCustomer, geography, keywords } = search.parameters;
  const parts = [`${service} for ${targetCustomer} in ${geography}`, ...keywords];
  return parts.join(' ').trim();
}

export function createGooglePlacesDiscoveryProvider(client: ExternalDiscoveryClient): DiscoveryProvider {
  return {
    async discover(search) {
      const query = buildQuery(search);
      const results = await client.searchText(query);
      return results.map(
        (result): DiscoveryCandidate => ({
          name: result.name,
          website: result.websiteUri,
        }),
      );
    },
  };
}
