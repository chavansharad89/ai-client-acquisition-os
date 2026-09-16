// Reusable proposal templates.
// -----------------------------------------------------------------------
// A template is a structure, not a body of prose. It decides which
// sections appear, in what order, how long each should be, and what shape
// the deliverables take — the model writes the words within that frame.
//
// Templates as text would have to be rewritten for every engagement and
// would drift; templates as structure stay honest, and a freelancer can
// add one without touching the generator.
// -----------------------------------------------------------------------

export const PROPOSAL_SECTIONS = [
  'problem',
  'currentSituation',
  'recommendedSolution',
  'deliverables',
  'timeline',
  'pricing',
  'assumptions',
  'nextStep',
] as const;

export type ProposalSection = (typeof PROPOSAL_SECTIONS)[number];

export interface SectionSpec {
  /** Words, not characters — proposals are read, not scanned. */
  minWords: number;
  maxWords: number;
  /** Shown to the model as the section's job. */
  intent: string;
}

export interface ProposalTemplate {
  id: string;
  name: string;
  /** When this shape fits, in the operator's terms. */
  suitedTo: string;
  /** Ordered. Every section in PROPOSAL_SECTIONS must appear exactly once. */
  sections: readonly ProposalSection[];
  sectionSpecs: Readonly<Record<ProposalSection, SectionSpec>>;
  /** Expected number of discrete deliverables. */
  deliverableRange: readonly [number, number];
  tone: string;
}

const COMMON: Record<ProposalSection, SectionSpec> = {
  problem: {
    minWords: 25,
    maxWords: 90,
    intent:
      'State the problem in the client’s own terms, grounded in what was observed. Not a pitch.',
  },
  currentSituation: {
    minWords: 30,
    maxWords: 110,
    intent:
      'What is happening today and what it is costing. Only what the research supports — anything else belongs in assumptions.',
  },
  recommendedSolution: {
    minWords: 40,
    maxWords: 160,
    intent: 'What you will do and why that addresses the problem. Mechanism, not adjectives.',
  },
  deliverables: {
    minWords: 20,
    maxWords: 140,
    intent: 'Concrete artefacts the client receives. Each one checkable on delivery.',
  },
  timeline: {
    minWords: 20,
    maxWords: 110,
    intent: 'Phases with durations. Never a date you were not given.',
  },
  pricing: {
    minWords: 15,
    maxWords: 90,
    intent:
      'State the supplied figure and what it covers. Never compute, discount or estimate a price.',
  },
  assumptions: {
    minWords: 20,
    maxWords: 140,
    intent:
      'Everything this proposal takes for granted but did not verify. Being explicit here is what keeps the rest honest.',
  },
  nextStep: {
    minWords: 10,
    maxWords: 60,
    intent: 'One concrete action, with who does it. Not "let me know your thoughts".',
  },
};

export const PROPOSAL_TEMPLATES: readonly ProposalTemplate[] = [
  {
    id: 'fixed-scope',
    name: 'Fixed-scope project',
    suitedTo: 'A defined piece of work with a clear end: a build, an audit, a migration.',
    sections: [...PROPOSAL_SECTIONS],
    sectionSpecs: COMMON,
    deliverableRange: [3, 7],
    tone: 'precise and unhurried — the reader is deciding whether to spend money',
  },
  {
    id: 'diagnostic',
    name: 'Paid diagnostic',
    suitedTo:
      'A short first engagement when the problem is real but its shape is not yet clear. Lowers the decision.',
    sections: [...PROPOSAL_SECTIONS],
    sectionSpecs: {
      ...COMMON,
      recommendedSolution: {
        ...COMMON.recommendedSolution,
        maxWords: 110,
        intent:
          'What you will investigate and what the client will know at the end. Do not promise the fix — that is the point of a diagnostic.',
      },
      deliverables: {
        ...COMMON.deliverables,
        intent: 'Findings, a recommendation, and a decision the client can act on.',
      },
    },
    deliverableRange: [2, 4],
    tone: 'direct and low-commitment — this is a small yes, not a big one',
  },
  {
    id: 'retainer',
    name: 'Ongoing retainer',
    suitedTo: 'Continuous work where the value is availability and compounding familiarity.',
    sections: [...PROPOSAL_SECTIONS],
    sectionSpecs: {
      ...COMMON,
      timeline: {
        ...COMMON.timeline,
        intent:
          'Cadence rather than phases — what happens weekly or monthly, and how either side exits.',
      },
      pricing: {
        ...COMMON.pricing,
        intent:
          'State the supplied monthly figure and what a month includes. Never compute or annualise it.',
      },
    },
    deliverableRange: [2, 6],
    tone: 'steady and partnership-shaped, not transactional',
  },
];

export function templateById(id: string): ProposalTemplate | null {
  return PROPOSAL_TEMPLATES.find((template) => template.id === id) ?? null;
}

/** Every template must cover every section — asserted by a test, not assumed. */
export function coversAllSections(template: ProposalTemplate): boolean {
  return (
    template.sections.length === PROPOSAL_SECTIONS.length &&
    PROPOSAL_SECTIONS.every((section) => template.sections.includes(section))
  );
}
