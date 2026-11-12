# Path 2 — Post-Implementation Conformance & Regression Audit

```text
DOCUMENT TYPE: READ-ONLY POST-IMPLEMENTATION CONFORMANCE & REGRESSION AUDIT
STATUS: AUDIT ONLY — NO PRODUCTION CODE, TEST, MIGRATION, PRD, OR GOVERNANCE
        DOCUMENT WAS MODIFIED, FIXED, OR REWRITTEN BY THIS TASK.
```

## 1. Audit Status

```text
FINAL CLASSIFICATION: CONFORMING WITH NON-BLOCKING NOTES
```

The uncommitted Path 2 (Research-level Category Plausibility) implementation in the working tree, on top of HEAD `5992b82b9adff492c480442d68a954f2a03bfb28`, conforms to the locked D0–D11 product decisions across every hard boundary (Discovery, R-71/`TOPICAL_FIELDS`, scoring/ranking, Opportunity-state machine, `FIELD_KIND`/`ResearchSignal`). All previously-flagged "non-blocking, open engineering questions" from the pre-implementation governance chain (D8 sub-candidate, D2's splitting rule, D1's schema shape, the Qualification Search-resolution mechanism, the `NEED_DETECTED` short-circuit position, the `QualificationState` mapping) were resolved by the implementation, consistently and traceably.

One genuine, citable textual deviation was found (D8 — `ResearchProviderInput` was widened, which D8's own locked text says to avoid; see §5.8/§16). It is additive, optional, backward-compatible, and does not compromise provider neutrality — but it is a literal deviation from the locked text, not merely a style note, and is reported as such rather than smoothed over.

The 14 pre-existing integration test failures were independently reproduced and traced to their root cause in this task (not merely re-asserted from a prior claim): all 14 are **pre-existing**, caused by an R-71/`suggestOffers()` fixture gap (empty `visibleProblems`) in three integration test files, unrelated to and unmodified by Path 2. See §12.

Several test-coverage gaps were found (MISMATCH/UNKNOWN never exercised end-to-end against the real worker pipeline or Postgres; a few evidence-validation branches untested at the unit level; one Gemini structured-output translation item unverified). None of these are conformance violations — they are QA gaps, reported in §17/§19.

## 2. Baseline / Repository Safety

Captured at task start and re-verified at task end (§20). No `git` state-altering command was ever run.

```text
HEAD (start and end):        5992b82b9adff492c480442d68a954f2a03bfb28  (UNCHANGED)
Expected baseline (given):   5992b82b9adff492c480442d68a954f2a03bfb28  MATCH — CONFIRMED
git diff --check:            clean (no whitespace errors)
git diff --cached --name-only: empty (nothing staged, start and end)
git diff --stat:             47 files changed, 1119 insertions(+), 59 deletions(-)  (IDENTICAL
                              at start and end of this task)
git status --short line count: 91 (identical composition at start and end — 47 modified
                              tracked files + untracked new source/migration/requirement files)
```

Pre-existing tracked modifications present **before** this audit began (confirmed unrelated to, or predating, Path 2 implementation — not created or altered by this audit):
```text
apps/web/app/(client-finder)/opportunities/[id]/page.tsx
apps/web/src/server/clientFinderRepositories.ts
apps/web/tsconfig.tsbuildinfo                        (generated build artifact)
apps/worker/src/index.ts
apps/worker/src/searchWorker/worker.test.ts
apps/worker/src/searchWorker/worker.ts
packages/core-ai-usage/src/meteredResearch.test.ts
packages/core-discovery/src/service.test.ts           (unrelated — see §14)
packages/core-discovery/src/service.ts                (unrelated — see §14)
packages/core-qualification/src/*  (8 files)
packages/core-research/src/*  (14 files)
packages/core-research/package.json
pnpm-lock.yaml
tests/integration/*.integration.test.ts  (13 files)
```
New untracked files created by the implementation (not by this audit):
```text
packages/core-research/src/categoryPlausibility.ts
packages/core-research/src/categoryPlausibility.test.ts
packages/core-research/src/categoryPlausibilityPgRepository.ts
packages/core-research/src/categoryPlausibilityRepository.ts
packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql
+ the full pre-existing requirement/*.md governance set, .claude/, CLAUDE.md
```
The only file created by this audit task is this document itself.

## 3. D0–D11 Conformance Matrix

| Decision | Locked requirement (condensed) | Implementation evidence | Tests/evidence | Status | Deviations |
|---|---|---|---|---|---|
| D0 | MVP enhancement; 19-criterion exit not reopened | No Discovery filtering added; scope confined to Research/Qualification/UI | `DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:380-381` "MVP ENGINEERING EXIT: SATISFIED" (unconditioned) | CONFORMING | None |
| D1 | Dedicated Search+Prospect determination, not Prospect-global, not `targetCustomers`, not R-71 | New table `category_plausibility_determinations`, keyed `(search_id, prospect_id)`; `CategoryPlausibilityRepository` interface | `categoryPlausibility.test.ts` (171 lines, pure-fn coverage) | CONFORMING | None |
| D2 | Deterministic parsing + ANY-match | `parseTargetSegments()` (`categoryPlausibility.ts:36-41`); `aggregateCategoryFit()` (`categoryPlausibility.ts:51-56`) | 11 parseTargetSegments/aggregateCategoryFit unit tests | CONFORMING | Minor: leading/interior double-delimiter not explicitly tested (behaves correctly by construction — §11) |
| D3 | First-party evidence primary; UNKNOWN on insufficiency, never default MISMATCH | `schema.ts` `superRefine` (214-241): UNKNOWN⇒empty evidence; MATCH/MISMATCH⇒non-empty evidence; `verifyCategoryPlausibility()` checks quote authenticity + source membership | 7 `verifyCategoryPlausibility` tests | CONFORMING | Minor: "quote too short" and "no source docs" branches untested (§11) |
| D4 | New, distinct Qualification criterion, not routed through R-71/`NEED_DETECTED` | `QUALIFICATION_CRITERIA` gains `'CATEGORY_PLAUSIBLE'` (`types.ts:16`); `evaluateCategoryPlausible()` (`rules.ts:77-108`) is content-independent of Need Detection | `evaluator.test.ts` dedicated `describe` block | CONFORMING | Short-circuit position resolved: evaluated unconditionally (§8) |
| D5 | MATCH passes; MISMATCH/UNKNOWN fail criterion, do not block Opportunity; no new Opportunity state | `evaluator.ts:58-65` maps fit→state via existing `QualificationState` values only; `core-opportunity` package has **zero diff** | `evaluator.test.ts` MATCH/MISMATCH/UNKNOWN/null cases | CONFORMING (flagged nuance) | MISMATCH reuses `NOT_QUALIFIED`, conflating with `NEED_DETECTED`-driven failures; has a real downstream effect on Personalization's R-42 gate — not itself a violation (§9) |
| D6 | Per Search+Prospect storage; historical preserved; cross-search overwrite disallowed; Qualification reads CURRENT determination | Migration 0027 non-unique `(search_id, prospect_id)` index + partial "current" index; `supersedePrevious(searchId, prospectId, at)` scoped to both keys; `getCurrentByProspectId` used by Qualification (Candidate 2) | Schema/SQL inspected directly; `service.ts:81-84` | CONFORMING | Two-Search/different-`targetCustomer` scenario not exercised by an integration test, though structurally guaranteed by schema (§10, §17) |
| D7 | Outside `FIELD_KIND`/`ResearchSignal`/`allObservations()` entirely | `allObservations()` (`schema.ts:321-341`) does not include `categoryPlausibility`; `persist.ts` has zero diff and zero references | Direct source inspection, both agents independently confirmed | CONFORMING | None |
| D8 | Option B — preserve provider-facing contract; carry context via orchestration/dependencies **rather than widening `ResearchProviderInput`** | `ResearchDeps.searches: SearchRepository` added (Candidate 2, mirrors `OpportunityDeps`) — CONFORMING; **but** `ResearchProviderInput` gained an optional `targetSegments?` field (`provider.ts:13-27`) — literal deviation from the locked "rather than widening `ResearchProviderInput`" clause | `service.ts:108-118`; provider.ts diff | **PARTIALLY CONFORMING** | See §16 for full discussion — additive/optional/backward-compatible, does not affect provider neutrality, but contradicts the locked text and the pre-implementation readiness audit's own "`ResearchProviderInput` … UNCHANGED under Candidate 2" expectation |
| D9 | Full provider neutrality incl. fallback | Anthropic and fallback adapters do pure plumbing (`targetSegments: [...(input.targetSegments ?? [])]`), zero business logic; all verdict logic lives above the adapter boundary | Both adapter diffs read in full by agent | CONFORMING (one item UNVERIFIED) | Gemini `toGeminiSchema()` translation of the new field shape not independently verified in this diff (§13) — STRUCTURAL neutrality confirmed by architecture (Gemini adapter untouched, as expected); LIVE validation not performed |
| D10 | Opportunity detail page only; aggregate+segment; existing evidence shape; literal text; unconditional Opportunity section; never on ranked list | New section, `page.tsx:160-186`; Opportunity section (`page.tsx:90-116`) unconditional, positioned before it, no data dependency on it | List page (`opportunities/page.tsx`) confirmed zero diff, zero references | CONFORMING | None |
| D11 | Categorical coverage; manual spot-check; provider/fallback recorded; existing suites sufficient regression evidence; template unmodified | 500 unit tests green across 5 packages; 1 DB-integration test (`qualification.integration.test.ts`, MATCH + short-circuit cases) green | See §13 (regression), §17 (validation limitations) | CONFORMING AS TO CODE-LEVEL/INTEGRATION VALIDATION; LIVE PROVIDER / HUMAN VALIDATION NOT PERFORMED (expected for a read-only audit) | MISMATCH/UNKNOWN not exercised at DB-integration/worker level (§17) |

## 4. D0–D6 Detailed Findings

**D0 (MVP boundary).** `requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_DECISION.md:380-381` states `MVP ENGINEERING EXIT: SATISFIED`, unconditioned on category plausibility, and explicitly: *"The 19-criterion engineering exit is not reopened by this product-boundary clarification."* The implementation touches only `packages/core-research`, `packages/core-qualification`, `apps/worker`, `apps/web/.../opportunities/[id]/page.tsx`, and a new migration — no Discovery query/filtering change (`packages/core-discovery/src/googlePlacesProvider.ts` is not in the modified-file list at all). The one `core-discovery` diff present (`service.ts`/`service.test.ts`) is unrelated pre-existing drift — see §14.

**D1 (dedicated entity).** Confirmed via direct read of `packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql`: a wholly new table, FK'd to `searches` and `prospects`, with **no** `user_id` column (ownership inherited via `prospect_id → prospects.user_id`, the same DEC-008 convention `research_signals`/`qualifications` already use). It is not a `research_signals` row (different table entirely), not a `LeadResearch.targetCustomers` repurposing (that field is untouched — `schema.ts:262` adds a **separate** `categoryPlausibility` array field), and not routed through R-71 (§7).

**D2 (parsing + ANY-match).**
```ts
// packages/core-research/src/categoryPlausibility.ts:36-41
export function parseTargetSegments(targetCustomer: string): readonly string[] {
  return targetCustomer.split(';').map((segment) => segment.trim()).filter((segment) => segment.length > 0);
}
// :51-56
export function aggregateCategoryFit(fits: readonly CategoryFit[]): CategoryFit {
  if (fits.length === 0) return 'UNKNOWN';
  if (fits.some((fit) => fit === 'MATCH')) return 'MATCH';
  if (fits.every((fit) => fit === 'MISMATCH')) return 'MISMATCH';
  return 'UNKNOWN';
}
```
Edge cases traced against the audit's own required list:
```text
"Restaurants"                    -> ['Restaurants']                          TESTED (line 25)
"Restaurants;Hotels"-equivalent  -> multi-segment, tested via the 3-segment
                                     worked example (line 19-21)              TESTED
"Restaurants; Hotels" (space)    -> whitespace trimmed                       TESTED (line 28-30,
                                                                                '  Restaurants ;  Cafes  ')
"Restaurants;;Hotels"            -> filter(length>0) drops the empty middle
                                     segment by construction                  NOT EXPLICITLY TESTED
                                     (only trailing ';;' and all-';;' tested,
                                     lines 32-35) — behaves correctly by
                                     construction, flagged as a minor gap
""                                -> []                                       TESTED (line 38)
whitespace-only                  -> []                                       TESTED (line 39)
malformed (trailing ';')          -> drops trailing empty segment             TESTED (line 33)
```
Malformed input cannot fabricate a MATCH: `aggregateCategoryFit([])` returns `'UNKNOWN'` (categoryPlausibility.ts:52, tested at test line 67), and `verifyCategoryPlausibility()` short-circuits to `[]` issues (no repair forced) when `targetSegments.length === 0` (categoryPlausibility.ts:95). Parsing is deterministic (pure function, no I/O, tested explicitly for idempotence at test line 42-45).

**D3 (evidence sufficiency).** `schema.ts`'s `superRefine` (214-241, confirmed by direct agent read) enforces at the schema level, not by convention: `fit === 'UNKNOWN'` forces `rationale: null` and `evidence: []`; `fit !== 'UNKNOWN'` forces non-null rationale and non-empty evidence. `verifyCategoryPlausibility()` (categoryPlausibility.ts:90-176) independently re-verifies evidence authenticity per MATCH/MISMATCH entry: quote length ≥ `MIN_QUOTE_CHARS`, `sourceUrl` must be one of the supplied source documents, and the quote must appear verbatim (normalised) in that document's text — fabricated or unsourced evidence is rejected and routed into the repair loop (§6), never silently accepted. `aggregateCategoryFit` only returns `MISMATCH` when *every* evaluated segment mismatches — a mix of MISMATCH+UNKNOWN yields `UNKNOWN`, not MISMATCH (test line 58-60, explicitly annotated "D3: never a default MISMATCH"). Two evidence-validation branches (quote-too-short; zero-supplied-source-documents) exist in the implementation (`categoryPlausibility.ts:138-146,151-159`) but have no direct unit test in `categoryPlausibility.test.ts` — flagged as a coverage gap, not a conformance violation, since the logic itself is present and structurally sound.

**D4 (Qualification criterion, distinct from R-71).**
```ts
// packages/core-qualification/src/types.ts:16
export const QUALIFICATION_CRITERIA = ['NEED_DETECTED', 'EVIDENCE_PRESENT', 'CATEGORY_PLAUSIBLE'] as const;
```
`evaluateCategoryPlausible()` (`rules.ts:77-108`) takes only a `StoredCategoryPlausibilityDetermination | null` — it never reads `signals`, `TOPICAL_FIELDS`, or anything R-71-adjacent. `evidenceSignalIds` is always `[]` for this criterion (by design, since the determination never becomes a `ResearchSignal`). The previously-flagged open question — whether the new criterion participates in the `NEED_DETECTED` short-circuit — is resolved explicitly; see §8.

**D5 (state behavior).**
```ts
// packages/core-qualification/src/evaluator.ts (paraphrased from agent-verified diff, lines 58-65)
const fit = input.categoryPlausibility?.aggregateResult ?? 'UNKNOWN';
const state: QualificationState = !evidencePresent.satisfied
  ? 'INSUFFICIENT_EVIDENCE'
  : fit === 'MATCH' ? 'QUALIFIED'
  : fit === 'MISMATCH' ? 'NOT_QUALIFIED'
  : 'INSUFFICIENT_EVIDENCE';
```
`QUALIFICATION_STATES` (`types.ts:9`) is unchanged — still exactly `['QUALIFIED', 'NOT_QUALIFIED', 'INSUFFICIENT_EVIDENCE']`; no new state was added, satisfying D5's letter. `packages/core-opportunity/` has **zero diff** (`git diff --stat -- packages/core-opportunity/` empty, confirmed independently by two agents) — `createOpportunityForOwner` is untouched, runs unconditionally, before Qualification is evaluated, with no data or control dependency in either direction. **MISMATCH ≠ no Opportunity; UNKNOWN ≠ no Opportunity — structurally guaranteed**, not merely by convention.

*Flagged nuance (not a violation):* MISMATCH now reuses the same `NOT_QUALIFIED` value that a `NEED_DETECTED` failure already produces — semantically conflating "no need" with "categorically implausible despite need+evidence" under one state value. This has a real second-order effect: Personalization's existing R-42 eligibility gate (`state === QUALIFIED`) means a MISMATCH will silently prevent Personalization/Outreach/Follow-up-Prep from running for an Opportunity even when `NEED_DETECTED` and `EVIDENCE_PRESENT` both passed. This consequence is not discussed in any D4–D6/D10 text reviewed. It does not violate D5 (which required no *new* state, which is honored) or any other locked decision, but is worth explicit Product Owner awareness.

**D6 (attribution).** Confirmed directly from `migration.sql`:
```sql
CREATE INDEX "category_plausibility_determinations_search_prospect_idx"
    ON "category_plausibility_determinations"("search_id", "prospect_id");   -- NOT unique — history preserved
CREATE INDEX "category_plausibility_determinations_current_by_prospect_idx"
    ON "category_plausibility_determinations"("prospect_id") WHERE "superseded_at" IS NULL;
```
`supersedePrevious(searchId, prospectId, at)` (`categoryPlausibilityPgRepository.ts:36-44`) is `WHERE search_id = $1 AND prospect_id = $2 AND superseded_at IS NULL` — scoped to **both** keys together, so a different Search's row for the same Prospect is never touched, even if such a row existed (in practice it cannot, since `Prospect` is uniquely keyed `(search_id, company_id)` per migration 0015 — a second Search rediscovering the same business produces a **different** `prospect_id`, so cross-Search collision is structurally impossible at the schema level, not merely prevented by this WHERE clause). Qualification reads via `getCurrentByProspectId(userId, prospectId)` (`categoryPlausibilityRepository.ts:54-57`, used at `core-qualification/src/service.ts:81-84`) — Candidate (2) from the pre-implementation governance chain (repository resolves internally, no new `QualificationDeps` dependency added). This relies on the same immutable-`searchId`-per-Prospect invariant, which is durable (migration 0015). **D6 is structurally satisfied**, though no integration test directly exercises "two Searches, different `targetCustomer`, on the same real-world business, both determinations independently retained" end-to-end (§17).

## 5. D7–D11 Detailed Findings

**D7 (FIELD_KIND isolation).** Directly verified: `allObservations()` (`schema.ts:321-341`) builds its `single` (`companySummary`/`businessModel`/`targetCustomers`) and `lists` (six list-type fields) tuples — `categoryPlausibility` is not one of them and does not appear in the function at all. `packages/core-research/src/persist.ts` has **zero diff** and zero references to `categoryPlausibility` (confirmed by grep sweep) — the determination never enters the `acq_lead_research`/`persist.ts` path (§15). Because the determination is never a `StoredResearchSignal` row, it is mechanically unreachable by `toOfferSignals()`'s input type regardless of any implementation detail — this is structural, not conventional, exactly as the pre-implementation readiness audit predicted.

**D8 (research input contract).** `ResearchDeps` gained `searches: SearchRepository` (required) — Candidate 2, the pre-implementation-recommended, non-binding default, directly mirroring `OpportunityDeps.searches`/`createOpportunityForOwner`. `runResearchForOwner` resolves `search = await deps.searches.getById(userId, prospect.searchId)` then `parseTargetSegments(search.parameters.targetCustomer)` (`service.ts:108-110`). This part is fully conformant.

However, `ResearchProviderInput` (`provider.ts:13-27`) gained a new optional field:
```ts
export interface ResearchProviderInput {
  prospectId: string;
  companyId: string;
  companyName: string;
  normalizedDomain: string;
  targetSegments?: readonly string[];   // new
}
```
D8's own locked text (Consolidated Scope-Lock §3, D8): *"OPTION B — PRESERVE PROVIDER-FACING CONTRACT WHERE POSSIBLE. Carry Search-scoped participant context through Research orchestration/dependencies **rather than widening `ResearchProviderInput`**."* The pre-implementation Final Implementation Readiness Audit (§6.6) independently concluded: *"`ResearchProviderInput` is explicitly the contract D8 preserves… required to change only under Option A (not selected) or… Candidate 1."* Candidate 2 (the one actually chosen, per the `ResearchDeps.searches` evidence above) was documented everywhere in the governance chain as leaving `ResearchProviderInput` **unchanged**. The implementation did not do that — it added `targetSegments?` directly to this type. See §16 for full discussion of severity. This is reported as a genuine, citable deviation, not glossed over as conforming merely because the rest of the D8 mechanism (the orchestration dependency) matches the recommended candidate.

**D9 (provider neutrality).** Both modified provider files perform pure plumbing only:
```ts
// anthropicResearchProvider.ts and fallbackResearchProvider.ts, identical one-line addition
targetSegments: [...(input.targetSegments ?? [])],
```
No branching, no category-plausibility-specific business logic in either adapter. All verdict/evidence/aggregation logic lives in `schema.ts`/`categoryPlausibility.ts`/`researcher.ts`, above `researchModelFactory.ts`'s provider-selection point — confirmed by direct inspection, not merely cited from governance docs. Neither `geminiModel.ts`/`geminiResearchProvider.ts` nor `openAIModel.ts` appears in the modified-file list at all — expected and correct under the existing architecture (these adapters never reference `ResearchProviderInput`/`ResearchInput` directly), but it also means the Gemini structured-output schema translation for the new `categorySegmentSchema` shape (`toGeminiSchema()`) was **not exercised or verified** by this implementation or this audit. This is the same item the pre-implementation governance chain flagged as "E11 — an implementation requirement to satisfy before scheduling live D11 validation, not before writing the field." It remains open. **STRUCTURAL provider neutrality: CONFIRMED. LIVE provider validation (incl. Gemini schema translation): NOT PERFORMED, NOT CLAIMED.**

**D10 (UI).** `apps/web/app/(client-finder)/opportunities/[id]/page.tsx:160-186` (paraphrased from the agent's verified diff):
```tsx
{categoryPlausibility ? (
  <section className="card">
    <h2>Category plausibility: {categoryPlausibility.aggregateResult}</h2>
    <p className="hint">Target customer (as of this Search): {categoryPlausibility.targetCustomer}</p>
    <p className="hint">Determined {categoryPlausibility.observedAt.toISOString()}</p>
    <ul className="evidence-list">
      {categoryPlausibility.segmentResults.map((segment) => ( /* segment, fit, rationale, evidence */ ))}
    </ul>
  </section>
) : null}
```
Checklist, each independently verified against the actual diff (not assumed):
```text
Opportunity detail only, no new page:        CONFIRMED (only file under .../[id]/ touched)
Aggregate MATCH/MISMATCH/UNKNOWN literal:     CONFIRMED (raw enum interpolated directly)
Per-segment results + evidence:               CONFIRMED (page.tsx:168-183)
targetCustomer visible:                        CONFIRMED (page.tsx:163-165)
Timestamp visible:                              CONFIRMED (page.tsx:166)
Qualification explanation visible:               CONFIRMED — pre-existing criteria.map() renders
                                                   CATEGORY_PLAUSIBLE automatically, no shape change
Opportunity remains independently visible:         CONFIRMED — page.tsx:90-116, unconditional,
                                                     positioned BEFORE the new section, zero data
                                                     dependency on it
No ranked-list display:                             CONFIRMED — opportunities/page.tsx (list) has
                                                     zero diff, zero references
No scoring/ranking impact:                            CONFIRMED — core-opportunity zero diff
Render-only-if-record-exists:                          CONFIRMED — {categoryPlausibility ? (...) : null},
                                                        same pattern as Score/Qualification/
                                                        Personalization/Outreach/Follow-Up sections
No misleading MISMATCH-deletes-Opportunity implication: CONFIRMED by construction (unconditional
                                                        Opportunity section, no conditional coupling)
```
**Classification: STRUCTURALLY VERIFIED** (full source read, diff traced end to end). **LIVE UI VERIFIED: NOT PERFORMED** — no browser/dev-server session was run by this audit (read-only, no live rendering attempted); this audit did not attempt to distinguish beyond static source inspection.

**D11 (validation).** See §13 (regression results) and §17 (validation limitations) for the full breakdown by validation tier (CODE-LEVEL / INTEGRATION / LIVE PROVIDER / HUMAN).

## 6. Migration 0027 Audit

Read directly and in full (`packages/db/prisma/migrations/0027_category_plausibility_determinations/migration.sql`, 79 lines):

```text
Table name:      category_plausibility_determinations
Columns:          id TEXT PK
                   search_id TEXT NOT NULL
                   prospect_id TEXT NOT NULL
                   target_customer TEXT NOT NULL
                   target_segments TEXT[] NOT NULL DEFAULT '{}'
                   aggregate_result TEXT NOT NULL  (CHECK IN ('MATCH','MISMATCH','UNKNOWN'))
                   segment_results JSONB NOT NULL
                   observed_at TIMESTAMP(3) NOT NULL
                   superseded_at TIMESTAMP(3)               (nullable — NULL = current)
                   created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
Indexes:           (search_id, prospect_id)                  — full history lookup
                   (prospect_id) WHERE superseded_at IS NULL  — "current" lookup, partial index
Foreign keys:      search_id   -> searches(id)   ON DELETE CASCADE ON UPDATE CASCADE
                   prospect_id -> prospects(id)   ON DELETE CASCADE ON UPDATE CASCADE
Uniqueness:        NONE on (search_id, prospect_id) — deliberate: allows multiple historical
                   rows per key, per D6's "historical attribution preserved" requirement
Ownership:         no user_id column — inherited via prospect_id -> prospects.user_id,
                   matching the existing DEC-008 convention (research_signals, qualifications)
```

This matches D1/D6 semantics: additive-only (numbered after 0026 per the repo's own DEC-006 convention, nothing existing altered/dropped/backfilled), keyed exactly `(search_id, prospect_id)` as both D1 and the pre-implementation readiness audit's conceptual sketch specified. The `ON DELETE CASCADE` behavior on both FKs means a hard-deleted Search or Prospect would cascade-delete its determination history — this mirrors the same cascade convention used elsewhere in the schema for Search/Prospect-scoped tables, and is not addressed one way or the other by D6's text (which discusses supersession, not hard deletion); noted as a boundary condition, not a deviation, since no Search/Prospect hard-delete feature exists in this MVP to exercise it. This migration was **not** independently confirmed as applied against a live database by this audit (no `db:migrate:deploy`/`db:migrate:dev` was run, per the audit's own read-only constraint) — the integration test suite's successful DB-backed runs (§12–§13) are indirect evidence the schema is valid and applies cleanly in the test harness, since `tests/integration` uses a real Postgres container.

## 7. Persistence & Attribution Audit

Full lifecycle traced directly from source, confirmed by two independent agents:

```text
Research call (worker.ts) -> runResearchForOwner (core-research/service.ts)
  -> deps.searches.getById(userId, prospect.searchId)                 [service.ts:108-109]
  -> parseTargetSegments(search.parameters.targetCustomer)             [service.ts:110]
  -> deps.provider.research({..., targetSegments})                     [service.ts:112-118]
  -> research.categoryPlausibility (model output, schema-validated,
     provenance- and category-verified, repaired if needed)            [researcher.ts:254-260]
  -> if (deps.categoryPlausibility) {                                  [service.ts:124]
       segmentResults = toSegmentDeterminations(targetSegments, research.categoryPlausibility)
       aggregateResult = aggregateCategoryFit(segmentResults.map(r => r.fit))
       deps.categoryPlausibility.supersedePrevious(search.id, prospect.id, now)
       deps.categoryPlausibility.save({searchId, prospectId, targetCustomer, targetSegments,
                                        aggregateResult, segmentResults}, now)
     }
  -> categoryPlausibilityPgRepository.save() -> INSERT INTO category_plausibility_determinations
  -> core-qualification/service.ts: deps.categoryPlausibility.getCurrentByProspectId(userId, opportunity.prospectId)
  -> rules.ts: evaluateCategoryPlausible(determination)
  -> evaluator.ts: folded into criteria[] and state, unconditionally (§8)
  -> apps/web/.../clientFinderRepositories.ts: createPgCategoryPlausibilityRepository(sql)
  -> core-research/service.ts: getCategoryPlausibilityDetermination(deps, userId, prospectId)
  -> page.tsx: rendered in the new section (§5, D10)
```

No duplicate or dead persistence path was found. `persist.ts`/`acq_lead_research` (the previously-inactive path named in the audit's own instructions) has **zero diff** and **zero references** to `categoryPlausibility` (confirmed by direct grep sweep across the whole repo) — category plausibility never enters that path, confirming §5's structural D7 finding from the persistence side as well. Exactly one `CategoryPlausibilityRepository` interface and one Postgres implementation exist, and both production wiring points (`apps/worker/src/index.ts:136`, `apps/web/src/server/clientFinderRepositories.ts:28`) construct and inject the same `createPgCategoryPlausibilityRepository(pool|sql)` — no duplicate repository implementation exists.

**Coverage gap, flagged:** `packages/core-research/src/service.test.ts` (the unit-test file for the exact module implementing the persistence write path) contains **zero references** to `categoryPlausibility`/`fakeCategoryPlausibilityRepository` — the `deps.categoryPlausibility` branch (`service.ts:124-141`) and the `getCategoryPlausibilityDetermination()` reader export are not exercised by any test in that file. Coverage for this exact wiring does exist at the DB-integration level for the MATCH case (`tests/integration/qualification.integration.test.ts`, passing — §13), but not for MISMATCH/UNKNOWN, and not for the `core-research` unit-test layer specifically.

## 8. Qualification / Opportunity Boundary Audit

**The `NEED_DETECTED` short-circuit question (flagged as open by two pre-implementation audits) is resolved: `CATEGORY_PLAUSIBLE` is evaluated unconditionally, on both branches of the evaluator, and does NOT participate in the short-circuit.**

```ts
// packages/core-qualification/src/evaluator.ts (verified diff, ~lines 35-68)
export function evaluateQualification(input: QualificationEvaluatorInput): QualificationEvaluation {
  const needDetected = evaluateNeedDetected(input.needDetected);
  const categoryPlausible = evaluateCategoryPlausible(input.categoryPlausibility);   // computed BEFORE the branch

  if (!needDetected.satisfied) {
    return { state: 'NOT_QUALIFIED', criteria: [needDetected, categoryPlausible], evidenceSignalIds: [] };
  }

  const evidencePresent = evaluateEvidencePresent(input.signals);
  const criteria = [needDetected, evidencePresent, categoryPlausible];
  // ... state computed per §4/D5 above
}
```
Only `EVIDENCE_PRESENT` remains skipped when `NEED_DETECTED` fails — exactly as before this feature, per the pre-implementation audit's own finding (`evaluator.ts:21-43` at baseline). `CATEGORY_PLAUSIBLE` rides along in `criteria[]` in both branches but never *promotes* a failed `NEED_DETECTED` result to `QUALIFIED` — the early-return branch is hard-coded to `NOT_QUALIFIED` regardless of `categoryPlausible`'s own verdict (line ~41-42). This is confirmed by both a dedicated unit test (`evaluator.test.ts`, asserting `criteria.length === 2` with `criteria[1].criterion === 'CATEGORY_PLAUSIBLE'` when `NEED_DETECTED` fails) and an equivalent DB-backed assertion in `tests/integration/qualification.integration.test.ts`.

**Opportunity creation boundary:** `packages/core-opportunity/` has **zero diff** across the entire package (`git diff --stat` empty, confirmed independently by two separate agents plus a direct grep for `QUALIFIED`/`TOPICAL_FIELDS` inside it, which found only an unrelated CRM-pipeline-stage comment). `createOpportunityForOwner` runs unconditionally in the worker loop, before Qualification is evaluated, with no read of `StoredQualification` or `CategoryPlausibilityRepository` anywhere in that package. **MISMATCH ≠ no Opportunity; UNKNOWN ≠ no Opportunity — this is structurally guaranteed by the absence of any code path connecting the two, not merely by the new rule's own behavior.** No new `OpportunityState`/`QualificationState` value was introduced (§4, D5).

## 9. Provider Neutrality Audit

See §5 (D9) for the full finding. Summary: **STRUCTURAL provider neutrality CONFIRMED** — both modified adapters (`anthropicResearchProvider.ts`, `fallbackResearchProvider.ts`) forward `targetSegments` verbatim with zero business logic; all semantics live in shared, provider-agnostic code (`schema.ts`, `categoryPlausibility.ts`, `researcher.ts`, `prompt.ts`), above `researchModelFactory.ts`'s sole provider-branching point. `openAIModel.ts`/`geminiModel.ts`/`openAIResearchProvider.ts`/`geminiResearchProvider.ts` are not in the modified-file list — expected, since neither references `ResearchProviderInput`/`ResearchInput` under the existing architecture. **LIVE provider validation (including Gemini's `toGeminiSchema()` translation of the new field) was NOT performed and is NOT claimed** — no live Anthropic/OpenAI/Gemini/Google Places API call was made by this audit or, so far as this audit's read-only tooling could observe, by the implementation's own test suite (all test runs used fakes/in-memory repositories or a local Postgres test container — see §13).

## 10. UI Rendering Audit

See §5 (D10) for the full checklist, independently verified against the actual diff. **Classification: STRUCTURALLY VERIFIED** (complete source-level trace); **LIVE UI VERIFIED: NOT PERFORMED** (no dev server was started or browser-rendered by this read-only audit).

## 11. Fixture Integrity Audit

| Fixture change | Legitimate (contract changed) | Mechanically adapted only | Hides a regression? | Notes |
|---|---|---|---|---|
| `core-research/testSupport.ts`: new `fakeCategoryPlausibilityRepository` | Yes | — | No | Structurally identical to the pre-existing `fakeResearchSignalRepository` pattern; append-only, supersede-then-insert |
| `core-research/service.test.ts`: new `fakeSearchRepository`/`seedSearch()` | Yes (required by `ResearchDeps.searches` becoming required) | — | No | `seedSearch()` defaults `targetCustomer` to a real, non-empty, multi-segment value (`'Restaurants, Cafes; Boutique Retailers & E-commerce Brands'`) — good hygiene, does not silently default to empty |
| `core-qualification/testSupport.ts`: new `fakeCategoryPlausibilityRepository` | Yes | Partial — only `getCurrentByProspectId` is fully implemented; `supersedePrevious`/`save`/`listBySearchAndProspect` throw `'not used by these tests'` | No — intentionally scoped, since those three methods are exercised by `core-research`'s own tests, not `core-qualification`'s | Explicit, self-documenting scoping, not a hidden gap |
| `apps/worker/worker.test.ts`: `sampleResearch()`/`qualifyingResearch()` gain `categoryPlausibility: [{fit: 'MATCH', ...}]` | Yes (required — evaluator now gates on it) | Partially mechanical (only MATCH fixtures added) | **Partial** — see below | No MISMATCH/UNKNOWN scenario exercised at this layer |
| Anthropic/fallback provider test fixtures (`sampleLeadResearch()`) gain `categoryPlausibility: []` | Yes (schema requires the field) | Mechanical | No | Purely to keep fixtures schema-valid; not asserting new behavior |
| `research.test.ts`/`search-worker.integration.test.ts`/etc.: `targetSegments: []` added to fixture objects | Yes | Mechanical | No | Keeps fixtures schema-valid |

**The previously reported R-71 `companySummary` fixture issue was explicitly investigated (§12) and found to be the confirmed, independently-reproduced root cause of all 14 integration failures — it is NOT related to any category-plausibility fixture, and no category-plausibility fixture was altered to make an R-71-related test pass.** No default/empty value was found anywhere that would cause category plausibility to silently disappear from a test scenario where it should be present — every consuming fixture either supplies a real `targetCustomer`/`categoryPlausibility` value or, where it doesn't (see next paragraph), the gap is a coverage gap, not a silently-hidden regression.

**Coverage gap, flagged (mechanical adaptation, not a hidden regression, but incomplete):** across `apps/worker/worker.test.ts` and `tests/integration/qualification.integration.test.ts`, every fixture updated for category plausibility uses a `MATCH` determination (or, in one integration test, the short-circuit/no-determination case). **No MISMATCH or UNKNOWN scenario is exercised end-to-end through the real worker pipeline or against the real Postgres repository** — that coverage exists only at the pure-function/unit level (`categoryPlausibility.test.ts`, `evaluator.test.ts`). This does not hide a regression (the unit-level logic is directly tested and passing), but it does mean the MISMATCH/UNKNOWN code paths through the actual persistence and worker-orchestration layers have less test depth than the MATCH path.

## 12. Integration Failure Audit — All 14 Failures

Independently reproduced in this task (not merely re-asserted from a prior claim), against a real Postgres test container (`acos_postgres_test`, confirmed healthy — **not** an environment/credentials blocker).

```text
Command:  cd tests && npx vitest run --config integration/vitest.config.ts
Result:   42 files run — 38 passed, 3 failed, 1 skipped
          533 tests — 506 passed, 14 failed, 13 todo
          "14" CONFIRMED EXACTLY.

Failing files:
  tests/integration/personalization.integration.test.ts        4 failed
  tests/integration/outreach-preparation.integration.test.ts    5 failed
  tests/integration/followup-preparation.integration.test.ts    5 failed
```

**Root cause, traced and independently reproduced, not inferred:** all three failing files share a `matchingResearch()` fixture whose `visibleProblems: []` is empty and relies on `companySummary` text alone to trigger a matching offer. `core-opportunity/src/adapters.ts`'s `suggestOffers()`/`toOfferSignals()` and `core-acquisition/src/offer.ts` require a matching `signal.kind`/trigger from actual observed fields, not `companySummary` text alone — this logic is **byte-identical to HEAD `5992b82`** (`git diff --stat` on both files is empty). As a result, `NEED_DETECTED` evaluates `false` (`"no need was detected (suggestOffers() found no matching offer)"`), which short-circuits Qualification straight to `NOT_QUALIFIED` — before the downstream Personalization/Outreach/Follow-up-Prep stages (which require `state === QUALIFIED`, R-42) can ever run, producing cascading `Cannot read properties of null` failures in those three files.

The category-plausibility pipeline **itself functions correctly** in these same fixtures: a `category_plausibility_determinations` row with `aggregate_result: 'MATCH'` was confirmed persisted and read back correctly, and the `CATEGORY_PLAUSIBLE` criterion evaluates `satisfied: true` — it is the pre-existing, unmodified `NEED_DETECTED` logic that fails, for reasons entirely unrelated to category plausibility. Corroborating evidence: the one integration file that *does* supply a real `visibleProblems` entry (`tests/integration/qualification.integration.test.ts`) passes all 11 of its tests, using the identical `categoryPlausibility: MATCH` fixture pattern.

```text
Classification for all 14: PRE-EXISTING.
Introduced by Path 2:      NO.
Evidence:                  core-opportunity/src/adapters.ts and core-acquisition/src/offer.ts
                            have zero diff from HEAD; the failure mode (empty visibleProblems
                            failing to trigger suggestOffers()) is reproducible independent of
                            any category-plausibility fixture or code; the one integration file
                            with a correct visibleProblems fixture passes cleanly with the same
                            category-plausibility wiring.
```

## 13. Regression Test Results

| Suite | Command | Result |
|---|---|---|
| `packages/core-research` | `vitest run` | **PASS** — 12 files, 243/243 tests |
| `packages/core-qualification` | `vitest run` | **PASS** — 2 files, 30/30 tests |
| `apps/worker` | `vitest run` | **PASS** — 5 files, 185/185 tests |
| `packages/core-discovery` | `vitest run` | **PASS** — 3 files, 25/25 tests (unrelated pre-existing diff, §14 — still green) |
| `packages/core-ai-usage` | `vitest run` | **PASS** — 2 files, 17/17 tests |
| `tests/integration` (full suite) | `vitest run --config integration/vitest.config.ts` | **38/42 files pass, 506/533 tests pass, 14 fail (§12, all PRE-EXISTING), 13 todo, 1 skipped** |
| Repo-wide `typecheck` | — | **NOT RUN** — targeted package-level test suites above were sufficient evidence per this audit's own efficiency mandate; a repo-wide typecheck was not independently necessary to answer any open conformance question, so it was not run. Reported as NOT RUN, not converted to PASS. |
| Repo-wide `lint` | — | **NOT RUN** — same rationale. |

500 unit tests across five packages, plus 506 integration tests, all green. Zero regressions attributable to Path 2 were found anywhere in this suite.

## 14. Discovery / R-71 / Scoring Boundary Audit

**Discovery:** No category-plausibility logic added. `googlePlacesProvider.ts` (query construction) is not in the modified-file list at all. The one `core-discovery` diff present (`service.ts`/`service.test.ts`) is an unrelated, pre-existing "Discovery-Query Audit" observability change: it adds one field, `candidatesReceived: number`, to `DiscoveryRunResult`, and is consumed only by an unrelated `console.log({event: 'discovery.completed', ...})` line added to `worker.ts`. No reference to `targetCustomer`, `CategoryPlausibilityRepository`, or any D-numbered Path 2 concept exists in this diff — confirmed by direct read of both files. This matches the governance chain's own note that this diff predates and is unrelated to Path 2 implementation.

**R-71:** `grep -rn "TOPICAL_FIELDS|toOfferSignals|suggestOffers"` confirms these symbols exist only in their expected defining locations (`packages/core-opportunity/src/adapters.ts`, `packages/core-acquisition/src/offer.ts`) — and `git diff --stat` on both files is **empty**. Zero changes to `TOPICAL_FIELDS`, `toOfferSignals()`, `suggestOffers()`, or Need Detection semantics of any kind.

**Scoring/Ranking:** `grep -rn "FACTOR_WEIGHTS|scoreOpportunity|rankOpportunities"` confined to `packages/core-opportunity/src/*`; `git diff --stat -- packages/core-opportunity/` is **empty** across the entire package. No category-plausibility contribution to factor weights, score, ranking, or opportunity ordering anywhere in this diff.

**Opportunity Creation:** Confirmed in §8 — structurally decoupled, zero diff to `core-opportunity`, `createOpportunityForOwner` unconditional. `MISMATCH ≠ no Opportunity`, `UNKNOWN ≠ no Opportunity`, and no new Opportunity state was introduced.

## 15. Scope Expansion / Dead-Code Audit

```text
grep -rn "categoryPlausibility|CategoryPlausibility|category_plausibility" across packages/ apps/:
  All hits confined to the expected file set (core-research's categoryPlausibility*.ts /
  schema.ts / provenance.ts / repair.ts / researcher.ts / prompt.ts / service.ts / index.ts /
  testSupport.ts / tests; core-qualification's types.ts / rules.ts / evaluator.ts / service.ts /
  index.ts / testSupport.ts / tests; apps/worker's index.ts / worker.ts / worker.test.ts;
  apps/web's clientFinderRepositories.ts and opportunities/[id]/page.tsx; migration 0027;
  tests/integration/*).
  ONE extra hit: apps/worker/dist/searchWorker/worker.d.ts — a compiled TypeScript build
  artifact (from `tsc`), gitignored/untracked, not part of the source diff. Not a scope
  violation of the reviewed change; noted for completeness only.

TODO/FIXME/XXX in categoryPlausibility*.ts, rules.ts, evaluator.ts, worker.ts: NONE FOUND.

CategoryPlausibilityRepository: exactly ONE interface definition
  (categoryPlausibilityRepository.ts:15) and ONE Postgres implementation
  (categoryPlausibilityPgRepository.ts:34) — no duplicate repository, and both are
  actually wired into production (apps/worker/src/index.ts, clientFinderRepositories.ts),
  not dead code.

persist.ts / acq_lead_research: zero diff, zero category-plausibility references — confirmed
  not routed through the old path (§7).

Files modified outside the expected scope (packages/core-acquisition, packages/core-identity,
  packages/core-entitlements): NONE — confirmed via git diff --name-only against the full
  47-file list.
```

No accidental scope expansion was found anywhere.

## 16. Deviations and Non-Conformances

This section states, without softening, every deviation found:

1. **D8 — `ResearchProviderInput` was widened (PARTIALLY CONFORMING).** `provider.ts:13-27` adds an optional `targetSegments?: readonly string[]` field. D8's locked text says Option B should carry context "through Research orchestration/dependencies **rather than widening `ResearchProviderInput`**," and the pre-implementation Final Implementation Readiness Audit independently concluded this type should stay unchanged under the chosen Candidate 2. The implementation's own code comment (per the agent's citation of `provider.ts:15-25`) explicitly frames this as a deliberate D8/Option-B choice and argues Candidate 1 (a second `.research()` parameter, which would change the method's arity) was rejected in favor of this additive field instead. Weighing both sides: the field is optional, backward-compatible, does not change `.research()`'s arity, and both provider adapters treat it as pure pass-through data with zero business logic (§9) — so it does not compromise D9's provider-neutrality guarantee in practice. But it is, textually, exactly the thing D8's locked decision named as the alternative to avoid. This is reported as a genuine deviation from the locked text, not waved through because the surrounding architecture is otherwise sound.
2. **D9 — Gemini schema-translation verification (UNVERIFIED, not a violation).** No test or code inspected by this audit exercises `toGeminiSchema()`'s translation of the new `categorySegmentSchema`/`categoryPlausibility` field. This was already flagged in the pre-implementation governance chain as a non-blocking, pre-live-validation requirement (E11) — it remains open, and this audit did not close it (no live Gemini call was made, consistent with the audit's own read-only/no-live-API-call constraint).
3. **D5 — MISMATCH/`NOT_QUALIFIED` state reuse (flagged nuance, not a violation).** See §4 — a real downstream effect on Personalization's R-42 eligibility gate, undocumented in the D4–D6/D10 governance text, worth explicit Product Owner sign-off.
4. **Test-coverage gaps (not conformance violations):**
   - `core-research/service.test.ts` does not exercise the `deps.categoryPlausibility` persistence branch or `getCategoryPlausibilityDetermination()`.
   - `categoryPlausibility.test.ts` does not directly test the "quote too short" or "zero supplied source documents" branches of `verifyCategoryPlausibility()`.
   - No MISMATCH/UNKNOWN scenario is exercised end-to-end through the real worker pipeline or against the real Postgres repository (only MATCH and the null/short-circuit case are, at that level).
   - `parseTargetSegments()`'s interior/leading double-delimiter behavior is untested directly (though correct by construction).
5. **`prompt.ts` — the existing "supplied by the operator, not verified by you… treat as INFERRED at best" caveat sentence for `industry`/`location` was not textually extended to the new `targetSegments` block, even though it is spliced in immediately after it.** The segments block carries its own, arguably stronger, evidence discipline via a dedicated `SYSTEM_PROMPT` addition, so this is not necessarily a weaker guarantee — but it is not a literal reuse of the pattern D8's governance text anticipated, and is reported as a citable, judgment-call-requiring observation rather than silently resolved either way.

No other deviation was found. Every hard boundary (D0 MVP scope, D7 `FIELD_KIND` isolation, R-71, scoring/ranking, Discovery, Opportunity-state machine) is intact with zero code diff to the relevant boundary files, independently confirmed by two separate audit agents plus this document's own direct source reads.

## 17. Validation Limitations

```text
CODE-LEVEL VALIDATION:    PERFORMED. 500 unit tests across 5 packages, all green (§13).
INTEGRATION VALIDATION:   PERFORMED. 506/533 integration tests green against a real
                          Postgres container; 14 failures independently reproduced and
                          traced to a pre-existing, unrelated root cause (§12).
LIVE PROVIDER VALIDATION: NOT PERFORMED. No live Anthropic/OpenAI/Gemini/Google Places
                          API call was made by this audit (consistent with its own
                          read-only, no-live-API-call constraint) or observed to have
                          been made by any test in the suites run (all use fakes/in-memory
                          repositories or a local Postgres test container).
HUMAN VALIDATION:         NOT PERFORMED, NOT IN SCOPE of this audit. No evidence of a
                          D11-C/H participant session was reviewed or is claimed.
```

Additional specific gaps, distinguished from outright failures:
- The D6 "two Searches, different `targetCustomer`, same real-world business, both determinations independently retained" scenario is structurally guaranteed by the schema (§6/§4) but was not directly exercised by an integration test in this diff.
- The D9 Gemini schema-translation item (§16.2) remains unverified.
- MISMATCH/UNKNOWN determination states were not exercised end-to-end at the worker/Postgres-integration layer (§11/§16.4).

No claim of live validation is made anywhere in this document, consistent with the audit's constraints.

## 18. Final Classification

```text
CONFORMING WITH NON-BLOCKING NOTES
```

- **Product conformance:** D0–D7 and D10 are fully conforming to their locked text, with implementation choices for every previously-open, non-blocking engineering question (D2's splitting rule, D8's candidate, D6's Qualification-read mechanism, the short-circuit position, the `QualificationState` mapping) resolved sensibly, consistently, and traceably to source. D5 is conforming with one flagged nuance (state-value reuse) worth explicit sign-off. D6 is conforming, structurally guaranteed, with one attribution scenario untested at the integration level. D8 is **partially conforming** — the orchestration-dependency mechanism matches the recommended candidate, but `ResearchProviderInput` was widened in a way the locked text explicitly names as the alternative to avoid (§16.1). D9 and D11 are conforming as to everything performable in a read-only, no-live-API audit, with explicit, named gaps in live/Gemini validation and MISMATCH/UNKNOWN end-to-end test depth.
- **Architecture conformance:** Every hard boundary (D7 `FIELD_KIND` isolation, R-71, scoring/ranking, Discovery, Opportunity-state machine) is intact with zero diff to the relevant files — independently confirmed by two separate audit agents and this document's own direct reads. No accidental scope expansion was found anywhere in the repository.
- **Regression status:** Zero regressions attributable to Path 2. 500 unit tests + 506 integration tests green. All 14 pre-existing integration failures were independently reproduced, traced, and confirmed unrelated to Path 2 (root cause: an R-71/`suggestOffers()` fixture gap in three files, unmodified by this diff).
- **Validation status:** Code-level and DB-integration validation are complete and green. Live-provider and human validation were not performed and are not claimed, consistent with this audit's read-only constraints and with D11-I's own environment-readiness framing.

## 19. Required Follow-Up Actions

Reported for Product Owner/engineering awareness — **no action was taken on any of these by this audit**, per its read-only, audit-only mandate:

1. Decide whether the `ResearchProviderInput` widening (§16.1) requires remediation (e.g., moving `targetSegments` into a `ResearchDeps`-level-only mechanism) or should be retroactively accepted as within D8's "where possible" latitude.
2. Confirm Gemini's `toGeminiSchema()` correctly translates the new `categorySegmentSchema` shape before any live D11 validation session is scheduled (this was already flagged pre-implementation as E11; it remains open post-implementation).
3. Confirm whether MISMATCH's reuse of `NOT_QUALIFIED` (and its consequent effect on Personalization/Outreach/Follow-up-Prep eligibility via R-42) is an accepted, intended consequence.
4. Consider adding: a MISMATCH/UNKNOWN worker-level or Postgres-integration-level test; unit tests for `verifyCategoryPlausibility()`'s "quote too short" and "zero supplied source documents" branches; a `core-research/service.test.ts` test for the `deps.categoryPlausibility` persistence branch and `getCategoryPlausibilityDetermination()`; an integration test for the D6 two-Search/different-`targetCustomer` attribution scenario.
5. The 14 pre-existing integration failures (§12) are unrelated to Path 2 and were already failing before this feature — they are not a Path 2 follow-up item, but remain an open, pre-existing gap in the R-71/`suggestOffers()` fixture set worth separate remediation.
6. Schedule the live-provider and human-participant D11 validation session once the funded-provider environment precondition (flagged pre-implementation as D11-I) is resolved — not evidenced as resolved or unresolved by this audit, since it was out of scope for read-only source/test inspection.

## 20. Repository Safety Final Check

```bash
git rev-parse HEAD
git status --short | wc -l
git diff --cached --name-only
git diff --stat
```

**Result (run at the end of this task):**
```text
HEAD:                           5992b82b9adff492c480442d68a954f2a03bfb28   (UNCHANGED)
git status --short line count:  91   (IDENTICAL to the count captured at task start)
git diff --cached --name-only:  (empty — nothing staged, start and end)
git diff --stat:                47 files changed, 1119 insertions(+), 59 deletions(-)
                                 (IDENTICAL to the stat captured at task start)
```

**Confirmed:**
```text
HEAD unchanged:                                   YES (5992b82b9adff492c480442d68a954f2a03bfb28)
All pre-existing modified files unchanged:        YES (diff stat identical start-to-end; every
                                                   file read by this audit was read-only, never
                                                   edited)
No files other than this audit document created
  or modified by this task:                        YES — the only file this task wrote is
                                                    requirement/PATH_2_CATEGORY_PLAUSIBILITY_
                                                    POST_IMPLEMENTATION_CONFORMANCE_AUDIT.md
Nothing staged:                                    YES (none, start and end)
No commit created:                                 YES (none)
No push occurred:                                  YES (none)
No fixture, test, migration, PRD, or governance
  document was modified:                            YES (0 — all reads were read-only; one
                                                     background audit task ran a standalone
                                                     reproduction script and ephemeral throwaway
                                                     Postgres database entirely OUTSIDE the repo,
                                                     in the session scratchpad directory, dropped
                                                     by the script itself — no repo file was
                                                     written, edited, staged, or committed by it)
No live Anthropic/OpenAI/Gemini/Google Places
  API call was made:                                 YES (0)
No database migration command was run:                YES (0 — no db:migrate:dev/deploy)
```

## STOP CONDITION

`requirement/PATH_2_CATEGORY_PLAUSIBILITY_POST_IMPLEMENTATION_CONFORMANCE_AUDIT.md` has been produced and repository safety has been verified (§20). No fix was applied to any of the 14 integration failures or any other finding. No fixture, migration, code, test, PRD, or governance document was modified. No live provider validation was performed or claimed. Nothing was staged, committed, or pushed. This is the sole deliverable of this task.
