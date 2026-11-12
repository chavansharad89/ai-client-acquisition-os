# CLIENT FINDER — PHASE 5 "TOP-RELIABILITY SIGNAL CATEGORY" — PRODUCT OWNER DECISION PREPARATION

**Decision ID:** CF-PHASE5-TOP-RELIABILITY-SIGNAL-CATEGORY-PO-DEC-PREP-001
**Related decisions:** [CF-PHASE5-PRE-RESEARCH-ADMISSION-INPUT-GAP-PO-DEC-001](CLIENT_FINDER_PHASE5_PRE_RESEARCH_ADMISSION_INPUT_GAP_PO_DECISION_ROUND.md) (PO-2 of that decision round; this is the companion questionnaire it defers to), [CF-DETERMINISTIC-OPPORTUNITY-LAYER-ITEM-9-STRONG-SIGNAL-BYPASS-PRINCIPLE-PO-DEC-001](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md) (decided the strong-signal bypass principle; left "top-reliability signal category" undefined — this record proposes candidate definitions only), [CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md) (the five dimensions each candidate below is evaluated against), [CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md) (defines why `ENTITY_REALITY` evidence is currently treated as decisive — relevant to Candidate 2 below)
**Decision title:** Candidate definitions for the undefined "top-reliability signal category" term in the Phase 5 strong-signal bypass — questionnaire only, no definition chosen
**Date:** 2026-10-13
**Authority:** Product Owner (decision pending)
**Status:** NOT YET DECIDED. This record proposes candidates for PO selection; it does not choose one.
**Scope of this record:** Enumerates candidate definitions of "top-reliability signal category" based only on signal types and governance already decided/implemented. Does not implement, authorize implementation of, or imply a default choice.

## Context

`CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md` and `CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md` (lines 51, 340, 374, 561, 627, 705, 740) both use the term "service-specific top-reliability signal category" as a condition for bypassing the normal admission/ranking path, without defining which signal(s) qualify. No code implements or tags any signal as "top-reliability" today. The candidates below are derived only from what is actually implemented (one deterministic signal: absent SSL/TLS) and from governance concepts already decided (the `OBSERVED_FACT_CONFIDENCE` constant, the `ENTITY_REALITY` dimension's decisive role in elimination, and the per-service signal catalogue structure). No new signal or heuristic is proposed.

## Candidate definitions

### Candidate 1 — "Fixed maximum-confidence" signals (by `OBSERVED_FACT_CONFIDENCE`)

- **Exact signal/category:** Any deterministic signal whose confidence is pinned at the `OBSERVED_FACT_CONFIDENCE` constant (currently = 100), as opposed to a lower, inferred confidence value.
- **Why it qualifies:** `OBSERVED_FACT_CONFIDENCE` already encodes, at the implementation level, "this is a directly observed fact, not an inference" — the closest existing proxy for "top reliability" without inventing new semantics.
- **OBSERVED or inferred:** OBSERVED (by construction — the constant exists specifically to mark directly-observed facts).
- **Current implementation status:** Implemented for exactly one signal (absent SSL/TLS, `detectAbsentSsl()`); no other signal exists to compare against.
- **Source/provenance:** Derived directly from the fetched homepage document (`SourceDocument`/`SuppliedSourceDocuments`).
- **Affected universal dimension:** `NEED_OPPORTUNITY_GAP`.
- **Could it occur pre-Research:** Yes — this is exactly the signal PO-1 (pre-Research admission evidence acquisition) would make available before the admission gate.

### Candidate 2 — `ENTITY_REALITY`-dimension signals specifically

- **Exact signal/category:** Any signal tagged with the `ENTITY_REALITY` dimension.
- **Why it qualifies:** `CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001` already treats `ENTITY_REALITY` evidence as decisive enough to eliminate a prospect outright — the only dimension currently given gate-level authority anywhere in the pipeline. "Top-reliability" could mean "reliable enough to carry that same gate-level weight in the opposite direction" (bypass instead of elimination).
- **OBSERVED or inferred:** Would depend on the specific signal; no such signal exists yet to classify.
- **Current implementation status:** NOT implemented. No producer currently emits an `ENTITY_REALITY`-dimension signal (confirmed: `eliminateDeterministically()` always resolves eligible today because its own `findNonRealityEvidence()` filter never matches anything).
- **Source/provenance:** N/A — no implementation exists.
- **Affected universal dimension:** `ENTITY_REALITY`.
- **Could it occur pre-Research:** Only if a future `ENTITY_REALITY` signal were implemented and evaluated during the same pre-admission fetch PO-1 authorizes; no such signal exists today, so this candidate is currently unusable without further, separately-authorized signal work (which this questionnaire does not propose).

### Candidate 3 — Per-service "single catalogue member" (structural, not evidentiary)

- **Exact signal/category:** For a given service family, the signal(s) in that family's `createXSignalCatalogue()` — i.e., whatever the service's catalogue already contains is, by construction, its "top" (and currently only) reliability tier.
- **Why it qualifies:** Avoids inventing a cross-service reliability ranking; "top" is defined structurally as "whatever this service family's catalogue already authorizes," which for Web Development today is exactly the absent-SSL signal.
- **OBSERVED or inferred:** OBSERVED (same as Candidate 1 for the one signal that exists).
- **Current implementation status:** Implemented only for the Web Development service family (one signal). The other 16 service families have no catalogue and thus no candidate member — this definition is undefined for them until their catalogues are separately built (not proposed here).
- **Source/provenance:** Fetched homepage document, same as Candidate 1.
- **Affected universal dimension:** `NEED_OPPORTUNITY_GAP` (Web Development today); undefined for other service families.
- **Could it occur pre-Research:** Yes, for Web Development, under the same PO-1 pre-fetch.

## What this record does not do

- It does not choose a candidate.
- It does not authorize implementing any candidate.
- It does not propose inventing a new signal, heuristic, or numeric weight to populate an empty candidate (Candidate 2 and Candidate 3 for non-Web-Development services are reported as currently unusable, not as work items).
- It does not change the five-dimension framework, `ENTITY_REALITY` elimination semantics, eligibility, K1, or ₹499/₹1,499/auth/payment/subscription.

## Next step

The PO selects one candidate (or requests a different framing not listed here) before PO-2 can be marked DECIDED. Until then, Phase 5 implementation remains blocked per `CLIENT_FINDER_PHASE5_PRE_RESEARCH_ADMISSION_INPUT_GAP_PO_DECISION_ROUND.md`.
