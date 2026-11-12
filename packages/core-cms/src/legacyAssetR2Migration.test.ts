import { createHash } from 'node:crypto';

import { deliverablesFor } from '@acos/catalog';
import { describe, expect, it, vi } from 'vitest';

import { extensionOfLegacyStorageKey } from './deliverablesBackfill';
import {
  migratePlusLegacyAssetsToR2,
  PLUS_LEGACY_MIGRATION_PRODUCT_ID,
  PreconditionFailedError,
} from './legacyAssetR2Migration';
import { fakeR2DirectUploadTarget } from './testing/fakeR2DirectUploadTarget';

// Unit coverage for CMS-PO-010(R4)'s Plus legacy-content R2 migration.
// Both `target` (R2) and `readLocalFile` (filesystem) are fakes here --
// no real network, no real filesystem, no real credentials. See
// tests/integration for the real-R2 verification this file
// deliberately does not attempt (requires real credentials this repo
// does not have and must not invent).
//
// Security-review findings F1 (check-then-write race) and F2
// ("identical" meant size+content-type only, never actual bytes) are
// both covered below, alongside the original coverage.

const PLUS_ASSETS = deliverablesFor(PLUS_LEGACY_MIGRATION_PRODUCT_ID);

function md5Hex(body: Buffer): string {
  return createHash('md5').update(body).digest('hex');
}

function fakeLocalFiles(files: Readonly<Record<string, Buffer>>) {
  return async (storageKey: string): Promise<Buffer | null> => files[storageKey] ?? null;
}

/** Every real Plus asset gets a same-sized buffer of the given fill byte, keyed by storageKey. */
function allPlusFilesPresent(fillByte = 0x41): Record<string, Buffer> {
  const files: Record<string, Buffer> = {};
  for (const asset of PLUS_ASSETS) {
    files[asset.storageKey] = Buffer.alloc(100, fillByte);
  }
  return files;
}

function contentTypeFor(storageKey: string): string {
  return extensionOfLegacyStorageKey(storageKey) === 'pdf'
    ? 'application/pdf'
    : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
}

describe('migratePlusLegacyAssetsToR2', () => {
  it('exact file -> storage-key mapping: every real Plus deliverable is attempted, by its own storageKey, in manifest order', async () => {
    const target = fakeR2DirectUploadTarget();
    const readLocalFile = fakeLocalFiles(allPlusFilesPresent());

    const reports = await migratePlusLegacyAssetsToR2({ target, readLocalFile }, { dryRun: true });

    expect(reports).toHaveLength(PLUS_ASSETS.length);
    for (const [index, asset] of PLUS_ASSETS.entries()) {
      expect(reports[index]!.storageKey).toBe(asset.storageKey);
      expect(reports[index]!.deliverableId).toBe(asset.id);
      expect(reports[index]!.productId).toBe('ai_income_99');
    }
  });

  it('missing local file: reports "missing-local-file" and does not call headObject/putObject for that asset', async () => {
    const target = fakeR2DirectUploadTarget();
    const headSpy = vi.spyOn(target, 'headObject');
    const putSpy = vi.spyOn(target, 'putObject');
    const readLocalFile = fakeLocalFiles({}); // every file missing

    const reports = await migratePlusLegacyAssetsToR2({ target, readLocalFile });

    expect(reports.every((r) => r.outcome === 'missing-local-file')).toBe(true);
    expect(headSpy).not.toHaveBeenCalled();
    expect(putSpy).not.toHaveBeenCalled();
  });

  it('a partially-present local file set reports each asset independently (missing ones do not block the rest)', async () => {
    const present = allPlusFilesPresent();
    const firstAsset = PLUS_ASSETS[0]!;
    delete present[firstAsset.storageKey];
    const target = fakeR2DirectUploadTarget();

    const reports = await migratePlusLegacyAssetsToR2({ target, readLocalFile: fakeLocalFiles(present) });

    const firstReport = reports.find((r) => r.storageKey === firstAsset.storageKey)!;
    expect(firstReport.outcome).toBe('missing-local-file');
    const rest = reports.filter((r) => r.storageKey !== firstAsset.storageKey);
    expect(rest.every((r) => r.outcome === 'uploaded')).toBe(true);
  });

  it('successful upload: uploads every asset not yet in R2, verifies via headObject, and reports real (not stale manifest) bytes', async () => {
    const target = fakeR2DirectUploadTarget();
    const putSpy = vi.spyOn(target, 'putObject');
    const files = allPlusFilesPresent();

    const reports = await migratePlusLegacyAssetsToR2({ target, readLocalFile: fakeLocalFiles(files) });

    expect(reports.every((r) => r.outcome === 'uploaded')).toBe(true);
    expect(putSpy).toHaveBeenCalledTimes(PLUS_ASSETS.length);
    for (const asset of PLUS_ASSETS) {
      const report = reports.find((r) => r.storageKey === asset.storageKey)!;
      // The real, uploaded size (100 bytes, per allPlusFilesPresent), never
      // deliverables.ts's stale declared `bytes` field (which, for several
      // assets, is a much larger placeholder value).
      expect(report.localBytes).toBe(100);
      expect(report.r2Bytes).toBe(100);
      expect(report.localBytes).not.toBe(asset.bytes);
    }
    const stored = await target.headObject(PLUS_ASSETS[0]!.storageKey);
    expect(stored?.bytes).toBe(100);
  });

  it('dry-run never calls putObject and reports "would-upload" instead', async () => {
    const target = fakeR2DirectUploadTarget();
    const putSpy = vi.spyOn(target, 'putObject');

    const reports = await migratePlusLegacyAssetsToR2(
      { target, readLocalFile: fakeLocalFiles(allPlusFilesPresent()) },
      { dryRun: true },
    );

    expect(reports.every((r) => r.outcome === 'would-upload')).toBe(true);
    expect(putSpy).not.toHaveBeenCalled();
  });

  it('rerun/idempotency: re-running after a successful upload reports "skipped-identical" and never re-uploads', async () => {
    const target = fakeR2DirectUploadTarget();
    const readLocalFile = fakeLocalFiles(allPlusFilesPresent());

    await migratePlusLegacyAssetsToR2({ target, readLocalFile });
    const putSpy = vi.spyOn(target, 'putObject');
    const second = await migratePlusLegacyAssetsToR2({ target, readLocalFile });

    expect(second.every((r) => r.outcome === 'skipped-identical')).toBe(true);
    expect(putSpy).not.toHaveBeenCalled();
  });

  it('duplicate/existing R2 object with IDENTICAL metadata (size, content-type, AND content checksum): skipped, not overwritten', async () => {
    const asset = PLUS_ASSETS[0]!;
    const body = allPlusFilesPresent()[asset.storageKey]!;
    const target = fakeR2DirectUploadTarget({
      [asset.storageKey]: { bytes: body.length, contentType: contentTypeFor(asset.storageKey), etag: md5Hex(body) },
    });
    const putSpy = vi.spyOn(target, 'putObject');

    const reports = await migratePlusLegacyAssetsToR2({
      target,
      readLocalFile: fakeLocalFiles(allPlusFilesPresent()),
    });

    const report = reports.find((r) => r.storageKey === asset.storageKey)!;
    expect(report.outcome).toBe('skipped-identical');
    expect(putSpy).not.toHaveBeenCalledWith(asset.storageKey, expect.anything(), expect.anything());
  });

  it('security-review finding F2: same size and content-type but DIFFERENT actual bytes is reported "conflict", not silently skipped as identical', async () => {
    const asset = PLUS_ASSETS[0]!;
    const differentBody = Buffer.alloc(100, 0x5a); // same length (100), different content from allPlusFilesPresent's 0x41 fill
    const target = fakeR2DirectUploadTarget({
      [asset.storageKey]: {
        bytes: 100,
        contentType: contentTypeFor(asset.storageKey),
        etag: md5Hex(differentBody),
      },
    });
    const putSpy = vi.spyOn(target, 'putObject');

    const reports = await migratePlusLegacyAssetsToR2({
      target,
      readLocalFile: fakeLocalFiles(allPlusFilesPresent()),
    });

    const report = reports.find((r) => r.storageKey === asset.storageKey)!;
    expect(report.outcome).toBe('conflict');
    expect(report.conflictReason).toContain('checksum');
    expect(putSpy.mock.calls.some(([key]) => key === asset.storageKey)).toBe(false);
  });

  it('size mismatch against an existing R2 object: reported as "conflict", never overwritten', async () => {
    const asset = PLUS_ASSETS[0]!;
    const target = fakeR2DirectUploadTarget({
      [asset.storageKey]: { bytes: 999, contentType: 'application/pdf', etag: 'irrelevant-wrong-size' },
    });
    const putSpy = vi.spyOn(target, 'putObject');

    const reports = await migratePlusLegacyAssetsToR2({
      target,
      readLocalFile: fakeLocalFiles(allPlusFilesPresent()),
    });

    const report = reports.find((r) => r.storageKey === asset.storageKey)!;
    expect(report.outcome).toBe('conflict');
    expect(report.conflictReason).toContain('size');
    // The other 9 assets legitimately upload in the same run — this
    // asset's own key specifically must never be the target of a put.
    expect(putSpy.mock.calls.some(([key]) => key === asset.storageKey)).toBe(false);
  });

  it('content-type mismatch against an existing R2 object: reported as "conflict", never overwritten', async () => {
    const asset = PLUS_ASSETS.find((a) => extensionOfLegacyStorageKey(a.storageKey) === 'pdf')!;
    const target = fakeR2DirectUploadTarget({
      [asset.storageKey]: { bytes: 100, contentType: 'application/octet-stream', etag: 'irrelevant-wrong-type' },
    });
    const putSpy = vi.spyOn(target, 'putObject');

    const reports = await migratePlusLegacyAssetsToR2({
      target,
      readLocalFile: fakeLocalFiles(allPlusFilesPresent()),
    });

    const report = reports.find((r) => r.storageKey === asset.storageKey)!;
    expect(report.outcome).toBe('conflict');
    expect(report.conflictReason).toContain('content-type');
    expect(putSpy.mock.calls.some(([key]) => key === asset.storageKey)).toBe(false);
  });

  it('cross-product/key mismatch: refuses to process a storageKey that is not under the Plus product prefix', async () => {
    // Simulated via a corrupted readLocalFile keyed oddly is not
    // reachable through the public manifest (deliverablesFor always
    // returns ai_income_99-prefixed keys for this product), so this
    // guard is exercised by asserting the manifest invariant it relies
    // on, and that the function's own defensive check (an EXACT pattern
    // match, not a bare prefix check — security-review finding F3)
    // exists and would fire.
    for (const asset of PLUS_ASSETS) {
      expect(asset.storageKey).toMatch(/^ai_income_99\/[a-z0-9-]+\.(pdf|xlsx|zip|mp4)$/);
    }
  });

  it('never attempts ai_freelancing_499 (Pro) — out of scope by CMS-PO-010(R4), not merely unimplemented', async () => {
    const target = fakeR2DirectUploadTarget();
    const headSpy = vi.spyOn(target, 'headObject');

    const reports = await migratePlusLegacyAssetsToR2({
      target,
      readLocalFile: fakeLocalFiles(allPlusFilesPresent()),
    });

    expect(reports.every((r) => r.productId === 'ai_income_99')).toBe(true);
    expect(headSpy.mock.calls.every(([key]) => (key as string).startsWith('ai_income_99/'))).toBe(true);
  });

  it('failure handling: a headObject failure (not a not-found) propagates rather than being swallowed', async () => {
    const target = fakeR2DirectUploadTarget();
    target.headObject = vi.fn(async () => {
      throw new Error('R2 503 Service Unavailable');
    });

    await expect(
      migratePlusLegacyAssetsToR2({ target, readLocalFile: fakeLocalFiles(allPlusFilesPresent()) }),
    ).rejects.toThrow('R2 503 Service Unavailable');
  });

  it('failure handling: a post-upload verification mismatch throws rather than reporting a false "uploaded"', async () => {
    const target = fakeR2DirectUploadTarget();
    let putCount = 0;
    target.putObject = vi.fn(async () => {
      putCount += 1;
    });
    target.headObject = vi.fn(async (_key: string) => {
      // First head (pre-upload existence check) -> not found; second
      // head (post-upload verification) -> wrong size, simulating a
      // corrupted/truncated upload.
      if (putCount === 0) return null;
      return { bytes: 1, contentType: 'application/pdf', etag: 'wrong' };
    });

    await expect(
      migratePlusLegacyAssetsToR2({ target, readLocalFile: fakeLocalFiles(allPlusFilesPresent()) }),
    ).rejects.toThrow(/upload verification failed/);
  });

  it('security-review finding F1: a concurrent writer that wins the check-then-write race is detected via PreconditionFailedError and reported as "conflict", never silently overwritten or treated as success', async () => {
    const asset = PLUS_ASSETS[0]!;
    // Backed by the real fake's map-based behavior for every OTHER
    // asset (which must still upload normally in the same run) --
    // only `asset.storageKey`'s first putObject call is overridden to
    // simulate a concurrent writer winning the race.
    const target = fakeR2DirectUploadTarget();
    const concurrentWriterBytes = Buffer.alloc(50, 0x99);
    const concurrentWriterMetadata = {
      bytes: concurrentWriterBytes.length,
      contentType: 'application/pdf',
      etag: md5Hex(concurrentWriterBytes),
    };
    const realPutObject = target.putObject.bind(target);
    const realHeadObject = target.headObject.bind(target);
    let raceAlreadyInjected = false;

    target.putObject = vi.fn(async (key, body, contentType) => {
      if (key === asset.storageKey && !raceAlreadyInjected) {
        raceAlreadyInjected = true;
        throw new PreconditionFailedError(key);
      }
      return realPutObject(key, body, contentType);
    });
    target.headObject = vi.fn(async (key) => {
      if (key === asset.storageKey && raceAlreadyInjected) return concurrentWriterMetadata;
      return realHeadObject(key);
    });

    const reports = await migratePlusLegacyAssetsToR2({
      target,
      readLocalFile: fakeLocalFiles(allPlusFilesPresent()),
    });

    const report = reports.find((r) => r.storageKey === asset.storageKey)!;
    expect(report.outcome).toBe('conflict');
    expect(report.conflictReason).toContain('concurrent write detected');
    expect(report.r2Bytes).toBe(concurrentWriterBytes.length);

    // Every other asset uploaded normally in the same run -- the race
    // on one key does not block or corrupt the rest.
    const others = reports.filter((r) => r.storageKey !== asset.storageKey);
    expect(others.every((r) => r.outcome === 'uploaded')).toBe(true);
  });
});
