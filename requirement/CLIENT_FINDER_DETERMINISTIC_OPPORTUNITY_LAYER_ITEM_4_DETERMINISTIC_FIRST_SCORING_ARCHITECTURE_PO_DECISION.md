# Client Finder — Deterministic Opportunity Layer — Item #4 PO Decision: Deterministic-First Scoring Architecture (Principle Only)

**Status: PRINCIPLE DECIDED. CONCRETE SCORING MECHANISM NOT YET DEFINED. IMPLEMENTATION NOT AUTHORIZED.**

**Source:** Item #4 of `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` ("Scoring architecture — Design A / B / C").

**Related decisions:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md) (staged discovery architecture — this decision reaffirms and sharpens it, does not supersede it), [CF-DISCOVERY-ARCH-002-S5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S5_COMBINATION_RULE_PO_DECISION.md) (signal-combination rule — category-specific thresholds permitted), [CF-DISCOVERY-ARCH-002-S6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S6_AI_ESCALATION_BOUNDARY_PO_DECISION.md) (deterministic stage may both eliminate and rank — unmodified, reaffirmed), [Item #9](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md) (strong-signal bypass principle — remains authoritative, unmodified), [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) (17-family catalogue; all 17 remain selectable even where no deterministic signal set yet exists), [CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001](CLIENT_FINDER_SINGLE_SERVICE_PER_SEARCH_PO_DECISION.md) (one service per search), [CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) (Item #11, same-owner evidence reuse — unmodified).

## Decision

**DECIDED (principle level) — Client Finder's opportunity architecture is deterministic-first:**

> DISCOVERY → DETERMINISTIC ELIMINATION → DETERMINISTIC RANKING → SELECTIVE AI RESEARCH/QUALIFICATION

1. The deterministic elimination and ranking stages **must not** require an LLM/AI call merely to evaluate or score a candidate.
2. AI/LLM research is an **escalation layer**, not the default first-pass evaluation mechanism.
3. Client Finder **must not** send every discovered candidate to an LLM/AI by default merely because the candidate was discovered.
4. The deterministic layer **should** eliminate clearly unsuitable candidates before expensive AI research, wherever the applicable deterministic signals permit this.
5. The deterministic layer **should** rank the remaining candidates before AI escalation, wherever the applicable deterministic signals permit ranking.
6. Item #9's strong-signal bypass principle remains fully authoritative and unmodified: a sufficiently strong/high-confidence deterministic signal may trigger AI escalation without satisfying the general ranking threshold.
7. This architecture is intended, in principle, to be reusable across the Client Finder service catalogue (`CF-SERVICE-CATALOG-PO-DEC-001`'s 17 top-level service families).
8. The concrete deterministic signals, weights, thresholds, and ranking configuration **may** ultimately differ by top-level service, consistent with `CF-SERVICE-CATALOG-PO-DEC-001` rule #8 (service-aware opportunity layer).

## Rationale

`CF-DISCOVERY-ARCH-001` already established the macro staged flow (discovery → deterministic filtering → selective AI) and that frontier AI must not be invoked for every candidate by default. `CF-DISCOVERY-ARCH-002-S6` already established that the deterministic stage may both eliminate and rank. This decision does not change either of those — it makes two things explicit that were previously implicit only by contrast with the AI-escalation stage, and closes a gap neither prior record directly addressed:

- It names elimination and ranking as two distinct deterministic sub-stages within the existing staged architecture, both occurring before AI escalation (consistent with, not a reinterpretation of, `S6` option C).
- It explicitly forecloses the possibility that a future engineering proposal could satisfy "deterministic elimination/ranking" using a cheap or fast LLM call. Prior decisions never stated this outright; this decision makes it a binding constraint, in service of the architecture's cost-control intent.

Cost control is the explicit motivating principle (performing as much candidate filtering/ranking as reasonably possible via non-LLM mechanisms before AI escalation), but this decision does **not** establish any numeric cost ceiling, maximum rupee amount per search, maximum LLM calls per search, or specific provider/model — those remain governed (or left open) exactly as under `CF-DISCOVERY-ARCH-001` and the open items below.

## Interaction with the service catalogue (no new authorization)

`CF-SERVICE-CATALOG-PO-DEC-001` already decided that all 17 approved top-level service families remain selectable even where no deterministic signal set has yet been defined for that service (catalogue rules #1–#2, service-awareness rule #8). This decision does **not** change that selectability rule, and does **not** add a new one.

This decision also does **not** automatically authorize unlimited/unfiltered AI research for a service that currently has no defined deterministic signal set. Whether such a service's candidates are AI-escalated without deterministic pre-filtering, held back entirely, or handled some other way is a **separate, open, future engineering/PO question**, not resolved here and not resolved by `CF-SERVICE-CATALOG-PO-DEC-001`.

## Explicit boundaries — what this decision does NOT do

This is a **principle-level** PO decision. It does **not** select, define, or authorize:

1. Any individual service's deterministic signals.
2. Any numerical scores.
3. Any weights.
4. Any thresholds.
5. Any ranking formula or algorithm.
6. Any Top-N value.
7. Any AI-escalation threshold.
8. Any service-specific scoring configuration.
9. Which of Design A / B / C (questionnaire item #4's own original engineering-options framing) is adopted, or whether the eventual ranking mechanism reuses Design A's weighted-sum math, Design B's category-vector math, or Design C's two-stage structure.
10. Any numeric cost ceiling, maximum rupee amount per search, or maximum LLM-call count per search.
11. Any AI provider or model selection.
12. Any caching or batching strategy.
13. The behavior/cost-control policy for a service that has no deterministic signal set defined (see above — explicitly left open).
14. Any code, configuration, or `.env` change.

It also does **not** alter: `Q1`, `Q2`, `Q3`, `Q4`, `Q5`, `Q6`, `S5`, `S6`, Item #9 (strong-signal bypass), or Item #11 (same-freelancer evidence reuse).

## Dependency / conflict check

Reviewed against `CF-SERVICE-CATALOG-PO-DEC-001`, `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`, `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`, Item #9, `S5`, and `S6`. **No conflict found.** This decision is additive and consistent with all of them:

- `CF-DISCOVERY-ARCH-001` and `S6` already established the macro staged flow and the eliminate-and-rank permission this decision reaffirms.
- `S5`'s category-specific-threshold permission is untouched; this decision does not choose a scoring architecture.
- `CF-SERVICE-CATALOG-PO-DEC-001`'s selectability-without-signals rule is untouched; see "Interaction with the service catalogue" above for the one new clarification (no auto-authorization of unlimited AI for signal-less services), which is additive, not conflicting.
- `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001` and `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` operate at a different layer (search scoping, evidence reuse) and are unaffected.

**One drafting note, not a conflict:** the source task referenced "`CF-SERVICE-CATALOG-PO-DEC-001` and subsequent PO decision that all 17 approved top-level services remain selectable even when deterministic signals have not yet been defined" as two items. No second, separate decision record stating that rule was found — it is stated within `CF-SERVICE-CATALOG-PO-DEC-001` itself (rules #1, #2, #8). This record cites only `CF-SERVICE-CATALOG-PO-DEC-001`.

## What happens next

- Engineering may propose a concrete scoring architecture (Design A/B/C or other), signal set, weights, thresholds, ranking formula, and AI-escalation mechanism — each requiring its own governance review and PO decision before implementation, exactly as already required by `S5`, `S6`, and questionnaire items #3, #5, #6, #7, #8, #10.
- The behavior/cost-control policy for a service with no deterministic signal set is a separate future engineering/PO question.
- Implementation remains not authorized until those separate decisions are made.

## Effect on the questionnaire

Item #4 of `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` is updated to: **PRINCIPLE DECIDED / CONCRETE SCORING MECHANISM OPEN.** The underlying question of item #4 — which of Design A/B/C is adopted — remains open, as do items #5 (weights), #6 (threshold values), #7 (ranking mechanism), #8 (AI-escalation mechanism), and #10 (Top-N vs. threshold vs. hybrid). No other questionnaire item is affected by this record.

**IMPLEMENTATION NOT AUTHORIZED.**
