'use client';

import { useCallback, useState } from 'react';

// Password-authenticated sign-in form for the Client Finder MVP UI
// (AUTH-PO-11: no session may be minted from an email alone — this
// posts to the existing secure /api/auth/login mechanism, the same one
// apps/web/app/access/login/page.tsx uses).

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'busy' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async () => {
    setStatus('busy');
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
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
  }, [email, password]);

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        void submit();
      }}
    >
      <h2>Sign in</h2>
      <p>Enter the email and password your account was provisioned with.</p>
      <div className="field">
        <label htmlFor="login-email">Email</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          disabled={status === 'busy'}
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
          disabled={status === 'busy'}
          onChange={(event) => setPassword(event.target.value)}
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
