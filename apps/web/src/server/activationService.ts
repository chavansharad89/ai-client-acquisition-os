import { hashAccessToken } from '@acos/core-entitlements';
import {
  evaluateActivationToken,
  hashPassword,
  issueActivationLink,
  mintUserSession,
  validatePassword,
  type ActivationEmailSender,
  type IdentityRepository,
  type MintedSession,
} from '@acos/core-identity';
import { findActiveClientFinderSubscriptionPeriod } from '@acos/core-subscriptions';
import type { SubscriptionPeriodRepository } from '@acos/core-subscriptions';

// AUTH Phase 2 — ₹1,499 Client Finder activation service.
// -----------------------------------------------------------------------
// Composes @acos/core-identity (activation tokens, user/session state)
// with @acos/core-subscriptions' Phase 0 shared gate
// (findActiveClientFinderSubscriptionPeriod) for subscription
// eligibility. Lives here, in apps/web, rather than inside either core
// package: core-identity's own header explicitly forbids it deciding
// product access ("Must NOT: read entitlements, decide product
// access"), and core-subscriptions has no reason to depend on
// core-identity's token/session primitives. apps/web already composes
// both packages elsewhere (clientFinderRepositories.ts) — this file is
// the same kind of composition, scoped to activation.
//
// SCOPE (this phase, per authorization): ₹1,499 Client Finder
// subscription ONLY. Eligibility is exactly "does an active
// subscription_periods row exist for this user" — no ₹99/₹499
// entitlements leg. AUTH_PHASE_1_PURCHASE_IDENTITY_ACTIVATION_DESIGN.md
// §5/§9 describes an eventual OR-across-products eligibility check for
// full AUTH-PO-27/30 unification; that is explicitly NOT this phase's
// authorization ("Do NOT implement the broader ₹99/₹499 unified
// onboarding conversion yet").
// -----------------------------------------------------------------------

export interface ActivationDeps {
  identity: IdentityRepository;
  subscriptionPeriods: SubscriptionPeriodRepository;
}

/**
 * The Phase 0 shared gate, called directly — never re-derived. This IS
 * `isEligibleForActivation` for this phase's ₹1,499-only scope (design
 * §5's full definition also ORs an `entitlements` check for ₹99/₹499,
 * which is out of scope here).
 */
export async function isEligibleForClientFinderActivation(
  deps: Pick<ActivationDeps, 'subscriptionPeriods'>,
  userId: string,
  now: Date,
): Promise<boolean> {
  const active = await findActiveClientFinderSubscriptionPeriod(
    { subscriptionPeriods: deps.subscriptionPeriods },
    userId,
    now,
  );
  return active !== null;
}

/**
 * Mints + sends a new activation link for `userId`/`email`, but ONLY
 * when currently eligible — never sends a link for a purchase that has
 * no active period (design §5: "don't even send a link for an
 * ineligible purchase"). Callers that want the generic
 * enumeration-safe response regardless of outcome (the
 * activation/request endpoint) call this and ignore whether it actually
 * sent anything.
 */
export async function maybeIssueClientFinderActivationLink(
  deps: ActivationDeps,
  sender: ActivationEmailSender,
  input: { userId: string; email: string; baseUrl: string },
  now: Date = new Date(),
): Promise<boolean> {
  const eligible = await isEligibleForClientFinderActivation(deps, input.userId, now);
  if (!eligible) return false;
  await issueActivationLink(deps.identity, sender, input, now);
  return true;
}

/**
 * Finds the user for `email` (if any) and issues an activation link only
 * when they currently hold an active ₹1,499 subscription. Never throws
 * on "no such user" / "not eligible" — the caller (activation/request
 * route) returns the SAME generic response in every case (design §5/§11
 * enumeration protection); this function's boolean return is for
 * logging/metrics only, never for shaping the HTTP response.
 */
export async function requestClientFinderActivation(
  deps: ActivationDeps,
  sender: ActivationEmailSender,
  input: { email: string; baseUrl: string },
  now: Date = new Date(),
): Promise<boolean> {
  const user = await deps.identity.findUserByEmail(input.email);
  if (!user) return false;
  return maybeIssueClientFinderActivationLink(
    deps,
    sender,
    { userId: user.id, email: user.email, baseUrl: input.baseUrl },
    now,
  );
}

export type AccountSetupFields = {
  firstName: string;
  lastName: string;
  phone: string;
  password: string;
  dateOfBirth?: Date;
};

export type ConsumeActivationResult =
  /**
   * Covers unknown / expired / already-consumed / superseded / now-
   * ineligible — deliberately ONE outcome. The route must map every one
   * of these to the identical generic rejection (design §5: the specific
   * reason is itself a signal and must never reach the client).
   */
  | { status: 'rejected' }
  /** The token was genuinely valid and eligible, but required account-setup fields were missing/invalid. Not an enumeration risk — only the token holder reaches this branch. */
  | { status: 'validation-error'; issue: string }
  | { status: 'ok'; userId: string; email: string; session: MintedSession };

/**
 * Consumes an activation token (design §4 steps 7-8, §14 invariants
 * 1-17). Ordering matches the design exactly: hash -> lookup -> evaluate
 * -> atomic single-use consume -> LIVE eligibility re-check (AUTH-PO-21/
 * 22: a token can be structurally valid but the subscription may have
 * since lapsed) -> email_verified_at -> branch on password_hash IS NULL
 * -> mint session.
 */
export async function consumeClientFinderActivation(
  deps: ActivationDeps,
  rawToken: string,
  setup: Partial<AccountSetupFields> | undefined,
  now: Date = new Date(),
): Promise<ConsumeActivationResult> {
  const tokenHash = hashAccessToken(rawToken);
  const stored = await deps.identity.findActivationToken(tokenHash);
  const verdict = evaluateActivationToken(stored, now);
  if (!verdict.valid) return { status: 'rejected' };

  // Single-use gate: the database decides the one winner under
  // concurrent attempts, not a read-then-write race here.
  const consumed = await deps.identity.consumeActivationToken(tokenHash, now);
  if (!consumed) return { status: 'rejected' };

  // AUTH-PO-21/22: re-check live, even though the token itself was
  // structurally valid — the subscription it was issued for may have
  // ended in the window between mint and click.
  const eligible = await isEligibleForClientFinderActivation(deps, verdict.userId, now);
  if (!eligible) return { status: 'rejected' };

  await deps.identity.setEmailVerified(verdict.userId, now);

  const authState = await deps.identity.findUserAuthStateById(verdict.userId);
  if (!authState) return { status: 'rejected' };

  if (authState.passwordHash === null) {
    // AUTH-PO-03/09/17: a dormant row (first-time purchaser, or a second
    // purchase before the first was ever activated) requires profile +
    // password setup. An existing-password account (handled below, by
    // simply skipping this branch) never reaches any of this, and any
    // password/profile field it sent is ignored, never hashed, never
    // written.
    const firstName = setup?.firstName?.trim() ?? '';
    const lastName = setup?.lastName?.trim() ?? '';
    const phone = setup?.phone?.trim() ?? '';
    const password = setup?.password ?? '';

    if (!firstName || firstName.length > 200) {
      return { status: 'validation-error', issue: 'A valid firstName is required' };
    }
    if (!lastName || lastName.length > 200) {
      return { status: 'validation-error', issue: 'A valid lastName is required' };
    }
    if (!phone || phone.length > 32) {
      return { status: 'validation-error', issue: 'A valid phone is required' };
    }
    const passwordIssue = validatePassword(password);
    if (passwordIssue) {
      return {
        status: 'validation-error',
        issue: `Password is ${passwordIssue === 'too-short' ? 'too short' : 'too long'}`,
      };
    }

    const passwordHash = await hashPassword(password);
    // Atomic WHERE password_hash IS NULL — AUTH-PO-09. A lost race here
    // (another request set the password a moment earlier) is not an
    // error: the row now has SOME password, which is the invariant this
    // guards; proceed to mint a session for the now-activated identity.
    await deps.identity.completeAccountSetup(
      verdict.userId,
      {
        passwordHash,
        firstName,
        lastName,
        phone,
        ...(setup?.dateOfBirth ? { dateOfBirth: setup.dateOfBirth } : {}),
      },
      now,
    );
  }

  const minted = await mintUserSession(deps.identity, { id: authState.id, email: authState.email });
  return { status: 'ok', userId: authState.id, email: authState.email, session: minted };
}
