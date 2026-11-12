'use client';

import { useCallback, useState } from 'react';

// §9 "the user can provide feedback" / §10 "Feedback works".
// -----------------------------------------------------------------------
// Posts to the existing, tested @acos/core-opportunity.recordFeedback()
// via /api/opportunities/:id/feedback. Only the two fields that
// persisted model actually supports — useful (boolean) and reason
// (free text) — nothing else is invented here.
// -----------------------------------------------------------------------

export function FeedbackForm({
  opportunityId,
  existing,
}: {
  opportunityId: string;
  existing: { useful: boolean; reason: string } | null;
}) {
  const [useful, setUseful] = useState<boolean | null>(existing?.useful ?? null);
  const [reason, setReason] = useState(existing?.reason ?? '');
  const [status, setStatus] = useState<'idle' | 'busy' | 'saved' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    if (useful === null) {
      setError('Choose useful or not useful.');
      return;
    }
    setStatus('busy');
    setError(null);
    try {
      const response = await fetch(`/api/opportunities/${opportunityId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useful, reason }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'Could not save feedback.');
        setStatus('error');
        return;
      }
      setStatus('saved');
    } catch {
      setError('Could not reach the server. Try again.');
      setStatus('error');
    }
  }, [opportunityId, useful, reason]);

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h2>Would you actually contact this business?</h2>
      <div className="field">
        <label htmlFor="feedback-useful">
          <input
            id="feedback-useful"
            type="radio"
            name="useful"
            checked={useful === true}
            onChange={() => setUseful(true)}
          />{' '}
          Yes — useful
        </label>
        <label htmlFor="feedback-not-useful">
          <input
            id="feedback-not-useful"
            type="radio"
            name="useful"
            checked={useful === false}
            onChange={() => setUseful(false)}
          />{' '}
          No — not useful
        </label>
      </div>
      <div className="field">
        <label htmlFor="feedback-reason">Why?</label>
        <textarea
          id="feedback-reason"
          required
          value={reason}
          onChange={(event) => setReason(event.target.value)}
        />
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      {status === 'saved' ? <p className="status status-good">Feedback saved.</p> : null}
      <button type="submit" className="btn btn-primary" disabled={status === 'busy'}>
        {status === 'busy' ? 'Saving…' : 'Save feedback'}
      </button>
    </form>
  );
}
