# AGENTS Instructions — `playground`

Package-scoped agent instructions for `@boundaries/playground` (Nx project `playground`, private): a React component that classifies the files of a project and evaluates its dependencies against a boundaries config, in the browser. The website renders it at `/playground/`; a local app that opens a real project is its second host.

## Host contract

- The package exports one component, `Playground`, whose props are the whole contract with a host: a `ProjectSource` (where the project comes from, and what can be edited) and a `StateStore` (where the state is kept). They live in `src/contract/`, with their in-memory implementations.
- The host owns the page, its layout and its theme. The package never imports from a host (`@docusaurus/*`, `@theme/*`, `@site/*`, Infima), never adds global styles, and touches `window` and `document` only in effects and event handlers.
- It reads the `--jsb-*` tokens of the host (`packages/website/src/css/tokens.css`) and follows the host's `data-theme` attribute on `<html>`. It never changes the attributes of `<html>` or writes to `localStorage`; `src/theme/Root.tsx` keeps MUI from doing either.
- It runs only in browsers: `src` never reads a Node.js global, and its tests run in jsdom.

## Layering

`src/` is split into element types and file categories whose allowed imports are lint-enforced with the workspace `eslint-plugin-boundaries`, and every source file is classified; read `eslint.config.mjs` for the policy in force, and classify a new folder there before using it. The engine consumes `@boundaries/config` and `@boundaries/policies` through their public exports only.

## Stack

- Widgets are MUI (`@mui/material`), because the local app and its graph view build on it.
- `src/theme/` scopes MUI to the root element of the playground: the theme's CSS variables apply to that element, each color scheme under the host's `data-theme`; the Emotion cache has its own key; overlays render inside the root element, where the variables are; there is no `CssBaseline`.
- Every style lives in JavaScript, so the package exports no CSS file.
- React, React DOM, `@mui/material`, `@emotion/react` and `@emotion/styled` are peer dependencies, so that each host has one instance of their context, and each host bundles the package. Each peer is also a devDependency at the exact version that `packages/website/package.json` has.

## Harness

`pnpm --filter @boundaries/playground dev` starts the Vite harness in `dev/`: the website's tokens and fonts, a sample sketch, and a button that toggles `data-theme` as the website does. It is not part of the build.
