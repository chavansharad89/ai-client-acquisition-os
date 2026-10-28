import type { LeadUnlockContact } from '@acos/core-subscriptions';

// Pure view-state resolution for ContactUnlockPanel (₹1,499 Client Finder
// subscription Phase 2, Part 3). Kept side-effect-free and separate from
// the client component so it is unit-testable without a DOM/testing-
// library dependency this app does not otherwise have.
//
// Precedence mirrors @acos/core-subscriptions' unlockOpportunity() exactly
// (IRL-I): an existing unlock is checked BEFORE the subscription state, so
// a permanently unlocked lead stays visible after the subscription that
// unlocked it has since expired.

export type ContactAccessView =
  | { kind: 'UNLOCKED'; contacts: readonly LeadUnlockContact[] }
  | { kind: 'LOCKED_NO_SUBSCRIPTION' }
  | { kind: 'NO_CONTACT_FOUND' }
  | { kind: 'LOCKED_READY' };

export function resolveContactAccessView(input: {
  subscriptionActive: boolean;
  unlockedContacts: readonly LeadUnlockContact[] | null;
  hasQualifyingContact: boolean;
}): ContactAccessView {
  if (input.unlockedContacts !== null) {
    return { kind: 'UNLOCKED', contacts: input.unlockedContacts };
  }
  if (!input.subscriptionActive) return { kind: 'LOCKED_NO_SUBSCRIPTION' };
  if (!input.hasQualifyingContact) return { kind: 'NO_CONTACT_FOUND' };
  return { kind: 'LOCKED_READY' };
}
