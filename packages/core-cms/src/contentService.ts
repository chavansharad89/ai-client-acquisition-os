import { isCmsEligibleProduct } from './cmsEligibility';
import type { ContentItemRepository } from './contentItemRepository';
import { CmsValidationError } from './errors';
import type {
  ContentItem,
  ContentLifecycleStatus,
  NewAssetContentItem,
  NewContainerContentItem,
} from './types';

// Admin-facing content service (PO-2/PO-3/PO-4), the validated entry
// point onto ContentItemRepository for anything that creates or changes
// a node -- as opposed to the repository itself, which trusts its
// caller and leaves cross-row invariants to the DB trigger
// (content_items_match_parent_plan) and CHECK constraints.
// -----------------------------------------------------------------------
// This layer exists to fail with a clean, typed Error *before* a write
// reaches Postgres, for the two invariants the DB can't fully express
// on its own:
//   - "owning_product_id must be one of the three CMS-eligible plans"
//     (the DB column is deliberately the broader catalog `ProductId`,
//     per migration 0062's own comment -- enforcement is an application
//     responsibility, done here).
//   - "a child's parent must itself be a CONTAINER" (the DB only checks
//     that a child's plan matches its parent's plan, not that the
//     parent is container-shaped).
// The trigger/CHECK constraints remain the source of truth and still
// run on every write; this is defense-in-depth with a nicer failure
// mode, not a replacement for them.
// -----------------------------------------------------------------------

export interface ContentServiceDeps {
  contentItems: ContentItemRepository;
}

async function assertValidParent(
  deps: ContentServiceDeps,
  owningProductId: string,
  parentId: string | null,
): Promise<void> {
  if (parentId === null) return;
  const parent = await deps.contentItems.findById(parentId);
  if (!parent) {
    throw new CmsValidationError(
      'parentId',
      'invalid-parent',
      `content_items: parent '${parentId}' does not exist`,
    );
  }
  if (parent.nodeType !== 'CONTAINER') {
    throw new CmsValidationError(
      'parentId',
      'parent-not-container',
      `content_items: parent '${parentId}' is an ASSET and cannot have children`,
    );
  }
  if (parent.owningProductId !== owningProductId) {
    throw new CmsValidationError(
      'owningProductId',
      'cross-plan-parent',
      `content_items: child owning product (${owningProductId}) must match parent owning product (${parent.owningProductId})`,
    );
  }
}

export async function createContainer(
  deps: ContentServiceDeps,
  input: Omit<NewContainerContentItem, 'nodeType'>,
): Promise<ContentItem> {
  if (!isCmsEligibleProduct(input.owningProductId)) {
    throw new CmsValidationError(
      'owningProductId',
      'not-cms-eligible',
      `content_items: '${input.owningProductId}' is not a CMS-eligible product`,
    );
  }
  await assertValidParent(deps, input.owningProductId, input.parentId);
  return deps.contentItems.create({ ...input, nodeType: 'CONTAINER' });
}

export async function createAsset(
  deps: ContentServiceDeps,
  input: Omit<NewAssetContentItem, 'nodeType'>,
): Promise<ContentItem> {
  if (!isCmsEligibleProduct(input.owningProductId)) {
    throw new CmsValidationError(
      'owningProductId',
      'not-cms-eligible',
      `content_items: '${input.owningProductId}' is not a CMS-eligible product`,
    );
  }
  if (input.assetKind.trim().length === 0) {
    throw new CmsValidationError('assetKind', 'blank', 'content_items: assetKind must not be blank');
  }
  if (input.storageKey.trim().length === 0) {
    throw new CmsValidationError('storageKey', 'blank', 'content_items: storageKey must not be blank');
  }
  await assertValidParent(deps, input.owningProductId, input.parentId);
  return deps.contentItems.create({ ...input, nodeType: 'ASSET' });
}

export async function getContentItem(deps: ContentServiceDeps, id: string): Promise<ContentItem | null> {
  return deps.contentItems.findById(id);
}

export async function listChildren(
  deps: ContentServiceDeps,
  parentId: string,
): Promise<readonly ContentItem[]> {
  return deps.contentItems.findChildren(parentId);
}

export async function listRoots(
  deps: ContentServiceDeps,
  owningProductId: string,
): Promise<readonly ContentItem[]> {
  return deps.contentItems.findRootsByOwningProduct(owningProductId);
}

/** Every node for one plan, any status, any depth -- the admin view (customerContentService.ts is the PUBLISHED-only, access-aware counterpart). */
export async function listByOwningProduct(
  deps: ContentServiceDeps,
  owningProductId: string,
): Promise<readonly ContentItem[]> {
  return deps.contentItems.findAllByOwningProduct(owningProductId);
}

export async function updateContentMetadata(
  deps: ContentServiceDeps,
  id: string,
  changes: { title?: string; description?: string | null; orderIndex?: number },
): Promise<ContentItem> {
  if (changes.title !== undefined && changes.title.trim().length === 0) {
    throw new CmsValidationError('title', 'blank', 'content_items: title must not be blank');
  }
  return deps.contentItems.updateMetadata(id, changes);
}

/** DRAFT -> PUBLISHED -> ARCHIVED, or back; no other states exist (PO-4/PO-6(R1)). */
export async function setLifecycleStatus(
  deps: ContentServiceDeps,
  id: string,
  status: ContentLifecycleStatus,
): Promise<ContentItem> {
  return deps.contentItems.setStatus(id, status);
}

/** Archives rather than deletes (PO-4/PO-6(R1)) -- the row is retained, never removed. */
export async function archiveContentItem(deps: ContentServiceDeps, id: string): Promise<ContentItem> {
  return setLifecycleStatus(deps, id, 'ARCHIVED');
}
