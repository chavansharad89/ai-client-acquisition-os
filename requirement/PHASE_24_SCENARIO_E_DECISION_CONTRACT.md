# PHASE 24 — SCENARIO E DECISION CONTRACT

## STATUS: DRAFT — AWAITING PRODUCT OWNER DECISION

This document converts the Scenario E read-only decision analysis into a decision contract
for human approval. It defines the shape of the open decision, the options, and the
prerequisites — it does not choose among them and authorizes no implementation.

Companion documents:
- [PHASE_24_R70_R71_DECISION.md](PHASE_24_R70_R71_DECISION.md) — where Scenario E was first
  recorded as an open decision (§9, §12 Decision 2).
- [PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md](PHASE_24_EVIDENCE_RELEVANCE_SCOPE_LOCK.md) —
  the Phase 24 scope lock this decision falls under (§15).
- [MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md](MVP_EVIDENCE_RELEVANCE_REQUIREMENT.md) — the
  originating requirement (Scenarios B/D/E).

---

## 1. Current State

```text
Scenario E:
OPEN PRODUCT DECISION

Current behavior:
INFERRED-only
→ needDetected=true
→ QUALIFIED
```

```text
INFERENCE_DISCOUNT:
0.5

Current layer:
research/ranking scoring only (packages/core-research/src/scoringAdapter.ts,
consumed by the seven-factor ProspectScore)

Qualification use:
NONE — packages/core-qualification/src/rules.ts's evaluateEvidencePresent() does not
read confidence at all; a confidence=1 evidentiary signal still yields QUALIFIED
(pinned by evaluator.test.ts's Decision-D2 test)
```

`INFERENCE_DISCOUNT = 0.5` is **not** interpreted here as a qualification threshold. It is,
today, a scoring-layer mechanism only, applied to rank Opportunities against each other —
not to gate whether an Opportunity reaches `QUALIFIED` in the first place. Any use of this
constant (or any other value) as a qualification threshold would be a new decision, not an
extension of existing behavior.

Pinned by a regression test: [apps/worker/src/searchWorker/worker.test.ts:1395](../apps/worker/src/searchWorker/worker.test.ts:1395),
`'phase24 regression: inferred-only evidence currently qualifies equivalently to observed
(Scenario E — open decision)'`. That test's own comments forbid changing its assertions, or
introducing OBSERVED-only/INFERRED-threshold/INFERRED-corroboration logic in production,
without this decision being recorded first.

---

## 2. The Product Question

> Should INFERRED-only evidence, without corroborating OBSERVED evidence, be sufficient to
> reach QUALIFIED?

Kept explicitly separate, per the prior analysis:

### Evidence validity
Can INFERRED evidence be valid? — Yes, structurally: the research schema
(`packages/core-research/src/schema.ts`) treats `INFERRED` as a first-class, legitimate
epistemic category with its own obligations (`basis` required, confidence capped at 80,
evidence forbidden), not a degraded fallback of `OBSERVED`. This is not in dispute.

### Qualification sufficiency
Should INFERRED-only evidence be sufficient for `QUALIFIED`? — This is the open question.
Evidence being potentially valid does not by itself answer whether it should be sufficient,
alone, to justify the specific downstream consequence `QUALIFIED` currently carries (§5, §10).

These two questions are not the same question and must not be collapsed into one.

---

## 3. Policy Options

No option below is called best, better, winning, or recommended. All three are presented for
product-owner comparison only.

### OPTION A — INFERRED SUFFICIENT

```text
INFERRED-only
→ EVIDENCE_PRESENT
→ QUALIFIED
```

This is the current, shipped behavior.

**What this preserves:**
- Maximum lead volume — no Opportunity is withheld solely because the research model found
  no directly quotable fact.
- Coverage of thin-evidence prospects (minimal public web presence) where a genuine need may
  exist but nothing is citable verbatim.
- Zero implementation change — this is already what ships.

**What it risks:**
- No mechanism distinguishes a well-reasoned inference from a plausible-sounding guess.
- No confidence floor is applied at qualification time (§6) — even the lowest-confidence
  `INFERRED` claim currently qualifies.
- No corroboration or source-independence check exists (§7).

**What safeguards would be required** if this option were kept as a deliberate, recorded
decision rather than incidental behavior:
- An explicit product-owner sign-off that this is intended (this document's purpose).
- Consideration of a documented confidence floor, and/or a reviewer-facing signal that an
  Opportunity's evidence is `INFERRED`-only, before or alongside any downstream trust-boundary
  change (§10). Whether such signals currently exist in the UI layer was outside the scope of
  the underlying analysis and is not asserted here either way.

### OPTION B — INFERRED REQUIRES CORROBORATION

```text
INFERRED-only
→ not QUALIFIED

INFERRED + qualifying corroboration
→ QUALIFIED eligible
```

The corroboration threshold itself is intentionally **not** defined here.

**The repository currently lacks a source-independence model.** `OBSERVED` signals carry a
`sources` array (with `sourceUrl`), but no code path checks it for independence today.
`INFERRED` signals carry no `sources` at all — only free-text `basis`, never cross-referenced
against anything. Multiple `INFERRED` claims can originate from one research run reading one
fetched document, with nothing in the current data model to tell that apart from two claims
drawn from genuinely separate sources.

**Unresolved questions this option would need to answer before implementation:**
```text
What counts as corroboration?
Must corroboration be OBSERVED?
Must it come from a separate source?
Can two fields from one source corroborate each other?
Can two research signals from one document count as independent?
```

**Failure modes if these are answered casually:** a corroboration rule defined too loosely
(e.g., "any second signal, INFERRED or not") degenerates toward Option A's current behavior;
one defined too strictly, without being explicitly product-decided, could make
`EVIDENCE_PRESENT` unsatisfiable for legitimately correct but thinly-evidenced prospects.

### OPTION C — OBSERVED REQUIRED

```text
OBSERVED
→ QUALIFIED eligible

INFERRED-only
→ not QUALIFIED
```

**Advantages:**
- Every `QUALIFIED` Opportunity would be traceable to a verbatim, provenance-verified quote
  (`packages/core-research/src/provenance.ts` already checks every `OBSERVED` claim against
  its cited source document character-for-character).
- The narrowest implementation surface of the three options (§14).

**Risks:**
- Removes `INFERRED`'s practical effect on qualification entirely, despite the schema treating
  it as a legitimate classification, not a fallback.

**Potential loss of useful inferred opportunities:** the Scenario E test fixture's own
business ("Business A," sparse homepage) is the concrete shape this excludes — a business
with genuinely thin, undocumented evidence where the model's inference may be correct, but no
directly quotable source text exists. Under Option C, that prospect and any similarly
thin-evidence prospect never reaches `QUALIFIED`, regardless of whether the inference was
actually correct.

---

## 4. QUALIFIED Semantics Must Be Resolved

The prior analysis found that `QUALIFIED` has more than one meaning in this repository:

```text
QualificationState.QUALIFIED
```
(`packages/core-qualification/src/types.ts`) — a pre-outreach, deterministic evaluator output:
`needDetected && EVIDENCE_PRESENT`, computed before any human or CRM contact.

versus

```text
CRM / post-reply QUALIFIED terminology
```
— the Product Requirements Document's canonical Opportunity state machine
(`NEW → RESEARCHED → CONTACTED → REPLIED → QUALIFIED → PROPOSAL_SENT → WON/LOST`), where
`QUALIFIED` is reached only *after* a human has already contacted the prospect and received a
reply.

> Before implementing Scenario E, the product must establish exactly what the pre-outreach
> `QualificationState.QUALIFIED` means.

**Proposed candidate definition, for discussion only:**

```text
"Evidence is sufficient to justify treating the prospect
as having a potentially service-relevant need."
```

```text
DRAFT DEFINITION — REQUIRES PRODUCT APPROVAL
```

This candidate is not treated as settled by this document, and is not the only possible
reading — an alternative reading closer to "confirmed need" would carry different implications
for how strict Options A/B/C should be, and that choice belongs to the product owner.

No code is renamed and no code is modified by raising this question.

---

## 5. Confidence Contract

**Current state:**
```text
Confidence exists.
Inference discount exists.
Qualification does not currently consume either.
```

**Decisions required before confidence can affect qualification:**
```text
1. Is confidence calibrated?
2. What does confidence represent?
3. Is confidence comparable across OBSERVED and INFERRED?
4. Should INFERRED confidence be discounted (as it already is in scoring)?
5. Should a confidence threshold exist?
6. Should confidence alone ever be sufficient?
```

No numerical threshold is chosen here, and no scoring formula is proposed. The existing
`INFERENCE_DISCOUNT = 0.5` is noted (§1) as a precedent that exists elsewhere in the codebase,
not as an answer to any of the six questions above.

---

## 6. Corroboration Contract

**Current limitation:**
```text
There is no source-independence model.
```

**The future contract must define, before any corroboration rule ships:**
```text
Independent evidence source
Same-source multiple signals
Cross-field evidence
Cross-document evidence
Cross-provider evidence
OBSERVED + INFERRED combinations
```

Source independence is not implemented, and `provenance.ts` is not modified, by this document.

---

## 7. R-70 Interaction

```text
R-70:
IMPLEMENTED — BOUNDED MVP CONTROL
```

R-70 (source-to-business self-identification attribution) is not expanded, narrowed, or
otherwise modified by this document or by any option above — all three options apply on top
of R-70's existing, unchanged exclusion.

> Evidence classification does not override source-attribution controls.

This document does not claim that resolving Scenario E also resolves or strengthens R-70;
they are orthogonal, as already established in the underlying analysis and in
`packages/core-opportunity/src/adapters.ts`'s own comments.

---

## 8. R-71 Interaction

```text
R-71:
IMPLEMENTED WITH EXPLICIT BOUNDARY
```

R-71 (topical/descriptive fields are never offer-eligible) is not weakened, narrowed, or
otherwise modified by this document or by any option above. Whichever Scenario E option is
eventually chosen, it applies only to signals that have already passed R-71's field-shape
gate — R-71 continues to run first, unchanged.

---

## 9. Downstream Safety

**Current downstream state:**
```text
Qualification currently feeds opportunity/outreach preparation.
Current outreach preparation is draft-only.
```

`packages/core-outreach-preparation` structurally and by test (`no-send.test.ts`) cannot send
anything — no `SENT`/`DELIVERED`/`SCHEDULED` state, no dispatch function, no transport
dependency. The same boundary is held by `packages/core-followup-preparation`.

**The product question, not answered here:**

> If QUALIFIED later becomes capable of triggering execution, should INFERRED-only evidence
> remain sufficient?

This is a future trust-boundary decision, separate from — and potentially stricter than —
whatever Scenario E policy is chosen for the current, draft-only downstream state.

---

## 10. Future State Machine (Conceptual — Not Implemented)

```text
RESEARCH SIGNAL
      ↓
CLASSIFICATION            — settled (schema.ts): OBSERVED | INFERRED | UNKNOWN
      ↓
EVIDENCE SUFFICIENCY       — OPEN: does classification alone determine sufficiency,
                             or do confidence/corroboration also gate it? (§5, §6)
      ↓
NEED DETECTED              — settled: suggestOffers() match, classification-blind today
      ↓
QUALIFICATION               — OPEN: this document's central question (§2, §3)
      ↓
OUTREACH PREPARATION        — settled: draft-only, no-send (§9); OPEN if execution is
                             ever added downstream (§9)
```

No transition above is implemented or reordered by this document. Each `OPEN` marker names a
product decision that must be settled before any corresponding code changes.

---

## 11. Decision Table

| Decision | Current state | Decision required |
| --- | --- | --- |
| Is INFERRED valid evidence? | Yes — first-class schema classification, not a fallback | No — already settled by existing schema |
| Is INFERRED-only sufficient for QUALIFIED? | Yes, incidentally (not by deliberate rule) | Yes |
| Is OBSERVED required? | No | Yes |
| Is corroboration required? | No — not evaluated at all | Yes |
| What counts as independent corroboration? | Undefined — no source-independence model exists | Yes |
| Does confidence affect qualification? | No | Yes |
| Is confidence calibrated? | Undefined — no calibration data found in repository | Yes |
| What does QUALIFIED mean? | Ambiguous — two distinct meanings coexist (§4) | Yes |
| Can QUALIFIED trigger execution? | No — downstream is draft-only today | Yes (forward-looking) |
| Does R-70 attribution remain mandatory? | Yes — implemented, bounded MVP control | No — orthogonal, unaffected by Scenario E |
| Does R-71 topical exclusion remain mandatory? | Yes — implemented with explicit boundary | No — orthogonal, unaffected by Scenario E |

The "Decision required" column states only whether a decision is outstanding — it does not
supply an answer.

---

## 12. Evidence Needed Before Implementation

### Already available
- The exact current rule logic and its test-pinned behavior (§1).
- The existing `INFERENCE_DISCOUNT = 0.5` precedent from the scoring/ranking layer (§1) — a
  reference point, not a mandate, for any future qualification-layer discount.
- The schema's own `INFERRED` confidence ceiling (<=80) as an existing, if uncalibrated,
  structural signal.

### Not currently available
```text
human-labelled INFERRED outcomes
human-labelled OBSERVED outcomes
false-positive measurements
false-negative measurements
outreach response outcomes
conversion outcomes
source-independence evidence
confidence calibration evidence
```
None of these datasets were found in the repository during the underlying analysis, and none
is claimed to exist here.

---

## 13. Implementation Impact — Analysis Only

No code is changed by this section. Likely implementation surfaces are named for comparison
only, without prescribing exact code or estimating effort:

```text
Option A:
likely minimal qualification change (formalizing current behavior as a deliberate rule,
rather than incidental behavior, if the product owner selects it)

Option B:
qualification change + new corroboration/source-independence semantics (the larger of the
three surfaces, since source independence does not exist today at all)

Option C:
qualification evidence gate change (narrowing evaluateEvidencePresent()'s filter), the
smallest surface of the three, with no new corroboration/independence machinery needed
```

---

## 14. Cost Constraint

```text
Additional LLM calls:
NONE REQUIRED BY THE CURRENT DECISION ANALYSIS

External APIs:
NONE

Paid API:
NONE

Scraper:
NOT RELEVANT TO THIS DECISION
```

No new LLM verification layer is introduced or proposed by this document.

---

## 15. Product Owner Decision Block

```text
SCENARIO E — PRODUCT DECISION REQUIRED

Decision 1:
Can INFERRED-only evidence satisfy QUALIFIED?

Decision 2:
If yes, is a confidence requirement necessary?

Decision 3:
If yes, what confidence semantics and threshold apply?

Decision 4:
Is corroboration required?

Decision 5:
What constitutes independent corroboration?

Decision 6:
What exactly does pre-outreach QUALIFIED mean?

Decision 7:
Can QUALIFIED ever trigger execution without human approval?

Decision 8:
Should the same evidence rules apply regardless of downstream
execution capability?
```

```text
NO PRODUCT DECISION HAS BEEN MADE BY THIS DOCUMENT.
```
