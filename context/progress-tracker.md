# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 2: Canvas + Shape Panel → Liveblocks collaboration

## Current Goal

- Implement feature specs 11-base-canvas and 12-shape-panel

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

## Completed (this session)

- **11-base-canvas** — Liveblocks-backed React Flow canvas:
  - `types/canvas.ts` — shared canvas types: `ShapeType`, `CanvasNodeData`, `CanvasNodeTypes`, `CanvasEdgeTypes`
  - `components/editor/canvas.tsx` — React Flow canvas wired to Liveblocks state via `useLiveblocksFlow`:
    - starts with empty nodes and edges
    - loose connection behavior, `fitView`, dot-pattern background
    - `MiniMap` and `Controls` included
    - custom node type `canvasNode` renders as bordered rectangle with centered label
  - `components/editor/live-canvas.tsx` — client wrapper with `LiveblocksProvider`, `RoomProvider`, `ClientSideSuspense` loading fallback
  - `app/editor/[projectId]/page.tsx` — replaced canvas placeholder with `<LiveCanvas projectId={project.id} />`
  - `npm run build` passes clean
- **12-shape-panel** — bottom shape panel for drag-to-create nodes:
  - `components/editor/shape-panel.tsx` — floating pill-shaped toolbar at bottom-center of canvas:
    - draggable icon buttons for: rectangle, diamond, circle, pill, cylinder, hexagon
    - drag payload includes shape type and default dimensions (rectangles wider than tall, circles square, diamonds larger)
    - uses lucide-react icons: Square, Diamond, Circle, Pill, Cylinder, Hexagon
  - `components/editor/canvas.tsx` — extended with dragover/drop handling:
    - reads shape payload from drag data
    - converts screen position to canvas coordinates via `screenToFlowPosition`
    - creates new node with empty label, default color, dragged shape value
    - node IDs generated as `{shape}-{timestamp}-{counter}`
  - `components/editor/workspace-shell.tsx` — wired `<ShapePanel />` into workspace chrome
  - `npm run build` passes clean

## Completed (this session)

- **10-liveblocks** — Liveblocks realtime collaboration infrastructure:
  - `@liveblocks/node` added as dependency
  - `liveblocks.config.ts` — typed Presence (`cursor: { x, y }`, `isThinking`), UserMeta (`userId`, `displayName`, `avatarUrl`, `role`, `cursorColor`)
  - `lib/liveblocks.ts` — lazy-initialized `Liveblocks` node client singleton, `getUserCursorColor()` deterministic hash from 10-color palette
  - `POST /api/liveblocks-auth` — Clerk auth gate, project access check via `checkProjectAccess()`, `prepareSession` → `allow` → `authorize` flow, returns `{ token }`; 401/400/403/500 error responses
  - `npm run build` passes clean

## Next Up

- Remaining feature specs (TBD)
- Shape-specific node rendering (spec 12 scope limit — currently all shapes render as bordered rectangles)

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
- Canvas uses `@liveblocks/react-flow` with `useLiveblocksFlow` hook for Liveblocks-synced nodes/edges
- Canvas node IDs use `{shape}-{timestamp}-{counter}` format for uniqueness
- Shape drag uses native HTML5 drag-and-drop with `application/ghost-shape` data type

## Session Notes

- 2026-06-22: **11-base-canvas** + **12-shape-panel** complete:
  - Spec 11 was a prerequisite (not yet implemented) — implemented first
  - `types/canvas.ts` created for shared canvas types
  - `components/editor/canvas.tsx` — React Flow canvas with Liveblocks sync, drag-and-drop node creation, custom `canvasNode` type
  - `components/editor/live-canvas.tsx` — Liveblocks room provider wrapper
  - `components/editor/shape-panel.tsx` — floating bottom toolbar with 6 draggable shapes
  - `npm run build` passes clean
- 2026-06-01: Context system initialized from Six-File Context playbook templates. Awaiting project-specific content.
- 2026-06-11: **02-editor** complete — base chrome components
- 2026-06-11: **03-auth** complete — Clerk auth fully wired with route protection, themed auth pages, UserButton in navbar
- 2026-06-15: **05-prisma** complete — models, singleton client, migration, client generation all verified
- 2026-06-17: **07-wire-editor-home** complete — wired editor home to real project API (note: spec review step was skipped during implementation — corrective feedback has been saved)
- 2026-06-18: **08-editor-workspace-shell** complete — workspace shell with server-side access checks:
  - `lib/project-access.ts` — access helpers: `getCurrentIdentity()`, `checkProjectAccess()`, `getProjectWithAccess()`, `getProjectCollaboratorEmails()`
  - `components/editor/access-denied.tsx` — centered layout, lock icon, message, link to `/editor`
  - `components/editor/project-not-found.tsx` — centered layout, file-question icon, message, link to `/editor`
  - `components/editor/workspace-shell.tsx` — full-viewport workspace layout with project name navbar, share button, AI sidebar toggle, ProjectSidebar with active project highlight, canvas placeholder, AI chat placeholder
  - `components/editor/project-sidebar.tsx` — extended with `activeProjectId` prop for current room highlighting
  - `app/editor/[projectId]/page.tsx` — server component: unauthenticated → redirect `/sign-in`, no access → AccessDenied, not found → ProjectNotFound, has access → WorkspaceShell
  - `npm run lint` and `npm run build` pass clean
- 2026-06-18: **09-share-dialog** complete — share dialog with collaborator management:
  - `@clerk/backend` installed for Clerk user lookup by email
  - `app/api/projects/[projectId]/collaborators/route.ts` — GET (list with Clerk enrichment), POST (invite, owner-only, validates email format/duplicates/owner), DELETE (revoke, owner-only, by id or email)
  - `components/editor/share-dialog.tsx` — dialog with: email invite input (owner-only), collaborator list with avatar/name/email, remove button (owner-only), copy link with "Copied!" feedback (owner-only), read-only view for collaborators
  - `components/editor/workspace-shell.tsx` — wired Share button to open dialog, manages local state for share open/collaborators/loading/error, extends props with `isOwner` + `collaborators`
  - `app/editor/[projectId]/page.tsx` — passes `isOwner` and `collaborators` to WorkspaceShell from existing `getProjectWithAccess()` data
  - Clerk enrichment via `clerkClient.users.getUserList()` batch-fetches profiles (displayName from firstName/lastName/username, avatarUrl from imageUrl), falls back to email-only if not found
  - Validation: email format check, duplicate collaborator check (400), owner self-invite prevention (400), empty email check (400)
  - `npm run build` passes clean
- 2026-06-19: **10-liveblocks** complete — realtime collaboration infrastructure:
  - `@liveblocks/node` installed for server-side token generation
  - `liveblocks.config.ts` edited to define Presence and UserMeta types
  - `lib/liveblocks.ts` created with lazy-initialized client + deterministic cursor color helper
  - `POST /api/liveblocks-auth` created with Clerk auth + project access check + Liveblocks session token
  - Build passes clean
  - **Post-review correction**: switched from access tokens (`prepareSession` → `allow` → `authorize`) to ID tokens (`getOrCreateRoom` + `identifyUser`) per Liveblocks best practices; rooms now created explicitly with `defaultAccesses: []` and `usersAccesses` per role
- 2026-06-19: **Clerk review corrections** — applied findings from Clerk skill-gated review:
  - `proxy.ts` — added `async (auth, req)` + `await auth.protect()` per Clerk middleware strategies reference
  - `app/api/projects/[projectId]/collaborators/route.ts` — replaced `createClerkClient()` with `clerkClient()` from `@clerk/nextjs/server`; replaced duplicated GET access check with `checkProjectAccess()`
  - `context/feature-specs/03-auth.md` — documented `ClerkProvider` inside `<body>` requirement and `async/await` middleware pattern
  - `context/feature-specs/09-share-dialog.md` — documented `clerkClient()` and `checkProjectAccess()` usage patterns
  - Build passes clean
- 2026-06-19: **Deprecated package fix** — `@clerk/ui` was pinned at `0.3.24` (Core 2, pulls deprecated `@clerk/elements` + `@clerk/clerk-react`); regenerated `package-lock.json` to resolve `@clerk/ui@1.18.1` (Core 3). Deprecation warnings eliminated. Build passes clean.