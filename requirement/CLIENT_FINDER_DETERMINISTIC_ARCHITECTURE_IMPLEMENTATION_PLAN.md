# Client Finder — Deterministic-First Architecture: Implementation Plan

Status: **PLANNING ONLY — NOT YET AUTHORIZED FOR IMPLEMENTATION.**
No code, schema, or test file has been modified to produce this document.

This plan turns the now-closed governance set — most recently
`CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md`
(CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001) and the final reconciliation audit
("NO REMAINING PO CONFLICTS FOUND. READY FOR IMPLEMENTATION PLANNING.") —
into a concrete, staged engineering plan. It does not reopen any PO decision
and does not silently resolve the implementation values that governance left
unresolved (§16 enumerates them explicitly).

---

## 0. Reconciliation Update — 2026-10-13 (§16 Items 1–5 Resolved)

The five implementation decisions §16 originally listed as open blockers
have now been resolved by the Product Owner. This update is additive: the
original blocker language in §1, Phase 3, Phase 5, §16, §19, and §20 below
is left in place as the historical record of what was unresolved and when,
each annotated inline with **"RESOLVED (see §0)"** pointing back here rather
than rewritten. The resolved positions are:

1. **Ranking formula (§16.1 / Phase 3)** — qualitative tiers
   `STRONG / MODERATE / WEAK / UNKNOWN`, ordered lexicographically by
   dimension tier: Primary → Important → Supporting → stable ID (tie-break).
   No composite numeric score; no user-facing score/band. The existing
   ordinal `rank` field remains; the legacy seven-factor score
   (`scoreProspect()`) is superseded as a ranking source, per the
   already-decided `CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md`.
2. **Top-N (§16.2 / Phase 5)** — N = 10. Applies **only** to AI escalation
   admission. Does **not** limit how many opportunities are shown to the
   freelancer. Candidates outside Top-N remain visible, deterministically
   ranked, with deterministic-only evidence (Phase 6/7).
3. **Admission threshold (§16.3 / Phase 5)** — a candidate is eligible for
   normal (non-bypass) AI escalation iff `Need/Opportunity >= MODERATE OR
   Service Fit >= MODERATE`. This threshold governs AI escalation
   eligibility only; it is never an elimination/eligibility gate (Phase 2
   is unaffected).
4. **Escalation budget (§16.4 / Phase 5)** — B = N = 10 escalation units
   per search. One candidate escalation (Research + optional TCM together)
   = one unit. The strong-signal bypass (below) consumes the same shared
   budget, never an additional allowance. No rupee/token budget is
   invented. **N = 10 and B = 10 are initial engineering defaults and must
   be implemented as named configurable constants** (see §21), not magic
   numbers, and are explicitly subject to revision after measurement.
5. **Strong-signal bypass (§16.5 / Phase 5)** — a candidate bypasses the
   normal threshold (priority admission, not extra budget) iff it has
   **>= 2 independent signals**, each `OBSERVED` (never `INFERRED`/
   `UNKNOWN`), each drawn from a service-specific top-reliability signal
   category (per Phase 1's `ServiceSignalCatalogue`), with **at least one**
   being a Primary-dimension (Need/Opportunity or Service Fit) signal. A
   website alone never qualifies; a single signal of any kind never
   qualifies. Bypass changes admission priority/threshold only — it never
   escapes Top-N or the shared budget.

There are no remaining genuine PO conflicts against these five items.

---

## 1. Executive Summary

The current pipeline (`apps/worker/src/searchWorker/worker.ts` →
`packages/core-research/src/service.ts`) runs two unconditional LLM calls
(Research + Target Customer Match) for **every** candidate Discovery finds,
with no deterministic filter, no cache check, and no budget — a direct
violation of the now-decided escalation-boundary architecture. Ranking
(`scoreOpportunityForOwner`, which wraps the legacy seven-factor
`scoreProspect()`) runs *after* AI, exposes a raw 100-point score, and is
superseded in principle by `CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md`
but not in code.

This plan inserts a deterministic evidence → elimination → ranking → cache
stack **ahead of** AI, turns AI into a bounded, candidate-level escalation
that can fail or be skipped without removing the candidate, and retires the
exposed 100-point score in favor of the governance-decided qualitative
ranking hierarchy — without touching K1, the ₹1,499 subscription/access
path, or contact extraction/masking.

Ten phases are defined (§3). Phases 0–3 and 6–7 are implementation-ready
today. Phases 4 (cache) and 5 (AI escalation) previously carried one or
more numeric values that governance had authorized *in principle* but not
*in number* (§16) — **RESOLVED (see §0):** all five §16 items are now
decided with concrete values; Phases 3 and 5 are implementation-ready
pending Phase 0 baseline and §21's named configuration constants. Phase 8
(service catalogue expansion) and Phase 9 (launch gate) are planned but
intentionally sequenced after the architecture lands on one service.

## 2. Target Architecture

```
Search intake
  → exactly one top-level service, internal subservices        [existing — unchanged]
  → deterministic discovery (Google Places)                     [existing — unchanged]
  → normalize/dedup                                              [existing, ONE open defect: §Known Gap 12]
  → deterministic evidence/signal generation                     [NEW — Phase 1]
  → deterministic elimination                                    [NEW — Phase 2]
  → deterministic ranking (five-dimension, qualitative)          [NEW — Phase 3, replaces exposed score]
  → cache-first evidence reuse (same-freelancer only)             [NEW — Phase 4]
  → bounded AI escalation (Research + TCM, shared unit)            [NEW — Phase 5]
  → deterministic-only fallback (skip/fail/exhausted)              [NEW — Phase 6]
  → Minimum Useful Lead Result                                      [NEW — Phase 7]
  → contact/unlock rules                                            [existing — unchanged]
  → evidence transparency                                           [existing + Phase 1 provenance]
```

Research and TCM remain two independent provider calls (unchanged
signatures), but both move behind one admission gate instead of running
unconditionally for every prospect.

## 3. Phase-by-Phase Implementation Plan

### Phase 0 — Baseline / Safety

- **HEAD at planning time**: branch `feature/client-intent-discovery-complete`,
  current tip `b3f1827` ("feat: implement Rs.1499 Client Finder subscription").
- **Packages/apps affected**: `packages/core-discovery`, `packages/core-research`,
  `packages/core-acquisition`, `packages/core-opportunity`, `apps/worker`
  (`searchWorker/*`, `index.ts`). Not affected: `packages/core-identity`,
  `packages/core-payments`, `packages/core-subscriptions`, `packages/rate-limit`,
  `apps/web` checkout/session/auth code (all currently modified in the working
  tree for the unrelated ₹1,499 subscription work — this plan does not touch
  any of those files).
- **Tests that must remain green**: every existing suite under the five
  affected packages, in particular `packages/core-acquisition/src/prospectScore.test.ts`
  (must keep passing unmodified — the function is not deleted, only stops
  being the thing a user-facing rank is computed from, see Phase 3),
  `apps/worker/src/searchWorker/worker.test.ts`, `packages/core-research/*.test.ts`.
- **Existing behavior that must not change**: K1 qualification/personalization/
  outreach-prep/follow-up-prep chain in `runPostResearchPipelineForOwner`
  (`apps/worker/src/searchWorker/worker.ts:450-536`); contact extraction
  (`packages/core-research/src/contactValueExtraction.ts`); ₹1,499 access/
  unlock rules (`packages/core-subscriptions`); `ResearchSignalRepository`
  contract; `ResearchProvider`/`TargetCustomerMatchModelDeps` contracts (no
  signature changes — only call-site gating changes).
- **Migration strategy**: no schema change is required for Phases 0–3 and
  6–7 (new tables only for Phases 4–5, see §5/§15). No migration is created
  in this planning pass, per the hard constraint.

### Phase 1 — Deterministic Evidence Foundation

**Already exists, reusable as-is:**
- `ResearchSignal` type (`packages/core-acquisition/src/scoring.ts`) with
  `kind`, `signal`, `confidence`, `observedAt`, `supersededAt` — this is the
  schema deterministic signals must also produce, so the rest of the
  pipeline (`scoringAdapter.ts`, `prospectScore.ts`'s `visibleProblem`/
  `evidenceQuality` factors) does not need to special-case signal origin.
- `ClaimBasis` (`'OBSERVED' | 'INFERRED' | 'UNKNOWN'`) — already the
  observed/inferred/unknown vocabulary the governance decisions assume;
  deterministic signals are `OBSERVED` by construction (a fact read off a
  source document, not a model's inference).
- Provenance capture: `toCapturedSourceDocuments`/`SuppliedSourceDocuments`
  (`packages/core-research/src/service.ts:149,155-157,237-249`) already
  records label/url/text/fetchedAt/extractionMethod per source document —
  deterministic signals reuse this same capture shape so a signal's
  provenance is never second-class relative to an AI-derived one.
- `categoryPlausibility`/`parseTargetSegments` deterministic parsing path
  (`packages/core-research/src/categoryPlausibility.ts`,
  `service.ts:140,164-182`) is a precedent for "deterministic transformation
  of Search parameters, evaluated before any model call."

**Must be added:**
- A `DeterministicSignalProvider` (new file, e.g.
  `packages/core-research/src/deterministicSignals.ts`) that takes the same
  `SuppliedSourceDocuments` the AI provider already receives (website
  text, Google Places fields) and emits `ResearchSignal`-shaped, `OBSERVED`
  rows without any model call — e.g. "no website" (already known at
  Discovery time), "stale/absent SSL", "no recent content update date if
  derivable from fetched HTML", presence/absence of a contact form,
  presence of a pricing page, Google Places `rating`/`user_ratings_total`/
  `business_status`/`opening_hours` fields already returned by Discovery.
- A service-aware signal catalogue abstraction: Web Development's existing
  Q1–Q6/S5/S6 catalogue (referenced in prior audits — not located as a
  single named file in this pass; locate and confirm during Phase 1
  kickoff before reuse) must be wrapped behind a `ServiceSignalCatalogue`
  interface keyed by the one top-level service
  (`CLIENT_FINDER_TOP_LEVEL_SERVICE_ONLY_SUBSERVICES_INTERNAL_PO_DECISION.md`),
  not assumed to apply to the other 16 service families (explicit
  instruction — do not generalize it).
- Mapping from deterministic signals onto the five universal dimensions
  (`CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md`):
  which deterministic signals speak to Need/Opportunity vs. Evidence
  Quality/Freshness vs. Contactability/Current Activity/Commercial
  Readiness, for Web Development only in this first pass.
- Must NOT invent evidence a source document doesn't support — any
  dimension with no deterministic signal available stays `UNKNOWN`, never
  backfilled with a guess.

### Phase 2 — Deterministic Elimination

Map decided governance onto concrete, code-level predicates. Already
decided and already load-bearing here:
- `CLIENT_FINDER_ENTITY_REALITY_ELIGIBILITY_PO_DECISION.md` — Entity
  Reality is the only deterministic *eligibility* gate (a candidate that
  does not deterministically resolve to a real, operating entity is
  eliminated before ranking or AI ever sees it).
- `CLIENT_FINDER_SERVICE_FIT_RANKING_NOT_ELIGIBILITY_PO_DECISION.md` /
  `CLIENT_FINDER_COMMERCIAL_CONTACT_READINESS_RANKING_NOT_ELIGIBILITY_PO_DECISION.md` /
  `CLIENT_FINDER_CURRENT_ACTIVITY_CONTEXTUAL_EVIDENCE_PO_DECISION.md` — Service
  Fit, Commercial/Contact Readiness, and Current Activity are never
  elimination criteria, only ranking inputs. A category/service-specific
  deterministic elimination rule (e.g. "this is not a `{service}`-relevant
  business category at all") is separate from Entity Reality and must be
  justified per-service, not assumed universal.
- Ambiguity is preserved, not eliminated: weak, missing, or conflicting
  evidence keeps a candidate visible (low rank, not absent) —
  `CLIENT_FINDER_EVIDENCE_TRANSPARENCY_CONFLICT_STALENESS_FREELANCER_JUDGMENT_PO_DECISION.md`.
  Persistent-unreachable stays eligible (Contactability is a ranking
  factor, never a gate).
- **No numeric threshold is invented here** (e.g. no "confidence < X ⇒
  eliminate") — governance has not authorized one; where a predicate needs
  a cutoff, it is listed as a C-value in §16, not decided inline.

Code change shape (not yet implemented): a new pure function,
`eliminateDeterministically(candidate, signals) => { eligible: boolean;
reason?: string }`, called in `apps/worker/src/searchWorker/worker.ts`
between Discovery and the per-prospect loop (currently
`worker.ts:400-403`), before Research is ever invoked.

### Phase 3 — Deterministic Ranking

Implements `CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md`,
reconciled with legacy scoring by
`CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md`.

**Current code that this supersedes in function but must not be deleted
wholesale:**
- `packages/core-acquisition/src/prospectScore.ts` — `scoreProspect()`,
  the seven-factor, 0–100, user-facing score. Hard constraints #8/#13
  forbid restoring this as a ranking model or exposing a score at all.
- `packages/core-opportunity/src/service.ts:182-310` — the production call
  site: `scoreOpportunityForOwner` → `neutralScoringInputs()` (icpFit/
  abilityToPay/urgency/contactability hardcoded neutral) + `serviceFitFromOffer`
  → `scoreProspect()` → persisted via `scorePgRepository.ts` → read back via
  `toProspectScore` (`service.ts:339-367`). **This is the exact code path
  that currently exposes the 100-point number to the freelancer-facing UI**
  (`apps/web/app/(client-finder)/opportunities/...`) and is what Phase 3
  must stop doing.

**New hierarchy to implement** (ranking function, new module e.g.
`packages/core-acquisition/src/universalRanking.ts`, service-aware):
- Primary: Need/Opportunity, Service Fit
- Important: Evidence Quality, Evidence Freshness
- Supporting: Contactability, Current Activity, Commercial Readiness
- Output is an **ordering + qualitative tier label** (e.g. the existing
  `HIGH`/`MEDIUM`/`LOW` band vocabulary can be reused as a *label*, but the
  underlying 0–100 arithmetic score must not be the thing persisted or
  shown) — no numeric score field in the API/DB response shape.
- Service-specific adjustments only where Phase 1's catalogue actually
  produced a service-specific deterministic signal — never invented per
  service without evidence backing it.

**Decision previously required before this phase starts** (§16.1): the
engineering proposal referenced in the handoff contained multiple candidate
ranking formulas (tier-bucket ordinal vs. weighted-composite vs.
lexicographic-by-dimension).

**RESOLVED (see §0):** lexicographic-by-dimension, with qualitative tiers.
Concretely:
- Each of the five dimensions (Need/Opportunity, Service Fit, Evidence
  Quality, Evidence Freshness, Contactability, Current Activity, Commercial
  Readiness) is scored to one of four qualitative tiers: `STRONG`,
  `MODERATE`, `WEAK`, `UNKNOWN` — never a number.
- Candidates are ordered lexicographically: compare Primary-dimension tiers
  first (Need/Opportunity, Service Fit), then Important (Evidence Quality,
  Evidence Freshness), then Supporting (Contactability, Current Activity,
  Commercial Readiness), with the existing stable candidate ID as the final
  tie-break. No weighted composite, no numeric aggregation at any step.
- No user-facing score or band is produced from this — the qualitative tier
  labels may surface in evidence transparency (per the existing
  evidence-transparency decision) but never as a "match score."
- The existing ordinal `rank` field is retained as the output of this
  ordering (position in the lexicographic sort), not replaced by a new
  concept — only what determines that order changes.
- The legacy seven-factor `scoreProspect()` model is formally superseded as
  a ranking input by this formula, consistent with
  `CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md`.

**Call-site change (planned, not yet made):** `scoreOpportunityForOwner`'s
body is replaced to call the new ranking function instead of `scoreProspect`;
`OpportunityScoreRepository`'s stored shape changes from a numeric score to
the new qualitative structure — this is a breaking persistence-shape change
and is explicitly scoped into Phase 3, not deferred.

### Phase 4 — Cache-First Evidence Reuse

Authorized: `CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md`.
Not authorized yet: `CLIENT_FINDER_CROSS_FREELANCER_PUBLIC_EVIDENCE_REUSE_PO_DECISION.md`
and `CLIENT_FINDER_CROSS_SERVICE_EVIDENCE_APPLICABILITY_PO_DECISION.md` are
decided *in principle* but their infrastructure is explicitly **not**
authorized (Known Gap 13) — this plan does not build shared/cross-freelancer
cache storage.

**New, same-freelancer-only:**
- Before admitting a candidate to AI escalation, check
  `ResearchSignalRepository`/the new deterministic-signals store for an
  existing, non-superseded record for the same `(userId, normalizedDomain)`
  pair, honoring `CLIENT_FINDER_SIGNAL_SPECIFIC_FRESHNESS_PO_DECISION.md`
  for per-signal-kind staleness, not a single pipeline-wide TTL.
- Cache-hit outcomes to implement, each with distinct behavior:
  - **usable fresh** — skip escalation entirely, use stored evidence.
  - **stale** — eligible for escalation (does not count as a bypass), old
    evidence stays visible alongside new evidence per the
    evidence-transparency decision (nothing is silently replaced).
  - **conflicting** — both versions preserved and shown; this governs
    *reuse*, it does not resolve the conflict (freelancer judgment does).
  - **incomplete** — treated as partial reuse: usable dimensions are
    reused, missing ones still eligible for escalation.
  - **no evidence** — proceeds to elimination/ranking/escalation as a
    cold candidate.
- **New table required** (schema impact, not created in this pass):
  a same-freelancer evidence-cache index keyed by `(user_id,
  normalized_domain, signal_kind)` pointing at the latest non-superseded
  `research_signals`/deterministic-signal row, so a cache check is an
  indexed lookup rather than a full scan. Exact column list is a Phase 4
  engineering detail (category B), not blocked on PO authorization.

### Phase 5 — AI Escalation

Implements `CLIENT_FINDER_AI_ESCALATION_BOUNDARY_ARCHITECTURE_DECISION.md`
and the three companion decisions
(`..._ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_PO_DECISION.md`,
`..._ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md`,
`..._ITEM_10_AI_FRONTIER_FORMATION_PO_DECISION.md`).

**Code change shape:** in `apps/worker/src/searchWorker/worker.ts`, the
unconditional loop at `worker.ts:400-403` (`for (const prospect of
discovery.prospects) { await researchProspectForOwner(...); await
runPostResearchPipelineForOwner(...); }`) becomes:

```
rank all discovery.prospects deterministically (Phase 3: lexicographic tiers)
select an escalation set: Top-N (N = AI_ESCALATION_TOP_N, default 10) by
  rank, intersected with the admission threshold:
    Need/Opportunity >= MODERATE OR Service Fit >= MODERATE
  (Top-N applies ONLY to AI admission — it never limits what is shown to
  the freelancer; non-admitted candidates stay visible, see below)
apply strong-signal bypass: a candidate with >= 2 independent OBSERVED
  signals, each from a service-specific top-reliability signal category,
  at least one a Primary-dimension (Need/Opportunity or Service Fit)
  signal, is admitted with priority ahead of threshold-only candidates —
  but still consumes one unit from the SAME shared per-search budget,
  never an extra, uncapped allowance (no single signal, and no website-
  alone signal, ever qualifies for bypass)
budget: B = AI_ESCALATION_BUDGET (default 10) escalation units per search,
  shared across normal-threshold admission and bypass admission alike
for each admitted candidate (Research + TCM = one shared escalation unit):
  check Phase 4 cache first
  if escalation admitted and not cache-satisfied: call Research
    (unconditionally for every admitted candidate, by decision)
  call TCM only if the Search has a real, non-empty
    `parameters.targetCustomer` criterion (see Known Gap 2/
    packages/core-research/src/service.ts:191-219 — the mechanism to gate
    this already exists via the optional `deps.targetCustomerMatch`; what's
    missing is per-Search conditionality, since today it is wired
    unconditionally at apps/worker/src/index.ts:159-166 whenever the env
    config is present, regardless of whether THIS Search's targetCustomer
    is real)
for every candidate NOT admitted (deterministically ranked but outside
  Top-N/budget, or below threshold with no bypass): skip Research/TCM
  entirely, proceed straight to Phase 6/7 with deterministic-only evidence
  — the candidate is never hidden or removed for lack of AI escalation
```

**Numeric values previously NOT invented here** (§16 items 2–5): the
Top-N size, the admission threshold, the per-search escalation-unit
budget, and the strong-signal bypass rule. No rupee/token budget is
invented (unchanged — still explicit instruction).

**RESOLVED (see §0):** N = 10, B = 10 (named configurable constants, see
§21, not magic numbers), threshold = `Need/Opportunity >= MODERATE OR
Service Fit >= MODERATE`, bypass = `>= 2 OBSERVED signals from
service-specific top-reliability categories, >= 1 Primary-dimension`. All
four values/rules are reflected in the pseudocode above. N=10/B=10 are
initial engineering defaults, explicitly subject to revision after
measurement — not final tuned values.

### Phase 6 — AI Failure / Fallback

Required behavior, all new:
- Wrap the `deps.provider.research(...)` call (`service.ts:149`) and the
  `evaluateTargetCustomerMatch(...)` call (`service.ts:198`) each in a
  try/catch at the **candidate** level, inside
  `researchProspectForOwner`/the new escalation-gated caller in
  `worker.ts` — never at the Search level. Today, any thrown error
  propagates out of `runCanonicalPipeline` (`worker.ts:369-406`) and is
  caught only at `claimAndProcessNextSearch` (`worker.ts:252-279`), which
  marks the **entire Search** attempt as failed/retried — this is exactly
  the "Research failure currently fails the entire Search instead of only
  the candidate" gap and must change.
- Provider-unavailable, retry-exhaustion (the existing retry/backoff logic
  already inside `researchLead()`/`createFallbackResearchProvider`), and
  budget-exhausted (Phase 5's Top-N/threshold gate) all route to the same
  candidate-level "AI not available for this candidate" outcome — the
  candidate proceeds to Phase 7 with whatever deterministic evidence
  Phase 1–3 already produced for it.
- Provenance marking: a new field on the stored result (not a schema
  change to `ResearchSignal` itself, but to whatever Phase 7's "Minimum
  Useful Lead Result" assembly reads) distinguishing `AI_ENRICHED` vs.
  `DETERMINISTIC_ONLY` per candidate, and if `DETERMINISTIC_ONLY`, *why*
  (not escalated / escalation failed / provider exhausted) — this is
  provenance metadata, not a new user-facing score.

### Phase 7 — Minimum Useful Lead Result

Implements `CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md`. All
required fields are already producible deterministically after Phases 1–3:
entity (Discovery), why found (deterministic signals), supporting evidence
(Phase 1), Need/Opportunity + potential Service Fit + subservice(s) (Phase
1 mapping + Phase 3 ranking dimensions), available/missing contact info
(existing `contactValueExtraction.ts` — unaffected), source/date/provenance
(existing capture mechanism, extended per Phase 6). Where a field is
AI-derived only in today's implementation, Phase 7 defines the
deterministic-evidence-or-UNKNOWN fallback explicitly rather than leaving a
blank.

### Phase 8 — Service Catalogue Expansion

Planning only, no implementation in this pass. Recommended sequencing:
keep the `ServiceSignalCatalogue` interface from Phase 1 and implement one
additional service family at a time, choosing the next by whichever has
the most existing deterministic signal availability from Discovery's
Google Places data (same evidence-availability-first logic used for Web
Development), not all 16 at once.

### Phase 9 — Discovery-Quality Launch Gate

Turns `CLIENT_FINDER_DISCOVERY_QUALITY_LAUNCH_GATE_PO_DECISION.md` into a
procedure: a manual/scripted validation pass over a sample of real
Searches post-Phase-7, using categorical coverage (e.g. "does every
candidate reach at least Minimum Useful Lead Result" / "is elimination
rate within an expected qualitative range") rather than an invented pass
percentage. Requires zero paid LLM calls to execute, since it inspects
deterministic coverage, not AI output quality.

### Phase 10 — Regression / Compatibility

Explicit checks before any phase is considered done:
- K1 chain (`worker.ts:482-533`) — unaffected, since this plan only changes
  what happens *before* `runPostResearchPipelineForOwner`, not that
  function itself.
- Contact extraction/masking — unaffected (`contactValueExtraction.ts` not
  touched by any phase here).
- ₹1,499 subscription access/unlock — unaffected (`packages/core-subscriptions`
  not touched by any phase here); note the working tree currently has
  unrelated in-flight changes to this package for the ₹1,499 feature,
  which this plan does not depend on or interact with.
- Existing deterministic Opportunity behavior and evidence provenance —
  extended, not replaced (Phase 1/6 add fields, Phase 3 changes the score
  shape only).
- Existing tests — `prospectScore.test.ts` keeps passing (function
  untouched); `scoreOpportunityForOwner`'s own tests
  (`packages/core-opportunity/src/service.test.ts`) WILL need rewriting in
  Phase 3 since the call site changes — flagged here, not treated as a
  "do not modify tests" violation, since Phase 3 is an authorized,
  in-scope behavior change once approved.

## 4. Exact Repository Areas Affected

| Area | Change |
|---|---|
| `packages/core-research/src/service.ts` | Gate `provider.research()` (line 149) and `evaluateTargetCustomerMatch()` (line 198) behind Phase 5 admission; candidate-level try/catch (Phase 6) |
| `packages/core-research/src/deterministicSignals.ts` (new) | Phase 1 deterministic signal generation |
| `packages/core-discovery/src/normalize.ts` | **Not modified by this plan** — Known Gap 12 explicitly deferred |
| `packages/core-acquisition/src/universalRanking.ts` (new) | Phase 3 ranking function |
| `packages/core-acquisition/src/prospectScore.ts` | Left in place, no longer the ranking path for Opportunities |
| `packages/core-opportunity/src/service.ts` | `scoreOpportunityForOwner` body + `toProspectScore`/persistence shape changed (Phase 3) |
| `packages/core-opportunity/src/scorePgRepository.ts` / `scoreRepository.ts` | Persisted shape changes from numeric score to qualitative ranking (Phase 3) |
| `apps/worker/src/searchWorker/worker.ts` | `runCanonicalPipeline`'s per-prospect loop (lines 400-403) restructured: elimination → ranking → cache → escalation gate (Phases 2-6) |
| `apps/worker/src/index.ts` | `targetCustomerMatch` wiring (lines 159-166) becomes per-Search-conditional, not blanket env-based (Phase 5) |
| `apps/web/app/(client-finder)/opportunities/**` | Score display removed/replaced with qualitative ranking (Phase 3 downstream) |

## 5. Data-Model / Schema Impact

- Phase 3: `OpportunityScore`'s persisted shape changes (migration required
  — not created in this pass).
- Phase 4: new same-freelancer evidence-cache index table (migration
  required — not created in this pass).
- Phase 6: provenance marking (`AI_ENRICHED`/`DETERMINISTIC_ONLY` + reason)
  — likely a column addition on whatever table backs Phase 7's assembly
  (migration required — not created in this pass).
- No change to `research_signals`, `category_plausibility`, or
  `target_customer_match` table shapes themselves.

## 6. API / Worker / Orchestration Impact

- `runResearchForOwner`'s signature is unchanged; its *callers* change
  (gated invocation from `worker.ts`, not from inside `service.ts` itself
  — keeping the escalation decision in orchestration, not buried in the
  domain function).
- `SearchWorkerDeps`/`ProspectPipelineDeps` gain new optional fields for
  the deterministic-signal provider, the ranking function, and the cache
  repository, following the existing optional-dependency convention
  already used for `categoryPlausibility`/`targetCustomerMatch`.
- No new queue/broker/scheduler — same in-process polling loop.
- Any HTTP route reading `OpportunityScore` (web app) changes its response
  shape per Phase 3 — needs an explicit inventory of call sites before
  that phase starts (not fully enumerated in this pass; `apps/web/app/
  (client-finder)/opportunities/[id]/page.tsx` is at minimum one).

## 7. Deterministic Signal Architecture

See Phase 1. Key design point: deterministic and AI-derived signals share
one `ResearchSignal`-compatible shape and one provenance-capture format, so
every downstream consumer (ranking, Minimum Useful Lead Result, evidence
transparency UI) treats them uniformly except for the `basis`/provenance
tag — there is no second code path for "deterministic evidence."

## 8. AI Escalation Architecture

See Phase 5. Key invariants: Research + TCM = one shared unit; bypass
still spends from the same budget; TCM is conditional on a real
`targetCustomer` criterion existing for that Search (not merely on
whether the dependency object is configured, which is today's actual
gate — see Known Gap 2).

## 9. Failure / Fallback Behavior

See Phase 6. Key invariant: no exception path inside Research/TCM may
propagate past the single candidate it concerns.

## 10. Minimum Useful Lead Result Behavior

See Phase 7.

## 11. Service Expansion Strategy

See Phase 8 — sequential, evidence-availability-driven, one family at a
time.

## 12. Discovery-Quality Launch-Gate Implementation

See Phase 9 — categorical, zero mandatory LLM cost.

## 13. Test Strategy

- Phase 1: unit tests for `deterministicSignals.ts` against fixture source
  documents/Google Places payloads — no network, no model.
  Phase 2: unit tests for `eliminateDeterministically` covering the
  ambiguity-preservation cases explicitly (weak/missing/conflicting must
  NOT eliminate).
- Phase 3: unit tests for the new ranking function, specifically the
  lexicographic tier ordering (§0/§16.1) — Primary dimension ties broken
  by Important, Important ties broken by Supporting, final tie-break by
  stable ID; `UNKNOWN` tiers sort as lowest within their dimension;
  rewritten `service.test.ts` coverage for `scoreOpportunityForOwner`
  against the new shape (no numeric field present in the response).
- Phase 4: unit tests per cache-hit category (fresh/stale/conflicting/
  incomplete/none).
- Phase 5: integration tests in `worker.test.ts` covering the resolved
  §0/§16 values directly:
  - Research/TCM **not** called for a candidate ranked outside Top-N
    (N=10) even when otherwise eligible (a new, currently-absent case —
    today's tests only assert the unconditional-call behavior).
  - Research/TCM **not** called for a candidate below the admission
    threshold (`Need/Opportunity < MODERATE AND Service Fit < MODERATE`)
    and without a qualifying bypass.
  - a candidate with exactly 1 strong signal, or only a website signal,
    does **not** bypass — bypass requires >= 2 OBSERVED signals from
    top-reliability categories with >= 1 Primary-dimension signal.
  - a qualifying bypass candidate is admitted even below threshold, but
    still consumes one unit of the shared budget (assert budget
    decrements identically for threshold-admission and bypass-admission).
  - total escalation units consumed in a single search never exceeds
    B=10, including when bypass-eligible candidates outnumber remaining
    budget (excess bypass-eligible candidates are NOT admitted once the
    budget is exhausted).
  - candidates outside Top-N/budget still appear in the Search's results
    with deterministic-only evidence (never silently dropped).
- Phase 6: unit tests asserting a thrown Research/TCM error does not fail
  the Search attempt and does not remove the candidate from results.
- See §22 for the full zero-LLM-cost verification test plan (cross-cutting
  Phase 2/3/5/6).
- Run targeted suites per package touched, not the full monorepo suite,
  per this repo's stated efficiency rules — a full `pnpm test` run is
  justified only at the end of Phase 5/6 given their cross-package
  orchestration surface.

## 14. Regression Risks

- Highest risk: Phase 3's persisted-shape change breaks any existing
  reader of `OpportunityScore` that assumes a numeric `score` field —
  requires a full caller inventory before that phase starts.
- Medium risk: Phase 5's restructuring of `worker.ts:400-403` interacts
  with the existing idempotency/retry story (`runCanonicalPipeline`'s own
  doc comment on retry-safety) — the elimination/ranking/cache/escalation
  steps must each stay safe to redo on a Search retry, the same property
  Discovery/Research persistence already has.
- Low risk: Phase 1/6 additive fields — standard additive-migration risk.

## 15. Migration / Backward-Compatibility Considerations

Three migrations are anticipated (Phase 3 score-shape, Phase 4 cache
index, Phase 6 provenance column) — none created in this pass per the hard
constraint. Each should be additive/non-destructive where possible (new
columns/tables rather than dropping the old score column outright, at
least through one deploy cycle) to keep rollback cheap.

## 16. Values / Configuration Requiring Explicit Authorization

These were implementation blockers, not silent engineering choices. Items
1–5 are **RESOLVED as of 2026-10-13 — see §0** for the decided values;
the original item text is preserved below as the historical record of
what was open and why, each followed by its resolution.

1. **Ranking formula selection** (Phase 3) — tier-bucket ordinal vs.
   weighted-composite vs. lexicographic-by-dimension; the engineering
   proposal still lists more than one.
   **RESOLVED (§0):** lexicographic-by-dimension with qualitative tiers
   `STRONG/MODERATE/WEAK/UNKNOWN`, Primary → Important → Supporting →
   stable ID. No composite score.
2. **Top-N size** for AI escalation (Phase 5).
   **RESOLVED (§0):** N = 10. Applies only to AI admission, not to what is
   shown to the freelancer.
3. **Admission threshold** that ANDs with Top-N (Phase 5).
   **RESOLVED (§0):** `Need/Opportunity >= MODERATE OR Service Fit >=
   MODERATE`. Controls AI escalation only, never eligibility.
4. **Per-search shared escalation-unit budget** (Phase 5) — Research + TCM
   combined.
   **RESOLVED (§0):** B = N = 10 units/search. No rupee/token budget.
   Must be a named configurable constant (§21), not a magic number.
5. **Strong-signal bypass rule definition** — what counts as a "strong
   signal" concretely, beyond the principle already decided in
   `..._ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md`.
   **RESOLVED (§0):** >= 2 independent OBSERVED signals, each from a
   service-specific top-reliability signal category, >= 1 of them a
   Primary-dimension (Need/Opportunity or Service Fit) signal. No website
   alone, no single signal, qualifies. Bypass changes admission
   priority/threshold only — never Top-N or budget.
6. **Deterministic elimination predicates beyond Entity Reality** — any
   category/service-specific elimination rule needs its own per-service
   justification, not a numeric threshold invented here. **Still open —
   not part of the five-item §0 resolution.**
7. **Phase 4 cache table column/index design** — this one is category B
   (an engineering choice, not requiring PO sign-off), listed here only
   for completeness since it's a new table. **Still open — engineering
   choice, unaffected by §0.**

## 17. Files That Should Be Modified (once authorized, per phase)

`packages/core-research/src/service.ts`,
`packages/core-research/src/deterministicSignals.ts` (new),
`packages/core-acquisition/src/universalRanking.ts` (new),
`packages/core-opportunity/src/service.ts`,
`packages/core-opportunity/src/scorePgRepository.ts`,
`packages/core-opportunity/src/scoreRepository.ts`,
`apps/worker/src/searchWorker/worker.ts`,
`apps/worker/src/index.ts`,
relevant test files alongside each (`*.test.ts` siblings — modified as part
of the authorized behavior change in each phase, not incidentally).

## 18. Files That Must NOT Be Modified (in this effort)

`packages/core-discovery/src/normalize.ts` (Known Gap 12 — explicitly
out of scope unless separately authorized), anything under
`packages/core-identity`, `packages/core-payments`, `packages/core-subscriptions`,
`packages/rate-limit`, `apps/web/src/checkout/**`, `apps/web/src/server/session.ts`,
`apps/web/app/api/auth/**`, `apps/web/app/api/payments/**`,
`apps/web/app/api/webhooks/**` — all currently mid-flight for the unrelated
₹1,499 subscription feature and unrelated to this architecture.

## 19. Implementation Sequencing / Dependencies

```
Phase 0 (baseline) → Phase 1 (deterministic signals)
  → Phase 2 (elimination, depends on Phase 1 signals)
    → Phase 3 (ranking, depends on Phase 1 signals + Phase 2 eligibility)
      → Phase 4 (cache, depends on Phase 1 signal shape)
        → Phase 5 (AI escalation, depends on Phase 2+3+4 all being in place
                    — admission requires elimination+rank+cache-check first)
          → Phase 6 (fallback, wraps Phase 5's calls)
            → Phase 7 (Minimum Useful Lead Result, depends on Phases 1-6)
              → Phase 10 (regression pass)
Phase 8 (service expansion) and Phase 9 (launch gate) follow Phase 7,
independently of each other.
```

Phase 5 previously could not start until §16 items 1–5 were answered — it
was the hard gate on this sequence, not Phase 3. **RESOLVED (see §0):**
items 1–5 are now decided; Phase 3 and Phase 5 are both sequence-ready
subject only to Phase 0 baseline and their stated dependencies above (no
PO-decision gate remains on this sequence). Item 6 (elimination
predicates beyond Entity Reality) and item 7 (cache table design, category
B) remain open per §16 but do not block Phases 0–7 as scoped in this plan.

## 20. Final Implementation-Readiness Assessment

**Phases 0, 1, 2, 6, 7, 10: implementation-ready** once authorized — no
outstanding numeric/formula decision blocks them.

**Phase 3: implementation-ready.** The ranking-formula selection (§16.1)
is **RESOLVED (§0)** — lexicographic tiers, Primary → Important →
Supporting → stable ID. The code change (replacing
`scoreOpportunityForOwner`'s body and the persisted shape) is fully
specified; no PO decision remains outstanding for this phase.

**Phase 4: ready** — same-freelancer cache reuse is fully authorized;
only the table's column design is an engineering choice (category B).

**Phase 5: implementation-ready.** §16 items 2–5 (Top-N, threshold,
budget, strong-signal definition) are **RESOLVED (§0)** — N=10, B=10
(as named configurable constants, §21), threshold =
`Need/Opportunity >= MODERATE OR Service Fit >= MODERATE`, bypass =
`>= 2 OBSERVED signals, >= 1 Primary-dimension, from top-reliability
categories`. The architecture (CF-AI-ESCALATION-BOUNDARY-ARCH-DEC-001) and
the numbers it needed are both now decided; no PO decision remains
outstanding for this phase. Implementation of Phase 5 should still follow
Phase 0–4 per the dependency chain above (admission requires
elimination + rank + cache-check first) — resolution of the numbers does
not change the sequencing dependency.

**Phase 8, 9: planning-only in this pass**, by design — not blockers to
starting Phase 0–4.

No PO decision is reopened by this plan; no numeric value is silently
chosen (the §0 values were supplied by the Product Owner, not inferred by
this plan); the legacy seven-factor model is not resurrected as a ranking
source (only left in place, unused for ranking, since nothing requires
deleting it); no mandatory paid LLM path is introduced; AI never
determines eligibility or ranking in this design — it only enriches
evidence for an already-ranked, already-eligible candidate. This plan
does not itself implement any phase — §0's resolutions remove the
remaining decision blockers but do not constitute implementation
authorization (see Final Authorization Checkpoint, end of this document's
companion report).

## 21. Configuration Defaults (§0 Resolution — Named Constants)

Per §0/§16, the following must be implemented as named configurable
constants — never as inline magic numbers — when Phase 5 is built. No
values are set in code by this planning pass; this section records what
Phase 5's implementation must declare and where.

| Constant (proposed name) | Value | Scope | Status |
|---|---|---|---|
| `AI_ESCALATION_TOP_N` | 10 | Per search — caps AI admission only, never candidates shown | Initial engineering default, subject to revision after measurement |
| `AI_ESCALATION_BUDGET` | 10 | Per search — shared unit budget, Research+TCM combined, threshold+bypass combined | Initial engineering default, subject to revision after measurement |
| `AI_ESCALATION_ADMISSION_THRESHOLD` | `Need/Opportunity >= MODERATE OR Service Fit >= MODERATE` | Per candidate — gates normal (non-bypass) AI escalation only | PO-decided rule, not a tuning default |
| `STRONG_SIGNAL_BYPASS_RULE` | `>= 2 OBSERVED signals AND >= 1 from top-reliability category AND >= 1 Primary-dimension (Need/Opportunity or Service Fit)` | Per candidate — priority admission within the same budget | PO-decided rule, not a tuning default |

`AI_ESCALATION_TOP_N` and `AI_ESCALATION_BUDGET` are explicitly flagged as
*initial engineering defaults* in the governance resolution (§0 item 4) —
they are the numbers to ship with, not numbers to treat as permanently
fixed. The admission-threshold and bypass rules are PO policy decisions,
not tuning parameters, and should not be revised without a new PO
decision even though they are also implemented as named constants for
maintainability.

## 22. Zero-LLM-Cost Verification Plan

Cross-cutting test plan proving the escalation boundary actually holds
once Phases 2–6 are implemented. These are integration-level tests against
`apps/worker/src/searchWorker/worker.ts` and `packages/core-research/src/service.ts`,
not unit tests of a single function:

1. **Search can make zero AI calls.** A search whose every candidate ranks
   below the admission threshold and has no qualifying bypass completes
   with zero calls to `provider.research()` and zero calls to
   `evaluateTargetCustomerMatch()`. Assert call counts, not just output
   shape.
2. **Candidates can be shown without AI.** The same zero-AI-call search
   still returns Minimum Useful Lead Result (Phase 7) entries for every
   candidate, each marked `DETERMINISTIC_ONLY` (Phase 6 provenance field),
   none silently dropped.
3. **No candidate outside the AI boundary triggers AI.** For a mixed
   search (some above threshold, some below, some bypass-qualifying, some
   plain below-threshold), assert the exact set of candidates for which
   Research/TCM were invoked equals the exact set computed by Top-N ∩
   (threshold ∪ bypass) ∩ remaining-budget — not a superset, not a subset.
4. **Max 10 escalation units/search.** Construct a search with more than
   10 admission-eligible candidates (threshold and/or bypass) and assert
   total Research+TCM invocation count never exceeds `AI_ESCALATION_BUDGET`
   (10), and that admission stops in rank order once the budget is spent.
5. **Bypass cannot exceed budget.** Construct a search where bypass-
   eligible candidates alone exceed the budget; assert bypass admissions
   are capped by the same shared budget as threshold admissions (no
   separate, larger allowance for bypass) and that excess bypass-eligible
   candidates proceed to Phase 6/7 as `DETERMINISTIC_ONLY`.
6. **AI failure does not remove candidates.** For an admitted candidate
   whose Research and/or TCM call throws (Phase 6), assert: (a) the Search
   attempt as a whole does not fail/retry, (b) the candidate is still
   present in the Search's results, (c) it is marked `DETERMINISTIC_ONLY`
   with a reason distinguishing "escalation failed" from "not escalated"
   (Phase 6), and (d) the candidate still carries whatever Phase 1–3
   deterministic evidence/ranking it already had.

These tests belong in Phase 5/6's test suites (§13) and should be the
suites run before either phase is considered done — not the full
monorepo suite, per this repo's stated testing-efficiency rules, unless a
cross-package regression is specifically suspected.
