import type {
  QualificationEquivalenceCriterionResult,
  QualificationEquivalenceSubject,
  SearchSnapshot,
} from './types';

// One pure function per criterion (mirrors @acos/core-qualification's
// rules.ts shape), each independently fail-soft: a missing subject field
// resolves to 'UNKNOWN', never a thrown error.

function normalise(value: string): string {
  return value.trim().toLowerCase();
}

export function evaluateServiceMatch(
  snapshot: SearchSnapshot,
  subject: QualificationEquivalenceSubject,
): QualificationEquivalenceCriterionResult {
  if (subject.offerService === null) {
    return {
      criterion: 'SERVICE_MATCH',
      satisfied: 'UNKNOWN',
      reason: 'No recommended offer is recorded for this Opportunity yet.',
    };
  }
  const satisfied = normalise(subject.offerService) === normalise(snapshot.service);
  return {
    criterion: 'SERVICE_MATCH',
    satisfied,
    reason: satisfied
      ? `Offer service "${subject.offerService}" matches the Search's service "${snapshot.service}".`
      : `Offer service "${subject.offerService}" does not match the Search's service "${snapshot.service}".`,
  };
}

export function evaluateTargetCustomerMatch(
  snapshot: SearchSnapshot,
  subject: QualificationEquivalenceSubject,
): QualificationEquivalenceCriterionResult {
  if (subject.observedTargetCustomer === null) {
    return {
      criterion: 'TARGET_CUSTOMER_MATCH',
      satisfied: 'UNKNOWN',
      reason: 'No observed target-customer category is recorded for this Opportunity yet.',
    };
  }
  const satisfied = normalise(subject.observedTargetCustomer) === normalise(snapshot.targetCustomer);
  return {
    criterion: 'TARGET_CUSTOMER_MATCH',
    satisfied,
    reason: satisfied
      ? `Observed target customer "${subject.observedTargetCustomer}" matches the Search's "${snapshot.targetCustomer}".`
      : `Observed target customer "${subject.observedTargetCustomer}" does not match the Search's "${snapshot.targetCustomer}".`,
  };
}

export function evaluateMinimumValueMatch(
  snapshot: SearchSnapshot,
  subject: QualificationEquivalenceSubject,
): QualificationEquivalenceCriterionResult {
  if (subject.offerEstimatedValuePaise === null) {
    return {
      criterion: 'MINIMUM_VALUE_MATCH',
      satisfied: 'UNKNOWN',
      reason: 'No estimated offer value is recorded for this Opportunity yet.',
    };
  }
  const satisfied = subject.offerEstimatedValuePaise >= snapshot.minProjectValuePaise;
  return {
    criterion: 'MINIMUM_VALUE_MATCH',
    satisfied,
    reason: satisfied
      ? `Estimated value ${subject.offerEstimatedValuePaise} paise meets the Search's minimum ${snapshot.minProjectValuePaise} paise.`
      : `Estimated value ${subject.offerEstimatedValuePaise} paise is below the Search's minimum ${snapshot.minProjectValuePaise} paise.`,
  };
}
