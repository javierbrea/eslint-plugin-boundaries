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
pnpm nx start website                                        # Docusaurus dev server, http://localhost:3000
pnpm nx build website --output-style=stream                  # production build into packages/website/build
pnpm --filter website screenshots [baseUrl] [paths...]      # Playwright visual check (overflow, console errors, both themes, 1440 and 390 px)
```

- Repo rules that load automatically: `.agents/rules/typescript-conventions.md`, `unit-testing.md`, `nx-project-config.md`, `changelog-and-versioning.md`, `docs-authoring.md`, `agents-md.md`. Read the root `AGENTS.md`, the `repo-architecture` skill and the `AGENTS.md` of every project a phase touches.
- cspell runs on every staged file (`lint-staged`). Project words go in that project's `cspell.config.js` (`createConfig({ words: [...] })`); plan files start with `<!-- cspell:disable -->`.
- Subagents: at most two at a time (user rule), in waves.

## 2. Branching, PRs, commits

- Phase branches are named in the index ("Phases"): `feat/<issue>/<slug>` from the branch their PR targets. Extraction phases branch from `release` and target `release`; playground phases branch from `feat/539/playground` and target it. Never target `master`.
- One PR per phase, draft, created with the `create-pr` skill (it fills the template, infers the issue from the branch name and adds `closes #N`). For PRs into `feat/539/playground` the `closes` line is kept: it acts when the integration branch reaches `master`.
- Commit messages: Conventional Commits with the issue in the scope when there is one (`feat(#549): ...`), as the repository does; plan edits are `chore(playground): update the playground plan ...` on the integration branch.
- The integration branch merges `release` (never rebases) whenever a phase needs something merged there; the merge is a plain `git merge origin/release` commit, pushed.
- PR description: what changed and why, the acceptance criteria of the issue with how each was checked, measurements when the issue asks for them (bundle sizes, Lighthouse), and screenshots for UI phases (committed as contact sheets on an orphan `screenshots/<phase-branch>` branch and embedded by raw URL, as the redesign did; phase 9 deletes those branches).

## 3. Package conventions (phases 2, 3, 4)

A new package copies the shape of the closest existing one and changes only what differs:

- `packages/elements` is the model for a pure library: tsup build for Node.js and the browser (`tsup.config.js`, `exports` with `browser` / `node` / `default` conditions), jest with 100% coverage thresholds, `tsconfig.json` + `tsconfig.eslint.json`, `cspell.config.js`, `eslint.config.mjs` composing `support/eslint-config`, `sonar-project.properties`, `README.md`, `CHANGELOG.md` in the Keep a Changelog format with an `[Unreleased]` section, `LICENSE`, and `project.json` with `tags`, the `lint` dependency on `eslint:config` and `implicitDependencies: ["eslint-config", "cspell-config"]`.
- `packages/eslint-plugin` is the model for dogfooding: its `eslint.config.mjs` declares the element types of `src/` and a `boundaries/dependencies` policy list, and `boundaries/no-unknown-files` keeps every source file classified. A new package lints itself with the workspace plugin (`eslint-plugin-boundaries: "workspace:@boundaries/eslint-plugin@*"` as a devDependency, `lint` depending on `^build`), except where that would create a cycle: `config` and `policies` are dependencies of the plugin, so they lint themselves with the plugin only if the Nx graph stays acyclic (`lint` of `config` depending on `build` of `eslint-plugin` which depends on `build` of `config` is a cycle). Phase 2 decides and records it in the package's `AGENTS.md`; the fallback is the `elements` approach (layering described in `AGENTS.md`, not lint-enforced).
- Each package has an `AGENTS.md` under 200 lines following `.agents/rules/agents-md.md`: its layering, hard constraints and entry points, nothing that is a status or a decision record. A `CLAUDE.md` with the single line `@AGENTS.md` sits next to it (see `packages/eslint-plugin/CLAUDE.md`).
- Nx: standard target names (`lint`, `check:types`, `check:spell`, `build`, `test:unit`, `check:all`); `check:all` is `echo 'All checks passed'` and Nx runs the others as its dependencies through `nx.json` `targetDefaults`. Check `inputs`/`outputs` as `.agents/rules/nx-project-config.md` says.
- Publishing: `pnpm -r publish` in `.github/workflows/publish.yml` publishes every non-private workspace package, so a new public package needs no workflow change beyond checking its `publishConfig` and `files`; the GitHub Packages workflow (`publish-to-github.yml`) and the `release` skill name the packages explicitly and must be extended. `CONTRIBUTING.md` ("Versioning") requires a bump of every package that depends on a changed one.
- Changelog: one `[Unreleased]` entry per package changed, written for its users (`.agents/rules/changelog-and-versioning.md`, "Entry style"). A new package starts its changelog at its first version.
- The `repo-architecture` skill (`.agents/skills/repo-architecture/SKILL.md`) lists the component map and the dependency graph; every phase that adds a project updates its tables in the same PR, and the root `AGENTS.md` "Repository Overview" names the published libraries.

## 4. Browser readiness (phases 2, 3, 4)

`config`, `policies` and `playground` run in the browser. The check used by #510 for `elements` is the model: bundle an entry that imports the package with esbuild `platform: "browser"`, no aliases, no polyfills, and run the bundle in a `node:vm` context without Node.js globals (`process`, `path`, `fs`). Phase 2 adds it as a test of the package (a `test/browser` script run by `check:all` or a jest spec that bundles with esbuild), and phases 3 and 4 reuse it. Nothing in these packages reads `process`, `path` or `fs`; what the plugin needs from Node.js (root path resolution, module resolution, console output) stays in the plugin as an adapter.

## 5. Website conventions (phases 4 to 8)

- The website is Docusaurus 3 with `trailingSlash: true` and `onBrokenLinks: "throw"`: every internal link ends with `/` and must exist. `packages/website/AGENTS.md` and `.agents/rules/docs-authoring.md` govern docs edits; `docs/` is the next version, `versioned_docs/version-7.3.0/` the current one, and the playground adds pages to `docs/` only.
- Design tokens are in `packages/website/src/css/tokens.css` (`--jsb-*`, light on `:root`, dark on `[data-theme="dark"]`); fonts are self-hosted (`fonts.css`); `infima-bridge.css` maps Infima onto the tokens. The playground reads the tokens and adds none to this file without the maintainer's agreement.
- `src/` layering is lint-enforced in `packages/website/eslint.config.mjs` (element types `page`, `theme`, `client`, `home`, `site`, `ui`, `motion`, `docs-component`, `data`, `prism`; `boundaries/no-unknown-files` on). A new folder is classified there before it is used; the playground page is a `page`, and any MDX component for the docs is a `docs-component` or a new element type the phase declares.
- The home teaser link is `GITHUB_PLAYGROUND_ISSUE` in `src/data/site/links.ts`; the navbar is in `docusaurus.config.ts`. Both change in phase 7 only.
- The website `lint` builds `eslint-plugin` first (`^build`); after phase 4 its `build` also depends on `playground` build (today `build` has `dependsOn: []`, which phase 4 changes).

## 6. Quality gates (phases 4 to 8)

For `/playground/`, on the production build served locally (`pnpm --filter website serve`):

- `pnpm --filter website screenshots http://localhost:3000 /playground/` passes: no horizontal overflow, no console errors, both themes, 1440×900 and 390×844.
- Lighthouse (Chrome DevTools or `npx lighthouse`): Performance measured with the lazy chunk loaded; Accessibility 100; Best practices 100 (the GitHub stars pill may drop it to 96 when the API rate-limits, known and accepted).
- The playground chunk is not requested on `/` or on a docs page (network tab of the production build).
- At 390 px the page shows the title, the lead and the desktop-only note, no panes.
- `pnpm nx check:all website` and `pnpm nx check:all playground` pass.

## 7. Definition of done for a phase

- The acceptance criteria of its issue are checked and the PR description says how.
- `pnpm nx run-many -t check:all --all` passes locally; CI is green on the PR.
- The agent files it affects (`AGENTS.md` of the touched projects, `repo-architecture` skill, rules) are updated in the same PR, and say only what stays true.
- The plan is true after the phase: its hand-offs are recorded, the index status line is rewritten, later phases are adjusted, and the plan edit is approved by the maintainer and committed on `feat/539/playground`.
- The sub-issue is ticked in the `Plan` list of #539 when the PR merges.
