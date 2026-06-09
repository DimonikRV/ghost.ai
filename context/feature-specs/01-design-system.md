Read 'QWEN.md' before starting any implementation.

We're adding the design system and UI primitive components.

install and configure 'shadcn/ui'.

Add these shadcn components:
- button
- card
- input
- tabs
- scroll-area
- text-area
- dialog 

Don't modify the generated 'components/ui/*' files after installation.

Also install 'lucide-react' for icons.

Create 'lib/utils.ts' with a reusable 'cn' helper for merging Tailwind classes.

Ensure all components match the existing dark theme in 'app/global.css'.

Run 'npm run lint' and 'tsc --noEmit' after installation. Fix all issues.   

### Check when done
 - All components import without errors
 - 'cn' helper works correctly
 - No default styles from shadcn/ui remain (we want full custom styling)
 - TypeScript types are correctly set up
 - 'package.json' has all dependencies listed
 - No console warnings or errors

Once done, say "✅ Design system ready"