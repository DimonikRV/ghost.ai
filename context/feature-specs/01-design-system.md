# Unit 01: Design System

## Goal

Set up shadcn/ui as the design system foundation with dark theme support and core UI primitive components. All subsequent specs build on these components.

## Design

- Dark theme via `.dark` class on `<html>` element in root layout
- Color tokens defined as CSS custom properties in `globals.css` — no hardcoded hex values in components
- Use existing shadcn/ui component internals; don't modify generated `components/ui/*` files after installation
- Icon system via `lucide-react` — consistent 4w/4h default sizing
- Typography: Geist Sans (body), Geist Mono (code)

## Implementation

Install and configure `shadcn/ui` with Tailwind CSS v4.

Add these shadcn components:
- button
- card
- input
- tabs
- scroll-area
- textarea
- dialog

Don't modify the generated `components/ui/*` files after installation.

Also install `lucide-react` for icons.

Create `lib/utils.ts` with a reusable `cn` helper for merging Tailwind classes.

Ensure all components respect the existing dark theme in `globals.css`.

## Dependencies

- `shadcn` — UI component library
- `lucide-react` — icon library

## Verify When Done

- [ ] All components import without errors
- [ ] `cn` helper works correctly
- [ ] No default styles from shadcn/ui remain (full custom styling)
- [ ] TypeScript types are correctly set up
- [ ] `package.json` has all dependencies listed
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] No console warnings or errors
- [ ] Build passes