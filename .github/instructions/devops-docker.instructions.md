# DevOps / Docker Instructions (Ghost Pilot)

Reference for containerizing and operating this project. Keep in sync with the
deployment files: `Dockerfile`, `.dockerignore`, `docker-compose.yml`,
`app/api/health/route.ts`, `.github/workflows/ci.yml`, `.github/workflows/cd.yml`.

## Stack facts that drive the container design

- **Next.js 16** with `output: "standalone"` in `next.config.ts`. The build emits
  `.next/standalone/server.js` plus traced `node_modules`. Only copy
  `.next/standalone`, `.next/static`, and `public` into the runtime image.
- **Prisma 7** uses the Rust-free `prisma-client` generator (outputs to
  `app/generated/prisma`) with the `@prisma/adapter-pg` driver adapter.
  - **No query-engine binary is needed in the runtime image.**
  - `prisma generate` must run during the build (`app/generated` is gitignored
    and dockerignored; it is regenerated in-container).
  - `prisma migrate deploy` still needs the Rust migration engine, so it runs in
    **CI/CD only** — never from the slim runtime image.
- **Trigger.dev v4** (`@trigger.dev/sdk@4.x`, CLI `trigger.dev@4.x`). Tasks run in
  Trigger.dev's cloud; the app only triggers them via the SDK. Deploy tasks with
  `npx trigger.dev deploy` (needs `TRIGGER_PROJECT_REF` + `TRIGGER_SECRET_KEY`).
  - Do **not** use the retired v3 API or `trigger-v3-cli`. Never `client.defineJob()`.
- **Clerk** public env vars (`NEXT_PUBLIC_CLERK_*`) are inlined at build time and
  must be passed as Docker `--build-arg`. Server secrets (`CLERK_SECRET_KEY`,
  `DATABASE_URL`, `LIVEBLOCKS_SECRET_KEY`, `BLOB_READ_WRITE_TOKEN`,
  `TRIGGER_*`, `GOOGLE_AI_API_KEY`) are injected at runtime via compose
  `env_file` — never baked into the image.

## Docker build rules

- Multi-stage: `deps` (npm install) → `builder` (prisma generate + `npm run build`) →
  `runner` (`node:24-slim`, non-root `node` user).
- Runner must set `NODE_ENV=production`, `HOSTNAME=0.0.0.0`, `PORT=3000` and run
  `node server.js` (never `npm start` — signals).
- `node:24-slim` (glibc) — matches the devcontainer; do not switch to Alpine
  unless you re-verify native deps.
- `.env*` is dockerignored. Use `--build-arg` for `NEXT_PUBLIC_*` only.

## Runtime / compose rules

- `docker-compose.yml` runs a single `app` service; the database is cloud Prisma
  Postgres (no DB container in prod).
- Healthcheck: `node -e fetch(...)` against `/api/health` (must stay in Clerk's
  public routes in `proxy.ts` — do not remove it).
- Update images with `docker compose pull app && docker compose up -d app`.
