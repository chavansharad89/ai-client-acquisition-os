'use client';

import { useCallback, useState } from 'react';

// Minimal session-mint form for the Client Finder MVP UI.
// -----------------------------------------------------------------------
// Deliberately email-only: MVP identity is provisioned out of band (see
// apps/web/app/api/auth/session/route.ts's doc comment) — there is no
// signup here, only "mint me a session for an account that already
// exists." A user with no existing `users` row sees the 404 message
// below, not an account.
// -----------------------------------------------------------------------

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setStatus('busy');
    setError(null);
    try {
      const response = await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? 'Could not sign in.');
        setStatus('error');
        return;
      }
      window.location.href = '/searches/new';
    } catch {
      setError('Could not reach the server. Try again.');
      setStatus('error');
    }
  }, [email]);

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h2>Sign in</h2>
      <p>Enter the email your account was provisioned with.</p>
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </div>
      {error ? (
        <p className="field-error" role="alert">
          {error}
        </p>
      ) : null}
      <button type="submit" className="btn btn-primary btn-block" disabled={status === 'busy'}>
        {status === 'busy' ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  );
}
