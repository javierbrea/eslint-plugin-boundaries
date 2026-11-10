<!-- cspell:disable -->
# Shared: environment, branching, conventions, gates

Read this file before any phase. It holds every fact more than one phase needs; phase files add only what is specific to them. Deviations go in the PR description and in the plan (`write-plan` skill, "Starting a phase"). Never edit the plan without showing the maintainer the diff first.

## 1. Environment and commands

- Node: the version in the repo-root `.nvmrc` (24.x). Run `source ~/.nvm/nvm.sh && nvm use` before anything else; the root `package.json` declares `engines.node >= 24` and some targets fail on older versions (the default shell may have Node 22).
- Install once per checkout from the repo root: `pnpm install`. pnpm has `minimumReleaseAge: 2880` (two days): a dependency version younger than that is refused; pick an older one rather than adding an exclusion.
- Commands (from the repo root; `<project>` is the Nx project name, for example `config`, `policies`, `playground`, `website`, `eslint-plugin`):

```bash
pnpm nx check:all <project> --output-style=stream            # lint, types, spell, tests and build of one project
pnpm nx run-many -t check:all --all                          # everything, dependencies first; run before opening a PR
pnpm nx lint <project> <file> --output-style=stream --fix    # one file, autofix
pnpm nx test:unit <project> <spec-path> --output-style=stream --coverage=false
pnpm nx graph                                                # the live dependency graph; the plan's statements about it are checked here
pnpm nx dev playground                                       # Vite harness of the package (packages/playground/dev)
pnpm nx start website                                        # Docusaurus dev server, http://localhost:3000
pnpm nx build website --output-style=stream                  # production build into packages/website/build
pnpm --filter website screenshots [baseUrl] [paths...]      # Playwright visual check (overflow, console errors, both themes, 1440 and 390 px); it installs its pinned Chromium by itself
pnpm nx test:e2e browser-e2e --output-style=stream           # the packages in Chromium, Firefox and WebKit against their Node.js results
```

- Repo rules that load automatically: `.agents/rules/typescript-conventions.md`, `unit-testing.md`, `nx-project-config.md`, `changelog-and-versioning.md`, `docs-authoring.md`, `agents-md.md`. Read the root `AGENTS.md`, the `repo-architecture` skill and the `AGENTS.md` of every project a phase touches.
- cspell runs on every staged file (`lint-staged`). Project words go in that project's `cspell.config.js` (`createConfig({ words: [...] })`); plan files start with `<!-- cspell:disable -->`.
- Subagents: at most two at a time (user rule), in waves.

## 2. Branching, PRs, commits

- Phase branches are named in the index ("Phases"): `feat/<issue>/<slug>`, from `feat/539/playground`, which every phase left targets (`write-plan` skill, "Where it lives"). Never target `release` or `master`.
- One PR per phase, draft, created with the `create-pr` skill (it fills the template, infers the issue from the branch name and adds `closes #N`). For PRs into `feat/539/playground` the `closes` line is kept: it acts when the integration branch reaches `master`.
- Commit messages: Conventional Commits with the issue in the scope when there is one (`feat(#549): ...`), as the repository does; plan edits are `chore(playground): ...` commits of the phase's own PR (`write-plan` skill, "Where it lives").
- The integration branch merges `release` (never rebases) whenever a phase needs something merged there; the merge is a plain `git merge origin/release` commit, pushed.
- PR description: what changed and why, the acceptance criteria of the issue with how each was checked, measurements when the issue asks for them (bundle sizes, Lighthouse), and screenshots for UI phases (committed as contact sheets on an orphan `screenshots/<phase-branch>` branch and embedded by raw URL, as the redesign did; phase 11 deletes those branches).

## 3. Website conventions (phases 5 to 10)

- The website is Docusaurus 3 with `trailingSlash: true` and `onBrokenLinks: "throw"`: every internal link ends with `/` and must exist. `packages/website/AGENTS.md` and `.agents/rules/docs-authoring.md` govern docs edits; `docs/` is the next version, `versioned_docs/` holds the published ones (the newest is the first entry of `versions.json`), and every docs change of the playground goes in `docs/` and in the snapshot of the newest, with its sidebar (`playground.md`, decision 20).
- Design tokens are in `packages/website/src/css/tokens.css` (`--jsb-*`, light on `:root`, dark on `[data-theme="dark"]`); fonts are self-hosted (`fonts.css`); `infima-bridge.css` maps Infima onto the tokens. The playground reads the tokens and adds none to this file without the maintainer's agreement.
- `src/` layering is lint-enforced in `packages/website/eslint.config.mjs` (element types `page`, `theme`, `client`, `home`, `site`, `ui`, `motion`, `docs-component`, `data`, `prism`; `boundaries/no-unknown-files` on). A new folder is classified there before it is used; the playground page is a `page`, and any MDX component for the docs is a `docs-component` or a new element type the phase declares.
- The website `build`, `check:types` and `start` build `playground` first, and its `lint` builds `eslint-plugin` first (`^build`).
- Netlify deploys `master` and previews the PRs into it with the build command `pnpm nx run website:build` (base directory `/`, package directory `packages/website`, publish directory `packages/website/build`), set in the Netlify UI, not in the repo (maintainer, 2026-11-02). It goes through Nx, so the `dependsOn` of the website `build` decides what is built before the site.

## 4. Quality gates (phases 5 to 8)

For `/playground/`, on the production build served locally (`pnpm --filter website serve`):

- `pnpm --filter website screenshots http://localhost:3000 /playground/` passes: no horizontal overflow, no console errors, both themes, 1440×900 and 390×844.
- Lighthouse (Chrome DevTools or `npx lighthouse`): Performance measured with the lazy chunk loaded; Accessibility 100; Best practices 100 (the GitHub stars pill may drop it to 96 when the API rate-limits, known and accepted).
- The playground chunk is not requested on `/` or on a docs page (network tab of the production build).
- At 390 px the page shows the desktop-only note and the site footer, no panes (section 6, "Page").
- `pnpm nx check:all website` and `pnpm nx check:all playground` pass.

## 5. Definition of done for a phase

- The acceptance criteria of its issue are checked and the PR description says how.
- `pnpm nx run-many -t check:all --all` passes locally; CI is green on the PR.
- The agent files it affects (`AGENTS.md` of the touched projects, `repo-architecture` skill, rules) are updated in the same PR, and say only what stays true.
- The PR leaves the plan ready for the next phase (`write-plan` skill, "Finishing a phase"): hand-offs moved to the files of the phases that need them, its own phase file deleted, the index status line rewritten, each plan edit approved by the maintainer before it is committed in the PR.
- The sub-issue is ticked in the `Plan` list of #539 when the PR merges.

## 6. Interface (phases 5 to 8)

The approved mockup is the ground truth: `playground/mockups/playground.html`, rendered by `playground/mockups/render.mjs` into `playground/mockups/<state>-<theme>.png` (states `empty`, `file`, `dependency`, `picker`, `config`, `policy`, `text`, `help`; 1440×900 and the 390×844 note). The maintainer approved it on 2026-11-04, and the reviews of the phase 5 page (2026-11-04) and of the phase 6 page (2026-11-06) updated it. Exact sizes and paddings are in its CSS; this section holds what the components must follow. A deliberate difference between a phase and the mockup is a plan edit that updates the mockup and its renders.

The mockup and its renders are not updated for the changes of 2026-11-09 (decision 21 of the index), nor for the evaluation states of decision 23 ("While it evaluates" below): the pane heads on `--jsb-paper`, the inspector of a file and of a dependency as `from`, `to` and `dependency`, the policy column of the dependency tab, and `Project` in place of `Sketch` in the texts. For those parts, this section is the ground truth and the mockup is out of date.

### Page

- The website page has no visible header: no eyebrow, title or lead. Its `h1` "Playground" stays for screen readers (visually hidden), the navbar's active `Playground` item is the visible title, and the lead text stays as the `description` of `Layout`.
- At 997 px and wider, the playground fills the page below the 58 px navbar (`--ifm-navbar-height`): full width, height `max(620px, 100vh - 58px)`, no border, radius, shadow or margin. The site footer is hidden at these widths only, by CSS scoped to the page (the `noFooter` prop of `Layout` would drop it on narrow screens too), so that the page does not scroll and only the panes do.
- At 996 px and narrower, the page shows the desktop-only note (dashed box, `32px 16px` margin) and the footer; the chunk is not requested (phase 4).
- `packages/website/src/pages/playground.tsx` and `playground.module.css` implement this layout (phase 5).

### Regions and sizes

- The root (`.jsb-play-root`) is `--jsb-card` with a 13 px body font. A 44 px top bar sits over the body grid: project | node in focus | inspector, over the problems panel at full width.
- Default sizes: project 264 px wide (420 px while in text mode), inspector 320 px, problems 212 px tall; the node pane takes the rest. Minimums: project 200 px, node 360 px, inspector 260 px, problems 120 px; the problems panel collapses to its head. At 997 px the defaults leave the node pane about 410 px.
- Splits are `react-resizable-panels` separators: a 1 px `--jsb-line` between panes, and a 32×4 px `--jsb-line-strong` grip centered on the line above the problems panel.
- Every pane head is 34 px: label in mono 500 10.5 px, uppercase, letter spacing 0.14em, `--jsb-muted`, on `--jsb-paper` (the color of the host's navbar), 1 px `--jsb-line` below. A path in the head is mono 12 px `--jsb-ink`, cut with an ellipsis; a hint is body 12 px `--jsb-muted`, which passes 4.5:1 on the head.

### Type

- Sora (`--jsb-font-display`), 600: dialog titles 18 px, empty-state title 16 px, numbers of the sketch 20 px.
- IBM Plex Sans (`--jsb-font-body`): base 13 px, buttons 600 12.5 px, tabs 500 12.5 px, messages 12.5 to 13.5 px.
- IBM Plex Mono (`--jsb-font-mono`): the tree 12.5/26 px, the file pane 13/28 px, the config editor 12.5/22 px, text mode 12/20 px, inspector facets 12 px, problem locations 12.5 px, the status of the top bar 12 px. Paths, keys, values and policy references are always mono.

### Color

- Every color is a `--jsb-*` token; the only literals are the dialog backdrop (34% `--jsb-ink` in light, `rgba(0, 0, 0, 0.55)` in dark) and the dialog shadow.
- Surfaces: panes `--jsb-card`, their heads `--jsb-paper`; text mode and listboxes `--jsb-paper-2`. The file pane, the config editor, the policy card and the picker preview are code areas on `--jsb-code` in both themes, with `--jsb-code-fg`, `--jsb-code-keyword`, `--jsb-code-string`, `--jsb-code-comment` (also line numbers) and `--jsb-code-number`.
- States, outside and inside code areas: allowed `--jsb-ok` / `--jsb-code-string`; disallowed and errors `--jsb-bad` / `--jsb-code-error`; warnings `--jsb-warn` / `--jsb-code-number`; not checked `--jsb-faint` / `--jsb-code-comment`. Count badges are 18 px pills on 14% `--jsb-bad` (16% `--jsb-warn`).
- Text in a state color outside code areas mixes 85% of the token with 15% of `--jsb-ink` (`color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))`), and not-checked text is `--jsb-muted`, so that it passes 4.5:1 on `--jsb-card` in both themes (Lighthouse Accessibility 100); icons, badges and outlines keep the plain tokens (maintainer, 2026-11-06).
- Selection: `--jsb-accent-soft` with a 2 px inset `--jsb-accent` bar on the left; in code areas `--jsb-code-line` with a 2 px `--jsb-code-keyword` bar. A highlighted policy is 13% `--jsb-code-keyword` with a 3 px bar. Hover is `--jsb-accent-soft` (60% in the tree), `--jsb-code-line` in code areas.

### Icons

The 15 icons of the mockup (check, cross, warn, skip, chevron right and down, plus, edit, trash, arrow, share, reset, collapse, info, help) are SVG components of the package, not `@mui/icons-material`: 16×16 view box, 2 px stroke, round caps and joins, `currentColor`, drawn at 14 px (16 px in icon-only buttons, 12 px in the lint gutter). Their paths are in the mockup's `<symbol>` elements.

### Widgets

- Buttons (MUI `Button`): 30 px tall (26 px small), radius `--jsb-radius`, 600 12.5 px. Outlined with `--jsb-line-strong`, contained in `--jsb-accent` with `--jsb-accent-ink`, text in `--jsb-muted`. Icon-only buttons (`IconButton`) are 30×30 with a `Tooltip`; pressed is `--jsb-accent-soft` with `--jsb-accent`.
- Tree (`RichTreeView`): 26 px rows, 14 px indent per level, 12 px chevrons in `--jsb-faint`, folders in `--jsb-muted` with a trailing `/`. `eslint.config.js` is pinned first in `--jsb-accent` with a `{}` glyph and a separator below it. The end of a row holds the failing count and a ✕ on failing files; a file with failures has its name in `--jsb-bad`; rename and delete show at the end of the row under the pointer, and of the selected row while it has the focus; rename edits the label in place.
- Tree / Text switch: `ToggleButtonGroup` with 22 px buttons, in the 44 px foot of the project pane next to `+ File` and `+ Folder`.
- Tabs (`Tabs`): 2 px `--jsb-accent` indicator, selected `--jsb-ink`, others `--jsb-muted`; node and dependency tabs have mono 12 px labels; each tab shows its count.
- Dialogs (`Dialog`): `--jsb-card`, 1 px `--jsb-line`, radius `--jsb-radius-xl`, 22 px padding, buttons right-aligned in the footer. The picker is 620 px wide: rows with a 92 px mono label column, `Radio`, an `Autocomplete` of 38 px with a floating label over the paths of the sketch, `Chip`s of 26 px for the imported names, the statement preview on `--jsb-code`. The help dialog is 540 px wide.
- Not MUI: the dependency lines of the file pane (a component of the package), the editor and its lint tooltip (CodeMirror, styled as a card with a 3 px `--jsb-bad` or `--jsb-warn` left border, opened above its range, where `@codemirror/lint` places it, with a `More info` link that never wraps), the splits (`react-resizable-panels`).

### Panes

- Top bar: the example picker (outlined, `Example <name> ▾`), the status in mono (`6 files · 9 dependencies · 2 problems` after a 6 px dot, `--jsb-ok` or `--jsb-bad`; `0 problems` in `--jsb-muted` when there are none; `config has errors` while the rule options are invalid), then, right-aligned, Help (icon-only), Reset (text) and Share (contained). The playground has no title of its own.
- Share (decision 25): a link that is copied with nothing more to say turns the button into a check and `Copied` for 2 s, in the same color and at the same width, and a visually hidden polite region says `Link copied`. Any other outcome opens a 440 px dialog whose title starts with a ▲ in `--jsb-warn` or a ✕ in `--jsb-bad`: `Long link copied` (with the length of the link), `The link could not be copied` (the link selected in a read-only field, then `Close` and `Copy link`, which confirms as Share does), `The link could not be made`, `The project is too large for a link` (the limit it passes) and `The project cannot be shared` (the reason of the reader of links in a box). The others close with `Got it`, which takes the focus; closing gives the focus back to Share.
- Project: head `Project`; the tree; text mode is a textarea with one path per line, folders ending in `/`, dependencies indented two spaces under their file, in the color of the paths (a textarea draws one color), an inset 1 px `--jsb-accent` ring, and the head hint `One path per line · dependencies indented`.
- Node in focus, a file: head `File <path>`. One line per dependency in a grid of 44 px line number, statement, 64 px actions and 176 px verdict. The statement wraps and is never cut; edit and delete show on hover and focus; the verdict is right-aligned: `✓ policy N` or `✓ default`, `✕ policy N` or `✕ default` (▲ for a rule at `warn`), `– not checked · <reason>` with the engine's skip reasons (`external` for `not-local`, `not read` when `boundaries/dependency-nodes` leaves the syntax out, the others as they are), or `– not evaluated`; the words are in `src/domains/evaluation/ui/helpers/verdictText/`. Below, a dashed `+ Dependency` button and a hint.
- Node in focus, the config: head `Config eslint.config.js` with the hint `JSON5 · the settings and rules of an ESLint config`. CodeMirror with an 18 px lint gutter (✕ error, ▲ warning) and line numbers; a diagnostic underlines with a wavy line the whole entry its path points at; the active line is 5% `--jsb-code-fg`; no ring is drawn around the focused editor, whose cursor and active line show the focus.
- Nothing in focus: head `Nothing open`, a 16 px `--jsb-grid` grid background, `Open a file or the config`, a short text, and `Open eslint.config.js` and `+ File`.
- Inspector, a file or a dependency: three sections named as the keys of a policy, `from`, `to` and `dependency`, each a header in the pane label style with a chevron that folds it.
  - `from` is the open file: its path in the header, then `n dependencies ✓ k ✕ k – k not checked`, then the boxes `element`, `file` and `module`.
  - `to` is what the dependency in focus points to: the path of the file or the name of the module in the header, then the same three boxes.
  - `dependency` is the dependency in focus: `line N` in the header, then one box without a title, which folds with its section, with `kind`, `nodeKind`, `source`, `specifiers` and `relationship` (`from` and `to`).
  - With no dependency in focus, `to` and `dependency` read `—`, with a dashed hint to click a line of the file. A dependency whose syntax the plugin does not read has no description: `to` and `dependency` read its target and `line N` as rows with nothing to fold, and a note says why the plugin does not check it.
  - Each box lists every property a selector matches, named and valued as the engine returns them: `element`: `types`, `path`, `fileInternalPath`, `captured`, `parents`, `isIgnored`, `isUnknown`; `file`: `categories`, `path`, `captured`, `isIgnored`, `isUnknown`; `module`: `origin`, `source`, `internalPath`. The selector shortcuts `type` and `parent` and the deprecated `category` are not listed. Values are JSON, `null` in `--jsb-faint`.
  - Every section and every box of `from` and `to` folds with a chevron in its header; a folded box shows the value of its first property after its name. The `module` boxes start folded and the others open. What the user folds stays folded across changes of focus while the shell of the project is mounted, and is not kept in the store or the URL: a new project (an example, Reset, or one that comes from the host) starts again with the defaults.
- Inspector, the config: `Element types`, `File categories` and `Policies` as rows (name, how many files or dependencies, pattern below). An ignored descriptor reads `ignored` in `--jsb-warn`; with invalid rule options, the rule reads `not evaluated`.
- Inspector, nothing in focus: `Project` with a 2×3 grid of numbers (files, dependencies, element types, file categories, policies, disallowed) and the allowed and not-checked counts.
- Problems: head `Problems`, the tabs and a collapse button. A row is an icon, the location in mono (`path:line` or `path:line:col`, then `→ source` for a dependency), the message in the body font and a meta line (`disallowed · policy N` or `disallowed · default`; `error` or `warning` and the diagnostic path joined by ` › `). A config problem reads its title and its detail, without the `More info` link, and the config problems come in the order of the engine (`normalizeConfig`: settings before rules). Rows highlight on hover and open what they point at on click. A note is a dashed box with the info icon; with invalid rule options it reads "Dependencies are not evaluated while the rule options are invalid: ESLint does not run a rule whose options fail its schema."
- The dependency tab: two columns. On the left, the verdict, the location in mono (`path:line → source`) and the message. On the right, after a 1 px `--jsb-line` divider and only when a policy decided the dependency, a head with `Policy` in the pane label style, the policy in mono (`policies[N]` or `default`) and `Open in config →` at its end, over the policy card with the policy as written in the config. The facts of the dependency are in the inspector.
- Help: title `How the playground works`, one sentence on what the playground does, three numbered steps (sketch the files, write the config, add dependencies), a tip on how imports are written (their full relative path, which `dependency.source` sees, and the playground's own rule for shorter ones), a tip that the project starts with the Quick start example and what Reset and Share do, and, in its footer, `Read the playground guide →` and `Read the Quick start →`, then `Got it` at the right edge. It never opens by itself. The host passes the URLs as `guideUrl` and `quickStartUrl` of `PlaygroundProps` (decision 24); a link whose URL is missing is not drawn, and the harness passes neither.

### While it evaluates

The evaluation runs in a web worker (decision 23). Until the evaluation of the project on screen arrives:

- The panes keep the last evaluation, of an older project: a file keeps the description of the file of the same path, and a dependency the verdict of a dependency that writes the same statement. Before the first evaluation they have none.
- From 400 ms after the evaluation was asked for, and while it is stopped or failed, what the last evaluation says fades to 50% opacity: the body of the inspector, the rows of the problems panel and the verdicts of the file pane. While it runs, the top bar reads `N files · N dependencies · evaluating…` in `--jsb-muted` with a `--jsb-faint` dot. A usual evaluation arrives before then, and nothing changes on screen.
- A dependency that no evaluation has decided has an empty verdict cell, then `– evaluating…` from 400 ms. Its dependency tab says the same in its verdict line, and its `line N` tab has no icon until then.
- Before the first evaluation, the top bar reads `N files · N dependencies` with a `--jsb-faint` dot, and from 400 ms the inspector reads `Evaluating the project…` in a note and the problems panel the same note above its rows.
- An evaluation that runs for 30 s is stopped: the top bar reads `evaluation stopped` in the 85% `--jsb-warn` mix with a `--jsb-warn` dot, the problems panel a note above its rows, unfaded ("The evaluation took longer than 30 seconds and was stopped. Edit the project to evaluate it again."), the inspector the same note when there was no evaluation, and a dependency with no verdict `– not evaluated`. A worker that fails, such as one whose script does not load, reads `evaluation failed` in the 85% `--jsb-bad` mix with a `--jsb-bad` dot, and "The evaluation could not run. Edit the project to try again." The next edit evaluates again. A polite live region of the top bar announces `evaluation stopped` and `evaluation failed` to screen readers; `evaluating…` is not announced, since it would come with every slow edit.

### Focus

The focus is one of: nothing, the config node, a file, or a dependency of the open file. The problems tabs follow it (RFC #538, Interface decision 6): `Project` is always there, the open node adds its tab, the dependency in focus adds `line N` with its verdict icon, the most specific one is selected, and absent levels have no tab.

- A file in the tree opens it in the node pane, the inspector describes it, and its tab is added and selected.
- `eslint.config.js` opens the editor, the inspector shows the config, and its tab is added and selected.
- A dependency line takes the focus: the line is highlighted, its target is outlined (1 px dashed `--jsb-accent`) in the tree with a `target` tag, and the dependency tab is added and selected.
- `Open in config`, in the policy column of the dependency tab, opens the config scrolled to the policy, with its lines highlighted; the tabs are `Project` and `eslint.config.js`, whose note names the dependency it came from.
- A problem opens the config at its range or puts its dependency in focus.
- Nothing in focus shows the `Nothing open` pane, the numbers of the project and the `Project` tab.
