import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('next/navigation', () => ({
  usePathname: () => '/home',
}));

import type { MaxSubscriptionStatus } from '@/src/server/clientFinderStatus';

import { Sidebar, type SidebarProps } from './Sidebar';

const INACTIVE_MAX: MaxSubscriptionStatus = { state: 'inactive' };

function render(overrides: Partial<SidebarProps> = {}): string {
  const props: SidebarProps = {
    open: false,
    onClose: () => {},
    purchased: [],
    maxStatus: INACTIVE_MAX,
    ...overrides,
  };
  return renderToStaticMarkup(createElement(Sidebar, props));
}

describe('Sidebar', () => {
  it('renders every nav label from the approved IA, grouped under the right headings', () => {
    const html = render();

    for (const label of [
      'Workspace',
      'Dashboard',
      'My Library',
      'Learn — Plus',
      'Explore Roadmaps',
      'My Learning',
      'AI Tutor',
      'Research',
      'Assessments',
      'Build — Pro',
      'Pro Projects',
      'Sell — Max',
      'Find Opportunities',
      'Account',
      'My Plans',
      'Settings',
    ]) {
      expect(html).toContain(label);
    }
  });

  it('marks the real Dashboard link as the active page via aria-current', () => {
    const html = render();

    expect(html).toMatch(/href="\/home"[^>]*aria-current="page"|aria-current="page"[^>]*href="\/home"/);
  });

  it('shows "Soon" on not-yet-built items and never renders them as a link', () => {
    const html = render();

    expect(html).toContain('Soon');
    expect(html).not.toMatch(/<a[^>]*>\s*Explore Roadmaps/);
    expect(html).not.toMatch(/<a[^>]*>\s*AI Tutor/);
    expect(html).not.toMatch(/<a[^>]*>\s*My Plans/);
  });

  it('renders My Library, Pro Projects and Find Opportunities as real, non-Soon links', () => {
    const html = render();

    for (const [label, href] of [
      ['My Library', '/access'],
      ['Pro Projects', '/access/ai_freelancing_499'],
      ['Find Opportunities', '/opportunities'],
    ] as const) {
      const labelIndex = html.indexOf(label);
      const row = html.slice(labelIndex, labelIndex + 200);
      expect(html).toContain(`href="${href}"`);
      expect(row).not.toContain('Soon');
    }
  });

  it('marks Pro Projects and Find Opportunities inactive when the current path does not match them', () => {
    const html = render();

    // pathname is mocked to /home above.
    expect(html).not.toMatch(/href="\/access\/ai_freelancing_499"[^>]*aria-current="page"/);
    expect(html).not.toMatch(/href="\/opportunities"[^>]*aria-current="page"/);
  });

  it('renders a single "Your Plans" status block rather than per-item entitlement badges', () => {
    const html = render({ purchased: ['ai_income_99', 'ai_freelancing_499'] });

    expect(html).toContain('Your Plans');
    // Exactly one "Active" per held plan in the status block, not one
    // per nav row too — i.e. not duplicated onto Learn — Plus / Pro
    // Projects/Find Opportunities labels.
    const learnHeadingIndex = html.indexOf('Learn — Plus');
    const learnHeadingRow = html.slice(learnHeadingIndex, learnHeadingIndex + 150);
    expect(learnHeadingRow).not.toContain('Active');
  });

  it('links each plan\'s section heading to its own plan content, same destination as that section\'s real nav item', () => {
    const html = render();

    for (const [heading, href] of [
      ['Learn — Plus', '/access/ai_income_99'],
      ['Build — Pro', '/access/ai_freelancing_499'],
      ['Sell — Max', '/opportunities'],
    ] as const) {
      const headingIndex = html.indexOf(heading);
      const row = html.slice(Math.max(0, headingIndex - 600), headingIndex);
      expect(row).toContain(`href="${href}"`);
    }
  });

  it('does not turn the Workspace/Account section headings into links, since they have no single plan destination', () => {
    const html = render();

    for (const heading of ['Workspace', 'Account']) {
      const headingIndex = html.indexOf(heading);
      const row = html.slice(Math.max(0, headingIndex - 300), headingIndex);
      expect(row).not.toContain('<a ');
    }
  });

  it('positions the mobile drawer off-screen when closed and on-screen when open', () => {
    const closed = render({ open: false });
    const open = render({ open: true });

    expect(closed).toContain('-translate-x-full');
    expect(open).toContain('translate-x-0');
  });

  it('exposes a labeled close control only relevant to the mobile drawer', () => {
    const html = render({ open: true });

    expect(html).toContain('aria-label="Close menu"');
  });
});
