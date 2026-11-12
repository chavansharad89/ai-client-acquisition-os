import type { StoredResearchSignal } from '@acos/core-research';

import { literalMatchTermsFor, SERVICE_CATALOG } from './serviceCatalog';

// Phase 7B — MULR item 6: relevant predefined subservices.
// -----------------------------------------------------------------------
// Deterministic only — no AI/LLM call, no synonym dictionary, no new
// Research/Discovery pass. Reuses R-71's existing field-membership
// boundary (adapters.ts's TOPICAL_FIELDS) rather than inventing a second
// evidence-relevance mechanism: a catalogue term counts as evidence of a
// subservice need only when it occurs, as an approved literal, inside a
// non-UNKNOWN signal from one of the six problem/opportunity-shaped
// Research fields below — never from a topical/state field, a quote, a
// categoryPlausibility verdict, or a gap entry.
// -----------------------------------------------------------------------

const PROBLEM_OPPORTUNITY_FIELDS = new Set([
  'visibleProblems',
  'growthOpportunities',
  'aiOpportunities',
  'websiteIssues',
  'contentOpportunities',
  'automationOpportunities',
]);

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Case-insensitive whole-phrase match: `term` must appear bounded by
 *  word boundaries, not as a fragment of a longer word. */
function buildTermRegExp(term: string): RegExp {
  return new RegExp(`\\b${escapeRegExp(term)}\\b`, 'i');
}

/**
 * Deterministically identifies which of `topLevelService`'s catalogue
 * sub-services are evidenced by `signals`, per the matching mechanism
 * authorized in CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001
 * D2.
 *
 * Scoping (D2): `topLevelService` must exactly match (case-insensitively)
 * one of SERVICE_CATALOG's 17 family names — the freelancer's own single
 * selected top-level service. A sub-service from any other family can
 * never be attached. If `topLevelService` does not resolve to exactly
 * one catalogue family, no subservices can be safely scoped, and this
 * returns an empty array rather than guessing.
 *
 * Returns the matched sub-services' exact catalogue names, deduplicated,
 * in catalogue order — never a new result category, never fed back into
 * ranking/eligibility/escalation (D2).
 */
export function matchRelevantSubservices(
  topLevelService: string,
  signals: readonly StoredResearchSignal[],
): readonly string[] {
  const family = SERVICE_CATALOG.find(
    (candidate) => candidate.name.toLowerCase() === topLevelService.trim().toLowerCase(),
  );
  if (!family) return [];

  const evidenceTexts = signals
    .filter(
      (row) =>
        row.classification !== 'UNKNOWN' &&
        row.signal !== null &&
        PROBLEM_OPPORTUNITY_FIELDS.has(row.field),
    )
    .map((row) => row.signal as string);

  if (evidenceTexts.length === 0) return [];

  const matched: string[] = [];
  for (const subservice of family.subservices) {
    const terms = literalMatchTermsFor(subservice);
    if (terms.length === 0) continue; // generic bare-word exclusion

    const isMatched = terms.some((term) => {
      const pattern = buildTermRegExp(term);
      return evidenceTexts.some((text) => pattern.test(text));
    });
    if (isMatched) matched.push(subservice);
  }

  return matched;
}
