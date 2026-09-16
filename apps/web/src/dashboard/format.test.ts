import { describe, expect, it } from 'vitest';

import type { Metric } from '@acos/core-acquisition';

import { formatDue, formatMetric, formatStalled } from './format';

const metric = (over: Partial<Metric>): Metric => ({
  key: 'k',
  label: 'L',
  value: 0,
  format: 'count',
  note: 'n',
  ...over,
});

describe('metric formatting', () => {
  it('renders money as rupees, never as raw paise', () => {
    expect(formatMetric(metric({ format: 'paise', value: 30_000_000 }))).toBe('₹3,00,000');
    expect(formatMetric(metric({ format: 'paise', value: 30_000_000 }))).not.toContain('30000000');
  });

  it('uses Indian digit grouping', () => {
    expect(formatMetric(metric({ format: 'paise', value: 1_00_00_000 }))).toBe('₹1,00,000');
  });

  it('keeps a decimal on small percentages, where the difference matters', () => {
    expect(formatMetric(metric({ format: 'percent', value: 0.024 }))).toBe('2.4%');
    expect(formatMetric(metric({ format: 'percent', value: 0.42 }))).toBe('42%');
  });

  it('renders counts plainly', () => {
    expect(formatMetric(metric({ format: 'count', value: 1234 }))).toBe('1,234');
  });

  it('handles zero in every format', () => {
    for (const format of ['count', 'percent', 'paise'] as const) {
      expect(formatMetric(metric({ format, value: 0 })).length).toBeGreaterThan(0);
    }
  });
});

describe('stalled labels', () => {
  it('reads as English, not as a timestamp', () => {
    expect(formatStalled(0)).toBe('today');
    expect(formatStalled(1)).toBe('since yesterday');
    expect(formatStalled(5)).toBe('for 5 days');
    expect(formatStalled(21)).toBe('for 3 weeks');
    expect(formatStalled(90)).toBe('for 3 months');
  });
});

describe('due labels', () => {
  const now = new Date('2026-10-05T09:00:00.000Z');
  const inDays = (n: number) => new Date(now.getTime() + n * 86_400_000);

  it('states overdue plainly rather than showing a past date', () => {
    expect(formatDue(inDays(-3), now)).toBe('3 days overdue');
    expect(formatDue(inDays(-1), now)).toBe('1 day overdue');
  });

  it('labels today and tomorrow by name', () => {
    expect(formatDue(inDays(0), now)).toBe('due today');
    expect(formatDue(inDays(1), now)).toBe('due tomorrow');
  });

  it('returns null when there is no due date', () => {
    expect(formatDue(undefined, now)).toBeNull();
  });
});
