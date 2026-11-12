'use client';

import { useCallback, useId, useState } from 'react';

import {
  buildActivationConsumeRequestBody,
  mapActivationConsumeResponse,
  validateActivationSetup,
  type ActivationFieldErrors,
} from '../../../src/activation/activationForm';

// Activation UI — AUTH Phase 2 (AUTH-PO-01..30).
// -----------------------------------------------------------------------
// Reachable only via the secure activation link emailed after a ₹1,499
// purchase (buildActivationUrl: `${baseUrl}/activate/{token}`, in
// @acos/core-identity's activationEmail.ts). This page has no knowledge
// of the account behind the token until the one POST below resolves —
// /api/auth/activation/consume never exposes the purchase email ahead
// of a successful activation (enumeration-safe by design, per that
// route's own header), and the token is single-use: the server marks it
// consumed the moment it is found structurally valid, BEFORE it checks
// whether account-setup fields were supplied. So this form cannot probe
// the token first and ask for fields only if they turn out to be
// needed — doing so would burn the token on an empty probe. It collects
// everything a new/passwordless account could need up front and submits
// once. For an account that already has a password, the server silently
// ignores all of it (AUTH-PO-09) and activates from the token alone.
//
// Form validation, request-body shape, and response mapping live in
// ../../../src/activation/activationForm.ts as plain functions so they
// can be unit-tested — this repo has no DOM rendering harness for
// component tests (vitest runs apps/web under environment: 'node').
// -----------------------------------------------------------------------

type Phase = 'form' | 'submitting' | 'done' | 'blocked';

export default function ActivatePage({ params }: { params: { token: string } }) {
  const token = params.token;

  const [phase, setPhase] = useState<Phase>('form');
  const [error, setError] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [fieldErrors, setFieldErrors] = useState<ActivationFieldErrors>({});

  const firstNameId = useId();
  const lastNameId = useId();
  const phoneId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();
  const dobId = useId();

  const submit = useCallback(async () => {
    const fields = { firstName, lastName, phone, password, confirmPassword, dateOfBirth };
    const errors = validateActivationSetup(fields);
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setPhase('submitting');
    setError(null);
    try {
      const response = await fetch('/api/auth/activation/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildActivationConsumeRequestBody(token, fields)),
      });

      const outcome = mapActivationConsumeResponse(response.status);
      if (outcome.kind === 'activated') {
        setPhase('done');
        window.location.href = '/searches/new';
        return;
      }
      if (outcome.kind === 'blocked') {
        setPhase('blocked');
        setError(outcome.message);
        return;
      }
      setPhase('form');
      setError(outcome.message);
    } catch {
      setPhase('form');
      setError('Network error. Please retry.');
    }
  }, [token, firstName, lastName, phone, password, confirmPassword, dateOfBirth]);

  if (phase === 'done') {
    return (
      <main id="main" className="shell">
        <p>Account activated — opening Client Finder…</p>
      </main>
    );
  }

  if (phase === 'blocked') {
    return (
      <main id="main" className="shell">
        <div className="stack" style={{ maxWidth: '56ch' }}>
          <h1 className="page-title">Activation link already used</h1>
          <p className="field-error" role="alert">
            {error}
          </p>
        </div>
      </main>
    );
  }

  const busy = phase === 'submitting';

  return (
    <main id="main" className="shell">
      <div className="stack" style={{ maxWidth: '56ch' }}>
        <h1 className="page-title">Activate your account</h1>
        <p className="lede">
          This link verifies your email and sets up Client Finder access for your ₹1,499
          subscription. If this account already has a password, the details below are ignored
          and you&rsquo;ll be signed in automatically.
        </p>

        {error ? (
          <p className="field-error" role="alert">
            {error}
          </p>
        ) : null}

        <form
          className="stack"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <div className="field">
            <label htmlFor="activate-email">Email</label>
            {/* No email is sent by, or known to, this page — the account
                identity is derived server-side from the token alone
                (route rejects a request body containing one). This is
                display-only, confirming that verification happens via
                the link rather than an address typed here. */}
            <input id="activate-email" type="text" value="Verified by your activation link" disabled readOnly />
          </div>

          <div className="field">
            <label htmlFor={firstNameId}>First name</label>
            <input
              id={firstNameId}
              type="text"
              autoComplete="given-name"
              required
              maxLength={200}
              value={firstName}
              disabled={busy}
              aria-invalid={fieldErrors.firstName ? 'true' : undefined}
              onChange={(event) => setFirstName(event.target.value)}
            />
            {fieldErrors.firstName ? <p className="field-error">{fieldErrors.firstName}</p> : null}
          </div>

          <div className="field">
            <label htmlFor={lastNameId}>Last name</label>
            <input
              id={lastNameId}
              type="text"
              autoComplete="family-name"
              required
              maxLength={200}
              value={lastName}
              disabled={busy}
              aria-invalid={fieldErrors.lastName ? 'true' : undefined}
              onChange={(event) => setLastName(event.target.value)}
            />
            {fieldErrors.lastName ? <p className="field-error">{fieldErrors.lastName}</p> : null}
          </div>

          <div className="field">
            <label htmlFor={phoneId}>Phone</label>
            <input
              id={phoneId}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="+919876543210"
              required
              maxLength={32}
              value={phone}
              disabled={busy}
              aria-invalid={fieldErrors.phone ? 'true' : undefined}
              onChange={(event) => setPhone(event.target.value)}
            />
            {fieldErrors.phone ? <p className="field-error">{fieldErrors.phone}</p> : null}
          </div>

          <div className="field">
            <label htmlFor={passwordId}>Password</label>
            <input
              id={passwordId}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={256}
              value={password}
              disabled={busy}
              aria-invalid={fieldErrors.password ? 'true' : undefined}
              onChange={(event) => setPassword(event.target.value)}
            />
            {fieldErrors.password ? <p className="field-error">{fieldErrors.password}</p> : null}
          </div>

          <div className="field">
            <label htmlFor={confirmPasswordId}>Confirm password</label>
            <input
              id={confirmPasswordId}
              type="password"
              autoComplete="new-password"
              required
              minLength={8}
              maxLength={256}
              value={confirmPassword}
              disabled={busy}
              aria-invalid={fieldErrors.confirmPassword ? 'true' : undefined}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
            {fieldErrors.confirmPassword ? (
              <p className="field-error">{fieldErrors.confirmPassword}</p>
            ) : null}
          </div>

          <div className="field">
            <label htmlFor={dobId}>
              Date of birth <span className="price-note">(optional)</span>
            </label>
            <input
              id={dobId}
              type="date"
              value={dateOfBirth}
              disabled={busy}
              onChange={(event) => setDateOfBirth(event.target.value)}
            />
          </div>

          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy ? 'Activating…' : 'Activate my account'}
          </button>
        </form>
      </div>
    </main>
  );
}
