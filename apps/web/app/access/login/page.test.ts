import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import LoginPage from './page';

// /access/login must stay outside the authenticated learner shell — it
// is the one place a not-yet-authenticated visitor lands, and the shell
// is for signed-in navigation. This page imports nothing from the
// AppShell/Sidebar/tailwind-foundation.css stack at all, confirmed here
// by asserting none of that shell's distinctive markup is present.
describe('/access/login stays outside the authenticated shell', () => {
  it('renders the plain login form with no Sidebar/AppShell markup', () => {
    const html = renderToStaticMarkup(createElement(LoginPage));

    expect(html).toContain('Log in');
    expect(html).not.toContain('ACOS');
    expect(html).not.toContain('Your Plans');
    expect(html).not.toContain('aria-label="Main"'); // Sidebar's own nav landmark
  });
});
