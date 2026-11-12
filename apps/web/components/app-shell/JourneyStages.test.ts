import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { JourneyStages } from './JourneyStages';

function render(): string {
  return renderToStaticMarkup(createElement(JourneyStages));
}

describe('JourneyStages', () => {
  it('renders three numbered markers in order', () => {
    const html = render();
    const i01 = html.indexOf('01');
    const i02 = html.indexOf('02');
    const i03 = html.indexOf('03');

    expect(i01).toBeGreaterThanOrEqual(0);
    expect(i02).toBeGreaterThan(i01);
    expect(i03).toBeGreaterThan(i02);
  });

  it('labels each stage with its plan and one-line description', () => {
    const html = render();

    expect(html).toContain('LEARN');
    expect(html).toContain('PLUS');
    expect(html).toContain('Gain AI skills.');

    expect(html).toContain('BUILD');
    expect(html).toContain('PRO');
    expect(html).toContain('Create AI products.');

    expect(html).toContain('SELL');
    expect(html).toContain('MAX');
    expect(html).toContain('Find customers.');
  });

  it('applies a distinct accent per stage rather than one shared style', () => {
    const html = render();

    expect(html).toContain('text-plus');
    expect(html).toContain('text-primary');
    expect(html).toContain('text-secondary');
  });

  it('renders no links or buttons — this section is descriptive, not actionable', () => {
    const html = render();

    expect(html).not.toContain('<a ');
    expect(html).not.toContain('<button');
  });

  it('exposes an accessible list structure labeling the three stages', () => {
    const html = render();

    expect(html).toContain('role="list"');
    expect((html.match(/role="listitem"/g) ?? []).length).toBe(3);
    expect(html).toMatch(/aria-label="[^"]*journey[^"]*"/i);
  });

  it('lays out stages in a row on desktop and stacks them below lg', () => {
    const html = render();

    expect(html).toMatch(/lg:flex-row/);
    expect(html).toMatch(/flex-col/);
  });

  it('connects the three stages with an arrow between each, not after the last', () => {
    const html = render();

    expect((html.match(/lucide-arrow-right/g) ?? []).length).toBe(2);
  });

  it('shows each stage number in its own badge, separate from the stage content box', () => {
    const html = render();

    expect((html.match(/>01</g) ?? []).length).toBe(1);
    expect((html.match(/>02</g) ?? []).length).toBe(1);
    expect((html.match(/>03</g) ?? []).length).toBe(1);
  });
});
