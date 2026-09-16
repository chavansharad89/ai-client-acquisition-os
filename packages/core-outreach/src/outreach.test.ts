import { describe, expect, it, vi } from 'vitest';

import {
  applyHumanEdit,
  approve,
  ApprovalTransitionError,
  buildUserMessage,
  canTransition,
  generateOutreach,
  generationInputSchema,
  isSendable,
  markSent,
  OUTREACH_CHANNELS,
  OutreachRefusedError,
  PROMPT_VERSION,
  reject,
  SPAM_PHRASES,
  specFor,
  SYSTEM_PROMPT,
  toEvidencePool,
  verifyMessage,
  type GeneratedMessage,
  type GenerationInput,
  type StoredMessage,
} from './index';

const NOW = new Date('2026-06-24T10:00:00.000Z');

const input: GenerationInput = generationInputSchema.parse({
  lead: { firstName: 'Asha', role: 'Head of Marketing' },
  company: { name: 'Northwind', industry: 'Logistics' },
  evidence: [
    {
      quote: 'We are hiring 3 content writers to scale our blog',
      sourceUrl: 'https://northwind.test/careers',
      signal: 'hiring 3 content writers',
    },
  ],
  service: 'AI content system',
  offerRationale: 'They are hiring for content; a system delivers it without headcount',
  senderFirstName: 'Sharad',
  channels: ['EMAIL', 'INSTAGRAM_DM', 'LINKEDIN', 'WHATSAPP'],
});

const good = (over: Partial<GeneratedMessage> = {}): GeneratedMessage => ({
  channel: 'EMAIL',
  subject: 'Your three content roles',
  body:
    'Saw Northwind is hiring 3 content writers to scale the blog. Three hires is roughly a quarter ' +
    'of lead time before the first post ships, and the backlog grows while you interview. ' +
    'I build content systems that cover that gap in weeks rather than quarters. ' +
    'Worth a short call next week, Asha?\n\nSharad',
  evidenceUsed: ['We are hiring 3 content writers to scale our blog'],
  impactClaim: 'Hiring delay costs a quarter of content output',
  callToAction: 'A short call next week',
  ...over,
});

// ================================================== never fabricate ====

describe('never fabricate company facts', () => {
  it('accepts a message grounded in the evidence', () => {
    expect(verifyMessage(good(), input).ok).toBe(true);
  });

  it('rejects a number that appears nowhere in the evidence', () => {
    // The classic hallucination: a confident specific nobody supplied.
    const fabricated = good({
      body: good().body.replace('Three hires', 'Your 40-person team'),
    });
    const result = verifyMessage(fabricated, input);
    expect(result.ok).toBe(false);
    expect(result.defects.map((d) => d.code)).toContain('fabricated-number');
    expect(result.explanation).toContain('40');
  });

  it('allows numbers that ARE in the evidence', () => {
    expect(verifyMessage(good(), input).defects.map((d) => d.code)).not.toContain(
      'fabricated-number',
    );
  });

  it('ignores small numbers that occur in ordinary prose', () => {
    const prose = good({ body: good().body.replace('Three hires', 'A couple of hires') });
    expect(verifyMessage(prose, input).ok).toBe(true);
  });

  it('rejects a quote the model invented', () => {
    const invented = good({ evidenceUsed: ['We raised a Series B last year'] });
    const result = verifyMessage(invented, input);
    expect(result.defects.map((d) => d.code)).toContain('unsupported-evidence');
  });

  it('requires the message to name the company', () => {
    const anonymous = good({ body: good().body.replace(/Northwind/g, 'your company') });
    expect(verifyMessage(anonymous, input).defects.map((d) => d.code)).toContain(
      'no-company-reference',
    );
  });

  it('never shows the model anything but observed evidence', () => {
    const pool = toEvidencePool([
      {
        classification: 'OBSERVED',
        value: 'hiring writers',
        evidence: [
          { quote: 'hiring 3 writers', sourceUrl: 'https://x.test/a', sourceLabel: 'careers' },
        ],
        basis: null,
        confidence: 90,
      },
      {
        classification: 'INFERRED',
        value: 'probably well funded',
        evidence: [],
        basis: 'logos',
        confidence: 60,
      },
      { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    ]);
    expect(pool).toHaveLength(1);
    expect(pool[0]!.quote).toBe('hiring 3 writers');
  });
});

// ======================================================== no spam ======

describe('no generic spam', () => {
  it.each(SPAM_PHRASES.slice(0, 6))('rejects a message containing "%s"', (phrase) => {
    const spammy = good({
      body: `${phrase}. Northwind is hiring 3 content writers. Shall we talk?`,
    });
    expect(verifyMessage(spammy, input).defects.map((d) => d.code)).toContain('generic-spam');
  });

  it('names the offending phrase so it can be fixed', () => {
    const spammy = good({
      body: `I hope this finds you well. Northwind, you are hiring 3 writers. Talk?`,
    });
    expect(verifyMessage(spammy, input).explanation).toMatch(/hope this finds you well/);
  });

  it('forbids the worst phrases in the prompt itself', () => {
    expect(SYSTEM_PROMPT).toMatch(/i hope this email finds you well/i);
  });
});

// ======================================================== one CTA ======

describe('one clear call to action', () => {
  it('rejects two questions', () => {
    const twoAsks = good({
      body: good().body.replace(
        'Worth a short call next week, Asha?',
        'Worth a call? Or shall I send examples?',
      ),
    });
    const result = verifyMessage(twoAsks, input);
    expect(result.defects.map((d) => d.code)).toContain('multiple-ctas');
    expect(result.explanation).toMatch(/second ask/);
  });

  it('accepts exactly one', () => {
    expect(verifyMessage(good(), input).defects.map((d) => d.code)).not.toContain('multiple-ctas');
  });
});

// ======================================================= channels ======

describe('channel rules', () => {
  it('covers all four requested channels', () => {
    expect([...OUTREACH_CHANNELS]).toEqual(['EMAIL', 'INSTAGRAM_DM', 'LINKEDIN', 'WHATSAPP']);
  });

  it('requires a subject on email and forbids one elsewhere', () => {
    expect(verifyMessage(good({ subject: null }), input).defects.map((d) => d.code)).toContain(
      'missing-subject',
    );
    const dm = good({
      channel: 'INSTAGRAM_DM',
      subject: 'Hello',
      body: 'Northwind is hiring 3 content writers — that backlog grows while you interview. Worth a chat?',
    });
    expect(verifyMessage(dm, input).defects.map((d) => d.code)).toContain('unexpected-subject');
  });

  it('enforces the LinkedIn connection-note ceiling', () => {
    const long = good({ channel: 'LINKEDIN', subject: null, body: `Northwind ${'x'.repeat(400)}` });
    expect(verifyMessage(long, input).defects.map((d) => d.code)).toContain('too-long');
    expect(specFor('LINKEDIN').maxChars).toBeLessThan(specFor('EMAIL').maxChars);
  });

  it('rejects a message too short to be worth sending', () => {
    const curt = good({ channel: 'WHATSAPP', subject: null, body: 'Northwind — chat?' });
    expect(verifyMessage(curt, input).defects.map((d) => d.code)).toContain('too-short');
  });

  it('gives each channel its own guidance in the prompt', () => {
    const message = buildUserMessage(input);
    for (const channel of OUTREACH_CHANNELS) expect(message).toContain(`### ${channel}`);
    expect(message).toMatch(/connection note/);
    expect(message).toMatch(/unknown number is jarring/);
  });

  it('rejects an unfilled template token', () => {
    const templated = good({
      body: 'Hi {{firstName}}, Northwind is hiring 3 content writers. Chat?',
    });
    expect(verifyMessage(templated, input).defects.map((d) => d.code)).toContain(
      'unresolved-placeholder',
    );
  });
});

// ==================================================== provenance ======

describe('stored provenance', () => {
  const model = vi.fn().mockResolvedValue({
    kind: 'json',
    value: { messages: [good()] },
  });

  it('records model, prompt version, timestamp and research version', async () => {
    const result = await generateOutreach(
      model,
      { ...input, channels: ['EMAIL'] },
      { opportunityId: 'opp_1', leadId: 'lead_1', researchVersion: 'run_2026_06_24_a' },
      { now: () => NOW, newId: () => 'msg_1', model: 'claude-opus-5' },
    );

    expect(result.drafts[0]!.message).toMatchObject({
      model: 'claude-opus-5',
      promptVersion: PROMPT_VERSION,
      generatedAt: NOW,
      researchVersion: 'run_2026_06_24_a',
      opportunityId: 'opp_1',
    });
  });

  it('has a prompt version at all, so a bad batch is traceable', () => {
    expect(PROMPT_VERSION).toMatch(/^outreach-\d{4}-\d{2}-\d{2}\.\d+$/);
  });

  it('stores which evidence each message leaned on', async () => {
    const result = await generateOutreach(
      model,
      { ...input, channels: ['EMAIL'] },
      { opportunityId: 'o', leadId: 'l', researchVersion: 'r' },
      { now: () => NOW },
    );
    expect(result.drafts[0]!.message.evidenceUsed).toEqual([
      'We are hiring 3 content writers to scale our blog',
    ]);
  });
});

// ================================================ approval gate ======

describe('human approval gate', () => {
  const draft = (over: Partial<StoredMessage> = {}): StoredMessage => ({
    id: 'msg_1',
    opportunityId: 'opp_1',
    leadId: 'lead_1',
    channel: 'EMAIL',
    subject: 'Your three content roles',
    body: good().body,
    model: 'claude-opus-5',
    promptVersion: PROMPT_VERSION,
    generatedAt: NOW,
    researchVersion: 'run_1',
    evidenceUsed: [],
    impactClaim: 'x',
    callToAction: 'x',
    approvalState: 'DRAFT',
    approvedBy: null,
    approvedAt: null,
    rejectedReason: null,
    sentAt: null,
    editedByHuman: false,
    ...over,
  });

  it('generation always produces DRAFT, never approved', async () => {
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: { messages: [good()] } });
    const result = await generateOutreach(
      model,
      { ...input, channels: ['EMAIL'] },
      { opportunityId: 'o', leadId: 'l', researchVersion: 'r' },
    );
    expect(result.drafts[0]!.message.approvalState).toBe('DRAFT');
    expect(isSendable(result.drafts[0]!.message)).toBe(false);
  });

  it('refuses to send straight from DRAFT', () => {
    expect(canTransition('DRAFT', 'SENT')).toBe(false);
    expect(() => markSent(draft(), NOW)).toThrow(ApprovalTransitionError);
    expect(() => markSent(draft(), NOW)).toThrow(/a person must approve it first/);
  });

  it('sends only after a person approves', () => {
    const approved = approve(draft(), 'sharad@example.com', NOW);
    expect(isSendable(approved)).toBe(true);
    expect(approved.approvedBy).toBe('sharad@example.com');
    expect(markSent(approved, NOW).approvalState).toBe('SENT');
  });

  it('requires an approver identity', () => {
    expect(() => approve(draft(), '  ', NOW)).toThrow(/approver identity/);
  });

  it('returns an edited message to DRAFT, dropping the old approval', () => {
    const approved = approve(draft(), 'sharad', NOW);
    const edited = applyHumanEdit(approved, { body: 'Northwind — rewritten by hand. Chat?' });

    expect(edited.approvalState).toBe('DRAFT');
    expect(edited.approvedBy).toBeNull();
    expect(edited.editedByHuman).toBe(true);
    expect(isSendable(edited)).toBe(false);
  });

  it('never lets a sent message be edited or re-sent', () => {
    const sent = markSent(approve(draft(), 'sharad', NOW), NOW);
    expect(() => applyHumanEdit(sent, { body: 'x' })).toThrow(ApprovalTransitionError);
    expect(() => markSent(sent, NOW)).toThrow(/final/);
  });

  it('a rejected message can be reworked but not sent', () => {
    const rejected = reject(draft(), 'too pushy', NOW);
    expect(isSendable(rejected)).toBe(false);
    expect(canTransition('REJECTED', 'DRAFT')).toBe(true);
    expect(canTransition('REJECTED', 'SENT')).toBe(false);
  });
});

// ================================================== generation ======

describe('generation loop', () => {
  it('repairs a message that fails verification', async () => {
    const bad = good({ body: good().body.replace('Three hires', 'Your 40-person team') });
    const model = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'json', value: { messages: [bad] } })
      .mockResolvedValueOnce({ kind: 'json', value: { messages: [good()] } });

    const result = await generateOutreach(
      model,
      { ...input, channels: ['EMAIL'] },
      { opportunityId: 'o', leadId: 'l', researchVersion: 'r' },
    );

    expect(result.attempts).toBe(2);
    expect(result.failedChannels).toEqual([]);
    expect(model.mock.calls[1]![0].messages.at(-1).content).toMatch(/failed verification/);
  });

  it('returns failing drafts rather than hiding them', async () => {
    const bad = good({ body: good().body.replace('Three hires', 'Your 40-person team') });
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: { messages: [bad] } });

    const result = await generateOutreach(
      model,
      { ...input, channels: ['EMAIL'] },
      { opportunityId: 'o', leadId: 'l', researchVersion: 'r' },
      { maxAttempts: 1 },
    );

    expect(result.failedChannels).toEqual(['EMAIL']);
    expect(result.drafts[0]!.verification.ok).toBe(false);
    expect(isSendable(result.drafts[0]!.message)).toBe(false);
  });

  it('never retries a refusal', async () => {
    const model = vi.fn().mockResolvedValue({ kind: 'refusal', category: 'spam' });
    await expect(
      generateOutreach(model, input, { opportunityId: 'o', leadId: 'l', researchVersion: 'r' }),
    ).rejects.toThrow(OutreachRefusedError);
    expect(model).toHaveBeenCalledTimes(1);
  });
});
