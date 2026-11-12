import type { AccessResolution } from '@acos/core-entitlements';
import { funnelStateFor } from '@acos/core-entitlements';
import { getProduct, type ProductId } from '@acos/catalog';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// UNIT render test (fakes only — no database, no network) for the
// library page's retired-SKU exposure. COMMERCIAL-PO-17 requires the
// retired one-time ai_client_acquisition_1499 to never be offered to a
// customer who doesn't already own it, while an existing owner's access
// to it must be completely unaffected.

const state = vi.hoisted(() => ({
  resolution: null as AccessResolution | null,
  maxStatus: { state: 'inactive' } as
    | { state: 'active'; expiresAt: Date }
    | { state: 'inactive' }
    | { state: 'unavailable' },
}));

vi.mock('../../src/server/access', () => ({
  currentAccess: async () => state.resolution,
}));

// AppShell's Sidebar calls usePathname() for active-nav-state — stubbed
// the same way app/(app)/layout.test.ts and Sidebar.test.ts already do.
vi.mock('next/navigation', () => ({
  usePathname: () => '/access',
}));

// Phase 1G: the page now also resolves each product's CMS display name
// (getCustomerDisplayName, which reaches a real DB connection via
// commerceRepositories()). Faked here, same as currentAccess above, to
// keep this a true no-database unit render test — resolves to the
// catalog default, which is what "no CMS override" means in production
// too, so the retired-SKU assertions below (which only check hrefs/
// static copy, not the name) are unaffected.
vi.mock('../../src/server/customerDisplayName', () => ({
  getCustomerDisplayName: async (productId: ProductId) => getProduct(productId).name,
}));

// Max subscription status (AppShell's "Your Plans" block, and now the
// page's own Max resource card) is read separately from currentAccess()
// — faked here too, same no-database unit-test convention, so this stays
// a true no-network render test. Reads from `state` so individual tests
// can flip it to 'active' (default: 'inactive', reset in beforeEach).
vi.mock('../../src/server/clientFinderStatus', () => ({
  getMaxSubscriptionStatus: async () => state.maxStatus,
}));

// next/font/google's real export needs the Next.js compiler's own
// transform and isn't directly callable under Vitest — faked like any
// other environment-specific dependency (see app/(app)/layout.test.ts).
vi.mock('../../lib/fonts', () => ({
  inter: { variable: 'mock-inter-variable' },
}));

(globalThis as { React?: typeof React }).React = React;

beforeEach(() => {
  state.resolution = null;
  state.maxStatus = { state: 'inactive' };
});

async function renderPage(purchased: ProductId[]): Promise<string> {
  state.resolution = {
    granted: true,
    context: { customerEmail: 'buyer@example.com', purchased },
    funnel: funnelStateFor(purchased),
  };
  const { default: AccessPage } = await import('./page');
  return renderToStaticMarkup(await AccessPage());
}

async function renderAnonymous(): Promise<string> {
  state.resolution = { granted: false, reason: 'no-token', funnel: funnelStateFor([]) };
  const { default: AccessPage } = await import('./page');
  return renderToStaticMarkup(await AccessPage());
}

describe('Library page — retired legacy SKU exposure (COMMERCIAL-PO-17)', () => {
  it('never shows the retired ai_client_acquisition_1499 card at all, even when the customer owns it', async () => {
    // Trailing quote distinguishes the exact legacy-SKU href from the new
    // Max card's own /checkout/ai_client_acquisition_1499_subscription href,
    // which contains this string as a prefix.
    const htmlNotOwned = await renderPage(['ai_income_99', 'ai_freelancing_499']);
    expect(htmlNotOwned).not.toContain('/checkout/ai_client_acquisition_1499"');
    expect(htmlNotOwned).not.toContain('AI Client Acquisition System');

    // Owning the legacy SKU no longer gets it a card either — only the
    // Max card (below) represents the "SELL" slot now. The underlying
    // entitlement is unaffected; only this listing's card is gone (the
    // direct /access/ai_client_acquisition_1499 route still resolves,
    // see that route's own test coverage).
    const htmlOwned = await renderPage(['ai_income_99', 'ai_freelancing_499', 'ai_client_acquisition_1499']);
    expect(htmlOwned).not.toContain('AI Client Acquisition System');
    expect(htmlOwned).not.toContain('/access/ai_client_acquisition_1499"');
  });

  it('still shows the active ₹99/₹499 kits as purchasable when not owned', async () => {
    const html = await renderPage([]);
    expect(html).toContain('/checkout/ai_income_99');
    expect(html).toContain('/checkout/ai_freelancing_499');
  });
});

describe('Library page — Max resource card', () => {
  it('shows Max as Locked with a checkout CTA when the subscription is inactive', async () => {
    const html = await renderPage([]);
    const cardIndex = html.indexOf('AI Client Finder');
    const card = html.slice(Math.max(0, cardIndex - 1000), cardIndex + 1200);

    expect(cardIndex).toBeGreaterThan(-1);
    expect(card).toContain('SELL');
    expect(card).toContain('MAX');
    expect(card).toContain('Locked');
    expect(card).toContain('href="/checkout/ai_client_acquisition_1499_subscription"');
    expect(card).toContain('Add it');
    expect(card).toContain('Discover potential clients');
  });

  it('shows Max as Unlocked with an Open Resource action to /opportunities when the subscription is active', async () => {
    state.maxStatus = { state: 'active', expiresAt: new Date('2026-12-01T00:00:00.000Z') };
    const html = await renderPage([]);
    const cardIndex = html.indexOf('AI Client Finder');
    const card = html.slice(Math.max(0, cardIndex - 1000), cardIndex + 1200);

    expect(card).toContain('Unlocked');
    expect(card).toContain('href="/opportunities"');
    expect(card).toContain('Open Resource');
  });
});

describe('Library page — learner AppShell integration', () => {
  it('renders the authenticated view inside the shared shell (Sidebar nav + Your Plans)', async () => {
    const html = await renderPage([]);

    expect(html).toContain('ACOS'); // Sidebar wordmark
    expect(html).toContain('Dashboard');
    expect(html).toContain('Your Plans');
    expect(html).toContain('Your Resources'); // new hero heading
  });

  it('does not wrap the anonymous (pre-login) view in the shell — it is its own pre-auth entry point', async () => {
    const html = await renderAnonymous();

    expect(html).not.toContain('ACOS');
    expect(html).not.toContain('Your Plans');
    expect(html).toContain('Open your library'); // existing anonymous content, unchanged
  });

  it('never activates Max from the retired one-time ai_client_acquisition_1499 kit, even when the customer owns it', async () => {
    const html = await renderPage(['ai_client_acquisition_1499']);
    const maxRowIndex = html.lastIndexOf('>Max<');
    const maxRow = html.slice(maxRowIndex, maxRowIndex + 400);

    // getMaxSubscriptionStatus is mocked to always return 'inactive' in
    // this file — proving the retired kit in `purchased` has no path to
    // flipping it, since Sidebar/PlanStatus never read `purchased` for
    // Max at all.
    expect(maxRow).toContain('Not active');
  });

  it('still renders a working logout action, via the header account menu rather than a standalone page button', async () => {
    const html = await renderPage([]);
    const matches = html.match(/log ?out/gi) ?? [];

    // Exactly one "Log out" control — the header's account menu item —
    // not a duplicate standalone button left over on the page itself.
    expect(matches.length).toBe(1);
    expect(html).toContain('role="menuitem"');
  });

  it('renders the account menu closed by default, with the ARIA contract a real menu needs', async () => {
    const html = await renderPage([]);

    expect(html).toContain('aria-haspopup="menu"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).toContain('role="menu"');
  });

  it('renders the header (and its account menu) before the page body, not after the hero', async () => {
    const html = await renderPage([]);
    const logoutIndex = html.search(/log ?out/i);
    const heroHeadingIndex = html.indexOf('Your Resources');

    expect(logoutIndex).toBeGreaterThan(-1);
    expect(logoutIndex).toBeLessThan(heroHeadingIndex);
  });
});

describe('Library page — Your Resources hero', () => {
  it('renders the approved heading, description, and mountain journey artwork', async () => {
    const html = await renderPage([]);

    expect(html).toContain('Your Resources');
    // renderToStaticMarkup HTML-escapes the apostrophe as &#x27; — matching
    // the raw escaped form here rather than a literal "'" (the browser
    // renders either the same way).
    expect(html).toContain('Everything you&#x27;ve unlocked, organised in one place.');
    expect(html).toContain('/dashboard/journey-hero.webp');
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

  it('shows the actual unlocked-resource count, not a hardcoded number', async () => {
    const htmlZero = await renderPage([]);
    expect(htmlZero).toContain('0 resources available');

    const htmlOne = await renderPage(['ai_income_99']);
    expect(htmlOne).toContain('1 resource available');

    // Owning the retired legacy SKU no longer adds to the count — it has
    // no card any more — and Max (mocked inactive by default) doesn't
    // either.
    const htmlAll = await renderPage(['ai_income_99', 'ai_freelancing_499', 'ai_client_acquisition_1499']);
    expect(htmlAll).toContain('2 resources available');

    state.maxStatus = { state: 'active', expiresAt: new Date('2026-12-01T00:00:00.000Z') };
    const htmlAllPlusMax = await renderPage(['ai_income_99', 'ai_freelancing_499']);
    expect(htmlAllPlusMax).toContain('3 resources available');
  });
});

describe('Library page — resource cards', () => {
  it('labels each resource with its journey and plan', async () => {
    const html = await renderPage(['ai_income_99', 'ai_freelancing_499']);

    expect(html).toContain('LEARN');
    expect(html).toContain('BUILD');
    expect(html).toContain('SELL');
    expect(html).toContain('PLUS');
    expect(html).toContain('PRO');
    expect(html).toContain('MAX');
  });

  it('never renders the retired legacy "AI Client Acquisition System" product name anywhere on the page', async () => {
    const html = await renderPage(['ai_income_99', 'ai_freelancing_499', 'ai_client_acquisition_1499']);
    expect(html).not.toContain('AI Client Acquisition System');
  });

  it('shows Unlocked status and an Open Resource action linking to the existing destination for an owned product', async () => {
    const html = await renderPage(['ai_income_99']);
    const cardIndex = html.indexOf('AI Income Starter Kit');
    // Status badge now sits ahead of the title (beside the plan pill), so
    // the card's window must look backward too, not just forward.
    const card = html.slice(Math.max(0, cardIndex - 1000), cardIndex + 1200);

    expect(card).toContain('Unlocked');
    expect(card).toContain('href="/access/ai_income_99"');
    expect(card).toContain('Open Resource');
  });

  it('shows Locked status and the existing checkout destination for a product not yet owned', async () => {
    const html = await renderPage([]);
    const cardIndex = html.indexOf('AI Income Starter Kit');
    const card = html.slice(Math.max(0, cardIndex - 1000), cardIndex + 1200);

    expect(card).toContain('Locked');
    expect(card).toContain('href="/checkout/ai_income_99"');
  });

  it('reuses the existing approved /home description copy for Income and Freelancing, verbatim', async () => {
    const html = await renderPage(['ai_income_99', 'ai_freelancing_499']);

    expect(html).toContain(
      'Learn AI from fundamentals to advanced concepts through structured roadmaps, interactive lessons and guided learning.',
    );
    expect(html).toContain(
      'Build real-world AI applications using project blueprints, architecture, source code and implementation guides.',
    );
  });
});
