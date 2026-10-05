-- 0035_gate_evaluation_snapshots
-- =======================================================================
-- Gate evidence-bundle persistence (ED-13), authorized under
-- CLIENT-FINDER-PDEF-4-IMPLEMENTATION-AUTHORIZATION-PO-DEC-001.
--
-- One row per (gate, window, computation_path): a reproducible record of
-- what a gate's population/result was, computed by which of the two
-- independent paths (core-launch-gates's own "PRODUCTION" computation, or
-- core-launch-gates-validation's independently-written "VALIDATION"
-- recomputation, ED-12). Re-running a closed window's computation is
-- idempotent via the unique constraint below rather than piling up
-- duplicate rows.
--
-- gate is an open TEXT, not an enum, deliberately: the six gate ids
-- (PCG-1, PCG-2, PCG-3A, PCG-3B, PCG-4, PCG-5, PCG-6 — note 3A/3B are
-- tracked separately per governance) are an application-level vocabulary
-- that the DB does not need to gatekeep for an internal evidence table.
--
-- Additive only.
-- =======================================================================

CREATE TABLE "gate_evaluation_snapshots" (
    "id"               TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "gate"             TEXT NOT NULL,
    "window_start"     TIMESTAMP(3) NOT NULL,
    "window_end"       TIMESTAMP(3) NOT NULL,
    "computed_at"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "computation_path" TEXT NOT NULL,
    "result"           JSONB NOT NULL,
    "created_at"       TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gate_evaluation_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "gate_evaluation_snapshots_computation_path_check"
        CHECK ("computation_path" IN ('PRODUCTION', 'VALIDATION'))
);

CREATE UNIQUE INDEX "gate_evaluation_snapshots_unique_computation"
    ON "gate_evaluation_snapshots"("gate", "window_start", "window_end", "computation_path");
