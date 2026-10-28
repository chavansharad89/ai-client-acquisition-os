import type { ResearchSourceKind } from './persist';
import type { StoredResearchSignal } from './types';

// Phase 4 — same-freelancer cache-first evidence reuse
// (CLIENT_FINDER_DETERMINISTIC_ARCHITECTURE_IMPLEMENTATION_PLAN.md Phase
// 4; CF-SAME-FREELANCER-EVIDENCE-REUSE-PO-DEC-001).
// -----------------------------------------------------------------------
// This module is a pure, repository-agnostic lookup/outcome layer: it
// never calls a provider or performs I/O itself (see ./service's
// lookupCachedSignalForOwner, the exposed entrypoint, and ./pgRepository
// for the actual storage). A cache "hit" always returns the original,
// unmodified StoredResearchSignal rows (with their sources) — reuse never
// rewrites evidence, provenance, confidence, or the observed timestamp.
// -----------------------------------------------------------------------

/**
 * One (user, domain, kind) -> signal pointer, written once per saved,
 * cacheable signal. `entityId` (Global Entity Architecture, Final
 * Architecture Rules §6 "Cache"; migration 0060) is a second, parallel,
 * nullable dimension on the SAME row — it never replaces or alters the
 * (userId, normalizedDomain, signalKind) identity above, and is `null`
 * whenever no Entity has been resolved for the researched Company
 * (website-less candidates not yet resolved, or any row written before
 * the Entity layer existed). Never backfilled onto an existing row.
 */
export interface NewSignalCacheEntryInput {
  userId: string;
  normalizedDomain: string;
  signalKind: ResearchSourceKind;
  signalId: string;
  observedAt: Date;
  entityId?: string | null;
}

export interface ResearchSignalCacheRepository {
  /** Indexes a freshly-saved, cacheable signal. Never called for PUBLIC_INTENT/FIRST_PARTY (see ./service). */
  record(entry: NewSignalCacheEntryInput): Promise<void>;
  /**
   * Every currently-active (non-superseded) signal indexed for this exact
   * (userId, normalizedDomain, signalKind) key, newest first. Never
   * crosses users — a cross-freelancer lookup is not expressible through
   * this method at all, since userId is a required, non-optional
   * parameter on every implementation (see ./pgRepository).
   */
  findByKey(
    userId: string,
    normalizedDomain: string,
    signalKind: ResearchSourceKind,
  ): Promise<readonly StoredResearchSignal[]>;
  /**
   * Every currently-active (non-superseded) signal indexed under this
   * Entity for this signal kind, newest first — deliberately
   * cross-freelancer (that is the entire point of the Entity dimension;
   * see Final Architecture Rules §6 "Cache"). A row with `entity_id IS
   * NULL` can never match any real `entityId` argument, so it is
   * structurally impossible for a website-less or pre-Entity-layer row
   * to surface here.
   *
   * This is a POINTER lookup only — exactly like findByKey, it carries no
   * privacy decision of its own, and its raw result must NEVER be served
   * to a freelancer, an API response, or any client-facing view directly.
   * The only sanctioned way to turn this result into something servable
   * is evaluateEntityPublicLookup below, which requires the caller to
   * supply a live field-classification check (Phase H) and a live Q5-B
   * authorization check (Phase I) — neither of which exists yet. Until
   * then, no production code path may call this method at all.
   */
  findByEntity(
    entityId: string,
    signalKind: ResearchSourceKind,
  ): Promise<readonly StoredResearchSignal[]>;
}

export type SignalCacheFreshness = 'fresh' | 'stale';

export interface SignalCacheLookupResult {
  readonly outcome: 'hit' | 'none';
  /** null only when outcome is 'none' (no indexed evidence at all for this key). */
  readonly freshness: SignalCacheFreshness | null;
  /** Original, unmodified signals (and their sources) for this key — empty when outcome is 'none'. */
  readonly signals: readonly StoredResearchSignal[];
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * CF-SIGNAL-FRESHNESS-PO-DEC-001's approved initial freshness windows,
 * in days. MANUAL and any kind not listed here (including the
 * non-cacheable PUBLIC_INTENT/FIRST_PARTY intent-intake kinds — see
 * ./service's recordCacheableSignals) have no window and are always
 * STALE per that decision.
 */
const FRESHNESS_WINDOW_DAYS: Partial<Record<ResearchSourceKind, number>> = {
  WEBSITE: 30,
  JOB_POST: 14,
  LINKEDIN: 14,
  NEWS: 7,
  FUNDING: 90,
  TECH_STACK: 30,
  REVIEW: 90,
  // CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001 D12: Google Places
  // operational-status evidence is fresh for 30 days from observedAt.
  // Does not alter any other kind's window above.
  GOOGLE_PLACES_STATUS: 30,
};

/**
 * CF-SIGNAL-FRESHNESS-PO-DEC-001: evidence is FRESH while its age (now -
 * observedAt) is within its signal kind's approved window, and STALE
 * once that window has elapsed. A kind with no approved window (MANUAL,
 * PUBLIC_INTENT, FIRST_PARTY, or any future/unrecognized kind) is always
 * STALE — freshness is never assumed for a kind that has no policy.
 */
export function evaluateSignalFreshness(
  signalKind: ResearchSourceKind,
  observedAt: Date,
  now: Date,
): SignalCacheFreshness {
  const windowDays = FRESHNESS_WINDOW_DAYS[signalKind];
  if (windowDays === undefined) return 'stale';
  const ageMs = now.getTime() - observedAt.getTime();
  return ageMs <= windowDays * MS_PER_DAY ? 'fresh' : 'stale';
}

/**
 * Turns a set of same-key signals (as returned by
 * ResearchSignalCacheRepository.findByKey) into the outcome Phase 5 will
 * branch on. Pure — no I/O, independently testable.
 */
export function toSignalCacheLookupResult(
  signals: readonly StoredResearchSignal[],
  signalKind: ResearchSourceKind,
  now: Date,
): SignalCacheLookupResult {
  if (signals.length === 0) {
    return { outcome: 'none', freshness: null, signals: [] };
  }
  const freshness: SignalCacheFreshness = signals.every(
    (signal) => evaluateSignalFreshness(signalKind, signal.observedAt, now) === 'fresh',
  )
    ? 'fresh'
    : 'stale';
  return { outcome: 'hit', freshness, signals };
}

/**
 * Phase H's field-classification check and Phase I's Q5-B authorization
 * check, as required dependencies of evaluateEntityPublicLookup below —
 * NOT optional, and with no default/fallback implementation supplied by
 * this module. Neither phase exists yet, so every current caller of
 * evaluateEntityPublicLookup must supply its own, and a caller with no
 * real classification/authorization source available must pass a
 * function that always returns `false` — never `true` — so the gate
 * fails closed rather than silently permitting reuse.
 */
export interface EntityPublicLookupDeps {
  /** True only when `field` is classified PUBLIC_ELIGIBLE (Phase H). */
  isFieldPublicEligible(field: string): boolean;
  /** True only when `signalId` has a live, unrevoked Q5-B authorization row (Phase I). */
  isAuthorized(signalId: string): boolean;
}

/**
 * Turns a set of same-Entity signals (as returned by
 * ResearchSignalCacheRepository.findByEntity) into the outcome a future
 * cross-freelancer read path would branch on — the Entity/public
 * counterpart to toSignalCacheLookupResult. Pure — no I/O, independently
 * testable, and the ONLY sanctioned way to turn findByEntity's raw
 * pointer result into something eligible for cross-freelancer reuse.
 *
 * Every signal must independently pass BOTH deps checks before freshness
 * is even considered — this is a hard AND, never an OR, and there is no
 * way to call this function without supplying both. A signal failing
 * either check is excluded from the result entirely; it is never
 * "downgraded" or returned with a warning. Signals that pass remain
 * independently evaluated for freshness exactly like toSignalCacheLookupResult
 * (conflicting observations for the same Entity are preserved, never
 * collapsed into one).
 */
export function evaluateEntityPublicLookup(
  signals: readonly StoredResearchSignal[],
  signalKind: ResearchSourceKind,
  now: Date,
  deps: EntityPublicLookupDeps,
): SignalCacheLookupResult {
  const eligible = signals.filter(
    (signal) => deps.isFieldPublicEligible(signal.field) && deps.isAuthorized(signal.id),
  );
  return toSignalCacheLookupResult(eligible, signalKind, now);
}
