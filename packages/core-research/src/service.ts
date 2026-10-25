import { scoreProspect, type ProspectInput, type ProspectScore } from '@acos/core-acquisition';
import type { CompanyRepository, ProspectRepository } from '@acos/core-discovery';
import { requireUser, type IdentityRepository } from '@acos/core-identity';
import type { SearchRepository } from '@acos/core-search';

import { aggregateCategoryFit, parseTargetSegments, toSegmentDeterminations } from './categoryPlausibility';
import type {
  CapturedSourceDocumentInput,
  CategoryPlausibilityRepository,
} from './categoryPlausibilityRepository';
import { isIntentSignalKind } from './intentSignal';
import { toNewResearchSignals } from './mapping';
import type { ResearchSourceKind } from './persist';
import type { ResearchProvider, SuppliedSourceDocuments } from './provider';
import type { ResearchSignalRepository } from './repository';
import { toScoringSignals } from './scoringAdapter';
import { ResearchProspectNotFoundError } from './signalErrors';
import {
  toSignalCacheLookupResult,
  type ResearchSignalCacheRepository,
  type SignalCacheLookupResult,
} from './signalCache';
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
  /**
   * Phase 4 same-freelancer cache-first evidence reuse
   * (CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001, migration 0045).
   * Optional for the same pre-existing-caller reason as
   * `categoryPlausibility`/`targetCustomerMatch` above: omitting it skips
   * indexing, unchanged from today. When present, every newly-saved
   * signal whose kind is reusable public/non-owner-specific factual
   * evidence (i.e. NOT an intent-intake kind — PUBLIC_INTENT/FIRST_PARTY
   * are owner-specific captured events, never indexed here) is recorded
   * for later same-user cache lookup (see `lookupCachedSignalForOwner`
   * below). This performs no AI call and does not itself gate Research/
   * TCM invocation — Phase 5 is what consults the lookup before
   * escalating.
   */
  signalCache?: ResearchSignalCacheRepository;
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
  /**
   * PO-4 (Phase 5): the homepage document(s) already fetched during
   * pre-admission (PO-1), forwarded to the provider so it does not fetch
   * the same homepage a second time. Not part of {@link RunResearchInput}
   * deliberately — this is an internal worker-orchestration detail, not
   * a shape the token-authenticated `runResearch()` HTTP path should ever
   * expose or accept.
   */
  options?: { suppliedSourceDocuments?: SuppliedSourceDocuments },
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
    ...(options?.suppliedSourceDocuments
      ? { suppliedSourceDocuments: options.suppliedSourceDocuments }
      : {}),
    onSourceDocumentsSupplied: (value) => {
      capture.supplied = value;
    },
  });

  const signalInputs = toNewResearchSignals(research);
  const superseded = await deps.signals.supersedePrevious(prospect.id, now);
  const signals = await deps.signals.saveSignals(prospect.id, signalInputs, now);

  // Global Entity Architecture (C-1; Q5_CLOSURE §4.3): a null domain can
  // never be used as a cache key under the existing (user_id,
  // normalized_domain, signal_kind) scheme — skip caching entirely for a
  // null-domain Prospect, never coerce null into a sentinel string
  // (which would incorrectly conflate every website-less company for
  // one user into a single cache entry).
  if (deps.signalCache && company.normalizedDomain) {
    await recordCacheableSignals(
      deps.signalCache,
      userId,
      company.normalizedDomain,
      signals,
      company.entityId,
    );
  }

  // CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002 D2: a NEW search's
  // ServiceProfile carries a target-customer sentinel
  // (core-service-profile's SYSTEM_DEFAULT_TARGET_CUSTOMER) that
  // parseTargetSegments() always resolves to zero segments — so this
  // block (and targetCustomerMatch below) is skipped for NEW searches
  // without disabling the capability for historical/old-style searches,
  // whose real targetCustomer still produces `targetSegments.length > 0`
  // exactly as before. Deliberately data-driven, not a deps-wiring change
  // — the worker continues to supply `deps.categoryPlausibility`/
  // `deps.targetCustomerMatch` unconditionally, so this one extra
  // condition is the only change (no redesign of Research or TCM).
  if (deps.categoryPlausibility && targetSegments.length > 0) {
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
  if (deps.targetCustomerMatch && targetSegments.length > 0) {
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

/**
 * Indexes every newly-saved signal that is reusable, public,
 * non-owner-specific factual evidence (CF-SAME-FREELANCER-EVIDENCE-
 * REUSE-PO-DEC-001 scope item 3). Intent-intake kinds (PUBLIC_INTENT,
 * FIRST_PARTY — captured, owner-specific events; see ./intentSignal) are
 * never indexed: `research_signal_cache_index`'s own kind CHECK
 * constraint (migration 0045) also refuses them at the database level.
 * UNKNOWN classification carries no signal text (`signal IS NULL`), so
 * there is nothing to reuse — also skipped.
 */
async function recordCacheableSignals(
  cache: ResearchSignalCacheRepository,
  userId: string,
  normalizedDomain: string,
  signals: readonly StoredResearchSignal[],
  entityId: string | null,
): Promise<void> {
  for (const signal of signals) {
    if (isIntentSignalKind(signal.kind)) continue;
    if (signal.classification === 'UNKNOWN') continue;
    await cache.record({
      userId,
      normalizedDomain,
      signalKind: signal.kind,
      signalId: signal.id,
      observedAt: signal.observedAt,
      // Global Entity Architecture (Final Architecture Rules §6
      // "Cache"): populated whenever this Company already has a
      // resolved Entity, never inferred or defaulted otherwise. `null`
      // for every website-less or pre-resolution Company — never
      // backfilled later.
      entityId,
    });
  }
}

/**
 * Phase 4's exposed cache-lookup API
 * (CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md Phase
 * 4; CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001's cache-first
 * addendum): "before making a new AI call, check whether sufficiently
 * fresh, applicable cached evidence ... can satisfy the required work."
 * This function performs that check — and ONLY that check: it never
 * calls Research/TCM, never ranks, never decides eligibility, and never
 * reaches another freelancer's evidence (`userId` is a required,
 * non-optional parameter here and on every
 * ResearchSignalCacheRepository method). Phase 5 is what will call this
 * before deciding whether to escalate.
 *
 * Takes an already-resolved `userId` (the "ForOwner" convention — see
 * `runResearchForOwner`) since Phase 5's caller, the search worker,
 * already holds one; it never accepts a session token.
 */
export async function lookupCachedSignalForOwner(
  cache: ResearchSignalCacheRepository,
  userId: string,
  normalizedDomain: string,
  signalKind: ResearchSourceKind,
  now: Date = new Date(),
): Promise<SignalCacheLookupResult> {
  const signals = await cache.findByKey(userId, normalizedDomain, signalKind);
  return toSignalCacheLookupResult(signals, signalKind, now);
}

/**
 * Phase 5: applies a fresh cache hit (from {@link lookupCachedSignalForOwner})
 * as this Prospect's own current evidence, without calling the provider
 * or TCM — a cache hit is budget-free (consumes 0 AI-escalation units)
 * but must still produce real evidence for Opportunity/Scoring to read.
 * Copies the cached signals' CONTENT onto new rows scoped to THIS
 * prospect (never reuses the foreign prospectId the cached rows carry),
 * via the same supersede-then-insert pattern `runResearchForOwner` uses
 * for its own AI-derived signals — reuse never rewrites evidence,
 * provenance, confidence, or the observed timestamp (CF-SAME-FREELANCER-
 * EVIDENCE-REUSE-PO-DEC-001's "Evidence Integrity" guarantee).
 */
export async function applyCachedSignalsForOwner(
  deps: Pick<ResearchDeps, 'signals'>,
  prospectId: string,
  cached: readonly StoredResearchSignal[],
  now: Date = new Date(),
): Promise<{ superseded: number; signals: readonly StoredResearchSignal[] }> {
  const superseded = await deps.signals.supersedePrevious(prospectId, now);
  const signals = await deps.signals.saveSignals(
    prospectId,
    cached.map((cachedSignal) => ({
      field: cachedSignal.field,
      kind: cachedSignal.kind,
      classification: cachedSignal.classification,
      signal: cachedSignal.signal,
      confidence: cachedSignal.confidence,
      basis: cachedSignal.basis,
      sources: cachedSignal.sources.map(({ sourceUrl, sourceQuote, sourceLabel }) => ({
        sourceUrl,
        sourceQuote,
        sourceLabel,
      })),
    })),
    now,
  );
  return { superseded, signals };
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
