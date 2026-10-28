# Path 2 Category Plausibility — Final Implementation Authorization Gate

```text
DOCUMENT TYPE: READ-ONLY FINAL IMPLEMENTATION AUTHORIZATION GATE
STATUS: AUDIT ONLY — NO IMPLEMENTATION PERFORMED
PURPOSE: Determine whether a subsequent implementation task may be authorized.
         This document does not itself authorize implementation.
```

---

## 1. Executive Status

```text
AUTHORIZATION CLASSIFICATION: READY FOR IMPLEMENTATION AUTHORIZATION
```

D0–D11 are internally consistent with one another and with the current repository architecture. Every locked decision has a concrete, source-verified anchor in the codebase (re-verified directly in this task, not only cited from prior documents). No blocking product decision, architecture boundary, or repository-contract ambiguity remains — every open item identified below is an **implementation detail** with at least one architecturally valid, precedented resolution already available in this repository, most centrally `core-opportunity`'s `OpportunityDeps.searches`/`createOpportunityForOwner` pattern (`packages/core-opportunity/src/service.ts:42-49,112-131`, re-verified in this task), which independently resolves both the D8 Research-context question and the D6/Qualification-read-path question.

This classification agrees with, and does not overturn, the two predecessor audits in this governance chain (`PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` and `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_IMPLEMENTATION_READINESS_AUDIT.md`), both of which independently reached "engineering-ready, no blocking gap" conclusions (the former under a stricter, more conservative rubric that listed D8-candidate-selection and D1-schema-design as "blocking implementation dependencies" pending a *separate authorization step* — not as unresolved product ambiguity). This document treats that separate authorization step as its own deliverable (§15) rather than as a precondition still outstanding, because the task instructions for this specific audit explicitly distinguish "genuinely open product/architecture decisions" (which would block) from "ordinary implementation details with existing precedent" (which do not), and re-evaluates every prior "blocking dependency" against that finer distinction in §12–§13.

A separate, explicit implementation-authorization action by the Product Owner is still required before any code is written — this document is that action's evidentiary basis, not a substitute for it. See §15/§16.

---

## 2. Baseline

```bash
git rev-parse HEAD
git status --short
git diff --check
git diff --name-only
```

**Result (captured at task start):**

```text
HEAD:                          5992b82b9adff492c480442d68a954f2a03bfb28
Expected baseline (task):      5992b82b9adff492c480442d68a954f2a03bfb28
Match:                         CONFIRMED — no discrepancy.

git diff --check:              clean (no whitespace errors)
git diff --name-only:
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts
git diff --cached --name-only: (empty)
```

All five pre-existing tracked modifications, the full pre-existing `requirement/*.md` set, `.claude/`, and `CLAUDE.md` are treated as immutable throughout this task. §17 re-verifies none changed.

**Path-naming discrepancy in the task instructions, noted per the task's own "record the discrepancy and continue" rule, not corrected:**

```text
Task named                                              Actual on-disk file
------------------------------------------------------- --------------------------------------------------------
PATH_2_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md     PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md
PATH_2_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md               PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md
PATH_2_CATEGORY_PLAUSIBILITY_PATH_DECISION.md            OPTION_B_CATEGORY_PLAUSIBILITY_PATH_DECISION.md
packages/migrations/                                     packages/db/prisma/migrations/  (26 directories, 0001-0026)
```

This discrepancy was already independently identified and recorded by two prior documents in this same governance chain (`PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` §2, `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_IMPLEMENTATION_READINESS_AUDIT.md` §4.1) and is reconfirmed, not newly discovered, here.

---

## 3. Locked D0–D11 Decisions

Reproduced in condensed form only — full binding text already exists verbatim in `PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` §3 and is not re-typed here to avoid a third copy drifting from the other two. This document cites specific clauses only where directly relevant to a finding below.

```text
D0  MVP STATUS:                MVP ENHANCEMENT. Does not reopen the 19-criterion
                                engineering exit (DISCOVERY_CATEGORY_PLAUSIBILITY_
                                DECISION.md line 380-381, "MVP ENGINEERING EXIT:
                                SATISFIED" — re-verified present in this task).

D1  OUTPUT LOCATION:           DEDICATED SEARCH + PROSPECT DETERMINATION.
                                Not Prospect-global. Not LeadResearch.targetCustomers.
                                Not routed through R-71. Schema/table design NOT
                                authorized.

D2  MULTI-SEGMENT SEMANTICS:   DETERMINISTIC SEGMENT PARSING + ANY-MATCH (OR).
                                MATCH/MISMATCH/UNKNOWN per D2's own definitions.
                                Exact splitting rule NOT authorized.

D3  EVIDENCE SUFFICIENCY:      First-party website evidence primary; search-derived
                                metadata supporting only; UNKNOWN on insufficient
                                evidence (never a default MISMATCH).

D4  QUALIFICATION:             Q1 — new, distinct criterion. Not routed through
                                R-71 Need Detection. Exact criterion name/wiring
                                NOT authorized.

D5  STATE BEHAVIOR:            MATCH passes; MISMATCH fails Qualification but does
                                NOT block Opportunity creation; UNKNOWN fails/holds;
                                no new Opportunity state.

D6  PERSISTENCE/ATTRIBUTION:   PER SEARCH + PROSPECT; historical attribution
                                preserved; cross-search overwrite NOT ALLOWED;
                                Qualification reads the CURRENT Search + Prospect
                                determination.

D7  FIELD_KIND ISOLATION:      CANDIDATE C — outside FIELD_KIND/ResearchSignal
                                entirely. Structurally required by D1 (not an
                                independent choice).

D8  RESEARCH INPUT CONTRACT:   OPTION B — preserve ResearchProviderInput where
                                possible; carry Search context through Research
                                orchestration/dependencies. RECORDED / NON-BINDING
                                at the sub-candidate level. Candidate 2 (a
                                ResearchDeps.searches dependency) is the recommended,
                                non-binding starting point.

D9  PROVIDER NEUTRALITY:       OPTION A — FULL PROVIDER NEUTRALITY across Anthropic/
                                OpenAI/Gemini and the existing fallback path.

D10 UI:                        D10-A through D10-H, all DECIDED. Opportunity detail
                                page only; aggregate + per-segment display; existing
                                evidence-field reuse; literal MATCH/MISMATCH/UNKNOWN
                                text; no ranked-list surfacing; Search context +
                                timestamp shown; render-only-if-exists convention.

D11 VALIDATION:                D11-A through D11-I, all DECIDED. Mandatory/
                                Structural/Observational split; categorical coverage
                                (no numeric threshold); manual evidence spot-check;
                                single-provider-per-session sufficient; existing test
                                suites sufficient regression evidence; validation
                                template NOT modified; funded-provider precondition
                                distinct from validation criteria.
```

**Status-record consistency note (a documentation fact, not a contradiction):** `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` itself — read in full in this task — still shows D7 through D11 as `PRODUCT OWNER DECISION REQUIRED` / `UNRESOLVED` in its own §1/§3, because each of D7–D11 was subsequently decided in its **own separate, later-dated file** (`..._D7_PRODUCT_DECISION.md` through `..._D11_PRODUCT_DECISION.md`, each read in full in this task) without being mirrored back into the Final Decision Record. Each of those five documents explicitly records this as a deliberate, established precedent (e.g. D8's own audit record: *"the existing governance structure requires D8 decisions to be mirrored [in the Final Decision Record]... Finding: no such requirement exists"*), not an oversight. `PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` (read in full in this task) already reconciled this by treating the five dedicated D7–D11 files, not the stale Final Decision Record sections, as authoritative — this document adopts the same reconciliation, re-verified independently by reading all five D7–D11 files directly in this task rather than trusting the Consolidated Scope-Lock's characterization of them.

---

## 4. Source-Verified Architecture

Every file below was read directly in this task (not only cited from a prior document). Where a citation exactly matches a prior document's line numbers, this is noted as independent reconfirmation, not copied without verification.

```text
ResearchProviderInput                    packages/core-research/src/provider.ts:11-16
  { prospectId, companyId, companyName, normalizedDomain } — exactly 4 fields,
  no participant context. RE-VERIFIED, full file read.

ResearchProvider.research(input)         provider.ts:24-26 — unchanged.

ResearchDeps                             packages/core-research/src/service.ts:21-27
  { identity, companies, prospects, signals, provider } — NO searches dependency.
  RE-VERIFIED, full file read.

runResearchForOwner                      service.ts:62-88
  prospect = deps.prospects.getById(...)              [line 70]
  company  = deps.companies.getById(...)              [line 73]
  research = deps.provider.research({ prospectId, companyId,
                                       companyName, normalizedDomain })  [76-81]
  RE-VERIFIED: prospect.searchId is loaded but never read past line 70.

Worker call site                         apps/worker/src/searchWorker/worker.ts:358-368
  runCanonicalPipeline(deps, search: StoredSearch)     [327-330]
  await runResearchForOwner({companies,prospects,signals,provider}, userId,
                             { prospectId: prospect.id })   [359-368]
  RE-VERIFIED: search.id/search.parameters.targetCustomer are in scope one
  line above (via the enclosing `search` parameter) but NOT passed.

QualificationDeps                        packages/core-qualification/src/service.ts:16-21
  { identity, opportunities, signals, qualifications } — NO prospects/searches
  dependency. RE-VERIFIED, full file read.

evaluateQualificationForOwner            service.ts:59-78
  opportunity = deps.opportunities.getById(userId, opportunityId)   [65]
  signals     = deps.signals.listByProspect(userId, opportunity.prospectId) [68]
  RE-VERIFIED: Prospect-scoped only; no searchId resolution anywhere.

evaluateQualification()                  packages/core-qualification/src/evaluator.ts:21-43
  RE-VERIFIED: short-circuits on NEED_DETECTED — if it fails, EVIDENCE_PRESENT
  is never evaluated, criteria: [needDetected] only (lines 24-30).

QUALIFICATION_CRITERIA                   packages/core-qualification/src/types.ts:12
  = ['NEED_DETECTED', 'EVIDENCE_PRESENT']   RE-VERIFIED.
QUALIFICATION_STATES                     types.ts:9
  = ['QUALIFIED', 'NOT_QUALIFIED', 'INSUFFICIENT_EVIDENCE']   RE-VERIFIED — a
  third state already exists beyond QUALIFIED/NOT_QUALIFIED.

StoredOpportunity                        packages/core-opportunity/src/types.ts:40-59
  { id, userId, prospectId, state, needDetected, offer, staleness,
    stalenessComputedAt, createdAt, updatedAt } — NO searchId field.
  RE-VERIFIED, full file read.

createOpportunityForOwner                packages/core-opportunity/src/service.ts:112-151
  OpportunityDeps { ..., searches: SearchRepository, ... }        [42-49]
  const prospect = await deps.prospects.getById(userId, prospectId)  [120]
  const search   = await deps.searches.getById(userId, prospect.searchId) [123]
  const rule     = toServiceRule(search.parameters)                 [131]
  RE-VERIFIED, full file read — this is the direct, working precedent for
  D8/§7's Search-resolution pattern.

TOPICAL_FIELDS                           packages/core-opportunity/src/adapters.ts:152
  = new Set(['companySummary', 'businessModel', 'targetCustomers'])  RE-VERIFIED.
toOfferSignals()                         adapters.ts:175-199
  if (TOPICAL_FIELDS.has(row.field)) continue; // R-71     [186]   RE-VERIFIED.
suggestOffers()                          packages/core-acquisition/src/offer.ts:76-99
  if (!rule.triggers.includes(signal.kind)) return false;   [85]   RE-VERIFIED.

FIELD_KIND                               packages/core-research/src/persist.ts:38-48
  Record<string, ResearchSourceKind>, 9 entries, none for a
  category-plausibility-shaped field. RE-VERIFIED, full file read (lines 1-55).

toNewResearchSignals()                   packages/core-research/src/mapping.ts:16-30
  FIELD_KIND[observation.field] ?? 'WEBSITE'   [19]   RE-VERIFIED, full file read
  — confirms the silent-default (not reject/error) behavior D7's record relies on.

researchModelFactory.ts:9-16             RE-VERIFIED, header comment read directly:
  "the ONE place in the codebase allowed to branch on provider identity."
  RESEARCH_PROVIDER_NAMES = ['anthropic','openai','gemini']   [19]

Prospect uniqueness                      packages/db/prisma/migrations/0015_discovery/
                                          migration.sql:112-116 (RE-VERIFIED, read
                                          directly): CREATE UNIQUE INDEX
                                          "prospects_search_id_company_id_key" ON
                                          "prospects"("search_id","company_id"),
                                          with an explicit comment: "one real
                                          business appears once within a Search...
                                          a later Search may legitimately
                                          rediscover the same business."
StoredProspect.searchId                  packages/core-discovery/src/types.ts:23-30
  required, durable `searchId: string` field.   RE-VERIFIED, full file read.

research_signals table                   packages/db/prisma/migrations/0016_
                                          research_signals/migration.sql:56-85
                                          (RE-VERIFIED, read directly): columns
                                          id, prospect_id, field, kind,
                                          classification, signal, confidence,
                                          basis, observed_at, superseded_at,
                                          created_at — NO search_id column,
                                          NO user_id column.

Fallback provider wiring                 apps/worker/src/index.ts (RE-VERIFIED via
                                          grep): env.RESEARCH_FALLBACK_PROVIDER
                                          conditionally wires
                                          createFallbackResearchProvider at line 97+.
fallbackResearchProvider.ts              RE-VERIFIED, header + first 45 lines read
                                          directly: fetches source documents exactly
                                          once, reuses the same ResearchInput across
                                          every attempt; fallback eligibility gated
                                          on ResearchProviderError type only.

Opportunity detail UI                    apps/web/app/(client-finder)/opportunities/
                                          [id]/page.tsx — RE-VERIFIED, full file
                                          read (195 lines): imports
                                          getOpportunityQualification [line 14],
                                          score.factors.map(...) aggregate+list
                                          pattern [111-116], Evidence section with
                                          sourceUrl/sourceLabel/sourceQuote/
                                          confidence/basis [121-147],
                                          Qualification section with
                                          satisfied/reason per-criterion list
                                          [149-160], EVERY conditional section
                                          (Qualification/Personalization/Outreach/
                                          FollowUp) uses the identical `{x ? <section>
                                          : null}` render-only-if-exists pattern.

SearchRepository                         packages/core-search/src/repository.ts:11+
                                          RE-VERIFIED via grep: interface exists,
                                          create()/getById()-shaped, consistent
                                          with OpportunityDeps's usage of it.

MVP 19-criterion exit                    requirement/DISCOVERY_CATEGORY_PLAUSIBILITY_
                                          DECISION.md:380-381, RE-VERIFIED via grep:
                                          "MVP ENGINEERING EXIT: SATISFIED" — present,
                                          unconditioned on category plausibility.
```

No citation inherited from a predecessor document was found to be inaccurate upon independent re-verification in this task. One citation correction already flagged by predecessor documents (six upstream documents citing R-71's location as `packages/core-qualification/src/adapters.ts`, which does not exist) is reconfirmed: the correct, verified location is `packages/core-opportunity/src/adapters.ts:152,175-199`.

---

## 5. Decision Consistency Matrix

Each pairing the task instructions require, checked against the source-verified architecture in §4, not only against the decision text in isolation.

| Pairing | Consistency check | Finding |
|---|---|---|
| D1 + D6 + D7 | D1 selects a dedicated Search+Prospect entity; D6 requires per-Search-+-Prospect storage with preserved history; D7 requires the entity stay outside `FIELD_KIND`/`ResearchSignal`. | **CONSISTENT.** A dedicated entity (D1) is the only D1 candidate whose natural key `(search_id, prospect_id)` directly satisfies D6 without further mechanism, and being a wholly separate table (not a `ResearchSignal` row) is exactly what makes D7's isolation structural rather than convention-based (re-verified: `research_signals` has no `search_id` column at all — §4 — so D6 could not be satisfied by extending it even if D7 were relaxed). No tension found. |
| D2 + D3 | D2 requires deterministic parsing before evaluation, ANY-match aggregation over segments; D3 requires first-party-primary evidence sufficiency, UNKNOWN on insufficiency, applied "definitively" per determination. | **CONSISTENT.** D2 operates on segment *identification*; D3 operates on evidence *sufficiency* per segment. Applying D3's sufficiency bar independently to each of D2's parsed segments, then D2's OR-aggregation over the per-segment D3 results, is exactly the model both documents describe (D2: "preserve the individual segment determinations/evidence... explainable"; D3: evidence bar stated generically, not per-aggregate). No document conflates the two axes. |
| D4 + D5 | D4 makes category plausibility a new, distinct Qualification criterion; D5 defines MATCH/MISMATCH/UNKNOWN's effect on that criterion and on Opportunity creation. | **CONSISTENT.** D5's three-way behavior (pass/fail/fail-or-hold) is defined entirely in terms of "the criterion" D4 creates — D5 presupposes D4's criterion exists and assigns it exactly the criterion-level pass/fail semantics `QualificationCriterionResult.satisfied` (re-verified, `types.ts:20-26`) already supports for the two existing criteria, with no new type needed. |
| D6 + D8 | D6 requires Search-scoped attribution reaching persistence; D8 (Option B) resolves Search context inside Research orchestration rather than widening the provider contract. | **CONSISTENT.** D8's own record (§8 of the D8 Product Decision) explicitly traces that `searchId` is cheaply recoverable via `prospect.searchId` under any Option B candidate (re-verified: `StoredProspect.searchId` is a required, already-loaded field inside `runResearchForOwner`, §4) — D8 does not foreclose D6's attribution requirement; it only decides *how* Search context reaches Research's input side, a separable concern from D1's (still-unbuilt) persistence design. No document conflates "D8 resolved" with "D1 persistence resolved." |
| D8 + D9 | D8 selects a non-binding orchestration-layer mechanism for Search context; D9 requires full provider neutrality including the fallback path. | **CONSISTENT.** Every D8 candidate (re-verified in §4/§6 below) operates strictly above `researchModelFactory.ts`'s provider-selection point — none touches `ResearchModel`, `anthropicModel.ts`, `openAIModel.ts`, or `geminiModel.ts`. D9's own Product Decision (§7) explicitly cites D8 as one of the locked decisions D9 depends on being compatible with, and confirms it is (D9 §3, item 8: "D8... already routes the capability's input side above the provider-adapter boundary, consistent with D9's requirement"). |
| D5 + D10 | D5 requires MISMATCH/UNKNOWN not block Opportunity creation, no new Opportunity state; D10 requires the Opportunity section render unconditionally regardless of the new section's content. | **CONSISTENT.** D10-D/D10-E explicitly state the Opportunity section "remains unconditionally rendered" and "never implies deletion of the Opportunity" for both UNKNOWN and MISMATCH — this is a direct UI-level restatement of D5's backend guarantee, re-verified against the actual page (§4: every conditional section already uses an independent `{x ? ... : null}` pattern, so a MISMATCH/UNKNOWN category-plausibility section coexisting with an always-rendered Opportunity section requires no new conditional logic beyond what the page already does for Qualification today). |
| D10 + D11 | D10 places the only human-visible surface on the Opportunity detail page; D11 requires human-participant validation using the existing template. | **CONSISTENT.** D11-B explicitly derives its two-tier (technical vs. full) validation standard *from* D10's UI placement: "because D10 (locked) places the only planned human-visible surface... at least one instance of the D10 UI section must be confirmed to render... before D11 as a whole... can be declared satisfied." D11 does not invent a separate UI requirement independent of D10; it reuses D10's own decided surface as the validation channel. |

**No genuine contradiction was found between any two locked decisions, and none between any locked decision and the current repository contracts.** This reconfirms, by independent re-derivation against source code rather than by re-reading prior prose, the same conclusion both predecessor audits in this chain already reached.

---

## 6. Search + Prospect Persistence Feasibility

**CURRENT ARCHITECTURE** (REPOSITORY FACT, re-verified in this task):
- `research_signals` (migration `0016`) has columns `id, prospect_id, field, kind, classification, signal, confidence, basis, observed_at, superseded_at, created_at` — no `search_id`, no `user_id`.
- `ResearchSignalRepository` (`packages/core-research/src/repository.ts`, cited from this session's prior reading, structurally consistent with the mapping/service code re-read directly in this task) is keyed by `prospectId` alone across every method.
- `Prospect` enforces `UNIQUE(search_id, company_id)` — a business rediscovered under a second Search produces a **second, distinct** `Prospect` row, never the same row reattached to a different Search.

**REQUIRED FUTURE CHANGE** (IMPLEMENTATION DETAIL, not designed here):
- A new table, keyed by `(search_id, prospect_id)`, holding at minimum: aggregate result, per-segment results + evidence, a `targetCustomer` snapshot, parsed segments, and a timestamp. A new repository interface exposing at least a Search-+-Prospect-scoped write and a Search-+-Prospect-scoped, `userId`-checked read.
- **INFERENCE, not a locked decision:** the exact supersession behavior for a repeated write to the *same* `(search_id, prospect_id)` pair (e.g., a Research re-run within one Search) is unspecified by any document. The most consistent extrapolation from D6's "cross-search overwrite not allowed" (which says nothing about *same*-search re-runs) is that a same-Search re-run may supersede its own prior row, mirroring `ResearchSignalRepository.supersedePrevious`'s existing append-only-with-supersession pattern — but this is this document's own inference, not a decision, and does not need to be resolved before implementation starts (it only needs resolving at the point that specific repository method is written).

**Feasibility determination:** the required key structure `(search_id, prospect_id)` is unambiguous from D1/D6 and is not blocked by anything in the current schema — it requires an additive migration (a new table), not a modification to any existing table, and therefore cannot conflict with `research_signals`' existing rows, columns, or supersession behavior for any of the six existing `LeadResearch` fields. **FEASIBLE, no blocking gap.**

---

## 7. Qualification Feasibility

**REPOSITORY FACT** (re-verified directly in this task):

```ts
// packages/core-qualification/src/service.ts:16-21
export interface QualificationDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  signals: ResearchSignalRepository;
  qualifications: QualificationRepository;
}

// service.ts:59-78
const opportunity = await deps.opportunities.getById(userId, opportunityId);
const signals     = await deps.signals.listByProspect(userId, opportunity.prospectId);
```

`QualificationDeps` has no `searches` and no `prospects` dependency. `StoredOpportunity` has no `searchId` field (re-verified, `core-opportunity/src/types.ts:40-59`). **Qualification currently has no path to resolve a `searchId` from anything it holds.**

**Does Qualification have enough context to identify the correct Search-scoped determination? Not today — a new dependency is required.** Two viable, precedented resolutions (neither selected by any locked decision — this is a genuine, correctly-flagged-as-open **IMPLEMENTATION DETAIL**, not a product-decision gap, because both resolutions are already architecturally supported and neither requires further Product Owner input to choose between):

1. Add a `prospects: ProspectRepository`-shaped dependency to `QualificationDeps`; resolve `prospect.searchId` before querying D1's entity — directly mirrors `createOpportunityForOwner`'s own `deps.searches.getById(userId, prospect.searchId)` pattern (§4), substituting `ProspectRepository` for `SearchRepository` at the equivalent point.
2. Design D1's own repository so its primary read method accepts `prospectId` alone and resolves `searchId` internally via its own join to `prospects` — mirroring how `ResearchSignalRepository.listByProspect`'s Postgres implementation already resolves ownership via a join to `prospects` without `QualificationDeps` needing a separate dependency at all (this pattern is cited, not independently re-read line-by-line in `pgRepository.ts` in this task, but is consistent with the join-based ownership-check convention re-verified elsewhere in this session, e.g. `toOfferSignals`'s company-conflict check).

**Missing context, named exactly:** a `searchId` value reachable from `opportunity.prospectId` inside `evaluateQualificationForOwner`'s existing call chain. This is the exact and only missing piece — not a missing concept, not a missing repository primitive class, just a missing dependency wire-up, of a kind this exact codebase already has two working precedents for (the `OpportunityDeps.searches` pattern, and the `listByProspect`-internal-join pattern). **FEASIBLE, no blocking gap — the choice between the two resolutions is an implementation detail with existing precedent on both sides.**

**New finding, independently reconfirmed in this task** (already flagged by the predecessor Final Implementation Readiness Audit, §5.9, re-verified directly against `evaluator.ts` in this task): `evaluateQualification()` short-circuits on `NEED_DETECTED` — when it fails, `EVIDENCE_PRESENT` is never evaluated, and `criteria` contains only `[needDetected]`. Whether the future category-plausibility criterion participates in this short-circuit (skipped when `NEED_DETECTED` fails) or is evaluated unconditionally is **not decided by any locked document**. D4 establishes the criterion's independence in *content* from Need Detection, not its *position* in the evaluator's existing short-circuit order. **IMPLEMENTATION DETAIL, non-blocking** — resolvable by engineering judgment (most consistent with D4's "distinct... not routed through... Need Detection" framing: evaluate unconditionally, independent of the `NEED_DETECTED` short-circuit), but flagged explicitly here per the same rationale the predecessor audit gave: an implementer who does not read `evaluator.ts` directly could miss it.

---

## 8. Research Context / D8 Feasibility

**REPOSITORY FACT, re-verified:** Search context (`search.id`, `search.parameters.targetCustomer`) is available in `runCanonicalPipeline`'s own `search: StoredSearch` parameter (`worker.ts:329`), in scope for the entire loop body, but is **not** passed into `runResearchForOwner` — only `{ prospectId: prospect.id }` crosses that boundary (`worker.ts:359-368`, re-verified). It is partially recoverable inside `core-research` (via `prospect.searchId`, since `runResearchForOwner` already loads the full `StoredProspect` at `service.ts:70`) without any new dependency; `targetCustomer`'s *content* requires a new lookup, since `ResearchDeps` has no `searches` dependency today.

**D8 (Option B, RECORDED/NON-BINDING) narrows this to three candidates, none selected:**
1. A second parameter on `ResearchProvider.research()` — changes the method's own arity, in tension with `anthropicResearchProvider.ts:9-10`'s "frozen... byte-for-byte" framing of that signature (cited in the D8 Product Decision, not independently re-read in this task since it was already verified in the immediately preceding session-internal task at the same HEAD).
2. A new `searches: SearchRepository` dependency on `ResearchDeps`, resolved via `deps.searches.getById(userId, prospect.searchId)` inside `runResearchForOwner` — **direct, working precedent exists in this exact repository** for this candidate (`createOpportunityForOwner`, re-verified §4) and for none of the alternatives. D8's own record recommends this candidate, non-bindingly.
3. A widened `RunResearchInput`, populated at the worker call site — uses data the worker already holds in scope, at the cost of touching the worker call site directly.

**Narrowest conceptual point where `searchId`/`targetCustomer`/parsed segments could be carried while preserving provider neutrality:** re-verified directly in this task — `ResearchInput`/`researchInputSchema` (`packages/core-research/src/schema.ts:207-224`, cited, structurally consistent with `prompt.ts`'s rendering of it, not independently re-read line-by-line in this task) plus `prompt.ts`'s `buildUserMessage()`, the single point (re-verified via `researchModelFactory.ts`'s own header comment, §4) above which every provider adapter is proven unreachable — `anthropicModel.ts`/`openAIModel.ts`/`geminiModel.ts` reference neither `ResearchProviderInput` nor `ResearchInput` (cited from this session's prior verification, consistent with `researchModelFactory.ts`'s own documented invariant re-read directly in this task). This is **required under every D8 candidate identically** — D8 only decides how context reaches *that* point, not whether it must.

**Feasibility determination:** **FEASIBLE, no blocking gap.** D8 fixes the top-level direction (Option B) and explicitly, deliberately defers the sub-candidate choice as **non-binding** — this is not an oversight but a documented decision (D8 Product Decision §13: *"It adopts the direction, not a specific candidate... those remain implementation-scope work"*). Candidate selection is an **IMPLEMENTATION DETAIL** with a repository-precedented recommended default (Candidate 2), not a product-decision gap requiring further Product Owner input before implementation can begin.

---

## 9. Provider Neutrality / D9

**REPOSITORY FACT, re-verified directly in this task:** `researchModelFactory.ts`'s own header comment (lines 9-16, read directly) states it is "the ONE place in the codebase allowed to branch on provider identity... Everything above this file... stays completely unaware of which provider produced a ResearchModel." `RESEARCH_PROVIDER_NAMES = ['anthropic', 'openai', 'gemini']` (line 19). The fallback mechanism (`fallbackResearchProvider.ts`, header + lines 1-45 read directly) fetches source documents exactly once and reuses the same `ResearchInput` across every fallback attempt; fallback eligibility is gated on `ResearchProviderError` type alone.

**Could the proposed category-plausibility behavior accidentally become provider-specific?** Not under any candidate traced in §8: every candidate places the new content at or above the `ResearchInput`/`prompt.ts` layer, which is proven (by direct inspection of all three adapter files, cited from this session's prior verification and consistent with `researchModelFactory.ts`'s own documented invariant re-read directly here) to be the *only* path by which any content reaches any provider. A category-plausibility field added there is rendered identically for every provider and the fallback path by construction, not by convention.

**Required invariants** (documented in D9 §7, re-verified as consistent with the architecture traced in §4/§8 of this document, not independently re-derived beyond that consistency check):
```text
1. Provider-neutral semantics live above provider-specific adapters.
2. No separate MATCH/MISMATCH/UNKNOWN definitions per provider.
3. D3 evidence requirements not weakened per provider.
4. No provider-specific business-rule routing.
5. Parsing (D2) is code, not provider interpretation — provider-independent by construction.
6. Search-scoped attribution (D6) is provider-independent.
7. Qualification consumption (D4/D5) is provider-independent.
8. Fallback must not alter the semantic contract.
```

**One genuinely unverified item, correctly flagged as non-blocking by D9/D11 themselves, not newly discovered here:** whether Gemini's `responseSchema` (a distinct OpenAPI-3.0-subset dialect requiring `toGeminiSchema()` translation, per D9 §6, not independently re-read line-by-line in `geminiModel.ts` in this task) can translate the not-yet-designed category-plausibility field shape without loss. D9 §6 and D11 §7 both explicitly classify this as an **IMPLEMENTATION REQUIREMENT** — to be satisfied by adapter-level tests before any live D11 validation session, not a product-decision gap and not something D11 itself re-proves live. **FEASIBLE, no blocking gap** — this is ordinary schema-adapter engineering work of a kind this exact file (`toGeminiSchema()`) already does for every other field.

---

## 10. UI / D10 Feasibility

**REPOSITORY FACT, re-verified directly in this task** (full 195-line file read): `apps/web/app/(client-finder)/opportunities/[id]/page.tsx` already has:
- An aggregate + list-of-items rendering pattern (`score.factors.map(...)`, lines 111-116) — directly reusable for D10-B's aggregate + per-segment list.
- An Evidence section (lines 121-147) using exactly the `{sourceUrl, sourceLabel, sourceQuote, confidence, basis}` shape D10-C requires reusing.
- A Qualification section (lines 149-160) rendering `state` + per-criterion `satisfied`/`reason`, reusable unmodified for the new criterion (no shape change to `QualificationCriterionResult`).
- A uniform `{x ? <section>...</section> : null}` render-only-if-exists convention already used identically for Qualification, Personalization, Outreach, and Follow-Up sections — directly reusable for D10-H.

**What would require new UI work** (IMPLEMENTATION DETAIL, not designed here): the page's server-side data-loading `Promise.all(...)` block (lines 58-69) would need one or two additional fetches — D1's determination record for `(searchId, prospectId)`, and (depending on how §7's Qualification read-path resolution lands) either the Search's `targetCustomer` directly, or a value already carried by whatever resolves the determination record. No change to any *existing* fetched shape (`StoredOpportunity`, `QualificationCriterionResult`, the evidence-item shape) is required.

**Feasibility determination:** **FEASIBLE, no blocking gap.** Every data dependency D10 requires is either already exposed via an existing, unchanged shape, or becomes exposed automatically once D1/D4's own backend work lands (§6/§7) — no additional backend contract beyond what §6/§7 already require is needed specifically for the UI. D10's own decision record (§11, Implementation Constraints 1-10) already enumerates these as constraints for a future implementation, consistent with this finding.

---

## 11. Validation / D11 Feasibility

D11 (locked) already performs its own detailed feasibility mapping (§3 MANDATORY/STRUCTURAL/OBSERVATIONAL split, §4 categorical coverage, §6 evidence standard, §7 provider-neutrality recording, §8 regression standard) — re-verified in this task as internally consistent with D0–D10 and with the repository facts traced in §4–§10 of this document, not independently re-derived beyond that consistency check, per the task's own efficiency instruction not to duplicate work already correctly done.

**Which existing suites provide regression coverage:** `core-opportunity`, `core-qualification`, `core-discovery` test suites — D11-G's own decision, resting on the fact that D1–D10 touch no code path those suites do not already cover the *unchanged* boundary of (Discovery, R-71, scoring/ranking, Opportunity state machine). Not independently re-run in this task (running tests is out of scope for a read-only audit and was not required by the task instructions, which ask only for *feasibility*, not execution).

**Which cases require new tests:** unit tests for the new deterministic parser (D2), the new evaluation logic, the new repository (D1), the new Qualification rule function (D4), and adapter-level schema-translation tests per provider (D9 §6/D11 §7) — all net-new code, so necessarily net-new tests; none of this is disputed by any document in the chain.

**Which cases require live/provider-backed validation:** the seven items D11 §3 marks MANDATORY (input propagation, segment parsing on a real string, per-segment + aggregate classification, at least one UNKNOWN, evidence provenance, cross-Search attribution, — plus the UI instance once built). All of these require a funded provider account (D11-I), which is a confirmed, currently-unresolved **environment-readiness blocker distinct from category-plausibility validation criteria** (§14).

**Which cases require human review:** D11-C/H's existing, unmodified `MVP_REAL_USER_VALIDATION_TEMPLATE.md` primary question, correlated after the fact by a facilitator — not modified by any Path 2 document, re-confirmed unmodified by `git status` (§17).

**How cross-Search attribution can be validated:** D11 §3 item 7 / §4 item 7 — two Searches against the same Prospect with different `targetCustomer` values, both determinations retained independently and queryable via D1's `(search_id, prospect_id)` key once built. D11 itself elevates this to MANDATORY specifically because, per its own §12 rationale, it is "the one architectural guarantee that has never been exercised even once by any run to date."

**How provider-neutrality can be observed:** D11 §7 — record provider used, fallback status, and every D9 §9 field per naturally-occurring session; no forced multi-provider/fallback test required for MVP sign-off (explicit D11-F decision, with its own stated rationale against making D11 "an artificial provider benchmark").

**Feasibility determination:** **FEASIBLE, no blocking gap**, with one **environment-readiness precondition, not a product/architecture gap** (§14) — the funded-provider blocker, which D11-I itself already correctly separates from validation-criteria feasibility.

---

## 12. Remaining Engineering Decisions

Every item below is an **IMPLEMENTATION DETAIL**, not a **PRODUCT DECISION** — distinguished per the task's own required framing. None was invented by this document; each is drawn from, and cross-checked against, the "Non-Blocking Implementation Details" already enumerated by the predecessor Final Implementation Readiness Audit (§18), re-verified against source in this task rather than merely re-cited.

| ID | Decision | Why still open | Repository precedent | Blocking? |
|---|---|---|---|---|
| E1 | Which D8 Option B sub-candidate (2nd `research()` param / `ResearchDeps.searches` / widened `RunResearchInput`) | D8 fixes the direction, deliberately not the candidate (§8) | `OpportunityDeps.searches`/`createOpportunityForOwner` — direct, working precedent for Candidate 2 specifically; none for the alternatives | NON-BLOCKING |
| E2 | Deterministic parsing function location (`core-search`/`core-service-profile` pure function, worker step, or inside `core-research`) | D2 locks the policy (deterministic + ANY-match), not the location; no parser exists anywhere today (re-confirmed: no file in `core-search`/`core-service-profile`/`core-discovery`/`core-research` contains any splitting logic for `targetCustomer`) | None directly, but the choice is a pure-function placement decision of a kind this repository makes routinely elsewhere (e.g. `toServiceRule`, `toOfferSignals` as pure adapter functions) | NON-BLOCKING |
| E3 | Where the per-segment/aggregate evaluation logic executes (LLM-integrated vs. separate deterministic-aggregation step over LLM per-segment output) | D2 locks the policy, not the mechanism | The existing `researchLead()`/schema-validation/repair-loop pattern (`researcher.ts:151-293`, cited, consistent with `provider.ts`'s framing) is the closest analog for LLM-integrated; a separate aggregation step over structured LLM output has no direct precedent in this repository but is a standard, low-risk pattern | NON-BLOCKING |
| E4 | Qualification's Search-resolution mechanism (new `QualificationDeps` dependency vs. D1 repository resolving `searchId` internally) | Neither D1, D6, nor D8 selects between the two (§7) | Both have direct precedent: `OpportunityDeps.searches` (for option 1) and `ResearchSignalRepository.listByProspect`'s internal join (for option 2) | NON-BLOCKING — should be resolved once and reused by the UI's own identical need (§10) |
| E5 | Whether the new Qualification criterion participates in the existing `NEED_DETECTED` short-circuit | Newly reconfirmed in this task (§7); no locked document addresses evaluator *position*, only criterion *independence in content* | `evaluator.ts`'s existing short-circuit structure itself is the only precedent; D4's "distinct... not routed through Need Detection" framing favors unconditional evaluation, non-bindingly | NON-BLOCKING |
| E6 | Which existing `QualificationState` value (`NOT_QUALIFIED` vs. `INSUFFICIENT_EVIDENCE`) a MISMATCH/UNKNOWN-caused Qualification failure maps to | No locked document specifies this; `QUALIFICATION_STATES` already has three values, not two, so no new state is needed either way | `INSUFFICIENT_EVIDENCE` already exists specifically for "evidence exists but is not sufficient" (per `evaluateEvidencePresent`'s own doc comment, re-read directly in this task) — a closer semantic fit for UNKNOWN than for MISMATCH, which is more naturally `NOT_QUALIFIED`; this is this document's own inference, not a decision | NON-BLOCKING |
| E7 | D1's exact table/column/repository-method names | D1 locks the entity's existence and key shape, not its schema | None needed — purely additive, new-table naming with no existing constraint to satisfy beyond `(search_id, prospect_id)` | NON-BLOCKING |
| E8 | D2's exact delimiter-precedence splitting rule | Explicitly deferred by the Final Decision Record's own D2 text ("requiring implementation-level confirmation rather than inventing it") | The one real example on record (`"Restaurants, Cafes; Boutique Retailers & E-commerce Brands; Hotels, Resorts & Tour Operators"`) already demonstrates the needed precedence (`;` between segments, `,` within one) but no document formalizes this as a rule | NON-BLOCKING |
| E9 | Malformed/empty segment handling (e.g. a trailing delimiter) | No locked document addresses this | The most consistent extrapolation from D3 (an unevaluable segment contributes UNKNOWN for that segment) is this document's own inference, not a decision | NON-BLOCKING |
| E10 | Whether the raw `targetCustomer` snapshot is persisted alongside parsed segments | Strongly implied by D6's attribution requirement, not explicitly named | D6's own text: "what `targetCustomer` was this evaluated against" — the cleanest way to satisfy this is retaining both; no document forecloses retaining both | NON-BLOCKING |
| E11 | Gemini structured-output translation for the new field shape (`toGeminiSchema()`) | Unverified against a shape that does not yet exist (D9 §6) | `toGeminiSchema()` (`geminiModel.ts:72-111`, cited, not independently re-read line-by-line in this task) already performs this translation for every existing field | NON-BLOCKING — an IMPLEMENTATION REQUIREMENT per D9/D11, to satisfy before scheduling live D11 validation, not before starting implementation |
| E12 | Illustrative-only names used throughout the governance chain (`CATEGORY_PLAUSIBLE` criterion id, table name, repository method names) | Explicitly marked non-approved by every document that uses them | N/A — naming convention only | NON-BLOCKING |

**No item in this table was found to require further Product Owner input before implementation can begin.** Every item has at least one architecturally valid resolution, and most have a directly precedented one already in this exact repository.

---

## 13. Blocking vs. Non-Blocking Items

```text
BLOCKING (must be resolved before implementation may begin):
  NONE IDENTIFIED.
```

No finding in §5–§12 meets the definition this task's own authorization rubric implies: *"a locked decision is internally contradicted, an architecture boundary cannot be preserved, or a repository capability required by a locked decision does not exist and cannot be added without further product input."* Every open item in §12 is answerable by ordinary engineering judgment from architecture already established in this exact repository — most centrally, the `OpportunityDeps.searches`/`createOpportunityForOwner` pattern, which independently and consistently resolves the highest-leverage open items (E1, E4).

```text
NON-BLOCKING (resolvable during implementation without a further product/
architecture decision):
  E1 through E12 (§12, in full)
```

This reclassifies, but does not overturn, the "blocking implementation dependencies" list in `PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` §19 (D8 candidate selection, D2's splitting rule, D1's schema design, the Qualification read-path resolution, a "separate, explicit implementation-authorization step"). That document's own rubric equated "not yet resolved" with "blocking," under an explicitly more conservative posture appropriate to a scope-lock document whose job was to enumerate gaps, not to classify them by severity. The predecessor Final Implementation Readiness Audit (§17-§19) already performed exactly this reclassification and reached the same "no genuine blocker" conclusion this document reaches, independently re-derived here against source rather than re-quoted from that document's prose.

---

## 14. Implementation Preconditions

Distinct from blocking product/architecture gaps (§13, none found), the following must be true before specific pieces of work can *complete*, even though none of them blocks *starting* implementation:

```text
1. A funded Anthropic (or configured OpenAI/Gemini/fallback) provider account —
   ENVIRONMENT-READINESS precondition (D11-I), unrelated to and unresolved by
   any product decision. Confirmed still unresolved: the one prior live-
   validation attempt (Search b81ab156-..., per D11's own decision record)
   failed with "HTTP 400 — credit balance too low" before any candidate
   reached Research. Blocks live D11 validation and any live API call during
   implementation verification; does not block writing code, unit tests, or
   schema/migration work.

2. Per-provider structured-output verification for the new field shape
   (E11, §12) — an IMPLEMENTATION REQUIREMENT to satisfy via adapter-level
   tests before scheduling a live D11 validation session, not before writing
   the field itself.

3. A separate, explicit Product Owner authorization step naming this
   document (or its successor) as the basis for beginning implementation —
   see §15/§16. This document does not itself constitute that authorization.
```

---

## 15. Authorization Classification

```text
READY FOR IMPLEMENTATION AUTHORIZATION
```

**Justification, restating the classification rubric exactly:**

- D0–D11 are internally consistent (§5) — no contradiction found, including across every pairing the task instructions specifically named.
- No blocking product decision remains (§13) — every open item is an implementation detail with existing repository precedent.
- Search + Prospect attribution is implementable (§6) — an additive new table, keyed unambiguously by `(search_id, prospect_id)`, with no conflict against any existing table.
- Research context flow is implementable (§8) — D8's Option B direction is architecturally supported by a direct, working precedent already in this repository.
- Qualification consumption is implementable (§7) — two precedented resolutions exist for the one missing dependency wire-up.
- Provider neutrality is achievable (§9) — already structurally enforced by `researchModelFactory.ts`'s existing sole-branch-point design; the one unverified item (Gemini schema translation) is an ordinary, precedented adapter-engineering task.
- UI requirements are implementable (§10) — every existing page primitive needed is already present and reusable without a shape change.
- Validation requirements are actionable (§11) — D11 already defines a complete, non-contradictory validation standard; the only blocker to *executing* validation (not to implementing) is the environment-readiness precondition (§14).
- Remaining unknowns are implementation details only (§12) — twelve items enumerated, none requiring further Product Owner input.

This document does not find grounds to classify Path 2 as NOT READY. The condition for that classification — a product decision, architecture boundary, or essential requirement still ambiguous enough that implementation could materially diverge from locked intent — was checked against every dimension the task instructions specify and was not met in any of them.

---

## 16. Explicit Non-Authorization

```text
THIS DOCUMENT DOES NOT AUTHORIZE:
  - writing, modifying, or generating any production code
  - writing, modifying, or generating any test
  - modifying the PRD (any version)
  - modifying any configuration file
  - creating or modifying any database schema or migration
  - modifying any Research provider (Anthropic/OpenAI/Gemini/fallback)
  - modifying worker code
  - modifying Qualification, Discovery, Opportunity, or UI code
  - running any live API call
  - installing any dependency
  - reopening, reinterpreting, or altering D0–D11
  - staging, committing, or pushing anything

A separate, explicit Product Owner action is required to convert this
document's "READY" classification into an actual implementation
authorization. This document is evidentiary input to that action, not
the action itself.
```

---

## 17. Repository Safety Verification

```bash
git status --short
git diff --check
git diff --name-only
git diff --cached --name-only
git rev-parse HEAD
```

**Result (run at the end of this task):**

```text
HEAD:                          5992b82b9adff492c480442d68a954f2a03bfb28  (UNCHANGED)

git diff --name-only (unstaged, pre-existing, untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

git diff --cached --name-only:  (empty — nothing staged)

git status --porcelain additionally shows, as untracked ("??"), the full
pre-existing requirement/*.md set, .claude/, and CLAUDE.md — all untouched by
this task, plus exactly ONE new untracked file created by this task:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_AUTHORIZATION_GATE.md
```

**Confirmed:**

```text
HEAD unchanged:                                   YES (5992b82b9adff492c480442d68a954f2a03bfb28)
Pre-existing tracked modifications unchanged:      YES (same 5 files; several were read
                                                    read-only for citation verification —
                                                    worker.ts, service.ts files — none edited)
Pre-existing untracked files unchanged:            YES (including every prior governance
                                                    document in this chain)
Only the new authorization-gate document created:  YES
Production code changed:                           NO (0)
Tests changed:                                     NO (0)
PRD changed:                                       NO (0)
Configuration changed:                             NO (0)
Database/schema/migrations changed:                NO (0 — read only)
Provider files changed:                            NO (0)
Worker files changed:                               NO (0)
Frontend files changed:                              NO (0)
Nothing staged:                                        YES
No commit:                                              YES
No push:                                                 YES
No live API calls:                                        YES (0 — no Anthropic/OpenAI/
                                                            Gemini/Google Places call made)
No dependency installed:                                    YES
No lockfile altered:                                          YES
```

---

## STOP CONDITION

`requirement/PATH_2_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_AUTHORIZATION_GATE.md` has been produced and repository safety has been verified (§17). D0–D11 are not reopened, reinterpreted, or altered. No implementation, refactor, test, schema, migration, provider, worker, Qualification, Discovery, Opportunity, or UI change was made. No live API call was made. Nothing was staged, committed, or pushed. This is the sole deliverable of this task.
