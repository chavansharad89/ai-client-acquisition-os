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
  /**
   * Canonical contract (resolves OQ-4's "not decided" only as far as
   * representation, not derivation mechanism): each item MUST be one of
   * @acos/core-acquisition's fixed `ResearchSourceKind` values
   * (`WEBSITE`, `JOB_POST`, `LINKEDIN`, `NEWS`, `FUNDING`, `TECH_STACK`,
   * `REVIEW`, `MANUAL`) — NOT free-text business/problem descriptions
   * (e.g. "outdated website"). This is the only representation
   * @acos/core-opportunity's `toServiceRule()` ever matches against a
   * ResearchSignal; anything else can never produce a need/offer match.
   * Enforced by validateServiceProfileInput() in validation.ts.
   */
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
