# CLIENT FINDER — ZERO AI/LLM CALLS IN THE CURRENT MVP — PRODUCT OWNER DECISION

**Decision ID:** CF-ZERO-AI-MVP-PO-DEC-001
**Related decisions/documents:** `CLIENT_FINDER_C_SERIES_PRODUCT_OWNER_DECISION_RECORD.md` (C-3B — the broader capability principle this record narrows for the current MVP phase, not amended by this record); `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_S6_AI_ESCALATION_BOUNDARY_PO_DECISION.md` and `CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md` (`CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001` — the admission/budget/cache architecture this record keeps dormant, not deleted); `CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_ENGINEERING_SPECIFICATION.md` §14 ("Zero-AI MVP Specification" — the engineering analysis that already identified the gap this record formalizes the product position on); `CLIENT_FINDER_NEED_OPPORTUNITY_SUFFICIENCY_PO_DECISION.md` (K5-D1) and `CLIENT_FINDER_PCG4_CATEGORY_PLAUSIBILITY_TEST_COVERAGE_PO_DECISION.md` (K5-D2) — unaffected, disjoint scope; `packages/config/src/env.ts` (`ANTHROPIC_API_KEY`'s `.optional()` comment, which already names "C-3B / zero-AI requirement" as its rationale — this record is the first record to state the MVP-phase policy explicitly, which that code comment anticipated but no PO record had yet stated).
**Decision title:** For the current Client Finder MVP, no AI/LLM provider call (Anthropic, OpenAI, or Gemini) may execute, regardless of whether a provider credential is configured
**Date:** 2026-10-24
**Authority:** Product Owner
**Status:** DECIDED
**Scope of this record:** Formalizes an already-made Product Owner decision about the CURRENT MVP phase. This is not a new product decision, does not reopen or amend C-3B, and does not authorize, change, or imply any code, configuration, `.env`, database, test, or migration change. Implementation of the enforcement mechanism this record requires is **explicitly not authorized** by this record — see "Implementation status" below.

## Context

A real Client Finder search (Service: "Web & Software Development", Geography: "Mumbai", 2026-10-24) reached Research and attempted a live call to Anthropic, which failed with HTTP 401 (`invalid x-api-key`), and the Search ultimately settled as `FAILED`. A read-only audit of the runtime traced the cause: the real deployment's `.env` carries a non-empty (but invalid) `ANTHROPIC_API_KEY`, `RESEARCH_PROVIDER` defaults to `anthropic`, and the Phase-5 admission gate (`packages/core-research/src/admission.ts`) admitted at least one ranked candidate to AI escalation — exactly as that architecture is designed to behave once a credential is present.

This exposed that no runtime mechanism in the codebase treats "zero AI calls" as the CURRENT MVP's actual operating mode. What exists today (`packages/config/src/env.ts:82`, Phase J / "C-3B / zero-AI requirement") only makes `ANTHROPIC_API_KEY` *optional at boot* — a deployment with no credential at all still boots and runs deterministically. It does not make "do not call AI" a condition independent of credential presence. `CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_ENGINEERING_SPECIFICATION.md` §14 had already identified this exact gap in engineering terms on 2026-10-19/20 ("there is no legitimate 'no AI' selection today... gate at the call site... C-3B already authorizes the requirement; this closes the how") but that specification explicitly closes with "NO IMPLEMENTATION AUTHORIZED." No PO decision record had, until now, stated in product terms that the current MVP phase itself must run with zero AI calls, independent of credentials. This record is that statement.

## Relationship to C-3B

**This record narrows C-3B to the current MVP phase. It does not amend, reinterpret, or reopen C-3B.**

C-3B (`CF-C-SERIES-PO-DEC-001`, 2026-10-19, Option C) decided that Client Finder's core functionality **must be capable of** operating without AI/LLM calls, that AI may remain optional future enrichment, that mandatory per-search/per-lead LLM calls must not be introduced, and — explicitly — that the existing AI admission/budget architecture (`CF-DISCOVERY-ARCH-002-S6` / `CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001`) is **not deleted** by that decision; C-3B only established that the core product cannot *depend* on it.

C-3B is a capability statement (the pipeline must be *able* to run AI-free). It does not, by its own text, state that AI calls must not *occur* during the current MVP phase when a credential happens to be configured. This record supplies that missing, phase-specific statement: for as long as Client Finder is in its current MVP phase, AI calls must not occur at all — not merely "must not be required." The underlying admission/budget/cache architecture C-3B preserved stays exactly as C-3B left it: present, dormant, un-deleted, ready for a future phase in which the PO decides to switch AI enrichment on.

## PO decision

**Current MVP AI policy: Client Finder MVP = ZERO AI / ZERO LLM calls.**

1. No AI/LLM provider call — Anthropic, OpenAI, or Gemini — may execute during the current MVP, in any pipeline stage: Discovery, Research, Need/Opportunity, Qualification, or Ranking.
2. The Phase 5 AI admission/budget/cache architecture (`admission.ts`, the escalation budget, the signal cache) **remains in the codebase**, dormant, for future optional AI enrichment. This record does not authorize deleting, disabling-by-deletion, or redesigning it.
3. **AI provider credentials are irrelevant to current MVP execution.** Configuring a valid `ANTHROPIC_API_KEY`/`OPENAI_API_KEY`/`GEMINI_API_KEY` must **not** enable AI calls. The presence of a credential is not, and must not become, the mechanism that permits AI to run.
4. Conversely, removing or omitting a credential must **not** be the mechanism that disables AI — that already-implemented behavior (`ANTHROPIC_API_KEY` optional at boot, Phase J) addresses a different concern (boot without a credential) and is not sufficient on its own to satisfy this decision. A deployment with a perfectly valid, correctly-billed credential configured must still make zero AI calls during the current MVP.
5. Deterministic Discovery, Research, Need/Opportunity, Qualification, and Ranking must remain fully functional with zero AI calls, exactly as the current architecture already provides (confirmed by `CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_ENGINEERING_SPECIFICATION.md` §14: qualification and ranking are already pure/deterministic with no LLM dependency).
6. Any AI call failure handling (retry, fallback to deterministic-only, budget exhaustion behavior) remains future/fallback architecture for when AI enrichment is later switched on. It is not exercised in the current MVP, because no AI call is made in the current MVP.
7. **No new AI provider is authorized.** This record does not add, remove, or change any provider integration.
8. **No commercial change.** This record does not alter pricing, the ₹1,499 subscription, credit consumption, or any commercial decision.
9. **No change to Service + Geography** input scope (`CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002`).
10. **No change to Global Entity Architecture** (D1–D23, or any Global Entity governance record).
11. **No change to K5-D1/K5-D2** (`CLIENT_FINDER_NEED_OPPORTUNITY_SUFFICIENCY_PO_DECISION.md`, `CLIENT_FINDER_PCG4_CATEGORY_PLAUSIBILITY_TEST_COVERAGE_PO_DECISION.md`) — both are about evidence sufficiency on signals already produced deterministically, and are unaffected by whether AI runs.
12. **No change to R-70/R-71** (opportunity-adapter field-selection rules).
13. **No change to ranking** (`CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001`, the seven-dimension model, or C-4's UNKNOWN-hiding rule).

## Explicit boundaries

- AI provider credentials are irrelevant to MVP execution — their presence or absence must not be read by the runtime as an enable/disable signal for AI.
- The MVP must **explicitly** enforce zero-AI behavior — i.e., via a dedicated, legible gate, not as a side effect of credential absence, a misconfigured key, a billing failure, or any other incidental condition.
- Phase 5 admission/budget/cache architecture may remain dormant in the codebase; dormancy is the intended state for the current MVP, not a defect to be fixed by deletion.

## Mandatory boundaries on this decision

1. This is a governance/documentation decision. No code, configuration, `.env`, secret, database, test, or migration change is authorized, introduced, or implied by this record.
2. C-3B is not amended, reinterpreted, or reopened — see "Relationship to C-3B" above.
3. The AI escalation boundary architecture (`CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001`) is not reopened, deleted, or redesigned by this record.
4. Global Entity Architecture, K5-D1, K5-D2, R-70/R-71, ranking, and all ₹1,499 commercial decisions are not changed or reopened by this record.

## Explicit non-decisions

This record does **not** decide or authorize:

- The specific implementation mechanism for the enforcement gate (e.g., a new `RESEARCH_PROVIDER` sentinel value vs. a call-site flag vs. an environment switch) — `CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_ENGINEERING_SPECIFICATION.md` §14 already sketches two candidate designs and recommends one; selecting and building one is a separate, scoped engineering task this record does not authorize.
- Any change to the Phase 5 admission/budget/cache code itself.
- When or how AI enrichment will later be switched on for a future phase — that remains a future PO decision.
- Any test rewrite — the existing test gap noted in the engineering specification ("no test today exercises a successful AI-less boot" / no test exercises a successful AI-less *run with a credential present*) is a separately-scoped engineering/test-authoring matter.

## Implementation status

**NOT YET IMPLEMENTED.** Unlike K5-D1/K5-D2, this decision formalizes a policy for which production code does **not yet** have a corresponding enforcement mechanism. As confirmed by this record's own audit trail:

- `packages/config/src/env.ts:82` makes `ANTHROPIC_API_KEY` optional at boot (Phase J) — addresses credential-absence-at-boot only.
- No `RESEARCH_PROVIDER` value exists for "no AI" (`packages/core-research/src/researchModelFactory.ts:19`, enum is exactly `['anthropic','openai','gemini']`).
- No feature flag, environment switch, or call-site gate exists anywhere that refuses AI escalation independent of credential presence.
- The Phase-5 admission gate (`packages/core-research/src/admission.ts`) and `processOneCandidate()` (`apps/worker/src/searchWorker/worker.ts`) will escalate an admitted candidate to a live provider call whenever a credential happens to be configured — exactly the behavior this record now says must not occur in the current MVP.

This record authorizes no fix. The smallest conceptual implementation this decision would require, for a future authorized engineering task, is described in the accompanying runtime audit (Part D) — not implemented here.
