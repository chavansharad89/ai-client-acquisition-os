'use client';

import { useCallback, useState } from 'react';

import { Button } from '@/components/ui/Button';

// Shared shadcn-style field classes (no dedicated Input/Select component
// exists yet in components/ui) — same tokens/metrics as Button's own
// focus-visible ring and Card's border/radius, so select and input match
// the rest of the new Tailwind/shadcn theme.
const FIELD_CLASS =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

// Creates a ServiceProfile, then a Search from it (§3 stages 1 and 2:
// DEFINE SERVICE -> DISCOVER BUSINESSES). Two sequential requests against
// the existing, unmodified @acos/core-service-profile and @acos/core-search
// services — this form invents no new backend behaviour, only exposes
// what those packages already do.
//
// CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001: the freelancer-facing
// input is exactly Service + Geography. Target customer, minimum project
// value, triggers, keywords, and rationale are no longer collected here —
// @acos/core-service-profile.createServiceProfile() fills them in with
// system defaults (CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002)
// before validation runs, so omitting them from this request body is
// sufficient; nothing here needs to know what those defaults are.

// D6 (CF-SERVICE-CATALOG-PO-DEC-001): a freelancer selects exactly one of
// the 17 canonical top-level service families — no subservices, aliases,
// or free text. Local, literal transcription of that decision's 17
// family names, mirroring @acos/core-service-profile's validation.ts.
const SERVICE_FAMILY_OPTIONS = [
  'Web & Software Development',
  'AI & Automation',
  'Video & Reels',
  'Graphic & Visual Design',
  'Branding',
  'Digital Marketing',
  'Content & Copywriting',
  'Photography',
  'Audio',
  'E-commerce Services',
  'Business & Operations',
  'Sales & Lead Generation',
  'Translation & Language',
  'Architecture / Engineering / 3D',
  'Finance / Professional Services',
  'Education & Expertise',
  'Specialized Professional Services',
] as const;

export function NewSearchForm() {
  const [service, setService] = useState('');
  const [geography, setGeography] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setStatus('busy');
    setError(null);
    try {
      const profileResponse = await fetch('/api/service-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, geography }),
      });
      if (!profileResponse.ok) {
        const body = (await profileResponse.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'Could not save the service definition.');
        setStatus('error');
        return;
      }
      const profile = (await profileResponse.json()) as { id: string };

      const searchResponse = await fetch('/api/searches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceProfileId: profile.id }),
      });
      if (!searchResponse.ok) {
        const body = (await searchResponse.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'Could not start the search.');
        setStatus('error');
        return;
      }
      const search = (await searchResponse.json()) as { id: string };
      window.location.href = `/searches/${search.id}`;
    } catch {
      setError('Could not reach the server. Try again.');
      setStatus('error');
    }
  }, [service, geography]);

  return (
    <form
      className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 shadow-sm"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-1.5">
        <label htmlFor="service" className="text-sm font-medium text-foreground">
          What do you sell?
        </label>
        <select
          id="service"
          required
          value={service}
          onChange={(e) => setService(e.target.value)}
          className={FIELD_CLASS}
        >
          <option value="" disabled>
            Select a service
          </option>
          {SERVICE_FAMILY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="geography" className="text-sm font-medium text-foreground">
          Where do you want to find clients?
        </label>
        <input
          id="geography"
          required
          value={geography}
          onChange={(e) => setGeography(e.target.value)}
          className={FIELD_CLASS}
        />
      </div>
      {error ? (
        <p className="text-sm font-medium text-destructive" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="plus" size="lg" className="w-full" disabled={status === 'busy'}>
        {status === 'busy' ? 'Starting search…' : 'Find my next clients'}
      </Button>
    </form>
  );
}
