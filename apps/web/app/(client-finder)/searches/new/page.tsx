import { redirect } from 'next/navigation';

import { ClientFinderNav } from '../../../../src/components/client-finder/ClientFinderNav';
import { NewSearchForm } from '../../../../src/components/client-finder/NewSearchForm';
import { hasSessionCookie } from '../../../../src/server/session';

export const metadata = { title: 'New search — Client Finder' };
export const dynamic = 'force-dynamic';

export default function NewSearchPage() {
  if (!hasSessionCookie()) redirect('/login');

  return (
    <main id="main">
      <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="m-0 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Client Finder
          </p>
          <ClientFinderNav />
          {/* Same "section heading" scale as /opportunities' <h1>. */}
          <h1 className="m-0 text-[20px] font-bold leading-[25px] text-foreground md:text-[22px] md:leading-[28px] lg:text-[length:var(--acos-type-2xl)] lg:leading-[30px]">
            Define what you sell
          </h1>
          <p className="m-0 max-w-[60ch] text-sm text-muted-foreground">
            This is what personalises every downstream step — discovery, research, and which
            opportunities get recommended to you.
          </p>
        </header>
        <NewSearchForm />
      </div>
    </main>
  );
}
