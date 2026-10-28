# CLIENT FINDER — SINGLE SERVICE PER SEARCH — PRODUCT OWNER DECISION

**Decision ID:** CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001
**Related decisions:** [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) (17-family service catalogue), [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md) (staged discovery architecture), [CF-DISCOVERY-ARCH-002-Q1..Q6/S5/S6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md) (deterministic opportunity signals), [CF-DISCOVERY-ARCH-002 Item #9](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md) (strong-signal bypass principle)
**Decision title:** Each Client Finder search is scoped to exactly one top-level service; that service is the authoritative context for the search
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Governance-only. Defines the search-level service-selection rule. Does **not** decide, change, or reinterpret any deterministic signal, scoring, weight, threshold, ranking rule, AI-escalation mechanism, data source, or provider/model choice. Does **not** alter the 17-family service catalogue or any sub-service list established by `CF-SERVICE-CATALOG-PO-DEC-001`.

## Context

`CF-SERVICE-CATALOG-PO-DEC-001` established that Client Finder is a general freelancer client-discovery system spanning 17 top-level service families, that a user "may select multiple top-level services where appropriate" (rule #3 of that decision), and that the deterministic opportunity layer must ultimately be service-aware. That decision left open, as future PO/engineering work, several questions this governance review had surfaced about multi-service handling within a single search — specifically whether one candidate relevant to multiple selected services is represented once or per-service, and whether ranking/escalation is combined or per-service when multiple services are selected simultaneously within one search.

The PO has now made a narrower, search-level decision that resolves the "within one search" form of those questions by removing simultaneous multi-service selection from the search unit itself.

## PO decision

**A freelancer selects exactly one top-level service for each Client Finder search. That service is the authoritative service context for the search, and results are always presented according to it.**

1. A freelancer selects exactly one top-level service for each Client Finder search.
2. The freelancer does not select multiple top-level services within the same search.
3. The selected service is the authoritative service context for that search.
4. Client Finder results are therefore always presented according to that single selected top-level service.
5. If a freelancer wants to find clients for another service, they create/run another Client Finder search and select that other top-level service.
6. The freelancer selects a top-level service, not an individual sub-service (e.g. select "Video & Reels," not "Reel Creation," "YouTube Video Editing," or "Product Videos" individually).
7. Sub-services remain internal supporting metadata and may be used by the system for: research; qualification; opportunity detection; ranking; personalization; recommended offer generation.
8. The user-facing search/result context remains the selected top-level service.
9. This removes the need for multi-service opportunity representation within one search.
10. This removes the need for combined multi-service ranking/escalation within one search.
11. Every search therefore has exactly one authoritative service context.
12. The service-aware opportunity layer can evaluate candidates in the context of that selected service.
13. The AI research/qualification process can also use the selected service as context.

## Exact authoritative wording

> A freelancer selects EXACTLY ONE top-level service for each Client Finder search.
>
> The freelancer does NOT select multiple top-level services within the same search.
>
> The selected service is the authoritative service context for that search.
>
> Client Finder results are therefore always presented according to that single selected top-level service.
>
> If a freelancer wants to find clients for another service, they create/run another Client Finder search and select that other top-level service.
>
> The freelancer selects a TOP-LEVEL SERVICE, not an individual sub-service.
>
> Sub-services remain internal supporting metadata and may be used by the system for research, qualification, opportunity detection, ranking, personalization, recommended offer generation.
>
> The user-facing search/result context remains the selected TOP-LEVEL SERVICE.
>
> This removes the need for multi-service opportunity representation within one search.
>
> This removes the need for combined multi-service ranking/escalation within one search.
>
> Every search therefore has exactly one authoritative service context.
>
> This decision does NOT define the deterministic opportunity signals for any service.
>
> This decision does NOT define scoring, weights, thresholds, ranking algorithms, AI escalation mechanisms, providers, models, or costs.
>
> This decision does NOT authorize implementation.
>
> All 17 previously approved top-level service families and their sub-services remain unchanged and continue to be governed by `CF-SERVICE-CATALOG-PO-DEC-001`.

## Governance clarification — relationship to `CF-SERVICE-CATALOG-PO-DEC-001` rule #3

This is a clarification, not a reinterpretation or reopening, of `CF-SERVICE-CATALOG-PO-DEC-001`:

- `CF-SERVICE-CATALOG-PO-DEC-001` rule #3 states a freelancer "may select multiple top-level services where appropriate." That permission is satisfied at the **account/product level, across distinct searches** — a freelancer may run as many searches as they like, each covering a different service — not by selecting more than one service **simultaneously within a single search**. This decision narrows the unit of service selection to the search, not the account or the catalogue.
- The 17-family catalogue, its sub-service lists, the top-level-result-presentation rule, and the internal-use permissions for sub-services (all established by `CF-SERVICE-CATALOG-PO-DEC-001`) are unchanged.
- The deterministic-opportunity-layer governance questionnaire (`CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md`) previously surfaced open questions, via governance review, about whether a candidate relevant to multiple selected services should be represented once or per-service, and whether ranking/escalation should be combined or per-service when multiple services are selected. This decision resolves the **within-one-search** form of those questions: since a search has exactly one service context, no multi-service representation or combined multi-service ranking/escalation mechanism is needed for a single search. The questionnaire has been updated accordingly (see below).
- This decision does **not** resolve whether/how results from a freelancer's multiple separate single-service searches are aggregated, compared, or presented together in any account-level view (e.g. a cross-search dashboard) — that remains open, undecided, future product/engineering scope if it is ever requested.

## Mandatory boundaries on this decision

1. This is a governance/product-scope decision only.
2. No code, configuration, `.env`, database schema, or data change is authorized by this decision.
3. No deterministic signal, scoring rule, weight, threshold, ranking algorithm, or AI-escalation mechanism is authorized, changed, or reinterpreted by this decision.
4. No discovery/research/qualification behavior is changed by this decision.
5. This decision does not resolve, close, or answer any other open item in `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md`, in `CF-DISCOVERY-ARCH-002` Q1–Q6/S5/S6/Item #9, or in `CF-SERVICE-CATALOG-PO-DEC-001`, other than the narrow within-one-search multi-service representation/ranking point described above. All other items remain exactly as open or decided as they were before this record.
6. This decision does not alter the 17-family catalogue, sub-service lists, or any rule of `CF-SERVICE-CATALOG-PO-DEC-001` other than clarifying how rule #3 is satisfied (across searches, not within one).

## Explicit non-decisions

This record does **not** decide or authorize:

- Any concrete deterministic signal, scoring rule, weight, threshold, or ranking algorithm for any service family.
- The AI-escalation mechanism, strong-signal classifications, or the Top-N/threshold/hybrid choice (questionnaire items #8–#10; Item #9's principle-only status is unchanged).
- Any data source or public-intent source for any service family.
- Any provider/model selection or cost ceiling.
- Any technical implementation, code, configuration, schema, or data change.
- Whether/how a freelancer's results across multiple separate single-service searches are ever aggregated or compared in an account-level view.
- Whether services with no deterministic signal set yet behave differently in discovery/research/qualification — that question remains exactly as open as it was before this record (see `CF-SERVICE-CATALOG-PO-DEC-001` and the questionnaire's open items).

## Consequences

- Each Client Finder search carries exactly one authoritative top-level-service context, from selection through result presentation.
- The deterministic opportunity layer and the AI research/qualification process may use that single selected service as context when they are eventually built for a given service family — but no such service-specific mechanism exists or is authorized today, for any family including Web & Software Development.
- The multi-service opportunity-representation and combined multi-service ranking/escalation questions, as previously surfaced by governance review in the context of a single search, no longer need to be answered — they are moot for the single-search unit of work.
- Any future account-level, cross-search aggregation feature (if ever requested) would be a separate product decision, not covered here.

## What remains to be decided

- Service-specific deterministic signals, scoring, weights, thresholds, ranking, and AI-escalation mechanisms for each of the 17 service families (only Web & Software Development has any decided scope today, via `CF-DISCOVERY-ARCH-002`).
- Exact discovery/research/qualification behavior for a search whose selected service has no deterministic signal set yet — this was already open before this decision and remains open; this decision does not change it.
- Whether/how results across a freelancer's multiple single-service searches are ever presented together at the account level.
- All items already open in `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` remain open, unaffected by this decision except for the narrow clarification recorded above.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED.** No code, configuration, `.env`, database schema, or data has been changed. Nothing has been committed or pushed.
