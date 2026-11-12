import type { DeterministicSignal } from './deterministicSignals';
import type { ResearchSignalRepository } from './repository';
import type { NewResearchSignalInput, StoredResearchSignal } from './types';

// Phase 5 — persisting deterministic (non-LLM) signals as a Prospect's
// own current evidence. Generalized under Phase 8
// (CF-PHASE8-ENTITY-REALITY-ACTIVATION-PO-DEC-001) to safely persist any
// number of deterministic signal kinds: each DeterministicSignal now
// carries its own `field` marker (set by its producer in
// ./deterministicSignals.ts), so this module no longer hardcodes which
// signal it is persisting. Not a redesign — the write-sequencing
// contract below is unchanged.
// -----------------------------------------------------------------------
// Deliberately NON-superseding: runResearchForOwner's own
// supersede-then-insert (service.ts) would wipe a deterministic signal if
// it were written before Research runs. The caller sequences this
// write: AFTER Research's own supersede-then-insert when AI ran (so the
// deterministic fact survives alongside the AI-derived ones), or as the
// sole write — preceded by its own supersedePrevious call for
// retry-safety — when AI did not run for this candidate.
// -----------------------------------------------------------------------

function sourceUrlFor(entry: DeterministicSignal): string {
  const match = entry.signal.signal?.match(/(https?:\/\/\S+)$/);
  return match?.[1] ?? '';
}

export function toNewResearchSignalInput(entry: DeterministicSignal): NewResearchSignalInput {
  return {
    field: entry.field,
    kind: entry.signal.kind,
    classification: 'OBSERVED',
    signal: entry.signal.signal,
    confidence: entry.signal.confidence,
    basis: null,
    sources: [
      {
        sourceUrl: sourceUrlFor(entry),
        sourceQuote: entry.signal.signal ?? '',
        sourceLabel: 'Deterministic check',
      },
    ],
  };
}

/**
 * Persists the Phase-1 deterministic signal(s) as this Prospect's own
 * currently-active evidence, without superseding anything itself (the
 * caller sequences supersession — see this module's header comment).
 */
export async function saveDeterministicSignals(
  signals: ResearchSignalRepository,
  prospectId: string,
  entries: readonly DeterministicSignal[],
  now: Date,
): Promise<readonly StoredResearchSignal[]> {
  if (entries.length === 0) return [];
  return signals.saveSignals(prospectId, entries.map(toNewResearchSignalInput), now);
}
