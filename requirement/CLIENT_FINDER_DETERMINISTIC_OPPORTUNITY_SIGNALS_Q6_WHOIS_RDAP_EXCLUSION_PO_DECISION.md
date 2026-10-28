# CLIENT FINDER — DETERMINISTIC OPPORTUNITY SIGNALS — Q6 PARTIAL PO DECISION: EXCLUDE WHOIS/RDAP-BASED SIGNALS

**Decision ID:** CF-DISCOVERY-ARCH-002-Q6
**Parent questionnaire:** [CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md), §4 Q6
**Parent architecture decision:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md)
**Related partial decisions:** [CF-DISCOVERY-ARCH-002-Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md), [CF-DISCOVERY-ARCH-002-Q2](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q2_REACHABILITY_PERSISTENCE_PO_DECISION.md), [CF-DISCOVERY-ARCH-002-Q3](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q3_SCOPE_PO_DECISION.md), [CF-DISCOVERY-ARCH-002-Q4](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q4_PUBLIC_INTENT_SOURCE_INVESTIGATION_PO_DECISION.md), [CF-DISCOVERY-ARCH-002-Q5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q5_DECOMPOSE_VAGUE_SIGNALS_PO_DECISION.md)
**Decision title:** Exclude WHOIS/RDAP-based signals from the current deterministic opportunity-signal scope
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Answers Q6 only. This is the last of the parent questionnaire's signal-specific questions (Q1–Q6) to be answered. The signal-combination rule (§5) and the AI-escalation boundary (§6) of the parent questionnaire remain open and unanswered.

## Context

The parent questionnaire flagged signals #24 ("newly launched business," via domain-registration age as a proxy) and #34 ("domain-registration age" as a standalone proxy) as requiring a WHOIS/RDAP lookup, with data-use terms and constraints not yet audited. Note that #24 is also within the business-activity category deferred under [CF-DISCOVERY-ARCH-002-Q3](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q3_SCOPE_PO_DECISION.md); this decision separately and specifically excludes the WHOIS/RDAP *mechanism* itself (including as it would apply to #34, which is not a business-activity signal). Q6 asked whether to pursue WHOIS/RDAP-based signals now or exclude them.

## PO decision

**EXCLUDE WHOIS/RDAP-BASED SIGNALS FOR NOW.** Signals #24 and #34 (where WHOIS/RDAP-derived) are not included in the current deterministic opportunity-signal scope.

## Exact authoritative wording

> WHOIS/RDAP-derived signals (#24 and #34, where applicable in the questionnaire) are NOT included in the current deterministic opportunity-signal scope.
>
> Reason: The audit identified unresolved data-use terms/constraints, and the current Client Finder can proceed with other website-observable signals that do not require this additional uncertainty.

## Mandatory boundaries on this decision

1. Do not implement WHOIS/RDAP-based signals.
2. Do not add WHOIS/RDAP data collection.
3. Do not integrate a WHOIS/RDAP provider as part of this scope.
4. Do not treat WHOIS/RDAP information as evidence in deterministic opportunity scoring.
5. Do not infer that WHOIS/RDAP is permanently prohibited — this is a scope exclusion for now, not a ban.
6. A future PO decision may reconsider these signals after a dedicated investigation establishes: exact data source, permitted use, applicable terms, technical availability, cost, freshness, reliability, and product value.

This decision applies only to the current deterministic opportunity-signal scope.

## Explicit non-decisions

This record does **not** decide or authorize:

- A permanent prohibition on WHOIS/RDAP data use — reconsideration remains available via a future, separately-investigated PO decision.
- The signal-combination rule (parent questionnaire §5, options A–E) — open.
- The AI-escalation boundary (parent questionnaire §6, options A–D) — open.
- Any code, configuration, or `.env` change.
- Anything already decided or deferred under [CF-DISCOVERY-ARCH-002-Q1 through Q5](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md) — unaffected by this record.

## Consequences

- The current deterministic opportunity-signal scope proceeds without any WHOIS/RDAP-derived evidence.
- With Q1–Q6 now all answered, the parent questionnaire's remaining open items are exactly: the signal-combination rule (§5) and the AI-escalation boundary (§6).

## What remains to be decided

- The signal-combination rule (parent questionnaire §5: options A–E).
- The AI-escalation boundary (parent questionnaire §6: options A–D).
- Any future dedicated WHOIS/RDAP investigation, if the PO later chooses to open one.

## Implementation authorization status

**NOT AUTHORIZED.** No code, configuration, `.env`, or data has been changed.
