# Service Fit / Subservice Relevance Unification — Product Owner Decision

**Decision ID:** CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.

## Relationship to existing records

This decision resolves the open terminology question recorded by
`CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`'s Terminology
Note: whether the "Service Fit" named by that decision's rule #5 (internal
subservice-relevance evaluation) and the `serviceFit` scoring factor in the
PRD's seven-factor opportunity-scoring model (15% weight) should be merged,
renamed, or kept distinct. It does not reopen, reinterpret, or rewrite that
decision, `CF-SERVICE-CATALOG-PO-DEC-001`, or `CF-SINGLE-SERVICE-PER-SEARCH-
PO-DEC-001`. It does not reopen, reinterpret, or rewrite the Category
Plausibility governance (`PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md`,
D0-D11) or the Target Customer Match decision (`PDEF4-PCG4-PO-DEC-001`) —
those remain the authoritative, separately-defined concepts they already
are, and this decision does not collapse them into Service Fit.

## Decision

INTERNAL SUBSERVICE RELEVANCE IS PART OF THE SERVICE FIT CONCEPT.

The existing `serviceFit` scoring concept and the internal subservice-
relevance concept named by `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-
PO-DEC-001` are the SAME underlying product concept, not two unrelated
concepts.

Meaning:

1. The freelancer selects exactly ONE top-level service per search
   (restated, unchanged — `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`).
2. The system automatically considers ALL predefined subservices belonging
   to that selected top-level service (restated, unchanged —
   `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001` rule #3).
3. The system may identify one or more relevant subservices for a
   discovered opportunity.
4. Identifying which subservice(s) are relevant is part of evaluating the
   opportunity's Service Fit.
5. Service Fit therefore represents how well the discovered opportunity
   fits what the freelancer offers within the selected top-level service
   and its predefined subservices.
6. The existing `serviceFit` scoring factor is the current quantitative
   representation/placeholder for this concept, pending the separate
   PO/engineering decisions governing its formula, evidence, and weight.
   **Note:** Service Fit's specific definition — capability to reasonably
   address the identified need/opportunity — is recorded separately in
   `CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001`.
7. Subservice relevance should provide service-specific context/evidence
   for the Service Fit evaluation rather than being treated as an
   unrelated scoring dimension.
8. The final opportunity may identify the relevant subservice(s), but the
   authoritative search context remains the single selected top-level
   service (restated, unchanged — `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-
   INTERNAL-PO-DEC-001` rule #8).
9. This does NOT mean that the current `serviceFit` formula, weight, or
   implementation is automatically correct for the new architecture.
10. This decision does NOT authorize implementation.

## Terminology note — status

The co-existence of two "Service Fit" usages under the same name, flagged
as unresolved by `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`'s
own Terminology Note, is resolved by this decision: they are the same
concept at different levels — Service Fit is the product concept;
`serviceFit` is its current scoring-factor representation, per rule #6
above.

## Relationship to the universal framework

Unchanged from `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`:
predefined subservices under the selected top-level service provide
internal, service-specific context feeding the Service-Fit dimension of
the five-dimension framework (Entity Reality, Current Activity, Observable
Need/Gap, Service Fit, Commercial/Contact Readiness). Evidence Confidence
and Evidence Freshness remain cross-cutting modifiers, not separate
dimensions. This decision does not resolve open gaps in any other
dimension.

## Relationship to Category Plausibility and Target Customer Match

Not altered by this decision. Category Plausibility (Research/Qualification-
owned gate determining whether a discovered business plausibly belongs to
one of the freelancer's stated target-customer segments) and Target
Customer Match (`PDEF4-PCG4-PO-DEC-001`, whether the specific Opportunity's
Prospect was observed to be the kind of customer the Search's
`targetCustomer` criterion configured) remain distinct, separately-governed
concepts. Target Customer Match's own governing text already excludes
"service match... or category plausibility" from its definition; this
decision does not change that boundary. This decision concerns only the
relationship between internal subservice relevance and Service Fit/
`serviceFit`.

## Non-scope

This decision does NOT:
- decide the `serviceFit` formula, weight, thresholds, deterministic
  signals, or AI signals;
- decide whether Service Fit (with subservice relevance folded in)
  participates in elimination, ranking, or both;
- decide how multiple relevant subservices on one opportunity are
  represented;
- authorize any code, configuration, schema, prompt, or data changes;
- change the 17-family catalogue or any subservice list;
- change discovery, research, or qualification behavior;
- alter Category Plausibility or Target Customer Match governance in any
  way.

## Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation
of any kind.
