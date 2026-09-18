import { requireUser, type IdentityRepository } from '@acos/core-identity';
import type { SearchRepository } from '@acos/core-search';

import { DiscoveryInvalidSearchStateError, DiscoverySearchNotFoundError } from './errors';
import { normalizeCandidate } from './normalize';
import type { DiscoveryProvider } from './provider';
import type { CompanyRepository, ProspectRepository } from './repository';
import type { RunDiscoveryInput, StoredCompany, StoredProspect } from './types';
import { validateRunDiscoveryInput } from './validation';

// Application/service boundary.
// -----------------------------------------------------------------------
// The only place a raw session token is accepted. requireUser() resolves
// it FIRST — a caller never supplies a userId, and an unauthenticated
// token never reaches a repository or the provider (DEC-003), mirroring
// @acos/core-search's service.ts.
// -----------------------------------------------------------------------

export interface DiscoveryDeps {
  identity: IdentityRepository;
  searches: SearchRepository;
  companies: CompanyRepository;
  prospects: ProspectRepository;
  provider: DiscoveryProvider;
}

export interface DiscoveryRunResult {
  searchId: string;
  companies: readonly StoredCompany[];
  prospects: readonly StoredProspect[];
  /** Provider candidates that could not be normalized (missing name/website, unparsable URL) — skipped, never persisted. */
  skipped: number;
}

/**
 * Executes discovery for one of the caller's own Searches: obtains
 * candidates from the provider (R-06), normalizes them into Company
 * records (R-07), and persists the (Search, Company) relationship
 * deduplicated as Prospect (R-08).
 *
 * Only runs while the Search is RUNNING (V2.1 Stage E: discovery is the
 * work that happens once a worker has claimed a Search via
 * PENDING -> RUNNING). This function does NOT transition the Search to
 * COMPLETE or FAILED itself — that stays a separate, explicit call to
 * @acos/core-search's transitionSearch(), the same way this package
 * never reaches into that one's state machine.
 *
 * Throws {@link DiscoverySearchNotFoundError} when `searchId` does not
 * resolve to a Search owned by the caller — indistinguishable from an
 * unknown id, the same convention as
 * SearchServiceProfileNotFoundError.
 *
 * Throws {@link DiscoveryInvalidSearchStateError} when the caller's own
 * Search exists but is not RUNNING.
 *
 * Idempotent: calling this again for the same Search (a retry, or a
 * provider returning the same candidates twice) does not create
 * duplicate Company or Prospect rows — see
 * CompanyRepository.findOrCreateByDomain and
 * ProspectRepository.findOrCreate.
 */
export async function runDiscovery(
  deps: DiscoveryDeps,
  rawToken: string | undefined | null,
  input: RunDiscoveryInput,
  now: Date = new Date(),
): Promise<DiscoveryRunResult> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return runDiscoveryForOwner(deps, userId, input, now);
}

/**
 * Same behavior as {@link runDiscovery}, for a caller that has already
 * resolved a trusted `userId` by some means other than a session token —
 * specifically, a worker that claimed a Search row and is reading
 * ownership out of it (R-34's "WORKER OWNERSHIP": the worker "is handed
 * nothing; it claims a row and reads ownership out of it"). Not reachable
 * from any HTTP path — only `runDiscovery()` (token-authenticated) is.
 *
 * `identity` is accepted-but-unused on `deps` for callers that already
 * have a full {@link DiscoveryDeps}; the `Omit` below is what a caller
 * building deps fresh (e.g. a worker) actually needs to supply.
 */
export async function runDiscoveryForOwner(
  deps: Omit<DiscoveryDeps, 'identity'>,
  userId: string,
  input: RunDiscoveryInput,
  now: Date = new Date(),
): Promise<DiscoveryRunResult> {
  const { searchId } = validateRunDiscoveryInput(input);

  const search = await deps.searches.getById(userId, searchId);
  if (!search) throw new DiscoverySearchNotFoundError(searchId);
  if (search.status !== 'RUNNING') {
    throw new DiscoveryInvalidSearchStateError(search.status);
  }

  const candidates = await deps.provider.discover(search);

  const companies: StoredCompany[] = [];
  const prospects: StoredProspect[] = [];
  let skipped = 0;

  for (const candidate of candidates) {
    const normalized = normalizeCandidate(candidate);
    if (!normalized) {
      skipped += 1;
      continue;
    }

    const company = await deps.companies.findOrCreateByDomain(userId, normalized, now);
    const prospect = await deps.prospects.findOrCreate(
      userId,
      { searchId: search.id, companyId: company.id },
      now,
    );

    companies.push(company);
    prospects.push(prospect);
  }

  return { searchId: search.id, companies, prospects, skipped };
}
