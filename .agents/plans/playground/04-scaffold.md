<!-- cspell:disable -->
# Phase 4: research notes 1, 3 and 4, `packages/playground` and the website shell

Goal: the package `@boundaries/playground` exists with its host contract, a placeholder component, a dev harness and its quality tooling; the website renders it at `/playground/` client-side only; the stack (parser, editor, component library) is chosen and recorded. No pane of the interface is built.

Issue: #551. Branch `feat/551/playground-scaffold` from `feat/539/playground`; PR into `feat/539/playground`, title `feat(playground): scaffold the package and the website shell`, `closes #551`. Changelog: none yet (`packages/website/CHANGELOG.md` gets its entry in phase 7 when the page is switched on; the package is private). The PR description includes the three research notes' conclusions with numbers (bundle sizes gzipped) and the Lighthouse and screenshots results of `/playground/`.

Read first:

- RFC #538: "Dependencies", "Decisions" 2 (the contract, pros and cons), "Architecture (fixed)", "Research tasks" 1, 3, 4, "Acceptance".
- `00-shared.md` sections 3 to 6.
- `packages/website/AGENTS.md`, `eslint.config.mjs`, `project.json`, `docusaurus.config.ts`, `src/pages/index.tsx` (how a page composes `Layout`), `src/components/home/PlaygroundTeaser/` (the visual vocabulary of the result rows), `src/css/tokens.css`.
- `packages/elements/tsup.config.js` and `package.json` after #510 (browser build without shims), `packages/config` and `packages/policies` after phases 2 and 3.
- The redesign's PR #544 description: the quality gates it established.

Preconditions: met on 2026-11-02. #510, phase 2 and phase 3 are in `release`, released in v7.4.1, and `release` is merged into `feat/539/playground` (e1712596). Run `pnpm install` after checking out the phase branch: the merge added `policies` and `test/browser-e2e`.

## Scope

In: the three research notes posted on #539, the package, the contract types, the placeholder component, the dev harness, the website page and its Nx wiring, the agent files. Out: panes, state in the URL, the navbar entry and the teaser link (phase 7), the mockup (phase 5, which may already be running).

## Steps

### 1. Research note 1: browser bundle

In a scratch folder outside the repo, bundle an entry that imports `@boundaries/elements`, `@boundaries/config` and `@boundaries/policies` with esbuild `platform: "browser"`, `minify: true`, no alias, run it in `node:vm` without Node.js globals calling `normalizeConfig`, `describeEntity`, `describeDependency` (paths only) and `evaluateDependency` on the quick-start example, and record: it runs, the gzipped size of each package and of the three together, and that no module resolution is involved (the sketch is the universe: `to` is passed only for nodes of the sketch, and anything else is external or core, RFC #559, decision 4). Phase 3 measured 95.9 KB for the three on 2026-10-29 (esbuild 0.28.2); the note measures the released 1.0.0 packages the same way and links `test/browser-e2e` (#558) for the run in Chromium, Firefox and WebKit, instead of repeating it. Post the note on #539 ("Research note 1: browser bundle") with the numbers and the conclusion.

### 2. Research note 3: config input and editor

Compare, on the boundaries part of the quick-start `eslint.config.js` pasted as is (unquoted keys, trailing commas, comments):

- Parsers: a JSON5 parser with source locations (`@humanwhocodes/momoa` has a JSON5 mode with locations; `json5` alone has none) versus `acorn` parsing an expression plus a small evaluator for literals, arrays and objects. Criteria: size gzipped, locations for every node (needed to underline `config` diagnostics by JSON path and to scroll to a policy by index), error quality on a wrong paste, and the door to accepting a whole config file later.
- Editors: CodeMirror 6 with `@codemirror/lang-javascript` (or a JSON5 mode) versus a `textarea` with external highlighting. Criteria: size gzipped, inline diagnostics (CodeMirror's `lint` extension), gutter highlight of a range, theming from the `--jsb-*` tokens, SSR safety (must not touch `window` at import time, or be imported lazily).

Decide, post the note with a size table and the choice, and record the choice in the package `AGENTS.md` (step 6).

### 3. Research note 4: component stack

List the widgets the RFC interface needs (tree view with inline rename, tabs, resizable split panes, modal dialog with radio groups and a combobox, a button bar, a dropdown for examples, toasts for "Copied", a code editor) and compare: MUI (`@mui/material` with `cssVariables`, theme mapped from the tokens, Emotion cache scoped to the root, no `CssBaseline`), headless primitives (Radix or Base UI) plus CSS Modules, and CSS Modules only. Criteria: gzipped size lazy-loaded, accessibility out of the box for tree, tabs, dialog and combobox, how cleanly styles are confined to the playground root (no global reset, no portal styles leaking: dialogs that portal to `body` must carry the playground's class), React version compatibility with the website's React (19.x) and the Docusaurus SSR. Decide, post the note, record the choice.

### 4. The package

`packages/playground`:

- `package.json`: name `@boundaries/playground`, `private: true`, `exports` with `.` only (no CSS file, decision 15); `peerDependencies` `react` and `react-dom` at the website's major, and `@mui/material`, `@emotion/react` and `@emotion/styled` (decision 15), each also a devDependency at an exact version for the build, the tests and the harness; dependencies `@boundaries/elements`, `@boundaries/config`, `@boundaries/policies` as `workspace:*`. The scaffold adds only the libraries the placeholder uses (MUI and Emotion); CodeMirror, momoa, `codemirror-json5`, `@mui/x-tree-view` and `react-resizable-panels` arrive in phase 5 with the panes that use them, at the versions of research notes 3 and 4 or newer ones at least two days old. devDependencies: the build tool, Vite for the harness, `@testing-library/react` and jest (jsdom) or Vitest (prefer jest for consistency with the other packages unless the stack forces Vitest; record the reason), `eslint-plugin-boundaries: "workspace:@boundaries/eslint-plugin@*"` for self-linting. The root has jest 30 and Babel with `preset-env` and `preset-typescript` only, so jest in jsdom also needs `jest-environment-jsdom` and the React JSX transform (`@babel/preset-react`) in the package.
- Browser code: the package runs only in browsers. Its `eslint.config.mjs` composes `reactConfig`, `reactHooksConfig` and `createBrowserConfig` of `support/eslint-config`, whose `files` glob is `src/**/*.ts`: widen it to `src/**/*.{ts,tsx}` there (no other package has `.tsx` in `src`) so that the components are covered. No `test:e2e` bundle check in `node:vm` (`00-shared.md` section 4): a React component needs a DOM, so its tests run in jsdom and the website build bundles it; `test/browser-e2e` keeps testing the three engine packages only.
- Build: tsup (as the other packages) with `platform: "browser"`, `format: ["esm"]`, `dts: true`; tsup leaves `dependencies` and `peerDependencies` as imports, so the dist is a library that each host bundles. No CSS output.
- Source layout, lint-enforced in `eslint.config.mjs` with the workspace plugin and `no-unknown-files` on: `src/index.ts` (entry), `src/Playground.tsx` (the component), `src/contract/` (`ProjectSource`, `StateStore`, capability flags, `SketchSource`, `MemoryStore`), `src/engine/` (the adapter from the sketch model to `config` and `policies`, empty but typed now), `src/ui/` (panes later; now the placeholder), `src/theme/` (the MUI theme built from the tokens, the Emotion cache and the root element that scopes both). Policies: `ui` → `contract`, `engine`; `engine` → `contract`; nothing imports `@docusaurus/*`, `@theme/*` or Infima classes (an ESLint `no-restricted-imports` rule in the package config makes this a lint error).
- `project.json`: targets as the others; `build` depends on `^build`; `lint` depends on `eslint:config` and `^build` (it uses the workspace plugin).
- Dev harness: `dev/` folder with a Vite `index.html` that imports the website's `tokens.css` (relative path into `packages/website/src/css/tokens.css`) and `fonts.css`, mounts `<Playground source={sketchSource} store={memoryStore} />` with a theme toggle (`data-theme` on `<html>`); `pnpm --filter playground dev` starts it. The harness is not part of the build.
- Theme and scoping (decision 15), built now so that both hosts prove it before phase 5: `createTheme` with `cssVariables: { nativeColor: true, rootSelector: ".jsb-play-root", colorSchemeSelector: '[data-theme="%s"] .jsb-play-root' }` and light and dark `colorSchemes` whose palette is `var(--jsb-*)` values (a plain `cssVariables: true` throws on them); a `CacheProvider` with an Emotion cache keyed `jsb-play`; overlays (`MuiModal`, `MuiPopover`, `MuiPopper`) rendering into the root element; no `CssBaseline`. The placeholder renders a heading, a button and a dialog opened by it, so that the overlay container and both color schemes are checked in the harness and on the website. Measured with `@mui/material` 9.5.0 on 2026-11-02: the MUI variables go on `.jsb-play-root` only, plus three helper variables of `nativeColor` on `:root` (`--__l-threshold`, `--__l`, `--__a`).
- Tests: a render test of the placeholder; a test that the entry has no Docusaurus import (covered by lint, so the test checks the contract types compile with a fake host instead).
- `AGENTS.md` (+ `CLAUDE.md`): the layering, the host-agnostic constraint, the stack chosen (one line each with why), the harness; under 200 lines, no status.

### 5. The website shell

- `packages/website/package.json`: `"@boundaries/playground": "workspace:*"` in `dependencies` (it is bundled), and the peer dependencies of decision 15 that it does not have yet (`@mui/material`, `@emotion/react`, `@emotion/styled`) at the same exact versions as the playground's devDependencies.
- `packages/website/project.json`: `build` gains `dependsOn: ["^build"]` restricted to the playground if possible (`{ "projects": ["playground"], "target": "build" }`), and `check:types` likewise (both have `dependsOn: []` today, with a comment saying only `lint` needs a build; rewrite that comment); `implicitDependencies` gains `playground`. Check `pnpm nx graph`.
- Netlify builds through Nx (`00-shared.md` section 5), so this `dependsOn` also builds the playground before the site in the deploy; Netlify needs no change.
- `src/pages/playground.tsx`: `Layout` with title `Playground` and the description from the RFC summary; the eyebrow `Drafting table` and the lead in the server render; `BrowserOnly` with a fallback skeleton; inside, `React.lazy(() => import("@boundaries/playground"))` wrapped in `Suspense` (no CSS import: the styles come with the chunk); a media query (`useMediaQuery` from `src/components/motion`, or a CSS-only approach) that renders the desktop-only note below the tablet breakpoint (the website's breakpoints are in `custom.css`; use the one Docusaurus uses for the mobile navbar, 996 px, unless the mockup fixes another).
- `eslint.config.mjs` of the website: the page is a `page`; no new element type needed unless a wrapper component is added under `src/components/`.
- No navbar entry and no teaser change (phase 7). The page is reachable by URL only.

### 6. Agent files

`repo-architecture` skill: its opening sentence, the `playground` row of the component map (private, consumed by `website`) and the graph line `website build → playground build → policies / config / elements build`, which also changes the bullet that says the website depends only on the built `eslint-plugin`; website `AGENTS.md`: the page is client-only and the package is the only place playground code lives; root `AGENTS.md` "Repository Overview", which names the four published libraries and the website, gains the private playground.

## Verification

- `pnpm nx check:all playground` and `pnpm nx check:all website` pass; `pnpm nx graph` shows the new edges and no cycle.
- `pnpm nx build website` then `pnpm --filter website serve`: `/playground/` renders the placeholder in the browser and the skeleton with title and eyebrow in `build/playground/index.html` (grep it); the playground chunk is absent from the network requests of `/` and `/docs/overview/`.
- Quality gates of `00-shared.md` section 6 on `/playground/` (the placeholder page).
- `pnpm --filter playground dev` renders the component in both themes.
- The three research notes are on #539, and #539's first acceptance criterion is updated (notes 1, 3, 4 posted; 2 from phase 1; 5 pending).

## Hand-offs

- To phase 5: the theme and the root element (where the mockup's values go), the libraries still to add (step 4), the contract types, the harness, the folder layout and lint policy to extend, the breakpoint used for the desktop-only note.
- To phase 7: the `StateStore` interface the URL store implements.

## Open points

- Infima's element styles (links, `code`, tables, lists, headings) reach the playground on the website, not in the harness. Default: the theme overrides them where a component renders those elements; the screenshots of `/playground/` show what is left.
- `nativeColor` needs `color-mix()` and relative color syntax. Default: accept it (the playground is desktop only); the screenshots of `/playground/` in both themes are the check.
