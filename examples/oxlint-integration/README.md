# Oxlint integration example

Minimal example of configuring `eslint-plugin-boundaries` with [Oxlint](https://oxc.rs/docs/guide/usage/linter.html), as described in the [Oxlint integration guide](https://www.jsboundaries.dev/docs/guides/oxlint-integration/).

It demonstrates:

- Loading `eslint-plugin-boundaries` as an Oxlint [JS plugin](https://oxc.rs/docs/guide/usage/linter/js-plugins) via `jsPlugins`.
- Scoping which files the plugin analyzes with [`boundaries/include`](https://www.jsboundaries.dev/docs/settings/settings/#boundariesinclude), so config files aren't linted against the element patterns.
- Resolving TypeScript imports, including the path aliases defined in [`tsconfig.json`](./tsconfig.json) (`@helpers/*`, `@components/*`) — **required**, since Oxlint activates no resolver by default, and unresolved imports are treated as unknown/external.
- Classifying files into elements (`helper`, `component`, `module`) and enforcing dependency policies between them with the [`boundaries/dependencies` rule](https://www.jsboundaries.dev/docs/rules/dependencies/).

## Structure

```
src/
├── helpers/
│   └── format-message/   # helper: can't depend on anything
├── components/
│   └── message/          # component: can depend on helpers
└── modules/
    └── printer/          # module: can depend on components and helpers
```

## Configuration variants

The same rules and elements are configured three times, to demonstrate equivalent setups:

| File | Config format | Resolver |
| --- | --- | --- |
| [`.oxlintrc.json`](./.oxlintrc.json) | JSON | `eslint-import-resolver-typescript` |
| [`oxlint.config.ts`](./oxlint.config.ts) | TypeScript | `eslint-import-resolver-typescript` |
| [`.oxlintrc.oxc.json`](./.oxlintrc.oxc.json) | JSON | `eslint-import-resolver-oxc` |

`oxlint.config.ts` requires Node.js `^20.19.0` or `>=22.18.0` (Oxlint's TypeScript config files run through Node.js's native type-stripping support). Use `.oxlintrc.json` if your Node.js version doesn't meet that requirement.

## Usage

From the repository root:

```bash
pnpm install
pnpm nx lint example-oxlint-integration
```

Nx builds the local `eslint-plugin` package before linting, so the example always runs against the sources of this repository. After the plugin is built, you can also run Oxlint directly from this folder:

```bash
pnpm lint
```

This runs all three configuration variants above in sequence. You can also run each one individually:

```bash
pnpm lint:json          # .oxlintrc.json
pnpm lint:ts-config      # oxlint.config.ts
pnpm lint:oxc-resolver   # .oxlintrc.oxc.json
```

Linting passes because every import complies with the configured policies. To see the plugin in action, add a disallowed dependency and run it again. For example, import a module from a component in `src/components/message/index.ts`:

```ts
import printFormattedMessage from "../../modules/printer";
```

You should also try removing the `import/resolver` setting from any of the configs and re-running its script: relative imports that can no longer be resolved (like `../../helpers/format-message` in `src/modules/printer/index.ts`) are flagged by `boundaries/no-unknown-dependencies`, while `tsconfig.json` path-alias imports (like `@helpers/format-message`) are silently reclassified as `external` and skip boundary checks entirely instead of erroring. This is the single most common issue when integrating `eslint-plugin-boundaries` with Oxlint — see the [guide](https://www.jsboundaries.dev/docs/guides/oxlint-integration/) for details.

## Using this example outside the repository

The example depends on the local plugin sources through the `workspace:` protocol, aliased under the published package name `eslint-plugin-boundaries`. To use it as a template for your own project, replace it in `package.json` with the version published in the npm registry:

```json
"eslint-plugin-boundaries": "latest"
```

**Note:** Because the workspace package is internally named `@boundaries/eslint-plugin`, these configs use the explicit `{ "name": "boundaries", "specifier": "eslint-plugin-boundaries" }` form for `jsPlugins`. If you install the published `eslint-plugin-boundaries` package directly (not through a workspace alias), the plain string form `"jsPlugins": ["eslint-plugin-boundaries"]` also works, since Oxlint derives the `boundaries` rule namespace from its own `package.json` `name` field. See the guide for the full explanation.
