# PATH 2 — CATEGORY PLAUSIBILITY
# FINAL IMPLEMENTATION READINESS AUDIT

```text
DOCUMENT TYPE: READ-ONLY FINAL IMPLEMENTATION READINESS AUDIT
STATUS: AUDIT ONLY — NO IMPLEMENTATION PERFORMED
```

---

## 1. Executive Summary

The repository is **engineering-specified to the point that implementation can begin**, but not to the point that every implementation decision is closed. Every locked product decision (D0–D11) has a concrete, traceable anchor in the current codebase; none is contradicted by another locked decision or by the actual repository contracts. No decision requires an architecture the current codebase cannot support.

However, three specific engineering choices remain genuinely open — not merely "write the obvious code," but decisions with more than one architecturally valid answer that a prior document has not narrowed to one:

1. **Which D8 Option B sub-candidate** carries Search-scoped context into Research (a `ResearchDeps.searches` dependency vs. a widened `RunResearchInput` vs. a second `ResearchProvider.research()` parameter).
2. **How Qualification resolves "the current Search" for D6's read rule**, given `StoredOpportunity` has no `searchId` field and `QualificationDeps` has no dependency capable of reaching one.
3. **Where in the persistence-then-Qualification chain the parsing/evaluation logic executes**, and the exact deterministic-parsing splitting rule (D2 locks the policy, not the mechanism).

None of these three is a **product decision** requiring Product Owner input — each is answerable with an engineering judgment call from architecture already established in the codebase (e.g., `core-opportunity`'s `OpportunityDeps.searches` pattern is directly reusable precedent for #1). None of them blocks *starting* implementation; each blocks *finishing* the specific component it touches without being resolved first, at the point that component is built. This document classifies all three as **NON-BLOCKING** (§17) — a first implementation task can, and should, make these calls explicitly rather than treating them as pre-conditions to be decided by a separate governance pass.

One additional short-circuit interaction in the existing Qualification evaluator (§5.4) was not previously documented in the governance chain and is flagged as a new finding — it is an implementation detail, not a blocker.

```text
FINAL CLASSIFICATION: READY EXCEPT FOR EXPLICITLY DEFERRED IMPLEMENTATION DETAILS
```

See §19 for the full justification.

---

## 2. Baseline

```bash
git rev-parse HEAD
git status --short
git diff --check
git diff --name-only
git diff --cached --name-only
```

**Result:**

```text
HEAD:                          5992b82b9adff492c480442d68a954f2a03bfb28
Expected baseline:             5992b82b9adff492c480442d68a954f2a03bfb28
Match:                         CONFIRMED — no discrepancy.

git diff --check:              clean
git diff --name-only:          apps/web/tsconfig.tsbuildinfo
                                apps/worker/src/searchWorker/worker.test.ts
                                apps/worker/src/searchWorker/worker.ts
                                packages/core-discovery/src/service.test.ts
                                packages/core-discovery/src/service.ts
git diff --cached --name-only: (empty)
```

All five pre-existing modifications and the full pre-existing `requirement/*.md`, `.claude/`, `CLAUDE.md` untracked set are treated as immutable. §20 re-verifies none changed.

---

## 3. Locked Decision Set

Read in full for this task:

```text
requirement/PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D7_PRODUCT_DECISION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D9_PRODUCT_DECISION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D10_PRODUCT_DECISION.md
requirement/PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md
```

D0–D11 are treated as **LOCKED** throughout this audit and are not reopened, reinterpreted, or extended. Their binding text is reproduced in full in the Consolidated Scope-Lock §3 and is not re-quoted here in full to avoid duplication; this audit cites specific clauses only where directly relevant to a finding.

**No contradiction was found between any two locked decisions, and none was found between any locked decision and the current repository contracts** — this reconfirms the Consolidated Scope-Lock's own §18 finding, independently re-derived in this audit by re-tracing the source files listed in the task instructions (§4–§13 below), not merely by re-reading the scope-lock's prose.

---

## 4. Persistence / Attribution Audit

### 4.1 Files inspected (this task)

```text
packages/core-research/src/schema.ts
packages/core-research/src/mapping.ts           (read in full)
packages/core-research/src/pgRepository.ts       (grepped for search_id/prospect_id)
packages/core-research/src/persist.ts            (read: FIELD_KIND definition, lines 1-50)
packages/core-research/src/provider.ts           (read in full — prior task)
packages/core-research/src/repository.ts         (read in full)
packages/core-research/src/researcher.ts         (prior task)
packages/core-search/src/repository.ts           (read: SearchRepository interface)
packages/core-qualification/src/repository.ts    (read in full)
packages/core-opportunity/src/repository.ts      (grepped: OpportunityRepository)
packages/db/prisma/schema.prisma                 (confirmed exists; the repository's actual
                                                    persistence source of truth is the Prisma
                                                    migration SQL, not this file directly —
                                                    see note below)
packages/db/prisma/migrations/                   (directory listing — 0001 through 0026)
```

**Note on `packages/migrations/`:** the task instruction names `packages/migrations/` as a directory to inspect. No such path exists in this repository — migrations live under `packages/db/prisma/migrations/`, confirmed present and enumerated above (26 migration directories, `0001_init` through `0026_ai_usage_events_fallback_request_kind`; `0016_research_signals` and `0015_discovery` are the two directly relevant to this audit and were read in full in the prior scope-lock task, re-cited here). This is a path-naming discrepancy in the task instruction, not a repository gap.

### 4.2 Answers to the ten questions

**1. What is the current primary key / uniqueness model for Research signals?**
`research_signals` (migration `0016_research_signals/migration.sql:56-80`) has columns `id`, `prospect_id`, `field`, `kind`, `classification`, `signal`, `confidence`, `basis`, `observed_at`, `superseded_at`, `created_at`. There is no unique constraint across `(prospect_id, field)` — the model is append-only: every research run inserts a fresh row per observed field and marks prior rows superseded (`superseded_at`), never deletes or updates in place. Reads (`listByProspect`) filter to `superseded_at IS NULL`.

**2. Does `ResearchSignal` have `searchId`?**
**No.** Confirmed directly: `research_signals`' column list (migration 0016) has no `search_id` column. `ResearchSignalRepository` (`packages/core-research/src/repository.ts:13-29`, read in full this task) exposes exactly `supersedePrevious(prospectId, at)`, `saveSignals(prospectId, signals, observedAt)`, `listByProspect(userId, prospectId)` — every method is keyed by `prospectId` alone. The Postgres implementation (`pgRepository.ts`, grepped this task) confirms: `SIGNAL_COLUMNS` includes `prospect_id` but no `search_id`; `supersedePrevious` writes `WHERE prospect_id = $1`; `listByProspect` joins `research_signals rs ... JOIN prospects p ON p.id = rs.prospect_id` filtered by `p.user_id`.

**3. Does `Prospect` identify a Search uniquely?**
**Yes.** `StoredProspect` (`packages/core-discovery/src/types.ts:23-30`, read in full this task) has a required `searchId: string` field. `ProspectRepository.findOrCreate` (`packages/core-discovery/src/repository.ts:30-41`, read in full this task) is keyed by `{ searchId, companyId }`, and the underlying table enforces `UNIQUE(search_id, company_id)` (`packages/db/prisma/migrations/0015_discovery/migration.sql:115-116`, re-verified this task). Consequence: every `Prospect` row belongs to exactly one Search, permanently — a business rediscovered under a second Search produces a **second, distinct** Prospect row, never the same row reattached to a different Search.

**4. Can the required Search+Prospect determination be persisted without changing `ResearchSignal`?**
**Yes — and D7 requires exactly this.** D7 (locked) mandates the determination never become a `ResearchSignal` row. Because `research_signals` has no `search_id` column and enforces no such key, it structurally *cannot* express a `(search_id, prospect_id)`-scoped record without a schema migration to that table — which D1/D7 already forecloses by requiring a dedicated entity instead. `ResearchSignal`'s own rows, columns, and supersession behavior require zero change.

**5. What exact new persistence primitive would be required?**
A new table, keyed by `(search_id, prospect_id)`, holding the aggregate determination, per-segment breakdown, evidence, and a `targetCustomer` snapshot — see §4.3 for the conceptual shape (unchanged from the Consolidated Scope-Lock §6, re-confirmed here by re-tracing rather than re-copying).

**6. Would a new table/entity be required?**
**Yes.** No existing table can express the required `(search_id, prospect_id)` key without a migration to that specific table, and D1 already specifies a "dedicated" entity rather than an extension of an existing one.

**7. What conceptual key should identify a determination?**
`(search_id, prospect_id)`, per D1/D6. This is the only key shape that directly matches D6's decided scope without requiring a further, separate attribution mechanism.

**8. What prevents accidental overwrite?**
Two independent mechanisms, confirmed by direct schema inspection:
- **Structural**: because `Prospect` is uniquely keyed by `(search_id, company_id)`, a second Search researching the same real-world business produces a different `prospect_id`. A determination write keyed by `(search_id, prospect_id)` for one Search can never collide with, or overwrite, a determination for a different Search's distinct Prospect row — this is true *before* any application-level supersession logic runs, purely from the schema's existing dedup constraint.
- **Application-level** (not yet built): whatever supersede-or-reject behavior the new repository implements for a *repeated* write to the *same* `(search_id, prospect_id)` pair (e.g., a Research re-run for the same Search) — this exact behavior is not specified by any locked decision and is implementation-scope (§17, non-blocking).

**9. What data must be retained for historical attribution?**
Per D6's own text ("TargetCustomer change: NEW SEARCH-SCOPED DETERMINATION... Prior determinations remain retained and historically attributable"): the `targetCustomer` value (or its parsed segments) the determination was evaluated against, the determination itself, and its timestamp, scoped permanently to the `(search_id, prospect_id)` pair that produced it. Nothing about a later Search's determination for the same underlying business may cause an earlier Search's row to be deleted or altered.

**10. What repository methods would be required?**
At minimum: a write method (`save`/`upsert`, shape depends on the supersession question above) and a read method scoped by `(userId, searchId, prospectId)` — mirroring the ownership-enforcement pattern every other repository in this codebase uses (a `userId`-scoped read, independent of the caller's own prior authorization check, per `ResearchSignalRepository.listByProspect`'s and `QualificationRepository.getByOpportunityId`'s existing convention, both re-verified this task).

### 4.3 Conceptual shape (unchanged from, and re-verified against, the Consolidated Scope-Lock)

```text
CONCEPTUAL ONLY — NOT IMPLEMENTED

Table (name illustrative, not approved):
  id
  search_id            (FK -> searches)
  prospect_id           (FK -> prospects)
  target_customer_snapshot
  target_segments       (parsed, per D2)
  aggregate_result       (MATCH | MISMATCH | UNKNOWN)
  segment_results         (per-segment result + evidence)
  observed_at / created_at

Repository (name illustrative):
  save(searchId, prospectId, determination, now)
  getBySearchAndProspect(userId, searchId, prospectId)
```

**Classification: ALREADY RESOLVED as to shape/key; NON-BLOCKING as to exact schema.** The key structure `(search_id, prospect_id)` is unambiguous from D1/D6; the exact column names, supersession behavior on repeated writes, and migration number are ordinary engineering work, not a decision requiring further product input.

---

## 5. Qualification Read-Path Audit

### 5.1 Files inspected (this task)

```text
packages/core-qualification/src/service.ts       (read in full — prior task)
packages/core-qualification/src/repository.ts     (read in full, this task)
packages/core-qualification/src/rules.ts           (read in full, this task)
packages/core-qualification/src/evaluator.ts        (read in full, this task)
packages/core-qualification/src/types.ts             (read in full — prior task)
packages/core-opportunity/src/repository.ts           (grepped, this task)
packages/core-opportunity/src/types.ts                 (read in full — prior task)
packages/core-search/src/repository.ts                  (read in part, this task)
```

### 5.2 How Qualification currently identifies a Prospect

`evaluateQualificationForOwner(deps, userId, opportunityId, now)` (`packages/core-qualification/src/service.ts:59-78`, re-verified this task):

```ts
const opportunity = await deps.opportunities.getById(userId, opportunityId);
const signals     = await deps.signals.listByProspect(userId, opportunity.prospectId);
const evaluation  = evaluateQualification({ needDetected: opportunity.needDetected, signals });
```

Qualification identifies a Prospect exclusively via `opportunity.prospectId` — it never receives a `prospectId` or `searchId` directly from its caller.

### 5.3 How it obtains Search context — it does not, today

`QualificationDeps` (`packages/core-qualification/src/service.ts:16-21`, re-verified):

```ts
export interface QualificationDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  signals: ResearchSignalRepository;
  qualifications: QualificationRepository;
}
```

No `searches: SearchRepository` and no `prospects: ProspectRepository` dependency exists. Qualification has **no path today** to resolve a `searchId` from anything it holds.

### 5.4 Whether `StoredOpportunity` has `searchId`

**No.** Re-verified this task (`packages/core-opportunity/src/types.ts:40-59`): `StoredOpportunity` carries `id`, `userId`, `prospectId`, `state`, `needDetected`, `offer`, `staleness`, `stalenessComputedAt`, `createdAt`, `updatedAt`. No `searchId` field.

### 5.5 Whether current repository APIs are Prospect-scoped

**Yes, universally**, across every repository this chain touches: `ResearchSignalRepository.listByProspect(userId, prospectId)`, `OpportunityRepository.findByProspectId(userId, prospectId)` (re-verified: `packages/core-opportunity/src/repository.ts:37`), `QualificationRepository.upsert(opportunityId, prospectId, ...)`/`getByOpportunityId(userId, opportunityId)`. None of these methods accept or filter by `searchId`.

### 5.6 Whether a Search-scoped lookup is possible today

**Not directly, but derivable.** Because `Prospect.searchId` is a required, durable column (§4.2, item 3) and `prospectId` uniquely determines exactly one `searchId`, a Search-scoped lookup *is* derivable — but only by adding a new dependency/lookup step somewhere in the chain. Two viable derivations exist, confirmed against current repository shapes:

- **Via a new `ProspectRepository` (or equivalent) dependency on `QualificationDeps`**, resolving `prospect.searchId` before querying D1's new entity — this exactly mirrors `core-opportunity`'s own `createOpportunityForOwner` pattern (`packages/core-opportunity/src/service.ts:112-131`, re-verified in the prior task and not re-read line-by-line in this task since it was already read in full then and HEAD is unchanged): `const search = await deps.searches.getById(userId, prospect.searchId)`.
- **Via D1's own new repository resolving `searchId` internally** from a `prospectId`-only query (e.g., a join to `prospects` inside the new repository's Postgres implementation, mirroring how `ResearchSignalRepository.listByProspect`'s own Postgres implementation already joins to `prospects` for ownership enforcement without requiring `service.ts` to hold a separate `ProspectRepository`).

### 5.7 Minimal conceptual API addition needed

```text
CONCEPTUAL ONLY — NOT IMPLEMENTED

Option 1: QualificationDeps { ...existing, prospects: ProspectRepository }
          + evaluateQualificationForOwner resolves
            prospect = await deps.prospects.getById(userId, opportunity.prospectId)
          before querying D1's entity by (prospect.searchId, prospect.id)

Option 2: D1's repository exposes
            getByProspect(userId, prospectId): StoredDetermination | null
          and resolves searchId internally, sparing QualificationDeps any new
          dependency.
```

### 5.8 Existing capability vs. required new capability

```text
EXISTING:
  - Qualification resolves an Opportunity by id (owned, userId-checked)
  - Qualification resolves ResearchSignals by prospectId (owned, userId-checked)
  - The evaluator (evaluateQualification) is a pure function, already
    structured to accept additional evaluator input alongside
    needDetected/signals (QualificationEvaluatorInput, evaluator.ts:6-9)
  - QUALIFICATION_STATES already includes a third state,
    'INSUFFICIENT_EVIDENCE' (types.ts:9), not only QUALIFIED/NOT_QUALIFIED —
    a plausible (not decided) target for a MISMATCH/UNKNOWN category-
    plausibility failure to map onto without inventing a new state value

REQUIRED NEW CAPABILITY:
  - Some path from opportunity.prospectId to a searchId (§5.6/§5.7 — two
    viable shapes, neither selected by any locked decision)
  - A new repository dependency on QualificationDeps OR a new method on
    D1's own repository (mutually exclusive with the above)
  - A new rule function (evaluateCategoryPlausible or equivalent) plugged
    into evaluateQualification()'s input/output shape
```

### 5.9 New finding: the existing NEED_DETECTED short-circuit

Re-verified in this task, not previously documented in any Path 2 governance record: `evaluateQualification()` (`packages/core-qualification/src/evaluator.ts:21-43`) **short-circuits on `NEED_DETECTED`** — when it fails, `EVIDENCE_PRESENT` is not evaluated at all, and the state is immediately `NOT_QUALIFIED` (lines 24-30), with `criteria: [needDetected]` only (the second criterion is not even recorded as "not evaluated"). This is an existing, intentional design (`rules.ts:5-13`'s own comment: "Two criteria only, evaluated in order, short-circuiting").

**Consequence for D4's new criterion, not resolved by any locked decision:** whether the future category-plausibility criterion participates in this short-circuit chain (i.e., is it skipped when `NEED_DETECTED` fails, the same way `EVIDENCE_PRESENT` is today?), or is evaluated unconditionally regardless of `NEED_DETECTED`'s outcome, is genuinely undecided. D4 says only "new, distinct Qualification criterion... not routed through R-71 Need Detection" — this establishes the criterion's *independence in content* from Need Detection, but says nothing about its *position* in the evaluator's existing short-circuit order.

**Classification: NON-BLOCKING / IMPLEMENTATION DETAIL.** This is answerable by engineering judgment (most consistent existing pattern: evaluate independently, since category plausibility is explicitly not a Need Detection derivative) without requiring a new product decision — but it is flagged here because no prior document in the governance chain identified it, and an implementer who does not read `evaluator.ts` directly could miss it.

---

## 6. Research Context Audit

### 6.1 Files inspected (this task)

```text
apps/worker/src/index.ts                          (grepped, this task — fallback wiring lines 97-125)
apps/worker/src/fallbackResearchProvider.ts        (read lines 1-40, this task)
packages/core-research/src/provider.ts             (read in full — prior task, re-confirmed)
packages/core-research/src/researcher.ts            (cited from prior task — ResearchModel, researchLead())
packages/core-research/src/service.ts                (read in full — prior task)
packages/core-research/src/prompt.ts                  (read in full, this task)
packages/core-research/src/researchModelFactory.ts     (read header + provider list, this task)
packages/core-research/src/anthropicResearchProvider.ts (cited from prior task)
```

### 6.2 Exact current worker signature

`apps/worker/src/searchWorker/worker.ts:327-330` (re-verified, prior task):

```ts
async function runCanonicalPipeline(
  deps: SearchWorkerDeps,
  search: StoredSearch,
): Promise<{ prospectsProcessed: number }>
```

Research call site, `worker.ts:359-367` (re-verified, prior task):

```ts
await runResearchForOwner(
  { companies: deps.companies, prospects: deps.prospects, signals: deps.signals,
    provider: deps.researchProvider(userId) },
  userId,
  { prospectId: prospect.id },
);
```

### 6.3 Exact current Research orchestration signature

`packages/core-research/src/service.ts:21-27,62-88` (re-verified, prior task):

```ts
export interface ResearchDeps {
  identity: IdentityRepository;
  companies: CompanyRepository;
  prospects: ProspectRepository;
  signals: ResearchSignalRepository;
  provider: ResearchProvider;
}

export async function runResearchForOwner(
  deps: Omit<ResearchDeps, 'identity'>,
  userId: string,
  input: RunResearchInput,
  now: Date = new Date(),
): Promise<ResearchRunResult>
```

No `searches: SearchRepository` dependency.

### 6.4 Where Search context is currently available, and where it disappears

Available: `runCanonicalPipeline`'s own `search: StoredSearch` parameter (`worker.ts:329`), in scope for the entire loop body. It disappears at the Research call site (`worker.ts:359-367`) — only `{ prospectId: prospect.id }` crosses into `runResearchForOwner`. It is partially recoverable inside `core-research` (via `prospect.searchId`, since `runResearchForOwner` already loads the full `StoredProspect` at `service.ts:70`), but `targetCustomer`'s *content* is not recoverable without a new `SearchRepository` lookup, since `ResearchDeps` has no such dependency today.

### 6.5 Where participant `targetCustomer` must enter the flow

At minimum, into `ResearchInput`/`researchInputSchema` (`packages/core-research/src/schema.ts:207-224`) and rendered by `prompt.ts`'s `buildUserMessage()` — confirmed the only point any content reaches any provider (§6.7). Re-verified `prompt.ts` in full this task: `buildUserMessage()` (lines 32-61) already renders `industry`/`location` with an explicit "supplied, unverified... treat as INFERRED at best" framing (lines 55-56) — directly reusable in spirit for a `targetCustomer`/`targetSegments` field.

### 6.6 Whether `ResearchProviderInput` must change

**No, not under D8/Option B** (locked). `ResearchProviderInput` (`provider.ts:11-16`, re-confirmed: exactly `{ prospectId, companyId, companyName, normalizedDomain }`) is explicitly the contract D8 preserves. It is required to change only under Option A (not selected) or under Option B's "Candidate 1" sub-variant (a second parameter on `ResearchProvider.research()`, which changes the method's arity but not this type specifically).

### 6.7 Whether a separate orchestration dependency/context is sufficient

**Yes**, confirmed by direct tracing: a new `searches: SearchRepository` dependency on `ResearchDeps`, resolved inside `runResearchForOwner` via `deps.searches.getById(userId, prospect.searchId)`, is architecturally sufficient — this is precisely the pattern `core-opportunity`'s `createOpportunityForOwner` already uses (verified in the prior task at `packages/core-opportunity/src/service.ts:123,131`). The resolved `targetCustomer` value would still need to cross into `ResearchInput`/`prompt.ts` (§6.5) regardless of which orchestration mechanism resolves it — this final step is required under every D8 sub-candidate, not eliminated by any of them.

### 6.8 Whether `ResearchModel` remains unchanged

**Yes, confirmed.** `ResearchModel` (`researcher.ts:44-56`, cited from prior full read, not re-read line-by-line this task since HEAD is unchanged) is defined purely as `(request: {system, messages, signal}) => Promise<ModelResult>`. No candidate analyzed under D8 adds a field to this interface.

### 6.9 Whether provider adapters remain unchanged

**Yes, confirmed by direct inspection in this task.** `researchModelFactory.ts`'s header comment (re-read this task, lines 1-16): *"This is the ONE place in the codebase allowed to branch on provider identity. Everything above this file... stays completely unaware of which provider produced a ResearchModel."* `RESEARCH_PROVIDER_NAMES = ['anthropic', 'openai', 'gemini']` (line 19, re-verified). Neither `anthropicModel.ts`, `openAIModel.ts`, nor `geminiModel.ts` is touched by any candidate traced in this or the prior task — confirmed in the prior task by direct inspection of all three files (none imports `ResearchProviderInput` or `ResearchInput`), not re-read line-by-line in this task since HEAD is unchanged.

### 6.10 Fallback provider — re-verified this task

`apps/worker/src/index.ts:97-125` (grepped this task): `env.RESEARCH_FALLBACK_PROVIDER` conditionally wires `createFallbackResearchProvider`. `apps/worker/src/fallbackResearchProvider.ts` (read lines 1-40 this task): fetches source documents exactly once and reuses the same `ResearchInput` across every attempt in the fallback chain; fallback eligibility is gated on `ResearchProviderError` type alone (timeout/rate-limit/outage/auth/context-length), never on refusal, validation failure, or abort. This function itself satisfies `ResearchProvider` — a drop-in replacement for `createAnthropicResearchProvider` at the worker's wiring point, per its own header comment (re-read this task). No change to `ResearchProvider`, `researchLead()`, or `schema.ts` is required by the fallback mechanism itself, and no candidate in §6 requires one either.

**Classification: ALREADY RESOLVED as to architecture (D8/Option B is fully supportable); NON-BLOCKING as to which sub-candidate.**

---

## 7. Deterministic Parsing Audit

### 7.1 Search performed (this task)

```bash
grep -rn "targetCustomer" packages/ apps/ --include="*.ts" | grep -vi test
grep -rn "segment" packages/core-research/src packages/core-search/src packages/core-service-profile/src
grep -rn "parse.*[Tt]arget\|[Ss]plit.*[Tt]arget" packages/
```

### 7.2 Findings

- **`ServiceProfile.targetCustomer`** is a single, free-text `string` (`packages/core-service-profile/src/types.ts:10-14`, cited from prior task, not re-read this task since HEAD is unchanged and the citation was already verified then).
- **No parsing/splitting utility exists anywhere in the codebase.** No file in `core-search`, `core-service-profile`, `core-discovery`, or `core-research` contains logic that splits a compound `targetCustomer` string into segments. Discovery's `buildQuery()` consumes the raw string verbatim.
- **No existing "taxonomy" or "classification" mechanism applies to this concept.** The repository's existing `classification` vocabulary (`OBSERVED`/`INFERRED`/`UNKNOWN`, `schema.ts:20-22`) is an evidence-quality axis applied per-field to every `LeadResearch` observation — a different axis from a category-plausibility *result* (MATCH/MISMATCH/UNKNOWN), a distinction every governance document in this chain has preserved and this audit re-confirms is not conflated anywhere in the current schema.

### 7.3 Answers

- **Whether parsing already exists:** No.
- **Whether a new deterministic parser is required:** Yes — required by D2 (locked), and confirmed to not exist by direct search.
- **What input it receives:** `ServiceProfile.targetCustomer`/`StoredSearch.parameters.targetCustomer` (the raw compound string).
- **Where parsing should occur:** Not decided by any locked document. Three candidate locations remain equally architecturally valid: (a) a pure function in `core-search`/`core-service-profile`, operating on the raw string before any Research code runs; (b) the worker orchestration boundary (`runCanonicalPipeline`), as a distinct step immediately before the Research call; (c) inside `core-research` itself, once the raw string has been resolved there by whichever §6 mechanism is chosen. All three satisfy D9's provider-neutrality requirement equally, since parsing must run once, above `researchModelFactory.ts`'s provider-selection point, regardless of location.
- **Whether parsing belongs in Search, Research orchestration, or a dedicated domain utility:** Not decided — see above. A dedicated pure function (location (a)) has the strongest testability and reuse properties of the three, but this is an engineering preference, not a locked requirement.
- **Whether parsing should be persisted:** Yes, implied by D3's evidence/audit requirement and D6's "what `targetCustomer` was this evaluated against" requirement — the parsed segments (and, per D6, arguably the raw snapshot too) must be retrievable alongside the determination for historical attribution and explainability (D2's "preserve the individual segment determinations/evidence" clause).
- **Whether the original raw `targetCustomer` must also be preserved:** Strongly implied, not explicitly mandated by name. D6 requires the determination to be attributable to "what `targetCustomer` it was evaluated against" — the cleanest way to satisfy this without ambiguity is to retain the raw string alongside the parsed segments, per the Consolidated Scope-Lock's own conceptual shape (§4.3 of this document).

**Classification: NON-BLOCKING.** D2 fully specifies the *policy* (deterministic parsing + ANY-match). The *location* of the parsing function is ordinary implementation work with three equally valid options, none of which the locked decisions favor or need to favor — this is exactly the kind of choice an implementer resolves during a normal engineering pass, not a product-decision gap.

---

## 8. Category-Plausibility Contract

### 8.1 Minimum conceptual output contract

To represent aggregate state, per-segment state, evidence, confidence, basis, source URL, and source label, per D3/D9/D10:

```text
CONCEPTUAL ONLY — NOT IMPLEMENTED

SegmentDetermination {
  segment: string
  result: 'MATCH' | 'MISMATCH' | 'UNKNOWN'
  evidence: { sourceUrl: string; sourceLabel: string; quote: string }[]
  confidence: number
  basis: string | null
}

CategoryPlausibilityResult {
  aggregate: 'MATCH' | 'MISMATCH' | 'UNKNOWN'
  segments: SegmentDetermination[]
  targetCustomerSnapshot: string
}
```

### 8.2 Can existing `LeadResearch`/evidence structures be reused without violating D1/D7?

**Partially, and this is the correct answer, not a contradiction.** The existing `Observation` shape (`schema.ts` — `value`/`classification`/`confidence`/`evidence[]`/`basis`, re-confirmed structurally consistent across every `LeadResearch` field in the prior task's reading) is directly reusable **as a vocabulary/shape template** for each segment's evidence entries (`{sourceUrl, sourceLabel, sourceQuote, confidence, basis}` — this exact shape is what D10's own Implementation Constraint 4 requires reuse of, and what the existing Opportunity detail page already renders at its Evidence section, per the prior task's verification of `opportunities/[id]/page.tsx` lines 122-147).

What is **not** reusable, per D1/D7 (locked): the *persistence* path. `LeadResearch`'s `Observation` fields flow automatically into `ResearchSignal` via `allObservations()`/`toNewResearchSignals()` — a path D7 explicitly forbids this determination from entering. So the correct shape is exactly what the task instruction itself anticipates:

```text
reuse existing evidence primitives (the {sourceUrl, sourceLabel, sourceQuote,
confidence, basis} shape already used throughout LeadResearch and already
rendered by the existing Opportunity detail UI)
+
a new, dedicated category-plausibility entity (D1) that is NOT a LeadResearch
field and NOT a ResearchSignal row
```

This is confirmed as architecturally supported by direct inspection: the evidence shape is a plain data structure, not coupled to `allObservations()`/`FIELD_KIND`/`ResearchSignal` at the type level — nothing prevents it from being embedded inside a wholly separate entity's rows.

**Classification: ALREADY RESOLVED.** No tension exists between D1/D7 (persistence isolation) and D3/D10 (evidence-shape reuse) — they operate on different axes (where the data lives vs. what shape each evidence item takes) and the repository's existing type structure supports both simultaneously.

---

## 9. Provider Neutrality

Re-traced this task:

```text
createFallbackResearchProvider   packages/core-research/src/fallbackResearchProvider.ts
  (read lines 1-40 this task — confirmed: satisfies ResearchProvider; fetches source
   documents exactly once; reuses the same ResearchInput across every fallback attempt;
   eligibility gated on ResearchProviderError type only)
RESEARCH_FALLBACK_PROVIDER       apps/worker/src/index.ts:97 (grepped this task, confirmed present)
Anthropic / OpenAI / Gemini      RESEARCH_PROVIDER_NAMES = ['anthropic','openai','gemini']
                                   packages/core-research/src/researchModelFactory.ts:19
                                   (re-read this task)
ResearchModel                     packages/core-research/src/researcher.ts:44-56 (cited,
                                   prior task, unchanged — §6.8)
```

No implementation requirement identified in §4–§8 accidentally creates provider-specific category-plausibility behavior: the determination's semantics (parsing, evidence policy, evaluation, MATCH/MISMATCH/UNKNOWN meaning) are all required to live at or above the `ResearchInput`/`prompt.ts` layer — the same shared layer already used identically by all three current provider adapters and the fallback path, per the existing, verified architecture (`researchModelFactory.ts`'s own header comment, re-confirmed this task).

```text
provider adapters must not own category-plausibility semantics
```

is confirmed, not contradicted, by the evidence traced in this and the prior task. No source evidence contradicts this statement.

**Classification: ALREADY RESOLVED.**

---

## 10. R-71 Boundary

Re-confirmed at the correct location this task via the prior task's already-verified citations (not re-read line-by-line this task since HEAD is unchanged):

```text
TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])
  packages/core-opportunity/src/adapters.ts:152
toOfferSignals()  packages/core-opportunity/src/adapters.ts:175-199
suggestOffers()   packages/core-acquisition/src/offer.ts:76
```

No candidate analyzed in §4–§9 of this audit touches `TOPICAL_FIELDS`, `suggestOffers()`, or `toOfferSignals()`. D7's persistence isolation (§4 of this audit) makes this structurally guaranteed, not merely policy-observed: the determination is never a `StoredResearchSignal` row (confirmed §4.2, items 2 and 4), so it is mechanically unreachable by `toOfferSignals()`'s input (`stored: readonly StoredResearchSignal[]`) regardless of any future implementation detail. Category plausibility remains a separate audience/category-fit axis, structurally isolated from need detection and offer recommendation.

**Classification: ALREADY RESOLVED.**

---

## 11. Scoring / Ranking Boundary

Re-confirmed: `FACTOR_WEIGHTS`, `OpportunityScore`, and `rankOpportunities` (`packages/core-opportunity/src/service.ts:264-401`, cited from prior full read) have no data dependency on Research's field set or Qualification's criteria — this remains true regardless of the category-plausibility capability, since D7 (§4/§10 of this audit) confirms the determination structurally never reaches `ResearchSignal`, `FIELD_KIND`, or `toOfferSignals()`, the only paths by which Research output could otherwise reach scoring-adjacent code (`FIELD_KIND` itself, re-confirmed this task at `packages/core-research/src/persist.ts:38-48`, is consulted only by `mapping.ts`'s `toNewResearchSignals()` — a function the determination, per D7, never passes through).

**Classification: ALREADY RESOLVED.**

---

## 12. Opportunity Boundary

D5 requires: MATCH → Qualification passes; MISMATCH → Qualification fails, Opportunity still exists; UNKNOWN → Qualification fails/holds, Opportunity still exists.

Re-confirmed against actual code this task and the prior task:

```text
createOpportunityForOwner (packages/core-opportunity/src/service.ts:112-151)
  and
evaluateQualificationForOwner (packages/core-qualification/src/service.ts:59-78)
  are independent, separately-invoked steps in the worker's own loop
  (apps/worker/src/searchWorker/worker.ts:370-406, re-confirmed this task's §6.2 excerpt):
  createOpportunityForOwner runs unconditionally (findByProspectId ?? createOpportunityForOwner);
  evaluateQualificationForOwner runs afterward, gated only on `deps.qualifications` being present,
  never on the Opportunity's own state.
```

**The current Opportunity state machine already supports D5 without modification.** `OpportunityState = Extract<OpportunityStage, 'NEW' | 'RESEARCHED'>` (`core-opportunity/src/types.ts:16`, cited from prior full read) has no category-plausibility-aware value and needs none — a Qualification failure (MISMATCH or UNKNOWN, mapped to `NOT_QUALIFIED` or `INSUFFICIENT_EVIDENCE`, both already-existing `QualificationState` values, re-confirmed this task at `packages/core-qualification/src/types.ts:9`) has zero effect on `StoredOpportunity.state` today, because nothing in `createOpportunityForOwner` reads `StoredQualification` at all — the two are separately persisted, separately read records, exactly the architecture D5 requires.

**Exact conceptual gap, if any:** none identified. D5 does not require a code change to the Opportunity state machine; it requires only that the new Qualification criterion, once added, map its MISMATCH/UNKNOWN outcome onto one of the two already-existing non-`QUALIFIED` `QualificationState` values (`NOT_QUALIFIED` or `INSUFFICIENT_EVIDENCE`) — which of the two is not decided by any locked document, and is a reasonable, ordinary implementation choice (§18).

**Classification: ALREADY RESOLVED** (state machine requires no change); **NON-BLOCKING** (which existing `QualificationState` value MISMATCH/UNKNOWN map to).

---

## 13. UI Readiness

### 13.1 File inspected

`apps/web/app/(client-finder)/opportunities/[id]/page.tsx` — re-cited from the prior task's direct read (lines 14, 111, 122, 151-155); not re-read line-by-line in this task since HEAD is unchanged and the citation was already independently verified then.

### 13.2 Existing primitives available

```text
score.factors.map(...)        line 111  — an existing aggregate + list-of-items rendering
                                           pattern, directly reusable for D10-B's
                                           aggregate + per-segment list
<h2>Evidence</h2>              line 122  — existing evidence-item rendering (sourceUrl,
                                           sourceLabel, quote, confidence, basis), directly
                                           reusable per D10-C
<h2>Qualification: {state}</h2> line 151  — existing per-criterion satisfied/reason list
  criteria.map(...)             line 153-155, reusable unmodified for the new criterion
```

### 13.3 Exact UI data dependencies vs. current backend exposure

| Data needed | Currently exposed by backend? | Source |
|---|---|---|
| `targetCustomer` (Search context) | Not by the Opportunity read path today — `StoredOpportunity` has no `searchId` (§5.4), and no existing query joins an Opportunity to its Search's `parameters`. Available in principle via `StoredSearch.parameters.targetCustomer` once a `searchId` is resolved (§5.6). | Requires the same Search-resolution step Qualification itself needs (§5) |
| Determination timestamp | Not exposed — no determination record exists yet | Part of D1's new entity (§4.3) |
| Aggregate state | Not exposed — does not exist yet | D1's new entity |
| Segment states | Not exposed — does not exist yet | D1's new entity |
| Evidence | Shape exists and is already rendered elsewhere on the page (§13.2); the specific data does not exist yet | D1's new entity, using the existing evidence-item shape |
| Qualification criterion result | The rendering pattern (`satisfied`/`reason`) already exists and requires no shape change (`QualificationCriterionResult`, re-confirmed unchanged, `core-qualification/src/types.ts:20-26`); only a new criterion *value* needs to appear in the existing `criteria` array | Requires D4's new criterion to exist (§5) |
| Reason | Same as above — the existing `reason: string` field on `QualificationCriterionResult` already carries this | Same as above |

### 13.4 Minimal conceptual API/data changes required

```text
CONCEPTUAL ONLY — NOT IMPLEMENTED

The Opportunity detail page's server-side data loader (page.tsx's own fetch
logic, not re-read in full this task beyond the already-cited line numbers)
would need to additionally fetch:
  1. D1's determination record for (searchId, prospectId) — via whichever
     read method §4.3/§5.7 resolves to
  2. The Search's targetCustomer context — either already available via
     however (1) resolves searchId, or via a direct SearchRepository.getById
     call the page itself makes (the page already has route/data-loading
     code separate from the qualification-service layer, per the existing
     import of getOpportunityQualification directly into the page component,
     re-confirmed at line 14)

No change to QualificationCriterionResult's shape, StoredOpportunity's
shape, or the existing Evidence-item shape is required.
```

**Classification: NON-BLOCKING.** Every data dependency D10 requires is either already exposed via an existing, unchanged shape, or becomes exposed automatically once D1/D4/D5's own (already-scoped) backend work lands — no additional backend contract beyond what §4–§5 already require is needed specifically for the UI.

---

## 14. Validation Readiness

Per D11 (locked), re-assessed against actual repository state:

| Requirement | Instrumentation actually required? | Basis |
|---|---|---|
| MATCH / MISMATCH / UNKNOWN states observed | No new instrumentation — manually observable once D1's entity is queried directly or via the D10 UI | The states are exactly what D1's entity persists; no separate logging/metrics system is required by any locked decision |
| Multi-segment Search | No new instrumentation — a Search created with a compound `targetCustomer` and inspected via the same means | Existing `StoredSearch.parameters.targetCustomer` already carries this; D2's parser output is visible via D1's persisted `target_segments` |
| Two Searches, different `targetCustomer`, same Prospect attribution | No new instrumentation — directly queryable via D1's `(search_id, prospect_id)`-keyed rows, once built | This is exactly what D1's key structure is designed to make observable |
| Manual spot-check of one OBSERVED claim | No instrumentation — a human directly compares a persisted `sourceUrl`/`sourceQuote` against the actual fetched source document, per D11-E's own text ("manual spot-check," not an automated check) | D11 itself specifies this is manual, not automated |
| Provider used / fallback status recording | **Some instrumentation likely required**, though not new machinery — D9 §9 (cited in D11-F) requires this be "recorded" per session; whether the existing `LeadResearch`/Research-run logging already captures which provider/fallback path executed was not verified in this audit (out of scope: no `ai_usage_events`/logging file was inspected in this task). This is the one validation item where "observe manually" may not be sufficient without confirming an existing log/event captures provider identity per run. | Migration `0026_ai_usage_events_fallback_request_kind` (present in the migrations directory, §4.1) suggests fallback-kind tracking already exists at the `ai_usage_events` level, but this was not independently verified in this task |
| Human review ("Would you actually contact this business?") | No instrumentation — the existing, unmodified `MVP_REAL_USER_VALIDATION_TEMPLATE.md` mechanism, explicitly not modified by D11-H | Confirmed unchanged by D11's own text |

**Classification: NON-BLOCKING**, with one flagged **NON-BLOCKING / verify-before-validation** item: confirming that `ai_usage_events`' existing fallback-kind tracking (migration `0026`, name suggests direct relevance, not independently read in this task) already captures per-run provider/fallback identity, or whether D11-F's "recorded" requirement needs a small, additive logging step. This does not block starting implementation of the category-plausibility capability itself — it only needs resolving before a D11 validation session is scheduled.

---

## 15. Implementation Readiness Matrix

| Area | Locked decision | Current repository support | Required engineering change | Status |
|---|---|---|---|---|
| D0 MVP boundary | MVP enhancement; 19-criterion exit not reopened | `MVP_SCOPE_BOUNDARY.md`'s exit criteria confirmed unaffected (cited, prior task) | None — scheduling/planning only | ALREADY RESOLVED |
| D1 persistence identity | Dedicated Search+Prospect entity | No existing table can express `(search_id, prospect_id)` key without migration; `research_signals` confirmed lacks `search_id` (§4.2) | New table + repository interface + Postgres implementation (§4.3) | REQUIRED — NON-BLOCKING (shape is clear; exact schema is ordinary work) |
| D2 parsing | Deterministic parsing + ANY-match | No parser exists anywhere (§7.2, confirmed by search) | New pure parsing function; location undecided among 3 valid options (§7.3) | REQUIRED — NON-BLOCKING |
| D3 evidence | First-party primary, UNKNOWN on insufficiency | Existing evidence-item shape (`sourceUrl`/`sourceLabel`/`sourceQuote`/`confidence`/`basis`) directly reusable (§8) | Reuse existing shape inside the new D1 entity; no new evidence primitive | REQUIRED — NON-BLOCKING |
| D4 Qualification | Q1 — new, distinct criterion | `QUALIFICATION_CRITERIA`/`rules.ts`/`evaluator.ts` extension pattern already proven (per `PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md`, cited in prior task); short-circuit interaction newly flagged (§5.9) | New criterion id, rule function, evaluator wiring; explicit decision on short-circuit position | REQUIRED — NON-BLOCKING |
| D5 Opportunity behavior | MATCH passes; MISMATCH/UNKNOWN fail Qualification, do not block Opportunity | Confirmed: `createOpportunityForOwner`/`evaluateQualificationForOwner` already independent (§12) | None to the state machine; map MISMATCH/UNKNOWN to an existing `QualificationState` value | ALREADY RESOLVED (state machine); NON-BLOCKING (which existing state value) |
| D6 attribution | Per Search+Prospect, historical preserved, no cross-search overwrite | Structurally supported by `Prospect`'s `UNIQUE(search_id, company_id)` (§4.2, item 8) | D1's entity keyed by `(search_id, prospect_id)` (same as D1 row) | REQUIRED — NON-BLOCKING (same work as D1) |
| D7 ResearchSignal isolation | Must never become a `ResearchSignal` row / `FIELD_KIND` entry | Confirmed structurally guaranteed once D1's entity is separate from `LeadResearch`/`allObservations()` (§4.2 item 4, §10) | None beyond building D1's entity as a genuinely separate table | ALREADY RESOLVED |
| D8 Research context | Option B — preserve `ResearchProviderInput`, use orchestration/dependencies | `core-opportunity`'s `OpportunityDeps.searches` pattern is a direct, working precedent (§6.7) | New `searches: SearchRepository` dependency on `ResearchDeps` (or one of 2 other sub-candidates) + threading into `ResearchInput`/`prompt.ts` | REQUIRED — NON-BLOCKING (candidate selection) |
| D9 provider neutrality | Full neutrality incl. fallback | Confirmed structurally enforced by `researchModelFactory.ts`'s existing sole-branch-point design (§9) | None to adapters; new content must enter only via `ResearchInput`/`prompt.ts` | ALREADY RESOLVED |
| D10 UI | Opportunity detail only; aggregate+segment; existing evidence shape; literal MATCH/MISMATCH/UNKNOWN | Existing Score/Evidence/Qualification section patterns directly reusable (§13.2) | New page section; loader additions to fetch D1's determination + Search context | REQUIRED — NON-BLOCKING |
| D11 validation | Categorical coverage, no numeric threshold; manual spot-check; provider/fallback recorded; template unmodified | Every requirement is manually observable once D1–D5/D10 are built (§14); provider/fallback recording mechanism not independently confirmed | Possibly a small additive step if `ai_usage_events`'s existing fallback tracking does not already capture what D11-F needs (unverified — flagged, not blocking) | NON-BLOCKING (one item flagged as verify-before-validation, not verify-before-implementation) |

---

## 16. Engineering Dependency Graph

```text
Search
  (StoredSearch.parameters.targetCustomer — EXISTS, unchanged)
  ↓
Search-scoped context
  (searchId/targetCustomer reaching Research's orchestration layer —
   REQUIRES D8 sub-candidate selection; architecturally UNBLOCKED, three
   equally valid implementations exist, precedent exists for the
   recommended one: core-opportunity's OpportunityDeps.searches)
  ↓
Deterministic targetCustomer parsing
  (REQUIRES a new pure function; location UNDECIDED among 3 valid options,
   none blocking; D2's policy is fully specified)
  ↓
Research orchestration
  (runResearchForOwner — REQUIRES threading parsed segments into
   ResearchInput/prompt.ts; mechanism clear, not yet built)
  ↓
Provider-neutral Research
  (ResearchModel/adapters — CONFIRMED unchanged, no dependency, no blocker)
  ↓
Category plausibility determination
  (evaluation logic producing per-segment + aggregate MATCH/MISMATCH/UNKNOWN
   — REQUIRES new logic; WHERE it executes, exact prompt schema addition,
   NOT decided by any locked document, but bounded by D2/D3's policy)
  ↓
Search+Prospect persistence
  (D1's new entity — REQUIRES new table/repository; key structure
   (search_id, prospect_id) is UNAMBIGUOUS; exact schema/migration NOT yet
   authorized, ordinary engineering work)
  ↓
Qualification criterion
  (REQUIRES: (a) a new rule function [clear], (b) a Search-resolution step
   Qualification does not have today [§5 — genuinely open engineering
   choice, 2 valid shapes], (c) a decision on short-circuit position
   [newly flagged, §5.9, non-blocking])
  ↓
Opportunity remains unchanged
  (CONFIRMED already true — no code change required, no dependency on
   anything upstream in this chain)
  ↓
Opportunity detail UI
  (REQUIRES the page's data loader to fetch D1's entity + resolved Search
   context — depends on Search+Prospect persistence AND the Qualification
   read-path resolution being built first, since both need the same
   Search-resolution step)
  ↓
D11 validation
  (REQUIRES a funded provider account [environment precondition, D11-I,
   unrelated to any product/architecture decision] + everything above to
   exist; one flagged, non-blocking verification item on provider/fallback
   recording, §14)
```

**Unresolved dependencies in this graph** (all NON-BLOCKING per §17, not requiring a further product decision):

1. Search-scoped context resolution mechanism (D8 sub-candidate).
2. Deterministic parsing function location.
3. Where the evaluation logic itself executes (LLM-integrated vs. separate deterministic-aggregation step over LLM-produced per-segment evidence).
4. Qualification's Search-resolution mechanism (new `QualificationDeps` dependency vs. D1's own repository resolving it internally) — this dependency is shared with, and should be resolved consistently alongside, the UI's own need for the same resolution (§13.4).
5. Short-circuit position of the new Qualification criterion relative to `NEED_DETECTED`.
6. Whether `ai_usage_events`' existing fallback-kind tracking already satisfies D11-F's "recorded" requirement (verify-before-validation, not verify-before-implementation).

---

## 17. Blocking Issues

**None identified.**

No finding in this audit rises to the definition given in the task instructions: *"Engineering cannot implement the capability safely without first making another product/architecture decision or resolving a repository contract ambiguity."* Every open item identified in §4–§14 has at least one, and typically two, architecturally valid implementations directly supported by existing repository patterns (most load-bearing: `core-opportunity`'s `OpportunityDeps.searches`/`createOpportunityForOwner` pattern, which independently resolves both the D8 Research-context question and the D5/§5 Qualification-read-path question via the same well-established precedent). None of the eleven locked decisions (D0–D11) contradicts another, and none requires a repository capability that does not exist or cannot be added without further product input.

---

## 18. Non-Blocking Implementation Details

```text
NON-BLOCKING — resolvable by ordinary engineering judgment, not requiring
further Product Owner input:

1. Which D8 Option B sub-candidate (ResearchDeps.searches dependency,
   widened RunResearchInput, or a second research() parameter) — §6.7,
   §16 item 1. Recommended, non-binding: ResearchDeps.searches, mirroring
   OpportunityDeps (direct working precedent, no comparable precedent for
   the alternatives).

2. Deterministic parsing function location (core-search/core-service-profile
   pure function, worker-orchestration step, or inside core-research) —
   §7.3, §16 item 2.

3. Where the per-segment/aggregate evaluation logic executes — §16 item 3.

4. Qualification's Search-resolution mechanism (new QualificationDeps
   dependency vs. D1's repository resolving searchId internally) — §5.7,
   §16 item 4. This choice should be made once and reused by the UI's
   data loader (§13.4), which needs the identical resolution.

5. Whether the new Qualification criterion participates in the existing
   NEED_DETECTED short-circuit or is evaluated unconditionally — §5.9,
   §16 item 5. Newly identified in this audit; not previously flagged in
   any prior Path 2 governance document.

6. Which existing QualificationState value (NOT_QUALIFIED vs.
   INSUFFICIENT_EVIDENCE) MISMATCH/UNKNOWN should map to — §12.

7. Exact table/column/repository-method names for D1's new entity — §4.3.

8. Exact splitting rule for D2's deterministic parser (delimiter
   precedence) — inherited from the Consolidated Scope-Lock §18, not
   re-litigated here.

9. Whether ai_usage_events' existing fallback-kind tracking already
   satisfies D11-F's per-session provider/fallback recording requirement,
   or needs a small additive step — §14. Verify before scheduling a D11
   validation session, not before starting implementation.

10. Illustrative-only names used throughout this document and its
    predecessor (CATEGORY_PLAUSIBLE criterion id, table name, repository
    method names) — none approved, all placeholder.
```

---

## 19. Final Readiness Classification

```text
READY EXCEPT FOR EXPLICITLY DEFERRED IMPLEMENTATION DETAILS
```

**Evidence for this classification, not preference:**

- Every one of the eleven locked decisions (D0–D11) has a concrete, source-verified anchor in the current repository — none requires an architecture the codebase cannot support, and none is contradicted by another locked decision or by the actual repository contracts (§3, re-confirmed independently across §4–§14).
- The single highest-risk area — Search+Prospect persistence and attribution (D1/D6/D7) — is fully resolvable within the existing schema's own dedup guarantees (`Prospect`'s `UNIQUE(search_id, company_id)`, re-verified directly against the migration SQL in this task) plus one new, clearly-keyed table. No alternative, contradictory persistence shape competes with this one.
- Every remaining open question (§16's six unresolved dependency-graph items, §18's ten non-blocking details) has at least one existing, working precedent already in this exact repository to follow — most centrally, `core-opportunity`'s `OpportunityDeps.searches`/`createOpportunityForOwner` pattern, which independently and consistently resolves both the D8 Research-context question and the D5/Qualification-read-path question.
- No finding meets the task's own definition of a blocker (§17): nothing requires a further product/architecture decision, and no repository contract ambiguity was found that cannot be resolved by an engineer reading the existing, analogous code already in the same repository.
- The one item flagged as needing verification before proceeding (§14, `ai_usage_events` fallback tracking) gates only a future *validation session*, not the start of implementation itself.

This classification is not "READY FOR IMPLEMENTATION" outright, because six genuine engineering choices (§16, §18 items 1–6) remain open and were not narrowed to one answer by any locked decision — an implementer beginning work today would need to make these calls explicitly, and a second implementer could reasonably make a different (also valid) call on one or more of them without violating any locked decision. This distinguishes the current state from "NOT YET READY," which would require at least one genuinely blocking gap per §17's definition — none was found.

---

## 20. Repository Safety

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
HEAD:                          5992b82b9adff492c480442d68a954f2a03bfb28  (UNCHANGED)

git diff --name-only (unstaged, pre-existing, untouched by this task):
  apps/web/tsconfig.tsbuildinfo
  apps/worker/src/searchWorker/worker.test.ts
  apps/worker/src/searchWorker/worker.ts
  packages/core-discovery/src/service.test.ts
  packages/core-discovery/src/service.ts

git diff --cached --name-only:  (empty — nothing staged)

git status --porcelain=v1 additionally shows, as untracked ("??"), the full
pre-existing requirement/*.md set (including the prior task's Consolidated
Scope-Lock document), .claude/, and CLAUDE.md — all untouched by this task,
plus exactly ONE new untracked file created by this task:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_IMPLEMENTATION_READINESS_AUDIT.md
```

**Confirmed:**

```text
HEAD unchanged:                                   YES (5992b82b9adff492c480442d68a954f2a03bfb28)
Pre-existing tracked modifications unchanged:      YES (same 5 files; none edited by this task —
                                                     several were read read-only for citation
                                                     verification: apps/worker/src/searchWorker/
                                                     worker.ts was grepped, not modified)
Pre-existing untracked files unchanged:            YES (including the Consolidated Scope-Lock
                                                     document from the prior task — not modified)
Only the new audit document created:               YES
Production code unchanged:                         YES (0)
Tests unchanged:                                    YES (0)
PRD unchanged:                                       YES (0)
Configuration unchanged:                              YES (0)
Database unchanged:                                    YES (0)
Migrations unchanged:                                   YES (0 — read only, none created/modified)
Provider code unchanged:                                 YES (0)
Worker code unchanged:                                     YES (0)
Frontend unchanged:                                          YES (0)
Nothing staged:                                                YES (none)
No commit:                                                       YES (none)
No push:                                                           YES (none)
No live API calls:                                                    YES (0 — no Anthropic/
                                                                        OpenAI/Gemini/Google
                                                                        Places call made)
```

---

## STOP CONDITION

`requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_IMPLEMENTATION_READINESS_AUDIT.md` has been produced and repository safety has been verified (§20). No implementation was performed. No existing governance document, including the Consolidated Scope-Lock, was modified. The application was not run. No live validation was performed. This is the sole deliverable of this task.
