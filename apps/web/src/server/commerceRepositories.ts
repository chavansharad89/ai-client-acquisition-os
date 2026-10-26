import { createPgContentItemRepository } from '@acos/core-cms';
import { createPgEntitlementRepository } from '@acos/core-entitlements';
import { createPgIdentityRepository } from '@acos/core-identity';
import { createPgSubscriptionPeriodRepository } from '@acos/core-subscriptions';

import { getPool } from './db';

// One repository set for the ₹99-and-up claim/account/library surface,
// mirroring clientFinderRepositories.ts's shape and shared-pool
// convention. Deliberately separate from that file: entitlements and
// identity's commerce-facing use (claim, account, library) is a
// different call-site set from the Client Finder MVP UI, even though
// both ultimately wrap the same two packages against the same pool.
//
// `subscriptionPeriods` was added for the FINAL PRODUCT RULE access-gate
// fix (cmsAccessGate.ts) — `/access` and the download route now need it
// alongside `entitlements` to correctly resolve Plus/Pro's 30-day,
// subscription_periods-backed access instead of the old, non-expiring
// entitlement existence check.
//
// `contentItems` was added for CMS Phase 3's customer content API
// routes (cmsContentService.ts) — it's used alongside
// `subscriptionPeriods` to resolve a user's permitted CMS plans and
// then fetch that plan's PUBLISHED content_items rows.
export function commerceRepositories() {
  const sql = getPool();
  return {
    entitlements: createPgEntitlementRepository(sql),
    identity: createPgIdentityRepository(sql),
    subscriptionPeriods: createPgSubscriptionPeriodRepository(sql),
    contentItems: createPgContentItemRepository(sql),
  };
}

export type CommerceRepositories = ReturnType<typeof commerceRepositories>;
