#!/usr/bin/env tsx
/* eslint-disable no-console */
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { loadEnv } from '@acos/config';
import {
  createR2DirectUploadTarget,
  migratePlusLegacyAssetsToR2,
  type LegacyAssetUploadReport,
  type ReadLocalLegacyFile,
} from '@acos/core-cms';

// Thin, deliberately-unchecked CLI runner for CMS-PO-010(R4)'s Plus
// legacy-content R2 migration. Mirrors scripts/cms/backfill-content-
// items-from-deliverables.ts's own split: all the real, testable logic
// lives in @acos/core-cms's legacyAssetR2Migration.ts — this file only
// wires a real local-filesystem reader and a real R2 client to it.
//
// Local-file resolution matches apps/web/src/server/contentStore.ts's
// `readDeliverableFile` EXACTLY (same CONTENT_ROOT, same path-traversal
// guard, same null-for-missing contract) rather than importing across
// an app/script boundary that doesn't otherwise exist in this repo —
// see contentStore.ts if this ever needs to be re-verified for drift.
//
// Never prints a secret: R2 credential VALUES are read via loadEnv()
// and handed straight to createR2DirectUploadTarget(); nothing below
// ever logs a config value, only the already-public storage_key/title/
// outcome fields that are already fully observable in deliverables.ts
// and the CMS database.
//
//   pnpm --filter @acos/web run cms:migrate-plus-assets-to-r2 -- --dry-run
//   pnpm --filter @acos/web run cms:migrate-plus-assets-to-r2
// -----------------------------------------------------------------------

const CONTENT_ROOT = path.resolve(process.cwd(), 'content');

const readLocalLegacyFile: ReadLocalLegacyFile = async (storageKey) => {
  const filePath = path.resolve(CONTENT_ROOT, storageKey);
  // Security-review finding (F3): a bare `startsWith(CONTENT_ROOT)` (the
  // original contentStore.ts guard this mirrors) also passes a sibling
  // directory that merely shares the same string prefix (e.g.
  // `CONTENT_ROOT` + "-evil"), and passes CONTENT_ROOT itself for an
  // empty storageKey. Requiring the path separator closes both. Not
  // reachable today — every storageKey this migration ever sees also
  // passes `migratePlusLegacyAssetsToR2`'s own exact-pattern check — but
  // this is the actual boundary the guard is meant to enforce.
  if (!filePath.startsWith(CONTENT_ROOT + path.sep)) return null;
  try {
    return await readFile(filePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw err;
  }
};

function isDryRun(): boolean {
  return process.argv.includes('--dry-run');
}

function printReports(reports: readonly LegacyAssetUploadReport[]): void {
  console.log('\nPer-asset outcome');
  for (const r of reports) {
    const detail =
      r.outcome === 'conflict'
        ? ` CONFLICT: ${r.conflictReason}`
        : r.localBytes !== undefined
          ? ` (${r.localBytes} bytes, ${r.contentType})`
          : '';
    console.log(`  ${r.outcome.padEnd(18)} ${r.storageKey}${detail}`);
  }
}

async function main(): Promise<number> {
  const dryRun = isDryRun();
  const config = loadEnv();

  const r2Configured =
    Boolean(config.R2_ACCOUNT_ID) &&
    Boolean(config.R2_ACCESS_KEY_ID) &&
    Boolean(config.R2_SECRET_ACCESS_KEY) &&
    Boolean(config.R2_BUCKET_NAME);

  if (!r2Configured) {
    console.error(
      'R2 is not configured (R2_ACCOUNT_ID / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY / R2_BUCKET_NAME ' +
        'are not all set). Refusing to attempt even a dry-run, since checking existing R2 state ' +
        'requires a real connection. Names only are reported here, never values.',
    );
    return 2;
  }

  const target = createR2DirectUploadTarget({
    accountId: config.R2_ACCOUNT_ID!,
    accessKeyId: config.R2_ACCESS_KEY_ID!,
    secretAccessKey: config.R2_SECRET_ACCESS_KEY!,
    bucketName: config.R2_BUCKET_NAME!,
  });

  console.log(`CMS-PO-010(R4) Plus legacy-asset R2 migration${dryRun ? ' [DRY RUN]' : ''}`);
  const reports = await migratePlusLegacyAssetsToR2({ target, readLocalFile: readLocalLegacyFile }, { dryRun });
  printReports(reports);

  const conflicts = reports.filter((r) => r.outcome === 'conflict');
  const missing = reports.filter((r) => r.outcome === 'missing-local-file');
  const uploaded = reports.filter((r) => r.outcome === 'uploaded' || r.outcome === 'would-upload');
  const skipped = reports.filter((r) => r.outcome === 'skipped-identical');

  console.log(
    `\n${dryRun ? 'Would upload' : 'Uploaded'}: ${uploaded.length}, already present: ${skipped.length}, ` +
      `conflicts: ${conflicts.length}, missing local file: ${missing.length}`,
  );

  if (conflicts.length > 0) {
    console.error('\nCONFLICTS — not overwritten, needs manual review:');
    for (const c of conflicts) console.error(`  ${c.storageKey}: ${c.conflictReason}`);
  }
  if (missing.length > 0) {
    console.error('\nMISSING LOCAL FILES — cannot migrate without the source bytes:');
    for (const m of missing) console.error(`  ${m.storageKey}`);
  }

  return conflicts.length > 0 || missing.length > 0 ? 1 : 0;
}

/**
 * Security-review finding (F4): the AWS SDK decorates a thrown
 * exception with every field an S3-compatible error response body
 * contained as additional, non-enumerable-by-default-but-still-
 * accessible properties (e.g. `AWSAccessKeyId`/`StringToSign` on a
 * signature-mismatch error) — logging the raw `error` object risks
 * printing those. This logs only `name`/`message`/the request's own
 * status code and request id, never the SDK's full decorated object.
 */
function safeErrorSummary(error: unknown): string {
  if (error instanceof Error) {
    const metadata = (error as { $metadata?: { httpStatusCode?: unknown; requestId?: unknown } }).$metadata;
    const statusCode = metadata?.httpStatusCode;
    const requestId = metadata?.requestId;
    return JSON.stringify({
      name: error.name,
      message: error.message,
      ...(statusCode !== undefined ? { httpStatusCode: statusCode } : {}),
      ...(requestId !== undefined ? { requestId } : {}),
    });
  }
  return JSON.stringify({ message: String(error) });
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error('\nMigration aborted:', safeErrorSummary(error));
    console.error('No report above this point was a false success — any upload already verified stays verified. Re-running after fixing the cause is safe (idempotent).');
    process.exit(1);
  });
