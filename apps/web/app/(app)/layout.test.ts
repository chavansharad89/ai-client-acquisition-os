import type { ProductId } from '@acos/catalog';
import { funnelStateFor } from '@acos/core-entitlements';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WebAccessResolution } from '../../src/server/access';

// Same convention as app/access/[productId]/page.test.ts: fake
// currentAccess() and next/navigation entirely (no database, no router).

const state = vi.hoisted(() => ({
  resolution: null as WebAccessResolution | null,
}));

vi.mock('next/navigation', () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT ${url}`);
  },
  usePathname: () => '/home',
}));

vi.mock('@/src/server/access', () => ({
  currentAccess: async () => state.resolution,
}));

// next/font/google's real export relies on bundler-only transform magic
// that doesn't apply when Vitest imports it directly — faked the same
// way any other environment-specific dependency would be.
vi.mock('@/lib/fonts', () => ({
  inter: { variable: 'mock-inter-variable' },
}));

const ANONYMOUS: WebAccessResolution = { granted: false, reason: 'no-token', funnel: funnelStateFor([]) };

beforeEach(() => {
  state.resolution = null;
});

describe('(app) layout — auth gate', () => {
  it('redirects an anonymous visitor to login with a next= back to /home, reusing currentAccess() read-only', async () => {
    state.resolution = ANONYMOUS;
    const { default: AppLayout } = await import('./layout');

    await expect(AppLayout({ children: createElement('p', null, 'child') })).rejects.toThrow(
      'REDIRECT /access/login?next=/home',
    );
  });

  it('renders the shell with the real signed-in email and the page content for a granted visitor', async () => {
    const purchased: ProductId[] = ['ai_income_99'];
    state.resolution = {
      granted: true,
      context: { customerEmail: 'learner@example.com', purchased, userId: 'user-1' },
      funnel: funnelStateFor(purchased),
    };
    const { default: AppLayout } = await import('./layout');

    const html = renderToStaticMarkup(await AppLayout({ children: createElement('p', null, 'Home content') }));

    expect(html).toContain('learner@example.com');
    expect(html).toContain('Home content');
    // ACOS wordmark from the Sidebar confirms the real shell rendered,
    // not just the bare children.
    expect(html).toContain('ACOS');
  });
});
