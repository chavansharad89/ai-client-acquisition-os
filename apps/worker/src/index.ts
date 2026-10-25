import { randomUUID } from 'node:crypto';

import { loadEnv } from '@acos/config';
import { createPgAiUsageEventRepository, toNewAiUsageEventInput } from '@acos/core-ai-usage';
import {
  createGooglePlacesClient,
  createGooglePlacesDiscoveryProvider,
  createPgCompanyRepository,
  createPgEntityRepository,
  createPgProspectRepository,
} from '@acos/core-discovery';
import { createPgFollowUpPreparationRepository } from '@acos/core-followup-preparation';
import { createPgOpportunityRepository, createPgOpportunityScoreRepository } from '@acos/core-opportunity';
import { createPgOutreachPreparationRepository } from '@acos/core-outreach-preparation';
import { createClaimEmailSender, createPgEntitlementRepository } from '@acos/core-entitlements';
import { createRazorpayOrdersClient } from '@acos/core-payments';
import { createPgPersonalizationRepository } from '@acos/core-personalization';
import { createPgQualificationRepository } from '@acos/core-qualification';
import {
  createFallbackResearchProvider,
  createHttpSourceDocumentProvider,
  createPgCategoryPlausibilityRepository,
  createPgResearchSignalCacheRepository,
  createPgResearchSignalRepository,
  createPgTargetCustomerMatchRepository,
  createResearchModel,
  createWebDevelopmentSignalCatalogue,
  MissingResearchModelError,
  MissingResearchProviderCredentialError,
  type ResearchModel,
  type ResearchModelConfig,
  type ResearchProviderAttempt,
} from '@acos/core-research';
import { createPgSearchRepository } from '@acos/core-search';
import { Pool } from 'pg';

import { buildPurchaseEventId } from '@acos/core-capi';

import {
  DEFAULT_GATE_EVALUATION_POLL_INTERVAL_MS,
  runGateEvaluationPollLoop,
  type GateEvaluationPollLoopDeps,
} from './gateEvaluation';
import {
  DEFAULT_RECONCILIATION_BATCH_SIZE,
  DEFAULT_RECONCILIATION_ELIGIBILITY_AGE_MS,
  DEFAULT_RECONCILIATION_POLL_INTERVAL_MS,
  runReconciliationPollLoop,
  type ReconciliationPollLoopDeps,
} from './reconciliation';
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
    ...(env.ANTHROPIC_API_KEY ? { anthropicApiKey: env.ANTHROPIC_API_KEY } : {}),
    ...(env.OPENAI_API_KEY ? { openAIApiKey: env.OPENAI_API_KEY } : {}),
    ...(env.GEMINI_API_KEY ? { geminiApiKey: env.GEMINI_API_KEY } : {}),
  };
}

/**
 * Global Entity Architecture (C-3B / zero-AI requirement): boots a
 * ResearchModel for one provider WITHOUT crashing the process when that
 * provider's credential (or, for openai/gemini, its required model) is
 * absent. createResearchModel() itself still throws for every OTHER
 * malformed-configuration case (e.g. an unrecognized provider name) —
 * only the two "this deployment simply did not configure this
 * provider" errors are caught here, never silently swallowing a real
 * bug. Does not redesign createResearchModel() or the provider-adapter
 * architecture; this is the one place that decides a missing credential
 * means "skip this attempt," not "fail to boot."
 */
function tryCreateResearchModel(
  provider: ResearchModelConfig['provider'],
  model: string | undefined,
  env: ReturnType<typeof loadEnv>,
): ResearchModel | undefined {
  try {
    return createResearchModel(researchModelConfigFor(provider, model, env));
  } catch (error) {
    if (
      error instanceof MissingResearchProviderCredentialError ||
      error instanceof MissingResearchModelError
    ) {
      return undefined;
    }
    throw error;
  }
}

async function main(): Promise<void> {
  const env = loadEnv();
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  const aiUsageEvents = createPgAiUsageEventRepository(pool);

  // Zero-AI (C-3B): a missing credential for the selected provider (or,
  // when configured, its fallback) is never a boot failure — it simply
  // means that attempt is not available this run. An empty `attempts`
  // array (no AI provider configured at all) is a valid, supported
  // zero-AI deployment; AI remains optional at runtime exactly as every
  // other part of this pipeline already treats it (deterministic
  // admission/ranking/qualification are already AI-free).
  const attempts: ResearchProviderAttempt[] = [];
  const primaryModel = tryCreateResearchModel(env.RESEARCH_PROVIDER, env.RESEARCH_MODEL, env);
  if (primaryModel) {
    attempts.push({ provider: env.RESEARCH_PROVIDER, model: primaryModel });
  }
  if (env.RESEARCH_FALLBACK_PROVIDER) {
    const fallbackModel = tryCreateResearchModel(
      env.RESEARCH_FALLBACK_PROVIDER,
      env.RESEARCH_FALLBACK_MODEL,
      env,
    );
    if (fallbackModel) {
      attempts.push({ provider: env.RESEARCH_FALLBACK_PROVIDER, model: fallbackModel });
    }
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
    entities: createPgEntityRepository(pool),
    sourceDocuments,
    discoveryProvider: createGooglePlacesDiscoveryProvider(
      createGooglePlacesClient({
        apiKey: env.GOOGLE_PLACES_API_KEY,
        baseUrl: env.GOOGLE_PLACES_API_BASE_URL,
        timeoutMs: env.DISCOVERY_REQUEST_TIMEOUT_MS,
      }),
    ),
    signals: createPgResearchSignalRepository(pool),
    // Phase 5 admission gate (CLIENT_FINDER_PHASE5_IMPLEMENTATION_READINESS_
    // REPORT.md Sec.10): the pre-admission deterministic signal catalogue.
    // Without this, deps.signalCatalogue is undefined, Pass 1's
    // `deps.signalCatalogue?.evaluate(supplied)` always yields `[]`, and
    // every candidate's needOpportunity/serviceFit stay UNKNOWN —
    // meetsAdmissionThreshold and hasStrongSignalBypass both then always
    // fail, so no production candidate could ever reach Research. Web
    // Development is the only approved service catalogue (Phase 1 scope).
    signalCatalogue: createWebDevelopmentSignalCatalogue(),
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
    categoryPlausibility: createPgCategoryPlausibilityRepository(pool),
    // Phase 4 (CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001, migration
    // 0045): indexes every Research run's cacheable signals so Phase 5's
    // cache-first lookup has evidence to find. Does not itself change
    // Research/TCM invocation — see @acos/core-research's service.ts.
    signalCache: createPgResearchSignalCacheRepository(pool),
    // PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001 §1.1/§1.5: reuses the main
    // research attempt's own provider/model config — never an
    // independently configured one. modelId mirrors
    // createAnthropicResearchModel's own default (anthropicModel.ts)
    // when env.RESEARCH_MODEL is unset, rather than reinventing it.
    //
    // Zero-AI (C-3B): omitted entirely (not constructed with an absent
    // model) when the primary provider's credential is unavailable —
    // targetCustomerMatch is already an OPTIONAL SearchWorkerDeps field
    // for exactly this reason, so a zero-AI deployment simply runs
    // without target-customer matching rather than failing to boot.
    ...(primaryModel
      ? {
          targetCustomerMatch: {
            repository: createPgTargetCustomerMatchRepository(pool),
            model: {
              model: primaryModel,
              modelId: env.RESEARCH_MODEL ?? 'claude-opus-5',
              providerId: env.RESEARCH_PROVIDER,
            },
          },
        }
      : {}),
    qualifications: createPgQualificationRepository(pool),
    personalizations: createPgPersonalizationRepository(pool),
    outreachPreparations: createPgOutreachPreparationRepository(pool),
    followUpPreparations: createPgFollowUpPreparationRepository(pool),
    workerId: `search-worker-${process.pid}-${randomUUID()}`,
    pollIntervalMs: env.WORKER_POLL_INTERVAL_MS,
  };

  // Engineering default cadence (ED-DEC-001 §3 item 2): once per day, a
  // fixed in-code constant, not an environment variable — no governing
  // record specifies a configurable number, and introducing one here
  // would be new config surface beyond this record's authorized scope.
  const gateEvaluationDeps: GateEvaluationPollLoopDeps = {
    sql: pool,
    pollIntervalMs: DEFAULT_GATE_EVALUATION_POLL_INTERVAL_MS,
  };

  // DEC-010 item 6: payment/webhook reconciliation, launch-blocking for
  // ₹99 validation. See ./reconciliation/pollLoop.ts for why the cadence
  // below is an engineering default, not a governed value.
  const reconciliationDeps: ReconciliationPollLoopDeps = {
    pool,
    razorpay: createRazorpayOrdersClient({
      keyId: env.RAZORPAY_KEY_ID,
      keySecret: env.RAZORPAY_KEY_SECRET,
    }),
    buildMetaEventId: (paymentId: string) => buildPurchaseEventId({ paymentId }),
    eligibilityAgeMs: DEFAULT_RECONCILIATION_ELIGIBILITY_AGE_MS,
    batchSize: DEFAULT_RECONCILIATION_BATCH_SIZE,
    pollIntervalMs: DEFAULT_RECONCILIATION_POLL_INTERVAL_MS,
    claimLink: {
      entitlements: createPgEntitlementRepository(pool),
      sender: createClaimEmailSender({
        provider: env.EMAIL_PROVIDER,
        nodeEnv: env.NODE_ENV,
        gmailDev:
          env.GMAIL_DEV_USER && env.GMAIL_DEV_APP_PASSWORD
            ? { user: env.GMAIL_DEV_USER, appPassword: env.GMAIL_DEV_APP_PASSWORD }
            : undefined,
      }),
      baseUrl: env.APP_BASE_URL,
    },
  };

  const shutdown = new AbortController();
  const onSignal = (): void => shutdown.abort();
  process.once('SIGTERM', onSignal);
  process.once('SIGINT', onSignal);

  try {
    // PDEF4-GATE-EVAL-WIRING-IMPL-AUTH-DEC-001 §3: a second, independent
    // poll loop sharing this same Pool and shutdown signal — no new
    // queue, broker, or scheduler process. Runs concurrently with the
    // Search worker loop, not sequentially after it; either loop's own
    // failure (not expected to be fatal, since each catches/logs its own
    // tick errors) still propagates here if the loop function itself
    // throws, matching how `try`/`finally` already surfaced the Search
    // loop's own unexpected failures before this change.
    await Promise.all([
      runSearchWorkerPollLoop(deps, shutdown.signal),
      runGateEvaluationPollLoop(gateEvaluationDeps, shutdown.signal),
      runReconciliationPollLoop(reconciliationDeps, shutdown.signal),
    ]);
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
