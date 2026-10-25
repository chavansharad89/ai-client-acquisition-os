# CLIENT FINDER — SERVICE + GEOGRAPHY ONLY SEARCH INPUT — PRODUCT OWNER DECISION

**Decision ID:** CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001
**Related decisions:** [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) (17-family catalogue), [CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001](CLIENT_FINDER_PHASE_8_ENTITY_REALITY_ACTIVATION_PO_DECISION.md) D6 (17-family service selection) and D10 (historical service data, forward-only enforcement)
**Decision title:** The freelancer-facing Client Finder search form collects exactly two inputs — Service and Geography — going forward
**Date:** 2026-10-18
**Authority:** Product Owner
**Scope of this record:** Governance-only. Defines the freelancer-facing search *input* surface for NEW searches. Does **not** change, backfill, or reinterpret any historical `service_profiles`/`searches` row, the 17-family catalogue, Phase 7B, Phase 8, the deterministic opportunity layer, ranking, AI-admission architecture, or the ₹99/₹499/₹1,499 commercial flows. Does **not** authorize implementation.

## Context

The current New Search form collects seven fields: service, target customer, geography, minimum project value, signals worth researching (triggers), keywords, and rationale ("why this fit"). A prior read-only audit of this form (this session, 2026-10-17/18) traced each field to its production consumers and found:

- `triggers` and `keywords` were always intended as **system-derived rule fields**, not freelancer input — migration `0013_service_profiles` states this directly ("System-derived rule fields (DEC-004). How they are derived is an open question (OQ-4)"), and OQ-4 has remained `PENDING`/`NONE` ever since (`CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md:374`). The current UI exposing them as freelancer-facing checkboxes/text (including the raw `ResearchSourceKind` vocabulary — `WEBSITE`, `JOB_POST`, `LINKEDIN`, `NEWS`, `FUNDING`, `TECH_STACK`, `REVIEW`, `MANUAL`) was an implementation choice that diverged from that original intent, not a separate PO decision.
- `minimum project value`'s only runtime consumer passes it straight through as the "estimated value" of any detected offer and then compares that value against itself (`evaluateMinimumValueMatch`), which can never fail. It filters nothing today.
- `rationale` ("why this fit") is echoed verbatim into every matching Opportunity's displayed rationale for a given search, rather than being computed per business.
- `target customer` has real runtime effects (shapes the Discovery query text; feeds Research's target-customer-match and category-plausibility checks) but is also the one field most in tension with "the system should determine the rest."

The PO has reviewed these findings and decided to simplify the freelancer-facing input surface rather than attempt to fix each field's behavior individually.

## PO decision

**Client Finder's freelancer-facing search input is reduced to exactly two fields:**

1. **Service** — exactly one of the 17 canonical top-level service families.
2. **Geography** — a freelancer-provided discovery location constraint.

**The freelancer tells the system WHAT I SELL + WHERE I WANT CLIENTS. The Client Finder system determines the rest.**

### 1. Service

- Remains governed by `CF-SERVICE-CATALOG-PO-DEC-001` and `CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001` D6.
- Must remain exactly one of the 17 canonical top-level service families — no subservice selection, no free text, no change to the catalogue.
- This decision does not reopen, reinterpret, or modify D6 or `CF-SERVICE-CATALOG-PO-DEC-001` in any way.

### 2. Geography

- Remains a required, freelancer-provided discovery constraint, collected and used exactly as today.

### 3. Fields no longer freelancer-facing

The following are **no longer freelancer-facing search inputs**, effective for new searches created after implementation:

- Target customer
- Minimum project value
- Signals worth researching / triggers
- Keywords
- Why this fit / rationale

Removing a field from the freelancer-facing UI does **not** by itself decide:
- whether/how the backend continues to populate the corresponding stored value for new searches (default, system-derived, or otherwise),
- whether any downstream consumer of that value (Discovery query construction, offer/need matching, Research, qualification-equivalence analytics) changes behavior, or
- how OQ-4 (system-derivation mechanism for triggers/keywords) is ultimately resolved.

Those are implementation/engineering questions (some of which may themselves require a further, separate PO decision — see the companion audit, `CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_BACKEND_IMPACT_AUDIT.md`) and are explicitly **not** decided by this record.

### 4. Scope: new searches only

- This decision applies to **NEW searches created after implementation**, not retroactively.
- Historical `service_profiles` rows and historical `searches.parameters` snapshots must **not** be rewritten, backfilled, or reinterpreted — consistent with D10's forward-only enforcement pattern.
- No historical database column is deleted or dropped merely because a field is removed from the new-search UI. Columns persist; historical rows remain exactly as they were created, auditable under their original snapshot.
- Existing backend behavior for the five removed fields must be fully audited (see companion audit) before any implementation begins.

## Exact authoritative wording

> The Client Finder freelancer-facing search input is reduced to exactly two fields: one canonical top-level Service family (unchanged governance: `CF-SERVICE-CATALOG-PO-DEC-001`, D6), and one Geography value.
>
> Target customer, minimum project value, signals worth researching/triggers, keywords, and why-this-fit/rationale are no longer freelancer-facing search inputs, effective for new searches.
>
> This decision does NOT itself decide how the backend populates, defaults, or derives the removed fields' stored values for new searches, nor does it decide whether any downstream consumer's behavior changes as a result. Those remain separate engineering-planning or PO decisions, to be resolved via the companion backend-impact audit before implementation.
>
> This decision applies to NEW searches only. Historical `service_profiles` and `searches` rows are NOT rewritten, backfilled, or reinterpreted. No historical column is dropped.
>
> This decision does NOT authorize implementation.

## Mandatory boundaries on this decision

1. This is a governance/product-input-scope decision only.
2. No code, configuration, `.env`, database schema, or data change is authorized by this decision.
3. No migration is authorized by this decision.
4. This decision does not modify `CF-SERVICE-CATALOG-PO-DEC-001`, `CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001` (D6/D10 or any other item within it), any Phase 7B decision, or any Phase 8 decision.
5. This decision does not resolve OQ-4 (triggers/keywords derivation mechanism) or any other open question in `CLIENT_INTENT_DISCOVERY_OQ_DECISION_LOG.md`.
6. This decision does not authorize any specific default, fallback, or system-derivation behavior for the five removed fields — see companion audit for what remains open.

## Explicit non-decisions

This record does **not** decide or authorize:

- How `targetCustomer`, `minProjectValuePaise`, `triggers`, `keywords`, or `rationale` are populated, defaulted, or derived for new searches going forward.
- Any change to the Discovery query-construction logic, the offer/need-matching engine (`suggestOffers()`), the qualification-equivalence criteria, Research's target-customer-match or category-plausibility checks, or ranking.
- Any UI implementation (form markup, copy, validation messages).
- Any new product behavior to replace what the removed fields currently (or nominally) do.
- Any code, test, schema, or migration change.

## Consequences

- The freelancer-facing New Search form's target shape becomes: "What service do you offer?" + "Where do you want to find clients?" → "Find my next clients."
- A separate, read-only backend-impact audit (`CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_BACKEND_IMPACT_AUDIT.md`) must be completed and reviewed before implementation, per this record's own requirement (§ "Fields no longer freelancer-facing").
- Any backend default/derivation behavior that changes what a new search's resulting Opportunities look like (as opposed to merely changing who types a value into a form) requires its own PO decision before implementation, per the Governance Rule below.

## What remains to be decided

- Whether/how the backend supplies `targetCustomer` for new searches, and whether Research's target-customer-match/category-plausibility checks remain active without freelancer-authored input.
- Whether/how the backend supplies `triggers` and `keywords` for new searches such that offer/need-detection (`suggestOffers()`) continues to function, given both are AND-gated inputs whose absence silently disables matching entirely.
- Whether `minProjectValuePaise` is retained as an inert constant, retired from the qualification-equivalence check, or redesigned to be a real filter (a separate, future decision either way).
- Whether `rationale`/"why this fit" is replaced by a system-generated per-business explanation, retired from `Opportunity.offer.rationale`, or defaulted to a fixed non-empty placeholder.
- Resolution of OQ-4 (unchanged, still open).

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED.** This record decides the freelancer-facing input surface only. No code, configuration, `.env`, database schema, test, or data change is authorized by this record. Nothing has been committed or pushed. Implementation may not begin until the companion backend-impact audit's open items are resolved (either as engineering-planning detail within this decision's authorized scope, or via further, separate PO decisions where the audit identifies one is required).
