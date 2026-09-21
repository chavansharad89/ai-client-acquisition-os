import { requireUser, type IdentityRepository } from '@acos/core-identity';
import { OpportunityNotFoundError, type OpportunityRepository } from '@acos/core-opportunity';
import type { ResearchSignalRepository } from '@acos/core-research';

import { evaluateQualification } from './evaluator';
import type { QualificationRepository } from './repository';
import type { StoredQualification } from './types';

// Application/service boundary, mirroring @acos/core-opportunity's
// service.ts scoreOpportunity()/scoreOpportunityForOwner() split.
// -----------------------------------------------------------------------

/** Identifies the evaluator build that produced a row (R-40) — bumped only if rules.ts's rule set changes. */
export const EVALUATOR_VERSION = 'qualification-v1';

export interface QualificationDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  signals: ResearchSignalRepository;
  qualifications: QualificationRepository;
}

/**
 * Evaluates and persists Qualification for one of the caller's own
 * Opportunities (R-35..R-40). Ownership is resolved through
 * `deps.opportunities.getById` — the only place `opportunityId` is
 * checked against the caller, the same boundary
 * @acos/core-opportunity's scoreOpportunity() uses;
 * `deps.signals.listByProspect` re-checks ownership independently via
 * its own join to `prospects`, the same belt-and-suspenders convention
 * that function already relies on.
 *
 * An explicit, caller-invoked step (R-39) — never automatic on read.
 * Re-running against unchanged evidence overwrites the same row with an
 * unchanged `state`/`criteria` (migration 0022's `UNIQUE(opportunity_id)`
 * upsert); re-running after evidence changed (e.g. a re-research run
 * superseding signals) produces a new result over the same row.
 */
export async function evaluateOpportunityQualification(
  deps: QualificationDeps,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredQualification> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return evaluateQualificationForOwner(deps, userId, opportunityId, now);
}

/**
 * Same behavior as {@link evaluateOpportunityQualification}, for a caller
 * that has already resolved a trusted `userId` by some means other than a
 * session token — specifically, the Search worker (R-41), which claimed a
 * Search row and is reading ownership out of it, the same convention
 * @acos/core-opportunity's `createOpportunityForOwner` and
 * @acos/core-research's `runResearchForOwner` already establish. Not
 * reachable from any HTTP path — only
 * `evaluateOpportunityQualification()` (token-authenticated) is.
 */
export async function evaluateQualificationForOwner(
  deps: Omit<QualificationDeps, 'identity'>,
  userId: string,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredQualification> {
  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new OpportunityNotFoundError(opportunityId);

  const signals = await deps.signals.listByProspect(userId, opportunity.prospectId);
  const evaluation = evaluateQualification({ needDetected: opportunity.needDetected, signals });

  return deps.qualifications.upsert(
    opportunity.id,
    opportunity.prospectId,
    evaluation,
    EVALUATOR_VERSION,
    now,
  );
}

/**
 * Reads one of the caller's own Qualification results. Returns `null`
 * when the Opportunity has never been evaluated, or does not resolve to
 * one the caller owns — indistinguishable from "not yet evaluated", the
 * same convention @acos/core-opportunity's getOpportunityScore() uses.
 */
export async function getOpportunityQualification(
  deps: Pick<QualificationDeps, 'identity' | 'qualifications'>,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredQualification | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.qualifications.getByOpportunityId(userId, opportunityId);
}
