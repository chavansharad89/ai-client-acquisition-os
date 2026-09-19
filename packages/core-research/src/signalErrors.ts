// Errors for the Research Foundation's persistence/service boundary
// (./service, ./validation) — distinct from ./errors.ts, which belongs
// to the existing AI research engine (model call failures, schema
// validation of its output).

export type RunResearchValidationReason = 'required' | 'too-long';

/** Thrown by validateRunResearchInput() for any untrusted value that fails validation. */
export class RunResearchValidationError extends Error {
  readonly field: string;
  readonly reason: RunResearchValidationReason;

  constructor(field: string, reason: RunResearchValidationReason, message: string) {
    super(message);
    this.name = 'RunResearchValidationError';
    this.field = field;
    this.reason = reason;
  }
}

/** Thrown by runResearch()/listResearchSignals() when `prospectId` does not resolve to a Prospect owned by the caller. */
export class ResearchProspectNotFoundError extends Error {
  readonly prospectId: string;

  constructor(prospectId: string) {
    super(`prospect not found: ${prospectId}`);
    this.name = 'ResearchProspectNotFoundError';
    this.prospectId = prospectId;
  }
}
