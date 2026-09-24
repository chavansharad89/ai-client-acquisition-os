'use client';

import { useCallback, useState } from 'react';

// Creates a ServiceProfile, then a Search from it (§3 stages 1 and 2:
// DEFINE SERVICE -> DISCOVER BUSINESSES). Two sequential requests against
// the existing, unmodified @acos/core-service-profile and @acos/core-search
// services — this form invents no new backend behaviour, only exposes
// what those packages already do.

const TRIGGER_OPTIONS = [
  'WEBSITE',
  'JOB_POST',
  'LINKEDIN',
  'NEWS',
  'FUNDING',
  'TECH_STACK',
  'REVIEW',
  'MANUAL',
] as const;

export function NewSearchForm() {
  const [service, setService] = useState('');
  const [targetCustomer, setTargetCustomer] = useState('');
  const [geography, setGeography] = useState('');
  const [minProjectValueRupees, setMinProjectValueRupees] = useState('');
  const [triggers, setTriggers] = useState<string[]>([]);
  const [keywords, setKeywords] = useState('');
  const [rationale, setRationale] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const toggleTrigger = useCallback((value: string) => {
    setTriggers((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  }, []);

  const submit = useCallback(async () => {
    setStatus('busy');
    setError(null);
    try {
      const minProjectValuePaise = Math.round(Number(minProjectValueRupees) * 100);
      const profileResponse = await fetch('/api/service-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service,
          targetCustomer,
          geography,
          minProjectValuePaise,
          triggers,
          keywords: keywords
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
          rationale,
        }),
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
  }, [service, targetCustomer, geography, minProjectValueRupees, triggers, keywords, rationale]);

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <div className="field">
        <label htmlFor="service">What do you sell?</label>
        <input id="service" required value={service} onChange={(e) => setService(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="targetCustomer">Target customer</label>
        <input
          id="targetCustomer"
          required
          value={targetCustomer}
          onChange={(e) => setTargetCustomer(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor="geography">Geography</label>
        <input id="geography" required value={geography} onChange={(e) => setGeography(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="minProjectValue">Minimum project value (₹)</label>
        <input
          id="minProjectValue"
          type="number"
          min="0"
          required
          value={minProjectValueRupees}
          onChange={(e) => setMinProjectValueRupees(e.target.value)}
        />
      </div>
      <fieldset className="field">
        <legend>Signals worth researching</legend>
        {TRIGGER_OPTIONS.map((option) => (
          <label key={option} htmlFor={`trigger-${option}`} className="checkbox-option">
            <input
              id={`trigger-${option}`}
              type="checkbox"
              checked={triggers.includes(option)}
              onChange={() => toggleTrigger(option)}
            />
            {option}
          </label>
        ))}
      </fieldset>
      <div className="field">
        <label htmlFor="keywords">Keywords (comma separated)</label>
        <input id="keywords" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="rationale">Why this fit (rationale)</label>
        <textarea id="rationale" required value={rationale} onChange={(e) => setRationale(e.target.value)} />
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={status === 'busy'}>
        {status === 'busy' ? 'Starting search…' : 'Find businesses'}
      </button>
    </form>
  );
}
