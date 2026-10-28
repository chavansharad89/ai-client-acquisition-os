# Top-Level Service Only; Subservices Internal — Product Owner Decision

**Decision ID:** CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.

## Relationship to existing records

This decision clarifies and extends `CF-SERVICE-CATALOG-PO-DEC-001` and
`CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`, both already in force. It does not
reopen, reinterpret, or rewrite either record. Where this decision restates
prior rules, the prior records remain the authoritative source; where it adds
new rules, they are enumerated below as new.

Restated (already decided, unchanged):
1. The freelancer selects exactly one top-level service per search.
2. The freelancer is not asked to select a subservice.
4. Subservices are an internal intelligence/evaluation layer, not a
   user-facing search-selection requirement.
7. The search scope is the selected top-level service; the system does not
   perform independent user-selected subservice searches.
9. The existing predefined subservice taxonomy is reused; no new subservice
   taxonomy is created by this decision.

New in this decision:
3. Once the top-level service is selected, the system automatically
   considers ALL predefined subservices belonging to that top-level service.
5. Subservices are used internally to: understand relevant opportunity
   types; evaluate Service Fit; identify which subservice(s) are relevant to
   a discovered opportunity; classify the opportunity; support offer
   recommendation/personalization.
6. A business/entity must NOT be duplicated merely because it is relevant to
   multiple subservices.
8. A final opportunity may internally identify one or more relevant
   subservices; this does not change the selected top-level service.

## Terminology note

The term "Service Fit" as used in rule #5 above (internal subservice-relevance
evaluation) is NOT the same mechanism as the `serviceFit` scoring factor in
the PRD's seven-factor opportunity-scoring model (15% weight). The two usages
currently co-exist under the same name with different meanings. This decision
does not resolve whether they should be merged, renamed, or kept distinct —
that is an open follow-up PO decision (see governance audit dated 2026-10-12).

**Resolved:** this open question has been resolved by
`CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001`.

## Relationship to the universal framework

The top-level service determines search scope. Predefined subservices under
that service provide internal, service-specific context feeding the
Service-Fit dimension of the five-dimension framework (Entity Reality,
Current Activity, Observable Need/Gap, Service Fit, Commercial/Contact
Readiness). Evidence Confidence and Evidence Freshness remain cross-cutting
modifiers, not separate dimensions. This decision does not resolve open gaps
in the Entity Reality or Service Fit dimensions identified by the prior
Universal-Framework governance audit.

**Formalized:** this informal reference to the five-dimension framework is
now the subject of its own governance record,
`CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001`
(`CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md`), which
also records `CF-ENTITY-REALITY-ELIGIBILITY-PO-DEC-001` and
`CF-CURRENT-ACTIVITY-CONTEXTUAL-EVIDENCE-PO-DEC-001` as the first decisions
to own the Entity Reality and Current Activity dimensions, and
`CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001` for the
Commercial/Contact Readiness dimension. This paragraph does not rewrite or
reinterpret the rest of this decision.

## Non-scope

This decision does NOT:
- authorize any code, configuration, schema, or data changes;
- decide the mechanism by which the system determines subservice relevance;
- decide weights, thresholds, or scoring formulas;
- resolve the "Service Fit" terminology question above;
- change the 17-family catalogue or any subservice list;
- change discovery, research, or qualification behavior.

## Forward cross-reference (added 2026-10-16)

The mechanism question left open in the Non-scope section above ("the
mechanism by which the system determines subservice relevance") has been
resolved by `CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001`
(`CLIENT_FINDER_PHASE_7B_SUBSERVICE_RELEVANCE_AUTHORIZATION_PO_DECISION.md`),
which also authorizes implementation of that mechanism for the purpose of
populating `CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001` item #6. This
paragraph does not rewrite or reinterpret the rest of this decision; the
17-family catalogue, the single-top-level-service-per-search rule, and
every other rule recorded above remain unchanged.

## Implementation authorization status

NOT AUTHORIZED for this record's own content (rules 1–9 above), except that
the subservice-relevance mechanism and its implementation are now
authorized by `CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001`
(see forward cross-reference above). Recording and auditing this decision
does not itself authorize any other implementation.
