export { AnthropicConfigError, createAnthropicResearchModel } from './anthropicModel';
export type { AnthropicModelOptions } from './anthropicModel';

export {
  ResearchAbortedError,
  ResearchProviderError,
  ResearchRefusedError,
  ResearchValidationError,
} from './errors';

export { abortableSleep, Deadline } from './abortable';

export { UnsupportedSchemaNodeError, zodToJsonSchema } from './jsonSchema';

export { effectiveConfidence, storeResearch, toResearchRows, toRunRecord } from './persist';
export type {
  LeadResearchRow,
  ResearchRepository,
  ResearchRunRecord,
  ResearchSourceKind,
} from './persist';

export {
  buildRepairMessage,
  buildTargetedRepairMessage,
  buildUserMessage,
  SYSTEM_PROMPT,
} from './prompt';

export {
  applyRepair,
  excerptFor,
  MAX_REPAIR_ISSUES,
  needsSourceContext,
  planRepair,
  repairRoot,
  repairRoots,
} from './repair';
export type { RepairIssue, RepairPlan } from './repair';

export {
  formatProvenanceIssues,
  MIN_QUOTE_CHARS,
  normaliseForMatch,
  verifyProvenance,
} from './provenance';
export type { ProvenanceIssue, SourceDocument } from './provenance';

export { backoffDelayMs, researchLead, toProviderError } from './researcher';
export type {
  ModelInvocationUsage,
  ModelResult,
  ResearchModel,
  ResearchOptions,
  ResearchOutcome,
} from './researcher';

export {
  allObservations,
  CLASSIFICATIONS,
  classificationSchema,
  evidenceSchema,
  leadResearchSchema,
  observationSchema,
  observedRatio,
  RECOMMENDED_SERVICES,
  researchInputSchema,
} from './schema';
export type { Classification, Evidence, LeadResearch, Observation, ResearchInput } from './schema';

// ---- Research Foundation: ResearchSignal persistence (migration 0016) ----
// Owned by this same package (Research), but a distinct boundary from the
// AI engine above: this is where a validated LeadResearch result actually
// gets written down. See ./mapping's module note for why this is NOT
// ./persist.ts's toResearchRows().

export { toNewResearchSignals } from './mapping';

export type { ResearchProvider, ResearchProviderInput } from './provider';

export { createPgResearchSignalRepository } from './pgRepository';
export type { ResearchSignalRepository } from './repository';

export { ResearchProspectNotFoundError, RunResearchValidationError } from './signalErrors';
export type { RunResearchValidationReason } from './signalErrors';

export { PROSPECT_ID_MAX_LENGTH, validateRunResearchInput } from './validation';

export {
  listResearchSignals,
  runResearch,
  runResearchForOwner,
  scoreResearchedProspect,
} from './service';
export type {
  ResearchDeps,
  ResearchedProspectScore,
  ScoreResearchedProspectInput,
} from './service';

// ---- Scoring foundation: persisted ResearchSignal -> scoring contract ----
// Owned by this package (the persisted shape), adapting onto
// @acos/core-acquisition's existing, unmodified scoreProspect() — see
// ./scoringAdapter's module note.

export { toScoringSignals } from './scoringAdapter';
export type { ScoringSignalAdaptation } from './scoringAdapter';

export type {
  NewResearchSignalInput,
  ResearchRunResult,
  ResearchSignalSourceInput,
  RunResearchInput,
  StoredResearchSignal,
  StoredResearchSignalSource,
} from './types';
