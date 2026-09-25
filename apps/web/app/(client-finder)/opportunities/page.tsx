import { redirect } from 'next/navigation';

import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { getOpportunity, rankOpportunities } from '@acos/core-opportunity';

import { clientFinderRepositories } from '../../../src/server/clientFinderRepositories';
import { resolveBusinessIdentity } from '../../../src/server/clientFinderView';
import { readSessionTokenFromServerComponent } from '../../../src/server/session';

export const metadata = { title: 'Opportunities — Client Finder' };
export const dynamic = 'force-dynamic';

// Results page (§10 "Results are visible" / "Ranked opportunities").
// -----------------------------------------------------------------------
// Reuses @acos/core-opportunity.rankOpportunities() unchanged — it
// orders the caller's own already-persisted OpportunityScores
// deterministically (R-15/AC-17) and never recomputes anything. This
// page adds no scoring logic and no new "best" label beyond the
// existing rank order.
//
// One caveat, stated plainly rather than hidden: rankOpportunities()
// ranks across ALL of the caller's Opportunities, not per-Search — no
// service function in @acos/core-opportunity accepts a searchId filter.
// Each row still names which Search it came from (via the Prospect it
// is derived from), so the search is identifiable, just not the sole
// scope of this page. See MVP GAP-TO-EXIT AUDIT Section 7 (Results
// Visibility) for that same caveat, raised before this was built.
// -----------------------------------------------------------------------

export default async function OpportunitiesPage() {
  const token = readSessionTokenFromServerComponent();
  if (!token) redirect('/login');

  const repos = clientFinderRepositories();

  let userId: string;
  let ranked;
  try {
    userId = await requireUser(repos.identity, token);
    ranked = await rankOpportunities(repos, token);
  } catch (err) {
    if (err instanceof UnauthenticatedError) redirect('/login');
    throw err;
  }

  const rows = await Promise.all(
    ranked.map(async (entry) => {
      const opportunity = await getOpportunity(repos, token, entry.opportunityId);
      const identity = await resolveBusinessIdentity(repos, userId, opportunity.prospectId);
      return { entry, opportunity, identity };
    }),
  );

  return (
    <main id="main" className="shell">
      <header>
        <p className="eyebrow">Client Finder</p>
        <h1 className="page-title">Opportunities</h1>
        <p className="lede">Ranked deterministically — same inputs always produce this order.</p>
      </header>

      {rows.length === 0 ? (
        <p className="queue-empty">
          No opportunities yet. <a href="/searches/new">Start a search</a>.
        </p>
      ) : (
        <ol className="opportunity-list">
          {rows.map(({ entry, opportunity, identity }) => (
            <li key={opportunity.id} className="opportunity-row card">
              <span className="opportunity-rank">#{entry.rank}</span>
              <div className="opportunity-summary">
                <h2>{identity.companyName ?? `Prospect ${opportunity.prospectId}`}</h2>
                <p>
                  Score {entry.score.total} · {entry.score.band}
                  {opportunity.needDetected && opportunity.offer
                    ? ` · Recommended: ${opportunity.offer.service}`
                    : ' · No suitable offer detected'}
                </p>
              </div>
              <a className="btn btn-secondary" href={`/opportunities/${opportunity.id}`}>
                Review
              </a>
            </li>
          ))}
        </ol>
      )}
    </main>
  );
}
