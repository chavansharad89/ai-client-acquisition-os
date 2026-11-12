# CLIENT FINDER — NEED / OPPORTUNITY GAP IS SERVICE-INDEPENDENT — PRODUCT OWNER DECISION

**Decision ID:** CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001
**Related decisions:** [CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001](CLIENT_FINDER_SERVICE_FIT_CAPABILITY_FIT_PO_DECISION.md) (Service Fit = Capability Fit), [CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001](CLIENT_FINDER_TOP_LEVEL_SERVICE_ONLY_SUBSERVICES_INTERNAL_PO_DECISION.md) (top-level service only; subservices internal), [CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001](CLIENT_FINDER_SINGLE_SERVICE_PER_SEARCH_PO_DECISION.md) (one authoritative top-level service per search)
**Decision title:** Need/Opportunity Gap is evaluated independently of the freelancer's selected top-level service; the selected service is applied afterward, through Service Fit = Capability Fit
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle level. Does **not** define Need/Gap scoring, confidence formulas, evidence weights, thresholds, ranking formulas, elimination rules, or implementation architecture. Does **not** reopen, reinterpret, or rewrite `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001`, `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`, or `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`.

## Decision

NEED / OPPORTUNITY GAP IS SERVICE-INDEPENDENT.

The system should first identify whether an entity shows a credible problem,
unmet requirement, change, need, or opportunity. The freelancer's selected
top-level service must not determine whether a Need/Opportunity Gap exists.

The selected top-level service is applied later, through
`CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001` ("Service Fit = Capability
Fit"), which determines whether the selected service can reasonably
address the identified need/opportunity.

## Evidence principle

Need/Opportunity Gap may be supported by:

- explicit stated intent;
- explicit requirements/requests;
- observable deficiencies or gaps;
- business events or changes; and
- multiple relevant, mutually reinforcing evidence items.

Multiple relevant evidence items must still be considered even when no
individual evidence item independently proves the need. An explicit "I
need a freelancer/service" statement is not required.

At the same time, absence of evidence must not automatically be treated as
proof of a need. For example, "no website found" must not automatically
become "the business needs a website."

## Product philosophy / result presentation

This decision does not introduce a complex Need/Gap scoring or confidence
system.

The product should prioritize: find evidence → show the evidence and the
potential opportunity to the freelancer → let the freelancer decide
whether it is relevant. The system should provide enough evidence/context
for the freelancer to make that judgment, rather than claiming the system
can determine with certainty that an entity will buy.

This decision therefore does NOT establish:

- numeric Need/Gap scores;
- confidence formulas;
- evidence weights;
- universal thresholds;
- AI confidence values;
- qualification thresholds;
- ranking formulas;
- elimination rules; or
- implementation architecture.

Those remain separate future decisions if actual product usage demonstrates
that they are necessary.

## Relationship to existing decisions

This decision preserves and is consistent with:

- `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001` — Service Fit asks whether the
  freelancer's selected top-level service, considering its predefined
  subservices internally, can reasonably address an identified need or
  opportunity. Need/Opportunity Gap, defined by this decision, asks the
  prior and distinct question: whether there is a credible underlying
  problem, requirement, change, need, or opportunity at all, independent
  of any particular service.
- `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001` — unchanged;
  predefined subservices remain internal, service-specific context that
  feeds Service Fit, not Need/Opportunity Gap.
- `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001` — unchanged; each search still
  carries exactly one authoritative top-level service context. This
  decision does not alter when or how that service is selected — only
  that Need/Opportunity Gap must be evaluated without that service
  determining whether a gap exists.

This decision does not rewrite, reinterpret, or supersede any of the above
records.

## Mandatory boundaries on this decision

1. This is a governance/product-scope decision only, at the principle
   level.
2. No application code, schema, prompt, scoring, threshold, test,
   configuration, or runtime behavior is modified, authorized, or changed
   by this decision.
3. No Need/Gap scoring, confidence formula, evidence weight, universal
   threshold, AI confidence value, qualification threshold, ranking
   formula, elimination rule, or implementation architecture is decided or
   authorized by this decision.
4. This decision does not reopen, reinterpret, or rewrite
   `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001`,
   `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`, or
   `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`.

## Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation
of any kind. No code, configuration, schema, prompt, test, or data has
been changed. Nothing has been committed or pushed.
