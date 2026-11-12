# CLIENT FINDER — C-SERIES PRODUCT OWNER DECISION RECORD (C-1 THROUGH C-7)

**Decision ID:** CF-C-SERIES-PO-DEC-001
**Related decisions (not modified by this record):**
- [CF-DISCOVERY-ARCH-002-Q1](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md) — prior partial "no website" signal decision; C-1 is the authoritative successor on exclusion behavior
- [CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001](CLIENT_FINDER_PHASE_8_ENTITY_REALITY_ACTIVATION_PO_DECISION.md) — Phase 8 Entity Reality (unchanged by C-1)
- [CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001](CLIENT_FINDER_SERVICE_GEOGRAPHY_ONLY_SEARCH_INPUT_PO_DECISION.md) — Service + Geography-only input (unchanged)
- [CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001](CLIENT_FINDER_PHASE_7B_SUBSERVICE_RELEVANCE_AUTHORIZATION_PO_DECISION.md) — Phase 7B relevant-subservice decision (unchanged)
- [CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md) — seven-dimension qualitative ranking architecture (unchanged; C-4 operates within it)
- [CF-DISCOVERY-ARCH-002-S6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S6_AI_ESCALATION_BOUNDARY_PO_DECISION.md) — AI escalation boundary / deterministic-first and AI-budget architecture (unchanged; C-3B restates the non-dependency constraint at product level)
- [CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001](CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md) — Minimum Useful Lead Result (unchanged; C-6/C-7 build on it)
- `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` and related ₹1,499 commercial decisions (unchanged)
- K1 contact-identifier rules under `CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_*` (unchanged)

**Decision title:** Product Owner decisions C-1 through C-7 for Client Finder discovery inclusion, search messaging, service coverage, AI dependency, discovery provenance, opportunity list content, and "why found" explanation
**Date:** 2026-10-19
**Authority:** Product Owner
**Scope of this record:** Governance-only. Decides C-1 through C-7 as stated below. Does **not** authorize implementation. Does **not** modify production code, migrations, or any existing governance record. Nothing has been committed or pushed as part of this record.

## Context

This record resolves seven open product questions (C-1 through C-7) concerning Client Finder discovery inclusion rules, search-state messaging, service-family coverage, AI dependency, discovery provenance, opportunity-list presentation, and the "why found" explanation. Each decision below selects one option from the set presented to the Product Owner.

---

## C-1 — No-website businesses

**Selected: Option C.**

Businesses without a parseable website must **not** be automatically excluded from Client Finder discovery. A candidate may proceed when sufficient evidence establishes a real and identifiable business. Candidates that remain genuinely ambiguous or unusable may still be excluded under the existing Entity Reality rules.

Website absence is **not itself** proof of Entity Reality failure.

This decision does **not** reopen or alter Phase 8 Entity Reality semantics (`CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001`).

## C-2 — Zero-result search messaging

**Selected: Option B.**

A completed search must provide distinct freelancer-facing messaging for:
1. zero businesses discovered,
2. businesses discovered but zero opportunities created,
3. opportunities successfully created.

The underlying search lifecycle/state machine must **not** be unnecessarily changed unless implementation analysis later demonstrates that a change is required.

## C-3A — Service coverage

**Selected: Option A.**

All 17 canonical service families remain selectable. Evidence/discovery capability will be progressively expanded by service. The Service picker must **not** be restricted to currently mature services. This decision does **not** claim equal evidence coverage across all 17 services, and does **not** authorize inventing weak signals to create artificial coverage. The authoritative 17-family taxonomy is unchanged.

## C-3B — AI dependency

**Selected: Option C.**

Client Finder's core functionality must be capable of operating without AI/LLM calls. AI may remain an optional future enrichment layer, but AI must **not** be required for discovery, opportunity creation, qualification, or ranking. Mandatory per-search or per-lead LLM calls must **not** be introduced. The previously approved deterministic-first architecture is not silently changed by this decision.

The existing AI admission/budget architecture (`CF-DISCOVERY-ARCH-002-S6`) is **not** deleted by this record; this decision establishes that the core product cannot depend on it.

## C-4 — UNKNOWN ranking dimensions

**Selected: Option D.**

All seven ranking dimensions remain in the internal qualitative ranking model (`CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001`, unchanged). `UNKNOWN` is a valid internal state when evidence is unavailable and must **not** penalize an opportunity. Supporting dimensions for which evidence is unavailable should be hidden from the freelancer-facing UI rather than displaying literal `UNKNOWN`. Deterministic evidence producers should be added progressively. Evidence must **not** be fabricated, and numeric scoring is **not** introduced.

## C-5 — Discovery provenance

**Selected: Option B.**

Basic structured discovery provenance must be persisted, containing at minimum:
- provider,
- query,
- discovery timestamp.

This is the minimum discovery audit trail. This record does **not** expand provenance into a richer raw-provider model; any such expansion requires a future, separate PO decision.

## C-6 — Opportunity list

**Selected: Option B.**

The opportunities list must provide a compact Minimum Useful Lead Result (`CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`, unchanged) for each opportunity, allowing the freelancer to quickly understand why an opportunity is worth opening. The full detail page remains the location for complete evidence and supporting information. The entire detail page must **not** be duplicated into the list.

## C-7 — Why found

**Selected: Option C.**

The structured discovery provenance from C-5 is used to derive and display a freelancer-facing "Why found" explanation. A separate arbitrary free-text "why found" field must **not** be stored when the explanation can be derived from authoritative provenance.

Example concept: `Found through Google Places for "Web Development in Mumbai".`

Exact UI wording is an engineering/product-copy detail and is **not** separately decided by this record.

### Important distinction (binding on implementation)

- **Why found** = discovery provenance (C-5) explaining why the business entered the search result set.
- **Why contact** = Need/Opportunity and supporting evidence explaining why the freelancer may want to contact the business.

These two concepts must **not** be merged.

---

## Mandatory boundaries on this decision

1. This is a governance/product-decision record only.
2. No code, configuration, `.env`, database schema, migration, test, or data change is authorized by this decision.
3. No existing governance record is altered or reopened by this record.
4. This record does not reopen or modify:
   - the authoritative 17-family service taxonomy,
   - Service + Geography-only freelancer input (`CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001`),
   - the Phase 7B relevant-subservice decision (`CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001`),
   - the Phase 8 Entity Reality decision (`CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001`),
   - the seven-dimension qualitative ranking architecture (`CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001`),
   - the deterministic-first architecture and AI escalation budget architecture (`CF-DISCOVERY-ARCH-002-S6`),
   - the ₹1,499 commercial/subscription architecture,
   - K1 contact-identifier rules,
   - the Minimum Useful Lead Result PO decision (`CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`),
   - existing historical search/service-profile behavior.

## Explicit non-decisions

This record does **not** decide or authorize:

- Exact schema names, column names, table structures, or migrations for provenance (C-5), list fields (C-6), or "why found" rendering (C-7).
- Exact UI copy/wording for C-2 messaging, C-4 dimension hiding, or C-7's "why found" text.
- Specific deterministic signal rules or evidence producers for C-1, C-3A, or C-4.
- Any change to the search lifecycle/state machine beyond what C-2 requires, until implementation analysis determines a change is necessary.
- Any mechanism distinguishing "confirmed no website" from a temporary fetch failure or ambiguous result — remains open per `CF-DISCOVERY-ARCH-002-Q1`.
- Any code, test, schema, or migration change of any kind.

## Consequences

- A future engineering-design and implementation-authorization decision is required before any of C-1 through C-7 may be implemented in code, schema, or UI.
- `CF-DISCOVERY-ARCH-002-Q1`'s open engineering-definition requirement (distinguishing confirmed absence, temporary failure, and ambiguous website status) remains a precondition for C-1 implementation.

## Implementation authorization status

**NOT AUTHORIZED.** No production code, migration, configuration, `.env`, schema, or test file has been changed as part of this record. Nothing has been committed or pushed.

## Governance conflict check

**NO GOVERNANCE CONFLICT FOUND.** C-1 through C-7 were checked against the related decisions listed above and found consistent with each: C-1 narrows (does not reopen) Phase 8 Entity Reality and supersedes only the prior partial `CF-DISCOVERY-ARCH-002-Q1` exclusion behavior as its stated successor; C-3B restates, without deleting, the existing deterministic-first/AI-budget architecture; C-4 operates within the existing seven-dimension ranking framework without altering it; C-6/C-7 build on, without duplicating, the existing Minimum Useful Lead Result decision.
