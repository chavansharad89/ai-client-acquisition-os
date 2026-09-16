-- 0010_meta_events_index_rationalisation
-- =======================================================================
-- Two changes to meta_events indexing, both measured against real plans
-- on a 50,200-row table before being written. Neither is a guess.
--
--
-- CHANGE 1: meta_events_order_id_idx is redundant. Drop it.
--
-- 0001_init created a PLAIN index on (order_id); 0002 added a UNIQUE one
-- on the same column. Compared in pg_index they are identical in every
-- attribute that determines what a btree read can serve:
--
--     access method   btree      = btree
--     indkey          3          = 3           (attnum 3 = order_id)
--     indnatts        1          = 1
--     indnkeyatts     1          = 1
--     indclass        3126       = 3126        (same operator class)
--     indcollation    100        = 100
--     indoption       0          = 0           (ASC, NULLS LAST)
--     indpred         null       = null        (neither partial)
--     indexprs        null       = null        (neither an expression)
--
-- The ONLY difference is indisunique. Uniqueness is a constraint applied
-- on WRITE; it does not change which reads the index can satisfy. So
-- every plan available to the plain index is available to the unique one
-- at the same cost — confirmed by EXPLAIN, which produced an identical
-- `Index Only Scan ... (cost=0.29..8.31 rows=1)` with each in turn.
--
-- The readers that matter, all still served by the unique index:
--   * 0003's meta_events_require_capture and 0009's
--     meta_events_keeps_capture, which look up by order_id;
--   * reconciliation's GROUP BY order_id;
--   * the meta_events_order_id_fkey check, which needs an index on the
--     REFERENCING column and gets one.
--
-- Keeping both costs an extra 1.9 MB at this row count, plus a second
-- btree insert on every write and a second index for VACUUM to walk —
-- for no query that the remaining index does not already answer.
--
--
-- CHANGE 2: the retry index should be partial, and should carry created_at.
--
-- The claim query is:
--
--     WHERE status = 'PENDING' AND next_attempt_at <= $1
--     ORDER BY next_attempt_at, created_at
--     LIMIT $2
--
-- (status, next_attempt_at) indexes EVERY row. SENT is terminal and
-- accumulates forever, so that index grows without bound while the set
-- of rows the query actually wants does not. At 50,000 SENT / 200
-- PENDING it was 2,784 kB; the partial equivalent is 16 kB, and the gap
-- widens every time an event is delivered.
--
-- The column list changes too. With `status = 'PENDING'` in the
-- predicate, status is constant throughout the index and earns no place
-- in the key — while created_at, the ORDER BY tiebreaker, was missing
-- and forced an Incremental Sort on every poll. Measured:
--
--     before   Index Scan + Incremental Sort   10 buffers
--     after    Index Scan, no sort node         2 buffers
--
-- No other query loses an access path. releaseExpiredLeases filters
-- status = 'PROCESSING' and was verified to use
-- meta_events_lease_expires_at_idx both before and after.
--
--
-- ZERO DOWNTIME
--
-- This file uses plain CREATE/DROP INDEX and is for FRESH databases
-- (local, CI, a new environment), exactly like 0002_concurrent_unique_indexes.
-- On a live table both statements take an ACCESS EXCLUSIVE lock.
--
-- FOR AN EXISTING DATABASE WITH TRAFFIC, run the concurrent form by hand
-- and then tell Prisma the outcome — the same split 0002 established,
-- because CREATE/DROP INDEX CONCURRENTLY cannot run inside the
-- transaction Prisma wraps each migration in:
--
--     CREATE INDEX CONCURRENTLY meta_events_due_idx
--         ON meta_events (next_attempt_at, created_at)
--         WHERE status = 'PENDING';
--     -- verify indisvalid before continuing:
--     SELECT indisvalid FROM pg_index i JOIN pg_class c ON c.oid = i.indexrelid
--      WHERE c.relname = 'meta_events_due_idx';
--     DROP INDEX CONCURRENTLY meta_events_order_id_idx;
--     DROP INDEX CONCURRENTLY meta_events_status_next_attempt_at_idx;
--
--     pnpm --filter @acos/db exec prisma migrate resolve \
--       --applied 0010_meta_events_index_rationalisation
--
-- Order matters: the replacement is built and verified BEFORE anything
-- is dropped, so there is no window in which the claim query has no
-- index to use.
-- =======================================================================


-- ---- The replacement, first ------------------------------------------

CREATE INDEX IF NOT EXISTS "meta_events_due_idx"
    ON "meta_events" ("next_attempt_at", "created_at")
    WHERE "status" = 'PENDING';


-- ---- Then, and only then, the drops ----------------------------------
--
-- NOTHING IS DROPPED ON TRUST. Each DROP is guarded by a check that its
-- replacement genuinely exists and is usable. An index that is present
-- but INVALID — the signature of a failed concurrent build — enforces
-- nothing and is ignored by the planner, so dropping a working index
-- because a broken one wears the right name is exactly the mistake this
-- block exists to prevent.

DO $rationalise$
DECLARE
  ok boolean;
BEGIN
  -- --- Guard 1: the UNIQUE order_id index must be usable and equivalent.
  SELECT i.indisvalid AND i.indisready AND i.indislive
         AND i.indisunique
         AND i.indpred IS NULL
         AND i.indexprs IS NULL
         AND i.indnkeyatts = 1
         AND tbl.relname = 'meta_events'
         AND a.attname = 'order_id'
    INTO ok
    FROM pg_class c
    JOIN pg_namespace n   ON n.oid = c.relnamespace
    JOIN pg_index i       ON i.indexrelid = c.oid
    JOIN pg_class tbl     ON tbl.oid = i.indrelid
    JOIN pg_attribute a   ON a.attrelid = i.indrelid AND a.attnum = i.indkey[0]
   WHERE c.relname = 'meta_events_order_id_key'
     AND n.nspname = current_schema();

  IF NOT FOUND OR NOT ok THEN
    RAISE EXCEPTION
      'meta_events_order_id_key is missing, invalid, or not a single-column unique index on '
      'meta_events(order_id). Refusing to drop meta_events_order_id_idx — dropping the working '
      'index while its replacement is broken would leave every order_id lookup, both capture '
      'triggers and the foreign-key check on a sequential scan.'
      USING ERRCODE = '42P17';
  END IF;

  EXECUTE 'DROP INDEX IF EXISTS "meta_events_order_id_idx"';
  RAISE NOTICE '0010: dropped meta_events_order_id_idx (superseded by meta_events_order_id_key)';

  -- --- Guard 2: the partial replacement must be usable.
  SELECT i.indisvalid AND i.indisready AND i.indislive
         AND i.indpred IS NOT NULL
    INTO ok
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_index i     ON i.indexrelid = c.oid
   WHERE c.relname = 'meta_events_due_idx'
     AND n.nspname = current_schema();

  IF NOT FOUND OR NOT ok THEN
    RAISE EXCEPTION
      'meta_events_due_idx is missing, invalid, or not partial. Refusing to drop '
      'meta_events_status_next_attempt_at_idx — the worker''s claim query would fall back to '
      'a sequential scan of every delivered event on every poll.'
      USING ERRCODE = '42P17';
  END IF;

  EXECUTE 'DROP INDEX IF EXISTS "meta_events_status_next_attempt_at_idx"';
  RAISE NOTICE '0010: dropped meta_events_status_next_attempt_at_idx (superseded by meta_events_due_idx)';
END
$rationalise$;
