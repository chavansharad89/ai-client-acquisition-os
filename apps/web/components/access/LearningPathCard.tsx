import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { cn } from '@/lib/utils';

import { LearningPathCover } from './covers/LearningPathCover';

export interface LearningPathCardProps {
  id: string;
  title: string;
  description?: string | null | undefined;
  href: string;
  className?: string;
  /** Hover border accent, e.g. `hover:border-plus/40`. Defaults to the
   * original Plus accent so every existing call site is unaffected. */
  hoverBorderClassName?: string;
  /** Arrow-chip fill/icon/hover accent. Defaults to the original Plus
   * accent so every existing call site is unaffected. */
  arrowClassName?: string;
}

const DEFAULT_HOVER_BORDER = 'hover:border-plus/40';
const DEFAULT_ARROW = 'bg-plus/10 text-plus group-hover:bg-plus group-hover:text-plus-foreground!';

// Single card layout (image-left / text-middle / circular-arrow-right) used
// by both the grid and list catalogue views — only the surrounding
// container's CSS (grid-cols vs. flex-col) differs between them, per the
// approved reference, so there is exactly one card implementation, not two.
export function LearningPathCard({
  id,
  title,
  description,
  href,
  className,
  hoverBorderClassName = DEFAULT_HOVER_BORDER,
  arrowClassName = DEFAULT_ARROW,
}: LearningPathCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group flex items-center gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm',
        'transition-all hover:-translate-y-0.5 hover:shadow-md',
        hoverBorderClassName,
        'focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring! focus-visible:ring-offset-2!',
        className,
      )}
    >
      <LearningPathCover id={id} className="h-20 w-20 shrink-0 rounded-xl object-cover" />
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        {/* "Card titles": 18px/700/24px desktop, 17px tablet, 16px mobile.
            "Card descriptions": 14px/400/21px desktop/tablet, 13px mobile. */}
        <span className="line-clamp-2 text-[16px] font-bold leading-[21px] text-foreground md:text-[17px] md:leading-[23px] lg:text-[length:var(--acos-type-lg)] lg:leading-[24px]">
          {title}
        </span>
        {description && (
          <span className="line-clamp-2 text-[13px] leading-[20px] text-muted-foreground md:text-[length:var(--acos-type-base)] md:leading-[21px]">
            {description}
          </span>
        )}
      </span>
      <span
        className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors', arrowClassName)}
        aria-hidden="true"
      >
        <ArrowRight className="h-5 w-5" />
      </span>
    </Link>
  );
}
