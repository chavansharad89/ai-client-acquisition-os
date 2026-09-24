import { notFound, redirect } from 'next/navigation';

import { UnauthenticatedError } from '@acos/core-identity';
import { getSearch } from '@acos/core-search';

import { SearchStatusPoller } from '../../../../src/components/client-finder/SearchStatusPoller';
import { clientFinderRepositories } from '../../../../src/server/clientFinderRepositories';
import { readSessionTokenFromServerComponent } from '../../../../src/server/session';

export const metadata = { title: 'Search status — Client Finder' };
export const dynamic = 'force-dynamic';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Queued',
  RUNNING: 'Running',
  COMPLETE: 'Complete',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

const STATUS_CLASS: Record<string, string> = {
  PENDING: 'status-pending',
  RUNNING: 'status-busy',
  COMPLETE: 'status-good',
  FAILED: 'status-error',
  CANCELLED: 'status-error',
};

export default async function SearchStatusPage({ params }: { params: { id: string } }) {
  const token = readSessionTokenFromServerComponent();
  if (!token) redirect('/login');

  const { identity, profiles, searches } = clientFinderRepositories();

  let search;
  try {
    search = await getSearch({ identity, profiles, searches }, token, params.id);
  } catch (err) {
    if (err instanceof UnauthenticatedError) redirect('/login');
    throw err;
  }

  // getSearch() returns null both when the id does not exist and when it
  // belongs to a different user — the same not-found convention every
  // other read in this codebase uses (see core-search's "Search
  // ownership" integration tests). A 404 is the only honest response:
  // distinguishing the two cases would leak which ids exist.
  if (!search) notFound();

  return (
    <main id="main" className="shell">
      <SearchStatusPoller status={search.status} />
      <header>
        <p className="eyebrow">Client Finder</p>
        <h1 className="page-title">Search status</h1>
      </header>

      <section className="card">
        <p className={`status ${STATUS_CLASS[search.status] ?? ''}`}>
          <strong>{STATUS_LABEL[search.status] ?? search.status}</strong>
        </p>
        <dl className="summary">
          <div className="row">
            <dt>Service</dt>
            <dd>{search.parameters.service}</dd>
          </div>
          <div className="row">
            <dt>Target customer</dt>
            <dd>{search.parameters.targetCustomer}</dd>
          </div>
          <div className="row">
            <dt>Geography</dt>
            <dd>{search.parameters.geography}</dd>
          </div>
          <div className="row">
            <dt>Attempts</dt>
            <dd>{search.attempts}</dd>
          </div>
          <div className="row">
            <dt>Started</dt>
            <dd>{search.createdAt.toLocaleString()}</dd>
          </div>
          <div className="row">
            <dt>Updated</dt>
            <dd>{search.updatedAt.toLocaleString()}</dd>
          </div>
        </dl>
        {search.status === 'FAILED' && search.lastError ? (
          <p className="field-error">{search.lastError}</p>
        ) : null}
      </section>

      {search.status === 'COMPLETE' ? (
        <a href="/opportunities" className="btn btn-primary">
          View opportunities
        </a>
      ) : null}
      {search.status === 'PENDING' || search.status === 'RUNNING' ? (
        <p className="hint">This page updates on its own while the search runs.</p>
      ) : null}
    </main>
  );
}
