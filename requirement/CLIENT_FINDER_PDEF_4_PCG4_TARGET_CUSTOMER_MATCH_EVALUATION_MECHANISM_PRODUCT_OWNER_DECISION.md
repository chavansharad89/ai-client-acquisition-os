# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Evaluation Mechanism Product Owner Decision

**Record ID:** `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`
**Date:** 2026-10-05
**STATUS: DECIDED — DELEGATED PRODUCT OWNER AUTHORITY (POLICY/DESIGN DECISIONS ONLY)**

---

## 1. Governing inputs (file + SHA-256, via `shasum -a 256`)

| File | SHA-256 |
|---|---|
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_DECISION_PREPARATION.md` | `b206aeba6896fd59638552251e366d12bca0bbd2e07b6b6620f490c756b4058a` |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md` (`PDEF4-PCG4-ED-DEC-001`) | `1f16a37323f9a77850023207e31f5e6db51c07ddae00d6cf498c768a614d263f` |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_DECISION_PREPARATION.md` (`PDEF4-PCG4-TCMATCH-MECH-PREP-001`) | `ebaec5093dc9d3647da6311dadd535bcc24e4037a83a0744f425512d323b74e2` |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_DECISION_QUESTIONNAIRE.md` (`PDEF4-PCG4-TCMATCH-MECH-QUESTIONNAIRE-001`) | `12f94822e6770344d241a45cd5e9f18335beec32cb7ca7b2a6dd6e0916a443d6` |
| `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` (`PDEF4-PCG4-PO-DEC-001`) | `84db9339765c209cc4ed8ad9319400dd3f1e359c6f62e02afd9aecca56a6484d` |

Baseline: `git rev-parse HEAD` → `af9ede93830f5e3e611195dc2451a470364def74` (verified before this record was
written, matches required baseline). `git status --short` showed 77 pre-existing entries before this record was
created, 0 staged. No source, schema, test, or config file was read with intent to modify, and none was modified.

---

## 2. Delegated-authority provenance

Product Owner decision authority for this one task was explicitly delegated by the human user to Claude (an AI
assistant acting under the user's explicit, session-scoped authorization) for the sole purpose of resolving
TC-MATCH-1 through TC-MATCH-12 of `PDEF4-PCG4-TCMATCH-MECH-QUESTIONNAIRE-001`. Every decision in §3 below was made
by Claude under that delegation. **No human Product Owner made or reviewed these specific selections before this
record was written.** This record must not be represented, cited, or relied upon as a decision made directly by a
human Product Owner — it is an AI-made decision, exercised under explicit human delegation, and is recorded as
such for audit purposes. This mirrors the provenance convention already established by `PDEF4-PCG4-ED-DEC-001` §15
for the antecedent engineering-design decision.

---

## 3. Decisions TC-MATCH-1 through TC-MATCH-12

### TC-MATCH-1 — Authorized evidence source

**Selected:** Document evidence already supplied to the research provider at Research-time (the same source
documents the per-Prospect research call already has in hand at the pipeline position fixed by
`PDEF4-PCG4-ED-DEC-001` §4/§9), and *only* that evidence — not category-plausibility's computed output, not
Search-membership, not `StoredResearchSignal`/`research_signals`, not `Opportunity.offer_rationale`.

**This is a new delegated PO policy decision, not merely derived from existing records.** No governing record
affirmatively authorized "Research-time source documents" as evidence for this specific criterion; the prep
record (§3.3) correctly characterized this as "a reading of silence, not an authorization." I am resolving that
silence explicitly, in the direction the prep record's own analysis supports (it is the only candidate that is
simultaneously in-scope at the chosen pipeline position and not excluded by any binding constraint), and recording
that resolution as a deliberate act, not an inference from existing text.

**Rationale:** Of the six candidates surveyed, four are expressly excluded (category plausibility, Search
membership, `offer_rationale`) or unauthorized (`research_signals`, absent explicit permission this record does
not find reason to grant — doing so would reopen B-3's "search snapshot only" boundary, which is out of scope
here). The remaining candidate — raw source documents already fetched for the Research call — requires no new
provider integration, is already in scope at the Research-time insertion point, and can honestly establish facts
about the Prospect (via verbatim quotes) rather than category inference, satisfying the "honestly establish facts"
requirement in the task's TC-MATCH-1 guidance.

### TC-MATCH-2 — Evaluation mechanism

**Selected:** Hybrid — deterministic framing/pre-processing, one bounded model call for the semantic judgment
itself, deterministic post-processing (verification + aggregation), mirroring `categoryPlausibility.ts`'s
*shape* (deterministic-parse → model-call → deterministic-aggregate), never its *computed result*. Model-assisted
evaluation requires: (a) persisted evidence (the quotes/sources the model cited), (b) persisted evaluator
metadata sufficient to audit the determination (model/version identifier, the exact input given to the model, and
the raw model output), per the task's own TC-MATCH-2 guidance.

**Rationale:** `targetCustomer` is a free-text, user-authored string with no closed vocabulary; no deterministic
rule engine in the repository can classify semantic match from unstructured document text without a model step.
The hybrid shape is the only mechanism pattern with working local precedent (`categoryPlausibility.ts`) for
isolating a non-deterministic step behind a deterministic, auditable boundary, which directly serves the
auditability and replayability objectives named in the task's decision method.

### TC-MATCH-3 — MATCH semantics

**Selected:** `MATCH` requires at least one verified, verbatim, on-document quote — passing the same structural
authenticity check `verifyCategoryPlausibility`/`verifyProvenance` already apply elsewhere (minimum length,
appears verbatim, normalised, in a source document actually supplied to the model) — that affirmatively
establishes the Prospect's observed characteristics as the kind of customer the Search's `targetCustomer`
criterion names. A bare model assertion with no verified supporting quote is insufficient for `MATCH`.

**Rationale:** Directly implements `PDEF4-PCG4-PO-DEC-001` §7's bar against "any free-text, prose-derived, or
inferred characterization not backed by a structured field." Requiring a verified quote (not merely a model
label) prevents unsupported inference from becoming a positive qualification, satisfying the task's binding
constraint and TC-MATCH-3 guidance directly.

### TC-MATCH-4 — NO_MATCH semantics

**Selected:** Symmetric evidentiary bar with `MATCH`. `NO_MATCH` requires its own verified, verbatim, on-document
quote that affirmatively establishes characteristics inconsistent with the Search's `targetCustomer` criterion.
Mere absence of a matching quote, or exhaustion of positive evidence after a genuine look, is **not** sufficient
for `NO_MATCH` — that case resolves to `NOT_YET_OBSERVED` (TC-MATCH-5).

**This is a deliberate, newly-stated delegated PO policy decision** — no governing record previously fixed this
question for this signal — but it is directly justified by existing local precedent (`aggregateCategoryFit`'s D3
principle: insufficient/mixed evidence must never collapse into a default negative) and by the task's own binding
constraint that "absence of evidence must NOT automatically become NO_MATCH unless explicitly established as a
new, clearly-labeled delegated PO decision... and even then, only if well justified." I am making that explicit
decision here, in the conservative (non-negative-by-default) direction the local precedent and the questionnaire's
own analyst recommendation both support, precisely so that absence-of-evidence is never silently treated as proof
of non-match.

### TC-MATCH-5 — NOT_YET_OBSERVED semantics

**Selected:** `NOT_YET_OBSERVED` covers both (a) row-absence (no Research-time evaluation has yet run for this
`(search_id, prospect_id)` pair — per `PDEF4-PCG4-ED-DEC-001` §5) and (b) an explicit, persisted row recording
that evaluation ran but neither the `MATCH` bar (TC-MATCH-3) nor the `NO_MATCH` bar (TC-MATCH-4) was met —
including insufficient evidence, unresolved contradiction (TC-MATCH-6), and evaluator/provider failure
(TC-MATCH-9). Persisting an explicit row in case (b), rather than leaving no row at all, is chosen so that "we
looked and found nothing conclusive" remains distinguishable, for audit purposes, from "we have not looked yet" —
without changing ED-DEC-001's §5 rule that absence-of-row is also, and always, read as `NOT_YET_OBSERVED`.

**Rationale:** `PDEF4-PCG4-ED-DEC-001` §5 fixes row-absence as *a* `NOT_YET_OBSERVED` state; it does not say this
is the *only* way to reach `NOT_YET_OBSERVED`, nor does it forbid an explicit inconclusive row. Allowing an
explicit row preserves auditability (an inconclusive evaluation leaves a trace of when it ran and why it did not
resolve) without weakening the binding constraint that `NOT_YET_OBSERVED` remain a legitimate, reachable outcome.

### TC-MATCH-6 — Contradictions

**Selected:** A deterministic conflict policy: when two or more supplied source documents contain verified quotes
that disagree about the same underlying claim (one supporting `MATCH`, another supporting `NO_MATCH`, for the
same Prospect/Search pair), the result resolves to `NOT_YET_OBSERVED` — never auto-`MATCH`, never auto-`NO_MATCH`
— and **both** conflicting quotes/sources must be persisted in the evidence array (not just the "winning" one), so
the contradiction itself is visible to a human auditor rather than hidden behind a single opaque model verdict.

**Rationale:** No repository precedent models same-claim contradiction; the only locally-established tie-breaking
norm (D3: insufficient/mixed evidence → unknown, never default-negative) extends naturally here. Persisting both
conflicting items (rather than letting the model silently pick one) directly satisfies the task's TC-MATCH-6
guidance to keep the policy deterministic and auditable, not hidden behind model output.

### TC-MATCH-7 — Confidence

**Selected:** Confidence remains provenance/observability metadata only. It is persisted alongside each stored
evidence item (per the quote/source-shaped provenance already fixed by `PDEF4-PCG4-ED-DEC-001` §6) but **never**
gates, thresholds, or otherwise participates in the `MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED` classification itself.
No numeric confidence threshold is introduced by this record.

**Rationale:** Every confidence field found anywhere in this repository (`Observation.confidence`,
`categorySegmentSchema.confidence`) is treated identically — recorded, never used to flip an outcome. Introducing
a confidence-gated classification here would be a genuinely new pattern with no local precedent and no stated
business justification; the task explicitly warns against introducing arbitrary numeric thresholds "just because
confidence fields exist." Following the uniform existing convention is the lower-risk, better-justified choice.

### TC-MATCH-8 — Freshness

**Selected:** No expiry. A current (non-superseded) `target_customer_determinations`-style row remains valid
indefinitely until superseded by a later Research-time re-observation for the same `(search_id, prospect_id)`
pair, per the append-only/supersede model already fixed by `PDEF4-PCG4-ED-DEC-001` §7.

**Rationale (explicit, as the task requires when no expiry is chosen):** No freshness/staleness rule exists today
for `category_plausibility_determinations` — the directly analogous, architecturally nearest sibling table — nor
for any other append-only/supersede determination table in this repository. `SIGNAL_FRESH_DAYS`/
`SIGNAL_MAX_AGE_DAYS` exist but are scoped to `core-acquisition`'s unrelated scoring subsystem and apply to a
different kind of signal (continuously-decaying lead-scoring inputs, not a tri-state determination with its own
supersede mechanism). Importing that numeric policy here would be inventing a business rule with no stated
justification tying it to target-customer-match specifically. Recency is already handled structurally — any
material change triggers a fresh Research-time run, which supersedes the prior row — so a time-based expiry would
duplicate, not add, protection against staleness.

### TC-MATCH-9 — Failure behavior

**Selected:** Fail-soft, uniformly, across every distinguished failure mode: missing/unavailable source
documents, provider failure or timeout on the model call, evaluator (deterministic pre/post logic) failure, and
malformed or verification-failing model output. Every one of these resolves to `NOT_YET_OBSERVED` (as an explicit
row per TC-MATCH-5(b), or as row-absence if the failure occurs before any row could be constructed) and is never
surfaced as a thrown, pipeline-fatal error and never defaults to `NO_MATCH`.

**Rationale:** Directly continues the repository-wide fail-soft convention already explicit in
`rules.ts` (`null → 'UNKNOWN'`), `pcg4.ts`'s own in-file comment calling this "deliberate, tested behavior," and
`categoryPlausibility.ts`'s repair-loop/defaulting behavior. No new policy is invented; this is a direct
application of an existing, consistently-followed cross-cutting norm to a new signal.

### TC-MATCH-10 — Determinism / replay

**Selected:** Deterministic-wrapper-around-one-bounded-model-call. The deterministic pre-processing (document
framing/selection) and post-processing (quote verification, conflict detection, aggregation into
`MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED`) must be pure, unit-testable functions with no I/O or clock dependency,
exactly as `parseTargetSegments`/`aggregateCategoryFit` already are. The single model call itself is not required
to be deterministic. Instead, replay/audit is guaranteed via persisted artifacts: the exact evaluator input given
to the model, the raw model output, and a model/version identifier are persisted alongside the stored result, so
the determination is fully explainable after the fact without requiring the model call itself to be
bit-for-bit reproducible.

**Rationale:** This is exactly the option the task's own TC-MATCH-10 guidance names as sufficient ("you do not
need deterministic model output itself if deterministic replay/audit from persisted artifacts is guaranteed
instead"), and it is the only mechanism shape with working local precedent in this repository.

### TC-MATCH-11 — Test contract

**Selected minimum fixture/test categories** for the future evaluator's test suite (fixtures and exact counts
left to implementation; no numeric threshold fixed here):

1. Clear positive — verified on-document quote → `MATCH`.
2. Clear negative — verified on-document quote of non-matching characteristics → `NO_MATCH` (per TC-MATCH-4's
   symmetric bar).
3. Insufficient evidence (no verified quote either way) → `NOT_YET_OBSERVED`.
4. Contradictory evidence (verified quotes on both sides) → `NOT_YET_OBSERVED`, with both items persisted
   (TC-MATCH-6).
5. Provider/evaluator failure and malformed/verification-failing model output → `NOT_YET_OBSERVED`, never thrown,
   never `NO_MATCH` (TC-MATCH-9).
6. Confidence-non-gating — varying confidence values with identical evidence must not change the classification
   (TC-MATCH-7).
7. Deterministic replay — identical persisted evidence/model output reproduces the identical deterministic
   aggregation on repeated evaluation (TC-MATCH-10).
8. Supersession/history — a later Research-time evaluation supersedes a prior row for the same
   `(search_id, prospect_id)` pair; the prior row is retained, not erased (consistent with `PDEF4-PCG4-ED-DEC-001`
   §7).
9. At least one test pinning current, deliberately limited behavior (mirroring `pcg4.test.ts`'s explicit
   "do not fix this by manufacturing a pass" convention) to prevent a future change from silently weakening the
   evidentiary bar.

**Rationale:** Modeled directly on the combined pattern of `categoryPlausibility.test.ts`, `evaluator.test.ts`,
and `pcg4.test.ts` (§3.8 of the mechanism preparation record), covering exactly the outcome space TC-MATCH-1
through TC-MATCH-10 above define — false-positive risk (categories 1, 6), false-negative risk (categories 2, 3),
contradiction bugs (category 4), failure-mode bugs (category 5), and replay/history bugs (categories 7, 8).

### TC-MATCH-12 — Package ownership

**Selected:** `@acos/core-research`, co-located with `categoryPlausibility.ts` and its provenance/quote-
verification helpers (`provenance.ts`), as a structurally separate module (not reusing category plausibility's
computed output, consistent with its continued exclusion as a data source).

**Rationale:** `core-research` already owns the Research-time pipeline insertion point (`service.ts`'s
per-Prospect loop) that `PDEF4-PCG4-ED-DEC-001` §4 fixed as the timing for this signal, and already contains the
quote/source-verification helpers (`provenance.ts`) that TC-MATCH-3/4's evidentiary bar directly reuses. A new,
narrowly-scoped sibling package would duplicate or re-export those helpers for no architectural benefit, since
this evaluator's lifecycle is already coupled to the Research pipeline by virtue of ED-TC-6's timing decision.
`core-qualification-equivalence` and `core-launch-gates` are not viable owners: per `PDEF4-PCG4-ED-DEC-001` §13,
`core-qualification-equivalence`'s existing contract (pure comparison over already-resolved fields) is not
expected to change, and `core-launch-gates` owns only gate aggregation/SQL, not evidence classification. This
decision is based on repository architecture (pipeline position, helper reuse, package contracts), not merely on
where the research pipeline happens to execute today, per the task's TC-MATCH-12 guidance.

---

## 4. Downstream engineering implications

- A future, separate engineering-design and implementation-authorization decision is still required before any
  code, schema, migration, or test is written — this record authorizes none of it (§6).
- The migration shape already described in `PDEF4-PCG4-ED-DEC-001` §8 (new `(search_id, prospect_id)`-keyed table,
  tri-state `result` enum, quote-shaped evidence array, append-only supersede) remains unchanged by this record;
  this record adds semantic content to what populates that `result` column and what the evidence array must
  contain (a possible conflict-pair shape, per TC-MATCH-6, and model/version metadata, per TC-MATCH-10) but
  proposes no new column beyond what ED-DEC-001 already anticipated as "an evidence column (JSONB array)."
- The new evaluator module (`core-research`, per TC-MATCH-12) requires: (a) a deterministic pre-processing step
  selecting/framing the already-fetched source documents, (b) one bounded model call producing a structured
  per-document or per-claim verdict with a cited quote, (c) a deterministic post-processing step that verifies
  each cited quote against the actual supplied document (reusing `provenance.ts`), detects contradiction
  (TC-MATCH-6), and aggregates to `MATCH`/`NO_MATCH`/`NOT_YET_OBSERVED` per TC-MATCH-3/4/5, and (d) persistence of
  the model/version identifier and raw model output alongside the stored result, per TC-MATCH-10.
- `pcg4.ts`'s boundary translation (already described in outline by `PDEF4-PCG4-ED-DEC-001` §8) is unaffected in
  shape by this record; it still reads the single current `result` row and maps `MATCH`/`NO_MATCH`/
  `NOT_YET_OBSERVED`/row-absence to `observedTargetCustomer: string | null` exactly as already described.
- `evaluateTargetCustomerMatch`/`rules.ts`/`evaluator.ts` remain unchanged, confirmed again by this record.

---

## 5. Unresolved items

- The exact structured schema for the model-call's input/output (field names, per-claim vs. per-document
  granularity) is not specified here — this record fixes the required semantic properties (verified quote,
  conflict detection, model/version persistence) but leaves the literal schema to the future engineering-design/
  implementation decision.
- The exact `pcg4.ts`-boundary translation function, table/column naming, and migration numbering remain open
  exactly as `PDEF4-PCG4-ED-DEC-001` §13 already stated; this record does not resolve them, as they were out of
  this questionnaire's scope.
- Whether a future business need could justify introducing a freshness window later (TC-MATCH-8) is left open;
  today's decision is "no expiry," not "freshness can never be revisited."

---

## 6. Explicit statements

- **This is a policy/design decision only.** It resolves TC-MATCH-1 through TC-MATCH-12 as semantic/product and
  engineering-design decisions. It does not implement, and is not itself, any code, schema, migration, or test.
- **No implementation authorization is granted by this record.** It does not authorize schema changes, migrations,
  application code, evaluator implementation, test implementation, production wiring, deployment, release,
  production traffic, or launch of any kind. A future, separate implementation-authorization decision remains
  required before any of that work begins.

---

## 7. Provenance statement (restated)

This decision record was produced under Product Owner authority explicitly delegated by the human user to Claude
(an AI assistant) for this task, and the twelve selections in §3 were made by Claude under that delegation. It is
not, and must not be represented as, a decision made directly by a human Product Owner.
