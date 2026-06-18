---
name: spec-pipeline
description: Development workflow hook that discovers unimplemented feature specs, launches review against codebase reality, and guides through the implementation workflow. Use when asked to "pick up next spec", "implement next feature", "what's next", or to audit spec health.
license: MIT
metadata:
  author: project
  version: "1.0.0"
---

# Spec Pipeline Hook

This is a **development process tool**, not app functionality. It orchestrates the flow from unimplemented feature spec → review → fix spec → implement → verification.

## What It Does

1. **Discovers** unimplemented feature specs in `context/feature-specs/` (files matching `NN-*.md`, excluding `_spec-template.md` and `00-build-plan.md`)
2. **Identifies** the next spec to work on by cross-referencing with `context/progress-tracker.md`
3. **Reviews only the current spec** assigned for implementation — no other specs, no speculative reviews
4. **Fixes the spec** by incorporating review findings before any code is written
5. **Guides implementation** following the workflow defined in `QWEN.md`:
   - Read all 6 context files
   - Read the target spec (now reviewed and corrected)
   - Mark spec as In Progress in `context/progress-tracker.md`
   - Implement exactly as specified
   - Verify against the spec's checklist
   - Mark spec as Complete in `context/progress-tracker.md`

## How to Use

When the user is ready to pick up the next feature:

### Step 1: Discover Next Spec

Read `context/progress-tracker.md` under "Completed" to see which spec numbers are done. Read `context/feature-specs/` to find all `NN-*.md` files. The next spec is the lowest-numbered one not yet completed.

If no unimplemented spec exists, prompt the user to create one.

### Step 2: Review Only the Target Spec

Before implementing, review the **single spec file** identified in Step 1 against codebase reality **and relevant skill best practices**:

1. Read the spec file — understand its goals, phases, and proposed changes
2. Read only the codebase files the spec mentions or implies will be changed
3. Identify skills relevant to the spec's domain (e.g., `clerk-*` skills for auth changes, `prisma-*` skills for database changes, `review-spec` for general spec validation)
4. Run the `review-spec` skill on the spec file
5. **Cross-reference with relevant skill documentation** — verify that the spec's proposed approach aligns with best practices, patterns, and conventions documented in applicable skills
6. **Every finding must be addressed before proceeding:**
   - Critical/High severity: **must** be resolved — update the spec file to incorporate the recommendation
   - Medium severity: **should** be resolved — update the spec file if the finding is valid
   - Low severity: **may** be resolved — update the spec file if it improves clarity
7. **Update the spec file** (`context/feature-specs/NN-*.md`) with all corrections. Do not proceed to implementation with a stale spec.

### Step 3: User Confirmation

Present the updated spec to the user and confirm it is ready for implementation. **Do not start implementation until the user explicitly approves.**

### Step 4: Implement

After user approval, follow the implementation workflow from `QWEN.md`:

1. Read all 6 context files (project-overview, architecture, ui-context, code-standards, ai-workflow-rules, progress-tracker)
2. Read the target spec file (the corrected version from Step 2)
3. Mark the spec as "In Progress" in `context/progress-tracker.md`
4. Implement exactly as specified — no more, no less
5. Verify against the spec's "Check When Done" / "Verify When Done" checklist
6. Mark the spec as "Complete" in `context/progress-tracker.md`

### Step 5: Next Step

After completion, return to Step 1 to discover the next spec, or stop if no more specs exist.

## Rules

- **Review only the current spec.** Never review specs that are not the immediate next one. Never batch-review multiple specs.
- **Fix the spec before coding.** All review findings must be incorporated into the spec file before any implementation begins. Never implement against an uncorrected spec.
- **User approval is required.** After the spec is corrected, present it to the user and wait for explicit approval before starting implementation.
- **One spec at a time.** Never combine unrelated specs in a single implementation step.
- **Scope fidelity.** Implement exactly what the spec says — do not invent behavior or expand scope.
- **Critical findings are blocking.** If review reveals Critical issues that cannot be resolved by updating the spec, do not implement — report to the user and stop.

## Integration with Existing Skills

- Uses `review-spec` for spec validation
- Uses `code-review` for code quality checks after implementation
- Uses `specs-review` for auditing overall spec health

## Error Handling

- If `context/feature-specs/` is empty or all specs are complete: inform the user and stop
- If `context/progress-tracker.md` is missing or malformed: warn the user and attempt recovery by scanning completed specs in progress-tracker
- If review fails or times out: report the failure and ask the user how to proceed
- If implementation fails verification: do not mark as complete; report what failed and why
