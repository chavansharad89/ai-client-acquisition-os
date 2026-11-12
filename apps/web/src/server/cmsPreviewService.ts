import type { ProductId } from '@acos/catalog';
import {
  listByOwningProduct,
  resolveDisplayName,
  toPublicContentItem,
  type ContentServiceDeps,
  type DisplayNameDeps,
} from '@acos/core-cms';
import { CMS_PLAN_INHERITANCE, CMS_PLAN_PRODUCT_IDS, type CmsPlanProductId } from '@acos/core-subscriptions';

import { buildContentTree, type ContentTreeNode } from '../cms-admin/contentTree';

// Phase 1H admin preview glue, mirroring cmsContentService.ts's role of
// composing @acos/core-subscriptions' plan algebra with @acos/core-cms'
// content retrieval -- except this composes with the admin, any-status
// read (listByOwningProduct) rather than the customer, PUBLISHED-only
// read, since the preview's whole purpose is to also show DRAFT/
// ARCHIVED metadata to the admin. No entitlement lookup of any kind:
// `plan` is a value the admin picked, not a looked-up subscription.
// -----------------------------------------------------------------------

export interface PreviewSection {
  productId: ProductId;
  displayName: string;
  tree: ContentTreeNode[];
}

export interface CmsPreviewServiceDeps extends ContentServiceDeps, DisplayNameDeps {}

/**
 * One section per plan implied by `plan` (via CMS_PLAN_INHERITANCE),
 * always in canonical Plus/Pro/Max order. Every status (DRAFT/
 * PUBLISHED/ARCHIVED) is included -- see customerContentService.ts for
 * the PUBLISHED-only counterpart this deliberately does not call.
 */
export async function buildPreviewSections(
  deps: CmsPreviewServiceDeps,
  plan: CmsPlanProductId,
): Promise<PreviewSection[]> {
  const impliedProductIds = CMS_PLAN_PRODUCT_IDS.filter((id) => CMS_PLAN_INHERITANCE[plan].includes(id));

  // Sequential, not Promise.all -- mirrors findActiveCmsPlans' same
  // single-connection-safety rationale in cmsAccess.ts.
  const sections: PreviewSection[] = [];
  for (const productId of impliedProductIds) {
    const items = (await listByOwningProduct(deps, productId)).map(toPublicContentItem);
    const displayName = await resolveDisplayName(deps, productId);
    sections.push({ productId, displayName, tree: buildContentTree(items) });
  }
  return sections;
}
