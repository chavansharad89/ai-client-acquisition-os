'use client';

import { useState } from 'react';

// Logs out via fetch rather than a plain HTML form POST, so the browser
// ends up on the kit-account login page instead of rendering the
// logout route's raw JSON response. Matches the fetch-then-redirect
// pattern already used by access/login and the claim page.
export function LogoutButton() {
  const [busy, setBusy] = useState(false);

  async function logout() {
    setBusy(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      window.location.href = '/access/login';
    }
  }

  return (
    <button className="btn btn-secondary" type="button" disabled={busy} onClick={() => void logout()}>
      {busy ? 'Logging out…' : 'Log out'}
    </button>
  );
}
