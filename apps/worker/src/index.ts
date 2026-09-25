import { randomUUID } from 'node:crypto';

import { loadEnv } from '@acos/config';
import { createPgAiUsageEventRepository, toNewAiUsageEventInput } from '@acos/core-ai-usage';
import {
  createGooglePlacesClient,
  createGooglePlacesDiscoveryProvider,
  createPgCompanyRepository,
  createPgProspectRepository,
} from '@acos/core-discovery';
import { createPgFollowUpPreparationRepository } from '@acos/core-followup-preparation';
import { createPgOpportunityRepository, createPgOpportunityScoreRepository } from '@acos/core-opportunity';
import { createPgOutreachPreparationRepository } from '@acos/core-outreach-preparation';
import { createPgPersonalizationRepository } from '@acos/core-personalization';
import { createPgQualificationRepository } from '@acos/core-qualification';
import {
  createFallbackResearchProvider,
  createHttpSourceDocumentProvider,
  createPgResearchSignalRepository,
  createResearchModel,
  type ResearchModelConfig,
  type ResearchProviderAttempt,
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
// PROVIDERS (Phase 18, extended by the Multi-Model Research Provider
// capability): a real Google Places DiscoveryProvider and a real
// research provider chain are wired below, replacing the Phase 17 "not
// configured" stubs (still available in ./searchWorker/providers.ts for
// an environment without real credentials). researchProvider is a
// per-owner FACTORY, not a shared instance — see SearchWorkerDeps' own
// doc comment in ./searchWorker/worker.ts for why: the frozen
// ResearchProvider.research(input) carries no userId, so R-29 metering
// closure captures it here, at the one place a userId is available at
// construction time for each Search.
//
// Provider/model selection (requirement/
// MULTI_MODEL_RESEARCH_PROVIDER_DECISION_REVIEW.md Decision 1/§8) is
// resolved ONCE here, from env.RESEARCH_PROVIDER/RESEARCH_MODEL (system
// default) and an optional env.RESEARCH_FALLBACK_PROVIDER/
// RESEARCH_FALLBACK_MODEL — never per-request, never inside
// researchLead() or any downstream package. This file is the only place
// in apps/worker aware that a provider name resolves to a concrete
// adapter; @acos/core-research's createResearchModel() owns that
// mapping. createFallbackResearchProvider is used UNCONDITIONALLY, with
// a chain of exactly one attempt when no fallback is configured — for a
// single-attempt chain this is behaviourally identical to the
// previously-used createAnthropicResearchProvider (same single fetch,
// same single researchLead() call, same error propagation; see
// @acos/core-research/fallbackResearchProvider.test.ts's own "successful
// primary" coverage), so today's default (RESEARCH_PROVIDER=anthropic,
// no fallback configured) is unchanged.
// -----------------------------------------------------------------------

/** Builds a ResearchModelConfig without ever assigning `undefined` to an optional field (exactOptionalPropertyTypes). */
function researchModelConfigFor(
  provider: ResearchModelConfig['provider'],
  model: string | undefined,
  env: ReturnType<typeof loadEnv>,
): ResearchModelConfig {
  return {
    provider,
    ...(model ? { model } : {}),
    anthropicApiKey: env.ANTHROPIC_API_KEY,
    ...(env.OPENAI_API_KEY ? { openAIApiKey: env.OPENAI_API_KEY } : {}),
    ...(env.GEMINI_API_KEY ? { geminiApiKey: env.GEMINI_API_KEY } : {}),
  };
}

async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  const aiUsageEvents = createPgAiUsageEventRepository(pool);

  const attempts: ResearchProviderAttempt[] = [
    {
      provider: env.RESEARCH_PROVIDER,
      model: createResearchModel(researchModelConfigFor(env.RESEARCH_PROVIDER, env.RESEARCH_MODEL, env)),
    },
  ];
  if (env.RESEARCH_FALLBACK_PROVIDER) {
    attempts.push({
      provider: env.RESEARCH_FALLBACK_PROVIDER,
      model: createResearchModel(
        researchModelConfigFor(env.RESEARCH_FALLBACK_PROVIDER, env.RESEARCH_FALLBACK_MODEL, env),
      ),
    });
  }

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
      createFallbackResearchProvider({
        sourceDocuments,
        attempts,
        onUsage: (usage, requestKind, prospectId) =>
          aiUsageEvents
            .recordEvent(userId, prospectId, toNewAiUsageEventInput(usage, requestKind), new Date())
            .then(() => undefined),
      }),
    opportunities: createPgOpportunityRepository(pool),
    scores: createPgOpportunityScoreRepository(pool),
    qualifications: createPgQualificationRepository(pool),
    personalizations: createPgPersonalizationRepository(pool),
    outreachPreparations: createPgOutreachPreparationRepository(pool),
    followUpPreparations: createPgFollowUpPreparationRepository(pool),
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
