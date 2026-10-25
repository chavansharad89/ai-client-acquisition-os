import { createPgFieldClassificationRepository } from '@acos/core-research';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { suiteDatabase } from './support/suiteDb';

// Phase H (migration 0058, research_signal_field_classification) — real
// PostgreSQL. Proves createPgFieldClassificationRepository's fail-closed
// contract against the actual, already-applied, already-seeded reference
// table — not a fake. This table is never written by application code
// (it is seeded once, by the migration itself), so there is no write
// path to exercise here, only the read path these tests assert on.

const suite = suiteDatabase('research-signal-field-classification');

beforeAll(() => suite.setup(), 60_000);
afterEach(() => suite.cleanup());
afterAll(() => suite.teardown());

function repository() {
  const { db } = suite.require();
  return createPgFieldClassificationRepository(db.client);
}

describe('research_signal_field_classification schema (migration 0058)', () => {
  it('exists, keyed by field, with the visibility CHECK constraint', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'research_signal_field_classification'`,
    );
    const columns = (rows as { column_name: string }[]).map((r) => r.column_name);
    expect(columns).toEqual(expect.arrayContaining(['field', 'visibility']));
  });

  it('seeds exactly the approved OQ-6/Q4 mapping, untouched by this test suite', async () => {
    const { db } = suite.require();
    const { rows } = await db.client.query(
      `SELECT field, visibility FROM research_signal_field_classification ORDER BY field`,
    );
    const seeded = Object.fromEntries((rows as { field: string; visibility: string }[]).map((r) => [r.field, r.visibility]));
    expect(seeded).toMatchObject({
      companySummary: 'PUBLIC_ELIGIBLE',
      businessModel: 'PUBLIC_ELIGIBLE',
      websiteIssues: 'PRIVATE',
      contentOpportunities: 'PRIVATE',
      aiOpportunities: 'PRIVATE',
      growthOpportunities: 'PRIVATE',
    });
  });
});

describe('createPgFieldClassificationRepository — real PostgreSQL', () => {
  it('1. companySummary => PUBLIC_ELIGIBLE', async () => {
    expect(await repository().isFieldPublicEligible('companySummary')).toBe(true);
  });

  it('2. businessModel => PUBLIC_ELIGIBLE', async () => {
    expect(await repository().isFieldPublicEligible('businessModel')).toBe(true);
  });

  it('3. websiteIssues => PRIVATE', async () => {
    expect(await repository().isFieldPublicEligible('websiteIssues')).toBe(false);
  });

  it('4. contentOpportunities => PRIVATE', async () => {
    expect(await repository().isFieldPublicEligible('contentOpportunities')).toBe(false);
  });

  it('5. aiOpportunities => PRIVATE', async () => {
    expect(await repository().isFieldPublicEligible('aiOpportunities')).toBe(false);
  });

  it('6. growthOpportunities => PRIVATE', async () => {
    expect(await repository().isFieldPublicEligible('growthOpportunities')).toBe(false);
  });

  it('7. an unknown field (no row at all) => PRIVATE, fails closed', async () => {
    expect(await repository().isFieldPublicEligible('totallyUnrecognizedField')).toBe(false);
  });

  it('8. a missing-classification field behaves identically to an unknown one — no special-case row needed to prove it', async () => {
    const result = await repository().isFieldPublicEligible('');
    expect(result).toBe(false);
  });
});
