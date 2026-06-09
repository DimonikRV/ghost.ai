 # Application Building Context — Qwen Code

This file is the entry point. **You MUST read these context files before every implementation session.**
They define what this project is, how it is structured, and the rules you must follow.

## Required Reading Order

1. `context/project-overview.md` — Product definition, goals, features, scope
2. `context/architecture.md` — System structure, boundaries, storage model, invariants
3. `context/ui-context.md` — Theme, colors, typography, component conventions
4. `context/code-standards.md` — Implementation rules and conventions
5. `context/ai-workflow-rules.md` — Development workflow, scoping rules, delivery approach
6. `context/progress-tracker.md` — Current phase, completed work, open questions, next steps

## Mandatory Rules

- **Always read all 6 context files** before implementing or making any architectural decision.
- **Update `context/progress-tracker.md`** after every meaningful implementation change.
- **Never go beyond a spec scope.** When implementing a feature spec in `context/feature-specs/`, do exactly what the spec says — no more, no less.
- **Sync docs with code.** If implementation changes architecture, scope, or standards documented in context files, update the relevant file before continuing.
- **Work one unit at a time.** Never combine unrelated system boundaries in a single implementation step.
- **Do not invent behavior.** If a requirement is ambiguous, resolve it in the relevant context file or add it as an open question in `progress-tracker.md` before implementing.

## File Implementation Workflow

When given a feature spec to implement:

1. Read all 6 context files
2. Read the target spec in `context/feature-specs/`
3. Mark the spec as In Progress in `context/progress-tracker.md`
4. Implement exactly as specified
5. Verify against the spec checklist
6. Mark the spec as Complete in `context/progress-tracker.md`

## Protected Files

Do not modify these unless explicitly instructed:
- `context/ui/` — Generated UI library components (if using shadcn/ui or similar)
- Any third-party library internals
