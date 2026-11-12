'use client';

import { useState, type ReactNode } from 'react';

import { CmsHeader } from './CmsHeader';
import { CmsSidebar } from './CmsSidebar';

// Desktop: fixed sidebar + content, side by side (CmsSidebar is
// `lg:static`). Below that breakpoint the sidebar becomes an
// off-canvas drawer toggled from the header — §18's "collapsible
// sidebar" for tablet/mobile, one implementation covering both rather
// than a separate mobile layout.
export function CmsShell({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <CmsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CmsHeader onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
