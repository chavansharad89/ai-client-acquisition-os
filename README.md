# AI Client Acquisition OS

A monorepo containing two products that share a database and a deployment:

1. **The funnel** — a three-tier digital-product checkout (₹99 → ₹499 → ₹1,499), built on Razorpay with server-side Meta Conversions API reporting.
2. **The acquisition engine** — a lead research, outreach and proposal system for freelancers.

> **Status: not production-ready.** The domain logic is implemented and tested; the wiring that makes it run is not. Payment confirmation, the background worker, authentication and all operational tooling are missing. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md#blockers-before-any-deploy) for the exact list before planning a launch.

## Documentation

| Document | Covers |
|---|---|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Package boundaries, data flow, what is implemented |
| [DATABASE.md](docs/DATABASE.md) | 17 models, constraints, the rules the database enforces |
| [MIGRATIONS.md](docs/MIGRATIONS.md) | Six migrations, how to apply them, the concurrent-index runbook |
| [PAYMENTS.md](docs/PAYMENTS.md) | Order creation, checkout, price authority |
| [WEBHOOKS.md](docs/WEBHOOKS.md) | Signature verification, idempotency, the unimplemented handler |
| [META-CAPI.md](docs/META-CAPI.md) | Purchase events, browser/server deduplication |
| [WORKERS.md](docs/WORKERS.md) | Lease-based claiming, retry, fencing |
| [AI-ENGINE.md](docs/AI-ENGINE.md) | Research, outreach, proposals, scoring |
| [SECURITY.md](docs/SECURITY.md) | 14 open findings, what the architecture gets right |
| [TESTING.md](docs/TESTING.md) | 747 unit tests, 154 unrun integration tests |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md) | Environments, release, failure recovery |
| [MONETIZATION.md](docs/MONETIZATION.md) | Pricing, tier limits, unit economics |

## Requirements

- Node.js ≥ 20
- pnpm 9.7.0 (`packageManager` pins it)
- Docker, for the local PostgreSQL

## Local setup

```bash
pnpm install
cp .env.example .env          # then fill in the secrets — see below
docker compose up -d postgres
pnpm db:generate              # needs network access to binaries.prisma.sh
pnpm db:migrate:deploy
pnpm dev
```

`pnpm dev` runs the Next.js app on `http://localhost:3000`. The worker (`apps/worker`) currently throws on boot — see [WORKERS.md](docs/WORKERS.md).

## Environment variables

Every variable is validated at process boot by `packages/config`. A missing or malformed value fails fast rather than surfacing at the first request.

| Variable | Required | Notes |
|---|---|---|
| `NODE_ENV` | no | `development` \| `test` \| `production`. Defaults to `development`. Also disables AI-engine fault injection when `production`. |
| `PORT` | no | Defaults to 3000 |
| `LOG_LEVEL` | no | `debug` \| `info` \| `warn` \| `error` |
| `DATABASE_URL` | **yes** | PostgreSQL connection string |
| `RAZORPAY_KEY_ID` | **yes** | Public key; sent to the browser |
| `RAZORPAY_KEY_SECRET` | **yes** | Never leaves the server |
| `RAZORPAY_WEBHOOK_SECRET` | **yes** | Separate from the key secret |
| `META_PIXEL_ID` | **yes** | Interpolated into the CAPI URL path |
| `META_CAPI_ACCESS_TOKEN` | **yes** | Sent in the request body, never the URL |
| `META_CAPI_API_VERSION` | no | Must match `vNN.NN`. Defaults to `v20.0` |
| `WORKER_POLL_INTERVAL_MS` | no | Defaults to 15000 |
| `WORKER_BATCH_SIZE` | no | Defaults to 25 |
| `WORKER_MAX_ATTEMPTS` | no | Defaults to 8 — **note the mismatch** below |

### Two known gaps in this table

- **`ANTHROPIC_API_KEY` is not validated.** `@acos/core-research`, `@acos/core-outreach` and `@acos/core-proposal` all construct an Anthropic client that reads it from the environment, but `packages/config/src/env.ts` does not list it. It will fail at first use rather than at boot.
- **`WORKER_MAX_ATTEMPTS` defaults to 8, but the Meta worker uses 5** (`MAX_ATTEMPTS` in `apps/worker/src/metaEvents/backoff.ts`). The env var is currently unread by that worker.

## Commands

```bash
pnpm test                 # all unit tests — currently FAILS, see TESTING.md
pnpm typecheck            # all packages
pnpm lint
pnpm format:check
pnpm test:integration     # requires PostgreSQL, see TESTING.md
pnpm db:indexes:verify    # dry-run the concurrent index deployment
pnpm db:indexes:deploy    # apply it
```

## Repository layout

```
apps/
  web/                    Next.js App Router — funnel, checkout, dashboard
  worker/                 Background dispatcher (entrypoint currently throws)
packages/
  catalog/                Products, prices, funnel ladder, deliverables
  config/                 Zod-validated environment loading
  core-payments/          Order creation, Razorpay client, idempotency
  core-entitlements/      Access tokens, entitlement grants, delivery authorisation
  core-capi/              Meta Conversions API
  core-reconciliation/    Read-only duplicate detection
  core-acquisition/       Pipeline, scoring, follow-ups, dashboard (pure)
  core-research/          AI lead research
  core-outreach/          AI outreach generation
  core-proposal/          AI proposal generation
  db/                     Prisma schema + migrations
  db-index-deploy/        Zero-downtime unique index deployment
  observability/          Logging placeholder
  shared-types/           Shared DTOs (empty)
tests/
  fixtures/               Shared test data + scoped cleanup
  integration/            Real-PostgreSQL tests
  contract/               Provider contract tests
infra/                    CI pipeline, migration runbook
scripts/                  Setup, reset, index deployment
```
