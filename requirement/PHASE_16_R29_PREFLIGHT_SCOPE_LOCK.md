# PHASE 16 — R-29 AI COST METERING

# PREFLIGHT / SCOPE LOCK

RESULT: READY TO IMPLEMENT

---

## BASELINE

```text
BASELINE_COMMIT:  1bb2725 (Phase 15: implement R-27 Tracking)
HEAD:              1bb2725
PHASE_15_COMMIT:   1bb2725
PRD_VERSION:       V2.2
WORKTREE_BEFORE:   M apps/web/tsconfig.tsbuildinfo (pre-existing, generated)
                   ?? CLAUDE.md (pre-existing, untracked)
                   ?? requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md (pre-existing, untracked)
```

Phases 1–15 are frozen. This document authorizes exactly one narrow exception (see PHASE-7 COMPATIBILITY EXCEPTION below) — nothing else in Phases 1–15 may change.

---

## AUTHORITATIVE SOURCES

1. `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` — R-29 (§912-920), AC-24 (§1758), Phase 16 roadmap designation (§1894-1957).
2. `requirement/MVP_SCOPE_BOUNDARY.md` — §249 ("did the search run, and what did it cost"), §6.5 (usage-based billing explicitly out of scope).
3. Repository evidence gathered across the preceding preflight sessions (`packages/core-research/**`, `packages/db/prisma/migrations/**`, `tests/integration/opportunity-feedback.integration.test.ts`, installed `@anthropic-ai/sdk` type declarations).
4. The explicit product decisions D1–D14 supplied by the user in this session, which resolve every item this preflight had previously flagged OPEN.

---

## CURRENT REQUIREMENT

> R-29 — AI COST / METERING. "AI execution cost must eventually be measurable per run and per user." MVP: **minimum instrumentation to understand execution cost.** FUTURE: usage metering, quotas, usage-based pricing, optimisation, subscription billing. Status: NOT IMPLEMENTED — the Anthropic adapter sets `max_tokens` and never reads the response's `usage` block; no cost record exists anywhere. (PRD V2.2:912-920)

AC-24: "AI execution cost for a Search is measurable after the run." (PRD V2.2:1758)

The PRD's Phase 16 roadmap entry (V2.2:1894-1900) explicitly disclaims inventing pricing architecture, a token-accounting policy, a database schema, or API behavior beyond this wording — this scope lock supplies those missing semantics via the explicit product decisions below, not by invention.

**AC-24 reinterpretation (explicit, per D2):** AC-24's literal wording names "a Search," but no code path connects a Search to any AI invocation in this repository (Search→AI execution is R-34/Phase 17 territory, not built). Per D2, Phase 16 meters the AI invocation at the level that actually exists and executes today — the Prospect-scoped research call (`runResearch()`) — not a Search. AC-24 is treated as satisfied at the Prospect level for Phase 16; a literal Search-level reading of AC-24 remains unmet until Phase 17 wires Search execution.

---

## REPOSITORY EVIDENCE

- **Provider adapter** — `packages/core-research/src/anthropicModel.ts:92-111` calls `client.messages.stream(...)`, awaits `stream.finalMessage()`, and reads only `stop_reason`/`content`. `response.usage` and `response.id` are read nowhere.
- **SDK confirms the fields exist** — installed `@anthropic-ai/sdk` type declarations: `Message.id: string` (unique per response) and `Message.usage: {input_tokens: number, output_tokens: number, cache_creation_input_tokens: number|null, cache_read_input_tokens: number|null, ...}`.
- **Call-boundary types drop usage** — `ModelResult` (`researcher.ts:58-59`) is `{kind:'json',value}|{kind:'refusal',category}`; `ResearchProvider.research()` (`provider.ts:23-25`) returns only `Promise<LeadResearch>`. Neither can carry usage today without the Phase-7 compatibility change below.
- **Retry loop = multiple real provider calls** — `researcher.ts:153-244`, `researchLead()` invokes `model(...)` up to `maxAttempts` (default 3) times (initial + repair rounds) per logical run; each is a separately billed Anthropic request. This is the repository basis for D1.
- **The real provider is unwired in production** — `grep -rln "createAnthropicResearchModel|ResearchProvider\b" apps packages | grep -v /core-research/` returns nothing; the only `ResearchProvider` implementation anywhere is `testSupport.ts`'s `fakeResearchProvider`. `runResearch()` (`service.ts:45-72`) is the only place `requireUser()` resolves `userId` before an AI call, but no real code path reaches it today.
- **No Search execution pipeline exists** — `0014_searches/migration.sql:16-23` states no worker claims a Search row yet; no `ResearchRun` model exists anywhere. This is the basis for D2.
- **Ownership precedent** — top-level `user_id` (FK CASCADE, `user_id` index, `gen_random_uuid()::text` id): `0020_feedback/migration.sql`, matching Opportunity/Search/Prospect/ServiceProfile/Feedback. The DEC-008 inheritance exception (join through parent, no own `user_id`) is explicitly limited to exactly two named tables (`research_signals`, `opportunity_scores`) per `0016_research_signals/migration.sql:9-16`. This is the basis for D3.
- **Isolation test pattern** — two users via `createUserAndSession('a')`/`('b')`, cross-user access returns not-found/empty (never 403), plus a direct Postgres `COUNT` assertion of zero rows: `tests/integration/opportunity-feedback.integration.test.ts:278-320`.
- **Money representation** — integer minor units + `currency` string (`amount_paise`, INR/Razorpay-specific) exists in `core-payments`; no USD or AI-provider pricing convention exists anywhere. Basis for D10.
- **Latest migration** — `0020_feedback`; next number `0021` (not created in this session — see MIGRATION EXPECTATION).

---

## REUSE AUDIT

| Existing component                     | Location                                   | Reused for                                                           |
| -------------------------------------- | ------------------------------------------ | -------------------------------------------------------------------- |
| `requireUser()` / `IdentityRepository` | `core-identity/src/session.ts:78-86`       | Authentication before any metering repository access                 |
| `SqlExecutor`                          | `@acos/core-entitlements`                  | Postgres repository implementation                                   |
| Top-level `user_id` migration pattern  | `0020_feedback/migration.sql`              | Metering table DDL shape                                             |
| Two-user isolation test harness        | `opportunity-feedback.integration.test.ts` | R-33 gate tests                                                      |
| `Message.usage` / `Message.id`         | `@anthropic-ai/sdk` (installed)            | Usage + provider event identity — data source, nothing reimplemented |
| `gen_random_uuid()::text`              | repo-wide convention                       | Metering row id                                                      |

No duplicate abstraction introduced. No new ORM, authentication mechanism, ownership framework, database abstraction, or pricing abstraction.

---

## APPROVED DECISIONS

All decisions below are APPROVED by explicit user instruction in this session and are **not reopened** by this artifact.

| #   | Decision                     | Resolution                                                                                                                                                                                                                                     |
| --- | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | Metering granularity         | One record per actual provider/model invocation (initial, repair, and retry calls each produce their own row). No aggregation into a single logical-run row.                                                                                   |
| D2  | Ownership / execution entity | Prospect-level: `user_id` + `prospect_id`. Search is explicitly NOT the owning entity (no Search→AI execution path exists; that is R-34/Phase 17).                                                                                             |
| D3  | Ownership model              | Top-level `user_id`, stored directly, SQL-layer enforced. Does NOT extend the DEC-008 inheritance exception (`research_signals`/`opportunity_scores` remain the only two).                                                                     |
| D4  | Provider                     | `anthropic` only. No multi-provider architecture.                                                                                                                                                                                              |
| D5  | Model                        | The exact string passed to the Anthropic SDK invocation. No registry, no normalization, no inference.                                                                                                                                          |
| D6  | Usage data                   | Required: `input_tokens`, `output_tokens`. Optional (nullable): `cache_creation_input_tokens`, `cache_read_input_tokens`. Never fabricated, never estimated from prompt/output length or `max_tokens`.                                         |
| D7  | Failed provider calls        | If a provider invocation fails before a response with usage exists, no metering record is created. No zero-token fabrication.                                                                                                                  |
| D8  | Idempotency                  | `provider` + `provider_message_id` (Anthropic's `Message.id`) within ownership context is the event identity. A database constraint prevents duplicate persistence of the same provider response. No separate distributed idempotency service. |
| D9  | Repository-side execution ID | Not introduced. `Message.id` is the provider event identity; no new execution-UUID abstraction.                                                                                                                                                |
| D10 | Monetary cost                | NONE in Phase 16. No currency, price, amount, USD/INR/paise, pricing version, or rounding rule of any kind.                                                                                                                                    |
| D11 | Cost interpretation          | "Execution cost" = measurable provider usage (tokens), not monetary spend. Unknown monetary cost is never represented as zero — it is simply not represented.                                                                                  |
| D12 | Retention                    | None. Rows persist indefinitely, same as every other append-only table in this repository, until a future requirement says otherwise.                                                                                                          |
| D13 | Privacy                      | No prompts, model input text, model output text, research content, or response content is persisted. Only execution metadata and usage numbers.                                                                                                |
| D14 | Transaction boundary         | Single-row insert. No cross-table transaction required for metering itself.                                                                                                                                                                    |

---

## DATA CONTRACT

Proposed table (name: `ai_usage_events`; not created in this session — see MIGRATION EXPECTATION):

| Column                        | Type                                    | Classification                                                         |
| ----------------------------- | --------------------------------------- | ---------------------------------------------------------------------- |
| `id`                          | TEXT PK, `gen_random_uuid()::text`      | REQUIRED — existing architecture convention                            |
| `user_id`                     | TEXT NOT NULL, FK `users(id)` CASCADE   | REQUIRED — D3                                                          |
| `prospect_id`                 | TEXT NOT NULL, FK `prospects(id)`       | REQUIRED — D2                                                          |
| `provider`                    | TEXT NOT NULL                           | REQUIRED — D4                                                          |
| `model`                       | TEXT NOT NULL                           | REQUIRED — D5                                                          |
| `request_kind`                | TEXT NOT NULL (`'initial' \| 'repair'`) | REQUIRED — existing `researcher.ts` retry semantics (D1)               |
| `provider_message_id`         | TEXT NOT NULL                           | REQUIRED — D8 (only created when a response with usage exists, per D7) |
| `input_tokens`                | INTEGER NOT NULL                        | REQUIRED — D6                                                          |
| `output_tokens`               | INTEGER NOT NULL                        | REQUIRED — D6                                                          |
| `cache_creation_input_tokens` | INTEGER, nullable                       | OPTIONAL — D6                                                          |
| `cache_read_input_tokens`     | INTEGER, nullable                       | OPTIONAL — D6                                                          |
| `created_at`                  | TIMESTAMP(3) DEFAULT now                | REQUIRED — existing architecture convention                            |

No `currency`, `cost`, `price`, `amount`, `usd`, `inr`, `paise`, or `pricing_version` column — NOT AUTHORIZED (D10).

Since a record is only created for a provider response that has usage (D7), `input_tokens`/`output_tokens`/`provider_message_id` are NOT NULL on the table itself; "unknown optional usage" (D6/§UNKNOWN USAGE) applies only to the two cache-token columns.

Indexes: `user_id` (ownership-scoped reads); `prospect_id` (lineage). Uniqueness: `UNIQUE(provider, provider_message_id)` — see IDEMPOTENCY.

---

## EVENT SEMANTICS

> **One row = one actual provider/model invocation that produced a provider response with usage.**

- Initial call → row.
- Repair call → row.
- Retry call → row.
- A retry belonging to the same logical `runResearch()`/`researchLead()` execution is not a duplicate — it is a separate, separately-billed provider event and gets its own row (D1).
- A provider call that never returns a response with usage produces no row (D7).

---

## OWNERSHIP

- `user_id` is derived exclusively from `requireUser()` inside the service layer that performs the metering write — never caller-supplied.
- `prospect_id` ownership is established the same way `runResearch()` already establishes it: `deps.prospects.getById(userId, prospectId)` must resolve before any metering write is attempted for that prospect.
- Reads are SQL-filtered: `WHERE user_id = $1` (top-level `user_id`, per D3) — never an unfiltered `SELECT` filtered in application code.
- Cross-user access (read or write) follows the existing repository convention: indistinguishable from "not found," never a distinguishable 403.

---

## IDEMPOTENCY

- Identity: `(provider, provider_message_id)`.
- Enforced via a unique constraint at the database layer: `UNIQUE (provider, provider_message_id)`.
- A metering write is an insert; on conflict (the same provider response processed twice, e.g. a lost-acknowledgement retry at the application layer) the write is a no-op, not a duplicate row.
- No message ID → no row is ever attempted (D7/D8) — nothing is invented from prompt content or any other proxy.

---

## ERROR SEMANTICS

| Case                                                                       | Outcome                                                                                                                                      |
| -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider call succeeds, usage present                                      | One row, `input_tokens`/`output_tokens` from the actual response.                                                                            |
| Provider call succeeds as a refusal (`stop_reason: 'refusal'`)             | A full `Message` with `usage` still exists at that point in `anthropicModel.ts` (§ REPOSITORY EVIDENCE) → one row, same as a normal success. |
| Provider call throws before any `Message` is returned (network/HTTP error) | No row (D7).                                                                                                                                 |
| Optional cache-usage fields absent from an otherwise-successful response   | Persisted as `NULL`, never `0` unless the provider itself reports `0` (§ UNKNOWN USAGE).                                                     |
| Same provider response processed twice                                     | Second write is a no-op via the `(provider, provider_message_id)` uniqueness constraint (§ IDEMPOTENCY).                                     |

---

## COST SEMANTICS

**None in Phase 16.** No monetary calculation, no pricing table, no currency, no rounding rule (D10, D11). "Cost" for Phase 16 purposes means the persisted `input_tokens`/`output_tokens`/cache-token values — nothing is converted to money.

---

## UNKNOWN USAGE

- Required fields (`input_tokens`, `output_tokens`) are present on every row that exists at all, because a row is only created when a provider response with usage exists (D7). There is no "row with unknown required usage" case.
- Optional fields (`cache_creation_input_tokens`, `cache_read_input_tokens`) are `NULL` when the provider's response omits them — never coerced to `0` unless the provider itself reports `0`.
- No provider response at all → no row, ever (D7).

---

## PHASE-7 COMPATIBILITY EXCEPTION

This is the **only** authorized modification to frozen Phase 7 (`core-research`), and it is a data-propagation change only.

**Files in scope for this narrow exception:**

- `packages/core-research/src/anthropicModel.ts`
- `packages/core-research/src/researcher.ts`
- `packages/core-research/src/provider.ts`

**Permitted change:** propagate `Message.id` and `Message.usage` from the Anthropic response, through `ModelResult`, through `ResearchProvider`, to wherever the metering write happens. Nothing else.

**Explicitly prohibited in these files during Phase 16:**
prompt changes, retry-count changes, repair-behavior changes, refusal-behavior changes, research-parsing changes, signal-generation changes, scoring changes, freshness/staleness changes, provenance changes, research-semantics changes, provider-selection changes, Search-execution changes, worker-behavior changes.

The Phase 16 diff against these three files must be reviewable as pure plumbing: new optional fields threaded through existing return values, no control-flow change, no behavioral change to `researchLead()`'s retry/repair/refusal logic.

---

## R-33 ISOLATION GATE

Not a standalone feature. Required evidence for Phase 16:

- **Authentication**: `requireUser()` executes before any metering repository access; no caller-supplied `userId` accepted anywhere.
- **SQL ownership**: reads/writes use `WHERE user_id = $1` (and, for writes, an ownership-checked `prospect_id`) at the SQL layer — never an unfiltered read filtered in application code.
- **Cross-user read**: User B reading User A's metering data gets the same empty/not-found semantics as every other owned model in this repository.
- **Cross-user write**: User B attempting to meter against User A's Prospect is rejected the same way `runResearch()` already rejects it for a non-owned `prospectId` (`ResearchProspectNotFoundError`).
- **Direct database proof**: integration tests assert via a raw Postgres query that no unauthorized row was created or modified — reusing the exact pattern in `opportunity-feedback.integration.test.ts:278-320`.

---

## R-34 BOUNDARY

Not part of Phase 16. Phase 16 does not create a worker, queue, Search claiming, worker orchestration, scheduling, worker-level retries, job state machines, background execution, or any redesign of Search execution. `createAnthropicResearchModel()` is not connected to a production worker or to Search execution in this phase. This work remains Phase 17 — R-34 Worker Orchestration / Wiring.

---

## DEPENDENCIES

- `requireUser()` / `IdentityRepository` (`core-identity`)
- `SqlExecutor` (`core-entitlements`)
- The Phase-7 compatibility exception above (must land before the metering write path can receive real usage data)
- Migration number `0021`, to be reconfirmed immediately before coding (§ MIGRATION EXPECTATION)

---

## IN SCOPE

- Propagating `Message.id`/`Message.usage` through `ModelResult` → `ResearchProvider` (Phase-7 compatibility exception only).
- A new additive migration for the `ai_usage_events` table (or equivalent name chosen at implementation time, following the same conventions).
- Metering domain types, repository interface, Postgres repository implementation.
- A service-layer function that authenticates via `requireUser()`, checks Prospect ownership, and persists one row per qualifying provider invocation.
- Connecting the metering write to the point(s) in `core-research` where a provider invocation completes with usage.
- Unit, integration, and R-33 isolation tests per §TEST REQUIREMENTS below.

## OUT OF SCOPE

Monetary pricing, token price tables, billing, subscriptions, quotas, credits, budgets, spend limits, cost-based stopping, an optimization engine, dashboards, UI, CRM, outreach, follow-up, proposals, Search execution, worker implementation, queue implementation, worker orchestration, R-34, R-33 as a standalone product feature, multi-provider architecture, prompt storage, response storage, research-content storage, changes to scoring/staleness/next-action/lifecycle logic, refactoring of Phases 1–15 beyond the single named compatibility exception, unrelated migrations, unrelated configuration, dependency upgrades.

---

## ACCEPTANCE CRITERIA

| ID      | Criterion                                                                                                          |
| ------- | ------------------------------------------------------------------------------------------------------------------ |
| AC16-01 | A successful Anthropic provider invocation exposes actual `input_tokens`/`output_tokens` to the metering boundary. |
| AC16-02 | A successful invocation produces exactly one durable metering record.                                              |
| AC16-03 | Multiple provider invocations (retry/repair) produce multiple metering records — no logical-run aggregation.       |
| AC16-04 | The record contains `provider = 'anthropic'` and the exact model string passed to the SDK.                         |
| AC16-05 | `Message.id` is persisted and used for duplicate prevention.                                                       |
| AC16-06 | Missing optional (cache) usage remains `NULL` — no fabricated token counts.                                        |
| AC16-07 | A provider call that fails before returning usage creates no metering record.                                      |
| AC16-08 | A user can only access metering records belonging to that user.                                                    |
| AC16-09 | A user cannot create metering records against another user's Prospect.                                             |
| AC16-10 | Unauthenticated requests fail before metering repository/provider access.                                          |
| AC16-11 | Metering records survive a fresh repository/process instance (real-Postgres round trip).                           |
| AC16-12 | Reprocessing the same provider response does not create duplicate rows.                                            |
| AC16-13 | No monetary cost is calculated or persisted anywhere in the Phase 16 implementation.                               |
| AC16-14 | Phase 16 introduces no Search/Worker execution wiring.                                                             |
| AC16-15 | Cross-user read/write isolation is proven with real Postgres assertions.                                           |

---

## TEST REQUIREMENTS

**Unit**: usage extraction from a fake `Message`; `provider_message_id` extraction; required-usage mapping; optional cache-usage mapping; missing-optional-usage behavior; failed-call behavior (no record); retry produces separate events; idempotency-key derivation; deterministic mapping (no floating point, no monetary math); ownership validation at the service layer.

**Integration (real Postgres)**: migration applies; schema constraints (NOT NULL, uniqueness) hold; insert/read-back preserves exact token values; provider/model/`provider_message_id` persistence; `(provider, provider_message_id)` duplicate prevention; restart/reload durability; multiple attempts within one `researchLead()` call produce multiple rows; a failed provider call produces zero rows; cross-user isolation with direct SQL proof of no unauthorized row creation or mutation (reusing `opportunity-feedback.integration.test.ts`'s pattern).

**Regression**: `researchLead()`'s retry/repair/refusal control flow, `verifyProvenance`, signal persistence (`saveSignals`/`supersedePrevious`), scoring, freshness/staleness are unchanged. No existing test is weakened or removed.

---

## REUSE REQUIREMENTS

Mandatory reuse: `requireUser()`, `SqlExecutor`, the raw-SQL Postgres repository pattern, `gen_random_uuid()::text`, top-level `user_id` ownership with FK CASCADE and a `user_id` index, the two-user integration isolation harness, `Message.usage`/`Message.id` as already exposed by the installed SDK.

Prohibited: a new ORM layer, a new authentication mechanism, a new ownership framework, a new database abstraction, a new provider abstraction beyond the minimal usage-propagation named above, any pricing abstraction.

---

## MIGRATION EXPECTATION

Latest migration at the time of this scope lock is `0020_feedback`; implementation would normally begin with `0021_...`. **Implementation must re-confirm the current latest migration number immediately before writing the migration file** — no migration is created in this session, and none should be assumed still current if time has passed or other work has landed.

---

## IMPLEMENTATION ORDER

1. Confirm baseline and frozen boundaries.
2. Make the minimal Phase-7 usage-propagation compatibility change (§ PHASE-7 COMPATIBILITY EXCEPTION).
3. Add the next additive database migration (renumber per § MIGRATION EXPECTATION).
4. Add metering domain types.
5. Add repository interface.
6. Add PostgreSQL repository implementation.
7. Add service-layer ownership/authentication flow.
8. Connect actual provider usage events to metering persistence.
9. Add unit tests.
10. Add real-Postgres integration tests.
11. Add R-33 isolation verification.
12. Run targeted verification.
13. Run full regression verification.
14. Perform diff audit against the baseline.
15. Stage only Phase 16 files.
16. Review staged diff.
17. Commit only if all gates pass.

No implementation occurs in this session.

---

## STRICT NON-GOALS

Monetary pricing, token price tables, billing, subscriptions, quotas, credits, budgets, spend limits, cost-based stopping, optimization engine, dashboards, UI, CRM, outreach, follow-up, proposals, Search execution, Worker implementation, queue implementation, worker orchestration, R-34, R-33 as a standalone product feature, multi-provider architecture, prompt storage, response storage, research-content storage, changing scoring logic, changing staleness logic, changing next-action logic, lifecycle changes, refactoring Phases 1–15 beyond the named compatibility exception, unrelated migrations, unrelated configuration, dependency upgrades.

---

## EXIT CRITERIA

This scope lock is exit-ready (i.e., usable by a separate implementation session without further product decisions) because:

- Every item this preflight previously marked OPEN (metering event/granularity, owning entity, ownership model, provider, model, required/optional usage, failed-call treatment, idempotency key, monetary cost) is now resolved by D1–D14.
- The one architectural gap found during inspection — usage data trapped behind a frozen Phase-7 boundary that is itself unwired to any real production call site — is resolved by the explicit, narrowly-scoped PHASE-7 COMPATIBILITY EXCEPTION, not by silent invention.
- AC-24's Search-vs-Prospect mismatch is resolved by D2 with an explicit note that literal Search-level satisfaction remains deferred to Phase 17.

## CARRY-FORWARD

- AC-24's literal wording ("for a Search") is not fully satisfied until Phase 17 wires Search→AI execution; Phase 16 satisfies it at the Prospect level per D2. This is a pre-existing wording/architecture mismatch, not a Phase 16 defect — flagged for whoever owns Phase 17 or a future AC-24 wording correction.
- The real `ResearchProvider` implementation connecting `createAnthropicResearchModel`/`researchLead` to a production worker or HTTP path does not exist anywhere in the repository today; Phase 16 does not create it (that remains R-34/Phase 17 or an earlier undocumented gap, PRE-EXISTING either way).

## FINAL SCOPE DECISION

```text
RESULT: READY TO IMPLEMENT
```

A separate, later implementation session may execute this scope lock without making further product decisions.
