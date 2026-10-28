# Path 2 — Category Plausibility

## D11-I — Provider Readiness Evidence Record

**Record ID:** D11I-EVID-001
**Date:** 2026-09-28
**Authority:** Product Owner authorization, given in the working session on 2026-09-28, of the
bounded D11-I check identified in `PATH_2_CATEGORY_PLAUSIBILITY_D11_READINESS_CLOSURE_AUDIT.md`
(D11-RC-AUDIT-001) §12. That authorization covered one real Research call for provider readiness
only.
**Repository HEAD:** `5992b82b9adff492c480442d68a954f2a03bfb28`

```text
D11-I ..................... FAIL — provider account not funded
Provider Research call .... FAILED (HTTP 400, credit balance too low); 1 invocation, no retry
D11 ....................... NOT READY FOR LIVE VALIDATION
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

### 2. Configured Provider (non-secret inspection)

| Item | Finding | Source |
|---|---|---|
| `RESEARCH_PROVIDER` | Not set in `.env`, so the default `anthropic` applies | `.env` (key names only); `packages/config/src/env.ts:72` |
| `RESEARCH_MODEL` | Not set, so the adapter default `claude-opus-5` applies | `anthropicModel.ts:63` |
| `RESEARCH_FALLBACK_PROVIDER` / `_MODEL` | Not set. No fallback is configured. | `.env`; `env.ts:76–77` |
| `ANTHROPIC_API_KEY` | Present, non-empty. The value was never printed, logged or recorded. | `.env` (presence check only) |
| `OPENAI_API_KEY`, `GEMINI_API_KEY` | Absent or empty | `.env` (presence check only) |

**Configured provider for D11-I: Anthropic (primary only).**

---

### 3. Funding Verification Mechanism

- The Anthropic API exposes no balance or funding endpoint to an API key. Account funding is
  visible only in the Anthropic Console (Plans & Billing), which requires the account owner's
  login and was not accessed.
- The authorized mechanism was therefore the single Research call. Its response is the funding
  evidence: an unfunded account is rejected before any model output.

---

### 4. The Single Research Call

**Method.** A one-off vitest probe located outside the repository (session scratchpad). It invoked
the production code path:
- `createAnthropicResearchModel` (`packages/core-research/src/anthropicModel.ts`), with an injected
  SDK client configured `maxRetries: 0`, so the SDK could not retry;
- `researchLead` (`packages/core-research/src/researcher.ts`) with `maxAttempts: 1`, so neither the
  provider-error retry nor the repair loop could issue a second call.

The model defaults (model, max tokens, effort, thinking and output schema) match the worker's
wiring (`apps/worker/src/index.ts:92–96` → `createResearchModel` → `createAnthropicResearchModel`).
The only difference is the injected client with retries disabled.

**Input.** A synthetic company ("Readiness Probe Bakery", `https://example.com`) with one inline
synthetic source document and `targetSegments: []`. No source was fetched. No category-plausibility
verdict could be requested, because no segment was supplied.

**Result:**

| Field | Value |
|---|---|
| Provider | Anthropic |
| Model | `claude-opus-5` (adapter default) |
| Call started (UTC) | 2026-09-28T08:49:07.054Z |
| Call finished (UTC) | 2026-09-28T08:49:07.891Z |
| Provider invocations | **1** |
| Outcome | **FAILED** |
| Error | `ResearchProviderError`, HTTP **400** |
| Provider error type | `invalid_request_error` |
| Provider message | "Your credit balance is too low to access the Anthropic API. Please go to Plans & Billing to upgrade or purchase credits." |
| Provider request ID | `req_011CfVYocTaH2k7XKkKB2PNJ` |
| Real Research call completed successfully? | **No** |
| Retries attempted | **None.** Stopped as instructed. |

This matches the only earlier recorded live attempt (Search `b81ab156-…`: HTTP 400, insufficient
credit; D11 §10.1).

---

### 5. Assessment Against D11 §10.1

- **Funded:** **No.** The provider states the credit balance is too low.
- **Capable of executing one real Research call:** **No.** The call was rejected before model
  execution.
- **D11-I: FAIL.** The mandatory precondition to scheduling any D11 session is **not met**.
- D11 remains **NOT READY FOR LIVE VALIDATION**. D11-I remains the single unmet READY blocker
  identified in D11-RC-AUDIT-001 §6.

---

### 6. What This Result Is Not

- Not a D11 validation-session result.
- Not a category-plausibility determination. None was created, and nothing was persisted.
- Not E1, E2 or E3 evidence, and not an entry for the A-11 validation set or the Companion §2
  Determination Register.
- Not M-2 source-capture or Q-1 retrieval evidence.

---

### 7. Next Authorization Required

1. **Account funding (operator or account owner action, outside the repository).** Add credits to
   the Anthropic account behind the configured `ANTHROPIC_API_KEY`, in Console → Plans & Billing.
   Claude cannot do this: it is a financial transaction for the account owner.
2. **A new bounded D11-I re-check authorization** after funding. It would cover one further Research
   call under the same limits as this record, because this authorization was consumed by the
   single call recorded here.
3. Only if the re-check passes: the **D11 readiness decision** (D11-RC-AUDIT-001 §11 step 3), which
   remains a separate Product Owner decision.

Alternatively, the Product Owner may select a different funded provider. That would need an
explicit configuration change (`RESEARCH_PROVIDER` / `RESEARCH_MODEL` and the matching key), which
is itself a separate authorization, followed by the same one-call re-check.

---

### 8. Safety / Authority

- Exactly one provider call. No retries.
- No determination created or persisted. No database connection opened. No `ai_usage_events` row
  written (no metering callback was supplied).
- No live source fetch. No participant contact. No validation session. No browser.
- No E1, E2 or E3 activity. No A-11 change.
- No change to D11, D11-H, the Companion Record, the A-11 matrix, F-1, G-6, G-7, P4 or
  VS-PO-DEC-001.
- No code, prompt, schema, adapter or test change in the repository. The probe files live only in
  the session scratchpad.
- The API key was read into process memory only. It was not printed, logged or written, and error
  output was scrubbed of it.
- Other `.env` keys were checked by name and presence only.

**Repository state:**

```text
HEAD ...................... 5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Staged .................... none
Tracked diff sha1 ......... aeb3338ea2887bb826211d1e73ae82ac4066ff31 (before and after)
git status ................ unchanged except for this record
apps/web/tsconfig.tsbuildinfo  sha256 1834209e…de71d09 (unchanged)
```

## STOP
