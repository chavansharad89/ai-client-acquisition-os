import { NextResponse, type NextRequest } from 'next/server';

import { UnauthenticatedError } from '@acos/core-identity';
import {
  LeadUnlockOpportunityNotFoundError,
  NoActiveClientFinderSubscriptionError,
  NoQualifyingContactError,
  unlockOpportunity,
  type LeadUnlock,
} from '@acos/core-subscriptions';

import { clientFinderRepositories } from '../../../../../src/server/clientFinderRepositories';
import { readSessionToken } from '../../../../../src/server/session';

// POST /api/opportunities/:id/unlock — reveal a lead's contact value(s)
// for an active ₹1,499 Client Finder subscriber (plan §G/§J).
// -----------------------------------------------------------------------
// Thin HTTP adapter over @acos/core-subscriptions.unlockOpportunity(),
// unchanged — mirrors the existing opportunities/[id]/feedback route's
// shape and auth convention exactly (readSessionToken -> service
// function -> typed-error -> HTTP status mapping).
//
// No request body is read: `{}` is the whole contract (plan §G) — there
// is no client-supplied price, amount, or credit count, because there is
// no credit count at all in this commercial model.
// -----------------------------------------------------------------------

function toRevealedContact(contacts: LeadUnlock['contacts']) {
  // Convenience single-value fields for the common case (plan §G's
  // literal response shape) -- the FIRST value found per kind. The
  // `contacts` array below is the authoritative, complete list and is
  // what a caller must use to avoid silently dropping a second value of
  // the same kind (capture spike §8/§13: multiple values per kind are
  // representable and must never be omitted).
  const revealedContact: {
    businessEmail?: string;
    personalEmail?: string;
    uncertainEmail?: string;
    phone?: string;
  } = {};
  for (const contact of contacts) {
    if (contact.kind === 'BUSINESS_EMAIL' && revealedContact.businessEmail === undefined) {
      revealedContact.businessEmail = contact.value;
    } else if (contact.kind === 'PERSONAL_EMAIL' && revealedContact.personalEmail === undefined) {
      revealedContact.personalEmail = contact.value;
    } else if (contact.kind === 'UNCERTAIN_EMAIL' && revealedContact.uncertainEmail === undefined) {
      revealedContact.uncertainEmail = contact.value;
    } else if (contact.kind === 'PHONE' && revealedContact.phone === undefined) {
      revealedContact.phone = contact.value;
    }
  }
  return revealedContact;
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = readSessionToken(request);

  try {
    const { identity, opportunities, prospects, companies, signals, subscriptionPeriods, leadUnlocks } =
      clientFinderRepositories();
    const unlocked = await unlockOpportunity(
      { identity, opportunities, prospects, companies, signals, subscriptionPeriods, leadUnlocks },
      token,
      params.id,
    );
    return NextResponse.json(
      {
        unlocked: true,
        opportunityId: unlocked.opportunityId,
        revealedContact: toRevealedContact(unlocked.contacts),
        contacts: unlocked.contacts,
      },
      { status: 200 },
    );
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    if (err instanceof LeadUnlockOpportunityNotFoundError) {
      // Same not-found-for-unowned-or-missing convention as every other
      // read/write in this codebase.
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    if (err instanceof NoActiveClientFinderSubscriptionError) {
      return NextResponse.json(
        { error: err.message, code: 'NO_ACTIVE_SUBSCRIPTION' },
        { status: 403 },
      );
    }
    if (err instanceof NoQualifyingContactError) {
      return NextResponse.json(
        { error: err.message, code: 'NO_QUALIFYING_CONTACT' },
        { status: 409 },
      );
    }
    console.error('Unhandled error in POST /api/opportunities/[id]/unlock:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
