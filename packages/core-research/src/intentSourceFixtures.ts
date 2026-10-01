import type { AuthorizationEvidence } from './intentSignal';
import type {
  AiPlatformAcquisitionRecord,
  PublicIntentNoticeRecord,
  PublicWebSearchRecord,
} from './intentSourceAdapters';

// Deterministic, provider-free fixtures for the acquisition-source
// adapters. Test data only: every name and URL is fictional (.example /
// .test), and nothing here is fetched.

export const FIXTURE_NOW = new Date('2026-02-01T12:00:00.000Z');
export const FIXTURE_CAPTURED_AT = new Date('2026-02-01T11:00:00.000Z');

/** Validated integration evidence as the provider contract would attach it (OD-1..OD-5). */
export function authorizationEvidenceFixture(): AuthorizationEvidence {
  return {
    businessId: 'fixture-business-0001',
    status: 'GRANTED',
    scope: 'ACQUISITION',
    authorizedAt: new Date('2026-01-15T00:00:00.000Z'),
    integrationId: 'fixture-integration',
  };
}

/** Google public-intent fixture → PUBLIC_INTENT, 70. */
export function publicWebSearchFixture(): PublicWebSearchRecord {
  return {
    resultType: 'PROCUREMENT_NOTICE',
    resultId: 'result-edtech-0001',
    pageUrl: 'https://procurement.example.org/notices/edtech-mobile-learning',
    organization: { name: 'Example EdTech Pvt Ltd', website: 'https://edtech.example.com' },
    excerpt: 'Public RFP seeking development of a mobile learning platform',
    requirement: 'requestedMobileApp',
    publishedAt: new Date('2026-01-28T08:00:00.000Z'),
    context: { targetCustomer: 'EdTech companies', geography: 'India', service: 'Mobile app development' },
  };
}

/**
 * AI-ad fixture → FIRST_PARTY, 90. What an authorized integration supplies
 * about the business's own stated interest — no platform-user
 * conversation, prompt or identity.
 */
export function aiPlatformAcquisitionFixture(): AiPlatformAcquisitionRecord {
  return {
    placement: 'AI_PLATFORM_AD',
    integrationEventId: 'aiad-evt-0001',
    business: { name: 'Example University', website: 'https://university.example.edu' },
    landingUrl: 'https://landing.example.com/forms/ai-ad',
    interests: [
      {
        disclosure: 'SUPPLIED_TO_US',
        requirement: 'requestedWebsite',
        statement: 'We want a new admissions website and a student mobile app',
        occurredAt: new Date('2026-01-30T09:15:00.000Z'),
      },
    ],
    context: { targetCustomer: 'Universities', geography: 'India', service: 'Website development' },
    authorizationEvidence: authorizationEvidenceFixture(),
  };
}

/** Generic public-intent fixture → PUBLIC_INTENT, 70. */
export function publicIntentNoticeFixture(): PublicIntentNoticeRecord {
  return {
    noticeType: 'PROJECT_REQUEST',
    noticeId: 'notice-testprep-0001',
    noticeUrl: 'https://notices.example.org/testprep/modernization',
    organization: { name: 'Example Test Prep', website: 'https://testprep.example.com' },
    requirements: [
      {
        requirement: 'requestedRedesign',
        text: 'Publicly posted requirement for website and mobile application modernization',
      },
    ],
    postedAt: new Date('2026-01-29T10:00:00.000Z'),
  };
}
