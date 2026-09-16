import type { ReactNode } from 'react';

export type StatusTone = 'busy' | 'error' | 'pending' | 'good';

/**
 * A single status region. `role="status"` (polite) is used for progress
 * and success so it does not interrupt; `role="alert"` (assertive) for
 * errors, which the person must hear about immediately.
 */
export function StatusMessage({
  tone,
  title,
  children,
}: {
  tone: StatusTone;
  title: string;
  children?: ReactNode;
}) {
  const assertive = tone === 'error';
  return (
    <div
      className={`status status-${tone}`}
      role={assertive ? 'alert' : 'status'}
      aria-live={assertive ? 'assertive' : 'polite'}
    >
      {tone === 'busy' ? <span className="spinner" aria-hidden="true" /> : null}
      <p style={{ margin: 0 }}>
        <strong>{title}</strong>
        {children}
      </p>
    </div>
  );
}
