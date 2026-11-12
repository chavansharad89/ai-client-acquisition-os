import { evaluateQ5AFloor } from './q5aEvidenceFloor';
import type { Q5AFloorFailureReason } from './q5aEvidenceFloor';
import type { FieldClassificationRepository } from './fieldClassification';
import type { ResearchSourceKind } from './persist';
import type { ResearchSignalCacheRepository, SignalCacheLookupResult } from './signalCache';
import { evaluateEntityPublicLookup } from './signalCache';
import type { StoredResearchSignal } from './types';

// Phase I — Q5-B sharing-authorization gate
// (CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_PO_DECISION.md Q5-B = B;
// CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_SHARING_GATE_ENGINEERING_
// SPECIFICATION.md §E.2/§E.3 condition 5, §H, §J). Backed by the
// existing, already-applied `research_signal_global_authorizations`
// table (migration 0059) — this module never modifies that migration,
// and has no code path capable of writing to it except the single,
// explicit, validated entrypoint below (authorizeSignalForSharing).
// -----------------------------------------------------------------------

export interface StoredSignalAuthorization {
  id: string;
  signalId: string;
  authorizedAt: Date;
  authorizedBy: string;
  /** null while active. Append-only: a revocation is a later write setting this, never a row deletion (D11). */
  revokedAt: Date | null;
}

export interface SignalAuthorizationRepository {
  /**
   * The most recent authorization row recorded for `signalId` — present
   * or absent, revoked or not. Returns `null` only when no row has EVER
   * been written for this signal (the correct, conservative default for
   * every historical row and every not-yet-authorized new row — §J).
   * Callers must route the result through isAuthorizationActive rather
   * than treating a non-null return as itself sufficient — a revoked row
   * is still returned here, deliberately, so a caller cannot bypass
   * revocation by skipping the check.
   */
  findLatestAuthorization(signalId: string): Promise<StoredSignalAuthorization | null>;
  /**
   * Raw insert — performs NO validation of its own. The only legitimate
   * caller is authorizeSignalForSharing below, which validates every
   * §E.3/§4 condition first; this method exists only so the DB-
   * interaction stays separate from, and independently testable from,
   * that pure validation logic (the same split every other repository in
   * this codebase already follows).
   */
  insertAuthorization(
    input: { signalId: string; authorizedBy: string },
    now: Date,
  ): Promise<StoredSignalAuthorization>;
  /**
   * Q5-C (CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_C_HISTORICAL_
   * AUTHORIZATION_CLARIFICATION.md §4/§6): the moment this repository's
   * own backing table (research_signal_global_authorizations,
   * migration 0059) was introduced in THIS database. This is the
   * engineering specification's own, non-invented definition of
   * "historical" (engineering spec §J: "historical... means any row
   * that exists at the moment this gate's storage is introduced") — a
   * research_signals row created before this moment is historical and
   * permanently ineligible for authorization or global serving absent
   * a future, separate, explicit PO decision. Derived from the actual
   * recorded migration-apply time, never a hardcoded/invented date.
   */
  getHistoricalCutoffAt(): Promise<Date>;
}

/** A row that was never written, or whose most recent write revoked it, is NOT active. Never the reverse. */
export function isAuthorizationActive(authorization: StoredSignalAuthorization | null): boolean {
  return authorization !== null && authorization.revokedAt === null;
}

export type SignalAuthorizationRejectionReason =
  | Q5AFloorFailureReason
  | 'SIGNAL_NOT_FOUND'
  | 'FIELD_NOT_PUBLIC_ELIGIBLE'
  | 'HISTORICAL_SIGNAL_INELIGIBLE';

export class SignalAuthorizationRejectedError extends Error {
  readonly reason: SignalAuthorizationRejectionReason;
  constructor(reason: SignalAuthorizationRejectionReason) {
    super(`signal authorization rejected: ${reason}`);
    this.reason = reason;
  }
}

/** Narrow, read-only — deliberately not the shared ResearchSignalRepository (which has no single-row getById and is widely implemented elsewhere); only authorizeSignalForSharing needs this. */
export interface SignalLookupRepository {
  getById(signalId: string): Promise<StoredResearchSignal | null>;
}

export interface AuthorizeSignalForSharingDeps {
  signals: SignalLookupRepository;
  fieldClassification: FieldClassificationRepository;
  authorizations: SignalAuthorizationRepository;
}

/**
 * THE ONLY way a research_signal_global_authorizations row may be
 * created anywhere in this codebase. A single, explicit, one-signal-at-
 * a-time, privileged operation — there is no batch/bulk variant, no API
 * route, no UI, and no caller from the research pipeline (verify: grep
 * for this function's name finds no caller in ./service.ts, ./persist.ts,
 * or apps/worker). Per the engineering specification's own §H diagram,
 * the actual operator/process invoking this is deliberately unspecified
 * beyond "not automatic" — this function enforces every condition it CAN
 * mechanically verify (§4 items 1-9) before inserting, and throws
 * (never silently no-ops) on any failure.
 *
 * Historical safety (Q5-C, corrected per the Q5-C clarification record
 * CLIENT_FINDER_GLOBAL_ENTITY_ARCH_Q5_C_HISTORICAL_AUTHORIZATION_
 * CLARIFICATION.md §2/§4/§6): a historical row — one whose created_at
 * predates the moment research_signal_global_authorizations (migration
 * 0059) was introduced in this database — is REJECTED here,
 * unconditionally, before any other condition is even evaluated. This
 * is not a batch/automatic check; it fires identically on this exact
 * one-row-at-a-time, explicitly-invoked entrypoint. The clarification
 * determined that Q5-C forbids retroactively applying the Q5-A/Q5-B
 * standard to a historical row at all — individually or in batch —
 * absent a future, separate, explicit PO decision; this function
 * cannot itself make that decision, so it fails closed instead.
 */
export async function authorizeSignalForSharing(
  deps: AuthorizeSignalForSharingDeps,
  input: { signalId: string; authorizedBy: string },
  now: Date,
): Promise<StoredSignalAuthorization> {
  const signal = await deps.signals.getById(input.signalId);
  if (!signal) throw new SignalAuthorizationRejectedError('SIGNAL_NOT_FOUND');

  const historicalCutoffAt = await deps.authorizations.getHistoricalCutoffAt();
  if (!signal.createdAt || signal.createdAt < historicalCutoffAt) {
    throw new SignalAuthorizationRejectedError('HISTORICAL_SIGNAL_INELIGIBLE');
  }

  const floor = evaluateQ5AFloor(signal);
  if (!floor.passes) throw new SignalAuthorizationRejectedError(floor.failureReason!);

  const eligible = await deps.fieldClassification.isFieldPublicEligible(signal.field);
  if (!eligible) throw new SignalAuthorizationRejectedError('FIELD_NOT_PUBLIC_ELIGIBLE');

  return deps.authorizations.insertAuthorization(
    { signalId: input.signalId, authorizedBy: input.authorizedBy },
    now,
  );
}

/**
 * The complete, production-grade Entity/public cross-freelancer read
 * path — Phase G's findByEntity pointers, re-checked against the Q5-A
 * floor (./q5aEvidenceFloor), Phase H's field classification, and this
 * module's own authorization state, all combined through Phase G's
 * UNCHANGED evaluateEntityPublicLookup gate (§6: "do not bypass this
 * abstraction"). Every dependency is re-evaluated against CURRENT state
 * on every call — nothing here trusts a cache hit as a pre-verified
 * authorization (§H "read-time... never trust a previously-cached
 * verdict").
 *
 * NOT CALLED by any production route, worker pipeline, or API handler in
 * this codebase — building this function is Phase I's job; wiring it
 * into an actual cross-freelancer-facing surface is a separate,
 * not-yet-authorized piece of work (no such surface exists today).
 */
export interface EntityPublicLookupProductionDeps {
  cache: ResearchSignalCacheRepository;
  fieldClassification: FieldClassificationRepository;
  authorizations: SignalAuthorizationRepository;
}

export async function lookupEntityPublicSignals(
  deps: EntityPublicLookupProductionDeps,
  entityId: string,
  signalKind: ResearchSourceKind,
  now: Date,
): Promise<SignalCacheLookupResult> {
  const pointers = await deps.cache.findByEntity(entityId, signalKind);

  // Q5-C (read-time, corrected): a historical signal must never be
  // served globally, even if an authorization row somehow already
  // exists for it (e.g. written directly against the repository,
  // bypassing authorizeSignalForSharing's own write-time rejection).
  // This filter is independent of, and runs before, the authorization
  // check below — it does not merely rely on authorizeSignalForSharing
  // having refused to create the row.
  const historicalCutoffAt = await deps.authorizations.getHistoricalCutoffAt();
  const nonHistorical = pointers.filter(
    (signal) => signal.createdAt !== undefined && signal.createdAt >= historicalCutoffAt,
  );

  // Q5-A floor next — cheapest remaining check, and nothing downstream
  // needs to run for a signal that could never qualify regardless of
  // classification or authorization state.
  const floorPassing = nonHistorical.filter((signal) => evaluateQ5AFloor(signal).passes);
  if (floorPassing.length === 0) return { outcome: 'none', freshness: null, signals: [] };

  // Phase H: small, stable reference data — safe to resolve once per
  // distinct field present, not once per signal.
  const fields = [...new Set(floorPassing.map((signal) => signal.field))];
  const eligibleFields = new Set<string>();
  for (const field of fields) {
    if (await deps.fieldClassification.isFieldPublicEligible(field)) eligibleFields.add(field);
  }

  // Phase I: re-checked per signal, every call — an authorization
  // revoked a moment ago must be excluded on THIS call, not merely on
  // some future one (§H read-time re-check).
  const authorizedSignalIds = new Set<string>();
  for (const signal of floorPassing) {
    const authorization = await deps.authorizations.findLatestAuthorization(signal.id);
    if (isAuthorizationActive(authorization)) authorizedSignalIds.add(signal.id);
  }

  return evaluateEntityPublicLookup(floorPassing, signalKind, now, {
    isFieldPublicEligible: (field) => eligibleFields.has(field),
    isAuthorized: (signalId) => authorizedSignalIds.has(signalId),
  });
}
