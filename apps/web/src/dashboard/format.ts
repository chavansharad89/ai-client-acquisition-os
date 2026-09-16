import type { Metric } from '@acos/core-acquisition';

// Metric rendering.
// -----------------------------------------------------------------------
// Each metric carries a `format` so the UI never has to guess. Rendering
// revenue with a count formatter turns ₹3,00,000 into "30000000", which is
// the kind of bug that survives review because both numbers look
// plausible on a tile.
// -----------------------------------------------------------------------

const INR = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const COUNT = new Intl.NumberFormat('en-IN');

export function formatMetric(metric: Metric): string {
  switch (metric.format) {
    case 'paise':
      return INR.format(Math.round(metric.value / 100)).replace(/ /g, '');
    case 'percent':
      // One decimal below 10% — the difference between 2% and 2.4% matters
      // at low volume, and "2%" hides it.
      return metric.value < 0.1
        ? `${(metric.value * 100).toFixed(1)}%`
        : `${Math.round(metric.value * 100)}%`;
    case 'count':
      return COUNT.format(metric.value);
  }
}

/** Relative time for a stalled item. Days, not timestamps — nobody reads those. */
export function formatStalled(days: number): string {
  if (days <= 0) return 'today';
  if (days === 1) return 'since yesterday';
  if (days < 14) return `for ${days} days`;
  if (days < 60) return `for ${Math.round(days / 7)} weeks`;
  return `for ${Math.round(days / 30)} months`;
}

/** Due-date label. "Overdue" is stated plainly rather than shown as a date. */
export function formatDue(dueAt: Date | undefined, now: Date): string | null {
  if (!dueAt) return null;
  const days = Math.round((dueAt.getTime() - now.getTime()) / 86_400_000);
  if (days < 0) return `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`;
  if (days === 0) return 'due today';
  if (days === 1) return 'due tomorrow';
  return `due in ${days} days`;
}
