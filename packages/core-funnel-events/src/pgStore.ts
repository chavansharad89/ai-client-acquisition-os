import type { FunnelEventInput, SqlClient } from './types';

// Raw SQL against a `pg`-style executor, reusing the WebhookEvent/
// MetaEvent dedupe idiom (@acos/core-payments' webhookPgStore.ts):
// `INSERT ... ON CONFLICT DO NOTHING` against a unique index IS the
// first-exposure/first-view-only dedupe (B-1, PCG-3A/3B "exposure start
// = first exposure") — not a SELECT-then-INSERT, which would let two
// concurrent requests both see "no row yet" and both insert.
//
// migration 0031 carries two partial unique indexes, one per identity
// column (visitor_id, user_id) — exactly one of which this function's
// caller is expected to supply (see FunnelEventInput).

/**
 * Records a funnel event. Returns true the first time this
 * (eventName, identity, subjectId) combination is recorded, false for
 * every later duplicate — the first successful insert IS the
 * first-exposure/first-view row.
 *
 * Exactly one of visitorId/userId is expected per call (ED-2 defers the
 * anonymous->identified merge, so a caller never has both yet). Which
 * one is present decides which of migration 0031's two partial unique
 * indexes this statement's ON CONFLICT target names — Postgres only
 * suppresses the error for the conflict target actually declared, so
 * naming the wrong one would let a genuine duplicate throw instead of
 * being silently absorbed.
 */
export async function recordFunnelEvent(sql: SqlClient, input: FunnelEventInput): Promise<boolean> {
  if (input.visitorId === null && input.userId === null) {
    throw new Error('recordFunnelEvent requires at least one of visitorId/userId');
  }
  const conflictTarget =
    input.visitorId !== null
      ? `(event_name, visitor_id, subject_id) WHERE visitor_id IS NOT NULL`
      : `(event_name, user_id, subject_id) WHERE user_id IS NOT NULL`;
  const { rowCount } = await sql.query(
    `INSERT INTO funnel_events
       (event_name, visitor_id, user_id, subject_type, subject_id, payload, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ${conflictTarget} DO NOTHING`,
    [
      input.eventName,
      input.visitorId,
      input.userId,
      input.subjectType,
      input.subjectId,
      JSON.stringify(input.payload),
      input.occurredAt,
    ],
  );
  return (rowCount ?? 0) > 0;
}
