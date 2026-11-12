import { containsAnyContactIdentifier, containsPersonalContactIdentifier as k1ContainsPersonal } from './contactIdentifiers';
import {
  INTENT_SIGNAL_FIELDS,
  IntentSignalValidationError,
  isPersonalContactIdentifier,
  toIntentIntakeInput,
  validateAuthorizationEvidence,
  type AuthorizationEvidence,
  type AuthorizationScope,
  type AuthorizationStatus,
  type IntentSignalField,
  type IntentSignalValidationReason,
  type ValidatedIntentIntake,
} from './intentSignal';
import {
  INTENT_SOURCE_TYPES,
  normalizeIntentEvent,
  PROHIBITED_PERSONAL_DATA_KEYS,
  type AcquisitionSourceAdapter,
  type IntentDisclosure,
  type IntentSourceFamily,
  type NormalizedIntentEvent,
} from './intentSource';
import {
  aiPlatformAcquisitionAdapter,
  publicIntentNoticeAdapter,
  publicWebSearchAdapter,
  type AiPlatformAcquisitionRecord,
  type PublicIntentNoticeRecord,
  type PublicWebSearchRecord,
  type RawSourceContext,
} from './intentSourceAdapters';
import {
  openVerifiedProviderResult,
  requireProviderAuthenticityForIntake,
  type VerifiedProviderResult,
} from './providerAuthenticity';

// Provider-neutral PROVIDER-RESULT contracts (INTENT-SOURCE-PROVIDER-CONTRACT-REC-001).
// -----------------------------------------------------------------------
//   provider result (what an integration returns — this file's contracts)
//     -> normalizeProviderResult     provider-level privacy screen,
//                                    structure, verbatim-evidence check,
//                                    attribution; maps to the adapter's
//                                    raw record
//     -> AcquisitionSourceAdapter / normalizeIntentEvent   (unchanged)
//     -> NormalizedIntentEvent.intake -> recordIntentIntakeForOwner
//
// A provider result is NOT an acquisition signal. A search result only
// becomes one when it carries a business-level intent statement that
// appears verbatim in the result itself; a result without one is
// NO_INTENT_EVIDENCE, and a result without business identity is
// UNATTRIBUTED — identity is never inferred from the URL.
//
// No provider is called here. No SDK, credential, HTTP client or browser
// is imported; results are supplied by the caller (fixtures today).
//
// Deduplication: only identical results inside ONE batch are skipped
// (DUPLICATE_IN_BATCH). Persistence does not deduplicate events — that is
// a KNOWN OPEN DESIGN QUESTION; a deterministic eventId does not prevent
// duplicate persistence.
// -----------------------------------------------------------------------

/**
 * Label surfaced in ProviderContractNotes for events carrying FIRST_PARTY
 * signals. FIRST_PARTY authorization evidence itself IS enforced here
 * (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001 OD-1..OD-6). Canonical value per
 * DP-1: the label is descriptive only — it names the authorization-evidence
 * requirements already defined by OD-1..OD-13 and adds no enforcement rule.
 */
export const FIRST_PARTY_CONSENT_POLICY = 'AUTHORIZATION_EVIDENCE_REQUIRED' as const;

/** Provider-neutral provenance of the integration that produced a result. Never a credential. */
export interface ProviderResultProvenance {
  /** Opaque integration label, e.g. "fixture". */
  integration: string;
  retrieval: 'FIXTURE' | 'PUBLIC_WEB_SEARCH' | 'PUBLIC_NOTICE_FEED' | 'AUTHORIZED_INTEGRATION';
}

/** Business-level identity only, where the source legitimately states it. */
export interface ProviderBusinessIdentity {
  name: string;
  website: string;
}

export interface ProviderPublication {
  publisher: string | null;
  publishedAt: Date | null;
}

/** A business-level intent statement; `evidence` must appear verbatim in the result's own text. */
export interface ProviderIntentEvidence {
  requirement: IntentSignalField;
  evidence: string;
}

// ---- Google Search / public web --------------------------------------------

export interface PublicWebSearchProviderResult {
  sourceFamily: 'PUBLIC_WEB_SEARCH';
  resultType: PublicWebSearchRecord['resultType'];
  /** Stable provider-assigned identifier of the result. */
  externalId: string;
  title: string;
  url: string;
  snippet: string;
  /** When the evidence was published / observed at the source. */
  observedAt: Date;
  /** When the integration captured the result. */
  capturedAt: Date;
  business: ProviderBusinessIdentity | null;
  publication: ProviderPublication | null;
  provenance: ProviderResultProvenance;
  /** null when the result states no business intent (e.g. an ordinary listing). */
  intentEvidence: ProviderIntentEvidence | null;
  context?: RawSourceContext;
}

// ---- AI-platform acquisition (authorized integration only) -----------------

/**
 * What the integration states about the business's authorization
 * (OD-1..OD-5, OD-10). Required, with all five evidence values, when any
 * evidence item is SUPPLIED_TO_US; otherwise only integrationId / basis
 * are checked, as before. Authenticated only when the result arrives
 * through normalizeVerifiedProviderResult (OD-13 Option B). No version
 * field (OD-9).
 */
export interface AiPlatformAuthorization {
  /** Canonical integration identifier; must equal provenance.integration when SUPPLIED_TO_US is present (OD-5). */
  integrationId: string;
  /** The integration's own opaque identifier of the authorizing business / legal entity (OD-4). */
  businessId: string;
  /** Only GRANTED persists (OD-1). */
  status: AuthorizationStatus;
  /** Only ACQUISITION is permitted (OD-3). */
  scope: AuthorizationScope;
  /** When the business granted this authorization; ≤ capturedAt and ≤ 90 days before receipt (OD-2). */
  authorizedAt: Date;
  /** Required and validated; not persisted (OD-10). */
  basis: string;
  /** Optional; not persisted (OD-10). */
  reference: string | null;
}

export interface AiPlatformEvidenceItem {
  /** PUBLISHED -> PUBLIC_INTENT; SUPPLIED_TO_US -> FIRST_PARTY (existing semantics). */
  origin: IntentDisclosure;
  /** The only accepted derivation: the business's own statement. Inference about platform users is rejected. */
  derivation: 'STATED_BY_BUSINESS';
  requirement: IntentSignalField;
  statement: string;
  referenceUrl?: string;
  observedAt: Date;
}

export interface AiPlatformProviderSignal {
  sourceFamily: 'AI_PLATFORM_ACQUISITION';
  acquisitionType: AiPlatformAcquisitionRecord['placement'];
  externalId: string;
  business: ProviderBusinessIdentity | null;
  /** Authorized landing page / source reference where the statement was received. */
  sourceReference: string;
  evidence: readonly AiPlatformEvidenceItem[];
  capturedAt: Date;
  provenance: ProviderResultProvenance;
  authorization: AiPlatformAuthorization | null;
  context?: RawSourceContext;
}

// ---- Public intent (RFPs, requests, announcements, hiring, migrations) -----

export interface PublicIntentProviderNotice {
  sourceFamily: 'PUBLIC_INTENT_NOTICE';
  noticeType: PublicIntentNoticeRecord['noticeType'];
  externalId: string;
  title: string;
  url: string;
  body: string;
  observedAt: Date;
  capturedAt: Date;
  business: ProviderBusinessIdentity | null;
  publication: ProviderPublication | null;
  provenance: ProviderResultProvenance;
  intentEvidence: readonly ProviderIntentEvidence[];
  context?: RawSourceContext;
}

export type IntentProviderResult =
  | PublicWebSearchProviderResult
  | AiPlatformProviderSignal
  | PublicIntentProviderNotice;

export interface ProviderContractNotes {
  providerProvenance: ProviderResultProvenance;
  publication: ProviderPublication | null;
  /** AI-platform only: whether the integration supplied authorization metadata. */
  authorization: 'NOT_APPLICABLE' | 'PRESENT' | 'MISSING';
  /** Set when the event carries FIRST_PARTY signals. */
  firstPartyConsentPolicy: 'NOT_APPLICABLE' | typeof FIRST_PARTY_CONSENT_POLICY;
}

export type ProviderResultOutcome =
  | { status: 'NORMALIZED'; externalId: string; event: NormalizedIntentEvent; notes: ProviderContractNotes }
  | { status: 'NO_INTENT_EVIDENCE'; externalId: string; reason: string }
  | { status: 'UNATTRIBUTED'; externalId: string; reason: string }
  | { status: 'DUPLICATE_IN_BATCH'; externalId: string; eventId: string }
  | {
      status: 'REJECTED';
      externalId: string | null;
      field: string;
      reason: IntentSignalValidationReason;
      message: string;
    };

// ---- Provider-level privacy screen -----------------------------------------

/**
 * Superset of PROHIBITED_PERSONAL_DATA_KEYS applied to provider results.
 * Compared lower-case without `_` / `-`. Rejected, never stripped.
 */
export const PROVIDER_PROHIBITED_KEYS: readonly string[] = [
  ...PROHIBITED_PERSONAL_DATA_KEYS,
  'emailaddress',
  'personalemail',
  'mobile',
  'mobilenumber',
  'telephone',
  'aiconversation',
  'conversationcontent',
  'conversationhistory',
  'chathistory',
  'chatlog',
  'chatmessages',
  'userprompt',
  'prompttext',
  'searchterm',
  'searchterms',
  'browsinghistory',
  'cookieid',
  'deviceidentifier',
  'adid',
  'mobileadid',
  'accountidentifier',
  'useraccountid',
  'platformuserid',
  'platformuser',
  'visitorid',
  'anonymousid',
  'clickid',
  'dclid',
  'gbraid',
  'wbraid',
  'ttclid',
  'userprofile',
  'personaldata',
  'privateuserdata',
  'personname',
  'fullname',
  'firstname',
  'lastname',
  'dateofbirth',
  'homeaddress',
  'aiusage',
  'inferredaiusage',
  'privateaiusage',
  'inferreduserintent',
];

/** Assigned by normalizeIntentEvent only; a provider supplying one is rejected, not silently dropped. */
const SYSTEM_ASSIGNED_KEYS: readonly string[] = ['kind', 'confidence', 'classification'];
/** Free-text fields may quote a business contact; every other string is screened as an identifier. */
const FREE_TEXT_KEYS: readonly string[] = ['title', 'snippet', 'body', 'statement', 'evidence', 'basis'];

function reject(field: string, reason: IntentSignalValidationReason, message: string): never {
  throw new IntentSignalValidationError(field, reason, message);
}

function screenProviderKeys(value: unknown, path: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => screenProviderKeys(item, `${path}[${index}]`));
    return;
  }
  if (typeof value !== 'object' || value === null || value instanceof Date) return;
  for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (PROVIDER_PROHIBITED_KEYS.includes(key.toLowerCase().replace(/[_-]/g, ''))) {
      reject(childPath, 'not-allowed', `${childPath} is individual-level data — provider results carry business-level evidence only`);
    }
    if (SYSTEM_ASSIGNED_KEYS.includes(key)) {
      reject(childPath, 'not-allowed', `${childPath} is assigned centrally, not by a provider`);
    }
    if (!FREE_TEXT_KEYS.includes(key)) checkIdentifier(child, childPath);
    screenProviderKeys(child, childPath);
  }
}

/** Identifiers must never be a person's email or phone. */
function checkIdentifier(value: unknown, field: string): void {
  if (typeof value !== 'string') return;
  if (isPersonalContactIdentifier(value)) {
    reject(field, 'not-allowed', `${field} is a personal contact identifier, not a business-level identifier`);
  }
}

function checkHttpUrl(value: unknown, field: string): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
    reject(field, 'required', `${field} (source provenance) is required`);
  }
  checkIdentifier(value, field);
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    reject(field, 'invalid', `${field} must be an absolute URL`);
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    reject(field, 'invalid', `${field} must be an http(s) URL`);
  }
}

function requireText(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) reject(field, 'required', `${field} is required`);
  return value;
}

function requireDate(value: unknown, field: string): Date {
  if (!(value instanceof Date) || Number.isNaN(value.getTime())) reject(field, 'invalid', `${field} must be a valid Date`);
  return value;
}

function requireRequirement(value: unknown, field: string): void {
  if (!(INTENT_SIGNAL_FIELDS as readonly unknown[]).includes(value)) {
    reject(field, 'unsupported', `${field} is not a supported intent field`);
  }
}

function checkProvenance(value: unknown): void {
  const provenance = value as Partial<ProviderResultProvenance> | null | undefined;
  if (typeof provenance !== 'object' || provenance === null) reject('provenance', 'required', 'provenance is required');
  requireText(provenance.integration, 'provenance.integration');
  requireText(provenance.retrieval, 'provenance.retrieval');
}

function collapse(text: string): string {
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Evidence must be contained in the result's own text — never generated or paraphrased. */
function checkVerbatim(evidence: unknown, sourceText: string, field: string): void {
  const text = requireText(evidence, field);
  if (!collapse(sourceText).includes(collapse(text))) {
    reject(field, 'invalid', `${field} must appear verbatim in the source result`);
  }
}

function checkCommon(result: {
  externalId?: unknown;
  capturedAt?: unknown;
  provenance?: unknown;
}): void {
  checkIdentifier(requireText(result.externalId, 'externalId'), 'externalId');
  requireDate(result.capturedAt, 'capturedAt');
  checkProvenance(result.provenance);
}

// ---- K1 (CLIENT_INTENT_DISCOVERY_CODE_GAP_K1_ENGINEERING_SPECIFICATION_REVISION_005.md §6) ---------------
// Called once in each of preparePublicWeb / prepareAiPlatform / preparePublicIntent, immediately after the
// UNATTRIBUTED skip and before `raw` is built. Screens evidence statements (array order) with
// containsPersonalContactIdentifier, then context.targetCustomer / geography / service with
// containsAnyContactIdentifier (PG-2 net effect). First hit rejects the whole IntentProviderResult.

function runK1(
  website: string,
  evidence: readonly { path: string; text: string }[],
  context: RawSourceContext | undefined,
): void {
  for (const { path, text } of evidence) {
    if (k1ContainsPersonal(text, website)) {
      reject(path, 'not-allowed', `${path} contains a personal contact identifier — evidence must be business-level`);
    }
  }
  if (context !== undefined) {
    for (const name of ['targetCustomer', 'geography', 'service'] as const) {
      const value = context[name];
      if (typeof value === 'string' && containsAnyContactIdentifier(value, website)) {
        const path = `context.${name}`;
        reject(
          path,
          'not-allowed',
          `${path} contains a contact identifier — context values must not contain email addresses or phone numbers`,
        );
      }
    }
  }
}

function hasIdentity(business: ProviderBusinessIdentity | null | undefined): business is ProviderBusinessIdentity {
  return (
    typeof business?.name === 'string' &&
    business.name.trim().length > 0 &&
    typeof business.website === 'string' &&
    business.website.trim().length > 0
  );
}

// ---- Normalization -----------------------------------------------------------

type Prepared =
  | { kind: 'skip'; outcome: ProviderResultOutcome }
  | {
      kind: 'map';
      adapter: AcquisitionSourceAdapter<never>;
      raw: unknown;
      capturedAt: Date;
      notes: Omit<ProviderContractNotes, 'firstPartyConsentPolicy'>;
    };

function preparePublicWeb(result: PublicWebSearchProviderResult): Prepared {
  checkCommon(result);
  if (!(INTENT_SOURCE_TYPES.PUBLIC_WEB_SEARCH as readonly string[]).includes(result.resultType)) {
    reject('resultType', 'unsupported', 'resultType is not a PUBLIC_WEB_SEARCH type');
  }
  checkHttpUrl(result.url, 'url');
  const sourceText = `${requireText(result.title, 'title')}\n${requireText(result.snippet, 'snippet')}`;
  const observedAt = requireDate(result.observedAt, 'observedAt');
  if (result.intentEvidence === null || result.intentEvidence === undefined) {
    return {
      kind: 'skip',
      outcome: {
        status: 'NO_INTENT_EVIDENCE',
        externalId: result.externalId,
        reason: 'the result states no business-level intent; a search result alone is not an acquisition signal',
      },
    };
  }
  requireRequirement(result.intentEvidence.requirement, 'intentEvidence.requirement');
  checkVerbatim(result.intentEvidence.evidence, sourceText, 'intentEvidence.evidence');
  if (!hasIdentity(result.business)) {
    return {
      kind: 'skip',
      outcome: {
        status: 'UNATTRIBUTED',
        externalId: result.externalId,
        reason: 'the result names no business identity; identity is never inferred',
      },
    };
  }
  runK1(
    result.business.website,
    [{ path: 'intentEvidence.evidence', text: result.intentEvidence.evidence }],
    result.context,
  );
  const raw: PublicWebSearchRecord = {
    resultType: result.resultType,
    resultId: result.externalId,
    pageUrl: result.url,
    organization: { name: result.business.name, website: result.business.website },
    excerpt: result.intentEvidence.evidence,
    requirement: result.intentEvidence.requirement,
    publishedAt: observedAt,
    ...(result.context === undefined ? {} : { context: result.context }),
  };
  return {
    kind: 'map',
    adapter: publicWebSearchAdapter as AcquisitionSourceAdapter<never>,
    raw,
    capturedAt: result.capturedAt,
    notes: { providerProvenance: result.provenance, publication: result.publication ?? null, authorization: 'NOT_APPLICABLE' },
  };
}

/**
 * OD-5 / OD-6: a result carrying SUPPLIED_TO_US needs the authorization
 * object with all five values, the existing basis, and an integrationId
 * equal to provenance.integration. Any defect rejects the whole result.
 */
function requireAuthorizationEvidence(result: AiPlatformProviderSignal, now: Date): AuthorizationEvidence {
  const authorization = result.authorization;
  if (authorization === null || authorization === undefined) {
    reject('authorization', 'required', 'authorization is required when the result carries SUPPLIED_TO_US evidence');
  }
  requireText(authorization.integrationId, 'authorization.integrationId');
  requireText(authorization.basis, 'authorization.basis');
  if (authorization.integrationId !== result.provenance.integration) {
    reject('authorization.integrationId', 'invalid', 'authorization.integrationId must equal provenance.integration');
  }
  return validateAuthorizationEvidence(authorization, 'authorization', { notAfter: result.capturedAt, now });
}

function prepareAiPlatform(result: AiPlatformProviderSignal, now: Date, authenticated: string | null): Prepared {
  // OD-13: SUPPLIED_TO_US is refused unless the result came through Option B verification.
  const evidence = result.evidence as unknown;
  if (authenticated === null && Array.isArray(evidence) && evidence.some((item) => (item as { origin?: unknown } | null)?.origin === 'SUPPLIED_TO_US')) {
    reject('authenticity', 'required', 'a result carrying SUPPLIED_TO_US evidence must arrive as a verified signed envelope (OD-13)');
  }
  checkCommon(result);
  if (!(INTENT_SOURCE_TYPES.AI_PLATFORM_ACQUISITION as readonly string[]).includes(result.acquisitionType)) {
    reject('acquisitionType', 'unsupported', 'acquisitionType is not an AI_PLATFORM_ACQUISITION type');
  }
  checkHttpUrl(result.sourceReference, 'sourceReference');
  if (!Array.isArray(result.evidence as unknown) || result.evidence.length === 0) {
    reject('evidence', 'required', 'evidence must contain at least one business statement');
  }
  result.evidence.forEach((item, index) => {
    const path = `evidence[${index}]`;
    if (item.derivation !== 'STATED_BY_BUSINESS') {
      reject(`${path}.derivation`, 'not-allowed', `${path} is not the business's own statement — inference about platform users is out of scope`);
    }
    requireRequirement(item.requirement, `${path}.requirement`);
    requireText(item.statement, `${path}.statement`);
    requireDate(item.observedAt, `${path}.observedAt`);
    if (item.referenceUrl !== undefined) checkHttpUrl(item.referenceUrl, `${path}.referenceUrl`);
  });
  const authorization = result.authorization;
  let authorizationEvidence: AuthorizationEvidence | undefined;
  if (result.evidence.some((item) => item.origin === 'SUPPLIED_TO_US')) {
    authorizationEvidence = requireAuthorizationEvidence(result, now);
  } else if (authorization !== null && authorization !== undefined) {
    // No SUPPLIED_TO_US item: unchanged (OD-6 item 4).
    requireText(authorization.integrationId, 'authorization.integrationId');
    requireText(authorization.basis, 'authorization.basis');
  }
  if (!hasIdentity(result.business)) {
    return {
      kind: 'skip',
      outcome: { status: 'UNATTRIBUTED', externalId: result.externalId, reason: 'the integration supplied no business identity' },
    };
  }
  runK1(
    result.business.website,
    result.evidence.map((item, index) => ({ path: `evidence[${index}].statement`, text: item.statement })),
    result.context,
  );
  const raw: AiPlatformAcquisitionRecord = {
    placement: result.acquisitionType,
    integrationEventId: result.externalId,
    business: { name: result.business.name, website: result.business.website },
    landingUrl: result.sourceReference,
    interests: result.evidence.map((item) => ({
      disclosure: item.origin,
      requirement: item.requirement,
      statement: item.statement,
      ...(item.referenceUrl === undefined ? {} : { referenceUrl: item.referenceUrl }),
      occurredAt: item.observedAt,
    })),
    ...(result.context === undefined ? {} : { context: result.context }),
    ...(authorizationEvidence === undefined ? {} : { authorizationEvidence }),
  };
  return {
    kind: 'map',
    adapter: aiPlatformAcquisitionAdapter as AcquisitionSourceAdapter<never>,
    raw,
    capturedAt: result.capturedAt,
    notes: {
      providerProvenance: result.provenance,
      publication: null,
      authorization: authorization === null || authorization === undefined ? 'MISSING' : 'PRESENT',
    },
  };
}

function preparePublicIntent(result: PublicIntentProviderNotice): Prepared {
  checkCommon(result);
  if (!(INTENT_SOURCE_TYPES.PUBLIC_INTENT_NOTICE as readonly string[]).includes(result.noticeType)) {
    reject('noticeType', 'unsupported', 'noticeType is not a PUBLIC_INTENT_NOTICE type');
  }
  checkHttpUrl(result.url, 'url');
  const sourceText = `${requireText(result.title, 'title')}\n${requireText(result.body, 'body')}`;
  const observedAt = requireDate(result.observedAt, 'observedAt');
  if (!Array.isArray(result.intentEvidence as unknown)) {
    reject('intentEvidence', 'invalid', 'intentEvidence must be a list');
  }
  if (result.intentEvidence.length === 0) {
    return {
      kind: 'skip',
      outcome: { status: 'NO_INTENT_EVIDENCE', externalId: result.externalId, reason: 'the notice states no business-level intent' },
    };
  }
  result.intentEvidence.forEach((item, index) => {
    requireRequirement(item.requirement, `intentEvidence[${index}].requirement`);
    checkVerbatim(item.evidence, sourceText, `intentEvidence[${index}].evidence`);
  });
  if (!hasIdentity(result.business)) {
    return {
      kind: 'skip',
      outcome: { status: 'UNATTRIBUTED', externalId: result.externalId, reason: 'the notice names no business identity' },
    };
  }
  runK1(
    result.business.website,
    result.intentEvidence.map((item, index) => ({ path: `intentEvidence[${index}].evidence`, text: item.evidence })),
    result.context,
  );
  const raw: PublicIntentNoticeRecord = {
    noticeType: result.noticeType,
    noticeId: result.externalId,
    noticeUrl: result.url,
    organization: { name: result.business.name, website: result.business.website },
    requirements: result.intentEvidence.map((item) => ({ requirement: item.requirement, text: item.evidence })),
    postedAt: observedAt,
    ...(result.context === undefined ? {} : { context: result.context }),
  };
  return {
    kind: 'map',
    adapter: publicIntentNoticeAdapter as AcquisitionSourceAdapter<never>,
    raw,
    capturedAt: result.capturedAt,
    notes: { providerProvenance: result.provenance, publication: result.publication ?? null, authorization: 'NOT_APPLICABLE' },
  };
}

/** OD-5 / V3: the verified identity must equal provenance.integration and any authorization.integrationId. */
function bindVerifiedIdentity(result: IntentProviderResult, authenticated: string): void {
  checkProvenance(result.provenance);
  if (result.provenance.integration !== authenticated) {
    reject('provenance.integration', 'invalid', 'provenance.integration must equal the verified integration identity');
  }
  const authorization = (result as { authorization?: { integrationId?: unknown } | null }).authorization;
  // A missing / blank integrationId is left to the existing 'required' checks.
  const claimed = authorization?.integrationId;
  if (typeof claimed === 'string' && claimed.trim().length > 0 && claimed !== authenticated) {
    reject('authorization.integrationId', 'invalid', 'authorization.integrationId must equal the verified integration identity');
  }
}

function prepare(result: IntentProviderResult, now: Date, authenticated: string | null): Prepared {
  if (typeof result !== 'object' || result === null) reject('result', 'invalid', 'a provider result must be an object');
  screenProviderKeys(result, '');
  if (authenticated !== null) bindVerifiedIdentity(result, authenticated);
  const family = (result as { sourceFamily?: unknown }).sourceFamily as IntentSourceFamily;
  switch (family) {
    case 'PUBLIC_WEB_SEARCH':
      return preparePublicWeb(result as PublicWebSearchProviderResult);
    case 'AI_PLATFORM_ACQUISITION':
      return prepareAiPlatform(result as AiPlatformProviderSignal, now, authenticated);
    case 'PUBLIC_INTENT_NOTICE':
      return preparePublicIntent(result as PublicIntentProviderNotice);
    default:
      return reject('sourceFamily', 'unsupported', 'sourceFamily is not a supported acquisition-source family');
  }
}

function externalIdOf(result: unknown): string | null {
  const id = (result as { externalId?: unknown } | null)?.externalId;
  return typeof id === 'string' && id.trim().length > 0 ? id : null;
}

/**
 * Maps ONE provider result through the existing adapter and
 * normalizeIntentEvent. Pure: no I/O, no persistence. Validation failures
 * are returned as REJECTED so one bad result never aborts a batch.
 */
export function normalizeProviderResult(
  result: IntentProviderResult,
  options: { searchId: string; now?: Date },
): ProviderResultOutcome {
  return normalizeWith(result, options, null);
}

/**
 * P2 for a pushed, Option B-verified result (OD-13): parses the result
 * from the verified bytes, binds the verified identity (OD-5), then runs
 * the same normalization. A NORMALIZED event's intake carries the proof,
 * which recordIntentIntakeForOwner re-verifies before saving (P3). A
 * value not issued by verifyProviderEnvelope is REJECTED.
 */
export function normalizeVerifiedProviderResult(
  verified: VerifiedProviderResult,
  options: { searchId: string; now?: Date },
): ProviderResultOutcome {
  const opened = openVerifiedProviderResult(verified);
  if (opened === null) {
    return {
      status: 'REJECTED',
      externalId: null,
      field: 'authenticity',
      reason: 'required',
      message: 'not a verified provider result',
    };
  }
  const outcome = normalizeWith(opened.result as IntentProviderResult, options, opened.integrationId);
  if (outcome.status !== 'NORMALIZED') return outcome;
  return { ...outcome, event: { ...outcome.event, intake: { ...outcome.event.intake, providerAuthenticity: verified } } };
}

// ---- P3 exact-result binding (OD-13 X1) ----------------------------------------
// INTENT-INTAKE-OD13-EXACT-BINDING-DEC-001. Lives here, not in
// providerAuthenticity, because the re-derivation IS this module's
// normalization and providerAuthenticity must not import it at run time.

type ValidatedIntakeSignal = ValidatedIntentIntake['signals'][number];

function sameFirstPartyEntry(presented: ValidatedIntakeSignal, derived: ValidatedIntakeSignal): boolean {
  const a = presented.signal;
  const b = derived.signal;
  const aSource = a.sources[0];
  const bSource = b.sources[0];
  const aEvidence = a.authorizationEvidence;
  const bEvidence = b.authorizationEvidence;
  return (
    a.field === b.field &&
    a.signal === b.signal &&
    aSource !== undefined &&
    bSource !== undefined &&
    aSource.sourceUrl === bSource.sourceUrl &&
    aSource.sourceLabel === bSource.sourceLabel &&
    presented.observedAt.getTime() === derived.observedAt.getTime() &&
    aEvidence !== undefined &&
    bEvidence !== undefined &&
    aEvidence.businessId === bEvidence.businessId &&
    aEvidence.status === bEvidence.status &&
    aEvidence.scope === bEvidence.scope &&
    aEvidence.authorizedAt.getTime() === bEvidence.authorizedAt.getTime() &&
    aEvidence.integrationId === bEvidence.integrationId
  );
}

/** Fixed text only: never echoes a presented or verified value (OD-11 item 3). */
function resultMismatch(field: string, message: string): never {
  throw new IntentSignalValidationError(field, 'result-mismatch', message);
}

/**
 * P3 (save boundary). Runs requireProviderAuthenticityForIntake unchanged,
 * then — when any signal is FIRST_PARTY — re-derives the intake from the
 * verifier's private copy of the exact bytes, at the proof's receivedAt
 * (Q-X4), and requires (Q-X1..Q-X3):
 *   - companyName and website equal the derived ones;
 *   - the FIRST_PARTY entries, in order and with the same count, equal the
 *     derived FIRST_PARTY entries in field, quote, sourceUrl, sourceLabel,
 *     observedAt and all five authorizationEvidence values.
 * PUBLIC_INTENT entries and searchId are not compared. Nothing is recorded
 * and the proof is not consumed (Q-X5, Q-X7). Throws
 * IntentSignalValidationError; the whole event is refused before any write.
 */
export function requireExactProviderResultForIntake(
  validated: ValidatedIntentIntake,
  proof: unknown,
  now: Date,
): void {
  const presented = validated.signals;
  requireProviderAuthenticityForIntake(
    presented.map(({ signal }) => signal),
    proof,
    now,
  );
  const firstPartyIndexes = presented.flatMap((entry, index) => (entry.signal.kind === 'FIRST_PARTY' ? [index] : []));
  if (firstPartyIndexes.length === 0) return;

  // Non-null: requireProviderAuthenticityForIntake accepted the proof.
  const opened = openVerifiedProviderResult(proof)!;
  const outcome = normalizeWith(
    opened.result as IntentProviderResult,
    { searchId: validated.searchId, now: opened.receivedAt },
    opened.integrationId,
  );
  let derived: ValidatedIntentIntake | null = null;
  if (outcome.status === 'NORMALIZED') {
    try {
      derived = toIntentIntakeInput(outcome.event.intake, opened.receivedAt);
    } catch (error) {
      if (!(error instanceof IntentSignalValidationError)) throw error;
    }
  }
  if (derived === null) {
    resultMismatch(`signals[${firstPartyIndexes[0]}]`, 'the verified provider result carries no FIRST_PARTY signal');
  }
  if (validated.companyName !== derived.companyName) {
    resultMismatch('companyName', 'companyName does not match the verified provider result');
  }
  if (validated.website !== derived.website) {
    resultMismatch('website', 'website does not match the verified provider result');
  }
  const expected = derived.signals.filter(({ signal }) => signal.kind === 'FIRST_PARTY');
  firstPartyIndexes.forEach((index, position) => {
    const counterpart = expected[position];
    if (counterpart === undefined || !sameFirstPartyEntry(presented[index]!, counterpart)) {
      resultMismatch(
        `signals[${index}]`,
        'the FIRST_PARTY signal does not match the verified provider result at the same position',
      );
    }
  });
  if (firstPartyIndexes.length < expected.length) {
    resultMismatch('signals', 'the event omits FIRST_PARTY signals carried by the verified provider result');
  }
}

function normalizeWith(
  result: IntentProviderResult,
  options: { searchId: string; now?: Date },
  authenticated: string | null,
): ProviderResultOutcome {
  // One receipt time for this result: the OD-2 expiry check and normalizeIntentEvent use the same instant.
  const now = options.now ?? new Date();
  try {
    const prepared = prepare(result, now, authenticated);
    if (prepared.kind === 'skip') return prepared.outcome;
    const event = normalizeIntentEvent(prepared.adapter, prepared.raw as never, {
      searchId: options.searchId,
      capturedAt: prepared.capturedAt,
      now,
    });
    return {
      status: 'NORMALIZED',
      externalId: event.externalId ?? (result as { externalId: string }).externalId,
      event,
      notes: {
        ...prepared.notes,
        firstPartyConsentPolicy: event.signals.some((s) => s.kind === 'FIRST_PARTY')
          ? FIRST_PARTY_CONSENT_POLICY
          : 'NOT_APPLICABLE',
      },
    };
  } catch (error) {
    if (error instanceof IntentSignalValidationError) {
      return {
        status: 'REJECTED',
        externalId: externalIdOf(result),
        field: error.field,
        reason: error.reason,
        message: error.message,
      };
    }
    throw error;
  }
}

/**
 * Normalizes one provider response. Identical results inside this batch
 * (same eventId) are returned as DUPLICATE_IN_BATCH and must not be sent
 * to intake again. Nothing here deduplicates across batches or at
 * persistence (KNOWN OPEN DESIGN QUESTION).
 */
export function normalizeProviderBatch(
  results: readonly IntentProviderResult[],
  options: { searchId: string; now?: Date },
): ProviderResultOutcome[] {
  const seen = new Set<string>();
  return results.map((result) => {
    const outcome = normalizeProviderResult(result, options);
    if (outcome.status !== 'NORMALIZED') return outcome;
    if (seen.has(outcome.event.eventId)) {
      return { status: 'DUPLICATE_IN_BATCH', externalId: outcome.externalId, eventId: outcome.event.eventId };
    }
    seen.add(outcome.event.eventId);
    return outcome;
  });
}

// ---- Operational (cost / retry) contract -----------------------------------
// Requirements every future live integration must meet. Nothing here calls
// a provider or implements a retry; it defines and guards the limits.

export const PROVIDER_OPERATIONAL_CONTRACT = {
  /** At most one provider call per acquisition event. */
  maxProviderCallsPerAcquisitionEvent: 1,
  /** Automatic retries are prohibited. */
  automaticRetries: 0,
  /** A retry is a new, operator-initiated, separately authorized call with its own budget. Not implemented. */
  manualRetry: 'OPERATOR_INITIATED_ONLY',
  /** Every call must carry a finite timeout set at authorization time; a timeout ends the call as FAILED. */
  timeoutRequired: true,
} as const;

export const PROVIDER_FAILURE_KINDS = [
  'TIMEOUT',
  'RATE_LIMITED',
  'AUTHENTICATION_FAILED',
  'MALFORMED_RESPONSE',
  'EMPTY_RESULT',
  'PROVIDER_UNAVAILABLE',
  'DUPLICATE_RESULT',
] as const;
export type ProviderFailureKind = (typeof PROVIDER_FAILURE_KINDS)[number];

export interface ProviderFailureHandling {
  outcome: 'FAILED' | 'REJECTED' | 'COMPLETED_EMPTY' | 'SKIPPED_DUPLICATE';
  automaticRetry: false;
  /** Stop every further call in this run; resuming needs an operator. */
  haltIntegration: boolean;
  producesIntakeEvents: false;
}

export const PROVIDER_FAILURE_HANDLING: Readonly<Record<ProviderFailureKind, ProviderFailureHandling>> = {
  TIMEOUT: { outcome: 'FAILED', automaticRetry: false, haltIntegration: false, producesIntakeEvents: false },
  RATE_LIMITED: { outcome: 'FAILED', automaticRetry: false, haltIntegration: true, producesIntakeEvents: false },
  AUTHENTICATION_FAILED: { outcome: 'FAILED', automaticRetry: false, haltIntegration: true, producesIntakeEvents: false },
  MALFORMED_RESPONSE: { outcome: 'REJECTED', automaticRetry: false, haltIntegration: false, producesIntakeEvents: false },
  EMPTY_RESULT: { outcome: 'COMPLETED_EMPTY', automaticRetry: false, haltIntegration: false, producesIntakeEvents: false },
  PROVIDER_UNAVAILABLE: { outcome: 'FAILED', automaticRetry: false, haltIntegration: true, producesIntakeEvents: false },
  DUPLICATE_RESULT: { outcome: 'SKIPPED_DUPLICATE', automaticRetry: false, haltIntegration: false, producesIntakeEvents: false },
};

export class ProviderCallBudgetExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ProviderCallBudgetExceededError';
  }
}

export interface ProviderCallBudget {
  readonly used: number;
  readonly halted: string | null;
  /** Call before every provider call; throws when the budget is spent or halted. */
  consume(): void;
  /** Records a failure and applies its handling (halts the run where required). */
  recordFailure(kind: ProviderFailureKind): ProviderFailureHandling;
}

/** Per-acquisition-event call guard. No retry loop exists or can be built on it. */
export function createProviderCallBudget(
  maxCalls: number = PROVIDER_OPERATIONAL_CONTRACT.maxProviderCallsPerAcquisitionEvent,
): ProviderCallBudget {
  if (!Number.isInteger(maxCalls) || maxCalls < 1 || maxCalls > PROVIDER_OPERATIONAL_CONTRACT.maxProviderCallsPerAcquisitionEvent) {
    throw new ProviderCallBudgetExceededError(
      `maxCalls must be between 1 and ${PROVIDER_OPERATIONAL_CONTRACT.maxProviderCallsPerAcquisitionEvent}`,
    );
  }
  let used = 0;
  let halted: string | null = null;
  return {
    get used() {
      return used;
    },
    get halted() {
      return halted;
    },
    consume() {
      if (halted !== null) throw new ProviderCallBudgetExceededError(`integration halted: ${halted}`);
      if (used >= maxCalls) throw new ProviderCallBudgetExceededError('provider call budget exhausted; automatic retries are prohibited');
      used += 1;
    },
    recordFailure(kind) {
      const handling = PROVIDER_FAILURE_HANDLING[kind];
      if (handling.haltIntegration) halted = kind;
      return handling;
    },
  };
}
