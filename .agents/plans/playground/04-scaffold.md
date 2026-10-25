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

Preconditions: #510 and phase 2 merged into `release` and `release` merged into `feat/539/playground`. Phase 3 is not required for the scaffold, but research note 1 measures `policies` too if it is merged; if not, the note measures `elements` + `config` and says so.

## Scope

In: the three research notes posted on #539, the package, the contract types, the placeholder component, the dev harness, the website page and its Nx wiring, the agent files. Out: panes, state in the URL, the navbar entry and the teaser link (phase 7), the mockup (phase 5, which may already be running).

## Steps

### 1. Research note 1: browser bundle

In a scratch folder outside the repo, bundle an entry that imports `@boundaries/elements`, `@boundaries/config` (and `policies` if available) with esbuild `platform: "browser"`, `minify: true`, no alias, run it in `node:vm` without Node.js globals calling `describeElement` / the config normalization on the quick-start example, and record: it runs, the gzipped size of each package, and whether module resolution is involved anywhere (the sketch is the universe, anything not in it is external; confirm the packages accept a precomputed module origin or that `describeDependency` works with paths only). Post the note on #539 ("Research note 1: browser bundle") with the numbers and the conclusion.

### 2. Research note 3: config input and editor

Compare, on the boundaries part of the quick-start `eslint.config.js` pasted as is (unquoted keys, trailing commas, comments):

- Parsers: a JSON5 parser with source locations (`@humanwhocodes/momoa` has a JSON5 mode with locations; `json5` alone has none) versus `acorn` parsing an expression plus a small evaluator for literals, arrays and objects. Criteria: size gzipped, locations for every node (needed to underline `config` diagnostics by JSON path and to scroll to a policy by index), error quality on a wrong paste, and the door to accepting a whole config file later.
- Editors: CodeMirror 6 with `@codemirror/lang-javascript` (or a JSON5 mode) versus a `textarea` with external highlighting. Criteria: size gzipped, inline diagnostics (CodeMirror's `lint` extension), gutter highlight of a range, theming from the `--jsb-*` tokens, SSR safety (must not touch `window` at import time, or be imported lazily).

Decide, post the note with a size table and the choice, and record the choice in the package `AGENTS.md` (step 6).

### 3. Research note 4: component stack

List the widgets the RFC interface needs (tree view with inline rename, tabs, resizable split panes, modal dialog with radio groups and a combobox, a button bar, a dropdown for examples, toasts for "Copied", a code editor) and compare: MUI (`@mui/material` with `cssVariables`, theme mapped from the tokens, Emotion cache scoped to the root, no `CssBaseline`), headless primitives (Radix or Base UI) plus CSS Modules, and CSS Modules only. Criteria: gzipped size lazy-loaded, accessibility out of the box for tree, tabs, dialog and combobox, how cleanly styles are confined to the playground root (no global reset, no portal styles leaking: dialogs that portal to `body` must carry the playground's class), React version compatibility with the website's React (19.x) and the Docusaurus SSR. Decide, post the note, record the choice.

### 4. The package

`packages/playground`:

- `package.json`: name `@boundaries/playground`, `private: true`, `exports` with `.` (the component) and `./styles.css`; `peerDependencies: { react, react-dom }` at the website's major; dependencies `@boundaries/elements`, `@boundaries/config`, `@boundaries/policies` as `workspace:*` (policies may land in phase 6 if not merged yet), plus the libraries chosen in steps 2 and 3; devDependencies: the build tool, Vite for the harness, `@testing-library/react` and jest (jsdom) or Vitest (prefer jest for consistency with the other packages unless the stack forces Vitest; record the reason), `eslint-plugin-boundaries: "workspace:@boundaries/eslint-plugin@*"` for self-linting.
- Build: tsup (as the other packages) with `platform: "browser"`, `format: ["esm"]`, `dts: true`, `external: ["react", "react-dom"]`, `injectStyle: false` and CSS emitted as one file. If CSS Modules are chosen, check tsup/esbuild emits them as one `styles.css` with hashed class names; otherwise plain CSS with a `jsb-play-` prefix (RFC decision 2 cons).
- Source layout, lint-enforced in `eslint.config.mjs` with the workspace plugin and `no-unknown-files` on: `src/index.ts` (entry), `src/Playground.tsx` (the component), `src/contract/` (`ProjectSource`, `StateStore`, capability flags, `SketchSource`, `MemoryStore`), `src/engine/` (the adapter from the sketch model to `config` and `policies`, empty but typed now), `src/ui/` (panes later; now the placeholder), `src/styles/` (tokens consumption, base layout). Policies: `ui` → `contract`, `engine`; `engine` → `contract`; nothing imports `@docusaurus/*`, `@theme/*` or Infima classes (an ESLint `no-restricted-imports` rule in the package config makes this a lint error).
- `project.json`: targets as the others; `build` depends on `^build`; `lint` depends on `eslint:config` and `^build` (it uses the workspace plugin).
- Dev harness: `dev/` folder with a Vite `index.html` that imports the website's `tokens.css` (relative path into `packages/website/src/css/tokens.css`) and `fonts.css`, mounts `<Playground source={sketchSource} store={memoryStore} />` with a theme toggle (`data-theme` on `<html>`); `pnpm --filter playground dev` starts it. The harness is not part of the build.
- Tests: a render test of the placeholder; a test that the entry has no Docusaurus import (covered by lint, so the test checks the contract types compile with a fake host instead).
- `AGENTS.md` (+ `CLAUDE.md`): the layering, the host-agnostic constraint, the stack chosen (one line each with why), the harness; under 200 lines, no status.

### 5. The website shell

- `packages/website/package.json`: `"@boundaries/playground": "workspace:*"` in `dependencies` (it is bundled).
- `packages/website/project.json`: `build` gains `dependsOn: ["^build"]` restricted to the playground if possible (`{ "projects": ["playground"], "target": "build" }`), and `check:types` likewise; `implicitDependencies` gains `playground`. Check `pnpm nx graph`.
- `src/pages/playground.tsx`: `Layout` with title `Playground` and the description from the RFC summary; the eyebrow `Drafting table` and the lead in the server render; `BrowserOnly` with a fallback skeleton; inside, `React.lazy(() => import("@boundaries/playground"))` wrapped in `Suspense`, with `import "@boundaries/playground/styles.css"` done inside the lazy module or through a dynamic import so that the CSS is not loaded on other pages; a media query (`useMediaQuery` from `src/components/motion`, or a CSS-only approach) that renders the desktop-only note below the tablet breakpoint (the website's breakpoints are in `custom.css`; use the one Docusaurus uses for the mobile navbar, 996 px, unless the mockup fixes another).
- `eslint.config.mjs` of the website: the page is a `page`; no new element type needed unless a wrapper component is added under `src/components/`.
- No navbar entry and no teaser change (phase 7). The page is reachable by URL only.

### 6. Agent files

`repo-architecture` skill: the `playground` row (private, consumed by `website`) and the graph line `website build → playground build → policies / config / elements build`; website `AGENTS.md`: the page is client-only and the package is the only place playground code lives; root `AGENTS.md` overview sentence if it enumerates projects.

## Verification

- `pnpm nx check:all playground` and `pnpm nx check:all website` pass; `pnpm nx graph` shows the new edges and no cycle.
- `pnpm nx build website` then `pnpm --filter website serve`: `/playground/` renders the placeholder in the browser and the skeleton with title and eyebrow in `build/playground/index.html` (grep it); the playground chunk is absent from the network requests of `/` and `/docs/overview/`.
- Quality gates of `00-shared.md` section 6 on `/playground/` (the placeholder page).
- `pnpm --filter playground dev` renders the component in both themes.
- The three research notes are on #539, and #539's first acceptance criterion is updated (notes 1, 3, 4 posted; 2 from phase 1; 5 pending).

## Hand-offs

- To phase 5: the stack, the contract types, the harness, the folder layout and lint policy to extend, the breakpoint used for the desktop-only note, the way CSS is emitted (class naming scheme).
- To phase 7: the `StateStore` interface the URL store implements.

## Open points

- If tsup cannot emit CSS Modules as one file with stable names, fall back to plain CSS with the `jsb-play-` prefix and say so in `AGENTS.md`. Default: plain prefixed CSS unless the stack of note 4 brings its own styling.
- If the website's React version and the library of note 4 conflict, the library loses. Default: headless primitives + CSS Modules, the smallest option that still gives accessible tree, tabs, dialog and combobox.
