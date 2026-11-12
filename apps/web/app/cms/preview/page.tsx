import type { CmsPlanProductId } from '@acos/core-subscriptions';

import { CustomerRoadmapView } from '@/components/cms/CustomerRoadmapView';
import { PreviewPlanSwitcher } from '@/components/cms/PreviewPlanSwitcher';
import { DEFAULT_CMS_PRODUCT_ID, isCmsProductId } from '@/src/cms-admin/products';
import { requireCmsAdminForPage } from '@/src/cms-admin/requireCmsAdminPage';
import { buildPreviewSections } from '@/src/server/cmsPreviewService';

// Customer Preview (Phase 1H) — admin-only, read-only view of what a
// customer on a chosen plan would see, plus Draft/Archived metadata for
// the admin's own review. Gated by the same requireCmsAdminForPage()
// chain every other /cms/* page uses (also enforced one layer up by
// app/cms/layout.tsx) — no customer entitlement check anywhere here.
export const dynamic = 'force-dynamic';

interface Props {
  searchParams: { plan?: string };
}

export default async function CmsPreviewPage({ searchParams }: Props) {
  const { repos } = await requireCmsAdminForPage();

  // isCmsProductId only ever matches the 3 CMS-eligible plan ids
  // (CMS_PRODUCT_TIERS), which are exactly CmsPlanProductId's members.
  const plan = (
    isCmsProductId(searchParams.plan) ? searchParams.plan : DEFAULT_CMS_PRODUCT_ID
  ) as CmsPlanProductId;

  const sections = await buildPreviewSections(
    { contentItems: repos.contentItems, planDisplayNames: repos.planDisplayNames },
    plan,
  );

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Customer Preview</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Shows this plan&apos;s content by each item&apos;s own status — a Published item is
            visible to customers even if nested under a Draft or Archived heading. Assets are
            metadata-only here — no download or playback.
          </p>
        </div>
        <PreviewPlanSwitcher activePlan={plan} />
      </header>

      <CustomerRoadmapView sections={sections} showLifecycleBadges />
    </div>
  );
}
