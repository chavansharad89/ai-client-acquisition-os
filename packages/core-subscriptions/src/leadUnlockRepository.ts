import { randomUUID } from 'node:crypto';

import type { ExtractedContactValue } from '@acos/core-research';

import { LeadUnlockPersistenceError } from './errors';
import type { LeadUnlock, LeadUnlockContact } from './types';

// lead_unlocks / lead_unlock_contacts (migrations 0041, 0042).
// -----------------------------------------------------------------------
// `revealAtomically` is the ONE write path for an unlock: it inserts the
// lead_unlocks row and every lead_unlock_contacts row for it inside a
// single transaction on one pinned connection, mirroring
// @acos/core-payments' webhookPgStore.ts BEGIN/COMMIT/ROLLBACK shape.
// `UNIQUE(user_id, opportunity_id)` on lead_unlocks is the idempotency
// anchor (Q-UNLOCK-1): a race between two concurrent first-time unlocks,
// or a true duplicate request, is resolved by `ON CONFLICT DO NOTHING`
// plus a re-read of the WINNING row -- the same self-heal-via-reread
// idiom @acos/core-payments' createOrder.ts uses for its own idempotency
// key, never a SELECT-then-INSERT race.
// -----------------------------------------------------------------------

export interface SqlClient {
  query(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ rows: unknown[]; rowCount: number | null }>;
}

export interface SqlPool extends SqlClient {
  connect(): Promise<SqlClient & { release: () => void }>;
}

export interface LeadUnlockRepository {
  findByUserAndOpportunity(userId: string, opportunityId: string): Promise<LeadUnlock | null>;

  /**
   * Inserts the lead_unlocks row and its lead_unlock_contacts rows
   * atomically. If (user_id, opportunity_id) already has a row, returns
   * the EXISTING row's data instead of writing a second one.
   */
  revealAtomically(
    input: {
      userId: string;
      opportunityId: string;
      subscriptionPeriodId: string;
      contacts: readonly ExtractedContactValue[];
    },
    now: Date,
  ): Promise<LeadUnlock>;
}

interface LeadUnlockRow {
  id: string;
  user_id: string;
  opportunity_id: string;
  subscription_period_id: string;
  unlocked_at: Date;
  created_at: Date;
}

async function findByUserAndOpportunity(
  sql: SqlClient,
  userId: string,
  opportunityId: string,
): Promise<LeadUnlock | null> {
  const { rows } = await sql.query(
    `SELECT id, user_id, opportunity_id, subscription_period_id, unlocked_at, created_at
       FROM lead_unlocks WHERE user_id = $1 AND opportunity_id = $2`,
    [userId, opportunityId],
  );
  const row = rows[0] as LeadUnlockRow | undefined;
  if (!row) return null;

  const { rows: contactRows } = await sql.query(
    `SELECT kind, value FROM lead_unlock_contacts WHERE lead_unlock_id = $1 ORDER BY kind, value`,
    [row.id],
  );
  const contacts = contactRows as unknown as LeadUnlockContact[];

  return {
    id: row.id,
    userId: row.user_id,
    opportunityId: row.opportunity_id,
    subscriptionPeriodId: row.subscription_period_id,
    unlockedAt: row.unlocked_at,
    createdAt: row.created_at,
    contacts,
  };
}

export function createPgLeadUnlockRepository(pool: SqlPool): LeadUnlockRepository {
  return {
    findByUserAndOpportunity: (userId, opportunityId) =>
      findByUserAndOpportunity(pool, userId, opportunityId),

    async revealAtomically(input, now) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        const id = randomUUID();
        const { rowCount } = await client.query(
          `INSERT INTO lead_unlocks (id, user_id, opportunity_id, subscription_period_id, unlocked_at)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (user_id, opportunity_id) DO NOTHING`,
          [id, input.userId, input.opportunityId, input.subscriptionPeriodId, now],
        );

        if ((rowCount ?? 0) === 0) {
          // Lost the race to another concurrent first-time unlock (or
          // this is a genuine retry) -- commit the no-op and re-read the
          // WINNING row rather than inserting a second one.
          await client.query('COMMIT');
          const existing = await findByUserAndOpportunity(client, input.userId, input.opportunityId);
          if (!existing) {
            throw new LeadUnlockPersistenceError(
              'lead_unlocks row disappeared between conflicting insert and re-read',
            );
          }
          return existing;
        }

        for (const contact of input.contacts) {
          await client.query(
            `INSERT INTO lead_unlock_contacts (id, lead_unlock_id, kind, value)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (lead_unlock_id, kind, value) DO NOTHING`,
            [randomUUID(), id, contact.kind, contact.value],
          );
        }

        await client.query('COMMIT');
        return {
          id,
          userId: input.userId,
          opportunityId: input.opportunityId,
          subscriptionPeriodId: input.subscriptionPeriodId,
          unlockedAt: now,
          createdAt: now,
          contacts: input.contacts,
        };
      } catch (error) {
        await client.query('ROLLBACK').catch(() => undefined);
        if (error instanceof LeadUnlockPersistenceError) throw error;
        throw new LeadUnlockPersistenceError('lead unlock reveal transaction failed', error);
      } finally {
        client.release();
      }
    },
  };
}
