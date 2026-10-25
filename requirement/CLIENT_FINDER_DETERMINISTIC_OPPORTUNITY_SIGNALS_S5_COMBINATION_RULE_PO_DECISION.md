# CLIENT FINDER — DETERMINISTIC OPPORTUNITY SIGNALS — §5 PARTIAL PO DECISION: SIGNAL-COMBINATION RULE

**Decision ID:** CF-DISCOVERY-ARCH-002-S5
**Parent questionnaire:** [CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md), §5
**Parent architecture decision:** [CF-DISCOVERY-ARCH-001](CLIENT_FINDER_STAGED_DISCOVERY_ARCHITECTURE_PO_DECISION.md)
**Related partial decisions:** [CF-DISCOVERY-ARCH-002-Q1 through Q6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md)
**Decision title:** Signal-combination rule — different signal categories have different thresholds
**Date:** 2026-10-11
**Authority:** Product Owner
**Scope of this record:** Answers parent questionnaire §5 (signal-combination rule) only. §6 (AI-escalation boundary) remains open and unanswered.

## Context

The parent questionnaire presented five signal-combination options for how deterministic signals should combine to trigger AI research/qualification: (A) any single strong signal triggers escalation, (B) multiple weak signals must combine, (C) a deterministic score threshold triggers escalation, (D) different signal categories have different thresholds, (E) other.

## PO decision

**OPTION D — Different signal categories have different thresholds.**

## Exact authoritative wording

> The deterministic opportunity signals must NOT be treated as having equal evidentiary strength.
>
> Different signal categories may therefore use different thresholds when determining whether a candidate should advance to the AI research/qualification stage.
>
> Examples of the principle only:
> - A strong, high-confidence signal may justify escalation by itself.
> - A weak signal should generally require additional supporting evidence.
> - Multiple moderate/weak signals may combine to justify escalation.
> - Signals with materially different reliability should not automatically receive identical treatment.
>
> The objective is to prevent both: expensive AI calls for trivial/weak evidence, and loss of exceptionally strong opportunities because a universal multi-signal rule was imposed.

## Mandatory boundaries on this decision

1. This decision does not define numerical scores.
2. This decision does not define exact thresholds.
3. This decision does not define weights.
4. This decision does not authorize implementation.
5. Engineering must later propose the concrete scoring/threshold model.
6. That proposal must be reviewed through the appropriate governance process before implementation.
7. No existing signal score or implementation value is retroactively treated as PO-approved merely because this principle has been decided.

## Explicit non-decisions

This record does **not** decide or authorize:

- Which specific signals count as "strong, high-confidence" versus "weak" — that classification is part of the future engineering proposal.
- Any numeric score, weight, or threshold value.
- §6, the AI-escalation boundary (parent questionnaire options A–D) — open.
- Any code, configuration, or `.env` change.
- Anything already decided or deferred under [CF-DISCOVERY-ARCH-002-Q1 through Q6](CLIENT_FINDER_DETERMINISTIC_OPPORTUNITY_SIGNALS_PO_DECISION_PREPARATION.md) — unaffected by this record.

## Consequences

- Future engineering proposals for the deterministic stage's scoring model must express per-category (or per-signal) thresholds rather than a single universal rule (ruling out a pure Option A "any single signal" or Option B "always requires combination" model as the final design, and ruling out a single flat Option C score cutoff that ignores category reliability differences).
- Any such proposal requires its own governance review before implementation, per boundary (6) above.

## What remains to be decided

- §6, the AI-escalation boundary.
- The concrete scoring/threshold model itself (future engineering proposal + governance review).

## Implementation authorization status

**NOT AUTHORIZED.** No code, configuration, `.env`, or data has been changed.
