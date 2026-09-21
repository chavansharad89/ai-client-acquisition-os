import type {
  CompanyRepository,
  DiscoveryProvider,
  ProspectRepository,
} from '@acos/core-discovery';
import { runDiscoveryForOwner } from '@acos/core-discovery';
import type { OpportunityRepository } from '@acos/core-opportunity';
import { createOpportunityForOwner } from '@acos/core-opportunity';
import type { OutreachPreparationRepository } from '@acos/core-outreach-preparation';
import { prepareOutreachForOwner } from '@acos/core-outreach-preparation';
import type { PersonalizationRepository } from '@acos/core-personalization';
import { evaluatePersonalizationForOwner } from '@acos/core-personalization';
import type { QualificationRepository } from '@acos/core-qualification';
import { evaluateQualificationForOwner } from '@acos/core-qualification';
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
  /**
   * Phase 20 (R-41): evaluates and persists Qualification for every
   * Prospect's Opportunity, immediately after it is created or found —
   * see runCanonicalPipeline below. Qualification reuses the exact
   * `userId` this pipeline already resolves; it introduces no new
   * claim/lease/retry concept of its own.
   *
   * Optional, not required: making this required would force every
   * existing caller that builds a `SearchWorkerDeps` object — including
   * Phase 17/18's own integration tests — to be edited merely to keep
   * compiling, which the Phase 20 scope-lock's freeze constraints forbid
   * touching. The real entrypoint (apps/worker/src/index.ts) always
   * supplies it, so production runs always evaluate Qualification;
   * omitting it (only in a caller that predates Phase 20 and never
   * exercises Qualification) skips the step rather than failing.
   */
  qualifications?: QualificationRepository;
  /**
   * Phase 21 (R-51): evaluates and persists Personalization for every
   * Prospect's Opportunity, immediately after Qualification runs — see
   * runCanonicalPipeline below. Reuses the exact `userId` this pipeline
   * already resolves; introduces no new claim/lease/retry concept.
   *
   * Optional for the same reason `qualifications` above is: making it
   * required would force every existing caller that builds a
   * `SearchWorkerDeps` object — including every pre-Phase-21 test — to be
   * edited merely to keep compiling. The real entrypoint
   * (apps/worker/src/index.ts) always supplies it, so production runs
   * always attempt Personalization; omitting it skips the step rather
   * than failing. Only reachable when `qualifications` is also supplied
   * and ran successfully — Personalization's own R-42 eligibility gate
   * (Qualification state === QUALIFIED) is enforced inside
   * `evaluatePersonalizationForOwner` itself, not by this worker.
   */
  personalizations?: PersonalizationRepository;
  /**
   * Phase 22 (R-59): prepares and persists an inert, human-reviewable
   * Outreach Preparation draft for every Prospect's Opportunity,
   * immediately after Personalization runs — see runCanonicalPipeline
   * below. Reuses the exact `userId` this pipeline already resolves;
   * introduces no new claim/lease/retry concept, and no send capability
   * of any kind (see @acos/core-outreach-preparation's own R-58
   * no-send guarantee).
   *
   * Optional for the same reason `qualifications`/`personalizations`
   * above are: making it required would force every existing caller
   * that builds a `SearchWorkerDeps` object — including every
   * pre-Phase-22 test — to be edited merely to keep compiling. The real
   * entrypoint (apps/worker/src/index.ts) always supplies it, so
   * production runs always attempt Outreach Preparation; omitting it
   * skips the step rather than failing. Only reachable when
   * `deps.personalizations` is also configured and Personalization
   * itself already ran in this pass — enforced by nesting, not a
   * separate flag.
   */
  outreachPreparations?: OutreachPreparationRepository;
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
 * then Research + Opportunity + Qualification + Personalization for
 * every Prospect Discovery found.
 *
 * A failure at any point (thrown by any of the five domain calls) stops
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
 * in this codebase. Qualification (Phase 20, R-41) IS idempotent by
 * itself (`upsert` on `UNIQUE(opportunity_id)` — R-39), so when
 * `deps.qualifications` is configured it runs unconditionally for both a
 * newly-created and an already-existing Opportunity: this is what makes
 * "changed evidence -> new evaluation" reachable on a Search retry
 * without any new retry concept. `deps.qualifications` is optional
 * (skipped when absent) solely so pre-Phase-20 callers of this function
 * need no change — see SearchWorkerDeps' own doc comment.
 *
 * Personalization (Phase 21, R-51) runs immediately after Qualification,
 * strictly nested inside the same `if (deps.qualifications)` branch —
 * never invoked in a pass where Qualification itself did not just run —
 * and only when `deps.personalizations` is also configured (optional for
 * the same pre-existing-caller reason as `deps.qualifications`).
 * `evaluatePersonalizationForOwner` is idempotent by itself (`upsert` on
 * `UNIQUE(opportunity_id)` — R-49) and enforces its own R-42 eligibility
 * gate (Qualification state === QUALIFIED) internally — this orchestration
 * calls it unconditionally whenever both dependencies are present and
 * lets it decide whether a Personalization is actually produced.
 *
 * Outreach Preparation (Phase 22, R-59) runs immediately after
 * Personalization, strictly nested inside the same `if
 * (deps.personalizations)` branch — never invoked in a pass where
 * Personalization itself did not just run — and only when
 * `deps.outreachPreparations` is also configured (optional for the same
 * pre-existing-caller reason as `deps.qualifications`/
 * `deps.personalizations`). `prepareOutreachForOwner` is idempotent by
 * itself (`upsert` on `UNIQUE(opportunity_id)` — R-57) and enforces its
 * own eligibility gate (a Personalization row must already exist)
 * internally — this orchestration calls it unconditionally whenever both
 * dependencies are present and lets it decide whether a draft is
 * actually produced. It never sends anything — see
 * @acos/core-outreach-preparation's own R-58 no-send guarantee.
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
    const opportunity =
      existingOpportunity ??
      (await createOpportunityForOwner(
        {
          prospects: deps.prospects,
          searches: deps.searches,
          signals: deps.signals,
          opportunities: deps.opportunities,
        },
        userId,
        { prospectId: prospect.id },
      ));

    if (deps.qualifications) {
      await evaluateQualificationForOwner(
        {
          opportunities: deps.opportunities,
          signals: deps.signals,
          qualifications: deps.qualifications,
        },
        userId,
        opportunity.id,
      );

      if (deps.personalizations) {
        await evaluatePersonalizationForOwner(
          {
            opportunities: deps.opportunities,
            qualifications: deps.qualifications,
            signals: deps.signals,
            prospects: deps.prospects,
            companies: deps.companies,
            searches: deps.searches,
            personalizations: deps.personalizations,
          },
          userId,
          opportunity.id,
        );

        if (deps.outreachPreparations) {
          await prepareOutreachForOwner(
            {
              opportunities: deps.opportunities,
              personalizations: deps.personalizations,
              outreachPreparations: deps.outreachPreparations,
            },
            userId,
            opportunity.id,
          );
        }
      }
    }
  }

  return { prospectsProcessed: discovery.prospects.length };
}

function describeError(cause: unknown): string {
  if (cause instanceof Error) return `${cause.name}: ${cause.message}`;
  return String(cause);
}
