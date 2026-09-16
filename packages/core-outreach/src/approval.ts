import type { ApprovalState, StoredMessage } from './schema';

// The human approval gate.
// -----------------------------------------------------------------------
// Nothing generated here may be sent without a person saying so. The state
// machine below is the enforcement: `SENT` is reachable only from
// `APPROVED`, so there is no path from "the model wrote it" to "it went
// out" that does not pass through a human.
//
// Editing a message returns it to DRAFT. That is deliberate and slightly
// inconvenient: an approval applies to the words that were approved, and
// silently carrying it across an edit would make the gate decorative.
// -----------------------------------------------------------------------

const TRANSITIONS: Record<ApprovalState, readonly ApprovalState[]> = {
  DRAFT: ['APPROVED', 'REJECTED'],
  APPROVED: ['SENT', 'REJECTED', 'DRAFT'],
  REJECTED: ['DRAFT'],
  SENT: [],
};

export class ApprovalTransitionError extends Error {
  constructor(
    readonly from: ApprovalState,
    readonly to: ApprovalState,
  ) {
    super(
      from === 'DRAFT' && to === 'SENT'
        ? 'a message cannot be sent straight from DRAFT — a person must approve it first'
        : `cannot move a message from ${from} to ${to}` +
            (TRANSITIONS[from].length === 0
              ? ` — ${from} is final`
              : ` — allowed: ${TRANSITIONS[from].join(', ')}`),
    );
    this.name = 'ApprovalTransitionError';
  }
}

export function canTransition(from: ApprovalState, to: ApprovalState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: ApprovalState, to: ApprovalState): void {
  if (!canTransition(from, to)) throw new ApprovalTransitionError(from, to);
}

/** The single predicate a sender must consult. */
export function isSendable(message: Pick<StoredMessage, 'approvalState'>): boolean {
  return message.approvalState === 'APPROVED';
}

export function approve(message: StoredMessage, approvedBy: string, at: Date): StoredMessage {
  assertTransition(message.approvalState, 'APPROVED');
  if (!approvedBy.trim()) throw new Error('approval requires the approver identity');
  return {
    ...message,
    approvalState: 'APPROVED',
    approvedBy,
    approvedAt: at,
    rejectedReason: null,
  };
}

export function reject(message: StoredMessage, reason: string, at: Date): StoredMessage {
  assertTransition(message.approvalState, 'REJECTED');
  return {
    ...message,
    approvalState: 'REJECTED',
    rejectedReason: reason,
    approvedBy: null,
    approvedAt: at,
  };
}

/**
 * Records a human edit. Always returns the message to DRAFT — see the
 * module note.
 */
export function applyHumanEdit(
  message: StoredMessage,
  edit: { subject?: string | null; body: string },
): StoredMessage {
  if (message.approvalState === 'SENT') {
    throw new ApprovalTransitionError('SENT', 'DRAFT');
  }
  return {
    ...message,
    ...(edit.subject !== undefined ? { subject: edit.subject } : {}),
    body: edit.body,
    editedByHuman: true,
    approvalState: 'DRAFT',
    approvedBy: null,
    approvedAt: null,
  };
}

export function markSent(message: StoredMessage, at: Date): StoredMessage {
  assertTransition(message.approvalState, 'SENT');
  return { ...message, approvalState: 'SENT', sentAt: at };
}
