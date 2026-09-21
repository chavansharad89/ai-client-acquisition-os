import { requireUser, type IdentityRepository } from '@acos/core-identity';
import { OpportunityNotFoundError, type OpportunityRepository } from '@acos/core-opportunity';
import type { PersonalizationRepository } from '@acos/core-personalization';

import { generateOutreachPreparation, GENERATOR_VERSION } from './generator';
import type { OutreachPreparationRepository } from './repository';
import type { StoredOutreachPreparation } from './types';

// Application/service boundary, mirroring @acos/core-personalization's
// service.ts evaluateOpportunityPersonalization()/evaluatePersonalizationForOwner()
// split (Phase 22, R-54..R-60).
// -----------------------------------------------------------------------

export interface OutreachPreparationDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  personalizations: PersonalizationRepository;
  outreachPreparations: OutreachPreparationRepository;
}

/**
 * Prepares and persists an Outreach Preparation draft for one of the
 * caller's own Opportunities (R-54..R-60). Ownership is resolved through
 * `deps.opportunities.getById` — the only place `opportunityId` is
 * checked against the caller, the same boundary
 * @acos/core-personalization's `evaluatePersonalizationForOwner` uses.
 *
 * Returns `null` — never throws — when no Personalization exists yet for
 * this Opportunity (R-59: must not run before Opportunity, Qualification,
 * and Personalization have all already succeeded; a missing
 * Personalization row is itself proof at least one of those three has
 * not). Never re-evaluates Qualification or Personalization, never reads
 * ResearchSignal, and never writes to `personalizations` or
 * `opportunities` (R-55).
 *
 * An explicit, caller-invoked step, mirroring Qualification/
 * Personalization's own "explicit, never automatic on read" convention
 * (R-57 idempotency): re-running against an unchanged Personalization
 * overwrites the same row with an unchanged result; re-running after
 * Personalization changed produces a new result over the same row.
 */
export async function prepareOpportunityOutreach(
  deps: OutreachPreparationDeps,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredOutreachPreparation | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return prepareOutreachForOwner(deps, userId, opportunityId, now);
}

/**
 * Same behavior as {@link prepareOpportunityOutreach}, for a caller that
 * has already resolved a trusted `userId` by some means other than a
 * session token — specifically, the Search worker (R-59), which claimed a
 * Search row and is reading ownership out of it, the same convention
 * @acos/core-personalization's `evaluatePersonalizationForOwner` already
 * establishes. Not reachable from any HTTP path — only
 * `prepareOpportunityOutreach()` (token-authenticated) is.
 */
export async function prepareOutreachForOwner(
  deps: Omit<OutreachPreparationDeps, 'identity'>,
  userId: string,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredOutreachPreparation | null> {
  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new OpportunityNotFoundError(opportunityId);

  // R-59: eligibility gate. No Personalization row means Personalization
  // (and, transitively, Qualification) has not produced an eligible
  // result for this Opportunity yet — never an error, and Personalization
  // itself is never re-evaluated or written to.
  const personalization = await deps.personalizations.getByOpportunityId(userId, opportunityId);
  if (!personalization) return null;

  const generation = generateOutreachPreparation(personalization);

  return deps.outreachPreparations.upsert(
    opportunity.id,
    personalization.prospectId,
    personalization.id,
    generation,
    GENERATOR_VERSION,
    now,
  );
}

/**
 * Reads one of the caller's own Outreach Preparation results. Returns
 * `null` when the Opportunity has never had one prepared (including "not
 * eligible"), or does not resolve to one the caller owns —
 * indistinguishable from "not yet prepared", the same convention
 * @acos/core-personalization's getOpportunityPersonalization() uses.
 */
export async function getOpportunityOutreachPreparation(
  deps: Pick<OutreachPreparationDeps, 'identity' | 'outreachPreparations'>,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredOutreachPreparation | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.outreachPreparations.getByOpportunityId(userId, opportunityId);
}
