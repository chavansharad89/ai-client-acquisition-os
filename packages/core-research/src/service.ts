import { scoreProspect, type ProspectInput, type ProspectScore } from '@acos/core-acquisition';
import type { CompanyRepository, ProspectRepository } from '@acos/core-discovery';
import { requireUser, type IdentityRepository } from '@acos/core-identity';
import type { SearchRepository } from '@acos/core-search';

import { aggregateCategoryFit, parseTargetSegments, toSegmentDeterminations } from './categoryPlausibility';
import type {
  CapturedSourceDocumentInput,
  CategoryPlausibilityRepository,
} from './categoryPlausibilityRepository';
import { toNewResearchSignals } from './mapping';
import type { ResearchProvider, SuppliedSourceDocuments } from './provider';
import type { ResearchSignalRepository } from './repository';
import { toScoringSignals } from './scoringAdapter';
import { ResearchProspectNotFoundError } from './signalErrors';
import {
  evaluateTargetCustomerMatch,
  type TargetCustomerMatchModelDeps,
  type TargetCustomerMatchModelOptions,
} from './targetCustomerMatch';
import type {
  TargetCustomerMatchRepository,
  TargetCustomerMatchSourceDocumentInput,
} from './targetCustomerMatchRepository';
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
  /**
   * Path 2 category plausibility (D8, Option B Candidate 2): resolves
   * the owning Search so its `parameters.targetCustomer` can be
   * deterministically parsed (D2) and carried into the Research call —
   * mirroring @acos/core-opportunity's `OpportunityDeps.searches`/
   * `createOpportunityForOwner` pattern exactly (`prospect.searchId` ->
   * `deps.searches.getById`). Required, like that precedent, since every
   * real Research run needs Search context to evaluate category
   * plausibility against.
   */
  searches: SearchRepository;
  /**
   * Persists the category-plausibility determination (D1/D6/D7) once
   * computed. Optional — like `SearchWorkerDeps.scores`/`.qualifications`
   * elsewhere in this codebase — so a caller/test that predates this
   * feature and never exercises it keeps compiling; the real entrypoint
   * (apps/worker) always supplies it, so production runs always persist.
   * Category plausibility is still evaluated by the provider either way
   * (D9 §5 — parsing/prompting is unconditional); omitting this
   * dependency only skips writing the result down, exactly like omitting
   * `scores`/`qualifications` skips those steps without affecting
   * Research/Discovery.
   */
  categoryPlausibility?: CategoryPlausibilityRepository;
  /**
   * PCG-4 TARGET_CUSTOMER_MATCH (requirement/
   * CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_*.md — ED-TC-6/TD-10
   * Option A). Optional, like `categoryPlausibility` above, so any
   * existing caller/test that predates this feature keeps compiling and
   * behaving exactly as before: omitting it skips both the model call
   * and the write, leaving PCG-4's `observedTargetCustomer` translation
   * (./targetCustomerMatch.ts) reading row-absence (`NOT_YET_OBSERVED`),
   * unchanged from today. A dedicated, independent bounded model call
   * (TD-1) — never category plausibility's computed output (TC-MATCH-12)
   * — against the same source documents already supplied to the
   * per-Prospect research call.
   */
  targetCustomerMatch?: {
    repository: TargetCustomerMatchRepository;
    model: TargetCustomerMatchModelDeps;
    options?: TargetCustomerMatchModelOptions;
  };
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
  return runResearchForOwner(deps, userId, input, now);
}

/**
 * Same behavior as {@link runResearch}, for a caller that has already
 * resolved a trusted `userId` by some means other than a session token —
 * specifically, a worker that claimed a Search row and is reading
 * ownership out of it (R-34's "WORKER OWNERSHIP"). Not reachable from any
 * HTTP path — only `runResearch()` (token-authenticated) is.
 */
export async function runResearchForOwner(
  deps: Omit<ResearchDeps, 'identity'>,
  userId: string,
  input: RunResearchInput,
  now: Date = new Date(),
): Promise<ResearchRunResult> {
  const { prospectId } = validateRunResearchInput(input);

  const prospect = await deps.prospects.getById(userId, prospectId);
  if (!prospect) throw new ResearchProspectNotFoundError(prospectId);

  const company = await deps.companies.getById(userId, prospect.companyId);
  if (!company) throw new ResearchProspectNotFoundError(prospectId);

  // Path 2 category plausibility (D8, Option B Candidate 2): resolve the
  // owning Search the same way createOpportunityForOwner already does
  // (prospect.searchId -> deps.searches.getById), then deterministically
  // parse its immutable targetCustomer snapshot (D2) BEFORE the model
  // ever sees it (D9 §5).
  const search = await deps.searches.getById(userId, prospect.searchId);
  if (!search) throw new ResearchProspectNotFoundError(prospectId);
  const targetSegments = parseTargetSegments(search.parameters.targetCustomer);

  // A11-P1 M-2: the model-seen source documents, exactly as the provider
  // handed them to the model. Last call wins — in a fallback chain that is
  // the attempt that produced `research` (every call carries the same
  // documents regardless).
  // A holder object, not a `let`: TypeScript does not track assignments
  // made inside the callback below.
  const capture: { supplied?: SuppliedSourceDocuments } = {};
  const research = await deps.provider.research({
    prospectId: prospect.id,
    companyId: company.id,
    companyName: company.name,
    normalizedDomain: company.normalizedDomain,
    targetSegments,
    onSourceDocumentsSupplied: (value) => {
      capture.supplied = value;
    },
  });

  const signalInputs = toNewResearchSignals(research);
  const superseded = await deps.signals.supersedePrevious(prospect.id, now);
  const signals = await deps.signals.saveSignals(prospect.id, signalInputs, now);

  if (deps.categoryPlausibility) {
    const segmentResults = toSegmentDeterminations(targetSegments, research.categoryPlausibility);
    const aggregateResult = aggregateCategoryFit(segmentResults.map((result) => result.fit));
    // Supersede-then-insert, scoped to THIS Search + Prospect only (D6) —
    // a different Search's row for the same Prospect is never touched.
    await deps.categoryPlausibility.supersedePrevious(search.id, prospect.id, now);
    await deps.categoryPlausibility.save(
      {
        searchId: search.id,
        prospectId: prospect.id,
        targetCustomer: search.parameters.targetCustomer,
        targetSegments,
        aggregateResult,
        segmentResults,
      },
      now,
      toCapturedSourceDocuments(capture.supplied),
    );
  }

  // TD-10 Option A: a third determination type, guarded by its own
  // dependency flag, in the same non-transactional, sequential-await
  // style as the signals/categoryPlausibility writes above — not sharing
  // a DB transaction with them (that remains a separate, undecided
  // question per TD-10 §5). Research-time (ED-TC-6): the same pipeline
  // position, same already-fetched source documents, independent of
  // categoryPlausibility's own (excluded, per TC-MATCH-12) computation.
  if (deps.targetCustomerMatch) {
    const { repository, model, options } = deps.targetCustomerMatch;
    const sources = (capture.supplied?.documents ?? []).map((doc) => ({
      label: doc.label,
      url: doc.url,
      text: doc.text,
    }));
    const evaluation = await evaluateTargetCustomerMatch(
      model,
      search.parameters.targetCustomer,
      sources,
      options,
    );
    await repository.supersedePrevious(search.id, prospect.id, now);
    await repository.save(
      {
        searchId: search.id,
        prospectId: prospect.id,
        targetCustomer: search.parameters.targetCustomer,
        result: evaluation.result,
        evidence: evaluation.evidence,
        model: evaluation.model,
        provider: evaluation.provider,
        promptVersion: evaluation.promptVersion,
      },
      now,
      toCapturedTargetCustomerMatchSourceDocuments(capture.supplied),
    );
  }

  return { prospectId: prospect.id, superseded, signals };
}

/** Same flattening as toCapturedSourceDocuments, for the target-customer-match source-capture table (migration 0037). */
function toCapturedTargetCustomerMatchSourceDocuments(
  supplied: SuppliedSourceDocuments | undefined,
): readonly TargetCustomerMatchSourceDocumentInput[] {
  if (!supplied) return [];
  return supplied.documents.map((doc) => ({
    label: doc.label,
    url: doc.url,
    text: doc.text,
    fetchedAt: supplied.fetchedAt,
  }));
}

/** Flattens one run's supplied documents into per-document capture rows — text passed through untouched. */
function toCapturedSourceDocuments(
  supplied: SuppliedSourceDocuments | undefined,
): readonly CapturedSourceDocumentInput[] {
  if (!supplied) return [];
  return supplied.documents.map((doc) => ({
    label: doc.label,
    url: doc.url,
    text: doc.text,
    fetchedAt: supplied.fetchedAt,
    extractionMethod: supplied.extractionMethod,
  }));
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

/**
 * Reads the caller's own current category-plausibility determination
 * (D1/D6/D10) for one Prospect — "current" meaning the latest
 * non-superseded row for that Prospect, which is exactly "the CURRENT
 * Search + Prospect determination" D6 requires, since a Prospect's own
 * Search is immutable and unique to it. Returns `null` when Research has
 * never produced one (a stage that has not run yet, or ran before this
 * dependency existed) — the same "not yet" convention every other
 * getX-style read in this codebase uses, never an error.
 */
export async function getCategoryPlausibilityDetermination(
  deps: Pick<ResearchDeps, 'identity' | 'prospects'> & {
    categoryPlausibility: CategoryPlausibilityRepository;
  },
  rawToken: string | undefined | null,
  prospectId: string,
  now: Date = new Date(),
) {
  const userId = await requireUser(deps.identity, rawToken, now);
  const { prospectId: validated } = validateRunResearchInput({ prospectId });

  const prospect = await deps.prospects.getById(userId, validated);
  if (!prospect) throw new ResearchProspectNotFoundError(validated);

  return deps.categoryPlausibility.getCurrentByProspectId(userId, prospect.id);
}

/**
 * Every part of {@link ProspectInput} except `signals` — this phase
 * supplies signals from persisted ResearchSignal rows (see
 * ./scoringAdapter); ICP fit, ability to pay, urgency, service fit and
 * contact channels are produced by systems this phase does not build
 * (ServiceProfile matching, Offer, Opportunity), so the caller still
 * supplies them.
 */
export type ScoreResearchedProspectInput = Omit<ProspectInput, 'signals'>;

export interface ResearchedProspectScore {
  /** Unmodified output of @acos/core-acquisition's scoreProspect(). */
  score: ProspectScore;
  /** Persisted signals classified UNKNOWN for this Prospect — excluded from scoring but not discarded. */
  unknownSignalCount: number;
}

/**
 * Scores one of the caller's own Prospects (R-14/R-17) using its
 * persisted, currently-active ResearchSignals. Reuses
 * listResearchSignals for authentication and ownership — the same
 * requireUser() + Prospect-ownership check runResearch relies on — so
 * this never accepts a caller-supplied userId.
 *
 * The seven-factor algorithm itself is @acos/core-acquisition's
 * scoreProspect(), unmodified (PRD V2.1 "SEVEN-FACTOR SCORING —
 * AUTHORITATIVE MODEL": no replacement scoring framework); this only
 * adapts `signals` from research_signals via ./scoringAdapter, which
 * applies the inference discount exactly once, by classification.
 */
export async function scoreResearchedProspect(
  deps: Pick<ResearchDeps, 'identity' | 'prospects' | 'signals'>,
  rawToken: string | undefined | null,
  prospectId: string,
  input: ScoreResearchedProspectInput,
  now: Date = new Date(),
): Promise<ResearchedProspectScore> {
  const storedSignals = await listResearchSignals(deps, rawToken, prospectId, now);
  const { signals, unknownCount } = toScoringSignals(storedSignals);

  return {
    score: scoreProspect({ ...input, signals }, now),
    unknownSignalCount: unknownCount,
  };
}
