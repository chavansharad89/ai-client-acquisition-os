import {
  DEFAULT_CAPI_TIMEOUT_MS,
  MetaCapiValidationError,
  sendMetaPurchase,
  type MetaCapiConfig,
  type SendMetaPurchaseInput,
} from '@acos/core-capi';

import {
  computeRetryDelayMs,
  DEFAULT_MAX_ATTEMPTS,
  hasExhaustedAttempts,
  LEASE_DURATION_MS,
  MAX_CONFIGURABLE_ATTEMPTS,
  type RandomSource,
} from './backoff';
import type { ClaimedMetaEvent, MetaEventRepository } from './repository';

// MetaEvent worker — claim, dispatch, settle.
// -----------------------------------------------------------------------
// State machine (only these transitions exist):
//
//   PENDING ---claim---> PROCESSING ---Meta 2xx-------> SENT
//                            |
//                            |--Meta failure----------> PENDING (+nextAttemptAt)
//                            |--attempts exhausted----> DEAD_LETTER
//                            |--payload invalid-------> DEAD_LETTER
//                            `--lease expired---------> PENDING (attempts unchanged)
//
// SENT, FAILED and DEAD_LETTER are terminal: `claim` only ever selects
// PENDING, so a delivered event can never be re-sent.
//
// DELIVERY IS AT-LEAST-ONCE, NOT EXACTLY-ONCE. The HTTP call to Meta is
// not transactional with this database, so there is a window in which
// Meta has accepted an event and we have not recorded it. Two things
// keep that honest rather than merely quiet: the event_id is stable and
// reused verbatim on every retry, so Meta deduplicates; and a send this
// worker cannot confirm is written to `last_error` as
// DELIVERED_UNCONFIRMED instead of being reported as "nothing happened".
// No state in the diagram above changes for that case — the row stays
// wherever its current owner left it.
// -----------------------------------------------------------------------

/** Everything the worker needs to turn a claimed row into a Meta request. */
export interface MetaEventUserContext {
  email?: string;
  phone?: string;
  clientIp: string;
  userAgent: string;
  fbp?: string;
  fbc?: string;
  eventSourceUrl?: string;
  /** Payment capture time — NOT the retry time, or Meta dedup windows drift. */
  eventTime: Date;
  productId: string;
  productName: string;
}

export type MetaEventContextLoader = (
  event: ClaimedMetaEvent,
) => Promise<MetaEventUserContext | null>;

export type MetaPurchaseSender = (
  config: MetaCapiConfig,
  input: SendMetaPurchaseInput,
) => Promise<void>;

export interface MetaEventWorkerDeps {
  repository: MetaEventRepository;
  config: MetaCapiConfig;
  /** Identifies this process/replica. Must be unique per worker instance. */
  workerId: string;
  loadContext: MetaEventContextLoader;
  sender?: MetaPurchaseSender;
  now?: () => Date;
  random?: RandomSource;
  leaseDurationMs?: number;
  maxAttempts?: number;
}

export type ProcessOutcome =
  | { outcome: 'sent' }
  | { outcome: 'retry'; attempts: number; nextAttemptAt: Date; error: string }
  | { outcome: 'dead_letter'; attempts: number; error: string }
  | { outcome: 'fenced'; reason: string }
  /**
   * Meta accepted the event and we could not record it.
   *
   * Kept apart from `fenced` because the two differ in the only way that
   * matters: `fenced` means this worker changed nothing anywhere, and
   * this means it changed something at Meta and cannot prove it. Folding
   * them together is what let a real HTTP delivery disappear from the
   * record.
   */
  | { outcome: 'delivered_unconfirmed'; reason: string; metaEventId: string };

/**
 * Event names this worker knows how to dispatch.
 *
 * WHY A REGISTRY AND NOT AN `if`: `sendMetaPurchase` hardcodes
 * `event_name: 'Purchase'` in the payload it builds. The dispatcher used
 * to call it for every claimed row without ever reading
 * `event.eventName`, so a row carrying any other name — an AddToCart, a
 * Lead, a typo — would have been delivered to Meta AS a Purchase,
 * carrying that row's value. That is not a dropped event; it is a
 * fabricated conversion, which corrupts attribution, inflates reported
 * revenue, and teaches the ad optimiser to bid on a purchase rate that
 * does not exist. It also costs real budget.
 *
 * Only `Purchase` exists today (the webhook handler writes that literal),
 * so this registry has one entry. It exists so that ADDING the second
 * one is a deliberate act rather than something that starts happening.
 */
export const SUPPORTED_META_EVENTS = ['Purchase'] as const;

export type SupportedMetaEvent = (typeof SUPPORTED_META_EVENTS)[number];

/**
 * Exact match. No trimming, no case folding.
 *
 * ' Purchase' and 'purchase' are data defects, and coercing them would
 * be exactly the silent reinterpretation this routing exists to stop.
 * Nothing legitimate produces them — the only writer emits the literal
 * string — so a near-miss means something upstream is wrong and should
 * be visible in the dead-letter queue rather than quietly corrected.
 */
export function isSupportedMetaEvent(eventName: string): eventName is SupportedMetaEvent {
  return (SUPPORTED_META_EVENTS as readonly string[]).includes(eventName);
}

const clockOf = (deps: MetaEventWorkerDeps) => deps.now ?? (() => new Date());

/** Thrown for a configuration that cannot be operated safely. */
export class MetaEventWorkerConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MetaEventWorkerConfigError';
  }
}

/**
 * The single source of truth for the attempt budget.
 *
 * Every decision about exhaustion goes through here, so there is nowhere
 * else for a second opinion to live.
 */
export function resolveMaxAttempts(deps: MetaEventWorkerDeps): number {
  return deps.maxAttempts ?? DEFAULT_MAX_ATTEMPTS;
}

/**
 * Rejects a configuration whose HTTP timeout is not strictly shorter than
 * its lease.
 *
 * This is the setting that decides whether fencing can work at all. The
 * lease is a promise that this worker will be finished within N ms. If a
 * single Meta call is allowed to run for N ms or longer, the lease can
 * expire while the request is still open — every time, not rarely. The
 * row is then recovered, another worker sends the same event, and the
 * first worker returns to find itself fenced. Nothing is corrupted, and
 * `attempts` is deliberately not charged for a lease recovery, so there
 * is also nothing to stop it happening again on the next pass.
 *
 * Strictly less, not less-or-equal: equal values race, and a race that
 * only sometimes duplicates a conversion is worse to diagnose than one
 * that always does.
 *
 * Also validates the attempt budget. Both checks share a principle: an
 * unusable configuration is refused loudly at the entry points, never
 * quietly adjusted into something that looks like it works.
 */
export function assertWorkerConfig(deps: MetaEventWorkerDeps): void {
  const leaseMs = deps.leaseDurationMs ?? LEASE_DURATION_MS;
  const timeoutMs = deps.config.timeoutMs ?? DEFAULT_CAPI_TIMEOUT_MS;
  const maxAttempts = resolveMaxAttempts(deps);

  // Rejected, not clamped. Silently reducing a configured budget is
  // precisely the bug this file just stopped having.
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new MetaEventWorkerConfigError(
      `maxAttempts must be a positive integer, received ${String(deps.maxAttempts)}`,
    );
  }
  if (maxAttempts > MAX_CONFIGURABLE_ATTEMPTS) {
    throw new MetaEventWorkerConfigError(
      `maxAttempts (${maxAttempts}) exceeds MAX_CONFIGURABLE_ATTEMPTS ` +
        `(${MAX_CONFIGURABLE_ATTEMPTS}). Attempts past the retry schedule all wait the same ` +
        `hour, so a larger budget is not a retry policy — it is an event that fails for days. ` +
        `Raise the ceiling deliberately if you mean it.`,
    );
  }

  if (!Number.isInteger(leaseMs) || leaseMs <= 0) {
    throw new MetaEventWorkerConfigError(
      `leaseDurationMs must be a positive integer, received ${String(leaseMs)}`,
    );
  }
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
    throw new MetaEventWorkerConfigError(
      `config.timeoutMs must be a positive integer, received ${String(timeoutMs)}`,
    );
  }
  if (timeoutMs >= leaseMs) {
    throw new MetaEventWorkerConfigError(
      `Meta CAPI timeoutMs (${timeoutMs}) must be strictly less than leaseDurationMs ` +
        `(${leaseMs}). A request allowed to outlive its own lease guarantees the lease ` +
        `expires mid-send, so the event is re-delivered by another worker and this one is ` +
        `fenced when it tries to record the result.`,
    );
  }
}

/**
 * Claims a single due event for this worker, or returns null when the
 * queue is empty. Concurrency safety is the repository's job (`FOR
 * UPDATE SKIP LOCKED`); this function owns the lease deadline.
 */
export async function claimMetaEvent(deps: MetaEventWorkerDeps): Promise<ClaimedMetaEvent | null> {
  const [claimed] = await claimMetaEvents(deps, 1);
  return claimed ?? null;
}

/** Batch form of {@link claimMetaEvent}, for a worker polling a backlog. */
export async function claimMetaEvents(
  deps: MetaEventWorkerDeps,
  limit: number,
): Promise<ClaimedMetaEvent[]> {
  if (!Number.isInteger(limit) || limit < 1) {
    throw new RangeError(`limit must be a positive integer, received ${limit}`);
  }
  assertWorkerConfig(deps);
  const now = clockOf(deps)();
  const leaseMs = deps.leaseDurationMs ?? LEASE_DURATION_MS;
  return deps.repository.claim({
    workerId: deps.workerId,
    now,
    leaseExpiresAt: new Date(now.getTime() + leaseMs),
    limit,
  });
}

/**
 * Dispatches one claimed event and settles its row.
 *
 * `attempts` is incremented ONLY when Meta itself failed us — a timeout,
 * a transport error, or a non-accepting response. A locally invalid
 * payload is a code defect that no amount of retrying fixes, so it is
 * dead-lettered immediately without consuming retry budget; likewise a
 * lease we no longer hold consumes nothing, because another worker is
 * now responsible for the row.
 */
export async function processMetaEvent(
  deps: MetaEventWorkerDeps,
  event: ClaimedMetaEvent,
): Promise<ProcessOutcome> {
  // Checked on both entry points rather than at a constructor, because
  // there is no constructor: deps is a plain object a caller assembles.
  // A misconfiguration that only surfaced under load is exactly the kind
  // this guard exists to prevent.
  assertWorkerConfig(deps);

  const send = deps.sender ?? sendMetaPurchase;
  const settle = { id: event.id, workerId: deps.workerId };

  // ROUTING, before anything else. An event this worker cannot dispatch
  // must not reach `send` — and checking here rather than after
  // loadContext also means an unroutable row costs no database read.
  //
  // Dead-lettered, not retried, and no attempt charged: an unknown event
  // name is a code or data defect, and the row will still say the same
  // thing in five minutes. That matches how a permanently invalid
  // payload is already handled.
  if (!isSupportedMetaEvent(event.eventName)) {
    const error =
      `unsupported event name ${JSON.stringify(event.eventName)} — this worker dispatches ` +
      `only ${SUPPORTED_META_EVENTS.join(', ')}. Refusing to send it as a Purchase.`;
    const owned = await deps.repository.markDeadLetter({
      ...settle,
      now: clockOf(deps)(),
      attempts: event.attempts,
      lastError: error,
    });
    return owned
      ? { outcome: 'dead_letter', attempts: event.attempts, error }
      : { outcome: 'fenced', reason: 'lease lost before dead-lettering' };
  }

  let context: MetaEventUserContext | null;
  try {
    context = await deps.loadContext(event);
  } catch (cause) {
    return scheduleRetry(deps, event, describe(cause));
  }
  if (!context) {
    // The row references an order we cannot build a payload from. Retrying
    // cannot conjure the data, so this is terminal and costs no attempts.
    const error = `no dispatch context for order ${event.orderId}`;
    const owned = await deps.repository.markDeadLetter({
      ...settle,
      now: clockOf(deps)(),
      attempts: event.attempts,
      lastError: error,
    });
    return owned
      ? { outcome: 'dead_letter', attempts: event.attempts, error }
      : { outcome: 'fenced', reason: 'lease lost before dead-lettering' };
  }

  try {
    await send(deps.config, {
      // The persisted id, reused verbatim. Regenerating it here would
      // defeat Meta's dedup and double-count the purchase.
      eventId: event.metaEventId,
      eventTime: context.eventTime,
      productId: context.productId,
      productName: context.productName,
      value: event.valuePaise / 100,
      currency: event.currency,
      clientIp: context.clientIp,
      userAgent: context.userAgent,
      ...(context.email !== undefined ? { email: context.email } : {}),
      ...(context.phone !== undefined ? { phone: context.phone } : {}),
      ...(context.fbp !== undefined ? { fbp: context.fbp } : {}),
      ...(context.fbc !== undefined ? { fbc: context.fbc } : {}),
      ...(context.eventSourceUrl !== undefined ? { eventSourceUrl: context.eventSourceUrl } : {}),
    });
  } catch (cause) {
    if (cause instanceof MetaCapiValidationError) {
      const error = `permanently invalid payload: ${cause.message}`;
      const owned = await deps.repository.markDeadLetter({
        ...settle,
        now: clockOf(deps)(),
        attempts: event.attempts,
        lastError: error,
      });
      return owned
        ? { outcome: 'dead_letter', attempts: event.attempts, error }
        : { outcome: 'fenced', reason: 'lease lost before dead-lettering' };
    }
    return scheduleRetry(deps, event, describe(cause));
  }

  // Meta has accepted the event. Everything from here is bookkeeping
  // about something that already happened out in the world.
  const owned = await deps.repository.markSent({ ...settle, now: clockOf(deps)() });
  if (owned) return { outcome: 'sent' };

  // The fence held — correctly. This worker no longer owns the row and
  // must not mark it SENT, because another worker is now responsible for
  // it and may be mid-send. But the delivery DID happen, and returning a
  // bare `fenced` here would file a real HTTP request under "this worker
  // changed nothing", which is how the send became invisible.
  //
  // So: leave the state machine entirely alone, and write a diagnostic.
  // The row's status, lease, owner and attempts are untouched — only
  // `last_error` is annotated, which grants this worker no authority
  // over the row and cannot advance it.
  //
  // This does NOT make delivery exactly-once. It cannot: the HTTP call
  // is not transactional with the database, so at-least-once with Meta
  // deduplicating on the stable event_id is the real guarantee. What
  // this buys is that the ambiguity is on the record instead of lost.
  const reason = 'lease lost after Meta accepted the event';
  await deps.repository.recordAmbiguousSend({
    ...settle,
    now: clockOf(deps)(),
    metaEventId: event.metaEventId,
  });
  return { outcome: 'delivered_unconfirmed', reason, metaEventId: event.metaEventId };
}

/**
 * Records a Meta-side failure: increments `attempts`, then either returns
 * the row to PENDING behind a full-jitter delay or dead-letters it once
 * the budget is spent.
 */
export async function scheduleRetry(
  deps: MetaEventWorkerDeps,
  event: ClaimedMetaEvent,
  error: string,
): Promise<ProcessOutcome> {
  const now = clockOf(deps)();
  // ONE number decides this. The previous `attempts >= max ||
  // hasExhaustedAttempts(attempts)` consulted the caller's budget and a
  // module constant, so the effective budget was min(configured, 5) and
  // a configured 8 silently behaved as 5.
  const max = resolveMaxAttempts(deps);
  const attempts = event.attempts + 1;
  const settle = { id: event.id, workerId: deps.workerId, now, attempts, lastError: error };

  if (hasExhaustedAttempts(attempts, max)) {
    const owned = await deps.repository.markDeadLetter(settle);
    return owned
      ? { outcome: 'dead_letter', attempts, error }
      : { outcome: 'fenced', reason: 'lease lost before dead-lettering' };
  }

  const nextAttemptAt = new Date(now.getTime() + computeRetryDelayMs(attempts, deps.random));
  const owned = await deps.repository.markForRetry({ ...settle, nextAttemptAt });
  return owned
    ? { outcome: 'retry', attempts, nextAttemptAt, error }
    : { outcome: 'fenced', reason: 'lease lost before scheduling retry' };
}

/**
 * Returns rows abandoned by dead workers to PENDING so another replica
 * can pick them up. Never charges an attempt: a crashed worker proves
 * nothing about whether Meta would have accepted the event.
 */
export async function releaseExpiredLeases(deps: MetaEventWorkerDeps): Promise<number> {
  return deps.repository.releaseExpiredLeases({ now: clockOf(deps)() });
}

function describe(cause: unknown): string {
  if (cause instanceof Error) return `${cause.name}: ${cause.message}`;
  return String(cause);
}
