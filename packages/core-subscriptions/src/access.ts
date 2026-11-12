import { NoActiveClientFinderSubscriptionError } from './errors';
import type { LeadUnlockRepository } from './leadUnlockRepository';
import type { SubscriptionPeriodRepository } from './subscriptionPeriodRepository';
import type { SubscriptionPeriod } from './types';

// The Client Finder access gate (plan §I) -- did not exist before this
// feature (no code anywhere checked "does this user hold an active
// ₹1,499 subscription" prior to Revision 5's implementation).
// -----------------------------------------------------------------------
// A pure boolean check, deliberately with no balance/credit dimension
// (access-model decision §6/§11): either the user holds a currently
// active subscription_periods row, or -- for one specific opportunity --
// a pre-existing permanent lead_unlocks row already covers it (IRL-I:
// a permanently unlocked lead stays visible regardless of later
// subscription expiry). Enforced server-side only; a frontend-only check
// is explicitly insufficient and not proposed anywhere in this plan.
// -----------------------------------------------------------------------

export const CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG = 'ai_client_acquisition_1499_subscription';

export interface ClientFinderAccessDeps {
  subscriptionPeriods: SubscriptionPeriodRepository;
  leadUnlocks: LeadUnlockRepository;
}

/**
 * The one place `findActiveForUser` is called for the Client Finder
 * subscription slug. `hasClientFinderAccess`, `getClientFinderSubscriptionStatus`,
 * and leadUnlockService's `unlockOpportunityForOwner` (the actual
 * contact-unlock write path) all resolve through this function instead of
 * each independently re-querying -- previously they did not, which is the
 * split-brain risk AUTH_COMMERCIAL_IMPLEMENTATION_IMPACT_AUDIT.md §15 item 1
 * flagged: a future entitlement change landed in only one call site could
 * make the read path (page gating/status badge) and the write path
 * (unlock) disagree about who has access.
 */
export async function findActiveClientFinderSubscriptionPeriod(
  deps: Pick<ClientFinderAccessDeps, 'subscriptionPeriods'>,
  userId: string,
  now: Date,
): Promise<SubscriptionPeriod | null> {
  return deps.subscriptionPeriods.findActiveForUser(userId, CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG, now);
}

/**
 * True when the user may perform a Client Finder subscriber-only action
 * (currently: unlock). `opportunityId`, when given, additionally admits
 * a user who has no active subscription today but already holds a
 * permanent unlock for that exact opportunity (plan §I scenario 7) --
 * omit it for a check that is not about one specific opportunity (e.g. a
 * future "does this user have all-tier browsing" check).
 */
export async function hasClientFinderAccess(
  deps: ClientFinderAccessDeps,
  userId: string,
  opportunityId: string | null = null,
  now: Date = new Date(),
): Promise<boolean> {
  const active = await findActiveClientFinderSubscriptionPeriod(deps, userId, now);
  if (active) return true;

  if (opportunityId !== null) {
    const existingUnlock = await deps.leadUnlocks.findByUserAndOpportunity(userId, opportunityId);
    if (existingUnlock) return true;
  }

  return false;
}

/** Throws {@link NoActiveClientFinderSubscriptionError} when {@link hasClientFinderAccess} would return false. */
export async function requireClientFinderAccess(
  deps: ClientFinderAccessDeps,
  userId: string,
  opportunityId: string | null = null,
  now: Date = new Date(),
): Promise<void> {
  const granted = await hasClientFinderAccess(deps, userId, opportunityId, now);
  if (!granted) throw new NoActiveClientFinderSubscriptionError();
}

export interface ClientFinderSubscriptionStatus {
  active: boolean;
  /** `activationAt + durationDays` of the active period, or null when inactive. Computed, never stored (IRL-O). */
  expiresAt: Date | null;
  /** The active period's own snapshotted duration, or null when inactive. */
  durationDays: number | null;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Read-only status for GET /api/subscriptions/status (plan §J). Reports no credit/balance field — there is none (access-model decision §6/§11). */
export async function getClientFinderSubscriptionStatus(
  deps: Pick<ClientFinderAccessDeps, 'subscriptionPeriods'>,
  userId: string,
  now: Date = new Date(),
): Promise<ClientFinderSubscriptionStatus> {
  const active = await findActiveClientFinderSubscriptionPeriod(deps, userId, now);
  if (!active) return { active: false, expiresAt: null, durationDays: null };
  return {
    active: true,
    expiresAt: new Date(active.activationAt.getTime() + active.durationDays * MS_PER_DAY),
    durationDays: active.durationDays,
  };
}
