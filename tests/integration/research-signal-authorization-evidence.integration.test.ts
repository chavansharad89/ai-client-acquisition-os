import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  ADMIN_URL,
  createTempDatabase,
  serverReachable,
  type TempDatabase,
} from './support/pgIndexHarness';

// Migration 0030 — research_signals authorization evidence, against real
// PostgreSQL (INTENT-INTAKE-PO-DEC-005, Option C).
// -----------------------------------------------------------------------
// Structural checks pin the schema to exactly what DEC-005 authorized: six
// nullable columns, no defaults / FK / CHECK, one composite index with no
// predicate, and an immutability trigger over exactly the five evidence
// fields. Behavioural checks are direct SQL, not application calls. The
// writer path (IA-1, OD-1..OD-12) now writes these columns via
// packages/core-research (pgRepository.ts); this test deliberately stays at
// the SQL layer so the invariants hold regardless of any application caller.
// No runtime caller is wired (OD-13 gate).
// -----------------------------------------------------------------------

const MIGRATION_0030 = resolve(
  __dirname,
  '../../packages/db/prisma/migrations/0030_research_signal_authorization_evidence/migration.sql',
);

const NEW_COLUMNS = {
  business_id: 'text',
  auth_status: 'text',
  auth_scope: 'text',
  auth_timestamp: 'timestamp without time zone',
  integration_id: 'text',
  revoked_at: 'timestamp without time zone',
} as const;

const EVIDENCE_FIELDS = ['auth_scope', 'auth_status', 'auth_timestamp', 'business_id', 'integration_id'];

let reachable = false;
const open: TempDatabase[] = [];

beforeAll(async () => {
  reachable = await serverReachable();
}, 60_000);

afterAll(async () => {
  while (open.length > 0) await open.pop()!.drop();
});

async function freshDb(label: string, throughMigration?: string): Promise<TempDatabase> {
  if (!reachable) {
    throw new Error(
      `PostgreSQL not reachable at ${ADMIN_URL}.\n` +
        `Start it first:  docker compose -f docker-compose.test.yml up -d`,
    );
  }
  const db = await createTempDatabase(label, throughMigration === undefined ? {} : { throughMigration });
  open.push(db);
  return db;
}

/** users -> service_profiles -> searches -> companies -> prospects, then one signal. */
async function seedSignal(db: TempDatabase, id: string, evidence: boolean): Promise<void> {
  await db.client.query(`
    INSERT INTO users (id, email, created_at) VALUES ('u1', 'u1@example.test', now())
      ON CONFLICT DO NOTHING;
    INSERT INTO service_profiles (id, user_id, service, target_customer, geography,
                                  min_project_value_paise, rationale)
      VALUES ('sp1', 'u1', 'svc', 'tc', 'geo', 0, 'r') ON CONFLICT DO NOTHING;
    INSERT INTO searches (id, user_id, service_profile_id, service, target_customer, geography,
                          min_project_value_paise, rationale)
      VALUES ('s1', 'u1', 'sp1', 'svc', 'tc', 'geo', 0, 'r') ON CONFLICT DO NOTHING;
    INSERT INTO companies (id, user_id, name, normalized_domain)
      VALUES ('c1', 'u1', 'Business A', 'business-a.example') ON CONFLICT DO NOTHING;
    INSERT INTO prospects (id, user_id, search_id, company_id)
      VALUES ('p1', 'u1', 's1', 'c1') ON CONFLICT DO NOTHING;
  `);
  if (!evidence) {
    await db.client.query(
      `INSERT INTO research_signals (id, prospect_id, field, kind, classification, signal, confidence, observed_at)
       VALUES ($1, 'p1', 'intent', 'FIRST_PARTY', 'OBSERVED', 'test signal', 50, now())`,
      [id],
    );
    return;
  }
  // Test-only values on a throwaway database; evidence is set at INSERT,
  // the only point the trigger allows it.
  await db.client.query(
    `INSERT INTO research_signals (id, prospect_id, field, kind, classification, signal, confidence,
                                   observed_at, business_id, auth_status, auth_scope, auth_timestamp,
                                   integration_id)
     VALUES ($1, 'p1', 'intent', 'FIRST_PARTY', 'OBSERVED', 'test signal', 50, now(),
             'biz-test', 'status-test', 'scope-test', '2026-01-01T00:00:00Z', 'integration-test')`,
    [id],
  );
}

async function expectFrozen(db: TempDatabase, sql: string): Promise<void> {
  await expect(db.client.query(sql)).rejects.toMatchObject({
    code: '23514',
    message: expect.stringContaining('research_signal_authorization_evidence_frozen'),
  });
}

describe('migration 0030 — static', () => {
  it('contains no DML (no backfill; DEC-005 C1)', () => {
    const sql = readFileSync(MIGRATION_0030, 'utf8').replace(/--.*$/gm, '');
    expect(sql).not.toMatch(/\bINSERT\s+INTO\b/i);
    expect(sql).not.toMatch(/\bDELETE\s+FROM\b/i);
    expect(sql).not.toMatch(/\bUPDATE\s+"?\w+"?\s+SET\b/i);
    expect(sql).not.toMatch(/\bDEFAULT\b/i);
    expect(sql).not.toMatch(/\bREFERENCES\b/i);
    expect(sql).not.toMatch(/\bCHECK\b/i);
  });
});

describe('migration 0030 — structure', () => {
  it('adds exactly six nullable columns with the decided types and no defaults', async () => {
    const db = await freshDb('ae_cols');
    const { rows } = await db.client.query(
      `SELECT column_name, data_type, is_nullable, column_default, datetime_precision
         FROM information_schema.columns
        WHERE table_name = 'research_signals' AND column_name = ANY($1)`,
      [Object.keys(NEW_COLUMNS)],
    );
    expect(rows).toHaveLength(6);
    for (const row of rows) {
      expect(row.data_type).toBe(NEW_COLUMNS[row.column_name as keyof typeof NEW_COLUMNS]);
      expect(row.is_nullable).toBe('YES');
      expect(row.column_default).toBeNull();
      if (row.data_type.startsWith('timestamp')) expect(row.datetime_precision).toBe(3);
    }
  });

  it('introduces no FK, CHECK or other constraint', async () => {
    const db = await freshDb('ae_cons');
    const { rows } = await db.client.query(
      `SELECT conname FROM pg_constraint
        WHERE conrelid = 'research_signals'::regclass ORDER BY conname`,
    );
    expect(rows.map((r) => r.conname)).toEqual([
      'research_signals_classification_check',
      'research_signals_confidence_range',
      'research_signals_kind_check',
      'research_signals_pkey',
      'research_signals_prospect_id_fkey',
      'research_signals_signal_null_iff_unknown',
    ]);
  });

  it('creates the composite index exactly, with no partial predicate', async () => {
    const db = await freshDb('ae_idx');
    const { rows } = await db.client.query(
      `SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'research_signals' ORDER BY indexname`,
    );
    const index = rows.find((r) => r.indexname === 'research_signals_business_id_auth_status_idx');
    expect(index?.indexdef).toBe(
      'CREATE INDEX research_signals_business_id_auth_status_idx ON public.research_signals USING btree (business_id, auth_status)',
    );
    expect(index?.indexdef).not.toMatch(/WHERE/i);
    // The only other indexes are the ones 0016 already created.
    expect(rows.map((r) => r.indexname)).toEqual([
      'research_signals_business_id_auth_status_idx',
      'research_signals_pkey',
      'research_signals_prospect_id_active_idx',
      'research_signals_prospect_id_idx',
    ]);
  });

  it('guards exactly the five evidence fields', async () => {
    const db = await freshDb('ae_trg');
    const { rows } = await db.client.query(
      `SELECT a.attname
         FROM pg_trigger t
         JOIN pg_attribute a ON a.attrelid = t.tgrelid AND a.attnum = ANY (t.tgattr::int2[])
        WHERE t.tgname = 'research_signals_authorization_evidence_frozen'
        ORDER BY a.attname`,
    );
    expect(rows.map((r) => r.attname)).toEqual(EVIDENCE_FIELDS);
  });
});

describe('migration 0030 — behaviour', () => {
  it('leaves existing rows untouched: all six columns NULL after applying 0030', async () => {
    const db = await freshDb('ae_hist', '0029_research_signal_intent_kinds');
    await seedSignal(db, 'hist1', false);
    await db.client.query(readFileSync(MIGRATION_0030, 'utf8'));
    const { rows } = await db.client.query(
      `SELECT business_id, auth_status, auth_scope, auth_timestamp, integration_id, revoked_at
         FROM research_signals WHERE id = 'hist1'`,
    );
    expect(rows).toEqual([
      {
        business_id: null,
        auth_status: null,
        auth_scope: null,
        auth_timestamp: null,
        integration_id: null,
        revoked_at: null,
      },
    ]);
  });

  it('rejects changing any evidence field, including NULL -> value', async () => {
    const db = await freshDb('ae_frozen');
    await seedSignal(db, 'sig1', true);
    await seedSignal(db, 'sig2', false);

    await expectFrozen(db, `UPDATE research_signals SET business_id = 'other' WHERE id = 'sig1'`);
    await expectFrozen(db, `UPDATE research_signals SET auth_status = 'other' WHERE id = 'sig1'`);
    await expectFrozen(db, `UPDATE research_signals SET auth_scope = 'other' WHERE id = 'sig1'`);
    await expectFrozen(db, `UPDATE research_signals SET auth_timestamp = now() WHERE id = 'sig1'`);
    await expectFrozen(db, `UPDATE research_signals SET integration_id = 'other' WHERE id = 'sig1'`);
    await expectFrozen(db, `UPDATE research_signals SET business_id = NULL WHERE id = 'sig1'`);
    await expectFrozen(db, `UPDATE research_signals SET business_id = 'late' WHERE id = 'sig2'`);
  });

  it('keeps revoked_at, superseded_at and the rest of the row updateable', async () => {
    const db = await freshDb('ae_open');
    await seedSignal(db, 'sig1', true);

    await db.client.query(`UPDATE research_signals SET revoked_at = now() WHERE id = 'sig1'`);
    await db.client.query(`UPDATE research_signals SET superseded_at = now() WHERE id = 'sig1'`);
    await db.client.query(`UPDATE research_signals SET confidence = 60 WHERE id = 'sig1'`);
    // Re-writing the same evidence value is not a change.
    await db.client.query(`UPDATE research_signals SET business_id = business_id WHERE id = 'sig1'`);

    const { rows } = await db.client.query(
      `SELECT revoked_at IS NOT NULL AS revoked, superseded_at IS NOT NULL AS superseded, confidence, business_id
         FROM research_signals WHERE id = 'sig1'`,
    );
    expect(rows).toEqual([{ revoked: true, superseded: true, confidence: 60, business_id: 'biz-test' }]);
  });
});
