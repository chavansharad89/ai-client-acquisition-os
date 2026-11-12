# CLIENT FINDER — SIGNAL-SPECIFIC / SERVICE-AWARE FRESHNESS — PRODUCT OWNER DECISION

**Decision ID:** CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001
**Related decisions:** [CF-DISCOVERY-ARCH-002 Item #13](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md#13-caching-policy-where-it-materially-changes-product-behavior) (caching policy — the item this record partially resolves at the principle level), [CF-DISCOVERY-ARCH-002 Item #11](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md#11-whether-deterministic-filtering-happens-per-search-or-globally) (per-search vs. global evaluation reuse), [CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) (same-owner reuse + cache-first principle), [CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_CROSS_FREELANCER_PUBLIC_EVIDENCE_REUSE_PO_DECISION.md) (cross-freelancer public evidence reuse), [Item #8 AI Escalation Cost Architecture](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_PO_DECISION.md)
**Decision title:** Cache freshness is not governed by one universal TTL; freshness may differ by evidence type, deterministic signal, expected rate of change, and selected top-level service where relevant
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Governance-only, principle level. Decides that freshness is signal-specific and service-aware rather than a single universal value. Does **not** choose any exact TTL value, invalidation rule, refresh strategy, or cache/storage implementation — all remain OPEN for a future decision.

## Context

Questionnaire Item #13 asks how stale a cached/reused evaluation may be before it must be re-checked, and whether that staleness window differs by signal type. `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` and `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001` both authorize reuse of factual evidence subject to it being "still applicable and sufficiently fresh," without defining what "fresh" means or whether it varies by evidence category — that was left open by both records.

The PO has now decided, at the principle level, that there is no single freshness value that applies uniformly to all cached evidence: different categories of evidence legitimately warrant different freshness requirements, and the top-level service selected for a search may also be relevant to that determination.

## PO decision

**Cache freshness is NOT governed by one universal TTL. Freshness may differ according to evidence type, deterministic signal, expected rate of change, and selected top-level service where relevant. Freshness determines whether cached evidence remains trustworthy; it does not change the underlying evidence itself, and it does not allow one service's opportunity evaluation to become another service's evaluation.**

1. Cache freshness is NOT governed by one universal TTL.
2. Freshness may differ according to: evidence type; deterministic signal; expected rate of change; selected top-level service where relevant.
3. Different information may legitimately have different freshness requirements.
4. Freshness determines whether cached evidence remains trustworthy for reuse.
5. Freshness does not change the underlying evidence itself.
6. Freshness does not allow one service's opportunity evaluation to become another service's evaluation.
7. Exact TTL values remain OPEN.
8. Exact invalidation rules remain OPEN.
9. Exact refresh strategy remains OPEN.
10. Cache/storage implementation remains OPEN.

## Exact authoritative wording

> Cache freshness is NOT governed by one universal TTL.
>
> Freshness may differ according to evidence type, deterministic signal, expected rate of change, and selected top-level service where relevant.
>
> Different information may legitimately have different freshness requirements.
>
> Freshness determines whether cached evidence remains trustworthy.
>
> Freshness does not change the underlying evidence itself.
>
> Freshness does not allow one service's opportunity evaluation to become another service's evaluation.
>
> Exact TTL values remain OPEN.
>
> Exact invalidation rules remain OPEN.
>
> Exact refresh strategy remains OPEN.
>
> Cache/storage implementation remains OPEN.

## Governance clarification — relationship to existing records

- This record establishes, at the principle level only, that Item #13's "policy ceiling" is not a single value but a structure that may vary by evidence/signal category and, where relevant, by selected top-level service. It does not choose the structure's concrete values — no TTL, invalidation rule, or refresh strategy is set here.
- This record is consistent with, and does not modify, `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`'s "still applicable and sufficiently fresh" condition and its cache-first addendum: it clarifies that "sufficiently fresh" is to be judged per signal/evidence category rather than against one universal window, without yet defining what that judgment is.
- This record is consistent with, and does not modify, `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`: the signal-specific freshness principle applies equally to same-owner and cross-owner-public evidence reuse: freshness governs whether either kind of cached evidence remains trustworthy, but does not expand what categories of evidence are reusable under those records.
- This record does not resolve, close, or answer any other questionnaire item other than the principle-level portion of Item #13 described above. The mechanics (B/C-classified) portion of Item #13 — concrete TTLs, invalidation, refresh, and storage — remains fully open.

## Mandatory boundaries on this decision

1. This is a governance/product-policy decision only, at the principle level.
2. No code, configuration, `.env`, database schema, or data change is authorized by this decision.
3. No TTL value, invalidation rule, refresh strategy, or cache/storage mechanism is authorized, defined, or chosen by this decision.
4. This decision does not modify, reinterpret, or reopen `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` or `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`.
5. This decision does not permit one service's opportunity evaluation to be treated as another service's evaluation on the basis of shared evidence freshness.
6. This decision does not resolve, close, or answer any other open questionnaire item other than the principle-level portion of Item #13 described above.

## Explicit non-decisions

This record does **not** decide or authorize:

- Exact TTL values for any evidence type, signal, or service.
- Exact invalidation rules.
- Exact refresh strategy.
- Cache/storage implementation or architecture.
- Any change to what evidence is reusable, or across whom — that remains governed exclusively by `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` and `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`.
- Signal scoring, weights, thresholds, ranking, AI-escalation mechanics, provider/model selection, or cost policy.
- Any technical implementation, code, configuration, schema, or data change.

## Consequences

- A future engineering/PO pass defining concrete freshness mechanics must design for per-signal/evidence-category (and, where relevant, per-service) differentiation rather than a single universal TTL.
- No cached evidence may be treated as fresh or trustworthy on the basis of a single uniform expiry assumption; the determination must account for the category of evidence involved.
- Freshness decisions never cause one service's opportunity evaluation to be substituted for another's — that boundary, already set by `CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001` and the same-/cross-freelancer reuse records, is unaffected.
- No engineering work is authorized by this record; it only establishes the product policy that a future freshness-mechanics decision must honor.

## What remains to be decided

- Exact TTL values per evidence type/signal/service.
- Exact invalidation rules.
- Exact refresh strategy.
- Cache/storage implementation and architecture.
- All other questionnaire items remain open, unaffected by this decision except for the principle-level clarification of Item #13 recorded above.

## Cross-reference / reconciliation notice (added 2026-10-12)

[CF-EVIDENCE-DELETION-SUPPRESSION-PO-DEC-001](CLIENT_FINDER_EVIDENCE_DELETION_SUPPRESSION_PO_DECISION.md) decides that a freelancer may request an opportunity/evidence be removed from their own view. That is a distinct concept from this record's freshness/trustworthiness mechanics: freshness governs whether cached evidence remains trustworthy for reuse, while view-suppression governs whether a given freelancer sees a given item. That later record introduces no TTL, invalidation rule, or retention period and does not reopen, reinterpret, or modify this record.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED.** No code, configuration, `.env`, database schema, or data has been changed. Nothing has been committed or pushed.
