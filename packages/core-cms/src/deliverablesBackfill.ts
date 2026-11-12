import { deliverablesFor, PRODUCT_IDS, type ProductId } from '@acos/catalog';

import { assetKindForExtension } from './assetValidation';
import { isCmsEligibleProduct } from './cmsEligibility';
import type { ContentItemRepository } from './contentItemRepository';

// One-time backfill core logic: deliverables.ts -> content_items
// (Customer Fulfillment Phase B, requirement/PLUS_PRO_MAX_CMS_IMPLEMENTATION_SPEC.md
// §14/§17 Phase 4). Lives here, not in scripts/cms/, so it is resolvable
// and typechecked as an ordinary part of this package (which already
// depends on @acos/catalog) — scripts/cms/backfill-content-items-from-
// deliverables.ts is a thin, deliberately-unchecked CLI runner (same
// convention as scripts/deploy-concurrent-indexes.ts /
// @acos/db-index-deploy) that only wires a real `pg.Client` and
// `loadEnv()` to this function.
// -----------------------------------------------------------------------
// Scope is deliberately narrower than "every product deliverables.ts
// lists": only `isCmsEligibleProduct` products are backfilled --
// ai_income_99 and ai_freelancing_499 today. The retired one-time
// `ai_client_acquisition_1499` SKU is explicitly OUT OF CMS SCOPE by an
// existing architectural decision (@acos/core-subscriptions' cmsAccess.ts
// comment: "the retired one-time ai_client_acquisition_1499 SKU is out
// of scope of this CMS and is never a member of this type") -- its four
// deliverables are never migrated, and /access/[productId] keeps reading
// deliverables.ts for that product permanently, not merely during the
// parallel-run window. ai_client_acquisition_1499_subscription has zero
// deliverables (pure feature access, no file bundle), so the loop below
// is a correct no-op for it without any special-casing.
//
// Per column, per spec §14 point 3 and the verified backfill contract:
//   owning_product_id  <- the manifest's product key
//   parent_id           = NULL (flat, no invented hierarchy)
//   node_type           = 'ASSET'
//   asset_kind         <- assetKindForExtension() of the legacy storageKey's
//                         extension -- the SAME function
//                         requestAssetUploadAuthorization/completeAssetUpload
//                         already use for every other CMS asset (no
//                         FILE/VIDEO enum exists -- see assetValidation.ts's
//                         own comment -- so this reuses existing production
//                         behaviour rather than inventing one).
//   title              <- Deliverable.title
//   description         = NULL (no source field on Deliverable)
//   storage_key        <- Deliverable.storageKey, copied unchanged
//   bytes              <- Deliverable.bytes
//   order_index        <- index within the product's array (legacy order)
//   status              = 'PUBLISHED' (not DRAFT -- spec §14 point 3)
//   replacement/lifecycle fields, id, timestamps = DB defaults / NULL
//
// NOT VERIFIED BY THIS FILE, AND NOT POSSIBLE WITHOUT REAL R2 ACCESS:
// the legacy `storageKey` values are paths in a LOCAL FILESYSTEM
// directory (apps/web/src/server/contentStore.ts's `content/` root),
// never an R2 object key. Copying them unchanged (as this function and
// spec §14 both require) produces a content_items row whose storage_key
// does not correspond to any real R2 object today -- the CMS download
// route's signed-URL mechanism will not actually serve these files until
// a SEPARATE content/infrastructure step uploads them to R2 under the
// same key. This function cannot detect or fix that; it is a real
// Stage-4 prerequisite, not an engineering gap in this backfill.
//
// Idempotent: re-running skips any (owningProductId, storageKey) pair
// that already has a content_items row, so a partial or repeated run
// never double-inserts.
// -----------------------------------------------------------------------

export interface DeliverableBackfillRowReport {
  productId: ProductId;
  assetId: string;
  title: string;
  storageKey: string;
  assetKind: string;
  bytes: number;
  orderIndex: number;
  outcome: 'created' | 'skipped-existing' | 'would-create';
}

export function extensionOfLegacyStorageKey(storageKey: string): string {
  const lastDot = storageKey.lastIndexOf('.');
  return lastDot === -1 ? '' : storageKey.slice(lastDot + 1);
}

/**
 * The backfill's core logic, independent of how `contentItems` is wired
 * up (a real Postgres-backed repository in production/verification, or
 * the in-memory `fakeContentItemRepository` in a unit test).
 */
export async function backfillContentItemsFromDeliverables(
  contentItems: Pick<ContentItemRepository, 'findAllByOwningProduct' | 'create' | 'setStatus'>,
  options: { dryRun?: boolean } = {},
): Promise<readonly DeliverableBackfillRowReport[]> {
  const dryRun = options.dryRun ?? false;
  const reports: DeliverableBackfillRowReport[] = [];

  for (const productId of PRODUCT_IDS.filter(isCmsEligibleProduct)) {
    const legacyAssets = deliverablesFor(productId);
    if (legacyAssets.length === 0) continue;

    const existing = await contentItems.findAllByOwningProduct(productId);
    const existingByStorageKey = new Map(
      existing.filter((item) => item.storageKey !== null).map((item) => [item.storageKey, item] as const),
    );

    for (let orderIndex = 0; orderIndex < legacyAssets.length; orderIndex += 1) {
      const asset = legacyAssets[orderIndex]!;

      const existingRow = existingByStorageKey.get(asset.storageKey);
      if (existingRow) {
        // Security-review finding (I-4): `create` + `setStatus` below are
        // two separate statements, not one transaction. A row stranded in
        // DRAFT by a failure between them (fails closed — DRAFT is never
        // served — but was previously left that way forever on re-run) is
        // repaired forward here instead of silently treated as done.
        if (existingRow.status !== 'PUBLISHED' && !dryRun) {
          await contentItems.setStatus(existingRow.id, 'PUBLISHED');
        }
        reports.push({
          productId,
          assetId: asset.id,
          title: asset.title,
          storageKey: asset.storageKey,
          assetKind: '(unchanged)',
          bytes: asset.bytes,
          orderIndex,
          outcome: 'skipped-existing',
        });
        continue;
      }

      const extension = extensionOfLegacyStorageKey(asset.storageKey);
      const assetKind = assetKindForExtension(extension);
      if (!extension || assetKind.length === 0) {
        throw new Error(
          `${productId}/${asset.id}: storageKey '${asset.storageKey}' has no parseable extension — refusing to backfill an asset with no derivable asset_kind`,
        );
      }

      if (dryRun) {
        reports.push({
          productId,
          assetId: asset.id,
          title: asset.title,
          storageKey: asset.storageKey,
          assetKind,
          bytes: asset.bytes,
          orderIndex,
          outcome: 'would-create',
        });
        continue;
      }

      const created = await contentItems.create({
        nodeType: 'ASSET',
        owningProductId: productId,
        parentId: null,
        title: asset.title,
        description: null,
        assetKind,
        storageKey: asset.storageKey,
        bytes: String(asset.bytes),
        orderIndex,
      });
      await contentItems.setStatus(created.id, 'PUBLISHED');

      reports.push({
        productId,
        assetId: asset.id,
        title: asset.title,
        storageKey: asset.storageKey,
        assetKind,
        bytes: asset.bytes,
        orderIndex,
        outcome: 'created',
      });
    }
  }

  return reports;
}
