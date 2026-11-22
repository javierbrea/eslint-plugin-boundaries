# AGENTS Instructions — `@boundaries/analysis`

Package-scoped agent instructions for `@boundaries/analysis` (Nx project `analysis`). See `.agents/rules/unit-testing.md` and `typescript-conventions.md` for conventions that apply here too.

The package evaluates a whole project against a boundaries config, without ESLint and without the text of the config. `analyzeConfig` normalizes a config object with `@boundaries/config`, chooses the rule whose dependencies are evaluated and summarizes the config, with the path of each entry in the config object. `evaluateProject` describes every file and every dependency of a project and decides each dependency with `@boundaries/policies`, as the plugin and its `dependencies` rule do, and adds the counts that depend on the project. The engine of the website playground calls it through an adapter.

## Layering

The folders under `src/` are elements whose imports `eslint.config.mjs` lint-enforces with the workspace plugin; read it for which element imports which, and through which file. `Evaluation` never reads the config as written, only the `ConfigAnalysis` that `Config` made of it.

## Hard constraints

- The package runs in browsers (`.agents/rules/browser-code.md`), and its functions never print: a problem of the config is a `Diagnostic` of `@boundaries/config` in the result.
- The package keeps no memo and no state between calls: every result is computed from the arguments of the call. A host that evaluates often keeps a memo of its own, as the adapter of the playground does.
- `src/index.ts` is the public interface: a symbol of any other file is public only when `src/index.ts` lists it.
- The types that `src/index.ts` exports are a published contract: a change that makes code stop type-checking against them is MAJOR (`.github/CONTRIBUTING.md`, "Versioning").

## Build and test shape

- Built with **tsup** (`tsup.config.js`) for Node.js and browsers, like `policies`; type-checked with `tsc --noEmit`.
- Specs are colocated with the source (`.agents/rules/unit-testing.md`).
- `test:e2e` (`test/e2e/builds.spec.mjs`) bundles the package with esbuild for browsers, as an import and as a require, runs the bundles without Node.js globals and checks that they return what the Node.js CommonJS and ES module builds return. Run it after changing dependencies or the build.
- Run `test:mutation` (Stryker) when changing how the config is normalized, how the rule is chosen or how a dependency is decided; its surviving mutants follow `.agents/rules/mutation-testing.md`.
