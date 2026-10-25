# CLIENT FINDER — DETERMINISTIC OPPORTUNITY SIGNALS — Q1 PARTIAL PO DECISION: "NO WEBSITE" SIGNAL

**Decision ID:** CF-DISCOVERY-ARCH-002-Q1
**Parent questionnaire:** [CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md), §4 Q1
**Parent architecture decision:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md)
**Decision title:** "No website" as a positive deterministic opportunity signal
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Answers Q1 only. Q2–Q6, the signal-combination rule (§5), and the AI-escalation boundary (§6) of the parent questionnaire remain open and unanswered.

## Context

The questionnaire's existing-facts audit found that `normalizeCandidate()` ([normalize.ts:43-51](packages/core-discovery/src/normalize.ts:43)) currently drops any discovery candidate with no website field before it is ever persisted — i.e. "no website" today causes exclusion, not flagging. Q1 asked whether "no website" should instead become a positive opportunity signal within the deterministic filtering stage authorized in shape (not implementation) by CF-DISCOVERY-ARCH-001.

## PO decision

**YES.** "No website" shall be treated as a positive deterministic opportunity signal for Client Finder.

## Exact authoritative wording

> "No website" should be treated as a POSITIVE deterministic opportunity signal for Client Finder.
>
> Rationale: Client Finder is intended to identify potential customers for services including website development and redesign. A real business with no website can therefore represent a legitimate high-value opportunity rather than an invalid discovery candidate.
>
> The current behavior of dropping candidates with no website must NOT be treated as the future product requirement. It is existing implementation behavior that conflicts with the newly decided staged discovery architecture.

## Mandatory boundaries on this decision

1. This decision does **not** authorize any code change.
2. `packages/core-discovery` must **not** be changed as a result of this decision alone.
3. The signal must **not** be implemented yet.
4. A missing website field alone must **not** be assumed to prove a business has no website.
5. The engineering definition of "confirmed no website" — to be produced later, under a separate engineering-design decision — must distinguish at least:
   - confirmed absence of a website,
   - temporary fetch/discovery failure,
   - ambiguous/unknown website status.
6. No website-absence claim may be manufactured where the evidence is insufficient to support one of the three categories in (5).

## Explicit non-decisions

This record does **not** decide or authorize:

- Q2 (single fetch vs. repeated-over-time-window for reachability signals) — open.
- Q3 (whether to pursue business-activity signals #24–#29) — open.
- Q4 (authorizing investigation of a data source for signal #30) — open.
- Q5 (which vague signals to drop vs. decompose) — open.
- Q6 (WHOIS/RDAP-based signals #24/#34) — open.
- The signal-combination rule (parent questionnaire §5, options A–E) — open.
- The AI-escalation boundary (parent questionnaire §6, options A–D) — open.
- The precise engineering definition of "confirmed no website" / "temporary failure" / "ambiguous" — open; required before implementation per boundary (5) above.
- Any change to `normalize.ts`, `core-discovery`, or any other code or configuration.

## Consequences

- A future engineering-design decision must define, in machine-observable terms, how "confirmed no website" is distinguished from a temporary fetch failure or an ambiguous result, before any implementation proceeds.
- A future implementation-authorization decision is required before `packages/core-discovery`'s current behavior (dropping no-website candidates) may be changed.
- Q2–Q6 and the combination/escalation-boundary choices remain required before the deterministic filtering stage as a whole can be authorized for implementation.

## What remains to be decided

Everything listed under "Explicit non-decisions" above, plus the engineering design for operationalizing this Q1 answer.

## Implementation authorization status

**NOT AUTHORIZED.** No code, configuration, `.env`, or data has been changed. `packages/core-discovery` remains unmodified.
