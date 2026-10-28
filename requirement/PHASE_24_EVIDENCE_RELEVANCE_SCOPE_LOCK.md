# Phase 24 — Evidence & Relevance Qualification

**Status:** PROPOSED — NOT YET APPROVED FOR IMPLEMENTATION
**Source Authority:** `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` (STATUS: PROPOSED / GAP IDENTIFIED) — R-70, R-71, R-72
**Baseline:** `b728425ac2a3fc306aaeba750ce609df31c07122` — Phase 23 CLOSED
**Frozen:** Phases 18, 19, 20, 21, 22, and 23
**Primary Boundary:** Evidence relevance and source-attribution gating only, applied at the existing Qualification boundary. No sending, scheduling, delivery, CRM, proposal execution, or new provider/discovery/research capability.

---

## 1. Status

**PROPOSED — NOT APPROVED FOR IMPLEMENTATION.**

This document proposes a scope for a future Phase 24. It does not authorize writing any
code, test, migration, or package. Approval is a separate, explicit act this document does
not perform. No implementation decision below that is marked OPEN DECISION may be resolved
silently by an implementer — each requires its own explicit product decision before Phase
24 can be approved to start.

---

## 2. Baseline

```text
HEAD: b728425ac2a3fc306aaeba750ce609df31c07122

Phase 18 (Provider Execution):        CLOSED / FROZEN
Phase 19 (Follow-Up [worker]):        CLOSED / FROZEN
Phase 20 (Qualification):             CLOSED / FROZEN
Phase 21 (Personalization):           CLOSED / FROZEN
Phase 22 (Outreach Preparation):      CLOSED / FROZEN
Phase 23 (Follow-Up Preparation):     CLOSED / FROZEN

Current pipeline (unchanged by this proposal):
Discovery → Research → Opportunity → Qualification → Personalization
  → Outreach Preparation → Follow-Up Preparation → READY_FOR_REVIEW → NO EXECUTION

Evidence that no Phase 24 implementation exists:
  - No requirement/PHASE_24_*_CLOSURE.md exists in the repository.
  - No R-70, R-71, or R-72 identifier appears anywhere in packages/*/src or apps/*/src
    (confirmed by direct search — the highest requirement ID in use anywhere in code or
    requirement documents is R-69, Phase 23's "Idempotency and Failure Isolation").
  - packages/core-acquisition/src/offer.ts's suggestOffers() still performs only a
    case-insensitive substring match against ResearchSignal.signal text, with no
    source-attribution check and no consultation of OBSERVED/INFERRED/UNKNOWN
    classification when deciding a match (verified by reading the file; unmodified by
    this or any prior document in this session).
  - packages/opportunity_scores persisted for the three real Opportunities produced
    during the real-user validation session (Platinum Fitness Club, Goregaon Sports Club,
    IFSI Fitness Academy) show none of R-70/R-71/R-72's behavior is enforced today —
    see MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md §1 for the underlying evidence.
```

---

## 3. Problem Statement

During real-user MVP validation (real Google Places discovery, real Anthropic research,
real Client Finder UI), three genuine opportunities were produced. The findings, restated
from `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` without exaggeration:

- **Source/business mismatch.** For "Goregaon Sports Club," the source document fetched
  (`heydrop.me`) was for a different, unrelated business ("HeyDrop," a digital
  business-card product). The research process's own output already stated this mismatch
  in plain text — nothing downstream reads or acts on that statement. The pipeline
  nonetheless produced a `QUALIFIED` opportunity, a generated Personalization, and a
  `READY_FOR_REVIEW` Outreach Preparation draft addressed to "Goregaon Sports Club,"
  built entirely on evidence about a different company.

- **Topical-but-not-problematic keyword matches.** The offer-matching mechanism
  (`suggestOffers()`) matches a live signal to the user's service purely by whether the
  signal's text contains one of the user's own keywords, as a case-insensitive substring.
  It does not check whether the matched text describes an actual problem. This is the
  same mechanism that produced the Goregaon match (a HeyDrop-derived signal happened to
  contain the word "website").

- **Downstream opportunity-quality risk.** Two other real businesses in the same search
  (Platinum Fitness Club, IFSI Fitness Academy) had specific, `OBSERVED`, high-confidence
  website problems (missing pricing/enquiry mechanisms, broken/inconsistent content, empty
  trust sections) that never surfaced as an opportunity at all, because none of their
  signal text happened to contain the literal keyword substring. The same blunt mechanism
  both over-matches (Goregaon) and under-matches (Platinum, IFSI).

- **Why this affects §9's primary question.** MVP_SCOPE_BOUNDARY.md §9's primary
  product-validation question is *"Would you actually contact this business?"* An
  opportunity built on a source/business mismatch cannot honestly be presented to a real
  user for that judgment — the evidence shown would not actually be about the business
  named. Any V-1/V-2/V-3 evidence collected against opportunities that can carry this
  defect is evidence about the defect, not about the product's core promise. This is why
  `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` classifies R-70/R-71 as MVP-gating rather than a
  post-MVP enhancement.

This document does not add any new finding beyond what
`MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` already established.

---

## 4. Authoritative Requirements

Reproduced from `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` (source of truth); not rewritten
into implementation instructions here.

### R-70 — Source-to-Business Attribution

> Before a research signal derived from a fetched source document is eligible to support
> Need Detection (R-11) or Opportunity Creation (R-13), the system must be able to state,
> and a downstream reader must be able to verify, that the source document corresponds to
> the discovered business it is attached to. When the source document's own content is
> about a different, identifiable business/product than the one discovered, the signals
> derived from it must not be treated as eligible evidence for that Opportunity's Need
> Detection.

### R-71 — Service-Problem Relevance

> A signal must not be treated as evidence of a need for the user's service merely because
> its text contains a substring of the user's keywords. The system must be able to
> distinguish a signal that describes a problem the offered service could plausibly
> address from a signal that merely mentions a topic related to the service. A signal
> classified `UNKNOWN` must not establish a need. `NO SUITABLE OFFER` (R-12) remains an
> acceptable, and often correct, outcome.

### R-72 — Qualification Gate

> An Opportunity must not reach `QUALIFIED` on the strength of evidence that fails R-70
> (wrong-business source) or R-71 (topical-only match). `INSUFFICIENT_EVIDENCE` or
> `NOT_QUALIFIED` must be reachable outcomes specifically because of an R-70 or R-71
> failure, distinguishable from today's only failure reason ("no need was detected").

---

## 5. Phase 24 Objective

**Ensure that opportunities reaching the existing Qualification/Review boundary are
supported by evidence that (1) actually corresponds to the discovered business, and
(2) represents a relevant service problem rather than merely containing topical
keywords.**

This objective is narrow by design. It does not extend to outreach execution, CRM, or any
capability beyond what R-70/R-71/R-72 require.

---

## 6. In-Scope Work

**Required behavior** (what the system must do, not how):
- Determine, for a given Opportunity's evidence, whether its source document(s) can be
  attributed to the discovered business (R-70).
- Determine, for a given matched signal, whether it represents a described problem rather
  than a bare topical mention (R-71).
- Ensure a `QUALIFIED` state is unreachable when either determination fails (R-72).
- Preserve `NO SUITABLE OFFER` / `NOT_QUALIFIED` / `INSUFFICIENT_EVIDENCE` as first-class,
  expected outcomes — not degraded cases to be minimized.

**Required validation:**
- The six behavioral scenarios (Test Cases A–F, §10 below) must each have an observable,
  testable outcome once implementation exists.
- Regression: opportunities already correctly reaching `NOT_QUALIFIED` today (Platinum,
  IFSI) must not be made *harder* to eventually qualify once genuinely evidenced; the gate
  must not become stricter than R-71 requires.

**Required integration:**
- Whatever produces `needDetected` (today: `suggestOffers()`/`toServiceRule()`, upstream of
  Qualification) and/or the Qualification step itself (`packages/core-qualification`) must
  incorporate R-70/R-71's determinations before a `QUALIFIED` state is reached. The exact
  placement is an OPEN DECISION (§15) — this document does not choose between "gate inside
  Opportunity Creation" and "gate inside Qualification."

No implementation technology, algorithm, threshold, or schema is prescribed by this
section.

---

## 7. Out-of-Scope Work

```text
NO SEND
NO SCHEDULE
NO DELIVERY
NO CRM
NO AUTONOMOUS OUTREACH
NO PROPOSAL EXECUTION / GENERATION
NO PAYMENTS
NO ENTITLEMENTS CHANGES
NO META CAPI CHANGES
NO RECONCILIATION CHANGES
NO SAAS BILLING
NO DISCOVERY PROVIDER CHANGE (Google Places stays as-is)
NO RESEARCH PROVIDER CHANGE (Anthropic model/wiring stays as-is)
NO CLIENT FINDER UI REDESIGN
NO CHANGE TO PHASE 18–23 ARCHITECTURE
NO CHANGE TO THE NO-SEND BOUNDARY
```

**Phase 18–23 immutable.** Phase 24 may consume Phase 18–23's persisted outputs, contracts,
and interfaces (e.g. `StoredResearchSignal`, `Opportunity`, `Qualification` shapes) but must
not alter their implementation. Any apparent need to change a frozen phase's code to
satisfy R-70/R-71/R-72 is itself an OPEN DECISION requiring separate authorization, not
something this scope-lock pre-approves.

---

## 8. Existing Architecture Boundary

```text
Discovery
    ↓
Research
    ↓
Opportunity
    ↓
Qualification   ← Phase 24 gate applies here (or immediately upstream — see §15 OPEN DECISION)
    ↓
Personalization
    ↓
Outreach Preparation
    ↓
Follow-Up Preparation
    ↓
READY_FOR_REVIEW
    ↓
NO EXECUTION
```

Phase 24 sits at the Qualification boundary only. It does not rewrite Discovery, Research,
Opportunity creation's persistence shape, Personalization, Outreach Preparation, or
Follow-Up Preparation.

**Existing persisted outputs Phase 24 would consume (read-only, as inputs):**
- `research_signals` / `research_signal_sources` (classification, confidence, signal text,
  source provenance) — Phase 18/R-10.
- `companies` (discovered business identity: name, normalized_domain) — Phase 18/R-07.
- `opportunities` (need_detected, offer_based_on, recommended_service) — R-13.
- `qualifications` (state, criteria) — Phase 20/R-38, the artifact this phase would extend
  the *reasons* of, not restructure.

No new persisted output is specified by this document (see §9).

---

## 9. Evidence Model

R-70 and R-71 require the system to reason about information that is **already available**
in today's persisted evidence:

- **For R-70:** the discovered business's name and normalized domain (`companies` table,
  already persisted by Phase 18) and the fetched source document's own extracted text
  (already produced, though not itself persisted verbatim, by
  `sourceDocumentProvider.ts`/the research signals derived from it). Critically: in the
  Goregaon Sports Club case, the research model's own output *already contains* a
  plain-text statement of the mismatch, inside a signal already persisted as `OBSERVED`
  evidence (`research_signals.signal`). Whether this already-present statement is
  sufficient to satisfy R-70, or whether R-70 requires additional information the current
  architecture does not capture, is an OPEN DECISION (§15) — this document does not decide
  it.
- **For R-71:** the signal's own `classification` (`OBSERVED`/`INFERRED`/`UNKNOWN`,
  already persisted) and `confidence` (already persisted, raw, per R-10), plus the
  matched signal text itself. `suggestOffers()` already receives all of this as input
  today; it simply does not use `classification` when deciding a match.

**No new field, table, or schema change is proposed by this document.** If, during a
future implementation scope-lock, the currently-available evidence proves insufficient to
satisfy R-70 or R-71 as written, that insufficiency must be recorded as an OPEN DECISION /
implementation gap at that time — not resolved here by inventing a schema.

---

## 10. Acceptance Criteria

Reproduced from `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` §4, unweakened and unbroadened.

| Case | Given | When | Then | Requirement |
|---|---|---|---|---|
| **A — Wrong source** | A discovered business ("Goregaon Sports Club") whose fetched source document is for a different, identifiable business ("HeyDrop"), and the research process's own output already states the company name does not appear in the source | The pipeline evaluates whether this evidence can support Need Detection | The source/business mismatch must prevent this source from establishing an actionable need. No actionable opportunity results from this source. | R-70 |
| **B — Real website problems (Platinum)** | Concrete `OBSERVED` problems exist for a discovered business (inconsistent branch naming, no pricing/enquiry mechanism, mismatched service descriptions) | The pipeline evaluates whether this evidence can support Need Detection | The system must be *capable* of recognizing this as a genuine, service-relevant need when the evidence supports it — but must not be *required* to produce an opportunity if the (product-undecided) evidence threshold is not met; `NO SUITABLE OFFER` remains acceptable | R-71 |
| **C — Real website problems (IFSI)** | Concrete `OBSERVED` problems exist for a discovered business (truncated hero headline, empty trust sections, implausible/inconsistent stats, no self-serve course info) | The pipeline evaluates whether this evidence can support Need Detection | The system must distinguish these genuine, specific, service-relevant problems from a generic/topical website mention | R-71 |
| **D — Topical keyword only** | A signal's text is only a bare topical fact (e.g. "this business has a website"), with no described problem | The pipeline evaluates whether this signal can support Need Detection | This alone must NOT establish a website-service opportunity | R-71 |
| **E — Insufficient evidence** | Evidence for a discovered business is weak, `UNKNOWN`, or ambiguous | The pipeline evaluates whether this evidence can support Need Detection | NO OPPORTUNITY results — already the required outcome per MVP_SCOPE_BOUNDARY.md §5.4 | R-71 / R-12 |
| **F — Strong, relevant evidence** | A specific `OBSERVED` problem directly relevant to the user's offered service exists, attributable to the correct business | The pipeline evaluates whether this evidence can support Need Detection and Qualification | Eligible to proceed to Qualification, subject to whatever fit/threshold gate a future scope-lock defines (not specified here) | R-70 / R-71 / R-72 |

---

## 11. Failure / Safety Behavior

- **Source cannot be attributed to the business (R-70 fails):** the evidence must not be
  used to set `needDetected = true`; the resulting Qualification outcome must be
  `NOT_QUALIFIED` or `INSUFFICIENT_EVIDENCE`, with a reason distinguishable from "no
  keyword matched."
- **Evidence is insufficient (weak/UNKNOWN/ambiguous):** `NO SUITABLE OFFER` /
  `NOT_QUALIFIED` — already the required, existing behavior (R-12, confirmed correctly
  working for Platinum and IFSI today); Phase 24 must not weaken this.
- **Evidence is only topical (R-71 fails):** must not, by itself, establish a need — the
  Opportunity must not reach `QUALIFIED` on that basis alone.
- **Service-problem relevance cannot be established:** same outcome as above — absence of
  a positive determination is not treated as a pass.

In every failure mode, the system must **fail toward fewer, trustworthy opportunities**,
never toward fabricating or forcing one through. No send, schedule, or delivery behavior is
introduced or implied by any failure path — a rejected Opportunity simply does not reach
`QUALIFIED`; it does not trigger any new side effect.

---

## 12. Idempotency / Failure Isolation

Phase 24 must preserve the existing architecture's idempotency guarantees rather than
introduce new ones:

- Qualification is already idempotent by upsert on `UNIQUE(opportunity_id)` (R-38/R-39,
  Phase 20) — re-running R-70/R-71's determination for the same Opportunity must replace
  the same row, not create duplicates, consistent with existing behavior.
- Research signals are already append-only/superseded, never deleted (Phase 18/R-10) —
  Phase 24 must not require deleting or mutating historical signal rows to make an R-70/R-71
  determination.
- No new persistence model is proposed by this document (see §9). Whether R-70/R-71's
  determination itself needs to be persisted (e.g., as part of `qualifications.criteria`,
  which already exists as flexible jsonb) or can be computed on the fly each time, is an
  OPEN DECISION (§15).

---

## 13. Testing Scope

Tests that a future implementation would eventually need — **not created or modified by
this document**:

- **Unit tests** for whatever function(s) implement R-70's source-attribution
  determination and R-71's problem-vs-topic determination, covering Test Cases A–F.
- **Qualification tests** proving `QUALIFIED` is unreachable under Test Case A/D/E
  conditions, and remains reachable under Test Case B/C/F conditions once the requirement
  is otherwise satisfied — extending `packages/core-qualification`'s existing test
  conventions (`qualification-v1` evaluator versioning already supports adding new
  criteria without breaking existing ones, per Phase 20's own closure).
- **Integration tests** at the worker level (`apps/worker/src/searchWorker/worker.test.ts`'s
  existing conventions), proving the full Discovery→Research→Opportunity→Qualification
  path respects R-70/R-71/R-72 for a multi-prospect batch — including the specific gap
  already identified during the real-user audit that no existing worker-level test covers
  a multi-prospect scenario where one prospect's evidence should be rejected and others
  should not be affected.
- **Regression tests** proving Phase 18–23 behavior outside this gate is unchanged: existing
  `suggestOffers()` behavior for signals that already correctly produce `NO SUITABLE OFFER`
  must continue to do so; existing Personalization/Outreach Preparation/Follow-Up
  Preparation idempotency and no-send guarantees (R-58, R-68) must remain intact and
  untouched.

---

## 14. Frozen Boundary Audit Requirements

Before implementation approval, the implementer must prove:

```text
- No Phase 18–23 file modified
- No send path introduced
- No schedule path introduced
- No delivery path introduced
- No CRM table introduced
- No proposal execution/generation introduced
- No unrelated provider changes (Google Places, Anthropic unchanged)
- No unrelated package wiring (core-outreach, core-proposal remain unwired)
```

---

## 15. Open Decisions

Carried forward unchanged from `MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md` §7 — not answered
here:

1. **What mechanism should establish source-to-business correspondence (R-70)?** Options
   the existing codebase's own patterns suggest — without this document choosing among
   them — include a name/domain heuristic at Discovery time, an explicit relevance
   classification alongside existing `OBSERVED`/`INFERRED`/`UNKNOWN` classification, or a
   hard block keyed on a research model's own self-reported mismatch statement (already
   produced, today unread programmatically, in the Goregaon case).
2. **What threshold, if any, should gate R-71?** Is a single matched signal ever
   sufficient, or is a minimum count/confidence required — and if so, what number? This is
   the same open question `PHASE_20_QUALIFICATION_SCOPE_LOCK.md` already left as "a future
   phase may add a `MINIMUM_FIT` criterion once a threshold is explicitly product-decided."
3. **Where should R-70/R-71 be enforced?** Inside `suggestOffers()`/`toServiceRule()`
   (Opportunity Creation, R-13), inside Qualification itself (R-72's likely intent), or as
   a distinct step between the two?
4. **Does this warrant a `MINIMUM_FIT` qualification criterion** (already anticipated by
   Phase 20's scope lock) as part of the same future implementation, or a separate one?

No implementation may resolve these silently. Each requires an explicit product decision,
recorded in whatever scope-lock is written when Phase 24 is separately approved to start.

---

## 16. Release Gate

Minimum conditions before Phase 24 could be declared complete (none of these are claimed
to be passing now):

```text
[ ] R-70 acceptance criteria PASS (Test Cases A, E, F)
[ ] R-71 acceptance criteria PASS (Test Cases B, C, D, E, F)
[ ] R-72 acceptance criteria PASS (Qualification unreachable under A/D/E; reachable under B/C/F)
[ ] Regression tests PASS (existing Phase 18–23 behavior outside this gate unchanged)
[ ] Frozen Phase 18–23 audit PASS (§14)
[ ] No-send / no-schedule / no-delivery / no-CRM audit PASS (§14)
```

---

## 17. Authorization State

```text
PHASE 24 STATUS:
PROPOSED — AWAITING EXPLICIT IMPLEMENTATION APPROVAL

Implementation:
NOT STARTED

Repository changes:
ONLY THIS SCOPE-LOCK DOCUMENT

Phase 18–23:
CLOSED / FROZEN / UNMODIFIED
```
