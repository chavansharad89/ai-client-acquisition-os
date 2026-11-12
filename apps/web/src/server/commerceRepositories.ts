import {
  createPgCmsAdminRepository,
  createPgContentItemRepository,
  createPgPlanDisplayNameRepository,
  createPgUploadSessionRepository,
} from '@acos/core-cms';
import { createPgEntitlementRepository } from '@acos/core-entitlements';
import { createPgIdentityRepository } from '@acos/core-identity';
import { createPgSubscriptionPeriodRepository } from '@acos/core-subscriptions';

import { getAssetStorage } from './assetStorage';
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
//
// `cmsAdmins`/`planDisplayNames` were added for CMS Phase 4's admin API
// routes (apps/web/app/api/cms/admin/**) — `cmsAdmins` backs
// `requireCmsAdmin()`'s authorization check, and `planDisplayNames`
// backs the admin display-name read/update routes, independent of
// `contentItems`/`subscriptionPeriods` (admin authorization and
// customer content access are two separate systems; see
// requirement/CMS_PO_006_ADMINISTRATOR_AUTHORIZATION_PO_DECISION.md).
//
// `storage` was added for CMS-PO-010(R2)'s admin asset-upload routes
// (apps/web/app/api/cms/admin/assets/**) — the R2-backed AssetStorage
// singleton (assetStorage.ts), passed straight to
// @acos/core-cms's requestAssetUploadAuthorization()/completeAssetUpload().
//
// `uploadSessions` was added for CMS-PO-010(R2)-G's upload-session
// persistence (migration 0068) — requestAssetUploadAuthorization() now
// requires it; completeAssetUpload() uses it, when present, to consume
// the matching session row on success.
//
// `pool` was added for the publish-replacement route
// (apps/web/app/api/cms/admin/assets/publish-replacement) — the only
// caller that needs it. `publishReplacement`/`publishReplacementTransaction`
// (@acos/core-cms) takes a raw `SqlPool` (its own pinned-connection,
// `FOR UPDATE` transaction), not a repository, so there is nothing to
// wrap here -- the same shared pool every other entry in this object is
// already built from.
export function commerceRepositories() {
  const sql = getPool();
  return {
    entitlements: createPgEntitlementRepository(sql),
    identity: createPgIdentityRepository(sql),
    subscriptionPeriods: createPgSubscriptionPeriodRepository(sql),
    contentItems: createPgContentItemRepository(sql),
    cmsAdmins: createPgCmsAdminRepository(sql),
    planDisplayNames: createPgPlanDisplayNameRepository(sql),
    storage: getAssetStorage(),
    uploadSessions: createPgUploadSessionRepository(sql),
    pool: sql,
  };
}

export type CommerceRepositories = ReturnType<typeof commerceRepositories>;
