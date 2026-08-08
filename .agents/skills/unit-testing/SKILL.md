---
name: unit-testing
description: "Complete or maximize unit test coverage for a specific TypeScript file in this repo. Use when: a test run is short of the 100% coverage threshold and you need to find and close the gap, or when deciding whether an uncovered branch is genuinely unreachable. For everyday test-writing conventions (AAA, mocking, placement, type safety), see .agents/rules/unit-testing.md instead — it loads automatically for any *.spec.ts file."
argument-hint: "Path to target test or source file under packages/ (e.g., packages/elements/src/Matcher/ElementsMatcher.ts)"
---

# Unit Testing — closing coverage gaps

All packages enforce **100% coverage** (branches, functions, lines, statements) via `jest.config.js`'s `coverageThreshold.global`; any drop below fails the build. For AAA structure, mocking, placement, and type safety, follow `.agents/rules/unit-testing.md` — this skill only covers the coverage-completion workflow. For the general Nx-vs-direct command choice, see the root `AGENTS.md`.

## Completing coverage for a specific file

1. **Run the target test file with coverage** to get a baseline:
   ```bash
   cd packages/<package-name>
   pnpm test:unit <test-file>
   ```
2. **Find missing branches** by inspecting `packages/<package-name>/coverage/lcov.info` for `BRDA` entries with zero hits. Map uncovered branches to exact conditions in the source.
3. **Add tests** to hit uncovered branches. Re-run after each change. Repeat until resolved or justified.
4. **Prefer adding tests over suppressing coverage.**
5. If uncovered logic appears obsolete, **do not change production code** — present evidence and request user confirmation first.

## Handling unreachable or defensive branches

When a branch is genuinely unreachable at runtime and cannot be exercised through tests, mark it with an `istanbul ignore` comment that **justifies why**:

```typescript
/* istanbul ignore next -- Defensive guard: invalid parser state is impossible through public API */
```

Rules for `istanbul ignore`:

1. **Always include a justification** after the `--` separator.
2. **Prefer making code non-optional over ignoring it.** If a default is never exercised, remove it instead of adding an ignore comment.
3. **Only use for genuinely unreachable code.** If a branch can be triggered through a public API, write a test for it.
4. **Keep the ignore scope as narrow as possible.** Place on the specific line or branch, not on entire functions.
