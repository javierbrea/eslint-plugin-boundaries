---
name: review-pr
description: "Review a GitHub pull request from three perspectives — functional fit against its linked issue, code correctness/quality, and architectural boundaries — then post a single GitHub review: one general overall comment plus inline comments for each real finding. Use when: asked to review, check, or give feedback on a pull request, given a PR URL/number, or asked to review the PR for the current branch."
argument-hint: "[pr_url | pr_number] (defaults to the open PR for the current branch)"
---

# Review Pull Request

## When to use this skill

Use this skill when you need to review a GitHub pull request in this repository — checking whether it fulfils the issue it addresses, whether the code itself is correct and well tested, and whether it respects the repository's architecture — and to publish that review as a single GitHub pull request review with a general comment and per-finding inline comments.

## Inputs

Provide (all optional; a sensible default applies):

- **`pr_url` or `pr_number`**: a full GitHub pull request URL, or a bare number in this repository. If omitted, the skill looks up the open pull request for the current branch.

## Procedure

1. **Resolve the target PR.** Accept a full PR URL, a bare number, or nothing.
   - A full URL fully identifies owner/repo/number.
   - A bare number is assumed to belong to this repository's `origin` remote (`javierbrea/eslint-plugin-boundaries`).
   - With no argument, find the current branch and look up the open pull request for it (prefer a GitHub MCP tool such as `pull_request_read`/`list_pull_requests`; fall back to `gh pr view --json url,number`). If none exists, tell the user and stop.
   - Fetch the PR's metadata, changed files and diff, and existing review comments (prefer `pull_request_read`).

2. **Sync the local checkout.** Compare the current branch and its `HEAD` commit against the PR's head ref and head commit sha.
   - If they already match, proceed directly.
   - If they differ, state exactly what differs (branch name and/or commit sha) and **ask for explicit permission** before doing anything: `git fetch origin <headRef>` then checkout. If the working tree has uncommitted changes, warn about that first and never discard local work without confirmation.
   - If the user declines the checkout, continue in **GitHub-only mode**: review using the PR's diff and file contents fetched over the GitHub API/MCP instead of the local working tree. Remember this for the final report — local checks such as running tests or lint cannot be performed in this mode.

3. **Discover the related issue**, to obtain the functional specification the change is meant to satisfy. Try in order:
   - A `closes #<number>` / `fixes #<number>` / `resolves #<number>` reference (or GitHub's own linked-issues field) in the PR body.
   - A number in the PR's source branch name (for example `477` in `fix/477/migration-guide-links`).
   - A `(#<number>)` token in the commits on the branch (this repository's commit convention is `<type>(#<number>): <description>`).
   - If an issue is found, read it in full — including its comments — with `issue_read` (or `gh issue view <number> --json title,body,comments`) to build the functional spec.
   - If no issue is found, proceed in issue-less mode: derive the spec from the PR title and description only.

4. **Gather review context.**
   - The diff of the PR against its base branch, and the full list of changed files.
   - The PR's existing review comments and conversation — do not raise a finding that has already been raised by someone else; note where you agree/disagree with an existing unresolved comment instead.
   - The base branch's relevant `AGENTS.md` file(s) for any package touched by the diff (see this repository's `CLAUDE.md` layering: read a project's own `AGENTS.md` before reviewing a change there).

5. **Perspective 1 — functional review against the issue (perform this yourself, do not delegate).** Using the spec built in step 3:
   - Does the change actually implement what the issue describes? Note missing cases, deviations, or behaviour the issue calls for that the diff does not deliver.
   - Are there functional problems beyond the issue's literal scope (regressions, edge cases, broken assumptions)?
   - Does the PR description accurately describe what the diff does?
   - Were tests added or updated for the new/changed behaviour?
   - Is there a `CHANGELOG.md` entry under "unreleased", and was the package `version` bumped consistently with SemVer, per `.github/CONTRIBUTING.md` and `.agents/rules/changelog-and-versioning.md`?
   - When the change is user-visible, was documentation updated accordingly — the package `README.md`, `docs/**`, and/or the website content under `packages/website/docs/**` (per `.agents/rules/docs-authoring.md`)? Flag it only when the issue or diff implies user-visible behaviour actually changed.

6. **Perspective 2 — delegate to the `reviewer` subagent** for code correctness, quality, and test coverage. Give it: the PR number and title, the base branch and diff range (`<base>...<headSha>`), the list of changed files, and whether the review is running in GitHub-only mode (so it knows whether it can run tests/lint locally).

7. **Perspective 3 — delegate to the `architecture-reviewer` subagent** for boundary/dependency-direction/Nx-graph compliance. Give it the same context as step 6, **plus the functional spec derived in step 3**, so it can judge not only compliance but whether the change is architecturally well-placed for what the issue actually requires, and flag a better structural alternative if one exists.

   Run steps 6 and 7 **in parallel, in a single message** — they are independent.

8. **Consolidate the three perspectives.**
   - Merge all findings; drop exact or near duplicates between perspectives.
   - Drop anything already raised in an existing unresolved PR comment (step 4).
   - Drop speculative or low-confidence findings — do not report a "maybe" as a finding.
   - For each surviving finding, record: file path, line (must fall within the diff — see Notes), severity (`blocking` / `non-blocking` / `nit`), a one- or two-sentence explanation, and — when the fix is small and localized — a GitHub suggestion block with the exact replacement code.
   - Draft the general/overall comment: a short assessment of overall code quality, structure, and whether the PR fulfils the issue, plus a summary of how many findings of each severity follow as inline comments. If there are no findings, the general comment says so plainly and is the entire review.

9. **Show a mandatory preview.** Present the full general comment and a numbered list of every inline comment (`file:line`, severity, explanation, suggestion if any). Ask for explicit confirmation before posting anything. Let the user drop, edit, or downgrade individual findings before proceeding. Do not post anything before this confirmation.

10. **Post the review**, using the GitHub MCP review flow:
    - `pull_request_review_write` with `method: create` to open a pending review, including the general comment as its body.
    - `add_comment_to_pending_review` once per confirmed inline finding, with the suggestion block included in the comment body when applicable.
    - `pull_request_review_write` with `method: submit_pending` and **`event: COMMENT`** to submit. The review is always submitted as a comment — never `APPROVE`, never `REQUEST_CHANGES`; the human maintainer decides the verdict.
    - Fall back to `gh` CLI or REST only for operations the MCP tools do not support.

11. **No findings is a valid, complete outcome.** If nothing survives step 8, submit the general comment alone. Do not invent problems to justify inline comments.

12. **Report** to the user: the review URL, the count of findings by severity that were posted, whether the review ran in GitHub-only mode, and whether an issue was found and used for the functional spec.

### Authorization Failure Handling (Required)

- Never enter retry loops with shell commands when authorization or authentication failures are detected.
- Treat errors such as `401`, `403`, `Bad credentials`, `Requires authentication`, `Resource not accessible by integration`, `permission denied`, or `not authorized` as terminal for the current automation attempt.
- On such failures, stop automation immediately and inform the user that authorization is required.
- Always include the full computed review — general comment plus every inline comment with its `file:line` and suggestion — in the response so the user can copy and paste it manually.
- Do not keep attempting alternative shell-based GitHub flows after an auth failure has been detected.

## Output format

Return results with:

- **Summary**: the pull request reviewed, the review URL once posted, the number of findings by severity, whether GitHub-only mode was used, and whether a linked issue was found and used for functional context.
- **Details**: the general comment text and the full list of inline findings (file, line, severity, explanation, suggestion).
- **On authorization failure**: the copyable general comment and every inline comment, and a clear statement that authorization is required.

Include assumptions, risks, and follow-ups when relevant.

## Examples

### Example A (PR URL, linked issue, clean checkout)

**Input**
- Goal: review `https://github.com/javierbrea/eslint-plugin-boundaries/pull/478`.
- Context: the local branch is already checked out at the PR's head commit; the PR body contains `closes #470`.

**Expected output**
- Issue `#470` read for functional context; `reviewer` and `architecture-reviewer` run in parallel; findings consolidated; preview shown and confirmed; a `COMMENT` review posted with a general comment and, say, two non-blocking inline comments; the review URL reported.

### Example B (bare number, branch mismatch, checkout declined)

**Input**
- Goal: review PR `481` while on an unrelated local branch with uncommitted changes.
- Context: the user declines the offered checkout.

**Expected output**
- GitHub-only mode: diff and files fetched via the API/MCP instead of the working tree; the final report notes that local tests/lint could not be run; review still posted after preview confirmation.

### Example C (current branch, no linked issue, no findings)

**Input**
- Goal: review the PR for the current branch; no argument given.
- Context: no issue reference in the PR body, branch name, or commits; the diff is small and clean.

**Expected output**
- Issue-less mode, spec drawn from the PR description only; both subagents report no significant issues; preview shows a general comment only, no inline comments; posted as `COMMENT` after confirmation.

## Notes / Constraints

- **All posted review content MUST ALWAYS be written in English**, regardless of the user's language. This is a mandatory requirement.
- **Do not use hard line breaks within paragraphs** in the general comment or inline comments. Each paragraph must be a single unbroken line; only blank lines separate paragraphs.
- Inline comments may only anchor to a line present in the diff; a finding about code the diff does not touch belongs in the general comment instead.
- The review is always submitted with `event: COMMENT`. Never submit `APPROVE` or `REQUEST_CHANGES` automatically.
- Always show a preview and obtain explicit confirmation before posting the review.
- Never check out the PR branch, or discard local changes, without explicit permission.
- Prefer GitHub MCP tools for all supported operations; fall back to `gh` CLI or REST only for what MCP cannot do.
- If no problems are found, do not manufacture any — a general-comment-only review is a complete, valid result.
