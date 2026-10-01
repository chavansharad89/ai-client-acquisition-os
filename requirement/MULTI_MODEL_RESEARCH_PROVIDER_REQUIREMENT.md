# Multi-Model Research Provider Requirement

## 1. Status

PROPOSED — FUTURE CAPABILITY — NOT AUTHORIZED FOR IMPLEMENTATION

This document is an architecture/requirements audit and proposal only. It
authorizes no code, package, migration, worker, UI, or test change. Phase
18–23 remain CLOSED/FROZEN and Phase 24 (R-70/R-71/R-72) is unmodified by
this document.

## 2. Motivation

- **Current Anthropic coupling.** The only concrete `ResearchProvider`
  implementation in the repository (`createAnthropicResearchProvider` in
  [anthropicResearchProvider.ts](../packages/core-research/src/anthropicResearchProvider.ts))
  is backed by a single model adapter
  ([anthropicModel.ts](../packages/core-research/src/anthropicModel.ts))
  that imports `@anthropic-ai/sdk` directly and is wired unconditionally
  in [apps/worker/src/index.ts](../apps/worker/src/index.ts).
- **Vendor lock-in risk.** All lead research today depends on one vendor's
  availability, pricing, and API stability. There is no second
  implementation to fall back to or compare against.
- **Provider outage/rate-limit risk.** A single-provider architecture
  means an Anthropic outage or rate-limit event stalls all Research-stage
  processing for every Search in the worker's poll loop, with no
  alternative path.
- **Cost optimization opportunity.** Different providers/models have
  different pricing; a provider-neutral boundary is a precondition for
  ever comparing or shifting spend, without claiming any provider is
  cheaper or better today.
- **Ability to compare research quality.** A canonical, provider-neutral
  `ResearchProvider` contract is what would let the same research task be
  run through more than one model and compared on the existing evidence
  contract (R-70/R-71/R-72), rather than on vendor-reported quality
  claims.
- **Ability to experiment with different models.** Some research tasks
  may be better served by a different model even within the same vendor;
  a neutral boundary is prerequisite infrastructure for that too.

This document does not claim OpenAI, Anthropic, or Gemini is objectively
better, faster, or cheaper. It only documents the coupling and proposes a
future boundary.

## 3. Current Architecture Findings

All findings below are drawn directly from the repository at HEAD
`b728425ac2a3fc306aaeba750ce609df31c07122`.

**ResearchProvider location.** The provider-neutral interface is defined
in [packages/core-research/src/provider.ts](../packages/core-research/src/provider.ts):

```ts
export interface ResearchProviderInput {
  prospectId: string;
  companyId: string;
  companyName: string;
  normalizedDomain: string;
}

export interface ResearchProvider {
  research(input: ResearchProviderInput): Promise<LeadResearch>;
}
```

Its own doc comment states it is "deliberately independent of any vendor
(R-09)" and names `anthropicResearchProvider.ts` as "the concrete
production implementation."

**Current provider implementation.** `createAnthropicResearchProvider`
(same package, `anthropicResearchProvider.ts`) implements `ResearchProvider`
by composing:
1. a `SourceDocumentProvider` (fetches source documents — vendor-neutral,
   HTTP-based, in `sourceDocumentProvider.ts`), and
2. a `ResearchModel` (the model-call seam, defined in `researcher.ts`) —
   supplied by `createAnthropicResearchModel` from `anthropicModel.ts`.

`anthropicModel.ts` is the **only file in the repository that imports
`@anthropic-ai/sdk`** (confirmed by direct inspection — no other file
under `packages/` or `apps/` imports the Anthropic SDK). It builds the
Anthropic `Message.stream()` request (model id, `thinking: adaptive`,
`output_config.effort`, JSON-schema structured output) and translates the
SDK's response into the package's own `ModelResult`/`ModelInvocationUsage`
shapes.

**Dependency injection / configuration path.** Provider selection happens
by construction, not by runtime branching:
- `apps/worker/src/index.ts` (`main()`) calls `createAnthropicResearchModel({
  apiKey: env.ANTHROPIC_API_KEY })` once at boot, then builds a per-owner
  `ResearchProvider` factory: `researchProvider: (userId: string) =>
  createAnthropicResearchProvider({ model: researchModel, sourceDocuments,
  onUsage })`.
- `env.ANTHROPIC_API_KEY` comes from `@acos/config`'s `loadEnv()`
  ([packages/config/src/env.ts](../packages/config/src/env.ts)), which
  today declares only `ANTHROPIC_API_KEY` and `GOOGLE_PLACES_API_KEY`
  (the latter is Discovery's Google Places credential, unrelated to
  research). There is no `OPENAI_API_KEY`, `GEMINI_API_KEY`, or
  `RESEARCH_PROVIDER` configuration key anywhere in the repository today.
- [apps/worker/src/searchWorker/providers.ts](../apps/worker/src/searchWorker/providers.ts)
  defines `notConfiguredResearchProviderFactory()`, a stub used when no
  real provider is configured (tests, credential-less local dev). It is
  provider-agnostic — it throws `ProviderNotConfiguredError('ResearchProvider')`
  regardless of which vendor would eventually be wired in.

**Worker wiring.**
[apps/worker/src/searchWorker/worker.ts](../apps/worker/src/searchWorker/worker.ts)'s
`SearchWorkerDeps` declares `researchProvider: (userId: string) =>
ResearchProvider` — a **factory, not a shared instance**. Its doc comment
explains this exists because `ResearchProvider.research(input)` carries no
`userId`, but R-29 usage metering needs one at invocation time; the
factory lets a concrete implementation close over `userId` for metering
without changing the `ResearchProvider` contract. The worker itself never
imports Anthropic — it depends only on the `ResearchProvider` interface
from `@acos/core-research`.

**Downstream consumers.** `packages/core-opportunity`,
`packages/core-qualification`, `packages/core-personalization`, and
`packages/core-ai-usage` were inspected directly: none imports
`ResearchProvider`, `LeadResearch`, `@anthropic-ai/sdk`, or any
Anthropic-named symbol. They consume only the canonical, already-persisted
`ResearchSignal` rows (via `@acos/core-research`'s `toNewResearchSignals`
mapping in `mapping.ts`, which reads only `LeadResearch`/`Observation`
fields — no provider metadata). `core-ai-usage`'s persisted usage schema
(`provider: string`, `packages/core-ai-usage/src/types.ts` and
`pgRepository.ts`) stores provider identity as a free-form string, not an
Anthropic-specific type — it already accepts any provider name as data.

## 4. Provider-Neutrality Audit

**Verdict: PASS at the `ResearchProvider`/`LeadResearch` boundary; the
narrower `ResearchModel` seam is reasonably neutral but Anthropic-shaped
in a few particulars.**

Checked directly against the list of provider-specific leak concerns:

| Concern | Found in `ResearchProvider`/`LeadResearch`? | Found in `ResearchModel`? |
|---|---|---|
| Provider-specific SDK objects | No | No — `ResearchModel` takes `{ system, messages, signal }` and returns `ModelResult`, not an `Anthropic.Message` |
| Anthropic-specific response structures | No | No — translated to `ModelResult`/`ModelInvocationUsage` inside `anthropicModel.ts` before crossing the seam |
| Anthropic model names | No | The default model id (`'claude-opus-5'`) is a default *value* inside `anthropicModel.ts`'s options, not part of any type |
| Anthropic token metadata | No | `ModelInvocationUsage` has generic fields (`inputTokens`, `outputTokens`, `cacheCreationInputTokens`, `cacheReadInputTokens`) plus a free-form `provider: string` and `model: string` — shaped closely after Anthropic's usage block, but not typed to it |
| Anthropic-specific errors | No | `ResearchProviderError`/`ResearchRefusedError`/`ResearchAbortedError`/`ResearchValidationError` (`errors.ts`) are all generic; `anthropicModel.ts`'s own thrown `AnthropicConfigError` is a wiring-time constructor error, never returned from `research()` | 
| Provider-specific prompt assumptions | No | `SYSTEM_PROMPT`/`buildUserMessage` (`prompt.ts`) are plain strings; the structured-output schema (`schema.ts`, `jsonSchema.ts`) is hand-rolled generic JSON Schema, not an Anthropic tool-call schema |
| Provider-specific tool calls | No | No tool-call abstraction anywhere in `core-research`; Anthropic's `output_config.format: json_schema` and `thinking: adaptive` are request-construction details private to `anthropicModel.ts` |

What is **not** fully vendor-blind, noted without proposing a fix (per
scope): the `ResearchModel` interface's request shape — one `system`
string plus a `{role, content}` message array, returning either
`{kind:'json', value}` or `{kind:'refusal', category}` — maps cleanly onto
Anthropic's and OpenAI's chat-style APIs. Whether it maps equally cleanly
onto Gemini's API shape (which has some structural differences around
system instructions and content parts) is unverified; that determination
is deferred to whichever future work builds a `GeminiResearchProvider`
adapter, per §15 (Out of Scope: provider implementation).

Because every downstream consumer (Opportunity, Qualification,
Personalization, the `ResearchSignal` persistence path) depends only on
`LeadResearch`/`Observation`/`ResearchProvider`, and none of those types
carry vendor-specific data, **the existing contract already permits a
second or third `ResearchProvider` implementation without changing any
downstream stage.**

## 5. Canonical Research Contract

```
ResearchProvider
    ↓ research(ResearchProviderInput) → LeadResearch
Canonical ResearchResult (LeadResearch: companySummary, businessModel,
targetCustomers, visibleProblems, growthOpportunities, aiOpportunities,
websiteIssues, contentOpportunities, automationOpportunities,
recommendedService, confidence, gaps — each Observation carrying
classification/value/evidence/basis/confidence per schema.ts)
    ↓
Evidence / provenance / classification (schema.ts's OBSERVED/INFERRED/
UNKNOWN obligations, enforced by Zod + provenance.ts's verifyProvenance()
against the actual supplied source documents)
    ↓
Opportunity → Qualification → Personalization
```

This boundary already exists in the repository exactly as drawn above —
this document restates it, it does not invent it. The provider is treated
as a research instrument: it is handed a company/prospect identity
(`ResearchProviderInput`) and must return a `LeadResearch` value that
independently satisfies `leadResearchSchema` and `verifyProvenance()`.
Nothing downstream of that return value is aware of, or configurable by,
which vendor produced it.

Provider choice must not bypass R-70 (Source-to-Business Attribution),
R-71 (Service-Problem Relevance), or R-72 (Qualification Gate) — those
requirements are enforced on the persisted `ResearchSignal`/evidence
shape, after `LeadResearch` has already been validated and its provenance
verified, regardless of which provider produced the underlying claims. **A
provider can produce evidence. It cannot declare its own evidence valid**
— today that check is `verifyProvenance()` re-deriving OBSERVED evidence
against the actual source-document text the provider was given, not
trusting the provider's self-reported classification.

## 6. Proposed Provider Boundary

```
ResearchProvider
    research(input)
        ↓
Canonical ResearchResult (LeadResearch)
```

Provider implementations (naming only, not implemented by this document):

- `OpenAIResearchProvider`
- `AnthropicResearchProvider` (already exists today as
  `createAnthropicResearchProvider`)
- `GeminiResearchProvider`

No class bodies, adapters, or SDK wiring are added by this document.

## 7. Provider-Neutral Contract

What every future provider implementation must guarantee, based on what
the existing `AnthropicResearchProvider` already guarantees today:

- Same input semantics: given the same `ResearchProviderInput`
  (prospectId, companyId, companyName, normalizedDomain), the provider is
  responsible for its own evidence gathering (today: `SourceDocumentProvider`)
  and must not require the caller to know provider-specific parameters.
- Same canonical output representation: a `LeadResearch` value that
  independently validates against `leadResearchSchema`.
- Evidence provenance preserved: every OBSERVED claim's quote and source
  URL must be independently verifiable against the source documents the
  provider itself used — not merely self-reported by the provider.
- OBSERVED/INFERRED/UNKNOWN semantics preserved exactly as `schema.ts`
  defines them (evidence required/forbidden, confidence bounds, `basis`
  requirements) — a provider cannot redefine what these classifications
  mean.
- Source references preserved: `sourceUrl`/`sourceLabel`/`quote` on every
  piece of evidence, traceable to a real fetched document.
- Failures represented consistently: provider failures must surface
  through the existing `ResearchProviderError`/`ResearchRefusedError`/
  `ResearchAbortedError`/`ResearchValidationError` taxonomy (or an
  equivalent extension of it), not a provider-specific exception type
  leaking past the `ResearchProvider` boundary.
- Provider-specific details (SDK objects, vendor response structures,
  vendor-specific token/usage field names, vendor tool-call formats) must
  not leak past `ResearchProvider.research()`'s return value.

This section states WHAT must hold; it deliberately does not prescribe
HOW a future OpenAI or Gemini adapter satisfies it (that is
provider-implementation work, out of scope — §15).

## 8. Provider Selection

Classified against the architecture as it exists today, not decided here:

- **System default (one provider for the whole deployment).** SUPPORTED
  BY CURRENT ARCHITECTURE — this is exactly what `apps/worker/src/index.ts`
  does today (one `ResearchModel`/`ResearchProvider` built once at boot).
- **Per user.** SUPPORTED BY CURRENT ARCHITECTURE, at the seam only —
  `SearchWorkerDeps.researchProvider` is already `(userId: string) =>
  ResearchProvider`, a per-owner factory built specifically because R-29
  metering needs a userId at construction time. Nothing today makes that
  factory branch by userId (it always returns an Anthropic-backed
  instance), but the factory shape does not prevent it.
- **Per service profile.** OPEN PRODUCT DECISION — no code path today
  threads a service-profile identifier into `ResearchProvider`
  construction or `ResearchProviderInput`.
- **Per search.** OPEN PRODUCT DECISION — `ResearchProviderInput` carries
  `prospectId`/`companyId`/`companyName`/`normalizedDomain` only, no
  Search identifier; the worker resolves one `ResearchProvider` per owner
  for the whole poll-loop invocation, not per Search.
- **Per opportunity / per model.** OPEN PRODUCT DECISION — no existing
  hook at the Opportunity stage influences which provider or model ran
  the Research stage that preceded it (Research completes and persists
  before Opportunity is created).

This document does not choose among these; it records which are already
reachable given the existing per-owner factory seam and which would
require new plumbing.

## 9. Configuration

Conceptual future shape (not implemented, not authoritative):

```
Research provider: OpenAI | Anthropic | Gemini
Model: <provider-specific model identifier>
Credentials: <provider-specific API credential>
```

Today, `@acos/config`'s `loadEnv()` declares exactly one research
credential, `ANTHROPIC_API_KEY`, validated at boot (`env.ts`) — there is
no existing `RESEARCH_PROVIDER` selector, no `OPENAI_API_KEY`, no
`GEMINI_API_KEY`, and no per-model configuration key anywhere in the
repository. Credential storage, secret-management implementation, and
exact model identifiers for OpenAI/Anthropic/Gemini remain
implementation/product decisions unless defined elsewhere; this document
does not define them.

## 10. Canonical Evidence Contract

Provider selection MUST NOT alter the meaning of the canonical evidence
contract. All providers must produce research consumable by R-70
(Source-to-Business Attribution), R-71 (Service-Problem Relevance), and
R-72 (Qualification Gate) without bypassing those requirements. Those
requirements operate on the persisted `ResearchSignal`/evidence shape
produced from `LeadResearch` (via `toNewResearchSignals` and the
Qualification stage), which is identical regardless of which provider
produced the underlying `LeadResearch` value — see §5.

## 11. Cost / Usage Telemetry

Future requirement: provider/model usage should be measurable, including
where possible:

- provider
- model
- request count
- input token usage
- output token usage
- estimated cost
- latency
- success/failure

Current state: `@acos/core-ai-usage` already persists `provider: string`,
`model: string`, `inputTokens`, `outputTokens`,
`cacheCreationInputTokens`, `cacheReadInputTokens`, and `requestKind`
('initial' | 'repair') per invocation, keyed idempotently on `(provider,
providerMessageId)` — this schema does not assume Anthropic and would
accept rows from another provider's adapter without a schema change.
Missing today, and marked OPEN: latency measurement, cost estimation, and
success/failure-rate aggregation — none of these exist in the current
`AiUsageEventRepository` contract. A telemetry implementation is not
prescribed here.

## 12. Quality Comparison

Future capability: compare providers on the same research tasks. Potential
dimensions (not ranked, not implemented):

- source attribution accuracy
- evidence completeness
- evidence relevance
- false-positive rate
- qualification pass rate
- latency
- cost

This document does not rank OpenAI, Anthropic, or Gemini, and does not
declare a winner. The purpose recorded here is only that the existing
canonical `LeadResearch`/evidence contract (§5) is what would make an
empirical, apples-to-apples comparison possible once more than one
provider exists.

## 13. Failure / Fallback Behavior

Future requirement: a provider failure must not corrupt the canonical
research state. Failure modes to consider: timeout, rate limit, provider
outage, malformed response, authentication failure, incomplete evidence.

Current state: the existing single-provider path already isolates several
of these at the `researcher.ts` retry loop — provider errors are retried
with backoff up to `maxAttempts`, validation failures trigger a targeted
repair round rather than corrupting state, and a terminal failure raises a
typed error (`ResearchProviderError`/`ResearchValidationError`/etc.)
rather than persisting a partial or malformed `LeadResearch`. Whether
**automatic fallback to a second provider** should exist on failure is
unresolved — recorded here as an OPEN PRODUCT DECISION, not decided.

## 14. Security Boundary

- Provider credentials must not enter persisted opportunity evidence.
  Confirmed true of the current architecture: `LeadResearch`/
  `ResearchSignal` carry no credential material — `env.ANTHROPIC_API_KEY`
  flows only into `createAnthropicResearchModel`'s constructor, never into
  any persisted row.
- Provider secrets must not appear in logs. Not independently verified by
  this audit (no logging implementation was inspected); stated as a
  requirement for any future provider addition.
- Provider-specific credentials must be managed through configuration/
  secrets (today: `@acos/config`'s `loadEnv()`, boot-time validated) —
  the same pattern a future `OPENAI_API_KEY`/`GEMINI_API_KEY` should
  follow.
- One provider must not gain access to another provider's credential.
  Today only one credential exists so this is vacuously true; it becomes
  a real constraint once a second provider's credential is introduced.

Secret management is not implemented by this document.

## 15. Compatibility With Existing Pipeline

```
Discovery
→ Research Provider Abstraction
→ Canonical ResearchResult
→ Opportunity
→ Qualification
→ Personalization
→ Outreach Preparation
→ Follow-Up Preparation
→ READY_FOR_REVIEW
```

Changing research provider must not change downstream pipeline semantics.
Per §3, this already holds today by construction: `core-opportunity`,
`core-qualification`, `core-personalization`, `core-outreach-preparation`,
and `core-followup-preparation` depend on none of `ResearchProvider`,
`LeadResearch`, or any Anthropic symbol — only on the persisted
`ResearchSignal` rows derived from it.

## 16. Phase Boundary

This requirement is NOT Phase 24. Phase 24 remains limited to R-70, R-71,
and R-72, per
[PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md](./PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md),
which this document does not modify. The multi-model provider capability
described here is a future architectural/product capability unless
separately authorized. Phase 24 is not expanded by this document.

## 17. Out of Scope

Explicitly excluded from this document and from any capability it
describes, unless separately authorized in the future:

- send, schedule, delivery, autonomous outreach
- CRM, proposal execution, payments, SaaS billing
- Meta CAPI, reconciliation
- UI implementation
- provider implementation (no `OpenAIResearchProvider`/`GeminiResearchProvider`
  code)
- migrations
- worker changes
- automatic provider routing
- automatic model selection

## 18. Open Product Decisions

1. Should provider selection be system-wide, per user, per service
   profile, or per search? (§8 — per-user is architecturally reachable
   today via the existing factory seam; per-service-profile and
   per-search are not.)
2. Should model selection be exposed to users or abstracted behind a
   strategy?
3. Should automatic fallback between providers exist on failure? (§13)
4. Should the system automatically select providers based on cost/
   quality?
5. Which provider/model combinations are initially supported, and with
   which exact model identifiers? (Not prescribed here — no authoritative
   requirement for specific OpenAI/Gemini model names exists in the
   repository today.)
6. How should provider-specific cost telemetry be normalized across
   vendors with different pricing/unit structures? (§11)

No authoritative evidence in the repository answers any of these; none is
answered here.

## 19. Acceptance Criteria

Proposal-level only — none of these are implemented or claimed true today
beyond what §3–§5 already document as existing:

A. Same research input can be sent through multiple providers.
B. Each provider produces the canonical `ResearchResult` (`LeadResearch`)
   contract.
C. Downstream Opportunity processing does not depend on provider
   identity.
D. R-70/R-71/R-72 remain enforced regardless of provider.
E. Provider failures are isolated.
F. Provider/model usage can eventually be measured.
G. Provider-specific implementation details do not leak into downstream
   domain contracts.

## 20. Implementation Prerequisites

What must be decided before any implementation begins:

- provider-selection scope (§8/§18.1)
- supported model list (§18.5)
- fallback policy (§13/§18.3)
- telemetry requirements (§11)
- credential configuration (§9/§14)
- testing strategy
- quality-comparison methodology (§12)

## 21. Requirement Numbering

Requirement ID: TBD — governance decision required.

No authoritative requirement-governance rule for assigning the next
R-number was found in the inspected repository during this audit. No
R-73 or later identifier is assigned by this document.

## 22. Authorization

MULTI-MODEL RESEARCH PROVIDER:
PROPOSED — NOT AUTHORIZED FOR IMPLEMENTATION

Phase 24:
UNCHANGED

Phase 18–23:
CLOSED / FROZEN

No code changes:
YES
