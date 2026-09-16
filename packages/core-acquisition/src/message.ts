import type { OfferSuggestion } from './offer';
import type { ResearchSignal } from './scoring';

// WHAT SHOULD I SAY — the outreach message contract.
// -----------------------------------------------------------------------
// Generation is an INTERFACE, not an implementation. The engine's job is
// to assemble a brief that makes a good message possible and to REFUSE to
// send a bad one; which model writes the prose is a swappable detail, the
// same way HttpTransport keeps core-capi independent of fetch.
//
// The validation below is the part that matters. An outreach tool that
// will happily send "Hi {{firstName}}, I noticed {{signal}}" is worse than
// no tool, so unresolved placeholders, missing personalisation and
// excessive length are hard failures, not warnings.
// -----------------------------------------------------------------------

export type OutreachChannel = 'EMAIL' | 'LINKEDIN' | 'TWITTER' | 'FORM';

export interface MessageBrief {
  channel: OutreachChannel;
  leadFirstName?: string;
  leadRole?: string;
  companyName?: string;
  /** The specific observation the opening line must reference. */
  signals: readonly ResearchSignal[];
  offer: OfferSuggestion;
  /** 0 for the opening message, 1+ for follow-ups. */
  sequenceIndex: number;
  /** Named so IMPROVE can compare angles, not just templates. */
  angle: string;
}

export interface DraftMessage {
  subject?: string;
  body: string;
  angle: string;
}

/** Swap in an LLM, a template engine, or a human. The engine does not care. */
export interface MessageGenerator {
  (brief: MessageBrief): Promise<DraftMessage>;
}

/** Channel limits. LinkedIn truncates hard; email just goes unread. */
export const MAX_BODY_CHARS: Record<OutreachChannel, number> = {
  EMAIL: 1200,
  LINKEDIN: 300,
  TWITTER: 280,
  FORM: 800,
};

export type MessageDefect =
  'empty' | 'unresolved-placeholder' | 'too-long' | 'no-personalisation' | 'missing-subject';

export interface MessageValidation {
  ok: boolean;
  defects: readonly MessageDefect[];
  explanation: string;
}

const PLACEHOLDER = /\{\{[^}]*\}\}|\{[A-Za-z_][A-Za-z0-9_]*\}|\[\[[^\]]*\]\]|<FIRST_NAME>/;

/**
 * Refuses a message that should not leave the building.
 *
 * `no-personalisation` is the subtle one: a draft that mentions neither
 * the company nor any observed signal is a template with a name on it,
 * and sending it is what makes cold outreach worthless for everyone.
 */
export function validateMessage(draft: DraftMessage, brief: MessageBrief): MessageValidation {
  const defects: MessageDefect[] = [];
  const body = draft.body?.trim() ?? '';

  if (body.length === 0) defects.push('empty');
  if (PLACEHOLDER.test(body) || (draft.subject && PLACEHOLDER.test(draft.subject))) {
    defects.push('unresolved-placeholder');
  }
  if (body.length > MAX_BODY_CHARS[brief.channel]) defects.push('too-long');
  if (brief.channel === 'EMAIL' && !draft.subject?.trim()) defects.push('missing-subject');

  if (body.length > 0) {
    const haystack = body.toLowerCase();
    const referencesCompany = Boolean(
      brief.companyName && haystack.includes(brief.companyName.toLowerCase()),
    );
    const referencesSignal = brief.signals.some((signal) =>
      signal.signal
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 4)
        .some((word) => haystack.includes(word)),
    );
    if (!referencesCompany && !referencesSignal) defects.push('no-personalisation');
  }

  return {
    ok: defects.length === 0,
    defects,
    explanation: defects.length === 0 ? 'Ready to send.' : describe(defects),
  };
}

function describe(defects: readonly MessageDefect[]): string {
  const said: Record<MessageDefect, string> = {
    empty: 'the body is empty',
    'unresolved-placeholder': 'a template placeholder was never filled in',
    'too-long': 'it exceeds the channel limit',
    'no-personalisation': 'it mentions neither the company nor anything observed about them',
    'missing-subject': 'the email has no subject',
  };
  return `Not sendable: ${defects.map((d) => said[d]).join('; ')}.`;
}

/** Assembles the brief. Pure, so the prompt sent to any model is testable. */
export function buildBrief(input: MessageBrief): MessageBrief {
  return {
    ...input,
    // Only live signals ever reach a message — a superseded finding would
    // be a factual error in an email.
    signals: input.signals.filter((signal) => !signal.supersededAt),
  };
}
