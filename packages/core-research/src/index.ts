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
export type { ModelResult, ResearchModel, ResearchOptions, ResearchOutcome } from './researcher';

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
