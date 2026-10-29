# AGENTS Instructions — `@boundaries/eslint-plugin`

Package-scoped agent instructions for `@boundaries/eslint-plugin` (Nx project `eslint-plugin`). See `.agents/rules/eslint-rule-authoring.md` for how to add or change a rule, and `.agents/rules/unit-testing.md`/`typescript-conventions.md` for conventions that apply here too.

## Boundary element types

This package **dogfoods `@boundaries/eslint-plugin` on its own source** (`eslint.config.mjs`), declaring eight element types under `src/`: `rule-support` (`Rules/Support`), `rule` (`Rules`), `config` (`Config`), `elements` (`Elements`), `settings` (`Settings`), `debug` (`Debug`), `public` (`Public`), `shared` (`Shared`). `shared` is universal (anything may import it); same-element imports are always allowed; source may never import a `test`-category file (`**/*.spec.ts`); `src/index.ts` is the sole `entry`-category file.

The layering is strictly downward — `debug` imports only `shared`; `settings`/`elements` import `debug`; `rule-support` imports `elements`/`settings`/`debug`; `rule` imports `rule-support` plus the layers below it; `public` re-exports from `@boundaries/elements`, `@boundaries/config` and `@boundaries/policies`; `config` wires `public`/`settings` for the `entry` file. **The boundaries above are lint-enforced — read `packages/eslint-plugin/eslint.config.mjs` for the exact policy in force**, not this paragraph, when it matters which element may import which.

Normalizing and validating the settings and rule options belongs to `@boundaries/config` (`packages/config/AGENTS.md`); the plugin never reimplements it. `settings` is its ESLint adapter: it resolves the root path from the environment and the working directory, caches the normalized settings and rule options of an ESLint run by object identity, and prints the returned diagnostics with `warnDiagnostics`. `shared` re-exports the constants and types of `@boundaries/config` that the plugin uses, and defines only what depends on ESLint or Node.js (the ESLint-typed types and the environment variable names) plus its own copy of the type helpers.

Describing files and dependencies, deciding which dependencies the `dependencies` rule checks, evaluating its policies and building the messages belong to `@boundaries/policies` (`packages/policies/AGENTS.md`). `elements` is its ESLint adapter: it reads the specifiers from the AST and resolves the imported module before describing a dependency. The `dependencies` rule asks `getDependencySkipReason` with the options as the user wrote them and normalizes the policies only for the dependencies it checks; `evaluatePoliciesAndReport` prints the diagnostics and the debug output of an evaluation and reports its message, for that rule and for the legacy rules that translate their options into `dependencies` policies.

## Build and test shape

- `lint` depends on `build`, because `eslint-local-rules.js` `require()`s `./dist/index.js` to lint the package against its own compiled rules. Rebuild before trusting a `lint` run's boundary results.
- `check:types` runs both `tsconfig.code.json` and `tsconfig.test.json` — a change can type-check under one and fail the other.
