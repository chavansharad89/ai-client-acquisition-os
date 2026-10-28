# PHASE 24 — SCENARIO E PRODUCT DECISION

## STATUS: RECOMMENDATION — NOT YET APPROVED, NOT IMPLEMENTED

This document is a product decision recommendation, not an implementation. It is built
**exclusively** from the two authoritative Phase 24 documents named below. No repository
source code was inspected to produce it; no outside knowledge, prior analysis, or web
research was used. Where the two source documents do not establish a fact, this document
says so explicitly rather than filling the gap.

**Source documents (the only evidence base for this document):**
- [PHASE_24_R70_R71_DECISION.md](PHASE_24_R70_R71_DECISION.md)
- [PHASE_24_SCENARIO_E_DECISION_CONTRACT.md](PHASE_24_SCENARIO_E_DECISION_CONTRACT.md)

Both source documents are left unmodified by this document.

---

## 1. Decision Question

> Should INFERRED-only evidence, without corroborating OBSERVED evidence, be sufficient to
> reach QUALIFIED?

Recorded verbatim, in this exact form, in `PHASE_24_R70_R71_DECISION.md` §9. Three candidate
policies are compared:

```text
OPTION A — INFERRED-only is sufficient.
OPTION B — INFERRED requires corroboration.
OPTION C — OBSERVED is required.
```

---

## 2. Authoritative Phase 24 Facts

Extracted directly from the two source documents, organized by topic.

### R-70
```text
R-70:
IMPLEMENTED — BOUNDED MVP CONTROL
```
Excludes a Prospect's evidence set when a signal/quote self-identifies as a different named
business. Explicitly does **not** guarantee rejection of: wrong-business sources with no
self-identification; wrong-business sources sharing a first name-token; ambiguous-content
sources; or any case not derivable from persisted signal/quote data (`PHASE_24_R70_R71_
DECISION.md` §3). Both source documents agree R-70 is unaffected by, and orthogonal to,
Scenario E — no option analyzed here changes R-70 (`PHASE_24_R70_R71_DECISION.md` §9;
`PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §7).

### R-71
```text
R-71:
IMPLEMENTED WITH EXPLICIT BOUNDARY
```
Guarantees a purely topical/descriptive claim cannot become offer-eligible merely because a
service keyword appears (topical fields: `companySummary`, `businessModel`,
`targetCustomers`; problem/opportunity fields: `visibleProblems`, `growthOpportunities`,
`aiOpportunities`, `websiteIssues`, `contentOpportunities`, `automationOpportunities`).
Recorded limitation: R-71 "does not independently determine whether a problem-field claim is
semantically relevant to the caller's specific service" — downstream keyword matching still
participates (`PHASE_24_R70_R71_DECISION.md` §7). Both documents agree R-71 is unaffected by
Scenario E (`PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §8).

### OBSERVED / INFERRED / UNKNOWN
```text
OBSERVED:
Provenance-verified — packages/core-research/src/provenance.ts "already checks every
OBSERVED claim against its cited source document character-for-character"
(PHASE_24_SCENARIO_E_DECISION_CONTRACT.md §3, Option C).

INFERRED:
A "first-class, legitimate epistemic category," not a degraded fallback of OBSERVED — has
its own obligations (basis required, confidence capped at 80, evidence forbidden)
(PHASE_24_SCENARIO_E_DECISION_CONTRACT.md §2). No provenance/attribution mechanism is
documented as applying to INFERRED claims.

UNKNOWN:
Not analyzed as a live option in either document beyond being outside the OBSERVED/INFERRED
comparison; no statement in either document treats UNKNOWN as qualification-eligible.
```

### Confidence
```text
Confidence exists on signals.
INFERENCE_DISCOUNT = 0.5 exists, applied only in the research/ranking scoring layer.
Qualification does not currently consume confidence at all — a confidence=1 evidentiary
signal still yields QUALIFIED (PHASE_24_SCENARIO_E_DECISION_CONTRACT.md §1).
No documented confidence threshold exists for qualification.
Confidence calibration: not addressed by either document as established.
```

### Corroboration / Source Independence
```text
"There is no source-independence model."
(PHASE_24_SCENARIO_E_DECISION_CONTRACT.md §6)
```
Multiple unresolved questions are listed as prerequisites to any corroboration rule (what
counts as corroboration; must it be OBSERVED; must it be a separate source; can same-source
fields corroborate each other; can same-document signals count as independent) — none
answered by either document (`PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §3 Option B, §6).

### QUALIFIED
Addressed only in `PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §4 — see §3 below. Not defined
in `PHASE_24_R70_R71_DECISION.md` beyond naming it as the outcome state Scenario E gates.

### Downstream / Outreach
```text
Qualification currently feeds opportunity/outreach preparation.
Current outreach preparation is draft-only — no SENT/DELIVERED/SCHEDULED state, no
dispatch function, no transport dependency (PHASE_24_SCENARIO_E_DECISION_CONTRACT.md §9).
```
Not addressed by `PHASE_24_R70_R71_DECISION.md`.

### Scraper / Provider / Phase 18 boundary
```text
Scraper: NOT PART OF PHASE 24 / OUT OF SCOPE
Discovery provider: UNCHANGED / FROZEN
Source acquisition: UNCHANGED / FROZEN
Phase 18 homepage-only boundary: UNCHANGED
```
Stated in `PHASE_24_R70_R71_DECISION.md` §5, §10, §13, and reaffirmed in
`PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §14. Neither document connects Scenario E to a
scraper or provider decision.

### Current Scenario E behavior
```text
INFERRED-only → needDetected = true → QUALIFIED
```
Both documents agree this is current, incidental behavior — "a consequence of R-70/R-71
being applied identically regardless of classification — not a settled product rule"
(`PHASE_24_R70_R71_DECISION.md` §9).

---

## 3. Meaning of QUALIFIED

`PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §4 identifies two distinct meanings coexisting in
the repository:

```text
QualificationState.QUALIFIED
```
— a pre-outreach, deterministic evaluator output (`needDetected && EVIDENCE_PRESENT`)

versus

```text
CRM / post-reply QUALIFIED terminology
```
— a state reached only after `CONTACTED → REPLIED` in the canonical Opportunity state
machine.

It proposes, explicitly marked as unsettled:

```text
"Evidence is sufficient to justify treating the prospect
as having a potentially service-relevant need."

DRAFT DEFINITION — REQUIRES PRODUCT APPROVAL
```

`PHASE_24_R70_R71_DECISION.md` does not define `QUALIFIED` at all — it names Scenario E's
outcome state but does not state what it is meant to communicate to a user.

```text
QUALIFIED SEMANTICS:
AMBIGUOUS IN THE PHASE 24 DOCUMENTS
```

**How this ambiguity affects the recommendation:** it is not silently resolved here. Instead,
§8 below tests the recommendation against both the "draft candidate" (weaker) reading and the
"confirmed need" (stronger) reading separately, and states plainly whether the recommendation
holds under each, rather than assuming one reading is correct.

---

## 4. Option A — INFERRED Sufficient

```text
INFERRED-only → EVIDENCE_PRESENT → QUALIFIED
```

**What the documents support:** this is the current, shipped, pinned behavior
(`PHASE_24_R70_R71_DECISION.md` §9; `PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §1). The
Decision Contract documents real, stated benefits: maximum lead volume, coverage of
thin-evidence prospects, and zero implementation change (§3, Option A).

**What the documents leave uncertain:** whether this behavior is *intended* as policy or is
merely incidental. Both documents state explicitly it is "not a settled product rule"
(`PHASE_24_R70_R71_DECISION.md` §9).

**What risks the documents identify:**
- "No mechanism distinguishes a well-reasoned inference from a plausible-sounding guess."
- No confidence floor applies — a confidence=1 evidentiary signal still yields `QUALIFIED`,
  as pinned by the referenced regression test.
- No corroboration or source-independence check exists.
(All from `PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §1, §3 Option A.)

**What safeguards the documents identify as required**, if Option A were retained as a
deliberate decision rather than incidental behavior: an explicit product-owner sign-off, and
consideration of a documented confidence floor and/or a reviewer-facing signal that an
Opportunity's evidence is `INFERRED`-only (§3, Option A — noted as "whether such signals
currently exist in the UI layer... is not asserted here either way").

---

## 5. Option B — Corroboration Required

```text
INFERRED-only → not QUALIFIED
INFERRED + qualifying corroboration → QUALIFIED eligible
```

**What the documents support:** the underlying intuition — that reasoning trusted only once
something real is already established reduces reliance on a single unverifiable claim
(implicit in the "benefits" framing of `PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §3, Option
B, though it is not phrased as a stated benefit as directly as Options A/C).

**What remains undefined:** the corroboration mechanism itself is, by the Decision Contract's
own statement, "intentionally not defined." More fundamentally: "the repository currently
lacks a source-independence model" — `INFERRED` signals carry no `sources` at all, only free
text `basis` that is "never cross-referenced against anything," and multiple `INFERRED`
claims "can originate from one research run reading one fetched document" with no way,
today, to tell that apart from genuinely independent claims (§3 Option B, §6).

**What corroboration would need to mean** — five explicit open questions are listed and none
is answered:
```text
What counts as corroboration?
Must corroboration be OBSERVED?
Must it come from a separate source?
Can two fields from one source corroborate each other?
Can two research signals from one document count as independent?
```

**What new contract decisions would be required:** a source-independence model would need to
be defined and built before this option could be implemented responsibly — it does not exist
today in any form. The Decision Contract also documents a specific failure mode: a
corroboration rule defined too loosely "degenerates toward Option A's current behavior,"
while one defined too strictly, without being product-decided, "could make EVIDENCE_PRESENT
unsatisfiable for legitimately correct but thinly-evidenced prospects" (§3 Option B).

No corroboration mechanism is invented here.

---

## 6. Option C — OBSERVED Required

```text
OBSERVED → QUALIFIED eligible
INFERRED-only → not QUALIFIED
```

**What problem it solves, per the documents:** it is the only option under which "every
`QUALIFIED` Opportunity would be traceable to a verbatim, provenance-verified quote" — the
Decision Contract states `provenance.ts` "already checks every OBSERVED claim against its
cited source document character-for-character" (§3, Option C, Advantages). It is also
documented as "the narrowest implementation surface of the three options" and, later, "the
smallest surface of the three, with no new corroboration/independence machinery needed" (§3,
§13).

**What information it discards:** the entire practical effect of the `INFERRED`
classification on qualification, despite the same document elsewhere describing `INFERRED`
as a "first-class, legitimate epistemic category," not a fallback (§2, §3 Option C, Risks).

**What risks of over-restriction the documents identify:** the Scenario E fixture business
("Business A," sparse homepage) is named directly as the concrete case excluded — "a
business with genuinely thin, undocumented evidence where the model's inference may be
correct, but no directly quotable source text exists." Under Option C, "that prospect and any
similarly thin-evidence prospect never reaches QUALIFIED, regardless of whether the inference
was actually correct" (§3, Option C).

**Whether the documents establish that OBSERVED must be mandatory:** no — neither document
states this as a conclusion. The Decision Contract explicitly frames all three options
neutrally and does not conclude that "stronger evidence" necessarily requires OBSERVED to be
mandatory; that inference is drawn only in §8 below, from the comparison, not asserted by the
source documents themselves.

---

## 7. Comparative Decision Matrix

| Criterion | A — INFERRED sufficient | B — INFERRED + corroboration | C — OBSERVED required | Evidence from Phase 24 documents |
| --- | --- | --- | --- | --- |
| Evidence requirement | Any evidentiary signal (OBSERVED or INFERRED), classification-blind | INFERRED plus an undefined corroboration condition | OBSERVED only; provenance-verified | Contract §1, §3 (A/B/C descriptions) |
| False-positive exposure | Documented as highest — "no mechanism distinguishes a well-reasoned inference from a plausible-sounding guess"; confidence=1 still qualifies | NOT ESTABLISHED precisely — depends on an undefined corroboration rule; documents warn a loose rule "degenerates toward Option A" | Documented as lowest of the three — every claim is provenance-verified against a real source document | Contract §1, §3 (A, B, C) |
| False-negative exposure | Documented as lowest — "maximum lead volume," covers thin-evidence prospects | NOT ESTABLISHED precisely — documents flag risk of becoming "unsatisfiable" if defined too strictly, but do not quantify | Documented as highest — thin-evidence prospects "never reach QUALIFIED, regardless of whether the inference was actually correct" | Contract §3 (A, C) |
| User trust implication | NOT ESTABLISHED — neither document names "user trust" as a comparative dimension | NOT ESTABLISHED | NOT ESTABLISHED | — |
| Dependence on confidence | None — confidence is not used by qualification under any option today | Not established as a requirement; confidence-related open questions are listed among prerequisites but not confirmed as part of the corroboration mechanism | None | Contract §5, §6, §8 (Option B) |
| Dependence on corroboration | None | Central and entirely undefined — "intentionally not defined" | None — replaced by provenance verification | Contract §3 (B, C), §6 |
| Compatibility with R-70 | Unaffected — R-70 "is not expanded, narrowed, or otherwise modified" by any option | Unaffected, same statement | Unaffected, same statement | Contract §7; R70/R71 doc §9 |
| Compatibility with R-71 | Unaffected — applies only after R-71's field-shape gate, same for all options | Unaffected, same statement | Unaffected, same statement | Contract §8 |
| Implementation complexity | Documented as "likely minimal" — formalizing existing behavior, no code change required to preserve current output | Documented as "the larger of the three surfaces, since source independence does not exist today at all" | Documented as "the smallest surface of the three, with no new corroboration/independence machinery needed" | Contract §13 |
| Phase 24 scope impact | Within Phase 24's recorded open-decision scope (Decision 2); no scraper/provider/schema impact documented | Within scope per naming, but documents do not state whether new corroboration/source-independence semantics would require schema/migration changes — NOT ESTABLISHED | Within Phase 24's recorded open-decision scope; no scraper/provider/schema impact documented | R70/R71 doc §9, §12 Decision 2; Contract §13, §14 |

No scores, points, percentages, weights, or rankings are used above — the comparison is
qualitative, sourced to the cited document sections.

---

## 8. Product Recommendation

```text
PRODUCT RECOMMENDATION:
OPTION C
```

### Why

Reasoning purely from what the two source documents establish, not from new evidence:

1. **Option A is documented as having no evidentiary floor at all.** The Decision Contract
   pins that a confidence=1 evidentiary signal — the lowest confidence value the schema
   permits — still yields `QUALIFIED` today, and states plainly that "no mechanism
   distinguishes a well-reasoned inference from a plausible-sounding guess." This is the most
   concretely documented risk of the three options.

2. **Option B cannot be soundly adopted on the documents as they stand**, because its central
   mechanism — corroboration — is explicitly undefined, and its prerequisite — a
   source-independence model — is explicitly stated not to exist ("There is no
   source-independence model"). Recommending Option B today would mean recommending a
   contract this document cannot actually write, since five of its defining questions are
   unanswered by the source material and no corroboration mechanism may be invented here
   (per task constraints).

3. **Option C is the only option both documents' facts support as implementable now**, using
   a mechanism already documented as existing and operating (`provenance.ts`'s
   character-for-character verification of `OBSERVED` claims), and is explicitly documented
   as requiring no new corroboration or independence machinery — unlike Option B.

4. **This holds under both plausible readings of `QUALIFIED` identified in §3.** Under the
   stronger reading ("confirmed business need"), Option C is the direct fit — it is the only
   option that ties `QUALIFIED` to provenance-verified evidence. Under the weaker, draft
   candidate reading ("sufficient to justify treating the prospect as having a *potentially*
   service-relevant need"), Option A's documented total absence of a floor — no confidence
   requirement, no corroboration requirement, satisfied by a single minimum-confidence
   inference — is difficult to characterize as "sufficient" evidence for even that weaker
   standard, on the documents' own terms. Option C does not depend on resolving the ambiguity
   in one specific direction to be defensible; that is what is meant by "robust to the
   ambiguity" in this recommendation, not that the ambiguity has been resolved.

### Why not the other two

- **Not Option A**, because the two documents record its central risk (no evidentiary floor
  of any kind) as an explicit, current gap rather than a design choice, and describe the
  current shipped state itself as "incidental behavior... not a settled product rule" — i.e.,
  the documents describe Option A as something that happened, not something recommended by
  Phase 24's own record.

- **Not Option B**, not because the documents disfavor it in principle, but because the
  documents establish that its defining mechanism does not exist and cannot be specified from
  the two documents alone. Adopting Option B today would require inventing a corroboration
  and source-independence contract that this task's constraints (§0, §12 of the governing
  instructions) forbid inventing. Option B may become the better-supported choice once a
  source-independence model is separately defined — that is recorded as an open question in
  §10, not foreclosed.

---

## 9. Proposed Scenario E Contract

```text
SCENARIO E — PROPOSED PRODUCT CONTRACT

1. Can INFERRED-only evidence reach QUALIFIED?
   No. QUALIFIED requires at least one live, evidentiary OBSERVED signal.

2. Is corroboration required?
   No — not under this proposal. Corroboration (Option B) is not adopted; OBSERVED's
   existing provenance verification serves the evidentiary-floor purpose instead.

3. What role does OBSERVED play?
   Required. OBSERVED becomes the sole classification that can satisfy EVIDENCE_PRESENT
   for the purpose of reaching QUALIFIED.

4. What role does confidence play?
   OPEN. Neither source document establishes that Option C requires introducing a
   confidence threshold, and this proposal does not introduce one. Confidence remains
   unused in qualification, as it is today, unless separately decided.

5. What role does source independence play?
   Not applicable under this proposal — OBSERVED's existing provenance verification
   (source document + verbatim quote) already ties each qualifying claim to a specific,
   checked source. Source independence remains OPEN for any future Option B path.

6. What does QUALIFIED mean?
   OPEN / AMBIGUOUS IN THE PHASE 24 DOCUMENTS (§3). Not resolved by this proposal. The
   recommendation in §8 is argued to hold under both candidate readings, but the readings
   themselves remain unreconciled.

7. Does this change R-70?
   No. Both source documents establish R-70 as unaffected by and orthogonal to Scenario E.

8. Does this change R-71?
   No. Both source documents establish R-71 as unaffected by and orthogonal to Scenario E.
```

---

## 10. Remaining Open Questions

Carried forward, unresolved by this document:

- **QUALIFIED semantics** (§3) — which of the two identified meanings (or another) is
  intended is not settled here, though §8 argues the recommendation is robust to either.
- **Confidence's role**, if any, in qualification going forward (proposed contract §9, item
  4) — this document does not decide whether a confidence threshold should later be added on
  top of the OBSERVED-required gate.
- **Whether Option B should be revisited** once a source-independence model is separately
  defined — not foreclosed, only deferred, since the two source documents do not supply the
  missing mechanism.
- **What, precisely, would need to change in the pinned regression test** referenced in
  `PHASE_24_SCENARIO_E_DECISION_CONTRACT.md` §1 to reflect a new policy — not addressed here,
  since this document does not authorize implementation (§11).
- **User trust implications** of any option — flagged in §7's matrix as NOT ESTABLISHED by
  either source document; would need separate product input.
- Whether adopting Option C requires any schema/migration change — not established by either
  document; the Decision Contract's implementation-impact section (§13) describes it only as
  "a qualification evidence gate change" without stating whether persisted data shapes are
  affected.

---

## 11. Implementation Gate

```text
IMPLEMENTATION AUTHORIZATION:
NOT GRANTED BY THIS DOCUMENT
```

This recommendation is a product decision proposal only. No production code, test, schema,
or migration change is made or authorized by this document. A separate implementation prompt,
explicitly authorized by the product owner, is required before Option C (or any option) is
built.

---

## 12. Scope / Cost Constraints

```text
Scraper:
OUT OF SCOPE

Discovery provider:
UNCHANGED

Provider replacement:
NONE

Phase 18 boundary:
UNCHANGED

External API calls:
NONE

Paid API usage:
NONE

Additional LLM calls:
NONE
```

Scenario E is not connected to a scraper or provider decision by this document, consistent
with both source documents' explicit scope constraints.

---

## PHASE 24 — SCENARIO E PRODUCT DECISION

```text
Recommendation:
OPTION C — OBSERVED REQUIRED

Decision basis:
Both source documents establish that Option A currently has no evidentiary floor (a
confidence=1 evidentiary signal still yields QUALIFIED) and is documented as incidental,
not settled, behavior. Option B's defining mechanism (corroboration) and its prerequisite
(a source-independence model) are explicitly stated not to exist and cannot be specified
from the two documents without inventing new policy, which this task does not permit.
Option C is the only option both documents show as implementable now, using an existing,
documented mechanism (provenance-verified OBSERVED claims), and the recommendation is
argued in §8 to hold under both candidate readings of QUALIFIED's still-ambiguous meaning.

Implementation:
NOT AUTHORIZED

R-70:
UNCHANGED

R-71:
UNCHANGED

Scraper:
OUT OF SCOPE

Provider:
UNCHANGED

Phase 18 boundary:
UNCHANGED
```
