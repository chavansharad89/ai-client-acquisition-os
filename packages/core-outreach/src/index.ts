export { CHANNEL_SPECS, OUTREACH_CHANNELS, specFor } from './channels';
export type { ChannelSpec, OutreachChannel } from './channels';

export {
  applyHumanEdit,
  approve,
  ApprovalTransitionError,
  assertTransition,
  canTransition,
  isSendable,
  markSent,
  reject,
} from './approval';

export {
  generateOutreach,
  OutreachGenerationError,
  OutreachRefusedError,
  toEvidencePool,
} from './generator';
export type {
  GenerateContext,
  GeneratedDraft,
  GenerateOptions,
  GenerateResult,
  OutreachModel,
} from './generator';

export { buildRepairMessage, buildUserMessage, PROMPT_VERSION, SYSTEM_PROMPT } from './prompt';

export {
  APPROVAL_STATES,
  approvalStateSchema,
  channelSchema,
  generatedMessageSchema,
  generationInputSchema,
  generationOutputSchema,
  storedMessageSchema,
} from './schema';
export type {
  ApprovalState,
  GeneratedMessage,
  GenerationInput,
  GenerationOutput,
  StoredMessage,
} from './schema';

export { SPAM_PHRASES, verifyAll, verifyMessage } from './verify';
export type { Defect, MessageDefect, Verification } from './verify';
