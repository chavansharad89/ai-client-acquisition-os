export type CreateOpportunityValidationReason = 'required' | 'too-long';

/** Thrown by validateCreateOpportunityInput() for any untrusted value that fails validation. */
export class CreateOpportunityValidationError extends Error {
  readonly field: string;
  readonly reason: CreateOpportunityValidationReason;

  constructor(field: string, reason: CreateOpportunityValidationReason, message: string) {
    super(message);
    this.name = 'CreateOpportunityValidationError';
    this.field = field;
    this.reason = reason;
  }
}

/** Thrown by createOpportunity()/getOpportunity() when `prospectId`/`id` does not resolve to a row owned by the caller. */
export class OpportunityProspectNotFoundError extends Error {
  readonly prospectId: string;

  constructor(prospectId: string) {
    super(`prospect not found: ${prospectId}`);
    this.name = 'OpportunityProspectNotFoundError';
    this.prospectId = prospectId;
  }
}

/** Thrown by getOpportunity() when `id` does not resolve to an Opportunity owned by the caller. */
export class OpportunityNotFoundError extends Error {
  readonly opportunityId: string;

  constructor(opportunityId: string) {
    super(`opportunity not found: ${opportunityId}`);
    this.name = 'OpportunityNotFoundError';
    this.opportunityId = opportunityId;
  }
}

export type FeedbackValidationReason = 'required' | 'too-long' | 'not-boolean';

/** Thrown by validateRecordFeedbackInput() for any untrusted value that fails validation. */
export class FeedbackValidationError extends Error {
  readonly field: string;
  readonly reason: FeedbackValidationReason;

  constructor(field: string, reason: FeedbackValidationReason, message: string) {
    super(message);
    this.name = 'FeedbackValidationError';
    this.field = field;
    this.reason = reason;
  }
}
