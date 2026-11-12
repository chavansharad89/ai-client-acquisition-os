# CLIENT FINDER — SCENARIO E / INFERRED-ONLY EVIDENCE: PRODUCT OWNER DECISION PREPARATION AUDIT

**Status:** READ-ONLY AUDIT. No source, test, migration, schema, or governance file was modified
to produce this document. No commit, no push.

**Headline finding, stated up front (per the governing task's instruction to say so explicitly
if no PO decision is actually required):**

```text
THE PRODUCT QUESTION THIS AUDIT WAS COMMISSIONED TO PREPARE —
"Can INFERRED-only evidence establish Need/Opportunity for a NEW search?" —
IS ALREADY DECIDED AND ALREADY IMPLEMENTED IN COMMITTED CODE.

No new PO decision is required to answer it.
```

A second, unrelated, and currently live issue was discovered while tracing the production
path: the repository's one committed Scenario E regression test is **currently failing** in
this working tree — not for any evidence-sufficiency reason, but because a separate,
already-present architectural layer (the Phase 5 AI-escalation admission gate) now sits
between Discovery and Research and rejects this test's single, zero-deterministic-signal
fixture before Research ever runs. This is an engineering/test-fixture issue, not a product
question, and is reported separately in §3/§10 so it is not mistaken for the Scenario E policy
question.

---

## 1. Reconstructing the exact current production path

Traced directly from current code (file:line references below), not from the governing
documents' own prose.

```text
Service + Geography (freelancer input)
  ↓
System-owned defaults (NEW search only)
  packages/core-service-profile/src/systemDefaults.ts
  SYSTEM_DEFAULT_TRIGGERS = ['WEBSITE', 'NEWS', 'TECH_STACK']
  SYSTEM_DEFAULT_TARGET_CUSTOMER = ';' (resolves to zero target segments)
  ↓
Discovery → Company/Prospect created (unchanged, out of this audit's scope)
  ↓
Pre-admission Pass (uncommitted, present in this working tree —
  packages/core-research/src/admission.ts; apps/worker/src/searchWorker/worker.ts)
  — deterministic signals computed (ServiceSignalCatalogue, optional dep)
  — eliminateDeterministically() — structural eligibility gate
  — previewOpportunityRanking() — Universal Ranking preview (STRONG/MODERATE/WEAK/UNKNOWN)
  — evaluateAdmission(): admitted = inTopN && (bypass || thresholdMet)
      meetsAdmissionThreshold(): needOpportunity>=MODERATE OR serviceFit>=MODERATE
      hasStrongSignalBypass(): >=2 signals at OBSERVED_FACT_CONFIDENCE(=100),
        >=1 mapping to a Primary dimension
  — NOT ADMITTED → Research is SKIPPED entirely; persistDeterministicOnly() runs;
    aiEnrichment = 'DETERMINISTIC_ONLY'
  ↓ (admitted only)
Research (packages/core-research) → persists StoredResearchSignal rows,
  classification ∈ {OBSERVED, INFERRED, UNKNOWN} (schema.ts:20)
  INFERRED confidence is halved at persistence (persist.ts:75) and discounted again
  at scoring time only (scoringAdapter.ts:45-46, INFERENCE_DISCOUNT) — qualification
  reads neither discount (confirmed below)
  ↓
R-70/R-71 filtering — packages/core-opportunity/src/adapters.ts:182-195 (eligibleRows())
  shared verbatim by toOfferSignals() and hasCredibleNeedEvidence() so they can never diverge
  excludes: UNKNOWN rows; TOPICAL_FIELDS (companySummary/businessModel/targetCustomers, R-71);
  rows from a source that self-identifies as a different business (R-70)
  Classification-blind: OBSERVED and INFERRED both survive this filter identically
  ↓
toOfferSignals() — adapters.ts:197-208 — classification-blind beyond the UNKNOWN exclusion
  above; confidence passed through raw
  ↓
suggestOffers() (packages/core-acquisition) — matches ServiceRule.triggers/keywords against
  the adapted signals; also classification-blind
  ↓
needDetected — gated differently depending on search type:
  • NEW search: createOpportunityForOwner() (service.ts) additionally requires
    hasCredibleNeedEvidence() (K5-D1, adapters.ts:240-258) to return true:
      - >=2 DISTINCT eligible-row fields matched the rule's trigger+keyword, AND
      - at least one matched row is classification==='OBSERVED' AND
        confidence>=OBSERVED_FACT_CONFIDENCE (100)
    INFERRED-only evidence CANNOT satisfy this — there is no code path by which an
    all-INFERRED matched set reaches needDetected=true for a NEW search.
  • Historical search (real targetCustomer segment): K5-D1 is NOT applied (adapters.ts:222-224,
    "a historical search ... is unaffected — see service.ts"). A classification-blind
    suggestOffers() match alone is sufficient for needDetected on a historical search,
    exactly as before K5-D1 existed.
  ↓
Opportunity creation (needDetected persisted on the row)
  ↓
Qualification — EVIDENCE_PRESENT criterion (packages/core-qualification/src/rules.ts:26-28,
  110-123): isEvidentiary() now requires classification==='OBSERVED' (not merely
  non-UNKNOWN) — Phase 24 Scenario E, Option C. This runs for EVERY search type, with no
  NEW-vs-historical branch anywhere in rules.ts/evaluator.ts.
  INFERRED-only evidence CANNOT satisfy EVIDENCE_PRESENT, for any search type.
  ↓
QualificationState: QUALIFIED only if NEED_DETECTED && EVIDENCE_PRESENT both pass;
  otherwise INSUFFICIENT_EVIDENCE
  ↓
Personalization / Outreach preparation / Follow-up preparation — all draft-only,
  no-send (unchanged; not reached differently by this audit's question)
```

**Where INFERRED-only evidence currently succeeds or fails, concretely:**

| Search type | Gate | INFERRED-only outcome | Code |
| --- | --- | --- | --- |
| NEW | K5-D1 (`hasCredibleNeedEvidence`) | FAILS — `needDetected` never becomes `true` from INFERRED-only matched evidence | `adapters.ts:240-258` |
| Historical | K5-D1 not applied | `needDetected` CAN become `true` from INFERRED-only evidence (suggestOffers() is classification-blind) | `adapters.ts:222-224`, `service.ts` |
| Any (if `needDetected=true` was reached) | Scenario E / Option C (`isEvidentiary`) | FAILS — `EVIDENCE_PRESENT` requires a live OBSERVED signal; state becomes `INSUFFICIENT_EVIDENCE`, never `QUALIFIED` | `rules.ts:26-28,110-123` |

**Direct consequence for the user's exact question** ("For NEW Service + Geography searches,
can INFERRED-only research evidence establish Need/Opportunity sufficiently for
`needDetected` / opportunity creation?"): **No, not today, in the current code.** K5-D1 already
forecloses it at the `needDetected` layer, and — even if that gate did not exist — Scenario
E/Option C forecloses it again at the qualification layer, for every search type. Both gates
are already implemented, committed, and tested (see §2-§3).

---

## 2. Governing decisions — already decided vs. actually unresolved

### Already decided (not reopened by this audit)

**Scenario E / Phase 24, Option C — OBSERVED REQUIRED.**
Despite `PHASE_24_SCENARIO_E_PRODUCT_DECISION.md` (header: "RECOMMENDATION — NOT YET APPROVED,
NOT IMPLEMENTED") and `PHASE_24_SCENARIO_E_OPTION_C_SCOPE_LOCK.md` (header: "IMPLEMENTATION
AUTHORIZATION — NOT GRANTED") both reading, on their own text, as still-open, the decision they
describe was **implemented and committed the same day** they were written:

```text
git log --oneline -- packages/core-qualification/src/rules.ts
0231af2 feat(phase24): require observed evidence for qualification
```

```text
commit 0231af2, Sept 23 16:22 — "feat(phase24): require observed evidence for qualification"
  packages/core-qualification/src/rules.ts          | 36 ++++++---
  apps/worker/src/searchWorker/worker.test.ts       | 98 +++++++++++
  packages/core-qualification/src/evaluator.test.ts | 102 ++++++++++
```

The implemented predicate (`rules.ts:26-28`) matches the scope-lock's required predicate
(`PHASE_24_SCENARIO_E_OPTION_C_SCOPE_LOCK.md §6`) exactly: `classification === 'OBSERVED'`
rather than `!== 'UNKNOWN'`. The worker regression test's name and assertions (committed, HEAD)
already read "Option C" and assert `INSUFFICIENT_EVIDENCE`, matching the scope-lock's "Required
post-implementation assertion" verbatim (`worker.test.ts:2162,2241-2246` vs.
`PHASE_24_SCENARIO_E_OPTION_C_SCOPE_LOCK.md §5`). This is confirmed by running the test suite
against the clean, committed tree (`git stash`): the Scenario E test **passes** with Option C's
exact expected behavior — see §3. **This is not a recommendation awaiting sign-off; it is
shipped, tested production behavior**, and has been since Sept 23.

**K5-D1 — Option C ("YES, but only from stronger approved evidence").**
`requirement/CLIENT_FINDER_PHASE_K5_PO_DECISION_PREPARATION.md` records Decision 1 as Option
C. The implementation (`hasCredibleNeedEvidence`, `adapters.ts:240-258`) matches: it already
requires an OBSERVED signal at `OBSERVED_FACT_CONFIDENCE` (100) among >=2 independently-matched
fields, for NEW searches, before `needDetected` can become `true`. This predates and is
independent of Scenario E's qualification-layer gate — it answers a stricter version of the
same underlying question one layer upstream, for NEW searches specifically.

**R-70 / R-71.** Both remain exactly as previously decided and implemented
(`adapters.ts:116-195`), unaffected by anything in this audit. Not reopened.

**Service + Geography-only defaults.** Unaffected; `systemDefaults.ts`'s fixed triggers/
target-customer defaults are read, not altered, in §1's trace above. Not reopened.

### Actually unresolved (carried forward from the governing documents themselves, not newly
raised here)

These are the items the governing documents already flagged as open, and which remain open —
not reopened by this audit, simply still unanswered:

- What exactly `QualificationState.QUALIFIED` is meant to communicate pre-outreach
  (`PHASE_24_SCENARIO_E_DECISION_CONTRACT.md §4`) — ambiguity not resolved by implementing
  Option C, and not required to be resolved for Option C to function correctly.
- Whether a confidence threshold should ever be added on top of the OBSERVED-required gate
  (`PHASE_24_SCENARIO_E_PRODUCT_DECISION.md §10`) — explicitly deferred, not decided either way.
- Whether Option B (corroboration) should be revisited once/if a source-independence model is
  ever defined — explicitly deferred, no such model exists today.
- Whether `QUALIFIED` should ever be able to trigger execution without human approval — a
  future trust-boundary question the Decision Contract explicitly separates from Scenario E.

None of these is the question this audit was commissioned to answer, and none requires a PO
decision to ship or keep the current Scenario E/K5-D1 behavior as-is.

---

## 3. Auditing Scenario E's own test

**Where it lives today:** `apps/worker/src/searchWorker/worker.test.ts:2162-2247`, inside
`describe('phase24: B/D/E — evidence relevance & qualification (R-70/R-71/E all settled)')`
(the describe block's own name states "settled", not "open" — `worker.test.ts:1773`).

**What evidence the fixture supplies:** four INFERRED claims (`companySummary`,
`businessModel`, `targetCustomers`, one `websiteIssues` entry), each with `evidence: []`,
a non-null `basis`, and `confidence: 60` (`worker.test.ts:2169-2194`). No OBSERVED or UNKNOWN
signal exists anywhere in the fixture.

**Classification / confidence / provenance:** INFERRED, confidence 60, no sources/evidence
array (schema-forbidden for INFERRED — `schema.ts:11-12`). This is a textbook, legitimate
INFERRED claim shape, not a malformed or boundary-violating fixture.

**Is it a credible problem/opportunity statement?** The matching claim ("Business A may need a
website redesign because its online presence appears outdated", field `websiteIssues`) is
problem-shaped, not topical — it would pass R-71's field-shape gate on its own terms. It is
intentionally a *reasoned conclusion from indirect evidence* ("sparse homepage content"), not a
directly quoted fact — that is the entire point of the fixture, by its own comment
(`worker.test.ts:2163-2168`).

**Is it meant to represent a NEW search?** Yes, explicitly: it reuses
`qualifyingSearchOverrides()`, the same fixture also used for `D2` immediately above it in the
same file, which — per the file's own describe-block title and the Scenario E contract — is a
Service+Geography-style NEW search scenario, not a historical one.

**Why the expected result is what it is:** The committed (HEAD) assertion is
`INSUFFICIENT_EVIDENCE`, **not** `QUALIFIED` — the test's docstring and in-line comments
(`worker.test.ts:1760-1773, 2233-2239`) state this is the "settled Scenario E product contract
— Option C". This is current, correct, intentional behavior, not a stale expectation left over
from before Option C — the test was rewritten as part of the same commit that implemented
Option C (`0231af2`).

**Does the expected behavior predate Service+Geography-only and K5-D1?** No. The fixture
(`qualifyingSearchOverrides()`) already carries NEW-search-shaped parameters, and the test
sits in the same file, same era, as K5-D1's own B1-B3/D1-D3 regression tests. There is no
evidence this test's *current* committed assertion predates either decision.

**Is Scenario E a legitimate product case, or a stale fixture?** **Legitimate, and already
correctly resolved.** The committed test, run against the committed code (`git stash`, this
session), passes and demonstrates exactly the intended Option C behavior: `needDetected=true`
(K5-D1's OWN gate is not what this particular fixture exercises — this fixture's matched fields
happen to satisfy K5-D1 too, since the websiteIssues INFERRED claim plus the implicit field
diversity were presumably tuned against K5-D1 when the test was last edited) and
`qualification.state === 'INSUFFICIENT_EVIDENCE'`.

**The one real, currently-live problem:** against the *actual current working tree* (this
session's uncommitted state, which is what a "trace actual current behavior" audit is obligated
to check — see the governing task's own §1 instruction to use "actual current code, not
assumptions"), **this same test now fails**, but at an earlier, unrelated assertion:

```text
AssertionError: expected 0 to be greater than or equal to 1
  at worker.test.ts:2222 — expect(byClassification('INFERRED').length).toBeGreaterThanOrEqual(1)
```

Root cause, traced: an uncommitted architectural layer — the Phase 5 AI-escalation admission
gate (`packages/core-research/src/admission.ts`; wired into
`apps/worker/src/searchWorker/worker.ts`'s new Pass 1/Pass 2 structure) — now runs **before**
Research for every candidate. Admission requires `inTopN && (bypass || thresholdMet)`
(`admission.ts:84-103`). This fixture's single candidate is discovered with no
`signalCatalogue`/`sourceDocuments` deps supplied, so it has **zero deterministic signals**;
with zero signals, `hasStrongSignalBypass()` is false (needs >=2 top-reliability signals,
`admission.ts:55-59`) and its Universal Ranking preview is `UNKNOWN` on both primary dimensions,
so `meetsAdmissionThreshold()` is also false (`admission.ts:40-46`). The candidate is therefore
**not admitted**, Research is **never called** (`worker.ts`'s `processOneCandidate`,
`if (!decision.admitted) { ...persistDeterministicOnly...; return; }`), and consequently **no
research signal of any classification — OBSERVED, INFERRED, or UNKNOWN — is ever persisted**.
The test fails three lines before it ever reaches the OBSERVED-vs-INFERRED question this audit
is about.

**This is not a product-policy gap and not a Scenario E regression.** It is an admission-gate
fixture/engineering mismatch: this test's fixture was written to exercise Research directly and
has not been updated to also clear the newer admission gate (e.g., by supplying a
`signalCatalogue` that yields a qualifying deterministic signal, or by asserting
`decision.admitted` separately). Fixing it is test maintenance against an already-decided,
unrelated architecture (Phase 5 AI-escalation), not a PO decision — and this audit does not fix
it, per its read-only scope.

**Classification (per §4's mandatory A/B/C/D framework):** **D** — for the *original* Scenario
E product question, the test (at HEAD) is neither stale nor in need of a product decision; it
already reflects a settled, implemented contract correctly. The *currently uncommitted* failure
is a separate, unrelated engineering defect (an admission-gate/fixture mismatch), not evidence
that Scenario E's policy is unresolved.

---

## 4. Evidence integrity vs. evidence sufficiency

```text
A. Evidence is invalid/untrustworthy                        — NOT THE CASE
B. Evidence is valid but insufficient for Need/Opportunity   — WAS THE PRE-OPTION-C STATE;
                                                                 NOW THE DECIDED, IMPLEMENTED
                                                                 POLICY (both K5-D1 and
                                                                 Option C independently land
                                                                 here)
C. Evidence is valid, should be sufficient, but the
   implementation fails to recognize it                      — NOT SUPPORTED BY THE CODE;
                                                                 the implementation recognizes
                                                                 INFERRED evidence everywhere
                                                                 except the two gates that were
                                                                 deliberately narrowed by name
                                                                 (K5-D1, Option C) — this is not
                                                                 an implementation failure, it is
                                                                 the implementation doing exactly
                                                                 what both decisions specify
D. The test is stale/invalid and no product decision
   is actually needed                                          — TRUE FOR THE POLICY QUESTION
                                                                 ITSELF (see §3's classification);
                                                                 the test's CURRENT FAILURE is a
                                                                 separate engineering issue (§3),
                                                                 not evidence for or against D on
                                                                 the policy question
```

Concrete support: `schema.ts:20` keeps `INFERRED` a first-class, valid classification — nothing
in K5-D1 or Option C redefines, rejects, or devalues an INFERRED claim as a research artifact
(`rules.ts:16-24`'s own comment: "INFERRED remains a first-class classification everywhere else
in the architecture; only its sufficiency for this criterion changes"). The decision made was
always about **B** (sufficiency for a specific downstream consequence), never **A** (validity).

---

## 5. INFERRED evidence semantics, as the architecture actually defines them

From `schema.ts:8-18` (the schema's own documentation comment, binding on every research call):

```text
OBSERVED  — seen directly. MUST cite evidence (a quote and a source).
INFERRED  — reasoned from observations. MUST state what it reasoned from
            (`basis`). Cannot cite evidence it did not observe (`evidence`
            is schema-forbidden for INFERRED).
UNKNOWN   — not determinable. MUST have a null value and no evidence.
```

- **Provenance:** `provenance.ts`'s `verifyProvenance()` checks OBSERVED claims
  character-for-character against a cited source document. It has **no equivalent mechanism for
  INFERRED** — there is nothing to verify, since INFERRED claims carry no quoted source by
  schema design.
- **Confidence:** INFERRED confidence is capped at submission (schema-level, not re-verified
  here) and is halved again at persistence (`persist.ts:75`,
  `Math.floor(observation.confidence / 2)`), then discounted a *third* time, independently, at
  the scoring/ranking layer only (`scoringAdapter.ts:45-46`, `INFERENCE_DISCOUNT`). Qualification
  (`rules.ts`) and K5-D1 (`adapters.ts`) both read `classification` directly and do not consume
  either discount — confidence plays no role in whether INFERRED-only evidence qualifies; the
  classification itself is the gate.
- **R-70/R-71:** both apply identically to OBSERVED and INFERRED (`adapters.ts:166-170`) — they
  were never the mechanism distinguishing the two; they filter on source-attribution and
  field-shape, not evidentiary strength.
- **K5-D1's `hasCredibleNeedEvidence()`:** reads `classification` and `confidence` directly
  (`adapters.ts:255-257`), requiring `OBSERVED` at full, undiscounted confidence — i.e., it
  treats INFERRED as structurally incapable of satisfying this specific criterion, by design,
  regardless of its own stated confidence value.
- **No distinction between "well-reasoned" and "model opinion" INFERRED claims exists anywhere
  in the schema, persistence, or qualification code.** `basis` is free text, never parsed,
  scored, or cross-referenced (`PHASE_24_SCENARIO_E_DECISION_CONTRACT.md §6`, confirmed still
  true by `rules.ts`/`adapters.ts` — neither reads `basis` at all).

**Answering the task's specific example** — `"This business likely needs a website redesign"`
as INFERRED — against the architecture's own four options:

```text
1. An inference grounded in source evidence?        — Structurally, yes: INFERRED requires a
                                                        `basis` statement, and the research
                                                        model is instructed to reason from
                                                        observations, not fabricate. The
                                                        architecture does NOT verify that the
                                                        basis is itself well-founded — there is
                                                        no mechanism that could.
2. Merely an unsupported model opinion?              — Not by schema contract (basis is
                                                        required), but also not independently
                                                        checked — the architecture cannot
                                                        distinguish a well-reasoned INFERRED
                                                        claim from a plausible-sounding one that
                                                        happens to pass the same schema shape.
3. A valid research signal but insufficient for
   opportunity creation (NEW search) / qualification
   (any search)?                                      — YES. This is exactly what K5-D1 and
                                                        Option C already, separately, establish
                                                        as the current, decided, implemented
                                                        answer.
4. Something else?                                    — Not per the existing governance; (3)
                                                        is the governing architecture's own
                                                        answer today, not a new category.
```

---

## 6. Real product consequences — already realized, not hypothetical

Because the decision is already implemented, these are not forecasts; they are the current,
live behavior for every search run since Sept 23:

- **False positives:** reduced, for the needDetected layer (NEW searches, via K5-D1) and for
  qualification (all searches, via Option C) — a thin-evidence, INFERRED-only prospect can no
  longer reach `QUALIFIED` purely on a model's reasoning.
- **False negatives:** increased, by the governing documents' own, un-reopened admission — the
  Scenario E fixture's own "Business A" (sparse homepage, genuinely thin but possibly correct
  evidence) is named directly in `PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` and
  `_PRODUCT_DECISION.md` as the concrete case this excludes, and that exclusion is now live.
- **Freelancer trust / evidence transparency:** every `QUALIFIED` Opportunity is now
  traceable to a provenance-verified, quoted OBSERVED signal (`provenance.ts`) — the stated
  rationale for Option C in `PHASE_24_SCENARIO_E_PRODUCT_DECISION.md §8`.
- **Zero-AI / deterministic path:** unaffected by Option C/K5-D1 directly — zero-AI opportunities
  are created from `DeterministicSignal`s, a separate code path (`deterministicSignals.ts`,
  confidence pinned at `OBSERVED_FACT_CONFIDENCE`), not from `StoredResearchSignal.classification`
  at all. The newly-discovered admission gate (§3) is the thing that currently interacts badly
  with a *research*-only, zero-deterministic-signal fixture — a different, engineering
  interaction, not a zero-AI policy question.
- **R-70/R-71 safeguards:** both continue to run upstream of, and are explicitly orthogonal to,
  both gates (`adapters.ts:166-173`, confirmed unchanged).
- **Opportunity quality / qualification / downstream personalization/outreach:** a `QUALIFIED`
  Opportunity now always carries at least one OBSERVED signal by construction, which
  personalization/outreach (draft-only, no-send either way) can cite directly, rather than
  potentially citing only a reasoned-but-unquoted claim.
- **Ranking quality:** untouched — `scoringAdapter.ts`'s `INFERENCE_DISCOUNT` still ranks
  INFERRED evidence (discounted) against OBSERVED evidence for every Opportunity that *does*
  reach the ranking stage; Option C/K5-D1 only gate whether an Opportunity is created/qualified
  in the first place, never how it is ranked once it exists.

No numeric probabilities or invented scores are asserted anywhere above, per the task's own
constraint.

---

## 7. PO decision options (prepared for completeness; see §10 for why none require action)

Because the decision is already made and implemented, this section documents what a PO would be
choosing between **if** the current implementation were instead being reopened — it is not a
live choice being presented for action, and §10 states that plainly.

### Option A — INFERRED-only evidence can establish Need/Opportunity
- **Behavioral rule:** revert `isEvidentiary()` (`rules.ts:27`) to `!== 'UNKNOWN'`, and revert/
  bypass `hasCredibleNeedEvidence()`'s OBSERVED requirement (`adapters.ts:256`) for NEW searches.
- **NEW-search impact:** INFERRED-only matched evidence could reach both `needDetected=true` and
  `QUALIFIED`.
- **Historical-search impact:** already true today (K5-D1 never applied here) — Option A would
  only change the qualification layer's behavior for historical searches, reverting Option C.
- **Zero-AI impact:** none directly.
- **R-70/R-71 impact:** none — both are orthogonal.
- **K5-D1 impact:** would require separately reopening and reversing K5-D1's own Decision 1
  (a distinct, already-settled decision this audit was told not to reopen without direct
  contradiction — none was found).
- **Implementation scope:** two independent reverts, in two different packages/layers.
- **Test impact:** reverts the committed Option C regression tests (`worker.test.ts`,
  `evaluator.test.ts`) to their pre-`0231af2` assertions.
- **Risks:** reintroduces the exact, already-documented risk Option C was adopted to close — "no
  mechanism distinguishes a well-reasoned inference from a plausible-sounding guess"
  (`PHASE_24_SCENARIO_E_DECISION_CONTRACT.md §1`).
- **Reversibility:** fully reversible (it is a revert of an existing, isolated change).

### Option B — INFERRED-only evidence cannot establish Need/Opportunity
- **Behavioral rule:** the current, already-implemented rule, at both the K5-D1 (NEW-search
  `needDetected`) and Option C (all-search `EVIDENCE_PRESENT`) layers.
- **NEW-search impact:** none — already in effect.
- **Historical-search impact:** none — already in effect since `0231af2`.
- **Zero-AI impact:** none — zero-AI never consumed `classification` at all.
- **R-70/R-71 impact:** none — orthogonal, unaffected, confirmed still true.
- **K5-D1 impact:** none — already consistent with K5-D1 Option C.
- **Implementation scope:** zero — nothing to build.
- **Test impact:** zero — existing tests already assert this (modulo the unrelated admission-gate
  fixture issue in §3, which needs engineering attention regardless of which PO option is chosen,
  since it is not caused by either option).
- **Risks:** the already-accepted, already-documented false-negative exposure on thin-evidence
  prospects (§6) — an accepted cost of the decision already made.
- **Reversibility:** trivially reversible to Option A if ever desired (single-predicate revert).

### Option C — INFERRED can contribute, but only with additional corroborating evidence
- **Behavioral rule:** this is `PHASE_24_SCENARIO_E_DECISION_CONTRACT.md`'s own "Option B"
  (renamed here to avoid clashing with the already-shipped "Option C" naming used throughout the
  codebase's comments) — INFERRED plus some corroboration condition.
- **NEW-search impact / Historical-search impact:** would require defining, from scratch, a
  source-independence model that the governing documents state explicitly does not exist today
  (`_DECISION_CONTRACT.md §6`), and this audit does not invent one (task constraint).
- **Zero-AI / R-70/R-71 / K5-D1 impact:** not assessable without the undefined corroboration rule.
- **Implementation scope:** documented in the governing records as "the larger of the three
  surfaces" (`_PRODUCT_DECISION.md §7`) — strictly more work than the already-shipped Option B
  (this document's naming) / Option C contract.
- **Test impact:** would require new, currently-nonexistent fixtures and assertions.
- **Risks:** the governing documents' own warning stands unchanged — a loosely-defined
  corroboration rule degenerates toward Option A; a strictly-defined one risks starving
  legitimately correct, thin-evidence prospects even further than the current rule does.
- **Reversibility:** lowest of the three — introduces new persisted-adjacent concepts
  (a corroboration contract) that later removal would have to account for.

No option beyond these three is supported by anything found in the repository or governance
record; no new option is invented here per the task's own constraint.

---

## 8. Historical searches — explicit statement

```text
This decision (as already implemented) DOES affect historical searches, and this is not
a new, silent change introduced by this audit.
```

`isEvidentiary()` / `evaluateEvidencePresent()` (`rules.ts:26-28,110-123`) contain no
NEW-vs-historical branch of any kind — the OBSERVED-required qualification gate applies
uniformly to every search type, exactly as `PHASE_24_SCENARIO_E_OPTION_C_SCOPE_LOCK.md` always
specified (it never proposed a historical-search carve-out). This has been true, in committed
code, since `0231af2` (Sept 23) — i.e., before this audit, not because of it. K5-D1's
`needDetected` gate, by contrast, is explicitly NEW-search-only (`adapters.ts:222-224`); historical
searches were never subject to it and remain unaffected either way.

If the PO wants historical-search behavior to differ from NEW-search behavior at the
qualification layer specifically, that would be a **new, additional** decision beyond anything
this audit found in the existing governance record — not a reopening of an existing one, since
no existing document proposes that split. This audit does not recommend it; it is named only
because §8 of the governing task requires an explicit statement either way.

---

## 9. Confirmation of audit boundaries

Per the governing task's constraints: `hasCredibleNeedEvidence()`, `needDetected`,
`suggestOffers()`, R-70, R-71, Scenario E's fixture, Global Entity, and C-3B were all read, not
modified. No new signal, confidence threshold, AI call, or historical-semantics change was added
by this document. The one code change this audit's trace required to understand (`git stash` /
`git stash pop`) was reverted immediately and the working tree was restored exactly as found —
confirmed by the subsequent `git stash pop` output showing the same modified-file set as before.

---

## 10. Final recommendation

### PO Decision Required

```text
NONE, for the question this audit was commissioned to answer.
```

The precise question posed — "For NEW Service + Geography searches, can INFERRED-only research
evidence establish Need/Opportunity sufficiently for `needDetected` / opportunity creation?" —
already has a current, implemented, tested answer: **No**, enforced independently at two layers
(K5-D1 for `needDetected` on NEW searches; Option C for `EVIDENCE_PRESENT`/`QUALIFIED` on every
search). Both were PO-decided and engineering-implemented before this audit began. There is no
open fork in the code for a PO to resolve here.

### Options

A / B / C as detailed in §7, preserved for the record in case the PO wants to *reopen* an
already-made decision — which is a different act than answering an open one, and which this
audit does not recommend absent a reason not found in the repository.

### Analyst Recommendation

```text
RECOMMENDATION ONLY — NOT A DECISION:
Leave Option B (§7) — the current, already-shipped behavior — in place. Do not reopen it.
```

### Why

Because the governing documents' own stated rationale for adopting this behavior
(`PHASE_24_SCENARIO_E_PRODUCT_DECISION.md §8`: Option A has "no evidentiary floor at all," a
confidence-1 evidentiary signal could still qualify; Option B/corroboration — their naming —
cannot be soundly specified because "there is no source-independence model") remains true today,
unchanged by anything found in this audit. No new evidence surfaced here contradicts that
reasoning.

### Implementation Impact

None, if the recommendation is accepted — nothing changes. The one implementation item this
audit surfaces is unrelated to the PO question: the admission-gate/fixture mismatch in §3
(`worker.test.ts:2222`) needs an engineering fix (not a PO decision) to keep the Scenario E
regression test passing against the newer Phase 5 admission-gate code — most simply, by
supplying that test's fixture with a `signalCatalogue`/deterministic signal sufficient to clear
`evaluateAdmission()`, or by asserting the admission decision directly rather than relying on
Research having run at all. This audit does not make that fix, per its read-only scope.

### Historical Impact

No change proposed. The existing, already-shipped behavior (§8) already applies uniformly to
historical and NEW searches at the qualification layer, and this audit recommends no further
change to that.

### Current MVP Status

```text
Scenario E (the product-policy question): NOT a launch blocker. It is already decided and
already implemented; no PO action is pending.

Scenario E's regression TEST (the admission-gate/fixture interaction found in §3): IS currently
failing in this working tree and should be tracked as an engineering/test-maintenance item —
distinct from, and unrelated to, the Scenario E product question — before this branch is
considered launch-ready. It requires a developer fix to the test's fixture or admission-gate
wiring, not a PO decision.
```
