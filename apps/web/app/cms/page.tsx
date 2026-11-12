import { listByOwningProduct, toPublicContentItem } from '@acos/core-cms';
import Link from 'next/link';

import { StatCard } from '@/components/cms/StatCard';
import { StatusBadge } from '@/components/cms/StatusBadge';
import { countByStatus } from '@/src/cms-admin/contentTree';
import { CMS_PRODUCT_TIERS } from '@/src/cms-admin/products';
import { requireCmsAdminForPage } from '@/src/cms-admin/requireCmsAdminPage';

// CMS Dashboard (§6) — every number here comes from the existing
// listByOwningProduct read, nothing new. No analytics, no invented
// endpoints: if a metric were not derivable from this one call, it is
// left out rather than fabricated.
export const dynamic = 'force-dynamic';

export default async function CmsDashboardPage() {
  const { repos } = await requireCmsAdminForPage();

  const perProduct = await Promise.all(
    CMS_PRODUCT_TIERS.map(async (t) => {
      const items = await listByOwningProduct({ contentItems: repos.contentItems }, t.productId);
      return { ...t, items: items.map(toPublicContentItem) };
    }),
  );

  const allItems = perProduct.flatMap((p) => p.items);
  const statusCounts = countByStatus(allItems);
  const recent = [...allItems]
    .sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-8">
      <header>
        {/* "Section headings" treatment (24px/700/30px) — CMS admin shares
            the canonical typography scale via tailwind-foundation.css,
            though its own StatCard/StatusBadge/EmptyState components stay
            untouched (separate, pre-existing CMS-scoped system). */}
        <h1 className="text-[length:var(--acos-type-2xl)] font-bold leading-[30px] tracking-tight">CMS Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Learning content across Plus, Pro, and Max.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Published" value={statusCounts.PUBLISHED} tone="positive" />
        <StatCard label="Draft" value={statusCounts.DRAFT} tone="neutral" />
        <StatCard label="Archived" value={statusCounts.ARCHIVED} tone="muted" />
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground">Products</h2>
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {perProduct.map((p) => (
            <Link
              key={p.productId}
              href={`/cms/roadmaps?product=${p.productId}`}
              className="rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <p className="text-sm text-muted-foreground">{p.tier}</p>
              <p className="mt-1 text-2xl font-semibold">{p.items.length}</p>
              <p className="text-xs text-muted-foreground">content items</p>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium text-muted-foreground">Recent content</h2>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
          {recent.length === 0 ? (
            <li className="p-4 text-sm text-muted-foreground">No content yet.</li>
          ) : (
            recent.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-4 p-4">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.nodeType === 'ASSET' ? (item.assetKind ?? 'Asset') : 'Section'}
                  </p>
                </div>
                <StatusBadge status={item.status} />
              </li>
            ))
          )}
        </ul>
      </section>
    </div>
  );
}
