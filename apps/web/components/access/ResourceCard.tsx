import Link from 'next/link';
import { CheckCircle2, Lock, type LucideIcon } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export type ResourceAccent = 'plus' | 'pro' | 'max';

// Same accent-token system as components/app-shell/JourneyCard.tsx (bg-plus/
// bg-primary/bg-secondary, `!` to beat globals.css's unlayered focus/link
// rules — see that file's doc comments for why) but defined locally rather
// than imported: JourneyCard is T1/T2-approved for the /home dashboard and
// has no locked/unlocked or price branching, so this library-specific card
// is a separate component to avoid changing that approved page.
const ACCENT_STYLES: Record<ResourceAccent, { wash: string; pill: string; iconBox: string; cta: string }> = {
  plus: {
    wash: 'bg-plus/[0.04] border-plus/10',
    pill: 'bg-plus text-plus-foreground!',
    iconBox: 'bg-plus/10 text-plus',
    cta: 'bg-plus text-plus-foreground!',
  },
  pro: {
    wash: 'bg-primary/[0.04] border-primary/10',
    pill: 'bg-primary text-primary-foreground!',
    iconBox: 'bg-primary/10 text-primary',
    cta: 'bg-primary text-primary-foreground!',
  },
  max: {
    // Darker teal step for the unlocked CTA's contrast, not the plain
    // #0D9488 identity color — see JourneyCard.tsx's doc comment for the
    // WCAG AA measurement this mirrors.
    wash: 'bg-secondary/[0.04] border-secondary/10',
    pill: 'bg-secondary text-secondary-foreground!',
    iconBox: 'bg-secondary/10 text-secondary',
    cta: 'bg-[#0F766E] text-white!',
  },
};

export interface ResourceCardProps {
  accent: ResourceAccent;
  icon: LucideIcon;
  /** "LEARN" / "BUILD" / "SELL" */
  journeyLabel: string;
  /** "PLUS" / "PRO" / "MAX" */
  planLabel: string;
  title: string;
  /** Omitted entirely (no paragraph rendered) when no approved copy exists
   *  for this specific product — never replaced with invented text. */
  description?: string | undefined;
  unlocked: boolean;
  /** Only rendered when `unlocked` is false. */
  priceLabel?: string | undefined;
  href: string;
  ctaLabel: string;
}

export function ResourceCard({
  accent,
  icon: Icon,
  journeyLabel,
  planLabel,
  title,
  description,
  unlocked,
  priceLabel,
  href,
  ctaLabel,
}: ResourceCardProps) {
  const styles = ACCENT_STYLES[accent];

  return (
    <Card
      className={cn(
        'flex flex-col gap-4 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between',
        styles.wash,
      )}
    >
      <div className="flex min-w-0 items-start gap-4">
        {/* 56x56 container / 28px icon — up from the original 48/20 pairing,
            which read as too small next to the title. */}
        <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-xl', styles.iconBox)}>
          <Icon className="h-7 w-7" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col gap-1.5">
          {/* Status badge sits beside the plan pill, in the same info block
              as the title — not in a separate column floating above the CTA
              (that read as detached from the resource it describes). */}
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn('w-fit rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide', styles.pill)}>
              {journeyLabel} — {planLabel}
            </span>
            {unlocked ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                Unlocked
              </Badge>
            ) : (
              <Badge variant="muted" className="gap-1">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Locked
              </Badge>
            )}
          </div>
          {/* "Card titles": 18px/700/24px desktop, 17px tablet, 16px mobile.
              "Card descriptions": 14px/400/21px desktop/tablet, 13px mobile. */}
          <h3 className="text-[16px] font-[number:var(--acos-weight-bold)] leading-[21px] text-foreground md:text-[17px] md:leading-[23px] lg:text-[length:var(--acos-type-lg)] lg:leading-[24px]">
            {title}
          </h3>
          {description && (
            <p className="text-[13px] leading-[20px] text-muted-foreground md:text-[length:var(--acos-type-base)] md:leading-[21px]">
              {description}
            </p>
          )}
          {!unlocked && priceLabel && <p className="text-sm font-semibold text-foreground">{priceLabel}</p>}
        </div>
      </div>

      {/* `focus-visible:ring-2!` etc.: see JourneyCard.tsx's doc comment —
          app/globals.css's unlayered focus-visible rule outranks a plain
          layered Tailwind ring utility on a real <a> without `!important`.
          The card row's own `sm:items-center` keeps this button vertically
          centered against the info block at left regardless of whether
          that block has a description line (the legacy kit's card has
          none) or a price line, so alignment never depends on card height. */}
      <Link
        href={href}
        className={cn(
          'inline-flex h-9 shrink-0 items-center justify-center whitespace-nowrap rounded-md px-4 text-sm font-medium transition-colors hover:opacity-90 focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring! focus-visible:ring-offset-2!',
          unlocked ? styles.cta : 'border border-border bg-transparent text-foreground hover:bg-accent',
        )}
      >
        {ctaLabel}
      </Link>
    </Card>
  );
}
