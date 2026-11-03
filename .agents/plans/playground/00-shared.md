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
- PR description: what changed and why, the acceptance criteria of the issue with how each was checked, measurements when the issue asks for them (bundle sizes, Lighthouse), and screenshots for UI phases (committed as contact sheets on an orphan `screenshots/<phase-branch>` branch and embedded by raw URL, as the redesign did; phase 9 deletes those branches).

## 3. Website conventions (phases 5 to 8)

- The website is Docusaurus 3 with `trailingSlash: true` and `onBrokenLinks: "throw"`: every internal link ends with `/` and must exist. `packages/website/AGENTS.md` and `.agents/rules/docs-authoring.md` govern docs edits; `docs/` is the next version, `versioned_docs/` holds the published ones (the newest is the first entry of `versions.json`), and the playground adds pages to `docs/` only.
- Design tokens are in `packages/website/src/css/tokens.css` (`--jsb-*`, light on `:root`, dark on `[data-theme="dark"]`); fonts are self-hosted (`fonts.css`); `infima-bridge.css` maps Infima onto the tokens. The playground reads the tokens and adds none to this file without the maintainer's agreement.
- `src/` layering is lint-enforced in `packages/website/eslint.config.mjs` (element types `page`, `theme`, `client`, `home`, `site`, `ui`, `motion`, `docs-component`, `data`, `prism`; `boundaries/no-unknown-files` on). A new folder is classified there before it is used; the playground page is a `page`, and any MDX component for the docs is a `docs-component` or a new element type the phase declares.
- The home teaser link is `GITHUB_PLAYGROUND_ISSUE` in `src/data/site/links.ts`; the navbar is in `docusaurus.config.ts`. Both change in phase 7 only.
- The website `build`, `check:types` and `start` build `playground` first, and its `lint` builds `eslint-plugin` first (`^build`).
- Netlify deploys `master` and previews the PRs into it with the build command `pnpm nx run website:build` (base directory `/`, package directory `packages/website`, publish directory `packages/website/build`), set in the Netlify UI, not in the repo (maintainer, 2026-11-02). It goes through Nx, so the `dependsOn` of the website `build` decides what is built before the site.

## 4. Quality gates (phases 5 to 8)

For `/playground/`, on the production build served locally (`pnpm --filter website serve`):

- `pnpm --filter website screenshots http://localhost:3000 /playground/` passes: no horizontal overflow, no console errors, both themes, 1440×900 and 390×844.
- Lighthouse (Chrome DevTools or `npx lighthouse`): Performance measured with the lazy chunk loaded; Accessibility 100; Best practices 100 (the GitHub stars pill may drop it to 96 when the API rate-limits, known and accepted).
- The playground chunk is not requested on `/` or on a docs page (network tab of the production build).
- At 390 px the page shows the title, the lead and the desktop-only note, no panes.
- `pnpm nx check:all website` and `pnpm nx check:all playground` pass.

## 5. Definition of done for a phase

- The acceptance criteria of its issue are checked and the PR description says how.
- `pnpm nx run-many -t check:all --all` passes locally; CI is green on the PR.
- The agent files it affects (`AGENTS.md` of the touched projects, `repo-architecture` skill, rules) are updated in the same PR, and say only what stays true.
- The PR leaves the plan ready for the next phase (`write-plan` skill, "Finishing a phase"): hand-offs moved to the files of the phases that need them, its own phase file deleted, the index status line rewritten, each plan edit approved by the maintainer before it is committed in the PR.
- The sub-issue is ticked in the `Plan` list of #539 when the PR merges.
