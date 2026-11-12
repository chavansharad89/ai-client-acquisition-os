# Phase 7B — Subservice Relevance: Implementation, Mechanism, and Vocabulary Authorization — Product Owner Decision

**Decision ID:** CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001
**Related decisions:** [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) (17-family catalogue), [CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001](CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md) (item #6: relevant predefined subservice(s)), [CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001](CLIENT_FINDER_TOP_LEVEL_SERVICE_ONLY_SUBSERVICES_INTERNAL_PO_DECISION.md) (subservices internal, mechanism left undecided)
**Date:** 2026-10-16
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION AUTHORIZED (retroactively, for the implementation described below).
**Scope of this record:** This is the decision that the three related records above each explicitly withheld — none of them authorized implementation, and `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001` explicitly left the subservice-relevance *mechanism* undecided. This record closes that gap. It does not reopen, reinterpret, or change the 17-family catalogue, the top-level-service-only presentation rule, or any other previously settled rule.

## Background

A read-only completion audit of the Phase 7B implementation (already built, tested, and applied to the dev database — migration 0048, `serviceCatalog.ts`, `subserviceMatching.ts`, repository/UI wiring) found that the implementation was technically sound and passed all cited tests and real-PostgreSQL validation, but had no Product Owner authorization: `CF-SERVICE-CATALOG-PO-DEC-001`, `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001`, and `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001` each explicitly state implementation is **not** authorized, and the matching mechanism was explicitly left open. The audit also found that code and migration comments cited "governance" section numbers that do not exist in any PO decision document. A questionnaire was presented to the Product Owner covering exactly these gaps (D1–D7). This record memorializes the Product Owner's answers.

## D1 — Implementation authorization

**DECIDED: AUTHORIZED AS-IS.**

The Product Owner formally authorizes the existing Phase 7B implementation exactly as built and technically validated, including:
- a `relevantSubservices` field on Opportunity, persisted via migration 0048 as `relevant_subservices TEXT[] NOT NULL DEFAULT '{}'`;
- deterministic matching computed once at Opportunity-creation time;
- UI presentation of matched subservices on the Opportunity detail page;
- no effect on eligibility;
- no effect on ranking/scoring;
- no additional AI/LLM call.

## D2 — Matching mechanism

**DECIDED: APPROVED AS PROPOSED.**

The deterministic matching mechanism is approved exactly as implemented:
- matches only against the predefined subservices of the freelancer's single selected top-level service — no cross-family matching;
- uses only non-`UNKNOWN`-classified Research signals as evidence;
- uses only these six Research fields as evidence sources: `visibleProblems`, `growthOpportunities`, `aiOpportunities`, `websiteIssues`, `contentOpportunities`, `automationOpportunities` — all other fields, including topical/state fields (`companySummary`, `businessModel`, `targetCustomers`), are excluded;
- matches exact catalogue vocabulary only, subject only to the variants approved in D3–D5 below;
- applies no synonym dictionary of any kind;
- allows multiple matching subservices on one Opportunity;
- stores matches as one `TEXT[]` field on the existing Opportunity row — never a separate table, never a separate Opportunity per subservice;
- is presentation/supporting information only;
- must not affect eligibility, ranking, elimination, or AI-escalation admission;
- introduces no additional AI/LLM call.

## D3 — Generic bare-word exclusions

**DECIDED: APPROVED, EXACT LIST.**

The following catalogue subservice names are excluded from ever being matched as bare single words:

- Research
- Editing
- Consulting
- Naming
- Positioning
- Illustration
- Visualization
- Animation

These subservices can never be produced by the matcher, since no other approved literal form exists for them under this decision.

## D4 — Slash-split decomposition rules

**DECIDED: APPROVED, EXACT SIX MAPPINGS.**

| Catalogue term | Matches |
|---|---|
| API development/integration | "API development" OR "API integration" |
| RAG/knowledge-base systems | "RAG" OR "knowledge-base systems" |
| Excel/Google Sheets | "Excel" OR "Google Sheets" |
| HR/recruitment | "HR" OR "recruitment" |
| Resume/CV writing | "Resume writing" OR "CV writing" |
| Video subtitles/captions | "Video subtitles" OR "Video captions" |

No other "/"-containing catalogue name is decomposed under this decision.

## D5 — Spelling variants

**DECIDED: APPROVED, EXACT TWO VARIANTS.**

| Catalogue spelling | Also matches |
|---|---|
| modelling | modeling |
| voice-over | voiceover |

**Explicit non-decision (per directive accompanying D3–D5):** These three approvals (D3, D4, D5) do **not** authorize a general synonym dictionary or any broader synonym mechanism. Any future expansion of matchable vocabulary beyond the exact lists above requires its own separate PO decision.

## D6 — Governance documentation correction

**DECIDED: AUTHORIZED.**

The Product Owner authorizes:
1. This record itself, which supersedes the "implementation not authorized" / "mechanism undecided" status of the three related records above, for the specific scope of Phase 7B subservice relevance only (those records' other content is unaffected — see the forward cross-references added to each).
2. Correction of code/migration comments that cited non-existent "governance §X" section numbers, so they cite this decision (`CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001`) instead. No unrelated documentation or code changes are authorized by this item.

## D7 — Formal Phase 7B closure

**DECIDED: CLOSED**, effective 2026-10-16, now that D1–D6 are recorded in this document.

**Phase 7B (MULR item 6 — relevant predefined subservices) is formally CLOSED.**

## Mandatory boundaries on this decision

1. This decision authorizes exactly the implementation, mechanism, and vocabulary described in D1–D5 above, as already built. It does not authorize any different or expanded behavior.
2. This decision does not change the 17-family catalogue, its subservice enumeration, or the top-level-service-only result-presentation rule.
3. This decision does not authorize a general synonym system (see D3–D5 non-decision above).
4. This decision does not authorize any Phase 8 (service-family signal expansion) work.
5. Any future change to the matching mechanism, the bare-word exclusion list, the slash-split list, or the spelling-variant list requires its own separate PO decision.

## Implementation authorization status

**AUTHORIZED**, retroactively, for the implementation already built and validated as of this date. No new code, migration, or schema change is made by recording this decision itself.
