#!/usr/bin/env bash
#
# Applies the migration chain. Runs as its own CI/CD step BEFORE the app
# receives traffic, per architecture §9 rule 5.
#
# Usage:
#   scripts/db-migrate-deploy.sh                 # apply to $DATABASE_URL
#   scripts/db-migrate-deploy.sh --check         # verify only, change nothing
#   EXPECT_DATABASE=acos_test scripts/db-migrate-deploy.sh
#
# The guard this used to be a TODO for: `prisma migrate deploy` applies
# whatever chain it is given to whatever database DATABASE_URL names, and
# a stale shell variable is all it takes to run a test pipeline's
# migrations against production. So the target is named and checked,
# never assumed.

set -euo pipefail

cd "$(dirname "$0")/.."

CHECK_ONLY=0
[ "${1:-}" = "--check" ] && CHECK_ONLY=1

SCHEMA="packages/db/prisma/schema.prisma"

# ---- 1. there must be a target ----------------------------------------
if [ -z "${DATABASE_URL:-}" ]; then
  echo "db-migrate-deploy: DATABASE_URL is not set." >&2
  echo "  Local test database:" >&2
  echo "    docker compose -f docker-compose.test.yml up -d" >&2
  echo "    export DATABASE_URL=postgresql://acos_test:acos_test_password@127.0.0.1:5433/acos_test" >&2
  exit 2
fi

# The database name, with credentials and query string stripped. Printed
# instead of the URL, which carries a password.
target_db="$(printf '%s' "$DATABASE_URL" | sed -E 's#^.*/([^/?]+)(\?.*)?$#\1#')"
target_host="$(printf '%s' "$DATABASE_URL" | sed -E 's#^[^@]*@([^/]+)/.*$#\1#')"

# ---- 2. it must be the target you meant -------------------------------
#
# EXPECT_DATABASE is how a caller states its intent. CI sets it; a human
# running this against production is made to type the name.
if [ -n "${EXPECT_DATABASE:-}" ] && [ "$target_db" != "$EXPECT_DATABASE" ]; then
  echo "db-migrate-deploy: refusing to run." >&2
  echo "  EXPECT_DATABASE=$EXPECT_DATABASE but DATABASE_URL points at '$target_db'." >&2
  exit 3
fi

echo "db-migrate-deploy: target ${target_db} at ${target_host}"

# ---- 3. the chain must be complete ------------------------------------
#
# A migration directory without a migration.sql is applied silently as a
# no-op by some tooling and as an error by others. Catch it here, where
# the message can say which directory, rather than mid-deploy.
missing=""
for dir in packages/db/prisma/migrations/*/; do
  [ -d "$dir" ] || continue
  [ -f "${dir}migration.sql" ] || missing="${missing} $(basename "$dir")"
done
if [ -n "$missing" ]; then
  echo "db-migrate-deploy: migration directories with no migration.sql:${missing}" >&2
  exit 4
fi

PRISMA="node_modules/.pnpm/prisma@5.22.0/node_modules/prisma/build/index.js"
run_prisma() {
  if [ -f "$PRISMA" ]; then node "$PRISMA" "$@"; else pnpm exec prisma "$@"; fi
}

# ---- 4. apply, or report ----------------------------------------------
if [ "$CHECK_ONLY" -eq 1 ]; then
  # `migrate status` exits non-zero when migrations are pending, which is
  # exactly the gate a deploy pipeline wants before it swaps traffic.
  run_prisma migrate status --schema "$SCHEMA"
  exit $?
fi

run_prisma migrate deploy --schema "$SCHEMA"

# ---- 5. prove it ------------------------------------------------------
#
# `migrate deploy` exits 0 having applied nothing if the chain is empty or
# the directory is misconfigured, so success is confirmed rather than
# assumed.
run_prisma migrate status --schema "$SCHEMA"
echo "db-migrate-deploy: ${target_db} is up to date."
