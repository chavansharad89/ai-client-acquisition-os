# Path 2 — Category Plausibility

## F-1 Segment Evidence Confidence/Basis — Product Decision Preparation

```text
DOCUMENT TYPE: READ-ONLY PRODUCT-DECISION PREPARATION
STATUS: PRODUCT OWNER DECISION REQUIRED
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

No production code, test, schema, migration, provider, worker, UI, PRD,
configuration, governance, or D11-H record change was made. No live API or
provider call was made. This document is the only file created.

---

### 1. Purpose

This document prepares a Product Owner decision on finding **F-1** from
`PATH_2_CATEGORY_PLAUSIBILITY_D11_LIVE_VALIDATION_GATE_AUDIT.md` §10:

> Category-plausibility segment evidence has no `confidence` or `basis`. This is a gap
> against D10-C and D11 §6.3.

It establishes:
- what the locked requirement says;
- what the code actually does;
- the exact gap;
- the smallest plausible ways to resolve it.

It does not choose an option, rank the options, or recommend one. D0–D11 are
treated as immutable and are not reinterpreted.

---

### 2. Baseline

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28   (matches expected)
Staged .................... none
git status --short ........ 101 lines (48 tracked-modified, 53 untracked)
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31
git diff --check .......... clean
```

This is identical to the end state of the preceding Live Validation Gate Audit
task. SHA-1s of the full diff and of all 53 untracked files were stored in the
session scratchpad, outside the repository, for the §16 comparison.

---

### 3. Locked D10/D11 Evidence Requirements

Everything in this section is quoted or cited from the locked documents. None of it is weakened.

**D10-C** (`PATH_2_CATEGORY_PLAUSIBILITY_D10_PRODUCT_DECISION.md` §2):
> "Reuse existing evidence fields (URL, label, quote, confidence, basis); first-party vs.
> supporting evidence distinguished by label only, no new tier taxonomy"

**D10 §4:**
> "Evidence: for each segment with evidence, the same evidence-item shape already used
> elsewhere on this page — source link, source label, quoted text, confidence (when
> applicable), and basis (§5)."

**D10 §5**, "Visible, reusing the existing evidence-item shape exactly (`opportunities/[id]/page.tsx:128-143`)":
- Source URL
- Source label
- Quoted evidence text
- "Confidence (shown for OBSERVED/INFERRED evidence; suppressed for UNKNOWN, matching the existing convention at line 131)"
- "Basis"

**D10 §11, Implementation Constraint 4:**
> "Each segment's evidence must reuse the existing `{sourceUrl, sourceLabel, sourceQuote,
> confidence, basis}` shape — no new evidence schema should be invented for this purpose
> alone."

**Consolidated Scope Lock:**
- line 205 restates D10-C;
- lines 434–436 list, for the new entity, "evidence (reusing the existing {sourceUrl, sourceLabel, sourceQuote, confidence, basis} shape, per D10 Implementation Constraint 4)".

**Final Implementation Readiness Audit §8.1** gives a conceptual contract, marked "CONCEPTUAL ONLY — NOT IMPLEMENTED". It places `confidence: number` and `basis: string | null` on **each `SegmentDetermination`**, next to `evidence: {sourceUrl, sourceLabel, quote}[]`.

**D11 §6.3** (`PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md`, "MANDATORY, per validation session"):
> "Confidence and basis fields are populated and consistent with the claim's
> classification (OBSERVED vs. INFERRED), reusing the existing evidence-item shape D10
> already committed to (`{sourceUrl, sourceLabel, sourceQuote, confidence, basis}`)."

**D11 §6.1** (also mandatory): every OBSERVED claim under a MATCH/MISMATCH has an `evidence[]` entry with a real `sourceUrl` and a verbatim `sourceQuote`.

**Where the referenced "existing shape" actually lives.** `page.tsx:132-156` today, source-verified:
- `confidence` and `basis` are **claim-level** fields of a `StoredResearchSignal` (`types.ts:44-57`).
- They are not fields of each source/evidence entry. Each source entry carries only `{sourceUrl, sourceLabel, sourceQuote}`.
- The UI prints `(confidence N)` unless the classification is UNKNOWN (`page.tsx:141`).
- It prints `Basis: …` only when `basis` is non-null (`page.tsx:144`).
- In the existing model, `basis` is "INFERRED's reasoning trail. Null for OBSERVED/UNKNOWN" (`types.ts:34-35`; `schema.ts` `observationSchema`).

This fact is recorded without interpretation. The D10/D11 text calls the five fields one "evidence-item shape". In source, that shape is one signal row, with the claim-level `confidence`/`basis` plus its list of `{url, label, quote}` sources.

---

### 4. Current Evidence Data Model

Source traced:
- `packages/core-research/src/schema.ts`: `evidenceSchema` :31-56, `observationSchema` :63-150, `categorySegmentSchema` :190-242, `leadResearchSchema` :252-289
- `categoryPlausibility.ts`: parse :36, aggregate :51, verify :90-176, types :179-202, mapping :204-219
- `researcher.ts:250-300` (validation and repair)
- `prompt.ts:31, 43-49`
- `service.ts:108-139`
- `fallbackResearchProvider.ts:93-120`

**Model output per segment** (`categorySegmentSchema`):

```text
{ fit: 'MATCH'|'MISMATCH'|'UNKNOWN',
  rationale: string(1..400) | null,        // required for MATCH/MISMATCH, MUST be null for UNKNOWN
  evidence: evidenceSchema[] (max 3)       // ≥1 for MATCH/MISMATCH, MUST be [] for UNKNOWN
}
evidenceSchema = { quote: string(1..500), sourceUrl: url, sourceLabel: string(1..80) }
```

Segments have **no** `classification` (OBSERVED/INFERRED/UNKNOWN), **no** `confidence`, and **no** `basis`. The `evidenceSchema` itself is reused, and it never had `confidence`/`basis` in any usage.

**Evidence matrix** (per segment):

| Field | Produced by model? | Validated? | Persisted? | Rendered? | Current source |
|---|---|---|---|---|---|
| MATCH/MISMATCH/UNKNOWN (`fit`) | Yes | Zod enum. Count must equal segment count when the response is non-empty (`verifyCategoryPlausibility`) | Yes (`segment_results[].fit`) | Yes (`page.tsx` "— {segment.fit}") | `schema.ts:190-196`; `categoryPlausibility.ts:212` |
| segment | **No.** Deterministic code (`parseTargetSegments`) | By construction; order is enforced by position | Yes (`segment_results[].segment`, `target_segments`) | Yes | `categoryPlausibility.ts:36-41, 208-210` |
| quote | Yes | Zod 1..500. Verbatim match against the cited document; minimum length (`categoryPlausibility.ts:131-172`) | Yes (`evidence[].quote`) | Yes (`"{source.quote}"`) | `schema.ts:32-41`; `categoryPlausibility.ts:214` |
| source URL | Yes | Zod `url()`. Must equal a supplied source URL | Yes (`evidence[].sourceUrl`) | Yes (link href) | `schema.ts:42-50` |
| source label | Yes | Zod 1..80. Not checked against the document label | Yes (`evidence[].sourceLabel`) | Yes (link text) | `schema.ts:51-56` |
| confidence | **No** | **No** | **No** | **No** | Absent from `categorySegmentSchema`, `SegmentDetermination`, and the UI |
| basis | **No** | **No** | **No** | **No** | Absent from all of the above |
| reasoning (`rationale`) | Yes, for MATCH/MISMATCH only | Zod: required for MATCH/MISMATCH, forced `null` for UNKNOWN | Yes (`segment_results[].rationale`, null for UNKNOWN) | Yes, only when non-null | `schema.ts:198-204, 215-229`; `page.tsx` `segment.rationale ?` |

Repair: category issues join the same repair loop as provenance issues (`researcher.ts:255-294`). If the loop is exhausted, `ResearchValidationError` is thrown and nothing is persisted. The fallback provider reuses one `researchInput` across attempts and validates every attempt against the same shared schema. No adapter-specific handling exists.

---

### 5. Current Persistence Model

Migration `0027_category_plausibility_determinations`: one row per determination.

```text
id, search_id (FK), prospect_id (FK), target_customer TEXT, target_segments TEXT[],
aggregate_result TEXT CHECK IN ('MATCH','MISMATCH','UNKNOWN'),
segment_results JSONB NOT NULL,  -- documented as {segment, fit, rationale, evidence:[{quote,sourceUrl,sourceLabel}]}
observed_at, superseded_at, created_at
indexes: (search_id, prospect_id); (prospect_id) WHERE superseded_at IS NULL (non-unique)
```

- `categoryPlausibilityPgRepository.ts`: `save` inserts `segment_results` as JSON. `mapRow` (:102-115) passes `segment_results` through with **no field-level validation or projection**.
- `service.ts:124-138` builds `segmentResults` through `toSegmentDeterminations`, which copies only `segment`, `fit`, `rationale`, and `evidence{quote, sourceUrl, sourceLabel}`.
- No column, and no key inside the JSONB, stores confidence or basis.

---

### 6. Current UI Rendering

`apps/web/app/(client-finder)/opportunities/[id]/page.tsx:160-185` renders:
- the aggregate (`<h2>Category plausibility: {aggregateResult}</h2>`);
- the target customer;
- `observedAt`;
- per segment: `{segment} — {fit}`, the rationale if present, and each evidence entry as `<a href=sourceUrl>{sourceLabel}</a>: "{quote}"`.

It renders **no confidence** and **no basis**. By contrast, the existing Evidence section at :132-156 renders `(confidence N)` for non-UNKNOWN signals and `Basis: …` when present.

---

### 7. Exact F-1 Gap

| | Locked requirement | Current implementation fact | Gap |
|---|---|---|---|
| Confidence | D10-C, §5, Constraint 4; D11 §6.3: shown for OBSERVED/INFERRED, suppressed for UNKNOWN, "populated" | Not produced, validated, persisted, or rendered | **Missing end to end** |
| Basis | D10-C, §5, Constraint 4; D11 §6.3: "populated and consistent with the claim's classification" | Not produced, validated, persisted, or rendered. `rationale` exists, but no document equates it with `basis` | **Missing end to end** |
| Classification (OBSERVED vs. INFERRED) | D11 §6.3 checks confidence/basis "consistent with the claim's classification (OBSERVED vs. INFERRED)" | Segments have no OBSERVED/INFERRED classification, only `fit`. MATCH/MISMATCH structurally require verbatim evidence | **No field to check consistency against.** Whether one is needed is part of the open decision (§13) |
| URL / label / quote | D10-C; D11 §6.1 | Produced, validated (URL membership, verbatim quote), persisted, rendered | None |

**Consequence:** a D11 session cannot satisfy D11 §6.3 on the current implementation. This is a Path 2 implementation gap against D10-C and Constraint 4. It is not a D11-H record problem and not an environment problem.

An adjacent item is noted but is not part of F-1. D10 §5 and Constraint 5 require a plain first-party/supporting label. The only persisted label is `sourceLabel`, which the homepage-only source provider always sets to `"Homepage"`. Whether that is enough is outside this F-1 preparation.

---

### 8. UNKNOWN Limitation (separate from F-1)

The table below shows what the current representation lets anyone tell apart (source-verified).

| Case | Mechanism | Persisted form | Distinguishable? |
|---|---|---|---|
| 1. Genuine insufficient evidence | Model returns `fit: 'UNKNOWN'` (rationale null, evidence []) | Segment `{fit:'UNKNOWN', rationale:null, evidence:[]}` | — |
| 2. Malformed/empty model response | (a) Empty `categoryPlausibility` array: **accepted** (`verifyCategoryPlausibility` returns `[]`), and `toSegmentDeterminations` fills every segment with `'UNKNOWN'`/null/[]. (b) Wrong length or schema violation: sent to repair. If repair is exhausted, `ResearchValidationError` is thrown and no row is written | (a) **Identical to case 1.** (b) No row | (a) **No.** (b) Yes (no row) |
| 3. Missing determination | No row | UI section absent. Qualification reason is "no category-plausibility determination exists yet…" (`rules.ts:103-105`) | **Yes** (at the Qualification reason and in the UI) |
| 4. Unsupported/invalid evidence | The verifier rejects it, then repair. If the model then downgrades to UNKNOWN, it is stored as case 1. If repair is exhausted, no row | Same as case 1, or no row | **No**, when downgraded |

D11 §3.5 and §4.3/§4.6 require "at least one UNKNOWN … with recorded insufficiency reasoning". The schema **forces `rationale = null` for UNKNOWN** (`schema.ts:216-219`), so the system cannot persist insufficiency reasoning. This is a **separate factual limitation from F-1**; it was recorded as F-2 in the Gate Audit. The D11-H record (§9) can capture facilitator-side reasoning. No change to UNKNOWN semantics is proposed here.

---

### 9. Attribution / Storage Constraints

All F-1 data lives inside the per-segment objects of `segment_results` (JSONB). That determines what any F-1 change can and cannot affect.

| Property | Effect of adding per-segment fields inside `segment_results` |
|---|---|
| Prospect attribution | Unaffected. `prospect_id` is a column; the new keys would live inside JSONB. |
| Search ownership / currentness | Unaffected. `search_id` column; `getCurrentByProspectId` filters on `superseded_at IS NULL` and orders by `created_at, id`. No JSONB is read in SQL. |
| Supersession | Unaffected. `supersedePrevious` updates on `(search_id, prospect_id)` only. |
| Migration 0027 behavior | No DDL is technically required. JSONB accepts additional keys; the only CHECK is on `aggregate_result`. The migration's header comment documents the old segment shape, so it would become descriptively stale. Changing an applied migration is outside any authorization here. |
| Previously stored rows | Any row written before a change would lack the new keys, and `mapRow` passes JSONB through unvalidated. A reader/UI would need to tolerate their absence. This audit made no database connection, so it did not check whether such rows exist in any environment. No live determination has ever been recorded; test/integration databases may hold rows. |
| Provider neutrality | Preserved only if the fields are added in the shared layer (`schema.ts`/`prompt.ts`/`categoryPlausibility.ts`). JSON Schema for all three adapters is derived from the Zod schema (`zodToJsonSchema`, `toGeminiSchema`). The adapters would not change, but each adapter's translated schema changes. |
| Fallback | `fallbackResearchProvider.ts` validates every attempt against the same schema. Its control flow would be unchanged. |

---

### 10. Candidate Resolution Options

These are listed without ranking and without a recommendation.

#### Option A — Extend the segment result model

Add `confidence` and `basis` to each segment result:
- model output (`categorySegmentSchema`), plus superRefine rules;
- prompt instructions;
- `SegmentDetermination` / `toSegmentDeterminations`;
- persist them in `segment_results` JSONB;
- render them in the D10 section using the existing convention (confidence unless UNKNOWN; basis when present).

This requires the Product Owner to define semantics that no document currently fixes:
- the confidence range and its UNKNOWN value (the existing convention is 0–100, with UNKNOWN = 0);
- what `basis` means for an evidence-backed MATCH/MISMATCH, given that `basis` is null for OBSERVED in the existing model;
- whether its relationship to `rationale` is distinct, merged, or replacing;
- whether a per-segment OBSERVED/INFERRED classification is added so that D11 §6.3's "consistent with the claim's classification" can be checked.

That last point has a wrinkle. Existing INFERRED claims must carry **no** evidence, while MATCH/MISMATCH **must** carry evidence. Adding an INFERRED classification would therefore interact with D3's evidence-sufficiency rules.

**Technically supportable.**

#### Option B — Derive confidence/basis from existing fields

- **Confidence:** no per-segment numeric or ordinal certainty exists in model output or storage. The only confidences in `LeadResearch` are `leadResearchSchema.confidence`, which covers the whole research, and each Observation's `confidence`, which applies to other claims such as `targetCustomers`. Neither is a per-segment-verdict confidence. Mapping `fit → number` (for example MATCH=100) would **invent semantics**. **Not technically supportable without inventing a value.**
- **Basis:** the only candidate is `rationale` ("One sentence explaining the verdict"). The existing `basis` means "INFERRED's reasoning trail. Null for OBSERVED/UNKNOWN". A MATCH/MISMATCH is evidence-backed, which is OBSERVED-like, so presenting `rationale` as `basis` would give `basis` a meaning different from its existing one. That is a **semantic relabel**, not a derivation. It is possible only as an explicit Product Owner ruling, which this document does not make.
- **Net:** Option B cannot satisfy "confidence" on its own. It could cover "basis" only by Product Owner reinterpretation.

#### Option C — Reuse an existing evidence model

Each candidate was checked against source.

- **C1: persist segments as `ResearchSignal` rows** (`StoredResearchSignal` has `confidence`, `basis`, `classification`, `sources[]`). This is **prohibited** by D1/D7: category plausibility "never becomes a StoredResearchSignal row", and migration 0027 and `leadResearchSchema` enforce this. **Not available** without reopening D1/D7.
- **C2: embed the existing `observationSchema`** (classification/value/evidence/basis/confidence, with its superRefine rules) as each segment's claim, kept outside `allObservations()`. The fields and rules exist, but their semantics concern the **provenance of a claim value**, not a **fit verdict**. The rules also conflict with `fit`: `INFERRED` ⇒ evidence must be `[]`, while MATCH/MISMATCH ⇒ evidence ≥1. `UNKNOWN` classification ⇒ `value` null and confidence 0, which is a separate axis from `fit: UNKNOWN`. Semantic equivalence is **not proven**. Using C2 would need combination rules defined by the Product Owner, which in practice makes it a variant of Option A that shares field definitions.
- **C3: reuse `evidenceSchema`.** This is **already done**, but `evidenceSchema` has no `confidence`/`basis` in any usage, so reusing it cannot close F-1.
- **Net:** no existing structure in the repository holds per-segment-verdict `confidence`/`basis` that could be reused unchanged without touching D0–D11.

#### Other Product Owner outcome (not an implementation option)

The Product Owner may instead issue an explicit ruling on how D10-C and D11 §6.3 apply to segment verdicts, for example whether `rationale` satisfies `basis`, or whether `confidence` is "applicable". That would be a governance action on locked decisions, and it is listed only so the decision space is complete. This document does not assess whether such a ruling is appropriate.

---

### 11. Impact Analysis

| Dimension | Option A (extend) | Option B (derive) | Option C1 (ResearchSignal) | Option C2 (embed Observation) |
|---|---|---|---|---|
| Production files | `schema.ts`, `prompt.ts`, `categoryPlausibility.ts` (types, mapping, and possibly verify), `page.tsx`; `categoryPlausibilityRepository.ts` types if exposed | `page.tsx` only (display relabel); confidence unresolvable | `service.ts`, `mapping.ts`/`persist.ts`, signals path, UI, Qualification linkage | Same set as A, plus combination rules in `schema.ts`/`categoryPlausibility.ts` |
| Schema/migration | No DDL needed (JSONB). 0027 comment goes stale. Old rows lack keys | None | Would route data into `research_signals`; contradicts 0027's purpose | As A |
| Provider/model schema | Changes the shared Zod → JSON Schema for all adapters; D11-F precondition tests (`jsonSchema.test.ts`, `geminiModel.test.ts`, OpenAI) need re-proving | None | Changes the model output contract | As A, larger |
| UI | D10 section adds confidence/basis per the existing convention | Relabel `rationale` → "Basis"; no confidence | Rework | As A |
| Tests | `categoryPlausibility.test.ts`, `jsonSchema.test.ts`, `research.test.ts`, `service.test.ts`, `testSupport.ts` fixtures, integration fixtures that build `categoryPlausibility`, Gemini/OpenAI schema tests | Minimal/UI | Broad | As A, plus rule-interaction tests |
| D0–D11 boundaries touched | D3 (evidence rules, only if a classification is added), D10-C (satisfied), D11 §6.3 (satisfiable) | D10-C/D11 §6.3 **only via PO reinterpretation**; confidence still unmet | **D1/D7 violated** | D3/D7 adjacency (must stay outside `allObservations()`); D10-C/D11 |
| Provider neutrality | Intact if confined to the shared layer | Intact | Intact but D7-violating | Intact if shared-layer |
| Fallback behavior | Unchanged control flow; same validation per attempt | Unchanged | Unchanged | Unchanged |
| Attribution/supersession (§9) | Unaffected | Unaffected | Different table; D6 semantics would need re-verification | Unaffected |

---

### 12. D0–D11 Boundary Analysis

- **D1 / D7 (dedicated entity, never a ResearchSignal):** respected by A, B and C2. Violated by C1.
- **D2 (deterministic parsing, ANY aggregation):** untouched by every option. Aggregation uses `fit` only.
- **D3 (evidence sufficiency; UNKNOWN never defaults to MISMATCH):** untouched by A and C2 unless a per-segment OBSERVED/INFERRED classification is introduced. The existing INFERRED "no evidence" rule would then interact with MATCH/MISMATCH's evidence requirement. That is a Product Owner semantic question.
- **D4 / D5 (Qualification reads `aggregateResult` only; Opportunity unaffected):** untouched by every option (`rules.ts:77-107` reads only `aggregateResult`).
- **D6 (Search + Prospect attribution, supersession):** untouched by A, B and C2 (§9).
- **D8 (input contract, widening OPTION A):** untouched. F-1 concerns output, not `ResearchProviderInput`.
- **D9 (provider neutrality):** preserved when changes stay in the shared layer. The D11-F precondition requires re-proving structured-output translation for each configured provider.
- **D10-C / Constraint 4:** currently unmet. Satisfied by A, and by C2 if its semantics are defined. B satisfies it only by reinterpretation.
- **D11 §6.3:** currently unsatisfiable. Satisfiable under A or C2. Under B, not satisfiable for confidence.
- **R-71, Scoring/Ranking, Discovery, Opportunity creation/state machine:** untouched by every option except C1, which would put category data into the signal path that feeds `toOfferSignals()`.

---

### 13. Open Product Owner Decision

```text
PRODUCT OWNER DECISION REQUIRED
```

The Product Owner must decide how F-1 is resolved. Sub-questions a decision would need to settle; they are listed, not answered:

1. Which resolution path applies: Option A, Option C2, Option B's basis relabel together with some separate treatment of confidence, or an explicit governance ruling on how D10-C and D11 §6.3 apply to segment verdicts.
2. If confidence is added: its scale, its value for UNKNOWN, and whether validation caps apply (the existing convention is INFERRED ≤ 80, UNKNOWN = 0).
3. If basis is added: its meaning for evidence-backed MATCH/MISMATCH, and its relationship to the existing `rationale`.
4. Whether segments gain an OBSERVED/INFERRED classification so that D11 §6.3's "consistent with the claim's classification" is checkable. If so, how INFERRED interacts with the MATCH/MISMATCH evidence requirement (D3).
5. How rows persisted before any change, which lack the new keys, are displayed.
6. Whether the D11-F per-provider structured-output test precondition must be re-satisfied before D11 is scheduled. By D11 §7's own text it would apply, because the shared output schema changes.

The UNKNOWN reasoning limitation (§8) is a **separate** item and is not part of this decision unless the Product Owner chooses to join them.

---

### 14. Implementation Authorization Status

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

Nothing in this document authorizes any change to code, tests, schema, migrations, providers, workers, UI, PRD, configuration, governance documents, or the D11-H record. D11 live validation is not started. It remains NOT READY per the Gate Audit.

---

### 15. Explicit Non-Actions

- F-1 was not implemented and no option was selected or recommended.
- D10, D11, or any D0–D11 document was not modified or reinterpreted.
- The D11-H Facilitator Observation Record, `MVP_REAL_USER_VALIDATION_TEMPLATE.md`, and the PRD were not modified.
- No production, test, schema, migration, provider, worker, UI, or configuration file was modified.
- No live API/provider call, no database connection or query, no test run.
- No staging, commit, or push.

---

### 16. Final Safety Verification

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28  (unchanged)
Staged .................... none
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)  (unchanged)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31  (identical)
git diff --check .......... clean
git status --short ........ 101 → 102 lines (+ this document only)
Pre-existing untracked files: all 53 SHA-1s identical to baseline
  (includes the D11-H record and the D11 Live Validation Gate Audit)
Commit / push ............. none / none
Live API/provider calls ... 0
```

## STOP
