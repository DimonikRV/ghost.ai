---
name: nextjs
description: >-
  Next.js 16.3 (App Router) conventions for Ghost Pilot. Use when building or
  editing pages, layouts, route handlers (app/api/*), proxy.ts, Server
  Components/Client Components, data fetching or caching, error handling,
  navigation, or debugging Next.js build/runtime issues.
---

# Next.js 16.3 (Ghost Pilot)

The app runs **Next.js 16.3 + React 19** on the App Router with Turbopack.
Before writing any Next.js code, read the **version-matched** docs bundled with
the installed package — your training data predates this version and several
APIs/conventions changed:

```
node_modules/next/dist/docs/
├── 01-app/
│   ├── 01-getting-started/   # layouts, pages, fetching, caching, fonts, route handlers, proxy
│   ├── 02-guides/            # server actions, upgrading/version-16, ai-agents, instant navigation
│   └── 03-api-reference/     # file conventions, functions (catchError, root-params), config
```

Docs are version-pinned to the installed `next`, so `npm install` keeps them in
sync. Also read `AGENTS.md` in the repo root for the auto-maintained block that
`next dev` writes.

## Ghost Pilot conventions

- **`proxy.ts`** (project root) — Next.js 16 renamed `middleware.ts` to
  `proxy.ts`; the old `middleware` convention is deprecated. This project runs
  `clerkMiddleware()` for Clerk but does **not** gate auth in `proxy.ts` —
  `createRouteMatcher` is deprecated. Enforce auth at each resource with
  `auth()` / `auth.protect()` from `@clerk/nextjs/server`; the
  `@clerk/next/require-auth-protection` lint rule flags unprotected resources.
  Use `proxy.ts` by default; create a `middleware.ts` **only when the Edge runtime
  is required** — `proxy` runs on Node.js and cannot be reconfigured (`runtime`
  is unavailable in proxy files), while `middleware` remains the Edge-runtime
  file. See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`
  and `node_modules/next/dist/docs/01-app/02-guides/upgrading/version-16.md`.
- **Route handlers** live in `app/api/*/route.ts` using `NextRequest` /
  `NextResponse` from `next/server`. Keep one responsibility per handler.
- **Server components by default.** Add `"use client"` only when browser
  interactivity (hooks/state/effects) requires it, and only at the top of the
  file.
- **Route groups** `(auth)` and `(app)` exist for layout separation, not
  organization.
- **`next/font/google`** — `Geist`/`Geist_Mono` are loaded in `app/layout.tsx`.
- **`output: "standalone"`** in `next.config.ts` — the Docker runtime image
  ships only `.next/standalone`, `.next/static`, `public`. See the `ci-cd`
  skill before touching the Dockerfile.
- **Bundler:** Turbopack everywhere — `next dev` and `next build` both use the
  Turbopack default (no `--webpack` flag). Webpack is opt-in only; there is no
  `webpack` config in `next.config.ts`. `components/editor/editor-error-boundary.tsx`
  uses `catchError` from `next/error` (16.3).

## 16.x traps (changed vs training data)

- **`params`, `searchParams`, `cookies()`, `headers()`, `draftMode()` are async**
  in the App Router. `await` them. `params` is a `Promise` — destructure after
  awaiting (e.g. `const { projectId } = await params`).
- **`useSearchParams()`** requires a Suspense boundary — wrap consumers in
  `<Suspense>` or the route opts out of static rendering.
- **`middleware` is deprecated** → use `proxy`, except when the Edge runtime is
  required (proxy is Node.js-only; `runtime` cannot be set in proxy files).
  **`unstable_` prefixes are gone** from stabilized APIs (e.g.
  `export const unstable_allowDynamic`).
- **Turbopack is the default bundler** for `next dev` and `next build`. Webpack
  is opt-in via `--webpack` and unused in this project.

## 16.3 feature map

- **`catchError` from `next/error`** — programmatic component-level error
  boundary (alternative to `error.js`). Works with `notFound()`/`redirect()`
  and hands the fallback a `retry()` that re-renders children in a Transition.
  Only usable in Client Components.
- **`next/root-params`** — getter functions for root dynamic segments (e.g.
  `import { lang } from 'next/root-params'`) callable from any Server Component
  without prop drilling. Not usable in Client Components, Server Actions, or
  Route Handlers.
- **`'use cache'` / Cache Components** — explicit, composable caching primitive.
  Opt-in via `next.config.ts` `cacheComponents: true`; not enabled here.
- **Partial Prefetching / Instant Navigations** — opt-in suite
  (`partialPrefetching: true`): per-route loading shells, prefetch reuse,
  `export const instant = false` to block, `@next/playwright` `instant()` test
  helper, Navigation Inspector. Not enabled here; adopting it is a deliberate
  project decision.
- **ISR shells** — with Cache Components, a URL omitted from
  `generateStaticParams` serves an instant loading shell on first visit.
- **`import.meta.glob`** — Vite-compatible glob import (Turbopack) for loading
  multiple modules with HMR.
- **Default wins, no code change:** Turbopack dev memory eviction, filesystem
  build cache, native Node.js streams for SSR, prefetch inlining.

## Verification

- `npm run lint`, `npm run typecheck`, `npm run build` before considering a
  change done.
- Integration tests: `npm run test:integration` (vitest). E2E: `npm test`
  (Playwright, `*.spec.ts`).
- Refer to `context/code-standards.md` for repo-wide TypeScript/component
  standards.
