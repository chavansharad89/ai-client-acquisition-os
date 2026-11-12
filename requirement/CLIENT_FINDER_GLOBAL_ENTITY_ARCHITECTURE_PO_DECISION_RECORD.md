# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE PRODUCT OWNER DECISION RECORD (D1, D8–D19, D21–D23)

**Decision ID:** CF-GLOBAL-ENTITY-ARCH-PO-DEC-001
**Decision date:** Not stated by the Product Owner in the source instruction. This record was formalized on 2026-10-19 from an already-decided Product Owner instruction; no decision date is invented.
**Authority:** Product Owner
**Scope of this record:** Governance-only. Formalizes D1, D8 through D19, and D21 through D23 as already-decided Product Owner requirements for a Global Entity Architecture. Marks D20 explicitly DEFERRED. Does **not** authorize implementation. Does **not** create or apply any migration, modify any production code or test, or modify the database. Nothing has been committed or pushed as part of this record.

**Naming note (disambiguation):** [CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001](CLIENT_FINDER_PHASE_8_ENTITY_REALITY_ACTIVATION_PO_DECISION.md) uses its own internal, document-local `D1`–`D16` labels for unrelated Phase 8 decisions. Those labels are scoped to that document only and are a different numbering scheme from the `D1`–`D23` decision numbers formalized here. Do not conflate them.

**Related decisions (not modified by this record):**
- [CF-C-SERIES-PO-DEC-001](CLIENT_FINDER_C_SERIES_PRODUCT_OWNER_DECISION_RECORD.md) — C-1 (no-website ≠ exclusion), C-5 (minimum discovery provenance), C-7 ("why found" derived from provenance) — unchanged; D14/D21 extend them without contradiction.
- [CLIENT_FINDER_CROSS_FREELANCER_PUBLIC_EVIDENCE_REUSE_PO_DECISION.md](CLIENT_FINDER_CROSS_FREELANCER_PUBLIC_EVIDENCE_REUSE_PO_DECISION.md) — unchanged; its previously open "exact classification rules" item is closed by D22's four evidence categories, not reopened or reinterpreted.
- [CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) — unchanged.
- [CLIENT_FINDER_EVIDENCE_TRANSPARENCY_CONFLICT_STALENESS_FREELANCER_JUDGMENT_PO_DECISION.md](CLIENT_FINDER_EVIDENCE_TRANSPARENCY_CONFLICT_STALENESS_FREELANCER_JUDGMENT_PO_DECISION.md) — unchanged; reinforced by D11/D18.
- [CLIENT_FINDER_EVIDENCE_DELETION_SUPPRESSION_PO_DECISION.md](CLIENT_FINDER_EVIDENCE_DELETION_SUPPRESSION_PO_DECISION.md) — unchanged; reinforced by D9/D11. Its disclaimer that the Client Intent Discovery append-only trail (OQ-6) is a separate, independent governance track is preserved as-is.
- [CLIENT_FINDER_CACHE_CONFLICT_PO_DECISION.md](CLIENT_FINDER_CACHE_CONFLICT_PO_DECISION.md) — unchanged; its conflict-preservation rule is reused by D11/D18. Its current `(user_id, normalized_domain, signal_kind)` cache key is noted as a present-day implementation limitation lacking an Entity dimension — this record does not instruct a cache-key change and does not treat the existing key as equivalent to global Entity identity.
- [CLIENT_FINDER_SIGNAL_FRESHNESS_PO_DECISION.md](CLIENT_FINDER_SIGNAL_FRESHNESS_PO_DECISION.md) / [CLIENT_FINDER_SIGNAL_SPECIFIC_FRESHNESS_PO_DECISION.md](CLIENT_FINDER_SIGNAL_SPECIFIC_FRESHNESS_PO_DECISION.md) — unchanged; D15 reuses this freshness/conflict governance and does not introduce new TTLs.
- [CLIENT_FINDER_PHASE_8_ENTITY_REALITY_ACTIVATION_PO_DECISION.md](CLIENT_FINDER_PHASE_8_ENTITY_REALITY_ACTIVATION_PO_DECISION.md) — unchanged. Its `GOOGLE_PLACES_STATUS` research-signal kind (migration `0049_research_signal_google_places_status_kind`) is noted as one evidence source that must ultimately be read as a contributor to the D15 Entity Status model, not as a competing status concept. This record does not itself perform that mapping — it records the requirement.
- [CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md](CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md) — unchanged. **Entity Reality** (is this a real, identifiable business) and **Entity Identity** (do two discoveries refer to the same business) are and remain two different questions; this record governs only Entity Identity/Status/Relationships/Provenance, not Entity Reality.
- [CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_Q1_NO_WEBSITE_PO_DECISION.md) — already superseded by C-1 on the record; not resurrected or re-litigated here.
- `CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001` (companion record, below) — narrowly supersedes one scope clause of DEC-005 to permit D1/D8; DEC-005 is otherwise unchanged.
- Explicitly **not** reopened by this record: the 17-family service taxonomy, K1 contact-identifier rules, the universal ranking framework, the core-search state machine, Razorpay/payment/subscription logic, the ₹1,499 commercial model, historical `service_profiles`/`searches` data.

## Context

This record formalizes, as already-decided Product Owner requirements, a Global Entity Architecture spanning universal entity identity (D1), global entity scope (D8), public/private evidence boundaries (D9), entity lifecycle (D10), append-only entity evidence (D11), identity evidence strength (D12), resolution thresholds (D13), unresolved-identity handling (D14), entity status (D15), status-vs-eligibility (D16), entity relationships (D17–D19), discovery provenance (D21), identity evidence categories (D22), and evidence verification (D23). D20 (merge/split) is explicitly deferred and is recorded as a stub only.

---

## D1 — Universal Entity Identity

Every persisted real-world Entity receives an independent, permanent internal Entity ID. The Entity ID is **not** derived from name, geography, domain, phone, provider ID, or any other external attribute. Strong identity evidence (D12/D13) is required to resolve a new discovery to an existing Entity. Name, name+geography, geography, fuzzy similarity, category, textual similarity, reviews, and descriptions may indicate possible duplication or uncertainty but **never** establish identity, trigger automatic merge, or serve as a uniqueness constraint. If strong evidence is insufficient, a new Entity is created rather than forcing a match (see D14). Conflicting strong identity evidence never causes an automatic merge. Exact evidence normalization/matching rules are engineering specification work, not decided here.

## D8 — Global Entity Scope

Entity identity is global across the platform, not user-owned. The same real-world business discovered by different freelancers may resolve to the same global Entity when D12/D13 permit it. Freelancer-specific context remains separate per D9; a freelancer's private information never becomes global merely because it references a global Entity.

## D9 — Public Information Sharing

Only public factual evidence may be reused globally across freelancers: public business identity facts, public website/domain, public provider identifiers, public contact information, public factual research evidence, source/provenance, and observed timestamps. The following remain freelancer-specific and isolated: private notes, search intent, ranking decisions, outreach activity, owner-specific intelligence, private/authorized-source information, and private client information. What qualifies as globally reusable public evidence is not to be silently broadened beyond D22's four categories.

## D10 — Entity Lifecycle

Entity IDs are permanent. Normal discovery never deletes, automatically merges, or automatically splits an Entity. Permanently closed Entities remain historically available. Historical Prospects, ResearchEvidence, DiscoveryEvents, and relationships remain traceable. Merge/split governance is D20 and is explicitly deferred.

## D11 — Entity Evidence

Public factual Entity evidence is append-only. Each observation preserves, where applicable: Entity ID, evidence type/category, observed value, source/provider, observedAt, provenance, confidence/state, and verification state. Conflicting observations coexist; newer evidence does not silently delete older evidence; freshness/reliability may inform downstream interpretation but never rewrites history. Identity resolution is separate from evidence contribution.

## D12 — Identity Evidence Strength

Identity evidence strength is evidence-specific and deterministic, using the four approved categories defined in D22. Categories 1–3 may participate in Entity resolution subject to D13. Category 4 (weak/supporting evidence — name, geography/address, category, textual similarity, reviews/descriptions) never independently resolves or merges Entities. These categories are not to be silently expanded or redefined.

## D13 — Resolution Thresholds

Resolution thresholds are evidence-specific: some exceptionally reliable identifiers may be sufficient alone; some evidence types may require corroboration; multiple independent strong anchors may strengthen confidence; weak evidence never resolves an Entity; conflicting strong evidence never auto-merges Entities. Exact numeric thresholds are explicitly **not** decided by this record and must be specified and tested as a later engineering specification.

## D14 — Unresolved Identity

If a discovery cannot be confidently resolved to an existing Entity, a new global Entity ID is created. Failure to resolve is never treated as proof the business is unreal. The new Entity may carry an uncertain/unresolved identity state and does not automatically become a canonical match for future discoveries — those must still satisfy D12/D13. Temporary provider failures are never interpreted as confirmed absence.

## D15 — Entity Status

Entity status is separate from Entity identity. Approved status values: `ACTIVE`, `CLOSED_TEMPORARILY`, `CLOSED_PERMANENTLY`, `UNKNOWN`. Status observations are append-only; current status may be derived; conflicting observations are preserved; stale observations are not treated as current truth; `UNKNOWN` carries no negative weight; status never deletes or merges an Entity. Existing freshness/conflict governance (`CLIENT_FINDER_SIGNAL_FRESHNESS_PO_DECISION.md`) must be reused as-is — no new freshness windows are introduced by this record. The existing `GOOGLE_PLACES_STATUS` research-signal evidence (migration `0049`) is to be treated as one evidence source feeding this model, not a competing status concept.

## D16 — Status vs. Opportunity Eligibility

Entity status is contextual/ranking/presentation information and is **not** a hard Opportunity eligibility gate. Status does not replace Entity Reality. `CLOSED_TEMPORARILY` does not automatically eliminate an Entity; `CLOSED_PERMANENTLY` does not delete it; `UNKNOWN` carries no negative penalty. Any future hard status-based eligibility rule requires a separate Product Owner decision.

## D17 — Entity Relationships

A basic typed, evidence-backed relationship layer is supported, with example types `BRANCH_OF`, `SUBSIDIARY_OF`, `FRANCHISE_OF`, `PARENT_OF`, `ACQUIRED_BY`, `SUCCESSOR_OF`, `RELATED_TO`. Each Entity keeps its own permanent Entity ID; relationships are separate records with evidence/provenance; uncertain relationships may exist. Relationships never establish Entity identity and never automatically merge Entities. Complex corporate/legal ownership structures are explicitly out of current scope.

## D18 — Relationship Evidence

Relationship observations are append-only, preserving Entity A, relationship type, Entity B, source/provider, observedAt, provenance, and confidence/state. Conflicting relationship observations coexist; current relationship state may be derived; unresolved conflicts may remain `CONFLICTED`/`UNKNOWN` rather than invented away. Relationships never change Entity identity. Private freelancer information does not become global relationship evidence unless it independently qualifies under D9/D22.

## D19 — Relationship Impact (MVP)

For the MVP, relationships are contextual only: no Entity Reality impact, no Opportunity eligibility impact, no automatic Opportunity creation, no ranking impact, no discovery expansion. Relationship information may be displayed as contextual information only. Any future relationship-aware behavior requires a separate Product Owner decision.

## D20 — Merge/Split (STUB — EXPLICITLY DEFERRED)

**Status: DEFERRED TO THE NEXT PHASE.** No merge rule, split rule, canonicalization policy, or implementation of either is decided, implied, or authorized by this record. This stub exists only to record that D20 was considered and intentionally left open — it is not a placeholder for an implicit decision.

## D21 — Discovery Provenance

Discovery provenance uses a dedicated `DiscoveryEvent` concept, preserving at minimum: provider/source, the actual query sent, the discovery timestamp, and the resolved Entity ID. Multiple `DiscoveryEvent`s may refer to the same Entity. `DiscoveryEvent`s are immutable historical records. "Why Found" must be derived from the actual `DiscoveryEvent`, never reconstructed from the current/mutable query-building logic. Any search-specific or private context carried on a `DiscoveryEvent` must respect D9. This extends, and does not contradict, the already-authorized minimum provenance in C-5/C-7.

## D22 — Identity Evidence Categories

The initial identity evidence categories are exactly:
1. Provider-stable identifiers
2. Official digital identity
3. Verified contact identity
4. Weak/supporting evidence

Categories 1–3 may participate in resolution under D12/D13. Category 4 never independently resolves or merges an Entity. These categories are not to be silently expanded.

## D23 — Evidence Verification

Evidence is verified when a reliable source directly associates the evidence value with the Entity; syntax alone is not verification. Verification is separate from freshness. A provider ID, website/domain, business phone, business-email domain, or official profile URL can each be verified when a reliable source directly associates it with the Entity. Two independent sources are **not** universally required. D12/D13 determine whether verified evidence is sufficient for resolution.

---

## Rationale

These decisions resolve how the same real-world business discovered independently by different freelancers is represented once, globally, while keeping each freelancer's private research, ranking, and outreach fully isolated — without ever allowing weak signals (name, geography, similarity) to force an identity match, and without silently merging or deleting historical evidence.

## Explicit non-goals of this record

This record does **not** decide, invent, or authorize:
- Any identity rule based on normalized name, name+geography, geography alone, fuzzy similarity, website presence or absence, provider omission, fetch failure, timeout, rate limit, or temporary provider error.
- Any automatic merge policy, automatic split policy, or any D20 implementation detail.
- Any numeric identity-confidence score or invented resolution threshold (D13).
- Any new freshness window beyond the existing `SIGNAL_FRESHNESS`/`SIGNAL_SPECIFIC_FRESHNESS` records (D15).
- Any new public/private evidence classification beyond D9/D22 as stated. Whether public LinkedIn/company-profile **content** beyond the bare public profile URL is globally reusable is explicitly left open (see Open Items).
- Exact per-provider identity normalization rules (D12) or exact status-derivation precedence detail (D15) — engineering specification work.
- Any code, schema, migration, or test change.

## Dependencies

- D12/D13 require a separate engineering specification (exact thresholds, per-provider normalization) before any resolver can be built.
- D14's practical effect depends on the pre-existing, already-decided-but-unimplemented C-1 fix to `packages/core-discovery/src/normalize.ts` (currently rejects any candidate without a website) — that is tracked implementation work, not a gap in this governance record.
- D15's mapping of the existing `GOOGLE_PLACES_STATUS` signal into the Entity Status model is a future engineering/data-mapping task, not performed by this record.
- The Zero-AI MVP requirement and the `research_signal_cache_index` global-identity cache transition are governed elsewhere / are future engineering work and are not part of D1–D23.

## Open items — intentionally left unresolved

1. Exact per-provider/per-evidence resolution thresholds under D13.
2. Exact provider-specific identity normalization rules under D12.
3. Exact status-derivation precedence implementation detail under D15 (within the existing freshness/conflict framework).
4. Whether public LinkedIn/company-profile content beyond the bare public profile URL is globally reusable evidence under D9/D22.
5. Any provider/API/Terms-of-Service interpretation not already formally authorized elsewhere.

None of these open items alter or qualify D1–D19/D21–D23 as decided above.

## Implementation authorization status

**NOT AUTHORIZED.** No production code, migration, configuration, schema, or test file has been changed as part of this record. No database change occurred. Nothing has been committed or pushed.

## Governance conflict check

**NO UNRESOLVED GOVERNANCE CONFLICT FOUND**, with one narrow exception already resolved by a companion record: the `companies` migration (`0015_discovery/migration.sql`) carries a comment stating company identity is, for MVP, "NOT a global/shared identity" under DEC-005. D1/D8 supersede that specific framing; see `CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001` for the narrow, explicit supersession. DEC-005's substantive decisions (user-owned Company for MVP; `UNIQUE(search_id, company_id)` Prospect dedup; minimal company metadata) are unaffected and remain authoritative. All other cross-referenced records (C-series, cross-freelancer/same-freelancer evidence reuse, evidence transparency/conflict/staleness, evidence deletion/suppression, cache conflict, signal freshness, Phase 8 Entity Reality Activation, Entity Reality Eligibility) were checked and found consistent — each is reinforced or extended, not contradicted, by D1–D19/D21–D23.
