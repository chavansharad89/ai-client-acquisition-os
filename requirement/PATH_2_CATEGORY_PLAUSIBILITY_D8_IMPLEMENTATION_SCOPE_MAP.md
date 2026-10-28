# PATH 2 — D8 IMPLEMENTATION SCOPE MAP

## 1. Status

```text
READ-ONLY / IMPLEMENTATION SCOPE MAP
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
D8: UNDECIDED (see §18)
```

This document maps the exact implementation scope Path 2/D8 would touch, traced against current repository code. It implements nothing, decides nothing, and does not convert any prior recommendation into a decision. It is a planning artifact only.

**Naming note, verified in this task:** two files this task's reading list names do not exist under those exact names. `requirement/PATH_2_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md` does not exist; the actual file is `requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md`. `requirement/PATH_2_CATEGORY_PLAUSIBILITY_PATH_DECISION.md` does not exist; the actual file is `requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md`. Both were read under their actual names for this task; `requirement/CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md` exists exactly as named and was also read.

## 2. Authoritative Decisions

Locked (per `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3–§4) and **not reopened** by this document:

```text
D0  MVP status:             MVP enhancement — does not reopen the 19-criterion exit
D1  Output location:        Dedicated Search + Prospect category-plausibility determination
                             (not Prospect-global; not the business's own targetCustomers
                             field; not routed through R-71)
D2  Multi-segment semantics: Deterministic segment parsing + ANY-match (OR) semantics;
                             MATCH/MISMATCH/UNKNOWN determined per segment, then aggregated
D3  Evidence sufficiency:   First-party website evidence primary; search-derived metadata
                             supporting only; weak/generic signals insufficient alone;
                             UNKNOWN on insufficient evidence
D4  Qualification:          Q1 — new, distinct Qualification criterion; not routed
                             through R-71 Need Detection
D5  State behavior:         MATCH passes the criterion (normal flow); MISMATCH fails
                             the criterion but does NOT block Opportunity creation;
                             UNKNOWN fails/holds the criterion; no new Opportunity state
D6  Persistence/attribution: Per Search + Prospect; historical attribution preserved;
                             targetCustomer change -> new Search-scoped determination;
                             cross-search overwrite not allowed; Qualification reads the
                             current Search + Prospect determination
```

Still open, per `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_DECISION_PREPARATION.md` §14: **D8 — how Search-scoped category-plausibility context reaches Research.** Not decided by this document either (§18).

Unchanged boundaries, re-verified against current code in this task (§14 gives citations):

```text
R-71:          TOPICAL_FIELDS / suggestOffers() / toOfferSignals() — unchanged
Scoring/ranking: FACTOR_WEIGHTS, OpportunityScore, rankOpportunities — unchanged
Discovery:      query construction, provider contract, category filtering — unchanged
Opportunity:    state machine, creation gating — unchanged (per D5)
Provider neutrality: must remain intact across Anthropic/OpenAI/Gemini
```

## 3. Current End-to-End Call Chain

Traced in this task against the code at HEAD `5992b82b9adff492c480442d68a954f2a03bfb28`:

```text
apps/worker/src/searchWorker/worker.ts
  claimNextPending() -> pollLoop.ts -> runCanonicalPipeline(deps, search: StoredSearch)  [worker.ts:327-330]
    runDiscoveryForOwner(...)                                                             [worker.ts:333-342]
    for (const prospect of discovery.prospects) {                                          [worker.ts:358]
      runResearchForOwner(                                                                  [worker.ts:359-368]
        { companies, prospects, signals, provider: deps.researchProvider(userId) },
        userId,
        { prospectId: prospect.id },        <- search.id / search.parameters.targetCustomer
      )                                          are in scope one line above, NOT passed
      createOpportunityForOwner(...)                                                        [worker.ts:373-383]
      scoreOpportunityForOwner(...)          (if deps.scores)                               [worker.ts:386-394]
      evaluateQualificationForOwner(...)     (if deps.qualifications)                       [worker.ts:398-406]
    }

packages/core-research/src/service.ts
  runResearchForOwner(deps, userId, { prospectId }, now)                                   [service.ts:62-88]
    prospect = deps.prospects.getById(userId, prospectId)                                   [service.ts:70]
    company  = deps.companies.getById(userId, prospect.companyId)                           [service.ts:73]
    research = deps.provider.research({ prospectId, companyId, companyName,
                                         normalizedDomain })                                  [service.ts:76-81]
    signalInputs = toNewResearchSignals(research)                                            [service.ts:83]
    superseded   = deps.signals.supersedePrevious(prospect.id, now)                          [service.ts:84]
    signals      = deps.signals.saveSignals(prospect.id, signalInputs, now)                  [service.ts:85]

packages/core-research/src/provider.ts
  ResearchProviderInput { prospectId, companyId, companyName, normalizedDomain }             [provider.ts:11-16]
  ResearchProvider.research(input): Promise<LeadResearch>                                    [provider.ts:24-26]

packages/core-research/src/anthropicResearchProvider.ts
  createAnthropicResearchProvider(deps).research(input)                                     [anthropicResearchProvider.ts:51-82]
    sourceDocuments = deps.sourceDocuments.fetchSourceDocuments({companyName,normalizedDomain}) [line 58-61]
    researchInput: ResearchInput = { companyName, websiteUrl, sourceDocuments }              [line 67-71]
    outcome = researchLead(deps.model, researchInput, { onInvocation })                      [line 73-77]

packages/core-research/src/researcher.ts
  researchLead(model, rawInput, options)                                                     [researcher.ts:151-293]
    buildUserMessage(input) -> user message string                                           [line 176 -> prompt.ts:32-61]
    model({ system: SYSTEM_PROMPT, messages, signal })                                       [line 198-202]
    leadResearchSchema.safeParse(candidate)                                                   [line 247]
    verifyProvenance(parsed.data, input.sourceDocuments)                                      [line 253]
    (repair loop on failure, lines 276-289)

packages/core-research/src/researchModelFactory.ts
  createResearchModel(config) -> ResearchModel                                                [researchModelFactory.ts:94-130]
    selects createAnthropicResearchModel / createOpenAIResearchModel / createGeminiResearchModel

packages/core-research/src/{anthropicModel,openAIModel,geminiModel}.ts
  (request: {system, messages, signal}) => Promise<ModelResult>   — provider-neutral shape only

packages/core-research/src/mapping.ts
  toNewResearchSignals(research): readonly NewResearchSignalInput[]                            [mapping.ts:16-30]
    iterates allObservations(research)  [schema.ts:229-249], consults FIELD_KIND [persist.ts:38-48]

packages/core-research/src/repository.ts / pgRepository.ts
  ResearchSignalRepository.supersedePrevious(prospectId, at)                                    [repository.ts:18]
  ResearchSignalRepository.saveSignals(prospectId, signals, observedAt)                         [repository.ts:21-25]
  ResearchSignalRepository.listByProspect(userId, prospectId)                                   [repository.ts:28]
  concrete impl: pgRepository.ts:50 (createPgResearchSignalRepository)
  table: research_signals (prospect_id, field, kind, classification, signal, confidence,
                            basis, observed_at, superseded_at) — NO search_id column
                            (packages/db/prisma/migrations/0016_research_signals/migration.sql:47-51)

packages/core-qualification/src/service.ts
  evaluateQualificationForOwner(deps, userId, opportunityId, now)                              [service.ts:59-78]
    opportunity = deps.opportunities.getById(userId, opportunityId)                             [line 65]
    signals     = deps.signals.listByProspect(userId, opportunity.prospectId)                   [line 68]
    evaluateQualification({ needDetected: opportunity.needDetected, signals })                  [line 69]
```

## 4. Worker Boundary

| Aspect | Evidence |
|---|---|
| File | `apps/worker/src/searchWorker/worker.ts` |
| Function | `runCanonicalPipeline(deps: SearchWorkerDeps, search: StoredSearch): Promise<{ prospectsProcessed: number }>` |
| Current signature | `worker.ts:327-330` |
| Data available here | Full `search: StoredSearch` object — `search.id`, `search.parameters` (all of `ServiceProfileFields`, including `targetCustomer`), for the entire loop body (`worker.ts:358-451`) |
| Missing Search-scoped context passed onward | `search.id` and `search.parameters.targetCustomer` are held but not forwarded into the `runResearchForOwner` call at `worker.ts:359-368`, which passes only `{ prospectId: prospect.id }` |
| Must this boundary change under Option B? | **Possible, not required.** Under Option B/Candidate 2 (resolve Search context inside `core-research` via a new `searches` dependency — see D8_DECISION_PREPARATION.md §7), this call site's own `{ prospectId }` input need not change at all. Under Option B/Candidate 3, or under Option A, this call site's input would need to widen to carry `search.id`/`targetCustomer`. |
| Status | **OPTIONAL**, contingent on which Option B candidate (or Option A) D8 ultimately selects — not itself required by any locked decision. |

## 5. Research Orchestration Boundary

| Aspect | Evidence |
|---|---|
| File | `packages/core-research/src/service.ts` |
| Type/function | `ResearchDeps` (interface, lines 21-27); `runResearchForOwner(deps, userId, input, now)` (lines 62-88) |
| Current signature | `ResearchDeps = { identity, companies, prospects, signals, provider }` (via `runResearch`'s `Omit<ResearchDeps,'identity'>` for `runResearchForOwner`); `runResearchForOwner(deps: Omit<ResearchDeps,'identity'>, userId: string, input: RunResearchInput, now: Date = new Date()): Promise<ResearchRunResult>` |
| Data available here | `input.prospectId` (validated, line 68); `prospect` — the full `StoredProspect` including `prospect.searchId` (line 70) — loaded but never read past that point; `company` (line 73) |
| Missing Search-scoped context | No `searches: SearchRepository` dependency exists on `ResearchDeps` today, so `StoredSearch.parameters.targetCustomer` is **not reachable** from inside this function without either (a) adding that dependency, mirroring `core-opportunity`'s `OpportunityDeps` (`core-opportunity/src/service.ts:42-49`), which already does exactly this via `prospect.searchId` (`core-opportunity/src/service.ts:123`), or (b) receiving the value already resolved, via a widened `input`/`RunResearchInput` |
| Must this boundary change under Option B? | **Required**, in some form, regardless of which Option B candidate: this is the one place currently positioned to resolve Search context (it already has `prospect`) or to receive it already resolved (from the worker). Under Option A this boundary also changes, to populate the extended `ResearchProviderInput`. |
| Status | **REQUIRED** (the specific shape of the change is the open D8 question; that *something* changes here is not). |

## 6. `ResearchProviderInput`

| Aspect | Evidence |
|---|---|
| File | `packages/core-research/src/provider.ts` |
| Type | `ResearchProviderInput` (lines 11-16) |
| Current signature | `{ prospectId: string; companyId: string; companyName: string; normalizedDomain: string }` |
| Constructed at | `packages/core-research/src/service.ts:76-81` (the only production construction site) |
| Consumed by | `ResearchProvider.research(input)` (`provider.ts:24-26`); today exactly one concrete implementation, `createAnthropicResearchProvider` (`anthropicResearchProvider.ts:51`, provider-model-agnostic despite its name — see §9) |
| Must this change under Option B? | **NOT NEEDED**, by Option B's own definition (§7 below) — Option B is specifically the choice that leaves this type unchanged. Required only under Option A, or under Option B's "Candidate 1" variant (a second parameter on `ResearchProvider.research()`, which changes the *method* but not this *type*) — see D8_DECISION_PREPARATION.md §6-§7 for the full A/B/Candidate analysis, not repeated in full here. |
| Status | **NOT NEEDED under core Option B** / **REQUIRED under Option A** — this is precisely what D8 has not yet decided (§18). |

## 7. Search-Scoped Context

Precise answers to the ten questions posed, all evidence-grounded, none implemented:

1. **Where does `search.id` first become available?** Two points, both already in the current call chain: (a) `apps/worker/src/searchWorker/worker.ts:329` — `runCanonicalPipeline`'s own `search: StoredSearch` parameter, available for the whole pipeline run; (b) indirectly, inside `core-research` itself, via `prospect.searchId` after `deps.prospects.getById(userId, prospectId)` (`service.ts:70`) — `StoredProspect.searchId` (`packages/core-discovery/src/types.ts:26`) is a durable, persisted column, not a transient value, so `search.id` is recoverable there without any new data ever having to travel from the worker.
2. **Where does `search.parameters.targetCustomer` become available?** At the worker (`worker.ts:329`, via `search.parameters.targetCustomer` — `ServiceProfileFields.targetCustomer`, `core-service-profile/src/types.ts:12`), same scope as (1)(a). It is **not** currently reachable from inside `core-research` without a new lookup, because `ResearchDeps` has no `searches: SearchRepository` dependency (§5) — unlike `search.id`, `targetCustomer`'s *content* requires an actual `SearchRepository.getById(userId, searchId)` call (`core-search/src/repository.ts:26`) to resolve `StoredSearch.parameters`, which nothing inside `core-research` does today.
3. **Where should deterministic parsing occur?** Not established by the repository — no parsing of `targetCustomer` exists anywhere today (confirmed by search in this and the prior D8 task). Three candidate locations, none favored by existing precedent (see §8 for full comparison): before `ResearchProviderInput` construction (worker, or a `core-search`/`core-service-profile` pure function); at the worker/orchestration boundary specifically; or inside `core-research` itself, once it has obtained the raw string by whichever mechanism §5/§7(2) settles.
4. **Where should the resulting segment list be carried?** Wherever it is produced, it needs to reach the same place `targetCustomer`'s raw content needs to reach (§7(2)) — i.e., ultimately into `ResearchInput`/`prompt.ts`'s `buildUserMessage()` (`schema.ts:207-224`, `prompt.ts:32-61`), the only point at which content becomes visible to any provider (§9). Whether it also needs to be carried further, into whatever persists D1's dedicated Search+Prospect determination, is a D1-implementation question, not a D8 question — D1 is already locked as to *shape* ("dedicated Search + Prospect determination") but not yet built.
5. **Which function should own Search context resolution?** Not decided by any locked decision. Candidates, per D8_DECISION_PREPARATION.md §7: `runResearchForOwner` (`core-research/src/service.ts`), if `ResearchDeps` gains a `searches` dependency (mirrors `createOpportunityForOwner`, `core-opportunity/src/service.ts:112-131`, the closest existing precedent in the repository for this exact resolution pattern); or `runCanonicalPipeline` (`worker.ts`), which already holds the resolved `search` object and would simply need to forward it, requiring no new repository dependency anywhere.
6. **Which function should construct the provider-neutral research request?** Regardless of where Search context is resolved, the actual `{system, messages}` request is built in exactly one place today: `researchLead()` (`researcher.ts:151-293`), via `buildUserMessage(input)` (line 176, `prompt.ts:32-61`), called once per attempt, upstream of all three provider adapters (§9). No candidate in this document proposes moving that construction point.
7. **Does `ResearchProviderInput` need to change?** Only under Option A, or under Option B's Candidate 1 variant (which changes `ResearchProvider.research()`'s own signature instead of, or in addition to, this type). Under Option B/Candidate 2 or 3, this type is unaffected — see §6.
8. **Does `ResearchModel` need to change?** **No, under any candidate considered.** `ResearchModel` (`researcher.ts:44-56`) is defined purely in terms of `{system, messages, signal}` — nothing analyzed in this document, under either Option A or B, adds a field to this interface. Confirmed by re-inspection in this task.
9. **Do Anthropic/OpenAI/Gemini adapters need to change?** **No, under any candidate considered.** None of `anthropicModel.ts`, `openAIModel.ts`, `geminiModel.ts` import or receive `ResearchProviderInput` or `ResearchInput` — confirmed by direct inspection of all three files in the prior D8 task and re-confirmed here. Any new content reaches all three identically via `prompt.ts`'s single, shared `buildUserMessage()` call site.
10. **Where does the new plausibility result enter the existing research output pipeline?** Per D1 (locked): NOT as a reused `targetCustomers` field, and not via `LeadResearch`'s existing per-field `Observation` model routed through `allObservations()`/`ResearchSignal` (that pattern is Prospect-scoped only, per §13, and D1 specifically locks a *Search+Prospect*-scoped dedicated determination instead of reusing that Prospect-only-scoped mechanism unmodified). The exact entry point — a new field on `LeadResearch` that a separate, new persistence path reads (rather than `mapping.ts`'s existing `toNewResearchSignals()`), or an entirely separate output object Research returns alongside `LeadResearch` — is **not yet decided by any locked decision** and is D1-implementation scope, not D8 scope; D8 only governs how context reaches Research's *input* side.

## 8. Deterministic Parsing

**FACT:** `ServiceProfileFields.targetCustomer` is typed as a single `string` (`packages/core-service-profile/src/types.ts:12`). No parsing/splitting logic for this field exists anywhere in the codebase — re-confirmed by search in this task (no matches for segment-splitting logic against `targetCustomer` in any package).

**FACT:** Discovery's `buildQuery()` (`packages/core-discovery/src/googlePlacesProvider.ts:11-15`, per prior audits, not re-read line-by-line in this task since it is explicitly out of scope and unchanged) consumes the raw, unparsed string verbatim — the repository has never needed to parse this field for any purpose.

**FACT:** No parsing utility (a pure function operating on a compound target-customer string) exists in `core-search`, `core-service-profile`, `core-discovery`, or `core-research` today.

**INFERENCE:** Since Discovery's own consumption pattern establishes no precedent for splitting this field, and no other consumer of `targetCustomer` exists yet, there is no *existing* convention this decision would be extending — only sibling patterns (e.g., how `core-opportunity` already resolves `search.parameters` from `prospect.searchId`, §7(1)/(5)) that establish *how Search data is reached*, not how a string field within it would be parsed once reached.

**Candidate locations** (repeated, more concisely, from D8_DECISION_PREPARATION.md §8; not re-derived from scratch, no location is selected):
- **Worker or a `core-search`/`core-service-profile` pure function**, operating directly on `ServiceProfileFields.targetCustomer`/`StoredSearch.parameters.targetCustomer` before any Research code runs. Strongest testability (pure function, isolated unit tests) and reuse (available to any future non-Research consumer); weakest colocation with `core-research`'s own test fixtures.
- **The worker orchestration boundary specifically** (`runCanonicalPipeline`), as a distinct step immediately before the Research call. Same provider-neutrality guarantee as above (parsing happens entirely before any provider-facing code runs); weaker reuse (logic embedded in worker code, not a shared package export) unless later extracted.
- **Inside `core-research`** (e.g., inside `runResearchForOwner` or a new shared helper `anthropicResearchProvider.ts` calls), once the raw string has been resolved there by whichever mechanism §5/§7 settles. Requires `core-research` to take on a `core-service-profile`/`core-search` concept it does not otherwise own; must run once, shared across all three `ResearchModel` configurations (never duplicated per-adapter — that would violate the `researchModelFactory.ts` provider-neutrality constraint, §9), which is straightforward as long as it is placed above the provider-selection point, not inside it.

**Whether parsing must be provider-independent:** Yes, unconditionally — per §9, none of the three adapters see structured input at all, so parsing cannot meaningfully occur "per provider" without producing three different, drifting interpretations of the same string; it must run exactly once, upstream of `researchModelFactory.ts`'s selection point, for any of the three candidate locations above.

**How the original raw `targetCustomer` should be preserved for attribution/audit:** Not decided by any locked document. D3 (locked) requires evidence to be "specific enough to support the category determination," and D6 (locked) requires the determination to record what `targetCustomer` it was evaluated against ("TARGETCUSTOMER CHANGE: NEW SEARCH-SCOPED DETERMINATION"). This strongly implies the raw string (or an equivalent verbatim snapshot) must be retained alongside the parsed segments somewhere in whatever D1's dedicated Search+Prospect entity ends up persisting — **PROPOSED IMPLEMENTATION SHAPE, not decided**:

```text
CONCEPTUAL ONLY — NOT IMPLEMENTED

targetCustomerSnapshot: string       // the raw, unparsed value, for audit
targetSegments: string[]             // the deterministic parse of the above
```

**How ANY semantics should be represented conceptually (D2, locked as to policy, not as to representation):**

```text
CONCEPTUAL ONLY — NOT IMPLEMENTED

type SegmentDetermination = {
  segment: string;
  result: 'MATCH' | 'MISMATCH' | 'UNKNOWN';
  evidence: { quote: string; sourceUrl: string; sourceLabel: string }[];
};

type CategoryPlausibilityResult = {
  overall: 'MATCH' | 'MISMATCH' | 'UNKNOWN';   // MATCH if any segment is MATCH,
                                                 // MISMATCH only if every segment is
                                                 // MISMATCH, else UNKNOWN — per D2/D3
  segments: SegmentDetermination[];
};
```

This shape is derived from D2/D3's locked text (per-segment determination, then aggregated; UNKNOWN when insufficient) and from the existing `Observation`/`evidence[]` shape already used throughout `LeadResearch` (`schema.ts:31-57,66-161`) — it reuses that existing vocabulary rather than inventing a new one, but it is **not** the existing `Observation` type verbatim (which has no per-segment structure), consistent with D8_DECISION_PREPARATION.md's own finding that a single `Observation` cannot cleanly carry a per-segment breakdown. Not implemented, not authorized, not necessarily the final shape.

**How malformed/ambiguous segments should behave:** Not decided by any locked document. D3 (locked) establishes the general principle — insufficient evidence produces UNKNOWN, never a default MISMATCH — but does not by itself state what "malformed segment" (e.g., an empty segment from a trailing delimiter, or a segment so vague it cannot be evaluated at all) should do. The most consistent extrapolation from D3's own text, **PROPOSED, not decided**: a segment that cannot be meaningfully evaluated contributes UNKNOWN for that segment, which then participates in the overall aggregation exactly as any other UNKNOWN segment would (i.e., it does not by itself force an overall MISMATCH, per D2/D3's own aggregation rule) — this is an inference from the locked aggregation rule, not a new decision this document makes.

## 9. `ResearchModel` / Provider Adapters

Re-verified in this task by direct inspection of all three adapter files and the factory:

- `researchModelFactory.ts:9-16` — *"the ONE place in the codebase allowed to branch on provider identity... Everything above this file... stays completely unaware of which provider produced a ResearchModel."*
- `ResearchModel` (`researcher.ts:44-56`): `(request: { system: string; messages: {role,content}[]; signal?: AbortSignal }) => Promise<ModelResult>`. Confirmed: none of `anthropicModel.ts`, `openAIModel.ts`, `geminiModel.ts` import `ResearchProviderInput` or `ResearchInput` — each translates only `{system, messages, signal}` into its own wire format and back.
- The only place `ResearchInput` is rendered into text is `prompt.ts`'s `buildUserMessage()` (`prompt.ts:32-61`), called once from `researchLead()` (`researcher.ts:176`), upstream of `researchModelFactory.ts`'s provider selection.

**Does the Option B architecture require provider interface changes?** No. **Provider adapter changes?** No. **Provider-specific parsing?** No — and none should ever be introduced; parsing (§8) must happen once, shared, above `researchModelFactory.ts`'s selection point. **Provider-specific category logic?** No, for the identical structural reason.

**Expected goal verification:** *"Search context should be prepared before the provider-neutral model boundary."* **Verified true**, not assumed: the provider-neutral `ResearchModel` boundary is crossed only via `researchLead()`'s call to `model({system, messages, signal})` (`researcher.ts:198-202`); every candidate in §5–§8 resolves Search context, parses segments, and renders the result into `messages` strictly before that call, regardless of which Option A/B candidate is eventually chosen — none of the candidates analyzed in this or the prior D8 document proposes resolving or parsing Search context inside or after `researchModelFactory.ts`'s selection.

## 10. Research Output Schema

**FACT:** `leadResearchSchema` (`schema.ts:176-201`) is a fixed `z.object` with named fields (`companySummary`, `businessModel`, `targetCustomers`, six list fields, `recommendedService`, `confidence`, `gaps`). No reflective/dynamic field mechanism exists.

**FACT:** `allObservations()` (`schema.ts:229-249`) is a hardcoded literal array of `[fieldName, observation]` tuples — a new field is invisible to every downstream consumer (persistence mapping, `observedRatio()`) unless explicitly added to this literal list.

**FACT:** `FIELD_KIND` (`persist.ts:38-48`) is a hardcoded `Record<string, ResearchSourceKind>` keyed by field name, consulted by the **live** `mapping.ts:19`'s `toNewResearchSignals()` — a field with no entry silently defaults to `'WEBSITE'` (`persist.ts:81`, via the separate, confirmed-inactive `persist.ts`/`toResearchRows()` path) or, for the live path, `mapping.ts:19`'s own `?? 'WEBSITE'` fallback.

**FACT:** `mapping.ts`'s `toNewResearchSignals()` (`mapping.ts:16-30`) iterates `allObservations()` — any field added there flows automatically into `NewResearchSignalInput`/`ResearchSignalRepository` with no separate mapping-file edit, **provided** it fits the uniform per-field `Observation` shape (`classification`/`value`/`evidence[]`/`basis`/`confidence`).

**REQUIRED CHANGE, if D1's dedicated Search+Prospect determination is built as a genuinely separate entity (as D1's locked text specifies — "not a Prospect-global determination," implying not simply another row in the existing Prospect-only-keyed `ResearchSignal` table):** a new persistence path distinct from `ResearchSignalRepository`/`research_signals`, since that table has no `search_id` column (§13) and its existing per-Prospect supersession (`supersedePrevious(prospectId, at)`) does not natively carry the Search-scoping D1/D6 require. This is **not** simply "add a field to `allObservations()`" — D1's own locked text forecloses the smallest option (reusing the existing per-field `LeadResearch`/`ResearchSignal` pattern unmodified) precisely because that pattern cannot express Search-scoping without further change.

**POSSIBLE CHANGE:** `LeadResearch` (`schema.ts:176-201`) could still gain a new field (e.g., a raw category-plausibility observation, following the existing `Observation` shape) purely as Research's own record of what it determined — separate from, and not a substitute for, wherever D1's Search+Prospect-scoped persistence actually lives. Whether this is useful/necessary is not decided by any locked document.

**NOT REQUIRED:** No existing field (`companySummary`, `businessModel`, `targetCustomers`, or any of the six list fields) needs to change. `targetCustomers` specifically must **not** be repurposed (D1, locked, explicit).

## 11. Persistence

**FACT, re-confirmed by direct inspection in this task:** `research_signals` (`packages/db/prisma/migrations/0016_research_signals/migration.sql`, columns beginning line 47: `id`, `prospect_id`, `field`, plus classification/signal/confidence/basis/observed_at/superseded_at per the migration's own comment block, lines 1-33) carries **no `search_id` column** and **no `user_id` column** (ownership inherited via `prospect_id -> prospects.user_id`, per the migration's own comment, lines 12-18).

**FACT:** `ResearchSignalRepository.supersedePrevious(prospectId, at)` (`repository.ts:18`) and `.listByProspect(userId, prospectId)` (`repository.ts:28`) are both keyed by `prospectId` only.

**REQUIRED CHANGE, contingent on D1's dedicated-entity design (not decided by D8, and not by this document):** a new table/repository interface, since the existing `research_signals` table structurally cannot express a `(search_id, prospect_id)` key without a schema migration — D1's locked text ("dedicated Search + Prospect... determination," explicitly "not a Prospect-global determination") already forecloses satisfying D6 by reusing `research_signals` unmodified.

**POSSIBLE CHANGE:** none identified beyond the above — D1 already narrows the persistence question to "build a new entity," not "extend an existing one," so there is no smaller alternative left open by the locked decisions to evaluate here.

**NOT REQUIRED:** No change to `research_signals`' own existing rows/columns/supersession behavior for the six existing `LeadResearch` fields — those are explicitly out of scope and D1 does not repurpose them.

## 12. Qualification

**FACT:** `QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT']` exactly (`packages/core-qualification/src/types.ts:12`).

**FACT:** `evaluateNeedDetected()`/`evaluateEvidencePresent()` (`rules.ts:42-80`) are pure functions, invoked in order with a short-circuit by `evaluateQualification()` (`evaluator.ts:21-43`).

**FACT:** `evaluateQualificationForOwner()` (`service.ts:59-78`) resolves `signals` via `deps.signals.listByProspect(userId, opportunity.prospectId)` (line 68) — the existing `ResearchSignalRepository` dependency already injected into `QualificationDeps` (`service.ts:16-21`); no new repository dependency is required to read an *existing*-shaped signal this way.

**Where the future category-plausibility criterion would plug in — CONCEPTUAL ONLY — NOT IMPLEMENTED:**

```text
CONCEPTUAL ONLY — NOT IMPLEMENTED

// types.ts
QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT', 'CATEGORY_PLAUSIBLE']
                                                                 ^ illustrative name only,
                                                                   not approved (per D4)

// rules.ts
function evaluateCategoryPlausible(
  determination: CategoryPlausibilityResult | null,   // from wherever D1's persistence lives
): QualificationCriterionResult

// evaluator.ts
evaluateQualification(input: { needDetected, signals, categoryPlausibility }): QualificationEvaluation
```

**Confirmed, per re-inspection of current code in this task:**
- **Does NOT use R-71**: `TOPICAL_FIELDS`/`suggestOffers()`/`toOfferSignals()` live in `packages/core-opportunity/src/adapters.ts:152,175-199` and `packages/core-acquisition/src/offer.ts:76` respectively — **a citation correction, carried forward from D8_DECISION_PREPARATION.md §11**: `packages/core-qualification/src/` contains no `adapters.ts` file at all; every one of the six upstream Path 2 documents cites this code as living in `core-qualification/src/adapters.ts`, which does not exist. No candidate in this document touches either file regardless of the correct location.
- **Does NOT modify `TOPICAL_FIELDS`**: confirmed — no candidate proposes this.
- **Does NOT modify `suggestOffers()`**: confirmed — no candidate proposes this.
- **Does NOT modify Opportunity creation**: `createOpportunityForOwner` (`core-opportunity/src/service.ts:112-151`) is read only as precedent (§7(5)) for resolving Search context, never as a target of modification.
- **MISMATCH does not block Opportunity creation**: per D5 (locked) — `createOpportunityForOwner` and `evaluateQualificationForOwner` remain independent, separately-invoked steps (`worker.ts:370-406`); a new Qualification criterion failing does not, and under this scope map must not, prevent `createOpportunityForOwner` from running or succeeding.
- **UNKNOWN does not create a new Opportunity state**: `StoredOpportunity` (`core-opportunity/src/types.ts:40-59`) has no category field and none is added by any candidate here — per D5, UNKNOWN fails/holds the *Qualification* criterion only; `QUALIFICATION_STATES` already includes `INSUFFICIENT_EVIDENCE` (`types.ts:9`) as an existing state a new criterion's failure could plausibly map onto without inventing a new `QualificationState` value, though this mapping is itself not decided by any locked document and is not decided here.

## 13. Search + Prospect Attribution

Re-verified against the actual repository identity model in this task:

**Prospect uniqueness:** `prospects` table, `UNIQUE(search_id, company_id)` (`packages/db/prisma/migrations/0015_discovery/migration.sql:115-116`), documented in the migration's own comment as *"the MVP deduplication rule itself... one real business appears once within a Search, but the same business may legitimately reappear in a later Search with fresh research — which is exactly why this constraint is scoped to search_id, not user_id"* (migration.sql:16-21).

**Search -> Prospect relationship:** `StoredProspect.searchId` (`core-discovery/src/types.ts:26`) is a durable, persisted, required column — every Prospect belongs to exactly one Search, permanently.

**ResearchSignal identity/persistence:** `research_signals.prospect_id` only (§11); no `search_id` column.

**`supersedePrevious()` behavior:** `ResearchSignalRepository.supersedePrevious(prospectId, at)` marks all currently-active signals for one `prospectId` superseded.

**`signals.listByProspect`:** scoped by `(userId, prospectId)` — never by Search.

**Can the existing persistence model already distinguish Search + Prospect? A more precise answer than the prior six Path 2 documents gave, re-stated from D8_DECISION_PREPARATION.md §9 because it is directly load-bearing for this section:** Because `Prospect` is the join row between exactly one Search and one Company (`UNIQUE(search_id, company_id)`), **the same real-world business rediscovered under a second Search produces a second, distinct `Prospect` row** — not the same Prospect row reattached to a different Search. Consequently, `supersedePrevious(prospectId, at)` operating on Prospect-A's id can never touch Prospect-B's id's signals, even though both may correspond to the same underlying Company. **The specific "Search A's result gets silently overwritten by Search B's Research run for the same Prospect" scenario every one of the six prior Path 2 documents describes cannot occur for two genuinely different Searches, under the schema as it exists today.** This is stated here as a repository fact discovered by tracing the actual migration, not as a reopening of D6 — D6's own text (per Search + Prospect storage, historical attribution preserved, cross-search overwrite not allowed) remains correct and is not contradicted by this fact; if anything, it explains why the general *class* of accidental cross-Search overwrite D6 guards against is already structurally prevented for `ResearchSignal`'s existing fields, independent of whatever D1's own new persistence entity still needs to be built (D1's entity is not affected by this fact — D1 was locked as "not a Prospect-global determination" regardless, and remains unbuilt either way).

**Can Qualification retrieve the current Search's determination without accidentally consuming another Search's result?** **Not yet, and this is a genuine, distinct gap — not solved by the Prospect/Search fact above.** `evaluateQualificationForOwner` (`service.ts:59-78`) resolves `opportunity = deps.opportunities.getById(userId, opportunityId)` (line 65) and reads `signals = deps.signals.listByProspect(userId, opportunity.prospectId)` (line 68). `StoredOpportunity` (`core-opportunity/src/types.ts:40-59`) **has no `searchId` field** — so even though a given `Opportunity`'s underlying `Prospect` belongs to exactly one Search (per the fact above), `evaluateQualificationForOwner` has no direct way to name "the current Search" for D6's "Qualification reads the current Search + Prospect determination" requirement, should D1's dedicated entity ever be queried by anything *other* than `prospectId` alone (which, given the 1:1 Prospect-to-Search relationship just established, may in practice be sufficient — but this is an inference about D1's likely implementation, not a fact already established by any locked decision, since D1's entity does not exist yet). **This is the same shape of gap D8 addresses for Research's input side**, at Qualification's read boundary instead — noted here as an implementation consequence for a future D4/D5 implementation task, not solved, decided, or authorized by this document, and outside D8's own scope (D8 governs Research's input, not Qualification's read path).

## 14. Unchanged Boundaries

Re-verified against current code in this task; no `BLOCKING SCOPE CONFLICT` identified for any of the nine items:

1. **Discovery query construction** — `buildQuery()`/`googlePlacesProvider.ts` not read, referenced, or touched by any candidate in §4-§13. Discovery continues to receive the raw `targetCustomer` exactly as today.
2. **Google Places provider contract** — not touched; no candidate proposes any Discovery-provider change.
3. **R-71 Need Detection** — `evaluateNeedDetected()`/`suggestOffers()` untouched (§12).
4. **`TOPICAL_FIELDS`** — `packages/core-opportunity/src/adapters.ts:152` untouched (§12; citation-corrected location).
5. **`suggestOffers()`** — `packages/core-acquisition/src/offer.ts:76` untouched (§12; citation-corrected location).
6. **Scoring/ranking** — `scoreOpportunity`/`scoreOpportunityForOwner`/`rankOpportunities` (`core-opportunity/src/service.ts:264-401`) not referenced by any candidate; `FIELD_KIND` (§10) is the only scoring-adjacent surface any Path 2 work touches, and it belongs to D7, not D8, and even D7 is confirmed (by every prior Path 2 document, re-confirmed here) to have zero live-scoring consequence since the `acq_lead_research`/`core-acquisition` scorer path is inactive.
7. **Opportunity state machine** — `StoredOpportunity`/`OpportunityState` (`core-opportunity/src/types.ts:16,40-59`) unmodified by any candidate.
8. **Opportunity creation gating** — `createOpportunityForOwner` remains unconditional (§12); no candidate proposes gating it on any Research/Qualification result, consistent with D5 (locked).
9. **Existing MVP 19-criterion engineering exit** — not reopened; D0 (locked) already establishes this capability as an MVP enhancement that does not reopen the exit, and nothing in this scope map proposes revisiting that.

**No BLOCKING SCOPE CONFLICT identified.**

## 15. Exact Function/Signature Change Map

All "Proposed scope change" entries are **CONCEPTUAL ONLY — NOT IMPLEMENTED**, per the instruction not to write proposed signatures into production files. Status reflects whether *some* change to that surface is required under the current locked decisions, independent of which D8 option is eventually chosen (a row marked REQUIRED changes under any D8 outcome; a row marked OPTIONAL changes only under some D8 outcomes; NOT NEEDED changes under none of the candidates analyzed).

| Layer | File | Function/type | Current signature | Proposed scope change | Status |
|---|---|---|---|---|---|
| Worker | `apps/worker/src/searchWorker/worker.ts` | `runCanonicalPipeline` Research call | `runResearchForOwner(deps, userId, { prospectId })` (worker.ts:359-368) | CONCEPTUAL ONLY: possibly widen the third argument, or leave unchanged if Search context is resolved inside `core-research` instead | OPTIONAL |
| Research service | `packages/core-research/src/service.ts` | `ResearchDeps` | `{ identity, companies, prospects, signals, provider }` (service.ts:21-27) | CONCEPTUAL ONLY: `{ ...existing, searches: SearchRepository }`, mirroring `OpportunityDeps` (`core-opportunity/src/service.ts:42-49`) | OPTIONAL (required only under Option B/Candidate 2) |
| Research service | `packages/core-research/src/service.ts` | `runResearchForOwner` | `(deps, userId, input: RunResearchInput, now)` (service.ts:62-88) | CONCEPTUAL ONLY: internally resolve `search = await deps.searches.getById(userId, prospect.searchId)` and pass its content onward | REQUIRED (in some form — see §5) |
| Research types | `packages/core-research/src/types.ts` | `RunResearchInput` | `{ prospectId: string }` (types.ts:60-62) | CONCEPTUAL ONLY: possibly `{ prospectId, searchId?, targetSegments? }` if context is supplied by the caller rather than resolved internally | OPTIONAL (mutually exclusive with the `ResearchDeps.searches` option above — pick one) |
| Provider boundary | `packages/core-research/src/provider.ts` | `ResearchProviderInput` | `{ prospectId, companyId, companyName, normalizedDomain }` (provider.ts:11-16) | CONCEPTUAL ONLY: `{ ...existing, targetSegments?: string[] }` (Option A) | OPTIONAL (required only under Option A) |
| Provider boundary | `packages/core-research/src/provider.ts` | `ResearchProvider.research` | `research(input: ResearchProviderInput): Promise<LeadResearch>` (provider.ts:24-26) | CONCEPTUAL ONLY: `research(input: ResearchProviderInput, context?: SearchResearchContext): Promise<LeadResearch>` (Option B/Candidate 1 only) | NOT NEEDED under Option B/Candidate 2 or 3; OPTIONAL under Candidate 1 |
| Provider impl | `packages/core-research/src/anthropicResearchProvider.ts` | `createAnthropicResearchProvider(...).research` | (anthropicResearchProvider.ts:51-82) | CONCEPTUAL ONLY: thread the resolved `targetSegments` into the `ResearchInput` literal built at lines 67-71 | REQUIRED (in some form — this is the one place `ResearchInput` is constructed today) |
| Research schema | `packages/core-research/src/schema.ts` | `ResearchInput`/`researchInputSchema` | `{ companyName, websiteUrl, industry?, location?, socialProfileUrl?, sourceDocuments }` (schema.ts:207-224) | CONCEPTUAL ONLY: add `targetSegments?: string[]` (or similar), mirroring the existing `industry`/`location` "supplied, unverified" pattern | REQUIRED (in some form, for the model to ever see the content — regardless of A/B) |
| Prompt | `packages/core-research/src/prompt.ts` | `buildUserMessage` | `(input: ResearchInput): string` (prompt.ts:32-61) | CONCEPTUAL ONLY: render `targetSegments` alongside the existing industry/location facts block (lines 33-39), with the same "supplied, unverified" framing | REQUIRED (companion to the `ResearchInput` change above) |
| Research output | `packages/core-research/src/schema.ts` | `leadResearchSchema` / `allObservations()` | (schema.ts:176-201, 229-249) | CONCEPTUAL ONLY: not required to change if D1's dedicated entity is a separate output, not a `LeadResearch` field | OPTIONAL (D1-implementation scope, not D8) |
| Persistence | (new file/table, D1 scope) | new Search+Prospect determination repository | none exists today | CONCEPTUAL ONLY: `CategoryPlausibilityRepository` keyed by `(searchId, prospectId)` | REQUIRED for D1, but D1-implementation scope, not D8 |
| Qualification | `packages/core-qualification/src/types.ts` | `QUALIFICATION_CRITERIA` | `['NEED_DETECTED', 'EVIDENCE_PRESENT']` (types.ts:12) | CONCEPTUAL ONLY: append a third criterion id | REQUIRED for D4, but D4-implementation scope, not D8 |
| Provider adapters | `anthropicModel.ts` / `openAIModel.ts` / `geminiModel.ts` | model factories | (unchanged, §9) | none | NOT NEEDED |
| `ResearchModel` | `packages/core-research/src/researcher.ts` | `ResearchModel` | `(request: {system,messages,signal}) => Promise<ModelResult>` (researcher.ts:44-56) | none | NOT NEEDED |

## 16. Proposed Implementation Order

```text
IMPLEMENTATION PLAN ONLY — NOT AUTHORIZED
```

| Phase | Files likely touched | Why | Dependencies | Tests required | Governance dependency |
|---|---|---|---|---|---|
| A — Search context access | `core-research/src/service.ts` (`ResearchDeps`, `runResearchForOwner`) and/or `worker.ts` call site, per §15 | Make Search identity/`targetCustomer` reachable at the point Research is invoked | None upstream | Unit tests for whichever function gains the new dependency/parameter | **D8 must be decided first** — this phase's exact shape is D8's own output |
| B — Deterministic target parsing | New pure function, location per §8 (worker, `core-search`/`core-service-profile`, or `core-research`) | D2 requires deterministic segment parsing before evaluation | Phase A (needs the raw string in scope) | Unit tests: single segment, multi-segment, empty/malformed segment, delimiter edge cases | D2 (locked) governs the *policy* (ANY-match, deterministic); parsing *location* is not governed by any locked decision |
| C — Research input/context propagation | `schema.ts` (`ResearchInput`), `prompt.ts` (`buildUserMessage`), `anthropicResearchProvider.ts`, possibly `provider.ts` (`ResearchProviderInput`) per D8's outcome | The model cannot compare evidence against segments it was never told | Phases A, B | Prompt-rendering tests; provider-input construction tests | D8 (the A/B choice) |
| D — Research output schema | `schema.ts` (`leadResearchSchema`) and/or a new output shape, per D1 | D1 already locks "dedicated Search + Prospect determination," not a reused field | Phase C (model must receive segments before it can evaluate them) | Schema validation tests; provenance tests for the new claim | D1 (locked as to shape; not yet built) |
| E — Validation/persistence | New repository/table for D1's entity; `mapping.ts` untouched unless D1 chooses to also mirror into `LeadResearch`/`ResearchSignal` | D6 requires a `(searchId, prospectId)`-keyed persistence path `research_signals` cannot express today (§11, §13) | Phase D | Persistence round-trip tests; cross-Search non-overwrite tests (informed by §13's finding that the general risk is already narrower than previously described, but the new entity's own correctness still needs direct tests) | D1, D6 (both locked as to policy; D1's schema itself unbuilt) |
| F — Qualification criterion | `core-qualification/src/types.ts`, `rules.ts`, `evaluator.ts` | D4 locks a new, distinct criterion | Phase E (criterion needs something to read) | Rule unit tests; evaluator integration tests alongside existing `NEED_DETECTED`/`EVIDENCE_PRESENT` short-circuit; MISMATCH-does-not-block-Opportunity-creation test; UNKNOWN-does-not-create-new-state test | D4, D5 (both locked) |
| G — Integration tests | `worker.test.ts`, cross-package integration tests | Prove the real worker path carries context end-to-end | Phases A-F | Full-pipeline integration test: Search with multi-segment `targetCustomer` -> Research -> persisted determination -> Qualification outcome | All of the above |
| H — Live validation | None (process, not code) | Confirm real-world behavior against a live provider | Phase G | N/A — live validation, not a test file | Requires a funded provider account (per D8_DECISION_PREPARATION.md §11's D11 note); explicitly out of scope for this or any read-only document |

Phase A cannot begin until D8 is decided; Phases B-D are largely D8-independent in substance (parsing and prompt rendering happen the same way regardless of *how* context arrives) but cannot be finalized in code until Phase A fixes the exact signature they build on.

## 17. Test Surface

Existing test files that would eventually need changes, identified by inspecting current coverage (not modified by this task):

| Concern | Likely test file(s) |
|---|---|
| Deterministic parsing | New test file (no existing parsing tests exist to extend) |
| Multi-segment ANY semantics | New test file, or extension of `packages/core-research/src/research.test.ts` |
| Provider-neutral Research flow | `packages/core-research/src/service.test.ts`, `packages/core-research/src/research.test.ts`, `packages/core-research/src/anthropicResearchProvider.test.ts` |
| Search + Prospect attribution | New test file for D1's dedicated entity/repository; possibly `apps/worker/src/searchWorker/worker.test.ts` for end-to-end attribution |
| Persistence/freshness | New test file (D1's repository); `packages/core-research/src/mapping.test.ts` only if D1 also touches `mapping.ts` (not required, per §10/§15) |
| UNKNOWN behavior | New test file for the parsing/evaluation logic; `packages/core-qualification/src/evaluator.test.ts` for the Qualification-side effect |
| MATCH behavior | Same as above |
| MISMATCH behavior | Same as above, plus explicit assertion in `evaluator.test.ts` / `apps/worker/src/searchWorker/worker.test.ts` that Opportunity creation still succeeds |
| Qualification criterion | `packages/core-qualification/src/evaluator.test.ts`, `packages/core-qualification/src/service.test.ts` |
| No effect on Opportunity creation | `packages/core-opportunity/src/service.test.ts` (assert unchanged), `apps/worker/src/searchWorker/worker.test.ts` |
| No effect on scoring | `packages/core-opportunity/src/service.test.ts` (scoring section), assert `FACTOR_WEIGHTS`/`scoreOpportunity` untouched — likely no new test needed if no scoring code changes, only a regression check |
| R-71 remains unchanged | `packages/core-opportunity/src/adapters.ts`'s own existing tests (file name not yet located in this task's file listing — likely `adapters.test.ts` or covered within `service.test.ts`); assert `TOPICAL_FIELDS`/`toOfferSignals()` behavior is unchanged by any new field |

No test file is modified by this document.

## 18. Remaining D8 Decision

```text
D8 STATUS: UNDECIDED
```

Per `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3 (D8 section, still reading `PRODUCT OWNER DECISION REQUIRED`) and `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_DECISION_PREPARATION.md` §14 (`Decision: UNDECIDED`), D8 has not been decided by any authoritative record as of this task. This document does not decide it either.

**The exact remaining Product Owner choice**, restated from the D8 decision-preparation document:

> Should the implementation extend `ResearchProviderInput` to carry the Search-scoped category-plausibility context (**Option A**), or preserve the existing `ResearchProviderInput` contract and introduce a separate Search-scoped context mechanism (**Option B**)?

This scope map does not narrow that choice beyond what D8_DECISION_PREPARATION.md already established, except to add one clarification surfaced by tracing code further in this task: Option B itself has (at least) three viable sub-candidates (§7(5), §15) — a new `ResearchDeps.searches` dependency resolving context internally; a widened `RunResearchInput` populated by the worker; or a second parameter on `ResearchProvider.research()` — and D8, even if resolved in favor of "B" at the top level, would still need a follow-up choice among these. This is presented as an added precision, not a new decision made on the Product Owner's behalf.

## 19. Recommendation

```text
RECOMMENDATION — NOT IMPLEMENTATION AUTHORIZATION
```

Carrying forward, not silently converting into a decision, the recommendation already given in `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_DECISION_PREPARATION.md` §13:

**RECOMMENDATION:** Preserve `ResearchProviderInput` and carry Search-scoped context through the Research orchestration boundary, resolving Search parameters from the existing Search/Prospect relationship before constructing the provider-neutral research request.

Concretely, per this task's own tracing: add a `searches: SearchRepository` dependency to `ResearchDeps` (`core-research/src/service.ts:21-27`), mirroring `OpportunityDeps`'s existing, working pattern (`core-opportunity/src/service.ts:42-49,123`), and resolve `search = await deps.searches.getById(userId, prospect.searchId)` inside `runResearchForOwner`, immediately after the existing `prospect` lookup (`service.ts:70`) — the same shape of call `createOpportunityForOwner` already makes.

**This remains a recommendation, not a decision.** It is offered because:
- direct, working precedent exists for it in this exact repository (`core-opportunity`'s pattern), and no comparable precedent exists for widening `ResearchProviderInput` itself;
- `ResearchProvider.research(input)`'s signature is explicitly documented elsewhere as intentionally frozen (`anthropicResearchProvider.ts:9-10`);
- provider neutrality is preserved identically either way (§9), so that dimension does not favor Option A.

**This recommendation does not itself decide D8.** §18 remains `UNDECIDED` regardless of this section's content, per explicit instruction not to convert the recommendation into an implementation decision.

## 20. Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION

NOT GRANTED
```

Nothing in this document authorizes writing, modifying, or generating any production code, test, schema, migration, configuration, or provider-adapter file. Every signature shown in §15/§8/§12 is explicitly conceptual and not implemented. A separate, explicit authorization step — naming which of D7-D11 are resolved and how, in addition to D8 itself — is required before any implementation phase in §16 may begin.

## 21. Repository Safety

```text
HEAD:                        5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged, before and after)
Branch:                      phase-17-r34-worker-orchestration

WORKING TREE:                unchanged apart from this task's one new file (verified below)
NEW FILE:                    requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_IMPLEMENTATION_SCOPE_MAP.md
                              (this file — the only file created or modified by this task)

PRODUCTION FILES MODIFIED:   0
TEST FILES MODIFIED:          0
PRD MODIFIED:                  0
CONFIG MODIFIED:                0
DATABASE MODIFIED:               0
PROVIDER MODIFIED:                0
LIVE API CALLS:                    0
STAGED:                             none
COMMIT:                              none
PUSH:                                 none

Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

Pre-existing untracked files (untouched by this task, the full pre-existing
requirement/*.md set, .claude/, and CLAUDE.md included).

Files read for this task, not modified:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_DECISION_PREPARATION.md
  requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md (actual name
    for the requested PATH_2_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md)
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md
  requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md
  requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md (actual name for the
    requested PATH_2_CATEGORY_PLAUSIBILITY_PATH_DECISION.md)
  requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md
  requirement/CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md
  packages/core-research/src/{provider.ts, schema.ts, service.ts, researcher.ts,
    researchModelFactory.ts, anthropicResearchProvider.ts, mapping.ts, repository.ts,
    prompt.ts, persist.ts, types.ts, anthropicModel.ts, openAIModel.ts, geminiModel.ts}
  packages/core-service-profile/src/types.ts
  packages/core-search/src/types.ts, repository.ts
  packages/core-discovery/src/types.ts, repository.ts
  packages/core-opportunity/src/service.ts, types.ts, adapters.ts
  packages/core-qualification/src/types.ts, rules.ts, evaluator.ts, service.ts, repository.ts
  packages/db/prisma/migrations/0015_discovery/migration.sql
  packages/db/prisma/migrations/0016_research_signals/migration.sql
  apps/worker/src/searchWorker/worker.ts

No git add/commit/push/reset/restore/checkout/clean/stash performed. No application/
worker process started, no Search created, no Google Places calls, no Anthropic/
OpenAI/Gemini API calls, no migrations run, no database modified, no environment
variable changed.
```
