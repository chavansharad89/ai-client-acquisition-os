export {
  CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG,
  getClientFinderSubscriptionStatus,
  hasClientFinderAccess,
  requireClientFinderAccess,
} from './access';
export type { ClientFinderAccessDeps, ClientFinderSubscriptionStatus } from './access';

export {
  LeadUnlockOpportunityNotFoundError,
  LeadUnlockPersistenceError,
  NoActiveClientFinderSubscriptionError,
  NoQualifyingContactError,
} from './errors';

export { createPgLeadUnlockRepository } from './leadUnlockRepository';
export type { LeadUnlockRepository, SqlClient as LeadUnlockSqlClient, SqlPool as LeadUnlockSqlPool } from './leadUnlockRepository';

export { unlockOpportunity, unlockOpportunityForOwner } from './leadUnlockService';
export type { LeadUnlockDeps } from './leadUnlockService';

export { createPgSubscriptionPeriodRepository } from './subscriptionPeriodRepository';
export type {
  SqlClient as SubscriptionPeriodSqlClient,
  SubscriptionPeriodRepository,
} from './subscriptionPeriodRepository';

export type { LeadUnlock, LeadUnlockContact, SubscriptionPeriod } from './types';
