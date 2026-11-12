import type { ExternalDiscoveryClient } from './googlePlacesClient';
import type { DiscoveryCandidate, DiscoveryProvider } from './provider';

// Concrete production DiscoveryProvider (Phase 18) — composes the
// vendor-neutral ExternalDiscoveryClient behind the frozen
// DiscoveryProvider contract. Owns query construction and raw-result
// mapping only; normalizeCandidate() (./normalize.ts, unmodified)
// remains the sole validity gate, and this file never touches userId —
// ownership is entirely the caller's (runDiscoveryForOwner) concern.

// CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002 D2/D4: no target-
// customer clause — the freelancer no longer supplies one for NEW
// searches, and search.parameters.targetCustomer (now a system-owned
// sentinel for those searches) is not a real discovery constraint.
function buildQuery(search: Parameters<DiscoveryProvider['discover']>[0]): string {
  const { service, geography, keywords } = search.parameters;
  const parts = [`${service} in ${geography}`, ...keywords];
  return parts.join(' ').trim();
}

export function createGooglePlacesDiscoveryProvider(client: ExternalDiscoveryClient): DiscoveryProvider {
  return {
    async discover(search) {
      const actualQuery = buildQuery(search);
      const results = await client.searchText(actualQuery);
      const candidates = results.map(
        (result): DiscoveryCandidate => ({
          name: result.name,
          website: result.websiteUri,
          businessStatus: result.businessStatus,
          placeId: result.placeId,
        }),
      );
      return { candidates, actualQuery, provider: 'GOOGLE_PLACES' };
    },
  };
}
