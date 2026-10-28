import { COLUMNS, toContentItem, type SqlClient } from './contentItemRepository';
import { CmsValidationError } from './errors';
import { createPgObsoleteObjectRepository } from './obsoleteObjectRepository';
import type { ContentItem } from './types';

// CMS-PO-010(R2) -- publishing a pending replacement, atomically.
// -----------------------------------------------------------------------
// Mirrors @acos/core-payments' webhookPgStore.ts exactly: a pinned
// connection, one explicit transaction, BEGIN/COMMIT/ROLLBACK visible in
// this file rather than inferred, `FOR UPDATE` row locks taken before any
// write. This lives in its own file rather than on
// `ContentItemRepository` because every other repository method takes a
// plain `SqlClient` (one query, no transaction); this one genuinely needs
// a pinned connection across several statements, which is a different
// contract worth keeping visibly separate.
//
// Retention model (migration 0067): the asset's OLD storage key becomes
// one row in `content_item_obsolete_objects`, not a single column on
// `content_items`. This is what lets a logical asset accumulate any
// number of independently-retained obsolete objects across successive
// replacements -- migration 0066's previous_storage_key /
// previous_storage_retention_until columns are legacy/unused as of this
// rewiring: nothing here reads or writes them anymore, and nothing else
// in this package ever did either (confirmed by inspection before this
// change -- the only reader/writer was this file's own now-removed
// single-slot guard below).
// -----------------------------------------------------------------------

/** A pool that can hand out a single pinned connection for a transaction -- same shape as webhookPgStore.ts's `SqlPool`. */
export interface SqlPool extends SqlClient {
  connect(): Promise<SqlClient & { release: () => void }>;
}

export interface PublishReplacementInput {
  /** The logical, currently-PUBLISHED (or otherwise live) asset the replacement is published onto. */
  contentItemId: string;
  /** The pending DRAFT replacement the caller believes is current for `contentItemId` -- publish fails if this is stale or wrong, rather than guessing which replacement was meant. */
  expectedPendingReplacementId: string;
}

interface LockedRow {
  id: string;
  owning_product_id: string;
  node_type: 'CONTAINER' | 'ASSET';
  status: string;
  storage_key: string | null;
  asset_kind: string | null;
  bytes: string | null;
  replaces_content_item_id: string | null;
}

const RETENTION_DAYS = 30;

/**
 * Publishes `input.expectedPendingReplacementId` onto
 * `input.contentItemId`, atomically:
 *
 *   1. locks both rows (`FOR UPDATE`) so a concurrent publish of the same
 *      replacement, or a concurrent replace-the-pending-DRAFT update,
 *      cannot interleave with this operation;
 *   2. verifies the replacement actually points at this asset, is
 *      DRAFT, is an ASSET, and shares the same `owningProductId` --
 *      rejecting a stale or mismatched `expectedPendingReplacementId`
 *      rather than guessing;
 *   3. records the asset's OLD storageKey as a new
 *      `content_item_obsolete_objects` row (30-day `retentionUntil`,
 *      migration 0067, CMS-PO-010(R2)-G) -- a logical asset may
 *      accumulate any number of these across successive replacements,
 *      each independently retained; there is deliberately no guard
 *      against publishing again while an earlier obsolete object is
 *      still within its own retention window (see the architecture
 *      review that authorized this table: the single-slot guard that
 *      used to live here was an unstated Phase 1/2 implementation
 *      limitation, never a CMS-PO-010(R2) decision);
 *   4. moves the replacement's storageKey/assetKind/bytes onto the
 *      logical asset, and deletes the now-consumed replacement row;
 *   5. commits, or rolls back the whole thing on any failure -- there is
 *      no intermediate state where the asset's storageKey is null, and
 *      no orphaned obsolete-object row survives a rolled-back attempt.
 *
 * Does not call any storage provider: the physical object is never
 * copied, renamed, or deleted here, and no cleanup job consumes
 * `content_item_obsolete_objects` yet -- both are later phases.
 *
 * Migration 0066's `previous_storage_key`/`previous_storage_retention_until`
 * columns are legacy as of this function and are never read or written
 * here (or anywhere else in this package) -- `content_item_obsolete_objects`
 * is the sole source of truth for replacement retention.
 */
export async function publishReplacementTransaction(
  pool: SqlPool,
  input: PublishReplacementInput,
): Promise<ContentItem> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: assetRows } = await client.query(
      `SELECT ${COLUMNS} FROM content_items WHERE id = $1 FOR UPDATE`,
      [input.contentItemId],
    );
    const asset = assetRows[0] as LockedRow | undefined;
    if (!asset) {
      throw new CmsValidationError(
        'contentItemId',
        'invalid-replacement-target',
        `content_items: '${input.contentItemId}' does not exist`,
      );
    }
    if (asset.node_type !== 'ASSET') {
      throw new CmsValidationError(
        'contentItemId',
        'invalid-replacement-target',
        `content_items: '${input.contentItemId}' is a ${asset.node_type}, not an ASSET`,
      );
    }

    const { rows: pendingRows } = await client.query(
      `SELECT ${COLUMNS} FROM content_items WHERE id = $1 FOR UPDATE`,
      [input.expectedPendingReplacementId],
    );
    const pending = pendingRows[0] as LockedRow | undefined;
    if (
      !pending ||
      pending.replaces_content_item_id !== asset.id ||
      pending.status !== 'DRAFT' ||
      pending.node_type !== 'ASSET' ||
      pending.owning_product_id !== asset.owning_product_id
    ) {
      throw new CmsValidationError(
        'expectedPendingReplacementId',
        'wrong-pending-replacement',
        `content_items: '${input.expectedPendingReplacementId}' is not the current pending` +
          ` replacement for '${asset.id}'`,
      );
    }

    const retentionUntil = new Date(Date.now() + RETENTION_DAYS * 24 * 60 * 60 * 1000);

    // The asset's current (about-to-be-superseded) storageKey is always
    // non-null here: content_items_node_shape (migration 0062) requires
    // a non-null storage_key on every ASSET row, and `asset.node_type`
    // was already confirmed to be 'ASSET' above.
    await createPgObsoleteObjectRepository(client).create({
      contentItemId: asset.id,
      storageKey: asset.storage_key!,
      retentionUntil,
    });

    const { rows: updatedRows } = await client.query(
      `UPDATE content_items
          SET storage_key = $2,
              asset_kind = $3,
              bytes = $4,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
       RETURNING ${COLUMNS}`,
      [asset.id, pending.storage_key, pending.asset_kind, pending.bytes],
    );

    await client.query(`DELETE FROM content_items WHERE id = $1`, [pending.id]);

    await client.query('COMMIT');
    return toContentItem(updatedRows[0] as Parameters<typeof toContentItem>[0]);
  } catch (error) {
    // Best-effort rollback: if this throws too, the original error is the one worth surfacing.
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
