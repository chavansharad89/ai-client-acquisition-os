# PHASE 23 — FOLLOW-UP PREPARATION — CLOSURE

## Status

**PASS / CLOSED**

All R-61..R-69 requirements are satisfied by direct, executed evidence — unit tests, a real-
PostgreSQL integration suite, repo-wide typecheck/test runs, and a dedicated structural + runtime
no-send/no-schedule proof — not inferred from "tests are green" alone. See VALIDATION below for the
exact commands and results this closure is based on.

Authoritative scope source: `requirement/PHASE_23_FOLLOWUP_PREPARATION_SCOPE_LOCK.md`. This closure
does not reinterpret or expand that scope.

## Baseline

| | |
|---|---|
| Scope-lock baseline HEAD | `c33cef7` — Phase 22 (Outreach Preparation) closure |
| Phase 18 closure commit | `b3da711` |
| Phase 19/20/21 closure commits | `71ac4b6` (Phase 19), `2363a14` (Phase 20), `a7344d2` (Phase 21) |
| Phase 22 closure commit | `c33cef7` |

Pre-existing, unrelated working-tree drift present before this phase started
(`apps/web/tsconfig.tsbuildinfo`, `CLAUDE.md`, `requirement/AI Client Acquisition OS — Product
Requirements Document V2.2.md`) was left untouched and unstaged throughout.

## Implementation

New package `packages/core-followup-preparation/` (R-61..R-69):

- `src/types.ts` — `FollowUpPreparationState` (`'PREPARED' | 'READY_FOR_REVIEW'` — no `SENT`,
  `DELIVERED`, or `SCHEDULED` value anywhere in the union), `StoredFollowUpPreparation`,
  `FollowUpPreparationGeneration`.
- `src/generator.ts` — `generateFollowUpPreparation()`: a pure, deterministic function whose only
  input is an already-persisted `StoredOutreachPreparation` (subjectLine/callToAction/evidence) — no
  LLM, no fetch, no new discovery/research/qualification/personalization/re-drafting (R-61). `evidence`
  is passed through unmodified (R-63); `followUpContext`/`followUpContent`/`rationale` are template
  sentences built only from the source Outreach Preparation's own fields — no claim about whether or
  how the prospect responded.
- `src/repository.ts` / `src/pgRepository.ts` — `FollowUpPreparationRepository`, one current row per
  Opportunity via `INSERT ... ON CONFLICT (opportunity_id) DO UPDATE` (R-65/R-69), `state` hardcoded to
  `'READY_FOR_REVIEW'` at the INSERT site — never a caller-supplied value, mirroring
  `@acos/core-outreach-preparation`'s `pgRepository.ts` exactly.
- `src/service.ts` — `prepareOpportunityFollowUp()` (token-authenticated, present for structural
  symmetry only — no HTTP route wires it) and `prepareFollowUpForOwner()` (worker-callable), mirroring
  `@acos/core-outreach-preparation`'s own service split. Gate: returns `null`, never throws, when no
  Outreach Preparation row exists yet for the Opportunity (R-62's "must not run before Outreach
  Preparation" — enforced because an Outreach Preparation row cannot exist unless Qualification and
  Personalization already succeeded too).
- `src/testSupport.ts` — in-memory fake for other packages' own tests, mirroring
  `@acos/core-outreach-preparation`'s own `testSupport.ts` convention exactly (not exported from
  `index.ts`, matching precedent).
- `src/no-send.test.ts` — R-68's dedicated proof suite (structural source-scan + runtime
  poisoned-`fetch` proof, see VALIDATION), extended beyond Phase 22's pattern with an explicit check
  that no source file imports `@acos/core-outreach` or `@acos/core-proposal`.
- `src/index.ts` — public exports.

New migration `packages/db/prisma/migrations/0025_followup_preparations/migration.sql`: table
`follow_up_preparations`, no `user_id` (DEC-008's sixth named ownership-inheritance exception, after
`research_signals`, `opportunity_scores`, `qualifications`, `personalizations`,
`outreach_preparations`), `UNIQUE(opportunity_id)`, FK to `opportunities` and to
`outreach_preparations(id)` (source-provenance FK, R-63), both `ON DELETE CASCADE`, `state` CHECK
constrained to `('PREPARED', 'READY_FOR_REVIEW')`. No `sent_at`, `delivered_at`, `scheduled_at`,
`approved_by`, or `approval_state` column exists.

Worker pipeline integration (R-66), `apps/worker/src/searchWorker/worker.ts`:
`runCanonicalPipeline()` now calls `prepareFollowUpForOwner()` immediately after Outreach Preparation,
nested strictly inside the same `if (deps.outreachPreparations)` branch and gated on its own optional
`deps.followUpPreparations` — so Follow-Up Preparation can never run in a pass where Outreach
Preparation did not itself just run. `apps/worker/src/index.ts` wires
`createPgFollowUpPreparationRepository(pool)` into the real poll loop. `apps/worker/package.json` and
`tests/package.json` gained the new `@acos/core-followup-preparation` workspace dependency.

**`packages/core-outreach` and `packages/core-proposal` (the pre-existing, unwired packages) were not
touched, not imported, and not used as an implementation path**, per the governing instructions.
`git diff --stat -- packages/core-outreach packages/core-proposal` is empty (see VALIDATION's Boundary
Preservation section).

**Design decisions made during implementation, not present in the scope-lock as pre-specified
detail** (mirroring the equivalent Phase 22 Decision O1 and its own precedent):

- **`generateFollowUpPreparation()` always produces `READY_FOR_REVIEW`** for v1, since generation is
  synchronous and complete once an Outreach Preparation exists to draw from. `PREPARED` is kept in the
  type union and the database CHECK constraint as a genuine forward-compatible second value, the same
  convention every prior phase's own `*State` union already establishes.
- **Follow-up content derived solely from the persisted `StoredOutreachPreparation`** (`subjectLine`,
  `callToAction`, `evidence`) — no `personalizations`, `qualifications`, `signals`, `prospects`,
  `companies`, or `searches` repository dependency at all. This is the strictest possible structural
  reading of R-61's "only already-persisted pipeline artifacts, no rediscovery": the package has no
  import path capable of reaching any upstream stage but its immediate predecessor.
- **`source_outreach_preparation_id` is a real foreign key** to `outreach_preparations.id` (not merely
  a denormalised column) — R-63 provenance is enforced by the database itself, not only by application
  convention.
- **`SearchWorkerDeps.followUpPreparations` was made optional**, mirroring the identical,
  already-precedented Phase 20/21/22 decision for `qualifications`/`personalizations`/
  `outreachPreparations` — required purely to avoid forcing every pre-Phase-23 caller/test of
  `SearchWorkerDeps` to change merely to keep compiling. The real entrypoint always supplies it.
- **The worker test file's pre-existing local `fakeOutreachPreparationRepository()`'s
  `getByOpportunityId` stub was changed from an unconditional throw to a real implementation**
  (`apps/worker/src/searchWorker/worker.test.ts`). This was necessary: Phase 23's
  `prepareFollowUpForOwner` legitimately calls `outreachPreparations.getByOpportunityId`, which no
  Phase 22 test ever exercised, so the stub had never needed to work. No Phase 22 test asserts on or
  depends on this method throwing; all 171 pre-existing worker tests (Phase 17–22) continue to pass
  unmodified with the fix in place (see VALIDATION). This mirrors the identical, already-precedented
  Phase 22 decision for `fakePersonalizationRepository`'s equivalent stub — judged test-infrastructure
  completion, not a Phase 22 behavior change, additive to a stub rather than a change to any
  assertion, fixture data, or Phase 22 domain logic.

## Validation

**Unit tests** — `packages/core-followup-preparation` (22 tests, `pnpm --filter
@acos/core-followup-preparation test`): generator determinism, evidence pass-through with no
re-derivation, follow-up content referencing only the source Outreach Preparation's own fields
(`generator.test.ts`, 5 tests); service-level eligibility/ownership/idempotency, R-62 eligibility gate,
read-only consumption (`service.test.ts`, 11 tests); R-68's structural no-send/no-schedule proof (no
transport/scheduler import or call in any source file, no send/dispatch/deliver/transmit/schedule-
shaped export, state vocabulary limited to `PREPARED`/`READY_FOR_REVIEW`, `package.json` dependency
list has exactly five internal workspace packages, no import of `@acos/core-outreach` or
`@acos/core-proposal`) and runtime no-send proof (full `prepareOpportunityFollowUp()` path executed
end-to-end with `globalThis.fetch` poisoned to throw — zero invocations) (`no-send.test.ts`, 6 tests)
— **PASS**.

**Worker pipeline tests** — `apps/worker` (171 tests, including 6 new: full pipeline ordering
`[outreachPreparation, followUpPreparation]` for a Prepared Opportunity with the resulting row
traceable to the Outreach Preparation's own id, no-row-created when Outreach Preparation itself
produced none, "never runs before Outreach Preparation even when configured" using a deps object with
`outreachPreparations` genuinely absent, Follow-Up-Preparation-stage failure surfacing as a `retry`
outcome while leaving ResearchSignals/Opportunity/Qualification/Personalization/Outreach Preparation
untouched, idempotency on a retried claim, and a direct no-send-shape assertion on the persisted row)
— **PASS**. All 171 pre-existing worker tests (Phase 17–22) continue to pass with the one test-fixture
completion noted above.

**Persistence integration test** — `tests/integration/followup-preparation.integration.test.ts` (13
tests, real PostgreSQL): schema checks (no `user_id`, no `sent_at`/`delivered_at`/`scheduled_at`/
`approval_state` column, `UNIQUE(opportunity_id)`), the `state` CHECK constraint rejecting a literal
`'SENT'` insert (`follow_up_preparations_state_check` violation, R-68), generate→persist→read-back
round-trip with evidence verified equal to the source Outreach Preparation's own evidence set (R-63),
R-62's eligibility gate (an Opportunity with no Outreach Preparation produces no row), a direct check
that Qualification's, Personalization's, and Outreach Preparation's own `updated_at` are untouched by
Follow-Up Preparation, idempotency (repeated call, same row, no duplicate), unauthenticated rejection,
and cross-user isolation (both preparation and read) — **PASS, executed against a real database** (the
`acos_postgres_test` container on `localhost:5433` was already running and reachable in this
environment; not mocked).

**No-send verification** — grep of every new/changed file (`packages/core-followup-preparation/src`,
`apps/worker/src/searchWorker/worker.ts`, `apps/worker/src/index.ts`,
`apps/worker/src/searchWorker/worker.test.ts`, the migration SQL, the integration test, and every
`package.json` touched) for
`send\(|dispatch\(|deliver\(|schedule\(|transport|smtp|sms|whatsapp|crm|core-outreach'|core-proposal'|
fetch\(|axios|nodemailer|twilio|sendgrid` — **every hit classified**: doc comments explicitly
documenting the *absence* of send/schedule capability ("no-send", "never a sending mechanism", "no
transport dependency"), and the `no-send.test.ts` suite's own detection regex/assertions (which exist
to forbid send/schedule code, not implement it). **No executable send, schedule, dispatch, or delivery
path found** — **PASS**.

**Repo-wide typecheck** — `pnpm run typecheck`: 29/29 package typecheck tasks — **PASS**.

**Repo-wide unit/component tests** — `pnpm run test`: 29/29 package test tasks — **PASS**.

**Full integration suite** — `pnpm run test:integration`: 502 tests passed across 40 files (1 file
skipped — `webhook-idempotency.test.ts`, the same pre-existing, unrelated skip the Phase 20/21/22
closures already documented), including `phase18-e2e.integration.test.ts` and
`search-worker.integration.test.ts` passing **unchanged** — direct evidence the pre-existing pipeline
is unaffected.

`git diff --check`: **PASS** (no whitespace errors).

No test was environment-BLOCKED in this run — PostgreSQL was reachable throughout.

## Boundary Preservation

```text
Phase 18 remains CLOSED and unchanged.
Phase 19 remains CLOSED and unchanged.
Phase 20 remains CLOSED and unchanged.
Phase 21 remains CLOSED and unchanged.
Phase 22 remains CLOSED and unchanged.
```

Verified directly: `git diff --stat -- packages/core-discovery packages/core-research
packages/core-service-profile packages/core-opportunity packages/core-qualification
packages/core-personalization packages/core-outreach-preparation requirement/PHASE_18_*
requirement/PHASE_19_* requirement/PHASE_20_* requirement/PHASE_21_* requirement/PHASE_22_*` returns
**empty** — zero lines changed in any Phase 18–22 package or its scope-lock/closure documents.
`git diff --stat -- packages/core-outreach packages/core-proposal` also returns **empty** — neither
pre-existing deferred package was touched.

The only modified files are `apps/web/tsconfig.tsbuildinfo` (pre-existing, unrelated drift that
predates this phase), `apps/worker/package.json`, `apps/worker/src/index.ts`,
`apps/worker/src/searchWorker/worker.ts`, `apps/worker/src/searchWorker/worker.test.ts`,
`tests/package.json`, `pnpm-lock.yaml` (additive workspace-dependency entries only, confirmed by
inspection — no version of an existing dependency was downgraded or removed). New files are
`packages/core-followup-preparation/**`, `packages/db/prisma/migrations/0025_followup_preparations/
migration.sql`, `tests/integration/followup-preparation.integration.test.ts`,
`requirement/PHASE_23_FOLLOWUP_PREPARATION_SCOPE_LOCK.md`, and this closure document.

## Requirement-by-requirement status

| Req | Status | Evidence |
|---|---|---|
| R-61 Input boundary | PASS | service.ts consumes only `opportunities`/`outreachPreparations`; no `signals`/`personalizations`/`qualifications` dependency exists in the package at all |
| R-62 Eligibility | PASS | service.test.ts + integration test: no Outreach Preparation row yields `null`, zero rows written |
| R-63 Evidence provenance | PASS | generator.test.ts + integration test: `evidence` equals the source Outreach Preparation's own evidence set, `source_outreach_preparation_id` FK enforced at the database |
| R-64 Draft generation | PASS | generator.test.ts: deterministic, single-input (`StoredOutreachPreparation` only), no LLM/fetch; produces context/content/evidence/state/rationale |
| R-65 Persistence | PASS | `UNIQUE(opportunity_id)` + upsert; no mutation of upstream tables (service.test.ts + integration `updated_at` checks) |
| R-66 Pipeline integration | PASS | worker.test.ts ordering test `[outreachPreparation, followUpPreparation]`; nested-branch guard test |
| R-67 Human review boundary | PASS | terminal state is `READY_FOR_REVIEW`; no function in the package executes or transitions past it |
| R-68 No-send/no-execution | PASS | no-send.test.ts (structural + runtime proof, plus explicit `core-outreach`/`core-proposal` import check); migration CHECK constraint rejecting `'SENT'`; grep of the full diff finds no executable send/schedule path |
| R-69 Idempotency/failure isolation | PASS | unit + integration idempotency tests; worker failure-isolation test leaves all upstream state untouched |

## Remaining Limitations

- No live/production validation was performed — this closure covers unit tests, a real-but-local
  PostgreSQL integration suite, and typecheck only, per the governing instructions' prohibition on
  fabricating live validation.
- No HTTP/API route exposes `prepareOpportunityFollowUp`/`getOpportunityFollowUpPreparation` yet — out
  of scope per the governing instructions (R-66 only requires worker-pipeline integration); the same
  gap the Phase 20/21/22 closures already documented for their own artifacts.
- `followUpContext`/`followUpContent` wording is a new, unreviewed template — built only from the
  Opportunity's own already-persisted Outreach Preparation fields, never a new fact, but the exact
  sentence phrasing has not been product-reviewed. No human-facing surface displays it in this phase.
- `packages/core-outreach` and `packages/core-proposal` (SENT-state/LLM-backed and pricing/versioning,
  respectively, both unwired) remain exactly as they were — present, untested by this phase, and
  unreferenced.
- Actual follow-up sending, scheduling, or delivery, of every kind, remains entirely unimplemented —
  by design. This phase's terminal state is `READY_FOR_REVIEW`; nothing in this codebase can move a
  follow-up preparation past that state.

## Deviations from the scope-lock

None. Every R-61–R-69 requirement was implemented as specified; no requirement was descoped,
weakened, or reinterpreted.
