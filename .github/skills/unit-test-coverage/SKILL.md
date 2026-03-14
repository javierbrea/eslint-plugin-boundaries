---
name: unit-test-coverage
description: 'Complete unit test branch coverage for a specific test file in any package under packages/. Use when asked to raise coverage to all branches, inspect coverage reports under the target package coverage directory, run only the target test file with pnpm from that package directory, add justified istanbul ignore comments for defensive branches that cannot be covered, and ask for confirmation before removing or changing production logic that appears unnecessary.'
argument-hint: 'Path to target test file under packages/<package-name>/ (for example: packages/elements/test/specs/Matcher.spec.ts)'
---

# Unit Test Coverage For A Specific File

## Purpose

Increase and complete branch coverage for one target unit test file in any package under packages/, while keeping behavior correct and output focused.

## Use When

- The user asks to complete or maximize coverage for a specific test file.
- The user wants branch-level coverage details.

## Required Constraints

- Work inside the package that owns the target test file.
- Use pnpm commands from that package directory, not Nx.
- Execute only the requested test file.
- Inspect coverage reports from the matching package coverage directory.
- Prefer adding tests over suppressing coverage.
- If a branch is intentionally defensive and cannot be covered meaningfully, add `/* istanbul ignore next */` with a brief reason.
- If code seems unnecessary and should be removed or functionally changed, stop and ask the user for confirmation before modifying it.

## Procedure

1. Validate target and scope
- Confirm the target test file exists under packages/<package-name>/.
- Derive package directory from the target path:
  - Package root: packages/<package-name>
  - Test path relative to package root: <test-file-relative-path>
  - Coverage directory: packages/<package-name>/coverage
- Identify the production source file(s) that this test file exercises.

2. Baseline focused execution
- Change directory to packages/<package-name>.
- Run only the target file:

```bash
pnpm test:unit <test-file-relative-path>
```

- Keep the command scoped to one file to minimize output and focus on relevant failures.

3. Read coverage data and find missing branches
- Inspect packages/<package-name>/coverage/lcov.info for BRDA entries with zero hits.
- Use packages/<package-name>/coverage/lcov-report/index.html only as a secondary visual aid.
- Map uncovered branches to exact conditions in the source.

4. Close coverage gaps
- Add or improve tests in the target spec file to hit uncovered true/false and multi-branch paths.
- Re-run only the same test file after each meaningful change.
- Repeat until uncovered branches are resolved or justified.

5. Type safety in tests
- Always use proper types to ensure type safety and catch potential issues early.
- For defensive branch testing where the production code forbids certain type combinations, use `/* @ts-expect-error */` with a descriptive comment:

```typescript
// Good: Explicit type error suppression for defensive branch testing
const partialMock = {
  timeout: 5000,
  retries: 3,
  /* @ts-expect-error Testing branch with undefined property for edge case */
  requiredField: undefined,
} as unknown as CompleteInterface;
```

- Use `as unknown as TargetType` casts when you need to create an object that violates type constraints for testing edge cases or defensive branches.
- Never use `any` type in tests; always use proper types with explicit suppressions when needed.
- Keep the `@ts-expect-error` comment close to the problematic line (not wrapping the entire object).
- Only use type error suppressions for testing specific defensive branches; prefer redesigning test data for happy-path tests.

6. Defensive branch handling
- If a branch is defensive and not realistically coverable, annotate the guarded line:

```ts
/* istanbul ignore next -- Defensive guard: invalid parser state is impossible through public API */
```

- Keep the reason specific and tied to runtime invariants.
- Do not use ignore comments for branches that are testable.

7. Candidate dead code or behavior changes
- If uncovered logic appears obsolete or functionally unnecessary, do not change it immediately.
- Present evidence and request explicit user confirmation before altering production behavior.

8. Quality checks and report
- Lint modified files from packages/<package-name>:

```bash
pnpm lint --fix
```

- Re-run the target test file with coverage.
- If available and relevant, run adjacent tests that are likely affected.

- Write a brief summary covering:
  - What branches were uncovered initially.
  - Which tests were added or updated.
  - Any ignore comments added and why.
  - Any code-change confirmations requested from the user.

## Decision Rules

- Prefer behavior-preserving tests first.
- Use ignore comments only for defensively unreachable code.
- Escalate to user confirmation before removing or altering potentially unnecessary production logic.
- Keep all repository artifacts in English.
