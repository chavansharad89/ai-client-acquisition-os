# Multi-Model Research Provider — Implementation Closure

## Status

IMPLEMENTATION COMPLETE — AWAITING EXPLICIT COMMIT AUTHORIZATION

This document records what was actually built, under the authorization
chain [MULTI_MODEL_RESEARCH_PROVIDER_DECISION_RECORD.md](./MULTI_MODEL_RESEARCH_PROVIDER_DECISION_RECORD.md) →
[MULTI_MODEL_RESEARCH_PROVIDER_SCOPE_PROPOSAL.md](./MULTI_MODEL_RESEARCH_PROVIDER_SCOPE_PROPOSAL.md) →
[MULTI_MODEL_RESEARCH_PROVIDER_DECISION_REVIEW.md](./MULTI_MODEL_RESEARCH_PROVIDER_DECISION_REVIEW.md) →
[MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md](./MULTI_MODEL_RESEARCH_PROVIDER_TECHNICAL_SPIKE.md).
No commit has been created — see the Commit section.

## Baseline

```
HEAD:   b728425ac2a3fc306aaeba750ce609df31c07122 (unchanged — no commit made)
Parent: c33cef71149abdd0746b076d78461a2f3f619cb2
```

Pre-existing, unrelated working-tree drift confirmed at the start of
this implementation (client-finder UI files, `pnpm-lock.yaml`,
`tsconfig.tsbuildinfo`, and the requirement/*.md documents from prior
sessions) — none of it was modified or cleaned up. Phases 18–23 were
CLOSED/FROZEN and Phase 24 was PROPOSED/NOT APPROVED before this work
began, confirmed by `git status`/`git diff --name-only` and re-confirmed
below.

## Implementation Summary

The three-layer architecture (vendor adapter → shared orchestration →
DI composition) identified in the decision record was preserved exactly.
Two new vendor adapters were added (`openAIModel.ts`, `geminiModel.ts`),
a single provider-selection factory was added as the one place allowed
to branch on provider identity (`researchModelFactory.ts`), and a
cross-provider fallback composition was added at the same layer
`anthropicResearchProvider.ts` already occupies (`fallbackResearchProvider.ts`),
implementing the technical spike's "Option A, refined" design exactly:
source documents are fetched once and reused across every attempt in the
chain. `researchLead()`, `schema.ts`, `provenance.ts`, `ResearchProvider`,
and every downstream package (`core-opportunity`, `core-qualification`,
`core-personalization`) are **byte-for-byte unmodified** — confirmed by
`git status` showing no changes under any of those paths.

## Files Changed

```
NEW:
  packages/core-research/src/openAIModel.ts
  packages/core-research/src/openAIModel.test.ts
  packages/core-research/src/geminiModel.ts
  packages/core-research/src/geminiModel.test.ts
  packages/core-research/src/researchModelFactory.ts
  packages/core-research/src/researchModelFactory.test.ts
  packages/core-research/src/fallbackResearchProvider.ts
  packages/core-research/src/fallbackResearchProvider.test.ts
  packages/db/prisma/migrations/0026_ai_usage_events_fallback_request_kind/migration.sql

MODIFIED:
  packages/core-research/src/errors.ts        (+ProviderHttpError — shared, provider-neutral HTTP-status error)
  packages/core-research/src/index.ts         (new exports only)
  packages/core-ai-usage/src/types.ts         (AiUsageRequestKind widened: 'initial'|'repair' -> +'fallback')
  packages/core-ai-usage/src/service.test.ts  (+2 tests for the 'fallback' request kind)
  packages/config/src/env.ts                  (+OPENAI_API_KEY/GEMINI_API_KEY, optional; +RESEARCH_PROVIDER/
                                                RESEARCH_MODEL/RESEARCH_FALLBACK_PROVIDER/RESEARCH_FALLBACK_MODEL;
                                                redactedEnv() bugfix — see "Known Limitations / Incidental Fixes")
  packages/config/src/env.test.ts             (+9 tests for the above)
  .env.example                                (matching entries, per this file's own "1:1 with env.ts" rule)
  apps/worker/src/index.ts                    (provider/model resolution + createFallbackResearchProvider wiring)
  tests/integration/ai-usage.integration.test.ts (+2 real-Postgres tests for migration 0026)

UNCHANGED (confirmed):
  packages/core-research/src/{provider,researcher,service,schema,jsonSchema,provenance,
    anthropicResearchProvider,anthropicModel,types,mapping,persist,pgRepository,repository,
    prompt,repair,sourceDocumentProvider,signalErrors,validation,scoringAdapter,testSupport}.ts
  packages/core-opportunity/**, packages/core-qualification/**, packages/core-personalization/**
  packages/core-outreach/**, packages/core-outreach-preparation/**, packages/core-proposal/**
  packages/core-capi/**, packages/core-payments/**, packages/core-entitlements/**
  apps/worker/src/searchWorker/** (worker.ts, providers.ts, pollLoop.ts — all untouched)
  packages/db/prisma/migrations/0001..0025 (every existing migration byte-identical)
```

No `package.json`/dependency file was modified anywhere in the repo (confirmed
via `git diff --stat` on every `package.json` touched by this work — none
changed). **No SDK package was added** — see Security Audit.

## Providers Implemented

**Anthropic** — unmodified compatibility baseline.
`anthropicModel.ts`/`anthropicResearchProvider.ts` are byte-for-byte
identical to before this work; their own test suite
(`anthropicResearchProvider.test.ts`) passes unchanged (6/6). This is
what STEP 4's "run before and after" requirement verifies: before this
work, 166 core-research tests passed; after, all 166 original tests
still pass, plus 56 new ones (222 total) — zero regressions.

**OpenAI** — new adapter (`openAIModel.ts`), implemented via `fetch`
against the Chat Completions API (no `openai` SDK dependency — see
Security Audit for why). Requires an explicit `model` identifier; no
default is assumed. Produces the same `ModelResult`/`ModelInvocationUsage`
shapes as Anthropic, reusing `zodToJsonSchema()`'s output unmodified.
12/12 adapter-level tests pass (structured JSON, usage extraction,
request-ID extraction, explicit refusal, `content_filter` refusal,
malformed JSON, empty content, 429/401 HTTP errors, credential handling).
**Live API verification: BLOCKED — no OpenAI credential was available or
requested; no live call was made.**

**Gemini** — new adapter (`geminiModel.ts`), also `fetch`-based. Required
its own schema-dialect translation (`toGeminiSchema()`): Gemini's
`responseSchema` is an OpenAPI-3.0-subset dialect (uppercase `type`
enum, `nullable: true` instead of `anyOf`-null, no `$ref`/`$defs`) —
this translation is entirely adapter-internal, `zodToJsonSchema()` itself
is unmodified. 16/16 adapter-level tests pass, including the schema
translation itself, role mapping (`assistant`→`model`), system-instruction
translation, `promptFeedback.blockReason`/`finishReason: SAFETY` refusal
mapping, and a deterministic-hash fallback for `providerMessageId` when
`responseId` is absent (never a random value — preserves R-29
idempotency even in that fallback path). **Live API verification:
BLOCKED — no Gemini credential was available or requested; no live call
was made.**

## Provider Selection Behavior

`researchModelFactory.ts`'s `createResearchModel(config)` is the single
place in the codebase that branches on provider identity — confirmed by
the security audit grep below finding no other `if provider ===`-shaped
branching anywhere in the diff. Selection is resolved once, at
`apps/worker/src/index.ts`'s boot, from `env.RESEARCH_PROVIDER`
(defaults `'anthropic'`) and `env.RESEARCH_MODEL`, with an optional
second entry from `env.RESEARCH_FALLBACK_PROVIDER`/
`RESEARCH_FALLBACK_MODEL`. The existing `(userId) => ResearchProvider`
factory signature is unchanged; per-user persisted selection remains the
deferred, non-blocking open decision the decision review recorded it as
— no new persistence/migration was added for it, consistent with this
task's step list authorizing only the R-29 migration.

- Unknown provider name → `UnknownResearchProviderError`, thrown at
  `createResearchModel()` construction (tested).
- Missing credential for the *selected* provider → `MissingResearchProviderCredentialError`,
  naming the exact missing env var (tested) — thrown only when that
  provider is instantiated, never at boot for a provider nobody selected.
- Missing model for OpenAI/Gemini → `MissingResearchModelError` (tested)
  — no default model is assumed for either, per the original requirement
  document's own instruction not to prescribe model identifiers without
  authority.
- An Anthropic-only deployment (today's actual default: `RESEARCH_PROVIDER`
  unset → `'anthropic'`; `OPENAI_API_KEY`/`GEMINI_API_KEY`/
  `RESEARCH_FALLBACK_PROVIDER` all unset) boots and behaves exactly as
  before this work — proven by the config-level test
  `boots without OPENAI_API_KEY or GEMINI_API_KEY` and by the worker's
  `apps/worker/src/index.ts` always using `createFallbackResearchProvider`
  with a **single-attempt chain** in this configuration, which is
  behaviourally identical to the previously-used `createAnthropicResearchProvider`
  (proven by `fallbackResearchProvider.test.ts`'s "successful primary"
  and single-attempt-request-kind tests).

## Fallback Behavior

Implemented exactly as the technical spike's "Option A, refined"
specified: `createFallbackResearchProvider` fetches source documents
**once**, builds one `ResearchInput`, and reuses it unchanged across
every attempt in the chain — proven by a dedicated test asserting
`fetchSourceDocuments` is called exactly once even when the primary
fails and a fallback succeeds.

Eligibility is decided purely by error **type**, not a re-derived status
check: `ResearchProviderError` (the only error type `researchLead()`
throws for timeout, rate limit, outage, authentication failure, and
context-length failure alike, after its own existing retry budget is
exhausted or immediately for a non-retryable failure) is
FALLBACK-ELIGIBLE; `ResearchRefusedError`, `ResearchValidationError`
(covering both schema-validation and evidence/provenance-validation
exhaustion), and `ResearchAbortedError` are FALLBACK-INELIGIBLE, always.
All nine required scenarios from the implementation brief are covered by
passing tests: timeout/rate-limit/outage/auth-failure/context-length →
fallback (5 parameterized cases); refusal/schema-validation/evidence-validation
→ no fallback (3 cases); successful-first-provider → no fallback (1
case) — 15/15 `fallbackResearchProvider.test.ts` tests pass, including
"exhausts the primary's own retry budget before falling back" (proving
the *existing* `researchLead()` retry loop, unmodified, still runs to
completion before this wrapper ever sees a failure) and the two
source-document-fetching tests above.

R-29 tagging: every invocation from a non-primary attempt is reported
with `requestKind = 'fallback'`, verified via an `onUsage` spy; the
primary attempt's own `'initial'`/`'repair'` distinction is preserved
unchanged. Each attempt reports its own `provider`/`model`/
`providerMessageId` independently — confirmed by the metering tests.

## R-29 Changes

**Migration 0026** (`packages/db/prisma/migrations/0026_ai_usage_events_fallback_request_kind/migration.sql`)
widens `ai_usage_events.request_kind`'s `CHECK` constraint from
`('initial', 'repair')` to `('initial', 'repair', 'fallback')` — purely
additive, no existing row touched, no monetary column introduced
(consistent with migration 0021's own D10/D11 prohibition, unchanged).
`AiUsageRequestKind` (TypeScript) was widened to match; the write path
(`toNewAiUsageEventInput`, `recordEvent`, `pgRepository.ts`'s
parameterized `INSERT`) required **no logic change** — confirmed
correct by inspection before editing (all three already treat
`requestKind` as an opaque, generic value) and now proven against a
**real, migrated PostgreSQL database**:

- `tests/integration/ai-usage.integration.test.ts` (real Postgres, via
  `docker-compose.test.yml`): 13/13 tests pass, including two new ones —
  one proving a `'fallback'` row round-trips through `recordAiUsageEvent`
  and is readable back with `request_kind = 'fallback'` at the raw SQL
  level, and one proving the widened constraint still **rejects** an
  arbitrary invalid value (`'bogus'`), i.e. the constraint was widened,
  not removed or disabled.
- `packages/core-ai-usage/src/service.test.ts`: 2 new unit tests
  (persist a `'fallback'` event with its own provider/model identity;
  distinguish `'initial'`/`'repair'`/`'fallback'` as three non-colliding
  events for the same prospect).

No billing, cost estimation, pricing, or monetization logic was added —
confirmed by the security audit grep below.

## Schema Changes

None beyond the migration above. No Prisma model was added or modified
— `ai_usage_events` has never been modeled in `schema.prisma` (a
pre-existing, independently-documented condition of this repository, not
introduced or touched by this work); the table is managed entirely via
raw SQL migrations and `pg`-based repositories, consistent with every
other migration touching this table.

## Migration Number

`0026_ai_usage_events_fallback_request_kind` (confirmed next-available:
the migrations directory's highest prior number was `0025_followup_preparations`).

## Test Results

| Suite | Result |
|---|---|
| `packages/config` typecheck | PASS |
| `packages/config` unit tests | PASS (35/35, +9 new) |
| `packages/core-research` typecheck | PASS |
| `packages/core-research` unit tests | PASS (222/222 — 166 pre-existing + 56 new; 0 regressions) |
| `packages/core-ai-usage` typecheck | PASS |
| `packages/core-ai-usage` unit tests | PASS (17/17, +2 new) |
| `apps/worker` typecheck | PASS |
| `apps/worker` unit tests | PASS (171/171 — unchanged; `apps/worker/src/index.ts`'s boot wiring itself has no dedicated unit test, matching the pre-existing convention — it never had one before this work either) |
| Repository-wide typecheck (`pnpm run typecheck`, all 29 packages) | PASS |
| Repository-wide unit tests (`pnpm run test`, all 29 packages) | PASS (29/29 task successes; every package's own suite green) |
| Integration suite (`tests/integration`, real PostgreSQL via `docker-compose.test.yml`) | PASS (519/519 tests across 41 files, 13 pre-existing `todo`s, 1 pre-existing fully-skipped file — all unrelated to this work; includes `phase18-e2e.integration.test.ts` (1/1) and `research.integration.test.ts` (17/17) unaffected) |
| `git diff --check` | PASS (no whitespace errors) |

## Live-Provider Verification Status

```
Anthropic:  NOT APPLICABLE — unmodified; its existing production/test coverage is the baseline.
OpenAI:     BLOCKED — no credential available or requested; no live API call was made.
            Every claim about OpenAI's request/response shape follows the
            publicly documented Chat Completions + structured-outputs API;
            none of it is asserted as live-verified.
Gemini:     BLOCKED — no credential available or requested; no live API call was made.
            Same caveat as OpenAI, plus the schema-dialect translation
            (toGeminiSchema) and the responseId-fallback hashing are
            exercised only by fake-fetch unit tests, never a real endpoint.
```

No successful live-provider result is claimed or fabricated anywhere in
this document or in the test suite (every OpenAI/Gemini test uses an
injected `fetchImpl` fake — confirmed by direct inspection of both test
files: zero references to a live URL, zero network calls).

## Security Audit

Performed by grepping every file this implementation touched or added:

- **API keys / hardcoded credentials**: none found outside test fixture
  strings already marked `not-real` (e.g. `sk-openai-not-real`).
- **Provider SDK imports outside adapter files**: none — `openAIModel.ts`
  and `geminiModel.ts` use `fetch`, not the `openai`/`@google/genai`
  packages (deliberately, mirroring this package's own stated
  supply-chain-surface preference in `jsonSchema.ts`); `@anthropic-ai/sdk`
  remains imported only by the unmodified `anthropicModel.ts`. Confirmed
  no new dependency was added to any `package.json`, and `pnpm-lock.yaml`'s
  diff (pre-existing drift, unrelated internal `@acos/*` workspace-link
  entries — present before this implementation began) contains no
  `openai`/`@google/genai`/`@google-cloud` entry anywhere.
- **Provider-specific types leaking into domain contracts**: none —
  `LeadResearch`/`Observation`/`StoredResearchSignal` carry zero
  provider-identifying fields, confirmed unchanged (`schema.ts`,
  `types.ts`, `mapping.ts` are byte-for-byte untouched).
- **Send/delivery/CRM/scheduling/proposal-execution code**: none — the
  only two keyword matches in the entire diffed file set were both
  confirmed, via `git diff` on those exact lines, to be **pre-existing,
  unmodified comment text** referencing `core-outreach`/`core-proposal`
  as unrelated *consumers* of `ANTHROPIC_API_KEY` (already true before
  this work), not new functionality.
- **Automatic quality/cost/latency-based routing**: none — grepped
  `fallbackResearchProvider.ts` and `researchModelFactory.ts` for
  `cost|quality|latency|benchmark|best.provider|optimal`: zero matches.
  Fallback eligibility is purely error-type-based (see above); provider
  selection is purely configuration-based.
- **Credential exposure via logging**: `OPENAI_API_KEY`/`GEMINI_API_KEY`
  were added to `SECRET_KEYS`, and a genuine pre-existing gap in
  `redactedEnv()` was found and fixed in the same change (see below) —
  both new keys are proven, by test, to redact to `'[redacted]'` when
  set and `'[unset]'` (never the raw value or a silent omission) when
  absent.
- **Never puts a key in a request body**: both adapters carry a
  dedicated test proving the API key appears only in the
  `Authorization`/`x-goog-api-key` header, never the JSON body or the
  URL — the Gemini adapter specifically follows this repository's own
  existing `GOOGLE_PLACES_API_KEY` precedent (header, never a query
  string).

## Known Limitations / Incidental Fixes

- **`redactedEnv()` bugfix (packages/config/src/env.ts)**: adding the
  first genuinely-optional secret keys (`OPENAI_API_KEY`/`GEMINI_API_KEY`)
  exposed a pre-existing bug — Zod v3 omits an absent `.optional()` field
  from its parsed output object entirely (rather than setting it to
  `undefined`), so `redactedEnv()`'s original `Object.entries(env)` loop
  never saw an unset optional secret at all, silently leaving it out of
  the loggable summary instead of showing `'[unset]'`. Fixed by iterating
  the schema's own key list instead. This is a small, directly-necessitated
  fix (this capability's own two new secrets needed correct redaction
  behavior to satisfy this task's own security requirement), not a
  speculative improvement — flagged here rather than left silent.
- **OpenAI/Gemini schema-dialect acceptance is unverified** (see Live-Provider
  Verification Status) — this was already the known, documented state
  after the technical spike; nothing in this implementation phase could
  change that without a live credential.
- **Per-user/per-service-profile provider selection** remains
  unimplemented, exactly as the decision review classified it: a
  non-blocking, deferred open decision, not part of this task's
  authorized step list (which authorized only the env-level
  system-default + single-fallback configuration primitive).
- **`RESEARCH_FALLBACK_PROVIDER` supports exactly one fallback provider**,
  not an arbitrary chain — consistent with the explicit instruction not
  to build "a complex strategy engine." `createFallbackResearchProvider`'s
  own implementation accepts an arbitrarily-long `attempts` array (so
  extending this later needs no architectural change), but the worker's
  env-driven wiring only ever constructs at most two.

## Deferred Providers

Unchanged from every prior document this session — not investigated or
implemented, per explicit instruction:

```
Grok            — DEFERRED
DeepSeek        — DEFERRED
Mistral         — DEFERRED
Cohere          — DEFERRED
Meta/open-model — DEFERRED
future providers — DEFERRED
```

## Frozen-Phase Audit

```
Phase 18 (Provider Execution):     CLOSED / FROZEN / UNMODIFIED — packages/core-discovery untouched (git status confirms)
Phase 19 (Follow-Up [worker]):     CLOSED / FROZEN / UNMODIFIED
Phase 20 (Qualification):          CLOSED / FROZEN / UNMODIFIED — packages/core-qualification untouched
Phase 21 (Personalization):        CLOSED / FROZEN / UNMODIFIED — packages/core-personalization untouched
Phase 22 (Outreach Preparation):   CLOSED / FROZEN / UNMODIFIED — packages/core-outreach-preparation untouched
Phase 23 (Follow-Up Preparation):  CLOSED / FROZEN / UNMODIFIED — packages/core-followup-preparation untouched
Phase 24 (Evidence/Relevance):     UNCHANGED — still PROPOSED/NOT APPROVED; PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md
                                    untouched (git status shows it only as pre-existing untracked, not modified)

Migrations 0001-0025:              byte-for-byte unchanged (confirmed via git status)
apps/worker/src/searchWorker/*:    unchanged (worker.ts, providers.ts, pollLoop.ts)
No Phase 18-24 requirement/scope-lock document was modified by this implementation.
```

## Explicit No-Execution Proof

Restated and re-verified for this implementation specifically (not just
asserted by a prior document): grepped every changed/added file for
send/schedule/delivery/CRM/proposal-execution/payments/entitlements/CAPI
signatures — zero matches beyond two confirmed-unmodified, pre-existing
comment lines (see Security Audit). No file under `core-outreach`,
`core-outreach-preparation`, `core-proposal`, `core-payments`,
`core-entitlements`, or `core-capi` was touched. The entire capability
terminates at `ResearchProvider.research(input) → Promise<LeadResearch>`
— the same boundary that existed before this work, upstream of every
send-adjacent package.

## Final Status

```
PROVIDERS IMPLEMENTED:        Anthropic (unmodified), OpenAI (new), Gemini (new)
PROVIDER SELECTION:           IMPLEMENTED — config-driven (env), (userId) => ResearchProvider preserved
FALLBACK:                     IMPLEMENTED — Option A refined, error-type-based eligibility
R-29 FALLBACK ACCOUNTING:     IMPLEMENTED — migration 0026 + type widening, proven against real Postgres
DOWNSTREAM PIPELINE:          UNCHANGED — zero modification to Opportunity/Qualification/Personalization
PHASE 18-23:                  CLOSED / FROZEN / UNMODIFIED
PHASE 24:                     UNCHANGED
LIVE OPENAI VERIFICATION:     BLOCKED (no credential)
LIVE GEMINI VERIFICATION:     BLOCKED (no credential)
OFFLINE/UNIT/CONTRACT/DB-INTEGRATION VERIFICATION: COMPLETE (see Test Results)
NO-EXECUTION BOUNDARY:        PROVEN INTACT
COMMIT:                       NOT CREATED — awaiting explicit authorization
```
