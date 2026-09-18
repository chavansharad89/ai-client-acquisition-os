import { describe, expect, it } from 'vitest';

import { classifyStaleness, SIGNAL_FRESH_DAYS, type ResearchSignal } from './index';

const NOW = new Date('2026-07-01T09:00:00.000Z');
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const signal = (over: Partial<ResearchSignal> = {}): ResearchSignal => ({
  kind: 'JOB_POST',
  signal: 'hiring a content writer',
  confidence: 80,
  observedAt: daysAgo(2),
  ...over,
});

describe('classifyStaleness', () => {
  it('classifies FRESH when an active signal is within SIGNAL_FRESH_DAYS', () => {
    expect(classifyStaleness([signal({ observedAt: daysAgo(1) })], NOW)).toBe('FRESH');
  });

  it('classifies FRESH exactly at the SIGNAL_FRESH_DAYS boundary', () => {
    expect(classifyStaleness([signal({ observedAt: daysAgo(SIGNAL_FRESH_DAYS) })], NOW)).toBe(
      'FRESH',
    );
  });

  it('classifies STALE the day after the SIGNAL_FRESH_DAYS boundary', () => {
    expect(classifyStaleness([signal({ observedAt: daysAgo(SIGNAL_FRESH_DAYS + 1) })], NOW)).toBe(
      'STALE',
    );
  });

  it('classifies STALE for a signal that has decayed but not aged out entirely', () => {
    expect(classifyStaleness([signal({ observedAt: daysAgo(90) })], NOW)).toBe('STALE');
  });

  it('classifies SUPERSEDED when every signal has been superseded', () => {
    const signals = [
      signal({ observedAt: daysAgo(1), supersededAt: daysAgo(0) }),
      signal({ observedAt: daysAgo(5), supersededAt: daysAgo(0) }),
    ];
    expect(classifyStaleness(signals, NOW)).toBe('SUPERSEDED');
  });

  it('classifies SUPERSEDED when there are no signals at all', () => {
    expect(classifyStaleness([], NOW)).toBe('SUPERSEDED');
  });

  it('ignores superseded signals even when they are recent, and classifies on the remaining active ones', () => {
    const signals = [
      signal({ observedAt: daysAgo(0), supersededAt: daysAgo(0) }), // recent but superseded
      signal({ observedAt: daysAgo(90) }), // old, but the only active evidence
    ];
    expect(classifyStaleness(signals, NOW)).toBe('STALE');
  });

  it('is FRESH when at least one active signal among several is still fresh', () => {
    const signals = [signal({ observedAt: daysAgo(90) }), signal({ observedAt: daysAgo(1) })];
    expect(classifyStaleness(signals, NOW)).toBe('FRESH');
  });

  it('is deterministic — the same signals and `now` classify identically every call', () => {
    const signals = [signal({ observedAt: daysAgo(45) })];
    expect(classifyStaleness(signals, NOW)).toBe(classifyStaleness(signals, NOW));
  });
});
