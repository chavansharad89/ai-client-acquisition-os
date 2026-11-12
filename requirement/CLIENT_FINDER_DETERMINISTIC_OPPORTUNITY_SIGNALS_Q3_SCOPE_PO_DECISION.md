# CLIENT FINDER — DETERMINISTIC OPPORTUNITY SIGNALS — Q3 PARTIAL PO DECISION: SCOPE TO WEBSITE-OBSERVABLE SIGNALS

**Decision ID:** CF-DISCOVERY-ARCH-002-Q3
**Parent questionnaire:** [CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md), §4 Q3
**Parent architecture decision:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md)
**Related partial decisions:** [CF-DISCOVERY-ARCH-002-Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md) (no-website signal), [CF-DISCOVERY-ARCH-002-Q2](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q2_REACHABILITY_PERSISTENCE_PO_DECISION.md) (reachability persistence)
**Decision title:** Scope this decision to website-observable signals only; defer business-activity signals
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Answers Q3 only. Q4–Q6, the signal-combination rule (§5), and the AI-escalation boundary (§6) of the parent questionnaire remain open and unanswered.

## Context

The questionnaire's audit found that signals #24–#29 ("business activity" category: newly launched business, new location, expansion, new product/service, hiring activity, advertising activity) have no identified data source in this repository today, and some (hiring, advertising) carry real, unaudited policy risk. Q3 asked whether the current deterministic-signals decision should pursue these at all, or scope itself to website-observable signals only.

## PO decision

**SCOPE THIS DECISION TO WEBSITE-OBSERVABLE SIGNALS ONLY.** Business-activity signals #24–#29 are **deferred**, not rejected.

## Exact authoritative wording

> For the current deterministic opportunity-signals decision, Client Finder should focus on signals that can be derived from the discovered business's website presence, reachability, technical characteristics, UX, performance, and other directly observable website evidence.
>
> Business-activity signals #24–#29 are DEFERRED, not rejected.
>
> Do not make the following current deterministic requirements:
> - newly launched business
> - new location
> - expansion
> - new product/service
> - hiring activity
> - advertising activity
>
> These may be considered in a future PO decision after their data sources, freshness, policy/legal constraints, cost, and reliability have been separately investigated.

## Mandatory boundaries on this decision

1. This is a governance scope decision only.
2. No code, configuration, or `.env` changes are authorized by this decision.
3. No implementation or investigation of live external business-activity sources is authorized as part of this decision.
4. Business-activity signals #24–#29 remain explicitly listed as **DEFERRED** in the broader product concept — they are not deleted or rejected.
5. The website-observable signal questions in the parent questionnaire (Q4–Q6, combination rules, escalation boundary) continue unaffected by this scoping.

## Explicit non-decisions

This record does **not** decide or authorize:

- Any data source, vendor, or API for signals #24–#29, now or later.
- Rejection of signals #24–#29 — they remain open for a future, separate PO decision once data-source/freshness/policy/cost/reliability are investigated.
- Q4 (data-source investigation authorization for signal #30, "public request for help") — note #30 is a distinct signal from the deferred #24–#29 and remains independently open per the parent questionnaire.
- Q5 (which vague signals to drop vs. decompose) — open.
- Q6 (WHOIS/RDAP-based signals #24/#34) — note signal #24 ("newly launched business") falls inside this Q3 deferral; signal #34 ("domain-registration age" as a standalone proxy) is not itself a business-activity signal and remains independently open under Q6.
- The signal-combination rule (parent questionnaire §5, options A–E) — open.
- The AI-escalation boundary (parent questionnaire §6, options A–D) — open.
- Any code, configuration, or `.env` change.

## Consequences

- The current deterministic-signals workstream is scoped to website-observable evidence (presence, reachability, technical/HTTPS/certificate characteristics, UX/structure, performance, SEO/metadata, contact/CTA completeness) per the signal table in the parent questionnaire, minus signals #24–#29.
- A future, separate PO decision is required before any business-activity signal (#24–#29) can be investigated or implemented.

## What remains to be decided

Q4, Q5, Q6, the signal-combination rule, and the AI-escalation boundary — all still open, per the parent questionnaire, now explicitly scoped to website-observable signals.

## Implementation authorization status

**NOT AUTHORIZED.** No code, configuration, `.env`, or data has been changed.
