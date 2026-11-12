# CLIENT FINDER — GLOBAL ENTITY ARCHITECTURE: Q5 FINAL PO DECISION PREPARATION

**Status: READ-ONLY PO DECISION PREPARATION. NO PO DECISION MADE. NO CODE/SCHEMA/DB CHANGED.**

This document consolidates, and does not re-derive, the repository facts already established in `requirement/CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION_PREPARATION_AUDIT.md` and `requirement/CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_EVIDENCE_SUFFICIENCY_PO_DECISION_PREPARATION.md`. No new repository investigation was performed. Its sole purpose is to separate the two questions those audits left entangled — evidence integrity and sharing policy — into a decision-ready form.

---

## 1. Purpose

Q5 has, across two prior audits, converged on a single structural insight: **"is the evidence genuine," "is the generated statement adequately supported," and "is the generated statement permitted to be shared globally" are three separate questions**, and the repository can only answer the first two. The third is a product/privacy judgment this document prepares for the Product Owner but does not make. This document presents that as two independently decidable PO questions (Q5-A, evidence integrity; Q5-B, sharing policy) plus one dependent question (Q5-C, historical values), so the Product Owner can decide each on its own terms rather than as one bundled choice.

## 2. Authoritative Existing Decisions

Not reopened, not reinterpreted: D1–D23, OQ-1 through OQ-4, OQ-6 through OQ-9, C-1 through C-7, Phase 7B, Phase 8, K1, Service+Geography-only search decisions, the zero-AI architecture requirement, and the ₹1,499 commercial model. OQ-6's field-level public/private classification (`companySummary`/`businessModel` public-eligible; `websiteIssues`/`contentOpportunities`/`aiOpportunities`/`growthOpportunities` private) stands exactly as decided — this document does not touch it. OQ-5 (LinkedIn/profile evidence) remains separately, intentionally deferred and is not addressed here. Q5 itself is not a numbered OQ; it is the implementation-readiness question that surfaced once OQ-6's classification met the actual producer, and this document is its terminal decision-preparation step.

## 3. Confirmed Repository Facts

Carried forward from the two prior Q5 audits, restated without re-verification:

1. `companySummary` and `businessModel` are LLM-generated prose — never a verbatim copy of source material.
2. They are produced by the identical schema (`observationSchema`), identical prompt (`SYSTEM_PROMPT`), and identical persistence path as the four fields OQ-6 classified private.
3. `OBSERVED` is not a bare LLM self-report. `provenance.ts` is a hard, pre-persistence verification gate.
4. An `OBSERVED` evidence item requires, jointly and inseparably: `quote`, `sourceUrl`, `sourceLabel`.
5. The quote must be a real, verbatim (modulo cosmetic Unicode/whitespace normalization) substring of the specific document actually supplied to the model.
6. If verification fails and repair attempts (default 3) are exhausted, the entire research run throws and **nothing persists** — there is no path to a stored, unverified `OBSERVED` claim.
7. Therefore, an `OBSERVED` evidence item's **quote** is genuinely source-backed — this is established, not assumed.
8. The repository does **not** verify that the generated `value` sentence (`companySummary`/`businessModel`'s actual stored text) semantically entails or faithfully paraphrases its own verified quote. No deterministic, LLM-based, or human check of this kind exists anywhere in the codebase.
9. Therefore: **source-evidence verification ≠ generated-value semantic verification.** These are confirmed to be two distinct, independently-true-or-false properties of any given row.
10. D23 is satisfied for the underlying verified quote. D23 does not, by its own stated test, extend a guarantee to the paraphrase built on top of that quote — this is a scope observation, not a D23 deficiency, and is not a proposed change to D23.
11. None of the above establishes that a genuinely well-supported generated statement is safe for cross-freelancer reuse — that is a separate, further question (§5/13's Risk C from the first Q5 audit: competitive intelligence), not resolved by evidence integrity alone.
12. A deterministic, non-AI lexical-overlap check between `value` and its own quote (previously described as "Option 3"/"A2") was identified as a possible defensive heuristic. **It is explicitly not proof of semantic entailment** — it would catch some but not all forms of unverified overreach (demonstrated concretely by the prior audit's Case 2: "We serve small businesses" → "primarily targets SMBs," where "primarily" is an addition a naive overlap check might not flag).
13. No mechanism in the repository distinguishes `companySummary`/`businessModel`'s competitive-intelligence exposure from the four already-private fields — the prompt's own framing ("for a freelancer deciding who to approach and what to offer") applies uniformly to all nine fields.

**NOT ESTABLISHED BY CURRENT REPOSITORY EVIDENCE:** whether any specific currently-stored `companySummary`/`businessModel` row (OBSERVED or INFERRED) would pass a semantic-entailment check if one existed; whether lexical-overlap heuristics would produce an acceptable false-accept/false-reject rate in practice; whether redistributing a verified-but-synthesized business description raises any source-licensing concern (flagged, not concluded, in the first Q5 audit — a legal question outside this document's authority).

---

## 4. Q5-A — Evidence Integrity

> "What minimum evidence standard must a generated `companySummary` or `businessModel` satisfy before it is eligible for cross-freelancer reuse?"

**A1 — `OBSERVED` + existing verified quote/source is sufficient.**
- *Evidence integrity:* Inherits the existing hard gate (fact 6/7 above) — the quote is guaranteed real and correctly sourced. The `value` sentence's fidelity to that quote is not separately checked.
- *False-claim risk:* Low for outright fabrication (structurally prevented); non-zero for the narrower overreach pattern in fact 12 (an unverified qualifier riding on a real quote).
- *Implementation complexity:* Lowest — a pure filter on the existing `classification` column.
- *AI cost:* None.
- *Scalability:* High.
- *Historical-data implications:* No backfill needed; applies identically to every existing row.

**A2 — `OBSERVED` + verified quote/source + a deterministic defensive check that the generated value is adequately grounded in its supporting quote.**
- *Evidence integrity:* Improves on A1 by narrowing (not eliminating) the overreach pattern in fact 12.
- **Required disclosure, per instruction:** this check is a **defensive heuristic**, not proof of semantic entailment; it must not be represented, in any UI, documentation, or downstream consumer, as a factuality proof; it is specified here as a **deterministic**, non-AI comparison (e.g., lexical/token overlap) and must not silently acquire a new LLM call as its implementation without a separate, explicit authorization for that AI cost.
- *False-claim risk:* Lower than A1, not zero — a heuristic check can both over-reject faithful paraphrases and under-reject subtle overreach (fact 12's own example).
- *Implementation complexity:* Medium — new comparison logic; no new external dependency if kept deterministic as specified.
- *AI cost:* None, as specified — would become non-zero only if a future implementer substitutes an LLM-based check, which this option does not authorize.
- *Scalability:* High (a deterministic string/token comparison is cheap).
- *Historical-data implications:* Could be applied at read time (no backfill) or via a one-time batch tagging pass (requires a separate design decision, not resolved here).

**A3 — Only directly source-derived/deterministically transformed facts are eligible; LLM-generated prose is never eligible.**
- *Evidence integrity:* Highest — by construction, nothing reused under this standard carries any LLM-synthesis risk, because nothing LLM-generated is reused at all.
- *False-claim risk:* Lowest — no generated prose participates.
- *Implementation complexity:* Lowest for this specific standard (no new check needed), but implies `companySummary`/`businessModel` as currently produced can **never** meet this standard — it would require an entirely different, non-AI producer (mirroring the existing `GOOGLE_PLACES_STATUS`/`PUBLIC_INTENT` precedent) if any public-fact content from this domain is ever wanted.
- *AI cost:* None.
- *Scalability:* High.
- *Historical-data implications:* None — no existing row of either field ever qualifies under this standard.

**A4 — No materially better option was identified from repository evidence.** The three options above span the realistic range this repository's actual mechanisms support (trust the existing gate as-is; add a bounded deterministic refinement; or exclude LLM-generated content from this standard entirely). No fourth, distinct, evidence-grounded standard was found; A4 is not populated.

## 5. Q5-B — Cross-Freelancer Sharing Policy

> "Even if the value is source-backed and sufficiently supported, should this LLM-generated summary/business-model interpretation be globally reusable across freelancers?"

This question is independent of Q5-A — a value can satisfy the strictest evidence standard (A2 or even a hypothetical stronger one) and still, as a matter of product/privacy policy, not be the kind of content the Product Owner wants shared.

**B1 — Allow global reuse whenever the Q5-A-selected evidence standard is satisfied; no additional gate.**
- *Privacy risk:* Depends entirely on which Q5-A option is chosen; under A1, carries the full residual risk from fact 12.
- *Competitive-intelligence risk:* Not mitigated by this option — satisfying an evidence standard says nothing about whether the synthesis itself constitutes the kind of research-angle content OQ-6 kept private in the other four fields (fact 11/13).
- *Product usefulness:* Highest — maximizes reuse, reduces duplicate AI spend across freelancers researching the same business.
- *Engineering complexity:* Lowest of the B options (no new gate beyond A's own filter).
- *AI cost:* None beyond whatever Q5-A already specifies.
- *Cross-freelancer reuse benefit:* Highest.
- *Historical-data implications:* Existing rows become eligible the moment they satisfy the selected evidence standard — no separate historical gate.

**B2 — Allow global reuse only after BOTH the evidence standard AND an explicit privacy/competitive-intelligence gate.**
- *Privacy risk:* Lower than B1 — adds a dedicated checkpoint for exactly the concern evidence integrity alone cannot resolve (fact 11).
- *Competitive-intelligence risk:* Directly addressed, to whatever degree the gate itself is designed to catch (the gate's own design — human review, a keyword/heuristic scan for outreach-angle language, a staged rollout — is not specified by this document and would need its own follow-up specification if B2 is selected).
- *Product usefulness:* Reduced relative to B1 by however much the gate delays or restricts reuse, but higher than B3 (some reuse still occurs).
- *Engineering complexity:* Higher — requires designing and building a gate that does not yet exist in any form.
- *AI cost:* Zero to non-zero depending entirely on how the gate is eventually designed (a keyword heuristic is free; a secondary classifier is not) — this document does not pre-select the gate's mechanism.
- *Cross-freelancer reuse benefit:* Moderate.
- *Historical-data implications:* Existing rows would need to pass both the evidence standard and the new gate — raises the same open design question as Q5-C below.

**B3 — Keep these LLM-generated fields freelancer-private; only deterministic/public factual evidence becomes global.**
- *Privacy risk:* Lowest — eliminates the concern entirely by not reusing this content.
- *Competitive-intelligence risk:* Eliminated, by construction.
- *Product usefulness:* Lowest of the three live options — no benefit from sharing this specific content; freelancers continue to pay for independent research on the same business.
- *Engineering complexity:* Lowest — no gate, no new producer needed for this decision alone (though a *separate* deterministic producer, mirroring `GOOGLE_PLACES_STATUS`, could independently supply some public facts about a business if the PO wants that benefit through a different mechanism — not something this option itself requires).
- *AI cost:* None.
- *Cross-freelancer reuse benefit:* None, for this content specifically.
- *Historical-data implications:* None — no existing row is ever affected.

**B4 — No materially better option was identified from repository evidence.** The realistic range — reuse once evidence-qualified (B1), reuse with an additional policy gate (B2), or never reuse this content (B3) — covers the decision space the repository and the prior audits' own analysis support. B4 is not populated.

## 6. Q5-C — Historical Values

> "If existing stored values do not satisfy the newly selected standard, what happens to them?"

**C1 — Leave historical values private permanently; they simply never qualify for reuse under whatever standard is selected.**
**C2 — Leave historical values private for now, with an explicit note that a future, separate PO decision may authorize a one-time re-evaluation pass against the newly selected standard.**
**C3 — Require future revalidation: historical values are only reused if and when they are independently re-checked against the selected Q5-A standard (e.g., a one-time batch pass), with no change to the research pipeline itself.**
**C4 — Never retroactively publish: regardless of C1/C2/C3, no historical value is ever exposed cross-freelancer without this specific, separate authorization having already been given — stated as a standing constraint, not a one-time choice, to make explicit that none of C1-C3 implicitly authorizes a backfill.**

No option above is selected or recommended as the single answer; C4 is better read as a constraint that applies regardless of which of C1-C3 is chosen, included because the instruction specifically warns against any option being read as implicit backfill authorization.

---

## 7. Analyst Recommendations

**Q5-A (evidence integrity): A2.** It directly narrows the one concrete, repository-confirmed gap (fact 12) using a deterministic, non-AI mechanism, consistent with the instruction to avoid introducing a new LLM call, human review step, or scoring model unless repository evidence demonstrates necessity — which it does, narrowly, for this specific gap, and no further. This recommendation carries forward unchanged from the prior evidence-sufficiency audit.

**Q5-B (sharing policy): B2.** This is offered cautiously, as the middle path, not as a confident pick — of the three, it is the only one that takes fact 11/13's competitive-intelligence concern seriously without foreclosing all reuse benefit outright (B3). It is explicitly **not** a confident recommendation in the way A2 is for Q5-A: unlike Q5-A, where the repository evidence points fairly clearly at a specific, scoped technical gap, Q5-B is a product/privacy trade-off (reuse benefit vs. competitive-fairness-to-the-researching-freelancer) that this document's evidence base does not resolve one way or the other. If the Product Owner weighs competitive-intelligence protection as the dominant concern, **B3 is equally well-supported by the evidence** and this recommendation should not be read as outweighing that judgment.

**Historical treatment: C2.** Consistent with every prior audit's instruction not to authorize backfill or retroactive publication — C2 keeps the door open for a future, explicitly separate decision without pre-authorizing anything now, which is the least committal, most reversible option among C1-C3, and is paired with C4's standing constraint regardless of which is chosen.

All three recommendations are kept separate from, and do not substitute for, the Product Owner's actual decisions in §9.

## 8. Implementation Impact

Impact is additive across whichever Q5-A/Q5-B/Q5-C combination is eventually selected — shown per area, not per full combination, since the combinations multiply quickly and most areas' impact is independent of the others selected:

| Area | If A1 | If A2 | If A3 | If B1 | If B2 | If B3 | If C2/C3 |
|---|---|---|---|---|---|---|---|
| Prompt | No change | No change | No change | — | — | — | — |
| Provenance (`provenance.ts`) | No change | No change (new check is separate from this file, per fact 12's framing) | No change | — | — | — | — |
| Generated-value validation | None added | New deterministic overlap check added, read-time or batch | N/A — generated values never participate | — | — | — | Revalidation logic needed only under C3 |
| `research_signals` schema | No change | No change, unless batch-tagging is chosen (new column) | No change | No change | No change | No change | A new "revalidated" marker only if C3 batch approach is chosen |
| Cache | No change | No change | No change | No change | No change | No change | No change |
| Entity public evidence (future layer) | Receives OBSERVED rows as-is | Receives only rows passing the overlap check | Never receives LLM-generated rows for these two fields | Receives rows once A-standard met | Receives rows only after passing an additional, not-yet-designed privacy gate | Never receives these two fields | — |
| Cross-freelancer read path | Built with A1's filter only | Built with A1 + A2's filter | Excludes these two fields entirely | No additional gate beyond evidence filter | Requires building the privacy/competitive-intelligence gate itself — a net-new design effort not specified here | Not built for these two fields | — |
| UI | None required | None required | None required | None required | Possibly a disclosure if the gate is partial/staged | None required | — |
| Historical data | No backfill | Backfill question open (batch vs. read-time) | N/A | Existing rows eligible immediately | Existing rows need the new gate too | N/A | C1: none; C2: none now; C3: one-time batch revalidation pass |
| Testing | Filter-exclusion tests only | Add overlap-check true/false-case tests (e.g., Case 1 vs. Case 2 from the prior audit) | Assert these fields never appear in any public-evidence path | Minimal | Needs tests for the new gate, once designed | Assert exclusion | Needs tests asserting historical rows are/aren't reused per the selected C option |

**Nothing in this table is implemented by this document.** Each cell describes what a future implementation would need to do if that specific option is selected — not an authorization to build any of it now.

## 9. Final PO Questionnaire

### Q5-A — Evidence Integrity

> "What minimum evidence standard must a generated `companySummary` or `businessModel` satisfy before it is eligible for cross-freelancer reuse?"

- **A** — `OBSERVED` + existing verified quote/source alone
- **B** — `OBSERVED` + verified quote/source + a deterministic defensive overlap check (heuristic only, not proof of entailment, no new LLM call without separate authorization)
- **C** — Only deterministic/non-AI-producer facts are eligible; LLM-generated prose is never eligible
- **D** — None of the above / other (specify)

PO selection: __________

### Q5-B — Sharing Policy

> "Once the evidence standard is satisfied, may generated `companySummary`/`businessModel` content be reused across freelancers?"

- **A** — Yes, automatically, once the Q5-A standard is met, no further gate
- **B** — Yes, but only after an additional, separately-designed privacy/competitive-intelligence gate
- **C** — No — keep these fields freelancer-private regardless of evidence standard; only deterministic/public evidence becomes global
- **D** — None of the above / other (specify)

PO selection: __________

### Q5-C — Historical Values

> "If existing stored values do not satisfy the newly selected standard, what happens to them?"

- **A** — Leave them private permanently
- **B** — Leave them private for now; revisit via a future, separate PO decision
- **C** — Require a one-time revalidation pass against the new standard before any of them become eligible
- **D** — None of the above / other (specify)

PO selection: __________

**Standing constraint, regardless of selection above:** no historical value is retroactively published or backfilled into any reuse path without a separate, explicit authorization beyond this questionnaire.

## 10. Status

**READ-ONLY PO DECISION PREPARATION.**
**NO PO DECISION MADE. NO CODE CHANGED. NO SCHEMA CHANGED. NO DATABASE CHANGED. NO MIGRATION CREATED. NO COMMIT. NO PUSH.**

OQ-6 and every other named governance record remain exactly as previously decided. No new repository investigation was performed for this document; all facts in §3 are carried forward from the two prior Q5 audits.
