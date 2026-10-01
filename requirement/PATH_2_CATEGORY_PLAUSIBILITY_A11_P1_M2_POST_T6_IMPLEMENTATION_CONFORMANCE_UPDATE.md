# PATH 2 — CATEGORY PLAUSIBILITY

## A11-P1 M-2 POST-T6 IMPLEMENTATION CONFORMANCE UPDATE

**Audit / Update ID:** A11-P1-M2-CONF-UPDATE-002
**Related Product Owner Decision:** A11-P1-PO-DEC-002
**Related Implementation Authorization:** A11-P1-IMPL-AUTH-001
**Related T6 Execution Authorization:** A11-T6-EXEC-AUTH-001
**Updates:** `PATH_2_CATEGORY_PLAUSIBILITY_A11_P1_M2_IMPLEMENTATION_CONFORMANCE_AUDIT.md` (which records T6 as NOT RUN; that file is not modified by this update)
**Status:** TECHNICAL CONFORMANCE UPDATE — T6 PASS
**A-11 Status:** OPEN
**F-1:** NOT AUTHORIZED outside the explicitly authorized A11-P1 M-2 implementation scope
**D11:** NOT READY FOR LIVE VALIDATION

---

# §0. Purpose

This document records the result of the authorized **T6 real-PostgreSQL integration test** against the previously recorded A11-P1 M-2 implementation conformance audit.

It records:

* T6 execution;
* T6.1–T6.7 results;
* migration `0028` coverage;
* repository safety;
* the no-live-provider boundary;
* the implementation deviations D-1 and D-4 recorded by the earlier audit.

This document does **not** modify the implementation authorization, expand its scope, or close A-11.

---

# §1. T6 execution

T6 was authorized under **A11-T6-EXEC-AUTH-001**.

### Environment

* Docker Desktop was started because the Docker daemon was initially unavailable.
* The repository test container `acos_postgres_test` (from `docker-compose.test.yml`) was started and used for T6.
* PostgreSQL version: **16** (`postgres:16-alpine`).
* Test database: a temporary per-suite database created by the repository's integration-test harness.

### Command

```bash
cd tests && npx vitest run \
  --config integration/vitest.config.ts \
  integration/category-plausibility-source-capture.integration.test.ts \
  --reporter=verbose
```

### Result

**PASS**

* Test files: 1 passed
* Tests: **4/4 passed**
* Duration: approximately 832 ms

Tests executed:

1. T6/T5/T3: persists every model-seen document and reads it back exactly, traceable to its determination
2. T4: the stored hash is the SHA-256 of the stored text — checked by the database, not only by the writer
3. reads are ownership-scoped: another user sees none of this determination's sources
4. the schema admits only MODEL_SEEN_SOURCE captures and one row per (determination, position)

### Teardown

The test environment was removed using the repository's documented teardown procedure:

```bash
docker compose -f docker-compose.test.yml down -v
```

### Docker / container note

* Docker Desktop remained running after the test.
* Two unrelated containers, `omniroute` and `sed_postgres`, started automatically with Docker Desktop. They were not part of T6 and were not touched by the T6 execution.
* Only the repository test container `acos_postgres_test` (and its compose network) was removed during teardown.

---

# §2. T6.1–T6.7 results

| Criterion                      | Result   | Evidence |
| ------------------------------ | -------- | -------- |
| **T6.1 Migration**             | **PASS** | Migration `0028` was exercised; its application is evidenced by the integration test's use of the `category_plausibility_source_documents` table and the database constraints exercised during T6. No separate migration log was observed. |
| **T6.2 Persistence**           | **PASS** | Model-seen source documents were persisted with their determination. |
| **T6.3 Exact retrieval**       | **PASS** | Retrieved text, label and URL matched the captured values exactly, including a double space, curly quotes and `✓`. |
| **T6.4 Hash integrity**        | **PASS** | The test recomputed `sha256(convert_to(source_text,'UTF8'))` in PostgreSQL and confirmed it matched each stored hash. |
| **T6.5 Source classification** | **PASS** | `MODEL_SEEN_SOURCE` accepted; `FACILITATOR_SNAPSHOT` rejected by the database constraint; a duplicate `(determination_id, document_index)` row rejected. |
| **T6.6 Traceability**          | **PASS** | Sources were retrieved by determination ID through the repository, and ownership-scoped retrieval was verified. |
| **T6.7 Multiple sources**      | **PASS** | Two source documents were retained separately at positions 0 and 1. |

### Overall T6 result

**T6: PASS — T6.1–T6.7: ALL PASS**

---

# §3. Migration 0028 coverage

Migration `0028` creates `category_plausibility_source_documents`, the persistence structure for model-seen source documents.

The integration harness creates a temporary database for the suite. During T6 the test:

* wrote to `category_plausibility_source_documents`;
* read from that table;
* exercised its database constraints (capture-kind CHECK and the `(determination_id, document_index)` unique index);
* recomputed stored-text hashes in PostgreSQL.

Migration `0028` was therefore **exercised**, and its application — sufficient for the test — is evidenced by that table use and those constraints firing.

No migration log was separately observed. No production database was touched.

---

# §4. Exactness

T6 confirms, at database level:

```text
text retrieved from PostgreSQL
        =
captured text (as reported through the capture hook)
```

The fixture deliberately contained representation-sensitive content (a double space, curly quotation marks, the `✓` character), and the retrieved values matched exactly.

**T6 confirms the stored text matches the captured text exactly. That the capture matches what the model sees rests on the capture point in `researcher.ts` (D-1) and its unit tests, not on T6.**

The two relationships are distinct:

* **capture → persistence → retrieval** — tested by T6;
* **capture point → actual model/provider input** — depends on the implementation boundary in `researcher.ts` and its unit-test coverage. In T6 the documents were reported by the test's fake provider, not by the real capture path in a real provider. No unit tests were run as part of this T6 execution.

---

# §5. Database constraint and verification findings

T6 established that:

1. `MODEL_SEEN_SOURCE` is accepted, and the database CHECK constraint rejects any other capture kind (e.g. `FACILITATOR_SNAPSHOT`);
2. `(determination_id, document_index)` uniqueness is enforced by the database — a duplicate source position for a determination is rejected;
3. the stored hashes were confirmed, by a PostgreSQL-side recomputation, to be the SHA-256 of the stored text; **the schema itself enforces only the hash format** (64 lowercase hexadecimal characters). The schema does not enforce the correspondence between the stored text and its hash;
4. ownership-scoped reads do not expose another user's source documents.

These are implementation-level findings only. They do not constitute live-validation evidence.

---

# §6. Implementation deviations (recorded by the earlier audit)

D-1 and D-4 were recorded by the earlier M-2 implementation conformance audit (`PATH_2_CATEGORY_PLAUSIBILITY_A11_P1_M2_IMPLEMENTATION_CONFORMANCE_AUDIT.md`, §4). They were **not** newly established by T6. They are restated here from that audit, and neither is resolved or waived by this update.

## D-1 — `researcher.ts` implementation touch

Per the earlier audit: `researcher.ts` was changed although it was not explicitly named in the implementation authorization, because it is the point at which the post-parse representation of the source documents exists. Capturing earlier (in the providers) would preserve a representation different from the text supplied downstream — the pre-trim value.

**Status:** RECORDED — NOT RESOLVED, NOT WAIVED. Product Owner acknowledgement remains as set out in the earlier audit.

## D-4 — Determination without captured sources

Per the earlier audit: a determination can exist without captured sources in these cases:

1. rows written before migration `0028`;
2. runs where the `categoryPlausibility` dependency is omitted;
3. providers that do not implement the capture hook, including test fakes.

The earlier audit also records that the real providers throw `InsufficientEvidenceError` rather than research with zero documents, and that an explicit "no source supplied" record was not added. This does not narrow D-4 to the live-provider case.

**Status:** RECORDED — NOT RESOLVED, NOT WAIVED. Product Owner acknowledgement remains as set out in the earlier audit.

---

# §7. Repository safety

The T6 execution did not modify repository artifacts.

| Check                             | Result |
| --------------------------------- | ------ |
| HEAD before/after                 | **UNCHANGED — `5992b82`** |
| Pre/post `git status --porcelain` | **IDENTICAL — 124 entries** |
| Tracked diff checksum             | **UNCHANGED — `aa07cdc…`** |
| Staged changes                    | **NONE** |
| `git diff --check`                | **CLEAN** |
| Generated repository artifacts    | **NONE** |
| Temporary test database/container | Removed during teardown |

No application, test, migration, configuration, governance, or participant-facing file was changed by the T6 execution.

---

# §8. No-live-provider boundary

No live research provider was called during T6. The integration test used its built-in fake provider.

T6 provides **no evidence** concerning live provider behavior, live source retrieval, live source fidelity, live MATCH/MISMATCH/UNKNOWN results, participant behavior, provider neutrality, provider credentials, or D11 live readiness.

---

# §9. What T6 proves

Against a real PostgreSQL database, T6 establishes:

1. real-PostgreSQL persistence of captured source text;
2. exact storage and retrieval of captured text;
3. PostgreSQL-side hash recomputation matching each stored hash (the schema enforces only hash format);
4. database constraints: `MODEL_SEEN_SOURCE` capture kind and `(determination_id, document_index)` uniqueness;
5. source-to-determination traceability;
6. ownership isolation of retrieval;
7. multiple-source persistence without overwriting.

This satisfies the **database-level T6 verification requirement** of the M-2 implementation authorization.

---

# §10. What T6 does not prove

T6 does not establish:

* that a real provider receives exactly the captured text;
* live provider behavior;
* live source fidelity;
* §6.3 substantive validation (E3);
* §6.4 live spot-check evidence (E2);
* captured-source validation-session evidence (E1);
* participant validation;
* provider neutrality;
* D11 readiness;
* A-11 closure.

---

# §11. A-11 status

**A-11 remains OPEN.**

A-11 is not defined as "the persistence mechanism works." Its remaining closure evidence must demonstrate actual captured source material and the corresponding §6.3 / §6.4 checks under the authorized validation process. The technical implementation enables that evidence; it does not substitute for it.

---

# §12. Authority boundary

This document grants no additional authority. In particular:

* It does not authorize live provider calls.
* It does not authorize participant validation.
* It does not authorize further implementation.
* It does not close A-11.
* It does not modify D11-H, F1-D, D0–D11, the participant-facing instrument, or the A-12 Companion Record.
* **F-1:** NOT AUTHORIZED outside the specifically authorized M-2 implementation scope.
* **Provider-neutrality validation:** NOT AUTHORIZED.

---

# §13. Final disposition

**A11-P1:** M-2 SELECTED
**M-2 implementation:** TECHNICALLY IMPLEMENTED
**T6:** **PASS**
**T6.1–T6.7:** **ALL PASS**
**Migration 0028:** EXERCISED — application evidenced by table use and constraints during T6; no migration log observed
**D-1:** RECORDED DEVIATION (earlier audit) — not resolved
**D-4:** RECORDED DEVIATION (earlier audit) — not resolved
**Repository safety:** PASS
**Live provider calls:** NONE

**A-11:** **OPEN**
**F-1:** **NOT AUTHORIZED** outside the authorized M-2 implementation scope
**D11:** **NOT READY FOR LIVE VALIDATION**

Any next A-11 work, if separately authorized, concerns the E1/E2/E3 evidence package rather than further database implementation.
