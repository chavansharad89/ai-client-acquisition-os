-- 0008_rate_limit_counters
-- =======================================================================
-- Shared state for the create-order rate limiter.
--
-- WHY A TABLE AND NOT REDIS: a distributed limiter needs state every web
-- replica can see. This system already has exactly one such thing, and it
-- is this database. Introducing Redis for a counter that fits in one row
-- would add a service to deploy, monitor and secure — and a failure mode
-- ("Redis is down: is checkout open or closed?") that nobody has decided
-- the answer to.
--
-- NO PERSONAL DATA. bucket_key is `<policy>:<sha256(identifier)>`, where
-- the identifier is an IP or an email. The counter does not need to know
-- who anyone is, only whether it has seen them in this window, and a
-- digest answers that exactly as well. A dump of this table discloses
-- nothing about anybody.
-- =======================================================================

CREATE TABLE "rate_limit_counters" (
    -- `<policy>:<sha256 hex>`. 64 hex chars plus a short policy name.
    "bucket_key"   TEXT NOT NULL,
    -- Start of the fixed window. Part of the key, so a new window is a
    -- new row rather than an update that has to reset a counter.
    "window_start" TIMESTAMP(3) NOT NULL,
    "hits"         INTEGER NOT NULL DEFAULT 0,
    "expires_at"   TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limit_counters_pkey" PRIMARY KEY ("bucket_key", "window_start"),
    CONSTRAINT "rate_limit_counters_hits_positive" CHECK ("hits" >= 0),
    CONSTRAINT "rate_limit_counters_window_before_expiry"
        CHECK ("expires_at" > "window_start"),
    -- Bounds what a caller can cause to be stored. The application only
    -- ever writes a fixed-length digest; this makes that a property of
    -- the table rather than a habit of one code path.
    CONSTRAINT "rate_limit_counters_key_length" CHECK (length("bucket_key") <= 128)
);

-- The sweep predicate. Without it, deleting expired windows is a scan.
CREATE INDEX "rate_limit_counters_expires_at_idx" ON "rate_limit_counters"("expires_at");
