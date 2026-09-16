#!/usr/bin/env bash
set -euo pipefail

# One-time local dev setup.
cd "$(dirname "$0")/.."

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example — fill in real secret values before running payment flows."
fi

command -v pnpm >/dev/null 2>&1 || { echo "pnpm is required: npm i -g pnpm"; exit 1; }

pnpm install
docker compose up -d postgres

echo "Waiting for Postgres to be healthy..."
until docker compose exec -T postgres pg_isready -U acos -d acos_dev >/dev/null 2>&1; do
  sleep 1
done

pnpm db:generate
echo "Setup complete. Run 'pnpm db:migrate:dev' once the first migration exists (Phase 1)."
