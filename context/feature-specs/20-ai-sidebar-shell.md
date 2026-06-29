Complete the existing AI sidebar placeholder and turn it into a proper floating chat sidebar component. The sidebar already exists, so keep the current floating placement and smooth slide-in behavior from the right side. This unit is focused on building out the sidebar UI inside it.

## Implementation

1. Separate the AI sidebar into its own component (`components/editor/ai-sidebar.tsx`).
   - accept `isOpen` and `onClose` props, controlled by `WorkspaceShell`
   - use a transition-based approach (not conditional mount/unmount): always render the element, toggle `translate-x-full` ↔ `translate-x-0` with `transition-transform duration-200 ease-in-out`
   - floating position `fixed top-12 right-0 bottom-0 z-30 w-80`
   - sidebar surface styles: `bg-card/95`, `border-l border-border`, and shadow (`shadow-lg`)
   - add a mobile backdrop scrim matching `ProjectSidebar`: `fixed inset-0 z-20 bg-black/20 md:bg-black/0`, click closes sidebar

2. Add the sidebar header.
   - title: 'AI Workspace'
   - subtitle: 'Collaborate with Ghost AI'
   - small bot icon
   - close button aligned to the right
   - use `text-foreground` for the title
   - use `text-muted-foreground` for the subtitle

3. Add a tabbed layout with two tabs.

   Use shadcn 'Tabs'.
   - 'AI Architect'
   - 'Specs'
   - active tab uses shadcn default active styling (`data-active:bg-background data-active:text-foreground`)
   - inactive tab text: `text-muted-foreground`

4. Build the AI Architect tab.

   Use shadcn components where they fit, especially 'Button', and 'Textarea'.
   - scrollable chat area (use shadcn 'ScrollArea')
   - empty state with bot icon, short description, and starter prompt chips
   - starter chips:
     - 'Design an e-commerce backend'
     - 'Create a chat app architecture'
     - 'Build a CI/CD pipeline'
   - style starter chips as soft pills using `bg-muted` and `text-accent-foreground`
   - user messages should be right-aligned with `bg-accent-brand/20 border-accent-brand/50 border-2 text-foreground`
   - assistant messages should be left-aligned with `bg-card border border-border text-accent-foreground`
   - input area with an auto-resizing textarea, around 72px min height and 160px max height
   - send button should use `bg-accent-brand text-white hover:bg-accent-brand/90`
   - 'Enter' submits, 'Shift+Enter' adds a newline

5. Build the Specs tab.
   - show a 'Generate Spec' button using `bg-accent-brand text-white hover:bg-accent-brand/90`
   - show a demo spec card for now
   - style the card with `bg-card` and `border-border`
   - include a file/spec icon, title, short snippet, and disabled download action

6. Use the existing project color tokens.
 
   Check 'global.css', 'ui-context.md' or the Tailwind mapping before adding direct color values. Avaid invebting new colors if a matching token already exists.


## Scope Limits

- don't rebuild the existing sidebar open/close behavior
- don't add backend logic
- don't add Liveblocks or AI generation logic yet
- keep this focused on the sidebar UI structure

## Check When Done

- AI Sidebar is implemented
- Tabs are working
- Starter prompts are working
- Demo spec card is working
- AI Sidebar opens and closes with the existing animation
- 'npm run build' passes without type errors

