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

/**
 * Untrusted shape a caller supplies to replace an existing profile (via
 * updateServiceProfile() — unchanged by CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-
 * ONLY-PO-DEC-001/002/CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-
 * DEC-001). Never carries id/userId. Fully required, exactly
 * ServiceProfileFields's own shape — restored to that original shape per
 * those decisions' engineering correction: a caller creating a NEW profile
 * no longer has a way to supply (or override) the five system-owned
 * fields at all — see {@link NewSearchServiceProfileInput}.
 */
export type ServiceProfileInput = ServiceProfileFields;

/**
 * Untrusted shape a caller supplies to CREATE a NEW profile (via
 * createServiceProfile()). Never carries id/userId, and — deliberately —
 * never carries any of the five system-owned fields (targetCustomer,
 * minProjectValuePaise, triggers, keywords, rationale) either:
 * createServiceProfile() always constructs those itself
 * (./systemDefaults.ts's applySystemServiceProfileDefaults()); a caller
 * has no field name to smuggle a value through, even if it tries (extra
 * JSON properties beyond `service`/`geography` are never read).
 *
 * CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002,
 * CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001 (system-owned-
 * field engineering correction): a NEW search's freelancer-facing input is
 * exactly `service` + `geography`.
 */
export type NewSearchServiceProfileInput = Pick<ServiceProfileFields, 'service' | 'geography'>;

/** A row as persisted. `userId` is always server-derived (DEC-003) — never accepted as input. */
export interface StoredServiceProfile extends ServiceProfileFields {
  id: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}
