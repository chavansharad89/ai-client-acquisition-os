import { Fragment } from 'react';
import { ArrowRight, GraduationCap, Hammer, TrendingUp, type LucideIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

interface Stage {
  number: string;
  label: string;
  plan: string;
  description: string;
  icon: LucideIcon;
  badgeBg: string;
  iconWrap: string;
  text: string;
  boxBg: string;
}

// Purely descriptive — no links, CTAs, or subscription data. The three
// workspace cards in Section C (JourneyCard) are what's actionable; this
// component only communicates that Learn/Build/Sell are one continuous
// journey, not three unrelated products. Icons match JourneyCard's icons
// per stage so the two sections read as one system.
const STAGES: Stage[] = [
  {
    number: '01',
    label: 'LEARN',
    plan: 'PLUS',
    description: 'Gain AI skills.',
    icon: GraduationCap,
    badgeBg: 'bg-plus/10 text-plus',
    iconWrap: 'bg-plus/10 text-plus',
    text: 'text-plus',
    boxBg: 'bg-plus/5 border-plus/20',
  },
  {
    number: '02',
    label: 'BUILD',
    plan: 'PRO',
    description: 'Create AI products.',
    icon: Hammer,
    badgeBg: 'bg-primary/10 text-primary',
    iconWrap: 'bg-primary/10 text-primary',
    text: 'text-primary',
    boxBg: 'bg-primary/5 border-primary/20',
  },
  {
    number: '03',
    label: 'SELL',
    plan: 'MAX',
    description: 'Find customers.',
    icon: TrendingUp,
    badgeBg: 'bg-secondary/10 text-secondary',
    iconWrap: 'bg-secondary/10 text-secondary',
    text: 'text-secondary',
    boxBg: 'bg-secondary/5 border-secondary/20',
  },
];

// Layout: from lg, a flex row of three equal `flex-1 basis-0` stages
// separated by fixed-width arrow connectors. `items-stretch` (the flex
// default) keeps every stage the same height even when one description
// wraps, and each stage centers its own content vertically. Below lg the
// same arrows turn 90° and the row stacks — one connector system, not
// two. (Three across at 768px gave ~205px stages, which wrapped every
// label; the vertical progression is the clean tablet/mobile form.)
export function JourneyStages() {
  return (
    <div role="list" aria-label="Your AI journey: three stages" className="flex flex-col gap-3 lg:flex-row lg:gap-4">
      {STAGES.map((stage, index) => (
        <Fragment key={stage.plan}>
          <div
            role="listitem"
            className={cn('flex min-h-[64px] flex-1 basis-0 items-center gap-2.5 rounded-xl border px-3.5 py-2.5', stage.boxBg)}
          >
            <span
              className={cn(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold tabular-nums',
                stage.badgeBg,
              )}
            >
              {stage.number}
            </span>
            <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full', stage.iconWrap)}>
              <stage.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex min-w-0 flex-col gap-0.5">
              <p className={cn('text-xs font-semibold tracking-wide', stage.text)}>
                {stage.label} — {stage.plan}
              </p>
              <p className="text-sm leading-snug text-muted-foreground">{stage.description}</p>
            </div>
          </div>
          {index < STAGES.length - 1 && (
            <ArrowRight
              className="h-5 w-5 shrink-0 self-center rotate-90 text-muted-foreground lg:rotate-0"
              aria-hidden="true"
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
