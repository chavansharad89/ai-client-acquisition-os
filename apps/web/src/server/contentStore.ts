import { readFile } from 'node:fs/promises';
import path from 'node:path';

// Where deliverable bytes live on disk.
// -----------------------------------------------------------------------
// No storage adapter existed anywhere in the repository before this (the
// engineering design review found none) — `storageKey` was a logical
// catalog key with nothing behind it. This is the smallest real backing
// store: a local directory, read by key. It deliberately does NOT
// fabricate missing files — a key with nothing on disk yet returns null,
// which the download route turns into "not yet available", not a fake
// payload. Swapping this for object storage later changes only this
// file; every caller already goes through readDeliverableFile().
// -----------------------------------------------------------------------

const CONTENT_ROOT = path.resolve(process.cwd(), 'content');

/**
 * Reads a deliverable's bytes by its catalog storageKey.
 *
 * `storageKey` only ever comes from @acos/catalog's manifest (never a
 * request) — findDeliverable() is what makes that true, by resolving an
 * asset id to a Deliverable before this is ever called. The path-prefix
 * check is defense in depth, not the actual guarantee.
 */
export async function readDeliverableFile(storageKey: string): Promise<Buffer | null> {
  const filePath = path.resolve(CONTENT_ROOT, storageKey);
  if (!filePath.startsWith(CONTENT_ROOT)) return null;

  try {
    return await readFile(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
}

const CONTENT_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  zip: 'application/zip',
  video: 'video/mp4',
  sheet: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
};

export function contentTypeFor(kind: string): string {
  return CONTENT_TYPES[kind] ?? 'application/octet-stream';
}
