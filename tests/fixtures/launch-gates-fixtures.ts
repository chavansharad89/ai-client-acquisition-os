import type { Queryable, TestRunContext } from './test-run-context';

// Phase 9 fixture helpers (PDEF-4 ED-12's deterministic, real-Postgres
// fixture suite), authorized under
// CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
// -----------------------------------------------------------------------
// Deliberately separate from tests/fixtures/idempotency-duplicates.ts and
// its TestRunContext-tracked orders/payments buckets: these helpers seed
// the Client-Finder-domain tables (users, service_profiles, searches,
// companies, prospects, opportunities, feedback, funnel_events) that the
// launch-gates packages read, which TestRunContext's CLEANUP_ORDER does
// not know about. Every timestamp a caller needs to control (occurred_at,
// completed_at, created_at) is an explicit parameter — never `now()` —
// so window-boundary scenarios can place a row exactly on, or just off,
// a boundary.
// -----------------------------------------------------------------------

export interface GatesTracker {
  userIds: string[];
  serviceProfileIds: string[];
  companyIds: string[];
  searchIds: string[];
  prospectIds: string[];
  opportunityIds: string[];
  feedbackIds: string[];
  funnelEventIds: string[];
}

export function createGatesTracker(): GatesTracker {
  return {
    userIds: [],
    serviceProfileIds: [],
    companyIds: [],
    searchIds: [],
    prospectIds: [],
    opportunityIds: [],
    feedbackIds: [],
    funnelEventIds: [],
  };
}

/** Child-to-parent, matching the foreign keys these tables carry. */
async function deleteTracked(
  db: Queryable,
  table: string,
  ids: readonly string[],
): Promise<void> {
  if (ids.length === 0) return;
  await db.query(`DELETE FROM "${table}" WHERE id = ANY($1::text[])`, [ids]);
}

/** Deletes exactly the rows this run's gates-domain fixtures created, then verifies none survived. */
export async function cleanupGatesFixtures(db: Queryable, tracker: GatesTracker): Promise<void> {
  await deleteTracked(db, 'feedback', tracker.feedbackIds);
  await deleteTracked(db, 'funnel_events', tracker.funnelEventIds);
  await deleteTracked(db, 'opportunities', tracker.opportunityIds);
  await deleteTracked(db, 'prospects', tracker.prospectIds);
  await deleteTracked(db, 'companies', tracker.companyIds);
  await deleteTracked(db, 'searches', tracker.searchIds);
  await deleteTracked(db, 'service_profiles', tracker.serviceProfileIds);
  await deleteTracked(db, 'users', tracker.userIds);

  const checks: Array<[string, readonly string[]]> = [
    ['feedback', tracker.feedbackIds],
    ['funnel_events', tracker.funnelEventIds],
    ['opportunities', tracker.opportunityIds],
    ['prospects', tracker.prospectIds],
    ['companies', tracker.companyIds],
    ['searches', tracker.searchIds],
    ['service_profiles', tracker.serviceProfileIds],
    ['users', tracker.userIds],
  ];
  for (const [table, ids] of checks) {
    if (ids.length === 0) continue;
    const { rows } = await db.query(`SELECT id FROM "${table}" WHERE id = ANY($1::text[])`, [ids]);
    if (rows.length > 0) {
      throw new Error(`cleanupGatesFixtures left rows behind in ${table}: ${JSON.stringify(rows)}`);
    }
  }
}

// --- orders / payments with a caller-controlled created_at --------------
// (idempotency-duplicates.ts's seedOrder/seedCapturedPayment always write
// `now()`; window-boundary and multi-window scenarios need an exact,
// caller-chosen instant instead. These still track through
// TestRunContext.trackOrder/trackPayment, so the existing
// tests/fixtures/test-run-context.ts cleanup still reaps them.)

export interface SeedOrderAtOptions {
  createdAt: Date;
  productId?: string;
  amountPaise?: number;
  visitorId?: string | null;
  customerEmail?: string;
}

export async function seedOrderAt(
  db: Queryable,
  context: TestRunContext,
  suffix: string | number,
  options: SeedOrderAtOptions,
): Promise<string> {
  const id = context.id('gorder', suffix);
  const amountPaise = options.amountPaise ?? 49_900;
  const productId = options.productId ?? 'ai_freelancing_499';
  const email = options.customerEmail ?? `${id}@fixture.example.com`;
  await db.query(
    `INSERT INTO orders (id, razorpay_order_id, idempotency_key, customer_email, visitor_id,
                         product_slug, product_name, amount_paise, currency, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'Fixture Product', $7, 'INR', 'PENDING', $8, $8)
     ON CONFLICT (id) DO NOTHING`,
    [id, `rzp_${id}`, `idem_${id}`, email, options.visitorId ?? null, productId, amountPaise, options.createdAt],
  );
  return context.trackOrder(id);
}

export interface SeedCapturedPaymentAtOptions {
  createdAt: Date;
  amountPaise?: number;
}

export async function seedCapturedPaymentAt(
  db: Queryable,
  context: TestRunContext,
  orderId: string,
  suffix: string | number,
  options: SeedCapturedPaymentAtOptions,
): Promise<string> {
  const id = context.id('gpayment', suffix);
  const amountPaise = options.amountPaise ?? 49_900;
  await db.query(
    `INSERT INTO payments (id, razorpay_payment_id, order_id, amount_paise, currency, status, created_at, updated_at)
     VALUES ($1, $2, $3, $4, 'INR', 'CAPTURED', $5, $5)
     ON CONFLICT (id) DO NOTHING`,
    [id, `rzp_${id}`, orderId, amountPaise, options.createdAt],
  );
  return context.trackPayment(id);
}

// --- funnel_events --------------------------------------------------------

export interface SeedFunnelEventOptions {
  eventName: string;
  subjectType: string;
  subjectId: string;
  occurredAt: Date;
  visitorId?: string | null;
  userId?: string | null;
}

/**
 * Inserts one funnel_events row, reproducing the production dedupe idiom
 * (ON CONFLICT DO NOTHING against the partial unique indexes migration
 * 0031 created). Returns whether this call's row was the one actually
 * stored (false on a dedupe no-op), so duplicate-event scenarios can
 * assert on it directly.
 */
export async function seedFunnelEvent(
  db: Queryable,
  context: TestRunContext,
  tracker: GatesTracker,
  suffix: string | number,
  options: SeedFunnelEventOptions,
): Promise<{ id: string; inserted: boolean }> {
  const id = context.id('fevent', suffix);
  const visitorId = options.visitorId ?? null;
  const userId = options.userId ?? null;
  const conflictTarget =
    visitorId !== null
      ? `(event_name, visitor_id, subject_id) WHERE visitor_id IS NOT NULL`
      : `(event_name, user_id, subject_id) WHERE user_id IS NOT NULL`;
  const { rows } = await db.query(
    `INSERT INTO funnel_events (id, event_name, visitor_id, user_id, subject_type, subject_id, occurred_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT ${conflictTarget} DO NOTHING
     RETURNING id`,
    [id, options.eventName, visitorId, userId, options.subjectType, options.subjectId, options.occurredAt],
  );
  const inserted = rows.length > 0;
  if (inserted) tracker.funnelEventIds.push(id);
  return { id, inserted };
}

// --- users / service_profiles / searches / companies / prospects --------

export async function seedUser(
  db: Queryable,
  context: TestRunContext,
  tracker: GatesTracker,
  suffix: string | number,
): Promise<string> {
  const id = context.id('guser', suffix);
  await db.query(
    `INSERT INTO users (id, email) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING`,
    [id, `${id}@fixture.example.com`],
  );
  tracker.userIds.push(id);
  return id;
}

export interface SeedServiceProfileOptions {
  service: string;
  targetCustomer: string;
  geography: string;
  minProjectValuePaise: number;
}

export async function seedServiceProfile(
  db: Queryable,
  context: TestRunContext,
  tracker: GatesTracker,
  userId: string,
  suffix: string | number,
  options: SeedServiceProfileOptions,
): Promise<string> {
  const id = context.id('gprofile', suffix);
  await db.query(
    `INSERT INTO service_profiles
       (id, user_id, service, target_customer, geography, min_project_value_paise, rationale)
     VALUES ($1, $2, $3, $4, $5, $6, 'fixture rationale')
     ON CONFLICT (id) DO NOTHING`,
    [id, userId, options.service, options.targetCustomer, options.geography, options.minProjectValuePaise],
  );
  tracker.serviceProfileIds.push(id);
  return id;
}

export interface SeedSearchOptions {
  status: 'PENDING' | 'RUNNING' | 'COMPLETE' | 'FAILED' | 'CANCELLED';
  completedAt?: Date | null;
  service: string;
  targetCustomer: string;
  geography: string;
  minProjectValuePaise: number;
}

export async function seedSearch(
  db: Queryable,
  context: TestRunContext,
  tracker: GatesTracker,
  userId: string,
  serviceProfileId: string,
  suffix: string | number,
  options: SeedSearchOptions,
): Promise<string> {
  const id = context.id('gsearch', suffix);
  await db.query(
    `INSERT INTO searches
       (id, user_id, service_profile_id, status, service, target_customer, geography,
        min_project_value_paise, rationale, completed_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'fixture rationale', $9)
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      userId,
      serviceProfileId,
      options.status,
      options.service,
      options.targetCustomer,
      options.geography,
      options.minProjectValuePaise,
      options.completedAt ?? null,
    ],
  );
  tracker.searchIds.push(id);
  return id;
}

export async function seedCompany(
  db: Queryable,
  context: TestRunContext,
  tracker: GatesTracker,
  userId: string,
  suffix: string | number,
): Promise<string> {
  const id = context.id('gcompany', suffix);
  await db.query(
    `INSERT INTO companies (id, user_id, name, normalized_domain)
     VALUES ($1, $2, 'Fixture Co', $3)
     ON CONFLICT (id) DO NOTHING`,
    [id, userId, `fixture-${id}.example.com`],
  );
  tracker.companyIds.push(id);
  return id;
}

export async function seedProspect(
  db: Queryable,
  context: TestRunContext,
  tracker: GatesTracker,
  userId: string,
  searchId: string,
  companyId: string,
  suffix: string | number,
): Promise<string> {
  const id = context.id('gprospect', suffix);
  await db.query(
    `INSERT INTO prospects (id, user_id, search_id, company_id, status)
     VALUES ($1, $2, $3, $4, 'DISCOVERED')
     ON CONFLICT (id) DO NOTHING`,
    [id, userId, searchId, companyId],
  );
  tracker.prospectIds.push(id);
  return id;
}

export interface SeedOpportunityOptions {
  needDetected: boolean;
  recommendedService?: string;
  offerRationale?: string;
  offerEstimatedValuePaise?: number;
  offerFit?: number;
}

export async function seedOpportunity(
  db: Queryable,
  context: TestRunContext,
  tracker: GatesTracker,
  userId: string,
  prospectId: string,
  suffix: string | number,
  options: SeedOpportunityOptions,
): Promise<string> {
  const id = context.id('gopp', suffix);
  await db.query(
    `INSERT INTO opportunities
       (id, user_id, prospect_id, state, need_detected, recommended_service, offer_rationale,
        offer_estimated_value_paise, offer_fit)
     VALUES ($1, $2, $3, 'NEW', $4, $5, $6, $7, $8)
     ON CONFLICT (id) DO NOTHING`,
    [
      id,
      userId,
      prospectId,
      options.needDetected,
      options.recommendedService ?? null,
      options.offerRationale ?? null,
      options.offerEstimatedValuePaise ?? null,
      options.offerFit ?? null,
    ],
  );
  tracker.opportunityIds.push(id);
  return id;
}

export async function seedFeedback(
  db: Queryable,
  context: TestRunContext,
  tracker: GatesTracker,
  userId: string,
  opportunityId: string,
  suffix: string | number,
  useful: boolean,
): Promise<string> {
  const id = context.id('gfeedback', suffix);
  await db.query(
    `INSERT INTO feedback (id, user_id, opportunity_id, useful, reason)
     VALUES ($1, $2, $3, $4, 'fixture reason')
     ON CONFLICT (id) DO NOTHING`,
    [id, userId, opportunityId, useful],
  );
  tracker.feedbackIds.push(id);
  return id;
}
