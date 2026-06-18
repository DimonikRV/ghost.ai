---
name: spec-pipeline
description: Development workflow hook that discovers unimplemented feature specs, launches review against codebase reality, and guides through the implementation workflow. Use when asked to "pick up next spec", "implement next feature", "what's next", or to audit spec health.
license: MIT
metadata:
  author: project
  version: "1.0.0"
---

# Spec Pipeline Hook

This is a **development process tool**, not app functionality. It orchestrates the flow from unimplemented feature spec → review → implementation → verification.

## What It Does

1. **Discovers** unimplemented feature specs in `context/feature-specs/` (files matching `NN-*.md`, excluding `_spec-template.md` and `00-build-plan.md`)
2. **Identifies** the next spec to work on by cross-referencing with `context/progress-tracker.md`
3. **Launches review** of the spec against codebase reality using the `review-spec` skill
4. **Guides implementation** following the workflow defined in `QWEN.md`:
   - Read all 6 context files
   - Read the target spec
   - Mark spec as In Progress in `context/progress-tracker.md`
   - Implement exactly as specified
   - Verify against the spec's checklist
   - Mark spec as Complete in `context/progress-tracker.md`

## How to Use

When the user is ready to pick up the next feature:

### Step 1: Discover Next Spec

Read `context/progress-tracker.md` under "Completed" to see which spec numbers are done. Read `context/feature-specs/` to find all `NN-*.md` files. The next spec is the lowest-numbered one not yet completed.

If no unimplemented spec exists, prompt the user to create one.

### Step 2: Review the Spec

Before implementing, review the spec against codebase reality:

1. Load the `review-spec` skill
2. Provide the spec file as input
3. Review findings — if Critical or High severity issues exist, resolve them before proceeding
4. Present findings to the user for approval

### Step 3: Implement

After review approval, follow the implementation workflow from `QWEN.md`:

1. Read all 6 context files (project-overview, architecture, ui-context, code-standards, ai-workflow-rules, progress-tracker)
2. Read the target spec file
3. Mark the spec as "In Progress" in `context/progress-tracker.md`
4. Implement exactly as specified — no more, no less
5. Verify against the spec's "Check When Done" / "Verify When Done" checklist
6. Mark the spec as "Complete" in `context/progress-tracker.md`

### Step 4: Next Step

After completion, return to Step 1 to discover the next spec, or stop if no more specs exist.

## Rules

- **Never skip review.** Every spec gets reviewed against codebase reality before implementation begins.
- **One spec at a time.** Never combine unrelated specs in a single implementation step.
- **Review findings are blocking.** If review reveals Critical issues, do not implement until resolved.
- **User approval required.** Present review findings and wait for explicit approval before starting implementation.
- **Scope fidelity.** Implement exactly what the spec says — do not invent behavior or expand scope.

## Integration with Existing Skills

- Uses `review-spec` for spec validation
- Uses `code-review` for code quality checks after implementation
- Uses `specs-review` for auditing overall spec health

## Error Handling

- If `context/feature-specs/` is empty or all specs are complete: inform the user and stop
- If `context/progress-tracker.md` is missing or malformed: warn the user and attempt recovery by scanning completed specs in progress-tracker
- If review fails or times out: report the failure and ask the user how to proceed
- If implementation fails verification: do not mark as complete; report what failed and why
