import { createHash } from 'node:crypto';

import {
  INTENT_SIGNAL_CONFIDENCE,
  IntentSignalValidationError,
  toIntentIntakeInput,
  type AuthorizationEvidence,
  type IntentSignalField,
  type IntentSignalKind,
  type RecordIntentIntakeInput,
} from './intentSignal';

// Acquisition-source boundary for intent intake (provider-free).
// -----------------------------------------------------------------------
//   raw source evidence (adapter-specific shape)
//     -> AcquisitionSourceAdapter.normalize   pure mapping, no I/O
//     -> normalizeIntentEvent                 the ONE central path:
//          privacy screen, provenance checks, kind from disclosure,
//          then toIntentIntakeInput (D5 fixed confidence, OBSERVED)
//     -> NormalizedIntentEvent.intake         a RecordIntentIntakeInput
//     -> recordIntentIntakeForOwner           the canonical persistence
//                                             path (unchanged)
//
// Adapters never persist, never create Prospects / Opportunities /
// determinations / offers / outreach, and never choose kind, confidence
// or classification. A source appearance is an acquisition signal, not a
// research determination: D4 research and qualification still apply.
//
// Provenance persists through the existing research_signal_sources
// columns: evidence -> source_quote, sourceReference -> source_url,
// family + type -> source_label (plain text, as D10-C does for evidence
// labels). externalId, capturedAt and context live on the normalized
// event only — no schema change.
//
// Privacy: business-level evidence only. Raw input carrying individual
// identifiers (search history, queries, cookies, device / account IDs,
// AI-conversation content, click IDs) is rejected, never stripped.
// -----------------------------------------------------------------------

export const INTENT_SOURCE_TYPES = {
  /** Google Search / public web: public business-level pages only. */
  PUBLIC_WEB_SEARCH: [
    'SEARCH_RESULT',
    'PUBLIC_PAGE',
    'PROCUREMENT_NOTICE',
    'PROJECT_POSTING',
    'HIRING_SIGNAL',
    'TECHNOLOGY_MIGRATION',
  ],
  /** AI-platform ads / referrals: only what an authorized integration supplies. */
  AI_PLATFORM_ACQUISITION: ['AI_PLATFORM_AD', 'AI_REFERRAL', 'SPONSORED_PLACEMENT'],
  /** Other public intent: RFPs, project requests, announcements, hiring, migrations. */
  PUBLIC_INTENT_NOTICE: [
    'RFP_NOTICE',
    'PROJECT_REQUEST',
    'COMPANY_ANNOUNCEMENT',
    'HIRING_SIGNAL',
    'TECHNOLOGY_MIGRATION',
  ],
} as const;

export type IntentSourceFamily = keyof typeof INTENT_SOURCE_TYPES;
export type IntentSourceType = (typeof INTENT_SOURCE_TYPES)[IntentSourceFamily][number];
export const INTENT_SOURCE_FAMILIES = Object.keys(INTENT_SOURCE_TYPES) as IntentSourceFamily[];

/**
 * How the business made the statement available. The repository's intake
 * semantics: published publicly -> PUBLIC_INTENT; supplied to us (e.g. a
 * landing-page form) -> FIRST_PARTY.
 */
export type IntentDisclosure = 'PUBLISHED' | 'SUPPLIED_TO_US';

const DISCLOSURE_KIND: Readonly<Record<IntentDisclosure, IntentSignalKind>> = {
  PUBLISHED: 'PUBLIC_INTENT',
  SUPPLIED_TO_US: 'FIRST_PARTY',
};

const FAMILY_DISCLOSURES: Readonly<Record<IntentSourceFamily, readonly IntentDisclosure[]>> = {
  PUBLIC_WEB_SEARCH: ['PUBLISHED'],
  AI_PLATFORM_ACQUISITION: ['PUBLISHED', 'SUPPLIED_TO_US'],
  PUBLIC_INTENT_NOTICE: ['PUBLISHED'],
};

const FAMILY_LABEL: Readonly<Record<IntentSourceFamily, string>> = {
  PUBLIC_WEB_SEARCH: 'Public web search',
  AI_PLATFORM_ACQUISITION: 'AI-platform acquisition',
  PUBLIC_INTENT_NOTICE: 'Public intent notice',
};

export interface IntentSourceIdentity {
  sourceFamily: IntentSourceFamily;
  sourceType: IntentSourceType;
  /** Source-specific identifier where the source provides one. */
  externalId: string | null;
}

export interface IntentSourceContext {
  targetCustomer: string | null;
  geography: string | null;
  service: string | null;
}

/** One statement of intent inside a source event, as mapped by an adapter. */
export interface IntentSourceSignalCandidate {
  disclosure: IntentDisclosure;
  field: IntentSignalField;
  /** Verbatim evidence text. */
  evidence: string;
  /** Absolute http(s) URL where the evidence can be checked. */
  sourceReference: string;
  observedAt: Date;
}

/** Adapter output: untrusted until normalizeIntentEvent accepts it. */
export interface IntentSourceCandidate extends IntentSourceIdentity {
  business: { companyName: string; website: string };
  context: IntentSourceContext;
  signals: readonly IntentSourceSignalCandidate[];
  /** Per-event integration evidence; normalizeIntentEvent attaches it to FIRST_PARTY signals only (OD-7). */
  authorizationEvidence?: AuthorizationEvidence;
}

/** Provider-neutral adapter contract. Implementations are pure mappers. */
export interface AcquisitionSourceAdapter<Raw> {
  readonly sourceFamily: IntentSourceFamily;
  identifySource(raw: Raw): IntentSourceIdentity;
  normalize(raw: Raw): IntentSourceCandidate;
}

export interface IntentSourcePrivacy {
  publicBusinessSignal: boolean;
  personalDataUsed: false;
  individualIdentityRequired: false;
  /** false for published business evidence; null = not determined by this layer (supplied-to-us). */
  consentRequired: false | null;
}

export interface IntentSourceProvenance extends IntentSourceIdentity {
  sourceReference: string;
  /** Persisted as research_signal_sources.source_label. */
  sourceLabel: string;
  observedAt: Date;
  capturedAt: Date;
}

export interface NormalizedIntentSignal {
  kind: IntentSignalKind;
  classification: 'OBSERVED';
  confidence: number;
  field: IntentSignalField;
  evidence: string;
  provenance: IntentSourceProvenance;
  privacy: IntentSourcePrivacy;
}

export interface NormalizedIntentEvent extends IntentSourceIdentity {
  /** Deterministic over the source content: the same raw event gives the same id. */
  eventId: string;
  capturedAt: Date;
  context: IntentSourceContext;
  signals: readonly NormalizedIntentSignal[];
  /** Hand to recordIntentIntakeForOwner — the canonical persistence path. */
  intake: RecordIntentIntakeInput;
}

/** Keys that mean individual-level data. Compared lower-case, without `_` / `-`. */
export const PROHIBITED_PERSONAL_DATA_KEYS: readonly string[] = [
  'searchhistory',
  'searchquery',
  'searchqueries',
  'query',
  'queries',
  'cookie',
  'cookies',
  'deviceid',
  'browserid',
  'advertisingid',
  'idfa',
  'gaid',
  'clientid',
  'userid',
  'accountid',
  'googleaccountid',
  'email',
  'phone',
  'phonenumber',
  'ipaddress',
  'useragent',
  'sessionid',
  'conversation',
  'conversationid',
  'chattranscript',
  'transcript',
  'prompt',
  'prompts',
  'gclid',
  'fbclid',
  'msclkid',
];

const TRACKING_URL_PARAMS: readonly string[] = ['gclid', 'fbclid', 'msclkid', 'dclid', 'gbraid', 'wbraid'];
const SYSTEM_ASSIGNED_KEYS: readonly string[] = ['kind', 'confidence', 'classification'];

function screenPersonalData(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => screenPersonalData(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== 'object' || value === null || value instanceof Date) return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (PROHIBITED_PERSONAL_DATA_KEYS.includes(key.toLowerCase().replace(/[_-]/g, ''))) {
      throw new IntentSignalValidationError(
        childPath,
        'not-allowed',
        `${childPath} is individual-level data — intent sources carry business-level evidence only`,
      );
    }
    screenPersonalData(child, childPath);
  }
}

function rejectSystemAssigned(value: object, path: string): void {
  for (const key of SYSTEM_ASSIGNED_KEYS) {
    if (key in value) {
      const field = path ? `${path}.${key}` : key;
      throw new IntentSignalValidationError(field, 'not-allowed', `${field} is assigned centrally, not by a source`);
    }
  }
}

function checkReference(reference: unknown, path: string): void {
  if (typeof reference !== 'string' || reference.trim().length === 0) {
    throw new IntentSignalValidationError(path, 'required', `${path} (source provenance) is required`);
  }
  let url: URL;
  try {
    url = new URL(reference.trim());
  } catch {
    throw new IntentSignalValidationError(path, 'invalid', `${path} must be an absolute URL`);
  }
  for (const param of url.searchParams.keys()) {
    if (TRACKING_URL_PARAMS.includes(param.toLowerCase())) {
      throw new IntentSignalValidationError(path, 'not-allowed', `${path} carries a click/tracking identifier`);
    }
  }
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

/**
 * The single normalization path for every acquisition source. Validates
 * the whole event before returning — nothing is persisted here.
 */
export function normalizeIntentEvent<Raw>(
  adapter: AcquisitionSourceAdapter<Raw>,
  raw: Raw,
  options: { searchId: string; capturedAt: Date; now?: Date },
): NormalizedIntentEvent {
  const now = options.now ?? new Date();
  screenPersonalData(raw, '');

  const identity = adapter.identifySource(raw);
  const candidate = adapter.normalize(raw);
  screenPersonalData(candidate, '');
  rejectSystemAssigned(candidate, '');

  const sourceFamily = candidate.sourceFamily;
  if (
    sourceFamily !== adapter.sourceFamily ||
    identity.sourceFamily !== sourceFamily ||
    !(INTENT_SOURCE_FAMILIES as string[]).includes(sourceFamily)
  ) {
    throw new IntentSignalValidationError('sourceFamily', 'invalid', 'sourceFamily does not match the adapter');
  }
  const sourceType = candidate.sourceType;
  if (identity.sourceType !== sourceType || !(INTENT_SOURCE_TYPES[sourceFamily] as readonly string[]).includes(sourceType)) {
    throw new IntentSignalValidationError('sourceType', 'unsupported', `sourceType is not a ${sourceFamily} type`);
  }
  const externalId = optionalText(candidate.externalId);
  if (externalId !== optionalText(identity.externalId)) {
    throw new IntentSignalValidationError('externalId', 'invalid', 'externalId does not match identifySource');
  }

  const capturedAt = options.capturedAt;
  if (!(capturedAt instanceof Date) || Number.isNaN(capturedAt.getTime()) || capturedAt > now) {
    throw new IntentSignalValidationError('capturedAt', 'invalid', 'capturedAt must be a valid, non-future time');
  }

  if (!Array.isArray(candidate.signals as unknown) || candidate.signals.length === 0) {
    throw new IntentSignalValidationError('signals', 'required', 'a source event must contain at least one signal');
  }
  candidate.signals.forEach((signal, index) => {
    const path = `signals[${index}]`;
    rejectSystemAssigned(signal, path);
    if (!FAMILY_DISCLOSURES[sourceFamily].includes(signal.disclosure)) {
      throw new IntentSignalValidationError(
        `${path}.disclosure`,
        'unsupported',
        `${sourceFamily} sources may only disclose: ${FAMILY_DISCLOSURES[sourceFamily].join(', ')}`,
      );
    }
    checkReference(signal.sourceReference, `${path}.sourceReference`);
    if (signal.observedAt instanceof Date && signal.observedAt > capturedAt) {
      throw new IntentSignalValidationError(`${path}.observedAt`, 'invalid', 'observedAt cannot be after capturedAt');
    }
  });

  const sourceLabel = `${FAMILY_LABEL[sourceFamily]} · ${sourceType.toLowerCase().replace(/_/g, ' ')}`;
  const intake: RecordIntentIntakeInput = {
    searchId: options.searchId,
    companyName: candidate.business?.companyName,
    website: candidate.business?.website,
    signals: candidate.signals.map((signal) => {
      const kind = DISCLOSURE_KIND[signal.disclosure];
      return {
        kind,
        field: signal.field,
        quote: signal.evidence,
        sourceUrl: signal.sourceReference,
        sourceLabel,
        observedAt: signal.observedAt,
        // OD-7: evidence rides on FIRST_PARTY only; PUBLIC_INTENT never carries it.
        ...(kind === 'FIRST_PARTY' && candidate.authorizationEvidence !== undefined
          ? { authorizationEvidence: candidate.authorizationEvidence }
          : {}),
      };
    }),
  };
  // Central D5 / intake validation — the same rules recordIntentIntakeForOwner applies.
  const validated = toIntentIntakeInput(intake, now);

  const signals = validated.signals.map(({ signal, observedAt }): NormalizedIntentSignal => {
    const kind = signal.kind as IntentSignalKind;
    const source = signal.sources[0]!;
    return {
      kind,
      classification: 'OBSERVED',
      confidence: INTENT_SIGNAL_CONFIDENCE[kind],
      field: signal.field as IntentSignalField,
      evidence: source.sourceQuote,
      provenance: {
        sourceFamily,
        sourceType,
        externalId,
        sourceReference: source.sourceUrl,
        sourceLabel: source.sourceLabel,
        observedAt,
        capturedAt,
      },
      privacy: {
        publicBusinessSignal: kind === 'PUBLIC_INTENT',
        personalDataUsed: false,
        individualIdentityRequired: false,
        consentRequired: kind === 'PUBLIC_INTENT' ? false : null,
      },
    };
  });

  const eventId = createHash('sha256')
    .update(
      JSON.stringify([
        sourceFamily,
        sourceType,
        externalId,
        validated.website,
        signals.map((s) => [s.kind, s.field, s.evidence, s.provenance.sourceReference, s.provenance.observedAt.toISOString()]),
      ]),
    )
    .digest('hex');

  return {
    eventId,
    sourceFamily,
    sourceType,
    externalId,
    capturedAt,
    context: {
      targetCustomer: optionalText(candidate.context?.targetCustomer),
      geography: optionalText(candidate.context?.geography),
      service: optionalText(candidate.context?.service),
    },
    signals,
    intake,
  };
}
