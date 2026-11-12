# Evidence Transparency, Conflicting Evidence, Staleness & Freelancer Judgment — Product Owner Decision

**Decision ID:** CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001
**Related decisions:** [CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001](CLIENT_FINDER_NEED_OPPORTUNITY_GAP_SERVICE_INDEPENDENCE_PO_DECISION.md) (originates the "find evidence → show it → let the freelancer decide" philosophy this record extends), [CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md) (uncertain/weak entities preserved for review, not auto-discarded — same posture applied here to evidence), [CF-CURRENT-ACTIVITY-CONTEXTUAL-EVIDENCE-PO-DEC-001](CLIENT_FINDER_CURRENT_ACTIVITY_CONTEXTUAL_EVIDENCE_PO_DECISION.md) (absence of a signal is not a mandatory gate — same posture applied here to staleness), [CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_COMMERCIAL_CONTACT_READINESS_RANKING_NOT_ELIGIBILITY_PO_DECISION.md) (missing data affects ranking, not eligibility — same posture applied here), [CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001](CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md) (item 9's source/date/provenance requirement, which this record elaborates with a concrete field list and does not redefine), [CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001](CLIENT_FINDER_SIGNAL_SPECIFIC_FRESHNESS_PO_DECISION.md) (governs cache-trustworthiness mechanics for staleness; this record governs the separate question of eligibility consequence and does not reopen the mechanics), [CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md) (already states the consolidated "discover → gather and show evidence → explain → let the freelancer decide" philosophy that Decision 6 below extends rather than replaces), [CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001](CLIENT_FINDER_SERVICE_FIT_CAPABILITY_FIT_PO_DECISION.md), [CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001](CLIENT_FINDER_TOP_LEVEL_SERVICE_ONLY_SUBSERVICES_INTERNAL_PO_DECISION.md), [CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001](CLIENT_FINDER_SINGLE_SERVICE_PER_SEARCH_PO_DECISION.md), [CF-CROSS-SERVICE-EVIDENCE-APPLICABILITY-PO-DEC-001](CLIENT_FINDER_CROSS_SERVICE_EVIDENCE_APPLICABILITY_PO_DECISION.md) (preserved, unaffected distinctions — see "Relationship to existing decisions")
**Decision title:** Conflicting and stale evidence are preserved and contextualized rather than auto-eliminated; evidence shown to the freelancer must carry enough provenance to separate observed fact from inference; the freelancer holds final judgment over weak, stale, conflicting, unverified, or inferred opportunities
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle level. Does **not** define a conflict score, confidence formula, numeric freshness threshold, TTL, evidence-ranking weight, UI layout, API shape, or database schema.

## Governance audit performed before recording — conflicts found

A targeted audit of existing `CLIENT_FINDER_*_PO_DECISION.md` records, the PRD (V2.1/V2.2), and related engineering records was performed before recording. Findings:

1. **No conflict, but close overlap — item 9 of `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`.** That record already requires presented leads to expose "source/date/provenance context sufficient for the freelancer to judge the evidence" and states the product "should not require the freelancer to trust an opaque AI score." Decision 3 below (Evidence Provenance and Transparency) does not restate or redefine that requirement; it elaborates it with a concrete field list (what was observed; source/location; publication/observation date; fact-vs-inference; conflicting evidence). This record treats `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001` item 9 as the governing requirement and this record's Decision 3 as its detail-level elaboration — not a second, competing source of authority.
2. **No conflict, but close overlap — overarching philosophy.** The "find evidence → show it → let the freelancer decide" philosophy already originates in `CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001` and is already consolidated as "discover → gather and show the evidence → explain the potential opportunity and service fit → let the freelancer decide" in `CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001`. Decisions 5 and 6 below do not establish a new or competing product philosophy; they name the judgment-authority posture already distributed across `CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001`, `CF-CURRENT-ACTIVITY-CONTEXTUAL-EVIDENCE-PO-DEC-001`, `CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`, and `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`, and extend the existing phrasing with two evidence-handling steps ("preserve," "contextualize") that are specific to this record's Decisions 1–4. This record does not rewrite, reinterpret, or supersede the existing phrasing in either predecessor record.
3. **No conflict — staleness is governed at a different level by `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`.** That record decides cache-freshness *mechanics* (that freshness is signal-/service-specific rather than one universal TTL) and explicitly leaves all exact TTL values, invalidation rules, and refresh strategy OPEN. It does not address whether stale evidence makes a lead ineligible. Decision 2 below answers that separate eligibility question and does not reopen, redefine, or choose any TTL, invalidation rule, or refresh strategy — those remain exclusively governed by `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`.
4. **No conflict — "conflicting evidence" vs. `R-70`'s "conflicting source."** The codebase's `hasConflictingSource()` / `R-70` mechanism (see `CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md`) uses "conflicting" to mean a source that self-identifies as a *different business* than the one under evaluation (cross-business attribution contamination) — a narrower, different concept from Decision 1 below, which concerns two evidence items that agree the entity is the same but disagree about whether an opportunity exists or remains valid. This is a terminology proximity, not a substantive conflict, noted here so the two uses of "conflicting" are not mistaken for each other. This record does not rewrite, reinterpret, or extend `R-70`.
5. **No conflict — Entity Reality's "uncertain, preserve for review" posture.** `CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001` already applies a "do not auto-discard; preserve for review" posture to *entity* identification uncertainty specifically. Decision 1 (conflicting evidence) and Decision 2 (stale evidence) below apply the analogous posture to *evidence about an opportunity*, a distinct question that presupposes Entity Reality has already been satisfied. This record does not reopen `CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001`.
6. **No conflict — the OBSERVED/INFERRED/UNKNOWN classification vocabulary already exists.** The PRD (V2.1 §/V2.2 §, classification vocabulary table; `AC-12`; `PFR-03`) already defines an `OBSERVED` / `INFERRED` / `UNKNOWN` evidence classification that must survive persistence. Decision 4 below (Observed Facts vs. Inference) draws on and reinforces that existing vocabulary as a product principle — that an inference must never be *presented* as an established fact — and does not redefine the classification values or any persistence/schema concern (`PFR-03` is a known, separately tracked implementation gap, unaffected by this record).
7. **No conflicting record found for "do not auto-eliminate on conflicting or weak/unverified evidence."** No existing decision record states a conflict-score, conflict-threshold, or automatic-elimination-on-weak-evidence rule for this record to collide with. Decision 1 and Decision 5 fill that previously open area without rewriting any existing record.

No existing decision record is rewritten, reinterpreted, or superseded by this record. Where this record's subject matter overlaps an existing record, that existing record is treated as controlling and this record's corresponding decision is scoped as an elaboration, not a replacement.

## Decisions

### 1. Conflicting Evidence

Conflicting or contradictory evidence must be preserved and shown to the freelancer, with available source/date context, rather than automatically causing elimination — unless the evidence establishes that the opportunity is clearly no longer valid.

Example: supporting evidence that a company publicly requested a given kind of service, alongside later conflicting evidence suggesting the company may already have hired a provider — both must be shown; the freelancer reviews and decides.

No conflict score or automatic conflict threshold is introduced by this decision.

### 2. Stale Evidence

Stale evidence does not automatically make a lead ineligible. Evidence must remain available with source/date context so the freelancer can judge whether it remains actionable.

No universal TTL, freshness threshold, or numeric freshness score is established by this decision. Different evidence types may naturally become stale at different rates; that remains open for later decisions/engineering, and remains exclusively governed by `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001` where it concerns cache-trustworthiness mechanics.

### 3. Evidence Provenance and Transparency

Evidence shown to the freelancer must provide enough provenance/context for independent judgment. Where available, expose:

- what was observed;
- source/location of the evidence;
- publication/observation date;
- whether it is an observed fact or an inference;
- conflicting evidence, where present.

An opaque AI score must not be required for the freelancer to understand why a lead was surfaced. This elaborates, and does not redefine, `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001` item 9.

### 4. Observed Facts vs. Inference

An inference must never be presented as an established fact. The system may surface useful inferences, including inferences formed from multiple evidence items, but must clearly distinguish: observed fact; source/date; inferred opportunity, where applicable.

Weak, third-party, or otherwise unverified evidence may still be shown. An opportunity must not be automatically eliminated merely because evidence is weak or unverified.

This draws on, and does not redefine, the PRD's existing `OBSERVED` / `INFERRED` / `UNKNOWN` classification vocabulary.

### 5. Freelancer Has Final Judgment

The freelancer decides whether a weak, stale, conflicting, unverified, or inferred opportunity is worth pursuing. The Client Finder is an evidence-discovery and opportunity-surfacing system, not an authority that decides which businesses are genuine clients.

The system should: find evidence; preserve useful evidence; contextualize it; distinguish facts from inference; expose conflicts and missing information; show the potential opportunity; allow the freelancer to make the final judgment.

No complex minimum-evidence framework is introduced solely to eliminate weak, stale, conflicting, unverified, or inferred opportunities.

This names, as an explicit principle, the judgment-authority posture already distributed across `CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001`, `CF-CURRENT-ACTIVITY-CONTEXTUAL-EVIDENCE-PO-DEC-001`, `CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`, and `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`.

### 6. Product Philosophy

**Find → preserve → contextualize → show → let the freelancer decide.**

The system does not pretend to know with certainty which entity will buy. This principle applies across discovery, Need/Opportunity Gap, Service Fit, evidence handling, ranking/prioritization, and lead presentation, while not overriding separately governed hard safety/data-quality rules.

This extends, and does not replace, the "find evidence → show it → let the freelancer decide" phrasing already established by `CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001` and consolidated as "discover → gather and show the evidence → explain the potential opportunity and service fit → let the freelancer decide" by `CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001`. The two added steps ("preserve," "contextualize") name, at the top level, the evidence-handling behavior this record's Decisions 1–4 require; they do not add a new elimination criterion, scoring mechanism, or sixth framework dimension.

## Relationship to existing decisions

This record preserves, and does not rewrite, reinterpret, or supersede, the distinction between:

- Need/Opportunity Gap (`CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001`) — whether a credible problem/opportunity exists, independent of service;
- Service Fit / Capability Fit (`CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001`, `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`) — whether the selected service can address that need;
- Commercial/Contact Readiness (`CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`) — contactability as ranking, not eligibility;
- evidence freshness/provenance mechanics (`CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`, `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`) — cache trustworthiness and minimum presentation content, respectively;
- freelancer judgment (this record, Decisions 5–6) — the overarching authority principle those other records already assume.

Single-service-per-search (`CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`) and cross-service evidence applicability (`CF-CROSS-SERVICE-EVIDENCE-APPLICABILITY-PO-DEC-001`) are unaffected: evidence conflict, staleness, provenance, and judgment are evaluated within the authoritative service context those records already establish.

## Non-scope / explicit non-decisions

This record does **not** decide or authorize:

- A conflict score, conflict threshold, or automatic-elimination rule based on conflicting evidence.
- Any universal TTL, freshness threshold, or numeric freshness score — exclusively governed by `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`, unaffected by this record.
- A minimum-evidence framework whose purpose is to eliminate weak, stale, conflicting, unverified, or inferred opportunities.
- Any UI layout, component design, API response shape, or database schema change.
- Any redefinition of the existing `OBSERVED` / `INFERRED` / `UNKNOWN` classification vocabulary, or of `PFR-03`'s known persistence gap.
- Any change to `R-70` / `hasConflictingSource()`, the seven-factor scoring model, ranking formulas, or any other existing elimination/ranking mechanism.
- Any code, configuration, schema, prompt, test, or data change.

## Cross-reference / reconciliation notice (added 2026-10-12)

[CF-EVIDENCE-DELETION-SUPPRESSION-PO-DEC-001](CLIENT_FINDER_EVIDENCE_DELETION_SUPPRESSION_PO_DECISION.md) extends this record's "freelancer holds final judgment" posture (Decisions 5–6 above) to a concrete action: a freelancer may request that an opportunity/evidence be removed from their own view. That later record clarifies this is per-owner view suppression, not global deletion of reusable public factual evidence. Decisions 1–6 above are preserved unchanged; they are not reopened, reinterpreted, or modified by that later record.

## Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation of any kind. No code, configuration, schema, prompt, test, or data has been changed. Nothing has been committed or pushed.
