// Retention and redaction for webhook_events.payload.
// -----------------------------------------------------------------------
// WHAT IS IN THERE. A Razorpay `payment.captured` payload is not a
// financial record with a name attached — it is a customer dossier. The
// payment entity carries `email`, `contact` (phone), `vpa` (a UPI handle,
// which is usually a person's name and their bank: `firstname@okhdfcbank`),
// `card` (last4 / network / issuer), `bank`, `wallet`, `notes` (arbitrary
// merchant-set fields, in practice names and addresses), `description`
// (free text), and `acquirer_data` (RRN, UPI transaction id, bank
// transaction id). All of it landed in a JSONB column with no expiry.
//
// WHAT IT IS FOR. Nothing reads it. `payload` is write-only across this
// entire repository: `insertWebhookEvent` writes it, and no SELECT
// anywhere reads it back — core-reconciliation goes out of its way to
// exclude it (detection.ts) and webhookHandler deliberately takes the
// amount from the ORDER rather than the payload. Its only real job is
// forensic: when a payment is disputed months later, somebody needs to
// see what the provider actually said.
//
// WHY REDACTING LOSES NOTHING. The PII in the payload is a DUPLICATE.
// `orders.customer_email` and `orders.customer_phone` are the system of
// record for who bought, and `payments` is the system of record for what
// was charged. The payload's copy of the email is a second copy of a fact
// already stored, kept in the one place nothing curates. Removing the
// copy does not remove the fact.
//
// ALLOWLIST, NOT DENYLIST. This module rebuilds the payload from a fixed
// set of known-safe paths rather than deleting known-bad ones. A denylist
// fails open: Razorpay adds `payer_account_type` or a new `upi` block,
// nobody updates our list, and it is retained forever. An allowlist fails
// closed — a field we have never seen is dropped by default, and the cost
// of that mistake is a missing diagnostic rather than a retained
// identifier.
//
// NOTHING IS DELETED. The row survives, permanently: its identity
// (`razorpay_event_id`), its type (`event_name`), its processing status
// (`processed_at`, `processing_error`), its linkage (`order_id`), its
// timings, and the financial skeleton of the payload — ids, amount,
// currency, status, method, fees, error codes. `payload_redacted_at`
// records that redaction happened and when, so a reader can tell a
// redacted payload from one that arrived sparse. Redaction is a
// narrowing, and it is itself auditable.
// -----------------------------------------------------------------------

/**
 * How long the verbatim payload is kept before it is narrowed.
 *
 * 180 days is set by the longest EXTERNAL window that can require the
 * original, not by what is convenient to store: card networks allow
 * chargebacks up to roughly 120 days from the transaction, and answering
 * one takes time after it is raised. Below 120 days you are choosing to
 * forfeit card-dispute forensics; that is a legitimate choice, but it
 * should be a deliberate one, which is why the floor permits it and this
 * comment names the consequence.
 */
export const DEFAULT_RETENTION_DAYS = 180;

/** Bounds for the configured value. See DEFAULT_RETENTION_DAYS. */
export const MIN_RETENTION_DAYS = 30;
export const MAX_RETENTION_DAYS = 400;

/**
 * Every path kept after redaction, as dot-separated paths into the whole
 * webhook envelope.
 *
 * The rule applied to each candidate: does answering "was this payment
 * real, for how much, and what did the provider say about it?" require
 * the field? If the field instead answers "who is this person, and what
 * instrument did they pay with?", it is not here.
 *
 * DELIBERATELY ABSENT, and why:
 *   email, contact      direct identifiers; `orders` already holds both
 *   vpa                 a UPI handle is a name and a bank
 *   card, card_id       payment instrument
 *   token_id            a reusable handle on that instrument
 *   bank, wallet        reveals the customer's financial relationships
 *   notes               arbitrary merchant-set fields; in practice PII
 *   description         free text that reaches us from the checkout
 *   customer_id         provider-side identity join key
 *   acquirer_data       RRN / UPI / bank transaction ids — financial
 *                       trace identifiers that follow a person across
 *                       systems. Useful in a dispute, which is exactly
 *                       what the 180-day window is for; not something to
 *                       hold indefinitely once that window has closed.
 */
export const REDACTION_ALLOWLIST: readonly string[] = [
  // --- envelope ---
  'entity',
  'account_id',
  'event',
  'contains',
  'created_at',

  // --- payment ---
  'payload.payment.entity.id',
  'payload.payment.entity.entity',
  'payload.payment.entity.order_id',
  'payload.payment.entity.invoice_id',
  'payload.payment.entity.amount',
  'payload.payment.entity.currency',
  'payload.payment.entity.status',
  'payload.payment.entity.method',
  'payload.payment.entity.captured',
  'payload.payment.entity.amount_refunded',
  'payload.payment.entity.refund_status',
  'payload.payment.entity.international',
  'payload.payment.entity.fee',
  'payload.payment.entity.tax',
  'payload.payment.entity.error_code',
  'payload.payment.entity.error_source',
  'payload.payment.entity.error_step',
  'payload.payment.entity.error_reason',
  'payload.payment.entity.created_at',

  // --- order ---
  'payload.order.entity.id',
  'payload.order.entity.entity',
  'payload.order.entity.amount',
  'payload.order.entity.amount_paid',
  'payload.order.entity.amount_due',
  'payload.order.entity.currency',
  'payload.order.entity.status',
  'payload.order.entity.attempts',
  'payload.order.entity.created_at',

  // --- refund ---
  'payload.refund.entity.id',
  'payload.refund.entity.entity',
  'payload.refund.entity.payment_id',
  'payload.refund.entity.amount',
  'payload.refund.entity.currency',
  'payload.refund.entity.status',
  'payload.refund.entity.speed_processed',
  'payload.refund.entity.created_at',
];

function readPath(source: unknown, parts: readonly string[]): unknown {
  let cursor: unknown = source;
  for (const part of parts) {
    if (typeof cursor !== 'object' || cursor === null || Array.isArray(cursor)) return undefined;
    if (!Object.prototype.hasOwnProperty.call(cursor, part)) return undefined;
    cursor = (cursor as Record<string, unknown>)[part];
  }
  return cursor;
}

function writePath(target: Record<string, unknown>, parts: readonly string[], value: unknown): void {
  let cursor = target;
  for (let i = 0; i < parts.length - 1; i += 1) {
    const key = parts[i]!;
    const next = cursor[key];
    if (typeof next !== 'object' || next === null || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[parts[parts.length - 1]!] = value;
}

/**
 * Rebuilds a payload from REDACTION_ALLOWLIST.
 *
 * Pure, total, and idempotent: redacting an already-redacted payload
 * returns the same thing, which matters because the scheduled job may
 * legitimately see a row twice (a crash between UPDATE and COMMIT, an
 * operator re-running it, two replicas).
 *
 * The SQL function `redact_webhook_payload()` in migration 0011 is the
 * same function for callers that have a database and no application —
 * pg_cron, a psql job, a DBA. They are asserted equal in the integration
 * suite, because two implementations of one rule drift silently.
 */
export function redactWebhookPayload(raw: unknown): Record<string, unknown> {
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};

  const kept: Record<string, unknown> = {};
  for (const path of REDACTION_ALLOWLIST) {
    const parts = path.split('.');
    const value = readPath(raw, parts);
    // `undefined` means absent. A JSON `null` is a value the provider
    // sent and is kept as one.
    if (value === undefined) continue;
    writePath(kept, parts, value);
  }
  return kept;
}

/** Clamps a configured retention to the documented bounds. */
export function resolveRetentionDays(configured?: number): number {
  if (configured === undefined || !Number.isFinite(configured)) return DEFAULT_RETENTION_DAYS;
  const whole = Math.trunc(configured);
  return Math.min(MAX_RETENTION_DAYS, Math.max(MIN_RETENTION_DAYS, whole));
}

/** The instant at or before which a payload is due for redaction. */
export function redactionCutoff(now: Date, retentionDays: number): Date {
  return new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);
}

export interface RedactionStore {
  /**
   * Redacts at most `limit` rows received at or before `cutoff` that have
   * not been redacted already, and reports how many it changed.
   *
   * Bounded on purpose: an unbounded UPDATE on a table nobody has pruned
   * in a year is a long lock on the path every webhook insert takes.
   */
  redactBatch(cutoff: Date, limit: number, now: Date): Promise<number>;
}

export interface RedactionRunOptions {
  retentionDays?: number;
  /** Rows per statement. */
  batchSize?: number;
  /** Ceiling on statements, so one run cannot loop forever. */
  maxBatches?: number;
  signal?: AbortSignal;
}

export interface RedactionRunResult {
  redacted: number;
  batches: number;
  cutoff: Date;
  retentionDays: number;
  /** True when the ceiling stopped the run with rows still due. */
  incomplete: boolean;
}

export const DEFAULT_BATCH_SIZE = 500;
export const DEFAULT_MAX_BATCHES = 200;

/**
 * Runs redaction until nothing is due, the ceiling is reached, or the
 * caller aborts.
 *
 * Safe to run at any cadence and safe to run twice — `payload_redacted_at
 * IS NULL` in the statement's own WHERE clause means a second pass over
 * the same rows selects none of them.
 */
export async function redactExpiredPayloads(
  store: RedactionStore,
  now: Date = new Date(),
  options: RedactionRunOptions = {},
): Promise<RedactionRunResult> {
  const retentionDays = resolveRetentionDays(options.retentionDays);
  const cutoff = redactionCutoff(now, retentionDays);
  const batchSize = Math.max(1, Math.trunc(options.batchSize ?? DEFAULT_BATCH_SIZE));
  const maxBatches = Math.max(1, Math.trunc(options.maxBatches ?? DEFAULT_MAX_BATCHES));

  let redacted = 0;
  let batches = 0;

  while (batches < maxBatches) {
    if (options.signal?.aborted) break;
    const changed = await store.redactBatch(cutoff, batchSize, now);
    batches += 1;
    redacted += changed;
    // A short batch means the backlog is drained. Asking again would
    // cost a statement to learn the same thing.
    if (changed < batchSize) {
      return { redacted, batches, cutoff, retentionDays, incomplete: false };
    }
  }

  return { redacted, batches, cutoff, retentionDays, incomplete: true };
}
