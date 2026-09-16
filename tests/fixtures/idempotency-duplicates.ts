import { type Queryable, type TestRunContext } from './test-run-context';

// Deterministic duplicate fixtures.
// -----------------------------------------------------------------------
// Each fixture seeds rows that violate exactly one of the four uniqueness
// rules the index deployment enforces, and returns the precise ids it
// created so the caller can clean up without a broad delete.
//
// Everything is derived from `context.runId`, so the same runId produces
// the same ids on every machine and every run — a failure is reproducible
// by re-using the run id from its output.
// -----------------------------------------------------------------------

export type DuplicateIdentifierKind =
  | 'payment' // payments.razorpay_payment_id
  | 'webhookEvent' // webhook_events.razorpay_event_id
  | 'metaEvent' // meta_events.meta_event_id
  | 'order' // meta_events.order_id
  | 'all';

export const DUPLICATE_KINDS: readonly Exclude<DuplicateIdentifierKind, 'all'>[] = [
  'payment',
  'webhookEvent',
  'metaEvent',
  'order',
];

/** Ids created by a fixture — everything cleanup needs, nothing more. */
export interface SeededIds {
  orderIds: string[];
  paymentIds: string[];
  webhookEventIds: string[];
  metaEventIds: string[];
}

export interface DuplicateFixture extends SeededIds {
  kind: Exclude<DuplicateIdentifierKind, 'all'>;
  /** The column value that is duplicated. */
  duplicatedValue: string;
  /** Table and column the collision is on. */
  target: { table: string; column: string };
  /** How many rows share `duplicatedValue`. */
  copies: number;
}

export interface SeedOptions {
  /** Rows sharing the duplicated value. Default 2. */
  copies?: number;
}

const AMOUNT_PAISE = 49_900;

// --- building blocks -----------------------------------------------------

/** Inserts one order and registers it. Safe to call repeatedly for one id. */
export async function seedOrder(
  db: Queryable,
  context: TestRunContext,
  suffix: string | number,
): Promise<string> {
  const id = context.id('order', suffix);
  await db.query(
    `INSERT INTO orders (id, razorpay_order_id, idempotency_key, customer_email,
                         product_slug, product_name, amount_paise, currency, status, updated_at)
     VALUES ($1, $2, $3, 'fixture@example.com', 'ai_freelancing_499',
             'AI Freelancing Launch Kit', $4, 'INR', 'PAID', now())
     ON CONFLICT (id) DO NOTHING`,
    [id, `rzp_${id}`, `idem_${id}`, AMOUNT_PAISE],
  );
  return context.trackOrder(id);
}

/**
 * Inserts the single CAPTURED payment an order needs before a meta event
 * may reference it (migration 0003, `meta_events_require_capture`).
 *
 * The amount is taken from the same constant the order uses, because
 * `payments_match_order` now rejects any mismatch — which is the point of
 * that trigger, and why fixtures cannot paper over it.
 */
export async function seedCapturedPayment(
  db: Queryable,
  context: TestRunContext,
  orderId: string,
  suffix: string | number,
): Promise<string> {
  const id = context.id('payment', `cap${suffix}`);
  await db.query(
    `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise,
                           currency, status, updated_at)
     VALUES ($1, $2, $3, $4, 'INR', 'CAPTURED', now())
     ON CONFLICT (id) DO NOTHING`,
    [id, `rzp_${id}`, orderId, AMOUNT_PAISE],
  );
  return context.trackPayment(id);
}

// --- the four duplicate kinds -------------------------------------------

/**
 * N payments sharing one razorpay_payment_id.
 *
 * IMPORTANT: each copy gets its OWN order. `payments_one_captured_per_order`
 * is a partial unique index allowing a single CAPTURED payment per order,
 * so putting every copy on one order would violate that constraint instead
 * of the one under test — the insert would fail and the fixture would be
 * testing nothing.
 */
export async function seedDuplicatePayments(
  db: Queryable,
  context: TestRunContext,
  options: SeedOptions = {},
): Promise<DuplicateFixture> {
  const copies = requireCopies(options.copies);
  const duplicatedValue = context.id('pay', 'dup');
  const orderIds: string[] = [];
  const paymentIds: string[] = [];

  for (let i = 0; i < copies; i += 1) {
    const orderId = await seedOrder(db, context, `pay${i}`);
    orderIds.push(orderId);
    const paymentId = context.id('payment', `dup${i}`);
    await db.query(
      `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise,
                             currency, status, updated_at)
       VALUES ($1, $2, $3, $4, 'INR', 'CAPTURED', now())`,
      [paymentId, duplicatedValue, orderId, AMOUNT_PAISE],
    );
    paymentIds.push(context.trackPayment(paymentId));
  }

  return {
    kind: 'payment',
    duplicatedValue,
    target: { table: 'payments', column: 'razorpay_payment_id' },
    copies,
    orderIds,
    paymentIds,
    webhookEventIds: [],
    metaEventIds: [],
  };
}

/** N webhook events sharing one razorpay_event_id. No order needed. */
export async function seedDuplicateWebhookEvents(
  db: Queryable,
  context: TestRunContext,
  options: SeedOptions = {},
): Promise<DuplicateFixture> {
  const copies = requireCopies(options.copies);
  const duplicatedValue = context.id('evt', 'dup');
  const webhookEventIds: string[] = [];

  for (let i = 0; i < copies; i += 1) {
    const id = context.id('webhook', `dup${i}`);
    await db.query(
      `INSERT INTO webhook_events (id, razorpay_event_id, event_name, payload,
                                   signature_valid, updated_at)
       VALUES ($1, $2, 'payment.captured', $3::jsonb, true, now())`,
      [id, duplicatedValue, JSON.stringify({ fixture: true, runId: context.runId })],
    );
    webhookEventIds.push(context.trackWebhookEvent(id));
  }

  return {
    kind: 'webhookEvent',
    duplicatedValue,
    target: { table: 'webhook_events', column: 'razorpay_event_id' },
    copies,
    orderIds: [],
    paymentIds: [],
    webhookEventIds,
    metaEventIds: [],
  };
}

/**
 * N meta events sharing one meta_event_id.
 *
 * Each copy gets its own order, so this fixture collides ONLY on
 * meta_event_id. Sharing an order would also collide on order_id and the
 * test could not tell which rule fired.
 */
export async function seedDuplicateMetaEvents(
  db: Queryable,
  context: TestRunContext,
  options: SeedOptions = {},
): Promise<DuplicateFixture> {
  const copies = requireCopies(options.copies);
  const duplicatedValue = context.id('purchase', 'dup');
  const orderIds: string[] = [];
  const metaEventIds: string[] = [];

  const paymentIds: string[] = [];
  for (let i = 0; i < copies; i += 1) {
    const orderId = await seedOrder(db, context, `meta${i}`);
    orderIds.push(orderId);
    paymentIds.push(await seedCapturedPayment(db, context, orderId, `meta${i}`));
    const id = context.id('metaevent', `dup${i}`);
    await db.query(
      `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product,
                                value_paise, currency, updated_at)
       VALUES ($1, $2, $3, 'Purchase', 'ai_freelancing_499', $4, 'INR', now())`,
      [id, duplicatedValue, orderId, AMOUNT_PAISE],
    );
    metaEventIds.push(context.trackMetaEvent(id));
  }

  return {
    kind: 'metaEvent',
    duplicatedValue,
    target: { table: 'meta_events', column: 'meta_event_id' },
    copies,
    orderIds,
    paymentIds,
    webhookEventIds: [],
    metaEventIds,
  };
}

/**
 * N meta events sharing one order_id, each with a DISTINCT meta_event_id —
 * so this collides only on order_id.
 */
export async function seedDuplicateOrders(
  db: Queryable,
  context: TestRunContext,
  options: SeedOptions = {},
): Promise<DuplicateFixture> {
  const copies = requireCopies(options.copies);
  const orderId = await seedOrder(db, context, 'shared');
  const paymentId = await seedCapturedPayment(db, context, orderId, 'shared');
  const metaEventIds: string[] = [];

  for (let i = 0; i < copies; i += 1) {
    const id = context.id('metaorder', `dup${i}`);
    await db.query(
      `INSERT INTO meta_events (id, meta_event_id, order_id, event_name, product,
                                value_paise, currency, updated_at)
       VALUES ($1, $2, $3, 'Purchase', 'ai_freelancing_499', $4, 'INR', now())`,
      [id, context.id('purchase', `unique${i}`), orderId, AMOUNT_PAISE],
    );
    metaEventIds.push(context.trackMetaEvent(id));
  }

  return {
    kind: 'order',
    duplicatedValue: orderId,
    target: { table: 'meta_events', column: 'order_id' },
    copies,
    orderIds: [orderId],
    paymentIds: [paymentId],
    webhookEventIds: [],
    metaEventIds,
  };
}

// --- dispatcher ----------------------------------------------------------

export interface SeedDuplicatesResult extends SeededIds {
  fixtures: DuplicateFixture[];
}

/** Seeds one kind, or every kind when `kind` is 'all'. */
export async function seedDuplicates(
  db: Queryable,
  context: TestRunContext,
  kind: DuplicateIdentifierKind,
  options: SeedOptions = {},
): Promise<SeedDuplicatesResult> {
  const kinds = kind === 'all' ? DUPLICATE_KINDS : [kind];
  const fixtures: DuplicateFixture[] = [];

  for (const one of kinds) {
    fixtures.push(await seedOne(db, context, one, options));
  }

  return { fixtures, ...mergeIds(fixtures) };
}

async function seedOne(
  db: Queryable,
  context: TestRunContext,
  kind: Exclude<DuplicateIdentifierKind, 'all'>,
  options: SeedOptions,
): Promise<DuplicateFixture> {
  switch (kind) {
    case 'payment':
      return seedDuplicatePayments(db, context, options);
    case 'webhookEvent':
      return seedDuplicateWebhookEvents(db, context, options);
    case 'metaEvent':
      return seedDuplicateMetaEvents(db, context, options);
    case 'order':
      return seedDuplicateOrders(db, context, options);
  }
}

/** Union of every fixture's ids, de-duplicated (orders are shared). */
export function mergeIds(fixtures: readonly SeededIds[]): SeededIds {
  const unique = (lists: string[][]) => [...new Set(lists.flat())];
  return {
    orderIds: unique(fixtures.map((f) => f.orderIds)),
    paymentIds: unique(fixtures.map((f) => f.paymentIds)),
    webhookEventIds: unique(fixtures.map((f) => f.webhookEventIds)),
    metaEventIds: unique(fixtures.map((f) => f.metaEventIds)),
  };
}

function requireCopies(copies: number | undefined): number {
  const value = copies ?? 2;
  if (!Number.isInteger(value) || value < 2) {
    throw new RangeError(`a duplicate needs at least 2 copies, received ${String(copies)}`);
  }
  return value;
}
