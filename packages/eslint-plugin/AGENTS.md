# AGENTS Instructions — `@boundaries/eslint-plugin`

Package-scoped agent instructions for `@boundaries/eslint-plugin` (Nx project `eslint-plugin`). See `.agents/rules/eslint-rule-authoring.md` for how to add or change a rule, and `.agents/rules/unit-testing.md`/`typescript-conventions.md` for conventions that apply here too.

## Boundary element types

This package **dogfoods `@boundaries/eslint-plugin` on its own source** (`eslint.config.mjs`), declaring nine element types under `src/`: `rule-support` (`Rules/Support`), `rule` (`Rules`), `config` (`Config`), `elements` (`Elements`), `settings` (`Settings`), `messages` (`Messages`), `debug` (`Debug`), `public` (`Public`), `shared` (`Shared`). `shared` is universal (anything may import it); same-element imports are always allowed; source may never import a `test`-category file (`**/*.spec.ts`); `src/index.ts` is the sole `entry`-category file.

The layering is strictly downward — `messages`/`debug` import only `shared`; `settings`/`elements` import `debug`; `rule-support` imports `elements`/`settings`/`debug`; `rule` imports `rule-support` plus the layers below it; `public` re-exports from `messages`/`settings`; `config` wires `public`/`settings` for the `entry` file. **The boundaries above are lint-enforced — read `packages/eslint-plugin/eslint.config.mjs` for the exact policy in force**, not this paragraph, when it matters which element may import which.

## Build and test shape

- `lint` depends on `build`, because `eslint-local-rules.js` `require()`s `./dist/index.js` to lint the package against its own compiled rules. Rebuild before trusting a `lint` run's boundary results.
- `check:types` runs both `tsconfig.code.json` and `tsconfig.test.json` — a change can type-check under one and fail the other.
- Tests live in `test/rules/<scenario>/`, mirrored by fixtures in `test/fixtures/<scenario>/`, across the scenarios `one-level`, `two-levels`, `two-levels-with-private`, `layered`, `base-pattern`, `flag-as-external`, `nestjs-example`, `docs-examples`. Source-level tests (e.g. `src/index.spec.ts`) are colocated instead. See `.agents/rules/unit-testing.md` for placement conventions elsewhere in the repo.
- `test:mutation` is not defined for this package (only `elements` runs Stryker).
