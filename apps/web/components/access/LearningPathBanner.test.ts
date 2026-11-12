import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import { LearningPathBanner } from './LearningPathBanner';

function render(displayName = 'AI Income Starter Kit'): string {
  return renderToStaticMarkup(createElement(LearningPathBanner, { displayName }));
}

describe('LearningPathBanner', () => {
  it('renders the PLUS badge', () => {
    expect(render()).toContain('PLUS');
  });

  it('rounds only the bottom corners, since the top now sits flush against the header with no gap', () => {
    const html = render();
    const outerDiv = html.match(/^<div class="([^"]*)"/)?.[1] ?? '';

    expect(outerDiv).toContain('rounded-b-2xl');
    expect(outerDiv).not.toContain('rounded-2xl'); // "rounded-b-2xl" is a different string
  });

  it('renders the given display name as the heading', () => {
    expect(render('Custom Kit Name')).toContain('Custom Kit Name');
  });

  it('renders the exact approved supporting description copy', () => {
    expect(render()).toContain('Explore structured learning paths and build practical AI skills.');
  });

  it('sizes the subtitle per the canonical "Banner subtitle" spec: 14px mobile, 15px tablet (md), 16px desktop (lg)', () => {
    const html = render();
    const subtitle = html.match(/<p class="([^"]*)">Explore structured/)?.[1] ?? '';

    expect(subtitle).toContain('text-[14px]');
    expect(subtitle).toContain('md:text-[15px]');
    expect(subtitle).toContain('lg:text-[16px]');
  });

  it('keeps the legacy "Choose a learning path" marker available to assistive tech, for the CMS-PO-015 security regression tests', () => {
    expect(render()).toMatch(/class="sr-only"[^>]*>Choose a learning path to get started\./);
  });

  it('references the expected banner artwork path', () => {
    expect(render()).toContain('src="/images/plus-learning-banner.png"');
  });

  it('crops the artwork to fill its box (object-cover) and blends its white background into the gradient (mix-blend-multiply), rather than leaving a visible white rectangle', () => {
    const html = render();

    expect(html).toMatch(/<img[^>]*class="[^"]*object-cover[^"]*"/);
    expect(html).toMatch(/<img[^>]*class="[^"]*mix-blend-multiply[^"]*"/);
  });

  it('scales the artwork up to crop out its excess internal whitespace margin, without stretching it out of proportion', () => {
    const html = render();

    expect(html).toMatch(/<img[^>]*class="[^"]*scale-125[^"]*"/);
  });

  it('clips the artwork to its own box so the scaled-up image never visually spills into the text column', () => {
    const html = render();
    const illustrationWrapper = html.match(/<div class="[^"]*sm:w-\[40%\][^"]*">/)?.[0];

    expect(illustrationWrapper).toContain('overflow-hidden');
  });

  it('marks the artwork as decorative with an empty alt, since it is presentation only', () => {
    expect(render()).toMatch(/<img[^>]*alt=""/);
  });

  it('renders a graduation-cap icon immediately to the left of the banner text, in an ~88-90px light-blue rounded box', () => {
    const html = render();

    expect(html).toContain('lucide-graduation-cap');
    expect(html).toMatch(/<span[^>]*class="[^"]*bg-\[#DBEAFE\][^"]*"[^>]*>[\s\S]*lucide-graduation-cap/);
    expect(html).toMatch(/h-\[8[89]px\]/);
    expect(html).toMatch(/w-\[8[89]px\]/);
  });

  it('colors the graduation-cap icon with the Plus accent (#2563EB)', () => {
    const html = render();
    const svgTag = html.match(/<svg[^>]*class="[^"]*"[^>]*>/)?.[0];

    expect(svgTag).toContain('lucide-graduation-cap');
    expect(svgTag).toMatch(/text-plus/);
  });

  it('gives the heading bold weight (previously too light)', () => {
    expect(render()).toMatch(/<h1[^>]*class="[^"]*font-bold[^"]*"/);
  });

  it('sizes the heading per the canonical "Main banner title" spec: 26px mobile, 30px tablet (md, 768px), 34px desktop (lg, 1024px+)', () => {
    const html = render();
    const h1 = html.match(/<h1[^>]*class="([^"]*)"/)?.[1] ?? '';

    expect(h1).toContain('text-[26px]');
    expect(h1).toContain('md:text-[30px]');
    expect(h1).toContain('lg:text-[34px]');
  });

  it('gives the heading the canonical 41px desktop line-height (31px/36px at mobile/tablet, same ratio) and keeps the existing ~-0.8px letter-spacing', () => {
    const html = render();
    const h1 = html.match(/<h1[^>]*class="([^"]*)"/)?.[1] ?? '';

    expect(h1).toContain('leading-[31px]');
    expect(h1).toContain('md:leading-[36px]');
    expect(h1).toContain('lg:leading-[41px]');
    expect(h1).toContain('tracking-[-0.8px]');
  });

  it('keeps the heading in the existing dark-navy foreground color token', () => {
    expect(render()).toMatch(/<h1[^>]*class="[^"]*text-foreground[^"]*"/);
  });
});
