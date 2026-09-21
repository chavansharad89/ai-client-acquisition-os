import type { DetectedOffer } from '@acos/core-opportunity';

import type { PersonalizationEvidenceItem, PersonalizationGeneration } from './types';

// Pure, deterministic prose generation (Phase 21, R-46/R-47/R-48). No LLM,
// no I/O, no clock, no randomness (see the Phase 21 scope-lock's Decision
// P1) — the same input always produces the same output, mirroring
// @acos/core-qualification's evaluator.ts and
// @acos/core-acquisition's offer.ts `{signal}`-template convention.
//
// Every sentence this module writes traces directly to one evidence
// item's own `field`/`signal`/`classification`/`basis` (R-44's
// provenance requirement) or to the Opportunity's own existing `offer`
// (R-47) — nothing here invents a company fact, a pain point, or a
// business outcome no signal or offer already states.
// -----------------------------------------------------------------------

export const GENERATOR_VERSION = 'personalization-v1';

/** "visibleProblems" -> "visible problems". A generic label, not a per-field lookup table. */
function humanizeField(field: string): string {
  return field.replace(/([a-z0-9])([A-Z])/g, '$1 $2').toLowerCase();
}

/**
 * One evidence-backed sentence fragment. OBSERVED is stated as a direct,
 * evidence-grounded observation; INFERRED is explicitly hedged and
 * carries its own basis inline (R-48: inference must never silently
 * become an observed fact). Neither ever states a business outcome or
 * causal consequence the signal itself does not — this function has no
 * vocabulary for "loses customers", "misses revenue", etc.
 */
function sentenceFor(item: PersonalizationEvidenceItem): string {
  const label = humanizeField(item.field);
  if (item.classification === 'OBSERVED') {
    return `your ${label} shows ${item.signal}`;
  }
  const basisClause = item.basis ? `, reasoned from ${item.basis}` : '';
  return `available evidence suggests ${item.signal} (${label}, inferred${basisClause})`;
}

export interface PersonalizationGeneratorInput {
  /** Prospect/company identity (R-43) — used only to address the opening context, never as a claim source. */
  companyName: string;
  /** The Opportunity's own already-persisted, authoritative offer (R-47) — never recomputed here. */
  offer: DetectedOffer;
  /** Already-selected, bounded evidence (./evidence.ts) — this module only renders it, never re-selects. */
  evidence: readonly PersonalizationEvidenceItem[];
  /**
   * The caller's own ServiceProfile snapshot (R-43) — a fact about the
   * caller's business, never about the prospect, so it is safe to state
   * directly in the rationale (observability-only) without risking an
   * unsupported claim about the company being personalized to.
   */
  serviceProfile: { targetCustomer: string; geography: string };
}

/**
 * Generates the Personalization artifact's prose fields from
 * already-selected evidence and the Opportunity's own offer. Pure: never
 * calls `suggestOffers()`, never invents a service, never fabricates a
 * fact beyond what `evidence`/`offer` already state.
 */
export function generatePersonalization(
  input: PersonalizationGeneratorInput,
): PersonalizationGeneration {
  const sentences = input.evidence.map(sentenceFor);
  const openingContext = `${input.companyName} — ${sentences.join('; ')}.`;

  const valueProposition =
    `${input.offer.service} is the recommended fit: ${input.offer.rationale}`.trim();

  const observedCount = input.evidence.filter((item) => item.classification === 'OBSERVED').length;
  const inferredCount = input.evidence.filter((item) => item.classification === 'INFERRED').length;
  const personalizationRationale =
    `Generated from ${input.evidence.length} qualifying research signal(s) ` +
    `(${observedCount} observed, ${inferredCount} inferred) that back the recommended offer ` +
    `"${input.offer.service}" (fit ${input.offer.fit}/100) against the service profile ` +
    `targeting ${input.serviceProfile.targetCustomer} in ${input.serviceProfile.geography}.`;

  return {
    offerService: input.offer.service,
    openingContext,
    valueProposition,
    personalizationRationale,
    evidence: input.evidence,
  };
}
