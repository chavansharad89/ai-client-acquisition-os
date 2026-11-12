import { createElement } from 'react';
import { GraduationCap } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { ResourceCard, type ResourceCardProps } from './ResourceCard';

function render(overrides: Partial<ResourceCardProps> = {}): string {
  const props: ResourceCardProps = {
    accent: 'plus',
    icon: GraduationCap,
    journeyLabel: 'LEARN',
    planLabel: 'PLUS',
    title: 'AI Income Starter Kit',
    unlocked: true,
    href: '/access/ai_income_99',
    ctaLabel: 'Open Resource',
    ...overrides,
  };
  return renderToStaticMarkup(createElement(ResourceCard, props));
}

describe('ResourceCard', () => {
  it('renders the journey/plan badge and title exactly as given', () => {
    const html = render();

    expect(html).toContain('LEARN');
    expect(html).toContain('PLUS');
    expect(html).toContain('AI Income Starter Kit');
  });

  it('renders an optional description when provided', () => {
    const html = render({ description: 'Learn AI from fundamentals to advanced concepts.' });

    expect(html).toContain('Learn AI from fundamentals to advanced concepts.');
  });

  it('renders no description paragraph when none is given, instead of inventing one', () => {
    const html = render({ description: undefined });

    // Only the badge/title text should be present — no stray body copy.
    expect(html).not.toContain('undefined');
  });

  it('shows an Unlocked status and links the given action when unlocked', () => {
    const html = render({ unlocked: true, href: '/access/ai_income_99', ctaLabel: 'Open Resource' });

    expect(html).toContain('Unlocked');
    expect(html).toContain('href="/access/ai_income_99"');
    expect(html).toContain('Open Resource');
  });

  it('shows a Locked status, the price, and the checkout link when not unlocked', () => {
    const html = render({
      unlocked: false,
      priceLabel: '₹99',
      href: '/checkout/ai_income_99',
      ctaLabel: 'Add it',
    });

    expect(html).toContain('Locked');
    expect(html).toContain('₹99');
    expect(html).toContain('href="/checkout/ai_income_99"');
    expect(html).toContain('Add it');
  });

  it('never renders a price when the resource is already unlocked', () => {
    const html = render({ unlocked: true, priceLabel: '₹99' });

    expect(html).not.toContain('₹99');
  });

  it('places the status badge next to the plan pill/title, not floating in a separate block before the CTA', () => {
    const html = render({ unlocked: true, journeyLabel: 'LEARN', planLabel: 'PLUS', ctaLabel: 'Open Resource' });

    const pillIndex = html.indexOf('LEARN');
    const badgeIndex = html.indexOf('Unlocked');
    const ctaIndex = html.indexOf('Open Resource');

    // Badge sits in the same small block as the plan pill (close together,
    // both ahead of the title/description), and strictly before the CTA —
    // never in a column of its own above the button.
    expect(badgeIndex).toBeGreaterThan(pillIndex);
    expect(badgeIndex - pillIndex).toBeLessThan(700);
    expect(badgeIndex).toBeLessThan(ctaIndex);
  });

  it('renders the status badge even for a card with no description (the legacy kit case), still ahead of the CTA', () => {
    const html = render({ unlocked: true, description: undefined, ctaLabel: 'Open Resource' });
    const badgeIndex = html.indexOf('Unlocked');
    const ctaIndex = html.indexOf('Open Resource');

    expect(badgeIndex).toBeGreaterThan(-1);
    expect(badgeIndex).toBeLessThan(ctaIndex);
  });

  it('sizes the icon container to 56px (h-14 w-14) and the icon itself to 28px (h-7 w-7)', () => {
    const html = render();
    const iconTagIndex = html.indexOf('lucide-graduation-cap');
    const iconTag = html.slice(Math.max(0, iconTagIndex - 200), iconTagIndex + 50);

    expect(html).toContain('h-14 w-14');
    expect(iconTag).toContain('h-7 w-7');
  });

  it('applies a distinct accent per journey rather than one shared style', () => {
    expect(render({ accent: 'plus' })).toContain('bg-plus');
    expect(render({ accent: 'pro' })).toContain('bg-primary');
    expect(render({ accent: 'max' })).toContain('bg-secondary');
  });

  it('gives the unlocked Max CTA the darker teal/white contrast color, distinct from Plus/Pro', () => {
    const html = render({ accent: 'max', unlocked: true, ctaLabel: 'Open Resource', href: '/access/x' });
    const ctaIndex = html.indexOf('Open Resource');
    const cta = html.slice(Math.max(0, ctaIndex - 400), ctaIndex);

    expect(cta).toMatch(/#0F766E/i);
    expect(cta).toMatch(/text-white/);
  });
});
