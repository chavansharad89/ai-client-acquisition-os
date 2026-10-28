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
export type {
  AccountSetupInput,
  IdentityRepository,
  StoredCredentials,
  StoredSessionToken,
  StoredUserAuthState,
} from './repository';
export type { StoredUser } from './types';

export { ACTIVATION_TOKEN_TTL_MS, evaluateActivationToken, mintActivationToken } from './activationToken';
export type {
  ActivationTokenRejection,
  ActivationTokenVerdict,
  MintedActivationToken,
  StoredActivationToken,
} from './activationToken';

export {
  buildActivationUrl,
  ConsoleActivationEmailSender,
  createActivationEmailSender,
  EmailProviderNotConfiguredError,
  GmailDevActivationEmailSender,
  GmailDevNotConfiguredError,
  issueActivationLink,
  ResendActivationEmailSender,
  ResendDeliveryError,
  ResendNotConfiguredError,
} from './activationEmail';
export type {
  ActivationEmailMessage,
  ActivationEmailSender,
  GmailDevConfig,
  ResendConfig,
  ResendTransport,
  SmtpTransport,
} from './activationEmail';

// Test fake, exported the same way @acos/core-subscriptions exports
// fakeSubscriptionPeriodRepository from its own main index — consumers
// outside this package (apps/web's activationService tests) need it
// too, and a relative import of ./testSupport from another package is
// not a thing this repo's module boundaries support.
export { fakeRepository } from './testSupport';

export {
  hashPassword,
  MIN_PASSWORD_LENGTH,
  validatePassword,
  verifyPassword,
} from './password';
export type { PasswordValidationError } from './password';

export {
  evaluateSessionToken,
  mintUserSession,
  requireUser,
  resolveSession,
  UnauthenticatedError,
} from './session';
export type { MintedSession, SessionRejection, SessionResolution, SessionVerdict } from './session';
