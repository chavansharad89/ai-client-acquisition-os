# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Implementation Authorization Decision Preparation

**Record ID:** `PDEF4-PCG4-TCMATCH-IMPL-AUTH-PREP-001`
**Date:** 2026-10-05
**STATUS: PREPARATION ONLY — NO IMPLEMENTATION AUTHORIZATION GRANTED**

---

## 1. Governing chain (read in full this session; file + SHA-256)

| # | File | Record ID | SHA-256 |
|---|---|---|---|
| 1 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_PRODUCT_OWNER_DECISION.md` | `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` | `61ac1ada3fd29272f789b569047f6fb707252df2d1e82691402d9b4dc45c4eec` |
| 2 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md` | `PDEF4-PCG4-ED-DEC-001` | `1f16a37323f9a77850023207e31f5e6db51c07ddae00d6cf498c768a614d263f` |
| 3 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION.md` | `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001` | `02af7f095c6d4e3309e5dc75f53424a76ca795aaf468a6ab7c025e46ee48ed54` |
| 4 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_PREPARATION.md` | — | `dc556170189a9c4b0fa13e3ca24672a4e2315bd8a0e146753b019d97023bfd79` |
| 5 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION_PREPARATION.md` | `PDEF4-PCG4-TCMATCH-TECHDESIGN-PREP-001` | `615feee101920038796e3d6fa0a968640acd132c621caa501fbda6a955c1d65e` |
| 6 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION_QUESTIONNAIRE.md` | `PDEF4-PCG4-TCMATCH-TECHDESIGN-QUESTIONNAIRE-001` | `ef703275c5ea99bd5d5bd5b913cfe1120df739bb348ca597fe85ea85876a9e3c` |
| 7 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_DECISION_PREPARATION.md` | `PDEF4-PCG4-TCMATCH-MECH-PREP-001` | `ebaec5093dc9d3647da6311dadd535bcc24e4037a83a0744f425512d323b74e2` |
| 8 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_DECISION_QUESTIONNAIRE.md` | `PDEF4-PCG4-TCMATCH-MECH-QUESTIONNAIRE-001` | `12f94822e6770344d241a45cd5e9f18335beec32cb7ca7b2a6dd6e0916a443d6` |
| 9 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md` | — | `b206aeba6896fd59638552251e366d12bca0bbd2e07b6b6620f490c756b4058a` |
| 10 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` | `PDEF4-PCG4-PO-DEC-001` | `84db9339765c209cc4ed8ad9319400dd3f1e359c6f62e02afd9aecca56a6484d` |
| 11 | `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` (structural precedent, PDEF-4 W-1..W-16) | — | `af13cb82f3a34dc3be86f2be79080de54dad57291ea4fcbdf66ecdc754f4b4f2` |
| 12 | `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md` (structural precedent) | — | `dda60e4193e906b04ec45706b348a098447ee134451106121def1ff9210327f7` |

Baseline verified before writing: `git rev-parse HEAD` → `af9ede93830f5e3e611195dc2451a470364def74`. `git status --short`
showed **81** pre-existing lines, **0** staged. No source/schema/migration/test/config file was read with intent
to modify.

Fresh repository evidence read in this session (not re-derivation of the above): `packages/core-research/src/service.ts`
(full), `packages/core-launch-gates/src/pcg4.ts` (full), `packages/core-qualification-equivalence/src/rules.ts`
(full), `packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql`,
`packages/db/prisma/migrations/0028_category_plausibility_source_documents/migration.sql`,
`packages/core-payments/src/orderRepository.ts` (unique-violation handling, lines 48-200), a repo-wide grep for
`23505` and for `P2002`/unique-constraint handling, a repo-wide grep for importers of `@acos/core-qualification-equivalence`
and `@acos/core-research`, and a directory listing of `packages/core-research/src/`.

---

## 2. Resolution of the 4 residual items

### 2.1 TD-10 transaction scope

**Evidence.** `packages/core-research/src/service.ts::runResearchForOwner` (lines 133-155) executes, today,
strictly sequentially with no transaction wrapper of any kind:
```
const superseded = await deps.signals.supersedePrevious(prospect.id, now);
const signals = await deps.signals.saveSignals(prospect.id, signalInputs, now);

if (deps.categoryPlausibility) {
  ...
  await deps.categoryPlausibility.supersedePrevious(search.id, prospect.id, now);
  await deps.categoryPlausibility.save(..., now, toCapturedSourceDocuments(capture.supplied));
}
```
Each of the four awaited calls (`signals.supersedePrevious`, `signals.saveSignals`, `categoryPlausibility.supersedePrevious`,
`categoryPlausibility.save`) is its own independent round-trip; a crash between any two leaves partial state (e.g.
signals superseded+saved but category-plausibility not yet superseded). No `prisma.$transaction` or equivalent
`withTransaction` helper is used anywhere in this file, and a repo-wide search found no shared
`withTransaction`/`runInTransaction` utility used by this package at all — `core-payments/webhookPgStore.ts` is the
only package in this repo that opens an explicit `BEGIN`/`COMMIT`/`ROLLBACK` client transaction, and it does so
locally inside its own module, not via a shared cross-package helper `core-research` could simply import.

**Options for where the new write fits (bounded by TD-10's existing "Option A" selection — non-transactional,
matching the existing pattern):**
- **Option A (selected by TD-10, confirmed here as the only in-scope option):** append a fifth sequential,
  non-transactional `await` pair — `deps.targetCustomerMatch.supersedePrevious(search.id, prospect.id, now)` then
  `deps.targetCustomerMatch.save(...)` — guarded by its own `if (deps.targetCustomerMatch)` block, placed after the
  existing `categoryPlausibility` block (or independently, since the two blocks do not read each other's state).
  Consequence: a crash between the target-customer-match supersede and save leaves that one determination
  inconsistent in exactly the same way the existing `signals`/`categoryPlausibility` writes already can — no new
  failure mode is introduced, the existing one is reproduced once more. TD-8's partial unique index already
  guarantees no *duplicate current row* can result even under this non-transactional pattern (a second concurrent
  insert attempt will hit the constraint, see §2.3) — only partial-progress-on-crash, not duplication, is the
  residual risk, and it is identical in kind to the risk the existing two writes already carry today.
- **Option B (explicitly NOT decided here, flagged for a separate decision):** wrap all five writes (signals,
  category-plausibility, target-customer-match) in one shared DB transaction. This would be a genuine behavior
  change to two already-shipped, already-tested determination families, which no governing record in this chain
  authorizes as in scope for this task. Flagged per TD-10 §5's own instruction; not decided here.

**Does this require a new product-policy decision?** No — TD-10 already made this exact selection (Option A) as a
binding engineering-design decision. This section documents *why* Option A is correct against the actual code (the
file has no transaction wrapper to extend, and no shared helper exists to introduce one cheaply) rather than
re-deciding it.

### 2.2 NO_MATCH sentinel

**Evidence.** `packages/core-qualification-equivalence/src/rules.ts::evaluateTargetCustomerMatch` (lines 36-55):
```ts
if (subject.observedTargetCustomer === null) { ... satisfied: 'UNKNOWN' ... }
const satisfied = normalise(subject.observedTargetCustomer) === normalise(snapshot.targetCustomer);
```
where `normalise(value) = value.trim().toLowerCase()` (line 11-13). Three branches exist today: `null` →
`'UNKNOWN'`; non-null and `normalise(observed) === normalise(targetCustomer)` → `satisfied: true`; non-null and
unequal after normalisation → `satisfied: false`. `pcg4.ts` line 105 currently hardcodes `observedTargetCustomer:
null`, always taking the `UNKNOWN` branch.

**Concrete, mechanical resolution.** `pcg4.ts`'s boundary translation (TD-3) must map:
- `result = 'MATCH'` → `observedTargetCustomer = row.search_target_customer` (the Search's own snapshot string
  already selected in `Pcg4Row`) — trivially passes `normalise` equality, `satisfied: true`.
- `result = 'NO_MATCH'` → `observedTargetCustomer` = a **non-null literal string constant** that is guaranteed to
  `normalise()` differently from *any* real `target_customer` value. Because `normalise` only trims and
  lowercases, any string containing a character that trimming/lowercasing cannot remove or equalize away is
  sufficient — e.g. a constant containing a control character or a `\u0000`-prefixed/suffixed marker, or (simplest,
  matching this repo's existing sentinel conventions such as `capture_kind`'s fixed-literal CHECK constraints) a
  fixed ALL-CAPS literal with an illegal-for-free-text character, such as `'\u0000__PCG4_NO_MATCH_SENTINEL__\u0000'`.
  The exact literal is an implementation detail (TD-3/§5 of the Technical Design Decision explicitly leaves it
  open); this preparation record fixes only the *requirement* — it must survive `trim()`+`toLowerCase()` and
  remain inequal to every possible normalised `target_customer` value — and recommends the `\u0000`-wrapped form
  specifically because a real user-authored `targetCustomer` free-text field (per `PDEF4-PCG4-PO-DEC-001` §7,
  these are user-authored strings) cannot contain a NUL byte, making collision structurally impossible rather than
  merely improbable.
- `result = 'NOT_YET_OBSERVED'` or row absent → `observedTargetCustomer = null` → existing `UNKNOWN` branch,
  unchanged.
- **Malformed/ambiguous model output:** per TD-14/TC-MATCH-9, any malformed or verification-failing model output
  must resolve, at the determination-write layer, to a stored `result = 'NOT_YET_OBSERVED'` row (or no row, if
  failure occurs before a row can be constructed) — never to `'NO_MATCH'` and never to a thrown error. Because
  `pcg4.ts`'s translation function only ever receives the three already-validated enum values or row-absence (the
  `result` column's own `CHECK (result IN ('MATCH','NO_MATCH','NOT_YET_OBSERVED'))` constraint, per TD-7, makes a
  fourth value impossible to persist), the translation function itself needs no defensive "malformed" branch — the
  fail-soft guarantee is enforced upstream, at the evaluator/write layer (TD-14), not by `pcg4.ts`. This
  preparation record states that guarantee explicitly so it is not silently assumed.

**Does this require a new product-policy decision?** No — this is a mechanical mapping choice within the space
TD-3 already bounded ("a value that normalizes differently... exact literal left to implementation"). No new
product semantics are introduced.

### 2.3 Concurrent unique-index violation

**Evidence.** A repo-wide grep for Postgres error code `23505` found **zero** matches anywhere in `packages/`,
`apps/`, or `tests/` — this repo has no existing raw-SQL-level unique-violation handling precedent. The actual
existing precedent operates one layer up, at the Prisma-client level: `packages/core-payments/src/orderRepository.ts`
lines 149-162 defines `isPrismaUniqueConstraintError` (checks `err.code === 'P2002'` structurally, no hard
import-time dependency on `@prisma/client`'s generated error classes) and lines 171-199 catch exactly that error
in `create()`, re-throwing a dedicated `UniqueConstraintViolationError(target, cause)` that preserves the
violated-column target and the original error as `.cause`; `createOrder.ts` then catches that specific error type
and self-heals by re-reading the row the other concurrent request just inserted (`findByIdempotencyKey`), rather
than treating it as a generic database failure. Separately, `core-payments/webhookPgStore.ts` uses
`ON CONFLICT ... DO NOTHING` at the raw-SQL layer for its own dedupe tables — a different, equally-valid Postgres
idiom, but one that silently drops the conflicting row rather than distinguishing "retry-safe conflict" from
"genuine failure," which is less suited here because TD-8's partial unique index is enforcing a *supersede*
invariant (at most one current row), not a pure dedupe-and-drop.

**Deterministic behavior for the new write (bounded resolution, not a new mechanism).** The repository function
backing `targetCustomerMatch.save()` (per TD-7's table, TD-8's partial unique index on
`(search_id, prospect_id) WHERE superseded_at IS NULL`) must, on insert:
1. Catch a unique-constraint violation specifically on that partial index (mirroring `orderRepository.ts`'s
   `isPrismaUniqueConstraintError`/`UniqueConstraintViolationError` pattern structurally — checking the Prisma
   `P2002` code and the violated index's `target`/constraint name, not catching every error indiscriminately).
2. Treat that specific, identified violation as an **expected concurrency conflict, not a genuine database
   failure**: it means another concurrent `runResearch` call for the same `(search_id, prospect_id)` pair already
   superseded-and-inserted a newer current row between this call's `supersedePrevious` and `save` steps (the exact
   race TD-8 was designed to make impossible to observe as *two* current rows). The correct, retry-safe response is
   to treat this call's own determination as superseded-on-arrival: either (a) re-run `supersedePrevious` once and
   retry the insert (now guaranteed to succeed, since the index no longer has a conflicting current row once this
   call's own prior row — if any — is also marked superseded) or (b) simply discard this call's own write as moot,
   since a newer determination already exists. Both are retry-safe because `supersedePrevious`'s existing
   semantics are explicitly idempotent ("a no-op if already superseded," per TD-11) — this preparation record does
   not select between (a)/(b) as that is implementation-level, not policy-level, but both keep the invariant
   "exactly one current row, never a duplicate" intact.
3. Any *other* database error (connection failure, constraint violation on a *different* column, syntax error,
   etc.) is **not** reclassified as a concurrency conflict — it propagates to the same fail-soft boundary TD-14
   already establishes (the `researcher.ts`/`fallbackResearchProvider.ts`-style failure handling), resolving the
   overall determination to `NOT_YET_OBSERVED` (TC-MATCH-9), never crashing the research pipeline, but also never
   silently masquerading a real failure as "someone else already wrote it."

**Does this require a new product-policy decision?** No — TD-8 already decided the index exists specifically so
a concurrent write "fails at the database with a constraint violation rather than silently producing two current
rows," and explicitly deferred "handling that rare constraint-violation error... to the future implementation-
authorization decision." This section performs that deferred, but still mechanical, resolution using
`orderRepository.ts`'s existing structural pattern — it introduces no new product semantics.

### 2.4 Freshness

**Already decided, not reopened** (`PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` TC-MATCH-8: "No expiry"). Concrete
implementation honoring this: **no TTL column, no cron job, no background invalidation/expiry worker, no
read-time age check** is introduced anywhere in this workstream. A `target_customer_match_determinations` row,
once written with `superseded_at IS NULL`, remains the authoritative "current" determination for its
`(search_id, prospect_id)` pair **indefinitely** — `pcg4.ts`'s widened join (TD-13) reads it exactly as-is, with no
`observed_at`-based age filter, mirroring `category_plausibility_determinations`'s own current-by-partial-index
read pattern (migration 0027's `..._current_by_prospect_idx`), which likewise has no age filter. Staleness
protection is structural, not temporal: any new Research run for the same pair calls `supersedePrevious` (TD-11)
before inserting a fresh row, so the "current" row is always the most recent Research-time observation, not a
time-boxed one.

Fields that remain available for audit, per TD-7's column list (§3.7 of the Technical Design Decision): `observed_at`
(when this determination was computed), `superseded_at` (when, if ever, a later determination replaced it — `NULL`
while current), `model`/`provider`/`prompt_version` (TD-6, which model/version produced it), `created_at` (row
insert time), plus the TD-5 `*_source_documents` child table's `content_sha256`/`source_text` (replay: exactly what
the model saw) and TD-4's per-evidence `classification`/`quote`/`sourceUrl`/`sourceLabel` (what was cited). Together
these let a reviewer reconstruct, for any historical row (superseded or current), exactly when it was produced,
by what model/version, from what exact source text, and citing what exact evidence — satisfying TC-MATCH-10's
replay requirement without any expiry mechanism.

**Does this require a new product-policy decision?** No — TC-MATCH-8/PDEF4-PCG4-PO-DEC-001 already fixed "no
expiry" as policy; this section only documents the mechanical consequence (absence of any TTL/cron artifact) and
cites the available audit columns, per the task's explicit instruction not to reopen TC-MATCH-8.

---

## 3. Implementation workstream matrix

| Workstream | Status | Owning file/package | Dependencies |
|---|---|---|---|
| Migration 0036 (determinations table + TD-8 partial unique index) | Derived from decision (TD-7/TD-8/TD-9) | `packages/db/prisma/migrations/0036_target_customer_match_determinations/migration.sql` (new) | None upstream |
| Migration 0037 (source-document capture table) | Derived from decision (TD-5/TD-9) | `packages/db/prisma/migrations/0037_target_customer_match_source_documents/migration.sql` (new) | Migration 0036 (FK to determination id) |
| `target_customer_match_determinations` table shape | Derived (TD-7) | Migration 0036 | — |
| FKs (`search_id`→`searches.id`, `prospect_id`→`prospects.id`, cascade) | Derived (TD-7, mirrors 0027) | Migration 0036 | — |
| Partial unique index `(search_id, prospect_id) WHERE superseded_at IS NULL` | Already decided (TD-8) | Migration 0036 | — |
| Supersede-then-insert application pattern | Already decided (TD-11, reuses 0027/category-plausibility pattern) | New repository module in `@acos/core-research` (name TBD at implementation time, e.g. `targetCustomerMatchRepository.ts`) | Migration 0036 |
| Source-hash binding (`content_sha256` over exact post-parse `source_text`) | Already decided (TD-5, reuses migration-0028 pattern exactly) | Migration 0037 + repository write path | Migration 0037 |
| `model`/`provider`/`prompt_version` metadata columns | Already decided (TD-6) | Migration 0036 | — |
| Array-of-findings model output schema | Already decided (TD-2) | New evaluator module in `@acos/core-research` (e.g. `targetCustomerMatch.ts`, parallel to `categoryPlausibility.ts`) | None upstream (model-call schema) |
| Contradictory-evidence handling (both quotes persisted, → `NOT_YET_OBSERVED`) | Already decided (TC-MATCH-6, TD-2/TD-4) | Same evaluator module | — |
| MATCH/NO_MATCH/NOT_YET_OBSERVED deterministic aggregation | Already decided (TC-MATCH-3/4/5, TD-2) | Same evaluator module | — |
| Fail-soft behavior across every failure mode | Already decided (TC-MATCH-9, TD-14) | Same evaluator module + `service.ts` insertion | `researcher.ts`/`fallbackResearchProvider.ts` existing machinery (reused, not modified in kind) |
| Retry/idempotency (supersede-then-insert, no new exactly-once mechanism) | Already decided (TD-11) | Repository module | Migration 0036 |
| Concurrency-conflict handling on the TD-8 index | **Resolved by this prep record (§2.3)**, mechanical, bounded by `orderRepository.ts` precedent — still requires the future decision to fix the literal implementation | Repository module | Migration 0036, TD-8 |
| Research-pipeline integration (new guarded block in `runResearchForOwner`) | Already decided (TD-10), confirmed against actual `service.ts` code by this prep record (§2.1) | `packages/core-research/src/service.ts` (modify) | Evaluator module, repository module |
| `pcg4.ts` `LEFT JOIN` + translation | Already decided (TD-3/TD-13) | `packages/core-launch-gates/src/pcg4.ts` (modify) | Migration 0036 |
| NO_MATCH sentinel literal value | **Resolved in requirement/form by this prep record (§2.2)** — still requires the future decision to fix the literal string constant in code | `packages/core-launch-gates/src/pcg4.ts` | TD-3 |
| Tests — 9 PO fixture categories + contradiction/replay/source-binding/concurrency/failure | Already decided (TD-15, TC-MATCH-11) | New `packages/core-research/src/targetCustomerMatch.test.ts`; extensions to `service.test.ts`, `pcg4.test.ts`; new repository-level test | All production workstreams above |
| Migration integration tests | Derived (mirrors existing `tests/integration/` pattern for prior migrations) | `tests/integration/` (new file, name TBD) | Migrations 0036/0037 |
| PCG-4 end-to-end real-Postgres test | Derived (mirrors `pcg4.test.ts`'s existing real-DB convention, per the "do not fix this by manufacturing a pass" note TC-MATCH-11(9) cites) | `packages/core-launch-gates/src/pcg4.test.ts` or `tests/integration/` | pcg4.ts change, migrations |
| Conformance evidence record | Still requires authorization (not yet written; this prep record is not it) | Future `..._IMPLEMENTATION_CONFORMANCE_RECORD.md` | Implementation-authorization decision |
| Acceptance-criteria content (per-workstream sentences) | Still requires authorization (TD-16 fixed only the *structural template*, not content) | Future implementation-authorization decision | All of the above |

**Counts:** already-decided = 10 (partial unique index, supersede-then-insert, source-hash binding, model/provider/
prompt_version columns, array-of-findings schema, contradiction handling, tri-state aggregation, fail-soft
behavior, retry/idempotency, research-pipeline insertion point/join). Derived (from decision + fresh repository
evidence, not newly decided) = 7 (migration 0036/0037 shape, table/FK details, evaluator/repository module
locations, migration-integration tests, E2E test). Resolved by this prep record within bounded scope = 2
(concurrency-conflict handling mechanics, NO_MATCH sentinel requirement). Still requires future authorization = 3
(concurrency-conflict literal implementation, NO_MATCH literal string constant, acceptance-criteria content/
conformance record).

---

## 4. Exact files to create/modify

**New files:**
- `packages/db/prisma/migrations/0036_target_customer_match_determinations/migration.sql`
- `packages/db/prisma/migrations/0037_target_customer_match_source_documents/migration.sql`
- `packages/core-research/src/targetCustomerMatch.ts` (evaluator: deterministic pre-processing, model-call schema,
  verification/aggregation — parallel to `categoryPlausibility.ts`)
- `packages/core-research/src/targetCustomerMatchRepository.ts` (repository interface + Postgres implementation —
  parallel to `categoryPlausibilityRepository.ts` + `categoryPlausibilityPgRepository.ts`; TD-15 does not name a
  separate `*PgRepository.ts` file explicitly but the existing pattern splits interface from Postgres
  implementation, so this is one derived, not newly-decided, filename choice)
- `packages/core-research/src/targetCustomerMatch.test.ts`
- A new repository-level test file for the TD-8 partial-unique-index/supersede behavior (exact path TBD at
  implementation time; the existing precedent for this kind of test lives alongside the repository module, e.g.
  `targetCustomerMatchRepository.test.ts`, or under `tests/integration/`)
- A migration-integration test under `tests/integration/` (exact filename TBD; existing precedent files for prior
  migrations in that directory were inspected but a definitive single naming convention was not found strongly
  enough to fix one here — left to implementation)

**Modified files:**
- `packages/core-research/src/service.ts` — add the new `deps.targetCustomerMatch?` dependency and the TD-10
  guarded insertion block in `runResearchForOwner` (after/alongside the existing `categoryPlausibility` block)
- `packages/core-research/src/service.test.ts` — extensions for the new insertion point/retry behavior
- `packages/core-launch-gates/src/pcg4.ts` — add the TD-13 `LEFT JOIN`, select `tcm.result`, replace the hardcoded
  `observedTargetCustomer: null` with the TD-3/§2.2 translation
- `packages/core-launch-gates/src/pcg4.test.ts` — extensions for the new join/translation behavior

**Files outside `core-research`/`core-launch-gates` found via the call-path trace — none requiring change:**
- `packages/core-launch-gates/src/index.ts` is the only file matching `@acos/core-research` import outside
  `pcg4.ts` itself; it was inspected and found to contain no import of `@acos/core-research` on closer grep (the
  earlier broad grep hit was `@acos/core-research` appearing only via `pcg4.ts`'s own module, not `index.ts`
  separately — re-verified: `index.ts` re-exports `pcg4`'s public surface only, no new coupling).
- `@acos/core-qualification-equivalence` is imported by exactly one file in this repository —
  `packages/core-launch-gates/src/pcg4.ts` — confirmed by a repo-wide grep. This directly confirms TD-3/TD-12's "no
  modification" selection is safe: there is no second call site that could be broken by, or that needs to account
  for, the new translation value.
- No other call site imports `pcg4.ts`'s `Pcg4Row` type or `evaluatePcg4` function besides its own test file
  (confirmed by grep for `pcg4\|evaluatePcg4` excluding the module itself — zero matches in `apps/`/`packages/`).
- `service.ts`'s exports (`runResearch`, `runResearchForOwner`, `listResearchSignals`,
  `getCategoryPlausibilityDetermination`, `scoreResearchedProspect`) are consumed by `apps/worker/src/searchWorker/`
  and `apps/web/src/server/clientFinderRepositories.ts` among others (per grep for `@acos/core-qualification` — a
  different, unrelated package name collision was ruled out; the actual `core-research` consumers were not
  re-enumerated exhaustively in this prep record beyond confirming `runResearchForOwner`'s *signature* is additive
  — a new optional `deps.targetCustomerMatch?` field, exactly mirroring how `deps.categoryPlausibility?` was added
  previously without breaking any existing caller that omits it). This additive-optional-dependency pattern is why
  no caller outside `core-research` itself needs modification.

---

## 5. Migration plan

**0036 — `target_customer_match_determinations`** (first):
- Columns (TD-7): `id` TEXT PK; `search_id` TEXT NOT NULL FK → `searches.id` ON DELETE CASCADE ON UPDATE CASCADE;
  `prospect_id` TEXT NOT NULL FK → `prospects.id` ON DELETE CASCADE ON UPDATE CASCADE; `target_customer` TEXT NOT
  NULL (denormalised snapshot, per 0027 precedent); `result` TEXT NOT NULL CHECK (`result` IN ('MATCH','NO_MATCH',
  'NOT_YET_OBSERVED')); `evidence` JSONB NOT NULL (array shape per TD-2/TD-4: each item
  `{classification, quote, sourceUrl, sourceLabel}`); `model` TEXT NOT NULL; `provider` TEXT NOT NULL;
  `prompt_version` TEXT NOT NULL; `observed_at` TIMESTAMP(3) NOT NULL; `superseded_at` TIMESTAMP(3) (nullable);
  `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP.
- Indexes: a non-unique `(search_id, prospect_id)` lookup index (mirrors 0027's historical-read index) **plus**
  the TD-8 partial unique index `CREATE UNIQUE INDEX "target_customer_match_determinations_current_idx" ON
  "target_customer_match_determinations"("search_id", "prospect_id") WHERE "superseded_at" IS NULL` (50 characters,
  within Postgres' 63-char limit per TD-7's own check).
- Backfill: none (additive-only, per DEC-006 convention already used by 0027/0028 — no existing row implies
  `NOT_YET_OBSERVED` by absence, never backfilled retroactively).
- Rollback: `DROP TABLE "target_customer_match_determinations"` (cascades nothing else, since 0037 depends on it,
  not vice versa — 0037 must be rolled back first if both are to be reverted).

**0037 — `target_customer_match_source_documents`** (second, depends on 0036's table existing):
- Columns, mirroring 0028 exactly: `id` TEXT PK; `determination_id` TEXT NOT NULL FK →
  `target_customer_match_determinations.id` ON DELETE CASCADE ON UPDATE CASCADE; `document_index` INTEGER NOT NULL
  CHECK (`document_index` >= 0); `source_label` TEXT NOT NULL; `source_url` TEXT NOT NULL; `source_text` TEXT NOT
  NULL; `content_sha256` TEXT NOT NULL CHECK (`content_sha256` ~ '^[0-9a-f]{64}$'); `capture_kind` TEXT NOT NULL
  CHECK (`capture_kind` = 'MODEL_SEEN_SOURCE') (or a TC-MATCH-specific literal, TBD); `extraction_method` TEXT NOT
  NULL; `fetched_at` TIMESTAMP(3) NOT NULL; `created_at` TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP.
- Unique index: `(determination_id, document_index)`, mirroring 0028.
- Backfill: none — determinations written before 0037 simply have no captured sources, exactly as 0028's own
  comment states for category-plausibility.
- Rollback: `DROP TABLE "target_customer_match_source_documents"` first (if reverting both), then 0036's table.
- Compatibility: both migrations are purely additive; no existing table, column, or index is altered, dropped, or
  backfilled by either.

---

## 6. Dependency graph (workstream-level)

```
Migration 0036 (table + partial unique index)
   ├──> Migration 0037 (source-document capture, FK to 0036's determination id)
   ├──> model/provider/prompt_version columns exist (TD-6, part of 0036)
   ├──> Repository module (supersede-then-insert, concurrency handling §2.3) ──> depends on 0036
   │        └──> Evaluator module (array-of-findings model call, verification, aggregation, TD-2/TD-4/TC-MATCH-6)
   │                 └──> Research-pipeline integration (service.ts new guarded block, TD-10)
   │                          └──> service.test.ts extensions
   ├──> pcg4.ts LEFT JOIN + TD-3/§2.2 translation ──> depends on 0036 (join key + result column)
   │        └──> pcg4.test.ts extensions
   ├──> targetCustomerMatch.test.ts (9 fixture categories + contradiction/replay/source-binding/failure) ──>
   │        depends on evaluator module + repository module
   ├──> Repository-level concurrency test ──> depends on 0036 + repository module (§2.3)
   ├──> Migration integration tests ──> depend on 0036 + 0037
   └──> PCG-4 end-to-end real-Postgres test ──> depends on pcg4.ts change + both migrations + pipeline integration
             └──> Conformance evidence record ──> depends on all of the above existing and passing
```

---

## 7. Test plan

| File | Covers |
|---|---|
| `packages/core-research/src/targetCustomerMatch.test.ts` (new) | TC-MATCH-11 fixture 1: clear positive → `MATCH`. |
| (same file) | Fixture 2: clear negative → `NO_MATCH` (symmetric bar, TC-MATCH-4). |
| (same file) | Fixture 3: insufficient evidence → `NOT_YET_OBSERVED`. |
| (same file) | Fixture 4: contradictory evidence (both sides verified) → `NOT_YET_OBSERVED`, both items persisted (TC-MATCH-6). |
| (same file) | Fixture 5: provider/evaluator failure and malformed/verification-failing output → `NOT_YET_OBSERVED`, never thrown, never `NO_MATCH` (TC-MATCH-9/TD-14). |
| (same file) | Fixture 6: confidence-non-gating — varying confidence, identical evidence → identical classification (TC-MATCH-7). |
| (same file) | Fixture 7: deterministic replay — identical persisted evidence/model output → identical aggregation on repeat (TC-MATCH-10). |
| (same file) | Fixture 8: supersession/history — later run supersedes prior row; prior row retained (ED-DEC-001 §7). |
| (same file) | Fixture 9: a test pinning current, deliberately limited behavior (mirrors `pcg4.test.ts`'s "do not fix this by manufacturing a pass" convention). |
| (same file) | Source-binding: `content_sha256`/`source_text` capture matches migration-0028 pattern exactly (TD-5). |
| `packages/core-research/src/targetCustomerMatchRepository.test.ts` or `tests/integration/` (new) | Concurrency: two concurrent writes racing on the TD-8 partial unique index resolve to exactly one current row, never two; the specific P2002/23505-class error is caught and handled per §2.3, not propagated as a crash. |
| `packages/core-research/src/service.test.ts` (extend) | TD-10 insertion-point behavior (guarded `deps.targetCustomerMatch?` block fires correctly, is skipped when the dependency is omitted) and TD-11 retry/supersede behavior. |
| `packages/core-launch-gates/src/pcg4.test.ts` (extend) | TD-13 join correctness and the §2.2 MATCH/NO_MATCH/NOT_YET_OBSERVED → `observedTargetCustomer` translation, including the NO_MATCH-sentinel-survives-`normalise()` property. |
| `tests/integration/` (new migration-integration test, name TBD) | Migrations 0036/0037 apply cleanly against a real Postgres instance; the partial unique index and FK cascade behavior are exercised for real (mirroring `tests/integration/support/pgOrderRepository.ts`'s real-DB-test-double convention, per `orderRepository.ts`'s own sandbox note). |
| PCG-4 end-to-end real-Postgres test (location TBD: `pcg4.test.ts` extension or `tests/integration/`) | The full numerator/denominator computation over real rows including a `target_customer_match_determinations` row, proving `evaluatePcg4` can now produce a non-structurally-zero numerator once a real `MATCH` exists. |

---

## 8. Acceptance criteria (per-workstream authorization-table format, per TD-16)

Structural template only (content to be written by the future implementation-authorization decision, per TD-16's
own explicit deferral — this record does not pre-write acceptance-criteria sentences, consistent with §5 of the
Technical Design Decision):

| Workstream | Governing-decision reference | Status | Acceptance-criteria line (to be written) |
|---|---|---|---|
| Migration 0036 | TD-7/TD-8/TD-9 | Pending future authorization | — |
| Migration 0037 | TD-5/TD-9 | Pending future authorization | — |
| Evaluator module | TD-1/TD-2/TD-4/TC-MATCH-1..7 | Pending future authorization | — |
| Repository module (incl. concurrency handling) | TD-8/TD-11, §2.3 of this prep record | Pending future authorization | — |
| `service.ts` insertion point | TD-10, §2.1 of this prep record | Pending future authorization | — |
| `pcg4.ts` join/translation (incl. NO_MATCH sentinel) | TD-3/TD-13, §2.2 of this prep record | Pending future authorization | — |
| Tests (all files in §7) | TD-15/TC-MATCH-11 | Pending future authorization | — |

---

## 9. Rollback/recovery considerations

- **Migration 0036:** `DROP TABLE "target_customer_match_determinations"` reverts cleanly if 0037 has not yet been
  applied (or is dropped first). No existing table/column is touched, so rollback carries zero risk to any other
  subsystem.
- **Migration 0037:** `DROP TABLE "target_customer_match_source_documents"` reverts cleanly; its FK is `ON DELETE
  CASCADE` from 0036's table, so dropping 0036 first would already remove 0037's rows, but not its table
  definition — both migrations' `down` steps should be explicit, not relied upon implicitly via cascade.
- **Evaluator/repository module:** pure addition; removing the files and the `deps.targetCustomerMatch?` field from
  `ResearchDeps` reverts `service.ts` to its exact current behavior, since the field is optional and the block is
  guarded (identical rollback shape to how `categoryPlausibility?` could be removed today).
- **`pcg4.ts` change:** reverting the `LEFT JOIN` and translation to the current hardcoded `observedTargetCustomer:
  null` is a pure code revert with no data-loss risk — the determinations table itself is untouched by a code-only
  rollback.
- **Partial unique index (TD-8):** if this index is ever found to be wrong (e.g., too strict), it can be dropped
  independently of the table via `DROP INDEX`, without requiring a full table rebuild.

---

## 10. Residual blockers (genuinely unresolved — not force-closed)

- The exact literal sentinel string for NO_MATCH (§2.2) is bounded (must survive `trim()+toLowerCase()` and never
  collide with a real `targetCustomer`) but not fixed to one final literal — left to implementation, as TD-3/§5
  explicitly directs.
- The exact choice between concurrency-conflict response (a) retry-the-insert vs. (b) discard-as-moot (§2.3) is
  bounded (both are correct and retry-safe) but not selected — this is an implementation-level choice the
  Technical Design Decision explicitly deferred, and this prep record does not force a selection beyond narrowing
  the two valid options.
- Exact test file path/name for the repository-level concurrency test and the migration-integration test are not
  fixed — this repo's `tests/integration/` directory does not show one single, unambiguous per-migration naming
  convention strong enough to commit to here without risking a mismatch against whatever convention the
  implementer actually finds most current at authorization time.
- TD-10's deferred transaction-scope question (whether to later wrap `signals`/`categoryPlausibility`/
  `targetCustomerMatch` writes in one shared transaction) remains explicitly open, per TD-10 §5 and confirmed again
  by §2.1 of this record — it requires its own, separate, future decision and is not resolved or force-closed
  here.
- Whether a freshness window could later be justified (TC-MATCH-8/§5) remains open, as that record itself states;
  not revisited here.
- Acceptance-criteria *content* and the conformance-evidence record itself do not exist yet; §8 of this record is
  structural only.

---

## 11. Explicit authorization boundary

**This record is preparation only.** It authorizes nothing. It does not create or modify any source, schema,
migration, test, or configuration file — the only file created by this task is this one. It does not grant any
implementation authorization, deployment authorization, release authorization, or launch authorization of any
kind. It does not modify any governing record listed in §1 — all were read-only in this session. It does not
change, reopen, or reinterpret any Product-Owner-level semantic decision (`PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`,
`PDEF4-PCG4-PO-DEC-001`) or any Engineering-design decision (`PDEF4-PCG4-ED-DEC-001`,
`PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001`) — where this record states a "resolution" (§2), it is either (a) a
mechanical/bounded resolution explicitly left to implementation by an already-binding decision, with no new
product policy invented, or (b) explicitly flagged as requiring a separate future decision, never silently decided
here. A future, separate implementation-authorization decision (structured per §8/TD-16) remains required before
any code, schema, migration, or test implementation work begins.

---

## 12. Baseline/git verification

Verified before writing this record: `git rev-parse HEAD` → `af9ede93830f5e3e611195dc2451a470364def74`;
`git status --short` → 81 pre-existing lines, 0 staged. No tracked source/schema/migration/test/config file was
read with intent to modify, and none was modified — only the governing `requirement/*.md` records and the actual
`packages/core-research/src/service.ts`, `packages/core-launch-gates/src/pcg4.ts`,
`packages/core-qualification-equivalence/src/rules.ts`, `packages/core-payments/src/orderRepository.ts`, and the
two existing migration SQL files were *read* (never edited) as fresh investigation evidence. This record is
verified again, identically, immediately after being written (see final report).
