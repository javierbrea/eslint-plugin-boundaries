# AGENTS Instructions — `@boundaries/policies`

Package-scoped agent instructions for `@boundaries/policies` (Nx project `policies`). See `.agents/rules/unit-testing.md` and `typescript-conventions.md` for conventions that apply here too.

The package evaluates what the user wrote, as `@boundaries/config` normalizes it: it describes files and dependencies from their paths, decides which dependencies the `dependencies` rule checks, evaluates its policies and builds the messages. `@boundaries/eslint-plugin` reads the AST, resolves modules, prints the diagnostics and the debug output and reports; `@boundaries/analysis` evaluates a whole project with the methods of a `Policies` instance, and the website playground evaluates through it.

## Layering

Folders under `src/`, bottom to top. Each one imports only from the folders before it, through their `index.ts`:

1. `Shared` — a private copy of the type helpers.
2. `Messages` — the default messages of the `dependencies` rule, the custom messages with their Handlebars and legacy `${...}` templates, and the types of the template context.
3. `Descriptions` — `getMatcher`, `describeEntity` and `describeDependency`.
4. `Evaluation` — the dependency selectors of each policy, `getDependencySkipReason`, `evaluatePolicies` and `evaluateDependency`.
5. `Policies` — the `Policies` class, whose methods describe and evaluate as the functions of the same name, with matchers of its own.

The layering is not lint-enforced, and the package has no project edge to `eslint-plugin`, neither an `implicitDependencies` entry nor a dependency that Nx infers, because the plugin depends on this package and Nx refuses the cycle between their `^build` targets.

## Hard constraints

- The package runs in browsers (`.agents/rules/browser-code.md`) and does not depend on the platform: `src` never imports `eslint`, `estree`, `eslint-module-utils`, `chalk` or a `node:*` module, and never reads a Node.js global, not even from `globalThis`.
- Functions never print. A problem found while evaluating is a `Diagnostic` of `@boundaries/config` in the result, with the paths of the affected entries from the root of the options. The exception is a custom `message` that fails to render, such as one with invalid Handlebars syntax or an unknown helper: `evaluatePolicies` throws an error that names the message and where it is set, with the Handlebars error as its `cause`, and the plugin fails with it.
- The messages are the texts the plugin reports, so changing one changes the plugin's output, and its changelog.
- Which dependencies `getDependencySkipReason` skips, and in which order it checks the reasons, is what the `dependencies` rule does: the plugin calls it before normalizing the policies, so that an invalid selector does not fail on a file whose dependencies are all skipped.
- The module functions build their matchers with one module-wide `Elements`, which keeps every matcher for the life of the module and returns the same one for settings of equal content; the plugin relies on it, since it normalizes the settings once per `context.settings` object. Each `Policies` instance builds them with an `Elements` and a `WeakMap` of its own, so its matchers are freed with it and never shared with another instance or with the functions. The functions and the class run the same code, which takes the function that returns the matcher, and `evaluateDependency` gets no matcher for a skipped dependency.
- Memoization by object identity is in `WeakMap`s: the matcher by `SettingsNormalized`, and the dependency selectors by `DependenciesPolicyNormalized`. Results are shared with the caches and are never mutated, and neither is the input.
- `src/index.ts` is the public interface: a symbol of any other file is public only when `src/index.ts` lists it.

## Build and test shape

- Built with **tsup** (`tsup.config.js`) for Node.js and browsers, like `config`; type-checked with `tsc --noEmit`.
- `test:e2e` (`test/e2e/builds.spec.mjs`) bundles the package with `@boundaries/config` and `@boundaries/elements` with esbuild for browsers, as an import and as a require, runs the bundles without Node.js globals and checks that they return what the Node.js CommonJS and ES module builds return. Run it after changing dependencies or the build.
- Run `test:mutation` (Stryker) when changing how dependencies are skipped, how policies are evaluated or how messages are built, since the 100% unit coverage does not prove that a test checks each condition there.
