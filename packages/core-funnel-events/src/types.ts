/**
 * The generic append-only funnel event log (ED-1), authorized under
 * CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
 *
 * Serves PCG-3A/3B's tier-exposure event ("upsell_viewed") and B-1's
 * "opportunity_reviewed" event — both are the same who/what/when/payload
 * shape, so one table serves both rather than bespoke tables per event.
 *
 * Exactly one of visitorId/userId is required (ED-2: a row may later gain
 * the other once an anonymous visitor authenticates, but the actual
 * anonymous->identified MERGE is deferred — not implemented here).
 */
export interface FunnelEventInput {
  eventName: string;
  visitorId: string | null;
  userId: string | null;
  subjectType: string;
  subjectId: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
}

export interface SqlClient {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}
