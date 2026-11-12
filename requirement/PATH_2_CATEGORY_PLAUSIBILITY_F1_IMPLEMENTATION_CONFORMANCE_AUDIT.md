# Path 2 — Category Plausibility

## F-1 Post-Implementation Conformance Audit (Read-Only)

```text
CONCLUSION ........... F-1 implementation: IMPLEMENTED WITH OPEN CONFORMANCE GAPS
OPEN ................. G-4, G-6 (partial), G-7, G-9
D11 .................. NOT READY FOR LIVE VALIDATION (unchanged)
E1 / E2 / E3 ......... BLOCKED / OPEN / OPEN (unchanged)
A-11 ................. OPEN (unchanged)
```

---

### 1. Audit Identity

| Item | Value |
|---|---|
| Audit ID | F1-IMPL-AUDIT-001 |
| Date | 2026-09-27 |
| HEAD | `5992b82b9adff492c480442d68a954f2a03bfb28` |
| Scope | The F-1 implementation authorized by F1-PO-AUTH-001, audited against the F-1 contract and its authoritative corrections |

**Baseline, recorded before any inspection or command:**

```text
Staged .......................... none
git status --porcelain .......... 134 lines (sha256 d17ad94b…565f879f)
Tracked diff .................... 49 files, +1563 / −65 (sha256 99bb951f…2585991)
git diff --check ................ clean
Audit record .................... absent
apps/web/tsconfig.tsbuildinfo ... M (tracked diff 1+/1−), sha256 1834209e…71d09, mtime 2026-09-27 21:55:58
Modified + untracked manifest ... 134 files hashed (sha256 each), stored outside the repository
```

**Hashes (sha256, first 16):**

| File | Hash |
|---|---|
| F-1 Evidence Product Decision | `ba4e6a73ef73fc3e` |
| F1-D Classification Product Decision | `2ae21352d2d64715` |
| F-1 §9 D3 Correction | `5233826fcf47c32d` |
| F-1 Implementation Conformance Record | `3185f6b064656be6` |
| `schema.ts` | `f135d705e0c5202a` |
| `categoryPlausibility.ts` | `6fcbdb9fa73200ff` |
| `prompt.ts` | `273b32704a2d1928` |
| `index.ts` | `69a2bdc8d122d737` |
| `categoryPlausibilityPgRepository.ts` | `e2e350bc28b97389` |
| `service.ts` | `e3e877fa93b1c3b3` |
| `researcher.ts` | `44766c76f31fdd1c` |
| `repair.ts` | `3f6768302c400525` |
| `opportunities/[id]/page.tsx` | `27ef9f894e3040d7` |
| `categoryPlausibility.test.ts` | `17a881998569aa6b` |
| `service.test.ts` | `66e7f33e8dbc1ee6` |
| `jsonSchema.test.ts` | `8046e4b5bccedfce` |
| `openAIModel.test.ts` | `2e90e8fba9804d61` |
| `geminiModel.test.ts` | `4566cc3c5c1ffd2c` |
| `worker.test.ts` | `a07a4755e31994d1` |
| `apps/web/tsconfig.tsbuildinfo` | `1834209ee009c450` |

**`tsconfig.tsbuildinfo` state.** The file was already modified when the implementation session
started. Its mtime (21:55:58) matches that session's `apps/web` `tsc --noEmit` run, and
`apps/web` is the only incremental tsconfig in the repository. So that typecheck probably
rewrote the file. The Implementation Conformance Record does not disclose this (§4.2, D-3).
This audit treats the file as a separate unresolved working-tree change and did not touch it.

---

### 2. Authority

| Document | Role |
|---|---|
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` | Authoritative F-1 contract (§6–§17) |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` | Authoritative for segment classification semantics (F1-D §5, §7, §9, §11) |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_D3_INFERRED_CORRECTION.md` | Authoritative correction: the INFERRED prohibition comes from F1-D, not D3 |
| `PATH_2_CATEGORY_PLAUSIBILITY_F1_IMPLEMENTATION_CONFORMANCE_RECORD.md` | Implementation evidence under audit. Not authoritative. |

All three authoritative files were last modified on 2026-09-26, before the implementation
session. They were read in full in that session and are unchanged since, per their mtimes and
the manifest. The contract was not inferred from the implementation.

---

### 3. Method

- **Read-only** throughout, except for creating this record.
- **Inspected:** the authoritative documents, the implementation files in §1, `researcher.ts`, `repair.ts`, the OpenAI/Gemini/Anthropic adapters and their tests, and the integration fixtures.
- **Commands run:**
  - vitest unit suites, which use in-memory fakes and stubbed models with no network;
  - `tsc --noEmit` on the non-incremental packages;
  - `tsc --noEmit --incremental false` on `apps/web`, which cannot write `tsconfig.tsbuildinfo`. The file's hash and mtime were verified unchanged afterwards.
- **Not run:** integration tests. They persist determination rows, including in the throwaway test DB, and "do not create a determination" was applied literally.
- **Not done:** no browser rendering, provider call or network fetch.
- **Unchanged-files check:** before and after, every modified and untracked file was hashed and the two sets compared.

---

### 4. Requirement-by-Requirement Conformance

#### 4.1 Contract table

| Contract requirement | Implementation evidence | Result |
|---|---|---|
| **§6 F1-A**: segment `confidence`, integer; MATCH/MISMATCH 1–100; UNKNOWN exactly 0; model-produced; code sets 0 for NO_MODEL_VERDICT; no effect on outcome | `schema.ts` `confidence: z.number().int().min(0).max(100)` plus superRefine (UNKNOWN ≠ 0 rejected; MATCH/MISMATCH < 1 rejected); `toSegmentDeterminations` passes the model value through and uses 0 for fills; `aggregateCategoryFit` reads only `fit` | PASS |
| **§7 F1-B**: `basis` closed, code-assigned, three values; not model-produced; model schema does not accept it | `SEGMENT_BASES` in `categoryPlausibility.ts`; assigned in `toSegmentDeterminations`; absent from `categorySegmentSchema` | PASS |
| **§8 F1-C**: rationale kept; required for model-returned UNKNOWN; null for NO_MODEL_VERDICT | superRefine rejects null rationale for every fit; fill sets `null` | PASS (see G-4 on repair messaging) |
| **§9 / F1-D**: classification `OBSERVED` / `UNKNOWN`, feature-local type, code-derived, persisted, not displayed, no INFERRED, not a ResearchSignal | `SEGMENT_CLASSIFICATIONS`; `segmentClassificationSchema` is separate from `Classification`; stored in `segment_results`; not rendered; `mapping.ts`/`allObservations` untouched | PASS |
| **§10 F1-E**: UNKNOWN cases are distinguishable; empty array accepted and labelled `NO_MODEL_VERDICT`; missing row, failed research and zero segments unchanged | `verifyCategoryPlausibility` still accepts `[]`; the fill path is labelled; `service.ts` flow is unchanged | PASS |
| **§11 F1-F**: optional-on-read for legacy rows; no backfill or migration; legacy renders without the fields; Qualification unaffected; only post-F-1 complete rows are validation-valid | `StoredSegmentDetermination` makes the three fields optional; no migration added; UI guards each field; Qualification reads `aggregateResult` only; `isF1CompleteSegmentDetermination` is false for legacy segments | PASS for storage and compatibility. **PARTIAL / OPEN** for eligibility (G-6). |
| **§13** locked contract table | Field sources and requirements match row by row; evidence shape `{quote, sourceUrl, sourceLabel}` ≤ 3 unchanged | PASS |
| **§14 rule 1**: count/order; empty accepted | Unchanged | PASS |
| **§14 rule 2**: MATCH/MISMATCH rationale 1–400, evidence 1–3, supplied URL, verbatim quote, confidence 1–100 | schema + `verifyCategoryPlausibility` | PASS |
| **§14 rule 3**: model UNKNOWN evidence `[]`, confidence 0, rationale non-null | superRefine | PASS |
| **§14 rule 4**: model output must not contain `basis` / `classification` | Not in the model-facing schema. Extra keys are silently **stripped** by Zod rather than rejected. OpenAI/Anthropic strict JSON Schema would not emit them. | PASS, with the note that enforcement is by exclusion and stripping, not rejection |
| **§14 rule 5**: stored-row consistency is checkable | `isF1CompleteSegmentDetermination` | PASS |
| **§15 UI** | See G-8 | PASS (code). NOT VERIFIED (render, G-9). |
| **§16**: one shared schema and prompt; code-assigned fields provider-agnostic; D11-F translation tests for every configured provider must pass for the extended segment schema | Shared Zod → `zodToJsonSchema` is used by all three adapters. The per-provider translation tests do not assert the extended segment schema. | **PARTIAL / OPEN** (G-7) |
| **§17**: no migration; migration 0027 header left stale | No migration added; 0027 not edited | PASS |
| **F1-D §11.3**: the prompt states the quote-grounding rule | `prompt.ts` SYSTEM_PROMPT segment paragraph | PASS (G-5) |
| **F1-D §11.4**: no automated directness detector | None added | PASS |
| **F1-D §11.5**: code comments state the feature-local OBSERVED meaning | `categoryPlausibility.ts` classification comment | PASS |

#### 4.2 Discrepancies with the Implementation Conformance Record

The contract governs wherever the two differ.

- **D-1. G-numbering.** The Record's G-1…G-10 are a different list from this audit's G-1…G-10, which is the list set by the audit brief. Only G-4, G-7 and G-9 share their meaning. The Record's other gaps are carried in §6: G-1 calibration, G-2 nullable rationale, G-3 dual OBSERVED meaning, G-5 zero-segment rows, G-6 no read validation, G-8 pre-existing integration failures, and G-10 D11-H fields.
- **D-2. Validation-valid.** The Record says `isF1CompleteSegmentDetermination` enforces the P4 rule. It is a per-segment structural check. No determination-level check or enforcement exists (G-6).
- **D-3. `tsconfig.tsbuildinfo`.** The Record's §10 does not mention the probable rewrite of `apps/web/tsconfig.tsbuildinfo` by the implementation session's typecheck (§1).

---

### 5. G-1 – G-10 Matrix

| Gap | Contract requirement | Implementation evidence | Test evidence (run now) | Result | Remaining limitation |
|---|---|---|---|---|---|
| **G-1** Segment fields | §13 table; §6/§7/§9 field sources | `categorySegmentSchema` has `fit`, `rationale`, `evidence`, `confidence`. `SegmentDetermination` adds code-assigned `basis` and `classification`. | `categoryPlausibility.test.ts` "zips…code-assigns…", schema-rule suites; `service.test.ts` "persists confidence, basis and classification…" | **PASS** | Calibration guidance is only the bounds plus one line (Record G-1; contract N-1/A-1, non-blocking) |
| **G-2** Classification semantics | F1-D §2, §5, §7, §9; D3 correction §4–§5 | Two-member `SEGMENT_CLASSIFICATIONS`. `schema.ts` `Classification`/`CLASSIFICATIONS` not imported or changed. Derived only from `fit`. Not in the model schema. Not rendered. | "never assigns INFERRED…"; `isF1Complete…` rejects `INFERRED`; `jsonSchema.test.ts` asserts no `classification` key in the model-facing schema | **PASS** | The stored label records a claim, not proof. D11 §6.3 substantive check (F1-D §8) is governance, not code. |
| **G-3** Empty / no-verdict | §10 row 3; §13 NO_MODEL_VERDICT column | Missing position → `fit UNKNOWN, rationale null, evidence [], confidence 0, basis NO_MODEL_VERDICT, classification UNKNOWN`. Empty array still not a repair. | "fills an empty model response as NO_MODEL_VERDICT…", "defaults a missing per-position…", "…undefined…"; `service.test.ts` "labels an empty model response NO_MODEL_VERDICT…"; verifier "completely empty…not a failure" | **PASS** | — |
| **G-4** Repair / verifier messaging | §8, §10, §14 rule 3 (UNKNOWN rationale required); F-1 audit A-6 | The superRefine message for a null UNKNOWN rationale is explicit and reaches the repair loop through `fromZodIssues`. However: the verifier messages (`categoryPlausibility.ts:146, 159` and the verbatim-quote message) say "classify this segment UNKNOWN" without mentioning the required rationale or confidence 0. The generic and targeted repair footers (`prompt.ts:86, 158`) say "the claim is INFERRED or UNKNOWN", and INFERRED is not permitted for segments. | None. No test exercises a segment repair round from UNKNOWN-with-null-rationale, or a verifier-triggered downgrade. | **PARTIAL / OPEN** | A repair can produce a schema-invalid UNKNOWN and cost an extra round. The segment repair text still mentions INFERRED. Retry correctness is not independently tested. |
| **G-5** Quote-grounding prompt rule | F1-D §11.3 | SYSTEM_PROMPT: cited quotes must state the verdict or contain every premise; otherwise UNKNOWN. It names background knowledge, business name alone, and absence of a mention. | None. No prompt-text assertion covers this sentence. Prompt behaviour is not unit-testable. | **PASS** (requirement text present, verified by inspection) | The prompt still carries the ResearchSignal OBSERVED/INFERRED text beside it (Record G-3 / A-5). Model compliance is unverified without live calls, which are out of scope. |
| **G-6** Completeness / eligibility (P4) | §11 item 5; F1-PO-AUTH-001 §2.5 | New rows always carry all three fields (by type and construction). `isF1CompleteSegmentDetermination` is false for any segment missing a field. | "treats a legacy (pre-F-1) row … as not complete"; "rejects rows whose … are inconsistent"; "every produced result passes…" | **PARTIAL / OPEN** | (a) The check is per segment. No determination-level function exists, and nothing in code enforces eligibility; eligibility is left to governance selection. (b) A zero-segment row passes `[].every(…)` vacuously and cannot be classed as legacy or post-F-1 (Record G-5 / N-5). F-1 §10 says such rows cannot satisfy D11 coverage. (c) There is no persisted post-F-1 marker or cutoff. Only the field presence on ≥1-segment rows tells rows apart. |
| **G-7** Structured output across providers | §16: translation tests for every configured provider must pass for the extended segment schema | All three adapters derive their schema from `leadResearchSchema`: OpenAI and Anthropic via `zodToJsonSchema` with Observation defs; Gemini via `toGeminiSchema(zodToJsonSchema(…))`. No adapter change. | `jsonSchema.test.ts` asserts `confidence` is a required integer and that `basis`/`classification` are absent (shared schema only). `geminiModel.test.ts` translates the full schema but asserts only top-level shape. `openAIModel.test.ts` asserts only `response_format.type`. No Anthropic adapter translation assertion covers segments. | **PARTIAL / OPEN** | Shared-schema coverage is not provider-adapter coverage. The D11 §7 precondition stays unmet on the test evidence. |
| **G-8** UI | §15 | Page: segment and literal `fit`; ` (confidence N)` only when `fit !== 'UNKNOWN'` and the value is present; rationale when non-null; `Basis: <literal>` when present; evidence label link + quote unchanged; classification not rendered; legacy fields omitted via guards; no layout, route or list change | `apps/web` `tsc --noEmit --incremental false` clean. No UI test asserts these elements. | **PASS** (code conformance by inspection) | Render not verified (G-9) |
| **G-9** Browser / render verification | Implementation evidence standard | No browser render performed, in the implementation session or in this audit | Typecheck only | **NOT VERIFIED** | Requires a running app, an authenticated session and a stored post-F-1 determination. Creating one is outside this audit's authority. |
| **G-10** Legacy rows / migration / backfill | §11.1–§11.5, §17 | No migration, no backfill, no DDL. `StoredSegmentDetermination` tolerates missing fields; pg `mapRow` passes JSONB through; UI guards. Legacy segments fail `isF1Complete…`. | Legacy-row test in `categoryPlausibility.test.ts`; typechecks clean | **PASS**, subject to the G-6 zero-segment limitation | No runtime validation of `segment_results` on read (Record G-6 / A-10). The legacy-rendering path is not rendered (G-9). |

---

### 6. Open Gaps

| Gap | Status |
|---|---|
| **G-4** Repair prompts and verifier messaging | OPEN, untested |
| **G-6** Determination-level eligibility, zero-segment ambiguity, no post-F-1 marker | PARTIAL / OPEN |
| **G-7** Provider-specific adapter test coverage for the extended segment schema | OPEN. The D11 §7 precondition is not demonstrated. |
| **G-9** Browser / render verification | NOT VERIFIED |

Previously recorded items that stay open and non-blocking for the contract:
- confidence calibration (Record G-1);
- nullable model-facing rationale (Record G-2);
- dual OBSERVED meaning in the prompt (Record G-3);
- no read-side validation (Record G-6);
- D11-H fields (Record G-10);
- the `NEED_DETECTED` integration failures, reported as pre-existing and not caused by F-1 (Record G-8). **Not independently re-verified here**, because the integration tests were not run.

---

### 7. Test Evidence

**Run in this audit:**

| Command | Result |
|---|---|
| `packages/core-research` `vitest run` | 14 files, **281 passed** |
| `packages/core-research` targeted: `categoryPlausibility`, `service`, `jsonSchema`, `geminiModel`, `openAIModel`, `sourceCapture`, `sourceDocumentReview` | **111 passed** |
| `packages/core-research` `tsc --noEmit` | clean |
| `packages/core-qualification` `vitest run` / `tsc --noEmit` | **30 passed** / clean |
| `apps/worker` `vitest run` / `tsc --noEmit` | **185 passed** / clean |
| `tests` `tsc --noEmit` | clean |
| `apps/web` `tsc --noEmit --incremental false` | clean; `tsconfig.tsbuildinfo` hash and mtime unchanged |

**Prior implementation results, not rerun here:** the integration suites.
- Reported passing: category-plausibility source capture (M-2) and source review (Q-1), qualification, client-finder-web, research, search-worker.
- Reported failing: 14 tests across personalization, outreach-preparation and follow-up-preparation.

**Not independently verified:** M-2 and Q-1 behaviour at the integration level (unit coverage in `sourceCapture.test.ts` and `sourceDocumentReview.test.ts` passed now); the pre-existing cause of the integration failures; any browser render; any provider-adapter behaviour against a real provider.

None of these tests is D11, E1, E2 or E3 evidence.

---

### 8. F-1 Conclusion

> **F-1 implementation: IMPLEMENTED WITH OPEN CONFORMANCE GAPS.**

The code conforms to F-1 §6–§15 and §17, and to F1-D §9 and §11. It does not fully conform
to §16: the per-provider translation-test obligation is unmet (G-7). Repair messaging (G-4),
determination-level eligibility (G-6) and render verification (G-9) remain open.

---

### 9. Validation Boundary

> This audit does not constitute D11 validation readiness and does not create or validate any determination.

- D11: **NOT READY FOR LIVE VALIDATION**
- E1: **BLOCKED**
- E2: **OPEN**
- E3: **OPEN**
- A-11: **OPEN**

---

### 10. Prohibited Activity Confirmation

- No provider calls.
- No live source fetching.
- No participant interaction.
- No determination created or modified. Integration tests were not run.
- No E1, E2 or E3 evidence collected.
- No A-11 closure.
- No D11 readiness transition.
- No changes to the A-11 evidence matrix, P4-PO-DEC-001, VS-PO-DEC-001, D11-H, the D11 Facilitator Record, or the Companion Record.

---

### 11. Repository Safety

State immediately before this record was created:

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Staged .................... none
Tracked diff sha256 ....... 99bb951f…2585991 (unchanged)
git diff --check .......... clean
Modified + untracked ...... all 134 file hashes identical to baseline (no code, test, schema,
                            migration, UI, governance, or generated file changed)
tsconfig.tsbuildinfo ...... sha256 1834209e…71d09, mtime unchanged — untouched by this audit
```

The only change made by this audit is the creation of this file.

---

### 12. Follow-Up (requires separate authorization)

| Item | Needed |
|---|---|
| G-4 | Segment-aware repair and verifier wording, plus a repair-round test |
| G-7 | OpenAI, Gemini and Anthropic adapter translation tests asserting the extended segment schema (D11 §7 precondition) |
| G-9 | Browser render of the D10 section for post-F-1 and legacy rows |
| G-6 (related) | A governance or implementation decision on determination-level eligibility and zero-segment rows |
| `tsconfig.tsbuildinfo` | A decision on the unresolved working-tree change |

This audit authorizes none of them.

## STOP
