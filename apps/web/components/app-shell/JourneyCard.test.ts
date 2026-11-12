import { createElement } from 'react';
import { GraduationCap } from 'lucide-react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { JourneyCard, type JourneyCardProps } from './JourneyCard';

function render(overrides: Partial<JourneyCardProps> = {}): string {
  const props: JourneyCardProps = {
    accent: 'plus',
    icon: GraduationCap,
    plan: 'PLUS',
    headline: 'Build your AI knowledge.',
    description: 'Learn AI from fundamentals to advanced concepts.',
    outcome: 'Become AI-skilled.',
    ctaLabel: 'Start Learning',
    href: '/access/ai_income_99',
    ...overrides,
  };
  return renderToStaticMarkup(createElement(JourneyCard, props));
}

describe('JourneyCard', () => {
  it('renders the headline, description, outcome and plan pill copy exactly as given', () => {
    const html = render();

    expect(html).toContain('Build your AI knowledge.');
    expect(html).toContain('Learn AI from fundamentals to advanced concepts.');
    expect(html).toContain('Become AI-skilled.');
    expect(html).toContain('PLUS');
  });

  it('links the primary action to the given destination with the given label', () => {
    const html = render({ ctaLabel: 'Explore Projects', href: '/access/ai_freelancing_499' });

    expect(html).toContain('href="/access/ai_freelancing_499"');
    expect(html).toContain('Explore Projects');
  });

  it('never renders a card-level subscription badge — "Your Plans" in the sidebar is the single source for that', () => {
    const html = render();

    expect(html).not.toMatch(/Active|Not active|Unavailable/);
  });

  it('applies a distinct accent per plan rather than one shared style', () => {
    expect(render({ accent: 'plus' })).toContain('bg-plus');
    expect(render({ accent: 'pro' })).toContain('bg-primary');
    expect(render({ accent: 'max' })).toContain('bg-secondary');
  });

  it('gives the Max CTA a darker teal background with white text for WCAG AA contrast, distinct from the Plus/Pro CTA color', () => {
    const html = render({ accent: 'max', ctaLabel: 'Find Opportunities', href: '/opportunities' });
    const ctaIndex = html.indexOf('Find Opportunities');
    const cta = html.slice(Math.max(0, ctaIndex - 400), ctaIndex);

    expect(cta).toMatch(/#0F766E/i);
    expect(cta).toMatch(/text-white/);
  });
});
