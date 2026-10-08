'use client';

import { useEffect, useState } from 'react';

// Account setup — DEC-010 item 2 / DEC-011 / DEC-014.
// -----------------------------------------------------------------------
// The [token] segment is the claim token itself (DEC-014 D1: this page
// is reachable ONLY via the link emailed after a verified payment — a
// Razorpay order id in the URL is no longer how a buyer gets here, and
// there is no endpoint that will mint a claim token from one).
//
// On mount, this validates the token (/api/claim/validate) WITHOUT
// consuming it, purely to display the customer's own purchase email —
// pre-populated and disabled, per DEC-011 items 2–4. That field is never
// sent back to the server: /api/auth/signup accepts {claimToken,
// password} alone and derives the account email itself from the claim
// token, server-side, consuming it in the same call (DEC-011 item 7).
// -----------------------------------------------------------------------

type ClaimState =
  | { phase: 'loading' }
  | { phase: 'ready'; customerEmail: string }
  | { phase: 'submitting'; customerEmail: string }
  | { phase: 'done'; status: 'created' | 'existing-account' }
  | { phase: 'error'; message: string };

export default function ClaimPage({ params }: { params: { token: string } }) {
  const claimToken = params.token;
  const [state, setState] = useState<ClaimState>({ phase: 'loading' });
  const [password, setPassword] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await fetch('/api/claim/validate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ claimToken }),
        });
        const body = await response.json();
        if (cancelled) return;
        if (!response.ok) {
          setState({
            phase: 'error',
            message:
              body.error ??
              'This claim link is invalid or has expired. Use the resend option from your order confirmation to request a new one.',
          });
          return;
        }
        setState({ phase: 'ready', customerEmail: body.customerEmail });
      } catch {
        if (!cancelled) setState({ phase: 'error', message: 'Network error. Please retry.' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [claimToken]);

  async function submit(customerEmail: string) {
    setState({ phase: 'submitting', customerEmail });
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ claimToken, password }),
      });
      const body = await response.json();
      if (!response.ok) {
        setState({ phase: 'error', message: body.error ?? 'Account setup failed.' });
        return;
      }
      setState({ phase: 'done', status: body.status });
      if (body.status === 'created') window.location.href = '/access';
    } catch {
      setState({ phase: 'error', message: 'Network error. Please retry.' });
    }
  }

  if (state.phase === 'loading') {
    return (
      <main id="main" className="shell">
        <p>Confirming your claim link…</p>
      </main>
    );
  }

  if (state.phase === 'error') {
    return (
      <main id="main" className="shell">
        <p className="field-error">{state.message}</p>
      </main>
    );
  }

  if (state.phase === 'done') {
    if (state.status === 'existing-account') {
      return (
        <main id="main" className="shell">
          <div className="stack" style={{ maxWidth: '56ch' }}>
            <h1 className="page-title">Account already exists</h1>
            <p className="lede">
              An account already exists for this purchase.{' '}
              <a href="/access/login">Log in</a> to access your library.
            </p>
          </div>
        </main>
      );
    }
    return (
      <main id="main" className="shell">
        <p>Account created — opening your library…</p>
      </main>
    );
  }

  // Only 'ready' and 'submitting' reach here — both carry the same field.
  const { customerEmail: email } = state;

  return (
    <main id="main" className="shell">
      <div className="stack" style={{ maxWidth: '56ch' }}>
        <h1 className="page-title">Set up your account</h1>
        <p className="lede">Create a password to access your library.</p>
        <form
          className="stack"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit(email);
          }}
        >
          <div className="field">
            <label htmlFor="claim-email">Email address</label>
            {/* DEC-011 items 2–4: pre-populated, disabled — display only, never submitted. */}
            <input id="claim-email" type="email" value={email} disabled readOnly />
          </div>
          <div className="field">
            <label htmlFor="claim-password">Password</label>
            <input
              id="claim-password"
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              disabled={state.phase === 'submitting'}
              onChange={(event) => setPassword(event.target.value)}
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={state.phase === 'submitting'}>
            {state.phase === 'submitting' ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      </div>
    </main>
  );
}
