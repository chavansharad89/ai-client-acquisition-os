import type { ContentLifecycleStatus } from '@acos/core-cms';

import { cn } from '@/lib/utils';

const STYLES: Record<ContentLifecycleStatus, string> = {
  DRAFT: 'bg-secondary text-secondary-foreground',
  PUBLISHED: 'bg-primary text-primary-foreground',
  ARCHIVED: 'bg-muted text-muted-foreground',
};

export function StatusBadge({ status }: { status: ContentLifecycleStatus }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[11px] font-medium tracking-wide',
        STYLES[status],
      )}
    >
      {status}
    </span>
  );
}
