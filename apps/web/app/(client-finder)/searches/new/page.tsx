import { redirect } from 'next/navigation';

import { NewSearchForm } from '../../../../src/components/client-finder/NewSearchForm';
import { hasSessionCookie } from '../../../../src/server/session';

export const metadata = { title: 'New search — Client Finder' };
export const dynamic = 'force-dynamic';

export default function NewSearchPage() {
  if (!hasSessionCookie()) redirect('/login');

  return (
    <main id="main" className="shell">
      <header>
        <p className="eyebrow">Client Finder</p>
        <h1 className="page-title">Define what you sell</h1>
        <p className="lede">
          This is what personalises every downstream step — discovery, research, and which
          opportunities get recommended to you.
        </p>
      </header>
      <NewSearchForm />
    </main>
  );
}
