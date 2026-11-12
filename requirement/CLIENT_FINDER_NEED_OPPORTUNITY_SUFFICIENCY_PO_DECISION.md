# CLIENT FINDER — NEED/OPPORTUNITY EVIDENCE SUFFICIENCY (K5-D1) — PRODUCT OWNER DECISION

**Decision ID:** CF-NEED-OPPORTUNITY-SUFFICIENCY-PO-DEC-001
**Related decisions/documents:** `requirement/CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md` (PO Decision 1, Options A-D, where this selection was prepared); `requirement/CLIENT_FINDER_PHASE_K5_IMPLEMENTATION_READINESS_AUDIT.md` (confirms the selected option is implementable and bounded in scope); `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002` (Service+Geography-only NEW-search input, unaffected); R-70/R-71 (opportunity-adapter rules, unaffected — see Mandatory boundaries).
**Decision title:** For NEW Service+Geography searches, `NEED_DETECTED` requires a credible-need evidence-sufficiency gate beyond catalogue-keyword/trigger match alone
**Date:** 2026-10-24
**Authority:** Product Owner
**Status:** DECIDED
**Selected option:** Option C (of the four options presented in `CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md` §3) — "YES, but only from stronger approved evidence"
**Scope of this record:** Formally documents a decision that was already made and is already implemented in production code prior to this record's creation. This record does not authorize new implementation, redesign, or any change to the cited code — it records, for the governance trail, the decision the existing implementation already reflects.

## Context

`CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md` found that, prior to this decision, `NEED_DETECTED` for NEW Service+Geography-only searches was driven entirely by `suggestOffers()`'s trigger-kind-plus-keyword-substring match (`packages/core-acquisition/src/offer.ts`) — a simple keyword-coincidence classifier, independent of signal classification (OBSERVED vs. INFERRED) or confidence. The preparation document presented four options (A: accept system-catalogue signals as sufficient; B: make Need/Opportunity optional/UNKNOWN-permitting; C: require a stronger, independently-defined evidence bar; D: other) and asked the PO to select one. The implementation-readiness audit (`CLIENT_FINDER_PHASE_K5_IMPLEMENTATION_READINESS_AUDIT.md`) subsequently confirmed Option C is architecturally consistent with R-71 and the existing OBSERVED/INFERRED/confidence vocabulary, identified a structurally analogous precedent already in the codebase (`hasStrongSignalBypass()`'s "≥2 independent signals at top reliability" pattern in `packages/core-research/src/admission.ts`), and bounded the implementation scope to `packages/core-opportunity/src/service.ts`/`adapters.ts` only, with no overlap with Global Entity, Phase 7B, Phase 8, or the ₹1,499 commercial architecture.

**The PO selected Option C.** It is now implemented as `hasCredibleNeedEvidence()` in `packages/core-opportunity/src/adapters.ts:240-258`, called from `packages/core-opportunity/src/service.ts:185-188`.

## PO decision

**For NEW Service+Geography searches, a candidate may establish Need/Opportunity only when the existing R-70/R-71 evidence framework is satisfied and the credible-need sufficiency gate is met.**

1. The implemented sufficiency requirement is:
   - at least two independent matched signals;
   - the signals must come from distinct approved observation fields (`distinctFields.size >= 2`, `adapters.ts:252-253`);
   - at least one signal must be OBSERVED (not INFERRED);
   - that OBSERVED signal must retain full, undiscounted confidence (`classification === 'OBSERVED' && confidence >= OBSERVED_FACT_CONFIDENCE`, `adapters.ts:256`, using the same `OBSERVED_FACT_CONFIDENCE` constant imported from `@acos/core-research` that the Phase 5 admission gate's `hasStrongSignalBypass()` already uses).
2. This is an evidence-sufficiency gate, not a new ranking score. It produces a boolean (does credible evidence exist), never a weighted or numeric value, and does not feed `rankByUniversalProfile` or any ranking dimension directly.
3. It does not change R-70 or R-71. `hasCredibleNeedEvidence()` operates on whatever signals `eligibleRows()`/`toOfferSignals()` (R-70/R-71's own filtering) already allowed through — it narrows further within that set; it does not loosen, bypass, or duplicate R-70/R-71's own logic.
4. It does not make AI mandatory. The gate is evaluated over whatever signals exist, deterministic or AI-derived, with no required AI call of its own.
5. Deterministic evidence remains valid. A deterministic-only signal set (e.g. an absent-SSL observation) that independently meets the two-distinct-fields/one-OBSERVED-full-confidence bar satisfies the gate with zero AI involvement.
6. Google Places status alone cannot establish Need/Opportunity. A `GOOGLE_PLACES_STATUS` signal is not, by itself, sufficient to satisfy the two-distinct-field requirement, and the deterministic trigger-matching rule does not treat Places status as a Need trigger.
7. No fabricated lead or weak inference is manufactured to satisfy the gate. The gate only counts signals already persisted through the existing, unmodified Research/signal-persistence pipeline; it introduces no new signal-generation mechanism.
8. Historical-style searches retain their previously authorized behavior, unchanged. `service.ts:185`'s `isHistoricalStyleSearch = parseTargetSegments(search.parameters.targetCustomer).length > 0` carve-out means a historical-style search (one with a real, non-sentinel `targetCustomer`) reaches the offer/need path via `isHistoricalStyleSearch || hasCredibleNeedEvidence(...)` — the sufficiency gate is additive only for NEW Service+Geography searches, and does not narrow or alter what historical searches could already do.

## Relationship to R-70/R-71

R-70/R-71 operate at the field-selection stage, inside `eligibleRows()`/`toOfferSignals()` (`adapters.ts`), before any signal reaches `suggestOffers()` or this sufficiency gate. This decision's gate is evaluated strictly after R-70/R-71 have already run, on the signals they already allowed through. R-70/R-71's own rules, thresholds, and field exclusions (e.g. the `TOPICAL_FIELDS` exclusion of `companySummary`/`businessModel`/`targetCustomers`) are unchanged and unaffected by this decision.

## Mandatory boundaries on this decision

1. This is a governance/documentation decision only, recording an already-made PO selection and its already-existing implementation.
2. No code, configuration, `.env`, database schema, or data change is authorized, introduced, or implied by this record.
3. R-70 and R-71 are not changed, reinterpreted, or reopened by this record.
4. Service+Geography-only NEW-search input (`CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002`) is not changed or reopened.
5. Qualification, ranking, Global Entity architecture, Phase 5 admission, and Scenario E are not changed, reinterpreted, or reopened by this record — confirmed disjoint in scope by `CLIENT_FINDER_PHASE_K5_IMPLEMENTATION_READINESS_AUDIT.md` §5.
6. No AI mechanism, provider, model, or cost ceiling is authorized, changed, or reinterpreted by this record.

## Explicit non-decisions

This record does **not** decide or authorize:

- Any specific value for `OBSERVED_FACT_CONFIDENCE` or any other confidence threshold beyond what is already implemented and cited above.
- Any change to `suggestOffers()`'s own trigger/keyword matching logic (`packages/core-acquisition/src/offer.ts`) — this decision gates on its output, it does not alter it.
- Any change to R-70/R-71, qualification, ranking, Global Entity architecture, Phase 5 admission, or Scenario E.
- Any test file rewrite — K5-D1's effect on pre-existing stale fixtures (e.g. tests that relied on simple keyword-coincidence evidence) is a separately-scoped engineering/test-authoring matter, not decided here.
- Any new production API, route, or freelancer-facing field.

## Historical behavior

Unchanged. Historical-style searches (those with a real, non-sentinel `targetCustomer`) continue to reach the offer/need path exactly as they did before this decision, via the `isHistoricalStyleSearch` carve-out described above.

## Implementation status

**ALREADY IMPLEMENTED.** `hasCredibleNeedEvidence()` is implemented at `packages/core-opportunity/src/adapters.ts:240-258` and wired into `packages/core-opportunity/src/service.ts:185-188`, confirmed present in the current working tree. This record does not authorize new implementation — it documents the decision the existing code already reflects. No code, test, migration, or schema file was changed to produce this record.
