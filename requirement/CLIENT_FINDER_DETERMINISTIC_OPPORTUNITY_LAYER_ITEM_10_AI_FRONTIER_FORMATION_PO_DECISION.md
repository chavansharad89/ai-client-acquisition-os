# Client Finder — Deterministic Opportunity Layer — Item #10 PO Decision: Hybrid Top-N + Threshold AI Frontier (Principle Only)

**Status: PRINCIPLE DECIDED. N, THRESHOLD, AND BUDGET VALUES NOT YET DEFINED. IMPLEMENTATION NOT AUTHORIZED.**

**Source:** Item #10 of `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` ("Top-N vs. score threshold vs. hybrid escalation").

**Related decisions:** [Item #8](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_PO_DECISION.md) (AI escalation cost architecture — this record is its frontier-formation sub-decision), [Item #9](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md) (strong-signal bypass — preserved, unmodified), [Item #7](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_7_HYBRID_RANKING_PO_DECISION.md), [CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md).

## Decision

**DECIDED (principle level) — the AI-escalation frontier for normal candidates is formed by a HYBRID deterministic threshold AND a bounded Top-N, combined, not either alone.**

1. Deterministic elimination (`CF-DETERMINISTIC-ELIMINATION-PO-DEC-001`) happens first.
2. Deterministic ranking (Item #7) happens before AI.
3. A **normal** candidate must satisfy **both**: (a) a minimum deterministic quality threshold, **and** (b) fall within a bounded Top-N frontier, before normal AI escalation.
4. Strong/high-confidence deterministic signals (Item #9) may bypass the normal threshold-AND-Top-N requirement.
5. Adaptive/budgeted escalation controls (Item #8) govern continued AI research once a candidate enters the frontier.
6. Cache/reuse (`CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`) happens before new AI work.

## Still open (not decided by this record)

- N (the Top-N value).
- The threshold value.
- The AI budget per search.
- Whether bypass candidates (Item #9) count toward Top-N.
- Whether bypass candidates consume AI budget.
- The adaptive stopping criteria (Item #8).
- Service-specific N/threshold policies (whether they vary per top-level service).

## Rationale

The main questionnaire's Item #10 originally posed three mutually-exclusive engineering options (threshold alone, Top-N alone, or a hybrid of the two) without choosing among them. This record selects the **hybrid, AND-combined** option specifically — a normal candidate needs both a quality floor and a bounded slot — rather than threshold-alone (unbounded cost) or Top-N-alone (can admit low-quality candidates just to fill N, or starve a strong search of a tight N). It is the frontier-formation detail of Item #8's broader "Option E" architecture, stated as its own record for traceability to the questionnaire's own Item #10 framing.

## Explicit boundaries — what this decision does NOT do

1. Does not set N, the threshold value, or the AI budget.
2. Does not decide whether bypass candidates count toward N or consume budget.
3. Does not decide the adaptive stopping formula (Item #8).
4. Does not decide service-specific policy variation.
5. Does not modify Item #9's bypass principle.
6. Does not authorize any code, configuration, or `.env` change.

## Dependency / conflict check

Reviewed against Item #8, Item #9, Item #7. **No conflict found.** This record is a narrower, consistent restatement/selection within Item #8's architecture and does not alter Item #9's bypass principle.

## What happens next

Engineering may propose concrete N, threshold, and budget values (and whether they vary by service), requiring its own governance review and PO decision before implementation.

## Effect on the questionnaire

Item #10 of `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` is updated to: **PRINCIPLE DECIDED (hybrid Top-N AND threshold, combined) / ALL NUMERIC VALUES OPEN.** Item #9 remains unmodified. Item #8's remaining open items (adaptive formula, budget mechanics, cache TTL, provider/model, call-combination) remain open.

## Forward cross-reference (added 2026-10-13)

`CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001` resolves, at the architecture-mechanism level, the open question (shared with Item #9) of whether bypass candidates count toward Top-N or consume the AI budget: **yes to both** — a single shared per-search cap meters both bypass and normally-admitted candidates; bypass only reorders admission priority within it. N, the threshold value, and the AI budget number remain open exactly as stated above; this record's hybrid AND-gate selection (threshold + Top-N for normal candidates) is unmodified.

**IMPLEMENTATION NOT AUTHORIZED.**
