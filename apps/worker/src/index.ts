import { randomUUID } from 'node:crypto';

import { loadEnv } from '@acos/config';
import { createPgAiUsageEventRepository, toNewAiUsageEventInput } from '@acos/core-ai-usage';
import {
  createGooglePlacesClient,
  createGooglePlacesDiscoveryProvider,
  createPgCompanyRepository,
  createPgProspectRepository,
} from '@acos/core-discovery';
import { createPgOpportunityRepository } from '@acos/core-opportunity';
import { createPgQualificationRepository } from '@acos/core-qualification';
import {
  createAnthropicResearchModel,
  createAnthropicResearchProvider,
  createHttpSourceDocumentProvider,
  createPgResearchSignalRepository,
} from '@acos/core-research';
import { createPgSearchRepository } from '@acos/core-search';
import { Pool } from 'pg';

import { runSearchWorkerPollLoop, type SearchWorkerPollLoopDeps } from './searchWorker';

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
// PROVIDERS (Phase 18): a real Google Places DiscoveryProvider and a real
// Anthropic-backed ResearchProvider are wired below, replacing the
// Phase 17 "not configured" stubs (still available in
// ./searchWorker/providers.ts for an environment without real
// credentials). researchProvider is a per-owner FACTORY, not a shared
// instance — see SearchWorkerDeps' own doc comment in ./searchWorker/
// worker.ts for why: the frozen ResearchProvider.research(input) carries
// no userId, so R-29 metering closure captures it here, at the one place
// a userId is available at construction time for each Search.
// -----------------------------------------------------------------------

async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  const aiUsageEvents = createPgAiUsageEventRepository(pool);
  const researchModel = createAnthropicResearchModel({ apiKey: env.ANTHROPIC_API_KEY });
  const sourceDocuments = createHttpSourceDocumentProvider({
    timeoutMs: env.SOURCE_FETCH_TIMEOUT_MS,
    maxBytes: env.SOURCE_FETCH_MAX_BYTES,
    userAgent: env.SOURCE_FETCH_USER_AGENT,
  });

  const deps: SearchWorkerPollLoopDeps = {
    searches: createPgSearchRepository(pool),
    companies: createPgCompanyRepository(pool),
    prospects: createPgProspectRepository(pool),
    discoveryProvider: createGooglePlacesDiscoveryProvider(
      createGooglePlacesClient({
        apiKey: env.GOOGLE_PLACES_API_KEY,
        baseUrl: env.GOOGLE_PLACES_API_BASE_URL,
        timeoutMs: env.DISCOVERY_REQUEST_TIMEOUT_MS,
      }),
    ),
    signals: createPgResearchSignalRepository(pool),
    researchProvider: (userId: string) =>
      createAnthropicResearchProvider({
        model: researchModel,
        sourceDocuments,
        onUsage: (usage, requestKind, prospectId) =>
          aiUsageEvents
            .recordEvent(userId, prospectId, toNewAiUsageEventInput(usage, requestKind), new Date())
            .then(() => undefined),
      }),
    opportunities: createPgOpportunityRepository(pool),
    qualifications: createPgQualificationRepository(pool),
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
