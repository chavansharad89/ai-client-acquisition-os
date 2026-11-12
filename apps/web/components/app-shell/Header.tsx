'use client';

import { useEffect, useRef, useState } from 'react';
import { Menu } from 'lucide-react';

import { cn } from '@/lib/utils';

export interface HeaderProps {
  onMenuClick: () => void;
  email?: string | undefined;
}

/** First letter-group before any dot/plus/digit in the email's local part, capitalized — a
 * best-effort display name derived from existing data (no new name field to plumb through). */
function displayNameFrom(email: string): string {
  const local = email.split('@')[0] ?? '';
  const word = local.split(/[.+0-9_-]/)[0] ?? '';
  if (!word) return '';
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function timeOfDayGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Avatar-triggered account menu — today just "Log out", the only action
 * this app has. This is now the single logout surface for every page
 * AppShell wraps (My Library previously rendered its own standalone
 * button below its hero; /home had no logout at all) — one place rather
 * than a per-page control.
 *
 * The fetch-then-redirect logout call is the exact same one
 * src/components/LogoutButton.tsx used (now removed as dead code, since
 * this was its only caller) — no new logout API, same session
 * invalidation via POST /api/auth/logout.
 *
 * Deliberately minimal keyboard handling for a one-item menu: both the
 * trigger and the menu item are real <button>s (native Tab/Enter/Space
 * support for free), opening moves focus straight to the item, Escape or
 * losing focus closes it and Escape also returns focus to the trigger.
 * If more items are ever added, promote this to roving-tabindex/arrow-key
 * navigation then — not speculatively now.
 */
function AccountMenu({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuItemRef = useRef<HTMLButtonElement>(null);
  const name = displayNameFrom(email);
  const initial = (name || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    if (!open) return;
    menuItemRef.current?.focus();

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      setOpen(false);
      triggerRef.current?.focus();
    }

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/access/login';
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) setOpen(false);
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Account menu for ${email}`}
        onClick={() => setOpen((isOpen) => !isOpen)}
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring! focus-visible:ring-offset-2!"
      >
        <span aria-hidden="true">{initial}</span>
      </button>
      <div
        role="menu"
        aria-label="Account"
        className={cn(
          'absolute right-0 top-full z-20 mt-2 w-40 rounded-md border border-border bg-card p-1 shadow-md',
          open ? 'block' : 'hidden',
        )}
      >
        <button
          ref={menuItemRef}
          role="menuitem"
          type="button"
          disabled={busy}
          onClick={() => void logout()}
          className="flex w-full items-center rounded-md px-2 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent focus-visible:outline-none! focus-visible:ring-2! focus-visible:ring-ring! disabled:opacity-60"
        >
          {busy ? 'Logging out…' : 'Log out'}
        </button>
      </div>
    </div>
  );
}

// 64px tall (h-16), separate from components/cms/CmsHeader.tsx — that
// file is CMS-scoped and left untouched. Deliberately just greeting +
// avatar: there is no search index or notification system yet, and the
// approved scope excludes placeholder controls for them. Account &
// Settings is its own (currently "Soon") Sidebar nav item, so this
// header doesn't grow a duplicate account menu beyond the one action
// (logout) that already exists.
export function Header({ onMenuClick, email }: HeaderProps) {
  const name = email ? displayNameFrom(email) : '';
  const greeting = timeOfDayGreeting(new Date().getHours());
  const initial = (name || 'U').charAt(0).toUpperCase();

  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border bg-card px-6 lg:px-10">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          className="-ml-2 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground lg:hidden"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        {/* "Header greeting": 14px/600/20px per the canonical typography spec. */}
        <p className="truncate text-[length:var(--acos-type-base)] font-[number:var(--acos-weight-semibold)] leading-[20px] text-foreground">
          {greeting}
          {name ? `, ${name}` : ''} <span aria-hidden="true">👋</span>
        </p>
      </div>

      <div className="flex items-center">
        {email ? (
          <AccountMenu email={email} />
        ) : (
          <>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground"
              aria-hidden="true"
            >
              {initial}
            </span>
            <span className="sr-only">Signed in</span>
          </>
        )}
      </div>
    </header>
  );
}
