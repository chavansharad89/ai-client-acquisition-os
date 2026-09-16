// deliveryDispatcher
// -----------------------------------------------------------------------
// Consumes outbox_events rows for product delivery side effects (e.g.
// "send access email", "unlock content in dashboard") if delivery
// requires an external effect beyond the entitlements row itself.
//
// Whether this dispatcher is even needed depends on the frozen decision
// in architecture §14 item 6 ("what counts as delivered"). If delivery
// is purely "entitlement row exists, dashboard reads it live", this
// dispatcher may be unnecessary — do not implement it speculatively
// before that decision is made.
//
// NOT IMPLEMENTED — Phase 3, pending §14 item 6.
// -----------------------------------------------------------------------

export interface OutboxDispatchResult {
  outcome: 'sent' | 'retry' | 'dead_letter';
  error?: string;
}

export async function deliveryDispatcher(_outboxEventId: string): Promise<OutboxDispatchResult> {
  throw new Error('deliveryDispatcher: not implemented (Phase 3, pending architecture §14 item 6)');
}
