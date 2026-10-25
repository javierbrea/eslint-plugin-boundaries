<!-- cspell:disable -->
# Phase 9: remove the plan before merging into `release`

Goal: `feat/539/playground` contains no plan, no `.gitignore` exception and no plan clause in the root `AGENTS.md`, so that it can merge into `release` as the branching model requires.

Branch `chore/539/playground-cleanup` from `feat/539/playground`; PR into `feat/539/playground`, title `chore(playground): remove the playground plan`, merged last. No issue: it is bookkeeping of #539.

Preconditions: phases 4 to 8 merged. Anything the plan still holds that must survive (a decision, a convention) has already been moved to an `AGENTS.md`, a rule or a skill by the phase that established it; this phase checks that and moves what was missed before deleting.

## Steps

1. Read the plan once more and list every fact in it that is still true and not recorded in a committed file; add each one to the right place (`packages/playground/AGENTS.md`, `packages/website/AGENTS.md`, the `repo-architecture` skill) in this PR, following `.agents/rules/agents-md.md` (no status, no history).
2. Delete `.agents/plans/playground.md` and `.agents/plans/playground/` (mockups and renders included: the approved mockup's facts live in the components now; if the maintainer wants to keep the mockup, move it to the orphan branch `rfc/538-playground-assets`).
3. Restore `.gitignore` to the single line `.agents/plans/` and the root `AGENTS.md` plans clause to its text on `release` (compare with `origin/release`).
4. Delete the `screenshots/*` branches created by phases 4 to 8 (`git push origin --delete <branch>`), after the maintainer confirms their PRs no longer need the images.
5. Update #539: tick the sub-issues, note that the plan was removed, and that the final PR into `release` can be opened (`playground.md`, "Integration plan", step 3).

## Verification

- `git diff origin/release -- .gitignore AGENTS.md` shows no plan-related difference.
- `git ls-files .agents/plans` is empty on the branch.
- `pnpm nx run-many -t check:all --all` passes.
