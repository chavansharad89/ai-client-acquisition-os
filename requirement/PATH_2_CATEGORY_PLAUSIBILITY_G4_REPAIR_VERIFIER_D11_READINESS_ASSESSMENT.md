# Path 2 — Category Plausibility

## G-4 — Repair / Verifier Messaging — D11 Readiness Assessment

**Assessment ID:** G4-D11-ASSESS-001
**Disposition:** **FOLLOW-UP / NON-BLOCKING**
**Authority granted by this record:** NONE
**Source finding:** `PATH_2_CATEGORY_PLAUSIBILITY_F1_IMPLEMENTATION_CONFORMANCE_AUDIT.md` (F1-IMPL-AUDIT-001), G-4 row
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
G-4 ....................... FOLLOW-UP / NON-BLOCKING (this assessment)
G-7 ....................... DECIDED (G7-PO-DEC-001) / SATISFIED (G7-CONF-001)
G-6 ....................... DECIDED (G6-PO-DEC-001)
P4 ........................ DECIDED (P4-PO-DEC-001)
D11 ....................... NOT READY FOR LIVE VALIDATION
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
```

This is an assessment, not a Product Owner decision. It changes no code, test, prompt, message,
schema, determination, or existing governance record.

It independently re-verifies the G-4 row of
`PATH_2_CATEGORY_PLAUSIBILITY_F1_OPEN_GAP_D11_READINESS_ASSESSMENT.md` (F1-GAP-D11-ASSESS-001).
That record reached the same disposition. It is also an assessment and is not treated as authority.

---

### A. Authority

| Record | Type | Used for |
|---|---|---|
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` (F-1) | **Product decision** | §8, §10, §13, §14, §19 |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` (F1-D) | **Product Owner decision** | §7, §11.3, §12 |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_D3_INFERRED_CORRECTION.md` | Correction record | Searched; no repair or verifier wording provision |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md` (D11) | **Product decision** | §3 items 5–6, §6, §7, §10 |
| `PATH_2_CATEGORY_PLAUSIBILITY_D11_FACILITATOR_OBSERVATION_RECORD.md` (D11-H) | Facilitator record | Lines 200, 453 |
| G6-PO-DEC-001, P4-PO-DEC-001, G7-PO-DEC-001 | **Product Owner decisions** | Searched; none governs repair or verifier wording |
| VS-PO-DEC-001 | Product Owner decision record, **pending** | Searched; no repair or verifier provision |
| F1-IMPL-AUDIT-001, F1-GAP-D11-ASSESS-001, Consolidated Conformance Audit (A-6), Gate Audit, Readiness Audit | **Audits / assessments** | Findings only; no decision authority |

Every record listed exists in the repository. None was missing.

---

### B. Question

G-4 (F1-IMPL-AUDIT-001) states that verifier and repair messages do not explicitly tell the model
the F-1 UNKNOWN requirements. A model-returned UNKNOWN needs a non-null `rationale` and
`confidence = 0` (F-1 §14 rule 3).

This record answers three separate questions:

- **A. Contract conformance:** does the implementation enforce the F-1 segment contract?
- **B. Repair convergence:** does the repair wording give the model enough to fix an invalid
  segment without extra rounds?
- **C. D11 readiness:** does an authoritative record require that wording before a D11 session
  can be scheduled?

---

### C. Current Implementation (read-only inspection)

#### C.1 Components

| Component | Location | Behavior |
|---|---|---|
| Segment schema | `schema.ts` `categorySegmentSchema` `superRefine` | Rejects a null `rationale` for any verdict. For UNKNOWN: "UNKNOWN requires a rationale stating what evidence was absent or insufficient for this segment". Rejects UNKNOWN with evidence ("UNKNOWN cannot have evidence") and UNKNOWN with `confidence ≠ 0` ("UNKNOWN must have confidence 0"). Rejects MATCH/MISMATCH with `confidence < 1` ("… requires a confidence between 1 and 100") or no evidence. Base checks: `confidence` is a required integer from 0 to 100. |
| Verifier | `categoryPlausibility.ts:93–178` `verifyCategoryPlausibility` | Runs only after the schema parse succeeds, and skips UNKNOWN entries. For MATCH/MISMATCH, three messages end "classify this segment UNKNOWN": short quote (line 146), no sources supplied (line 159), non-verbatim quote (lines 170–173). None mentions `rationale` or `confidence 0`. A foreign `sourceUrl` gets no UNKNOWN hint. |
| Repair loop | `researcher.ts:204–313` | A schema failure goes through `fromZodIssues` (`repair.ts:153`), which passes each Zod message through **unchanged**. A verifier failure goes through `fromProvenanceIssues`. `planRepair` targets the failing segment, because `categoryPlausibility` is in `OBSERVATION_LISTS` (`repair.ts:43–51`). Default `maxAttempts` is 3: the first call plus up to 2 repairs. Exhaustion throws `ResearchValidationError`. |
| Repair message | `prompt.ts:117–175` `buildTargetedRepairMessage` | Lists each failing path and message, the current content of those paths, and the sources when evidence is involved. Fixed footer (line 158): "If you cannot copy the quote, the claim is INFERRED or UNKNOWN." |
| System prompt | `prompt.ts:31`; sent on **every** round (`researcher.ts:213`) | States that every entry needs a one-sentence "rationale", and for UNKNOWN "what evidence was absent or insufficient". Also states confidence is "exactly 0 for UNKNOWN". |
| Generic repair message | `prompt.ts:81–87` `buildRepairMessage` (contains "INFERRED or UNKNOWN") | Exported from `index.ts:25`, but **not called** by `researcher.ts` or anywhere else in the repository. It never reaches a segment repair. |
| Persistence | `service.ts:122–145` | Writes a determination only after `deps.provider.research` returns a fully validated result. A thrown validation error writes no row (F-1 §10: "Research failed … No row"). |

**Correction to prior audits:** F1-IMPL-AUDIT-001 and A-6 cite `prompt.ts:86` and `prompt.ts:158`
as both reaching segment failures. Only line 158 does. Line 86 belongs to an unused exported
function.

#### C.2 Cases

**Case A — UNKNOWN with no rationale.**

- The `superRefine` check fails with "UNKNOWN requires a rationale stating what evidence was
  absent or insufficient for this segment". That message reaches the repair prompt unchanged.
- **Rejected:** yes. **Repair requested:** yes.
- **Wording describes the requirement:** yes, for the rationale. The footer's mention of INFERRED
  is irrelevant noise.
- **Can converge:** yes. **Invalid output persisted:** no.

**Case B — UNKNOWN with a valid rationale, but confidence wrong or missing.**

- A non-zero integer fails with "UNKNOWN must have confidence 0".
- A missing, non-integer or out-of-range value fails with a generic Zod message: "Required",
  "Expected integer…" or "…less than or equal to 100".
- `superRefine` does not run until the base shape parses. So the UNKNOWN-specific message only
  appears in a later round, if one is needed.
- **Rejected:** yes. **Repair requested:** yes.
- **Wording describes the requirement:** yes for a non-zero value. For a missing or malformed
  value the message is generic, and the "exactly 0 for UNKNOWN" rule comes only from the system
  prompt.
- **Can converge:** yes. **Invalid output persisted:** no.

**Case C — MATCH or MISMATCH with invalid confidence.**

- A value of 0 fails with "requires a confidence between 1 and 100".
- A value over 100, a non-integer or a missing value fails with a generic Zod message.
- **Rejected:** yes. **Repair requested:** yes.
- **Wording describes the requirement:** yes for 0; generic otherwise.
- **Can converge:** yes. **Invalid output persisted:** no.

**Case D — repair after an invalid segment, especially a verifier-triggered downgrade.**

- The verifier tells the model to "classify this segment UNKNOWN". It does not mention the
  rationale, `confidence 0` or `evidence []`.
- If the model keeps its old confidence or evidence, the next round fails the schema with an
  explicit message. That costs one more round, and with 3 attempts the second repair may be the
  last.
- **Rejected:** yes. **Repair requested:** yes.
- **Wording describes the requirement:** incomplete in the verifier message. The requirement is
  still stated in the system prompt and, on failure, in the Zod message.
- **Can converge:** yes, within the attempt limit, but not guaranteed in one round.
- **Invalid output persisted:** no.

#### C.3 Test coverage

- **Segment rejection:** `categoryPlausibility.test.ts:212–247` covers rejection of UNKNOWN with a
  null rationale, non-zero confidence or evidence, and of invalid MATCH/MISMATCH confidence.
  **Passes.**
- **Footer pinned by a test:** `research.test.ts:289` pins the footer text "INFERRED or UNKNOWN"
  for an Observation repair. A future wording change must update this test.
- **No segment repair-round test:** no test runs a repair round on a `categoryPlausibility`
  segment, and `research.test.ts` never references `categoryPlausibility`. The Case D convergence
  behavior is untested.

---

### D. Contract Analysis

| F-1 requirement | Source | Current implementation | Conformance |
|---|---|---|---|
| Model UNKNOWN: `rationale` non-null, 1–400 characters | F-1 §8, §10, §14.3 | `superRefine` + `.min(1).max(400)` | **CONFORMS** |
| Model UNKNOWN: `confidence = 0` | F-1 §13, §14.3 | `superRefine` | **CONFORMS** |
| Model UNKNOWN: `evidence = []` | F-1 §10, §14.3 | `superRefine` | **CONFORMS** |
| MATCH/MISMATCH: `confidence` integer 1–100 | F-1 §13, §14.2 | Base schema + `superRefine` | **CONFORMS** |
| A violation goes to repair | F-1 §14.2, §14.3 | Zod and verifier failures both feed the repair loop | **CONFORMS** |
| Repair-loop mechanics unchanged | F-1 §14.6 | Loop, attempt limit and merge logic unchanged | **CONFORMS** |
| A verification failure downgraded to UNKNOWN in repair is recorded as a model-reported UNKNOWN with rationale | F-1 §10 row 2 | The model performs the downgrade. The schema forces rationale, `confidence 0` and `evidence []` before acceptance. | **CONFORMS** (outcome enforced) |
| Research failed (repair exhausted): no row | F-1 §10 | `ResearchValidationError`; nothing persisted | **CONFORMS** |
| The shared prompt conveys the MATCH/MISMATCH quote obligation | F1-D §11.3 | `prompt.ts:31` | **CONFORMS** |
| Specific repair or verifier message wording | — | Not specified by F-1. F1-D §12 explicitly leaves "prompt wording beyond the constraint in §11.3" undecided. | **NO REQUIREMENT** |

**Answer to A — contract conformance:** the implementation enforces the F-1 segment contract. No
invalid UNKNOWN and no invalid confidence can be accepted or persisted.

**Answer to B — repair convergence:** the wording is imperfect in three ways:

- The verifier's "classify this segment UNKNOWN" leaves out the rationale, `confidence 0` and
  `evidence []` obligations.
- The targeted footer still mentions INFERRED, which segments cannot use (F1-D §7).
- Missing or malformed values get generic Zod messages.

The effect is possible extra repair rounds, not wrong output.

---

### E. D11 Readiness Analysis

> **Is G-4 an authoritative precondition to scheduling a D11 validation session?**
> **No.**

| D11 provision | What it requires | Does it govern wording? |
|---|---|---|
| §3 item 5 | At least one UNKNOWN observed with recorded insufficiency reasoning | No. It is an observed outcome, and F-1 §10 makes the rationale mandatory at schema level. |
| §3 item 6 | The provenance-equivalent mechanism is confirmed to have "rejected/repaired a would-be fabricated claim" | No. It concerns the outcome and "does not mandate which code path performs the check". |
| §6 | Evidence presence, confidence and basis population, one spot-check per session | No. |
| §7 | Provider neutrality; adapter translation tests (G-7) | No. |
| §10.1 | Environment readiness (a funded provider), the scheduling precondition | No. |
| §10.2 | A schema-valid result within a session | No. It is an observed fact within a session, not a precondition to scheduling. |
| D11-H lines 200, 453 | Invalid results are rejected and repaired, not persisted | No. It is met by the current behavior. |

No text in F-1, F1-D, D11, D11-H, G6-PO-DEC-001, P4-PO-DEC-001, G7-PO-DEC-001 or VS-PO-DEC-001
makes repair or verifier wording a readiness gate.

The only records naming this issue are audits and assessments:

- F1-IMPL-AUDIT-001, G-4 row;
- the Consolidated Audit, A-6 ("Blocking? No");
- F1-GAP-D11-ASSESS-001.

None has decision authority, and none classes it as blocking. The records do not conflict, so no
Product Owner ruling is needed.

**Residual operational risk:** extra repair rounds may use up the 3-attempt limit. That lowers the
chance of meeting D11 §10.2 (a schema-valid result within a session) in a given session. This is
a session-yield risk, not an unmet precondition.

---

### F. Disposition

```text
G-4 — FOLLOW-UP / NON-BLOCKING
```

**What is imperfect:**

- Verifier downgrade messages leave out the UNKNOWN obligations.
- The repair footer mentions INFERRED.
- The Case D convergence path is untested.

**Why it does not violate the contract:** F-1 fixes the segment outcome, not the repair wording.
The schema enforces every §14.3 obligation before a result is accepted, and F1-D §12 leaves the
wording undecided.

**Why it does not block D11 scheduling:** no D11 provision and no Product Owner decision makes
repair wording a precondition. D11 §3.6 and §10.2 govern observed outcomes, not message text.

**Useful future improvements:**

- a segment-aware verifier message: "UNKNOWN with a rationale, `evidence: []`, `confidence: 0`";
- a segment-appropriate footer that does not mention INFERRED;
- a `researchLead` test covering a segment repair round, including a verifier-triggered downgrade.

---

### G. Future Implementation Authorization

Not required for D11 readiness. If the improvement is pursued, a separate explicit authorization
must cover at least:

- verifier message wording in `categoryPlausibility.ts` (lines 146, 159, 170–173);
- the targeted repair footer in `prompt.ts:158`, keeping the Observation wording correct for
  Observation failures;
- the test that pins the footer (`research.test.ts:289`);
- a new segment repair-round test in `research.test.ts`;
- confirmation that the change is prompt and message wording only, under D9's single shared
  prompt, with no schema, adapter or provider change.

Nothing is implemented by this record.

---

### H. Safety / Authority

- No F-1 code changed.
- No tests changed.
- No prompt, verifier or repair message changed.
- No D11 status changed. D11 remains **NOT READY FOR LIVE VALIDATION**.
- No determination created.
- No provider called.
- No live source fetched.
- No participant session.
- No E1, E2 or E3 activity.
- No A-11 closure.
- No G-4, G-6, G-7, P4, A-11, D11-H, Companion Record or VS-PO-DEC-001 record modified.
- No `.env` or credential file read.
- No Docker, Postgres, build, integration test or web typecheck run.

**Command run:** `npx vitest run src/categoryPlausibility.test.ts src/research.test.ts` in
`packages/core-research`. Result: 2 files, 137 tests passed. These are unit tests only, with no
database or network.

**Repository state:**

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Staged .................... none
Tracked diff sha1 ......... aeb3338ea2887bb826211d1e73ae82ac4066ff31 (before and after)
apps/web/tsconfig.tsbuildinfo  sha256 1834209e…de71d09 (unchanged, pre-existing change)
Only new path ............. this record
```

## STOP
