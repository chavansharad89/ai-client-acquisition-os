// Phase H — public/private evidence classification (Global Entity
// Architecture, Final Architecture Rules §6 "Public/private evidence";
// CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_
// SPECIFICATION.md). Field-level (not kind-level), backed by the
// existing, already-applied `research_signal_field_classification`
// reference table (migration 0058) — this module never maintains its
// own copy of the mapping, so it can never drift from what that table
// actually contains.
// -----------------------------------------------------------------------
// This establishes ONLY the classification boundary Phase I will later
// consume. It answers "is this field eligible to be CONSIDERED by the
// Q5-B gate" — never "is this field reusable right now". Nothing here
// writes research_signal_global_authorizations, serves a signal across a
// freelancer boundary, or makes a classification decision retroactive —
// see ./signalCache's EntityPublicLookupDeps/evaluateEntityPublicLookup,
// which still requires a SEPARATE, not-yet-implemented authorization
// check before anything is ever reusable.
// -----------------------------------------------------------------------

export type FieldVisibility = 'PUBLIC_ELIGIBLE' | 'PRIVATE';

/**
 * Fail-closed: the ONLY value that resolves to PUBLIC_ELIGIBLE is the
 * literal string 'PUBLIC_ELIGIBLE'. A missing row (`undefined`), `null`,
 * or any other value (a future malformed row, a typo, an unrecognized
 * classification) resolves to PRIVATE — never the reverse. This is the
 * single place that decision is made; every caller in this module routes
 * through it rather than re-deriving the same logic.
 */
export function resolveFieldVisibility(rawVisibility: string | null | undefined): FieldVisibility {
  return rawVisibility === 'PUBLIC_ELIGIBLE' ? 'PUBLIC_ELIGIBLE' : 'PRIVATE';
}

export interface FieldClassificationRepository {
  /**
   * Answers exactly one question: is `field` currently classified
   * PUBLIC_ELIGIBLE in research_signal_field_classification? Fails
   * closed on every other outcome (unknown field, missing row, any
   * value other than 'PUBLIC_ELIGIBLE') — see resolveFieldVisibility.
   * Never infers from signal content, never calls an LLM, never
   * evaluates keywords — the classification is deterministic, additive
   * reference data only.
   */
  isFieldPublicEligible(field: string): Promise<boolean>;
}
