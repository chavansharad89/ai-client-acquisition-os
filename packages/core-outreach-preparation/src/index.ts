// core-outreach-preparation (Phase 22, R-54..R-60)
// -----------------------------------------------------------------------
// Owns: Outreach Preparation — given an Opportunity's existing, already-
// persisted Personalization artifact (@acos/core-personalization's
// output), deterministically composing a human-reviewable draft message
// (subject line, body, call to action) that reuses Personalization's own
// evidence unmodified, and persisting it as a durable, re-generable
// record (migration 0024). A downstream consumer of
// Opportunity/Personalization, never a second qualification,
// need-detection, or personalization mechanism: it never re-evaluates
// Qualification or Personalization, never re-derives `needDetected`,
// never selects evidence independently, and never mutates a
// ResearchSignal, Qualification, or Personalization row.
//
// Deterministic only — no LLM call, no external fetch, no HTTP/SMTP/
// messaging-provider dependency of any kind. See
// requirement/PHASE_22_OUTREACH_PREPARATION_SCOPE_LOCK.md for the full
// rule set, especially R-58 (the no-send safety gate) and Decision O1.
//
// THIS PACKAGE CANNOT SEND ANYTHING. There is no `SENT`/`DELIVERED`/
// `SCHEDULED` state, no send/dispatch/deliver/transmit function, and no
// dependency on any transport library — verified structurally
// (package.json dependency list) and at runtime (./no-send.test.ts).
// Producing a prepared draft is this package's entire terminal behavior.
//
// Does NOT own Outreach *sending*, CRM, scheduling, delivery tracking,
// reply processing, or unsubscribe handling — see
// MVP_SCOPE_BOUNDARY.md and the Phase 22 scope-lock's exclusions.
// `packages/core-outreach` (a separate, pre-existing, unwired package
// with its own SENT state and LLM generator) is never imported here and
// never imports this package.
//
// Must NOT: accept a caller-supplied userId anywhere, or reimplement
// @acos/core-personalization's generatePersonalization()/
// selectPersonalizationEvidence()/@acos/core-opportunity's
// createOpportunityForOwner()/suggestOffers().
// -----------------------------------------------------------------------

export { generateOutreachPreparation, GENERATOR_VERSION } from './generator';

export { createPgOutreachPreparationRepository } from './pgRepository';
export type { OutreachPreparationRepository } from './repository';

export {
  getOpportunityOutreachPreparation,
  prepareOpportunityOutreach,
  prepareOutreachForOwner,
} from './service';
export type { OutreachPreparationDeps } from './service';

export { OUTREACH_PREPARATION_STATES } from './types';
export type {
  OutreachPreparationGeneration,
  OutreachPreparationState,
  StoredOutreachPreparation,
} from './types';
