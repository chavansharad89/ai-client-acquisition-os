// Shared rolling-window boundary utility (ED-7), authorized under
// CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
// -----------------------------------------------------------------------
// ONE definition of "a closed rolling 30-day window", shared by every
// gate's own (bespoke) population query — this is the only thing ED-7
// asks to be shared; the population logic per gate stays separate.
//
// Half-open [start, end), matching @acos/core-reconciliation's own
// window convention, so consecutive windows tile without double-counting
// a boundary row.
//
// "Closed" means fully elapsed as of `now` — the CURRENT in-progress
// 30-day period [now-30d, now) is never evaluated as a gate result,
// because data for it (refunds in particular) is still arriving. The
// MOST RECENT CLOSED window is the one immediately before that: exactly
// one full window-length in the past.
// -----------------------------------------------------------------------

export const GATE_WINDOW_DAYS = 30;

export interface GateWindow {
  start: Date;
  end: Date;
}

function daysToMs(days: number): number {
  return days * 24 * 60 * 60 * 1000;
}

/** The most recent fully-elapsed window as of `now`. */
export function mostRecentClosedWindow(now: Date, windowDays: number = GATE_WINDOW_DAYS): GateWindow {
  const end = new Date(now.getTime() - daysToMs(windowDays));
  const start = new Date(end.getTime() - daysToMs(windowDays));
  return { start, end };
}

/** True once `window.end` has fully elapsed as of `now` — the general predicate every gate's "immutable after close" rule tests against. */
export function isClosed(window: GateWindow, now: Date): boolean {
  return window.end.getTime() <= now.getTime();
}
