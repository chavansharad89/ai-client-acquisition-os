import { funnelStateFor } from '@acos/core-entitlements';
import type { ProductId } from '@acos/catalog';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { WebAccessResolution } from '../../../src/server/access';
import type { MaxSubscriptionStatus } from '../../../src/server/clientFinderStatus';

// UNIT render test (fakes only — no database, no network), same
// convention as the rest of the (app) route group (see layout.test.ts):
// fake currentAccess() and getMaxSubscriptionStatus(), assert on the
// rendered HTML string.

const state = vi.hoisted(() => ({
  resolution: null as WebAccessResolution | null,
  maxStatus: { state: 'inactive' } as MaxSubscriptionStatus,
}));

vi.mock('../../../src/server/access', () => ({
  currentAccess: async () => state.resolution,
}));

vi.mock('../../../src/server/clientFinderStatus', () => ({
  getMaxSubscriptionStatus: async () => state.maxStatus,
}));

beforeEach(() => {
  state.resolution = null;
  state.maxStatus = { state: 'inactive' };
});

async function renderPage(purchased: ProductId[], maxStatus?: MaxSubscriptionStatus): Promise<string> {
  state.resolution = {
    granted: true,
    context: { customerEmail: 'learner@example.com', purchased, userId: 'user-1' },
    funnel: funnelStateFor(purchased),
  };
  if (maxStatus) state.maxStatus = maxStatus;
  const { default: HomePage } = await import('./page');
  return renderToStaticMarkup(await HomePage());
}

describe('(app)/home dashboard — Section A: editorial hero', () => {
  it('shows the approved hero heading, supporting heading and description', async () => {
    const html = await renderPage([]);

    expect(html).toContain('Turn AI knowledge into real-world impact.');
    expect(html).toContain('Learn new skills. Build products. Find customers.');
    expect(html).toContain('One platform to take you from AI learner to AI entrepreneur.');
  });

  it('restates the three value props inline under the hero description', async () => {
    const html = await renderPage([]);

    expect(html).toContain('Gain in-demand AI skills');
    expect(html).toContain('Build real products');
    expect(html).toContain('Acquire real clients');
  });

  it('pulls the hero section flush to the header/sides via negative margins matching AppShell\'s own padding', async () => {
    const html = await renderPage([]);
    const heroIndex = html.indexOf('<section');
    const heroTag = html.slice(heroIndex, html.indexOf('>', heroIndex) + 1);

    expect(heroTag).toContain('-mx-6');
    expect(heroTag).toContain('-mt-6');
    expect(heroTag).toContain('lg:-mx-10');
    expect(heroTag).toContain('lg:-mt-8');
  });

  it('uses the exact same background gradient as the Plus catalogue banner (LearningPathBanner), for a consistent banner treatment across /home, /access, and /access/[productId]', async () => {
    const html = await renderPage([]);
    const heroIndex = html.indexOf('<section');
    const heroTag = html.slice(heroIndex, html.indexOf('>', heroIndex) + 1);

    expect(heroTag).toContain('bg-[linear-gradient(135deg,#EEF3FF,#F2EDFF)]');
  });
});

describe('(app)/home dashboard — Section B: your AI journey', () => {
  it('shows the section heading and supporting text', async () => {
    const html = await renderPage([]);

    expect(html).toContain('Your AI journey');
    expect(html).toContain('Three stages. One continuous journey.');
  });

  it('renders the three connected stages via JourneyStages', async () => {
    const html = await renderPage([]);

    // JourneyStages itself is unit-tested; here we only confirm the
    // dashboard actually mounts it (its distinctive accessible list
    // label is a reliable, specific signal of that).
    expect(html).toContain('Your AI journey: three stages');
  });
});

describe('(app)/home dashboard — Section C: workspace cards', () => {
  it('shows the section heading', async () => {
    const html = await renderPage([]);

    expect(html).toContain('Choose where to make progress');
  });

  it('renders the Learn/Plus card with the approved copy, linking to the verified learning destination', async () => {
    const html = await renderPage([]);

    expect(html).toContain('Build your AI knowledge.');
    expect(html).toContain(
      'Learn AI from fundamentals to advanced concepts through structured roadmaps, interactive lessons and guided learning.',
    );
    expect(html).toContain('href="/access/ai_income_99"');
    expect(html).toContain('Explore Learning');
  });

  it('renders the Build/Pro card with the approved copy, linking to the existing Pro product page', async () => {
    const html = await renderPage([]);

    expect(html).toContain('Turn knowledge into working products.');
    expect(html).toContain(
      'Build real-world AI applications using project blueprints, architecture, source code and implementation guides.',
    );
    expect(html).toContain('href="/access/ai_freelancing_499"');
    expect(html).toContain('Explore Projects');
  });

  it('renders the Sell/Max card with the approved copy, linking to the existing Client Finder opportunities page', async () => {
    const html = await renderPage([]);

    expect(html).toContain('Turn your skills into income.');
    expect(html).toContain(
      'Discover potential clients, identify opportunities, qualify prospects and accelerate customer acquisition with AI.',
    );
    expect(html).toContain('href="/opportunities"');
    expect(html).toContain('Find Opportunities');
  });

  it('never renders a card-level subscription badge — the sidebar "Your Plans" block is the single source for that', async () => {
    const html = await renderPage(['ai_income_99', 'ai_freelancing_499'], { state: 'active', expiresAt: new Date('2027-01-15T00:00:00Z') });
    const cardsStart = html.indexOf('Choose where to make progress');
    const cardsHtml = html.slice(cardsStart);

    expect(cardsHtml).not.toMatch(/Active|Not active|Unavailable/);
  });
});

describe('(app)/home dashboard — no fabricated content', () => {
  it('never renders a progress percentage, lesson count, or revenue figure', async () => {
    const html = await renderPage(['ai_income_99', 'ai_freelancing_499']);
    // Strip inline-style attributes first: next/image's `fill` mode emits
    // legitimate CSS like style="height:100%;width:100%", which isn't
    // user-visible content and shouldn't trip this guard.
    const visibleHtml = html.replace(/\sstyle="[^"]*"/g, '');

    expect(visibleHtml).not.toMatch(/\d+%/);
    expect(html).not.toMatch(/lessons? completed/i);
    expect(html).not.toMatch(/clients? acquired/i);
    expect(html).not.toMatch(/₹[\d,]+\s*(earned|revenue)/i);
  });

  it('does not expose internal subscription or user identifiers', async () => {
    const html = await renderPage([], { state: 'active', expiresAt: new Date('2027-01-15T00:00:00Z') });

    expect(html).not.toMatch(/user[-_]?id/i);
    expect(html).not.toMatch(/sub_[a-zA-Z0-9]/);
  });

  it('never fabricates a notification count or unread indicator', async () => {
    const html = await renderPage([]);

    expect(html).not.toMatch(/aria-label="[^"]*unread|notification-dot/i);
  });
});
