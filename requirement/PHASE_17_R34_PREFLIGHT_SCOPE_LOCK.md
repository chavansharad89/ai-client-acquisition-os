# PHASE 17 — R-34 WORKER ORCHESTRATION / WIRING

# PREFLIGHT / SCOPE LOCK

This is a preflight and scope-lock artifact only. It authorizes nothing by itself. It exists to
establish, from the PRD, `MVP_SCOPE_BOUNDARY.md`, and direct repository inspection, exactly what
Phase 17 (R-34) may implement and what remains an open product/architecture decision. No code,
migration, test, package manifest, or configuration was changed to produce this document.

---

## BASELINE

| Item | Value |
|---|---|
| HEAD | `6f67899176b8d391bb399643ef74bb668d75f161` |
| Branch | `main` (ahead of `origin/main` by 15 commits) |
| Latest Phase commit | `6f67899` — "Phase 16: implement R-29 AI cost metering" |
| Prior phases (log order) | `1bb2725` P15 R-27 Tracking · `ad42d40` P14 Feedback · `31676e8` P13 Next Action · `74f62a2` P12 Staleness · `0f625e1` P11 Ranking · `1ca11ad` P10 Scoring persistence · `6789e5b` P9 Opportunity foundation · `72eb1bf` P8 Scoring foundation · `72ce050` P7 Research · `7a74ca6` P6 Discovery · `59d79d8` P5 Search · `ac8743b` P4 ServiceProfile · `a34f79c` P3 Identity · `bb936f0` P2 Prisma authority · `0978dbd` P1 Architecture |
| Working tree | Untouched by this task. Pre-existing drift: `apps/web/tsconfig.tsbuildinfo` modified (build artifact); `CLAUDE.md` untracked; `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` untracked. All three pre-date this task and were left as-is. |
| Staged files | None |
| New file from this task | `requirement/PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md` (this file) — the only file created or modified by the original preflight task |
| This revision | Resolves the three previously blocking decisions (crash recovery, bounded retries, worker scheduling) per explicit product/architecture direction. HEAD, repository evidence, and every other finding below are unchanged from the original preflight — this revision only layers decided semantics onto that evidence. This file is the only file touched by this revision. |

Phases 1–16 are treated as **completed and frozen**. Their scope, architecture, and acceptance
criteria are not reopened here. Phase 16 (R-29 AI Cost Metering) is verified present at HEAD via
migration `0021_ai_usage_events`, `packages/core-ai-usage/`, and its own scope-lock artifact
(`requirement/PHASE_16_R29_PREFLIGHT_SCOPE_LOCK.md`).

**Caveat carried forward from the PRD itself:** the PRD's own "REPOSITORY STATUS TABLE" and
`MVP_SCOPE_BOUNDARY.md` §7 traceability table are explicitly frozen V2.1-era snapshots — the V2.2
roadmap section states verbatim that "where earlier sections of this document record a
requirement's repository status as NOT IMPLEMENTED... that historical record is preserved
unchanged here... even where subsequent implementation work is known to have progressed it
further." Consistent with that, those tables show Search/Discovery/Opportunity as NOT
IMPLEMENTED even though Phases 5–14 (already merged at HEAD) implement them. This preflight
therefore treats **direct repository inspection**, not those two tables, as the authority for
current implementation state; the PRD's requirement text (R-05, R-34, Worker Ownership, ACs,
decision register) remains authoritative for required *semantics*.

---

## AUTHORITATIVE DOCUMENTS INSPECTED

1. `requirement/AI Client Acquisition OS — Product Requirements Document V2.2.md` — R-29 (L912),
   R-33 (L959), **R-34 (L973)**, Worker Ownership (L1326), Repository Status Table (L1349),
   Traceability Matrix (L1418), Open Questions OQ-1…OQ-6 (L1681), Acceptance Criteria AC-01…AC-25
   (L1728), Release Gates G-01…G-11 (L1763), DEC-007/008/009 (L1510–1546), Phase 16/17 roadmap +
   V2.2 engineering roadmap (L1894–1959).
2. `requirement/MVP_SCOPE_BOUNDARY.md` — §5.7 Required technical foundation (L232), §7
   traceability + planning implications (L370), §8 scope expansion rule (L406).
3. `requirement/PHASE_16_R29_PREFLIGHT_SCOPE_LOCK.md` — prior scope-lock precedent, specifically
   its own "R-34 BOUNDARY" section (L213), which pre-declares that Phase 16 does **not** create a
   worker, queue, Search claiming, or worker orchestration, and defers all of it to this phase.
4. No Phase-17-specific document existed prior to this task.

---

## R-34 — AUTHORITATIVE DEFINITION (verbatim substance)

> **R-34 — WORKER EXECUTION.** Long-running work executes outside the HTTP request, with
> lease-based claiming, fencing, bounded retries and graceful shutdown. **MVP: Yes.**
> **Status: PARTIAL.** Evidence: the Meta-events worker implements claiming with
> `FOR UPDATE SKIP LOCKED`, leases, fencing, full-jitter retry, dead-lettering and
> ambiguous-send recording — verified against real PostgreSQL. **No poll loop invokes any of
> it**; `apps/worker/src/index.ts` throws on boot.

The V2.2 roadmap names Phase 17 as **"R-34 Worker Orchestration / Wiring (worker orchestration
and wiring of the discovery → research → opportunity pipeline)"** and states this "does not
invent or add queue, scheduler, worker, cron, deployment, or autonomous-execution architecture
for R-34 beyond what Layer 3 already states."

**Authorized pipeline, confirmed:**

```text
Search  →  Discovery  →  Research  →  Opportunity
```

This is confirmed by three independent sources: the roadmap sentence above, AC-25's naming of
exactly "a discovery-provider failure, a research failure and a worker crash," and the
`DiscoveryDeps`/`ResearchDeps`/`OpportunityDeps` chain actually implemented in the repository
(each package depends on the previous one's repository types — see §DEPENDENCY GRAPH below).

**Scoring, staleness, next-action, feedback, and AI usage metering are existing, separately
integrated downstream capabilities — not steps R-34 is required to chain automatically:**

- `createOpportunity()` creates an Opportunity at state `NEW` only; its own docstring states "no
  transition into RESEARCHED is implemented by this phase" and it never calls `scoreOpportunity`.
- Scoring (`scoreOpportunity`), ranking (`rankOpportunities`), staleness
  (`classifyOpportunityStaleness`), next-action (`getOpportunityNextAction`), and feedback
  (`recordFeedback`) are each separate exported service functions (Phases 8–14) that take their
  own `rawToken` and are invoked independently — there is no repository evidence, PRD text, or AC
  requiring the worker to call them as part of claiming/executing a Search.
- AI usage metering (R-29/Phase 16) is cross-cutting *within* the Research step (every AI
  invocation the worker triggers should be metered the same way `runMeteredResearch` already
  does it), not a pipeline stage of its own.

No evidence anywhere authorizes expanding R-34 into Outreach, Follow-up, Proposal, CRM, billing,
subscriptions, autonomous actions, or UI — no such reference exists in R-34's text, the V2.2
roadmap, or `MVP_SCOPE_BOUNDARY.md`.

---

## WORKER OWNERSHIP — AUTHORITATIVE ARCHITECTURE (already decided, PRD L1326)

```text
HTTP    requireUser() → userId          (server-derived)
        INSERT searches (user_id, parameters snapshot, status='PENDING')

WORKER  claim a row: FOR UPDATE SKIP LOCKED
        userId := row.user_id           (read from persisted state)
        every write carries that user_id
        settle: fenced on lease_owner
```

> "The worker must never trust a `userId` supplied by a job payload. It is handed nothing; it
> claims a row and reads ownership out of it... This is the pattern the Meta-events worker
> already uses and is the only worker component verified against real PostgreSQL."

This is not a new decision Phase 17 must invent — it is an existing, PRD-authored, already-proven
architecture. The gap is that no code applies it to `searches` yet (see below).

---

## REPOSITORY INSPECTION — `apps/worker`

| Question | Finding |
|---|---|
| Entry point | `apps/worker/src/index.ts` |
| Current implementation | `function main(): never { throw new Error('apps/worker: poll loop not implemented (Phase 2)'); }` — a stub that throws on boot, by design |
| Package dependencies | `@acos/core-capi`, `@acos/core-entitlements`, `@acos/db`, `@acos/config`, `@acos/observability` only. **No dependency on `@acos/core-search`, `@acos/core-discovery`, `@acos/core-research`, `@acos/core-opportunity`, or `@acos/core-identity` exists today.** |
| Existing modules | `dispatchers/{capiDispatcher,deliveryDispatcher}.ts`, `metaEvents/{worker,repository,pgRepository,backoff,index,testSupport}.ts` — all scoped to Meta Conversions API delivery (commerce/Phase-2 domain), not Search execution |
| Polling / queue / scheduler | None. No cron, no BullMQ/SQS/Kafka/Redis dependency anywhere in `apps/worker/package.json` or elsewhere in the repo's manifests |
| Job abstraction | The `MetaEventRepository`/`MetaEventWorkerDeps` interfaces in `metaEvents/` are a full claim→process→settle abstraction, but it is bound to the `meta_events` table's shape and vocabulary (`PENDING/PROCESSING/SENT/DEAD_LETTER`), not to `searches` |
| Tests | `apps/worker/src/config.test.ts`, `metaEvents/worker.test.ts`, `metaEvents/workerFailures.test.ts` (unit, mocked repository); `tests/integration/meta-event-worker.concurrency.test.ts` and `meta-event-ambiguous-send.integration.test.ts` (real Postgres) — none reference Search/Discovery/Research/Opportunity |
| Is the worker a stub for R-34's purposes | **Yes, entirely.** Nothing in `apps/worker` today can execute a Search. |

No queue, scheduler, cron, Redis, BullMQ, or SQS was introduced or assumed by this preflight.

---

## SEARCH EXECUTION MODEL — `core-search`

| Search concern | Repository evidence | Authoritative decision |
|---|---|---|
| Claimable state | `SearchStatus = PENDING \| RUNNING \| COMPLETE \| FAILED \| CANCELLED` (`types.ts`); CHECK constraint in migration `0014_searches` | PENDING is claimable; enum is fixed by R-05, no new status may be added |
| Claim mechanism | **None exists.** `SearchRepository.transition(userId, id, from, to, options, now)` is the only status-changing method, and it is a per-user compare-and-swap (`WHERE id=$1 AND user_id=$2 AND status=$3`) — it requires the caller to already know `userId`, which a worker polling across all users does not have | A worker-shaped, cross-user claim (`FOR UPDATE SKIP LOCKED`, no `user_id` predicate, reads `user_id` off the returned row) does not exist and must be added as a new repository method. The **shape** of that method is already dictated by the Worker Ownership section and by the proven `pgRepository.ts` pattern in `metaEvents/` — this is mechanical reuse of a decided pattern, not a new product decision |
| Owner | `user_id` column, FK to `users`, `ON DELETE CASCADE` | Existing; authoritative |
| Worker identity | No `workerId`/`lease_owner` value is ever written anywhere in `core-search`. Column exists (`lease_owner TEXT`); nothing writes it | Column ready; write path missing |
| Lease | `lease_expires_at TIMESTAMP(3)` column exists; nothing writes or reads it | Column ready; write/expiry-check path missing |
| Retry / attempts | `attempts INTEGER NOT NULL DEFAULT 0`, incremented only inside `transition()` when `to = 'RUNNING'` (i.e., counts execution attempts, not failure-retries); `CHECK (attempts >= 0)` | **RESOLVED.** `attempts` is the sole, existing counter for the bounded-retry budget (max 3 automatic attempts per Search — see RESOLVED DECISIONS). No new column is needed; the new claim method continues the existing convention of incrementing `attempts` on each `PENDING → RUNNING` entry |
| Failure state | `FAILED` is a valid `to` in `transition()`; `last_error` is set `CASE WHEN $4='FAILED' THEN $5 ELSE last_error END` | Exists and works today via the generic CAS `transition()`; now also the confirmed terminal state reached after the third failed attempt (RESOLVED DECISIONS §2), with the final failure persisted in `last_error` |
| Completion state | `COMPLETE` is a valid `to`; no special handling beyond the generic CAS | Exists and works |
| Error persistence | `last_error TEXT` column; written only on transition to `FAILED` | Exists |
| Stale worker protection | **None yet in code.** No lease-expiry release method exists for `searches` (contrast `metaEvents.releaseExpiredLeases`) | **RESOLVED** — semantics decided (see RESOLVED DECISIONS §1): an expired `RUNNING` lease returns the Search to `PENDING`, preserving `attempts`/`last_error`, making it eligible for reclaim. Missing only as code — must be added, mirroring the proven `metaEvents.releaseExpiredLeases` pattern, unconditionally (not gated on `attempts`) |

`state.ts` (the file's own author, in-repo comments) previously flagged everything beyond
`PENDING → RUNNING → COMPLETE` as this implementation's own provisional foundation, and called
`RUNNING → FAILED`, `PENDING/RUNNING → CANCELLED`, and whether terminal states may be
reopened/retried **"UNRESOLVED."** **That ambiguity is now resolved by product decision** (see
RESOLVED DECISIONS below): `RUNNING → FAILED` is confirmed (terminal, reached after the third
failed attempt); a new `RUNNING → PENDING` edge is authorized for both lease-expiry recovery and
a non-exhausted failed attempt (attempts < 3), implemented as a dedicated repository operation
alongside — not a replacement for — the existing per-user CAS `transition()`; no new status value
is introduced, so `SearchStatus`'s five-value vocabulary is unchanged. Encoding this new edge in
`core-search/src/state.ts`'s `SEARCH_VALID_TRANSITIONS` table (and its accompanying comments) is
implementation work for Phase 17, not a further open decision.

---

## CLAIM / CONCURRENCY PREFLIGHT

**Existing sufficient primitive to reuse:** `apps/worker/src/metaEvents/pgRepository.ts`'s
`claim()` — a single `UPDATE ... WHERE id IN (SELECT ... WHERE status='PENDING' ... FOR UPDATE
SKIP LOCKED LIMIT $n) RETURNING ...` — is verified against real PostgreSQL
(`tests/integration/meta-event-worker.concurrency.test.ts`, 6 concurrency scenarios including 8
parallel workers, lease-expiry recovery, and stale-worker fencing). This is the **only**
worker-concurrency mechanism in the repository proven correct under real concurrent load, and the
PRD's own Worker Ownership section describes exactly this mechanism as the pattern to follow for
Search.

**What is missing, precisely:** a `searches`-table equivalent of that `claim()` function
(cross-user `FOR UPDATE SKIP LOCKED` + `lease_owner`/`lease_expires_at` write) does not exist in
`core-search`. This is a **new repository method**, not a new concurrency *design* — the design
is already fixed by the meta-events precedent and the PRD's Worker Ownership section. Building it
requires no invented product/architecture decision.

**Fencing on settlement:** the meta-events pattern's fencing predicate
(`WHERE id=$1 AND status='PROCESSING' AND lease_owner=$2`) generalizes directly to `searches`
(`WHERE id=$1 AND status='RUNNING' AND lease_owner=$2`) without modification to the underlying
principle.

**Conclusion:** claim/concurrency semantics are **not** a decision gate — they are an established,
tested pattern awaiting mechanical application to a second table.

---

## STALE WORKER / CRASH SEMANTICS

| Question | Finding |
|---|---|
| Worker A claims, then crashes | No `releaseExpiredLeases`-equivalent exists for `searches` today. The `metaEvents` precedent (`releaseExpiredLeases`) returns the row to `PENDING`, clears `lease_owner`/`lease_expires_at`, and **does not charge `attempts`** — because a crash proves nothing about whether the work itself would have failed |
| May Worker B reclaim it | Yes, by the same `FOR UPDATE SKIP LOCKED` claim query, once released — mechanically identical to the meta-events case |
| Stale ownership identification | `lease_expires_at <= now()` while `status` is the "in-progress" value — same predicate as meta-events |
| Can Worker A write results after being fenced | No, if the new claim method's settlement writes are fenced the same way (`WHERE ... AND lease_owner = $ownWorkerId`) — mirrors `markSent`/`markForRetry`/`markDeadLetter`'s fencing contract exactly |
| Partial Discovery/Research/Opportunity rows from a crashed attempt | **Not addressed anywhere.** Discovery/Research persistence is idempotent by design (`CompanyRepository.findOrCreateByDomain`, `ProspectRepository.findOrCreate`, research's supersede-then-insert), which mitigates *duplication* on retry, but no requirement or code defines what happens to an `Opportunity` already created by a crashed attempt if the Search is later retried/re-run |

**RESOLVED (previously "DECISION REQUIRED — crash/retry combined with terminal-state
semantics").** Per explicit product/architecture decision (RESOLVED DECISIONS §1 below): an
expired `RUNNING` lease returns the Search to `PENDING`, unconditionally, making it eligible for
reclaim by another worker. The existing Search row, and its persisted `attempts`/`last_error`
metadata, are preserved as-is — the release operation does not increment `attempts` (mirroring
`metaEvents.releaseExpiredLeases`'s own rule: "a crash proves nothing about whether the work
itself would have failed") and does not write a new `last_error` (it neither clears nor
fabricates one). No new `SearchStatus` value is introduced — `RUNNING → PENDING` is a new,
now-sanctioned edge alongside the existing `PENDING → RUNNING → COMPLETE/FAILED` CAS graph,
implemented as a dedicated lease-expiry-release repository operation (mirroring
`metaEvents.releaseExpiredLeases`'s own predicate shape: `WHERE status='RUNNING' AND
lease_expires_at <= now()`), not routed through the per-user CAS `transition()` method.

**Consistency note (not a further decision, stated to remove ambiguity):** because lease-expiry
release is unconditional and does not consume an attempt, a Search that repeatedly crashes before
ever reaching an explicit application-level failure verdict is not bounded by the three-attempt
cap and can be reclaimed indefinitely. This is the direct, literal consequence of the resolved
decision as stated, and mirrors the meta-events precedent exactly (a crash is not charged against
the retry budget there either). The three-attempt cap (RESOLVED DECISIONS §2) governs only the
explicit-failure path (Discovery-provider failure, research failure, or Opportunity failure),
where `attempts` is checked against the cap before deciding `PENDING` (retry) vs. `FAILED`
(exhausted).

---

## PIPELINE DEPENDENCY GRAPH

| Edge | Package | Public entry point | Input | Output/persistence | Ownership enforcement | Transaction | Worker-callable as-is? |
|---|---|---|---|---|---|---|---|
| Search → Discovery | `core-discovery` | `runDiscovery(deps, rawToken, {searchId}, now)` | `rawToken` (session), `searchId` | `Company`/`Prospect` rows via `CompanyRepository`/`ProspectRepository`; requires Search to already be `RUNNING` | `requireUser()` then `deps.searches.getById(userId, searchId)` — token-authenticated | None (no transaction wraps provider call + persistence) | **No** — requires a `rawToken`; a worker has none |
| Discovery → Research | `core-research` | `runResearch(deps, rawToken, {prospectId}, now)` | `rawToken`, `prospectId` | `ResearchSignal` rows, supersede-then-insert | `requireUser()` then `prospects.getById`/`companies.getById` — token-authenticated | Author's own comment: "ideally in one transaction" (supersede + insert) — **not implemented as one** | **No** — same token requirement. **Lower-level primitives ARE reusable without a token**: `researchLead()`, `toNewResearchSignals()`, `ResearchSignalRepository.supersedePrevious/saveSignals` are all exported and take no token |
| Research (metered) | `core-ai-usage` | `runMeteredResearch(deps, rawToken, prospectId, model, input, options, now)` | `rawToken` | `AiUsageEvent` rows via `onInvocation` hook on `researchLead()`; explicitly does **not** persist `ResearchSignal` rows | `requireUser()` + `prospects.getById` — token-authenticated | None | **No** (token) — and even authenticated, does not by itself satisfy the Research step (no signal persistence). Metering and signal-persistence are two separate call sites today that both wrap the same `researchLead()` primitive |
| Research → Opportunity | `core-opportunity` | `createOpportunity(deps, rawToken, {prospectId}, now)` | `rawToken`, `prospectId` | One `Opportunity` row, state `NEW` | `requireUser()` then `prospects.getById`/`searches.getById`/`signals.listByProspect` — token-authenticated | None | **No** — same token requirement |
| Opportunity → Scoring/Staleness/Next-Action/Feedback | `core-opportunity` | `scoreOpportunity`, `rankOpportunities`, `classifyOpportunityStaleness`, `getOpportunityNextAction`, `recordFeedback` | `rawToken` each | Own tables (Phases 8–14) | token-authenticated, independently | N/A | Out of R-34's authorized pipeline (see scope section above) — **EXISTING, ALREADY-INTEGRATED CAPABILITY, not orchestrated by the worker** |

**EXISTING LOGIC TO REUSE (unmodified):** `normalizeCandidate`/`normalizeDomain`,
`CompanyRepository.findOrCreateByDomain`, `ProspectRepository.findOrCreate`, `researchLead()`,
`toNewResearchSignals()`, `ResearchSignalRepository.{supersedePrevious,saveSignals}`,
`suggestOffers()` (via `toOfferSignals`/`toServiceRule`), `OpportunityRepository.create`, the
meta-events `FOR UPDATE SKIP LOCKED` claim/fence SQL pattern, `AiUsageEvent` recording via
`recordEvent`/`toNewAiUsageEventInput`.

**NEW ORCHESTRATION LOGIC REQUIRED:**
1. A `searches`-table claim method (cross-user `FOR UPDATE SKIP LOCKED` + lease write,
   incrementing `attempts` on `PENDING → RUNNING` per the existing convention) — new code,
   established pattern.
2. A `releaseExpiredLeases`-equivalent for `searches` (unconditional `RUNNING → PENDING` on lease
   expiry, per RESOLVED DECISIONS §1) — new code, established pattern.
3. A bounded-retry settlement path for explicit application-level failure: on a Discovery,
   Research, or Opportunity failure, if `attempts < 3` transition `RUNNING → PENDING` (retry
   eligible); if `attempts >= 3` (i.e., this was the third attempt), transition `RUNNING → FAILED`
   and persist the failure in `last_error` (per RESOLVED DECISIONS §2). Mirrors
   `metaEvents.scheduleRetry`'s exhaustion check, adapted to Search's fixed max of 3 and its
   five-value status vocabulary (no new retry-specific status).
4. **A worker-shaded call path into Discovery/Research/Opportunity that does not go through
   `requireUser()`/`rawToken`.** Every existing service-layer entry point (`runDiscovery`,
   `runResearch`, `createOpportunity`, `runMeteredResearch`) authenticates a raw session token
   and derives `userId` from it — none accept a pre-resolved, trusted `userId`. A worker that has
   claimed a Search has exactly the situation the Worker Ownership section describes (a
   persisted, authoritative `userId` and no session token), which none of today's four
   entry points can accept. This is not a product decision — the Worker Ownership section already
   dictates that the worker "claims a row and reads ownership out of it" and "is handed nothing"
   — but it **is** new code: either new worker-facing functions that skip `requireUser()` and take
   a trusted `userId` directly (calling the same underlying repository/primitive calls the
   existing service functions call), or an internal adapter that packages a persisted `userId`
   into the same shape `requireUser()` would have produced. Building this is Phase 17's core
   orchestration work, not a blocked decision.
5. A composed Research step that both persists `ResearchSignal` rows (today only done by
   `runResearch`) **and** records AI usage events (today only done by `runMeteredResearch`) —
   currently split across two call sites that each duplicate the ownership check and neither
   does both. The worker's Research step must call the shared lower-level primitives
   (`researchLead`, `toNewResearchSignals`, the signals repository, and
   `usageEvents.recordEvent`) directly rather than either existing service function, to get both
   effects from one AI invocation (as R-29's own scope lock already requires: "one
   `researchLead()` call produces both the research outcome and every metering row").

---

## OWNERSHIP

Chain confirmed by direct repository read: `Search.user_id` → `Prospect` (via `Company`/`Search`
join, no own `user_id`) → `ResearchSignal` (inherits via `Prospect`, no own `user_id`, per
DEC-008) → `Opportunity` (has its own `user_id`, set from the caller's resolved `userId` at
`createOpportunity` time) → `AiUsageEvent` (records `userId` at metering time).

**Enforcement confirmed at each hop:** `CompanyRepository`/`ProspectRepository`/
`ResearchSignalRepository` all scope reads by `userId` in the SQL `WHERE` clause (not
post-filtered in application code) — consistent with `core-search`'s own convention
("mismatched owner reads as 'not found' rather than being filtered out after the fact").

**AC-23 mapping:** *"A Search claimed by a worker records results under the owner persisted on
the Search row, never under an identity supplied to the worker."* This is directly satisfiable
once the new worker-claim method returns `user_id` from the claimed row and every downstream
write in the orchestration uses that value — no repository code currently violates this (none of
it accepts a caller-supplied `userId` today), the gap is purely that no orchestration exists yet
to plumb the claimed row's `user_id` through Discovery → Research → Opportunity.

---

## FAILURE SEMANTICS

| Case | Search state (attempts < 3) | Search state (3rd attempt) | Error persistence | Retry possible | Partial-data behavior | Opportunity behavior | Gate |
|---|---|---|---|---|---|---|---|
| Discovery failure | `RUNNING → PENDING`, `attempts` unchanged (already incremented at claim) | `RUNNING → FAILED` | `last_error` set on the terminal (3rd-attempt) write, per RESOLVED DECISIONS §2 | Yes, up to 3 total attempts | Discovery persistence is find-or-create/idempotent, so a partial batch is not corrupted; a per-candidate normalization miss is already handled as `DiscoveryRunResult.skipped`, not a failure — only a provider-level exception is a "Discovery failure" | None created yet at this stage | AC-25's "defined state with a recorded error" is satisfied: `PENDING` (retryable) or `FAILED` + `last_error` (exhausted) |
| Research failure | `RUNNING → PENDING`, `attempts` unchanged | `RUNNING → FAILED` | Same | Same | Supersede-then-insert is not transactional (noted above); a mid-failure could theoretically leave signals superseded with nothing new inserted — unaffected by this resolution, still a narrow pre-existing gap, not a Phase 17 decision item | Opportunity creation should not proceed | Same |
| Opportunity failure | `RUNNING → PENDING`, `attempts` unchanged | `RUNNING → FAILED` | Same | Same | Discovery/Research data already persisted and valid; no Opportunity row created (single `INSERT`, atomic) | No Opportunity row, or none left partially written | Same |
| Worker crash (any stage, any attempt) | `RUNNING → PENDING`, unconditionally, **not gated on `attempts`** — see consistency note above | (crash never itself terminalizes to `FAILED`; only an explicit application-level failure does) | Not written — the release operation neither clears nor fabricates `last_error` (RESOLVED DECISIONS §1) | Yes, always, by another (or the same) worker | Whatever was persisted up to the crash point remains (idempotent for Discovery/Research; a created Opportunity would remain) | `PENDING` is the "defined state" AC-25 requires; recording a diagnostic note about the crash itself is an optional implementation nicety, not a mandated behavior |

For every case, "leave the Search in a defined state with a recorded error" (AC-25) is now
achievable using the resolved `PENDING → RUNNING → {COMPLETE, FAILED}` graph plus the new,
resolved `RUNNING → PENDING` edge (bounded-retry requeue and unconditional crash recovery) — no
further decision is required for any of the three named AC-25 scenarios.

---

## TRANSACTION BOUNDARIES

- No transaction currently wraps any external provider or AI call anywhere in
  `core-discovery`, `core-research`, or `core-opportunity` — confirmed by grep across all three
  packages' `src/`; the only transaction-related text found is `persist.ts`'s own comment
  admitting supersede+insert is "ideally in one transaction" but is not currently one.
- Discovery persistence: not atomic across the candidate batch (each candidate is its own
  find-or-create call).
- Research persistence: not atomic across supersede+insert (see above).
- Opportunity creation: atomic by virtue of being a single `INSERT` (`OpportunityRepository.create`).
- A worker orchestration transaction must **not** span the external AI/provider HTTP calls
  (this is the same principle the meta-events worker already follows: the lease exists precisely
  because the external call cannot be inside a DB transaction). This preflight does not introduce
  a transaction architecture; it records that none exists today for the pipeline stages, and that
  any future transaction boundary must wrap only the DB writes immediately around a given
  provider/model call, not the call itself.

---

## PHASE 16 / R-29 INTEGRATION

Confirmed wiring: `researchLead()` (core-research) accepts an `onInvocation` hook; `core-ai-usage`'s
`runMeteredResearch()` is the only existing caller that supplies one, and it writes an
`AiUsageEvent` via `recordEvent`/`toNewAiUsageEventInput` per invocation (initial, repair, and
provider-error-retried attempts each counted; a call that never returns is not metered — per the
Phase 16 scope lock's own D1/D7 rule).

`runMeteredResearch()` deliberately does **not** touch `runResearch()` or persist
`ResearchSignal` rows — its own header comment states this explicitly, precisely because wiring
a real provider into the pipeline is "Search/Discovery/worker territory (R-06/R-34)... out of
bounds for R-29." **This confirms R-34 can consume R-29's metering hook (`onInvocation` on
`researchLead()`) without modifying any R-29 semantics** — the worker's Research step should call
`researchLead()` directly with the same `onInvocation` metering hook `runMeteredResearch` uses,
alongside (not instead of) `runResearch()`'s signal-persistence logic, rather than modifying
either existing function. No change to R-29's pricing, usage, provider, idempotency, ownership,
or schema semantics is required or proposed.

---

## R-33 CROSS-CUTTING GATE

R-33 is confirmed (PRD L1910-1916) as a verification gate across Phases 15–17, not a standalone
phase. Required evidence for Phase 17, minimum:

- Two users, each with their own Search, both processed by the same worker process (proves the
  worker does not leak `userId` across concurrently-claimed rows).
- Search ownership: User B cannot claim, read, or transition User A's Search (existing pattern:
  `tests/integration/search.integration.test.ts`'s "Search ownership" and "identity boundary"
  `describe` blocks already establish this for the CAS `transition()` path — a new claim method
  needs the equivalent proof for the cross-user claim query).
- Discovery/Research/Opportunity persistence: each row created during User A's worker run carries
  User A's `userId` (or inherits ownership correctly per DEC-008), never User B's, even under
  concurrent execution.
- AI usage ownership: metering events from User A's Research step are never attributable to User B.
- Stale-worker isolation: a fenced (crashed/reclaimed) worker for User A's Search cannot write
  results that get attributed to whichever user now owns the reclaimed row.

The repository already has a proven pattern for this class of proof —
`tests/integration/meta-event-worker.concurrency.test.ts` (8 parallel workers, lease-expiry
recovery, stale-worker fencing, all against real Postgres via `tests/integration/support/`) and
`opportunity-feedback.integration.test.ts`'s direct-SQL-ownership-proof style (cited by the Phase
16 scope lock as the pattern to reuse). Phase 17 must not rely solely on mocked repositories for
this evidence — the same rule the Phase 16 lock already states for R-29.

---

## QUEUE / SCHEDULER / TRIGGER

Inspected: `apps/worker/package.json` dependencies, `Dockerfile`, `turbo.json`,
`pnpm-workspace.yaml`, and the full `apps/worker/src` tree. **No queue, scheduler, or cron
mechanism of any kind exists in the repository** — no BullMQ, SQS, Kafka, Redis, or cron
dependency in any manifest; `apps/worker/src/index.ts` is a stub that throws.

The only "execution mechanism" that exists and is proven is the meta-events worker's
claim-loop *shape* (claim a batch → process → settle → repeat, with a lease-expiry sweep) — but
even that has no actual poll loop wired to it (`index.ts` throws before reaching any of it). So
the repository does not yet contain an authoritative *scheduling/looping* mechanism either — only
the claim/fence/settle primitives that a loop would call.

**RESOLVED (previously `BLOCKED — DECISION REQUIRED`).** Per explicit product/architecture
decision (RESOLVED DECISIONS §3 below): `apps/worker` runs a long-running, in-process PostgreSQL
polling loop — the same shape `index.ts`'s own intended-control-flow comment already documents,
now confirmed as the sanctioned mechanism rather than merely a precedent. Search claiming uses the
same `FOR UPDATE SKIP LOCKED` SQL pattern as the meta-events claim query; claims and settlement
writes are protected by the existing `lease_owner`/`lease_expires_at` fencing fields already
present on `searches` (migration `0014_searches`) — no new column is needed. **No queue or broker
of any kind (Redis, Kafka, RabbitMQ, SQS, BullMQ, or otherwise) is authorized, and no separate
scheduler service is authorized** — the poll loop lives inside `apps/worker`, the same
application and process boundary the Meta-events worker already occupies. No new package
dependency is required to satisfy this decision.

---

## HTTP / USER TRIGGER

`apps/web/app/api/` contains only `health/`, `payments/{create-order,verify}/`, `ready/`, and
`webhooks/razorpay/`. **No route exists anywhere to create a Search, trigger discovery, or read
Opportunity data.** R-34 (worker orchestration) does not require adding one: the worker consumes
already-`PENDING` Search rows regardless of how they were created, and every existing integration
test creates Search rows by calling `core-search`'s `createSearch()` directly, not via HTTP.
Building a Search-creation HTTP route is a separate, unauthorized-here concern (arguably part of
R-05's own HTTP integration, not named in R-34's text). OQ-2 (auth mechanism) and OQ-3 (entitlement
gating) remain independent open questions, not dependencies of Phase 17 — nothing in R-34's text
or the roadmap ties worker execution to resolving either.

---

## DATABASE / MIGRATION PREFLIGHT

**`NO NEW MIGRATION REQUIRED`** for correctness. Migration `0014_searches` already provisions
every column the claim/lease/retry mechanism needs: `attempts`, `last_error`, `lease_owner`,
`lease_expires_at`, `idempotency_key` — its own inline comment states these exist as "foundation
for the worker that will claim and execute this Search in a later phase," i.e., for exactly this
phase. This holds under the resolved decisions too: the maximum-3-attempts cap (RESOLVED
DECISIONS §2) is an application-level constant compared against the existing `attempts` column —
it needs no new column, check constraint, or enum value. The crash-recovery edge (RESOLVED
DECISIONS §1) reuses `lease_owner`/`lease_expires_at` exactly as provisioned. The polling worker
(RESOLVED DECISIONS §3) needs no schema change at all.

One non-blocking observation: `searches` has indexes on `user_id` and `service_profile_id` only —
no index on `status` (or `status, created_at`) to support an efficient cross-user
`WHERE status='PENDING' ... FOR UPDATE SKIP LOCKED` claim scan at volume (contrast `meta_events`,
which likely has one for its own claim query — not inspected further as out of scope). This is a
performance consideration, not a correctness or semantics gap, and any such index would be a
purely additive migration consistent with the repository's existing migration policy (DEC-006) —
not a new product/architecture decision. Left for the implementer to size against real query
plans rather than pre-authorized here.

---

## TEST ARCHITECTURE

Existing harness confirmed: `tests/integration/support/{pgIndexHarness.ts, pgOrderRepository.ts,
suiteDb.ts}` — real-Postgres integration harness already used by
`search.integration.test.ts`, `discovery.integration.test.ts`, `research.integration.test.ts`,
`opportunity*.integration.test.ts`, and `meta-event-worker.concurrency.test.ts`. This is the
harness Phase 17 should reuse; no new test infrastructure is indicated.

**Unit evidence needed:** orchestration success path (mocked repositories), claim behavior
(mocked `claim()`/fencing), ownership propagation (claimed `user_id` reaches every downstream
call), failure-path branching (Discovery/Research/Opportunity each failing individually).

**Integration evidence needed (real Postgres):** end-to-end `PENDING → RUNNING → COMPLETE` for a
real Search producing real Discovery/Research/Opportunity rows; each of the three named failure
cases in AC-25 landing in a defined, inspectable state.

**Concurrency evidence needed:** duplicate-claim prevention for `searches` (mirroring the 8
parallel-worker meta-events test), lease-expiry reclaim without charging `attempts`, stale-worker
fencing on settlement — same scenarios `meta-event-worker.concurrency.test.ts` already proves for
`meta_events`.

**Bounded-retry evidence needed (new, per RESOLVED DECISIONS §2):** a Search that fails once or
twice returns to `PENDING` with `attempts` reflecting the attempt count and is successfully
reclaimed; a Search that fails on its third attempt lands in `FAILED` with the failure recorded in
`last_error` and is never claimed again (the claim query's `status = 'PENDING'` predicate alone
enforces this, since `FAILED` is terminal).

**Crash-recovery evidence needed (new, per RESOLVED DECISIONS §1):** a Search whose lease expires
mid-`RUNNING` (simulated worker crash) returns to `PENDING` with `attempts`/`last_error`
unchanged, is reclaimed by a different worker instance, and no result from the original
(now-fenced) worker is ever written under it.

**Poll-loop evidence needed (new, per RESOLVED DECISIONS §3):** `apps/worker/src/index.ts` runs a
long-running poll loop against real Postgres (integration-level, not just unit-mocked) that
claims, processes, and settles at least one real Search end to end.

**R-33 evidence needed:** User A / User B isolation across a real concurrent worker run, per the
R-33 GATE section above.

**Regression evidence needed:** all Phase 1–16 suites (`tests/integration/*.test.ts`, all
package-level `vitest` suites) remain green — no existing test may be modified by Phase 17
implementation without explicit justification.

---

## ACCEPTANCE CRITERIA MAPPING

| AC | Requirement | Repository evidence | Implementation implication | Required test | Evidence for PASS |
|---|---|---|---|---|---|
| AC-23 | Results recorded under the Search row's owner, never a worker-supplied identity | No code path today accepts a caller-supplied `userId` for these writes; the gap is that no orchestration exists to carry the claimed row's `user_id` through | New orchestration must read `userId` only from the claimed Search row and thread it through every downstream call | Integration test: claim a Search, verify every resulting Company/Prospect/ResearchSignal/Opportunity/AiUsageEvent row's owner equals the Search's `user_id`, never any other value | Direct SQL assertion, real Postgres |
| AC-25 | Discovery failure, research failure, and worker crash each leave Search/Opportunity in a defined, uncorrupted state | Discovery/Research/Opportunity failure and worker crash are now all fully specified (RESOLVED DECISIONS §1–2) | New claim method; new unconditional lease-expiry release method (`RUNNING → PENDING`, `attempts` untouched); new bounded-retry settlement path (`attempts`-gated `RUNNING → PENDING` or `RUNNING → FAILED` with `last_error`, max 3) | Four integration tests: one per named failure mode plus one for retry exhaustion (3rd failure → `FAILED`), asserting Search state, `attempts`, `last_error`, and that no Opportunity row is corrupted/partially written | Real Postgres, all four scenarios |
| G-07 (worker correctness) | Workers operate on authoritative persisted ownership; a stale worker cannot overwrite a live one | Fencing pattern proven in `metaEvents/pgRepository.ts`; not yet applied to `searches` | Apply the same fenced-UPDATE pattern to every settlement write for `searches`, including the new retry and lease-release paths | Concurrency test: fence a stale worker, verify no write from it lands, including during a retry/release settlement | Real Postgres |
| G-08 (failure handling) | Provider error, research failure, worker crash, lease expiry each leave state defined and uncorrupted | Same as AC-25 — now fully resolved, no open item | Same as AC-25 | Same as AC-25 | Same as AC-25 |
| G-09 (integration testing) | Critical journey paths integration-tested against real Postgres | Harness exists and is proven (`tests/integration/support/`) | Reuse harness; add worker-specific integration tests | End-to-end claim→Discovery→Research→Opportunity test | Real Postgres |
| G-06 / R-33 | No caller-supplied identity bypasses ownership; verified by cross-user test per owned model | Pattern exists (`search.integration.test.ts` "identity boundary"/"Search ownership" blocks); not yet extended to worker-claimed execution | Add cross-user worker-execution test | Two-user concurrent worker run | Real Postgres |

---

## EXPLICIT NON-AUTHORIZED WORK

The following are explicitly **not** authorized by this preflight or by R-34's text, and must not
be introduced by a Phase 17 implementation:

Outreach · Follow-up · Proposal · CRM · autonomous outreach · autonomous negotiation ·
subscriptions · billing · payments · quotas · credits · UI redesign · dashboard implementation ·
new AI agent architecture · new discovery algorithm · new research algorithm · new scoring
algorithm · new offer logic · new staleness logic · new next-action logic · new feedback logic ·
any change to R-29 accounting semantics · reopening Phases 1–16 · R-33 as an independent
implementation phase.

Also explicitly not authorized, now definitively (per RESOLVED DECISIONS §3, not merely "absent a
decision"): Redis · Kafka · RabbitMQ · SQS · BullMQ · any other queue or message broker · a
separate scheduler service · deployment architecture changes · cloud infrastructure · a new worker
framework · a distributed locking system beyond the already-proven `FOR UPDATE SKIP LOCKED`
pattern. Worker scheduling is confirmed as an in-process, long-running PostgreSQL polling loop
inside the existing `apps/worker` application — nothing external to it.

---

## RESOLVED DECISIONS (formerly OPEN DECISIONS)

The three items that previously blocked implementation have been resolved by explicit
product/architecture decision. Each resolution is recorded verbatim, followed by its
implementation implication as established elsewhere in this document.

### 1. Crash recovery — RESOLVED

> An expired `RUNNING` lease returns the Search to `PENDING`. The Search becomes eligible for
> reclamation by another worker. The existing Search row and its persisted attempt/error metadata
> are preserved. No new lifecycle state is introduced.

Implication: a dedicated, unconditional lease-expiry release operation (mirroring
`metaEvents.releaseExpiredLeases`) is added to `core-search`'s persistence layer. It does not
increment `attempts` and does not write `last_error`. `SearchStatus` remains exactly
`PENDING | RUNNING | COMPLETE | FAILED | CANCELLED` — no sixth value. See STALE WORKER / CRASH
SEMANTICS and FAILURE SEMANTICS above.

### 2. Bounded retries — RESOLVED

> Maximum automatic attempts per Search: 3. Attempts are persisted using the existing
> `searches.attempts` field. After the third failed attempt, transition the Search to `FAILED`.
> Persist the final failure in `last_error`. A Search in `FAILED` after retry exhaustion must not
> be automatically retried by the worker. No additional retry states are introduced.

Implication: on an explicit Discovery/Research/Opportunity failure, the settlement path checks the
current `attempts` value (already incremented at claim time, per the existing `transition()`
convention extended to the new claim method): if fewer than 3, transition `RUNNING → PENDING`
(retry-eligible, `attempts` otherwise unchanged); on the third, transition `RUNNING → FAILED` and
persist the failure in `last_error`. `FAILED` remains terminal — the claim query's
`status = 'PENDING'` predicate alone is sufficient to guarantee a `FAILED` Search is never claimed
again; no additional status value or column is introduced. See SEARCH EXECUTION MODEL, NEW
ORCHESTRATION LOGIC REQUIRED, and FAILURE SEMANTICS above.

### 3. Worker scheduling — RESOLVED

> `apps/worker` uses a long-running PostgreSQL polling loop. Search claiming uses PostgreSQL
> `FOR UPDATE SKIP LOCKED`. Claims are protected by the existing lease/fencing fields. No Redis,
> Kafka, RabbitMQ, SQS, BullMQ, or other queue/broker. No separate scheduler service.
> Polling/lease behavior stays within the existing worker application.

Implication: `apps/worker/src/index.ts`'s real body is an in-process poll loop calling the new
`searches` claim method (§1 of NEW ORCHESTRATION LOGIC REQUIRED above), on the same fencing fields
(`lease_owner`, `lease_expires_at`) already provisioned by migration `0014_searches`. No new
package dependency, external service, or deployment topology change is introduced. See QUEUE /
SCHEDULER / TRIGGER above.

---

### Remaining non-blocking open item (unchanged, out of scope for this revision)

4. **Handling of a partially-successful Discovery batch.** No requirement defines whether a
   Discovery run where some candidates persisted and others errored counts as a Search failure or
   a (possibly degraded) success. Existing code already leans toward "degraded success" —
   `DiscoveryRunResult.skipped` counts candidates that failed to normalize without treating the
   run as a failure — but the PRD does not explicitly bless this as intentional product behavior.
   This item was **not** part of the three decisions this revision resolves, was **not** listed
   among the blocking items in the original preflight's `FINAL SCOPE-LOCK DECISION`, and remains a
   narrow, non-blocking implementation detail carried forward unchanged.

---

## IMPLEMENTATION ORDER (proposed, not executed)

```text
1. Add the searches-table claim method (FOR UPDATE SKIP LOCKED, increments attempts on
   PENDING -> RUNNING), the unconditional lease-expiry release method (RUNNING -> PENDING,
   attempts/last_error untouched), and the attempts-gated failure-settlement method
   (RUNNING -> PENDING when attempts < 3, RUNNING -> FAILED + last_error on the 3rd) to
   core-search, mirroring apps/worker/src/metaEvents/pgRepository.ts's proven pattern.
   RESOLVED DECISIONS #1 and #2 fully specify this step's behavior.
2. Implement apps/worker/src/index.ts's real body as an in-process PostgreSQL poll loop
   against the new claim method, per RESOLVED DECISIONS #3.
3. Build the worker-facing orchestration adapter that carries a claimed row's persisted
   userId through Discovery -> Research -> Opportunity without a session token
   (item 4 under NEW ORCHESTRATION LOGIC REQUIRED).
4. Wire Discovery (reuse runDiscovery's internal logic via the new adapter).
5. Wire Research, composing signal persistence (runResearch's logic) with AI usage
   metering (runMeteredResearch's onInvocation hook) in one researchLead() call, per
   the R-29 scope lock's own requirement.
6. Wire Opportunity (reuse createOpportunity's internal logic via the new adapter).
7. Verify ownership propagation (AC-23) end to end.
8. Verify failure semantics (AC-25) for all three named failure modes plus crash, and
   bounded-retry exhaustion (3rd failure -> FAILED).
9. Verify concurrency / stale-worker / lease-expiry behavior (mirrors
   meta-event-worker.concurrency.test.ts).
10. Run R-33 isolation verification (two-user concurrent worker run, real Postgres).
11. Run full regression suite (all Phase 1-16 package + integration tests).
12. Diff audit.
13. Commit.
```

This order starts directly with the claim/lease/retry repository method because RESOLVED
DECISIONS #1 and #2 now fully specify its settlement behavior — no further sign-off gates that
step. The step remains first because every later step (the poll loop, the orchestration adapter,
and all three pipeline-wiring steps) depends on it existing.

---

## EXIT CRITERIA

Phase 17 is complete only when: the worker claims and executes real Searches against real
Postgres end to end (PENDING → RUNNING → COMPLETE, and each AC-25 failure mode, including
bounded-retry exhaustion to `FAILED` on the third attempt and unconditional lease-expiry recovery
to `PENDING`); AC-23 and G-06/G-07/G-08/G-09 are demonstrated by integration tests, not
inspection; R-33 cross-user isolation is proven for the worker path specifically; the worker runs
as an in-process PostgreSQL poll loop with no queue/broker dependency introduced; all Phase 1–16
suites remain green; and no non-authorized capability (see EXPLICIT NON-AUTHORIZED WORK) has
entered the codebase.

---

## GIT / WORKING-TREE RULES

No implementation file, migration, test, package manifest, lockfile, or configuration file was
changed by the original preflight task or by this revision. `apps/web/tsconfig.tsbuildinfo`'s
pre-existing modification and the two pre-existing untracked files were left untouched throughout.
This document was the only file created by the original task and the only file modified by this
revision. Nothing was staged or committed at any point.

---

## FINAL SCOPE-LOCK DECISION

```text
READY TO IMPLEMENT
```

The three items that previously blocked implementation are now resolved by explicit
product/architecture decision (see RESOLVED DECISIONS above):

1. **Crash recovery** — an expired `RUNNING` lease returns the Search to `PENDING`, unconditionally,
   preserving `attempts`/`last_error`; no new lifecycle state.
2. **Bounded retries** — maximum 3 automatic attempts, persisted in the existing `attempts` field;
   the third failed attempt transitions to `FAILED` with the failure persisted in `last_error`;
   `FAILED` remains terminal and is never automatically retried.
3. **Worker scheduling** — `apps/worker` runs a long-running, in-process PostgreSQL polling loop;
   claiming uses `FOR UPDATE SKIP LOCKED`; claims are protected by the existing lease/fencing
   fields; no queue, broker, or separate scheduler service is introduced.

Everything else required for R-34 — the claim/fence SQL pattern, the ownership model, the
dependency graph, the R-29 integration point, the R-33 evidence requirements, the test harness,
and the database schema — was already authoritatively decided by the PRD, the Worker Ownership
section, and/or proven by the existing meta-events implementation. With the three items above now
resolved, no further product or architecture decision blocks Phase 17 implementation. No new
decision was invented beyond the three supplied; the one remaining non-blocking open item
(partially-successful Discovery batch handling, §4 under RESOLVED DECISIONS) was already
non-blocking in the original preflight and is carried forward unchanged.
