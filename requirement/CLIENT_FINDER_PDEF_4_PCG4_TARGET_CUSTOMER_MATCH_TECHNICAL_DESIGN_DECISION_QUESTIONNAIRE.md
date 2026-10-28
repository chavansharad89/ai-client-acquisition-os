# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Technical Design Decision Questionnaire

**Record ID:** `PDEF4-PCG4-TCMATCH-TECHDESIGN-QUESTIONNAIRE-001`
**Date:** 2026-10-05
**Type:** Questionnaire only. No option below is selected. No code, schema, migration, test, configuration, or
dependency file is created, modified, or deleted by this document. No prior governing record is reopened or
reinterpreted.
**Baseline HEAD at time of writing:** `af9ede93830f5e3e611195dc2451a470364def74`

---

## 0. Purpose and binding inputs

This questionnaire turns the 14 investigated points of
`requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION_PREPARATION.md`
(`PDEF4-PCG4-TCMATCH-TECHDESIGN-PREP-001`) into 16 explicit, individually answerable decision points (two of the
prep's 14 points are split into two decision points each below, per the facilitation instruction that no sub-
question be folded silently into another). It reuses the prep record's evidence and options verbatim where
applicable and does not re-run repository investigation. Each decision point below ends with a literal blank
answer line. **No recommendation in this document is a decision** — every recommendation is labelled
`ANALYST RECOMMENDATION — NOT A DECISION`.

Treated as already decided and non-reopenable (read-only inputs):
- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_PRODUCT_OWNER_DECISION.md`
  (`PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`) — evidence source = research-time source documents; mechanism =
  deterministic pre/post-processing around one bounded model call; MATCH/NO_MATCH each require their own verified
  verbatim on-document quote; absence of positive evidence never produces NO_MATCH; contradictory verified
  evidence → NOT_YET_OBSERVED with both evidence items retained; confidence is provenance-only; no freshness
  expiry; all failure modes fail-soft to NOT_YET_OBSERVED; replay must be possible from persisted
  input/output/model-version; 9 required fixture categories; package ownership `@acos/core-research`.
- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md`
  (`PDEF4-PCG4-ED-DEC-001`) — Search-Prospect dedicated table; research-time timing; tri-state enum storage;
  append-only supersede history.
- `PDEF4-PCG4-TCMATCH-TECHDESIGN-PREP-001` itself — the repository-evidence base for every point below.

---

## TD-1. Model input schema

**Evidence (from prep §1).** `packages/core-research/src/prompt.ts:31,44-55` builds the model-call input;
`categoryPlausibility.ts:38-43` (`parseTargetSegments`) deterministically splits the Search's `targetCustomer`
string into segments before the model call — precedent for deterministic pre-processing, but for category
plausibility, not target-customer-match.

**Options.**
- **Option A** — mirror `categoryPlausibility` exactly: segment-style input (`parseTargetSegments` output), one
  call evaluating all segments, same `sourceDocuments` list.
- **Option B** — single-segment, company-level input: the Search's raw `targetCustomer` (or PO-DEC-001's own
  unit) + source documents, producing one classification rather than a per-segment ANY-match aggregate.
- **Option C** — reuse the same model call that already produces `categoryPlausibility`, adding target-customer-
  match as an additional field on that response object (avoids a second bounded model call; see TD-10, TD-11).

**Tradeoffs.** A reuses tested code but segments may be a category-plausibility-specific concept that does not
transfer to a company-level match question. B is semantically closer to PO-DEC-001's single-verdict phrasing but
has no local precedent. C minimizes model calls/cost but entangles two independently governed signals
(`category_plausibility_determinations` vs. ED-DEC-001's new table) in one response schema and one failure/retry
unit.

**Dependencies.** Feeds TD-2 (output schema), TD-10/TD-11 (one call vs. two), TD-14 (failure semantics).

**ANALYST RECOMMENDATION — NOT A DECISION:** Option B more directly matches PO-DEC-001's tri-state phrasing as one
verdict, not an ANY-match aggregate, but the Technical Design Decision should first confirm explicitly whether
PCG-4's `TARGET_CUSTOMER_MATCH` is a segment-level or company-level question before choosing an input shape.

ENGINEERING SELECTION: __________________

---

## TD-2. Model output schema — including contradictory-quote representation

**Evidence (from prep §2).** `categorySegmentSchema` (`packages/core-research/src/schema.ts:190-277`):
`{ fit: 'MATCH'|'MISMATCH'|'UNKNOWN', rationale, evidence: evidenceSchema[] (max 3), confidence: int 0-100 }`,
`superRefine`-enforced. Verification is `verifyCategoryPlausibility()` (`categoryPlausibility.ts:93-179`) on top of
`provenance.ts`'s exact-substring primitives. **This schema was built to carry ONE verdict with 1-3 corroborating
quotes — it has no structural slot for two simultaneously-opposing quotes (a MATCH-supporting quote and a
NO_MATCH-supporting quote in the same response), which PO-DEC-001's contradictory-evidence → NOT_YET_OBSERVED case
requires both to be retained.** This is a structural gap, not a cosmetic one, and must not be silently inherited.

**Options.**
- **Option A — reuse `categorySegmentSchema` verbatim**, translating enum values (MATCH/MISMATCH/UNKNOWN →
  MATCH/NO_MATCH/NOT_YET_OBSERVED) at the write boundary. Does **not** by itself solve the contradictory-quote
  case.
- **Option B — array-of-findings schema**: replace the single `fit`+`evidence` shape with an array of
  `{ classification: 'MATCH'|'NO_MATCH', quote, sourceUrl, sourceLabel }` findings (0, 1, or many), with the
  tri-state result derived deterministically post-hoc (any MATCH finding + any NO_MATCH finding → contradictory →
  NOT_YET_OBSERVED with both retained; only MATCH findings → MATCH; only NO_MATCH findings → NO_MATCH; no findings
  → NOT_YET_OBSERVED).
- **Option C — multiple-call schema**: issue two independent bounded model calls (or two independent schema
  slots evaluated separately), one seeking MATCH evidence, one seeking NO_MATCH evidence, each independently
  verified; the two results are combined post-hoc exactly as in Option B but without requiring the model to emit
  both in one response.
- **Option D — two fixed evidence slots**: a single `matchEvidence: evidenceSchema | null` and
  `noMatchEvidence: evidenceSchema | null` pair on one response object (functionally a 2-wide special case of
  Option B's array).

**Tradeoffs.** A is fastest to build/test but does not solve the stated requirement on its own. B is the most
general and extensible (handles >2 opposing quotes without a schema change) but is unprecedented in this codebase.
C avoids a schema change to the single-call shape but doubles model-call cost and ties directly into TD-1 Option
C's call-count question and TD-10/TD-11's transaction/retry scope. D is simpler than B but less extensible and
still a new schema shape.

**Dependencies.** Depends on TD-1 (call count). Feeds TD-3 (translation), TD-4 (evidence object schema), TD-12.

**ANALYST RECOMMENDATION — NOT A DECISION:** `categorySegmentSchema` alone (Option A) does not satisfy
PO-DEC-001's contradictory-evidence requirement; the Technical Design Decision must select B, C, or D (or another
option that explicitly carries two opposing verified quotes) rather than defaulting to A by inertia.

ENGINEERING SELECTION: __________________

---

## TD-3. Classification enum / tri-state translation into `pcg4.ts`

**Evidence (from prep §3).** `packages/core-launch-gates/src/pcg4.ts:86-97` passes `observedTargetCustomer: null`
into `evaluateQualificationEquivalence()`, with a comment (`pcg4.ts:23-32`) flagging this as deliberate pending
this decision. `packages/core-qualification-equivalence/src/rules.ts:40-56` is **not tri-state-aware today**:
```
if (subject.observedTargetCustomer === null) {
  return { criterion: 'TARGET_CUSTOMER_MATCH', satisfied: 'UNKNOWN', ... };
}
const satisfied = normalise(subject.observedTargetCustomer) === normalise(snapshot.targetCustomer);
```
`types.ts:36` types `observedTargetCustomer` as plain `string | null`, consumed by string-equality, not by a
MATCH/NO_MATCH/NOT_YET_OBSERVED enum.

**Options.**
- **Option A** — change `observedTargetCustomer`'s type to `'MATCH'|'NO_MATCH'|'NOT_YET_OBSERVED'` and change
  `rules.ts` to branch on it directly, dropping the string-normalise-equality check. Requires modifying
  `@acos/core-qualification-equivalence`.
- **Option B** — leave `rules.ts` unmodified; have `pcg4.ts` translate the tri-state value into a synthetic
  `targetCustomer`-shaped string before passing it through the existing `string | null` parameter (framed as
  "produce a fake string" rather than "collapse to null" — changes what a future reader of `rules.ts`'s
  satisfied-reason string sees).
- **Option C** — leave `rules.ts` unmodified; translate tri-state → `string | null` at the `pcg4.ts` boundary:
  MATCH → the Search's own `targetCustomer` string (equality trivially passes); NO_MATCH/NOT_YET_OBSERVED → `null`
  (falls into the existing UNKNOWN branch). Zero changes to `@acos/core-qualification-equivalence`, but collapses
  NO_MATCH and NOT_YET_OBSERVED into the same existing `null`→UNKNOWN path.

**Tradeoffs.** A is the semantically correct fix but is a cross-package change to a package PO-DEC-001 does not
name as in scope (`@acos/core-research` is the named owner; `@acos/core-qualification-equivalence` is not). B and
C are zero/low-footprint on `rules.ts` but B and C both discard (B partially, C fully) the NO_MATCH/NOT_YET_OBSERVED
distinction PO-DEC-001 defined, which may be acceptable if PCG-4's numerator only needs `match === true`
(`pcg4.ts:93`) but loses information a future PO-DEC-001-conformant criterion result might want to expose.

**Dependencies.** Determines whether the Technical Design Decision's authorized-scope boundary includes
`@acos/core-qualification-equivalence`. Directly duplicated as its own decision point at TD-12 per the governing
instruction that this sub-question not be folded silently into another point. Feeds TD-13 (join/translation
shape) and TD-4 (evidence schema naming, by extension).

**ANALYST RECOMMENDATION — NOT A DECISION:** this is the single largest unresolved cross-package boundary
question in the prep record. The Technical Design Decision should decide explicitly whether
`@acos/core-qualification-equivalence` is in scope — PO-DEC-001's package-ownership language
(`@acos/core-research`) does not on its own resolve whether the *consumer* package may also need to change.

ENGINEERING SELECTION: __________________

---

## TD-4. Evidence/provenance object schema

**Evidence (from prep §4).** `category_plausibility_determinations.segment_results` (migration 0027) stores
`{segment, fit, rationale, evidence: [{quote, sourceUrl, sourceLabel}]}`. `evidenceSchema` (shared by
`observationSchema` and `categorySegmentSchema`) carries `quote`/`sourceUrl`/`sourceLabel`. Verification uses
`provenance.ts`'s `normaliseForMatch`/`normaliseUrl`/`MIN_QUOTE_CHARS` (12 chars) exact-substring primitives.

**Options** (contingent on TD-2's resolution).
- **Option A** — reuse `{quote, sourceUrl, sourceLabel}` as-is for both MATCH-evidence and NO_MATCH-evidence
  slots.
- **Option B** — add a `classification`/`supports: 'MATCH'|'NO_MATCH'` discriminator field to each evidence item,
  needed if a single determination can carry both a MATCH-supporting and a NO_MATCH-supporting quote
  simultaneously under TD-2's array-of-findings or two-slot options.
- **Option C** — add document-position/binding fields (see TD-5) to each evidence item, beyond `sourceUrl`/
  `sourceLabel`.

**Tradeoffs.** A is pure reuse but, consistent with TD-2's finding, does not obviously support two opposing
quotes in one row without B's discriminator. C increases verification strength but has no existing column/field
to extend without TD-5's resolution.

**Dependencies.** Depends on TD-2 (output schema) and TD-5 (binding strength). Feeds TD-7 (column shape) and
TD-9 (migration columns).

**ANALYST RECOMMENDATION — NOT A DECISION:** none offered independently; this point is fully contingent on TD-2
and TD-5 and should be resolved after those two.

ENGINEERING SELECTION: __________________

---

## TD-5. Structural/cryptographic binding of classification to source document

**Evidence (from prep §5).** Two distinct existing mechanisms: (1) quote-presence verification
(`provenance.ts:149-223`, `categoryPlausibility.ts:93-179`) — exact post-normalisation substring check at
verification time, binds classification to text supplied *in that call* but produces no durable independently-
checkable artifact; (2) source-document capture + hashing — migration
`packages/db/prisma/migrations/0028_category_plausibility_source_documents/migration.sql` persists
`source_text` + `content_sha256` per supplied document, keyed to `determination_id` with a unique
`(determination_id, document_index)` index, via `service.ts:118-131,159-170`. **No span-offset mechanism exists
anywhere inspected.**

**Options.**
- **Option A** — reuse the exact migration-0028 pattern: a dedicated `*_source_documents` child table keyed to
  the new determination row, storing `source_text` + `content_sha256`.
- **Option B** — Option A plus persisted quote-match offsets (character start/end into `source_text`) at write
  time — unprecedented in this codebase, strictly stronger replay guarantee.
- **Option C** — no dedicated capture table; rely solely on quote-presence verification at write time, never
  re-verifiable against a frozen copy of what the model actually saw.

**Tradeoffs.** A is proven, tested, running precedent. B is strictly stronger but adds unprecedented
implementation cost. C is cheapest but appears to directly conflict with PO-DEC-001's replay requirement
("replay must be possible from persisted input/output/model-version information").

**Dependencies.** Feeds TD-6 (replay metadata), TD-9 (migration shape — one migration vs. two), TD-4 (evidence
object fields).

**ANALYST RECOMMENDATION — NOT A DECISION:** Option C appears to conflict with PO-DEC-001's replay requirement on
its face, but the Technical Design Decision should make that determination explicitly rather than have it
pre-decided here.

ENGINEERING SELECTION: __________________

---

## TD-6. Model/provider/version metadata for replay/audit

**Evidence (from prep §6).** `category_plausibility_determinations` (migration 0027) carries **no**
model/provider/version column. `qualifications` (migration 0022) carries `evaluator_version TEXT NOT NULL` —
versions the deterministic evaluator's code build, not a model/provider/prompt version. `ai_usage_events`
(migration 0021) carries `provider`, `model`, `request_kind`, `provider_message_id` (unique with `provider`) —
but is explicitly a usage/cost table ("no prompt or response content... stored"), is keyed to `prospect_id` not to
a specific determination, and is **not joined to `category_plausibility_determinations` anywhere inspected.**
**No existing table attaches model/provider/version metadata to a determination row.**

**Options.**
- **Option A** — add `model`/`provider`/`prompt_version` columns directly on the new determination table,
  mirroring `ai_usage_events`'s column names but scoped per-determination.
- **Option B** — add a foreign key from the new determination table to `ai_usage_events` (e.g.
  `ai_usage_event_id`) — note `ai_usage_events` has no existing join path back to "which determination this
  invocation produced," and its granularity (1 row per provider response, including repair attempts) does not
  map cleanly 1:1 to one determination row.
- **Option C** — no new metadata column; rely on correlating by `prospect_id` + approximate timestamp — not a
  real replay guarantee when multiple AI calls happen close in time for the same prospect.

**Tradeoffs.** A is self-contained and simplest to query for single-determination replay/audit, at the cost of
duplicating `ai_usage_events`'s columns. B avoids duplication but needs a new join column neither table currently
has. C fails PO-DEC-001's replay requirement outright.

**Dependencies.** Feeds TD-9 (migration column list) and TD-15 (replay-fixture test design).

**ANALYST RECOMMENDATION — NOT A DECISION:** this is a genuine gap with no existing precedent that fully solves
it — the Technical Design Decision must resolve this explicitly rather than infer it from an incomplete pattern.

ENGINEERING SELECTION: __________________

---

## TD-7. Exact table/column names

**Evidence (from prep §7).** `category_plausibility_determinations`' actual columns (migration 0027): `id,
search_id, prospect_id, target_customer, target_segments TEXT[], aggregate_result, segment_results JSONB,
observed_at, superseded_at, created_at`. Indexes: non-unique `(search_id, prospect_id)` for history; partial
non-unique `(prospect_id) WHERE superseded_at IS NULL` for "current" reads (`category_plausibility_determinations
_current_by_prospect_idx`, 61 characters — Postgres identifier limit is 63).

**Options — table name.**
- `target_customer_match_determinations` (direct parallel to `category_plausibility_determinations`; 38 chars —
  index-name suffixes must be re-checked against the 63-char limit once chosen).
- `target_customer_matches` (shorter; parallel to `qualifications`/`opportunities` singular-table-plural-name
  convention).
- `pcg4_target_customer_match_determinations` (ties the name to the gate it serves; no existing table in this
  repo is named after a PCG gate — a new convention, not reuse).

**Options — result/evidence column names:** `result`/`classification`/`match_result` for the tri-state column;
`evidence`/`provenance` for the JSONB column (name TBD, contingent on TD-2/TD-4).

**Tradeoffs.** The `_determinations`-suffixed name is the lowest-ambiguity precedent match but is longer;
index-name length must be explicitly re-verified once a final name is chosen. The gate-named option establishes a
naming convention this repo does not currently have.

**Dependencies.** Feeds TD-8 (index names), TD-9 (migration file name), TD-13 (join SQL column references).

**ANALYST RECOMMENDATION — NOT A DECISION:** `target_customer_match_determinations` is offered as most consistent
with ED-DEC-001's and migration 0027's naming family, but this is an option, not a decision; the 63-char
index-name limit should be explicitly checked once a final name is chosen.

ENGINEERING SELECTION: __________________

---

## TD-8. Append-only/supersede schema and uniqueness/idempotency enforcement

**Evidence (from prep §8).** Migration 0027's supersession mechanism: nullable `superseded_at`, never deleted;
`supersedePrevious(search.id, prospect.id, now)` then insert (`service.ts:140-152`). **The "current" index
(`..._current_by_prospect_idx`) is `CREATE INDEX`, not `CREATE UNIQUE INDEX` — there is no DB-enforced
uniqueness** forcing "at most one non-superseded row per prospect." The invariant is maintained entirely by
application-code ordering (non-transactional — see TD-10), not by a database constraint. **This is a known latent
gap and must be surfaced as its own open decision, not silently reproduced.**

**Options.**
- **Option A** — reuse the exact pattern: nullable `superseded_at`, non-unique "current" index, application-code-
  enforced ordering only, no DB-level uniqueness guarantee (reproduces the known race-condition gap).
- **Option B** — strengthen with a partial `CREATE UNIQUE INDEX ... WHERE superseded_at IS NULL`, DB-enforcing
  "at most one current row per prospect" and closing the race condition where two concurrent writers could each
  insert a non-superseded row for the same prospect. No precedent anywhere in this repo's migrations (0016, 0018,
  0022, 0027 all use non-unique indexes + code ordering).
- **Option C** — reuse Option A but add a serializable-transaction wrapper around supersede+insert (directly tied
  to TD-10's finding that the current call site is not inside a transaction).

**Tradeoffs.** A is fastest and precedented but inherits the known race condition. B closes the gap at small
migration-time cost with no application-code change but has no local precedent. C requires the broader
transaction-boundary change discussed at TD-10.

**Dependencies.** Feeds TD-9 (index DDL), TD-10 (transaction boundary), TD-11 (retry semantics).

**ANALYST RECOMMENDATION — NOT A DECISION:** Option A is the literal precedent, but migration 0027 itself does not
DB-enforce its own "at most one current row" invariant — reusing it as-is carries that same latent gap forward
rather than fixing it. The Technical Design Decision should choose explicitly rather than default to A.

ENGINEERING SELECTION: __________________

---

## TD-9. Migration shape for migration 0036

**Settled fact (not a decision point).** `ls packages/db/prisma/migrations/ | sort` confirms the highest-numbered
existing migrations are `0031_funnel_events` through `0035_gate_evaluation_snapshots` (all currently
untracked/uncommitted per the git baseline). **The next available migration number is `0036` — this is a fact
established by the prep record's repository inspection, not an open question requiring a selection.**

**Open question — migration count and contents** (contingent on TD-1 through TD-8).

**Options.**
- **Option A** — a single combined migration `0036_<table_name>` creating both the determinations table and (if
  TD-5 selects Option A/B) the source-document capture child table in one migration, keeping their introduction
  atomic in history.
- **Option B** — two migrations, mirroring the 0027→0028 precedent exactly: `0036_<table_name>` for the
  determinations table, a later `0037_<table_name>_source_documents` for source capture, added as a separately
  authorizable increment (0028's own comment ties it to a separate authorization,
  `A11-P1-IMPL-AUTH-001`).

**Tradeoffs.** A keeps both tables' introduction atomic. B mirrors the precedent of treating "determination" and
"source capture" as independently authorizable units, which appears to have been a deliberate choice in the
0027/0028 precedent, not an accident.

**Dependencies.** Depends on TD-5 (whether source capture is in scope at all), TD-6 (metadata columns), TD-7
(naming), TD-8 (index DDL).

**ANALYST RECOMMENDATION — NOT A DECISION:** none beyond confirming `0036` as the next number (settled fact);
whether to split into one or two migrations mirrors a real precedent-based choice (0027/0028 were split), not a
technical constraint.

ENGINEERING SELECTION: __________________

---

## TD-10. Research-pipeline insertion point and transaction boundary

**Evidence (from prep §10).** `packages/core-research/src/service.ts:100-152`'s write sequence: `getById` (read)
→ `parseTargetSegments` (pure) → `provider.research(...)` (model call) → `toNewResearchSignals` (pure) →
`signals.supersedePrevious` (write) → `signals.saveSignals` (write) → if `categoryPlausibility` configured:
`toSegmentDeterminations`/`aggregateCategoryFit` (pure) → `categoryPlausibility.supersedePrevious` (write) →
`categoryPlausibility.save` (write). **No `BEGIN`/transaction wrapper is visible anywhere in this function** —
every `deps.*` write is a separate sequential `await` with no shared transaction object.

**Options.**
- **Option A** — append the new write into the exact same `if (deps.categoryPlausibility)`-style block, as a
  third determination type guarded by its own `deps.targetCustomerMatch` flag, in the same non-transactional
  sequential-await style.
- **Option B** — wrap the whole signals + categoryPlausibility + targetCustomerMatch write sequence in an actual
  DB transaction, closing TD-8's race-condition gap for all three determination families at once. This is a
  larger change than this task's governing records (ED-DEC-001, PO-DEC-001) explicitly authorize, since neither
  mentions transactionality as in scope.
- **Option C** — a wholly separate call site outside `runResearch`, invoked independently after research
  completes. Likely foreclosed by ED-DEC-001's binding "research-time" timing decision unless still synchronous
  within the same request; included for completeness only.

**Tradeoffs.** A is minimal-diff, matches precedent exactly, inherits the known non-transactional limitation. B
fixes a real gap but raises a scope question the Technical Design Decision must accept or decline explicitly, not
silently inherit (is "harden the existing non-transactional write pattern" in scope, or only "add a third
determination using the existing pattern as-is"?). C is likely foreclosed by ED-DEC-001.

**Dependencies.** Directly tied to TD-8 (same race-condition gap) and TD-11 (retry semantics given this
boundary).

**ANALYST RECOMMENDATION — NOT A DECISION:** Option A matches precedent most directly; Option B's transactionality
question should be explicitly accepted or declined by the Technical Design Decision, not silently inherited
either way.

ENGINEERING SELECTION: __________________

---

## TD-11. Retry/idempotency semantics for a retried research run

**Evidence (from prep §10, idempotency sub-finding).** A retried `runResearch` call is "safe to retry" in the
sense that `supersedePrevious` is itself idempotent (marking already-superseded rows superseded again is a
no-op), but it is **not exactly-once**: a retry produces an *additional* superseded-then-current row rather than
detecting that an identical call already ran, and rather than being a true no-op against an existing row.

**Options — behavior of a retried research run relative to existing determination rows.**
- **Option A** — reuse the exact category-plausibility pattern as-is: retry always supersedes the prior row and
  inserts a new one, with no detection of "this exact input already produced this exact output."
- **Option B** — add an idempotency key (e.g. derived from a hash of the exact model input, or from the
  `ai_usage_event`/`provider_message_id` per TD-6 Option B) so a retry that reproduces an identical prior
  determination is detected and short-circuited (no new row written) rather than always appending.
- **Option C** — add a time-window or in-flight lock (e.g. "do not allow two concurrent research runs for the same
  Search-Prospect pair") distinct from TD-8's DB-uniqueness question — this addresses concurrent *retries*
  specifically, whereas TD-8 addresses the general current-row invariant.

**Tradeoffs.** A is simplest and matches existing behavior exactly but never detects a true duplicate retry. B
gives exactly-once semantics at the cost of a new idempotency-key mechanism with no local precedent. C is a
narrower, cheaper mitigation than B but does not fully solve the duplicate-row problem, only the concurrent-write
race already covered at TD-8/TD-10.

**Dependencies.** Depends on TD-8 (uniqueness enforcement) and TD-10 (transaction boundary); contingent on TD-6
if B's idempotency key is derived from usage-event metadata.

**ANALYST RECOMMENDATION — NOT A DECISION:** Option A is the literal precedent; whether exactly-once detection
(Option B) is worth the added mechanism is a genuine open tradeoff this preparation does not resolve.

ENGINEERING SELECTION: __________________

---

## TD-12. `core-qualification-equivalence` integration — does it require modification?

**Cross-reference.** This decision point restates, as its own explicitly flagged question per the facilitation
instruction, the sub-question embedded in TD-3: **does `packages/core-qualification-equivalence/src/rules.ts`
require modification to be tri-state-aware, and if so how?** It is presented here standalone, not assumed either
way by TD-3's framing.

**Evidence.** As cited at TD-3: `rules.ts:40-56` is plain string-equality against a `string | null` field today,
with no tri-state branching. `@acos/core-qualification-equivalence` is not named in PO-DEC-001's package-ownership
language (`@acos/core-research`), which governs only the signal-production side, not necessarily this consumer
package.

**Options.**
- **Option A — modify `core-qualification-equivalence`:** change `observedTargetCustomer`'s type to the tri-state
  enum and change `rules.ts` to branch on it directly (identical to TD-3 Option A). In scope for this Technical
  Design Decision.
- **Option B — do not modify `core-qualification-equivalence`:** all translation happens at the `pcg4.ts`
  boundary (identical to TD-3 Options B/C). `core-qualification-equivalence` remains untouched and out of this
  Technical Design Decision's scope.

**Tradeoffs.** Identical to TD-3's tradeoffs: A is semantically correct but widens the authorized-scope boundary
to a package PO-DEC-001 does not name; B keeps the change contained to `@acos/core-research` +
`@acos/core-launch-gates` but discards the NO_MATCH/NOT_YET_OBSERVED distinction at the `rules.ts` level.

**Dependencies.** This decision point and TD-3 must be answered consistently — they are the same underlying
question asked from two angles (translation mechanism at TD-3; package-modification scope at TD-12). Feeds TD-13
(join/translation shape) and TD-15 (which package's test file gains coverage).

**ANALYST RECOMMENDATION — NOT A DECISION:** as at TD-3 — this is the largest unresolved cross-package boundary
question in the prep record and must be answered explicitly, not inferred from PO-DEC-001's package-ownership
language alone.

ENGINEERING SELECTION: __________________

---

## TD-13. `pcg4.ts` join shape and ED-11's "single joined query" tension

**Evidence (from prep §11).** `packages/core-launch-gates/src/pcg4.ts` (97 lines). The existing query
(`pcg4.ts:55-75`) is a single `LEFT JOIN` chain: `searches` → `prospects` → `opportunities` → `funnel_events` →
`feedback`. `pcg4.ts:17-20`'s own comment cites engineering decision **ED-11**: "one single joined query gathers
every raw fact this needs." There is currently **no join to any research/determination table at all** —
`observedTargetCustomer` is hardcoded `null` precisely because no such join exists yet (`pcg4.ts:23-32`).

**Options.**
- **Option A — widen the existing single query:** add
  `LEFT JOIN target_customer_match_determinations tcm ON tcm.search_id = s.id AND tcm.prospect_id = p.id AND
  tcm.superseded_at IS NULL` directly into `pcg4.ts:55-75`, selecting the result column into `Pcg4Row`, passing it
  (translated per TD-3/TD-12) into `evaluateQualificationEquivalence()` in place of the hardcoded `null`.
- **Option B — a separate query per Search-Prospect pair** (or N+1 lookup), avoiding widening the existing query —
  in direct tension with ED-11's "one single joined query" language; likely foreclosed rather than genuinely
  open.
- **Option C — a code-level batch fetch:** a single additional batched query
  (`WHERE (search_id, prospect_id) IN (...)`) after the main query, merged in application code — a middle ground
  between A and B: still two queries total, but the second is one batched query, not N+1.

**Tradeoffs.** A most literally satisfies ED-11 but further widens an already multi-join query and ties
`pcg4.ts`'s SQL directly to TD-7's chosen table/column names. B conflicts with ED-11 on its face. C avoids both
the ED-11-conflict risk and A's single-query complexity growth, at the cost of not being literally "one single
joined query" (though arguably still "one query per concern").

**Dependencies.** Depends on TD-7 (table/column names referenced in the join) and TD-3/TD-12 (translation of the
joined tri-state value into `evaluateQualificationEquivalence`'s input type).

**ANALYST RECOMMENDATION — NOT A DECISION:** Option A most literally satisfies ED-11, but the Technical Design
Decision should explicitly confirm whether ED-11's "single joined query" language extends to a determination
table it did not anticipate, or whether Option C's batched-second-query approach is acceptable under that
decision's intent.

ENGINEERING SELECTION: __________________

---

## TD-14. Malformed/ambiguous model output and failure/retry handling

**Evidence (from prep §12).** `packages/core-research/src/researcher.ts:27-40,149,211-227`: PROVIDER failures
(429/5xx/network) get exponential-backoff-with-jitter retry; VALIDATION failures (wrong shape, or
`verifyProvenance`/`verifyCategoryPlausibility` failures) trigger a targeted repair round via
`buildTargetedRepairMessage`/`planRepair`/`applyRepair`; a refusal (`ResearchRefusedError`) is terminal, never
retried. `fallbackResearchProvider.ts:12-38`: `ResearchProviderError` → fallback-eligible;
`ResearchRefusedError`/`ResearchValidationError`/`ResearchAbortedError` → never fallback-eligible;
`InsufficientEvidenceError` (no source documents) → thrown before any attempt, never fallback-eligible. Missing
sources specifically fail soft to UNKNOWN today (`prompt.ts:53-55`, `categoryPlausibility.ts:154-164`).

**Options.**
- **Option A — reuse the identical `researcher.ts`/`fallbackResearchProvider.ts` machinery as-is.** This
  orchestration-level retry/repair/fallback/fail-soft logic is signal-agnostic (`LeadResearch`-level, not
  per-field); a target-customer-match verdict added to the same (or a sibling) output schema under TD-1
  Options A/C inherits this behavior automatically with no new failure-handling code, and fail-soft naturally
  resolves to NOT_YET_OBSERVED per PO-DEC-001.
- **Option B — a dedicated failure path** with its own timeout/retry budget, independent of the main research
  call — only applicable if TD-1 Option B/C's "separate model call" framing is selected and TD-2 Option C's
  "multiple-call schema" is selected, requiring new retry/timeout code with no local precedent (though
  `researcher.ts`'s structure could be duplicated/parameterized).

**Tradeoffs.** A costs nothing new to build/test but applies cleanly only if TD-1/TD-2 resolve toward extending
the existing single call. B is only relevant under a standalone-second-call framing and has no local precedent to
reuse directly.

**Dependencies.** Directly determined by TD-1 (input shape/call count) and TD-2 (output schema/call count).

**ANALYST RECOMMENDATION — NOT A DECISION:** this point is largely resolved once TD-1 and TD-2 are resolved;
flagged as dependent rather than independently open.

ENGINEERING SELECTION: __________________

---

## TD-15. Test architecture — 9 fixture categories + persistence/replay/contradiction/fail-soft

**Evidence (from prep §13).** `categoryPlausibility.test.ts`, `service.test.ts`, `research.test.ts` exist under
`core-research`; `pcg4.test.ts` exists under `core-launch-gates`. **No file literally named `evaluator.test.ts`
exists under `core-research` or `core-launch-gates`** — that name exists only in sibling packages:
`packages/core-qualification-equivalence/src/evaluator.test.ts` and `packages/core-qualification/src/evaluator.test.ts`.
If TD-3/TD-12 place translation logic in `core-qualification-equivalence`, its test precedent is that package's
own `evaluator.test.ts`/`rules.ts` tests, not anything under `core-research`.

**Candidate test-file structure options** (not pre-selected).
- **Option A — new dedicated file:** a `targetCustomerMatch.test.ts` (parallel to `categoryPlausibility.test.ts`)
  covering deterministic pre/post-processing, all 9 PO-DEC-001 fixture categories (as individual `it()` blocks or
  `describe.each`), and the contradictory-evidence → NOT_YET_OBSERVED case explicitly; plus extensions to
  `service.test.ts` (insertion-point/transaction/idempotency, TD-10/TD-11), `pcg4.test.ts` (join/translation,
  TD-13), and a new repository-level test for supersede/uniqueness (TD-8).
- **Option B — extend existing files only:** fold target-customer-match coverage into
  `categoryPlausibility.test.ts`/`service.test.ts`/`pcg4.test.ts` directly rather than adding a new file, on the
  grounds that the two signals share orchestration machinery (per TD-14 Option A).
- **Option C — split by package per TD-3/TD-12's resolution:** if translation logic lands in
  `core-qualification-equivalence`, add coverage to that package's existing `evaluator.test.ts`/`rules.ts` tests
  instead of (or in addition to) anything under `core-research`.

**Tradeoffs.** A keeps the new signal's test surface clearly separated and easy to locate but adds a new file.
B minimizes new files but risks conflating two independently governed signals' test concerns in one file. C is
not a true alternative but a necessary addition if TD-3/TD-12 selects cross-package modification — it is
additive to whichever of A/B is chosen, not a substitute.

**Dependencies.** Depends on TD-1, TD-2, TD-3/TD-12, TD-8, TD-10, TD-11, TD-13.

**ANALYST RECOMMENDATION — NOT A DECISION:** flagged primarily that no `evaluator.test.ts` exists under
`core-research`/`core-launch-gates` today — if TD-3/TD-12 place translation logic in
`core-qualification-equivalence`, Option C's addition to that package's existing test file is necessary
regardless of the A/B choice for the `core-research`-side tests.

ENGINEERING SELECTION: __________________

---

## TD-16. Acceptance criteria / implementation-release gates

**Evidence (from prep §14).** `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`
(`CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001`) structures authorization as a per-workstream
table (W-1 through W-16), each with a named governing-decision reference, an Authorized/Blocked status, and an
explicit numbered "Acceptance criteria:" line. `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md`
(`CLIENT-FINDER-PDEF-4-IMPLEMENTATION-CONFORMANCE-001`) is the matching after-the-fact record (workstream→files
mapping, Done/Blocked/gap-with-disposition per row). Both explicitly disclaim deployment/release/launch
authority.

**Options** (structural only; content is entirely contingent on TD-1 through TD-15).
- **Option A** — a per-workstream authorization table (e.g. "W-1 migration," "W-2 model call," "W-3 pcg4.ts
  join/translation," "W-4 tests," "W-5 core-qualification-equivalence change if TD-3/TD-12 selects it"), each with
  its own explicit acceptance-criteria sentence, following `IMPLEMENTATION_AUTHORIZATION_DECISION.md`'s pattern
  exactly, plus a matching conformance record following `IMPLEMENTATION_CONFORMANCE_RECORD.md`'s structure.
- **Option B** — a lighter single combined authorization note (no per-workstream table), appropriate only if the
  resolved scope from TD-1 through TD-15 turns out to be small enough (e.g. TD-3/TD-12 selects "no
  cross-package change" and TD-9 selects "one migration") that a full 16-row-style table would be disproportionate
  to the actual change size.

**Tradeoffs.** A is the only precedent found in this record family and is directly reusable regardless of how
TD-1 through TD-15 resolve. B trades structural consistency with precedent for brevity, and is only appropriate if
the resolved scope is genuinely small.

**Dependencies.** All of TD-1 through TD-15 feed this point's *content*; this point only establishes the
*structural* template choice.

**ANALYST RECOMMENDATION — NOT A DECISION:** Option A (the structural template from
`IMPLEMENTATION_AUTHORIZATION_DECISION.md`/`..._CONFORMANCE_RECORD.md`) is offered as the directly reusable
pattern; no acceptance-criteria content is proposed since it depends entirely on TD-1 through TD-15.

ENGINEERING SELECTION: __________________

---

## Dependency / resolution-order map

```
TD-1  (model input shape: segment vs. company-level vs. shared-call)
  ├─→ TD-2  (output schema / contradictory-quote representation)
  │     ├─→ TD-3/TD-12 (tri-state translation; core-qualification-equivalence scope)
  │     │     └─→ TD-13 (pcg4.ts join/translation shape)
  │     └─→ TD-4  (evidence/provenance object schema)
  │           └─→ TD-5  (structural/cryptographic binding)
  │                 └─→ TD-6  (model/provider/version metadata)
  └─→ TD-14 (malformed/ambiguous output handling — resolved once TD-1/TD-2 resolved)

TD-7  (table/column names) ──→ TD-8 (supersede/uniqueness DDL) ──→ TD-9 (migration 0036 shape: 1 vs. 2 migrations)
                                     └─→ TD-10 (insertion point / transaction boundary)
                                           └─→ TD-11 (retry/idempotency semantics)

TD-3/TD-12 ──→ TD-13 ──→ (feeds TD-9's column references via TD-7)

TD-1, TD-2, TD-3/TD-12, TD-8, TD-10, TD-11, TD-13 ──→ TD-15 (test architecture)

TD-1 through TD-15 (all) ──→ TD-16 (acceptance-criteria content; structure is independent)
```

**Recommended resolution order:** TD-1 → TD-2 → TD-3/TD-12 (answer together) → TD-4 → TD-5 → TD-6 → TD-7 → TD-8 →
TD-9 → TD-10 → TD-11 → TD-13 → TD-14 → TD-15 → TD-16. This order resolves the model-call shape and schema
questions first (since nearly everything downstream references them), then the storage/table questions, then the
pipeline/retry questions, then translation/join, then test and acceptance-criteria structure last.

---

## Prohibitions and scope confirmation

- No option in this document has been selected on the engineering's behalf; every `ENGINEERING SELECTION:` line
  is blank.
- No recommendation above is implied as already chosen; each is labelled exactly
  `ANALYST RECOMMENDATION — NOT A DECISION`.
- No code, schema, migration, test, configuration, or dependency file has been created, modified, or deleted by
  this task.
- No prior governing record (`PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`, `PDEF4-PCG4-ED-DEC-001`,
  `PDEF4-PCG4-TCMATCH-TECHDESIGN-PREP-001`, or any other) has been reopened, reinterpreted, or modified.
- This document does not authorize any implementation work. Implementation remains unauthorized pending
  completion of the `ENGINEERING SELECTION:` lines above and a subsequent, separate Technical Design Decision
  record.
