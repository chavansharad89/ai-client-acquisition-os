# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Production Wiring Decision Preparation

**Record ID:** `PDEF4-PCG4-TCMATCH-PRODWIRING-PREP-001`
**Date:** 2026-10-05
**STATUS: PREPARATION ONLY — NO IMPLEMENTATION, WIRING, DEPLOYMENT, RELEASE, OR LAUNCH AUTHORITY OF ANY KIND IS
GRANTED BY THIS DOCUMENT.** No Product Owner or Engineering decision is created, implied, inferred, or
authorized here. No file outside `requirement/` is read with intent to modify, and none is modified.

Raised by the pre-commit review of `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001`'s implementation (conversational
review in this session, not a hashed file — see §0a), which found the implementation structurally complete and
tested but **inert in production**: nothing in `apps/worker/src/index.ts` or `apps/worker/src/searchWorker/
worker.ts` invokes the new `targetCustomerMatch` dependency.

---

## 0. Governing chain (file + SHA-256, read-only; cited, not restated or altered)

| # | File | Record ID | SHA-256 |
|---|---|---|---|
| 1 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_PRODUCT_OWNER_DECISION.md` | `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` | `61ac1ada3fd29272f789b569047f6fb707252df2d1e82691402d9b4dc45c4eec` |
| 2 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md` | `PDEF4-PCG4-ED-DEC-001` | `1f16a37323f9a77850023207e31f5e6db51c07ddae00d6cf498c768a614d263f` |
| 3 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION.md` | `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001` | `02af7f095c6d4e3309e5dc75f53424a76ca795aaf468a6ab7c025e46ee48ed54` |
| 4 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_IMPLEMENTATION_AUTHORIZATION_DECISION_PREPARATION.md` | `PDEF4-PCG4-TCMATCH-IMPL-AUTH-PREP-001` | `8974317d42b26688837431287a81c0d8685a9e2266114409538117cd74b0a5e0` |
| 5 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` | `PDEF4-PCG4-PO-DEC-001` | `84db9339765c209cc4ed8ad9319400dd3f1e359c6f62e02afd9aecca56a6484d` |
| 6 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_IMPLEMENTATION_AUTHORIZATION_DECISION.md` | `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` | `8b39f6ee80fe9176a4c34e8c6b1724bcc74007006b5e618d4db048e3e34d7178` |

All six were read in full this session, treated as binding and read-only. None was modified.

### 0a. Non-file input (not hashed, cited as context only)

The "pre-commit review" that raised this preparation is prose in this conversation's own transcript, not a
file under version control. It has no SHA-256 to verify because it is not a document this project's
hash-verification convention applies to. Its substantive claims (gap location, unresolved model/provider
choice) are independently re-derived from source in §1 below, not taken on faith.

**Baseline:** `git rev-parse HEAD` → `af9ede93830f5e3e611195dc2451a470364def74`. `git status --porcelain | wc -l`
→ 94 (unchanged since `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` was written — no commit has occurred between that
record and this one). No tracked file was modified by this task.

---

## 1. Production call path (traced from source, this session)

```
apps/worker/src/index.ts  main()
  │
  ├─ builds `attempts: ResearchProviderAttempt[]` from env.RESEARCH_PROVIDER/RESEARCH_MODEL
  │    via createResearchModel(researchModelConfigFor(...))              [index.ts:92-105]
  │
  ├─ researchProvider: (userId) => createFallbackResearchProvider({ sourceDocuments, attempts, onUsage })
  │                                                                       [index.ts:125-133]
  │
  └─ builds SearchWorkerPollLoopDeps, including:
       categoryPlausibility: createPgCategoryPlausibilityRepository(pool)   [index.ts:136]
       (no `targetCustomerMatch` key — does not exist in this object today)
         │
         ▼
apps/worker/src/searchWorker/worker.ts
  │
  ├─ SearchWorkerDeps (type) — has `categoryPlausibility?: CategoryPlausibilityRepository`
  │    (no `targetCustomerMatch?` field declared)                        [worker.ts:190]
  │
  ├─ claimAndProcessNextSearch → runCanonicalPipeline → researchProspectForOwner(deps, userId, prospectId)
  │
  └─ researchProspectForOwner builds the deps object passed into runResearchForOwner:
       {
         companies, prospects, searches, signals,
         provider: deps.researchProvider(userId),
         ...(deps.categoryPlausibility ? { categoryPlausibility: deps.categoryPlausibility } : {}),
         // no equivalent spread for `targetCustomerMatch` — absent entirely
       }                                                                  [worker.ts:412-425]
         │
         ▼
packages/core-research/src/service.ts  runResearchForOwner()
  │
  ├─ `if (deps.categoryPlausibility) { ... }`                            [service.ts: category-plausibility block]
  ├─ `if (deps.targetCustomerMatch) { const { repository, model, options } = deps.targetCustomerMatch; ... }`
  │     — this branch is fully implemented and tested (59/59 unit tests, 8/8 real-Postgres integration tests
  │       per the pre-commit review), but is NEVER REACHED IN PRODUCTION because the caller
  │       (researchProspectForOwner, above) never supplies `deps.targetCustomerMatch` — the key is absent from
  │       SearchWorkerDeps entirely, not merely unset.
  │         │
  │         ▼
  │   packages/core-research/src/targetCustomerMatch.ts — evaluateTargetCustomerMatch()
  │         │
  │         ▼
  │   packages/core-research/src/targetCustomerMatchRepository.ts — createPgTargetCustomerMatchRepository(pool)
  │     — exported from packages/core-research/src/index.ts, imported by NOTHING in apps/worker or apps/web.
  │
  └─ (pcg4.ts's LEFT JOIN read side is separately wired and already live — not part of this gap; confirmed by
       the 11/11 passing pcg4.test.ts and the real-Postgres PCG-4 E2E test. The gap is write-side only: no row
       is ever produced in production for the join to read.)
```

**Finding:** the evaluator, repository, migrations, and `pcg4.ts` read-side are all production-ready and
tested. The sole gap is three missing lines of wiring: (a) `apps/worker/src/index.ts` constructing a
`targetCustomerMatch` dependency object, (b) `SearchWorkerDeps` (worker.ts) declaring a `targetCustomerMatch?`
field, and (c) `researchProspectForOwner` (worker.ts) spreading it into the `runResearchForOwner` call —
structurally identical, line-for-line, to how `categoryPlausibility` is already wired at all three points.

---

## 2. Already authorized vs. requires a new decision

| Item | Status |
|---|---|
| `targetCustomerMatch.ts` evaluator, `targetCustomerMatchRepository.ts`, migrations 0036/0037, `service.ts`'s `if (deps.targetCustomerMatch)` branch, `pcg4.ts` join/translation | **Already authorized and implemented** (`PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §2/§3) |
| Adding a `targetCustomerMatch?` field to `SearchWorkerDeps` (worker.ts) and spreading it in `researchProspectForOwner`, mirroring the existing `categoryPlausibility` pattern exactly | **Mechanical consequence of the existing authorization** (see §3) — the authorization already committed to this dependency existing and being optional/pattern-matched on `categoryPlausibility`; declaring the plumbing that lets a caller supply it changes no behavior for any caller that omits it (same "omitting it skips both the model call and the write" guarantee `service.ts`'s own doc comment already states for this exact dependency). Still listed here for explicit sign-off rather than silently bundled, per the discipline this task was asked to apply. |
| Constructing the repository argument: `targetCustomerMatch.repository: createPgTargetCustomerMatchRepository(pool)` in `apps/worker/src/index.ts` | **Mechanical** — `createPgTargetCustomerMatchRepository` is already exported, already authorized (migrations 0036/0037 + repository write path, §2 of IMPL-AUTH-DEC), and has exactly one production-sensible construction (`pool`), identical in shape to `createPgCategoryPlausibilityRepository(pool)` on the adjacent line. |
| Constructing the `model`/`modelId`/`providerId`/`promptVersion` argument — i.e., **which concrete model/provider configuration actually issues the bounded TC-MATCH-1 call in production** | **Requires a new engineering decision.** No cited record states this. `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001` and `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` both define the *interface* (`TargetCustomerMatchModelDeps`) and the *test* doubles, but neither selects a production value. This is the one genuinely open question (§4 below). |
| Enabling/disabling the dependency in a specific environment (e.g., staging-only vs. all environments), rollout sequencing, monitoring of the new determination rows, or anything about PCG-4's own launch/monitoring semantics | **Not authorized by any record, and explicitly out of scope for this preparation too** — `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` §9 reserves all of this for separate, later authorization. |

---

## 3. `categoryPlausibility`'s existing wiring, and whether `targetCustomerMatch` can safely follow it

`categoryPlausibility` is wired at exactly three points (`index.ts:136`, `worker.ts:190` type declaration,
`worker.ts:421` conditional spread), all keyed on *presence* of the dependency — omitting it from
`SearchWorkerDeps` at construction time is defined, by `service.ts`'s own doc comment on this dependency, to
skip the model call and the write without affecting anything else (the same guarantee `categoryPlausibility`
and `qualifications`/`personalizations`/`outreachPreparations`/`followUpPreparations` already rely on). This
is the project's established "optional capability, chained on real presence, never a boolean flag" convention
(also used for `Workstream` gating in `runPostResearchPipelineForOwner`, e.g. `if (deps.qualifications &&
deps.categoryPlausibility)`).

**`targetCustomerMatch` fits this pattern exactly, with no modification needed to the pattern itself:**
- It is already optional at the `service.ts` level (`deps.targetCustomerMatch?`), already gated on presence,
  already defined (same doc comment cited in §1 above, repeated verbatim: "omitting it skips both the model
  call and the write... unchanged from today").
- Unlike `qualifications`→`personalizations`→`outreachPreparations`→`followUpPreparations`, it has **no
  downstream dependency chain** — nothing else in `runPostResearchPipelineForOwner` reads
  `deps.targetCustomerMatch`; only `pcg4.ts`'s read-side (already live) depends on the *row* existing, not on
  any other worker-level dependency being present. So wiring it requires no change to the chained-presence
  gating logic anywhere else in `worker.ts`.
- The one way it *could* fail to fit the pattern cleanly is if constructing its `model` argument required
  something `categoryPlausibility`'s wiring has no analogue for — which is exactly the open question in §4.

**Conclusion: the dependency-presence *pattern* is proven safe and requires no new decision. The *construction*
of one specific field inside it (`model`) does.**

---

## 4. Comparison: reuse vs. independent model/provider vs. another existing pattern

### Option A — Reuse the existing research model/provider configuration

Construct `targetCustomerMatch.model` from the same `createResearchModel(researchModelConfigFor(env.RESEARCH_PROVIDER, env.RESEARCH_MODEL, env))` call already used for `attempts[0].model` in `apps/worker/src/index.ts:95` — either the exact same object or a second call with identical config.

### Option B — Independently configured model/provider

Introduce new env vars (e.g. `RESEARCH_TCM_PROVIDER`/`RESEARCH_TCM_MODEL`) and a separate `createResearchModel(...)` call, letting target-customer-match run on a different model (e.g. a cheaper/faster one) than the main research pipeline.

### Option C — Another existing repository-approved pattern

Searched for one. `categoryPlausibility` is not a candidate — by design (TC-MATCH-12, `PDEF4-PCG4-ED-DEC-001`) target-customer-match must never reuse categoryPlausibility's *computed output*, and categoryPlausibility itself issues no independent model call to pattern-match on (it reads the main research call's output). No other feature in this codebase constructs a second, independent bounded model call alongside the main research call per Prospect — **TD-1 makes this the first one**. No Option C exists today; this reduces to a choice between A and B.

### Comparison table

| Dimension | A — Reuse | B — Independent config |
|---|---|---|
| **API-call count per Prospect research run** | +1 call (TD-1 forbids reuse of the main call's output — this is additive either way), using the same provider endpoint already being called | +1 call, to a potentially different provider endpoint |
| **Cost** | Priced at whatever `env.RESEARCH_MODEL` already costs (today's default, per `index.ts`'s own comment, is `RESEARCH_PROVIDER=anthropic` with no fallback) — no new cost tier to reason about | Opens the door to a deliberately cheaper model for this narrower, more bounded task (TC-MATCH-1's output shape is much smaller than full research) — but only if someone makes that choice; defaults to the same cost as A if left unconfigured |
| **Latency** | Same per-call latency profile as the main research call (same model) | Could be lower if a smaller/faster model is chosen; could be higher if misconfigured; unknown until decided |
| **Retry behavior** | `callTargetCustomerMatchModel`'s own retry loop (`TargetCustomerMatchModelOptions.maxAttempts`, backoff) is independent of the main pipeline's retry loop either way — this dimension does not actually differ between A and B; both call the *same* retry logic in `targetCustomerMatch.ts`, just against a different model instance | Same as A |
| **Idempotency** | Unaffected by either option — idempotency is enforced by `ai_usage_events`' `UNIQUE(provider, provider_message_id)` (migration 0021) and by TD-8's partial unique index on the determination row, neither of which cares which model answered | Same as A |
| **Model/version provenance (TD-6)** | `modelId`/`providerId` are static identifiers supplied by the caller (`apps/worker/src/index.ts`), not inferred from the model instance — so provenance correctness depends on keeping these two strings in sync with whichever `createResearchModel(...)` config is actually passed, for EITHER option; A makes this trivially correct by construction (same config, same strings as the main attempt already uses for its own metadata), B requires a second pair of config values to keep in sync | Same mechanism, but doubles the surface for the two strings to drift from the actual config if someone changes one without the other |
| **Failure semantics** | Already decided and already implemented, independent of A vs. B: `TC-MATCH-9`/`TD-14` — any model/evaluator failure resolves to a persisted `NOT_YET_OBSERVED` row, never a thrown error, never blocking the rest of `runResearchForOwner`. This is a property of `targetCustomerMatch.ts`'s own code, not of which model is wired in — unaffected by this decision either way | Same |
| **Usage metering (ai_usage_events)** | `TargetCustomerMatchModelOptions.onInvocation` already exists as the hook, structurally parallel to the main pipeline's `attempts[].onUsage`-via-`createFallbackResearchProvider`. Neither A nor B automatically wires this — it must be explicitly passed in `apps/worker/src/index.ts` for either option, reusing `aiUsageEvents.recordEvent` the same way `index.ts:129-132` already does for the main pipeline. This is a shared implementation detail of *either* option, not a differentiator between them | Same |
| **New configuration surface** | None — zero new env vars | Two new optional env vars, plus `researchModelConfigFor`'s existing `exactOptionalPropertyTypes`-safe construction pattern would need to be reused or duplicated for the TC-MATCH config |
| **Operational risk if the choice is wrong** | Low — if a cheaper/faster model later proves desirable, Option B's env vars can be added later without touching `targetCustomerMatch.ts`, `service.ts`, or the repository at all (only `apps/worker/src/index.ts` changes) | None additional over A, since nothing about B is irreversible either — but front-loads config surface for a need not yet demonstrated |

**Observation (not a decision):** A and B are not mutually exclusive forever — A today does not foreclose B
later, since the only code that would ever need to change to move from A to B is the few lines in
`apps/worker/src/index.ts` that construct the `TargetCustomerMatchModelDeps` object. Nothing in
`targetCustomerMatch.ts`, `service.ts`, the repository, or `pcg4.ts` depends on which option is chosen.

---

## 5. Mechanical vs. requires-a-new-decision — summary

- **Mechanical / already derivable from `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001`:** the `SearchWorkerDeps` field
  declaration, the conditional-spread wiring in `researchProspectForOwner`, and the repository construction
  (`createPgTargetCustomerMatchRepository(pool)`).
- **Requires a new, explicit engineering decision:** which of Option A or Option B supplies
  `targetCustomerMatch.model`/`modelId`/`providerId` in `apps/worker/src/index.ts`, and whether usage metering
  (`onInvocation` → `aiUsageEvents.recordEvent`) is wired for this call now or deferred.

---

## 6. Files that would change (if and when a decision authorizes it — none changed by this record)

- `apps/worker/src/index.ts` — construct `targetCustomerMatch: { repository: createPgTargetCustomerMatchRepository(pool), model: <per decision>, modelId: <per decision>, providerId: <per decision>, options: { onInvocation: <per decision on whether metering is wired now> } }` and add it to the `SearchWorkerPollLoopDeps` object.
- `apps/worker/src/searchWorker/worker.ts` — add `targetCustomerMatch?: ResearchDeps['targetCustomerMatch']` (or an equivalent locally-declared type) to `SearchWorkerDeps`, and add `...(deps.targetCustomerMatch ? { targetCustomerMatch: deps.targetCustomerMatch } : {})` to the object `researchProspectForOwner` passes into `runResearchForOwner`.
- Test extensions for both files, per §7 below.

No other file needs to change. In particular, `core-research/**`, `core-launch-gates/**`, and the migrations are
already correct and need no further change for this wiring.

---

## 7. Tests that would be required

- **Worker-level unit test** (`apps/worker/src/searchWorker/worker.test.ts`): a case supplying
  `deps.targetCustomerMatch` and asserting `researchProspectForOwner` forwards it into the
  `runResearchForOwner` call exactly as `categoryPlausibility` is already asserted to be forwarded (locate the
  existing `categoryPlausibility`-forwarding test as the template) — plus the existing "omitting it changes
  nothing" case, mirrored for `targetCustomerMatch`.
- **Real-Postgres integration test** (extension of `tests/integration/search-worker.integration.test.ts`, or a
  new file following that directory's convention): a full `claimAndProcessNextSearch` run with a real
  `targetCustomerMatch` dependency (repository against the real test Postgres instance, a fake bounded model)
  asserting a `target_customer_match_determinations` row is actually written end-to-end through the worker
  entrypoint — not just through `runResearchForOwner` directly (which the existing PCG-4 E2E test already
  covers; this would be the first test exercising the *worker's own* wiring of it).
- If usage metering is wired: a test asserting an `ai_usage_events` row is recorded for the target-customer-match
  call, keyed on `(provider, provider_message_id)` per migration 0021, analogous to existing coverage for the
  main research call.

---

## 8. Explicitly unauthorized / out of scope (unchanged by this record)

- Production deployment, release, launch, or rollout of any kind.
- Enabling this dependency in any specific environment.
- Any change to PCG-4's existing launch/monitoring semantics.
- Any change to `packages/core-qualification-equivalence/**`.
- Any change to the substance of any record in §0's governing chain.

---

## 9. Explicitly not performed by this record

No source file, test file, migration, schema, or worker-wiring file was read with intent to modify, and none
was modified, created, or deleted. No commit made. No push made. This record creates no authorization — it
exists solely to support a subsequent, separate engineering-decision questionnaire and decision record.

---

## 10. Git verification

- `git rev-parse HEAD` before: `af9ede93830f5e3e611195dc2451a470364def74`
- `git status --porcelain | wc -l` before: 94
- `git rev-parse HEAD` after: unchanged (no commit made by this task)
- `git status --porcelain | wc -l` after: expected 95 (94 pre-existing + this one new untracked file)
- No tracked file modified by this task.
