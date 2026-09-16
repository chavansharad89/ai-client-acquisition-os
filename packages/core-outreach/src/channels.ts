// Channel specifications.
// -----------------------------------------------------------------------
// The four channels differ in more than length. A LinkedIn connection note
// that reads like an email is ignored; a WhatsApp message with a subject
// line is absurd; an Instagram DM that opens with "I hope this finds you
// well" is deleted. Encoding the differences here means the generator is
// asked for four genuinely different messages rather than one message cut
// to four lengths.
// -----------------------------------------------------------------------

export const OUTREACH_CHANNELS = ['EMAIL', 'INSTAGRAM_DM', 'LINKEDIN', 'WHATSAPP'] as const;
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];

export interface ChannelSpec {
  channel: OutreachChannel;
  /** Hard ceiling. Beyond this the platform truncates or the reader stops. */
  maxChars: number;
  /** Below this it reads as a drive-by and gets ignored. */
  minChars: number;
  hasSubject: boolean;
  subjectMaxChars?: number;
  /** How the channel should sound, in the prompt's words. */
  register: string;
  /** Greeting conventions differ sharply and get this wrong most often. */
  guidance: string;
}

export const CHANNEL_SPECS: Record<OutreachChannel, ChannelSpec> = {
  EMAIL: {
    channel: 'EMAIL',
    maxChars: 900,
    minChars: 200,
    hasSubject: true,
    subjectMaxChars: 65,
    register: 'professional but plain — how you would write to a peer you respect',
    guidance:
      'Subject states the specific thing you noticed, not a benefit claim. Open with the observation, not a greeting formula. Three short paragraphs at most. Sign off with a first name only.',
  },
  INSTAGRAM_DM: {
    channel: 'INSTAGRAM_DM',
    maxChars: 400,
    minChars: 80,
    hasSubject: false,
    register: 'casual and direct — a real person typing on a phone',
    guidance:
      'No greeting formula, no sign-off, no paragraphs. One or two sentences of context and one question. Never mention "reaching out" or "touching base".',
  },
  LINKEDIN: {
    channel: 'LINKEDIN',
    maxChars: 280,
    minChars: 90,
    hasSubject: false,
    register: 'peer to peer, no sales voice',
    guidance:
      'This must fit a connection note. Lead with the observation in the first eight words. One sentence of relevance, one question. No links.',
  },
  WHATSAPP: {
    channel: 'WHATSAPP',
    maxChars: 350,
    minChars: 70,
    hasSubject: false,
    register: 'brief and warm, like a message to a contact who gave you their number',
    guidance:
      'Say who you are in the first line, because an unknown number is jarring. Two or three short lines. One question. No formatting, no bullet points.',
  },
};

export function specFor(channel: OutreachChannel): ChannelSpec {
  return CHANNEL_SPECS[channel];
}
