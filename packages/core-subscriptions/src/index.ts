export {
  CLIENT_FINDER_SUBSCRIPTION_PRODUCT_SLUG,
  findActiveClientFinderSubscriptionPeriod,
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

export {
  CMS_PLAN_INHERITANCE,
  CMS_PLAN_PRODUCT_IDS,
  findActiveCmsPlans,
  permittedContentPlans,
} from './cmsAccess';
export type { CmsAccessDeps, CmsPlanProductId } from './cmsAccess';

export { convertLinkedCmsEntitlementsToSubscriptionPeriods } from './cmsEntitlementConversion';
export type { CmsEntitlementConversionSqlClient } from './cmsEntitlementConversion';

export type { LeadUnlock, LeadUnlockContact, SubscriptionPeriod } from './types';

export { fakeSubscriptionPeriodRepository } from './testing/fakeSubscriptionPeriodRepository';
