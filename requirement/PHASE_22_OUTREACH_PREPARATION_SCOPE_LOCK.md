# PHASE 22 — OUTREACH PREPARATION / NO-SEND EXECUTION BOUNDARY — SCOPE LOCK

## 1. Status

**DRAFT — SCOPE LOCK, PRE-IMPLEMENTATION.**

This document is written before any Phase 22 code exists. It is checked for internal consistency
against the repository (Section 16) before implementation begins, per the governing instructions'
"Implementation Rule." It becomes historical record once Phase 22 closes; it is not amended after
implementation to match what was built — deviations, if any, are reported in the closure document
instead.

## 2. Baseline Commit

```text
a7344d2  — phase21: implement personalization
```

Phase 18, Phase 19, Phase 20, Phase 21 are **CLOSED and FROZEN** as of this baseline. This scope
lock authorizes work strictly additive to that baseline.

## 3. Problem Statement

The canonical pipeline (Discovery → Research → Opportunity → Qualification → Personalization)
currently ends at Personalization: a structured, evidence-backed artifact exists per Opportunity,
but nothing downstream turns it into a form a human could act on, and no artifact exists that a
future Outreach-sending phase could read without re-deriving it. There is no requirement, contract,
or persisted record between "Personalization was generated" and "a human could review a prepared
outbound message." Phase 22 closes exactly that gap — and only that gap.

## 4. Objective

Add a new, minimal, structurally inert **Outreach Preparation** layer that consumes the existing
Opportunity/Qualification/Personalization outputs and produces one persisted, human-reviewable
draft message per Opportunity — traceable to the exact evidence Personalization already selected,
generated deterministically with no new evidence selection, no LLM call, and **no code path capable
of transmitting it**. The artifact's terminal state is "ready for a human to review." There is no
state, function, dependency, or execution path in this phase that represents or performs sending.

## 5. Requirement IDs R-54 through R-60

### R-54 — Outreach Preparation Contract
A canonical `StoredOutreachPreparation` record type, consuming existing Opportunity/Qualification
(transitively, via Personalization's own eligibility gate)/Personalization outputs. States:
`PREPARED`, `READY_FOR_REVIEW` only. No `SENT`, `DELIVERED`, or `SCHEDULED` value exists anywhere
in the type, the database CHECK constraint, or any code path.

- **Inputs:** `StoredPersonalization` (read-only), `Opportunity` (read-only, ownership check only).
- **Outputs:** `StoredOutreachPreparation`.
- **Persistence:** `outreach_preparations` table (migration `0024`).
- **Dependencies:** `@acos/core-opportunity` (ownership), `@acos/core-personalization` (content +
  evidence source), `@acos/core-identity` (token-authenticated entry point).

### R-55 — Outreach Draft Generation
`generateOutreachPreparation()` — pure, deterministic, synchronous. Input is exactly one
already-persisted `StoredPersonalization` row; output is `subjectLine`/`messageBody`/
`callToAction`/`evidence`. No LLM, no external fetch, no randomness, no clock. No new Discovery,
Research, Qualification, or Personalization call. `needDetected` is never read or re-derived.

- **Purpose:** turn an already-approved Personalization artifact into a message shape, nothing
  more.
- **Inputs:** `StoredPersonalization`.
- **Outputs:** `OutreachPreparationGeneration` (pure value).
- **Persistence:** none (pure function; persistence is R-57).
- **Dependencies:** `@acos/core-personalization` types only.

### R-56 — Outreach Evidence Provenance
The draft's `evidence` field is `PersonalizationEvidenceItem[]`, copied **unmodified, by reference
identity of content** from `StoredPersonalization.evidence` — never re-derived from
`ResearchSignal`, never independently selected, never widened or narrowed. The chain
`ResearchSignal → Qualification.evidenceSignalIds → Personalization.evidence → OutreachPreparation.evidence`
is preserved exactly; this phase adds a fourth link, not a parallel path.

- **Purpose:** guarantee every claim in a prepared draft is traceable to evidence Qualification and
  Personalization already proved sufficient.
- **Inputs:** `StoredPersonalization.evidence`.
- **Outputs:** `StoredOutreachPreparation.evidence`.
- **Persistence:** `outreach_preparations.evidence` (JSONB, same shape as `personalizations.evidence`).
- **Dependencies:** `@acos/core-personalization`'s `PersonalizationEvidenceItem` type (imported,
  not redefined).

### R-57 — Outreach Persistence / Idempotency
One current row per Opportunity: `UNIQUE(opportunity_id)`, `INSERT ... ON CONFLICT (opportunity_id)
DO UPDATE`, mirroring `qualifications` (migration 0022) and `personalizations` (migration 0023)
exactly. Re-running against an unchanged Personalization overwrites the same row with unchanged
content — no new row. `ResearchSignal`, `Opportunity`, `Qualification`, and `Personalization` rows
are never written by this layer.

- **Purpose:** current-state, not history — consistent with the two layers immediately upstream.
- **Inputs:** `opportunityId`, `prospectId`, `sourcePersonalizationId`, `OutreachPreparationGeneration`.
- **Outputs:** `StoredOutreachPreparation`.
- **Persistence:** `outreach_preparations`, `UNIQUE(opportunity_id)`.
- **Dependencies:** none beyond the table itself.

### R-58 — Outreach No-Send Safety Gate
**The most important requirement in this phase.** Structural, not a runtime flag:

- The `core-outreach-preparation` package imports no HTTP client, no SMTP library, no messaging
  SDK (Twilio/SendGrid/SES/WhatsApp/LinkedIn), no browser-automation library, and calls no global
  `fetch`/`http`/`https` anywhere in its own source.
- No function in the package is named or shaped like a sender (no `send`, `dispatch`, `deliver`,
  `transmit`).
- No worker, poll loop, scheduler, or retry mechanism reads `outreach_preparations` for the
  purpose of transmission — none is created by this phase.
- No `SENT`/`DELIVERED`/`SCHEDULED` state exists in the type, the schema, or any test fixture.
- No HTTP route exposes a send action (none is added by this phase at all — see Section 8).
- A dedicated test suite (`no-send.test.ts`, R-58) asserts, at runtime, that generating and
  persisting a draft through the full service path invokes zero calls to a stubbed-and-poisoned
  `globalThis.fetch` (configured to throw if called), and a static grep-based check documents the
  absence of transport-capable imports.

### R-59 — Worker Pipeline Integration
`apps/worker/src/searchWorker/worker.ts`'s `runCanonicalPipeline()` gains one more nested,
optional step, immediately after Personalization:

```text
await evaluateQualificationForOwner(...)          // Phase 20, unchanged
  └─ if deps.personalizations:
       await evaluatePersonalizationForOwner(...) // Phase 21, unchanged
         └─ if deps.outreachPreparations:
              await prepareOutreachForOwner(...)  // Phase 22, new
```

`deps.outreachPreparations` is optional, for the identical, already-precedented reason
`deps.qualifications` and `deps.personalizations` are optional (Phase 20/21 closures) — so no
pre-Phase-22 caller of `SearchWorkerDeps` needs to change merely to keep compiling. Structurally
unreachable outside the `deps.personalizations` branch, so it cannot run before Opportunity,
Qualification, or Personalization succeeded in this pass. A Phase 22 failure (thrown by
`prepareOutreachForOwner`) propagates exactly like a Phase 21 failure: the Search attempt is
recorded as `retry`/`failed`; `ResearchSignal`, `Opportunity`, `Qualification`, and
`Personalization` rows already written earlier in the same pass are left untouched (they were
already committed via their own upserts before this step runs).

### R-60 — Ownership / Tenant Isolation
`OutreachPreparationRepository.upsert()` carries no `userId` parameter — ownership is inherited via
`opportunity_id → opportunities.user_id` (DEC-008's fifth named exception, alongside
`research_signals`, `opportunity_scores`, `qualifications`, `personalizations`). The read side
(`getByOpportunityId`, `listByUserId`) takes `userId` and enforces it via a join to `opportunities`
in `pgRepository.ts` — the same independent, second check `qualifications`/`personalizations`
already use, never trusting the caller's own prior ownership check alone. The worker path
(`prepareOutreachForOwner`) takes `userId` only from the claimed `Search` row, exactly like
Qualification and Personalization. No `userId` is ever accepted from a Prospect, Opportunity
payload, request body, or any other caller-supplied source.

## 6. Architecture

```text
Existing component                    New component                  Persistence            Worker integration
-------------------                    -------------                  -----------            ------------------
StoredPersonalization         ──read──▶ generateOutreachPreparation()  (pure, no I/O)
(opportunityId, prospectId,             │
 offerService, openingContext,          ▼
 valueProposition, evidence)   StoredOutreachPreparation          outreach_preparations   runCanonicalPipeline():
                                (subjectLine, messageBody,        (migration 0024,           ...Qualification
                                 callToAction, evidence,           UNIQUE(opportunity_id),      └─Personalization
                                 state: READY_FOR_REVIEW)          FK → opportunities,             └─OutreachPreparation
                                                                    FK → personalizations)             (new, optional,
                                                                                                          nested last)
```

New package: **`packages/core-outreach-preparation`**, mirroring `@acos/core-personalization`'s own
internal structure file-for-file:

- `src/types.ts` — `OUTREACH_PREPARATION_STATES`, `StoredOutreachPreparation`,
  `OutreachPreparationGeneration`.
- `src/generator.ts` — `generateOutreachPreparation()`, `GENERATOR_VERSION`.
- `src/repository.ts` / `src/pgRepository.ts` — `OutreachPreparationRepository` +
  `createPgOutreachPreparationRepository()`.
- `src/service.ts` — `prepareOpportunityOutreach()` (token-authenticated, unused by any route yet —
  present only for symmetry with Personalization's own split, see Section 8),
  `prepareOutreachForOwner()` (worker-callable), `getOpportunityOutreachPreparation()`.
- `src/testSupport.ts` — `fakeOutreachPreparationRepository()`.
- `src/no-send.test.ts` — R-58's dedicated proof suite.
- `src/index.ts` — public exports.

**Why a new package, not `core-outreach`:** `packages/core-outreach` (present since the initial
architecture commit, never wired into any pipeline) was inspected first, per instruction. It
defines `APPROVAL_STATES = ['DRAFT', 'APPROVED', 'REJECTED', 'SENT']` and a `markSent()` transition,
an LLM-backed generator (`OutreachModel`), and an independently-chosen evidence pool
(`quote`/`sourceUrl` pairs, not `ResearchSignal` ids) unrelated to Qualification's
`evidenceSignalIds`. Reusing it would violate R-54 (no `SENT` state), R-55 (default: no LLM), and
R-56 (evidence must chain from Qualification/Personalization, not an independent pool) by
construction. `core-outreach` contains no actual transport code (verified: no `fetch`/`http`/
`smtp`/SDK import anywhere in it), so it is not itself unsafe — but its *shape* is incompatible with
this phase's contract. It is left **completely untouched**, importing nothing from it and being
imported by nothing in it. It remains deferred/future infrastructure, exactly as
`MVP_SCOPE_BOUNDARY.md` and PRD Conflict C-5 already classify it.

## 7. Data Model

New migration `packages/db/prisma/migrations/0024_outreach_preparations/migration.sql` (next
number after `0023`, per DEC-006):

```sql
CREATE TABLE "outreach_preparations" (
    "id"                         TEXT NOT NULL,
    "opportunity_id"             TEXT NOT NULL,
    "prospect_id"                TEXT NOT NULL,
    "source_personalization_id"  TEXT NOT NULL,

    "state"                      TEXT NOT NULL,

    "subject_line"               TEXT NOT NULL,
    "message_body"               TEXT NOT NULL,
    "call_to_action"             TEXT NOT NULL,

    "evidence"                   JSONB NOT NULL,

    "generator_version"          TEXT NOT NULL,
    "generated_at"               TIMESTAMP(3) NOT NULL,

    "created_at"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at"                 TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outreach_preparations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "outreach_preparations_opportunity_id_fkey"
        FOREIGN KEY ("opportunity_id") REFERENCES "opportunities"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outreach_preparations_source_personalization_id_fkey"
        FOREIGN KEY ("source_personalization_id") REFERENCES "personalizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "outreach_preparations_state_check"
        CHECK ("state" IN ('PREPARED', 'READY_FOR_REVIEW'))
);

CREATE UNIQUE INDEX "outreach_preparations_opportunity_id_key" ON "outreach_preparations"("opportunity_id");
```

No `sent_at`, `delivered_at`, `scheduled_at`, `approved_by`, or `approval_state` column exists —
the schema itself is physically incapable of representing transmission or an approval-to-send
workflow (R-58, "prefer structural safety over a runtime flag" applied at the data-model level too).

Ownership: **no `user_id` column** — inherited through `opportunity_id → opportunities.user_id`
(DEC-008's fifth named exception), consistent with `research_signals`, `opportunity_scores`,
`qualifications`, and `personalizations`.

`packages/db/prisma/schema.prisma` is **not modified** — it is a separately-scoped, six-model
commerce/Meta-attribution schema (DEC-001) that Phase 18–21 also never touched; this phase follows
the same precedent and continues to manage this table via a raw-SQL migration only.

## 8. Explicit In-Scope

- New package `packages/core-outreach-preparation` implementing R-54 through R-58.
- New migration `0024_outreach_preparations`.
- `apps/worker/src/searchWorker/worker.ts`: one new optional dependency
  (`outreachPreparations?: OutreachPreparationRepository`) and one new nested call inside the
  existing `if (deps.personalizations)` branch (R-59).
- `apps/worker/src/index.ts`: wiring `createPgOutreachPreparationRepository(pool)` into the real
  poll loop's deps, mirroring the Qualification/Personalization wiring exactly.
- `apps/worker/package.json`, `tests/package.json`: additive `@acos/core-outreach-preparation`
  workspace dependency (mirrors the Phase 21 pattern exactly).
- `pnpm-lock.yaml`: regenerated for the new workspace package link only.
- A token-authenticated `prepareOpportunityOutreach()` service entry point, present for structural
  symmetry with `evaluateOpportunityPersonalization()` — **not wired to any HTTP route**, since none
  exists for Personalization either (documented as a known gap in the Phase 21 closure) and adding
  one is not named by any R-54..R-60 requirement.
- Unit tests (`core-outreach-preparation`), worker pipeline tests (ordering, failure isolation,
  idempotency — mirroring the Phase 21 additions to `worker.test.ts`), and one real-PostgreSQL
  integration test file (`tests/integration/outreach-preparation.integration.test.ts`, mirroring
  `personalization.integration.test.ts`).
- This scope-lock and, once all gates pass, the Phase 22 closure document.

## 9. Explicit Out-of-Scope

Recorded verbatim from the governing instructions, all confirmed **not implemented**:

- Actual outreach sending (email, WhatsApp, SMS, LinkedIn messaging, cold-call execution, browser
  automation for sending).
- SMTP integration; SendGrid/SES/Twilio/any messaging-provider SDK; WhatsApp API; LinkedIn API.
- Automated or scheduled follow-up sending; cadence scheduling; any background job capable of
  transmitting a message externally.
- Delivery tracking, open/click tracking, reply processing, unsubscribe handling.
- CRM; proposal generation; payment/subscription; autonomous sales-agent behavior.
- New Discovery, new Research, new Qualification logic, new Personalization logic; changing
  `needDetected`; modifying `ResearchSignal` semantics.
- Any modification to Phase 18–21 contracts, repositories, schemas, migrations, tests, worker
  behavior, or scope-lock/closure documents.
- Wiring, enabling, or modifying `packages/core-outreach`, `packages/core-proposal`, or
  `packages/core-acquisition`'s `cadence.ts`/`followUp.ts` in any way. They remain exactly as they
  are today: present, untested-by-this-phase, and unreferenced outside their own directories.
- A `SENT`, `DELIVERED`, or `SCHEDULED` state, or any field that could be read as recording a
  successful transmission (`sentAt`, `deliveredAt`, etc.).

## 10. No-Send Safety Model

Layered, structural — not a single runtime check:

1. **No transport dependency exists.** `core-outreach-preparation`'s `package.json` depends only on
   `@acos/core-entitlements` (for the `SqlExecutor` type), `@acos/core-identity`,
   `@acos/core-opportunity`, and `@acos/core-personalization`. No HTTP client, no SMTP library, no
   provider SDK is a dependency, directly or transitively introduced by this phase.
2. **No transport-capable code exists.** Verified by grep (R-58's validation evidence) across the
   new package and the worker diff for `fetch(`, `http`, `smtp`, `axios`, provider SDK names, and
   browser-automation library names.
3. **No state represents transmission.** The type union, the database `CHECK` constraint, and every
   test fixture are limited to `PREPARED`/`READY_FOR_REVIEW`.
4. **No caller can reach a send action.** No HTTP route, worker, scheduler, or CLI entry point calls
   anything resembling "send" against an `outreach_preparations` row — none is created by this
   phase, and no existing route is modified to add one.
5. **Runtime proof, not just inspection.** `no-send.test.ts` stubs `globalThis.fetch` to throw
   `Error('no-send boundary violated: fetch was called')` for the duration of the test, then
   exercises the full `prepareOutreachForOwner()` path end-to-end (generate → persist → read back)
   and asserts it completes successfully with the stub never invoked.

## 11. Dependencies

Phase 22 depends on the existing, completed, and frozen outputs of:

- Phase 18 — provider execution (Discovery/Research write the `ResearchSignal`s Qualification
  scored).
- Phase 19 — provider robustness / Service Profile contract.
- Phase 20 — Qualification (`qualifications.state`, `evidenceSignalIds`).
- Phase 21 — Personalization (`personalizations.offerService`, `.openingContext`,
  `.valueProposition`, `.evidence`) — the **only** upstream table this phase's generator reads.

These are consumed strictly as already-persisted, read-only inputs through
`@acos/core-personalization`'s and `@acos/core-opportunity`'s own public repository interfaces. No
Phase 18–21 contract, migration, or table is modified. If any dependency is found broken during
implementation, this phase stops and reports it rather than repairing it (per the governing
instructions) — no such breakage was found during scope-lock preparation (Section 16).

## 12. Acceptance Criteria

| ID | Criterion |
|---|---|
| AC-01 | A canonical `StoredOutreachPreparation` contract exists in `core-outreach-preparation/src/types.ts` and is documented in this scope-lock. |
| AC-02 | Given a QUALIFIED Opportunity with a persisted Personalization, `prepareOutreachForOwner()` generates a deterministic draft (same input → byte-identical output). |
| AC-03 | Every `StoredOutreachPreparation.evidence` item's `signalId` is a member of the source Personalization's own `evidence` set (subset by construction — it is a direct copy). |
| AC-04 | `generateOutreachPreparation()` invents no company fact, metric, testimonial, relationship, funding detail, technology-usage claim, or hiring signal not already present in the input `StoredPersonalization`. |
| AC-05 | A `prepareOutreachForOwner()` call for an eligible Opportunity persists exactly one `outreach_preparations` row. |
| AC-06 | Two successive `prepareOutreachForOwner()` calls against an unchanged Personalization produce exactly one row (no duplicate), same `id`. |
| AC-07 | A second user's `prepareOpportunityOutreach()`/`getOpportunityOutreachPreparation()` call against the first user's Opportunity is rejected/returns not-found — never returns or writes cross-owner data. |
| AC-08 | `claimAndProcessNextSearch()` on a QUALIFIED, personalized Opportunity executes Opportunity → Qualification → Personalization → OutreachPreparation, in that order, provably via a call-order spy (mirrors the existing Phase 21 worker test). |
| AC-09 | Running the full Phase 22 pipeline path (unit + integration) results in zero calls to a poisoned `fetch` stub, and a grep of the Phase 22 diff finds no executable send path (Section 10). |
| AC-10 | `outreach_preparations.state`'s `CHECK` constraint and the TypeScript union both admit only `PREPARED`/`READY_FOR_REVIEW` — no `SENT`/`DELIVERED`/`SCHEDULED` value is accepted by either. |
| AC-11 | `git diff --stat` against baseline `a7344d2` shows zero changes under `packages/core-discovery`, `packages/core-research`, `packages/core-service-profile`, `packages/core-opportunity`, `packages/core-qualification`, `packages/core-personalization`, `packages/core-search`, `packages/core-identity`, `packages/core-entitlements`, and zero changes to `requirement/PHASE_18_*`, `PHASE_19_*`, `PHASE_20_*`, `PHASE_21_*` documents. |
| AC-12 | `pnpm run typecheck` and `pnpm run test` (repo-wide) pass; the new integration test passes against real PostgreSQL when reachable. |

## 13. Validation Plan

| Evidence | Requirement(s) | Execution class |
|---|---|---|
| `core-outreach-preparation` unit tests (generator determinism, evidence pass-through, no fabrication, repository upsert/idempotency via `testSupport.ts` fake) | R-54, R-55, R-56, R-57 | **must execute** |
| `no-send.test.ts` (poisoned-`fetch` runtime proof + structural grep) | R-58 | **must execute** |
| `apps/worker` unit tests: pipeline ordering, "never runs before Personalization ran," failure isolation, idempotency-on-retry (mirroring the four Phase 21 additions to `worker.test.ts`) | R-59 | **must execute** |
| Real-PostgreSQL integration test `tests/integration/outreach-preparation.integration.test.ts`: schema shape (no `user_id`, no send-state columns, `UNIQUE(opportunity_id)`), generate→persist→read-back, eligibility gate (no Personalization yet → null, no row), idempotency, cross-user isolation (both evaluate and read), unauthenticated rejection | R-56, R-57, R-59, R-60 | **must execute when PostgreSQL is reachable; code-inspected and reported as such otherwise** |
| `pnpm run typecheck` (repo-wide) | AC-12 | **must execute** |
| `pnpm run test` (repo-wide) | AC-12 | **must execute** |
| `pnpm --filter @acos/tests run test:integration` (full suite, includes `phase18-e2e` / `search-worker` integration tests unchanged) | AC-11 boundary proof | **must execute when PostgreSQL is reachable** |
| `git diff --stat` / `git diff --check` against baseline for frozen-phase directories and closure docs | AC-11 | **must execute** |
| Grep of the Phase 22 diff for `send`/`smtp`/`email`/`whatsapp`/`linkedin`/`twilio`/`ses`/`sendgrid`/`browser`/`playwright`, with each hit classified as harmless (doc/comment) or executable | AC-09 | **must execute** |
| Production/live send-attempt verification | R-58 | **not required** — there is no send path to exercise against a live provider; the absence itself is what is being proven, structurally and by the poisoned-fetch test above |

Never reported as executed unless it actually was; PostgreSQL reachability is checked, not assumed,
before claiming integration-test evidence in the closure document.

## 14. Risks

- **PRD Conflict C-5 / `MVP_SCOPE_BOUNDARY.md` §6 name `core-outreach` specifically as blocked from
  being wired "in any phase" until its database-level send gate is restorable.** This phase does not
  wire `core-outreach` — it builds a parallel, structurally send-incapable package instead (Section
  6). C-5's hazard (an approval-to-send workflow whose database enforcement is missing) does not
  apply to a package that has no send state and no approval-to-send workflow at all. This is
  recorded here as a documented judgment call, not a silent scope expansion.
- **Ambiguity in `PREPARED` vs `READY_FOR_REVIEW`.** R-54 requires the contract to distinguish both
  from any transmission-implying state, without specifying what distinguishes them from each other.
  Decision O1 (mirroring the Phase 21 scope-lock's own Decision P3 for `PersonalizationState`):
  `generateOutreachPreparation()` always produces `READY_FOR_REVIEW` for v1, since generation is
  synchronous, complete, and gated on Personalization already having succeeded — there is no
  intermediate state a v1 draft could be caught in. `PREPARED` is kept in the type/CHECK constraint
  as a genuine, forward-compatible second value (e.g., a future phase introducing a verification
  step between generation and review-readiness), not invented business logic exercised now.
- **`subjectLine`/`callToAction` wording is template-generated from `offerService`.** `offerService`
  is itself a persisted fact (the Opportunity's own recommended offer, Phase 21 R-47) — never a new
  invention — but the exact sentence wording is a new, unreviewed template. Flagged for product
  review before any human-facing surface displays it; no such surface is built in this phase.
- **No HTTP read route for the new artifact.** Same gap the Phase 20 and Phase 21 closures already
  documented for their own artifacts — consistent with precedent, not a Phase 22 regression.

## 15. Closure Gate

Phase 22 may be declared `PASS / CLOSED` only when every item in the governing instructions'
Closure Gate list is true, evidenced in `requirement/PHASE_22_OUTREACH_PREPARATION_CLOSURE.md`:
R-54 through R-60 individually PASS; unit/typecheck/integration tests PASS (integration marked
executed-or-deferred honestly per Section 13); no-send verification PASS; ownership verification
PASS; idempotency verification PASS; pipeline-order verification PASS; `git diff --check` PASS;
and the Phase 18/19/20/21 boundary PASS (Section 16 method, re-run at closure time).

## 16. Phase 18–21 Frozen-Boundary Statement

As of this scope-lock (baseline `a7344d2`, before any Phase 22 code is written):

```text
git diff --stat HEAD -- packages/core-discovery packages/core-research packages/core-service-profile \
  packages/core-qualification packages/core-opportunity packages/core-personalization \
  packages/core-search packages/core-identity packages/core-entitlements apps/worker
```

returns **empty** — confirmed at scope-lock time. This phase's plan touches none of their
contracts, repositories, schemas, migrations, tests, or worker logic beyond the one additive,
optional, nested integration point named in Section 5 (R-59) and Section 8. `requirement/PHASE_18_*`,
`PHASE_19_*`, `PHASE_20_*`, `PHASE_21_*` scope-lock and closure documents are read-only references
for this phase and are not edited. This statement is re-verified, not merely repeated, at closure
time (Section 15).
