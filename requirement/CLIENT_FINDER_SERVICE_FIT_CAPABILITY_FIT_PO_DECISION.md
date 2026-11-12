# Service Fit = Capability Fit — Product Owner Decision

**Decision ID:** CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.

## Relationship to existing records

This decision builds directly on `CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-
PO-DEC-001` (which placed subservice relevance inside Service Fit) by now
specifying what kind of fit Service Fit measures (capability-to-address,
not e.g. keyword-overlap-fit or price-fit). It does not reopen, reinterpret,
or rewrite `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`,
`CF-SERVICE-CATALOG-PO-DEC-001`, `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`,
the Category Plausibility governance
(`PATH_2_CATEGORY_PLAUSIBILITY_FINAL_DECISION_RECORD.md`, D0-D11), or the
Target Customer Match decision (`PDEF4-PCG4-PO-DEC-001`).

## Decision

SERVICE FIT = CAPABILITY FIT.

Service Fit asks whether the freelancer's selected top-level service,
considering all predefined subservices under it, can reasonably address
the identified need/opportunity. All predefined subservices are considered
internally; identifying the relevant subservice(s) is part of Service Fit,
not a sixth universal dimension. Need/Gap and Service Fit are conceptually
distinct questions.

This decision establishes Need/Gap and Service Fit as conceptually distinct
product dimensions; it does not claim that the current implementation
computes them as separate mechanisms.

Category Plausibility and Target Customer Match remain distinct from
Service Fit. The existing `serviceFit` scoring factor remains the current
quantitative representation/placeholder for this concept; its formula,
weight (15%), evidence, and thresholds remain unresolved and unauthorized.

## Non-scope

This decision does NOT:
- decide the `serviceFit` formula, weight, or thresholds;
- decide deterministic or AI signals used to evaluate capability fit;
- decide elimination, ranking, or Top-N behavior;
- decide evidence confidence or evidence freshness calculations;
- decide database representation;
- decide prompt or schema changes;
- decide the subservice-classification mechanism;
- decide UI or implementation architecture;
- authorize any code, configuration, schema, prompt, or data changes.

## Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation
of any kind.
