# Client Finder — Item #8: AI Escalation Cost Architecture — INVESTIGATION ONLY

> **STATUS: READ-ONLY ARCHITECTURE / COST INVESTIGATION.**
> **IMPLEMENTATION NOT AUTHORIZED.**
> **NO CODE / CONFIG / DATABASE / ENVIRONMENT CHANGES MADE.**
> **NO API CREDITS PURCHASED. NO COMMIT / PUSH / DEPLOY PERFORMED.**
> This document records investigation findings only, to give the Product Owner
> evidence for the Item #8 decision. It does not itself constitute a PO
> decision and creates no new governance record.

Date: 2026-10-11

---

## 1. Executive Summary

The current implementation sends **every discovered candidate** through
**two unconditional, sequential LLM calls** (research, then target-customer
match) with no deterministic pre-filter, no caching, and no guard against
re-researching the same business. This directly contradicts the
already-decided deterministic-first principle (Item #4) in practice, even
though that principle is formally authorized — it simply has not been
engineered into the pipeline yet. Combined with a per-call retry budget of
up to 3 attempts each, the worst-case cost envelope is **6 billed model
invocations per candidate**, with no upper bound at the search level other
than how many candidates Discovery returns.

No reliable rupee cost figure exists anywhere in the repository. The
previously circulated "₹50/search" figure is explicitly refuted in existing
governance documentation, and the only cost arithmetic in the repo
(`docs/MONETIZATION.md`) is self-labeled as an unmeasured estimate based on
list prices, not a measured baseline. **Actual API cost must be treated as
unknown until a real, instrumented measurement is taken** — the
infrastructure to record it (`packages/core-ai-usage`) already exists but
has never captured a real model call.

The single highest-leverage, already-governance-clean fix is not a new
escalation algorithm — it is implementing what is **already PO-decided but
not yet built**: (a) a real deterministic pre-AI signal/scoring layer
(Item #4/#5/#6/#7), and (b) same-freelancer evidence reuse before issuing a
new research call (Item #11). Everything else in this report (Top-N,
thresholds, adaptive stopping, call-granularity changes, model routing)
is evaluated as an additional layer on top of that baseline gap, not a
substitute for closing it.

---

## 2. Current AI-Cost Baseline (measured from code, not estimated)

| Fact | Value | Citation |
|---|---|---|
| LLM calls per candidate (production wiring) | 2 (research + target-customer-match), both unconditionally wired | `apps/worker/src/index.ts:159-166`; `packages/core-research/src/service.ts:119-222,191-219` |
| Retry budget per call | `maxAttempts: 3`, full-jitter exponential backoff (base 1s, max 30s cap) | `packages/core-research/src/researcher.ts:142-158`; `packages/core-research/src/targetCustomerMatch.ts:206` |
| Worst-case billed calls/candidate | 6 (3 retries × 2 call sites) | derived from above |
| Cross-provider fallback default | **Off** — `RESEARCH_FALLBACK_PROVIDER` unset by default, so only one provider attempt chain runs | `packages/config/src/env.ts:88,92`; `apps/worker/src/index.ts:109-122` |
| Default provider / model | `anthropic` / `claude-opus-5` | `packages/config/src/env.ts:88`; `packages/core-research/src/anthropicModel.ts:63`; `docs/AI-ENGINE.md:5` |
| Candidate processing order | Strictly sequential, `for...of` with `await`, no `Promise.all`/batching | `apps/worker/src/searchWorker/worker.ts:400-403` |
| Deterministic pre-filter before AI | **None found** | confirmed negative across `core-discovery`, `core-research`, `core-qualification` |
| Caching/reuse anywhere in pipeline | **None found** (confirmed negative, repo-wide grep) | see §8 |
| Candidates per search (real volume) | **Unknown** — no production data in repo | `docs/AI-ENGINE.md:113-119` ("UNKNOWN... Unmeasured") |
| Repair-rate / token-profile assumptions | Assumed 25–30% repair rate, assumed ~10,400 input tokens — both explicitly labeled unmeasured | `docs/AI-ENGINE.md:113-119` |
| "₹50/search" figure | **No documentary basis anywhere in the repo** — explicitly refuted | `requirement/CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md:17,66` |
| Pricing constants in code | **None exist** (confirmed negative in `core-ai-usage`, `core-research`, `config`) | — |
| Measured historical usage/cost data | **None exists** — test fakes only, "no live Anthropic call has ever been made from this repository" | `packages/core-ai-usage/src/testSupport.ts:1-39`; `docs/AI-ENGINE.md:3` |

---

## 3. Current Runtime Call Graph

```
Search claimed by worker (apps/worker/src/searchWorker/worker.ts:239)
  └─ runCanonicalPipeline (worker.ts:369-406)
       ├─ Discovery: runDiscoveryForOwner (core-discovery/src/service.ts:93-132)
       │     └─ Google Places provider.discover() (core-discovery/src/googlePlacesProvider.ts:17-28)  [NON-AI, external API]
       │     └─ normalizeCandidate() — shape validation only, NOT elimination (core-discovery/src/normalize.ts:43-52)
       │     └─ Company/Prospect dedup+persist (findOrCreateByDomain / findOrCreate) (core-discovery/src/pgRepository.ts:35-49,85-99)
       │
       └─ for each Prospect (SEQUENTIAL, no batching) — worker.ts:400-403
            ├─ researchProspectForOwner → runResearchForOwner (core-research/src/service.ts:119-222)
            │     ├─ CALL A — main research (service.ts:149-158)
            │     │     provider.research() → fallbackResearchProvider (fallbackResearchProvider.ts:81-139)
            │     │     → researchLead() (researcher.ts:162-313) → model() [LLM CALL, ≤3 attempts]
            │     │     → produces: research signals, categoryPlausibility (NOT a separate call — same schema, schema.ts:297)
            │     │
            │     └─ CALL B — target-customer-match (service.ts:191-219)
            │           evaluateTargetCustomerMatch() → callTargetCustomerMatchModel()
            │           → model() [LLM CALL, ≤3 attempts] (targetCustomerMatch.ts:230-308)
            │           → explicitly documented as "dedicated, independent... not call-shared with
            │             categoryPlausibility" (targetCustomerMatch.ts:17-18; service.ts:74-77)
            │
            └─ runPostResearchPipelineForOwner (worker.ts:450-536)  [NON-AI from here down]
                  ├─ Opportunity: findByProspectId else create (core-opportunity/src/service.ts:112)
                  ├─ scoreOpportunityForOwner — deterministic 7-factor weighted score,
                  │     NO model call (core-acquisition/src/prospectScore.ts; FACTOR_WEIGHTS lines 40-48)
                  ├─ Qualification / Personalization / Outreach Prep / Follow-up Prep (each gated, non-AI logic)
                  │
Separate, on-demand: rankOpportunities (core-opportunity/src/service.ts:357-372)
      — pure comparator sort over persisted scores, "never recomputes a score"
```

`contactValueExtraction.ts` makes **no LLM call** — pure regex over already-persisted
signal text (confirmed by direct read of the file).

---

## 4. Identified Unnecessary / Duplicate AI Work

1. **No deterministic pre-filter before AI at all.** Every shape-valid
   candidate (passes only `normalizeCandidate`'s name/website check) goes
   straight to 2 unconditional LLM calls. This is the single largest cost
   driver and the direct inverse of the already-authorized Item #4
   deterministic-first principle — the principle exists on paper, the code
   doesn't implement it yet.
2. **Target-customer-match (Call B) is unconditionally invoked for every
   candidate**, regardless of what Call A's research found. No staging or
   gating exists between the two calls even though both read the exact same
   already-fetched source documents (`fallbackResearchProvider.ts:92-99`).
3. **Search-attempt retries re-run AI research for every prospect**,
   including ones already successfully researched in a failed prior
   attempt. `runCanonicalPipeline`'s per-prospect loop has no "already has
   fresh signals" skip — unlike Opportunity creation, which *does* check
   first (`findByProspectId`, `worker.ts:455-468`). Research persistence is
   idempotent (supersede-then-insert) for *correctness*, not for *cost* —
   nothing stops re-billing.
4. **Already-authorized same-freelancer evidence reuse (Item #11) is simply
   not implemented.** A repeat or materially-equivalent search by the same
   freelancer re-runs Discovery and both AI calls from scratch for every
   candidate (`§5b` below) — the one PO decision most directly aimed at
   avoiding exactly this cost has no code behind it yet.
5. **Validation-repair rounds are full billed re-calls, not free retries.**
   With an assumed (unmeasured) 25–30% repair rate, real call volume could
   run materially above the "2 calls/candidate" headline figure.
6. Cross-provider fallback is correctly *not* duplicating cost by default
   (only one provider chain runs unless `RESEARCH_FALLBACK_PROVIDER` is
   explicitly set) — this is not currently a source of waste.

---

## 5. Escalation Architectures (≥5, materially different)

All five assume the only structural prerequisite common to every
cost-reduction path: a **real deterministic pre-AI signal/score** (per
Items #4–#7, not yet built in code — see §4.1). Without it, "escalate only
strong/top candidates" has nothing deterministic to rank on, and any of the
architectures below would have to fall back to escalating everyone (today's
behavior) for services where that layer doesn't exist yet.

### Architecture 1 — Fixed Top-N AI Frontier
Deterministic score ranks all discovered candidates; only the top N per
search are sent to AI.
- Deterministic work before AI: full ranking of the candidate pool.
- AI trigger: rank position ≤ N.
- Cache lookup before new AI: none inherent (combinable with §6/§8).
- Max AI calls/candidate: 2 (today's call shape) or 1 if staged (§7).
- Max AI calls/search: N × 2 (or N × 1 staged) × retry factor.
- Typical case: cannot be estimated — candidate volume/search is unknown (§I).
- Model routing: none inherent.
- Batching: none inherent.
- Strong-signal bypass: not inherent — needs combining with Architecture 5.
- Adaptive stopping: no.
- Quality/recall risk: candidates ranked N+1..end are never AI-qualified even
  if the search returns few strong candidates — risk is highest on sparse
  or low-quality searches.
- Complexity: low (one tunable: N).
- Service-specific compatibility: fine, but N may need to vary per service
  given Item #5's service-specific weighting — a single global N risks being
  wrong for some of the 17 families.
- Failure modes: a search with < N qualifying prospects wastes nothing (N is
  a ceiling, not a floor), but a search with many strong prospects beyond N
  silently drops real opportunities.
- Repeated search avoids AI via cache: not inherent — depends on §8.

### Architecture 2 — Score-Threshold Escalation
AI triggered only when deterministic score ≥ threshold T, with no count cap.
- Deterministic work before AI: full scoring (ranking not required, just
  the score value).
- AI trigger: score ≥ T.
- Max AI calls/candidate: 2 (or 1 staged).
- Max AI calls/search: **unbounded** — could be 0 or could be every
  candidate, depending on pool composition, unless paired with a budget cap.
- Quality/recall risk: adapts naturally to search quality (good searches
  escalate more, weak searches escalate less/none) — better recall
  properties than fixed Top-N, but no worst-case cost bound on its own.
- Complexity: low-medium (one tunable: T, but T must be calibrated per
  service per Item #5).
- Service-specific compatibility: requires a threshold per service family;
  services without a deterministic signal set yet have no T to apply.
- Failure modes: an unusually strong candidate pool (e.g., a dense,
  high-intent geography) could spike cost with no ceiling.
- Repeated search avoids AI via cache: not inherent — depends on §8.

### Architecture 3 — Hybrid Top-N + Threshold + Bounded Budget
Rank deterministically, escalate only candidates both above threshold T and
within rank N, hard-capped at a per-search AI call budget B.
- Deterministic work before AI: full ranking + scoring.
- AI trigger: `rank ≤ N AND score ≥ T`, stop entirely once B calls spent.
- Max AI calls/candidate: 2 (or 1 staged).
- Max AI calls/search: `min(N, pool-above-T) × 2`, hard-ceilinged by B — the
  only architecture here with a true, enforced worst-case bound.
- Quality/recall risk: lowest of the threshold-family options, because N and
  T jointly guard against both "too many weak escalations" and "unbounded
  spend on a dense pool"; residual risk is calibration error in N/T/B.
- Complexity: medium-high (three tunables, each needing a PO/eng decision,
  each potentially service-specific).
- Service-specific compatibility: good, once N/T/B are set per service;
  degrades to "no filter" for services lacking deterministic signals (same
  caveat as above).
- Failure modes: if B is set too low, strong candidates past the budget are
  dropped with no visibility into what was missed unless logged.
- Repeated search avoids AI via cache: not inherent — depends on §8.

### Architecture 4 — Adaptive Stopping (Yield-Based)
Process deterministically-ranked candidates strongest-first, one at a time;
after each AI result, check whether enough *useful* qualified opportunities
have been produced; stop early if so, otherwise continue until budget or
pool exhausted.
- Deterministic work before AI: ranking (order matters a lot here, unlike
  threshold-only).
- AI trigger: next-ranked candidate, evaluated one at a time (pipeline is
  already sequential today, so this fits the existing loop shape).
- Max AI calls/candidate: 2 (or 1 staged).
- Max AI calls/search: bounded by budget B, but *typically* lower than
  Architecture 3 on easy searches because it can stop before reaching N.
- Quality/recall risk: the most cost-efficient on "easy" searches (stops
  early), but introduces order-sensitivity — a weak candidate early in rank
  order that happens to look "useful enough" could end the search
  prematurely, missing a stronger candidate ranked just behind it. Needs a
  careful, non-naive definition of "useful" (score threshold on the AI
  *output*, not just the deterministic input).
- Complexity: highest of the five — requires defining and tuning a
  post-AI "useful opportunity" test, plus a stop rule, plus a budget
  fallback.
- Service-specific compatibility: the "useful" bar likely needs to be
  service-specific too (Item #5).
- Failure modes: risk of stopping too early on marginal evidence; needs
  safeguards (e.g., a minimum floor of candidates evaluated before stopping
  is allowed) to avoid under-escalating on noisy early signals.
- Repeated search avoids AI via cache: not inherent — depends on §8.

### Architecture 5 — Strong-Signal Bypass Layered on Any of the Above
A candidate whose deterministic signal is independently strong enough
escalates immediately regardless of general rank/threshold position (this
principle is **already PO-authorized**, Item #9 — only the concrete
mechanism is open).
- This is not a standalone architecture — it's a cross-cutting override
  that can sit on top of Architectures 1–4. Documented separately because
  the investigation prompt calls for its own cost/trigger/risk profile.
- Deterministic work before AI: a secondary, independent "is this strong
  enough to bypass the general policy" check, distinct from the general
  rank/score.
- AI trigger: bypass condition true, independent of N/T/B/yield state.
- Max AI calls/search: no additional bound of its own — depends entirely on
  how many candidates can satisfy the (currently undefined) bypass
  condition; could blow through a Top-N or budget cap unless the bypass
  condition itself is written to respect the budget.
- Quality/recall risk: lowest risk of missing an obviously strong
  opportunity to an arbitrary cutoff; highest risk of being a backdoor that
  silently defeats whatever cost ceiling Architecture 1–4 was meant to
  enforce, if not bounded.
- Complexity: medium — needs its own deterministic bypass condition (not yet
  specified) and, critically, needs to be defined as either inside or
  outside the per-search budget B.
- Failure modes: if bypass is unbounded and the bypass condition is too
  loose, it reintroduces unbounded cost through the back door.

**Two further cross-cutting, combinable (not alternative) layers** are
analyzed separately because they change the shape of individual calls
rather than the trigger policy:

- **Cache-first gate** (§8) — applies *before* any of Architectures 1–5 are
  even evaluated for a given Company: if sufficiently fresh same-freelancer
  evidence already exists, skip Call A entirely for that Company.
- **Call-granularity change** (§6) — changes whether each escalated
  candidate costs 1 or 2 calls, independent of which trigger policy
  (1–5) selects it.

---

## 6. AI Call Granularity — Research vs. Target-Customer-Match

**Do not combine merely because it is cheaper — here is the actual
trade-off, as requested.**

- **Output/schema requirements.** The two calls use separate, independently
  defined schemas and system prompts (`researcher.ts` / `schema.ts:297` for
  research; `targetCustomerMatch.ts:170-188` for match). Research answers a
  broad lead-classification question; match answers a narrower
  "is this a target-customer" question. A combined schema would need to
  represent both in one structured response.
- **This was very likely a deliberate prior engineering decision, not an
  oversight.** The code explicitly documents the match call as "a
  dedicated, independent bounded model call (**not call-shared with
  categoryPlausibility**)" (`targetCustomerMatch.ts:17-18`, echoed at
  `service.ts:74-77`). Any combination proposal should be put in front of
  whoever made that call-separation decision, or the PO, rather than
  reversed unilaterally as a cost optimization.
- **Validation/retry implications.** Each call has its own independent
  `maxAttempts: 3` retry-with-repair loop today. A combined schema would
  need a single repair loop covering both tasks — if one half of the
  response is valid and the other half fails validation, there is no
  existing primitive for "repair only the broken half." This is a real
  engineering risk, not just a technical inconvenience.
- **Evidence requirements.** Both calls already read the *same* source
  documents, fetched exactly once and reused across attempts
  (`fallbackResearchProvider.ts:92-99`, comment: "Fetched and built exactly
  once... reused by every attempt"). This matters: it means the token
  savings from combining are **not** "avoid fetching evidence twice" (that's
  already true) — they would only be "avoid sending the same evidence as
  input twice" and "avoid duplicated system-prompt/request overhead."
  Output-token cost is roughly additive either way, so the real saving is
  bounded by input-token duplication plus per-request overhead, not the
  full second call's cost.
- **Quality implications.** Splitting a model's attention across two task
  framings (general lead classification *and* a narrow yes/no-style
  target-customer judgment) inside one prompt carries a known risk of
  diluting quality on both sub-tasks relative to two focused calls. This is
  a recall risk, not just a cost question, and cuts directly against the
  "preserve useful client-discovery quality" objective.
- **Governance conflict check.** No existing PO decision explicitly requires
  the calls to stay separate, but the code comment shows it was a conscious
  design choice. Combining would need to be surfaced as its own decision,
  not inferred as "implied already decided."
- **Can one call reliably provide everything currently required?**
  Unverified without further schema-design work — plausible in principle,
  but the retry/repair and quality risks above mean "plausible" is not the
  same as "safe to do as a pure cost optimization."

**Lower-risk alternative identified (not recommended for implementation
here, just surfaced as the safer option if cost pressure is severe): stage
Call B so it only runs if Call A's deterministic post-processing indicates
it's worth asking** (e.g., only run target-customer-match if research
surfaced any target-customer-relevant signal at all). This reduces calls
from 2→1 for a fraction of candidates without touching either schema, and
does not reverse the existing "not call-shared" design decision. Still
requires a PO/engineering call to define the staging condition correctly.

---

## 7. Cache-First Architecture Analysis

Per-layer analysis against the already-decided caching principle (same
search reuse; same-freelancer factual evidence reuse across services when
fresh; service-specific evaluation NOT reused across services;
cross-freelancer sharing not decided):

| Layer | Cacheable today? | Currently implemented? | Governance status |
|---|---|---|---|
| 1. Discovery results | Plausible (Google Places results change slowly) | **No** — identical repeat search re-calls Google Places fresh every time | Open — cache identity/TTL not decided |
| 2. Raw factual research evidence | Yes, **already PO-decided** for same freelancer across services when fresh (Item #11) | **No** — confirmed no code path reuses prior evidence before issuing Call A | Already authorized; engineering gap only |
| 3. Deterministic signals | Low value to cache (cheap, non-AI to recompute) once evidence exists | N/A | — |
| 4. Target-customer evaluation | Must stay service-specific per the stated caching principle (and the single-service-per-search decision) — evaluation itself should NOT be reused across services | **No** — consistent with current design, not a gap | Already decided (must not share) |
| 5. Final opportunity evaluation/score | Service-specific, must not be reused across services; **but** the same freelancer repeating the *same* search for the *same* service, same business, could reuse a still-fresh prior Opportunity/score instead of recreating it | **No** — every new Search row always creates a new Prospect (unique on `search_id, company_id`) and therefore a new Opportunity, even for an identical repeat search | Open — "same/materially equivalent search" reuse not decided or built |
| 6. Service-specific ranking | Pure function of already-computed scores; caching the ranking step itself adds no value beyond caching the scores (#5) | N/A | — |

**Company-level dedup already exists** and should not be confused with
result caching: `companies` is unique on `(user_id, normalized_domain)`
(`packages/db/prisma/migrations/0015_discovery/migration.sql:65-66`), so the
same business discovered twice reuses the same Company row. But `prospects`
is unique on `(search_id, company_id)`, so a new Search always creates a
new Prospect — and from there, a brand-new, fully-rebilled research +
match pipeline — regardless of how recently that same Company was
researched. **The Company-level dedup gives a false impression of reuse
that does not actually extend to AI cost.**

**Explicitly not inventing TTLs, per instruction.** What remains open for a
future PO/engineering decision:
- Exact cache identity for "same or materially equivalent search" (same
  service + geography + keywords? fuzzy matching? exact string match?).
- Freshness/TTL windows for reusable evidence (none exist anywhere today;
  `core-acquisition/src/staleness.ts`'s `FRESH`/`STALE`/`SUPERSEDED`
  classification exists but currently only *triggers a re-run
  recommendation* — it has no TTL value wired to it and is not used to gate
  a skip-AI decision).
- Cross-freelancer sharing — explicitly **not decided**; do not assume.
- Whether "same/equivalent search" reuse should return/update the *same*
  Prospect/Opportunity row, which is a bigger product/schema question than
  Item #8 alone (today's one-Opportunity-per-Prospect, one-Prospect-per-Search
  design would need to change to support this cleanly).

---

## 8. Adaptive / Bounded AI Stopping Analysis

See Architectures 2–4 in §5 for the detailed per-option breakdown. Summary
comparison:

| Option | Worst-case bound? | Adapts to pool quality? | Complexity | Best fit |
|---|---|---|---|---|
| Fixed Top-N | Yes (N) | No | Low | Services with stable, predictable candidate density |
| Score threshold | **No**, unless capped | Yes | Low-medium | Services with reliable deterministic signal calibration |
| Hybrid Top-N + threshold + budget | Yes (B) | Yes | Medium-high | General-purpose default across the 17 service families |
| Adaptive yield-based stopping | Yes (B as fallback) | Yes, and cost-efficient on easy searches | Highest | Mature services with well-validated "useful opportunity" definitions; not safe as a day-one default |

No single option is selected here, per the investigation's scope. The
hybrid (Architecture 3) is the most defensible general-purpose default
because it is the only one with both an enforced ceiling and quality
adaptivity; adaptive yield-stopping is the strongest long-run candidate but
needs real post-AI "usefulness" data this repo does not yet have.

---

## 9. Batching Analysis

Two distinct kinds of batching, kept separate per the investigation
instructions:

**A. Batching multiple candidates into one AI request.** Not done today
(confirmed: strict sequential per-candidate loop, `worker.ts:400-403`).
Risks if attempted:
- *Evidence traceability* — would need per-candidate document isolation
  inside a single larger prompt; current per-call evidence handling is
  built around one candidate at a time.
- *Candidate isolation* — today, one candidate's failure/refusal cannot
  affect another's result. Batching trades this isolation for token
  efficiency; a batch-level failure or refusal would need new per-item
  failure semantics that don't exist yet.
- *Schema validation* — would require an array-of-results schema with
  per-item validation and per-item repair, which is a real build-out, not a
  config change; the existing repair loop (`researcher.ts:290-310`) is
  built for one object, not an array.
- *Partial failures* — no existing primitive for "3 of 5 batched candidates
  validated, 2 need repair."
- *Token cost* — likely reduces fixed per-call overhead (system prompt sent
  once instead of N times), but a large combined context risks
  non-linear cost growth and context-window/quality degradation on larger
  batches — cannot be quantified without real token data (see §11).
- *Quality* — reasoning about multiple candidates in one call is a bigger
  cognitive load on the model than one candidate at a time; risk of
  cross-candidate answer contamination.

**B. Combining multiple tasks for one candidate (research + match).**
Covered in full in §6 — this is the lower-risk, more concretely analyzable
of the two batching dimensions, and is already addressed there rather than
duplicated here.

---

## 10. Model/Provider Routing Analysis

**No production provider or model change is authorized by this
investigation; `RESEARCH_PROVIDER` was not touched.**

Current state: `RESEARCH_PROVIDER` defaults to `anthropic`
(`packages/config/src/env.ts:88`), default model `claude-opus-5`
(`anthropicModel.ts:63`), no fallback provider configured by default
(`RESEARCH_FALLBACK_PROVIDER` unset — `env.ts:92`).

`docs/MONETIZATION.md` contains a per-model-tier cost table ("Research a
lead | 10,400 | 3,500 | ₹15.96 | ₹6.38 | ₹3.19") explicitly labeled as
"Anthropic list prices as of 2026-06-24. No live API call has been made"
(`docs/MONETIZATION.md:111`) and "This is a model, not implemented code"
(line 3). **This is the only pricing data in the repo, it is stale/
unverified by the document's own admission, and must not be cited as fact.**

Architecturally, the existing `researchModelFactory.ts` /
`fallbackResearchProvider.ts` abstraction already supports multiple
providers/models, so a "cheap model first, escalate to a stronger model
only for difficult/borderline cases" routing design is *structurally*
feasible without a rewrite. However:
- No current pricing evidence in this repo supports claiming any specific
  provider or model is cheaper — that claim would need to come from outside
  this investigation's evidence base, which this report declines to assert.
- Model/provider selection is explicitly stated as not yet a PO decision
  in the investigation brief, and this report does not treat it as one.
- A cheap-first/expensive-escalation routing policy is a materially
  different risk profile than the trigger-policy architectures in §5 — it
  changes *which model* answers, not *whether* AI is invoked at all — and
  should be evaluated as its own, separate decision once real pricing and
  quality-by-tier data exists.

---

## 11. Repeated-Search Scenarios

| # | Scenario | What *should* be reused (per existing decisions) | What's actually reused today | Gap |
|---|---|---|---|---|
| 1 | Same freelancer, exact same search again | Fresh research evidence should be reused (already-decided caching principle) | Nothing — Discovery and both AI calls re-run from scratch | Full implementation gap |
| 2 | Same freelancer, materially equivalent search | Same as #1, once "materially equivalent" is defined | Nothing | Needs identity definition (open PO question) + implementation |
| 3 | Same freelancer, different service, same businesses | Factual evidence **may** be reused (Item #11, already decided); target-customer-match and scoring must stay service-specific (already decided) | Nothing — full re-research including Call A | **Clearest already-decided-but-unbuilt gap** — Call A could be skipped today under existing governance; Call B/scoring correctly still need to run fresh |
| 4 | Different freelancer, same businesses | **Not decided** | Nothing shared (each freelancer's Prospect/Opportunity is independent) | Open PO + likely legal/ToS question (see §13.4) before any sharing is considered |
| 5 | Business evidence has become stale | Staleness should trigger refresh | `core-acquisition/src/staleness.ts` already classifies `FRESH`/`STALE`/`SUPERSEDED` and recommends `REFRESH_RESEARCH` — but only as a trigger to redo work, not a TTL gate to skip it; no TTL value exists | Needs TTL values (explicitly not invented here) |
| 6 | Business has changed since previous research | Should ideally be detected and trigger refresh independent of simple time-based staleness | **No change-detection mechanism exists** (no content hash/diff of discovery or research inputs found anywhere) | New engineering work, not just a policy decision |

---

## 12. Cost Model (relative, not absolute — per instruction)

Absolute rupee figures are not asserted anywhere in this section, consistent
with the finding that no measured cost data exists in this repository.

**Current (baseline), per search:**
```
calls_per_search_worst_case  = candidates_discovered × 2 call-sites × 3 retries  = candidates × 6
calls_per_search_typical     = candidates_discovered × 2 call-sites × repair_factor
                               (repair_factor ≈ 1.25–1.3, ASSUMED/UNMEASURED per docs/AI-ENGINE.md)
                             ≈ candidates × 2.5–2.6  (estimate, not measured)
```
`candidates_discovered` itself is unknown — no real production volume data
exists in the repo (`docs/AI-ENGINE.md:113-119`).

**With a Top-N / hybrid trigger (Architectures 1 or 3), per search:**
```
calls_per_search ≈ min(N, pool_above_threshold) × call_sites_per_candidate × repair_factor
```
Relative reduction vs. baseline:
```
reduction_ratio = min(N, pool_above_threshold) / candidates_discovered
```
e.g., escalating 5 of a discovered pool instead of all of it is a
`5/candidates_discovered` fraction of today's call volume — expressed as a
ratio because the denominator (`candidates_discovered`) is not known with
certainty.

**With call-granularity staging (§6), additional factor:**
```
call_sites_per_candidate: 2 → somewhere between 1 and 2, depending on what
fraction of escalated candidates clear the staging condition for Call B.
```
This is multiplicative with the trigger-policy reduction above, not
additive.

**What real measurement is needed before any PO cost ceiling can be set:**
A controlled, instrumented run of the current pipeline against a known
number of real searches, with `packages/core-ai-usage` actually recording
real `inputTokens`/`outputTokens`/cache-token fields per call (the schema
already supports this — `packages/core-ai-usage/src/types.ts:28-47` — it has
simply never been exercised against a live provider,
`docs/AI-ENGINE.md:3`), paired with the provider's actual billed invoice for
that run. Only that combination — not list-price arithmetic — would produce
a defensible ₹/search figure, consistent with the existing PO decision that
defers any cost ceiling until informed by actual measurement
(`requirement/CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md:66`).

---

## 13. Recommended Cost-Minimizing Architecture (subject to the stated constraints)

**Recommendation is a layered combination, not a single architecture from
§5 in isolation:**

1. **Cache-first gate** (§7) — before evaluating any trigger policy for a
   given Company, check for fresh, reusable same-freelancer evidence
   (Item #11, already authorized) and skip Call A if found.
2. **Real deterministic pre-AI scoring** (Items #4–#7, currently a code gap,
   not a new PO question) — compute the website-observable deterministic
   signal/score before any AI call, for every candidate.
3. **Strong-signal bypass** (Item #9, already principle-authorized) —
   candidates whose deterministic signal independently clears a strength
   bar escalate regardless of general rank/threshold, but **bounded inside**
   the per-search budget B rather than exempt from it (closing the "backdoor"
   risk flagged in Architecture 5).
4. **Hybrid Top-N + threshold + bounded budget** (Architecture 3) as the
   general trigger policy for the remaining candidates.
5. **Staged call granularity** (§6's lower-risk alternative) — run Call A;
   only run Call B if Call A's deterministic post-processing indicates it's
   worth asking — rather than merging schemas, avoiding the quality/
   governance risk identified in §6.
6. **Adaptive yield-based stopping deferred**, not adopted yet — flagged as
   the strongest long-run candidate (§5 Architecture 4) but requiring real
   post-AI usefulness data this repo does not have; revisit after §12's
   measurement work is done.
7. **Graceful degradation for services without deterministic signals yet**
   — those service families fall back to a conservative fixed-Top-N-no-
   threshold mode (Architecture 1, generously sized) rather than being
   starved of AI research entirely, accepting temporarily higher cost for
   those families as a bounded, visible cost of incremental rollout across
   the 17-service catalogue — rather than sacrificing discovery quality for
   cost on families whose deterministic layer isn't built yet.

**Explicit trade-off statement:** this recommendation does **not** minimize
AI spend to the theoretical floor (an extremely tight N/threshold with no
graceful fallback would cost less). It deliberately preserves recall margin
via the strong-signal bypass and the graceful per-service fallback, because
the investigation brief explicitly warns against optimizing purely for
lowest AI spend "if it makes the product incapable of finding useful
clients." The cost this trades away is bounded and visible (per-search
budget B, plus a temporarily wider net for services still lacking
deterministic coverage) rather than open-ended.

---

## 14. Already Authorized by Existing PO Decisions

- Deterministic-first scoring architecture, principle level (Item #4) —
  `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_4_DETERMINISTIC_FIRST_SCORING_ARCHITECTURE_PO_DECISION.md`
- Strong-signal AI-escalation bypass, principle level (Item #9) —
  `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md`
- AI-escalation boundary = eliminate-and-rank only; no LLM required for
  elimination/ranking itself (§6, Option C) — `CF-DISCOVERY-ARCH-002-S6`
- Same-freelancer factual evidence reuse across services, when fresh
  (Item #11)
- Service-specific opportunity evaluation must NOT be reused across
  services (stated caching principle; consistent with single-service-per-
  search decision)
- No numeric cost ceiling exists or is implied by any of the above — all
  explicitly defer the concrete mechanism/numbers

## 15. Requires a New PO Decision

- The Item #8 escalation mechanism itself (Top-N vs. threshold vs. hybrid
  vs. adaptive, and the exact formula) — this is literally the open
  `## 8. AI escalation mechanism` section of
  `requirement/CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md`
- Concrete numeric values: N (Top-N), T (threshold), B (per-search AI
  budget) — none decided, none invented here
- Cache identity definition for "same/materially equivalent search"
- Cache freshness/TTL windows (explicitly not invented in this report)
- Cross-freelancer evidence/cache sharing — explicitly not decided
- Whether/how to change AI call granularity (merge or stage research +
  target-customer-match) — flagged in §6 as a product/quality decision, not
  a pure engineering call, given the existing deliberate "not call-shared"
  design
- Numeric AI cost ceiling (₹ or $ per search) — explicitly deferred by
  existing governance pending real measurement
- Any model/provider routing change (cheap-first, tier escalation, or any
  default change) — explicitly out of scope for a PO decision in this
  investigation
- Graceful-degradation policy specifics for services without deterministic
  signals yet (whether/how much more AI budget they get in the interim)

## 16. Requires an Engineering Decision (no new PO approval needed)

- Implementing Item #11's already-authorized evidence reuse as an actual
  cache-lookup-before-Call-A code path
- Building the real deterministic pre-AI signal/score layer that Items
  #4–#7 already authorize in principle (moving today's AI-derived post-hoc
  signals to a pre-AI, website-observable computation)
- Staging Call B conditionally on Call A's deterministic post-processing
  (internal pipeline sequencing — does not change any schema or governance
  boundary), though worth flagging to whoever authored the original
  "not call-shared" design comment before changing the calling pattern
- Retry/backoff tuning (already engineering-owned)
- Wiring up real `ai_usage_events` recording against a live provider run, to
  produce the measured data needed before any numeric cost ceiling decision
  (note: this step necessarily involves *some* real, small API spend to
  obtain real measurements — flagged, not authorized, by this report)

## 17. Open Questions for Item #8

1. What concrete escalation mechanism (Top-N / threshold / hybrid /
   adaptive) does the PO want as the default across all 17 service
   families?
2. What are the initial N / T / B values, and do they need to vary by
   service family (per Item #5)?
3. How should the strong-signal bypass (Item #9) interact with a per-search
   budget — exempt, or counted against it?
4. What counts as a "materially equivalent" search for cache purposes?
5. What freshness/TTL windows apply to reusable evidence, discovery
   results, and (if ever authorized) cross-freelancer data?
6. Is cross-freelancer evidence/cache sharing something the PO wants
   investigated further (with legal/ToS review), or ruled out now?
7. Should research + target-customer-match calls be merged, staged, or left
   as-is — and if staged, what is the staging condition?
8. What interim policy applies to service families that don't yet have a
   deterministic signal set built (per Item #4/#5 rollout)?
9. Is a small, explicitly-authorized real API spend acceptable to produce
   the measured cost baseline described in §12, before a numeric cost
   ceiling is set?

## 18. Final Statement

**IMPLEMENTATION NOT AUTHORIZED.**
**NO CODE / CONFIG / DATABASE / ENVIRONMENT CHANGES MADE.**
**NO API CREDITS PURCHASED.**
**NO COMMIT / PUSH / DEPLOY PERFORMED.**

This document is evidence for the Product Owner's Item #8 decision. It does
not create a PO decision record and should not be cited as one.
