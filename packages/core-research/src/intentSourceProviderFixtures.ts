import type {
  AiPlatformProviderSignal,
  PublicIntentProviderNotice,
  PublicWebSearchProviderResult,
} from './intentSourceProviderContract';

// Deterministic provider-result fixtures for the provider contract tests.
// Test data only: every name and URL is fictional (.example / .test), and
// nothing here is fetched. Not exported from the package.

export const PROVIDER_FIXTURE_NOW = new Date('2026-02-01T12:00:00.000Z');
export const PROVIDER_FIXTURE_CAPTURED_AT = new Date('2026-02-01T11:00:00.000Z');

const FIXTURE_PROVENANCE = { integration: 'fixture', retrieval: 'FIXTURE' } as const;

/** Grant time inside the 90-day window of PROVIDER_FIXTURE_NOW and before capture (OD-2). */
export const PROVIDER_FIXTURE_AUTHORIZED_AT = new Date('2026-01-15T00:00:00.000Z');

function webResult(overrides: Partial<PublicWebSearchProviderResult>): PublicWebSearchProviderResult {
  return {
    sourceFamily: 'PUBLIC_WEB_SEARCH',
    resultType: 'SEARCH_RESULT',
    externalId: 'web-0001',
    title: 'Example Bakery — news',
    url: 'https://bakery.example.com/news/new-website',
    snippet: 'Example Bakery is looking for an agency to build a new ordering website this spring.',
    observedAt: new Date('2026-01-25T09:00:00.000Z'),
    capturedAt: PROVIDER_FIXTURE_CAPTURED_AT,
    business: { name: 'Example Bakery', website: 'https://bakery.example.com' },
    publication: { publisher: 'Example Bakery', publishedAt: new Date('2026-01-25T09:00:00.000Z') },
    provenance: FIXTURE_PROVENANCE,
    intentEvidence: {
      requirement: 'requestedWebsite',
      evidence: 'looking for an agency to build a new ordering website',
    },
    ...overrides,
  };
}

export const webFixtures = {
  ordinary: () => webResult({}),
  /** An ordinary listing with no stated business intent. */
  ordinaryWithoutIntent: () =>
    webResult({
      externalId: 'web-0002',
      title: 'Example Bakery — opening hours',
      snippet: 'Open daily from 7am. Fresh bread and pastries.',
      intentEvidence: null,
    }),
  procurement: () =>
    webResult({
      resultType: 'PROCUREMENT_NOTICE',
      externalId: 'web-rfp-0001',
      title: 'RFP: Citizen services portal',
      url: 'https://procurement.example.org/notices/citizen-portal',
      snippet: 'The City of Example invites proposals for development of a citizen services web portal.',
      business: { name: 'City of Example', website: 'https://city.example.gov' },
      publication: { publisher: 'Example Procurement Board', publishedAt: new Date('2026-01-20T08:00:00.000Z') },
      intentEvidence: {
        requirement: 'requestedDevelopment',
        evidence: 'invites proposals for development of a citizen services web portal',
      },
    }),
  projectRequest: () =>
    webResult({
      resultType: 'PROJECT_POSTING',
      externalId: 'web-proj-0001',
      title: 'Project: mobile app for clinic bookings',
      url: 'https://projects.example.org/p/clinic-app',
      snippet: 'Example Clinic needs a mobile app for patient appointment booking.',
      business: { name: 'Example Clinic', website: 'https://clinic.example.com' },
      intentEvidence: { requirement: 'requestedMobileApp', evidence: 'needs a mobile app for patient appointment booking' },
    }),
  hiring: () =>
    webResult({
      resultType: 'HIRING_SIGNAL',
      externalId: 'web-hire-0001',
      title: 'Example Logistics is hiring a React Native developer',
      url: 'https://jobs.example.org/example-logistics/react-native',
      snippet: 'Join us to build our first driver mobile app from scratch.',
      business: { name: 'Example Logistics', website: 'https://logistics.example.com' },
      intentEvidence: { requirement: 'requestedMobileApp', evidence: 'build our first driver mobile app from scratch' },
    }),
  migration: () =>
    webResult({
      resultType: 'TECHNOLOGY_MIGRATION',
      externalId: 'web-migr-0001',
      title: 'Example Retail moving off legacy storefront',
      url: 'https://retail.example.com/blog/replatform',
      snippet: 'We are migrating our storefront from a legacy platform to a headless commerce stack.',
      business: { name: 'Example Retail', website: 'https://retail.example.com' },
      intentEvidence: {
        requirement: 'requestedRedesign',
        evidence: 'migrating our storefront from a legacy platform to a headless commerce stack',
      },
    }),
  malformed: () => ({ ...webResult({}), snippet: 42 }) as unknown as PublicWebSearchProviderResult,
  missingUrl: () => ({ ...webResult({}), url: '' }),
  missingIdentity: () => webResult({ externalId: 'web-anon-0001', business: null }),
};

export function aiPlatformSignal(overrides: Partial<AiPlatformProviderSignal> = {}): AiPlatformProviderSignal {
  return {
    sourceFamily: 'AI_PLATFORM_ACQUISITION',
    acquisitionType: 'AI_PLATFORM_AD',
    externalId: 'aiad-0001',
    business: { name: 'Example University', website: 'https://university.example.edu' },
    sourceReference: 'https://landing.example.com/forms/ai-ad',
    evidence: [
      {
        origin: 'SUPPLIED_TO_US',
        derivation: 'STATED_BY_BUSINESS',
        requirement: 'requestedWebsite',
        statement: 'We want a new admissions website',
        observedAt: new Date('2026-01-30T09:15:00.000Z'),
      },
    ],
    capturedAt: PROVIDER_FIXTURE_CAPTURED_AT,
    provenance: { integration: 'fixture-integration', retrieval: 'AUTHORIZED_INTEGRATION' },
    authorization: {
      integrationId: 'fixture-integration',
      businessId: 'fixture-business-0001',
      status: 'GRANTED',
      scope: 'ACQUISITION',
      authorizedAt: PROVIDER_FIXTURE_AUTHORIZED_AT,
      basis: 'fixture: basis as stated by the integration (not evaluated)',
      reference: 'https://landing.example.com/terms',
    },
    ...overrides,
  };
}

function notice(overrides: Partial<PublicIntentProviderNotice>): PublicIntentProviderNotice {
  return {
    sourceFamily: 'PUBLIC_INTENT_NOTICE',
    noticeType: 'RFP_NOTICE',
    externalId: 'notice-rfp-0001',
    title: 'Request for proposal: learning management system',
    url: 'https://notices.example.org/rfp/lms',
    body: 'Example College seeks a vendor to design and build a learning management system.',
    observedAt: new Date('2026-01-22T10:00:00.000Z'),
    capturedAt: PROVIDER_FIXTURE_CAPTURED_AT,
    business: { name: 'Example College', website: 'https://college.example.edu' },
    publication: { publisher: 'Example Notices', publishedAt: new Date('2026-01-22T10:00:00.000Z') },
    provenance: { integration: 'fixture', retrieval: 'PUBLIC_NOTICE_FEED' },
    intentEvidence: [
      { requirement: 'requestedDevelopment', evidence: 'seeks a vendor to design and build a learning management system' },
    ],
    ...overrides,
  };
}

export const noticeFixtures = {
  publicNotice: () => notice({}),
  projectRequest: () =>
    notice({
      noticeType: 'PROJECT_REQUEST',
      externalId: 'notice-proj-0001',
      title: 'Project request',
      body: 'Example Test Prep requests quotes for a website and mobile application modernization.',
      business: { name: 'Example Test Prep', website: 'https://testprep.example.com' },
      intentEvidence: [
        { requirement: 'requestedRedesign', evidence: 'requests quotes for a website and mobile application modernization' },
      ],
    }),
  announcement: () =>
    notice({
      noticeType: 'COMPANY_ANNOUNCEMENT',
      externalId: 'notice-ann-0001',
      title: 'Example Foods announces digital ordering',
      body: 'Example Foods announced it will launch online ordering and is selecting a development partner.',
      business: { name: 'Example Foods', website: 'https://foods.example.com' },
      intentEvidence: [
        { requirement: 'requestedDevelopment', evidence: 'will launch online ordering and is selecting a development partner' },
      ],
    }),
  hiring: () =>
    notice({
      noticeType: 'HIRING_SIGNAL',
      externalId: 'notice-hire-0001',
      title: 'Hiring: web platform lead',
      body: 'Example Travel is hiring a web platform lead to rebuild its booking website.',
      business: { name: 'Example Travel', website: 'https://travel.example.com' },
      intentEvidence: [{ requirement: 'requestedWebsite', evidence: 'to rebuild its booking website' }],
    }),
  migration: () =>
    notice({
      noticeType: 'TECHNOLOGY_MIGRATION',
      externalId: 'notice-migr-0001',
      title: 'Platform migration notice',
      body: 'Example Insurance will migrate its customer portal to a new platform and needs a native mobile app.',
      business: { name: 'Example Insurance', website: 'https://insurance.example.com' },
      intentEvidence: [
        { requirement: 'requestedRedesign', evidence: 'will migrate its customer portal to a new platform' },
        { requirement: 'requestedMobileApp', evidence: 'needs a native mobile app' },
      ],
    }),
  malformed: () => ({ ...notice({}), noticeType: 'TWEET' }) as unknown as PublicIntentProviderNotice,
};
