# CLIENT FINDER — SIGNAL FRESHNESS WINDOWS — PRODUCT OWNER DECISION

**Decision ID:** CF-SIGNAL-FRESHNESS-PO-DEC-001
**Related decisions:** [CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001](CLIENT_FINDER_SIGNAL_SPECIFIC_FRESHNESS_PO_DECISION.md) (decided, at the principle level, that freshness is signal-specific rather than one universal TTL, and explicitly left every exact TTL value OPEN — this record is the follow-on decision that fills in those exact values; it does not reopen or redefine the principle), [CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) ("still applicable and sufficiently fresh" reuse condition — this record supplies the "sufficiently fresh" values that condition depends on), [CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_CROSS_FREELANCER_PUBLIC_EVIDENCE_REUSE_PO_DECISION.md) (cross-freelancer public evidence reuse, subject to the same freshness values), [CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001](CLIENT_FINDER_EVIDENCE_TRANSPARENCY_CONFLICT_STALENESS_FREELANCER_JUDGMENT_PO_DECISION.md) (Decision 2, "Stale Evidence": stale evidence never makes a lead ineligible — unaffected and unmodified by this record, which concerns cache-trustworthiness mechanics only), [CF-CACHE-CONFLICT-PO-DEC-001](CLIENT_FINDER_CACHE_CONFLICT_PO_DECISION.md) (sibling decision, same date, governing cache conflict/incomplete-evidence handling)
**Decision title:** Approved initial per-signal-kind freshness windows for the Phase 4 cache-freshness evaluator
**Date:** 2026-10-13
**Authority:** Product Owner
**Status:** DECIDED. Implementation of the stated semantics is authorized by this record (see "Implementation authorization status").
**Scope of this record:** Supplies exact freshness windows per `ResearchSourceKind`, for the Phase 4 cache-freshness evaluator only. Does **not** change eligibility, ranking, AI-admission thresholds, scoring weights, or any other mechanism. Does **not** reopen `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`'s principle-level decision.

## Context

`CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001` decided that cache freshness must be judged per signal/evidence category rather than against one universal TTL, but left every exact value OPEN. `packages/core-research/src/signalCache.ts`'s `evaluateSignalFreshness()` has, since Phase 4, always returned `'stale'` for this reason — its own docstring states no per-kind value has been authorized and none is invented there. The PO has now approved exact initial values, closing that gap for the signal kinds the deterministic pipeline actually produces.

## PO decision

**Evidence freshness is signal-specific rather than governed by one universal TTL. The following initial freshness windows are approved:**

| Signal kind | Freshness window |
|---|---|
| `WEBSITE` | 30 days |
| `JOB_POST` | 14 days |
| `LINKEDIN` | 14 days |
| `NEWS` | 7 days |
| `FUNDING` | 90 days |
| `TECH_STACK` | 30 days |
| `REVIEW` | 90 days |
| `MANUAL` | STALE until explicitly refreshed |

`PUBLIC_INTENT` and `FIRST_PARTY` are not reusable public-evidence cache kinds — unaffected restatement of existing scope (`CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`, enforced today by `research_signal_cache_index`'s kind CHECK constraint and by `recordCacheableSignals()`'s own skip of intent-intake kinds).

If a signal kind has no approved freshness policy, it is treated as STALE.

1. Freshness is signal-specific; no single universal TTL governs all evidence.
2. The table above is the approved initial value for each listed kind.
3. `MANUAL` evidence is always STALE; there is no elapsed-time window for it. A fresh observation requires a new, explicit observation (a new signal row with its own `observedAt`) — not the passage or non-passage of time against the prior one.
4. Any signal kind not listed in the table (including `PUBLIC_INTENT`, `FIRST_PARTY`, and any future/unrecognized kind) is STALE.
5. Freshness does not determine eligibility. Stale evidence may still be shown and preserved with its original provenance and `observedAt`.
6. These values are not ranking weights, eligibility thresholds, or AI-admission thresholds, and must not be reinterpreted as such.

## Exact authoritative wording

> Evidence freshness is signal-specific rather than governed by one universal TTL.
>
> Approved initial freshness windows: WEBSITE 30 days; JOB_POST 14 days; LINKEDIN 14 days; NEWS 7 days; FUNDING 90 days; TECH_STACK 30 days; REVIEW 90 days; MANUAL STALE until explicitly refreshed.
>
> PUBLIC_INTENT and FIRST_PARTY are not reusable public-evidence cache kinds.
>
> If a signal kind has no approved freshness policy, it is treated as STALE.
>
> Freshness does not determine eligibility. Stale evidence may still be shown and preserved with its original provenance and observedAt.
>
> Do not reinterpret these values as ranking weights, eligibility thresholds, or AI-admission thresholds.

## Governance clarification — relationship to existing records

- This record fills in, and does not reopen or redefine, the principle `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001` established: that freshness is signal-specific. That record's explicit non-decisions ("Exact TTL values for any evidence type, signal, or service" remain OPEN) are resolved by this record for the kinds listed above; any kind not listed remains governed by that record's fallback posture (no uniform-expiry assumption — here made concrete as STALE).
- This record does not modify `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001`'s Decision 2 (stale evidence never makes a lead ineligible). Freshness values here govern cache-trustworthiness/reuse mechanics only; eligibility consequence remains exclusively governed by that record.
- This record does not modify `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` or `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`'s reuse scope — it supplies the "sufficiently fresh" values those records' reuse conditions depend on, without expanding what evidence is reusable or across whom.
- This record does not resolve, close, or answer any questionnaire item beyond the exact-value portion of Item #13 described above.

## Mandatory boundaries on this decision

1. No ranking weight, eligibility threshold, or AI-admission threshold is set or implied by these values.
2. No change to what evidence is reusable, or across whom — that remains governed exclusively by `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` and `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`.
3. No change to `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001`'s eligibility posture: stale evidence is still never automatically disqualifying.
4. Implementation is limited to the Phase 4 cache-freshness evaluator (`evaluateSignalFreshness()` and its direct callers/tests). No ranking, eligibility, Research/TCM admission gating, AI escalation, Top-N, AI budget, or strong-signal bypass logic may be added under this authorization.
5. Stale evidence must not be deleted; it remains stored and reusable for display with its original provenance and `observedAt`.
6. `created_at` must not be substituted for `observedAt` when evaluating freshness.

## Explicit non-decisions

This record does **not** decide or authorize:

- Any ranking, eligibility, Research/TCM admission gating, or AI-escalation mechanics.
- Phase 5 AI escalation, Top-N, AI budget, or strong-signal bypass.
- Any change to the ₹1,499/auth/payment/activation work.
- Any freshness value beyond the table above; future signal kinds require their own decision.
- Any conflict-resolution mechanics — governed exclusively by `CF-CACHE-CONFLICT-PO-DEC-001`.

## Consequences

- `evaluateSignalFreshness()` must implement exactly the table above: a per-kind elapsed-time window measured from `observedAt`, with `MANUAL` and any unlisted kind always STALE.
- No LLM call is introduced by this record or its implementation.

## What remains to be decided

- Freshness values for any future signal kind not listed above.
- Phase 5 AI escalation authorization (Top-N, AI budget, strong-signal bypass, Research/TCM admission gating, AI fallback) — separately gated, not authorized here.

## Implementation authorization status

**IMPLEMENTATION OF THIS RECORD'S FRESHNESS SEMANTICS IS AUTHORIZED**, strictly limited to the Phase 4 cache-freshness evaluator described above (see "Mandatory boundaries"). No other implementation is authorized by this record. Nothing has been committed or pushed under this authorization; that remains a separate, explicit step.
