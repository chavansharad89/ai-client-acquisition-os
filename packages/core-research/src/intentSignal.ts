import { containsPersonalContactIdentifier as k1ContainsPersonal } from './contactIdentifiers';
import type { ResearchSourceKind } from './persist';
import type { VerifiedProviderResult } from './providerAuthenticity';
import type { NewResearchSignalInput } from './types';

// Intent intake signals (INTENT-INTAKE-PO-DEC-001, migration 0029).
// -----------------------------------------------------------------------
// A PUBLIC_INTENT or FIRST_PARTY signal is a captured, observed intent
// EVENT — a quote someone published or supplied — stored as an ordinary
// ResearchSignal row so every downstream consumer (scoring, offer,
// qualification, personalization) reads it unchanged. It is not a
// research finding: Research never produces these kinds, and research
// re-runs never supersede them (see ResearchSignalRepository.
// supersedePrevious). It proves only that the quote was observed at
// `observedAt`, not that a requirement exists — the existing Research
// run remains responsible for its own determinations (D4).
//
// Confidence and classification are system-assigned (D5): a caller
// supplying either is rejected, not silently overridden.
// -----------------------------------------------------------------------

export const INTENT_SIGNAL_KINDS = ['PUBLIC_INTENT', 'FIRST_PARTY'] as const;
export type IntentSignalKind = (typeof INTENT_SIGNAL_KINDS)[number];

/** D5 (Option A, revision 2): fixed per kind, never caller-supplied. */
export const INTENT_SIGNAL_CONFIDENCE: Readonly<Record<IntentSignalKind, number>> = {
  PUBLIC_INTENT: 70,
  FIRST_PARTY: 90,
};

/**
 * Problem-shaped fields only. The topical fields (companySummary,
 * businessModel, targetCustomers) are excluded on purpose: R-71
 * (@acos/core-opportunity's toOfferSignals) drops them from the offer
 * engine, and an intent quote describes a need, not the business.
 */
export const INTENT_SIGNAL_FIELDS = [
  'statedRequirement',
  'requestedWebsite',
  'requestedMobileApp',
  'requestedRedesign',
  'requestedDevelopment',
  'requestedFeature',
] as const;
export type IntentSignalField = (typeof INTENT_SIGNAL_FIELDS)[number];

export const INTENT_COMPANY_NAME_MAX_LENGTH = 200;
export const INTENT_WEBSITE_MAX_LENGTH = 500;
export const INTENT_QUOTE_MAX_LENGTH = 2000;
export const INTENT_SOURCE_URL_MAX_LENGTH = 2000;
export const INTENT_SOURCE_LABEL_MAX_LENGTH = 100;
export const INTENT_SEARCH_ID_MAX_LENGTH = 200;

export function isIntentSignalKind(kind: ResearchSourceKind | string): kind is IntentSignalKind {
  return (INTENT_SIGNAL_KINDS as readonly string[]).includes(kind);
}

// ---- FIRST_PARTY authorization evidence (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 rev. 2, OD-1..OD-7) ----
// Integration-supplied, stored verbatim; nothing is derived, defaulted or
// inferred. The vocabularies live here only — the database has no CHECK /
// enum for them (DEC-005 §3.1). Contract evidence is integration-asserted,
// not authenticated (OD-13): no runtime caller may feed AI-platform results
// carrying SUPPLIED_TO_US items into intake until an authenticity mechanism
// is separately decided and built.

/** OD-1: closed vocabulary. Only GRANTED permits persistence; REVOKED / EXPIRED are refused. */
export const AUTHORIZATION_STATUSES = ['GRANTED', 'REVOKED', 'EXPIRED'] as const;
export type AuthorizationStatus = (typeof AUTHORIZATION_STATUSES)[number];

/** OD-3: the only permitted scope — sharing and use of the business's supplied statements for client acquisition. */
export const AUTHORIZATION_SCOPES = ['ACQUISITION'] as const;
export type AuthorizationScope = (typeof AUTHORIZATION_SCOPES)[number];

/** OD-2 / DEC-004 3.1-a: an authorization lasts 90 days from `authorizedAt`. */
export const AUTHORIZATION_DURATION_DAYS = 90;
const AUTHORIZATION_DURATION_MS = AUTHORIZATION_DURATION_DAYS * 24 * 60 * 60 * 1000;

/** The five evidence values a FIRST_PARTY signal must carry (OD-6), each -> its 0030 column. */
export interface AuthorizationEvidence {
  /** -> business_id. The integration's own identifier of the authorizing business (OD-4). */
  businessId: string;
  /** -> auth_status (OD-1). */
  status: AuthorizationStatus;
  /** -> auth_scope (OD-3). */
  scope: AuthorizationScope;
  /** -> auth_timestamp. When the business granted the authorization (OD-2). */
  authorizedAt: Date;
  /** -> integration_id. Canonical integration identifier (OD-5). */
  integrationId: string;
}

const PERSONAL_EMAIL_PATTERN = /[^\s@/]+@[^\s@/]+\.[^\s@/]+/;

/** A person's email or phone / messaging URI — never a business-level identifier. */
export function isPersonalContactIdentifier(value: string): boolean {
  return PERSONAL_EMAIL_PATTERN.test(value) || /^\s*(mailto|tel|sms):/i.test(value);
}

function evidenceText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new IntentSignalValidationError(field, 'required', `${field} is required`);
  }
  return value;
}

/**
 * Validates one authorization-evidence object (OD-1..OD-5, OD-6 "incomplete
 * = missing") and returns exactly the five values, verbatim. `notAfter` is
 * the latest acceptable `authorizedAt` (the result's capturedAt at the
 * provider boundary; `now` at intake). Messages name the field and rule
 * only, never the value (OD-11).
 */
export function validateAuthorizationEvidence(
  value: unknown,
  path: string,
  bounds: { notAfter: Date; now: Date },
): AuthorizationEvidence {
  if (typeof value !== 'object' || value === null) {
    throw new IntentSignalValidationError(path, 'required', `${path} (FIRST_PARTY authorization evidence) is required`);
  }
  const evidence = value as Record<string, unknown>;

  const businessId = evidenceText(evidence.businessId, `${path}.businessId`);
  if (isPersonalContactIdentifier(businessId)) {
    throw new IntentSignalValidationError(
      `${path}.businessId`,
      'not-allowed',
      `${path}.businessId is a personal contact identifier, not a business identifier`,
    );
  }

  const status = evidence.status;
  if (status === undefined || status === null) {
    throw new IntentSignalValidationError(`${path}.status`, 'required', `${path}.status is required`);
  }
  if (!(AUTHORIZATION_STATUSES as readonly unknown[]).includes(status)) {
    throw new IntentSignalValidationError(
      `${path}.status`,
      'invalid',
      `${path}.status must be one of: ${AUTHORIZATION_STATUSES.join(', ')}`,
    );
  }
  if (status !== 'GRANTED') {
    throw new IntentSignalValidationError(`${path}.status`, 'not-allowed', `${path}.status must be GRANTED to persist`);
  }

  const scope = evidence.scope;
  if (scope === undefined || scope === null || (typeof scope === 'string' && scope.trim().length === 0)) {
    throw new IntentSignalValidationError(`${path}.scope`, 'required', `${path}.scope is required`);
  }
  if (!(AUTHORIZATION_SCOPES as readonly unknown[]).includes(scope)) {
    throw new IntentSignalValidationError(
      `${path}.scope`,
      'not-allowed',
      `${path}.scope must be ${AUTHORIZATION_SCOPES.join(', ')}`,
    );
  }

  const authorizedAt = evidence.authorizedAt;
  if (authorizedAt === undefined || authorizedAt === null) {
    throw new IntentSignalValidationError(`${path}.authorizedAt`, 'required', `${path}.authorizedAt is required`);
  }
  if (!(authorizedAt instanceof Date) || Number.isNaN(authorizedAt.getTime())) {
    throw new IntentSignalValidationError(`${path}.authorizedAt`, 'invalid', `${path}.authorizedAt must be a valid Date`);
  }
  if (authorizedAt.getTime() > bounds.notAfter.getTime()) {
    throw new IntentSignalValidationError(
      `${path}.authorizedAt`,
      'invalid',
      `${path}.authorizedAt cannot be after the time the evidence was captured`,
    );
  }
  if (bounds.now.getTime() - authorizedAt.getTime() > AUTHORIZATION_DURATION_MS) {
    throw new IntentSignalValidationError(
      `${path}.authorizedAt`,
      'not-allowed',
      `${path} has expired (more than ${AUTHORIZATION_DURATION_DAYS} days after authorizedAt)`,
    );
  }

  const integrationId = evidenceText(evidence.integrationId, `${path}.integrationId`);

  return { businessId, status: 'GRANTED', scope: 'ACQUISITION', authorizedAt, integrationId };
}

/**
 * Untrusted shape a caller supplies to record one intent signal. Never
 * carries userId, confidence or classification. `observedAt` is the
 * source event's own time (post/submission) — required, never invented.
 */
export interface RecordIntentSignalInput {
  searchId: string;
  companyName: string;
  website: string;
  kind: IntentSignalKind;
  field: IntentSignalField;
  /** The verbatim stated intent. Stored as both the claim and its source quote. */
  quote: string;
  sourceUrl: string;
  /** Platform/source label, e.g. "Public forum post" or "AI-platform acquisition · ai referral". */
  sourceLabel: string;
  observedAt: Date;
  /** Required for FIRST_PARTY, rejected on PUBLIC_INTENT (OD-7). */
  authorizationEvidence?: AuthorizationEvidence;
}

export type IntentSignalValidationReason =
  | 'required'
  | 'too-long'
  | 'unsupported'
  | 'not-allowed'
  | 'invalid'
  /** OD-13 X1: a FIRST_PARTY event does not match its exact verified provider result. */
  | 'result-mismatch';

export class IntentSignalValidationError extends Error {
  readonly field: string;
  readonly reason: IntentSignalValidationReason;

  constructor(field: string, reason: IntentSignalValidationReason, message: string) {
    super(message);
    this.name = 'IntentSignalValidationError';
    this.field = field;
    this.reason = reason;
  }
}

export interface ValidatedIntentSignal {
  searchId: string;
  companyName: string;
  website: string;
  observedAt: Date;
  /** Ready for ResearchSignalRepository.saveSignals — OBSERVED, fixed confidence. */
  signal: NewResearchSignalInput;
}

function requiredString(value: unknown, field: string, maxLength: number): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new IntentSignalValidationError(field, 'required', `${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > maxLength) {
    throw new IntentSignalValidationError(
      field,
      'too-long',
      `${field} must be at most ${maxLength} characters`,
    );
  }
  return trimmed;
}

/**
 * Validates the untrusted intake shape and builds the OBSERVED signal row.
 * Does not check that `searchId` exists or is owned, and does not derive
 * company identity from `website` — both belong to the orchestrating
 * caller, which reuses the existing Search/Discovery repositories.
 */
export function toIntentSignalInput(
  input: RecordIntentSignalInput,
  now: Date = new Date(),
): ValidatedIntentSignal {
  const raw = input as unknown as Record<string, unknown>;
  for (const systemAssigned of ['confidence', 'classification'] as const) {
    if (systemAssigned in raw) {
      throw new IntentSignalValidationError(
        systemAssigned,
        'not-allowed',
        `${systemAssigned} is assigned by the system for intent signals and must not be supplied`,
      );
    }
  }

  if (typeof raw.kind !== 'string' || !isIntentSignalKind(raw.kind)) {
    throw new IntentSignalValidationError(
      'kind',
      'unsupported',
      `kind must be one of: ${INTENT_SIGNAL_KINDS.join(', ')}`,
    );
  }
  const kind = raw.kind;

  if (typeof raw.field !== 'string' || !(INTENT_SIGNAL_FIELDS as readonly string[]).includes(raw.field)) {
    throw new IntentSignalValidationError(
      'field',
      'unsupported',
      `field must be one of: ${INTENT_SIGNAL_FIELDS.join(', ')}`,
    );
  }
  const field = raw.field;

  const searchId = requiredString(raw.searchId, 'searchId', INTENT_SEARCH_ID_MAX_LENGTH);
  const companyName = requiredString(raw.companyName, 'companyName', INTENT_COMPANY_NAME_MAX_LENGTH);
  const website = requiredString(raw.website, 'website', INTENT_WEBSITE_MAX_LENGTH);
  const quote = requiredString(raw.quote, 'quote', INTENT_QUOTE_MAX_LENGTH);
  const sourceLabel = requiredString(raw.sourceLabel, 'sourceLabel', INTENT_SOURCE_LABEL_MAX_LENGTH);
  const sourceUrl = requiredString(raw.sourceUrl, 'sourceUrl', INTENT_SOURCE_URL_MAX_LENGTH);

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(sourceUrl);
  } catch {
    throw new IntentSignalValidationError('sourceUrl', 'invalid', 'sourceUrl must be an absolute URL');
  }
  if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
    throw new IntentSignalValidationError('sourceUrl', 'invalid', 'sourceUrl must be http(s)');
  }

  const observedAt = raw.observedAt;
  if (!(observedAt instanceof Date) || Number.isNaN(observedAt.getTime())) {
    throw new IntentSignalValidationError(
      'observedAt',
      'required',
      'observedAt (the source event time) is required',
    );
  }
  if (observedAt.getTime() > now.getTime()) {
    throw new IntentSignalValidationError('observedAt', 'invalid', 'observedAt cannot be in the future');
  }

  // OD-7: no FIRST_PARTY without complete, validated evidence, whatever path it
  // arrives by; no evidence on PUBLIC_INTENT (its columns stay NULL).
  let authorizationEvidence: AuthorizationEvidence | undefined;
  if (kind === 'FIRST_PARTY') {
    authorizationEvidence = validateAuthorizationEvidence(raw.authorizationEvidence, 'authorizationEvidence', {
      notAfter: now,
      now,
    });
  } else if (raw.authorizationEvidence !== undefined) {
    throw new IntentSignalValidationError(
      'authorizationEvidence',
      'not-allowed',
      'authorizationEvidence applies to FIRST_PARTY signals only',
    );
  }

  // K1 (REV-005 §7): quote and website are the values after the existing trim above; the persisted
  // signal / sourceQuote is this same trimmed quote. First hit rejects the whole intake event (PG-4).
  if (k1ContainsPersonal(quote, website)) {
    throw new IntentSignalValidationError(
      'quote',
      'not-allowed',
      'quote contains a personal contact identifier — evidence must be business-level',
    );
  }

  return {
    searchId,
    companyName,
    website,
    observedAt,
    signal: {
      field,
      kind,
      classification: 'OBSERVED',
      signal: quote,
      confidence: INTENT_SIGNAL_CONFIDENCE[kind],
      basis: null,
      sources: [{ sourceUrl, sourceQuote: quote, sourceLabel }],
      ...(authorizationEvidence === undefined ? {} : { authorizationEvidence }),
    },
  };
}

/**
 * One intent signal inside a multi-signal intake event. The per-signal
 * part of RecordIntentSignalInput; never carries confidence or
 * classification (D5).
 */
export type IntentSignalEntry = Omit<RecordIntentSignalInput, 'searchId' | 'companyName' | 'website'>;

/** Untrusted shape of one intake event: one company, one or more signals. */
export interface RecordIntentIntakeInput {
  searchId: string;
  companyName: string;
  website: string;
  signals: readonly IntentSignalEntry[];
  /**
   * OD-13 Option B proof, required by recordIntentIntakeForOwner when any
   * signal is FIRST_PARTY; set by normalizeVerifiedProviderResult.
   */
  providerAuthenticity?: VerifiedProviderResult;
}

export interface ValidatedIntentIntake {
  searchId: string;
  companyName: string;
  website: string;
  /** In input order, each with its own source event time. */
  signals: readonly { signal: NewResearchSignalInput; observedAt: Date }[];
}

/**
 * Validates a whole intake event before anything is written: every entry
 * goes through toIntentSignalInput, so the D5 fixed confidence and the
 * not-allowed override check apply per signal. Per-entry errors name the
 * entry, e.g. `signals[1].confidence`.
 */
export function toIntentIntakeInput(
  input: RecordIntentIntakeInput,
  now: Date = new Date(),
): ValidatedIntentIntake {
  const raw = input as unknown as Record<string, unknown>;
  for (const systemAssigned of ['confidence', 'classification'] as const) {
    if (systemAssigned in raw) {
      throw new IntentSignalValidationError(
        systemAssigned,
        'not-allowed',
        `${systemAssigned} is assigned by the system for intent signals and must not be supplied`,
      );
    }
  }
  if (!Array.isArray(raw.signals) || raw.signals.length === 0) {
    throw new IntentSignalValidationError('signals', 'required', 'signals must contain at least one signal');
  }

  const validated = (raw.signals as unknown[]).map((entry, index) => {
    if (typeof entry !== 'object' || entry === null) {
      throw new IntentSignalValidationError(`signals[${index}]`, 'invalid', `signals[${index}] must be an object`);
    }
    try {
      return toIntentSignalInput(
        {
          ...(entry as IntentSignalEntry),
          searchId: raw.searchId,
          companyName: raw.companyName,
          website: raw.website,
        } as RecordIntentSignalInput,
        now,
      );
    } catch (error) {
      if (
        error instanceof IntentSignalValidationError &&
        !['searchId', 'companyName', 'website'].includes(error.field)
      ) {
        throw new IntentSignalValidationError(`signals[${index}].${error.field}`, error.reason, error.message);
      }
      throw error;
    }
  });

  const first = validated[0]!;
  return {
    searchId: first.searchId,
    companyName: first.companyName,
    website: first.website,
    signals: validated.map(({ signal, observedAt }) => ({ signal, observedAt })),
  };
}
