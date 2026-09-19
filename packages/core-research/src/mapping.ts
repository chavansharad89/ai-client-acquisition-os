import { FIELD_KIND } from './persist';
import { allObservations, type LeadResearch } from './schema';
import type { NewResearchSignalInput } from './types';

// The Research Foundation's persistence adapter.
// -----------------------------------------------------------------------
// Deliberately NOT ./persist.ts's toResearchRows(): that adapter drops
// UNKNOWN, folds classification into confidence (effectiveConfidence)
// and keeps only the first evidence source — none of which survives
// here. Every Observation becomes exactly one NewResearchSignalInput,
// unfiltered, with its raw confidence and every evidence source intact
// (PRD V2.1 "EVIDENCE MODEL" / AC-12). The inference discount is applied
// once, later, at scoring time — never here.
// -----------------------------------------------------------------------

export function toNewResearchSignals(research: LeadResearch): readonly NewResearchSignalInput[] {
  return allObservations(research).map((observation) => ({
    field: observation.field,
    kind: FIELD_KIND[observation.field] ?? 'WEBSITE',
    classification: observation.classification,
    signal: observation.value,
    confidence: observation.confidence,
    basis: observation.basis,
    sources: observation.evidence.map((evidence) => ({
      sourceUrl: evidence.sourceUrl,
      sourceQuote: evidence.quote,
      sourceLabel: evidence.sourceLabel,
    })),
  }));
}
