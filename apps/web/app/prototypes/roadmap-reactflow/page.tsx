import { RoadmapReactFlowCanvas } from '../../../components/access/prototypes/RoadmapReactFlowCanvas';
import { requireCmsAdminForPage } from '../../../src/cms-admin/requireCmsAdminPage';
import { buildPreviewSections } from '../../../src/server/cmsPreviewService';

// PROTOTYPE ONLY — CMS-PO-012. Not linked from any production page, not
// part of the customer-facing app, and not adopted. Evaluates
// @xyflow/react against the real ai_income_99 content hierarchy, gated
// by the same admin-only check /cms/preview uses (no new auth path, no
// change to Plus/customer access control). Isolated from
// RoadmapFlowchart.tsx (the production CSS implementation), which this
// page does not call, modify, or replace.
export const dynamic = 'force-dynamic';

export default async function RoadmapReactFlowPrototypePage() {
  const { repos } = await requireCmsAdminForPage();
  const sections = await buildPreviewSections(
    { contentItems: repos.contentItems, planDisplayNames: repos.planDisplayNames },
    'ai_income_99',
  );
  const section = sections.find((s) => s.productId === 'ai_income_99');

  return (
    <main className="shell">
      <div className="stack">
        <h1 className="page-title">Roadmap graph-renderer prototype (CMS-PO-012)</h1>
        <p>
          @xyflow/react evaluation only — not the production implementation. Real {section?.displayName}{' '}
          content, all statuses (admin preview semantics, same as /cms/preview).
        </p>
        {section && section.tree.length > 0 ? (
          <RoadmapReactFlowCanvas tree={section.tree} productId="ai_income_99" />
        ) : (
          <p>No content found for ai_income_99.</p>
        )}
      </div>
    </main>
  );
}
