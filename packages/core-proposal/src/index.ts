export {
  buildRepairMessage,
  buildUserMessage,
  generateProposal,
  ProposalGenerationError,
  ProposalRefusedError,
  PROMPT_VERSION,
  SYSTEM_PROMPT,
} from './generator';
export type {
  GenerateProposalOptions,
  GenerateProposalResult,
  ProposalContext,
  ProposalModel,
} from './generator';

export { checkPricing, extractMoney, formatPaise, HEDGE_PHRASES } from './pricing';
export type { MoneyMention, PricingCheck, PricingDefect } from './pricing';

export {
  generatedProposalSchema,
  PROPOSAL_STATES,
  proposalInputSchema,
  proposalSchema,
  proposalVersionSchema,
} from './schema';
export type {
  GeneratedProposal,
  Proposal,
  ProposalInput,
  ProposalState,
  ProposalVersion,
} from './schema';

export {
  coversAllSections,
  PROPOSAL_SECTIONS,
  PROPOSAL_TEMPLATES,
  templateById,
} from './templates';
export type { ProposalSection, ProposalTemplate, SectionSpec } from './templates';

export { verifyProposal } from './verify';
export type { Defect, ProposalDefect, ProposalVerification } from './verify';

export {
  appendEdit,
  approve,
  assertTransition,
  canTransition,
  currentVersion,
  history,
  markSent,
  ProposalStateError,
  recordAnswer,
  sentVersion,
  SYSTEM_AUTHOR,
} from './versions';
export type { EditInput } from './versions';
