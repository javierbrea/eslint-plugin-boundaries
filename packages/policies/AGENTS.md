# AGENTS Instructions — `@boundaries/policies`

Package-scoped agent instructions for `@boundaries/policies` (Nx project `policies`). See `.agents/rules/unit-testing.md` and `typescript-conventions.md` for conventions that apply here too.

The package evaluates what the user wrote, as `@boundaries/config` normalizes it: it describes files and dependencies from their paths, decides which dependencies the `dependencies` rule checks, evaluates its policies and builds the messages. `@boundaries/eslint-plugin` reads the AST, resolves modules, prints the diagnostics and the debug output and reports; other hosts, such as the website playground, call the same functions.

## Layering

Folders under `src/`, bottom to top. Each one imports only from the folders before it, through their `index.ts`:

1. `Shared` — a private copy of the type helpers.
2. `Messages` — the default messages of the `dependencies` rule, the custom messages with their Handlebars and legacy `${...}` templates, and the types of the template context.
3. `Descriptions` — `getMatcher`, `describeEntity` and `describeDependency`.
4. `Evaluation` — the dependency selectors of each policy, `getDependencySkipReason`, `evaluatePolicies` and `evaluateDependency`.

The layering is not lint-enforced: linting this package with the workspace plugin would make the plugin its devDependency, and Nx refuses the cycle between their `^build` targets.

## Hard constraints

- The package runs in browsers (`.agents/rules/browser-code.md`) and does not depend on the platform: `src` never imports `eslint`, `estree`, `eslint-module-utils`, `chalk` or a `node:*` module, and never reads a Node.js global, not even from `globalThis`.
- Functions never print. A problem found while evaluating is a `Diagnostic` of `@boundaries/config` in the result, with the paths of the affected entries from the root of the options. The exception is a custom `message` with invalid Handlebars syntax: rendering it throws, as it does in the plugin.
- The messages are the texts the plugin reports, so changing one changes the plugin's output, and its changelog.
- Which dependencies `getDependencySkipReason` skips, and in which order it checks the reasons, is what the `dependencies` rule does: the plugin calls it before normalizing the policies, so that an invalid selector does not fail on a file whose dependencies are all skipped.
- Memoization is by object identity in `WeakMap`s: the matcher by `SettingsNormalized`, and the dependency selectors by `DependenciesPolicyNormalized`. Results are shared with the caches and are never mutated, and neither is the input.
- `src/index.ts` is the public interface: a symbol of any other file is public only when `src/index.ts` lists it.

## Build and test shape

- Built with **tsup** (`tsup.config.js`) for Node.js and browsers, like `config`; type-checked with `tsc --noEmit`.
- `test:e2e` (`test/e2e/builds.spec.mjs`) bundles the package with `@boundaries/config` and `@boundaries/elements` with esbuild for browsers, as an import and as a require, runs the bundles without Node.js globals and checks that they return what the Node.js CommonJS and ES module builds return. Run it after changing dependencies or the build.
- Run `test:mutation` (Stryker) when changing how dependencies are skipped, how policies are evaluated or how messages are built, since the 100% unit coverage does not prove that a test checks each condition there.
