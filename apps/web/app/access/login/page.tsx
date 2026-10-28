'use client';

import { useState } from 'react';

// Account login — DEC-010 item 5's launch recovery mechanism. No
// email-based reset exists or is needed here.
export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        const body = await response.json();
        setError(body.error ?? 'Could not log in.');
        setBusy(false);
        return;
      }
      window.location.href = '/access';
    } catch {
      setError('Network error. Please retry.');
      setBusy(false);
    }
  }

  return (
    <main id="main" className="shell">
      <div className="stack" style={{ maxWidth: '48ch' }}>
        <h1 className="page-title">Log in</h1>
        <form
          className="stack"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="field">
            <label htmlFor="login-email">Email address</label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              disabled={busy}
              onChange={(event) => setEmail(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              disabled={busy}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          {error ? <p className="field-error">{error}</p> : null}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
        </form>
      </div>
    </main>
  );
}
