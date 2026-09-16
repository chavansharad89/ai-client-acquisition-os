#!/usr/bin/env bash
set -euo pipefail

# Usage: ./scripts/wait-for-postgres.sh <host> <port>
HOST="${1:-localhost}"
PORT="${2:-5432}"
TIMEOUT="${3:-30}"

echo "Waiting up to ${TIMEOUT}s for Postgres at ${HOST}:${PORT}..."
for _ in $(seq 1 "$TIMEOUT"); do
  if (echo > "/dev/tcp/${HOST}/${PORT}") >/dev/null 2>&1; then
    echo "Postgres is accepting connections."
    exit 0
  fi
  sleep 1
done

echo "Timed out waiting for Postgres." >&2
exit 1
