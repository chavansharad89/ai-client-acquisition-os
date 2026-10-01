# Multi-Model Research Provider — Decision Review

## Status

REVIEW COMPLETE — IMPLEMENTATION NOT AUTHORIZED

This document resolves the 11 open decisions recorded in
[MULTI_MODEL_RESEARCH_PROVIDER_SCOPE_PROPOSAL.md](./MULTI_MODEL_RESEARCH_PROVIDER_SCOPE_PROPOSAL.md)
§19, and confirms or refines the provider set, contract, telemetry,
fallback, security, and testing positions taken there and in
[MULTI_MODEL_RESEARCH_PROVIDER_DECISION_RECORD.md](./MULTI_MODEL_RESEARCH_PROVIDER_DECISION_RECORD.md).
It is architecture/scope review only. It authorizes no code, test,
migration, worker, or config change; it does not modify any of the four
source documents above, [PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md](./PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md),
or [MVP_SCOPE_BOUNDARY.md](./MVP_SCOPE_BOUNDARY.md); and it does not
create or authorize a "Phase 25."

## 1. Executive Decision Summary

All 11 open decisions from the scope proposal are resolved below with a
concrete recommendation each. None requires a new persisted schema,
migration, or code change to *decide* — they are architectural and
policy choices that a future implementation phase would be bound by.
Two of the eleven (fallback trigger design and OpenAI/Gemini
structured-output verification) are true implementation blockers: they
must be settled or investigated before, respectively, fallback code or a
specific new adapter is written. The other nine are non-blocking:
either they are fully resolved here (e.g., refusal is never
fallback-eligible, no requirement ID is assigned, service-profile
selection is deferred), or they are explicitly scoped out of the initial
implementation (e.g., cost estimation, Grok/DeepSeek/Mistral/Cohere
investigation). The existing `ResearchProvider`/`ResearchModel`/
`LeadResearch` contract is confirmed **sufficient as-is** — no contract
change is required to add a second or third provider.

## 2. Baseline

```
HEAD: b728425ac2a3fc306aaeba750ce609df31c07122 (confirmed, matches expected)
git status --short: pre-existing working-tree drift only (client-finder
  UI files, lockfile/build-artifact diffs) — identical to the state
  recorded at the start of this session's prior reviews; no new drift.
git diff --check: clean (no whitespace errors)
git diff --name-only: apps/web/app/globals.css, apps/web/package.json,
  apps/web/tsconfig.tsbuildinfo, pnpm-lock.yaml, tests/package.json —
  all pre-existing, none touched by this or any prior document this
  session.

Phase 18–23: CLOSED / FROZEN (unmodified)
Phase 24: PROPOSED — NOT APPROVED FOR IMPLEMENTATION (unmodified)
```

No unexpected changes were found. Nothing was cleaned, reset, or
modified.

## 3. Current Architecture

Restated, unchanged from the prior two documents this session (re-derived
from `packages/core-research/src`, `apps/worker/src`,
`packages/config/src/env.ts`):

```
ResearchProvider.research(input) → LeadResearch
        ↓ composition (anthropicResearchProvider.ts)
researchLead() — SHARED orchestration (researcher.ts): retry/backoff,
  targeted repair, schema validation, provenance verification
        ↓
ResearchModel — vendor seam: {system, messages, signal} → ModelResult
        ↓ only implementation today
createAnthropicResearchModel (anthropicModel.ts) — the only file
  importing @anthropic-ai/sdk
```

Worker DI: `SearchWorkerDeps.researchProvider: (userId) => ResearchProvider`,
built once at boot in `apps/worker/src/index.ts` from one
`ANTHROPIC_API_KEY`-backed `ResearchModel`. Downstream packages
(`core-opportunity`, `core-qualification`, `core-personalization`)
import none of `ResearchProvider`, `LeadResearch`, or any vendor symbol.
R-29 metering (`packages/core-ai-usage`) persists `ModelInvocationUsage`
(`provider: string`, `model: string`, `providerMessageId`, `inputTokens`,
`outputTokens`, cache fields) idempotently on `(provider,
providerMessageId)`.

## 4. Decision-by-Decision Resolution

### Decision 1 — Provider+model selection precedence and storage mechanism

**DECISION:** How should a provider+model choice be resolved and stored
across system default, admin/global, and per-user layers?

**EVIDENCE:** `SearchWorkerDeps.researchProvider: (userId: string) =>
ResearchProvider` already receives `userId` at construction time
(`worker.ts`); nothing today branches on it. `AnthropicModelOptions`
already separates construction-time vendor options (`model`, `effort`)
from the per-call `ResearchModel` signature. No persisted per-user
preference table exists anywhere in the schema.

**RECOMMENDATION:** A three-level precedence chain, resolved once per
factory construction: **(1) per-user stored preference, if set → (2)
admin/global configured default (an env-level `RESEARCH_PROVIDER`/
`RESEARCH_MODEL` pair, following `ANTHROPIC_API_KEY`'s existing
boot-validated pattern) → (3) hardcoded fallback** (today's actual
default: Anthropic + `'claude-opus-5'`). Storage for level 1 is a
single flat `{provider, model}` preference scoped to the user — not a
generalized settings object, and not a provider marketplace.

**RATIONALE:** This is the minimum precedence chain that satisfies both
"system keeps working with zero configuration" (level 3) and "an
operator can change the fleet default without a code change" (level 2)
and "a user can override it" (level 1), without inventing a fourth axis
this repository has no evidence for (e.g., per-request override).

**RISK:** A flat preference is easy to reason about but does not extend
cleanly to a future "strategy" concept (Fast/Balanced/Deep) without a
second resolution step layered on top — acceptable, since the Decision
Record already treats a strategy label as a UI convenience that resolves
to this same `{provider, model}` pair, not a replacement for it.

**IMPLEMENTATION BLOCKER: NO** — the precedence order is fully decided;
building level 1 (persistence) is deferred work, not a blocker to
shipping levels 2/3 (system-wide/admin default) with a second adapter.

### Decision 2 — Service-profile-specific provider selection

**DECISION:** Should provider/model selection vary by service profile?

**EVIDENCE:** No existing field, join, or code path connects
`packages/core-service-profile` to `ResearchProviderInput` or the
research factory. `ResearchProviderInput` carries only
`prospectId`/`companyId`/`companyName`/`normalizedDomain`.

**RECOMMENDATION:** Defer entirely from the initial implementation.
Do not thread a service-profile identifier into research construction
now.

**RATIONALE:** No repository evidence or product requirement establishes
that any service category needs a different provider/model. Adding this
coupling speculatively would violate the same principle
`MVP_SCOPE_BOUNDARY.md` §8 applies to existing-but-unintegrated code:
existing plumbing is not itself justification for connecting it.

**RISK:** If a real need emerges later, threading a service-profile id
through `ResearchProviderInput` and the worker's construction path is a
moderate, contained change (adds one field, one more precedence level) —
low risk to defer.

**IMPLEMENTATION BLOCKER: NO.**

### Decision 3 — Fallback chain trigger thresholds and duplicate-run prevention

**DECISION:** At what point does fallback trigger, and how is a
duplicate persisted research run avoided?

**EVIDENCE:** `researcher.ts`'s existing `DEFAULTS` (`maxAttempts: 3`,
`baseDelayMs: 1_000`, `maxDelayMs: 30_000`) already define the
provider-error retry budget; `researchLead()` runs once per
`ResearchProviderInput` inside one `ResearchProvider.research()` call;
`runResearch()`/`service.ts` persists `ResearchSignal` rows exactly once
per completed run (append-only, supersede-then-insert).

**RECOMMENDATION:** Fallback triggers **only after** the primary
provider's `researchLead()` call exhausts its existing `maxAttempts`
budget with a fallback-eligible terminal error (per §10 below) — no new
retry-count threshold is invented; the existing budget is reused as-is.
Duplicate-run prevention: fallback must be implemented as a composition
wrapper **above** `ResearchProvider` (a conceptual
`FallbackResearchProvider` that itself satisfies the `ResearchProvider`
interface, composing two or more inner `ResearchProvider`s) — it must
call the next provider's *entire* `researchLead()` cycle only when the
prior one's cycle has already thrown a fallback-eligible error, and must
return exactly one `LeadResearch` to its caller, so `runResearch()`
persists exactly once regardless of how many providers were tried
internally.

**RATIONALE:** Reusing the existing retry budget avoids inventing a
second, uncoordinated threshold; wrapping at the `ResearchProvider`
level (not inside `researchLead()` itself, and not at the `service.ts`
persistence layer) keeps `researchLead()`'s orchestration completely
unmodified and keeps persistence single-write, matching the existing
append-only guarantee.

**RISK:** A naive implementation could re-invoke
`SourceDocumentProvider.fetchSourceDocuments()` once per provider
attempt — wasteful but not unsafe (fetching is idempotent); flagged as
an efficiency concern for whoever designs the wrapper (fetch once,
reuse across inner attempts), not a correctness risk.

**IMPLEMENTATION BLOCKER: YES** — this composition point must be
designed before any fallback code is written. It does **not** block
adding a second `ResearchModel` adapter or per-user selection (Decisions
1–2), which have no dependency on fallback existing.

### Decision 4 — Estimated-cost computation and pricing-table maintenance

**DECISION:** Should the telemetry layer compute and store estimated
cost per invocation?

**EVIDENCE:** `ModelInvocationUsage` has no cost field today. PRD V2.2's
R-29 definition explicitly separates MVP "minimum instrumentation" from
FUTURE "usage metering, quotas, usage-based pricing." `MVP_SCOPE_BOUNDARY.md`
§6.5 excludes usage-based billing from the current release.

**RECOMMENDATION:** No — do not build cost estimation or a pricing table
in this capability. Capture only raw `inputTokens`/`outputTokens` per
invocation (already required, §10 below); leave cost computation to an
offline/downstream join against a pricing table maintained outside this
codebase, if and when needed.

**RATIONALE:** A maintained per-vendor pricing table is an ongoing
operational commitment adjacent to billing, explicitly excluded by this
capability's own non-goals ("NO SAAS BILLING / NEW BILLING SYSTEM") and
by R-29's own MVP/FUTURE split.

**RISK:** Provider cost comparison (a stated future goal in the Decision
Record §12) requires this join to happen somewhere eventually — accepted
as out of scope for the initial implementation, consistent with that
capability also being marked future.

**IMPLEMENTATION BLOCKER: NO.**

### Decision 5 — Retry-count and fallback-count telemetry field design

**DECISION:** How should retry/fallback attempts be represented in R-29
telemetry?

**EVIDENCE:** `requestKind: 'initial' | 'repair'` already distinguishes
repair rounds per persisted row; the table is already one-row-per-real-
invocation, not a rolled-up counter.

**RECOMMENDATION:** Extend the `requestKind` value set with a third
value (e.g. `'fallback'`), fired for any invocation originating from a
non-primary provider in a fallback chain — preserving the existing
one-row-per-invocation model rather than adding a separate aggregate
counter column. A rolled-up "total attempts for this prospect" figure,
if ever needed, is derived by counting/grouping existing rows by
`prospectId`, not stored redundantly.

**RATIONALE:** Consistent with R-29's existing design principle (every
real, billed call gets its own row; nothing is pre-aggregated at write
time) — extending the existing enum is the smallest change that
preserves this.

**RISK:** Implementing this requires widening whatever check
constraint/type currently enforces `requestKind`'s two values — a
migration, not decided or performed here; flagged as implementation
work.

**IMPLEMENTATION BLOCKER: NO** for the base capability; this specific
field only matters once fallback (Decision 3) is being implemented, at
which point it becomes a prerequisite for that slice specifically.

### Decision 6 — Should refusal ever be eligible for a separately-reviewed, non-automatic fallback?

**DECISION:** Is there any circumstance under which a provider refusal
should permit fallback to a different vendor?

**EVIDENCE:** `researcher.ts`'s own design commentary: "Terminal by
design. Retrying a safety decline is futile... rude to the safety
system." `ResearchRefusedError` is already thrown unconditionally on
refusal, with no retry path of any kind today.

**RECOMMENDATION:** **No.** Refusal must never trigger fallback —
automatic or manually-configured. If a legitimate future need exists to
re-run research against a different vendor after a refusal, that must be
a distinct, explicit, human-initiated action (e.g., an operator manually
re-triggering research with a different provider selected for that
user), never a system-automatic behavior embedded in the orchestration
or a configured fallback chain.

**RATIONALE:** This directly extends the existing code's own stated
principle from single-vendor retry to cross-vendor fallback — the
reasoning ("retrying a safety decline is futile and rude to the safety
system") does not change just because the retry target is a different
vendor. Treating this as automatic-fallback-eligible would make provider
choice a way to route around one vendor's safety judgment, which is a
policy decision far outside this capability's stated scope.

**RISK:** None significant — this is the conservative, safety-preserving
choice, and it fully closes what the scope proposal left open.

**IMPLEMENTATION BLOCKER: NO** — this decision is fully resolved; no
further review is needed before implementing the refusal-exclusion rule.

### Decision 7 — Context-length-failure retry/fallback classification

**DECISION:** Is a context-length failure retryable and/or
fallback-eligible?

**EVIDENCE:** No adapter has produced this failure mode in the
repository yet. `toProviderError()`'s existing classification is purely
HTTP-status-based (`408/409/429/5xx` retryable; other 4xx, including the
typical status class for an oversized-input rejection, not retryable).

**RECOMMENDATION:** **NON-RETRYABLE** (identical to the existing
400-class handling — resending the same oversized input to the same
model fails identically) but **FALLBACK-ELIGIBLE**, distinct from
refusal/validation failures. Until an adapter can distinguish this case
specifically, it safely falls through to the default non-retryable,
non-fallback-eligible behavior for an unrecognized 4xx — this
recommendation applies once an adapter *does* surface a
context-length-specific signal.

**RATIONALE:** A context-length failure is a genuine **capability**
limit (this model's window is too small for this input), not a content-
or evidence-quality judgment — the same distinction already used to
exclude refusal and validation failures from fallback (§10) argues for
*including* this one, since a different vendor's model may have a larger
window and could genuinely succeed where the first could not.

**RISK:** Requires each adapter to reliably distinguish a
context-length-specific error from a generic bad-request error — not yet
verified for any candidate vendor; until it is, the safe default
(treated as an opaque, non-fallback-eligible 4xx) applies, so there is no
correctness risk from leaving this unimplemented.

**IMPLEMENTATION BLOCKER: NO** — the classification is decided; the only
blocker is per-adapter error-signal fidelity, which is normal adapter
implementation work, not an open architectural question.

### Decision 8 — Per-adapter structured-output/JSON-schema compatibility verification (OpenAI, Gemini)

**DECISION:** Can the existing hand-rolled JSON Schema
(`jsonSchema.ts`'s output) be handed to OpenAI's and Gemini's structured-
output features with only request-envelope translation, or does each
need its own schema-generation path?

**EVIDENCE:** `jsonSchema.ts` is a minimal, hand-rolled Zod→JSON-Schema
converter explicitly built to satisfy Anthropic's
`output_config.format: json_schema` shape (module comment: "covers
exactly what schema.ts uses"). No verification against OpenAI's or
Gemini's structured-output APIs exists in this repository.

**RECOMMENDATION:** This cannot be resolved from repository evidence
alone — it requires an external/provider-specific investigation.
Recommend it be the **first task** of each specific adapter's
implementation (a short spike, not a full adapter build): confirm
whether the same JSON Schema document already produced by `jsonSchema.ts`
is accepted, unmodified, by that vendor's structured-output/JSON-mode
feature, or whether `jsonSchema.ts` itself needs a provider-parameterized
output mode.

**RATIONALE:** This determines whether §7's assumption ("the adapter
only translates the request envelope, not the schema") holds for each
vendor. If it does not hold for a given vendor, the true scope of that
one adapter is larger than the scope proposal estimated, and that must
be known before committing to a timeline for that specific provider —
it should not be discovered mid-implementation.

**RISK:** If either vendor's structured-output feature requires a
materially different schema shape (e.g., different `$ref`/`$defs`
handling, unsupported `nullable` union patterns), `jsonSchema.ts` may
need to become provider-parameterized — a larger, currently unscoped
change that would itself need its own review before proceeding.

**IMPLEMENTATION BLOCKER: YES**, but scoped to each specific adapter —
OpenAI/Gemini adapter implementation should not begin without this
spike for that vendor. It does not block Anthropic-only continued
operation or any of Decisions 1–7 above, all of which are provider-count-
and provider-identity-independent.

### Decision 9 — Feasibility investigation for Grok, DeepSeek, Mistral, Cohere

**DECISION:** Should investigation work for these four providers be
scheduled as part of this capability's initial implementation?

**EVIDENCE:** No investigation exists for any of the four. The
requirement document's own mission statement: "Do not assume every
provider must be supported immediately."

**RECOMMENDATION:** No — do not schedule investigation for these four now.
Trigger investigation for any one of them only on an explicit product or
business reason (a customer requirement, a cost/availability need,
regulatory/regional requirement), not proactively.

**RATIONALE:** OpenAI + Gemini already prove the multi-provider
architecture (two independent adapters beyond Anthropic is sufficient to
validate the boundary genuinely generalizes); nothing about the
requirement's original motivation (avoid single-vendor lock-in, enable
comparison) requires more than that to be satisfied initially. Since the
architecture (§7 below) is provider-count-agnostic, deferring these four
loses nothing structurally.

**RISK:** Minimal. If one of these becomes needed later, its adapter
follows the identical pattern already established by whichever of
OpenAI/Gemini is built first — no rework of the shared layers.

**IMPLEMENTATION BLOCKER: NO.**

### Decision 10 — Exact placement/sequencing relative to Phase 24 and the MVP roadmap

**DECISION:** Where does this capability sit in the repository's phase
sequence?

**EVIDENCE:** `MVP_SCOPE_BOUNDARY.md` §11's roadmap (Phase 1 MVP → Phase
2 Acquisition workflow → Phase 3 Proposal/CRM → Phase 4 AI Acquisition OS
→ Phase 5 SaaS) does not mention multi-provider research anywhere.
`PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md` §7 explicitly excludes "NO
RESEARCH PROVIDER CHANGE (Anthropic model/wiring stays as-is)" from
Phase 24. `MVP_SCOPE_BOUNDARY.md` §8's four-question test, applied here
("Is it required for the Client Finder MVP? Does the MVP fail without
it?"), answers no/no — the MVP's existing single-provider research
already satisfies its exit criteria (§10 there).

**RECOMMENDATION:** Sequence this as a distinct, explicitly-named,
cross-cutting infrastructure capability — **not** inserted into the
numbered Phase 18–24 sequence, and **not** reflexively labeled "Phase
25." Keep the working name "Multi-Model Research Provider." Gate its
start behind two conditions: (a) the Client Finder MVP's exit criteria
(`MVP_SCOPE_BOUNDARY.md` §10) are met, and (b) Phase 24, if approved,
has closed — because Phase 24 explicitly reserves the research-provider
boundary as unchanged while it is in flight, and this capability's
downstream contract must remain compatible with whatever Phase 24
ultimately does at the Qualification boundary. Whether it is later
assigned a "Phase 25" number is a roadmap-ownership decision outside
this review's authority.

**RATIONALE:** Matches the repository's own governance pattern (phase
numbering is a deliberate, explicit act — `MVP_SCOPE_BOUNDARY.md` §8/§11
— not something inferred from finished code or convenient timing), and
avoids exactly the scope-creep pattern that document warns against.

**RISK:** Leaving this unnumbered risks it being deprioritized
indefinitely; mitigated by this document and the scope proposal serving
as the durable record until a roadmap owner formally schedules it.

**IMPLEMENTATION BLOCKER: NO** for the technical/architectural decisions
in this review — sequencing affects *when* engineering work is
authorized to start, not the content of the architecture itself, and no
implementation is authorized by this document regardless.

### Decision 11 — Whether a formal requirement ID is needed

**DECISION:** Should this capability be assigned an R-ID (e.g. R-73)?

**EVIDENCE:** No authoritative requirement-numbering governance rule was
found in the repository across three separate audits this session
(architecture audit, decision record, scope proposal). The highest
requirement ID in active use is R-72 (Phase 24, itself still PROPOSED,
not approved).

**RECOMMENDATION:** Do not assign an R-ID. Record: **"Requirement ID:
TBD — governance decision required."**

**RATIONALE:** No numbering authority or process has been established in
evidence; assigning a number now would presume a governance process that
does not exist, and risks colliding with whatever number Phase 24 or a
future phase eventually consumes.

**RISK:** None from deferring.

**IMPLEMENTATION BLOCKER: NO.**

## 5. Provider Classification

| Provider | Classification | Evidence |
|---|---|---|
| Anthropic | CURRENT | Production-integrated today (`anthropicModel.ts`, `anthropicResearchProvider.ts`, wired in `apps/worker/src/index.ts`) |
| OpenAI | INITIAL IMPLEMENTATION (candidate — not yet built; adapter feasibility spike is Decision 8's blocker) | No adapter exists; classified as a build candidate per the Decision Record §8, pending the structured-output verification in Decision 8 |
| Google Gemini | INITIAL IMPLEMENTATION (candidate — not yet built; same blocker as OpenAI) | Same status; additionally flagged with a known system-instruction/content-part structural difference requiring adapter-internal translation (Decision Record §4) |
| xAI Grok | REQUIRES INVESTIGATION | No feasibility work done (Decision 9); deferred pending explicit need |
| DeepSeek | REQUIRES INVESTIGATION | Same, plus an unresolved regional/compliance-posture question (Decision Record §3) |
| Mistral | REQUIRES INVESTIGATION | Same; additionally offers both hosted-API and open-weight access paths, itself unresolved |
| Cohere | REQUIRES INVESTIGATION | Same; historically enterprise/RAG-oriented, fit for this specific task unverified |
| Meta/open-model ecosystem | FUTURE | Self-hosting or third-party inference changes the auth/ops/usage-accounting model entirely — a materially different kind of integration than a hosted-vendor adapter, not evaluated further |
| Future OpenAI-compatible/self-hosted providers | FUTURE | Evaluated case by case against §7's capability contract only when named; no current candidate |

No provider is ranked "best." Classification reflects evidence and
build sequencing only.

## 6. Recommended Provider Adapter Architecture

```
Vendor SDK/API  (e.g. @anthropic-ai/sdk, a future OpenAI/Gemini SDK)
        ↓
Provider Adapter  (per-vendor request/response translation — today
    this and the layer below are the SAME FILE per vendor, e.g.
    anthropicModel.ts; this is fine — the interface boundary matters,
    not physical file separation)
        ↓
Provider-neutral ResearchModel  (existing interface, CONFIRMED
    SUFFICIENT: {system, messages, signal} → {kind:'json'|'refusal',
    value|category, usage?})
        ↓
Shared Research Orchestration  (researchLead() — UNCHANGED: retry,
    repair, schema validation, provenance verification)
        ↓
ResearchProvider  (composition seam — UNCHANGED signature:
    research(input) → Promise<LeadResearch>; a future fallback wrapper,
    per Decision 3, also satisfies this same interface)
        ↓
LeadResearch  (canonical output — UNCHANGED)
        ↓
existing downstream pipeline  (Opportunity → Qualification →
    Personalization — UNCHANGED, no vendor awareness)
```

This is the repository's existing shape, confirmed sufficient (§7).

## 7. Research Contract Decision

**The existing `ResearchProvider` / `ResearchModel` / `LeadResearch`
boundaries are sufficient as-is. No contract change is required to add
a second or third provider.**

Basis: every candidate provider in §5 can, at minimum, accept a
`{system, messages}` prompt and return text/JSON, which is all
`ResearchModel` requires; `ModelResult`'s `{kind:'json'|'refusal'}` and
`ModelInvocationUsage`'s nullable cache fields already accommodate a
vendor that reports less usage detail than Anthropic; `ResearchProvider`'s
frozen `research(input) → LeadResearch` signature is untouched by
adding, removing, or wrapping (for fallback) any `ResearchModel`.

The items flagged as "possible future minimum change" in the scope
proposal §8 (a third `ModelResult` kind for a length/filter cutoff
distinct from refusal; per-call parameter overrides) are **not**
required by any provider evaluated in §5's classification — they remain
speculative and are not proposed here. If a future adapter's real,
observed behavior cannot be expressed in the current `ModelResult`
shape, that would be a new, separately-reviewed contract change at that
time — not anticipated or pre-authorized by this document.

## 8. Provider + Model Selection Decision

Resolved architecture (folding Decision 1/2 above into one flow):

```
user
  → provider + model  (resolved via the precedence chain: per-user
       stored preference → admin/global env default → hardcoded
       fallback — Decision 1)
  → factory constructs/selects the matching ResearchModel
  → ResearchProvider composes it (+ SourceDocumentProvider + metering)
  → research(input) → LeadResearch
```

- **Default provider/model:** Anthropic + `'claude-opus-5'` — today's
  actual hardcoded default, kept as the final fallback level.
- **Per-user selection:** architecturally reachable today via the
  existing `(userId) => ResearchProvider` factory; storage is a flat
  `{provider, model}` preference (Decision 1).
- **Per-service-profile selection:** deferred (Decision 2).
- **Admin/global defaults:** a new env-level pair (naming, not
  implementation: `RESEARCH_PROVIDER`/`RESEARCH_MODEL`), boot-validated
  like `ANTHROPIC_API_KEY` today.
- **Configuration precedence:** identical ordering applies to which
  credential is used — a per-user provider choice selects which
  server-side credential the adapter is constructed with; the user never
  supplies or sees the credential itself (§13).
- **Invalid provider/model configuration:** must fail at **construction
  time** (mirroring `AnthropicConfigError`'s existing "wiring fault,
  never an attacker's doing" pattern) — an unrecognized provider/model
  pair throws when the factory builds the `ResearchModel`, not as a
  per-request runtime failure. This keeps a misconfiguration loud and
  immediate rather than surfacing as a mysterious research failure later.
- **Persistence vs. configuration:** level 1 (per-user) belongs in
  persistence (a stored preference, scoped like other user-owned data);
  level 2 (admin/global) belongs in configuration (env, following the
  existing pattern exactly). No provider marketplace, no billing
  interaction, no plan/entitlement coupling is introduced by either.

## 9. Automatic Routing Decision

**DEFERRED — confirmed, remains appropriate.** Quality-based,
cost-based, and latency-based routing, model benchmarking, and automatic
model selection are not decided or designed by this review. Confirmed
reasoning: none of these can be built responsibly without the telemetry
this capability's own R-29 extension (§11 below) has not yet started
collecting across more than one provider — there is no data to route on
yet. Reversing this deferral is out of scope for this review and remains
a future-layer decision, to be revisited only once §11's telemetry has
been live across at least two providers for a meaningful period.

## 10. Fallback Decision

Final classification, incorporating Decisions 3/6/7 above:

| Failure | RETRYABLE | FALLBACK-ELIGIBLE | Basis |
|---|---|---|---|
| Timeout | Yes, within existing `maxAttempts`/backoff budget | Yes, once budget exhausted | Existing 408 classification |
| Rate limit | Yes, within existing budget | Yes, once budget exhausted | Existing 429 classification |
| Temporary provider outage | Yes, within existing budget | Yes, once budget exhausted | Existing 5xx classification |
| Authentication failure | NON-RETRYABLE | FALLBACK-ELIGIBLE | Existing 401 non-retryable classification; a different vendor's credential is unaffected |
| Context-length failure | NON-RETRYABLE | FALLBACK-ELIGIBLE | Decision 7 — a genuine per-vendor capability limit, not a content-quality judgment |
| Malformed output (pre-repair) | Handled by the existing repair loop, not the retry loop | N/A during repair | Unchanged existing behavior |
| Schema validation failure (repair exhausted) | NON-RETRYABLE (repair budget exhausted) | **FALLBACK-INELIGIBLE** | A different vendor has no architectural reason to succeed against the same source documents that already failed validation |
| Evidence validation failure (provenance) | NON-RETRYABLE | **FALLBACK-INELIGIBLE** | Same reasoning — evidence-quality outcome, not a transport outcome |
| Provider refusal | NON-RETRYABLE (terminal by design) | **FALLBACK-INELIGIBLE** | Decision 6 — extends the existing "retrying a refusal is futile and rude to the safety system" principle across vendors |
| Budget exhaustion (all retries used, no other classification) | N/A (already exhausted) | Evaluated by the underlying failure's own classification above | Budget exhaustion is not its own category — it is the trigger condition, not a failure type |

No retry count is invented beyond `researcher.ts`'s existing
`DEFAULTS` (`maxAttempts: 3`). Fallback triggers only after that budget
is exhausted against the primary provider, per Decision 3's composition
design.

## 11. R-29 Metering Decision

Minimum provider/model telemetry, resolved:

| Field | Status | Basis |
|---|---|---|
| provider | REQUIRED | Already captured |
| model | REQUIRED | Already captured |
| provider request identifier (`providerMessageId`) | REQUIRED, safe | Already a plain string extracted from the SDK response, never the response object — safe to capture |
| input tokens | REQUIRED | Already captured |
| output tokens | REQUIRED | Already captured |
| total tokens | OPTIONAL | Derivable from input+output; not separately stored |
| request status | OPTIONAL | Implicit today (unbilled failures are never metered); an explicit status field only needed if refusal-but-billed rows must be distinguished in reporting |
| retry count | Represented via existing `requestKind` per-row pattern, not a new aggregate field | Decision 5 |
| fallback count | Represented via a new `requestKind: 'fallback'` value, not a new aggregate field | Decision 5 |
| latency | OPEN — not decided by this review; not currently captured, no blocking dependency identified | Left for a future telemetry-design pass; does not block adapter or selection work |
| estimated cost | EXCLUDED from this capability | Decision 4 — no pricing table, no billing system |

**Explicitly confirmed:** no billing system, no change to
`packages/core-payments`, no change to `packages/core-entitlements`, no
SaaS usage-based pricing mechanism. This is research-execution
observability only, extending R-29's existing shape.

## 12. Provenance Decision

**Confirmed: changing providers/models cannot alter the meaning of
OBSERVED/INFERRED/UNKNOWN.** This holds structurally, not by policy —
`schema.ts`'s cross-field Zod rules and `provenance.ts`'s
`verifyProvenance()` execute inside `researchLead()`'s shared
orchestration, which no `ResearchModel` adapter can see or influence; an
adapter supplies only raw `{kind:'json', value}` output, checked
identically regardless of which vendor produced it.

**Provider/model metadata retention:** associated with the research
execution via the R-29 metering record (`ModelInvocationUsage`, §11),
joined by `prospectId`/timestamp — **not** via any field on
`LeadResearch`, `Observation`, or `StoredResearchSignal`, all of which
must continue to carry zero provider-identifying fields (confirmed
today: `mapping.ts`'s `toNewResearchSignals` reads only canonical
`Observation` fields).

**R-70/R-71/R-72 interaction:** Phase 24 (if approved) operates entirely
on the persisted `ResearchSignal`/evidence shape derived from
`LeadResearch` — a shape this capability does not alter regardless of
provider. Because provider identity never reaches `LeadResearch` or
`ResearchSignal`, R-70's source-to-business attribution check and R-71's
service-problem relevance check would run identically whether the
underlying research came from Anthropic, OpenAI, or Gemini. **This
capability does not weaken, bypass, or interact with R-70/R-71/R-72's
mechanics in any way** — it sits entirely upstream of, and orthogonal
to, that gate.

## 13. Security Decision

Confirmed, unchanged from the scope proposal §14, restated as final:

- Provider credentials **never** enter `LeadResearch`, any domain
  object, or any database business record — confirmed true today,
  required to remain true for every future adapter.
- Credentials never appear in logs — not independently verified (no
  logging implementation inspected); stated as a hard requirement for
  any future adapter.
- Credentials are never returned through any API response — a future
  provider/model selection surface exposes only the selection (provider
  name, model id), never a credential value.
- Credentials remain server-side always, following
  `createAnthropicResearchModel`'s existing explicit-injection,
  never-read-from-ambient-environment pattern.
- One provider's adapter never receives another provider's credential —
  each adapter's construction is scoped to only its own credential.
- Per-user provider/model configuration (§8) stores only the
  **selection**, never a credential.

No secret-storage mechanism is designed or implemented by this document.

## 14. Testing Decision

| Category | Mandatory for every future provider? | Scope |
|---|---|---|
| A. Provider contract tests | YES | Every `ResearchModel` implementation exercised against the same behavioral suite exercising `researchLead()` today |
| B. Anthropic adapter tests | Already exists | Baseline reference implementation |
| C. OpenAI adapter tests | YES, once built | Mirrors B's convention (mock the SDK boundary, no real network) |
| D. Gemini adapter tests | YES, once built | Same |
| E. Failure tests | YES | Every row of §10's table, per adapter — proves each adapter's errors classify into the correct bucket |
| F. Structured-output tests | YES | Valid response, malformed response, missing fields, extra fields, schema violation — per adapter |
| G. Fallback tests | YES, once fallback (Decision 3) is implemented | Proves fallback fires only for FALLBACK-ELIGIBLE rows in §10, never for refusal/validation/evidence failures |
| H. Metering tests | YES | Correct `provider`/`model`/`providerMessageId` population per adapter; idempotency on `(provider, providerMessageId)` holds across different vendors (a `providerMessageId` collision between two different providers must not be treated as a duplicate) |
| I. Provenance tests | YES | Fixed source documents + varying (faked) provider output must produce identical accept/reject provenance outcomes, proving §12's guarantee |
| J. No-cross-provider-state-contamination tests | YES | One provider's failure (timeout, outage, malformed response) must not corrupt or leak into another provider's concurrently-running research or the shared orchestration's per-call state |

Categories A, E, F, H, I, J are mandatory for **every** provider before
its adapter can be considered complete — not optional per-vendor
convenience tests. No test is written by this document.

## 15. Phase Boundary Decision

Per Decision 10: this capability is **not** Phase 24 and is **not**
automatically "Phase 25." It is recommended as a distinct, explicitly-
named, cross-cutting future capability ("Multi-Model Research Provider"),
sequenced after the Client Finder MVP's exit criteria are met and after
Phase 24 (if approved) closes. This is a proposal for a roadmap owner to
formally schedule — **not authorized, not numbered, not started** by
this document.

## 16. No-Execution Boundary

Explicitly confirmed — this capability does not authorize:

```
NO SEND            — core-outreach's send path remains unwired
NO SCHEDULE         — no scheduling infrastructure touched
NO DELIVERY         — no delivery mechanism touched
NO AUTONOMOUS OUTREACH — Outreach Preparation (Phase 22) remains frozen
NO CRM              — no CRM-shaped table referenced or migrated
NO PROPOSAL EXECUTION — core-proposal not referenced
NO PAYMENTS         — core-payments not referenced or modified
NO ENTITLEMENTS     — core-entitlements not referenced or modified
NO CAPI             — core-capi not referenced or modified
```

The capability is strictly: **RESEARCH PROVIDER / MODEL SELECTION +
ADAPTER INFRASTRUCTURE**, terminating at
`ResearchProvider.research(input) → Promise<LeadResearch>` — the exact
boundary that already exists today, upstream of every send-adjacent
package.

## 17. Remaining Risks

1. OpenAI/Gemini structured-output compatibility is unverified
   (Decision 8) — the single largest source of estimate uncertainty for
   initial adapter scope.
2. Fallback's source-document re-fetch cost across chained providers
   (Decision 3) needs an explicit single-fetch design to avoid wasted
   work.
3. `requestKind` enum widening (Decision 5) requires a migration whose
   exact shape is not designed here.
4. Latency capture in R-29 telemetry is left open (§11) — low risk, but
   unresolved.
5. Leaving this capability unnumbered in the phase sequence (Decision
   10) risks indefinite deprioritization without an explicit roadmap
   owner picking it up.

## 18. Implementation Preconditions

Before any engineering work begins under a future, separately-authorized
phase:

1. A human/roadmap owner must explicitly approve this scope (§19/§20 —
   this document does not constitute that approval).
2. The Client Finder MVP's exit criteria (`MVP_SCOPE_BOUNDARY.md` §10)
   must be met, and Phase 24 (if approved) must have closed (Decision
   10).
3. The OpenAI and Gemini structured-output spikes (Decision 8) must be
   completed, per-provider, before that specific provider's adapter
   implementation starts.
4. The fallback composition design (Decision 3) must be finalized before
   any fallback code is written — it does not block non-fallback work.
5. The `requestKind` enum-widening migration design (Decision 5) must be
   scoped before fallback/retry-count telemetry is implemented.

## 19. Final Recommendation

**NOT READY — OPEN DECISIONS REMAIN.**

Nine of the eleven original open decisions are now fully resolved by
this document with no remaining ambiguity (Decisions 1, 2, 4, 5, 6, 7,
9, 10, 11). Two remain genuine implementation blockers, by design, until
further work happens outside architecture review:

- **Decision 3** (fallback composition/trigger design) — blocks fallback
  implementation specifically.
- **Decision 8** (OpenAI/Gemini structured-output verification) — blocks
  each specific new adapter's implementation until its spike is done.

Neither blocks the base multi-provider architecture, per-user selection
design, or the R-29/security/testing decisions in this review, all of
which are unblocked. A future implementation phase could therefore begin
with (a) the OpenAI or Gemini structured-output spike and (b) the
fallback composition design, in parallel, without waiting on each other —
but no such work is authorized by this document.
