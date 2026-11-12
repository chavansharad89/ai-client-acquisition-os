import { createHash } from 'node:crypto';

import { deliverablesFor, type ProductId } from '@acos/catalog';
import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';

import { extensionOfLegacyStorageKey } from './deliverablesBackfill';

// Plus legacy-content physical migration to R2 (CMS-PO-010(R4)).
// -----------------------------------------------------------------------
// Resolves CMS-PO-010(R4): uploads the real file bytes for the 10
// already-backfilled ai_income_99 `content_items` rows to Cloudflare R2
// under their existing, unchanged `storage_key` values, so the
// already-shipped, R2-only CMS download route
// (apps/web/app/api/cms/content/[id]/download/route.ts) can actually
// serve them -- it has no local-filesystem fallback, and R4 explicitly
// decided not to introduce one.
//
// Hardcoded to 'ai_income_99' ONLY, deliberately not generalized over
// `isCmsEligibleProduct` the way deliverablesBackfill.ts is: R4 is a
// Plus-only decision. ai_freelancing_499 (Pro) has no local files to
// migrate (confirmed absent from the repository by the governing
// investigation) and is explicitly out of scope -- a generalized loop
// here would risk silently extending this migration to Pro the moment
// Pro content exists, without a separate PO decision authorizing that.
//
// Deliberately a NEW, separate R2 adapter (`R2DirectUploadTarget`
// below), not an extension of `r2AssetStorage.ts`'s existing
// `AssetStorage` interface -- that interface is the live, approved
// customer/admin delivery and ingestion surface (CMS-PO-010(R2)-B/-C)
// and is left untouched, per the instruction not to modify R2
// architecture. This migration needs a direct PUT with real bytes (an
// operator script with real credentials, not a browser with a
// presigned URL), which `AssetStorage` was never designed for.
//
// Separated into two layers, mirroring deliverablesBackfill.ts's own
// split:
//   - `migratePlusLegacyAssetsToR2` -- pure decision logic (upload /
//     skip-identical / conflict / missing-local-file), independent of
//     whether `target`/`readLocalFile` are real R2/filesystem or fakes.
//   - `createR2DirectUploadTarget` -- the real adapter, used only by the
//     CLI runner (scripts/cms/migrate-plus-assets-to-r2.ts).
// -----------------------------------------------------------------------

export const PLUS_LEGACY_MIGRATION_PRODUCT_ID: ProductId = 'ai_income_99';

/**
 * Minimal, scoped content-type map -- covers every extension Plus's
 * actual deliverables use today (pdf, xlsx) plus the other two
 * CMS-approved document/archive types (zip, mp4) for robustness should
 * a future Plus asset use one, without importing the full
 * `ASSET_ALLOWLIST` out of assetValidation.ts (module-private there,
 * and this migration intentionally does not widen that module's public
 * surface for a one-time Plus-only script).
 */
const CONTENT_TYPE_BY_EXTENSION: Readonly<Record<string, string>> = {
  pdf: 'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  zip: 'application/zip',
  mp4: 'video/mp4',
};

export interface R2ObjectMetadata {
  bytes: number;
  contentType: string;
  /**
   * Hex MD5 digest (no surrounding quotes). For a plain, single-part PUT
   * (which is all this migration ever does) an S3-compatible object's
   * ETag IS the MD5 of its body -- so this doubles as a content
   * checksum without a separate round trip. Security-review finding
   * (F2): size+content-type alone cannot prove the bytes themselves
   * match, only their length and declared type.
   */
  etag: string;
}

/** Hex MD5 of `body` -- what a plain, single-part PUT's resulting ETag will equal. */
function md5Hex(body: Buffer): string {
  return createHash('md5').update(body).digest('hex');
}

/**
 * The narrow R2 capability this migration needs: check what's already
 * there, and PUT real bytes. Never a presigned URL -- this runs as a
 * trusted operator script with real R2 write credentials, not a
 * browser upload.
 *
 * `putObject` must apply an R2/S3 conditional-write precondition (the
 * real adapter below uses `IfNoneMatch: '*'`) and throw
 * `PreconditionFailedError` if the key was written by someone else
 * between this migration's own `headObject` check and this call --
 * security-review finding (F1): without this, a concurrent writer
 * could be silently overwritten in that window.
 */
export interface R2DirectUploadTarget {
  headObject(key: string): Promise<R2ObjectMetadata | null>;
  putObject(key: string, body: Buffer, contentType: string): Promise<void>;
}

/** Thrown by `R2DirectUploadTarget.putObject` when a conditional-write precondition fails -- i.e. something else wrote this key after this migration's own `headObject` check saw it as absent. */
export class PreconditionFailedError extends Error {
  constructor(key: string) {
    super(`R2 object '${key}' was written by another process between the existence check and this upload (conditional-write precondition failed).`);
    this.name = 'PreconditionFailedError';
  }
}

/** Reads the bytes for a legacy `storageKey`, or null if no local file exists at that key. Matches `apps/web/src/server/contentStore.ts`'s `readDeliverableFile` contract exactly (same null-for-missing convention) -- the CLI runner wires in that real function; tests inject a fake. */
export type ReadLocalLegacyFile = (storageKey: string) => Promise<Buffer | null>;

export interface LegacyAssetUploadReport {
  productId: ProductId;
  deliverableId: string;
  title: string;
  storageKey: string;
  outcome: 'uploaded' | 'would-upload' | 'skipped-identical' | 'conflict' | 'missing-local-file';
  localBytes?: number;
  r2Bytes?: number;
  contentType?: string;
  /** Set only when outcome is 'conflict' -- exactly what differs, never silently resolved. */
  conflictReason?: string;
}

/**
 * Every legacy Plus storage_key this migration will ever accept, as an
 * exact pattern -- not merely a prefix. Security-review finding (F3):
 * a bare `startsWith('ai_income_99/')` check lets a string like
 * `ai_income_99/../../evil/x` through, since that string does start
 * with the right prefix even though it does not resolve under it. Not
 * reachable today (every key comes from the hardcoded manifest), but
 * this is the actual boundary this migration promises, stated
 * precisely rather than approximately.
 */
const PLUS_STORAGE_KEY_PATTERN = /^ai_income_99\/[a-z0-9-]+\.(pdf|xlsx|zip|mp4)$/;

/**
 * The migration's core decision logic. Independent of whether `target`
 * (R2) and `readLocalFile` (filesystem) are real or fakes -- see
 * `legacyAssetR2Migration.test.ts`.
 *
 * Safety properties:
 *   - Idempotent / restartable: an object already in R2 with IDENTICAL
 *     size, content-type, AND content checksum (F2) is reported
 *     'skipped-identical' and never re-uploaded.
 *   - Fail-closed on conflict: an object already in R2 that DIFFERS
 *     from the local file (size, content-type, or checksum) is
 *     reported 'conflict' and is NEVER overwritten -- the loop
 *     continues to the next asset rather than silently clobbering data
 *     or aborting the whole run.
 *   - Race-safe (F1): the real adapter's `putObject` applies a
 *     conditional-write precondition. If something else wrote the key
 *     between this function's own `headObject` check and its `putObject`
 *     call, the precondition fails, this function re-reads the actual
 *     (other) writer's object, and reports 'conflict' rather than ever
 *     believing its own write succeeded when it didn't.
 *   - Cross-product-safe (F3): every `storage_key` this function will
 *     ever touch comes from `deliverablesFor(PLUS_LEGACY_MIGRATION_PRODUCT_ID)`
 *     only, and each key is checked against an exact pattern -- not
 *     merely a prefix -- before any R2 call.
 *   - Metadata truth: after a real upload, this re-reads the object's
 *     actual R2 metadata via `headObject` rather than trusting
 *     `deliverables.ts`'s stale `bytes` field, and throws if the two
 *     ever disagree (a genuine upload-integrity failure, not a normal
 *     outcome).
 */
export async function migratePlusLegacyAssetsToR2(
  deps: { target: R2DirectUploadTarget; readLocalFile: ReadLocalLegacyFile },
  options: { dryRun?: boolean } = {},
): Promise<readonly LegacyAssetUploadReport[]> {
  const dryRun = options.dryRun ?? false;
  const productId = PLUS_LEGACY_MIGRATION_PRODUCT_ID;
  const reports: LegacyAssetUploadReport[] = [];

  for (const asset of deliverablesFor(productId)) {
    if (!PLUS_STORAGE_KEY_PATTERN.test(asset.storageKey)) {
      throw new Error(
        `${productId}/${asset.id}: storageKey '${asset.storageKey}' does not match the exact Plus legacy key shape -- refusing to upload a mismatched key under the Plus migration (CMS-PO-010(R4) is Plus-only).`,
      );
    }

    const localBytes = await deps.readLocalFile(asset.storageKey);
    if (localBytes === null) {
      reports.push({
        productId,
        deliverableId: asset.id,
        title: asset.title,
        storageKey: asset.storageKey,
        outcome: 'missing-local-file',
      });
      continue;
    }
    const localChecksum = md5Hex(localBytes);

    const extension = extensionOfLegacyStorageKey(asset.storageKey);
    const contentType = CONTENT_TYPE_BY_EXTENSION[extension];
    if (!contentType) {
      throw new Error(
        `${productId}/${asset.id}: storageKey '${asset.storageKey}' has an unrecognized extension '${extension}' -- refusing to guess a content type.`,
      );
    }

    function describeMismatch(existing: R2ObjectMetadata): string {
      const mismatches: string[] = [];
      if (existing.bytes !== localBytes!.length) {
        mismatches.push(`size: R2 has ${existing.bytes} bytes, local file has ${localBytes!.length} bytes`);
      }
      if (existing.contentType !== contentType) {
        mismatches.push(`content-type: R2 has '${existing.contentType}', expected '${contentType}'`);
      }
      if (existing.etag !== localChecksum) {
        mismatches.push(`content checksum differs: R2 ETag '${existing.etag}' != local MD5 '${localChecksum}'`);
      }
      return mismatches.join('; ');
    }

    function isIdentical(existing: R2ObjectMetadata): boolean {
      return (
        existing.bytes === localBytes!.length &&
        existing.contentType === contentType &&
        existing.etag === localChecksum
      );
    }

    const existing = await deps.target.headObject(asset.storageKey);
    if (existing) {
      if (isIdentical(existing)) {
        reports.push({
          productId,
          deliverableId: asset.id,
          title: asset.title,
          storageKey: asset.storageKey,
          outcome: 'skipped-identical',
          localBytes: localBytes.length,
          r2Bytes: existing.bytes,
          contentType,
        });
        continue;
      }

      reports.push({
        productId,
        deliverableId: asset.id,
        title: asset.title,
        storageKey: asset.storageKey,
        outcome: 'conflict',
        localBytes: localBytes.length,
        r2Bytes: existing.bytes,
        contentType,
        conflictReason: describeMismatch(existing),
      });
      continue;
    }

    if (dryRun) {
      reports.push({
        productId,
        deliverableId: asset.id,
        title: asset.title,
        storageKey: asset.storageKey,
        outcome: 'would-upload',
        localBytes: localBytes.length,
        contentType,
      });
      continue;
    }

    try {
      await deps.target.putObject(asset.storageKey, localBytes, contentType);
    } catch (err) {
      if (err instanceof PreconditionFailedError) {
        // F1: something else wrote this key in the window between the
        // `headObject` check above and this `putObject` call. Re-read
        // whatever is actually there now and report it as a conflict --
        // never assume our own write won, and never retry/overwrite
        // automatically.
        const raceWinner = await deps.target.headObject(asset.storageKey);
        reports.push({
          productId,
          deliverableId: asset.id,
          title: asset.title,
          storageKey: asset.storageKey,
          outcome: 'conflict',
          localBytes: localBytes.length,
          ...(raceWinner ? { r2Bytes: raceWinner.bytes } : {}),
          contentType,
          conflictReason: raceWinner
            ? `concurrent write detected (If-None-Match precondition failed): ${describeMismatch(raceWinner)}`
            : 'concurrent write detected (If-None-Match precondition failed), and the object is now unexpectedly absent again',
        });
        continue;
      }
      throw err;
    }

    const verification = await deps.target.headObject(asset.storageKey);
    if (!verification || !isIdentical(verification)) {
      throw new Error(
        `${productId}/${asset.id}: upload verification failed for storageKey '${asset.storageKey}' -- R2 metadata after upload does not match what was just written. This is a genuine upload-integrity failure, not a normal outcome.`,
      );
    }

    reports.push({
      productId,
      deliverableId: asset.id,
      title: asset.title,
      storageKey: asset.storageKey,
      outcome: 'uploaded',
      localBytes: verification.bytes,
      r2Bytes: verification.bytes,
      contentType: verification.contentType,
    });
  }

  return reports;
}

export interface R2DirectUploadConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  /** Injected for tests; never used to reach a real network in a unit test. */
  client?: S3Client;
}

function isObjectNotFound(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const name = (error as { name?: unknown }).name;
  if (name === 'NotFound' || name === 'NoSuchKey') return true;
  const statusCode = (error as { $metadata?: { httpStatusCode?: unknown } }).$metadata?.httpStatusCode;
  return statusCode === 404;
}

/** An `IfNoneMatch: '*'` PUT that loses the race surfaces as HTTP 412 (name varies by S3-compatible implementation; R2 is not guaranteed to match AWS's exact `PreconditionFailed` name, so this checks the status code first). */
function isPreconditionFailed(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const statusCode = (error as { $metadata?: { httpStatusCode?: unknown } }).$metadata?.httpStatusCode;
  if (statusCode === 412) return true;
  const name = (error as { name?: unknown }).name;
  return name === 'PreconditionFailed';
}

/** Strips the surrounding double quotes an S3-compatible `ETag` header always carries (e.g. `"d41d8cd9..."` -> `d41d8cd9...`). */
function stripEtagQuotes(etag: string | undefined): string {
  return (etag ?? '').replace(/^"|"$/g, '');
}

/**
 * The real R2 adapter for this migration, built directly on
 * `@aws-sdk/client-s3` -- the same SDK `r2AssetStorage.ts` already uses
 * for the live CMS path, but a separate client/instance, so this
 * migration-only code can never be reached by, or interfere with, the
 * approved customer/admin delivery paths. Never reads `process.env`
 * itself -- the CLI runner supplies `loadEnv().R2_*` explicitly.
 */
export function createR2DirectUploadTarget(config: R2DirectUploadConfig): R2DirectUploadTarget {
  const client =
    config.client ??
    new S3Client({
      region: 'auto',
      endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: config.accessKeyId,
        secretAccessKey: config.secretAccessKey,
      },
    });
  const bucketName = config.bucketName;

  return {
    async headObject(key) {
      try {
        const result = await client.send(new HeadObjectCommand({ Bucket: bucketName, Key: key }));
        return {
          bytes: result.ContentLength ?? 0,
          contentType: result.ContentType ?? '',
          etag: stripEtagQuotes(result.ETag),
        };
      } catch (error) {
        if (isObjectNotFound(error)) return null;
        throw error;
      }
    },

    async putObject(key, body, contentType) {
      try {
        await client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: key,
            Body: body,
            ContentType: contentType,
            // Security-review finding (F1): conditional write -- this
            // PUT only succeeds if the key does not already exist,
            // closing the check-then-write race between this
            // migration's own `headObject` and this call. R2 honors
            // S3's `If-None-Match` semantics for this.
            IfNoneMatch: '*',
          }),
        );
      } catch (error) {
        if (isPreconditionFailed(error)) {
          throw new PreconditionFailedError(key);
        }
        throw error;
      }
    },
  };
}
