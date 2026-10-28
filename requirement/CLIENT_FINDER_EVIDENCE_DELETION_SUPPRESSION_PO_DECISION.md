# CLIENT FINDER — EVIDENCE DELETION / SUPPRESSION — PRODUCT OWNER DECISION

**Decision ID:** CF-EVIDENCE-DELETION-SUPPRESSION-PO-DEC-001
**Related decisions:** [CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_CROSS_FREELANCER_PUBLIC_EVIDENCE_REUSE_PO_DECISION.md) (public, non-owner-specific factual evidence reusable across freelancers — the record this decision preserves and does not reopen), [CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001](CLIENT_FINDER_SAME_FREELANCER_EVIDENCE_REUSE_PO_DECISION.md) (same-owner evidence reuse; owner-specific intelligence/research context/opportunity evaluation isolation), [CF-CROSS-SERVICE-EVIDENCE-APPLICABILITY-PO-DEC-001](CLIENT_FINDER_CROSS_SERVICE_EVIDENCE_APPLICABILITY_PO_DECISION.md) (shared factual evidence pool across services does not imply shared opportunity evaluation), [CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001](CLIENT_FINDER_EVIDENCE_TRANSPARENCY_CONFLICT_STALENESS_FREELANCER_JUDGMENT_PO_DECISION.md) (freelancer holds final judgment over weak/stale/conflicting evidence — the posture this decision extends to "remove from my view"), [CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001](CLIENT_FINDER_SIGNAL_SPECIFIC_FRESHNESS_PO_DECISION.md) (signal-specific freshness mechanics — unaffected by this record, which introduces no retention/TTL concept)
**Decision title:** A freelancer may request that an opportunity/evidence be removed from their own view; this is per-owner view suppression, not deletion of reusable public factual evidence from the shared platform evidence pool
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle level. Decides only that (a) a freelancer may request per-owner removal of an opportunity/evidence from their own view, and (b) such a request does not delete reusable public, non-owner-specific factual evidence from the shared platform evidence pool. Does **not** define a retention period, an automatic-deletion schedule, a UI mechanism, an API shape, a database schema, or any other privacy mechanism beyond what is already established by existing governance.

## Governance audit performed before recording — conflicts found

A targeted search of `requirement/*.md` for deletion/suppression/privacy/retention language was performed before recording. Findings:

1. **No conflict — `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`.** That record already establishes that public, non-owner-specific factual evidence about a business MAY be reused across different freelancers, while owner-specific intelligence, research context, opportunity evaluation, scores/rankings, AI-generated qualification/conclusions, and private/contextual information remain owner-scoped. This record does not reopen, reinterpret, or weaken that record. It adds a narrower, previously undecided point: an individual freelancer's request to stop seeing a given opportunity/evidence in their own view has no bearing on, and does not trigger deletion of, the shared public factual pool that record authorizes.
2. **No conflict — `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` and `CF-CROSS-SERVICE-EVIDENCE-APPLICABILITY-PO-DEC-001`.** Both records already treat owner-specific intelligence, research context, and opportunity evaluation as strictly isolated per owner/search/service. This record does not alter that isolation; a suppression request made by one freelancer in their own view does not touch another freelancer's or another service's independently computed state.
3. **No conflict — `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001`.** That record already establishes that the freelancer holds final judgment over weak, stale, conflicting, unverified, or inferred opportunities, and that the system does not act as an authority that decides which businesses are genuine clients. This record extends that same judgment-authority posture to a concrete action — a freelancer asking that something be removed from their own view — without introducing a new elimination criterion, scoring mechanism, or sixth framework dimension, and without touching that record's Decisions 1–6.
4. **No conflict — `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`.** That record governs cache-freshness mechanics (signal-specific, service-aware, no universal TTL) and explicitly leaves TTL/invalidation/refresh/storage OPEN. This record does not introduce a retention period, an automatic-deletion period, a TTL, or any invalidation rule, and does not reopen that record's open items.
5. **Distinct governance axis, no conflict — `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` (IRL-M.3) / `CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md` §7.** Those records state that historical Opportunity/search data "is not deleted, hidden, or altered by expiry" — a statement about what a *subscription-expiry billing event* does not do to historical data, not a statement about whether an individual freelancer may ask to stop seeing a specific opportunity/evidence in their own view. The two are orthogonal: this record's per-owner view-suppression is a freelancer-initiated, per-item action; the expiry record governs an unrelated billing-lifecycle event and continues to mean exactly what it already says. This record does not reopen, reinterpret, or modify IRL-M.3 or the §7 restatement of it.
6. **Distinct governance trail, no conflict — `CLIENT_INTENT_DISCOVERY_OQ_DECISION.md` OQ-6 ("evidence never deleted") and related Client Intent Discovery records (`CLIENT_INTENT_DISCOVERY_PROVIDER_NEUTRAL_MVP_READINESS.md`, `CLIENT_INTENT_DISCOVERY_CODE_GAP_AUDIT.md` item 24).** OQ-6 is a **Client Intent Discovery** (a separate product/governance trail from Client Finder) storage-architecture decision: evidence is kept append-only at the persistence layer and aged out of relevance by a decay rule rather than physically deleted. It says nothing about per-owner view suppression and is not a Client Finder decision. This record does not reopen, reinterpret, modify, or extend OQ-6 or any Client Intent Discovery record; the two trails remain independent. If Client Finder evidence storage is later found to share infrastructure with Client Intent Discovery's append-only model, reconciling per-owner view suppression with an append-only store is an implementation question for a future engineering pass, not a governance conflict decided here.
7. **No conflicting record found authorizing global deletion on request.** No existing Client Finder decision record states that a freelancer's request causes reusable public factual evidence to be deleted from the shared platform evidence pool. This record fills that previously open area without rewriting any existing record.

No existing decision record is rewritten, reinterpreted, or superseded by this record.

## PO decision

**A freelancer may request that an opportunity/evidence be removed from their own view. This is per-owner view suppression only. It does NOT cause deletion of reusable public, non-owner-specific factual evidence from the shared platform evidence pool. The existing cross-freelancer public-evidence reuse decision, and the existing owner-specific intelligence isolation rules, are preserved unchanged. No retention period, automatic-deletion period, or additional privacy mechanism is introduced beyond what existing governance already supports.**

1. A freelancer MAY request that a specific opportunity/evidence be removed from their own view.
2. This is suppression from that freelancer's own view — not global deletion of the underlying evidence.
3. Reusable, public, non-owner-specific factual evidence about a business MAY remain in the shared platform evidence pool after one freelancer's suppression request, exactly as already authorized by `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`.
4. One freelancer's suppression request does NOT delete, and MUST NOT be implemented so as to delete, reusable public factual evidence globally.
5. The existing cross-freelancer public-evidence reuse decision (`CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`) is preserved unchanged.
6. The existing owner-specific intelligence isolation rules (owner-specific intelligence, research context, opportunity evaluation, scores/rankings, AI-generated qualification/conclusions, and private/contextual information remaining owner-scoped, per `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001` and `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`) are preserved unchanged.
7. No retention period is introduced or implied by this decision.
8. No automatic-deletion period or schedule is introduced or implied by this decision.
9. No additional privacy mechanism (beyond what is already supported by existing governance) is introduced by this decision.
10. **Implementation of any kind is NOT authorized by this decision.** This is a governance decision only.

## Exact authoritative wording

> A freelancer may request that an opportunity/evidence be removed from their own view.
>
> Reusable public, non-owner-specific factual evidence may remain in the shared platform evidence pool.
>
> This does NOT mean that one freelancer's suppression request deletes reusable public factual evidence globally.
>
> Preserve the existing cross-freelancer public-evidence reuse decision.
>
> Preserve the existing owner-specific intelligence isolation rules.
>
> Do not invent retention periods, automatic deletion periods, or additional privacy mechanisms unless already supported by existing governance.
>
> Do not implement anything yet.

## Governance clarification — this is suppression from own view, not global deletion

- "Removed from view" means the requesting freelancer no longer sees the opportunity/evidence in their own experience of the product. It is a per-owner, per-item effect.
- It is explicitly **not** a mechanism that deletes, purges, or otherwise removes the underlying factual evidence from the shared platform evidence pool that `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001` already authorizes other freelancers to reuse.
- A business's publicly observable, non-owner-specific facts remain exactly as reusable by other freelancers after one freelancer's suppression request as they were before it. No freelancer's individual suppression preference binds, limits, or degrades what any other freelancer can see or reuse.
- This record does not decide whether suppression state is stored per-owner-per-opportunity, per-owner-per-evidence-item, or at some other granularity; that is an implementation question explicitly left open below.

## No new retention/deletion/privacy mechanism introduced

- This record does not introduce a retention period for any category of evidence.
- This record does not introduce an automatic-deletion period or schedule for any category of evidence.
- This record does not introduce a "right to be forgotten," GDPR-specific erasure mechanism, or any other privacy mechanism beyond what existing governance already supports. If a future legal/privacy requirement needs such a mechanism, that remains a separate, future governance question.
- This record does not modify `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`'s signal-specific freshness mechanics, which continue to govern staleness/trustworthiness independently of this record's view-suppression concept. Freshness/staleness and view-suppression are different concepts: freshness governs whether cached evidence is trustworthy for reuse; suppression governs whether a given freelancer sees a given item in their own view.

## Mandatory boundaries on this decision

1. This is a governance/product-policy decision only.
2. No code, configuration, `.env`, database schema, or data change is authorized by this decision.
3. No UI mechanism, API shape, database schema, storage/flag design, retention period, automatic-deletion schedule, or additional privacy mechanism is authorized, defined, or changed by this decision.
4. This decision does not modify, reinterpret, or reopen `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`, `CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001`, `CF-CROSS-SERVICE-EVIDENCE-APPLICABILITY-PO-DEC-001`, `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001`, or `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`.
5. This decision does not modify, reinterpret, or reopen any Client Intent Discovery record, including OQ-6 ("evidence never deleted"); the two governance trails remain independent.
6. This decision does not authorize deleting reusable public, non-owner-specific factual evidence from the shared platform evidence pool on the basis of any single freelancer's suppression request.
7. This decision does not resolve, close, or answer any other open questionnaire item or decision record not named above.

## Explicit non-decisions

This record does **not** decide or authorize:

- Any retention period for any category of evidence.
- Any automatic-deletion period or schedule.
- Any additional privacy mechanism (e.g. a formal "right to be forgotten" / erasure workflow) beyond what existing governance already supports.
- The exact granularity at which suppression state is stored (per-opportunity, per-evidence-item, per-business, or otherwise).
- Any UI layout, component design, API response shape, or database schema change.
- Any change to `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001`'s classification of what counts as "public, non-owner-specific factual evidence" (still OPEN per that record).
- Any change to `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001`'s freshness mechanics.
- Any code, configuration, schema, prompt, test, or data change.

## Consequences

- A future engineering/PO pass may design the concrete per-owner suppression mechanism (e.g. a per-owner flag or exclusion list), provided it does not delete, degrade, or otherwise affect the shared public factual evidence pool available to other freelancers.
- No implementation may treat a freelancer's suppression request as grounds for purging or altering evidence that `CF-CROSS-FREELANCER-PUBLIC-EVIDENCE-REUSE-PO-DEC-001` makes reusable across freelancers.
- No implementation may treat a freelancer's suppression request as affecting another owner's isolated intelligence, research context, or opportunity evaluation — those remain governed exclusively by the existing isolation rules.
- No engineering work is authorized by this record; it only establishes the product policy that a future suppression-mechanics decision must honor.

## What remains to be decided

- The exact UI/UX mechanism by which a freelancer requests removal from their own view.
- The exact storage/flag granularity and schema for per-owner suppression state.
- Whether/how a suppressed opportunity can be un-suppressed (restored to view) and by whom.
- Whether any formal privacy/erasure mechanism (beyond this governance-level clarification) is ever required, and if so, under what legal basis — a separate, future governance question.
- All other questionnaire items and existing decision records remain open/unaffected, except for the narrow view-suppression clarification recorded above.

## Implementation authorization status

**IMPLEMENTATION NOT AUTHORIZED.** No code, configuration, `.env`, database schema, or data has been changed. Nothing has been committed or pushed.
