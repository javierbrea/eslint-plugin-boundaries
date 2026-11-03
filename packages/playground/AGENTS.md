# AGENTS Instructions — `playground`

Package-scoped agent instructions for `@boundaries/playground` (Nx project `playground`, private): a React component that classifies the files of a project and evaluates its dependencies against a boundaries config, in the browser. The website renders it at `/playground/`; a local app that opens a real project is its second host.

## Host contract

- The package exports one component, `Playground`, whose props are the whole contract with a host: a `ProjectSource` (where the project comes from, and what can be edited) and a `StateStore` (where the state is kept). They live in `src/contract/`, with their in-memory implementations.
- The host owns the page, its layout and its theme. The package never imports from a host (the Docusaurus aliases, Infima, or a relative path into the website; lint-enforced in `eslint.config.mjs`), never adds global styles, and touches `window` and `document` only in effects and event handlers.
- It reads the `--jsb-*` tokens of the host (`packages/website/src/css/tokens.css`) and follows the host's `data-theme` attribute on `<html>`. It never changes the attributes of `<html>` and never reads or writes `localStorage`; `src/theme/Root.tsx` keeps MUI from doing so.
- It runs only in browsers: `src` never reads a Node.js global, and its tests run in jsdom.

## Layering

`src/` is split into element types and file categories whose allowed imports are lint-enforced with the workspace `eslint-plugin-boundaries`, and every source file is classified; read `eslint.config.mjs` for the policy in force, and classify a new folder there before using it. The engine consumes `@boundaries/config` and `@boundaries/policies` through their public exports only.

## Stack

- Widgets are MUI (`@mui/material`), because the local app and its graph view build on it.
- `src/theme/` scopes MUI to the root element of the playground: the theme's CSS variables have their own prefix and apply to that element, each color scheme under the host's `data-theme`; one Emotion cache with its own key serves every mount; there is no `CssBaseline`.
- Overlays render inside the root element, where the variables are. So while a dialog is open, MUI locks the scroll of the root element and not of the page, and the host's elements stay in the accessibility tree.
- Styles follow the color scheme through CSS only (`theme.vars`, `theme.applyStyles`). With CSS variables, `useTheme().palette` is always the light scheme, and `useColorScheme()` follows the system preference instead of the host, so no code reads the scheme from either.
- Every style lives in JavaScript, so the package exports no CSS file.
- React, React DOM, `@mui/material`, `@emotion/react` and `@emotion/styled` are peer dependencies, so that each host has one instance of their context, and each host bundles the package. Each peer is also a devDependency at the exact version that `packages/website/package.json` has, and so is `@types/react`: with two versions installed, the website's type check fails and the website bundles a second copy of MUI and Emotion.

## Harness

`pnpm nx dev playground` starts the Vite harness in `dev/`: the website's tokens and fonts, a sample sketch, and a button that toggles `data-theme` as the website does. It is not part of the build.
