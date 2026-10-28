# Path 2 — D7 Product Decision

## 1. Status

```text
D7 STATUS: DECIDED
D7 CHOICE: CANDIDATE C — OUTSIDE THE FIELD_KIND / RESEARCHSIGNAL MECHANISM
           (structurally required by the already-locked D1)

IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This is a documentation/governance-only decision record. It resolves D7 — the treatment of `FIELD_KIND`/`ResearchSignal.kind` classification for the Path 2 category-plausibility determination — using repository evidence traced in this task, and does not implement anything. No `FIELD_KIND` entry is added or removed in code; no `mapping.ts`, `schema.ts`, repository, or database file is modified.

## 2. Locked Boundaries (Not Reopened)

Per `requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3–§4 and `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md` §2, §13:

```text
D0  MVP status:               MVP enhancement — does not reopen the 19-criterion exit.
D1  Output location:          DEDICATED SEARCH + PROSPECT CATEGORY-PLAUSIBILITY
                               DETERMINATION. Not Prospect-global. Not
                               LeadResearch.targetCustomers. Not routed through R-71.
D2  Multi-segment semantics:  Deterministic parsing + ANY-match (OR) semantics.
D3  Evidence sufficiency:     First-party primary; search-derived metadata supporting;
                               UNKNOWN on insufficient evidence.
D4  Qualification:            Q1 — new, distinct Qualification criterion; not routed
                               through R-71 Need Detection.
D5  State behavior:           MATCH passes; MISMATCH fails Qualification but does not
                               block Opportunity creation; UNKNOWN fails/holds; no new
                               Opportunity state.
D6  Persistence/attribution:  PER SEARCH + PROSPECT; historical attribution preserved;
                               cross-search overwrite NOT ALLOWED; Qualification reads
                               the current Search + Prospect determination.
D8  Research input contract:  OPTION B — preserve the provider-facing contract; carry
                               Search-scoped context through Research orchestration/
                               dependencies. NON-BINDING. IMPLEMENTATION NOT AUTHORIZED.
```

None of D0–D6 or D8 is reopened, altered, or reinterpreted by this document.

## 3. The Exact D7 Question

Restated using the repository's own established terminology (`requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3, D7 section; `requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §12, Decision 9):

> Should the new field be assigned an entry in `FIELD_KIND` (`packages/core-research/src/persist.ts:38-48`), and does either choice have any consequence for existing scoring/research infrastructure?

The prior documents framed this as a binary — **Include** (add an explicit `FIELD_KIND` entry) vs. **Exclude** (omit, accept the silent `'WEBSITE'` default) — under the working assumption that the category-plausibility determination would be a `LeadResearch` field flowing through `allObservations()`. That assumption predates D1's later lock. This document re-verifies the live persistence path directly against current code (§4) and re-evaluates D7 against D1's now-locked choice (§6–§7), before resolving it (§8).

## 4. The Live Persistence Path — Verified Directly

Traced and re-read in this task, exactly as it exists in the repository today:

```text
Research schema (leadResearchSchema, schema.ts:176-201)
    ↓
allObservations() (schema.ts:229-249) — hardcoded literal field list
    ↓
toNewResearchSignals() (mapping.ts:16-30) — the LIVE mapping function
    ↓
ResearchSignalRepository (repository.ts:13-29)
    ↓
createPgResearchSignalRepository() (pgRepository.ts:50) — concrete Postgres implementation
    ↓
research_signals table (columns include prospect_id, field, kind, classification, signal, ...)
```

`packages/core-research/src/mapping.ts:1,16-30`, read directly in this task:

```ts
import { FIELD_KIND } from './persist';
import { allObservations, type LeadResearch } from './schema';
import type { NewResearchSignalInput } from './types';

export function toNewResearchSignals(research: LeadResearch): readonly NewResearchSignalInput[] {
  return allObservations(research).map((observation) => ({
    field: observation.field,
    kind: FIELD_KIND[observation.field] ?? 'WEBSITE',
    classification: observation.classification,
    signal: observation.value,
    confidence: observation.confidence,
    basis: observation.basis,
    sources: observation.evidence.map((evidence) => ({
      sourceUrl: evidence.sourceUrl,
      sourceQuote: evidence.quote,
      sourceLabel: evidence.sourceLabel,
    })),
  }));
}
```

**What happens when a Research field has no explicit `FIELD_KIND` entry — verified, not guessed:** it does **not** get rejected, and it does **not** become `UNKNOWN`. It **silently defaults to `'WEBSITE'`**, via the `?? 'WEBSITE'` fallback at `mapping.ts:19` (the live path) and, identically, at `persist.ts:81` (the confirmed-inactive `toResearchRows()` path — reconfirmed in this task: `storeResearch`/`ResearchRepository` (`persist.ts`) has no concrete implementation anywhere in the repository and is imported only by `persist.ts` itself, `index.ts`'s re-export, and its own test file; no production call site exists). `FIELD_KIND` itself (`persist.ts:38-48`) is a plain `Record<string, ResearchSourceKind>` keyed by field name — a field absent from it is simply never looked up by name; there is no separate "reject" or "error" branch anywhere in either mapping function.

## 5. Candidate D7 Choices

Preserving the repository's own established candidates and terminology, mapped onto the task's naming:

**Candidate A — Give category plausibility its own explicit `FIELD_KIND` classification.** Add an entry (e.g., `categoryPlausibility: 'WEBSITE'`) to `persist.ts:38-48`. Corresponds to the prior documents' "Include."

**Candidate B — Reuse an existing `ResearchSignal` kind (the silent `'WEBSITE'` default).** Omit an entry; the field falls back to `'WEBSITE'` via `mapping.ts:19`'s `?? 'WEBSITE'`. Corresponds to the prior documents' "Exclude."

**Candidate C — Keep the field outside the `FIELD_KIND` mechanism entirely / use another representation.** Do not persist the determination as a `LeadResearch` field/`ResearchSignal` row at all — i.e., it never becomes an entry `allObservations()` or `FIELD_KIND` would ever need to classify.

For each, per the task's required dimensions:

| Dimension | Candidate A (own entry) | Candidate B (silent `'WEBSITE'` default) | Candidate C (outside the mechanism) |
|---|---|---|---|
| Effect on live `ResearchSignal` persistence | Only applicable if the determination is itself a `ResearchSignal` row (i.e., only if D1 had chosen the `LeadResearch`-field candidate) — an accurate `kind` value is stored | Same precondition — an inaccurate/generic `kind` value (`'WEBSITE'`) is stored | Not applicable — no `ResearchSignal` row is ever created for this determination in the first place |
| Effect on `kind` | Explicit, accurate classification | Implicit, `'WEBSITE'` regardless of the field's true nature | No `kind` value exists for this data at all — it lives in a different persistence shape entirely |
| Effect on `mapping.ts` | `FIELD_KIND[fieldName]` resolves to the explicit entry | `FIELD_KIND[fieldName]` misses, falls back to `'WEBSITE'` | `mapping.ts`/`allObservations()` never processes this field — it is not part of `leadResearchSchema` |
| Effect on downstream consumers | Reaches every consumer of `StoredResearchSignal.kind` (see §6) with an accurate value | Reaches the same consumers with a generic, arguably-misleading value | Reaches none of them — structurally absent from `StoredResearchSignal` |
| Effect on Qualification | Not directly — Qualification's `EVIDENCE_PRESENT`/`NEED_DETECTED` criteria do not read `kind` (`packages/core-qualification/src/rules.ts:26-28,42-51,67-79`, reconfirmed in this task: neither function references `.kind`); a future D4 criterion (not yet built) would read the determination via whatever repository D1's dedicated entity uses, not via `kind` | Same as A | Same as A/B — no `kind`-mediated effect either way; a future D4 criterion reads D1's dedicated entity directly |
| Effect on scoring/ranking | See §6 — a live, non-hypothetical consequence via `toOfferSignals()`/`suggestOffers()`, gated by `TOPICAL_FIELDS` | Same live consequence, with a less accurate `kind` | None — structurally impossible, since no `StoredResearchSignal` row exists for this data (§7) |
| Effect on the inactive legacy `persist.ts` path | Pre-commits a `kind` classification that would apply automatically if `acq_lead_research`/`ResearchRepository` is ever reactivated (forward-looking only; confirmed no live consequence today, §4) | Field would default to `'WEBSITE'` there too, if ever reactivated | Not applicable — the field never reaches `toResearchRows()`, since it is never a `LeadResearch` observation |
| Provider neutrality | No effect either way — `FIELD_KIND` is consulted entirely below `ResearchModel`/the provider adapters (§9 of `PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md`); unrelated to this dimension | Same — no effect | Same — no effect |
| D6 Search + Prospect attribution | Does **not** help satisfy D6 — `ResearchSignal`/`supersedePrevious(prospectId, at)` remain Prospect-only-keyed regardless of `kind` (`repository.ts:18`) | Same | **Structurally required by D1** — D1's dedicated Search+Prospect entity is precisely the mechanism chosen to satisfy D6, and it is not a `ResearchSignal` row at all |
| Future maintainability | A reader of `FIELD_KIND` would see an (unused, since D1 forecloses this) entry for a field that is never actually classified through this table | A reader sees a silent, generic default with no record that this was a deliberate choice for this field | Cleanest — nothing to maintain in `FIELD_KIND`/`mapping.ts` for this field at all, consistent with the field's actual persistence shape |

No ranking beyond this factual comparison is asserted; the decision in §8 follows from the D1/D6/scoring findings below, not from a preference ordering.

## 6. Scoring Boundary — Verified Live Consequence, Not Assumed

The task requires explicitly verifying whether a `FIELD_KIND` entry could cause the category-plausibility field to become scoring/offer-detection input anywhere in the **currently active** system. Prior Path 2 documents (`PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3 D7; `PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §12) concluded "neither choice changes live scoring today," reasoning only from the confirmed-inactive `persist.ts`/`acq_lead_research`/seven-factor `scoreProspect()` path. Re-tracing `.kind`'s consumers directly in this task surfaces a **live** path those documents did not name:

```text
StoredResearchSignal.kind (populated via FIELD_KIND, mapping.ts:19)
        ↓
toOfferSignals(stored, company)   packages/core-opportunity/src/adapters.ts:175-199
  for (const row of stored) {
    if (row.classification === 'UNKNOWN' || row.signal === null) continue;
    if (TOPICAL_FIELDS.has(row.field)) continue;   // R-71 exclusion — BY FIELD NAME
    if (sourceConflict) continue;                   // R-70 exclusion
    signals.push({ kind: row.kind, signal: row.signal, confidence: row.confidence, ... });
  }
        ↓
suggestOffers(offerSignals, [rule])   packages/core-opportunity/src/service.ts:133
  (called unconditionally inside createOpportunityForOwner, service.ts:112-151)
        ↓
core-acquisition/src/offer.ts:85 — `if (!rule.triggers.includes(signal.kind)) return false;`
        ↓
top !== undefined  →  Opportunity.needDetected   (service.ts:135)
```

**This is a live, unconditional path**, verified by direct inspection in this task: `createOpportunityForOwner` is called for every discovered prospect in the worker's canonical pipeline (`apps/worker/src/searchWorker/worker.ts:370-382`), and it calls `suggestOffers()` (imported from `@acos/core-acquisition`, `core-opportunity/src/service.ts:6,133`) unconditionally, computing `needDetected` from its result. `suggestOffers()`'s rule-matching (`core-acquisition/src/offer.ts:85`) filters candidate offer rules by `signal.kind` — so **a `ResearchSignal`'s `kind` value genuinely can affect whether it matches an offer-trigger rule**, in the live MVP path — a materially different (and more consequential) finding than "only the confirmed-inactive scorer reads `kind`."

**This is separate from, and confirmed distinct in this task from, the seven-factor `scoreProspect()`/`scoreResearchedProspect()` path** (`core-research/src/service.ts:145-159`, `core-research/src/scoringAdapter.ts`, also a live-callable function that reads `.kind` via `toScoringSignals()`): this function is exported from `core-research/index.ts` but has **no traced call site inside `apps/worker/src/searchWorker/worker.ts`** — the worker's only automatic scoring step is `scoreOpportunityForOwner` (`core-opportunity/src/service.ts:264-401`, the four-factor `FACTOR_WEIGHTS`/`OpportunityScore` model), which does not consume `ResearchSignal.kind` at all (verified: no `.kind` reference in `core-opportunity/src/service.ts`'s scoring section). `scoreResearchedProspect()` is therefore not part of the automatic search pipeline, even though it is a live, exported function.

**Crucially, this live consequence is gated entirely by the `TOPICAL_FIELDS` field-name check (`adapters.ts:186`), which runs BEFORE `kind` is ever read.** A signal whose `field` name is in `TOPICAL_FIELDS` (`packages/core-opportunity/src/adapters.ts:152`: `new Set(['companySummary', 'businessModel', 'targetCustomers'])`) never reaches `OfferSignal`/`suggestOffers()` regardless of its `kind`. D4 (locked) already requires the category-plausibility field to **not** be added to `TOPICAL_FIELDS` and to **not** be routed through `suggestOffers()`/`toOfferSignals()` at all — so satisfying D4 already requires this field to never appear in `toOfferSignals()`'s input `stored: readonly StoredResearchSignal[]` in the first place. The only way to guarantee that structurally, rather than by a field-name exclusion list that must be remembered to include the new field, is for the determination to never become a `StoredResearchSignal` row at all — which is exactly what D1's already-locked dedicated Search+Prospect entity does (§7).

```text
SCORING / RANKING: UNCHANGED
```

`FACTOR_WEIGHTS`, `OpportunityScore`, and `rankOpportunities` (`packages/core-opportunity/src/service.ts:264-401`) are not modified, referenced, or affected by this decision. This document does not modify them and does not authorize modifying them. The newly-verified `toOfferSignals()`/`suggestOffers()` consequence above concerns **offer/need-detection matching** (R-11/R-12), not the `OpportunityScore` seven-... four-factor scoring algorithm itself — it is recorded here because the task requires verifying every live consumer of `FIELD_KIND`-derived `kind`, not because it changes the "scoring unchanged" conclusion for `FACTOR_WEIGHTS`/`OpportunityScore`/ranking, which remains true regardless of D7's resolution.

**Does adding a `FIELD_KIND` entry automatically mean "scored"?** No — verified directly: `FIELD_KIND` only has any effect at all for a field that (a) is part of `leadResearchSchema`, (b) is enumerated in `allObservations()`, and therefore (c) becomes a `StoredResearchSignal` row. A `FIELD_KIND` entry for a field that never reaches that pipeline (as D1 already ensures for category plausibility) has no effect whatsoever — it would simply be dead, unreferenced code in `persist.ts`.

## 7. Why D1 Forecloses Candidates A and B

D1 (`requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` §3, DECIDED) selected:

```text
USE A NEW DEDICATED SEARCH + PROSPECT CATEGORY-PLAUSIBILITY DETERMINATION.
```

explicitly **not** a `LeadResearch` field, **not** a `ResearchSignal` kind, and **not** `LeadResearch.targetCustomers`. Per `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md` §4.4 (Candidate 3, the candidate D1 selected): *"Risk of coupling to scoring: None by default — a new entity outside `ResearchSignal`/`FIELD_KIND` entirely is not consulted by the (inactive) `acq_lead_research` scorer unless deliberately wired to it."* This task's own re-trace (§6) refines that finding: the entity is not consulted by **either** the inactive `acq_lead_research` scorer **or** the live `toOfferSignals()`/`suggestOffers()` offer-detection path, for the same structural reason — it is not, and by D1's own text must not become, a `StoredResearchSignal` row.

**Consequence for D7:** because the category-plausibility determination will never be enumerated by `allObservations()` (`schema.ts:229-249`) and will never flow through `toNewResearchSignals()` (`mapping.ts:16-30`), the question `FIELD_KIND[fieldName] ?? 'WEBSITE'` poses — "does this field name have an entry?" — **never arises for it**. There is no field name for `FIELD_KIND` to look up, because the determination is not a `LeadResearch` field at all. Candidate A (add an entry) and Candidate B (accept the default) are both **inapplicable**, not merely disfavored — both presuppose a persistence shape D1 has already ruled out.

## 8. D7 Decision

```text
D7 STATUS: DECIDED
D7 CHOICE: CANDIDATE C — KEEP THE CATEGORY-PLAUSIBILITY DETERMINATION OUTSIDE THE
           FIELD_KIND / RESEARCHSIGNAL CLASSIFICATION MECHANISM ENTIRELY.

IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

**Exact decision:** The category-plausibility determination is persisted via D1's dedicated Search + Prospect entity, not as a `LeadResearch` field or a `ResearchSignal` row. Consequently, it does not participate in `allObservations()`, is never looked up in `FIELD_KIND` (`persist.ts:38-48`), never receives (or needs) a `kind` classification, and never becomes an input to `mapping.ts`'s `toNewResearchSignals()`, `toOfferSignals()` (`core-opportunity/src/adapters.ts:175-199`), `suggestOffers()` (`core-acquisition/src/offer.ts`), or `toScoringSignals()`/`scoreProspect()` (`core-research/src/scoringAdapter.ts`, `service.ts:145-159`). No `FIELD_KIND` entry is added for this field; none is needed, and none is silently defaulted either, because the mechanism `FIELD_KIND` governs does not apply to it.

**Rationale, grounded in repository evidence:**
1. D1 is already `DECIDED` as a dedicated Search+Prospect entity, explicitly distinct from `LeadResearch`/`ResearchSignal` (§7).
2. `FIELD_KIND`'s only live consumers — `mapping.ts:19` (persisted `kind` accuracy) and, transitively, `toOfferSignals()`/`suggestOffers()` (§6, a live, previously under-characterized consequence verified in this task) — operate exclusively on `StoredResearchSignal` rows produced from `LeadResearch` observations. A determination that is never such a row is structurally unreachable by either consumer.
3. This resolution requires no new mechanism, no code change, and no schema decision beyond what D1 already fixed — it is the direct, mechanical consequence of D1, not a new architectural choice.
4. It is the only D7 candidate that makes D4's "not routed through R-71/`suggestOffers()`/`toOfferSignals()`" requirement structurally guaranteed, rather than dependent on remembering to keep the field out of `TOPICAL_FIELDS`-adjacent processing by convention.

**Live persistence implications:** None. No `research_signals` row is created for this determination; whatever table/repository D1's dedicated entity eventually uses (not designed, scoped, or authorized by this document) is entirely separate from `ResearchSignalRepository`/`pgRepository.ts`.

**Scoring boundary:**
```text
SCORING / RANKING: UNCHANGED
```
`FACTOR_WEIGHTS`, `OpportunityScore`, `rankOpportunities` (`core-opportunity/src/service.ts:264-401`) are unaffected — this was already true under any D7 candidate (§6), and remains true here. The newly-verified `toOfferSignals()`/`suggestOffers()` live consequence (§6) is rendered moot for this specific field by D1's persistence choice: since the determination is never a `StoredResearchSignal`, it can never reach `toOfferSignals()`'s input regardless of any `kind` value.

**R-71 boundary:**
```text
R-71: UNCHANGED
```
`TOPICAL_FIELDS` (`core-opportunity/src/adapters.ts:152`), `suggestOffers()`, and `toOfferSignals()` are not modified. The category-plausibility field is not added to `TOPICAL_FIELDS` (consistent with D4's "must not alter" requirement) and — per this decision — cannot reach `suggestOffers()`/`toOfferSignals()` at all, since it is never a `StoredResearchSignal` row in the first place. This is a stronger guarantee than relying on the `TOPICAL_FIELDS` exclusion list alone.

**D6 compatibility:**
```text
D6: UNCHANGED
```
This decision does not collapse Search + Prospect attribution into Prospect-global storage. D1's dedicated entity remains the mechanism satisfying D6's "PER SEARCH + PROSPECT," "HISTORICAL ATTRIBUTION PRESERVED," and "CROSS-SEARCH OVERWRITE NOT ALLOWED" requirements; D7's resolution confirms that mechanism is not diverted back into the Prospect-only-keyed `ResearchSignal`/`FIELD_KIND` path Candidates A/B would have required.

**D8 boundary:**
```text
D8: OPTION B
NON-BINDING
IMPLEMENTATION NOT AUTHORIZED
```
Unaffected and not reopened. D7 concerns Research's *output*-side persistence classification; D8 concerns Research's *input*-side context contract (`ResearchProviderInput`). The two are independent, and this document does not alter D8 in any way.

**Implementation remains unauthorized:** This decision fixes a classification/persistence-mechanism question for future scope-lock purposes only. It does not create, modify, or authorize any change to `packages/core-research/src/persist.ts`, `mapping.ts`, `schema.ts`, any repository, or any database schema/migration. D1's dedicated Search+Prospect entity itself remains unbuilt and separately unauthorized, exactly as recorded in the Final Decision Record.

## 9. Explicit Non-Goals

This task did **not**:

- modify `FIELD_KIND` in code, or any other part of `packages/core-research/src/persist.ts`
- modify `mapping.ts`, `schema.ts`, any repository, or the database schema
- add migrations or tests
- modify `ResearchProviderInput`, `ResearchModel`, or any Anthropic/OpenAI/Gemini adapter
- modify worker code
- modify Qualification, Discovery, R-71, scoring/ranking, or Opportunity creation
- modify the UI or the PRD
- reopen or alter D0–D6 or D8
- run any live API call
- stage, commit, or push anything

## 10. Repository Safety / Audit Record

```text
Branch:                       phase-17-r34-worker-orchestration

Recorded starting HEAD
(git rev-parse HEAD, run at task start):     5992b82b9adff492c480442d68a954f2a03bfb28

HEAD after task completion:                  5992b82b9adff492c480442d68a954f2a03bfb28
                                              (unchanged — verified below)

Production code changed:      0
Tests changed:                 0
PRD changed:                    0
Configuration changed:           0
Database/migrations changed:      0
Provider code changed:             0
Worker code changed:                 0
Live API calls:                       0
Staged:                                 none
Commit:                                  none
Push:                                     none

File created by this task (the only new file):
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D7_PRODUCT_DECISION.md

Established-location check (per task instruction §9): `FIELD_KIND`/D7 has no
dedicated prior decision document — it appears only as a section inside
`PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` (§3, still reading
`PRODUCT OWNER DECISION REQUIRED`) and as analysis within
`PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md` §12 and
`PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md` §11. Neither
is a dedicated D7 decision record, and the established precedent set when D8
was separately decided (`PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md`,
created as its own file without mirroring into the Final Decision Record) was
followed here: a new, dedicated file was created per the task's own named
fallback, and `PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md` was
read but NOT modified.

Files read for this task, not modified:
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D0_D5_DECISION_PREPARATION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_PRODUCT_DECISION.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_D8_IMPLEMENTATION_SCOPE_MAP.md
  requirement/PATH_2_CATEGORY_PLAUSIBILITY_PRODUCT_DECISIONS.md
  requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_IMPLEMENTATION_SCOPE.md
  requirement/PATH_2_RESEARCH_CATEGORY_PLAUSIBILITY_SCOPE_LOCK.md
  packages/core-research/src/persist.ts
  packages/core-research/src/mapping.ts
  packages/core-research/src/service.ts
  packages/core-research/src/scoringAdapter.ts
  packages/core-opportunity/src/adapters.ts (lines 152-199)
  packages/core-opportunity/src/service.ts (lines 128-160)
  packages/core-discovery/src/types.ts (prior session)
  apps/worker/src/searchWorker/worker.ts (lines 358-410)
  (grep-based verification, not full reads: packages/core-qualification/src/rules.ts
  for `.kind` references; repository-wide search for `storeResearch`/`ResearchRepository`
  and `scoreResearchedProspect` call sites)

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

D7 is recorded as **DECIDED — CANDIDATE C**, with **IMPLEMENTATION AUTHORIZATION: NOT GRANTED**. No `FIELD_KIND`, `mapping.ts`, `schema.ts`, repository, or database file is created or modified by this task. D0–D6 and D8 are unchanged. This task ends with the D7 decision recorded as above and repository safety verified.
