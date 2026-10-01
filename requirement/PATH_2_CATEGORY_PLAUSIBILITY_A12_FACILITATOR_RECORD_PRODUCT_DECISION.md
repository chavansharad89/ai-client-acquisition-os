# Path 2 — Category Plausibility

## A-12 Facilitator Record: Product Owner Decision

### 1. Status

```text
DOCUMENT TYPE: PRODUCT OWNER DECISION (A-12)
STATUS: DECIDED
DECISION: OPTION C — COMPANION §6.3 RECORD (D11-H record unchanged)
A-12: DECIDED — CLOSURE PENDING (companion record not yet created; see §19, §23)
D0–D11: IMMUTABLE
F-1 IMPLEMENTATION: NOT AUTHORIZED
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
D11 LIVE VALIDATION: NOT READY FOR LIVE VALIDATION
```

This document records a Product Owner decision. It modifies no existing file:
- not the D11-H Facilitator Observation Record;
- not F1-D, the Correction, F-1, D11 or any other governance document;
- not code, tests, migrations, schema, UI, PRD, configuration, provider or worker.

It does not create the companion record. Creating it is a follow-up documentation act that
needs its own authorization (§19, §22). It is the only file created by this task.

**Evidence tags used below.**

| Tag | Meaning |
|---|---|
| [LOCKED D11 REQUIREMENT] | Text of `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md` or the Consolidated Scope Lock's D11 section |
| [LOCKED F1 DECISION] | F-1, F1-D, or the F-1 §9 Correction |
| [GOVERNANCE FACT] | A verifiable fact about the current documents or repository |
| [PRODUCT-OWNER CHOICE] | A choice made by this document |
| [OPEN QUESTION] | Not resolved here |

---

### 2. Decision

```text
SELECTED: OPTION C — COMPANION RECORD
```

[PRODUCT-OWNER CHOICE] D11 §6.3 results for category-plausibility segments are recorded in
a new, separate, facilitator/analyst-side **D11 §6.3 Companion Record** ("the Companion").
- The D11-H Facilitator Observation Record stays unchanged.
- The Companion and the D11-H record together form the facilitator/analyst-side record that D11-H requires. They are linked by the keys in §7.3.
- The Companion is the **sole authoritative location** for §6.3 results. Free text in the D11-H record is not an authoritative §6.3 record (§18).

Options A and B are not selected. The reasons are recorded in §4 so the choice can be audited.
This is the only ranking this document makes.

---

### 3. Exact A-12 Question

> How must the D11 §6.3 results required by F1-D §8 be recorded in the facilitator/analyst-side
> D11-H observation record?

---

### 4. Governance Basis

**Inputs read and verified for this decision:**
- `PATH_2_CATEGORY_PLAUSIBILITY_A12_FACILITATOR_RECORD_PRODUCT_DECISION_PREPARATION.md` (Preparation);
- `PATH_2_CATEGORY_PLAUSIBILITY_A12_FACILITATOR_RECORD_CONFORMANCE_AUDIT.md` (A-12 Audit);
- `PATH_2_CATEGORY_PLAUSIBILITY_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` (F1-D);
- `PATH_2_CATEGORY_PLAUSIBILITY_D11_FACILITATOR_OBSERVATION_RECORD.md` (D11-H record);
- `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md` (D11) §2, §5, §6, §9, §11;
- `PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` D11 section;
- `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` (F-1) §10, §11, §13–§14;
- `PATH_2_CATEGORY_PLAUSIBILITY_F1_D3_INFERRED_CORRECTION.md` (Correction) §6, §8.

**Facts the decision rests on.**
1. [GOVERNANCE FACT] The D11-H record contains no §6.3 entry. The strings "6.3", "confidence", "basis" and "INFERRED" do not occur in it; "classification" occurs only in §15 (provider neutrality). Re-verified in this task (D11-H record lines 1–469).
2. [GOVERNANCE FACT] A-12 Audit §25 classifies the record NOT CONFORMING for the F1-D §8 recording requirement. The Preparation §7 re-verified this. No repository evidence contradicts it.
3. [LOCKED D11 REQUIREMENT] D11 §6 makes item 3 "MANDATORY, per validation session".
4. [LOCKED D11 REQUIREMENT] D11 §9 and D11-H place the §5 observations in "a **separate, facilitator/analyst-side record**, correlated with each per-opportunity entry in the template by Opportunity ID". D11 does not prescribe that record's fields or say it must be one file.
5. [LOCKED F1 DECISION] F1-D §8 splits §6.3 into a structural part and a substantive part. An INFERRED-in-substance verdict is "**Reject.** This is recorded as a §6.3 failure for that segment." Correction §6 repeats this.
6. [LOCKED F1 DECISION] F1-D §8: "This document adds no field, column or template change to the D11-H facilitator record. Findings are recorded through the record's existing §6.3 evidence-check entries."

**Why Option C, and not A or B.** [PRODUCT-OWNER CHOICE]

| Option | Reason |
|---|---|
| A — Free-text authority | **Not selected.** No existing field distinguishes the structural and substantive results. The only per-claim support field (D11-H §12) is labelled for D11-E/§6.4. The per-segment rejection F1-D requires would sit in session-level catch-alls (§21, §22). The Preparation §15 names the resulting risk as *under-recording*: a facilitator could write only the stored label. That is the tautology F1-D §3 (C-3) exists to prevent. Free text cannot reliably hold a mandatory per-session, per-segment check. |
| B — Amend D11-H | **Not selected.** It needs a template change to the one record that F1-D §8 says it adds no field, column or template change to. Every prior audit treated the D11-H record as not to be modified. The literal reading (the sentence limits only F1-D itself) is defensible, but Option B would still need that reading to be adopted against F1-D's evident intent. Option C reaches the same structured result without it. |
| C — Companion record | **Selected.** It gives the structured, per-segment recording that A lacks. It keeps F1-D §8's "no field, column or template change" true in letter and intent. It is compatible with D11-H (§5). Its main cost, a cross-document join, is controlled by the mandatory linkage in §7.3. |

---

### 5. Relationship to Locked D0–D11 Requirements

- [LOCKED D11 REQUIREMENT] D0–D11 text is not amended, reinterpreted or reopened.
- [GOVERNANCE FACT] D11 §6 states *what* must hold. It does not state *where* it is recorded. D11-H names a facilitator-side record but not its fields.
- **Compatibility with "a separate, facilitator/analyst-side record".** [PRODUCT-OWNER CHOICE] The Companion is compatible, for these reasons:
  - D11 §9 contrasts the facilitator-side record with the **participant-facing template**. "Separate" means separate from what the participant sees, to keep blinding (D11 §5, §12). The Companion is facilitator-side and never shown to the participant, so it keeps that separation.
  - D11 does not require that record to be one file. The D11-H record plus the Companion, joined by the §7.3 keys, is one facilitator/analyst-side record in the D11-H sense.
  - The Companion carries the Opportunity ID, which is D11-H's correlation key with the participant template.
  - [OPEN QUESTION — not blocking] D11 does not expressly say a multi-document record is allowed. This document reads D11-H as allowing it. It does not treat D11 as having said so.
- [LOCKED D11 REQUIREMENT] `MVP_REAL_USER_VALIDATION_TEMPLATE.md` is not modified or referenced by the Companion's content (D11 §9, §11; Scope Lock D11-C/H).
- Research-signal OBSERVED / INFERRED / UNKNOWN meanings are unchanged.

---

### 6. Relationship to F1-D §8

F1-D §8's recording paragraph has two sentences. This decision treats them separately.

| F1-D §8 sentence | Treatment | Tag |
|---|---|---|
| "This document adds no field, column or template change to the D11-H facilitator record." | **Left as is, and honoured.** The D11-H template gets no field, column or template change under this decision. The sentence is not reinterpreted, superseded or ignored. | [LOCKED F1 DECISION] |
| "Findings are recorded through the record's existing §6.3 evidence-check entries." | **Interpreted.** "The record's existing §6.3 evidence-check entries" is read as **the §6.3 entries of the facilitator/analyst-side record, which are the Companion's entries** (§7–§10). The text of F1-D is not edited. | [PRODUCT-OWNER CHOICE] |

**Remaining contradiction, stated explicitly.** [GOVERNANCE FACT] The word "existing" in F1-D §8
is factually wrong: no §6.3 entries existed when F1-D was written, and none exist now. This
decision does not make that word true. It supplies the entries F1-D presupposed and says where
they are. F1-D's text therefore stays inaccurate as a historical statement.

**Precedence.** [PRODUCT-OWNER CHOICE] Where F1-D §8's second sentence and this decision
differ **on recording location only**, this decision governs. F1-D governs everything else,
including the structural/substantive split, the accept/reject criteria and segment
classification.

---

### 7. Required Recording Semantics

**7.1 Scope of what is recorded.** [PRODUCT-OWNER CHOICE]
- The Companion records one row for **every segment** of **every determination reviewed** in the session. This covers MATCH, MISMATCH and UNKNOWN segments, and every Opportunity reviewed, including both Searches of the cross-Search scenario.
- "Reviewed" means the determination was examined for any D11 purpose in that session.
- Segments are recorded in stored order. Segment index = position in the stored `segment_results`, starting at 1.

**7.2 General rules.** [PRODUCT-OWNER CHOICE]
1. **Stored values are transcribed, not derived.** Classification, confidence and basis are copied from the persisted row as the system stored them. Deriving classification from `fit` is not recording it (A-12 Audit §12).
2. **Findings are separate from stored values.** The facilitator's substantive finding goes in its own column. It must never be filled by copying the stored classification.
3. **No blank means pass.** An empty result cell is an unrecorded check, not a pass.
4. **No fabrication.** Values are recorded only from live-session observation of the persisted row and its source. Nothing is pre-populated from repository expectations.
5. **Verbatim.** Quotes, URLs, labels and rationale are recorded exactly as stored.

**7.3 Mandatory linkage to the D11-H record.** [PRODUCT-OWNER CHOICE]

Every Companion row must carry all of these keys:

| Key | Matches D11-H |
|---|---|
| Session ID | §1 "Session ID" |
| Opportunity ID | §19 "Opportunity ID"; the D11-H correlation key with the participant template |
| Search ID | §3 "Search ID" (and §17 Search A/B) |
| Prospect ID | §3 "Prospect ID" (and §17 Prospect A/B) |
| Determination identifier | The persisted determination row's identifier, plus its timestamp as recorded in D11-H §16 |
| Segment index and segment text | §8 "#" and "Segment", where the determination is the one recorded in §8 |

Linkage rules:
- A Companion row whose keys do not resolve to the D11-H record for the same Session ID is invalid.
- The D11-H record for the session must name the Companion in its existing §22 "Outstanding mandatory items" or "New findings" field. This uses an existing field. It is not a template change.
- The D11-H record is not otherwise required to reference the Companion.

---

### 8. §6.3 Structural Check Recording

[LOCKED F1 DECISION] The structural part is mechanical. It checks that `confidence` and
`basis` are populated, that the row meets F-1 §14 rule 5, and that no segment carries
`INFERRED` or any other value. It is expected always to pass. A failure indicates an
implementation defect (F1-D §8 part 1).

[PRODUCT-OWNER CHOICE] The Companion records, **per segment**:

| Column | Content |
|---|---|
| Stored fit | `MATCH` / `MISMATCH` / `UNKNOWN`, as stored |
| Stored classification | Transcribed value, or `ABSENT` |
| Stored confidence | Transcribed value, or `ABSENT` |
| Stored basis | Transcribed value, or `ABSENT` |
| Evidence count | Number of stored `evidence[]` entries |
| Structural result | `PASS` / `FAIL` |
| Structural failure reason | Required when `FAIL`. Names the violated condition. |

`PASS` requires all of:
- classification ∈ {`OBSERVED`, `UNKNOWN`};
- confidence and basis populated;
- `OBSERVED` ⇔ MATCH/MISMATCH ⇔ `CITED_SOURCE_EVIDENCE` ⇔ confidence 1–100 ⇔ evidence count ≥ 1;
- `UNKNOWN` ⇔ UNKNOWN ⇔ basis ∈ {`MODEL_REPORTED_INSUFFICIENT_EVIDENCE`, `NO_MODEL_VERDICT`} ⇔ confidence 0 ⇔ evidence count 0.

**Per session** the Companion records:
- **Structural §6.3 session result:** `PASS` only if every validation-valid segment row is `PASS`; otherwise `FAIL`.
- Any `FAIL` is also recorded as an implementation-defect finding.

---

### 9. §6.3 Substantive Check Recording

[LOCKED F1 DECISION] For each reviewed MATCH/MISMATCH segment, the facilitator reads the cited
quotes in their source, together with the rationale, and decides **without relying on the
stored label** whether the verdict is OBSERVED in substance or INFERRED in substance (F1-D §8
part 2; F1-D §5 conditions b–d).

[PRODUCT-OWNER CHOICE] The Companion records, **per MATCH/MISMATCH segment**:

| Column | Content |
|---|---|
| Cited evidence | For each `evidence[]` entry: `sourceUrl`, `sourceLabel`, `sourceQuote`, verbatim |
| Rationale | Stored rationale, verbatim |
| Source read | How the facilitator read the quotes in context (the live source, or a captured copy), with its date/time |
| Substantive finding | `ACCEPT — OBSERVED IN SUBSTANCE` / `REJECT — INFERRED IN SUBSTANCE` / `NOT ASSESSABLE` |
| Grounding statement | Required for `ACCEPT`: which quote(s), by evidence index, state the verdict or contain every premise for it |
| Uncited premise | Required for `REJECT`: the premise the verdict needs that no cited quote contains (for example an uncited rationale fact, the business name, category knowledge, or absence of mention for a MISMATCH) |
| Not-assessable reason | Required for `NOT ASSESSABLE`: why the reading could not be done (for example the source no longer shows the quoted text; see A-11) |

**Rules that keep §6.3 substantive, not tautological.**
1. The finding must rest on the grounding statement or the uncited premise. A finding whose only stated reason is the stored `OBSERVED` label, `CITED_SOURCE_EVIDENCE`, the confidence value, or the fact that code verification passed is **invalid**, and the row counts as unrecorded.
2. `ACCEPT` without a grounding statement, or `REJECT` without a named uncited premise, is invalid.
3. Directness is not a criterion (F1-D §8). Both direct and premise-containing quotes are `ACCEPT`.
4. A `REJECT` is "a §6.3 failure for that segment" (F1-D §8; Correction §6).
5. `NOT ASSESSABLE` is **not** a pass. It records that the mandatory check could not be performed for that segment.
6. The finding values are facilitator judgments. They are not stored values, not a segment classification, and not a ResearchSignal classification. The words OBSERVED and INFERRED in them carry the F1-D §8 "in substance" sense only.

**Per session** the Companion records:
- **Substantive §6.3 session result:**
  - `PASS` only if every validation-valid MATCH/MISMATCH segment is `ACCEPT`;
  - `FAIL` if any is `REJECT`;
  - otherwise `INCOMPLETE`.

---

### 10. Per-Segment Recording Rule

[PRODUCT-OWNER CHOICE]

| Stored fit | Structural columns (§8) | Substantive columns (§9) | UNKNOWN columns (§14) |
|---|---|---|---|
| MATCH | Required | Required | — |
| MISMATCH | Required | Required | — |
| UNKNOWN | Required | Not applicable; recorded as `N/A — UNKNOWN` | Required |

**Per-segment accept/reject is recorded in the Companion's "Substantive finding" column.**
- It is recorded nowhere else authoritatively.
- The session-level accept/reject stays the D11-H §22 "Final D11 validation disposition", which is unchanged.

**Relationship between the two levels.** [PRODUCT-OWNER CHOICE, derived from [LOCKED D11 REQUIREMENT] "MANDATORY, per validation session"]
- The overall §6.3 session result is:
  - `PASS` when the structural and substantive session results are both `PASS`;
  - `FAIL` when either is `FAIL`;
  - otherwise `INCOMPLETE`.
- The D11-H §22 disposition may not be `PASS` unless the overall §6.3 session result is `PASS`.
- A `FAIL` or `INCOMPLETE` must be listed in D11-H §22 "Outstanding mandatory items" with a reference to the Companion rows.
- This decision does not decide whether such a session is `NOT READY` or `INCONCLUSIVE`. That remains the facilitator's D11-H judgment.

---

### 11. Relationship to F1-A (Confidence)

- [LOCKED F1 DECISION] F1-A: MATCH/MISMATCH confidence 1–100; UNKNOWN confidence 0; the INFERRED ≤ 80 cap does not apply "because segments are never INFERRED".
- [PRODUCT-OWNER CHOICE] The stored confidence value is transcribed per segment (§8). It is checked only structurally: populated and in the range its fit requires.
- The facilitator does **not** judge whether the value is well calibrated. Calibration is an F1-D non-decision (N-1).
- A `REJECT` finding makes confidence ≥ 1 inconsistent with the evidence actually cited (F1-D §8). That inconsistency is carried by the `REJECT`, not by a separate confidence finding.

### 12. Relationship to F1-B (Basis)

- [LOCKED F1 DECISION] F1-B: `basis` is code-assigned and closed: `CITED_SOURCE_EVIDENCE`, `MODEL_REPORTED_INSUFFICIENT_EVIDENCE`, `NO_MODEL_VERDICT`. It does not carry the ResearchSignal INFERRED meaning.
- [PRODUCT-OWNER CHOICE] The stored basis is transcribed per segment and checked structurally (§8).
- `CITED_SOURCE_EVIDENCE` records that code verification of the quotes passed. It is **not** evidence for the substantive finding (§9 rule 1).

### 13. Relationship to F1-D (Segment Classification)

- [LOCKED F1 DECISION] Segment classification is feature-local, code-derived, and two-valued:
  - `OBSERVED` = the MATCH/MISMATCH verdict is grounded in cited, verified evidence;
  - `UNKNOWN` = no MATCH/MISMATCH verdict (insufficient evidence, or the applicable UNKNOWN condition).
- [LOCKED F1 DECISION] `INFERRED` is not permitted for segment classification. This rests on F1-D §7 and the Correction, which superseded the F-1 §9 D3-based justification. **It is not a D3 prohibition.**
- [PRODUCT-OWNER CHOICE] The Companion records the stored classification (§8) and the facilitator's substantive finding (§9) in **separate columns**.
  - `INFERRED` appears only as a structural `FAIL` value, if code ever stored it.
  - It also appears inside the facilitator finding label "INFERRED IN SUBSTANCE".
  - Neither use introduces an `INFERRED` segment classification.
- Research-signal OBSERVED / INFERRED / UNKNOWN meanings are unchanged.

### 14. Relationship to F1-E (UNKNOWN Cases)

[LOCKED F1 DECISION] F1-E distinguishes model-reported insufficiency from code-filled
`NO_MODEL_VERDICT`. `NO_MODEL_VERDICT` "**Does not count** as a D11 'genuinely insufficient
evidence' case" (F-1 §10).

[PRODUCT-OWNER CHOICE] The Companion records, **per UNKNOWN segment**:

| Column | Content |
|---|---|
| Stored basis | Transcribed (also in §8) |
| Rationale | Verbatim for `MODEL_REPORTED_INSUFFICIENT_EVIDENCE`; `null` recorded as `NULL` for `NO_MODEL_VERDICT` |
| UNKNOWN acceptance | `ACCEPT` / `REJECT`, against the F1-D §8 UNKNOWN rows. Model-reported: evidence empty, confidence 0, rationale present. `NO_MODEL_VERDICT`: structurally valid per F-1 §10. |
| Counts toward D11 UNKNOWN coverage | `YES` only for an accepted `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` segment; `NO` for `NO_MODEL_VERDICT` |

- The genuineness judgment for the D11 UNKNOWN case stays in D11-H §9, unchanged.
- The Companion supplies the basis that D11-H §9 cannot record.
- A D11-H §9 UNKNOWN case must reference its Companion row. If that row's basis is `NO_MODEL_VERDICT`, the case does not satisfy D11 UNKNOWN coverage.

### 15. Legacy / F1-F Handling

[LOCKED F1 DECISION] F-1 §11 item 5: "only determinations created after the F-1
implementation, with complete fields, are validation-valid. Legacy rows may not be used to
satisfy any D11 coverage item, evidence check, or spot-check."

[PRODUCT-OWNER CHOICE] The Companion records, **per determination**:
- **Validation-valid:** `YES` / `NO`.
- **Reason when `NO`:** for example, a legacy row lacking `basis`, incomplete fields, or created before F-1 implementation.

For a `NO` determination:
- its segment rows are still recorded, marked `EXCLUDED — NOT VALIDATION-VALID`, and not silently dropped;
- they are excluded from every §6.3 session result and from D11 coverage;
- absent stored fields are transcribed as `ABSENT` and never filled in.

### 16. Relationship to D11 §6.1

- [LOCKED D11 REQUIREMENT] §6.1: every OBSERVED claim underlying a reviewed MATCH/MISMATCH has ≥1 `evidence[]` entry with a real `sourceUrl` and a verbatim `sourceQuote`.
- [LOCKED F1 DECISION] F1-D §8 applies this to each MATCH/MISMATCH segment.
- [PRODUCT-OWNER CHOICE] §6.1 is **not** part of A-12, and its recording location is unchanged: D11-H §8 "Evidence" (free text, per the A-12 Audit §15).
- The Companion's §9 "Cited evidence" column carries the same entries verbatim for §6.3 purposes. A facilitator may cite the Companion as corroboration for §6.1. This decision does not move §6.1 or declare the Companion authoritative for it.

### 17. Relationship to D11 §6.4

- [LOCKED D11 REQUIREMENT] §6.4: at least one OBSERVED claim per session independently verified against the actual fetched source by a technical reviewer.
- [GOVERNANCE FACT] §6.4 remains explicitly recordable in D11-H §12. Its recording location is unchanged.
- [PRODUCT-OWNER CHOICE] If the reviewer also performs the §6.3 substantive reading on the spot-checked segment (F1-D §8 allows this), that finding is recorded in the **Companion** row for that segment. The Companion row notes "§6.4 spot-checked: see D11-H §12".
- D11-H §12 "Evidence supports stated determination" remains a §6.4/D11-E field. It is **not** a §6.3 result, and §6.4 is not expanded.
- [OPEN QUESTION — separate item, not A-12] The Readiness Audit §7 spot-check list (label, classification, rationale) versus D11-H §12 is not reconciled here (Preparation Q8).

---

### 18. Whether the Existing D11-H Record Is Sufficient

```text
EXISTING D11-H RECORD, AS-IS, FOR D11 §6.3: NOT SUFFICIENT
```

- [GOVERNANCE FACT] It cannot record, in any designated field: stored classification, confidence or basis; the structural result; the per-segment substantive finding; the UNKNOWN basis; or F1-F validity (A-12 Audit §9, §25).
- [PRODUCT-OWNER CHOICE] Free text in D11-H (§8 cells, §12 notes, §21 "Facilitator assessment", §22 fields) is **not** an authoritative §6.3 record under this decision. It may refer to the Companion. It may not substitute for it.
- [PRODUCT-OWNER CHOICE] The D11-H record **remains sufficient and unchanged** for everything else it already holds, including §6.1 (free text), §6.2 (§13), §6.4 (§12), the §9 genuineness judgment, and the §22 session disposition.
- Together with a Companion conforming to §7–§15, the facilitator/analyst-side record **is** sufficient for §6.3. It becomes so only once the Companion exists and has passed the conformance check in §19.

---

### 19. Whether Any Documentation Correction Is Required

| Document | Change required? | Status |
|---|---|---|
| D0–D11 | **No.** | Immutable |
| D11-H Facilitator Observation Record | **No template change.** The only D11-H-side obligation is the §7.3 cross-reference, written into an existing §22 field during the session. | Unchanged |
| F1-D | **No text correction required.** §8's second sentence is interpreted by §6 of this decision, which governs recording location. The inaccuracy of "existing" is recorded (§6), not corrected. | Unchanged |
| **D11 §6.3 Companion Record** | **Required: a new instrument.** It must implement §7–§15 exactly, with blank live-value cells and no pre-populated outcomes. | **FOLLOW-UP — requires separate Product Owner authorization to create** |
| A-12 closure | **Required: a read-only conformance check** of the created Companion against this decision. A-12 is CLOSED only when that check finds it conforming. | **FOLLOW-UP** |
| F1-D §8 erratum, or a D11-H pointer to the Companion | **Not required.** Either may be proposed later as a separate, explicitly authorized act. | Optional |

### 20. Implementation Authorization Status

```text
F-1 IMPLEMENTATION ........ NOT AUTHORIZED
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

- [PRODUCT-OWNER CHOICE] This is a documentation/governance decision. It authorizes no code, test, schema, migration, UI, provider, worker, PRD or configuration change.
- A-12 creates no implementation requirement. The Companion is a governance instrument, not software.
- This decision does not authorize creating the Companion (§19). That is a separate documentation authorization.

### 21. Effect on D11 Live-Validation Readiness

```text
D11 LIVE VALIDATION: NOT READY FOR LIVE VALIDATION
```

- [GOVERNANCE FACT] A-12's *decision* is made. Its *recording obstacle* is removed only once the Companion exists and passes its conformance check (§19). Until then, §6.3 still cannot be recorded as required.
- [GOVERNANCE FACT] Readiness also depends on independent prerequisites that this decision does not affect (Preparation §20; A-12 Audit §19, §22):
  - F-1 implementation (not authorized, not implemented);
  - D11-I provider funding;
  - A-11 source-page preservation. This bears directly on §9: without captured source text, substantive findings may be `NOT ASSESSABLE`.
  - A-14 D11-F structured-output translation tests;
  - runtime and participant prerequisites (Gate Audit §11).
- D11 stays NOT READY FOR LIVE VALIDATION until **every** independent prerequisite is met **and** A-12 is closed.

### 22. Explicit Non-Authorizations

This decision does **not** authorize:
- any code, test, schema, migration, UI, provider, worker, PRD or configuration change;
- F-1 implementation;
- creation of the Companion record (a separate follow-up authorization);
- any change to the D11-H record template, F1-D, the Correction, F-1, D11 or any other existing governance document;
- any change to `MVP_REAL_USER_VALIDATION_TEMPLATE.md`;
- any change to research-signal OBSERVED / INFERRED / UNKNOWN meaning, `isEvidentiary()`, or any ResearchSignal field;
- any `INFERRED` segment classification, or any automated "directness" or "INFERRED-in-substance" detector (F1-D §11.4);
- scheduling or starting a D11 session, or any live API, provider or database call;
- resolution of A-11, A-14, D11-I, N-1, N-5 or the Readiness §7 / D11-H §12 discrepancy.

### 23. Open Questions

| # | Question | Blocking? |
|---|---|---|
| OQ-1 | Authorization, author and timing for creating the Companion record (§19) | **Yes, for A-12 closure** |
| OQ-2 | D11 does not expressly state that a facilitator-side record may span two documents. This decision reads D11-H as permitting it (§5). | No |
| OQ-3 | Whether to add, later and separately, an F1-D §8 erratum or a D11-H pointer to the Companion (§19) | No |
| OQ-4 | Readiness Audit §7 versus D11-H §12 spot-check field discrepancy (Preparation Q8) | No for A-12; separate item |
| OQ-5 | A-11: whether captured source text will exist, which decides how often §9 findings can be made rather than `NOT ASSESSABLE` | No for A-12; independent live-validation prerequisite |

**Preparation §23 decision fields, answered.**

```text
Selected option ............ C — Companion §6.3 record
Q1 free text sufficient .... No (§18)
Q2 separate recording ...... Yes: structural (§8) and substantive (§9), per segment and per session
Q3 conf/basis/class/rationale  Stored values transcribed per segment; rationale verbatim (§8, §9, §14)
Q4 accept/reject location .. Per segment: Companion "Substantive finding" (and UNKNOWN acceptance);
                             per session: D11-H §22 disposition, constrained by §10
Q5 companion authoritative . Yes — sole authoritative §6.3 location (§2, §5)
Q6 F1-D §8 treatment ....... Sentence 1 left as is and honoured; sentence 2 interpreted (§6)
Q7 minimum reconstruction .. Keys (§7.3) + stored values (§8) + cited evidence and rationale
                             verbatim + source read + finding with grounding / uncited premise (§9)
Q8 Readiness §7 / D11-H §12  Out of scope (OQ-4)
Authority to modify D11-H .. Not granted (not needed under Option C)
```

### 24. Final Decision Statement

The Product Owner resolves A-12 by selecting **Option C**.
- D11 §6.3 results for category-plausibility segments are recorded in a separate,
  facilitator/analyst-side D11 §6.3 Companion Record. It is linked to the unchanged D11-H record
  by Session ID, Opportunity ID, Search ID, Prospect ID, determination identifier and segment
  index. Together the two form the facilitator/analyst-side record that D11-H requires.
- For every segment of every validation-valid reviewed determination, the facilitator records:
  - the stored classification, confidence and basis, transcribed;
  - a structural result;
  - for MATCH/MISMATCH: the cited evidence and rationale verbatim, the source read, and an independent substantive finding (`ACCEPT`, `REJECT` or `NOT ASSESSABLE`), supported by a grounding statement or a named uncited premise and never by the stored label;
  - for UNKNOWN: the basis, its acceptance, and whether it counts toward D11 UNKNOWN coverage.
- A `REJECT` is a §6.3 failure for that segment. The D11-H §22 disposition may not be `PASS` unless both §6.3 session results are `PASS`.
- The existing D11-H record is **not sufficient as-is** for §6.3. It is **not amended**. F1-D §8's "no field, column or template change" is honoured. Its "existing §6.3 evidence-check entries" is interpreted as the Companion's entries, and the inaccuracy of "existing" is recorded, not hidden.
- D0–D11 are unchanged. Segment classification stays F1-D's feature-local `OBSERVED | UNKNOWN`, with `INFERRED` excluded by F1-D and the Correction, not by D3. Research-signal semantics are unchanged.
- **Required follow-up:** separately authorized creation of the Companion record, then a read-only conformance check. A-12 closes only on that check.

```text
A-12 ...................... DECIDED — OPTION C; CLOSURE PENDING COMPANION RECORD
F-1 IMPLEMENTATION ........ NOT AUTHORIZED
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
D11 LIVE VALIDATION ....... NOT READY FOR LIVE VALIDATION
```

---

### 25. Repository Safety

**Before:**

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28
Staged .................... none
git status --short ........ 110 lines
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31
git diff --check .......... clean
Untracked files hashed .... 62 (stored outside the repository)
Target file ............... absent
```

**After:** see the task's closing verification. The expected result is: HEAD unchanged, nothing
staged, the diff SHA-1 identical, `git diff --check` clean, all 62 pre-existing untracked
files byte-identical, and `git status --short` at 111 lines (this document only). Commit/push:
none. Tests, API, provider and database calls: 0.

## STOP
