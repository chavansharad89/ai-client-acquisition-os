# Path 2 — Category Plausibility

## F-1 Implementation — Conformance Record

```text
AUTHORITY ............ F1-PO-AUTH-001 (implementation only)
CONTRACT ............. F-1 Evidence Product Decision §6–§17, as clarified by
                       F1-D Classification Product Decision and the F-1 §9 D3 correction
F-1 IMPLEMENTATION ... COMPLETE (subject to the gaps in §9)
D11 .................. NOT READY FOR LIVE VALIDATION (unchanged)
A-11 ................. OPEN   E1: BLOCKED   E2: OPEN   E3: OPEN (unchanged)
```

This record documents the implementation. It does not declare D11 ready, does not
constitute E1/E2/E3 evidence, and does not close A-11.

---

### 1. Files Changed

Production:

| File | Change |
|---|---|
| `packages/core-research/src/schema.ts` | `categorySegmentSchema`: added model-produced `confidence`; rationale now required for every model-returned entry, including UNKNOWN |
| `packages/core-research/src/categoryPlausibility.ts` | Feature-local `SegmentClassification` / `SegmentBasis` types and schemas; `SegmentDetermination` extended; `StoredSegmentDetermination` legacy-tolerant read type; `toSegmentDeterminations` assigns `basis`/`classification`/NO_MODEL_VERDICT; new `isF1CompleteSegmentDetermination` |
| `packages/core-research/src/categoryPlausibilityPgRepository.ts` | Row type for `segment_results` uses the legacy-tolerant read type |
| `packages/core-research/src/prompt.ts` | Shared `SYSTEM_PROMPT` segment paragraph: F1-D §11.3 grounding rule, rationale and confidence instructions |
| `packages/core-research/src/index.ts` | Exports the new types, constants and check |
| `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` | D10 section renders `confidence` (MATCH/MISMATCH only) and `basis` (literal) when present |

Tests:

| File | Change |
|---|---|
| `packages/core-research/src/categoryPlausibility.test.ts` | Fixtures carry `confidence`; new suites for code-assigned fields, schema rules 2–4, stored-row consistency |
| `packages/core-research/src/service.test.ts` | Two tests: persisted determinations carry complete F-1 fields; empty response → NO_MODEL_VERDICT |
| `packages/core-research/src/jsonSchema.test.ts` | Model-facing JSON Schema carries required integer `confidence`, no `basis`/`classification` |
| `apps/worker/src/searchWorker/worker.test.ts` | Two real-provenance fixtures gain `confidence: 90` |
| `tests/integration/{client-finder-web,followup-preparation,outreach-preparation,personalization,qualification}.integration.test.ts` | Segment fixtures gain `confidence: 90` (required by the `LeadResearch` type) |

---

### 2. F-1 Requirements Implemented

| Requirement | Implementation |
|---|---|
| F1-A confidence (§6) | Model-produced integer 0–100; schema enforces 1–100 for MATCH/MISMATCH, 0 for UNKNOWN; code sets 0 for NO_MODEL_VERDICT; no effect on `fit`, aggregation or Qualification |
| F1-B basis (§7) | Code-assigned closed set `CITED_SOURCE_EVIDENCE` / `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` / `NO_MODEL_VERDICT`; not in the model schema |
| F1-C basis vs. rationale (§8) | Both kept; rationale extended to model-returned UNKNOWN; `null` only for NO_MODEL_VERDICT |
| F1-D classification (§9; F1-D §5, §7, §9, §11) | Feature-local two-member type `OBSERVED | UNKNOWN`, separate from `Classification`; code-derived from outcome; persisted, not rendered; no INFERRED; comments state the feature-local meaning; prompt carries the §11.3 grounding rule; no automated directness detector |
| F1-E UNKNOWN (§10) | Model-reported UNKNOWN requires rationale, `evidence = []`, confidence 0; empty model array still accepted and labelled NO_MODEL_VERDICT; missing-row, failed-research and zero-segment behaviour unchanged |
| F1-F persistence / legacy (§11) | JSONB only, no DDL, no backfill; read type tolerates missing fields; UI omits absent fields; Qualification unchanged |
| §14 validation | Rules 2–3 in `categorySegmentSchema.superRefine`; rule 1 unchanged in `verifyCategoryPlausibility`; rule 4 by construction (model schema has no such keys; Zod strips extras); rule 5 checkable via `isF1CompleteSegmentDetermination` |
| §15 UI | Confidence for MATCH/MISMATCH, basis as literal value, classification not rendered, no layout change |
| §16 provider neutrality | Single shared Zod schema and prompt; code-assigned fields computed in shared `toSegmentDeterminations`; no adapter change |
| F-1 §11 item 5 (P4) | Every determination written after this change carries complete F-1 fields; `isF1CompleteSegmentDetermination` returns `false` for any pre-F-1 (legacy) segment |

---

### 3. Schema / Migration Changes

None. `segment_results` is JSONB; no migration, DDL or backfill. Migration 0027's header
comment describing the old segment shape is now stale; applied migrations were not edited
(F-1 §17).

---

### 4. Repository / Service / Worker Changes

- Repository: row typing only; insert/supersede SQL, `(search_id, prospect_id)` scoping and
  current-row resolution unchanged.
- Service: unchanged; it already passes `toSegmentDeterminations` output to `save`.
- Worker: no production change; test fixtures only.

---

### 5. Tests and Results

| Command | Result |
|---|---|
| `packages/core-research`: `vitest run` | 281 passed |
| `packages/core-research`: `tsc --noEmit` | clean |
| `packages/core-qualification`: `vitest run`, `tsc --noEmit` | 30 passed, clean |
| `apps/worker`: `vitest run`, `tsc --noEmit` | 185 passed, clean |
| `apps/web`: `tsc --noEmit` | clean |
| `tests`: `tsc --noEmit` | clean |
| Integration (local docker test DB, port 5433): category-plausibility-source-capture, category-plausibility-source-review, qualification, client-finder-web, research, search-worker | all passed |
| Integration: personalization, outreach-preparation, followup-preparation | **14 failed** — see §9 G-8 |

---

### 6. M-2 Source-Capture Preservation

No change to `sourceCapture`, capture persistence, or `toCapturedSourceDocuments`.
`sourceCapture.test.ts` (10) and `category-plausibility-source-capture.integration.test.ts` (4)
pass unchanged.

### 7. Q-1 Source-Document Retrieval Preservation

No change to `sourceDocumentReview.ts`, the `api/category-plausibility` route, or the
repository's source-document read path. `sourceDocumentReview.test.ts` (5) and
`category-plausibility-source-review.integration.test.ts` (6) pass unchanged.

---

### 8. Deviations from Authorized Scope

None. Test-fixture edits outside `core-research` were limited to adding the now-required
`confidence` to existing MATCH fixtures.

---

### 9. Unresolved Implementation Gaps

| ID | Gap | Source |
|---|---|---|
| G-1 | Confidence calibration guidance limited to the bounds and one-line meaning in the prompt | Audit A-1 / N-1 |
| G-2 | Model-facing `rationale` left nullable (superRefine rejects null) to keep the JSON Schema union count unchanged | A-4 |
| G-3 | Shared prompt still carries the ResearchSignal OBSERVED/INFERRED text beside the segment rule; the model sees two meanings | A-5 |
| G-4 | Generic/targeted repair text ("the claim is INFERRED or UNKNOWN") and verifier messages ("classify this segment UNKNOWN") do not mention the now-required UNKNOWN rationale; a repair may take an extra round | A-6 |
| G-5 | Zero-segment rows remain indistinguishable as legacy vs. post-F-1 | A-9 / N-5 |
| G-6 | No runtime validation of `segment_results` on read | A-10 |
| G-7 | D11-F translation tests: one shared JSON Schema assertion added; the per-adapter OpenAI/Gemini tests were not extended. Whether this satisfies the D11 §7 precondition is for the readiness decision | A-14 |
| G-8 | Personalization / outreach-preparation / follow-up-preparation integration suites fail at `NEED_DETECTED` (suggestOffers finds no offer); `CATEGORY_PLAUSIBLE` is satisfied. Not caused by F-1, and not fixed here | pre-existing |
| G-9 | Opportunity detail UI change verified by typecheck only; not rendered in a browser | — |
| G-10 | D11-H record fields for the §6.3 results remain undefined | A-12 (governance, not implementation) |

---

### 10. Repository Safety State

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28  (unchanged)
Staged .................... none
git diff --check .......... clean
Commit / push ............. none / none
Migrations applied ........ none
```

---

### 11. Authority Not Exercised

No validation session, provider call, live source fetch, participant contact, A-11
validation determination, `VALID` determination, E1/E2/E3 execution, A-11 closure, or
modification of the A-11 evidence matrix, D11-H, the D11 Facilitator Record, the Companion
Record, or VS-PO-DEC-001 occurred. All tests used stub providers and the local test database.

## STOP
