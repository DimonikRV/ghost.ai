# Code Standards

## General

- Keep modules small and single-purpose
- Fix root causes, do not layer workarounds
- Do not mix unrelated concerns in one component or route
- Update context files when implementation changes architecture, scope, or standards

## TypeScript

- Strict mode enabled via `tsconfig.json`
- Avoid `any` — use explicit interfaces or narrowly scoped types
- Validate unknown external input at system boundaries before trusting it
- Export types explicitly when they cross module boundaries
- `use client` directive only at the top of client component files

## Next.js

- Next.js 16 (App Router). Read the version-matched docs in `node_modules/next/dist/docs/` before writing framework code — several APIs changed vs earlier versions
- Default to server components — add `"use client"` only when browser interactivity requires it
- Route handlers should be focused on a single responsibility
- Use route groups (`(auth)`, `(app)`) for layout separation, not for organization
- Pages in `app/` are server components unless marked `"use client"`
- Request APIs are async: `await` `params`, `searchParams`, `cookies()`, `headers()`, `draftMode()`
- Route protection lives in `proxy.ts` (the Next.js 16 replacement for `middleware.ts`)

## Styling

- Use CSS custom property tokens — no hardcoded hex values in components
- Follow the border radius scale defined in `globals.css` (`--radius-sm` through `--radius-4xl`)
- Tailwind utility classes preferred over inline styles
- Use `cn()` helper from `lib/utils.ts` for conditional class merging
- Dark theme via `.dark` class on `<html>` element — no separate dark mode files
- Brand color: `--color-accent-brand` (defined in `@theme inline` block)

## Components

- Client components in `components/` — use `"use client"` directive
- Server components in `app/` route files
- Editor chrome components in `components/editor/`
- shadcn primitives in `components/ui/` — never modify after installation
- Dialog components use `@base-ui/react` primitives via shadcn
- Props interfaces should be explicit and exported when consumed by other files

## Hooks

- Custom hooks in the same directory as their consumers (e.g., `components/editor/`)
- Hook return types should be explicitly typed and exported
- Use `useCallback` for stable function references passed to child components
- Use `useRef` + `useEffect` cleanup for timers and subscriptions

## File Organization

- `app/` — Next.js routes and layouts
- `components/ui/` — shadcn/ui primitives (generated)
- `components/editor/` — Editor chrome (navbar, sidebar, dialogs, hooks)
- `lib/` — Utility functions (`cn`, shared helpers)
- `context/` — Project documentation (specs, standards, progress)
- `.agents/skills/` — Installed agent skills
