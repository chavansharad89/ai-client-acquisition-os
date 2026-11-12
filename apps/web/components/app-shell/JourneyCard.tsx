import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/Card';
import { cn } from '@/lib/utils';

export type JourneyAccent = 'plus' | 'pro' | 'max';

// Pro and Max reuse the existing --primary/--secondary tokens as their
// accent; Plus gets its own --plus token (tailwind-foundation.css) since
// no existing slot matched the approved blue. Purely visual — none of
// this carries subscription state; the sidebar's "Your Plans" block is
// the single place that does (see Sidebar.tsx/PlanStatus.tsx).
const ACCENT_STYLES: Record<JourneyAccent, { wash: string; pill: string; cta: string; iconBox: string }> = {
  // `text-*-foreground!` (Tailwind's important modifier): see Button.tsx's
  // doc comment — app/globals.css's legacy, unlayered `:where(a) { color:
  // var(--brand); }` rule outranks a plain `@layer utilities` class by
  // Cascade Layers semantics whenever these styles land on a real <a>
  // (the CTA below), so the pill's foreground color needs `!important` to
  // actually win. Harmless on the plan-pill <span>, which isn't an <a>.
  plus: {
    wash: 'bg-plus/[0.04] border-plus/10',
    pill: 'bg-plus text-plus-foreground!',
    cta: 'bg-plus text-plus-foreground!',
    iconBox: 'bg-plus/10 text-plus',
  },
  pro: {
    wash: 'bg-primary/[0.04] border-primary/10',
    pill: 'bg-primary text-primary-foreground!',
    cta: 'bg-primary text-primary-foreground!',
    iconBox: 'bg-primary/10 text-primary',
  },
  max: {
    // The CTA deliberately does NOT reuse `pill` here. Plain #0D9488
    // (the Max identity color, kept on the plan-pill badge and icon box
    // below) measures ~3.75:1 with white / ~4.14:1 with dark ink as
    // button text — neither clears AA's 4.5:1 for normal-size text.
    // #0F766E is a darker teal step of the same hue that clears it with
    // white: ~5.47:1 computed via the WCAG relative-luminance formula.
    wash: 'bg-secondary/[0.04] border-secondary/10',
    pill: 'bg-secondary text-secondary-foreground!',
    cta: 'bg-[#0F766E] text-white!',
    iconBox: 'bg-secondary/10 text-secondary',
  },
};

export interface JourneyCardProps {
  accent: JourneyAccent;
  icon: LucideIcon;
  /** Short plan label shown as a solid pill — "PLUS" / "PRO" / "MAX". */
  plan: string;
  headline: string;
  description: string;
  outcome: string;
  ctaLabel: string;
  href: string;
}

export function JourneyCard({
  accent,
  icon: Icon,
  plan,
  headline,
  description,
  outcome,
  ctaLabel,
  href,
}: JourneyCardProps) {
  const styles = ACCENT_STYLES[accent];

  // h-full so every card fills its grid row (equal heights at each
  // breakpoint); CardContent's flex-1 then pins every CTA to the bottom.
  // 20px internal padding / 16px radius overrides the Card primitive's
  // 16px / 10px defaults for this dashboard only — the primitive is
  // shared with CMS screens and is left as-is.
  return (
    <Card className={cn('flex h-full flex-col rounded-2xl border shadow-none', styles.wash)}>
      <CardHeader className="gap-3 p-5">
        <div className="flex items-center justify-between">
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide', styles.pill)}>
            {plan}
          </span>
          <span className={cn('flex h-9 w-9 items-center justify-center rounded-xl', styles.iconBox)}>
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          {/* "Card titles": 18px/700/24px desktop, 17px tablet, 16px mobile.
              "Card descriptions": 14px/400/21px desktop/tablet, 13px mobile. */}
          <CardTitle className="text-[16px] font-[number:var(--acos-weight-bold)] leading-[21px] md:text-[17px] md:leading-[23px] lg:text-[length:var(--acos-type-lg)] lg:leading-[24px]">
            {headline}
          </CardTitle>
          <CardDescription className="text-[13px] leading-[20px] md:text-[length:var(--acos-type-base)] md:leading-[21px]">
            {description}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 px-5 pb-0">
        <p className="text-sm font-medium text-foreground">{outcome}</p>
      </CardContent>
      <CardFooter className="p-5 pt-3">
        {/* `focus-visible:ring-2!` etc. (important): app/globals.css has an
            unlayered `:where(a, button, input, [tabindex]):focus-visible
            { box-shadow: var(--focus) }` rule that outranks a plain layered
            Tailwind ring utility on a real <a> — same Cascade Layers issue
            Button.tsx/Sidebar.tsx already document for `text-*-foreground`. */}
        <Link
          href={href}
          className={cn(
            'inline-flex h-9 w-full items-center justify-center gap-2 rounded-md px-4 text-sm font-medium transition-colors hover:opacity-90 focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring! focus-visible:ring-offset-2!',
            styles.cta,
          )}
        >
          {ctaLabel}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </CardFooter>
    </Card>
  );
}
