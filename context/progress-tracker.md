# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 1: Design System → Auth → Prisma

## Current Goal

- Implement feature spec 05-prisma.md (Prisma models, client singleton, first migration)

## Completed

- Context system initialized (all 6 context files)
- **01-design-system** — shadcn/ui initialized with CSS variables, dark theme, cn helper, lucide-react
  - Components: button, card, input, tabs, scroll-area, textarea, dialog
  - Dark theme via `.dark` class on `<html>` in layout.tsx
  - `lib/utils.ts` with `cn` class merge helper
  - All dependencies listed in package.json
  - `npm run lint` and `tsc --noEmit` pass clean
- **02-editor** — base chrome components:
  - `components/editor/editor-navbar.tsx` — fixed top navbar, sidebar toggle with PanelLeftOpen/PanelLeftClose icons
  - `components/editor/project-sidebar.tsx` — floating left sidebar with Projects header, My Projects/Shared tabs, New Project button
  - `components/editor/dialog-pattern.tsx` — re-exports dialog primitives for future use
  - `tsc --noEmit` and `npm run lint` pass clean
- **03-auth** — Clerk authentication wired into the app:
  - `@clerk/ui` installed for theme components
  - `proxy.ts` at project root with `createRouteMatcher` — public routes: sign-in, sign-up; all others protected via `auth.protect()`
  - `ClerkProvider` wraps root layout with Clerk's `dark` theme, CSS variable overrides (no hardcoded colors)
  - `app/(auth)/sign-in/page.tsx` — two-panel layout on large screens (left: branding/feature list, right: Clerk form), form-only on small screens
  - `app/(auth)/sign-up/page.tsx` — same two-panel layout pattern
  - `app/(auth)/layout.tsx` — passthrough layout so auth pages skip EditorShell chrome
  - `components/editor/editor-shell.tsx` — detects auth routes via `usePathname` and skips navbar/sidebar rendering
  - `components/editor/editor-navbar.tsx` — right section includes Clerk `UserButton` for profile/logout
  - `app/page.tsx` — server component: authenticated → `/editor`, unauthenticated → `/sign-in`
  - `app/editor/page.tsx` — placeholder editor page
  - `npm run build` passes clean
- **04-project-dialogs** — Editor home + project dialogs + sidebar actions:
  - `components/editor/use-project-dialogs.ts` — hook managing dialog state, form state, loading state, mock data
  - `components/editor/project-dialogs-context.tsx` — React context so children can access dialog actions
  - `components/editor/create-project-dialog.tsx` — name input with live slug preview
  - `components/editor/rename-project-dialog.tsx` — prefilled name input, current name in description, Enter submits, auto-focus
  - `components/editor/delete-project-dialog.tsx` — destructive confirmation, descriptive text, no input
  - `components/editor/editor-home.tsx` — centered heading, description, New Project button
  - `components/editor/project-sidebar.tsx` — rename/delete actions on owned projects only, hidden for shared, mobile backdrop scrim
  - `components/editor/editor-shell.tsx` — wires all dialogs, sidebar actions, and editor home together
  - `app/editor/page.tsx` — renders EditorShell with EditorHome content
  - `tsc --noEmit` and `npm run lint` pass clean
- **05-prisma** — Prisma ORM models, client singleton, migration:
  - `prisma/models/project.prisma` — `Project` model (ownerId, name, description, status enum DRAFT/ACTIVED, canvasJsonPath, timestamps, indexes on ownerId + createdAt) and `ProjectCollaborator` model (cascade delete on project, email, timestamps, unique constraint on projectId+email, indexes on email + projectId/createdAt)
  - `lib/prisma.ts` — cached Prisma singleton branching by `DATABASE_URL`: Accelerate for `prisma+postgres://`, direct `@prisma/adapter-pg` otherwise; global caching for dev hot-reloads
  - `prisma/migrations/20260615130204_add_project_models/` — first migration generated and applied successfully
  - Prisma client generated to `app/generated/prisma/` with both models present
  - `tsc --noEmit` passes clean
- **06-project-apis** — Backend API routes for project CRUD:
  - `app/api/projects/route.ts` — GET (list with cursor pagination, orderBy createdAt desc) + POST (create with input validation, name defaulting)
  - `app/api/projects/[projectId]/route.ts` — PATCH (rename with ownership check, 404-before-403) + DELETE (existence check before ownership to prevent ID enumeration)
  - All routes use `auth()` from `@clerk/nextjs/server` for userId extraction
  - 401 for unauthenticated, 403 for non-owner mutations, 400 for invalid input
  - `npm run build` passes clean
- **07-wire-editor-home** — Wired editor home sidebar and dialogs to real project API:
  - `lib/get-projects.ts` — server-only data helper fetching owned + shared projects via Prisma
  - `hooks/use-project-actions.ts` — hook managing dialog state + real API mutations (create/rename/delete)
    - Create: manages name input, generates unique suffix, shows room ID preview, calls POST, navigates to workspace
    - Rename: pre-fills current name, calls PATCH, refreshes on success
    - Delete: shows project name, calls DELETE, redirects to `/editor` if deleting active workspace
  - `components/editor/project-actions-context.tsx` — context provider wrapping EditorShell
  - `components/editor/editor-shell.tsx` — accepts owned/shared projects, wires new provider + hook
  - `components/editor/project-sidebar.tsx` — accepts real project data as props (no more mock data)
  - `components/editor/create-project-dialog.tsx` — shows room ID preview (slug + suffix)
  - `components/editor/editor-page-content.tsx` — extracted client component for editor home
  - `app/editor/page.tsx` — server component fetching projects via getProjects()
  - `app/editor/[projectId]/page.tsx` — workspace route for post-creation navigation
  - `app/(app)/layout.tsx` — updated to pass projects to EditorShell
  - Removed old mock files: `use-project-dialogs.ts`, `project-dialogs-context.tsx`
  - `tsc --noEmit`, `npm run lint`, and `npm run build` pass clean

## In Progress

- None

## Next Up

- 08+ feature specs (TBD)
- Fill in project-overview.md with actual project details
- Fill in architecture.md with technology stack and decisions
- Fill in ui-context.md with design tokens and conventions

## Open Questions

- What is the project name and core product?
- What is the technology stack?
- What are the core user flows?

## Architecture Decisions

- Route protection uses `proxy.ts` (not `middleware.ts`) at project root
- Auth pages use `(auth)` route group to opt out of `EditorShell` chrome
- Clerk dark theme variables mapped to app CSS custom properties — no hardcoded hex values
- Prisma client output to `app/generated/prisma/` (Prisma v7 convention)
- Prisma client singleton uses separate global caches for direct vs Accelerate clients in dev

## Session Notes

- 2026-06-01: Context system initialized from Six-File Context playbook templates. Awaiting project-specific content.
- 2026-06-11: **02-editor** complete — base chrome components
- 2026-06-11: **03-auth** complete — Clerk auth fully wired with route protection, themed auth pages, UserButton in navbar
- 2026-06-15: **05-prisma** complete — models, singleton client, migration, client generation all verified
- 2026-06-17: **07-wire-editor-home** complete — wired editor home to real project API (note: spec review step was skipped during implementation — corrective feedback has been saved)