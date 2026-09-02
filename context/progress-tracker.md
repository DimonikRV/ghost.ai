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

## Completed (this session)

- **23-ci-cd-hardening** — CI/CD pipeline hardening (P0→P1→P2):
  - P0-1: reproducible installs — `npm ci --no-audit --no-fund` in ci.yml, cd.yml (migrate/trigger-deploy), Dockerfile deps stage; package-lock.json verified in sync
  - P0-2: least privilege — `permissions: contents: read` top-level in ci.yml, per-job in cd.yml (build-push adds `packages: write`)
  - P0-3: e2e against production build — `playwright.config.ts` `webServer.command: npm run start` + `NODE_ENV=production`/`PORT` env
  - P1-4: `trigger-deploy.needs: [build-push, migrate]`
  - P1-5/6: `docker-compose.yml` image `ghcr.io/dimonikrv/ghost-pilot:${GHOST_PILOT_TAG:-latest}`; cd.yml deploy job rewritten (PREV_TAG capture from running container image, 48×5s healthcheck wait, rollback + exit 1 on failure); build-push emits `sha_tag` output + pushes short `sha-<7>` tag
  - P1-7: ci.yml split into parallel lint/typecheck/test/build/e2e/notify jobs with npm/next/playwright caches, `.next` artifact upload/download, Playwright report upload on failure/cancelled
  - P2-7: `.github/dependabot.yml`, `.nvmrc` (24), `.github/CODEOWNERS` (@DimonikRV)
  - P2-8: all third-party actions SHA-pinned (checkout/setup-node/cache/upload-artifact/download-artifact/setup-buildx/login/metadata/build-push/ssh-action/action-slack)
  - P2-9: `scripts/prune-ghcr.sh` + `.github/workflows/ghcr-prune.yml` (weekly, secret-gated); removed `util-linux`/`procps` from Dockerfile
  - P2-10: Slack `notify` jobs in ci.yml + cd.yml (8398a7/action-slack SHA-pinned, secret-gated)
  - Docs synced: `.github/instructions/ci-cd.instructions.md` rewritten, devops-docker.instructions.md, AGENTS.md DevOps section, `.agents/skills/ci-cd/SKILL.md`, `.agents/skills/devops/SKILL.md`
  - Spec: `context/feature-specs/23-ci-cd-hardening.md`

- **24-test-coverage** — Test coverage enhancement to 80% (Verification gates all green):
  - Spec: `context/feature-specs/24-test-coverage.md` → Marked Complete
  - `vitest.config.ts` — v8 coverage provider with thresholds: lines 80%, branches 70%, functions 65%, statements 80%
  - `tests/unit/lib/export/` — added `frameworks.test.ts`, `mermaid.test.ts`, `plantuml.test.ts`, `json.test.ts`, `image.test.ts`, `download.test.ts`, `scaffold-prompt.test.ts` → `lib/export/*` now 100% line coverage
  - `tests/components/export-dialog.test.tsx` — dialog render, all 10 frameworks, selection highlight, generate-disabled, and Mermaid/PlantUML/JSON/PNG/SVG export-path coverage (lifted `components/editor/export-dialog.tsx` from 0%)
  - `tests/integration/helpers.ts` + `tests/fixtures/factories.ts` — `cleanupTestData()` also cleans `exportRun` + `taskRun`
  - `context/code-standards.md` — added `## Testing` conventions section (verify item 13)
  - Final coverage: statements **80.21%**, lines **82.02%**, branches **71.02%**, functions **72.72%** (all thresholds met, exit 0)
  - Full suite: 462 tests / 55 files pass (unit + components + integration incl. export)
  - `npm run lint` (0 errors), `npx tsc --noEmit`, and `NODE_ENV=production npm run build` all pass
  - Note: `next build` fails under a shell-exported `NODE_ENV=development` on `/_global-error` prerender (known Next 16 bug); local verification uses `NODE_ENV=production` (matches CI, which does not override it)
  - Resolved pre-existing spec-25 blockers encountered while reaching coverage targets: prisma default imports + `logger`/`ctx.run.id` in `trigger/code-export.ts`, `export-dialog.tsx` TDZ/typing fixes, `@ai-sdk/google` pinned `3.0.119` (matches `ai@6.0.257`'s `@ai-sdk/provider@3.0.15`), `export_runs` table applied to shared DB

- **19-presence-avatars-cursor** — live room participant avatars + cursors in the editor canvas view (was implemented in code but never formally tracked):
  - Spec: `context/feature-specs/19-presence-avatars-cursor.md` → Marked Complete (reconciled)
  - `components/editor/presence-avatars.tsx` — `PresenceAvatars` client component: `useOthers()` + Clerk `useUser()`, filters/deduplicates by `other.info?.userId !== user?.id`, up to 5 overlapping avatars (`-space-x-2.5`, `h-8 w-8`, `ring-2 ring-background`) with initials fallback, `+N` overflow chip, divider (`h-5 w-px bg-border`) only when collaborators exist, and separate Clerk `UserButton` at the same size; display-only (not interactive)
  - `components/editor/workspace-shell.tsx` — renders `<PresenceAvatars />` in the workspace navbar (canvas room view only), lifts Liveblocks providers so it can use `useOthers()`
  - `components/editor/canvas.tsx` — `<Cursors />` from `@liveblocks/react-flow` for other participants only; broadcasts cursor via `useUpdateMyPresence` on `onMouseMove` (`screenToFlowPosition`), clears to `null` on mouse leave
  - `liveblocks.config.ts` — Presence `{ cursor: { x, y } | null, thinking: boolean }`; UserMeta `cursorColor` + `name`/`color` per spec
  - Spec checklist verified against code (cursors, filtering, current-user exclusion, 5-avatar stack, +N chip, divider, UserButton separation)

- **22-design-agent-api** — Design Agent Trigger.dev backend wiring (was implemented in code but never formally tracked):
  - Spec: `context/feature-specs/22-design-agent-api.md` → Marked Complete (reconciled)
  - `prisma/models/task-run.prisma` — `TaskRun` model (cuid id, unique indexed `runId`, `task`, `projectId`, `userId`, `createdAt`; compound `[userId, projectId]` index)
  - `trigger/design-agent.ts` — `designAgent` task (`@trigger.dev/sdk` `schemaTask()`), id `design-agent`, payload `{ prompt, roomId }`, retry 3/2/1000/10000. AI generation implemented now: `generateObject()` with `google("gemini-2.5-flash")` + Zod schema (nodes `canvasNode` with label/color/shape/position + edges `canvasEdge` with optional label), anchored to `DiagramNode`/`DiagramEdge` shape, drops dangling edges, returns `{ status: "completed", nodes, edges }`
  - `app/api/ai/design/route.ts` — POST `{ prompt, roomId }`, validates prompt (required, non-empty, ≤4000 chars, 400), `checkProjectAccess` (403), triggers via `tasks.trigger`, creates `TaskRun` on success, 502 on trigger failure (no record), 401 unauthenticated
  - `app/api/ai/design/token/route.ts` — POST `{ runId }`, looks up `TaskRun` (404), verifies `taskRun.userId === userId` (403), returns run-scoped `auth.createPublicToken`, 401 unauthenticated

- **25-code-export** — Diagram formats (Mermaid, PlantUML, PNG, SVG, JSON) + AI code scaffolds (10 frameworks)(was implemented in code but never formally tracked):
  - Spec: `context/feature-specs/25-code-export.md` → Marked Complete (reconciled)
  - `lib/export/` — `download.ts` (`downloadFile`), `mermaid.ts` (`graphToMermaid`, 6-shape mapping + edges), `plantuml.ts` (`graphToPlantUml`), `image.ts` (`exportToPng`/`exportToSvg` via `html-to-image`), `json.ts`, `frameworks.ts` (10 `FRAMEWORKS` + `getFramework`), `scaffold-prompt.ts` (`buildSystemPrompt` + `buildGraphDescription`)
  - `prisma/models/export-run.prisma` — `ExportRun` model (runId unique, projectId, userId, framework, status, blobUrl, timestamps) + `export_runs` migration
  - `trigger/code-export.ts` — `codeExport` task: framework lookup, `generateObject()` with `google("gemini-2.5-flash")` + Zod `{ files: [{ path, content }] }`, JSZip ZIP, upload to Vercel Blob, marks `ExportRun` completed/failed
  - `app/api/export/code/route.ts` — POST: 401/400/403/404 (no saved canvas)/502 flow, triggers task, creates `ExportRun`
  - `app/api/export/code/[runId]/token/route.ts` — POST run-scoped public token with ownership check
  - `app/api/export/code/[runId]/download/route.ts` — GET streams ZIP from Blob with ownership + status checks
  - `components/editor/export-dialog.tsx` + `canvas-control-bar.tsx` (Export button, `Download` icon) + `react-flow-wrapper-ref-context.tsx` + `workspace-shell.tsx` wiring — export dialog with diagram format buttons + framework grid + progress
  - Tests: `tests/unit/lib/export/{mermaid,plantuml,frameworks,json,image,download,scaffold-prompt}.test.ts`, `tests/components/export-dialog.test.tsx`, `tests/integration/api/export/{code,download}.test.ts` (landed with spec-24 coverage work)

## Completed (this session) (older)

- **21-canvas-autosave** — autosave and loading for collaborative canvas via Vercel Blob:
  - `@vercel/blob` installed as dependency
  - Reused existing `canvasJsonPath` field on `Project` model for storing blob URL (no migration)
  - `app/api/projects/[projectId]/canvas/route.ts` — combined PUT + GET route:
    - PUT: accepts `{ nodes, edges }`, serializes to JSON, uploads to Vercel Blob with project-scoped key, stores URL in Prisma
    - GET: reads blob URL from Prisma, fetches JSON from Vercel Blob, returns parsed canvas state; returns empty arrays if no saved state
    - Both routes gated with `auth()` + `checkProjectAccess()`, proper 401/403/404/500 responses
  - `hooks/use-canvas-autosave.ts` — autosave hook:
    - Accepts `projectId`, `nodes`, `edges` parameters
    - 2-second debounce via `setTimeout` with cleanup on unmount
    - Exposes save status: `'idle' | 'saving' | 'saved' | 'error'`
    - Uses refs to always read latest nodes/edges in debounced callback
  - `components/editor/canvas.tsx` — wired autosave + load-saved-state:
    - `useCanvasAutosave` hook called with canvas nodes/edges
    - Save status reported to parent via `onStatusChange` callback
    - On init: checks if Liveblocks room is empty; if so, fetches saved state from GET canvas API and loads via `setNodes`/`setEdges`
    - Skip load if room already has nodes/edges to avoid overwriting active collaboration
  - `components/editor/live-canvas.tsx` — passes `projectId` and consumes `CanvasSaveStatusContext` for status callback
  - `components/editor/workspace-shell.tsx` — save status indicator in navbar:
    - `CanvasSaveStatusContext` created and provided around children
    - Small text badge between AI toggle and PresenceAvatars: "Saving…", "Saved", or "Error" with appropriate color classes
  - `npm run build` passes clean

- **20-ai-sidebar-shell** — AI sidebar component with tabs, chat UI, and specs tab:
  - `components/editor/ai-sidebar.tsx` — new component extracted from placeholder:
    - **Floating right sidebar**: `fixed top-12 right-0 bottom-0 z-30 w-80`, `bg-card/95`, `border-l border-border`, `shadow-lg`
    - **Slide animation**: transition-based (`translate-x-full` ↔ `translate-x-0`, `duration-200`) instead of conditional mount/unmount
    - **Mobile backdrop scrim**: `fixed inset-0 z-20 bg-black/20 md:bg-black/0`, click to close
    - **Header**: Bot icon (accent-brand), "AI Workspace" title, "Collaborate with Ghost AI" subtitle, close button
    - **Tabbed layout**: shadcn Tabs with "AI Architect" and "Specs" tabs
    - **AI Architect tab**:
      - ScrollArea for chat messages
      - Empty state: Bot icon, description, 3 starter prompt chips (`bg-muted`, `text-accent-foreground`)
      - Starter chips: "Design an e-commerce backend", "Create a chat app architecture", "Build a CI/CD pipeline"
      - User messages: right-aligned, `bg-accent-brand/20 border-accent-brand/50 border-2 text-foreground`
      - Assistant messages: left-aligned, `bg-card border border-border text-accent-foreground`
      - Auto-resizing Textarea (72px min, 160px max height)
      - Send button: `bg-accent-brand text-white`, Enter submits, Shift+Enter newline
    - **Specs tab**:
      - "Generate Spec" button (`bg-accent-brand text-white`)
      - Demo spec card (`bg-card`, `border-border`) with FileText icon, title, snippet, disabled Download action
  - `components/editor/workspace-shell.tsx` — replaced inline placeholder with `<AiSidebar>` component, wired `aiSidebarOpen`/`onClose` props, mounted behind `mounted` guard
  - `tsc --noEmit` passes clean, lint clean on new/changed files

## Completed (this session)

- **20-ai-sidebar-shell** — spec review completed:
  - Replaced 11 non-existent CSS tokens with actual shadcn/theme tokens
  - Added transition-based animation spec (was conditional mount/unmount)
  - Added mobile backdrop scrim for consistency with ProjectSidebar
  - Fixed button colors: `bg-accent` → `bg-accent-brand` for visibility
  - Clarified component API: `isOpen`/`onClose` props matching ProjectSidebar pattern

## Completed (this session)

- **18-starter-template** — starter template library + import flow:
  - `components/editor/starter-templates.ts` — template data layer:
    - `CanvasTemplate` type with `id`, `name`, `description`, `nodes`, `edges`
    - `DiagramNode` and `DiagramEdge` types for template structure
    - `CANVAS_TEMPLATES` array with 3 templates: Microservices Architecture, CI/CD Pipeline, Event-Driven System
    - Each template uses existing shape types and CSS color tokens
    - Small helper functions (`node()`, `edge()`) for readable template data
  - `components/editor/starter-templates-modal.tsx` — template selection dialog:
    - Opens as a Dialog with scrollable grid layout
    - Template cards show name, description, and lightweight SVG preview
    - Preview calculates bounds from node positions, draws edges as lines, nodes as rects with labels
    - Import button calls `onImport` with selected template, then closes
  - `components/editor/help-dialog.tsx` — "Getting Started" documentation:
    - Dialog with scrollable content covering: importing templates, available templates, tips & best practices
    - Lists each template with node/edge counts and descriptions
  - `components/editor/canvas-control-bar.tsx` — extended with:
    - "Templates..." button with LayoutGrid icon
    - Help (?) button with CircleHelp icon for accessing documentation
  - `components/editor/canvas.tsx` — wired template import:
    - `setNodes`/`setEdges` from `useReactFlow` for canvas replacement
    - `handleImportTemplate` callback creates new canvas with template nodes/edges at (0, 0)
    - No merging — replaces current canvas data entirely
    - No undo/redo support for import (one-time action per spec)
    - `StarterTemplatesModal` and `HelpDialog` rendered within canvas component
  - `npm run build` passes clean

## Completed (this session)

- **17-canvas-ergonomics** — floating control bar + keyboard shortcuts:
  - `hooks/useKeyboardShortcuts.ts` — hook for canvas keyboard shortcuts:
    - `+`/`=` zoom in, `-` zoom out (no modifier)
    - `Cmd/Ctrl+Z` undo, `Cmd/Ctrl+Shift+Z` redo
    - `Cmd/Ctrl+Y` fit view
    - Ignores shortcuts while typing in inputs, textareas, or contentEditable elements
  - `components/editor/canvas-control-bar.tsx` — pill-shaped control bar at bottom-left:
    - Zoom group: zoom out, fit view, zoom in buttons
    - History group: undo, redo buttons with `canUndo`/`canRedo` disable state
    - Disabled buttons visually dimmed (`opacity-40 pointer-events-none`)
  - `components/editor/canvas.tsx` — wired control bar + keyboard shortcuts:
    - `useReactFlow` instance for zoom in/out, fit view (300ms animation)
    - `useUndo`/`useRedo`/`useCanUndo`/`useCanRedo` from `@liveblocks/react` for history
    - `useKeyboardShortcuts` hooks into window-level keydown events
    - Control bar rendered absolute bottom-left with `relative` wrapper on canvas container
  - `npm run build` passes clean

- **16-edge-behavior** — custom edges with connection handles, right-angle routing, inline labels:
  - `components/editor/canvas.tsx` — extended with:
    - **Handle styling**: `HandleStyle` component — subtle 8px dots with dark border, hidden by default (`opacity: 0`), fade in on node hover (`opacity: 1` via `onMouseEnter`/`onMouseLeave`)
    - **Custom edge renderer** (`CanvasEdge`): uses `getSmoothStepPath` for right-angle routing with 16px border radius
    - **Edge dim/brighten**: light stroke (`var(--color-border)`) at 50% opacity at rest, brightens to `var(--color-foreground)` at 100% on hover
    - **Thick hit area**: invisible 20px stroke-width path overlay for easier hover/click without increasing visible line thickness
    - **Arrowhead**: `defaultEdgeOptions.markerEnd` with `arrowclosed` type (16×16)
    - **Inline edge labels**: `EdgeLabelRenderer` + `getSmoothStepPath` midpoint coordinates — no manual calculation
    - **Edge label editing**: double-click edge to edit label in place, auto-sizing input, Escape to cancel, blur to commit
    - **Collaborative sync**: edge label updates via `updateEdge` on every keystroke, syncs via Liveblocks Storage
    - **Edge type wiring**: `edgeTypes` map with `canvasEdge` → `CanvasEdge`, `defaultEdgeOptions.type` ensures new connections use custom renderer
  - `tsc --noEmit` passes clean

- **15-nodes-color-toolbar** — floating color toolbar for selected nodes:
  - `types/canvas.ts` — extended `CanvasNodeData` with `bgColor?` and `textColor?` fields; added `NODE_COLOR_PALETTE` constant with 5 predefined color pairs using CSS variable tokens (slate, accent, muted, secondary, destructive)
  - `components/editor/canvas.tsx` — extended CanvasNode with:
    - **Color rendering**: `CssShape` and `SvgShape` now accept `backgroundColor` prop (defaulting to `var(--color-card)`), replacing hardcoded `var(--color-card)` fills
    - **Text color**: label span uses resolved `textColor` from node data instead of hardcoded `text-foreground`
    - **NodeToolbar**: floating toolbar above selected nodes using `@xyflow/react`'s built-in `NodeToolbar` component — viewport-aware positioning, no custom positioning needed
    - **Color swatches**: one button per palette entry showing the background color; active swatch has border + tight glow (box-shadow) matching its text color
    - **Pointer event isolation**: `onPointerDown` stopPropagation on toolbar wrapper prevents canvas drag/pan during swatch interactions
    - **Collaborative sync**: swatch click calls `updateNode` to set `bgColor`+`textColor` on node data — syncs via Liveblocks Storage
    - **Editing exclusion**: toolbar hidden when node is in label-editing mode (`isVisible={selected && !isEditing}`)
  - `tsc --noEmit` passes clean

- **14-node-editing** — resizing + inline label editing on canvas nodes:
  - `components/editor/canvas.tsx` — extended CanvasNode with:
    - **Resizing**: `NodeResizer` from `@xyflow/react` shows handles only on selected nodes, hidden during label editing
    - Minimum dimensions enforced (60×40) — nodes can't shrink below this
    - Subtle handle styling: small rounded squares with border matching theme
    - Resize updates node width/height in data via `updateNode` on every resize tick
    - **Inline label editing**: double-click label area to activate editing
    - Centered textarea overlay positioned over the node shape
    - Placeholder text ("Double-click to edit") when label is empty
    - Label updates live as user types via `updateNode` — collaborative sync
    - Editing closes on blur or Escape key (Escape restores previous value)
    - `onMouseDown`/`onClick` stopPropagation on textarea prevents canvas drag/pan
    - `LabelEditingContext` communicates editing state from node to Canvas
    - `panOnDrag` disabled on ReactFlow when any node is being edited
  - `npm run build` passes clean

- **13-node-shape** — proper shape rendering + drag preview + connection handles:
  - `components/editor/canvas.tsx` — replaced placeholder CanvasNode with shape-aware rendering:
    - CSS shapes (rectangle, pill, circle) via `border-radius` on div elements
    - SVG shapes (diamond, hexagon, cylinder) via inline SVG with proportional scaling
    - Borders subtle at rest (`var(--color-border)`), brighter when selected (`var(--color-foreground)`)
    - Node dimensions passed via `data` instead of `style` for type safety
    - **Added `Handle` components** (both source + target at each cardinal point) for full bidirectional connectivity — required by `@liveblocks/react-flow` multiplayer pattern
    - **Added `connectionLineStyle`** with `--color-foreground` stroke so the animated connection line is visible on dark theme
    - Removed unnecessary `onConnect as OnConnect` cast per Liveblocks reference
  - `components/editor/shape-panel.tsx` — added ghost drag preview:
    - `GhostPreview` component renders scaled (0.6x) shape matching the dragged type
    - CSS shapes use dashed border + `border-radius`; SVG shapes use dashed strokes
    - Preview follows cursor via global `dragover` listener, hidden on `dragend`/`drop`
    - Preview uses same shape type and default dimensions that will be used on drop
  - `tsc --noEmit` passes clean

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

## Current Work

- AI Architect tab client wiring complete: `AiSidebar.handleSend` posts to `/api/ai/design`, polls the new `/api/ai/design/[runId]/result` route (server-side `runs.retrieve`, 409 while processing / 200 with `{nodes,edges}` / 500 on failure), then applies the diagram to the canvas via an `ApplyDiagramContext` registered by `Canvas` (extracted reusable apply logic from `handleImportTemplate`). `WorkspaceShell` provides both `RegisterApplyDiagramContext`/`ApplyDiagramContext` and passes `projectId` to `AiSidebar` (`roomId`). No-projectId path replies with a placeholder assistant message (keeps existing component tests green).
- Dependency alignment: `@ai-sdk/google` pinned `4.0.51 → 3.0.119` (was `^4.0.51`), restoring `@ai-sdk/provider@3.0.15` / `provider-utils@4.0.50`; full `tsc --noEmit` now 0 errors (was 1 pre-existing error in `trigger/code-export.ts:50`). `package.json` + `package-lock.json` in sync; Trigger.dev dev worker rebuilt + re-indexed.

## Next Up

- Remaining feature specs (TBD) — see `context/feature-specs/` for the next `NN-*.md` spec

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

- 2026-09-01: **AI Architect tab client wiring**:
  - Added `ApplyDiagramContext` + `RegisterApplyDiagramContext` (+ `useApplyDiagram`/`useRegisterApplyDiagram` hooks) to `components/editor/react-flow-wrapper-ref-context.tsx`, mirroring the existing `RegisterWrapperRefContext`/`ExportDialogContext` pattern.
  - `Canvas` now extracts reusable apply logic from `handleImportTemplate` into `handleApplyDiagram` and registers it via `useRegisterApplyDiagram` (removes+adds on change events so Liveblocks Storage syncs).
  - New `GET /api/ai/design/[runId]/result` route: Clerk auth (401) → `TaskRun` lookup (404) → ownership check (403) → `runs.retrieve(runId)`; completed → 200 `{status:"completed", nodes, edges}`; still running → 409; failed/cancelled → 500. Server-side `runs.retrieve` uses `getEnvVar` (reads `TRIGGER_SECRET_KEY` from `.env.local`) — no client baseURL config needed.
  - `AiSidebar` wired: optional `projectId` prop; `handleSend` POSTs `{prompt, roomId: projectId}` to `/api/ai/design`, then `pollForResult` (1.5s interval, 120s timeout) on the result route, applies diagram via `useApplyDiagram`, renders loading bubble (`Loader2`) while generating, assistant summary/error bubbles after; concurrency gating only when `projectId` present (keeps no-projectId test path synchronous). `handleStarterClick` now routes through `handleSend(prompt)`.
  - `WorkspaceShell` provides `RegisterApplyDiagramContext` (around `<main>`/canvas children) + `ApplyDiagramContext` (around `<AiSidebar>`) and passes `projectId={project.id}`.
  - Tests: `tests/components/ai-sidebar.test.tsx` extended (loading indicator, applyDiagram called with nodes/edges, error bubble; 24 total passing); new `tests/integration/ai-design-result.test.ts` (401/404/403/200/409/500; 6 passing).
  - Verified: full `tsc --noEmit` 0 errors, ESLint clean, component suite 237 passing, ai/design integration suite 36 passing (ai-design + token + result + sidebar).
- 2026-09-01: **design-agent AI generation + dependency reconciliation**:
  - Implemented real AI generation in `trigger/design-agent.ts` (was placeholder): `schemaTask` payload `{ prompt, roomId }`, `generateObject()` with `google("gemini-2.5-flash")` + Zod `diagramSchema` (nodes `canvasNode` {label, color, shape, position, optional width/height}, edges `canvasEdge` with optional label), anchored to existing `DiagramNode`/`DiagramEdge` types; system prompt maps the 6 `ShapeType`s + `NODE_COLOR_PALETTE` tokens to semantic roles; drops dangling edges; returns `{ status, nodes, edges }`; enableConsoleLogging via `logger.info`
  - Fixed pre-existing typecheck error: `@ai-sdk/google` was `^4.0.51` (needs `@ai-sdk/provider@4.x`, model spec v4) incompatible with `ai@6.0.266` (`@ai-sdk/provider@3.0.15`, spec v2/v3) → `code-export.ts:50` TS2322. Pinned `@ai-sdk/google@3.0.119` exact; restored `@ai-sdk/provider@3.0.15` + `@ai-sdk/provider-utils@4.0.50`; `package-lock.json` regenerated clean; full `tsc --noEmit` now 0 errors (was 1 pre-existing)
  - Verified: `npx tsc --noEmit -p tsconfig.json` 0 errors, `npx eslint trigger/design-agent.ts` clean, Trigger.dev dev worker rebuilt + indexed `20260901.7`
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