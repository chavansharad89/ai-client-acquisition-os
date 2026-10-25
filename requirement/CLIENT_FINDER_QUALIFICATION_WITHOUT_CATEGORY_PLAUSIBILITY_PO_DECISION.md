# CLIENT FINDER — QUALIFICATION WITHOUT CATEGORY PLAUSIBILITY — PRODUCT OWNER DECISION

**Decision ID:** CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001
**Related decisions:** [CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002](CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_BACKEND_DEFAULTS_PO_DECISION.md) D2 (target customer = Option C — no categoryPlausibility, no TCM for new searches), [CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001](CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_SEARCH_INPUT_PO_DECISION.md) (parent decision)
**Decision title:** Whether qualification may reach QUALIFIED for NEW Service+Geography searches when categoryPlausibility is deliberately absent by design
**Date:** 2026-10-18
**Authority:** Product Owner
**Scope of this record:** Governance-only. Resolves the qualification-consequence gap identified after `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002` D2 was implemented. Does **not** authorize implementation. Does **not** modify `evaluateQualification()`, personalization, outreach preparation, or historical-search behavior.

## Context

`CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002` D2 decided that NEW Service+Geography searches deliberately omit the target-customer Discovery clause and never produce a `categoryPlausibility` or `targetCustomerMatch` determination. Historical searches were left unchanged.

The existing qualification state machine treats `categoryPlausibility` as follows:

- `needDetected = false` → `NOT_QUALIFIED`
- `categoryPlausibility = MATCH` → `QUALIFIED`
- `categoryPlausibility = MISMATCH` → `NOT_QUALIFIED`
- `categoryPlausibility = UNKNOWN` / missing → `INSUFFICIENT_EVIDENCE`

Because D2 guarantees `categoryPlausibility` is always missing for NEW searches, every NEW-search Opportunity with `needDetected = true` was permanently capped at `INSUFFICIENT_EVIDENCE`, which also blocked personalization (gated on an explicit `QUALIFIED` state) and outreach preparation (chained off personalization). This consequence was not explicitly decided by D2 or any other existing governance record. The paid contact/unlock mechanism is unaffected by this gap and by this decision.

## PO decision

**Selected: Option A — Qualification may proceed without category plausibility.**

**Decided:** For NEW Service+Geography searches, the deliberate absence of `categoryPlausibility` (per D2) is treated as **not applicable** to qualification for this search type, not as `UNKNOWN`/missing evidence. Qualification may reach `QUALIFIED` when the remaining existing qualification criteria (other than `categoryPlausibility`) are satisfied. No new evidence criterion is invented. Option B (keep current behavior, permanently capping NEW searches at `INSUFFICIENT_EVIDENCE`) is **not adopted**.

## Exact authoritative wording

> For NEW Service+Geography Client Finder searches, where `categoryPlausibility` is deliberately absent by product design (per `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002` D2), that absence is treated as "not applicable" rather than "unknown" for purposes of qualification. Qualification for such Opportunities may reach `QUALIFIED` based on the remaining existing qualification criteria, without a `categoryPlausibility` determination. No new qualification criterion is introduced by this decision.
>
> Historical searches (any search for which `categoryPlausibility` is evaluated under prior governance) are unaffected. Their qualification rules — including the existing `UNKNOWN`/missing → `INSUFFICIENT_EVIDENCE` behavior — are unchanged.
>
> This decision does NOT itself authorize implementation.

## Exact scope

- **Applies to:** NEW Service+Geography searches only — i.e., searches created under the regime where `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002` D2 applies and `categoryPlausibility` is never produced.
- **Does not apply to:** historical searches. Any Opportunity whose search predates, or otherwise falls outside, D2's scope keeps the existing qualification behavior exactly as-is, including the existing `UNKNOWN`/missing `categoryPlausibility` → `INSUFFICIENT_EVIDENCE` mapping.
- **Does not change:** `evaluateQualification()`'s code, personalization's gating logic, outreach preparation's gating logic, or the paid contact/unlock mechanism. This record decides the product intent only; how `evaluateQualification()` (or its NEW-search caller) distinguishes "not applicable" from "unknown" is an engineering-planning detail not decided here.
- **Does not invent:** any new qualification evidence criterion, category-plausibility substitute, or default value standing in for `categoryPlausibility`.

## Mandatory boundaries on this decision

1. This is a governance/product-behavior decision only.
2. No code, configuration, `.env`, database schema, test, or data change is authorized by this decision.
3. `evaluateQualification()` is not modified by this decision.
4. Personalization is not modified by this decision.
5. Outreach preparation is not modified by this decision.
6. Historical-search qualification behavior is not modified by this decision.
7. This decision does not modify `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001`, `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002`, or any other existing governance record.

## Explicit non-decisions

This record does **not** decide or authorize:

- The exact mechanism by which engineering distinguishes a NEW search's "not applicable" state from a historical search's "unknown" state (e.g., a new state-machine branch, a search-type flag, a sentinel value) — engineering-planning detail.
- Any change to the remaining qualification criteria used to reach `QUALIFIED` for NEW searches.
- Any UI, code, test, schema, or migration change.
- Whether personalization or outreach-preparation content itself should differ for NEW vs. historical searches once gated open — only that the `QUALIFIED` gate may now be reachable.

## Consequences

- NEW-search Opportunities with `needDetected = true` are no longer permanently capped at `INSUFFICIENT_EVIDENCE` solely because `categoryPlausibility` is absent by design; they may reach `QUALIFIED` on the remaining criteria.
- Personalization and outreach preparation become reachable for NEW searches that satisfy the remaining qualification criteria, once implemented.
- Historical searches continue to behave exactly as before: a missing/`UNKNOWN` `categoryPlausibility` still yields `INSUFFICIENT_EVIDENCE` for them.
- The paid contact/unlock mechanism is unaffected.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED.** This record closes the product-owner decision on whether NEW-search qualification may proceed without `categoryPlausibility`. No code, configuration, `.env`, database schema, test, or data change is authorized by this record. `evaluateQualification()`, personalization, and outreach preparation remain unmodified. Nothing has been committed or pushed. A separate, explicit go-ahead to begin implementation is still required and has not been given by this record.
