import type { QualifyingContactKind } from '@acos/core-research';

/**
 * One activated ₹1,499 Client Finder subscription period (migration
 * 0040). Pure time-bounded access -- no credit/balance field anywhere on
 * this type, per
 * CLIENT_FINDER_1499_SUBSCRIPTION_ACCESS_MODEL_PO_DECISION.md §6/§11.
 * Append-only: a row is never updated except once, to set `refundedAt`.
 *
 * `durationDays` is the value snapshotted AT activation (PO-D10/IRL-P) --
 * a later configuration change never retroactively alters an
 * already-granted period. There is no `expiresAt` field: "is this period
 * still active" is always computed from `activationAt + durationDays`
 * and `refundedAt` at read time (IRL-O), never stored or cached.
 */
export interface SubscriptionPeriod {
  id: string;
  userId: string;
  productSlug: string;
  /** Provider subscription identity (reference only, IRL-O -- never the access authority). */
  razorpaySubscriptionId: string;
  /** The specific captured charge that activated THIS period -- the idempotency anchor (migration 0040's unique index). */
  razorpayPaymentId: string;
  activationAt: Date;
  durationDays: number;
  refundedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LeadUnlockContact {
  kind: QualifyingContactKind;
  value: string;
}

/**
 * A permanent, no-credit reveal grant for one Opportunity by one user
 * (migration 0041), plus the specific contact value(s) captured for it
 * at the moment of reveal (migration 0042). Never deleted, never scoped
 * by the granting subscription period's later expiry (IRL-I).
 */
export interface LeadUnlock {
  id: string;
  userId: string;
  opportunityId: string;
  /** Provenance only -- not a re-check gate (IRL-I). */
  subscriptionPeriodId: string;
  unlockedAt: Date;
  createdAt: Date;
  contacts: readonly LeadUnlockContact[];
}
