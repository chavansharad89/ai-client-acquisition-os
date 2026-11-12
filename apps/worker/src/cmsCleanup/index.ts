// CMS-PO-010(R2) physical-object cleanup.
// -----------------------------------------------------------------------
// Part B (30-day obsolete-object retention, ./worker.ts + ./pollLoop.ts)
// and Part A (24-hour abandoned-upload cleanup, ./abandonedUploadWorker.ts
// + ./abandonedUploadPollLoop.ts) -- two separate ticks/poll loops over
// two separate bookkeeping tables (content_item_obsolete_objects vs
// cms_asset_upload_sessions), never mixed. Part A was blocked by a
// persistence gap until migration 0068 (CMS-PO-010(R2)-G) added
// cms_asset_upload_sessions and assetIngestionService.ts was wired to
// write/consume it.
// -----------------------------------------------------------------------

export {
  DEFAULT_CMS_OBSOLETE_OBJECT_CLEANUP_BATCH_SIZE,
  DEFAULT_CMS_OBSOLETE_OBJECT_CLEANUP_POLL_INTERVAL_MS,
  runCmsObsoleteObjectCleanupPollLoop,
} from './pollLoop';
export type { CmsObsoleteObjectCleanupPollLoopDeps } from './pollLoop';

export { runCmsObsoleteObjectCleanupTick } from './worker';
export type { CmsObsoleteObjectCleanupTickDeps, CmsObsoleteObjectCleanupTickOutcome } from './worker';

export {
  DEFAULT_CMS_ABANDONED_UPLOAD_CLEANUP_BATCH_SIZE,
  DEFAULT_CMS_ABANDONED_UPLOAD_CLEANUP_POLL_INTERVAL_MS,
  runCmsAbandonedUploadCleanupPollLoop,
} from './abandonedUploadPollLoop';
export type { CmsAbandonedUploadCleanupPollLoopDeps } from './abandonedUploadPollLoop';

export { DEFAULT_ABANDONED_UPLOAD_AGE_MS, runCmsAbandonedUploadCleanupTick } from './abandonedUploadWorker';
export type {
  CmsAbandonedUploadCleanupTickDeps,
  CmsAbandonedUploadCleanupTickOutcome,
} from './abandonedUploadWorker';
