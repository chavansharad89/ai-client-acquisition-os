import type { StoredSearch } from '@acos/core-search';

/**
 * Provider-shaped candidate, before normalization (R-07). Fields are
 * deliberately loose — a real provider's output is untrusted and may be
 * incomplete or malformed; ./normalize's normalizeCandidate() is what
 * decides what is usable.
 */
export interface DiscoveryCandidate {
  name?: string | null;
  website?: string | null;
}

/**
 * The external discovery source, behind a provider-independent boundary
 * (R-06) — so the engine does not change when the source does. This
 * contract is frozen: ./googlePlacesProvider.ts (Phase 18) is the
 * concrete production implementation, behind ./googlePlacesClient.ts's
 * vendor-neutral boundary.
 */
export interface DiscoveryProvider {
  discover(search: StoredSearch): Promise<readonly DiscoveryCandidate[]>;
}
