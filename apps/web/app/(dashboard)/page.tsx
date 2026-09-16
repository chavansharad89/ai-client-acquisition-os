import { AttentionStrip } from '../../src/components/dashboard/AttentionStrip';
import { MetricGrid } from '../../src/components/dashboard/MetricGrid';
import { NextActions } from '../../src/components/dashboard/NextActions';
import { SectionList } from '../../src/components/dashboard/SectionList';
import { loadDashboard } from '../../src/dashboard/loadDashboard';

// The Client Acquisition OS dashboard.
// -----------------------------------------------------------------------
// Ordered by what the operator needs, not by what is easiest to lay out:
//
//   1. The queue — what to do next, and nothing above it.
//   2. Attention — sections holding something that needs a decision.
//   3. Metrics — whether the queue is working.
//   4. Sections — navigation.
//
// A server component: the whole page is HTML, no client JavaScript, so it
// is readable the instant it arrives. Nothing here is interactive yet
// because nothing here should be — every action links out to the screen
// that owns it.
// -----------------------------------------------------------------------

export const metadata = { title: 'Client Acquisition OS' };
export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const now = new Date();
  const dashboard = await loadDashboard(now);

  return (
    <main id="main" className="shell dashboard">
      <header className="dashboard-head">
        <p className="eyebrow">Client Acquisition OS</p>
        <h1 className="page-title">Today</h1>
      </header>

      <NextActions actions={dashboard.nextActions} headline={dashboard.headline} now={now} />

      <AttentionStrip sections={dashboard.attention} />

      <h2 className="block-heading">How it is going</h2>
      <MetricGrid metrics={dashboard.metrics} />

      <h2 className="block-heading">Everything else</h2>
      <SectionList sections={dashboard.sections} />
    </main>
  );
}
