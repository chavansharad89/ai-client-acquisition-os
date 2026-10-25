import type { AccessResolution } from '@acos/core-entitlements';
import { funnelStateFor } from '@acos/core-entitlements';
import type { ProductId } from '@acos/catalog';
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
}));

vi.mock('../../src/server/access', () => ({
  currentAccess: async () => state.resolution,
}));

(globalThis as { React?: typeof React }).React = React;

beforeEach(() => {
  state.resolution = null;
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

describe('Library page — retired legacy SKU exposure (COMMERCIAL-PO-17)', () => {
  it('does not show the retired ai_client_acquisition_1499 as something to add when the customer does not own it', async () => {
    const html = await renderPage(['ai_income_99', 'ai_freelancing_499']);
    expect(html).not.toContain('/checkout/ai_client_acquisition_1499');
  });

  it('still shows the active ₹99/₹499 kits as purchasable when not owned', async () => {
    const html = await renderPage([]);
    expect(html).toContain('/checkout/ai_income_99');
    expect(html).toContain('/checkout/ai_freelancing_499');
  });

  it('still opens the retired SKU normally for a customer who already owns it', async () => {
    const html = await renderPage(['ai_income_99', 'ai_freelancing_499', 'ai_client_acquisition_1499']);
    expect(html).toContain('/access/ai_client_acquisition_1499');
    expect(html).toContain('Yours. Open it any time.');
    expect(html).not.toContain('/checkout/ai_client_acquisition_1499');
  });
});
