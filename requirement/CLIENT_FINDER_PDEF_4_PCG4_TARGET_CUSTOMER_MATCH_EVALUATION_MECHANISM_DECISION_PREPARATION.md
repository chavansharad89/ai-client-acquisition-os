# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Evaluation Mechanism Decision Preparation

**Record ID:** `PDEF4-PCG4-TCMATCH-MECH-PREP-001`
**Date:** 2026-10-05
**STATUS: PREPARATION ONLY — NOT A DECISION, NOT A QUESTIONNAIRE WITH SELECTIONS**

This record exists to prepare, not answer, the one question `PDEF4-PCG4-ED-DEC-001` explicitly left open
(its §13: *"the exact mechanism that produces the MATCH/NO_MATCH judgment itself... is the single largest
open dependency"*). It assumes and does not reopen anything already decided in that record or its
antecedents. It contains no engineering selection — every one of the twelve dimensions below ends in a
blank `ENGINEERING SELECTION:` line.

---

## 1. Governing sources

Downstream of, and must not contradict:

- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md` (`PDEF4-PCG4-ED-DEC-001`) — decides signal owner (dedicated `(search_id, prospect_id)` table), timing (research-time, inside `core-research/src/service.ts`'s per-prospect loop), storage shape (tri-state `MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED` enum), provenance shape (quote/source-shaped evidence), history (append-only supersede). Its §13 explicitly defers the evaluation-mechanism question to a future record — this one.
- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_PREPARATION.md` — antecedent to the ED decision; read for context, not reopened.
- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_QUESTIONNAIRE.md` — antecedent; read for context, not reopened.
- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` (`PDEF4-PCG4-PO-DEC-001`) — decides the product-semantic definition of `TARGET_CUSTOMER_MATCH`, rules out Option A (Search-membership) and Option C (no existing signal qualifies), selects Option B (authorize new, not-yet-designed scope). This is the binding source for "which evidence is already authorized vs. excluded" (§3, below).
- `requirement/CLIENT_FINDER_PDEF_4_ENGINEERING_BLOCKER_DECISION.md` §8/§10 (B-3, B-7) — referenced by both documents above; not re-read in full here beyond what they already quote, per the task's efficiency instruction.

All four files above were read-only in this session; none was modified (confirmed in §7).

---

## 2. Baseline Git SHA / status

- `git rev-parse HEAD` → `af9ede93830f5e3e611195dc2451a470364def74`.
- `git status --short` (before this file was created): 75 entries, all pre-existing, none touched by this task.
- Staged files: 0.

---

## 3. Repository facts

### 3.1 — Exact source/semantics of `Search.targetCustomer`

- No Prisma model exists for `Search` (`grep -n "^model " packages/db/prisma/schema.prisma` lists only `Order`, `Payment`, `WebhookEvent`, `MetaEvent`, `IdempotencyReconciliation`, `ProductionIndexMigration` — the schema for `searches` lives entirely in raw migration SQL, same as `Opportunity`/`Prospect`).
- `packages/core-service-profile/src/types.ts:12` and `validation.ts:104-139`: `targetCustomer: string`, required, non-empty, validated once at intake (`requireNonEmptyString(input.targetCustomer, 'targetCustomer', ...)`).
- `packages/core-search/src/service.ts:84`: `targetCustomer: profile.targetCustomer` — copied verbatim from the validated ServiceProfile input into the Search's `parameters` at Search creation. Confirmed (per `PDEF4-PCG4-PO-DEC-001` §3, not re-derived here): `packages/core-search/src/pgRepository.ts`'s `COLUMNS` includes `target_customer`; `createSearch` writes it once; read paths return it as `targetCustomer: row.target_customer`. It is **never written to or compared against from the Search side again** — it is a user-stated intake criterion, immutable after creation, not an observation.
- `packages/core-launch-gates/src/pcg4.ts` reads it as raw SQL `s.target_customer AS search_target_customer`, feeding `SearchSnapshot.targetCustomer` in `@acos/core-qualification-equivalence`.
- `packages/core-research/src/service.ts:113,147`: `search.parameters.targetCustomer` is read exactly once more, downstream, by `parseTargetSegments()` (category plausibility) — a *consumer* of the same immutable string, not a second writer.

### 3.2 — Existing research/evidence structures that could bear on target-customer-match

- `packages/core-research/src/categoryPlausibility.ts` + `packages/core-research/src/schema.ts` (`categorySegmentSchema`, `CategoryFit = 'MATCH'|'MISMATCH'|'UNKNOWN'`): per-segment model verdict with mandatory `rationale`, `evidence: [{quote, sourceUrl, sourceLabel}]` when `MATCH`/`MISMATCH`, and `confidence` (int 0–100, constrained: 0 iff `UNKNOWN`, 1–100 otherwise, **no INFERRED-style cap unlike the ResearchSignal `Observation.confidence` schema** — see §3.5). Aggregated by `aggregateCategoryFit()` (ANY-match/OR over segments). Persisted in `category_plausibility_determinations` (migration `0027`), keyed `(search_id, prospect_id)`, append-only supersede — structurally the nearest architectural sibling to the table `PDEF4-PCG4-ED-DEC-001` describes.
- **Explicitly excluded as a semantic substitute** for `TARGET_CUSTOMER_MATCH` by the governing B-3 record, quoted in both the PO decision (§3) and the ED decision (§1, "cited as architectural precedent... never as an automatically-authorizing semantic source"). Category plausibility answers *"does this Prospect's business plausibly belong to one of the Search's stated customer-type segments, as parsed and judged independently of any specific Opportunity"* — a different question from `evaluateTargetCustomerMatch`'s *"was this specific Opportunity's Prospect, as actually observed, found to be the kind of customer the Search's criterion names."*
- `packages/core-research/src/schema.ts` `Observation`/`ResearchSignal` (`classification: OBSERVED|INFERRED|UNKNOWN`, `confidence`, `evidence[]`) — the FIELD_KIND/ResearchSignal structure `categoryPlausibility.ts` is deliberately kept *outside* of (per its own file header: "structurally outside FIELD_KIND/ResearchSignal (D7)"). The PO decision (§3) found **no affirmative permission anywhere in a governing record** to use `StoredResearchSignal` as `TARGET_CUSTOMER_MATCH` evaluator input, and states the 2026-10-05 PO ruling directs against it absent such permission.
- `Opportunity.offer_rationale` (migration `0017_opportunities`) — free text generated by `suggestOffers()`; not a structured target-customer field. PO decision §3: "using it would require inventing new parsing/derivation logic, which this decision is barred from doing."
- No other structured research output type was found that names or scopes a target-customer observation; the `0017_opportunities` schema has no `target_customer`/`observed_target_customer` column (confirmed directly, PO decision §3).

### 3.3 — Authorized vs. excluded evidence sources (binding, from PDEF-4 PO/ED records)

| Candidate | Status | Source |
|---|---|---|
| Search-membership / Discovery candidate filter (Option A) | **Excluded** — a query-side criterion, not an observation | PO-DEC-001 §3 |
| `category_plausibility_determinations` | **Excluded** as a substitute (precedent only) | B-3 (quoted in both PO-DEC-001 and ED-DEC-001) |
| `StoredResearchSignal` / `research_signals` | **Not affirmatively permitted** — no governing record authorizes it | PO-DEC-001 §3 |
| `Opportunity.offer_rationale` (free text) | **Excluded** — not structured, would require new derivation logic | PO-DEC-001 §3 |
| A new, not-yet-designed Opportunity/Search-Prospect-level observed-target-customer signal | **Authorized as future scope only** (Option B) — product semantics fixed by PO-DEC-001 §7, storage/timing/provenance/history fixed by ED-DEC-001 §3-§8 | PO-DEC-001 §5; ED-DEC-001 |
| Document evidence available at Research-time (the same source documents category-plausibility already has in hand) | **Not excluded, not affirmatively named either** — ED-DEC-001 §6 (ED-TC-4 rationale) notes "the evidence that actually exists at that point is inherently quote/source-shaped," but this describes provenance *shape*, not an authorization of *which* evaluation mechanism reads those documents | ED-DEC-001 §6 |

**No governing record has yet authorized any specific mechanism (rule, model, or hybrid) to populate the new signal.** This is exactly the gap this preparation record exists to surface, per §13 of ED-DEC-001.

### 3.4 — Reusable deterministic evaluator / classifier / rule engine / LLM evaluator?

- `packages/core-qualification-equivalence/src/evaluator.ts` + `rules.ts`: a pure, deterministic, fail-soft TS function. `evaluateTargetCustomerMatch` does **string-equality comparison only** (`normalise(subject.observedTargetCustomer) === normalise(snapshot.targetCustomer)`) between an already-resolved `observedTargetCustomer: string | null` and the Search's `targetCustomer` string. It is a *consumer* of a pre-computed result, not a candidate for computing that result from evidence — it has no access to quotes, documents, or model output, and `PDEF4-PCG4-ED-DEC-001` §10/§13 confirms no change to this file is implied by any decision so far.
- `packages/core-qualification-equivalence/src/rules.ts`'s sibling criteria (`evaluateServiceMatch`, `evaluateMinimumValueMatch`) are likewise pure string/number comparisons over already-resolved subject fields — none of them classify from evidence either.
- `packages/core-qualification/src/` (the deliberately-disjoint sibling package named in `types.ts`'s header comment: evaluates `NEED_DETECTED`/`EVIDENCE_PRESENT`/`CATEGORY_PLAUSIBLE` from research signals and a category-plausibility determination) — a candidate *in principle* for an evidence-to-verdict evaluator pattern, but its `CATEGORY_PLAUSIBLE` criterion is explicitly the already-excluded category-plausibility determination (§3.2), so reusing it would reintroduce the excluded substitution unless restructured; not inspected further than confirming this disjointness, per B-3's framing.
- `packages/core-research/src/categoryPlausibility.ts`'s `aggregateCategoryFit()` and `parseTargetSegments()` are the only **deterministic, evidence-adjacent** functions in the repository that resemble what a target-customer-match aggregator would need — but both operate on category-plausibility's own model-produced per-segment verdicts, which are excluded as a data source (§3.2/§3.3), not on a hypothetical target-customer verdict.
- `packages/core-launch-gates-validation/src/` (`recompute.ts`, `diff.ts`) is an **independent gate-recomputation/diff validator** — it re-runs a gate's existing formula against stored facts and diffs the result; it is not an evidence classifier and has no applicability to producing a MATCH/NO_MATCH judgment from quotes.
- **No deterministic rule engine, classifier, or LLM evaluator in the repository today is a drop-in reuse candidate for this specific comparison.** The nearest pattern (category plausibility's per-segment model-verdict-plus-code-aggregation split) is architecturally instructive (cited as precedent by ED-DEC-001) but its own computed output is excluded as a data source.

### 3.5 — Existing confidence / evidence-quality / freshness semantics

- **Confidence, two distinct and non-interchangeable meanings already coexist:**
  - `schema.ts`'s `Observation.confidence` (ResearchSignal/ FIELD_KIND structure): capped at 80 when `classification === 'INFERRED'`, must be 0 when `UNKNOWN`, otherwise unconstrained up to 100 for `OBSERVED`.
  - `categorySegmentSchema`'s `confidence` (category-plausibility, `schema.ts` ~line 230): explicitly documented as "Not a probability, not `LeadResearch.confidence`, not an Observation's confidence, **and never changes the outcome**" — it is provenance metadata only; `aggregateCategoryFit()` never reads it, only `fit`.
  - **No existing confidence field in this repository is used to determine a classification outcome** — in every structure found, confidence is recorded alongside a verdict that was already determined by other means (quote presence, model classification), never used as a threshold that flips MATCH/MISMATCH/UNKNOWN.
- **Freshness:** `packages/core-acquisition/src/scoring.ts`: `SIGNAL_FRESH_DAYS = 30`, `SIGNAL_MAX_AGE_DAYS = 180` — full weight below 30 days, linear decay to zero by 180 days, used only by `scoreProspect()`'s seven-factor scoring, and by `classifyStaleness()` (`staleness.ts`) for `ResearchSignal` age classification feeding opportunity-staleness UI (`core-opportunity`'s `classifyOpportunityStaleness`). **No freshness/staleness concept exists today for `category_plausibility_determinations` or any evaluator in `core-qualification-equivalence`** — the append-only/supersede convention (ED-DEC-001 §7) establishes which row is *current*, but nothing in the repository ages out a current, non-superseded row's validity by elapsed time.
- **Evidence-quality (quote verification):** `provenance.ts`'s `verifyProvenance()` and `categoryPlausibility.ts`'s `verifyCategoryPlausibility()` both independently verify that a model-cited quote (a) meets a minimum length (`MIN_QUOTE_CHARS`) and (b) appears verbatim, after normalisation, in a supplied source document the model actually received (`normaliseForMatch`, `normaliseUrl`) — evidence authenticity is checked structurally (quote exists in a real, supplied document), never merely that the schema shape is present. A fabricated or off-document quote is a repairable schema/provenance failure, not silently accepted.

### 3.6 — Contradictory or insufficient evidence handling today

- `aggregateCategoryFit()` (categoryPlausibility.ts): ANY-match OR logic — `MATCH` if any segment matches regardless of others; `MISMATCH` only if *every* evaluated segment mismatches; otherwise `UNKNOWN`. Explicit, tested rule (categoryPlausibility.test.ts: "UNKNOWN when a mix of MISMATCH and UNKNOWN has no MATCH (D3: never a default MISMATCH)") — a documented design principle (D3) that **insufficient/mixed evidence must never collapse into a confident negative result.**
- `evaluateQualificationEquivalence()` (core-qualification-equivalence/evaluator.ts): across its three criteria, `anyFalse` (a definite mismatch) outranks `anyUnknown` — `match` is `false` if any criterion is definitively unsatisfied, `'UNKNOWN'` only if nothing is false but something is unknown, `true` only if all three are satisfied. This is a different axis (combining multiple *criteria*, not combining multiple *evidence items for one criterion*) but the same underlying principle — a definite negative is never silently promoted to unknown, and an unknown never silently becomes a positive or negative.
- No existing structure in the repository represents "contradictory evidence" (two evidence items disagreeing about the *same* claim) as a distinct state from "insufficient evidence" (no usable evidence) — category plausibility's model only ever emits one verdict per segment, so genuine same-segment contradiction between two sources is not a case any current code path models.

### 3.7 — Natural insertion point in the research pipeline

- `packages/core-research/src/service.ts`, `runResearchForOwner()`, lines 137-155: the existing `if (deps.categoryPlausibility) { ... supersedePrevious(...); save(...); }` block, immediately after the Research provider call and `toNewResearchSignals`/`saveSignals`, is the exact pipeline position `PDEF4-PCG4-ED-DEC-001` §4/§9 names as the Research-time insertion point for the new signal. The `search` object (with `.id` and `.parameters.targetCustomer`), `prospect.id`, and `capture.supplied`/`toCapturedSourceDocuments()` (the model-seen source documents) are all already in scope at that point, mirroring exactly what category-plausibility's own save call uses. A parallel, independently-optional `deps.targetCustomerMatch?: ...` dependency following the same optional-dependency convention as `deps.categoryPlausibility` would not require restructuring this function.

### 3.8 — Existing test/fixture patterns for deterministic replay

- `packages/core-research/src/categoryPlausibility.test.ts`: pure-function unit tests for `parseTargetSegments` (determinism explicitly asserted: "is deterministic — repeated calls with the same input produce the same result"), `aggregateCategoryFit` (table of fixed input arrays → expected output, no mocking), `verifyCategoryPlausibility` (fixed `LeadResearch`/source-document fixtures asserting quote/sourceUrl verification pass/fail), and `toSegmentDeterminations` (fixed model-output fixtures → expected stored-row shape, including the "defaults a missing per-position result to NO_MODEL_VERDICT rather than throwing" and "never assigns INFERRED" cases).
- `packages/core-qualification-equivalence/src/evaluator.test.ts`: fixed `SearchSnapshot` + `subject()` builder with overrides, one `it` per criterion-combination (`match`/`false`/`'UNKNOWN'`), explicitly asserting the "definite mismatch outranks unknown" precedence rule.
- `packages/core-launch-gates/src/pcg4.test.ts`: `fakeSql(rows)` — a hand-built `SqlExecutor` stub returning fixed rows, no real database, with an explicit code comment warning against "fixing" the test by making `match` manufacture a pass — i.e., deterministic-replay fixtures that pin down *current, deliberately limited* behavior, not just happy-path behavior.
- Common shape across all three: fixed, inline, in-file fixtures (no database, no model call) that pin exact classification outputs for exact inputs, plus explicit edge-case coverage (empty/malformed input, missing-model-output, precedence between competing outcomes) — this is the pattern a future `TC-MATCH` evaluator's own test suite would be expected to follow.

---

## 4. Engineering observations

- The ED decision (§8/§13) has already fixed *where* the result lives and *when* it is written, but the new table's `result` column has no populating logic anywhere in the repository today — `ED-DEC-001`'s own description (§8) is explicit that the migration "can be built, but nothing yet populates it correctly" until this exact question is answered.
- The category-plausibility pipeline is architecturally the closest working precedent for *how* an evidence-to-verdict step could be built (deterministic pre/post-processing in code, a single bounded model call for the judgment itself, structural quote verification before trusting any MATCH/MISMATCH) — but its own computed output is excluded as a data source, so at most its *shape*, not its *result*, can inform a new mechanism.
- Every existing evaluator in `core-qualification-equivalence` is a pure comparison over already-resolved fields; none of them perform evidence-to-verdict classification. A target-customer-match evaluator that classifies from evidence is a materially different kind of component than anything `core-qualification-equivalence` currently contains.
- Confidence fields exist in two places and are documented as *not* driving outcomes in the one place (`categorySegmentSchema`) structurally closest to this problem — any future mechanism that wants confidence to affect the MATCH/NO_MATCH/NOT_YET_OBSERVED result would be a new pattern, not a continuation of an existing one.
- No freshness/staleness rule currently touches any append-only/supersede-style determination table (`category_plausibility_determinations` has none); `SIGNAL_FRESH_DAYS`/`SIGNAL_MAX_AGE_DAYS` apply only to `core-acquisition`'s unrelated scoring signals. Importing that specific numeric policy into target-customer-match would be a new application of an existing constant, not an existing cross-cutting rule.

---

## 5. Decision dimensions TC-MATCH-1 through TC-MATCH-12

Each dimension states the question, what the repository establishes (if anything), what is unresolved, and a clearly labeled analyst recommendation. None of these is selected.

### TC-MATCH-1 — Authorized evidence source
**Question:** What evidence may feed the evaluator that produces MATCH/NO_MATCH/NOT_YET_OBSERVED?
**Known:** Category plausibility, Search-membership, and `offer_rationale` are excluded (§3.3). Research signals are not affirmatively permitted. Document evidence available at Research-time (the same source documents already fetched for the Research call) is neither named nor excluded by any governing record.
**Unresolved:** Whether "the same source documents Research already has in hand" is itself an authorized evidence source, or whether a dedicated, separately-fetched evidence-gathering step is required.
**Analyst recommendation (not a decision):** The Research-time source documents already supplied to the provider for that pipeline run appear to be the only evidence category that is both already-in-scope at the chosen pipeline position (§3.7) and not excluded by any governing record — but this is a reading of silence, not an authorization, and should be confirmed explicitly before being relied on.
ENGINEERING SELECTION: __________________

### TC-MATCH-2 — Evaluation mechanism
**Question:** Deterministic rules vs. structured evaluator vs. model-assisted evaluator vs. hybrid?
**Known:** The closest repository precedent (category plausibility) is a hybrid: deterministic parsing before the model call, a single bounded model call for the per-item judgment, deterministic aggregation after. No purely deterministic rule engine exists that could classify target-customer match from unstructured evidence without a model step, because the comparison is a semantic one (does this business's observed characteristics match a free-text customer-type criterion), not a structural one.
**Unresolved:** Whether this specific comparison can or should be reduced to deterministic rules at all, given `targetCustomer` is a free-text, user-authored string with no closed vocabulary.
**Analyst recommendation (not a decision):** A hybrid matching category-plausibility's own split (deterministic framing before the model call, deterministic aggregation after, model only for the semantic judgment itself) is the only mechanism shape with a working local precedent; a purely deterministic approach would need a closed vocabulary that does not exist today.
ENGINEERING SELECTION: __________________

### TC-MATCH-3 — MATCH semantics
**Question:** What exact conditions permit a `MATCH` result?
**Known:** `PDEF4-PCG4-PO-DEC-001` §7 fixes the product semantics precisely: "whether the specific Opportunity's Prospect, as actually observed during research/review, was found to be the kind of customer the user's Search configured as its `targetCustomer` criterion" — a statement about observed characteristics, never about Search/Discovery membership, service match, minimum value, or category plausibility, and never from free text or inference not backed by a structured field.
**Unresolved:** What *evidentiary* bar (e.g., quote presence, verification against supplied documents, minimum confidence) must be met before that product-level statement is allowed to resolve to `MATCH`, mirroring `verifyCategoryPlausibility`'s structural quote-authenticity check (§3.5) but for this new signal.
**Analyst recommendation (not a decision):** Given PO-DEC-001 §7's bar against "any free-text, prose-derived, or inferred characterization not backed by a structured field," a MATCH should likely require at least one verified, verbatim, on-document quote — the same structural bar `verifyCategoryPlausibility`/`verifyProvenance` already apply elsewhere — not a bare model assertion.
ENGINEERING SELECTION: __________________

### TC-MATCH-4 — NO_MATCH semantics
**Question:** What exact conditions permit `NO_MATCH` rather than `NOT_YET_OBSERVED`?
**Known:** Nothing in any governing record defines this. The nearest precedent, `aggregateCategoryFit`'s D3 principle, is explicit that insufficient/mixed evidence must never collapse into a default negative (§3.6) — for category plausibility, `MISMATCH` requires every evaluated segment to mismatch, not merely the absence of a match.
**Unresolved:** Whether `NO_MATCH` requires an affirmative, evidenced finding that the Prospect does *not* match (symmetric to MATCH's evidentiary bar), or can be reached by absence/exhaustion of positive evidence after a genuine look.
**Analyst recommendation (not a decision):** Symmetric evidentiary treatment with MATCH — `NO_MATCH` should require its own verified, on-document evidence of non-matching characteristics, not merely a failure to find matching evidence, consistent with D3's "never a default negative" principle carried over from the nearest precedent.
ENGINEERING SELECTION: __________________

### TC-MATCH-5 — NOT_YET_OBSERVED semantics
**Question:** When must the evaluator remain unknown rather than committing to MATCH or NO_MATCH?
**Known:** `PDEF4-PCG4-ED-DEC-001` §5 fixes that row-absence is the `NOT_YET_OBSERVED` state, never materialized as a default row ahead of actual observation, and §9's translation never defaults an absent row to `NO_MATCH`.
**Unresolved:** Whether a row *can exist* with an explicit `NOT_YET_OBSERVED` result (e.g., the pipeline ran but produced genuinely insufficient evidence either way), or whether `NOT_YET_OBSERVED` is purely a row-absence state as ED-DEC-001's wording suggests.
**Analyst recommendation (not a decision):** None — this reduces to TC-MATCH-6/TC-MATCH-9 below and should not be answered independently of them.
ENGINEERING SELECTION: __________________

### TC-MATCH-6 — Contradictory evidence
**Question:** How are conflicting evidence items (for or against) handled?
**Known:** No existing code path in the repository models genuine same-claim contradiction between two sources — category plausibility's model emits one verdict per segment, not per-source. `aggregateCategoryFit`'s cross-segment OR logic is a different kind of aggregation (multiple distinct segments, not multiple sources disagreeing about the same segment).
**Unresolved:** Whether a future evaluator would even receive multiple, potentially-conflicting source documents per Prospect at once, and if so, what resolves a conflict.
**Analyst recommendation (not a decision):** Given no precedent exists, and D3's principle (insufficient/mixed evidence → unknown, never a default negative) is the only locally-established tie-breaking norm, a genuine conflict should most likely resolve toward `NOT_YET_OBSERVED`/unresolved rather than toward either `MATCH` or `NO_MATCH` by default — but this is a new policy question, not an extension of an existing rule.
ENGINEERING SELECTION: __________________

### TC-MATCH-7 — Confidence
**Question:** Is confidence provenance metadata only, or does it affect classification?
**Known:** Every confidence field found in the repository (`Observation.confidence`, `categorySegmentSchema.confidence`) is recorded as provenance; the closest structural precedent explicitly documents that its confidence field "never changes the outcome" (§3.5).
**Unresolved:** Whether this new evaluator should follow that same convention or deviate from it.
**Analyst recommendation (not a decision):** Following the only local precedent, confidence should likely remain provenance/observability metadata only, consistent with how every other confidence field in this repository is treated.
ENGINEERING SELECTION: __________________

### TC-MATCH-8 — Evidence freshness
**Question:** Can stale evidence establish the result; if so, under what rule?
**Known:** No freshness/staleness concept exists today for any append-only/supersede determination table, including the directly analogous `category_plausibility_determinations`. `SIGNAL_FRESH_DAYS`/`SIGNAL_MAX_AGE_DAYS` exist but apply only to `core-acquisition`'s scoring signals, an unrelated subsystem.
**Unresolved:** Whether target-customer-match evidence should age out at all, and if so, on what schedule.
**Analyst recommendation (not a decision):** Given the closest architectural sibling (category plausibility) has no freshness rule, importing one here would be new policy, not continuation of an existing cross-cutting norm — recommend treating this as an open policy question rather than assuming `SIGNAL_FRESH_DAYS` transfers.
ENGINEERING SELECTION: __________________

### TC-MATCH-9 — Failure behavior
**Question:** How should provider failure, missing fields, malformed evidence, or evaluator errors be handled?
**Known:** The repository's consistent pattern (category plausibility's `verifyCategoryPlausibility`/repair-loop, `rules.ts`'s fail-soft `null → 'UNKNOWN'` contract, `pcg4.ts`'s own comment that `'UNKNOWN'` is "deliberate, tested behavior... not a bug to silently work around") is fail-soft: never throw, never default to a false positive or negative, resolve to the unknown/not-yet-observed state instead.
**Unresolved:** The exact new-signal-specific failure taxonomy (provider timeout vs. malformed model output vs. missing source documents) has not been enumerated for this signal.
**Analyst recommendation (not a decision):** Follow the repository-wide fail-soft convention exactly — any failure mode should resolve toward `NOT_YET_OBSERVED` (row absent, or an explicit row if TC-MATCH-5 allows one), never toward `NO_MATCH`, mirroring `pcg4.ts`'s and `rules.ts`'s existing, explicitly-documented stance.
ENGINEERING SELECTION: __________________

### TC-MATCH-10 — Determinism / replay
**Question:** What inputs are permitted such that the same evidence reproducibly yields the same result?
**Known:** Category plausibility's split is explicit about this: `parseTargetSegments`/`aggregateCategoryFit` are deterministic and unit-tested for determinism directly; only the single bounded model call in between is not. `evaluateQualificationEquivalence`/`evaluateTargetCustomerMatch` are pure functions with no I/O or clock.
**Unresolved:** Whether a future target-customer-match evaluator should isolate its own non-deterministic step (a model call) behind the same kind of deterministic pre/post boundary, and whether model temperature/version pinning or snapshot-replay (as `gate_evaluation_snapshots`, migration `0035`, already does at the gate level) is expected at this signal's level too.
**Analyst recommendation (not a decision):** The deterministic-wrapper-around-one-bounded-model-call shape, with the deterministic parts unit-testable exactly as `categoryPlausibility.test.ts` already demonstrates, is the only pattern with working local precedent for "reproducible given the same evidence."
ENGINEERING SELECTION: __________________

### TC-MATCH-11 — Test contract
**Question:** What fixture categories and acceptance criteria should a future evaluator's tests cover?
**Known:** §3.8 catalogs the existing pattern across three sibling test suites: fixed in-file fixtures (no DB, no live model call), one test per classification-outcome combination, explicit edge cases (empty/malformed input, missing/partial model output defaulting safely, precedence between competing outcomes), and at least one test (`pcg4.test.ts`) that pins down current, deliberately limited behavior with an explicit warning against "fixing" it by manufacturing a pass.
**Unresolved:** The specific fixture set for *this* evaluator (e.g., verified-quote MATCH, verified-quote NO_MATCH, contradictory-evidence case per TC-MATCH-6, stale-evidence case per TC-MATCH-8, malformed-model-output case per TC-MATCH-9) cannot be finalized until TC-MATCH-1 through TC-MATCH-9 are answered.
**Analyst recommendation (not a decision):** Model the suite directly on `categoryPlausibility.test.ts` + `evaluator.test.ts` + `pcg4.test.ts`'s combined pattern once the semantics above are fixed; do not author fixtures before TC-MATCH-3/4/5/6/9 are answered, since the fixtures encode those answers.
ENGINEERING SELECTION: __________________

### TC-MATCH-12 — Package ownership
**Question:** Which package should own this evaluator, and why?
**Known:** `core-research` already owns the Research-time pipeline position (§3.7) and the category-plausibility precedent lives there. `core-qualification-equivalence` owns the pure *consumer* comparison (`evaluateTargetCustomerMatch`) and, per ED-DEC-001 §13, is not expected to change. `core-launch-gates` owns only gate aggregation/SQL, not evidence classification. `core-launch-gates-validation` is a recompute/diff validator, not an evaluator (§3.4).
**Unresolved:** Whether the new evidence-to-verdict logic belongs inside `core-research` (co-located with category plausibility, sharing provenance/quote-verification helpers) or in a new, narrowly-scoped sibling package (as ED-DEC-001 §13 itself flags as undecided: "`@acos/core-research` vs. a new, narrowly-scoped package").
**Analyst recommendation (not a decision):** `core-research` is the stronger fit by direct precedent — it already contains the Research-time insertion point (§3.7), the quote/source-verification helpers (`provenance.ts`) a verified-quote bar (TC-MATCH-3/4) would reuse, and the structurally-analogous `categoryPlausibility.ts` module — but ED-DEC-001 leaves this genuinely open, and a new sibling package is not ruled out by any repository fact found here.
ENGINEERING SELECTION: __________________

---

## 6. Unresolved dependencies

- This record depends on, and does not resolve, `PDEF4-PCG4-ED-DEC-001` §13's three still-open items beyond the evaluation mechanism itself: the exact `pcg4.ts`-boundary translation function, which package owns the table/write-path (TC-MATCH-12 above), and the table/column naming (illustrative only in ED-DEC-001 §8).
- Every one of TC-MATCH-1 through TC-MATCH-12 depends on the others to varying degrees (noted inline per dimension) — none can be finalized in isolation, most visibly TC-MATCH-3/4/5/6 (which together define the full state-transition semantics) and TC-MATCH-11 (whose fixtures encode whatever TC-MATCH-3/4/5/6/9 decide).
- No migration, schema change, or implementation can proceed on this question until a future **evaluation-mechanism engineering-design decision** (not this preparation record) selects among the options surfaced above, followed by the separate implementation-authorization decision ED-DEC-001 §12 already requires for any code/schema/migration work.

---

## 7. Authorization boundary

This record authorizes **nothing**. It is a preparation document only: it surfaces repository facts, engineering observations, and clearly-labeled, non-binding analyst recommendations for twelve decision dimensions, each ending in a blank, unfilled `ENGINEERING SELECTION:` line. It does not:

- implement any evaluator, rule, classifier, or model-assisted mechanism;
- modify `pcg4.ts`, `rules.ts`, `evaluator.ts`, `categoryPlausibility.ts`, `service.ts`, or any other source file;
- modify `schema.prisma` or create any migration;
- write or run any test;
- wire anything into production;
- authorize launch, release, deployment, or any further implementation step.

No file other than this one was created. No existing file — tracked source, schema, test, config, or any `requirement/*.md` record — was modified. `git status --short` before this file existed showed exactly 75 pre-existing entries; this record is the sole addition.

---

## 8. Provenance statement

This preparation record was produced by Claude (Anthropic AI assistant) at the explicit request of the human Product Owner in this session, as a read-only investigation and preparation artifact. It makes no Product Owner or engineering-design decision and must not be represented as one.
