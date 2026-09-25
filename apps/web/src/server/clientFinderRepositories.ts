import { createPgCompanyRepository, createPgProspectRepository } from '@acos/core-discovery';
import { createPgFollowUpPreparationRepository } from '@acos/core-followup-preparation';
import { createPgIdentityRepository } from '@acos/core-identity';
import { createPgFeedbackRepository, createPgOpportunityRepository, createPgOpportunityScoreRepository } from '@acos/core-opportunity';
import { createPgOutreachPreparationRepository } from '@acos/core-outreach-preparation';
import { createPgPersonalizationRepository } from '@acos/core-personalization';
import { createPgQualificationRepository } from '@acos/core-qualification';
import { createPgResearchSignalRepository } from '@acos/core-research';
import { createPgSearchRepository } from '@acos/core-search';
import { createPgServiceProfileRepository } from '@acos/core-service-profile';

import { getPool } from './db';

// One repository set for the whole Client Finder MVP UI surface, built
// from the single shared pg.Pool. Every repository here wraps an
// already-frozen, already-tested Phase 3/6/9/16/18/20/21/22/23 package —
// nothing in this file reimplements domain logic, it only constructs the
// existing repository adapters against this app's connection pool.
export function clientFinderRepositories() {
  const sql = getPool();
  return {
    identity: createPgIdentityRepository(sql),
    profiles: createPgServiceProfileRepository(sql),
    searches: createPgSearchRepository(sql),
    companies: createPgCompanyRepository(sql),
    prospects: createPgProspectRepository(sql),
    signals: createPgResearchSignalRepository(sql),
    opportunities: createPgOpportunityRepository(sql),
    scores: createPgOpportunityScoreRepository(sql),
    feedback: createPgFeedbackRepository(sql),
    qualifications: createPgQualificationRepository(sql),
    personalizations: createPgPersonalizationRepository(sql),
    outreachPreparations: createPgOutreachPreparationRepository(sql),
    followUpPreparations: createPgFollowUpPreparationRepository(sql),
  };
}

export type ClientFinderRepositories = ReturnType<typeof clientFinderRepositories>;
