# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Evaluation Mechanism Decision Questionnaire

**Record ID:** `PDEF4-PCG4-TCMATCH-MECH-QUESTIONNAIRE-001`
**Date:** 2026-10-05
**Type:** Formal questionnaire. **This document decides nothing.** It carries forward the twelve decision
dimensions (TC-MATCH-1 through TC-MATCH-12) surfaced by
`requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_DECISION_PREPARATION.md`
(`PDEF4-PCG4-TCMATCH-MECH-PREP-001`, §5) as genuinely open engineering choices. No code, schema, migration,
or test file is created or modified by this document, and no Product Owner or engineering decision is made
here.

---

## 0. Scope and authority

- **Governing, binding, not reopened:**
  - `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` (`PDEF4-PCG4-PO-DEC-001`)
    — fixes the product semantics of `TARGET_CUSTOMER_MATCH` ("whether the specific Opportunity's Prospect, as
    actually observed, was found to be the kind of customer the Search's `targetCustomer` criterion names"),
    rules out Search-membership and "no signal qualifies," and authorizes a new, not-yet-designed signal
    (Option B) as future scope only.
  - `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md` (`PDEF4-PCG4-ED-DEC-001`)
    — fixes signal owner, timing, storage shape, provenance shape, and history behavior for the new signal; its
    §13 explicitly defers the evaluation-mechanism question (the twelve items below) to a future record.
  - `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_PREPARATION.md` and
    `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION_QUESTIONNAIRE.md`
    — antecedents to `PDEF4-PCG4-ED-DEC-001`; read for context, not reopened.
- **Primary source for the twelve items below:** `PDEF4-PCG4-TCMATCH-MECH-PREP-001`, specifically its §3 (repository
  facts), §4 (engineering observations), and §5 (TC-MATCH-1 through TC-MATCH-12). This questionnaire cites the
  prep record's findings as-is; it does not re-derive or alter them, and re-verified only the specific claims
  noted inline against the one source file each cites, per this task's efficiency constraint.
- **What this questionnaire adds beyond the prep record:** an explicit, literal `ENGINEERING SELECTION:` blank
  per dimension (the prep record already ends each dimension this way; this document preserves that), a
  verbatim `ANALYST RECOMMENDATION — NOT A DECISION` label on every recommendation, and a consolidated
  cross-decision dependency map (§2) drawn only from dependencies the prep record's own text supports.
- **If any option below proposes a new structured research signal as the evidence source, selecting it
  authorizes the semantic design of that signal only — not its implementation, storage, or wiring.** Any
  implementation remains gated by a future, separate implementation-authorization decision, consistent with
  `PDEF4-PCG4-ED-DEC-001` §12's existing requirement for any code/schema/migration work.

---

## 1. TC-MATCH-1 — Authorized evidence source

**Question:** What evidence may establish that a Prospect satisfies the Search's `targetCustomer` criterion
(i.e., may feed the evaluator that produces `MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED`)?

**Known (prep record §3.3):**

| Candidate | Status |
|---|---|
| Search-membership / Discovery candidate filter | **Excluded** — a query-side criterion, not an observation (`PDEF4-PCG4-PO-DEC-001` §3) |
| `category_plausibility_determinations` (category plausibility) | **Excluded as a substitute** — precedent only, per B-3 (quoted in both the PO decision and `PDEF4-PCG4-ED-DEC-001`) |
| `StoredResearchSignal` / `research_signals` | **Not affirmatively permitted** — no governing record authorizes it (`PDEF4-PCG4-PO-DEC-001` §3) |
| `Opportunity.offer_rationale` (free text) | **Excluded** — not structured; using it would require inventing new parsing/derivation logic (`PDEF4-PCG4-PO-DEC-001` §3) |
| A new, not-yet-designed Opportunity/Search-Prospect-level observed-target-customer signal | **Authorized as future scope only** (Option B) — semantics fixed by the PO decision §7, storage/timing/provenance/history fixed by `PDEF4-PCG4-ED-DEC-001` §3-§8 |
| Document evidence already available at Research-time (the same source documents category-plausibility already has in hand) | **Not excluded, not affirmatively named either** — `PDEF4-PCG4-ED-DEC-001` §6 notes this describes provenance *shape*, not an authorization of *which* mechanism reads those documents |

**Explicitly preserved exclusions (not reopened here):** category plausibility is not the signal; Search
membership is not proof; `Opportunity.offer_rationale` is not automatically qualifying evidence.

**Unresolved:** Whether "the same source documents Research already has in hand" is itself an authorized
evidence source, or whether a dedicated, separately-fetched evidence-gathering step is required.

**ANALYST RECOMMENDATION — NOT A DECISION:** The Research-time source documents already supplied to the
provider for that pipeline run appear to be the only evidence category that is both already-in-scope at the
likely pipeline position (prep record §3.7) and not excluded by any governing record — but this is a reading
of silence, not an authorization, and should be confirmed explicitly before being relied on. If this option
is selected, it authorizes the semantic design of a new structured research signal only, not its
implementation.

ENGINEERING SELECTION: __________________

---

## 2. TC-MATCH-2 — Evaluation mechanism

**Question:** Should the MATCH/NO_MATCH/NOT_YET_OBSERVED judgment be produced by deterministic rule
evaluation, a structured evaluator, a model-assisted evaluator, or a hybrid of deterministic and
model-assisted steps?

**Known (prep record §3.4, §5 TC-MATCH-2):**
- The only working local precedent for an evidence-to-verdict step, `categoryPlausibility.ts`'s
  deterministic-parse → model-call → deterministic-aggregation split, is cited by `PDEF4-PCG4-ED-DEC-001` as
  architectural **shape precedent only** — its own computed output is excluded as a data source for this
  signal (TC-MATCH-1), so at most its shape, not its result, can inform a new mechanism.
- No purely deterministic rule engine in the repository can classify target-customer match from unstructured
  evidence without a model step, because the comparison is semantic (does this business's observed
  characteristics match a free-text customer-type criterion), not structural — `targetCustomer` is a free-text,
  user-authored string with no closed vocabulary.
- `core-qualification-equivalence`'s evaluators (including `evaluateTargetCustomerMatch` itself) are pure
  comparisons over already-resolved fields; none perform evidence-to-verdict classification, and none is a
  candidate for computing the result itself.

**Consequences to weigh (not resolved here):**
- *Reproducibility:* deterministic rules are perfectly reproducible; model-assisted steps are reproducible
  only insofar as the deterministic pre/post boundary is isolated (as in the category-plausibility shape) and
  model version/inputs are pinned (see TC-MATCH-10).
- *Evidence requirements:* a deterministic evaluator requires evidence already reducible to a closed
  vocabulary or structured predicate; a model-assisted evaluator can work from unstructured document text but
  then requires a verification step (see TC-MATCH-3) to avoid trusting unverified model assertions.
- *Failure behavior:* a model-assisted step introduces provider-failure and malformed-output modes a pure
  deterministic evaluator does not have (see TC-MATCH-9).
- *Maintenance:* a hybrid mirroring category plausibility's shape would need its own module, test suite, and
  provenance/quote-verification logic (possibly shared with `provenance.ts`), rather than being a drop-in
  reuse of any existing evaluator.

**Unresolved:** Whether this specific comparison can or should be reduced to deterministic rules at all, given
the free-text nature of `targetCustomer`.

**ANALYST RECOMMENDATION — NOT A DECISION:** A hybrid matching category-plausibility's own split (deterministic
framing before the model call, deterministic aggregation after, model only for the semantic judgment itself)
is the only mechanism shape with a working local precedent; a purely deterministic approach would need a
closed vocabulary that does not exist today.

ENGINEERING SELECTION: __________________

---

## 3. TC-MATCH-3 — MATCH semantics

**Question:** What exact conditions permit the evaluator to return `MATCH`?

**Known (prep record §5 TC-MATCH-3):** `PDEF4-PCG4-PO-DEC-001` §7 fixes the product semantics precisely: a
statement about observed characteristics of the specific Opportunity's Prospect, never about Search/Discovery
membership, service match, minimum value, or category plausibility, and never from free text or inference not
backed by a structured field.

**Candidate conditions (not selected among here):**
- Explicit positive evidence (e.g., at least one verified, verbatim, on-document quote establishing the match).
- Sufficient multi-source evidence (more than one corroborating source).
- Model inference from evidence, without a mandatory verbatim-quote requirement.
- Other repo-supported alternatives not yet named.

**Unresolved:** What evidentiary bar (quote presence, verification against supplied documents, a minimum
confidence) must be met before the product-level statement above is allowed to resolve to `MATCH`, mirroring
`verifyCategoryPlausibility`'s structural quote-authenticity check (prep record §3.5) but for this new signal.
No threshold is manufactured here beyond what the prep record itself supports.

**ANALYST RECOMMENDATION — NOT A DECISION:** Given `PDEF4-PCG4-PO-DEC-001` §7's bar against "any free-text,
prose-derived, or inferred characterization not backed by a structured field," a MATCH should likely require
at least one verified, verbatim, on-document quote — the same structural bar `verifyCategoryPlausibility`/
`verifyProvenance` already apply elsewhere — not a bare model assertion.

ENGINEERING SELECTION: __________________

---

## 4. TC-MATCH-4 — NO_MATCH semantics

**`NO_MATCH ≠ NOT_YET_OBSERVED` unless the PO explicitly decides otherwise.** These are treated as separate
states throughout this document; nothing below should be read as collapsing them.

**Question:** What exact conditions permit the evaluator to return `NO_MATCH` rather than `NOT_YET_OBSERVED`?

**Known (prep record §3.6, §5 TC-MATCH-4):** Nothing in any governing record defines this. The nearest
precedent, `aggregateCategoryFit`'s D3 principle, is explicit that insufficient/mixed evidence must never
collapse into a default negative — for category plausibility, `MISMATCH` requires every evaluated segment to
mismatch, not merely the absence of a match. **No repo precedent exists for an explicit negative
determination** of the kind `NO_MATCH` would be for this signal; D3 only addresses insufficient evidence never
defaulting negative, not what constitutes sufficient negative evidence.

**Candidate conditions for sufficient negative evidence (not selected among here):**
- An affirmative, evidenced finding that the Prospect does *not* match (symmetric to MATCH's evidentiary bar —
  e.g., a verified, on-document quote establishing non-matching characteristics).
- Exhaustion of positive evidence after a genuine look (absence-based), which D3's principle would caution
  against if read as a repo-wide norm.
- A combination (e.g., a minimum amount of negative evidence with no corroborating positive evidence).

**Unresolved:** Whether `NO_MATCH` requires an affirmative, evidenced finding symmetric to MATCH's bar, or can
be reached by absence/exhaustion of positive evidence.

**ANALYST RECOMMENDATION — NOT A DECISION:** Symmetric evidentiary treatment with MATCH — `NO_MATCH` should
require its own verified, on-document evidence of non-matching characteristics, not merely a failure to find
matching evidence, consistent with D3's "never a default negative" principle carried over from the nearest
precedent.

ENGINEERING SELECTION: __________________

---

## 5. TC-MATCH-5 — NOT_YET_OBSERVED semantics

**Question:** When must the evaluator remain unknown (`NOT_YET_OBSERVED`) rather than committing to `MATCH` or
`NO_MATCH`?

**Known (prep record §5 TC-MATCH-5):** `PDEF4-PCG4-ED-DEC-001` §5 fixes that row-absence is the
`NOT_YET_OBSERVED` state, never materialized as a default row ahead of actual observation, and §9's translation
never defaults an absent row to `NO_MATCH`.

**Cases to consider as separate options/considerations (not collapsed into one):**
- Insufficient evidence (some evidence exists but does not meet the bar for either MATCH or NO_MATCH).
- Missing evidence entirely (no relevant document evidence was available at evaluation time).
- Evaluator failure (the mechanism itself failed to produce a judgment — see TC-MATCH-9).
- Other repo-supported cases not yet named (e.g., contradictory evidence per TC-MATCH-6, if that dimension
  selects a `NOT_YET_OBSERVED`-leaning resolution).

**Unresolved:** Whether a row can exist with an explicit `NOT_YET_OBSERVED` result (the pipeline ran but
produced genuinely insufficient evidence either way), or whether `NOT_YET_OBSERVED` is purely a row-absence
state as `PDEF4-PCG4-ED-DEC-001`'s wording suggests.

**ANALYST RECOMMENDATION — NOT A DECISION:** None offered independently — the prep record itself states this
reduces to TC-MATCH-6/TC-MATCH-9 below and should not be answered independently of them.

ENGINEERING SELECTION: __________________

---

## 6. TC-MATCH-6 — Contradictory evidence

**Question:** How are conflicting evidence items (for and against the same claim) handled?

**Known (prep record §3.6, §5 TC-MATCH-6):** **No repo precedent models same-claim conflict at all.** No
existing code path in the repository models genuine same-claim contradiction between two sources — category
plausibility's model emits one verdict per segment, not per-source. `aggregateCategoryFit`'s cross-segment OR
logic is a different kind of aggregation (multiple distinct segments, not multiple sources disagreeing about
the same segment).

**Candidate alternatives (not selected among here):**
- Positive-evidence-wins.
- Negative-evidence-wins.
- Contradiction → `NOT_YET_OBSERVED`.
- Deterministic conflict resolution (e.g., a fixed precedence rule over source types).
- Model-assisted adjudication (a further model call to resolve the conflict).

**Unresolved:** Whether a future evaluator would even receive multiple, potentially-conflicting source
documents per Prospect at once, and if so, what resolves a conflict.

**ANALYST RECOMMENDATION — NOT A DECISION:** Given no precedent exists, and D3's principle (insufficient/mixed
evidence → unknown, never a default negative) is the only locally-established tie-breaking norm, a genuine
conflict should most likely resolve toward `NOT_YET_OBSERVED`/unresolved rather than toward either `MATCH` or
`NO_MATCH` by default — but this is a new policy question, not an extension of an existing rule.

ENGINEERING SELECTION: __________________

---

## 7. TC-MATCH-7 — Confidence

**Question:** Is confidence provenance metadata only, does it gate MATCH/NO_MATCH, does it participate in a
defined threshold, or is it informational but exposed to audit/reporting?

**Known (prep record §3.5, §5 TC-MATCH-7):** Confidence fields exist with two distinct, non-interchangeable
meanings already (`Observation.confidence`, capped by classification; `categorySegmentSchema.confidence`,
explicitly documented as "never changes the outcome"). **In every structure found, confidence is used
repo-wide as provenance only, never as a classification input** that flips a verdict. No numeric threshold is
invented here.

**Candidate choices (not selected among here):**
- Provenance/observability metadata only (matches every existing confidence field in the repository).
- Gates MATCH/NO_MATCH directly (a new pattern — no repo precedent).
- Participates in a defined threshold alongside other factors (a new pattern — no repo precedent).
- Informational but surfaced to audit/reporting views, without affecting the classification itself.

**Unresolved:** Whether this new evaluator should follow the existing provenance-only convention or deviate
from it.

**ANALYST RECOMMENDATION — NOT A DECISION:** Following the only local precedent, confidence should likely
remain provenance/observability metadata only, consistent with how every other confidence field in this
repository is treated.

ENGINEERING SELECTION: __________________

---

## 8. TC-MATCH-8 — Evidence freshness

**Question:** Can stale evidence still establish the result, and if so, under what rule — no expiry, an
explicit freshness window, source-dependent freshness, or evaluator-triggered refresh?

**Known (prep record §3.5, §5 TC-MATCH-8):** **No generic freshness rule exists for any determination table**
in this repository, including the directly analogous `category_plausibility_determinations`. The append-only/
supersede convention (`PDEF4-PCG4-ED-DEC-001` §7) establishes which row is *current*, but nothing in the
repository ages out a current, non-superseded row's validity by elapsed time. `SIGNAL_FRESH_DAYS`/
`SIGNAL_MAX_AGE_DAYS` exist but apply only to `core-acquisition`'s unrelated scoring signals.

**Candidate choices (not selected among here):**
- No expiry (current row is valid indefinitely until superseded).
- An explicit freshness window (a fixed duration, not invented or assumed here).
- Source-dependent freshness (different windows depending on evidence type/source).
- Evaluator-triggered refresh (re-evaluation triggered by some event rather than elapsed time).

**Unresolved:** Whether target-customer-match evidence should age out at all, and if so, on what schedule. No
duration is proposed by this document.

**ANALYST RECOMMENDATION — NOT A DECISION:** Given the closest architectural sibling (category plausibility)
has no freshness rule, importing one here would be new policy, not continuation of an existing cross-cutting
norm — recommend treating this as an open policy question rather than assuming `SIGNAL_FRESH_DAYS` transfers.

ENGINEERING SELECTION: __________________

---

## 9. TC-MATCH-9 — Failure behavior

**Question:** How should missing evidence, provider failure, evaluator failure, malformed evidence, and
timeout each be handled — distinguished, not merged into one failure mode?

**Known (prep record §5 TC-MATCH-9):** The repository's consistent pattern (category plausibility's
`verifyCategoryPlausibility`/repair-loop, `rules.ts`'s fail-soft `null → 'UNKNOWN'` contract, `pcg4.ts`'s own
comment that `'UNKNOWN'` is "deliberate, tested behavior... not a bug to silently work around") is fail-soft:
never throw, never default to a false positive or negative, resolve to the unknown/not-yet-observed state
instead.

**Distinguished failure modes and fail-soft alternatives (none selected here):**
- *Missing evidence* — no relevant document available; fail-soft target: `NOT_YET_OBSERVED` (or row absence,
  per TC-MATCH-5).
- *Provider failure* (the research/model provider call itself errors or times out) — fail-soft target:
  `NOT_YET_OBSERVED`, not a thrown error surfaced as a pipeline failure.
- *Evaluator failure* (the deterministic pre/post logic around the model call errors) — fail-soft target:
  `NOT_YET_OBSERVED`.
- *Malformed evidence* (model output does not match the expected schema, or a cited quote fails verification
  per `verifyCategoryPlausibility`'s pattern) — fail-soft target: `NOT_YET_OBSERVED`, consistent with
  `toSegmentDeterminations`' "defaults a missing per-position result to NO_MODEL_VERDICT rather than throwing."
- *Timeout* — fail-soft target: `NOT_YET_OBSERVED`.

**Unresolved:** The exact new-signal-specific failure taxonomy (provider timeout vs. malformed model output vs.
missing source documents) has not been enumerated for this signal beyond the categories above.

**ANALYST RECOMMENDATION — NOT A DECISION:** Follow the repository-wide fail-soft convention exactly — any
failure mode should resolve toward `NOT_YET_OBSERVED` (row absent, or an explicit row if TC-MATCH-5 allows
one), never toward `NO_MATCH`, mirroring `pcg4.ts`'s and `rules.ts`'s existing, explicitly-documented stance.

ENGINEERING SELECTION: __________________

---

## 10. TC-MATCH-10 — Determinism / replay

**Question:** What must be reproducible, and by what mechanism — deterministic replay from persisted evidence,
persistence of evaluator inputs, persistence of model output, model/version metadata, and/or recomputation
semantics?

**Known (prep record §5 TC-MATCH-10):** Category plausibility's split is explicit about this:
`parseTargetSegments`/`aggregateCategoryFit` are deterministic and unit-tested for determinism directly; only
the single bounded model call in between is not. `evaluateQualificationEquivalence`/`evaluateTargetCustomerMatch`
are pure functions with no I/O or clock.

**Candidate elements (not selected among here):**
- Deterministic replay from persisted evidence (given the same stored evidence, the deterministic parts always
  produce the same aggregation).
- Persistence of evaluator inputs (storing exactly what was fed to the model call).
- Persistence of model output (storing the raw model response, not just the derived verdict).
- Model/version metadata (recording which model and version produced a given judgment).
- Recomputation semantics (whether and how a result can be regenerated from the same persisted inputs later).

**Unresolved:** Whether a future target-customer-match evaluator should isolate its non-deterministic step (the
model call) behind the same kind of deterministic pre/post boundary as category plausibility, and whether
model temperature/version pinning or snapshot-replay (as `gate_evaluation_snapshots`, migration `0035`, already
does at the gate level) is expected at this signal's level too.

**ANALYST RECOMMENDATION — NOT A DECISION:** The deterministic-wrapper-around-one-bounded-model-call shape,
with the deterministic parts unit-testable exactly as `categoryPlausibility.test.ts` already demonstrates, is
the only pattern with working local precedent for "reproducible given the same evidence."

ENGINEERING SELECTION: __________________

---

## 11. TC-MATCH-11 — Test contract

**Question:** What are the minimum acceptance-test categories a future evaluator's test suite must cover (not
implemented here)?

**Known (prep record §3.8, §5 TC-MATCH-11):** The existing pattern across three sibling test suites
(`categoryPlausibility.test.ts`, `evaluator.test.ts`, `pcg4.test.ts`) is: fixed in-file fixtures (no DB, no live
model call), one test per classification-outcome combination, explicit edge cases (empty/malformed input,
missing/partial model output defaulting safely, precedence between competing outcomes), and at least one test
that pins down current, deliberately limited behavior with an explicit warning against "fixing" it by
manufacturing a pass.

**Minimum acceptance-test categories (fixture counts and numeric thresholds left blank — those require a
separate decision):**
- Clear positive (unambiguous MATCH).
- Clear negative (unambiguous NO_MATCH, once TC-MATCH-4 is answered).
- Insufficient evidence (resolves to NOT_YET_OBSERVED, per TC-MATCH-5).
- Contradictory evidence (per TC-MATCH-6's selected resolution).
- Evaluator failure (per TC-MATCH-9).
- Malformed evidence (per TC-MATCH-9).
- Repeated evaluation (same evidence evaluated twice yields the same result, per TC-MATCH-10).
- Supersession/history (a later evaluation supersedes an earlier one, consistent with whichever history model
  TC-MATCH-8/governing ED decision establishes).
- Deterministic replay (given persisted inputs, the deterministic portions reproduce the same aggregation).

**Unresolved:** The specific fixture set for this evaluator cannot be finalized until TC-MATCH-1 through
TC-MATCH-9 are answered, since the fixtures encode those answers. No fixture count or numeric threshold is
proposed here.

**ANALYST RECOMMENDATION — NOT A DECISION:** Model the suite directly on `categoryPlausibility.test.ts` +
`evaluator.test.ts` + `pcg4.test.ts`'s combined pattern once the semantics above are fixed; do not author
fixtures before TC-MATCH-3/4/5/6/9 are answered, since the fixtures encode those answers.

ENGINEERING SELECTION: __________________

---

## 12. TC-MATCH-12 — Package ownership

**Question:** Which package should own the evaluator, and why?

**Known (prep record §5 TC-MATCH-12):** `core-research` already owns the Research-time pipeline position
(prep record §3.7) and the category-plausibility precedent lives there. `core-qualification-equivalence` owns
the pure *consumer* comparison (`evaluateTargetCustomerMatch`) and, per `PDEF4-PCG4-ED-DEC-001` §13, is not
expected to change. `core-launch-gates` owns only gate aggregation/SQL, not evidence classification.
`core-launch-gates-validation` is a recompute/diff validator, not an evaluator (prep record §3.4).

**Candidate alternatives (not selected among here):**
- `core-research` (co-located with category plausibility, sharing provenance/quote-verification helpers).
- `core-qualification-equivalence` (not favored by the prep record's own analysis, since its existing content
  is pure comparison over already-resolved fields, a materially different kind of component).
- `core-launch-gates` (not favored — it owns only gate aggregation/SQL today).
- A new, narrowly-scoped sibling package, as `PDEF4-PCG4-ED-DEC-001` §13 itself flags as undecided
  ("`@acos/core-research` vs. a new, narrowly-scoped package").

**Coupling implications:** `core-research` placement couples this evaluator's lifecycle and dependencies to the
Research pipeline's own release cadence and reuses `provenance.ts`'s quote-verification helpers directly; a new
sibling package decouples lifecycle but duplicates or re-exports those helpers; `core-qualification-equivalence`
placement would mix an evidence classifier into a package whose existing contract (per `PDEF4-PCG4-ED-DEC-001`
§13) is not expected to change.

**Unresolved:** Whether the new evidence-to-verdict logic belongs inside `core-research` or in a new,
narrowly-scoped sibling package. **This is not auto-selected as `core-research` merely because evaluation runs
during research** — `PDEF4-PCG4-ED-DEC-001` §13 explicitly left this open.

**ANALYST RECOMMENDATION — NOT A DECISION:** `core-research` is the stronger fit by direct precedent — it
already contains the Research-time insertion point (prep record §3.7), the quote/source-verification helpers
(`provenance.ts`) a verified-quote bar (TC-MATCH-3/4) would reuse, and the structurally-analogous
`categoryPlausibility.ts` module — but `PDEF4-PCG4-ED-DEC-001` leaves this genuinely open, and a new sibling
package is not ruled out by any repository fact found in the prep record.

ENGINEERING SELECTION: __________________

---

## 13. Cross-decision dependency map

```
TC-MATCH-1 (authorized evidence source)
   │
   └──> TC-MATCH-2 (evaluation mechanism)
            │  [what evidence is authorized shapes what kind of mechanism can consume it —
            │   document evidence implies a model-assisted or hybrid step; a closed-vocabulary
            │   evidence source would be needed for a purely deterministic mechanism]
            │
            └──> TC-MATCH-3 / TC-MATCH-4 / TC-MATCH-5 (MATCH / NO_MATCH / NOT_YET_OBSERVED semantics)
                     │  [the evaluation mechanism's shape determines what evidentiary bar is even
                     │   checkable for each outcome]
                     │
                     ├──<──> TC-MATCH-4 and TC-MATCH-6 are coupled
                     │        [NO_MATCH's sufficiency bar and contradictory-evidence resolution both
                     │         turn on the same question — whether a negative/conflicting finding
                     │         requires its own affirmative evidence, per D3]
                     │
                     └──> TC-MATCH-6 / TC-MATCH-7 / TC-MATCH-8 / TC-MATCH-9
                              │  [contradiction handling, confidence's role, freshness, and failure
                              │   behavior all refine how TC-MATCH-3/4/5's outcomes are actually reached]
                              │
                              ├──<──> TC-MATCH-7 and TC-MATCH-3/4 are coupled
                              │        [whether confidence gates MATCH/NO_MATCH (TC-MATCH-7) directly
                              │         changes what "sufficient evidence" means for TC-MATCH-3/4]
                              │
                              └──> TC-MATCH-10 / TC-MATCH-11 (determinism/replay; test contract)
                                       │  [TC-MATCH-11's fixtures encode whatever TC-MATCH-3/4/5/6/9
                                       │   decide; TC-MATCH-10 depends on TC-MATCH-2's mechanism shape]
                                       │
                                       └──> TC-MATCH-12 (package ownership)
                                                [ownership is informed by, but not strictly blocked on,
                                                 the preceding items — it can be decided independently,
                                                 but the prep record leaves it open rather than tying it
                                                 to any one upstream decision]
```

No dependency beyond what is shown above is asserted. In particular, TC-MATCH-12 is not forced to wait on
every other item — the prep record's own analysis (§5 TC-MATCH-12) presents it as independently open, informed
by but not strictly gated on the others.

---

## 14. Governance boundary

This is a **questionnaire only**. It does not:

- implement any evaluator, rule, classifier, or model-assisted mechanism;
- create or modify any migration;
- create or modify any schema (including `packages/db/prisma/schema.prisma`);
- write or run any test;
- wire anything into production;
- authorize deployment, release, or launch of any kind.

It does not modify, reopen, amend, or contradict:

- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` (`PDEF4-PCG4-PO-DEC-001`);
- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md` (`PDEF4-PCG4-ED-DEC-001`);
- `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_DECISION_PREPARATION.md` (`PDEF4-PCG4-TCMATCH-MECH-PREP-001`);
- any source, schema, test, or configuration file in this repository.

Every `ENGINEERING SELECTION:` line in §1-§12 above is, and must remain, a literal blank until a future,
separate, explicit engineering-design decision record fills it in. Until that happens, no evaluator exists and
the gap `PDEF4-PCG4-ED-DEC-001` §13 identified remains open exactly as described in
`PDEF4-PCG4-TCMATCH-MECH-PREP-001`.

---

## 15. Provenance statement

This questionnaire was produced by Claude (Anthropic AI assistant) at the explicit request of the human
Product Owner in this session, as a read-only governance artifact derived from
`PDEF4-PCG4-TCMATCH-MECH-PREP-001`. It makes no Product Owner or engineering-design decision and must not be
represented as one.
