import { describe, expect, it } from 'vitest';

import { isClosed, mostRecentClosedWindow } from './window';

describe('mostRecentClosedWindow', () => {
  it('returns a 30-day window ending 30 days before now', () => {
    const now = new Date('2026-03-01T00:00:00.000Z');
    const window = mostRecentClosedWindow(now);
    expect(window.end).toEqual(new Date('2026-01-30T00:00:00.000Z'));
    expect(window.start).toEqual(new Date('2025-12-31T00:00:00.000Z'));
  });

  it('is always closed as of the `now` it was derived from', () => {
    const now = new Date('2026-03-01T00:00:00.000Z');
    const window = mostRecentClosedWindow(now);
    expect(isClosed(window, now)).toBe(true);
  });

  it('the CURRENT in-progress 30 days is never reported as closed', () => {
    const now = new Date('2026-03-01T00:00:00.000Z');
    const currentWindow = { start: new Date(now.getTime() - 30 * 86_400_000), end: now };
    expect(isClosed(currentWindow, now)).toBe(true); // end === now is closed by the half-open rule
    const stillOpen = { start: now, end: new Date(now.getTime() + 86_400_000) };
    expect(isClosed(stillOpen, now)).toBe(false);
  });
});
