# Multi-Model Research Provider — Implementation Scope Proposal

## Status

PROPOSED — NOT AUTHORIZED FOR IMPLEMENTATION

This document converts
[MULTI_MODEL_RESEARCH_PROVIDER_DECISION_RECORD.md](./MULTI_MODEL_RESEARCH_PROVIDER_DECISION_RECORD.md)
into an implementation-ready proposal. It authorizes no code, test,
migration, worker, or config change. It does not modify
[MULTI_MODEL_RESEARCH_PROVIDER_REQUIREMENT.md](./MULTI_MODEL_RESEARCH_PROVIDER_REQUIREMENT.md),
[MULTI_MODEL_RESEARCH_PROVIDER_DECISION_RECORD.md](./MULTI_MODEL_RESEARCH_PROVIDER_DECISION_RECORD.md),
[PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md](./PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md),
or [MVP_SCOPE_BOUNDARY.md](./MVP_SCOPE_BOUNDARY.md). Baseline HEAD:
`b728425ac2a3fc306aaeba750ce609df31c07122`.

**Baseline audit performed for this document:** `git status --short`,
`git rev-parse HEAD`, and `git diff --check` were re-run before writing
this proposal. HEAD matches the expected baseline; the working tree shows
the same pre-existing, untracked client-finder-related files and
modified lockfile/build-artifact entries already present at the start of
this session (none touch Phase 18–24 files, `packages/core-research`,
`apps/worker`, or `packages/config`); `git diff --check` reported no
whitespace errors. No modification was made to any pre-existing change.
Phases 18–23 remain CLOSED/FROZEN and Phase 24 remains PROPOSED — NOT
APPROVED FOR IMPLEMENTATION, per
[PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md](./PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md)
§2, unmodified by this document.

**Note on scope precedence (per `MVP_SCOPE_BOUNDARY.md` §12.2):** the
capability this document scopes is not part of the current Client Finder
MVP release. `MVP_SCOPE_BOUNDARY.md` §7.2's readiness table shows
"Research execution" as `IMPLEMENTED LOGIC` but not yet `INTEGRATED`,
`TESTED`, or `PRODUCTION READY` at the MVP-journey level, and §6.5
excludes usage-based/subscription concerns from the current release. A
multi-model capability is therefore, at minimum, Post-MVP — its exact
placement is addressed in §17.

## 1. Executive Summary

The Decision Record established that the repository's existing
`ResearchProvider` boundary is already provider-neutral and that the
correct generalization is a three-layer split — vendor adapter (`ResearchModel`)
→ shared orchestration (`researchLead()`) → composition seam
(`ResearchProvider`) — rather than a runtime `if provider == ...` branch
anywhere in business logic. This proposal turns that architectural
conclusion into a concrete, sequenced, implementation-ready scope: what a
future engineering phase would build, in what order, against which
contracts, with which providers, under what test strategy, and — most
importantly — what it explicitly does not build. No engineering work
starts from this document; §20 states the gate that must be cleared
first.

## 2. Current Architecture

Re-derived directly from `packages/core-research/src`,
`apps/worker/src`, and `packages/config/src` (unchanged since the prior
audits in this session; restated here for a self-contained record):

```
ResearchProvider.research(input: ResearchProviderInput): Promise<LeadResearch>
        ↓ (composition — anthropicResearchProvider.ts)
researchLead() — SHARED orchestration (researcher.ts): retry/backoff,
  targeted repair, Zod schema validation (leadResearchSchema), provenance
  verification (verifyProvenance) — identical regardless of the model
  underneath
        ↓
ResearchModel — the vendor seam (researcher.ts's interface):
  (request: {system, messages, signal}) => Promise<ModelResult>
        ↓ (only implementation today)
createAnthropicResearchModel (anthropicModel.ts) — the ONLY file in the
  repository importing @anthropic-ai/sdk
```

- **`ResearchProvider` contract** (`provider.ts`): input
  `{prospectId, companyId, companyName, normalizedDomain}`; output a
  validated `LeadResearch`. Frozen shape, per `anthropicResearchProvider.ts`'s
  own doc comment ("the frozen ResearchProvider runtime method").
- **`ResearchModel` contract** (`researcher.ts`): a single `system`
  string, a `{role: 'user'|'assistant', content}[]` message array, an
  optional `AbortSignal`; returns `{kind:'json', value, usage?}` or
  `{kind:'refusal', category, usage?}`.
- **`LeadResearch` output contract** (`schema.ts`): every claim carries
  `classification` (OBSERVED/INFERRED/UNKNOWN), `value`, `evidence[]`,
  `basis`, `confidence` — cross-field Zod rules enforce what each
  classification requires or forbids.
- **Provenance behavior** (`provenance.ts`): every OBSERVED claim's
  quote/URL is re-verified as an exact (normalized) substring match
  against the actual supplied source-document text — never trusted from
  the model's self-report.
- **Retry/repair/validation behavior** (`researcher.ts`): provider
  errors retried with full-jitter backoff up to `maxAttempts`; schema or
  provenance failures trigger a targeted repair round (only the failing
  subtrees are re-sent); a refusal is terminal.
- **R-29 metering requirements**: `ModelInvocationUsage`
  (`provider: string`, `model: string`, `providerMessageId: string`,
  `inputTokens`, `outputTokens`, `cacheCreationInputTokens`,
  `cacheReadInputTokens`) fired via `ResearchOptions.onInvocation` for
  every real, billed model call (including refusals; never for a call
  that throws before producing a response). `@acos/core-ai-usage`
  persists this idempotently on `(provider, providerMessageId)`.
- **Worker DI / userId propagation** (`apps/worker/src/searchWorker/worker.ts`,
  `apps/worker/src/index.ts`): `SearchWorkerDeps.researchProvider` is
  `(userId: string) => ResearchProvider` — a per-owner factory, built
  because `ResearchProvider.research()` carries no `userId` but R-29
  metering needs one at invocation time; the worker resolves `userId`
  from the claimed Search row and passes it only into that factory.
- **Configuration/env handling** (`packages/config/src/env.ts`): only
  `ANTHROPIC_API_KEY` (plus the unrelated `GOOGLE_PLACES_API_KEY`) is
  declared and boot-validated; no provider-selector or second vendor
  credential key exists.
- **Current Anthropic adapter** (`anthropicResearchProvider.ts`):
  composes a `SourceDocumentProvider` (vendor-neutral HTTP fetch) and a
  `ResearchModel`; throws `InsufficientEvidenceError` when no usable
  source document is found.
- **Current Anthropic model implementation** (`anthropicModel.ts`):
  builds an Anthropic `messages.stream()` call with `thinking: adaptive`,
  `output_config.format: json_schema`, and a configurable `effort`
  level; extracts `ModelInvocationUsage` from `response.usage` and
  signals refusal via `response.stop_reason === 'refusal'`.

**Layers that MUST remain provider-neutral** (carried forward from the
Decision Record and restated as a hard constraint on this proposal):
`ResearchProvider`, `LeadResearch`/`schema.ts`, `provenance.ts`,
`researcher.ts`'s orchestration (retry/repair/validation), the R-29
persistence shape in `core-ai-usage`, and every downstream package
(`core-opportunity`, `core-qualification`, `core-personalization`). Only
`ResearchModel` implementations (one per vendor) may know a vendor's
SDK/response shape.

## 3. Problem / Capability Gap

The repository can today only ever produce research through one vendor.
Per the Decision Record: this creates vendor lock-in, single-provider
outage/rate-limit exposure, and no way to empirically compare research
quality or cost across models — while the architecture underneath
already permits a second implementation without changing anything
downstream. The gap is not architectural (the boundary already exists);
the gap is that **no second `ResearchModel` implementation, no
provider-selection mechanism, and no multi-vendor configuration/telemetry
exist yet.**

## 4. Goals

1. Preserve the existing `ResearchProvider`/`LeadResearch`/provenance
   contract exactly as-is — no weakening, no bypass.
2. Enable a second and third `ResearchModel` implementation (initially:
   OpenAI, Gemini — see §16) to be added without modifying
   `researcher.ts`, `schema.ts`, `provenance.ts`, or any downstream
   package.
3. Define, but not yet build, a provider/model selection mechanism
   consistent with the existing per-owner factory seam.
4. Define, but not yet build, a metering extension that keeps R-29
   provider-neutral as more vendors are added.
5. Define, but not yet build, a fallback policy that never bypasses
   R-70/R-71/R-72 and never fires on refusal or validation-failure
   grounds.
6. Produce acceptance criteria and a test strategy an eventual
   implementation phase can be held to.

## 5. Non-Goals

Explicitly excluded from this proposal and from the capability it
describes (identical to the Decision Record's §17/§21, restated as a
binding constraint here):

```
NO SEND
NO SCHEDULE
NO DELIVERY
NO AUTONOMOUS OUTREACH
NO CRM
NO PROPOSAL EXECUTION
NO PAYMENTS
NO SAAS BILLING / NEW BILLING SYSTEM
NO ENTITLEMENT SYSTEM CHANGES
NO META CAPI CHANGES
NO RECONCILIATION CHANGES
NO UI IMPLEMENTATION
NO DATABASE MIGRATION
NO WORKER MODIFICATION
NO PROVIDER IMPLEMENTATION (no OpenAI/Gemini/other adapter code)
NO AUTOMATIC QUALITY-BASED ROUTING (explicitly deferred, per Decision Record §7)
NO CHANGE TO PHASE 18–23 ARCHITECTURE
NO CHANGE TO PHASE 24 SCOPE
```

## 6. Provider Landscape

Classified per the Decision Record §3/§8, restated with the four
categories this task requests:

**A. Provider supported by architecture** (i.e., could in principle be
added without changing `researcher.ts`/`schema.ts`/downstream packages,
given a conforming `ResearchModel` adapter): all nine candidate
families below — this is a property of the boundary, not a commitment to
build any of them.

**B. Provider selected for initial implementation:** none — this
document proposes candidates (§16) but does not authorize building any
adapter. Selecting a provider for initial implementation is itself part
of the explicit authorization gate (§20).

**C. Provider requiring investigation:** xAI Grok, DeepSeek, Mistral,
Cohere — no adapter feasibility work has been done for these; their API
shapes, structured-output guarantees, and usage-telemetry fields are
unverified against `ResearchModel`'s contract.

**D. Future provider:** Meta/open-model ecosystem, OpenAI-compatible
endpoints, self-hosted/open-weight models, and any provider not named
above. These carry an additional architectural question (self-hosting
or third-party inference changes the auth/ops model, not just the
adapter) that is out of scope for this proposal.

No provider is ranked. Primary candidates (Anthropic, OpenAI, Gemini)
are primary only in the sense that Anthropic is already built and
OpenAI/Gemini are the two most-established alternative chat-completion
APIs the Decision Record already analyzed — not because they are
asserted to be technically superior.

## 7. Provider-Neutral Architecture

Unchanged from the Decision Record's recommended shape (§11 there),
restated as the binding target architecture for a future implementation
phase:

```
Provider selection (future — see §9)
        ↓ chooses, at construction time, which ResearchModel to build
┌────────────┬────────────┬────────────┬─────────────┬─────────────┐
│ Anthropic   │  OpenAI    │  Gemini    │ (Requires    │ (Future)    │
│ ResearchModel│ResearchModel│ResearchModel│ Investigation)│            │
│  (exists)   │ (candidate)│ (candidate)│              │             │
└──────┬──────┴─────┬──────┴─────┬──────┴──────┬───────┴──────┬──────┘
       │   ONLY layer allowed to import a vendor SDK type       │
       └─────────────────────────┬─────────────────────────────┘
                                  ▼
        researchLead() — SHARED, UNMODIFIED orchestration
        (retry, repair, schema validation, provenance verification)
                                  ▼
                 ResearchProvider.research(input)
                                  ▼
                      Canonical LeadResearch
                                  ▼
        Evidence / R-70 / R-71 / R-72 / Qualification
           (identical regardless of which adapter ran)
```

Downstream packages (`core-opportunity`, `core-qualification`,
`core-personalization`) are unaffected by construction — they consume
only `LeadResearch`/`ResearchSignal`, never `ResearchProvider` or any
vendor type, confirmed by direct inspection (§2 of the Decision Record,
re-verifiable at any time via `grep -rn "anthropic\|ResearchProvider" packages/core-opportunity/src
packages/core-qualification/src packages/core-personalization/src`,
which returns no matches today).

## 8. Provider Adapter Contract

**Is the existing `ResearchModel` interface sufficient?**
`{system: string, messages: {role,content}[], signal?} → Promise<{kind:'json'|'refusal', value|category, usage?}>`
is sufficient as a **minimum common contract** — every candidate provider
in §6 can, at minimum, accept a text/JSON prompt and return text/JSON, so
no provider is architecturally excluded by this shape. It is **not**
proven sufficient for every capability difference across vendors. Gaps,
stated without proposing an implementation:

| Gap | What's missing | Minimum contract change (not implemented) |
|---|---|---|
| System-instruction shape | Gemini's API is known generally to structure system instructions differently from a single string (per the prior requirement document's §4) — unverified in detail here | An adapter-internal translation, not necessarily a `ResearchModel` contract change — `ResearchModel`'s `system: string` can likely remain the shared shape, with translation happening inside the Gemini adapter itself. Flagged as OPEN QUESTION, not decided. |
| Model identifier / temperature / token-limit / effort-style parameters | `ResearchModel`'s call signature carries no per-call model/temperature/max-token/reasoning-effort parameters — these live today only in `AnthropicModelOptions`, outside the shared interface | None proposed — these are correctly adapter-construction-time options (as `AnthropicModelOptions` already demonstrates), not part of the per-call `ResearchModel` signature. No change needed unless a future requirement needs per-call overrides. |
| Finish-reason / stop-reason granularity | `ModelResult`'s `{kind:'json'|'refusal'}` only distinguishes success from safety refusal — it has no slot for a length-limit cutoff, a content-filter block distinct from a safety refusal, or a tool-call-required response | Possible future minimum change: a third `ModelResult` kind (e.g. `{kind:'incomplete', reason}`) — **not proposed for implementation here**, flagged as an OPEN QUESTION for the eventual adapter-design phase, since no adapter has yet hit this case in practice. |
| Usage/token accounting field names | `ModelInvocationUsage`'s fields (`inputTokens`, `outputTokens`, `cacheCreationInputTokens`, `cacheReadInputTokens`) are shaped after Anthropic's usage block; whether every candidate vendor reports an equivalent cache/token breakdown is unverified | None proposed — `cacheCreationInputTokens`/`cacheReadInputTokens` are already nullable, so an adapter for a vendor without cache accounting can already report `null` without a contract change. |
| Transient-error/rate-limit/auth-failure classification | `toProviderError()` classifies retryability from an HTTP `status` field already present on the thrown error — this pattern is vendor-agnostic as long as each adapter's SDK exposes (or is made to expose) an HTTP status on its errors | None proposed — each adapter is responsible for surfacing a `status`-bearing error or constructing a `ResearchProviderError` directly; no shared-interface change needed. |
| Structured-output / JSON-schema adherence | `jsonSchema.ts`'s hand-rolled Zod→JSON-Schema converter targets Anthropic's `output_config.format: json_schema` shape specifically; whether it, as-is, produces a schema every candidate vendor's structured-output feature accepts unmodified is unverified | Likely minimum change: each adapter calls its own vendor's structured-output/JSON-mode API with the same underlying JSON Schema document `jsonSchema.ts` already produces, translating only the request envelope — **not proposed for implementation here**, flagged as OPEN QUESTION pending per-vendor investigation. |

No contract change is implemented by this document. Every "minimum
contract change" cell above is a design note for whoever eventually
designs the second adapter, not an authorized change.

## 9. Provider + Model Selection

**Current seam:** `SearchWorkerDeps.researchProvider: (userId: string) =>
ResearchProvider`.

**Proposed evolution (design only, not implemented):** the factory
signature `(userId) => ResearchProvider` does not need to change shape —
what changes is what the factory does internally: instead of always
closing over the one boot-time-constructed Anthropic `ResearchModel`, it
would resolve a per-user (or system-default) provider+model+configuration
selection and construct (or select from a small pool of pre-constructed)
the matching `ResearchModel` before composing the `ResearchProvider`.
This keeps `ResearchProvider`'s frozen `research(input)` signature, the
worker's contract with it, and every downstream package completely
unchanged.

- **Per-user provider selection:** architecturally reachable today at
  this exact seam (Decision Record §4/§8) — the factory already receives
  `userId`. Not implemented.
- **Per-user model selection:** same seam, same reasoning — a stored
  preference would need `provider` and `model` (and any adapter-level
  option such as Anthropic's `effort`), matching `AnthropicModelOptions`'s
  existing shape.
- **Default provider/model:** a system-wide default (today: implicitly
  Anthropic + `'claude-opus-5'`, hardcoded as fallback defaults in
  `anthropicModel.ts`) remains necessary as the resolution fallback when
  no per-user (or future per-profile) selection exists.
- **Service-profile-specific selection:** OPEN — no existing link between
  `core-service-profile` and Research; would require new plumbing beyond
  the existing seam (Decision Record §4.D). Not proposed here.
- **Future strategy selection** (e.g. Fast/Balanced/Deep): a UI/product
  convenience that would resolve to a concrete provider+model pair
  internally — not a replacement for the provider+model primitive
  (Decision Record §5). Not proposed here.
- **Admin/global defaults:** a system operator's default provider/model,
  distinct from a per-user override — precedence order proposed
  (design only): **per-user selection, if set → admin/global default →
  hardcoded fallback (today's Anthropic default).** This precedence is a
  proposal for future review, not an authorized behavior.
- **Configuration precedence:** the same ordering above applies to
  configuration values (credentials, model IDs) — per-user stored
  preference overrides an admin-configured default, which overrides a
  hardcoded fallback; secrets themselves remain server-side regardless of
  which level set the preference (§13).

Automatic, quality-based routing is explicitly **not** proposed here —
deferred per the Decision Record §7 and restated in §5 above.

## 10. Fallback Policy

Per the Decision Record §6, restated as a concrete (not-implemented)
policy proposal:

**Fallback may occur only for:** provider-error-retry-budget-exhausted
transient failures — sustained rate-limiting, timeouts, or outages
classified retryable by the existing `toProviderError()` pattern but
which do not recover within `researchLead()`'s existing `maxAttempts`
budget; and authentication failures specific to one vendor's credential
(since a different vendor's credential is unaffected).

**Fallback must NOT occur for:**
- **Model refusal / policy refusal** (`ResearchRefusedError`) — a
  refusal reflects the request/content, not necessarily the vendor; a
  different vendor might refuse identically, and silently retrying a
  safety decline against a second vendor is a distinct policy question
  this proposal does not resolve, not a transport-failure case.
- **Invalid business reasoning** (a schema-valid but low-quality or
  unpersuasive result) — this is not a failure mode the current
  architecture detects or classifies at all; there is nothing to trigger
  fallback on.
- **Evidence validation failure** (provenance re-check fails after the
  repair loop) — indicates the source documents could not support the
  model's claims; a second vendor facing the same source documents has
  no architectural reason to fare better, and silently trying another
  vendor risks masking a genuine evidence-quality problem rather than
  surfacing it.
- **Schema validation failure** (`ResearchValidationError` after repair
  exhausted) — same reasoning as evidence validation failure.
- **Incorrect research / user-defined quality failures** — no such
  signal exists in the current architecture to trigger anything on.

**Why:** all four excluded categories are content/evidence-quality
outcomes, not transport outcomes. Fallback exists to route around a
vendor being unavailable, not to keep re-trying a research task against
different vendors until one produces an answer that passes — the latter
would let provider choice quietly determine which qualification outcomes
are possible, in tension with R-70/R-71/R-72's own gate being
independent of provider identity (Decision Record §10).

**Minimum information required to safely perform fallback** (design
only):
- Which failure category occurred (mapped to the taxonomy in §13),
  specifically whether it is fallback-eligible.
- How many attempts (and against which provider) have already been made
  for this `ResearchProviderInput`, to prevent an unbounded or duplicate
  fallback chain.
- The `userId`/owner context already available at the factory
  construction seam (§9), so a fallback attempt's `ModelInvocationUsage`
  can still be attributed correctly (§11).
- A configured fallback chain (or explicit absence of one) to know
  whether fallback is enabled at all for this user/deployment.

No fallback mechanism is implemented by this document.

## 11. Metering / R-29

R-29's existing shape (`ModelInvocationUsage`, `AiUsageEventRepository`,
keyed on `(provider, providerMessageId)`) is not modified. Per-invocation
metadata to capture, classified:

| Field | Classification | Basis |
|---|---|---|
| provider | REQUIRED | Already captured (`provider: string`) |
| model | REQUIRED | Already captured (`model: string`) |
| request ID | REQUIRED | Already captured (`providerMessageId`) — the idempotency key |
| input tokens | REQUIRED | Already captured |
| output tokens | REQUIRED | Already captured |
| total tokens | OPTIONAL | Derivable from input+output; no need to store separately |
| estimated cost | OPEN DECISION | Not computed today; would require a maintained provider/model pricing table — explicitly **not** a new billing system, purely an observability estimate attached to an existing usage row |
| request status (success/refusal/failure) | OPTIONAL | Implicitly true today for every persisted row (unbilled failures are never metered, per R-29 scope lock D7); an explicit status field is only needed if a refusal-but-billed row must be distinguished from a successful research row in reporting |
| retry count | OPEN DECISION | `requestKind: 'initial'|'repair'` already distinguishes repair rounds per row; a rolled-up per-`prospectId` attempt count is not stored today |
| fallback count / fallback attempt marker | OPEN DECISION | No fallback concept exists in the schema today — would need a new field or `requestKind` value once §10 is authorized |

This is explicitly research-provider observability/metering, extending
R-29's existing shape only. **No new billing system, no entitlement or
payment-system change, and no SaaS usage-based pricing mechanism is
proposed** — consistent with R-29's own PRD definition ("MVP: minimum
instrumentation... FUTURE: usage metering, quotas, usage-based pricing")
and with `MVP_SCOPE_BOUNDARY.md` §6.5's exclusion of SaaS
billing/quotas from the current release.

**Note on documentation drift (flagged, not resolved, per
`MVP_SCOPE_BOUNDARY.md` §12.3's own conflict-handling convention):** the
PRD V2.2 (line 919–920) states "`Status: NOT IMPLEMENTED`... no cost
record exists anywhere" for R-29. Direct repository inspection in this
session shows `packages/core-ai-usage` is fully implemented and wired
into the worker (`apps/worker/src/index.ts`'s `aiUsageEvents`/`onUsage`
closure). Per `MVP_SCOPE_BOUNDARY.md` §12.2/§12.3, the repository plus
its tests are the evidence and the PRD is the claim — this conflict
should be corrected in the PRD by whoever owns that document, not
silently resolved here.

## 12. Provenance

Provider selection must never weaken OBSERVED/INFERRED/UNKNOWN
semantics. This holds by construction under the architecture in §7,
because `schema.ts`'s cross-field Zod rules and `provenance.ts`'s
`verifyProvenance()` run inside the **shared** `researchLead()`
orchestration, not inside any given `ResearchModel` adapter — a future
OpenAI or Gemini adapter cannot relax what OBSERVED requires, because it
never sees or touches that validation step; it only supplies raw
`{kind:'json', value}` output that is checked identically to Anthropic's
today.

**Associating provider/model metadata with a research execution without
contaminating downstream domain contracts:** the correct association
point is the R-29 metering record (§11), not `LeadResearch` or
`ResearchSignal` — `ModelInvocationUsage` already carries `provider`/
`model`/`providerMessageId` as plain strings, joined to the research run
via `prospectId` and timestamp, entirely outside the evidence/provenance
domain objects. `LeadResearch`, `Observation`, and `StoredResearchSignal`
must continue to carry zero provider-identifying fields — confirmed
today (`mapping.ts`'s `toNewResearchSignals` reads only canonical
`Observation` fields). This separation is the mechanism, not a proposed
change: it already exists and must be preserved.

## 13. Failure Isolation

Provider-specific failure handling, extending §2's existing taxonomy
(`errors.ts`) without inventing new retry counts beyond what
`researcher.ts`'s existing `DEFAULTS` (`maxAttempts: 3`,
`baseDelayMs: 1_000`, `maxDelayMs: 30_000`) already define:

| Failure | Retryable | Fallback-eligible | Basis |
|---|---|---|---|
| Authentication error / invalid API key | NON-RETRYABLE | FALLBACK-ELIGIBLE | 401 not in `toProviderError`'s retryable set today; a different vendor's credential is unaffected |
| Rate limit | RETRYABLE (within existing budget) | FALLBACK-ELIGIBLE once budget exhausted | 429 already retryable today |
| Timeout | RETRYABLE (within existing budget) | FALLBACK-ELIGIBLE once budget exhausted | 408 already retryable today |
| Transient provider outage | RETRYABLE (within existing budget) | FALLBACK-ELIGIBLE once budget exhausted | 5xx already retryable today |
| Transient network error (no status code) | RETRYABLE (within existing budget) | FALLBACK-ELIGIBLE once budget exhausted | default-retryable today when no status is present |
| Malformed response / structured-output failure | Handled by the repair loop, not the retry loop | NON-FALLBACK-ELIGIBLE | Per §10 — a different vendor has no architectural reason to succeed where the repair loop already exhausted itself against the same source documents |
| Context-length failure | NON-RETRYABLE (would fail identically on retry) | NON-FALLBACK-ELIGIBLE, pending investigation | OPEN — no current adapter has hit this case; whether a different vendor's larger/smaller context window changes the calculus is an OPEN QUESTION, not assumed here |
| Provider refusal | NON-RETRYABLE (terminal by design) | NON-FALLBACK-ELIGIBLE | Per §10 |

No change to the existing retry implementation is proposed. This table
extends the taxonomy for future fallback-eligibility classification
only.

## 14. Security

Requirements for API keys in a multi-provider future, all consistent
with the existing Anthropic key's handling today (`anthropicModel.ts`'s
explicit-injection pattern, `env.ts`'s boot-time validation):

- Provider credentials must never enter `LeadResearch`, `ResearchSignal`,
  or any other domain object — confirmed true today (§2/§12); must
  remain true for every future adapter.
- Provider credentials must never enter a database row outside a
  dedicated, access-controlled credential/config store (not designed by
  this document).
- Provider credentials must never appear in logs — not independently
  verified by this audit (no logging implementation was inspected);
  stated as a requirement for any future adapter, exactly as the
  Decision Record §15 already flagged.
- Provider credentials must never be returned through any API response —
  a future per-user provider/model selection surface must expose only
  the selection (provider name, model id), never the credential value.
- Credentials remain server-side always — the existing pattern (`env`
  loaded once, passed explicitly into `createAnthropicResearchModel`,
  never read from ambient environment inside the SDK) is the template
  a future multi-vendor config layer should follow.
- User/provider configuration surfaces (§9) must not expose raw secrets
  — a stored per-user provider preference is a provider/model
  **selection**, not a place to store or display a credential.
- One provider's adapter must never receive another provider's
  credential — trivially true today (one credential exists); becomes a
  real constraint once a second credential is introduced, and each
  adapter's construction must be scoped to only its own credential.

No secret-storage mechanism is proposed or implemented by this document.

## 15. Testing Strategy

Provider-neutral, per the eight categories requested, none written here:

**A. Contract tests.** Every future `ResearchModel` implementation must
be exercisable against the same behavioral contract test suite that
exercises `researchLead()` today (already possible via `testSupport.ts`'s
pattern of injecting a fake — the equivalent for `ResearchModel` would be
a fake conforming to `{system, messages, signal} → ModelResult}` rather
than a fake `ResearchProvider`). Every `ResearchProvider` implementation
must independently satisfy `leadResearchSchema` + `verifyProvenance()`
for the same fixed inputs.

**B. Provider adapter tests.** Each vendor's SDK/API boundary is mocked
at the adapter level (matching `anthropicResearchProvider.test.ts`'s
existing convention of testing the adapter without a real network call).

**C. Structured-output tests**, per adapter: valid response, malformed
response, missing required fields, extra/unexpected fields, and full
schema violation — each must produce the same downstream behavior
(`researchLead()`'s repair loop, or terminal `ResearchValidationError`)
regardless of which adapter produced the malformed output.

**D. Failure tests**, per adapter, covering every row of §13's table:
timeout, rate limit, authentication failure, provider outage, refusal —
proving each classifies into the correct retryable/fallback-eligible
bucket for that adapter specifically (since the HTTP-status-based
classification in `toProviderError()` depends on each adapter correctly
surfacing a status).

**E. Fallback tests** (once §10 is authorized and implemented): proving
fallback fires only for the fallback-eligible categories in §13, and
never fires for refusal, schema-validation, or evidence-validation
failures — directly testing the exclusion list in §10.

**F. Provenance tests.** For a fixed set of source documents, feeding
different (fake) provider outputs through `researchLead()` must produce
identical accept/reject provenance outcomes — proving OBSERVED/INFERRED/
UNKNOWN semantics do not vary by provider identity, the core guarantee
of §12.

**G. Metering tests.** For each adapter, proving `ModelInvocationUsage`
is populated with correct `provider`/`model`/`providerMessageId` values
and that `core-ai-usage`'s existing idempotency-on-`(provider,
providerMessageId)` behavior holds across multiple vendors (i.e., a
collision on `providerMessageId` between two *different* providers must
not be treated as a duplicate — an existing edge case the composite key
already protects against, worth an explicit regression test once a
second provider exists).

**H. Isolation tests.** A given provider's failure (timeout, outage,
malformed response) must not corrupt or leak into another provider's
concurrently-running research, and must not corrupt the shared
orchestration state (`researchLead()`'s `priorValue`/`repairRoots`
tracking is local to one call — this should remain provably true once
more than one `ResearchModel` can be in flight for different
Prospects/owners at once, which the existing per-Search worker loop
already implies is possible today across different `userId` factory
instances).

No test is written by this document.

## 16. Initial Provider Proposal

Per the Decision Record §8, restated in the requested structure. **No
row below is an approved implementation — moving any provider from
"candidate" to "approved" requires the explicit authorization gate in
§20.**

**CURRENT:**

- **Anthropic** — existing, production (`anthropicModel.ts`,
  `anthropicResearchProvider.ts`). Adapter: built. SDK/API boundary:
  `@anthropic-ai/sdk`, isolated to one file. Structured-output
  compatibility: verified (`output_config.format: json_schema`,
  production-used). Usage/metering compatibility: verified
  (`response.usage` → `ModelInvocationUsage`, wired to R-29). Fallback
  compatibility: N/A (nothing to fall back from/to yet). Known open
  questions: none beyond what already exists in production.

**INITIAL CANDIDATES:**

- **OpenAI** — adapter required: yes, new (`openAIModel.ts`-equivalent,
  not existing). SDK/API boundary: OpenAI's own SDK, would need to be
  the only file importing it, mirroring `anthropicModel.ts`'s isolation
  pattern. Structured-output compatibility: [CURRENT EXTERNAL PROVIDER
  FACT, general] JSON-schema-constrained structured output is a known
  offered capability of this vendor family; exact request/response shape
  compatibility with `jsonSchema.ts`'s generated schema is unverified.
  Usage/metering compatibility: [OPEN QUESTION] whether reported
  usage/token fields map cleanly onto `ModelInvocationUsage` needs
  adapter-time verification. Fallback compatibility: architecturally
  compatible once built (a second `ResearchModel` satisfying the same
  interface). Known open questions: exact refusal/safety-signal shape
  differs from Anthropic's `stop_reason: 'refusal'`; needs its own
  `toProviderError`-equivalent HTTP-status mapping.
- **Gemini** — adapter required: yes, new. SDK/API boundary: Google's
  own SDK, isolated similarly. Structured-output compatibility:
  [CURRENT EXTERNAL PROVIDER FACT, general] schema-constrained/JSON
  output is a known offered capability; system-instruction and
  content-part structuring is known to differ structurally from a single
  system string (flagged already in the prior requirement document),
  requiring adapter-internal translation — not a `ResearchModel`
  contract change (§8). Usage/metering compatibility: [OPEN QUESTION].
  Fallback compatibility: architecturally compatible once built. Known
  open questions: exact request-shape translation approach; usage-field
  mapping; refusal-signal shape.

**REQUIRES INVESTIGATION:**

- **Grok (xAI)** — adapter required: unknown pending investigation.
  SDK/API boundary: unverified. Structured-output/usage/metering/fallback
  compatibility: [OPEN QUESTION] across the board. Known open questions:
  everything — no adapter feasibility work has been done.
- **DeepSeek** — same status as Grok; additionally carries an [OPEN
  QUESTION] on regional/compliance posture requiring its own review
  before any commercial use, per the Decision Record §3.
- **Mistral** — same status as Grok; offers both a hosted API and
  open-weight models, which is itself an [OPEN QUESTION] about which
  access path (if either) would be used.
- **Cohere** — same status as Grok; historically enterprise/RAG-oriented,
  fit for this specific research task is unverified.

**FUTURE:**

- **Meta/open-model ecosystem** — carries an additional architectural
  question beyond a simple adapter: self-hosting or third-party
  inference changes the auth/rate-limit/usage-accounting model entirely
  (Decision Record §3/§8). Not evaluated further here.
- **Additional future providers** — evaluated case by case against §8's
  capability contract when named; not enumerated here.

No compatibility claim above goes beyond what is either verified in this
repository or stated as a general, non-numeric, non-benchmarked
characteristic of a vendor's publicly known API family.

## 17. Phase Boundary

**This is not Phase 24.** `PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md`
§7 explicitly lists "NO RESEARCH PROVIDER CHANGE (Anthropic model/wiring
stays as-is)" as out-of-scope for Phase 24, and §1 states Phase 24's
primary boundary is "Evidence relevance and source-attribution gating
only... No... new provider... capability." This proposal does not
modify Phase 24's scope, and Phase 24's own numbering (R-70/R-71/R-72)
is not touched or reused.

**This is not automatically "Phase 25" either.** Per
`MVP_SCOPE_BOUNDARY.md` §11's roadmap, the current release is Phase 1
(Client Finder MVP), and Phase 24 (evidence relevance) is itself a
proposed addition to Phase 1's foundation, not yet part of the
`PHASE 2 / PHASE 3` roadmap `MVP_SCOPE_BOUNDARY.md` defines. A
multi-model research capability is, in `MVP_SCOPE_BOUNDARY.md`'s own
framing (§8's four questions: "Is it required for the Client Finder
MVP? Does the MVP fail without it?"), answerable **no, no** — the MVP's
single-provider Anthropic research already exists and is what the
MVP's exit criteria (§10 there) depend on; multi-provider support is not
required for MVP completion.

**Proposed placement (design decision, not authorized):** a distinct,
explicitly future capability, tentatively named **"Multi-Model Research
Provider"**, sequenced after the Client Finder MVP's exit criteria are
met (per `MVP_SCOPE_BOUNDARY.md` §11: "Phase 2 may begin only when the
Phase 1 exit criteria... are met") and after Phase 24 (if approved)
closes, since Phase 24 already claims the Research-adjacent boundary
(Qualification) this capability's downstream contract (§7's diagram) must
remain compatible with. This document does **not** renumber Phase 24,
does not claim a "Phase 25" slot, and does not insert itself into the
existing Phase 18–24 sequence — it proposes only a name for a future,
separately-numbered or unnumbered initiative, to be sequenced by whoever
owns the roadmap when it is actually authorized.

## 18. Acceptance Criteria

Behavioral and implementation-neutral, for a future authorized phase to
be held to — none are claimed to pass today:

A. A `LeadResearch` result can be produced by more than one
   `ResearchModel` implementation for the same `ResearchProviderInput`.
B. Every implementation's output independently satisfies
   `leadResearchSchema` and `verifyProvenance()` without any
   implementation-specific exception path.
C. Downstream Opportunity/Qualification/Personalization behavior is
   observably identical regardless of which provider produced the
   research that fed it.
D. R-70/R-71/R-72 (once Phase 24 exists) remain enforced identically
   regardless of provider identity.
E. A provider-specific failure (timeout, outage, auth failure) does not
   corrupt, block, or alter the outcome of research for a different
   provider or a different owner running concurrently.
F. A refusal or a validation/provenance failure never triggers automatic
   fallback to a different provider.
G. Every real, billed model invocation — regardless of provider —
   produces exactly one correctly-attributed `ModelInvocationUsage`
   record, with duplicates prevented by the existing
   `(provider, providerMessageId)` idempotency key.
H. No vendor SDK type, vendor-specific response object, or vendor
   credential is observable outside that vendor's own `ResearchModel`
   adapter file.
I. Provider credentials are never observable in a domain object,
   database row outside a dedicated credential store, log line, or API
   response.

## 19. Open Decisions

Consolidated from §8–§17 above (numbers are for this document's own
reference, not requirement IDs):

1. Provider+model selection precedence and storage mechanism (§9) — not
   finalized.
2. Service-profile-specific provider selection (§9) — not finalized, no
   existing plumbing.
3. Fallback chain trigger thresholds and duplicate-run prevention
   mechanism (§10) — not finalized.
4. Estimated-cost computation and its pricing-table maintenance (§11).
5. Retry-count and fallback-count telemetry field design (§11).
6. Whether a refusal should ever be eligible for a separately-reviewed,
   explicit (non-automatic) fallback policy (§10) — flagged, not
   resolved.
7. Context-length-failure retry/fallback classification (§13) — no
   adapter has hit this case yet.
8. Per-adapter structured-output/JSON-schema compatibility verification
   for OpenAI and Gemini specifically (§8/§16) — requires direct API
   investigation, not done in this document.
9. Feasibility investigation for Grok, DeepSeek, Mistral, Cohere (§6/§16)
   — not started.
10. Exact placement/sequencing of this capability relative to Phase 24
    and the MVP roadmap (§17) — proposed, not authorized.
11. Whether any of this eventually needs a formal requirement ID.

## 20. Explicit Authorization Gate

**Requirement ID:** TBD — governance decision required. No authoritative
requirement-governance rule for assigning a new R-number was found in
the repository during this or prior audits in this session. No R-73 or
later identifier is assigned or consumed by this document.

**No-Send Boundary — explicit proof:** this proposal only changes how
research is generated (which vendor's model produces `LeadResearch`). It
does not touch, wire, or enable:
- send / scheduling / delivery infrastructure (`core-outreach`'s actual
  send path remains unwired, per `MVP_SCOPE_BOUNDARY.md` §6.2/§8's own
  table — this proposal does not change that);
- autonomous outreach (no outreach-execution logic is touched — Outreach
  Preparation, Phase 22, remains frozen and out of scope, §2/§5);
- CRM (no `core-*` CRM-shaped tables are touched or migrated, per
  `MVP_SCOPE_BOUNDARY.md` §7.3's "do not migrate in this release" ruling
  on CRM-shaped tables, unaffected by this proposal);
- proposal execution (`core-proposal` is not referenced anywhere in this
  document's scoped work);
- payments / entitlements (`core-payments`, `core-entitlements` are not
  referenced or modified);
- CAPI (`core-capi` is not referenced or modified).

The entire proposed capability terminates at
`ResearchProvider.research(input): Promise<LeadResearch>` — the exact
boundary that already exists today and already sits upstream of every
send-adjacent package.

**Authorization state:**

```
MULTI-MODEL RESEARCH PROVIDER — SCOPE PROPOSAL:
PROPOSED — NOT AUTHORIZED FOR IMPLEMENTATION

A human must review and explicitly approve this scope before any
implementation begins. This document does not constitute that approval.

Phase 24:
UNCHANGED

Phase 18–23:
CLOSED / FROZEN

No code changes:
YES
```
