---
name: release
description: Prepare and publish a release of the @boundaries packages by running the "Release process" in .github/CONTRIBUTING.md. Inventories the packages with unreleased changes, proposes their versions, updates changelogs, package versions and Sonar versions on a new chore/release-<version> branch with a PR into release, then promotes release to master, creates the vX.Y.Z GitHub release and closes the release (publication check, milestone, project board, comments on the fixed issues linking the release notes and upgrade notes, branch cleanup), showing a preview and asking for confirmation before every commit, push, PR, tag, release or comment. Use when the maintainer asks to release, publish, cut a release, prepare a release PR or finish a published release.
argument-hint: "[eslint-plugin version]"
---

# Release

## When to use this skill

Use this skill when the maintainer asks to prepare or publish a release. The procedure itself is written once, in the "Release process" section of `.github/CONTRIBUTING.md`; this skill executes it and adds the preconditions, the checks and the confirmations an agent needs. Read that section and `.agents/rules/changelog-and-versioning.md` before starting, and follow `CONTRIBUTING.md` for what each release step changes.

What a GitHub release publishes is in step 6 of "Publishing" in `.github/CONTRIBUTING.md`, and a published version cannot be replaced. Remind the maintainer of both before the release step.

## Inputs

Provide (optional):

- **eslint-plugin version**: the version to release. If omitted, it is proposed during the inventory.

## Procedure

The release spans four phases. The first three depend on merges made outside this skill: start at the phase the repository state is in, and stop at the end of each phase until the maintainer says the next merge happened. The fourth closes the release once it is published.

### Phase 1: prepare the release PR

1. **Check the preconditions.**
   - `git status --porcelain` is empty. If not, stop and ask the maintainer what to do with the changes.
   - Run `git fetch origin`; the local `release` branch equals `origin/release`. If not, stop and ask before updating it.
   - Never commit on `release`. The preparation always goes on a new branch `chore/release-<eslint-plugin-version-with-dashes>` created from `release` (for example `chore/release-7-2-1`) and ends in a PR into `release`.

2. **Take the inventory.**
   - List every package whose `CHANGELOG.md` has entries under the Unreleased section or under a version section that is not on `origin/master` yet.
   - Propose each new version from the entries, following `.agents/rules/changelog-and-versioning.md`. A version already set in a package's `package.json` by a contributor PR, or named in its Unreleased entries or in an upgrade notes page, is the starting proposal; flag it if it does not fit the entries, or if they name different versions.
   - Check that every package that depends on a changed one is also versioned (`pnpm nx graph` or `pnpm nx show project <name> --json`), and that `package.json` and `sonar-project.properties` of `elements`, `config`, `policies` and `eslint-plugin` agree on the version.
   - For the website, apply step 2 of "Publishing": detect whether `packages/website/docs/` changed since the latest snapshot listed in `packages/website/versions.json` (compare it with `packages/website/versioned_docs/version-<latest>/` and read the website changelog's Unreleased section).
   - If `eslint-plugin` has no new version, stop and ask the maintainer how to tag the release.

3. **Show a mandatory preview and get explicit confirmation.** Present the proposed version of every package, the branch name, the commit message (`chore(release): Release eslint-plugin vX.Y.Z and elements vA.B.C`) and the PR title (`chore: Release eslint-plugin vX.Y.Z and elements vA.B.C`), both naming the packages actually released, and the planned change to every file, including whether the website gets a new version. Let the maintainer adjust versions. Do not create the branch, edit files, commit, push or open a PR before the confirmation.

4. **Apply the changes.** Create the branch and make the changes `CONTRIBUTING.md` lists for the preparation. Run `pnpm nx version website <version>` only when the website takes a new version. Show the resulting `git status`, the real `git diff --stat` (excluding `versioned_docs/` content from the detailed diff) and the versions that changed, then ask for explicit confirmation again before committing and pushing: the preview could not include the output of `pnpm nx version website`.

5. **Commit, push and open the PR into `release`.** Commit with the confirmed message, push the branch, and open the PR with the `create-pr` skill (target `release`, title as confirmed). Stop here and report.

### Phase 2: promote `release` to `master`

Start when the maintainer confirms the PR from phase 1 is merged into `release`.

1. Run `git fetch origin` and check that `origin/release` contains the release commit and the versions match the confirmed ones.
2. Build the PR from `release` to `master` as step 4 of "Publishing" defines it. Collect the issues to close from the `(#N)` tokens and the `closes #N` lines in the commits and merged PRs in `git log origin/master..origin/release`. Resolve each number on GitHub: an issue goes in the list, and a pull request is read for the issues it closes.
3. Show a preview of the title, the full body and the list of issues to close. Ask for explicit confirmation before opening the PR.
4. Open the PR, with the GitHub MCP tools or `gh`. Stop here and report.

### Phase 3: create the GitHub release

Start when the maintainer confirms the PR from phase 2 is merged into `master`.

1. Check that `origin/master` contains the release commit.
2. If the website got a new version, check that the "Update Website Search Index" workflow ran for the merge (`gh run list --workflow web-search-index.yml`). If it did not, tell the maintainer to trigger it manually, as `CONTRIBUTING.md` describes.
3. Build the release as `CONTRIBUTING.md` defines it: tag `vX.Y.Z` (the `eslint-plugin` version, on `master`), a human-readable title proposed from the changelog entries, and a description with one section per released package copied from its `CHANGELOG.md`, `eslint-plugin` first.
4. **Show a mandatory preview** of the tag, title and full description, remind the maintainer what the release publishes (step 6 of "Publishing"), and ask for explicit confirmation. Never create a tag or a release without it.
5. Create the release targeting `master`, with the GitHub MCP tools or `gh release create`. Report the URL, and that the publish workflows were triggered. Continue with phase 4.

### Phase 4: close the release

Start right after the release is created, or when the maintainer asks to finish a release that is already published.

1. **Check the publication.** Wait for the publish workflows to finish (`gh run list --workflow publish.yml` and `--workflow publish-to-github.yml`) and check with `npm view <package> version` that every released package is on npm; the registry can take some minutes to show a version after the workflow succeeds. If a workflow failed, report it and stop: fixing a publication is the maintainer's decision.
2. **Close the milestone.** If a milestone named after the `eslint-plugin` version (`vX.Y.Z`) exists and has no open issues or pull requests, close it (`gh api -X PATCH repos/<owner>/<repo>/milestones/<number> -f state=closed`). If it still has open items, list them and ask the maintainer what to do with them.
3. **Update the project board**, if the repository has one (read `gh project list --owner <owner>`; it needs the `project` token scope, `gh auth refresh -s read:project,project`). For each issue closed by the phase 2 PR, check its status on the board and move to the final column (for example `Done`) the ones that are not there yet. A board workflow usually moves them when the issue is closed, so often nothing is left to do: say so.
4. **Comment on the issues the release fixes.** Take the issues closed by the phase 2 PR and decide for each one whether a comment helps its readers: issues opened by external reporters or fixed by external contributors get one; the maintainer's own tracking and task issues normally do not. Each comment names the released version, links the GitHub release and, when the website has upgrade notes or a migration guide for the fix, links their exact section; it thanks the reporter and the contributors by their GitHub user. **Show a mandatory preview of every comment**, let the maintainer drop or edit any of them, and post only the confirmed ones (`gh issue comment <number> --body-file <file>`). Never post a comment without that confirmation.
5. **Delete the merged branches** the release leaves behind: the `chore/release-*` branch of phase 1, and any integration branch named in the release issues. List them and ask before deleting; `git push origin --delete <branch>` only after the confirmation.
6. Report what was checked, closed, moved, commented and deleted, and what was skipped and why.

### Authorization Failure Handling

Follow "Authorization Failure Handling" in `.agents/skills/create-pr/SKILL.md`. Include in the response what the failed step needed, so the maintainer can do it manually: the commit message, the PR text, or the tag, title and release description.

## Output format

Return results with:

- **Summary**: the phase completed, the version of every released package, and the URLs of the PR or release created. For phase 4, the publication check result, the milestone and board changes, the issues commented and the branches deleted.
- **Details**: the files changed per package, the branch name, and how the website decision was made.
- **Pending manual steps**: the merge the maintainer has to make before the next phase, the search index check when the website got a new version, and anything phase 4 left for the maintainer, such as a failed publication.
- **On authorization failure**: the copyable content from the failure handling section, and a clear statement that authorization is required.

Include assumptions, risks, and follow-ups when relevant.

## Notes / Constraints

- Write every text with the `writing-style` skill.
- Never commit on `release` or `master`, and never push to them.
- Never commit, push, open a PR, tag, create a release, post a comment or delete a branch without showing a preview and obtaining explicit confirmation in the same phase.
