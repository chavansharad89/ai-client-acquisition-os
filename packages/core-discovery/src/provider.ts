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
 * (R-06) — so the engine does not change when the source does. Exactly
 * one controlled implementation exists for MVP; a real external provider
 * integration is not required by V2.1 for this phase (see
 * MVP_SCOPE_BOUNDARY.md).
 */
export interface DiscoveryProvider {
  discover(search: StoredSearch): Promise<readonly DiscoveryCandidate[]>;
}
