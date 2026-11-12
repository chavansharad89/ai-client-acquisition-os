#!/usr/bin/env tsx
/* eslint-disable no-console */
import { Client } from 'pg';

import { loadEnv } from '@acos/config';
import {
  backfillContentItemsFromDeliverables,
  createPgContentItemRepository,
  type DeliverableBackfillRowReport,
} from '@acos/core-cms';

// Thin, deliberately-unchecked CLI runner for the CMS content_items
// backfill (Customer Fulfillment Phase B, Stage 1-3). Mirrors
// scripts/deploy-concurrent-indexes.ts's own split: all the real,
// testable logic lives in a real package
// (@acos/core-cms's deliverablesBackfill.ts, which this repo's normal
// `tsc`/`vitest` already cover) — this file only wires a real
// `pg.Client` + `loadEnv()` to it and is not itself part of any
// package's typecheck, matching how deploy-concurrent-indexes.ts is not
// typechecked either. See deliverablesBackfill.ts for the full
// rationale, scope (only ai_income_99/ai_freelancing_499 — the retired
// ai_client_acquisition_1499 SKU is out of CMS scope by an existing
// decision, not this script's choice), and the R2-storage-key caveat
// (legacy storage keys are local-filesystem paths, not R2 keys, until a
// separate upload step runs).
//
//   pnpm --filter @acos/web run cms:backfill-content-items -- --dry-run
//   pnpm --filter @acos/web run cms:backfill-content-items
// -----------------------------------------------------------------------

function isDryRun(): boolean {
  return process.argv.includes('--dry-run');
}

async function main(): Promise<number> {
  const dryRun = isDryRun();
  const config = loadEnv();

  const client = new Client({
    connectionString: config.DATABASE_URL,
    application_name: 'acos-cms-backfill-content-items',
  });
  await client.connect();

  let reports: readonly DeliverableBackfillRowReport[];
  try {
    const contentItems = createPgContentItemRepository(client);
    console.log(`CMS content_items backfill${dryRun ? ' [DRY RUN]' : ''}`);
    reports = await backfillContentItemsFromDeliverables(contentItems, { dryRun });
  } finally {
    await client.end();
  }

  console.log('\nPer-row outcome');
  for (const r of reports) {
    console.log(
      `  ${r.outcome.padEnd(16)} ${r.productId.padEnd(28)} [${r.orderIndex}] ${r.assetId} -> asset_kind=${r.assetKind} storage_key=${r.storageKey}`,
    );
  }

  const created = reports.filter((r) => r.outcome === 'created' || r.outcome === 'would-create').length;
  const skipped = reports.filter((r) => r.outcome === 'skipped-existing').length;
  console.log(`\n${dryRun ? 'Would create' : 'Created'}: ${created}, skipped (already present): ${skipped}`);

  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error('\nBackfill aborted:', error);
    console.error(
      'Already-created rows from this run (if any) were not rolled back — the backfill is idempotent, so re-running after fixing the cause is safe.',
    );
    process.exit(1);
  });
