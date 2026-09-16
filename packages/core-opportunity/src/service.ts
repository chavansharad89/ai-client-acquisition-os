import { suggestOffers } from '@acos/core-acquisition';
import type { ProspectRepository } from '@acos/core-discovery';
import { requireUser, type IdentityRepository } from '@acos/core-identity';
import type { ResearchSignalRepository } from '@acos/core-research';
import type { SearchRepository } from '@acos/core-search';

import { toOfferSignals, toServiceRule } from './adapters';
import { OpportunityNotFoundError, OpportunityProspectNotFoundError } from './errors';
import type { OpportunityRepository } from './repository';
import type { CreateOpportunityInput, StoredOpportunity } from './types';
import { validateCreateOpportunityInput } from './validation';

// Application/service boundary.
// -----------------------------------------------------------------------
// The only place a raw session token is accepted. requireUser() resolves
// it FIRST — a caller never supplies a userId, and an unauthenticated
// token never reaches a repository (DEC-003), mirroring
// @acos/core-research's service.ts.
// -----------------------------------------------------------------------

export interface OpportunityDeps {
  identity: IdentityRepository;
  prospects: ProspectRepository;
  searches: SearchRepository;
  signals: ResearchSignalRepository;
  opportunities: OpportunityRepository;
}

/**
 * Creates an Opportunity for one of the caller's own Prospects (R-13):
 * detects a need and recommends an offer (R-11/R-12) from the Prospect's
 * persisted, currently-active ResearchSignals against the caller's own
 * service — the ServiceProfile snapshot immutably retained on the
 * Prospect's Search (DEC-007), not a fresh ServiceProfile lookup, since
 * that snapshot is exactly what this Prospect was discovered against and
 * a later profile edit must not change what an existing Opportunity
 * meant.
 *
 * Reuses @acos/core-acquisition's `suggestOffers()` unmodified (PRD
 * V2.1: no replacement scoring/offer framework) via ./adapters. An empty
 * result is AC-13/AC-14's NO SUITABLE OFFER — never a default to the
 * caller's own service.
 *
 * Ownership is resolved through Prospect, then Search, both via
 * `deps.*.getById(userId, ...)` — the only places a `prospectId`/
 * `searchId` are checked against the caller. Throws
 * {@link OpportunityProspectNotFoundError} when `prospectId` does not
 * resolve to a Prospect owned by the caller — indistinguishable from an
 * unknown id, the same convention as ResearchProspectNotFoundError.
 *
 * Created at state 'NEW' (PRD V2.1: "the MVP exercises NEW and
 * RESEARCHED"; no transition into RESEARCHED is implemented by this
 * phase). One Opportunity per Prospect — see
 * OpportunityRepository.create.
 */
export async function createOpportunity(
  deps: OpportunityDeps,
  rawToken: string | undefined | null,
  input: CreateOpportunityInput,
  now: Date = new Date(),
): Promise<StoredOpportunity> {
  const userId = await requireUser(deps.identity, rawToken, now);
  const { prospectId } = validateCreateOpportunityInput(input);

  const prospect = await deps.prospects.getById(userId, prospectId);
  if (!prospect) throw new OpportunityProspectNotFoundError(prospectId);

  const search = await deps.searches.getById(userId, prospect.searchId);
  if (!search) throw new OpportunityProspectNotFoundError(prospectId);

  const signals = await deps.signals.listByProspect(userId, prospect.id);
  const offerSignals = toOfferSignals(signals);
  const rule = toServiceRule(search.parameters);

  const suggestions = suggestOffers(offerSignals, [rule]);
  const top = suggestions[0];

  return deps.opportunities.create(
    userId,
    {
      prospectId: prospect.id,
      needDetected: top !== undefined,
      offer: top && {
        service: top.service,
        rationale: top.rationale,
        estimatedValuePaise: top.estimatedValuePaise,
        fit: top.fit,
        basedOn: top.basedOn,
      },
    },
    now,
  );
}

/**
 * Reads one of the caller's own Opportunities. Throws
 * {@link OpportunityNotFoundError} when `id` does not resolve to an
 * Opportunity owned by the caller — indistinguishable from an unknown
 * id.
 */
export async function getOpportunity(
  deps: Pick<OpportunityDeps, 'identity' | 'opportunities'>,
  rawToken: string | undefined | null,
  id: string,
  now: Date = new Date(),
): Promise<StoredOpportunity> {
  const userId = await requireUser(deps.identity, rawToken, now);
  const opportunity = await deps.opportunities.getById(userId, id);
  if (!opportunity) throw new OpportunityNotFoundError(id);
  return opportunity;
}

/** Lists the caller's own Opportunities. Never a global list. */
export async function listOpportunities(
  deps: Pick<OpportunityDeps, 'identity' | 'opportunities'>,
  rawToken: string | undefined | null,
  now: Date = new Date(),
): Promise<readonly StoredOpportunity[]> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.opportunities.list(userId);
}
