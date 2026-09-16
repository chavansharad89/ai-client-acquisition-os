/**
 * The seven MVP fields (PRD V2.1 DEC-004): four user-authored (service,
 * targetCustomer, geography, minProjectValuePaise) plus three
 * system-derived rule fields (triggers, keywords, rationale). Deliberately
 * NOT the PRD V2.0 §40 thirteen-field model, and does NOT include
 * typicalValuePaise — see @acos/core-acquisition's ServiceRule, which
 * derives that at the adapter boundary from minProjectValuePaise rather
 * than this type carrying it.
 */
export interface ServiceProfileFields {
  service: string;
  targetCustomer: string;
  geography: string;
  minProjectValuePaise: number;
  triggers: readonly string[];
  keywords: readonly string[];
  rationale: string;
}

/** Untrusted shape a caller supplies to create or replace a profile. Never carries id/userId. */
export type ServiceProfileInput = ServiceProfileFields;

/** A row as persisted. `userId` is always server-derived (DEC-003) — never accepted as input. */
export interface StoredServiceProfile extends ServiceProfileFields {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
