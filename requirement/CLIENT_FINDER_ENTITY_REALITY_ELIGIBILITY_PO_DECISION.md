# Entity Reality — Eligibility Determination — Product Owner Decision

**Decision ID:** CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001
**Related decisions:** [CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001](CLIENT_FINDER_NEED_OPPORTUNITY_GAP_SERVICE_INDEPENDENCE_PO_DECISION.md) (Need/Gap is service-independent; cited here for the entity-uncertainty-vs-missing-contact-info distinction), [CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001](CLIENT_FINDER_SERVICE_FIT_CAPABILITY_FIT_PO_DECISION.md), consolidated in [CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md) (this dimension's place in the five-dimension framework)
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle level. Does **not** define a deduplication algorithm, identity-collision mechanism, numeric Entity Reality score, threshold, or review-queue implementation.

## Governance audit performed before recording

A prior read-only governance audit (2026-10-11, consolidated five-dimension framework review) found that no existing decision record squarely owns "Entity Reality" as a product concept: identity-collision deduplication and the `R-70` evidence-attribution decision exist but address narrower, different questions (duplicate database rows; which claims are attributable to which source), not whether a discovered entity is genuine/real/identifiable at all. No conflicting prior decision was found. This record fills a previously identified governance gap; it does not rewrite, reinterpret, or supersede the deduplication or `R-70` records.

## Decision

ENTITY REALITY DETERMINES WHETHER THE OPPORTUNITY CAN REASONABLY BE TREATED AS A REAL, IDENTIFIABLE ENTITY RATHER THAN OBVIOUS NOISE OR AN UNUSABLE RESULT.

1. Clearly real/identifiable → eligible.
2. Clearly fake, duplicate, or unusable → exclude.
3. Uncertain/weakly identified but potentially real → do not automatically discard; preserve for review where practical.

Entity uncertainty must not be conflated with missing contact information. A real business with no contact information can still be a lead — that is governed separately by `CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`, not by this decision.

Do not introduce a numeric Entity Reality score or threshold at this stage.

## Relationship to existing decisions

- Consistent with `CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001`: that decision's evidence principle (find evidence → show it → let the freelancer decide) applies once Entity Reality has established the opportunity is a real entity worth evaluating at all. This decision does not reopen that record.
- Consistent with `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001` and its predecessors: Service Fit/Capability Fit questions presuppose a real entity exists; this decision does not reopen those records.
- Does not rewrite, reinterpret, or supersede any existing deduplication mechanism or `R-70` (evidence attribution).

## Non-scope / explicit non-decisions

This record does **not** decide or authorize:

- A deduplication algorithm or identity-collision mechanism.
- A numeric Entity Reality score, confidence value, or threshold.
- A "review queue" UI, workflow, or data model for uncertain/weakly-identified entities.
- Any elimination rule, ranking formula, or implementation architecture.
- Any code, configuration, schema, prompt, test, or data change.

## Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation of any kind. No code, configuration, schema, prompt, test, or data has been changed. Nothing has been committed or pushed.
