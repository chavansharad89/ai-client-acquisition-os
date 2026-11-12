import {
  BAND_THRESHOLDS,
  classifyStaleness,
  rankByUniversalProfile,
  recommendOpportunityAction,
  SIGNAL_FRESH_DAYS,
  SIGNAL_MAX_AGE_DAYS,
  suggestOffers,
  unknownRankingProfile,
  type OpportunityAction,
  type RankingTier,
  type ResearchSignal,
  type ServiceRule,
  type UniversalRankingProfile,
} from '@acos/core-acquisition';
import type { CompanyRepository, ProspectRepository } from '@acos/core-discovery';
import { requireUser, type IdentityRepository } from '@acos/core-identity';
import {
  DETERMINISTIC_ABSENT_SSL_FIELD,
  DETERMINISTIC_ABSENT_SSL_KEYWORD,
  parseTargetSegments,
  toScoringSignals,
  type ResearchSignalRepository,
  type StoredResearchSignal,
} from '@acos/core-research';
import type { SearchRepository } from '@acos/core-search';

import { hasCredibleNeedEvidence, toOfferSignals, toServiceRule } from './adapters';
import { OpportunityNotFoundError, OpportunityProspectNotFoundError } from './errors';
import type { FeedbackRepository } from './feedbackRepository';
import { validateRecordFeedbackInput } from './feedbackValidation';
import type { OpportunityRepository } from './repository';
import type { OpportunityScoreRepository } from './scoreRepository';
import { matchRelevantSubservices } from './subserviceMatching';
import type {
  AiEnrichment,
  AiEnrichmentReason,
  CreateOpportunityInput,
  DetectedOffer,
  OpportunityTrackingSummary,
  RankedOpportunity,
  RecordFeedbackInput,
  StoredFeedback,
  StoredOpportunity,
  StoredOpportunityScore,
} from './types';
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
  companies: CompanyRepository;
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
  return createOpportunityForOwner(deps, userId, input, now);
}

/**
 * Same behavior as {@link createOpportunity}, for a caller that has
 * already resolved a trusted `userId` by some means other than a session
 * token — specifically, a worker that claimed a Search row and is reading
 * ownership out of it (R-34's "WORKER OWNERSHIP"). Not reachable from any
 * HTTP path — only `createOpportunity()` (token-authenticated) is.
 *
 * Behaves identically to `createOpportunity()` on a repeat call for the
 * same Prospect: a database-level unique-constraint violation, left
 * uncaught here (see `OpportunityRepository.create`). A worker that wants
 * retry-safe idempotency across Search attempts should check
 * `deps.opportunities.findByProspectId` itself before calling this —
 * that policy belongs to the worker's orchestration, not to this shared
 * domain function, so `createOpportunity()`'s own existing behavior
 * (including the "second call throws" contract already asserted by
 * tests/integration/opportunity.integration.test.ts) is unchanged.
 *
 * R-70 (Phase 24): also resolves the Prospect's own Company, so
 * ./adapters' toOfferSignals() can exclude evidence whose source
 * self-identifies as a different business than the one this Opportunity
 * is being created for. Reuses the same not-found convention as the
 * Prospect/Search lookups below — a missing Company is exactly as
 * unexpected as a missing Prospect/Search for an owned Prospect.
 */
export async function createOpportunityForOwner(
  deps: Omit<OpportunityDeps, 'identity'>,
  userId: string,
  input: CreateOpportunityInput,
  now: Date = new Date(),
): Promise<StoredOpportunity> {
  const { prospectId } = validateCreateOpportunityInput(input);

  const prospect = await deps.prospects.getById(userId, prospectId);
  if (!prospect) throw new OpportunityProspectNotFoundError(prospectId);

  const search = await deps.searches.getById(userId, prospect.searchId);
  if (!search) throw new OpportunityProspectNotFoundError(prospectId);

  const company = await deps.companies.getById(userId, prospect.companyId);
  if (!company) throw new OpportunityProspectNotFoundError(prospectId);

  const signals = await deps.signals.listByProspect(userId, prospect.id);
  const offerSignals = toOfferSignals(signals, company);
  const rule = toServiceRule(search.parameters);

  // Zero-AI conformance (C-3B): the Phase 1 deterministic absent-SSL
  // signal (kind WEBSITE, field deterministic.absentSsl — see
  // @acos/core-research's DETERMINISTIC_ABSENT_SSL_FIELD) already
  // reaches ./adapters' R-70/R-71-filtered `offerSignals` above; it was
  // never matchable by `rule` because neither a freelancer's own typed
  // keywords nor the system-derived subservice keywords (D2 of
  // CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002) happen to contain
  // security vocabulary. This additional, fixed rule — same service/
  // value/rationale as `rule`, only its own trigger+keyword narrowed to
  // the one substring this specific deterministic signal's own text
  // always contains — is the existing offer.ts suggestOffers() mechanism
  // being given the data to recognize evidence it already receives,
  // mirroring how buildRankingProfile()'s needOpportunityTier() already
  // recognizes this same field for ranking. It changes nothing about
  // which signals are eligible (R-70/R-71, unchanged) or how much
  // evidence is required to flip needDetected (K5-D1's
  // hasCredibleNeedEvidence() below is untouched and still requires its
  // own >=2-distinct-field bar for a NEW search).
  const deterministicRule: ServiceRule = {
    ...rule,
    triggers: ['WEBSITE'],
    keywords: [DETERMINISTIC_ABSENT_SSL_KEYWORD],
  };

  const suggestions = suggestOffers(offerSignals, [rule, deterministicRule]);
  const top = suggestions[0];

  // K5-D1 (CF-NEED-OPPORTUNITY-SUFFICIENCY-PO-DEC-001, Option C): a
  // historical search (a real, segment-bearing targetCustomer — the
  // same boundary categoryPlausibility/targetCustomerMatch already use,
  // @acos/core-research's parseTargetSegments()) keeps its pre-K5
  // behavior unchanged — top !== undefined alone is still enough. A
  // NEW Service+Geography-only search (the system-owned sentinel
  // targetCustomer) additionally requires adapters' own
  // hasCredibleNeedEvidence() — see its header for the sufficiency
  // rule — so a catalogue keyword/trigger match alone can no longer,
  // by itself, establish NEED_DETECTED for a NEW search.
  const isHistoricalStyleSearch = parseTargetSegments(search.parameters.targetCustomer).length > 0;
  const needDetected =
    top !== undefined &&
    (isHistoricalStyleSearch || hasCredibleNeedEvidence(signals, company, rule));

  // Phase 7B (MULR item 6): computed once, here, from the same
  // persisted signals already read above — never a second Research
  // pass, never re-derived at render time. Scoped to the caller's own
  // selected top-level service (search.parameters.service); see
  // matchRelevantSubservices()'s own header for the scoping rule.
  const relevantSubservices = matchRelevantSubservices(search.parameters.service, signals);

  return deps.opportunities.create(
    userId,
    {
      prospectId: prospect.id,
      needDetected,
      offer: top && {
        service: top.service,
        rationale: top.rationale,
        estimatedValuePaise: top.estimatedValuePaise,
        fit: top.fit,
        basedOn: top.basedOn,
      },
      relevantSubservices,
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

// ---- Phase 10: OpportunityScore persistence (migration 0018) ----------
// Computes and persists this caller's deterministic, qualitative
// UniversalRankingProfile for a persisted Opportunity (Phase 3 of
// requirement/CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md,
// implementing CLIENT_FINDER_UNIVERSAL_RANKING_FRAMEWORK_PO_DECISION.md).
// Supersedes the seven-factor, 0-100 scoreProspect() as the ranking
// input (CLIENT_FINDER_UNIVERSAL_RANKING_SUPERSEDES_MVP_SCORING_PO_DECISION.md)
// — scoreProspect()/rankProspects() themselves are untouched and still
// exist in @acos/core-acquisition, simply no longer called from here. An
// explicit operation, deliberately not called from createOpportunity()
// above — Opportunity creation and ranking are separate steps in the MVP
// journey.
//
// Identifies the ranking-formula build that produced a row (same role
// the old SCORER_VERSION played: "allows a ranking to be reproduced
// after weights change"). Bump only if the tier-computation rules below
// change.
export const SCORER_VERSION = 'universalRanking-v1';

/**
 * Evidence Quality tier: how well-sourced the caller's live
 * ResearchSignals are, independent of what they say. Reuses
 * prospectScore.ts's own existing evidenceQuality rule (confidence >= 70
 * = "well-sourced") rather than inventing a new confidence cutoff —
 * only the output is qualitative (a tier) instead of a 0-1 raw score.
 * UNKNOWN with no live signals at all; STRONG only once at least three
 * independent well-sourced signals exist, so a single signal can never
 * read as strong evidence (mirrors the >= 2 independent-signal bar the
 * strong-signal bypass decision already set at the escalation layer).
 */
function evidenceQualityTier(signals: readonly ResearchSignal[]): RankingTier {
  if (signals.length === 0) return 'UNKNOWN';
  const wellSourced = signals.filter((signal) => signal.confidence >= 70).length;
  if (wellSourced >= 3) return 'STRONG';
  if (wellSourced === 2) return 'MODERATE';
  // wellSourced 0 or 1: some evidence exists but it is thin or poorly
  // sourced — WEAK, not UNKNOWN (UNKNOWN is reserved for no evidence at all).
  return 'WEAK';
}

/**
 * Evidence Freshness tier: how recent the caller's live ResearchSignals
 * are, using the existing named decay boundaries (SIGNAL_FRESH_DAYS/
 * SIGNAL_MAX_AGE_DAYS — @acos/core-acquisition's scoring.ts) rather than
 * inventing new ones. UNKNOWN with no live signals; otherwise based on
 * the single most recent signal's age.
 */
function evidenceFreshnessTier(signals: readonly ResearchSignal[], now: Date): RankingTier {
  if (signals.length === 0) return 'UNKNOWN';
  const newestAgeDays = Math.min(
    ...signals.map((signal) => (now.getTime() - signal.observedAt.getTime()) / 86_400_000),
  );
  if (newestAgeDays <= SIGNAL_FRESH_DAYS) return 'STRONG';
  if (newestAgeDays <= SIGNAL_MAX_AGE_DAYS) return 'MODERATE';
  return 'WEAK';
}

/**
 * Service Fit tier: bands the Opportunity's own persisted offer fit
 * (0-100, deterministic rule-matching from @acos/core-acquisition's
 * suggestOffers() — never an LLM call) using the scorer's own existing
 * HIGH/MEDIUM band thresholds (BAND_THRESHOLDS), reused rather than
 * re-derived. `undefined` (AC-14's NO SUITABLE OFFER) is UNKNOWN, never
 * a fabricated fit.
 */
function serviceFitTier(offer: DetectedOffer | undefined): RankingTier {
  if (!offer) return 'UNKNOWN';
  if (offer.fit >= BAND_THRESHOLDS.HIGH) return 'STRONG';
  if (offer.fit >= BAND_THRESHOLDS.MEDIUM) return 'MODERATE';
  if (offer.fit > 0) return 'WEAK';
  return 'UNKNOWN';
}

/**
 * Need/Opportunity tier (PO-3, Phase 5): recognizes Phase 1's
 * deterministic absent-SSL/TLS signal after persistence, via its
 * reserved `field` marker (research_signals has no `dimension` column —
 * see @acos/core-research's DETERMINISTIC_ABSENT_SSL_FIELD). A
 * deterministic catalogue signal is binary present/absent (no magnitude)
 * and pinned at OBSERVED_FACT_CONFIDENCE by construction — any live
 * presence reads as STRONG, never a fabricated partial tier, the same
 * way serviceFitTier treats an offer at/above BAND_THRESHOLDS.HIGH.
 * UNKNOWN when absent or only superseded — a superseded row must stay
 * blind, the same "live only" rule evidenceQualityTier/evidenceFreshnessTier
 * already apply.
 */
function needOpportunityTier(storedSignals: readonly StoredResearchSignal[]): RankingTier {
  const live = storedSignals.some(
    (signal) => !signal.supersededAt && signal.field === DETERMINISTIC_ABSENT_SSL_FIELD,
  );
  return live ? 'STRONG' : 'UNKNOWN';
}

/**
 * Builds this Opportunity's UniversalRankingProfile. Contactability,
 * Current Activity and Commercial Readiness are deliberately UNKNOWN
 * today: no deterministic signal producer is wired into this call site
 * yet for any of them (ICP/ability-to-pay/urgency/contact-channel
 * detection do not exist in this repository, the same gap the old
 * scorer's neutralScoringInputs() named honestly rather than inventing
 * detection logic for). The moment a future phase wires a real producer
 * for one of these dimensions, only this function needs to change — the
 * ranking/comparator/persistence layers already consume whatever tier
 * it returns. Exported (Phase 5) so @acos/core-opportunity's preview.ts
 * can reuse the identical tier logic in-memory, pre-persistence, for
 * Pass-1 admission ranking — the preview and the final persisted ranking
 * can never diverge in their tier rules, only in which evidence is
 * available at each point in time.
 */
export function buildRankingProfile(
  offer: DetectedOffer | undefined,
  storedSignals: readonly StoredResearchSignal[],
  now: Date,
): UniversalRankingProfile {
  const { signals } = toScoringSignals(storedSignals);
  // Superseded findings are history, not current evidence — the same
  // filter prospectScore.ts's own liveSignals() applies.
  const live = signals.filter((signal) => !signal.supersededAt);
  return {
    ...unknownRankingProfile(),
    needOpportunity: needOpportunityTier(storedSignals),
    serviceFit: serviceFitTier(offer),
    evidenceQuality: evidenceQualityTier(live),
    evidenceFreshness: evidenceFreshnessTier(live, now),
  };
}

const DIMENSION_LABELS: Record<keyof UniversalRankingProfile, string> = {
  needOpportunity: 'Need/Opportunity',
  serviceFit: 'Service Fit',
  evidenceQuality: 'Evidence Quality',
  evidenceFreshness: 'Evidence Freshness',
  contactability: 'Contactability',
  currentActivity: 'Current Activity',
  commercialReadiness: 'Commercial Readiness',
};

/** Ordered, human-readable — one line per dimension, in the same precedence order the ranking compares them. */
function buildRankingReasons(profile: UniversalRankingProfile): readonly string[] {
  return (Object.keys(DIMENSION_LABELS) as (keyof UniversalRankingProfile)[]).map(
    (dimension) => `${DIMENSION_LABELS[dimension]}: ${profile[dimension]}`,
  );
}

export interface OpportunityScoreDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  signals: ResearchSignalRepository;
  scores: OpportunityScoreRepository;
}

/**
 * Ranks one of the caller's own Opportunities (R-14/R-15/R-17, now
 * qualitative per Phase 3) and persists the result as that Opportunity's
 * current score (migration 0018's `UNIQUE(opportunity_id)` — re-ranking
 * replaces, never appends).
 *
 * Ownership is resolved through Opportunity (`deps.opportunities.getById`
 * — the only place `opportunityId` is checked against the caller);
 * `deps.signals.listByProspect` re-checks ownership independently via
 * its own join to `prospects`, the same belt-and-suspenders convention
 * `createOpportunity` and `scoreResearchedProspect` already use.
 *
 * `signals` is adapted from this Opportunity's Prospect's persisted,
 * currently-active ResearchSignals via @acos/core-research's
 * toScoringSignals() — reused for its confidence/inference-discount
 * adaptation, not for its scoreProspect()-shaped output. See
 * buildRankingProfile() for how each dimension's tier is derived.
 */
export async function scoreOpportunity(
  deps: OpportunityScoreDeps,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredOpportunityScore> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return scoreOpportunityForOwner(deps, userId, opportunityId, now);
}

/**
 * Same behavior as {@link scoreOpportunity}, for a caller that has
 * already resolved a trusted `userId` by some means other than a session
 * token — specifically, a worker that claimed a Search row and is reading
 * ownership out of it (R-34's "WORKER OWNERSHIP"). Not reachable from any
 * HTTP path — only `scoreOpportunity()` (token-authenticated) is. Mirrors
 * the existing `createOpportunity()`/`createOpportunityForOwner()` split.
 *
 * Computes and persists the identical ranking `scoreOpportunity()` would
 * — this function performs no algorithm change of its own; it only skips
 * the token-to-userId resolution step, exactly as `createOpportunityForOwner`
 * does relative to `createOpportunity`.
 */
export async function scoreOpportunityForOwner(
  deps: Omit<OpportunityScoreDeps, 'identity'>,
  userId: string,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredOpportunityScore> {
  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new OpportunityNotFoundError(opportunityId);

  const storedSignals = await deps.signals.listByProspect(userId, opportunity.prospectId);

  const ranking = buildRankingProfile(opportunity.offer, storedSignals, now);
  const reasons = buildRankingReasons(ranking);

  return deps.scores.upsert(opportunity.id, ranking, reasons, SCORER_VERSION, now);
}

/**
 * Reads one of the caller's own OpportunityScores. Returns `null` when
 * the Opportunity has never been scored, or does not resolve to one the
 * caller owns — indistinguishable from "not yet scored", the same
 * convention @acos/core-opportunity's other reads use for an unowned id.
 */
export async function getOpportunityScore(
  deps: Pick<OpportunityScoreDeps, 'identity' | 'scores'>,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredOpportunityScore | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.scores.getByOpportunityId(userId, opportunityId);
}

// ---- Phase 11: Opportunity ranking (R-15/AC-17) ------------------------
// A pure read over what was already persisted. Orders the caller's own
// OpportunityScores via @acos/core-acquisition's rankByUniversalProfile()
// (PRD V2.1 Stage O: "order opportunities deterministically"; Phase 3 of
// the deterministic architecture plan) — lexicographic by dimension
// tier (Primary, then Important, then Supporting), then id ascending.
// Never recomputes a ranking, never mutates a row: this function's only
// input is each row's already-persisted `ranking`. Unscored Opportunities
// (no row in opportunity_scores) cannot be represented as a candidate
// and so are naturally absent from the result — not filtered out by any
// logic of this function's own. Ranking is ordering only — it has no
// concept of eligibility and never removes a candidate from this list.

/**
 * Ranks all of the caller's own, already-scored Opportunities (R-15).
 * Ownership is enforced by `deps.scores.listByUserId` itself, the same
 * boundary getOpportunityScore already relies on — this function adds
 * no ownership check of its own beyond `requireUser`.
 */
export async function rankOpportunities(
  deps: Pick<OpportunityScoreDeps, 'identity' | 'scores'>,
  rawToken: string | undefined | null,
  now: Date = new Date(),
): Promise<readonly RankedOpportunity[]> {
  const userId = await requireUser(deps.identity, rawToken, now);
  const rows = await deps.scores.listByUserId(userId);

  // A legacy (pre-migration-0044) row carries no qualitative ranking
  // (row.ranking is null) — ranks it last, deterministically, the same
  // treatment an UNKNOWN-everywhere current row already gets, never a
  // crash and never a fabricated profile on the stored row itself.
  const candidates = rows.map((row) => ({
    id: row.opportunityId,
    ranking: row.ranking ?? unknownRankingProfile(),
    row,
  }));
  const ranked = rankByUniversalProfile(candidates);

  return ranked.map((entry, index) => ({
    opportunityId: entry.id,
    rank: index + 1,
    score: entry.row,
  }));
}

// ---- Phase 12: Opportunity staleness (R-19, migration 0019) -----------
// Classifies whether one of the caller's own Opportunities still rests
// on current evidence, using @acos/core-acquisition's classifyStaleness()
// (PRD V2.1 Stage S) — unmodified, over the same signals
// scoreOpportunity() already reads via @acos/core-research's
// toScoringSignals(), which is why UNKNOWN rows (no observedAt claim
// worth dating) are already excluded before classifyStaleness() sees
// them. An explicit operation, not run automatically at creation or
// scoring — the same "separate step in the MVP journey" decision Phase
// 10's header made for scoreOpportunity(). Deliberately independent of
// `state` (NEW/RESEARCHED): staleness answers "is the evidence still
// current", not "what step is this Opportunity at", and this function
// never touches `state`.

/**
 * Classifies and persists one of the caller's own Opportunities'
 * staleness (R-19). Ownership is resolved through
 * `deps.opportunities.getById` — the only place `opportunityId` is
 * checked against the caller; `deps.opportunities.updateStaleness`
 * re-checks ownership independently at the write itself, the same
 * belt-and-suspenders convention `scoreOpportunity` uses for its own
 * repositories.
 */
export async function classifyOpportunityStaleness(
  deps: Pick<OpportunityScoreDeps, 'identity' | 'opportunities' | 'signals'>,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredOpportunity> {
  const userId = await requireUser(deps.identity, rawToken, now);

  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new OpportunityNotFoundError(opportunityId);

  const storedSignals = await deps.signals.listByProspect(userId, opportunity.prospectId);
  const { signals } = toScoringSignals(storedSignals);

  const staleness = classifyStaleness(signals, now);

  const updated = await deps.opportunities.updateStaleness(userId, opportunityId, staleness, now);
  if (!updated) throw new OpportunityNotFoundError(opportunityId);
  return updated;
}

// ---- Phase 6: Opportunity AI enrichment provenance ---------------------
// Records the already-resolved outcome of the search worker's
// processOneCandidate() admission/cache/budget/escalation branches
// (CLIENT_FINDER_PHASE6_IMPLEMENTATION_READINESS_REPORT.md) against the
// Opportunity those branches converge on. Unlike classifyOpportunityStaleness
// above, this function classifies nothing itself — the caller has already
// decided AI_ENRICHED vs DETERMINISTIC_ONLY (and, for the latter, which of
// the three reasons) before calling it; this is pure metadata wiring over
// behavior Phase 5 already implemented. Not reachable from any HTTP path —
// only the search worker calls it, reading ownership out of the Search row
// it claimed, the same "ForOwner" convention createOpportunityForOwner and
// scoreOpportunityForOwner already use.

/**
 * Records one of the caller's own Opportunities' AI enrichment provenance
 * (Phase 6). Ownership is resolved through `deps.opportunities.getById` —
 * the only place `opportunityId` is checked against the caller;
 * `deps.opportunities.updateAiEnrichment` re-checks ownership independently
 * at the write itself, the same belt-and-suspenders convention
 * `classifyOpportunityStaleness` uses for its own repository. Reclassifiable,
 * not append-only — calling this again for the same Opportunity (a Search
 * retry) updates the existing row in place, never inserts a duplicate.
 */
export async function recordAiEnrichmentForOwner(
  deps: Pick<OpportunityDeps, 'opportunities'>,
  userId: string,
  opportunityId: string,
  aiEnrichment: AiEnrichment,
  aiEnrichmentReason: AiEnrichmentReason | null,
): Promise<StoredOpportunity> {
  const existing = await deps.opportunities.getById(userId, opportunityId);
  if (!existing) throw new OpportunityNotFoundError(opportunityId);

  const updated = await deps.opportunities.updateAiEnrichment(
    userId,
    opportunityId,
    aiEnrichment,
    aiEnrichmentReason,
  );
  if (!updated) throw new OpportunityNotFoundError(opportunityId);
  return updated;
}

// ---- Phase 13: Opportunity Next Action (R-20/AC-21) --------------------
// Recommends what the caller should do next with one of their own
// Opportunities, via @acos/core-acquisition's recommendOpportunityAction()
// (PRD V2.1 Stage T) — unmodified, over fields this Opportunity already
// persists (`state`, `needDetected`, `staleness`). Derived at read time,
// never persisted: unlike staleness, a Next Action needs no new evidence
// fetch to justify caching, and a stored value would go stale as `now`
// advances without any Opportunity mutation. Deliberately does not reuse
// @acos/core-acquisition's nextAction.ts — that engine assumes the
// nine-stage CRM pipeline (CONTACTED, REPLIED, QUALIFIED, PROPOSAL_SENT,
// follow-up cadence) the MVP Opportunity does not have, and MVP_SCOPE_
// BOUNDARY.md §6.2-6.4 places outreach/CRM/proposal actions out of scope.

/**
 * Recommends a Next Action for one of the caller's own Opportunities
 * (R-20/AC-21). Ownership is resolved through `deps.opportunities.getById`
 * — the only place `opportunityId` is checked against the caller, the
 * same boundary `classifyOpportunityStaleness` and `getOpportunityScore`
 * use for their own reads.
 */
export async function getOpportunityNextAction(
  deps: Pick<OpportunityDeps, 'identity' | 'opportunities'>,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<OpportunityAction> {
  const userId = await requireUser(deps.identity, rawToken, now);

  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new OpportunityNotFoundError(opportunityId);

  return recommendOpportunityAction({
    state: opportunity.state,
    needDetected: opportunity.needDetected,
    staleness: opportunity.staleness,
  });
}

// ---- Phase 14: Feedback (R-21/AC-22, migration 0020) -------------------
// Captures the caller's useful/not-useful verdict plus a free-text reason
// against one of their own Opportunities (PRD V2.1 Stage R: "Persist the
// verdict against the opportunity ... Unpersisted feedback is a UI
// gesture, not feedback"). `reason` is never validated for its semantic
// content, categorized, or rewritten — OQ-5 resolved this as free text.
// One current verdict per Opportunity (migration 0020's
// UNIQUE(opportunity_id)): resubmitting replaces it, mirroring Phase 10's
// scoreOpportunity() "explicit step, replace in place" decision. Feedback
// carries its own user_id (unlike OpportunityScore) so the repository
// write itself is ownership-scoped, in addition to the Opportunity
// ownership check below.

export interface OpportunityFeedbackDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  feedback: FeedbackRepository;
}

/**
 * Records feedback for one of the caller's own Opportunities (R-21).
 * Ownership is resolved through `deps.opportunities.getById` — the same
 * boundary every other Phase 9-13 operation on an existing Opportunity
 * uses — before the Feedback row is written.
 */
export async function recordFeedback(
  deps: OpportunityFeedbackDeps,
  rawToken: string | undefined | null,
  opportunityId: string,
  input: RecordFeedbackInput,
  now: Date = new Date(),
): Promise<StoredFeedback> {
  const userId = await requireUser(deps.identity, rawToken, now);
  const validated = validateRecordFeedbackInput(input);

  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new OpportunityNotFoundError(opportunityId);

  return deps.feedback.upsert(userId, opportunity.id, validated, now);
}

/**
 * Reads the caller's own Feedback for one of their own Opportunities.
 * Returns `null` when no feedback has been recorded yet, or when
 * `opportunityId` does not resolve to an Opportunity owned by the caller
 * — indistinguishable from "not yet given". Ownership is enforced by
 * `deps.feedback.getByOpportunityId` itself (Feedback carries its own
 * `userId`), the same boundary getOpportunityScore() relies on for its
 * own repository — no separate Opportunity lookup needed for a read.
 */
export async function getFeedback(
  deps: Pick<OpportunityFeedbackDeps, 'identity' | 'feedback'>,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredFeedback | null> {
  const userId = await requireUser(deps.identity, rawToken, now);
  return deps.feedback.getByOpportunityId(userId, opportunityId);
}

// ---- Phase 15: Opportunity Tracking (R-27) -----------------------------
// "Record what happened: opportunities created, reviewed, actioned" (PRD
// V2.2 R-27), scoped to "Basic outcome tracking only, per Scope Boundary
// §5.5". Reuses only what Phases 9 and 14 already persist — no new
// migration, no new table, no new column: `created` is a count of the
// caller's own Opportunities (deps.opportunities.list, R-13); `actioned`
// is a count of those with a recorded Feedback verdict (deps.feedback.list,
// R-21) — Stage R's useful/not-useful verdict is the only terminal user
// action the MVP Opportunity model has. `useful`/`notUseful` break down
// `actioned` by verdict; `actionedRate` is the one derived ratio "basic"
// tracking needs, never NaN.
//
// Deliberately does NOT report a "reviewed" count. Stage Q ("USER
// REVIEW" — "the user opens one opportunity and sees...") describes a UI
// interaction, not a persisted signal: no field, table, acceptance
// criterion, decision record or correction anywhere in PRD V2.2 defines
// what "reviewed" means as data, what would set it, or whether it needs
// its own persistence. Inventing an answer (e.g. treating a
// getOpportunity() call as "reviewed") would mean either giving a
// Phase 9 read a persisted side effect it does not have today — changing
// an earlier phase's behavior — or adding a new mutation surface nothing
// yet calls, since no API/UI route reaches this package (see the Phase
// 15 preflight). This is reported as an open decision, not resolved by
// assumption (Master Prompt §6/§16).
//
// Does not reuse @acos/core-acquisition's metrics.ts: that module's
// ClosedOpportunity operates on the nine-stage CRM pipeline (WON/LOST,
// `angle`, `valuePaise`, `followUpsSent`) — Phase 2+ concepts
// MVP_SCOPE_BOUNDARY.md §6.2-§6.4 excludes, and fields the MVP
// Opportunity (state: 'NEW' | 'RESEARCHED' only, no revenue field per
// PFR-02) cannot supply. Reusing it would require either fabricating
// those inputs or expanding the Opportunity model — outside Phase 15
// scope. This is also why R-27's own status note calls that module's
// inputs unsuppliable.

export interface OpportunityTrackingDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  feedback: FeedbackRepository;
}

/**
 * Computes basic outcome tracking for the caller's own Opportunities
 * (R-27). A pure read over already-persisted, already-ownership-scoped
 * data — `deps.opportunities.list(userId)` and `deps.feedback.list(userId)`
 * each filter on `user_id` at the query itself, the same boundary every
 * other Phase 9-14 read in this file relies on. No repository beyond
 * those two reads is touched, and nothing is written.
 */
export async function getOpportunityTrackingSummary(
  deps: OpportunityTrackingDeps,
  rawToken: string | undefined | null,
  now: Date = new Date(),
): Promise<OpportunityTrackingSummary> {
  const userId = await requireUser(deps.identity, rawToken, now);

  const [opportunities, feedback] = await Promise.all([
    deps.opportunities.list(userId),
    deps.feedback.list(userId),
  ]);

  const created = opportunities.length;
  // migration 0020's UNIQUE(opportunity_id) plus recordFeedback()'s own
  // ownership check (Phase 14) together guarantee feedback.length is
  // already a count of distinct, caller-owned Opportunities — no further
  // dedup or cross-check against `opportunities` is needed.
  const actioned = feedback.length;
  const useful = feedback.filter((row) => row.useful).length;
  const notUseful = actioned - useful;

  return {
    created,
    actioned,
    useful,
    notUseful,
    actionedRate: created === 0 ? 0 : actioned / created,
  };
}
