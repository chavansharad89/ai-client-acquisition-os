// Vitest workspace: aggregates every package/app's own vitest config so
// `pnpm test` from the repo root can run everything, while each project
// still owns its own environment (node vs. jsdom) and setup files.
//
// TODO: as apps/packages are fleshed out, ensure each one listed below
// actually has a vitest.config.ts — this file only *aggregates* them.
import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  'apps/web/vitest.config.ts',
  'apps/worker/vitest.config.ts',
  'packages/core-outreach/vitest.config.ts',
  'packages/core-proposal/vitest.config.ts',
  'packages/core-payments/vitest.config.ts',
  'packages/core-entitlements/vitest.config.ts',
  'packages/core-acquisition/vitest.config.ts',
  'packages/core-capi/vitest.config.ts',
  'packages/core-reconciliation/vitest.config.ts',
  'packages/core-research/vitest.config.ts',
  'packages/db/vitest.config.ts',
  'packages/db-index-deploy/vitest.config.ts',
  'tests/fixtures/vitest.config.ts',
  'tests/integration/vitest.config.ts',
  'tests/contract/vitest.config.ts',
]);
