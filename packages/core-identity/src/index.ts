// core-identity
// -----------------------------------------------------------------------
// Owns: who the authenticated user is (R-01, R-02). Never product access
// (that is core-entitlements) and never payment (that is core-payments).
// Must NOT: read `entitlements`, decide product access, or accept a
// caller-supplied userId anywhere.
//
// IDENTITY ≠ ENTITLEMENT ≠ PAYMENT (PRD V2.1, DEC-002): three separate
// concepts, three separate mechanisms. This package and core-entitlements
// both read/write `access_tokens`, but on disjoint columns — this one
// only ever touches `user_id`; every other column stays
// core-entitlements' concern. See migration 0012.
// -----------------------------------------------------------------------

export { createPgIdentityRepository } from './pgRepository';
export type { IdentityRepository, StoredSessionToken } from './repository';
export type { StoredUser } from './types';

export {
  evaluateSessionToken,
  mintUserSession,
  requireUser,
  resolveSession,
  UnauthenticatedError,
} from './session';
export type { MintedSession, SessionRejection, SessionResolution, SessionVerdict } from './session';
