// capiDispatcher
// -----------------------------------------------------------------------
// Consumes outbox_events rows where event_type === 'Purchase' (or other
// Meta-reportable events later) and calls @acos/core-capi to send them.
// Must be idempotent: being invoked twice for the same row (e.g. after a
// crash between "Meta accepted" and "we marked row sent") must not
// double-report, which is guaranteed by the deterministic event_id in
// core-capi, not by anything in this file.
//
// See architecture §7 (Meta CAPI Flow), §8 (Retry Architecture).
//
// NOT IMPLEMENTED — Phase 2.
// -----------------------------------------------------------------------

export interface OutboxDispatchResult {
  outcome: 'sent' | 'retry' | 'dead_letter';
  error?: string;
}

export async function capiDispatcher(_outboxEventId: string): Promise<OutboxDispatchResult> {
  throw new Error('capiDispatcher: not implemented (Phase 2)');
}
