# Path 2 — Category Plausibility

## F-1 Consolidated Conformance Audit (Read-Only)

```text
DOCUMENT TYPE: READ-ONLY CONSOLIDATED F1 CONFORMANCE AUDIT
SUBJECT: F1-A … F1-F as a whole, after the F1-D Product Owner decision
FINAL CLASSIFICATION (F1 contract): CONFORMING WITH NON-BLOCKING NOTES
LIVE-VALIDATION STATUS (unchanged): NOT READY FOR LIVE VALIDATION
D0–D11: IMMUTABLE
F1-A through F1-F: audited against the current authoritative decisions
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This audit is read-only. It records findings and does not resolve them. It does not
amend any decision, and it does not implement or authorize anything. It is the only
file created by this task.

---

### 1. Executive Conclusion

**The F-1 contract is internally consistent.** The contract comprises F1-A through
F1-F, with F1-D as clarified by the F1-D Product Owner decision. This audit found
**no unresolved product contradiction**:
- among the six sub-decisions;
- between the contract and D0–D11;
- between the contract and the existing ResearchSignal OBSERVED / INFERRED / UNKNOWN semantics;
- between the contract and provider neutrality.

**The three F1-D findings from the earlier review are resolved:**
- **C-1:** the segment meaning of OBSERVED is now declared feature-local.
- **C-2:** the exclusion of INFERRED is now correctly grounded in a Product Owner choice, not in D3.
- **C-3:** D11 §6.3 now has an explicit structural part and an explicit substantive part, and a separate segment type is required.

**D11 §6.3 remains meaningful.** Its structural part is tautological by construction,
and the F1-D decision says so. Its substantive part, where the facilitator reads the
evidence independently, is a real check that can fail (§13).

**The remaining findings do not block the contract:**
- They are implementation details, documentation/status inconsistencies, or pre-existing issues (§18, §19).
- One is a documentation inconsistency introduced by the F1-D decision: its §8 refers to "the record's existing §6.3 evidence-check entries", which the D11-H record does not have (A-12).
- None of them changes the product meaning of the contract.

**The implementation is unchanged.** F-1 is **not implemented**:
- The repository still has no segment `confidence`, `basis` or `classification`.
- It still forces `rationale = null` for UNKNOWN.
- It still cannot tell a model-reported UNKNOWN from a code-filled one.

Live validation therefore stays **NOT READY FOR LIVE VALIDATION**. That status is
unchanged from the Gate Audit: the F-1 implementation has not been done, and D11-I
(provider funding) is unresolved. That readiness status is a separate question from
whether the contract itself conforms.

---

### 2. Baseline / Repository Safety

Recorded before any other operation:

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28
Branch .................... phase-17-r34-worker-orchestration
Staged .................... none
git status --short ........ 105 lines
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31
git diff --check .......... clean
Untracked files hashed .... 57 (SHA-1s stored outside the repository, for §22)
Target file ............... absent before this task
```

**Method:**
- Repository inspection was read-only: `cat`, `sed`, `grep` and `find` only.
- No test run, build, database connection, or API/provider call.
- A `find -newer` check against the D11 Validation-Readiness Audit's mtime found **0** source, test or migration files changed since that audit's suite run. Its recorded results are reused in §17.

---

### 3. Authoritative Documents Reviewed

| # | Requested source | Actual file(s) used | Discrepancy |
|---|---|---|---|
| 1 | D0–D11 governance | `PATH_2_CATEGORY_PLAUSIBILITY_CONSOLIDATED_IMPLEMENTATION_SCOPE_LOCK.md` (D0–D11 locked text, §83-216); `…_FINAL_DECISION_RECORD.md` (D3 preparation §160-176); `…_D7_PRODUCT_DECISION.md`, `…_D9_PRODUCT_DECISION.md` (terminology grep); `…_D10_PRODUCT_DECISION.md` (§4, §5, §11); `…_D11_PRODUCT_DECISION.md` (§6, §7) | **D0–D6 have no standalone product-decision documents.** Their locked text lives in the Consolidated Scope Lock. Recorded, not changed. |
| 2 | F1 preparation | `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION_PREPARATION.md` | Consulted only through the F-1 Decision's citations of it (§13 questions, §10 options). Not re-read in full. |
| 3 | F1 decision | `PATH_2_CATEGORY_PLAUSIBILITY_F1_EVIDENCE_PRODUCT_DECISION.md` | None. |
| 4 | F1 review | `PATH_2_CATEGORY_PLAUSIBILITY_F1_CONFORMANCE_REVIEW.md` | None. |
| 5 | F1-D decision | `PATH_2_CATEGORY_PLAUSIBILITY_F1_D_CLASSIFICATION_PRODUCT_DECISION.md` | None. |
| 6 | D11 readiness audit | `PATH_2_CATEGORY_PLAUSIBILITY_D11_VALIDATION_READINESS_AUDIT.md` | None. |
| 7 | D11 facilitator record | `PATH_2_CATEGORY_PLAUSIBILITY_D11_FACILITATOR_OBSERVATION_RECORD.md` | None. |
| 8 | Latest D8 widening / GAP-1 | `PATH_2_CATEGORY_PLAUSIBILITY_D8_WIDENING_PRODUCT_DECISION.md`, `…_D8_GAP1_CLOSURE_AUDIT.md` (§13: CONFORMING WITH NON-BLOCKING NOTES; GAP 1 CLOSED) | None. |
| — | Gate status | `PATH_2_CATEGORY_PLAUSIBILITY_D11_LIVE_VALIDATION_GATE_AUDIT.md` | Consulted for the current gate classification, finding F-1, and the 14 pre-existing integration failures. |

**Task-wording discrepancy.** The task describes §6.1 as an "evidence spot-check" and
§6.4 as "evidence/provenance checks". In D11 itself:
- §6.1 is the evidence-**presence** requirement;
- §6.4 is the **manual spot-check**.

This audit follows the D11 text (§13).

**Source files inspected (read-only):**
- In `packages/core-research/src/`: `schema.ts`, `categoryPlausibility.ts`, `categoryPlausibilityRepository.ts`, `categoryPlausibilityPgRepository.ts`, `service.ts:100-145`, `researcher.ts:240-300`, `prompt.ts:1-93, 158`, `repair.ts` (grep), `provider.ts` (grep), `anthropicResearchProvider.ts:71`, `fallbackResearchProvider.ts:97`, `anthropicModel.ts`, `openAIModel.ts`, `geminiModel.ts:60-150`, `jsonSchema.ts:20-64`.
- The test files listed in §17.
- `apps/web/app/(client-finder)/opportunities/[id]/page.tsx:125-195`.
- `packages/db/prisma/migrations/0027_category_plausibility_determinations`.

---

### 4. D0–D11 Immutability Audit

| D | Locked decision (Scope Lock) | F-1 interaction | Kind | Does F-1 change its meaning? | Result |
|---|---|---|---|---|---|
| D0 | MVP enhancement | none | — | No | CONFORMING |
| D1 | Dedicated Search+Prospect entity | All new fields live inside `segment_results` JSONB of that entity (F-1 §12) | Explicit dependency | No | CONFORMING |
| D2 | ANY-match aggregation, deterministic parsing | Confidence never changes an outcome (F1-A); aggregation reads only `fit` (F-1 §14.6) | Explicit dependency | No | CONFORMING |
| D3 | First-party primary; supporting secondary; weak snippets "must not independently establish"; "evidence specific enough to support the determination"; insufficient → UNKNOWN, "never a default MISMATCH"; "No new evidence-tier taxonomy" | F1-D §5(d) requires first-party grounding. F1-D §6: a MISMATCH may not rest on absence of mention, and an uncited premise leads to UNKNOWN. F1-D §5: classification is not a tier. F1-D §7: **D3 does not forbid INFERRED**; the exclusion is a Product Owner choice. | Explicit dependency | No. F1-D's rules specialize D3's "insufficient → UNKNOWN / never a default MISMATCH" without contradicting it. No OBSERVED-only rule is attributed to D3. | CONFORMING. The earlier incorrect D3 attribution in F-1 §9 is superseded (see A-13). |
| D4/D5 | New criterion; MATCH passes, MISMATCH → NOT_QUALIFIED, UNKNOWN/none → INSUFFICIENT_EVIDENCE | Qualification reads only `aggregateResult`; legacy rows are unaffected (F1-F) | Explicit dependency | No | CONFORMING |
| D6 | Per Search+Prospect; supersession; historical attribution | Only the JSONB contents change | Explicit dependency | No | CONFORMING (§15) |
| D7 | Outside the FIELD_KIND / ResearchSignal classification mechanism | The new field is also called `classification` and uses the words OBSERVED/UNKNOWN. F1-D §9 requires a **separate** two-member type and forbids reuse of `Classification`/`classificationSchema`. | Related terminology, not a dependency | No. The field stays in the D1 entity and never reaches `allObservations()`, `FIELD_KIND`, `isEvidentiary()` or the offer path. | CONFORMING. The name overlap is noted as a risk (A-7). |
| D8 | Input contract (D8 Widening: `targetSegments` on `ResearchProviderInput`) | F-1 changes output only | Unrelated | No | CONFORMING |
| D9 | Full provider neutrality | Model-facing additions go in the shared Zod schema and prompt. Code-assigned fields are set in shared code. | Explicit dependency | No | CONFORMING (§14) |
| D10 | D10-C reuses URL, label, quote, confidence, basis. §5: confidence "shown for OBSERVED/INFERRED evidence; suppressed for UNKNOWN". Constraint 4: "no new evidence schema". | F1-A shows confidence for MATCH/MISMATCH (segment-OBSERVED) and hides it for UNKNOWN. F1-B defines a feature-local closed basis domain. Classification is not rendered. | Explicit dependency | No. D10 §5's "OBSERVED/INFERRED" phrasing maps onto segment-OBSERVED without conflict. N-2 (basis value domain) was explicitly declared. | CONFORMING |
| D11 | §6.1/§6.3/§6.4 (§13 below); §7 invariants | F1-D §8 states how the facilitator applies §6.1/§6.3/§6.4 to segments. D11 text is unchanged. | Explicit dependency | No. This is an explicit, feature-scoped application, not a silent reinterpretation. §6.3 becomes stricter for segments (A-3), and its "vs." axis is kept (§13). | CONFORMING |

**A pre-existing D11 tension, now resolved by F1-B.**
- D11 §6.3 requires `basis` to be "populated" for classified claims.
- The existing ResearchSignal `basis` is "Null for OBSERVED/UNKNOWN" (F-1 §5).
- So D11 §6.3 could not have been met under the chain's own basis meaning for OBSERVED claims.
- F1-B's feature-local, always-populated `basis` removes that tension.

Classification: EXISTING BUT NOW EXPOSED BY F1. Now NOT AN ISSUE.

---

### 5. F1-A Conformance — Confidence

| Check | Governing text | Result |
|---|---|---|
| 1–100 for MATCH/MISMATCH | F-1 §6, §13, §14.2 | Specified |
| 0 for UNKNOWN | F-1 §6, §10, §14.3 (model-reported); code sets 0 for `NO_MODEL_VERDICT` | Specified |
| Does not determine or override the verdict | F-1 §6 "Effect on the outcome: none"; §14.6 | Specified; consistent with D2/D4/D5 |
| Belongs to the segment | F-1 §13: "segment-level" | Specified |
| Compatible with F1-B/F1-C | F-1 §14.5: `OBSERVED ⇔ … ⇔ confidence ≥ 1`; `UNKNOWN ⇔ … ⇔ confidence = 0` | Consistent |
| Compatible with F1-D feature-local OBSERVED | F1-D §10: "segments are never INFERRED", so the ≤ 80 cap stays inapplicable | Consistent |
| Compatible with D11 §6.3 | Confidence consistency is **structural only**: ≥1 vs. 0. No confidence value can make a verdict "INFERRED in substance", and F1-D does not use confidence in the substantive check. | Consistent. See A-3. |
| Legacy rows without confidence stay readable | F-1 §11.1; §13 "optional" | Specified. Today `mapRow` returns JSONB unvalidated, so legacy rows are readable (§15). |
| Current implementation | `categorySegmentSchema` has no `confidence`; `SegmentDetermination` has none | **NOT IMPLEMENTED** (F-1 gap persists) |

**Result: CONFORMING.**

Implementation details still open: calibration wording (N-1); where the model-facing
field sits in `categorySegmentSchema`. Neither is blocking.

---

### 6. F1-B Conformance — Basis

| Value | Assigned when (F-1 §7) | Can code determine it? |
|---|---|---|
| `CITED_SOURCE_EVIDENCE` | outcome MATCH/MISMATCH | Yes, from `fit` after `verifyCategoryPlausibility` passes |
| `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` | the model returned an entry with UNKNOWN | Yes: `results.length > 0 && results[i].fit === 'UNKNOWN'` |
| `NO_MODEL_VERDICT` | empty array with ≥1 segment | Yes: `results.length === 0 && targetSegments.length > 0`, known inside `toSegmentDeterminations` (`categoryPlausibility.ts:204-220`) |

| Check | Result |
|---|---|
| Code-derived; not accepted from the model | Specified (§7, §14.4) |
| Independent of rationale | Specified (§7, §8) |
| Representable for every outcome | Yes. The three values are disjoint and cover every outcome. Zero-segment rows have no segments to label (N-5). |
| Conflict with ResearchSignal `basis` meaning | None. §7 explicitly does not inherit it, and §18 preserves it. |
| Legacy rows may lack it | Yes (§11.1, where missing `basis` is the legacy marker) |
| D11 can tell genuine insufficiency from no model verdict | Yes, per segment (§10). Not at aggregate level (N-4, unchanged behavior). |
| Current implementation | **NOT IMPLEMENTED** |

**Result: CONFORMING.**

Note: `schema.ts` applies `.default([])` to `categoryPlausibility`, so a field that is
*omitted* and a field that is *explicitly empty* are the same after parsing. F-1 §10
deliberately treats both as `NO_MODEL_VERDICT` ("Empty/omitted"). NOT AN ISSUE.

---

### 7. F1-C Conformance — Rationale vs. Basis

| Outcome | Rationale (model) | Basis (code) | Governing |
|---|---|---|---|
| MATCH / MISMATCH | required, 1–400 | `CITED_SOURCE_EVIDENCE` | F-1 §8, §13, §14.2 |
| Model-reported UNKNOWN | **required**, 1–400; states what was absent; must not assert MATCH/MISMATCH | `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` | F-1 §8, §10, §14.3 |
| `NO_MODEL_VERDICT` | `null`; no reasoning is fabricated | `NO_MODEL_VERDICT` | F-1 §8, §10 |

- **ResearchSignal basis semantics are not accidentally reused.** F-1 §7 and F1-D §7 both state the segment `basis` is not "INFERRED's reasoning trail".
- **The F1-D decision gives `rationale` an extra validation role.** At D11, the facilitator reads it to detect uncited premises (F1-D §8). That changes how it is *used in validation*. It does not change its F1-C *meaning* (model explanation).

**Current implementation conflicts with F1-C, as expected before implementation:**
- `categorySegmentSchema.superRefine` forces "UNKNOWN must have a null rationale" (`schema.ts`, the segment schema).
- `toSegmentDeterminations` maps a missing entry to `rationale: null`.

Classification: implementation not done. This is not a contract conflict.

**Result: CONFORMING.** No ambiguity found.

---

### 8. F1-D Conformance — Feature-Local Classification

The F1-D decision is treated as authoritative.

| Requirement | F1-D § | Verified in document | Implemented? |
|---|---|---|---|
| Feature-local | §2.1, §5 | Yes | No field exists |
| Values `OBSERVED \| UNKNOWN` | §5, §9 | Yes | — |
| ResearchSignal O/I/U semantics unchanged | §2.1, §5, §12 | Yes. `schema.ts:6-22` and `prompt.ts:19-21` are untouched. | n/a |
| INFERRED not permitted | §2.2, §7 | Yes | — |
| MATCH/MISMATCH → OBSERVED; UNKNOWN → UNKNOWN | §2.4, §6 | Yes; identical to F-1 §9/§13 | — |
| Unquoted premise → UNKNOWN | §2.3, §6, §7 | Yes | Enforced only by prompt (F1-D §11.3) and D11. No code check (by design, F1-D §11.4). |
| MISMATCH not based on absence of mention | §6 | Yes | Same as above |
| Facilitator inspects the evidence, not the label | §2.5, §8 | Yes | n/a |
| Separate two-value type; no reuse of `Classification` | §9 | Yes | — |

**Critical contradiction tests:**

1. **Against D11 §6.3.** D11 §6.3 presupposes a classification axis "(OBSERVED vs. INFERRED)". F1-D keeps that axis at the level of *substance*, not the stored label: a verdict that is INFERRED in substance fails §6.3 (F1-D §8).
   - **Stricter than under chain semantics.** Under chain semantics, a correctly labelled INFERRED claim could pass §6.3. Under F1-D, an INFERRED segment verdict cannot exist, so a substantively INFERRED verdict always fails.
   - D11 §6.3 requires consistency. It does not require that INFERRED be allowed.
   - **Not a contradiction** (A-3).
2. **Against D3.** No OBSERVED-only rule is attributed to D3. F1-D §5(d) and §6 stay within D3's first-party-primary and "never a default MISMATCH" rules. Classification is not a tier. **Not a contradiction.**
3. **Against existing ResearchSignal semantics.**
   - Segment-OBSERVED is broader than ResearchSignal-OBSERVED. It admits quote-grounded reasoning.
   - The two never meet in code if the separate-type rule is followed: D7 keeps segments out of `isEvidentiary()`, `allObservations()` and `FIELD_KIND`.
   - **Not a contradiction.** There is a naming-collision risk:
     - in the prompt (A-5);
     - in the generic repair wording (A-6);
     - in reviewers' reading (A-7).

**Is D11 §6.3 still meaningful?** Yes. It is now **partly structural and partly
substantive**, exactly as F1-D §8 states:
- **Structural part.** F-1 §14.5 consistency plus "no INFERRED". This is tautological by construction and is expected always to pass. A failure means an implementation defect.
- **Substantive part.** An independent facilitator reading of quote plus source plus rationale. It is not tautological, because it compares the stored label with the evidence, not with the outcome.

**Result: CONFORMING.** C-1, C-2 and C-3 are resolved.

---

### 9. F1-E Conformance — UNKNOWN Pathways

| Path | Contract representation | Row? | `basis` | Distinguishable after implementation? | Distinguishable **today**? |
|---|---|---|---|---|---|
| A. Model-reported UNKNOWN | `evidence []`, `confidence 0`, rationale required | Yes | `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` | Yes | **No.** Rationale is forced null, there is no basis, and it looks the same as B. |
| B. Empty / no model verdict | `rationale null`, `confidence 0` | Yes | `NO_MODEL_VERDICT` | Yes | **No.** It is filled as UNKNOWN by `toSegmentDeterminations`. |
| C. Verification failure repaired to UNKNOWN | Same as A. F-1 §10 row 2 **deliberately** merges C into A. | Yes | `MODEL_REPORTED_INSUFFICIENT_EVIDENCE` | **No, by explicit decision** | No |
| D. Missing determination | No row. Qualification reason is "no category-plausibility determination exists yet…" | No | — | Yes (no row) | Yes |
| E. Failed Research run | `ResearchValidationError` after `maxAttempts` (`researcher.ts:299`) or a provider failure. Nothing is persisted, including signals (`service.ts:112` precedes all saves). | No | — | Yes, from D (run status / absence of signals) | Yes |
| (Zero segments) | `segment_results = []`, aggregate UNKNOWN | Yes | — | See A-9 / N-5 | — |

**Mechanics:**
- In path C, the *model* performs the downgrade in the repair round. Code does not rewrite the verdict. `verifyCategoryPlausibility` messages already say "classify this segment UNKNOWN".
- Under F-1, a repaired UNKNOWN must then also carry a rationale, or it fails §14.3 and goes back to repair. This is an implementation detail (A-6).
- Paths D and E both produce no row. They are told apart by Search/Prospect run state, not by the determination entity. F-1 §10 keeps this "as today".

**None of the paths is silently merged.** A and C are merged explicitly by F-1 §10.

**Result: CONFORMING.**

The current repository cannot preserve the A/B distinction. That is the Gate Audit's
F-2 limitation, persisting until implementation: EXISTING BUT NOW EXPOSED BY F1.

---

### 10. F1-F Conformance — Legacy Rows

| Check | Result |
|---|---|
| New fields optional on read | Specified (§11.1). Today `DeterminationRow.segment_results` is cast straight to `SegmentDetermination[]` (`categoryPlausibilityPgRepository.ts:26, 111`), with no runtime validation, so older JSONB reads fine. |
| No backfill | Specified (§11.3) |
| No migration | Specified. `segment_results` is JSONB (migration 0027), so no DDL is needed. The 0027 header comment (`{segment, fit, rationale, evidence}`) will become stale, as F-1 §17 acknowledges. |
| Qualification unchanged | Specified (§11.4). The evaluator reads only `aggregateResult`. |
| Only post-F1 rows are D11-valid | Specified (§11.5) |
| Zero-segment rows | **Undetermined.** A row with `segment_results = []` has no segment object to carry `basis`, so it cannot be classed as legacy or post-F1. No version marker or cutoff is defined. It cannot satisfy any D11 coverage item. |

The zero-segment case is N-5, carried forward. It is not resolved here (A-9).

**Result: CONFORMING WITH NOTE N-5.**

---

### 11. Cross-F1 Consistency Matrix

Each cell answers: does the row decision conflict with the column decision?

| | F1-A | F1-B | F1-C | F1-D | F1-E | F1-F |
|---|---|---|---|---|---|---|
| **F1-A** | — | No. Linked by §14.5. | No | No. The ≤80 cap is inapplicable because there is no INFERRED. | No. UNKNOWN has confidence 0 on both paths. | No. Optional on legacy rows. |
| **F1-B** | | — | No. Distinct roles. | No. `CITED_SOURCE_EVIDENCE` ⇔ OBSERVED. The label records a claim; its truth is checked at D11. | No. Two UNKNOWN bases. | No. Missing basis marks a legacy row. |
| **F1-C** | | | — | No. Rationale is also read for uncited premises at D11. | No. Rationale required for model-reported UNKNOWN, null for `NO_MODEL_VERDICT`. | No. Legacy UNKNOWN rationale is null. |
| **F1-D** | | | | — | No. UNKNOWN → UNKNOWN under both bases. | No. Missing classification makes the row D11-invalid. |
| **F1-E** | | | | | — | No |

**No cell shows a contradiction.**

The F-1 Decision §9's original D3-based justification sentence remains in that document.
The F1-D decision supersedes it by its own terms (F1-D §2.2, §10). That is a
documentation/status matter (A-13), not a contradiction in the contract.

---

### 12. Evidence-Shape Audit

The contract is F-1 §13 together with the F1-D decision. The "Today" column is the
current repository.

| Field | Produced by | Validated | Persisted | Rendered | MATCH | MISMATCH | UNKNOWN (model) | UNKNOWN (`NO_MODEL_VERDICT`) | Today |
|---|---|---|---|---|---|---|---|---|---|
| `segment` | code (D2) | — | yes | yes | req | req | req | req | ✔ exists |
| `fit` | model (code for NMV) | Zod enum | yes | yes | MATCH | MISMATCH | UNKNOWN | UNKNOWN | ✔ exists |
| `evidence[].quote` | model | Zod; verbatim + ≥ MIN_QUOTE_CHARS | yes | yes | 1–3 | 1–3 | `[]` | `[]` | ✔ exists |
| `evidence[].sourceUrl` | model | ∈ supplied docs | yes | link href | req | req | — | — | ✔ exists |
| `evidence[].sourceLabel` | model | Zod string only | yes | link text | req | req | — | — | ✔ exists |
| `confidence` | model (code 0 for NMV) | 1–100 / 0 | yes | MATCH/MISMATCH only | 1–100 | 1–100 | 0 | 0 | ✘ **absent** |
| `basis` | code | §14.5 | yes | literal value | `CITED_SOURCE_EVIDENCE` | `CITED_SOURCE_EVIDENCE` | `MODEL_REPORTED_…` | `NO_MODEL_VERDICT` | ✘ **absent** |
| `classification` | code | §14.5 | yes | **no** | OBSERVED | OBSERVED | UNKNOWN | UNKNOWN | ✘ **absent** |
| `rationale` | model | 1–400 | yes | when non-null | req | req | **req** | null | ⚠ exists, but forced null for UNKNOWN |

**The Gate Audit's F-1 finding stands in the code:**
- `confidence`, `basis` and `classification` are still missing from `categorySegmentSchema`, `SegmentDetermination`, persistence and UI.
- The contract now specifies them, but the repository has not changed.

**Naming note:** D10 Constraint 4 and D11 §6.3 name the field `sourceQuote`, while the
built segment evidence uses `quote`. The F-1 Decision keeps `quote`. This naming
difference predates F-1 and has no semantic effect.

Classification: PRE-EXISTING, non-blocking implementation detail (A-10).

---

### 13. D11 §6.1 / §6.3 / §6.4 Impact

| D11 item | From stored data | Needs the underlying quote/source | Cannot currently be verified | Tautological under feature-local OBSERVED? |
|---|---|---|---|---|
| **§6.1** evidence presence: every OBSERVED claim underlying a MATCH/MISMATCH has a real `sourceUrl` and a verbatim quote | ≥1 evidence entry per MATCH/MISMATCH segment; URL present | "Real" and "verbatim" need the source. The verifier checks both at run time, but fetched text is **not persisted** (Gate Audit §11.6). | Classification is not stored today, so "OBSERVED" can only be inferred from `fit` until implementation. | Partly. "Every MATCH/MISMATCH has ≥1 evidence entry" is guaranteed by the schema. "Real/verbatim" is not tautological at session time. |
| **§6.3 structural**: confidence and basis populated and consistent with classification | All of it, from the stored row (§14.5) | — | **Everything, today**: the fields do not exist (F-1 gap). | **Yes, by construction.** F1-D §8 says so. |
| **§6.3 substantive**: OBSERVED vs. INFERRED in substance | Rationale and quotes | Yes. The facilitator reads the quote *in its source*, plus the rationale, and looks for an uncited premise. | Reliable source capture: fetched text is not persisted. The live page may drift from what the model saw (A-11). | **No.** It compares the label with the evidence, so it can fail when the structural part passes. |
| **§6.4** manual spot-check of ≥1 OBSERVED claim against the actual fetched source | Selected segment's URL/quote | Yes, the actual fetched document | Same source-capture limit (A-11) | No. It tests provenance. |

**F1-D's structural/substantive split is preserved.**

**Where the results would be recorded (A-12, documentation inconsistency, introduced by F1-D):**
- F1-D §8 says §6.3 findings go in "the record's existing §6.3 evidence-check entries".
- The D11-H record has **no** section or field labelled §6.3.
- Its relevant places are: §8 (per-segment Fit/Rationale/Evidence, with **no** confidence, basis or classification columns), §12 ("Evidence supports stated determination", facilitator notes), and §21 (assessment).
- The current documents do not say which of these holds the §6.3 structural and substantive results, or where "populated" confidence/basis values are recorded.
- The facilitator record was not modified. The question is left **unresolved**.

---

### 14. Provider-Neutrality Audit

| Component | Observation | F-1 impact |
|---|---|---|
| `ResearchProviderInput` (`provider.ts:29`) | `targetSegments?: readonly string[]` (D8 Widening) | None. F-1 is output-only. |
| Shared schema | Single `leadResearchSchema` / `categorySegmentSchema` | Model-facing additions go here once (F-1 §16) |
| Prompt (`prompt.ts:31, 43-49`) | One shared `SYSTEM_PROMPT` and `buildUserMessage` | Needs the F1-D §11.3 wording. Currently says "exactly like an OBSERVED claim elsewhere" (A-5). |
| Anthropic adapter (`anthropicModel.ts:88`) | `zodToJsonSchema(leadResearchSchema, {defs:{Observation}})` | Picks up additions automatically. The union-field limit is noted in `jsonSchema.ts:37-47`. |
| OpenAI adapter (`openAIModel.ts:110-116`) | `strict: true`, same derived schema | Same. Strict mode needs every property to be required, and a non-nullable integer `confidence` meets that. |
| Gemini adapter (`geminiModel.ts:72-110, 150`) | `toGeminiSchema` supports object/array/string/integer/anyOf-null | `confidence` (integer) is supported. Bounds are not emitted and are enforced by Zod/repair, which is the existing behavior for Observation confidence. |
| JSON-schema tests (`jsonSchema.test.ts:~186-205`) | Assert `anyOfCount === 3` (including the nullable segment `rationale`) and no `minimum`/`maximum` | If the implementation changes whether the model-facing `rationale` is nullable, this count changes. Implementation detail (A-4). |
| Fallback provider (`fallbackResearchProvider.ts:93-120`) | Validates every attempt against the same schema | Unchanged control flow |
| Code-assigned `basis`/`classification` | To be set in shared code after validation (`service.ts`/`toSegmentDeterminations`) | Provider-agnostic by placement |

**F-1 introduces no provider-specific field, value, prompt or post-processing.**

The D11-F precondition (structured-output translation tests for the extended schema) is
re-applied by F-1 §16 and stays **outstanding**, because nothing has been implemented.

**Result: CONFORMING.**

---

### 15. Persistence / Attribution Audit

| Concern | Evidence | F-1 effect |
|---|---|---|
| Prospect ownership | Reads join `prospects` on `user_id` (`categoryPlausibilityPgRepository.ts:73-96`) | None |
| Search attribution | `search_id` column; `save` input | None |
| Current determination | `superseded_at IS NULL ORDER BY created_at DESC, id DESC LIMIT 1` | None. No JSONB key is read. |
| Supersession | `UPDATE … WHERE search_id=$1 AND prospect_id=$2` | None |
| Migration 0027 structure | JSONB `segment_results`; `aggregate_result` check constraint | No DDL. Header comment will be stale (F-1 §17). |
| D1/D7 separation | Separate table; nothing flows to `research_signals` | None |

**Persistence limitations affecting D11:**
- Fetched source text is not persisted (A-11, PRE-EXISTING).
- Reads have no runtime validation of the JSONB shape (A-10, PRE-EXISTING). A malformed row would pass the type silently.
- Zero-segment rows have no version marker (A-9).

**Result: CONFORMING.**

---

### 16. UI Audit

The UI is `opportunities/[id]/page.tsx:160-185`.

| Element | Contract (F-1 §15) | CODE VERIFIED (today) | REAL-DATA RENDERING |
|---|---|---|---|
| MATCH / MISMATCH / UNKNOWN (aggregate and per segment) | literal | Rendered (`h2` aggregate; `{segment.fit}`) | UNVERIFIED |
| Rationale | when non-null; now also model-reported UNKNOWN | Rendered when non-null. UNKNOWN is always null today. | UNVERIFIED |
| Evidence quote / label / URL | label links to URL, then quote | Rendered | UNVERIFIED |
| Confidence | MATCH/MISMATCH only | **Not rendered** (field absent) | UNVERIFIED |
| Basis | literal value | **Not rendered** (field absent) | UNVERIFIED |
| Classification | **not rendered** (F1-D) | Not rendered (conforming) | n/a |
| Legacy rows | omit absent fields | Absent fields are simply not referenced today | UNVERIFIED |
| Provenance (first-party/supporting label, D10 §5 / Constraint 5) | untouched by F-1 | No separate label. Only `sourceLabel` ("Homepage"). | UNVERIFIED |

**Observations outside F-1 (PRE-EXISTING, noted only):**
- Whether the `sourceLabel` "Homepage" satisfies D10 Constraint 5's first-party/supporting label is not determined by any F-1 document. This audit does not decide it.
- `key={segment.segment}` would collide if a `targetCustomer` repeated a segment.

Both are PRE-EXISTING, NOT INTRODUCED BY F1, and non-blocking for F-1.

**Result:** the contract can be supported by the existing section with additive
rendering. Implementation is outstanding. No browser test was performed.

---

### 17. Test-Coverage Audit

Existing suites were last recorded GREEN, with no source changes since (§2):
- `core-research` 249/249;
- `core-qualification` 30/30;
- `core-opportunity` 95/95;
- `core-discovery` 25/25.

They were not re-run.

| Area | Existing coverage (file: cases) | F-1-specific coverage | Classification |
|---|---|---|---|
| F1-A confidence | none for segments | none | Missing: required with implementation. Not a blocker to the contract. |
| F1-B basis (3 values) | none | none | Missing: required with implementation |
| F1-C rationale for UNKNOWN | none. No direct `categorySegmentSchema` test found; UNKNOWN-null is enforced but untested at schema level. | none | Missing |
| F1-D classification / separate type | none | none | Missing |
| F1-E pathways | `categoryPlausibility.test.ts`: empty response accepted (107), wrong length (112), valid evidence (120), UNKNOWN not inspected (143), missing position → UNKNOWN (162), undefined results (167) | A/B distinction untested | Partial; the distinction is missing |
| F1-F legacy rows | none | none | Missing |
| Provider pass-through | `anthropicResearchProvider.test.ts:93`, `fallbackResearchProvider.test.ts:279-280` (GAP 1 CLOSED) | n/a (input) | Existing, passing |
| Structured-output translation | `jsonSchema.test.ts:~186-205` (anyOf=3, no bounds); Gemini/OpenAI adapter tests exist | Extended segment schema not covered | Missing, and required by D11-F before any session |
| Prompt rendering | `research.test.ts:211-240` (segments ordered/verbatim/omitted) | No test for F1-D §11.3 wording | Missing |
| Persistence | Integration suites wire `createPgCategoryPlausibilityRepository` (e.g. `client-finder-web.integration.test.ts:694`); `worker.test.ts` fake repository | No test of persisted segment field shape | Non-blocking gap |
| Qualification mapping | `evaluator.test.ts:304-368` (MATCH/MISMATCH/UNKNOWN/null/deterministic) | F-1 does not change it | Existing, passing |
| Aggregation / parsing | `categoryPlausibility.test.ts:15-66` | Unaffected | Existing, passing |

**14 integration failures:**
- They are not re-run here. They keep their **PRE-EXISTING** classification: the R-71 `companySummary`/`TOPICAL_FIELDS` fixture interaction (Gate Audit §8, §9).
- They are not attributed to F-1.
- Relevance to F-1: some integration and worker fixtures contain `categoryPlausibility` entries shaped for the current schema (e.g. `worker.test.ts:626, 674`; `client-finder-web.integration.test.ts:575`). A future implementation will need to update those fixtures. That is future implementation impact, not a current failure.

**No blockers to the contract. All F-1 test coverage is outstanding with the implementation.**

---

### 18. Remaining Implementation Details

None of these is resolved here. "Blocking" means blocking the **contract's conformance**.
Live-validation blocking is noted separately.

| ID | Exact question | Authoritative source | Why open | Blocking? | Repository precedent |
|---|---|---|---|---|---|
| A-1 | Confidence calibration guidance: what does 30 mean versus 90? | F-1 §6; Review N-1 | Prompt wording is not locked | No | Observation confidence has no calibration text beyond its bounds (`prompt.ts:19-21`) |
| A-2 | Where exactly code assigns `basis`/`classification` (inside `toSegmentDeterminations` or in `service.ts`) | F-1 §12, §16 | Placement is not specified | No | `toSegmentDeterminations` already zips and defaults UNKNOWN |
| A-3 | D11 §6.3 confidence consistency is structural only. Is that intended to be the whole of "confidence … consistent with classification"? | D11 §6.3; F1-D §8 | F1-D's substantive check concerns classification vs. evidence and is silent on confidence | No. It is a stricter-but-compatible reading, not a contradiction. | Chain precedent: the INFERRED ≤80 cap, declared inapplicable |
| A-4 | Should the model-facing `rationale` stay nullable (only `NO_MODEL_VERDICT` is null, and code sets that)? This affects the `anyOfCount === 3` assertion and the Anthropic union-field budget. | F-1 §13; `jsonSchema.test.ts`; `jsonSchema.ts:37-47` | Not specified | No | The existing nullable `rationale` |
| A-5 | Prompt wording under F1-D §11.3, alongside the shared SYSTEM_PROMPT's ResearchSignal OBSERVED/INFERRED text ("exactly like an OBSERVED claim elsewhere"; INFERRED "Do not attach evidence") | F1-D §11.3, §12 | Wording is explicitly a non-decision | No. It is a live-quality risk: the model sees two OBSERVED meanings. | `prompt.ts:31` segment paragraph |
| A-6 | The generic and targeted repair texts say "the claim is INFERRED or UNKNOWN" (`prompt.ts:86, 158`), which would reach segment failures. A repaired UNKNOWN must also carry a rationale under F-1 §14.3. | F1-D §7; F-1 §14.3 | Existing wording predates F-1 | No | `verifyCategoryPlausibility` messages already say "classify this segment UNKNOWN" |
| A-7 | Name of the feature-local type and schema identifiers | F1-D §9 | Explicitly left to implementation | No | `CATEGORY_FITS`/`categoryFitSchema` pattern |
| A-8 | Read-side type for optional legacy fields | F-1 §11.1 | Shape specified, typing not | No | `DeterminationRow` cast |
| A-9 | How to recognise a zero-segment row as legacy or post-F1 | F-1 §11.1; Review N-5 | No marker or cutoff defined | No (no D11 effect) | None |
| A-10 | Runtime validation of `segment_results` on read; the `quote` vs. `sourceQuote` naming | D10 Constraint 4; repository | Pre-existing; not addressed by F-1 | No | Other pg repositories also map rows without Zod |
| A-11 | Capture of the fetched source for the §6.3 substantive check and the §6.4 spot-check | D11 §6.4; F1-D §8; Gate Audit §11.6 | Fetched text is not persisted | No for the contract; **live-validation prerequisite** | None |
| A-12 | Which D11-H record fields hold the §6.3 structural/substantive results and the confidence/basis/classification values | F1-D §8; D11-H §8, §12, §21 | F1-D refers to entries that do not exist | No for the contract; **live-validation preparation item** | Gate Audit §6: "only as far as §8/§12 free text allows" |
| A-13 | The F-1 Decision §9 still carries the superseded D3 justification and the "exactly the OBSERVED obligation" wording | F-1 §9; F1-D §2.2, §10 | Governance documents are immutable. Supersession is recorded only in the F1-D decision. | No | Final Decision Record's stale D7–D11 "OPEN" text (Gate Audit §9.5) |
| A-14 | D11-F translation tests for the extended schema | D11 §7; F-1 §16 | Nothing implemented | No for the contract; **precondition to any D11 session** | `jsonSchema.test.ts`, Gemini/OpenAI adapter tests |

---

### 19. Pre-Existing vs. New Findings

| Finding | Classification | Category |
|---|---|---|
| F-1 fields (confidence/basis/classification) absent in code; UNKNOWN rationale forced null | PRE-EXISTING (Gate Audit F-1), contract now specified | Implementation not yet done. Live-validation blocker (unchanged). |
| A/B UNKNOWN indistinguishable today | EXISTING BUT NOW EXPOSED BY F1 (Gate Audit F-2) | Implementation not yet done |
| A/C deliberately merged | NOT AN ISSUE (explicit F-1 §10 decision) | Conforming |
| D11 §6.3 "basis populated" versus ResearchSignal "basis null for OBSERVED" | EXISTING BUT NOW EXPOSED BY F1; resolved by F1-B | Conforming |
| C-1 / C-2 / C-3 | Resolved by the F1-D decision | Conforming |
| §6.3 structural part tautological | INTRODUCED BY F1 DECISION (explicitly acknowledged) | Conforming. The substantive part carries the check. |
| A-3 confidence consistency structural only | NEW (this audit) | Non-blocking implementation detail |
| A-4 rationale nullability / anyOf count | NEW (this audit) | Non-blocking implementation detail |
| A-5 two OBSERVED meanings in the shared prompt | EXISTING BUT NOW EXPOSED BY F1 | Non-blocking implementation detail |
| A-6 repair text mentions INFERRED | EXISTING BUT NOW EXPOSED BY F1 | Non-blocking implementation detail |
| A-9 zero-segment rows (N-5) | INTRODUCED BY F1 DECISION (legacy-marker choice) | Non-blocking implementation detail |
| A-10 no read-side validation; `quote` vs. `sourceQuote` | PRE-EXISTING | Pre-existing issue |
| A-11 fetched source not persisted | PRE-EXISTING; now also affects the §6.3 substantive check | Pre-existing issue (live-validation prerequisite) |
| A-12 F1-D §8 references non-existent "§6.3 evidence-check entries"; D11-H has no confidence/basis/classification fields | INTRODUCED BY F1 DECISION (the reference); EXISTING BUT NOW EXPOSED BY F1 (the missing fields) | Documentation/status inconsistency |
| A-13 F-1 §9 superseded text remains in place | INTRODUCED BY F1 DECISION | Documentation/status inconsistency |
| D11 Readiness Audit "CONFORMING WITH NON-BLOCKING NOTES" versus Gate Audit "NOT READY FOR LIVE VALIDATION" | PRE-EXISTING. The later Gate Audit (which found F-1) governs. | Documentation/status inconsistency |
| Final Decision Record stale D7–D11 "OPEN" text | PRE-EXISTING | Documentation/status inconsistency |
| D10 Constraint 5 first-party label; duplicate-segment React key | PRE-EXISTING, NOT F1 | Pre-existing issue |
| 14 integration failures | PRE-EXISTING (R-71 fixture interaction) | Pre-existing issue |
| D11-I provider funding | PRE-EXISTING | Live-validation blocker (unchanged) |
| Unresolved product contradiction | **None found** | — |

---

### 20. Final Classification

```text
CONFORMING WITH NON-BLOCKING NOTES
```

**Basis for this classification:**
- F1-A through F1-F, read together with the F1-D Product Owner decision, form an internally consistent contract.
- The contract conforms to D0–D11 (text unchanged), to the existing ResearchSignal semantics, and to D9 provider neutrality.
- D11 §6.3 remains a meaningful check: structural plus substantive.
- No unresolved product contradiction exists.

**The notes are:**
- non-blocking implementation details A-1 to A-10 and A-14;
- documentation/status inconsistencies A-12 and A-13 (A-12 was introduced by the F1-D decision);
- pre-existing issues.

**This classification concerns the conformance of the F1 contract only. It is distinct from live-validation readiness:**

```text
LIVE-VALIDATION STATUS: NOT READY FOR LIVE VALIDATION   (unchanged)
```

The reasons are unchanged from the Gate Audit:
1. **F-1 is not implemented.** D11 §6.3 still cannot be met by the repository.
2. **D11-I is unresolved.**

Also required before any session:
- the D11-F translation tests for the extended schema (A-14);
- source capture (A-11);
- the D11-H recording location for §6.3 (A-12).

---

### 21. Implementation Authorization Status

```text
IMPLEMENTATION AUTHORIZATION: NOT GRANTED
```

This audit does not implement F-1, fix any finding, amend any decision, update the
D11-H record, or start D11.

```text
D0–D11: IMMUTABLE
F1-A through F1-F: audited against the current authoritative decisions
```

No production code, tests, migrations, schema, configuration, provider, worker, UI,
PRD, or existing governance document was modified.

---

### 22. Safety Verification

```text
git rev-parse HEAD ........ 5992b82b9adff492c480442d68a954f2a03bfb28  (unchanged)
Staged .................... none
git diff --stat ........... 48 files changed, 1260 insertions(+), 59 deletions(-)  (unchanged)
git diff SHA-1 ............ e21f4e759a3adc253faf9971c1d7b6423cd5db31  (identical)
git diff --check .......... clean
git status --short ........ 105 → 106 lines (+ this document only)
Pre-existing untracked files: all 57 SHA-1s identical to baseline
Commit / push ............. none / none
Tests run ................. none (read-only; prior results reused, §17)
Live API/provider/database calls: 0
```

## STOP
