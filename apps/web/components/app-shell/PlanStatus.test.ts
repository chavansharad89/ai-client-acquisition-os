import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import type { MaxSubscriptionStatus } from '@/src/server/clientFinderStatus';

import { PlanStatus } from './PlanStatus';

function render(plusActive: boolean, proActive: boolean, maxStatus: MaxSubscriptionStatus): string {
  return renderToStaticMarkup(createElement(PlanStatus, { plusActive, proActive, maxStatus }));
}

describe('PlanStatus', () => {
  it('shows Plus and Pro as Active when the entitlement data says so', () => {
    const html = render(true, true, { state: 'inactive' });

    expect(html).toContain('Plus');
    expect(html).toContain('Pro');
    expect((html.match(/Active/g) ?? []).length).toBe(2);
  });

  it('shows "Not active" for Plus/Pro when the entitlement data does not include them', () => {
    const html = render(false, false, { state: 'inactive' });

    expect((html.match(/Not active/g) ?? []).length).toBeGreaterThanOrEqual(2);
  });

  it('shows Max as Active with its expiry date only when the Client Finder status says active', () => {
    const html = render(false, false, { state: 'active', expiresAt: new Date('2027-01-15T00:00:00Z') });

    expect(html).toContain('Max active until');
    expect(html).toContain('Jan 15, 2027');
  });

  it('shows Max as "Not active" — never inferring it from an unrelated Plus/Pro Active state', () => {
    // Plus and Pro both active, Max explicitly inactive: Max must not be
    // swept into "Active" just because the other two are.
    const html = render(true, true, { state: 'inactive' });
    const maxRowIndex = html.lastIndexOf('Max');
    const maxRow = html.slice(maxRowIndex, maxRowIndex + 400);

    expect(maxRow).toContain('Not active');
    expect(maxRow).not.toContain('>Active<');
  });

  it('shows Max as "Unavailable" when the subscription check could not be completed, distinct from Active or Not active', () => {
    const html = render(false, false, { state: 'unavailable' });

    expect(html).toContain('Unavailable');
    expect(html).not.toContain('Max active until');
  });

  it('never renders a raw userId, subscription id, or ISO date string', () => {
    const html = render(true, true, { state: 'active', expiresAt: new Date('2027-01-15T00:00:00Z') });

    expect(html).not.toMatch(/2027-01-15T/); // raw ISO timestamp
    expect(html).not.toMatch(/user[-_]?id/i);
    expect(html).not.toMatch(/sub_[a-zA-Z0-9]/); // a Razorpay-style subscription id shape
  });
});
