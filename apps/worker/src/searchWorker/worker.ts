import type {
  CompanyRepository,
  DiscoveryProvider,
  ProspectRepository,
} from '@acos/core-discovery';
import { runDiscoveryForOwner } from '@acos/core-discovery';
import type { OpportunityRepository } from '@acos/core-opportunity';
import { createOpportunityForOwner } from '@acos/core-opportunity';
import type { ResearchProvider, ResearchSignalRepository } from '@acos/core-research';
import { runResearchForOwner } from '@acos/core-research';
import { MAX_SEARCH_ATTEMPTS, type SearchRepository, type StoredSearch } from '@acos/core-search';

// Search worker — claim, orchestrate, settle (R-34).
// -----------------------------------------------------------------------
// Canonical pipeline (Phase 17 scope lock, PRD V2.1 R-34/"WORKER
// OWNERSHIP"): Search -> Discovery -> Research -> Opportunity, for every
// Prospect Discovery finds. This module owns none of that domain logic —
// it reuses runDiscoveryForOwner / runResearchForOwner /
// createOpportunityForOwner unmodified (the "ForOwner" siblings of
// runDiscovery/runResearch/createOpportunity, which exist so a worker
// holding a persisted, claimed-row userId — never a session token — can
// call the exact same domain code a request would).
//
// Ownership: userId comes ONLY from the Search row this worker itself
// claimed via SearchRepository.claimNextPending — never from any other
// input. Every downstream repository call is scoped by that same value.
//
// Scoring, staleness, next-action, feedback and AI usage metering are
// deliberately NOT part of this pipeline — see the Phase 17 scope lock's
// "R-34 — AUTHORITATIVE DEFINITION" section for why.
// -----------------------------------------------------------------------

export interface SearchWorkerDeps {
  searches: SearchRepository;
  companies: CompanyRepository;
  prospects: ProspectRepository;
  discoveryProvider: DiscoveryProvider;
  signals: ResearchSignalRepository;
  /**
   * A factory, not a shared instance (Phase 18): the frozen
   * ResearchProvider.research(input) signature carries no userId, but
   * R-29 metering needs one at invocation time. Constructing a fresh
   * ResearchProvider per owner — using the userId this pipeline already
   * resolves below — lets a concrete implementation capture it for
   * metering without touching the ResearchProvider contract itself.
   */
  researchProvider: (userId: string) => ResearchProvider;
  opportunities: OpportunityRepository;
  /** Identifies this process/replica. Must be unique per worker instance. */
  workerId: string;
  now?: () => Date;
  leaseDurationMs?: number;
}

export type SearchAttemptOutcome =
  | { outcome: 'empty' }
  | { outcome: 'completed'; searchId: string; prospectsProcessed: number }
  | { outcome: 'retry'; searchId: string; attempts: number; error: string }
  | { outcome: 'failed'; searchId: string; attempts: number; error: string }
  | { outcome: 'fenced'; searchId: string; reason: string };

/**
 * A worker that dies holds a claimed Search for at most this long before
 * `releaseExpiredLeases` returns it to PENDING. Deliberately generous
 * relative to apps/worker/src/metaEvents' 5-minute lease: this pipeline
 * can call an AI research provider — with its own internal retry/backoff
 * budget — once per discovered Prospect, sequentially, so a Search with
 * several Prospects can legitimately run for minutes. Not an environment
 * variable, for the same reason metaEvents' LEASE_DURATION_MS isn't: it
 * is an operational constant changed deliberately in code, not a knob
 * exposed to a configuration that could silently drift out of step with
 * how long the pipeline actually takes.
 */
export const DEFAULT_SEARCH_LEASE_DURATION_MS = 10 * 60 * 1000;

const clockOf = (deps: SearchWorkerDeps) => deps.now ?? (() => new Date());

/**
 * Claims at most one eligible PENDING Search and runs the canonical
 * pipeline against it, settling the row on success or failure. Returns
 * `{ outcome: 'empty' }` when there was nothing to claim — the caller
 * (the poll loop) is expected to wait before trying again.
 */
export async function claimAndProcessNextSearch(
  deps: SearchWorkerDeps,
): Promise<SearchAttemptOutcome> {
  const claimNow = clockOf(deps)();
  const leaseMs = deps.leaseDurationMs ?? DEFAULT_SEARCH_LEASE_DURATION_MS;

  const claimed = await deps.searches.claimNextPending({
    workerId: deps.workerId,
    now: claimNow,
    leaseExpiresAt: new Date(claimNow.getTime() + leaseMs),
  });
  if (!claimed) return { outcome: 'empty' };

  try {
    const { prospectsProcessed } = await runCanonicalPipeline(deps, claimed);

    const owned = await deps.searches.completeClaimed({
      id: claimed.id,
      workerId: deps.workerId,
      now: clockOf(deps)(),
    });
    return owned
      ? { outcome: 'completed', searchId: claimed.id, prospectsProcessed }
      : { outcome: 'fenced', searchId: claimed.id, reason: 'lease lost before completion' };
  } catch (cause) {
    const error = describeError(cause);
    const settled = await deps.searches.recordAttemptFailure({
      id: claimed.id,
      workerId: deps.workerId,
      now: clockOf(deps)(),
      error,
      maxAttempts: MAX_SEARCH_ATTEMPTS,
    });

    if (settled === null) {
      return { outcome: 'fenced', searchId: claimed.id, reason: 'lease lost before failure' };
    }
    return settled === 'FAILED'
      ? { outcome: 'failed', searchId: claimed.id, attempts: claimed.attempts, error }
      : { outcome: 'retry', searchId: claimed.id, attempts: claimed.attempts, error };
  }
}

/**
 * The canonical pipeline for one already-claimed Search: Discovery once,
 * then Research + Opportunity for every Prospect Discovery found.
 *
 * A failure at any point (thrown by any of the three domain calls) stops
 * all further processing for this Search and propagates to the caller,
 * which records it as a failed attempt — no partial pipeline result is
 * ever reported as success.
 *
 * Idempotent on retry: Discovery's find-or-create persistence and
 * Research's supersede-then-insert persistence are already safe to redo
 * (existing, unmodified domain behavior). Opportunity creation is NOT
 * idempotent by itself (`OpportunityRepository.create` throws on a
 * second call for the same Prospect — the existing, unmodified,
 * database-enforced one-per-Prospect invariant), so this orchestration
 * checks `findByProspectId` first and skips creation for a Prospect that
 * already has one, exactly the retry-safety pre-check pattern
 * `SearchRepository.findByIdempotencyKey` already establishes elsewhere
 * in this codebase.
 */
async function runCanonicalPipeline(
  deps: SearchWorkerDeps,
  search: StoredSearch,
): Promise<{ prospectsProcessed: number }> {
  const userId = search.userId;

  const discovery = await runDiscoveryForOwner(
    {
      searches: deps.searches,
      companies: deps.companies,
      prospects: deps.prospects,
      provider: deps.discoveryProvider,
    },
    userId,
    { searchId: search.id },
  );

  for (const prospect of discovery.prospects) {
    await runResearchForOwner(
      {
        companies: deps.companies,
        prospects: deps.prospects,
        signals: deps.signals,
        provider: deps.researchProvider(userId),
      },
      userId,
      { prospectId: prospect.id },
    );

    const existingOpportunity = await deps.opportunities.findByProspectId(userId, prospect.id);
    if (!existingOpportunity) {
      await createOpportunityForOwner(
        {
          prospects: deps.prospects,
          searches: deps.searches,
          signals: deps.signals,
          opportunities: deps.opportunities,
        },
        userId,
        { prospectId: prospect.id },
      );
    }
  }

  return { prospectsProcessed: discovery.prospects.length };
}

function describeError(cause: unknown): string {
  if (cause instanceof Error) return `${cause.name}: ${cause.message}`;
  return String(cause);
}
