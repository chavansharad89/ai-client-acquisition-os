import { describe, expect, it } from 'vitest';

import { DETERMINISTIC_ABSENT_SSL_FIELD, detectPlacesEntityReality } from './deterministicSignals';
import { toNewResearchSignalInput } from './deterministicSignalPersistence';

// Phase 8 (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001): proves the
// generalized toNewResearchSignalInput() persists each deterministic
// signal under ITS OWN field marker (entry.field), not a hardcoded one —
// the fix for the single-signal hardcoding deterministicSignalPersistence.ts's
// own prior comment flagged as needing generalization once a second
// deterministic signal was authorized.

describe('toNewResearchSignalInput (generalized, Phase 8)', () => {
  it('persists the absent-SSL signal under its own field marker', () => {
    const entry = {
      signal: {
        kind: 'WEBSITE' as const,
        signal: 'Website served over HTTP without TLS (no SSL): http://example.com',
        confidence: 100,
        observedAt: new Date('2026-10-13T00:00:00.000Z'),
      },
      dimension: 'NEED_OPPORTUNITY_GAP' as const,
      field: DETERMINISTIC_ABSENT_SSL_FIELD,
    };

    const input = toNewResearchSignalInput(entry);

    expect(input.field).toBe(DETERMINISTIC_ABSENT_SSL_FIELD);
    expect(input.kind).toBe('WEBSITE');
    expect(input.classification).toBe('OBSERVED');
  });

  it('persists the Google Places CLOSED_PERMANENTLY signal under its own (different) field marker', () => {
    const entry = detectPlacesEntityReality('CLOSED_PERMANENTLY', new Date('2026-10-17T00:00:00.000Z'))!;

    const input = toNewResearchSignalInput(entry);

    expect(input.field).toBe(entry.field);
    expect(input.field).not.toBe(DETERMINISTIC_ABSENT_SSL_FIELD);
    expect(input.kind).toBe('GOOGLE_PLACES_STATUS');
  });

  it('persists the Google Places CLOSED_TEMPORARILY signal under its own field marker, distinct from CLOSED_PERMANENTLY', () => {
    const permanent = detectPlacesEntityReality('CLOSED_PERMANENTLY', new Date())!;
    const temporary = detectPlacesEntityReality('CLOSED_TEMPORARILY', new Date())!;

    expect(toNewResearchSignalInput(temporary).field).not.toBe(toNewResearchSignalInput(permanent).field);
  });
});
