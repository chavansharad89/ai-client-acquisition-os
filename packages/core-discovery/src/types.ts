/**
 * Persisted domain objects for Discovery (PRD V2.1 R-07/R-08, DEC-005).
 * Company and Prospect are user-owned — see @acos/core-discovery's
 * repository.ts and migration 0015.
 */

export interface StoredCompany {
  id: string;
  userId: string;
  name: string;
  /** Deterministic identity key (PFR-10) — see ./normalize. */
  normalizedDomain: string;
  createdAt: Date;
}

/**
 * Fixed to DISCOVERED for this phase. DISCOVERED -> RESEARCHED (V2.1
 * Stage H) belongs to Research, out of scope for Phase 6 — see
 * MVP_SCOPE_BOUNDARY.md.
 */
export type ProspectStatus = 'DISCOVERED';

export interface StoredProspect {
  id: string;
  userId: string;
  searchId: string;
  companyId: string;
  status: ProspectStatus;
  createdAt: Date;
}

/** Untrusted shape a caller supplies to run discovery. Never carries userId. */
export interface RunDiscoveryInput {
  searchId: string;
}
