Build the `/editor/[projectId]` workspace shell with server-side access checks. No canvas logic yet.

## Access

`/editor/[projectId]` must be a server component.

Before rendering:

 - unauthentificated users redirect to '/sign-in'
 - users without project access see 'AccessDenied' page.
 - non-existant projects show 'ProjectNotFound' page.

Create 'components/editor/access-denied.tsx' with:
- centered layout
- lock icon
- short message
- link back to '/editor'

Create 'components/editor/project-not-found.tsx' 

## Access Helpers

Create 'lib/project-access.ts' with helpers for:

- getting current Clerk identity: 'userId' + primary email
- checking project by owner or collaborator
- getting project collaborator email list

## Layout

Build a full-viewport workspace layout with:
- top navbar showing project name
- nawbar actions: share button and AI sidebar toggle
- existing 'ProjectSidebar' on the left
- current room highlighted in sidebar
- central canvas placeholder with dark background and centered message
- right sidebar placeholder for future AI chat

The canvas area should fill the remaining space.

## Scope

Don't add real canvas logic, Liveblocks. AI chat, or sharing logic yet.

## Check When Done

- '/editor/[roomID]' build successfully
- access helpers exists outside the page component
- 'AccessDenied' is shown for unauthentificated users and users without project access
- 'ProjectNotFound' is used for non-existent project
- workspace layout renders with current project context
- no TypeScript errors

