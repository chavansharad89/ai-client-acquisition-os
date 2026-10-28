import type { SqlClient } from './contentItemRepository';

// Read/write side of content_item_obsolete_objects (migration 0067,
// CMS-PO-010(R2)) -- the canonical source of truth for "which physical
// object is obsolete, for which logical asset, and when may it be
// deleted." Deliberately minimal: pure bookkeeping, no title/description/
// version metadata (that would make this a version-history table, which
// CMS-PO-010(R2)-F explicitly says is not required). Never exposed
// through any customer- or admin-facing route -- its only intended
// caller, beyond the publish transaction that creates rows here, is a
// future cleanup job (not implemented yet).
// -----------------------------------------------------------------------

export interface ObsoleteContentObject {
  id: string;
  contentItemId: string;
  storageKey: string;
  retentionUntil: Date;
  createdAt: Date;
}

export interface NewObsoleteContentObject {
  contentItemId: string;
  storageKey: string;
  retentionUntil: Date;
}

export interface ObsoleteObjectRepository {
  /** Records one obsolete physical object awaiting retention cleanup. */
  create(input: NewObsoleteContentObject): Promise<ObsoleteContentObject>;

  /** Every obsolete object currently recorded for one logical asset -- zero, one, or many, each with its own independent `retentionUntil`. Used by tests and, later, the cleanup job; not by any customer/admin route. */
  findByContentItemId(contentItemId: string): Promise<readonly ObsoleteContentObject[]>;

  /**
   * Every row whose `retentionUntil <= now`, oldest-expired-first,
   * bounded by `limit` (CMS-PO-010(R2)-G cleanup job's candidate set --
   * see apps/worker's cmsCleanup module). Uses
   * `content_item_obsolete_objects_retention_until_idx` (migration 0067).
   * Expiry alone never authorizes deletion -- see
   * {@link isStorageKeyCurrentlyReferenced}.
   */
  findExpired(now: Date, limit: number): Promise<readonly ObsoleteContentObject[]>;

  /**
   * True iff some `content_items` row CURRENTLY has this exact
   * `storageKey` (uses `content_items_storage_key_idx`, migration 0067).
   * The mandatory safety check before any physical deletion -- the
   * database is the sole source of truth here, never
   * `retentionUntil`/`contentItemId`/row age. A storage key being
   * obsolete in this table does NOT by itself authorize deletion.
   */
  isStorageKeyCurrentlyReferenced(storageKey: string): Promise<boolean>;

  /**
   * Removes one bookkeeping row by id, once its physical object's
   * deletion (or confirmed absence) has already succeeded. Safe to call
   * on an id that no longer exists (e.g. a retried tick) -- affects zero
   * rows rather than erroring.
   */
  deleteById(id: string): Promise<void>;
}

interface ObsoleteObjectRow {
  id: string;
  content_item_id: string;
  storage_key: string;
  retention_until: Date;
  created_at: Date;
}

function toObsoleteContentObject(row: ObsoleteObjectRow): ObsoleteContentObject {
  return {
    id: row.id,
    contentItemId: row.content_item_id,
    storageKey: row.storage_key,
    retentionUntil: row.retention_until,
    createdAt: row.created_at,
  };
}

const COLUMNS = 'id, content_item_id, storage_key, retention_until, created_at';

/**
 * Takes a plain {@link SqlClient}. Within `publishReplacementTransaction`
 * this is deliberately constructed against the SAME pinned transaction
 * connection the publish is already running on (not a fresh pool
 * connection), so the `INSERT` this makes is part of that one atomic
 * transaction -- the same "repository wraps whatever SqlClient it's
 * given" shape every other repository in this package already follows.
 */
export function createPgObsoleteObjectRepository(sql: SqlClient): ObsoleteObjectRepository {
  return {
    async create(input) {
      const { rows } = await sql.query(
        `INSERT INTO content_item_obsolete_objects (content_item_id, storage_key, retention_until)
         VALUES ($1, $2, $3)
         RETURNING ${COLUMNS}`,
        [input.contentItemId, input.storageKey, input.retentionUntil],
      );
      return toObsoleteContentObject(rows[0] as ObsoleteObjectRow);
    },

    async findByContentItemId(contentItemId) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM content_item_obsolete_objects WHERE content_item_id = $1 ORDER BY created_at`,
        [contentItemId],
      );
      return (rows as ObsoleteObjectRow[]).map(toObsoleteContentObject);
    },

    async findExpired(now, limit) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM content_item_obsolete_objects WHERE retention_until <= $1 ORDER BY retention_until ASC LIMIT $2`,
        [now, limit],
      );
      return (rows as ObsoleteObjectRow[]).map(toObsoleteContentObject);
    },

    async isStorageKeyCurrentlyReferenced(storageKey) {
      const { rows } = await sql.query(`SELECT 1 FROM content_items WHERE storage_key = $1 LIMIT 1`, [storageKey]);
      return rows.length > 0;
    },

    async deleteById(id) {
      await sql.query(`DELETE FROM content_item_obsolete_objects WHERE id = $1`, [id]);
    },
  };
}
