# PHASE 24 — SCENARIO E, OPTION C — IMPLEMENTATION SCOPE-LOCK

**Status:** SCOPE-LOCK — PLANNING ONLY, IMPLEMENTATION NOT AUTHORIZED
**Basis:** read-only trace of `packages/core-opportunity/src/{adapters.ts,service.ts}`,
`packages/core-qualification/src/{rules.ts,evaluator.ts,types.ts,service.ts,evaluator.test.ts}`,
`packages/core-research/src/{schema.ts,types.ts,provenance.ts,scoringAdapter.ts}`, and
`apps/worker/src/searchWorker/{worker.ts,worker.test.ts}`, performed against the current
working tree of branch `phase-17-r34-worker-orchestration`.
**Source of truth (unmodified by this document):**
- [PHASE_24_R70_R71_DECISION.md](PHASE_24_R70_R71_DECISION.md)
- [PHASE_24_SCENARIO_E_DECISION_CONTRACT.md](PHASE_24_SCENARIO_E_DECISION_CONTRACT.md)
- [PHASE_24_SCENARIO_E_PRODUCT_DECISION.md](PHASE_24_SCENARIO_E_PRODUCT_DECISION.md)

No production code, test, schema, or migration is changed by this document.

---

## 1. Product Decision

```text
SCENARIO E:
OPTION C — OBSERVED REQUIRED
```

```text
OBSERVED evidence            → may satisfy the evidence requirement for qualification
INFERRED-only evidence       → must NOT satisfy the evidence requirement for qualification
UNKNOWN-only evidence        → must NOT satisfy the evidence requirement for qualification
OBSERVED + INFERRED          → OBSERVED satisfies the evidence requirement
```

This is a change to the **minimum evidence classification required for qualification**,
not a redefinition of `INFERRED` as invalid, not a confidence threshold, and not a
corroboration rule. `INFERRED` remains a first-class schema classification
(`packages/core-research/src/schema.ts`'s `CLASSIFICATIONS = ['OBSERVED', 'INFERRED',
'UNKNOWN']`) with its own obligations (`basis` required, confidence capped at 80, `evidence`
forbidden) — Option C changes what qualification requires, not what the classification means.

---

## 2. Exact Scenario E Contract

```text
1. Can INFERRED-only evidence reach QUALIFIED?
   No. QUALIFIED requires at least one live, OBSERVED ResearchSignal.

2. Is corroboration required?
   No. Option B (corroboration) is not adopted. OBSERVED's existing provenance
   verification (packages/core-research/src/provenance.ts's verifyProvenance()) already
   ties every OBSERVED claim to a checked, quoted source document.

3. What role does OBSERVED play?
   Required. OBSERVED becomes the sole classification that can satisfy the
   EVIDENCE_PRESENT qualification criterion.

4. What role does confidence play?
   None — unchanged. No confidence threshold is introduced. A confidence=1 OBSERVED
   signal still satisfies EVIDENCE_PRESENT, exactly as it does today (pinned by
   packages/core-qualification/src/evaluator.test.ts's "Decision D2 pinned" test, which
   already exercises an OBSERVED default fixture at confidence:1 — see §5).

5. What role does source independence play?
   None. Not applicable under Option C — OBSERVED's existing provenance check already
   ties each qualifying claim to a real, quoted source document. Source independence
   remains open for any future Option B path.

6. Does this change R-70?
   No. R-70 (`packages/core-opportunity/src/adapters.ts`'s hasConflictingSource /
   conflictsWithBusiness / selfIdentifiedBusiness) runs at the need-detection layer,
   before Scenario E's gate is reached, and is untouched.

7. Does this change R-71?
   No. R-71 (`adapters.ts`'s TOPICAL_FIELDS exclusion) runs at the same need-detection
   layer and is untouched.

8. Does this change needDetected / offer detection?
   No. `toOfferSignals()` (adapters.ts) and `suggestOffers()` remain classification-blind
   beyond excluding UNKNOWN — INFERRED evidence can still produce `needDetected=true` and
   a recommended offer. Only the downstream EVIDENCE_PRESENT qualification criterion
   changes. See §6 for why this boundary is deliberate.
```

---

## 3. Evidence Truth Table

| Evidence classifications present | OBSERVED present? | Scenario E evidence gate | Expected qualification eligibility |
| --- | ---: | --- | --- |
| OBSERVED | Yes | Pass | Eligible if `needDetected` and other criteria pass |
| INFERRED | No | Fail | Not eligible (EVIDENCE_PRESENT fails → `INSUFFICIENT_EVIDENCE`, assuming `needDetected=true`) |
| UNKNOWN | No | Fail | Not eligible (identical to today — UNKNOWN was already excluded) |
| OBSERVED + INFERRED | Yes | Pass | Eligible if other criteria pass |
| OBSERVED + UNKNOWN | Yes | Pass | Eligible if other criteria pass |
| INFERRED + UNKNOWN | No | Fail | Not eligible |

"Eligible" means the EVIDENCE_PRESENT criterion is satisfied; it does not by itself mean
`QUALIFIED`. `QualificationState.QUALIFIED` (`packages/core-qualification/src/evaluator.ts`)
additionally requires `NEED_DETECTED` to have passed first (short-circuiting — Decision D1),
and R-70/R-71 continue to gate `needDetected` upstream in `adapters.ts`, unchanged.

---

## 4. Regression Contract

All six scenarios assume `needDetected=true` was already reached (i.e., R-70/R-71 passed and
`suggestOffers()` matched); NEED_DETECTED=false scenarios short-circuit before this gate is
reached at all (unaffected by Option C — see §6).

**E1 — INFERRED-only**
```text
Input:       classification=INFERRED, OBSERVED count=0, UNKNOWN count=0
Gate:        FAIL
Result:      EVIDENCE_PRESENT.satisfied=false → state=INSUFFICIENT_EVIDENCE (not QUALIFIED)
```

**E2 — OBSERVED-only**
```text
Input:       classification=OBSERVED, OBSERVED count=1, UNKNOWN count=0
Gate:        PASS
Result:      EVIDENCE_PRESENT.satisfied=true → QUALIFIED if NEED_DETECTED also passed
```

**E3 — OBSERVED + INFERRED**
```text
Input:       OBSERVED count>=1, INFERRED count>=1
Gate:        PASS (on the OBSERVED signal(s))
Result:      EVIDENCE_PRESENT.satisfied=true → QUALIFIED if NEED_DETECTED also passed
             evidenceSignalIds reflects only the OBSERVED signal id(s) — see §6
```

**E4 — UNKNOWN-only**
```text
Input:       UNKNOWN count>=1, OBSERVED count=0
Gate:        FAIL
Result:      EVIDENCE_PRESENT.satisfied=false → not QUALIFIED (identical to current behavior)
```

**E5 — INFERRED + UNKNOWN**
```text
Input:       INFERRED count>=1, UNKNOWN count>=1, OBSERVED count=0
Gate:        FAIL
Result:      EVIDENCE_PRESENT.satisfied=false → not QUALIFIED
```

**E6 — OBSERVED + UNKNOWN**
```text
Input:       OBSERVED count>=1, UNKNOWN count>=1
Gate:        PASS (on the OBSERVED signal(s))
Result:      EVIDENCE_PRESENT.satisfied=true → QUALIFIED if NEED_DETECTED also passed
```

---

## 5. Existing Tests to Preserve

### R-70 (`apps/worker/src/searchWorker/worker.test.ts`, describe block starting line 1105)
```text
B1 (line 1106): correct-business OBSERVED evidence remains usable → QUALIFIED
                Unaffected: evidence is OBSERVED; gate passes exactly as before.
                Expected status: PASS

B2 (line 1146): wrong-business source MUST NOT qualify
                Unaffected: needDetected=false already short-circuits before
                EVIDENCE_PRESENT is reached (R-70 acts at the need-detection layer).
                Expected status: PASS

B3 (line 1212): unattributable source MUST NOT qualify
                Unaffected, same short-circuit reasoning as B2.
                Expected status: PASS
```

### R-71 (same file, describe block starting line 1256)
```text
D1 (line 1257): bare topical mention does not create a need
                Unaffected: needDetected=false short-circuits before EVIDENCE_PRESENT.
                Expected status: PASS

D2 (line 1309): genuine, service-relevant problem survives the relevance gate → QUALIFIED
                Unaffected: the qualifying evidence is OBSERVED (observedClaim fixture);
                gate passes exactly as before.
                Expected status: PASS

D3 (line 1353): service-unrelated problem does not create a need
                Unaffected: needDetected=false short-circuits before EVIDENCE_PRESENT.
                Expected status: PASS
```

### Scenario E (same file, line 1395)
```text
Current test name:
"phase24 regression: inferred-only evidence currently qualifies equivalently to observed
(Scenario E — open decision)"

Current assertion (lines 1464-1471):
  expect(opportunities.rows[0]!.needDetected).toBe(true);
  expect(qualifications.rows[0]!.state).toBe('QUALIFIED');
  const evidencePresent = qualifications.rows[0]!.criteria.find(c => c.criterion === 'EVIDENCE_PRESENT')!;
  expect(evidencePresent.satisfied).toBe(true);

Required post-implementation assertion:
  expect(opportunities.rows[0]!.needDetected).toBe(true);           // UNCHANGED — Layer B untouched
  expect(qualifications.rows[0]!.state).toBe('INSUFFICIENT_EVIDENCE'); // CHANGED from QUALIFIED
  const evidencePresent = qualifications.rows[0]!.criteria.find(c => c.criterion === 'EVIDENCE_PRESENT')!;
  expect(evidencePresent.satisfied).toBe(false);                    // CHANGED from true

The test's own name, and its "CURRENT BEHAVIOR" / "POST-PHASE-24 (not implemented by this
test)" comments (lines 1457-1482), must also be updated to state the new contract instead of
promising it is not yet implemented — this is expected test maintenance accompanying the
policy change, not a violation of "do not change E's assertions without the decision being
recorded first" (that decision is what this scope-lock, and its governing product-decision
documents, record).
```

### Qualification unit tests to re-verify (`packages/core-qualification/src/evaluator.test.ts`)
```text
Line 27 "QUALIFIED: needDetected and at least one live, evidentiary signal":
  Uses the signal() fixture's default classification: 'OBSERVED' (line 15). Unaffected in
  outcome (state remains QUALIFIED), BUT its exact-match assertion on criteria (lines 31-44)
  includes the literal reason string 'EVIDENCE_PRESENT'... '1 live, non-UNKNOWN signal(s)
  support the detected need' (line 41). If a future implementation changes this reason
  string to reflect "OBSERVED" rather than "non-UNKNOWN" (a likely, though not mandatory,
  wording update — see §7), this test's expected string must be updated in the same change.
  Expected status: PASS, CONDITIONAL ON reason-string parity (flagged, not a defect)

Line 61 "INSUFFICIENT_EVIDENCE: needDetected=true but zero live signals remain (all superseded)":
  Uses default OBSERVED classification, superseded. Unaffected — still excluded by the
  existing supersededAt===null check, which Option C does not touch.
  Expected status: PASS (reason-string caveat as above, line 70)

Line 74 "INSUFFICIENT_EVIDENCE: no signals at all":
  Unaffected. Expected status: PASS

Line 80 "INSUFFICIENT_EVIDENCE: only UNKNOWN signals remain":
  Unaffected — UNKNOWN was already excluded before Option C and remains excluded after.
  Expected status: PASS

Line 89 "Decision D2 pinned: a low-confidence evidentiary signal still yields QUALIFIED":
  Uses default OBSERVED classification at confidence:1. Directly demonstrates the required
  "Confidence: UNCHANGED" contract (§8 of the governing task, §2 item 4 above) — an OBSERVED
  signal at the schema's lowest confidence value must still satisfy EVIDENCE_PRESENT.
  Expected status: PASS, and this test's continued PASS is itself part of the acceptance
  criteria for a correct implementation.

Line 98 "Decision D3 pinned: contradictory-looking signal text cannot disqualify":
  Unaffected — no negative-evidence criterion exists before or after Option C.
  Expected status: PASS
```

---

## 6. Implementation Boundary

Three candidate layers were compared, per the governing task's §4:

**A. Research classification layer** (`packages/core-research/src/{schema.ts,provenance.ts}`)
— REJECTED. This layer defines what OBSERVED/INFERRED/UNKNOWN *mean* and verifies OBSERVED's
provenance; it has no concept of "qualification" at all. Changing it would either weaken
provenance verification (out of scope) or redefine INFERRED itself (explicitly forbidden by
the governing task's §5 — INFERRED must not become "invalid research"). INFERRED must remain
available here, unaffected, for scoring, ranking, and display.

**B. Offer / need-detection layer** (`packages/core-opportunity/src/adapters.ts`'s
`toOfferSignals()`, feeding `service.ts`'s `createOpportunityForOwner()` → `needDetected`)
— REJECTED as the Scenario E gate, though it is where R-70/R-71 already run. `toOfferSignals()`
is classification-blind beyond excluding UNKNOWN (its own comment, adapters.ts:161-164,
states the adapted `ResearchSignal` contract "carries no classification field to apply
[a discount] by"). Enforcing OBSERVED-required here would mean an INFERRED-only prospect
never reaches `needDetected=true` at all — collapsing "was a need detected" (Layer B) into
"is the evidence strong enough to qualify" (a separate question, per the governing task's
§4 framing and the product decision's own distinction between "evidence validity" and
"qualification sufficiency", `PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §2). It would also
make INFERRED evidence invisible to `suggestOffers()`'s ranking/rationale entirely, which
the governing task's §5 says must not happen incidentally.

**C. Qualification layer** (`packages/core-qualification/src/rules.ts`'s
`evaluateEvidencePresent()` / its internal `isEvidentiary()` predicate) — **SELECTED**.

```text
Current predicate (rules.ts:22-24):
  function isEvidentiary(signal: StoredResearchSignal): boolean {
    return signal.supersededAt === null && signal.classification !== 'UNKNOWN';
  }

Required predicate:
  return signal.supersededAt === null && signal.classification === 'OBSERVED';
```

This is the earliest point at which "is there sufficient evidence to qualify" is evaluated
as its own, separate criterion (`EVIDENCE_PRESENT`, already structurally distinct from
`NEED_DETECTED` in `evaluator.ts`'s short-circuiting two-criterion design). It:
- preserves `needDetected` exactly as computed today (Layer B untouched — AC-9/AC-10);
- preserves R-70/R-71 exactly as implemented today (both run upstream, in `adapters.ts`,
  before `needDetected` is even set — orthogonal to this layer, confirmed by B1-B3/D1-D3 in
  §5 all short-circuiting on NEED_DETECTED before EVIDENCE_PRESENT is reached, except B1/D2
  where the qualifying evidence is already OBSERVED);
- preserves INFERRED's availability for every other purpose the architecture supports today
  (scoring via `core-research/src/scoringAdapter.ts`'s `INFERENCE_DISCOUNT`, ranking,
  persistence, display) — none of those code paths are touched;
- requires changing a single, already-existing classification-based filter, not introducing
  a new concept, table, or field.

**D. Multiple layers** — REJECTED. Enforcing the rule in both B and C would duplicate the
same semantic decision in two places with two different meanings ("is there a need" vs "is
the evidence strong enough"), and — per the analysis above — enforcing it at B would already
be a scope violation on its own (redefining `needDetected`). One location (C) is sufficient
and correct.

---

## 7. Files Expected to Change

```text
File:              packages/core-qualification/src/rules.ts
Reason:            Contains the sole gate identified in §6 — isEvidentiary()'s classification
                   filter, consumed only by evaluateEvidencePresent().
Expected change:   Narrow isEvidentiary()'s classification check from
                   `!== 'UNKNOWN'` to `=== 'OBSERVED'`. The satisfied/reason string in
                   evaluateEvidencePresent() may also need updating to describe "OBSERVED"
                   rather than "non-UNKNOWN" for observability (R-40) accuracy — a wording
                   change only, not a new criterion.
Must NOT change:   evaluateNeedDetected(); the two-criterion structure; the short-circuit
                   order (NEED_DETECTED before EVIDENCE_PRESENT); the function signatures;
                   any confidence read (none exists today and none should be added — §8 of
                   the governing task).

File:              apps/worker/src/searchWorker/worker.test.ts
Reason:            Contains the pinned Scenario E regression test (line 1395) that currently
                   asserts the OLD (Option A) behavior and explicitly forbids changing its
                   assertions "without that decision being recorded first" — this scope-lock,
                   built on the three authoritative product-decision documents, is that
                   record.
Expected change:   Update the named test's assertions per §5 above (state →
                   INSUFFICIENT_EVIDENCE, evidencePresent.satisfied → false), and its
                   name/comments to describe the new, settled contract instead of an open
                   decision. B1/B2/B3/D1/D2/D3 in the same file require no assertion changes
                   (§5) but should be re-run to confirm they still pass unmodified.
Must NOT change:   Any fixture, helper, or assertion belonging to B1-B3/D1-D3; the
                   `realProvenanceResearchProvider`/`fakeModel`/`observedClaim` helpers;
                   any other describe block in this file (personalization, ownership,
                   idempotency, outreach preparation, follow-up preparation).

File:              packages/core-qualification/src/evaluator.test.ts
Reason:            May need the literal reason-string assertion at line 41 (and the
                   analogous one at line 70) updated IF rules.ts's reason string changes
                   (§7, rules.ts entry above) — a mechanical consequence of a wording change,
                   not a new test.
Expected change:   Update only the literal `reason` string(s) actually touched by the
                   rules.ts wording change, if any is made. No new test cases are required
                   by Option C itself (D2/D3-pinned tests at lines 89/98 already exercise
                   the OBSERVED-default fixture and require no change per §5).
Must NOT change:   Any other assertion, the signal() fixture's other defaults, or the
                   NOT_QUALIFIED/short-circuit tests.
```

---

## 8. Files Explicitly Out of Scope

```text
packages/core-opportunity/src/adapters.ts           — R-70/R-71/toOfferSignals: UNCHANGED (§6)
packages/core-opportunity/src/service.ts             — needDetected computation: UNCHANGED
packages/core-research/src/schema.ts                 — classification semantics: UNCHANGED
packages/core-research/src/provenance.ts              — OBSERVED provenance check: UNCHANGED
packages/core-research/src/scoringAdapter.ts          — INFERENCE_DISCOUNT/scoring: UNCHANGED
packages/core-research/src/{researcher,provider,anthropicResearchProvider,
  sourceDocumentProvider,mapping,service}.ts          — research/discovery pipeline: UNCHANGED
packages/core-discovery/src/{normalize,service}.ts    — discovery: UNCHANGED
packages/core-qualification/src/{evaluator.ts,types.ts,service.ts,repository.ts,
  pgRepository.ts,index.ts}                           — structure/persistence: UNCHANGED
                                                         (only rules.ts's internal filter
                                                         predicate changes; evaluator.ts's
                                                         call into it is untouched)
apps/worker/src/searchWorker/worker.ts                — orchestration: UNCHANGED (already
                                                         calls evaluateQualificationForOwner()
                                                         unconditionally when
                                                         deps.qualifications is supplied;
                                                         no new wiring needed)
Any migration / schema file                           — NONE required or created
packages/core-outreach-preparation/*,
packages/core-followup-preparation/*                  — UNCHANGED, out of scope (§9 of the
                                                         Decision Contract: a separate,
                                                         future trust-boundary question)
```

---

## 9. Acceptance Criteria

```text
AC-1  INFERRED-only evidence cannot satisfy EVIDENCE_PRESENT.                    — §3, §4 E1
AC-2  OBSERVED evidence can satisfy EVIDENCE_PRESENT.                            — §3, §4 E2
AC-3  OBSERVED + INFERRED remains eligible (via the OBSERVED signal(s)).         — §3, §4 E3
AC-4  UNKNOWN-only cannot satisfy EVIDENCE_PRESENT.                              — §3, §4 E4
AC-5  INFERRED + UNKNOWN cannot satisfy EVIDENCE_PRESENT.                        — §3, §4 E5
AC-6  OBSERVED + UNKNOWN remains eligible subject to existing criteria.          — §3, §4 E6
AC-7  R-70 behavior is unchanged (B1/B2/B3 all still pass, unmodified).          — §5, §6
AC-8  R-71 behavior is unchanged (D1/D2/D3 all still pass, unmodified).          — §5, §6
AC-9  Research classification semantics (schema.ts) are unchanged.              — §6, §8
AC-10 Ranking/scoring semantics (scoringAdapter.ts, INFERENCE_DISCOUNT) unchanged — §6, §8
AC-11 No additional LLM/API calls are introduced.                               — §11
AC-12 No scraper/provider is introduced.                                        — §11
AC-13 No schema migration is required.                                          — confirmed;
                                                                                    see §10 —
                                                                                    no stop
                                                                                    condition
                                                                                    was found
```

---

## 10. Stop Conditions

```text
None of the following were discovered during this trace:

1. Changing the Phase 18 source-document boundary        — NOT REQUIRED. The gate operates
                                                             entirely on the already-persisted
                                                             `classification` field
                                                             (StoredResearchSignal); no
                                                             additional source-document data
                                                             is needed.
2. A schema migration                                     — NOT REQUIRED. No new column,
                                                             table, or persisted shape is
                                                             needed; `classification` already
                                                             exists on every ResearchSignal row.
3. A new provider                                          — NOT REQUIRED.
4. A scraper                                                — NOT REQUIRED.
5. Additional LLM calls                                    — NOT REQUIRED.
6. R-70 must change                                         — FALSE; R-70 is orthogonal (§6).
7. R-71 must change                                         — FALSE; R-71 is orthogonal (§6).
8. Research classification semantics must change            — FALSE; only a downstream
                                                             consumer's filter changes.
9. Existing opportunity/qualification contracts cannot      — FALSE; evaluateEvidencePresent()
   support the rule without a broader redesign                already discriminates on
                                                             `classification`; narrowing one
                                                             comparison is sufficient.
10. Changing unrelated qualification criteria                — NOT REQUIRED;
                                                             evaluateNeedDetected() and the
                                                             short-circuit structure are
                                                             untouched.

No stop condition applies. The implementation surface identified in §7 is sufficient.
```

---

## 11. Cost / Provider / Scraper Constraints

```text
Additional LLM calls:    NONE
External API calls:      NONE
Paid API usage:          NONE
Scraper:                 NONE
New provider:             NONE
Discovery provider:       UNCHANGED
Source acquisition:       UNCHANGED
Research classification:  UNCHANGED
Confidence scoring:       UNCHANGED
Inference discount:       UNCHANGED
R-70:                     UNCHANGED
R-71:                     UNCHANGED
Outreach:                 UNCHANGED
Database schema:          UNCHANGED
Migration:                NONE
```

Scenario E, under Option C, is enforced entirely using already-persisted classification data
(`StoredResearchSignal.classification`) already read by `evaluateEvidencePresent()` today —
no new data source of any kind is required.

---

## 12. Implementation Authorization

```text
IMPLEMENTATION AUTHORIZATION:
NOT GRANTED BY THIS DOCUMENT
```
