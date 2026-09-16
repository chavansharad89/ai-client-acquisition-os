-- 0002_concurrent_unique_indexes
-- =======================================================================
-- READ THIS BEFORE RUNNING ANYTHING.
--
-- This file is for FRESH / EMPTY databases only (local dev, CI, a new
-- environment). It uses plain CREATE UNIQUE INDEX, which takes an
-- ACCESS EXCLUSIVE lock on the table for the duration of the build. On an
-- empty table that is microseconds. On a production table with traffic it
-- would block every read and write until the build finished — which is
-- precisely the downtime this work exists to avoid.
--
-- FOR AN EXISTING DATABASE WITH DATA, DO NOT APPLY THIS FILE.
-- Run the operational script instead:
--
--     pnpm db:indexes:deploy
--
-- then reconcile Prisma's history without executing the SQL:
--
--     pnpm --filter @acos/db exec prisma migrate resolve \
--       --applied 0002_concurrent_unique_indexes
--
-- WHY THE SPLIT: Postgres refuses CREATE INDEX CONCURRENTLY inside a
-- transaction block, and Prisma 5.22.0 wraps each migration file in one.
-- No transaction-disabling directive was found in the installed Prisma
-- 5.22.0 CLI (searched; the native schema-engine binary is not present in
-- this environment to inspect further), so this system does not rely on
-- one existing. The concurrent build is owned by the script; Prisma is
-- only told about the outcome afterwards.
-- =======================================================================

-- WHY THIS IS A DO BLOCK AND NOT FOUR CREATE STATEMENTS
-- -----------------------------------------------------------------------
-- The obvious spelling is `CREATE UNIQUE INDEX IF NOT EXISTS`, and it is
-- wrong here. IF NOT EXISTS matches on the index NAME. It does not look at
-- whether the thing wearing that name is valid, is unique, covers the
-- column we meant, or is partial.
--
-- That matters because of how a failed concurrent build ends. When
-- CREATE UNIQUE INDEX CONCURRENTLY hits a duplicate it does not roll back
-- to nothing: it leaves an index with indisvalid = false. The planner
-- ignores it, every write still pays to maintain it, and it enforces
-- NOTHING. Run IF NOT EXISTS against that database and the statement is a
-- silent no-op, the migration reports success, Prisma records 0002 as
-- applied, and from then on the system believes a uniqueness constraint
-- that is not being enforced. The next duplicate payment is accepted.
--
-- So existence is not the question. The catalog is. Each target below is
-- resolved through pg_class and pg_index and then classified:
--
--   absent                     -> create it
--   present, valid, correct    -> accept it, leave it exactly as it is
--   present but INVALID        -> abort the migration, loudly
--   present but wrong shape    -> abort the migration, loudly
--
-- NOTHING IS EVER DROPPED HERE. An INVALID or unexpected index is a
-- situation a person has to look at: it may be mid-rebuild, it may be
-- someone else's index that happens to share a name, and dropping either
-- one automatically turns a recoverable state into data loss. The
-- exception message carries the exact command to run instead.
-- -----------------------------------------------------------------------

DO $index_guard$
DECLARE
  target  RECORD;
  idx     RECORD;
  relkind "char";
BEGIN
  FOR target IN
    SELECT *
      FROM (VALUES
        -- These three already exist from 0001_init on a fresh database;
        -- the guard below accepts them rather than rebuilding them.
        ('payments_razorpay_payment_id_key',     'payments',       'razorpay_payment_id'),
        ('webhook_events_razorpay_event_id_key', 'webhook_events', 'razorpay_event_id'),
        ('meta_events_meta_event_id_key',        'meta_events',    'meta_event_id'),
        -- NEW in this migration. meta_events.order_id was previously a
        -- plain index. Making it unique means an order may carry at most
        -- ONE meta event for all time — correct while Purchase is the only
        -- event, and a constraint to revisit (narrow it to
        -- (order_id, event_name)) if the catalogue grows.
        ('meta_events_order_id_key',             'meta_events',    'order_id')
      ) AS t(index_name, table_name, column_name)
  LOOP
    -- Resolve the NAME first, in pg_class, because a name can be taken by
    -- something that is not an index at all. Joining straight to pg_index
    -- would report "absent" for a table called payments_razorpay_payment_id_key
    -- and then fail the CREATE with a confusing "relation already exists".
    SELECT c.relkind
      INTO relkind
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relname = target.index_name
       AND n.nspname = current_schema();

    -- ---- CASE 1: nothing of that name. Create it. ----
    IF NOT FOUND THEN
      EXECUTE format(
        'CREATE UNIQUE INDEX %I ON %I (%I)',
        target.index_name, target.table_name, target.column_name
      );
      RAISE NOTICE '0002: created %', target.index_name;
      CONTINUE;
    END IF;

    IF relkind NOT IN ('i', 'I') THEN
      RAISE EXCEPTION
        '0002 index guard: "%" already exists and is not an index (relkind=%). Refusing to touch it.',
        target.index_name, relkind
        USING ERRCODE = '42P17';
    END IF;

    SELECT i.indisvalid,
           i.indisready,
           i.indislive,
           i.indisunique,
           i.indnatts,
           i.indnkeyatts,
           i.indpred IS NOT NULL AS is_partial,
           tbl.relname            AS table_name,
           (SELECT array_agg(a.attname ORDER BY k.ord)
              FROM unnest(i.indkey) WITH ORDINALITY AS k(attnum, ord)
              JOIN pg_attribute a
                ON a.attrelid = i.indrelid AND a.attnum = k.attnum) AS columns
      INTO idx
      FROM pg_class c
      JOIN pg_namespace n   ON n.oid = c.relnamespace
      JOIN pg_index i       ON i.indexrelid = c.oid
      JOIN pg_class tbl     ON tbl.oid = i.indrelid
     WHERE c.relname = target.index_name
       AND n.nspname = current_schema();

    -- ---- CASE 3: it exists but is not usable. ----
    -- indisvalid=false is the signature of a failed concurrent build.
    -- indisready and indislive are checked separately and NOT inferred
    -- from indisvalid: an index can be valid-but-not-ready mid-build, and
    -- treating the three as one flag is exactly how a half-built index
    -- gets accepted.
    IF NOT idx.indisvalid OR NOT idx.indisready OR NOT idx.indislive THEN
      RAISE EXCEPTION
        '0002 index guard: "%" exists but is not usable (indisvalid=%, indisready=%, indislive=%). '
        'This is a failed CREATE INDEX CONCURRENTLY. It enforces nothing and still costs every write. '
        'A person must decide: DROP INDEX CONCURRENTLY "%"; and re-run. This migration will not drop it.',
        target.index_name, idx.indisvalid, idx.indisready, idx.indislive, target.index_name
        USING ERRCODE = '42P17';
    END IF;

    -- ---- CASE 4: it exists and is usable, but is not what we meant. ----
    IF idx.table_name <> target.table_name THEN
      RAISE EXCEPTION
        '0002 index guard: "%" is on table "%", expected "%". Refusing to drop somebody else''s index.',
        target.index_name, idx.table_name, target.table_name
        USING ERRCODE = '42P17';
    END IF;

    IF NOT idx.indisunique THEN
      RAISE EXCEPTION
        '0002 index guard: "%" exists but is NOT UNIQUE, so it enforces none of the constraint '
        'this migration exists to add.',
        target.index_name
        USING ERRCODE = '42P17';
    END IF;

    IF idx.is_partial THEN
      RAISE EXCEPTION
        '0002 index guard: "%" is a PARTIAL index (has a WHERE clause). It enforces uniqueness only '
        'over the rows it covers, which is not the constraint this migration promises.',
        target.index_name
        USING ERRCODE = '42P17';
    END IF;

    IF idx.indnatts <> 1 OR idx.indnkeyatts <> 1 THEN
      RAISE EXCEPTION
        '0002 index guard: "%" covers % column(s) (% key column(s)), expected exactly 1. '
        'A composite index enforces a weaker constraint than a single-column one.',
        target.index_name, idx.indnatts, idx.indnkeyatts
        USING ERRCODE = '42P17';
    END IF;

    IF idx.columns[1] IS DISTINCT FROM target.column_name THEN
      RAISE EXCEPTION
        '0002 index guard: "%" covers column "%", expected "%".',
        target.index_name, idx.columns[1], target.column_name
        USING ERRCODE = '42P17';
    END IF;

    -- ---- CASE 2: correct and usable. Accept it untouched. ----
    RAISE NOTICE '0002: accepted existing % (valid, unique, single-column, non-partial)',
      target.index_name;
  END LOOP;
END
$index_guard$;
