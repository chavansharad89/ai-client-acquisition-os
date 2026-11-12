import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';

import { AppShell } from '@/components/app-shell/AppShell';
import { inter } from '@/lib/fonts';
import { currentAccess } from '@/src/server/access';
import { getMaxSubscriptionStatus } from '@/src/server/clientFinderStatus';

import '../../../styles/tailwind-foundation.css';

// Same chrome/auth pattern as app/(client-finder)/opportunities/layout.tsx
// — see that file's doc comment for why currentAccess() is safe here and
// never locks out a Client-Finder-only account. Covers both
// searches/new/page.tsx and searches/[id]/page.tsx.
export const dynamic = 'force-dynamic';

export default async function SearchesLayout({ children }: { children: ReactNode }) {
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
