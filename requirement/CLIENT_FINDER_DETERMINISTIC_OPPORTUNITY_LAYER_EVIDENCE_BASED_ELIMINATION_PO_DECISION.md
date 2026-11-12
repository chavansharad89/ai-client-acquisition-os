# Client Finder — Deterministic Opportunity Layer — Evidence-Based Deterministic Elimination PO Decision (Principle Only)

**Decision ID:** CF-DETERMINISTIC-ELIMINATION-PO-DEC-001

**Status: PRINCIPLE DECIDED. EXACT EXCLUSION CONDITIONS AND THRESHOLDS NOT YET DEFINED. IMPLEMENTATION NOT AUTHORIZED.**

**Source:** Recorded from a 2026-10-11 Product Owner decision session, where this topic was numbered "Item #6" in the PO's own discussion sequence.

> **Numbering disambiguation (important — read before relying on "Item #6" elsewhere in this repo).** The PO's own session numbered this decision "Item #6." That number does **not** correspond to, and this record does **not** resolve, Item #6 of `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` ("Category-specific thresholds"), which remains fully open and unaffected by this record. This decision instead resolves the **elimination side** of that questionnaire's Item #2 ("Exact treatment of temporary vs. persistent website failures," sub-question 2b) and provides elimination-stage principle context for Item #3 ("Deterministic signal set — final list"). See "Effect on the questionnaire" below for the exact items affected.

**Related decisions:** [Item #4](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_4_DETERMINISTIC_FIRST_SCORING_ARCHITECTURE_PO_DECISION.md) (deterministic-first architecture), [CF-DISCOVERY-ARCH-002-Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md) (no-website positive signal), [CF-DISCOVERY-ARCH-002-Q2](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q2_REACHABILITY_PERSISTENCE_PO_DECISION.md) (persistence-check required before declaring unreachable — mechanics only; this record resolves the *consequence* Q2 left open).

## Decision

**DECIDED (principle level) — deterministic elimination is evidence-based, not score-based, and precedes deterministic ranking.**

1. A candidate MAY be eliminated before AI research only when sufficiently reliable deterministic evidence supports a service-appropriate exclusion condition.
2. Weak, missing, ambiguous, or incomplete evidence MUST NOT, by itself, eliminate a candidate.
3. A low deterministic score does NOT, by itself, mean a candidate is unsuitable — scoring (Items #4/#5) and elimination are distinct mechanisms; a candidate need not score well to remain eligible, it merely needs to not meet a confirmed exclusion condition.
4. Candidates that cannot be confidently eliminated remain eligible for deterministic ranking and possible AI escalation.
5. Elimination must not require an LLM/AI call.
6. **Resolves questionnaire Item #2, sub-question 2b:** candidates classified `WEBSITE_PERSISTENT_UNREACHABLE` remain potential opportunities and are **not** automatically eliminated — a business that exists but has a broken/unreachable website is preserved as a candidate, consistent with the spirit of `Q1` (absence/failure of web presence is not proof of no opportunity).
7. Exact exclusion conditions and numerical thresholds remain open.

## Rationale

`Q1` already requires that "no website" not be treated as proof of absence and that the state be preserved as positive. `Q2` already requires repeated checks before declaring a website persistently unreachable, but explicitly left open what happens *after* that determination (see `CF-DISCOVERY-ARCH-002-Q2`, "Explicit non-decisions," and the main questionnaire's own Item #2, which lists the eliminate-vs-preserve question as the open PO question). This record closes that specific gap: persistent unreachability does not itself justify elimination, for the same reason "no website" does not — a broken or abandoned website is evidence of an existing business, not evidence of no opportunity. More generally, this record establishes that elimination requires a confirmed, service-appropriate exclusion condition built on reliable evidence, not merely a low or incomplete score — keeping the evidentiary bar for *removing* a candidate higher than the bar for *ranking* it lower.

## Explicit boundaries — what this decision does NOT do

1. Does not define any specific exclusion condition beyond the persistent-unreachable case in point 6 above.
2. Does not define any numeric threshold, confidence level, or evidence-sufficiency bar.
3. Does not select the final deterministic signal set (questionnaire Item #3, still open).
4. Does not set category-specific threshold values (questionnaire Item #6, still open and unaffected — see numbering disambiguation above).
5. Does not define the ranking mechanism (Item #7) or AI-escalation mechanism (Item #8/#10).
6. Does not authorize any code, configuration, `.env`, schema, or data change.

## Dependency / conflict check

Reviewed against `Q1`, `Q2`, and the main questionnaire's Item #2. **One conflict identified and resolved transparently, not silently:** the main questionnaire's Item #2 classifies the eliminate-vs-preserve question as **open** ("the actual open PO question"), and `CF-DISCOVERY-ARCH-002-Q2` explicitly lists it under "Explicit non-decisions." This record is the **first** decision to resolve that specific question. No prior record stating "persistent-unreachable candidates are preserved" was found in this repository, despite the PO's own session referring to it as an "existing Item #2 decision." This record **is** that decision, recorded now — not a restatement of something already decided — and that distinction is flagged here rather than silently asserted as pre-existing.

## What happens next

Engineering may propose concrete exclusion conditions and thresholds for the adopted signal set (Item #3), each requiring its own governance review and PO decision before implementation.

## Effect on the questionnaire

- Item #2 (sub-question 2b) of `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` is updated to: **DECIDED — persistent-unreachable candidates are preserved, not automatically eliminated.** The mechanics (check count/window) remain engineering-owned per `Q2`.
- Item #3 (final signal set) gains elimination-stage principle context but remains open.
- Item #6 (category-specific thresholds) is **not** affected and remains fully open.

**IMPLEMENTATION NOT AUTHORIZED.**
