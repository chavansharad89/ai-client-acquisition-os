import type { ResearchSignal } from './scoring';

// WHAT SERVICE SHOULD I OFFER — service-fit inference.
// -----------------------------------------------------------------------
// Maps observed signals to a service hypothesis and, crucially, to the
// REASON for it. The rationale is not decoration: it becomes the second
// line of the outreach email, and an offer whose rationale cannot be
// stated is an offer that should not be sent.
//
// Rules are data, not code, so the operator's own catalogue of services
// can replace this without touching the engine.
// -----------------------------------------------------------------------

export interface ServiceRule {
  service: string;
  /** Signal kinds that trigger this service. */
  triggers: readonly ResearchSignal['kind'][];
  /** Case-insensitive substrings that strengthen the match. */
  keywords: readonly string[];
  /** Typical engagement value, in paise. */
  typicalValuePaise: number;
  /** Template for the rationale; `{signal}` is substituted. */
  rationale: string;
}

export const DEFAULT_SERVICE_RULES: readonly ServiceRule[] = [
  {
    service: 'AI content system',
    triggers: ['JOB_POST'],
    keywords: ['content', 'writer', 'copywriter', 'blog', 'seo'],
    typicalValuePaise: 15_000_000,
    rationale: 'They are hiring for content ({signal}) — a system delivers it without a headcount.',
  },
  {
    service: 'Lead generation automation',
    triggers: ['JOB_POST', 'FUNDING'],
    keywords: ['sales', 'sdr', 'business development', 'growth'],
    typicalValuePaise: 25_000_000,
    rationale:
      'They are scaling acquisition ({signal}) — automation compounds what a new hire does linearly.',
  },
  {
    service: 'Analytics and reporting setup',
    triggers: ['TECH_STACK', 'WEBSITE'],
    keywords: ['no analytics', 'ga4', 'tracking', 'pixel', 'attribution'],
    typicalValuePaise: 8_000_000,
    rationale:
      'Their measurement has a gap ({signal}) — they are spending without seeing what works.',
  },
  {
    service: 'Workflow automation',
    triggers: ['REVIEW', 'NEWS', 'MANUAL'],
    keywords: ['manual', 'slow', 'backlog', 'response time', 'support'],
    typicalValuePaise: 12_000_000,
    rationale: 'A recurring operational drag ({signal}) is exactly what automation removes.',
  },
];

export interface OfferSuggestion {
  service: string;
  rationale: string;
  estimatedValuePaise: number;
  /** 0-100. How well the signals matched. */
  fit: number;
  /** The signals that produced it, for the operator to check. */
  basedOn: readonly string[];
}

/**
 * Suggests services, best fit first.
 *
 * Returns an EMPTY array when nothing matches, rather than defaulting to
 * a generic service. "I have no idea what to sell these people" is useful
 * information; a confident generic pitch is worse than silence.
 */
export function suggestOffers(
  signals: readonly ResearchSignal[],
  rules: readonly ServiceRule[] = DEFAULT_SERVICE_RULES,
): readonly OfferSuggestion[] {
  const live = signals.filter((s) => !s.supersededAt);
  const suggestions: OfferSuggestion[] = [];

  for (const rule of rules) {
    const matched = live.filter((signal) => {
      if (!rule.triggers.includes(signal.kind)) return false;
      const text = signal.signal.toLowerCase();
      return rule.keywords.some((keyword) => text.includes(keyword));
    });
    if (matched.length === 0) continue;

    const confidence = matched.reduce((sum, s) => sum + s.confidence, 0) / matched.length;
    const fit = Math.min(100, Math.round(confidence * (1 + 0.25 * (matched.length - 1))));

    suggestions.push({
      service: rule.service,
      rationale: rule.rationale.replace('{signal}', matched[0]!.signal),
      estimatedValuePaise: rule.typicalValuePaise,
      fit,
      basedOn: matched.map((s) => s.signal),
    });
  }

  return suggestions.sort((a, b) => b.fit - a.fit);
}
