# syntax=docker/dockerfile:1

# ============================================================
# Ghost Pilot — production image (Next.js 16 standalone)
# Multi-stage: deps -> builder -> runner
# Uses node:24-slim to match the devcontainer (zero drift).
# Prisma 7 uses a Rust-free client (driver adapter), so no
# engine binaries are required in the runtime image.
# ============================================================

# ---------- Stage 1: deps ----------
FROM node:24-slim AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install --no-audit --no-fund

# ---------- Stage 2: builder ----------
FROM node:24-slim AS builder
WORKDIR /app

ENV NEXT_TELEMETRY_DISABLED=1

# Placeholder required by `prisma generate` validation. The real
# DATABASE_URL is injected at runtime via compose (never baked in).
ENV DATABASE_URL=postgresql://build:build@localhost:5432/build

# NEXT_PUBLIC_* values are inlined into client bundles at build
# time. Pass them via --build-arg (CI reads them from secrets).
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ARG NEXT_PUBLIC_CLERK_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_SIGN_IN_URL}
ARG NEXT_PUBLIC_CLERK_SIGN_UP_URL
ENV NEXT_PUBLIC_CLERK_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_SIGN_UP_URL}
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
ARG NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL
ENV NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=${NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate the Prisma client (outputs to app/generated/prisma)
RUN npx prisma generate

# Build the standalone output
RUN npm run build

# ---------- Stage 3: runner ----------
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Copy standalone output (server.js + traced node_modules)
COPY --from=builder /app/.next/standalone ./
# Copy static assets (not included in standalone output)
COPY --from=builder /app/.next/static ./.next/static
# Copy public assets (not included in standalone output)
COPY --from=builder /app/public ./public
# Belt-and-suspenders: ensure the generated Prisma client is present
# in the runtime image (standalone tracing usually includes it, but
# this keeps the runtime self-contained if tracing misses it).
COPY --from=builder /app/app/generated ./app/generated

# Writable .next dir for prerender cache / optimized images
RUN mkdir -p .next && chown -R node:node /app

# Non-root user for security
USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]
