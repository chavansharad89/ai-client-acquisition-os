# CLIENT FINDER — DEC-005 GLOBAL IDENTITY SCOPE SUPERSESSION (NARROW)

**Decision ID:** CF-DEC005-GLOBAL-IDENTITY-SCOPE-SUPERSESSION-PO-DEC-001
**Decision date:** Not stated by the Product Owner in the source instruction. This record was formalized on 2026-10-19 from an already-decided Product Owner instruction; no decision date is invented.
**Authority:** Product Owner
**Scope of this record:** Governance-only, narrow supersession. Supersedes **only** the specific clause of DEC-005 described below. Does **not** reopen, modify, or supersede any other part of DEC-005, and does **not** modify any other governance record. Does **not** authorize implementation, migration, schema, code, or test changes. Nothing has been committed or pushed as part of this record.

**Disambiguation note:** This record concerns the bare `DEC-005` label used in the Client Finder discovery schema (PRD V2.1/V2.2 §"DEC-005 — User-owned Company for MVP"; migration `packages/db/prisma/migrations/0015_discovery/migration.sql`; `packages/core-discovery/src/types.ts`, `repository.ts`, `pgRepository.ts`). It is unrelated to, and does not touch, `INTENT-INTAKE-PO-DEC-005` (the separate Intent Intake / AI-platform first-party authorization-evidence schema decision).

**Related decisions:**
- [CF-GLOBAL-ENTITY-ARCH-PO-DEC-001](CLIENT_FINDER_GLOBAL_ENTITY_ARCHITECTURE_PO_DECISION_RECORD.md) — the decision this record makes room for (D1 Universal Entity Identity, D8 Global Entity Scope).

## Context — the original DEC-005 decision

Per the Product Requirements Document (§"DEC-005 — User-owned Company for MVP"):

> **Decision:** Company is user-owned. A deterministic `normalized_domain` is persisted to preserve a future path to global company identity. Deduplication is `UNIQUE(search_id, company_id)`.
> **Status:** DECIDED.

Per migration `0015_discovery/migration.sql`:

> `-- Company (DEC-005): user-owned for MVP, NOT a global/shared identity — the MVP is itself validating whether normalized_domain is a reliable identity key; committing to a global namespace before that answer exists bakes in a guess, and a wrong dedup rule in a shared namespace ...`
>
> `-- Minimal fields only (DEC-005: "do not over-model company metadata"). normalized_domain is persisted (PFR-10) as the deterministic join key a future global-identity reconciliation would need ...`
>
> `-- DEC-005's per-user identity key. Not a global namespace: two different users discovering the same real business each get their own Company row for it.`

DEC-005 itself, via PFR-10, explicitly anticipated and deliberately provisioned for ("a future path to global company identity") the exact transition this record now activates. The "NOT a global/shared identity" language describes the MVP-validation posture DEC-005 chose at the time, not a permanent architectural prohibition.

## Decision

1. The clause of DEC-005 stating that company/entity identity is, for MVP, **"NOT a global/shared identity"** — i.e. the framing that identity resolution must remain strictly per-user — is **superseded** by D1 (Universal Entity Identity) and D8 (Global Entity Scope) in `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001`.
2. Global Entity identity, scope, and resolution are governed, from this point forward, by `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001`, not by DEC-005's per-user-only framing.
3. This supersession exercises, rather than contradicts, DEC-005's own stated rationale: `normalized_domain` was persisted specifically "to preserve a future path to global company identity" (PFR-10). That future path is now formally opened.

## Explicitly NOT superseded

DEC-005 remains fully authoritative, unchanged, and not reopened for:
- Company is user-owned for MVP (the existing `companies` table, its `UNIQUE(user_id, normalized_domain)` constraint, and its current per-user rows remain in place and continue to function as-is; this record does not instruct any migration or data change).
- Prospect deduplication is `UNIQUE(search_id, company_id)`, per PFR-11 — unchanged.
- "Do not over-model company metadata" (minimal company fields) — unchanged.
- `normalized_domain` as the deterministic join key — unchanged; it continues to serve exactly the role DEC-005 assigned it, now additionally usable as one input into Global Entity resolution evidence (subject to `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001`'s D12/D13).
- Any other DEC-00x decision (e.g. DEC-007 search-input snapshotting, DEC-008 child-entity ownership) — untouched; out of scope for this record.

## Explicit non-decisions

This record does **not** decide or authorize:
- Any migration adding, removing, or altering a column or constraint on `companies`, `prospects`, or any other table.
- Any code change to `packages/core-discovery` or any repository implementation.
- Any backfill, data migration, or reinterpretation of existing `companies`/`prospects` rows.
- How or when the global Entity layer described in `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` is actually built alongside the existing per-user `companies` table — that is future engineering/implementation work, not decided here.

## Implementation authorization status

**NOT AUTHORIZED.** No production code, migration, schema, or test file has been changed as part of this record. No database change occurred. Nothing has been committed or pushed.

## Governance conflict check

**NO CONFLICT REMAINS.** The only clause of DEC-005 in tension with `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001` — its MVP-scoped "NOT a global/shared identity" framing — is superseded narrowly and explicitly by this record. Every other DEC-005 decision, and every other existing governance record reviewed under `CF-GLOBAL-ENTITY-ARCH-PO-DEC-001`, was found consistent and is left untouched.
