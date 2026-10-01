# PATH 2 — A-12 §6.3 Companion Record

**Record type:** Facilitator/analyst-side record. It is **not** shown to the participant.
**Status:** PRE-SESSION / BLANK TEMPLATE
**Live session status:** STOPPED UNDER §9.8 — Session D11-VS-2026-09-29-01 opened 2026-09-29T10:03:10Z; Search 1 (`cfba76b2-d972-4d18-8d46-2a2334e03a3a`) reached application status `Failed` (attempts 3/3); no determination captured; §2 register not populated; §6.4 spot-check not performed.
**Purpose:** Record D11 §6.3 results for category-plausibility segments: the structural
check and the independent substantive check.
**Governing decision:** `PATH_2_CATEGORY_PLAUSIBILITY_A12_FACILITATOR_RECORD_PRODUCT_DECISION.md` (A-12, Option C).
**Authorization:** A-12 §6.3 Companion Record — Creation Authorization (artifact creation only).
**Companion to:** `PATH_2_CATEGORY_PLAUSIBILITY_D11_FACILITATOR_OBSERVATION_RECORD.md` (D11-H record). That record is unchanged by this Companion.

```text
F-1 IMPLEMENTATION ........ NOT AUTHORIZED
D11 LIVE VALIDATION ....... NOT READY FOR LIVE VALIDATION
A-12 ...................... CLOSED
```

**What this record is not.**
- It is not a revision of the D11-H record. It adds no field, column or template to D11-H.
- It is not an amendment to F1-D, D11 or any D0–D11 artifact.
- It is not part of the participant-facing instrument (`MVP_REAL_USER_VALIDATION_TEMPLATE.md`).
- It is not part of the F-1 implementation.

---

## 0. Rules of Use

These rules come from A-12 Decision §7.2 and §9, and Authorization §5 and §8.

1. **Record only live-session observations.** Nothing in §1–§7 is pre-populated. No missing value is invented.
2. **Transcribe stored values exactly.** Copy classification, confidence and basis from the persisted row as stored. Do not normalize, correct or derive them. Deriving classification from fit is not recording it. Write `ABSENT` for a field the row lacks.
3. **Record verbatim.** Copy quotes, URLs, labels and rationale exactly as stored.
4. **Keep findings separate from stored values.** The substantive finding (§4) is the facilitator's own reading of the cited evidence. It must never be filled by copying the stored classification.
5. **A label-only finding is invalid.** A finding whose only stated reason is one of the following does not count, and the segment is treated as unrecorded:
   - the stored `OBSERVED` label;
   - `CITED_SOURCE_EVIDENCE`;
   - the confidence value;
   - the fact that code verification passed.
6. **A blank is not a pass.** An empty result cell is an unrecorded check.
7. **Directness is not a criterion** (F1-D §8). A quote that states the verdict directly, and one that contains every premise for it, are both acceptable.
8. **Scope.** Record every segment of every determination reviewed in the session, including both Searches of the cross-Search scenario. Segment index is the position in the stored `segment_results`, starting at 1.
9. **Vocabulary.** The finding words "OBSERVED/INFERRED in substance" carry F1-D §8's meaning only. They are not a stored segment classification and not a ResearchSignal classification. Segment classification stays `OBSERVED | UNKNOWN`. `INFERRED` is not a permitted segment classification (F1-D §7; F-1 §9 Correction).

---

## 1. Session Link

| Key | Value | Must match |
|---|---|---|
| Companion record ID | ABSENT — no Companion record ID is assigned by any governing record | — |
| Session ID | D11-VS-2026-09-29-01 | D11-H §1 "Session ID" |
| D11-H record reference (file / copy used for this session) | `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D11_FACILITATOR_OBSERVATION_RECORD.md` | — |
| Session date | 2026-09-29 | D11-H §1 "Session date" |
| Facilitator / analyst | Product Owner | D11-H §1 "Facilitator" |
| Technical reviewer (if different) | Product Owner (same person, per R-1/R-2) | — |

**Live values:** RECORDED at session opening 2026-09-29T10:03:10Z (participant label P-01).

---

## 2. Determination Register

One row per determination reviewed in the session. The determination ID and timestamp are
taken from the persisted `category_plausibility_determinations` row as observed. They are
traceability keys in this Companion only, not additions to D11-H.

| Det # | Opportunity ID | Search ID | Prospect ID | Determination ID | Determination timestamp | Created after F-1 implementation (YES / NO) | All F-1 fields complete (YES / NO) | Validation status | Exclusion reason |
|---|---|---|---|---|---|---|---|---|---|
| D1 | | | | | | | | | |
| D2 | | | | | | | | | |
| D3 | | | | | | | | | |
| D4 | | | | | | | | | |

**Validation status values (F-1 §11 item 5):**
- `VALID` — created after F-1 implementation, with complete fields.
- `EXCLUDED / PRE-F1` — created before F-1 implementation (legacy row).
- `EXCLUDED — NOT VALIDATION-VALID` — created after F-1 implementation but with incomplete fields.

**Rule.** An excluded determination's segments are still recorded in §3, marked excluded.
They are not assessed in §4 or §5 and do not enter any result in §6. Rows are never silently
dropped.

**Key correspondence with D11-H:** Opportunity ID ↔ D11-H §19; Search ID and Prospect ID ↔
D11-H §3 (and §17 A/B); Determination timestamp ↔ D11-H §16.

**Live values:** BLANK.

---

## 3. Structural §6.3 Check (every segment)

This is the mechanical part (F1-D §8 part 1). It is expected always to pass. A `FAIL` indicates
an implementation defect.

| Det # | Seg idx | Segment text | Stored fit | Stored classification | Stored confidence | Stored basis | Evidence count | Structural result | Failure reason |
|---|---|---|---|---|---|---|---|---|---|
| | 1 | | | | | | | | |
| | 2 | | | | | | | | |
| | 3 | | | | | | | | |
| | 4 | | | | | | | | |
| | 5 | | | | | | | | |

**Structural result values:**
- `PASS`;
- `FAIL` (failure reason required: name the violated condition);
- `EXCLUDED / PRE-F1` or `EXCLUDED — NOT VALIDATION-VALID`, copied from §2.

**`PASS` requires all of:**
- classification ∈ {`OBSERVED`, `UNKNOWN`}; any other value, including `INFERRED`, is `FAIL`;
- confidence and basis populated;
- `OBSERVED` ⇔ fit MATCH/MISMATCH ⇔ basis `CITED_SOURCE_EVIDENCE` ⇔ confidence 1–100 ⇔ evidence count ≥ 1;
- `UNKNOWN` ⇔ fit UNKNOWN ⇔ basis ∈ {`MODEL_REPORTED_INSUFFICIENT_EVIDENCE`, `NO_MODEL_VERDICT`} ⇔ confidence 0 ⇔ evidence count 0.

**Live values:** BLANK.

---

## 4. Substantive §6.3 Check (each VALID MATCH / MISMATCH segment)

This is the independent reading (F1-D §8 part 2; F1-D §5 conditions b–d). Complete one block
per MATCH/MISMATCH segment of a `VALID` determination. Copy the block as needed.

### 4.x Segment block — Det # ___ / Seg idx ___

**Segment text:**

**Stored fit:** `MATCH / MISMATCH`

**Cited evidence (verbatim, as stored):**

| Ev # | sourceUrl | sourceLabel | sourceQuote |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |

**Stored rationale (verbatim):**

**Source read:** how the quotes were read in context (live source or captured copy), with date/time.

**§6.4 spot-checked on this segment:** `YES (see D11-H §12) / NO`

**Substantive finding:** `ACCEPT / REJECT / NOT ASSESSABLE`

**If ACCEPT — grounding statement** (required). Name the Ev #(s) that state the verdict or
contain every premise for it, and say how:

**If REJECT — rejection ground** (required; choose from F1-D §8):
- `INFERRED IN SUBSTANCE — UNCITED PREMISE`: the verdict needs a premise that no cited quote contains, such as an uncited rationale fact, the business name, or general category knowledge;
- `MISMATCH RESTS ON ABSENCE OR SILENCE`;
- `SUPPORTING-TIER OR WEAK EVIDENCE ONLY` (D3; D11 §6.2);
- `QUOTE NOT VERBATIM OR NOT AT URL`.

**If REJECT — the uncited premise or specific reason** (required):

**If NOT ASSESSABLE — reason** (required), for example the source no longer shows the quoted
text (see A-11):

**Label-only check** (Rule 5). The finding relies only on the stored label, basis, confidence
or code verification: `NO` (required for a valid finding) / `YES` (the finding is invalid)

**Facilitator notes:**

**Live values:** BLANK.

**Meaning of the findings.**
- `ACCEPT` = OBSERVED in substance.
- `REJECT` = a §6.3 failure for that segment (F1-D §8; Correction §6).
- `NOT ASSESSABLE` is **not** a pass.

---

## 5. UNKNOWN Segments (each VALID UNKNOWN segment)

| Det # | Seg idx | Stored basis | Stored rationale (verbatim; `NULL` if null) | Evidence count | Stored confidence | UNKNOWN acceptance | Rejection reason | Counts toward D11 UNKNOWN coverage | Referenced by D11-H §9 case (YES / NO) |
|---|---|---|---|---|---|---|---|---|---|
| | | | | | | | | | |
| | | | | | | | | | |

**UNKNOWN acceptance (F1-D §8 table):**
- `MODEL_REPORTED_INSUFFICIENT_EVIDENCE`: `ACCEPT` when evidence is empty, confidence is 0 and a rationale states what was absent or insufficient. Otherwise `REJECT`.
- `NO_MODEL_VERDICT`: `ACCEPT` when structurally valid (F-1 §10): evidence empty, confidence 0, rationale `NULL`.

**Coverage rule (F1-E):**
- `YES` only for an accepted `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` segment.
- `NO_MODEL_VERDICT` is always `NO`.

The genuineness judgment for the D11 UNKNOWN case stays in D11-H §9, unchanged.

**Live values:** BLANK.

---

## 6. Session §6.3 Results

Only `VALID` determinations count.

| Result | Value | Rule |
|---|---|---|
| Structural §6.3 session result | | `PASS` only if every VALID segment in §3 is `PASS`; otherwise `FAIL` |
| Substantive §6.3 session result | | `PASS` only if every VALID MATCH/MISMATCH segment in §4 is a valid `ACCEPT`; `FAIL` if any is `REJECT`; otherwise `INCOMPLETE` |
| UNKNOWN segments accepted (§5) | | Count, and any `REJECT` |
| Accepted model-reported UNKNOWN segments counting toward coverage | | Count of §5 `YES` |
| **Overall §6.3 session result** | | `PASS` only if the structural and substantive session results are both `PASS`; `FAIL` if either is `FAIL`; otherwise `INCOMPLETE` |
| Rows behind any FAIL / INCOMPLETE | | Det # / Seg idx list |

**Relationship to the D11-H §22 disposition.**
- D11-H §22 is unchanged.
- The D11-H §22 disposition may not be `PASS` unless the overall §6.3 session result above is `PASS`.
- Internally consistent stored classifications alone never make §6.3 `PASS`.
- A `FAIL` or `INCOMPLETE` is an outstanding mandatory item for the session.
- Whether such a session is `NOT READY` or `INCONCLUSIVE` remains the facilitator's D11-H judgment.

**Live values:** BLANK.

---

## 7. Companion Sign-Off

| Confirmation | Value |
|---|---|
| All reviewed determinations are listed in §2 | |
| Stored values transcribed without alteration | |
| No finding relies only on the stored label | |
| Excluded rows kept out of §6 | |
| Facilitator / analyst | |
| Technical reviewer | |
| Date | |

**Live values:** BLANK.

---

## 8. Ambiguities Recorded During Creation

These were found while creating this record. Under Authorization §8.7 they are recorded
here. No governing artifact was changed to resolve them.

| # | Ambiguity | How this record handles it | Owner |
|---|---|---|---|
| AMB-1 | **Rejection grounds.** A-12 Decision §9 requires a REJECT to name an uncited premise. The Authorization §5.3 allows "the uncited premise or other substantive reason". F1-D §8's table lists further rejection grounds: absence/silence, supporting-only evidence, and a quote not verbatim or not at the URL. | §4 offers exactly the F1-D §8 grounds, each requiring a specific reason. No ground outside F1-D §8 is added. **Ruling (A-12-AMB-DEC-001 §3):** REJECT grounds remain limited to the applicable existing F1-D §8 grounds, and this record creates no new rejection category. "Other substantive reason" is not authority for a new ground. A case that fits no applicable F1-D §8 ground is not forced into REJECT; the applicable existing outcome is used, including `NOT ASSESSABLE` where appropriate. | **RESOLVED** — Product Owner decision A-12-AMB-DEC-001 |
| AMB-2 | **Exclusion markers.** The Authorization §5.5 names `EXCLUDED / PRE-F1`. F-1 §11 item 5 also excludes post-F1 rows with incomplete fields, for which A-12 Decision §15 used `EXCLUDED — NOT VALIDATION-VALID`. | Both markers are used (§2). Both are excluded from every result. | None; recorded only |
| AMB-3 | **D11-H cross-reference.** A-12 Decision §7.3 says the session's D11-H record must name the Companion in an existing §22 field. The Authorization §3.1 says no existing D11-H entry may be rewritten to accommodate the Companion. | This record does not depend on that cross-reference. Linkage is carried entirely by the §1–§2 keys. **Ruling (A-12-AMB-DEC-001 §4):** during a separately authorized validation session, an existing D11-H §22 field may be populated prospectively with the Companion reference as normal session data entry. This does not authorize a new D11-H field or column, a template or schema change, renaming or repurposing a field, or retroactive modification of a completed D11-H record. | **RESOLVED** — Product Owner decision A-12-AMB-DEC-001 |
| AMB-4 | **"F-1 validation results" versus "D11 validation".** The Authorization §5.5 says pre-F1 rows "shall not contribute to F-1 validation results". F-1 §11 item 5 speaks of D11 validation validity. | Read as the same exclusion: excluded rows enter no §6 result and no D11 coverage. | None; recorded only |
| AMB-5 | **Determination ID.** D11-H §16 records a determination timestamp but has no determination ID field. | The ID is recorded in this Companion only (§2). D11-H is not changed. | None; recorded only |
| AMB-6 | **Assessability depends on A-11.** Without captured source text, substantive readings may be `NOT ASSESSABLE`. That makes the session `INCOMPLETE`, not `PASS`. | Recorded as a known dependency. A-11 remains an independent prerequisite. | Independent item (A-11) |

---

**Important:** This is a blank instrument. It contains no live observation, no participant
data and no pre-populated outcome. Creating it does not close A-12. It authorizes no F-1
implementation and does not make D11 ready for live validation.
