# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Engineering Design Decision

**Record ID:** `PDEF4-PCG4-ED-DEC-001`
**Date:** 2026-10-05
**STATUS: DECIDED — DELEGATED PRODUCT OWNER AUTHORITY (ENGINEERING-DESIGN DECISIONS ONLY)**

---

## 1. Governing sources (file + SHA-256)

Computed via `shasum -a 256` against the working tree at the baseline SHA in §2.

| File | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` | `84db9339765c209cc4ed8ad9319400dd3f1e359c6f62e02afd9aecca56a6484d` |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_PREPARATION.md` | `dc556170189a9c4b0fa13e3ca24672a4e2315bd8a0e146753b019d97023bfd79` |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_QUESTIONNAIRE.md` | `82725604eb3be3ebf0900d9182ea9927456de3197e1632322ba9c91b7c4cba15` |
| `packages/core-launch-gates/src/pcg4.ts` | `208492721d7af0fce54c1268e2b44e9291b9da89dc10d1f2ba7a90f723f1a7d9` |
| `packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql` | `11823808d44c89ec22a2f5549d2f9873d954c2e17eca1149233955a5d278c508` |
| `packages/core-qualification-equivalence/src/rules.ts` | `06ac4c5beafad7bd6e454a60119cb4299779d2e9f2239dc057a3de010050ca51` |
| `packages/core-qualification-equivalence/src/evaluator.ts` | `adc8f6bec9d62029a271ee82d445b5de348535f91f31568b485537141ab4a5f7` |
| `packages/db/prisma/migrations/0017_opportunities/migration.sql` | `bc31ee6658d43ad19a37e97fdf69c5f23779602c2fa05090d2d378ebba3fe862` |
| `packages/db/prisma/migrations/0015_discovery/migration.sql` | `f85fd93902032241a12c47301b7750dd0b2164ced98a8842899545369436b726` |
| `packages/db/prisma/migrations/0022_qualifications/migration.sql` | `5308d6c2d4e2a28847c51cf0e0fe0809f0ebaef87cd2b52a35aafccba39f3626` |
| `packages/db/prisma/migrations/0035_gate_evaluation_snapshots/migration.sql` | `3647fc21b795e18e037749b85144b75509a50347afdf054bbe69bdd6a7a2e71a` |

**Note on the task's supplied "known-good" reference hashes for the PO decision/prep/questionnaire docs:**
the three values supplied to verify against (`35e93226...`, `60616bd1...`, `9c47d020...`) are 40 hexadecimal
characters long — the length of a SHA-1 digest, not a SHA-256 digest (64 hex characters). They cannot be
genuine SHA-256 digests of these files, and the SHA-256 values actually computed above do not match them as
strings (expected, given the length mismatch). This record does not treat that mismatch as a sign the three
files were tampered with — it is reported as a verification-input inconsistency, not resolved by assuming
either direction. The three files were read in full in this session and their content is internally
consistent with the facts, options, and open items this record relies on; no edit was made to any of them
(confirmed by `git status --short`, §2).

The 0027 / 0022 / 0035 migrations and `pcg4.ts`/`rules.ts`/`evaluator.ts` are cited as **architectural
precedent and current-behavior evidence only** — never as an automatically-authorizing semantic source for
target-customer match, per the task's binding instruction.

---

## 2. Baseline Git SHA / status

- `git rev-parse HEAD` → `af9ede93830f5e3e611195dc2451a470364def74` — **matches** the required baseline.
- `git status --short` (before this file was created): 74 entries, all pre-existing (23 modified tracked
  files, 51 untracked files/directories), none touched by this task. No file relevant to this decision
  (`pcg4.ts`, the three governing PDEF-4 PCG-4 docs) appears modified.
- Staged files: 0.

---

## 3. ED-TC-1 decision — Signal owner

**Selected: Search–Prospect evidence relation (0027-style)** — a new, dedicated evidence table keyed by
`(search_id, prospect_id)`, not a column on `opportunities` and not a bare `prospect_id`-only column/table.

## 4. ED-TC-6 decision — Timing

**Selected: Research-time** — populated within the existing per-Prospect research pipeline call
(`packages/core-research/src/service.ts`'s per-prospect loop), the same pipeline position
`category_plausibility_determinations` already runs at (without reusing its computation).

## 5. ED-TC-3 decision — Storage shape

**Selected: Three-state enum stored directly** (`MATCH` / `NO_MATCH` / `NOT_YET_OBSERVED`), as a `CHECK`-constrained
column on the new Search–Prospect table from §3, mirroring `category_plausibility_determinations.aggregate_result`.
Row absence (no non-superseded row yet) is the `NOT_YET_OBSERVED` state; it is never materialized as a default
`'NOT_YET_OBSERVED'` row ahead of actual observation.

## 6. ED-TC-4 decision — Provenance

**Selected: Quote/source-shaped evidence** (Option 1: `sourceUrl`, `sourceLabel`, `quote`, `confidence`, `basis`,
`classification`), mirroring `category_plausibility_determinations.segment_results`'s shape — scoped to what the
Research-time mechanism (§4) actually produces, not expanded beyond it. No full source-document duplication: the
provenance fields reference/quote the minimum excerpt needed to justify the result, not the entire source
document, and no PII beyond what the existing 0027 pattern already carries (none — 0027 stores no personal data,
only business-research quotes/URLs).

## 7. ED-TC-8 decision — Recomputation / history

**Selected: Append-only, supersede-then-insert** (Option B), mirroring `category_plausibility_determinations`'s
own `superseded_at` convention: a same-`(search_id, prospect_id)` re-observation supersedes the prior row rather
than overwriting it in place; a different Search's row for the same Prospect is never touched. The signal's own
history is preserved independently of, and in addition to, `gate_evaluation_snapshots`' existing gate-level
reproducibility mechanism (§9's "which observation PCG-4 actually reads," below).

## 8. ED-TC-9 derived decision — Migration shape (described only, not created)

Following directly from §3–§7, the resulting migration (not created by this record) would be:

- **New table**, numbered after `0035` (next available: `0036`), name illustrative only (e.g.
  `target_customer_determinations`), structurally parallel to `0027_category_plausibility_determinations`.
- **Columns:** `id` (PK), `search_id` (FK → `searches.id`, `ON DELETE CASCADE ON UPDATE CASCADE`, matching 0027's
  FK convention), `prospect_id` (FK → `prospects.id`, same cascade convention), `result` (`TEXT CHECK (result IN
  ('MATCH','NO_MATCH','NOT_YET_OBSERVED'))`, per §5), an evidence column (JSONB array, quote-shaped per §6:
  `[{sourceUrl, sourceLabel, quote, confidence, basis, classification}]`), `observed_at` (timestamp, not null once
  a row exists), `superseded_at` (nullable timestamp, per §7), `created_at`.
- **Indexes:** a non-unique index on `(search_id, prospect_id)` for lookup, plus a partial index on
  `(search_id, prospect_id) WHERE superseded_at IS NULL` to guarantee a single "current" row is read per
  `(search_id, prospect_id)` pair — no hard `UNIQUE` constraint, consistent with the append-only model (§7).
- **Foreign keys:** `search_id` → `searches.id`, `prospect_id` → `prospects.id`, both `ON DELETE CASCADE ON
  UPDATE CASCADE`, matching 0027's existing convention exactly.
- **Enum/type choice:** a `CHECK` constraint with exactly the three values named by the governing PO decision
  (`MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED`); no separate Postgres `ENUM` type is implied or required beyond what
  0027 itself uses for `aggregate_result`.
- **Nullability:** every new column is nullable-or-absent at creation time in the sense that no row exists for
  any current Prospect until the Research-time mechanism (§4) first runs; this is additive-only and requires no
  backfill, because `NOT_YET_OBSERVED` (row absent) is already the correct, intended state for every existing
  Opportunity today.
- **Backfill:** none required or implied.
- **Compatibility:** purely additive; no existing `searches`, `prospects`, `opportunities`, or
  `category_plausibility_determinations` column is altered, dropped, or retyped.
- **Rollback:** a single corresponding `DROP TABLE` migration — trivially reversible, as with every other
  additive-only migration since `0014`.
- **`pcg4.ts` wiring (application code, not a migration):** add one `LEFT JOIN` on `(search_id, prospect_id)
  WHERE superseded_at IS NULL` to the existing single joined query (`packages/core-launch-gates/src/pcg4.ts`),
  select the `result` column, and translate it at the repository/subject-construction boundary into
  `QualificationEquivalenceSubject.observedTargetCustomer: string | null` — `MATCH` maps to a value equal to the
  Search's own `target_customer` string (satisfying `evaluateTargetCustomerMatch`'s existing equality check),
  `NO_MATCH` maps to a value that normalizes differently from it, and `NOT_YET_OBSERVED`/row-absent maps to `null`.
  The exact translation function is implementation detail for a future authorization, not specified further here;
  no change to `evaluateTargetCustomerMatch`/`rules.ts`/`evaluator.ts` is implied.

This description is derived entirely from §3–§7 above; it is not itself a migration, schema file, or
`schema.prisma` edit, and none was created.

---

## 9. Rationale per decision

### ED-TC-1 (signal owner)
The governing PO decision's semantics (§7 of `PDEF4-PCG4-PO-DEC-001`) bind the signal to "the specific
Opportunity's Prospect, as actually observed," evaluated **against the Search's configured `targetCustomer`
criterion** — not against the Prospect's identity in isolation. `evaluateTargetCustomerMatch` compares the
observed value to `snapshot.targetCustomer`, i.e. to one specific Search's criterion. An Opportunity-owned or
bare-Prospect-owned signal cannot represent "this Prospect matched Search X's target customer but we have no
observation for Search Y's different criterion" if the same Prospect/Company is ever evaluated against more
than one Search's criterion — a possibility the schema does not foreclose. Only a signal keyed jointly by
`search_id` and `prospect_id` can represent the per-Search-criterion result the PO decision actually requires,
and this exact shape already has a proven, working precedent in this repository
(`category_plausibility_determinations`, 0027) without reusing its computed values (which remain excluded per
B-3).

### ED-TC-6 (timing)
No governing record mandates a timing, so this decision rests on repository-consistency evidence: every
comparable evidence table (`category_plausibility_determinations`, `research_signals`) is pre-computed and
persisted at a well-defined pipeline stage, never computed lazily inside a gate query, and `pcg4.ts` itself has
no existing pattern for inline computation. Research-time is the only option with a currently working pipeline
position in this exact repository (`core-research/src/service.ts`'s per-Prospect loop) that already has document
evidence in hand at that point, without requiring new infrastructure (unlike an async worker) or breaking
`pcg4.ts`'s single-query/pure-evaluator split (unlike gate-evaluation-time, ED-11). This preserves
`NOT_YET_OBSERVED` by construction: absence of a row prior to the Research-time write is read as `null`/`UNKNOWN`
today and continues to be so after this signal exists, since the translation at the `pcg4.ts` boundary (§8) never
defaults an absent row to `NO_MATCH`.

### ED-TC-3 (storage shape)
Given ED-TC-1's dedicated-table outcome, a three-state enum stored directly on that table is the natural,
lowest-risk shape: it mirrors `category_plausibility_determinations.aggregate_result`'s proven `CHECK`-constrained
enum exactly, keeps the evaluator-facing `string | null` translation as a thin boundary mapping (not a redesign
of `rules.ts`), and avoids inventing a derived-at-read-time comparison that would otherwise need to re-implement
`evaluateTargetCustomerMatch`'s own normalization logic a second time at the storage layer. Storing the result
directly (rather than only a raw observed string compared later) also makes `NO_MATCH` an explicit, auditable
fact rather than an implicit byproduct of string inequality, which is clearer for future auditors and
re-validation.

### ED-TC-4 (provenance)
Minimum-needed framing, applied literally: *what was evaluated* (the Prospect, via `prospect_id`), *against
which criterion* (the Search, via `search_id`, with the Search's `targetCustomer` value recoverable live from
`searches.target_customer` at read time — no need to duplicate it into this table), *what result* (the `result`
enum, §5), *what evidence supported it* (the quote/source array), *when produced* (`observed_at`). Because
ED-TC-6 selected a document-derived, Research-time mechanism, the evidence that actually exists at that point is
inherently quote/source-shaped — the same evidence `category_plausibility_determinations` already has in hand at
the identical pipeline position, without implying this signal reuses that computation. The evaluator-result-shaped
alternative (0022-style `evidenceSignalIds`) was not selected because it fits a deterministic-rule-over-persisted-
signals mechanism, which ED-TC-6 did not select. No PII is introduced: the evidence fields are the same
non-personal, business-research quote/URL shape 0027 already uses.

### ED-TC-8 (history)
Preserving historical truth/auditability was the task's explicit instruction, and append-only/supersede-then-
insert is the only option (short of full immutable versioning, which has no local precedent at the signal level
and would duplicate what `gate_evaluation_snapshots` already does at the gate level, per the questionnaire's own
§5.3 observation) that satisfies every named concern: a changed Search criterion remains attributable to the row
that was actually evaluated against it (the superseded row retains its own context); a changed Prospect
observation (e.g. a Research re-run) produces a new row rather than erasing the old one; deterministic replay of
"what did we observe, and when" remains possible without relying on `gate_evaluation_snapshots` to reconstruct it
indirectly. Which observation PCG-4 actually reads is unambiguous under this model: the one non-superseded row
for the matching `(search_id, prospect_id)` pair, via the partial index named in §8.

### ED-TC-9 (derived migration shape)
Entirely downstream of §3–§7; no independent rationale beyond "this is what those four decisions imply," as the
task instructed. The shape described is structurally near-identical to 0027 with a different result enum and
evidence payload, which is intentional — it reuses a proven, already-reviewed local pattern rather than inventing
a new one, minimizing migration and review risk for whatever future implementation-authorization decision
actually builds it.

---

## 10. Repository evidence supporting feasibility

- `packages/core-launch-gates/src/pcg4.ts` (lines constructing `QualificationEquivalenceSubject`) already joins
  `searches → prospects → opportunities` in one query and hardcodes `observedTargetCustomer: null` — confirming
  both `search_id` and `prospect_id` are already in scope for the additional `LEFT JOIN` described in §8, and
  that no other line of this file would need to change.
- `packages/core-qualification-equivalence/src/rules.ts` (`evaluateTargetCustomerMatch`) already implements the
  fail-soft `null → 'UNKNOWN'` contract and a normalized string-equality comparison — confirming no change to
  this file is implied by any decision above.
- `packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql` is a complete, working
  precedent for every structural element of §8's described migration (dedicated table, `(search_id, prospect_id)`
  key, `CHECK`-constrained result enum, JSONB quote-shaped evidence array, `superseded_at`, cascade FKs, partial
  index), confirming feasibility without inventing new infrastructure.
- `packages/core-research/src/service.ts`'s per-Prospect research loop already calls a superseding
  save for `category_plausibility_determinations` at exactly the pipeline position ED-TC-6 selects, confirming a
  second, independent superseding write at the same position is structurally compatible with existing code (no
  conflict with the already-excluded category-plausibility computation).
- `packages/db/prisma/migrations/0022_qualifications/migration.sql` and `.../0035_gate_evaluation_snapshots/`
  were read only as alternative architectural precedents (mutable-current-row and immutable-gate-snapshot
  patterns, respectively) to confirm append-only/0027-style was a deliberate choice among genuine alternatives,
  not the only option available — per the task's instruction that these are precedent only, never an
  automatically-authorized semantic source for target-customer match itself.

---

## 11. PO decision vs. engineering observation — explicit callout

**Binding decisions made by this record** (Product-Owner-level, under delegated authority): the six selections
in §3–§8 (ED-TC-1 to ED-TC-9) and nothing else.

**Engineering observations/recommendations that informed those decisions, not themselves binding beyond this
record's reliance on them:** the repository-fact tables and tradeoff analyses in the governing preparation and
questionnaire documents (§3 of the preparation record; §1–§6 of the questionnaire), including their analyst
recommendations — this record adopted the questionnaire's own analyst recommendations for ED-TC-1, ED-TC-6, and
ED-TC-8 after independently verifying their reasoning against the repository evidence in §10, and selected among
the questionnaire's presented options for ED-TC-3 and ED-TC-4 using the task's own stated decision criteria
(semantic correctness, auditability, minimal coupling, consistency with 0027/qualifications/gate_evaluation_
snapshots precedent) rather than adopting those sections' conditional/non-recommendations by default. ED-TC-9 is,
by the task's own instruction, a pure derivation from §3–§7 and carries no independent engineering judgment beyond
restating 0027's structural template with a different payload.

---

## 12. Downstream implementation consequences

- A future, separate implementation-authorization decision is required before any code, schema, or migration
  work begins — this record authorizes none of it (see §14).
- The concrete migration described in §8 would be numbered `0036` or later, additive-only, with no Prisma model
  required (consistent with `Opportunity`/`Prospect` having none today).
- The only named application-code change is the `pcg4.ts` subject-construction read plus one new `LEFT JOIN`
  (§8) — no change to `evaluateTargetCustomerMatch`/`rules.ts`/`evaluator.ts`.
- A new Research-time write path (§4, §6) becomes a required, separately authorized workstream — most likely
  located alongside `category_plausibility_determinations`'s own save/supersede call in
  `packages/core-research/src/service.ts`, in `@acos/core-research` or a narrowly-scoped sibling package (not
  decided here).
- PCG-4 remains `NOT_YET_EVALUABLE` until that future implementation actually lands; this record changes no
  runtime behavior.
- No other gate (PCG-1, PCG-2, PCG-3A, PCG-3B, PCG-5, PCG-6) or `@acos/core-launch-gates-validation`'s
  independent-validation scope is affected.

---

## 13. Remaining implementation dependencies (open items outside these six decisions)

- **Exact translation function** mapping the stored `MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED` enum to
  `observedTargetCustomer: string | null` at the `pcg4.ts` boundary (§8) is named only in outline, not specified
  byte-for-byte — left to the future implementation-authorization decision.
- **Which package owns the new table and the Research-time write path** (`@acos/core-research` vs. a new,
  narrowly-scoped package) is not decided by this record.
- **The exact mechanism that produces the `MATCH`/`NO_MATCH` judgment itself** (e.g. an LLM-based determination
  analogous to category-plausibility's own non-reused computation, vs. some other deterministic-at-source
  method) is a policy/engineering question this record does not answer — ED-TC-6 fixes only *when* in the
  pipeline this runs, not *how* the judgment is computed. This is the single largest open dependency: without it,
  the migration in §8 can be built, but nothing yet populates it correctly.
- **Table/column naming** used in §8 is illustrative only, not a binding name.
- **Test/validation plan** (per the preparation record's §8, not reopened or executed here) remains to be written
  as part of the future implementation authorization.

---

## 14. Authorization boundary

This record authorizes **only** the six engineering-design decisions in §3–§8 (ED-TC-1, ED-TC-6, ED-TC-3,
ED-TC-4, ED-TC-8, and the ED-TC-9 derived description). It does **not** authorize, and nothing in it should be
read as authorizing: schema changes, migrations, application code, evaluator changes (`rules.ts`/`evaluator.ts`),
worker changes, tests, validation execution, deployment, release, launch, billing, or entitlement changes. No
source file, test file, schema file, or migration was created or modified in producing this record — the only
file created is this one. PCG-4 continues to run exactly as implemented today
(`observedTargetCustomer: null`, numerator structurally non-positive) until a future, separate implementation-
authorization decision and actual engineering work occur.

---

## 15. Provenance statement

This decision was made under delegated Product Owner authority exercised by Claude (Anthropic AI assistant) for
this task, at the explicit request of the human Product Owner in this session, and is recorded transparently as
such. It is not, and must not be represented as, an answer directly supplied by a human Product Owner.
