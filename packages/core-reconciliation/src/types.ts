// Idempotency reconciliation — shared types.
// -----------------------------------------------------------------------
// Literal unions rather than the generated Prisma enums, matching
// core-payments' orderRepository.ts: it keeps every type the detection
// and reporting logic depends on usable without `prisma generate` having
// run, which this sandbox cannot do.
// -----------------------------------------------------------------------

export type IdempotencyRecordType = 'ORDER' | 'PAYMENT' | 'WEBHOOK_EVENT' | 'META_EVENT';

export type ReconciliationStatus = 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'DISMISSED';

/**
 * The four duplicate dimensions Phase 1 detects. `META_EVENT` carries two
 * of them, which is why {@link DuplicateGroup.duplicateKey} is qualified
 * by dimension — see `detection.ts`.
 */
export type DuplicateDimension =
  | 'payment.razorpayPaymentId'
  | 'webhookEvent.razorpayEventId'
  | 'metaEvent.orderId'
  | 'metaEvent.metaEventId';

export const DUPLICATE_DIMENSIONS: readonly DuplicateDimension[] = [
  'payment.razorpayPaymentId',
  'webhookEvent.razorpayEventId',
  'metaEvent.orderId',
  'metaEvent.metaEventId',
];

export const RECORD_TYPE_BY_DIMENSION: Readonly<Record<DuplicateDimension, IdempotencyRecordType>> =
  {
    'payment.razorpayPaymentId': 'PAYMENT',
    'webhookEvent.razorpayEventId': 'WEBHOOK_EVENT',
    'metaEvent.orderId': 'META_EVENT',
    'metaEvent.metaEventId': 'META_EVENT',
  };

/** One detected collision: N rows sharing a key that should have been unique. */
export interface DuplicateGroup {
  dimension: DuplicateDimension;
  recordType: IdempotencyRecordType;
  /** Qualified as `<dimension>=<value>`; see detection.ts for why. */
  duplicateKey: string;
  /** The raw column value, unqualified, for humans and for SQL lookups. */
  rawKey: string;
  /** The TRUE number of rows sharing this key in the window, uncapped. */
  recordCount: number;
  /**
   * Example rows, oldest first, capped by `maxRowsPerGroup`.
   *
   * Deliberately NOT "complete rows, exactly as stored" any more: the
   * webhook payload column is never selected, and large groups are
   * sampled. `recordCount` remains exact, so accuracy is unaffected —
   * what shrank is how much is copied, not what was detected.
   */
  rows: readonly unknown[];
  /** True when the group holds more rows than `rows` shows. */
  sampleTruncated: boolean;
}

/** What gets written to idempotency_reconciliations. */
export interface ReconciliationCase {
  recordType: IdempotencyRecordType;
  duplicateKey: string;
  recordCount: number;
  snapshot: ReconciliationSnapshot;
  status: Extract<ReconciliationStatus, 'OPEN'>;
}

export interface ReconciliationSnapshot {
  dimension: DuplicateDimension;
  rawKey: string;
  recordCount: number;
  detectedAt: string;
  /** Sampled examples. Never contains a provider payload. */
  rows: readonly unknown[];
  sampleTruncated: boolean;
}

export type CasePersistOutcome = 'created' | 'updated';

export interface PersistedCaseResult {
  duplicateKey: string;
  recordType: IdempotencyRecordType;
  outcome: CasePersistOutcome;
}

/** Result of one reconciliation run. */
export interface ReconciliationReport {
  startedAt: Date;
  finishedAt: Date;
  /** The half-open [start, end) range this run actually covered. */
  window: { start: Date; end: Date };
  /** Every dimension scanned, whether or not it found anything. */
  scannedDimensions: readonly DuplicateDimension[];
  groups: readonly DuplicateGroup[];
  created: number;
  updated: number;
  results: readonly PersistedCaseResult[];
  byRecordType: Readonly<Record<IdempotencyRecordType, number>>;
  /** Total duplicate ROWS involved, not the number of groups. */
  affectedRecordCount: number;
}
