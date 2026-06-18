# UI Context

## Theme

Dark only. No light mode. The design language is a dark technical workspace — near-black surfaces, layered cards with borders, and vivid cyan accent (`#06b6d4`) for interactive elements and brand identity.

## Colors

All components must use CSS custom property tokens — no hardcoded hex values. Tokens are defined in `globals.css` via Tailwind CSS v4's `@theme inline` block.

| Role | CSS Variable | Dark Value |
|------|-------------|------------|
| Page background | `--color-background` | `oklch(0.145 0 0)` |
| Card surface | `--color-card` | `oklch(0.205 0 0)` |
| Popover surface | `--color-popover` | `oklch(0.205 0 0)` |
| Primary action | `--color-primary` | `oklch(0.922 0 0)` (inverted in dark) |
| Brand accent | `--color-accent-brand` | `#06b6d4` |
| Foreground text | `--color-foreground` | `oklch(0.985 0 0)` |
| Card foreground | `--color-card-foreground` | `oklch(0.985 0 0)` |
| Muted text | `--color-muted-foreground` | `oklch(0.708 0 0)` |
| Accent surface | `--color-accent` | `oklch(0.269 0 0)` |
| Destructive | `--color-destructive` | `oklch(0.704 0.191 22.216)` |
| Border | `--color-border` | `oklch(1 0 0 / 10%)` |
| Input background | `--color-input` | `oklch(1 0 0 / 15%)` |
| Ring / focus | `--color-ring` | `oklch(0.556 0 0)` |

## Typography

| Role | Font | Variable |
|------|------|----------|
| UI text / body | Geist Sans | `--font-sans` |
| Code / mono | Geist Mono | `--font-mono` |
| Headings | Geist Sans (same as body) | `--font-heading` |

Default sizes: `text-sm` for body, `text-xs` for labels/captions, `text-base` for inputs, `text-xl` for page headings.

## Border Radius

| Context | Token | Value |
|---------|-------|-------|
| Inline / small UI | `--radius-sm` | `calc(var(--radius) * 0.6)` |
| Buttons / inputs | `--radius-md` | `calc(var(--radius) * 0.8)` |
| Cards / panels | `--radius-lg` | `var(--radius)` (0.625rem) |
| Modals / overlays | `--radius-xl` | `calc(var(--radius) * 1.4)` |
| Large surfaces | `--radius-2xl` | `calc(var(--radius) * 1.8)` |

## Component Library

shadcn/ui (`@base-ui/react` primitives) on top of Tailwind CSS v4. Components live in `components/ui/`. Use the shadcn CLI to add new components rather than writing from scratch. Never modify `components/ui/*` files directly — they are generated.

## Layout Patterns

- **Editor Shell**: fixed top navbar (`h-12`), floating left sidebar, content area below navbar (`pt-12`)
- **Navbar**: `fixed top-0 left-0 right-0`, three sections (left toggle, center empty, right user menu), bottom border
- **Sidebar**: `fixed top-12 left-0 bottom-0`, slides in from left (`-translate-x-full` → `translate-x-0`), `w-80`, floats above content (doesn't push it), `z-50`
- **Sidebar backdrop**: `fixed inset-0`, `bg-black/20` on mobile, `md:bg-black/0` on desktop, `z-40`
- **Dialogs**: centered overlay (`fixed top-1/2 left-1/2`), `max-w-[calc(100%-2rem)]`, `sm:max-w-sm`, `rounded-xl`, with backdrop (`bg-black/10` with `backdrop-blur-xs`)
- **Auth pages**: two-panel layout on large screens (left branding, right form), form-only on small screens

## Icons

Lucide React. Stroke-based icons only.

| Context | Size |
|---------|------|
| Inline (navbar toggle, menu items) | `h-4 w-4` |
| Buttons (primary actions) | `h-4 w-4` |
| Small UI (dropdown items) | `h-3.5 w-3.5` |
| Loading spinner | `h-4 w-4` |
