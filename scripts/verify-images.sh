#!/usr/bin/env bash
#
# Builds the production images and verifies the hardening properties hold.
#
# Why a script and not a checklist: every property below was true of these
# Dockerfiles at some point and then quietly stopped being true. A runtime
# stage that starts `FROM base` inherits pnpm; a `COPY --from=build /app
# /app` added back "just to fix the module resolution" re-ships the whole
# toolchain; a `USER node` deleted while debugging a permissions error
# stays deleted. None of those show up in a diff review as a security
# change, and all of them are.
#
# Usage:
#   scripts/verify-images.sh              # build and verify both
#   scripts/verify-images.sh web          # just apps/web
#   scripts/verify-images.sh worker       # just apps/worker
#   SKIP_BUILD=1 scripts/verify-images.sh # verify images already built
#
# Exit code is the number of failed checks, capped at 250. Never prints a
# secret value.

set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

TARGETS=("$@")
if [ ${#TARGETS[@]} -eq 0 ]; then TARGETS=(web worker); fi

failures=0
checks=0

pass() { checks=$((checks + 1)); printf '  \033[32mok\033[0m   %s\n' "$1"; }
fail() {
  checks=$((checks + 1)); failures=$((failures + 1))
  printf '  \033[31mFAIL\033[0m %s\n' "$1"
  [ $# -gt 1 ] && printf '       %s\n' "$2"
}
info() { printf '       %s\n' "$1"; }
head() { printf '\n\033[1m%s\033[0m\n' "$1"; }

# Runs a command inside the image. Uses the image's own USER, so a check
# that depends on privileges fails the way production would.
in_image() { docker run --rm --entrypoint sh "$1" -c "$2" 2>/dev/null; }

verify_image() {
  local app="$1" image="$2"
  head "$image"

  # ---- 1. non-root runtime user -------------------------------------
  # Both the declared user and the effective one: a Dockerfile can say
  # USER node and still be overridden by an ENTRYPOINT that drops back.
  local declared uid
  declared="$(docker inspect -f '{{.Config.User}}' "$image" 2>/dev/null)"
  uid="$(in_image "$image" 'id -u')"
  if [ "$uid" = "0" ]; then
    fail "runs as non-root" "effective uid is 0 (Config.User='${declared}')"
  else
    pass "runs as non-root (uid $uid, Config.User='${declared}')"
  fi

  # ---- 2. the process cannot rewrite its own code -------------------
  # Owning your own code means a compromise survives a restart.
  local writable
  writable="$(in_image "$image" 'find /app -maxdepth 3 -writable -type f 2>/dev/null | grep -v "/.next/cache/" | head -5')"
  if [ -n "$writable" ]; then
    fail "application files are not writable by the runtime user" \
         "$(echo "$writable" | tr '\n' ' ')"
  else
    pass "application files are not writable by the runtime user"
  fi

  # ---- 3. no package manager in the runtime image -------------------
  # pnpm/corepack in a running container is an arbitrary-code-download
  # tool sitting next to the credentials.
  local pm
  pm="$(in_image "$image" 'command -v pnpm corepack yarn 2>/dev/null | head -3')"
  if [ -n "$pm" ]; then
    fail "no package manager present" "$(echo "$pm" | tr '\n' ' ')"
  else
    pass "no package manager present"
  fi

  # ---- 4. production-only dependencies ------------------------------
  local devdeps
  devdeps="$(in_image "$image" \
    'ls -d /app/node_modules/typescript /app/node_modules/vitest /app/node_modules/tsx /app/node_modules/eslint /app/node_modules/.bin/tsc 2>/dev/null | head -5')"
  if [ -n "$devdeps" ]; then
    fail "no devDependencies in the runtime image" "$(echo "$devdeps" | tr '\n' ' ')"
  else
    pass "no devDependencies in the runtime image"
  fi

  # ---- 5. no build artefacts or source ------------------------------
  # Tests and TypeScript sources are not just dead weight: they document
  # internal structure and, in this repo, fixture data.
  local src
  src="$(in_image "$image" \
    'find /app -name "*.test.ts" -o -name "*.test.tsx" -o -name "tsconfig.json" -o -name "vitest.config.ts" 2>/dev/null | grep -v node_modules | head -5')"
  if [ -n "$src" ]; then
    fail "no test or build-config files" "$(echo "$src" | tr '\n' ' ')"
  else
    pass "no test or build-config files"
  fi

  # Migration SQL is operational tooling; it belongs in a migration job,
  # not in a long-running server that never applies one.
  local migrations
  migrations="$(in_image "$image" 'find /app -path "*prisma/migrations*" -name "*.sql" 2>/dev/null | head -3')"
  if [ -n "$migrations" ]; then
    fail "no migration SQL in the runtime image" "$(echo "$migrations" | tr '\n' ' ')"
  else
    pass "no migration SQL in the runtime image"
  fi

  # ---- 6. no secrets ------------------------------------------------
  local envfiles
  envfiles="$(in_image "$image" 'find /app -maxdepth 4 -name ".env*" ! -name ".env.example" 2>/dev/null | head -5')"
  if [ -n "$envfiles" ]; then
    fail "no .env files in the filesystem" "$(echo "$envfiles" | tr '\n' ' ')"
  else
    pass "no .env files in the filesystem"
  fi

  # ---- 7. the entrypoint's dependencies actually load ---------------
  # A pruned image that is missing something only fails on the code path
  # that needs it, which in a worker can be hours after it started. This
  # loads every workspace package the app declares, up front.
  #
  # It is also the check that catches the `main: src/index.ts` defect: the
  # @acos/* packages point `main` at TypeScript source, so Node executes
  # a .ts file as CommonJS and dies on the first `export`.
  local modfail
  modfail="$(in_image "$image" \
    'cd /app && for m in $(ls node_modules/@acos 2>/dev/null); do node -e "require(\"@acos/$m\")" >/dev/null 2>&1 || echo "@acos/$m"; done')"
  if [ -n "$modfail" ]; then
    fail "every bundled workspace package is loadable by node" \
         "cannot require: $(echo "$modfail" | tr '\n' ' ')"
  else
    pass "every bundled workspace package is loadable by node"
  fi

  # ---- 7. a declared healthcheck ------------------------------------
  local hc
  hc="$(docker inspect -f '{{if .Config.Healthcheck}}{{.Config.Healthcheck.Test}}{{end}}' "$image" 2>/dev/null)"
  if [ -z "$hc" ]; then
    fail "declares a HEALTHCHECK"
  else
    pass "declares a HEALTHCHECK"
  fi

  # ---- 8. size, reported not asserted -------------------------------
  # No threshold: a number that fails a build is a number somebody raises.
  # Printing it makes a regression visible in the log instead.
  local size
  size="$(docker image inspect -f '{{.Size}}' "$image" 2>/dev/null)"
  info "image size: $(( size / 1024 / 1024 )) MB"
}

# =====================================================================

for app in "${TARGETS[@]}"; do
  image="acos-${app}:verify"
  if [ "${SKIP_BUILD:-}" != "1" ]; then
    head "building $image from apps/${app}/Dockerfile"
    if docker build -f "apps/${app}/Dockerfile" -t "$image" . >/tmp/acos-build-${app}.log 2>&1; then
      pass "image builds"
    else
      fail "image builds" "see /tmp/acos-build-${app}.log"
      tail -25 "/tmp/acos-build-${app}.log" | sed 's/^/       /'
      continue
    fi
  fi
  verify_image "$app" "$image"
done

# ---- delegated: the layer-level secret scan --------------------------
# check-image-secrets.sh inspects every LAYER in the saved tarball, not
# just the final filesystem — a secret deleted in a later stage is still
# in the image's history, and only that check can see it.
if [ "${SKIP_SECRETS:-}" != "1" ]; then
  head "layer-level secret scan"
  built=()
  for app in "${TARGETS[@]}"; do
    docker image inspect "acos-${app}:verify" >/dev/null 2>&1 && built+=("acos-${app}:verify")
  done
  if [ ${#built[@]} -eq 0 ]; then
    info "no images to scan"
  elif bash scripts/check-image-secrets.sh "${built[@]}"; then
    pass "no secrets in any layer"
  else
    fail "no secrets in any layer" "see scripts/check-image-secrets.sh output above"
  fi
fi

head "$((checks - failures))/${checks} checks passed"
[ "$failures" -eq 0 ] || printf '\033[31m%d failed\033[0m\n' "$failures"
exit $(( failures > 250 ? 250 : failures ))
