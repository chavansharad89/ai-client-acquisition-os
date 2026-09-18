// core-acquisition
// -----------------------------------------------------------------------
// The Client Acquisition Engine's domain logic. Every export here is pure:
// no database, no HTTP, no model calls. Persistence lives behind
// repositories owned by the app, and message generation behind the
// MessageGenerator interface — the same shape as core-payments'
// OrderRepository and core-capi's HttpTransport.
// -----------------------------------------------------------------------

export {
  addBusinessDays,
  FOLLOW_UP_SPACING_DAYS,
  fullSequence,
  MAX_FOLLOW_UPS,
  nextBusinessDay,
  planFollowUp,
  shouldCancelOnReply,
} from './cadence';
export type { FollowUpPlan } from './cadence';

export {
  assertHumanActor,
  isHumanAuthorized,
  recordAuthorization,
  recordDecline,
  recordProposal,
  recordSend,
  recordStageChange,
  SYSTEM_ACTOR,
  timeline,
  UnauthorizedActorError,
} from './audit';
export type { Actor, AuditEntry, AuditEventKind } from './audit';

export {
  angleFor,
  availableChannels,
  CHANNEL_ESCALATION,
  chooseChannel,
  dueFollowUps,
  planNextFollowUp,
} from './followUp';
export type {
  ContactChannels,
  FollowUpChannel,
  FollowUpContext,
  FollowUpDecision,
  FollowUpProposal,
} from './followUp';

export {
  buildDashboard,
  DASHBOARD_SECTIONS,
  headlineFor,
  metricsFor,
  openOpportunities,
  sectionsFor,
} from './dashboard';
export type {
  Dashboard,
  DashboardSection,
  DashboardSnapshot,
  Metric,
  SectionSummary,
} from './dashboard';

export { anglePerformance, stageConversions, summarise } from './metrics';
export type {
  AnglePerformance,
  ClosedOpportunity,
  FunnelSummary,
  StageConversion,
} from './metrics';

export { buildBrief, MAX_BODY_CHARS, validateMessage } from './message';
export type {
  DraftMessage,
  MessageBrief,
  MessageDefect,
  MessageGenerator,
  MessageValidation,
  OutreachChannel,
} from './message';

export { buildQueue, nextActionFor, STALE_AFTER_DAYS } from './nextAction';
export type { ActionKind, NextAction, OpportunitySnapshot } from './nextAction';

export {
  BAND_THRESHOLDS,
  bandFor,
  FACTOR_WEIGHTS,
  INFERENCE_DISCOUNT,
  rankProspects,
  SCORE_FACTORS,
  scoreProspect,
} from './prospectScore';
export type {
  Claim,
  ClaimBasis,
  FactorScore,
  PayBand,
  ProspectInput,
  ProspectScore,
  ScoreBand,
  ScoreFactor,
  UrgencyBand,
} from './prospectScore';

export { DEFAULT_SERVICE_RULES, suggestOffers } from './offer';
export type { OfferSuggestion, ServiceRule } from './offer';

export {
  CONTACT_THRESHOLD,
  decayFactor,
  isWorthContacting,
  scoreLead,
  SIGNAL_FRESH_DAYS,
  SIGNAL_MAX_AGE_DAYS,
  SOURCE_WEIGHT,
} from './scoring';
export type { LeadScore, ResearchSignal, ResearchSourceKind, ScoreComponent } from './scoring';

export { classifyStaleness } from './staleness';
export type { OpportunityStaleness } from './staleness';

export { recommendOpportunityAction } from './opportunityAction';
export type { OpportunityAction, OpportunityActionInput, OpportunityActionKind } from './opportunityAction';

export {
  allowedTransitions,
  assertTransition,
  canTransition,
  InvalidStageTransitionError,
  isActive,
  isTerminal,
  OPPORTUNITY_STAGES,
  pause,
  RESUMABLE_STAGES,
  resume,
  PIPELINE_ORDER,
  pipelinePosition,
  TERMINAL_STAGES,
} from './stages';
export type { OpportunityStage, PauseRecord } from './stages';
