# AGENTS Instructions — `@boundaries/config`

Package-scoped agent instructions for `@boundaries/config` (Nx project `config`). See `.agents/rules/unit-testing.md` and `typescript-conventions.md` for conventions that apply here too.

The package reads what the user writes: it normalizes and validates the `boundaries/*` settings and the rule options of the ESLint plugin, and returns every problem as a `Diagnostic` instead of printing it. `@boundaries/eslint-plugin` prints those diagnostics, and other hosts, such as the website playground, list them.

## Layering

Folders under `src/`, bottom to top. Each one imports only from the folders before it, through their `index.ts`:

1. `Shared` — constants and types of what the user writes (`Settings.types.ts`) and a private copy of the type helpers.
2. `Diagnostics` — the `Diagnostic` and `ConfigResult` types and `DiagnosticsBuilder`, which keeps each title and detail once, in order, merging their paths.
3. `Docs` — the URL builders of the docs links that diagnostics carry.
4. `Schemas` — the JSON schema of the options of each rule, and the validator that applies it as ESLint does.
5. `Settings` — `normalizeSettings`.
6. `RuleOptions` — `validateRuleOptions` and `normalizeDependenciesRuleOptions`.
7. `Config` — `normalizeConfig`, which composes the folders above.

The layering is not lint-enforced: linting this package with the workspace plugin would make the plugin its devDependency, and Nx refuses the cycle between their `^build` targets.

## Hard constraints

- The package runs in browsers (`.agents/rules/browser-code.md`). `src` never imports `eslint`, `estree`, `eslint-module-utils`, `chalk` or a `node:*` module.
- Functions never print. Each problem in the input is a `Diagnostic`, added through `DiagnosticsBuilder` with a level (`error` for what ESLint rejects, `warning` for what is ignored or has no effect, `deprecation` for legacy syntax that still works) and the paths of the affected entries from the root of the function's input. `normalizeDependenciesRuleOptions` is the exception: it assumes options that passed the rule schema and reports nothing.
- Titles and details are the texts the plugin prints with `warnOnce`, so changing one changes the plugin's output, and its changelog.
- Results are computed from the input on every call, and the input is never mutated. The only memoization is the compiled validator of each rule in `Schemas/Validator.ts`, which depends only on the rule name.
- `src/index.ts` is the public interface: `Shared/Settings.types.ts`, the types and constants of what the user writes, is public as a whole, and a symbol of any other file is public only when `src/index.ts` lists it.

## Build and test shape

- Built with **tsup** (`tsup.config.js`) for Node.js and browsers, like `elements`; type-checked with `tsc --noEmit`.
- `test:e2e` (`test/e2e/builds.spec.mjs`) bundles the package with esbuild for browsers, as an import and as a require, runs the bundles without Node.js globals and checks that they return what the Node.js CommonJS and ES module builds return. Run it after changing dependencies or the build.
- The schema validation reproduces ESLint's: the `ajv` version that ESLint resolves, the `ajv` options of `eslint/lib/shared/ajv.js`, the wrapping of an array `meta.schema`, and its error texts. Keep `Schemas/Validator.ts` in sync with them.
