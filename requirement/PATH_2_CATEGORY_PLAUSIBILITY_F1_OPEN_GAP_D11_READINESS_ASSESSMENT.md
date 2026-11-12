# Path 2 — Category Plausibility

## F-1 Open-Gap Disposition — D11 Readiness Assessment (Read-Only)

```text
G-4 ...... FOLLOW-UP / NON-BLOCKING
G-6 ...... UNRESOLVED — GOVERNANCE RULING REQUIRED (zero-segment VALID status)
G-7 ...... UNRESOLVED — GOVERNANCE RULING REQUIRED (the precondition is explicit; whether current evidence meets it is not)
G-9 ...... NOT REQUIRED BEFORE D11 (mandatory inside D11 validation, D11-B)
D11 ...... NOT READY FOR LIVE VALIDATION (unchanged)
```

---

### 1. Assessment Identity

| Item | Value |
|---|---|
| Assessment ID | F1-GAP-D11-ASSESS-001 |
| Date | 2026-09-27 |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Scope | Read-only disposition of the four open gaps in F1-IMPL-AUDIT-001 (G-4, G-6, G-7, G-9) against D11 readiness |

The only repository change is the creation of this file.

**Source records, in the order read:**

| # | Record | sha256 (first 16) |
|---|---|---|
| 1 | `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` (F-1) | `ba4e6a73ef73fc3e` |
| 2 | `PATH_2_CATEGORY_PLAUSIBILITY_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` (F1-D) | `2ae21352d2d64715` |
| 2 | `PATH_2_CATEGORY_PLAUSIBILITY_F1_D3_INFERRED_CORRECTION.md` | `5233826fcf47c32d` |
| 3 | `PATH_2_CATEGORY_PLAUSIBILITY_F1_IMPLEMENTATION_CONFORMANCE_AUDIT.md` (F1-IMPL-AUDIT-001) | `0ce6b8bf7fff5d50` |
| 4 | `PATH_2_CATEGORY_PLAUSIBILITY_P4_DETERMINATION_ELIGIBILITY_PRODUCT_OWNER_DECISION.md` (P4-PO-DEC-001) | unchanged per manifest |
| 5 | `PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md` (D11) §3, §4, §6, §7, §10, §11 | unchanged per manifest |
| 5 | `PATH_2_CATEGORY_PLAUSIBILITY_D11_LIVE_VALIDATION_GATE_AUDIT.md` (Gate Audit) §8, §11, §13 | unchanged per manifest |
| 5 | `PATH_2_CATEGORY_PLAUSIBILITY_D11_VALIDATION_READINESS_AUDIT.md` (Readiness Audit) | unchanged per manifest |
| 6 | `PATH_2_CATEGORY_PLAUSIBILITY_VALIDATION_SESSION_PRODUCT_OWNER_DECISION.md` (VS-PO-DEC-001) §4 | unchanged per manifest |
| 6 | `PATH_2_CATEGORY_PLAUSIBILITY_A12_SECTION_6_3_COMPANION_RECORD.md` (Companion) §2, §5, §6 | unchanged per manifest |
| — | F-1 Consolidated Conformance Audit §18; F-1 Conformance Review N-5 | read in the implementation session; unchanged |

Code was inspected read-only for evidence only. No command was run other than hashing and git
inspection. No test, typecheck, browser or provider was run.

---

### 2. Gap-by-Gap Disposition

| Gap | Contract requirement | D11 requirement | Evidence | D11 prerequisite? | Disposition |
|---|---|---|---|---|---|
| **G-4** Repair / verifier messaging | F-1 §14 rule 3 (a model UNKNOWN needs a non-null rationale and confidence 0). F-1 fixes no repair or verifier wording. F1-D §12 explicitly leaves prompt wording beyond §11.3 undecided. The Consolidated Audit lists A-6 (this issue) as "Blocking? No". | D11 §3.6: a fabricated claim must be observed rejected or repaired. D11 §10.2: a schema-valid result must be produced within the session. Neither governs message wording. | Rule 3 is enforced by `categorySegmentSchema.superRefine`, whose own message states the UNKNOWN-rationale requirement and reaches the repair loop (`researcher.ts` `fromZodIssues`). No invalid UNKNOWN can be persisted. The gap is limited to the verifier and repair-footer wording (`categoryPlausibility.ts:146, 159`; `prompt.ts:86, 158`). | **No.** No record makes it one. The residual risk is operational: extra repair rounds or exhausted attempts could lower the chance of D11 §10.2 being met in a session. | **FOLLOW-UP / NON-BLOCKING** |
| **G-6** Determination-level completeness | F-1 §11.1 defines legacy by segment objects ("segment objects lack `basis`"). §11.5: "determinations created after the F-1 implementation, with complete fields". §10: zero segments → `segment_results = []`, aggregate UNKNOWN, "nothing per segment to record". F-1 Review N-5: the validation status of a zero-segment row is "formally undefined". | No D11 or Gate Audit item requires a whole-determination completeness check. VS-PO-DEC-001 §4 P4 (now decided) and the Companion §2 register assign `VALID` per determination, by the facilitator. | The implemented predicate is per segment and is not called by any production code (§3). | **Not explicitly.** It becomes material through the Companion §6 vacuous-PASS path (§3). | **UNRESOLVED — GOVERNANCE RULING REQUIRED** |
| **G-7** Provider-specific structured-output tests | F-1 §16: "structured-output translation tests for every configured provider must pass for the extended segment schema before any D11 session is scheduled (D11 §7, unchanged)"; §16 lists "Anthropic, OpenAI, Gemini, and any fallback". | D11 §7: an IMPLEMENTATION REQUIREMENT: "unit/integration tests exercising the new field's schema translation across all three configured provider adapters **before** any live D11 validation session is scheduled". Gate Audit D11-F: IMPLEMENTATION PRECONDITION. | Shared JSON Schema test asserts the extended segment (`jsonSchema.test.ts`), using the same options the Anthropic and OpenAI adapters pass (`anthropicModel.ts:88`, `openAIModel.ts:116`). Gemini translation (`toGeminiSchema`) has no segment-field assertion. OpenAI and Anthropic adapter tests do not assert the segment schema. | **Yes — the precondition is explicit.** Whether current evidence satisfies it depends on a reading the records do not settle (§4). | **UNRESOLVED — GOVERNANCE RULING REQUIRED** |
| **G-9** Browser rendering | F-1 §15 defines what is rendered. It sets no verification method. | D11 §3 "End-to-end validation": UI display per D10 is "ADDITIONALLY MANDATORY for full D11 sign-off", confirmed "on a real Opportunity detail page". Gate Audit D11-B: "D10 UI rendered with real data (needed for full sign-off)" — MANDATORY (full tier). It is absent from Gate Audit §11 (scheduling prerequisites) and VS-PO-DEC-001 §4. | Code conformance to §15 established by inspection in F1-IMPL-AUDIT-001 (G-8 PASS). No render performed. | **No.** It is a component of D11 validation itself, not a precondition to readiness (§5). | **NOT REQUIRED BEFORE D11** (it remains mandatory for D11 sign-off) |

---

### 3. G-6 Special Analysis

**Segment-level completeness vs. determination-level completeness:**
- `isF1CompleteSegmentDetermination` (`categoryPlausibility.ts`) evaluates **one segment**.
- No determination-level function exists.
- The predicate is exported but called only in tests (`categoryPlausibility.test.ts`, `service.test.ts`).
- `VALID` status is not computed by code anywhere. It is assigned by the facilitator in the Companion §2 Determination Register.

**Post-F-1 provenance:**
- For a determination with ≥1 segment, the presence of `basis` / `confidence` / `classification` on its segments is positive evidence that post-F-1 code wrote it. The legacy definition (F-1 §11.1) turns on the absence of `basis`.
- A zero-segment determination carries no segment objects, so nothing in the row distinguishes pre-F-1 from post-F-1.
- No persisted post-F-1 marker exists, and no F-1-implementation cutoff timestamp is recorded. The F-1 implementation exists only as uncommitted working-tree changes on HEAD `5992b82`. So "created after the F-1 implementation" has no fixed reference point in the repository.

**Zero-segment determinations — the explicit questions:**

1. **Can a zero-segment determination currently pass the implemented F-1 completeness predicate?**
   - Not directly: the predicate takes a segment, and a zero-segment determination has none.
   - If the predicate is lifted to a determination by `segmentResults.every(isF1CompleteSegmentDetermination)`, the result is **vacuously `true`** for `[]`.
   - No production code performs that composition. The exposure lies in any future composition, and in the facilitator's reading of Companion §2.
   - Relatedly, the Companion §6 structural session result ("`PASS` only if every VALID segment in §3 is `PASS`") would also be vacuously `PASS` if the only `VALID` determination had zero segments.
2. **Does the authoritative F-1 contract prohibit that?**
   - **No.** F-1 neither prohibits nor permits it.
   - F-1 §10 records zero-segment rows as producing aggregate UNKNOWN with "nothing per segment to record".
   - F-1 Review N-5 states their validation status is "formally undefined". It concludes they "cannot satisfy any D11 coverage item", because such an UNKNOWN is "by construction", not genuine insufficiency.
3. **Does P4-PO-DEC-001 require whole-determination completeness?**
   - P4 requires **determination-level eligibility**: "The A-11 validation set must contain only determinations that are `VALID` under F-1 §11 item 5".
   - It adopts F-1 §11.5's "with complete fields" without defining completeness for a determination with no segments.
   - It does **not** require a code-level whole-determination check.
   - It does **not** address zero-segment determinations.
4. **Does any D11 gate explicitly require it?**
   - **No.** No item in D11 §3–§10, Gate Audit §11/§13, the Readiness Audit, or VS-PO-DEC-001 §4 requires determination-level completeness or addresses zero-segment rows.
   - Gate Audit §11.4 pre-plans a compound (≥ 2-segment) `targetCustomer`, which reduces but does not eliminate the exposure.
5. **Is a new implementation change authorized by this assessment?** **NO.**

**Finding.** The repository leaves the `VALID` status of zero-segment determinations unresolved,
and it has no recorded post-F-1 reference point for "created after the F-1 implementation". Two
readings exist:
- the facilitator marks such rows `EXCLUDED — NOT VALIDATION-VALID`;
- F-1 §11.5 is read as satisfied vacuously.

The Companion's vacuous structural PASS makes the difference consequential for E3. A Product
Owner ruling on these two points could close G-6 without any code change. Whether an
implementation change is also wanted is a separate decision.

---

### 4. G-7 Special Analysis

**Three distinct kinds of evidence:**

| Level | What it proves | Current state |
|---|---|---|
| Shared schema validation | The Zod → JSON Schema output carries `confidence` as a required integer and omits `basis`/`classification` | **Tested** (`jsonSchema.test.ts`, the same `{ defs: { Observation } }` options as `anthropicModel.ts:88` and `openAIModel.ts:116`) |
| Provider adapter translation | Each adapter sends, or translates into, a contract-compliant shape for the extended segment | **Not tested for the segment field.** Gemini's `toGeminiSchema` is a real translation with no segment-field assertion. The OpenAI adapter adds strict mode. Neither the OpenAI nor the Anthropic adapter test asserts the segment schema that is sent. |
| Actual provider execution | A live provider accepts the schema and returns conforming output | Out of scope for D11-F: D11 §7 calls it "not a VALIDATION REQUIREMENT that D11 itself re-proves with a live run" |

**Does D11 §7 explicitly require provider-specific adapter tests?**
- **Yes, as a pre-scheduling implementation requirement:** "unit/integration tests exercising the new field's schema translation across all three configured provider adapters **before** any live D11 validation session is scheduled".
- F-1 §16 explicitly re-applies this to the extended segment schema.

**Why the disposition is unresolved rather than REQUIRED:** the records give two readings of scope.

- **Reading 1 — literal.**
  - D11 §7 says "all three configured provider adapters".
  - F-1 §16 says "every configured provider (Anthropic, OpenAI, Gemini, and any fallback)".
  - Under this reading, OpenAI and Gemini adapter-level segment tests are required, and they do not exist. G-7 would be **REQUIRED BEFORE D11** and would need a separately authorized test change.
- **Reading 2 — Gate Audit precedent (§8).**
  - "configured" means selected in the runtime environment.
  - The Gate Audit accepted a `jsonSchema.test.ts` assertion on the shared schema as satisfying D11-F for Anthropic, the only configured provider. It held that "Gemini and OpenAI are not configured, so their precondition does not currently apply".
  - The Readiness Audit records "ANTHROPIC ONLY CONFIGURED".
  - Under this reading, the extended-schema assertion now in `jsonSchema.test.ts` could satisfy D11-F for Anthropic, provided:
    - Anthropic is still the only configured provider, which this assessment did not re-verify: `.env` was not read, and the configuration is an environment fact at session time; and
    - no fallback provider is configured.

This assessment does not choose between the readings. A ruling is required, and the ruling must also
fix whether provider configuration is confirmed at readiness time.

---

### 5. G-9 Special Analysis

**Is browser rendering an explicit D11 prerequisite?** **No.**

- **D11 §3** makes the D10 UI render MANDATORY for **full D11 sign-off**, and states that a technical-only validation pass "may be recorded as complete before the UI is built".
- **Gate Audit** classifies it as D11-B, "rendered with real data (needed for full sign-off)". It does not appear among the §11 prerequisites that "must be met before a D11 session can be scheduled".
- **VS-PO-DEC-001 §4** does not list it.
- **D11 §5** requires MISMATCH/UNKNOWN presence to be confirmed "in the live UI". That is also a within-session observation.

**Is typecheck or code inspection sufficient?**
- It is sufficient for the **readiness** question under the current records.
- It is **not** sufficient for D11 completion. The render must be observed with real data during validation.
- A real-data render of post-F-1 fields requires a `VALID` determination. Only an authorized session may create one (VS-PO-DEC-001 §4 P11; P4-PO-DEC-001 §8.1). So the verification structurally belongs inside the session.
- A pre-session render with test data is not required by any record. It would be optional risk reduction and would itself need separate authorization.

No browser was run.

---

### 6. Governance Conclusion

| Category | Gaps |
|---|---|
| Blockers requiring implementation authorization before D11 (on the current records) | **None established.** G-7 becomes one under Reading 1 (§4). |
| Non-blocking follow-ups | **G-4.** **G-9** before readiness; G-9 remains mandatory within D11 validation (D11-B). |
| Unresolved governance questions requiring Product Owner decisions | **G-7:** scope of "configured provider" for D11 §7 / F-1 §16, and confirmation of the configuration at readiness. **G-6:** `VALID` status of zero-segment determinations and the reference point for "created after the F-1 implementation". |

Independently of these four gaps, D11 remains blocked by its recorded items: D11-I funding
(Gate Audit §13.1, VS-PO-DEC-001 P2) and the other unmet VS-PO-DEC-001 §4 preconditions.
VS-PO-DEC-001 P3 ("F-1 disposition") has not been re-assessed by any authorized record after
the F-1 implementation. This assessment does not update it.

This document authorizes no implementation, test change or configuration change.

---

### 7. Authority Boundary

- No F-1 code changed.
- No tests changed.
- No schema or migration changed.
- No UI changed.
- No provider calls.
- No live fetches.
- No determination created.
- No participant interaction.
- No E1, E2 or E3 work.
- No A-11 closure.
- No D11 readiness transition.
- No existing governance record modified, including P4-PO-DEC-001, VS-PO-DEC-001, the Companion Record, D11-H, and the A-11 matrix.

---

### 8. Final Status

- D11: **NOT READY FOR LIVE VALIDATION**
- A-11: **OPEN**
- E1: **BLOCKED**
- E2: **OPEN**
- E3: **OPEN**

---

### 9. Repository Safety

**Before the assessment:**

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28
Staged .................... none
git status --porcelain .... 135 lines (sha256 3819969c…d0a887b)
Tracked diff sha256 ....... 99bb951f…2585991
git diff --check .......... clean
Modified + untracked ...... 135 files hashed, stored outside the repository
tsconfig.tsbuildinfo ...... sha256 1834209e…71d09
```

No command capable of rewriting a generated file was run. The after-state is verified at
creation and reported with this record.

## STOP
