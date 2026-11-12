'use client';

import { useState, type ReactNode } from 'react';

import type { MaxSubscriptionStatus } from '@/src/server/clientFinderStatus';

import { Header } from './Header';
import { Sidebar } from './Sidebar';

export interface AppShellProps {
  children: ReactNode;
  breadcrumbs?: ReactNode;
  email?: string | undefined;
  /** access.context.purchased (readonly ProductId[]) — widened to
   * string[] here so this shell doesn't need a @acos/core-entitlements
   * type import just to compare IDs for display. */
  purchased: readonly string[];
  /** From getMaxSubscriptionStatus() (subscription_periods) — never
   * derived from `purchased`. See clientFinderStatus.ts. */
  maxStatus: MaxSubscriptionStatus;
}

// Learner-facing shell, structurally modeled on components/cms/CmsShell.tsx
// (fixed desktop sidebar + off-canvas mobile drawer, one implementation for
// both) but a separate file under components/app-shell/ with its own
// Sidebar/Header — no shared code path with the CMS admin shell, and no
// coupling between learner navigation and CMS administration.
//
// Content wrapper is a plain <div>, not <main> — every page this shell
// wraps (ProductRoadmap, TopicDetailView, LearningPathSelection, the
// legacy library view, and now /home) already provides its own single
// <main id="main"> landmark, matching the root layout's "Skip to
// content" link. A second <main id="main"> here would duplicate both
// the landmark and the id.
export function AppShell({ children, breadcrumbs, email, purchased, maxStatus }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        purchased={purchased}
        maxStatus={maxStatus}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} email={email} />
        <div className="flex-1 overflow-y-auto">
          {breadcrumbs && <div className="border-b border-border px-6 py-3 lg:px-10">{breadcrumbs}</div>}
          {/* The one content container every embedded page shares: same
              horizontal padding as the header above (px-6 / lg:px-10), one
              max-width, centered — pages must not define their own. */}
          <div className="mx-auto w-full max-w-7xl px-6 py-6 lg:px-10 lg:py-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
