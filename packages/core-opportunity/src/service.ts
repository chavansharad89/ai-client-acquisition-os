import {
  classifyStaleness,
  rankProspects,
  scoreProspect,
  suggestOffers,
  type ProspectInput,
  type ProspectScore,
} from '@acos/core-acquisition';
import type { ProspectRepository } from '@acos/core-discovery';
import { requireUser, type IdentityRepository } from '@acos/core-identity';
import { toScoringSignals, type ResearchSignalRepository } from '@acos/core-research';
import type { SearchRepository } from '@acos/core-search';

import { toOfferSignals, toServiceRule } from './adapters';
import { OpportunityNotFoundError, OpportunityProspectNotFoundError } from './errors';
import type { OpportunityRepository } from './repository';
import type { OpportunityScoreRepository } from './scoreRepository';
import type {
  CreateOpportunityInput,
  DetectedOffer,
  RankedOpportunity,
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

// ---- Phase 10: OpportunityScore persistence (migration 0018) ----------
// Wires @acos/core-acquisition's existing, unmodified scoreProspect()
// (PRD V2.1 "SEVEN-FACTOR SCORING — AUTHORITATIVE MODEL": no replacement
// scoring framework) onto a persisted Opportunity. An explicit operation,
// deliberately not called from createOpportunity() above — Opportunity
// creation and scoring are separate steps in the MVP journey.
//
// Identifies the scorer build that produced a row (PRD V2.1:
// "scorerVersion is what allows a ranking to be reproduced after weights
// change"). No versioning scheme exists elsewhere in the repository;
// this is the smallest stable constant Phase 10 needs. Bump it only if
// prospectScore.ts's algorithm or FACTOR_WEIGHTS changes.
export const SCORER_VERSION = 'prospectScore-v1';

/**
 * `ProspectInput` minus `signals` and `serviceFit` — @acos/core-research's
 * `ScoreResearchedProspectInput` already documents that ICP fit, ability
 * to pay, urgency and contact channels come from systems this repository
 * does not build (ICP matching, ability-to-pay/urgency detection,
 * contact-channel capture). Phase 10 does not invent them: every one of
 * these Claims is given the scorer's own UNKNOWN/neutral representation
 * — `{ value: null, basis: 'UNKNOWN' }` for icp/abilityToPay/urgency (the
 * same shape scoreProspect() already treats as "no contribution", see
 * prospectScore.ts's `combineBasis`/`known.length === 0` handling) and
 * no known contact channels for `contact`. Only `serviceFit` is filled
 * in below, from the Opportunity's own persisted offer.
 */
function neutralScoringInputs(): Omit<ProspectInput, 'signals' | 'serviceFit'> {
  return {
    icp: {
      industryMatch: { value: null, basis: 'UNKNOWN' },
      sizeMatch: { value: null, basis: 'UNKNOWN' },
      geoMatch: { value: null, basis: 'UNKNOWN' },
    },
    abilityToPay: { value: null, basis: 'UNKNOWN' },
    urgency: { value: null, basis: 'UNKNOWN' },
    contact: { hasEmail: false, hasLinkedIn: false, hasPhone: false, unsubscribed: false },
  };
}

/**
 * Derives `serviceFit` from the Opportunity's own persisted offer
 * (Phase 10 Decision 1) rather than a fresh ServiceProfile lookup — the
 * offer already IS the caller's service matched against this Prospect's
 * evidence (R-11/R-12). `undefined` (AC-14's NO SUITABLE OFFER) becomes
 * the scorer's own UNKNOWN representation — never a fabricated offer or
 * a default to the caller's service.
 */
function serviceFitFromOffer(offer: DetectedOffer | undefined): ProspectInput['serviceFit'] {
  if (!offer) return { value: null, basis: 'UNKNOWN' };
  return {
    value: offer.fit,
    basis: 'OBSERVED',
    note: `service fit ${offer.fit}/100 (recommended offer: ${offer.service})`,
  };
}

export interface OpportunityScoreDeps {
  identity: IdentityRepository;
  opportunities: OpportunityRepository;
  signals: ResearchSignalRepository;
  scores: OpportunityScoreRepository;
}

/**
 * Scores one of the caller's own Opportunities (R-14/R-15/R-17) and
 * persists the result as that Opportunity's current score (migration
 * 0018's `UNIQUE(opportunity_id)` — re-scoring replaces, never appends).
 *
 * Ownership is resolved through Opportunity (`deps.opportunities.getById`
 * — the only place `opportunityId` is checked against the caller);
 * `deps.signals.listByProspect` re-checks ownership independently via
 * its own join to `prospects`, the same belt-and-suspenders convention
 * `createOpportunity` and `scoreResearchedProspect` already use.
 *
 * The seven-factor algorithm itself is @acos/core-acquisition's
 * scoreProspect(), unmodified; `signals` is adapted from this
 * Opportunity's Prospect's persisted, currently-active ResearchSignals
 * via @acos/core-research's toScoringSignals(), which applies the
 * inference discount exactly once, by classification. See
 * neutralScoringInputs() and serviceFitFromOffer() for how the
 * remaining, not-yet-built factors are supplied.
 */
export async function scoreOpportunity(
  deps: OpportunityScoreDeps,
  rawToken: string | undefined | null,
  opportunityId: string,
  now: Date = new Date(),
): Promise<StoredOpportunityScore> {
  const userId = await requireUser(deps.identity, rawToken, now);

  const opportunity = await deps.opportunities.getById(userId, opportunityId);
  if (!opportunity) throw new OpportunityNotFoundError(opportunityId);

  const storedSignals = await deps.signals.listByProspect(userId, opportunity.prospectId);
  const { signals } = toScoringSignals(storedSignals);

  const input: ProspectInput = {
    ...neutralScoringInputs(),
    serviceFit: serviceFitFromOffer(opportunity.offer),
    signals,
  };

  const score = scoreProspect(input, now);

  return deps.scores.upsert(opportunity.id, score, SCORER_VERSION, now);
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
// A pure read over what Phase 10 already persisted. Orders the caller's
// own OpportunityScores via @acos/core-acquisition's rankProspects()
// (PRD V2.1 Stage O: "order opportunities deterministically") —
// unmodified, the same comparator core-acquisition's own
// prospectScore.test.ts already proves: score.score desc, then
// observedShare desc, then id asc. Never recomputes a score, never
// touches the scoring algorithm or the inference discount, never
// mutates a row. Unscored Opportunities (no row in opportunity_scores)
// cannot be represented as a { id, score: ProspectScore } candidate and
// so are naturally absent from the result — not filtered out by any
// logic of this function's own.

/** Reconstructs the ProspectScore shape rankProspects() sorts on, from a persisted row. */
function toProspectScore(row: StoredOpportunityScore): ProspectScore {
  return {
    score: row.total,
    band: row.band,
    factors: row.factors,
    reasons: row.reasons,
    observedShare: row.observedShare,
    ...(row.cap !== undefined ? { cap: row.cap } : {}),
  };
}

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

  const candidates = rows.map((row) => ({
    id: row.opportunityId,
    score: toProspectScore(row),
    row,
  }));
  const ranked = rankProspects(candidates);

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
