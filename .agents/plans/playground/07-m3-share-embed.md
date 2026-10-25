<!-- cspell:disable -->
# Phase 7: M3 Share and embed

Goal: a playground state is a URL; the docs can open a code block in the playground; the example picker lists the docs' examples; the site switches the playground on (navbar entry and home teaser).

Issue: #554. Branch `feat/554/playground-share` from `feat/539/playground`; PR into `feat/539/playground`, title `feat(playground): share by URL and embed in the docs`, `closes #554`. Changelog: `packages/website/CHANGELOG.md`, `[Unreleased]` → `Added`, one entry for the playground written for site visitors (`feat(#539): ...`), kept under Unreleased (the website version is decided at release time, `00-shared.md`). The PR description includes research note 5's conclusion (encoding, size of a typical URL, hash kept on client navigation) and the screenshots of the navbar and the teaser.

Read first:

- RFC #538, "Research tasks" 5, "Milestones" M3, "Acceptance" (a state shared by URL opens identically elsewhere), "Dependencies" (the teaser and the navbar entry switch on with the first usable version).
- `04-scaffold.md` hand-offs (`StateStore`), `05-m1-identify.md` and `06-m2-verdicts.md` hand-offs (`SketchSource`, examples).
- `packages/website/src/data/site/links.ts` (`GITHUB_PLAYGROUND_ISSUE`), `src/components/home/PlaygroundTeaser/`, `docusaurus.config.ts` navbar items, `src/components/CodeDiff/` (an existing MDX component of the docs, the model for the new one and its `docs-component` element type), `packages/website/docs/quick-start.mdx` (the first page to get a button, in phase 8).
- Docusaurus docs on client-side routing and `useHistory` / `useLocation` for the hash check.

Preconditions: phase 6 merged.

## Scope

In: research note 5, the hash `StateStore`, Share and Reset, the example picker, the MDX component, the navbar entry and teaser link, the website changelog entry. Out: putting buttons on docs pages beyond the one used to test the component (phase 8), the guide page (phase 8).

## Steps

### 1. Research note 5

Encode a `SketchSource` as JSON → deflate (`CompressionStream` where available, `fflate` or `lz-string` otherwise; compare sizes and support) → base64url in the hash (`#s=...`); measure the URL length for the quick-start example and for a 50-file sketch (the practical limit is browser and server dependent; stay under 8 KB and say what happens above: Share disabled with a note). Check that Docusaurus keeps the hash when navigating to `/playground/` from a docs link and when the page hydrates (`BrowserOnly` mounts after hydration; the hash must be read then, not at SSR). Post the note on #539 and update its first acceptance criterion (all five notes posted).

### 2. The hash store

`src/contract/` implementation for the website host: reads the hash on mount, writes it (`history.replaceState`, no new history entry per keystroke, debounced) on every change, versioned (`v=1`) so that a future format can migrate. Share copies `location.href` with the current state (clipboard API, "Copied" announcement as the home's install command does), Reset loads the default example and clears the hash. The host passes the store to the component; the harness keeps the memory store.

### 3. The example picker

A dropdown in the top bar listing `src/examples/*` (the quick-start one from phase 5 plus the examples the docs use that fit a sketch: at least one per classification facet, taken from the docs pages' code blocks); choosing one replaces the state (confirm if the current sketch was edited).

### 4. The MDX component

`packages/website/src/components/OpenInPlayground/` (element type `docs-component`): `<OpenInPlayground config={...} tree={[...]} dependencies={[...]} />` or, simpler for authors, a wrapper around a code block that takes the sketch as props and renders a button linking to `/playground/#s=...` with the encoded state computed at build time (the encoder is exported by the package and works in Node.js too). Used on one page in this phase to prove it; phase 8 spreads it.

### 5. Switching on

- `docusaurus.config.ts`: navbar item `Playground` → `/playground/` (position left, after the docs entries).
- `src/data/site/links.ts`: `PLAYGROUND = "/playground/"`; the teaser button reads "Open the playground" and links there; `GITHUB_PLAYGROUND_ISSUE` is removed if nothing else uses it.
- The teaser copy ("Drafting table · coming next") is updated to the present tense; keep the layout.

## Verification

- Acceptance criteria of #554, each checked in the PR description: a URL produced in one browser opens identically in another (test with two profiles or a private window), at least one docs page opens its example, navbar and teaser updated.
- Quality gates of `00-shared.md` section 6 on `/playground/` with a state in the hash, and on `/` (the teaser change must not regress the home's Lighthouse).
- Unit tests: encode/decode round trip, version handling, the size guard.

## Hand-offs

- To phase 8: the MDX component's props and the encoder, the list of examples in the picker.
- To phase 9: nothing.

## Open points

- Whether the URL state also carries the UI focus (open node, active tab). Default: no, only the sketch; the page opens with nothing in focus and the `Sketch` tab.
