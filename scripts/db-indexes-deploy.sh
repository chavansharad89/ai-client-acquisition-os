#!/usr/bin/env bash
set -euo pipefail

# Zero-downtime unique-index deployment. Runs as its own CI/CD step,
# separate from `prisma migrate deploy`, because CREATE INDEX CONCURRENTLY
# cannot run inside the transaction Prisma wraps migrations in.
#
#   ./scripts/db-indexes-deploy.sh --dry-run
#   ./scripts/db-indexes-deploy.sh
cd "$(dirname "$0")/.."

if [ -z "${DATABASE_URL:-}" ]; then
  echo "DATABASE_URL is not set. Refusing to run." >&2
  exit 2
fi

# Safe to interrupt: the script holds a session advisory lock and records
# its state, so a killed run is recoverable by re-running it.
pnpm --filter @acos/db-index-deploy exec tsx ../../scripts/deploy-concurrent-indexes.ts "$@"
