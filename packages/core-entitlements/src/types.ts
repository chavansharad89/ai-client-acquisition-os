import type { ProductId } from '@acos/catalog';

/** A granted right to use a product. Revocation is a timestamp, not a delete. */
export interface Entitlement {
  id: string;
  customerEmail: string;
  productSlug: ProductId;
  orderId: string;
  grantedAt: Date;
  revokedAt: Date | null;
}

export interface GrantEntitlementInput {
  customerEmail: string;
  productSlug: ProductId;
  orderId: string;
}

export type GrantOutcome = 'granted' | 'already-held';

export interface GrantResult {
  outcome: GrantOutcome;
  entitlement: Entitlement;
}

/** Who the request is acting as, once an access token has been verified. */
export interface AccessContext {
  customerEmail: string;
  /** Products granted directly by a purchase, before ladder implication. */
  purchased: readonly ProductId[];
}

/** Everything a funnel page needs to decide what to render. */
export interface FunnelState {
  /** Directly purchased, entry-level first. */
  purchased: readonly ProductId[];
  /** Purchased plus everything those purchases imply. */
  accessible: readonly ProductId[];
  /** The next product to offer, or null when the ladder is complete. */
  upsell: ProductId | null;
  /** True once every rung is accessible. */
  complete: boolean;
  /** Highest rung reached, or -1 for a visitor who owns nothing. */
  tier: number;
}
