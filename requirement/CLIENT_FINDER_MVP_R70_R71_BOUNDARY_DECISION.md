# Client Finder MVP — R-70/R-71 Boundary Decision

**Purpose:** Establish an explicit, auditable product/scope decision for a
boundary question surfaced by a read-only MVP exit audit: whether R-70
(source-to-business attribution) and R-71 (topic-vs-problem relevance) must
also apply to the seven-factor scoring path and to Qualification's
EVIDENCE_PRESENT criterion, or whether their current scope — need/offer
detection only — is the accepted MVP-final state. This document does not
itself authorize any implementation, and it does not decide the question on
the Product Owner's behalf.

---

## 1. Decision Status

**Status:**

**DECIDED**

The Product Owner has explicitly selected:

**Decision — OPTION A: KEEP CURRENT BOUNDARY.** R-70/R-71 remain scoped to
Need Detection / Opportunity Creation (`toOfferSignals()`) only. They are not
required to be reapplied inside `toScoringSignals()` or Qualification's
`evaluateEvidencePresent()`.

This section previously read "PRODUCT DECISION REQUIRED" with the decision
field left `UNDECIDED`. That state is now superseded by the explicit product
decision recorded below (§8). No implementation, test, scoring,
qualification, or R-70/R-71 code change is made by this document — this is a
scope-acceptance and documentation decision only.

**Decision owner:**

Product Owner (same convention as
`CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` §1 — "Product Owner" is
the term `MVP_SCOPE_BOUNDARY.md` and the PRD use throughout).

**Date:**

Decision framework prepared: 2026-09-24. Decision recorded: 2026-09-24.

**Basis:**

A read-only FINAL 19-CRITERION MVP EXIT AUDIT performed against HEAD
`37c2e92` plus the uncommitted `tests/integration/client-finder-web.integration.test.ts`
change (Criterion #18 closure), which surfaced this boundary question while
verifying that the newly-authorized production scoring path
(`CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`, Decision A1) does not
bypass R-70/R-71 or Scenario E.

---

## 2. Background

### 2.1 Existing implementation

Three independent consumers read a Prospect's persisted `ResearchSignal` rows
and each applies its own, different filtering:

| Consumer | File | Filters applied |
|---|---|---|
| `toOfferSignals()` | `packages/core-opportunity/src/adapters.ts:175-199` | Excludes `UNKNOWN`/null signals; excludes signals from `TOPICAL_FIELDS` (R-71); excludes all signals for a Prospect when `hasConflictingSource()` detects a self-identified different business (R-70) |
| `toScoringSignals()` | `packages/core-research/src/scoringAdapter.ts:34-59` | Excludes `UNKNOWN`/null signals only. Applies the inference discount to `INFERRED` confidence. **Does not check `TOPICAL_FIELDS` or `hasConflictingSource()`.** |
| `evaluateEvidencePresent()` | `packages/core-qualification/src/rules.ts:67-80` | Excludes superseded signals and anything not `classification === 'OBSERVED'` (Scenario E, Option C). **Does not check `TOPICAL_FIELDS` or `hasConflictingSource()`.** |

`toOfferSignals()` feeds `createOpportunityForOwner()` (Need Detection /
Opportunity Creation, R-11/R-13). `toScoringSignals()` feeds
`scoreOpportunityForOwner()` (seven-factor scoring, R-14) — now wired into
the production worker pipeline per Decision A1. `evaluateEvidencePresent()`
feeds `evaluateQualificationForOwner()` (Scenario E's EVIDENCE_PRESENT
criterion), and is called with the Prospect's full, unfiltered stored-signal
list (`deps.signals.listByProspect(...)` in
`packages/core-qualification/src/service.ts:68`) — not with
`toOfferSignals()`'s filtered output.

### 2.2 Existing authorization

R-70 and R-71 were proposed together in
`requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md`. That document's own text:

- Scopes R-70's behavioral requirement explicitly to "eligib[ility] to
  support Need Detection (R-11) or Opportunity Creation (R-13)" (lines
  118-121) — it does not name scoring (R-14) or Qualification anywhere in
  R-70's requirement text.
- Scopes R-71's purpose explicitly to "a detected 'need'" and "R-11's
  existing word 'genuine'" (lines 154-155) — likewise does not name scoring
  or Qualification.
- States directly: **"R-14 (Seven-Factor Scoring) is explicitly excluded
  from this document's scope"** (line 99), noting the scoring-wiring gap
  only "for completeness," without re-proposing anything about it.

`requirement/PHASE_24_R70_R71_DECISION.md` (the implementation
decision/scope-lock for R-70/R-71) does not mention Qualification or
EVIDENCE_PRESENT anywhere in its text (confirmed by repository search) except
in the unrelated context of "reach QUALIFIED" while discussing Scenario E —
and its own §9 states plainly, of the *pre-Scenario-E* state: *"This is
current, incidental behavior — a consequence of R-70/R-71 being applied
identically regardless of classification — not a settled product rule."*
That sentence is about classification (OBSERVED vs. INFERRED), not about
whether R-70/R-71's exclusion itself reaches Qualification's evidence check
— the sentence's own premise (that R-70/R-71 filtering was "applied" to what
became `needDetected`) does not extend to `evaluateEvidencePresent()`, which
was introduced separately and reads the unfiltered signal list.

`CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` (Decision A1)
authorizes wiring the existing, unmodified `scoreOpportunityForOwner()` into
the worker pipeline. It does not address, and its own text does not claim to
address, whether the *evidence* that function scores has R-70/R-71 applied to
it — Decision A1 authorizes wiring, not any change to what
`toScoringSignals()` filters.

### 2.3 Newly discovered boundary question

No document reviewed for this decision (`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md`,
`PHASE_24_R70_R71_DECISION.md`, `PHASE_24_SCENARIO_E_DECISION_CONTRACT.md`,
`PHASE_24_SCENARIO_E_PRODUCT_DECISION.md`,
`PHASE_24_SCENARIO_E_OPTION_C_SCOPE_LOCK.md`,
`CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`) states outright
whether R-70/R-71 are intended *only* for need/offer detection or *must*
extend to every downstream evidence consumer. R-70/R-71's own originating
requirement text (§2.2 above) is scoped, by its own words, to Need
Detection/Opportunity Creation, and explicitly declines to address scoring —
but "explicitly excluded from this document's scope" is not the same
statement as "explicitly authorized to remain unfiltered forever." The
question was never asked of Qualification's EVIDENCE_PRESENT at all, because
that criterion did not exist yet when R-70/R-71 were proposed.

**This document does not resolve the ambiguity. It records it.**

---

## 3. Data Flow — As Implemented

```text
ResearchSignal (persisted, per Prospect)
    |
    v
stored signal set (deps.signals.listByProspect / .listByProspect equivalents)
    |
    +-- toOfferSignals()                              [adapters.ts]
    |       |
    |       +-- excludes UNKNOWN/null
    |       +-- excludes TOPICAL_FIELDS                (R-71)
    |       +-- excludes ALL signals if hasConflictingSource()  (R-70)
    |       v
    |   Need Detection / Opportunity Creation (R-11/R-13)
    |
    +-- toScoringSignals()                             [scoringAdapter.ts]
    |       |
    |       +-- excludes UNKNOWN/null
    |       +-- applies INFERENCE_DISCOUNT to INFERRED confidence
    |       +-- (no TOPICAL_FIELDS check)
    |       +-- (no hasConflictingSource() check)
    |       v
    |   scoreOpportunityForOwner() -> seven-factor score (R-14)
    |       -> visibleProblem, evidenceQuality, serviceFit(*) factors
    |          (*serviceFit is separately derived from the Opportunity's
    |           already-detected offer, so it inherits R-70/R-71
    |           indirectly through Need Detection; visibleProblem and
    |           evidenceQuality do not)
    |
    +-- evaluateEvidencePresent()                      [rules.ts]
            |
            +-- excludes superseded signals
            +-- excludes anything not classification === 'OBSERVED'
            +-- (no TOPICAL_FIELDS check)
            +-- (no hasConflictingSource() check)
            v
        Qualification EVIDENCE_PRESENT criterion (Scenario E, Option C)
```

**Where the three branches diverge:** all three start from the same
persisted signal set. Only `toOfferSignals()` applies R-70/R-71. The other
two branches share only the `UNKNOWN`/null exclusion with `toOfferSignals()`
— none of the three re-checks another's classification-basis or
source-conflict logic.

---

## 4. Option A — Keep Current Boundary — SELECTED

R-70/R-71 remain limited to `toOfferSignals()` — i.e., to Need Detection and
Opportunity Creation only. Scoring (`toScoringSignals()`) and Qualification
(`evaluateEvidencePresent()`) continue consuming their current, differently
filtered signal sets, unchanged.

**This is the Product Owner's selected option (§8).** The consequences below
were stated, unchanged, before the decision was made (§9 of the prior version
of this document), and are restated here as the now-accepted MVP boundary.

**Concrete consequences:**

- No production implementation change.
- No change to `scoreOpportunityForOwner()`, `toScoringSignals()`,
  `prospectScore.ts`, or `FACTOR_WEIGHTS`.
- No change to `evaluateEvidencePresent()` or any other Qualification rule.
- No change to R-70/R-71's own implementation, tests, or semantics.
- The MVP can treat this as accepted scope if the Product Owner explicitly
  says so.
- Under this option, MVP Exit Criterion #19 ("no critical MVP blockers
  remain") can be considered satisfied with respect to this specific
  question, by explicit Product Owner acceptance of the boundary as-is —
  the same pattern `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`
  used for Criterion #12.

This option is not stated here as correct or incorrect.

---

## 5. Option B — Extend R-70/R-71 — NOT SELECTED

Apply the same exclusions `toOfferSignals()` already applies —
`hasConflictingSource()` (R-70) and `TOPICAL_FIELDS` (R-71) — to:

1. The signal set `toScoringSignals()` supplies to
   `scoreOpportunityForOwner()`.
2. The signal set `evaluateEvidencePresent()` checks for Qualification's
   EVIDENCE_PRESENT criterion.

**Concrete consequences:**

- Production code change required in `packages/core-research/src/scoringAdapter.ts`
  and/or `packages/core-qualification/src/rules.ts` (or in a shared upstream
  filtering step both would call).
- New or modified tests required for both files, and for anything asserting
  the current (soon-to-change) behavior — e.g. `packages/core-qualification/src/evaluator.test.ts`'s
  existing OBSERVED-confidence fixtures would need review for whether any of
  them implicitly relies on a signal `toOfferSignals()` would exclude.
- Possible behavior change in scoring: a `visibleProblem`/`evidenceQuality`
  contribution that currently counts a topical-only or conflicting-source
  signal would stop counting it, which could lower some existing
  Opportunities' scores.
- Possible behavior change in Qualification: an Opportunity currently
  QUALIFIED on the strength of a topical-only or conflicting-source OBSERVED
  signal could become INSUFFICIENT_EVIDENCE.
- Additional verification required end-to-end (worker/integration tests)
  beyond the two files directly changed.
- MVP exit remains blocked, with respect to this specific question, until
  the change is implemented and verified.

This option is not recommended here.

---

## 6. Risk / Impact Matrix

| Dimension | Option A — Keep Current Boundary | Option B — Extend R-70/R-71 |
|---|---|---|
| Production changes | None | `scoringAdapter.ts` and/or `rules.ts` (or a shared upstream filter) |
| Scoring behavior | Unchanged | `visibleProblem`/`evidenceQuality` inputs shrink for any Prospect with a topical-only or conflicting-source signal; some scores could decrease |
| Qualification behavior | Unchanged | Some currently-QUALIFIED Opportunities could become INSUFFICIENT_EVIDENCE if their only OBSERVED signal was topical-only or conflicting-source |
| MVP timeline | No delay | Delayed by implementation + test + verification cycle |
| Existing tests | All current R-70/R-71/scoring/qualification tests remain valid as-is | `adapters.test.ts`'s R-70/R-71 suite stays valid; `scoringAdapter.ts` and `evaluator.test.ts` gain new required coverage; any fixture relying on current unfiltered behavior needs review |
| R-70/R-71 semantics | Unchanged: scoped to Need Detection/Opportunity Creation, matching their originating requirement text (`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` lines 118-121, 154-155) | Broadened beyond their originating requirement text's stated scope — a scope expansion of R-70/R-71 themselves |
| Evidence consistency | A signal excluded from justifying a need can still count toward that same Opportunity's score and toward Qualification's evidence check | A signal excluded from justifying a need is excluded everywhere that Opportunity's evidence is evaluated |
| New implementation scope | None | Two functions (at minimum) plus their call sites; scope boundary of the change itself would need its own scope-lock per `MVP_SCOPE_BOUNDARY.md` §8 |

Only repository-supported facts are stated above; no recommendation is made.

---

## 7. Accepted MVP Boundary

**Newly made Product Owner decision** (distinct from the documented
historical scope in §2.2 and the observed implementation behavior in §2.1 and
§3): the Product Owner has explicitly accepted the boundary already present
in the implementation as the intended MVP-final state, rather than an
unresolved gap.

```text
Research signals
    |
    v
toOfferSignals()
    |
    v
Need Detection / Opportunity Creation
```

R-70 (source-to-business attribution) and R-71 (topic-vs-problem relevance)
apply at this point only. They are explicitly **not** extended to:

```text
toScoringSignals()
```

or:

```text
Qualification evaluateEvidencePresent()
```

To be precise about what is and is not being claimed: neither
`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` nor
`PHASE_24_R70_R71_DECISION.md` ever explicitly decided that R-70/R-71 must
stop at `toOfferSignals()` — they simply never addressed scoring or
Qualification's `evaluateEvidencePresent()` at all (§2.2, §2.3). This
document does not retroactively claim they did. What changes here is that the
Product Owner has now explicitly decided, going forward, that the boundary
those documents left unaddressed is acceptable as-is: **the absence of
R-70/R-71 filtering in `toScoringSignals()` and Qualification's
`evaluateEvidencePresent()` is an accepted MVP boundary, not an
implementation defect.**

---

## 8. Explicit Non-Goals

Selecting Option A does **not** authorize, and this document performs none
of, the following:

- Changes to `toScoringSignals()`.
- Changes to the seven-factor scoring algorithm (`prospectScore.ts`) or any
  other scoring algorithm.
- Changes to `FACTOR_WEIGHTS`.
- Changes to `scoreOpportunityForOwner()`.
- Changes to `OpportunityScore` persistence.
- Changes to Qualification rules (`packages/core-qualification/src/rules.ts`,
  `evaluator.ts`).
- Changes to `evaluateEvidencePresent()`.
- Changes to the R-70/R-71 implementation (`adapters.ts`'s
  `hasConflictingSource`/`conflictsWithBusiness`/`selfIdentifiedBusiness`/
  `TOPICAL_FIELDS`) itself.
- New providers, new evidence sources, or enrichment work of any kind.
- Ranking changes.
- Outreach work, follow-up work, or CRM work.
- Reopening Decision A1 (production scoring authorization).
- Reopening Decision D (four-factor deferral).
- Reopening Conflict C-9 or Conflict C-10.

This is a scope-acceptance decision only. Every item above remains exactly as
it was at HEAD `37c2e92`.

---

## 9. Criterion #19 Closure

**Before this decision:** `MVP_SCOPE_BOUNDARY.md` §10's Criterion #19 ("No
critical MVP blockers remain") was **PARTIAL**, pending resolution of the
R-70/R-71 boundary question this document records.

**After this decision:** Criterion #19 is **PASS**.

**Rationale:** R-70/R-71 are explicitly accepted as scoped to Need Detection
/ Opportunity Creation only. The Product Owner has selected Option A. Their
absence from `toScoringSignals()` and Qualification `evaluateEvidencePresent()`
is therefore an accepted MVP boundary and does not constitute a Criterion #19
failure. No production implementation change is required.

No change is made to the underlying scoring or qualification behavior by
this closure — the criterion is satisfied by explicit scope acceptance, not
by any code change.

---

## 10. MVP Exit Impact / Conclusion

The FINAL 19-CRITERION MVP EXIT AUDIT (prepared 2026-09-24, against HEAD
`37c2e92` plus the Criterion #18 test change) found Criteria #1-#18 PASS and
Criterion #19 PARTIAL, pending this decision. That audit explicitly did not
determine this boundary rises to the level of a "critical" blocker — only
that it was a real, previously undocumented inconsistency worth a Product
Owner decision, consistent with `MVP_SCOPE_BOUNDARY.md` §12.3's rule to flag
rather than silently resolve a conflict.

With Option A now selected:

```text
Criteria #1-#18: PASS
Criterion #19:   PASS

MVP EXIT CRITERIA: SATISFIED
```

**Scope of this conclusion:** this decision settles the R-70/R-71 boundary
question for the **current MVP scope only**. It does not claim that every
future use case of R-70/R-71 is permanently settled. Any future expansion of
R-70/R-71 into scoring or Qualification — for example, if a later phase's
evidence requirements change, or if this boundary is found to produce a
user-visible quality problem — would require its own, separate product
decision and appropriately scoped implementation work, exactly as Decision D
(§5 of `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`) already
establishes as the pattern for deferred-but-revisitable scope in this
repository.

---

## 11. Product Owner Decision

**DECIDED**

- [x] Option A — Keep Current Boundary
- [ ] Option B — Extend R-70/R-71

---

## 12. Safety / Audit Record

**Files created:**

- `requirement/CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md` (created in
  the prior, preparation pass of this task — Status: PRODUCT DECISION
  REQUIRED, Decision: UNDECIDED)

**Files modified (this pass):**

- `requirement/CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md` (this file —
  updated to record the Product Owner's explicit Option A decision, close
  Criterion #19 as PASS, and state the MVP exit conclusion; no other file
  changed)

**Production files modified:** NONE
**Tests modified:** NONE
**Scoring modified:** NONE
**Qualification modified:** NONE
**R-70/R-71 implementation modified:** NONE
**PRD modified:** NONE — `AI Client Acquisition OS — Product Requirements
Document V2.2.md` is left untouched by this decision, per this task's
instruction not to add a Conflict Register entry at this time
**A1 / Decision D documents modified:** NONE —
`CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` is unchanged; A1, D,
C-9, and C-10 remain resolved exactly as previously established
**Schema:** NONE
**Migration:** NONE
**Provider:** NONE
**Scraper:** NONE
**LLM:** NONE
**API calls:** 0
**Staged:** NONE
**Commit:** NONE
**Push:** NONE
