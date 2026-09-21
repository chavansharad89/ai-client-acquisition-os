# PHASE 20 — QUALIFICATION ENGINE

# SCOPE LOCK

This is a preflight scope-lock, not a closure artifact. No implementation exists yet. This
document is the authoritative source for Phase 20 once approved — it follows the same
convention as `PHASE_16_R29_PREFLIGHT_SCOPE_LOCK.md` and `PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md`.

Phase 20 does not exist in PRD V2.2's engineering roadmap (which designates only Phase 15/16/17
by name, plus R-33 as a cross-cutting gate — see the audit that preceded this document). R-35
through R-41 below are **new requirement IDs introduced by this scope-lock**, not IDs already
present in PRD V2.2 Layer 3. They are authored here, by direct instruction, to extend that
vocabulary — this file is their first and only authoritative source until a future PRD revision
folds them in.

---

## BASELINE

| | |
|---|---|
| HEAD at scope-lock time | `71ac4b6` — "phase-next: close provider robustness and service-profile contract" (Phase 19 closure) |
| Phase 17 commit | `da0cb7c` — "Phase 17: implement R-34 worker orchestration" |
| Phase 18 implementation commit | `daf86e2` — "Phase 18: implement provider execution (Discovery, source acquisition, Research)" |
| Phase 18 closure commit | `b3da711` — "phase18: close validation and mark phase complete" |
| Phase 19 closure commit | `71ac4b6` |
| Working tree | Pre-existing, unrelated drift left untouched: `apps/web/tsconfig.tsbuildinfo` (build artifact), `CLAUDE.md` (untracked), `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` (untracked) |

Verified by direct inspection (`git log --oneline`, `git show --stat`) — not assumed.

## PHASE 18 FREEZE STATEMENT

Phase 18 is CLOSED and FROZEN. Not modified, reopened, refactored, or reinterpreted by this
document or by Phase 20. Specifically untouched: `DiscoveryProvider` contract, `ResearchProvider`
contract, discovery ordering, homepage-only source acquisition boundary, source-document
extraction boundary, the Anthropic research invocation, R-29 metering, the worker retry
lifecycle, and `requirement/PHASE_18_PROVIDER_EXECUTION_CLOSURE.md` itself.

## PHASE 19 FREEZE STATEMENT

Phase 19 is CLOSED and FROZEN. Not modified, reopened, refactored, or reinterpreted by this
document or by Phase 20. Specifically untouched: the jsdom `VirtualConsole` robustness fix, the
`sourceDocumentProvider` regression coverage, `ServiceProfile.triggers` vocabulary validation,
`core-service-profile`'s validation contract, and `requirement/PHASE_19_FOLLOWUP_CLOSURE.md`
itself.

Phase 20 reads `ServiceProfile.triggers` (via the Search's immutable profile snapshot, exactly
as `toServiceRule()` already does) but does not call, wrap, or modify `core-service-profile`'s
validation code — Qualification is a pure downstream consumer of an already-validated value.

---

## OBJECTIVE

Introduce a new domain responsibility, Qualification, that sits strictly between Opportunity
creation (Need Detection's output) and any future Personalization/Outreach consumer:

```text
Research
  ↓
Need Detection / Opportunity   (existing — @acos/core-opportunity's createOpportunityForOwner)
  ↓
Qualification                  (NEW — Phase 20)
  ↓
Personalization                (future, not built)
  ↓
Outreach                       (future, not built)
```

Qualification answers exactly one question, per Opportunity: *given the Opportunity's already-
detected need/offer and the Prospect's currently-active persisted evidence, is there still
sufficient evidence to consider this Opportunity qualified?* It is a re-check of currency and
evidence sufficiency layered on top of Need Detection's output — never a second, competing
need-detection mechanism, and never a rewrite of what `suggestOffers()` already decided.

## TERMINOLOGY

| Term | Meaning in this document |
|---|---|
| Qualification | The new domain responsibility this phase adds: evaluating an existing Opportunity's evidence sufficiency. |
| Qualification result / row | One persisted `qualifications` record — the current qualification state for one Opportunity. |
| Evaluator | The pure, deterministic function that computes a qualification result from inputs. Never an LLM call. |
| Live signal | A `StoredResearchSignal` with `supersededAt === null` (currently active, per the existing convention `toOfferSignals`/`toScoringSignals` already use). |
| Evidentiary signal | A live signal with `classification !== 'UNKNOWN'` (i.e. `signal !== null` — carries an actual claim, not an unresolved field). |

---

## R-35 — QUALIFICATION CONTRACT

Canonical domain model (`packages/core-qualification/src/types.ts`):

```ts
export type QualificationState = 'QUALIFIED' | 'NOT_QUALIFIED' | 'INSUFFICIENT_EVIDENCE';

export type QualificationCriterionId = 'NEED_DETECTED' | 'EVIDENCE_PRESENT';

export interface QualificationCriterionResult {
  criterion: QualificationCriterionId;
  satisfied: boolean;
  /** Human-readable, e.g. "no offer matched (needDetected=false)" or "2 live, non-UNKNOWN signals". */
  reason: string;
  /** StoredResearchSignal ids supporting (or failing to support) this criterion. */
  evidenceSignalIds: readonly string[];
}

export interface StoredQualification {
  id: string;
  opportunityId: string;
  prospectId: string;
  state: QualificationState;
  criteria: readonly QualificationCriterionResult[];
  /** Union of every evidenceSignalIds across criteria — the full evidence set considered. */
  evidenceSignalIds: readonly string[];
  evaluatorVersion: string;
  evaluatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

No free-form text is the canonical state — `state` is the closed `QualificationState` union
only. `reason` strings are observability detail, never parsed back into a decision.

## R-36 — EVIDENCE-BASED QUALIFICATION

Inputs consumed (all already-persisted, nothing fabricated):

- `StoredOpportunity.needDetected` and `StoredOpportunity.offer` (existing, produced by
  `createOpportunityForOwner`'s call to `suggestOffers()` — read-only, never recomputed here).
- `StoredResearchSignal[]` for the Opportunity's Prospect, via
  `ResearchSignalRepository.listByProspect(userId, prospectId)` — the exact same repository
  method `scoreOpportunity()` and `createOpportunityForOwner()` already call, unmodified.
- `ServiceProfile.triggers` is **not** re-read independently by the evaluator — it was already
  consumed once, by `toServiceRule()`, to produce `needDetected`/`offer`. Qualification treats
  that outcome as given (Section 3 of the governing instructions: "do not reinterpret research
  evidence to create a need Need Detection did not detect").

If required evidence is unavailable (see R-37's `EVIDENCE_PRESENT` criterion), the evaluator
produces `INSUFFICIENT_EVIDENCE` — never silently defaults to `QUALIFIED`.

## R-37 — QUALIFICATION RULES (deterministic, no LLM)

Two criteria, evaluated in order, short-circuiting:

**1. `NEED_DETECTED`** — `satisfied = opportunity.needDetected === true`.
If not satisfied → state = `NOT_QUALIFIED`, `EVIDENCE_PRESENT` is not evaluated.
*Decision D1 (confirmed):* `needDetected=false` maps to `NOT_QUALIFIED`, not
`INSUFFICIENT_EVIDENCE` — Need Detection already ran and reached a definite negative
conclusion (`suggestOffers()` returned no match); that is not a lack of evidence, it is an
already-computed "no". Qualification does not re-open or second-guess it.

**2. `EVIDENCE_PRESENT`** — only evaluated when criterion 1 is satisfied.
`satisfied = ` (count of evidentiary live signals for the Prospect) `> 0`.
If not satisfied → state = `INSUFFICIENT_EVIDENCE`.
This is the real value Qualification adds beyond Need Detection: `needDetected` is computed
once, at Opportunity-creation time, and never revisited by any existing code. If every signal
that originally justified the offer is later superseded (e.g. by a re-research run), the stale
`needDetected=true` flag alone would otherwise still look "detected". `EVIDENCE_PRESENT` catches
that rot and reports `INSUFFICIENT_EVIDENCE` rather than trusting a possibly-stale flag.

If both criteria are satisfied → state = `QUALIFIED`.

**Explicitly excluded from the v1 rule set** (by direct decision, not oversight — recorded here
per the instruction "if the exact initial criteria cannot be derived safely from existing
repository contracts, STOP and report the ambiguity"):

- *Decision D2 (confirmed):* **No minimum-confidence/fit threshold.** The only comparable
  existing field is `DetectedOffer.fit` (0-100). No such threshold constant exists anywhere in
  the repository today, and inventing one would be a business-rule decision with no repository
  contract to derive it from. Phase 20 v1 does not gate on `fit`. This is a documented scope
  limitation, not a defect — a future phase may add a `MINIMUM_FIT` criterion once a threshold
  is explicitly product-decided.
- *Decision D3 (confirmed):* **No negative/disqualifying-evidence criterion.** `Classification`
  is `OBSERVED | INFERRED | UNKNOWN` only — nothing in the repository represents a signal as
  negative or disqualifying. This criterion is vacuously satisfied (never disqualifies) in v1.
  Documented as a known gap, not fabricated.
- **"Required signal kinds" and "service/profile compatibility"** (both named as rule concepts
  in the governing instructions) are satisfied by construction whenever `needDetected=true`:
  `suggestOffers()` only matches a live signal whose `kind` is in the profile's own `triggers`
  AND whose text contains one of the profile's own `keywords`, against a `ServiceRule` built
  from the caller's own current-at-Search-time `ServiceProfile` snapshot (`toServiceRule()`).
  Re-deriving either check independently inside Qualification would duplicate logic already
  proven by `createOpportunityForOwner`, risk drifting out of sync with it, and edges toward
  "reinterpreting evidence" — forbidden. `NEED_DETECTED` folds both in.

## R-38 — QUALIFICATION PERSISTENCE

*Decision D4 (confirmed):* one current row per Opportunity, mirroring `opportunity_scores`
(Phase 10) exactly — not an append-only history like `research_signals`.

New migration `0022_qualifications` (additive only, numbered after `0021_ai_usage_events`, per
DEC-006):

```sql
CREATE TABLE "qualifications" (
    "id"                    TEXT NOT NULL,
    "opportunity_id"        TEXT NOT NULL,
    "prospect_id"           TEXT NOT NULL,

    "state"                 TEXT NOT NULL,
    -- Ordered array of QualificationCriterionResult objects.
    "criteria"              JSONB NOT NULL,
    "evidence_signal_ids"   TEXT[] NOT NULL DEFAULT '{}',

    "evaluator_version"     TEXT NOT NULL,
    "evaluated_at"          TIMESTAMP(3) NOT NULL,

    "created_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"            TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qualifications_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "qualifications_opportunity_id_fkey"
        FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "qualifications_state_check"
        CHECK ("state" IN ('QUALIFIED', 'NOT_QUALIFIED', 'INSUFFICIENT_EVIDENCE'))
);

CREATE UNIQUE INDEX "qualifications_opportunity_id_key" ON "qualifications"("opportunity_id");
```

Ownership (DEC-008): `qualifications` carries **no `user_id`** — the third named
ownership-inheritance exception (alongside `research_signals` and `opportunity_scores`).
Inherited through `opportunity_id -> opportunities.user_id`; every ownership-scoped read joins
to `opportunities`, exactly as `opportunity_scores`'s repository already does.

`prospect_id` is denormalized onto the row (unlike `opportunity_scores`) solely because R-40
requires reading a qualification's supporting evidence without a second round-trip through
`opportunities` to find the Prospect — it is never used for ownership and is redundant with
`opportunities.prospect_id`, kept in sync only because a row is fully replaced (never patched)
on every re-evaluation.

Historical `ResearchSignal` rows are never mutated by Qualification — only the Opportunity's own
single `qualifications` row changes on re-evaluation. "Historical evidence not mutated" (R-38)
holds trivially because Qualification's write path touches exactly one table it owns.

## R-39 — QUALIFICATION IDEMPOTENCY & RE-EVALUATION

The evaluator (`evaluateQualification()`) is a pure function of `{ needDetected, evidentiary
signal ids }`. Calling it twice with unchanged inputs yields an identical `state`/`criteria`
result — determinism is structural, not achieved by caching or hashing.

Re-evaluation is an **explicit, caller-invoked step**, not automatic on read — the same
convention `scoreOpportunity()` and `classifyOpportunityStaleness()` already establish ("a
separate step in the MVP journey"). `upsert(opportunityId, ...)` replaces the one row for that
`opportunityId` (the `UNIQUE(opportunity_id)` index), so:

- Same evidence, repeated evaluation → the row is overwritten with byte-identical `state`/
  `criteria`/`evidence_signal_ids`; only `evaluated_at`/`updated_at` advance. No duplicate rows
  can ever exist (index-enforced).
- Changed evidence (e.g. new Research superseding old signals) → the next explicit evaluation
  call produces a new `state`/`criteria` from the new live-signal set and replaces the row.
  Nothing about `ResearchSignal` persistence changes to support this — Qualification simply
  re-reads whatever `listByProspect` currently returns.

## R-40 — QUALIFICATION OBSERVABILITY

`StoredQualification.criteria` carries, per criterion: which criterion, whether it was
satisfied, a human-readable reason, and the exact `ResearchSignal` ids behind that reason. An
operator reading one row can determine all six items the governing instructions require: state,
criteria evaluated, evidence per criterion, why evidence was insufficient (the `EVIDENCE_PRESENT`
criterion's `reason` when `satisfied=false`), `evaluated_at`, and `evaluator_version`.

`evaluatorVersion` starts at `'qualification-v1'` (mirrors `SCORER_VERSION`'s
`'prospectScore-v1'` convention in `@acos/core-opportunity`) — bumped only if the rule set in
R-37 changes.

## R-41 — QUALIFICATION PIPELINE INTEGRATION

Integration point: `apps/worker/src/searchWorker/worker.ts`'s `runCanonicalPipeline()`, after the
existing Opportunity-creation block (the exact point Research → Opportunity currently ends, per
the audit). For every Prospect processed in a Search:

```text
runResearchForOwner(...)
  ↓
createOpportunityForOwner(...)   [existing — skipped if an Opportunity already exists]
  ↓
evaluateQualificationForOwner(...)   [NEW — runs every time, for both new and pre-existing Opportunities]
```

Running Qualification unconditionally (not only on first creation) is deliberate: it is what
makes R-39's "changed evidence → new evaluation" reachable at all on a Search retry, without
adding any new retry/queue/scheduling concept — it reuses the worker's existing per-Prospect
loop and existing crash/retry semantics untouched.

`SearchWorkerDeps` gains one new required field, `qualifications: QualificationRepository`
(mirrors the existing `opportunities: OpportunityRepository` field). `apps/worker/src/index.ts`
gains one new wiring line, `qualifications: createPgQualificationRepository(pool)`. No change to
`SearchRepository`, `DiscoveryProvider`, `ResearchProvider`, claim/lease/retry logic, or the
Search state machine.

No Personalization/Outreach consumer exists yet (out of scope, unbuilt) — R-41's "before any
future Personalization/Outreach consumer" is satisfied by construction: nothing downstream reads
`qualifications` yet, so there is nothing to sequence against beyond the pipeline position above.

---

## PACKAGE BOUNDARY

New package `packages/core-qualification/`, mirroring `packages/core-service-profile/`'s
scaffold (`package.json`, `tsconfig.json`, `vitest.config.ts`):

```text
packages/core-qualification/
  package.json            (deps: @acos/core-research, @acos/core-opportunity, @acos/core-identity)
  tsconfig.json
  vitest.config.ts
  src/
    types.ts              (R-35)
    rules.ts               R-37's two criteria, pure functions
    evaluator.ts            evaluateQualification() — pure, composes rules.ts
    service.ts              evaluateQualificationForOwner() — resolves Opportunity/signals, calls evaluator, persists
    repository.ts          (QualificationRepository interface)
    pgRepository.ts         (Postgres implementation)
    errors.ts               (QualificationOpportunityNotFoundError, mirrors OpportunityNotFoundError)
    testSupport.ts          (in-memory QualificationRepository, mirrors other packages' testSupport.ts)
    index.ts
    *.test.ts
```

`vitest.workspace.ts` gains one new line, `'packages/core-qualification/vitest.config.ts'`
(additive; every other listed package follows this same pattern).

Not placed in `core-opportunity`: Opportunity answers "is there a detected need?"; Qualification
answers "is it still sufficiently supported to proceed?" — kept as separate packages per the
governing instructions, even though Qualification's service layer depends on
`core-opportunity`'s `OpportunityRepository`/`StoredOpportunity` types (a one-way dependency,
`core-opportunity` does not depend on `core-qualification`).

## DEPENDENCY MAP

```text
core-qualification
  → core-opportunity   (StoredOpportunity, OpportunityRepository, OpportunityNotFoundError — read-only)
  → core-research       (StoredResearchSignal, ResearchSignalRepository, Classification — read-only)
  → core-identity        (IdentityRepository, requireUser — same auth boundary convention)
```

No dependency on `core-discovery`, `core-service-profile`, `core-acquisition`'s `offer.ts`, or
any provider package. `apps/worker` gains a dependency on `core-qualification` (additive).

## EXPLICIT EXCLUSIONS

Not implemented in Phase 20 (verbatim from the governing instructions, retained for the closure
audit to check against): new discovery/research providers, web crawling/Playwright, source
acquisition changes, Anthropic provider changes, R-29 changes, retry-lifecycle changes,
discovery-ordering changes, `ResearchSourceKind` semantic changes, `toServiceRule()` changes,
`suggestOffers()` changes, Need Detection changes, service-profile trigger-derivation redesign,
outreach sending, email sequencing, personalization generation, CRM, autonomous acquisition,
LLM-based qualification judging, qualification scoring/ranking, and any Phase 18/19 file change.

---

## ACCEPTANCE CRITERIA

| ID | Criterion |
|---|---|
| AC20-1 | `StoredQualification`/`QualificationState`/`QualificationCriterionResult` implemented exactly as R-35 specifies; no free-form string is the canonical state. |
| AC20-2 | Evaluation reads only persisted `StoredOpportunity` + `StoredResearchSignal` data — no fabricated evidence, no LLM call. |
| AC20-3 | `NEED_DETECTED` and `EVIDENCE_PRESENT` are both implemented deterministically, short-circuiting per R-37; `needDetected=false` → `NOT_QUALIFIED` (D1); no fit threshold (D2); no negative-evidence criterion (D3), documented. |
| AC20-4 | `qualifications` table + repository implemented per R-38/D4; ownership inherited via `opportunity_id -> opportunities.user_id`, never a denormalized `user_id`. |
| AC20-5 | Repeated evaluation of unchanged evidence overwrites the same row (no duplicate rows possible — index-enforced) with an unchanged `state`/`criteria`. |
| AC20-6 | Evaluation against changed (superseded) evidence produces a different result on the next explicit call, without mutating any `research_signals` row. |
| AC20-7 | Every `QualificationCriterionResult` carries a `reason` and `evidenceSignalIds`; `INSUFFICIENT_EVIDENCE` rows carry a `reason` explaining the missing evidence. |
| AC20-8 | Worker pipeline calls `evaluateQualificationForOwner` after Opportunity creation/lookup, for every Prospect, per R-41; ownership (`userId` from the claimed Search) flows through unchanged. |
| AC20-9 | Ownership isolation: a caller cannot read or evaluate another user's Opportunity's qualification (cross-user test required, mirrors existing `opportunity_scores`/`research_signals` isolation tests). |
| AC20-10 | Phase 18 and Phase 19 files are unmodified (`git diff --stat` shows no path under those closures' file lists). |
| AC20-11 | Repo `typecheck` and `test` pass for all touched packages; any environment-blocked test (Postgres integration) is recorded as `BLOCKED — environment limitation`, never fabricated as PASS. |

## VALIDATION PLAN

**Unit tests** (`packages/core-qualification/src/*.test.ts`), covering exactly the cases named
in the governing instructions:

1. Qualified case (needDetected=true, ≥1 evidentiary live signal).
2. Not-qualified case (needDetected=false).
3. Insufficient-evidence case (needDetected=true, zero evidentiary live signals — e.g. all
   superseded, or all UNKNOWN).
4. Missing evidence (no signals at all for the Prospect).
5. "Low-confidence evidence" — reinterpreted per D2 as: evidentiary signals present regardless
   of their `confidence` value still yield `QUALIFIED` in v1 (no threshold exists); a test
   asserts this explicitly so the D2 decision is pinned, not silently reversible.
6. "Conflicting evidence" — reinterpreted per D3 as: no signal shape can conflict/disqualify in
   v1; a test asserts a scenario with contradictory-looking signal text still evaluates on
   presence alone, pinning D3.
7. No qualifying Opportunity (Opportunity not found for the caller → existing
   `OpportunityNotFoundError`-style error, not a new silent state).
8. Repeated evaluation (same inputs twice → identical persisted row, `evaluated_at` advances).
9. Changed evidence (signals superseded between two evaluations → different persisted state).
10. Ownership isolation (a second user's `userId` cannot resolve or evaluate the first user's Opportunity).

**Persistence integration test** (`tests/integration/`, Postgres-backed, following the existing
`tests/integration/*.test.ts` convention): evaluate → persist → read back → same
state + criteria + evidence references.

**Idempotency test**: two consecutive `evaluateQualificationForOwner` calls with no intervening
Research produce one row, unchanged `state`, no second row.

**Pipeline ordering test** (`apps/worker/src/searchWorker/worker.test.ts`): assert Qualification
is invoked only after Opportunity creation/lookup within `runCanonicalPipeline`, and that a
Qualification failure surfaces the same way an Opportunity-creation failure does today (propagates,
recorded as a failed Search attempt) — no silent swallow.

**Environment-gated integration tests** (Postgres): run where the environment provides a
database; otherwise recorded verbatim as `BLOCKED — environment limitation`, with the exact
reason (e.g. "no `DATABASE_URL` / Postgres instance available in this execution environment").
Never converted to PASS without having actually run.

## CLOSURE GATE

Phase 20 may be declared `PASS / CLOSED` only when every acceptance criterion (AC20-1…AC20-11) is
verified by direct evidence (test output, `git diff`, `typecheck` output) — not inferred from
"tests are green" alone — and:

```text
Phase 18 remains CLOSED and unchanged.
Phase 19 remains CLOSED and unchanged.
```

are both independently confirmed by diffing HEAD against the frozen file lists in each closure
document. Any criterion not satisfied, or any test `BLOCKED` by environment limitation, results
in `PHASE 20: INCOMPLETE` (if partially done) or `PHASE 20: BLOCKED` (if a hard dependency is
missing) — never `PASS`.

---

## IMPLEMENTATION ORDER (proposed, not yet executed)

Matches the governing instructions' Step A–N exactly: domain types → deterministic rules →
evaluator → persistence → tests → worker integration → targeted tests → package typecheck →
repo-wide typecheck → repo-wide tests → integration tests (where available) → Phase 18/19
boundary audit → closure document → diff review → scoped commit.

## GIT / WORKING-TREE RULES

Only Phase 20 files staged: `packages/core-qualification/**`, the new migration under
`packages/db/prisma/migrations/0022_qualifications/`, the two edited lines in
`apps/worker/src/searchWorker/worker.ts` + `apps/worker/src/index.ts`, the one new line in
`vitest.workspace.ts`, this scope-lock, and the eventual closure document. Pre-existing untracked
drift (`CLAUDE.md`, the PRD V2.2 file, `apps/web/tsconfig.tsbuildinfo`) is left exactly as found.
Neither `b3da711` nor `71ac4b6` is amended; a new commit only.

## FINAL SCOPE-LOCK DECISION

All four previously-open ambiguities are resolved (D1–D4, above, by explicit confirmation before
this document was written) and recorded as this phase's own decisions — not guessed. No Phase
18/19 boundary is implicated by anything in this document. Implementation may proceed against
this scope-lock.
