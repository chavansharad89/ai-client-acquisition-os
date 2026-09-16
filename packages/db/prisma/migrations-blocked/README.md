# Blocked migrations

These two migrations are **not** in the migration chain. They are kept
here, unmodified, because they are correct work that is missing its
foundation — not because they are wrong.

## Why they were moved

`prisma migrate deploy` failed on every database, always:

```
Applying migration `0005_outreach_provenance`
Error: P3018  Database error code: 42704
ERROR: type "OutreachChannel" does not exist
```

`0005_outreach_provenance` runs `ALTER TYPE "OutreachChannel"` and
`ALTER TABLE "acq_outreach_messages"`. `0006_opportunity_lifecycle` runs
`ALTER TABLE "acq_opportunities"` and rebuilds `"OpportunityStage"`.
**No migration in this repository creates any of those tables or types**,
and `schema.prisma` declares no model for them.

So the chain could not be deployed to a clean database — which is every
database, since it had never once succeeded. The consequences reached
well past migrations:

- `pnpm db:migrate:deploy` failed, so CI could not gate on it, so the
  step sat as a TODO.
- Nine integration suites failed at setup with `42P01`/`42704`, and the
  ones that passed only did so by naming `skipMigrations: ['0005…',
  '0006…']` in the test file — a workaround that also skipped any
  regression in the migrations it was skipping.

## What is missing

A base migration creating the acquisition-side schema: the
`acq_opportunities` and `acq_outreach_messages` tables and the
`OutreachChannel`, `MessageStatus` and `OpportunityStage` enums.

That migration was never written, and it is **not** reconstructed here on
purpose. The shapes could be guessed from what 0005 and 0006 reference,
but guessing column types, foreign keys and constraints for a schema no
code queries would be inventing a production data model to satisfy two
orphaned files. No application code touches these tables — the only
references anywhere are comments, and
`apps/web/src/dashboard/loadDashboard.ts` says so outright: *"nothing
populates the acq_* tables."*

## How to restore them

1. Write the base migration (`0004b_acquisition_base`, or renumber these
   two — Prisma orders migrations lexicographically by directory name).
2. Move these two directories back into `../migrations/`.
3. Delete nothing else: `tests/pipeline/testPolicy.test.ts` asserts that
   no migration ALTERs a table the chain never created, so a restore
   without its base fails that test rather than the deploy.

Nothing is lost by the move. Neither migration had ever been applied to
any database, so no `_prisma_migrations` row anywhere refers to them.
