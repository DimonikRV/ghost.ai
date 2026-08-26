# 24 — Test Coverage Enhancement

Establish comprehensive test coverage infrastructure and write tests across all
layers (unit, integration, component) to reach 80% line coverage. Add CI
coverage reporting with Codecov integration.

## Goal

Reach 80% line coverage across `app/`, `lib/`, `hooks/`, and `components/`.
Install `@testing-library/react` for component tests, configure Vitest
coverage with `@vitest/coverage-v8`, and upload coverage reports to Codecov
from CI.

## Non-Functional Requirements

- **Coverage target**: 80% lines, 70% branches, 65% functions, 80% statements.
  Functions threshold is lower (65%) because `canvas.tsx` (909 lines) has 61
  tightly-coupled ReactFlow internal functions (closures, component callbacks)
  that are unreachable without full ReactFlow/Liveblocks runtime context.
- **Frameworks**: Vitest for unit/integration/component tests; Playwright for
  E2E (unchanged).
- **CI**: coverage report uploaded as artifact and to Codecov on every PR.
- **Isolation**: unit tests hit no DB/HTTP; integration tests hit real Postgres
  with mocked auth/blob; component tests use jsdom with mocked external deps.

## Implementation

### 1. Install dependencies

```
npm i -D @testing-library/react @testing-library/jest-dom @testing-library/user-event jsdom @vitest/coverage-v8
```

### 2. Update `vitest.config.ts`

- Add `coverage` block with `provider: "v8"`, `include` covering
  `app/**/*.{ts,tsx}`, `lib/**/*.ts`, `hooks/**/*.ts`,
  `components/**/*.{ts,tsx}`.
- Set thresholds: `{ lines: 80, branches: 70, functions: 65, statements: 80 }`.
- Global `environment: "node"`. Component tests opt into jsdom via
  `// @vitest-environment jsdom` per-file directive.
- Add `tests/components/**/*.test.tsx` to `include` patterns.

### 3. Add npm scripts

```
"test:unit": "vitest run tests/unit"
"test:components": "vitest run tests/components"
"test:coverage": "vitest run --coverage"
"test:watch": "vitest watch"
```

### 4. Create test directory structure

```
tests/
  unit/              → Pure function tests (no DB, no HTTP)
  integration/       → API route handlers (existing + new)
  components/        → React component tests (new)
  fixtures/          → Shared test data factories (new)
```

### 5. Create `tests/fixtures/factories.ts`

Factory functions to eliminate repeated `prisma.project.create()` calls:

- `createTestProject(ownerId, name, overrides?)` — creates a Project with a
  unique `nameKey`.
- `createTestCollaborator(projectId, email)` — creates a ProjectCollaborator.
- `createTestTaskRun(projectId, userId, runId)` — creates a TaskRun record.
- `cleanupTestData()` — moves existing cleanup logic here from `helpers.ts`.

### 6. Update `tests/integration/setup.ts`

- Add `import "@testing-library/jest-dom/vitest"` for component matchers.
- Add Trigger.dev SDK mock:
  ```ts
  vi.mock("@trigger.dev/sdk", () => ({
    tasks: { trigger: vi.fn().mockResolvedValue({ id: "run_test" }) },
    auth: { createPublicToken: vi.fn().mockResolvedValue("tok_test") },
  }));
  ```
- Add Liveblocks Node mock:
  ```ts
  vi.mock("@liveblocks/node", () => ({
    Liveblocks: vi.fn().mockImplementation(() => ({
      prepareSession: vi.fn().mockReturnValue({
        allowSession: vi.fn().mockReturnValue({}),
      }),
      identifyUser: vi.fn(),
    })),
  }));
  ```

### 7. Unit tests — `lib/` modules

#### `tests/unit/project-access.test.ts`

Target: `lib/project-access.ts`

- `getCurrentIdentity()` returns userId and email from mocked Clerk auth.
- `checkProjectAccess()` allows owner access.
- `checkProjectAccess()` allows collaborator access (email match).
- `checkProjectAccess()` denies non-owner non-collaborator.
- `getProjectWithAccess()` returns project with access level.
- `getProjectCollaboratorEmails()` returns email list.

#### `tests/unit/get-projects.test.ts`

Target: `lib/get-projects.ts`

- Returns owned projects for the current user.
- Returns shared projects (where user is a collaborator).
- Combines owned + shared, ordered by `createdAt` desc.
- Returns empty array for user with no projects.

#### `tests/unit/liveblocks.test.ts`

Target: `lib/liveblocks.ts`

- `getCursorColor(userId)` returns deterministic color from palette.
- Same userId always returns same color (DJB2 hash consistency).
- Different userIds can return different colors.
- Handles edge cases (empty string, very long userId).

### 8. Unit tests — `hooks/`

#### `tests/unit/use-canvas-autosave.test.ts`

Target: `hooks/use-canvas-autosave.ts`

- Initializes with `idle` status.
- Triggers save after debounce window.
- Transitions: `idle` → `saving` → `saved`.
- Handles save error: `saving` → `error`.
- Queues saves when one is in-flight.
- Calls API with correct payload (nodes, edges, projectId).

#### `tests/unit/use-project-actions.test.ts`

Target: `hooks/use-project-actions.ts`

- Opens create dialog, handles form submission.
- Opens rename dialog, pre-fills current name.
- Opens delete dialog, confirms deletion.
- Handles name collision by showing alternative suggestions.
- Navigates to `/editor` after successful delete.
- Sets loading states during async operations.

#### `tests/unit/use-keyboard-shortcuts.test.ts`

Target: `hooks/useKeyboardShortcuts.ts`

- `+` / `=` triggers zoom in.
- `-` triggers zoom out.
- `Cmd+Z` triggers undo.
- `Cmd+Shift+Z` triggers redo.
- Ignores shortcuts when focus is in editable element.

### 9. Integration tests — untested API routes

#### `tests/integration/health.test.ts`

Target: `/api/health` (public route)

- GET returns 200 with `{ status: "ok" }`.
- No auth required.

#### `tests/integration/liveblocks-auth.test.ts`

Target: `/api/liveblocks-auth`

- POST with valid roomId returns 200 and session credentials.
- POST without auth returns 401.
- POST with empty roomId returns 400.
- Mocks `@liveblocks/node` `Liveblocks` class.

#### `tests/integration/ai-design.test.ts`

Target: `/api/ai/design`

- POST with valid prompt + roomId triggers task, returns `{ runId }`.
- POST without auth returns 401.
- POST with empty prompt returns 400.
- POST with prompt > 4000 chars returns 400.
- POST with invalid roomId (no access) returns 403.
- Creates `TaskRun` record in DB on success.
- Returns 502 if `tasks.trigger()` throws.

#### `tests/integration/ai-design-token.test.ts`

Target: `/api/ai/design/token`

- POST with valid runId returns `{ token }`.
- POST without auth returns 401.
- POST with unknown runId returns 404.
- POST with runId belonging to different user returns 403.

#### `tests/integration/trigger-job.test.ts`

Target: `/api/trigger-job`

- POST triggers `background-job` task, returns `{ runId }`.
- POST without auth returns 401.

#### `tests/integration/trigger-test.test.ts`

Target: `/api/trigger-test`

- GET triggers `example-task`, returns `{ runId }`.
- GET without auth returns 401.

### 10. Component tests

All component tests use `// @vitest-environment jsdom` directive.

**Mocking strategy** (informed by `liveblocks-best-practices` and `clerk`
skills):

```ts
// Mock Liveblocks hooks
vi.mock("@liveblocks/react", () => ({
  useStorage: vi.fn().mockReturnValue(null),
  useOthers: vi.fn().mockReturnValue([]),
  useMyPresence: vi.fn().mockReturnValue([{}, vi.fn()]),
  ClientSideSuspense: ({ children }) => children,
}));

// Mock Clerk client hooks
vi.mock("@clerk/nextjs", () => ({
  useUser: vi.fn().mockReturnValue({
    isLoaded: true, isSignedIn: true,
    user: { firstName: "Test", lastName: "User" },
  }),
  useAuth: vi.fn().mockReturnValue({ userId: "user_test", signOut: vi.fn() }),
  UserButton: () => <div data-testid="user-button" />,
}));
```

#### `tests/components/create-project-dialog.test.tsx`

Target: `components/editor/create-project-dialog.tsx`

- Renders dialog when open.
- Calls `onCreate` with entered name on submit.
- Shows loading spinner during submission.
- Shows error message on name collision.
- Closes on cancel.

#### `tests/components/rename-project-dialog.test.tsx`

Target: `components/editor/rename-project-dialog.tsx`

- Pre-fills input with current project name.
- Calls `onRename` with new name on submit.
- Closes on cancel.

#### `tests/components/delete-project-dialog.test.tsx`

Target: `components/editor/delete-project-dialog.tsx`

- Shows project name in confirmation text.
- Calls `onDelete` on confirm.
- Closes on cancel.

#### `tests/components/project-sidebar.test.tsx`

Target: `components/editor/project-sidebar.tsx`

- Renders "My Projects" and "Shared" tabs.
- Switches tab content on click.
- Shows project list from props.
- "New Project" button triggers callback.

#### `tests/components/share-dialog.test.tsx`

Target: `components/editor/share-dialog.tsx`

- Renders collaborator list.
- Invite form calls API with email.
- Remove button calls API with collaborator email.

#### `tests/components/shape-panel.test.tsx`

Target: `components/editor/shape-panel.tsx`

- Renders all 6 shape types (rectangle, diamond, circle, pill, cylinder,
  hexagon).
- Each shape has correct data-shape attribute.

#### `tests/components/canvas-control-bar.test.tsx`

Target: `components/editor/canvas-control-bar.tsx`

- Renders zoom in/out buttons.
- Renders fit view, undo, redo buttons.
- Button clicks trigger correct callbacks.

#### `tests/components/editor-navbar.test.tsx`

Target: `components/editor/editor-navbar.tsx`

- Renders sidebar toggle button.
- Renders UserButton component.
- Toggle click calls sidebar handler.

#### `tests/components/presence-avatars.test.tsx`

Target: `components/editor/presence-avatars.tsx`

- Renders avatar chips for each online user.
- Shows user name on hover.
- Handles empty user list gracefully.

#### `tests/components/ai-sidebar.test.tsx`

Target: `components/editor/ai-sidebar.tsx`

- Renders "AI Architect" and "Specs" tabs.
- Switches tab content on click.
- Input area renders and accepts text.

#### `tests/components/starter-templates-modal.test.tsx`

Target: `components/editor/starter-templates-modal.tsx`

- Renders template cards with previews.
- Select triggers import callback.
- Close button dismisses modal.

### 11. Refactor existing integration tests

- Update `projects.test.ts`, `collaborators.test.ts`, `access.test.ts` to
  use shared factories from `tests/fixtures/factories.ts`.
- Move `cleanupTestData()` to `tests/fixtures/factories.ts`.

### 12. CI coverage integration

#### Update `.github/workflows/ci.yml` `test` job

Add after "Run integration tests" step:

```yaml
- name: Run tests with coverage
  run: npm run test:coverage

- name: Upload coverage artifact
  uses: actions/upload-artifact@043fb46d1a93c77aae656e7c1c64a875d1fc6a0a # v7.0.1
  with:
    name: coverage-report
    path: coverage/
    retention-days: 7

- name: Upload coverage to Codecov
  if: always()
  uses: codecov/codecov-action@<current-sha>
  with:
    files: ./coverage/coverage-final.json
    fail_ci_if_error: false
    token: ${{ secrets.CODECOV_TOKEN }}
```

- Verify SHA for `codecov/codecov-action` via GitHub API.
- Validate modified `ci.yml` with `github-actions-validator` skill.

#### Add `coverage/` to `.gitignore`

### 13. Update context files

- Update `context/code-standards.md` to add testing conventions section.
- Keep `AGENTS.md` consistent.

## Scope Limits

- No Playwright E2E changes (coverage is Vitest-only).
- No changes to production code (only test infrastructure + test files).
- No Trigger.dev task logic changes.
- shadcn/ui primitives (`components/ui/`) are not tested (generated code).
- `proxy.ts` middleware is not unit-tested (requires Edge runtime; covered by
  E2E).

## Skills Applied

- **nextjs**: async params pattern for route handler tests, `proxy.ts`
  conventions.
- **prisma-client-api**: query patterns for DB assertions in integration tests.
- **clerk / clerk-nextjs-patterns**: `await auth()`, `isAuthenticated`,
  401/403 patterns for mocking.
- **clerk-testing**: test API key patterns, `storageState` concepts.
- **liveblocks-best-practices**: `ClientSideSuspense` mock pattern, Suspense
  vs regular hooks mocking.
- **github-actions-generator**: SHA-pinned actions, `permissions`, `npm ci`.
- **github-actions-validator**: Post-fix validation of CI workflow changes.
- **devops / ci-cd**: `permissions: contents: read`, artifact handling, `npm ci`
  everywhere.

## Verify When Done

- [ ] `npm run test:unit` passes (all unit tests green)
- [ ] `npm run test:integration` passes (all integration tests green)
- [ ] `npm run test:components` passes (all component tests green)
- [ ] `npm run test:coverage` passes with 80% line threshold
- [ ] `npm run lint` passes
- [ ] `npm run typecheck` passes
- [ ] `npm run build` passes
- [ ] CI workflow validates: `bash .agents/skills/github-actions-validator/scripts/validate_workflow.sh .github/workflows/ci.yml`
- [ ] Coverage artifact uploads in CI
- [ ] Codecov integration works (requires `CODECOV_TOKEN` secret)
- [ ] `context/code-standards.md` updated with testing conventions
