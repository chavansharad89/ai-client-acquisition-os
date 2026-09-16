import type { DuplicateGroup, ReconciliationReport } from './types';

// Reporting — turns a run into something a human can act on.
// -----------------------------------------------------------------------
// Deliberately free of console/logger calls so it can be asserted on in
// tests and routed to whatever sink the caller uses (@acos/observability,
// a CI step, an ops channel).
// -----------------------------------------------------------------------

/** True when the run found nothing — the expected state in a healthy system. */
export function isClean(report: ReconciliationReport): boolean {
  return report.groups.length === 0;
}

/** One line per case, stable and diffable across runs. */
export function formatCaseLines(report: ReconciliationReport): string[] {
  return report.groups.map((g) => {
    const outcome = report.results.find((r) => r.duplicateKey === g.duplicateKey)?.outcome ?? '?';
    return `${g.recordType}  ${g.recordCount} rows  ${g.duplicateKey}  (${outcome})`;
  });
}

/** Human-readable summary. Safe to log: keys are ids, not payloads. */
export function formatReport(report: ReconciliationReport): string {
  const durationMs = report.finishedAt.getTime() - report.startedAt.getTime();
  const header = `Idempotency reconciliation — ${report.scannedDimensions.length} dimensions scanned in ${durationMs}ms`;

  if (isClean(report)) {
    return `${header}\n  no duplicates found`;
  }

  const byType = Object.entries(report.byRecordType)
    .filter(([, n]) => n > 0)
    .map(([type, n]) => `${type}=${n}`)
    .join(' ');

  return [
    header,
    `  ${report.groups.length} duplicate group(s) across ${report.affectedRecordCount} rows  [${byType}]`,
    `  ${report.created} case(s) opened, ${report.updated} refreshed`,
    ...formatCaseLines(report).map((l) => `    ${l}`),
  ].join('\n');
}

/** Groups whose row count exceeds `threshold` — the ones to triage first. */
export function worstOffenders(
  report: ReconciliationReport,
  threshold = 2,
): readonly DuplicateGroup[] {
  return [...report.groups]
    .filter((g) => g.recordCount > threshold)
    .sort((a, b) => b.recordCount - a.recordCount);
}
