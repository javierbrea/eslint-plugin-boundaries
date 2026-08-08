---
paths:
  - "packages/eslint-plugin/src/Rules/**"
  - "packages/eslint-plugin/src/Messages/**"
---

# Authoring an ESLint rule in `eslint-plugin`

A rule lives in `src/Rules/<Name>.ts`, with shared infrastructure (the dependency-rule engine, rule-meta helpers) in `src/Rules/Support/`. Give each rule the boundary element type `rule`, and put anything the rule needs but a consumer never imports directly under `rule-support`.

## Messages are dynamic, not static

Rule messages are built at runtime from configuration and reported dependency data (see `src/Messages/`), not from static `messageId` templates. This is why `packages/eslint-plugin/eslint.config.mjs` disables `eslint-plugin/prefer-message-ids` and `eslint-plugin/require-meta-type` for this package — don't "fix" a rule by forcing a static `messageId`; follow the existing `Messages` module instead.

## Testing a rule

Use the project's rule-test infrastructure from `test/support/helpers`, not a hand-rolled `RuleTester`:

```typescript
import { SETTINGS, createRuleTester, pathResolvers } from "../../support/helpers";

const { absoluteFilePath, codeFilePath } = pathResolvers("one-level");
const ruleTester = createRuleTester(SETTINGS.oneLevel);
```

Place valid/invalid cases in `test/rules/<scenario>/<RuleName>.spec.ts`, backed by fixtures under `test/fixtures/<scenario>/`. Reuse an existing scenario (`one-level`, `two-levels`, `two-levels-with-private`, `layered`, `base-pattern`, `flag-as-external`, `nestjs-example`, `docs-examples`) when it already models the boundary shape you need; only add a new scenario when none of them do.
