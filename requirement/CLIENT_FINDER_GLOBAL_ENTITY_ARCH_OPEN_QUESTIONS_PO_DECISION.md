# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: §19 OPEN QUESTIONS PRODUCT OWNER DECISION RECORD (OQ-1 THROUGH OQ-9)

**Decision ID:** CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001
**Decision date:** 2026-10-19
**Authority:** Product Owner
**Scope of this record:** Governance-only, narrow companion decision. Resolves **only** the nine open questions (OQ-1 through OQ-9) enumerated in [`CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_ENGINEERING_SPECIFICATION.md` §19](CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_ENGINEERING_SPECIFICATION.md), as prepared by the companion PO Decision Preparation Audit. Does **not** reopen, modify, or silently reinterpret any part of D1–D23 except to supply the previously-missing implementation detail each OQ was explicitly reserved for. Does **not** authorize implementation. Does **not** create or apply any migration, modify any production code or test, or modify the database. Nothing has been committed or pushed as part of this record.

**Related decisions (not modified by this record):**
- [CF-GLOBAL-ENTITY-ARCH-PO-DEC-001](CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_PO_DECISION_RECORD.md) — D1, D8–D19, D21–D23 (D20 deferred). This record narrowly closes five of that record's own "Open items" (items 1, 3) and the engineering specification's further-derived open questions (§19 OQ-1 through OQ-9). All D1–D23 decisions not named below remain exactly as formalized there.
- [CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001](CLIENT_FINDER_DEC005_GLOBAL_IDENTITY_SCOPE_SUPERSESSION_PO_DECISION.md) — unchanged, not broadened. This record does not touch DEC-005 or any clause of it.
- [CF-C-SERIES-PO-DEC-001](CLIENT_FINDER_C_SERIES_PRODUCT_OWNER_DECISION_RECORD.md) — C-1, C-5, C-7 unchanged; OQ-8 extends C-5's minimum provenance without contradicting it.
- `CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_ENGINEERING_SPECIFICATION.md` — the read-only specification whose §19 this record resolves. The specification's [FACT]/[SPEC]/[REC] tags are unchanged by this record; only its [OPEN] tags for OQ-1–OQ-9 are closed.
- Explicitly **not** reopened by this record: the 17-family service taxonomy, K1 contact-identifier semantics, the universal ranking framework, the core-search state machine, Service+Geography-only input, the ₹1,499 commercial model, Razorpay/webhook logic, D20 merge/split, Phase 7B, Phase 8 Entity Reality Activation/Eligibility.

## Context

The engineering specification package closed as much of D1–D23's implementation detail as existing governance permitted, and isolated exactly nine items it could not close without further Product Owner input (§19). This record supplies those nine decisions. Analyst recommendations from the companion audit are recorded for traceability only and are explicitly **not** the decision in any case where the Product Owner selected a different option.

---

## OQ-1 — Single Category 1–3 identity evidence resolution

**Question closed:** Does any single Category 1–3 identity evidence type resolve an Entity match alone, or does every category require corroboration?

**Selected: Option B.**

Place ID **alone** may resolve an Entity match. Domain, official profile URL, phone, and business-email **do not** resolve an Entity match alone and require corroboration per OQ-2. No additional identity evidence type or threshold beyond D22's four categories is introduced.

**Supplies the missing detail for:** D13 (resolution thresholds), specifically Open Item 1 of `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001`. Does not alter D12's category definitions or D22's four-category list.

**Analyst recommendation on record (not the decision; matches the decision here):** Option B.

---

## OQ-2 — Corroboration rule

**Question closed:** If corroboration is required, what is the corroboration rule?

**Selected: Option B.**

Where corroboration is required (i.e., for every evidence type other than Place ID per OQ-1), Entity resolution requires **two independent identity anchors from different identity-evidence categories**. Two observations of the same category do not satisfy corroboration merely by being separate observations. No numeric confidence scoring is introduced.

**Supplies the missing detail for:** D13, continuing Open Item 1. Does not introduce any scoring mechanism D13 did not already contemplate.

**Analyst recommendation on record (not the decision; matches the decision here):** Option B.

---

## OQ-3 — Disposition of the new discovery on Entity-vs-Entity conflict

**Question closed:** When strong identity evidence on a new discovery points to two different existing Entities, what happens to the triggering discovery itself?

**Selected: Option A.**

The triggering discovery becomes a **third, independent new Entity**. It is never provisionally attached to either existing Entity. No manual-review queue is created by this decision. A `NULL` `entity_id` is never used as the normal resolution outcome. The two existing, conflicting Entities remain marked under the already-decided D13/D18 conflict model (never auto-merged).

**Supplies the missing detail for:** D13 (conflict disposition), consistent with D1/D14's existing "unresolved → new Entity" default. Does not alter D18's append-only conflict-marking mechanism.

**Analyst recommendation on record (not the decision; matches the decision here):** Option A.

---

## OQ-4 — `websiteUri` and D23 verification sufficiency

**Question closed:** Does a reliable-but-not-owner-verified field such as Google Places' `websiteUri` satisfy D23 verification?

**Selected: Option A.**

Google Places `websiteUri`, when returned for a specific, matched Google Place, **satisfies D23 verification** for the associated website/domain evidence. DNS-based domain-ownership proof or direct owner confirmation is **not** required solely to satisfy D23 for this evidence.

This decision governs **verification status only**. It does **not** authorize domain/website evidence to resolve an Entity alone — that question is governed exclusively by OQ-1, which assigns alone-resolution only to Place ID. Accordingly, as of this record:
- Place ID may resolve alone (OQ-1).
- Website/domain evidence is D23-verified (this decision).
- Website/domain still requires the OQ-2 corroboration rule (two independent anchors from different categories) before it may resolve an Entity.

**Supplies the missing detail for:** D23 (verification sufficiency), as applied specifically to the `websiteUri` field. Does not alter D23's general verification test ("a reliable source directly associates the value with the Entity") and does not alter D12/D13's separate resolve-alone question.

**Analyst recommendation on record (not the decision; matches the decision here):** Option A (fallback offered was Option C — not selected).

---

## OQ-5 — Public LinkedIn/company-profile content beyond the bare URL

**Question closed:** Is public LinkedIn/company-profile content beyond the bare profile URL globally reusable evidence under D9/D22?

**Selected: Option C.**

This classification is **deferred** until a LinkedIn/company-profile producer actually exists in the codebase. No speculative field-level public/private classification is created for a producer that does not yet exist. This decision does not prevent a future PO/engineering review once such a producer is introduced.

**Relationship to existing governance:** This re-confirms, rather than closes, Open Item 4 of `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` ("Whether public LinkedIn/company-profile content beyond the bare public profile URL is globally reusable evidence under D9/D22"). That item remains open on the record, by explicit PO choice, not by oversight.

**Analyst recommendation on record (not the decision; matches the decision here):** Option C.

---

## OQ-6 — Public/private classification of WEBSITE/NEWS/TECH_STACK sub-fields

**Question closed:** Are the WEBSITE/NEWS/TECH_STACK `research_signals` sub-fields public factual evidence, freelancer-private interpretation, or a mix requiring field-level reclassification?

**Selected: Option B.**

**Field-level classification** applies. Factual-sounding fields that can be treated as neutral public factual observations **may be classified as public-eligible**; interpretive, sales-angle, recommendation, opportunity, or freelancer-specific research framing **remains private**. At minimum, the following split identified by the companion audit is preserved:
- Public-eligible candidates: `companySummary`, `businessModel`.
- Remains private: `websiteIssues`, `contentOpportunities`, `aiOpportunities`, `growthOpportunities`.

This decision does **not** implement any schema or code change. Selecting Option B does **not**, by itself, authorize immediate cross-freelancer sharing of any field — the exact implementation-level field mapping, write path, and any migration are reserved for a future engineering specification pass before implementation.

**Supplies the missing detail for:** D9 (public information sharing) and D22 (evidence categories), as applied specifically to the WEBSITE/NEWS/TECH_STACK `research_signals` kinds. Does not broaden D9/D22's four-category framework and does not reclassify `GOOGLE_PLACES_STATUS` or `PUBLIC_INTENT`, which were already separately classified public.

**Analyst recommendation on record (not the decision; matches the decision here):** Option B.

---

## OQ-7 — `lead_unlock_contacts` promotion to global identity evidence

**Question closed:** May `lead_unlock_contacts` data ever be promoted into global Category-3 identity evidence?

**Selected: Option A.**

`lead_unlock_contacts` is **never** promoted into global identity evidence. It remains freelancer-scoped, private, post-purchase contact data and is **not** used as global Category-3 identity evidence under any circumstance covered by this record. K1 contact-identifier semantics are unchanged and not reopened by this decision.

This decision does not prohibit a future, independent, non-purchase-gated producer of verified phone/business-email evidence from being considered separately; any such producer would require its own, separate Product Owner decision and does not inherit any authorization from this record.

**Supplies the missing detail for:** D22 Category 3 (verified contact identity), specifically closing the question of whether the one existing phone/email data source in the product may feed it. Confirms, rather than alters, the standing negative default already identified in the engineering specification §11.

**Analyst recommendation on record (not the decision; matches the decision here):** Option A.

---

## OQ-8 — Failed-normalization discoveries in `DiscoveryEvent`

**Question closed:** Does a `DiscoveryEvent` requiring a failed-normalization result (no resolvable Entity) belong in the same table as a normal event, or in a separate pre-Entity log?

**Selected: Option B.**

A **separate pre-Entity discovery/attempt log** is used for provider results that fail normalization and therefore cannot produce an Entity. `DiscoveryEvent` itself remains strictly associated with a resolved Entity, retaining D21's minimum-field semantics (`entity_id` stays non-nullable on `DiscoveryEvent`) exactly as stated. The existing D21/D14 Entity-resolution model is **not** weakened to accommodate failed normalization, and failed-normalization provider attempts are not to be silently discarded if the future discovery architecture is intended to preserve provenance.

This decision does **not** implement the separate log table. Its name, schema, and write path are reserved for a future engineering specification pass.

**Supplies the missing detail for:** D21 (discovery provenance), closing the failed-normalization edge case the engineering specification §12 identified as unresolved. Does not alter D21's stated minimum fields or D14's "unresolved → new Entity, never null" rule, which governs failed *resolution* (post-normalization), a distinct and already-settled case.

**Analyst recommendation on record (not the decision; matches the decision here):** Option B.

---

## OQ-9 — Entity Status conflict-resolution precedence

**Question closed:** What is the exact status-derivation precedence when conflicting Entity Status observations exist?

**Selected: Option C.**

Entity Status derivation follows this precedence:
1. Consider only observations within the applicable freshness window.
2. Among fresh observations, the most recent `observedAt` observation determines current status.
3. If no fresh status observation exists, current Entity Status is `UNKNOWN`.
4. `ACTIVE` is never inferred merely from the absence of a negative status observation.
5. Stale observations never determine current status.

**Existing D15/D16/Phase 8 semantics are unchanged and not reopened:**
- Entity Status remains separate from Entity Reality.
- `CLOSED_TEMPORARILY` remains informational/contextual.
- `CLOSED_PERMANENTLY` remains informational/contextual for Entity Status and does not create any new Opportunity-eligibility rule.
- Entity Status remains, per D16, not a hard Opportunity eligibility gate.
- No new freshness window is introduced; the existing `SIGNAL_FRESHNESS`/`SIGNAL_SPECIFIC_FRESHNESS` governance is reused exactly as-is.

**Supplies the missing detail for:** D15 (entity status), closing Open Item 3 of `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` ("exact status-derivation precedence implementation detail under D15"). Does not alter D15's approved status values (`ACTIVE`, `CLOSED_TEMPORARILY`, `CLOSED_PERMANENTLY`, `UNKNOWN`) or D16's status-vs-eligibility separation.

**Analyst recommendation on record (not the decision; matches the decision here):** Option C.

---

## Relationship to D1–D23 (explicit)

This record supersedes **only** the following, previously unresolved implementation details, each now closed by the OQ decision named:

| D-number | What was open | Closed by |
|---|---|---|
| D13 | Resolve-alone threshold per evidence type | OQ-1 |
| D13 | Corroboration rule | OQ-2 |
| D13 | Disposition of new discovery on Entity-vs-Entity conflict | OQ-3 |
| D23 | Verification sufficiency of `websiteUri` specifically | OQ-4 |
| D9 / D22 | Public/private classification of WEBSITE/NEWS/TECH_STACK sub-fields | OQ-6 |
| D22 (Category 3) | Whether `lead_unlock_contacts` may feed global identity evidence | OQ-7 |
| D21 | Failed-normalization representation in `DiscoveryEvent` | OQ-8 |
| D15 | Status-derivation conflict precedence | OQ-9 |

**Explicitly left open, not closed, by this record:**
- D9/D22's "public LinkedIn/company-profile content beyond the bare URL" question (OQ-5 — deferred by PO choice, not decided).
- D12's full `normalizeDomain()` behavior read-through (not a §19 item; still an engineering-review item per the specification §18).
- `DiscoveryEvent`'s exact transaction-boundary design (not a §19 item; still an engineering-review item per the specification §12).

**D1, D8, D10, D11, D12 (category definitions), D14, D16, D17, D18, D19, D20 (deferred), D22 (category list):** untouched. None of these is reopened, reinterpreted, or implicitly altered by any OQ decision above.

## Explicit non-goals of this record

This record does **not** decide, invent, or authorize:
- Any identity-confidence numeric score.
- Any schema, migration, code, or test change (OQ-6 and OQ-8 explicitly reserve their implementation-level detail for a future engineering specification pass).
- Any broadening of the DEC-005 supersession already recorded in `CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001`.
- Any change to K1 contact-identifier semantics, Phase 7B, Phase 8 Entity Reality behavior, Service+Geography-only search input, AI architecture, the ₹1,499 commercial model, or historical search/service-profile data.
- Any implementation plan or implementation authorization.

## Dependencies

- OQ-1/OQ-2/OQ-3 together specify D13's resolver behavior at the decision level; a resolver still requires its own engineering specification (data model, exact matching code) before implementation, per the base record's existing D12/D13 dependency note.
- OQ-6 requires a field-level classification mechanism (not a kind-level flag) to be designed before implementation; this is future engineering work, not authorized here.
- OQ-8 requires the separate pre-Entity log table to be designed (name, schema, retention) before implementation; this is future engineering work, not authorized here.
- OQ-9's precedence rule requires an Entity Status read-path that does not yet exist (no Entity layer exists today); implementing it is still gated on the same D1/D8 Entity-table prerequisite noted elsewhere in governance.

## Implementation authorization status

**NOT AUTHORIZED.** No production code, migration, configuration, schema, or test file has been changed as part of this record. No database change occurred. Nothing has been committed or pushed.

---

# Read-Only Consistency Audit

Performed after recording the above nine decisions. No code, schema, migration, or database was inspected beyond what the companion engineering specification and existing governance records already establish; no new file beyond this record was created or modified.

## A. Are all 9 open questions now decisively closed?

Yes, all nine (OQ-1 through OQ-9) now have an authoritative PO decision on record above. OQ-5 is decisively closed **as a deferral** (the decision is "defer until a producer exists," not "left undecided by omission") — this is a closed decision with a stated condition, not an open item in the same sense as the original §19 entry.

## B. Any contradiction between these nine decisions and D1–D23?

None found. Each OQ decision supplies detail D13/D23/D9/D22/D21/D15 explicitly reserved for later PO input (see table above); none contradicts the categorical rules those D-numbers already fixed:
- OQ-1/OQ-2/OQ-3 stay inside D13's own framing ("some may be sufficient alone; some may require corroboration; conflicting strong evidence never auto-merges") — they pick a specific point within that already-authorized range, not outside it.
- OQ-4 stays inside D23's test ("a reliable source directly associates the value with the Entity") and does not import a stronger test D23 never required (e.g., it does not require two independent sources, which D23 explicitly says is not universal).
- OQ-6 stays inside D9/D22's four-category framework; it does not create a fifth category or a new evidence type.
- OQ-7 does not touch D22's four-category definition; it only answers whether one specific existing data source may feed Category 3, and answers in the negative, consistent with the specification's own finding that no authorization for this ever existed.
- OQ-8 does not alter D21's stated minimum fields or D14's unresolved-identity rule; it adds a boundary (pre-normalization vs. post-normalization) D21/D14 did not individually have to address because no DiscoveryEvent implementation exists yet.
- OQ-9 does not alter D15's approved status values or D16's eligibility separation; it only fixes the derivation algorithm D15 explicitly left as an engineering/implementation detail.

## C. Any contradiction with C-1 through C-7?

None found.
- C-1 (no-website ≠ exclusion) is unaffected — none of OQ-1–OQ-9 reintroduces a website-presence requirement for Entity creation or Prospect inclusion.
- C-5 (minimum discovery provenance: provider, query, timestamp) is extended, not contradicted, by OQ-8's decision that `DiscoveryEvent` remains Entity-resolved and a separate log handles the failed-normalization case — C-5's stated minimum fields are unaffected.
- C-7 ("why found" derived from provenance, not stored as free text) is unaffected by any OQ decision.
- C-3B (zero-AI capable core) is unaffected; none of the nine decisions touches AI dependency.
- C-2, C-3A, C-4, C-6 are not referenced by, and have no interaction with, any of the nine decisions.

## D. Any contradiction with Phase 7B or Phase 8?

None found. No OQ decision touches category-plausibility logic (Phase 7B) or Entity Reality elimination (`detectPlacesEntityReality`, `businessStatus`-driven, Phase 8). OQ-9 explicitly restates, rather than alters, the existing separation between Entity Status (D15) and Entity Reality (Phase 8) — this was a condition the PO decision text itself stated explicitly, and it matches the already-decided boundary in `CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001` and `CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md`.

## E. Remaining PO questions before implementation

1. OQ-5's underlying question (LinkedIn/profile content beyond the bare URL) remains genuinely open — deferred by PO choice, to be revisited once a producer exists.
2. Exact per-provider identity normalization rules under D12 (full `normalizeDomain()` read-through) — flagged as an engineering-review item, not a PO item, by the specification itself; worth re-confirming it stays an engineering question once reviewed.
3. `DiscoveryEvent`'s transaction-boundary design (atomic Entity + DiscoveryEvent + Prospect write) — flagged by the specification as requiring engineering design, not PO input, but no PO item blocks starting that design work.
4. The field-level mapping required to implement OQ-6 (which exact `research_signals` columns/sub-keys are public-eligible beyond the two named examples) is reserved for engineering specification, not decided here — this is implementation detail flowing from an already-made PO decision, not a new open PO question.
5. The pre-Entity log table's schema required to implement OQ-8 is likewise engineering detail flowing from an already-made PO decision, not a new open PO question.

No new PO-level open question was introduced by this record beyond the pre-existing OQ-5 deferral.

## F. Classification of all tracked items

**PO-decided and engineering-ready (no further PO or engineering-design step needed before implementation could start):**
- OQ-1 (Place ID alone resolves; others require corroboration)
- OQ-2 (two-anchors-from-different-categories corroboration rule)
- OQ-3 (spawn third Entity on conflict)
- OQ-4 (`websiteUri` satisfies D23 verification)
- OQ-7 (`lead_unlock_contacts` never promoted)
- OQ-9 (freshness-gated, most-recent-wins status precedence)
- Previously-closed "READY FOR IMPLEMENTATION" items from the specification §20 (Place ID field-mask capture, query persistence into a future DiscoveryEvent, zero-AI boot-path fix, `GOOGLE_PLACES_STATUS` cache-index CHECK widening, historical-safety policy) — unaffected by this record, still ready.

**PO-decided but requires engineering specification before implementation:**
- OQ-6 (field-level public/private mapping beyond the two named example fields; write-path design)
- OQ-8 (pre-Entity log table schema, retention, relationship to `DiscoveryEvent`)
- The underlying D12/D13 resolver itself (OQ-1/OQ-2/OQ-3 fix the decision points, but no Entity/IdentityEvidence data model or resolver code exists yet — this is the same pre-existing dependency the base record already notes)
- OQ-9's precedence algorithm (decided) still requires an Entity Status read-path, which requires the Entity table from D1/D8 to exist first

**Still PO-open:**
- OQ-5 (LinkedIn/profile content beyond bare URL) — deferred, not decided, pending a producer

## G. Confirmations

- No code changed.
- No migration created.
- No database changed.
- No commit made.
- No push made.
- The only file created by this task is this governance record itself (`requirement/CLIENT_FINDER_GLOBAL_ENTITY_ARCH_OPEN_QUESTIONS_PO_DECISION.md`).

---

**IMPLEMENTATION NOT AUTHORIZED.**
