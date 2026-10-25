// Phase 7B — MULR item 6: relevant predefined subservices.
// -----------------------------------------------------------------------
// Static, literal transcription of CF-SERVICE-CATALOG-PO-DEC-001's 17
// top-level service families and their enumerated sub-services. This is
// catalogue METADATA only (per that decision's rule 4 and
// CF-TOP-LEVEL-SERVICE-ONLY-SUBSERVICES-INTERNAL-PO-DEC-001's restated
// rule 4) — never a user-facing selection, never a separate result
// category. Do not add, rename, merge, split, remove, or reorder any
// entry without a new PO decision. The matching logic below (bare-word
// exclusions, slash-split decompositions, spelling variants) is
// authorized by CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001
// D3–D5.
// -----------------------------------------------------------------------

export interface ServiceFamily {
  readonly name: string;
  readonly subservices: readonly string[];
}

export const SERVICE_CATALOG: readonly ServiceFamily[] = [
  {
    name: 'Web & Software Development',
    subservices: [
      'Website development',
      'Website redesign',
      'Landing pages',
      'E-commerce development',
      'WordPress development',
      'Shopify development',
      'Web applications',
      'Mobile apps',
      'SaaS development',
      'Custom software',
      'API development/integration',
      'Database development',
      'Bug fixing',
      'Website maintenance',
      'Performance optimization',
      'Technical consulting',
    ],
  },
  {
    name: 'AI & Automation',
    subservices: [
      'AI chatbot development',
      'AI agents',
      'AI automation',
      'Workflow automation',
      'Business process automation',
      'CRM automation',
      'AI integration',
      'Custom AI tools',
      'Prompt engineering',
      'AI consulting',
      'RAG/knowledge-base systems',
      'AI content workflows',
    ],
  },
  {
    name: 'Video & Reels',
    subservices: [
      'Reel creation',
      'Short-form video',
      'YouTube video editing',
      'Long-form video editing',
      'Podcast editing',
      'Video ads',
      'Product videos',
      'Explainer videos',
      'Motion graphics',
      'Animation',
      'Video subtitles/captions',
      'Video repurposing',
      'YouTube channel editing',
    ],
  },
  {
    name: 'Graphic & Visual Design',
    subservices: [
      'Logo design',
      'Brand identity',
      'Brochure design',
      'Poster design',
      'Social-media creatives',
      'Ad creatives',
      'Presentation design',
      'Infographics',
      'Packaging design',
      'UI design',
      'UX design',
      'Illustration',
      'Thumbnail design',
      'Print design',
    ],
  },
  {
    name: 'Branding',
    subservices: [
      'Brand strategy',
      'Brand identity',
      'Rebranding',
      'Naming',
      'Brand guidelines',
      'Positioning',
      'Visual identity',
      'Personal branding',
      'Employer branding',
    ],
  },
  {
    name: 'Digital Marketing',
    subservices: [
      'Social-media marketing',
      'Social-media management',
      'SEO',
      'Local SEO',
      'Google Business Profile optimization',
      'Performance marketing',
      'Google Ads',
      'Meta Ads',
      'LinkedIn Ads',
      'YouTube Ads',
      'Email marketing',
      'WhatsApp marketing',
      'Influencer marketing',
      'Affiliate marketing',
      'Lead generation',
      'Marketing automation',
      'Conversion-rate optimization',
    ],
  },
  {
    name: 'Content & Copywriting',
    subservices: [
      'Website copy',
      'Blog writing',
      'SEO content',
      'Ad copy',
      'Social-media content',
      'Product descriptions',
      'Email copy',
      'Newsletter writing',
      'Script writing',
      'YouTube scripts',
      'Case studies',
      'Technical writing',
      'Ghostwriting',
    ],
  },
  {
    name: 'Photography',
    subservices: [
      'Product photography',
      'Food photography',
      'Fashion photography',
      'Corporate photography',
      'Event photography',
      'Real-estate photography',
      'E-commerce photography',
      'Photo editing',
      'Background removal',
      'Image retouching',
    ],
  },
  {
    name: 'Audio',
    subservices: [
      'Podcast production',
      'Audio editing',
      'Voice-over',
      'Dubbing',
      'Sound design',
      'Music production',
      'Jingles',
      'Audio cleanup',
      'Audiobook production',
    ],
  },
  {
    name: 'E-commerce Services',
    subservices: [
      'Shopify services',
      'WooCommerce',
      'Amazon seller services',
      'Flipkart seller services',
      'Product listing',
      'Product photography',
      'Store design',
      'Store optimization',
      'Marketplace management',
      'E-commerce SEO',
      'Conversion optimization',
    ],
  },
  {
    name: 'Business & Operations',
    subservices: [
      'Virtual assistant',
      'Data entry',
      'Research',
      'Lead generation',
      'CRM management',
      'Customer support',
      'Appointment setting',
      'Bookkeeping',
      'Business analysis',
      'Project management',
      'Operations consulting',
    ],
  },
  {
    name: 'Sales & Lead Generation',
    subservices: [
      'B2B lead generation',
      'Prospect research',
      'Cold email',
      'LinkedIn outreach',
      'Appointment setting',
      'Sales development',
      'Sales copywriting',
      'CRM setup',
      'Sales automation',
      'Outbound sales',
    ],
  },
  {
    name: 'Translation & Language',
    subservices: [
      'Translation',
      'Localization',
      'Transcription',
      'Subtitling',
      'Proofreading',
      'Editing',
      'Language tutoring',
      'Multilingual content',
    ],
  },
  {
    name: 'Architecture / Engineering / 3D',
    subservices: [
      'Architecture drawings',
      '3D modelling',
      '3D rendering',
      'Interior design',
      'CAD',
      'Product design',
      'Engineering drawings',
      'BIM',
      'Visualization',
      '3D animation',
    ],
  },
  {
    name: 'Finance / Professional Services',
    subservices: [
      'Financial modelling',
      'Excel/Google Sheets',
      'Data analysis',
      'Power BI',
      'Business plans',
      'Market research',
      'Accounting support',
      'Tax preparation support',
      'Financial reporting',
      'Consulting',
    ],
  },
  {
    name: 'Education & Expertise',
    subservices: [
      'Online tutoring',
      'Course creation',
      'Corporate training',
      'Technical training',
      'Interview coaching',
      'Career coaching',
      'Skill coaching',
      'Educational content',
    ],
  },
  {
    name: 'Specialized Professional Services',
    subservices: [
      'Legal-document support',
      'HR/recruitment',
      'Resume/CV writing',
      'Recruitment sourcing',
      'Compliance support',
      'Grant writing',
      'Research assistance',
      'Technical consulting',
      'Industry-specific consulting',
    ],
  },
];

/**
 * Generic bare single-word sub-service names (D3 of
 * CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001): never
 * matched as bare words, in any family,
 * because a single common word is far too prone to false-positive
 * substring matches against free-form Research text. Each is a verbatim
 * catalogue entry (see SERVICE_CATALOG above), so excluding bare-word
 * matching for exactly these names means they can never be produced by
 * matchRelevantSubservices() — there is no other approved literal form
 * for them to match through.
 */
const GENERIC_BARE_WORD_SUBSERVICES = new Set([
  'Research',
  'Editing',
  'Consulting',
  'Naming',
  'Positioning',
  'Illustration',
  'Visualization',
  'Animation',
]);

/**
 * Explicitly PO-approved slash-split decompositions (D4 of
 * CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001):
 * a catalogue name containing "/" is matched as EITHER side of the
 * slash, never only the joined literal. No other slash-split rule is
 * applied to any other "/"-containing catalogue name.
 */
const SLASH_SPLIT_TERMS: ReadonlyMap<string, readonly string[]> = new Map([
  ['API development/integration', ['API development', 'API integration']],
  ['RAG/knowledge-base systems', ['RAG', 'knowledge-base systems']],
  ['Excel/Google Sheets', ['Excel', 'Google Sheets']],
  ['HR/recruitment', ['HR', 'recruitment']],
  ['Resume/CV writing', ['Resume writing', 'CV writing']],
  ['Video subtitles/captions', ['Video subtitles', 'Video captions']],
]);

/**
 * Explicitly PO-approved spelling variants (D5 of
 * CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001): each
 * literal term below also matches its listed alternate spelling(s).
 * Applied per occurrence of the base word inside a catalogue name, not
 * as a general stemming rule.
 */
const SPELLING_VARIANTS: ReadonlyMap<string, readonly string[]> = new Map([
  ['modelling', ['modeling']],
  ['voice-over', ['voiceover']],
]);

/**
 * Resolves `rawTerm` (one catalogue sub-service name) to its full set of
 * approved literal match strings — the term itself, its slash-split
 * alternatives if any, and spelling variants of each. Returns an empty
 * array for the generic bare-word names (D3 of
 * CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001) — the caller
 * must never attempt to match those.
 */
export function literalMatchTermsFor(rawTerm: string): readonly string[] {
  if (GENERIC_BARE_WORD_SUBSERVICES.has(rawTerm)) return [];

  const base = SLASH_SPLIT_TERMS.get(rawTerm) ?? [rawTerm];
  const withVariants = base.flatMap((term) => {
    const variants = [term];
    for (const [spelling, alternates] of SPELLING_VARIANTS) {
      if (term.toLowerCase().includes(spelling)) {
        for (const alternate of alternates) {
          variants.push(term.replace(new RegExp(spelling, 'i'), alternate));
        }
      }
    }
    return variants;
  });

  return withVariants;
}
