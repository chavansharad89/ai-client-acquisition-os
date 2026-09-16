# Testing

## Current state, measured

Every figure below came from running the command named, on 2026-09-15.

| Command | Result |
|---|---|
| `pnpm test` | **1043 tests pass**, 19/19 packages execute, exit 0 |
| `pnpm lint` | **0 errors**, 77 warnings, 18/18 packages execute, exit 0 |
| `pnpm typecheck` | 19/19 packages execute, exit 0 |
| `pnpm test:integration` | **280 pass, 27 fail**, 7 skipped, 13 todo (327), exit 1 |

### Unit tests, per package

| Package | Tests | | Package | Tests |
|---|---|---|---|---|
| `apps/web` | 167 | | `core-reconciliation` | 29 |
| `core-acquisition` | 137 | | `tests/fixtures` | 29 |
| `apps/worker` | 128 | | `config` | 28 |
| `core-research` | 94 | | `rate-limit` | 20 |
| `core-payments` | 89 | | `observability` | 20 |
| `catalog` | 79 | | `tests/pipeline` | 18 |
| `core-entitlements` | 74 | | `core-capi` | 6 |
| `db-index-deploy` | 51 | | `db`, `shared-types` | exempt |
| `core-proposal` | 38 | | | |
| `core-outreach` | 36 | | | |

## What was broken, and why it stayed broken

Four pipeline stages had never run. Each hid the next.

**1. `pnpm test` aborted on a package with no tests.** `@acos/db` declares
`"test": "vitest run"` and has no test files; vitest exits 1 on "No test
files found"; turbo aborts. The run reported `4 successful, 18 total` —
**fourteen packages never executed**, and nothing in the output looked
like a test failure.

**2. The migration chain could not be applied.** `prisma migrate deploy`
died at `0005_outreach_provenance` with `42704: type "OutreachChannel"
does not exist`. See
[migrations-blocked/README.md](../packages/db/prisma/migrations-blocked/README.md).
Because of this the CI migrate step was left as a TODO, nine integration
suites failed at setup, and the suites that did pass named
`skipMigrations: ['0005…', '0006…']` — skipping any regression in those
migrations along with them.

**3. CI was not where GitHub looks.** The workflow lived at
`infra/github-actions/ci.yml`. A workflow outside `.github/workflows/`
never runs, so lint, typecheck and tests had not executed on a single
commit.

**4. `pnpm lint` failed in all thirteen packages.** The repo declares
eslint `^9.10.0` and had a v8 `.eslintrc.json`, which ESLint 9 does not
read; every package script also passed `--ext .ts`, removed in v9. So no
file had ever been linted.

## Packages without tests

`--passWithNoTests` is **not** used, and must not be added globally. It
is the one-word fix and it is the wrong one: applied everywhere, a
package whose tests are deleted, whose glob a config change breaks, or
whose suite a rename excludes, reports success. That failure is silent,
permanent, and indistinguishable from health.

Instead, exemptions are explicit, per package, and state their reason in
the package's own `test` script so it appears in the build log:

| Package | Why |
|---|---|
| `@acos/db` | a Prisma client singleton and a type re-export (28 lines) |
| `@acos/shared-types` | type declarations only, no runtime logic |

[`tests/pipeline/testPolicy.test.ts`](../tests/pipeline/testPolicy.test.ts)
stops that list from rotting. It fails if a package outside the list has
no tests, if an exempt package grows source files beyond its declared
boundary, if an exemption stops explaining itself, if any script adopts
`--passWithNoTests`, if a migration ALTERs a table the chain never
creates, if a vitest config collects outside its own directory, or if an
integration suite substitutes a fake for PostgreSQL.

## Integration tests run against real PostgreSQL

No fakes, asserted by the policy suite above. The harness creates a
throwaway database per suite and applies the **full** migration chain to
it.

```bash
docker compose -f docker-compose.test.yml up -d
pnpm test:integration
```

`TEST_ADMIN_DATABASE_URL` overrides the server; it defaults to the
`docker-compose.test.yml` instance on port 5433, which is also the port
CI publishes, so there is one URL rather than one per environment.

## The 27 failing integration tests

They are not infrastructure failures — every suite starts, connects, and
migrates. They are **stale tests that contradict deliberate later schema
decisions**, and they had never executed because the broken migration
chain masked them.

| Suite | Fail | What they assert |
|---|---|---|
| `reconciliation` | 8 | pre-`0003` duplicate/snapshot shapes |
| `meta-event-worker.concurrency` | 5 | many Meta events per order; `0002` made `order_id` unique |
| `payment-capture` | 4 | *"the database does not constrain currency — the handler must"*; `0003` now does |
| `entitlements` | 4 | expects an older constraint name; a newer trigger fires first |
| `index-deploy` | 3 | deployment-script behaviour under the new index set |
| `meta-event` | 2 | one event per order |
| `create-order` | 2 | pre-idempotency-binding behaviour |
| `webhook` | 1 | stores an invalid-signature event; `0007` forbids it |

Each needs a decision — is the test right, or the migration? — and in
every case inspected so far the migration is the deliberate, newer,
separately-tested decision. Resolving them is test work, not pipeline
work, and is deliberately **not** done here: rewriting 27 assertions to
match the schema in the same change that made them run would make it
impossible to tell a stale test from a real regression.

## Known gaps

- **`apps/web` loses the Next.js lint rules.** `eslint-config-next@14`
  is incompatible with ESLint 9 — both `react-hooks` and `@next/next`
  call rule-context methods v9 removed (`context.getScope`,
  `context.getAncestors`) and crash the run rather than reporting. The
  fix is upgrading `eslint-config-next`, a dependency change with its own
  compatibility surface. Workspace TypeScript rules still apply there.
- **77 lint warnings**, mostly `import/order`; `--fix` resolves them.
  Left alone so this change shows only what it changed.
- **`pnpm format:check` fails on 57 files.** A fifth stage that had never
  run, for the same reason as the others: nothing executed it. All of them
  predate this change — every file touched here is formatted. The fix is
  `npx prettier --write .`, a mechanical 57-file commit that is better made
  on its own than buried in a pipeline repair. Until it is made, the
  `lint-typecheck` CI job fails at its last step.

## How the tests are structured

**Pure domain logic, faked edges.** Every package takes its database, HTTP client or model as an interface, so unit tests need no fixtures. The in-memory fakes deliberately reproduce the real semantics — `tests/fixtures/fakeDb.ts` enforces `ON DELETE RESTRICT` so the cleanup-order assertion is meaningful rather than decorative.

**Fixtures are deterministic and scoped.** `tests/fixtures/` generates ids from a `runId`, so a failure is reproducible, and cleanup deletes *only* that run's ids — never a broad `DELETE FROM`.

**Guards are mutation-tested.** Several critical invariants were verified by deliberately breaking the implementation and confirming the tests fail:

| Mutation | Tests that failed |
|---|---|
| Drop the worker's lease fencing | 4 |
| Lease boundary `<=` → `<` | 6 |
| Lease recovery charges an attempt | 7 |
| Auto-drop a suspicious index | 3 |
| Skip the duplicate preflight | 4 |
| Remove `CONCURRENTLY` | 10 |
| Broad delete in fixture cleanup | 2 |
| Ids stop carrying the runId | 24 |

Two mutations initially passed and exposed **real test gaps**, since fixed: the fake coupled `indisready` to `indisvalid` (hiding a broken validity check), and nothing tested a `CREATE` that succeeds while leaving an invalid index.

## What is not tested

- **No live Anthropic API call has ever been made.** The three AI packages are verified against fakes; their adapters typecheck against the real SDK but have never executed. Repair-rate and token estimates are the least-tested inputs in the system.
- **No container has been built**, so the Dockerfiles are unverified.
- **No migration has been applied**, so ~400 lines of PL/pgSQL are unparsed.
