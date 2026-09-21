# PHASE 21 — PERSONALIZATION — SCOPE LOCK

## 1. Baseline

| | |
|---|---|
| Baseline commit | `2363a14` — Phase 20 (Qualification) closure |
| Phase 18 implementation | `daf86e2` |
| Phase 18 closure | `b3da711` |
| Phase 19/20 closure | `71ac4b6` (Phase 19), `2363a14` (Phase 20) |

Pre-existing, unrelated working-tree drift at baseline (preserved, never staged as part of Phase 21):
`apps/web/tsconfig.tsbuildinfo`, `CLAUDE.md`, `requirement/AI Client Acquisition OS — Product
Requirements Document V2.2.md`.

## 2. Objective

Given a **QUALIFIED** Opportunity, produce a structured, evidence-backed Personalization artifact
answering "what specifically should we say to this prospect" — consuming only what Discovery,
Research, Opportunity (Need Detection) and Qualification have already persisted. Personalization
does **not** send outreach and does **not** re-derive need/offer/qualification.

## 3. Pipeline position

```
Discovery → Research → Need Detection → Opportunity → Qualification [Phase 20, FROZEN]
    → Personalization [Phase 21, THIS PHASE] → Outreach [future, unbuilt]
```

## 4. Requirements (R-42..R-53)

Implemented exactly as specified in the governing master prompt. Summary:

- **R-42 Eligibility** — only `Qualification.state === 'QUALIFIED'` may produce a Personalization.
  `NOT_QUALIFIED`, `INSUFFICIENT_EVIDENCE`, and "no Qualification row" all short-circuit to "no
  personalization created", and never write, touch, or re-evaluate Qualification.
- **R-43 Input contract** — consumes only already-persisted: Opportunity, current Qualification,
  the Opportunity's own recommended offer, Qualification's evidence-signal-id set, the Prospect's
  active ResearchSignals, Prospect/Company identity, and the ServiceProfile snapshot immutably
  retained on the Prospect's Search (`StoredSearch.parameters`, DEC-007 — see §6). No new Discovery,
  no new Research, no arbitrary external fetch.
- **R-44 Evidence selection** — a bounded, ordered subset of the Prospect's live, evidentiary
  ResearchSignals, restricted to the ids Qualification itself already relied on
  (`StoredQualification.evidenceSignalIds`), preserving classification/kind/field/signal/
  confidence/basis. UNKNOWN and superseded signals are structurally excluded, not merely hidden.
- **R-45 Artifact** — new `personalizations` table / `@acos/core-personalization` package: one
  current row per Opportunity.
- **R-46 Opening context** — evidence-backed prose, classification-aware (OBSERVED stated directly,
  INFERRED hedged with its basis), never inventing facts or unsupported outcomes.
- **R-47 Value proposition** — built from the Opportunity's own existing `offer` (service +
  rationale), never a new recommendation; never calls `suggestOffers()`; never touches
  `needDetected`.
- **R-48 Inference transparency** — OBSERVED/INFERRED/UNKNOWN semantics preserved end to end; no
  causal claim beyond what a signal states.
- **R-49 Current-row persistence** — `UNIQUE(opportunity_id)`; re-evaluation upserts; ResearchSignal
  rows are never mutated.
- **R-50 Idempotency** — identical inputs (Opportunity, Qualification, ResearchSignals,
  ServiceProfile snapshot) reproduce an equivalent result on the same row.
- **R-51 Worker ordering** — Personalization runs strictly after Qualification in
  `runCanonicalPipeline()`.
- **R-52 Failure isolation** — a Personalization failure propagates as a normal pipeline failure
  (same `retry`/`failed` outcome Qualification/Opportunity failures already produce) and never
  touches ResearchSignals/Opportunity/Qualification.
- **R-53 LLM boundary** — **no LLM is used** (see Decision P1 below); the boundary is therefore
  satisfied by construction — there is no model call that could discover, research, re-qualify, or
  send anything.

## 5. Architecture boundaries (frozen — do not touch)

Phase 18: `DiscoveryProvider`/`ResearchProvider` contracts, source-document acquisition,
homepage-only boundary, Anthropic research execution, R-29 metering, retry lifecycle.

Phase 19: jsdom robustness, `ServiceProfile` trigger vocabulary/validation contract.

Phase 20: `evaluateQualification()`, `rules.ts`, `QualificationState`/criteria, qualifications
table/repository, worker-ordering position of Qualification, R-41/R-42(prior)/existing R-37..R-40
behavior.

Personalization is a **read-only consumer** of Opportunity/Qualification/ResearchSignal/
ServiceProfile data. It introduces exactly one new table (`personalizations`) and one new package
(`@acos/core-personalization`); it adds one new optional dependency + one new call to
`apps/worker/src/searchWorker/worker.ts` and one new wiring line to `apps/worker/src/index.ts`
(mirroring exactly how R-41 added Qualification in Phase 20) and nothing else in any frozen file.

## 6. Decisions made during this phase (not pre-specified — recorded per governing instructions)

**Decision P1 — No LLM.** The master prompt makes LLM use conditional ("If an LLM is used…") and
explicitly instructs (`STEP 4`) to "prefer pure deterministic domain logic where possible." Phase 20
already established the repository's own precedent for this exact kind of decision-under-evidence
problem: `evaluateQualification()` is pure/deterministic, not an LLM call. `@acos/core-acquisition`'s
`suggestOffers()` also already does evidence→prose synthesis deterministically, via a
`{signal}`-interpolated rationale template
(`packages/core-acquisition/src/offer.ts`). Personalization follows the same, already-proven
pattern: deterministic templates over selected evidence, never a model call. This makes R-53 trivially
satisfied (no model exists that could violate its boundary), keeps generation fully testable without
network/API-key dependencies, and avoids inventing a new AI-usage-metering/provider boundary the
requirements do not mandate. If a future phase wants LLM-authored copy, R-53's boundary (synthesize
wording only, never discover/research/qualify/send) still applies and would wrap this same evidence
selection, not replace it.

**Decision P2 — ServiceProfile input resolved via the Search snapshot, not a fresh ServiceProfile
lookup.** `@acos/core-opportunity`'s own `createOpportunityForOwner` already established this
exact convention (DEC-007): `Prospect.searchId → Search.parameters` is the immutable
`ServiceProfileFields` snapshot the Opportunity/offer were computed against; a live
`ServiceProfileRepository.getById` could return a profile since edited or deleted, which would
break traceability to what actually produced this Opportunity's offer. Personalization reuses the
identical lookup chain (`prospects.getById → searches.getById → search.parameters`) rather than
adding a new `ServiceProfileRepository` dependency.

**Decision P3 — Personalization state vocabulary.** `PersonalizationState` is a single-value type
(`'GENERATED'`) for v1: because a row is only ever written when R-42's eligibility gate already
passed, there is no second reachable state to represent, and inventing one (e.g. a "STALE" state
for when Qualification later flips away from QUALIFIED) would be a business rule the requirements
do not specify — the spec says nothing about what should happen to an existing Personalization row
when Qualification later changes, and R-49/R-52 only require that ResearchSignals/Opportunity/
Qualification are never touched, not that an existing Personalization row is invalidated. The field
exists (satisfying R-45's minimum shape) as a forward-compatible extension point, not a guessed
business rule.

**Decision P4 — Evidence selection rule (R-44 "bounded set").** Candidate pool = the Prospect's
currently-active (non-superseded), non-UNKNOWN ResearchSignals whose id is a member of
`StoredQualification.evidenceSignalIds` (i.e., exactly the evidence Qualification itself already
proved sufficient) — never a broader or independently-chosen pool. Ordered by confidence
descending, capped at 5 (`MAX_PERSONALIZATION_EVIDENCE`). QUALIFIED implies
`evidenceSignalIds.length > 0` by construction of `evaluateEvidencePresent()` (Phase 20), so this
selection can never be empty for an eligible Opportunity.

## 7. Persistence model

```
opportunities (1) ---- (1) personalizations     UNIQUE(opportunity_id)
```

New migration `packages/db/prisma/migrations/0023_personalizations/migration.sql`. `personalizations`
carries no `user_id` — the fourth named DEC-008 ownership-inheritance exception (after
`research_signals`, `opportunity_scores`, `qualifications`), inherited via
`opportunity_id → opportunities.user_id`. FK to `opportunities` with `ON DELETE CASCADE`.
`evidence` and `criteria`-equivalent structured data stored as `JSONB`, mirroring migration 0022's
own choice for `qualifications.criteria`.

## 8. Out of scope (unchanged from the master prompt)

Email/LinkedIn sending, outreach scheduling, follow-up automation, reply detection, unsubscribe
handling, CRM sync, campaign management, autonomous outreach, new discovery/research, a new scoring
system, any change to `suggestOffers()`/`needDetected`/Qualification semantics/Phase 18 provider
code/Phase 19 trigger validation/Phase 20 qualification rules.

## 9. Validation requirements

Unit tests (evidence selection, generator/template output, eligibility gating, persistence
upsert/idempotency) in `packages/core-personalization`; worker ordering + failure-isolation tests in
`apps/worker/src/searchWorker/worker.test.ts`; a real-PostgreSQL integration test in
`tests/integration/personalization.integration.test.ts` mirroring
`tests/integration/qualification.integration.test.ts`'s structure; repo-wide typecheck and test
suite; `git diff --check`.

## 10. Closure gate

Phase 21 is PASS/CLOSED only when every item in the master prompt's "PHASE 21 CLOSURE GATE" section
is independently verified and documented in `requirement/PHASE_21_PERSONALIZATION_CLOSURE.md`, with
Phase 18/19/20 confirmed unchanged by direct diff inspection (not inferred).
