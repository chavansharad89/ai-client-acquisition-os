#!/usr/bin/env tsx
/* eslint-disable no-console */
import { Client } from 'pg';

import {
  deployConcurrentIndexes,
  formatPreflight,
  INDEX_TARGETS,
  MIGRATION_NAME,
  buildHooks,
  isDryRun,
  readFaultConfig,
  type DeploymentResult,
} from '@acos/db-index-deploy';

// Operational runner for the concurrent unique-index deployment.
// -----------------------------------------------------------------------
// Uses a single pinned Client rather than a Pool: the advisory lock is
// session-scoped, and CREATE INDEX CONCURRENTLY must not be multiplexed
// across connections mid-build.
//
//   pnpm db:indexes:deploy -- --dry-run
//   pnpm db:indexes:deploy
// -----------------------------------------------------------------------

async function main(): Promise<number> {
  const dryRun = isDryRun();
  const faults = readFaultConfig();
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is not set. Refusing to run.');
    return 2;
  }

  const client = new Client({
    connectionString,
    // A concurrent build on a large table can take a long time; the
    // statement timeout must not kill it partway and leave it INVALID.
    statement_timeout: 0,
    application_name: `acos-index-deploy/${MIGRATION_NAME}`,
  });
  await client.connect();

  console.log(
    `${MIGRATION_NAME}: ${INDEX_TARGETS.length} target index(es)${dryRun ? ' [DRY RUN]' : ''}`,
  );

  let result: DeploymentResult;
  try {
    result = await deployConcurrentIndexes({
      session: client,
      dryRun,
      log: (line) => console.log(`  ${line}`),
      hooks: buildHooks(faults),
    });
  } finally {
    await client.end();
  }

  if (!result.lockAcquired) {
    console.error('\nAnother deployment holds the advisory lock. Nothing was changed.');
    return 3;
  }

  console.log('\nPer-target outcome');
  for (const r of result.results) {
    console.log(`  ${r.outcome.padEnd(20)} ${r.target.indexName}  (${r.durationMs}ms)`);
    if (r.preflight && !r.preflight.clean) console.log(formatPreflight(r.preflight));
    if (r.error) console.log(`      error: ${r.error}`);
  }

  console.log('\nFinal verification (pg_index)');
  for (const v of result.finalVerification) {
    console.log(`  ${v.verdict.state.padEnd(12)} ${v.target.indexName}`);
  }

  if (result.operatorActions.length > 0) {
    console.log('\nNext steps');
    for (const action of result.operatorActions) console.log(`  - ${action}`);
  }

  if (!result.allValid) {
    console.error(
      '\nNOT all indexes are valid. Nothing was dropped; resolve the above and re-run.',
    );
    return 1;
  }
  console.log('\nAll target indexes are valid.');
  return 0;
}

main()
  .then((code) => process.exit(code))
  .catch((error: unknown) => {
    console.error('\nDeployment aborted:', error);
    console.error('No index was dropped. Inspect pg_index and production_index_migrations.');
    process.exit(1);
  });
