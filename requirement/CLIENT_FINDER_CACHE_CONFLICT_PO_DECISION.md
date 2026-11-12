# CLIENT FINDER — CACHE CONFLICT / INCOMPLETE EVIDENCE — PRODUCT OWNER DECISION

**Decision ID:** CF-CACHE-CONFLICT-PO-DEC-001
**Related decisions:** [CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) (cache-first reuse principle this record's storage mechanics serve), [CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_CROSS_FREELANCER_PUBLIC_EVIDENCE_REUSE_PO_DECISION.md) (cross-freelancer public evidence reuse, subject to the same conflict-preservation mechanics), [CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001](CLIENT_FINDER_EVIDENCE_TRANSPARENCY_CONFLICT_STALENESS_FREELANCER_JUDGMENT_PO_DECISION.md) (Decision 1, "Conflicting Evidence": conflicting evidence must be preserved and shown to the freelancer rather than auto-eliminated, at the presentation/eligibility level — this record extends the same posture to the cache **storage** layer and does not redefine that record), [CF-SIGNAL-FRESHNESS-PO-DEC-001](CLIENT_FINDER_SIGNAL_FRESHNESS_PO_DECISION.md) (sibling decision, same date, approving exact freshness windows)
**Decision title:** Cache storage preserves conflicting or incomplete evidence rather than resolving, collapsing, or discarding it
**Date:** 2026-10-13
**Authority:** Product Owner
**Status:** DECIDED. Implementation of the stated semantics is authorized by this record (see "Implementation authorization status").
**Scope of this record:** Governs cache **storage/lookup** mechanics only — whether multiple evidence records for the same `(freelancer, normalized domain, signal kind)` key coexist, and how missing cache evidence is treated at the storage/lookup layer. Does **not** define a conflict score, conflict confidence number, or any eligibility/ranking/AI-admission consequence of conflict or incompleteness.

## Context

Phase 4's `research_signal_cache_index` already indexes every newly-saved, reusable signal as a pointer, and `findByKey()` already re-reads every currently-active (non-superseded) `research_signals` row for a given `(user_id, normalized_domain, signal_kind)` key — never collapsing them into one row, and never overwriting on `record()` (`ON CONFLICT ... DO NOTHING`). `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001` already decided, at the presentation/eligibility level, that conflicting evidence must be preserved and shown rather than auto-eliminated. The PO has now confirmed this same posture governs the cache storage layer specifically, so the existing mechanics are continued rather than redesigned.

## PO decision

**Multiple evidence records for the same freelancer, normalized domain, and signal kind may coexist. Conflicting evidence is preserved rather than discarded.**

The system must:

1. Preserve each observation.
2. Preserve source/provenance for each observation.
3. Preserve `observedAt` for each observation.
4. Preserve confidence for each observation.
5. Not overwrite one observation with another merely because it is newer.
6. Not treat conflict as automatic disqualification.
7. Not treat conflict as proof that either observation is false.
8. Treat missing or incomplete evidence as a cache miss / insufficient reusable evidence — never as negative evidence.
9. Not infer missing facts.
10. Not use incompleteness as an eligibility gate.

Cache lookup may surface multiple relevant observations. Later ranking or AI-admission logic may consider conflict/incompleteness; cache storage itself does not resolve the conflict.

No conflict score or conflict confidence number is introduced by this decision.

## Exact authoritative wording

> Multiple evidence records for the same freelancer, normalized domain and signal kind may coexist.
>
> Conflicting evidence is preserved rather than discarded.
>
> The system must: preserve each observation; preserve source/provenance; preserve observedAt; preserve confidence; not overwrite one observation with another merely because it is newer; not treat conflict as automatic disqualification; not treat conflict as proof that either observation is false.
>
> Missing or incomplete evidence is not negative evidence.
>
> Cache lookup may surface multiple relevant observations. Later ranking or AI-admission logic may consider conflict/incompleteness, but cache storage itself does not resolve the conflict.

## Governance clarification — relationship to existing records

- This record does not rewrite, reinterpret, or supersede `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001`. That record decided conflicting evidence must be preserved and shown to the freelancer rather than auto-eliminated, at the presentation/eligibility level, and explicitly left cache-trustworthiness mechanics to `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`. This record is the cache-**storage**-layer counterpart: it confirms the storage mechanics must not collapse, overwrite, or discard conflicting observations, which is what makes that record's presentation-layer guarantee possible in the first place. Neither record introduces a conflict score; both treat conflict as something the freelancer resolves, not the system.
- This record does not modify `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` or `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`'s reuse scope — it governs how coexisting reusable evidence already in scope under those records is stored and surfaced, not what becomes reusable or across whom.
- This record does not resolve, close, or answer any other open questionnaire item.

## Mandatory boundaries on this decision

1. No conflict score, conflict confidence number, or automatic-elimination-on-conflict rule is authorized.
2. No eligibility, ranking, Research/TCM admission gating, or AI-escalation mechanic may be added under this authorization — cache storage only.
3. Missing cache evidence must be surfaced as a cache miss / insufficient reusable evidence, never as a negative signal.
4. No fact may be inferred to fill a gap in missing or incomplete evidence.
5. The authoritative `research_signals` rows (and their sources) must not be modified, merged, or rewritten by this implementation.
6. Implementation is limited to confirming/preserving the existing cache storage and lookup semantics (`research_signal_cache_index`, `findByKey()`, `toSignalCacheLookupResult()`) and adding test coverage; it is not a license to redesign the cache schema or repository contract.

## Explicit non-decisions

This record does **not** decide or authorize:

- A conflict score or conflict confidence number.
- Any eligibility, ranking, Research/TCM admission gating, or AI-escalation consequence of conflict or incompleteness.
- Any change to what evidence is reusable, or across whom.
- Any database schema change (migration 0045's existing shape already satisfies this decision's storage requirements).
- Phase 5 AI escalation (Top-N, AI budget, strong-signal bypass, Research/TCM admission gating, AI fallback).

## Consequences

- `research_signal_cache_index`'s existing pointer-only, insert-only (`ON CONFLICT ... DO NOTHING`) design and `findByKey()`'s existing re-read of every non-superseded authoritative row already satisfy this decision's storage requirements; no schema or repository contract change is required.
- Test coverage must demonstrate, at the real-Postgres integration level, that two differing observations for the same `(user, normalized domain, signal kind)` key coexist, each with independent provenance/`observedAt`/confidence, and that lookup returns both rather than collapsing them.
- No LLM call is introduced by this record or its implementation.

## What remains to be decided

- Phase 5 AI escalation authorization, including any future decision on how ranking/AI-admission logic may consider conflict or incompleteness.

## Implementation authorization status

**IMPLEMENTATION OF THIS RECORD'S CONFLICT/INCOMPLETE-EVIDENCE SEMANTICS IS AUTHORIZED**, strictly limited to confirming existing cache storage/lookup behavior and adding the test coverage described above (see "Mandatory boundaries"). No other implementation is authorized by this record. Nothing has been committed or pushed under this authorization; that remains a separate, explicit step.
