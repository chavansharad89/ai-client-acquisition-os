import type { NewSearchServiceProfileInput, ServiceProfileFields } from './types';

// CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002 — system-supplied
// defaults for the five fields a NEW search no longer collects from the
// freelancer (service + geography remain freelancer-supplied). Applied by
// createServiceProfile() (./service.ts) BEFORE validateServiceProfileInput()
// runs, so validation itself stays unchanged: by the time it sees the
// input, every field is already present. updateServiceProfile() does not
// call this — defaulting is a new-profile policy, not a generic one.
//
// The sub-service catalogue data below is a literal, deliberate duplicate
// of @acos/core-opportunity's serviceCatalog.ts, NOT an import:
// core-opportunity already depends on core-service-profile (for
// ServiceProfileFields in its adapters.ts), so importing the other
// direction here would be circular. Same precedent as ./validation.ts's
// CANONICAL_SERVICE_FAMILIES. Do not add, rename, merge, split, remove, or
// reorder any family/sub-service entry, exclusion, slash-split pair, or
// spelling variant below without a new PO decision — this must stay
// reconciled with core-opportunity's serviceCatalog.ts
// (CF-SERVICE-CATALOG-PO-DEC-001,
// CF-PHASE7B-SUBSERVICE-RELEVANCE-AUTHORIZATION-PO-DEC-001 D3-D5).

/**
 * D1 (CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002): the only
 * ResearchSourceKind values the current automated Research pipeline ever
 * produces for a non-topical signal — @acos/core-research's persist.ts
 * FIELD_KIND maps every non-topical field to one of these three; the other
 * eight valid kinds (JOB_POST, LINKEDIN, FUNDING, REVIEW, MANUAL,
 * PUBLIC_INTENT, FIRST_PARTY, GOOGLE_PLACES_STATUS) each have no producer
 * in this pipeline today. suggestOffers()'s AND-gate is unchanged — only
 * who supplies this list changes.
 */
export const SYSTEM_DEFAULT_TRIGGERS: readonly string[] = ['WEBSITE', 'NEWS', 'TECH_STACK'];

/**
 * D2 (CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002): a target-customer
 * value that @acos/core-research's parseTargetSegments() (split on ';',
 * trim, drop empties) resolves to ZERO segments — so the Research prompt
 * renders no target-customer section at all, and
 * core-research/src/service.ts's categoryPlausibility/targetCustomerMatch
 * blocks (gated on `targetSegments.length > 0`) never run for a search
 * carrying this value. Deliberately NOT a human-readable placeholder like
 * "businesses" — PO-DEC-002 D2 is explicit that no meaningful/fake
 * target-customer value should be used downstream. Must still be a
 * non-empty string to satisfy requireNonEmptyString.
 */
export const SYSTEM_DEFAULT_TARGET_CUSTOMER = ';';

/**
 * D3 (CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002): inert by design
 * — the qualification-equivalence MINIMUM_VALUE_MATCH check this value
 * ultimately feeds (via toServiceRule().typicalValuePaise ->
 * OfferSuggestion.estimatedValuePaise) already compared the entered value
 * against itself and could never fail; storing 0 changes nothing about
 * that outcome.
 */
export const SYSTEM_DEFAULT_MIN_PROJECT_VALUE_PAISE = 0;

/**
 * D4 (CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-002): fixed rationale
 * placeholder. Contains the literal `{signal}` token so
 * @acos/core-acquisition's suggestOffers() still substitutes the actual
 * matched signal text into it, exactly as a freelancer-authored rationale
 * would have been substituted — see offer.ts's
 * `rule.rationale.replace('{signal}', matched[0].signal)`.
 */
export const SYSTEM_DEFAULT_RATIONALE =
  'A potential fit for {signal} — review the evidence below before reaching out.';

// ---- D2 keyword derivation (Phase 7B literalMatchTermsFor semantics) -----

interface ServiceFamily {
  readonly name: string;
  readonly subservices: readonly string[];
}

const SERVICE_CATALOG: readonly ServiceFamily[] = [
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

const SLASH_SPLIT_TERMS: ReadonlyMap<string, readonly string[]> = new Map([
  ['API development/integration', ['API development', 'API integration']],
  ['RAG/knowledge-base systems', ['RAG', 'knowledge-base systems']],
  ['Excel/Google Sheets', ['Excel', 'Google Sheets']],
  ['HR/recruitment', ['HR', 'recruitment']],
  ['Resume/CV writing', ['Resume writing', 'CV writing']],
  ['Video subtitles/captions', ['Video subtitles', 'Video captions']],
]);

const SPELLING_VARIANTS: ReadonlyMap<string, readonly string[]> = new Map([
  ['modelling', ['modeling']],
  ['voice-over', ['voiceover']],
]);

function literalMatchTermsFor(rawTerm: string): readonly string[] {
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

/**
 * D2: derives the system keyword list for `service` from its catalogue
 * sub-services, using the exact Phase 7B literal-match-term semantics
 * above (bare-word exclusion, slash-split, spelling variants) — never new
 * synonyms, never a taxonomy change. Normalized to lowercase: `offer.ts`'s
 * suggestOffers() lowercases signal text but NOT the keyword being
 * matched against it (`text.includes(keyword)`), so a mixed-case catalogue
 * term like "WordPress development" would otherwise never match. Returns
 * `[]` for a `service` that doesn't resolve to a catalogue family —
 * validateServiceProfileInput() rejects that `service` value regardless,
 * so an empty keyword list here has no further effect.
 */
export function deriveSystemKeywords(service: string): readonly string[] {
  const family = SERVICE_CATALOG.find((candidate) => candidate.name === service);
  if (!family) return [];

  const terms = family.subservices.flatMap((subservice) => literalMatchTermsFor(subservice));
  return [...new Set(terms.map((term) => term.toLowerCase()))];
}

/**
 * ALWAYS constructs the five system-owned fields for a NEW profile
 * (CF-SEARCH-INPUT-SERVICE-GEOGRAPHY-ONLY-PO-DEC-001/002,
 * CF-QUALIFICATION-WITHOUT-CATEGORY-PLAUSIBILITY-PO-DEC-001's system-
 * owned-field correction). `input`'s type (NewSearchServiceProfileInput)
 * has no field named targetCustomer/minProjectValuePaise/triggers/
 * keywords/rationale at all, so there is nothing here to read even if a
 * caller's raw request body smuggled one of those names in — only
 * `input.service` and `input.geography` are ever read. Never a
 * caller-overridable default: this always wins, unconditionally.
 */
export function applySystemServiceProfileDefaults(
  input: NewSearchServiceProfileInput,
): ServiceProfileFields {
  return {
    service: input.service,
    geography: input.geography,
    targetCustomer: SYSTEM_DEFAULT_TARGET_CUSTOMER,
    minProjectValuePaise: SYSTEM_DEFAULT_MIN_PROJECT_VALUE_PAISE,
    triggers: SYSTEM_DEFAULT_TRIGGERS,
    keywords: deriveSystemKeywords(input.service),
    rationale: SYSTEM_DEFAULT_RATIONALE,
  };
}
