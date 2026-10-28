import type { AssetStorage, ObsoleteObjectRepository } from '@acos/core-cms';

// CMS-PO-010(R2) obsolete-object cleanup tick (Phase 6, Part B only --
// see ./index.ts's doc comment for why abandoned-upload cleanup, Part A,
// is NOT implemented here).
// -----------------------------------------------------------------------
// One tick: every content_item_obsolete_objects row whose retention_until
// has passed, oldest first, bounded by batchSize. For each row, the
// MANDATORY safety check (CMS-PO-010(R2)-G) runs before anything is
// deleted: is this exact storage_key currently referenced by any live
// content_items row? If so, the row is left alone entirely -- neither
// the physical object nor the bookkeeping row is touched, and the
// conflict is logged (it should never happen if the publish transaction
// is correct, so seeing one is itself a signal worth surfacing). If not
// referenced, headObject() confirms whether the physical object still
// exists (distinguishing "really deleted this tick" from "already
// absent, e.g. from a previous tick that deleted the object but then
// failed before removing its own bookkeeping row" -- see the DB/storage
// consistency note below) before the bookkeeping row is removed.
//
// DATABASE/STORAGE CONSISTENCY BOUNDARY: Postgres and R2 are never
// atomic with each other. If storage.deleteObject() succeeds but the
// subsequent deleteById() then fails (e.g. a dropped connection), the
// object is gone but its bookkeeping row survives. This is deliberately
// left as a safe, self-healing race rather than solved with a
// distributed transaction: the NEXT tick re-evaluates the same row,
// isStorageKeyCurrentlyReferenced() is still false, headObject() now
// reports absent, and deleteById() is retried -- no object is ever
// deleted twice (delete is idempotent at the provider), and no
// bookkeeping row can be removed while its object might still exist,
// because removal only ever follows a successful delete or a confirmed
// absent headObject() in the SAME attempt. The only state that can
// persist across a crash is "object already gone, row not yet
// removed" -- never the reverse.
// -----------------------------------------------------------------------

export interface CmsObsoleteObjectCleanupTickDeps {
  obsoleteObjects: Pick<
    ObsoleteObjectRepository,
    'findExpired' | 'isStorageKeyCurrentlyReferenced' | 'deleteById'
  >;
  storage: Pick<AssetStorage, 'headObject' | 'deleteObject'>;
  batchSize: number;
  now?: () => Date;
}

export interface CmsObsoleteObjectCleanupTickOutcome {
  scanned: number;
  deleted: number;
  alreadyAbsent: number;
  skippedReferenced: number;
  failed: number;
}

function describeError(cause: unknown): string {
  return cause instanceof Error ? `${cause.name}: ${cause.message}` : String(cause);
}

/**
 * Runs exactly one obsolete-object cleanup tick. A per-row failure is
 * logged and does not stop the batch -- the row simply remains eligible
 * for the next tick (its bookkeeping row is never removed on failure).
 *
 * Deliberately logs `obsoleteObjectId`/`contentItemId` (opaque ids), not
 * the raw `storage_key` -- this package's own convention
 * (contentItemDto.ts, r2AssetStorage.ts) already treats a storage key as
 * internal provider detail to minimize incidentally, even though it is
 * not a credential.
 */
export async function runCmsObsoleteObjectCleanupTick(
  deps: CmsObsoleteObjectCleanupTickDeps,
): Promise<CmsObsoleteObjectCleanupTickOutcome> {
  const now = (deps.now ?? (() => new Date()))();
  const expired = await deps.obsoleteObjects.findExpired(now, deps.batchSize);

  let deleted = 0;
  let alreadyAbsent = 0;
  let skippedReferenced = 0;
  let failed = 0;

  for (const row of expired) {
    try {
      // MANDATORY safety check (CMS-PO-010(R2)-G): the database is the
      // sole source of truth here. retention_until having passed NEVER
      // by itself authorizes deletion.
      const referenced = await deps.obsoleteObjects.isStorageKeyCurrentlyReferenced(row.storageKey);
      if (referenced) {
        skippedReferenced += 1;
        console.error(
          JSON.stringify({
            event: 'cms_cleanup.obsolete.safety_conflict_still_referenced',
            obsoleteObjectId: row.id,
            contentItemId: row.contentItemId,
          }),
        );
        continue;
      }

      const existing = await deps.storage.headObject(row.storageKey);
      if (existing) {
        await deps.storage.deleteObject(row.storageKey);
        deleted += 1;
      } else {
        alreadyAbsent += 1;
      }

      // Only reached once deletion (or confirmed absence) has already
      // succeeded -- see the DB/storage consistency note above.
      await deps.obsoleteObjects.deleteById(row.id);
    } catch (cause) {
      failed += 1;
      console.error(
        JSON.stringify({
          event: 'cms_cleanup.obsolete.failed',
          obsoleteObjectId: row.id,
          error: describeError(cause),
        }),
      );
    }
  }

  const outcome: CmsObsoleteObjectCleanupTickOutcome = {
    scanned: expired.length,
    deleted,
    alreadyAbsent,
    skippedReferenced,
    failed,
  };
  console.log(JSON.stringify({ event: 'cms_cleanup.obsolete.tick_completed', ...outcome }));
  return outcome;
}
