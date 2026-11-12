# Client Finder — `/opportunities` List Visibility (B1: Show All, Prioritize Qualified)

## 1. Decision ID

`CF-OPPORTUNITIES-LIST-VISIBILITY-PO-DEC-001`

## 2. Decision status

**DECIDED.** This is a **Product Owner product decision record only**. It grants **no implementation, schema,
migration, route, test, or UI-code authority**. No code, test, schema, migration, route, service, or UI file is
modified, authorized, or implied by this record. Nothing is staged, committed, pushed, or deployed as a result of
this record.

This record resolves a previously genuine open question, audited read-only immediately prior to this record (see
§6.1): no prior PO decision explicitly stated whether `/opportunities` should show only `QUALIFIED` Opportunities
or also show `NOT_QUALIFIED` / `INSUFFICIENT_EVIDENCE` ones. This record closes that gap. It does not conflict
with or reopen any decision listed in §6.2.

## 3. Decision authority

**Product Owner.** The decision in §4 below was supplied directly by the Product Owner and is recorded here
substantially as stated, without reinterpretation or added mechanics beyond what was explicitly stated.

## 4. THE DECISION — B1

> **Show all discovered opportunities, prioritize qualified/actionable opportunities.**

`/opportunities` must display discovered/admitted Opportunities **regardless of qualification state**.
`QualificationState` affects **presentation and prioritization**, not whether the Opportunity exists in persistence
or whether it is displayed.

### 4.1 Required presentation semantics

| `QualificationState` | List behavior |
|---|---|
| `QUALIFIED` | Normal / high-priority presentation. |
| `NOT_QUALIFIED` | **Remains visible**, but clearly labeled and de-emphasized relative to `QUALIFIED` rows. |
| `INSUFFICIENT_EVIDENCE` | **Remains visible**, clearly labeled as needing more evidence. |

Ranking may determine **ordering** within the list. Ranking **must not eliminate** an Opportunity from the list
solely because of its `QualificationState`.

### 4.2 Relationship between Opportunity existence and qualification — generalizes existing precedent

This generalizes, for the `/opportunities` list specifically, the same separation-of-concerns principle already
decided for ₹1,499 contact-unlock eligibility in `CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md` §5
(`CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-PO-DEC-002`): *"Qualification affects ranking, confidence, warnings,
or presentation. It does not affect opportunity eligibility."* That record decided this for contact-unlock
eligibility and the target-customer-match signal; this record decides the analogous question for general
`/opportunities` list visibility and `QualificationState`. The two records are consistent and mutually
reinforcing, not in conflict.

## 5. This decision does NOT

- Change Opportunity creation/admission rules. `createOpportunityForOwner` continues to create an Opportunity for
  every processed Prospect exactly as today (`packages/core-opportunity/src/service.ts`), per the already-settled
  architecture in `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` D4/D5 (MISMATCH/UNKNOWN must not prevent
  Opportunity creation).
- Change qualification logic. `evaluateQualification` (`packages/core-qualification/src/evaluator.ts`) and its
  `QUALIFIED` / `NOT_QUALIFIED` / `INSUFFICIENT_EVIDENCE` determinations are unchanged.
- Change evidence thresholds, including the `NEED_DETECTED` evidence bar decided in
  `CLIENT_FINDER_NEED_OPPORTUNITY_SUFFICIENCY_PO_DECISION.md` (K5-D1 / `CF-NEED-OPPORTUNITY-SUFFICIENCY-PO-DEC-001`).
- Change ranking dimensions or scoring (`packages/core-opportunity` universal ranking / `opportunity_scores`).
- Change contact-unlock eligibility (`CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-PO-DEC-002` is unaffected and
  unmodified).
- Introduce a new per-lead user-facing quality score. This record does not create, persist, or display any new
  numeric score; it only requires surfacing the **existing, already-persisted** `QualificationState` value as a
  label. `CF-DISCOVERY-QUALITY-LAUNCH-GATE-PO-DEC-001`'s prohibition on a new user-facing ranking/quality score is
  unaffected.
- Delete, suppress, or otherwise remove discovered Opportunities from persistence. No row is deleted, archived, or
  hidden from the underlying data store as a result of this record — only presentation changes.
- Introduce a new `QualificationState` value. Only the three existing values (`QUALIFIED`, `NOT_QUALIFIED`,
  `INSUFFICIENT_EVIDENCE`) are in scope for display.
- Decide implementation mechanics (query shape, join vs. batch-fetch, specific label copy, specific visual
  treatment, or de-emphasis styling). Those are engineering/UX decisions made under this record's constraints, not
  decided by it.

## 6. Relationship to prior records

### 6.1 Resolves the audited gap

Immediately preceding this record, a read-only audit (`CF-OPPORTUNITIES-LIST-VISIBILITY` question, not itself a
filed record) confirmed that no PO decision previously addressed `/opportunities` list filtering by
`QualificationState`. Specifically:

- `CLIENT_FINDER_C_SERIES_PRODUCT_OWNER_DECISION_RECORD.md` §C-6 (`CF-C-SERIES-PO-DEC-001`) decided per-row
  **content** (compact Minimum Useful Lead Result) but was silent on qualification-state-based inclusion/exclusion.
  **This record does not modify C-6's field-content decision** — it adds a qualification-state **label** as
  additional required content, consistent with, not contradicting, C-6.
- `PATH_2_CATEGORY_PLAUSIBILITY_DECISION_PACKET.md` D9 ("UI visibility" of the categoryPlausibility determination
  itself) remains **UNRESOLVED** and is **not** decided by this record. This record decides `QualificationState`
  list visibility, not whether the underlying categoryPlausibility result is separately exposed.

### 6.2 Not reopened / unaffected

- `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` D4/D5 — Opportunity creation on MISMATCH/UNKNOWN —
  unaffected (§5).
- `CLIENT_FINDER_NEED_OPPORTUNITY_SUFFICIENCY_PO_DECISION.md` (K5-D1) — evidence bar for `NEED_DETECTED` —
  unaffected (§5). This record is consistent with that decision's own framing that `NOT_QUALIFIED` is "a
  legitimate, frequent outcome... correct product behavior, not a gap" — B1 extends that framing to the list UI.
- `CLIENT_FINDER_QUALIFICATION_WITHOUT_CATEGORY_PLAUSIBILITY_PO_DECISION.md` — unaffected.
- `CLIENT-FINDER-1499-OPPORTUNITY-ELIGIBILITY-PO-DEC-002` — unaffected; generalized in spirit only, not modified
  (§4.2).
- `CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md` (`CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`) —
  unaffected; its required content fields remain required. Qualification-state labeling is additive to MULR
  content, not a replacement.
- `CLIENT_FINDER_DISCOVERY_QUALITY_LAUNCH_GATE_PO_DECISION.md` / Phase 8 interpretation — unaffected (§5).
- `PHASE_20_QUALIFICATION_CLOSURE.md` / `PHASE_20_QUALIFICATION_SCOPE_LOCK.md` — unaffected; qualification engine
  scope unchanged.

## 7. Governance safety — not decided here

The following remain separate, unresolved engineering/UX questions, **not** decided by this record:

- Exact query/join mechanics for retrieving `QualificationState` alongside each list row.
- Exact label copy, iconography, or de-emphasis visual treatment for `NOT_QUALIFIED` / `INSUFFICIENT_EVIDENCE` rows.
- Whether `INSUFFICIENT_EVIDENCE` and `NOT_QUALIFIED` receive identical or distinct visual/copy treatment (both
  must be labeled and visible per §4.1; relative emphasis between the two is an engineering/UX decision).
- Pagination, counts, or summary-number copy (e.g., whether a "N opportunities" count means all discovered or only
  `QUALIFIED`).
- Any change to the detail page (`[id]/page.tsx`), which already renders qualification state correctly and is not
  required to change under this record.

## 8. NOT AUTHORIZED

This record does not authorize: any code, test, schema, migration, route, or service change; any change to
`packages/core-qualification`, `packages/core-opportunity` ranking/scoring, or Opportunity creation/admission
logic; any change to contact-unlock eligibility; database changes; UI implementation; deployment, release, or
production traffic of any kind; commit or push of any file.

**Next governance action:** none required to proceed with a read-only implementation-delta audit under this
decision's constraints. Actual implementation requires its own, separate, explicit Product Owner authorization.

## 9. Governance statement

This is a Product Owner product decision record only. It decides that `/opportunities` must show all
discovered/admitted Opportunities regardless of `QualificationState`, with `QUALIFIED` Opportunities presented
normally/high-priority, `NOT_QUALIFIED` Opportunities visible but labeled/de-emphasized, and
`INSUFFICIENT_EVIDENCE` Opportunities visible and labeled as needing more evidence; ranking may order but must not
eliminate rows by qualification state. It does not change Opportunity creation/admission, qualification logic,
evidence thresholds, ranking dimensions/scoring, or contact-unlock eligibility, and does not delete, suppress, or
remove any discovered Opportunity from persistence. No code, schema, migration, test, route, or service file is
changed, staged, committed, pushed, or deployed as a result of this record.
