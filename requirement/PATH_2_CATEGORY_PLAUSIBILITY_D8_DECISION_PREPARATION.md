# Path 2 Category Plausibility — D8 Decision Preparation

## 1. Status

```text
READ-ONLY / PRODUCT OWNER DECISION REQUIRED
```

This document prepares, but does not make, the D8 decision: **how should the participant's Search-scoped category-plausibility context reach Research?** It compares exactly two architectural approaches — (A) extend `ResearchProviderInput`, (B) preserve `ResearchProviderInput` and introduce a separate Search-scoped context mechanism — traces the current code to ground every claim, and ends with an explicit, unresolved Product Owner question. No production code, test, PRD, configuration, database/migration, or provider file is created or modified by this document. No decision is selected on the Product Owner's behalf.

## 2. Locked Context

D0–D6 are locked (`requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3–§4) and are **not reopened** here:

```text
D0  MVP status:            MVP enhancement (does not reopen the 19-criterion exit)
D1  Output location:       Dedicated Search + Prospect category-plausibility determination
                            (not Prospect-global; not LeadResearch.targetCustomers;
                            not routed through R-71)
D2  Multi-segment:          Deterministic segment parsing + ANY-match (OR) semantics
D3  Evidence sufficiency:   First-party website evidence primary; search-derived metadata
                            supporting only; UNKNOWN on insufficient evidence
D4  Qualification:          Q1 — new, distinct Qualification criterion (not routed through
                            R-71 Need Detection)
D5  State behavior:         MATCH passes; MISMATCH fails Qualification but does NOT block
                            Opportunity creation; UNKNOWN fails/holds; no new Opportunity state
D6  Persistence/attribution: Per Search + Prospect; historical attribution preserved;
                            cross-search overwrite not allowed; Qualification reads the
                            current Search + Prospect determination
```

Unchanged boundaries (also locked, re-verified against current code in §11 below, not reopened):

```text
R-71:          TOPICAL_FIELDS / suggestOffers() / toOfferSignals() unchanged
Scoring:       FACTOR_WEIGHTS, OpportunityScore, ranking, four-factor UNKNOWN/deferral
               behavior unchanged; category plausibility stays outside the scoring
               factor system unless a later, explicit Product Owner decision changes this
Discovery:     query construction, provider contract, category filtering unchanged;
               Discovery is not responsible for establishing category plausibility
Opportunity:   state machine, creation gating, and states unchanged (per D5) —
               MISMATCH does not block Opportunity creation, no new state is introduced
Qualification: only the new D4 criterion is in scope; NEED_DETECTED/EVIDENCE_PRESENT
               are not redesigned
```

**D8 is the decision under preparation.** It is not decided by this document.

**A note on document naming, verified in this task:** the task's authoritative-reading list names `requirement/CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md`. That file exists and is tracked at the current HEAD (`git log --oneline -1 -- requirement/CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md` → `5992b82 docs(mvp): record R-70/R-71 boundary decision, close Criterion #19`). It records a related but distinct decision — Option A, "keep current boundary": R-70/R-71 stay scoped to Need Detection/Opportunity Creation only, not reapplied inside scoring or `evaluateEvidencePresent()`. This is consistent with, and does not alter, the R-71-unchanged boundary already locked above. `requirement/PHASE_24_R70_R71_DECISION.md` is a separate, earlier document in the same chain.

## 3. Current Research Input Flow

Traced end-to-end in this task, with file:line citations:

```text
ServiceProfile                    packages/core-service-profile/src/types.ts:10-14
  targetCustomer: string
 ↓ (copied verbatim at Search creation)
StoredSearch.parameters           packages/core-search/src/types.ts:30-46
  (ServiceProfileFields, immutable snapshot; includes targetCustomer)
 ↓
Discovery                         packages/core-discovery/src/service.ts
  buildQuery() reads search.parameters.targetCustomer (unchanged, out of scope)
 ↓
StoredProspect                    packages/core-discovery/src/types.ts:23-30
  { id, userId, searchId, companyId, status, createdAt }
  — searchId is a durable, persisted column (migration 0015); see §5.
 ↓
Worker orchestration              apps/worker/src/searchWorker/worker.ts:327-368
  runCanonicalPipeline(deps, search: StoredSearch) holds the FULL search object
  (search.id, search.parameters.targetCustomer) in scope throughout the loop
  over discovery.prospects (worker.ts:358).
 ↓
runResearchForOwner() call site   apps/worker/src/searchWorker/worker.ts:359-368
  await runResearchForOwner(
    { companies, prospects, signals, provider: deps.researchProvider(userId) },
    userId,
    { prospectId: prospect.id },   <-- ONLY prospectId is passed; search.id and
  )                                    search.parameters.targetCustomer are NOT,
                                       despite both being in scope one line above.
 ↓
runResearchForOwner()              packages/core-research/src/service.ts:62-88
  validateRunResearchInput(input) -> { prospectId }               (line 68)
  prospect = deps.prospects.getById(userId, prospectId)            (line 70)
    — StoredProspect, INCLUDING prospect.searchId, is already loaded here,
      but prospect.searchId is discarded — never read past this point.
  company  = deps.companies.getById(userId, prospect.companyId)    (line 73)
  research = deps.provider.research({                             (line 76-81)
    prospectId: prospect.id,
    companyId: company.id,
    companyName: company.name,
    normalizedDomain: company.normalizedDomain,
  })
 ↓
ResearchProviderInput              packages/core-research/src/provider.ts:11-16
  { prospectId, companyId, companyName, normalizedDomain }  — exactly four fields,
  none of them targetCustomer, searchId, or any parsed segment.
 ↓
ResearchProvider.research(input)   packages/core-research/src/provider.ts:24-26
 ↓
createAnthropicResearchProvider    packages/core-research/src/anthropicResearchProvider.ts:51-82
  fetches sourceDocuments via SourceDocumentProvider (first-party homepage only)
  builds ResearchInput = { companyName, websiteUrl, sourceDocuments }  (line 67-71)
    — industry/location/socialProfileUrl are NOT populated here, though
      ResearchInput's schema supports them (see §4).
  calls researchLead(deps.model, researchInput, { onInvocation })       (line 73-77)
 ↓
researchLead()                     packages/core-research/src/researcher.ts:151-293
  researchInputSchema.parse(rawInput)                                   (line 156)
  buildUserMessage(input) -> user message string                       (line 176, prompt.ts:32-61)
  model({ system: SYSTEM_PROMPT, messages, signal })                    (line 198-202)
 ↓
ResearchModel                      packages/core-research/src/researcher.ts:44-56
  (request: { system, messages, signal }) => Promise<ModelResult>
  — PROVIDER-NEUTRAL. Anthropic/OpenAI/Gemini adapters never see
    ResearchProviderInput OR ResearchInput directly — only the already-
    rendered system/messages strings researchLead() builds. See §10.
 ↓
leadResearchSchema validation, verifyProvenance(), repair/retry loop
                                    packages/core-research/src/schema.ts:176-201,
                                    provenance.ts:253 (via researcher.ts), repair.ts
 ↓
LeadResearch (research output)     packages/core-research/src/schema.ts:176-201
 ↓
toNewResearchSignals()             packages/core-research/src/mapping.ts:16-30
  iterates allObservations(research) (schema.ts:229-249), consults FIELD_KIND
  (persist.ts:38-48) for each field's kind
 ↓
ResearchSignalRepository            packages/core-research/src/repository.ts:13-29
  supersedePrevious(prospectId, at)  — keyed by prospectId ONLY, no searchId column
  saveSignals(prospectId, signals, observedAt)
  concrete impl: pgRepository.ts:50 (createPgResearchSignalRepository)
 ↓
Qualification                       packages/core-qualification/src/service.ts:59-78
  evaluateQualificationForOwner(deps, userId, opportunityId, now):
    opportunity = deps.opportunities.getById(userId, opportunityId)     (line 65)
      — StoredOpportunity has NO searchId field (core-opportunity/src/types.ts:40-59;
        see §5 and §9).
    signals = deps.signals.listByProspect(userId, opportunity.prospectId) (line 68)
      — scoped by prospectId ONLY, same as Research's own persistence.
    evaluateQualification({ needDetected: opportunity.needDetected, signals }) (line 69)
```

## 4. `ResearchProviderInput` Contract

Exact current definition (`packages/core-research/src/provider.ts:11-16`):

```ts
export interface ResearchProviderInput {
  prospectId: string;
  companyId: string;
  companyName: string;
  normalizedDomain: string;
}
```

Four fields, exactly. No participant-context field of any kind exists today.

**Construction sites** — every place a `ResearchProviderInput` literal is built:
- `packages/core-research/src/service.ts:76-81` (`runResearchForOwner`, the live production call site) — the only construction site reachable from the worker.
- Test fakes construct it in `packages/core-research/src/service.test.ts` and `packages/core-research/src/research.test.ts` for unit coverage; these are not production call sites.

**A related, currently-unused input surface** exists one layer deeper: `ResearchInput` (`schema.ts:207-224`), which `ResearchProviderInput` is translated into by `anthropicResearchProvider.ts:67-71` (or any provider-neutral equivalent). `ResearchInput` already declares optional `industry`/`location`/`socialProfileUrl` fields, already rendered by `prompt.ts:36-38` with an explicit "supplied, unverified" framing (`prompt.ts:55-56`: *"Treat them as INFERRED at best; do not cite them as OBSERVED"*) — but no current caller populates any of the three (`anthropicResearchProvider.ts:67-71` constructs `ResearchInput` from only `companyName`, `websiteUrl`, `sourceDocuments`). This is a directly reusable precedent in spirit — an existing "participant-supplied, unverified" framing already exists in the prompt — but it is a distinct layer from `ResearchProviderInput` itself: `ResearchProviderInput` is the boundary between the worker/service layer and a `ResearchProvider`; `ResearchInput` is the boundary between a concrete provider implementation (today, `anthropicResearchProvider.ts`) and `researchLead()`. Either or both could be extended; D8, read literally, is about the outer boundary (`ResearchProviderInput`), but any implementation will also need to decide whether `ResearchInput` grows a matching field — noted here, not decided.

## 5. Search-Scoped Context Available Today

| Item | Available at Research call site (`worker.ts:358-368`)? | Available inside `runResearchForOwner` (`service.ts:62-88`)? | Available inside `ResearchProviderInput`/providers? |
|---|---|---|---|
| Prospect ID | Yes — `prospect.id`, from the discovery loop | Yes — `input.prospectId`, validated | Yes — already a field |
| Search ID | Yes — `search.id`, the enclosing function's own parameter | **Not directly** — but recoverable: `runResearchForOwner` already loads `prospect = deps.prospects.getById(userId, prospectId)` (service.ts:70), and `StoredProspect.searchId` (`core-discovery/src/types.ts:26`) is present on that already-fetched row; it is simply not read past that point today | No |
| `targetCustomer` (raw) | Yes — `search.parameters.targetCustomer`, in scope via the same `search` object | **No** — `ResearchDeps` (service.ts:21-27) has no `searches: SearchRepository` dependency, so `runResearchForOwner` cannot resolve `StoredSearch.parameters` from a `prospectId`/`searchId` alone without a new dependency (see below) | No |
| Parsed target segments (per D2) | No — no parsing exists anywhere in the codebase today (confirmed by the earlier D0–D5/decision-packet documents; re-verified: no matches for `targetCustomer` parsing/splitting logic in any package) | No | No |

**A directly applicable precedent for resolving Search context from Prospect identity already exists**, in a sibling domain package, not in `core-research` itself: `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:112-131`) already does exactly this —

```ts
const prospect = await deps.prospects.getById(userId, prospectId);
const search   = await deps.searches.getById(userId, prospect.searchId);   // line 123
...
const rule = toServiceRule(search.parameters);                             // line 131
```

`OpportunityDeps` (`packages/core-opportunity/src/service.ts:42-49`) already carries `searches: SearchRepository` for exactly this purpose. `ResearchDeps` (`packages/core-research/src/service.ts:21-27`) does **not** carry a `searches` dependency today — adding one, and an internal `deps.searches.getById(userId, prospect.searchId)` call inside `runResearchForOwner`, would mirror this existing pattern exactly rather than inventing a new one. This is repository evidence about an available mechanism, not a recommendation to build it inside `core-research` specifically versus at the worker call site (§6–§7 compare both).

**A second, independently important repository fact, load-bearing for §9 below:** `StoredProspect` is documented and enforced as *"the join between a Search and a Company"* (`packages/db/prisma/migrations/0015_discovery/migration.sql:16-24`, `69-77`), with `UNIQUE(search_id, company_id)` (migration.sql:112-116) as *"the MVP deduplication rule itself... one real business appears once within a Search, but the same business may legitimately reappear in a later Search with fresh research — which is exactly why this constraint is scoped to search_id, not user_id"* (migration.sql:16-21). Concretely: **the same real-world business, rediscovered under a second Search, produces a second, distinct `Prospect` row** (a different `id`, sharing the same `companyId`), not the same `Prospect` row reattached to a different Search. This is directly relevant to D6/D8's interaction — see §9.

## 6. Approach A — Extend `ResearchProviderInput`

**What it would conceptually require**, traced against current code, without implementing any of it:

- **New fields on the interface itself** (`provider.ts:11-16`): at minimum a `targetCustomer`-shaped field (raw string, parsed segments, or both — D8 does not by itself resolve which; D2 is already locked to *require* deterministic parsing, so whatever is added must be able to carry parsed segments, not only the raw string, to satisfy D2 without a second contract elsewhere). Optionally a `searchId` field, to satisfy D1's now-locked "dedicated Search + Prospect determination" and D6's "per Search + Prospect" persistence key.
- **Construction site change**: `runResearchForOwner` (`service.ts:76-81`) would need to populate the new field(s). Per §5, the raw `targetCustomer` value is not resolvable from what `runResearchForOwner` already loads (`prospect`, `company`) without either (a) a new `searches: SearchRepository` dependency on `ResearchDeps` plus an internal `deps.searches.getById(userId, prospect.searchId)` call (mirroring `core-opportunity`'s existing pattern, §5), or (b) changing the worker call site (`worker.ts:359-368`) to pass `search.parameters.targetCustomer`/`search.id` down through a widened `RunResearchInput` (`types.ts:60-62`) instead. Either sub-path is a further, currently-undecided implementation choice nested inside Approach A — not resolved by choosing A over B.
- **Whether parsing happens before `ResearchProviderInput` construction**: Not settled by Approach A alone. The interface could carry the raw string (parsing deferred to inside `core-research`, e.g. in `anthropicResearchProvider.ts` or a new pure function called from there) or the already-parsed segments (parsing done by the caller, e.g. in Search/worker code, before `runResearchForOwner` is even invoked). See §8.
- **Provider-neutral placement**: Straightforward to preserve. `ResearchProviderInput` is already a `core-research`-owned interface consumed only by `ResearchProvider.research()` (`provider.ts:24-26`) — itself implemented today by exactly one concrete provider, `createAnthropicResearchProvider` (`anthropicResearchProvider.ts:51`), which is provider-model-agnostic despite its name (it takes an injected `model: ResearchModel`, §3/§10). Any new field added here is visible to that one implementation regardless of which `ResearchModel` (Anthropic/OpenAI/Gemini) it was constructed with — extending the interface does not, by itself, touch `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts`.
- **Impact on Anthropic/OpenAI/Gemini specifically**: None directly, because none of the three adapters consume `ResearchProviderInput` (§10). The only place a new field's *content* would actually reach the model is if it is also threaded into `ResearchInput` (schema.ts:207-224) and rendered by `prompt.ts`'s `buildUserMessage()` (prompt.ts:32-61) — at which point all three providers see it identically, since none of them render the prompt themselves (§10). Extending `ResearchProviderInput` alone, without also extending `ResearchInput`/`prompt.ts`, would add data the model never sees — both layers would need to change together for the field to have any effect on Research's output.
- **Impact on provider tests/contract tests**: `anthropicResearchProvider.test.ts` constructs `ResearchProviderInput` literals directly — adding a required field would require updating every existing literal in that file (and any other test file constructing the same shape, e.g. `service.test.ts`, `research.test.ts`). Adding it as optional would avoid a mechanical break but defers the "is this field always present" question to runtime.
- **Impact on retry/repair/validation machinery**: None directly on `ResearchProviderInput` itself — that machinery (`researcher.ts:151-293`, `provenance.ts`, `repair.ts`) operates on `ResearchInput`/`leadResearchSchema`, a layer below. Only relevant if the new content also reaches `ResearchInput` as a new field that itself needs schema validation (e.g., a `.max()` length bound, mirroring `industry`'s `z.string().trim().min(1).max(120).optional()`, schema.ts:210).
- **Impact on the `ResearchModel` interface**: None. `ResearchModel` (`researcher.ts:44-56`) is defined purely in terms of `{system, messages, signal}` and is never touched by anything added to `ResearchProviderInput`.
- **Coupling between Research and Search domain concepts**: This is the primary architectural cost of Approach A. `ResearchProviderInput` is currently `core-research`'s own vocabulary (`prospectId`, `companyId`, `companyName`, `normalizedDomain` — all Discovery/Company/Prospect concepts already crossing into `core-research`, so this would not be the *first* cross-package concept to appear here). Adding `targetCustomer`/`searchId` would be the first time a `core-search`/`core-service-profile` concept (the participant's own stated intent) crosses into `core-research`'s primary contract, rather than into a request-shaping layer like `ResearchInput`'s existing `industry`/`location` fields (which are themselves already borrowed participant-context, so precedent for *some* coupling already exists at the `ResearchInput` layer specifically, if not at the `ResearchProviderInput` layer).
- **Whether Search + Prospect attribution can be preserved without putting persistence concerns into `ResearchProviderInput`**: Yes, in principle — `ResearchProviderInput` is an *input* contract to `ResearchProvider.research()`; it returns a `LeadResearch` value with no persistence-shape opinion. Adding `searchId`/parsed segments to the input does not, by itself, require `LeadResearch`'s own schema to carry them back out, or dictate how D1's dedicated Search+Prospect entity is persisted downstream. The two concerns (what Research is told, versus what is persisted about the result) are separable regardless of which A/B choice D8 makes.

## 7. Approach B — Preserve `ResearchProviderInput` + Search-Scoped Context

**Does the repository already contain a suitable existing mechanism? Answer, stated explicitly per the task's instruction: No.** No existing type, parameter, or wrapper in `core-research`, `core-search`, or the worker carries "Search-scoped research context" as a distinct concept today. What follows is an evaluation of candidate mechanisms the *existing architecture already supports the shape of* (an additional function parameter, an additional dependency, or a sibling object passed alongside the existing one) — not a proposal for a wholly new abstraction invented for its own sake.

**Candidate 1 — A second parameter alongside `ResearchProviderInput` on `ResearchProvider.research()`.**
- Where it would live: `packages/core-research/src/provider.ts` — the same file, as a second argument or a second interface passed alongside the first, e.g. `research(input: ResearchProviderInput, context: SearchContext): Promise<LeadResearch>`.
- What it would carry: `searchId`, raw `targetCustomer` and/or parsed segments — whatever D8's implementation ultimately needs, without touching the four existing `ResearchProviderInput` fields.
- Can it carry Search ID + Prospect ID + parsed segments? Yes — Prospect ID would remain on the existing `ResearchProviderInput`; the new object would carry Search ID and target-customer data.
- Provider neutrality: Preserved at this layer the same way as Approach A — `ResearchProvider.research()` has exactly one concrete implementation (`createAnthropicResearchProvider`, provider-model-agnostic), so a second parameter reaches it identically regardless of which underlying `ResearchModel` is configured.
- Does `ResearchProviderInput` remain unchanged? Yes, by construction — this is the defining property of Candidate 1.
- Would providers still need to receive the context? Only if the context's content (e.g. `targetCustomer`) must reach the model — which requires the same downstream step as Approach A: threading it into `ResearchInput`/`prompt.ts` so `buildUserMessage()` renders it. Candidate 1 changes *only* where the context enters `core-research`, not whether it eventually reaches the prompt.
- Can it be kept out of the provider-neutral `ResearchModel`? Yes — `ResearchModel` only ever sees rendered `{system, messages}` strings (§10); nothing above that boundary, however it is threaded, is visible to `ResearchModel` itself.
- Does this require a `ResearchProvider` interface change? Yes — `ResearchProvider.research(input)`'s signature itself changes (a new parameter), which is arguably a smaller but still real change to a currently one-argument, "frozen" (per `anthropicResearchProvider.ts:9-10`'s own comment: *"The frozen ResearchProvider runtime method, research(input), is untouched: byte-for-byte the same... signature"*) interface. This tension — B is framed as "preserve `ResearchProviderInput`" but Candidate 1 still changes the surrounding `ResearchProvider.research()` signature — is a genuine cost worth naming explicitly, not resolved by this document.

**Candidate 2 — Resolve Search context inside `runResearchForOwner` via a new `searches` dependency, without changing `ResearchProvider`/`ResearchProviderInput` at all.**
- Where it would live: `packages/core-research/src/service.ts` — add `searches: SearchRepository` to `ResearchDeps` (service.ts:21-27), mirroring `OpportunityDeps` (`core-opportunity/src/service.ts:42-49`) exactly. Inside `runResearchForOwner`, after loading `prospect` (service.ts:70), call `const search = await deps.searches.getById(userId, prospect.searchId)` — the identical pattern `createOpportunityForOwner` already uses (`core-opportunity/src/service.ts:123`).
- What it would carry: the full `StoredSearch`, including `id` and `parameters.targetCustomer` — resolved server-side, not passed in by the worker at all.
- Can it carry Search ID + Prospect ID + parsed segments? Search ID and raw `targetCustomer`, yes, directly. Parsed segments would still require a parsing step somewhere (§8) — this candidate does not by itself decide where.
- Provider neutrality: Preserved — this resolution happens entirely inside `runResearchForOwner`, above and before `ResearchProvider.research()` is ever called; `ResearchProviderInput`'s four fields, and `ResearchProvider`'s one-argument signature, are literally unchanged.
- Does `ResearchProviderInput` remain unchanged? Yes.
- Would providers still need to receive the context? Only the *content* that must reach the model (`targetCustomer`/segments) — and only via the same `ResearchInput`/`prompt.ts` extension every approach eventually needs (§4, §10). Under Candidate 2, `runResearchForOwner` would need some way to pass the resolved `search.parameters.targetCustomer` to `deps.provider.research()` regardless — which means Candidate 2, taken alone, still needs *either* Approach A (extend `ResearchProviderInput` after all, now that the value is resolved) *or* Candidate 1 (a second parameter) to actually deliver the resolved value into `core-research`'s provider boundary. **This is an important internal finding: Candidate 2 answers "where is Search context resolved," not "how does it cross the `ResearchProviderInput`/`ResearchProvider` boundary" — the two questions are independent, and Candidate 2 alone does not avoid deciding the second one.**
- Can it be kept out of the provider-neutral `ResearchModel`? Yes, trivially — it never reaches that layer directly.
- Does this preserve D6 historical attribution? It changes nothing about persistence — `ResearchSignalRepository`/`supersedePrevious` are untouched by this candidate; D1's dedicated Search+Prospect entity is a separate, not-yet-built persistence path regardless of how Research's *input* side is resolved.
- Can Qualification retrieve the Search + Prospect determination correctly? Not affected by this candidate either way — Qualification's read path (`evaluateQualificationForOwner`, `service.ts:59-78`) is downstream of persistence, not of Research's input resolution. See §9's separate finding about Qualification's own Search-scoping gap.

**Candidate 3 — A worker/orchestration-boundary context object, constructed once per `runCanonicalPipeline` iteration and passed to `runResearchForOwner`'s `input` parameter (widening `RunResearchInput`, not `ResearchProviderInput`).**
- Where it would live: `packages/core-research/src/types.ts:60-62` (`RunResearchInput`) — a service-layer input type, one step removed from the provider-facing `ResearchProviderInput`.
- What it would carry: `prospectId` (already present) plus `searchId`/`targetCustomer`/parsed segments, supplied directly by the worker call site (`worker.ts:359-368`), which already holds `search.id` and `search.parameters.targetCustomer` in scope (§3, §5) — no new repository dependency needed inside `core-research` at all, unlike Candidate 2.
- Provider neutrality: Preserved for the same structural reason as Candidates 1/2 — `RunResearchInput` is validated and consumed inside `runResearchForOwner` (`validateRunResearchInput`, `service.ts:68`) before any `ResearchProviderInput` is constructed; whether/how its contents flow into `ResearchProviderInput` is a separate, still-open question — this candidate, like Candidate 2, resolves *where the context is obtained*, not *how it crosses into the provider boundary*.
- Does `ResearchProviderInput` remain unchanged? Only if whatever `RunResearchInput` now carries is *not* subsequently copied into the `ResearchProviderInput` literal at `service.ts:76-81` — which, again, still needs deciding (Approach A or Candidate 1) for the value to ever reach a provider.
- Distinguishing note relative to Candidate 2: Candidate 3 keeps `ResearchDeps` unchanged (no new `searches` dependency) at the cost of the worker call site needing to be edited to pass `search.id`/`search.parameters.targetCustomer` explicitly — the same worker-side edit every prior Path 2 document already identified as necessary at `worker.ts:359-368` regardless of which D8 option is chosen. Candidate 2 keeps the worker call site unchanged at the cost of a new `ResearchDeps.searches` dependency. Neither is free; this is a genuine implementation-location tradeoff, not a repository fact that already favors one.

**Summary for §7:** No pre-existing, purpose-built "Search-scoped research context" mechanism exists in the repository today. Candidates 1–3 above are all mechanically supported by the current architecture (a second function parameter, a new repository dependency mirroring an existing sibling package's pattern, or a widened existing input type) — none requires inventing a genuinely new kind of abstraction. All three still leave open exactly one further question common to Approach A as well: **how does the resolved value cross from wherever it is obtained into whatever `ResearchProviderInput`/`ResearchProvider.research()` ultimately receives** — because that is the one boundary every path into Research must cross before the value can reach `ResearchInput`/`prompt.ts` and therefore the model itself (§10).

## 8. Deterministic Parsing Boundary

D2 already locks deterministic multi-segment parsing + ANY-match semantics; this section traces *where* that parsing could occur relative to the Research input boundary, without selecting a location (none is clearly established by the repository today — no parsing of any kind exists anywhere in the codebase, confirmed by grep in this and every prior Path 2 task).

**Location 1 — Before `ResearchProviderInput` construction (worker or Search/service-profile layer).**
- Ownership: Would live in `apps/worker/src/searchWorker/worker.ts` or a new pure function in `core-search`/`core-service-profile`, operating on `ServiceProfileFields.targetCustomer` (`core-service-profile/src/types.ts:12`) or `StoredSearch.parameters.targetCustomer` (`core-search/src/types.ts:35`) — domains that already own the raw string.
- Provider neutrality: Fully preserved — parsing here happens entirely before any `core-research` code runs, so it cannot vary by provider by construction.
- Testability: Testable in isolation as a pure string-splitting function, independent of any Research/provider test fixtures — the cheapest location to unit-test the parsing rule itself.
- Reuse: If category plausibility is ever needed by a *different* consumer than Research (not currently proposed, but architecturally possible), parsing done here would already be available to it; parsing done inside `core-research` would not be, without a new export.
- Search scoping: Naturally colocated with `search.id`/`search.parameters` if done in the worker; would need `prospect.searchId` + a `SearchRepository` lookup (§5, §7 Candidate 2) if done inside `core-research` — not applicable to Location 1, since Location 1 is defined as being outside `core-research`.
- Raw input preservation: Straightforward — the raw string is already held locally at this point; both raw and parsed forms can be passed onward together if needed (e.g., for audit/evidence purposes, consistent with D3's evidence requirements).

**Location 2 — At a Search/worker orchestration boundary, but as a distinct step from Location 1 (e.g., a dedicated parsing call inside `runCanonicalPipeline` immediately before the Research call, rather than upstream in `core-search`/`core-service-profile` themselves).**
- Ownership: `apps/worker/src/searchWorker/worker.ts` specifically, not a shared package — the parsing logic would not be reusable by any other caller without extracting it later.
- Provider neutrality: Same as Location 1 — preserved, for the same reason.
- Testability: Testable via `worker.test.ts`, but coupled to worker orchestration test setup rather than isolated unit tests — a heavier test surface than Location 1 for the same parsing logic.
- Reuse: Weaker than Location 1 — logic embedded in the worker is not naturally reusable by, e.g., a future HTTP-triggered research re-run path (if one is ever added) without extraction.
- Search scoping: Same natural colocation with `search.id`/`search.parameters` as Location 1, since the worker already holds both.
- Raw input preservation: Same as Location 1.

**Location 3 — Inside `core-research`, before provider invocation (e.g., inside `runResearchForOwner`, or inside `anthropicResearchProvider.ts`/a shared helper it calls, immediately before or during `ResearchInput` construction).**
- Ownership: `packages/core-research/src/service.ts` or `packages/core-research/src/anthropicResearchProvider.ts` (or a new shared function in `core-research`) would take on parsing logic for a concept (`targetCustomer`) that `core-research` does not otherwise own — it is a `core-service-profile`/`core-search` concept today (§6's "coupling" point applies here too).
- Provider neutrality: Preserved in the same mechanical sense as Locations 1/2 (parsing itself does not touch `ResearchModel`), but only if the parsing runs once, above the point where a per-provider path could diverge — i.e., inside `runResearchForOwner`/`anthropicResearchProvider.ts` (shared across all three `ResearchModel` configurations), never duplicated inside `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` individually (which would violate the existing `researchModelFactory.ts` provider-neutrality constraint, §10).
- Testability: Testable via `core-research`'s own existing test files (`service.test.ts`, `anthropicResearchProvider.test.ts`), colocated with the tests that already exercise the surrounding orchestration — but requires `core-research`'s test fixtures to also supply a raw `targetCustomer` value, which they do not today.
- Reuse: Weakest of the three — parsing logic living inside `core-research` is the least natural fit if any future consumer outside Research ever needed the same parsed segments (e.g., a hypothetical future UI-side preview of "how your target customer will be interpreted").
- Search scoping: Requires `core-research` to have already obtained `targetCustomer` by one of §7's candidates (2 or otherwise) before parsing it — Location 3 is downstream of, not a substitute for, resolving *where the value comes from*.
- Raw input preservation: Achievable, but requires deliberately keeping the raw string around alongside the parsed segments through whichever construction step builds `ResearchProviderInput`/`ResearchInput` — not automatic, since `ResearchProviderInput` today carries no string fields beyond identity/name.

**No location is favored by existing repository precedent.** Discovery's own query construction (`buildQuery()`) already consumes the raw, unparsed `targetCustomer` string with no splitting logic anywhere (re-confirmed in this task) — the repository has never needed to parse this field for any purpose before, so there is no existing "this is where such parsing already happens" pattern to extend, only sibling patterns (e.g., `toServiceRule()`'s resolution of `search.parameters`, §5) that establish *how* Search data is reached, not how it would be parsed once reached.

## 9. D6 Search + Prospect Attribution Implications

D6 (locked, not reopened) requires: per Search + Prospect storage, historical attribution preserved, cross-search overwrite not allowed, Qualification reads the current Search + Prospect determination. This section verifies D8's interaction with that requirement against current code.

**Must Search ID travel through Research?** Not necessarily as new data threaded through `ResearchProviderInput` — per §5, `runResearchForOwner` already loads a `StoredProspect` (service.ts:70) that carries `searchId` (`core-discovery/src/types.ts:26`) as a durable, persisted column. Search ID is *reachable* from data Research already touches; whether it needs to additionally travel through `ResearchProviderInput`/`ResearchProvider.research()` specifically is exactly the A/B question this document prepares, not a fact this section can settle unilaterally — but the *raw availability* of Search ID does not, by itself, require extending the provider-facing contract, only (at most) a same-package repository lookup (§7 Candidate 2).

**Does Prospect ID already travel through Research?** Yes — it is the first field of `ResearchProviderInput` today (`provider.ts:12`) and always has been.

**Must `targetCustomer` travel through Research?** Yes, in some form, if D3's evidence-sufficiency work (already locked: first-party evidence primary, ANY-match across parsed segments) is to be evaluated by the model at all — the model cannot compare a business's website against "the participant's target segments" without being told what those segments are. This is the substantive content D8 is about routing; §6/§7 compare *how*, not *whether*.

**Must parsed segments travel through Research?** Given D2's lock on deterministic parsing (done *before* evaluation, per D2's own text: "Parse the participant's targetCustomer into explicit structured segments before category-plausibility evaluation"), and D3's requirement that "the individual segment determinations/evidence... remain explainable" — yes, in some representation, the model (or whatever evaluates its output against each segment) needs the parsed segments, not only the raw string, for the per-segment ANY-match logic D2 locks to be meaningfully executed and audited.

**Does persistence currently key observations by Prospect only?** Yes, confirmed at two independent points: `ResearchSignalRepository.supersedePrevious(prospectId, at)` and `.listByProspect(userId, prospectId)` (`repository.ts:18,28`) both take `prospectId`, never `searchId`; `StoredResearchSignal` itself (`types.ts:44-57`) has no `searchId` column.

**Would the existing supersede behavior incorrectly overwrite a previous Search's determination? A more precise answer than prior Path 2 documents gave, based on evidence newly traced in this task:**

Every one of the six documents this task was told to read before drawing conclusions (`PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md`, `PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md`, `PATH_2_CATEGORY_PLAUSIBILITY_DECISION_PACKET.md`, `PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md`, and the scope-lock/implementation-scope documents they cite) describes the risk in terms of "the same Prospect P discovered under Search A... and later also under Search B... for the same participant" being at risk of the second Search's Research run superseding the first's still-valid signals, because `supersedePrevious` is scoped by `prospectId` only.

Tracing the actual schema in this task (`packages/db/prisma/migrations/0015_discovery/migration.sql:69-116`) surfaces a fact not stated in any of those six documents: **`Prospect` is defined and enforced (`UNIQUE(search_id, company_id)`) as the join row between exactly one Search and one Company.** The migration's own comment states this directly: *"the same business may legitimately reappear in a later Search with fresh research — which is exactly why this constraint is scoped to search_id, not user_id"* (migration.sql:19-21). Concretely: when the same real-world business is rediscovered under a second Search, Discovery's `ProspectRepository.findOrCreate(userId, { searchId, companyId }, now)` (`core-discovery/src/repository.ts:37-41`) does **not** return the first Search's Prospect row — it creates (or finds) a **second, distinct** `Prospect` row, sharing the same `companyId` but carrying the second Search's own `searchId` and its own `id`.

The consequence for D6/D8: **the specific overwrite mechanism the prior documents' scenario describes — "Search A's plausibility result for Prospect X gets silently superseded when Search B's Research runs for Prospect X" — cannot occur for two genuinely different Searches**, because "Prospect X" under Search A and "Prospect X" under Search B are, by the schema's own dedup rule, never the same row; `supersedePrevious(prospectId, at)` operating on Prospect-A's-id can never touch Prospect-B's-id's signals, and vice versa, regardless of whether they represent the same underlying Company. The genuine cross-Search overwrite risk `supersedePrevious` creates is narrower than previously stated: it is scoped to reruns of Research for the *same* Prospect row within what is, by construction, always the *same* Search — which is the *intended*, desired behavior (a rerun should supersede a stale result for that same Search+Prospect pair), not a defect.

**This is not a reopening of D6.** D6's decision text — per Search + Prospect storage, historical attribution preserved, cross-search overwrite not allowed — remains correct and is not contradicted by this finding; if anything, this finding shows the *general* case D6 guards against (a genuinely different Search silently clobbering an unrelated Search's result for what the system treats as "the same Prospect") is already structurally prevented by the existing Prospect/Company/Search relationship, independent of whatever new persistence key D1's "dedicated Search + Prospect determination" eventually builds. What is **not** already handled, and remains exactly as much an open implementation matter as before, is D1's own new persistence path itself (the dedicated Search+Prospect entity is not `ResearchSignal`, and nothing about this finding builds, schemas, or migrates it) — this finding narrows *why* it is needed (chiefly: `ResearchSignal`'s existing rows are not natively queryable "for a specific Search," even though they cannot cross Search boundaries by accident) rather than removing the need for it.

**A related, previously unexamined gap, surfaced in this task and directly relevant to D6's "Qualification reads the current Search + Prospect determination" requirement, though outside D8's own scope to resolve:** `evaluateQualificationForOwner` (`packages/core-qualification/src/service.ts:59-78`) receives only `opportunityId`, resolves `opportunity = deps.opportunities.getById(userId, opportunityId)` (line 65), and reads `signals = deps.signals.listByProspect(userId, opportunity.prospectId)` (line 68) — **`StoredOpportunity` itself (`core-opportunity/src/types.ts:40-59`) carries no `searchId` field.** Even once D1's dedicated Search+Prospect entity exists, Qualification's own call site would need *some* way to know "the current Search" to satisfy D6's Qualification-consumption rule — and, per the worker trace in §3, `evaluateQualificationForOwner` is invoked from the same `runCanonicalPipeline` loop that already holds `search.id` in scope (`worker.ts:397-406`), exactly the same shape of gap D8 addresses for Research. This is noted as an implementation consequence for a future D4/D5 implementation task, not solved, decided, or authorized here — it is outside D8's own scope (D8 is about Research's *input*, not Qualification's *read path*), but the two gaps share the same root cause (Search identity not threaded through worker-orchestrated call sites) and a future implementation may want to address them together.

## 10. Provider Neutrality

Verified in this task against all three adapters' source (`anthropicModel.ts`, `openAIModel.ts`, `geminiModel.ts`) and the factory (`researchModelFactory.ts`):

- **`researchModelFactory.ts:9-16`** is, by its own header comment, *"the ONE place in the codebase allowed to branch on provider identity... Everything above this file — researchLead(), schema.ts, provenance.ts, ResearchProvider, and every downstream package — stays completely unaware of which provider produced a ResearchModel."*
- **`ResearchModel`** (`researcher.ts:44-56`) is defined purely as `(request: { system: string; messages: {...}[]; signal?: AbortSignal }) => Promise<ModelResult>`. Confirmed by reading all three adapters in this task: **none of `anthropicModel.ts`, `openAIModel.ts`, or `geminiModel.ts` ever import, reference, or receive `ResearchProviderInput` or `ResearchInput`.** Each adapter's exported factory (`createAnthropicResearchModel`, `createOpenAIResearchModel`, `createGeminiResearchModel`) returns a function matching only the `ResearchModel` shape — they translate `{system, messages, signal}` into their own wire format and translate the response back into `ModelResult`, nothing more.
- **The only place `ResearchInput` is rendered into text** is `prompt.ts`'s `buildUserMessage()` (prompt.ts:32-61), called once, from inside `researchLead()` (`researcher.ts:176`) — a single, shared, provider-neutral call site upstream of all three adapters.
- **Practical consequence for D8:** whichever approach (A or B) is chosen, and whichever parsing location (§8) is chosen, provider neutrality is preserved *mechanically*, not merely by convention, as long as the new participant-context content is threaded into `ResearchInput` (schema.ts) and rendered by `buildUserMessage()` — because that is the only path by which any content reaches any provider at all. A hypothetical violation would require adding a `targetCustomer`-aware branch inside one of the three adapter files individually, which no candidate in §6/§7/§8 proposes and none has any reason to.
- **`ResearchProviderInput` vs. `ResearchProvider` vs. `ResearchModel` vs. adapters — the four layers, restated for clarity:** `ResearchProviderInput` (provider.ts:11-16) is the request shape into a `ResearchProvider` (provider.ts:24-26); today's one concrete `ResearchProvider`, `createAnthropicResearchProvider` (anthropicResearchProvider.ts:51, provider-model-agnostic despite its name), translates that into a `ResearchInput` (schema.ts:207-224) and calls `researchLead()`, which renders it via `prompt.ts` and calls an injected `ResearchModel` (researcher.ts:44-56); `researchModelFactory.ts` selects which concrete adapter (`anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts`) implements that `ResearchModel` at construction time. Extending `ResearchProviderInput` (Approach A) or introducing a parallel context (Approach B) both operate at the outermost of these four layers — neither reaches the adapters directly, and neither can, without the intermediate `ResearchInput`/`prompt.ts` step.
- **Anthropic-only bias check:** the analysis above treats Anthropic, OpenAI, and Gemini identically, per the instruction not to assume only Anthropic matters. Nothing in `provider.ts`, `researcher.ts`, `researchModelFactory.ts`, or `prompt.ts` differentiates providers — differentiation exists only inside the three adapter files, none of which this document's candidates touch.

## 11. Unchanged Boundaries

Re-verified against current code in this task (not merely re-cited from prior documents):

- **R-71**: `TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])` and `toOfferSignals()` are defined in **`packages/core-opportunity/src/adapters.ts:152,175-199`** — **a citation correction**: every one of the six upstream Path 2 documents this task was told to read cites this as `packages/core-qualification/src/adapters.ts:136-152`; `packages/core-qualification/src/` contains no `adapters.ts` file at all (confirmed by directory listing in this task). `suggestOffers()` itself is defined in **`packages/core-acquisition/src/offer.ts:76`**, not in `core-qualification` either. None of D8's candidates in §6–§8 touch any of these three functions/constants, regardless of the correct file location — the substantive "R-71 unchanged" boundary is unaffected by this citation correction, but the correction is recorded here because an implementation task relying on the prior documents' file paths would fail to find the code they describe.
- **Scoring**: `scoreOpportunity`/`scoreOpportunityForOwner` (`packages/core-opportunity/src/service.ts:264-401`, not re-read line-by-line in this task but not touched by any D8 candidate) remain untouched by every candidate above — none reads or writes `FACTOR_WEIGHTS`, `OpportunityScore`, or ranking. `FIELD_KIND` (`persist.ts:38-48`) is the only scoring-adjacent surface any Path 2 work touches, and it is D7, not D8.
- **Discovery**: `buildQuery()` and Discovery's provider contract are not read, referenced, or touched by any candidate in this document — Discovery continues to receive the raw `targetCustomer` exactly as today; none of the parsing-location candidates in §8 propose moving parsing into Discovery.
- **Opportunity creation**: `createOpportunityForOwner` (`packages/core-opportunity/src/service.ts:112-151`) is read in this task only as a *precedent* for resolving Search context from Prospect identity (§5, §7 Candidate 2) — no candidate proposes modifying this function, its state machine, or its gating behavior.
- **Qualification**: `evaluateNeedDetected`/`evaluateEvidencePresent` (`packages/core-qualification/src/rules.ts:42-80`) are read in this task only to confirm the existing two-criterion shape and to surface the Search-attribution gap noted in §9 — no candidate proposes changing either existing rule function.

## 12. A vs B Comparison

| Dimension | A — Extend `ResearchProviderInput` | B — Separate Search-scoped context |
|---|---|---|
| Existing contract change | Yes — `ResearchProviderInput` (4 fields today) gains at least one new field; every existing construction site and test literal must be updated | No — `ResearchProviderInput` itself is untouched; Candidate 1 changes `ResearchProvider.research()`'s signature instead, Candidates 2/3 change a layer further out (`ResearchDeps`/`RunResearchInput`) |
| Search scoping | Supported directly if a `searchId` field is added | Supported by all three candidates; Candidate 2 resolves it via a new `searches` dependency mirroring `core-opportunity`; Candidate 3 resolves it from data the worker already holds, with no new dependency |
| Provider neutrality | Preserved mechanically (§6, §10) — no adapter touched | Preserved mechanically (§7, §10) — no adapter touched, for the identical structural reason |
| Multi-provider impact | None on Anthropic/OpenAI/Gemini individually either way — impact only reaches providers via `ResearchInput`/`prompt.ts`, a step common to both A and B | Same as A — identical downstream step required regardless |
| Deterministic parsing (D2) | Compatible with any of §8's three locations; does not itself decide where parsing happens | Same — orthogonal to A/B; §8 applies identically to both |
| D6 attribution | Directly carries `searchId` if added, satisfying D6's key at the input-contract layer; persistence (D1's dedicated entity) is a separate, unbuilt concern regardless | Candidates 2/3 make Search ID available without changing the provider-facing contract; still requires *some* path to reach `ResearchInput`/persistence, same as A |
| Coupling | `core-search`/`core-service-profile` concepts (`targetCustomer`, `searchId`) enter `core-research`'s primary, provider-facing contract directly | Candidate 2 confines the new coupling to `ResearchDeps` (a `core-research`-owned interface gaining a `core-search` dependency, mirroring `core-opportunity`'s existing `OpportunityDeps`); Candidate 3 confines it to a service-layer input type (`RunResearchInput`) one step removed from the provider boundary; Candidate 1 still couples `ResearchProvider.research()`'s own signature |
| Test surface | Every existing `ResearchProviderInput` literal in tests needs updating (mechanical, but repository-wide within `core-research`) | Candidate 2/3: existing `ResearchProviderInput` literals untouched; new tests needed for the new dependency/parameter instead. Candidate 1: same signature-change test cost as A, concentrated on `ResearchProvider.research()` call sites instead of the input type itself |
| Retry/repair impact | None directly (§6) — that machinery operates on `ResearchInput`, a layer below either A or B | None directly, for the identical reason |
| Persistence impact | None directly — `ResearchProviderInput` has no persistence-shape opinion (§6); D1's dedicated entity is unaffected by A vs. B | Same — none of Candidates 1–3 touch `ResearchSignalRepository` or D1's (unbuilt) dedicated entity |
| Qualification consumption | Not affected by A vs. B — Qualification's read-path gap (§9) exists independent of how Research's input is resolved | Same — not affected either way |
| Architectural risk | Moderate: permanently widens `core-research`'s most-visible, longest-standing contract (`ResearchProviderInput`) with concepts it did not previously own; every future `ResearchProvider` implementation inherits the wider contract whether it needs the new fields or not | Candidate 1: similar risk, concentrated on `ResearchProvider.research()`'s signature instead of `ResearchProviderInput` itself, and in tension with that interface's own "frozen... byte-for-byte" framing (anthropicResearchProvider.ts:9-10). Candidates 2/3: lower risk to `core-research`'s external contract, at the cost of a less visible, more implicit resolution path (a reader of `ResearchProviderInput` alone would no longer see the full picture of what Research is told) |
| Repository evidence | `ResearchProviderInput` already carries several Discovery/Prospect-domain fields (`prospectId`, `companyId`, `companyName`, `normalizedDomain`) — some cross-package coupling at this exact layer already exists, weakening the "A introduces a new kind of coupling" concern somewhat | `core-opportunity`'s `OpportunityDeps`/`createOpportunityForOwner` (§5, §7 Candidate 2) is the closest existing precedent for resolving Search context from Prospect identity inside a sibling domain's service layer — direct, applicable precedent exists for B specifically, not for A |

## 13. Recommendation

This is a recommendation based strictly on repository evidence and the locked D0–D6 decisions. **It does not authorize implementation and is not itself a Product Owner decision — §14 remains open.**

The repository evidence leans toward **Approach B, specifically via Candidate 2** (resolve Search context inside `runResearchForOwner` via a new `searches: SearchRepository` dependency, mirroring `OpportunityDeps`/`createOpportunityForOwner`'s existing, working pattern), for three evidence-backed reasons:

1. **Direct, working precedent exists for B and not for A.** `core-opportunity`'s `createOpportunityForOwner` already resolves `search.parameters` from `prospect.searchId` via an injected `SearchRepository`, entirely without widening any provider-facing contract analogous to `ResearchProviderInput` (`core-opportunity` has no such contract at all — it calls domain functions directly). No comparably direct precedent exists in this repository for widening a provider-facing input contract like `ResearchProviderInput` with a participant-intent field; the closest analogue (`ResearchInput`'s unused `industry`/`location` fields) sits one layer *below* `ResearchProviderInput`, not at it.
2. **`ResearchProvider.research(input)`'s signature is explicitly documented as intentionally stable** (`anthropicResearchProvider.ts:9-10`: *"The frozen ResearchProvider runtime method, research(input), is untouched: byte-for-byte the same... signature"*). Approach A and Candidate 1 both change something at or adjacent to that exact boundary (the input shape, or the method's own arity); Candidate 2 changes `ResearchDeps` (a dependency-injection surface already designed to grow — `ResearchDeps` already varies across `runResearch`/`runResearchForOwner`) instead, leaving the frozen boundary untouched.
3. **Provider neutrality is preserved identically by both A and B** (§10) — this dimension does not favor either approach, so it does not offset points 1–2.

**Important tradeoffs, stated plainly, not resolved:**
- Candidate 2 still requires deciding *how* the resolved `targetCustomer`/parsed segments ultimately reach `ResearchInput`/`prompt.ts` (§7's own finding) — Candidate 2 alone does not complete the picture; some narrow extension at or near the `ResearchProviderInput` boundary (even if only inside `runResearchForOwner`'s own construction of the `ResearchProviderInput` literal, not the interface's public shape) may still be needed to carry the *value* the rest of the way, once resolved. Whether that final, narrow step counts as "extending `ResearchProviderInput`" after all is itself a definitional question this document does not resolve.
- Approach A is simpler to reason about from the outside — a reader of `ResearchProviderInput` alone sees everything Research is told, with no need to also read `ResearchDeps`/`service.ts` to discover that Search context is resolved internally. Candidate 2 trades that visibility for a smaller footprint on the provider-facing contract.
- D1's now-locked "dedicated Search + Prospect determination" (a new persistence entity, not `ResearchSignal`) is unaffected by this recommendation either way — nothing about resolving Search context earlier or later changes what gets persisted or how.

**Assumptions made in reaching this recommendation:**
- That "preserve `ResearchProviderInput`'s existing four fields, byte-for-byte" is a value worth weighing, given the interface's own "frozen" framing in its neighboring file's comment — this is an inference from that comment's wording, not a formal architectural rule stated as a constraint anywhere else in the repository.
- That `core-opportunity`'s pattern (`OpportunityDeps.searches`) is a fair analogue for `core-research` to follow — both are sibling domain packages resolving `StoredSearch.parameters` from `prospect.searchId` for a comparable purpose (deriving participant intent to compare against evidence); no document establishes this as a required convention, only as an existing, working example.

The evidence is sufficient to lean toward B/Candidate 2 on the grounds above; it is not sufficient to declare A architecturally unsupportable — A remains fully compatible with the current architecture (§6), just with a larger, more visible footprint on a contract whose neighboring documentation calls it frozen.

## 14. D8 Product Owner Decision

```text
D8: Should the implementation extend ResearchProviderInput to carry the
Search-scoped category-plausibility context, or preserve the existing
ResearchProviderInput contract and introduce a separate Search-scoped
context mechanism?
```

**Option A — Extend `ResearchProviderInput`.** Add participant-context field(s) (raw `targetCustomer`, parsed segments, and/or `searchId`) directly to the existing four-field interface (`provider.ts:11-16`). See §6, §12.

**Option B — Preserve `ResearchProviderInput`; introduce a separate Search-scoped context mechanism.** Three repository-supported candidates identified, none currently implemented (§7): (1) a second parameter on `ResearchProvider.research()`; (2) a new `searches: SearchRepository` dependency on `ResearchDeps`, resolving Search context internally inside `runResearchForOwner`, mirroring `core-opportunity`'s existing pattern; (3) a widened `RunResearchInput` populated by the worker call site, which already holds the needed data in scope.

**Recommendation (not a decision):** Option B, specifically Candidate 2, per §13 — with the explicit caveat that some narrow value-carrying step near the `ResearchProviderInput`/`ResearchInput` boundary remains necessary regardless of which top-level option is chosen, since that is the only path by which any content reaches any of the three providers (§10).

**Implementation consequences, either way (not authorized by this document):**
- `ResearchInput` (schema.ts:207-224) and `prompt.ts`'s `buildUserMessage()` (prompt.ts:32-61) will need a new field and rendering logic regardless of A/B, mirroring the existing `industry`/`location` "supplied, unverified" framing.
- D2's deterministic parsing (§8) must be implemented somewhere, independent of A/B.
- D1's dedicated Search + Prospect persistence entity remains entirely separate work, unaffected by A/B.
- Existing tests constructing `ResearchProviderInput`/`ResearchDeps`/`RunResearchInput` literals will need updating in whichever files touch the chosen surface (`service.test.ts`, `research.test.ts`, `anthropicResearchProvider.test.ts` at minimum).

**Unresolved questions this document surfaces but does not answer:**
- Whether the raw `targetCustomer` string, the parsed segments, or both must be preserved end-to-end for D3's evidence/audit requirements (§8's "raw input preservation" point).
- Whether `searchId` itself needs to reach `ResearchProviderInput`/`ResearchInput` at all, or only the *content* (`targetCustomer`) — since D1's persistence entity, not Research's input contract, is what ultimately needs to know the Search ID for storage purposes; Research arguably only needs `targetCustomer`'s content to do its comparison, not the Search's identity as such. Not resolved here.
- The related Qualification-side Search-attribution gap surfaced in §9 (`StoredOpportunity` has no `searchId`), which D8 does not cover but a future D4/D5 implementation will need to address separately.

**Decision:**
UNDECIDED

## 15. Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION

NOT GRANTED
```

This document prepares a decision. It does not implement `ResearchProviderInput`, `ResearchDeps`, `RunResearchInput`, `ResearchProvider`, any parsing logic, any provider adapter, any test, any schema, any migration, or any configuration. No such change is made by this document. A separate, explicit implementation-authorization step is required after D8 (and D7, D9, D10, D11) are resolved.

## 16. Repository Safety

```text
HEAD before:                5992b82b9adff492c480442d68a954f2a03bfb28
HEAD after:                 5992b82b9adff492c480442d68a954f2a03bfb28 (unchanged)
Branch:                     phase-17-r34-worker-orchestration

Files changed:              1
  New file:                 requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_DECISION_PREPARATION.md
                             (this file — the only file created or modified by this task)

Production files changed:   0
Tests changed:               0
PRD changed:                  0
Configuration changed:        0
Database/migrations changed:  0
Provider files changed:       0
Live API calls:                0
Staged files:                  none
Commit:                        none
Push:                          none

Pre-existing modified files (untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

Pre-existing untracked files (untouched by this task, the full pre-existing
requirement/*.md set, .claude/, and CLAUDE.md included).

Files explicitly read for this task, not modified:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_DECISION_PACKET.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md
  requirement/CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md (confirmed tracked, HEAD-committed)
  packages/core-research/src/{provider.ts, schema.ts, service.ts, researcher.ts,
    researchModelFactory.ts, anthropicResearchProvider.ts, mapping.ts, repository.ts,
    prompt.ts, anthropicModel.ts, openAIModel.ts, geminiModel.ts, types.ts}
  packages/core-service-profile/src/types.ts
  packages/core-search/src/types.ts, repository.ts
  packages/core-discovery/src/types.ts, repository.ts
  packages/core-opportunity/src/service.ts, types.ts, adapters.ts
  packages/core-qualification/src/types.ts, rules.ts, evaluator.ts, service.ts
  packages/db/prisma/migrations/0015_discovery/migration.sql
  apps/worker/src/searchWorker/worker.ts
```
