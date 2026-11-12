# Phase K8 — Personalization Fixture Evidence-Taxonomy Audit

READ-ONLY. No source code, tests, migrations, schema, or governance records were
changed in the production of this document.

## 1. Executive Summary

K7's `createHistoricalServiceProfile()` wiring was correct but did not fix the four
failing personalization tests. The actual root cause is R-71: `matchingResearch()`'s
only evidentiary claim — `"needs a website redesign"` — lives in `companySummary`,
and R-71 structurally excludes `companySummary` from offer matching because it is a
topical/descriptive field, not a problem/opportunity field. With that claim excluded,
`toOfferSignals()` returns no eligible rows, `suggestOffers()` returns no match,
`needDetected` is `false`, and qualification never reaches `QUALIFIED`.

This audit concludes the proposed correction — moving the exact same existing claim
from `companySummary` to `visibleProblems` — is a **Case A: pure taxonomy
correction**. It relocates one already-true fact into the schema slot R-71 already
designates for problem/gap statements; it invents nothing, strengthens nothing, and
does not add a second signal. K5-D1's two-signal rule does not even engage for this
fixture, because the test helper constructs a historical-style search
(`isHistoricalStyleSearch === true`), which bypasses `hasCredibleNeedEvidence()`
entirely. **Recommended status: READY FOR TEST-ONLY FIX.**

## 2. Existing `matchingResearch()` Evidence

Source: `tests/integration/personalization.integration.test.ts:90-123`.

| Field | Classification | Value / Content | Confidence |
|---|---|---|---|
| `companySummary` | `OBSERVED` | `"needs a website redesign"`, evidence quote identical, `sourceUrl: WEBSITE.url` | 88 |
| `businessModel` | `UNKNOWN` | `null` | 0 |
| `targetCustomers` | `UNKNOWN` | `null` | 0 |
| `categoryPlausibility` | `fit: 'MATCH'` | rationale "the homepage says they serve restaurants", separate evidence quote | 90 |
| `visibleProblems` | — | `[]` (empty) | — |
| `growthOpportunities`, `aiOpportunities`, `websiteIssues`, `contentOpportunities`, `automationOpportunities` | — | all `[]` | — |
| `recommendedService` | `NONE` | rationale "insufficient evidence", `basedOn: []` | — |
| top-level `confidence` | — | 55 | — |
| `gaps` | — | `[]` | — |

**The exact claim:** `"needs a website redesign"`, carried as both the `OBSERVED`
value and its own evidence quote — i.e., the fixture treats this as a verbatim,
sourced fact, not an inference.

**Usage by the four failing tests** (all under `describe('evaluateOpportunityPersonalization', …)`):

1. `R-45: generate -> persist -> read back for a QUALIFIED Opportunity` (line 271) — needs `qualification.state === 'QUALIFIED'` to exercise the round-trip.
2. `R-42: INSUFFICIENT_EVIDENCE produces no Personalization` (line 327) — needs the *first* `evaluateQualificationForOwner` call to be `QUALIFIED` (via `matchingResearch()`) so a second run with `unmatchedResearch()` can demonstrate the evidence-superseded transition to `INSUFFICIENT_EVIDENCE`.
3. `R-49/R-50: idempotency` (line 375) — needs `QUALIFIED` so `evaluateOpportunityPersonalization` can be run twice and compared.
4. `a Qualification that later moves away from QUALIFIED leaves the existing Personalization row untouched` (line 407) — needs the *first* Personalization to exist (requires `QUALIFIED`) before the state-change-preservation assertion is meaningful.

All four need `matchingResearch()` to establish exactly one qualifying,
offer-matchable signal — none of them inspects `companySummary` vs `visibleProblems`
placement directly.

## 3. R-71 Field Semantics

Source: `packages/core-opportunity/src/adapters.ts:135-208`;
`requirement/MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md:161-217`;
`requirement/PHASE_24_R70_R71_DECISION.md:189-239`.

- **Excluded (topical/descriptive) fields:** `companySummary`, `businessModel`, `targetCustomers` — these answer "what is this business," and a service keyword appearing in a topical description does not by itself prove a service-addressable problem exists.
- **Included (problem/opportunity, offer-eligible) fields:** `visibleProblems`, `growthOpportunities`, `aiOpportunities`, `websiteIssues`, `contentOpportunities`, `automationOpportunities` — these answer "what is wrong or missing," and are the schema's designated slot for problem/gap-shaped findings.
- Implementation: `TOPICAL_FIELDS = new Set(['companySummary', 'businessModel', 'targetCustomers'])`, enforced in `eligibleRows()` (`adapters.ts:182-195`), which both `toOfferSignals()` and K5-D1's `hasCredibleNeedEvidence()` consume.
- Per `PHASE_24_R70_R71_DECISION.md`, this split "is confirmed directly from the research schema's own field structure — it is not a new classification invented for R-71" (schema source: `packages/core-research/src/schema.ts:288-304`, `observationSchema` single fields vs. `observationList` fields).

`visibleProblems` is explicitly, structurally intended to hold problem/gap
statements — exactly the semantic category `"needs a website redesign"` falls into.

## 4. "Needs a Website Redesign" Classification

**Classification: A — Pure taxonomy correction.**

- The claim is already a problem/gap statement on its face: "needs X" asserts an absence/deficiency, not a topical description of the business (contrast with e.g. "they are a web design agency," which would be topical).
- Moving the identical string, evidence quote, `sourceUrl`, `sourceLabel`, classification (`OBSERVED`), and confidence (88) from `companySummary` into a single `visibleProblems` entry changes only which schema field holds the fact — it does not reinterpret, strengthen, or add to it.
- No additional evidence, source, or inference is required to support treating it as a visible problem; the fixture's own text already says so.
- The correction is consistent with R-71's own stated boundary (§3): the line is drawn by *which field* an Observation answers, and this claim's content answers the problem/opportunity question, not the "what is this business" question. Its current placement in `companySummary` is itself the taxonomy error being corrected.

This is **not** Case B: nothing about the claim's meaning changes. It is **not**
Case C: the fixture's existing quote and source fully support the classification —
nothing is invented.

## 5. K5-D1 Interaction

Source: `packages/core-opportunity/src/adapters.ts:210-258`;
`packages/core-opportunity/src/service.ts:149-162`.

K5-D1 (`hasCredibleNeedEvidence()`) requires ≥2 independent matched signals from
distinct Observation fields, with ≥1 at full `OBSERVED` confidence, **but only for a
NEW (system-sentinel-`targetCustomer`) search**. For a historical-style search
(`parseTargetSegments(search.parameters.targetCustomer).length > 0`), the `||`
short-circuit in `service.ts:155-158` means K5-D1 **never runs**; `needDetected`
reduces to the pre-K5 rule, `top !== undefined` alone.

This fixture's test helper, `createProspect()` (test file lines 228-245), explicitly
builds via `createHistoricalServiceProfile(...)` with `targetCustomer: 'Restaurants'`
(a real, non-sentinel value — see `sampleProfileInput()`, line 216, and the inline
comment at lines 234-238 referencing K5-D2/K7). This makes `isHistoricalStyleSearch
=== true` for every test in this file.

**Conclusion:** K5-D1's two-signal requirement does not apply to this fixture at
all — it is bypassed by the historical exemption. A single matched signal (whether
read from `companySummary` or `visibleProblems`) is sufficient for `needDetected`.
The proposed fix therefore does not need, and must not introduce, a second
independent signal — it simply needs the existing single signal to land in a field
R-71 will not filter out.

## 6. Personalization Test Intent

Tracing the chain with the claim relocated to `visibleProblems` (single entry,
identical content):

`visibleProblems` is not in `TOPICAL_FIELDS` → the row survives `eligibleRows()` →
`toOfferSignals()` includes it → `suggestOffers()` matches it against the
`WEBSITE`-trigger, `redesign`-keyword service rule (`sampleProfileInput()`,
`triggers: ['WEBSITE']`, `keywords: ['redesign']`) → `top` is defined →
`isHistoricalStyleSearch === true` short-circuits `needDetected` to `true` (§5) →
`opportunity.needDetected === true` → qualification proceeds to evaluate category
plausibility (already `MATCH` in the fixture) and reaches `QUALIFIED`, exactly as
each test currently expects before K7/this root cause was isolated.

All four tests' actual exercised behavior — round-trip evidence/offer fidelity,
transition to `INSUFFICIENT_EVIDENCE` on a second `unmatchedResearch()` run,
idempotent repeated evaluation, and preservation of an existing Personalization row
after qualification later degrades — depends only on reaching `QUALIFIED` once via a
single matched signal, then (for tests 2 and 4) losing that match via
`unmatchedResearch()`. None of the four inspects which Research field carried the
original signal. Relocating the claim preserves every test's original semantic
purpose unchanged.

## 7. Historical Helper

`createHistoricalServiceProfile(...)` (used at test file line 239, from
`./support/historicalServiceProfile`) remains correct and should remain as-is. It is
precisely what makes `isHistoricalStyleSearch === true` for this suite (§5), and
nothing in this audit's findings calls that wiring into question. **Not reverted;
no change recommended.**

## 8. Recommended Resolution

**Case A applies.** A test-only move of the SAME existing claim — same string, same
evidence quote, same `sourceUrl`/`sourceLabel`, same classification (`OBSERVED`),
same confidence (88) — from `companySummary` to a single-entry `visibleProblems`
array in `matchingResearch()` is an ordinary fixture taxonomy correction. It is not
a new product decision: it does not change what the fixture claims about the
business, does not add a second signal, does not touch R-71, K5-D1, or
`isHistoricalStyleSearch`, and does not require a PO decision. The companion change
needed is simply that `companySummary` no longer duplicates the relocated claim
(e.g., reverts to `UNKNOWN`/`null`), so the fixture carries the fact exactly once,
in the field R-71 already recognizes as its home.

## 9. Final Status

**READY FOR TEST-ONLY FIX**
