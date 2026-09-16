# Migrations Runbook

Placeholder — expand this alongside architecture §9 (Migration Strategy)
once the first non-trivial migration (the partial unique index on
`payments` for "one captured payment per order", see prisma/schema.prisma
comment) is actually written.

Must eventually document, at minimum:
1. How to write an expand-only migration vs. a contract migration.
2. How `CREATE INDEX CONCURRENTLY` is applied outside of Prisma's default
   transactional migration wrapper.
3. The approval gate for destructive migrations (DROP COLUMN/TABLE).
4. Rollback procedure for a bad migration already deployed to production.
