# PATH 2 — CATEGORY PLAUSIBILITY
# CONSOLIDATED IMPLEMENTATION SCOPE-LOCK

```text
DOCUMENT TYPE: READ-ONLY CONSOLIDATED IMPLEMENTATION SCOPE-LOCK
STATUS: DOCUMENTATION / SCOPE PREPARATION ONLY — NO IMPLEMENTATION PERFORMED
```

## 0. Purpose and Method

This document consolidates every authoritative Path 2 (Research-level category-plausibility) governance document into one implementation-ready scope-lock, re-verifying the load-bearing architectural claims directly against the repository at the HEAD recorded in §1 rather than trusting prior documents' citations uncritically. It creates no code, schema, test, configuration, or governance change beyond itself. It does not reopen D0–D11. Where a genuine gap or unresolved implementation question exists, it is recorded as such, not invented.

This document does not repeat every sentence of the eleven source decision records — it reproduces their binding text (§3) and adds a single, cross-referenced implementation surface map (§5), persistence/read-path resolution (§6–§7), and ordered implementation sequence (§16) that no single prior document assembled in one place.

---

## 1. Baseline Safety

```bash
git rev-parse HEAD
git status --short
git diff --check
git diff --name-only
git diff --cached --name-only
```

**Result:**

```text
HEAD:                        5992b82b9adff492c480442d68a954f2a03bfb28
Expected baseline:           5992b82b9adff492c480442d68a954f2a03bfb28
Match:                       CONFIRMED — no discrepancy.

git diff --check:            clean (no whitespace errors)
git diff --name-only:        apps/web/tsconfig.tsbuildinfo
                              apps/worker/src/searchWorker/worker.test.ts
                              apps/worker/src/searchWorker/worker.ts
                              packages/core-discovery/src/service.test.ts
                              packages/core-discovery/src/service.ts
git diff --cached --name-only: (empty)
```

All five pre-existing modifications and the full pre-existing `requirement/*.md`, `.claude/`, and `CLAUDE.md` untracked set are treated as immutable throughout this task. §20 re-verifies none changed.

---

## 2. Authoritative Decision Documents Read

Read in full for this task (per the task's required list, using each file's actual on-disk name — two names in the task instruction do not exist verbatim, noted below):

```text
requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D7_PRODUCT_DECISION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D9_PRODUCT_DECISION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D10_PRODUCT_DECISION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md
requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md
  (the task named "PATH_2_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md" —
  does not exist on disk; this is the actual file, confirmed absent by a
  prior task in this same governance chain and reconfirmed here)
requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md
requirement/OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md
  (the task named "PATH_2_CATEGORY_PLAUSIBILITY_PATH_DECISION.md" — does
  not exist on disk; this is the actual file, per the same prior
  confirmation)
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_DECISION_PREPARATION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_IMPLEMENTATION_SCOPE_MAP.md
```

`requirement/PATH_2_CATEGORY_PLAUSIBILITY_D10_DECISION_PREPARATION.md` and `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D11_DECISION_PREPARATION.md` exist and are cited by, and consumed into, D10/D11's own final records (read above); their findings are reused via those final records rather than re-quoted separately, consistent with those records' own stated practice of citing rather than duplicating preparation-document content.

`requirement/PATH_2_CATEGORY_PLAUSIBILITY_DECISION_PACKET.md` (predecessor to the Final Decision Record) was not separately re-read in this task; its content is fully superseded by the Final Decision Record, which explicitly supersedes it.

---

## 3. Locked Product Decisions (D0–D11) — Reproduced Verbatim in Substance

Every decision below is **DECIDED**. None is reopened, reinterpreted, or extended by this document. Where a decision's binding text uses specific wording, that wording is preserved.

### D0 — MVP Status

```text
CATEGORY PLAUSIBILITY IS AN MVP ENHANCEMENT.
```

Belongs within MVP product scope. Does **not** reopen or invalidate the already-satisfied 19-criterion engineering MVP exit (`DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md` §18). A separately scoped MVP enhancement/implementation workstream, not yet implemented.

### D1 — Output Location / Contract

```text
USE A NEW DEDICATED SEARCH + PROSPECT CATEGORY-PLAUSIBILITY DETERMINATION.
```

- Attributable to the specific Search + Prospect combination.
- NOT a Prospect-global determination.
- NOT a repurposing of `LeadResearch.targetCustomers`.
- NOT routed through the R-71 offer-signal path.
- Must preserve D6's historical-attribution requirement.
- Exact schema/table/repository design is **implementation-scope, not authorized here**.

### D2 — Multi-Segment Semantics

```text
USE ANY-MATCH SEMANTICS WITH DETERMINISTIC SEGMENT PARSING.
```

- Parse the participant's `targetCustomer` into explicit structured segments before evaluation.
- Evaluate each segment independently.
- **MATCH** — at least one target segment is supported by sufficient evidence.
- **MISMATCH** — evidence supports that none of the supplied segments fit.
- **UNKNOWN** — evidence insufficient to determine whether any segment matches.
- Preserve per-segment determinations/evidence for explainability.
- Do not treat the raw compound string as one semantic category.
- The exact splitting rule (delimiter precedence, etc.) is **implementation-scope, not authorized here** — per the Final Decision Record's own instruction (§3, D2), this exact aggregation/parsing mechanic requires implementation-level confirmation rather than invention by this document.

### D3 — Evidence Sufficiency

```text
FIRST-PARTY WEBSITE EVIDENCE PRIMARY; SEARCH-DERIVED BUSINESS METADATA
SUPPORTING; UNKNOWN ON INSUFFICIENT EVIDENCE.
```

Evidence hierarchy: (1) first-party business website/authoritative business-owned content; (2) reliable business metadata/discovery evidence as supporting evidence; (3) weak search/discovery snippets may assist but must not independently establish a definitive MATCH/MISMATCH.

- A definitive MATCH/MISMATCH requires evidence specific enough to support the determination — not generic name/keyword coincidence.
- Insufficient evidence → **UNKNOWN**, never a default MISMATCH.
- No new evidence-tier taxonomy beyond the above is introduced.

### D4 — Qualification Consumption

```text
Q1 — USE A NEW QUALIFICATION CRITERION.
```

- A distinct Qualification concern, separate from R-71 Need Detection.
- Must NOT be routed through `TOPICAL_FIELDS`/`suggestOffers()`/`toOfferSignals()`.
- Qualification may consume the Search + Prospect determination (per D1).
- Exact criterion name/rule/wiring/state transitions are **implementation-scope, not authorized here**.

### D5 — State Behavior

```text
MATCH    -> criterion passes; normal Qualification flow.
MISMATCH -> criterion fails; candidate does NOT qualify; Opportunity
            creation NOT blocked; Opportunity creation/state machine
            unchanged.
UNKNOWN  -> criterion fails/holds; candidate does NOT qualify on UNKNOWN;
            no new Opportunity state.
```

Discovery remains broad → Research establishes evidence → Qualification consumes the determination → Opportunity creation remains unchanged → Scoring/ranking remain unchanged.

### D6 — Persistence Scope & Historical Attribution

```text
STORAGE:                PER SEARCH + PROSPECT
HISTORICAL ATTRIBUTION:  PRESERVE
TARGETCUSTOMER CHANGE:   NEW SEARCH-SCOPED DETERMINATION
CROSS-SEARCH OVERWRITE:  NOT ALLOWED
QUALIFICATION:           READS THE CURRENT SEARCH + PROSPECT DETERMINATION
```

Prior determinations remain retained and historically attributable to their original Search + Prospect context. A later Search using a different `targetCustomer` produces a new, independent determination for the same Prospect — it does not supersede the earlier one.

### D7 — FIELD_KIND / ResearchSignal Classification

```text
CANDIDATE C — KEEP THE DETERMINATION OUTSIDE THE FIELD_KIND /
RESEARCHSIGNAL CLASSIFICATION MECHANISM ENTIRELY.
```

The determination is persisted via D1's dedicated entity, not as a `LeadResearch` field or `ResearchSignal` row. It never participates in `allObservations()`, is never looked up in `FIELD_KIND`, and never becomes an input to `mapping.ts`'s `toNewResearchSignals()`, `toOfferSignals()`, `suggestOffers()`, or `toScoringSignals()`/`scoreProspect()`. No `FIELD_KIND` entry is added; none is needed. This is a direct, mechanical consequence of D1 — not a new mechanism. It structurally guarantees D4's "not routed through R-71" requirement rather than relying on a field-name exclusion list.

### D8 — Research Input Contract

```text
OPTION B — PRESERVE PROVIDER-FACING CONTRACT WHERE POSSIBLE.
Carry Search-scoped participant context through Research
orchestration/dependencies rather than widening ResearchProviderInput.

STATUS: RECORDED / NON-BINDING.
```

Adopts the direction (Option B), not a specific candidate. Three repository-supported sub-candidates were identified (§8 of the D8 record); the recommended-but-non-binding starting point is Candidate 2 — a new `searches: SearchRepository` dependency on `ResearchDeps`, resolving `search = await deps.searches.getById(userId, prospect.searchId)` inside `runResearchForOwner`, mirroring `OpportunityDeps`/`createOpportunityForOwner`. This decision does **not** authorize blindly widening `ResearchProviderInput`, but a future implementation task must still evaluate the candidates before committing to one. **Non-binding** — a future implementation may choose a different Option B candidate, or (with fresh justification) Option A, without reopening D8's top-level direction.

### D9 — Provider Neutrality

```text
OPTION A — FULL PROVIDER NEUTRALITY.
```

The capability must remain fully provider-neutral across Anthropic, OpenAI, Gemini, and the existing fallback-provider path (`createFallbackResearchProvider`/`RESEARCH_FALLBACK_PROVIDER`). Contract, semantics, evidence requirements, validation rules, persistence attribution, and Qualification behavior must remain invariant regardless of which provider (primary, fallback, or a future provider implementing the existing `ResearchModel`/`ResearchProvider` architecture) actually performs Research. No provider-specific business rules. Provider-neutral semantics must live above provider-specific adapters (`schema.ts`/`provider.ts`/`prompt.ts`/`researcher.ts`-layer code).

### D10 — UI

```text
DECIDED — see sub-decisions D10-A through D10-H.
```

- **D10-A** — Opportunity detail page only (`apps/web/app/(client-finder)/opportunities/[id]/page.tsx`); no new Search+Prospect surface.
- **D10-B** — Show the aggregate MATCH/MISMATCH/UNKNOWN result, followed by each parsed segment's own result and evidence.
- **D10-C** — Reuse existing evidence fields (`sourceUrl`, `sourceLabel`, `sourceQuote`, `confidence`, `basis`); distinguish first-party/supporting evidence by plain-text label only — no new evidence-tier UI.
- **D10-D** — UNKNOWN shown as the literal word "UNKNOWN"; Qualification criterion row shows "not satisfied" + reason; Opportunity section remains unconditional.
- **D10-E** — MISMATCH shown as the literal word "MISMATCH"; same criterion-row treatment; Opportunity section unchanged — never implies deletion of the Opportunity.
- **D10-F** — MATCH shown as the literal word "MATCH" with matched-segment evidence; never displayed on the ranked Opportunities list; never a scoring/ranking input.
- **D10-G** — Show the Search's `targetCustomer` context and the determination's timestamp; no cross-Search comparison UI.
- **D10-H** — Rendered only once the determination record exists (same convention as the page's existing Qualification/Personalization/Outreach/Follow-Up sections).

### D11 — Validation

```text
DECIDED — see sub-decisions D11-A through D11-I.
```

- **D11-A** — Split into MANDATORY (must be observed live), STRUCTURAL (code review suffices), OBSERVATIONAL (recorded, non-gating).
- **D11-B** — Discovery → Research → persisted determination → Qualification mandatory for technical validation; the D10 UI additionally mandatory for full (human-inclusive) sign-off.
- **D11-C/H** — A real, unprimed participant answers the existing template's unmodified question ("Would you actually contact this business?"); the system's determination is recorded separately by the facilitator and correlated afterward — the participant-facing template (`MVP_REAL_USER_VALIDATION_TEMPLATE.md`) is **not modified**.
- **D11-D** — No numeric sample-size threshold; categorical coverage required instead: MATCH, MISMATCH, UNKNOWN, a multi-segment Search, two Searches on one Prospect with different `targetCustomer`, one real participant/session.
- **D11-E** — Minimum evidence-field checks, plus at least one manual spot-check of an OBSERVED claim per session against its actual source document.
- **D11-F** — A single naturally-used provider per session is sufficient; D9 §9's fields (provider used, fallback status, etc.) always recorded; no forced multi-provider/fallback test required.
- **D11-G** — Existing, unmodified `core-opportunity`/`core-qualification`/`core-discovery` test suites passing is sufficient regression evidence.
- **D11-I** — The provider funding/credit blocker is a mandatory environment-readiness precondition, distinct from category-plausibility validation criteria itself.

---

## 4. Trace of the Current Architecture (Re-Verified Against Source at HEAD `5992b82`)

Every citation below was read directly in this task, not copied from a prior document without verification.

```text
ServiceProfile.targetCustomer: string
  packages/core-service-profile/src/types.ts:10-14
        ↓ (copied verbatim at Search creation, immutable snapshot)
StoredSearch.parameters (ServiceProfileFields)
  packages/core-search/src/service.ts:82-90 (creation); core-search/src/types.ts:30-46 (shape)
        ↓
Discovery — buildQuery() reads search.parameters.targetCustomer; not forwarded past Discovery
  packages/core-discovery/src/googlePlacesProvider.ts:11-15
        ↓
StoredProspect { id, userId, searchId, companyId, status, createdAt }
  packages/core-discovery/src/types.ts:23-30
  UNIQUE(search_id, company_id)  — packages/db/prisma/migrations/0015_discovery/migration.sql:115-116
  (VERIFIED directly in this task: CREATE UNIQUE INDEX "prospects_search_id_company_id_key"
   ON "prospects"("search_id","company_id"))
        ↓
apps/worker/src/searchWorker/worker.ts
  async function runCanonicalPipeline(deps, search: StoredSearch)         [worker.ts:327-330]
    holds search.id / search.parameters.targetCustomer in scope for the entire loop body
    for (const prospect of discovery.prospects) {                        [worker.ts:358]
      await runResearchForOwner(
        { companies, prospects, signals, provider: deps.researchProvider(userId) },
        userId,
        { prospectId: prospect.id },   <-- ONLY prospectId; search.id and
      )                                    targetCustomer NOT passed, despite being
                                            in scope one line above
                                                                            [worker.ts:359-367,
                                                                             VERIFIED in this task]
      createOpportunityForOwner(...)     (unconditional, if no existing Opportunity)
      scoreOpportunityForOwner(...)      (if deps.scores)
      evaluateQualificationForOwner(...) (if deps.qualifications)
    }
        ↓
packages/core-research/src/service.ts
  ResearchDeps { identity, companies, prospects, signals, provider }       [service.ts:21-27, VERIFIED]
    — NO searches: SearchRepository dependency today
  runResearchForOwner(deps, userId, { prospectId }, now)                  [service.ts:62-88, VERIFIED]
    prospect = deps.prospects.getById(userId, prospectId)                  [line 70]
      — StoredProspect, including prospect.searchId, is loaded here but
        searchId is never read past this point
    company  = deps.companies.getById(userId, prospect.companyId)          [line 73]
    research = deps.provider.research({ prospectId, companyId, companyName,
                                         normalizedDomain })                [lines 76-81]
        ↓
ResearchProviderInput { prospectId, companyId, companyName, normalizedDomain }
  packages/core-research/src/provider.ts:11-16   [VERIFIED — exactly 4 fields, no participant context]
ResearchProvider.research(input): Promise<LeadResearch>                    [provider.ts:24-26]
        ↓
createAnthropicResearchProvider(deps).research(input)
  packages/core-research/src/anthropicResearchProvider.ts:51-82
    sourceDocuments = fetchSourceDocuments(...)   — first-party homepage only
    researchInput: ResearchInput = { companyName, websiteUrl, sourceDocuments }  [lines 67-71]
      — industry/location/socialProfileUrl declared in the schema, prompt-wired,
        but populated by no caller today
    researchLead(deps.model, researchInput, {...})                          [lines 73-77]
        ↓
researchLead()  packages/core-research/src/researcher.ts:151-293
  buildUserMessage(input) -> string    [line 176 -> prompt.ts:32-61]
  model({ system, messages, signal })  [lines 198-202]
  leadResearchSchema.safeParse(...)    [line 247]
  verifyProvenance(...)                [line 253]
  repair loop on schema/provenance failure
        ↓
ResearchModel  (request: {system, messages, signal}) => Promise<ModelResult>
  packages/core-research/src/researcher.ts:44-56  — PROVIDER-NEUTRAL
        ↓
researchModelFactory.ts:9-16/94-130 — "the ONE place in the codebase allowed to
  branch on provider identity"; selects anthropicModel.ts / openAIModel.ts / geminiModel.ts
  (none of the three adapters import or reference ResearchProviderInput or ResearchInput)
        ↓
LeadResearch  packages/core-research/src/schema.ts:176-201
        ↓
toNewResearchSignals(research)   packages/core-research/src/mapping.ts:16-30
  iterates allObservations(research)  [schema.ts:229 — VERIFIED, hardcoded literal field list]
  consults FIELD_KIND[field] ?? 'WEBSITE'  [persist.ts:38 — VERIFIED]
        ↓
ResearchSignalRepository  packages/core-research/src/repository.ts:13-29
  supersedePrevious(prospectId, at)   — keyed by prospectId ONLY
  saveSignals(prospectId, signals, observedAt)
  listByProspect(userId, prospectId)  — keyed by prospectId ONLY
  concrete impl: pgRepository.ts:50
  table: research_signals — columns id, prospect_id, field, kind, classification,
    signal, confidence, basis, observed_at, superseded_at, created_at
    (VERIFIED directly in this task, packages/db/prisma/migrations/0016_research_signals/
     migration.sql:56-80) — NO search_id column, NO user_id column
        ↓
packages/core-qualification/src/service.ts
  evaluateQualificationForOwner(deps, userId, opportunityId, now)          [service.ts:59-78, VERIFIED]
    opportunity = deps.opportunities.getById(userId, opportunityId)         [line 65]
    signals     = deps.signals.listByProspect(userId, opportunity.prospectId) [line 68]
      — scoped by prospectId ONLY; StoredOpportunity has NO searchId field
        (VERIFIED: packages/core-opportunity/src/types.ts:40-59, read in full in this task)
    evaluateQualification({ needDetected: opportunity.needDetected, signals }) [line 69]
  QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT']            [types.ts:12, VERIFIED]
```

**R-71 boundary — verified in this task at its correct, citation-corrected location** (the D8 preparation/scope-map documents flag that six upstream documents mis-cite this as `core-qualification/src/adapters.ts`, which does not exist):

```text
TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])
  packages/core-opportunity/src/adapters.ts:152          [VERIFIED — exact line]
toOfferSignals()  packages/core-opportunity/src/adapters.ts:175-199
  if (TOPICAL_FIELDS.has(row.field)) continue; // R-71   [adapters.ts:186, VERIFIED]
suggestOffers()  packages/core-acquisition/src/offer.ts:76
  if (!rule.triggers.includes(signal.kind)) return false; [offer.ts:85, VERIFIED]
```

**Opportunity creation boundary — verified in this task:**

```text
createOpportunityForOwner  packages/core-opportunity/src/service.ts:112-131
  OpportunityDeps { ..., searches: SearchRepository, ... }   [service.ts:42, VERIFIED]
  const prospect = await deps.prospects.getById(userId, prospectId);
  const search   = await deps.searches.getById(userId, prospect.searchId);  [service.ts:123, VERIFIED]
  const rule     = toServiceRule(search.parameters);                        [service.ts:131, VERIFIED]
```

This is the direct, working precedent D8's recommendation (non-binding) is grounded in: `core-opportunity` already resolves `StoredSearch.parameters` from `prospect.searchId` via an injected `SearchRepository`, exactly the pattern D8's Candidate 2 proposes reusing inside `core-research`.

**Provider fallback — verified in this task:**

```text
apps/worker/src/index.ts:97-125 — env.RESEARCH_FALLBACK_PROVIDER wiring, VERIFIED present
packages/core-research/src/fallbackResearchProvider.ts — createFallbackResearchProvider,
  VERIFIED: fetches source documents exactly once, reuses the same ResearchInput across
  every attempt in the chain; fallback eligibility gated on ResearchProviderError only
  (timeout/rate-limit/outage/auth/context-length) — never on refusal, validation failure,
  or abort.
```

**Frontend — verified in this task:**

```text
apps/web/app/(client-finder)/opportunities/[id]/page.tsx
  imports getOpportunityQualification from '@acos/core-qualification'     [line 14]
  score.factors.map(...)     [line 111]  — existing Score section, list-of-factors pattern
  <h2>Evidence</h2>          [line 122]
  <h2>Qualification: {qualification.state}</h2>   [line 151]
    qualification.criteria.map((criterion) => ...)  [line 153]
    {criterion.criterion}: {criterion.satisfied ? 'satisfied' : 'not satisfied'} — {criterion.reason}
                            [line 155]
```

Confirms D10-A/B/D's structural target: the page already has a Score section (aggregate + factor list pattern, reusable for D10-B's aggregate + segment list) and a Qualification section rendering `satisfied`/`reason` per criterion (reusable for the new criterion without modifying `QualificationCriterionResult`'s shape, per D10 Implementation Constraint 6).

---

## 5. Exact Implementation Surface Map

Every "Required future responsibility" and signature shown below is:

```text
CONCEPTUAL — NOT IMPLEMENTED
```

| Area | Current location | Current responsibility | Required future responsibility | Change type |
|---|---|---|---|---|
| Search context acquisition | `apps/worker/src/searchWorker/worker.ts:327-368` (`runCanonicalPipeline`) | Holds `search.id`/`search.parameters.targetCustomer` in scope; does not forward either into the Research call | Under D8/Option B Candidate 2 (recommended, non-binding): none — resolved inside `core-research` instead. Under Candidate 3: worker call site widens to pass `search.id`/`targetCustomer`. | OPTIONAL (depends on which D8 candidate is chosen) |
| Worker → Research call site | `worker.ts:359-367` — `runResearchForOwner({...}, userId, { prospectId })` | Passes `{ prospectId }` only | Under Candidate 2: unchanged. Under Candidate 3: widened `RunResearchInput` literal. Under Option A: widened `ResearchProviderInput`-bound call. | OPTIONAL |
| Research orchestration (`ResearchDeps`) | `packages/core-research/src/service.ts:21-27` | `{ identity, companies, prospects, signals, provider }` — no `searches` dependency | Under Candidate 2 (recommended): `{ ...existing, searches: SearchRepository }`, mirroring `OpportunityDeps` (`core-opportunity/src/service.ts:42`) | REQUIRED under Candidate 2 only |
| Research orchestration (`runResearchForOwner`) | `service.ts:62-88` | Constructs `ResearchProviderInput` from `prospect`/`company` only | Some change REQUIRED regardless of D8 candidate — this is the one place positioned either to resolve Search context (already has `prospect`) or receive it pre-resolved | REQUIRED (shape depends on D8 candidate) |
| `RunResearchInput` | `packages/core-research/src/types.ts:60-62` | `{ prospectId: string }` | Under Candidate 3: `{ prospectId, searchId?, targetSegments? }` | OPTIONAL (mutually exclusive with the `ResearchDeps.searches` approach) |
| Deterministic segment parser | Does not exist anywhere in the codebase (re-confirmed by search in this task) | N/A | A new, pure, deterministic function; location undecided by any locked document — candidates: (a) `core-search`/`core-service-profile` pure function, (b) worker-orchestration-boundary step, (c) inside `core-research`. Must run once, above `researchModelFactory.ts`'s provider-selection point, per D9. | REQUIRED — location is implementation-scope, not authorized here |
| Category-plausibility evaluator | Does not exist | N/A | New logic producing per-segment MATCH/MISMATCH/UNKNOWN + aggregate, per D2/D3. Whether this runs inside the Research provider (LLM-driven) or as a separate deterministic-aggregation step over LLM-produced per-segment evidence is **not decided by any locked document** — D2 locks the *policy* (ANY-match over deterministically parsed segments), not *where* the evaluation itself executes. | REQUIRED — mechanism is implementation-scope, not authorized here |
| Provider-neutral Research output contract | `ResearchProviderInput` (`provider.ts:11-16`, 4 fields, unchanged under D8/Option B); `ResearchInput`/`researchInputSchema` (`schema.ts:207-224`, has unused `industry`/`location` fields with an existing "supplied, unverified" prompt framing at `prompt.ts:36,55-56`) | No participant-context field of any kind | New field(s) on `ResearchInput` (e.g., parsed target segments) + rendering in `prompt.ts`'s `buildUserMessage()` (`prompt.ts:32-61`) — REQUIRED regardless of D8's A/B choice, since this is the only path by which any content reaches any provider (verified: none of `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` reference `ResearchProviderInput`/`ResearchInput`) | REQUIRED |
| Provider adapters | `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` — none reference `ResearchProviderInput`/`ResearchInput` (VERIFIED) | Translate `{system,messages,signal}` to/from each vendor's wire format | None — D9 requires this remain true | NOT NEEDED |
| Persistence (D1's dedicated entity) | Does not exist. `research_signals` table (`packages/db/prisma/migrations/0016_research_signals/migration.sql:56-80`, VERIFIED) has no `search_id` column and cannot express a `(search_id, prospect_id)` key | N/A | A new table + repository interface + Postgres implementation, keyed by `(search_id, prospect_id)`, distinct from `ResearchSignalRepository`. D7 confirms it must never become a `research_signals` row. | REQUIRED — schema/migration design not authorized here |
| Search + Prospect attribution | `prospects` table — `UNIQUE(search_id, company_id)` (VERIFIED, migration 0015:115-116); a rediscovered business under a second Search produces a second, distinct Prospect row, never the same row reattached to a different Search | Prevents the specific "Search B silently overwrites Search A's result for the same Prospect row" scenario structurally, for `ResearchSignal`'s existing Prospect-keyed fields | D1's dedicated entity keyed by `(search_id, prospect_id)` still required — the schema fact above narrows *why* (existing rows cannot cross Search boundaries by accident) but does not eliminate the need for a queryable-per-Search persistence primitive, since `research_signals` cannot express that key at all today | REQUIRED (D1 scope) |
| Qualification criterion | `QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT']` (`types.ts:12`, VERIFIED); `rules.ts` (`evaluateNeedDetected`/`evaluateEvidencePresent`); `evaluator.ts` (sequential short-circuit) | Two criteria only | Extend `QUALIFICATION_CRITERIA` with a third id (illustrative only, e.g. `CATEGORY_PLAUSIBLE` — name not approved); new rule function in `rules.ts`; invoked in `evaluator.ts` | REQUIRED (D4 scope) |
| Qualification read path | `evaluateQualificationForOwner` (`service.ts:59-78`, VERIFIED) reads `signals.listByProspect(userId, opportunity.prospectId)` — Prospect-scoped only; `StoredOpportunity` (`core-opportunity/src/types.ts:40-59`, VERIFIED) has NO `searchId` field | Resolves signals by Prospect only | Must obtain "the current Search + Prospect determination" per D6 — requires either (a) a new repository method on D1's dedicated entity queryable by `(searchId, prospectId)` where `searchId` is derived from the 1:1 Prospect→Search relationship (since `Opportunity.prospectId` already uniquely determines one Search, per the `UNIQUE(search_id, company_id)` constraint — VERIFIED), avoiding the need to add a `searchId` field to `StoredOpportunity` itself, or (b) adding `searchId` to `StoredOpportunity`/threading it through `evaluateQualificationForOwner`'s call site. **Neither is selected by any locked decision — this is a genuine open implementation question, not resolved by D1/D6/D8.** See §7. | REQUIRED — exact mechanism NOT authorized, and NOT yet even narrowed to one option by governance |
| Opportunity creation boundary | `createOpportunityForOwner` (`core-opportunity/src/service.ts:112-151`, VERIFIED) — independent of Qualification, unconditional | Creates an Opportunity for every Prospect regardless of any Research/Qualification result | None — per D5, remains unconditional | NOT NEEDED |
| Scoring/ranking boundary | `scoreOpportunity`/`scoreOpportunityForOwner`/`rankOpportunities` (`core-opportunity/src/service.ts:264-401`) — no data dependency on Research's field set or Qualification's criteria | Independently authorized, separately-gated worker step | None | NOT NEEDED |
| UI rendering | `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` (VERIFIED: Score section pattern at line 111, Qualification section at lines 151-157) | Renders Score, Evidence, Qualification sections, each conditionally on record existence | New section: aggregate + per-segment MATCH/MISMATCH/UNKNOWN + evidence + `targetCustomer` context + timestamp, per D10; reuses existing evidence-item shape; Qualification section gets one more criterion row via existing `satisfied`/`reason` shape, no shape change | REQUIRED (D10 scope) |
| Validation instrumentation | None exists for this capability | N/A | Facilitator/analyst-side record (D11-H), NOT an extension of `MVP_REAL_USER_VALIDATION_TEMPLATE.md` | REQUIRED (D11 scope; the template itself must NOT be modified) |

---

## 6. Persistence Shape Resolution (D1 + D6 + D7, Jointly Authoritative)

D1 locks a dedicated Search + Prospect entity. D6 locks per-Search-+-Prospect storage with preserved historical attribution and disallowed cross-search overwrite. D7 locks that this entity must never become a `ResearchSignal` row, never enter `FIELD_KIND`, never enter `allObservations()`, never enter R-71, and never become a scoring/ranking factor.

**How this is achievable without violating any of the three, verified against current schema in this task:**

- The existing `research_signals` table (migration 0016, VERIFIED above) has no `search_id` column — reusing it unmodified for this determination is structurally impossible without a migration, which D1 already forecloses by specifying "dedicated," not "extend."
- A new table (name/shape not authorized here) keyed by `(search_id, prospect_id)` — or `(search_id, prospect_id)` as a natural composite key on a new entity — directly satisfies D6's attribution requirement without touching `research_signals`' existing rows, columns, or supersession behavior for any of the six existing `LeadResearch` fields.
- Because `research_signals`/`allObservations()`/`FIELD_KIND` are simply never consulted for this new entity (it is not a `LeadResearch` field), D7's isolation is structural, not conventional — there is no field-name exclusion list to maintain or forget.
- The new entity's own supersession/uniqueness semantics (whether a re-run for the same `(search_id, prospect_id)` supersedes-then-inserts, mirroring `ResearchSignalRepository.supersedePrevious`, or something else) is **not decided by any locked document** and is implementation-scope work.

**Required schema/repository addition, explicitly identified, not designed:**

```text
CONCEPTUAL ONLY — NOT IMPLEMENTED

A new table (e.g. "category_plausibility_determinations", name illustrative,
not approved), at minimum carrying:
  id
  search_id           (FK -> searches)
  prospect_id         (FK -> prospects)
  target_customer_snapshot   (raw string, for audit/attribution per D6)
  target_segments     (the deterministic parse output, per D2)
  aggregate_result    (MATCH | MISMATCH | UNKNOWN)
  segment_results     (per-segment MATCH/MISMATCH/UNKNOWN + evidence, per D2/D10-B)
  evidence            (reusing the existing {sourceUrl, sourceLabel, sourceQuote,
                        confidence, basis} shape, per D10 Implementation Constraint 4)
  observed_at / created_at

A new repository interface (name illustrative):
  CategoryPlausibilityRepository {
    save(searchId, prospectId, determination, now): StoredDetermination
    getBySearchAndProspect(userId, searchId, prospectId): StoredDetermination | null
  }
```

No migration, TypeScript type, repository, or SQL is created by this document. This is the same conceptual shape the D6 decision record itself already sketched (§10 of that record) and the D8 implementation scope map independently arrived at (§15 of that map) — reproduced here as the converged, cross-document shape, not a new invention.

---

## 7. Qualification Read Path Resolution (Genuinely Open — Flagged, Not Invented)

Traced in this task, confirming the D8 preparation/scope-map documents' own finding:

```text
evaluateQualificationForOwner(deps, userId, opportunityId, now)   [core-qualification/src/service.ts:59-78]
  opportunity = deps.opportunities.getById(userId, opportunityId)
  signals     = deps.signals.listByProspect(userId, opportunity.prospectId)
```

`StoredOpportunity` (VERIFIED, `core-opportunity/src/types.ts:40-59`) carries `id`, `userId`, `prospectId`, `state`, `needDetected`, `offer`, `staleness`, `stalenessComputedAt`, `createdAt`, `updatedAt` — **no `searchId` field**.

**Is a `searchId` field on `StoredOpportunity` strictly necessary?** Not necessarily, per the schema fact already verified in §4: `Prospect` carries `UNIQUE(search_id, company_id)`, so every `prospectId` already uniquely determines exactly one `searchId` (via `StoredProspect.searchId`, a durable, persisted column). A future implementation could resolve `searchId` from `opportunity.prospectId` via a `ProspectRepository.getById` lookup already available to `core-qualification` in spirit (though `QualificationDeps`, VERIFIED at `core-qualification/src/service.ts:16-21`, does not currently inject a `ProspectRepository` — only `identity`, `opportunities`, `signals`, `qualifications`) — this would require either a new `prospects: ProspectRepository` dependency on `QualificationDeps`, or D1's own repository exposing a `getBySearchAndProspect`-shaped lookup that itself resolves `searchId` internally from `prospectId` (avoiding the need for `QualificationDeps` to gain a new dependency at all).

**This is an explicitly unresolved implementation question, not decided by D1, D6, or D8**, each of which the D8 preparation document (§9) and D8 implementation scope map (§13) independently flag as "the same shape of gap D8 addresses for Research's input side, at Qualification's read boundary instead — noted ... not solved, decided, or authorized ... outside D8's own scope." This document does not resolve it either. Two candidate resolutions, neither selected:

1. Add a `prospects: ProspectRepository`-shaped (or equivalent) dependency to `QualificationDeps`, and have `evaluateQualificationForOwner` resolve `prospect.searchId` before querying D1's entity — mirroring the same pattern `core-opportunity`'s `createOpportunityForOwner` already uses for `searches: SearchRepository`.
2. Design D1's repository so its primary lookup method accepts `prospectId` alone and resolves `searchId` internally (e.g., via its own join to `prospects`), sparing `QualificationDeps` any new dependency — mirroring how `ResearchSignalRepository.listByProspect` already resolves ownership via a join to `prospects` without a separate `SearchRepository` dependency.

Both are architecturally supported by existing patterns in the repository; neither is authorized or selected here.

---

## 8. Research Context Path (D8, Non-Binding Direction Only)

```text
worker (apps/worker/src/searchWorker/worker.ts)
  ↓
Research orchestration / ResearchDeps (packages/core-research/src/service.ts)
  ↓
Search-scoped context resolution  (mechanism NOT fixed — three candidates, D8 non-binding)
  ↓
ResearchInput / prompt.ts construction  (REQUIRED regardless of candidate)
  ↓
provider-neutral ResearchModel  (researcher.ts:44-56 — UNCHANGED under every candidate)
  ↓
Anthropic / OpenAI / Gemini adapters  (UNCHANGED under every candidate, VERIFIED)
```

Provider adapters are not required, and must not be permitted, to understand Search IDs or participant Search objects — confirmed by direct inspection in this task: none of the three adapter files reference `ResearchProviderInput` or `ResearchInput`. Provider adapters remain responsible only for translating `{system, messages, signal}` to/from each vendor's wire format.

**Current vs. conceptual future signatures** (all conceptual, not implemented):

| Layer | Current (VERIFIED) | Conceptual future — Candidate 2 (recommended, non-binding) |
|---|---|---|
| `ResearchDeps` | `{ identity, companies, prospects, signals, provider }` | `{ ...existing, searches: SearchRepository }` |
| `runResearchForOwner` | Builds `ResearchProviderInput` from `prospect`/`company` only | Additionally resolves `search = await deps.searches.getById(userId, prospect.searchId)`, threads `search.parameters.targetCustomer` (parsed, per D2) into `ResearchInput` construction |
| `ResearchProviderInput` | `{ prospectId, companyId, companyName, normalizedDomain }` | **UNCHANGED** under Candidate 2 |
| `ResearchInput`/`researchInputSchema` | `{ companyName, websiteUrl, industry?, location?, socialProfileUrl?, sourceDocuments }` | `+ targetSegments?: string[]` (or equivalent), mirroring the existing `industry`/`location` "supplied, unverified" framing |
| `prompt.ts buildUserMessage()` | Renders `industry`/`location` when present | `+` renders target segments the same way |

---

## 9. Provider Neutrality (D9)

Traced and re-verified in this task:

```text
apps/worker/src/index.ts:97-125 — RESEARCH_FALLBACK_PROVIDER wiring, VERIFIED present
packages/core-research/src/fallbackResearchProvider.ts — createFallbackResearchProvider,
  VERIFIED: fetches source documents exactly once, reuses the same ResearchInput across
  every attempt in a fallback chain; eligibility gated on ResearchProviderError only.
```

No candidate anywhere in this document's §5–§8 touches `anthropicModel.ts`, `openAIModel.ts`, `geminiModel.ts`, or `fallbackResearchProvider.ts`'s eligibility logic. Category-plausibility semantics (evidence policy, MATCH/MISMATCH/UNKNOWN meaning, evaluation rule) must be normalized entirely above `researchModelFactory.ts`'s provider-selection point — in `schema.ts`/`provider.ts`/`prompt.ts`/`researcher.ts`-layer code — so every configured provider and the fallback path produce the same contract by construction, not by convention. This is unchanged, and not reopened, by this document.

---

## 10. R-71 Boundary (Hard Boundary, Not Reopened)

Verified in this task at the correct location (`core-opportunity/src/adapters.ts`, not `core-qualification/src/adapters.ts`, which does not exist):

```text
TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])
  packages/core-opportunity/src/adapters.ts:152
suggestOffers()   packages/core-acquisition/src/offer.ts:76
toOfferSignals()  packages/core-opportunity/src/adapters.ts:175-199
```

Category plausibility is a separate audience-fit/category axis, not topic/problem/need detection. No candidate in this document proposes adding the new determination to `TOPICAL_FIELDS`, routing it through `suggestOffers()`/`toOfferSignals()`, or otherwise touching either function. D7's persistence isolation (§6) makes this structurally impossible, not merely disallowed by convention — the determination is never a `StoredResearchSignal` row, so it can never reach `toOfferSignals()`'s input regardless of any implementation detail.

---

## 11. Scoring / Ranking Boundary (Hard Boundary, Not Reopened)

Verified: `scoreOpportunity`/`scoreOpportunityForOwner`/`rankOpportunities` (`packages/core-opportunity/src/service.ts:264-401`) have no data dependency on Research's field set or Qualification's criteria. No candidate in this document adds a new scoring factor, ranking input, or `OpportunityScore`/`FACTOR_WEIGHTS` modification. Category plausibility may affect Qualification status only, per D5. It must not become an implicit ranking signal — D10-F explicitly requires it never appear on the ranked Opportunities list page.

---

## 12. Discovery Boundary (Hard Boundary, Not Reopened)

Discovery remains unchanged. No candidate in this document alters Google Places query construction, adds target-category filtering, adds Discovery category fields, or adds Discovery-side rejection. Discovery continues to receive the raw, unparsed `targetCustomer` exactly as today (`googlePlacesProvider.ts:11-15`, unchanged). Category plausibility begins downstream, in Research.

---

## 13. Opportunity Boundary (Hard Boundary, Not Reopened)

Per D5: MISMATCH does not block Opportunity creation; UNKNOWN does not block Opportunity creation. `createOpportunityForOwner` (`core-opportunity/src/service.ts:112-151`, VERIFIED) remains unconditional and independent of Qualification. Therefore: Opportunity exists + Qualification explains the category-plausibility result as one criterion among others. No new Opportunity state is introduced. The Opportunity state machine (`OpportunityState = Extract<OpportunityStage, 'NEW' | 'RESEARCHED'>`, VERIFIED `core-opportunity/src/types.ts:16`) is not modified.

---

## 14. UI Scope (Conceptual Only, D10)

Target: `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` (VERIFIED existing structure at §4). Required rendering, per D10:

```text
Search targetCustomer + determination timestamp
Aggregate: MATCH / MISMATCH / UNKNOWN (literal text)
Per segment: segment text, its own MATCH/MISMATCH/UNKNOWN, its own evidence
Qualification criterion: satisfied / not satisfied, reason (existing shape, no change)
```

Reuses the existing evidence presentation primitives (`sourceUrl`/`sourceLabel`/`sourceQuote`/`confidence`/`basis`, VERIFIED at the page's existing Evidence section, lines 122-147 per the D10 record's own citation) and the existing Score-section aggregate+list pattern (VERIFIED at line 111). No UI is implemented by this document. The Opportunities list page (`opportunities/page.tsx`) is explicitly not modified — category plausibility never appears there, per D10-F.

---

## 15. Validation Scope (Conceptual Checklist, D11)

```text
Input propagation:    verify participant targetCustomer reaches Research
Segment handling:     verify deterministic parsing, multi-segment behavior
Classification:       exercise MATCH, MISMATCH, UNKNOWN
Evidence:              verify first-party primary + supporting metadata behavior;
                       at least one manual spot-check of an OBSERVED claim per session
Attribution:           exercise Search A + targetCustomer A / Search B + targetCustomer B
                       on the same Prospect; prove historical determinations remain
                       independently attributable
Provider neutrality:   record provider used + fallback status for naturally occurring runs
                       (no forced multi-provider/fallback test required)
Qualification:         verify the new criterion behaves per D5
Opportunity:           verify Opportunity remains created for MATCH, MISMATCH, UNKNOWN
UI:                    verify D10 rendering once the capability exists
Human validation:      the existing, unmodified participant question; no sample-count
                       invented — categorical coverage only (D11-D)
Regression:            existing green core-opportunity/core-qualification/core-discovery
                       suites are the accepted baseline (D11-G)
```

`MVP_REAL_USER_VALIDATION_TEMPLATE.md` is not modified by any part of this scope. Observations are recorded in a separate facilitator-side record (D11-H).

---

## 16. Implementation Order (Dependency-Ordered, Conceptual Only)

```text
SCOPE ONLY — NOT AUTHORIZED, for every item below
```

| # | Item | Depends on | Why this order |
|---|---|---|---|
| 1 | Persistence/attribution primitive (D1's dedicated entity — table, repository interface, Postgres implementation) | None upstream | Every other item needs somewhere to write/read a determination |
| 2 | Search-scoped Research context resolution (D8 candidate selection + implementation) | None upstream (parallel-safe with #1) | Needed before Research can be told what to evaluate against |
| 3 | Deterministic segment parsing (D2) | #2 (needs the raw `targetCustomer` in scope) | The evaluator needs discrete segments before it can apply ANY-match |
| 4 | Provider-neutral Research input/output contract extension (`ResearchInput`, `prompt.ts`) | #2, #3 | The model cannot evaluate segments it was never told about |
| 5 | Category-plausibility determination/evaluation logic | #4 | Needs the rendered prompt/schema in place first |
| 6 | Persistence write path (wiring #1's repository into the Research flow) | #1, #5 | Needs both a place to write and something to write |
| 7 | Qualification read-path resolution (§7) + new Qualification criterion (D4) | #6 | Needs a persisted determination to read |
| 8 | UI (D10) | #7 (needs the Qualification criterion and the underlying determination to render) | The page renders both the determination and the criterion together |
| 9 | Validation instrumentation (facilitator-side record, D11-H) | #8 (full sign-off needs the UI, per D11-B) | Technical-tier validation could begin after #7; full sign-off needs #8 |
| 10 | End-to-end + human-participant validation (D11) | #9, and a funded provider account (D11-I, environment precondition) | Terminal step — confirms the whole chain live |

Provider adapter changes are never a phase — per D9/§9, no adapter file is touched at any point in this sequence. Items #1 and #2 are independent of each other and may proceed in parallel; every subsequent item has a strict dependency on at least one earlier item, as shown.

---

## 17. Explicit Non-Goals

```text
No Discovery filtering
No Google Places query redesign
No R-71 changes
No scoring changes
No ranking changes
No Opportunity-state changes
No provider-specific semantics
No ResearchSignal / FIELD_KIND integration
No participant validation template modification
No automatic cross-Search comparison UI
No implementation of any kind — this document is scope-lock only
```

---

## 18. Open Implementation Questions

### Product decisions already locked (D0–D11) — not reopened here

See §3 in full.

### Implementation details still requiring engineering confirmation (not product decisions, not authorized here)

1. **D2's exact splitting rule** (delimiter precedence, handling of `,` within a segment vs. `;` between segments) — the Final Decision Record's own text marks this "requiring implementation-level confirmation rather than inventing it" (§3, D2).
2. **Which D8 Option B candidate** — a `ResearchDeps.searches` dependency (Candidate 2, recommended non-binding), a widened `RunResearchInput` (Candidate 3), or a second `ResearchProvider.research()` parameter (Candidate 1). D8's own record fixes only the top-level direction (Option B), not the candidate.
3. **Where the category-plausibility evaluation itself executes** — inside the LLM's own Research call (segment-by-segment judgment as part of the structured output), or as a separate deterministic-aggregation step consuming per-segment LLM output. D2 locks the *policy*; no document fixes the *mechanism*.
4. **D1's exact schema/table shape, field names, and repository interface** — §6 of this document sketches a conceptual shape; none of it is approved.
5. **The Qualification read-path resolution** (§7 of this document) — whether `QualificationDeps` gains a new dependency, or D1's repository resolves `searchId` internally from `prospectId`. Genuinely unresolved by any locked decision, not merely undesigned.
6. **The illustrative criterion name** (`CATEGORY_PLAUSIBLE` or equivalent) — not an approved name, per D4.
7. **Whether a raw `targetCustomer` snapshot and parsed segments are both persisted**, and in what shape, to satisfy D3's evidence/audit requirements and D6's "what `targetCustomer` was this evaluated against" requirement.
8. **Malformed/empty segment handling** (e.g., a trailing delimiter producing an empty segment) — no locked document addresses this; the most consistent extrapolation from D3 (an unevaluable segment contributes UNKNOWN for that segment, participating in aggregation like any other UNKNOWN) is a proposal, not a decision.

### Genuine contradiction found in the source documents, not silently resolved

None found. The eleven decision records, their preparation documents, and the two implementation-scope documents are internally consistent with each other on every point this document's re-verification touched. Two citation errors were found and are noted, not treated as substantive contradictions: (a) six upstream documents cite R-71's `TOPICAL_FIELDS`/`toOfferSignals()` as living in `packages/core-qualification/src/adapters.ts`, which does not exist — the correct location, verified directly in this task, is `packages/core-opportunity/src/adapters.ts:152,175-199` (with `suggestOffers()` itself in `packages/core-acquisition/src/offer.ts:76`); (b) two files the original task instruction names by slightly different filenames do not exist verbatim — their actual on-disk names are recorded in §2.

---

## 19. Final Scope Classification

```text
PRODUCT DECISIONS: LOCKED D0–D11

IMPLEMENTATION SCOPE: DEFINED

IMPLEMENTATION AUTHORIZATION: NOT GRANTED

LIVE VALIDATION: NOT PERFORMED
```

**Blocking implementation dependencies** (must be resolved before code can be written, per §18):

1. D8 candidate selection (which Option B sub-candidate, or fresh justification for Option A).
2. D2's exact deterministic splitting rule.
3. D1's exact schema/table/repository design.
4. The Qualification read-path resolution (§7).
5. A separate, explicit implementation-authorization step — naming which of the above are resolved and how — per every source document's own "NOT GRANTED"/"NOT AUTHORIZED" status.
6. A funded Anthropic (or configured OpenAI/Gemini/fallback) provider account, as an environment-readiness precondition to any live validation (D11-I) — unrelated to and unresolved by any product decision.

**Non-blocking implementation considerations** (can be decided during implementation without blocking the start of work):

1. Exact criterion name (D4) and persisted field names (D1).
2. Malformed/empty segment handling.
3. Whether the raw `targetCustomer` snapshot is persisted alongside parsed segments.
4. Where the evaluation mechanism executes (LLM-integrated vs. separate deterministic-aggregation step).
5. Exact prompt wording for the shared, provider-neutral `ResearchInput`/`prompt.ts` extension.

---

## 20. Repository Safety Verification

```bash
git status --short
git diff --check
git diff --name-only
git diff --cached --name-only
git rev-parse HEAD
git status --porcelain=v1
```

**Result (run at the end of this task):**

```text
HEAD:                         5992b82b9adff492c480442d68a954f2a03bfb28  (UNCHANGED)

git diff --name-only (unstaged, pre-existing, untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

git diff --cached --name-only:  (empty — nothing staged)

git status --porcelain=v1 additionally shows, as untracked ("??"), the full
pre-existing requirement/*.md set, .claude/, and CLAUDE.md — all untouched by
this task, plus exactly ONE new untracked file created by this task:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md
```

**Confirmed:**

```text
HEAD unchanged:                                  YES (5992b82b9adff492c480442d68a954f2a03bfb28)
All pre-existing tracked modifications unchanged: YES (same 5 files, byte-identical — none
                                                    read by this task for editing purposes,
                                                    two were read read-only for line-number
                                                    verification: apps/worker/src/searchWorker/
                                                    worker.ts and packages/core-discovery/src/
                                                    service.ts's sibling apps/worker/src/index.ts
                                                    was read, not modified)
All pre-existing untracked files unchanged:       YES
Only the new scope-lock document was created:     YES
No production code changed:                       YES (0)
No tests changed:                                  YES (0)
No PRD changed:                                     YES (0)
No configuration changed:                            YES (0)
No database/migration changed:                        YES (0)
No provider code changed:                               YES (0)
No worker code changed:                                   YES (0)
No frontend code changed:                                   YES (0)
Nothing staged:                                                YES (none)
No commit:                                                       YES (none)
No push:                                                           YES (none)
No live API calls:                                                    YES (0 — no Anthropic/
                                                                        OpenAI/Gemini/Google
                                                                        Places call made)
```

---

## STOP CONDITION

`requirement/PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` has been produced and repository safety has been verified (§20). No part of the scope described in this document is implemented. No Phase implementation begins. No other governance document is modified. The application is not run. No live validation is performed. This is the sole deliverable of this task.
