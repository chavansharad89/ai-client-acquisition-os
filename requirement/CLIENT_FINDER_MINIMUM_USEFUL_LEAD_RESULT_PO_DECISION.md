# Minimum Useful Lead Result — Product Owner Decision

**Decision ID:** CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001
**Related decisions:** [CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001](CLIENT_FINDER_NEED_OPPORTUNITY_GAP_SERVICE_INDEPENDENCE_PO_DECISION.md) (evidence → show → let freelancer decide philosophy, extended here into a concrete minimum-content list), [CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001](CLIENT_FINDER_SERVICE_FIT_CAPABILITY_FIT_PO_DECISION.md), [CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001](CLIENT_FINDER_TOP_LEVEL_SERVICE_ONLY_SUBSERVICES_INTERNAL_PO_DECISION.md) (relevant predefined subservice(s)), [CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md), [CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_COMMERCIAL_CONTACT_READINESS_RANKING_NOT_ELIGIBILITY_PO_DECISION.md), consolidated in [CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md)
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle/product-requirement level. Does **not** specify a UI layout, API shape, or database schema.

## Governance audit performed before recording

No existing decision record defines a minimum-information requirement for a presented lead result. The repository's existing evidence-quality/confidence model (claims classified OBSERVED/INFERRED/UNKNOWN with 0–100 confidence and provenance — quote/sourceUrl) is compatible, cross-cutting infrastructure this requirement can draw "source/date/provenance context" from; this decision does not redefine that model. No conflicting prior decision was found.

## Decision

EACH DISCOVERED LEAD SHOULD PROVIDE ENOUGH INFORMATION FOR THE FREELANCER TO ANSWER: "WHY SHOULD I CONTACT THIS BUSINESS?"

The minimum useful result should aim to expose:

1. the entity;
2. why the system found it;
3. supporting evidence;
4. the identified Need/Opportunity;
5. potential Service Fit / Capability Fit;
6. relevant predefined subservice(s), where applicable;
7. available usable contact information;
8. important missing information where relevant; and
9. source/date/provenance context sufficient for the freelancer to judge the evidence.

This is a product requirement/principle, not a UI implementation specification. The product should not require the freelancer to trust an opaque AI score in order to understand why the lead was surfaced.

## Relationship to existing decisions

- Extends `CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001`'s philosophy (find evidence → show the evidence and the potential opportunity → let the freelancer decide) into a concrete minimum-content list for how a lead is presented.
- Item 5 ("potential Service Fit / Capability Fit") and item 6 ("relevant predefined subservice(s)") reference, and do not reopen or reinterpret, `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001` and `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`.
- Items 7–8 (contact information, present or missing) reference, and do not reopen, `CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`.
- Item 1 ("the entity") presupposes, and does not reopen, `CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001`.
- Item 9 ("source/date/provenance") draws on, and does not redefine, the existing OBSERVED/INFERRED/UNKNOWN evidence-confidence model.

## Non-scope / explicit non-decisions

This record does **not** decide or authorize:

- A UI layout, component design, or page specification.
- An API response shape or database schema change.
- A scoring/confidence formula, numeric weighting, or opaque-score replacement mechanism.
- Any elimination rule, ranking formula, or implementation architecture.
- Any code, configuration, schema, prompt, test, or data change.

## Forward cross-reference (added 2026-10-13)

`CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001` (`CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md`) resolves a genuine silence in this record regarding field provenance: a candidate that never reaches AI escalation (deterministic-only) **can and must** still be able to satisfy this Minimum Useful Lead Result. Where a field above (e.g. item 2, "why the system found it") would otherwise be populated from an AI call, a deterministic-only candidate populates it from the deterministic signal(s) that drove discovery/ranking instead, and any field genuinely unavailable without AI is disclosed via the existing "important missing information" item (8) and the OBSERVED/INFERRED/UNKNOWN provenance model (item 9) — never by withholding the candidate. This record's nine content requirements and their non-scope boundaries are unmodified.

## Forward cross-reference (added 2026-10-16)

`CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001` (`CLIENT_FINDER_PHASE_7B_SUBSERVICE_RELEVANCE_AUTHORIZATION_PO_DECISION.md`) authorizes implementation of item 6 above ("relevant predefined subservice(s)"), including the specific deterministic matching mechanism and the approved bare-word/slash-split/spelling-variant vocabulary rules. This record's other eight content items, and its "not a UI/API/schema specification" scope, are otherwise unchanged.

## Implementation authorization status

NOT AUTHORIZED for items 1–5, 7–9 above. Item 6 ("relevant predefined subservice(s)") is authorized, for the specific mechanism described, by `CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001` (see forward cross-reference above). No other code, configuration, schema, prompt, test, or data change is authorized by this record. Nothing has been committed or pushed.
