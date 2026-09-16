import type { OpportunityStage } from '@acos/core-acquisition';

/**
 * Canonical vocabulary is @acos/core-acquisition's stages.ts
 * `OPPORTUNITY_STAGES` (nine values) — this is deliberately NOT a second
 * enum, only the subset PRD V2.1 reaches in MVP ("the MVP exercises NEW
 * and RESEARCHED"; stages beyond RESEARCHED are Phase 2+). Mirrors
 * @acos/core-discovery's `ProspectStatus`, fixed to 'DISCOVERED' alone
 * out of a larger future vocabulary.
 */
export type OpportunityState = Extract<OpportunityStage, 'NEW' | 'RESEARCHED'>;

/**
 * The persisted need/offer outcome of one @acos/core-acquisition
 * `suggestOffers()` call (R-11/R-12). `undefined` (no offer fields)
 * represents AC-14's NO SUITABLE OFFER — an explicit, representable
 * outcome, never a default to the user's own service.
 */
export interface DetectedOffer {
  service: string;
  rationale: string;
  estimatedValuePaise: number;
  /** 0-100. How well the signals matched. */
  fit: number;
  /** The signal claims this offer was based on — the evidence backing it. */
  basedOn: readonly string[];
}

/** Untrusted shape a caller supplies to create an Opportunity. Never carries id/userId. */
export interface CreateOpportunityInput {
  prospectId: string;
}

/** A row as persisted. `userId` is always server-derived (DEC-003) — never accepted as input. */
export interface StoredOpportunity {
  id: string;
  userId: string;
  prospectId: string;
  state: OpportunityState;
  needDetected: boolean;
  /** The recommended offer, or `undefined` for NO SUITABLE OFFER (AC-14). */
  offer: DetectedOffer | undefined;
  createdAt: Date;
  updatedAt: Date;
}
