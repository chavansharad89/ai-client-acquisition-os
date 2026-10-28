import type { AuthorizationEvidence, IntentSignalField } from './intentSignal';
import type {
  INTENT_SOURCE_TYPES,
  AcquisitionSourceAdapter,
  IntentDisclosure,
  IntentSourceContext,
  IntentSourceType,
} from './intentSource';

// Provider-neutral adapters for the three acquisition-source families.
// Each maps an already-obtained raw record (fixture today; an authorized
// integration's payload later) to an IntentSourceCandidate. None performs
// I/O, holds credentials, or assigns kind / confidence / classification —
// normalizeIntentEvent does that centrally.

export interface RawBusiness {
  name: string;
  website: string;
}

export type RawSourceContext = Partial<IntentSourceContext>;

function context(raw: RawSourceContext | undefined): IntentSourceContext {
  return {
    targetCustomer: raw?.targetCustomer ?? null,
    geography: raw?.geography ?? null,
    service: raw?.service ?? null,
  };
}

// ---- A. Google Search / public web intent ----------------------------------

/** One public, business-level search result or page. Never a user's query or history. */
export interface PublicWebSearchRecord {
  resultType: (typeof INTENT_SOURCE_TYPES)['PUBLIC_WEB_SEARCH'][number];
  resultId?: string | null;
  pageUrl: string;
  organization: RawBusiness;
  excerpt: string;
  requirement: IntentSignalField;
  publishedAt: Date;
  context?: RawSourceContext;
}

export const publicWebSearchAdapter: AcquisitionSourceAdapter<PublicWebSearchRecord> = {
  sourceFamily: 'PUBLIC_WEB_SEARCH',
  identifySource: (raw) => ({
    sourceFamily: 'PUBLIC_WEB_SEARCH',
    sourceType: raw.resultType,
    externalId: raw.resultId ?? null,
  }),
  normalize: (raw) => ({
    ...publicWebSearchAdapter.identifySource(raw),
    business: { companyName: raw.organization?.name, website: raw.organization?.website },
    context: context(raw.context),
    signals: [
      {
        disclosure: 'PUBLISHED',
        field: raw.requirement,
        evidence: raw.excerpt,
        sourceReference: raw.pageUrl,
        observedAt: raw.publishedAt,
      },
    ],
  }),
};

// ---- B. AI-platform advertising / referral acquisition ---------------------

/**
 * An acquisition event as an authorized AI-platform ad / referral
 * integration would supply it: what the business itself stated. It never
 * contains the conversation, prompt or identity of any platform user.
 */
export interface AiPlatformAcquisitionRecord {
  placement: 'AI_PLATFORM_AD' | 'AI_REFERRAL' | 'SPONSORED_PLACEMENT';
  integrationEventId: string;
  business: RawBusiness;
  /** Where the business's statement was received (e.g. our landing page). */
  landingUrl: string;
  interests: ReadonlyArray<{
    disclosure: IntentDisclosure;
    requirement: IntentSignalField;
    statement: string;
    referenceUrl?: string;
    occurredAt: Date;
  }>;
  context?: RawSourceContext;
  /** Validated integration evidence; attached to FIRST_PARTY signals only (OD-7). */
  authorizationEvidence?: AuthorizationEvidence;
}

export const aiPlatformAcquisitionAdapter: AcquisitionSourceAdapter<AiPlatformAcquisitionRecord> = {
  sourceFamily: 'AI_PLATFORM_ACQUISITION',
  identifySource: (raw) => ({
    sourceFamily: 'AI_PLATFORM_ACQUISITION',
    sourceType: raw.placement,
    externalId: raw.integrationEventId ?? null,
  }),
  normalize: (raw) => ({
    ...aiPlatformAcquisitionAdapter.identifySource(raw),
    business: { companyName: raw.business?.name, website: raw.business?.website },
    context: context(raw.context),
    signals: (raw.interests ?? []).map((interest) => ({
      disclosure: interest.disclosure,
      field: interest.requirement,
      evidence: interest.statement,
      sourceReference: interest.referenceUrl ?? raw.landingUrl,
      observedAt: interest.occurredAt,
    })),
    ...(raw.authorizationEvidence === undefined ? {} : { authorizationEvidence: raw.authorizationEvidence }),
  }),
};

// ---- C. Other public intent (RFPs, requests, announcements, hiring) --------

export interface PublicIntentNoticeRecord {
  noticeType: Extract<
    IntentSourceType,
    'RFP_NOTICE' | 'PROJECT_REQUEST' | 'COMPANY_ANNOUNCEMENT' | 'HIRING_SIGNAL' | 'TECHNOLOGY_MIGRATION'
  >;
  noticeId?: string | null;
  noticeUrl: string;
  organization: RawBusiness;
  requirements: ReadonlyArray<{ requirement: IntentSignalField; text: string }>;
  postedAt: Date;
  context?: RawSourceContext;
}

export const publicIntentNoticeAdapter: AcquisitionSourceAdapter<PublicIntentNoticeRecord> = {
  sourceFamily: 'PUBLIC_INTENT_NOTICE',
  identifySource: (raw) => ({
    sourceFamily: 'PUBLIC_INTENT_NOTICE',
    sourceType: raw.noticeType,
    externalId: raw.noticeId ?? null,
  }),
  normalize: (raw) => ({
    ...publicIntentNoticeAdapter.identifySource(raw),
    business: { companyName: raw.organization?.name, website: raw.organization?.website },
    context: context(raw.context),
    signals: (raw.requirements ?? []).map((item) => ({
      disclosure: 'PUBLISHED' as const,
      field: item.requirement,
      evidence: item.text,
      sourceReference: raw.noticeUrl,
      observedAt: raw.postedAt,
    })),
  }),
};
