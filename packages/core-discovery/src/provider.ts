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
  /**
   * Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001): Google
   * Places' businessStatus for this candidate, when the provider is
   * Google Places and the field was returned. Not part of
   * NormalizedCandidate/identity — consumed only by the worker's
   * pre-admission Entity-Reality signal production, in-memory, never
   * persisted on Company/Prospect.
   */
  businessStatus?: string | null;
  /**
   * Global Entity Architecture (CF-GLOBAL-ENTITY-ARCH-PO-DEC-001 D21/D22):
   * Google's provider-stable Place ID, when the provider is Google
   * Places and the field was returned. Not part of
   * NormalizedCandidate/identity normalization — consumed only by the
   * future Entity resolver as Category 1 (provider-stable) identity
   * evidence.
   */
  placeId?: string | null;
}

/**
 * One Discovery provider call's result: the candidates found, plus the
 * literal query string actually sent to the provider for this call
 * (Global Entity Architecture D21/C-5/C-7). `actualQuery` is captured
 * once, at call time, and is never reconstructed later from mutable
 * query-building logic — DiscoveryEvent provenance (service.ts) persists
 * this exact value.
 */
export interface DiscoveryResult {
  candidates: readonly DiscoveryCandidate[];
  actualQuery: string;
  /**
   * The provider's own stable name (e.g. `'GOOGLE_PLACES'`), for
   * DiscoveryEvent.provider and as the identity-evidence source_provider
   * namespace (D21/D22) — set by the concrete provider, never guessed or
   * hardcoded by the provider-agnostic service.ts (R-06).
   */
  provider: string;
}

/**
 * The external discovery source, behind a provider-independent boundary
 * (R-06) — so the engine does not change when the source does.
 * ./googlePlacesProvider.ts (Phase 18) is the concrete production
 * implementation, behind ./googlePlacesClient.ts's vendor-neutral
 * boundary. Extended (Global Entity Architecture D21) to return the
 * actual query alongside candidates — a MODIFYING change to this
 * contract, required because D21's DiscoveryEvent provenance cannot be
 * captured any other way without either duplicating each provider's own
 * query-building logic in service.ts (risking drift) or breaking the
 * provider-agnostic boundary this interface exists to preserve.
 */
export interface DiscoveryProvider {
  discover(search: StoredSearch): Promise<DiscoveryResult>;
}
