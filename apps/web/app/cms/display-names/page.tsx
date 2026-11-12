import { resolveDisplayName } from '@acos/core-cms';

import { DisplayNameForm } from '@/components/cms/DisplayNameForm';
import { CMS_PRODUCT_TIERS } from '@/src/cms-admin/products';
import { requireCmsAdminForPage } from '@/src/cms-admin/requireCmsAdminPage';

// Display Names (Phase 1G, CMS-PO-001(R2)) — replaces the earlier stub.
// Resolves each of the 3 CMS-eligible products' current effective name
// and override status directly (same two calls the admin GET API route
// itself makes — apps/web/app/api/cms/admin/display-names/[productId]/
// route.ts — called here as a Server Component reading repos directly,
// the same convention every other /cms/* page already uses, rather than
// this page re-fetching its own API over HTTP).
export const dynamic = 'force-dynamic';

export default async function CmsDisplayNamesPage() {
  const { repos } = await requireCmsAdminForPage();

  const products = await Promise.all(
    CMS_PRODUCT_TIERS.map(async ({ productId, tier }) => {
      const [displayName, override] = await Promise.all([
        resolveDisplayName({ planDisplayNames: repos.planDisplayNames }, productId),
        repos.planDisplayNames.findByProductId(productId),
      ]);
      return { productId, tier, displayName, isOverride: override !== null };
    }),
  );

  return (
    <div className="flex h-full flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Display Names</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Customer-facing name for each plan. The product/SKU id itself never changes — only the
          name shown to customers.
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {products.map((p) => (
          <DisplayNameForm
            key={p.productId}
            productId={p.productId}
            tier={p.tier}
            initialDisplayName={p.displayName}
            initialIsOverride={p.isOverride}
          />
        ))}
      </div>
    </div>
  );
}
