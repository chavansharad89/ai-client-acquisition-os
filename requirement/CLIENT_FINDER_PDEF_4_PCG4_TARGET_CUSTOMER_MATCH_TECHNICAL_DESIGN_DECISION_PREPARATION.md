# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Technical Design Decision Preparation

**Record ID:** `PDEF4-PCG4-TCMATCH-TECHDESIGN-PREP-001`
**Date:** 2026-10-05
**Type:** Preparation document only. No option is selected below. No code, schema, migration, or test is
changed by this document.
**Baseline HEAD at time of writing:** `af9ede93830f5e3e611195dc2451a470364def74`

---

## 0. Scope and binding inputs

This preparation exists to feed a future **Technical Design Decision** for implementing `TARGET_CUSTOMER_MATCH`
(PCG-4's currently-null `observedTargetCustomer` input to `@acos/core-qualification-equivalence`). It treats the
following as **already decided and non-reopenable**:

- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_PRODUCT_OWNER_DECISION.md`
  (`PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`) — evidence source, mechanism shape, MATCH/NO_MATCH/NOT_YET_OBSERVED
  semantics, confidence-is-provenance-only, no freshness expiry, fail-soft, replay, 9 fixture categories,
  package ownership `@acos/core-research`.
- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md`
  (`PDEF4-PCG4-ED-DEC-001`) — dedicated Search-Prospect table, research-time timing, tri-state storage,
  quote/source-shaped provenance, append-only supersede, derived migration shape.

Every point below is evidence + options + tradeoffs + dependencies + a labelled, non-binding analyst
recommendation. **No existing implementation pattern is treated as a foregone conclusion** — where a pattern
from `category_plausibility_determinations` or `categoryPlausibility.ts` is cited, it is cited as precedent
available for reuse, modification, or rejection.

---

## 1. Model input schema

**Evidence.** `packages/core-research/src/categoryPlausibility.ts` itself builds no prompt — the model-call input
is assembled in `packages/core-research/src/prompt.ts`. The relevant rendering (confirmed at
`packages/core-research/src/prompt.ts:31,44-55`):
- A fixed instruction block describing the per-segment task (MATCH/MISMATCH/UNKNOWN, cited-quote requirement,
  confidence 1-100 vs. exactly 0).
- `targetSegments` rendered as a numbered list (`input.targetSegments.map((segment, index) => \`${index + 1}. ${segment}\`)`),
  only when non-empty.
- `sourceDocuments` rendered from `input.sourceDocuments` (empty-array branch handled explicitly), which is the
  same source-document list every other OBSERVED claim in the research prompt is built against.

The deterministic pre-processing happens in `categoryPlausibility.ts:38-43` (`parseTargetSegments`), which splits
the Search's immutable `targetCustomer` string into segments **before** the model ever sees it — confirming
PO-DEC-001's "deterministic pre-processing" requirement is already precedented for a *different* signal
(category plausibility, not target-customer-match).

**Candidate options for `TARGET_CUSTOMER_MATCH` model input:**
- **Option A — mirror `categoryPlausibility` exactly:** segment-style input (reuse `parseTargetSegments` output,
  one call evaluating all segments at once) + the same `sourceDocuments` list.
- **Option B — single-segment, single-claim input:** the Search's raw `targetCustomer` (or PO-DEC-001's own
  definition of "the target customer" as one unit, not segmented) + source documents, producing one classification
  rather than per-segment ones — simpler if PO-DEC-001's MATCH/NO_MATCH/NOT_YET_OBSERVED trichotomy is meant to be
  a single Search-Prospect-level answer, not an ANY-match aggregate over segments.
- **Option C — reuse the *same* model call that already produces `categoryPlausibility`,** adding target-customer-
  match as an additional field on the same response object, avoiding a second bounded model call (relevant to
  point 10's transaction/idempotency discussion and to API-cost considerations) — but this conflicts with
  PO-DEC-001's "one bounded model call" language only if that phrase meant "one call per signal"; the phrase is
  ambiguous between "one call total" and "one call per determination," which this preparation flags as unresolved.

**Tradeoffs.** Option A reuses tested code and the segment-level ANY-match semantics already proven out for
category plausibility, but segments may not be the right unit for "is this prospect itself the target customer,"
which is a company-level judgment, not a market-segment judgment — segmenting may be a category-plausibility-
specific concept that does not transfer. Option B is semantically closer to "does this one company match" but
has no precedent in this codebase to reuse. Option C minimizes model calls/cost but entangles two independently
governed signals (`category_plausibility_determinations` vs. the new dedicated table from ED-DEC-001) in one
response schema and one failure/retry unit.

**Dependencies.** Depends on how PO-DEC-001's "deterministic pre/post-processing around one bounded model call"
is read — this preparation does not resolve that ambiguity.

**ANALYST RECOMMENDATION — NOT A DECISION:** Option B (single-segment, company-level input) more directly matches
PO-DEC-001's tri-state semantics (MATCH/NO_MATCH/NOT_YET_OBSERVED is phrased as one verdict, not an ANY-match
aggregate), but this is not a decision — the Technical Design Decision should explicitly confirm whether PCG-4's
`TARGET_CUSTOMER_MATCH` is a segment-level or company-level question before choosing an input shape.

---

## 2. Model output schema

**Evidence.** The model output for category plausibility is `categorySegmentSchema`
(`packages/core-research/src/schema.ts:190-277`): `{ fit: 'MATCH'|'MISMATCH'|'UNKNOWN', rationale: string|null,
evidence: evidenceSchema[] (max 3), confidence: int 0-100 }`, enforced by a `superRefine` that forces
evidence-and-confidence-≥1 for MATCH/MISMATCH and forbids both for UNKNOWN. Validation against the *actual*
supplied source text (not just schema shape) happens post-hoc in `verifyCategoryPlausibility()`
(`categoryPlausibility.ts:93-179`), which checks count/order correspondence and then re-uses
`provenance.ts`'s `normaliseForMatch`/`normaliseUrl`/`MIN_QUOTE_CHARS` (12 chars) exact-substring check.

**Candidate options for `TARGET_CUSTOMER_MATCH` output schema:**
- **Option A — reuse `categorySegmentSchema` verbatim** (rename `fit`'s enum values MATCH/MISMATCH/UNKNOWN to
  PO-DEC-001's MATCH/NO_MATCH/NOT_YET_OBSERVED, or keep MISMATCH/UNKNOWN as internal labels and translate only at
  the table-write boundary — see point 3).
- **Option B — a narrower schema with no `confidence` discount on classification** — PO-DEC-001 states "confidence
  is provenance-only and never gates classification," which `categorySegmentSchema`'s superRefine already
  satisfies structurally (confidence does not feed `fit`), so this is less a new option than a confirmation that
  Option A is compatible — but a stricter schema could drop the MISMATCH/MATCH-only evidence-array `max(3)` cap if
  PO-DEC-001's "both evidence items retained" for the contradictory-evidence case needs more than 3 slots.
- **Option C — two independent evidence slots** (a "supporting MATCH quote" field and a "supporting NO_MATCH quote"
  field, both optional) to directly carry PO-DEC-001's contradictory-evidence requirement ("both evidence items
  retained") without overloading a single `evidence` array semantics that was designed for one-sided OBSERVED
  claims.

**Tradeoffs.** Option A is fastest to build and test (full precedent in `categoryPlausibility.test.ts`), but its
`evidence` array was designed to support ONE verdict with 1-3 corroborating quotes, not necessarily two
*contradicting* quotes for two different verdicts simultaneously — PO-DEC-001's contradictory-evidence →
NOT_YET_OBSERVED case needs the output schema to be able to carry a MATCH-supporting quote AND a NO_MATCH-
supporting quote in the same response, which `categorySegmentSchema`'s single-`fit` structure does not
obviously support without a schema change (Option C). This is a structural gap, not a cosmetic one.

**Dependencies.** Point 4 (evidence object schema) and point 3 (tri-state translation) both depend on this
choice.

**ANALYST RECOMMENDATION — NOT A DECISION:** `categorySegmentSchema` is close but was not built to carry two
opposing quotes in one response; the Technical Design Decision should treat the contradictory-evidence
requirement as a concrete schema-shape question, not an afterthought on top of Option A.

---

## 3. Classification enum / tri-state translation into `pcg4.ts`

**Evidence.** `packages/core-launch-gates/src/pcg4.ts:86-97` passes `observedTargetCustomer: null` into
`evaluateQualificationEquivalence()`, with an explicit comment (`pcg4.ts:23-32`) that this is deliberate pending
this decision. The consumer side, `packages/core-qualification-equivalence/src/rules.ts:40-56`, is **not**
tri-state-aware today:
```
if (subject.observedTargetCustomer === null) {
  return { criterion: 'TARGET_CUSTOMER_MATCH', satisfied: 'UNKNOWN', ... };
}
const satisfied = normalise(subject.observedTargetCustomer) === normalise(snapshot.targetCustomer);
```
`types.ts:36` types `observedTargetCustomer` as `string | null` — a plain string-equality check against the
Search's `targetCustomer` snapshot, not a MATCH/NO_MATCH/NOT_YET_OBSERVED enum consumer. This is a real gap: the
already-binding PO-DEC-001 tri-state semantics have no corresponding typed input on the consuming side yet.

**Candidate options:**
- **Option A — change `observedTargetCustomer`'s type** from `string | null` to a `'MATCH'|'NO_MATCH'|
  'NOT_YET_OBSERVED'` enum (or reuse a shared type from the new table), and change `rules.ts` to branch directly
  on it instead of doing string-normalise-equality — this requires modifying `@acos/core-qualification-equivalence`
  (a package outside `@acos/core-research`'s PO-DEC-001 ownership), which is a cross-package change the Technical
  Design Decision needs to scope explicitly.
- **Option B — leave `rules.ts` unmodified and have `pcg4.ts` translate the tri-state value into a synthetic
  string before passing it through the existing `string | null` parameter** — functionally close to Option C
  below, included separately because it still frames the translation as "produce a fake targetCustomer string"
  rather than "collapse to null," which changes what a future reader of `rules.ts`'s satisfied-reason string sees.
- **Option C — keep `rules.ts` unmodified and translate tri-state → `string | null` at the `pcg4.ts` boundary**
  (MATCH → the Search's own `targetCustomer` string so the equality check trivially passes; NO_MATCH/NOT_YET_OBSERVED
  → `null` so it falls into the existing UNKNOWN branch) — zero changes to `@acos/core-qualification-equivalence`,
  but loses the NO_MATCH/NOT_YET_OBSERVED distinction (both collapse to the existing `null`→UNKNOWN path), which
  may be acceptable since PCG-4's numerator only needs `match === true` either way (see `pcg4.ts:93`) but discards
  information a future PO-DEC-001-conformant criterion result might want to expose.

**Tradeoffs.** Option A is the semantically correct fix but touches a package this task's governing records do
not name as in scope (`@acos/core-research` is PO-DEC-001's named owner; `@acos/core-qualification-equivalence`
is not). Option C is zero-footprint on the existing evaluator but discards the NO_MATCH/NOT_YET_OBSERVED
distinction PO-DEC-001 went to some effort to define, which may defeat part of the purpose of building this
signal at all.

**Dependencies.** This choice determines whether the Technical Design Decision's authorized-scope boundary must
include `@acos/core-qualification-equivalence` or can stay confined to `@acos/core-research` + `@acos/core-launch-gates`.

**ANALYST RECOMMENDATION — NOT A DECISION:** this is the single largest unresolved cross-package boundary
question in this preparation — the Technical Design Decision should decide explicitly whether
`@acos/core-qualification-equivalence` is in scope, because PO-DEC-001's package-ownership language
(`@acos/core-research`) does not, on its own, say whether the *consumer* package may also need to change.

---

## 4. Evidence object schema

**Evidence.** `category_plausibility_determinations.segment_results` (JSONB column, migration
`packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql`) stores an ordered array
of `{segment, fit, rationale, evidence: [{quote, sourceUrl, sourceLabel}]}` per `categoryPlausibility.ts:214-224`'s
`SegmentDetermination` interface. The `evidenceSchema` referenced at `schema.ts` (used by both `observationSchema`
and `categorySegmentSchema`) carries `quote`/`sourceUrl`/`sourceLabel`. Verification is `provenance.ts`'s
`verifyProvenance()` (general OBSERVED claims, `provenance.ts:149-223`) and `categoryPlausibility.ts`'s own
`verifyCategoryPlausibility()` (`categoryPlausibility.ts:93-179`), both built on the same
`normaliseForMatch`/`normaliseUrl`/`MIN_QUOTE_CHARS` (12) exact-substring primitives from `provenance.ts:45-95`.

**Candidate options:**
- **Option A — reuse the existing `{quote, sourceUrl, sourceLabel}` shape as-is** for both the MATCH-evidence and
  NO_MATCH-evidence slots.
- **Option B — add a `classification`/`supports` discriminator field to each evidence item** (e.g.
  `supports: 'MATCH' | 'NO_MATCH'`), needed if a single determination can carry both a MATCH-supporting and a
  NO_MATCH-supporting quote simultaneously (the contradictory-evidence case) — this is a schema addition beyond
  precedent, not reuse.
- **Option C — add document-position/binding fields** (see point 5) to each evidence item, beyond `sourceUrl`/
  `sourceLabel`.

**Tradeoffs.** Option A is pure reuse but — same gap as point 2 — does not obviously support two opposing quotes
in one row without the discriminator (Option B). Option C increases verification strength but has no existing
column/field to extend (see point 5's "what would need to be added" framing).

**Dependencies.** Point 2 (output schema), point 5 (binding), point 8 (table shape).

**ANALYST RECOMMENDATION — NOT A DECISION:** none; flagged as fully contingent on points 2 and 5.

---

## 5. Structural/cryptographic binding of classification to the exact source text seen

**Evidence.** Two distinct mechanisms already exist and must not be conflated:
1. **Quote-presence verification** (`provenance.ts:149-223`, `categoryPlausibility.ts:93-179`) — checks that a
   cited quote is an exact (post-normalisation) substring of the cited source document's text, at verification
   time. This binds the *classification* to text that was *supplied in that call*, but does not itself produce a
   durable, independently-checkable artifact proving what the model was shown.
2. **Source-document capture + hashing** — migration
   `packages/db/prisma/migrations/0028_category_plausibility_source_documents/migration.sql` persists one row per
   supplied source document: `source_text` (exact post-`researchInputSchema.parse()` text) plus `content_sha256`
   (SHA-256 of that exact text, computed by the writer before insert — see the migration's own comment,
   `0028.../migration.sql:9-15`). `service.ts:118-131` captures this via `onSourceDocumentsSupplied` and
   `toCapturedSourceDocuments()` (`service.ts:159-170`), tied to `determination_id` with a unique
   `(determination_id, document_index)` index. This is the actual "bind classification to exact input text"
   mechanism already live for category plausibility — it is a capture-and-hash record, not a span-offset or
   cryptographic-signature binding.

**No span-offset mechanism exists anywhere inspected** (no column records *which part* of `source_text` the quote
came from beyond the substring-match check performed at write time, which is not persisted as an offset).

**Candidate options for `TARGET_CUSTOMER_MATCH`:**
- **Option A — reuse the exact migration-0028 pattern:** a dedicated `*_source_documents` child table keyed to the
  new determination row, storing `source_text` + `content_sha256`, same as category plausibility.
- **Option B — reuse Option A, plus persist quote-match offsets** (character start/end into `source_text`) at
  write time, strengthening point 13's "replay" requirement (a reviewer can re-locate the exact span without
  re-running the substring search) — not precedented anywhere in this codebase.
- **Option C — no dedicated capture table; rely solely on quote-presence verification at write time** and trust
  the write-time check, never re-verifiable against a frozen copy of what the model actually saw (weakest option;
  loses replay capability per PO-DEC-001's "replay must be possible from persisted input/output/model-version
  information").

**Tradeoffs.** Option A is proven, tested precedent with a running migration. Option B is strictly stronger but
unprecedented — no existing span-offset code to reuse, added implementation cost. Option C is the cheapest but
appears to directly conflict with PO-DEC-001's binding requirement for replay.

**Dependencies.** Point 6 (replay metadata), point 9 (migration numbering/shape).

**ANALYST RECOMMENDATION — NOT A DECISION:** Option C appears to conflict with PO-DEC-001's replay requirement on
its face, but the Technical Design Decision should make that determination explicitly rather than this document
pre-deciding it.

---

## 6. Model/provider/version metadata for replay/audit

**Evidence.**
- `category_plausibility_determinations` (migration 0027) carries **no** model/provider/version column at all —
  not `model`, not `provider`, not `prompt_version`. The determination row only has `observed_at`/`superseded_at`/
  `created_at`.
- `qualifications` (migration `0022_qualifications/migration.sql`) carries `evaluator_version TEXT NOT NULL` — but
  that identifies the **code build** of the deterministic evaluator (`evaluateQualification()`), not a
  model/provider/prompt version; it is a precedent for versioning code, not model calls.
- `ai_usage_events` (migration `0021_ai_usage_events/migration.sql`) **does** carry `provider TEXT NOT NULL`,
  `model TEXT NOT NULL`, `request_kind TEXT NOT NULL` ('initial'|'repair'), and `provider_message_id TEXT NOT NULL`
  (unique with `provider`, for idempotency) — but this table measures **usage/cost**, explicitly has "no prompt or
  response content... stored" per its own migration comment, and is not joined to
  `category_plausibility_determinations` anywhere inspected. It is evidence that model/provider/version metadata
  IS captured elsewhere in the system, just not attached to a determination row today.

**Candidate options:**
- **Option A — add `model`/`provider`/`prompt_version` columns directly on the new determination table**, mirroring
  `ai_usage_events`'s column names but scoped per-determination rather than per-invocation.
- **Option B — add a foreign key from the new determination table to `ai_usage_events`** (e.g.
  `ai_usage_event_id`), reusing the existing table instead of duplicating columns — but `ai_usage_events` is keyed
  to `prospect_id`, not to a specific signal/determination, and there is no existing join path from an AI usage
  event back to "which determination this invocation produced."
- **Option C — no new metadata column; rely on `ai_usage_events` being correlatable by `prospect_id` +
  approximate timestamp** — weakest, not a real replay guarantee (ambiguous when multiple AI calls happen for the
  same prospect close in time).

**Tradeoffs.** Option A duplicates `ai_usage_events`' columns but is self-contained and simplest to query for
replay/audit of a single determination. Option B avoids duplication but needs a new join column neither table
currently has, and `ai_usage_events`'s 1-row-per-provider-response granularity (including repair attempts) does
not map cleanly 1:1 to one determination row. Option C fails PO-DEC-001's replay requirement outright.

**Dependencies.** Point 9 (migration shape), point 13 (test architecture for replay fixtures).

**ANALYST RECOMMENDATION — NOT A DECISION:** this is a genuine gap — no existing table attaches
model/provider/version metadata to a *determination*, only to a *usage event*. The Technical Design Decision
needs to resolve this explicitly; it cannot be inferred from precedent because no precedent fully solves it.

---

## 7. Exact table/column names for the Search-Prospect relation

**Evidence.** `category_plausibility_determinations`' actual column list (migration 0027, cited in full above):
`id, search_id, prospect_id, target_customer, target_segments TEXT[], aggregate_result, segment_results JSONB,
observed_at, superseded_at, created_at`. Two indexes: a non-unique `(search_id, prospect_id)` index for full
history, and a partial unique-by-usage `(prospect_id) WHERE superseded_at IS NULL` index for "current" reads
(not a DB-enforced unique constraint — see point 8).

**Candidate naming options** (repo convention: `snake_case`, singular domain noun + `_determinations` suffix for
this family; `category_plausibility_*` and `research_signals` are the two closest precedents):
- `target_customer_match_determinations` (direct parallel to `category_plausibility_determinations`).
- `target_customer_matches` (shorter, parallel to `qualifications`/`opportunities` singular-table-plural-name
  convention).
- `pcg4_target_customer_match_determinations` (ties the table name to the gate it serves — no existing table in
  this repo is named after a PCG gate, so this would be a new convention, not reuse).

Column-naming candidates, parallel to migration 0027: `id, search_id, prospect_id, target_customer` (the
raw/snapshot string, per ED-DEC-001's "research-time" timing — same `target_customer` denormalisation precedent
`category_plausibility_determinations` already uses), a result column (name TBD — `result`, `classification`, or
`match_result`), an evidence/provenance JSONB column (name TBD — `evidence` or `provenance`), `observed_at`,
`superseded_at`, `created_at`.

**Tradeoffs.** `target_customer_match_determinations` is the most direct, lowest-ambiguity precedent match but is
long (38 chars, under Postgres' 63-char identifier limit with room for index-name suffixes — checked against
migration 0027's own index names, e.g. `category_plausibility_determinations_current_by_prospect_idx` is 61
chars, so a longer base table name needs the Technical Design Decision to verify index names stay under 63
chars). `target_customer_matches` is shorter but less obviously parallel to the `_determinations` family
ED-DEC-001 already named this family after.

**Dependencies.** Point 8 (index names built from the chosen table name), point 9 (migration file naming).

**ANALYST RECOMMENDATION — NOT A DECISION:** `target_customer_match_determinations` is offered as the option most
consistent with ED-DEC-001's and migration 0027's existing naming family, but this is an option, not a decision,
and the 63-char index-name limit should be explicitly checked once a final name is chosen.

---

## 8. Append-only/supersede schema and uniqueness/index strategy

**Evidence.** Migration 0027's actual supersession mechanism (cited in full in §7 above): `superseded_at
TIMESTAMP(3)` nullable column, never deleted; a same-Search re-run calls `supersedePrevious(search.id, prospect.id,
now)` then inserts a new row (`service.ts:140-152`). **There is no DB-enforced uniqueness constraint** forcing
"at most one non-superseded row per prospect" — the partial index
`category_plausibility_determinations_current_by_prospect_idx ON (prospect_id) WHERE superseded_at IS NULL` is a
**non-unique** index (confirmed: `CREATE INDEX`, not `CREATE UNIQUE INDEX`, in the migration SQL above) used only
to make the "current" read fast, not to enforce the invariant at the database level. The invariant ("at most one
current row per prospect") is maintained entirely by application-code ordering (`supersedePrevious` before
`save`, non-transactional — see point 10) rather than by a constraint.

**Candidate options:**
- **Option A — reuse the exact pattern:** nullable `superseded_at`, non-unique index for the "current" read,
  application-code-enforced ordering, no DB-level uniqueness guarantee.
- **Option B — strengthen with a partial UNIQUE index** (`CREATE UNIQUE INDEX ... WHERE superseded_at IS NULL`),
  which migration 0027 could have used but did not — this would make the invariant DB-enforced rather than
  purely application-enforced, closing a race-condition gap the current pattern has (two concurrent writers could
  both insert non-superseded rows for the same prospect, since nothing at the DB level stops it).
- **Option C — reuse Option A but add a serializable-transaction wrapper** around supersede+insert (ties to point
  10's observation that the current `service.ts` call site is **not** inside a transaction).

**Tradeoffs.** Option A is fastest and precedented but inherits a known (if latent) race condition. Option B
closes that gap with a small migration-time cost and no application-code change, but has no precedent anywhere in
this repo's migrations (none of 0016, 0018, 0022, or 0027 use a partial unique index for their "current row"
invariant — all rely on non-unique indexes + code ordering). Option C requires auditing whether the research
pipeline's call site can be wrapped in a transaction at all (point 10 below suggests it currently is not, across
multiple DB writes: `signals.supersedePrevious`, `signals.saveSignals`, `categoryPlausibility.supersedePrevious`,
`categoryPlausibility.save`, all sequential awaits with no visible `BEGIN`/`COMMIT`).

**Dependencies.** Point 10 (transaction boundary), point 7 (table/index naming).

**ANALYST RECOMMENDATION — NOT A DECISION:** Option A is the literal precedent but it is worth explicitly noting
to the decision-maker that migration 0027 itself does not DB-enforce its own "at most one current row" invariant
— reusing it as-is carries that same latent gap forward rather than fixing it.

---

## 9. Exact migration shape and next migration number

**Evidence.** `ls packages/db/prisma/migrations/ | sort` (run against the actual working tree, not recalled)
returns, highest-numbered entries: `0031_funnel_events`, `0032_order_visitor_id`, `0033_searches_completed_at`,
`0034_refund_events`, `0035_gate_evaluation_snapshots` (all five currently untracked/uncommitted, per the git
status baseline). **The next available migration number is `0036`.**

**Candidate options.** This is largely mechanical once the table/column design (points 7-8) is fixed: a single
new migration `0036_<table_name>` creating the determinations table (parallel to 0027), optionally followed by a
second migration for a source-document capture child table (parallel to 0028, per point 5's Option A/B), i.e.
either one migration or two depending on whether source-document capture is in scope for the same Technical
Design Decision or deferred.

**Tradeoffs.** A single combined migration keeps the two tables' introduction atomic in history; two separate
migrations (as category plausibility did: 0027 then 0028) mirrors the precedent of adding source capture as a
distinct, later-authorized increment (0028's own comment ties it to a separate authorization, `A11-P1-IMPL-AUTH-001`)
— suggesting the original rollout deliberately separated "determination" from "source capture" as independently
authorizable units.

**Dependencies.** Point 7 (naming), point 5 (whether source capture is in scope).

**ANALYST RECOMMENDATION — NOT A DECISION:** none beyond confirming `0036` as the next number; whether to split
into two migrations mirrors a real precedent-based choice (0027/0028 were split), not a technical constraint.

---

## 10. Insertion point in `core-research`, including transaction/idempotency

**Evidence.** `packages/core-research/src/service.ts:100-152` (the research orchestration function). The
category-plausibility write sequence, in order: `deps.searches.getById` (read) → `parseTargetSegments` (pure) →
`deps.provider.research(...)` (the model call, via `onSourceDocumentsSupplied` capture) → `toNewResearchSignals`
(pure) → `deps.signals.supersedePrevious(prospect.id, now)` (write) → `deps.signals.saveSignals(...)` (write) →
if `deps.categoryPlausibility` is configured: `toSegmentDeterminations` (pure) → `aggregateCategoryFit` (pure) →
`deps.categoryPlausibility.supersedePrevious(search.id, prospect.id, now)` (write) →
`deps.categoryPlausibility.save(...)` (write). **No `BEGIN`/transaction wrapper is visible in this function** —
each `deps.*` write is a separate `await`ed call with no shared transaction object passed through. **Idempotency
on retry**: not idempotent in the sense of a no-op repeat — a retried call would re-run `supersedePrevious` (which
is itself safe/idempotent, since marking already-superseded rows superseded again is a no-op) followed by another
`save`, meaning a retried `runResearch` call produces an **additional** superseded-then-current row, not a
duplicate of an existing one; this is "safe to retry" in the sense of never corrupting state, but not "exactly-once"
in the sense of detecting that an identical call already ran.

**Candidate options for a new `target_customer_match` write:**
- **Option A — append it into the exact same `if (deps.categoryPlausibility)` block**, as a third determination
  type guarded by its own `deps.targetCustomerMatch` dependency flag, same non-transactional sequential-await
  style.
- **Option B — same as A, but wrap the whole signals + categoryPlausibility + targetCustomerMatch write sequence
  in an actual DB transaction**, closing the point-8 race-condition gap for all three determination families at
  once — a larger change than this task's governing records (ED-DEC-001, PO-DEC-001) explicitly authorize, since
  neither mentions transactionality as in scope.
- **Option C — a wholly separate call site** (not inside `runResearch`), invoked independently after research
  completes — contradicts ED-DEC-001's "research-time" timing decision unless that call is still synchronous
  within the same request, so this option is likely foreclosed by ED-DEC-001 rather than genuinely open; included
  here only for completeness.

**Tradeoffs.** Option A is minimal-diff and matches precedent exactly, inheriting the known non-transactional
limitation. Option B fixes a real gap but is a scope question for the Technical Design Decision to raise
explicitly (is "harden the existing non-transactional write pattern" in scope, or only "add a third determination
using the existing pattern as-is"?). Option C appears foreclosed by ED-DEC-001's binding timing decision.

**Dependencies.** Point 8 (transaction boundary already raised there), point 12 (failure semantics of the
surrounding `deps.provider.research()` call, which is shared across all three determination types in Option A).

**ANALYST RECOMMENDATION — NOT A DECISION:** Option A matches precedent most directly; Option B's transactionality
question is flagged as a scope question the Technical Design Decision should explicitly accept or decline, not
silently inherit.

---

## 11. `pcg4.ts` translation/join behavior

**Evidence.** `packages/core-launch-gates/src/pcg4.ts` (read in full, 97 lines). The existing query
(`pcg4.ts:55-75`) is a single `LEFT JOIN` chain: `searches` → `prospects` (via `prospect.search_id = s.id`) →
`opportunities` (via `o.prospect_id = p.id`) → `funnel_events` (for the `opportunity_reviewed` event) →
`feedback`. This is the only gate file inspected; no other PCG gate file was read as part of this preparation
task (out of scope per the 14-point list, which names only `pcg4.ts`). Within `pcg4.ts` itself, there is **no
existing join to any research/determination table at all** — `observedTargetCustomer` is hardcoded `null`
precisely because no such join exists yet (`pcg4.ts:23-32`'s own comment: "no data source independent of
category-plausibility/research signals... exists today for it").

**Candidate options for the new join:**
- **Option A — add a `LEFT JOIN target_customer_match_determinations tcm ON tcm.search_id = s.id AND
  tcm.prospect_id = p.id AND tcm.superseded_at IS NULL`** directly into the existing single SQL query
  (`pcg4.ts:55-75`), selecting the new table's result column into `Pcg4Row`, then passing it (translated per
  point 3) into `evaluateQualificationEquivalence()` in place of the hardcoded `null` at `pcg4.ts:93`.
- **Option B — a separate query/lookup** (one query per Search-Prospect pair, or a batched follow-up query after
  the main one), avoiding widening the existing single-query shape — but ED-11 (cited in `pcg4.ts:17-20`'s own
  comment) specifically decided "one single joined query gathers every raw fact this needs," making Option B
  likely in tension with that already-binding engineering decision rather than a genuinely open option.
- **Option C — a code-level batch fetch** (fetch all current determinations for the Search-Prospect pairs found
  by the main query, in one additional query, then merge in application code) — a middle ground between A and B;
  still two queries, but the second is a single batched `WHERE (search_id, prospect_id) IN (...)` rather than
  N+1.

**Tradeoffs.** Option A is most consistent with ED-11's "single joined query" decision but widens an already
multi-join query further and ties `pcg4.ts`'s SQL directly to the new table's exact column/index names (point 7).
Option B conflicts with ED-11 on its face. Option C avoids both the ED-11 conflict risk and Option A's single-query
complexity growth, at the cost of being a second query (not literally "one single joined query," though arguably
still "one query per concern").

**Dependencies.** Point 7 (table/column names the join references), point 3 (translation of the joined tri-state
value into `evaluateQualificationEquivalence`'s input type).

**ANALYST RECOMMENDATION — NOT A DECISION:** Option A most literally satisfies ED-11, but the Technical Design
Decision should explicitly confirm whether ED-11's "single joined query" language extends to a hypothetical
future determination table it did not anticipate, or whether Option C's batched-second-query approach is
acceptable under that decision's intent.

---

## 12. Failure/timeout/malformed-output/missing-source/retry semantics

**Evidence.** `packages/core-research/src/researcher.ts` (comment block, lines 27-40): two distinct failure
modes — PROVIDER failures (429/5xx/network) get exponential backoff with full jitter and retry
(`researcher.ts:149,211-227`; non-retryable errors or exhausted `maxAttempts` throw); VALIDATION failures (model
output wrong shape, or `verifyProvenance`/`verifyCategoryPlausibility` issues) trigger a **repair round** — the
exact errors are fed back to the model as a targeted repair message (`buildTargetedRepairMessage`,
`planRepair`/`applyRepair` from `./repair`), a different request rather than a blind retry. A refusal
(`ResearchRefusedError`) is terminal — never retried. `fallbackResearchProvider.ts:12-38`'s header comment gives
the cross-provider fallback eligibility rule: `ResearchProviderError` → fallback-eligible (retry budget already
exhausted on the primary provider); `ResearchRefusedError`/`ResearchValidationError`/`ResearchAbortedError` →
never fallback-eligible; `InsufficientEvidenceError` (no source documents at all) → thrown before any attempt,
never provider-specific, never triggers fallback. Missing-source handling specifically: an empty
`sourceDocuments` list is handled explicitly in the prompt-building branch (`prompt.ts:53-55`) and in
`verifyCategoryPlausibility`'s evidence check (`categoryPlausibility.ts:154-164`, "no source documents were
supplied... classify this segment UNKNOWN") — i.e. missing sources fail soft to UNKNOWN, consistent with
PO-DEC-001's fail-soft requirement, already precedented for category plausibility.

**Candidate options for `TARGET_CUSTOMER_MATCH`:** given the mechanism is "one bounded model call" per
PO-DEC-001, the most direct option is to **reuse the identical researcher.ts/fallbackResearchProvider.ts
machinery as-is** (Option A) — the retry/repair/fallback/fail-soft logic is orchestration-level and signal-agnostic
already (it operates on `LeadResearch` as a whole, not per-field), so no new failure-handling code is obviously
needed; a target-customer-match verdict added to the same (or a sibling) model-output schema inherits the same
retry/repair/refusal/fallback/missing-source behavior automatically. The only other option worth naming is
**Option B — a dedicated failure path** if target-customer-match is issued as a genuinely separate model call
(per point 1's Option B/C distinction) with its own timeout/retry budget independent of the main research call —
only relevant if point 1's input-shape decision produces a second, separate bounded call rather than reusing or
extending the existing one.

**Tradeoffs.** Option A costs nothing new to build/test but only applies cleanly if point 1 is resolved toward
"extend the existing call" (Options A/C there); Option B is only relevant under point 1's Option B framed as a
standalone second call, and would require writing new retry/timeout code with no local precedent to reuse (though
`researcher.ts`'s structure could be duplicated/parameterized).

**Dependencies.** Point 1 (input shape / number of model calls) directly determines which option applies.

**ANALYST RECOMMENDATION — NOT A DECISION:** this point is largely resolved once point 1 is resolved — flagged as
dependent rather than independently open.

---

## 13. Test architecture

**Evidence.** `packages/core-research/src/categoryPlausibility.test.ts` exists alongside `schema.ts`-level and
`service.test.ts`-level coverage (file listing confirmed: `categoryPlausibility.test.ts`, `service.test.ts`,
`research.test.ts`, `provenance`-adjacent tests are embedded in `research.test.ts`/`categoryPlausibility.test.ts`
rather than a separate `provenance.test.ts` file — no standalone `provenance.test.ts` was found in the directory
listing). `packages/core-launch-gates/src/pcg4.test.ts` exists for the gate itself. **No file literally named
`evaluator.test.ts` exists under `core-research` or `core-launch-gates`** — two files with that name exist, but in
sibling packages: `packages/core-qualification-equivalence/src/evaluator.test.ts` and
`packages/core-qualification/src/evaluator.test.ts`. If `TARGET_CUSTOMER_MATCH`'s deterministic translation logic
(point 3) ends up living in `@acos/core-qualification-equivalence`, its test precedent is
`evaluator.test.ts`/`rules.ts`'s own test file in that package, not anything under `core-research`.

**Candidate test-file structure**, mapping PO-DEC-001's 9 required fixture categories + persistence/replay/
contradiction/fail-soft onto files, by analogy with the existing `categoryPlausibility.test.ts` +
`provenance`-style split:
- A `targetCustomerMatch.test.ts` (parallel to `categoryPlausibility.test.ts`) covering the deterministic
  pre/post-processing functions (parse/translate), the 9 PO-DEC-001 fixture categories as individual `it()` blocks
  or a `describe.each`, and the contradictory-evidence → NOT_YET_OBSERVED case explicitly.
- Reuse of `provenance.test.ts`-style coverage (embedded in `research.test.ts` per current convention) for the
  quote-verification primitives, if point 2/4 reuse `evidenceSchema`/`normaliseForMatch` as-is rather than adding
  new primitives.
- A `service.test.ts` extension (or new assertions in the existing file) for the insertion-point/transaction/
  idempotency behavior from point 10.
- A `pcg4.test.ts` extension for the join/translation behavior from point 11, mirroring how `pcg4.test.ts`
  presumably already asserts the current hardcoded-`null` behavior (not independently re-verified in this
  preparation pass, since reading `pcg4.test.ts` itself was not required by the 14 points and the governing
  instruction states not to expand scope).
- A new migration-level repository test (parallel to whatever covers `categoryPlausibilityPgRepository.ts`),
  for the supersede/uniqueness behavior from point 8.

**Tradeoffs.** None beyond the open structural questions already raised in points 1-10 — the test file layout is
mostly a direct function of which package(s) end up owning which logic.

**Dependencies.** Points 1, 2, 3, 8, 10.

**ANALYST RECOMMENDATION — NOT A DECISION:** flagged primarily that no `evaluator.test.ts` exists under
`core-research`/`core-launch-gates` today — if the Technical Design Decision places translation logic in
`core-qualification-equivalence`, its test precedent is that package's existing `evaluator.test.ts`/`rules.ts`
tests, not anything inspected elsewhere in this preparation.

---

## 14. Acceptance criteria / implementation-release gates

**Evidence.** `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`
(`CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001`) structures its authorization as a per-workstream
table (W-1 through W-16), each with: a named governing decision reference, an **"Authorized/Blocked" status**, and
an explicit **numbered "Acceptance criteria:"** line per workstream (e.g. W-8 "Standalone qualification evaluator"
— `IMPLEMENTATION_AUTHORIZATION_DECISION.md:246-264`: "For a fixed input the evaluator always returns the same
result; a malformed criteria..."). `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md`
(`CLIENT-FINDER-PDEF-4-IMPLEMENTATION-CONFORMANCE-001`) is the matching after-the-fact record, structured as a
"Workstream → implementation mapping" table (Done/Blocked/gap-with-disposition per row) plus a "Decision (ED/B)
conformance" table cross-referencing specific decision IDs to specific files. Both documents explicitly disclaim
deployment/release/launch authority ("Documents what was actually built, not what was planned. No deployment,
release, or launch authority is claimed or implied.").

**Candidate structure for a future `TARGET_CUSTOMER_MATCH` authorization/conformance pair**, by direct analogy:
- A per-workstream authorization table (e.g. "W-1 — migration", "W-2 — model call", "W-3 — pcg4.ts join/
  translation", "W-4 — tests"), each carrying its own explicit acceptance-criteria sentence, following the
  `IMPLEMENTATION_AUTHORIZATION_DECISION.md` W-1..W-16 pattern exactly.
- A matching conformance record with a workstream→files mapping table and an explicit baseline-HEAD/no-deployment-
  authority disclaimer, following `IMPLEMENTATION_CONFORMANCE_RECORD.md`'s structure exactly.

**Tradeoffs.** None identified — this is the only PDEF-4-family acceptance-criteria precedent found, and it is
directly reusable as a structural template regardless of how points 1-13 resolve; the acceptance-criteria
*content* (what specifically each workstream must satisfy) is entirely contingent on those other 13 points.

**Dependencies.** All of points 1-13 feed the content of the acceptance criteria; this point only establishes the
*structural* precedent.

**ANALYST RECOMMENDATION — NOT A DECISION:** the structural template from
`CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`/`..._CONFORMANCE_RECORD.md` is offered as a
reusable pattern; no acceptance-criteria content is proposed here since it depends entirely on unresolved points
1-13.

---

## Summary of unresolved items (all 14, since this is preparation only)

1. Model input shape (segment-level vs. company-level vs. shared-call) — unresolved.
2. Model output schema (reuse `categorySegmentSchema` vs. a schema that can carry two opposing quotes) —
   unresolved; structural gap identified for the contradictory-evidence case.
3. Tri-state → `evaluateQualificationEquivalence` translation, and whether `@acos/core-qualification-equivalence`
   is in scope — unresolved; flagged as the largest open cross-package boundary question.
4. Evidence object schema (discriminator field for two-sided evidence) — unresolved, contingent on #2.
5. Structural/cryptographic binding strength (capture-and-hash only, vs. span offsets) — unresolved.
6. Model/provider/version metadata attachment to a determination row — unresolved; no existing table solves this
   for a determination (only for a usage event).
7. Table/column names — unresolved; options enumerated, no selection made.
8. Supersede/uniqueness DB-enforcement strength (non-unique index vs. partial unique index) — unresolved; latent
   gap in the precedent itself noted.
9. Next migration number — **not unresolved**: confirmed `0036`; whether one or two migrations is still open.
10. Transaction/idempotency scope for the new write — unresolved; scope question (harden vs. reuse-as-is) flagged.
11. `pcg4.ts` join shape vs. ED-11's "single joined query" decision — unresolved.
12. Failure/retry semantics — effectively resolved once #1 is resolved (reuse existing machinery under the most
    likely input-shape options).
13. Test file structure — mostly resolved by analogy; package-ownership question from #3 is the open piece.
14. Acceptance-criteria structural template — resolved (direct precedent); content entirely contingent on #1-13.

## Authorization boundary

This document is **preparation only**. No option above has been selected. No code, schema, migration, test,
configuration, or dependency file has been created, modified, or deleted by this task. No prior governing record
was modified. This document does not authorize any implementation work.
