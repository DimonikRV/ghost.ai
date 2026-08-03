# Unit 02: Editor Chrome

## Goal

Build the base chrome components (navbar + sidebar) that frame every editor screen. These are reused and extended in all subsequent specs.

## Design

- Navbar: fixed-height, top-anchored, three-section layout (left/center/right)
- Sidebar: floating overlay (doesn't push content), slides in from left
- Dialog pattern: primitive components ready for future use — don't build concrete dialogs implementations yet
- Dark background with subtitle bottom border on navbar
- Minimal: no gradients, no animations, no glassmorphism

## Implementation

### Editor Navbar

Create `components/editor/editor-navbar.tsx`.

Requirements:

- fixed-height top navbar
- left, center, and right sections
- left section contains sidebar toggle button
- use `PanelLeftOpen`/`PanelLeftClose` icons based on sidebar state
- right section stays empty for now
- dark background with subtitle bottom border

### Project Sidebar

Create `components/editor/project-sidebar.tsx`.

Requirements:

- sidebar should float above the editor canvas
- opening it should not push page content
- slides in from the left
- accepts `isOpen` and `onClose` props
- header with `Projects` title + close button
- shadcn `Tabs`:
  - My Projects
  - Shared
- both tabs show empty placeholder state
- full-width `New Project` button at the bottom with `Plus` icon

### Dialog Pattern

Use the existing color tokens from `globals.css` for dialog styling.

Support:

- title
- description
- footer actions

Don't build actual dialog yet.

## Dependencies

- shadcn/ui (tabs, button primitives)
- lucide-react (PanelLeftOpen, PanelLeftClose, Plus icons)

## Verify When Done

- [ ] New components compile without TypeScript errors
- [ ] No lint errors
- [ ] Dialog pattern is ready for future use
- [ ] Build passes