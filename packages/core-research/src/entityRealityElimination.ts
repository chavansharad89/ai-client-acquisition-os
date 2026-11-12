import type { DeterministicSignal } from './deterministicSignals';

// Phase 2 of requirement/CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md
// — the deterministic Entity Reality elimination boundary
// (CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001: "Entity Reality is the only
// deterministic eligibility gate"). Wired into
// apps/worker/src/searchWorker/worker.ts between Discovery and the
// per-prospect Research loop — see that module's runCanonicalPipeline.
//
// What "existing deterministic evidence" actually covers, and the
// predicate's exact shape (Phase 8, CF-PHASE8-ENTITY-REALITY-ACTIVATION-
// PO-DEC-001, D1-D3, D15):
//   - "Clearly fake/unusable" needs a signal that positively establishes
//     non-reality. The absent-SSL check (createWebDevelopmentSignalCatalogue,
//     ./deterministicSignals.ts) is NEED_OPPORTUNITY_GAP, not
//     ENTITY_REALITY, and must never be treated as one here — absent TLS
//     says something about a real site's quality, not whether the entity
//     behind it exists.
//   - detectPlacesEntityReality() (./deterministicSignals.ts) is the
//     one ENTITY_REALITY-dimension producer: Google Places
//     CLOSED_PERMANENTLY sets `establishesNonReality: true` (D3-C1);
//     CLOSED_TEMPORARILY is tagged ENTITY_REALITY too (D2.2) but
//     deliberately never sets that flag (D3-C2/D15-O1), so the
//     predicate below — which requires BOTH the dimension AND the flag —
//     can never be satisfied by it. A missing/no-result businessStatus
//     (D2.3/D3-C3) produces no signal at all.
//   - "Duplicate" is already fully resolved before a candidate ever
//     reaches this boundary: @acos/core-discovery's service.ts upserts
//     via CompanyRepository.findOrCreateByDomain and
//     ProspectRepository.findOrCreate on (userId, normalizedDomain) /
//     (searchId, companyId), so two distinct rows for the same entity in
//     the same search cannot exist by the time Discovery hands prospects
//     here. CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001 does not authorize
//     a new deduplication algorithm, so this boundary does not attempt
//     one.
//   - "Invalid" (missing name / unusable website) is already fully
//     resolved too: @acos/core-discovery's normalize.ts discards any
//     candidate missing a name or a parseable website before a
//     Company/Prospect row is ever created.
//
// The rule: look for an ENTITY_REALITY-dimension signal that is also
// explicitly flagged `establishesNonReality: true`; eliminate only then.
// Dimension alone is deliberately insufficient (D15/O1) — this is what
// lets CLOSED_TEMPORARILY share the dimension without ever qualifying.

export interface EliminationCandidate {
  readonly id: string;
}

export interface EliminationResult {
  readonly eligible: boolean;
  readonly reason?: string;
}

/**
 * Looks for an existing ENTITY_REALITY-dimension signal that is also
 * explicitly flagged as positively establishing `candidate` is not a
 * real, identifiable entity (`establishesNonReality: true` — D3-C1).
 * Returns null when none exists — ambiguity (weak, missing, or
 * conflicting evidence, or an ENTITY_REALITY-dimension signal that
 * doesn't carry the flag, e.g. CLOSED_TEMPORARILY) is preserved, never
 * treated as elimination evidence
 * (CLIENT_FINDER_EVIDENCE_TRANSPARENCY_CONFLICT_STALENESS_FREELANCER_JUDGMENT_PO_DECISION.md).
 */
function findNonRealityEvidence(signals: readonly DeterministicSignal[]): string | null {
  const nonReality = signals.find(
    (entry) => entry.dimension === 'ENTITY_REALITY' && entry.establishesNonReality === true,
  );
  return nonReality ? nonReality.signal.signal : null;
}

/**
 * Pure deterministic elimination: Entity Reality is the only eligibility
 * gate (CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001). A candidate is
 * eliminated only when `signals` contains existing deterministic
 * evidence that positively establishes it is not a real, identifiable
 * entity. No numeric threshold, confidence cutoff, or score is applied —
 * none has been authorized.
 */
export function eliminateDeterministically(
  candidate: EliminationCandidate,
  signals: readonly DeterministicSignal[],
): EliminationResult {
  const nonRealityEvidence = findNonRealityEvidence(signals);
  if (nonRealityEvidence) {
    return { eligible: false, reason: `${candidate.id}: ${nonRealityEvidence}` };
  }
  return { eligible: true };
}
