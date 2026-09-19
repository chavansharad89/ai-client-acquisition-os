// core-service-profile
// -----------------------------------------------------------------------
// Owns: ServiceProfile, the first user-owned Client Finder domain object
// (PRD V2.1 DEC-004). Exactly seven fields; no Search, discovery,
// research, scoring, Opportunity, outreach, CRM or dashboard behaviour
// lives here (see MVP_SCOPE_BOUNDARY.md).
//
// Must NOT: accept a caller-supplied userId anywhere, or persist
// typicalValuePaise (that is @acos/core-acquisition's ServiceRule
// concern, derived from minProjectValuePaise at the adapter boundary).
// -----------------------------------------------------------------------

export { createPgServiceProfileRepository } from './pgRepository';
export type { ServiceProfileRepository } from './repository';
export type { ServiceProfileFields, ServiceProfileInput, StoredServiceProfile } from './types';

export {
  RATIONALE_MAX_LENGTH,
  RULE_FIELD_MAX_ITEMS,
  RULE_ITEM_MAX_LENGTH,
  GEOGRAPHY_MAX_LENGTH,
  SERVICE_MAX_LENGTH,
  TARGET_CUSTOMER_MAX_LENGTH,
  validateServiceProfileInput,
} from './validation';
export { ServiceProfileValidationError } from './errors';
export type { ServiceProfileValidationReason } from './errors';

export {
  createServiceProfile,
  deleteServiceProfile,
  getServiceProfile,
  listServiceProfiles,
  updateServiceProfile,
} from './service';
export type { ServiceProfileDeps } from './service';
