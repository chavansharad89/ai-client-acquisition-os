import type { ContentItemRepository } from './contentItemRepository';
import type { ContentItem } from './types';

// CMS-PO-015 (LI-001/LI-002/LI-003): an item is effectively PUBLISHED
// only when its own stored status AND every ancestor's stored status,
// up to the root, are PUBLISHED. A DRAFT/ARCHIVED ancestor at ANY level
// -- not only the immediate parent -- hides the whole descendant chain.
// Restoring a parent never re-publishes a descendant whose own status
// was independently changed (no physical cascade, status is never
// written here -- effective status is computed at read time only).
// Enforced centrally in the two functions below, per the approved
// enforcement-point decision (TD-001) -- this is the one place every
// customer-facing CMS read path, current and future, ultimately
// converges on (see this file's own pre-existing "ONLY access
// computation" note above).

/**
 * Whether `chain` -- the item itself (index 0), then its ancestors up to
 * the root, exactly as {@link ContentItemRepository.findWithAncestorChain}
 * returns it -- represents an effectively-PUBLISHED item. A chain that
 * did not reach a legitimate root (its last element's `parentId` is not
 * null -- a missing ancestor, or a defensively-broken cycle) fails
 * closed: it is never treated as if it legitimately ended at a root.
 */
function isEffectivelyPublished(chain: readonly ContentItem[]): boolean {
  const last = chain.at(-1);
  if (!last || last.parentId !== null) return false; // cut short -- fail closed, not a root
  return chain.every((node) => node.status === 'PUBLISHED');
}

/**
 * The same effective-status check as {@link isEffectivelyPublished}, but
 * for the list path: rather than a fresh database recursive query per
 * item, it walks the ancestor chain in memory against `byId` -- the
 * full, already-fetched (any status, every depth) per-product row set
 * `listPublishedContentForPlans` already has in hand, so this adds zero
 * additional queries. A child's parent is always owned by the same
 * product (enforced by the DB's own cross-plan trigger), so `byId`,
 * built from one product's complete row set, is always a complete
 * universe for this walk -- it can never be missing a real ancestor.
 */
function isEffectivelyPublishedInMemory(item: ContentItem, byId: ReadonlyMap<string, ContentItem>): boolean {
  if (item.status !== 'PUBLISHED') return false;
  const visited = new Set([item.id]);
  let current = item;
  while (current.parentId !== null) {
    const parent = byId.get(current.parentId);
    if (!parent || visited.has(parent.id)) return false; // missing ancestor or cycle -- fail closed
    if (parent.status !== 'PUBLISHED') return false;
    visited.add(parent.id);
    current = parent;
  }
  return true;
}

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
 * Every EFFECTIVELY PUBLISHED node owned by any plan in
 * `permittedProductIds` (CMS-PO-015): the node's own status is
 * PUBLISHED, and every one of its ancestors up to the root is also
 * PUBLISHED. A DRAFT/ARCHIVED ancestor at any level hides the whole
 * descendant chain, even if a descendant's own stored status is still
 * PUBLISHED. An empty `permittedProductIds` (e.g. an expired
 * subscription) yields an empty result, never an error.
 */
export async function listPublishedContentForPlans(
  deps: CustomerContentServiceDeps,
  permittedProductIds: ReadonlySet<string>,
): Promise<readonly ContentItem[]> {
  const perPlan = await Promise.all(
    [...permittedProductIds].map((productId) => deps.contentItems.findAllByOwningProduct(productId)),
  );
  const allItems = perPlan.flat();
  const byId = new Map(allItems.map((item) => [item.id, item]));
  return allItems.filter((item) => isEffectivelyPublishedInMemory(item, byId));
}

/**
 * A single node by id, but ONLY if it is EFFECTIVELY PUBLISHED
 * (CMS-PO-015: its own status AND every ancestor's status, up to the
 * root, are PUBLISHED) and its `owningProductId` is in
 * `permittedProductIds` -- returns null in every other case (doesn't
 * exist, is DRAFT/ARCHIVED, has a DRAFT/ARCHIVED ancestor at any level,
 * its ancestor chain is cut short, or belongs to a plan the caller
 * isn't permitted), so an unauthorized caller can never distinguish
 * "this doesn't exist" from any of those (no existence leak across the
 * Plus/Pro boundary, nor across the published/hidden boundary).
 *
 * Resolves the item and its complete ancestor chain in one recursive
 * database statement (CMS-PO-015 Option 4B) -- never N sequential
 * per-ancestor lookups. A single SQL statement is evaluated against one
 * Postgres snapshot regardless of isolation level, so this is
 * internally consistent by construction even under a concurrent
 * lifecycle-status change elsewhere.
 */
export async function getPublishedContentItemForPlans(
  deps: CustomerContentServiceDeps,
  id: string,
  permittedProductIds: ReadonlySet<string>,
): Promise<ContentItem | null> {
  const chain = await deps.contentItems.findWithAncestorChain(id);
  if (!chain) return null;
  const item = chain[0]!;
  if (!permittedProductIds.has(item.owningProductId)) return null;
  if (!isEffectivelyPublished(chain)) return null;
  return item;
}
