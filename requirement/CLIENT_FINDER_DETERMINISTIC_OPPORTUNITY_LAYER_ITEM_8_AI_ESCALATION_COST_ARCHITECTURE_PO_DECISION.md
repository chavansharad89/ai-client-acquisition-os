# Client Finder — Deterministic Opportunity Layer — Item #8 PO Decision: AI Escalation Cost Architecture (Principle Only — Option E)

**Status: PRINCIPLE DECIDED (Hybrid + Adaptive/Budgeted). CONCRETE NUMERIC VALUES AND MECHANISM NOT YET DEFINED. IMPLEMENTATION NOT AUTHORIZED.**

**Source:** Item #8 of `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` ("AI escalation mechanism"). Informed by, but not a wholesale adoption of, the read-only investigation `requirement/CLIENT_FINDER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_INVESTIGATION.md`.

**Related decisions:** [Item #4](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_4_DETERMINISTIC_FIRST_SCORING_ARCHITECTURE_PO_DECISION.md), [Item #7](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_7_HYBRID_RANKING_PO_DECISION.md), [Item #9](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md), [Item #10](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_10_AI_FRONTIER_FORMATION_PO_DECISION.md) (specific AI-frontier sub-decision), [CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) (cache/reuse principle), [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md).

## Decision

**DECIDED (principle level) — AI escalation combines a deterministic eligibility frontier with adaptive, bounded cost controls ("Option E": Hybrid + Adaptive/Budgeted AI Escalation).**

Intended architecture (governance/architectural description only — not an implementation authorization):

> DISCOVERY → CACHE/REUSE CHECK → DETERMINISTIC ELIMINATION → DETERMINISTIC RANKING → STRONG-SIGNAL BYPASS WHERE APPLICABLE → TOP-N / THRESHOLD FRONTIER → ADAPTIVE + BUDGETED AI ESCALATION → AI RESEARCH / QUALIFICATION → STOP WHEN FURTHER AI WORK IS NOT JUSTIFIED

1. AI is NOT run for every discovered candidate.
2. Fresh, applicable cached evidence (`CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`) should be reused before making new AI calls.
3. Deterministic processing (elimination, ranking) happens before AI, per Item #4.
4. Strong/high-confidence deterministic signals may bypass the normal ranking threshold, per Item #9.
5. AI escalation combines candidate-selection controls (which candidates) with adaptive/budget controls (how much AI work, and when to stop).
6. AI usage should stop when additional research is no longer sufficiently justified.
7. This architecture is intended to support all 17 service families (`CF-SERVICE-CATALOG-PO-DEC-001`), including graceful handling of families that do not yet have a defined deterministic signal set (exact graceful-degradation policy remains open).
8. AI remains an escalation layer, not the primary discovery/ranking mechanism.
9. The optimization target is useful opportunities per unit of AI cost, not merely the cheapest available model.

## Still open (not decided by this record)

- Top-N value.
- Score threshold value.
- AI budget per search.
- Whether bypass candidates (Item #9) count toward Top-N.
- Whether bypass candidates consume AI budget.
- The exact adaptive stopping rule/formula.
- Cache TTL/freshness windows (any evidence category).
- Cross-freelancer cache sharing (explicitly not authorized — see `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`).
- Provider/model selection.
- Whether Research (`researcher.ts`) and Target Customer Match (`targetCustomerMatch.ts`) remain separate calls or become conditionally staged/combined.

None of the above may be treated as decided. Do not implement against any of them until each receives its own separate, concrete PO decision.

## Rationale

Item #4 already established that AI is an escalation layer, not a default path, and that deterministic elimination/ranking must precede it. `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` already authorizes reusing fresh same-freelancer evidence. This record connects those pieces into one named architecture and adds the previously-undecided requirement that escalation be **adaptive and bounded**, not merely "deterministic-filtered-then-unconditionally-called" — i.e. the system should also be able to recognize, independent of the static Top-N/threshold frontier, when continuing to spend on AI research for a given search is no longer worthwhile, and stop. This principle is informed by, but does not simply adopt wholesale, the read-only investigation's recommended layered architecture (`CLIENT_FINDER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_INVESTIGATION.md` §13), which itself deferred the adaptive/yield-based stopping mechanism pending real usage measurement — consistent with this record leaving the exact adaptive formula open rather than inventing one.

## Explicit boundaries — what this decision does NOT do

1. Does not set any numeric value listed under "Still open" above.
2. Does not select a specific adaptive-stopping algorithm.
3. Does not authorize any provider/model choice.
4. Does not authorize cross-freelancer evidence/cache sharing.
5. Does not decide AI call-combination/staging strategy (Research vs. Target Customer Match).
6. Does not modify Item #4, #7, #9, or `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`.
7. Does not authorize any code, configuration, `.env`, schema, or data change.
8. Is not an adoption of the investigation document's recommendation wholesale — that document remains informative/read-only, not authoritative; only what is stated in "Decision" above is decided.

## Dependency / conflict check

Reviewed against Item #4, Item #9, `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`, `CF-SERVICE-CATALOG-PO-DEC-001`, and the Item #8 investigation report. **No conflict found.** This record is additive: it names an architecture consistent with every constraint those records already impose, and leaves every numeric value and mechanism they already left open, still open.

## What happens next

Engineering may propose the concrete escalation mechanism (ties directly to Item #10 and the "Still open" list above), requiring its own governance review and PO decision, informed by real measurement per the investigation report's §12/§17, before implementation.

## Effect on the questionnaire

Item #8 of `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` is updated to: **PRINCIPLE DECIDED (Hybrid + Adaptive/Budgeted architecture, "Option E") / CONCRETE MECHANISM AND ALL NUMERIC VALUES OPEN.** Item #10 (Top-N vs. threshold vs. hybrid) is further decided, at the principle level, by its own companion record. Items #5, #6 (thresholds), #7's exact formula, #12, #13, #14 remain open and unaffected beyond what each already stated.

## Forward cross-reference (added 2026-10-13)

`CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001` (`CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md`) resolves, at the architecture-mechanism level, two items from this record's "Still open" list: Research and Target Customer Match remain **two separate, conditionally-staged** calls (not combined into one), and cross-freelancer cache sharing remains **scoped out** of the cache-first check for now (same-freelancer reuse only). This is additive only — it does not set the Top-N value, threshold value, exact budget number, or cache TTL window, all of which remain open exactly as stated above.

**IMPLEMENTATION NOT AUTHORIZED.**
