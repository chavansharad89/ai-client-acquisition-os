import type {
  ContentItem,
  ContentLifecycleStatus,
  NewContentItem,
  NewReplacementAssetItem,
} from './types';

// Read/write side of content_items (migration 0062).
// -----------------------------------------------------------------------
// Mirrors this repo's existing convention for a small, table-backed
// repository with its own locally-defined SqlClient interface rather
// than depending on @acos/db (same shape as planDisplayNameRepository.ts
// and packages/core-subscriptions/src/subscriptionPeriodRepository.ts).
//
// This is the minimum surface the next CMS phase needs: create a node,
// read a subtree, read a plan's content, and move a node through its
// lifecycle. It does not enforce access rules (that is
// @acos/core-subscriptions' cmsAccess.ts) or admin authorization (not
// yet established in this repo -- see Phase 2 security note).
// -----------------------------------------------------------------------

export interface SqlClient {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

export interface ContentItemRepository {
  /** A single node by id, or null if it does not exist. */
  findById(id: string): Promise<ContentItem | null>;

  /** Direct children of `parentId`, ordered by `orderIndex`. */
  findChildren(parentId: string): Promise<readonly ContentItem[]>;

  /** Root-level nodes (`parentId IS NULL`) owned by `owningProductId`, ordered by `orderIndex`. */
  findRootsByOwningProduct(owningProductId: string): Promise<readonly ContentItem[]>;

  /**
   * Every node owned by `owningProductId`, regardless of depth, ordered
   * by `orderIndex` within each parent. Intended for building the full
   * hierarchy for one plan without N+1 `findChildren` calls.
   */
  findAllByOwningProduct(owningProductId: string): Promise<readonly ContentItem[]>;

  /**
   * Creates a node. The DB's `content_items_node_shape` CHECK is the
   * source of truth for which fields a `CONTAINER` vs `ASSET` may carry;
   * `NewContentItem`'s discriminated union mirrors it at the type level.
   * A child whose `owningProductId` does not match its parent's is
   * rejected by the `content_items_match_parent_plan` trigger, not here.
   */
  create(input: NewContentItem): Promise<ContentItem>;

  /**
   * Moves a node to `status`. Setting `ARCHIVED` stamps `archivedAt`;
   * moving away from `ARCHIVED` (e.g. back to `DRAFT`) clears it -- the
   * DB's `content_items_archived_consistency` CHECK requires exactly one
   * of those to hold. Archiving never deletes the row (PO-4/PO-6(R1)).
   */
  setStatus(id: string, status: ContentLifecycleStatus): Promise<ContentItem>;

  /**
   * Updates title/description/orderIndex in place. Never touches
   * `owningProductId`, `parentId`, `nodeType`, or any asset field -- a
   * node's plan, position in the hierarchy, and container/asset shape
   * are fixed at creation; only its presentation metadata and ordering
   * may change afterward. Omitted fields are left unchanged.
   */
  updateMetadata(
    id: string,
    changes: { title?: string; description?: string | null; orderIndex?: number },
  ): Promise<ContentItem>;

  /**
   * The pending DRAFT replacement for logical asset `contentItemId`, or
   * null if none exists. At most one can ever exist (migration 0066's
   * partial unique index on `replaces_content_item_id`) -- this is a
   * lookup, never a list.
   */
  findPendingReplacement(contentItemId: string): Promise<ContentItem | null>;

  /**
   * Creates a brand-new pending-replacement row (CMS-PO-010(R2) Phase 2
   * -- "Option B", a replacement is an ordinary second `content_items`
   * row, not pending columns on the row it replaces). Always inserts
   * `node_type = 'ASSET'`, `status = 'DRAFT'` -- the input type has no
   * status field, so a caller cannot request anything else. If a pending
   * replacement already exists for `input.replacesContentItemId`, this
   * fails on the DB's own partial unique index (surfaced as a Postgres
   * unique-violation, `error.code === '23505'`) rather than silently
   * creating a second one -- callers that want "replace the existing
   * DRAFT" (CMS-PO-010(R2) Secondary Decision 8) call
   * {@link updatePendingReplacement} instead, or catch that violation and
   * fall back to it (the race this guards against).
   */
  createReplacementAsset(input: NewReplacementAssetItem): Promise<ContentItem>;

  /**
   * Overwrites an existing pending replacement's physical fields in
   * place -- "replace the existing DRAFT" (CMS-PO-010(R2) Secondary
   * Decision 8), never creating a second pending row. Only ever touches
   * a row that is still a genuine pending replacement
   * (`status = 'DRAFT'` and `replaces_content_item_id IS NOT NULL`);
   * throws if `id` no longer satisfies that (e.g. it was concurrently
   * published or is not a replacement at all) rather than silently
   * mutating something else.
   */
  updatePendingReplacement(
    id: string,
    changes: { storageKey: string; assetKind: string; bytes: string },
  ): Promise<ContentItem>;
}

interface ContentItemRow {
  id: string;
  owning_product_id: string;
  parent_id: string | null;
  node_type: 'CONTAINER' | 'ASSET';
  asset_kind: string | null;
  title: string;
  description: string | null;
  storage_key: string | null;
  bytes: string | null;
  order_index: number;
  status: ContentLifecycleStatus;
  archived_at: Date | null;
  created_at: Date;
  updated_at: Date;
  replaces_content_item_id: string | null;
  previous_storage_key: string | null;
  previous_storage_retention_until: Date | null;
}

/** Exported so contentReplacementTransaction.ts's own hand-rolled queries (which need the same row shape under row-locking the plain SqlClient interface doesn't expose) map rows identically rather than duplicating this logic. */
export function toContentItem(row: ContentItemRow): ContentItem {
  return {
    id: row.id,
    owningProductId: row.owning_product_id as ContentItem['owningProductId'],
    parentId: row.parent_id,
    nodeType: row.node_type,
    assetKind: row.asset_kind,
    title: row.title,
    description: row.description,
    storageKey: row.storage_key,
    bytes: row.bytes,
    orderIndex: row.order_index,
    status: row.status,
    archivedAt: row.archived_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    replacesContentItemId: row.replaces_content_item_id,
    previousStorageKey: row.previous_storage_key,
    previousStorageRetentionUntil: row.previous_storage_retention_until,
  };
}

/** Exported for the same reason as {@link toContentItem}. */
export const COLUMNS = `id, owning_product_id, parent_id, node_type, asset_kind, title,
       description, storage_key, bytes, order_index, status, archived_at,
       created_at, updated_at, replaces_content_item_id, previous_storage_key,
       previous_storage_retention_until`;

export function createPgContentItemRepository(sql: SqlClient): ContentItemRepository {
  return {
    async findById(id) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM content_items WHERE id = $1`,
        [id],
      );
      const row = rows[0] as ContentItemRow | undefined;
      return row ? toContentItem(row) : null;
    },

    async findChildren(parentId) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM content_items WHERE parent_id = $1 ORDER BY order_index, id`,
        [parentId],
      );
      return (rows as ContentItemRow[]).map(toContentItem);
    },

    async findRootsByOwningProduct(owningProductId) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM content_items
          WHERE owning_product_id = $1 AND parent_id IS NULL
          ORDER BY order_index, id`,
        [owningProductId],
      );
      return (rows as ContentItemRow[]).map(toContentItem);
    },

    async findAllByOwningProduct(owningProductId) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM content_items
          WHERE owning_product_id = $1
          ORDER BY parent_id NULLS FIRST, order_index, id`,
        [owningProductId],
      );
      return (rows as ContentItemRow[]).map(toContentItem);
    },

    async create(input) {
      const { rows } = await sql.query(
        `INSERT INTO content_items
              (owning_product_id, parent_id, node_type, asset_kind, title,
               description, storage_key, bytes, order_index)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING ${COLUMNS}`,
        [
          input.owningProductId,
          input.parentId,
          input.nodeType,
          input.nodeType === 'ASSET' ? input.assetKind : null,
          input.title,
          input.description ?? null,
          input.nodeType === 'ASSET' ? input.storageKey : null,
          input.nodeType === 'ASSET' ? input.bytes : null,
          input.orderIndex ?? 0,
        ],
      );
      return toContentItem(rows[0] as ContentItemRow);
    },

    async setStatus(id, status) {
      const { rows } = await sql.query(
        `UPDATE content_items
            SET status = $2,
                archived_at = CASE WHEN $2 = 'ARCHIVED' THEN CURRENT_TIMESTAMP ELSE NULL END,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
         RETURNING ${COLUMNS}`,
        [id, status],
      );
      const row = rows[0] as ContentItemRow | undefined;
      if (!row) throw new Error(`content_items: no row with id ${id}`);
      return toContentItem(row);
    },

    async updateMetadata(id, changes) {
      const sets: string[] = [];
      const params: unknown[] = [id];
      if (changes.title !== undefined) {
        params.push(changes.title);
        sets.push(`title = $${params.length}`);
      }
      if (changes.description !== undefined) {
        params.push(changes.description);
        sets.push(`description = $${params.length}`);
      }
      if (changes.orderIndex !== undefined) {
        params.push(changes.orderIndex);
        sets.push(`order_index = $${params.length}`);
      }
      const { rows } = await sql.query(
        `UPDATE content_items
            SET ${sets.length > 0 ? `${sets.join(', ')}, ` : ''}updated_at = CURRENT_TIMESTAMP
          WHERE id = $1
         RETURNING ${COLUMNS}`,
        params,
      );
      const row = rows[0] as ContentItemRow | undefined;
      if (!row) throw new Error(`content_items: no row with id ${id}`);
      return toContentItem(row);
    },

    async findPendingReplacement(contentItemId) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM content_items WHERE replaces_content_item_id = $1`,
        [contentItemId],
      );
      const row = rows[0] as ContentItemRow | undefined;
      return row ? toContentItem(row) : null;
    },

    async createReplacementAsset(input) {
      const { rows } = await sql.query(
        `INSERT INTO content_items
              (owning_product_id, parent_id, node_type, asset_kind, title,
               description, storage_key, bytes, order_index, status,
               replaces_content_item_id)
         VALUES ($1, $2, 'ASSET', $3, $4, $5, $6, $7, $8, 'DRAFT', $9)
         RETURNING ${COLUMNS}`,
        [
          input.owningProductId,
          input.parentId,
          input.assetKind,
          input.title,
          input.description ?? null,
          input.storageKey,
          input.bytes,
          input.orderIndex ?? 0,
          input.replacesContentItemId,
        ],
      );
      return toContentItem(rows[0] as ContentItemRow);
    },

    async updatePendingReplacement(id, changes) {
      const { rows } = await sql.query(
        `UPDATE content_items
            SET storage_key = $2,
                asset_kind = $3,
                bytes = $4,
                updated_at = CURRENT_TIMESTAMP
          WHERE id = $1 AND status = 'DRAFT' AND replaces_content_item_id IS NOT NULL
         RETURNING ${COLUMNS}`,
        [id, changes.storageKey, changes.assetKind, changes.bytes],
      );
      const row = rows[0] as ContentItemRow | undefined;
      if (!row) {
        throw new Error(
          `content_items: '${id}' is not a pending DRAFT replacement (it may already have been published, or never was one)`,
        );
      }
      return toContentItem(row);
    },
  };
}
