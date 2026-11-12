# CLIENT FINDER — SAME-FREELANCER EVIDENCE REUSE — PRODUCT OWNER DECISION

**Decision ID:** CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001
**Related decisions:** [CF-DISCOVERY-ARCH-002 Item #11](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md#11-whether-deterministic-filtering-happens-per-search-or-globally) (per-search vs. global evaluation reuse — the item this record partially resolves), [CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001](CLIENT_FINDER_SINGLE_SERVICE_PER_SEARCH_PO_DECISION.md) (one service per search), [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) (17-family service catalogue), [CF-DISCOVERY-ARCH-002-Q1..Q6/S5/S6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md) (deterministic opportunity signals), [CF-DISCOVERY-ARCH-002 Item #9](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_9_STRONG_SIGNAL_BYPASS_PRINCIPLE_PO_DECISION.md) (strong-signal bypass principle)
**Decision title:** A freelancer may reuse their own previously collected factual evidence about a business across their own different searches/services; service-specific opportunity evaluation remains separate per search/service
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Governance-only. Decides the **same-freelancer (same-owner)** dimension of questionnaire Item #11 only, plus (via the 2026-10-11 addendum below) the cache-first architectural principle. Does **not** decide the cross-freelancer/global dimension of Item #11, which remains open. Does **not** define freshness/TTL values, caching implementation, evidence storage architecture, signal scoring, ranking, thresholds, AI escalation, provider/model selection, or cost policy. Does **not** modify any existing Q1–Q6, S5, S6, or Item #9 decision.

## Context

Questionnaire Item #11 (`CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md`) asks whether a candidate's deterministic evaluation is computed fresh per search or reused across searches — "potentially across different owners/users." `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001` resolved the within-one-search multi-service question but explicitly left Item #11's across-search reuse question untouched for both same-owner and cross-owner cases.

The PO has now decided the narrower, same-owner slice of Item #11: whether one freelancer may reuse their own previously collected factual evidence about a business when that same business resurfaces in a later search of theirs, possibly for a different selected service.

Example: a freelancer searches **Web & Software Development → Restaurant → Mumbai**, then later searches **Video & Reels → Restaurant → Mumbai** and the same restaurant resurfaces. Previously collected factual evidence about the restaurant may be reused where still applicable and fresh. The web-development opportunity evaluation does not thereby become the Video & Reels opportunity evaluation — each service's opportunity evaluation remains its own, separately computed, result.

## PO decision

**A freelancer may reuse their own previously collected, still-applicable, still-fresh factual evidence about a business across their own different Client Finder searches and selected services. Service-specific opportunity evaluation remains separate per search/service and is never satisfied by reusing another service's evaluation result.**

1. A freelancer MAY reuse previously collected factual evidence about a business across that freelancer's own different Client Finder searches and selected services, provided the evidence is still applicable and sufficiently fresh.
2. Reusable factual evidence is limited to previously collected business facts/observations that are legitimately reusable across searches (e.g. observations about the business itself, not a service-specific opportunity conclusion).
3. Service-specific opportunity evaluation MUST remain separate for each Client Finder search / selected top-level service.
4. A previous service-specific opportunity evaluation MUST NOT simply be reused as the opportunity result for another service.
5. Service-specific signals must be evaluated in the context of the selected service; service-specific ranking remains separate; final opportunity determination remains separate per service/search.
6. This decision applies only to reuse by the SAME freelancer/owner across their own searches.
7. This decision does NOT authorize sharing owner-specific research/evidence with other freelancers.
8. Cross-freelancer/shared evidence remains a separate, future governance question — not decided here, not authorized here.

## Exact authoritative wording

> A freelancer MAY reuse previously collected factual evidence about a business across that freelancer's different Client Finder searches and selected services, provided the evidence is still applicable and sufficiently fresh.
>
> Reusable factual evidence may include previously collected business facts/observations that are legitimately reusable across searches.
>
> Service-specific opportunity evaluation MUST remain separate for each Client Finder search / selected top-level service.
>
> A previous service-specific opportunity evaluation MUST NOT simply be reused as the opportunity result for another service.
>
> Web-development opportunity evaluation is not automatically the Video & Reels evaluation. Service-specific signals must be evaluated in the context of the selected service. Service-specific ranking remains separate. Final opportunity determination remains separate per service/search.
>
> This decision applies to reuse by the SAME freelancer/owner.
>
> This decision does NOT authorize sharing owner-specific research/evidence with other freelancers.
>
> Cross-freelancer/shared evidence remains a separate future governance question.
>
> This decision does NOT define exact freshness/TTL values, caching implementation, evidence storage architecture, signal scoring, ranking, thresholds, AI escalation, provider/model selection, or cost policy. Those remain separate decisions.
>
> This decision does NOT modify any existing Q1–Q6, S5, S6, or Item #9 decision.
>
> This decision does NOT authorize implementation.

## Governance clarification — relationship to questionnaire Item #11

This is a partial resolution, not a full resolution, of Item #11:

- Item #11 asks whether evaluation is computed fresh per search or reused across searches, "potentially across different owners/users." This decision resolves only the **same-owner** half of that question: **YES**, a freelancer may reuse their own previously collected factual evidence across their own searches, subject to freshness/applicability.
- This decision does **not** resolve the cross-owner/global half of Item #11 — whether evidence may be reused across different freelancers' searches for the same business. That remains exactly as open as before, and is explicitly named a separate future governance question (see "What remains to be decided" below).
- This decision distinguishes between **factual evidence about a business** (reusable, subject to freshness) and **service-specific opportunity evaluation** (never reusable across services/searches as a substitute result). Item #11's question about reusing "a candidate's deterministic evaluation (presence/reachability/signal checks, and any derived score or rank)" is narrowed by this decision: the underlying factual signal checks may be reused where fresh and applicable, but any derived score, rank, or opportunity conclusion remains service-specific and is not carried over.
- This decision does not resolve items #12 (evidence persistence), #13 (caching policy/staleness ceiling), #3 (final signal set), or any other questionnaire item. Those remain exactly as open as they were, and §8 of this record notes that exact freshness/TTL values and storage architecture are explicitly out of scope here.

## Mandatory boundaries on this decision

1. This is a governance/product-policy decision only.
2. No code, configuration, `.env`, database schema, or data change is authorized by this decision.
3. No freshness/TTL value, caching mechanism, evidence storage architecture, signal scoring rule, weight, threshold, ranking algorithm, AI-escalation mechanism, provider/model selection, or cost policy is authorized, defined, or changed by this decision.
4. This decision does not modify, reinterpret, or reopen any existing Q1–Q6, S5, S6, or Item #9 decision.
5. This decision does not resolve, close, or answer any other open item in `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` other than the same-owner slice of Item #11 described above. All other items, and the cross-owner slice of Item #11 itself, remain exactly as open as they were before this record.
6. This decision does not authorize sharing owner-specific research/evidence with other freelancers under any circumstance.

## Explicit non-decisions

This record does **not** decide or authorize:

- Exact freshness/TTL values for any category of reusable factual evidence.
- Caching implementation or mechanism.
- Evidence storage architecture (schema, tables, ownership model).
- Signal scoring, weights, or thresholds.
- Ranking algorithms.
- AI-escalation mechanisms or boundaries.
- Provider/model selection.
- Cost policy.
- Whether or how evidence may ever be reused or shared across different freelancers/owners (cross-freelancer/shared evidence) — this remains a separate, open, future governance question.
- Any technical implementation, code, configuration, schema, or data change.

## Consequences

- When the same business resurfaces in a later search by the same freelancer — whether for the same or a different selected service — previously collected factual evidence about that business may, once mechanics are defined, be reused rather than re-collected from scratch, subject to freshness/applicability.
- Each search/service's opportunity evaluation, score, rank, and final determination remain independently computed; no service's evaluation is ever substituted for another's.
- The cross-owner/global reuse question (sharing evidence between different freelancers) remains fully open and unauthorized; no implementation may assume or build toward cross-owner sharing based on this decision.
- No engineering work is authorized by this record; it only establishes the product policy that a future engineering/PO pass on freshness, storage, and mechanics must honor.

## Addendum (2026-10-11) — cache-first principle

Recorded from the same PO decision session (that session's "Item #11"), as an architectural principle addition to this already-decided record — not a new decision record, since it extends rather than conflicts with the above:

> Before making a new AI call, the system should check whether sufficiently fresh, applicable cached evidence/results can satisfy the required work. If reusable evidence exists, unnecessary repeat AI research should be avoided.

This cache-first principle is **not implemented by this addendum** — it states only that, once the already-decided same-freelancer reuse mechanics (above) are built, the lookup should happen *before* a new AI call, not after or in parallel with one. It does not change points 1–8 of the "PO decision" section above, does not newly authorize cross-freelancer sharing (point 7/8 above remain unmodified — still NOT authorized), and does not define any freshness/TTL value, cache key, storage mechanism, or invalidation policy (still open, per "What remains to be decided" below). See also [Item #8](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_PO_DECISION.md), which places this same cache-first check as the first stage of the broader AI-escalation architecture.

## What remains to be decided

- The cross-freelancer/shared-evidence question (Item #11's global/cross-owner dimension) — separate future governance question, not addressed here.
- Exact freshness/TTL values and how they may vary by evidence category (ties to questionnaire item #13).
- Evidence storage/caching architecture and implementation (ties to questionnaire items #12, #13, #14).
- Signal scoring, ranking, thresholds, and AI-escalation mechanics for reused/combined evidence.
- Provider/model selection and cost policy.
- All other items already open in `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` remain open, unaffected by this decision except for the narrow same-owner clarification recorded above.

## Cross-reference / reconciliation notice (added 2026-10-12)

[CF-EVIDENCE-DELETION-SUPPRESSION-PO-DEC-001](CLIENT_FINDER_EVIDENCE_DELETION_SUPPRESSION_PO_DECISION.md) decides that a freelancer may request an opportunity/evidence be removed from their own view (per-owner view suppression, not global deletion). This record's owner-specific intelligence isolation rules, and its same-owner reuse decision, are preserved unchanged; they are not reopened, reinterpreted, or modified by that later record.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED.** No code, configuration, `.env`, database schema, or data has been changed. Nothing has been committed or pushed.
