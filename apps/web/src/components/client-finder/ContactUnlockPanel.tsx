'use client';

import type { LeadUnlockContact } from '@acos/core-subscriptions';
import Link from 'next/link';
import { useCallback, useState } from 'react';

import { CLIENT_FINDER_SUBSCRIPTION_PRODUCT_ID } from '../../checkout/types';

import { resolveContactAccessView } from './contactAccess';

// ₹1,499 Client Finder subscription — Opportunity contact-access section
// (Phase 2, Part 3). Thin HTTP client over the EXISTING, unmodified
// POST /api/opportunities/:id/unlock — this component adds no business
// logic of its own (view-state branching lives in contactAccess.ts,
// unit-tested separately). The server always decides eligibility and
// subscription state; a non-subscriber never sees an "Unlock" control
// that would call the API only to be told no.
//
// The product slug comes from checkout/types.ts's own client-safe
// constant, not from `@acos/core-subscriptions` (whose barrel re-exports
// `leadUnlockService.ts` -> `@acos/core-research` -> jsdom, which webpack
// cannot resolve for a browser bundle) — same reasoning CheckoutPanel.tsx
// already documents for `CLIENT_FINDER_SUBSCRIPTION_PRODUCT_ID`. Only the
// `LeadUnlockContact` type is imported from the package, which is erased
// at compile time and pulls in no runtime module.
// -----------------------------------------------------------------------

const CONTACT_LABELS: Record<LeadUnlockContact['kind'], string> = {
  BUSINESS_EMAIL: 'Business email',
  PERSONAL_EMAIL: 'Personal email',
  UNCERTAIN_EMAIL: 'Email (uncertain)',
  PHONE: 'Phone',
};

export function ContactUnlockPanel({
  opportunityId,
  subscriptionActive,
  initialUnlockedContacts,
  hasQualifyingContact,
}: {
  opportunityId: string;
  subscriptionActive: boolean;
  initialUnlockedContacts: readonly LeadUnlockContact[] | null;
  hasQualifyingContact: boolean;
}) {
  const [contacts, setContacts] = useState<readonly LeadUnlockContact[] | null>(initialUnlockedContacts);
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const unlock = useCallback(async () => {
    setStatus('busy');
    setError(null);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/unlock`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const body = (await response.json().catch(() => null)) as
        | { contacts?: readonly LeadUnlockContact[]; error?: string }
        | null;
      if (!response.ok) {
        setError(body?.error ?? 'Could not unlock this contact.');
        setStatus('error');
        return;
      }
      // The full `contacts` array is the authoritative list (route's own
      // convention) — never just the convenience single-value fields, so
      // a second value of the same kind is never silently dropped.
      setContacts(body?.contacts ?? []);
      setStatus('idle');
    } catch {
      setError('Could not reach the server. Try again.');
      setStatus('error');
    }
  }, [opportunityId]);

  const view = resolveContactAccessView({
    subscriptionActive,
    unlockedContacts: contacts,
    hasQualifyingContact,
  });

  return (
    <section className="card">
      <h2>Contact access</h2>

      {view.kind === 'UNLOCKED' ? (
        <>
          <p className="status status-good">Unlocked</p>
          {view.contacts.length === 0 ? (
            <p>No contact channels were captured for this unlock.</p>
          ) : (
            <ul>
              {view.contacts.map((contact, index) => (
                <li key={`${contact.kind}-${index}`}>
                  {CONTACT_LABELS[contact.kind]}: {contact.value}
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}

      {view.kind === 'LOCKED_NO_SUBSCRIPTION' ? (
        <>
          <p>Contact information is available for this opportunity.</p>
          <p className="hint">
            An active ₹1,499 Client Finder subscription is required to unlock it.
          </p>
          <Link className="btn btn-primary" href={`/checkout/${CLIENT_FINDER_SUBSCRIPTION_PRODUCT_ID}`}>
            Subscribe for ₹1,499/month
          </Link>
        </>
      ) : null}

      {view.kind === 'NO_CONTACT_FOUND' ? (
        <p>No contact details were found in the research evidence for this opportunity.</p>
      ) : null}

      {view.kind === 'LOCKED_READY' ? (
        <>
          <p>Contact information is available for this opportunity.</p>
          {error ? (
            <p className="field-error" role="alert">
              {error}
            </p>
          ) : null}
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => void unlock()}
            disabled={status === 'busy'}
          >
            {status === 'busy' ? 'Unlocking…' : 'Unlock Contact'}
          </button>
        </>
      ) : null}
    </section>
  );
}
