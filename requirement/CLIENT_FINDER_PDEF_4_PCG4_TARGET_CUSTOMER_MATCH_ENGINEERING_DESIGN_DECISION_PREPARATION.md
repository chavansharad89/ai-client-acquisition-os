# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Engineering Design Decision Preparation

**Record ID:** `CLIENT-FINDER-PDEF-4-PCG4-TARGET-CUSTOMER-MATCH-ENGINEERING-DESIGN-PREPARATION-001`
**Date:** 2026-10-05
**Type:** Read-only engineering-design preparation record. **No implementation, schema, migration, or code change
is made or authorized by this document.** It prepares the engineering-design (ED) questions that a future,
separate authorization must resolve before Option B (below) can be built.

---

## 1. Governing Product Owner decision (restated, not reopened)

`requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` (`PDEF4-PCG4-PO-DEC-001`,
2026-10-05) decided:

- **Option B selected**: authorize the *product-semantic definition* of a new, future, Opportunity-level
  observed-target-customer signal, as new engineering scope requiring its own subsequent ED and
  implementation-authorization decisions. The decision **does not itself design, migrate, implement, or populate**
  that signal (§5, §9, §11 of that record).
- Exact semantics (§7 of that record): `TARGET_CUSTOMER_MATCH` means *whether the specific Opportunity's Prospect,
  as actually observed during research/review, was found to be the kind of customer the user's Search configured
  as its `targetCustomer` criterion* — never Search/Discovery membership, never category plausibility, never
  service/value match, never free-text/inferred characterization.
- Result shape (§9): **tri-state** — match / no-match / not-yet-observed — not boolean, so an unreviewed
  Opportunity resolves to `'UNKNOWN'` under `evaluateTargetCustomerMatch`'s existing fail-soft contract, never a
  default `true` or `false`.
- PCG-4 **remains `NOT_YET_EVALUABLE`** (§8) until the signal is designed, migrated, implemented, and wired into
  `packages/core-launch-gates/src/pcg4.ts`'s subject construction. PCG-4 is monitoring-only, so this has no launch
  effect (`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.3–§6.4, cited there).
- Minimum future wiring named (§9, not performed): add the new field to `QualificationEquivalenceSubject`'s
  construction in `pcg4.ts`, replacing the current hardcoded `observedTargetCustomer: null`; no change required to
  `evaluateTargetCustomerMatch`/`rules.ts`, whose contract already expects exactly this input shape.

This record does not reopen, amend, or contradict the PO decision, `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md`
(B-3/B-7), `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`, or
`CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md`. It also does not reopen or implement "ED-3"
(bot/internal-traffic exclusion), which is an unrelated, separately tracked item (§3A of the conformance record).

---

## 2. Repository facts

| # | Fact | Citation |
|---|---|---|
| F1 | `pcg4.ts`'s only production caller passes `observedTargetCustomer: null` unconditionally; no code path populates it with anything else today. | `packages/core-launch-gates/src/pcg4.ts:105` |
| F2 | `evaluateTargetCustomerMatch` already implements the tri-state contract: `subject.observedTargetCustomer === null` → `satisfied: 'UNKNOWN'`; otherwise a normalised string-equality comparison against `snapshot.targetCustomer` → `true`/`false`. It never throws. | `packages/core-qualification-equivalence/src/rules.ts` (`evaluateTargetCustomerMatch`) |
| F3 | Overall `match` precedence: `anyFalse ? false : anyUnknown ? 'UNKNOWN' : true` — an `'UNKNOWN'` on `TARGET_CUSTOMER_MATCH` alone prevents a clean `true` even if `SERVICE_MATCH`/`MINIMUM_VALUE_MATCH` both pass. | `packages/core-qualification-equivalence/src/evaluator.ts` |
| F4 | `SearchSnapshot.targetCustomer` is the Search owner's stated criterion at Search-creation time (e.g. "Restaurants"), stored on `searches.target_customer`, written once and never compared against from the Search side again. | `packages/core-search/src/pgRepository.ts` (`COLUMNS`, `createSearch`); `packages/db/prisma/migrations/0014_searches` |
| F5 | `opportunities` (migration `0017_opportunities`) has no `target_customer`/`observed_target_customer`/equivalent column. Existing columns relevant to the other two criteria: `recommended_service` (SERVICE_MATCH), `offer_estimated_value_paise` (MINIMUM_VALUE_MATCH). `offer_rationale` is free text from `suggestOffers()`, not a structured field. | `packages/db/prisma/migrations/0017_opportunities/migration.sql` |
| F6 | `prospects` (migration `0015_discovery`) carries only `id`, `user_id`, `search_id`, `company_id`, `status` (`DISCOVERED` only), `created_at` — no target-customer-like column. `companies` carries only `id`, `user_id`, `name`, `normalized_domain`. | `packages/db/prisma/migrations/0015_discovery/migration.sql` |
| F7 | The one existing repository mechanism that evaluates a Prospect against a target-customer-*like* concept is `category_plausibility_determinations` (migration `0027_category_plausibility_determinations`): keyed by `(search_id, prospect_id)`, holding `target_customer`, `target_segments[]`, `aggregate_result` (`MATCH`/`MISMATCH`/`UNKNOWN`), `segment_results` (JSONB array of `{segment, fit, rationale, evidence:[{quote, sourceUrl, sourceLabel}], confidence, basis, classification}`), `observed_at`, `superseded_at` (append-only, supersede-then-insert, never deleted). | `packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql`; `packages/core-research/src/categoryPlausibility.ts` |
| F8 | Category plausibility is explicitly excluded as the `TARGET_CUSTOMER_MATCH` source by the governing B-3/PO record text: "do NOT use category-plausibility as a substitute; B-3 explicitly excludes that." Confirmed by the PO decision's own evidence survey (§3, Option C). | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` §3; `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md` §6 |
| F9 | Category plausibility is populated during the **Research** stage, alongside `StoredResearchSignal` persistence, per-Search-Prospect, with the same append-only supersede convention research signals use. | `packages/core-research/src/service.ts:137-143` (`deps.categoryPlausibility.supersedePrevious(...)`, `.save(...)`, called from the research pipeline's per-prospect loop) |
| F10 | `@acos/core-qualification`'s `CATEGORY_PLAUSIBLE` criterion (a *different*, already-existing evaluator for a *different* purpose — Opportunity qualification, not PCG-4) is itself named by the PDEF-4 authorization record as semantics the new PCG-4 evaluator must **not** reuse. | `packages/core-qualification/src/types.ts` (`QUALIFICATION_CRITERIA`); `requirement/CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` (W-8) |
| F11 | `qualifications` (migration `0022`, `StoredQualification`) models `evaluatorVersion`, `evaluatedAt`, `criteria` (array of `{criterion, satisfied, reason, evidenceSignalIds}`) — the repository's existing precedent for a *provenanced* per-criterion evaluator result, distinct from `category_plausibility_determinations`'s evidence-quote shape. | `packages/core-qualification/src/types.ts` |
| F12 | `gate_evaluation_snapshots` (migration `0035`) models immutable, append-only, per-(gate, window, computation_path) evidence with a uniqueness constraint preventing duplicate rows on re-run — the repository's existing precedent for gate-level evidence immutability/idempotency, distinct from per-Opportunity evidence. | `packages/db/prisma/migrations/0035_gate_evaluation_snapshots/migration.sql` |
| F13 | PCG-4 is a monitoring gate, not one of the four independent-validation blocker gates (PCG-1/2/3A/3B); `@acos/core-launch-gates-validation` does not and need not recompute it. | `requirement/CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.3–§6.4; `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md` §10 |
| F14 | `Opportunity`/`Prospect` have no Prisma model — the schema for these tables lives entirely in raw migration SQL, not `packages/db/prisma/schema.prisma`. | Confirmed by the PO decision record §2 ("confirmed no Prisma model exists for it; schema lives in raw migration SQL") |
| F15 | PDEF-3's governing definition of "useful outcome" (adopted threshold record) already names "target customer characteristics" as one of three criteria a qualified opportunity must satisfy — consistent with, not expanding, PCG-4's three-criterion contract. | `requirement/CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md` §9 |

---

## 3. Engineering observations

- The repository already contains one complete, working example of exactly the kind of "observed signal with
  tri-state-like result + structured evidence + append-only supersede" mechanism this gate needs —
  `category_plausibility_determinations` — but it is governance-excluded as the *source*, not as a *pattern*. Its
  table shape (keyed by `(search_id, prospect_id)`, `aggregate_result` enum, evidence array, `observed_at`/
  `superseded_at`) is the closest structural precedent in this repository for whatever new, separate signal Option
  B eventually authorizes, without implying that signal reuses or derives from category plausibility's actual
  computed values.
- `pcg4.ts`'s SQL already joins `searches → prospects → opportunities` in one query (F1's citation). Any new
  signal keyed by `prospect_id` (prospect-level) or `opportunity_id` (opportunity-level) is reachable from that
  existing join shape without a structural change to the query's join graph — only an additional `LEFT JOIN` and
  `SELECT` column, consistent with ED-11's "single joined query" constraint already governing this file.
- The PO decision's semantics (§1 above) bind the signal to the *Opportunity's Prospect*, not to the Opportunity
  row itself — i.e., the natural key is prospect-shaped (`(search_id, prospect_id)` or `prospect_id` alone),
  mirroring category-plausibility's own keying, even though the consuming evaluator (`QualificationEquivalenceSubject`)
  is constructed per-Opportunity in `pcg4.ts`. This is a repository-evidenced tension the design questions below
  must resolve (ED-TC-1), not a settled fact.
- `evaluateTargetCustomerMatch`'s existing contract (F2) imposes no new requirement on whatever populates
  `observedTargetCustomer` beyond "a string, or null" — the entire tri-state/evidence/provenance design space
  below is about what populates that one field, not about changing the evaluator itself (consistent with the PO
  decision's §9 statement that `rules.ts` needs no change).

---

## 4. Engineering options, per design question

### ED-TC-1 — Signal owner

- **Option 1 — Prospect-owned.** A new table/column keyed by `prospect_id` (optionally also `search_id`, mirroring
  `category_plausibility_determinations`'s `(search_id, prospect_id)` key). Matches the PO decision's own framing
  ("the specific Opportunity's **Prospect**, as actually observed") and the repository's one existing precedent
  for this exact shape of signal (F7, F9).
- **Option 2 — Opportunity-owned.** A new column/table keyed by `opportunity_id`, matching where the evaluator's
  `QualificationEquivalenceSubject` is actually constructed (`pcg4.ts`) and where the other two criteria's source
  fields already live (`recommended_service`, `offer_estimated_value_paise` on `opportunities`, F5).
- **Option 3 — Search-owned.** Rejected by the governing PO decision itself (Option A in that record) — Search
  membership is the *criterion*, never the *observation* — not a live option here, included only for completeness.
- **Option 4 — separate evidence entity**, decoupled from both Prospect and Opportunity, referencing whichever key
  is chosen in Option 1/2, following the `category_plausibility_determinations`/`qualifications` precedent of a
  dedicated table rather than a column on an existing domain table (consistent with B-3/W-8's "new standalone"
  pattern already used for the qualification-equivalence evaluator's own result, and with Option B's own framing
  of "a new field/signal," not necessarily a column).

### ED-TC-2 — Evidence source classification

Every existing candidate, checked against its actual definition (not its name), per the governing PO decision's
own survey (§3 of that record) plus this record's independent confirmation:

| Candidate | Classification | Basis |
|---|---|---|
| Category-plausibility determination (`@acos/core-research`) | **Unauthorized** (explicitly excluded by B-3/PO ruling) | F8 |
| `StoredResearchSignal` (`@acos/core-research`) | **Insufficient** — not excluded by name, but no governing record permits it as PCG-4 evaluator input, and B-3 restricts input to "search snapshot only" | PO decision §3 (Option C survey) |
| `Opportunity.offer_rationale` (free text from `suggestOffers()`) | **Insufficient** — not a structured field; using it requires inventing new parsing/derivation logic, out of scope for a preparation record | F5 |
| `Opportunity`/`Prospect`/`Company` existing columns | **Unavailable** — no column exists today (F5, F6) | F5, F6 |
| A new, not-yet-built observation/review stage (Option B itself) | **Authorized in principle, not yet available** — this is exactly what Option B's future ED/implementation scope must create | PO decision §9 |

No existing authorized source is available today; this table is unchanged from the governing PO decision and is
restated here only for this document's completeness, per the required structure.

### ED-TC-3 — Comparison semantics

- **Option 1 — Three-state enum stored directly** (`MATCH` / `NO_MATCH` / `NOT_YET_OBSERVED`), analogous to
  `category_plausibility_determinations.aggregate_result`'s `MATCH`/`MISMATCH`/`UNKNOWN` enum (F7), with the
  evaluator-facing boundary (`observedTargetCustomer: string | null`) translated from/to this stored enum at the
  repository layer.
- **Option 2 — Nullable observed-value string**, structurally identical to the evaluator's current input shape
  (`observedTargetCustomer: string | null`) persisted as-is; `NOT_YET_OBSERVED` is simply "row absent" or
  "column null," and `MATCH`/`NO_MATCH` are derived at evaluation time by `evaluateTargetCustomerMatch`'s existing
  string-equality comparison (F2) — i.e., no new stored enum at all, only a new source of the already-expected
  nullable string.
- Both options must preserve the PO decision's explicit constraint: `'UNKNOWN'`/`NOT_YET_OBSERVED` must never
  collapse into `NO_MATCH`, and `evaluateTargetCustomerMatch`'s existing fail-soft contract (F2) already enforces
  this at the evaluator boundary regardless of which storage option is chosen — this criterion's correctness does
  not depend on choosing Option 1 vs. 2 for this item specifically.

### ED-TC-4 — Evidence provenance

- **Option 1 — Quote/source-shaped evidence**, following `category_plausibility_determinations.segment_results`'s
  shape: `{sourceUrl, sourceLabel, quote, confidence, basis, classification}` (F7) — appropriate if the eventual
  observation mechanism is itself research/document-derived.
- **Option 2 — Evaluator-result-shaped provenance**, following `qualifications`' shape: `{evaluatorVersion,
  evaluatedAt, reason, evidenceSignalIds}` (F11) — appropriate if the eventual observation mechanism is a
  deterministic rule over already-persisted signals/fields rather than a fresh document-evidence lookup.
- **Option 3 — Minimal timestamp/source-reference only**, no confidence/classification fields at all, if the
  eventual populating mechanism is a simple, non-probabilistic determination (e.g. a human reviewer's binary
  judgment) for which confidence/classification would be meaningless.
- Which option fits depends entirely on ED-TC-6's timing answer and on what future mechanism populates the
  signal — neither is decided by any governing record today, so this item cannot be resolved ahead of that choice.

### ED-TC-5 — Determinism

- **Option 1 — Fully deterministic, pure function**, matching `evaluateQualificationEquivalence`'s own contract
  (F2, F3: "pure/deterministic/fail-soft... no I/O, no clock, no randomness") — the new signal's *evaluator-facing*
  read must be a pure lookup of an already-persisted value, exactly as `observedTargetCustomer` is consumed today.
  This is not actually an open question for the evaluator side: B-3/ED-10 already mandate it, and nothing in the
  PO decision reopens that mandate.
- **Open sub-question (not decided by any governing record):** whether the *population* mechanism (what writes the
  new signal in the first place — e.g. an LLM-based research determination, a deterministic rule, or a human
  review action) must itself be deterministic. B-3's determinism mandate governs the evaluator's inputs once
  persisted, not necessarily the mechanism that produces what gets persisted (category-plausibility's own
  populating mechanism is LLM-based and non-deterministic per-call, yet feeds a deterministically-read persisted
  column) — this sub-question is genuinely open and is listed in §6.

### ED-TC-6 — Timing

- **Option 1 — During Research**, mirroring category-plausibility's own timing (F9: populated in the same
  per-Search-Prospect research loop, `core-research/src/service.ts`). This is the one existing precedent in the
  repository for "a prospect-level observed-customer-type signal computed during pipeline execution."
  Category-plausibility's exclusion as a *source* does not exclude Research as a *stage* — the PO decision excludes
  reusing that specific computation, not the pipeline position it runs at.
- **Option 2 — During Opportunity creation/need-detection**, since `recommended_service`/`offer_estimated_value_paise`
  (the other two criteria's sources) are populated there (F5) — would make all three criteria's sources
  contemporaneous.
- **Option 3 — During/after gate evaluation (on-demand/lazy)**, computed only when `pcg4.ts` runs, rather than
  persisted ahead of time — inconsistent with every existing evidence precedent in this repository
  (`category_plausibility_determinations`, `qualifications`, `gate_evaluation_snapshots` are all pre-computed and
  persisted, never computed inline inside a gate query), and would require `pcg4.ts`'s SQL-plus-pure-evaluator
  split (ED-11) to be redesigned — flagged as the weakest-fit option on repository-consistency grounds, not ruled
  out by any governing record directly.
- **Option 4 — Asynchronous, independent of any existing stage** (e.g. a scheduled job or separate review UI) — no
  repository precedent exists for this shape of write path for a prospect/opportunity-level signal; would be wholly
  new infrastructure.
- No governing record names a required timing; this is left open (§6).

### ED-TC-7 — Unknown semantics

Already resolved by existing code, not a new design question: `evaluateTargetCustomerMatch`'s fail-soft contract
(F2) resolves `observedTargetCustomer === null` to `satisfied: 'UNKNOWN'`, and the evaluator's precedence rule (F3)
guarantees `'UNKNOWN'` never becomes an implicit pass — `match` can be `false` or `'UNKNOWN'`, never a clean `true`,
while this criterion is unresolved. Whatever Option B eventually builds only needs to preserve "absent/not-yet-written
signal → read as `null`" at the subject-construction call site in `pcg4.ts`; no change to `rules.ts`/`evaluator.ts`
is implied or required (confirmed by the PO decision §9 and by direct reading of the current code).

### ED-TC-8 — Historical/recomputation behavior

- **Option 1 — Append-only, supersede-then-insert**, mirroring both `category_plausibility_determinations` (F7:
  `superseded_at`, never deleted, "a same-Search re-run supersedes prior rows instead") and `research_signals`'
  established convention — preserves historical attribution: a later re-evaluation (new Search config, new
  Opportunity data, new evaluator version) produces a new row rather than mutating the old one.
- **Option 2 — Single current-value column**, mutated in place, mirroring `opportunities`' own existing columns
  (`recommended_service`, `offer_estimated_value_paise` — F5) which are overwritten, not versioned.
- **Option 3 — Versioned snapshot per gate-window**, mirroring `gate_evaluation_snapshots`' (F12) immutable,
  unique-per-`(gate, window, computation_path)` row — relevant only if the signal's *gate-level aggregate* (not the
  per-Opportunity observation) needs point-in-time snapshotting for later PCG-4 re-validation.
- These three precedents already coexist in this repository for different reasons (append-only for
  evidence/history, mutate-in-place for current domain state, immutable-snapshot for gate evidence) — no governing
  record says which applies to this new signal, and the right answer plausibly depends on ED-TC-1's owner choice
  and ED-TC-6's timing choice. Left open (§6).
- Evaluator-version change handling: `qualifications`' `evaluatorVersion` field (F11) is the one existing
  precedent for representing "the same input, re-evaluated under a newer evaluator," distinct from re-observing
  new evidence — whether `TARGET_CUSTOMER_MATCH`'s future signal needs an equivalent field is bound to ED-TC-4's
  provenance-shape choice.

### ED-TC-9 — Migration/schema impact (describe only; no migration created)

Per the PO decision's own §9 "minimum wiring" statement and this record's repository facts:

- **Minimum, regardless of which ED-TC-1/3/4/6/8 options are eventually chosen:** one new nullable, additive
  column or one new table (depending on ED-TC-1/ED-TC-4), following this repository's established additive-only
  migration convention (every migration since `0014` is purely additive — new nullable column or new table, never
  an altered/dropped/retyped existing column; see `0031`–`0035`'s own documented pattern, F12). No existing
  `opportunities`, `prospects`, `searches`, or `category_plausibility_determinations` column would be altered.
- **If Option B settles on Prospect-owned + dedicated table** (ED-TC-1 Option 1/4): a new table keyed by
  `prospect_id` (optionally `(search_id, prospect_id)`), structurally closest to `category_plausibility_determinations`
  (migration `0027`) — new migration numbered after `0035` per this repository's sequential-numbering convention.
- **If Option B settles on Opportunity-owned column** (ED-TC-1 Option 2): one new nullable column on
  `opportunities`, structurally closest to how `recommended_service`/`offer_estimated_value_paise` already exist
  there (F5) — smaller migration, but see the ED-TC-1 tension noted in §3 (prospect-shaped semantics vs.
  opportunity-shaped consumption site).
- **`pcg4.ts` wiring (not a schema change):** the one application-code change named by the PO decision itself —
  replace the hardcoded `observedTargetCustomer: null` (F1) with a read of the new field, added to the existing
  single joined query (ED-11) via one additional `LEFT JOIN`/`SELECT` column. No change to `evaluateTargetCustomerMatch`/
  `rules.ts` (F2) is implied.
- **No migration, schema file, or code change is created by this record.**

### ED-TC-10 — Validation plan

See §8 below (described, not implemented, per the required artifact structure).

---

## 5. Recommended option

Per this record's own scope, a recommendation is given **only** where repository facts plus the governing PO
decision unambiguously determine the answer — every other item is left blank in §6 for a future ED decision.

- **ED-TC-7 (Unknown semantics):** No new decision needed — already correctly implemented today (F2, F3, PO
  decision §9). Any future implementation must preserve, not redesign, this behavior.
- **ED-TC-5 (Determinism, evaluator-facing half only):** No new decision needed — the evaluator's pure/deterministic/
  fail-soft contract (B-3/ED-10) already governs this and is not reopened by the PO decision. The *population-mechanism*
  determinism sub-question remains genuinely open (see §6).
- **ED-TC-9 (Schema impact, shape-independent minimum):** The "one new additive column or table, plus a one-line
  `pcg4.ts` subject-construction change, no `rules.ts` change" minimum is unambiguous from the PO decision's own §9
  and from directly reading `pcg4.ts`/`rules.ts` — this much does not depend on resolving ED-TC-1/3/4/6/8 first,
  even though the *exact* table/column shape does.

Every other ED-TC item (1, 2 [already resolved by the PO decision itself, restated not re-decided], 3's enum-vs-string
storage choice, 4, 6, 8, and 9's exact shape) **requires a PO/engineering decision** this record does not make,
because more than one option is structurally viable in this repository and no governing record names a required
choice among them.

---

## 6. Unresolved engineering decisions (blank questionnaire)

For each item below, no selection has been made. Leave blank until a future, separate ED/PO decision record
completes it.

### ED-TC-1 — Signal owner

- [ ] Option 1 — Prospect-owned (table or column keyed by `prospect_id`, optionally `(search_id, prospect_id)`)
- [ ] Option 2 — Opportunity-owned (column/table keyed by `opportunity_id`)
- [ ] Option 4 — Separate evidence entity referencing whichever key is chosen above
- [ ] Other (specify): _______________________________________________

**Selected option:** _______________________________________________
**Date:** _______________________________________________
**Rationale (optional):** _______________________________________________

### ED-TC-3 — Comparison semantics (storage shape)

- [ ] Option 1 — Three-state enum stored directly (`MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED`)
- [ ] Option 2 — Nullable observed-value string, state derived at evaluation time
- [ ] Other (specify): _______________________________________________

**Selected option:** _______________________________________________
**Date:** _______________________________________________

### ED-TC-4 — Evidence provenance

- [ ] Option 1 — Quote/source-shaped evidence (category-plausibility-style)
- [ ] Option 2 — Evaluator-result-shaped provenance (qualifications-style: evaluatorVersion/evaluatedAt/reason/evidenceSignalIds)
- [ ] Option 3 — Minimal timestamp/source-reference only
- [ ] Other (specify): _______________________________________________

**Selected option:** _______________________________________________
**Date:** _______________________________________________

### ED-TC-5 — Determinism (population-mechanism half only)

- [ ] Population mechanism must itself be fully deterministic
- [ ] Population mechanism may be non-deterministic per-run (e.g. LLM-based), provided its persisted output is read
  deterministically thereafter (category-plausibility precedent)
- [ ] Other (specify): _______________________________________________

**Selected option:** _______________________________________________
**Date:** _______________________________________________

### ED-TC-6 — Timing

- [ ] Option 1 — During Research (mirrors category-plausibility's existing pipeline position)
- [ ] Option 2 — During Opportunity creation/need-detection
- [ ] Option 3 — During/after gate evaluation (lazy)
- [ ] Option 4 — Asynchronous, independent stage
- [ ] Other (specify): _______________________________________________

**Selected option:** _______________________________________________
**Date:** _______________________________________________

### ED-TC-8 — Historical/recomputation behavior

- [ ] Option 1 — Append-only, supersede-then-insert
- [ ] Option 2 — Single current-value column, mutated in place
- [ ] Option 3 — Versioned snapshot per gate-window
- [ ] Other / combination (specify): _______________________________________________

**Selected option:** _______________________________________________
**Date:** _______________________________________________

### ED-TC-9 — Exact schema shape (once ED-TC-1/3/4/8 are decided)

- [ ] New table, name: _______________________________________________
- [ ] New column(s) on existing table, name(s): _______________________________________________

**Selected option:** _______________________________________________
**Date:** _______________________________________________

---

## 7. Downstream implementation impact

- **`packages/core-launch-gates/src/pcg4.ts`:** the one named, unambiguous change (PO decision §9) — add the new
  field to the existing single joined query (one `LEFT JOIN`/`SELECT` column, per ED-11's "single joined query"
  constraint) and read it into `QualificationEquivalenceSubject.observedTargetCustomer` in place of the hardcoded
  `null`. No other line of this file changes.
- **`packages/core-qualification-equivalence/src/rules.ts`/`evaluator.ts`:** no change. The existing
  `evaluateTargetCustomerMatch`/precedence-rule contract already expects exactly this input shape (F2, F3).
- **New package or table location:** depends on ED-TC-1/ED-TC-4. If Prospect-owned with a dedicated table
  (closest structural fit to existing precedent), the natural home is a new table alongside
  `category_plausibility_determinations` conventions (owned by `@acos/core-research` or a new, narrowly-scoped
  package — not decided here) or, if Opportunity-owned, a new column within `@acos/core-opportunity`'s existing
  domain.
- **Whichever populating mechanism ED-TC-6 eventually selects** becomes a new, separate workstream requiring its
  own implementation-authorization record, parallel to how W-1 through W-16 were each separately authorized in
  `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md` — this record does not pre-authorize any such
  workstream.
- **PCG-4's independent-validation scope (`@acos/core-launch-gates-validation`) is unaffected** — PCG-4 remains
  outside the four-gate independent-validation requirement regardless of how/when this signal is eventually built
  (F13).
- **No other gate (PCG-1, PCG-2, PCG-3A, PCG-3B, PCG-5, PCG-6) is affected** by any option above — all are
  structurally independent of `TARGET_CUSTOMER_MATCH`.

---

## 8. Validation plan (described only — not implemented)

A future implementation's test suite would need, at minimum, deterministic fixture cases covering:

1. **Clear MATCH** — a Prospect with an observed-target-customer signal whose value normalises identically to the
   Search's `targetCustomer` → `TARGET_CUSTOMER_MATCH` criterion `satisfied: true`.
2. **Clear NO_MATCH** — an observed value that normalises differently → `satisfied: false`; confirm this correctly
   drives the evaluator's overall `match` to `false` (not `'UNKNOWN'`), per the existing precedence rule (F3).
3. **No evidence → NOT_YET_OBSERVED** — no signal row/column value exists for the Prospect/Opportunity →
   `observedTargetCustomer` reads as `null` → `satisfied: 'UNKNOWN'` (already covered by today's test suite for
   the `null` case; a future test must confirm the *new* populating path also correctly produces `null` when
   genuinely unobserved, not an empty string or a false positive).
4. **Conflicting evidence** — if the eventual mechanism can observe more than once (e.g. Research re-run), confirm
   whichever ED-TC-8 behavior is chosen (supersede vs. overwrite vs. snapshot) resolves to exactly one current
   value read by `pcg4.ts`, never an ambiguous multi-row read.
5. **Duplicate evidence** — the same observation written twice (e.g. idempotent retry) does not create two
   conflicting current rows/values.
6. **Changed Search `targetCustomer`** — confirm the stored observed-value comparison is always evaluated against
   the Search's *current* snapshot value at query time (as today's code already does, reading `s.target_customer`
   live in `pcg4.ts`'s query, F1), not a stale copy.
7. **Changed Opportunity evidence** — a later-arriving observation for the same Prospect/Opportunity updates (per
   ED-TC-8's chosen model) what `pcg4.ts` reads on a subsequent gate run, without requiring any evaluator change.
8. **Evaluator repeatability** — the same stored inputs, evaluated twice, produce an identical
   `QualificationEquivalenceResult` (determinism, already required by B-3/ED-10 and already tested for the other
   two criteria — extend the same pattern to this one once populated).
9. **PCG-4 behavior before signal availability** — unchanged regression: `pcg4.test.ts`'s existing seven cases
   proving numerator stays structurally `0` while `observedTargetCustomer` is `null` must continue to pass
   unmodified until the new field is wired in.
10. **PCG-4 behavior after signal availability** — a new fixture proving that once a genuine, authorized MATCH
    observation exists for a reviewed+useful Opportunity whose other two criteria also pass, PCG-4's numerator
    becomes non-zero for that window — the first fixture able to exercise a clean `true` overall match, which no
    existing test can produce today (confirmed: `pcg4.test.ts`'s current seven cases are documented as proving the
    numerator stays `0` precisely because this path does not yet exist).

These cases parallel the existing fixture style already used in `packages/core-qualification-equivalence/src/evaluator.test.ts`
and `packages/core-launch-gates/src/pcg4.test.ts`, and the real-Postgres scenario-fixture convention established in
`tests/integration/launch-gates-phase9.integration.test.ts`/`tests/fixtures/launch-gates-fixtures.ts`. None of these
tests are written by this record.

---

## 9. Authorization boundary

This is a **preparation document only**. It does not authorize, and nothing in it should be read as authorizing:
schema changes, migrations, Prisma model changes, new fields on any existing table, implementation of an
evaluator or populating mechanism, any change to PCG-4 gate semantics, wiring of gate evaluation, deployment,
release, or launch of any kind. No source file, test file, schema file, or migration was created or modified in
the course of producing this record — the only file created is this one. It does not reopen, modify, or
contradict `CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md`, its preparation
predecessor, `CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md`, `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_AUTHORIZATION_DECISION.md`,
or `CLIENT_FINDER_PDEF_4_IMPLEMENTATION_CONFORMANCE_RECORD.md`. Until the blank questionnaire in §6 is completed by
a future, explicit Product Owner/engineering decision, `evaluatePcg4` continues to run exactly as implemented today
(`observedTargetCustomer: null`, numerator structurally non-positive) — correct, intended, fail-soft behavior, not
a defect awaiting this document's resolution.
