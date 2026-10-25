# Universal Ranking Framework Supersedes Legacy MVP Scoring Authorization — Product Owner Reconciliation Decision

**Decision ID:** CF-UNIVERSAL-RANKING-SUPERSEDES-MVP-SCORING-PO-DEC-001
**Related decisions:** [CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001](CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md), [CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md](CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md)
**Date:** 2026-10-12
**Authority:** Product Owner
**Status:** DECIDED. IMPLEMENTATION NOT AUTHORIZED.
**Scope of this record:** Governance-only, reconciliation between two existing decision records. Resolves the conflict identified (but not resolved) in `CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001`'s audit section. Decides no new weight, formula, threshold, Top-N, tie-breaker, or implementation architecture.

## Governance audit performed before recording

Read in full before recording:

- `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` (Decision A1, Decision D/§5, §6 Criterion #12 interpretation, §7–§9).
- `CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md` (Decisions 1–8, and its own "conflict found" audit section, which first surfaced this tension without resolving it).

Searched `requirement/` for other records that name `OpportunityScore`, the seven-factor weights, `FACTOR_WEIGHTS`, or `prospectScore.ts`. Records found to **depend on** (assume as currently authoritative, standing, user-facing, and/or unchanged) the legacy scoring model, beyond the two reconciled here:

- `AI Client Acquisition OS — Product Requirements Document V2.2.md` (R-14) — the PRD source defining the seven weighted factors (icpFit 20, visibleProblem 20, abilityToPay 15, urgency 15, serviceFit 15, evidenceQuality 10, contactability 5). Not amended by this record.
- `MVP_SCOPE_BOUNDARY.md` (§5.4 item 11 "SEVEN-FACTOR SCORE", §10 Criterion #12, including the "shown to a user" clause) — the Level 2 scope document listing seven-factor scoring as an in-scope MVP capability and requiring the score be shown to a user. Not amended by this record.
- `CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md` — governs the boundary of the already-wired seven-factor scoring path (`scoreOpportunityForOwner()`, `prospectScore.ts`, `FACTOR_WEIGHTS`, `OpportunityScore` persistence) and explicitly bars changes to the algorithm/weights/persistence as out of its own scope. Not amended by this record.
- `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_ENGINEERING_PROPOSAL.md` and `CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_LAYER_PO_DECISION_QUESTIONNAIRE.md` — cite `prospectScore.ts`'s seven-factor model only as a structural precedent for a separate, still-unauthorized deterministic ranking layer; both already state no numeric values are approved for that layer. Not dependent on the legacy model remaining user-facing; not amended.
- `CLIENT_FINDER_ITEM_8_AI_ESCALATION_COST_ARCHITECTURE_INVESTIGATION.md` — references `prospectScore.ts`/`FACTOR_WEIGHTS` only as an existing non-AI code path in an architecture diagram. Not amended.

None of these five records is rewritten by this decision. They are reported here, per instruction, as dependent/adjacent records a future reader or implementer should be aware of — not silently resolved. If any of them is later judged to require its own update, that is a separate governance task.

## Decision

**Where `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` conflicts with `CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001`, the latter (the newer, universal ranking framework) is authoritative.** This is a reconciliation of two existing Product Owner decisions, not a new product rule.

### What is superseded

1. **The 20/20/15/15/15/10/5 weighting scheme's status as a decided, standing Product Owner weighting for prioritization purposes.** `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` §4 (Decision A1) treated these specific numeric weights as settled MVP scope. `CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001` §5 explicitly places "exact numeric weights... scoring percentages... score ranges... numeric thresholds" back into "intentionally undecided/deferred" status. The old weighting scheme no longer carries standing as a Product-Owner-decided value set; it is not re-authorized, re-approved, or treated as current product direction by virtue of having existed before this reconciliation.
2. **The requirement/permission that the composite `OpportunityScore` be shown to the user as a number.** `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md` §3/§6 relied on `MVP_SCOPE_BOUNDARY.md` Criterion #12's "shown to a user" clause being satisfied by a numeric score. `CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001` §1 states: "Do not introduce a separate user-facing score, grade, rating, qualification label, or equivalent prioritization metric." A user-facing numeric `OpportunityScore` is no longer authorized product direction.
3. **The seven-factor *scoring* taxonomy's claim to being the universal prioritization taxonomy.** It is superseded in that role by the seven ranking *dimensions* named in `CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001` §3 (Need/Opportunity, Service Fit/Capability Fit, Evidence Quality, Evidence Freshness, Contactability, Current Activity, Commercial Readiness), which is now the authoritative prioritization taxonomy going forward.

### What remains authoritative (not superseded)

1. **Decision D / §5 — four-factor MVP deferral.** `icpFit`, `abilityToPay`, `urgency`, and `contactability` remaining `UNKNOWN`/neutral is a data-availability scope decision, unrelated to ranking presentation or weighting precision. Nothing in `CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001` addresses it. It remains authoritative, unaffected.
2. **The historical fact and rationale recorded in §1–§3, §9–§11 of `CLIENT_FINDER_MVP_SCORING_AUTHORIZATION_DECISION.md`** (what was decided, when, and why, including Conflict Register entries C-9/C-10) remains an accurate historical record of what the Product Owner decided on 2026-09-24. This reconciliation does not rewrite that history; it changes what is *currently* authoritative going forward where the two records conflict.
3. **Whether any internal, non-user-facing computation may still run as an engineering implementation detail** (e.g., a backend ranking function that happens to use a numeric sort key) is **not decided one way or the other by this record.** `CF-UNIVERSAL-RANKING-FRAMEWORK-PO-DEC-001` §5/§6 already defers all formula, weight, and architecture questions to future, separately authorized engineering decisions. This reconciliation does not invent or authorize any such architecture; it only settles that (a) no numeric weight is currently PO-decided, and (b) no numeric score may be user-facing.
4. **`MVP_SCOPE_BOUNDARY.md` Criterion #12's and the PRD's R-14's own text** are not amended or reinterpreted by this record. Their continued use of "seven-factor score" / "shown to a user" language is a known, reported dependency (see audit above), not silently resolved — a future governance task may need to reconcile Criterion #12's wording and status with the current ranking-only direction, but that reinterpretation is explicitly **not performed here**.

## Non-scope / explicit non-decisions

This record does **not** decide or authorize:

- Any ranking formula, numeric weight, percentage, score range, threshold, Top-N value, or tie-breaker rule.
- Any AI ranking rule or implementation architecture.
- Any amendment to `MVP_SCOPE_BOUNDARY.md`, the PRD, `CLIENT_FINDER_MVP_R70_R71_BOUNDARY_DECISION.md`, or any other dependent record identified above.
- A new interpretation of MVP Exit Criterion #12's status.
- Any code, configuration, schema, prompt, test, or data change.

## Implementation authorization status

NOT AUTHORIZED. Recording this reconciliation does not authorize implementation of any kind. No application code, schema, prompt, ranking code, scoring code, tests, configuration, or runtime behavior has been changed. Nothing has been committed or pushed.
