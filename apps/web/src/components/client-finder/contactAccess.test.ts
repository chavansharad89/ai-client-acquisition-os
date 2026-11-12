import { describe, expect, it } from 'vitest';

import { resolveContactAccessView } from './contactAccess';

describe('resolveContactAccessView', () => {
  it('shows UNLOCKED when a prior unlock already exists, even without an active subscription', () => {
    const contacts = [{ kind: 'PHONE' as const, value: '9876543210' }];
    expect(
      resolveContactAccessView({ subscriptionActive: false, unlockedContacts: contacts, hasQualifyingContact: true }),
    ).toEqual({ kind: 'UNLOCKED', contacts });
  });

  it('shows LOCKED_NO_SUBSCRIPTION for a non-subscriber with no prior unlock', () => {
    expect(
      resolveContactAccessView({ subscriptionActive: false, unlockedContacts: null, hasQualifyingContact: true }),
    ).toEqual({ kind: 'LOCKED_NO_SUBSCRIPTION' });
  });

  it('shows NO_CONTACT_FOUND for an active subscriber when no qualifying contact exists', () => {
    expect(
      resolveContactAccessView({ subscriptionActive: true, unlockedContacts: null, hasQualifyingContact: false }),
    ).toEqual({ kind: 'NO_CONTACT_FOUND' });
  });

  it('shows LOCKED_READY for an active subscriber with a qualifying contact not yet unlocked', () => {
    expect(
      resolveContactAccessView({ subscriptionActive: true, unlockedContacts: null, hasQualifyingContact: true }),
    ).toEqual({ kind: 'LOCKED_READY' });
  });

  it('prefers UNLOCKED over NO_CONTACT_FOUND when an unlock exists but hasQualifyingContact is now false', () => {
    const contacts = [{ kind: 'BUSINESS_EMAIL' as const, value: 'owner@acme.com' }];
    expect(
      resolveContactAccessView({ subscriptionActive: true, unlockedContacts: contacts, hasQualifyingContact: false }),
    ).toEqual({ kind: 'UNLOCKED', contacts });
  });

  it('treats an empty (but non-null) unlocked-contacts array as UNLOCKED, not LOCKED_READY', () => {
    expect(
      resolveContactAccessView({ subscriptionActive: true, unlockedContacts: [], hasQualifyingContact: true }),
    ).toEqual({ kind: 'UNLOCKED', contacts: [] });
  });
});
