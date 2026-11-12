# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Engineering Design Decision Questionnaire

**Record ID:** `CLIENT-FINDER-PDEF-4-PCG4-TARGET-CUSTOMER-MATCH-ENGINEERING-DESIGN-QUESTIONNAIRE-001`
**Date:** 2026-10-05
**Type:** Formal questionnaire. **This document decides nothing.** It lays out the six engineering decisions left
open by `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_PREPARATION.md`
(§6) as genuinely open choices, each with an unfilled `ENGINEERING SELECTION:` line. No code, schema, migration,
or test file is created or modified by this document. The six items below correspond one-to-one with the
preparation record's own blank questionnaire (its §6): ED-TC-1, ED-TC-3, ED-TC-4, ED-TC-6, ED-TC-8, ED-TC-9.
ED-TC-2 (evidence source classification), ED-TC-5 (evaluator-facing determinism), and ED-TC-7 (unknown semantics)
are not reopened here — the preparation record already closed them against existing, governing code (its §4, §5).

---

## 0. Scope and authority

- Governing, binding, not reopened: `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md`
  (Option B: a future Opportunity-level observed-target-customer signal, tri-state MATCH / NO_MATCH /
  NOT_YET_OBSERVED; PCG-4 remains `NOT_YET_EVALUABLE` until the signal exists).
- Primary source for the six items below: `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_PREPARATION.md`.
  Repository facts in this questionnaire were independently re-verified against the files cited, not copied
  from the preparation record's prose.
- This questionnaire adds: explicit side-by-side option tables, an analyst recommendation per item (clearly
  separated from fact and from decision), and a cross-decision dependency map. It narrows nothing the
  preparation record left open and selects nothing.

---

## 1. ED-TC-1 — Signal owner

### 1.1 Repository fact

- `packages/core-launch-gates/src/pcg4.ts:52-81` builds its one query by joining `searches s` → `prospects p`
  (`p.search_id = s.id`) → `opportunities o` (`o.prospect_id = p.id`), then at line 105 constructs
  `QualificationEquivalenceSubject` with `observedTargetCustomer: null` hardcoded — no table or column feeds it
  today.
- `packages/db/prisma/migrations/0017_opportunities/migration.sql` — `opportunities` has no
  `target_customer`/`observed_target_customer` column; it does carry `recommended_service` and
  `offer_estimated_value_paise`, the source columns for the gate's other two criteria.
- `packages/db/prisma/migrations/0015_discovery/migration.sql` — `prospects` has `id`, `user_id`, `search_id`,
  `company_id`, `status`, `created_at` only; no target-customer-like column.
- `packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql` — the repository's one
  existing table of this *shape* (an observed-signal-about-a-Prospect) is keyed by `("search_id", "prospect_id")`,
  not by `opportunity_id`.
- `Opportunity`/`Prospect` have no Prisma model — their schema lives entirely in raw migration SQL (confirmed:
  `packages/db/prisma/schema.prisma` has no `model Opportunity` or `model Prospect` block; grep against the file
  returns none).

### 1.2 Existing architectural precedent

- `category_plausibility_determinations` (0027) is Search+Prospect-owned, explicitly *not* Prospect-global,
  per its own migration comment: "a DEDICATED Search + Prospect determination — not a Prospect-global property."
- `opportunities.recommended_service` / `offer_estimated_value_paise` (0017) are Opportunity-owned, and are the
  source fields for the gate's other two criteria today.
- No existing table in this repository is owned jointly by an evidence concept and `opportunity_id` the way
  Option A below would require for a *dedicated* table (a new pattern, not a repeated one).

### 1.3 Engineering observation

The PO decision's own semantics bind the signal to "the specific Opportunity's **Prospect**, as actually
observed" — prospect-shaped language — while the consuming evaluator (`QualificationEquivalenceSubject`) is
constructed per-Opportunity, inside `pcg4.ts`, which already has `opportunity_id` in scope via its existing join.
Both the semantic framing (Prospect) and the consumption site (Opportunity, already joined to Prospect in one
query) are reachable without restructuring `pcg4.ts`'s join graph — the real fork is *which table the value is
read from*, not whether `pcg4.ts` can reach it.

A second consideration not raised by the prep doc's own framing: if a single Prospect can be discovered by more
than one Search (the schema does not forbid this — `prospects.search_id` is a single FK per prospect row, but
nothing stops two different Prospect rows for the same Company/Search pair, and `category_plausibility_determinations`
is explicitly keyed by `(search_id, prospect_id)` specifically because a different Search's `targetCustomer` must
get its own row), an Opportunity-owned or bare-Prospect-owned signal cannot represent "this Prospect was a MATCH
for Search X's target customer, but we have no opinion for Search Y's different target customer" — only a
Search+Prospect-keyed signal can.

### 1.4 Analyst recommendation (not a decision)

Recommend **Option C (Search/Prospect evidence relation)**, mirroring the `category_plausibility_determinations`
structural precedent. Rationale: it is the only option that can represent the signal as evaluated *against a
specific Search's `targetCustomer` criterion* (which is what `evaluateTargetCustomerMatch`/F2 actually compares
against) rather than against "whatever Search happens to own this Prospect today" — and it has a direct, working
precedent already in this codebase, lowering both design and review risk. This is this document's own analysis,
not a resolution of the PO decision's framing tension (§1.3) — Option A or B remain structurally viable and are
presented on equal footing below.

| | Option A — Opportunity-owned | Option B — Prospect-owned | Option C — Search/Prospect evidence relation |
|---|---|---|---|
| Identity | Belongs to `opportunities` row | Belongs to `prospects` row | A separate row relating one `search_id` + one `prospect_id` |
| Lifecycle | Created/updated whenever Opportunity's observation changes | Created/updated whenever Prospect is observed, independent of any one Opportunity | Created per observation event; superseded, not mutated |
| Reuse | None — one Opportunity, one value | A Prospect observed once could in principle be reused by future Opportunities built from it | None — explicitly scoped to one Search's targetCustomer |
| Relationship to Search | Indirect only (via Opportunity → Prospect → Search) | Indirect only (via Prospect → Search) | Direct — Search is part of the key |
| Relationship to Opportunity | Direct (owning row) | Indirect — Opportunity must look up by its Prospect | Indirect — Opportunity must look up by its Prospect, then its own Search |
| Multiple Searches, same Prospect, different results? | Not representable without a second Opportunity (and Opportunity is 1:1 with Prospect per 0017's `o.prospect_id`) | Not representable — one Prospect row, one value | Representable — distinct `(search_id, prospect_id)` rows, exactly as category-plausibility already does |
| Historical behavior | Natural fit for "current value" only (mirrors `recommended_service`) | Natural fit for "current value" only | Natural fit for append-only/supersede (mirrors 0027) |
| PCG-4 implications | Zero extra joins — `opportunity_id` already in scope at `pcg4.ts:64` | One extra join (`prospects` already joined at `pcg4.ts:70`) — no new join needed, only new columns selected | One extra join on `(search_id, prospect_id)` — both already in scope (`s.id`, `p.id` at lines 69-70) |

ENGINEERING SELECTION: __________________

---

## 2. ED-TC-3 — Storage shape

### 2.1 Repository fact

- `category_plausibility_determinations` (0027): dedicated table, `(search_id, prospect_id)` key (non-unique —
  historical rows retained), `aggregate_result TEXT CHECK (... IN ('MATCH','MISMATCH','UNKNOWN'))`, a partial
  unique-like index `WHERE superseded_at IS NULL` (not a hard uniqueness constraint — enforced by convention: at
  most one non-superseded row per `prospect_id`, per the migration's own comment, because `prospects.search_id`
  is immutable and unique per prospect via 0015's `UNIQUE(search_id, company_id)`).
- `qualifications` (0022): dedicated table, `UNIQUE(opportunity_id)` — one current row per Opportunity, replaced
  via upsert, not append-only.
- `gate_evaluation_snapshots` (0035): dedicated table, `UNIQUE("gate","window_start","window_end","computation_path")`
  — immutable, idempotent-by-constraint, never updated in place.
- `opportunities.recommended_service` / `offer_estimated_value_paise` (0017): plain additive nullable columns,
  mutated in place by whatever process computes them — no history retained.
- `evaluateTargetCustomerMatch` (`packages/core-qualification-equivalence/src/rules.ts`) only requires
  `observedTargetCustomer: string | null` at the evaluator boundary — it imposes no stored-shape requirement.

### 2.2 Existing architectural precedent

Three genuinely different precedents coexist for different reasons: additive mutable column (current domain
state), dedicated append-only evidence table (historical attribution), dedicated immutable snapshot table (gate
reproducibility). None is the repository's single "default" — the choice has always tracked what the value
*represents*, not a blanket convention.

### 2.3 Engineering observation

- **Additive field on Opportunity:** smallest migration, consistent with the other two criteria's storage, but
  cannot carry structured evidence/provenance without further columns, and (per §1.3 above) cannot represent
  "evaluated against a specific Search" if a Prospect could ever be associated with more than one Search —
  today's schema makes that unlikely per-Prospect but the determination is semantically bound to a Search's
  `targetCustomer`, not to the Opportunity row itself.
- **Dedicated target-customer determination table (Opportunity-keyed):** supports richer shape and future
  history, at the cost of a new table+migration for what might otherwise be one column.
- **Search–Prospect determination table:** directly reuses 0027's proven shape; uniqueness/history semantics
  (non-unique rows + `superseded_at IS NULL` partial index) are a known, working pattern in this exact
  repository, lowering migration and testability risk; query complexity is one extra join, already available at
  `pcg4.ts` (§1.3).
- **Evidence record/event model** (append-only observation events, no single "current" row materialized —
  current value always derived by `ORDER BY observed_at DESC LIMIT 1` or equivalent): most flexible for future
  "why did this change" queries, but no table in this repository is modeled this way today — every existing
  evidence table (`category_plausibility_determinations`, `research_signals`) uses supersede-then-insert with an
  explicit `superseded_at`, not a pure append-only event log with no current-row marker. This alternative would
  be new infrastructure, not an established local pattern.

Recomputation: only the "additive field" and "dedicated table, mutable" shapes support simple overwrite-on-recompute;
the append-only/supersede shapes require a write path that marks old rows superseded, mirroring 0027's own
`supersedePrevious(...)` call pattern (`packages/core-research/src/service.ts:141`).

Migration complexity, low to high: additive column < dedicated table (Opportunity-keyed, mutable) < dedicated
table (Search+Prospect-keyed, append-only, mirroring 0027) < evidence/event model (no local precedent to copy).

### 2.4 Analyst recommendation (not a decision)

Recommend a **dedicated Search–Prospect determination table, append-only/supersede-then-insert**, directly
modeled on 0027's proven shape (non-unique `(search_id, prospect_id)` key, `superseded_at`, a `WHERE superseded_at
IS NULL` partial index for the "current" read). This is this document's own analysis: it is the only option with
a working, tested precedent in this exact codebase for exactly this evidence shape, and it is consistent with
whichever owner Option C (§1.4's recommendation) would imply. It is not a decision and remains contingent on
§1's outcome — if ED-TC-1 instead selects Option A, the Opportunity-keyed dedicated-table or additive-column
alternatives below become the live candidates instead.

| | Additive field on Opportunity | Dedicated table, Opportunity-keyed | Dedicated table, Search+Prospect-keyed (0027-style) | Evidence/event model |
|---|---|---|---|---|
| Schema shape | 1-2 nullable columns on `opportunities` | New table, `opportunity_id` FK | New table, `(search_id, prospect_id)` FK pair | New table, append-only events, no mutable "current" column |
| Uniqueness | Trivial (1 row = 1 Opportunity already) | `UNIQUE(opportunity_id)` (qualifications-style) or none (history) | Non-unique + partial index on `superseded_at IS NULL` (0027-style) | None — every row is a permanent fact |
| Append-only vs mutable | Mutable (mirrors `recommended_service`) | Either, by choice | Append-only (0027 precedent) | Append-only by definition |
| Historical versions | No (unless a second history table is added) | Only if explicitly append-only | Yes, by construction | Yes, by construction |
| Query complexity at `pcg4.ts` | None — already-joined row | +1 join on `opportunity_id` (already available) | +1 join on `(search_id, prospect_id)` (already available) | +1 join plus an aggregation/ordering step to find "current" |
| Recomputation | Overwrite in place | Overwrite (mutable) or new row (append-only) | New row, old superseded | New row, no superseding — "current" is always derived |
| Migration complexity | Lowest | Medium | Medium (but copies a known-working migration) | Highest — no local template |
| Testability | Simplest fixtures | Moderate | Moderate, with a working test precedent in `core-research` | Most fixtures needed (ordering/derivation logic) |
| Consistency with repo architecture | Matches other two PCG-4 criteria's sources | New pattern for Opportunity-keyed evidence | Matches 0027 exactly | No existing match |

ENGINEERING SELECTION: __________________

---

## 3. ED-TC-4 — Provenance fields

### 3.1 Repository fact

- `category_plausibility_determinations.segment_results` (JSONB): each entry is `{segment, fit, rationale,
  evidence: [{quote, sourceUrl, sourceLabel}], confidence, basis, classification}` — quote/source-shaped,
  research/document-derived provenance.
- `qualifications.criteria` (JSONB) plus `qualifications.evaluator_version`, `evaluated_at`: `{criterion,
  satisfied, reason, evidenceSignalIds}` per entry — evaluator-result-shaped provenance, referencing already-persisted
  `StoredResearchSignal` ids rather than embedding quotes directly.
- `gate_evaluation_snapshots`: `computed_at`, `computation_path` (`'PRODUCTION'|'VALIDATION'`), `result` (JSONB) —
  gate-level, not per-Opportunity/per-Prospect, provenance.
- No governing record (PO decision, prep doc, or any cited requirement file) mandates a specific provenance
  field set for this new signal; the PO decision's §9 "minimum wiring" language only requires that
  `observedTargetCustomer` ends up populated as a string or null — it says nothing about what evidence must
  accompany it.

### 3.2 Existing architectural precedent

Two full, different provenance shapes already exist and are both actively used for other signals in this
repository (quote-shaped: 0027; evaluator-result-shaped: 0022). Neither is more "correct" in the abstract — each
fits the mechanism that produces it.

### 3.3 Engineering observation

Minimum required for correctness (i.e., for `evaluateTargetCustomerMatch`/`pcg4.ts` to function exactly as
already coded): **none beyond the value itself** — `rules.ts`'s contract (F2 in the prep doc) only reads
`observedTargetCustomer: string | null`. No provenance field is load-bearing for the evaluator or the gate.

Useful audit information, if a human or future auditor ever needs to answer "why does this Opportunity show
MATCH/NO_MATCH": an observed-at timestamp and *some* reference to what produced the value (a reviewer identity,
a source document, or an evaluator version — whichever applies depends entirely on ED-TC-6's timing choice, not
decided here). This is this document's own judgment, not a mandate found in any governing record — no existing
governance text in this repository requires audit fields for a signal of this kind, and none should be invented
here as if it were already required.

Unnecessary duplication risk: copying 0027's full `{quote, sourceUrl, sourceLabel, confidence, basis,
classification}` shape onto a signal that might end up produced by, e.g., a simple human-reviewer checkbox (no
document, no confidence score) would create columns that are permanently null for that mechanism — a real but
avoidable duplication cost that depends on ED-TC-6, same as §2's dependency.

### 3.4 Analyst recommendation (not a decision)

Recommend **Option 3 (minimal timestamp/source-reference only)** as the safe default *unless* ED-TC-6 selects a
document-derived mechanism (Research-stage), in which case Option 1 (quote/source-shaped, mirroring 0027) becomes
the better fit; if ED-TC-6 instead selects a deterministic-rule mechanism over already-persisted signals, Option
2 (evaluator-result-shaped, mirroring 0022) fits best. This recommendation is explicitly conditional and is this
document's own opinion, not a resolution — the prep doc itself (§4, ED-TC-4) already identifies this same
dependency and declines to resolve it, which this questionnaire does not override.

| | Option 1 — Quote/source-shaped (0027-style) | Option 2 — Evaluator-result-shaped (0022-style) | Option 3 — Minimal timestamp/source-reference only |
|---|---|---|---|
| Fields | `sourceUrl`, `sourceLabel`, `quote`, `confidence`, `basis`, `classification` | `evaluatorVersion`, `evaluatedAt`, `reason`, `evidenceSignalIds` | `observedAt`, one source-reference field (e.g. reviewer id or free text) |
| Fits mechanism | Fresh document/research-derived observation | Deterministic rule over already-persisted signals | Simple, non-probabilistic determination (e.g. human review) |
| Audit value | Highest — full evidentiary trail | Moderate — traceable to signal ids, not raw text | Lowest — only who/when, not why |
| Duplication risk if mechanism doesn't match | High (confidence/classification meaningless for a human checkbox) | Moderate (evidenceSignalIds meaningless if no signals involved) | Low — generic fields degrade gracefully |

ENGINEERING SELECTION: __________________

---

## 4. ED-TC-6 — Timing

### 4.1 Repository fact

- `packages/core-research/src/service.ts:106-152` (research pipeline, per-Prospect): resolves the owning Search,
  parses `targetCustomer` deterministically, calls the provider, saves `StoredResearchSignal`s, and — if
  `deps.categoryPlausibility` is configured — supersedes then saves a new `category_plausibility_determinations`
  row, all within the same synchronous-per-prospect research call. This is the one existing precedent for a
  prospect-level "observed customer type" signal computed during pipeline execution, at Research time.
- `opportunities.recommended_service` / `offer_estimated_value_paise` (0017) are populated at Opportunity
  creation/need-detection time (per the prep doc's F5, consistent with this repository's need-detection flow —
  not independently re-traced here beyond confirming the columns' existence and the prep doc's citation).
- `gate_evaluation_snapshots` (0035), `qualifications` (0022), and `category_plausibility_determinations` (0027)
  are all **pre-computed and persisted** ahead of any read; none is computed inline inside a gate query.
  `pcg4.ts` itself is a single `SELECT` plus pure-function evaluation per row (`pcg4.ts:57-113`) — it has no
  existing pattern for computing a new fact inline during gate evaluation.

### 4.2 Existing architectural precedent

Every comparable evidence table in this repository is populated at a well-defined pipeline stage (Research, for
`category_plausibility_determinations`/`research_signals`; Need-detection, for `opportunities`' own columns) and
read later, never computed lazily inside a gate or validation query.

### 4.3 Engineering observation

- **Discovery-time:** no comparable signal is populated this early today (Prospect creation only establishes
  `search_id`/`company_id`/`status`); the target-customer *criterion* already exists at this point via the
  owning Search, but nothing is "observed" about the Prospect yet — would require inventing a new, currently
  nonexistent observation mechanism at the earliest possible point, before any research/review exists to ground
  it. Lowest evidence availability.
- **Opportunity-creation-time:** evidence availability matches the other two criteria's sources (same stage);
  deterministic only if whatever observes target-customer fit is itself deterministic at that point (open
  sub-question per ED-TC-5, not reopened here); latency identical to today's Opportunity-creation latency, no
  new workers.
- **Research-time:** mirrors the one existing working precedent (`core-research/src/service.ts`) exactly; the
  provider/model has document evidence in hand at this point (same evidence `category_plausibility_determinations`
  already uses, though explicitly not that computation itself, per B-3); repeatability tracks the provider call's
  own determinism, same as category-plausibility's already-accepted LLM-based non-determinism-at-the-call,
  deterministic-at-the-read pattern.
- **Asynchronous worker:** no existing worker package in this repository (checked `apps/worker/src/searchWorker/`)
  currently performs any per-Prospect *observation* work outside the Research pipeline call chain itself; a new
  async worker would be new infrastructure, not a reuse of an existing one — highest latency and staleness risk
  (signal could lag significantly behind Opportunity review), and no precedent for how it would be triggered.
- **Gate-evaluation-time:** directly inconsistent with `pcg4.ts`'s existing single-query, pure-evaluator split
  (ED-11 in the prep doc) and with every existing evidence table's pre-computed nature; would also break
  `gate_evaluation_snapshots`' reproducibility guarantee if the inline computation were non-deterministic, since
  a snapshot's `result` would then depend on exactly when it was taken rather than on persisted evidence. Weakest
  fit on repository-consistency grounds.
- **Hybrid (e.g. Research-time initial observation, re-confirmed at Opportunity-review time):** not evidenced by
  any existing pattern in this repository; would combine the append-only concerns of §2/§4 without a working
  local template for the "re-confirm" half.

Stale-data / PCG-4 window behavior: whichever timing is chosen, `pcg4.ts` already reads the Search's *current*
`target_customer` live at query time (`s.target_customer`, `pcg4.ts:61`) rather than a stored copy — so staleness
risk is specifically about the *observation* going stale relative to a Search config that changed after the
observation was made, not about the Search side. This is a real consideration for ED-TC-8 (§5), not resolved by
timing alone.

### 4.4 Analyst recommendation (not a decision)

Recommend **Research-time**, because it is the only option with a currently working, tested precedent in this
exact repository (`core-research/src/service.ts`'s existing per-Prospect pipeline call, already proven to
coexist with the explicitly-excluded category-plausibility computation in the same function without conflict),
and it has the best evidence availability (document evidence is in hand) at acceptable latency (no new
pipeline stage). This is this document's own opinion; the prep doc itself declines to pick among these four-plus
options and this questionnaire does not override that.

| | Discovery-time | Opportunity-creation-time | Research-time | Async worker | Gate-evaluation-time | Hybrid |
|---|---|---|---|---|---|---|
| Evidence available | Lowest — nothing observed yet | Matches other 2 criteria | Document evidence in hand (0027 precedent) | Depends on trigger design | Whatever is already persisted, nothing new | Varies |
| Determinism | N/A (no mechanism exists) | Open (ED-TC-5 sub-question) | Open (ED-TC-5 sub-question; category-plausibility precedent is LLM-based, non-deterministic per-call) | Open | N/A (would read persisted value only) | Open |
| Latency | New, pre-review infra | None — reuses existing stage | None — reuses existing stage | New infra + delay | None added, but breaks ED-11 | Highest — two stages |
| Repeatability | N/A | Same as other 2 criteria | Same pattern as category-plausibility | Depends on design | Breaks `gate_evaluation_snapshots` reproducibility if non-deterministic | Complex |
| Staleness risk | High (pre-review) | Low | Moderate (Search could change after) | Highest | None (always current compute) but inconsistent | Moderate |
| Repo worker precedent | None | None (need-detection flow only) | Yes — `core-research/src/service.ts` | None in `apps/worker/src/searchWorker` | None — inconsistent with ED-11 | None |

ENGINEERING SELECTION: __________________

---

## 5. ED-TC-8 — Recomputation / history behavior

### 5.1 Repository fact

- `category_plausibility_determinations` (0027): Option B shape — append-only, `superseded_at`, same-Search
  re-run supersedes-then-inserts; a *different* Search's row for the same Prospect is never touched (its own
  migration comment, confirmed above in §1.1/§2.1).
- `opportunities.recommended_service`/`offer_estimated_value_paise` (0017): Option A shape — mutated in place,
  no history.
- `gate_evaluation_snapshots` (0035): Option C shape — immutable, unique per `(gate, window_start, window_end,
  computation_path)`; a re-run of an already-computed window does not insert a duplicate (unique constraint),
  it is idempotent-by-constraint rather than versioned-by-append.
- `qualifications` (0022): a fourth, distinct pattern not listed among Options A-D above — "one current row,
  replaced via upsert" (`UNIQUE(opportunity_id)`), which is closest to Option A (mutable current value) but at
  the table level rather than the column level; worth noting as a precedent for "dedicated table, still
  mutable-current-only" if ED-TC-3 selects a dedicated table but ED-TC-8 selects Option A's semantics.

### 5.2 Existing architectural precedent

All three (plus `qualifications`' hybrid) precedents are live, working code in this repository today, each
chosen for a different reason specific to what it represents — there is no single default to fall back to.

### 5.3 Engineering observation, per triggering event

- **Search `targetCustomer` changes:** `pcg4.ts` already reads the Search's *current* value live at query time
  (confirmed §4.3) — this is independent of ED-TC-8 entirely. What ED-TC-8 governs is whether a *stored
  observation* keyed to an older `targetCustomer` value remains correctly attributed (Option B/C, via the
  `target_customer` value embedded in the row itself, as 0027 does) or is silently compared against a changed
  live value with no way to tell the comparison basis changed (Option A/D).
- **Prospect evidence changes** (e.g. a Research re-run supplies new signals): under Option A, the single
  current value is simply overwritten — no record of the prior observation. Under Option B, a new row
  supersedes the old one, preserving it. Under Option C, a new immutable snapshot is created, tied to the
  evidence/evaluator version that produced it. Under Option D, nothing is stored — the next read recomputes from
  current evidence, so "what did we think last time" is unanswerable by construction.
- **Opportunity changes:** since the PO decision binds the signal to the Prospect (not the Opportunity row
  itself, per §1.3), an Opportunity-level change (e.g. `recommended_service` edited) has no direct bearing on
  this signal under any of Options A-D, provided ED-TC-1 does not select Opportunity-ownership; if it does,
  Opportunity-level mutation and this signal's mutation would need to be reconciled, which none of A-D
  individually addresses — a second-order dependency on ED-TC-1 worth naming, not resolving, here.
- **Evaluator logic changes** (`evaluateTargetCustomerMatch`'s normalization/comparison rule changes in a future
  version): Option C (tied to evaluator version) is the only one that can distinguish "this was MATCH under
  evaluator v1" from "this would be MATCH under evaluator v2," mirroring `qualifications.evaluator_version`'s
  existing precedent (0022). Options A/B/D have no evaluator-version concept unless one is separately added
  (which would itself be an ED-TC-4 provenance-field choice, not an ED-TC-8 choice).
- **Evidence deleted/unavailable:** under Option A, the current value simply remains (orphaned, with no
  evidence trail) until next overwrite. Under Option B/C, historical rows are retained regardless (foreign-key
  `ON DELETE CASCADE` patterns in this repository, e.g. 0027's own FKs, mean evidence deletion would cascade to
  this signal's rows only if explicitly modeled that way — a migration-shape question for ED-TC-9, not decided
  here). Under Option D, if the source evidence is gone, recomputation can no longer reproduce the original
  value at all — the signal effectively reverts to unobservable.
- **PCG-4 recomputed for a historical window:** `gate_evaluation_snapshots` (0035) already exists specifically
  to make a *gate's* result reproducible for a closed window regardless of what the underlying tables say today.
  This is the correct and sufficient mechanism for "what did PCG-4 say about window W" — it does not require
  this new signal itself to be snapshotted per-window; the signal only needs to be correct *at the time PCG-4
  last computed window W*, which `gate_evaluation_snapshots.result` already freezes. Conflating the two would
  needlessly duplicate what 0035 already solves. This observation holds regardless of which of Options A-D is
  chosen for the signal itself — it is a statement about `gate_evaluation_snapshots`' existing scope, not a
  recommendation for the signal's own storage.

The current-state vs. historical-gate-evidence distinction is therefore preserved structurally today by 0035
already existing as the gate-level reproducibility mechanism — ED-TC-8's choice is only about the *signal's own*
history, not about re-creating what 0035 already provides.

### 5.4 Analyst recommendation (not a decision)

Recommend **Option B (append-only, supersede-then-insert)**, for the same reason given in §2.4: it is the only
option (besides C) that preserves per-evaluator-version and per-evidence-change history, it has a proven,
working local precedent (0027) that already handles exactly the "same-Search re-run supersedes; different-Search
row untouched" rule this signal would also need (per §1.3's multi-Search consideration), and it composes cleanly
with a §1.4/§2.4 Search+Prospect-keyed table. Option C would only be clearly preferable if a future decision
determines the *signal itself* (not just the gate) needs per-evaluator-version point-in-time snapshots
independent of 0035 — not evidenced as a requirement today. This is this document's own analysis, offered
alongside, not in place of, the full option set below.

| | Option A — Mutable current value | Option B — Append-only, supersede-then-insert | Option C — Immutable snapshots tied to evidence/evaluator version | Option D — Recompute on demand |
|---|---|---|---|---|
| Local precedent | `opportunities` columns (0017) | `category_plausibility_determinations` (0027) | None exact; closest is `gate_evaluation_snapshots` (0035), which is gate-level not signal-level | None |
| History preserved | No | Yes | Yes, explicitly versioned | No (not stored at all) |
| Search targetCustomer changes | Silent — comparison basis untracked | Tracked — old row retains its `target_customer` value | Tracked — tied to the snapshot's own recorded inputs | N/A — always recomputed against current |
| Evidence changes | Overwritten, no trail | New row, old retained | New immutable snapshot | Recomputation reflects new evidence immediately; old answer unrecoverable |
| Evaluator logic changes | Indistinguishable from an evidence change | Indistinguishable unless a version field is separately added (ED-TC-4) | Distinguishable by construction | N/A |
| Evidence deleted | Current value orphaned silently | Historical rows retained independent of live evidence state | Snapshot retained independent of live evidence state | Signal becomes unrecoverable |
| PCG-4 historical window | Relies entirely on `gate_evaluation_snapshots` (0035) already freezing the gate result | Same | Same, plus the signal's own point-in-time value is also independently recoverable | Relies entirely on 0035; the signal's own historical value is unrecoverable once evidence changes |
| Migration/testability cost | Lowest | Moderate (mirrors a working test suite already) | Highest — new versioning concept | Lowest schema cost, highest logic cost (recomputation must be re-run and re-verified every read) |

ENGINEERING SELECTION: __________________

---

## 6. ED-TC-9 — Exact migration shape

### 6.1 Repository fact

- Every migration since `0014` in `packages/db/prisma/migrations/` is purely additive — a new nullable column or
  a new table, never an altered, dropped, or retyped existing column (confirmed by reading `0027`, `0028`,
  `0031`-`0035`'s own file headers, each stating "Additive only").
- `Opportunity`/`Prospect` have no Prisma model (confirmed §1.1) — any migration here would be raw SQL only, with
  no corresponding `schema.prisma` edit required or possible for those two tables; a new *dedicated table* would
  still need no `schema.prisma` entry for consistency with how `category_plausibility_determinations`,
  `qualifications`, and `gate_evaluation_snapshots` themselves were added (none of their `CREATE TABLE`
  statements appear in `schema.prisma` either — confirmed by `grep` returning no matches for those three table
  names in that file).
- Current migration sequence ends at `0035_gate_evaluation_snapshots`; a new migration would be numbered `0036`
  or later per this repository's strictly sequential, non-reusable numbering convention.

### 6.2 Existing architectural precedent

Additive-only, sequentially-numbered, raw-SQL migrations for any table touching `Opportunity`/`Prospect`
(0015, 0017, 0022, 0027, 0028), with foreign keys to `searches`/`prospects`/`opportunities` and `ON DELETE
CASCADE ON UPDATE CASCADE`, consistently used across all of them (confirmed in 0027's FK clauses above).

### 6.3 Engineering observation

The concrete shape of the migration is **fully contingent** on ED-TC-1 (table vs. column, and which parent
table), ED-TC-3 (exact columns/JSONB shape, uniqueness index type), ED-TC-4 (how many provenance columns), and
ED-TC-8 (whether a uniqueness constraint should be a hard `UNIQUE` (Option A/qualifications-style) or a partial
index on a nullable `superseded_at`/version column (Option B/0027-style) or something else again (Option C)).
Nothing below is finalized; each bullet names what *cannot* be fixed until the referenced decision is made.

- **Table vs. column** — cannot be finalized until ED-TC-1 is selected (Option A → column(s) on `opportunities`;
  Option B → column(s) on `prospects`; Option C → new table referencing both `search_id` and `prospect_id`).
- **Column list / JSONB shape** — cannot be finalized until ED-TC-3 (storage shape) and ED-TC-4 (provenance
  fields) are both selected; the two are coupled (e.g. a quote-shaped provenance choice implies a JSONB evidence
  array column, mirroring 0027's `segment_results`; a minimal choice implies one or two scalar columns).
- **Uniqueness / index type** — cannot be finalized until ED-TC-8 (history behavior) is selected: a hard
  `UNIQUE` constraint (mutable-current, Option A, or qualifications-style upsert) vs. a non-unique key plus a
  partial index on "current" (append-only, Option B, 0027-style) vs. a `UNIQUE` on `(key, evidence_version)`
  (immutable snapshot, Option C) are mutually exclusive index designs.
- **Foreign keys** — `search_id`/`prospect_id`/`opportunity_id` FK(s) depend directly on ED-TC-1's chosen owner;
  `ON DELETE CASCADE ON UPDATE CASCADE` is the established convention (0027) and would carry over regardless of
  which key(s) are chosen, but which column(s) get an FK at all is not fixed yet.
- **Enum/type choice** — if ED-TC-3 selects the three-state-enum-stored-directly option (mirroring
  `aggregate_result`'s `CHECK (... IN (...))` pattern), the exact `CHECK` constraint values follow directly from
  the PO decision's own tri-state naming (`MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED`) and need no further decision
  beyond ED-TC-3 itself; if ED-TC-3 instead selects the nullable-string option, no enum/type column exists at
  all. Either way this is downstream of ED-TC-3, not independently open.
- **Nullability** — every candidate column would be nullable at creation (additive-only convention, §6.1);
  no backfill is implied or required, because `NOT_YET_OBSERVED`/absence is already the correct, intended state
  for every existing Opportunity (prep doc §9's closing statement, restated and not reopened here) — this one
  point does not depend on ED-TC-1/3/4/8 and can be stated now.
- **Compatibility with existing data** — unaffected either way; no existing row of any table is altered, per
  the additive-only convention (§6.1). This also does not depend on ED-TC-1/3/4/8.
- **Rollback** — a purely additive migration (new nullable column(s) or new table) is trivially reversible by a
  corresponding `DROP COLUMN`/`DROP TABLE` migration, regardless of which ED-TC-1/3/4/8 options are chosen —
  rollback complexity does not vary meaningfully across the alternatives surveyed here, unlike every other
  bullet above.
- **`pcg4.ts` wiring** — the one application-code change named by the governing PO decision itself: replace the
  hardcoded `observedTargetCustomer: null` (`pcg4.ts:105`) with a read of the new field, added to the existing
  single joined query via one additional `LEFT JOIN`/`SELECT` column (consistent with ED-11's "single joined
  query" constraint already governing this file). This is not a schema migration and is unaffected by which
  ED-TC-1/3/4/8 options are chosen, beyond determining which column name(s) get selected.

**No migration file, schema file, or `schema.prisma` edit is created by this questionnaire.**

### 6.4 Analyst recommendation (not a decision)

No single migration can be recommended independent of §1/§2/§3/§5's outcomes — recommending one now would
amount to pre-selecting those four decisions through the back door. If this questionnaire's own §1.4/§2.4/§3.4/§5.4
recommendations (Option C signal owner; dedicated Search–Prospect table; minimal-or-conditional provenance;
append-only history) were all accepted, the resulting migration would be: one new table numbered `0036`,
columns `id`, `search_id` (FK → `searches`), `prospect_id` (FK → `prospects`), an `observed_target_customer`
value column (shape per §2/§3's actual selection), `observed_at`, `superseded_at`, `created_at`, a non-unique
index on `(search_id, prospect_id)`, and a partial index on `prospect_id WHERE superseded_at IS NULL` — i.e.,
structurally identical to 0027 with a different value column. This is offered only as an illustration of what
accepting every recommendation above would imply; it is not itself a proposal to be enacted and remains fully
contingent on the five ENGINEERING SELECTION lines above actually being filled in first.

ENGINEERING SELECTION: __________________

---

## 7. Cross-decision dependency map

```
ED-TC-1 (signal owner)
   │
   ├──> ED-TC-3 (storage shape)       [owner determines which table/column the shape applies to]
   │        │
   │        ├──> ED-TC-9 (migration shape)   [needs concrete table/column decision]
   │        │
   │        └──<──> ED-TC-8 (history behavior)
   │                 [storage shape and history behavior jointly determine uniqueness/index design —
   │                  a dedicated append-only table (ED-TC-3) pairs naturally with Option B/C history (ED-TC-8);
   │                  a mutable column (ED-TC-3) pairs naturally with Option A history (ED-TC-8)]
   │
   └──> ED-TC-9 (migration shape)     [owner determines FK columns / parent table directly]

ED-TC-4 (provenance fields) <──> ED-TC-6 (timing)
   [which provenance fields make sense depends on what mechanism/stage populates the signal,
    and vice versa — a document-derived mechanism (Research-time) implies quote-shaped provenance;
    a deterministic-rule mechanism implies evaluator-result-shaped provenance]

ED-TC-4 (provenance fields) <──> ED-TC-8 (history behavior)
   [an evaluator-version provenance field is what makes "evaluator logic changed" distinguishable
    under ED-TC-8's Option C/B; ED-TC-8's chosen history model determines whether a provenance
    field is even meaningful to add]

ED-TC-6 (timing) <──> ED-TC-8 (history behavior)
   [an asynchronous/lazy timing choice has different natural re-write semantics than a
    single-pipeline-stage timing choice; a Research-time mechanism that can re-run naturally
    produces the "same-Search re-run supersedes" shape ED-TC-8's Option B already models]

ED-TC-1 + ED-TC-3 + ED-TC-4 + ED-TC-6 + ED-TC-8 ──> ED-TC-9 (migration shape)
   [ED-TC-9 is the final, wholly downstream item — every bullet in §6.3 names exactly one of the
    other five decisions as its blocking dependency; no part of ED-TC-9 can be finalized in isolation
    except the nullability/backfill/rollback/compatibility points already shown to be decision-independent]
```

No dependency is asserted beyond what §1-§6's own analysis showed directly (e.g. ED-TC-6 and ED-TC-1 are **not**
shown as directly coupled — timing and ownership are, on the evidence reviewed, independent choices; the prep
doc's own worked example in §1.3 shows an owner choice is reachable from `pcg4.ts`'s existing joins regardless of
which stage populates it).

---

## 8. Acceptance criteria checklist

- [x] All six decisions (ED-TC-1, ED-TC-3, ED-TC-4, ED-TC-6, ED-TC-8, ED-TC-9) are presented with explicit,
  side-by-side options (§1-§6).
- [x] Every option set includes a tradeoff table or equivalent explicit tradeoff discussion (§1.4, §2.4, §3.4,
  §4.4, §5.4; §6 explains why a tradeoff table is not meaningful until the five upstream decisions are made,
  rather than omitting the analysis).
- [x] Repository-verified fact (§_.1 of each section, independently re-confirmed against source files during
  this questionnaire's preparation — `pcg4.ts`, `0015`, `0017`, `0022`, `0027`, `0035`, `core-research/src/service.ts`,
  `schema.prisma`), architectural precedent (§_.2), engineering observation (§_.3), and analyst recommendation
  (§_.4) are kept in clearly separated subsections throughout, distinct from the unfilled "ENGINEERING SELECTION"
  decision line.
- [x] No option is pre-selected: every section's decision line reads literally `ENGINEERING SELECTION:
  __________________` with nothing filled in.
- [x] Downstream invalidation / dependency is documented explicitly (§7's dependency map, plus inline dependency
  notes within §2-§6 themselves).
- [x] Implementation implications are documented (§6.3's per-field migration contingencies; §6.4's fully-contingent
  illustration, explicitly marked as non-binding).
- [x] No code, schema, Prisma model, or migration file was created or modified in the course of producing this
  questionnaire — the only file created is this one.

---

## 9. Authorization boundary

This is a **questionnaire only**. It does not authorize, select, or imply a selection for any of the six items
above; it does not modify `packages/core-launch-gates/src/pcg4.ts`, any Prisma/schema file, or create any
migration; it does not change PCG-4's tri-state semantics, gate behavior, or wiring; it does not use category
plausibility as the target-customer signal; it does not make `NOT_YET_OBSERVED`/`'UNKNOWN'` an implicit pass. It
does not reopen, amend, or contradict `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md`
or `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_PREPARATION.md`, both
of which remain unmodified by this document. Until every `ENGINEERING SELECTION:` line above is filled in by a
future, separate, explicit decision record, `evaluatePcg4` continues to run exactly as implemented today.
