import { randomUUID } from 'node:crypto';

import type { ProspectStatus, StoredCompany, StoredProspect } from './types';

// Global Entity Architecture — Entity resolver + atomic transaction
// wrapper (CF-GLOBAL-ENTITY-ARCH-PO-DEC-001 D1/D8/D12/D13/D21/D22;
// CF-GLOBAL-ENTITY-ARCH-OQ-PO-DEC-001 OQ-1/OQ-2/OQ-3/OQ-8;
// Q5_CLOSURE_ENGINEERING_READINESS §4.1/§4.2).
// -----------------------------------------------------------------------
// resolveAndPersistCandidate() is the ONE write path for a discovery
// candidate once normalized: resolver read -> identity_evidence write(s)
// -> discovery_events insert -> Company upsert (now carrying entity_id)
// -> Prospect upsert, all inside ONE Postgres transaction on one pinned
// connection — mirroring @acos/core-subscriptions' leadUnlockRepository.ts
// `revealAtomically` idiom exactly (BEGIN/sequential statements on one
// client/COMMIT, ROLLBACK in catch, client.release() in finally).
//
// Resolver outcome set is exactly three, per OQ-1/OQ-2/OQ-3 — never a
// fifth "provisional"/"uncertain" state:
//   NO_MATCH_NEW_ENTITY   -- no Category 1-3 evidence resolves (D14).
//   DEFINITE_MATCH        -- Place ID alone (OQ-1), or two anchors from
//                            DIFFERENT categories agreeing on one Entity
//                            (OQ-2). Two same-category observations
//                            never corroborate, regardless of count.
//   CONFLICT_NEW_ENTITY   -- strong evidence points at two different
//                            existing Entities: both are marked
//                            CONFLICTED (D13/D18), and the triggering
//                            discovery becomes a THIRD, independent new
//                            Entity (OQ-3) -- never provisionally
//                            attached, never NULL.
// Category 4 (WEAK_SUPPORTING) evidence is never passed to this module
// at all by its only caller (service.ts) -- D12 is enforced by callers
// never supplying it, reinforced structurally by migration 0051 having
// no uniqueness constraint for that category.
// -----------------------------------------------------------------------

export interface SqlClient {
  query(sql: string, params?: readonly unknown[]): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

export interface SqlPool extends SqlClient {
  connect(): Promise<SqlClient & { release: () => void }>;
}

export type IdentityCategory = 'PROVIDER_STABLE_ID' | 'OFFICIAL_DIGITAL_IDENTITY' | 'VERIFIED_CONTACT';

/** One piece of Category 1-3 identity evidence available for a candidate. Never Category 4 (D12). */
export interface IdentityAnchorInput {
  category: IdentityCategory;
  evidenceType: string;
  normalizedValue: string;
  sourceProvider: string;
  verified: boolean;
}

export type EntityResolutionOutcome = 'DEFINITE_MATCH' | 'NO_MATCH_NEW_ENTITY' | 'CONFLICT_NEW_ENTITY';

export interface ResolveAndPersistCandidateInput {
  userId: string;
  searchId: string;
  name: string;
  /** Null for a website-less candidate (C-1) — never a guessed value. */
  normalizedDomain: string | null;
  /** Category 1-3 evidence only; may be empty (D14: unresolved -> new Entity). */
  anchors: readonly IdentityAnchorInput[];
  provider: string;
  actualQuery: string;
}

export interface ResolveAndPersistCandidateResult {
  company: StoredCompany;
  prospect: StoredProspect;
  entityId: string;
  resolution: EntityResolutionOutcome;
}

export type DiscoveryAttemptFailureReason = 'MISSING_NAME' | 'MISSING_WEBSITE_UNPARSEABLE';

export interface RecordFailedAttemptInput {
  searchId: string;
  provider: string;
  actualQuery: string;
  failureReason: DiscoveryAttemptFailureReason;
}

/**
 * D15/OQ-9/Q6: the only two statuses the existing `GOOGLE_PLACES_STATUS`
 * producer (`detectPlacesEntityReality()`) ever positively observes —
 * matches `entity_status_evidence`'s CHECK constraint (migration 0056),
 * which deliberately excludes `'ACTIVE'`/`'UNKNOWN'` from storage (both
 * are read-time-derived outcomes only, never written).
 */
export type EntityStatusObservation = 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY';

export interface RecordStatusObservationInput {
  entityId: string;
  status: EntityStatusObservation;
  source: string;
}

export interface EntityRepository {
  /**
   * Resolver read + Entity/evidence write(s) + DiscoveryEvent + Company
   * (carrying entity_id) + Prospect, atomically, for ONE candidate.
   * Idempotent: a retried/repeated discovery for the same
   * (user, domain) or the same strong identity anchor does not create
   * duplicate Company/Entity rows (DiscoveryEvent duplicates ARE
   * sanctioned, D21).
   */
  resolveAndPersistCandidate(
    input: ResolveAndPersistCandidateInput,
    now: Date,
  ): Promise<ResolveAndPersistCandidateResult>;

  /**
   * OQ-8/Q3: a provider result that failed normalization (no Entity is
   * ever created for it) — logged to the separate pre-Entity
   * `discovery_attempts` table, never `discovery_events`.
   */
  recordFailedAttempt(input: RecordFailedAttemptInput, now: Date): Promise<void>;

  /**
   * D15/OQ-9/Q6: append-only Entity Status observation, written
   * alongside (not instead of) the existing per-user `research_signals`
   * `GOOGLE_PLACES_STATUS` write that already exists for this same
   * observation (`detectPlacesEntityReality()`'s caller is responsible
   * for calling both). Never called with a NULL `entityId` — the
   * caller's own historical-safety fallback (skip this write entirely
   * when `company.entityId` is null) happens before this is invoked,
   * exactly as Q6's contract specifies.
   */
  recordStatusObservation(input: RecordStatusObservationInput, now: Date): Promise<void>;

  /** Every append-only status observation for this Entity, for OQ-9's derivation (deriveEntityStatus below). */
  getStatusObservations(entityId: string): Promise<readonly StatusObservationRecord[]>;

  /**
   * C-5/C-7: the earliest `discovery_events` row for this (search, entity)
   * pair — the structured provenance ("found through X for query Y, at
   * time Z") the "Why found" UI derives from. Pure read, no write; D21
   * sanctions duplicate rows for the same pair, so this picks the first
   * (the original discovery), never the latest. `null` when no row
   * exists (e.g. a historical Prospect/Company predating Global Entity
   * linking, where `entityId` is itself `null`) — callers must not
   * fabricate a substitute.
   */
  getDiscoveryEvent(searchId: string, entityId: string): Promise<DiscoveryEventRecord | null>;
}

export interface StatusObservationRecord {
  status: EntityStatusObservation;
  observedAt: Date;
}

export interface DiscoveryEventRecord {
  provider: string;
  query: string;
  discoveredAt: Date;
}

export type DerivedEntityStatus = 'ACTIVE' | EntityStatusObservation | 'UNKNOWN';

/**
 * OQ-9's exact, PO-decided precedence:
 *   1. Consider only observations within the applicable freshness window.
 *   2. Among fresh observations, the most recent observedAt wins.
 *   3. No fresh observation -> UNKNOWN.
 *   4. ACTIVE is never inferred merely from the absence of a negative
 *      observation (and, structurally, cannot be — the stored enum has
 *      no 'ACTIVE' value at all; this function's 'ACTIVE' branch of
 *      {@link DerivedEntityStatus} exists only for a hypothetical future
 *      positive-ACTIVE producer, never reachable from current data).
 *   5. Stale observations never determine current status.
 *
 * `isFresh` is supplied by the caller so this function embeds no
 * freshness policy of its own — reuses the existing SIGNAL_FRESHNESS/
 * SIGNAL_SPECIFIC_FRESHNESS governance (GOOGLE_PLACES_STATUS's existing
 * 30-day window, @acos/core-research's `evaluateSignalFreshness`) rather
 * than introducing a new one.
 */
export function deriveEntityStatus(
  observations: readonly StatusObservationRecord[],
  isFresh: (observedAt: Date) => boolean,
): DerivedEntityStatus {
  const fresh = observations.filter((o) => isFresh(o.observedAt));
  if (fresh.length === 0) return 'UNKNOWN';
  return fresh.reduce((latest, candidate) =>
    candidate.observedAt.getTime() > latest.observedAt.getTime() ? candidate : latest,
  ).status;
}

/** The atomic transaction failed for a reason other than the sanctioned unique-violation retry case. */
export class EntityResolutionPersistenceError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = 'EntityResolutionPersistenceError';
    if (options?.cause !== undefined) this.cause = options.cause;
  }
}

interface CompanyRow {
  id: string;
  user_id: string;
  name: string;
  normalized_domain: string | null;
  entity_id: string | null;
  created_at: Date;
}

function mapCompanyRow(row: CompanyRow): StoredCompany {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    normalizedDomain: row.normalized_domain,
    entityId: row.entity_id,
    createdAt: new Date(row.created_at),
  };
}

interface ProspectRow {
  id: string;
  user_id: string;
  search_id: string;
  company_id: string;
  status: ProspectStatus;
  created_at: Date;
}

function mapProspectRow(row: ProspectRow): StoredProspect {
  return {
    id: row.id,
    userId: row.user_id,
    searchId: row.search_id,
    companyId: row.company_id,
    status: row.status,
    createdAt: new Date(row.created_at),
  };
}

interface IdentityEvidenceMatchRow {
  entity_id: string;
  category: IdentityCategory;
}

type ResolutionDecision =
  | { kind: 'NO_MATCH_NEW_ENTITY' }
  | { kind: 'DEFINITE_MATCH'; entityId: string }
  | { kind: 'CONFLICT'; conflictingEntityIds: readonly string[] };

/**
 * OQ-1/OQ-2/OQ-3's resolver, operating against the current transaction's
 * identity_evidence state. Pure read — no write happens here.
 */
async function resolveEntity(
  client: SqlClient,
  anchors: readonly IdentityAnchorInput[],
): Promise<ResolutionDecision> {
  if (anchors.length === 0) return { kind: 'NO_MATCH_NEW_ENTITY' };

  const matches: IdentityEvidenceMatchRow[] = [];
  for (const anchor of anchors) {
    const { rows } = await client.query(
      `SELECT entity_id, category FROM identity_evidence
        WHERE category = $1 AND source_provider = $2 AND normalized_value = $3`,
      [anchor.category, anchor.sourceProvider, anchor.normalizedValue],
    );
    for (const row of rows as IdentityEvidenceMatchRow[]) matches.push(row);
  }
  if (matches.length === 0) return { kind: 'NO_MATCH_NEW_ENTITY' };

  // OQ-1: Place ID alone resolves.
  const aloneResolved = new Set(
    matches.filter((m) => m.category === 'PROVIDER_STABLE_ID').map((m) => m.entity_id),
  );

  // OQ-2: two anchors from DIFFERENT categories agreeing on the same
  // Entity. A Set per entity means two same-category matches never
  // inflate the count — corroboration requires >= 2 DISTINCT categories.
  const categoriesByEntity = new Map<string, Set<IdentityCategory>>();
  for (const m of matches) {
    const set = categoriesByEntity.get(m.entity_id) ?? new Set<IdentityCategory>();
    set.add(m.category);
    categoriesByEntity.set(m.entity_id, set);
  }
  const corroborated = new Set(
    [...categoriesByEntity.entries()].filter(([, cats]) => cats.size >= 2).map(([entityId]) => entityId),
  );

  const resolvedEntities = new Set<string>([...aloneResolved, ...corroborated]);

  if (resolvedEntities.size === 0) return { kind: 'NO_MATCH_NEW_ENTITY' };
  if (resolvedEntities.size === 1) {
    return { kind: 'DEFINITE_MATCH', entityId: [...resolvedEntities][0]! };
  }
  return { kind: 'CONFLICT', conflictingEntityIds: [...resolvedEntities] };
}

async function insertAnchors(
  client: SqlClient,
  entityId: string,
  anchors: readonly IdentityAnchorInput[],
  now: Date,
): Promise<void> {
  for (const anchor of anchors) {
    // ON CONFLICT DO NOTHING: idempotent re-discovery of the same anchor
    // (e.g. a repeat search finding the same Place ID) never duplicates
    // or errors — the partial unique indexes (migration 0051) are the
    // arbiter.
    await client.query(
      `INSERT INTO identity_evidence
         (id, entity_id, category, evidence_type, normalized_value, source_provider, verified, observed_at, conflict_state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'NONE')
       ON CONFLICT DO NOTHING`,
      [
        randomUUID(),
        entityId,
        anchor.category,
        anchor.evidenceType,
        anchor.normalizedValue,
        anchor.sourceProvider,
        anchor.verified,
        now,
      ],
    );
  }
}

const UNIQUE_VIOLATION = '23505';

export function createPgEntityRepository(pool: SqlPool): EntityRepository {
  return {
    async recordFailedAttempt(input, now) {
      await pool.query(
        `INSERT INTO discovery_attempts (id, search_id, provider, actual_query, failure_reason, attempted_at)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [randomUUID(), input.searchId, input.provider, input.actualQuery, input.failureReason, now],
      );
    },

    async recordStatusObservation(input, now) {
      await pool.query(
        `INSERT INTO entity_status_evidence (id, entity_id, status, source, observed_at)
         VALUES ($1, $2, $3, $4, $5)`,
        [randomUUID(), input.entityId, input.status, input.source, now],
      );
    },

    async getStatusObservations(entityId) {
      const { rows } = await pool.query(
        `SELECT status, observed_at FROM entity_status_evidence WHERE entity_id = $1 ORDER BY observed_at DESC`,
        [entityId],
      );
      return (rows as { status: EntityStatusObservation; observed_at: Date }[]).map((row) => ({
        status: row.status,
        observedAt: new Date(row.observed_at),
      }));
    },

    async getDiscoveryEvent(searchId, entityId) {
      const { rows } = await pool.query(
        `SELECT provider, actual_query, discovered_at FROM discovery_events
          WHERE search_id = $1 AND entity_id = $2
          ORDER BY discovered_at ASC LIMIT 1`,
        [searchId, entityId],
      );
      const row = rows[0] as { provider: string; actual_query: string; discovered_at: Date } | undefined;
      if (!row) return null;
      return { provider: row.provider, query: row.actual_query, discoveredAt: new Date(row.discovered_at) };
    },

    async resolveAndPersistCandidate(input, now) {
      // Q2's sanctioned race: two concurrent transactions resolving the
      // same Place ID can both miss each other's uncommitted read and
      // both attempt to insert a new identity_evidence row for it. The
      // partial unique index makes the SECOND commit fail with a
      // unique-violation — retried once here as "re-read and treat as
      // DEFINITE_MATCH against the now-committed winner," never as a
      // silent duplicate Entity.
      const MAX_ATTEMPTS = 2;
      let lastError: unknown;

      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');

          const resolution = await resolveEntity(client, input.anchors);

          let entityId: string;
          let outcome: EntityResolutionOutcome;

          if (resolution.kind === 'DEFINITE_MATCH') {
            entityId = resolution.entityId;
            outcome = 'DEFINITE_MATCH';
            await insertAnchors(client, entityId, input.anchors, now);
          } else if (resolution.kind === 'CONFLICT') {
            // OQ-3: mark the two (or more) existing conflicting Entities'
            // matching evidence CONFLICTED; the triggering discovery
            // becomes a new, third, independent Entity — never
            // provisionally attached to either.
            await client.query(
              `UPDATE identity_evidence
                  SET conflict_state = 'CONFLICTED'
                WHERE entity_id = ANY($1::text[]) AND conflict_state = 'NONE'`,
              [resolution.conflictingEntityIds],
            );
            entityId = randomUUID();
            outcome = 'CONFLICT_NEW_ENTITY';
            await client.query(`INSERT INTO entities (id, created_at) VALUES ($1, $2)`, [entityId, now]);
            await insertAnchors(client, entityId, input.anchors, now);
          } else {
            entityId = randomUUID();
            outcome = 'NO_MATCH_NEW_ENTITY';
            await client.query(`INSERT INTO entities (id, created_at) VALUES ($1, $2)`, [entityId, now]);
            await insertAnchors(client, entityId, input.anchors, now);
          }

          await client.query(
            `INSERT INTO discovery_events (id, entity_id, search_id, provider, actual_query, discovered_at)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [randomUUID(), entityId, input.searchId, input.provider, input.actualQuery, now],
          );

          const companyResult = await client.query(
            `INSERT INTO companies (id, user_id, name, normalized_domain, entity_id, created_at)
             VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5)
             ON CONFLICT (user_id, normalized_domain) WHERE normalized_domain IS NOT NULL
             DO UPDATE SET name = companies.name
             RETURNING id, user_id, name, normalized_domain, entity_id, created_at`,
            [input.userId, input.name, input.normalizedDomain, entityId, now],
          );
          const company = mapCompanyRow(companyResult.rows[0] as CompanyRow);

          const prospectResult = await client.query(
            `INSERT INTO prospects (id, user_id, search_id, company_id, status, created_at)
             VALUES (gen_random_uuid()::text, $1, $2, $3, 'DISCOVERED', $4)
             ON CONFLICT (search_id, company_id)
             DO UPDATE SET status = prospects.status
             RETURNING id, user_id, search_id, company_id, status, created_at`,
            [input.userId, input.searchId, company.id, now],
          );
          const prospect = mapProspectRow(prospectResult.rows[0] as ProspectRow);

          await client.query('COMMIT');
          return { company, prospect, entityId, resolution: outcome };
        } catch (error) {
          await client.query('ROLLBACK').catch(() => undefined);
          lastError = error;
          const code = (error as { code?: string } | undefined)?.code;
          if (code === UNIQUE_VIOLATION && attempt < MAX_ATTEMPTS - 1) {
            continue; // retry: re-read now-committed evidence from the winner
          }
          throw new EntityResolutionPersistenceError('entity resolution transaction failed', {
            cause: error,
          });
        } finally {
          client.release();
        }
      }
      // Unreachable in practice (the loop always returns or throws), kept
      // only to satisfy the compiler's control-flow analysis.
      throw new EntityResolutionPersistenceError('entity resolution transaction failed', {
        cause: lastError,
      });
    },
  };
}
