import type { ProductId } from '@acos/catalog';

/**
 * CMS-configurable display name for a plan (migration 0061), kept
 * strictly separate from the underlying `ProductId` (@acos/catalog).
 * This row is an override only -- its absence for a given `productId`
 * means "use that product's hardcoded `PRODUCT_CATALOG[productId].name`
 * as the display name," resolved by `resolveDisplayName` in
 * `displayName.ts`, never assumed by this type itself.
 */
export interface PlanDisplayName {
  productId: string;
  displayName: string;
  updatedAt: Date;
  updatedBy: string | null;
}

/**
 * CMS administrator membership (migration 0065, CMS-PO-006(R3)). A
 * user is a CMS administrator if and only if a row exists here for
 * their `userId` -- there is no status/role value to read, only
 * presence. This table has no relationship to entitlements,
 * subscriptions, or payments: nothing a customer purchases can ever
 * produce a row here. Rows are provisioned/revoked only by a trusted
 * operator acting directly against the database -- there is
 * deliberately no write path in `CmsAdminRepository` yet (see
 * cmsAdminRepository.ts).
 */
export interface CmsAdmin {
  userId: string;
  createdAt: Date;
  /** Free-text, operator-supplied; never populated from a client-controlled value. */
  createdBy: string | null;
}

/**
 * `content_items` (migration 0062) models both hierarchy nodes
 * (`CONTAINER` -- chapter/topic/folder) and leaf content (`ASSET` --
 * file/video) in one self-referencing table; which shape a row has is
 * determined by `nodeType`, mirroring the DB's `content_items_node_shape`
 * CHECK constraint.
 */
export type ContentNodeType = 'CONTAINER' | 'ASSET';

/** DRAFT -> PUBLISHED -> ARCHIVED (PO-4/PO-6(R1)); archived rows are retained, never deleted. */
export type ContentLifecycleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

/**
 * `owningProductId` is restricted at the application layer to the three
 * CMS-eligible plans (`CMS_PLAN_PRODUCT_IDS` in
 * `@acos/core-subscriptions`'s `cmsAccess.ts`) -- this package depends
 * only on `@acos/catalog`, so the type here is the broader `ProductId`,
 * same as the DB's plain-TEXT column (see migration 0062's comment).
 */
export interface ContentItem {
  id: string;
  owningProductId: ProductId;
  parentId: string | null;
  nodeType: ContentNodeType;
  /** Non-null only when `nodeType` is `ASSET` (e.g. `'FILE'`, `'VIDEO'`). */
  assetKind: string | null;
  title: string;
  description: string | null;
  /** Non-null only when `nodeType` is `ASSET`. */
  storageKey: string | null;
  /**
   * Non-null only when `nodeType` is `ASSET`. A string, not `number` --
   * the underlying column is `BIGINT` and this repo's `pg` driver returns
   * `BIGINT` values as strings by default to avoid precision loss.
   */
  bytes: string | null;
  orderIndex: number;
  status: ContentLifecycleStatus;
  archivedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  /**
   * Non-null only on a pending-replacement row (`node_type = 'ASSET'`,
   * `status = 'DRAFT'`) -- the logical asset it would replace (migration
   * 0066, CMS-PO-010(R2) Phase 1). At most one row may carry a given
   * value here (DB partial-unique index); a row carrying one is itself
   * consumed (deleted) when `publishReplacementTransaction` succeeds.
   */
  replacesContentItemId: string | null;
  /**
   * The obsolete physical key a row's CURRENT `storageKey` superseded,
   * once a pending replacement is published onto it -- set together with
   * `previousStorageRetentionUntil`, never independently (migration
   * 0066). Null means "no obsolete object is pending retention for this
   * row."
   */
  previousStorageKey: string | null;
  /** When `previousStorageKey`'s physical object becomes eligible for deletion (30 days from the publish that obsoleted it, CMS-PO-010(R2)-G). Null iff `previousStorageKey` is null. */
  previousStorageRetentionUntil: Date | null;
}

/** Input for creating a hierarchy node (chapter/topic/folder) -- no asset fields. */
export interface NewContainerContentItem {
  nodeType: 'CONTAINER';
  owningProductId: ProductId;
  parentId: string | null;
  title: string;
  description?: string | null;
  orderIndex?: number;
}

/** Input for creating a leaf asset (file/video) -- asset fields required. */
export interface NewAssetContentItem {
  nodeType: 'ASSET';
  owningProductId: ProductId;
  parentId: string | null;
  title: string;
  description?: string | null;
  assetKind: string;
  storageKey: string;
  bytes: string;
  orderIndex?: number;
}

export type NewContentItem = NewContainerContentItem | NewAssetContentItem;

/**
 * Input for creating a pending-replacement row (CMS-PO-010(R2) Phase 2):
 * an ordinary ASSET/DRAFT leaf that additionally carries
 * `replacesContentItemId`. Deliberately a separate type from
 * {@link NewAssetContentItem} rather than an optional field on it --
 * every other `content_items` write path (container/asset creation,
 * metadata updates) has nothing to do with replacement, and this keeps
 * that type's existing callers/tests completely unaffected.
 */
export interface NewReplacementAssetItem {
  owningProductId: ProductId;
  parentId: string | null;
  title: string;
  description?: string | null;
  assetKind: string;
  storageKey: string;
  bytes: string;
  orderIndex?: number;
  /** The logical asset this row is a pending replacement for. Must identify an existing ASSET row that is not itself a pending replacement -- enforced by the service layer and, as the final backstop, by migration 0066's constraints/trigger. */
  replacesContentItemId: string;
}
