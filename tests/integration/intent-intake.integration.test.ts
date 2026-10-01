import { randomUUID } from 'node:crypto';

import {
  createPgCompanyRepository,
  createPgProspectRepository,
  runDiscovery,
  type DiscoveryDeps,
} from '@acos/core-discovery';
import { createPgIdentityRepository, mintUserSession } from '@acos/core-identity';
import {
  createPgResearchSignalRepository,
  createPgResearchSignalTransactionRunner,
  normalizeIntentEvent,
  publicWebSearchAdapter,
  runResearch,
  toIntentIntakeInput,
  toIntentSignalInput,
  type AuthorizationEvidence,
  type LeadResearch,
  type RecordIntentSignalInput,
  type ResearchDeps,
} from '@acos/core-research';
import {
  createPgSearchRepository,
  createSearch,
  transitionSearch,
  type SearchDeps,
} from '@acos/core-search';
import { createPgServiceProfileRepository, createServiceProfile } from '@acos/core-service-profile';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// Intent intake persistence — real PostgreSQL (INTENT-INTAKE-PO-DEC-001).
// -----------------------------------------------------------------------
// Proves at the database itself: migration 0029 admits PUBLIC_INTENT and
// FIRST_PARTY (and still rejects anything else); observed_at carries the
// source event's time while created_at stays the capture time; and a
// research re-run's supersedePrevious retires research rows only (C2).
// Runs on the throwaway database suiteDatabase() creates on the test
// server — never a development or validation database.
// -----------------------------------------------------------------------

const suite = suiteDatabase('intent_intake');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

const OBSERVED_AT = new Date('2026-01-30T09:15:00.000Z');

/**
 * Complete FIRST_PARTY evidence (INTENT-INTAKE-AUTH-EVIDENCE-DESIGN-001
 * OD-1..OD-5). Granted one day before the test runs, so the OD-2 90-day
 * window checked against the real clock never lapses.
 */
function evidence(): AuthorizationEvidence {
  return {
    businessId: 'integration-business-0001',
    status: 'GRANTED',
    scope: 'ACQUISITION',
    authorizedAt: new Date(Date.now() - 86_400_000),
    integrationId: 'integration-0001',
  };
}

function repos() {
  const { db } = suite.require();
  return {
    identity: createPgIdentityRepository(db.client),
    profiles: createPgServiceProfileRepository(db.client),
    searches: createPgSearchRepository(db.client),
    companies: createPgCompanyRepository(db.client),
    prospects: createPgProspectRepository(db.client),
    signals: createPgResearchSignalRepository(db.client),
  };
}

function research(): LeadResearch {
  return {
    companySummary: {
      classification: 'OBSERVED',
      value: 'Acme runs three restaurants',
      evidence: [{ quote: 'Acme runs three restaurants', sourceUrl: 'https://acme.example.com', sourceLabel: 'homepage' }],
      basis: null,
      confidence: 90,
    },
    businessModel: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    targetCustomers: { classification: 'UNKNOWN', value: null, evidence: [], basis: null, confidence: 0 },
    categoryPlausibility: [],
    visibleProblems: [],
    growthOpportunities: [],
    aiOpportunities: [],
    websiteIssues: [],
    contentOpportunities: [],
    automationOpportunities: [],
    recommendedService: { service: 'NONE', rationale: 'insufficient evidence', basedOn: [] },
    confidence: 55,
    gaps: [],
  } as unknown as LeadResearch;
}

function intake(overrides: Partial<RecordIntentSignalInput> = {}): RecordIntentSignalInput {
  return {
    searchId: 'unused-here',
    companyName: 'Acme Co',
    website: 'https://acme.example.com',
    kind: 'PUBLIC_INTENT',
    field: 'requestedMobileApp',
    quote: 'Looking for someone to build an ordering app',
    sourceUrl: 'https://forum.example.org/t/123',
    sourceLabel: 'Public forum post',
    observedAt: OBSERVED_AT,
    ...overrides,
  };
}

async function setupProspect(): Promise<{ token: string; prospectId: string; base: ReturnType<typeof repos> }> {
  const { db } = suite.require();
  const base = repos();
  const userId = `user_intent_${randomUUID().replace(/-/g, '')}`;
  const email = `intent.${randomUUID().replace(/-/g, '')}@example.com`;
  await db.client.query(`INSERT INTO users (id, email, created_at) VALUES ($1, $2, now())`, [userId, email]);
  const { token } = await mintUserSession(base.identity, { id: userId, email });

  const d: SearchDeps & DiscoveryDeps = {
    ...base,
    provider: { discover: async () => [{ name: 'Acme Co', website: 'https://acme.example.com' }] },
  };
  const profile = await createServiceProfile(d, token, {
    service: 'App development',
    targetCustomer: 'Restaurants',
    geography: 'Mumbai',
    minProjectValuePaise: 3_000_000,
    triggers: ['PUBLIC_INTENT'],
    keywords: ['app'],
    rationale: 'They asked for an app ({signal}).',
  });
  const created = await createSearch(d, token, { serviceProfileId: profile.id });
  const running = (await transitionSearch(d, token, created.id, { status: 'RUNNING' }))!;
  const discovered = await runDiscovery(d, token, { searchId: running.id });
  return { token, prospectId: discovered.prospects[0]!.id, base };
}

/** The suite's single connection, exposed as a pool that pins it (sufficient for one transaction at a time). */
function pinnedPool() {
  const { db } = suite.require();
  const query = (sql: string, params?: readonly unknown[]) => db.client.query(sql, params as unknown[]);
  return { query, connect: async () => ({ query, release: () => undefined }) };
}

describe('research_signals authorization evidence writer path (IA-OD-WRITER-001; OD-7, OD-8)', () => {
  it('a FIRST_PARTY row stores the five evidence values verbatim in its INSERT; PUBLIC_INTENT and revoked_at stay NULL', async () => {
    const { db } = suite.require();
    const { prospectId, base } = await setupProspect();
    const supplied = evidence();

    const [pub] = await base.signals.saveSignals(prospectId, [toIntentSignalInput(intake()).signal], OBSERVED_AT);
    const [first] = await base.signals.saveSignals(
      prospectId,
      [toIntentSignalInput(intake({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: supplied })).signal],
      OBSERVED_AT,
    );

    const { rows } = await db.client.query(
      `SELECT id, business_id, auth_status, auth_scope, auth_timestamp, integration_id, revoked_at
         FROM research_signals WHERE id = ANY($1::text[])`,
      [[pub!.id, first!.id]],
    );
    const byId = new Map(rows.map((row) => [row.id, row]));
    expect(byId.get(first!.id)).toMatchObject({
      business_id: supplied.businessId,
      auth_status: 'GRANTED',
      auth_scope: 'ACQUISITION',
      integration_id: supplied.integrationId,
      revoked_at: null,
    });
    expect(new Date(byId.get(first!.id).auth_timestamp).toISOString()).toBe(supplied.authorizedAt.toISOString());
    expect(byId.get(pub!.id)).toMatchObject({
      business_id: null,
      auth_status: null,
      auth_scope: null,
      auth_timestamp: null,
      integration_id: null,
      revoked_at: null,
    });
  });

  it('a failure inside the transaction rolls back every signal and source row of the event', async () => {
    const { db } = suite.require();
    const { prospectId } = await setupProspect();
    const signal = toIntentSignalInput(intake({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: evidence() })).signal;

    await expect(
      createPgResearchSignalTransactionRunner(pinnedPool())(async (tx) => {
        await tx.saveSignals(prospectId, [signal], OBSERVED_AT);
        throw new Error('simulated failure after the first signal');
      }),
    ).rejects.toThrow('simulated failure after the first signal');

    const { rows } = await db.client.query(
      `SELECT count(*)::int AS signals,
              (SELECT count(*)::int FROM research_signal_sources s
                 JOIN research_signals rs ON rs.id = s.signal_id WHERE rs.prospect_id = $1) AS sources
         FROM research_signals WHERE prospect_id = $1 AND kind = 'FIRST_PARTY'`,
      [prospectId],
    );
    expect(rows[0]).toEqual({ signals: 0, sources: 0 });
  });
});

describe('research_signals intent kinds (migration 0029)', () => {
  it('persists PUBLIC_INTENT (70) and FIRST_PARTY (90) as OBSERVED with full provenance; observed_at ≠ created_at', async () => {
    const { db } = suite.require();
    const { prospectId, base } = await setupProspect();

    const [pub] = await base.signals.saveSignals(prospectId, [toIntentSignalInput(intake()).signal], OBSERVED_AT);
    const [first] = await base.signals.saveSignals(
      prospectId,
      [
        toIntentSignalInput(
          intake({
            kind: 'FIRST_PARTY',
            field: 'statedRequirement',
            quote: 'I need an app, 3 lakh',
            sourceUrl: 'https://landing.example.com/f/1',
            sourceLabel: 'AI-platform acquisition · ai referral',
            authorizationEvidence: evidence(),
          }),
        ).signal,
      ],
      OBSERVED_AT,
    );

    const { rows } = await db.client.query(
      `SELECT kind, classification, confidence, observed_at, created_at > observed_at AS captured_after_event
         FROM research_signals WHERE id = ANY($1::text[]) ORDER BY confidence`,
      [[pub!.id, first!.id]],
    );
    expect(rows.map((r) => [r.kind, r.classification, r.confidence])).toEqual([
      ['PUBLIC_INTENT', 'OBSERVED', 70],
      ['FIRST_PARTY', 'OBSERVED', 90],
    ]);
    for (const row of rows) {
      expect(new Date(row.observed_at).toISOString()).toBe(OBSERVED_AT.toISOString());
      // created_at is the capture time (DB default), not the source event time. Compared
      // in SQL: both columns are TIMESTAMP without time zone, so a JS wall-clock
      // comparison would depend on the client's time zone.
      expect(row.captured_after_event).toBe(true);
    }

    const { rows: sources } = await db.client.query(
      `SELECT source_url, source_quote, source_label FROM research_signal_sources WHERE signal_id = $1`,
      [pub!.id],
    );
    expect(sources).toEqual([
      {
        source_url: 'https://forum.example.org/t/123',
        source_quote: 'Looking for someone to build an ordering app',
        source_label: 'Public forum post',
      },
    ]);
  });

  it('still rejects kinds outside the vocabulary', async () => {
    const { prospectId, base } = await setupProspect();
    await expect(
      base.signals.saveSignals(
        prospectId,
        [{ ...toIntentSignalInput(intake()).signal, kind: 'PAID_AI' as never }],
        OBSERVED_AT,
      ),
    ).rejects.toThrow(/research_signals_kind_check/);
  });

  it('C2: a research re-run supersedes research rows only — intake rows stay active', async () => {
    const { db } = suite.require();
    const { token, prospectId, base } = await setupProspect();
    const deps: ResearchDeps = { ...base, provider: { research: async () => research() } };

    const first = await runResearch(deps, token, { prospectId });
    await base.signals.saveSignals(prospectId, [toIntentSignalInput(intake()).signal], OBSERVED_AT);
    await base.signals.saveSignals(
      prospectId,
      [toIntentSignalInput(intake({ kind: 'FIRST_PARTY', field: 'statedRequirement', authorizationEvidence: evidence() })).signal],
      OBSERVED_AT,
    );
    const second = await runResearch(deps, token, { prospectId });

    // Exactly the first run's research rows — unchanged semantics for research kinds.
    expect(second.superseded).toBe(first.signals.length);
    const { rows } = await db.client.query(
      `SELECT kind, superseded_at IS NULL AS active FROM research_signals WHERE prospect_id = $1`,
      [prospectId],
    );
    const isIntake = (kind: string) => kind === 'PUBLIC_INTENT' || kind === 'FIRST_PARTY';
    expect(rows.filter((r) => isIntake(r.kind) && r.active).map((r) => r.kind).sort()).toEqual([
      'FIRST_PARTY',
      'PUBLIC_INTENT',
    ]);
    expect(rows.filter((r) => !isIntake(r.kind) && r.active)).toHaveLength(second.signals.length);
    expect(rows.filter((r) => !isIntake(r.kind) && !r.active)).toHaveLength(first.signals.length);
  });

  it('multi-signal event: PUBLIC_INTENT + FIRST_PARTY saved per signal both stay active, and a later research run supersedes neither', async () => {
    const { db } = suite.require();
    const { token, prospectId, base } = await setupProspect();
    const deps: ResearchDeps = { ...base, provider: { research: async () => research() } };
    const { searchId, companyName, website, ...entry } = intake();
    const validated = toIntentIntakeInput({
      searchId,
      companyName,
      website,
      signals: [
        entry,
        { ...entry, kind: 'FIRST_PARTY', field: 'statedRequirement', quote: 'I need an app, 3 lakh', authorizationEvidence: evidence() },
      ],
    });

    // Same persistence loop as recordIntentIntakeForOwner, in one transaction (OD-8).
    await createPgResearchSignalTransactionRunner(pinnedPool())(async (tx) => {
      for (const { signal, observedAt } of validated.signals) {
        await tx.saveSignals(prospectId, [signal], observedAt);
      }
    });
    await runResearch(deps, token, { prospectId });

    const { rows } = await db.client.query(
      `SELECT kind, classification, confidence FROM research_signals
        WHERE prospect_id = $1 AND superseded_at IS NULL AND kind = ANY($2::text[]) ORDER BY confidence`,
      [prospectId, ['PUBLIC_INTENT', 'FIRST_PARTY']],
    );
    expect(rows.map((r) => [r.kind, r.classification, r.confidence])).toEqual([
      ['PUBLIC_INTENT', 'OBSERVED', 70],
      ['FIRST_PARTY', 'OBSERVED', 90],
    ]);
  });

  it('source adapter: a normalized public-web event persists its provenance (label, URL, quote, observed_at) through the canonical rows', async () => {
    const { db } = suite.require();
    const { prospectId, base } = await setupProspect();
    const capturedAt = new Date(OBSERVED_AT.getTime() + 60_000);
    const event = normalizeIntentEvent(
      publicWebSearchAdapter,
      {
        resultType: 'PROCUREMENT_NOTICE',
        resultId: 'result-0001',
        pageUrl: 'https://procurement.example.org/notices/1',
        organization: { name: 'Acme Co', website: 'https://acme.example.com' },
        excerpt: 'Public RFP seeking development of a restaurant ordering app',
        requirement: 'requestedMobileApp',
        publishedAt: OBSERVED_AT,
      },
      { searchId: 'unused', capturedAt, now: capturedAt },
    );

    for (const { signal, observedAt } of toIntentIntakeInput(event.intake, capturedAt).signals) {
      await base.signals.saveSignals(prospectId, [signal], observedAt);
    }

    const { rows } = await db.client.query(
      `SELECT rs.kind, rs.classification, rs.confidence, rs.observed_at,
              s.source_url, s.source_quote, s.source_label
         FROM research_signals rs JOIN research_signal_sources s ON s.signal_id = rs.id
        WHERE rs.prospect_id = $1 AND rs.kind = 'PUBLIC_INTENT'`,
      [prospectId],
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      kind: 'PUBLIC_INTENT',
      classification: 'OBSERVED',
      confidence: 70,
      source_url: 'https://procurement.example.org/notices/1',
      source_quote: 'Public RFP seeking development of a restaurant ordering app',
      source_label: 'Public web search · procurement notice',
    });
    expect(new Date(rows[0].observed_at).toISOString()).toBe(OBSERVED_AT.toISOString());
  });
});
