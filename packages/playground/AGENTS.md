# AGENTS Instructions — `playground`

Package-scoped agent instructions for `@boundaries/playground` (Nx project `playground`, private): a React component that classifies the files of a project and evaluates its dependencies against a boundaries config, in the browser. The website renders it at `/playground/`; a local app that opens a real project is its second host.

## Host contract

- The package exports one component, `Playground`, whose props are the whole contract with a host: a `ProjectSource` (where the project comes from, and what can be edited) and a `StateStore` (where the state is kept). They live in `src/contract/`, with their in-memory implementations, and their TSDoc says what each member does and which ones are optional.
- The host owns the page, its layout and its theme, and gives the container of the playground its height: the playground fills it. The package never imports from a host (the Docusaurus aliases, Infima, or a relative path into the website; lint-enforced in `eslint.config.mjs`), never adds global styles, and touches `window` and `document` only in effects and event handlers.
- It reads the `--jsb-*` tokens of the host (`packages/website/src/css/tokens.css`) and follows the host's `data-theme` attribute on `<html>`. It never changes the attributes of `<html>` and never reads or writes `localStorage`; `src/ui-kit/providers/ThemeRoot/` keeps MUI from doing so.
- The package has two entries. `@boundaries/playground` (`src/index.ts`) exports the component, the contract and the stores. `@boundaries/playground/share` (`src/share.ts`) reaches only helpers: it loads no React, no MUI and no component, and it also runs in Node.js, where the docs compute the link of an example while they render on the server. The rest runs only in browsers.
- The evaluation runs in a web worker that the package creates, so that a project that takes long to evaluate never blocks the page. Its script, `src/domains/evaluation/helpers/evaluator/evaluation.worker.ts`, is a third file of the build, beside `dist/index.js`, and the TSDoc of `spawnWorker` says how each host finds it. Only `serveEvaluations`, which the script runs, creates an engine, and only the script imports it; the rest of the production code takes from the engine its types and `tokenizeConfig` only. Both are lint-enforced in `eslint.config.mjs` for any import syntax, so the `@boundaries/*` packages load in the worker and never in the page.
- `src` never reads a Node.js global, and its tests run in jsdom, except `src/share.spec.ts`, which runs in Node.js (`@jest-environment node`) to prove the `/share` entry works there. What `share.ts` reaches uses only the web globals that Node.js also has, such as `btoa` and `TextEncoder`.
- A sketch that comes from outside, such as a link, is untrusted: `decodeHash` refuses data that unpacks past the limit of `src/domains/share/helpers/sketchHash/sketchHash.constants.ts` before anything reads it, and `readSketch` refuses what the edits could not make and what passes the limits of `src/domains/project/helpers/sketch/sketch.constants.ts`. A check that runs over it takes time in proportion to its size, through `createNodeIndex` and `createDependencyChecker`, and never scans the nodes or the dependencies already read for each new one.

## Layering

`src/` is split first into domains by concept, then by layer. The imports between elements are lint-enforced with the workspace `eslint-plugin-boundaries`, and every source file is classified; read `eslint.config.mjs` for the policy in force, and classify a new folder there before using it. The conventions for the files of an element and for its tests are in `.agents/rules/playground-components.md` and `.agents/rules/playground-testing.md`.

```
src/
├─ index.ts         package entry: the component, the contract, the examples and the stores
├─ share.ts         the `/share` entry: the link of an example, for the docs
├─ app/             the Playground component
├─ contract/        the host contract
├─ ui-kit/          domain-free building blocks, mostly MUI with the playground's styles
├─ shared/          what no domain owns, such as the page object base
└─ domains/
   ├─ project/      the sketch as a tree or as text: helpers, ui, modules
   ├─ config/       the eslint.config.js node: ui, modules
   ├─ files/        an open file and its dependencies: ui, modules
   ├─ evaluation/   what boundaries says about the sketch: helpers, ui
   ├─ problems/     the problems of the sketch: helpers, ui, modules
   ├─ session/      what the user has open and edits in one instance: helpers, data
   ├─ share/        the sketch as a link: helpers, data, modules, ui
   ├─ shell/        the frame that places the panes: ui, modules
   └─ examples/     the examples and their picker: data, modules, ui
```

An element is one folder of a layer, `<layer>/<Name>/`, under `shared/`, under `domains/<domain>/` or, for the `ui-kit-*` types, under `ui-kit/`. Its entry is the `index.ts` at its root; the hooks of a module under `modules/<Name>/hooks/` are private to that module. The layers and what each may import:

| Type | Folder | What it is | May import the entry of |
| --- | --- | --- | --- |
| `contract` | `contract/` | The host contract | nothing |
| `helper` | `helpers/<name>/` | Pure TypeScript: no React, no MUI | `helper`, `contract` |
| `data` | `data/<name>/` | Where state comes from and lives: the store of an instance, the load of a sketch, static content | `data`, `helper`, `contract` |
| `module-hook` | `modules/hooks/<useX>/` | Headless orchestration over data hooks and helpers; returns facts | `data`, `helper`, `module-hook`, `contract` |
| `module` | `modules/<Name>/` | Connects data to ui: reads the store, composes `ui` and `ui-kit` components | `data`, `module`, `module-hook`, `helper`, every `ui-*` and `ui-kit-*`, `contract` |
| `ui-helper` | `ui/helpers/<name>/` | Presentation logic without JSX: display text, tones, rows | `ui-helper`, `ui-kit-helper`, `helper`, `contract` |
| `ui-context` | `ui/contexts/<Name>/` | A React context, its provider and its hook; renders no markup | `ui-context`, `ui-kit-context`, `ui-helper`, `ui-kit-helper`, `helper`, `contract` |
| `ui-atom` | `ui/atoms/<Name>/` | Presentational; composes no `ui` component | `ui-helper`, `ui-context`, `ui-kit-atom`, `ui-kit-context`, `ui-kit-helper`, `helper`, `contract` |
| `ui-molecule` | `ui/molecules/<Name>/` | Composes atoms | as `ui-atom`, plus `ui-atom`, `ui-kit-molecule` |
| `ui-organism` | `ui/organisms/<Name>/` | Composes molecules or organisms | as `ui-molecule`, plus `ui-molecule`, `ui-organism`, `ui-kit-organism` |
| `ui-template` | `ui/templates/<Name>/` | Arranges slots into a layout | as `ui-organism`, plus `ui-template`, `ui-kit-template` |
| `ui-provider` | `ui/providers/<Name>/` | Mounts a capability around `children` | every `ui-*` and `ui-kit-*`, `helper`, `contract` |
| `ui-kit-helper` | `ui-kit/helpers/<name>/` | Domain-free presentation logic: the theme, the tones | `ui-kit-helper`, `helper` |
| `ui-kit-context` | `ui-kit/contexts/<Name>/` | Domain-free context | `ui-kit-context`, `ui-kit-helper`, `helper` |
| `ui-kit-atom` | `ui-kit/atoms/<Name>/` | Domain-free building block | `ui-kit-context`, `ui-kit-helper`, `helper` |
| `ui-kit-molecule` | `ui-kit/molecules/<Name>/` | Composes `ui-kit` atoms | as `ui-kit-atom`, plus `ui-kit-atom` |
| `ui-kit-organism` | `ui-kit/organisms/<Name>/` | Composes `ui-kit` molecules | as `ui-kit-molecule`, plus `ui-kit-molecule`, `ui-kit-organism` |
| `ui-kit-template` | `ui-kit/templates/<Name>/` | Domain-free layout | as `ui-kit-organism`, plus `ui-kit-template` |
| `ui-kit-provider` | `ui-kit/providers/<Name>/` | Domain-free capability: the theme root | every `ui-kit-*`, `helper` |
| `testing` | `shared/testing/<name>/` | Test support shared by specs and page objects | `testing`, `helper`, every `ui-kit-*`, `contract` |
| `app` | `app/` | The `Playground` component | `module`, `data`, every `ui-*` and `ui-kit-*`, `helper`, `contract` |

- An element may always import itself; any import the table does not list is denied. `src/index.ts` imports only the entries of `app`, `contract` and `data`, and `src/share.ts` only the entries of `helper` elements.
- `shared/` has every layer of a domain except `modules/<Name>`, plus `testing/`. A layer folder is created with its first element.
- Domains organize the code, they do not isolate it: a domain imports the entries of another domain's elements. The exceptions are three limits. `shared` and `ui-kit` never import a domain. Only `app` and the `shell` domain import the `shell` domain. The `session` domain imports, among the domains, only the `helper` elements of `project` and `evaluation`, so that every other domain can depend on it. The limits apply to specs, page objects and mocks too.
- External packages are allowed per layer: React outside `helper` and `contract`, MUI and Emotion in `ui-*` and `ui-kit-*`, and the rest (the tree view, CodeMirror, the resizable panels, the `@boundaries/*` packages, `@humanwhocodes/momoa` and `fflate`) in the elements that need them. The engine, `domains/evaluation/helpers/engine`, is the only production code that imports `@boundaries/*`, through their public exports only, and the types it exports are the playground's own, so that no other code depends on the shape of their results. Test, page object, mock and `testing` files may import any external package. A new external package is allowed in `eslint.config.mjs` before its first import.

Where a new element goes:

- Pure TypeScript with no React goes to `helpers/` of the domain that owns the concept, or of `shared/` when no domain does.
- A source of state or static content goes to `data/`. A hook that combines data hooks into facts goes to `modules/hooks/`, or to the `hooks/` folder of the one module that uses it.
- Whatever reads the store and renders components is a module of its domain. Display text, tones and icons are `ui/helpers`, never module or data code.
- A presentational component that names a playground concept goes to `ui/` of its domain, in the sub-layer its imports put it in. One that names none goes to `ui-kit/`.
- Support shared by specs and page objects goes to `shared/testing/`.

The state of a playground instance lives in its store (`src/domains/session/data/store`): an edit is one pure transition that moves everything it affects, the panes read and change the `SessionStore` through the hooks of that element and through module-hooks, and whatever opens something produces a `Target` (`src/domains/session/helpers/focus`). A transition that edits what the `ProjectCapabilities` of the state do not allow returns the same state; the panes read the capabilities only to show or hide their controls. A component keeps only what belongs to the page, such as a keyboard focus request or an open dialog. The store asks its evaluator (`src/domains/evaluation/helpers/evaluator`) for the evaluation of each sketch; until it arrives, the state keeps the last evaluation aligned to the sketch (`alignEvaluation`), or none before the first, and `evaluationStatus` says how it stands to the sketch, so a pane never assumes that the evaluation is of the sketch on screen.

## Stack

- Widgets are MUI (`@mui/material`), because the local app and its graph view build on it.
- `src/ui-kit/helpers/theme/` and `src/ui-kit/providers/ThemeRoot/` scope MUI to the root element of the playground: the theme's CSS variables have their own prefix and apply to that element, each color scheme under the host's `data-theme`; one Emotion cache with its own key serves every mount; there is no `CssBaseline`.
- Overlays render inside the root element, where the variables are. So while a dialog is open, MUI locks the scroll of the root element and not of the page, and the host's elements stay in the accessibility tree.
- Styles follow the color scheme through CSS only (`theme.vars`, `theme.applyStyles`). With CSS variables, `useTheme().palette` is always the light scheme, and `useColorScheme()` follows the system preference instead of the host, so no code reads the scheme from either.
- Text styles come from the type scale in `src/ui-kit/helpers/theme/typography.ts`: a component spreads `theme.typography.<variant>` in `styled`, and a pane never writes a literal font size, font weight or `font` shorthand. Only the code editor reads the scale as constants, because CodeMirror builds its theme before any MUI theme exists. The focus ring and the row hover are `FOCUS_RING` and `HOVER_BACKGROUND` of `src/ui-kit/helpers/theme/`, not copies.
- Every style lives in JavaScript, so the package exports no CSS file.
- React, React DOM, `@mui/material`, `@emotion/react` and `@emotion/styled` are peer dependencies, so that each host has one instance of their context, and each host bundles the package. Each peer is also a devDependency at the exact version that `packages/website/package.json` has, and so is `@types/react`: with two versions installed, the website's type check fails and the website bundles a second copy of MUI and Emotion.

## Harness

`pnpm nx dev playground` starts the Vite harness in `dev/`: the website's tokens and fonts, the Quick start example kept in the hash of the URL by a `HashStore`, as on the website, and a button that toggles `data-theme` as the website does. It is not part of the build.
