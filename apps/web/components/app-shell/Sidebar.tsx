'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TrendingUp, X } from 'lucide-react';

import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { MaxSubscriptionStatus } from '@/src/server/clientFinderStatus';

import { NAV_SECTIONS } from './navigation';
import { PlanStatus } from './PlanStatus';

export interface SidebarProps {
  open: boolean;
  onClose: () => void;
  /** From currentAccess().context.purchased, read-only — feeds only the
   * "Your Plans" status block below. It never hides, locks, or grants
   * access to anything; real authorization stays server-side. */
  purchased: readonly string[];
  /** From getMaxSubscriptionStatus() (subscription_periods) — never
   * derived from `purchased`. See clientFinderStatus.ts. */
  maxStatus: MaxSubscriptionStatus;
}

function isActiveHref(pathname: string, href: string): boolean {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ open, onClose, purchased, maxStatus }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <nav
        aria-label="Main"
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-[248px] shrink-0 overflow-y-auto bg-navy p-4 text-slate-300 transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
              <TrendingUp className="h-4 w-4" aria-hidden="true" />
            </span>
            {/* "ACOS logo": 15px/600/22px per the canonical typography spec.
                15px doesn't land on the 9-step --acos-type-* scale, so it's
                a literal size here (weight still references the token). */}
            <p className="text-[15px] font-[number:var(--acos-weight-semibold)] leading-[22px] tracking-tight text-white">
              ACOS
            </p>
          </div>
          <button
            type="button"
            className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4">
          <PlanStatus
            plusActive={purchased.includes('ai_income_99')}
            proActive={purchased.includes('ai_freelancing_499')}
            maxStatus={maxStatus}
          />
        </div>

        <div className="mt-6 flex flex-col gap-6">
          {NAV_SECTIONS.map((section, sectionIndex) => (
            <div key={section.heading ?? `section-${sectionIndex}`}>
              {/* "Sidebar section labels": 12px/600/16px per the canonical
                  typography spec. A section with a headingHref (Learn —
                  Plus / Build — Pro / Sell — Max) links straight to that
                  plan's own content, same destination as its real nav item
                  below — not just a label. Workspace/Account have no
                  single plan destination, so they stay plain text. */}
              {section.heading &&
                (section.headingHref ? (
                  <Link
                    href={section.headingHref}
                    className="flex items-center gap-1.5 rounded-md px-2 text-[length:var(--acos-type-sm)] font-[number:var(--acos-weight-semibold)] leading-[16px] uppercase tracking-wide text-slate-400! transition-colors hover:text-slate-200! focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-white/60!"
                  >
                    {section.headingIcon && <section.headingIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span>{section.heading}</span>
                  </Link>
                ) : (
                  <div className="flex items-center gap-1.5 px-2 text-[length:var(--acos-type-sm)] font-[number:var(--acos-weight-semibold)] leading-[16px] uppercase tracking-wide text-slate-400">
                    {section.headingIcon && <section.headingIcon className="h-3.5 w-3.5" aria-hidden="true" />}
                    <span>{section.heading}</span>
                  </div>
                ))}
              <div className={cn('flex flex-col gap-0.5', section.heading && 'mt-1')}>
                {section.items.map((item) => {
                  const Icon = item.icon;
                  if ('soon' in item) {
                    return (
                      <div
                        key={item.label}
                        className="flex items-center gap-2 rounded-md px-2 py-1.5 text-[length:var(--acos-type-base)] font-[number:var(--acos-weight-medium)] leading-[20px] text-slate-400"
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                        <span className="truncate">{item.label}</span>
                        <Badge variant="muted" className="ml-auto bg-white/10 text-slate-300">
                          Soon
                        </Badge>
                      </div>
                    );
                  }

                  const active = isActiveHref(pathname, item.href);
                  // `text-*!`/`ring-*!` (important) are required, not
                  // stylistic — see Button.tsx: app/globals.css has two
                  // separate unlayered `:where(...)` rules (one for `color`
                  // on every <a>, one for focus-visible `box-shadow` on every
                  // <a>/button/input/[tabindex]) that outrank any layered
                  // Tailwind utility on a real <a>. Without `!` here, Tab
                  // focus rendered the legacy hardcoded brand-green ring
                  // instead of this white one.
                  return (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        // "Sidebar navigation": 14px/500/20px per the canonical
                        // typography spec — applies uniformly whether or not
                        // the item is the active route.
                        'flex items-center gap-2 rounded-md px-2 py-1.5 text-[length:var(--acos-type-base)] font-[number:var(--acos-weight-medium)] leading-[20px] transition-colors hover:bg-white/10 hover:text-white! focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-white/60!',
                        active ? 'bg-plus text-plus-foreground!' : 'text-slate-300!',
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
