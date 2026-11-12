import { getClientFinderSubscriptionStatus } from '@acos/core-subscriptions';

import { commerceRepositories } from './commerceRepositories';

export type MaxSubscriptionStatus =
  | { state: 'active'; expiresAt: Date }
  | { state: 'inactive' }
  | { state: 'unavailable' };

// Read-only display helper for the sidebar's "Your Plans" section —
// NOT an authorization check. The real gate for Client Finder actions
// (contact unlock) is requireClientFinderAccess/hasClientFinderAccess,
// called separately where the unlock itself happens; this never
// substitutes for it. Deliberately reads only subscription_periods via
// the existing getClientFinderSubscriptionStatus() — never
// currentAccess().context.purchased, which cannot represent this
// subscription (it is tracked in a different table, by design: see
// packages/catalog/src/ladder.test.ts's PO-D2 comment).
//
// SubscriptionPeriodRepository exposes only findActiveForUser/getById —
// no "list all periods for this user" method exists — so an expired
// subscription is indistinguishable from "never subscribed" with
// existing services, and is reported as 'inactive' rather than
// fabricating a distinct "expired" state the data can't actually back.
export async function getMaxSubscriptionStatus(userId: string): Promise<MaxSubscriptionStatus> {
  try {
    const { subscriptionPeriods } = commerceRepositories();
    const status = await getClientFinderSubscriptionStatus({ subscriptionPeriods }, userId);
    return status.active && status.expiresAt ? { state: 'active', expiresAt: status.expiresAt } : { state: 'inactive' };
  } catch {
    return { state: 'unavailable' };
  }
}
