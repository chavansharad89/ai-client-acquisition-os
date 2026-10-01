# Path 2 — Category Plausibility

## A11-P1 M-2 Implementation — Read-Only Conformance Audit

```text
AUDIT ID: A11-P1-M2-IMPL-AUDIT-001
AUTHORIZATION: A11-P1-IMPL-AUTH-001 (narrow M-2 scope)
DECISION: A11-P1-PO-DEC-002 (M-2 selected)
RESULT: CONFORMING — WITH ONE UNEXECUTED TEST SUITE (see §5, §8)
A-11 ...................... OPEN
F-1 (outside this scope) .. NOT AUTHORIZED
D11 LIVE VALIDATION ....... NOT READY FOR LIVE VALIDATION / NOT AUTHORIZED
```

This audit records the implementation result and checks it against the authorization. It
closes nothing.
- Implementation completion is **not** evidence that A-11 passed (authorization §8–§9).
- A11-E1 to A11-E3 still require live evidence from a separately authorized session.

---

### 1. Baseline and Result State

| | Before implementation | After |
|---|---|---|
| HEAD | `5992b82` | `5992b82` (unchanged) |
| Staged | none | none |
| Tracked-file diff SHA-1 | `e21f4e759a3adc253faf9971c1d7b6423cd5db31` (48 files) | `aa07cdc2a7b218c66561d89c753d75063e6e71e3` (49 files). The delta is exactly the 9 files in §2. |
| Untracked files | 71 | 75. Two pre-existing untracked files changed; three implementation files and this audit were added (§2). |

---

### 2. Files Changed by This Implementation

The "authorization basis" column shows why each file was touched.

| File | Change | Authorization basis |
|---|---|---|
| `packages/db/prisma/migrations/0028_category_plausibility_source_documents/migration.sql` | **New.** Table `category_plausibility_source_documents` | §1.2 |
| `packages/core-research/src/categoryPlausibilityPgRepository.ts` | `save()` takes optional `sourceDocuments` and writes the determination and its sources in **one** statement (CTE). New `listSourceDocumentsByDeterminationId()`. New `sourceContentSha256()`. The no-sources path issues the original INSERT unchanged. | §1.3 (named) |
| `packages/core-research/src/categoryPlausibilityRepository.ts` | `save()` gains an optional third parameter. New types `CapturedSourceDocumentInput` and `StoredCapturedSourceDocument`, constant `MODEL_SEEN_SOURCE`, and a separate `CategoryPlausibilitySourceDocumentReader` interface, so existing implementations and fakes are unaffected. | §1.3 repository interfaces/types |
| `packages/core-research/src/sourceDocumentProvider.ts` | Optional `extractionMethod` on the interface. The HTTP provider declares `HTTP_HOMEPAGE_EXTRACTION_METHOD`. **Extraction logic unchanged.** | §1.3 (named) |
| `packages/core-research/src/anthropicResearchProvider.ts` | Records `fetchedAt` after the single fetch. Forwards `researchLead()`'s post-parse documents to `input.onSourceDocumentsSupplied`. | §1.3 (named) |
| `packages/core-research/src/fallbackResearchProvider.ts` | Same as the Anthropic provider, once per attempt. `researchOptions` type also omits `onSourceDocuments`. | §1.3 (named) |
| `packages/core-research/src/researcher.ts` | New optional `ResearchOptions.onSourceDocuments`, fired once before the first model call with the **parsed** `input.sourceDocuments`, the same object `buildUserMessage()` renders | **Not named in §1.3.** It is necessary under §3; see §4 D-1. |
| `packages/core-research/src/provider.ts` | Optional `ResearchProviderInput.onSourceDocumentsSupplied` and type `SuppliedSourceDocuments`. `research()` signature and return type unchanged. | §1.3 types on the provider path; see §4 D-2 |
| `packages/core-research/src/service.ts` | `runResearchForOwner` collects the supplied documents and passes them to the existing `categoryPlausibility.save()` | §1.3 directly necessary caller |
| `packages/core-research/src/index.ts` | Exports the new types, constant and helpers | §1.3 |
| `packages/core-research/src/testSupport.ts` | The fake repository records the `sourceDocuments` argument | §12 test authoring |
| `packages/core-research/src/service.test.ts` | New `describe` block (3 tests) | §6 |
| `packages/core-research/src/sourceCapture.test.ts` | **New** (10 tests) | §6 |
| `tests/integration/category-plausibility-source-capture.integration.test.ts` | **New** (4 tests, real PostgreSQL) | §6 |

**Not changed:**
- worker, web, qualification and all other packages;
- `schema.prisma` (it has no category-plausibility model);
- D11-H, F1-D, D0–D11, the participant-facing instrument, the A-12 Companion Record and its closure/conformance records;
- every other governance document.

---

### 3. Capture Contract (authorization §2) → Implementation

| Contract field | Implementation | Reuse / new |
|---|---|---|
| Source text | `source_text`: `SourceDocument.text` after `researchInputSchema.parse()` | New persistence |
| Source identity/reference | `source_label`, `source_url` (post-parse), `document_index` | Existing values |
| Determination linkage | `determination_id` FK → `category_plausibility_determinations(id)` ON DELETE CASCADE | New relationship (documented per §4) |
| Search / Prospect context | **Reused** through the determination row (`search_id`, `prospect_id`), joined on read. Not duplicated. | Reused |
| Opportunity ID | **Not added.** Resolved through the Prospect and the Companion, per authorization §4. | — |
| Fetch timestamp | `fetched_at`: taken by the provider immediately after `fetchSourceDocuments()` resolves; one value per run | New |
| Content hash | `content_sha256`: lower-case hex SHA-256 of the exact `source_text` as UTF-8. The DB enforces `^[0-9a-f]{64}$`. | New |
| `MODEL_SEEN_SOURCE` marker | `capture_kind`, with DB `CHECK (capture_kind = 'MODEL_SEEN_SOURCE')` | New |
| Extraction method/path | `extraction_method`: the provider's declared value; `'UNDECLARED'` if not declared, never guessed | New |

---

### 4. Exactness, Traceability and Recorded Deviations

**Exactness (authorization §3).**
- `researchLead()` runs `researchInputSchema.parse()`, which **trims** `label`, `url` and `text`.
- The model-seen value therefore exists only after that parse. It is captured there (`researcher.ts`) and flows unchanged through the provider, the service and repository parameter binding.
- There is no re-fetch, re-extraction, whitespace normalisation, HTML reconstruction or snapshot anywhere on the path.

**Recorded deviations and interpretations.**

| # | Item | Treatment |
|---|---|---|
| D-1 | `researcher.ts` is not among the files named in §1.3 | It was modified because §3 requires persisting "that resulting value rather than an independently reconstructed representation". Only `researcher.ts` holds the post-parse value. Capturing earlier, in the providers, would persist the **pre-trim** value. The change is one optional hook with no behaviour change. |
| D-2 | `ResearchProviderInput` had been described as having a single additive field (`targetSegments`) | A second optional field was added, following the same pattern. `research()` keeps its arity and return type. Existing callers and fakes compile unchanged. |
| D-3 | Fallback chains call the hook once per attempt | Every call carries identical documents and the same `fetchedAt`. The service keeps the last call. Each document is persisted once (tested). |
| D-4 | A determination can exist with no captured sources | This happens for rows written before 0028, when the `categoryPlausibility` dependency is omitted, or with a provider that does not implement the hook (test fakes). The real providers throw `InsufficientEvidenceError` rather than research with zero documents, so a live run always either captures or saves no determination. An explicit "no source supplied" row was not added (not in the §2 contract). Recorded for the A-11 closure audit. |
| D-5 | `fetched_at` is `TIMESTAMP(3)` without time zone | Same convention and driver behaviour as `observed_at` in migration 0027 |

---

### 5. Tests (authorization §6)

| Test | Where | Result |
|---|---|---|
| T1 exactness | `sourceCapture.test.ts` (captured text byte-equal to the document body in the actual model prompt; post-trim value captured); `service.test.ts` (persisted input equals supplied); repository parameter check | **PASS** |
| T2 transformation boundary | `sourceCapture.test.ts`. Real `createHttpSourceDocumentProvider` with injected HTML: captured text equals the prompt body; no `<`, no script text, no whitespace runs; single fetch; extraction method recorded. Fallback: identical documents per attempt. | **PASS** |
| T3 traceability | `service.test.ts` (saved row's Search/Prospect); repository read maps the determination, Search and Prospect | **PASS** (unit). Real-DB variant **NOT RUN** (see below). |
| T4 hash integrity | `sourceCapture.test.ts` (known vector; UTF-8; whitespace-sensitive; hash bound equals hash of bound text). Integration: DB-side `sha256()` recomputation. | **PASS** (unit). DB check **NOT RUN**. |
| T5 multiple sources | `service.test.ts` (2 documents, order kept, persisted once under fallback); repository `WITH ORDINALITY`; DB `UNIQUE(determination_id, document_index)` | **PASS** (unit). DB constraint **NOT RUN**. |
| T6 persistence/retrieval | `tests/integration/category-plausibility-source-capture.integration.test.ts` | **NOT RUN.** PostgreSQL is not reachable (`127.0.0.1:5433`; Docker daemon not running). Compiled and linted only. |
| T7 existing behaviour | `@acos/core-research` 262/262; `apps/worker` 185/185; `@acos/core-qualification` 30/30. No-sources path issues the original INSERT (tested). Typecheck clean for core-research, worker, qualification, web and tests. | **PASS** |

**Lint.** `eslint src` (core-research): 0 errors. The 7 warnings are all in lines this
implementation did not touch. The two warnings introduced during implementation were fixed.

---

### 6. Incident During Verification (resolved)

- Running `tsc --noEmit -p apps/web` for the dependent-package typecheck rewrote the tracked, generated `apps/web/tsconfig.tsbuildinfo`.
- The file was restored to its exact pre-implementation state (HEAD plus the pre-existing working-tree diff). A backup of the rewritten version is kept outside the repository.
- Its working-tree diff is byte-identical to baseline.

---

### 7. Completion Criteria (authorization §11)

| # | Criterion | Status |
|---|---|---|
| 1 | M-2 persistence implemented | Met |
| 2 | Stored source = exact provider-input text | Met (T1, T2) |
| 3 | Source → determination traceability | Met in unit tests; DB-level test not run |
| 4 | Hash integrity | Met in unit tests; DB recomputation not run |
| 5 | Repository/schema tests pass | **Partially.** Unit tests pass. The **schema/DB tests have not been executed.** |
| 6 | Existing behaviour intact | Met (T7) |
| 7 | No unauthorized artifact modified | Met. D-1 is recorded; the tsbuildinfo incident was reverted. |
| 8 | `git diff --check` | Clean |
| 9 | Nothing staged | Met |
| 10 | Read-only audit records the result | This document |

---

### 8. Open Items

1. **Run the integration suite against PostgreSQL** (`docker compose -f docker-compose.test.yml up -d`, then the integration test above). Until then, criterion 5 is only partially met and the migration has not been applied to a real database.
2. Product Owner acknowledgement of D-1 (the `researcher.ts` touch) and D-4 (no explicit "no source supplied" record).
3. Retention and access rules for persisted source text (A11-P1-PO-DEC-002 Q-1) remain undecided. Nothing here deletes or restricts captured text beyond the existing ownership join.

```text
A-11 ...................... OPEN
F-1 (outside this scope) .. NOT AUTHORIZED
D11 LIVE VALIDATION ....... NOT READY FOR LIVE VALIDATION
```

## STOP
