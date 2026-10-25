# CLIENT FINDER — CROSS-SERVICE EVIDENCE APPLICABILITY — PRODUCT OWNER DECISION

**Decision ID:** CF-CROSS-SERVICE-EVIDENCE-APPLICABILITY-PO-DEC-001
**Related decisions:** [CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001](CLIENT_FINDER_SINGLE_SERVICE_PER_SEARCH_PO_DECISION.md) (one service per search), [CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) (same-freelancer evidence reuse + cache-first principle), [CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_CROSS_FREELANCER_PUBLIC_EVIDENCE_REUSE_PO_DECISION.md) (cross-freelancer public evidence reuse), [CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001](CLIENT_FINDER_SIGNAL_SPECIFIC_FRESHNESS_PO_DECISION.md) (signal-specific/service-aware freshness), [CF-DISCOVERY-ARCH-002 Item #11](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md#11-whether-deterministic-filtering-happens-per-search-or-globally), [CF-DISCOVERY-ARCH-002 Item #13](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md#13-caching-policy-where-it-materially-changes-product-behavior)
**Decision title:** Factual evidence may be reused across different top-level service searches when sufficiently fresh, but the shared factual pool does not imply shared opportunity evaluation; each selected top-level service independently determines applicability, signal production, weighting, ranking, and AI qualification need
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Governance-only, principle level. Decides that a factual evidence pool may be shared across different top-level service searches subject to freshness, while every service-specific determination downstream of that evidence remains independent per service. Does **not** define exact evidence-applicability rules, cache keys, TTL values, storage, or invalidation — all remain OPEN.

## Context

`CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001` established that every Client Finder search has exactly one authoritative top-level service context, and that sub-services remain internal supporting metadata. `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` established that a freelancer may reuse their own factual evidence about a business across their own different searches and selected services, while service-specific opportunity evaluation always remains separate per search/service — illustrated there by the example of a freelancer searching Web & Software Development then later Video & Reels for the same business. `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001` extended the factual-evidence-reuse principle across freelancers for the public, non-owner-specific subset of evidence. `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001` established that freshness governing such reuse is signal-specific and may vary by selected top-level service where relevant.

The PO has now decided the remaining, cross-service dimension directly: factual evidence may be shared across different top-level service searches (subject to freshness), but this sharing is strictly limited to the factual evidence pool — it does not extend to, and must not be confused with, the opportunity evaluation each service independently produces from that evidence.

## PO decision

**Factual evidence MAY be reused across different top-level service searches when sufficiently fresh. The shared factual evidence pool does NOT imply shared opportunity evaluation. Each selected top-level service independently determines evidence applicability, the deterministic signal it produces, how much that signal matters, how it affects ranking, and whether additional AI research/qualification is needed. A result/evaluation from one service must NOT automatically become a result/evaluation for another service.**

1. Factual evidence may be reused across different top-level service searches when sufficiently fresh.
2. The shared factual evidence pool does NOT imply shared opportunity evaluation.
3. Each selected top-level service independently determines whether evidence is applicable to it.
4. Each selected top-level service independently determines what deterministic signal that evidence produces for it.
5. Each selected top-level service independently determines how much the signal matters (weighting) for it.
6. Each selected top-level service independently determines how the signal affects ranking for it.
7. Each selected top-level service independently determines whether additional AI research/qualification is needed for it.
8. A result/evaluation from one service must NOT automatically become a result/evaluation for another service.
9. Service-specific deterministic signals remain service-specific.
10. Service-specific weights remain service-specific.
11. Service-specific ranking remains service-specific.
12. AI research/qualification remains service-specific.
13. Final opportunity evaluation remains service-specific.

## Exact authoritative wording

> Factual evidence may be reused across different top-level service searches when sufficiently fresh.
>
> The shared factual evidence pool does NOT imply shared opportunity evaluation.
>
> Each selected top-level service independently determines: whether evidence is applicable; what deterministic signal it produces; how much the signal matters; how it affects ranking; whether additional AI research/qualification is needed.
>
> A result/evaluation from one service must NOT automatically become a result/evaluation for another service.
>
> Service-specific deterministic signals remain service-specific.
>
> Service-specific weights remain service-specific.
>
> Service-specific ranking remains service-specific.
>
> AI research/qualification remains service-specific.
>
> Final opportunity evaluation remains service-specific.
>
> Exact evidence-applicability rules remain OPEN.
>
> Exact cache keys/TTL/storage/invalidation remain OPEN.

## Governance clarification — relationship to existing records

- This record is consistent with `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`: it does not alter the rule that every search has exactly one authoritative service context, and it does not reintroduce combined multi-service evaluation within a search.
- This record extends the principle already established by `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` (factual evidence reusable across a freelancer's own services, opportunity evaluation never carried over between services) and by `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001` (public factual evidence reusable across freelancers) by stating the same separation explicitly along the cross-service axis: the evidence pool may be shared across services, but applicability, signal production, weighting, ranking, and AI-qualification need are determined independently per service, and no service's evaluation is ever substituted for another's.
- This record is consistent with `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`: freshness governing cross-service evidence reuse may vary by service where relevant, and freshness alone never causes one service's evaluation to become another's.
- This record does not rewrite, reinterpret, or modify any of the above records; it is a later, consistent clarification of the cross-service dimension none of them fully resolved on its own.
- This record does not resolve, close, or answer any other questionnaire item other than the cross-service-applicability clarification described above; Item #11's and Item #13's remaining mechanics-level questions stay open.

## Mandatory boundaries on this decision

1. This is a governance/product-policy decision only, at the principle level.
2. No code, configuration, `.env`, database schema, or data change is authorized by this decision.
3. No evidence-applicability rule, cache key, TTL value, storage mechanism, invalidation rule, signal scoring rule, weight, threshold, ranking algorithm, AI-escalation mechanism, provider/model selection, or cost policy is authorized, defined, or changed by this decision.
4. This decision does not modify, reinterpret, or reopen `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001`, `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`, `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`, or `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`.
5. This decision does not authorize treating any service's opportunity evaluation, score, rank, or AI-generated qualification as another service's result under any circumstance.
6. This decision does not resolve, close, or answer any other open questionnaire item other than the cross-service-applicability clarification described above.

## Explicit non-decisions

This record does **not** decide or authorize:

- Exact evidence-applicability rules (how a service determines whether a given piece of factual evidence applies to it).
- Exact cache keys, TTL values, storage architecture, or invalidation rules for cross-service-shared evidence.
- Signal scoring, weights, or thresholds for any service.
- Ranking algorithms.
- AI-escalation mechanisms or boundaries.
- Provider/model selection or cost policy.
- Any sharing of opportunity evaluations, scores, rankings, or AI-generated qualification/conclusions between services.
- Any technical implementation, code, configuration, schema, or data change.

## Consequences

- A future engineering/PO pass defining evidence-applicability rules, cache keys, TTL, storage, and invalidation must preserve strict separation between the shared factual-evidence pool and each service's independently computed opportunity evaluation.
- No implementation may reuse one service's deterministic signal, weighting, ranking, AI-qualification outcome, or final opportunity evaluation as another service's result.
- No engineering work is authorized by this record; it only establishes the product policy that a future cross-service evidence-applicability mechanics decision must honor.

## What remains to be decided

- Exact evidence-applicability rules per service.
- Exact cache keys/TTL/storage/invalidation for cross-service-shared evidence.
- Signal scoring, weights, thresholds, ranking, and AI-escalation mechanics per service.
- Provider/model selection and cost policy.
- All other questionnaire items remain open, unaffected by this decision except for the cross-service-applicability clarification recorded above.

## Cross-reference / reconciliation notice (added 2026-10-12)

[CF-EVIDENCE-DELETION-SUPPRESSION-PO-DEC-001](CLIENT_FINDER_EVIDENCE_DELETION_SUPPRESSION_PO_DECISION.md) decides that a freelancer may request an opportunity/evidence be removed from their own view (per-owner view suppression, not global deletion of the shared factual evidence pool). This record's cross-service evidence-applicability principle is preserved unchanged; it is not reopened, reinterpreted, or modified by that later record.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED.** No code, configuration, `.env`, database schema, or data has been changed. Nothing has been committed or pushed.
