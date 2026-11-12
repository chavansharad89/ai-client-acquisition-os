import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/app-shell/AppShell';
import { inter } from '@/lib/fonts';
import { currentAccess } from '@/src/server/access';
import { getMaxSubscriptionStatus } from '@/src/server/clientFinderStatus';

import '../../../styles/tailwind-foundation.css';

// Gives the Client Finder opportunities list and opportunity-detail pages
// the same Sidebar/Header chrome as /home and /access — same mechanism as
// app/(app)/layout.tsx. Covers both opportunities/page.tsx and
// opportunities/[id]/page.tsx (a layout cascades to nested routes).
//
// currentAccess() is the exact same acos_session cookie Client Finder's
// own readSessionTokenFromServerComponent()/requireUser() checks already
// read (see access.ts's own doc comment: "the same core-identity session
// mechanism Client Finder already uses") — not a second, different
// session system. It returns granted: true with purchased: [] for a
// Client-Finder-only account with no Plus/Pro/Max entitlement, matching
// the existing PO decision that opportunity browsing stays open to every
// Client Finder user regardless of subscription — so this gate never
// locks out a visitor the page itself would have let through. The page's
// own auth check is unchanged and still runs underneath.
export const dynamic = 'force-dynamic';

export default async function OpportunitiesLayout({ children }: { children: ReactNode }) {
  const access = await currentAccess();
  if (!access.granted) {
    redirect('/login');
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
