// Phase 5 AI-escalation budget (CF-PHASE5-AI-BUDGET-LIFECYCLE-PO-DEC-001;
// durability mechanism: CLIENT_FINDER_PHASE5_AI_BUDGET_DURABILITY_MECHANISM_
// PO_DECISION_QUESTIONNAIRE.md, Option A). Fixed by explicit product
// decision, the same convention ./retry.ts's MAX_SEARCH_ATTEMPTS already
// uses — not configurable via environment or deps, and not coupled to that
// unrelated constant (one governs worker-claim retries, this governs AI
// spend; a Search can exhaust this budget on attempt 1 or spend zero across
// all attempts).

/**
 * B=10: the maximum AI-escalation units (Research + optional conditional
 * Target Customer Match, together, per admitted candidate) one Search may
 * spend across its entire lifecycle — shared across every
 * MAX_SEARCH_ATTEMPTS retry, never reset or added to by a retry. Persisted
 * durably on `searches.ai_escalation_units_consumed` (migration 0046) so it
 * survives a worker crash, which is exactly what a retry is designed to
 * tolerate.
 */
export const AI_ESCALATION_BUDGET = 10;
