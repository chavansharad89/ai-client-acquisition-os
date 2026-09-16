// Redaction for anything on its way to a log.
// -----------------------------------------------------------------------
// THE DEFECT THIS CLOSES (docs/SECURITY.md M-5). The logger passed its
// `meta` argument straight to `console.*`. That is not a bug until
// somebody writes the most natural line in the codebase —
// `logger.error('webhook failed', { order })` or `{ payload }` — at which
// point every customer email, phone number and UPI handle in that object
// is in log aggregation, which is a system with different retention,
// different access control and usually a different vendor from the
// database the data was careful to stay inside.
//
// Logs are the easiest place to leak PII and the hardest place to unleak
// it: they fan out to a search index, a retention tier and a dashboard
// before anyone notices, and there is no UPDATE that reaches all three.
//
// KEY-BASED, NOT VALUE-BASED. This redacts by field NAME. Scanning values
// for things that look like emails would be both slower and wrong — it
// would miss a phone number formatted unusually and redact an order id
// that happened to contain an @. A name is a stable, reviewable contract;
// a value heuristic is a guess that fails silently in both directions.
//
// FAIL-SAFE ON DEPTH AND SIZE. Cycles, giant arrays and deep nesting are
// all truncated rather than followed. A logger that throws while logging
// an error destroys the diagnostic it was called to record.
// -----------------------------------------------------------------------

/**
 * Field names whose VALUE never reaches a log.
 *
 * Matched case-insensitively against the key, ignoring `_`, `-` and `.`,
 * so `customerEmail`, `customer_email` and `CUSTOMER-EMAIL` are one
 * entry. Substring matching, deliberately: `email` covers `customerEmail`,
 * `billingEmail` and `email_address` without three entries that can drift
 * apart.
 */
export const REDACTED_KEYS: readonly string[] = [
  // --- direct identifiers ---
  'email',
  'phone',
  'contact',
  'customername',
  'firstname',
  'lastname',
  'fullname',
  'address',
  'postcode',
  'zipcode',

  // --- payment instruments ---
  'card',
  'cardnumber',
  'pan',
  'cvv',
  'expiry',
  'vpa',
  'upi',
  'bankaccount',
  'ifsc',
  'accountnumber',

  // --- credentials and capabilities ---
  'password',
  'secret',
  'token',
  'apikey',
  'authorization',
  'cookie',
  'signature',
  'grant',
  'sessionid',

  // --- whole provider bodies, which contain all of the above ---
  'payload',
  'body',
  'rawbody',
  'notes',
];

/** What replaces a redacted value. A fixed string, not a masked prefix. */
export const REDACTED = '[redacted]';

/**
 * Keys that are safe and useful, even though a rule above would catch
 * them. Correlating a log line to a payment is the entire point of
 * logging it, and these identify a transaction rather than a person.
 *
 * Checked before REDACTED_KEYS, so this list wins.
 */
export const ALLOWED_KEYS: readonly string[] = [
  'razorpaypaymentid',
  'razorpayorderid',
  'razorpayeventid',
  'metaeventid',
  'orderid',
  'paymentid',
  'eventid',
  'correlationid',
  'requestid',
  'idempotencykey',
  'tokenhash', // a hash is not the token
];

const MAX_DEPTH = 6;
const MAX_ARRAY = 50;
const MAX_STRING = 2_000;

function normalise(key: string): string {
  return key.toLowerCase().replace(/[_\-.\s]/g, '');
}

/** Whether a field name's value must be withheld. */
export function isRedactedKey(key: string): boolean {
  const k = normalise(key);
  if (ALLOWED_KEYS.some((allowed) => k === allowed)) return false;
  return REDACTED_KEYS.some((banned) => k.includes(banned));
}

/**
 * Returns a copy of `value` with every sensitive field replaced.
 *
 * Total: it never throws, whatever it is given. A getter that explodes,
 * a cyclic object graph, a 10 MB string and a BigInt all produce a log
 * line rather than an exception inside the error handler.
 */
export function redact(value: unknown): unknown {
  return walk(value, 0, new WeakSet());
}

function walk(value: unknown, depth: number, seen: WeakSet<object>): unknown {
  if (value === null || value === undefined) return value;

  const type = typeof value;
  if (type === 'string') {
    const s = value as string;
    return s.length > MAX_STRING ? `${s.slice(0, MAX_STRING)}…[${s.length} chars]` : s;
  }
  if (type === 'number' || type === 'boolean') return value;
  if (type === 'bigint') return `${(value as bigint).toString()}n`;
  if (type === 'function') return '[function]';
  if (type === 'symbol') return (value as symbol).toString();

  if (value instanceof Date) return value.toISOString();
  if (value instanceof Error) {
    // The message and stack, never the custom properties an error may
    // carry — those are frequently the request that failed.
    return { name: value.name, message: value.message, stack: value.stack };
  }

  if (depth >= MAX_DEPTH) return '[depth limit]';

  const obj = value as object;
  // Cycles are common in ORM results and HTTP objects, and following one
  // hangs the process that was trying to report a problem.
  if (seen.has(obj)) return '[circular]';
  seen.add(obj);

  try {
    if (Array.isArray(value)) {
      const items = value.slice(0, MAX_ARRAY).map((item) => walk(item, depth + 1, seen));
      if (value.length > MAX_ARRAY) items.push(`…${value.length - MAX_ARRAY} more`);
      return items;
    }

    if (value instanceof Map) return walk(Object.fromEntries(value), depth, seen);
    if (value instanceof Set) return walk([...value], depth, seen);

    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>)) {
      if (isRedactedKey(key)) {
        out[key] = REDACTED;
        continue;
      }
      try {
        out[key] = walk((value as Record<string, unknown>)[key], depth + 1, seen);
      } catch {
        // A throwing getter must not take the log line with it.
        out[key] = '[unreadable]';
      }
    }
    return out;
  } finally {
    seen.delete(obj);
  }
}
