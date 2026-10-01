# PATH 2 — D11-H Facilitator Observation Record

**Status:** PRE-SESSION / PARTIALLY PREFILLED
**Purpose:** Record D11-H validation observations without pre-populating live-session outcomes.
**Rule:** Repository-verifiable facts may be prefilled. Live-session observations, provider behavior, participant reactions, and facilitator observations remain blank until the validation session.

---

## 1. Validation Session

**Session date:** 2026-09-29
**Facilitator:** Product Owner (facilitator/analyst; also technical reviewer, per R-1/R-2)
**Participant:** P-01
**Session ID:** D11-VS-2026-09-29-01

**Live session status:** STOPPED UNDER §9.8 at 2026-09-29T10:26:45Z (observed) — Search 1 reached the
application terminal status `Failed` (attempts 3 of `MAX_SEARCH_ATTEMPTS` = 3). Search 2 not submitted.
Opened 2026-09-29T10:03:10Z under VS-PO-DEC-001 Option C §9
(readiness boundary: VS-SETUP-REC-004, `READY FOR VALIDATION`; R-11 session-start fingerprint
re-confirmed at opening: HEAD `5992b82b9adff492c480442d68a954f2a03bfb28`, staged none,
`git diff` sha256 `3ce19e2b00abd8e06fa70d0f517a15acf5ec3edcfbcfe6324cb04e59efc68a2e`,
excl. tsbuildinfo `e97de6cc4927c97bb320fc420a57fe90becde32f0cc765720ee81fd20727594c`,
`--name-only` `5286577a72e21a80a355a9e10dcc034d743303e0e4b86d6a39ef2edaba7c7501` — all = reference)

---

## 2. Repository / Implementation Baseline

**HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`

**Implementation state:** Path 2 category-plausibility implementation present in working tree.

**D11 validation state:** Live/manual validation remains outstanding.

**Repository evidence:** The D11 validation-readiness audit classified the implementation as structurally/testable, while explicitly leaving live/manual validation outstanding.

---

## 3. Search / Prospect Under Observation

**Search ID:** Search 1 = `cfba76b2-d972-4d18-8d46-2a2334e03a3a` (Search 2: not submitted)
**Prospect ID:** NOT CAPTURED — session stopped under §9.8 before any Prospect was observed through the application UI
**Company:** NOT CAPTURED — as above
**Target customer:** `EdTech platforms; private universities; test-prep institutes` (Search 1 input, VS-READY R-3, as shown on the Search status page)

**Live values:** PARTIAL — Search 1 only; session stopped under §9.8.

**Repository-verifiable constraint:** A Prospect belongs to a Search; a second Search finding the same real-world business results in a separate Prospect record rather than reassigning the original Prospect.

---

## 4. Live Discovery → Research Trace

**Discovery started:**
**Prospect created:**
**Research started:**
**Research completed:**
**Determination persisted:**
**Qualification evaluated:**

**Live trace:** (Search 1 `cfba76b2-d972-4d18-8d46-2a2334e03a3a`; observed through the Search status
page and the worker's stdout only; no database query)
- Submitted via `/searches/new` by the facilitator's provisioned account; status page "Started"
  9/29/2026, 3:49:43 PM (browser local time; ≈ 2026-09-29T10:19:43Z) — status `Queued`, Attempts 0.
- Worker stdout: `discovery.completed` logged 3 times for this Search, each `candidatesReceived: 20,
  accepted: 19, skipped: 1` (one per application-internal attempt; not facilitator-initiated).
- Status page at 10:21:35Z: `Running`, Attempts 2, Updated 3:50:52 PM.
- Status page at 10:26:45Z: `Failed`, Attempts 3, Updated 3:52:41 PM (≈ 10:22:41Z). Displayed error:
  `InsufficientEvidenceError: no usable source document found for <prospect>` — the prospect name
  and domain shown in the message are withheld here pending the facilitator's Q2 check against
  Business A.
- `/opportunities` (read-only, after failure): one Opportunity listed (Score 28 · LOW). Its Search
  linkage, Prospect ID and Determination ID were not captured (detail page not opened after the
  §9.8 stop). Name withheld as above.
- Research started / completed, determination persisted, qualification evaluated: NOT CAPTURED.

**§9.8 stop:** Search 1 cannot complete (application terminal failure). No manual retry, no rerun,
no Search 2. Participant review (§20) not started. §6.4 spot-check not performed.

**Repository-verifiable implementation path:**
`worker.ts → runResearchForOwner → Search resolution via prospect.searchId → parseTargetSegments → ResearchProviderInput → researchLead → category-plausibility verification → persistence`.

**Live execution evidence:** BLANK — not yet observed.

---

## 5. Target Customer Propagation

**Raw targetCustomer observed:**

**Parsed segments observed:**

**Target segments reaching Research:**

**Repository-verifiable behavior:** `targetCustomer` is parsed deterministically with:

`targetCustomer.split(';').map(trim).filter(length > 0)`

Empty/whitespace/all-delimiter input produces zero segments and ultimately an UNKNOWN result.

**Live trace confirmation:** BLANK.

---

## 6. Segment Set

**Number of segments observed:**

**Segments observed, in order:**

1.
2.
3.
4.
5.

**Repository-verifiable behavior:** Segment parsing is deterministic and preserves the supplied non-empty segments after trimming; no provider/model identity participates in parsing.

**Live observed segment set:** BLANK.

---

## 7. Aggregate Determination

**Aggregate result:**

`MATCH / MISMATCH / UNKNOWN`

**Repository-verifiable aggregation rule:**

* Any `MATCH` → aggregate `MATCH`
* All `MISMATCH` → aggregate `MISMATCH`
* Mixed `MISMATCH` + `UNKNOWN`, with no `MATCH` → `UNKNOWN`
* Empty segment set → `UNKNOWN`

**Live aggregate result:** BLANK.

---

## 8. Per-Segment Determinations

| # | Segment | Fit | Rationale | Evidence |
| - | ------- | --- | --------- | -------- |
| 1 |         |     |           |          |
| 2 |         |     |           |          |
| 3 |         |     |           |          |
| 4 |         |     |           |          |
| 5 |         |     |           |          |

**Allowed fit values:** `MATCH`, `MISMATCH`, `UNKNOWN`

**Repository-verifiable requirement:** MATCH/MISMATCH requires evidence; UNKNOWN must not fabricate evidence.

**Live values:** BLANK.

---

## 9. UNKNOWN / Insufficient Evidence Case

**UNKNOWN case observed:**

**Segment:**

**Reason for insufficient evidence:**

**Evidence reviewed:**

**Why the result should remain UNKNOWN:**

**Repository-verifiable behavior:** Missing/insufficient category-plausibility results default safely to UNKNOWN rather than fabricating MISMATCH. Evidence verification requires valid source attribution and verbatim quote support for non-UNKNOWN outcomes.

**Live UNKNOWN observation:** BLANK.

---

## 10. MATCH Case

**MATCH observed:**

**Segment:**

**Rationale:**

**Evidence:**

**Primary source:**

**Live observation:** BLANK.

---

## 11. MISMATCH Case

**MISMATCH observed:**

**Segment:**

**Rationale:**

**Evidence:**

**Primary source:**

**Live observation:** BLANK.

**Repository-verifiable downstream mapping:**
`MISMATCH → CATEGORY_PLAUSIBLE.satisfied = false → NOT_QUALIFIED`

The Opportunity itself remains unaffected.

---

## 12. Evidence Provenance

### Repository-verified evidence rules

For a MATCH/MISMATCH determination, the implementation verifies that:

* the cited source URL is one of the supplied source documents;
* the evidence quote occurs verbatim in that document;
* the quote satisfies the minimum evidence requirements;
* segment count/order corresponds to the expected input.

Invalid results are rejected and sent through the repair path rather than being persisted.

### Live evidence spot-check

**Claim selected for manual spot-check:**

**Source URL:**

**Quote:**

**Quote verified manually:**

**Evidence supports stated determination:**

**Facilitator notes:**

**Status:** BLANK — D11-E requires a live/manual spot-check.

---

## 13. Evidence Source Type

**Observed source:**

**First-party website evidence:**

**Supporting/secondary evidence:**

**Repository-verifiable limitation:** The current source-document pipeline is homepage-only; no secondary-page crawling is implemented. Therefore the richer first-party/supporting evidence distinction described in D3 is not exercised by the current implementation.

**Live observation:** BLANK.

---

## 14. Provider Used

**Provider:**

**Model:**

**Fallback provider invoked:** YES / NO

**Fallback status:**

**Provider attempts:**

**Provider-specific result differences:**

**Repository-verifiable fact:** The fallback provider constructs the Research input, including `targetSegments`, once and sends it through the same `researchLead()` path for each attempt.

**Live provider observation:** BLANK.

---

## 15. Provider-Neutrality Observation

**Provider used for this session:**

**Fallback used:**

**Same target segments received:**

**Same classification schema observed:**

**Any provider-specific divergence:**

**Repository-verifiable status:** Structural provider neutrality is established; live provider-neutrality evidence remains outstanding and was explicitly deferred to D11.

**Live validation:** BLANK.

---

## 16. Persistence / Attribution

**Determination persisted:**

**Search ID persisted:**

**Prospect ID persisted:**

**Determination timestamp:**

**Supersession behavior observed:**

**Repository-verifiable behavior:** Category plausibility is persisted as a dedicated Search+Prospect entity rather than a ResearchSignal. The current lookup relies on the Prospect's immutable Search association plus application-level supersession discipline.

**Live persistence observation:** BLANK.

---

## 17. Cross-Search Attribution Scenario

**Search A:**

**Real-world business:**

**Prospect A:**

**Target customer A:**

**Determination A:**

**Search B:**

**Prospect B:**

**Target customer B:**

**Determination B:**

**Historical records preserved independently:**

**Cross-Search attribution correct:**

**Repository-verifiable requirement:** D11 specifically requires this scenario to be exercised live; it has not yet been exercised.

**Live observation:** BLANK.

---

## 18. Qualification Result

**CATEGORY_PLAUSIBLE criterion:**

**NEED_DETECTED criterion:**

**EVIDENCE_PRESENT criterion:**

**Qualification state:**

**Opportunity still exists:**

**Repository-verifiable mapping:**

* MATCH → category criterion satisfied
* MISMATCH → `NOT_QUALIFIED`
* UNKNOWN/no determination → `INSUFFICIENT_EVIDENCE`
* Opportunity creation is unaffected by category plausibility.

**Live qualification result:** BLANK.

---

## 19. UI Review

**Opportunity ID:**

**Category-plausibility section visible:**

**Aggregate result visible:**

**Per-segment results visible:**

**Evidence visible:**

**Target customer visible:**

**Determination timestamp visible:**

**Opportunity remains visible:**

**Ranked Opportunities list affected:**

**Repository-verifiable UI behavior:** The Opportunity detail page renders aggregate/per-segment results, evidence, target-customer context, and determination timestamp. The plausibility section is independently guarded and does not gate Opportunity, Score, Evidence, or Qualification sections. No ranked Opportunities list uses category plausibility.

**Browser / real-data UI review:** BLANK — not yet performed.

---

## 20. Participant Session

**Participant saw the Opportunity without category-plausibility priming:**

**Participant response to “Would you actually contact this business?”:**

**Participant comments:**

**Participant reaction to evidence/result:**

**Participant disagreement with system determination:**

**Participant usability observations:**

**Session notes:**

**Repository-verifiable status:** No real participant session has yet been performed.

---

## 21. Facilitator Assessment

**Technical trace completed:**

**Evidence spot-check completed:**

**MATCH observed:**

**MISMATCH observed:**

**UNKNOWN observed:**

**Multi-segment scenario completed:**

**Cross-Search scenario completed:**

**Provider recorded:**

**Fallback behavior recorded:**

**UI reviewed with real determination:**

**Participant session completed:**

**Facilitator assessment:**

**Status:** BLANK — to be completed only from live-session evidence.

---

## 22. Final D11-H Sign-Off

**Validation session completed:**

**All mandatory D11 scenarios completed:**

**Outstanding mandatory items:**

**Pre-existing issues encountered:**

**New findings:**

**Final D11 validation disposition:**

`PASS / NOT READY / INCONCLUSIVE`

**Facilitator:**

**Date:**

**Signature / confirmation:**

---

### Repository-verifiable status summary

| Item                                    | Current status                                        | Qualification / evidence note |
| --------------------------------------- | ----------------------------------------------------- | ----------------------------- |
| MATCH/MISMATCH/UNKNOWN implementation   | VERIFIED structurally/unit-tested                     | —                             |
| Multi-segment parsing                   | VERIFIED structurally/unit-tested                     | —                             |
| Deterministic aggregation               | VERIFIED structurally/unit-tested                     | —                             |
| Evidence verification                   | VERIFIED structurally                                 | —                             |
| UNKNOWN safety behavior                 | VERIFIED structurally/unit-tested                     | —                             |
| Worker orchestration                    | **VERIFIED**                                          | The worker call path reaches the Research category-plausibility flow through the implemented orchestration (`worker.ts` → `runResearchForOwner` → `parseTargetSegments` → provider `targetSegments` → `supersedePrevious` + `save`); repository/source evidence is sufficient. |
| Evidence checks and repair              | **VERIFIED**                                          | Category-plausibility evidence is schema/evidence validated (`leadResearchSchema` + `verifyCategoryPlausibility`), and repair responses are merged and then pass through the same validation gates in `researcher.ts`; repair does not fabricate MATCH/MISMATCH. |
| Homepage-only sources                   | **VERIFIED**                                          | The implemented Research source boundary remains homepage-only (`sourceDocumentProvider.ts`: one `https://{normalizedDomain}` document labeled "Homepage"; file unchanged from HEAD); no Path 2 crawling/source expansion was introduced. |
| Fallback pass-through                   | **VERIFIED**                                          | `targetSegments` passes unchanged through the existing fallback-provider path (`researchInput` built once, reused per attempt); dedicated Anthropic and fallback tests verify preservation and ordering. |
| Determination storage                   | **VERIFIED WITH DOCUMENTED LIMITATION**               | *Repository-verified implementation behavior:* Search+Prospect attribution and supersession are implemented and verified (dedicated `category_plausibility_determinations` table, migration 0027; supersede-then-insert per Search+Prospect). *Documented limitation:* current-row resolution relies on the application-enforced Prospect→Search invariant rather than a database-level partial unique constraint for one current row per Prospect (migration 0027 defines only a non-unique partial index on `prospect_id WHERE superseded_at IS NULL`). |
| Qualification mapping                   | **VERIFIED**                                          | MATCH → normal qualification flow; MISMATCH → `NOT_QUALIFIED`; UNKNOWN/no determination → `INSUFFICIENT_EVIDENCE`. Opportunity creation remains unaffected. |
| UI behavior                             | **CODE VERIFIED / REAL-DATA RENDERING UNVERIFIED**    | Opportunity-detail UI code implements the approved D10 behavior. Actual browser rendering with a real persisted determination has not been exercised because live validation remains outstanding. |
| Opportunity unaffected by determination | VERIFIED                                              | —                             |
| Provider pass-through                   | VERIFIED by unit tests                                | —                             |
| Provider neutrality — live              | **BLANK / NOT YET VALIDATED**                         | —                             |
| Cross-Search live attribution           | **BLANK / NOT YET VALIDATED**                         | —                             |
| Manual evidence spot-check              | **BLANK / NOT YET PERFORMED**                         | —                             |
| Real-data browser UI review             | **BLANK / NOT YET PERFORMED**                         | —                             |
| Participant session                     | **BLANK / NOT YET PERFORMED**                         | —                             |
| D11-I provider readiness                | **OUTSTANDING**                                       | —                             |
| 14 integration failures                 | **PRE-EXISTING R-71 ISSUE; NOT A D11 SESSION RESULT** | —                             |

**Important:** Repository evidence establishes what the implementation is designed and tested to do; it does **not** constitute a live D11 observation. No MATCH, MISMATCH, UNKNOWN, provider, UI, participant, or cross-Search live-session field above has been pre-populated from inference.
