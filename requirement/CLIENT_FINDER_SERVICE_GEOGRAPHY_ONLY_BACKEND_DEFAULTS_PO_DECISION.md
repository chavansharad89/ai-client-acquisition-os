# CLIENT FINDER — SERVICE + GEOGRAPHY ONLY — BACKEND DEFAULT/DERIVATION BEHAVIOR — PRODUCT OWNER DECISION

**Decision ID:** CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002
**Related decisions:** [CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001](CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_SEARCH_INPUT_PO_DECISION.md) (parent decision — freelancer-facing input reduced to Service + Geography), [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) (17-family catalogue), [CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001](CLIENT_FINDER_PHASE_8_ENTITY_REALITY_ACTIVATION_PO_DECISION.md) D6/D10
**Decision title:** Backend default/derivation behavior for the five fields no longer collected from the freelancer (target customer, minimum project value, triggers, keywords, rationale)
**Date:** 2026-10-18
**Authority:** Product Owner
**Scope of this record:** Governance-only. Resolves the four implementation blockers identified in the read-only backend-impact audit that followed `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001`. Does **not** authorize implementation. Does **not** modify `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001`, `CF-SERVICE-CATALOG-PO-DEC-001`, D6/D10, Phase 7B, Phase 8, OQ-4, or any other historical governance record.

## Context

`CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001` reduced the freelancer-facing search form to Service + Geography but explicitly deferred the question of how the backend would continue to populate `targetCustomer`, `minProjectValuePaise`, `triggers`, `keywords`, and `rationale` for new searches. The companion backend-impact audit (same session) found that two of those fields (`triggers`, `keywords`) are load-bearing inputs to `suggestOffers()`'s AND-gate matching logic — silently defaulting them to empty would disable all need/offer detection — and that `targetCustomer` drives real Discovery/Research behavior, not just display. The audit therefore reported **BLOCKED ON PO DECISIONS** and presented each option set to the Product Owner without recommending one, per that audit's own instruction not to resolve product-intent questions by engineering convenience.

The Product Owner has now reviewed the option sets and decided all four.

## PO decision

### D1 — Triggers + Keywords: Option A (keep the AND-gate; system supplies both lists)

**Decided:** `suggestOffers()`'s existing AND-gate (a signal must match a trigger kind AND a keyword substring) is **unchanged**. For new searches, the SYSTEM — not the freelancer — supplies both the `triggers` list and the `keywords` list stored on the `ServiceProfile`/`Search` snapshot.

**Not decided by this record (engineering-planning detail, within this authorized constraint):** the exact default trigger-kind set and the exact default/derived keyword list or content. Options B (OR-gate) and C (remove the gate, redesign matching around Research evidence directly) are **not adopted**.

### D2 — Target Customer: Option C (disable target-customer-dependent features for new searches)

**Decided:** For new searches:
- Discovery's query construction carries **no** target-customer clause.
- **No** `categoryPlausibility` determination is produced.
- **No** `targetCustomerMatch` (TCM) evaluation is produced.

Research and Discovery for new searches operate on service + geography alone. Options A (generic system value, features kept running) and B (derive a value from the service-family taxonomy) are **not adopted**.

**Not decided by this record (engineering-planning detail):** the exact revised shape of the Discovery query string once the target-customer clause is removed.

### D3 — Minimum Project Value: Approved

**Decided:** New searches store `minProjectValuePaise = 0` as a fixed internal value. No new pricing or project-value-estimation rule is introduced. `evaluateMinimumValueMatch()`/the `MINIMUM_VALUE_MATCH` qualification-equivalence criterion may continue to run unchanged (it was already a no-op comparison before this decision and remains one).

### D4 — Rationale: Option A (fixed generic placeholder; existing data flow intact)

**Decided:** New searches store one fixed, generic internal rationale string in place of freelancer-authored text. The existing data flow (`ServiceProfile.rationale` → `ServiceRule.rationale` → `suggestOffers()`'s `{signal}` template substitution → `Opportunity.offer.rationale` → opportunity-detail display) is **unchanged**. Option B (no rationale at all, with validation and presentation changed to support absence) is **not adopted**.

**Not decided by this record (engineering-planning detail):** the exact wording of the placeholder string. This record does **not** authorize or design any future AI-generated, per-business "why contact this business" mechanism — that remains explicitly out of scope, as instructed.

## Exact authoritative wording

> D1: For NEW searches, the trigger/keyword AND-gate in the offer/need-detection matching logic is unchanged; the system supplies both the trigger-kind list and the keyword list. The freelancer no longer supplies either.
>
> D2: For NEW searches, target-customer-dependent features (Discovery query's target-customer clause, categoryPlausibility, target-customer-match) are disabled. Discovery and Research operate on service + geography alone.
>
> D3: For NEW searches, minProjectValuePaise is stored as a fixed internal value of 0. No new project-value-estimation or pricing rule is introduced.
>
> D4: For NEW searches, rationale is a fixed, generic, system-supplied internal placeholder string. The existing rationale data flow (ServiceRule → suggestOffers() template substitution → Opportunity.offer.rationale → display) is unchanged.
>
> Historical `service_profiles` and `searches` rows are unaffected by D1–D4. No historical column is dropped. No backfill is performed.
>
> This decision does NOT itself authorize implementation.

## Mandatory boundaries on this decision

1. This is a governance/product-behavior decision only, for the four items (D1–D4) above.
2. No code, configuration, `.env`, database schema, test, or data change is authorized by this decision.
3. No migration is authorized by this decision.
4. This decision does not modify `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001`, `CF-SERVICE-CATALOG-PO-DEC-001`, D6/D10 within `CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001`, any Phase 7B decision, or any Phase 8 decision.
5. This decision does not resolve OQ-4 as an open question in the abstract — it decides, specifically, that for new Client Finder searches the system (not the freelancer) supplies `triggers`/`keywords`, while leaving the exact default content/derivation mechanism as engineering-planning detail.
6. This decision does not authorize or design any AI-generated, per-business rationale mechanism (D4), any service-family-derived target-customer phrase (D2 explicitly rejects deriving one), or any redesigned project-value estimation (D3).

## Explicit non-decisions

This record does **not** decide or authorize:

- The exact default trigger-kind list or keyword list/content for D1.
- The exact revised Discovery query string shape for D2.
- Any future per-business rationale-generation mechanism for D4.
- Any UI implementation, code change, test change, schema change, or migration for any of D1–D4.
- Resolution of OQ-4 as a general open question beyond what D1 specifically decides.

## Consequences

- `suggestOffers()`'s matching semantics are unchanged; only who supplies its two inputs changes (D1).
- New searches will not produce `categoryPlausibility` or `targetCustomerMatch` records, and their Discovery query text will omit a target-customer clause (D2) — this is a real behavioral difference from historical searches, which is expected and authorized by D2, not a regression to be fixed.
- `minProjectValuePaise` and its qualification-equivalence check remain exactly as inert as they were before this decision (D3).
- `Opportunity.offer.rationale` remains populated and displayed for new searches, via a fixed placeholder rather than freelancer-authored text (D4).
- Historical searches remain fully reproducible under their original snapshots and continue to exhibit their original (pre-this-decision) behavior, since nothing here touches `search.parameters` for existing rows.

## What remains to be decided (engineering-planning detail, not additional PO decisions, unless a future audit finds otherwise)

- The exact default `triggers`/`keywords` content supplied by the system (D1).
- The exact revised `buildQuery()` string shape once the target-customer clause is removed (D2).
- The exact placeholder rationale string (D4).
- Which specific files/layers own supplying these defaults (service layer vs. API route vs. elsewhere) — implementation detail, not decided here.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED.** This record closes the PO decision round that `CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001`'s backend-impact audit identified as blocking. No code, configuration, `.env`, database schema, test, or data change is authorized by this record. Nothing has been committed or pushed. A separate, explicit go-ahead to begin implementation is still required and has not been given by this record.
