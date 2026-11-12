import {
  getPublishedContentItemForPlans,
  listPublishedContentForPlans,
  type ContentItem,
  type CustomerContentServiceDeps,
} from '@acos/core-cms';
import { permittedContentPlans, type CmsAccessDeps } from '@acos/core-subscriptions';

// Customer CMS content glue (Phase 3D), the one place the canonical
// access decision (`permittedContentPlans`, @acos/core-subscriptions)
// is composed with CMS content retrieval
// (`listPublishedContentForPlans`/`getPublishedContentItemForPlans`,
// @acos/core-cms). Mirrors cmsAccessGate.ts's role of gluing two
// package-level domains together at the app layer, so neither package
// needs to depend on the other for this.
// -----------------------------------------------------------------------
// CRITICAL ACCESS RULE: this is the ONLY access computation for CMS
// content. It does not reimplement Plus/Pro/Max inheritance or
// expiry -- both come from `permittedContentPlans`, unchanged.
// -----------------------------------------------------------------------

export interface CmsContentDeps extends CmsAccessDeps, CustomerContentServiceDeps {}

export async function listAccessibleCmsContent(
  deps: CmsContentDeps,
  userId: string,
  now: Date = new Date(),
): Promise<readonly ContentItem[]> {
  const permitted = await permittedContentPlans(deps, userId, now);
  return listPublishedContentForPlans(deps, permitted);
}

export async function getAccessibleCmsContentItem(
  deps: CmsContentDeps,
  userId: string,
  id: string,
  now: Date = new Date(),
): Promise<ContentItem | null> {
  const permitted = await permittedContentPlans(deps, userId, now);
  return getPublishedContentItemForPlans(deps, id, permitted);
}
