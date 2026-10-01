import { createPgCompanyRepository, createPgProspectRepository } from '@acos/core-discovery';
import { createPgFollowUpPreparationRepository } from '@acos/core-followup-preparation';
import { createPgOpportunityRepository, createPgOpportunityScoreRepository } from '@acos/core-opportunity';
import { createPgOutreachPreparationRepository } from '@acos/core-outreach-preparation';
import { createPgPersonalizationRepository } from '@acos/core-personalization';
import { createPgQualificationRepository } from '@acos/core-qualification';
import {
  createPgCategoryPlausibilityRepository,
  createPgResearchSignalRepository,
  createPgResearchSignalTransactionRunner,
} from '@acos/core-research';
import { createPgSearchRepository } from '@acos/core-search';
import {
  notConfiguredResearchProviderFactory,
  recordIntentIntakeForOwner,
  type IntentIntakeDeps,
} from '@acos/worker/searchWorker';

import { getPool } from './db';
import type { IntentIngressIntake } from './intentIngress';

// P3 for the OD-13 push ingress (INTENT-INTAKE-OD13-INGRESS-DEC-001 IG-2,
// IG-3): the canonical recordIntentIntakeForOwner from @acos/worker, run
// synchronously in this apps/web process — not moved, not duplicated.
//
// Deps are built lazily on the first call, which can only follow a
// successful P1 for a registered integration; none is registered.
//
// researchProvider is the "not configured" factory: provider-call
// authorization is NONE, so the inline Research step can never reach an
// external provider from this path.
// -----------------------------------------------------------------------

function buildIntentIntakeDeps(): IntentIntakeDeps {
  const pool = getPool();
  return {
    searches: createPgSearchRepository(pool),
    companies: createPgCompanyRepository(pool),
    prospects: createPgProspectRepository(pool),
    signals: createPgResearchSignalRepository(pool),
    signalTransaction: createPgResearchSignalTransactionRunner(pool),
    researchProvider: notConfiguredResearchProviderFactory(),
    opportunities: createPgOpportunityRepository(pool),
    scores: createPgOpportunityScoreRepository(pool),
    categoryPlausibility: createPgCategoryPlausibilityRepository(pool),
    qualifications: createPgQualificationRepository(pool),
    personalizations: createPgPersonalizationRepository(pool),
    outreachPreparations: createPgOutreachPreparationRepository(pool),
    followUpPreparations: createPgFollowUpPreparationRepository(pool),
  };
}

/** Binds P3 to recordIntentIntakeForOwner over `buildDeps` (lazily, once). */
export function createIntentIngressIntake(buildDeps: () => IntentIntakeDeps = buildIntentIntakeDeps): IntentIngressIntake {
  let deps: IntentIntakeDeps | null = null;
  return (userId, input, now) => {
    deps ??= buildDeps();
    return recordIntentIntakeForOwner(deps, userId, input, now);
  };
}
