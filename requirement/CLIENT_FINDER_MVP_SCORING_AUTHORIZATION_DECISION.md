# Client Finder MVP — Scoring Authorization Decision

**Purpose:** Establish an explicit, auditable product/scope decision for two
currently unauthorized items surfaced by a read-only repository audit, so that
the next implementation or commit step (if any) has a documented basis. This
document does not itself authorize any implementation, and it does not decide
either question on the product owner's behalf.

---

## 1. Decision Status

**Status:**

**DECIDED**

The Product Owner has explicitly supplied both decisions:

- **Decision A: A1 — AUTHORIZE production scoring wiring** (§4)
- **Decision B: D — EXPLICIT FOUR-FACTOR DEFERRAL** (§5)

This section previously read "PRODUCT DECISION REQUIRED" with both decisions
left as placeholders. That state is now superseded by the explicit product
decision recorded below. This document does not implement either decision —
see §10 for what is authorized as a *separate*, not-yet-performed next step.

**Decision owner:**

Product Owner *(no more specific named role for this decision exists anywhere
in the repository's requirement/, docs/, or audit/ directories — "Product
Owner" is the term `MVP_SCOPE_BOUNDARY.md` and the PRD use throughout, e.g.
`MVP_SCOPE_BOUNDARY.md` §9: "The product owner must decide"; §8's "Document
control" note similarly assumes a single accountable decision-maker.)*

**Date:**

Decision framework prepared: 2026-09-24. Decision recorded: 2026-09-24.

---

## 2. Background

The Client Finder MVP scoring engine (`packages/core-acquisition/src/prospectScore.ts`)
implements seven weighted factors (R-14) and is unchanged. Two things around it
are currently unresolved:

1. **Production scoring wiring.** The working tree (uncommitted, on top of HEAD
   `7f6cfa5`) adds a call to `scoreOpportunityForOwner()` inside the Search
   worker's canonical pipeline (`apps/worker/src/searchWorker/worker.ts`,
   `apps/worker/src/index.ts`, `packages/core-opportunity/src/service.ts`,
   `packages/core-opportunity/src/index.ts`, and
   `apps/worker/src/searchWorker/worker.test.ts`), so that every Opportunity
   is scored and the score persisted immediately after Opportunity resolution.
   A prior read-only audit of this repository found that the document defining
   the worker pipeline's authorized scope
   (`requirement/PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md`) places scoring **"Out
   of R-34's authorized pipeline"** and that no later authoritative document
   revises that. A code comment in `worker.ts` asserts this wiring was added
   "per an explicit product decision," but no corresponding decision document
   was found anywhere in the repository.

2. **Four neutral scoring factors.** Of the seven scoring factors, four
   (`icpFit`, `abilityToPay`, `urgency`, `contactability`) are currently fed a
   structurally neutral/`UNKNOWN` input by
   `packages/core-opportunity/src/service.ts`'s `neutralScoringInputs()`,
   regardless of what evidence exists for a given business, because the
   repository has not built the data sources those four factors would need
   (ICP matching, ability-to-pay/urgency detection, contact-channel capture).
   The same prior audit found no authoritative document — including the PRD's
   own Conflict Register, which is the repository's designated place for
   recording exactly this kind of disagreement — that authorizes this as an
   accepted MVP-scope decision rather than an unresolved gap.

Both items are, in the repository's own terms (§3 below), **scope questions**:
what may be built/shipped in the *current* release, as distinct from what the
product must eventually do (PRD, Level 1) or what the code currently does
(repository/tests, Levels 4–5). The repository's own governance rule is that a
scope disagreement must be recorded and resolved through the governing scope
document, not silently resolved by the fact that code already does one thing
or the other. This document exists to carry out that recording step.

This document makes no engineering recommendation and does not treat the
existence of the working-tree implementation as evidence of authorization in
either direction.

---

## 3. Authoritative Sources

| Source | Section | Relevant rule |
|---|---|---|
| `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` | R-14 (line 727) | "Score across seven weighted factors" — icpFit 20, visibleProblem 20, abilityToPay 15, urgency 15, serviceFit 15, evidenceQuality 10, contactability 5. `MVP: Yes.` `Status: IMPLEMENTED LOGIC — not integrated.` Does not name any factor as deferrable. |
| Same PRD | Authority hierarchy (lines 40–54) | Five-level hierarchy: (1) PRD — what the product must eventually do; (2) `MVP_SCOPE_BOUNDARY.md` — what may be built now; (3) investigation artifacts — what was decided; (4) repository — evidence of what exists; (5) tests — evidence of what is proven. "For **scope** questions, Level 2 governs." "When two sources disagree, the higher level wins for its own question — and the disagreement is recorded in the Conflict Register rather than silently resolved." |
| Same PRD | Conflict Register (lines 1579–1681, entries C-1…C-8) | "Unresolved conflicts are recorded, not hidden." All eight existing entries reviewed in full; none addresses seven-factor scoring, the four named factors, or worker-pipeline scoring wiring. C-8 ("Session TTL") is the existing precedent for an entry left in `OPEN` / `Decision: Not decided` status. |
| `requirement/MVP_SCOPE_BOUNDARY.md` | §5.4 "Opportunity" (lines 198–212) | Lists "Seven-factor scoring," "Inference discount," "Signal freshness," "Explainable factor scores," "Deterministic ranking" as in-scope MVP capabilities. Does not name any of the seven factors as individually deferrable. |
| Same document | §10 "MVP Exit Criteria" (lines 492–518) | Criterion #12: `- [ ] Seven-factor scoring works`. Immediately below the checklist: "Every line is a behaviour, not a module. 'The scoring package exists' does not satisfy 'seven-factor scoring works' — the score must be produced from persisted evidence for a discovered business and shown to a user." |
| Same document | §12.3 "Conflict handling" (lines 572–577) | "If a conflict exists, flag it rather than silently resolving it. A conflict is resolved by updating the losing document, not by quietly choosing an interpretation in code." |
| `requirement/PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md` | Lines 84–93 | "Scoring, staleness, next-action, feedback, and AI usage metering are existing, separately integrated downstream capabilities — not steps R-34 is required to chain automatically... there is no repository evidence, PRD text, or AC requiring the worker to call them as part of claiming/executing a Search." |
| Same document | Line 241 (pipeline dependency graph) | Opportunity → Scoring row: **"Out of R-34's authorized pipeline (see scope section above) — EXISTING, ALREADY-INTEGRATED CAPABILITY, not orchestrated by the worker."** |
| Same document | Lines 511–521 "EXPLICIT NON-AUTHORIZED WORK" | Bars introducing a "new scoring algorithm" as part of Phase 17 — does not separately address wiring the *existing*, unmodified algorithm into the worker. |
| Same document | Lines 654–680 "FINAL SCOPE-LOCK DECISION" | `READY TO IMPLEMENT` is declared for exactly three items (crash recovery, bounded retries, worker scheduling) plus the Search → Discovery → Research → Opportunity chain. Scoring is not among the items authorized here. No Phase 17 closure document exists to supersede this scope lock (unlike Phases 18–24, each of which has one). |

This document does not rewrite, edit, or override any of the above; all are
quoted for reference only.

---

## 4. Decision A — Production Scoring Wiring

**Question:**

May the existing, unmodified `scoreOpportunity()`/`scoreProspect()` algorithm
be wired into the Search worker's pipeline as an automatic step that runs and
persists an `OpportunityScore` after every Opportunity is created or found —
i.e., may the current working-tree change to `apps/worker/src/searchWorker/worker.ts`
(and its supporting changes) be committed as Client Finder MVP scope?

**Decision:**

**A1 — AUTHORIZED.** The Product Owner has explicitly authorized production
scoring as part of the Client Finder MVP Search worker pipeline.

> — Option **A1 (AUTHORIZE) — SELECTED:** Authorize production scoring as part
>   of the Client Finder MVP Search worker pipeline.
>   - Scoring becomes an authorized worker-pipeline step.
>   - It occurs after Opportunity resolution, as currently wired.
>   - It persists `OpportunityScore`, as currently wired.
>   - The scoring algorithm (`prospectScore.ts`) and its weights remain
>     unchanged — this decision authorizes *wiring*, not any algorithm change.
>   - The ranking implementation (`rankProspects`/`rankOpportunities`) remains
>     unchanged.
>   - Four-factor neutrality (§5 below) is a separate decision; authorizing A1
>     does **not** by itself authorize enrichment of the four neutral factors.
>     Criterion #12's status under A1 is resolved jointly with Decision B —
>     see §6.
>
> — Option A2 (do not authorize) — **not selected.**

**Authorized pipeline (as decided):**

```text
Search
  → Discovery
    → Research
      → Opportunity
        → Scoring
          → OpportunityScore persistence
```

**Rationale:**

Per §3, the one document that defines R-34's authorized worker-pipeline scope
(`PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md`) placed scoring outside that pipeline
at the time it was written, and no later document had revised that — which is
precisely why this was an open scope question rather than something the
working tree's own code comment could settle by asserting "an explicit product
decision" (a code comment is Level 4 — evidence of what exists, not a Level
2/3 decision). This document is that missing Level 3 decision. The Product
Owner has now supplied it explicitly, in writing, here — not inferred from the
comment's claim and not inferred from the wiring's mere existence.

**R-34 scope conflict — resolution (Step 6):**

`PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md:241` classified Opportunity scoring as
"Out of R-34's authorized pipeline... EXISTING, ALREADY-INTEGRATED CAPABILITY,
not orchestrated by the worker." **Decision A1 supersedes that exclusion, but
only for the specific, narrow purpose recorded here:**

> Existing scoring capability (`scoreOpportunity`/`scoreProspect`, unmodified)
> → authorized production worker invocation (via `scoreOpportunityForOwner`)
> → `OpportunityScore` persistence.

This override does **not** reopen R-34's scope generally. It does not
authorize staleness, next-action, feedback, or AI-usage-metering wiring into
the worker pipeline — `PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md`'s treatment of
those remains unchanged and unaddressed by this document. It does not
authorize any of the categories in that same document's "EXPLICIT NON-
AUTHORIZED WORK" list (lines 511–521): Outreach, Follow-up, Proposal, CRM,
new AI agent architecture, new discovery/research/scoring/offer/staleness/
next-action/feedback algorithms, queue/broker infrastructure, etc. — none of
that is touched by A1.

**Scope authorized:**

- The worker pipeline calling `scoreOpportunityForOwner()` immediately after
  Opportunity creation/lookup, exactly as currently implemented in the working
  tree (`apps/worker/src/searchWorker/worker.ts`).
- Persisting the resulting `OpportunityScore` via the existing
  `OpportunityScoreRepository`, exactly as currently implemented.
- Committing this specific, already-written wiring (see §10 for the fact that
  the commit itself is a separate next step, not performed by this document).

**Scope explicitly NOT authorized (by A1):**

- Any change to the seven-factor scoring algorithm or `FACTOR_WEIGHTS`.
- Any change to the ranking algorithm.
- Enrichment of `icpFit`, `abilityToPay`, `urgency`, or `contactability`
  (governed solely by §5/Decision D below).
- Any staleness, next-action, feedback, or AI-usage-metering wiring into the
  worker pipeline.
- Any other item on `PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md`'s "EXPLICIT
  NON-AUTHORIZED WORK" list.

---

## 5. Decision B — Four-Factor MVP Treatment

**Question:**

Must `icpFit`, `abilityToPay`, `urgency`, and `contactability` have
meaningful, evidence-backed inputs before Client Finder MVP Exit, or may they
remain structurally neutral/`UNKNOWN` while the seven-factor algorithm and its
existing weights are retained as-is?

**Decision:**

**D — EXPLICIT FOUR-FACTOR DEFERRAL.** The Product Owner has explicitly
authorized MVP Exit with `icpFit`, `abilityToPay`, `urgency`, and
`contactability` each remaining `UNKNOWN`/neutral, while retaining the
existing seven-factor algorithm and weights unchanged.

> — Option C (full seven-factor MVP) — **not selected.**
>
> — Option **D (EXPLICIT FOUR-FACTOR DEFERRAL) — SELECTED:**
>   - `icpFit`, `abilityToPay`, `urgency`, and `contactability` are explicitly
>     deferred from MVP evidence requirements.
>   - Their neutral (zero-weighted-point) contribution to every score is
>     explicitly intentional, not a defect, for the duration of the MVP.
>   - Future enrichment of any of the four factors requires its own, separate
>     scope decision — this decision does not pre-authorize that work.
>   - Criterion #12 is considered **SATISFIED** under this decision, jointly
>     with Decision A1 — see §6 for the explicit reasoning.

**Rationale:**

Per §3, neither `MVP_SCOPE_BOUNDARY.md` §5.4/§10 nor PRD R-14/AC-16
previously authorized a four-factor subset to remain neutral, and no entry in
the PRD's own Conflict Register addressed it — which is exactly why this was
an open scope question rather than something the existing
`neutralScoringInputs()` implementation could settle by existing.
`neutralScoringInputs()`'s own docstring describes *why* the current code is
built this way (no ICP-matching/ability-to-pay/urgency-detection/contact-
capture systems exist yet to feed it) — that is engineering rationale for the
implementation, not, by itself, a product-scope decision. The Product Owner
has now supplied that decision explicitly, adopting the engineering rationale
as the accepted MVP-scope position: these four factors are deferred by
product choice, not merely left incomplete by omission.

**Deferred for MVP (Option D, as decided):**

- icpFit: deferred — remains `{ value: null, basis: 'UNKNOWN' }` per `neutralScoringInputs()`
- abilityToPay: deferred — remains `{ value: null, basis: 'UNKNOWN' }` per `neutralScoringInputs()`
- urgency: deferred — remains `{ value: null, basis: 'UNKNOWN' }` per `neutralScoringInputs()`
- contactability: deferred — remains hardcoded `hasEmail/hasLinkedIn/hasPhone: false` per `neutralScoringInputs()`

None of the four is described as "implemented" for MVP purposes — each is
explicitly **deferred**, with its current neutral/`UNKNOWN` behavior treated as
the intended MVP-final state, not an in-progress gap.

**Explicit MVP treatment:**

For Client Finder MVP Exit: the seven-factor scoring framework runs in
production (per Decision A1), using real persisted evidence for
`visibleProblem`, `serviceFit`, and `evidenceQuality`, and the scorer's own
first-class `UNKNOWN` representation for `icpFit`, `abilityToPay`, `urgency`,
and `contactability`. No provider, scraper, LLM call, or new data source is
authorized by Decision D for any of the four deferred factors — enrichment
remains a distinct, future, separately-authorized scope (see §8).

---

## 6. MVP Exit Criterion #12

**Current wording** (`MVP_SCOPE_BOUNDARY.md` §10):

> `- [ ] Seven-factor scoring works`
>
> "Every line is a behaviour, not a module. 'The scoring package exists' does
> not satisfy 'seven-factor scoring works' — the score must be produced from
> persisted evidence for a discovered business and shown to a user."

**Decision interpretation:**

Decided, under Decision A1 + Decision D: Criterion #12 ("Seven-factor scoring
works") is considered **SATISFIED**. The seven-factor algorithm runs in the
production MVP pipeline (Decision A1), the resulting `OpportunityScore` is
persisted, `visibleProblem`/`serviceFit`/`evidenceQuality` continue to draw on
whatever persisted evidence a given Opportunity actually has, and
`icpFit`/`abilityToPay`/`urgency`/`contactability` are permitted to report
`UNKNOWN` by explicit product decision (Decision D) rather than by omission.
The Product Owner's selection of Option D is recorded as an explicit adoption
of Reading 2 below, for the purpose of this decision — this document does not
retroactively claim the source text itself is unambiguous; see "Why" below,
unchanged, for the textual analysis that remains true independent of this
decision.

No amendment to `MVP_SCOPE_BOUNDARY.md` §10's Criterion #12 wording has been
made or is treated as required for this decision to be authoritative — the
decision is recorded here as a Level 3 investigation/decision artifact per the
PRD's own authority hierarchy (§3). If a maintainer separately judges that
Criterion #12's wording should be amended for clarity so a future reader does
not have to consult this document to know it is satisfied, that is flagged
here as a possible documentation follow-up, not performed by this document.

**Does Criterion #12's wording, read on its own, require all four factors to be evidence-backed?**

**NOT CLEARLY RESOLVED BY THE TEXT ITSELF** — independent of the decision just
recorded above, the source wording alone does not settle this. The following
two readings were both textually available, and the Product Owner's selection
of Decision D is what resolves the question for MVP purposes, not the text by
itself:

- *Reading 1:* "the score must be produced from persisted evidence" applies
  distributively — each of the seven factors composing the score must
  individually rest on persisted evidence.
- *Reading 2:* the clause constrains the scoring *operation* (real, persisted
  evidence as the input, as opposed to a fixture/test double) rather than
  requiring every individual factor to be non-`UNKNOWN`. This reading is
  supported by AC-16 (PRD V2.2:1750), which requires only that each factor's
  "weight, raw value, points, basis and reason" be *retrievable* — a
  requirement `UNKNOWN` already satisfies as a first-class `ClaimBasis` value
  — and by the PRD's independent treatment of `UNKNOWN` survival as itself a
  correct-behavior requirement elsewhere (PFR-05).

**Why:**

Both readings survive a close text review; the phrase does not unambiguously
select one. Decision B (§5) was exactly for resolving this, and the Product
Owner's selection of Option D is recorded as adopting Reading 2 for MVP
purposes: `UNKNOWN` is retrievable as a first-class `basis` value (AC-16,
PFR-05), so a factor correctly reporting `UNKNOWN` satisfies "produced from
persisted evidence" under Reading 2. This is a decision applied going forward,
not a claim that the PRD/Scope Boundary text itself always meant Reading 2 —
had Option C been selected instead, Reading 1's practical consequence (all
seven factors evidenced) would have applied without the textual question
itself needing to be settled either.

---

## 7. Resulting Authorized Scope

Per Decision A1 (§4) and Decision D (§5), the following is now authorized as
Client Finder MVP scope:

- **Production scoring wiring** — the existing, already-implemented working-
  tree change (`apps/worker/src/searchWorker/worker.ts`,
  `apps/worker/src/index.ts`, `packages/core-opportunity/src/service.ts`,
  `packages/core-opportunity/src/index.ts`,
  `apps/worker/src/searchWorker/worker.test.ts`) calling
  `scoreOpportunityForOwner()` after Opportunity resolution and persisting
  `OpportunityScore` — is authorized to be **committed**, as-is, with no
  further code change required by this decision.
- **Four-factor deferral** — `icpFit`, `abilityToPay`, `urgency`, and
  `contactability` remaining `UNKNOWN`/neutral is authorized as the accepted
  MVP-Exit state; `neutralScoringInputs()`'s current behavior requires no
  change for MVP purposes.
- **Criterion #12** is authorized to be treated as SATISFIED once the wiring
  above is committed and proven to execute end-to-end (see §10).

This document authorizes the *decision* and the specific wiring already
written. It does not itself perform the commit — see §10.

---

## 8. Resulting Non-Authorized Scope

The following remain explicitly **NOT AUTHORIZED** by Decision A1 + Decision D:

- Any enrichment work for `icpFit`, `abilityToPay`, `urgency`, or
  `contactability` (new data sources, providers, scrapers, or LLM calls of any
  kind) — explicitly excluded by Decision D (§5).
- Any amendment to `MVP_SCOPE_BOUNDARY.md` §10's Criterion #12 wording (none
  was made or judged required — §6).
- Any change to the seven-factor algorithm, its weights, or the ranking
  algorithm — explicitly excluded by Decision A1 (§4).
- Any staleness, next-action, feedback, or AI-usage-metering wiring into the
  worker pipeline — not addressed or authorized by Decision A1.
- Any item on `PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md`'s "EXPLICIT NON-
  AUTHORIZED WORK" list (Outreach, Follow-up, Proposal, CRM, new algorithms of
  any kind, queue/broker infrastructure, etc.) — unaffected by this document.
- Performing the commit of the production scoring wiring, running its targeted
  tests, or any other implementation step — authorized in principle (§7) but
  **not performed by this task**; see §10.

---

## 9. Conflict Register Entry

**Determination:** Yes — both items in §4 and §5 constitute formal scope
conflicts under the repository's own governance rule (PRD V2.2 lines 40–42;
`MVP_SCOPE_BOUNDARY.md` §12.3), because each pits an existing, unresolved gap
between what the repository's code currently does (Level 4 — evidence) and
what the governing scope document (Level 2) actually authorizes, with no
Level 2/3 source resolving either.

**Numbering-convention note:** The repository maintains **two independently
numbered** "C-" conflict lists, not one: the PRD's own "CONFLICT REGISTER"
(`AI Client Acquisition OS — Product Requirements Document V2.2.md`, entries
C-1…C-8) and `MVP_SCOPE_BOUNDARY.md`'s separate §12.4 "Open conflicts" table
(also C-1…C-5, unrelated content). This document follows the **PRD's**
Conflict Register convention and format, per this task's explicit instruction
to cite and (conditionally) update "the PRD Conflict Register" specifically.
The two entries below are formatted to match the PRD's existing C-1…C-8
entries (Conflict / Verified facts / Impact / Decision / Status), and follow
**C-1's** existing precedent for a **resolved** entry (`Decision:` naming the
resolution, `Status: RESOLVED`) rather than C-8's precedent for an open one,
since both conflicts recorded here are now resolved by Decision A1 + Decision
D.

**Decision update:** Both conflicts below are now marked **RESOLVED**,
referencing this decision document. The minimal required change — adding
these two entries to the live PRD's Conflict Register, in the same position
and format the PRD already uses (immediately after existing entry C-8) — has
been applied; see §11 for confirmation that no other content in that file was
touched (C-1 through C-8 and every other section are unmodified).

**Entry — Conflict C-9 (RESOLVED)**

| | |
|---|---|
| **Conflict** | `PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md` placed Opportunity scoring "Out of R-34's authorized pipeline"; the working tree wires `scoreOpportunityForOwner()` into that same pipeline |
| **Verified facts** | `PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md:241`, `:84-93`, `:654-680`; working-tree diff of `apps/worker/src/searchWorker/worker.ts` et al. (uncommitted, on top of `7f6cfa5`) |
| **Impact** | The MVP could not be said to have committed, authorized production scoring until this was resolved; leaving it uncommitted indefinitely would block Criterion #12 and any E2E proof depending on a persisted score |
| **Decision** | Product Owner selected A1 (AUTHORIZE) — see `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` §4. R-34's exclusion is superseded, narrowly, for existing-scoring-capability → worker invocation → `OpportunityScore` persistence only; R-34's other exclusions are unaffected |
| **Status** | **RESOLVED** in `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` |

**Entry — Conflict C-10 (RESOLVED)**

| | |
|---|---|
| **Conflict** | R-14 (seven-factor scoring) is a single, undifferentiated MVP requirement; the implementation structurally neutralizes four of the seven factors (`icpFit`, `abilityToPay`, `urgency`, `contactability`) with no prior authoritative document permitting this subset to remain neutral for MVP Exit |
| **Verified facts** | `packages/core-opportunity/src/service.ts:196-219` (`neutralScoringInputs()`); PRD V2.2 R-14, AC-16; `MVP_SCOPE_BOUNDARY.md` §5.4, §10; full review of PRD Conflict Register C-1…C-8 (none applicable) |
| **Impact** | Criterion #12 ("Seven-factor scoring works") could not be marked complete or explicitly deferred until this was resolved; 55 of 100 scoring-weight points remain always zero-contribution for every Opportunity, by design, under this resolution |
| **Decision** | Product Owner selected D (EXPLICIT FOUR-FACTOR DEFERRAL) — see `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` §5. icpFit/abilityToPay/urgency/contactability are deferred from MVP evidence requirements; Criterion #12 is treated as satisfied jointly with C-9's resolution |
| **Status** | **RESOLVED** in `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` |

---

## 10. Next Authorized Implementation Scope

**PRODUCTION SCORING WIRING — COMMIT + VERIFICATION ONLY**

This means, specifically and only:

- Commit the already-implemented scoring wiring exactly as it exists in the
  working tree (`apps/worker/src/searchWorker/worker.ts`,
  `apps/worker/src/index.ts`, `packages/core-opportunity/src/service.ts`,
  `packages/core-opportunity/src/index.ts`,
  `apps/worker/src/searchWorker/worker.test.ts`).
- Run/verify its targeted tests.
- Preserve the existing scoring algorithm and weights unchanged.
- Preserve the four neutral factors (`icpFit`, `abilityToPay`, `urgency`,
  `contactability`) unchanged, per Decision D.
- No enrichment, no provider work, no scraper work, no LLM work, no ranking
  redesign — none of that is authorized by this decision.

**This task does not perform that implementation.** No commit, stage, or code
change has been made as part of recording this decision — see §11. That is
deliberately left as a separate, subsequent task.

---

## 11. Safety / Audit Record

**Files modified:**

- `requirement/CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` (this file — created, then updated to record the decision)
- `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` (minimal, additive edit: two new Conflict Register entries, C-9 and C-10, inserted after existing entry C-8; no other content in that file was changed — C-1 through C-8 and every other section are untouched)

**Production files modified:**

NONE

**Tests modified:**

NONE

**Schema:**

NONE

**Migration:**

NONE

**Provider:**

NONE

**Scraper:**

NONE

**LLM:**

NONE

**API calls:**

0

**Commit:**

NONE

**Push:**

NONE
