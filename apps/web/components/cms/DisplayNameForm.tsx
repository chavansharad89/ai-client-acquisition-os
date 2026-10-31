'use client';

import { useState } from 'react';

import { setDisplayName, type CmsApiError } from '@/src/cms-admin/api';

// Phase 1G (CMS-PO-001(R2)) — one row per CMS-eligible product on
// /cms/display-names. The server component page resolves the initial
// state (current effective name + whether it's a CMS override or the
// catalog default); this component only ever POSTs a change through
// the existing, unchanged admin API (setDisplayName, api.ts) — no new
// write path, no delete/reset action (the backend has none).
export function DisplayNameForm({
  productId,
  tier,
  initialDisplayName,
  initialIsOverride,
}: {
  productId: string;
  tier: 'Plus' | 'Pro' | 'Max';
  initialDisplayName: string;
  initialIsOverride: boolean;
}) {
  const [value, setValue] = useState(initialDisplayName);
  const [isOverride, setIsOverride] = useState(initialIsOverride);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<CmsApiError | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  async function handleSave() {
    setBusy(true);
    setError(null);
    setSavedAt(null);
    const result = await setDisplayName(productId, value);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setValue(result.data.displayName);
    setIsOverride(true);
    setSavedAt(Date.now());
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium tracking-wide text-secondary-foreground">
            {tier}
          </span>
          <span className="font-mono text-xs text-muted-foreground" title="Stable product/SKU id — never changed by this form">
            {productId}
          </span>
        </div>
        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
          {isOverride ? 'Custom' : 'Catalog default'}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={busy}
          aria-label={`Display name for ${productId}`}
          className="min-w-0 flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={handleSave}
          disabled={busy || value.trim().length === 0}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-50"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>

      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {!error && savedAt && <p className="text-sm text-muted-foreground">Saved.</p>}
    </div>
  );
}
