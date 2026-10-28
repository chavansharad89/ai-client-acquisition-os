# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Technical Design Decision

**Record ID:** `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001`
**Date:** 2026-10-05
**STATUS: DECIDED — DELEGATED ENGINEERING AUTHORITY (ENGINEERING DESIGN DECISIONS ONLY)**

---

## 1. Governing inputs (file + SHA-256, via `shasum -a 256`)

| File | Record ID | SHA-256 |
|---|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_PRODUCT_OWNER_DECISION.md` | `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` | `61ac1ada3fd29272f789b569047f6fb707252df2d1e82691402d9b4dc45c4eec` |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md` | `PDEF4-PCG4-ED-DEC-001` | `1f16a37323f9a77850023207e31f5e6db51c07ddae00d6cf498c768a614d263f` |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION_PREPARATION.md` | `PDEF4-PCG4-TCMATCH-TECHDESIGN-PREP-001` | `615feee101920038796e3d6fa0a968640acd132c621caa501fbda6a955c1d65e` |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION_QUESTIONNAIRE.md` | `PDEF4-PCG4-TCMATCH-TECHDESIGN-QUESTIONNAIRE-001` | `ef703275c5ea99bd5d5bd5b913cfe1120df739bb348ca597fe85ea85876a9e3c` |

Baseline: `git rev-parse HEAD` → `af9ede93830f5e3e611195dc2451a470364def74` (verified before this record was
written). `git status --short` showed 80 pre-existing entries before this record was created, 0 staged. No
source, schema, migration, test, or config file was read with intent to modify, and none was modified. All four
files above were read in full in this session before this record was written; none was edited.

---

## 2. Delegated-authority provenance

Engineering decision authority for this one task — resolving TD-1 through TD-16 of
`PDEF4-PCG4-TCMATCH-TECHDESIGN-QUESTIONNAIRE-001` — was explicitly delegated by the human user to Claude (an AI
assistant acting under the user's explicit, session-scoped authorization). The human user had, in an earlier,
separate session, also exercised delegated Product Owner authority to produce `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`
(itself made by Claude under PO delegation, per that record's own §2/§7). **This record's TD-1..TD-16 selections
are Engineering-design decisions, made by Claude under Engineering delegation, and are a distinct act from, and
must not be conflated with, the upstream Product-Owner-level decisions** (`PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`,
`PDEF4-PCG4-PO-DEC-001`) or the upstream Engineering-design decisions (`PDEF4-PCG4-ED-DEC-001`), which were each
made under their own, separately-scoped delegations in their own sessions. No human reviewed or made these
specific TD-1..TD-16 selections before this record was written. This record must not be represented, cited, or
relied upon as a decision made directly by a human engineer or Product Owner.

---

## 3. TD-1 through TD-16 decisions

### TD-1 — Model input schema

**Selected: Option B — single-segment, company-level input.** The model call for `TARGET_CUSTOMER_MATCH` is given
the Search's raw `targetCustomer` string as one unit (not run through `parseTargetSegments`) plus the same
`sourceDocuments` list already supplied to the per-Prospect research call, and produces one Search-Prospect-level
verdict — not a per-segment ANY-match aggregate. This is issued as its own dedicated bounded model call, distinct
from the call that produces `categoryPlausibility` (Option C, call-sharing, is rejected — see rationale).

**Rationale:** `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` TC-MATCH-3/4/5 phrase `MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED` as
one verdict per `(search_id, prospect_id)` pair ("the Prospect's observed characteristics as the kind of customer
the Search's `targetCustomer` criterion names"), not as an ANY-match aggregate over sub-segments — segmentation is
a `categoryPlausibility`-specific concept (`parseTargetSegments`) with no stated basis for transferring to a
company-level match question. Issuing a separate call (rejecting Option C) keeps this signal's computation
structurally independent of category plausibility's, consistent with `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`
TC-MATCH-12's explicit choice not to reuse category plausibility's computed output — bundling the two into one
response schema would re-couple them operationally (shared failure/retry unit) even though their computed results
remain distinct, undermining the structural-independence intent TC-MATCH-12 already established.

### TD-2 — Model output schema, including contradictory-quote representation

**Selected: Option B — array-of-findings schema.** The new dedicated model call returns an array of 0, 1, or many
findings, each shaped `{ classification: 'MATCH' | 'NO_MATCH', quote: string, sourceUrl: string, sourceLabel:
string }`. The tri-state result is derived deterministically post-hoc: any `MATCH` finding + any `NO_MATCH`
finding (after verification) → contradictory → `NOT_YET_OBSERVED`, both retained; only verified `MATCH` findings →
`MATCH`; only verified `NO_MATCH` findings → `NO_MATCH`; no verified findings → `NOT_YET_OBSERVED`.

**Rationale:** `categorySegmentSchema` (Option A) was built to carry one verdict with 1–3 corroborating quotes and
has no structural slot for two simultaneously-opposing quotes — a genuine structural gap this record must not
silently inherit, per the task's explicit instruction to specifically address this limitation. An array (Option B)
is the most general shape (handles any number of opposing findings, not just exactly two, unlike Option D's fixed
two-slot shape) and maps directly onto `PDEF4-PCG4-ED-DEC-001` §6/§8's own description of the evidence column as
"an evidence column (JSONB array)" — Option B is the array-shaped interpretation of that already-fixed storage
description, not a new structural concept. Option C (two independent model calls) was rejected because it doubles
model-call cost for no stated benefit over a single call that can already emit multiple findings in one array.

### TD-3 — Classification enum / tri-state translation into `pcg4.ts`

**Selected: Option B — synthetic-string translation at the `pcg4.ts` boundary; `rules.ts` unmodified.**
`pcg4.ts` translates the stored tri-state `result` into a value for the existing `observedTargetCustomer: string |
null` parameter: `MATCH` → the Search's own `targetCustomer` string (the existing equality check in
`evaluateTargetCustomerMatch` then trivially passes, `satisfied: true`); `NO_MATCH` → a synthetic sentinel string
guaranteed to normalise differently from `targetCustomer` (exact literal left to implementation) so the existing
equality check yields `satisfied: false`, distinctly from the `UNKNOWN` branch; `NOT_YET_OBSERVED`/row-absent →
`null` (existing `UNKNOWN` branch, unchanged). `@acos/core-qualification-equivalence` is **not** modified.

**Rationale:** This is not a free engineering choice among A/B/C — `PDEF4-PCG4-ED-DEC-001` §8 already describes
this exact translation in outline as part of the binding, non-reopenable migration-shape description: "`MATCH`
maps to a value equal to the Search's own `target_customer` string..., `NO_MATCH` maps to a value that normalizes
differently from it, and `NOT_YET_OBSERVED`/row-absent maps to `null`." That sentence requires `NO_MATCH` to
produce a *non-null, non-matching* string (preserving `satisfied: false` as distinct from `UNKNOWN`), which is
Option B, not Option C (which the questionnaire frames as collapsing `NO_MATCH` and `NOT_YET_OBSERVED` into the
same `null`). Selecting Option B is therefore confirming and making concrete an already-fixed upstream decision,
not deciding it afresh. This also directly satisfies `PDEF4-PCG4-ED-DEC-001` §13's statement that
`core-qualification-equivalence`'s existing contract "is not expected to change."

### TD-4 — Evidence/provenance object schema

**Selected: Option B — add a `classification: 'MATCH' | 'NO_MATCH'` discriminator field** to each evidence item,
alongside the existing `quote`/`sourceUrl`/`sourceLabel` fields reused as-is from `evidenceSchema`.

**Rationale:** Directly required by TD-2's array-of-findings selection — each array element must self-identify
which side it supports so post-hoc aggregation (TD-2) and a human auditor reading the persisted evidence array
(satisfying `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` TC-MATCH-6's "contradiction itself is visible... rather than
hidden") can distinguish a `MATCH`-supporting finding from a `NO_MATCH`-supporting finding without re-deriving it.
No other new field is added; `quote`/`sourceUrl`/`sourceLabel` are reused verbatim per existing precedent.

### TD-5 — Structural/cryptographic binding of classification to source document

**Selected: Option A — reuse the exact migration-0028 pattern.** A dedicated `*_source_documents` child table,
keyed to the new determination row, storing `source_text` (exact post-parse text) and `content_sha256` (SHA-256 of
that exact text, computed by the writer before insert), with a unique `(determination_id, document_index)` index
— structurally identical to `0028_category_plausibility_source_documents`.

**Rationale:** This is proven, running, already-reviewed precedent that directly satisfies
`PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`'s binding "replay must be possible from persisted input/output/model-version
information" requirement. Option C (no capture table) was rejected because it conflicts with that binding
requirement on its face — it would make the exact text the model saw unrecoverable after the fact, never
re-verifiable against a frozen copy. Option B (span offsets) was rejected as unprecedented, added implementation
cost with no requirement in the governing records calling for span-level precision beyond "verified, verbatim,
on-document quote," which Option A's substring-verification-at-write-time plus frozen `source_text` already
satisfies.

### TD-6 — Model/provider/version metadata for replay/audit

**Selected: Option A — add `model`, `provider`, and `prompt_version` columns directly on the new determination
table**, scoped per-determination (one set of values per row, not per-invocation), mirroring `ai_usage_events`'
column names without reusing or joining to that table.

**Rationale:** The task's engineering principles explicitly require this gap to be addressed with a concrete
mechanism, since no existing table attaches model/provider/version metadata to a *determination* row (only
`ai_usage_events` attaches it to a *usage event*, which is not joinable 1:1 to a determination — its granularity
includes repair attempts and it is keyed to `prospect_id`, not to a specific signal). Option A is self-contained
and requires no new join path or correlation-by-timestamp guesswork (Option C, rejected as not a real replay
guarantee), and avoids inventing a join column neither table has today (Option B).

### TD-7 — Exact table/column names

**Selected table name: `target_customer_match_determinations`** (direct parallel to
`category_plausibility_determinations`). **Selected columns:** `id` (PK), `search_id` (FK → `searches.id`,
cascade), `prospect_id` (FK → `prospects.id`, cascade), `target_customer` (denormalised snapshot string, per 0027
precedent), `result` (`TEXT CHECK (result IN ('MATCH','NO_MATCH','NOT_YET_OBSERVED'))`), `evidence` (JSONB array,
per TD-2/TD-4 shape), `model` TEXT, `provider` TEXT, `prompt_version` TEXT (per TD-6), `observed_at`,
`superseded_at`, `created_at`.

**Rationale:** `target_customer_match_determinations` is the lowest-ambiguity match to the existing
`_determinations` naming family `PDEF4-PCG4-ED-DEC-001` already established for this signal; `target_customer_
matches` was rejected as less obviously parallel to that family, and the gate-named option was rejected as an
unprecedented new naming convention with no other table in this repo named after a PCG gate. **Index-length check
(required by the prep/questionnaire record):** the base table name is 37 characters; the longest index name this
record anticipates, `target_customer_match_determinations_current_idx` (TD-8), is 50 characters — within
Postgres' 63-character identifier limit with substantial margin, so no truncation risk at this name length.

### TD-8 — Append-only/supersede schema and uniqueness/idempotency enforcement

**Selected: Option B — a partial `CREATE UNIQUE INDEX ... ON target_customer_match_determinations (search_id,
prospect_id) WHERE superseded_at IS NULL`**, DB-enforcing "at most one current row per `(search_id, prospect_id)`
pair," in addition to (not instead of) the nullable `superseded_at`/supersede-then-insert application-code
pattern reused from 0027.

**Rationale:** The task's engineering principles explicitly instruct this record to decide, not silently inherit,
whether the 0027 precedent's known gap (a non-unique "current" index, with the invariant enforced only by
application-code ordering, never by the database) is reproduced here. Closing that gap costs only a small
migration-time addition and no application-code change, and directly serves the task's required instruction to
address this limitation concretely rather than reproduce it. A concurrent-write attempt that would violate the
invariant now fails at the database with a constraint violation rather than silently producing two "current" rows;
handling that rare constraint-violation error (e.g., retry-on-conflict) is an implementation detail left to the
future implementation-authorization decision, not fixed here.

### TD-9 — Migration shape for migration 0036

**Selected: Option B — two migrations**, mirroring the 0027→0028 precedent: `0036_target_customer_match_
determinations` (the determinations table, including `result`, `evidence`, `model`/`provider`/`prompt_version`,
and the TD-8 partial unique index), followed by `0037_target_customer_match_source_documents` (the TD-5 child
table: `source_text`, `content_sha256`, keyed to the determination row).

**Rationale:** The 0027/0028 precedent deliberately treated "determination" and "source-document capture" as
independently authorizable increments (0028's own migration comment ties it to a separate authorization). Keeping
that same split here preserves the option for a future implementation-authorization decision to authorize the
determinations table and the source-capture table as separately reviewable units, exactly as the precedent did,
rather than forcing them to be authorized atomically for no stated benefit.

### TD-10 — Research-pipeline insertion point and transaction boundary

**Selected: Option A — append into the same `if (deps.X)`-guarded block style**, as a third determination type
guarded by its own `deps.targetCustomerMatch` dependency flag, in the same non-transactional, sequential-`await`
style as the existing `signals`/`categoryPlausibility` writes in `service.ts`'s `runResearch`.

**Rationale:** Option B (wrapping the whole write sequence — signals, category plausibility, and target-customer
match — in a shared DB transaction) would hardcode a transactionality change to two *other*, already-shipped
determination families that neither `PDEF4-PCG4-ED-DEC-001` nor `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` names as in
scope for this task — per the task's own instruction not to decide a new cross-cutting policy beyond what was
PO-decided, this is flagged as an open dependency (§5), not quietly decided here. Option A is the minimal-diff
choice that matches existing precedent exactly; TD-8's partial unique index already provides a DB-level backstop
against the specific race condition even without a full transaction wrap, which reduces the practical urgency of
Option B without resolving its scope question.

### TD-11 — Retry/idempotency semantics for a retried research run

**Selected: Option A — reuse the exact category-plausibility pattern as-is.** A retried `runResearch` call always
supersedes the prior row (a no-op if already superseded) and inserts a new one; no idempotency key or
exactly-once detection is introduced.

**Rationale:** This matches existing, working precedent exactly and introduces no new mechanism. Option B
(idempotency-key-based exactly-once detection) and Option C (time-window/in-flight lock) would each add a new
cross-cutting mechanism with no local precedent and no stated business requirement for exactly-once semantics
specifically for this signal — the governing records require fail-soft and replay, not deduplication of retried
runs, so introducing one here would exceed what was asked.

### TD-12 — `core-qualification-equivalence` integration: does it require modification?

**Selected: Option B — no modification.** `@acos/core-qualification-equivalence` (`rules.ts`, `types.ts`,
`evaluator.ts`) is untouched; all tri-state-to-string translation happens at the `pcg4.ts` boundary, per TD-3.

**Rationale:** Identical reasoning to TD-3 — `PDEF4-PCG4-ED-DEC-001` §8/§13 already fixes this translation as a
`pcg4.ts`-boundary concern and already states `core-qualification-equivalence`'s contract "is not expected to
change." TD-3 and TD-12 are the same underlying question asked from two angles and are answered consistently here.

### TD-13 — `pcg4.ts` join shape and ED-11's "single joined query" tension

**Selected: Option A — widen the existing single query.** Add `LEFT JOIN target_customer_match_determinations tcm
ON tcm.search_id = s.id AND tcm.prospect_id = p.id AND tcm.superseded_at IS NULL` directly into `pcg4.ts`'s
existing `LEFT JOIN` chain, select `tcm.result`, and translate it (per TD-3) into
`observedTargetCustomer` in place of the hardcoded `null`.

**Rationale:** This is the option that most literally satisfies the already-binding ED-11 decision ("one single
joined query gathers every raw fact this needs") cited in `pcg4.ts`'s own comment. Option B (a separate query)
conflicts with ED-11 on its face. Option C (a batched second query) was not selected because Option A is directly
available without any stated obstacle — the new table's join key (`search_id`, `prospect_id`) is already present
in `pcg4.ts`'s existing row shape, so widening the existing query adds one join clause with no new query-plan
complexity class, and keeps the "single query" property ED-11 fixed intact rather than opening the question of
whether ED-11 extends to tables it did not anticipate.

### TD-14 — Malformed/ambiguous model output and failure/retry handling

**Selected: Option B — a dedicated failure path, implemented by parameterizing/reusing the existing
`researcher.ts`/`fallbackResearchProvider.ts` orchestration machinery for the new, independent bounded call**
selected at TD-1 (not by writing new retry/backoff/repair/fallback logic from scratch).

**Rationale:** Because TD-1 selected a dedicated second model call (not call-sharing with category plausibility),
Option A ("reuse the identical machinery as-is," meaning as part of the *same* call) does not apply literally —
there are now two independent bounded calls. However, `researcher.ts`'s retry/backoff/repair/fallback logic is
already generic over `LeadResearch`-level calls, not hardcoded to one specific call site, so the correct
engineering answer is to invoke that same generic machinery a second time for the new call, rather than duplicate
or reinvent it. This preserves the fail-soft-to-`NOT_YET_OBSERVED` behavior `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`
requires uniformly across every failure mode (provider failure/timeout, evaluator failure, malformed/
verification-failing output, missing source documents), without introducing a new, untested retry implementation.

### TD-15 — Test architecture

**Selected: Option A — a new dedicated file**, `targetCustomerMatch.test.ts` (parallel to
`categoryPlausibility.test.ts`), covering the deterministic pre/post-processing functions, all 9
`PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` TC-MATCH-11 fixture categories, and the contradictory-evidence →
`NOT_YET_OBSERVED` case explicitly — plus targeted extensions to `service.test.ts` (TD-10/TD-11 insertion-point
and retry behavior), `pcg4.test.ts` (TD-13 join/translation behavior), and a new repository-level test covering
the TD-8 partial-unique-index/supersede behavior. Option C's cross-package addition is **not** needed, since
TD-3/TD-12 selected no modification to `@acos/core-qualification-equivalence`.

**Rationale:** A dedicated file keeps this signal's test surface (owned by `@acos/core-research` per
`PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` TC-MATCH-12) clearly separated from `categoryPlausibility.test.ts`'s own
concerns, avoiding Option B's risk of conflating two independently-governed signals' test coverage in one file,
while still extending the three sibling files whose production code also changes (service, pcg4, repository).

### TD-16 — Acceptance criteria / implementation-release gates

**Selected: Option A — a per-workstream authorization table**, structurally following
`CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`'s W-1..W-16 pattern exactly (named governing-
decision reference, Authorized/Blocked status, explicit numbered acceptance-criteria line per workstream), with a
matching future conformance record following `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md`'s
structure. Workstreams anticipated (content, not authorization, fixed here): migration 0036 (table+index),
migration 0037 (source-document capture), the new `core-research` evaluator module (model call, schema,
verification, aggregation per TD-1/TD-2/TD-4), the `service.ts` insertion point (TD-10/TD-11), the `pcg4.ts` join/
translation (TD-3/TD-13), and tests (TD-15).

**Rationale:** The resolved scope from TD-1 through TD-15 is not small — it spans two migrations, a new evaluator
module, a pipeline insertion point, and a gate-file join — making Option B's lighter single-note structure
disproportionate to the actual change size. Option A is the only structural precedent found in this record family
and is directly reusable without modification.

---

## 4. Explicit distinction: human Product-Owner decisions vs. this record's delegated-Claude engineering decisions

**Human-originated, Product-Owner-level (made by Claude under PO delegation in earlier sessions, not by this
record):**
- `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` (TC-MATCH-1..12): evidence source, mechanism shape, MATCH/NO_MATCH/
  NOT_YET_OBSERVED semantics, confidence-is-provenance-only, no freshness expiry, fail-soft, replay requirement,
  9 fixture categories, package ownership.
- `PDEF4-PCG4-PO-DEC-001` and `PDEF4-PCG4-ED-DEC-001` (ED-TC-1/3/4/6/8/9): dedicated Search-Prospect table,
  research-time timing, tri-state storage, quote/source-shaped provenance, append-only supersede, derived
  migration-shape outline including the §8 `pcg4.ts`-boundary translation description this record's TD-3/TD-12
  make concrete.

**This record's delegated-Claude engineering decisions (TD-1 through TD-16, §3 above):** model input/output
schema shape, contradictory-evidence representation, evidence-object discriminator field, source-document
binding mechanism, model/provider/version metadata columns, exact table/column names, DB-enforced uniqueness,
migration count/split, pipeline insertion point and transaction-boundary scope, retry/idempotency semantics,
`core-qualification-equivalence` scope confirmation, `pcg4.ts` join shape, failure-handling mechanism, test file
structure, and acceptance-criteria structural template.

---

## 5. Residual unresolved implementation details

- **TD-10's transaction-boundary scope question** (whether to also wrap the existing `signals`/
  `categoryPlausibility` writes in a shared transaction) is explicitly left open, not decided by this record — it
  would change behavior for two already-shipped determination families beyond what any governing record
  authorizes as in scope for this task. **This is flagged as an open dependency for a future, separate decision,
  not quietly resolved here**, per the task's instruction against introducing scope beyond what was PO-decided.
- The exact literal sentinel string value used for the `NO_MATCH` synthetic-string translation (TD-3) is not
  fixed here — only that it must normalise differently from any real `targetCustomer` value; the literal value is
  an implementation detail for the future implementation-authorization decision.
- The exact handling of a TD-8 partial-unique-index constraint-violation error on a genuine concurrent write
  (e.g., retry-on-conflict vs. propagate) is not fixed here.
- Whether a freshness window could later be justified for this signal (already left open by
  `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` §5) remains open; this record does not revisit it.
- Acceptance-criteria *content* (the specific sentence per workstream under TD-16's chosen structure) is not
  written here — only the structural template is fixed; content is left to the future implementation-
  authorization decision once actual code/migrations exist to describe.

---

## 6. Downstream implementation impact

This record resolves every open design question `PDEF4-PCG4-TCMATCH-TECHDESIGN-PREP-001` and
`PDEF4-PCG4-TCMATCH-TECHDESIGN-QUESTIONNAIRE-001` identified, except the one item explicitly flagged in §5 above.
It now unblocks a future, separate implementation-authorization decision to specify concrete acceptance criteria
(TD-16) and authorize: migration `0036` (determinations table) and `0037` (source-document capture table); a new
`@acos/core-research` evaluator module (model call, schema, verification, deterministic aggregation); the
`service.ts` insertion point; the `pcg4.ts` join and synthetic-string translation; and the test files named in
TD-15. No such authorization is granted by this record (§7).

---

## 7. Explicit statement

**This record authorizes ENGINEERING DESIGN DECISIONS ONLY.** It resolves TD-1 through TD-16 as engineering-design
decisions. It does not create or modify, and is not itself, any code, schema, migration, test, or configuration
file — the only file created by this task is this one. **No deployment, release, production rollout, or launch of
any kind is authorized, implied, or claimed by this record.** A future, separate implementation-authorization
decision remains required before any code, schema, migration, or test implementation work begins.

---

## 8. Provenance statement (restated)

This decision record was produced under Engineering decision authority explicitly delegated by the human user to
Claude (an AI assistant) for this task, and the sixteen selections in §3 were made by Claude under that
delegation. It is not, and must not be represented as, a decision made directly by a human engineer or Product
Owner.
