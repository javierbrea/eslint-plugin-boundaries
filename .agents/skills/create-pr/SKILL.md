---
name: create-pr
description: Create or update a GitHub pull request for the current branch from the repository's fixed PR template (.github/PULL_REQUEST_TEMPLATE.md) and the branch changes. Infers PR type from the branch name, discovers the related GitHub issue number from the branch name or from the commits on the branch, enriches the description from that issue when it can be read, asks clarifying questions, and always shows a preview for explicit confirmation before creating the PR in draft state.
argument-hint: "[target_branch=release]"
---

# Create Pull Request

## When to use this skill

Use this skill when you need to open or update a GitHub pull request for the current branch, filling the repository's PR template from the actual branch changes and, when possible, from the linked GitHub issue.

## Inputs

Provide (optional; a sensible default applies):

- **`target_branch`** (default `release`): the base branch for the pull request.

## Procedure

1. **Resolve inputs.** Determine `target_branch` from the arguments, defaulting to `release`.

2. **Read the PR template.** It always lives at `.github/PULL_REQUEST_TEMPLATE.md` in this repository — read it directly, no discovery needed. If it is somehow missing, build a sensible default description structure from the changes.

3. **Infer the PR type from the branch name.** Map the branch prefix to the PR `<type>`:

   | Branch prefix | PR title `<type>` |
   |---------------|-------------------|
   | `feat/`       | `feat`            |
   | `fix/`        | `fix`             |
   | `docs/`       | `docs`            |
   | `chore/`      | `chore`           |
   | `refactor/`   | `refactor`        |

   If the PR type cannot be inferred with confidence, ask the user before proceeding.

4. **Discover the related GitHub issue.**
   - Look for a number in the branch name (for example `466` in `feat/466/category-type-accumulation`).
   - If none, inspect the commits on this branch that are not on `target_branch` (`git log <target_branch>..HEAD`) for a `(#<number>)` token — this repository's commit convention is `<type>(#<number>): <description>` (for example `feat(#466): ...`).
   - If still none, ask the user whether the change relates to a GitHub issue. If the user confirms there is none, proceed in issue-less mode (see step 7).

5. **Gather change context.** Inspect the branch changes against `target_branch` (for example `git diff <target_branch>...HEAD` and `git log <target_branch>..HEAD`) to understand what the pull request introduces, and to determine which parts of the codebase were touched (for the scope labels in step 9).

6. **Enrich the description (issue conditional).**
   - If an issue number was found, fetch it — prefer a GitHub MCP tool (for example `get_issue`); otherwise `gh issue view <number> --json title,body` — and use its title/body together with the diff to write an accurate change description.
   - If no issue was found, or it cannot be read, derive the description from the branch changes only.
   - In both cases, ask the user any clarifying questions about the changes or intent **before** showing the preview.

7. **Build the title and description.** `<type>` is one of `feat`, `fix`, `docs`, `chore`, `refactor`.
   - The title must follow the pattern `<type>: Title` (conventional-commit style, matching this repository's own commit messages).
   - Fill the template sections (`Description`, `Agreement`) from the issue and the diff. Leave the Agreement checkboxes unchecked for the user to confirm themselves.
   - When an issue number was found, add a `closes #<number>` line following the template's "Closing issues" convention. In issue-less mode, omit it.

8. **Show a mandatory preview.** Present the full title and description and ask for explicit confirmation before any create or update call. When updating an existing pull request, make clear which content will be replaced, and preserve any manually added sections not covered by the template rather than overwriting them.

9. **Determine labels from the actual changes.** This repository uses these labels (match the strings exactly, including the space after the colon):
   - Type: `type: bug` (branch prefix `fix/`/`bug/`, or `fix(...)` commits) or `type: feature` (branch prefix `feat/`). For other prefixes, do not force `type: bug`/`type: feature`; ask the user if a type label should be applied (for example `type: task`).
   - Scope, one or more depending on which files changed in the diff:
     - `scope: code` — functional code under `packages/*/src`.
     - `scope: tests` — test files (`test/`, `*.spec.*`, `*.test.*`).
     - `scope: documentation` — docs/website content and `*.md` files.
     - Other existing labels (`scope: dependencies`, `scope: CI-CD`, `scope: refactor`) may also apply — use them when the diff matches.

10. **Prefer GitHub MCP tools.** Use GitHub MCP tools for all supported operations (for example `create_pull_request`, `update_pull_request`, `get_issue`). Fall back to `gh` CLI or REST only for operations MCP does not support.

11. **Create or update the pull request.** Check whether a pull request already exists for the current branch. If one exists, update it and leave its existing draft/ready state unchanged (never promote or demote it). Otherwise create a new pull request targeting `target_branch`, **explicitly setting `draft: true`** so it starts in draft state; do not switch a newly created pull request to ready for review.

12. **Label and assign.** Apply the labels determined in step 9 (adding to, not replacing, any labels already present on an existing PR unless they conflict, e.g. a stale type label). On creation, assign the pull request to the authenticated user; on update, keep the existing assignee (do not reassign).

13. **Report.** Respond to the user with the pull request URL.

### Authorization Failure Handling (Required)

- Never enter retry loops with shell commands when authorization or authentication failures are detected.
- Treat errors such as `401`, `403`, `Bad credentials`, `Requires authentication`, `Resource not accessible by integration`, `permission denied`, or `not authorized` as terminal for the current automation attempt.
- On such failures, stop automation immediately and inform the user that authorization is required.
- Always include the computed PR title and full PR description in the response so the user can copy and paste them manually.
- Do not keep attempting alternative shell-based GitHub flows after an auth failure has been detected.

## Output format

Return results with:

- **Summary**: the pull request URL, whether it was created or updated, its draft state, the title, the applied labels, and the base branch.
- **Details**: the final title and the template sections that were filled, plus how the description was sourced (GitHub issue plus diff, or diff only).
- **On authorization failure**: the copyable PR title and full PR description, and a clear statement that authorization is required.

Include assumptions, risks, and follow-ups when relevant.

## Examples

### Example A (feature, issue from branch name)

**Input**
- Goal: open a PR for branch `feat/466/category-type-accumulation`.
- Context: default `target_branch=release`; GitHub MCP not available, `gh` CLI available.

**Expected output**
- Issue `#466` discovered from the branch name; description enriched from `gh issue view 466` plus the diff; a preview confirmed by the user; a draft PR titled `feat: Support disabling category accumulation at file descriptors` targeting `release`, with `closes #466`, labeled `type: feature` and `scope: code` (plus `scope: tests`/`scope: documentation` if those files also changed), and its URL.

### Example B (fix, issue discovered from commits)

**Input**
- Goal: open a PR for a branch with no issue number in its name, whose commits on top of `release` include `fix(#460): boundaries/dependencies no longer skips external/core dependencies ...`.
- Context: default `target_branch=release`.

**Expected output**
- No number found in the branch name, so the commit `(#460)` token is used instead; issue `#460` fetched to enrich the description; draft PR titled `fix: ...` with `closes #460`, labeled `type: bug` and `scope: code`, plus its URL.

### Example C (issue-less)

**Input**
- Goal: open a PR for branch `chore/update-dependencies`.
- Context: default `target_branch=release`; no issue number in the branch name or in the commits; the user confirms there is no related GitHub issue.

**Expected output**
- Issue-less mode: description written from the diff only, no `closes` line, a preview confirmed by the user, and a draft PR titled `chore: Update dependencies` targeting `release`, labeled `scope: dependencies`, plus its URL.

## Notes / Constraints

- **The pull request title and description MUST ALWAYS be written in English**, regardless of the user's language. This is a mandatory requirement.
- **Do not use hard line breaks within paragraphs** in the PR description. Each paragraph must be a single unbroken line; only blank lines separate paragraphs.
- One pull request per branch: verify existing pull requests before creating a new one.
- The pull request must remain in draft state after creation.
- Always show a preview and obtain explicit confirmation before creating or updating the pull request.
