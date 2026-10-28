# Multi-Model Research Provider — Architecture Decision Record

## Status

PROPOSED — ARCHITECTURE DECISION ANALYSIS — NOT AUTHORIZED FOR IMPLEMENTATION

This document is read-only architecture and product-decision analysis. It
authorizes no code, package, migration, worker, config, or UI change, and
it does not modify
[MULTI_MODEL_RESEARCH_PROVIDER_REQUIREMENT.md](./MULTI_MODEL_RESEARCH_PROVIDER_REQUIREMENT.md),
[MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md](./MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md),
or the Phase 24 scope lock. Baseline HEAD:
`b728425ac2a3fc306aaeba750ce609df31c07122`.

Every claim below is labeled:

- **REPOSITORY FACT** — verified directly by inspecting this repository.
- **PRODUCT/DESIGN DECISION** — a choice this document proposes or
  classifies, not yet authorized.
- **CURRENT EXTERNAL PROVIDER FACT** — a general, non-numeric statement
  about a vendor's publicly known API shape, offered only where confident
  and stated generally (no benchmark numbers, context-window sizes, or
  pricing are asserted).
- **OPEN QUESTION** — unresolved, requiring future investigation or a
  vendor's own current documentation before it can be relied on.

## 1. Executive Summary

The repository already draws a provider-neutral boundary
(`ResearchProvider.research(input): Promise<LeadResearch>`) that every
downstream pipeline stage depends on exclusively — no downstream package
imports a vendor SDK or vendor-specific type [REPOSITORY FACT, confirmed
in [MULTI_MODEL_RESEARCH_PROVIDER_REQUIREMENT.md](./MULTI_MODEL_RESEARCH_PROVIDER_REQUIREMENT.md)
§3–§4 and re-confirmed here]. Underneath that boundary, the repository
already separates **shared, provider-neutral orchestration** (retry,
repair, schema validation, provenance verification — all in
`researcher.ts`) from a **narrow, vendor-specific model-call seam**
(`ResearchModel`, implemented once today by `anthropicModel.ts`). This is
the correct shape to generalize to an arbitrary provider ecosystem: new
vendors are added by writing one `ResearchModel` adapter each, never by
adding a branch to shared business logic. This document's central
recommendation is to preserve and formalize that split, add a provider
capability boundary (§11) above it for the vendors whose APIs cannot
satisfy every part of the seam identically, and treat provider/model
selection, fallback, and automatic routing as separable, sequenced
decisions — not one monolithic "add multi-provider support" change.

## 2. Current Architecture Findings

[REPOSITORY FACT throughout this section; re-derived directly from
`packages/core-research/src/*`, `apps/worker/src/*`, `packages/config/src/env.ts`,
`packages/core-opportunity/src`, `packages/core-qualification/src`, and
`packages/core-ai-usage/src`, and consistent with the prior audit
recorded in `MULTI_MODEL_RESEARCH_PROVIDER_REQUIREMENT.md` §3.]

- **`ResearchProvider`** (`provider.ts`): `research(input:
  ResearchProviderInput): Promise<LeadResearch>`. The only production
  implementation is `createAnthropicResearchProvider`
  (`anthropicResearchProvider.ts`), which composes a `SourceDocumentProvider`
  (HTTP-based, vendor-neutral) and a `ResearchModel`.
- **`ResearchModel`** (`researcher.ts`): `(request: { system: string;
  messages: {role, content}[]; signal?: AbortSignal }) => Promise<ModelResult>`,
  where `ModelResult` is `{kind:'json', value, usage?}` or
  `{kind:'refusal', category, usage?}`. This is the narrowest seam in the
  package and the only place a vendor's request/response shape must be
  translated. `anthropicModel.ts` is the sole implementation and the
  **only file in the repository that imports `@anthropic-ai/sdk`**
  (`packages/core-outreach` also lists `@anthropic-ai/sdk` as a
  dependency in its `package.json`, but no source file under
  `packages/core-outreach/src` imports it — Outreach Preparation is Phase
  22, frozen, and out of scope for this document).
- **Orchestration is shared, not per-vendor**: `researchLead()` in
  `researcher.ts` owns retry/backoff (`backoffDelayMs`,
  `toProviderError`), the repair loop (`repair.ts`'s `planRepair`/
  `applyRepair`), Zod validation (`schema.ts`'s `leadResearchSchema`), and
  provenance verification (`provenance.ts`'s `verifyProvenance`) — **once**,
  regardless of which `ResearchModel` is plugged in. A future provider
  adapter does not get to re-implement or weaken any of this; it only
  supplies raw model calls.
- **Canonical result**: `LeadResearch` (`schema.ts`) — every claim
  classified OBSERVED/INFERRED/UNKNOWN with Zod-enforced obligations
  (evidence required/forbidden, confidence bounds), independently
  re-verified against actual fetched source-document text by
  `verifyProvenance()` rather than trusted from the model's self-report.
- **Worker DI**: `apps/worker/src/searchWorker/worker.ts`'s
  `SearchWorkerDeps.researchProvider` is `(userId: string) =>
  ResearchProvider` — a per-owner **factory**, built specifically because
  R-29 metering needs a `userId` at construction time, not because
  provider identity varies by user today. `apps/worker/src/index.ts`
  builds exactly one `ResearchModel` (Anthropic) once at boot and closes
  over it in that factory.
- **Configuration**: `packages/config/src/env.ts` declares
  `ANTHROPIC_API_KEY` and `GOOGLE_PLACES_API_KEY` only (the latter is
  Discovery's, unrelated). No `RESEARCH_PROVIDER` selector, no
  `OPENAI_API_KEY`/`GEMINI_API_KEY`/other vendor credential key exists
  anywhere in the repository today.
- **Metering (R-29)**: `packages/core-ai-usage` persists
  `ModelInvocationUsage` (`provider: string`, `model: string`,
  `providerMessageId: string`, `inputTokens`, `outputTokens`,
  `cacheCreationInputTokens`, `cacheReadInputTokens`, `requestKind:
  'initial'|'repair'`) keyed idempotently on `(provider,
  providerMessageId)`. `provider`/`model` are free-form strings, not
  Anthropic-typed enums — this schema already accepts any vendor's name
  as data without a shape change.
- **Error taxonomy** (`errors.ts`): `ResearchProviderError` (status,
  retryable), `ResearchValidationError`, `ResearchRefusedError`,
  `ResearchAbortedError` — all provider-neutral; `anthropicModel.ts`'s own
  `AnthropicConfigError` is a construction-time wiring fault, never
  returned from `research()`.
- **Downstream consumers**: `packages/core-opportunity`,
  `packages/core-qualification`, `packages/core-personalization` import
  none of `ResearchProvider`, `LeadResearch`, or any vendor symbol — they
  consume only the persisted `ResearchSignal` rows produced by
  `mapping.ts`'s `toNewResearchSignals(research: LeadResearch)`, which
  reads only canonical `Observation` fields.
- **Tests**: `testSupport.ts`'s `fakeResearchProvider()` implements
  `ResearchProvider` directly with a fixed/parameterized `LeadResearch`
  value — the package's own test suite already exercises the
  orchestration layer without any vendor SDK, evidence the boundary is
  genuinely substitutable.
- **Prompt/schema layer** (`prompt.ts`, `jsonSchema.ts`): plain strings
  and hand-rolled generic JSON Schema — no vendor tool-call format, no
  vendor-specific prompt syntax.

## 3. Provider Ecosystem Analysis

General architectural characteristics only — no rankings, no benchmark
numbers, no pricing, no context-window figures.

| Provider family | API availability | Structured output | Tool/function calling | Multimodal potential | Context-window implications | Streaming | Auth model | Rate-limit model | Usage/cost telemetry | Model identifier differences | Response-schema differences | Error taxonomy differences | Regional/availability considerations |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| OpenAI | [CURRENT EXTERNAL PROVIDER FACT] Public chat-completions/responses-style API exists | [CURRENT EXTERNAL PROVIDER FACT] JSON-schema-constrained structured output is a known offered capability | [CURRENT EXTERNAL PROVIDER FACT] Function/tool calling is a known offered capability | [CURRENT EXTERNAL PROVIDER FACT] Multimodal (image, and other modality) input is offered on at least some models | [OPEN QUESTION] exact limits vary by model and change over time | [CURRENT EXTERNAL PROVIDER FACT] Streaming responses are supported | API-key based | [OPEN QUESTION] exact tiers/limits not verified here | [OPEN QUESTION] whether usage/cost fields match `ModelInvocationUsage`'s shape needs adapter-time verification | [OPEN QUESTION] model id format differs from Anthropic's; not enumerated here | [OPEN QUESTION] exact refusal/safety signaling shape differs from Anthropic's `stop_reason: 'refusal'` | [OPEN QUESTION] HTTP status/error-body shape needs its own `toProviderError`-equivalent mapping | [OPEN QUESTION] |
| Anthropic | [REPOSITORY FACT] Already integrated (`anthropicModel.ts`) | [REPOSITORY FACT] Used today via `output_config.format: json_schema` | Not used by the current research adapter (research is answer-only, no tool calls today) [REPOSITORY FACT] | Not used by the current adapter [REPOSITORY FACT] | [REPOSITORY FACT] Adapter uses `thinking: adaptive` and a configurable `effort` level, both Anthropic-specific request options | [REPOSITORY FACT] Used today (`client.messages.stream`) | [REPOSITORY FACT] API-key based (`ANTHROPIC_API_KEY`) | [REPOSITORY FACT] 429 classified retryable in `toProviderError` | [REPOSITORY FACT] `response.usage.{input_tokens,output_tokens,cache_creation_input_tokens,cache_read_input_tokens}` mapped to `ModelInvocationUsage` | [REPOSITORY FACT] default `'claude-opus-5'`, configurable | [REPOSITORY FACT] refusal signaled via `stop_reason === 'refusal'` with a `stop_details.category` | [REPOSITORY FACT] HTTP status drives `retryable` (408/409/429/5xx retryable; 4xx otherwise not) | [OPEN QUESTION] |
| Google Gemini | [CURRENT EXTERNAL PROVIDER FACT] Public generative-content API exists | [CURRENT EXTERNAL PROVIDER FACT] Schema-constrained/JSON output is a known offered capability | [CURRENT EXTERNAL PROVIDER FACT] Function calling is a known offered capability | [CURRENT EXTERNAL PROVIDER FACT] Native multimodal input is a known strength of this family | [OPEN QUESTION] | [CURRENT EXTERNAL PROVIDER FACT] Streaming supported | API-key or cloud-credential based, varies by access path | [OPEN QUESTION] | [OPEN QUESTION] whether usage field names/semantics (e.g. cached-token accounting) map onto `ModelInvocationUsage` needs verification | [OPEN QUESTION] | [OPEN QUESTION] system-instruction and content-part structuring is known to differ structurally from a single system string, per §4 of the prior requirement document | [OPEN QUESTION] | [OPEN QUESTION] |
| xAI / Grok | [CURRENT EXTERNAL PROVIDER FACT] A hosted API exists | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] likely API-key based, unverified here | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] |
| DeepSeek | [CURRENT EXTERNAL PROVIDER FACT] A hosted API exists | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] region/compliance posture requires its own review before any commercial use |
| Mistral | [CURRENT EXTERNAL PROVIDER FACT] A hosted API exists, plus open-weight models | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] |
| Cohere | [CURRENT EXTERNAL PROVIDER FACT] A hosted API exists, historically enterprise/RAG-oriented | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] |
| Meta/open-model ecosystem | [CURRENT EXTERNAL PROVIDER FACT] Open-weight models exist and can be self-hosted or accessed via third-party inference providers | [OPEN QUESTION] depends entirely on the hosting/inference layer chosen, not on Meta directly | [OPEN QUESTION] same | [OPEN QUESTION] same | [OPEN QUESTION] same | [OPEN QUESTION] same | [OPEN QUESTION] self-hosting implies a wholly different auth/ops model than a vendor API key | [OPEN QUESTION] self-hosted rate limiting is an infrastructure decision, not a vendor policy | [OPEN QUESTION] self-hosted usage accounting would need to be built, not received from a vendor | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] self-hosting raises its own operational/regional questions distinct from a hosted-API vendor |
| Other future providers | — | — | — | — | — | — | — | — | — | — | — | — | [OPEN QUESTION] evaluated case by case against §11's capability contract when named |

Whether each provider **can satisfy the canonical research contract**
(§10) is an [OPEN QUESTION] per vendor, to be answered when that vendor's
adapter is actually designed — not assumed here. The one architectural
fact that generalizes across the row is: **every candidate above can, at
minimum, accept a text prompt and return text/JSON** — which is exactly
what `ResearchModel`'s minimal contract requires. Anything beyond that
(tool calling, multimodal, native web search, reasoning-mode controls) is
a capability **extension**, not a requirement of the base contract — see
§11.

## 4. Decision 1 — Provider Selection Scope

| Scope | Benefits | Drawbacks | Architectural implications | Operational implications | UX implications | Cost implications | Complexity |
|---|---|---|---|---|---|---|---|
| A. System-wide | Simplest possible; matches today's actual behavior [REPOSITORY FACT] | No experimentation, no per-tenant flexibility | Zero new plumbing — one `ResearchModel` built at boot | One credential set to operate | None — invisible to users | Single, predictable spend profile | Lowest |
| B. Deployment/environment | Lets staging/prod or regional deployments differ | Still not a product-facing lever | One env var (`RESEARCH_PROVIDER`), read once at boot | Deploy-time config change, no runtime risk | None | Predictable per environment | Low |
| C. Per user | Already reachable at the existing factory seam (`(userId) => ResearchProvider`) [REPOSITORY FACT] | Requires a place to store each user's selection and a lookup at construction time | Factory would branch on a stored preference instead of always returning the same instance | Needs a settings surface and a data store for the preference | User-visible choice, requires UI (out of scope here) | Cost varies per user, needs per-user usage visibility | Moderate |
| D. Per service profile | Aligns provider choice with the profile's stated services, if some provider suits certain service categories better | No existing link between `core-service-profile` and Research; would be new plumbing | `ResearchProviderInput` and/or the factory would need a service-profile identifier threaded through | New coupling between two currently-independent packages | Indirect — user picks a profile, provider follows | Cost tied to profile, less transparent to the user | Moderate-high |
| E. Per search | Maximum flexibility per run | No existing Search→Research provider link; the worker resolves one provider per **owner**, not per Search [REPOSITORY FACT] | `ResearchProviderInput` would need a provider/model hint, and the worker's one-provider-per-owner assumption would need revisiting | Every Search could carry different cost/latency characteristics, complicating support/debugging | Most granular user control, but the most UI surface | Hardest to forecast or cap | High |
| F. Per opportunity | Research already completes and persists **before** Opportunity is created [REPOSITORY FACT — see pipeline order in §2] | Provider choice would have to be decided retroactively or re-run research, which conflicts with the existing one-pass pipeline | Would require re-architecting stage ordering or re-research triggers | Unclear operational benefit over per-search | Confusing — opportunity doesn't exist yet when research runs | N/A | Highest, and conceptually mismatched to current pipeline order |
| G. Automatic per request | Removes manual choice entirely | Requires the routing logic in Decision 4, which this document defers | Depends entirely on Decision 4 being built first | Hardest to predict/debug/operate without maturity in telemetry (§9) first | Invisible to the user, for better or worse | Potentially optimal, but only once quality/cost signals exist to route on | Highest, and depends on infrastructure not yet built |

**Recommendation [PRODUCT/DESIGN DECISION, not authorized]:** the
lowest-risk next step beyond today's system-wide default is **per-user
(C)**, because it is the only scope the architecture already has a seam
for (`researchProvider: (userId) => ResearchProvider`) without new
cross-package coupling. Per-service-profile (D) and per-search (E) are
legitimate future directions but require new plumbing this document does
not authorize. Per-opportunity (F) conflicts with the current pipeline
order and should not be pursued without first re-examining that order.
Automatic-per-request (G) is a Decision-4 dependency, not a starting
point.

## 5. Decision 2 — Model Selection

Options: (A) provider only, (B) provider + model, (C) model only, (D) a
named strategy (Fast/Balanced/Deep), (E) fully automatic, (F) hybrid.

**Assumptions stated explicitly** [PRODUCT/DESIGN DECISION]:
- Different models plausibly differ in quality, cost, speed, context
  limits, and structured-output reliability — this is treated as a
  reasonable general premise, not backed by benchmark claims in this
  document.
- `AnthropicModelOptions` (`anthropicModel.ts`) already exposes `model`
  and `effort` as independent, provider-scoped parameters today
  [REPOSITORY FACT] — the codebase already distinguishes "which vendor"
  from "which model/effort within that vendor."

**Analysis:**
- (A) Provider only hides a real axis of variation (cost/quality differ
  materially by model within one vendor) and would be a regression from
  what `anthropicModel.ts` already supports.
- (C) Model only removes the vendor as a first-class concept, which
  breaks credential/config scoping (§9) and capability negotiation (§11)
  that are inherently per-vendor.
- (D) A strategy label (Fast/Balanced/Deep) is attractive for a
  non-technical user-facing surface, but it requires someone to define
  and maintain the mapping from strategy → provider+model, which is
  itself a product decision not made here.
- (E) Fully automatic model selection depends on the same quality/cost
  telemetry infrastructure Decision 4 depends on, and should not precede
  it.

**Recommendation [PRODUCT/DESIGN DECISION, not authorized]:** (B)
provider + model as the underlying configuration primitive (this is what
the current `AnthropicModelOptions` shape already implies), with (D) a
strategy label as an optional **UI-level convenience layered on top of**
B, not a replacement for it — the strategy resolves to a concrete
provider+model pair internally rather than being its own persisted
concept. (E) automatic selection is deferred to Decision 4's future
layer.

## 6. Decision 3 — Fallback

Options: (A) none, (B) manual retry, (C) same-provider model fallback,
(D) cross-provider fallback, (E) automatic fallback, (F) configurable
fallback chain.

**When fallback should occur:** only after the existing
provider-error-retry budget inside `researchLead()` is exhausted
(`config.maxAttempts`, already provider-neutral) — fallback is a
different provider/model, not a substitute for the existing retry loop,
and should not fire on the first transient error.

**Failures that could justify fallback** [PRODUCT/DESIGN DECISION]:
non-retryable-but-not-content-related provider failures exhausted at the
current provider — e.g. a sustained rate-limit or outage classified
retryable-but-never-recovering within budget, or an authentication
failure specific to that one provider's credential.

**Failures that must NOT trigger fallback:**
- `ResearchRefusedError` — a safety refusal is a property of the
  request/content, not (necessarily) the vendor; re-running the identical
  request against a second vendor to route around a safety decline is a
  policy question this document explicitly does not resolve and flags as
  requiring its own review, not silent fallback.
- `ResearchValidationError` after the repair loop is exhausted — this
  indicates the model could not produce schema-valid, provenance-clean
  output for these source documents; a different vendor might behave
  differently, but silently retrying the same evidence-integrity check
  against another vendor should be an explicit, reviewed policy, not a
  default.
- `ResearchAbortedError` — the caller left; no fallback should ever spend
  more provider budget on a request nobody is waiting for.

**How duplicate research is avoided:** [OPEN QUESTION] — today
`researchLead()` runs once per `ResearchProviderInput`. A fallback layer
sitting above one or more `ResearchModel`s would need to guarantee it
runs the *same* orchestration (retry/repair/provenance) against the next
provider rather than re-invoking the whole `ResearchProvider.research()`
call and risking two persisted `ResearchRunResult`s for one logical run —
this is a design detail for the future fallback implementation, not
decided here.

**How provenance records provider/model identity:** see §12 — provider
and model identity must be attached to the metering record
(`ModelInvocationUsage`, already provider-neutral today) for every
attempt, fallback or not, so a fallback chain is auditable after the
fact.

**How cost is tracked across a fallback chain:** every attempt — original
and fallback — should each produce its own `ModelInvocationUsage` event
(the existing schema already supports multiple rows per `prospectId`, see
`requestKind: 'initial'|'repair'`, which would need a third value or an
equivalent field to distinguish a fallback attempt — an [OPEN QUESTION]
for the future telemetry design in §9).

**Fallback must never bypass R-70/R-71/R-72:** true by construction as
long as fallback is implemented as "try a different `ResearchModel` and
run it through the same unmodified `researchLead()` orchestration" —
because provenance verification and evidence classification happen in
`researcher.ts`/`provenance.ts`, not inside any given provider adapter,
a fallback provider's output is checked exactly as strictly as the
primary's.

**Recommendation [PRODUCT/DESIGN DECISION, not authorized]:** (F)
configurable fallback chain, restricted to non-content-related,
budget-exhausted provider failures only, explicitly excluding refusals
and validation failures from automatic fallback pending a separate policy
decision.

## 7. Decision 4 — Automatic Routing

**Phase 1 (this document's horizon): manual provider/model selection
only**, per Decision 1/2's recommendations.

**Future: automatic routing** based on cost, latency, reliability,
research quality, evidence quality, task type, customer segment,
geography, or source complexity is a plausible future layer, but it has
a hard prerequisite this repository does not yet have: **empirical
telemetry comparing providers on the same tasks** (§9, §16). Routing
before that data exists would be guessing, not optimizing.

**Recommendation [PRODUCT/DESIGN DECISION, not authorized]:** automatic
routing belongs in a future architecture layer built strictly **after**
(a) multi-provider support exists, (b) usage/quality telemetry (§9) is
being collected across providers, and (c) the quality-comparison
framework (§16) has produced enough data to route on. It must not be
introduced into Phase 24, and is not introduced by this document.

## 8. Decision 5 — Initial Provider Matrix

Statuses used: `Candidate`, `Future Candidate`, `Requires Investigation`,
`Not Initially Supported`. No provider is ranked; no numerical scores are
assigned.

| Provider | Research fit | Structured output | Tool use | Multimodal potential | Cost telemetry | Integration complexity | Initial status |
|---|---|---|---|---|---|---|---|
| Anthropic | Already integrated and production-proven for this exact task [REPOSITORY FACT] | Already integrated | Not used by current adapter | Not used by current adapter | Already integrated into `core-ai-usage` | None — already done | Candidate (already implemented) |
| OpenAI | Plausible fit given known general-purpose structured-output support [CURRENT EXTERNAL PROVIDER FACT, general] | Known offered capability [CURRENT EXTERNAL PROVIDER FACT] | Known offered capability, unused by this task's contract | [OPEN QUESTION] not required by current contract | [OPEN QUESTION] needs field-mapping verification | Moderate — one new adapter, well-trodden API family | Candidate |
| Google Gemini | Plausible fit; API-shape differences flagged in §3/§4 of the prior requirement doc need resolving first | Known offered capability [CURRENT EXTERNAL PROVIDER FACT] | Known offered capability, unused | Notable strength of this family generally [CURRENT EXTERNAL PROVIDER FACT] | [OPEN QUESTION] | Moderate-high — request-shape differences (system instructions, content parts) likely need adapter-level translation | Candidate |
| xAI / Grok | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | Requires Investigation |
| DeepSeek | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | Requires Investigation |
| Mistral | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | Requires Investigation |
| Cohere | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | Requires Investigation |
| Meta/open-model ecosystem | Depends entirely on which hosting/inference layer is chosen, not on Meta directly | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] | [OPEN QUESTION] would likely require building telemetry rather than receiving it | High — self-hosting or third-party inference adds an operational layer beyond a simple vendor adapter | Future Candidate |
| Other future providers | — | — | — | — | — | — | Requires Investigation, evaluated when named |

This is a factual/architectural classification, not a recommendation to
build any of these now — §17/§20 restate that no provider implementation
is authorized by this document.

## 9. Decision 6 — Cost / Usage Telemetry

Provider-neutral usage model, classified against what `core-ai-usage`
already persists [REPOSITORY FACT: `ModelInvocationUsage`/
`AiUsageEventRepository`, see §2]:

| Field | Classification | Notes |
|---|---|---|
| provider | REQUIRED | Already persisted today (`provider: string`) |
| model | REQUIRED | Already persisted today (`model: string`) |
| request ID (provider's own message/response id) | REQUIRED | Already persisted today (`providerMessageId`), and is the idempotency key |
| user/owner | REQUIRED | Already threaded through `AiUsageEventRepository.recordEvent(userId, ...)` |
| search ID | OPEN DECISION | Not present in `ModelInvocationUsage` or the usage table today; would need to be added if per-search cost reporting is required |
| opportunity ID (where applicable) | OPEN DECISION | Research precedes Opportunity in the pipeline (§4.F), so this would only ever be a later, derived join, not a field captured at usage-record time |
| input usage | REQUIRED | Already persisted today (`inputTokens`) |
| output usage | REQUIRED | Already persisted today (`outputTokens`) |
| total usage | OPTIONAL | Derivable from input+output; not separately stored today, and need not be |
| estimated cost | OPEN DECISION | Not computed or stored today; would require a provider/model pricing table maintained outside this schema |
| latency | OPEN DECISION | Not captured today |
| success/failure | OPTIONAL | Implicitly true for every persisted row today (a failed invocation with no usage is never metered, per R-29 scope lock D7) — an explicit failure-outcome field is an open decision if failed-but-billed cases (e.g. a refusal) need distinguishing from successful research |
| retry count | OPEN DECISION | `requestKind: 'initial'|'repair'` already distinguishes repair rounds per row today, but a rolled-up "this prospect took N attempts" count is not separately stored |
| fallback count / fallback flag | OPEN DECISION | No fallback concept exists in the schema today (§6) — would need a new field or a new `requestKind` value |

No migration is proposed or implied by this table.

## 10. Canonical Research Contract

```
Provider-specific response (OpenAI / Anthropic / Gemini / Grok /
DeepSeek / Mistral / Cohere / self-hosted-open-model response)
        ↓
Provider adapter (ResearchModel implementation — the ONLY layer that
may know a vendor's request/response shape)
        ↓
Canonical ResearchResult (LeadResearch — schema.ts, unchanged by
provider identity)
        ↓
Evidence / provenance (verifyProvenance() — re-derived from the actual
source documents, never trusted from the provider)
        ↓
Opportunity
        ↓
R-70 / R-71 / R-72
        ↓
Qualification
```

This is not a new proposal — it is the boundary the repository already
implements (§2), restated here as the answer to §4's central question.
**The downstream domain must not know any vendor's SDK types**, and
today it does not: confirmed directly by grepping
`packages/core-opportunity/src`, `packages/core-qualification/src`, and
`packages/core-personalization/src` for `ResearchProvider`, `LeadResearch`,
`anthropic`, and `@anthropic-ai/sdk` — zero matches outside test/comment
prose in `core-ai-usage`. Provider-specific implementation must terminate
at the `ResearchModel` adapter boundary; it already does.

## 11. Provider Capability Abstraction

**Central architectural question, answered:** the correct shape is
**not** a flat `if provider == "x"` inside business logic (confirmed
absent today — `researchLead()`, `provenance.ts`, and every downstream
package are provider-agnostic by construction), and it is also not a
single monolithic `AIProvider → ResearchCapability → Canonical
ResearchResult` layer collapsed into one interface. The repository
already demonstrates a better decomposition:

```
ResearchModel (vendor adapter — one per provider/model family;
               the ONLY layer allowed to import a vendor SDK)
    ↓
researchLead() orchestration (SHARED, provider-neutral — retry,
               repair, schema validation, provenance verification;
               never duplicated per vendor)
    ↓
ResearchProvider (composition/DI seam — binds one ResearchModel +
               SourceDocumentProvider + metering hook into the
               frozen research(input) interface the worker consumes)
    ↓
Canonical ResearchResult (LeadResearch)
```

Provider **selection** happens exactly once, at construction time
(worker boot or a future factory keyed on user/profile/search), by
choosing which `ResearchModel` to close over — never at request time
inside shared logic. This is what keeps new providers from ever becoming
runtime branches in business logic: adding DeepSeek means writing
`deepSeekModel.ts` satisfying the existing `ResearchModel` interface,
nothing else changes.

**Where capability differences enter:** `ResearchModel`'s current
contract (`{system, messages, signal} → {kind:'json'|'refusal', value,
usage}`) is a lowest-common-denominator request/response shape. Tool
calling, multimodal input, native web search, and provider-specific
reasoning-mode controls (Anthropic's `thinking: adaptive`/`effort` are
already vendor-specific parameters living only inside `anthropicModel.ts`,
never in the shared `ResearchModel` type) are **capability extensions**,
not required fields of the base contract. The critical rule this document
holds to: **the canonical contract (`LeadResearch`, OBSERVED/INFERRED/
UNKNOWN semantics, evidence requirements) must never be weakened because
one provider cannot produce a given optional capability** — a provider
that cannot do native web search, for example, still must satisfy
`SourceDocumentProvider`-supplied evidence and pass `verifyProvenance()`
identically to one that can.

**Required canonical fields:** everything `leadResearchSchema` already
requires today (§2) — unchanged by provider.
**Optional capability extensions:** tool calling, multimodal input,
native web/browsing, provider-specific reasoning controls.
**Unsupported-capability behavior:** [OPEN QUESTION] — whether an
adapter for a capability-lacking provider should degrade gracefully
(e.g. skip a reasoning-mode parameter) or refuse to be selected for a
task that needs it is not decided here.
**Provider capability negotiation:** [OPEN QUESTION] — whether this is
checked at adapter-construction time, at provider-selection time, or not
at all in Phase 1, is not decided here.

## 12. Provider Capability Registry

Whether a registry (`Provider { capabilities: { structured_output,
tool_calling, multimodal, web_search, streaming, usage_reporting } }`)
is needed, and where it lives, is analyzed but **not implemented**:

- **Static configuration**: simplest, matches how `AnthropicModelOptions`
  already expresses per-vendor request shape today (`model`, `effort`) —
  low operational overhead, but requires a code/config change to update
  a provider's known capabilities.
- **Provider adapter metadata**: each `ResearchModel` implementation
  could export a small capability descriptor alongside itself — keeps
  the capability claim next to the code that must actually honor it,
  reducing drift between the two.
- **Runtime capability discovery**: querying the vendor's API for its
  own capabilities at startup — most accurate but adds a network
  dependency to boot-time wiring and is the most complex option.
- **Combination**: adapter metadata as the source of truth, optionally
  validated against runtime discovery where a vendor exposes it.

**Recommendation [PRODUCT/DESIGN DECISION, not authorized]:** adapter
metadata (option 2) is the best fit for this codebase's existing pattern
(`AnthropicModelOptions` already lives beside `anthropicModel.ts`), but
this is not decided or implemented here.

## 13. Provider Identity / Provenance

What the architecture should be able to answer: "which provider and model
produced this research?" — without provider-specific SDK objects entering
domain persistence. At minimum, per attempt:

- `provider_id` — already persisted today as `provider: string` in
  `ModelInvocationUsage`/the usage table [REPOSITORY FACT].
- `model_id` — already persisted today as `model: string`
  [REPOSITORY FACT].
- `request_id` — already persisted today as `providerMessageId`
  [REPOSITORY FACT], the provider's own response identifier, not an SDK
  object.
- `timestamp` — already captured at the metering call site (`new Date()`
  passed to `recordEvent`) [REPOSITORY FACT].
- `attempt` — partially present today via `requestKind:
  'initial'|'repair'`; a full attempt-number field is not currently
  stored [OPEN QUESTION, see §9's "retry count" row].
- `fallback status` — not present today; would need a new field once
  fallback (§6) exists [OPEN QUESTION].

No schema is invented here — this restates what already exists
(`ModelInvocationUsage`) and flags the two fields (`attempt`, `fallback
status`) that do not yet exist, consistent with §9. Critically, none of
these fields are, or need to be, vendor SDK objects — `providerMessageId`
is already a plain string extracted from the SDK response inside
`anthropicModel.ts` (`response.id`), never the response object itself
[REPOSITORY FACT] — this is exactly the pattern a future provider adapter
must follow.

## 14. Failure Model

Provider-neutral failure taxonomy, extending the existing taxonomy
(§2) without modifying it:

| Failure | Retryable | Fallback-eligible | Notes |
|---|---|---|---|
| Authentication failure (bad/expired credential) | No [REPOSITORY FACT — 401 is not in `toProviderError`'s retryable set] | Yes, in principle — a credential problem is provider-specific and a different provider's credential is unaffected | Should not silently retry the same broken credential |
| Invalid request (malformed params) | No [REPOSITORY FACT — 400/404 not retryable] | No — a malformed request would likely be malformed identically against any provider unless the cause is provider-specific request construction, in which case it is an adapter bug, not a fallback case | |
| Rate limit | Yes, within budget [REPOSITORY FACT — 429 retryable] | Yes, once budget exhausted | Matches §6's fallback trigger condition |
| Timeout | Yes, within budget [REPOSITORY FACT — 408 retryable] | Yes, once budget exhausted | |
| Provider outage | Yes, within budget (5xx retryable) [REPOSITORY FACT] | Yes, once budget exhausted | |
| Malformed structured response (schema-invalid) | Handled via the repair loop, not the retry loop [REPOSITORY FACT — `ResearchValidationError` path] | No, per §6 — repair-loop exhaustion should not silently switch providers without policy review | |
| Unsupported capability | N/A — should be caught at provider-selection/construction time (§11), not surfaced as a runtime failure | N/A | An [OPEN QUESTION] whether Phase 1 checks this at all |
| Content/filter rejection (refusal) | No [REPOSITORY FACT — `ResearchRefusedError` is terminal by design] | No, per §6 | Explicitly excluded from automatic fallback pending a separate policy decision |
| Transient network error | Yes, within budget [REPOSITORY FACT — default-retryable when no status code is present] | Yes, once budget exhausted | |
| Permanent provider error (non-recoverable, non-auth) | No | Case-by-case [OPEN QUESTION] | |

This section is design analysis only; the existing retry implementation
in `researcher.ts` is not modified by this document.

## 15. Security Model

- **Provider credential isolation**: each vendor's credential must be
  scoped to its own adapter's construction, following the existing
  pattern (`AnthropicModelOptions.apiKey`, explicitly passed in — never
  read from ambient environment inside the SDK, per `anthropicModel.ts`'s
  own doc comment) [REPOSITORY FACT]. A future multi-provider config
  layer must preserve this: Provider A's adapter must never receive
  Provider B's credential.
- **Secret storage**: today, credentials are validated at boot via
  `@acos/config`'s `loadEnv()` [REPOSITORY FACT] — the same pattern
  should extend to additional vendor keys; this document does not design
  a secrets-management system.
- **Logging**: not independently verified by this audit (no logging
  implementation was inspected for this document); stated as a
  requirement that provider credentials and raw request/response bodies
  must not appear in logs, for any future adapter.
- **Request/response redaction**: [OPEN QUESTION] — no redaction layer
  was found or is proposed here.
- **Provider-specific metadata in persistence**: confirmed today that no
  credential or raw SDK object reaches `LeadResearch`/`ResearchSignal`
  [REPOSITORY FACT, §2/§10] — only plain identity strings
  (`provider`, `model`, `providerMessageId`) reach the metering table.
  This must hold for every future adapter.
- **Tenant/user isolation**: unrelated to provider choice — existing
  ownership checks (`requireUser`, `ProspectRepository.getById`,
  referenced in `meteredResearch.ts`) already gate who can trigger
  research; provider selection scope (§4) would need to respect the same
  ownership boundary if made per-user or per-profile.
- **Secrets must never enter evidence, opportunity records, prompts
  stored as business evidence, or logs**: consistent with current
  behavior — `SYSTEM_PROMPT`/`buildUserMessage` (`prompt.ts`) never embed
  credentials, and evidence (`Evidence`/`Observation`) carries only
  quote/URL/label fields, never a credential.

No secret-management implementation is proposed here.

## 16. R-29 Metering Compatibility

R-29 metering is not modified by this document. Its existing shape
already accommodates multi-provider data without a contract change:
`ModelInvocationUsage`'s `provider`/`model` are free-form strings
[REPOSITORY FACT], the persisted table is keyed on `(provider,
providerMessageId)` rather than assuming one vendor
[REPOSITORY FACT — `pgRepository.ts`], and `onUsage` is a plain callback
typed only in terms of this package's own `ModelInvocationUsage`, decoupled
from any specific `ResearchModel` implementation
[REPOSITORY FACT — `anthropicResearchProvider.ts`'s own module note
explaining this decoupling exists specifically to avoid a package cycle
with `core-ai-usage`]. A future second/third `ResearchModel` adapter
would populate the same `ModelInvocationUsage` shape with its own
`provider`/`model`/`providerMessageId` values and require no change to
`core-ai-usage`, `AiUsageEventRepository`, or the metering call site in
`apps/worker/src/index.ts` beyond wiring the new model in. Owner/user
attribution is preserved because it already flows through the per-owner
`researchProvider` factory closure (§2), independent of which
`ResearchModel` that factory wraps.

## 17. Quality Comparison Framework

Future capability: run the same research task through more than one
provider and compare on the existing evidence contract, not on
vendor-reported quality claims. Candidate metrics — none ranked, no
winner declared:

- source attribution accuracy (does the cited quote actually appear in
  the cited source, per `verifyProvenance()` — already a hard gate, not
  a metric, today)
- evidence relevance
- evidence completeness (share of fields OBSERVED vs UNKNOWN — already
  computable today via `observedRatio()` in `schema.ts`, per-provider
  once more than one provider exists)
- false-positive rate
- qualification pass rate (post R-70/R-71/R-72)
- latency
- cost
- failure rate

Because `observedRatio()` and `verifyProvenance()` already exist and are
provider-neutral [REPOSITORY FACT], a controlled comparison could in
principle run the identical `ResearchProviderInput` through two
`ResearchModel`s and diff their `LeadResearch` outputs on these
dimensions without any new evidence-verification code — only the
harness to run both and record results would be new, and is not built by
this document.

## 18. Open Decisions

1. Provider selection scope — recommended starting point: per-user (§4),
   not finalized.
2. Model selection surface — recommended: provider+model as the
   primitive, strategy label optional on top (§5), not finalized.
3. Fallback chain design, including how duplicate research runs are
   prevented (§6) — not finalized.
4. Whether/when automatic routing is built, and on what signals (§7) —
   deferred, not finalized.
5. Which providers beyond Anthropic are built first among OpenAI/Gemini
   (§8) — not finalized; Grok/DeepSeek/Mistral/Cohere/Meta-open marked
   Requires Investigation / Future Candidate, not committed.
6. Telemetry fields marked OPEN DECISION in §9 (search ID, opportunity
   ID, estimated cost, latency, retry count, fallback count/flag).
7. Unsupported-capability behavior and capability-negotiation timing
   (§11).
8. Where the capability registry lives (§12) — leaning adapter metadata,
   not decided.
9. `attempt` and `fallback status` fields for provenance (§13).
10. Request/response redaction policy (§15).
11. Whether refusal-triggered fallback should ever be permitted under a
    separate, explicit policy (§6).

## 19. Recommended Future Architecture

```
                 ┌───────────────────────────────────────┐
                 │        Provider selection (future)     │
                 │  system default → per-user (Phase 2) →  │
                 │  per-profile/per-search (later, open)   │
                 └───────────────────┬─────────────────────┘
                                      │ chooses at construction time
                                      ▼
        ┌───────────┬───────────┬───────────┬───────────┬───────────┐
        │ Anthropic  │  OpenAI   │  Gemini   │  (future)  │  (future)  │
        │ ResearchModel│ResearchModel│ResearchModel│ResearchModel│ResearchModel│
        │ (exists)   │(candidate)│(candidate)│           │           │
        └─────┬──────┴─────┬─────┴─────┬─────┴─────┬─────┴─────┬─────┘
              │  ONLY layer allowed to know vendor SDK shapes    │
              └───────────────────────┬───────────────────────────┘
                                       ▼
                 researchLead() — SHARED, unmodified orchestration
                 (retry, repair, schema validation, provenance)
                                       ▼
                      ResearchProvider.research(input)
                                       ▼
                         Canonical LeadResearch
                                       ▼
                Evidence / R-70 / R-71 / R-72 / Qualification
                    (identical regardless of provider)
```

This is the same shape the repository already implements for one
provider (§2, §11); the recommendation is to generalize the vendor
adapter slot, not to redesign the layers above or below it.

## 20. Future Implementation Prerequisites

- Provider-selection scope decision (§4/§18.1) — must precede any
  factory/config change.
- Model-selection surface decision (§5/§18.2).
- Fallback-chain design, including duplicate-run prevention (§6/§18.3).
- Telemetry schema decisions for the OPEN DECISION fields in §9.
- Capability-registry location decision (§12/§18.8).
- Security review of credential/config handling for a second vendor
  credential (§15).
- A quality-comparison harness (§17) before any automatic-routing work
  (§7) begins.
- Per-provider adapter feasibility review (the OPEN QUESTIONs in §3) for
  each provider before it moves from Candidate/Future Candidate/Requires
  Investigation to an authorized implementation task.

## 21. Phase Boundary

This work does not expand Phase 24. Phase 24 remains limited to R-70,
R-71, and R-72, per
[PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md](./PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md),
unmodified by this document. The multi-provider capability analyzed here
is future scope. No implementation begins from this document.

## Requirement Numbering

Requirement ID: TBD — governance decision required.

No authoritative requirement-governance rule for assigning a new R-number
was found in the repository during this audit. No R-73 or later
identifier is assigned or consumed by this document.

## Authorization State

MULTI-MODEL RESEARCH PROVIDER — ARCHITECTURE DECISION RECORD:
PROPOSED — NOT AUTHORIZED FOR IMPLEMENTATION

Phase 24:
UNCHANGED

Phase 18–23:
CLOSED / FROZEN

No code changes:
YES
