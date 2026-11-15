---
paths:
  - "packages/elements/**/*.ts"
  - "packages/elements/**/*.tsx"
  - "packages/config/**/*.ts"
  - "packages/config/**/*.tsx"
  - "packages/policies/**/*.ts"
  - "packages/policies/**/*.tsx"
  - "packages/eslint-plugin/**/*.ts"
  - "packages/eslint-plugin/**/*.tsx"
  - "packages/playground/**/*.ts"
  - "packages/playground/**/*.tsx"
---

# TypeScript conventions

These apply to every `.ts`/`.tsx` file across `packages/elements`, `packages/config`, `packages/policies`, `packages/eslint-plugin` and `packages/playground`.

## `type` vs `interface`

Lint requires a `type` alias and forbids an `I` prefix on interface names (`support/eslint-config/index.js`). An `interface` stays only where declaration merging needs one: a module augmentation, `declare global`, or an exported interface of a published package, which users may merge declarations into. It gets an `eslint-disable-next-line @typescript-eslint/consistent-type-definitions` comment that gives that reason.

## Colocated `*.types.ts` files

A module's exported types live in a sibling `<Module>.types.ts` file next to `<Module>.ts` (e.g. `Cache.types.ts` next to `Cache.ts`), not inline in the implementation file. Re-export the types a folder's consumers need from that folder's `index.ts` or `Public.ts`.

## TSDoc coverage

Document exported types, functions, and public class methods with TSDoc, including `@param`/`@returns` where applicable.

- **Never hard-wrap** a TSDoc paragraph or tag description — write it as one line and let the editor soft-wrap it.
- Don't duplicate TSDoc on a method that already inherits it from an implemented interface.
