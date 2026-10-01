# INTENT INTAKE MVP

## Public-Intent / First-Party Signal Intake — Product Owner Decision Record

**Decision ID:** INTENT-INTAKE-PO-DEC-001
**Status:** **DECIDED** — D1, D2, D3, D4, D5 **DECIDED** (revision 2)
**Previous status:** PARTIALLY DECIDED (revision 1, D5 PENDING); before that, PENDING PRODUCT OWNER DECISION
**Preparation record:** `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION_PREPARATION.md`
(sha256 `90d924c3376e8ece79bba31dcd391ee7ca67289ec31a5814c36c43dcb61e15f1`). It is kept unchanged for
traceability, and its factual findings (§3, §4) and options (§5) are not modified by this record.
**Product Owner:** Product Owner, by explicit selection in the working session on 2026-09-29, recorded here
under that authorization
**Repository HEAD at decision:** `5992b82b9adff492c480442d68a954f2a03bfb28`
**Relation to other tracks:** Separate from Path 2 / P8 / D11. The validation session stays stopped under
§9.8. No Path 2 record is read as changed or is changed by this record.

**Revision history**

| Revision | Date | Change |
|---|---|---|
| 1 | 2026-09-29 | Round 1. D1 = C, D2 = A, D3 = A, D4 = A selected. D5 = A selected, but the Product Owner did not supply the values and chose to leave D5 PENDING. No rationale supplied for any decision. This record created. |
| 2 | 2026-09-29 | Round 2. The Product Owner supplied the D5 Option A values in the implementation instruction "Implement INTENT INTAKE MVP" (§1 D5): `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90`, not caller-overridable. D5 moved from PENDING to DECIDED. D1–D4 unchanged. The revision 1 text for D5 is kept in §7.2 as history. |

```text
INTENT-INTAKE-PO-DEC-001 .. DECIDED — D1 D2 D3 D4 D5 DECIDED (revision 2)
IMPLEMENTATION ............ NOT AUTHORIZED BY THIS RECORD (authorized separately by the Product Owner's implementation instruction)
MIGRATION 0029 ............ NOT CREATED
VALIDATION SESSION ........ NOT AUTHORIZED BY THIS RECORD — REMAINS STOPPED (§9.8)
```

---

## 1. Baseline at decision

| Item | Value |
|---|---|
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| `git status --short` | 174 entries before this record (the 173 pre-existing entries plus the preparation record) |
| Implementation fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `3ce19e2b00abd8e06fa70d0f517a15acf5ec3edcfbcfe6324cb04e59efc68a2e` |
| 0027 `migration.sql` sha256 | `11823808d44c89ec22a2f5549d2f9873d954c2e17eca1149233955a5d278c508` (matches MIGRATION-SETUP-PO-DEC-001 §3) |
| 0028 `migration.sql` sha256 | `bd8777158f84bcfefbde4ad0dde33beeb0c47d00bf91db18ff35f09d5ced6986` (matches MIGRATION-SETUP-PO-DEC-001 §3) |
| Latest migration directory | `0028_category_plausibility_source_documents` (no 0029) |

## 2. Summary

| ID | Status | Selected option | Pinned value(s) |
|---|---|---|---|
| D1 | **DECIDED** | C — Both 0 | `SOURCE_WEIGHT.PUBLIC_INTENT = 0`, `SOURCE_WEIGHT.FIRST_PARTY = 0` |
| D2 | **DECIDED** | A — Keep current | `SCORER_VERSION = 'prospectScore-v1'` (unchanged) |
| D3 | **DECIDED** | A — ServiceProfile opt-in | — |
| D4 | **DECIDED** | A — Run existing research | — |
| D5 | **DECIDED** (rev. 2) | A — Fixed by kind | `PUBLIC_INTENT = 70`, `FIRST_PARTY = 90` (OBSERVED; not caller-overridable) |

Rationale supplied by the Product Owner: **none, for every decision.**

---

## 3. D1 — `SOURCE_WEIGHT` values

- **Status:** DECIDED
- **Selected option:** C — Both set to 0.
- **Exact scope:** The two new `SOURCE_WEIGHT` entries in `packages/core-acquisition/src/scoring.ts`.
- **Exact limits:** `PUBLIC_INTENT: 0` and `FIRST_PARTY: 0`. The eight existing entries are unchanged.
- **Effect, as a fact from the preparation record §3:** `scoreLead()` computes `SOURCE_WEIGHT[kind] × confidence ×
  decay` and skips components with points ≤ 0. Signals of these kinds therefore add nothing to `scoreLead()`.
  `scoreLead()` has no production caller. `scoreProspect()` does not read `SOURCE_WEIGHT` values, so this decision
  changes no production score. The keys still widen the trigger vocabulary that ServiceProfile validation and
  `toServiceRule()` accept.
- **Rationale:** None supplied.
- **Affected implementation area:** `scoring.ts` `SOURCE_WEIGHT`, via the `ResearchSourceKind` additions (C1).
- **Unselected alternatives (unranked, preserved):**
  - A — Product Owner supplies explicit values.
  - B — Each new kind reuses an existing kind's value.
- **Not authorized:** any change to the eight existing weights, `scoreLead()`, `decayFactor()` or `scoreProspect()`.

## 4. D2 — `SCORER_VERSION`

- **Status:** DECIDED
- **Selected option:** A — Keep the current version.
- **Exact scope:** `SCORER_VERSION` in `packages/core-opportunity/src/service.ts`.
- **Exact limits:** The value stays exactly `'prospectScore-v1'`. The intent-intake implementation must not change it.
- **Rationale:** None supplied.
- **Affected implementation area:** None. This constrains the implementation not to edit this constant.
- **Unselected alternatives (unranked, preserved):**
  - B — Bump, with an exact new value and reason.
  - Other — Product Owner's exact rule.
- **Not authorized:** any change to the `SCORER_VERSION` value, or re-scoring of existing Opportunities.

## 5. D3 — Offer-engine entry for intent signals

- **Status:** DECIDED
- **Selected option:** A — ServiceProfile opt-in.
- **Exact scope:** `PUBLIC_INTENT` and `FIRST_PARTY` signals may contribute to `needDetected` through the existing,
  unchanged `suggestOffers()` only when the ServiceProfile retained on the Search lists that kind in its `triggers`.
  This applies to all ServiceProfiles, and each profile opts in separately for each kind.
- **Exact limits:**
  - The existing keyword match against the profile's `keywords` still applies.
  - R-70 and R-71 in `toOfferSignals()` still apply.
  - No existing ServiceProfile is modified by this decision or by the implementation.
  - How triggers are derived (OQ-4) remains undecided.
- **Implementation consequence (fact):** C1's addition of the two keys to `SOURCE_WEIGHT` is what lets
  ServiceProfile validation and `toServiceRule()` accept these kinds. No change to `suggestOffers()`,
  `toServiceRule()` filtering logic or ServiceProfile validation logic is needed or authorized.
- **Rationale:** None supplied.
- **Affected implementation area:** C1 only, through the `SOURCE_WEIGHT` keys.
- **Unselected alternatives (unranked, preserved):**
  - B — Implicit for every profile.
  - C — No offer triggering in the MVP.
  - Other — Product Owner's exact triggering rule.
- **Not authorized:** changing any ServiceProfile, adding implicit triggers, or changing `suggestOffers()`,
  `toServiceRule()` or `toOfferSignals()`.

## 6. D4 — Qualification of an intake-only Prospect

- **Status:** DECIDED
- **Selected option:** A — Run the existing research.
- **Exact scope:** A Prospect created or reached through intent intake enters the existing Research path
  (`runResearchForOwner`). That path produces the Search-scoped CATEGORY_PLAUSIBLE determination. The existing,
  unchanged Opportunity, Score, Qualification, Personalization, Outreach Preparation and Follow-up Preparation
  sequence then follows.
- **Exact limits:**
  - No change to Research, the category-plausibility determination, or Qualification criteria.
  - The determination remains governed by the Path 2 records.
  - Because Research supersedes signals, C2 (kind-scoped `supersedePrevious`) is a prerequisite. Intake signals
    must survive the Research run this decision causes.
- **Implementation consequence (fact):** In production, intake leads to the runtime behavior Research already has:
  a homepage source-document fetch and a research-model call. Implementation tests must use the existing fakes.
- **Rationale:** None supplied.
- **Affected implementation area:** The intake orchestration (C3), which reuses the Research step and the extracted
  post-research segment of `runCanonicalPipeline`.
- **Unselected alternatives (unranked, preserved):**
  - B — Stop at Score and Qualify, with exact allowed qualification evidence.
  - C — Change the qualification criterion, with exact criterion and governance scope.
  - Other — Product Owner's exact bounded rule.
- **Not authorized:**
  - Any live Research run, provider call or source fetch, in this task or during implementation testing.
  - Any validation session, Search submission or retry, or participant contact.
  - Any change to Path 2 / D11 / P8 governance or workflow.

## 7. D5 — Confidence for intake signals

### 7.1 Revision 2 (current)

- **Status:** **DECIDED**
- **Selected option:** A — Fixed by kind.
- **Exact limits:**
  - `PUBLIC_INTENT` gets confidence `70` and `FIRST_PARTY` gets confidence `90`.
  - Both are classified `OBSERVED`.
  - The system assigns the value; a caller may not supply or override it.
- **Rationale:** None supplied.
- **Affected implementation area:** Construction and validation of intent-signal input (C3).
- **Not authorized:** any other value, any caller-supplied or default confidence, or any change to how existing
  research confidence is handled.

### 7.2 Revision 1 (history, superseded by §7.1)

- **Status:** **PENDING**
- **Selected option:** A — Fixed by kind (selected in round 1).
- **Missing to resolve:** exact integer confidence values (0–100) for **`PUBLIC_INTENT`** and **`FIRST_PARTY`**.
  The Product Owner explicitly chose to leave D5 PENDING when asked for them.
- **Context (from the preparation record §5):** ≥50 makes a signal eligible for `visibleProblem`. ≥70 counts a
  signal as well-sourced in `evidenceQuality`.
- **Unselected alternatives (unranked, preserved):**
  - B — Caller-supplied within a bounded range.
  - Other — Product Owner's exact confidence rule.
- **Not authorized:** choosing, defaulting or inferring any confidence value. Implementation of C3 cannot complete
  while D5 is PENDING.

## 8. Implementation status

The intent-intake implementation stays **blocked** until D5 is decided. Even then, this record does not
authorize implementation: that needs an explicit instruction. The following were **not** done:

- Migration 0029
- `research_signals` changes
- ServiceProfile changes
- `scoreProspect()`, qualification or offer changes
- `runCanonicalPipeline` changes
- Intake endpoints or provider adapters
- External calls
- Validation

## 9. Execution counters (this decision round)

```text
Anthropic API calls: 0
Google API calls: 0
External API calls: 0
Live-source fetches: 0
Database connections: 0
SQL queries: 0
Migrations executed: 0
Production code changes: 0
Schema changes: 0
Configuration changes: 0
Dependencies changed: 0
Validation sessions: 0
Searches submitted: 0
Manual retries: 0
Participant contacts: 0
```

Files created: this record only. Files modified: none (the preparation record is unchanged; its sha256 is pinned
above).
