import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/home',
}));

import type { MaxSubscriptionStatus } from '@/src/server/clientFinderStatus';

import { AppShell } from './AppShell';

const INACTIVE_MAX: MaxSubscriptionStatus = { state: 'inactive' };

describe('AppShell composition', () => {
  it('renders the sidebar, header and page content together', () => {
    const html = renderToStaticMarkup(
      createElement(AppShell, {
        email: 'learner@example.com',
        purchased: [],
        maxStatus: INACTIVE_MAX,
        children: createElement('p', null, 'Page body'),
      }),
    );

    expect(html).toContain('ACOS'); // Sidebar wordmark
    expect(html).toContain('learner@example.com'); // Header
    expect(html).toContain('Page body'); // children
  });

  it('renders an optional breadcrumb slot above the page content', () => {
    const html = renderToStaticMarkup(
      createElement(AppShell, {
        purchased: [],
        maxStatus: INACTIVE_MAX,
        breadcrumbs: createElement('span', null, 'Home / Section'),
        children: createElement('p', null, 'Page body'),
      }),
    );

    expect(html).toContain('Home / Section');
  });

  it('omits the breadcrumb slot entirely when none is given', () => {
    const html = renderToStaticMarkup(
      createElement(AppShell, {
        purchased: [],
        maxStatus: INACTIVE_MAX,
        children: createElement('p', null, 'Page body'),
      }),
    );

    expect(html).not.toContain('Home / Section');
  });

  it('never wraps its content in a second <main> landmark — every embedded page already has one', () => {
    const html = renderToStaticMarkup(
      createElement(AppShell, {
        purchased: [],
        maxStatus: INACTIVE_MAX,
        children: createElement('main', { id: 'main' }, 'Page body'),
      }),
    );

    expect(html.match(/<main[ >]/g)?.length).toBe(1);
    expect(html.match(/id="main"/g)?.length).toBe(1);
  });
});
