import {
  proposalVersionSchema,
  type GeneratedProposal,
  type Proposal,
  type ProposalState,
  type ProposalVersion,
} from './schema';

// Version history and editing.
// -----------------------------------------------------------------------
// Versions are immutable. An edit does not modify a version — it appends
// the next one. That is what makes "what exactly did we send them" a
// question with an answer, months later, after the draft has moved on.
//
// Editing also returns the proposal to DRAFT, for the same reason the
// outreach approval gate does: an approval applies to the words that were
// approved, and carrying it across an edit makes the gate decorative.
// -----------------------------------------------------------------------

export const SYSTEM_AUTHOR = 'SYSTEM' as const;

const TRANSITIONS: Record<ProposalState, readonly ProposalState[]> = {
  DRAFT: ['APPROVED'],
  APPROVED: ['SENT', 'DRAFT'],
  SENT: ['ACCEPTED', 'DECLINED'],
  ACCEPTED: [],
  DECLINED: ['DRAFT'],
};

export class ProposalStateError extends Error {
  constructor(from: ProposalState, to: ProposalState) {
    super(
      from === 'DRAFT' && to === 'SENT'
        ? 'a proposal cannot be sent straight from DRAFT — a person must approve it first'
        : `cannot move a proposal from ${from} to ${to}` +
            (TRANSITIONS[from].length === 0
              ? ` — ${from} is final`
              : ` — allowed: ${TRANSITIONS[from].join(', ')}`),
    );
    this.name = 'ProposalStateError';
  }
}

export function canTransition(from: ProposalState, to: ProposalState): boolean {
  return TRANSITIONS[from].includes(to);
}

export function assertTransition(from: ProposalState, to: ProposalState): void {
  if (!canTransition(from, to)) throw new ProposalStateError(from, to);
}

export function currentVersion(proposal: Proposal): ProposalVersion {
  const version = proposal.versions.find((v) => v.version === proposal.currentVersion);
  if (!version) {
    throw new Error(
      `proposal ${proposal.id} points at version ${proposal.currentVersion}, which does not exist`,
    );
  }
  return version;
}

export interface EditInput {
  content: GeneratedProposal;
  editedBy: string;
  editSummary: string;
  at: Date;
}

/**
 * Appends an edited version.
 *
 * Pricing, template and provenance are carried forward unchanged — an
 * edit revises the words, and a changed price is a new negotiation, not a
 * typo fix. Changing it is a deliberate act with its own path.
 */
export function appendEdit(proposal: Proposal, edit: EditInput): Proposal {
  if (proposal.state === 'SENT' || proposal.state === 'ACCEPTED') {
    throw new ProposalStateError(proposal.state, 'DRAFT');
  }
  if (!edit.editedBy.trim()) throw new Error('an edit must record who made it');
  if (!edit.editSummary.trim()) throw new Error('an edit must record what changed');

  const previous = currentVersion(proposal);
  const next = proposalVersionSchema.parse({
    ...previous,
    version: previous.version + 1,
    content: edit.content,
    createdAt: edit.at,
    createdBy: edit.editedBy,
    editSummary: edit.editSummary,
  });

  return {
    ...proposal,
    // An edit invalidates any approval. Always back to DRAFT.
    state: 'DRAFT',
    approvedBy: null,
    currentVersion: next.version,
    versions: [...proposal.versions, next],
  };
}

export function approve(proposal: Proposal, approvedBy: string): Proposal {
  assertTransition(proposal.state, 'APPROVED');
  if (!approvedBy.trim()) throw new Error('approval requires the approver identity');
  return { ...proposal, state: 'APPROVED', approvedBy };
}

export function markSent(proposal: Proposal, at: Date): Proposal {
  assertTransition(proposal.state, 'SENT');
  return { ...proposal, state: 'SENT', sentAt: at };
}

export function recordAnswer(
  proposal: Proposal,
  answer: 'ACCEPTED' | 'DECLINED',
  at: Date,
): Proposal {
  assertTransition(proposal.state, answer);
  return { ...proposal, state: answer, answeredAt: at };
}

/** The version that was actually sent, if any. Not necessarily the latest. */
export function sentVersion(proposal: Proposal): ProposalVersion | null {
  if (proposal.sentAt === null) return null;
  const candidates = proposal.versions.filter((v) => v.createdAt <= proposal.sentAt!);
  return candidates.length === 0 ? null : candidates[candidates.length - 1]!;
}

/** Newest first — the history panel. */
export function history(proposal: Proposal): readonly ProposalVersion[] {
  return [...proposal.versions].sort((a, b) => b.version - a.version);
}
