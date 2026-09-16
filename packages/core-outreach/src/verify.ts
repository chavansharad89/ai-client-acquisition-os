import { specFor, type OutreachChannel } from './channels';
import type { GeneratedMessage, GenerationInput } from './schema';

// Verification — where the rules are enforced.
// -----------------------------------------------------------------------
// "Never fabricate company facts" cannot be fully checked by a machine.
// What CAN be checked is the shape fabrication almost always takes, and
// checking that mechanically catches far more than trusting the prompt:
//
//   * NUMBERS. Hallucinated specifics are overwhelmingly numeric — "your
//     40-person team", "your 2019 funding round". Every number in the body
//     must appear in the supplied evidence. This is the strongest single
//     check in the file.
//   * UNSUPPORTED QUOTES. A message may only lean on evidence the caller
//     actually supplied; a quote the model minted fails.
//   * GENERIC SPAM. A fixed list of the phrases that mark bulk outreach.
//
// None of this proves a message is truthful. It does make the common
// fabrications fail loudly instead of being sent.
// -----------------------------------------------------------------------

export type MessageDefect =
  | 'too-long'
  | 'too-short'
  | 'missing-subject'
  | 'unexpected-subject'
  | 'subject-too-long'
  | 'unsupported-evidence'
  | 'fabricated-number'
  | 'generic-spam'
  | 'no-company-reference'
  | 'multiple-ctas'
  | 'unresolved-placeholder';

export interface Defect {
  code: MessageDefect;
  detail: string;
}

export interface Verification {
  ok: boolean;
  defects: readonly Defect[];
  /** One line a reviewer or the repair prompt can act on. */
  explanation: string;
}

/** Phrases that mark bulk outreach. Presence of any is disqualifying. */
export const SPAM_PHRASES: readonly string[] = [
  'i hope this email finds you well',
  'i hope this finds you well',
  'hope you are doing well',
  'i wanted to reach out',
  'just reaching out',
  'touching base',
  'circling back',
  'quick question for you',
  'game-changer',
  'revolutionary',
  'synergy',
  'leverage our cutting-edge',
  'to whom it may concern',
  'dear sir/madam',
  'as per my last email',
  'unlock your potential',
  'take your business to the next level',
];

const PLACEHOLDER = /\{\{[^}]*\}\}|\{[A-Za-z_][A-Za-z0-9_]*\}|\[\[[^\]]*\]\]|<[A-Z_]{3,}>/;

/** Question marks are the CTA proxy; two questions is two asks. */
const QUESTION = /\?/g;

/**
 * Numbers that are safe anywhere: small counts and ordinals appear in
 * ordinary prose ("a couple of things", "the first one") and flagging them
 * would make the check unusable.
 */
function significantNumbers(text: string): string[] {
  const matches = text.match(/\b\d[\d,.]*\b%?/g) ?? [];
  return matches
    .map((raw) => raw.replace(/[,.]$/, ''))
    .filter((raw) => {
      const numeric = Number(raw.replace(/[,%]/g, ''));
      // 1-10 are ordinary prose; anything larger is a specific claim.
      return !Number.isNaN(numeric) && numeric > 10;
    });
}

function normalise(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ');
}

export function verifyMessage(message: GeneratedMessage, input: GenerationInput): Verification {
  const defects: Defect[] = [];
  const spec = specFor(message.channel as OutreachChannel);
  const body = message.body.trim();
  const haystack = normalise(body);

  // --- shape ---
  if (body.length > spec.maxChars) {
    defects.push({
      code: 'too-long',
      detail: `${body.length} chars; ${message.channel} allows ${spec.maxChars}`,
    });
  }
  if (body.length < spec.minChars) {
    defects.push({
      code: 'too-short',
      detail: `${body.length} chars reads as a drive-by; ${message.channel} wants at least ${spec.minChars}`,
    });
  }
  if (spec.hasSubject && !message.subject?.trim()) {
    defects.push({ code: 'missing-subject', detail: 'email requires a subject' });
  }
  if (!spec.hasSubject && message.subject?.trim()) {
    defects.push({
      code: 'unexpected-subject',
      detail: `${message.channel} has no subject line`,
    });
  }
  if (
    spec.subjectMaxChars &&
    message.subject &&
    message.subject.trim().length > spec.subjectMaxChars
  ) {
    defects.push({
      code: 'subject-too-long',
      detail: `subject is ${message.subject.trim().length} chars; max ${spec.subjectMaxChars}`,
    });
  }

  if (PLACEHOLDER.test(body) || (message.subject && PLACEHOLDER.test(message.subject))) {
    defects.push({
      code: 'unresolved-placeholder',
      detail: 'a template token was never filled in',
    });
  }

  // --- never fabricate ---
  const evidenceText = normalise(
    input.evidence.map((item) => `${item.quote} ${item.signal}`).join(' '),
  );

  for (const used of message.evidenceUsed) {
    const needle = normalise(used);
    const supported = input.evidence.some(
      (item) => normalise(item.quote).includes(needle) || needle.includes(normalise(item.quote)),
    );
    if (!supported) {
      defects.push({
        code: 'unsupported-evidence',
        detail: `"${used}" is not in the supplied evidence`,
      });
    }
  }

  const evidenceNumbers = new Set(significantNumbers(evidenceText));
  for (const number of significantNumbers(body)) {
    if (!evidenceNumbers.has(number)) {
      defects.push({
        code: 'fabricated-number',
        detail: `"${number}" appears in the message but in no supplied evidence`,
      });
    }
  }

  if (!haystack.includes(normalise(input.company.name))) {
    defects.push({
      code: 'no-company-reference',
      detail: 'the message never names the company',
    });
  }

  // --- not spam ---
  for (const phrase of SPAM_PHRASES) {
    if (haystack.includes(phrase)) {
      defects.push({ code: 'generic-spam', detail: `contains "${phrase}"` });
    }
  }

  // --- one ask ---
  if ((body.match(QUESTION) ?? []).length > 1) {
    defects.push({
      code: 'multiple-ctas',
      detail: 'more than one question — a second ask reliably costs you the first',
    });
  }

  return {
    ok: defects.length === 0,
    defects,
    explanation:
      defects.length === 0
        ? 'Passes every check. A human still has to approve it.'
        : `Not sendable: ${defects.map((d) => d.detail).join('; ')}.`,
  };
}

export function verifyAll(
  messages: readonly GeneratedMessage[],
  input: GenerationInput,
): Record<string, Verification> {
  return Object.fromEntries(
    messages.map((message) => [message.channel, verifyMessage(message, input)]),
  );
}
