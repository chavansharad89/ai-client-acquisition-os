// CMS domain validation error, mirroring the existing project convention
// for a mutation's input validation -- a typed error class carrying
// {field, reason, message}, matching ServiceProfileValidationError
// (@acos/core-service-profile/src/errors.ts) and FeedbackValidationError
// (@acos/core-opportunity/src/errors.ts) exactly, so a route can map
// `err.field`/`err.reason` into its 400 response without string-matching
// a message. One reusable class covers every CMS validation failure
// (display names and content alike) rather than one class per domain,
// since every failure here is the same shape: "this field's value is
// invalid for this reason."
//
// This is an engineering-consistency fix only -- no validation rule
// changes. displayNameService.ts/contentService.ts threw plain `Error`
// with the same messages before this; this class only adds the
// structured field/reason a route needs.

export type CmsValidationReason =
  | 'blank'
  | 'not-cms-eligible'
  | 'invalid-parent'
  | 'parent-not-container'
  | 'cross-plan-parent';

export class CmsValidationError extends Error {
  readonly field: string;
  readonly reason: CmsValidationReason;

  constructor(field: string, reason: CmsValidationReason, message: string) {
    super(message);
    this.name = 'CmsValidationError';
    this.field = field;
    this.reason = reason;
  }
}
