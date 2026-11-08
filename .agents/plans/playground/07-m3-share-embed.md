<!-- cspell:disable -->
# Phase 7: M3 Share and embed

Goal: a playground state is a URL; the docs can open a code block in the playground; the example picker lists the docs' examples; the site switches the playground on (navbar entry and home teaser).

Issue: #554. Branch `feat/554/playground-share` from `feat/539/playground`; PR into `feat/539/playground`, title `feat(playground): share by URL and embed in the docs`, `closes #554`. Changelog: `packages/website/CHANGELOG.md` has no `## [Unreleased]` section today; the PR adds it at the top with `### Added` and one entry for the playground written for site visitors (`feat(#539): ...`), kept under Unreleased (the website version is decided at release time, `00-shared.md`). The PR description includes research note 5's conclusion (encoding, size of a typical URL, hash kept on client navigation) and the screenshots of the navbar and the teaser.

Read first:

- RFC #538, "Research tasks" 5, "Milestones" M3, "Acceptance" (a state shared by URL opens identically elsewhere), "Dependencies" (the teaser and the navbar entry switch on with the first usable version).
- `packages/playground/src/contract/StateStore.types.ts`, the interface that the hash store implements and that step 2 extends, and the lazy factory of `packages/website/src/pages/playground.tsx`, where the hash store replaces the `MemoryStore`.
- `packages/playground/eslint.config.mjs`: `src/index.ts` imports only the entries of `app`, `contract` and `data`, and `contract` imports nothing, so the hash store is a `data` element and the encoder a `helper`. `packages/website/eslint.config.mjs`: `no-restricted-imports` refuses the value imports of `@boundaries/playground` by that exact name, so that only the playground page loads its chunk.
- "From phase 5" and "From phase 6" below (the examples, saving, the dependencies of a sketch).
- `packages/website/src/data/site/links.ts` (`GITHUB_PLAYGROUND_ISSUE`), `src/components/home/PlaygroundTeaser/`, `docusaurus.config.ts` navbar items, `src/components/CodeDiff/` (an existing MDX component of the docs, the model for the new one and its `docs-component` element type), `packages/website/docs/quick-start.mdx` (the first page to get a button, in phase 8).
- Docusaurus docs on client-side routing and `useHistory` / `useLocation` for the hash check.

Preconditions: phase 6 merged.

## From phase 5

- `src/domains/examples/data/examples/` is an element of its own: `Example` (`{ id, title, sketch }`, `examples.types.ts`), `QUICK_START_EXAMPLE` (`quickStart.ts`) and `EXAMPLES` (`examples.ts`), the list the picker shows, all exported by the package entry (`src/index.ts`). The website's lazy factory and the harness create their `SketchSource` with `QUICK_START_EXAMPLE.sketch`.
- Nothing serializes a sketch yet. A `Sketch` is plain data (strings, arrays and objects), so the encoder of step 1 takes it as it is.
- `Playground` (`src/app/Playground.tsx`) saves every sketch that the shell produces with `store.save`, never the loaded one, and shows nothing when a save fails, because the `MemoryStore` cannot fail: the hash store decides what a failed save shows.
- The top bar (`src/domains/shell/ui/atoms/TopBar/TopBar.tsx`) draws the status only; the example picker, Help, Reset and Share go where `00-shared.md` section 6 places them.
- The shell takes its sketch once (`initialSketch`), and its store owns it from then on (`src/domains/session/data/store/store.ts`). `Playground` mounts a new shell after each load of the source or the store, which is how a sketch from outside reaches the panes. The top bar reads the store through `ShellTopBar` (`src/domains/shell/modules/ShellTopBar/`).

## From phase 6

- A `Sketch` is complete: its tree, its config and its dependencies (`src/contract/Sketch.types.ts`). `QUICK_START_EXAMPLE` has the nine dependencies of the mockup, which the measurement of step 1 already used.
- The sketch operations refuse a dependency that the sketch cannot hold (`getDependencyError` of `src/domains/project/helpers/sketch/dependencies.ts`: a target that is not a file of the sketch or is its own file, names that its syntax cannot write, an invalid module name, a name that another statement of the same file already imports or exports), so a sketch never holds one. A sketch decoded from a URL passes the same check before the shell takes it, each dependency against the ones before it in its file, as text mode reads them (`getDependencyError` takes the tree and those dependencies), after `getPathError` (`src/domains/project/helpers/sketch/paths.ts`) on every path of its tree, which is where quotes and backslashes are refused. The edits keep the names of a dependency in the order a statement writes them (default, namespace, named), so that text mode reads back the same sketch: a decoded sketch is put in that order too, or its first text read would count as an edit.
- The engine (`createEngine` of `src/domains/evaluation/helpers/engine/`) is the single evaluation entry; the verdicts are `Evaluation.dependencies`.
- The help dialog of step 4 says, in a sentence or two, three things that phase 8's guide explains at length (`08-docs.md`, "From phase 6"): the sources are written in full and text mode reads short ones with a rule of the playground's own (decision 19 of the plan), not with the resolvers of the config; `dependency.source`, `customSourcePatterns` and `{{dependency.source}}` see the full path; `eslint-import-resolver-typescript` resolves the full path of a JavaScript file to a TypeScript file of the same stem beside it, such as `./b.js` to `b.ts`.
- `Focus` has four variants (nothing, the config, a file, a dependency of a file; `src/domains/session/helpers/focus/`), which the open point of this file is about.

## Scope

In: research note 5, the hash `StateStore`, Share and Reset, the example picker, the help dialog, the MDX component, the navbar entry and teaser link, the website changelog entry. Out: putting buttons on docs pages beyond the one used to test the component (phase 8), the guide page (phase 8).

## Steps

### 1. Research note 5

Encode a `Sketch` as JSON → raw deflate → base64url in the hash (`#v=1&s=...`, versioned so that a future format can migrate). The button of the docs (step 5) computes its link in the server render, which is synchronous, so the encoder is synchronous too: `CompressionStream` is asynchronous and cannot be the encoder.

Measured on 2026-11-08 (Node.js 24, `#v=1&s=` included; generated sketches have two imports per file and random names):

| Sketch | JSON | `CompressionStream("deflate-raw")` | `fflate` 0.8 `deflateSync`, level 9 | `lz-string` 1.5 `compressToEncodedURIComponent` |
| --- | --- | --- | --- | --- |
| Quick start, 9 dependencies | 3,048 | 751 | 762 | 1,718 |
| 50 files | 22,439 | 2,849 | 2,866 | 7,261 |
| 100 files | 44,083 | 5,234 | 5,287 | 11,934 |
| 200 files | 88,057 | 10,398 | 10,510 | 20,389 |
| 500 files | 217,338 | 27,167 | 27,767 | 40,521 |

Minified and gzipped with esbuild, `fflate` costs 3.0 KB for `deflateSync` alone, which is what a docs page with the button ships, and 4.2 KB with `inflateSync`, which is what the playground chunk ships; `lz-string` costs 1.7 KB. `DecompressionStream` reads what `fflate` writes, because both are raw deflate. So the encoder is `fflate` (`deflateSync` and `inflateSync`, raw, level 9): within 2% of `CompressionStream`, and less than half the length of `lz-string`.

A first measurement (2026-11-04) found that a local server never receives the fragment, and that a hash reads back whole after `goto` and after `history.replaceState` up to 1.9 MB in Chromium and 2.2 MB in WebKit; Chromium aborted the navigation at 2.2 MB, and Firefox did not launch in the sandbox. So the limit is not the browser or the server but the places where a link is pasted: above 8 KB, Share still copies the link and says that it is long and some apps may cut it, instead of being disabled. Check that Docusaurus keeps the hash when navigating to `/playground/` from a docs link and when the page hydrates (`BrowserOnly` mounts after hydration; the hash must be read then, not at SSR), and that it does not try to scroll to the hash. Post the note on #539 and update its first acceptance criterion (all five notes posted).

### 2. The hash store, Share and Reset

- The contract: `StateStore` gains `clear()`, which forgets the saved sketch so that the next `load` returns `undefined`, and an optional `share(sketch)`, which returns a link that opens the sketch. The playground shows Share only when the store has `share`. `MemoryStore` gets `clear` and no `share`.
- The encoder and the decoder are a `helper` (a new `share` domain, or the one the architect agent proposes); the hash store is a `data` element, `HashStore`, exported by `src/index.ts`. Reading a hash runs the checks of "From phase 6" and puts the names of each dependency in order, so that a decoded sketch is one the edits could have made.
- `load` reads `#v=1&s=` on mount. Without a hash, it returns the last sketch that the store saved in this page session and writes it back to the hash, so that leaving the page and coming back keeps the edits, as the `MemoryStore` does today. A hash that the user changes while the page is open (`hashchange`) loads its sketch. A hash that cannot be read (an unknown version, corrupt data, a sketch that fails the checks) makes `load` fail with the reason, which `LoadState` shows next to Reset.
- `save` writes with `history.replaceState(history.state, "", url)`, which adds no history entry and keeps the state of the router, debounced; the pending write runs before Share and on `pagehide`. Safari throws after 100 `replaceState` calls in 30 seconds, so a write that throws is left to the next one.
- Share copies the link of `share` with the clipboard API and announces "Copied", as the home's install command does; above 8 KB it says that the link is long and some apps may cut it. Reset clears the store and shows the sketch of the source, the Quick start example on the website. Both mount a new shell, with nothing in focus.
- The website's lazy factory creates a `HashStore`; the harness does too, so that Share and Reset work in it.

### 3. The example picker

A dropdown in the top bar listing `EXAMPLES` (the quick-start one from phase 5 plus the examples the docs use that fit a sketch: at least one per classification facet, taken from the docs pages' code blocks). It shows only when the capabilities of the source allow editing the tree, the dependencies and the config, because an example replaces all three. Choosing one saves it to the store and mounts a new shell with it. Choosing an example and Reset ask for confirmation, with the `ConfirmDialog` of `ui-kit`, when the current sketch is neither an example nor the sketch of the source, because it would be lost.

### 4. Help

The help dialog of `00-shared.md` section 6 ("Panes"), opened by the icon-only Help button of the top bar, next to Reset: a MUI `Dialog` that never opens by itself. Its `Read the Quick start` link takes its URL from a new optional prop of `PlaygroundProps` (`src/contract/Props.types.ts`); the website passes `DOCS_QUICK_START` of `src/data/site/links.ts`, and without the prop the link is not drawn. The sentences that "From phase 6" asks for go in the mockup's help dialog first, and its renders are made again with `render.mjs`, shown to the maintainer with the plan edits.

### 5. The MDX component

`packages/website/src/components/OpenInPlayground/`, added to the `docs-component` element type of `packages/website/eslint.config.mjs`: a button linking to `/playground/#v=1&s=...`, whose link is computed in the server render. Its props are the config text and the project in the format of text mode, read with `fromText`, so that an author writes what text mode shows; a project with problems throws, so that the build fails instead of publishing a broken link.

The component imports the encoder from a second entry of the package, `@boundaries/playground/share` (`src/share.ts`, its own tsup entry and `exports` path), which imports only helpers: a docs page ships neither the components of the package nor MUI. Its classification and what it may import go in `packages/playground/eslint.config.mjs`, and `packages/playground/AGENTS.md`, `packages/website/AGENTS.md` and the comment of the website's `no-restricted-imports` say that the main entry loads only lazily and `/share` is the entry for the docs. Used on one page in this phase to prove it; phase 8 spreads it.

### 6. Switching on

- `docusaurus.config.ts`: navbar item `Playground` → `/playground/` (position left, after the docs entries).
- `src/data/site/links.ts`: `PLAYGROUND = "/playground/"`; the teaser button reads "Open the playground" and links there; `GITHUB_PLAYGROUND_ISSUE` is removed if nothing else uses it.
- The teaser copy ("Drafting table · coming next") is updated to the present tense; keep the layout.

## Verification

- Acceptance criteria of #554, each checked in the PR description: a URL produced in one browser opens identically in another (test with two profiles or a private window), at least one docs page opens its example, navbar and teaser updated.
- Quality gates of `00-shared.md` section 4 on `/playground/` with a state in the hash, and on `/` (the teaser change must not regress the home's Lighthouse).
- The docs page with the button does not request the playground chunk, and the PR description says how many bytes the `/share` entry adds to it.
- Unit tests: encode/decode round trip, version handling, a hash that cannot be read, a decoded sketch that fails the checks, the size guard.

## Hand-offs

- To phase 8: the MDX component's props and the encoder, the list of examples in the picker.
- To phase 9: nothing.

## Open points

- Whether the URL state also carries the UI focus (open node, active tab). Default: no, only the sketch; the page opens with nothing in focus and the `Sketch` tab.
- What the example picker reads after an edit. Default: `Example <title>` while the sketch is an example, and `Example` alone otherwise.
