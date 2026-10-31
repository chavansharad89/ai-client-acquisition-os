import type { ProductId } from '@acos/catalog';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { CMS_PRODUCT_TIERS } from '@/src/cms-admin/products';

// Pure Links, like ProductSwitcher.tsx's product-tab half -- a
// navigation, not client state, so this stays a server component.
export function PreviewPlanSwitcher({ activePlan }: { activePlan: ProductId }) {
  return (
    <div className="flex rounded-md border border-border bg-card p-1">
      {CMS_PRODUCT_TIERS.map((t) => (
        <Link
          key={t.productId}
          href={`/cms/preview?plan=${t.productId}`}
          className={cn(
            'rounded px-3 py-1 text-sm font-medium transition-colors',
            t.productId === activePlan
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {t.tier}
        </Link>
      ))}
    </div>
  );
}
