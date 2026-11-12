<!-- cspell:disable -->
# Phase 11: remove the plan before merging into `release`

Goal: `feat/539/playground` contains no plan and no `.gitignore` exception, so that it can merge into `release` as the branching model requires, and nothing the plan still knows is lost.

Branch `chore/539/playground-cleanup` from `feat/539/playground`; PR into `feat/539/playground`, title `chore(playground): remove the playground plan`, merged last. No issue: it is bookkeeping of #539. No changelog entry: it changes no published or deployed code.

Preconditions: phases 4 to 10 merged (phase 10 as #646, 2026-11-12).

## Steps

1. Move the only fact of the plan that no committed file records: the Netlify build settings of `00-shared.md` section 3 (the build command `pnpm nx run website:build`, base directory `/`, package directory `packages/website`, publish directory `packages/website/build`, set in the Netlify UI and not in the repository, so that the `dependsOn` of the website `build` decides what is built before the site). They go to the "Deployment" section of `packages/website/README.md`. The rest is already recorded: the interface of `00-shared.md` section 6 in the components and their TSDoc (the contrast mixes in `src/ui-kit/helpers/tone/tone.constants.ts` and `theme.constants.ts`, `--jsb-faint` in `packages/website/src/css/tokens.css`, the page layout in `playground.module.css`), decisions 15 and 17 in `packages/playground/AGENTS.md`, 19 in the Playground guide, 20 in `packages/website/AGENTS.md`, 22 in `.agents/rules/playwright-testing.md`, 23 in `packages/playground/AGENTS.md` and the TSDoc of the evaluator, and the build graph in the `repo-architecture` skill.
2. File the second open question of the index (the `--jsb-*` tokens and the fonts as a workspace package) as an issue with the `create-issue` skill. The first one (the website version) is not an issue: `.github/CONTRIBUTING.md` ("Publishing", step 2) decides it when `release` is promoted, with the `release` skill, and the comment of step 6 says so.
3. Delete `.agents/plans/playground.md` and `.agents/plans/playground/`, mockups and renders included.
4. Restore the plan lines of `.gitignore` to the single line `.agents/plans/` of `origin/release`, keeping the `dist-playwright` and `test/website-e2e/test-results/` lines that phases 9 and 10 added.
5. Delete, with `git push origin --delete <branch>`, the seven `screenshots/*` branches of the plan, whose images the descriptions of these merged pull requests embed: `screenshots/feat/551/playground-scaffold` (#599), `screenshots/feat/552/playground-identify` (#621), `screenshots/feat/553/playground-verdicts` (#630), `screenshots/feat/554/playground-share` (#633), `screenshots/feat/539/playground-panes` (#638), `screenshots/feat/635/playground-worker` (#641) and `screenshots/docs/555/playground-guide` (#642). Phases 9 and 10 made none. The `screenshots/website-redesign-*` branches belong to the website redesign.
6. Update #539: tick #640 in the `Plan` list, and replace the sentence that points to `.agents/plans/playground.md` with one that says the plan was removed. Then comment that the final PR can be opened: from `feat/539/playground` into `release`, title `feat: Website playground`, the body built from the phase PRs, `closes` for #539 and its open issues of the milestone (#551, #552, #553, #554, #555, #634, #635, #640); the issue of step 2; and that the website version is decided when `release` is promoted.

## Verification

- `git diff origin/release -- .gitignore AGENTS.md` shows no plan-related difference.
- `git ls-files .agents/plans` is empty on the branch, so the "Check that no plan is committed" step of `.github/workflows/build.yml` passes on the final PR.
- `pnpm nx run-many -t check:all --all` passes.
