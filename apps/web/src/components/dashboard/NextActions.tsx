import type { NextAction } from '@acos/core-acquisition';

import { formatDue, formatStalled } from '../../dashboard/format';

// The queue. The dashboard's reason to exist.
// -----------------------------------------------------------------------
// Rendered first and largest, because "what should I do next" is the
// question the operator actually has. The metrics below it are context
// for whether this queue is working, not the point of the page.
// -----------------------------------------------------------------------

const KIND_LABEL: Record<string, string> = {
  REVIEW_REPLY: 'Reply',
  RESEARCH_LEAD: 'Research',
  CHOOSE_OFFER: 'Offer',
  DRAFT_MESSAGE: 'Draft',
  SEND_MESSAGE: 'Send',
  SEND_FOLLOW_UP: 'Follow up',
  SEND_PROPOSAL: 'Proposal',
  CHASE_PROPOSAL: 'Chase',
  CLOSE_OR_DROP: 'Decide',
};

export function NextActions({
  actions,
  headline,
  now,
}: {
  actions: readonly NextAction[];
  headline: string;
  now: Date;
}) {
  return (
    <section className="queue" aria-labelledby="queue-heading">
      <div className="queue-head">
        <h2 id="queue-heading">What should I do next?</h2>
        <p className="queue-headline">{headline}</p>
      </div>

      {actions.length === 0 ? (
        // Never a blank panel — the headline above already says which
        // empty this is, and this gives the one action that unblocks it.
        <div className="queue-empty">
          <p>Nothing is waiting on you right now.</p>
        </div>
      ) : (
        <ol className="queue-list">
          {actions.map((action, index) => {
            const due = formatDue(action.dueAt, now);
            const urgent = action.kind === 'REVIEW_REPLY';
            return (
              <li key={action.opportunityId} className={`queue-item${urgent ? ' urgent' : ''}`}>
                <span className="queue-rank" aria-hidden="true">
                  {index + 1}
                </span>
                <span className="queue-kind">{KIND_LABEL[action.kind] ?? action.kind}</span>
                <span className="queue-label">{action.label}</span>
                <span className="queue-meta">
                  {due ? (
                    <span className={due.includes('overdue') ? 'overdue' : ''}>{due}</span>
                  ) : null}
                  <span>waiting {formatStalled(action.stalledDays)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
