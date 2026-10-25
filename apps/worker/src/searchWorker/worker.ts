import type {
  CompanyRepository,
  DiscoveryProvider,
  EntityRepository,
  ProspectRepository,
  StoredCompany,
  StoredProspect,
} from '@acos/core-discovery';
import { runDiscoveryForOwner } from '@acos/core-discovery';
import type { FollowUpPreparationRepository } from '@acos/core-followup-preparation';
import { prepareFollowUpForOwner } from '@acos/core-followup-preparation';
import type {
  AiEnrichment,
  AiEnrichmentReason,
  OpportunityRepository,
  OpportunityScoreRepository,
} from '@acos/core-opportunity';
import {
  createOpportunityForOwner,
  previewOpportunityRanking,
  recordAiEnrichmentForOwner,
  scoreOpportunityForOwner,
  type OpportunityRankingPreview,
} from '@acos/core-opportunity';
import type { OutreachPreparationRepository } from '@acos/core-outreach-preparation';
import { prepareOutreachForOwner } from '@acos/core-outreach-preparation';
import type { PersonalizationRepository } from '@acos/core-personalization';
import { evaluatePersonalizationForOwner } from '@acos/core-personalization';
import type { QualificationRepository } from '@acos/core-qualification';
import { evaluateQualificationForOwner } from '@acos/core-qualification';
import type {
  AdmissionDecision,
  CategoryPlausibilityRepository,
  DeterministicSignal,
  ResearchProvider,
  ResearchSignalCacheRepository,
  ResearchSignalRepository,
  ServiceSignalCatalogue,
  SourceDocumentProvider,
  SuppliedSourceDocuments,
  TargetCustomerMatchModelDeps,
  TargetCustomerMatchRepository,
} from '@acos/core-research';
import {
  applyCachedSignalsForOwner,
  detectPlacesEntityReality,
  eliminateDeterministically,
  evaluateAdmission,
  fetchPreAdmissionDocuments,
  lookupCachedSignalForOwner,
  runResearchForOwner,
  saveDeterministicSignals,
} from '@acos/core-research';
import {
  AI_ESCALATION_BUDGET,
  MAX_SEARCH_ATTEMPTS,
  type SearchRepository,
  type StoredSearch,
} from '@acos/core-search';

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
// Scoring (R-14/R-15/R-17, via scoreOpportunityForOwner) runs immediately
// after Opportunity creation/lookup — see runCanonicalPipeline below.
// Staleness, next-action and AI usage metering remain deliberately NOT
// part of this pipeline — see the Phase 17 scope lock's "R-34 —
// AUTHORITATIVE DEFINITION" section for why; scoring's own wiring here
// reuses the identical, unmodified scoreOpportunity() algorithm and
// persistence via the same "ForOwner" split every other stage already
// uses, per an explicit product decision to authorize this specific step.
// -----------------------------------------------------------------------

export interface SearchWorkerDeps {
  searches: SearchRepository;
  companies: CompanyRepository;
  prospects: ProspectRepository;
  /** Global Entity Architecture (D1/D8/D21) — see @acos/core-discovery's EntityRepository. */
  entities: EntityRepository;
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
   * Production scoring wiring (R-14/R-15/R-17): scores and persists every
   * Prospect's Opportunity immediately after it is created or found — see
   * runCanonicalPipeline below. Reuses the exact `userId` this pipeline
   * already resolves via `scoreOpportunityForOwner`, the "ForOwner"
   * sibling of the existing, unmodified `scoreOpportunity()`; introduces
   * no new claim/lease/retry concept, no schema change, no new provider,
   * and no change to the seven-factor algorithm or to `neutralScoringInputs()`
   * (icpFit/abilityToPay/urgency/contactability remain neutral, by
   * explicit product decision, not by this wiring).
   *
   * Optional, not required: making this required would force every
   * existing caller that builds a `SearchWorkerDeps` object — including
   * every pre-this-change test — to be edited merely to keep compiling.
   * The real entrypoint (apps/worker/src/index.ts) always supplies it, so
   * production runs always score; omitting it (only in a caller that
   * predates this wiring and never exercises scoring) skips the step
   * rather than failing. Independent of `qualifications`/
   * `personalizations`/`outreachPreparations`/`followUpPreparations` —
   * scoring has no data dependency on any of those stages in either
   * direction, so it is not nested inside their conditionals.
   */
  scores?: OpportunityScoreRepository;
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
  /**
   * Phase 23 (R-66): prepares and persists an inert, human-reviewable
   * Follow-Up Preparation draft for every Prospect's Opportunity,
   * immediately after Outreach Preparation runs — see
   * runCanonicalPipeline below. Reuses the exact `userId` this pipeline
   * already resolves; introduces no new claim/lease/retry concept, and
   * no send/schedule/delivery capability of any kind (see
   * @acos/core-followup-preparation's own R-68 no-send guarantee).
   *
   * Optional for the same reason `qualifications`/`personalizations`/
   * `outreachPreparations` above are: making it required would force
   * every existing caller that builds a `SearchWorkerDeps` object —
   * including every pre-Phase-23 test — to be edited merely to keep
   * compiling. The real entrypoint (apps/worker/src/index.ts) always
   * supplies it, so production runs always attempt Follow-Up
   * Preparation; omitting it skips the step rather than failing. Only
   * reachable when `deps.outreachPreparations` is also configured and
   * Outreach Preparation itself already ran in this pass — enforced by
   * nesting, not a separate flag.
   */
  followUpPreparations?: FollowUpPreparationRepository;
  /**
   * Path 2 (D1/D6/D7): persists the Search-scoped category-plausibility
   * determination produced during Research, and is what Qualification's
   * new CATEGORY_PLAUSIBLE criterion (D4) reads back — see
   * runCanonicalPipeline below, which passes this to BOTH
   * runResearchForOwner (as `categoryPlausibility`, optional there too)
   * and, when also present, evaluateQualificationForOwner (required
   * there, since D4's criterion cannot be evaluated without it).
   *
   * Optional for the same reason `qualifications`/`personalizations`/
   * `outreachPreparations`/`followUpPreparations` above are: making it
   * required would force every existing caller that builds a
   * `SearchWorkerDeps` object — including every pre-Path-2 test — to be
   * edited merely to keep compiling. The real entrypoint
   * (apps/worker/src/index.ts) always supplies it, so production runs
   * always compute+persist a determination and always evaluate
   * CATEGORY_PLAUSIBLE. Omitting it skips Research's persistence step
   * regardless; the Qualification step, per `@acos/core-qualification`'s
   * `QualificationDeps` (where this dependency is required, since
   * CATEGORY_PLAUSIBLE cannot be evaluated without it), only runs when
   * BOTH `deps.qualifications` and this are present — the same
   * chained-presence convention `personalizations`/`outreachPreparations`
   * already use for their own prerequisites.
   */
  categoryPlausibility?: CategoryPlausibilityRepository;
  /**
   * PCG-4 TARGET_CUSTOMER_MATCH (PDEF4-PCG4-TCMATCH-PRODWIRING-DEC-001).
   * Forwarded to runResearchForOwner (as `targetCustomerMatch`, optional
   * there too — see @acos/core-research's ResearchDeps). Optional for the
   * same pre-existing-caller reason as `categoryPlausibility` above:
   * omitting it skips the model call and the write, unchanged from today.
   */
  targetCustomerMatch?: {
    repository: TargetCustomerMatchRepository;
    model: TargetCustomerMatchModelDeps;
  };
  /**
   * Phase 4 same-freelancer cache-first evidence reuse
   * (CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001, migration 0045).
   * Forwarded to runResearchForOwner (as `signalCache`, optional there
   * too — see @acos/core-research's ResearchDeps). Optional for the same
   * pre-existing-caller reason as `categoryPlausibility`/
   * `targetCustomerMatch` above: omitting it skips indexing, unchanged
   * from today. Phase 5 is what will consult this index before deciding
   * whether to escalate — this pipeline does not read it.
   */
  signalCache?: ResearchSignalCacheRepository;
  /**
   * Phase 5, PO-1: fetches the pre-admission homepage document(s) for
   * every discovered candidate, before any AI admission decision — see
   * runCanonicalPipeline's Pass 1 below. Optional for the same
   * pre-existing-caller reason as `scores`/`qualifications`/etc. above:
   * making it required would force every existing caller that builds a
   * `SearchWorkerDeps` object — including pre-Phase-5 integration tests —
   * to be edited merely to keep compiling. Omitting it degrades every
   * candidate to zero deterministic signals (today's actual pre-Phase-5
   * behavior — elimination stays vacuous, ranking stays UNKNOWN on
   * Need/Opportunity), never a thrown error. The real entrypoint
   * (apps/worker/src/index.ts) always supplies it.
   */
  sourceDocuments?: SourceDocumentProvider;
  /**
   * Phase 1 deterministic signal catalogue (PO-1/PO-3): evaluated against
   * the pre-admission-fetched document(s) in Pass 1, feeding both
   * elimination (./entityRealityElimination) and the admission-ranking
   * preview (@acos/core-opportunity's previewOpportunityRanking). Optional
   * for the same pre-existing-caller reason as `scores`/`qualifications`
   * above: a caller/test that omits it simply evaluates every candidate
   * with zero deterministic signals (today's actual pre-Phase-5
   * behavior), never a thrown error.
   */
  signalCatalogue?: ServiceSignalCatalogue;
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
 * then Research + Opportunity + Scoring + Qualification + Personalization
 * for every Prospect Discovery found.
 *
 * A failure at any point (thrown by any of the domain calls, including
 * scoring) stops all further processing for this Search and propagates to
 * the caller, which records it as a failed attempt — no partial pipeline
 * result is ever reported as success. Scoring uses this exact existing
 * failure/retry mechanism unchanged: no soft-failure or
 * continue-without-scoring path is introduced.
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
 *
 * Scoring (R-14/R-15/R-17) runs immediately after Opportunity
 * creation/lookup, independent of Qualification/Personalization/
 * Outreach-Prep/Follow-up-Prep — it has no data dependency on any of
 * them in either direction, so it is not nested inside their
 * conditionals. `scoreOpportunityForOwner` is idempotent by itself
 * (`upsert` on `UNIQUE(opportunity_id)`, migration 0018 — re-scoring
 * replaces, never appends), so when `deps.scores` is configured it runs
 * unconditionally for both a newly-created and an already-existing
 * Opportunity, the same "changed evidence -> new evaluation on retry"
 * property Qualification already relies on. `deps.scores` is optional
 * (skipped when absent) solely so pre-existing callers of this function
 * need no change — see SearchWorkerDeps' own doc comment. Uses the
 * existing, unmodified seven-factor algorithm and `neutralScoringInputs()`
 * unchanged — icpFit/abilityToPay/urgency/contactability remain neutral.
 *
 * Qualification (Phase 20, R-41) IS idempotent by
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
 *
 * Follow-Up Preparation (Phase 23, R-66) runs immediately after Outreach
 * Preparation, strictly nested inside the same `if
 * (deps.outreachPreparations)` branch — never invoked in a pass where
 * Outreach Preparation itself did not just run — and only when
 * `deps.followUpPreparations` is also configured (optional for the same
 * pre-existing-caller reason as `deps.qualifications`/
 * `deps.personalizations`/`deps.outreachPreparations`).
 * `prepareFollowUpForOwner` is idempotent by itself (`upsert` on
 * `UNIQUE(opportunity_id)` — R-65/R-69) and enforces its own eligibility
 * gate (an Outreach Preparation row must already exist — R-62)
 * internally — this orchestration calls it unconditionally whenever both
 * dependencies are present and lets it decide whether a follow-up draft
 * is actually produced. It never sends, schedules, or delivers anything —
 * see @acos/core-followup-preparation's own R-68 no-send guarantee.
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
      entities: deps.entities,
      provider: deps.discoveryProvider,
    },
    userId,
    { searchId: search.id },
  );

  // Observability only (Discovery-Query Audit) — makes the next live
  // experiment diagnostically useful (raw vs accepted vs skipped) without
  // changing query construction, ranking, filtering, or persistence.
  // candidatesReceived === prospects.length + skipped always.
  console.log(
    JSON.stringify({
      event: 'discovery.completed',
      searchId: search.id,
      candidatesReceived: discovery.candidatesReceived,
      accepted: discovery.prospects.length,
      skipped: discovery.skipped,
    }),
  );

  // ---- Pass 1 (Phase 5): cheap, deterministic, no AI, no Opportunity
  // persistence — collects every eligible candidate's deterministic
  // signals and an in-memory ranking PREVIEW (never persisted; the real
  // Opportunity is still created once, downstream, in processOneCandidate
  // -> runPostResearchPipelineForOwner, unchanged). This exists because
  // Top-N admission (Pass 2 below) is a rank across the WHOLE Search,
  // decided before any candidate reaches Research/AI — impossible to
  // decide one candidate at a time.
  const candidates: PreAdmissionCandidate[] = [];
  for (const prospect of discovery.prospects) {
    const company = await deps.companies.getById(userId, prospect.companyId);
    if (!company) continue; // defensive — Discovery always creates the Company first

    // Global Entity Architecture (C-1; Q5_CLOSURE §4.3): a website-less
    // Company (normalizedDomain null) has no homepage to fetch —
    // SourceDocumentTarget.normalizedDomain stays non-nullable and this
    // call is skipped entirely, reusing the existing empty-documents
    // fallback already used when no SourceDocumentProvider is wired at
    // all, rather than constructing a URL from a null domain.
    const supplied: SuppliedSourceDocuments =
      deps.sourceDocuments && company.normalizedDomain
        ? await fetchPreAdmissionDocuments(
            deps.sourceDocuments,
            { companyName: company.name, normalizedDomain: company.normalizedDomain },
            clockOf(deps)(),
          )
        : { documents: [], fetchedAt: clockOf(deps)(), extractionMethod: 'UNDECLARED' };
    // Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001, D1): a
    // universal, family-agnostic Entity-Reality signal from Discovery's
    // own businessStatus lookup — in-memory only, never persisted on
    // Company/Prospect (see core-discovery's service.ts).
    const placesBusinessStatus = discovery.businessStatusByProspectId.get(prospect.id) ?? null;
    const placesEntitySignal = detectPlacesEntityReality(placesBusinessStatus, clockOf(deps)());

    // Global Entity Architecture (D15/OQ-9/Q6): write the SAME
    // observation into the new, global, append-only entity_status_evidence
    // table, alongside (not instead of) the per-user research_signals
    // GOOGLE_PLACES_STATUS write that already happens downstream for
    // this candidate (saveDeterministicSignals, below in
    // processOneCandidate). Skipped entirely when company.entityId is
    // NULL — historical-safety fallback (Entity resolution not yet run
    // for this Company, or this Company predates the Entity layer),
    // never an error state (Q6's own contract).
    if (placesEntitySignal && company.entityId) {
      await deps.entities.recordStatusObservation(
        {
          entityId: company.entityId,
          status: placesBusinessStatus as 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY',
          source: 'GOOGLE_PLACES_STATUS',
        },
        clockOf(deps)(),
      );
    }

    const deterministicSignals = [
      ...(deps.signalCatalogue?.evaluate(supplied) ?? []),
      ...(placesEntitySignal ? [placesEntitySignal] : []),
    ];

    // Phase 2 of requirement/
    // CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md —
    // the deterministic Entity Reality elimination boundary, between
    // Discovery and the per-prospect Research loop. Now fed real
    // pre-admission signals (PO-1), including Phase 8's Entity-Reality
    // producer above.
    const elimination = eliminateDeterministically({ id: prospect.id }, deterministicSignals);
    if (!elimination.eligible) continue;

    const preview = previewOpportunityRanking(
      search.parameters,
      company,
      deterministicSignals,
      clockOf(deps)(),
    );

    candidates.push({ prospect, company, supplied, deterministicSignals, ranking: preview.ranking });
  }

  // ---- Pass 2 (Phase 5): rank the whole surviving candidate set ONCE
  // (ranking is never eligibility — @acos/core-acquisition's own rule),
  // then admit/escalate/persist each one in rank order. Every candidate
  // collected in Pass 1 is processed — Top-N/threshold/bypass/budget only
  // decide whether AI runs for it, never whether it is dropped (locked
  // semantic: a candidate is never dropped for budget/AI reasons).
  const decisions = evaluateAdmission(
    candidates.map((candidate) => ({
      id: candidate.prospect.id,
      ranking: candidate.ranking,
      deterministicSignals: candidate.deterministicSignals,
    })),
  );
  const candidatesById = new Map(candidates.map((candidate) => [candidate.prospect.id, candidate]));

  for (const decision of decisions) {
    const candidate = candidatesById.get(decision.id)!;
    await processOneCandidate(deps, userId, search, candidate, decision);
  }

  return { prospectsProcessed: discovery.prospects.length };
}

/** One Pass-1 candidate: Discovery's Prospect/Company plus the deterministic evidence and ranking preview computed before any AI call. */
interface PreAdmissionCandidate {
  prospect: StoredProspect;
  company: StoredCompany;
  supplied: SuppliedSourceDocuments;
  deterministicSignals: readonly DeterministicSignal[];
  ranking: OpportunityRankingPreview['ranking'];
}

/**
 * Supersede-then-insert the Phase-1 deterministic signal(s) as this
 * Prospect's own current evidence, as the SOLE write for this pass (D3
 * of the Phase 5 plan) — used whenever Research/the cache did not
 * already write their own signals this pass (not admitted, budget
 * exhausted, or a candidate-level AI failure that threw before writing
 * anything).
 */
async function persistDeterministicOnly(
  deps: SearchWorkerDeps,
  prospectId: string,
  deterministicSignals: readonly DeterministicSignal[],
  now: Date,
): Promise<void> {
  await deps.signals.supersedePrevious(prospectId, now);
  await saveDeterministicSignals(deps.signals, prospectId, deterministicSignals, now);
}

/**
 * CF-ZERO-AI-MVP-PO-DEC-001: the current Client Finder MVP makes zero
 * AI/LLM provider calls, independent of whether a provider credential
 * (ANTHROPIC_API_KEY/OPENAI_API_KEY/GEMINI_API_KEY) is configured.
 * Admission, the escalation budget, and the signal cache all stay fully
 * in place and keep deciding what WOULD escalate — this is the one flag
 * that decides whether an admission-eligible candidate is actually
 * allowed to reach a provider in the current MVP phase. A future PO
 * decision authorizing live AI enrichment flips this back to `true`;
 * nothing else in processOneCandidate needs to change to do so.
 */
const AI_ESCALATION_ENABLED = false;

/**
 * Pass-2 admission/escalation/persistence for one candidate (Phase 5).
 * Every branch ends in `runPostResearchPipelineForOwner`
 * (Opportunity/Score/Qualification/Personalization/Outreach/Follow-up) —
 * admission only decides whether AI ran first, never whether this
 * candidate is processed at all. Each branch also hands that call its
 * own already-resolved AI enrichment provenance (Phase 6) — pure
 * metadata wiring over this unchanged control flow, never a new
 * decision of its own.
 */
async function processOneCandidate(
  deps: SearchWorkerDeps,
  userId: string,
  search: StoredSearch,
  candidate: PreAdmissionCandidate,
  decision: AdmissionDecision,
): Promise<void> {
  const now = clockOf(deps)();

  if (!decision.admitted) {
    await persistDeterministicOnly(deps, candidate.prospect.id, candidate.deterministicSignals, now);
    await runPostResearchPipelineForOwner(deps, userId, candidate.prospect.id, {
      aiEnrichment: 'DETERMINISTIC_ONLY',
      aiEnrichmentReason: 'NOT_ESCALATED',
    });
    return;
  }

  // Cache check (same-freelancer, WEBSITE kind) before spending any
  // budget — a fresh hit is budget-free and skips AI entirely for this
  // candidate (locked semantic: cache hit consumes 0 units). Global
  // Entity Architecture (C-1): a null-domain candidate has no cache key
  // under the existing (user_id, normalized_domain, signal_kind) scheme
  // — skipped entirely, never coerced into a sentinel key.
  if (deps.signalCache && candidate.company.normalizedDomain) {
    const cacheResult = await lookupCachedSignalForOwner(
      deps.signalCache,
      userId,
      candidate.company.normalizedDomain,
      'WEBSITE',
      now,
    );
    if (cacheResult.outcome === 'hit' && cacheResult.freshness === 'fresh') {
      await applyCachedSignalsForOwner(deps, candidate.prospect.id, cacheResult.signals, now);
      // Cache's own supersede-then-insert already ran — layer the
      // deterministic signal on top without wiping it (D3).
      await saveDeterministicSignals(deps.signals, candidate.prospect.id, candidate.deterministicSignals, now);
      // The cached evidence originated from prior AI Research — a fresh
      // reuse of it is AI_ENRICHED, never relabeled deterministic.
      await runPostResearchPipelineForOwner(deps, userId, candidate.prospect.id, {
        aiEnrichment: 'AI_ENRICHED',
        aiEnrichmentReason: null,
      });
      return;
    }
  }

  // CF-ZERO-AI-MVP-PO-DEC-001: no fresh cached evidence was reused above,
  // and the current MVP must still make zero provider calls for this
  // admitted candidate — no budget unit consumed, no provider
  // constructed or invoked, candidate never dropped. Identical treatment
  // to a non-admitted candidate (above): deterministic-only, same
  // provenance pair, since from the candidate's perspective it never
  // escalated either way.
  if (!AI_ESCALATION_ENABLED) {
    await persistDeterministicOnly(deps, candidate.prospect.id, candidate.deterministicSignals, now);
    await runPostResearchPipelineForOwner(deps, userId, candidate.prospect.id, {
      aiEnrichment: 'DETERMINISTIC_ONLY',
      aiEnrichmentReason: 'NOT_ESCALATED',
    });
    return;
  }

  const consumption = await deps.searches.consumeAiEscalationUnit({
    id: search.id,
    workerId: deps.workerId,
    now,
    budget: AI_ESCALATION_BUDGET,
  });

  if (consumption.outcome === 'fenced') {
    // This worker no longer holds the Search's lease — the same
    // condition completeClaimed/recordAttemptFailure already treat as a
    // hard failure of the current attempt, propagated and handled
    // identically by claimAndProcessNextSearch's existing catch.
    throw new Error(`lost lease on Search ${search.id} while consuming the AI-escalation budget`);
  }

  if (consumption.outcome === 'exhausted') {
    // Budget exhaustion never drops a candidate or fails the Search —
    // deterministic-only fallback, same as a below-threshold candidate.
    await persistDeterministicOnly(deps, candidate.prospect.id, candidate.deterministicSignals, now);
    await runPostResearchPipelineForOwner(deps, userId, candidate.prospect.id, {
      aiEnrichment: 'DETERMINISTIC_ONLY',
      aiEnrichmentReason: 'PROVIDER_EXHAUSTED',
    });
    return;
  }

  let provenance: { aiEnrichment: AiEnrichment; aiEnrichmentReason: AiEnrichmentReason | null };
  try {
    await researchProspectForOwner(deps, userId, candidate.prospect.id, candidate.supplied);
    // Research already ran its own supersede-then-insert — layer the
    // deterministic signal on top without wiping it (D3).
    await saveDeterministicSignals(deps.signals, candidate.prospect.id, candidate.deterministicSignals, now);
    provenance = { aiEnrichment: 'AI_ENRICHED', aiEnrichmentReason: null };
  } catch {
    // Candidate-level AI failure: the unit stays spent — no refund, no
    // decrement method exists — and the candidate is never dropped. Research
    // threw before writing anything, so this is the "sole write" path.
    await persistDeterministicOnly(deps, candidate.prospect.id, candidate.deterministicSignals, now);
    provenance = { aiEnrichment: 'DETERMINISTIC_ONLY', aiEnrichmentReason: 'ESCALATION_FAILED' };
  }
  await runPostResearchPipelineForOwner(deps, userId, candidate.prospect.id, provenance);
}

/**
 * The deps one Prospect's pass needs — everything a Search pass needs
 * except the Discovery provider and the claim/lease settings. Shared by
 * runCanonicalPipeline and intent intake (./intentIntake), so both run
 * the identical per-Prospect code rather than two copies of it.
 */
export type ProspectPipelineDeps = Omit<
  SearchWorkerDeps,
  'discoveryProvider' | 'workerId' | 'now' | 'leaseDurationMs'
>;

/**
 * Research for one Prospect — the existing, unmodified runResearchForOwner
 * call. `suppliedSourceDocuments` (PO-4, Phase 5) is optional and
 * additive: when provided (Pass 1's pre-admission fetch), it is forwarded
 * so the provider does not fetch the same homepage a second time; intent
 * intake (./intentIntake) and any caller that omits it fetch exactly as
 * before.
 */
export async function researchProspectForOwner(
  deps: ProspectPipelineDeps,
  userId: string,
  prospectId: string,
  suppliedSourceDocuments?: SuppliedSourceDocuments,
): Promise<void> {
  await runResearchForOwner(
    {
      companies: deps.companies,
      prospects: deps.prospects,
      searches: deps.searches,
      signals: deps.signals,
      provider: deps.researchProvider(userId),
      // exactOptionalPropertyTypes: omit the key entirely when absent,
      // rather than assigning `undefined` to an optional property.
      ...(deps.categoryPlausibility ? { categoryPlausibility: deps.categoryPlausibility } : {}),
      ...(deps.targetCustomerMatch ? { targetCustomerMatch: deps.targetCustomerMatch } : {}),
      ...(deps.signalCache ? { signalCache: deps.signalCache } : {}),
    },
    userId,
    { prospectId },
    new Date(),
    suppliedSourceDocuments ? { suppliedSourceDocuments } : undefined,
  );
}

/**
 * Everything after Research for one Prospect: Opportunity (find or
 * create), Scoring, Qualification, Personalization, Outreach Preparation
 * and Follow-up Preparation — extracted verbatim from
 * runCanonicalPipeline's per-Prospect loop (INTENT-INTAKE-PO-DEC-001 D4)
 * so intent intake reuses it instead of duplicating it. Behavior, order,
 * optional-dependency gating and error propagation are unchanged.
 *
 * `provenance` (Phase 6) is the already-resolved AI enrichment outcome
 * of whichever processOneCandidate() branch called this — omitted by
 * intent intake, which is out of this phase's scope and so leaves a
 * freshly-created Opportunity at its schema default (DETERMINISTIC_ONLY/
 * NOT_ESCALATED is NOT implied; the column default is unclassified).
 * When present, it is recorded against the found-or-created Opportunity
 * whether that Opportunity is new or already existed — a retry
 * reclassifies the existing row rather than appending anything.
 */
export async function runPostResearchPipelineForOwner(
  deps: ProspectPipelineDeps,
  userId: string,
  prospectId: string,
  provenance?: { aiEnrichment: AiEnrichment; aiEnrichmentReason: AiEnrichmentReason | null },
): Promise<{ opportunityId: string }> {
  const existingOpportunity = await deps.opportunities.findByProspectId(userId, prospectId);
  const opportunity =
    existingOpportunity ??
    (await createOpportunityForOwner(
      {
        companies: deps.companies,
        prospects: deps.prospects,
        searches: deps.searches,
        signals: deps.signals,
        opportunities: deps.opportunities,
      },
      userId,
      { prospectId },
    ));

  if (provenance) {
    await recordAiEnrichmentForOwner(
      { opportunities: deps.opportunities },
      userId,
      opportunity.id,
      provenance.aiEnrichment,
      provenance.aiEnrichmentReason,
    );
  }

  if (deps.scores) {
    await scoreOpportunityForOwner(
      {
        opportunities: deps.opportunities,
        signals: deps.signals,
        scores: deps.scores,
      },
      userId,
      opportunity.id,
    );
  }

  if (deps.qualifications && deps.categoryPlausibility) {
    await evaluateQualificationForOwner(
      {
        opportunities: deps.opportunities,
        signals: deps.signals,
        qualifications: deps.qualifications,
        categoryPlausibility: deps.categoryPlausibility,
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

        if (deps.followUpPreparations) {
          await prepareFollowUpForOwner(
            {
              opportunities: deps.opportunities,
              outreachPreparations: deps.outreachPreparations,
              followUpPreparations: deps.followUpPreparations,
            },
            userId,
            opportunity.id,
          );
        }
      }
    }
  }

  return { opportunityId: opportunity.id };
}

function describeError(cause: unknown): string {
  if (cause instanceof Error) return `${cause.name}: ${cause.message}`;
  return String(cause);
}
