import type { CompanyRepository, ProspectRepository } from '@acos/core-discovery';
import { requireUser, type IdentityRepository } from '@acos/core-identity';
import type { OpportunityRepository } from '@acos/core-opportunity';
import { extractContactValues, type ResearchSignalRepository } from '@acos/core-research';

import { CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG } from './access';
import { LeadUnlockOpportunityNotFoundError, NoActiveClientFinderSubscriptionError, NoQualifyingContactError } from './errors';
import type { LeadUnlockRepository } from './leadUnlockRepository';
import type { SubscriptionPeriodRepository } from './subscriptionPeriodRepository';
import type { LeadUnlock } from './types';

// Lead unlock (reveal) orchestration -- plan §G.
// -----------------------------------------------------------------------
// Mirrors @acos/core-opportunity's recordFeedback()/createOpportunity()
// shape: a token-authenticated entry point (unlockOpportunity) and a
// ForOwner variant for a caller that has already resolved a trusted
// userId. Ownership of the Opportunity is resolved through
// `deps.opportunities.getById(userId, opportunityId)` -- the same
// boundary every other core-opportunity read/write uses.
//
// Order of operations, in the sequence plan §G specifies:
//
//   1. Opportunity ownership check.
//   2. Idempotency short-circuit: an already-unlocked opportunity is
//      returned as-is (IRL-I) -- BEFORE any subscription check, so a
//      permanently unlocked lead stays visible after the subscription
//      that unlocked it has since expired.
//   3. Active-subscription check (the only balance-free, boolean gate --
//      access-model decision §6/§11). No credit/quota check anywhere.
//   4. Eligibility: at least one K1-qualifying contact channel must be
//      extractable (CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md
//      §7) -- target-customer match is never consulted here.
//   5. Atomic reveal (leadUnlockRepository.revealAtomically) -- the only
//      write, and the only step that can create a new lead_unlocks row.
// -----------------------------------------------------------------------

export interface LeadUnlockDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  prospects: ProspectRepository;
  companies: CompanyRepository;
  signals: ResearchSignalRepository;
  subscriptionPeriods: SubscriptionPeriodRepository;
  leadUnlocks: LeadUnlockRepository;
}

/** Token-authenticated entry point for POST /api/opportunities/{id}/unlock. */
export async function unlockOpportunity(
  deps: LeadUnlockDeps,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<LeadUnlock> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return unlockOpportunityForOwner(deps, userId, opportunityId, now);
}

/**
 * Same behavior as {@link unlockOpportunity}, for a caller that has
 * already resolved a trusted `userId` by some means other than a
 * session token. Mirrors core-opportunity's createOpportunityForOwner/
 * scoreOpportunityForOwner split; not reachable from any HTTP path.
 */
export async function unlockOpportunityForOwner(
  deps: Omit<LeadUnlockDeps, 'identity'>,
  userId: string,
  opportunityId: string,
  now: Date = new Date(),
): Promise<LeadUnlock> {
  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new LeadUnlockOpportunityNotFoundError(opportunityId);

  // IRL-I: a previously unlocked opportunity stays permanently revealed,
  // independent of today's subscription state. Checked first so an
  // expired-subscription user retrieving an already-unlocked lead never
  // hits the active-subscription check below.
  const existing = await deps.leadUnlocks.findByUserAndOpportunity(userId, opportunityId);
  if (existing) return existing;

  const activePeriod = await deps.subscriptionPeriods.findActiveForUser(
    userId,
    CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG,
    now,
  );
  if (!activePeriod) throw new NoActiveClientFinderSubscriptionError();

  const prospect = await deps.prospects.getById(userId, opportunity.prospectId);
  if (!prospect) throw new LeadUnlockOpportunityNotFoundError(opportunityId);
  const company = await deps.companies.getById(userId, prospect.companyId);

  const signals = await deps.signals.listByProspect(userId, opportunity.prospectId);
  const contacts = extractContactValues(signals, company?.normalizedDomain ?? null);

  if (contacts.length === 0) throw new NoQualifyingContactError(opportunityId);

  return deps.leadUnlocks.revealAtomically(
    {
      userId,
      opportunityId,
      subscriptionPeriodId: activePeriod.id,
      contacts,
    },
    now,
  );
}
