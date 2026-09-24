'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const TERMINAL_STATUSES = new Set(['COMPLETE', 'FAILED', 'CANCELLED']);

/**
 * Re-fetches this Server Component page every few seconds while the
 * Search is still PENDING/RUNNING, so the status shown is never more
 * than a few seconds stale — no client-side progress simulation, no
 * invented percentage: `router.refresh()` re-runs the real server read
 * (@acos/core-search's getSearch()) and re-renders the real
 * persisted status.
 */
export function SearchStatusPoller({ status }: { status: string }) {
  const router = useRouter();

  useEffect(() => {
    if (TERMINAL_STATUSES.has(status)) return;
    const interval = setInterval(() => router.refresh(), 4000);
    return () => clearInterval(interval);
  }, [status, router]);

  return null;
}
