# Path 2 — Category Plausibility

## D11-I — Provider Readiness Re-check Evidence Record

**Record ID:** D11I-EVID-002
**Supersedes for D11-I status:** D11I-EVID-001 (FAIL: credit balance too low). D11I-EVID-001 is
kept unchanged as the historical record.
**Date:** 2026-09-28
**Authority:** Product Owner authorization "D11-I Provider Re-check", given in the working session
on 2026-09-28. The Product Owner confirmed that the Anthropic account has been funded since
D11I-EVID-001. The authorization covered exactly ONE real Anthropic Research API request, with no
retry, for provider readiness only.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
D11-I ..................... PASS — funded provider executed one real Research call
Provider Research call .... SUCCESS (HTTP 200); 1 request authorized, 1 request attempted, no retry
D11 ....................... NOT READY FOR LIVE VALIDATION (unchanged; readiness is a separate PO decision)
E1 ........................ BLOCKED
E2 ........................ OPEN
E3 ........................ OPEN
A-11 ...................... OPEN
```

---

### 1. Requirement Assessed

D11 §10.1 / D11-I: "a funded, working provider account (Anthropic, or whichever
provider/fallback is configured) capable of executing at least one real Research call.
**MANDATORY precondition** to scheduling any D11 validation session."

---

### 2. Pre-call Verification (read-only)

| Condition | Finding | Source |
|---|---|---|
| Configured provider is Anthropic | `RESEARCH_PROVIDER` is absent from `.env` and from the shell environment, so the default `anthropic` applies | `packages/config/src/env.ts:72`; key names only |
| No fallback provider | `RESEARCH_FALLBACK_PROVIDER` / `_MODEL` are not set. The probe did not construct the fallback provider (`fallbackResearchProvider.ts`) | `.env`; `env.ts:76–77` |
| Production Anthropic adapter used | `createAnthropicResearchModel` (`packages/core-research/src/anthropicModel.ts`), with production `SYSTEM_PROMPT` and `buildUserMessage` (`prompt.ts`) | Probe imports |
| Model defaults | `claude-opus-5`, 16,000 max tokens, effort `high`, adaptive thinking, JSON-schema output. These match the worker's wiring (`createResearchModel` → `createAnthropicResearchModel`, with no model override) | `anthropicModel.ts:63–65`; `researchModelFactory.ts` |
| Exactly one outbound request | The probe invoked the returned `ResearchModel` function **once, directly**. It did **not** call `researchLead`, so neither the application's provider-error retry loop nor the repair loop (`researcher.ts:204–309`) was on the execution path. The adapter makes one `messages.stream` call per invocation | `researcher.ts`; `anthropicModel.ts` |
| SDK retries disabled | Injected client `new Anthropic({ maxRetries: 0, … })` via the adapter's supported `client` option. The SDK's defaults were not relied on | SDK 0.125.0 `ClientOptions.maxRetries` |
| Hard single-request guard | The client was given a counting `fetch` wrapper that throws, without touching the network, on any second outbound request | Probe |
| Endpoint | `baseURL` was pinned to `https://api.anthropic.com`. The shell's `ANTHROPIC_BASE_URL` host was also `api.anthropic.com` | Probe; host-only check |
| API key | Read from the repository `.env` into process memory only. It was never printed, logged or written. All recorded output was scrubbed against the key value | Probe |

No production code, configuration or dependency was modified to establish these conditions.

---

### 3. Harness Note (no request issued)

The first launch of the scratchpad probe failed at **vitest config load**
(`ERR_MODULE_NOT_FOUND: Cannot find package 'vitest'` imported from the scratchpad config file).
That happened before the test file was evaluated. The counting `fetch` guard never ran, no result
file was produced, and **no request reached Anthropic**. The harness was corrected (the scratchpad
files no longer import `vitest`) and launched once more. That second launch issued the single
authorized request recorded below. Across the whole session, exactly one outbound provider request
was made.

---

### 4. The Single Research Call

**Input (synthetic, non-production).** Company "Readiness Probe Bakery", `https://example.com`,
`targetSegments: []`, and one inline synthetic source document (three sentences). No source was
fetched. No Google Places or Search call was made. No live validation data or participant data was
used. Because no segment was supplied, no category-plausibility verdict could be requested.

**Result:**

| Field | Value |
|---|---|
| Provider | Anthropic |
| Endpoint host | `api.anthropic.com` |
| Model | `claude-opus-5` (adapter default) |
| Call started (UTC) | 2026-09-28T09:04:28.253Z |
| Call finished (UTC) | 2026-09-28T09:05:01.361Z |
| Requests authorized | **1** |
| Requests attempted (guard counter) | **1** |
| HTTP status | **200** |
| Provider request ID | `req_011CfVZyWrNqc43DrzfzxLvp` |
| Provider message ID | `msg_011CfVZyYFxbzTnKRpzZeWna` |
| Outcome | **SUCCESS**. The adapter returned `kind: 'json'`, which is not a refusal |
| Usage | 3,987 input tokens; 1,739 output tokens; cache creation 0; cache read 0 |
| Response shape | Top-level keys: `aiOpportunities`, `automationOpportunities`, `businessModel`, `categoryPlausibility`, `companySummary`, `confidence`, `contentOpportunities`, `gaps`, `growthOpportunities`, `recommendedService`, `targetCustomers`, `visibleProblems`, `websiteIssues` |
| Retries attempted | **None** |

Only non-secret metadata was retained. The model's response body was not persisted. It was not run
through schema, provenance or category-plausibility validation, because that is outside D11-I's
scope. D11-I requires a working, funded provider call, not a validated research result.

---

### 5. Assessment Against D11 §10.1

- **Funded:** **Yes.** The provider accepted and billed the request. The prior `credit balance too
  low` rejection (D11I-EVID-001, `req_011CfVYocTaH2k7XKkKB2PNJ`) did not recur.
- **Capable of executing one real Research call:** **Yes.** HTTP 200, with a completed structured
  Research response from the production adapter and the production prompt.
- **D11-I: PASS.**
- **D11 remains NOT READY FOR LIVE VALIDATION.** This record establishes evidence for D11-I only.
  Moving D11 to READY is a separate Product Owner decision (D11-RC-AUDIT-001 §11 step 3) and is
  not made here.

---

### 6. What This Result Is Not

- Not a D11 readiness decision, and not a D11 validation-session result.
- Not a category-plausibility determination. None was created, and nothing was persisted.
- Not E1, E2 or E3 evidence, and not an entry for the A-11 validation set or the Companion §2
  Determination Register.
- Not M-2 source-capture or Q-1 retrieval evidence.
- Not an authorization for any further provider use. The single-call authorization was consumed
  by the request recorded here.

---

### 7. Next Authorization Required

1. **D11 readiness decision (separate Product Owner decision).** Decide whether D11 transitions
   to READY FOR LIVE VALIDATION, now that D11-I has PASS evidence (D11-RC-AUDIT-001 §11 step 3).
2. Only after that decision, and under **its own separate authorization**: scheduling or running
   any D11 live validation session, participant interaction, E1/E2/E3 activity, or further
   provider use.

---

### 8. Safety / Authority

- Exactly one provider request was authorized and exactly one was attempted. It was enforced by
  SDK `maxRetries: 0`, by bypassing `researchLead`'s retry and repair loops, and by a counting
  fetch guard. No retry. No diagnostic follow-up request. No provider switch. No fallback.
- No determination was created or persisted. No database connection was opened. No
  `ai_usage_events` row was written (no metering callback).
- No live source fetch. No Google Places or Search call. No participant contact. No validation
  session. No browser.
- No E1, E2 or E3 activity. No A-11 change.
- No change to F-1, D11, D11-H, P4, G-6, G-7, the Companion Record, the A-11 matrix, D11I-EVID-001
  or VS-PO-DEC-001.
- No code, prompt, schema, adapter, configuration or test change in the repository. The probe
  files live only in the session scratchpad.
- The API key was not printed, logged or written.

**Repository state:**

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Staged .................... none
Tracked diff sha1 ......... aeb3338ea2887bb826211d1e73ae82ac4066ff31 (before and after)
git status ................ unchanged except for this record
apps/web/tsconfig.tsbuildinfo  sha256 1834209e…de71d09 (unchanged)
```

## STOP
