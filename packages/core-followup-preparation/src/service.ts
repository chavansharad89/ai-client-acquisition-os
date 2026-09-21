import { requireUser, type IdentityRepository } from '@acos/core-identity';
import { OpportunityNotFoundError, type OpportunityRepository } from '@acos/core-opportunity';
import type { OutreachPreparationRepository } from '@acos/core-outreach-preparation';

import { generateFollowUpPreparation, GENERATOR_VERSION } from './generator';
import type { FollowUpPreparationRepository } from './repository';
import type { StoredFollowUpPreparation } from './types';

// Application/service boundary, mirroring
// @acos/core-outreach-preparation's service.ts
// prepareOpportunityOutreach()/prepareOutreachForOwner() split (Phase 23,
// R-61..R-69).
// -----------------------------------------------------------------------

export interface FollowUpPreparationDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  outreachPreparations: OutreachPreparationRepository;
  followUpPreparations: FollowUpPreparationRepository;
}

/**
 * Prepares and persists a Follow-Up Preparation draft for one of the
 * caller's own Opportunities (R-61..R-69). Ownership is resolved through
 * `deps.opportunities.getById` — the only place `opportunityId` is
 * checked against the caller, the same boundary
 * @acos/core-outreach-preparation's `prepareOutreachForOwner` uses.
 *
 * Returns `null` — never throws — when no Outreach Preparation exists yet
 * for this Opportunity (R-62: must not run before Outreach Preparation
 * has already succeeded; a missing Outreach Preparation row is itself
 * proof it has not). Never re-evaluates Qualification, Personalization,
 * or Outreach Preparation, never reads ResearchSignal, and never writes
 * to `opportunities` or `outreach_preparations` (R-61).
 *
 * An explicit, caller-invoked step, mirroring Qualification/
 * Personalization/Outreach Preparation's own "explicit, never automatic
 * on read" convention (R-69 idempotency): re-running against an
 * unchanged Outreach Preparation overwrites the same row with an
 * unchanged result; re-running after Outreach Preparation changed
 * produces a new result over the same row.
 */
export async function prepareOpportunityFollowUp(
  deps: FollowUpPreparationDeps,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredFollowUpPreparation | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return prepareFollowUpForOwner(deps, userId, opportunityId, now);
}

/**
 * Same behavior as {@link prepareOpportunityFollowUp}, for a caller that
 * has already resolved a trusted `userId` by some means other than a
 * session token — specifically, the Search worker (R-66), which claimed a
 * Search row and is reading ownership out of it, the same convention
 * @acos/core-outreach-preparation's `prepareOutreachForOwner` already
 * establishes. Not reachable from any HTTP path — only
 * `prepareOpportunityFollowUp()` (token-authenticated) is.
 */
export async function prepareFollowUpForOwner(
  deps: Omit<FollowUpPreparationDeps, 'identity'>,
  userId: string,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredFollowUpPreparation | null> {
  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new OpportunityNotFoundError(opportunityId);

  // R-62: eligibility gate. No Outreach Preparation row means Outreach
  // Preparation (and, transitively, Personalization and Qualification)
  // has not produced an eligible result for this Opportunity yet — never
  // an error, and Outreach Preparation itself is never re-evaluated or
  // written to.
  const outreachPreparation = await deps.outreachPreparations.getByOpportunityId(
    userId,
    opportunityId,
  );
  if (!outreachPreparation) return null;

  const generation = generateFollowUpPreparation(outreachPreparation);

  return deps.followUpPreparations.upsert(
    opportunity.id,
    outreachPreparation.prospectId,
    outreachPreparation.id,
    generation,
    GENERATOR_VERSION,
    now,
  );
}

/**
 * Reads one of the caller's own Follow-Up Preparation results. Returns
 * `null` when the Opportunity has never had one prepared (including "not
 * eligible"), or does not resolve to one the caller owns —
 * indistinguishable from "not yet prepared", the same convention
 * @acos/core-outreach-preparation's getOpportunityOutreachPreparation()
 * uses.
 */
export async function getOpportunityFollowUpPreparation(
  deps: Pick<FollowUpPreparationDeps, 'identity' | 'followUpPreparations'>,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredFollowUpPreparation | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.followUpPreparations.getByOpportunityId(userId, opportunityId);
}
