# Phase 8 — Universal Entity-Reality Signal Activation — Product Owner Decision

**Decision ID:** CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001
**Related decisions:** [CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001](CLIENT_FINDER_PHASE_7B_SUBSERVICE_RELEVANCE_AUTHORIZATION_PO_DECISION.md) (closes Phase 7B; explicitly does not authorize Phase 8 work), [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) (17-family catalogue, unchanged), [CF-SIGNAL-FRESHNESS-PO-DEC-001](CLIENT_FINDER_SIGNAL_FRESHNESS_PO_DECISION.md) (freshness mechanism; D12 below adds no value to it yet), [CF-DISCOVERY-QUALITY-LAUNCH-GATE-PO-DEC-001](CLIENT_FINDER_DISCOVERY_QUALITY_LAUNCH_GATE_PO_DECISION.md) (see also [CF-PHASE8-DISCOVERY-QUALITY-LAUNCH-GATE-INTERPRETATION-PO-DEC-001](CLIENT_FINDER_PHASE_8_DISCOVERY_QUALITY_LAUNCH_GATE_INTERPRETATION_PO_DECISION.md)), [CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001](CLIENT_FINDER_NEED_OPPORTUNITY_GAP_SERVICE_INDEPENDENCE_PO_DECISION.md), [CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001](CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md), CF-DISCOVERY-ARCH-002-Item-4 (deterministic-first architecture)
**Date:** 2026-10-17
**Authority:** Product Owner
**Status:** D1–D8, D10, D11, D12, D14, D15, D16 DECIDED. D11 verification CLOSED/SATISFIED; D12 DECIDED (30-day freshness window). No unresolved Product Owner blocker remains within D10–D16 (see §3, §5). **IMPLEMENTATION STILL NOT AUTHORIZED** — this record closes the governance round but does not itself authorize implementation; that remains a separate, explicit go-ahead (see §5).
**Scope of this record:** Governance-only. Authorizes a specific, narrow Phase 8 scope and records the decisions that resolve it, subject to the two explicit blocking conditions in §5. Does not authorize any code, schema, migration, prompt, provider, or data change. Nothing arising from this record has been committed or pushed.

## 1. Context

Phase 7B (relevant-subservice matching) closed under `CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001`, which explicitly states it "does not authorize any Phase 8 (service-family signal expansion) work." A historical planning note (`CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md`) assumed Phase 8 would be "build deterministic signals for the next service family, one at a time." A read-only discovery audit and a read-only implementation-readiness audit (conducted 2026-10-17, not separately filed as governance records) found instead that the entire pipeline — Discovery, deterministic elimination, deterministic ranking, freshness, cache reuse, AI admission/budget, provenance, Need/Opportunity detection, Service Fit, persistence, and UI — is already family-agnostic and fully built, and that the deterministic-elimination stage (`entityRealityElimination.ts`) is a documented no-op today because no signal producer ever emits an `ENTITY_REALITY`-dimension signal. Google Places — already queried by Discovery — carries `businessStatus`, which would supply exactly that evidence for all 17 families at once, with no new provider and no per-family catalogue work. This record authorizes that narrower first increment in place of the historical per-family assumption, and separately resolves implementation-mechanics questions the audits surfaced.

## 2. Decisions (D1–D8) — reused, unchanged

These were decided in the governance exchange preceding this record and are restated here as their first written record. They are not reopened by D10–D16 below.

- **D1 — Phase 8 scope.** Phase 8's first increment is "Universal Entity-Reality Signal Activation." Phase 8 is Entity-Reality-only for this increment; general Current Activity scoring is not included (see D5).
- **D2 — Entity-Reality signal semantics.**
  1. Google Places `CLOSED_PERMANENTLY` → `ENTITY_REALITY` evidence indicating the entity is no longer operating.
  2. Google Places `CLOSED_TEMPORARILY` → `ENTITY_REALITY`-adjacent evidence indicating temporary closure (distinct from permanent closure; see D15 for its representation).
  3. Google Places no usable place / zero-result → **not** proof of fake/non-real; missing/uncertain evidence only; must not automatically eliminate the candidate.
- **D3 — Elimination semantics.**
  - C1: `CLOSED_PERMANENTLY` may trigger deterministic elimination.
  - C2: `CLOSED_TEMPORARILY` does not eliminate; the opportunity remains eligible, shown with clear status evidence.
  - C3: no-result/place-not-found does not eliminate.
  - This preserves the existing rule that missing evidence is not automatically negative.
- **D5 — Current Activity excluded.** Review-recency thresholds, photo-recency thresholds, "no reviews in N months," or any other Current Activity scoring are not implemented as part of Phase 8. This may be considered separately in a future phase, with its own PO-set thresholds.
- **D6 — 17-family service selection.** The freelancer's selected service is constrained to exactly one of the 17 authoritative top-level service families (`CF-SERVICE-CATALOG-PO-DEC-001`); families are not renamed, merged, split, added, or removed. This decision authorizes the *product* constraint only — not UI control, migration, backfill strategy, validation/error handling, or historical-data treatment, which are resolved separately (see D10 below for historical data; remaining implementation mechanics — exact UI control, validation wiring — are engineering-planning detail within this authorized constraint, not additional PO decisions, unless a future audit finds otherwise).
- **D7 — Future service-family signal strategy.** Future true per-family deterministic signal expansion proceeds one service family at a time, selected based on evidence availability. No family is selected by this record; a separate PO decision will select the first family when that phase is ready.
- **D8 — Discovery quality kept separate.** Discovery-pipeline quality work (pagination/candidate-volume expansion, contact capture, entity-resolution redesign, evidence-relevance/source-attribution work, per `DISCOVERY_PROVIDER_SELECTION_AUDIT.md`) is not part of Phase 8 and is not implemented, mixed in, or implicitly authorized by this record. It remains a separate backlog item pending its own authorization.

## 3. New decisions (D10–D16)

- **D10 — Historical service data under F1 (D6): J1, forward-only enforcement.**
  - Existing `service_profiles` and `searches` rows remain unchanged. (Confirmed by direct read-only query of `acos_dev`: 10 rows across both tables, 5 distinct free-text values, none matching a canonical 17-family name — e.g. "Website redesign" ×4, "Website development / redesign" ×2, "Website" ×2, "Website development" ×1, "Custom Website & Mobile App Development" ×1.)
  - New or updated `service_profiles` must use one of the 17 canonical top-level service-family values.
  - `searches.service` remains an immutable search-creation snapshot, consistent with its existing documented design (migration 0014, DEC-007) — this decision does not waive that immutability.
  - No backfill or rewrite of historical rows is authorized.
  - No historical `opportunities.relevant_subservices` population is authorized or implied by this decision (confirmed: 0 of 48 existing Opportunities have any value in that column; this decision does not change that).

- **D11 — Google Places `businessStatus` / provider cost: K1, conditional authorization. VERIFICATION CLOSED/SATISFIED (2026-10-17).**
  - Requesting `businessStatus` in the Google Places field mask (currently `places.displayName,places.websiteUri` only — confirmed in `googlePlacesClient.ts`) was authorized **only after** engineering verified the current Google Places pricing/SKU impact of this field and reported it back to the Product Owner. That verification is now complete and the condition is satisfied:
    - The project's current Google Places integration is **Text Search (New)** (Places API (New)), currently requesting the field mask `places.displayName,places.websiteUri`.
    - Google's own documentation classifies `places.displayName` as a **Text Search Pro** field.
    - Google's own documentation classifies `places.businessStatus` as a **Text Search Pro** field.
    - Google's own documentation classifies `places.websiteUri` as a **Text Search Enterprise** field.
    - Google states that a field mask spanning multiple SKU tiers is billed at the **highest** tier among the requested fields.
    - **Therefore, adding `places.businessStatus` does not increase the existing request's billing tier**, because `places.websiteUri` already places the request at the Enterprise tier today. The request remains Enterprise-tier before and after adding `businessStatus`.
    - No absolute price is recorded or estimated by this decision, and the request is not described as "free" — it remains, and continues to be, billed at the Enterprise tier.
    - Authoritative sources cited for this verification: [Text Search (New) — Places API (New) — Google for Developers](https://developers.google.com/maps/documentation/places/web-service/text-search); [Google Maps Platform API usage details — Pricing and Billing — Google for Developers (SKU details)](https://developers.google.com/maps/billing-and-pricing/sku-details); [Google Maps Platform core services pricing list — Pricing and Billing — Google for Developers](https://developers.google.com/maps/billing-and-pricing/pricing).
  - This closes only the D11/K1 verification condition. It does not by itself authorize implementation — see §5; D12 remains the sole outstanding blocker.

- **D12 — Google Places freshness: DECIDED — 30-day freshness window.**
  - Google Places `businessStatus` evidence (the dedicated source kind created under D16) has a freshness window of **30 days**.
  - Freshness is calculated from the evidence's `observedAt` timestamp, consistent with `CF-SIGNAL-FRESHNESS-PO-DEC-001`. `created_at` must not be used to determine freshness.
  - After 30 days, the Google Places evidence is stale and may be rechecked/re-researched according to the existing freshness and cache rules (`signalCache.ts`'s existing `evaluateSignalFreshness()` mechanism, extended with this window — no new freshness mechanism is introduced).
  - This decision does not alter the existing freshness window for any other `ResearchSourceKind` (WEBSITE 30d, JOB_POST/LINKEDIN 14d, NEWS 7d, FUNDING 90d, TECH_STACK 30d, REVIEW 90d remain unchanged).
  - No additional TTL or freshness behavior beyond this single 30-day window is introduced by this decision.

- **D14 — No-result semantics vs. current Discovery behavior: N1, no change to current Discovery behavior.**
  - `normalizeCandidate()` is not modified to retain website-less candidates.
  - No pagination, contact-capture, entity-resolution, or other broader Discovery redesign is authorized by this record (consistent with D8).
  - Under Phase 8, "no-result" means a website-bearing candidate whose Google Places lookup returns no usable match. It is missing/uncertain evidence and is never treated as proof of non-reality (per D2.3/D3-C3). A candidate with no website at all remains outside the persisted Opportunity pipeline, as today.

- **D15 — `CLOSED_TEMPORARILY` representation: O1.**
  - `CLOSED_TEMPORARILY` is persisted and displayed as informational evidence.
  - Its representation and the elimination predicate must be structured so that `CLOSED_TEMPORARILY` can never satisfy the non-reality elimination condition.
  - `CLOSED_TEMPORARILY` must never eliminate an Opportunity.
  - Evidence transparency is preserved — this status is shown to the freelancer, not hidden.

- **D16 — New source kind: P1, dedicated Google Places source kind.**
  - A dedicated `ResearchSourceKind` is created for Google Places operational-status evidence, rather than reusing `WEBSITE` or `REVIEW`.
  - The corresponding database `CHECK`-constraint migration and the signal-cache freshness-window entry are added **only after D12 is resolved** — not before.

## 4. Non-scope / explicit non-decisions

This record does not decide or authorize:

- Any implementation code, schema, migration, prompt, provider integration, or test.
- Any change to K1 (personal-identifier detection), or to the ₹1,499/₹99/₹499 commercial/payment flows — untouched.
- Any reopening of Phase 7B's matching mechanism, vocabulary, or scope.
- Any Current Activity signal, threshold, or scoring (D5).
- Any Discovery-quality work beyond what D14 specifically describes (D8).
- Selection of the first per-family signal catalogue under D7.
- The exact UI control, migration mechanics, or validation wiring for D6/D10 beyond what is stated above — these remain engineering-planning detail within the authorized constraint, to be worked out at implementation time, not additional open PO decisions unless a future audit finds otherwise.
- The interpretation of the Discovery-Quality Launch Gate for this increment — resolved in a separate, focused record, [CF-PHASE8-DISCOVERY-QUALITY-LAUNCH-GATE-INTERPRETATION-PO-DEC-001](CLIENT_FINDER_PHASE_8_DISCOVERY_QUALITY_LAUNCH_GATE_INTERPRETATION_PO_DECISION.md), per the Product Owner's M3 selection.

## 5. Implementation authorization status

**NOT AUTHORIZED.** Recording this decision — including this update — does not authorize implementation of any kind. Implementation authorization is a separate, explicit step this record does not itself take.

- **Blocker A (D11) — CLOSED/SATISFIED (2026-10-17).** Engineering verified and reported the Google Places pricing/SKU impact of requesting `businessStatus` (see §3, D11). Finding: no billing-tier change results, since the existing field mask's `websiteUri` already places the request at the Enterprise tier.
- **Blocker B (D12) — DECIDED (2026-10-17).** The Product Owner has set the freshness window for the new Google Places-derived source kind at 30 days, calculated from `observedAt` (see §3, D12).
- **No unresolved Product Owner decision remains within D10–D16.** All of D10–D16 are now DECIDED. This closes the governance round for the Phase 8 Entity-Reality increment. A separate, explicit authorization to begin implementation is still required and has not been given by this record.

No application code, schema, prompt, test, configuration, provider, or runtime behavior has been changed as part of this decision or any of its updates. No database data has been modified. Nothing has been committed or pushed.
