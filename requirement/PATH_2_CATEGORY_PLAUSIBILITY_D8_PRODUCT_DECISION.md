# Path 2 — D8 Product Decision

## 1. Status

```text
D8 STATUS: DECIDED — OPTION B

DECISION STATUS: RECORDED / NON-BINDING

IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

The Product Owner has selected **Option B — preserve the provider-facing Research contract where possible and carry Search-scoped participant context through Research orchestration/dependencies** (§13). This selection is recorded for future scope-lock purposes only. It is a **non-binding architectural direction**, not an implementation authorization: no production code, test, PRD, configuration, database/migration, or provider file is created or modified by this document or by the decision it records, and no live API call is made. A separate, explicit implementation-authorization step is required before any implementation work on D8 (or on D1's still-unbuilt persistence entity, or on D4/D5's Qualification criterion) may begin.

This document originally (as `UNDECIDED`) converted the already-audited D8 evidence (`requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_DECISION_PREPARATION.md`, `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_IMPLEMENTATION_SCOPE_MAP.md`) into a precise decision comparison between **Option A — extend `ResearchProviderInput`** and **Option B — preserve the provider-facing contract and carry Search-scoped context through a separate orchestration/context mechanism**. §5–§12 (the comparison and recommendation) are preserved unchanged below as the evidentiary basis for the now-recorded decision in §13.

## 2. Locked Context from D0–D6

Per `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3–§4, the following are **DECIDED** and are **not reopened** by this document:

```text
D0  MVP status:              CATEGORY PLAUSIBILITY IS AN MVP ENHANCEMENT.
                              Does not reopen the 19-criterion engineering exit
                              (`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §18,
                              "MVP ENGINEERING EXIT: SATISFIED").

D1  Output location:         USE A NEW DEDICATED SEARCH + PROSPECT
                              CATEGORY-PLAUSIBILITY DETERMINATION.
                              Not Prospect-global. Not `LeadResearch.targetCustomers`.
                              Not routed through R-71.

D2  Multi-segment semantics: USE ANY-MATCH SEMANTICS WITH DETERMINISTIC SEGMENT
                              PARSING. MATCH = at least one segment sufficiently
                              evidenced; MISMATCH = evidence excludes every
                              supplied segment; UNKNOWN = evidence insufficient
                              for any segment.

D3  Evidence sufficiency:    First-party website evidence primary; search-derived
                              business metadata supporting only; weak/generic
                              signals insufficient alone; UNKNOWN on insufficient
                              evidence (never a default MISMATCH).

D4  Qualification:           Q1 — USE A NEW QUALIFICATION CRITERION, distinct
                              from R-71 Need Detection; must not alter
                              `TOPICAL_FIELDS`/`suggestOffers()`/`toOfferSignals()`.

D5  State behavior:          MATCH passes the criterion (normal Qualification
                              flow). MISMATCH fails the criterion but does NOT
                              block Opportunity creation. UNKNOWN fails/holds
                              the criterion; no new Opportunity state is
                              introduced.

D6  Persistence/attribution: PER SEARCH + PROSPECT. Historical attribution
                              preserved. A `targetCustomer` change produces a
                              new, Search-scoped determination. Cross-search
                              overwrite NOT ALLOWED. Qualification reads the
                              CURRENT Search + Prospect determination.
```

D0–D6 are treated here exactly as locked; this document does not restate their supporting evidence beyond what is needed to reason about D8.

**Unchanged boundaries** (also locked, not reopened, re-verified against current code at the HEAD recorded in §15 below):

```text
R-71:          TOPICAL_FIELDS / suggestOffers() / toOfferSignals() unchanged
                (packages/core-opportunity/src/adapters.ts:152,175-199 and
                packages/core-acquisition/src/offer.ts:76 — a citation
                correction already recorded in the D8 preparation documents;
                core-qualification/src/adapters.ts does not exist)
Scoring:       scoreOpportunity/scoreOpportunityForOwner, FACTOR_WEIGHTS,
                OpportunityScore, ranking unchanged (packages/core-opportunity/
                src/service.ts:264-401)
Discovery:     query construction, provider contract, category filtering
                unchanged; Discovery continues to receive the raw
                targetCustomer exactly as today
Opportunity:   state machine, creation gating unchanged (per D5) —
                createOpportunityForOwner (core-opportunity/src/service.ts:112-151)
                remains unconditional
Qualification: only the future D4 criterion is in scope; NEED_DETECTED/
                EVIDENCE_PRESENT (packages/core-qualification/src/types.ts:12)
                are not redesigned
```

## 3. D8 Question

> How should the participant's Search-scoped `targetCustomer` context reach the Research orchestration without unnecessarily widening the provider-facing research contract?

Two authorized conceptual patterns are compared:

- **Option A** — extend `ResearchProviderInput` (`packages/core-research/src/provider.ts:11-16`) with Search-scoped participant context.
- **Option B** — preserve `ResearchProviderInput`/`ResearchProvider.research()`'s existing shape where possible, and carry Search-scoped context through Research orchestration/dependencies instead.

## 4. Current Research Contract

Verified directly against the repository at the HEAD recorded in §15 (all line numbers re-read in this task, not copied without verification):

```ts
// packages/core-research/src/provider.ts:11-16
export interface ResearchProviderInput {
  prospectId: string;
  companyId: string;
  companyName: string;
  normalizedDomain: string;
}

// packages/core-research/src/provider.ts:24-26
export interface ResearchProvider {
  research(input: ResearchProviderInput): Promise<LeadResearch>;
}
```

Exactly four fields exist today. No participant-context field (`targetCustomer`, `searchId`, or parsed segments) exists anywhere in this interface.

**Only production construction site:** `packages/core-research/src/service.ts:76-81`, inside `runResearchForOwner` (`service.ts:62-88`):

```ts
const research = await deps.provider.research({
  prospectId: prospect.id,
  companyId: company.id,
  companyName: company.name,
  normalizedDomain: company.normalizedDomain,
});
```

**`ResearchDeps`** (`service.ts:21-27`):

```ts
export interface ResearchDeps {
  identity: IdentityRepository;
  companies: CompanyRepository;
  prospects: ProspectRepository;
  signals: ResearchSignalRepository;
  provider: ResearchProvider;
}
```

No `searches: SearchRepository` dependency exists here today.

**One layer deeper — `ResearchInput`** (`packages/core-research/src/schema.ts:207-224`), which `createAnthropicResearchProvider` translates `ResearchProviderInput` into (`anthropicResearchProvider.ts:67-71`):

```ts
export const researchInputSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  websiteUrl: z.string().trim().url(),
  industry: z.string().trim().min(1).max(120).optional(),
  location: z.string().trim().min(1).max(120).optional(),
  socialProfileUrl: z.string().trim().url().optional(),
  sourceDocuments: z.array(...).max(10).default([]),
});
```

`industry`/`location` are already-declared, already-rendered (`prompt.ts:36-37`), but currently unpopulated by any caller — `anthropicResearchProvider.ts:67-71` constructs `ResearchInput` from only `companyName`, `websiteUrl`, `sourceDocuments`. `prompt.ts:55-56` already frames such supplied-but-unverified context explicitly: *"The industry and location above were supplied by the operator, not verified by you. Treat them as INFERRED at best; do not cite them as OBSERVED."* This is a directly reusable framing precedent for how `targetCustomer` should be presented, but it exists at the `ResearchInput` layer, one step below `ResearchProviderInput` — D8, read literally, concerns the outer (`ResearchProviderInput`) boundary; any implementation will still need to decide whether `ResearchInput` also grows a matching field (§7).

**`RunResearchInput`** (`packages/core-research/src/types.ts:60-62`):

```ts
export interface RunResearchInput {
  prospectId: string;
}
```

**Worker call site** (`apps/worker/src/searchWorker/worker.ts:358-368`), inside `runCanonicalPipeline(deps, search: StoredSearch)` (`worker.ts:327-330`):

```ts
for (const prospect of discovery.prospects) {
  await runResearchForOwner(
    {
      companies: deps.companies,
      prospects: deps.prospects,
      signals: deps.signals,
      provider: deps.researchProvider(userId),
    },
    userId,
    { prospectId: prospect.id },
  );
```

`search.id` and `search.parameters.targetCustomer` are held in scope by the enclosing `runCanonicalPipeline` function (its own `search` parameter) but are **not** passed into this call — only `prospectId` is.

## 5. Option A — Extend `ResearchProviderInput`

**Conceptual form** (CONCEPTUAL ONLY — NOT IMPLEMENTED):

```ts
ResearchProviderInput {
  prospectId
  companyId
  companyName
  normalizedDomain

  // conceptual addition
  targetCustomer        // raw string and/or parsed segments per D2 — not settled by D8 alone
  // optionally searchId, if required to satisfy D6 at this layer
}
```

### What it would conceptually require

- New field(s) on `provider.ts:11-16` — at minimum something carrying `targetCustomer` in a shape compatible with D2's locked deterministic-parsing requirement (parsed segments, not only the raw string, or both). Optionally `searchId`, to satisfy D1/D6's Search-attribution requirement at this layer.
- The value is not resolvable from what `runResearchForOwner` already loads (`prospect`, `company`) without either (a) adding a `searches: SearchRepository` dependency to `ResearchDeps` plus an internal `deps.searches.getById(userId, prospect.searchId)` call, or (b) widening the worker call site and `RunResearchInput` to pass `search.id`/`search.parameters.targetCustomer` down. Approach A does not by itself resolve which.
- Whether parsing (D2) happens before or after this interface is constructed is a separate, nested question — not settled by choosing A.

### Advantages (conceptual)

- Explicit context at the `ResearchProvider` boundary — a reader of `ResearchProviderInput` alone would see everything Research is told, without also needing to read `ResearchDeps`/`service.ts`.
- Directly expresses that Research depends on participant intent.
- Some cross-package coupling into this exact interface already exists (`prospectId`, `companyId`, `companyName`, `normalizedDomain` are already Discovery/Company/Prospect-domain concepts crossing into `core-research`), so A would not be the first such crossing at this layer.

### Costs / risks (conceptual, clearly not assumed as fact)

- Widens a provider-facing contract. `packages/core-research/src/anthropicResearchProvider.ts:9-10`'s own comment documents `ResearchProvider.research(input)` as *"The frozen ResearchProvider runtime method... untouched: byte-for-byte the same... signature"* — a stated intent this document treats as evidence of a design value, not a hard constraint external to this decision.
- Every existing `ResearchProviderInput` construction/test literal (`service.ts:76-81`, and test fakes in `service.test.ts`/`research.test.ts`) would need updating if the new field is required; an optional field avoids the mechanical break but defers an "is this always present" question to runtime.
- Would be the first time a `core-search`/`core-service-profile` concept (participant-stated intent) crosses into `ResearchProviderInput` specifically, rather than into `ResearchInput`'s existing "supplied, unverified" layer where some precedent (`industry`/`location`) already exists.
- Whether `searchId` belongs in this contract at all, or only `targetCustomer`'s content, is unresolved — Research arguably only needs the content to compare against evidence, while Search identity is more directly a concern of D1's (still unbuilt) persistence entity.
- Provider neutrality must be preserved by construction (see §7) — this is achievable under A but is not automatic; it requires the new field to also be threaded into `ResearchInput`/`prompt.ts` for the model to ever see its content.

## 6. Option B — Search-Scoped Context Mechanism

**No pre-existing, purpose-built "Search-scoped research context" mechanism exists in the repository today.** Three repository-supported candidates were identified in the D8 preparation documents; none is implemented; none requires inventing a genuinely new kind of abstraction:

**Candidate 1 — a second parameter on `ResearchProvider.research()`.**
```text
CONCEPTUAL ONLY — NOT IMPLEMENTED
research(input: ResearchProviderInput, context: SearchResearchContext): Promise<LeadResearch>
```
Leaves the four existing `ResearchProviderInput` fields untouched but still changes `ResearchProvider.research()`'s own signature/arity — in tension with the "frozen... byte-for-byte" framing noted above.

**Candidate 2 — a new `searches: SearchRepository` dependency on `ResearchDeps`, resolved internally.**
```text
CONCEPTUAL ONLY — NOT IMPLEMENTED
ResearchDeps {
  ...
  searches: SearchRepository
}

// inside runResearchForOwner, after the existing prospect lookup:
const search = await deps.searches.getById(userId, prospect.searchId);
// search.parameters.targetCustomer is then in scope
```
This directly mirrors an existing, working pattern in a sibling package — `OpportunityDeps` (`packages/core-opportunity/src/service.ts:42-49`) already carries `searches: SearchRepository`, and `createOpportunityForOwner` already does exactly this resolution:
```ts
// packages/core-opportunity/src/service.ts:120-131 (verified in this task)
const prospect = await deps.prospects.getById(userId, prospectId);
if (!prospect) throw new OpportunityProspectNotFoundError(prospectId);
const search = await deps.searches.getById(userId, prospect.searchId);
if (!search) throw new OpportunityProspectNotFoundError(prospectId);
const company = await deps.companies.getById(userId, prospect.companyId);
...
const signals = await deps.signals.listByProspect(userId, prospect.id);
const offerSignals = toOfferSignals(signals, company);
const rule = toServiceRule(search.parameters);
```
`ResearchProviderInput` and `ResearchProvider.research()`'s signature both remain byte-for-byte unchanged under this candidate.

**Candidate 3 — a widened `RunResearchInput`, populated by the worker call site.**
```text
CONCEPTUAL ONLY — NOT IMPLEMENTED
RunResearchInput {
  prospectId
  searchId?
  targetCustomer?
}
```
Populated directly by `runCanonicalPipeline` (`worker.ts:358-368`), which already holds `search.id`/`search.parameters.targetCustomer` in scope one line above the existing call — no new `ResearchDeps` dependency needed, at the cost of editing the worker call site (an edit every D8 candidate, including A, effectively requires in some form, per §4).

### Advantages (conceptual)

* Preserves provider neutrality identically to Option A (§7) — no dimension here favors either option.
* Candidates 2/3 leave `ResearchProviderInput`'s four fields, and `ResearchProvider.research()`'s one-argument signature, completely untouched — consistent with the interface's own documented "frozen" framing.
* Direct, working precedent exists in this repository for Candidate 2 specifically (`OpportunityDeps`/`createOpportunityForOwner`); no comparable precedent exists in this repository for widening a provider-facing input contract the way Option A proposes.
* Existing `ResearchProviderInput` test literals (`service.test.ts`, `research.test.ts`, `anthropicResearchProvider.test.ts`) are unaffected under Candidates 2/3.

### Costs / risks (conceptual)

* Candidate 2 still requires a further decision: how the resolved `targetCustomer`/segments ultimately cross into `ResearchInput`/`prompt.ts` so a provider ever sees them — Candidate 2 alone answers "where is Search context resolved," not "how does it cross the `ResearchProviderInput`/`ResearchProvider` boundary." Some narrow, still-undecided step near that boundary (even if only inside `runResearchForOwner`'s own construction of the `ResearchProviderInput` literal) remains necessary either way.
* Candidate 1 still changes `ResearchProvider.research()`'s own signature, so "B preserves the contract" is only fully true for Candidates 2/3, not uniformly across all of B's sub-candidates.
* A reader of `ResearchProviderInput` alone would no longer see the full picture of what Research is told (visibility trade-off against Option A).
* Candidate 3 requires editing the worker call site; Candidate 2 requires a new repository dependency on `ResearchDeps` — neither is free, and the two trade off against each other (§9, §10).

Whichever candidate is chosen must, like Option A, live in the shared `schema.ts`/`provider.ts`/`service.ts` layer, not inside `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` individually (§7).

## 7. Provider Neutrality

Traced directly in this task against all three adapter files and the factory:

```text
ResearchProviderInput (provider.ts:11-16)
        ↓
ResearchProvider.research(input)  (provider.ts:24-26)
        ↓  — today, exactly one concrete implementation:
createAnthropicResearchProvider   (anthropicResearchProvider.ts:51-82)
  builds ResearchInput = { companyName, websiteUrl, sourceDocuments }  (lines 67-71)
  calls researchLead(deps.model, researchInput, {...})                (lines 73-77)
        ↓
researchLead()  (researcher.ts:151-293)
  buildUserMessage(input) -> string   (line 176 -> prompt.ts:32-61)
  model({ system, messages, signal })  (lines 198-202)
        ↓
ResearchModel  (researcher.ts:44-56)
  (request: { system: string; messages: {role,content}[]; signal?: AbortSignal })
    => Promise<ModelResult>
        ↓
researchModelFactory.ts:94-130 selects the concrete adapter at construction time
        ↓
anthropicModel.ts / openAIModel.ts / geminiModel.ts
```

`researchModelFactory.ts:9-16`'s own header comment states it is *"the ONE place in the codebase allowed to branch on provider identity... Everything above this file — researchLead(), schema.ts, provenance.ts, ResearchProvider, and every downstream package — stays completely unaware of which provider produced a ResearchModel."* Confirmed by direct inspection in this task: none of `anthropicModel.ts`, `openAIModel.ts`, or `geminiModel.ts` import or reference `ResearchProviderInput` or `ResearchInput` — each adapter's factory returns a function matching only the `ResearchModel` shape (`{system, messages, signal}) => Promise<ModelResult>`).

`ResearchInput` is rendered into text in exactly one place — `prompt.ts`'s `buildUserMessage()` (`prompt.ts:32-61`), called once from `researchLead()` (`researcher.ts:176`), upstream of `researchModelFactory.ts`'s provider selection.

**Does either D8 option require changing `ResearchModel`, or the Anthropic/OpenAI/Gemini adapters?**

```text
ResearchModel:        NO, under either option.
Anthropic adapter:    NO signature/interface change; anthropicResearchProvider.ts
                       (a different file from anthropicModel.ts) would need to
                       thread the new value into its ResearchInput construction
                       (lines 67-71) under either option, but this is the
                       ResearchProvider implementation, not the ResearchModel
                       adapter, and is required by BOTH options identically.
OpenAI provider:      NO change required by either option.
Gemini provider:      NO change required by either option.
```

Provider neutrality is preserved *mechanically*, not by convention, under both Option A and Option B, as long as the new content is threaded into `ResearchInput` (schema.ts) and rendered by `buildUserMessage()` — that is the only path by which any content reaches any provider at all. This dimension does not favor either option.

## 8. Search Scoping and D6

D6 (locked, not reopened) requires per-Search-+-Prospect storage, preserved historical attribution, no cross-search overwrite, and Qualification reading the current Search + Prospect determination.

**Must `searchId`, `prospectId`, and `targetCustomer` be available together at the orchestration layer?**

- `prospectId` already travels through Research today (`provider.ts:12`; always has).
- `searchId` is directly available at the worker (`worker.ts:329`, the enclosing `search.id`) and indirectly recoverable inside `core-research` via `prospect.searchId` — `StoredProspect.searchId` (`packages/core-discovery/src/types.ts:26`, verified in this task: `searchId: string` is a required field on `StoredProspect`) is a durable, persisted column already loaded by `runResearchForOwner`'s existing `deps.prospects.getById` call (`service.ts:70`), simply not read past that point today.
- `targetCustomer`'s raw content is **not** reachable from inside `core-research` without a new lookup, because `ResearchDeps` has no `searches` dependency today (§4) — unlike `searchId`, its content requires an actual `SearchRepository.getById` call to resolve `StoredSearch.parameters`.

This is a repository fact, not a D6 restatement: `searchId` is cheaply available either way (it doesn't need to be threaded as new data under Option B/Candidate 2, since it is already reachable via the Prospect row); `targetCustomer`'s content is what genuinely needs a new path under any option.

**Repository fact incorporated (verified in this task, not assumed):** `Prospect` is `UNIQUE(search_id, company_id)` (`packages/db/prisma/migrations/0015_discovery/migration.sql:112-116`, cited in both D8 preparation documents; not re-read line-by-line in this task since HEAD is unchanged and the citation was already verified against the same HEAD in `PATH_2_CATEGORY_PLAUSIBILITY_D8_DECISION_PREPARATION.md` §9). Consequence: the same real-world business rediscovered under a second Search produces a **second, distinct** `Prospect` row, not the same row reattached to a different Search. This means `ResearchSignalRepository.supersedePrevious(prospectId, at)` — keyed by `prospectId` only, with no `search_id` column on `research_signals` (`packages/db/prisma/migrations/0016_research_signals/migration.sql`, per the D8 implementation scope map §11, not independently re-read in this task) — cannot silently overwrite a *different* Search's result for what the system treats as "the same Prospect," because two different Searches never share a Prospect row. This narrows, but does not eliminate, the reason D1's dedicated Search+Prospect entity is still needed: `ResearchSignal`'s existing rows are not natively queryable "for a specific Search" even though they cannot cross Search boundaries by accident.

**Distinguishing repository facts from D6 requirements from D8 implications:**

- *Repository fact:* Prospect uniqueness already prevents the specific cross-Search overwrite scenario described in prior Path 2 documents, for `ResearchSignal`'s existing per-Prospect-keyed fields.
- *D6 requirement (unchanged by the above fact):* the category-plausibility determination must still be persisted per Search + Prospect, with historical attribution preserved — D1's dedicated entity remains necessary because `research_signals` structurally cannot express a `(search_id, prospect_id)` key, not because of any overwrite risk this fact newly discovered.
- *D8 implication:* neither option (A nor B) changes what D1's persistence entity needs to look like. D8 only concerns how `targetCustomer`/`searchId` reach Research's *input* side, before persistence is ever written. This is a separable concern from D1's (still unbuilt) persistence design under both options (§5, §6).

A related, out-of-D8-scope gap is worth naming for completeness, not resolution: `evaluateQualificationForOwner` (`packages/core-qualification/src/service.ts:59-78`) resolves signals via `opportunity.prospectId` only, and `StoredOpportunity` (`core-opportunity/src/types.ts:40-59`) carries no `searchId` field — so satisfying D6's "Qualification reads the current Search + Prospect determination" clause will need its own, separate resolution at Qualification's read boundary, regardless of how D8 is decided. This is noted, not addressed, here.

## 9. Worker → Research Trace

1. **Where the worker currently obtains the Prospect:** `runDiscoveryForOwner` (`worker.ts:333-342`) returns `discovery.prospects`; the loop `for (const prospect of discovery.prospects)` begins at `worker.ts:358`.
2. **Where `search.id` is available:** immediately, as `runCanonicalPipeline`'s own `search: StoredSearch` parameter (`worker.ts:327-330`), in scope for the entire function body including the loop.
3. **Where `search.parameters.targetCustomer` is available:** the same `search` object, same scope, since `StoredSearch.parameters` is the immutable `ServiceProfileFields` snapshot taken at Search creation (per the D8 preparation document's citation of `core-search/src/types.ts:30-46`, not independently re-read in this task).
4. **Where Research is invoked:** `worker.ts:359-368`, `await runResearchForOwner({ companies, prospects, signals, provider }, userId, { prospectId: prospect.id })` — verified in this task exactly as shown.
5. **Where context would conceptually be introduced under Option A:** at this same call site, the third argument would widen (e.g., `{ prospectId: prospect.id, targetCustomer: search.parameters.targetCustomer, searchId: search.id }`), and/or `runResearchForOwner`'s own construction of the `ResearchProviderInput` literal (`service.ts:76-81`) would populate the new field(s) — CONCEPTUAL ONLY, not implemented.
6. **Where context would conceptually be resolved under Option B:**
   - Candidate 1: unchanged worker call site; a new second parameter constructed inside `runResearchForOwner` and passed to `deps.provider.research(input, context)`.
   - Candidate 2: unchanged worker call site (still only `{ prospectId: prospect.id }`); resolved internally inside `runResearchForOwner` via a new `deps.searches.getById(userId, prospect.searchId)` call, mirroring `createOpportunityForOwner` (`core-opportunity/src/service.ts:123`).
   - Candidate 3: worker call site widens exactly as in Option A's step 5, but the value flows only into `RunResearchInput` (`types.ts:60-62`), not directly into `ResearchProviderInput` — a further, separate step would still be needed to cross into `ResearchProviderInput`/`ResearchInput` (§6).

## 10. Signature Comparison

Every proposed signature below is:

```text
CONCEPTUAL ONLY — NOT IMPLEMENTED
```

| Layer | Current signature | Option A conceptual change | Option B conceptual change |
|---|---|---|---|
| Worker (`worker.ts:359-368`) | `runResearchForOwner({companies,prospects,signals,provider}, userId, { prospectId: prospect.id })` | Widen third argument: `{ prospectId, targetCustomer, searchId? }` (CONCEPTUAL ONLY — NOT IMPLEMENTED) | Candidate 2: unchanged. Candidate 3: same widening as Option A. Candidate 1: unchanged. (CONCEPTUAL ONLY — NOT IMPLEMENTED) |
| Research orchestration (`service.ts:62-88`, `21-27`) | `runResearchForOwner(deps: Omit<ResearchDeps,'identity'>, userId, input: RunResearchInput, now)`; `ResearchDeps = {identity, companies, prospects, signals, provider}` | Internally reads the widened `input`/populates the widened `ResearchProviderInput` literal (CONCEPTUAL ONLY — NOT IMPLEMENTED) | Candidate 2: `ResearchDeps` gains `searches: SearchRepository`; internally resolves `search = await deps.searches.getById(userId, prospect.searchId)`. Candidate 3: reads widened `RunResearchInput`. Candidate 1: passes a second argument to `deps.provider.research()`. (CONCEPTUAL ONLY — NOT IMPLEMENTED) |
| `ResearchProviderInput` (`provider.ts:11-16`) | `{ prospectId, companyId, companyName, normalizedDomain }` | Widened: `{ ...existing, targetCustomer/targetSegments, searchId? }` (CONCEPTUAL ONLY — NOT IMPLEMENTED) | Preserved unchanged under Candidates 2/3. Candidate 1 preserves this type but changes `ResearchProvider.research()`'s own signature instead. (CONCEPTUAL ONLY — NOT IMPLEMENTED) |
| `ResearchModel` (`researcher.ts:44-56`) | `(request: {system, messages, signal}) => Promise<ModelResult>` | Unchanged | Unchanged |
| Anthropic adapter (`anthropicModel.ts`) | No `ResearchProviderInput`/`ResearchInput` reference (verified) | Unchanged | Unchanged |
| OpenAI adapter (`openAIModel.ts`) | No `ResearchProviderInput`/`ResearchInput` reference (verified) | Unchanged | Unchanged |
| Gemini adapter (`geminiModel.ts`) | No `ResearchProviderInput`/`ResearchInput` reference (verified) | Unchanged | Unchanged |

Note: `anthropicResearchProvider.ts` (the `ResearchProvider` *implementation*, distinct from `anthropicModel.ts`, the `ResearchModel` *adapter*) would need its `ResearchInput` construction (lines 67-71) to thread the new value through, under **either** option — this is a shared, option-independent requirement, not a distinguishing one.

## 11. Option Comparison

No numerical scores; no option is called "best." Factual architectural observations only.

| Dimension | Option A | Option B |
|---|---|---|
| Provider neutrality | Preserved mechanically (§7) | Preserved mechanically (§7), identically |
| Search scoping | `searchId` available directly if added as a field | Available via all three candidates; Candidate 2 mirrors an existing sibling-package pattern; Candidate 3 uses data the worker already holds |
| D6 compatibility | Directly carries `searchId` at the input-contract layer if added; D1's persistence entity remains separate, unbuilt work regardless | Candidates 2/3 make Search identity available without touching the provider-facing contract; still requires some path into `ResearchInput`/persistence, same as A |
| Contract stability | Widens `ResearchProviderInput`, in tension with its documented "frozen... byte-for-byte" framing (`anthropicResearchProvider.ts:9-10`) | Candidates 2/3 leave `ResearchProviderInput` and `ResearchProvider.research()`'s signature untouched; Candidate 1 changes the method's own arity |
| Implementation surface | `provider.ts`, construction site(s), possibly worker/`RunResearchInput` | Candidate 2: `service.ts` (`ResearchDeps`, `runResearchForOwner`) only. Candidate 3: worker + `types.ts`. Candidate 1: `provider.ts` method signature + construction sites |
| Dependency injection | No new dependency added to `ResearchDeps` | Candidate 2 adds `searches: SearchRepository` to `ResearchDeps`, mirroring `OpportunityDeps` (`core-opportunity/src/service.ts:42-49`) exactly |
| Testing surface | Every existing `ResearchProviderInput` literal in tests (`service.test.ts`, `research.test.ts`, `anthropicResearchProvider.test.ts`) needs updating if the field is required | Candidates 2/3: existing `ResearchProviderInput` literals untouched; new tests needed for the new dependency/parameter instead. Candidate 1: comparable literal-update cost, concentrated on `ResearchProvider.research()` call sites |
| Future multi-provider support | No differential impact — neither option touches provider adapters | Same — no differential impact |
| Coupling to product/Search concepts | `targetCustomer`/`searchId` (a `core-search`/`core-service-profile` concept) enters `core-research`'s primary, provider-facing contract directly | Candidate 2 confines the new coupling to `ResearchDeps` (already a dependency-injection surface); Candidate 3 confines it to `RunResearchInput`, one step removed from the provider boundary; Candidate 1 still couples `ResearchProvider.research()`'s own signature |
| Reuse of existing repository patterns | Some precedent exists for cross-package fields already present on `ResearchProviderInput` itself (`prospectId`, `companyId`, etc.) | Direct, working precedent exists for Candidate 2 specifically (`OpportunityDeps`/`createOpportunityForOwner`); no comparable precedent exists for Option A |
| Risk of exposing Search context to providers | None directly — no candidate under either option reaches an adapter file; risk is identical under both, gated by the shared `ResearchInput`/`prompt.ts` step | Same as Option A |
| Ease of maintaining the current `ResearchModel` boundary | Unaffected — `ResearchModel` is untouched under both options | Unaffected — identical |

## 12. Recommendation — Not a Product Decision

```text
RECOMMENDATION — NOT A PRODUCT DECISION
```

Based strictly on the repository evidence traced in §4–§11: **Option B, specifically Candidate 2** (a new `searches: SearchRepository` dependency on `ResearchDeps`, resolving `search = await deps.searches.getById(userId, prospect.searchId)` inside `runResearchForOwner` immediately after the existing `prospect` lookup) better preserves the current provider-neutral `ResearchModel` boundary while allowing Search-scoped participant context to reach Research, for three evidence-backed reasons:

1. **Direct, working precedent exists for this candidate and not for Option A.** `createOpportunityForOwner` (`core-opportunity/src/service.ts:112-131`) already resolves `search.parameters` from `prospect.searchId` via an injected `SearchRepository`, without widening any provider-facing contract. No comparably direct precedent exists in this repository for widening a provider-facing input contract the way Option A proposes.
2. **`ResearchProvider.research(input)`'s signature is explicitly documented as intentionally stable** (`anthropicResearchProvider.ts:9-10`). Option A and Candidate 1 both change something at or adjacent to that exact boundary; Candidate 2 changes `ResearchDeps` — a dependency-injection surface already designed to vary across `runResearch`/`runResearchForOwner` — instead.
3. **Provider neutrality is preserved identically by both options** (§7) — this dimension does not offset points 1–2.

**Stated plainly, not resolved:** Candidate 2 alone does not complete the picture — it still requires a further, separate decision about how the resolved `targetCustomer`/parsed segments cross into `ResearchInput`/`prompt.ts` so a provider ever sees them (§6, §9). Option A is simpler to reason about from the outside, at the cost of a larger, more visible footprint on a contract its own neighboring documentation calls frozen.

## 13. Product Owner Decision — RECORDED

```text
D8
STATUS: DECIDED
CHOICE: OPTION B
IMPLEMENTATION: NOT AUTHORIZED
```

```text
OPTION B — PRESERVE PROVIDER-FACING CONTRACT WHERE POSSIBLE

Carry Search-scoped participant context through Research orchestration/dependencies
rather than unnecessarily widening the provider-facing ResearchProviderInput contract.
```

This selects the option compared in §6 and recommended in §12, over Option A (§5). It adopts the direction, not a specific candidate: §6 identified three repository-supported sub-candidates for Option B (a second parameter on `ResearchProvider.research()`; a new `searches: SearchRepository` dependency on `ResearchDeps`; a widened `RunResearchInput` populated by the worker) and §12 recommended Candidate 2 specifically as a non-binding recommendation. This decision record fixes the top-level direction (Option B) for future scope-lock purposes; it does **not** itself fix which candidate, nor any field name, schema, or code shape — those remain implementation-scope work, to be resolved (and separately authorized) at the point an implementation task is actually scoped.

**DECISION STATUS: RECORDED / NON-BINDING.** The Product Owner has selected this architectural direction for future scope-lock purposes. This task does not authorize implementation, does not convert this into an implementation scope-lock, and does not create any code task.

## 14. Architectural Intent

The recorded direction confirms the following intended call shape, consistent with the trace already established in §7 and §9 — Search/product context resolved upstream of the provider-neutral model boundary wherever practical:

```text
Worker
  ↓
Research orchestration / dependencies
  ↓
Search-scoped context resolution
  ↓
Research input / prompt construction
  ↓
provider-neutral ResearchModel
  ↓
Anthropic / OpenAI / Gemini
```

This preserves provider neutrality: per §7's verified trace, none of `anthropicModel.ts`, `openAIModel.ts`, or `geminiModel.ts` reference `ResearchProviderInput` or `ResearchInput` today, and `ResearchModel` (`researcher.ts:44-56`) is untouched under this direction. Resolving Search-scoped context above that boundary — inside Research orchestration/dependencies rather than inside a provider adapter — keeps `researchModelFactory.ts`'s existing constraint intact (*"the ONE place in the codebase allowed to branch on provider identity"*, `researchModelFactory.ts:9-16`).

**Preserve the current contract where possible.** This decision does **not** authorize blindly widening `ResearchProviderInput` (`packages/core-research/src/provider.ts:11-16`). A future implementation task must first evaluate whether Search context can be supplied through Research orchestration/dependencies (per §6's candidates) while keeping the provider-facing contract stable, before considering any change to `ResearchProviderInput` itself. Per §6/§12, Candidate 2 (a `searches` dependency on `ResearchDeps`, mirroring `OpportunityDeps`/`createOpportunityForOwner`, `core-opportunity/src/service.ts:42-49,112-131`) is the recommended starting point for that evaluation, precisely because it requires no change to `ResearchProviderInput` or to `ResearchProvider.research()`'s signature.

**D6 compatibility.** This direction must respect the already-locked D6 semantics (§2, §8) — unchanged by this decision:

```text
PER SEARCH + PROSPECT
HISTORICAL ATTRIBUTION PRESERVED
CROSS-SEARCH OVERWRITE DISALLOWED
```

A future implementation must have access to the appropriate Search context (`searchId`, `prospectId`, and the participant's `targetCustomer`, per §8) so that the category-plausibility determination remains attributable to the correct Search + Prospect. As §8 already establishes, `searchId` is cheaply recoverable via `prospect.searchId` regardless of which Option B candidate is eventually chosen; D1's dedicated Search+Prospect persistence entity remains separate, unbuilt work, unaffected by this decision.

**Provider neutrality.** No provider-specific implementation is authorized by this decision. `ResearchModel`, and the Anthropic/OpenAI/Gemini adapters, are intended to remain provider-neutral exactly as traced in §7 and §10 — this decision does not authorize any change to `anthropicModel.ts`, `openAIModel.ts`, or `geminiModel.ts`.

**All other locked boundaries are unaffected by this decision:**

```text
R-71:                Unchanged. Category plausibility remains a separate concern
                      from Need Detection (TOPICAL_FIELDS/suggestOffers()/
                      toOfferSignals() untouched — §2).
Scoring / Ranking:    Unchanged. No category-plausibility field is added to
                      scoring by this decision (§2).
Discovery:            Unchanged. Discovery remains broad and is not assigned
                      category-plausibility ownership (§2).
Opportunity Creation: Unchanged. D5 remains exactly as locked:
                        MATCH    -> passes Qualification
                        MISMATCH -> fails Qualification but does not block
                                    Opportunity creation
                        UNKNOWN  -> fails/holds Qualification without creating
                                    a new Opportunity state
                      The Opportunity state machine is not modified.
```

**Other decisions remain as previously governed, not resolved by this task:** D7, D9, D10, and D11 remain exactly as recorded in `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3 (`PRODUCT OWNER DECISION REQUIRED` for each). This task decides D8 only, and does not mark overall Path 2 implementation as authorized.

## 15. Decision History

```text
2026-09-25 — D8 decided: OPTION B.

Product Owner selected Option B.

Rationale:
Preserve the provider-facing Research contract where possible and carry
Search-scoped participant context through Research orchestration/dependencies,
maintaining the provider-neutral ResearchModel boundary.

This is a non-binding architectural direction only.
No implementation authorization was granted.
```

This rationale restates, and does not extend beyond, the evidence-backed reasons already given in §12's recommendation: (1) direct, working precedent exists in this repository for Option B's Candidate 2 (`OpportunityDeps`/`createOpportunityForOwner`) and not for Option A; (2) `ResearchProvider.research(input)`'s signature is documented as intentionally stable (`anthropicResearchProvider.ts:9-10`), which Option A and Candidate 1 both disturb while Candidate 2 does not; (3) provider neutrality is preserved identically by both options, so it does not offset (1)–(2). No additional rationale is introduced here.

## 16. Explicit Non-Goals

This task did **not**:

- modify `ResearchProviderInput`, `ResearchModel`, or any Anthropic/OpenAI/Gemini adapter
- modify worker code or Research orchestration
- modify Search schema, Research schema, or persistence
- modify Qualification, Discovery, R-71, scoring/ranking, or Opportunity creation/state machine
- modify the UI or the PRD
- add migrations or tests
- make any live API call
- authorize implementation of Option B
- reopen or resolve D0–D7, D9, D10, or D11
- modify `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` (left untouched — see §17)
- stage, commit, or push anything

## 17. Repository Safety / Audit Record

```text
Branch:                       phase-17-r34-worker-orchestration

Recorded starting HEAD
(git rev-parse HEAD, run at task start):     5992b82b9adff492c480442d68a954f2a03bfb28

HEAD after task completion:                  5992b82b9adff492c480442d68a954f2a03bfb28
                                              (unchanged — verified below)

Note carried forward from the prior D8 task: an earlier task instruction's
"Expected HEAD" string (`...bfbf7`) did not byte-for-byte match this
recorded HEAD (`...bfb28`). That discrepancy was already flagged in this
same file's history and is not re-litigated here; this task's own baseline
check (§1 of the task instructions) reconfirmed the same HEAD
(`5992b82b9adff492c480442d68a954f2a03bfb28`), unchanged, at both start and
end of this task.

Production code changed:      0
Tests changed:                 0
PRD changed:                    0
Configuration changed:           0
Database/migrations changed:      0
Provider code changed:             0
Worker code changed:                0
Live API calls:                      0
Staged:                                none
Commit:                                 none
Push:                                    none

File modified by this task (the only file changed):
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md
  (D8 status changed from UNDECIDED to DECIDED — OPTION B, RECORDED / NON-BINDING;
  §13 rewritten as the recorded decision; §14 Architectural Intent and §15 Decision
  History added; §16/§17 renumbered from the prior §14/§15; no other section's
  substantive content — §2-§12 — was altered)

`requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md`:
  Read in this task (per the required-reading list) to check whether the
  existing governance structure requires D8 decisions to be mirrored there.
  Finding: no such requirement exists. That document's own D8 entry (§3) was
  left reading `PRODUCT OWNER DECISION REQUIRED` when the D8 decision-
  preparation and D8 implementation-scope-map documents were created earlier
  in this governance chain — neither of those documents mirrored their
  content back into it, establishing the existing precedent of NOT mirroring
  sub-decision documents into the Final Decision Record. Per task instruction
  §13 ("otherwise leave it untouched"), this document was NOT modified.

Files read for this task, not modified:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md (pre-edit state)
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_DECISION_PREPARATION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_IMPLEMENTATION_SCOPE_MAP.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md

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

D8 is recorded as **DECIDED — OPTION B**, explicitly **NON-BINDING**, with **IMPLEMENTATION AUTHORIZATION: NOT GRANTED**. Option B is **not** implemented — no `ResearchProviderInput`, `ResearchDeps`, worker, `ResearchModel`, provider-adapter, schema, migration, or test file is created or modified by this task. `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` was read but left untouched, per §17's finding. This task ends with the D8 decision recorded as above and repository safety verified.
