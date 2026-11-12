import { NotCmsAdminError, requireCmsAdmin } from '@acos/core-cms';
import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { redirect } from 'next/navigation';

import { commerceRepositories } from '../server/commerceRepositories';
import { readSessionTokenFromServerComponent } from '../server/session';

// Server-component counterpart to every admin API route's
// `requireUser -> requireCmsAdmin` chain (CMS-PO-006(R3)/CMS-PO-008) —
// same two checks, same repositories, just reading the session cookie
// via the Server Component cookie jar instead of a NextRequest.
//
// Called once in app/cms/layout.tsx (redirect/forbidden gate before the
// shell renders) and again in each page below it (its own data fetch) —
// this duplicates the DB round trip, not the logic; it is the same
// "re-check on every call, never cache membership" shape every existing
// CMS admin route already uses (cmsAdminAuthorization.ts).

export class CmsForbiddenError extends Error {
  constructor() {
    super('not a CMS administrator');
    this.name = 'CmsForbiddenError';
  }
}

export async function requireCmsAdminForPage() {
  const repos = commerceRepositories();

  let userId: string;
  try {
    userId = await requireUser(repos.identity, readSessionTokenFromServerComponent());
  } catch (err) {
    if (err instanceof UnauthenticatedError) {
      redirect('/access/login?next=/cms');
    }
    throw err;
  }

  try {
    await requireCmsAdmin({ cmsAdmins: repos.cmsAdmins }, userId);
  } catch (err) {
    if (err instanceof NotCmsAdminError) {
      throw new CmsForbiddenError();
    }
    throw err;
  }

  return { userId, repos };
}
