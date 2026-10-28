# Discovery-Quality Launch Gate — Product Owner Decision

**Decision ID:** CF-DISCOVERY-QUALITY-LAUNCH-GATE-PO-DEC-001
**Related decisions:** [CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md), [CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001](CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md), [CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md), [CF-UNIVERSAL-RANKING-SUPERSEDES-MVP-SCORING-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md), `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` (legacy, superseded-in-part — not reopened here), `CLIENT-FINDER-PDEF-4-LAUNCH-CRITERIA-PO-DEC-001` (`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`), `CLIENT-FINDER-PDEF-4-Q10-VALIDATION-METHOD-DEC-001` (`CLIENT_FINDER_PDEF_4_Q10_INDEPENDENT_VALIDATION_METHOD_DECISION.md`), `CLIENT-FINDER-PDEF-4-Q10-VALIDATOR-IDENTITY-DEC-001` (`CLIENT_FINDER_PDEF_4_Q10_VALIDATOR_IDENTITY_DECISION.md`), `PROJECT_MASTER_CHECKLIST.md` §3/§4.1 (PCG-1..6)
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle/product-requirement level. Establishes that a discovery-quality pre-production validation gate must exist for the generalized Client Finder, and states what that gate does and does not do. Does **not** define the gate's implementation architecture, its exact sample size, or its exact pass-rate threshold where no existing governance or engineering evidence already supplies one (see §5).

## 1. Context

The Client Finder is being generalized across the 17 top-level service families. Discovery quality — whether the
system actually surfaces opportunities a freelancer would find useful — has no dedicated pre-production release
gate today. Two existing governance layers are adjacent but distinct, and neither substitutes for this gate:

- **PCG-1..6** (`PROJECT_MASTER_CHECKLIST.md` §3; adopted and given launch-blocking status for PCG-1/2/3A/3B by
  `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`) measure commercial funnel behavior — visitor counts, buyer
  counts, conversion rates, refund rates, completion rates. They say nothing about whether an individual discovered
  opportunity is itself a useful, evidence-backed lead.
- **Q10 independent validation** (`CLIENT_FINDER_PDEF_4_Q10_INDEPENDENT_VALIDATION_METHOD_DECISION.md`,
  `CLIENT_FINDER_PDEF_4_Q10_VALIDATOR_IDENTITY_DECISION.md`) is an instrumentation-correctness check for the
  PCG-1/2/3A/3B measurement code itself (does the counting/aggregation logic match its documented semantics). It
  does not evaluate the substantive quality of what Discovery/Research/Opportunity actually produce.

Neither layer asks: "are the opportunities this system surfaces actually useful, per the product's own definition
of useful?" This record creates that missing gate.

## 2. Decision

1. The generalized Client Finder must have a **pre-production discovery-quality validation gate** before any new
   or materially changed service family is released.
2. The gate evaluates whether a **sample of discovered opportunities** is useful to the freelancer, against:
   - the universal five-dimension framework (`CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001`): Entity Reality,
     Current Activity, Need/Opportunity Gap, Service Fit/Capability Fit, Commercial/Contact Readiness; and
   - the Minimum Useful Lead Result fields (`CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`): entity, why found,
     supporting evidence, identified need/opportunity, potential service fit, relevant subservice(s), available
     contact info, missing information, source/date/provenance.
3. **This is a release-validation instrument operating on a sample of discovered opportunities pre-production, not
   a per-lead, user-facing score.** It produces a pass/fail (or pass/fail-with-findings) determination about
   release readiness for a given service family or product change. It does not produce, persist, or display any
   number, grade, rating, or label on an individual Opportunity to the freelancer. Nothing about this gate adds,
   reintroduces, or implies a per-lead scoring surface.
4. **Do not resurrect the old seven-factor, 100-point scoring model** (`prospectScore.ts`/`FACTOR_WEIGHTS`,
   `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`) as the basis for this gate, and do not reintroduce its
   per-lead `OpportunityScore` as a way of satisfying this gate. That model is superseded-in-part by
   `CF-UNIVERSAL-RANKING-SUPERSEDES-MVP-SCORING-PO-DEC-001` precisely on the point of a user-facing numeric score;
   this gate must not become a backdoor reintroduction of it.
5. **Do not create another user-facing ranking/quality score.** The gate's output is a release/QA artifact (a
   pass/fail determination plus findings, consumed by engineering/product/QA), not a new metric surfaced to
   freelancers or added to the ranked Opportunities list.
6. **The gate mechanism itself must not require paid LLM calls.** Evaluating whether a sampled opportunity
   satisfies the five dimensions and the MULR fields must be achievable by a human reviewer reading the
   already-persisted evidence (claims, signals, Opportunity record, Research output) against a checklist, and/or by
   deterministic, non-LLM structural checks (e.g., "is each MULR field present and non-empty," "is there at least
   one persisted claim supporting the Need/Opportunity Gap"). This does not bar engineering from separately
   proposing an LLM-assisted *authoring aid* for the checklist in a future, separately authorized engineering
   decision — but no such aid may be a precondition for running the gate, and the gate as decided here does not
   assume or require one.
7. **Q10 independent validation remains a separate prerequisite where applicable.** Q10 governs independent
   validation of PCG-1/2/3A/3B *instrumentation correctness*. This discovery-quality gate is a distinct
   prerequisite governing *content/evidence quality* of discovered opportunities. Passing one does not satisfy the
   other, and this record does not merge them. Where a future service-family launch depends on both, both must be
   satisfied independently.
8. **Do not implement anything yet.** This record authorizes no code, schema, test, prompt, provider, scraper,
   LLM call, or data change, and nothing arising from it has been committed or pushed.

## 3. Rationale

The product philosophy already recorded across the five-dimension and MULR decisions is "discover → preserve
evidence → contextualize → rank → show → freelancer decides" — the freelancer, not an opaque score, judges
usefulness. That philosophy has no corresponding check that the *product itself* reliably produces opportunities
meeting that bar before each new service family ships. Without a release-time check, a service family could launch
producing opportunities that are technically "discovered" (pass Discovery's existence/dedup criteria) but hollow
against the five-dimension framework or missing MULR fields — the two frameworks this project has already decided
define what "useful" means. A pre-production sample check closes that gap without inventing new product-facing
mechanics: it reuses frameworks already decided, and it operates before launch rather than after, consistent with
the existing PCG-1..6/Q10 pattern of validating readiness ahead of a launch decision rather than discovering
quality problems only after real users are exposed to them.

## 4. Relationship to existing decisions

- Builds directly on, and does not reopen or reinterpret, `CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001` and
  `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001` — this record only adds a release-gate use of those two existing
  frameworks; it does not alter either framework's content.
- Does not reopen `CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001` or
  `CF-UNIVERSAL-RANKING-SUPERSEDES-MVP-SCORING-PO-DEC-001`. It is consistent with both: it introduces no numeric
  weight, ranking formula, or user-facing score, and it reinforces (rather than undoes) the supersession of the
  legacy seven-factor model as a user-facing mechanism.
- Does not amend `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`; that file's historical record and its
  existing superseded-in-part notice are unaffected.
- Is complementary to, and does not alter any threshold, population, or window decided in,
  `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` (PCG-1..6 severity/lifecycle policy). PCG-1..6 remain
  commercial-funnel gates; this is a distinct, additional, content-quality gate. See §6 for the cross-reference
  notice added to that file.
- Is distinct from, and does not merge with or substitute for, Q10 independent validation
  (`CLIENT_FINDER_PDEF_4_Q10_INDEPENDENT_VALIDATION_METHOD_DECISION.md`,
  `CLIENT_FINDER_PDEF_4_Q10_VALIDATOR_IDENTITY_DECISION.md`), per §2 item 7.
- Does not alter `PROJECT_MASTER_CHECKLIST.md`'s PCG-1..6 figures or status; see §6 for the cross-reference
  notice added there.

## 5. Acceptance criteria / numeric thresholds — governance audit and decision

**Audit performed before recording:** `requirement/` was searched for "testing practices," "sample size," "pass
rate," "acceptance criteria," "% of leads," and "QA sample" to determine whether any existing governance record,
testing convention, or engineering evidence already supplies a numeric threshold this record could reuse, per the
instruction not to invent an arbitrary one.

**Findings:**

- **No existing governance record defines a sample size or pass-rate percentage for a content/evidence-quality
  check of discovered opportunities.** The closest numeric conventions found are PCG-1..6
  (`PROJECT_MASTER_CHECKLIST.md` §3; `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.3) — 500 qualified
  visitors, ≥50 buyers, ≥10%/≥5% conversion, ≥60% useful outcome, ≤8% refunds, ≥70% completion — but these measure
  **commercial funnel behavior over real paid traffic**, a different kind of measurement from a pre-production
  sample review of discovered-opportunity content quality. Reusing any of these figures for this gate would not be
  applying an established convention; it would be repurposing a number decided for an unrelated measurement. This
  record therefore does not reuse any PCG-1..6 figure as this gate's threshold.
- **Q10's validation method** (`CLIENT_FINDER_PDEF_4_Q10_INDEPENDENT_VALIDATION_METHOD_DECISION.md` §Q10-2) uses a
  "reproduces the existing 16/16 pass result, zero discrepancy" bar — but that is a deterministic, all-pass
  correctness bar for a fixed automated fixture suite checking instrumentation code, not a statistical pass-rate
  threshold for a sample of real, variable discovered-opportunity content. It is not transferable to this gate
  either.
- **The one directly relevant precedent found** is
  `requirement/PATH_2_CATEGORY_PLAUSIBILITY_D11_PRODUCT_DECISION.md` (§ "No document in this repository —
  including `MVP_REAL_USER_VALIDATION_TEMPLATE.md` itself — establishes a statistical minimum number of
  participants, searches, prospects, or sessions for any MVP validation gate... This document does not invent
  one."), which resolved the identical problem — a validation gate with no pre-existing statistical convention — by
  defining **categorical coverage requirements** (each relevant state/condition must appear at least once in the
  sample) rather than inventing a sample-size or pass-rate number. This is the established project convention for
  exactly this situation, and this record follows it rather than inventing a number.

**Decision:** No existing governance record, testing practice, or engineering evidence in this repository supplies
a numeric sample size or pass-rate threshold applicable to a discovery-quality content gate. Per instruction, this
record does **not** invent one. Instead:

- The gate's sample must achieve **categorical coverage**, not a statistical sample size: at minimum, the sample
  reviewed for a given service family must include at least one discovered opportunity exhibiting each of the five
  dimensions in a clearly-evidenced state and at least one exhibiting each dimension in a weak/absent state (so the
  review exercises the full range the framework is meant to distinguish), and every MULR field must be checked for
  presence/absence across the full sample, not merely spot-checked.
- The **exact numeric sample size, and any pass-rate percentage threshold** (e.g., "X% of sampled opportunities
  must satisfy all five dimensions" or "X% of MULR fields must be present"), **is left to be set from engineering
  evidence during implementation planning** — for example, once a pilot sample has been reviewed and its actual
  pass/fail variance observed, or once an engineering conformance audit (in the style of the K1 conformance audits
  already used elsewhere in this project) produces concrete evidence a threshold can be grounded in. Setting such a
  number now, with no pilot data or engineering evidence to ground it, would be exactly the kind of invented
  threshold this task was instructed to avoid.
- Any future record that does set a numeric sample size or pass-rate threshold for this gate must cite the
  engineering evidence or pilot data it is grounded in, consistent with how PCG-1..6's own thresholds are expected
  to be revisited only with supporting evidence (`CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` §6.5/§7 "Q5").

## 6. Cross-references to existing records

All records below were read in full (or by targeted section, where noted) before this decision was recorded, per
house convention:

- `CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md` (CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001)
- `CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md` (CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001)
- `CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md` (CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001)
- `CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md` (CF-UNIVERSAL-RANKING-SUPERSEDES-MVP-SCORING-PO-DEC-001)
- `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` (legacy; superseded-in-part notice confirmed present and
  unedited by this record)
- `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md` (CLIENT-FINDER-PDEF-4-LAUNCH-CRITERIA-PO-DEC-001) — a short,
  additive cross-reference notice has been appended to this file (see below); its substantive content is unedited.
- `CLIENT_FINDER_PDEF_4_Q10_INDEPENDENT_VALIDATION_METHOD_DECISION.md` (CLIENT-FINDER-PDEF-4-Q10-VALIDATION-METHOD-DEC-001)
- `CLIENT_FINDER_PDEF_4_Q10_VALIDATOR_IDENTITY_DECISION.md` (CLIENT-FINDER-PDEF-4-Q10-VALIDATOR-IDENTITY-DEC-001)
- `PROJECT_MASTER_CHECKLIST.md` §3 (PCG-1..6 proposed commercial gates) and §4.1 (PDEF workstream table) — a short,
  additive cross-reference notice has been appended to this file (see below); its substantive content is unedited.
  Note (observation, not corrected by this record): §3/§4.1 of that file still mark PDEF-3/PDEF-4 as
  PENDING/NOT STARTED, which appears stale relative to the now-DECIDED `CLIENT_FINDER_PDEF_3_COMPLETION_DECISION.md`
  and `CLIENT_FINDER_PDEF_4_LAUNCH_CRITERIA_DECISION.md`; reconciling that staleness is outside this task's scope
  and is not performed here.

## 7. Non-scope / explicit non-decisions

This record does **not** decide or authorize:

- Any numeric sample size or pass-rate threshold (see §5 — explicitly left open pending engineering evidence).
- Any implementation architecture for how the gate is run (manual checklist tool, script, dashboard, or otherwise).
- Any change to the five-dimension framework, the MULR field list, the universal ranking framework, or any
  existing scoring/ranking code.
- Any amendment to PCG-1..6's definitions, thresholds, or severity classification.
- Any resolution of Q10-1 (validator identity) or any other open Q10 item.
- Any code, configuration, schema, prompt, test, provider, scraper, LLM call, or data change.

## 8. Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation of any kind. No application code,
schema, prompt, test, configuration, provider, scraper, LLM call, or runtime behavior has been changed as part of
this decision. Nothing has been committed or pushed.
