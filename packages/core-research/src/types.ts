import type { ResearchSourceKind } from './persist';
import type { Classification } from './schema';

/**
 * Persisted domain objects for the Research Foundation (PRD V2.1
 * R-09/R-10, "EVIDENCE MODEL", DEC-008). ResearchSignal is the fifth
 * user-owned Client Finder domain object, owned through Prospect — see
 * ./repository and migration 0016.
 */

export interface ResearchSignalSourceInput {
  sourceUrl: string;
  sourceQuote: string;
  sourceLabel: string;
}

/**
 * One claim (Observation), ready to persist. Field names deliberately
 * match @acos/core-acquisition's existing `ResearchSignal` scoring input
 * (`kind`, `signal`, `confidence`, `observedAt`) — see PRD V2.1
 * "INFERENCE DISCOUNT — CANONICAL FLOW": confidence here is RAW,
 * unadjusted; the inference discount belongs to that scoring layer, not
 * here.
 */
export interface NewResearchSignalInput {
  /** The Observation's field name (companySummary, visibleProblems, ...). */
  field: string;
  kind: ResearchSourceKind;
  classification: Classification;
  /** The claim text. Null only for UNKNOWN — UNKNOWN must survive persistence. */
  signal: string | null;
  /** 0-100, raw and unadjusted. */
  confidence: number;
  /** INFERRED's reasoning trail. Null for OBSERVED/UNKNOWN. */
  basis: string | null;
  /** Empty for INFERRED/UNKNOWN; one or more for OBSERVED. */
  sources: readonly ResearchSignalSourceInput[];
}

export interface StoredResearchSignalSource extends ResearchSignalSourceInput {
  id: string;
}

export interface StoredResearchSignal {
  id: string;
  prospectId: string;
  field: string;
  kind: ResearchSourceKind;
  classification: Classification;
  signal: string | null;
  confidence: number;
  basis: string | null;
  observedAt: Date;
  /** Never deleted — a re-research run supersedes prior rows instead. */
  supersededAt: Date | null;
  sources: readonly StoredResearchSignalSource[];
}

/** Untrusted shape a caller supplies to run research. Never carries userId. */
export interface RunResearchInput {
  prospectId: string;
}

export interface ResearchRunResult {
  prospectId: string;
  /** Count of prior signals marked superseded by this run. */
  superseded: number;
  signals: readonly StoredResearchSignal[];
}
