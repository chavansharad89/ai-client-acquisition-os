import type { ContentLifecycleStatus } from '@acos/core-cms';
import { listByOwningProduct, toPublicContentItem } from '@acos/core-cms';

import { ProductSwitcher } from '@/components/cms/ProductSwitcher';
import { RoadmapCanvas } from '@/components/cms/RoadmapCanvas';
import { buildContentTree, filterTreeByStatus } from '@/src/cms-admin/contentTree';
import { DEFAULT_CMS_PRODUCT_ID, isCmsProductId } from '@/src/cms-admin/products';
import { requireCmsAdminForPage } from '@/src/cms-admin/requireCmsAdminPage';

// Roadmap Manager (§7) — Phase 1C's product selector/hierarchy/roadmap
// view/node selection, Phase 1D's metadata editing/container creation/
// order-swap reordering, Phase 1E's asset upload, and Phase 1F's
// publish/archive/reactivate/replace (all in RoadmapCanvas/
// ContentInspector). `items` is passed down unfiltered (independent of
// `status`) so the Inspector can find a pending replacement for a
// PUBLISHED asset even while the Draft/Published/Archived filter would
// otherwise hide that DRAFT row from the visible tree.
export const dynamic = 'force-dynamic';

const VALID_STATUSES: readonly ContentLifecycleStatus[] = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

function parseStatus(value: string | undefined): ContentLifecycleStatus | null {
  return VALID_STATUSES.includes(value as ContentLifecycleStatus)
    ? (value as ContentLifecycleStatus)
    : null;
}

interface Props {
  searchParams: { product?: string; status?: string };
}

export default async function CmsRoadmapsPage({ searchParams }: Props) {
  const { repos } = await requireCmsAdminForPage();

  const productId = isCmsProductId(searchParams.product)
    ? searchParams.product
    : DEFAULT_CMS_PRODUCT_ID;
  const status = parseStatus(searchParams.status);

  const items = (await listByOwningProduct({ contentItems: repos.contentItems }, productId)).map(
    toPublicContentItem,
  );
  const tree = filterTreeByStatus(buildContentTree(items), status);

  return (
    <div className="flex h-full flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Roadmap Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {items.length === 0
              ? 'No content yet for this product.'
              : `${items.length} item${items.length === 1 ? '' : 's'}`}
          </p>
        </div>
        <ProductSwitcher activeProductId={productId} activeStatus={status} />
      </header>

      <RoadmapCanvas tree={tree} allItems={items} productId={productId} />
    </div>
  );
}
