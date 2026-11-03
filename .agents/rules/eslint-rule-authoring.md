---
paths:
  - "packages/eslint-plugin/src/Rules/**"
---

# Authoring an ESLint rule in `eslint-plugin`

A rule lives in `src/Rules/<Name>.ts`, with shared infrastructure (the dependency-rule engine, rule-meta helpers) in `src/Rules/Support/`. Give each rule the boundary element type `rule`, and put anything the rule needs but a consumer never imports directly under `rule-support`.

The name of a rule and the schema of its options belong to `@boundaries/config`: the name goes in `packages/config/src/Shared/Settings.types.ts`, the schema in `packages/config/src/Schemas/Schemas.ts`, and the rule takes its `meta.schema` from `getRuleOptionsSchema`. Which dependencies the `dependencies` rule checks, how its policies decide and the messages it reports belong to `@boundaries/policies`: the rule only reads the AST, resolves modules, prints debug output and reports.

## Messages are dynamic, not static

Rule messages are built at runtime from configuration and reported dependency data (see `packages/policies/src/Messages/`), not from static `messageId` templates. This is why `packages/eslint-plugin/eslint.config.mjs` disables `eslint-plugin/prefer-message-ids` and `eslint-plugin/require-meta-type` for this package — don't "fix" a rule by forcing a static `messageId`; build the message at runtime, as the existing rules do.

## Testing a rule

Use the project's rule-test infrastructure from `test/support/helpers`, not a hand-rolled `RuleTester`:

```typescript
import { SETTINGS, createRuleTester, pathResolvers } from "../../support/helpers";

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");
const ruleTester = createRuleTester(SETTINGS.oneLevel);
```

Where the spec and its fixtures go is in the placement table of `.agents/rules/unit-testing.md`. Reuse a fixture scenario under `test/fixtures/` when it models the boundary shape you need; add a new one only when none does.
