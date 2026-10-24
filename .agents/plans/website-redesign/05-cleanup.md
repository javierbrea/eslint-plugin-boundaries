<!-- cspell:disable -->
# Phase 5: remove the plan from the branch

Goal: leave no trace of the plan in the tree that merges into `release`. Run it after phases 1–3 are merged into `feat/website-redesign`.

Read first: `../website-redesign.md`.

## Steps

1. Branch `chore/website-redesign-cleanup` from `feat/website-redesign`.
2. Delete `.agents/plans/website-redesign.md` and the folder `.agents/plans/website-redesign/` from the tree (`git rm -r`).
3. In the repo-root `.gitignore`, restore the single line `.agents/plans/` in place of the `.agents/plans/*` pattern and its two `!` exceptions.
4. In the repo-root `AGENTS.md`, remove the sentence that allows committing a shared plan on its feature branch, leaving the original rule: plans go in `.agents/plans/`, which is git-ignored, and no committed file may depend on them.
5. Search the tree for leftovers: `grep -rn "website-redesign" --exclude-dir=node_modules --exclude-dir=.git .` must only return branch names in git metadata, nothing in tracked files.
6. `pnpm nx check:all website --output-style=stream` passes (nothing depended on the plan, so this is a sanity check).
7. PR `chore(website): remove the redesign plan` against `feat/website-redesign`. No changelog entry: nothing changes for site visitors.
8. Once the phase PRs are merged, delete on origin everything the redesign created outside the tree, so that only the merged code remains:
   - The screenshot branches: `screenshots/website-redesign-foundation`, `screenshots/website-redesign-home` and the one phase 3 creates (`git push origin --delete <branch>`, see `00-shared.md` section 2). The images embedded in the merged PR descriptions stop resolving then, which is acceptable once the redesign is live; nothing else references them.
   - The merged phase branches, if GitHub did not delete them on merge: `feat/website-redesign-foundation`, `feat/website-redesign-home`, `feat/website-redesign-docs` and `chore/website-redesign-cleanup`.
   - After the final PR merges into `release` (see below): the integration branch `feat/website-redesign`.
   - Check: `git ls-remote --heads origin | grep website-redesign` returns nothing.

   The assets of the playground RFC (#538) live on `rfc/538-playground-assets`, a branch of their own outside the `screenshots/` namespace; this phase does not touch it.

## After the merge

The maintainer opens the final PR from `feat/website-redesign` into `release` with a description that summarizes the phases (link the phase PRs) and the design decisions from the index, since the plan itself is gone, and then merges `release` into `master` (maintainer-only, merge commit, per the branching model in `.github/CONTRIBUTING.md`). Netlify deploys `master`: the styles reach every docs version in that deploy, together with the new home. No package release, website version bump or GitHub release is involved.
