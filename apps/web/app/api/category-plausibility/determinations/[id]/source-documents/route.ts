import { NextResponse, type NextRequest } from 'next/server';

import { UnauthenticatedError } from '@acos/core-identity';
import { listSourceDocumentsForReview } from '@acos/core-research';

import { clientFinderRepositories } from '../../../../../../src/server/clientFinderRepositories';
import { readSessionToken } from '../../../../../../src/server/session';

// GET /api/category-plausibility/determinations/:id/source-documents
// -----------------------------------------------------------------------
// Q-1 reviewer read path: the caller's own persisted A11-P1 M-2 source
// documents for one category-plausibility determination, exactly as
// stored (source_text untouched). Thin HTTP adapter over
// @acos/core-research.listSourceDocumentsForReview(); identity comes from
// the session cookie only, and ownership is enforced inside that call.
// An unowned or missing determination returns [] — indistinguishable,
// as with GET /api/opportunities/:id/feedback. Read-only: no POST.
// -----------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const token = readSessionToken(request);
  try {
    const { identity, categoryPlausibility } = clientFinderRepositories();
    const documents = await listSourceDocumentsForReview({ identity, categoryPlausibility }, token, params.id);
    return NextResponse.json(documents, { status: 200 });
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      return NextResponse.json({ error: 'Unauthenticated', code: err.reason }, { status: 401 });
    }
    console.error('Unhandled error in GET /api/category-plausibility/determinations/[id]/source-documents:', err);
    return NextResponse.json({ error: 'Internal error', code: 'UNKNOWN_ERROR' }, { status: 500 });
  }
}
