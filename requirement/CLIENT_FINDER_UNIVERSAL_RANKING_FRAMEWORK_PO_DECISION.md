# Universal Ranking Framework — Product Owner Decision

**Decision ID:** CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001
**Related decisions:** [CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_FIVE_DIMENSION_FRAMEWORK_PO_DECISION.md), [CF-NEED-OPPORTUNITY-GAP-SERVICE-INDEPENDENCE-PO-DEC-001](CLIENT_FINDER_NEED_OPPORTUNITY_GAP_SERVICE_INDEPENDENCE_PO_DECISION.md), [CF-SERVICE-FIT-CAPABILITY-FIT-PO-DEC-001](CLIENT_FINDER_SERVICE_FIT_CAPABILITY_FIT_PO_DECISION.md), [CF-SERVICE-FIT-RANKING-NOT-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_SERVICE_FIT_RANKING_NOT_ELIGIBILITY_PO_DECISION.md), [CF-CURRENT-ACTIVITY-CONTEXTUAL-EVIDENCE-PO-DEC-001](CLIENT_FINDER_CURRENT_ACTIVITY_CONTEXTUAL_EVIDENCE_PO_DECISION.md), [CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001](CLIENT_FINDER_COMMERCIAL_CONTACT_READINESS_RANKING_NOT_ELIGIBILITY_PO_DECISION.md), [CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001](CLIENT_FINDER_EVIDENCE_TRANSPARENCY_CONFLICT_STALENESS_FREELANCER_JUDGMENT_PO_DECISION.md), [CF-MINIMUM-USEFUL-LEAD-RESULT-PO-DEC-001](CLIENT_FINDER_MINIMUM_USEFUL_LEAD_RESULT_PO_DECISION.md), [CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001](CLIENT_FINDER_SIGNAL_SPECIFIC_FRESHNESS_PO_DECISION.md), [CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001](CLIENT_FINDER_SERVICE_FIT_SUBSERVICE_UNIFICATION_PO_DECISION.md), [CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001](CLIENT_FINDER_TOP_LEVEL_SERVICE_ONLY_SUBSERVICES_INTERNAL_PO_DECISION.md), [CF-SINGLE-SERVICE-PER-SEARCH-PO-DEC-001](CLIENT_FINDER_SINGLE_SERVICE_PER_SEARCH_PO_DECISION.md)
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, principle level. Defines ranking as the sole prioritization mechanism, separates ranking from eligibility, names seven ranking dimensions, and states a relative (non-numeric) priority hierarchy among them. Does **not** define a ranking formula, numeric weights, score ranges, thresholds, Top-N values, or tie-breaker rules.

> **Reconciliation note (2026-10-12):** The conflict with `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` identified in the audit section immediately below was, at the time this record was first written, explicitly left unresolved ("This record does not resolve the conflict"). It has since been resolved by `CF-UNIVERSAL-RANKING-SUPERSEDES-MVP-SCORING-PO-DEC-001` (see `CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md`), which makes this record authoritative wherever the two conflict. The original audit text below is preserved unchanged as the historical record of the conflict as first identified.

## Governance audit performed before recording — conflict check

The twelve related decisions listed above were reviewed in full (or by targeted search for score/weight/ranking language where already audited for this exact question in a prior record) before writing this file.

**No conflict found among the twelve related decisions themselves.** Each one independently and consistently:

- Declines to define any scoring formula, numeric weight, confidence value, or threshold for its own dimension, explicitly leaving that open ("Does not decide... scoring, weight, threshold, ranking formula...").
- Treats ranking and eligibility as separate concerns, where already decided per-dimension (Service Fit, Commercial/Contact Readiness).
- Is consistent with the "discover → preserve evidence → contextualize → rank → show → freelancer decides" philosophy this record restates.

`CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001` names five dimensions (Entity Reality, Current Activity, Need/Opportunity Gap, Service Fit/Capability Fit, Commercial/Contact Readiness) as the universal *eligibility/contextualization* framework. This record's seven ranking dimensions are not a replacement for that framework and do not reopen it. Entity Reality is intentionally excluded from the ranking dimension list below because `CF-UNIVERSAL-FIVE-DIMENSION-FRAMEWORK-PO-DEC-001` and its own cross-referenced record establish Entity Reality as a hard eligibility question (real/identifiable or not), not a ranking input — consistent with this record's Decision 2 and Section on hard eligibility rules. Evidence Quality and Evidence Freshness, named here as ranking dimensions, are elaborated in detail (not redefined) by `CF-EVIDENCE-TRANSPARENCY-CONFLICT-STALENESS-FREELANCER-JUDGMENT-PO-DEC-001` and `CF-SIGNAL-SPECIFIC-FRESHNESS-PO-DEC-001` respectively.

**One pre-existing, unresolved conflict was found and is reported here rather than silently resolved, per instruction:**

- `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` (Decision A1 + Decision D, dated 2026-09-24) explicitly **authorized and treats as live MVP scope** a seven-factor **weighted numeric scoring model** (`prospectScore.ts`): icpFit 20, visibleProblem 20, abilityToPay 15, urgency 15, serviceFit 15, evidenceQuality 10, contactability 5 — summing to a 100-point composite `OpportunityScore`, persisted per Opportunity. That document's own §3 quotes `MVP_SCOPE_BOUNDARY.md` §10 Criterion #12: "the score must be produced from persisted evidence for a discovered business and **shown to a user**" — i.e., the existing, authorized scoring model is explicitly a **user-facing numeric score**.
- This directly conflicts with two provisions of this Universal Ranking Framework decision:
  - **Decision 1** of this record: "Do not introduce a separate user-facing score... The freelancer should see the ranked opportunities and the underlying evidence/context and make the final judgment" — the existing `OpportunityScore` is precisely such a user-facing score, already authorized.
  - **Decision 5** of this record: "Do NOT introduce or require arbitrary numeric weights such as percentages or 0–100 values... exact numeric weights [and] scoring percentages... remain intentionally undecided/deferred" — the existing scoring model already has decided, live, 0–100-point weights (20/20/15/15/15/10/5).
- Several prior governance records (`CF-SERVICE-FIT-RANKING-NOT-ELIGIBILITY-PO-DEC-001`, `CF-COMMERCIAL-CONTACT-READINESS-RANKING-NOT-ELIGIBILITY-PO-DEC-001`, `CF-SERVICE-FIT-SUBSERVICE-UNIFICATION-PO-DEC-001`, `CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001`) already noted the seven-factor scoring model's existence and judged it "consistent" with their own, narrower eligibility-vs-ranking question (i.e., it does not eliminate leads). None of those records examined, or ruled on, whether the model's composite score being **shown to the user** is compatible with a no-user-facing-score / no-numeric-weight principle — because no such principle existed in governance until this record. This record is the first to create that tension, and it is being surfaced explicitly rather than silently overridden or silently left to collide in implementation.
- **This record does not resolve the conflict.** It does not amend, supersede, deprecate, or authorize any change to `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`, the seven-factor scoring algorithm, its weights, or its production wiring. The Product Owner's ranking-only / no-numeric-weight / no-user-facing-score principle recorded here and the already-authorized, live, user-facing seven-factor `OpportunityScore` are both recorded as currently standing, and the Product Owner should separately decide how (or whether) to reconcile them — for example, by deprecating the user-visible score surface while keeping the underlying computation as an internal ranking input, or by amending this record's Decision 1. That reconciliation is explicitly out of scope here.
- Secondary, non-conflicting observation: this record's seven **ranking dimensions** (Need/Opportunity, Service Fit/Capability Fit, Evidence Quality, Evidence Freshness, Contactability, Current Activity, Commercial Readiness) are a different taxonomy from the existing seven **scoring factors** (icpFit, visibleProblem, abilityToPay, urgency, serviceFit, evidenceQuality, contactability) — they share only two named concepts (Service Fit/serviceFit, Evidence Quality/evidenceQuality) and are not a one-to-one mapping. This is noted for awareness; reconciling the two taxonomies is not decided by this record.

No other conflicting or unresolved ranking/score language was found among the twelve related decisions.

## Decision

### 1. Ranking is the prioritization mechanism

The Client Finder uses **ranking only** to determine the order/prioritization of eligible leads. Do not introduce a separate user-facing score, grade, rating, qualification label, or equivalent prioritization metric. The freelancer sees the ranked opportunities and the underlying evidence/context and makes the final judgment.

### 2. Ranking does not determine eligibility

Ranking and eligibility remain separate. A lead that ranks lower must not be automatically eliminated. Weak Need/Opportunity, weak/uncertain Service Fit, weak evidence, stale evidence, missing contact information, limited Current Activity, and limited Commercial Readiness each lower ranking, not eligibility. All existing, separately governed hard eligibility rules (including Entity Reality) are preserved.

### 3. Seven ranking dimensions

1. Need / Opportunity
2. Service Fit / Capability Fit
3. Evidence Quality
4. Evidence Freshness
5. Contactability
6. Current Activity
7. Commercial Readiness

### 4. PO ranking hierarchy (relative priority, not numeric weighting)

- **Primary:** Need / Opportunity; Service Fit / Capability Fit
- **Important:** Evidence Quality; Evidence Freshness
- **Supporting:** Contactability; Current Activity; Commercial Readiness

### 5. No numeric weights required at this stage

Do not introduce or require numeric weights, percentages, 0–100 values, score ranges, numeric thresholds, a mathematical ranking formula, Top-N values, or a tie-breaker formula. These remain intentionally undecided/deferred and may be revisited if actual product usage demonstrates a need for additional precision. Do not silently choose these values. (See the conflict noted above regarding the pre-existing, separately authorized seven-factor numeric scoring model.)

### 6. Universal framework with service-specific adjustment

One common ranking framework applies across all 17 top-level services; the seven dimensions are universal. Service-specific adjustments may be introduced where justified, without creating 17 unrelated ranking architectures. This record does not itself define any service-specific adjustment.

### 7. Product philosophy

Ranking answers "which eligible opportunities should the freelancer look at first?" — not "which business will definitely buy?" The overall flow remains: **Discover → preserve evidence → contextualize → rank → show → freelancer decides.**

### 8. Preservation of prior decisions

This record cross-references and preserves, without rewriting, reinterpreting, or superseding, the twelve related decisions listed above.

## Non-scope / explicit non-decisions

This record does **not** decide or authorize:

- Any ranking formula, numeric weight, percentage, score range, or threshold for any dimension.
- Any Top-N value or tie-breaker rule.
- Any service-specific ranking adjustment for any of the 17 service families.
- Any resolution of the conflict identified above between this record and `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`.
- Any code, configuration, schema, prompt, test, or data change.

## Implementation authorization status

NOT AUTHORIZED. Recording this decision does not authorize implementation of any kind. No application code, schema, prompt, ranking code, scoring, weights, thresholds, tests, configuration, or runtime behavior has been changed. Nothing has been committed or pushed.
