# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Production Wiring Decision

**Record ID:** `PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001`
**Date:** 2026-10-05
**Decision authority:** Exercised under **delegated authority by Claude**, explicitly authorized by the human
user for this single task. This is **not** a human Product Owner's or Engineer's personal decision. It does
not reopen, reinterpret, or alter the substance of any prior Product Owner or Engineering decision cited below.
**Scope:** Wiring-authorization record only. Does **not** implement, modify, or create any source file,
migration, schema, or test. Does **not** authorize deployment, release, launch, or production rollout.

---

## 0. Governing chain (read-only; cited, not restated or altered)

| # | File | Record ID | SHA-256 |
|---|---|---|---|
| 1 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_EVALUATION_MECHANISM_PRODUCT_OWNER_DECISION.md` | `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001` | `61ac1ada3fd29272f789b569047f6fb707252df2d1e82691402d9b4dc45c4eec` |
| 2 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_ENGINEERING_DESIGN_DECISION.md` | `PDEF4-PCG4-ED-DEC-001` | `1f16a37323f9a77850023207e31f5e6db51c07ddae00d6cf498c768a614d263f` |
| 3 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_TECHNICAL_DESIGN_DECISION.md` | `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001` | `02af7f095c6d4e3309e5dc75f53424a76ca795aaf468a6ab7c025e46ee48ed54` |
| 4 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCT_OWNER_DECISION.md` | `PDEF4-PCG4-PO-DEC-001` | `84db9339765c209cc4ed8ad9319400dd3f1e359c6f62e02afd9aecca56a6484d` |
| 5 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_IMPLEMENTATION_AUTHORIZATION_DECISION.md` | `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` | `8b39f6ee80fe9176a4c34e8c6b1724bcc74007006b5e618d4db048e3e34d7178` |
| 6 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCTION_WIRING_DECISION_PREPARATION.md` | `PDEF4-PCG4-TCMATCH-PRODWIRING-PREP-001` (**primary input**) | `2ef39dfeb06beba01d1c1ca5d50b1dcf2a50f64195a7fd97479455db0175c7dd` |
| 7 | `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCTION_WIRING_DECISION_QUESTIONNAIRE.md` | `PDEF4-PCG4-TCMATCH-PRODWIRING-QUESTIONNAIRE-001` (**answered**) | `1efb79eb530c9669c8a15e1cdde495812a59c0915997bf3de26577f32fb91109` |

All seven were treated as binding and read-only. None was modified by this record.

---

## 1. The decisions (resolved here, under delegated authority, per the completed questionnaire)

### 1.1 Model/provider source (Q1) — **(A) Reuse**

Production `targetCustomerMatch.model`/`modelId`/`providerId` in `apps/worker/src/index.ts` are constructed
from the same `createResearchModel(researchModelConfigFor(env.RESEARCH_PROVIDER, env.RESEARCH_MODEL, env))`
configuration already used for the main research pipeline's first attempt (`index.ts:95`) — either the exact
same `ResearchModel` instance or a second call with identical config; either is behaviorally equivalent for
this purpose and the implementer may choose either, since neither has any state that would make them diverge.
`providerId` = `env.RESEARCH_PROVIDER`; `modelId` = `env.RESEARCH_MODEL` when set, or — when unset (the
Anthropic-only default path, per `researchModelFactory.ts`'s own documented "Falls back to each adapter's own
default (Anthropic only...)" comment) — the literal default model string actually used internally by
`createAnthropicResearchModel`/`anthropicModel.ts`, read and mirrored exactly at implementation time, never
independently invented. This is a residual implementation detail, not a further decision: the string must
match whatever the adapter actually used for that invocation, by construction, not by a second guess.

**Rationale.** Per preparation §4's comparison: zero new configuration surface, provenance-string correctness
by construction (same values the main attempt already uses for its own bookkeeping), and nothing about this
choice forecloses moving to an independently-configured model later — that migration path touches only
`apps/worker/src/index.ts`, never `targetCustomerMatch.ts`, `service.ts`, the repository, or `pcg4.ts`. No
cited record demonstrates a need for a different model on cost or latency grounds; inventing one now would be
speculative.

### 1.2 Prompt version (Q2) — **omit the field**

`apps/worker/src/index.ts` does not supply `promptVersion` in `TargetCustomerMatchModelDeps`. The module's own
default, `TARGET_CUSTOMER_MATCH_PROMPT_VERSION = 'target-customer-match-v1'`
(`packages/core-research/src/targetCustomerMatch.ts:46`), applies — already exercised by
`targetCustomerMatch.test.ts`'s existing TD-6 coverage.

### 1.3 Usage metering (Q3) — **deferred, with a documented reason**

`TargetCustomerMatchModelOptions.onInvocation` is **not** wired in this authorization. Analysis performed
while answering Q3 (see questionnaire, same record) found that `ResearchDeps.targetCustomerMatch` is a flat,
non-factory object, unlike `researchProvider`'s deliberate `(userId) => ...` factory shape — the only place
`ai_usage_events.user_id`/`prospect_id` attribution could be captured correctly for this call would require
either (a) converting `targetCustomerMatch` to a per-userId factory (a structural change to `ResearchDeps`/
`SearchWorkerDeps` beyond preparation §6's three-file mechanical sketch) or (b) a change inside the
already-authorized-and-tested `service.ts` to thread `userId`/`prospectId` into the call site for a reason
outside what `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` authorized. Both exceed what this wiring-only record may
decide. **This is an explicit, known, and accepted gap**, not an oversight: target-customer-match model
invocations will not appear in `ai_usage_events` once this wiring ships. Closing it is reserved for a future,
separate decision that explicitly authorizes the shape change in (a) or (b).

### 1.4 Retry/options configuration (Q4) — **module defaults, unchanged**

No `options` field is populated beyond what §1.3 already establishes (none). `callTargetCustomerMatchModel`'s
own `DEFAULTS` (`maxAttempts`, backoff, etc.) apply unmodified.

### 1.5 Scope (Q5) — **exactly preparation §6, narrowed by §§1.1-1.4 above**

The object constructed in `apps/worker/src/index.ts` is exactly:

```ts
targetCustomerMatch: {
  repository: createPgTargetCustomerMatchRepository(pool),
  model: createResearchModel(researchModelConfigFor(env.RESEARCH_PROVIDER, env.RESEARCH_MODEL, env)),
  modelId: env.RESEARCH_MODEL ?? <Anthropic adapter's own default — mirrored, not reinvented>,
  providerId: env.RESEARCH_PROVIDER,
}
```

No `options` key. No `promptVersion` key. Nothing else in `apps/worker/src/index.ts` changes.

### 1.6 Rollout gating (Q6) — **no additional gate**

Once a future, separate authorization permits deployment, the wiring applies unconditionally — the same way
`categoryPlausibility`'s own wiring does today. This decision adds no feature flag or environment restriction
of its own; it also changes nothing about §2 below, which continues to withhold deployment entirely for now.

---

## 2. Authorization status

| Item | Status |
|---|---|
| `targetCustomerMatch?: { repository: TargetCustomerMatchRepository; model: ResearchModel; modelId: string; providerId: string }` field added to `SearchWorkerDeps` (`apps/worker/src/searchWorker/worker.ts`) | **Authorized** |
| `...(deps.targetCustomerMatch ? { targetCustomerMatch: deps.targetCustomerMatch } : {})` added to `researchProspectForOwner`'s call into `runResearchForOwner` (`worker.ts`) | **Authorized** |
| Construction of the object in §1.5 above, added to `SearchWorkerPollLoopDeps` in `apps/worker/src/index.ts` | **Authorized** |
| Worker-level unit test extension (`apps/worker/src/searchWorker/worker.test.ts`) per preparation §7 | **Authorized** |
| Real-Postgres integration test extension (`tests/integration/search-worker.integration.test.ts` or a new file per that directory's convention) per preparation §7 | **Authorized** |
| Wiring `TargetCustomerMatchModelOptions.onInvocation` / any `ai_usage_events` recording for this call | **Not authorized** — requires a future decision per §1.3 |
| Any override of `maxAttempts`/backoff/other `options` fields from production defaults | **Not authorized** |
| Any env var beyond `RESEARCH_PROVIDER`/`RESEARCH_MODEL` (already existing) for this feature | **Not authorized** — Option B (independent config) was not selected |
| Converting `targetCustomerMatch` (anywhere in `ResearchDeps`/`SearchWorkerDeps`) to a per-userId factory | **Not authorized** |
| Any change to `targetCustomerMatch.ts`, `targetCustomerMatchRepository.ts`, `service.ts`'s existing `if (deps.targetCustomerMatch)` block, `pcg4.ts`, or the migrations | **Not authorized** — all already implemented and tested; this record authorizes only the three files in §1.5/§2 above |
| Production deployment / release / launch / rollout | **Not authorized** |
| Enabling this dependency in any specific environment | **Not authorized** |
| Any change to PCG-4's existing launch/monitoring semantics | **Not authorized** |
| Any change to `packages/core-qualification-equivalence/**` | **Not authorized** |
| Any change to the substance of any record in §0's governing chain | **Not authorized** |

---

## 3. Explicitly prohibited / out-of-scope work

- Production deployment, production rollout, release, or launch of any kind.
- Enabling this dependency in any specific environment, or any staged/canary rollout of it.
- Wiring usage metering for this call (§1.3) — remains a separate, explicitly deferred question.
- Any change to the substance of `PDEF4-PCG4-TCMATCH-MECH-PO-DEC-001`, `PDEF4-PCG4-PO-DEC-001`,
  `PDEF4-PCG4-ED-DEC-001`, `PDEF4-PCG4-TCMATCH-TECHDESIGN-DEC-001`, or `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001`.
- Any change to `packages/core-qualification-equivalence/**`.

---

## 4. Acceptance criteria (concrete, testable)

| Workstream | Acceptance criterion |
|---|---|
| `SearchWorkerDeps` field | Omitting `targetCustomerMatch` from a `SearchWorkerDeps` object keeps every existing test compiling and passing unchanged — the same "optional, chained on presence" guarantee `categoryPlausibility` already provides. |
| `researchProspectForOwner` forwarding | A worker-level test supplying `deps.targetCustomerMatch` asserts the exact same object reaches `runResearchForOwner`'s `targetCustomerMatch` key, unmodified. |
| Production construction | `apps/worker/src/index.ts`'s constructed object matches §1.5 exactly — no `options`, no `promptVersion`, `modelId`/`providerId` sourced from `env.RESEARCH_MODEL`/`env.RESEARCH_PROVIDER` (or the mirrored Anthropic default when unset). |
| Real-Postgres integration | A full `claimAndProcessNextSearch` run with a real `targetCustomerMatch` dependency (real repository, fake bounded model) produces a `target_customer_match_determinations` row, proving the worker's own wiring — not just `runResearchForOwner` called directly — reaches the write path. |
| No regression | Existing `worker.test.ts` and `search-worker.integration.test.ts` suites pass unchanged alongside the extensions. |

---

## 5. Validation requirements (must pass before this work is conformant)

- The two test extensions in §2/§4 pass.
- `apps/worker/src/index.ts` type-checks against `SearchWorkerPollLoopDeps`'s updated shape.
- No existing test in `worker.test.ts`, `search-worker.integration.test.ts`, `service.test.ts`, or
  `pcg4.test.ts` regresses.
- A future, separate conformance-evidence record documents the above with actual command output, per this
  repo's existing convention — not produced by this record.

---

## 6. Production/deployment boundary

**This record authorizes wiring (dependency injection in `apps/worker/src/index.ts` and
`apps/worker/src/searchWorker/worker.ts`, plus corresponding tests) only.** Production deployment, release,
launch, and rollout of this wiring are **not authorized** by this record and remain separately gated — any
such step requires its own, later authorization, outside the scope of this task.

---

## 7. Can the existing PCG-4 implementation be committed separately before this wiring ships?

**Yes.** The implementation authorized by `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001` (migrations 0036/0037,
`targetCustomerMatch.ts`, `targetCustomerMatchRepository.ts`, the `service.ts` guarded block, `pcg4.ts`'s
join/translation, and their dedicated tests) is self-contained and inert without this wiring — by design, per
`service.ts`'s own doc comment on the dependency ("omitting it skips both the model call and the write...
unchanged from today"). Committing it changes no runtime behavior for any existing caller, exactly like
`categoryPlausibility`'s own introduction did not change behavior until `apps/worker/src/index.ts` was updated
to supply it. This wiring decision does not need to land in the same commit, or even the same change, as the
implementation it wires — but see the separate pre-commit review's finding that the `completedAt: null` line
in `service.test.ts` belongs to a different, unrelated prerequisite authorization and should not be bundled
into either commit.

---

## 8. Git verification

- `git rev-parse HEAD` before: `af9ede93830f5e3e611195dc2451a470364def74`
- `git status --porcelain | wc -l` before this record: 96 (94 pre-existing + the preparation + the
  questionnaire, both written earlier in this same task)
- No tracked source/schema/test/config file modified by this task. No file outside `requirement/` was created,
  modified, or deleted.
- All prior governing records (§0) remain byte-identical — confirmed via `git status --porcelain` showing no
  `M` entry for any `requirement/*.md` file.
- No commit made. No push made. No deployment, release, or launch of any kind occurred.
