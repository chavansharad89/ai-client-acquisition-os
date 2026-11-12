import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { Header } from './Header';

describe('Header', () => {
  it('exposes a labeled control to open the mobile menu', () => {
    const html = renderToStaticMarkup(createElement(Header, { onMenuClick: () => {} }));

    expect(html).toContain('aria-label="Open menu"');
  });

  it('shows a time-of-day greeting with a name derived from the signed-in email', () => {
    const html = renderToStaticMarkup(
      createElement(Header, { onMenuClick: () => {}, email: 'sharad.chavan@example.com' }),
    );

    expect(html).toMatch(/Good (morning|afternoon|evening), Sharad/);
  });

  it('shows a generic greeting when signed out, never a literal email address', () => {
    const html = renderToStaticMarkup(createElement(Header, { onMenuClick: () => {} }));

    expect(html).toMatch(/Good (morning|afternoon|evening)/);
    expect(html).not.toContain('@');
  });

  it('renders an avatar with the first letter of the derived name', () => {
    const html = renderToStaticMarkup(
      createElement(Header, { onMenuClick: () => {}, email: 'sharad.chavan@example.com' }),
    );

    expect(html).toContain('>S<');
  });

  it('renders no search or notification controls — neither has implemented functionality', () => {
    const html = renderToStaticMarkup(
      createElement(Header, { onMenuClick: () => {}, email: 'sharad.chavan@example.com' }),
    );

    expect(html).not.toMatch(/lucide-search|lucide-bell/);
    expect(html).not.toMatch(/Search lessons/);
    expect(html).not.toMatch(/aria-label="[^"]*unread|notification-dot/i);
  });

  describe('account menu (signed in)', () => {
    it('renders a menu trigger with the correct ARIA contract, closed by default', () => {
      const html = renderToStaticMarkup(
        createElement(Header, { onMenuClick: () => {}, email: 'sharad.chavan@example.com' }),
      );

      expect(html).toContain('aria-haspopup="menu"');
      expect(html).toContain('aria-expanded="false"');
      expect(html).toContain('role="menu"');
    });

    it('contains exactly one Log out menu item, reachable as a real menuitem button', () => {
      const html = renderToStaticMarkup(
        createElement(Header, { onMenuClick: () => {}, email: 'sharad.chavan@example.com' }),
      );
      const matches = html.match(/log ?out/gi) ?? [];

      expect(matches.length).toBe(1);
      expect(html).toContain('role="menuitem"');
    });
  });

  it('renders a plain decorative avatar with no menu when signed out (no email)', () => {
    const html = renderToStaticMarkup(createElement(Header, { onMenuClick: () => {} }));

    expect(html).not.toContain('aria-haspopup');
    expect(html).not.toContain('role="menu"');
    expect(html).not.toMatch(/log ?out/i);
  });
});
