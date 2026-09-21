import type { CompanyRepository, ProspectRepository } from '@acos/core-discovery';
import { requireUser, type IdentityRepository } from '@acos/core-identity';
import { OpportunityNotFoundError, type OpportunityRepository } from '@acos/core-opportunity';
import type { QualificationRepository } from '@acos/core-qualification';
import type { ResearchSignalRepository } from '@acos/core-research';
import type { SearchRepository } from '@acos/core-search';

import { selectPersonalizationEvidence } from './evidence';
import { generatePersonalization, GENERATOR_VERSION } from './generator';
import type { PersonalizationRepository } from './repository';
import type { StoredPersonalization } from './types';

// Application/service boundary, mirroring @acos/core-qualification's
// service.ts scoreOpportunity()/evaluateQualificationForOwner() split.
// -----------------------------------------------------------------------

export interface PersonalizationDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  qualifications: QualificationRepository;
  signals: ResearchSignalRepository;
  prospects: ProspectRepository;
  companies: CompanyRepository;
  searches: SearchRepository;
  personalizations: PersonalizationRepository;
}

/**
 * Evaluates and persists Personalization for one of the caller's own
 * Opportunities (R-42..R-53). Ownership is resolved through
 * `deps.opportunities.getById` — the only place `opportunityId` is
 * checked against the caller, the same boundary
 * @acos/core-qualification's `evaluateQualificationForOwner` uses.
 *
 * Returns `null` — never throws — for every R-42 ineligibility case: no
 * Qualification row yet, or a Qualification whose state is not
 * `QUALIFIED`. Personalization reads Qualification but never writes it
 * (R-42 "must never modify Qualification").
 *
 * An explicit, caller-invoked step, mirroring Qualification's own
 * "explicit, never automatic on read" convention (R-50 idempotency):
 * re-running against unchanged inputs overwrites the same row with an
 * unchanged result; re-running after evidence/qualification changed
 * produces a new result over the same row.
 */
export async function evaluateOpportunityPersonalization(
  deps: PersonalizationDeps,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredPersonalization | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return evaluatePersonalizationForOwner(deps, userId, opportunityId, now);
}

/**
 * Same behavior as {@link evaluateOpportunityPersonalization}, for a
 * caller that has already resolved a trusted `userId` by some means other
 * than a session token — specifically, the Search worker (R-51), which
 * claimed a Search row and is reading ownership out of it, the same
 * convention @acos/core-qualification's `evaluateQualificationForOwner`
 * already establishes. Not reachable from any HTTP path — only
 * `evaluateOpportunityPersonalization()` (token-authenticated) is.
 */
export async function evaluatePersonalizationForOwner(
  deps: Omit<PersonalizationDeps, 'identity'>,
  userId: string,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredPersonalization | null> {
  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new OpportunityNotFoundError(opportunityId);

  // R-42: eligibility gate. A missing row, or any state other than
  // QUALIFIED, means "no personalization" — never an error, and
  // Qualification itself is never read again for any other purpose.
  const qualification = await deps.qualifications.getByOpportunityId(userId, opportunityId);
  if (!qualification || qualification.state !== 'QUALIFIED') return null;

  // QUALIFIED implies needDetected was satisfied, which implies `offer`
  // is defined (see @acos/core-opportunity's createOpportunityForOwner) —
  // this check is defensive type-narrowing, not a reachable business
  // case, and never fabricates a recommendation when it is somehow absent.
  if (!opportunity.offer) return null;

  const signals = await deps.signals.listByProspect(userId, opportunity.prospectId);
  const evidence = selectPersonalizationEvidence(signals, qualification.evidenceSignalIds);
  // R-44: every claim must be evidence-traceable. Defensive guard against
  // a race between Qualification's own evaluation and this read (e.g. a
  // concurrent re-research superseding the exact signals Qualification
  // relied on) — never generate an unbacked artifact.
  if (evidence.length === 0) return null;

  const prospect = await deps.prospects.getById(userId, opportunity.prospectId);
  if (!prospect) return null;
  const [company, search] = await Promise.all([
    deps.companies.getById(userId, prospect.companyId),
    deps.searches.getById(userId, prospect.searchId),
  ]);
  if (!search) return null;

  const generation = generatePersonalization({
    companyName: company?.name ?? 'This company',
    offer: opportunity.offer,
    evidence,
    serviceProfile: {
      targetCustomer: search.parameters.targetCustomer,
      geography: search.parameters.geography,
    },
  });

  return deps.personalizations.upsert(opportunity.id, opportunity.prospectId, generation, GENERATOR_VERSION, now);
}

/**
 * Reads one of the caller's own Personalization results. Returns `null`
 * when the Opportunity has never been personalized (including "not
 * eligible"), or does not resolve to one the caller owns —
 * indistinguishable from "not yet generated", the same convention
 * @acos/core-qualification's getOpportunityQualification() uses.
 */
export async function getOpportunityPersonalization(
  deps: Pick<PersonalizationDeps, 'identity' | 'personalizations'>,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredPersonalization | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.personalizations.getByOpportunityId(userId, opportunityId);
}
