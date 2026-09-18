import { randomUUID } from 'node:crypto';

import { loadEnv } from '@acos/config';
import { createPgCompanyRepository, createPgProspectRepository } from '@acos/core-discovery';
import { createPgOpportunityRepository } from '@acos/core-opportunity';
import { createPgResearchSignalRepository } from '@acos/core-research';
import { createPgSearchRepository } from '@acos/core-search';
import { Pool } from 'pg';

import {
  notConfiguredDiscoveryProvider,
  notConfiguredResearchProvider,
  runSearchWorkerPollLoop,
  type SearchWorkerPollLoopDeps,
} from './searchWorker';

// apps/worker entrypoint (R-34 — Worker Orchestration / Wiring)
// -----------------------------------------------------------------------
// A long-running, in-process PostgreSQL polling loop (Phase 17 scope-lock
// RESOLVED DECISIONS §3) — no queue, no broker, no separate scheduler
// service. Search claiming uses `FOR UPDATE SKIP LOCKED`
// (@acos/core-search's claimNextPending); claims and settlements are
// fenced on the existing lease_owner/lease_expires_at fields.
//
// The Meta-events poll loop this file used to document as "intended" but
// never implement is unrelated (Phase 2/commerce) and remains unbuilt —
// see ./metaEvents. This entrypoint now runs the Search worker only.
//
// NOTE ON PROVIDERS: no real, production DiscoveryProvider or
// ResearchProvider exists anywhere in this repository — see
// ./searchWorker/providers.ts for exactly why, and
// requirement/PHASE_17_R34_PREFLIGHT_SCOPE_LOCK.md's Pipeline Dependency
// Graph for the full evidence. This boot wires the explicit
// "not configured" stubs, so a claimed Search fails visibly (bounded
// retries, then FAILED with a diagnostic last_error) rather than a
// worker silently fabricating results. Supplying a real implementation
// requires no change to this file beyond the two lines that construct
// `discoveryProvider`/`researchProvider`.
// -----------------------------------------------------------------------

async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  const deps: SearchWorkerPollLoopDeps = {
    searches: createPgSearchRepository(pool),
    companies: createPgCompanyRepository(pool),
    prospects: createPgProspectRepository(pool),
    discoveryProvider: notConfiguredDiscoveryProvider(),
    signals: createPgResearchSignalRepository(pool),
    researchProvider: notConfiguredResearchProvider(),
    opportunities: createPgOpportunityRepository(pool),
    workerId: `search-worker-${process.pid}-${randomUUID()}`,
    pollIntervalMs: env.WORKER_POLL_INTERVAL_MS,
  };

  const shutdown = new AbortController();
  const onSignal = (): void => shutdown.abort();
  process.once('SIGTERM', onSignal);
  process.once('SIGINT', onSignal);

  try {
    await runSearchWorkerPollLoop(deps, shutdown.signal);
  } finally {
    process.removeListener('SIGTERM', onSignal);
    process.removeListener('SIGINT', onSignal);
    await pool.end();
  }
}

main().catch((cause) => {
  console.error('apps/worker: fatal error', cause);
  process.exitCode = 1;
});
