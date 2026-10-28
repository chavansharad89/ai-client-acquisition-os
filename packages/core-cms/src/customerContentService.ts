import type { ContentItemRepository } from './contentItemRepository';
import type { ContentItem } from './types';

// Customer-facing content service (PO-2/PO-3/PO-5, Phase 3D), the
// PUBLISHED-only, access-aware counterpart to contentService.ts's admin
// (any-status) view.
// -----------------------------------------------------------------------
// CRITICAL ACCESS RULE: this module has NO knowledge of users,
// sessions, entitlements, or `subscription_periods` -- it never
// computes who is allowed to see what. `permittedProductIds` must be
// supplied by the caller, computed via the one canonical access
// decision (`permittedContentPlans` in @acos/core-subscriptions'
// cmsAccess.ts). That keeps core-cms from depending on
// core-subscriptions for anything beyond the CMS-eligible-product list
// (see contentService.ts/displayNameService.ts) and guarantees there is
// only ever one Plus/Pro/Max inheritance algorithm in this codebase --
// see apps/web/src/server/cmsContentService.ts for where the two are
// composed.
// -----------------------------------------------------------------------

export interface CustomerContentServiceDeps {
  contentItems: ContentItemRepository;
}

/**
 * Every PUBLISHED node owned by any plan in `permittedProductIds`.
 * DRAFT and ARCHIVED nodes are never returned, regardless of plan --
 * only an admin-facing call (contentService.ts) can see those. An
 * empty `permittedProductIds` (e.g. an expired subscription) yields an
 * empty result, never an error.
 */
export async function listPublishedContentForPlans(
  deps: CustomerContentServiceDeps,
  permittedProductIds: ReadonlySet<string>,
): Promise<readonly ContentItem[]> {
  const perPlan = await Promise.all(
    [...permittedProductIds].map((productId) => deps.contentItems.findAllByOwningProduct(productId)),
  );
  return perPlan.flat().filter((item) => item.status === 'PUBLISHED');
}

/**
 * A single node by id, but ONLY if it is PUBLISHED and its
 * `owningProductId` is in `permittedProductIds` -- returns null in
 * every other case (doesn't exist, is DRAFT/ARCHIVED, or belongs to a
 * plan the caller isn't permitted), so an unauthorized caller can never
 * distinguish "this doesn't exist" from "this exists but you can't see
 * it" (no existence leak across the Plus/Pro boundary).
 */
export async function getPublishedContentItemForPlans(
  deps: CustomerContentServiceDeps,
  id: string,
  permittedProductIds: ReadonlySet<string>,
): Promise<ContentItem | null> {
  const item = await deps.contentItems.findById(id);
  if (!item) return null;
  if (item.status !== 'PUBLISHED') return null;
  if (!permittedProductIds.has(item.owningProductId)) return null;
  return item;
}
