# Production image for the Next.js app.
# =======================================================================
# Four stages. Only the last one ships; everything before it exists to
# produce artefacts and is discarded.
#
# WHAT THE PREVIOUS VERSION SHIPPED. `COPY --from=build /app /app` copied
# the entire build tree into the runtime image: every source file, every
# devDependency (typescript, vitest, eslint, tsx), the .next build cache,
# the test suites, the migration SQL, pnpm itself — and all of it owned by
# root and executed as root. The image was several times larger than the
# application, and its attack surface was the whole toolchain rather than
# the server.
#
# WHAT THIS ONE SHIPS. Next's traced standalone output: one server.js, the
# compiled pages, the static assets, and only those node_modules the app
# actually imports. No package manager, no compiler, no source, no tests.
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
COPY apps/web/package.json apps/web/package.json
COPY packages ./packages
# --frozen-lockfile: a build that would have to change the lockfile is a
# build resolving something nobody reviewed.
RUN pnpm install --frozen-lockfile --filter @acos/web...


# ---- build: compile, with dev dependencies available -------------------
FROM base AS build
COPY --from=deps /app /app
COPY . .
# The Prisma client is generated code, not source: it is not in the repo
# and @acos/db's module scope instantiates it, so `next build` cannot even
# import the payment route without this step.
RUN pnpm --filter @acos/db run generate
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm --filter @acos/web run build


# ---- runtime: the only stage that ships --------------------------------
#
# Deliberately NOT `FROM base`: base carries corepack/pnpm and the apk
# metadata, none of which a running server needs. Starting from the bare
# image is what makes this stage minimal rather than merely tidier.
FROM node:20-alpine AS runtime
WORKDIR /app

# Prisma still needs libssl at RUNTIME, not only at build time — the
# engine loads it on the first query.
RUN apk add --no-cache openssl

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Without this Next binds 127.0.0.1 inside the container and every request
# from outside it is refused — a container that passes its own health
# check and serves nobody.
ENV HOSTNAME=0.0.0.0

# node:20-alpine already provides an unprivileged `node` user (uid 1000).
# Creating another would gain nothing; using this one is the whole fix.
#
# Ownership is set by COPY --chown at copy time rather than by a later
# `chown -R`, which would duplicate every file it touched into a new layer
# and roughly double the image.
#
# The application files are owned by root and merely READABLE by node —
# not owned by node. A process that cannot rewrite its own code cannot
# persist a compromise across a restart, and nothing here needs to write
# to its own directory.
COPY --from=build --chown=root:root /app/apps/web/.next/standalone ./
COPY --from=build --chown=root:root /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build --chown=root:root /app/apps/web/public ./apps/web/public

# The one directory the server DOES write: Next's incremental cache.
RUN mkdir -p /app/apps/web/.next/cache && chown -R node:node /app/apps/web/.next/cache

USER node

EXPOSE 3000

# Liveness only — see app/api/health/route.ts for why this must not touch
# the database. Readiness (which does) is /api/ready, and belongs to the
# orchestrator's load-balancer check, not to Docker's restart policy.
HEALTHCHECK --interval=30s --timeout=3s --start-period=20s --retries=3 \
    CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# The traced server, started directly. No pnpm, no next CLI, no shell —
# node is PID 1 and receives SIGTERM itself, so a rolling deploy gets a
# clean shutdown rather than a 10-second wait and a SIGKILL.
CMD ["node", "apps/web/server.js"]
