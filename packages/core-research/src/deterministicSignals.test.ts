import { describe, expect, it } from 'vitest';

import {
  createWebDevelopmentSignalCatalogue,
  detectPlacesEntityReality,
  DETERMINISTIC_PLACES_CLOSED_PERMANENTLY_FIELD,
  DETERMINISTIC_PLACES_CLOSED_TEMPORARILY_FIELD,
} from './deterministicSignals';
import type { SuppliedSourceDocuments } from './provider';

const FETCHED_AT = new Date('2026-10-13T00:00:00.000Z');

function supplied(overrides: Partial<SuppliedSourceDocuments> = {}): SuppliedSourceDocuments {
  return {
    documents: [{ label: 'Homepage', url: 'https://example.com', text: 'Welcome to Example Co.' }],
    fetchedAt: FETCHED_AT,
    extractionMethod: 'https-homepage:jsdom+readability:textContent:trim+collapse-whitespace',
    ...overrides,
  };
}

describe('createWebDevelopmentSignalCatalogue', () => {
  it('names the service it evaluates', () => {
    expect(createWebDevelopmentSignalCatalogue().service).toBe('Web Development');
  });

  it('emits no signal for an HTTPS document', () => {
    const catalogue = createWebDevelopmentSignalCatalogue();

    expect(catalogue.evaluate(supplied())).toEqual([]);
  });

  it('emits an OBSERVED absent-SSL signal mapped to Need/Opportunity Gap for an HTTP document', () => {
    const catalogue = createWebDevelopmentSignalCatalogue();
    const input = supplied({
      documents: [{ label: 'Homepage', url: 'http://example.com', text: 'Welcome to Example Co.' }],
    });

    const signals = catalogue.evaluate(input);

    expect(signals).toHaveLength(1);
    expect(signals[0]).toMatchObject({
      dimension: 'NEED_OPPORTUNITY_GAP',
      signal: {
        kind: 'WEBSITE',
        confidence: 100,
        observedAt: FETCHED_AT,
      },
    });
    expect(signals[0]!.signal.signal).toContain('http://example.com');
  });

  it('emits no signal when no documents were supplied (never guesses at missing evidence)', () => {
    const catalogue = createWebDevelopmentSignalCatalogue();

    expect(catalogue.evaluate(supplied({ documents: [] }))).toEqual([]);
  });

  it('flags only the insecure document among several, HTTPS ones stay silent', () => {
    const catalogue = createWebDevelopmentSignalCatalogue();
    const input = supplied({
      documents: [
        { label: 'Homepage', url: 'https://example.com', text: 'secure' },
        { label: 'About', url: 'http://example.com/about', text: 'insecure' },
      ],
    });

    const signals = catalogue.evaluate(input);

    expect(signals).toHaveLength(1);
    expect(signals[0]!.signal.signal).toContain('http://example.com/about');
  });
});

// ---- Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001) ----

describe('detectPlacesEntityReality', () => {
  const NOW = new Date('2026-10-17T00:00:00.000Z');

  it('CLOSED_PERMANENTLY produces an ENTITY_REALITY signal flagged establishesNonReality (D2.1/D3-C1)', () => {
    const signal = detectPlacesEntityReality('CLOSED_PERMANENTLY', NOW);
    expect(signal).toMatchObject({
      dimension: 'ENTITY_REALITY',
      field: DETERMINISTIC_PLACES_CLOSED_PERMANENTLY_FIELD,
      establishesNonReality: true,
      signal: { kind: 'GOOGLE_PLACES_STATUS', confidence: 100, observedAt: NOW },
    });
    expect(signal!.signal.signal).toContain('CLOSED_PERMANENTLY');
  });

  it('CLOSED_TEMPORARILY produces an ENTITY_REALITY signal WITHOUT establishesNonReality (D2.2/D15-O1)', () => {
    const signal = detectPlacesEntityReality('CLOSED_TEMPORARILY', NOW);
    expect(signal).toMatchObject({
      dimension: 'ENTITY_REALITY',
      field: DETERMINISTIC_PLACES_CLOSED_TEMPORARILY_FIELD,
      signal: { kind: 'GOOGLE_PLACES_STATUS', confidence: 100, observedAt: NOW },
    });
    expect(signal!.establishesNonReality).not.toBe(true);
    expect(signal!.signal.signal).toContain('CLOSED_TEMPORARILY');
  });

  it('OPERATIONAL produces no signal', () => {
    expect(detectPlacesEntityReality('OPERATIONAL', NOW)).toBeNull();
  });

  it('a missing businessStatus (null/undefined — no-result) produces no signal, never a fabricated claim (D2.3/D14)', () => {
    expect(detectPlacesEntityReality(null, NOW)).toBeNull();
    expect(detectPlacesEntityReality(undefined, NOW)).toBeNull();
  });

  it('an unrecognized businessStatus value produces no signal rather than guessing', () => {
    expect(detectPlacesEntityReality('SOME_FUTURE_GOOGLE_VALUE', NOW)).toBeNull();
  });
});
