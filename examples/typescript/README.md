# TypeScript example

Minimal example of configuring `eslint-plugin-boundaries` in a TypeScript project, as described in the [TypeScript Support guide](https://www.jsboundaries.dev/docs/guides/typescript-support/).

It demonstrates:

- Parsing TypeScript files with `@typescript-eslint/parser`.
- Resolving TypeScript imports with `eslint-import-resolver-typescript`, including the path aliases defined in [`tsconfig.json`](./tsconfig.json) (`@helpers/*`, `@components/*`).
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

## Usage

From the repository root:

```bash
pnpm install
pnpm nx lint example-typescript
```

Nx builds the local `eslint-plugin` package before linting, so the example always runs against the sources of this repository. After the plugin is built, you can also run ESLint directly from this folder:

```bash
pnpm lint
```

Linting passes because every import complies with the configured policies. To see the plugin in action, add a disallowed dependency and run it again. For example, import a module from a component in `src/components/message/index.ts`:

```ts
import printFormattedMessage from "../../modules/printer";
```

## Using this example outside the repository

The example depends on the local plugin sources through the `workspace:` protocol. To use it as a template for your own project, replace the `eslint-plugin-boundaries` version in `package.json` with the one published in the npm registry:

```json
"eslint-plugin-boundaries": "latest"
```
