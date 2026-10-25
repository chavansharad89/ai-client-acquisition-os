# Client Finder — Deterministic Opportunity Layer — Item #7 PO Decision: Hybrid Deterministic Ranking (Principle Only)

**Status: PRINCIPLE DECIDED. EXACT FORMULA/NORMALIZATION/CONFIDENCE/FRESHNESS/TIE-BREAK RULES NOT YET DEFINED. IMPLEMENTATION NOT AUTHORIZED.**

**Source:** Item #7 of `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` ("Candidate ranking mechanism").

**Related decisions:** [Item #4](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_4_DETERMINISTIC_FIRST_SCORING_ARCHITECTURE_PO_DECISION.md) (deterministic-first architecture; Design A/B/C still open), [Item #5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_5_SIGNAL_WEIGHTING_PO_DECISION.md) (service-specific weighting), [CF-DETERMINISTIC-ELIMINATION-PO-DEC-001](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_EVIDENCE_BASED_ELIMINATION_PO_DECISION.md) (elimination precedes ranking), [CF-DISCOVERY-ARCH-002-S6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S6_AI_ESCALATION_BOUNDARY_PO_DECISION.md) (deterministic stage may rank).

## Decision

**DECIDED (principle level) — deterministic ranking uses a HYBRID mechanism.**

1. Service-specific weighted deterministic scoring (Items #4/#5) is the **primary** ranking signal.
2. Evidence-confidence and freshness safeguards MAY supplement the primary score (e.g. down-weighting or flagging a ranking position derived from stale or low-confidence evidence).
3. Deterministic tie-breaking/ordering rules MAY supplement the score when candidates are otherwise equal or near-equal.
4. No LLM/AI call is required to calculate or order the ranking.
5. No Top-N value or AI-escalation threshold is decided by this record (see Items #8/#10).
6. No exact scoring formula, normalization method, confidence rule, freshness rule, or tie-breaker is decided by this record.

## Rationale

This resolves which of Item #4's three engineering options the *ranking* step draws on, without yet selecting Item #4's overall Design A/B/C: a weighted score as the primary signal is compatible with Design A directly, or with Design C's post-gate ranking stage using Design A's math. It does not foreclose Design B (category vectors) from informing the primary score's inputs, but it does establish that whatever the inputs, the ranking **output** is produced via a primarily score-driven ordering, not an unordered per-category vector alone — a vector alone cannot, by itself, produce a single AI-escalation queue (per the main questionnaire's Item #4 discussion of Design B's limitation). Confidence/freshness safeguards and tie-breaking are added because a pure weighted sum can rank a well-evidenced candidate behind a poorly-evidenced one that merely scored a few points higher by chance of which signals happened to be observable.

## Explicit boundaries — what this decision does NOT do

1. Does not finally select Design A, B, or C from Item #4.
2. Does not assign any numeric weight (Item #5, still open).
3. Does not define the scoring formula, normalization, or aggregation method.
4. Does not define any confidence rule, freshness rule, or tie-breaker mechanism.
5. Does not define any Top-N value, score threshold, or AI-escalation rule (Items #8/#10).
6. Does not authorize any code, configuration, or `.env` change.

## Dependency / conflict check

Reviewed against Item #4, `S5`, `S6`. **No conflict found.** `S6` already permits the deterministic stage to rank; this record specifies the *shape* of that ranking (score-primary, hybrid-supplemented) without conflicting with any unresolved Item #4 choice.

## What happens next

Engineering may propose the concrete ranking formula, normalization, confidence/freshness rules, and tie-breakers, requiring its own governance review and PO decision before implementation.

## Effect on the questionnaire

Item #7 of `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` is updated to: **PRINCIPLE DECIDED (hybrid: weighted score primary + confidence/freshness safeguards + tie-breakers) / EXACT FORMULA OPEN.** Items #4 (Design A/B/C), #5 (weights), #8/#10 (AI-escalation mechanism) remain open and unaffected.

**IMPLEMENTATION NOT AUTHORIZED.**
