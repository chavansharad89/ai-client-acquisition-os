import { createPgEntitlementRepository } from '@acos/core-entitlements';
import { createPgIdentityRepository } from '@acos/core-identity';

import { getPool } from './db';

// One repository set for the ₹99-and-up claim/account/library surface,
// mirroring clientFinderRepositories.ts's shape and shared-pool
// convention. Deliberately separate from that file: entitlements and
// identity's commerce-facing use (claim, account, library) is a
// different call-site set from the Client Finder MVP UI, even though
// both ultimately wrap the same two packages against the same pool.
export function commerceRepositories() {
  const sql = getPool();
  return {
    entitlements: createPgEntitlementRepository(sql),
    identity: createPgIdentityRepository(sql),
  };
}

export type CommerceRepositories = ReturnType<typeof commerceRepositories>;
