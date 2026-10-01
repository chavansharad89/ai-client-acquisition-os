import type { LeadResearch } from './schema';

/**
 * What the Research Foundation gives a research provider to work with —
 * deliberately independent of any vendor (R-09). ./anthropicResearchProvider.ts
 * (Phase 18) is the concrete production implementation: it composes
 * ./sourceDocumentProvider.ts with the existing Anthropic-backed engine
 * (./anthropicModel.ts, ./researcher.ts), mirroring
 * @acos/core-discovery's DiscoveryProvider/googlePlacesProvider split.
 */
export interface ResearchProviderInput {
  prospectId: string;
  companyId: string;
  companyName: string;
  normalizedDomain: string;
  /**
   * Path 2 category plausibility (D8, Option B): the participant's
   * target-customer, already deterministically parsed into segments by
   * ./categoryPlausibility.ts's parseTargetSegments() — resolved by
   * ./service.ts's runResearchForOwner via a `searches` dependency,
   * mirroring @acos/core-opportunity's `OpportunityDeps.searches` (D8 §8
   * Candidate 2). The one additive field on this otherwise-frozen
   * boundary: every existing caller/fixture that omits it keeps
   * compiling and behaving exactly as before (categoryPlausibility
   * evaluates to []/UNKNOWN — D9 §5, E9). Optional and additive rather
   * than a second `.research()` parameter (D8 §8 Candidate 1, rejected —
   * would change the frozen method's arity).
   */
  targetSegments?: readonly string[];
  /**
   * A11-P1 M-2 source capture (requirement/
   * PATH_2_CATEGORY_PLAUSIBILITY_A11_P1_SOURCE_CAPTURE_PRODUCT_DECISION.md):
   * called with the source documents exactly as supplied to the model
   * (researchLead()'s onSourceDocuments). Optional and additive for the
   * same reason as `targetSegments` — the frozen research() method keeps
   * its arity and return type, and a provider that never calls it simply
   * captures nothing. May fire more than once in a fallback chain (once
   * per attempt, always with identical documents); the last call is the
   * attempt that produced the returned result.
   */
  onSourceDocumentsSupplied?: (supplied: SuppliedSourceDocuments) => void | Promise<void>;
}

/** The model-seen source documents for one research run, plus how and when they were obtained. */
export interface SuppliedSourceDocuments {
  documents: readonly { label: string; url: string; text: string }[];
  /** When the SourceDocumentProvider returned these documents. */
  fetchedAt: Date;
  /** The SourceDocumentProvider's declared extraction path, or 'UNDECLARED'. */
  extractionMethod: string;
}

/**
 * The external research source, behind a provider-independent boundary.
 * Returns the already-schema-validated result shape this package's
 * schema.ts defines (classification, evidence and provenance obligations
 * are that schema's concern, not this boundary's).
 */
export interface ResearchProvider {
  research(input: ResearchProviderInput): Promise<LeadResearch>;
}
