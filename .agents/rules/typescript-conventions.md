---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript conventions (repo-wide)

These apply to every `.ts`/`.tsx` file across `packages/elements` and `packages/eslint-plugin`.

## `type` vs `interface`

Prefer a `type` alias by default. Use `interface` only when a real interface is warranted:

- an object contract meant to be `implements`-ed by a class
- a shape that intentionally relies on declaration merging or `extends` chains

Plain object shapes, unions, DTOs, entity/descriptor shapes, options, configs, and internal helpers are always `type`, never `interface`. This codebase does not prefix interfaces with `I` — name them the same way a `type` would be named (e.g. `Config`, `PluginBoundaries`), never `IConfig`.

## Colocated `*.types.ts` files

A module's exported types live in a sibling `<Module>.types.ts` file next to `<Module>.ts` (e.g. `Cache.types.ts` next to `Cache.ts`), not inline in the implementation file. Re-export the types a folder's consumers need from that folder's `index.ts` or `Public.ts`.

## TSDoc coverage

Document exported types, functions, and public class methods with TSDoc, including `@param`/`@returns` where applicable.

- **Never hard-wrap** a TSDoc paragraph or tag description — write it as one line and let the editor soft-wrap it.
- Don't duplicate TSDoc on a method that already inherits it from an implemented interface.
