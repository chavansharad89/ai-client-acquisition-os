export { AnthropicConfigError, createAnthropicResearchModel } from './anthropicModel';
export type { AnthropicModelOptions } from './anthropicModel';

export {
  ProviderHttpError,
  ResearchAbortedError,
  ResearchProviderError,
  ResearchRefusedError,
  ResearchValidationError,
} from './errors';

export { abortableSleep, Deadline } from './abortable';

// ₹1,499 Client Finder subscription (Revision 5) -- deliberately exports
// only this module's own narrow kind/value shape, never K1's own
// ContactIdentifierKind or detectContactIdentifiers (REV-005 §4.1 stays
// in force: those remain internal to this package). See
// contactValueExtraction.ts's own header and
// CLIENT_FINDER_1499_CONTACT_VALUE_CAPTURE_SPIKE.md §13.
export { extractContactValues } from './contactValueExtraction';
export type { ExtractedContactValue, QualifyingContactKind } from './contactValueExtraction';

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
  normaliseUrl,
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
  CATEGORY_FITS,
  categoryFitSchema,
  categorySegmentSchema,
  CLASSIFICATIONS,
  classificationSchema,
  evidenceSchema,
  leadResearchSchema,
  observationSchema,
  observedRatio,
  RECOMMENDED_SERVICES,
  researchInputSchema,
} from './schema';
export type {
  CategoryFit,
  CategorySegmentResult,
  Classification,
  Evidence,
  LeadResearch,
  Observation,
  ResearchInput,
} from './schema';

// ---- Path 2: Research-level Category Plausibility (D0-D11, migration
// 0027) — a dedicated Search + Prospect determination, structurally
// outside FIELD_KIND/ResearchSignal (D7). See ./categoryPlausibility.ts.

export {
  aggregateCategoryFit,
  isF1CompleteSegmentDetermination,
  parseTargetSegments,
  SEGMENT_BASES,
  SEGMENT_CLASSIFICATIONS,
  toSegmentDeterminations,
  verifyCategoryPlausibility,
} from './categoryPlausibility';
export type {
  CategoryPlausibilityIssue,
  NewCategoryPlausibilityDeterminationInput,
  SegmentBasis,
  SegmentClassification,
  SegmentDetermination,
  StoredCategoryPlausibilityDetermination,
  StoredSegmentDetermination,
} from './categoryPlausibility';

export {
  createPgCategoryPlausibilityRepository,
  sourceContentSha256,
} from './categoryPlausibilityPgRepository';
export { MODEL_SEEN_SOURCE } from './categoryPlausibilityRepository';
export type {
  CapturedSourceDocumentInput,
  CategoryPlausibilityRepository,
  CategoryPlausibilitySourceDocumentReader,
  StoredCapturedSourceDocument,
} from './categoryPlausibilityRepository';
export { listSourceDocumentsForReview } from './sourceDocumentReview';
export type { SourceDocumentReviewDeps } from './sourceDocumentReview';

// ---- Research Foundation: ResearchSignal persistence (migration 0016) ----
// Owned by this same package (Research), but a distinct boundary from the
// AI engine above: this is where a validated LeadResearch result actually
// gets written down. See ./mapping's module note for why this is NOT
// ./persist.ts's toResearchRows().

export { toNewResearchSignals } from './mapping';

export type { ResearchProvider, ResearchProviderInput, SuppliedSourceDocuments } from './provider';

export {
  createHttpSourceDocumentProvider,
  HTTP_HOMEPAGE_EXTRACTION_METHOD,
  SourceFetchTransportError,
} from './sourceDocumentProvider';
export type {
  HttpSourceDocumentProviderOptions,
  SourceDocumentProvider,
  SourceDocumentTarget,
} from './sourceDocumentProvider';

export { createAnthropicResearchProvider, InsufficientEvidenceError } from './anthropicResearchProvider';
export type { AnthropicResearchProviderDeps } from './anthropicResearchProvider';

// ---- Multi-Model Research Provider (requirement/
// MULTI_MODEL_RESEARCH_PROVIDER_*.md) — OpenAI/Gemini adapters, provider
// + model selection, and cross-provider fallback. Anthropic above remains
// the compatibility baseline, unmodified. ----

export { createOpenAIResearchModel, OpenAIConfigError } from './openAIModel';
export type { OpenAIModelOptions } from './openAIModel';

export { createGeminiResearchModel, GeminiConfigError, toGeminiSchema } from './geminiModel';
export type { GeminiModelOptions } from './geminiModel';

export {
  createResearchModel,
  isResearchProviderName,
  MissingResearchModelError,
  MissingResearchProviderCredentialError,
  RESEARCH_PROVIDER_NAMES,
  UnknownResearchProviderError,
} from './researchModelFactory';
export type { ResearchModelConfig, ResearchProviderName } from './researchModelFactory';

export { createFallbackResearchProvider } from './fallbackResearchProvider';
export type {
  FallbackResearchProviderDeps,
  ResearchProviderAttempt,
} from './fallbackResearchProvider';

// ---- PCG-4 TARGET_CUSTOMER_MATCH (requirement/
// CLIENT_FINDER_PDEF_4_PCG4_TARGET_CUSTOMER_MATCH_*.md decision chain,
// migrations 0036/0037) — a dedicated Search + Prospect determination,
// never reusing category plausibility's computed output. See
// ./targetCustomerMatch.ts / ./targetCustomerMatchRepository.ts.

export {
  aggregateTargetCustomerMatch,
  callTargetCustomerMatchModel,
  evaluateTargetCustomerMatch,
  NO_MATCH_SENTINEL,
  targetCustomerMatchFindingSchema,
  targetCustomerMatchResponseSchema,
  TARGET_CUSTOMER_MATCH_PROMPT_VERSION,
  TARGET_CUSTOMER_MATCH_RESULTS,
  toObservedTargetCustomer,
  verifyTargetCustomerMatchFindings,
} from './targetCustomerMatch';
export type {
  NewTargetCustomerMatchDeterminationInput,
  StoredTargetCustomerMatchDetermination,
  TargetCustomerMatchEvaluation,
  TargetCustomerMatchEvidenceItem,
  TargetCustomerMatchFinding,
  TargetCustomerMatchModelDeps,
  TargetCustomerMatchModelOptions,
  TargetCustomerMatchResponse,
  TargetCustomerMatchResult,
} from './targetCustomerMatch';

export {
  CURRENT_ROW_UNIQUE_CONSTRAINT,
  createPgTargetCustomerMatchRepository,
  isPostgresUniqueViolation,
  targetCustomerMatchSourceContentSha256,
} from './targetCustomerMatchRepository';
export type {
  TargetCustomerMatchRepository,
  TargetCustomerMatchSourceDocumentInput,
} from './targetCustomerMatchRepository';

export {
  createPgResearchSignalRepository,
  createPgResearchSignalTransactionRunner,
} from './pgRepository';
export type { ResearchSignalSqlPool } from './pgRepository';
export type { ResearchSignalRepository, ResearchSignalTransaction } from './repository';

export { ResearchProspectNotFoundError, RunResearchValidationError } from './signalErrors';
export type { RunResearchValidationReason } from './signalErrors';

export { PROSPECT_ID_MAX_LENGTH, validateRunResearchInput } from './validation';

export {
  AUTHORIZATION_DURATION_DAYS,
  AUTHORIZATION_SCOPES,
  AUTHORIZATION_STATUSES,
  INTENT_SIGNAL_CONFIDENCE,
  INTENT_SIGNAL_FIELDS,
  INTENT_SIGNAL_KINDS,
  IntentSignalValidationError,
  isIntentSignalKind,
  toIntentIntakeInput,
  toIntentSignalInput,
  validateAuthorizationEvidence,
} from './intentSignal';
export type {
  AuthorizationEvidence,
  AuthorizationScope,
  AuthorizationStatus,
  IntentSignalEntry,
  IntentSignalField,
  IntentSignalKind,
  IntentSignalValidationReason,
  RecordIntentIntakeInput,
  RecordIntentSignalInput,
  ValidatedIntentIntake,
  ValidatedIntentSignal,
} from './intentSignal';

export {
  INTENT_SOURCE_FAMILIES,
  INTENT_SOURCE_TYPES,
  normalizeIntentEvent,
  PROHIBITED_PERSONAL_DATA_KEYS,
} from './intentSource';
export type {
  AcquisitionSourceAdapter,
  IntentDisclosure,
  IntentSourceCandidate,
  IntentSourceContext,
  IntentSourceFamily,
  IntentSourceIdentity,
  IntentSourcePrivacy,
  IntentSourceProvenance,
  IntentSourceSignalCandidate,
  IntentSourceType,
  NormalizedIntentEvent,
  NormalizedIntentSignal,
} from './intentSource';
export {
  aiPlatformAcquisitionAdapter,
  publicIntentNoticeAdapter,
  publicWebSearchAdapter,
} from './intentSourceAdapters';
export type {
  AiPlatformAcquisitionRecord,
  PublicIntentNoticeRecord,
  PublicWebSearchRecord,
  RawBusiness,
  RawSourceContext,
} from './intentSourceAdapters';
export {
  createProviderCallBudget,
  FIRST_PARTY_CONSENT_POLICY,
  normalizeProviderBatch,
  normalizeProviderResult,
  normalizeVerifiedProviderResult,
  PROVIDER_FAILURE_HANDLING,
  PROVIDER_FAILURE_KINDS,
  PROVIDER_OPERATIONAL_CONTRACT,
  PROVIDER_PROHIBITED_KEYS,
  ProviderCallBudgetExceededError,
  requireExactProviderResultForIntake,
} from './intentSourceProviderContract';
export type {
  AiPlatformAuthorization,
  AiPlatformEvidenceItem,
  AiPlatformProviderSignal,
  IntentProviderResult,
  ProviderBusinessIdentity,
  ProviderCallBudget,
  ProviderContractNotes,
  ProviderFailureHandling,
  ProviderFailureKind,
  ProviderIntentEvidence,
  ProviderPublication,
  ProviderResultOutcome,
  ProviderResultProvenance,
  PublicIntentProviderNotice,
  PublicWebSearchProviderResult,
} from './intentSourceProviderContract';
export {
  createProviderPublicKeyRegistry,
  MAX_PROVIDER_ENVELOPE_BYTES,
  PROVIDER_ENVELOPE_VERSION,
  PROVIDER_SIGNATURE_FRESHNESS_MS,
  ProviderKeyRegistryConfigurationError,
  verifyProviderEnvelope,
} from './providerAuthenticity';
export type {
  ProviderAuthenticityRejection,
  ProviderEnvelopeRequest,
  ProviderEnvelopeVerification,
  ProviderPublicKeyEntry,
  ProviderPublicKeyRegistry,
  RegisteredProviderPublicKey,
  VerifiedProviderResult,
} from './providerAuthenticity';

export {
  getCategoryPlausibilityDetermination,
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
