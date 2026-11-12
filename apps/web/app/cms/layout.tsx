import type { ReactNode } from 'react';

import { CmsShell } from '@/components/cms/CmsShell';
import { inter } from '@/lib/fonts';
import { CmsForbiddenError, requireCmsAdminForPage } from '@/src/cms-admin/requireCmsAdminPage';

import '../../styles/tailwind-foundation.css';

// Isolated Tailwind v4 + shadcn/ui foundation, scoped to /cms/* only —
// same mechanism as app/(marketing-v2)/layout.tsx. Existing routes
// (checkout, dashboard, client-finder, marketing) are untouched.
//
// Auth gate: requireUser -> requireCmsAdmin (CMS-PO-006(R3)/CMS-PO-008),
// the same chain every admin API route uses. Unauthenticated visitors
// are redirected to login; an authenticated non-admin sees an inline
// "not authorized" state rather than a redirect loop.
export const dynamic = 'force-dynamic';

export default async function CmsLayout({ children }: { children: ReactNode }) {
  try {
    await requireCmsAdminForPage();
  } catch (err) {
    if (err instanceof CmsForbiddenError) {
      return (
        <div
          className={`${inter.variable} flex min-h-screen items-center justify-center bg-background p-8 font-sans text-foreground`}
        >
          <div className="max-w-sm text-center">
            <h1 className="text-xl font-semibold">Not authorized</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Your account does not have CMS administrator access. Contact an operator if you
              believe this is a mistake.
            </p>
          </div>
        </div>
      );
    }
    throw err;
  }

  return (
    <div className={`${inter.variable} font-sans`}>
      <CmsShell>{children}</CmsShell>
    </div>
  );
}
