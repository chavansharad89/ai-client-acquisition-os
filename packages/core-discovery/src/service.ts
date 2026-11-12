import { requireUser, type IdentityRepository } from '@acos/core-identity';
import type { SearchRepository } from '@acos/core-search';

import type { EntityRepository, IdentityAnchorInput } from './entityRepository';
import { DiscoveryInvalidSearchStateError, DiscoverySearchNotFoundError } from './errors';
import { normalizeCandidate } from './normalize';
import type { DiscoveryCandidate, DiscoveryProvider } from './provider';
import type { CompanyRepository, ProspectRepository } from './repository';
import type { RunDiscoveryInput, StoredCompany, StoredProspect } from './types';
import { validateRunDiscoveryInput } from './validation';

/**
 * D22 Category 1/2 identity evidence derivable from one DiscoveryCandidate,
 * for the resolver (./entityRepository). `provider` is whichever concrete
 * provider actually produced this candidate (DiscoveryResult.provider) —
 * service.ts never hardcodes a provider name, preserving R-06's
 * provider-agnostic boundary.
 *
 * CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001 OQ-4: a provider's `website`
 * (Google Places' `websiteUri`), when returned for a specific, matched
 * candidate, satisfies D23 verification for the associated domain
 * evidence — DNS/owner proof is not required. This does NOT grant
 * alone-resolution (OQ-1 reserves that to Place ID only); OQ-2's
 * corroboration rule still applies to domain evidence.
 */
function identityAnchorsFor(
  candidate: DiscoveryCandidate,
  normalizedDomain: string | null,
  provider: string,
): IdentityAnchorInput[] {
  const anchors: IdentityAnchorInput[] = [];
  if (candidate.placeId) {
    anchors.push({
      category: 'PROVIDER_STABLE_ID',
      evidenceType: 'GOOGLE_PLACE_ID',
      normalizedValue: candidate.placeId,
      sourceProvider: provider,
      verified: true,
    });
  }
  if (normalizedDomain) {
    anchors.push({
      category: 'OFFICIAL_DIGITAL_IDENTITY',
      evidenceType: 'DOMAIN',
      normalizedValue: normalizedDomain,
      sourceProvider: provider,
      verified: true,
    });
  }
  return anchors;
}

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
  /**
   * Global Entity Architecture (D1/D8/D21/OQ-1/OQ-2/OQ-3/OQ-8): the
   * atomic resolver + transaction wrapper this function now uses for
   * every accepted candidate, replacing the previous direct
   * `companies.findOrCreateByDomain`/`prospects.findOrCreate` pair for
   * THIS code path only. `companies`/`prospects` above remain on
   * `DiscoveryDeps` because callers outside this function (e.g. the
   * worker, via `CompanyRepository.getById`) still use them directly.
   */
  entities: EntityRepository;
}

export interface DiscoveryRunResult {
  searchId: string;
  companies: readonly StoredCompany[];
  prospects: readonly StoredProspect[];
  /**
   * Raw candidate count returned by the provider, before normalization —
   * i.e. `deps.provider.discover(search).length`. Observability only
   * (Discovery-Query Audit): lets a caller distinguish "the provider
   * returned few candidates" from "the provider returned many and
   * normalization discarded most" without changing normalization or
   * filtering behavior. Always equals `prospects.length + skipped`.
   */
  candidatesReceived: number;
  /** Provider candidates that could not be normalized (missing name/website, unparsable URL) — skipped, never persisted. */
  skipped: number;
  /**
   * Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D14/N1):
   * each accepted candidate's raw businessStatus (or null when the
   * provider didn't return one), keyed by the Prospect row just created
   * for it. Purely in-memory for this one Discovery run — never
   * persisted on Company/Prospect; a caller (the worker) consumes it the
   * same tick to produce deterministic Entity-Reality evidence. D14/N1
   * is unchanged by this: a candidate with no website is still skipped
   * above and never reaches this map.
   */
  businessStatusByProspectId: ReadonlyMap<string, string | null>;
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
 * duplicate Company, Prospect, or Entity rows — see
 * EntityRepository.resolveAndPersistCandidate.
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

  const { candidates, actualQuery, provider } = await deps.provider.discover(search);

  const companies: StoredCompany[] = [];
  const prospects: StoredProspect[] = [];
  const businessStatusByProspectId = new Map<string, string | null>();
  let skipped = 0;

  for (const candidate of candidates) {
    // C-1 (website-less discovery): requireWebsite: false — scoped to
    // THIS caller only. intentIntake.ts's own normalizeCandidate() call
    // never passes this option and keeps its original, stricter
    // behavior (K1 boundary unchanged).
    const normalized = normalizeCandidate(candidate, { requireWebsite: false });
    if (!normalized) {
      skipped += 1;
      // OQ-8/Q3: a name-less candidate is MISSING_NAME; any candidate
      // that reaches this branch with a name already present failed
      // only because a PRESENT website could not be parsed (a wholly
      // absent website no longer fails normalization under
      // requireWebsite: false) — MISSING_WEBSITE_UNPARSEABLE.
      await deps.entities.recordFailedAttempt(
        {
          searchId: search.id,
          provider,
          actualQuery,
          failureReason: candidate.name?.trim() ? 'MISSING_WEBSITE_UNPARSEABLE' : 'MISSING_NAME',
        },
        now,
      );
      continue;
    }

    const anchors = identityAnchorsFor(candidate, normalized.normalizedDomain, provider);
    const { company, prospect } = await deps.entities.resolveAndPersistCandidate(
      {
        userId,
        searchId: search.id,
        name: normalized.name,
        normalizedDomain: normalized.normalizedDomain,
        anchors,
        provider,
        actualQuery,
      },
      now,
    );

    companies.push(company);
    prospects.push(prospect);
    businessStatusByProspectId.set(prospect.id, candidate.businessStatus ?? null);
  }

  return {
    searchId: search.id,
    companies,
    prospects,
    candidatesReceived: candidates.length,
    skipped,
    businessStatusByProspectId,
  };
}
