# CLIENT FINDER — STAGED REAL-CLIENT DISCOVERY ARCHITECTURE — PRODUCT OWNER DECISION

**Decision ID:** CF-DISCOVERY-ARCH-001
**Decision title:** Staged Real-Client Discovery Architecture (Discovery → Deterministic Filtering → Selective AI Research/Qualification)
**Date:** 2026-10-11
**Authority:** Product Owner

## Context

A read-only audit (same date) traced the live Client Finder code path and found:

- Google Places (New) is the live discovery source (`packages/core-discovery`).
- Every discovered candidate currently proceeds directly into two sequential LLM calls per candidate — research (`packages/core-research/src/researcher.ts`) and target-customer match (`packages/core-research/src/targetCustomerMatch.ts`) — with no deterministic opportunity pre-filter in between.
- Anthropic is the default research provider (`RESEARCH_PROVIDER` env, default `anthropic`), but the provider abstraction (`researchModelFactory.ts`) also supports OpenAI and Gemini, both already implemented.
- Multi-provider/fallback code exists (`fallbackResearchProvider.ts`) but has never been an authorized production architecture decision; it is effectively single-attempt in production today.
- Actual per-search AI/API cost has never been measured anywhere in this repository.
- A previously assumed "₹50/search" figure has no documentary basis — it is neither recorded nor evidenced anywhere in `requirement/`.
- Deterministic website/opportunity signal detection (e.g. HTTPS, mobile, performance, SEO, "no website") does not exist in the codebase today.

This decision record exists to let the Product Owner choose the target discovery/research architecture before any implementation is authorized.

## Options presented

- **A. Keep current Anthropic-heavy architecture** — Google Places → LLM research → target match, unchanged, no deterministic pre-filter.
- **B. Mostly deterministic** — Discovery → deterministic analysis → rules/scoring → minimal/no LLM.
- **C. Staged selective-AI architecture** — Discovery → deterministic opportunity filtering → selective AI research/qualification.
- **D. Other.**

## PO-selected option

**Option C — Staged selective-AI architecture.**

## Exact authoritative wording

> The Client Finder should use a staged real-client discovery architecture:
>
> 1. DISCOVER real businesses/opportunities using authorized discovery sources.
> 2. Apply inexpensive deterministic filtering and opportunity signals before expensive AI processing.
> 3. Use AI research/classification selectively for candidates that pass the deterministic stage or require deeper reasoning.
> 4. Frontier AI must NOT automatically be invoked for every discovered candidate merely because the candidate exists.
> 5. The architecture must remain provider-capable so the research model/provider can be changed later without changing the discovery model.
> 6. No specific rupee-per-search cost ceiling is being decided yet because actual costs have not been measured.
> 7. Future provider/model selection and exact cost ceiling remain separate PO decisions.

## Scope

This decision governs the target **shape** of the discovery→research pipeline for Client Finder: that a deterministic filtering/signal stage must exist between discovery and AI research/qualification, and that AI research must be invoked selectively rather than unconditionally for every discovered candidate. It does not govern discovery source selection, AI provider/model selection, cost ceilings, or implementation design.

## Explicit non-decisions

This decision does **not**:

- Ban, restrict, or deprecate Anthropic as a provider.
- Select OpenAI, Gemini, or any other provider as a replacement.
- Set a per-search or per-candidate cost ceiling (none has been measured; see Context).
- Specify which deterministic signals to build, their thresholds, or their scoring rules.
- Specify what "passes the deterministic stage" or "requires deeper reasoning" means precisely — that is an engineering-design decision still to come.
- Authorize any code, configuration, `.env`, provider, or model change.
- Authorize caching, batching, or fallback-chain activation.
- Authorize any paid experiment or API credit purchase.

## Consequences

- Future engineering-design and implementation-authorization decisions for Client Finder discovery/research must conform to the staged shape in Option C (deterministic filter stage before selective AI invocation) rather than the current unconditional two-LLM-call-per-candidate path.
- Provider/model choice remains open and must stay swappable independent of the discovery stage, per wording item 5.
- No cost ceiling exists yet; cost-ceiling and provider/model decisions must be made separately, informed by actual measurement (not the unverified ₹50/search figure).

## What remains to be decided

- Which deterministic opportunity/website signals to build and their exact scope.
- The rule(s) determining which candidates pass the deterministic stage vs. require AI research.
- Which provider(s)/model(s) to use within the staged architecture, and whether multi-provider fallback is activated in production.
- A per-search or per-candidate cost ceiling, once actual costs have been measured.
- Caching and batching policy for AI research calls.
- The engineering design and implementation plan to realize this architecture.

## Implementation authorization status

**NOT AUTHORIZED BY THIS DECISION.**

No code, configuration, `.env`, provider, or model changes have been made as part of this decision. This record establishes the target architecture only; a separate implementation-authorization decision is required before any engineering work begins.
