#!/usr/bin/env bash
set -euo pipefail

# Destroys and recreates the local dev Postgres volume. Local dev only —
# never point this script's DATABASE_URL at anything shared.
cd "$(dirname "$0")/.."

read -r -p "This will DROP all local dev data. Continue? [y/N] " confirm
if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
  echo "Aborted."
  exit 1
fi

docker compose down -v postgres
docker compose up -d postgres
echo "Local Postgres volume reset."
