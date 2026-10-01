# Multi-Model Research Provider — Technical Spike

## Status

SPIKE COMPLETE — IMPLEMENTATION NOT AUTHORIZED

This document closes the four blockers identified by
[the prior implementation-readiness audit](./MULTI_MODEL_RESEARCH_PROVIDER_DECISION_REVIEW.md)
(fallback composition design, OpenAI structured-output verification,
Gemini structured-output verification, R-29 `requestKind` migration
requirement) to the extent they are resolvable without calling a live
provider API or writing adapter code. It is design/spike analysis only.
No OpenAI/Gemini adapter, no fallback mechanism, no migration, and no
`ResearchProvider`/`ResearchModel`/`researchLead`/worker/config change is
implemented by this document. Baseline HEAD:
`b728425ac2a3fc306aaeba750ce609df31c07122`.

## 1. Executive Conclusion

The `ResearchModel` contract is confirmed sufficient, unmodified, for
both OpenAI and Gemini at the interface level — neither requires a
shared-contract change. Both spikes land at **CONDITIONAL PASS**: the
architecture fits, but real per-vendor JSON-Schema-dialect acceptance is
unverified without a live API call, which this task explicitly
prohibits. A new, concrete finding from this spike (not previously
flagged): the existing `jsonSchema.ts` generator, despite being
described as provider-neutral, already contains **two Anthropic-specific
accommodations** baked into its output (omitted integer bounds, omitted
array `maxItems`, and a `$defs`/`$ref` deduplication strategy built
specifically to work around a documented Anthropic parameter-count
limit) — see §4/§5. This does not block OpenAI/Gemini (Zod remains the
authoritative post-parse validator regardless), but it means the
generator's output is not proven to already be optimal or even directly
reusable, unmodified, for another vendor's structured-output dialect;
that determination is exactly what a live-API spike (out of scope here)
would need to confirm. The fallback architecture question is resolved:
**Option A, refined** (a new `ResearchProvider`-level composition that
fetches source documents once and reuses them across a chain of
`researchLead()` calls against different `ResearchModel`s) is the
correct target design — Options B, C, and D are rejected on structural
grounds. The R-29 migration requirement is confirmed and fully
specified. Provider selection remains architecturally unchanged.
**Technical readiness: READY FOR IMPLEMENTATION AUTHORIZATION** — the
remaining unknowns are execution details (a live-API spike per adapter)
that do not require further architectural design work to resolve.

## 2. Baseline

```
HEAD: b728425ac2a3fc306aaeba750ce609df31c07122 (confirmed, matches expected)
git status --short: pre-existing drift only (client-finder UI files,
  lockfile/build-artifact diffs, and the five requirement/*.md documents
  from this session's prior reviews) — no new or unexpected change.
git diff --check: clean.
git diff --name-only: apps/web/app/globals.css, apps/web/package.json,
  apps/web/tsconfig.tsbuildinfo, pnpm-lock.yaml, tests/package.json —
  all pre-existing.

Phase 18: CLOSED / FROZEN / UNMODIFIED
Phase 19: CLOSED / FROZEN / UNMODIFIED
Phase 20: CLOSED / FROZEN / UNMODIFIED
Phase 21: CLOSED / FROZEN / UNMODIFIED
Phase 22: CLOSED / FROZEN / UNMODIFIED
Phase 23: CLOSED / FROZEN / UNMODIFIED
Phase 24 Evidence/Relevance: UNCHANGED (scope-lock unmodified)
```

No unexpected tracked source changes were found.

## 3. Current Architecture

Restated, unchanged since the prior three documents this session:
`ResearchProvider.research(input) → LeadResearch`, composed from a
`SourceDocumentProvider` and a `ResearchModel`
(`{system, messages, signal} → ModelResult`), orchestrated by the
shared, provider-neutral `researchLead()` (retry/backoff, targeted
repair, `leadResearchSchema` validation, `verifyProvenance()`).
Anthropic is the only implementation (`anthropicModel.ts`, the sole
`@anthropic-ai/sdk` importer). R-29 (`packages/core-ai-usage`) persists
`ModelInvocationUsage` per real invocation, idempotent on `(provider,
provider_message_id)`, with `request_kind` constrained at the database
level (migration `0021_ai_usage_events`) and in TypeScript
(`AiUsageRequestKind`) to `'initial' | 'repair'`.

## 4. OpenAI Spike

**A. Schema compatibility.** `jsonSchema.ts` (read in full for this
spike) converts `leadResearchSchema` into standard JSON Schema
vocabulary: `type: 'object'` with `properties`/`required`/
`additionalProperties: false`; `type: 'array'` with `items` and
`minItems` (deliberately **omitting** `maxItems`); `type: 'string'` with
`minLength`/`maxLength`/`format: 'uri'`; `type: 'integer'` (deliberately
**omitting** `minimum`/`maximum`); enums as `{type: 'string', enum:
[...]}`; nullable fields as `{anyOf: [inner, {type: 'null'}]}`; and a
`$defs`/`$ref` mechanism used specifically to deduplicate
`observationSchema`, which recurs 9 times inside `leadResearchSchema`.
Every nested structure this task asked about is present: nested objects
(`Observation`, `recommendedService`), arrays (`visibleProblems` etc.,
≤8 items), nullable fields (`Observation.value`, `.basis`), the
`classification` enum (OBSERVED/INFERRED/UNKNOWN), the `recommendedService.service`
enum (`RECOMMENDED_SERVICES`, including `'NONE'`), and the evidence
array (`Observation.evidence`, ≤5 items of `{quote, sourceUrl,
sourceLabel}`). Every object emits `additionalProperties: false` and
lists **every** property (nullable or not) in `required` — nullability
is expressed via `anyOf`-with-`null`, never via omission from
`required`. This specific pattern (all properties required;
nullability expressed structurally) is the shape most commonly required
by "strict" JSON-Schema structured-output modes generally — a favorable
sign, though not proof, for compatibility with a similarly strict mode
on another vendor.

**Important, newly-identified finding:** two of the above omissions are
**not provider-neutral by accident — they are explicit Anthropic
accommodations already written into the code.** The `ZodNumber` case's
comment reads: "Anthropic structured outputs currently reject
minimum/maximum on integer schemas. Keep numeric bounds authoritative in
Zod post-response validation... rather than sending unsupported
keywords." The `ZodArray` case's comment reads: "Anthropic structured
outputs reject maxItems — Zod stays authoritative for the upper bound."
And the `$defs`/`$ref` deduplication mechanism exists specifically
because "Anthropic's structured-output compiler counts every inlined
nullable/union field separately... ('18 parameters with type arrays or
anyOf' against a 16-parameter limit)." **None of this is incorrect for
OpenAI** — Zod remains the authoritative validator after parsing
regardless of what the provider's schema enforces up front, so omitting
`minimum`/`maximum`/`maxItems` cannot produce an invalid `LeadResearch`
downstream. But it does mean `jsonSchema.ts`'s current output is tuned
to Anthropic's specific schema-compiler limits, not a
maximally-strict, vendor-neutral schema — whether OpenAI's structured-
output mode accepts, ignores, or needs different accommodations for
these same three items (numeric bounds, array bounds, `$ref`/`$defs`
support and any parameter-count limit of its own) is **UNVERIFIED —
requires a live-API check**, out of scope for this document.

**B. Request mapping.** The conceptual mapping —
`ResearchModel.system` → OpenAI's system-role instruction;
`ResearchModel.messages[]` → OpenAI's message array (role/content
already match OpenAI's `role: 'user'|'assistant'` shape directly, no
translation needed there); the JSON Schema document already produced by
`zodToJsonSchema()` → OpenAI's structured-output/JSON-schema request
parameter; model identifier/temperature/reasoning-effort-equivalent →
adapter-construction-time options, mirroring `AnthropicModelOptions`'s
existing pattern — is a request-envelope-only translation. **Confirmed:
this translation can remain entirely inside a hypothetical
`openAIModel.ts`, with zero change to `ResearchModel`, `researcher.ts`,
or `schema.ts`.** No `ResearchModel` field is unrepresentable in
OpenAI's request shape at the conceptual level.

**C. Response mapping.** `ModelResult`'s two cases (`{kind:'json', value}`
/ `{kind:'refusal', category}`) require: a successful, schema-conformant
response → `{kind:'json', value: <parsed JSON>}` (mirroring
`anthropicModel.ts`'s own `JSON.parse(text)`, "always parse, never
string-match" pattern); a safety-declined response → `{kind:'refusal',
category}`. **UNVERIFIED — SPIKE REQUIRED (live API):** the exact signal
OpenAI's API uses to indicate a safety refusal versus a normal
completion is not established in this repository and was not
independently verified by this document (no live call was made, per the
hard rule). Malformed or incomplete output (e.g., a truncated response
due to a length limit) has no dedicated `ModelResult` case today, and is
not invented by this document — per the Decision Review's own
resolution, this maps to the default behavior for anything that is not
an explicit refusal: return `{kind:'json', value: <whatever was
returned>}` and let `researchLead()`'s existing `leadResearchSchema`
parse failure / repair loop handle it exactly as it already handles any
other malformed output, regardless of provider. No special-casing is
required for this to work.

**D. Usage mapping.** `inputTokens`/`outputTokens` are required fields
of `ModelInvocationUsage` and are expected to be populated from
whatever token-count fields OpenAI's response reports (exact field
names UNVERIFIED without a live call, but the *existence* of prompt/
completion token counts in a chat-completions-style response is a
CURRENT EXTERNAL PROVIDER FACT stated generally, not a numeric claim).
`cacheCreationInputTokens`/`cacheReadInputTokens` are **already declared
nullable** in `ModelInvocationUsage` — confirmed sufficient: if OpenAI
does not report an equivalent cache breakdown, or reports it
differently, the adapter can populate `null` for either or both fields
without any type or schema change.

**E. Request ID.** `providerMessageId` requires a stable, per-response
identifier — `anthropicModel.ts` uses `response.id` directly (a plain
string extracted from the SDK response, never the response object
itself). A chat-completion-style API generally returns some form of
response/request identifier in its response envelope — UNVERIFIED
without a live call whether it is stable and suitable as the R-29
idempotency key, but no architectural obstacle exists; the field is
already typed as a plain `string`.

**F. Error classification.** `toProviderError()`'s existing
classification is purely HTTP-status-based (408/409/429/5xx retryable;
other 4xx not). This pattern is not Anthropic-specific in its logic —
only in the fact that it currently only classifies Anthropic SDK errors.
An OpenAI adapter would need to surface a `status`-bearing error (or
construct a `ResearchProviderError` directly) from whatever exception
shape OpenAI's SDK throws — a standard HTTP client library generally
carries a status code, making this pattern very likely portable, but
**UNVERIFIED — SPIKE REQUIRED** without inspecting OpenAI's actual SDK
error shape (not done here, per the hard rule against live/SDK
inspection this task did not authorize). Timeout, rate limit, temporary
outage, and authentication failure all map onto the same
retryable/non-retryable HTTP-status buckets already used for Anthropic.
Context-length failure and schema/output failure are handled exactly as
described in §4.C above (context-length: likely a 4xx, non-retryable,
fallback-eligible per the Decision Review's Decision 7; schema/output
failure: handled by the existing repair loop, not the retry loop, and
never fallback-eligible per Decision 6/§10 there).

```
OPENAI SPIKE:
CONDITIONAL PASS

ResearchModel contract:
Compatible — no change required

Structured output:
Compatible / Requires translation — request-envelope translation only,
  confirmed adapter-internal; whether jsonSchema.ts's exact output
  (including its Anthropic-specific bound omissions and $defs/$ref
  usage) is accepted as-is by OpenAI's structured-output mode is
  UNVERIFIED without a live call

Usage:
Compatible — cache fields already nullable; exact input/output token
  field names UNVERIFIED without a live call

Request ID:
Compatible — UNVERIFIED exact field name without a live call, no
  architectural obstacle

Error classification:
Compatible — HTTP-status-based pattern is portable in principle;
  OpenAI's actual SDK error shape UNVERIFIED without inspection

Adapter boundary:
Confirmed — all translation stays inside a hypothetical openAIModel.ts;
  zero change to ResearchModel/researcher.ts/schema.ts required

Implementation blockers:
None architectural. One execution blocker: a live-API structured-output
  acceptance check (explicitly out of scope for this document) must
  precede writing openAIModel.ts.
```

## 5. Gemini Spike

**A. System instruction mapping.** `ResearchModel.system: string` maps
conceptually to Gemini's dedicated system-instruction field. **Confirmed
translatable entirely inside a hypothetical `geminiModel.ts`** — no
`ResearchModel` contract change required merely because Gemini
structures this as a distinct top-level request field rather than a
first message, as flagged (without full verification) in the prior
requirement document.

**B. Message mapping.** `ResearchModel.messages: {role, content}[]`
(here always a single user message, since `researchLead()` only ever
sends one user turn per attempt, followed by an assistant/user pair only
during a repair round) maps conceptually to Gemini's `contents`/`parts`
array structure — a `{role, content: string}` entry becomes one
`content` object with one text `part`. **Confirmed translatable
entirely inside the adapter** — this is a structural reshaping of the
same information (role + text), not a semantic gap; no data
`ResearchModel` carries today is unrepresentable in Gemini's shape.

**C. Structured output.** Same schema (`leadResearchSchema` via
`zodToJsonSchema()`) as §4.A. Gemini's schema-constrained/JSON output
feature is a CURRENT EXTERNAL PROVIDER FACT (general capability,
non-numeric); whether it accepts the same JSON Schema dialect
`jsonSchema.ts` currently emits (same caveats as §4.A — the omitted
integer/array bounds and the `$defs`/`$ref` usage were tuned to
Anthropic's specific limits, not verified against Gemini's) is
**UNVERIFIED — SPIKE REQUIRED (live API)**.

**D. Refusal / safety blocking.** Gemini is generally known to surface
safety-blocked generations via a distinct response/candidate status
rather than as ordinary content (a CURRENT EXTERNAL PROVIDER FACT,
stated generally). Conceptually this maps to `ModelResult.kind =
'refusal'`, mirroring how `anthropicModel.ts` checks
`response.stop_reason === 'refusal'` before reading content. The exact
field/enum Gemini uses is **UNVERIFIED — SPIKE REQUIRED**, not
established from this repository and not checked live per the hard
rule.

**E. Usage.** Same mapping pattern as §4.D: `inputTokens`/`outputTokens`
required, cache fields already nullable and safe to leave `null` if
Gemini's response doesn't report an equivalent breakdown. Exact field
names UNVERIFIED without a live call.

**F. Request ID.** Same as §4.E — a stable per-response identifier is
expected to exist in some form; exact field UNVERIFIED without a live
call; no architectural obstacle, since `providerMessageId` is already a
plain string.

**G. Error classification.** Same HTTP-status-based pattern as §4.F,
same UNVERIFIED status pending inspection of Gemini's actual client
error shape (not performed here). Timeout/rate-limit/outage/auth-failure
map onto the same retryable/non-retryable buckets; context-length
failure and malformed/schema failure follow the same resolved policy as
§4.C/§4.F (fallback-eligible vs. handled by the existing repair loop,
respectively).

**H. Additional provider capabilities.** **Explicitly confirmed: web
search, grounding, multimodal input, and tool/function calling are NOT
required for the initial adapter.** `researchLead()`'s contract to
`ResearchModel` is exactly "text/JSON in, JSON-or-refusal out" — nothing
in `schema.ts`, `prompt.ts`, or `researcher.ts` requires or references
any of these capabilities. A Gemini adapter satisfying only this minimal
contract (text input → structured JSON → `ModelResult`) is sufficient;
any of Gemini's additional capabilities beyond that remain unused,
exactly as Anthropic's tool-calling and multimodal capabilities are
unused by `anthropicModel.ts` today.

```
GEMINI SPIKE:
CONDITIONAL PASS

ResearchModel contract:
Compatible — no change required

Structured output:
Compatible / Requires translation — request-envelope AND system-
  instruction/content-part translation confirmed adapter-internal;
  exact JSON-Schema-dialect acceptance UNVERIFIED without a live call

Usage:
Compatible — cache fields already nullable; exact field names
  UNVERIFIED without a live call

Request ID:
Compatible — UNVERIFIED exact field name without a live call, no
  architectural obstacle

Error classification:
Compatible — HTTP-status-based pattern portable in principle; Gemini's
  actual client error shape UNVERIFIED without inspection

Adapter boundary:
Confirmed — system-instruction and content-part translation, and all
  other vendor-specific shaping, stay inside a hypothetical
  geminiModel.ts; zero change to ResearchModel/researcher.ts/schema.ts

Implementation blockers:
None architectural. One execution blocker: a live-API structured-output
  and safety-block-signal acceptance check (out of scope here) must
  precede writing geminiModel.ts.
```

## 6. Fallback Architecture Analysis

Four options evaluated against the existing repository, per the task's
requirement:

**Option A — fallback wrapper around `ResearchProvider`** (the task's
suggested candidate, composing two opaque `ResearchProvider`s):
*Contract impact:* none — `ResearchProvider`'s `research(input) →
LeadResearch` signature is preserved; the wrapper is just another
implementation of the same interface, so the worker and `service.ts`
need no change beyond wiring the wrapper in place of a single provider.
*Retry semantics:* clean — each inner provider still runs its own full,
unmodified `researchLead()` cycle; the wrapper only decides whether to
proceed to the next inner provider after one fully terminates with a
fallback-eligible error. *Provenance:* unaffected — `verifyProvenance()`
still runs identically inside each inner `researchLead()` call.
*Persistence:* safe — `runResearch()`/`service.ts` calls
`provider.research()` exactly once and persists exactly once; the
wrapper returns exactly one `LeadResearch` regardless of how many inner
attempts occurred. *Metering:* unaffected at the interface level (each
inner attempt's `onUsage` still fires); needs the new `requestKind`
value from §7. *Idempotency:* preserved. *Duplicate source fetching:*
**the one real defect of Option A taken literally** — if the wrapper
composes two fully opaque `ResearchProvider`s (each of which internally
calls `SourceDocumentProvider.fetchSourceDocuments()`, as
`anthropicResearchProvider.ts` does today), a fallback attempt would
re-fetch the same source documents a second time, since
`ResearchProviderInput` carries no slot for already-fetched documents.
*Testability:* excellent — trivially unit-testable with
`testSupport.ts`'s existing `fakeResearchProvider()` pattern. *Provider
isolation:* excellent — inner providers are fully independent;
`researchLead()`'s per-call state (`priorValue`, `repairRoots`,
`messages`) is local to each call.

**Option B — fallback inside `researchLead()`:** *Contract impact:*
bad — `researchLead()` currently takes one `model: ResearchModel`
parameter; embedding fallback here would force it to accept a model
chain and to understand provider-identity/eligibility classification it
currently has no reason to know, conflating "retry this one model" with
"switch models" in one function. *Retry semantics:* entangled — mixes
the existing budget-based while-loop with a second, cross-provider
dimension inside the same loop. *Duplicate source fetching:* does not
even solve the problem — `researchLead()` never fetches source
documents (that happens one layer above, in the `ResearchProvider`
composition), so embedding fallback here still leaves the fetch-reuse
question unanswered. *Testability:* worse — couples two independent
behaviors into one function's test surface. **Rejected** — conflates
two distinct responsibilities inside orchestration code every prior
document in this session committed to keeping unmodified.

**Option C — fallback inside worker composition:** *Contract impact:*
forces `apps/worker` to know cross-provider fallback logic directly,
violating the existing package-boundary convention (`packages/core-research`
owns Research-domain logic; the worker only wires dependencies).
*Duplicate source fetching:* same unsolved problem as Option A taken
literally, with no compensating benefit. *Testability:* worse — a
worker-level test needs the full `SearchWorkerDeps` surface
(`worker.test.ts`'s existing heavier setup) rather than a minimal
fake-`ResearchProvider` unit test. **Rejected** — violates the existing
architectural boundary and offers no advantage over a properly-scoped
Option A.

**Option D — fallback inside a provider adapter:** *Contract impact:*
worst — this would require one vendor's adapter (e.g. `anthropicModel.ts`)
to directly import and call a different vendor's SDK, exactly the
anti-pattern the whole multi-provider architecture exists to prevent
(the Decision Record's own rule: a provider adapter is "the ONLY layer
allowed to import a vendor SDK type," scoped per vendor). *Provenance/
persistence:* structurally impossible to do correctly — an adapter has
no access to `SourceDocumentProvider` or `verifyProvenance()` (those
live one layer above `ResearchModel`), so it cannot construct a full,
provenance-checked fallback attempt at all, only a second raw model
call with no evidence verification. *Provider isolation:* worst — would
require one vendor's adapter code to hold another vendor's credential,
directly violating the security boundary already established ("one
provider must not gain access to another provider's credential").
**Rejected outright.**

**Selected architecture: Option A, refined.** Not a wrapper composing
two opaque `ResearchProvider`s, but a new composition function living
at the **same conceptual layer** `anthropicResearchProvider.ts` already
occupies — fetching source documents **once** via `SourceDocumentProvider`,
then trying `researchLead()` against `ResearchModel` #1, and only on a
fallback-eligible terminal error (per the Decision Review's §10 table),
retrying the **same already-fetched** `ResearchInput` through
`researchLead()` against `ResearchModel` #2. This function itself
satisfies the `ResearchProvider` interface (`research(input) →
Promise<LeadResearch>`), so it is a drop-in replacement for
`createAnthropicResearchProvider` at the worker's wiring point — no
`ResearchProvider` contract change, no `researchLead()` change, no
worker-composition leak, and no cross-vendor credential coupling. This
resolves Option A's one real defect (duplicate fetching) by construction
rather than by accepting the waste. No code implementing this is written
by this document — only the target shape.

## 7. Source-Document Fetching Implications

**Today:** source-document acquisition happens once, inside the
`ResearchProvider` composition (`anthropicResearchProvider.ts`'s
`research()` calls `deps.sourceDocuments.fetchSourceDocuments(...)`
before calling `researchLead()`) — `researchLead()` itself never fetches
anything; it only consumes an already-built `ResearchInput` (whose
`sourceDocuments` field is already populated).

**If a naive Option-A wrapper composed two opaque `ResearchProvider`s,**
`fetchSourceDocuments()` **would** execute again for the second,
fallback attempt — each inner provider is independently responsible for
its own fetch, and neither knows the other already fetched the same
documents.

**Preferred future behavior (design only, not implemented):** the
refined composition in §6 fetches source documents exactly **once** per
`ResearchProviderInput`, builds one `ResearchInput`, and reuses that same
value across every `researchLead()` call in the fallback chain —
`researchLead(model, researchInput, options)` already accepts
`researchInput` as a plain, reusable value; nothing about its signature
prevents calling it twice with two different `model` arguments and the
same `researchInput`. This is a design conclusion, not a code change:
whoever eventually builds the fallback composition function must build
it this way, not as a naive wrapper of two full `ResearchProvider`
instances. **Provenance guarantee preserved:** because the same fetched
source-document text is checked by `verifyProvenance()` against every
provider's output in the chain, no fallback attempt is checked against
different or staler evidence than the primary attempt.

## 8. R-29 Fallback Accounting Requirement

Confirmed and fully specified (no change made — this section documents
the exact future requirement only):

- **DB migration required:** YES. Migration `0021_ai_usage_events`
  defines `CONSTRAINT ai_usage_events_request_kind_check CHECK
  (request_kind IN ('initial', 'repair'))`. A future migration must
  alter this constraint (drop and recreate, or the project's established
  equivalent pattern) to admit a third value — this document proposes
  the value name `'fallback'`, consistent with the Decision Review's
  naming, but does not create the migration.
- **TypeScript union change required:** YES.
  `packages/core-ai-usage/src/types.ts`'s `AiUsageRequestKind = 'initial'
  | 'repair'` must widen to include `'fallback'`.
- **Repository/write-path changes required:** the value flows through
  as a plain parameter today — `toNewAiUsageEventInput(usage,
  requestKind)`, `recordEvent(...)`, and `pgRepository.ts`'s
  parameterized `INSERT` (its `COLUMNS`/values list already includes
  `request_kind` as a bound parameter, not a hardcoded literal) — none
  of these functions branch on the specific string value today, so
  **no logic change is anticipated beyond the type widening itself**;
  the write path is already generic over `AiUsageRequestKind`'s member
  values.
- **Tests required:** (a) a persistence round-trip test proving a
  `'fallback'`-kind event can be written and read back correctly; (b) an
  integration test against the actual migrated schema proving the new
  DB-level `CHECK` constraint accepts `'fallback'` (a unit test against
  a mocked repository cannot prove this — the constraint lives in the
  database, not in application code); (c) a regression test proving
  existing `'initial'`/`'repair'` behavior is unaffected by the widened
  constraint.
- **Backward compatibility:** fully additive. No existing row requires
  backfill or migration; the change only widens what future writes may
  contain. Every existing query, index, and idempotency guarantee
  (keyed on `(provider, provider_message_id)`, not on `request_kind`) is
  unaffected.

No migration is created by this document.

## 9. Provider-Selection Implications

Confirmed unchanged from the Decision Review: the architecture remains
`(userId) => ResearchProvider`, with provider/model selection resolved
**internally** to that factory (per-user stored preference → admin/
global configured default → hardcoded fallback), never as a change to
the factory's signature or to `ResearchProvider`'s own interface. Minimal
future configuration shape: a flat `{provider: string, model: string}`
pair — no marketplace, no nested settings object. **Confirmed:** any
future `OPENAI_API_KEY`/`GEMINI_API_KEY` entry in `packages/config/src/env.ts`
must be declared `.optional()` (following `OTEL_EXPORTER_OTLP_ENDPOINT`'s
existing precedent), not the `z.string().trim().min(1)` pattern every
other current secret uses — otherwise an Anthropic-only deployment would
fail to boot over an unused credential, directly contradicting this
capability's own stated goal. No selection mechanism is implemented by
this document.

## 10. Deferred Provider List

```
Grok           — DEFERRED — investigate only when explicitly selected
DeepSeek       — DEFERRED — investigate only when explicitly selected
Mistral        — DEFERRED — investigate only when explicitly selected
Cohere         — DEFERRED — investigate only when explicitly selected
Meta/open-model — DEFERRED — investigate only when explicitly selected
future providers — DEFERRED — investigate only when explicitly selected
```

No technical claim is made about any of these beyond what is already
established in prior documents this session (none of them have any
repository evidence — no SDK, no credential key, no adapter, no prior
investigation).

## 11. Remaining Blockers

1. **Live-API structured-output acceptance check, OpenAI** — SPIKE
   REQUIRED, not performed by this document (explicitly out of scope:
   "do not call real provider APIs"). Must precede writing
   `openAIModel.ts`.
2. **Live-API structured-output acceptance check, Gemini** — same
   status, same scope exclusion. Must precede writing `geminiModel.ts`,
   and additionally must confirm the system-instruction/content-part
   translation and safety-block signal shape.
3. **OpenAI/Gemini actual SDK error shape** — UNVERIFIED without
   inspecting each vendor's SDK (not installed, per the hard rule); the
   HTTP-status-based classification pattern is architecturally portable,
   but each adapter's exact `toProviderError()`-equivalent mapping
   cannot be finalized without this.
4. **Fallback composition function** — DESIGN RESOLVED (§6), NOT
   IMPLEMENTED. No further architectural decision is required; only
   writing the code remains, gated on at least one second adapter
   existing to fallback to.
5. **R-29 `requestKind` migration** — FULLY SPECIFIED (§8), NOT CREATED.
   No further design decision is required.
6. **Provider-credential `.optional()` discipline** — DECIDED (§9), not
   yet applied to `env.ts` (no change made, since no new credential key
   exists yet to apply it to).

None of these are open architectural questions any longer — each is
either a live-verification task (1–3) or fully-specified pending work
(4–6).

## 12. Exact Next Authorization Required

A human/roadmap owner must explicitly authorize, as a separately
approved implementation phase (not "Phase 25" by default — see the
Decision Review §15/Decision 10):

1. Performing the OpenAI and Gemini live-API structured-output spikes
   (§4/§5's remaining UNVERIFIED items) — the smallest possible
   next action, requiring real API credentials this document does not
   possess and was not authorized to obtain.
2. Building the first new adapter (`openAIModel.ts` or `geminiModel.ts`)
   once its spike passes.
3. Building the fallback composition function per §6's resolved design,
   once at least two adapters exist.
4. Creating the `request_kind` migration per §8's specification, before
   any fallback code is merged.
5. Adding the corresponding `.optional()` credential key(s) to
   `packages/config/src/env.ts` per §9, at the same time as the first
   new adapter.

No part of this list is performed by this document.

```
MULTI-MODEL TECHNICAL READINESS:
READY FOR IMPLEMENTATION AUTHORIZATION
```

This means the technical unknowns are sufficiently resolved for a human
to make an explicit implementation decision — it does not itself
authorize implementation, and no code, test, migration, or configuration
change accompanies this document.
