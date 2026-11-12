# Path 2 — D9 Provider Neutrality Product Decision

## 1. Status

```text
D9:
DECIDED

Choice:
OPTION A — FULL PROVIDER NEUTRALITY

Implementation:
NOT AUTHORIZED
```

This is a governance/product-decision record. It records the Product Owner's selection of D9. It does not implement, design, or authorize any code, schema, prompt, adapter, test, or configuration change. No production code, test, PRD, configuration, database/migration, provider adapter, or worker file is created or modified by this document, and no live API call is made.

## 2. Decision

```text
D9 STATUS: DECIDED
D9 CHOICE: OPTION A — FULL PROVIDER NEUTRALITY
```

The Path 2 category-plausibility capability **must remain fully provider-neutral** across the existing Research provider architecture, **including the existing fallback-provider path**.

The semantic result of category plausibility must not depend on whether Research is served by Anthropic, OpenAI, Gemini, or a configured fallback provider.

The provider selected for a given Research execution may vary operationally, but the category-plausibility **contract, semantics, evidence requirements, validation rules, persistence attribution, and Qualification behavior must remain invariant**.

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This task records product intent only.

## 3. Product Rationale

This decision is grounded in the already-locked Path 2 decisions and the current, verified architecture (per the prior D9 preparation pass, `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D9_PRODUCT_DECISION.md`'s pre-decision content, §3–§7, and the source files it cites: `packages/core-research/src/provider.ts:11-26`, `researcher.ts:44-56`, `researchModelFactory.ts:9-17,94-130`, `openAIModel.ts`, `geminiModel.ts`, `fallbackResearchProvider.ts`, `apps/worker/src/index.ts:40-104`, `packages/config/src/env.ts:72,76-77`):

1. **Category plausibility is a business-level Research/Qualification capability, not a provider-specific feature.** It answers a product question — "does this business plausibly belong to the participant's target audience?" — that has no dependency on which vendor's model happened to produce the underlying evidence interpretation.
2. **D1** defines the determination as a dedicated Search + Prospect category-plausibility determination — a persistence and attribution concept independent of which provider computed it.
3. **D2** defines deterministic multi-segment parsing and ANY-match (OR) semantics — parsing occurs in code, before any provider is invoked (no parsing of `targetCustomer` exists anywhere in the codebase today, confirmed by repository-wide search in the prior D8/D9 tasks in this governance chain), so the segment boundaries a provider evaluates against are already fixed and identical across providers by construction.
4. **D3** defines the evidence policy: first-party website evidence is primary; search-derived metadata may support but is not independently sufficient; insufficient evidence produces UNKNOWN. This is a business rule about evidentiary sufficiency, not a per-vendor tuning knob.
5. **D4** defines category plausibility as a distinct Qualification criterion, not routed through R-71 Need Detection — a Qualification-side integration point that has no visibility into, or dependency on, which Research provider produced the input it consumes.
6. **D5** defines MATCH/MISMATCH/UNKNOWN behavior (MATCH passes; MISMATCH fails Qualification without blocking Opportunity creation; UNKNOWN fails/holds) independently of the Research provider — the state machine this behavior plugs into (`evaluateQualificationForOwner`, `createOpportunityForOwner`) has no provider-identity input of any kind.
7. **D6** requires Search + Prospect historical attribution, preserved across searches — an attribution key with no relationship to provider identity.
8. **D8** (Option B, non-binding, unchanged by this decision) selects preservation of the provider-facing `ResearchProviderInput` contract where possible, carrying Search-scoped context through Research orchestration/dependencies rather than through the provider adapters themselves — this already routes the capability's *input* side above the provider-adapter boundary, consistent with D9's requirement that the capability's *output* semantics remain equally provider-independent.

**Therefore: provider selection must not alter the meaning or downstream handling of the determination.** This conclusion is a product decision resting on the above facts and locked decisions; it is not itself re-derived as a new architectural finding in this document (the underlying architecture trace was performed in the prior D9 preparation pass and is not repeated here).

## 4. Scope of Provider Neutrality

"Fully provider-neutral" means, precisely:

**A. Shared semantic contract.** MATCH, MISMATCH, and UNKNOWN have exactly the same meaning regardless of which provider (Anthropic, OpenAI, Gemini, or a configured fallback) produced the Research result.

**B. Shared evidence policy.** The minimum evidence requirements established by D3 (first-party primary, search-derived metadata supporting only, UNKNOWN on insufficiency) do not change based on provider.

**C. Shared validation.** Provider output is validated against the same Research/category-plausibility contract, regardless of which provider produced it.

**D. Shared persistence semantics.** The determination is attributed to the same Search + Prospect (per D1/D6) regardless of which provider computed it.

**E. Shared Qualification semantics.** D4/D5 behavior — the criterion's pass/fail/hold logic and its effect on Qualification and Opportunity creation — is identical regardless of provider.

**F. No provider-specific business rules.** No provider may introduce a different interpretation of target-customer plausibility, a different evidence-sufficiency bar, or a different segment-matching rule than any other provider.

**G. Fallback invariance.** If the primary provider fails and the configured fallback provider (per `RESEARCH_FALLBACK_PROVIDER`) handles the Research execution, the category-plausibility result must still obey the same semantic/evidence/validation contract. See §5.

**H. Provider replacement invariance.** Replacing Anthropic with OpenAI/Gemini, or vice versa, as the configured primary or fallback provider, must not require changing the product definition of category plausibility.

## 5. Fallback Provider Invariance

The live worker wiring already includes a cross-provider fallback mechanism — `createFallbackResearchProvider` (`packages/core-research/src/fallbackResearchProvider.ts:75-129`), wired at the worker's `ResearchProvider` construction point in `apps/worker/src/index.ts:85-104`, and configured via the optional `RESEARCH_FALLBACK_PROVIDER`/`RESEARCH_FALLBACK_MODEL` environment variables (`packages/config/src/env.ts:72,76-77`). This is **not a hypothetical future capability** — it is part of the live Research execution architecture today, and this decision treats it as such.

**The configured fallback provider is considered part of the same provider-neutral Research contract.** A fallback execution must not:

- change MATCH/MISMATCH/UNKNOWN semantics;
- lower evidence requirements;
- bypass validation;
- change Search + Prospect attribution;
- alter Qualification behavior;
- introduce provider-specific business rules.

**The fallback mechanism may change which model/provider executes the Research call, but not what the product considers a valid category-plausibility determination.** This applies to all of:

1. Primary provider execution.
2. Configured fallback provider execution.
3. Provider substitution caused by transient provider failure (the existing fallback-eligibility classification in `fallbackResearchProvider.ts:22-41` — fallback triggers only on `ResearchProviderError`, i.e., timeout/rate-limit/outage/auth/context-length failures, never on a refusal, validation failure, or abort).
4. Any future provider implementing the existing provider-neutral `ResearchModel`/`ResearchProvider` architecture (`researcher.ts:44-56`, `provider.ts:24-26`).

## 6. Tradeoffs

No option is described as "best," "optimal," or otherwise ranked. This section records the tradeoffs of the decision already made in §2.

**Benefits:**
- Consistent product semantics for the participant, regardless of backend configuration.
- Predictable fallback behavior — a Search's outcome does not depend on which provider transiently served it.
- Easier cross-provider testing, since one shared contract governs correctness rather than N provider-specific contracts.
- Reduced provider lock-in for the category-plausibility capability specifically.
- Business rules remain above provider adapters, consistent with the architecture's existing, verified pattern (`researchModelFactory.ts:9-17`'s own header comment: this is "the ONE place in the codebase allowed to branch on provider identity").
- Qualification behavior remains deterministic from the product's perspective, independent of infrastructure/provider configuration.

**Costs:**
- Every supported provider must satisfy the shared contract sufficiently — this is a requirement to verify per provider, not an assumption that all three already do so today for a capability that does not yet exist.
- Provider-specific structured-output capabilities may differ (confirmed in the prior D9 preparation pass: Gemini's `responseSchema` is a distinct OpenAPI-3.0-subset dialect from the JSON Schema Anthropic/OpenAI consume, requiring the adapter-internal `toGeminiSchema()` translation at `geminiModel.ts:72-111`) — any new field must remain translatable by that existing mechanism, which is not yet verified against the specific shape D1/D2 will eventually require.
- Prompt/schema techniques may need adapter-specific handling internally to achieve equivalent semantic outcomes, even while the shared contract stays fixed.
- Provider differences may require adapter-level normalization, following the pattern `toGeminiSchema()` already establishes.
- Validation and regression testing must cover all supported providers **and** fallback combinations (primary-only, primary-then-fallback), not just a single default configuration.
- A provider that cannot satisfy the required evidence contract cannot silently receive weaker category-plausibility rules — a capability gap in one provider is a blocker for that provider's use with this capability, not a license to relax D3 for it.

**Not claimed:** this document does not assert that Anthropic, OpenAI, and Gemini all currently satisfy these requirements for a category-plausibility field — no such field exists in the schema yet, and no live API calls were made to verify structured-output behavior for a not-yet-designed shape. This is recorded as an open verification item for a future implementation task, not a settled fact.

## 7. Implementation Constraints

These are recorded as constraints binding a future, separately-authorized implementation — **not implementation work performed by this document**:

1. Provider-neutral semantics must live above provider-specific adapters (i.e., in `schema.ts`/`provider.ts`/`prompt.ts`/`researcher.ts`-layer code, not inside `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts`).
2. Do not create separate MATCH/MISMATCH/UNKNOWN definitions for Anthropic/OpenAI/Gemini.
3. Do not weaken D3 evidence requirements for a particular provider.
4. Do not route category plausibility through provider-specific business logic.
5. Deterministic target-customer parsing (D2) must remain provider-independent — parsing happens in code, not inside any provider's own interpretation.
6. Search-scoped attribution (D6) must remain provider-independent.
7. Qualification consumption (D4/D5) must remain provider-independent.
8. Provider fallback must not alter the semantic contract (§5).
9. Provider adapters may use provider-specific mechanisms internally (e.g., schema-dialect translation, request formatting) only if the resulting output conforms to the shared contract — mirroring the already-existing `toGeminiSchema()` pattern.
10. If a provider cannot produce a contract-compliant result, the system must preserve the existing failure/UNKNOWN semantics rather than silently changing product meaning.
11. No change to R-71 is authorized.
12. No change to scoring/ranking is authorized.
13. No change to Discovery is authorized.
14. No change to Opportunity creation/state machine is authorized.
15. D0–D8 remain unchanged.

## 8. Testing Implications

No tests are written by this document. Future testing implications only:

1. Contract-level tests should verify identical semantic handling across providers.
2. Provider adapter tests should verify provider-specific output is normalized into the shared contract.
3. Fallback tests should verify that primary-provider failure followed by fallback execution does not alter semantics.
4. Evidence-validation tests should verify D3 rules are identical across providers.
5. Search + Prospect attribution tests should verify provider choice has no effect on historical attribution.
6. Qualification tests should verify D5 behavior is provider-independent.
7. Deterministic multi-segment parsing tests should remain independent of provider selection.
8. No scoring/ranking regression suite should be expanded as part of D9 unless separately authorized.
9. No Discovery behavior change is implied by D9.

## 9. Validation Implications

No live validation is performed by this document. A future live validation should record:

- selected primary provider;
- whether fallback was invoked;
- actual provider that produced the Research result;
- category-plausibility state (MATCH/MISMATCH/UNKNOWN);
- evidence used;
- validation outcome;
- Search + Prospect attribution;
- Qualification result.

## 10. Unchanged Boundaries

```text
D0: UNCHANGED
D1: UNCHANGED
D2: UNCHANGED
D3: UNCHANGED
D4: UNCHANGED
D5: UNCHANGED
D6: UNCHANGED
D7: UNCHANGED
D8: OPTION B — NON-BINDING / UNCHANGED

R-71: UNCHANGED
Scoring / Ranking: UNCHANGED
Discovery: UNCHANGED
Opportunity Creation / State Machine: UNCHANGED
```

D10 and D11 are not resolved by this document and remain exactly as recorded in `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md`. No additional product decisions are inferred beyond D9's own selection.

## 11. Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION

NOT GRANTED
```

Nothing in this document authorizes writing, modifying, or generating any production code, test, schema, migration, configuration, provider-adapter, or worker file. A separate, explicit implementation-authorization step is required after D9 (now decided) and D10/D11 (still open) are all resolved.

## 12. Decision History

```text
D9 — Provider Neutrality: DECIDED — OPTION A (FULL PROVIDER NEUTRALITY)

The Product Owner explicitly selected Option A: the Path 2 category-plausibility
capability must remain fully provider-neutral across the existing Research
provider architecture, including the existing, already-live fallback-provider
path (createFallbackResearchProvider / RESEARCH_FALLBACK_PROVIDER).

This document records product intent only. It does not design, schema, implement,
test, or authorize any code change. D0–D8 are unchanged; D7 remains DECIDED
(Candidate C) and D8 remains DECIDED (Option B, non-binding) exactly as previously
recorded. D10 and D11 remain open and are not addressed here.

Implementation authorization: NOT GRANTED.
```

## 13. Repository Safety / Audit Record

```text
Branch:                       phase-17-r34-worker-orchestration

Recorded starting HEAD
(git rev-parse HEAD, run at task start):     5992b82b9adff492c480442d68a954f2a03bfb28

Expected baseline (per task instructions):   5992b82b9adff492c480442d68a954f2a03bfb28
Match:                                       CONFIRMED — no discrepancy.

HEAD after task completion:                  5992b82b9adff492c480442d68a954f2a03bfb28
                                              (unchanged — verified below)

Production code changed:      0
Tests changed:                 0
PRD changed:                    0
Configuration changed:           0
Database/migrations changed:      0
Provider code changed:              0
Worker code changed:                 0
Live API calls:                       0
Staged:                                 none
Commit:                                  none
Push:                                     none

File modified by this task (the only file changed):
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D9_PRODUCT_DECISION.md
  (D9 status changed from PRODUCT OWNER DECISION REQUIRED to DECIDED — OPTION A;
  document restructured per the required decision-record format; no other
  governance document was modified)

`requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md`: read, not
modified — consistent with the precedent already established when D7 and D8
were separately decided (each recorded in its own dedicated file without
mirroring into the Final Decision Record).

Files read for this task, not modified:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D9_PRODUCT_DECISION.md (pre-edit state,
    carried forward from this session's own prior preparation pass)
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D7_PRODUCT_DECISION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md
  (the D8 implementation scope map, D0-D5 decision preparation, implementation
  scope, scope lock, and product-decisions documents were read in full earlier
  in this same session and their relevant findings are reused here rather than
  re-read, per the established evidence already on record)

No source files under packages/core-research, apps/worker, or packages/config
were re-read in this task — this task's D9 architecture trace (provider
adapters, researchModelFactory, fallbackResearchProvider, worker wiring, env
config) was already performed and verified in the immediately preceding D9
preparation task within this same session, and is not re-derived here; only
the decision itself is newly recorded.

Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

Pre-existing untracked files (untouched by this task, .claude/, CLAUDE.md, and
the full pre-existing requirement/*.md set included).
```

## STOP

D9 is recorded as **DECIDED — OPTION A (FULL PROVIDER NEUTRALITY)**, with **IMPLEMENTATION AUTHORIZATION: NOT GRANTED**. No production code, test, PRD, configuration, database/migration, provider adapter, or worker file is created or modified by this task. D0–D8 are unchanged; D10/D11 are not resolved. `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` was not modified. This task ends with the D9 decision recorded as above and repository safety verified.
