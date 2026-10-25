# CLIENT FINDER — DETERMINISTIC OPPORTUNITY SIGNALS — Q2 PARTIAL PO DECISION: REACHABILITY PERSISTENCE

**Decision ID:** CF-DISCOVERY-ARCH-002-Q2
**Parent questionnaire:** [CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md), §4 Q2
**Parent architecture decision:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md)
**Related partial decision:** [CF-DISCOVERY-ARCH-002-Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md) (no-website signal)
**Decision title:** Repeated checks / persistence required before treating unreachability as a signal
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Answers Q2 only. Q3–Q6, the signal-combination rule (§5), and the AI-escalation boundary (§6) of the parent questionnaire remain open and unanswered.

## Context

The questionnaire's existing-facts audit found that `fetchHomepage()` ([sourceDocumentProvider.ts:92-135](packages/core-research/src/sourceDocumentProvider.ts:92)) already distinguishes transient transport failures (network/timeout/5xx, retried once then thrown) from permanent/unusable results (4xx, non-HTML, too-short extraction), but this logic runs downstream of the current AI-invocation point and is not wired as a pre-AI persistence check. Q2 asked whether a single fetch failure should be sufficient to treat a candidate's website as unavailable, or whether repeated checks over time should be required.

## PO decision

**REPEATED CHECKS / PERSISTENCE REQUIRED.** A single website-fetch/reachability failure must NOT be treated as a persistent website-unavailability opportunity signal.

## Exact authoritative wording

> The deterministic discovery stage should distinguish:
>
> 1. Website reachable
> 2. Website temporarily/unreliably unreachable
> 3. Website persistently unreachable
> 4. No website confirmed
> 5. Website status unknown/ambiguous
>
> A transient HTTP, DNS, timeout, rate-limit, or similar failure must not automatically become a positive opportunity signal.
>
> Repeated checks over an appropriate time window should be used before classifying a website as persistently unreachable.

## Mandatory boundaries on this decision

1. This decision does **not** specify the number of checks required.
2. This decision does **not** specify the time window over which checks occur.
3. This decision does **not** authorize any code change.
4. The exact persistence algorithm is an engineering decision to be proposed later, separately.
5. Persistent unreachability must **not** be equated with confirmed absence of a website ([CF-DISCOVERY-ARCH-002-Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md) remains a distinct evidence state).
6. "No website" and "website persistently unreachable" must remain distinguishable evidence states (per the five-state taxonomy above), not merged into one signal.

## Explicit non-decisions

This record does **not** decide or authorize:

- The number of checks or retry count.
- The time window or scheduling cadence for repeated checks.
- Q3 (whether to pursue business-activity signals #24–#29) — open.
- Q4 (authorizing investigation of a data source for signal #30) — open.
- Q5 (which vague signals to drop vs. decompose) — open.
- Q6 (WHOIS/RDAP-based signals #24/#34) — open.
- The signal-combination rule (parent questionnaire §5, options A–E) — open.
- The AI-escalation boundary (parent questionnaire §6, options A–D) — open.
- Any change to `sourceDocumentProvider.ts`, `core-research`, `core-discovery`, or any other code or configuration.

## Consequences

- A future engineering-design decision must propose the specific persistence algorithm (check count, interval/time window, and how "temporarily/unreliably unreachable" transitions to "persistently unreachable") before implementation.
- The five-state taxonomy above (reachable / temporarily unreachable / persistently unreachable / no website confirmed / unknown-ambiguous) becomes the required vocabulary for that future engineering design — it must not be collapsed to fewer states without a further PO decision.
- Q3–Q6 and the combination/escalation-boundary choices remain required before the deterministic filtering stage as a whole can be authorized for implementation.

## What remains to be decided

Everything listed under "Explicit non-decisions" above, plus the engineering design for the persistence algorithm itself.

## Implementation authorization status

**NOT AUTHORIZED.** No code, configuration, `.env`, or data has been changed.
