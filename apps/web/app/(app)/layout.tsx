import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/app-shell/AppShell';
import { inter } from '@/lib/fonts';
import { currentAccess } from '@/src/server/access';
import { getMaxSubscriptionStatus } from '@/src/server/clientFinderStatus';

import '../../styles/tailwind-foundation.css';

// Isolated Tailwind v4 + shadcn/ui foundation, scoped to the learner
// workspace — same mechanism as app/cms/layout.tsx and
// app/(marketing-v2)/layout.tsx. Existing routes (checkout, dashboard,
// client-finder, marketing, access) are untouched.
//
// Auth gate reuses currentAccess() exactly as /access/[productId]/page.tsx
// already does — read-only, no new authorization logic. An anonymous
// visitor is redirected to login, mirroring the hardcoded
// `?next=` pattern app/cms/layout.tsx's requireCmsAdminForPage() already
// uses for the same purpose.
export const dynamic = 'force-dynamic';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const access = await currentAccess();
  if (!access.granted) {
    redirect('/access/login?next=/home');
  }

  const maxStatus = await getMaxSubscriptionStatus(access.context.userId);

  return (
    <div className={`${inter.variable} font-sans`}>
      <AppShell email={access.context.customerEmail} purchased={access.context.purchased} maxStatus={maxStatus}>
        {children}
      </AppShell>
    </div>
  );
}
