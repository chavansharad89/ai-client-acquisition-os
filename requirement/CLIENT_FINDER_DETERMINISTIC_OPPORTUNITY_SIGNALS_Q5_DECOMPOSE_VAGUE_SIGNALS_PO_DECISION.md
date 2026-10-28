# CLIENT FINDER — DETERMINISTIC OPPORTUNITY SIGNALS — Q5 PARTIAL PO DECISION: DROP VAGUE SIGNALS, REQUIRE DECOMPOSITION

**Decision ID:** CF-DISCOVERY-ARCH-002-Q5
**Parent questionnaire:** [CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md), §4 Q5
**Parent architecture decision:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md)
**Related partial decisions:** [CF-DISCOVERY-ARCH-002-Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md), [CF-DISCOVERY-ARCH-002-Q2](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q2_REACHABILITY_PERSISTENCE_PO_DECISION.md), [CF-DISCOVERY-ARCH-002-Q3](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q3_SCOPE_PO_DECISION.md), [CF-DISCOVERY-ARCH-002-Q4](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q4_PUBLIC_INTENT_SOURCE_INVESTIGATION_PO_DECISION.md)
**Decision title:** Drop vague signals as standalone deterministic signals; require decomposition into objectively testable sub-checks
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Answers Q5 only. Q6, the signal-combination rule (§5), and the AI-escalation boundary (§6) of the parent questionnaire remain open and unanswered.

## Context

The parent questionnaire's audit flagged signals #9, #10, #17, #21, #22, and #23 as not independently deterministic — each required either rendering-based judgment, an unoperationalized term ("major usability problems"), or was itself only a combination of other signals. Q5 asked whether to drop these outright, decompose them into the specific sub-checks the table already names (e.g. #8 viewport, #18 SEO metadata, #20 contact mechanism), or some other treatment.

## PO decision

**DROP the following as standalone deterministic signals; require decomposition into specific, objectively testable sub-checks before any of their underlying concepts may participate in deterministic scoring or AI escalation.**

## Exact authoritative wording

> The following vague signals must NOT independently operate as deterministic opportunity signals:
>
> #9 — "Obvious mobile rendering problems"
> #10 — "Major usability problems detectable automatically"
> #17 — "Poor HTML/technical structure"
> #21 — "Missing clear CTA"
> #22 — "Missing important business information"
> #23 — "Poor conversion-oriented structure"
>
> Where useful, these concepts may remain as higher-level categories/groupings, but they must be decomposed into specific machine-observable evidence before they can participate in deterministic scoring or AI escalation.
>
> The deterministic layer should prefer evidence that can be stated objectively, for example:
> - presence/absence of viewport configuration
> - specific broken resources
> - measurable technical conditions
> - presence/absence of defined metadata
> - presence/absence of defined contact mechanisms
> - other explicitly defined machine-checkable conditions

## Mandatory boundaries on this decision

1. None of these checks are implemented as a result of this decision.
2. No detailed sub-check definition is approved here — none of the examples above (viewport, broken resources, metadata, contact mechanisms) constitute pre-approval of the already-tabled signals #8/#16/#18/#20; they are illustrations of the *kind* of evidence that is acceptable, not a ratification of specific signal numbers.
3. Engineering may later propose exact measurable definitions for each dropped category (#9, #10, #17, #21, #22, #23) — those proposals require their own governance review before becoming requirements.
4. Any new signal not explicitly covered by this decision requires its own governance review.
5. A high-level category label ("mobile quality," "conversion quality," or any similar grouping term) must never itself be treated as objective evidence or wired into scoring/escalation logic directly.
6. The deterministic layer must remain evidence-based and reproducible: every signal that does participate in scoring or escalation must trace to a specific, machine-checkable condition.

## Explicit non-decisions

This record does **not** decide or authorize:

- Specific sub-check definitions, thresholds, or measurement methods for #9, #10, #17, #21, #22, #23 — these await a future engineering proposal and governance review.
- Approval of any already-tabled signal (#8, #16, #18, #20, or others) as a ratified requirement — those remain candidate/proposed signals from the parent questionnaire, not yet decided.
- Q6 (WHOIS/RDAP-based signals #24/#34) — open.
- The signal-combination rule (parent questionnaire §5, options A–E) — open.
- The AI-escalation boundary (parent questionnaire §6, options A–D) — open.
- Any code, configuration, or `.env` change.

## Consequences

- Signals #9, #10, #17, #21, #22, #23 are removed from consideration as standalone deterministic signals going forward in this decision thread; their underlying concepts may resurface only as named, specific, objectively testable sub-checks proposed by engineering and separately governance-reviewed.
- Future engineering proposals for these categories must express each sub-check as a specific, reproducible, machine-checkable condition — not a subjective quality judgment — to be eligible for governance review at all.

## What remains to be decided

- Exact sub-check definitions for the dropped categories, if and when engineering proposes them, each requiring its own governance review.
- Q6, the signal-combination rule, and the AI-escalation boundary — still open.

## Implementation authorization status

**NOT AUTHORIZED.** No code, configuration, `.env`, or data has been changed.
