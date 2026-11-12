# CLIENT FINDER — CROSS-FREELANCER PUBLIC EVIDENCE REUSE — PRODUCT OWNER DECISION

**Decision ID:** CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001
**Related decisions:** [CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) (same-owner reuse — the record this one extends), [CF-DISCOVERY-ARCH-002 Item #11](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md#11-whether-deterministic-filtering-happens-per-search-or-globally) (per-search vs. global evaluation reuse — the item this record further, partially resolves), [CF-DISCOVERY-ARCH-002 Item #13](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md#13-caching-policy-where-it-materially-changes-product-behavior) (caching staleness/sharing policy), [CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001](CLIENT_FINDER_SINGLE_SERVICE_PER_SEARCH_PO_DECISION.md) (one service per search), [CF-SERVICE-CATALOG-PO-DEC-001](CLIENT_FINDER_SERVICE_CATALOG_SCOPE_PO_DECISION.md) (17-family service catalogue)
**Decision title:** Public, non-owner-specific factual evidence about a business may be reused across different freelancers; owner-specific intelligence, research context, opportunity evaluation, scores, rankings, AI-generated qualification/conclusions, and private/contextual information remain owner-scoped
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Governance-only. Decides the **cross-freelancer, public/non-owner-specific evidence** slice of questionnaire Item #11 only. This is a later PO extension/superseding clarification of the cross-owner dimension that `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` explicitly left open — it does not rewrite, reinterpret, or modify that record's same-owner decision, which stands unchanged. Does **not** define the exact classification rules for determining what counts as "public, non-owner-specific factual evidence," the exact storage/access implementation, freshness/TTL values, or any signal scoring, weighting, ranking, threshold, or AI-escalation mechanism.

## Context

`CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` decided that a freelancer may reuse their own previously collected factual evidence about a business across their own searches/services, and explicitly left the cross-freelancer/global dimension of questionnaire Item #11 "a separate, future governance question — not addressed here, not authorized here."

The PO has now decided the narrower question of whether, and under what boundary, evidence may be reused *across different freelancers*: only the subset of evidence that is genuinely public and not owner-specific may be reused this way. Everything that is owner-specific — intelligence, research context, opportunity evaluation, scores/rankings, AI-generated qualification/conclusions, and private or contextual information — remains strictly owner-scoped, exactly as already established.

## PO decision

**Public, non-owner-specific factual evidence about a business MAY be reused across different freelancers. Owner-specific intelligence, research context, service-specific opportunity evaluations, final scores/rankings, AI-generated qualification/conclusions, and private or contextual information MUST remain owner-scoped and isolated.**

1. Public, non-owner-specific factual evidence about a business MAY be reused across different freelancers.
2. Owner-specific intelligence MUST remain owner-scoped.
3. Owner-specific research context remains isolated per owner.
4. Service-specific opportunity evaluations remain isolated per owner/search/service.
5. Final scores/rankings remain isolated per owner/search/service.
6. AI-generated qualification/conclusions remain isolated per owner.
7. Private or contextual information remains isolated per owner.
8. This decision does NOT authorize unrestricted sharing of all research/evidence across freelancers — only the public, non-owner-specific factual subset.
9. The purpose of this decision is to permit reuse of genuinely public factual business evidence while preserving freelancer-specific intelligence boundaries.
10. This decision is a later PO extension of, not a replacement for, `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`; the same-owner decision in that record is unchanged.

## Exact authoritative wording

> Public, non-owner-specific factual evidence MAY be reused across different freelancers.
>
> Owner-specific intelligence MUST remain owner-scoped.
>
> Owner-specific research context remains isolated.
>
> Service-specific opportunity evaluations remain isolated.
>
> Final scores/rankings remain isolated.
>
> AI-generated qualification/conclusions remain isolated.
>
> Private or contextual information remains isolated.
>
> The purpose is to permit reuse of genuinely public factual business evidence while preserving freelancer-specific intelligence boundaries.
>
> This does NOT authorize unrestricted sharing of all research/evidence.
>
> Exact classification rules for determining "public, non-owner-specific factual evidence" remain OPEN.
>
> Exact storage/access implementation remains OPEN.

## Governance clarification — relationship to existing records

- This record does not rewrite or reinterpret `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`. That record's same-owner decision — a freelancer may reuse their own previously collected, still-applicable, still-fresh factual evidence across their own searches/services, with service-specific opportunity evaluation always kept separate — remains exactly as recorded, unchanged, and historical.
- This record resolves only the narrower, public/non-owner-specific-evidence portion of the cross-owner/global dimension of questionnaire Item #11 that the same-freelancer record left open. It does not resolve the full cross-owner dimension for evidence that is owner-specific — that evidence remains isolated per owner, as stated above, and whether/how any non-public owner-specific evidence could ever be shared remains a separate, still-open question this record does not reach.
- This record does not modify, reopen, or resolve any other questionnaire item (`CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md`) other than the public-evidence slice of Item #11 described above. Item #13 (caching staleness/sharing policy) is informed by this decision but not resolved by it — exact TTLs and storage/access implementation remain open, as stated above.
- This record does not modify `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001` or `CF-SERVICE-CATALOG-PO-DEC-001`.

## Mandatory boundaries on this decision

1. This is a governance/product-policy decision only.
2. No code, configuration, `.env`, database schema, or data change is authorized by this decision.
3. No classification rule for "public, non-owner-specific factual evidence," storage/access mechanism, freshness/TTL value, signal scoring rule, weight, threshold, ranking algorithm, AI-escalation mechanism, provider/model selection, or cost policy is authorized, defined, or changed by this decision.
4. This decision does not modify, reinterpret, or reopen `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`'s same-owner decision, which stands unchanged.
5. This decision does not resolve, close, or answer any other open questionnaire item other than the public-evidence slice of Item #11 described above.
6. This decision does not authorize sharing of owner-specific intelligence, research context, opportunity evaluations, scores/rankings, AI-generated qualification/conclusions, or private/contextual information between freelancers under any circumstance.

## Explicit non-decisions

This record does **not** decide or authorize:

- Exact classification rules for determining what counts as "public, non-owner-specific factual evidence" (remains OPEN).
- Exact storage/access implementation for cross-freelancer-shared evidence (remains OPEN).
- Freshness/TTL values for any category of evidence.
- Signal scoring, weights, or thresholds.
- Ranking algorithms.
- AI-escalation mechanisms or boundaries.
- Provider/model selection or cost policy.
- Any sharing of owner-specific intelligence, research context, opportunity evaluation, scores/rankings, AI-generated qualification/conclusions, or private/contextual information across freelancers.
- Any technical implementation, code, configuration, schema, or data change.

## Consequences

- Once classification rules and storage/access mechanics are defined in a future decision, genuinely public factual business evidence may be reused across different freelancers' searches rather than re-collected from scratch for each freelancer.
- Owner-specific intelligence, research context, opportunity evaluations, scores/rankings, AI-generated qualification/conclusions, and private/contextual information remain strictly isolated per freelancer; no implementation may assume or build toward sharing any of these across freelancers based on this decision.
- No engineering work is authorized by this record; it only establishes the product policy that a future engineering/PO pass on classification rules, storage, and access mechanics must honor.

## What remains to be decided

- Exact classification rules for determining "public, non-owner-specific factual evidence."
- Exact storage/access implementation for cross-freelancer-shared evidence.
- Freshness/TTL values and how they may vary by evidence category (ties to questionnaire Item #13 and to [CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001](CLIENT_FINDER_SIGNAL_SPECIFIC_FRESHNESS_PO_DECISION.md)).
- Signal scoring, ranking, thresholds, and AI-escalation mechanics for reused/combined evidence.
- Provider/model selection and cost policy.
- All other questionnaire items remain open, unaffected by this decision except for the narrow public-evidence clarification recorded above.

## Cross-reference / reconciliation notice (added 2026-10-12)

[CF-EVIDENCE-DELETION-SUPPRESSION-PO-DEC-001](CLIENT_FINDER_EVIDENCE_DELETION_SUPPRESSION_PO_DECISION.md) decides that a freelancer may request an opportunity/evidence be removed from their own view, and clarifies that such a request does not delete reusable public, non-owner-specific factual evidence from the shared platform evidence pool this record authorizes. This record's cross-freelancer public-evidence reuse decision is preserved unchanged; it is not reopened, reinterpreted, or modified by that later record.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED.** No code, configuration, `.env`, database schema, or data has been changed. Nothing has been committed or pushed.
