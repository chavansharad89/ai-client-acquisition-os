import type { ProductId } from '@acos/catalog';

import type { Entitlement, GrantEntitlementInput, GrantResult } from './types';
import type { StoredAccessToken } from './accessToken';

/**
 * Persistence boundary. Mirrors core-payments' OrderRepository so the
 * funnel logic can be tested against a fake, and so only this interface
 * touches entitlement tables.
 */
export interface EntitlementRepository {
  /**
   * Grants, idempotently. The unique index on (customer_email,
   * product_slug) is the arbiter: a second grant reports 'already-held'
   * and returns the existing row rather than failing.
   */
  grant(input: GrantEntitlementInput, now: Date): Promise<GrantResult>;

  /** Active (non-revoked) entitlements for a customer. */
  listActive(customerEmail: string): Promise<readonly Entitlement[]>;

  revoke(entitlementId: string, reason: string, now: Date): Promise<boolean>;

  /** Looks a token up BY HASH. The plaintext never reaches the database. */
  findAccessToken(tokenHash: string): Promise<StoredAccessToken | null>;

  saveAccessToken(input: {
    tokenHash: string;
    customerEmail: string;
    expiresAt: Date;
    now: Date;
  }): Promise<void>;
}

/** Normalises an email the same way the database CHECK requires. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** Directly purchased product ids from a set of entitlements. */
export function purchasedFrom(entitlements: readonly Entitlement[]): readonly ProductId[] {
  return entitlements.filter((e) => e.revokedAt === null).map((e) => e.productSlug);
}
