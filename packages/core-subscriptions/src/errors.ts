/** Thrown by unlockOpportunity()/unlockOpportunityForOwner() when `opportunityId` does not resolve to an Opportunity owned by the caller. */
export class LeadUnlockOpportunityNotFoundError extends Error {
  readonly opportunityId: string;

  constructor(opportunityId: string) {
    super(`opportunity not found: ${opportunityId}`);
    this.name = 'LeadUnlockOpportunityNotFoundError';
    this.opportunityId = opportunityId;
  }
}

/**
 * Thrown when the caller holds no active ₹1,499 Client Finder
 * subscription period and no pre-existing permanent unlock covers the
 * opportunity in question (access-model decision §5.5; plan §I scenario 8).
 */
export class NoActiveClientFinderSubscriptionError extends Error {
  constructor() {
    super('no active Client Finder subscription');
    this.name = 'NoActiveClientFinderSubscriptionError';
  }
}

/**
 * Thrown by unlockOpportunity()/unlockOpportunityForOwner() when the
 * opportunity has no K1-qualifying contact channel
 * (BUSINESS_EMAIL/PERSONAL_EMAIL/UNCERTAIN_EMAIL/PHONE) to reveal.
 * Target-customer match is deliberately NOT part of this check (plan
 * §G, CLIENT_FINDER_1499_OPPORTUNITY_ELIGIBILITY_PO_DECISION.md §7). No
 * `lead_unlocks` row is written when this is thrown.
 */
export class NoQualifyingContactError extends Error {
  readonly opportunityId: string;

  constructor(opportunityId: string) {
    super(`no qualifying contact channel for opportunity: ${opportunityId}`);
    this.name = 'NoQualifyingContactError';
    this.opportunityId = opportunityId;
  }
}

/** Thrown when a lead_unlocks row disappears between a conflicting insert and the self-heal re-read (should not happen; unlocks are never deleted). */
export class LeadUnlockPersistenceError extends Error {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'LeadUnlockPersistenceError';
    if (cause !== undefined) this.cause = cause;
  }
}
