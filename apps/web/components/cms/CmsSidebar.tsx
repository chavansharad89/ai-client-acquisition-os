'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { cn } from '@/lib/utils';

interface NavLink {
  label: string;
  href: string;
}
interface NavSoon {
  label: string;
  soon: true;
}
type NavItem = NavLink | NavSoon;
interface NavSection {
  heading?: string;
  items: NavItem[];
}

// Target IA (§5): Dashboard / Learning / Content / Products / Display
// Names. Only Dashboard, Roadmaps, the status filters, the product
// switch, and Display Names (stub) are wired this phase — Courses/
// Projects/Resources have no distinct backend shape yet (content_items
// has no notion of them beyond "a CONTAINER somewhere in the tree"), so
// they render as disabled "Soon" entries rather than linking to a filter
// that would not actually filter anything.
const NAV_SECTIONS: NavSection[] = [
  { items: [{ label: 'Dashboard', href: '/cms' }] },
  {
    heading: 'Learning',
    items: [
      { label: 'Roadmaps', href: '/cms/roadmaps' },
      { label: 'Courses', soon: true },
      { label: 'Projects', soon: true },
      { label: 'Resources', soon: true },
    ],
  },
  {
    heading: 'Content',
    items: [
      { label: 'All Content', href: '/cms/roadmaps' },
      { label: 'Drafts', href: '/cms/roadmaps?status=DRAFT' },
      { label: 'Published', href: '/cms/roadmaps?status=PUBLISHED' },
      { label: 'Archived', href: '/cms/roadmaps?status=ARCHIVED' },
    ],
  },
  {
    heading: 'Products',
    items: [
      { label: 'Plus', href: '/cms/roadmaps?product=ai_income_99' },
      { label: 'Pro', href: '/cms/roadmaps?product=ai_freelancing_499' },
      { label: 'Max', href: '/cms/roadmaps?product=ai_client_acquisition_1499_subscription' },
    ],
  },
  {
    items: [
      { label: 'Customer Preview', href: '/cms/preview' },
      { label: 'Display Names', href: '/cms/display-names' },
    ],
  },
];

export function CmsSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentHref = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname;

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
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 shrink-0 overflow-y-auto border-r border-border bg-card p-4 transition-transform lg:static lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <p className="px-2 text-sm font-semibold tracking-tight">ACOS CMS</p>
        <div className="mt-6 flex flex-col gap-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.heading ?? section.items[0]?.label}>
              {section.heading && (
                <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {section.heading}
                </p>
              )}
              <div className="mt-1 flex flex-col gap-0.5">
                {section.items.map((item) =>
                  'soon' in item ? (
                    <span
                      key={item.label}
                      className="flex items-center justify-between rounded-md px-2 py-1.5 text-sm text-muted-foreground/50"
                    >
                      {item.label}
                      <span className="text-[10px] uppercase">Soon</span>
                    </span>
                  ) : (
                    <Link
                      key={item.label}
                      href={item.href}
                      onClick={onClose}
                      className={cn(
                        'rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent',
                        currentHref === item.href || (item.href === pathname && !searchParams.toString())
                          ? 'bg-accent font-medium'
                          : 'text-muted-foreground',
                      )}
                    >
                      {item.label}
                    </Link>
                  ),
                )}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </>
  );
}
