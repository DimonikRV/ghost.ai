# Ghost Pilot

## Overview

Ghost Pilot is an AI-powered code editor workspace that provides intelligent code generation, real-time collaboration, and secure cloud-hosted projects. Users create architecture workspaces where they can generate, edit, and manage code with AI assistance.

## Goals

1. Users can sign up, sign in, and manage their account via Clerk authentication
2. Authenticated users can create, rename, and delete projects from a clean editor interface
3. Project collaboration supports owned and shared (read-only) project views
4. All UI follows a consistent dark-theme design system with no hardcoded colors

## Core User Flow

1. User visits the app — unauthenticated → redirected to `/sign-in`
2. User signs in or signs up via Clerk
3. Authenticated user lands on `/editor` home screen
4. User creates a new project or opens an existing one from the sidebar
5. User works within the project workspace (future specs)

## Features

### Authentication

- Sign-in / Sign-up via Clerk with dark theme
- Route protection via `proxy.ts` — all routes protected except public auth paths
- User menu with profile and sign-out via Clerk `UserButton`
- Sign-out redirects to `/sign-in`

### Project Management

- Create, rename, and delete projects via dialog flows
- Project sidebar with My Projects / Shared tabs
- Owned projects show rename/delete actions; shared projects are read-only
- Live slug preview based on project name

### Editor Chrome

- Fixed top navbar with sidebar toggle and user menu
- Floating left sidebar (doesn't push content) with project list
- Responsive: sidebar has backdrop scrim on mobile (< 768px)

### Design System

- shadcn/ui components with custom dark theme
- CSS custom property tokens — no hardcoded hex values
- Geist Sans / Geist Mono typography
- lucide-react icons

## Scope

### In Scope

- Clerk authentication with protected routes
- Editor chrome (navbar, sidebar, dialogs)
- Project CRUD UI (mock data, no API persistence yet)
- Dark theme design system
- Mobile-responsive layouts

### Out of Scope

- Backend API calls and data persistence (mock only for now)
- Real-time collaboration (future spec)
- Code editor / syntax highlighting (future spec)
- AI code generation (future spec)
- File management / tree view (future spec)

## Success Criteria

1. A signed-in user can create, rename, and delete projects via dialog flows
2. All routes are protected — unauthenticated users cannot access `/editor`
3. No TypeScript errors, no lint errors, build passes clean
4. Dark theme consistent across all components with no hardcoded colors
5. Sidebar closes on tap-outside on mobile screens
