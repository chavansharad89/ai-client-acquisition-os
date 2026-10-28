import type { SqlClient } from './contentItemRepository';

// Read/write side of cms_asset_upload_sessions (migration 0068,
// CMS-PO-010(R2)-G) -- the canonical source of truth for "this upload
// was authorized at this time and has not yet been completed." Mirrors
// obsoleteObjectRepository.ts's shape and conventions exactly: pure
// bookkeeping, no title/description/MIME/version metadata (a row's own
// existence IS the "pending" state). Never exposed through any
// customer- or admin-facing route -- its only callers are
// assetIngestionService.ts (create at authorization, consume at
// completion) and the abandoned-upload cleanup tick
// (apps/worker/src/cmsCleanup/abandonedUploadWorker.ts).
// -----------------------------------------------------------------------

export interface UploadSession {
  id: string;
  storageKey: string;
  owningProductId: string;
  createdAt: Date;
}

export interface NewUploadSession {
  /** Always the caller's own `randomUUID()` (assetIngestionService.ts) -- the same value already embedded in `storageKey` via `buildAssetStorageKey()`. Never DB-generated. */
  id: string;
  storageKey: string;
  owningProductId: string;
}

export interface UploadSessionRepository {
  /** Records one authorized-but-not-yet-completed upload. */
  create(input: NewUploadSession): Promise<UploadSession>;

  /** The session for this exact storage key, or null. Used by `completeAssetUpload()` to resolve which session a completion consumes. */
  findByStorageKey(storageKey: string): Promise<UploadSession | null>;

  /** Every session with `createdAt <= cutoff` ("older than the abandoned-upload age threshold"), oldest first, bounded by `limit`. `cutoff` is the caller's already-computed `now - 24h`, not `now()` itself -- this never reasons about "now" on its own. Uses `cms_asset_upload_sessions_created_at_idx` (migration 0068). */
  findOlderThan(cutoff: Date, limit: number): Promise<readonly UploadSession[]>;

  /** True iff some `content_items` row CURRENTLY has this exact `storageKey` (uses `content_items_storage_key_idx`, migration 0067) -- the mandatory safety check before any physical deletion, mirroring `ObsoleteObjectRepository`'s identically-named method. The database is the sole source of truth; a session's age never by itself authorizes deletion. */
  isStorageKeyCurrentlyReferenced(storageKey: string): Promise<boolean>;

  /** Removes one session row by id, once consumption (completion) or physical-object deletion/confirmed-absence (abandoned-upload cleanup) has already succeeded. Safe to call on an id that no longer exists -- affects zero rows rather than erroring. */
  deleteById(id: string): Promise<void>;
}

interface UploadSessionRow {
  id: string;
  storage_key: string;
  owning_product_id: string;
  created_at: Date;
}

function toUploadSession(row: UploadSessionRow): UploadSession {
  return {
    id: row.id,
    storageKey: row.storage_key,
    owningProductId: row.owning_product_id,
    createdAt: row.created_at,
  };
}

const COLUMNS = 'id, storage_key, owning_product_id, created_at';

export function createPgUploadSessionRepository(sql: SqlClient): UploadSessionRepository {
  return {
    async create(input) {
      const { rows } = await sql.query(
        `INSERT INTO cms_asset_upload_sessions (id, storage_key, owning_product_id)
         VALUES ($1, $2, $3)
         RETURNING ${COLUMNS}`,
        [input.id, input.storageKey, input.owningProductId],
      );
      return toUploadSession(rows[0] as UploadSessionRow);
    },

    async findByStorageKey(storageKey) {
      const { rows } = await sql.query(`SELECT ${COLUMNS} FROM cms_asset_upload_sessions WHERE storage_key = $1`, [
        storageKey,
      ]);
      return rows[0] ? toUploadSession(rows[0] as UploadSessionRow) : null;
    },

    async findOlderThan(cutoff, limit) {
      const { rows } = await sql.query(
        `SELECT ${COLUMNS} FROM cms_asset_upload_sessions WHERE created_at <= $1 ORDER BY created_at ASC LIMIT $2`,
        [cutoff, limit],
      );
      return (rows as UploadSessionRow[]).map(toUploadSession);
    },

    async isStorageKeyCurrentlyReferenced(storageKey) {
      const { rows } = await sql.query(`SELECT 1 FROM content_items WHERE storage_key = $1 LIMIT 1`, [storageKey]);
      return rows.length > 0;
    },

    async deleteById(id) {
      await sql.query(`DELETE FROM cms_asset_upload_sessions WHERE id = $1`, [id]);
    },
  };
}
