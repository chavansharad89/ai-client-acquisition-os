import type { Metric } from '@acos/core-acquisition';

import { formatMetric } from '../../dashboard/format';

/**
 * The ten headline numbers.
 *
 * Every tile carries its note. A bare number invites the reader to invent
 * their own definition of it — and "conversion rate" in particular means
 * three different things depending on the denominator.
 */
export function MetricGrid({ metrics }: { metrics: readonly Metric[] }) {
  return (
    <section className="metrics" aria-label="Key metrics">
      {metrics.map((metric) => (
        <div className="metric" key={metric.key}>
          <span className="metric-label">{metric.label}</span>
          <span className="metric-value">{formatMetric(metric)}</span>
          <span className="metric-note">{metric.note}</span>
        </div>
      ))}
    </section>
  );
}
