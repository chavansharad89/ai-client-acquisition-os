import { NextResponse, type NextRequest } from 'next/server';

import { UnauthenticatedError } from '@acos/core-identity';
import {
  FeedbackValidationError,
  getFeedback,
  OpportunityNotFoundError,
  recordFeedback,
  type RecordFeedbackInput,
} from '@acos/core-opportunity';

import { clientFinderRepositories } from '../../../../../src/server/clientFinderRepositories';
import { readSessionToken } from '../../../../../src/server/session';

// POST /api/opportunities/:id/feedback — record useful/not-useful + reason
//      (§9 "the user can provide feedback"; §10 "Feedback works").
// GET  /api/opportunities/:id/feedback — read the caller's own current
//      feedback for this Opportunity, if any.
// -----------------------------------------------------------------------
// Thin HTTP adapter over @acos/core-opportunity.recordFeedback()/
// getFeedback(), unchanged. Ownership is enforced entirely inside those
// functions via deps.opportunities.getById(userId, opportunityId) before
// any Feedback row is touched — this route does not re-derive it.
//
// Deliberately records ONLY the existing supported feedback semantics
// (useful: boolean, reason: string). No contacted/replied/won state is
// introduced — none exists in @acos/core-opportunity's persisted model,
// and inventing one here would add an outcome metric §9 does not
// require and MVP_SCOPE_BOUNDARY.md §6.3 excludes (CRM).
// -----------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const token = readSessionToken(request);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Request body must be valid JSON', code: 'VALIDATION_ERROR' },
      { status: 400 },
    );
  }

  try {
    const { identity, opportunities, feedback } = clientFinderRepositories();
    const stored = await recordFeedback(
      { identity, opportunities, feedback },
      token,
      params.id,
      body as RecordFeedbackInput,
    );
    return NextResponse.json(stored, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    if (err instanceof FeedbackValidationError) {
      return NextResponse.json(
        { error: err.message, code: 'VALIDATION_ERROR', field: err.field, reason: err.reason },
        { status: 400 },
      );
    }
    if (err instanceof OpportunityNotFoundError) {
      // Same not-found-for-unowned-or-missing convention as every other
      // read/write in this codebase (see core-search's "Search ownership"
      // tests) — a cross-user attempt is indistinguishable from a typo.
      return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
    }
    console.error('Unhandled error in POST /api/opportunities/[id]/feedback:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = readSessionToken(request);
  try {
    const { identity, feedback } = clientFinderRepositories();
    const stored = await getFeedback({ identity, feedback }, token, params.id);
    return NextResponse.json(stored, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    console.error('Unhandled error in GET /api/opportunities/[id]/feedback:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
