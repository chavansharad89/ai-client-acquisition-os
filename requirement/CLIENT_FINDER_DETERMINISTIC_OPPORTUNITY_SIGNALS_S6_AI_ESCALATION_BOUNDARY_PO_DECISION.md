# CLIENT FINDER — DETERMINISTIC OPPORTUNITY SIGNALS — §6 PARTIAL PO DECISION: AI-ESCALATION BOUNDARY

**Decision ID:** CF-DISCOVERY-ARCH-002-S6
**Parent questionnaire:** [CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md), §6
**Parent architecture decision:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md)
**Related partial decisions:** [CF-DISCOVERY-ARCH-002-Q1 through Q6, S5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md)
**Decision title:** AI-escalation boundary — deterministic stage may both eliminate and rank
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Answers parent questionnaire §6 only. With this record, **all of §4 (Q1–Q6), §5, and §6 of the parent questionnaire are now answered.**

## Context

The parent questionnaire presented four options for what the deterministic stage is actually allowed to do with its output: (A) only eliminate obviously unsuitable candidates, (B) rank candidates and send only the strongest to AI, (C) both eliminate and rank, (D) other.

## PO decision

**OPTION C — The deterministic stage may both eliminate unsuitable candidates and rank candidates for AI escalation.**

## Exact authoritative wording

> The deterministic stage may:
>
> 1. eliminate candidates that are clearly unsuitable for further research;
> 2. evaluate objective opportunity evidence;
> 3. rank the remaining candidates according to deterministic opportunity evidence;
> 4. determine which candidates should proceed to the AI research/qualification stage, subject to the separately governed thresholds and rules.
>
> This is intended to implement the staged architecture established by CF-DISCOVERY-ARCH-001.

## Mandatory boundaries on this decision

1. This decision does not define the scoring formula.
2. This decision does not define signal weights.
3. This decision does not define numerical thresholds.
4. This decision does not authorize any particular candidate-ranking algorithm.
5. This decision does not authorize code implementation.
6. The concrete ranking/scoring/escalation mechanism must be proposed by engineering and undergo the appropriate governance review before implementation.
7. The deterministic stage must remain evidence-based and must not manufacture customer intent, willingness to buy, budget, project timing, or other unsupported facts.
8. AI research/qualification remains responsible for deeper interpretation after deterministic escalation.
9. Candidates must not be represented as qualified clients merely because they passed deterministic filtering.

## Explicit non-decisions

This record does **not** decide or authorize:

- Any scoring formula, weight, or numerical threshold.
- Any specific ranking algorithm.
- Any code, configuration, or `.env` change.
- Anything already decided or deferred under [CF-DISCOVERY-ARCH-002-Q1 through Q6, S5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md) — unaffected by this record.

## Consequences

With this decision, the parent questionnaire's §4 (Q1–Q6), §5, and §6 are now all answered. See §7 ("Consolidated status") of the parent questionnaire for the full roll-up and the preserved distinction between PO-authorized principles, future engineering proposals, and implementation authorization.

## What remains to be decided

- The concrete deterministic scoring/ranking/escalation mechanism (future engineering proposal + governance review).
- The engineering definitions deferred under Q1 ("confirmed no website" taxonomy), Q2 (persistence algorithm), and Q5 (sub-check definitions for dropped vague signals).
- Any future investigation/decision under Q3 (deferred business-activity signals), Q4 (public-intent-source investigation), and Q6 (WHOIS/RDAP reconsideration).
- The implementation plan itself, which requires its own separate implementation-authorization decision.

## Implementation authorization status

**NOT AUTHORIZED.** No code, configuration, `.env`, or data has been changed.
