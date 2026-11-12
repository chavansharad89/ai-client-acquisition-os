import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LearningPathCard, type LearningPathCardProps } from './LearningPathCard';

function render(overrides: Partial<LearningPathCardProps> = {}): string {
  const props: LearningPathCardProps = {
    id: 'path-1',
    title: 'AI Engineering',
    href: '/access/ai_income_99?path=abc',
    ...overrides,
  };
  return renderToStaticMarkup(createElement(LearningPathCard, props));
}

describe('LearningPathCard', () => {
  it('renders the title exactly as given', () => {
    expect(render({ title: 'System Design' })).toContain('System Design');
  });

  it('sizes the title per the canonical "Card titles" spec: 18px/700/24px desktop, 17px tablet, 16px mobile', () => {
    const html = render({ title: 'System Design' });
    const titleSpan = html.match(/<span class="([^"]*)">System Design/)?.[1] ?? '';

    expect(titleSpan).toContain('text-[16px]');
    expect(titleSpan).toContain('md:text-[17px]');
    expect(titleSpan).toContain('lg:text-[length:var(--acos-type-lg)]');
    expect(titleSpan).toContain('font-bold');
  });

  it('sizes the description per the canonical "Card descriptions" spec: 14px/400/21px desktop/tablet, 13px mobile', () => {
    const html = render({ description: 'Some description text.' });
    const descSpan = html.match(/<span class="([^"]*)">Some description text\./)?.[1] ?? '';

    expect(descSpan).toContain('text-[13px]');
    expect(descSpan).toContain('md:text-[length:var(--acos-type-base)]');
  });

  it('links to the given href', () => {
    expect(render({ href: '/access/ai_income_99?path=xyz' })).toContain('href="/access/ai_income_99?path=xyz"');
  });

  it('renders an optional description when provided', () => {
    const html = render({ description: 'Learn to design scalable systems.' });

    expect(html).toContain('Learn to design scalable systems.');
  });

  it('renders no description element when none is given, instead of inventing one', () => {
    const html = render({ description: undefined });

    expect(html).not.toContain('undefined');
    expect(html).not.toContain('null');
  });

  it('wraps the whole card in a single anchor, so the entire card is keyboard-activatable', () => {
    expect(render().trimStart().startsWith('<a ')).toBe(true);
  });

  it('renders the cover illustration on the left, before the text content, with a decorative aria-hidden svg', () => {
    const html = render();
    const svgIndex = html.indexOf('<svg');
    const titleIndex = html.indexOf('AI Engineering');

    expect(svgIndex).toBeGreaterThan(-1);
    expect(svgIndex).toBeLessThan(titleIndex);
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders the identical cover for the same content id regardless of title/description (deterministic, not fabricated per-copy)', () => {
    const htmlA = render({ id: 'same-id', title: 'Path A', description: 'desc a' });
    const htmlB = render({ id: 'same-id', title: 'Path B', description: undefined });
    const svgA = htmlA.match(/<svg[\s\S]*?<\/svg>/)?.[0];
    const svgB = htmlB.match(/<svg[\s\S]*?<\/svg>/)?.[0];

    expect(svgA).toBeTruthy();
    expect(svgA).toEqual(svgB);
  });

  it('renders a circular arrow action, in the Plus blue accent, after the text content', () => {
    const html = render();
    const arrowIndex = html.indexOf('lucide-arrow-right');
    const titleIndex = html.indexOf('AI Engineering');

    expect(arrowIndex).toBeGreaterThan(titleIndex);
    expect(html).toMatch(/<span[^>]*class="[^"]*rounded-full[^"]*"[^>]*>[\s\S]*lucide-arrow-right/);
  });

  it('does not render a text CTA label — the circular arrow is the only action, per the approved reference', () => {
    expect(render()).not.toContain('Explore Learning Path');
  });

  it('gives the card a white surface, a subtle border, rounded corners and a hover elevation transition', () => {
    const html = render();

    expect(html).toMatch(/<a[^>]*class="[^"]*bg-card[^"]*"/);
    expect(html).toMatch(/<a[^>]*class="[^"]*border[^"]*"/);
    expect(html).toMatch(/<a[^>]*class="[^"]*rounded-2xl[^"]*"/);
    expect(html).toMatch(/<a[^>]*class="[^"]*shadow-sm[^"]*"/);
    expect(html).toMatch(/<a[^>]*class="[^"]*hover:shadow-md[^"]*"/);
  });
});
