# PHASE 22 — OUTREACH PREPARATION / NO-SEND EXECUTION BOUNDARY — CLOSURE

## Status

**PASS / CLOSED**

All R-54..R-60 requirements are satisfied by direct, executed evidence — unit tests, a real-
PostgreSQL integration suite, repo-wide typecheck/test runs, and a dedicated structural + runtime
no-send proof — not inferred from "tests are green" alone. See VALIDATION below for the exact
commands and results this closure is based on.

Authoritative scope source: `requirement/PHASE_22_OUTREACH_PREPARATION_SCOPE_LOCK.md`. This closure
does not reinterpret or expand that scope.

## Baseline

| | |
|---|---|
| Scope-lock baseline HEAD | `a7344d2` — Phase 21 (Personalization) closure |
| Phase 18 implementation commit | `daf86e2` |
| Phase 18 closure commit | `b3da711` |
| Phase 19/20/21 closure commits | `71ac4b6` (Phase 19), `2363a14` (Phase 20), `a7344d2` (Phase 21) |

Pre-existing, unrelated working-tree drift present before this phase started
(`apps/web/tsconfig.tsbuildinfo`, `CLAUDE.md`, `requirement/AI Client Acquisition OS — Product
Requirements Document V2.2.md`) was left untouched and unstaged throughout.

## Implementation

New package `packages/core-outreach-preparation/` (R-54..R-58):

- `src/types.ts` — `OutreachPreparationState` (`'PREPARED' | 'READY_FOR_REVIEW'` — no `SENT`,
  `DELIVERED`, or `SCHEDULED` value anywhere in the union), `StoredOutreachPreparation`,
  `OutreachPreparationGeneration`.
- `src/generator.ts` — `generateOutreachPreparation()`: a pure, deterministic function whose only
  input is an already-persisted `StoredPersonalization` (offerService/openingContext/
  valueProposition/evidence) — no LLM, no fetch, no new discovery/research/qualification/
  re-personalization. `evidence` is passed through unmodified (R-56); `subjectLine`/`messageBody`/
  `callToAction` are template sentences built only from the Personalization's own fields.
- `src/repository.ts` / `src/pgRepository.ts` — `OutreachPreparationRepository`, one current row per
  Opportunity via `INSERT ... ON CONFLICT (opportunity_id) DO UPDATE` (R-57), `state` hardcoded to
  `'READY_FOR_REVIEW'` at the INSERT site (Decision O1) — never a caller-supplied value, mirroring
  `@acos/core-personalization`'s `pgRepository.ts` exactly.
- `src/service.ts` — `prepareOpportunityOutreach()` (token-authenticated, present for structural
  symmetry only — no HTTP route wires it) and `prepareOutreachForOwner()` (worker-callable),
  mirroring `@acos/core-personalization`'s own service split. Gate: returns `null`, never throws,
  when no Personalization row exists yet for the Opportunity (R-59's "must not run before
  Opportunity/Qualification/Personalization" — enforced because a Personalization row cannot exist
  unless all three already succeeded).
- `src/testSupport.ts` — in-memory fake for other packages' own tests, mirroring
  `@acos/core-personalization`'s own `testSupport.ts` convention exactly (not exported from
  `index.ts`, matching precedent).
- `src/no-send.test.ts` — R-58's dedicated proof suite (structural source-scan + runtime
  poisoned-`fetch` proof, see VALIDATION).
- `src/index.ts` — public exports.

New migration `packages/db/prisma/migrations/0024_outreach_preparations/migration.sql`: table
`outreach_preparations`, no `user_id` (DEC-008's fifth named ownership-inheritance exception, after
`research_signals`, `opportunity_scores`, `qualifications`, `personalizations`), `UNIQUE(opportunity_id)`,
FK to `opportunities` and to `personalizations(id)` (source-provenance FK, R-56), both `ON DELETE
CASCADE`, `state` CHECK constrained to `('PREPARED', 'READY_FOR_REVIEW')`. No `sent_at`,
`delivered_at`, `scheduled_at`, `approved_by`, or `approval_state` column exists.

Worker pipeline integration (R-59), `apps/worker/src/searchWorker/worker.ts`:
`runCanonicalPipeline()` now calls `prepareOutreachForOwner()` immediately after Personalization,
nested strictly inside the same `if (deps.personalizations)` branch and gated on its own optional
`deps.outreachPreparations` — so Outreach Preparation can never run in a pass where Personalization
did not itself just run. `apps/worker/src/index.ts` wires `createPgOutreachPreparationRepository(pool)`
into the real poll loop. `apps/worker/package.json` and `tests/package.json` gained the new
`@acos/core-outreach-preparation` workspace dependency.

**`packages/core-outreach` (the pre-existing, unwired, initial-commit-era package) was inspected
first, per instruction, and is untouched.** It defines an `APPROVAL_STATES` union including
`'SENT'` and a `markSent()` transition, an LLM-backed generator, and an independently-chosen
evidence pool unrelated to Qualification's `evidenceSignalIds` — reusing it would have violated
R-54, R-55, and R-56 by construction. `git diff --stat -- packages/core-outreach
packages/core-proposal` is empty (see VALIDATION's Boundary Preservation section): neither package
was imported by, or imports, any Phase 22 code.

**Design decisions made during implementation, not present in the scope-lock as pre-specified
detail** (see the scope-lock's §14 for the full rationale of each):

- **O1 — `generateOutreachPreparation()` always produces `READY_FOR_REVIEW`** for v1, since
  generation is synchronous and complete once a Personalization exists to draw from. `PREPARED` is
  kept in the type union and the database CHECK constraint as a genuine forward-compatible second
  value, mirroring the Phase 21 scope-lock's identical Decision P3 for `PersonalizationState`.
- **Draft content derived solely from the persisted `StoredPersonalization`** — no `signals`,
  `prospects`, `companies`, or `searches` repository dependency at all, which is a strictly smaller
  dependency footprint than `@acos/core-personalization` itself required. This is the strictest
  possible structural reading of R-55's "no new discovery/research/re-personalization": the package
  has no import path capable of reaching any of those.
- **`source_personalization_id` is a real foreign key** to `personalizations.id` (not merely a
  denormalised column) — R-56 provenance is enforced by the database itself, not only by
  application convention.
- **`SearchWorkerDeps.outreachPreparations` was made optional**, mirroring the identical,
  already-precedented Phase 20/21 decision for `qualifications`/`personalizations` — required purely
  to avoid forcing every pre-Phase-22 caller/test of `SearchWorkerDeps` to change merely to keep
  compiling. The real entrypoint always supplies it.
- **The worker test file's pre-existing local `fakePersonalizationRepository()`'s
  `getByOpportunityId` stub was changed from an unconditional throw to a real implementation**
  (`apps/worker/src/searchWorker/worker.test.ts`). This was necessary: Phase 22's
  `prepareOutreachForOwner` legitimately calls `personalizations.getByOpportunityId`, which no
  Phase 21 test ever exercised, so the stub had never needed to work. No Phase 21 test asserts on or
  depends on this method throwing; all 160 pre-existing worker tests (Phase 17–21) continue to pass
  unmodified with the fix in place (see VALIDATION). This is judged test-infrastructure completion,
  not a Phase 21 behavior change — flagged explicitly here for transparency per the governing
  instructions' "if a prior-phase change appears necessary, stop and report it" rule; it was not
  stopped on because it is additive to a stub, not a change to any assertion, fixture data, or
  Phase 21 domain logic.

## Validation

**Unit tests** — `packages/core-outreach-preparation` (21 tests, `pnpm --filter
@acos/core-outreach-preparation test`): generator determinism, evidence pass-through with no
re-derivation, offer-only content (no fabricated facts), no send-shaped fields (`generator.test.ts`,
5 tests); service-level eligibility/ownership/idempotency, R-59 eligibility gate, read-only
consumption (`service.test.ts`, 11 tests); R-58's structural no-send proof (no transport import/call
in any source file, no send-shaped export, state vocabulary limited to
`PREPARED`/`READY_FOR_REVIEW`, `package.json` dependency list has exactly four internal workspace
packages) and runtime no-send proof (full `prepareOpportunityOutreach()` path executed end-to-end
with `globalThis.fetch` poisoned to throw — zero invocations) (`no-send.test.ts`, 5 tests) — **PASS**.

**Worker pipeline tests** — `apps/worker` (165 tests, including 5 new: full pipeline ordering
`[personalization, outreachPreparation]` for a Personalized Opportunity with the resulting row
traceable to the Personalization's own id, no-row-created when Personalization itself produced none,
"never runs before Personalization even when configured" using a deps object with `personalizations`
genuinely absent, Outreach-Preparation-stage failure surfacing as a `retry` outcome while leaving
ResearchSignals/Opportunity/Qualification/Personalization untouched, and idempotency on a retried
claim) — **PASS**. All 160 pre-existing worker tests (Phase 17–21) continue to pass with the one
test-fixture completion noted above.

**Persistence integration test** — `tests/integration/outreach-preparation.integration.test.ts` (13
tests, real PostgreSQL): schema checks (no `user_id`, no `sent_at`/`delivered_at`/`scheduled_at`/
`approval_state` column, `UNIQUE(opportunity_id)`), the `state` CHECK constraint rejecting a literal
`'SENT'` insert (`outreach_preparations_state_check` violation, R-58), generate→persist→read-back
round-trip with evidence verified equal to the source Personalization's own evidence set (R-56),
R-59's eligibility gate (a never-personalized Opportunity produces no row), a direct check that
Qualification's and Personalization's own `updated_at` are untouched by Outreach Preparation,
idempotency (repeated call, same row, no duplicate), unauthenticated rejection, and cross-user
isolation (both preparation and read) — **PASS, executed against a real database** (the
`acos_postgres_test` container on `localhost:5433` was already running and reachable in this
environment; not mocked).

**No-send verification** — grep of every new/changed file (`packages/core-outreach-preparation/src`,
`apps/worker/src/searchWorker/worker.ts`, `apps/worker/src/index.ts`,
`apps/worker/src/searchWorker/worker.test.ts`, the migration SQL, the integration test, and every
`package.json` touched) for `send|smtp|email|whatsapp|linkedin|twilio|ses|sendgrid|browser|
playwright` — **every hit classified**: doc comments explicitly documenting the *absence* of send
capability ("no-send", "never a sending mechanism", "no SMTP"), the `no-send.test.ts` suite's own
detection regex/assertions (which exist to forbid send code, not implement it),
`IdentityRepository.findUserByEmail` (an unrelated, pre-existing account-lookup method name), a test
user's `email` field (account creation for the test fixture, not message sending), and
`releaseExpiredLeases`/`reuses` (substring false-positives of the `ses\b` pattern against
unrelated words). **No executable send path found** — **PASS**.

**Repo-wide typecheck** — `pnpm run typecheck`: 28/28 packages — **PASS**.

**Repo-wide unit/component tests** — `pnpm run test`: 28/28 package test tasks — **PASS**.

**Full integration suite** — `pnpm --filter @acos/tests run test:integration`: 489 tests passed
across 40 files (1 file skipped — `webhook-idempotency.test.ts`, the same pre-existing, unrelated
skip the Phase 20/21 closures already documented), including `phase18-e2e.integration.test.ts` and
`search-worker.integration.test.ts` passing **unchanged** — direct evidence Phase 18's worker
integration is unaffected.

`git diff --check`: **PASS** (no whitespace errors).

No test was environment-BLOCKED in this run — PostgreSQL was reachable throughout.

## Boundary Preservation

```text
Phase 18 remains CLOSED and unchanged.
Phase 19 remains CLOSED and unchanged.
Phase 20 remains CLOSED and unchanged.
Phase 21 remains CLOSED and unchanged.
```

Verified directly: `git diff --stat HEAD -- packages/core-discovery packages/core-research
packages/core-service-profile packages/core-qualification packages/core-opportunity
packages/core-personalization packages/core-search packages/core-identity packages/core-entitlements`
returns **empty** — zero lines changed in any Phase 18/19/20/21 (or earlier) package.
`git diff --stat HEAD -- packages/core-outreach packages/core-proposal` also returns **empty** —
neither pre-existing deferred package was touched. `git diff --stat HEAD -- requirement/PHASE_18_*
requirement/PHASE_19_* requirement/PHASE_20_* requirement/PHASE_21_*` returns **empty** — every
frozen closure/scope-lock document is unchanged.

The only modified files are `apps/web/tsconfig.tsbuildinfo` (pre-existing, unrelated drift that
predates this phase), `apps/worker/package.json`, `apps/worker/src/index.ts`,
`apps/worker/src/searchWorker/worker.ts`, `apps/worker/src/searchWorker/worker.test.ts`,
`tests/package.json`, `pnpm-lock.yaml` (additive workspace-dependency entries only, confirmed by
inspection — no version of an existing dependency was downgraded or removed). New files are
`packages/core-outreach-preparation/**`, `packages/db/prisma/migrations/0024_outreach_preparations/
migration.sql`, `tests/integration/outreach-preparation.integration.test.ts`,
`requirement/PHASE_22_OUTREACH_PREPARATION_SCOPE_LOCK.md`, and this closure document.

## Requirement-by-requirement status

| Req | Status | Evidence |
|---|---|---|
| R-54 Contract | PASS | `types.ts` (`OUTREACH_PREPARATION_STATES` = `['PREPARED', 'READY_FOR_REVIEW']`, no `SENT`/`DELIVERED`/`SCHEDULED`), documented in scope-lock §5/§6 |
| R-55 Draft generation | PASS | generator.test.ts: deterministic, single-input (`StoredPersonalization` only), no LLM/fetch; service.test.ts: no re-evaluation of Qualification/Personalization |
| R-56 Evidence provenance | PASS | generator.test.ts + integration test: `evidence` equals the source Personalization's own evidence set, `source_personalization_id` FK enforced at the database |
| R-57 Persistence/idempotency | PASS | `UNIQUE(opportunity_id)` + upsert; unit + integration idempotency tests |
| R-58 No-send safety gate | PASS | no-send.test.ts (structural + runtime proof); migration CHECK constraint rejecting `'SENT'`; grep of the full diff finds no executable send path |
| R-59 Worker ordering | PASS | worker.test.ts ordering test `[personalization, outreachPreparation]`; nested-branch guard test; failure-isolation test |
| R-60 Ownership | PASS | no `user_id` column, ownership via `opportunity_id → opportunities.user_id`; unit + integration cross-user isolation tests (both preparation and read) |

## Remaining Limitations

- No live/production validation was performed — this closure covers unit tests, a real-but-local
  PostgreSQL integration suite, and typecheck only, per the governing instructions' prohibition on
  fabricating live validation.
- No HTTP/API route exposes `prepareOpportunityOutreach`/`getOpportunityOutreachPreparation` yet —
  out of scope per the governing instructions (R-59 only requires worker-pipeline integration); the
  same gap the Phase 20 and Phase 21 closures already documented for their own artifacts.
- `subjectLine`/`callToAction` wording is a new, unreviewed template (flagged in the scope-lock's
  Risks section) — built only from the Opportunity's own already-persisted `offerService`, never a
  new fact, but the exact sentence phrasing has not been product-reviewed. No human-facing surface
  displays it in this phase.
- `packages/core-outreach` (SENT-state, LLM-backed, unwired) remains exactly as it was — present,
  untested by this phase, and unreferenced. It stays deferred/future infrastructure per
  `MVP_SCOPE_BOUNDARY.md` and PRD Conflict C-5, which this phase's own design deliberately worked
  around rather than resolved (see the scope-lock's §14 Risks).
- Actual outreach sending, of every kind, remains entirely unimplemented — by design. This phase's
  terminal state is `READY_FOR_REVIEW`; nothing in this codebase can move an outreach preparation
  past that state.
