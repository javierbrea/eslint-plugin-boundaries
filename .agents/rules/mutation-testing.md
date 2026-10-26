---
paths:
  - "packages/elements/src/**/*.ts"
---

# Surviving Stryker mutants

`test:mutation` mutates every source file of `packages/elements` except the specs (`stryker.config.mjs`). Kill a surviving mutant with a test whenever an input that a real project could have tells it apart. A mutant that no such input kills, because it is equivalent or only differs with contrived paths, gets a comment on the line before it:

- `// Stryker disable next-line <Mutator>: <reason>` when it is the only mutant of that mutator on the line, as the report of a run scoped to the file shows (`npx stryker run --mutate <file>`). Name the mutator, never `all`.
- Otherwise `// Surviving Stryker mutant: <which replacement survives and why>`, leaving it enabled. A disable comment ignores every mutant of the mutator on its line, such as both the `true` and `false` replacements of a condition, so Stryker would stop checking the ones that the tests kill.

Never disable a range with `// Stryker disable` and `// Stryker restore`: Stryker only reads comments placed before a node, so a `restore` at the end of a block is ignored and the disable runs to the end of the file.
