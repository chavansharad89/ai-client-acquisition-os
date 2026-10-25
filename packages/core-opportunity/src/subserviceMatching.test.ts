import type { StoredResearchSignal } from '@acos/core-research';
import { describe, expect, it } from 'vitest';

import { matchRelevantSubservices } from './subserviceMatching';

// Phase 7B (MULR item 6) — unit coverage per the authorization's §10
// test list. Pure function under test: no AI/LLM call, no network, no
// repository — these are plain synchronous assertions, which is itself
// the proof for test #19 (no additional AI/Research invocation).

const BASE: StoredResearchSignal = {
  id: 'signal_1',
  prospectId: 'prospect_1',
  field: 'visibleProblems',
  kind: 'JOB_POST',
  classification: 'OBSERVED',
  signal: null,
  confidence: 88,
  basis: null,
  observedAt: new Date('2026-01-01T00:00:00.000Z'),
  supersededAt: null,
  sources: [],
};

function signal(overrides: Partial<StoredResearchSignal>): StoredResearchSignal {
  return { ...BASE, ...overrides };
}

const WEB_DEV = 'Web & Software Development';

describe('matchRelevantSubservices (Phase 7B / MULR item 6)', () => {
  it('1. exact literal catalogue wording in an approved problem/opportunity field matches', () => {
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'visibleProblems', signal: 'The business lacks a modern website development setup.' }),
    ]);
    expect(result).toContain('Website development');
  });

  it('2. no match from companySummary/businessModel/targetCustomers even with the exact literal text', () => {
    for (const field of ['companySummary', 'businessModel', 'targetCustomers']) {
      const result = matchRelevantSubservices(WEB_DEV, [
        signal({ field, signal: 'They need website development and mobile apps.' }),
      ]);
      expect(result).toEqual([]);
    }
  });

  it('3. no match from an Evidence.quote-only field', () => {
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'quote', signal: 'website development' }),
    ]);
    expect(result).toEqual([]);
  });

  it('4. no match from categoryPlausibility', () => {
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'categoryPlausibility', signal: 'website development' }),
    ]);
    expect(result).toEqual([]);
  });

  it('5. no match from gaps', () => {
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'gaps', signal: 'website development' }),
    ]);
    expect(result).toEqual([]);
  });

  it('6. an UNKNOWN signal does not produce a subservice, even in an approved field', () => {
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'visibleProblems', classification: 'UNKNOWN', signal: null }),
    ]);
    expect(result).toEqual([]);
  });

  it('7. correctly scopes to the selected top-level service', () => {
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'visibleProblems', signal: 'needs website development and mobile apps' }),
    ]);
    expect(result).toEqual(['Website development', 'Mobile apps']);
  });

  it('8. a subservice from another service family cannot be attached', () => {
    // "AI chatbot development" belongs to AI & Automation, not Web & Software Development.
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'visibleProblems', signal: 'they need AI chatbot development' }),
    ]);
    expect(result).toEqual([]);
  });

  it('8b. an unresolvable/unscoped top-level service returns no subservices rather than guessing', () => {
    const result = matchRelevantSubservices('Something Not In The Catalogue', [
      signal({ field: 'visibleProblems', signal: 'needs website development' }),
    ]);
    expect(result).toEqual([]);
  });

  it('9. slash-split terms work exactly as approved (either side matches)', () => {
    const apiIntegration = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'visibleProblems', signal: 'they need API integration for their CRM' }),
    ]);
    expect(apiIntegration).toContain('API development/integration');

    const apiDevelopment = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'visibleProblems', signal: 'they need API development work done' }),
    ]);
    expect(apiDevelopment).toContain('API development/integration');

    const ragKnowledgeBase = matchRelevantSubservices('AI & Automation', [
      signal({ field: 'aiOpportunities', signal: 'could benefit from knowledge-base systems' }),
    ]);
    expect(ragKnowledgeBase).toContain('RAG/knowledge-base systems');
  });

  it('10. approved spelling variants work exactly as approved', () => {
    const modeling = matchRelevantSubservices('Finance / Professional Services', [
      signal({ field: 'growthOpportunities', signal: 'needs financial modeling support' }),
    ]);
    expect(modeling).toContain('Financial modelling');

    const voiceover = matchRelevantSubservices('Audio', [
      signal({ field: 'contentOpportunities', signal: 'could use a voiceover for their explainer' }),
    ]);
    expect(voiceover).toContain('Voice-over');
  });

  it('11. generic bare single-word subservices never match on their own', () => {
    const cases: Array<[string, string]> = [
      ['Business & Operations', 'they need more research'],
      ['Translation & Language', 'their documents need editing'],
      ['Finance / Professional Services', 'they could use consulting'],
      ['Branding', 'they need help with naming'],
      ['Branding', 'they lack clear positioning'],
      ['Graphic & Visual Design', 'their site could use illustration'],
      ['Architecture / Engineering / 3D', 'they need visualization'],
      ['Video & Reels', 'their videos need animation'],
    ];
    for (const [family, text] of cases) {
      const result = matchRelevantSubservices(family, [signal({ field: 'growthOpportunities', signal: text })]);
      expect(result).toEqual([]);
    }
  });

  it('12. multiple matched subservices are returned as multiple entries for one call (never a separate Opportunity each)', () => {
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'visibleProblems', signal: 'needs website development' }),
      signal({ id: 'signal_2', field: 'websiteIssues', signal: 'also needs mobile apps' }),
    ]);
    expect([...result].sort()).toEqual(['Mobile apps', 'Website development'].sort());
  });

  it('no match is produced when evidence only mentions a topic, not a problem (R-71 boundary, false-positive guard)', () => {
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'visibleProblems', signal: 'the company has a website' }),
    ]);
    expect(result).toEqual([]);
  });

  it('a superseded (non-live) signal is still matched — superseded filtering is the caller’s own responsibility, not this function’s', () => {
    // Phase 7B is deliberately silent on liveness; createOpportunityForOwner
    // already only reads live signals via ResearchSignalRepository.listByProspect.
    const result = matchRelevantSubservices(WEB_DEV, [
      signal({ field: 'visibleProblems', signal: 'needs website development', supersededAt: new Date() }),
    ]);
    expect(result).toContain('Website development');
  });
});
