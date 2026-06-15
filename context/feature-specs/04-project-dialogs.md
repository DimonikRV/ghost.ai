## Goal

Build the `/editor` home screen and add project dialogs/sidebar actions. No API calls or persistence yet.

## Architecture

Dialog state is managed by a single hook (`useProjectDialogs`) exposed via `ProjectDialogsContext`. The context provider wraps at the `EditorShell` level, making dialog state available to:

- `EditorShell` — renders all dialogs and passes callbacks to sidebar
- `EditorPage` — opens Create dialog from home screen
- `ProjectSidebar` — opens Create/Rename/Delete dialogs from item actions

The shell refactors into three layers: `EditorShell` (provider) → `EditorShellInner` (layout + sidebar state) → `DialogsRenderer` (conditional dialog rendering).

## Editor Home

Reuse the existing editor layout. Don't modify the navbar or sidebar behavior.

In the center of the page, add:

- heading: 'Create a project or open an existing one'
- description: 'Start a new architecture workspace, or choose a project from the sidebar.'
- 'New Project' button with a 'Plus' icon

Keep the layout minimal. Don't wrap this content in cards.

Clicking 'New Project' should open the Create Project dialog.

## Dialogs

### Create Project

- project name input
- live slug preview based on the name
- preview updates as the user types

### Rename Project

- prefiled project name input
- current project name shown in the description
- input auto-focuse
- Enter submits

### Delete Project

- destructive confirmation only
- no input
- confirm button uses descriptive styling

## Sidebar

Add project item actions:

- rename
- delete

Show actions only for owned projects.

Hide actions for shared/collaborator projects.

On mobile

- On screens < 768px (`md` breakpoint): show opaque backdrop scrim (`bg-black/20`), tapping outside the sidebar closes it
- On screens ≥ 768px: backdrop is transparent (`md:bg-black/0`), clicks pass through to content
- Sidebar shadow visible on mobile, removed on desktop (`md:shadow-none`)

## Implementation

Create a dedicated hook to manage:

- dialog state
- form state
- loading state

Wire:

- editor home 'New Project' -> Create dialog
- sidebar create -> Create dialog
- sidebar rename -> Rename dialog
- sidebar delete -> Delete dialog

Use mock project data only. Don't add API calls or persistence.

## Check When Done

- sidebar actions are wired
- slug preview works
- no TypeScript errors
- no lint errors