import { requireUser, UnauthenticatedError } from '@acos/core-identity';
import { getOpportunity, rankOpportunities } from '@acos/core-opportunity';
import { getOpportunityQualification, type QualificationState } from '@acos/core-qualification';
import { getClientFinderSubscriptionStatus } from '@acos/core-subscriptions';
import { ArrowRight, Search } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { EmptyState } from '@/components/ui/EmptyState';

import { ClientFinderNav } from '../../../src/components/client-finder/ClientFinderNav';
import { SubscriptionStatusBadge } from '../../../src/components/client-finder/SubscriptionStatusBadge';
import { clientFinderRepositories } from '../../../src/server/clientFinderRepositories';
import { resolveBusinessIdentity, resolveWhyFound } from '../../../src/server/clientFinderView';
import { readSessionTokenFromServerComponent } from '../../../src/server/session';

export const metadata = { title: 'Opportunities — Client Finder' };
export const dynamic = 'force-dynamic';

// B1 (CF-OPPORTUNITIES-LIST-VISIBILITY-PO-DEC-001): every discovered
// Opportunity stays visible regardless of QualificationState — this
// label is presentation only and never filters `rows`. QUALIFIED gets
// normal/prominent presentation; the other two states get the new
// theme's de-emphasis treatment (text-[13px] text-muted-foreground —
// the equivalent of the old .hint class: same 13px size, same muted
// color, per globals.css's own .hint rule).
const QUALIFICATION_LABELS: Record<QualificationState, string> = {
  QUALIFIED: 'Qualified',
  NOT_QUALIFIED: 'Not qualified',
  INSUFFICIENT_EVIDENCE: 'Needs more evidence',
};

// Results page (§10 "Results are visible" / "Ranked opportunities").
// -----------------------------------------------------------------------
// Reuses @acos/core-opportunity.rankOpportunities() unchanged — it
// orders the caller's own already-persisted OpportunityScores
// deterministically (R-15/AC-17) and never recomputes anything. This
// page adds no scoring logic and no new "best" label beyond the
// existing rank order.
//
// B2 (CF-OPPORTUNITIES-SEARCH-FIRST-PO-DEC-001): an optional ?searchId
// narrows the already-ranked rows to one Search, via the existing
// ownership-safe listBySearch(userId, searchId) — never by trusting the
// client-supplied id directly. No searchId -> unchanged cumulative
// behavior (every caller's Opportunity, as before B2).
//
// Visual redesign only below this point: reskinned onto the same
// Tailwind/shadcn foundation and canonical typography scale as
// /home, /access, and /access/[productId] (AppShell now wraps this
// route group — see layout.tsx). ClientFinderNav and
// SubscriptionStatusBadge are left untouched: they're shared across the
// other Client Finder pages (detail, searches), which are out of scope
// for this pass.
// -----------------------------------------------------------------------

export default async function OpportunitiesPage({
  searchParams,
}: {
  searchParams: { searchId?: string };
}) {
  const token = readSessionTokenFromServerComponent();
  if (!token) redirect('/login');

  const repos = clientFinderRepositories();
  const searchId = typeof searchParams.searchId === 'string' ? searchParams.searchId : undefined;

  let userId: string;
  let ranked;
  let scopedProspectIds: Set<string> | null = null;
  try {
    userId = await requireUser(repos.identity, token);
    ranked = await rankOpportunities(repos, token);
    if (searchId) {
      const scopedProspects = await repos.prospects.listBySearch(userId, searchId);
      scopedProspectIds = new Set(scopedProspects.map((prospect) => prospect.id));
    }
  } catch (err) {
    if (err instanceof UnauthenticatedError) redirect('/login');
    throw err;
  }

  // Same existing status computation GET /api/subscriptions/status wraps
  // (Phase 2, Part 2) — browsing itself is never gated on it.
  const subscriptionStatus = await getClientFinderSubscriptionStatus(
    { subscriptionPeriods: repos.subscriptionPeriods },
    userId,
  );

  const rows = (
    await Promise.all(
      ranked.map(async (entry) => {
        const opportunity = await getOpportunity(repos, token, entry.opportunityId);
        // A Search-scoped request must never silently fall back to the
        // cumulative list: an invalid/foreign searchId yields an empty
        // scopedProspectIds set (listBySearch's own ownership filter),
        // which simply excludes every row here — not another user's data.
        if (scopedProspectIds && !scopedProspectIds.has(opportunity.prospectId)) return null;
        const identity = await resolveBusinessIdentity(repos, userId, opportunity.prospectId);
        const whyFound = await resolveWhyFound(repos, userId, opportunity.prospectId);
        const qualification = await getOpportunityQualification(repos, token, entry.opportunityId);
        return { entry, opportunity, identity, whyFound, qualification };
      }),
    )
  ).filter((row): row is NonNullable<typeof row> => row !== null);

  return (
    <main id="main">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-2">
          <ClientFinderNav />
          {/* "Section headings" treatment: 24px/700/30px desktop, 22px
              tablet, 20px mobile — same as "Learning Paths" on the Plus
              catalogue. */}
          <h1 className="m-0 text-[20px] font-bold leading-[25px] text-foreground md:text-[22px] md:leading-[28px] lg:text-[length:var(--acos-type-2xl)] lg:leading-[30px]">
            Opportunities
          </h1>
          <p className="m-0 text-sm text-muted-foreground">
            {searchId ? 'Results for this search' : 'Ranked deterministically — same inputs always produce this order.'}
          </p>
          <SubscriptionStatusBadge active={subscriptionStatus.active} expiresAt={subscriptionStatus.expiresAt} />
        </header>

        {rows.length === 0 ? (
          <EmptyState
            title={searchId ? 'No opportunities found for this search' : 'No opportunities yet'}
            icon={<Search className="h-6 w-6" aria-hidden="true" />}
            action={
              searchId ? (
                <Link href="/opportunities" className="text-sm font-medium text-plus hover:underline">
                  View all opportunities
                </Link>
              ) : (
                <Link href="/searches/new" className="text-sm font-medium text-plus hover:underline">
                  Start a search
                </Link>
              )
            }
          />
        ) : (
          <ol className="m-0 flex list-none flex-col gap-3 p-0">
            {rows.map(({ entry, opportunity, identity, whyFound, qualification }) => (
              <li key={opportunity.id}>
                <Link
                  href={`/opportunities/${opportunity.id}`}
                  className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-plus/40 hover:shadow-md focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring! focus-visible:ring-offset-2!"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plus/10 text-sm font-semibold text-plus">
                    #{entry.rank}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    {/* "Card titles": 18px/700/24px desktop, 17px tablet,
                        16px mobile. */}
                    <span className="line-clamp-2 text-[16px] font-bold leading-[21px] text-foreground md:text-[17px] md:leading-[23px] lg:text-[length:var(--acos-type-lg)] lg:leading-[24px]">
                      {identity.companyName ?? `Prospect ${opportunity.prospectId}`}
                    </span>
                    {whyFound ? (
                      <span className="text-[13px] leading-[20px] text-muted-foreground md:text-[length:var(--acos-type-base)] md:leading-[21px]">
                        {whyFound}
                      </span>
                    ) : null}
                    {qualification ? (
                      <span
                        className={
                          qualification.state === 'QUALIFIED'
                            ? 'text-sm font-medium text-foreground'
                            : 'text-[13px] text-muted-foreground'
                        }
                      >
                        {QUALIFICATION_LABELS[qualification.state]}
                      </span>
                    ) : null}
                    <span className="text-[13px] text-muted-foreground">
                      {entry.score.ranking ? (
                        <>
                          Need/Opportunity: {entry.score.ranking.needOpportunity} · Service Fit:{' '}
                          {entry.score.ranking.serviceFit}
                        </>
                      ) : null}
                      {opportunity.needDetected && opportunity.offer
                        ? ` · Recommended: ${opportunity.offer.service}`
                        : ' · No suitable offer detected'}
                    </span>
                  </span>
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-plus/10 text-plus transition-colors group-hover:bg-plus group-hover:text-plus-foreground!"
                    aria-hidden="true"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </main>
  );
}
