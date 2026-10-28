# Universal Five-Dimension Framework — Consolidation — Product Owner Decision

**Decision ID:** CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001
**Related decisions:** [CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md), [CF-CURRENT-ACTIVITY-CONTEXTUAL-EVIDENCE-PO-DEC-001](CLIENT_FINDER_CURRENT_ACTIVITY_CONTEXTUAL_EVIDENCE_PO_DECISION.md), [CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001](CLIENT_FINDER_NEED_OPPORTUNITY_GAP_SERVICE_INDEPENDENCE_PO_DECISION.md), [CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001](CLIENT_FINDER_SERVICE_FIT_CAPABILITY_FIT_PO_DECISION.md) (+ [CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001](CLIENT_FINDER_SERVICE_FIT_SUBSERVICE_UNIFICATION_PO_DECISION.md), [CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001](CLIENT_FINDER_TOP_LEVEL_SERVICE_ONLY_SUBSERVICES_INTERNAL_PO_DECISION.md)), [CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_COMMERCIAL_CONTACT_READINESS_RANKING_NOT_ELIGIBILITY_PO_DECISION.md), [CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001](CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md), [CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001](CLIENT_FINDER_SINGLE_SERVICE_PER_SEARCH_PO_DECISION.md), [CF-CROSS-SERVICE-EVIDENCE-APPLICABILITY-PO-DEC-001](CLIENT_FINDER_CROSS_SERVICE_EVIDENCE_APPLICABILITY_PO_DECISION.md)
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle level. This is the first record to name all five dimensions together as the product's universal framework and state the consolidated philosophy; it decides no new scoring mechanism and reopens none of the records it cross-references.

## Governance audit performed before recording

A prior read-only governance audit (2026-10-11) found that no existing record named all five proposed dimensions together or asserted they should be universal across the 17 service families, even though `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`'s "Relationship to the universal framework" section already referred informally to "the five-dimension framework (Entity Reality, Current Activity, Observable Need/Gap, Service Fit, Commercial/Contact Readiness)" without that framework having its own governance record. This decision supplies that missing formal record. It does not rewrite or supersede the informal reference in `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`; a cross-reference has been added there pointing to this record (see that file's "Relationship to the universal framework" section).

No terminology conflict was found between the five dimension names used here and any existing decision. The one pre-existing name collision in this area ("Service Fit" meaning two different things) was already identified and resolved by `CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001` and `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001`; this record does not reopen that resolution.

## Decision

Preserve the following conceptual structure as the Client Finder universal framework:

1. Entity Reality
2. Current Activity
3. Need / Opportunity Gap
4. Service Fit / Capability Fit
5. Commercial / Contact Readiness

Current PO principles:

- Entity Reality establishes whether the entity is real/identifiable (`CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001`).
- Current Activity provides contextual evidence and is not a mandatory gate (`CF-CURRENT-ACTIVITY-CONTEXTUAL-EVIDENCE-PO-DEC-001`).
- Need/Opportunity Gap is service-independent (`CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001`). Multiple relevant, mutually reinforcing evidence items may establish or strengthen a Need/Opportunity Gap even when no single item independently proves the need. Absence of evidence must not automatically be interpreted as proof of a need.
- Service Fit = Capability Fit for the selected top-level service, considering all predefined subservices internally (`CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001`, `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`).
- Contactability affects ranking, not lead eligibility (`CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`). Lack of contact information must not eliminate an otherwise credible lead.

The overall product philosophy is: discover potentially valuable opportunities → gather and show the evidence → explain the potential opportunity and service fit → let the freelancer decide.

Do not turn these principles into a complex scoring/confidence framework unless separately authorized by the Product Owner.

## Relationship to existing decisions

This record consolidates and cross-references, without rewriting, reinterpreting, or superseding:

- `CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001`
- `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001`
- `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`
- `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`
- `CF-CROSS-SERVICE-EVIDENCE-APPLICABILITY-PO-DEC-001`

It also introduces, as the first-named owners of the two previously-gapped dimensions, `CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001` and `CF-CURRENT-ACTIVITY-CONTEXTUAL-EVIDENCE-PO-DEC-001`, and the ranking-vs-eligibility principle for the fifth dimension, `CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`. `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001` is a related but distinct product requirement governing result presentation, not a sixth dimension.

The single-service-per-search and cross-service-evidence-applicability decisions are unaffected: the five dimensions are evaluated within the authoritative service context of a single search, per those records.

## Non-scope / explicit non-decisions

This record does **not** decide or authorize:

- Any numeric score, confidence formula, weight, or threshold for any dimension.
- Any elimination rule, ranking formula, or implementation architecture.
- Any change to the existing seven-factor scoring model or its weights.
- Any reinterpretation of `CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001`'s or `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001`'s resolution of the "Service Fit" terminology collision.
- Any code, configuration, schema, prompt, test, or data change.

## Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation of any kind. No code, configuration, schema, prompt, test, or data has been changed. Nothing has been committed or pushed.
