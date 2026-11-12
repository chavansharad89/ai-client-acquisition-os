'use client';

import { Menu } from 'lucide-react';

export function CmsHeader({ onMenuClick }: { onMenuClick: () => void }) {
  return (
    <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card px-4 lg:px-6">
      <button
        type="button"
        className="text-muted-foreground lg:hidden"
        onClick={onMenuClick}
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>
      <p className="text-sm font-medium">Content Management</p>
    </header>
  );
}
