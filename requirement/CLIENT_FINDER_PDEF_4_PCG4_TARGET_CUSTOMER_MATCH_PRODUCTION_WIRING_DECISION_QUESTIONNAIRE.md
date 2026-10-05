# Client Finder / PDEF-4 — PCG-4 `TARGET_CUSTOMER_MATCH` Production Wiring Decision Questionnaire

**Record ID:** `PDEF4-PCG4-TCMATCH-PRODWIRING-QUESTIONNAIRE-001`
**Date:** 2026-10-05
**STATUS: ANSWERED** — originally published blank (no option pre-selected or implied by default ordering);
answered below under delegated authority (see Sign-off). The blank version's content is preserved verbatim
above each answer; nothing in the question text was altered to fit the answer given.

Governing input: `requirement/CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_PRODUCTION_WIRING_DECISION_PREPARATION.md`
(`PDEF4-PCG4-TCMATCH-PRODWIRING-PREP-001`, SHA-256 `2ef39dfeb06beba01d1c1ca5d50b1dcf2a50f64195a7fd97479455db0175c7dd`).

Every question below must be answered before `PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001` may be written. An
unanswered question blocks the decision record, not just the question's own row.

---

## Q1 — Model/provider source for the production bounded model call

Per preparation §4.

- [x] **(A) Reuse** — construct `targetCustomerMatch.model`/`modelId`/`providerId` from the same
  `createResearchModel(researchModelConfigFor(env.RESEARCH_PROVIDER, env.RESEARCH_MODEL, env))` configuration
  already used for the main research pipeline's first attempt.
- [ ] **(B) Independent** — introduce new env vars (name them below) and construct a separate
  `createResearchModel(...)` call, letting target-customer-match run on a different model/provider than the
  main research pipeline.
- [ ] **Other** (describe exactly):

If (B) selected, specify the new env var names: N/A — (A) selected.

---

## Q2 — Prompt version string

`TargetCustomerMatchModelDeps.promptVersion` is optional in the type but TD-6 requires every row to carry a
non-null `prompt_version`. What literal value should `apps/worker/src/index.ts` supply?

Answer: Omit the field entirely from `apps/worker/src/index.ts`'s construction of `TargetCustomerMatchModelDeps`
— `evaluateTargetCustomerMatch` already defaults it to `TARGET_CUSTOMER_MATCH_PROMPT_VERSION` (`'target-customer-
match-v1'`, `packages/core-research/src/targetCustomerMatch.ts:46`) when `deps.promptVersion` is undefined, and
`targetCustomerMatch.test.ts`'s existing "persists non-null model/provider/promptVersion on every evaluation
(TD-6)" test already asserts this exact default. Supplying a second, independently-authored literal in
production wiring would create two sources of truth for the same string with no benefit.

---

## Q3 — Usage metering (`ai_usage_events`)

Per preparation §4/§7, `TargetCustomerMatchModelOptions.onInvocation` is the hook; nothing wires it
automatically for either Q1 option.

- [ ] Wire it now — target-customer-match calls get recorded in `ai_usage_events` from this change onward,
  reusing `aiUsageEvents.recordEvent` the same way the main pipeline's `onUsage` already does.
- [x] Defer it — ship the wiring without usage metering for this specific call; target-customer-match calls
  will not appear in `ai_usage_events` until a later, separate change adds it.

**Finding made while answering this question (not present in the preparation record, which treated this as
symmetric for both Q1 options — it is not):** `deps.researchProvider` in `apps/worker/src/index.ts` is
deliberately a **factory**, `(userId: string) => ResearchProvider`, specifically so its `onUsage` closure can
capture the real `userId` for each Search (see `index.ts`'s own comment at lines 46-51, and R-29's scope-lock
requirement that `ai_usage_events.user_id` be real). `ResearchDeps.targetCustomerMatch`, by contrast, is a
**flat, non-factory object** — `{ repository, model, options }` — constructed once in `service.ts`'s caller and
passed straight through to `evaluateTargetCustomerMatch(model, targetCustomer, sources, options)` with no
per-call augmentation (`packages/core-research/src/service.ts`, the `if (deps.targetCustomerMatch)` block).
Wiring `options.onInvocation` to call `aiUsageEvents.recordEvent(userId, prospectId, ...)` from a closure built
once in `apps/worker/src/index.ts` has no real `userId`/`prospectId` to capture — unlike `researchProvider`,
nothing re-invokes `targetCustomerMatch`'s construction per Search. Wiring it correctly would require either
(a) changing `targetCustomerMatch` to a per-userId factory, matching `researchProvider`'s shape — a structural
change to `ResearchDeps`/`SearchWorkerDeps` beyond preparation §6's three-file mechanical sketch — or (b) a
change inside `service.ts` itself to pass `userId`/`prospectId` into the call site, which touches an
already-authorized-and-tested implementation file for a reason outside what it was authorized for. Either path
exceeds "mechanical wiring." Deferred for this reason, not for lack of importance — recorded here as a known,
explicit gap: target-customer-match calls will not appear in `ai_usage_events` once this wiring ships, until a
future, separate decision addresses the shape mismatch.

---

## Q4 — `maxAttempts`/retry configuration for production

`TargetCustomerMatchModelOptions.maxAttempts` (and other option fields) default to whatever
`callTargetCustomerMatchModel`'s own `DEFAULTS` specify when omitted.

- [x] Use the module's defaults unchanged — pass no `options` (or an empty object) from
  `apps/worker/src/index.ts`.
- [ ] Override one or more fields for production. Specify field(s) and value(s): ______________________

(Consistent with Q3's deferral: since `options.onInvocation` is not wired, `options` reduces to whatever
`maxAttempts`/backoff defaults `callTargetCustomerMatchModel`'s own `DEFAULTS` already specify — no production
value depends on the Q1 choice, and nothing in the governing chain supplies a reason to diverge from them yet.)

---

## Q5 — Scope of this authorization

- [x] Authorize exactly the three files/changes listed in preparation §6 (the mechanical wiring), plus the Q1
  decision — nothing else.
- [ ] Authorize a narrower subset. Specify exactly which of preparation §6's changes are excluded:
  ______________________

(Scope is further sharpened by Q2-Q4's answers: the `targetCustomerMatch.options` field passed in
`apps/worker/src/index.ts` is omitted/empty, not populated — Q3's deferral and Q4's "use defaults" together
mean the object constructed there is `{ repository, model, modelId, providerId }` only, no `options` key, no
`promptVersion` key.)

---

## Q6 — Rollout gating

Preparation §8 keeps deployment/release/launch/rollout unauthorized regardless of this questionnaire's
answers. Does this decision additionally require the wiring to ship behind some condition (e.g., a feature
flag, an environment restriction) once a later authorization permits deployment — or is no additional gate
requested beyond what §8 already withholds?

- [x] No additional gate — the wiring, once separately authorized for deployment, applies unconditionally like
  `categoryPlausibility`'s own wiring does today.
- [ ] Additional gate requested. Describe: ______________________

---

## Sign-off

**Answered by:** Claude (Sonnet 5), in this session.
**Date:** 2026-10-05
**Authority:** **AI-exercised delegated authority, explicitly authorized by the human user for this single
task** — not a human Product Owner's or Engineer's personal decision, and not a reopening or reinterpretation
of any decision in the governing chain. Identical disclosure basis to `PDEF4-PCG4-TCMATCH-IMPL-AUTH-DEC-001`.
