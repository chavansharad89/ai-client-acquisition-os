# Client Finder — Deterministic Opportunity Layer — Item #5 PO Decision: Service-Specific Deterministic Signal Weighting (Principle Only)

**Status: PRINCIPLE DECIDED. EXACT WEIGHTS/FORMULA NOT YET DEFINED. IMPLEMENTATION NOT AUTHORIZED.**

**Source:** Item #5 of `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` ("Signal weights (if applicable)").

**Related decisions:** [Item #4](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_4_DETERMINISTIC_FIRST_SCORING_ARCHITECTURE_PO_DECISION.md) (deterministic-first architecture, principle), [CF-DISCOVERY-ARCH-002-S5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S5_COMBINATION_RULE_PO_DECISION.md) (category-specific thresholds permitted — unmodified), [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) (17-family catalogue), [Item #9](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md) (strong-signal bypass — unmodified).

## Decision

**DECIDED (principle level) — deterministic signal weighting is SERVICE-SPECIFIC within one common Client Finder scoring architecture.**

1. Deterministic signal weighting remains non-LLM/AI, consistent with Item #4.
2. The scoring architecture itself (its shape/mechanics) is reusable across all 17 top-level service families (`CF-SERVICE-CATALOG-PO-DEC-001`).
3. The numeric weight given to a given signal MAY differ by top-level service, because a signal's commercial relevance differs by service (e.g. a signal that matters for Web & Software Development may matter less, more, or not at all for Branding or Video & Reels).
4. A signal's strength/confidence (how reliable the evidence is) is a distinct dimension from its service-specific commercial weight (how much that service cares about it, if reliable) — the two must not be conflated into a single undifferentiated number.
5. No exact numeric weight, for any signal, for any service, is decided by this record.
6. No exact scoring formula is decided by this record.
7. No threshold, ranking mechanic, or AI-escalation rule is decided by this record (see Items #4, the elimination decision, #7, #8, #10).

## Rationale

`CF-SERVICE-CATALOG-PO-DEC-001` already established that Client Finder spans 17 service families with service-aware scoring permitted (rule #8). Item #4 already established the deterministic-first architecture at the principle level, reusable across the catalogue with service-specific variation in "signals, weights, thresholds and ranking configuration." This decision makes explicit, for weighting specifically, that "reusable architecture" does not mean "one fixed weight set" — the same architecture-shape can and should carry different weights per service, because commercial relevance is not uniform across the catalogue. It also draws the distinction between strength/confidence and commercial weight so that a future engineering proposal does not conflate "how sure are we this evidence is real" with "how much does this service care."

## Explicit boundaries — what this decision does NOT do

1. Does not select Design A, B, or C from Item #4.
2. Does not assign any numeric weight to any signal for any service.
3. Does not define the scoring formula/aggregation method.
4. Does not define category-specific threshold values (Item #6 of the questionnaire, still open).
5. Does not define the ranking mechanism (Item #7) or AI-escalation mechanism (Item #8/#10).
6. Does not authorize any code, configuration, or `.env` change.

## Dependency / conflict check

Reviewed against Item #4, `S5`, `CF-SERVICE-CATALOG-PO-DEC-001`. **No conflict found.** `S5` already permits different thresholds per category; this decision is the weighting analogue of that same principle, extended across services rather than just categories, and is additive.

## What happens next

Engineering may propose a concrete weighting scheme per service, requiring its own governance review and PO decision (ties to questionnaire Items #3, #4, #5, #6) before implementation.

## Effect on the questionnaire

Item #5 of `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` is updated to: **PRINCIPLE DECIDED (service-specific weighting permitted) / EXACT WEIGHTS AND FORMULA OPEN.** Item #4's Design A/B/C choice, and Item #6's threshold values, remain open and unaffected.

**IMPLEMENTATION NOT AUTHORIZED.**
