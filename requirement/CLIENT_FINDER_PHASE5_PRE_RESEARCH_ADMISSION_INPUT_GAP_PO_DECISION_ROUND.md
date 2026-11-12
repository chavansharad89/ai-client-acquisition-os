# CLIENT FINDER — PHASE 5 PRE-RESEARCH ADMISSION INPUT GAP — PRODUCT OWNER DECISION ROUND

**Decision ID:** CF-PHASE5-PRE-RESEARCH-ADMISSION-INPUT-GAP-PO-DEC-001
**Related decisions:** [CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001](CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md) (names this exact gap — "no deterministic elimination/ranking/cache/admission gate currently exists in front of either call" — this round is the PO response to that gap), [CF-DETERMINISTIC-OPPORTUNITY-LAYER-ITEM-9-STRONG-SIGNAL-BYPASS-PRINCIPLE-PO-DEC-001](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md) (defines the strong-signal bypass principle this round's PO-2 companion questionnaire fills a term for — see [CF-PHASE5-TOP-RELIABILITY-SIGNAL-CATEGORY-PO-DEC-PREP-001](CLIENT_FINDER_PHASE5_TOP_RELIABILITY_SIGNAL_CATEGORY_PO_DECISION_PREPARATION.md)), [CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md) (the five-dimension framework this round's PO-3 mapping mechanism connects signals to, unchanged by this round), [CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md) (Phase 2 elimination gate this round does not reopen), [CF-SIGNAL-FRESHNESS-PO-DEC-001](CLIENT_FINDER_SIGNAL_FRESHNESS_PO_DECISION.md) (sibling pattern: explicitly defers all Phase 5 AI-escalation/admission-gate authorization — this round is that separately gated authorization, scoped to pre-Research evidence acquisition only, not ranking or AI escalation itself)
**Decision title:** Provisional PO decisions for PO-1, PO-3, PO-4, PO-5 of the Phase 5 pre-Research admission input gap; PO-2 deferred to a separate questionnaire
**Date:** 2026-10-13
**Authority:** Product Owner
**Status:** PROVISIONAL. Decisions below are recorded for this decision round. **No implementation, migration, commit, or push is authorized by this record.** Phase 5 implementation remains blocked — see "Phase 5 implementation status."
**Scope of this record:** Records PO-1, PO-3, PO-4, PO-5 only. PO-2 ("top-reliability signal category") is explicitly NOT decided here — see the separate questionnaire record. Does not change the five-dimension framework, opportunity eligibility, K1, ₹499, ₹1,499/auth/payment/subscription, or Google Places field mask.

## Context

The architecture-gap report for Phase 5 (AI escalation / admission gate) identified that `eliminateDeterministically()` (Phase 2) and `createWebDevelopmentSignalCatalogue()` (Phase 1, `packages/core-research/src/deterministicSignals.ts`) both expect deterministic-signal input derived from a fetched source document, but the only component that produces that input — `SourceDocumentProvider.fetchSourceDocuments()` — is invoked exclusively from inside the Research-stage `ResearchProvider` implementations (`anthropicResearchProvider.ts:58`, `fallbackResearchProvider.ts:82`), which run strictly *after* elimination in the worker's per-prospect loop (`apps/worker/src/searchWorker/worker.ts:420-423`). Today, `eliminateDeterministically(candidate, [])` is called with a literal empty array, with an explicit in-code comment that no signal is available at that point. This round's decisions (PO-1, PO-3, PO-4) authorize, at the decision level only, closing that structural gap. PO-5 is an unrelated, explicitly deferred item raised in the same gap report.

## PO-1 — Pre-Research evidence acquisition

**DECISION: APPROVED.**

Option A is approved: every discovered prospect may have its public homepage fetched before AI admission, so that deterministic evidence can be produced before the Phase 5 admission gate. This is an explicit amendment/extension of the Phase 1 runtime behavior described in `CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001` and the deterministic-signal foundation.

**Boundaries (binding on implementation):**

1. The fetch is non-LLM/non-AI.
2. Reuse the existing `SourceDocumentProvider` (`packages/core-research/src/sourceDocumentProvider.ts`) where possible — no new fetch mechanism.
3. Do not introduce new heuristic signals merely to make admission work. Only the already-implemented deterministic signal(s) (currently: absent SSL/TLS, `detectAbsentSsl()`) may be evaluated against the pre-fetched document.
4. Do not change the universal five-dimension framework.
5. Do not change opportunity eligibility. (The only signal this authorizes evaluating pre-Research — absent SSL/TLS — is tagged `NEED_OPPORTUNITY_GAP`, not `ENTITY_REALITY`; `eliminateDeterministically()`'s elimination gate only acts on `ENTITY_REALITY`-dimension evidence, so feeding this signal in place of `[]` does not change elimination outcomes.)
6. Do not change K1.
7. Do not change ₹499.
8. Do not change ₹1,499/auth/payment/subscription.
9. Do not introduce cross-freelancer caching.
10. Do not introduce new schema unless a later implementation step proves it is genuinely required (see "Confirmation: no migration currently required" below).
11. Failure must not cause an otherwise valid search to fail merely because a pre-admission fetch failed. (Consistent with `createHttpSourceDocumentProvider()`'s existing failure semantics: permanent/unusable fetch failures already resolve to `[]`, not a thrown error — the pre-admission caller must treat `[]` as "no pre-Research evidence," not as a pipeline failure.)
12. Preserve provenance and existing evidence semantics (`SourceDocument`, `DeterministicSignal` shapes unchanged).

## PO-2 — Top-reliability signal category

**STATUS: NOT YET DECIDED.** See the separate questionnaire: [CLIENT_FINDER_PHASE5_TOP_RELIABILITY_SIGNAL_CATEGORY_PO_DECISION_PREPARATION.md](CLIENT_FINDER_PHASE5_TOP_RELIABILITY_SIGNAL_CATEGORY_PO_DECISION_PREPARATION.md). No definition is chosen, assumed, or implied by this record.

## PO-3 — Signal-to-dimension mapping

**DECISION: APPROVED IN PRINCIPLE.**

Authorizes the missing deterministic signal → universal-dimension mapping mechanism needed to connect actually-implemented deterministic signals to the approved five-dimension framework.

**Boundaries (binding on implementation):**

1. Do not invent new signals.
2. Do not add new signal types merely to populate dimensions.
3. Do not change the existing universal framework.
4. Do not introduce numeric weights.
5. Do not make deterministic signals an eligibility gate unless already authorized (they are not; `eliminateDeterministically()` remains the sole, unmodified eligibility gate per `CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001`).
6. Existing Phase 1 signal semantics remain authoritative.

**Enumeration required before coding (per PO-3's own condition):** the implementation proposal must first enumerate every currently implemented deterministic signal and its exact proposed mapping. That enumeration, as it stands today, is:

| Signal | Producer | Dimension (already tagged) | Confidence | Status |
|---|---|---|---|---|
| Absent SSL/TLS | `detectAbsentSsl()`, `packages/core-research/src/deterministicSignals.ts:78-91` | `NEED_OPPORTUNITY_GAP` | `OBSERVED_FACT_CONFIDENCE` (100, fixed) | Implemented in `createWebDevelopmentSignalCatalogue()` (Web Development service family only); not wired into any caller today |

This is the only deterministic signal in the codebase. No signal exists today for `ENTITY_REALITY`, `CURRENT_ACTIVITY`, `SERVICE_FIT_CAPABILITY_FIT`, or `COMMERCIAL_CONTACT_READINESS`, and none is authorized to be invented by this decision. The "missing mechanism" PO-3 authorizes is therefore not a new mapping table (the signal already self-declares its dimension) — it is wiring the already-tagged dimension through to where it is currently discarded: `packages/core-opportunity/src/service.ts`'s `buildRankingProfile()` (lines 259-287) hardcodes `needOpportunity` and the other three unmapped `UniversalRankingProfile` dimensions to UNKNOWN today because, per its own comment, the Phase 1 catalogue "is not yet reachable here."

## PO-4 — Duplicate homepage fetch

**DECISION: AVOID IF BOUNDED.**

The pre-Research fetch (PO-1) and the subsequent Research call must not unnecessarily download the same homepage twice. This must not be broadened into a general `ResearchProvider` redesign.

**Smallest bounded mechanism identified (not yet implemented):** `ResearchProviderInput`/`ResearchDeps` (`packages/core-research/src/provider.ts:12-54`) would gain one additional optional field — e.g. `suppliedSourceDocuments?: readonly SourceDocument[]` — populated by the worker when PO-1's pre-admission fetch already succeeded. Both `createAnthropicResearchProvider()` (`anthropicResearchProvider.ts:58-61`) and the fallback-chain provider (`fallbackResearchProvider.ts:82`) would check this field before calling `deps.sourceDocuments.fetchSourceDocuments(...)`; if populated, they use the supplied documents directly (preserving existing minimum-length/empty-result semantics) instead of re-fetching; if absent, they fall back to fetching exactly as today. This is additive to an existing, already-optional-field-bearing input shape and changes no public contract behavior for any caller that does not supply the new field.

This does not require a material interface redesign and is reported here, per PO-4's own instruction, rather than implemented.

## PO-5 — Google Places expansion

**DECISION: DEFER.**

The Google Places field mask is not widened in Phase 5. No rating, reviews, business status, opening hours, address, or other Places fields are added. `core-discovery` is not modified for this purpose. This is recorded as a separate, future Discovery-layer authorization opportunity, unrelated to PO-1 through PO-4.

## Proposed implementation boundary (resulting from PO-1, PO-3, PO-4)

- A pre-admission step is inserted between Discovery and the existing `eliminateDeterministically()` call in the worker's per-prospect loop, calling the existing `SourceDocumentProvider` to fetch the homepage and, on success, evaluating it against `createWebDevelopmentSignalCatalogue()` to produce `DeterministicSignal[]` (replacing the current literal `[]`).
- The resulting signals are passed to `eliminateDeterministically()` unchanged in its own semantics (it still only acts on `ENTITY_REALITY`-dimension evidence, of which there is none, so elimination outcomes are unchanged by this round).
- The same signals' already-declared dimension tags are threaded through to `buildRankingProfile()` so it stops hardcoding UNKNOWN for dimensions a live signal actually covers (`NEED_OPPORTUNITY_GAP`, today).
- The pre-fetched `SourceDocument` is threaded into `ResearchProviderInput`/`ResearchDeps` so Research reuses it instead of re-fetching (PO-4).
- No AI/LLM call, no new signal type, no numeric weight, no eligibility change, no schema change, no pricing/auth/payment/K1 change is introduced by this boundary.

## Deterministic signals currently implemented (full list)

As enumerated under PO-3: exactly one — absent SSL/TLS (`detectAbsentSsl()`), dimension `NEED_OPPORTUNITY_GAP`, service family "Web Development" only, confidence fixed at `OBSERVED_FACT_CONFIDENCE`. No other deterministic signal exists in `core-opportunity`, `core-discovery`, `core-research`, or the worker.

## Signal → dimension mapping after PO-3

| Signal | Dimension |
|---|---|
| Absent SSL/TLS | `NEED_OPPORTUNITY_GAP` |

No other mapping exists or is authorized; `ENTITY_REALITY`, `CURRENT_ACTIVITY`, `SERVICE_FIT_CAPABILITY_FIT`, and `COMMERCIAL_CONTACT_READINESS` remain unmapped pending future, separately-authorized signals.

## Files that would change if implementation proceeds

- `apps/worker/src/searchWorker/worker.ts` — insert pre-admission fetch/signal-evaluation call before the existing `eliminateDeterministically()` call (currently line 420); pass resulting signals onward to opportunity scoring.
- `packages/core-research/src/deterministicSignals.ts` — expose/adapt `createWebDevelopmentSignalCatalogue()` (or an equivalent evaluation entry point) for pre-Research use against a fetched `SourceDocument`.
- `packages/core-research/src/provider.ts` — add the optional supplied-source-documents field to `ResearchProviderInput`/`ResearchDeps` (PO-4).
- `packages/core-research/src/anthropicResearchProvider.ts` and `packages/core-research/src/fallbackResearchProvider.ts` — check for supplied documents before calling `fetchSourceDocuments()` (PO-4).
- `apps/worker/src/index.ts` — composition root: wire the pre-admission `SourceDocumentProvider` call and pass its result through to both elimination and Research deps.
- `packages/core-opportunity/src/service.ts` — `buildRankingProfile()` to accept and use the mapped `NEED_OPPORTUNITY_GAP` signal instead of hardcoding UNKNOWN (PO-3).

No other file is implicated by PO-1, PO-3, or PO-4. PO-5 touches no file (deferred).

## Confirmation: no migration currently required

No new schema is required by PO-1, PO-3, or PO-4 as scoped above. The pre-fetched `SourceDocument` and resulting `DeterministicSignal[]` use existing, already-defined shapes; the dimension tag already exists on each signal; `UniversalRankingProfile` and its storage (`opportunity_score.factors`, per the Phase 3 migration) are unchanged in shape. PO-1's own boundary (#10, above) already forbids new schema unless a later implementation step proves it genuinely required; nothing identified in this round proves that. PO-5 is deferred and touches no schema.

## Confirmation: unrelated work not touched

This round does not touch, change, or authorize any change to: ₹499, ₹1,499, K1, auth, payment, subscription, or any other work outside PO-1/PO-3/PO-4/PO-5 as scoped above.

## Explicit non-decisions

This record does **not** decide or authorize:

- PO-2 (top-reliability signal category) — separately gated, not decided here.
- Any code change, migration, commit, or push.
- Any ranking, AI-escalation, Top-N, or AI-budget mechanics (Phase 5's AI-admission layer itself remains ungated pending PO-2 and separate authorization).
- Any change to `eliminateDeterministically()`'s own elimination semantics, eligibility outcomes, the five-dimension framework, K1, or ₹499/₹1,499/auth/payment/subscription.
- Any Google Places field-mask widening or `core-discovery` change (PO-5, deferred).

## PHASE 5 IMPLEMENTATION STATUS

**PHASE 5 IMPLEMENTATION STATUS: STILL BLOCKED — TOP-RELIABILITY BYPASS DEFINITION REQUIRES PO DECISION.**

Do not implement anything under PO-1, PO-3, or PO-4 until PO-2 (top-reliability signal category) is separately answered. Nothing in this record authorizes implementation, migration, commit, or push.
