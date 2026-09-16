# Production image for the worker process.
# =======================================================================
# Same shape as apps/web/Dockerfile and for the same reasons; the
# differences are that there is no Next.js standalone tracer to do the
# pruning for us, and no HTTP port to probe.
#
# WHAT THE PREVIOUS VERSION SHIPPED. `COPY --from=build /app /app` copied
# the whole build tree — source, devDependencies (typescript, tsx,
# vitest), test suites, migration SQL, pnpm — into the runtime image, and
# ran it as root.
#
# WHAT THIS ONE SHIPS. The compiled dist/, the workspace packages it
# imports, and a production-only node_modules reinstalled from the same
# lockfile. No compiler, no test runner, no source.
# =======================================================================


# ---- base: the toolchain, shared by the build stages only --------------
FROM node:20-alpine AS base
WORKDIR /app
# Prisma's query engine links against libssl. Without it the client
# cannot detect an OpenSSL version, silently falls back to the 1.1.x
# engine, and dies at import with "libssl.so.1.1: No such file".
RUN apk add --no-cache openssl
RUN corepack enable


# ---- deps: resolve the workspace from the lockfile ---------------------
FROM base AS deps
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY apps/worker/package.json apps/worker/package.json
COPY packages ./packages
RUN pnpm install --frozen-lockfile --filter @acos/worker...


# ---- build: compile, with dev dependencies available -------------------
FROM base AS build
COPY --from=deps /app /app
COPY . .
# Generated code, not source — see apps/web/Dockerfile.
RUN pnpm --filter @acos/db run generate
RUN pnpm --filter @acos/worker run build

# Assemble the runtime tree.
#
# `pnpm deploy --prod` resolves the worker's dependency closure with
# devDependencies excluded and writes a SELF-CONTAINED directory: the
# workspace packages it imports are materialised into /out/node_modules
# rather than left as symlinks into a store that will not exist in the
# runtime image.
#
# Verified, not assumed: without this the image carried typescript,
# vitest, tsx and eslint, plus every OTHER workspace package —
# db-index-deploy, core-proposal and the rest — because the previous
# `COPY /app/packages` took the whole workspace regardless of what the
# worker imports.
RUN pnpm --filter @acos/worker --prod deploy /out

# What pnpm cannot know is which of a package's OWN files are runtime
# files. It ships whatever the package directory contains, so the test
# suites, tsconfigs and the migration SQL come along. None of that runs
# here:
#
#   tests            document internal structure and carry fixture data
#   tsconfig/vitest  build configuration, useless without the compiler
#   migrations*      operational SQL — including migrations-blocked/,
#                    which the old `-name migrations` missed. Applying
#                    migrations is a separate
#                    job with different credentials; a long-running
#                    worker never does it, and shipping the DDL invites
#                    someone to make it possible.
#   src              the worker's own TypeScript. dist/ is what runs.
RUN find /out -name '*.test.ts' -o -name '*.test.tsx' -o -name '*.spec.ts' \
             -o -name 'tsconfig*.json' -o -name 'vitest.config.ts' \
             -o -name '*.map' \
      | xargs -r rm -f \
 && rm -rf /out/src \
 && find /out -type d -name 'migrations*' -path '*prisma*' -exec rm -rf {} + 2>/dev/null || true

# ---- runtime: the only stage that ships --------------------------------
#
# Deliberately NOT `FROM base`: no corepack, no pnpm. A running worker
# installs nothing.
FROM node:20-alpine AS runtime
WORKDIR /app

# Prisma needs libssl at RUNTIME, not only at build time.
RUN apk add --no-cache openssl

ENV NODE_ENV=production

# Owned by root, readable by node: the process cannot rewrite its own
# code. A process that owns its own code lets a compromise survive a
# restart, and nothing here writes to its own directory.
#
# ONE directory, assembled and pruned in the build stage. Copying the
# pruned tree rather than pruning after the copy matters: a file deleted
# in a later layer is still in the image's history and `docker save` will
# still show it.
COPY --from=build --chown=root:root /out ./

USER node

# No HTTP surface, so there is nothing to GET. The check answers the only
# question that has an answer here: can this process still reach the
# database it exists to poll?
#
# `--start-period` is generous because a cold start runs migrations-aware
# client initialisation before the first query.
HEALTHCHECK --interval=60s --timeout=5s --start-period=30s --retries=3 \
    CMD node -e "const{PrismaClient}=require('@prisma/client');const p=new PrismaClient();p.\$queryRaw\`SELECT 1\`.then(()=>p.\$disconnect()).then(()=>process.exit(0)).catch(()=>process.exit(1))"

# `pnpm deploy` places the deployed package at the ROOT of the output
# directory, so the entry point is dist/index.js and not
# apps/worker/dist/index.js.
#
# node as PID 1, so SIGTERM reaches the process that has to drain leases
# rather than a shell that ignores it.
CMD ["node", "dist/index.js"]
