# Service Fit — Ranking Factor, Not an Eligibility Gate — Product Owner Decision

**Decision ID:** CF-SERVICE-FIT-RANKING-NOT-ELIGIBILITY-PO-DEC-001
**Related decisions:** `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001`, `CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001`, `CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001`, `CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001`, `CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`, `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`, `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001`
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle level. Does **not** define a Service Fit formula, weight, threshold, or ranking algorithm.

## Governance audit performed before recording — conflict check

Audited before writing this file:

- `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001` — defines Service Fit = Capability Fit. Its own Non-scope section explicitly states it does **not** "decide elimination, ranking, or Top-N behavior." No conflicting elimination language found.
- `CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001` — folds subservice relevance into Service Fit. Its own Non-scope section explicitly states it does **not** "decide whether Service Fit (with subservice relevance folded in) participates in elimination, ranking, or both." No conflicting elimination language found.
- `CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001`, `CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001`, `CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`, `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`, `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001` — reviewed; none asserts that Service Fit eliminates opportunities, and all are consistent with the "discover broadly → show evidence → rank → freelancer decides" philosophy this decision formalizes for Service Fit specifically.
- `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` — the seven-factor scoring model treats `serviceFit` as one of seven weighted scoring inputs (15% weight) contributing to a composite `OpportunityScore`, not as a standalone pass/fail gate. Consistent with ranking usage; no conflicting elimination language found.
- PRD V2.2 (`AI Client Acquisition OS — Product Requirements Document V2.2.md`, R-14, seven-factor table) — lists `serviceFit` as a weighted scoring factor only. No eligibility-gate language found.
- `CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md`, `CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md` — reference Service Fit/`serviceFit` only in relation to entity reality and evidence attribution, not elimination.

**No conflict found.** No existing governance, requirements, or PRD record asserts that Service Fit may eliminate an opportunity. The only prior references to "elimination" regarding Service Fit are in the two cited decisions' own Non-scope sections, which explicitly left the elimination-vs-ranking question open rather than deciding it either way. This decision resolves that previously-open question.

## Decision

SERVICE FIT / CAPABILITY FIT AFFECTS RANKING AND PRIORITIZATION ONLY. IT MUST NOT BE A HARD LEAD-ELIGIBILITY GATE.

For a discovered opportunity:

- Strong Service Fit may rank higher.
- Weak Service Fit may rank lower.
- Uncertain Service Fit — the lead remains eligible and may still be shown.
- No Service Fit evidence — the lead must not automatically be eliminated.

The freelancer retains final judgment about whether the opportunity is worth pursuing.

### Conceptual separation preserved

- **Need / Opportunity Gap** — is there a credible underlying problem, requirement, change, need, or opportunity?
- **Service Fit / Capability Fit** — can the freelancer's selected top-level service, considering its predefined subservices internally, reasonably address that identified opportunity?
- **Ranking / Prioritization** — given the available evidence and dimensions, how prominently should the opportunity be presented?

Service Fit contributes to ranking/prioritization, not basic lead eligibility.

### Product philosophy

Consistent with the established Client Finder principle: discover opportunities broadly → preserve and show evidence → use ranking to help prioritize → let the freelancer make the final decision. A low or uncertain Service Fit assessment must not silently discard a potentially useful opportunity.

## Relationship to existing decisions

- Builds on and is consistent with `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001` and `CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001`; resolves the elimination-vs-ranking question both left open in their Non-scope sections. Does not reopen, reinterpret, or rewrite either decision's definition of what Service Fit is.
- Consistent with `CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001`'s evidence philosophy (show evidence → let the freelancer decide) and `CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`'s parallel "ranking factor, not eligibility gate" treatment of a different dimension.
- Consistent with `CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001`, `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`, and `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001`.

## Non-scope / explicit non-decisions

This record does **not** decide or authorize:

- The `serviceFit` formula, weights, or thresholds.
- Deterministic vs. AI determination of Service Fit.
- The exact subservice-relevance mechanism.
- The ranking algorithm or Top-N values.
- AI escalation criteria.
- Eligibility rules unrelated to Service Fit.
- Any code, configuration, schema, prompt, test, or data change.

## Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation of any kind. No code, configuration, schema, prompt, test, or data has been changed. Nothing has been committed or pushed.
