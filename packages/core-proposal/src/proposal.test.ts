import { describe, expect, it, vi } from 'vitest';

import {
  appendEdit,
  approve,
  checkPricing,
  coversAllSections,
  currentVersion,
  extractMoney,
  generateProposal,
  history,
  markSent,
  PROMPT_VERSION,
  PROPOSAL_SECTIONS,
  PROPOSAL_TEMPLATES,
  proposalInputSchema,
  ProposalStateError,
  recordAnswer,
  sentVersion,
  SYSTEM_AUTHOR,
  SYSTEM_PROMPT,
  templateById,
  verifyProposal,
  type GeneratedProposal,
  type ProposalInput,
} from './index';

const NOW = new Date('2026-09-01T09:00:00.000Z');
const PRICE = 15_000_000; // ₹1,50,000

const input: ProposalInput = proposalInputSchema.parse({
  lead: { firstName: 'Asha', role: 'Head of Marketing' },
  company: { name: 'Northwind', industry: 'Logistics' },
  evidence: [
    { quote: 'We are hiring 3 content writers', sourceUrl: 'https://northwind.test/careers' },
  ],
  identifiedProblem: 'Content output is blocked behind three unfilled hires',
  proposedService: 'AI content system',
  pricing: { amountPaise: PRICE, currency: 'INR', basis: 'fixed' },
  timeline: { totalWeeks: 6 },
  templateId: 'fixed-scope',
  senderFirstName: 'Sharad',
});

const good = (over: Partial<GeneratedProposal> = {}): GeneratedProposal => ({
  problem:
    'Northwind needs consistent content output but the work is blocked behind three unfilled writer roles. ' +
    'Every week those seats stay empty is a week of publishing that does not happen, and hiring will not ' +
    'close that gap quickly.',
  currentSituation:
    'Three content roles are open. Recruiting, onboarding and ramping writers realistically takes a quarter ' +
    'before the first reliable output, and the backlog keeps growing during that time. The work is understood; ' +
    'the capacity to do it is not there.',
  recommendedSolution:
    'I will build a content system that produces drafts to your brief and standards, so output no longer depends ' +
    'on headcount arriving. That means a documented editorial spec, a prompt and review pipeline your team runs, ' +
    'and a quality gate that catches the failures these systems usually have. You keep the system when we finish.',
  deliverables: [
    'Editorial specification covering voice, structure and evidence standards',
    'Prompt and review pipeline, documented so your team can run it',
    'Quality gate checklist with worked examples of pass and fail',
    'Handover session and a written operating guide',
  ],
  timeline: [
    { phase: 'Discovery and editorial spec', durationWeeks: 2, outcome: 'Agreed standards' },
    { phase: 'Pipeline build', durationWeeks: 3, outcome: 'Working draft pipeline' },
    { phase: 'Handover', durationWeeks: 1, outcome: 'Your team running it unaided' },
  ],
  pricing:
    'The engagement is ₹1,50,000, covering all four deliverables and the handover session. That is the ' +
    'whole cost; there are no usage fees or licence charges afterwards.',
  assumptions: [
    'Someone at Northwind can approve editorial standards within the first two weeks',
    'The three open roles are for content production rather than strategy',
    'Existing published content is available as a reference for voice',
  ],
  nextStep:
    'If this looks right, reply and I will send a calendar link for a 30-minute kickoff. Sharad will run it.',
  ...over,
});

// ====================================================== templates ======

describe('reusable templates', () => {
  it('offers more than one shape', () => {
    expect(PROPOSAL_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    expect(PROPOSAL_TEMPLATES.map((t) => t.id)).toContain('diagnostic');
  });

  it('every template covers every section exactly once', () => {
    for (const template of PROPOSAL_TEMPLATES) {
      expect(coversAllSections(template), template.id).toBe(true);
      expect(new Set(template.sections).size).toBe(PROPOSAL_SECTIONS.length);
    }
  });

  it('produces the eight required sections', () => {
    expect([...PROPOSAL_SECTIONS]).toEqual([
      'problem',
      'currentSituation',
      'recommendedSolution',
      'deliverables',
      'timeline',
      'pricing',
      'assumptions',
      'nextStep',
    ]);
  });

  it('templates differ in more than their name', () => {
    const fixed = templateById('fixed-scope')!;
    const diagnostic = templateById('diagnostic')!;
    expect(diagnostic.deliverableRange).not.toEqual(fixed.deliverableRange);
    expect(diagnostic.sectionSpecs.recommendedSolution.intent).not.toBe(
      fixed.sectionSpecs.recommendedSolution.intent,
    );
  });

  it('every section has an intent a writer can act on', () => {
    for (const template of PROPOSAL_TEMPLATES) {
      for (const section of PROPOSAL_SECTIONS) {
        expect(
          template.sectionSpecs[section].intent.length,
          `${template.id}.${section}`,
        ).toBeGreaterThan(20);
      }
    }
  });
});

// ================================================ price integrity ======

describe('the model cannot change the price', () => {
  it('accepts prose stating the agreed figure', () => {
    expect(checkPricing(good().pricing, input).ok).toBe(true);
  });

  it('rejects a different figure', () => {
    const wrong = checkPricing('The engagement is ₹1,20,000 all in.', input);
    expect(wrong.ok).toBe(false);
    expect(wrong.defects[0]!.code).toBe('wrong-amount');
    expect(wrong.defects[0]!.detail).toContain('₹1,50,000');
  });

  it('rejects a second figure even when the right one is present', () => {
    // Two numbers is worse than one wrong number — the reader cannot tell
    // which is the price.
    const both = checkPricing('₹1,50,000 for the build, or ₹90,000 for a lighter version.', input);
    expect(both.defects.map((d) => d.code)).toContain('extra-amount');
  });

  it('rejects prose with no figure at all', () => {
    expect(checkPricing('Pricing is covered in the attached sheet.', input).defects[0]!.code).toBe(
      'no-amount',
    );
  });

  it.each(['starting from', 'approximately', 'negotiable', 'discount'])(
    'rejects hedging the price with "%s"',
    (phrase) => {
      const hedged = checkPricing(`The engagement is ${phrase} ₹1,50,000.`, input);
      expect(hedged.defects.map((d) => d.code)).toContain('hedged');
    },
  );

  it('understands Indian money notation', () => {
    expect(extractMoney('₹1,50,000')[0]!.paise).toBe(PRICE);
    expect(extractMoney('Rs 150000')[0]!.paise).toBe(PRICE);
    expect(extractMoney('INR 1.5 lakh')[0]!.paise).toBe(PRICE);
  });

  it('the stored amount comes from the input, not the prose', async () => {
    const model = vi.fn().mockResolvedValue({
      kind: 'json',
      value: good({ pricing: 'The engagement is ₹1,50,000 in total, covering everything above.' }),
    });
    const result = await generateProposal(
      model,
      input,
      { opportunityId: 'o', leadId: 'l', researchVersion: 'r' },
      { now: () => NOW },
    );
    expect(currentVersion(result.proposal).amountPaise).toBe(PRICE);
  });
});

// ==================================================== verification =====

describe('proposal verification', () => {
  it('accepts a well-formed proposal', () => {
    expect(verifyProposal(good(), input).ok).toBe(true);
  });

  it('rejects phases that do not sum to the agreed total', () => {
    const wrong = good({
      timeline: [{ phase: 'Everything', durationWeeks: 10, outcome: 'Done' }],
    });
    const result = verifyProposal(wrong, input);
    expect(result.defects.map((d) => d.code)).toContain('timeline-mismatch');
    expect(result.explanation).toContain('10 weeks');
  });

  it('rejects a calendar date nobody agreed', () => {
    const dated = good({
      timeline: [{ phase: 'Build, delivered by 14 March', durationWeeks: 6, outcome: 'Done' }],
    });
    expect(verifyProposal(dated, input).defects.map((d) => d.code)).toContain('absolute-date');
  });

  it('requires assumptions to be stated', () => {
    // Zod rejects an empty array outright — a proposal with nothing
    // assumed has not been thought about.
    expect(() => proposalInputSchema.parse({ ...input, evidence: [] })).toThrow();
    const result = verifyProposal({ ...good(), assumptions: [] } as never, input);
    expect(result.defects.map((d) => d.code)).toContain('no-assumptions');
  });

  it('rejects a number asserted about the client that no evidence supports', () => {
    const invented = good({
      currentSituation: good().currentSituation.replace('Three content roles', 'All 45 marketers'),
    });
    expect(verifyProposal(invented, input).defects.map((d) => d.code)).toContain(
      'fabricated-number',
    );
  });

  it('enforces the template deliverable range', () => {
    const tooMany = good({ deliverables: Array.from({ length: 9 }, (_, i) => `Thing ${i}`) });
    expect(verifyProposal(tooMany, input).defects.map((d) => d.code)).toContain(
      'too-many-deliverables',
    );
  });

  it('enforces section length from the template, not a global rule', () => {
    const terse = good({ problem: 'They need content.' });
    expect(verifyProposal(terse, input).defects.map((d) => d.code)).toContain('section-too-short');
  });

  it('surfaces a pricing problem as a proposal defect', () => {
    const cheap = good({ pricing: 'The engagement is approximately ₹1,20,000.' });
    expect(verifyProposal(cheap, input).defects.map((d) => d.code)).toContain('pricing');
  });
});

// =================================================== version history ===

describe('version history', () => {
  const build = async () => {
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: good() });
    return generateProposal(
      model,
      input,
      { opportunityId: 'opp_1', leadId: 'lead_1', researchVersion: 'run_1' },
      { now: () => NOW, newId: () => 'prop_1' },
    );
  };

  it('starts at version 1, authored by the system', async () => {
    const { proposal } = await build();
    expect(proposal.currentVersion).toBe(1);
    expect(currentVersion(proposal).createdBy).toBe(SYSTEM_AUTHOR);
    expect(proposal.state).toBe('DRAFT');
  });

  it('records provenance on every version', async () => {
    const { proposal } = await build();
    expect(currentVersion(proposal)).toMatchObject({
      model: 'claude-opus-5',
      promptVersion: PROMPT_VERSION,
      researchVersion: 'run_1',
      createdAt: NOW,
    });
  });

  it('an edit appends a version rather than modifying one', async () => {
    const { proposal } = await build();
    const edited = appendEdit(proposal, {
      content: good({
        nextStep: 'Reply and I will send a calendar link. Sharad runs the kickoff.',
      }),
      editedBy: 'sharad',
      editSummary: 'tightened the next step',
      at: new Date(NOW.getTime() + 3600_000),
    });

    expect(edited.versions).toHaveLength(2);
    expect(edited.currentVersion).toBe(2);
    // Version 1 is untouched — this is what makes the history trustworthy.
    expect(edited.versions[0]!.content.nextStep).toBe(proposal.versions[0]!.content.nextStep);
    expect(edited.versions[1]!.createdBy).toBe('sharad');
  });

  it('an edit requires an author and a summary', async () => {
    const { proposal } = await build();
    const edit = { content: good(), at: NOW };
    expect(() => appendEdit(proposal, { ...edit, editedBy: ' ', editSummary: 'x' })).toThrow(
      /who made it/,
    );
    expect(() => appendEdit(proposal, { ...edit, editedBy: 'a', editSummary: ' ' })).toThrow(
      /what changed/,
    );
  });

  it('an edit carries the price forward unchanged', async () => {
    const { proposal } = await build();
    const edited = appendEdit(proposal, {
      content: good({ pricing: 'The engagement is ₹1,50,000, covering everything listed.' }),
      editedBy: 'sharad',
      editSummary: 'reworded pricing',
      at: NOW,
    });
    expect(currentVersion(edited).amountPaise).toBe(PRICE);
  });

  it('history reads newest first', async () => {
    const { proposal } = await build();
    const edited = appendEdit(proposal, {
      content: good(),
      editedBy: 'sharad',
      editSummary: 'tweak',
      at: NOW,
    });
    expect(history(edited).map((v) => v.version)).toEqual([2, 1]);
  });

  it('remembers which version was sent, even after later edits', async () => {
    const { proposal } = await build();
    const approved = approve(proposal, 'sharad');
    const sent = markSent(approved, new Date(NOW.getTime() + 1000));
    expect(sentVersion(sent)!.version).toBe(1);
  });
});

// ================================================ editing and sending ==

describe('editing before sending', () => {
  const build = async () => {
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: good() });
    return (
      await generateProposal(model, input, {
        opportunityId: 'o',
        leadId: 'l',
        researchVersion: 'r',
      })
    ).proposal;
  };

  it('cannot be sent straight from DRAFT', async () => {
    const proposal = await build();
    expect(() => markSent(proposal, NOW)).toThrow(ProposalStateError);
    expect(() => markSent(proposal, NOW)).toThrow(/a person must approve it first/);
  });

  it('an edit drops an existing approval', async () => {
    const approved = approve(await build(), 'sharad');
    const edited = appendEdit(approved, {
      content: good(),
      editedBy: 'sharad',
      editSummary: 'reworded',
      at: NOW,
    });
    expect(edited.state).toBe('DRAFT');
    expect(edited.approvedBy).toBeNull();
  });

  it('a sent proposal cannot be edited', async () => {
    const sent = markSent(approve(await build(), 'sharad'), NOW);
    expect(() =>
      appendEdit(sent, { content: good(), editedBy: 'sharad', editSummary: 'x', at: NOW }),
    ).toThrow(ProposalStateError);
  });

  it('records the client answer', async () => {
    const sent = markSent(approve(await build(), 'sharad'), NOW);
    expect(recordAnswer(sent, 'ACCEPTED', NOW).state).toBe('ACCEPTED');
    expect(() => recordAnswer(sent, 'ACCEPTED', NOW)).not.toThrow();
  });

  it('a declined proposal can be reworked but an accepted one is final', async () => {
    const sent = markSent(approve(await build(), 'sharad'), NOW);
    const declined = recordAnswer(sent, 'DECLINED', NOW);
    expect(() =>
      appendEdit(declined, { content: good(), editedBy: 'a', editSummary: 's', at: NOW }),
    ).not.toThrow();

    const accepted = recordAnswer(sent, 'ACCEPTED', NOW);
    expect(() =>
      appendEdit(accepted, { content: good(), editedBy: 'a', editSummary: 's', at: NOW }),
    ).toThrow(ProposalStateError);
  });
});

// ==================================================== generation =======

describe('generation', () => {
  it('repairs a failing proposal', async () => {
    const broken = good({ timeline: [{ phase: 'All', durationWeeks: 20, outcome: 'Done' }] });
    const model = vi
      .fn()
      .mockResolvedValueOnce({ kind: 'json', value: broken })
      .mockResolvedValueOnce({ kind: 'json', value: good() });

    const result = await generateProposal(model, input, {
      opportunityId: 'o',
      leadId: 'l',
      researchVersion: 'r',
    });

    expect(result.attempts).toBe(2);
    expect(result.verification.ok).toBe(true);
    expect(model.mock.calls[1]![0].messages.at(-1).content).toMatch(/failed verification/);
  });

  it('returns a failing proposal rather than hiding it', async () => {
    const broken = good({ timeline: [{ phase: 'All', durationWeeks: 20, outcome: 'Done' }] });
    const model = vi.fn().mockResolvedValue({ kind: 'json', value: broken });
    const result = await generateProposal(
      model,
      input,
      { opportunityId: 'o', leadId: 'l', researchVersion: 'r' },
      { maxAttempts: 1 },
    );
    expect(result.verification.ok).toBe(false);
    expect(result.proposal.state).toBe('DRAFT');
  });

  it('tells the model the price and timeline are not its to change', () => {
    expect(SYSTEM_PROMPT).toMatch(/price is fixed/i);
    expect(SYSTEM_PROMPT).toMatch(/must add up to it exactly/i);
    expect(SYSTEM_PROMPT).toMatch(/never name a calendar date/i);
  });
});
