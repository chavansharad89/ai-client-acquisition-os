import type { AssetStorage, UploadSessionRepository } from '@acos/core-cms';

// CMS-PO-010(R2)-G abandoned-upload cleanup tick (Phase 7, Part A --
// the persistence gap this phase closes; see
// ./abandonedUploadWorker.test.ts and the phase's final report for the
// design background). Deliberately a SEPARATE file/tick from
// ./worker.ts's obsolete-object cleanup -- the two bookkeeping tables
// (cms_asset_upload_sessions vs content_item_obsolete_objects) are never
// mixed, and this file makes no change to ./worker.ts at all.
// -----------------------------------------------------------------------
// One tick: every cms_asset_upload_sessions row whose created_at is
// older than the abandoned-upload age threshold (24h, CMS-PO-010(R2)-G),
// oldest first, bounded by batchSize. For each row, the MANDATORY
// safety check -- is this exact storage_key currently referenced by any
// live content_items row? -- runs TWICE, not once:
//
//   #1, before headObject(): a cheap fast-path. If already referenced,
//      skip entirely (no R2 round-trip needed).
//   #2, immediately before deleteObject() -- with NOTHING else awaited
//      in between that check resolving and the delete call firing.
//
// A single check (run only once, before headObject()) is NOT sufficient:
// headObject() is itself a real network round-trip, during which a
// concurrent completion can commit a content_items row referencing this
// exact key (PART 8-A's race -- an admin finally completing an upload at
// the exact moment it crosses the 24h threshold). Check #2 is what
// actually enforces the invariant at the moment it matters; check #1 is
// purely an optimization. If either check finds a reference, NEITHER the
// physical object NOR the session row is touched -- the conflict is
// logged.
//
// DATABASE/STORAGE CONSISTENCY BOUNDARY: Postgres and R2 are still never
// atomic with each other, so this narrows the race window to the
// absolute minimum achievable without a distributed lock (explicitly
// out of scope) or a lock on a content_items row that, by definition,
// does not exist yet at check time: the gap between check #2's SELECT
// resolving and the deleteObject() HTTP call actually reaching R2 --
// sub-millisecond, no other I/O in between. A completion's INSERT would
// have to land inside that exact gap to still race past this guard. This
// residual is accepted and documented, exactly as CMS-PO-010(R2)-G's own
// obsolete-object cleanup (./worker.ts) already accepts the equivalent
// single-check gap for its own, structurally different bookkeeping.
//
// If storage.deleteObject() succeeds but the subsequent deleteById()
// then fails (e.g. a dropped connection), the object is gone but its
// session row survives -- self-healing: the next tick re-evaluates the
// same row, the reference check is still false, headObject() now
// reports absent, and deleteById() is retried. No object is ever
// deleted twice (delete is idempotent at the provider), and a session
// row is never removed before deletion (or confirmed absence) has
// already succeeded in that same attempt.
// -----------------------------------------------------------------------

/** 24 hours (CMS-PO-010(R2)-G's already-approved abandoned-upload policy). */
export const DEFAULT_ABANDONED_UPLOAD_AGE_MS = 24 * 60 * 60 * 1000;

export interface CmsAbandonedUploadCleanupTickDeps {
  uploadSessions: Pick<UploadSessionRepository, 'findOlderThan' | 'isStorageKeyCurrentlyReferenced' | 'deleteById'>;
  storage: Pick<AssetStorage, 'headObject' | 'deleteObject'>;
  batchSize: number;
  now?: () => Date;
  /** Overridable for tests only; production always uses the 24h default. */
  abandonedAfterMs?: number;
}

export interface CmsAbandonedUploadCleanupTickOutcome {
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
 * Runs exactly one abandoned-upload cleanup tick. A per-row failure is
 * logged and does not stop the batch -- the row simply remains eligible
 * for the next tick (its session row is never removed on failure).
 *
 * Deliberately logs `uploadSessionId` (an opaque id), never the raw
 * `storage_key` -- mirrors ./worker.ts's identical convention.
 */
export async function runCmsAbandonedUploadCleanupTick(
  deps: CmsAbandonedUploadCleanupTickDeps,
): Promise<CmsAbandonedUploadCleanupTickOutcome> {
  const now = (deps.now ?? (() => new Date()))();
  const abandonedAfterMs = deps.abandonedAfterMs ?? DEFAULT_ABANDONED_UPLOAD_AGE_MS;
  const cutoff = new Date(now.getTime() - abandonedAfterMs);
  const candidates = await deps.uploadSessions.findOlderThan(cutoff, deps.batchSize);

  let deleted = 0;
  let alreadyAbsent = 0;
  let skippedReferenced = 0;
  let failed = 0;

  for (const session of candidates) {
    try {
      // MANDATORY safety check #1, run first and freshly for every row --
      // never cached, never skipped, never inferred from age alone. A
      // cheap fast-path: if already referenced, skip the R2 round-trip
      // entirely.
      const referenced = await deps.uploadSessions.isStorageKeyCurrentlyReferenced(session.storageKey);
      if (referenced) {
        skippedReferenced += 1;
        console.error(
          JSON.stringify({
            event: 'cms_cleanup.abandoned_upload.safety_conflict_still_referenced',
            uploadSessionId: session.id,
          }),
        );
        continue;
      }

      const existing = await deps.storage.headObject(session.storageKey);
      if (existing) {
        // MANDATORY safety check #2 -- re-run IMMEDIATELY before the
        // irreversible physical delete, with nothing else awaited in
        // between this and the deleteObject() call below. Check #1's
        // answer can go stale during the headObject() round-trip above:
        // a completion can commit a content_items row referencing this
        // exact key in that window (PART 8-A's race -- an admin finally
        // completing an upload at the exact moment it crosses the 24h
        // threshold). Re-checking here, as the very last thing before
        // the delete, is what actually enforces "no cleanup operation
        // may delete an object after the database has established a
        // current reference to it" -- check #1 alone does not, since a
        // real network round-trip (headObject) sits between it and the
        // delete.
        const referencedBeforeDelete = await deps.uploadSessions.isStorageKeyCurrentlyReferenced(session.storageKey);
        if (referencedBeforeDelete) {
          skippedReferenced += 1;
          console.error(
            JSON.stringify({
              event: 'cms_cleanup.abandoned_upload.safety_conflict_became_referenced',
              uploadSessionId: session.id,
            }),
          );
          continue; // neither the object nor the session row is touched -- a completion just won this race.
        }
        await deps.storage.deleteObject(session.storageKey);
        deleted += 1;
      } else {
        alreadyAbsent += 1;
      }

      // Only reached once deletion (or confirmed absence) has already
      // succeeded.
      await deps.uploadSessions.deleteById(session.id);
    } catch (cause) {
      failed += 1;
      console.error(
        JSON.stringify({
          event: 'cms_cleanup.abandoned_upload.failed',
          uploadSessionId: session.id,
          error: describeError(cause),
        }),
      );
    }
  }

  const outcome: CmsAbandonedUploadCleanupTickOutcome = {
    scanned: candidates.length,
    deleted,
    alreadyAbsent,
    skippedReferenced,
    failed,
  };
  console.log(JSON.stringify({ event: 'cms_cleanup.abandoned_upload.tick_completed', ...outcome }));
  return outcome;
}
