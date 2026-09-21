// core-followup-preparation (Phase 23, R-61..R-69)
// -----------------------------------------------------------------------
// Owns: Follow-Up Preparation — given an Opportunity's existing, already-
// persisted Outreach Preparation artifact (@acos/core-outreach-
// preparation's output), deterministically composing a human-reviewable
// follow-up draft (context, content, rationale) that reuses Outreach
// Preparation's own evidence unmodified, and persisting it as a durable,
// re-generable record (migration 0025). A downstream consumer of
// Outreach Preparation, never a second qualification, personalization,
// or outreach-drafting mechanism: it never re-evaluates Qualification,
// Personalization, or Outreach Preparation, never re-derives
// `needDetected` or draft content, never selects evidence independently,
// and never mutates a ResearchSignal, Qualification, Personalization, or
// Outreach Preparation row.
//
// Deterministic only — no LLM call, no external fetch, no HTTP/SMTP/
// messaging-provider dependency of any kind. See
// requirement/PHASE_23_FOLLOWUP_PREPARATION_SCOPE_LOCK.md for the full
// rule set, especially R-68 (the no-send/no-execution safety gate).
//
// THIS PACKAGE CANNOT SEND, SCHEDULE, OR DELIVER ANYTHING. There is no
// `SENT`/`DELIVERED`/`SCHEDULED` state, no send/dispatch/deliver/
// transmit/schedule function, and no dependency on any transport
// library — verified structurally (package.json dependency list) and at
// runtime (./no-send.test.ts). Producing a prepared, reviewable draft is
// this package's entire terminal behavior.
//
// Does NOT own Outreach *sending*, CRM, scheduling, delivery tracking,
// reply processing, unsubscribe handling, or automatic/autonomous
// follow-up execution — see MVP_SCOPE_BOUNDARY.md and the Phase 23
// scope-lock's exclusions. `packages/core-outreach` and
// `packages/core-proposal` (separate, pre-existing, unwired packages)
// are never imported here and never import this package.
//
// Must NOT: accept a caller-supplied userId anywhere, or reimplement
// @acos/core-outreach-preparation's generateOutreachPreparation()/
// prepareOutreachForOwner()/@acos/core-personalization's
// generatePersonalization()/@acos/core-opportunity's
// createOpportunityForOwner()/suggestOffers().
// -----------------------------------------------------------------------

export { generateFollowUpPreparation, GENERATOR_VERSION } from './generator';

export { createPgFollowUpPreparationRepository } from './pgRepository';
export type { FollowUpPreparationRepository } from './repository';

export {
  getOpportunityFollowUpPreparation,
  prepareFollowUpForOwner,
  prepareOpportunityFollowUp,
} from './service';
export type { FollowUpPreparationDeps } from './service';

export { FOLLOW_UP_PREPARATION_STATES } from './types';
export type {
  FollowUpPreparationGeneration,
  FollowUpPreparationState,
  StoredFollowUpPreparation,
} from './types';
