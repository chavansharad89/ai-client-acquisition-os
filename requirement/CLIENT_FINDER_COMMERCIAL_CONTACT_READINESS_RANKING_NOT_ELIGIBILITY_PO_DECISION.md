# Commercial / Contact Readiness — Ranking Factor, Not an Eligibility Gate — Product Owner Decision

**Decision ID:** CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001
**Related decisions:** `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` Decision D (four-factor deferral: `icpFit`, `abilityToPay`, `urgency`, `contactability` remain `UNKNOWN`/neutral for MVP Exit — existing, strongly compatible precedent; see conflict note below), consolidated in [CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md)
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle level. Does **not** define a contactability score, weight, or ranking formula.

## Governance audit performed before recording — conflict check

`CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` (Decision D, "EXPLICIT FOUR-FACTOR DEFERRAL") already authorized `contactability` (one of the seven scoring factors) to remain structurally neutral/`UNKNOWN` for MVP Exit, explicitly because the data sources to populate it do not yet exist — and that document already reasons from a "don't auto-eliminate on missing data" posture.

**No conflict found; this decision is directly consistent with and formalizes that existing posture as explicit product philosophy.** This decision does **not** reopen, reinterpret, or change Decision D's MVP-scoring deferral, does **not** authorize any enrichment work for `icpFit`/`abilityToPay`/`urgency`/`contactability` (enrichment remains governed solely by that document), and does **not** change the existing seven-factor weights (`contactability` at 5%, or any other factor).

## Decision

COMMERCIAL / CONTACT READINESS IS NOT A MANDATORY LEAD-ELIGIBILITY GATE.

A real entity with a credible Need/Opportunity Gap remains eligible to be shown as a lead even when no contact information is available.

Available contact information should be surfaced when present. Missing contact information should be explicitly indicated rather than causing the lead to be discarded.

Contactability affects ranking/prioritization, not eligibility. If two otherwise comparable opportunities exist, the opportunity with usable contact information should rank higher than the one without it.

Do not establish a numeric contactability score or fixed weight yet.

## Relationship to existing decisions

- Consistent with and reinforces `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` Decision D. Does not reopen or change that decision's deferral status, weights, or enrichment-authorization boundary.
- Consistent with `CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001`'s evidence philosophy (show evidence → let the freelancer decide).

## Non-scope / explicit non-decisions

This record does **not** decide or authorize:

- A contactability score, weight, or ranking formula.
- Any enrichment work (new data sources, providers, scrapers, or LLM calls) for `icpFit`, `abilityToPay`, `urgency`, or `contactability` — unchanged from Decision D.
- Any change to the existing seven-factor scoring algorithm or weights.
- Any elimination rule or implementation architecture.
- Any code, configuration, schema, prompt, test, or data change.

## Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation of any kind. No code, configuration, schema, prompt, test, or data has been changed. Nothing has been committed or pushed.
