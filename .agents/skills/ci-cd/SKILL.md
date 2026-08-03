---
name: ci-cd
description: >-
  Ghost Pilot's containerization and CI/CD pipeline. Use when editing the
  Dockerfile, docker-compose.yml, .github/workflows/*, scripts/setup_server.sh,
  or debugging VPS/GHCR/Trigger.dev deploys.
---

# CI/CD Skill (Ghost Pilot)

Project-specific rules distilled from the pipeline and containerization setup.
Always check the instruction docs first:
`.github/instructions/devops-docker.instructions.md` and
`.github/instructions/ci-cd.instructions.md`.

## Golden rules

- **Next.js standalone**: runtime image copies only `.next/standalone`,
  `.next/static`, `public`; `CMD ["node","server.js"]` with
  `HOSTNAME=0.0.0.0 PORT=3000 NODE_ENV=production`.
- **Prisma 7 is binary-free in runtime**: `prisma-client` generator +
  `@prisma/adapter-pg`. Run `prisma generate` in the build stage, never at
  runtime. `prisma migrate deploy` runs in CI/CD only.
- **Clerk public vars are build args**; server secrets are runtime env via
  compose `env_file`. Never bake secrets into images; `.env*` is dockerignored.
- **Trigger.dev v4 only**: tasks ship via `npx trigger.dev deploy` in CD
  (needs `TRIGGER_PROJECT_REF`/`TRIGGER_SECRET_KEY`). Never use v3
  `client.defineJob` or `trigger-v3-cli`.
- **Healthcheck** depends on `app/api/health/route.ts` being in Clerk's public
  routes (`proxy.ts` `isPublicRoute`). Don't remove it.

## Workflow rules

- `ci.yml`: `npm install` → prisma generate → migrate deploy (service container) →
  lint → typecheck → build → Playwright e2e.
- `cd.yml` job order (push to `main`): build-push → migrate → deploy → trigger-deploy.
  The `deploy` (VPS ssh-action) job is **dormant**: gated behind repository
  variable `ENABLE_VPS_DEPLOY == 'true'` and the `VPS_*` secrets. `trigger-deploy`
  depends only on `build-push` so it runs regardless.
- `.env*` is gitignored, so all CI/CD config must come from GitHub secrets/vars.

## Verification

- No Docker CLI on the local WSL host → validate image changes in CI.
- Sanity-check locally with `npm run lint`, `npm run typecheck`, `npm run build`,
  and `docker compose config`.
