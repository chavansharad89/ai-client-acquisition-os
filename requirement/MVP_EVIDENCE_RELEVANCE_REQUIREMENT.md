# MVP EVIDENCE RELEVANCE REQUIREMENT

## STATUS: PROPOSED / GAP IDENTIFIED

**This document does NOT authorize implementation.** It formalizes a requirement gap
discovered during real-user MVP validation. It is not a scope-lock, not a Phase 24
authorization, and not a claim that any code should change as a result of this document
alone. A future scope-lock — subject to the same governance this repository already uses
for Phase 18–23 — would be the document that authorizes implementation, and only after
an explicit product decision on the open questions this document leaves open (see
"Non-goals" under each requirement, and §7).

Baseline this document was written against: HEAD `b728425ac2a3fc306aaeba750ce609df31c07122`.
Phases 18–23 are CLOSED / FROZEN and this document changes nothing about that status —
see [MVP_SCOPE_BOUNDARY.md](MVP_SCOPE_BOUNDARY.md), [PHASE_20_QUALIFICATION_SCOPE_LOCK.md](PHASE_20_QUALIFICATION_SCOPE_LOCK.md).

---

## 1. ORIGIN

This requirement was discovered, not invented in the abstract: it comes directly from a
real-user validation session against real discovery (Google Places) and real research
(Anthropic) data, recorded in this session's transcript. Three genuine opportunities were
produced from search `4a5a2e73-0c60-490e-ba02-33ccf14b4072`:

- **Platinum Fitness Club** — real, specific, `OBSERVED` (confidence 70–85) website
  problems exist (inconsistent branch naming, duplicated/mismatched service copy, an
  address typo, no pricing/enquiry mechanism) — yet `needDetected = false`. No opportunity
  was ever surfaced from this real evidence.
- **IFSI Fitness Academy** — real, specific `OBSERVED` (confidence 70–80) website problems
  exist (implausible/inconsistent stat counters, a truncated hero headline, trust sections
  with no body content, no self-serve course/fee information) — yet `needDetected = false`.
  Same outcome as above.
- **Goregaon Sports Club** — Google Places identified a real gym; the source document
  fetched for it (`heydrop.me`) was for a different business entirely ("HeyDrop", a digital
  business-card SaaS product). The research model's own `OBSERVED` signal said so verbatim:
  *"the supplied company name 'Goregaon Sports Club' does not appear anywhere in the source
  document and does not match the site's content."* Despite that, the offer engine matched
  the search's own keyword `"website"` against HeyDrop-derived evidence text, produced a
  "Website" opportunity at `offer_fit = 85`, and Qualification, Personalization, and a
  `READY_FOR_REVIEW` Outreach Preparation draft addressed "Goregaon Sports Club —" were all
  generated on top of it.

Root mechanism (read directly from `packages/core-acquisition/src/offer.ts` and
`packages/core-opportunity/src/adapters.ts`, unmodified, read-only): `suggestOffers()`
matches a live `ResearchSignal` against a `ServiceRule` built from the user's own Search
(`toServiceRule()`) using a case-insensitive **substring** match of the Search's own
free-text `keywords` against the signal's `signal` text — `rule.keywords.some(keyword =>
text.includes(keyword))`. It does not consult the signal's `OBSERVED`/`INFERRED`/`UNKNOWN`
classification when deciding a match, has no minimum `fit` threshold, and has no way to
know whether the fetched source document is actually about the discovered business.

---

## 2. RELATIONSHIP TO EXISTING REQUIREMENTS

This is the central question this document must answer before proposing anything new:
does `"evidence-backed opportunity identification"` (MVP_SCOPE_BOUNDARY.md §5.4/§9) and
the PRD's existing requirements already logically require what follows, or is this net-new?

| Existing requirement | What it already says | What it does NOT say |
|---|---|---|
| **R-09 — RESEARCH** (PRD V2.2) | Produce structured, schema-valid research per prospect | Nothing about whether the source is about the right business |
| **R-10 — EVIDENCE** (PRD V2.2) | Every claim carries classification/confidence/provenance/observed time; `OBSERVED` claims must quote **verbatim from the cited source document** | Verbatim-from-source is a fidelity check (did we misquote the page?), not a relevance check (is the page about this company?) — these are different guarantees |
| **R-11 — NEED DETECTION** (PRD V2.2) | *"Decide whether evidence indicates a **genuine** need for the user's service"* | Does not define what "genuine" excludes — in particular, does not say a topical keyword mention is insufficient |
| **R-12 — OFFER RECOMMENDATION** (PRD V2.2) | Map detected need to the user's service with a rationale, **return NO SUITABLE OFFER when evidence is insufficient** | Does not define an evidence-sufficiency bar beyond "some signal matched" |
| **R-13 — OPPORTUNITY CREATION** (PRD V2.2) | Persist prospect + detected need + evidence linkage + offer as a durable record | Does not require the evidence linkage to be attributable to the correct business |
| **MVP_SCOPE_BOUNDARY.md §9, criterion 9** | *"The system does not fabricate business needs... an invented need is worse than no opportunity"* | Does not explicitly extend "fabrication" to include "evidence about the wrong business, mechanically attached to the right business's name" — the finding here is that this is a form of the same harm, previously unstated |

**Conclusion — this is (A) clarification/hardening of an existing MVP requirement, not
a net-new post-MVP feature, for the "genuine need" dimension (R-B below):** R-11 already
uses the word "genuine." The current implementation does not operationalize what "genuine"
excludes. This document proposes the missing operational definition — it does not propose
a new capability R-11 never promised.

**For the source-attribution dimension (R-A below), this is closer to (B) a missing MVP
requirement that must be satisfied before §9 validation can be trusted:** nothing in R-09,
R-10, or R-13 as written addresses whether the fetched source document is actually about
the discovered business. This is not a hardening of existing wording; it is a gap in what
was specified. Given MVP_SCOPE_BOUNDARY.md §9 already states "the system does not fabricate
business needs" as the single most important success criterion, and the Goregaon Sports Club
case is a live, real, demonstrated violation of the *spirit* of that criterion even though
no existing requirement's *literal text* was violated, this document treats R-A as MVP-gating:
§9 validation evidence collected against opportunities that can carry this defect is not
trustworthy evidence of whether the MVP's core promise holds.

**Applying MVP_SCOPE_BOUNDARY.md §8's four-question scope-expansion test to both R-A and R-B:**

| Question | R-A (source attribution) | R-B (service-problem relevance) |
|---|---|---|
| 1. Required for the Client Finder MVP? | Yes | Yes |
| 2. Does the MVP fail without it? | Yes — §9's no-fabrication promise is unverifiable while this gap exists | Yes — same |
| 3. Necessary for data integrity/reliability? | Yes — directly, this is a data-integrity defect (wrong evidence attributed to a real business) | Yes — a "need" that is not genuine is an integrity defect in the Opportunity record |
| 4. Can it be deferred without invalidating the MVP experiment? | No | No |

Per §8's own rule (*"If the honest answers are no, no, no, yes — defer it"*), the inverse
pattern here (yes, yes, yes, no) places both squarely **in scope for the MVP**, not deferred.

**R-14 (Seven-Factor Scoring) is explicitly excluded from this document's scope.** The audit
that produced this document also confirmed `opportunity_scores` is empty for all three real
opportunities — but the PRD already documents R-14's status as **"IMPLEMENTED LOGIC — not
integrated"**, i.e. this is a pre-existing, already-tracked gap, not a new discovery. This
document does not re-propose R-14; it only notes, for completeness, that the wiring gap is
confirmed still present as of this baseline.

---

## 3. PROPOSED REQUIREMENTS

Two new requirement IDs are used. The next available ID in the PRD's sequence is **R-70**
(the highest ID in use anywhere in the repository, in any requirement document or code
comment, is R-69 — `PHASE_23_FOLLOWUP_PREPARATION_SCOPE_LOCK.md`'s "Idempotency and Failure
Isolation"; no R-70 or higher exists anywhere). R-71 and R-72 follow sequentially.

### R-70 — SOURCE-TO-BUSINESS ATTRIBUTION

**Purpose.** Prevent evidence fetched for one business from being used, undetected, to
construct an opportunity attributed to a different business.

**Behavioral requirement.** Before a research signal derived from a fetched source document
is eligible to support Need Detection (R-11) or Opportunity Creation (R-13), the system
must be able to state, and a downstream reader must be able to verify, that the source
document corresponds to the discovered business it is attached to.

**Inputs.** The discovered business's identity as known at Discovery time (name,
normalized domain — see `packages/core-discovery/src/normalize.ts`); the fetched source
document's own content (`packages/core-research/src/sourceDocumentProvider.ts`'s output).

**Expected behavior.** When the source document's own content is about a different,
identifiable business/product than the one discovered, the signals derived from it must
not be treated as eligible evidence for that Opportunity's Need Detection. This requirement
does not mandate *how* correspondence is established (see Non-goals) — only that the
system's behavior must differ between "source matches the business" and "source does not
match the business," and that the difference must be observable (in persisted state, in
the UI, or both).

**Rejection conditions.** A source document whose content does not correspond to the
discovered business — including but not limited to the case demonstrated in Test Case A,
where the research process itself already produces a signal stating the mismatch — must
not be permitted to establish `needDetected = true` for that prospect.

**Acceptance criteria.** See Test Case A (§4) and Test Case E (§4).

**Non-goals.** This requirement does NOT mandate: a specific matching algorithm (string
similarity, embedding similarity, a second LLM call, a rules-based name/domain check, or
any other named technique); a confidence score formula; a new package, table, column, or
API; or any change to the homepage-only source-acquisition boundary Phase 18 already froze
(`sourceDocumentProvider.ts`'s O-18-03 scope). Choosing among these is implementation scope,
left to a future scope-lock.

**Relationship to Phase 20.** Not addressed by Phase 20 at all — `PHASE_20_QUALIFICATION_SCOPE_LOCK.md`
explicitly limits its own "Required signal kinds"/"service-profile compatibility" criteria
to what `suggestOffers()` already checks (kind + keyword), and does not mention source
attribution anywhere. This is a genuinely new gap, not a re-litigation of a Phase 20 decision.

**Clarification vs. new capability.** New capability (see §2's conclusion above) — no
existing requirement text covers this.

---

### R-71 — SERVICE-PROBLEM RELEVANCE (hardens R-11 / R-12)

**Purpose.** Ensure a detected "need" reflects a genuine, service-relevant business problem
— not merely a topical keyword mention — operationalizing R-11's existing word "genuine."

**Behavioral requirement.** A signal must not be treated as evidence of a need for the
user's service merely because its text contains a substring of the user's keywords. The
system must be able to distinguish a signal that *describes a problem the offered service
could plausibly address* from a signal that *merely mentions a topic related to the
service* (e.g., a signal that names "website" as a topic vs. a signal that describes an
actual absent/broken/missing element of a website).

**Inputs.** The live `ResearchSignal`s for a prospect (kind, classification, signal text,
confidence); the user's Service Profile (service, keywords, rationale, min project value —
`toServiceRule()`'s existing inputs).

**Expected behavior.**
- A signal classified `UNKNOWN` must not establish a need (already true today — confirmed,
  `toOfferSignals()` already excludes `UNKNOWN`/null signals).
- A signal whose text is topically adjacent to the service but does not describe an
  observed or inferred *problem* must not, by itself, establish a need (Test Case D).
- A signal that does describe a concrete, specific problem plausibly addressable by the
  offered service — of the kind already demonstrated as producible today for Platinum
  Fitness Club and IFSI Fitness Academy (missing pricing/enquiry mechanism, broken/truncated
  content, inconsistent business information) — must be *capable* of establishing a need
  when the requirement is met (Test Case B, Test Case C, Test Case F). This requirement
  does not lower today's bar; it must not become a mechanism that makes the system detect
  *fewer* genuine needs than it does today.
- `NO SUITABLE OFFER` (R-12) remains an acceptable, and often correct, outcome (Test Case E,
  §5 below).

**Rejection conditions.** Signal text matching a keyword by topical mention alone, with no
described problem, must not satisfy this requirement (Test Case D). Weak, ambiguous, or
purely `UNKNOWN` evidence must not satisfy it either (Test Case E).

**Acceptance criteria.** See Test Cases B, C, D, E, F (§4).

**Non-goals.** Does NOT mandate a specific minimum numeric `fit` threshold — `PHASE_20_QUALIFICATION_SCOPE_LOCK.md`
already names the absence of a fit gate as "a documented scope limitation, not a defect,"
deferring the exact number to "a future phase... once a threshold is explicitly
product-decided." This document does not make that decision; it only establishes that
*some* problem-vs-topic distinction is required, leaving the mechanism and threshold to a
future scope-lock. Does NOT mandate an LLM-based judge, a new taxonomy of website-problem
types, or any specific NLP technique. Does NOT require the `DEFAULT_SERVICE_RULES` catalogue
to change.

**Relationship to Phase 20.** Directly touches decisions Phase 20 explicitly deferred:
`PHASE_20_QUALIFICATION_SCOPE_LOCK.md`'s Decision D3 ("No negative/disqualifying-evidence
criterion... documented as a known gap, not fabricated") and its no-fit-gate note (lines
170–172) are the same gap this requirement formalizes as MVP-gating rather than leaving as
an open, unscoped limitation.

**Clarification vs. new capability.** Clarification/hardening of existing R-11
("genuine need") and R-12 ("NO SUITABLE OFFER when evidence is insufficient") — both
already promise this outcome; this requirement defines what "genuine" and "insufficient"
must mean operationally.

---

### R-72 — QUALIFICATION GATE MUST APPLY R-70 AND R-71

**Purpose.** Ensure R-70 and R-71 are not merely true in principle but are actually
enforced at the point where an Opportunity becomes `QUALIFIED` — the state that gates
Personalization (R-51/Phase 21) and Outreach Preparation (R-59/Phase 22), and therefore
the state that determines what a human reviewer sees as "ready."

**Behavioral requirement.** An Opportunity must not reach `QUALIFIED` on the strength of
evidence that fails R-70 (wrong-business source) or R-71 (topical-only match). This is a
gate-placement requirement, not a re-specification of Qualification's existing criteria
(`NEED_DETECTED`, `EVIDENCE_PRESENT` — see `packages/core-qualification/src/service.ts`,
read-only, unmodified by this document).

**Inputs.** Whatever R-70/R-71 determine about a given Opportunity's underlying evidence.

**Expected behavior.** `INSUFFICIENT_EVIDENCE` or `NOT_QUALIFIED` must be reachable outcomes
specifically *because* of an R-70 or R-71 failure, distinguishable (at minimum in the
persisted `criteria` reasons, per the existing `qualifications.criteria` jsonb shape) from
today's only failure reason ("no need was detected — suggestOffers() found no matching
offer").

**Rejection conditions.** Same as R-70/R-71.

**Acceptance criteria.** Test Case A (Goregaon-shaped scenario) must not reach `QUALIFIED`.
Test Cases B/C (Platinum/IFSI-shaped, genuine-problem scenarios) must remain *capable* of
reaching `QUALIFIED` once R-71 is satisfied — this requirement must not make Qualification
strictly harder to pass for a genuinely well-evidenced opportunity than it is today.

**Non-goals.** Does not require re-deriving `NEED_DETECTED`/`EVIDENCE_PRESENT` independently
inside Qualification — `PHASE_20_QUALIFICATION_SCOPE_LOCK.md` already establishes the
principle that Qualification reads `suggestOffers()`'s conclusion rather than
re-interpreting evidence, and this document does not propose changing that division of
labor. It proposes that whatever *produces* `needDetected` (i.e., where R-70/R-71 actually
get enforced — most likely upstream, at or before Opportunity Creation, not inside
Qualification itself) must apply them before Qualification ever sees the result. Where
exactly in the pipeline enforcement belongs is implementation scope for a future scope-lock.

**Relationship to Phase 20.** Phase 20's qualification state machine and its
`NEED_DETECTED`/`EVIDENCE_PRESENT` criteria are unmodified by this proposal; this requirement
is about what feeds into `NEED_DETECTED` being true, not about rewriting Phase 20 itself.

**Clarification vs. new capability.** Consequence of R-70/R-71 — inherits their
classification (R-70: new; R-71: hardening).

---

## 4. TEST CASES (behavioral, not implementation-specific)

All six test cases use real business names and real evidence already produced during this
session's validation — none of the scenarios below are fabricated; they restate what
already happened, as acceptance criteria for the requirements above.

| Case | Business | Scenario | Expected result |
|---|---|---|---|
| **A — Wrong source** | Goregaon Sports Club | Fetched source (`heydrop.me`) is for a different business; the research process's own output already states the company name does not appear in the source | R-70: source/business mismatch must prevent this source from establishing an actionable need. **No actionable opportunity from this source.** |
| **B — Real website problems (Platinum)** | Platinum Fitness Club | Concrete `OBSERVED` problems exist (inconsistent branch naming, no pricing/enquiry mechanism, mismatched service descriptions) | R-71: the system must be *capable* of recognizing these as a genuine, service-relevant need when the evidence supports it. Must NOT require an opportunity if the (still product-undecided) evidence threshold is not met — `NO SUITABLE OFFER` remains acceptable. |
| **C — Real website problems (IFSI)** | IFSI Fitness Academy | Concrete `OBSERVED` problems exist (truncated hero headline, empty trust sections, implausible/inconsistent stats, no self-serve course info) | R-71: must distinguish these genuine, specific, service-relevant problems from a generic/topical website mention. |
| **D — Topical keyword only** | (any) | Signal text is only "this business has a website" — a bare topical fact, no described problem | R-71: must NOT, by itself, establish a website-service need. |
| **E — Insufficient evidence** | (any) | Evidence is weak, `UNKNOWN`, or ambiguous | R-71/R-12: **NO OPPORTUNITY.** Already the correct, required outcome — see MVP_SCOPE_BOUNDARY.md §5.4 ("NONE when evidence is insufficient"). |
| **F — Strong, relevant evidence** | (any) | A specific `OBSERVED` problem directly relevant to the user's offered service | Eligible to proceed to Qualification (R-72), **subject to whatever fit/threshold gate a future scope-lock defines** — this document does not set that number. |

---

## 5. THE NO-FABRICATION / NO-OPPORTUNITY PRINCIPLE IS PRESERVED, NOT WEAKENED

This document strengthens, and does not relax, MVP_SCOPE_BOUNDARY.md §9's criterion 9. It
is explicit that:

```text
GOOD:  Observed evidence → supported inference → relevant, business-attributed
       service need → opportunity

BAD:   Keyword mention → assumed problem → opportunity
BAD:   Wrong company's website → keyword match → opportunity   (Test Case A)
BAD:   Weak/unknown evidence → high-confidence opportunity     (Test Case E)
```

A system that returns **fewer, trustworthy opportunities** — including zero, for a given
search — is explicitly preferable under this principle to a system that returns more
opportunities of the kind demonstrated in the Goregaon Sports Club case. Nothing in R-70,
R-71, or R-72 should be read as requiring a minimum number or rate of opportunities per
search; MVP_SCOPE_BOUNDARY.md §5.4's "NONE when evidence is insufficient" is reaffirmed,
not superseded.

---

## 6. WHAT THIS DOCUMENT DOES NOT DO

- It does not implement code, modify packages, modify the worker, modify migrations, or
  modify the UI.
- It does not modify, reopen, or relitigate Phases 18–23 — all remain CLOSED/FROZEN.
- It does not create, name, or authorize a Phase 24 scope-lock.
- It does not restore or wire `core-outreach`, `core-proposal`, CRM, sending, scheduling,
  or autonomous follow-up — none of R-70/R-71/R-72 touch or depend on any of those.
- It does not choose an implementation technique for R-70 or R-71, and does not set a
  numeric fit/confidence threshold — those are explicitly left to a future, separately
  authorized scope-lock, following this repository's existing governance pattern
  (a `PHASE_NN_..._SCOPE_LOCK.md` written and reviewed the way Phases 18–23 were).
- It does not claim §9 validation now passes or fails — it explains why the three
  opportunities produced so far are not yet sufficient evidence either way (see the
  real-user audit this document follows from).

---

## 7. OPEN PRODUCT QUESTIONS (for whoever authorizes implementation)

These are explicitly left undecided by this document, per §10's instruction not to
over-specify implementation:

1. What mechanism should establish source-to-business correspondence (R-70)? Options
   observed in the existing codebase's own patterns include: a name/domain heuristic check
   at Discovery time, an explicit relevance classification step alongside existing
   `OBSERVED`/`INFERRED`/`UNKNOWN` classification, or a hard block on a research model's own
   self-reported mismatch statement (the Goregaon case already produced one — the model
   said so itself; today nothing reads that statement programmatically).
2. What threshold, if any, should gate R-71 — is a single matched signal ever sufficient,
   or is a minimum count/confidence required, and if so what number?
3. Should R-70/R-71 be enforced inside `suggestOffers()`/`toServiceRule()` (Opportunity
   Creation, R-13), inside Qualification (R-72's likely intent), or as a distinct step
   between the two?
4. Does this warrant a `MINIMUM_FIT` qualification criterion (already anticipated as an
   open question by `PHASE_20_QUALIFICATION_SCOPE_LOCK.md` lines 170–172) as part of the
   same future scope-lock, or a separate one?

This document takes no position on any of the four questions above.
