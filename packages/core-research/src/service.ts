import type { CompanyRepository, ProspectRepository } from '@acos/core-discovery';
import { requireUser, type IdentityRepository } from '@acos/core-identity';

import { toNewResearchSignals } from './mapping';
import type { ResearchProvider } from './provider';
import type { ResearchSignalRepository } from './repository';
import { ResearchProspectNotFoundError } from './signalErrors';
import type { ResearchRunResult, RunResearchInput, StoredResearchSignal } from './types';
import { validateRunResearchInput } from './validation';

// Application/service boundary.
// -----------------------------------------------------------------------
// The only place a raw session token is accepted. requireUser() resolves
// it FIRST — a caller never supplies a userId, and an unauthenticated
// token never reaches a repository or the provider (DEC-003), mirroring
// @acos/core-discovery's service.ts.
// -----------------------------------------------------------------------

export interface ResearchDeps {
  identity: IdentityRepository;
  companies: CompanyRepository;
  prospects: ProspectRepository;
  signals: ResearchSignalRepository;
  provider: ResearchProvider;
}

/**
 * Executes research for one of the caller's own Prospects: obtains a
 * classified result from the provider (R-09), maps it onto
 * NewResearchSignalInput rows preserving classification, raw confidence
 * and every evidence source (./mapping — NOT ./persist.ts's
 * toResearchRows()), and persists them (R-10) after superseding whatever
 * was there before (append-only; nothing is ever deleted).
 *
 * Ownership is resolved through Prospect, not a userId on ResearchSignal
 * itself (DEC-008): `deps.prospects.getById` is the only place a
 * `prospectId` is checked against the caller.
 *
 * Throws {@link ResearchProspectNotFoundError} when `prospectId` does not
 * resolve to a Prospect owned by the caller — indistinguishable from an
 * unknown id, the same convention as DiscoverySearchNotFoundError.
 */
export async function runResearch(
  deps: ResearchDeps,
  rawToken: string | undefined | null,
  input: RunResearchInput,
  now: Date = new Date(),
): Promise<ResearchRunResult> {
  const userId = await requireUser(deps.identity, rawToken, now);
  const { prospectId } = validateRunResearchInput(input);

  const prospect = await deps.prospects.getById(userId, prospectId);
  if (!prospect) throw new ResearchProspectNotFoundError(prospectId);

  const company = await deps.companies.getById(userId, prospect.companyId);
  if (!company) throw new ResearchProspectNotFoundError(prospectId);

  const research = await deps.provider.research({
    prospectId: prospect.id,
    companyId: company.id,
    companyName: company.name,
    normalizedDomain: company.normalizedDomain,
  });

  const signalInputs = toNewResearchSignals(research);
  const superseded = await deps.signals.supersedePrevious(prospect.id, now);
  const signals = await deps.signals.saveSignals(prospect.id, signalInputs, now);

  return { prospectId: prospect.id, superseded, signals };
}

/**
 * Reads the caller's own ResearchSignals for one Prospect. Ownership is
 * checked twice, independently: here via `deps.prospects.getById`, and
 * again inside `deps.signals.listByProspect`'s own join to prospects
 * (see ./pgRepository) — belt and suspenders for a model that carries no
 * user_id of its own (DEC-008).
 *
 * Throws {@link ResearchProspectNotFoundError} under the same convention
 * as runResearch().
 */
export async function listResearchSignals(
  deps: Pick<ResearchDeps, 'identity' | 'prospects' | 'signals'>,
  rawToken: string | undefined | null,
  prospectId: string,
  now: Date = new Date(),
): Promise<readonly StoredResearchSignal[]> {
  const userId = await requireUser(deps.identity, rawToken, now);
  const { prospectId: validated } = validateRunResearchInput({ prospectId });

  const prospect = await deps.prospects.getById(userId, validated);
  if (!prospect) throw new ResearchProspectNotFoundError(validated);

  return deps.signals.listByProspect(userId, prospect.id);
}
