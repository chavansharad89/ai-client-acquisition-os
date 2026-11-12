import { describe, expect, it } from 'vitest';

import { deriveEntityStatus, type StatusObservationRecord } from './entityRepository';

// Global Entity Architecture — OQ-9's Entity Status derivation
// precedence. Pure function, no database — see
// tests/integration/discovery.integration.test.ts for the real-Postgres
// proof of recordStatusObservation/getStatusObservations.

const FRESH_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // mirrors GOOGLE_PLACES_STATUS's existing 30-day window

function isFreshWithin(now: Date) {
  return (observedAt: Date) => now.getTime() - observedAt.getTime() <= FRESH_WINDOW_MS;
}

describe('deriveEntityStatus (OQ-9)', () => {
  const now = new Date('2026-06-01T00:00:00.000Z');

  it('derives UNKNOWN when there are no observations at all', () => {
    expect(deriveEntityStatus([], isFreshWithin(now))).toBe('UNKNOWN');
  });

  it('derives UNKNOWN when every observation is stale', () => {
    const observations: StatusObservationRecord[] = [
      { status: 'CLOSED_PERMANENTLY', observedAt: new Date('2025-01-01T00:00:00.000Z') },
    ];
    expect(deriveEntityStatus(observations, isFreshWithin(now))).toBe('UNKNOWN');
  });

  it('the most recent FRESH observation wins, even when an older fresh observation disagrees', () => {
    const observations: StatusObservationRecord[] = [
      { status: 'CLOSED_TEMPORARILY', observedAt: new Date('2026-05-10T00:00:00.000Z') },
      { status: 'CLOSED_PERMANENTLY', observedAt: new Date('2026-05-25T00:00:00.000Z') },
    ];
    expect(deriveEntityStatus(observations, isFreshWithin(now))).toBe('CLOSED_PERMANENTLY');
  });

  it('a stale observation never determines current status, even if it is the only one', () => {
    const observations: StatusObservationRecord[] = [
      { status: 'CLOSED_TEMPORARILY', observedAt: new Date('2026-04-01T00:00:00.000Z') }, // stale (>30d)
      { status: 'CLOSED_PERMANENTLY', observedAt: new Date('2026-05-30T00:00:00.000Z') }, // fresh
    ];
    expect(deriveEntityStatus(observations, isFreshWithin(now))).toBe('CLOSED_PERMANENTLY');
  });

  it('excludes a stale observation from winning even when it is chronologically the most recent of ALL observations', () => {
    // A fresh-but-older observation beats a stale-but-newer one: condition
    // 1 (fresh-only) is applied BEFORE condition 2 (most-recent-wins) —
    // the two are not independent tie-breaks.
    const observations: StatusObservationRecord[] = [
      { status: 'CLOSED_TEMPORARILY', observedAt: new Date('2026-05-20T00:00:00.000Z') }, // fresh
      { status: 'CLOSED_PERMANENTLY', observedAt: new Date('2026-01-01T00:00:00.000Z') }, // stale, but not the most recent anyway
    ];
    expect(deriveEntityStatus(observations, isFreshWithin(now))).toBe('CLOSED_TEMPORARILY');
  });
});
