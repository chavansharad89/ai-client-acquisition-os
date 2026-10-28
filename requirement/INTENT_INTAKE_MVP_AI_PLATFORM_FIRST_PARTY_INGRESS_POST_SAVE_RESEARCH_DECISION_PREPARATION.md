# Intent Intake MVP

## AI-Platform FIRST_PARTY — OD-13 Ingress (Alternative I) — Post-Save Research Behavior — Decision Preparation

**Record ID:** INTENT-INTAKE-OD13-POSTSAVE-PREP-001
**Date:** 2026-09-30
**Type:** Product Owner decision preparation (no decision, no execution authority)
**Concerns:** IA-OD13-INGRESS-I-IMPL-REC-001 §5 item 1 ("Research step not configured on this path")
**Convention:** analyst preparation only. The Alternative I decision (DEC-001) and implementation record are not
modified. Options are listed unranked; no option is selected, recommended, scored or preferred.

```text
Product Owner decision: PENDING
Implementation authority: NONE
Provider-call authority: NONE
Runtime-wiring authority: NONE
Database authority: NONE
Deployment authority: NONE
Validation authority: NONE
OD-13 runtime gate: IN FORCE
```

Creating this record authorizes no implementation, provider call, external HTTP, database access, runtime
activation, integration naming, key registration, queue/background infrastructure, schema change, validation or
deployment, and changes no decided transaction semantics.

---

## 1. Baseline verified before drafting

| Item | Value | Result |
|---|---|---|
| Branch / HEAD | `phase-17-r34-worker-orchestration` / `5992b82b9adff492c480442d68a954f2a03bfb28` | = IMPL-REC §1 |
| Staged files | 0 | unchanged |
| Working-tree entries (`git status --porcelain`) | 238 | — |
| Code fingerprint (`git diff HEAD --binary`, excl. `requirement/`) | `2782b92154b4419c8bc385e6963108bb67fb72621134eb5c403066b0cbac707b` | = IMPL-REC §6 "after" |
| New `requirement/` files since IMPL-REC | none | — |

### 1.1 Governing records (sha256)

| Record | sha256 | Result |
|---|---|---|
| Alternative I decision (DEC-001) `…_INGRESS_RUNTIME_COMPONENT_DECISION.md` | `c85196823142fd2ab238bf99debc73145f86fd600c6740c0e2d011984f9b39c6` | = IMPL-REC header |
| Alternative I implementation record `…_INGRESS_RUNTIME_COMPONENT_IMPLEMENTATION_RECORD.md` | `8a89e582533180fdd93d18799658ed2fa150cf3717e561cbb0c434f278c7f6c0` | as read |
| Evidence contract design rev. 2 (OD-1..OD-13) | `57f6a42fe2b8bfb98194c5f6544b5e4cb9a805e6e491d5b7872e51b2d1a0ba5c` | = DEC-001 §1.1 |
| Intent Intake PO decision (D1..D5) `INTENT_INTAKE_MVP_PRODUCT_OWNER_DECISION.md` | `52ee6164f4b7f8c0202d4b5fce881e7afffde0a61da012cde88215840a257407` | as read |

### 1.2 Implementation files (sha256 prefix) — = IMPL-REC §2

`route.ts` `173373c2`, `intentIngress.ts` `a5ac1536`, `intentIngressIntake.ts` `a9fc8823`,
`intentIntegrationRegistry.ts` `2485c0c0`, `intentIngress.test.ts` `a85af6e0`, `intentIngressIntake.test.ts`
`0efc4331`, `push/route.test.ts` `bc3bea89`, `apps/worker/src/searchWorker/intentIntake.ts` `4f36ff2a`.

OD-13 runtime wiring: not authorized; `INTENT_INTEGRATION_REGISTRATIONS = []`; route not live for any integration.

## 2. Observed implementation facts (code as it stands)

| # | Fact | Evidence |
|---|---|---|
| F1 | Company and Prospect find-or-create run **before** and outside the signal transaction. | `apps/worker/src/searchWorker/intentIntake.ts:116–121` |
| F2 | The OD-8 signal transaction (all signal + source rows of the event) **commits** when `deps.signalTransaction(...)` resolves. | `intentIntake.ts:123–132` |
| F3 | After the commit, the determination lookup runs; if no current CATEGORY_PLAUSIBLE determination exists, `researchProspectForOwner` runs inline. | `intentIntake.ts:134–140` |
| F4 | After Research (or its skip), `runPostResearchPipelineForOwner` runs inline (Opportunity, Score, Qualification, Personalization, Outreach/Follow-up Prep). | `intentIntake.ts:142`; `worker.ts:436+` |
| F5 | The ingress wires `researchProvider: notConfiguredResearchProviderFactory()`. | `apps/web/src/server/intentIngressIntake.ts:42` |
| F6 | That provider's `research()` always throws `ProviderNotConfiguredError('ResearchProvider')`. | `apps/worker/src/searchWorker/providers.ts:13–23, 34–40` |
| F7 | `runResearchForOwner` calls `deps.provider.research(...)` after prospect/company/search lookups, with no early return before the call; so with F5/F6 every Research run on this path throws. | `packages/core-research/src/service.ts:92–122` |
| F8 | Therefore, on this path, a push whose Prospect has no current determination **will** (not merely can) fail after F2 has committed. | F2 + F3 + F7 |
| F9 | The ingress maps only `IntentSignalValidationError` and `IntentIntakeSearchNotFoundError` to `400`; anything else (incl. `ProviderNotConfiguredError`) → `500 {"error":"Internal error"}`, logged with error name only. | `apps/web/src/server/intentIngress.ts:130–156` |
| F10 | `200 {"status":"accepted"}` is returned only after `recordIntentIntakeForOwner` resolves, i.e. after Research and the post-research pipeline. | `intentIngress.ts:130–151` |
| F11 | Failures in the post-research pipeline (F4) are in the same post-commit position and take the same `500` path. | F4 + F9 |
| F12 | `IntentIntakeResult` has a `researched: boolean` flag; no "research incomplete"/partial outcome type exists, and the ingress does not read the result. | `intentIntake.ts:71–79`; `intentIngress.ts:131` |
| F13 | Existing error types in scope: `IntentSignalValidationError`, `IntentIntakeSearchNotFoundError`, `ProviderNotConfiguredError`, `ResearchProspectNotFoundError`. No error type distinguishes "saved, research failed". | files above |
| F14 | The only existing retry/deferral mechanism is Search-level: the worker poll loop claims a PENDING Search, runs `runCanonicalPipeline` (Discovery, then Research per **discovered** Prospect), and on failure records `recordAttemptFailure` up to `MAX_SEARCH_ATTEMPTS`. It does not target a specific intake Prospect and is not reachable from the intake path. | `worker.ts:225–265, 360–390`; `pollLoop.ts` |
| F15 | No per-Prospect deferred-research record, queue or background mechanism was identified in the inspected code. | inspected files above |
| F16 | Because the determination is still absent after a failed run, a later push for the same Prospect re-enters Research (F3) and, per OD-12, commits its signals again as a new submission. | F3; OD-12 items 2–3 |
| F17 | Existing tests: ingress "unexpected P3 error → generic 500" (`intentIngress.test.ts:283`); intake tests use fake research providers. No test exercises the not-configured provider after commit on the ingress path. | test files above |

## 3. Already-decided constraints bearing on this item (not reopened here)

| Source | Decided content relevant here |
|---|---|
| OD-8 item 1–2 | One transaction for all signal + source rows of an event. Company/Prospect and the downstream Research / post-research pipeline stay **outside**; "a failure there leaves the committed signals, as today." |
| OD-12 items 1–3 | No automatic persistence retry; retry is a new operator-initiated submission re-validated in full; no deduplication; duplicates accepted as a known limitation. |
| D4 (INTENT-INTAKE-PO-DEC-001) | Intake Prospects run the existing Research path, then the existing post-research sequence. |
| IG-3 (DEC-001) | Synchronous, unchanged: the push runs `recordIntentIntakeForOwner` including inline Research and post-research pipeline; no deferral, queue, hand-off record or background mechanism; no automatic retry by this system; any Research provider call needs its own provider-call authorization. |
| IG-4 (DEC-001) | `200` "Saved (P3 completed)"; `401` authenticity; `400` validation/ownership; `500` unexpected error. Bodies carry no detail. |
| OD-11 | Redacted Logger only (`externalId`, `field`, `reason`); no rejection table. |
| OD-13 Q9 / DEC-005 | No persistence of payloads or verification outcomes. |

## 4. Analyst framing (not facts, not decisions)

- IG-4's `200` row reads "Saved (P3 completed)". The code treats *P3 completed* as "`recordIntentIntakeForOwner`
  returned" (F10). Under F8 the signals are *saved* but P3 is not *completed*. IG-4 does not say which of the two
  words governs this case; the implementation classified it as "unexpected error" (`500`).
- F8 is a direct consequence of provider-call authority NONE. If a real Research provider were later authorized,
  post-commit failure would remain possible (provider errors, F11), so the question is not solely a provider-call
  question; the provider-call decision changes only its frequency.
- Several options below are expressible only by reopening IG-3, IG-4, OD-8 item 2, OD-12 or D4. They are listed for
  completeness and marked; listing them is not a proposal to reopen.

## 5. Questions for the Product Owner

Each option lists what it depends on. Options are unranked; order carries no meaning.

### PS-1 — What event constitutes successful acceptance of the push?

| Option | Meaning | Dependencies |
|---|---|---|
| A | Commit of the OD-8 signal transaction (F2). | Clarifies/amends IG-4 `200` row wording. |
| B | Return of `recordIntentIntakeForOwner`, i.e. signal commit **and** Research **and** post-research pipeline (current code, F10). | None beyond current IG-3/IG-4 reading. |
| C | Signal commit plus Research, excluding the post-research pipeline. | Amends IG-4 wording; code change requires implementation authorization. |
| Other | PO's exact rule. | As stated by PO. |

### PS-2 — Signals committed, Research then fails: what HTTP outcome?

| Option | Meaning | Dependencies |
|---|---|---|
| A | `500 {"error":"Internal error"}` (current behavior, F9). | None. |
| B | `200 {"status":"accepted"}`; Research failure logged only. | Consistent only with PS-1 A (or C for post-research failures); implementation authorization; OD-11 log-field shape for this case to be stated. |
| C | A status or body not in IG-4 (e.g. a distinct "accepted, incomplete" response). | Amends IG-4 (new row); implementation authorization. Not supported by any existing response in the code. |
| D | `400 {"error":"Unprocessable payload"}`. | Conflicts with IG-4's `400` meaning ("nothing is saved", IG-5 item 3); amends IG-4. |

### PS-3 — Do the committed signals remain valid when Research fails afterwards?

| Option | Meaning | Dependencies |
|---|---|---|
| A | Yes — they remain as committed (OD-8 item 2, as decided). | None. |
| B | No — they must be removed or not committed unless Research succeeds. | Reopens OD-8 item 2; would place Research inside or ahead of the transaction, or require a delete path. Interaction of a delete path with the 0030 trigger was **not** established here; would need a schema/DB decision. |
| C | Yes, but marked as research-incomplete. | No such marker exists (F12, F15); needs a schema or new-state decision; conflicts with OD-13 Q9 only if the marker stores verification outcome (not established). |

### PS-4 — Should the ingress retry Research automatically?

| Option | Meaning | Dependencies |
|---|---|---|
| A | No automatic retry (IG-3, OD-12 item 1 as decided). | None. |
| B | Bounded in-request retry. | Reopens IG-3 "no automatic retry by this system"; provider-call authorization (each retry is a provider call once a real provider exists); request-duration concern (IG-3). |
| C | Retry via a background mechanism. | See PS-5 B and PS-6; reopens IG-3. |

### PS-5 — Is Research synchronous within the push request, or is deferral allowed?

| Option | Meaning | Dependencies |
|---|---|---|
| A | Synchronous, as IG-3 decided (current code). | None. |
| B | Deferred / asynchronous after the push is acknowledged. | Reopens IG-3; also touches R-34 "no broker" and OD-13 Q9 if any hand-off record or payload is stored; see PS-6. |
| C | Research is skipped on this path until a provider is authorized; the post-research pipeline runs without it. | Reopens D4 (Option A) and IG-3; downstream behavior of Qualification without a determination was **not** established in this preparation. |

### PS-6 — If deferral is allowed, which existing mechanism would be used?

Observed: no per-Prospect deferred-research mechanism exists (F15). The Search-level poll loop (F14) re-runs
Discovery for a Search and researches only the Prospects Discovery returns; the repository does not establish that
it would reach a specific intake Prospect. A later push re-entering Research (F16) is an observed consequence, not a
designed deferral mechanism, and each such push commits duplicate signals (OD-12 item 3).

| Option | Meaning | Dependencies |
|---|---|---|
| A | None — deferral not allowed (follows PS-5 A or C). | None. |
| B | Rely on the next push for the same Prospect (F16). | Relies on the integration re-pushing; duplicates per OD-12 item 3 accepted or revisited. |
| C | A new mechanism. | **Cannot be formulated from repository evidence.** Needs its own design, schema (if any), implementation and runtime-wiring decisions; IG-3 / R-34 / Q9 implications. |

### PS-7 — Does the chosen behavior require reopening any OD-1..OD-13 (or related) rule?

Reopening map by option (analyst tabulation, from §3):

| Option chosen | Record(s) touched |
|---|---|
| PS-1 A, PS-2 B/C/D | IG-4 (DEC-001) wording or rows |
| PS-3 B | OD-8 item 2 (and possibly a DB/schema decision) |
| PS-3 C | New schema/state decision; OD-13 Q9 check |
| PS-4 B/C | IG-3; OD-12 item 1 read-across |
| PS-5 B, PS-6 C | IG-3; R-34; OD-13 Q9 / DEC-005 if anything is stored |
| PS-5 C | D4; IG-3 |
| PS-1 B, PS-2 A, PS-3 A, PS-4 A, PS-5 A, PS-6 A | none (current decided behavior) |

### PS-8 — Scope: does the decision also govern post-research pipeline failures (F11)?

| Option | Meaning |
|---|---|
| A | Yes — any failure after the signal commit is treated the same way. |
| B | No — only Research failures; post-research pipeline failures keep the current `500`. |
| Other | PO's exact scope. |

## 6. Questions that cannot be resolved without another decision

1. Any option that reaches a real Research provider (PS-4 B, and Research success generally) depends on a separate
   **provider-call authorization** (IG-3; OD-13 §13.6 item 4).
2. PS-3 B/C and PS-6 C depend on **schema / database** decisions not established here.
3. PS-5 B / PS-6 C depend on a **deferral-mechanism design**; the repository offers no candidate (F15).
4. PS-5 C depends on establishing Qualification/post-research behavior without a determination, which this
   preparation did not establish.
5. Whatever is decided, putting it into code needs a separate **implementation authorization**, and exercising it
   needs the **runtime-wiring** authorization (OD-13 §13.6 item 3), integration naming / key registration
   (item 2), and the outstanding DB-backed run (audit item 12).

## 7. What this record does not do

It selects no option and does not change IG-3, IG-4, OD-8, OD-11, OD-12, D4, OD-13 Q1..Q12, X1, C-1 or IA-1. It
does not modify DEC-001, IMPL-REC or any code, test, schema, configuration or dependency.

## 8. Final state

```text
Product Owner decision: PENDING
PS-1 .. PS-8: PENDING
Implementation authority: NONE
Provider-call authority: NONE
Runtime-wiring authority: NONE
Database authority: NONE
Deployment authority: NONE
Validation authority: NONE
OD-13 runtime gate: IN FORCE
```

## 9. Execution counters (this record)

```text
Files created: 1 (this record)
Files modified: 0
Production changes: 0
Test changes: 0
Schema/migration changes: 0
Configuration changes: 0
Database connections: 0
Database writes: 0
Provider calls: 0
External HTTP requests: 0
Runtime wiring: 0
Integration naming: 0
Key registration: 0
Validation: 0
Deployment: 0
Commits: 0
```

**INTENT-INTAKE-OD13-POSTSAVE-PREP-001 — PENDING — NO SELECTION — NO EXECUTION AUTHORITY — OD-13 RUNTIME GATE IN FORCE**
