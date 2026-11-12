import type { ContentLifecycleStatus } from '@acos/core-cms';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { CMS_PRODUCT_TIERS } from '@/src/cms-admin/products';

const STATUSES: { label: string; value: ContentLifecycleStatus | null }[] = [
  { label: 'All', value: null },
  { label: 'Draft', value: 'DRAFT' },
  { label: 'Published', value: 'PUBLISHED' },
  { label: 'Archived', value: 'ARCHIVED' },
];

// Pure Links with query params — both the product tabs and the status
// pills are navigations, not client state, so this stays a server
// component and ships no extra JS.
export function ProductSwitcher({
  activeProductId,
  activeStatus,
}: {
  activeProductId: string;
  activeStatus: ContentLifecycleStatus | null;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex rounded-md border border-border bg-card p-1">
        {CMS_PRODUCT_TIERS.map((t) => (
          <Link
            key={t.productId}
            href={`/cms/roadmaps?product=${t.productId}${activeStatus ? `&status=${activeStatus}` : ''}`}
            className={cn(
              'rounded px-3 py-1 text-sm font-medium transition-colors',
              t.productId === activeProductId
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.tier}
          </Link>
        ))}
      </div>
      <div className="flex rounded-md border border-border bg-card p-1">
        {STATUSES.map((s) => (
          <Link
            key={s.label}
            href={`/cms/roadmaps?product=${activeProductId}${s.value ? `&status=${s.value}` : ''}`}
            className={cn(
              'rounded px-3 py-1 text-sm font-medium transition-colors',
              s.value === activeStatus
                ? 'bg-secondary text-secondary-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
