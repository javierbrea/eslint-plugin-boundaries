---
name: create-issue
description: Create one or several GitHub issues of this repository (feature, task, bug, or the sub-issues of a tracking issue or an accepted RFC) with the structure, labels and bookkeeping the repository uses — labels, assignee, milestone, project board column and parent issue — showing a preview before anything is created. Use when asked to create, draft, file or break down issues.
argument-hint: "[parent issue or RFC] [milestone]"
---

# Create issue

## When to use this skill

Use it to file any issue in this repository, from a one-line task to the set of sub-issues of an RFC. The workflow it implements is `docs/contributing-workflow.md` (steps 2 to 4); this skill adds the structure, the exact labels and the commands. Write every text with the `writing-style` skill.

## Inputs

Gather from the request and the conversation:

- **What** each issue delivers and why. For sub-issues, the parent issue or the RFC they come from.
- **Milestone**, when the work already has one. Otherwise propose one (see "Bookkeeping").
- **Assignee**: the maintainer unless told otherwise.

Before drafting, search the open issues (`gh issue list --state open --search "<words>"`) so that an existing issue is reused or linked instead of duplicated.

## Structure

**Title.** An imperative sentence naming the outcome, with the package when it matters: `Make the browser build of @boundaries/elements work without Node.js shims`. The type goes in the labels, not in a prefix.

**Body of a bug.** The `.github/ISSUE_TEMPLATE/bug_report.md` template.

**Body of any other issue**, in this order, dropping a section that would be empty:

1. `## Context`: why the issue exists, in a paragraph. An issue born from an RFC opens with `From [RFC #N: title](url)` and does not repeat the RFC's reasoning; an issue born from another issue links it.
2. `## Proposal` (or `## Scope` for a task): what changes, as a list or a short numbered plan, naming the files, packages and commands involved. What is explicitly out of scope goes at the end of this section.
3. `## Acceptance criteria`: a checklist that a reviewer can tick without asking the author. Each item is observable (a command that passes, a page that renders, a file that exists).
4. `## Open questions`: questions the implementer cannot answer alone, each with who decides it.
5. `## Blocked by` / `## Related`: issue numbers with a few words each on why.

A tracking issue (the parent of sub-issues) replaces `Proposal` with `## Plan`: the ordered list of its sub-issues, each as `- [ ] #N` so that GitHub shows the progress.

## Bookkeeping

Check the labels, milestones and board fields on GitHub before using them (`gh label list`, `gh api repos/{owner}/{repo}/milestones`, `gh project field-list 7 --owner javierbrea`); the lists below are the ones in use and are not updated by this skill.

- **Labels.** One `type:` label: `type: feature` for new behavior, `type: bug` for a defect, `type: task` for work with no new behavior; a sub-issue takes the type of its own work. `type: feature request` and `type: support` are for issues opened by users. Add the `scope:` labels of the files the work touches: `scope: code` (source under `packages/*/src`), `scope: tests` (`test/`, `*.spec.*`, `*.test.*`), `scope: documentation` (docs, website content, `*.md`), `scope: CI-CD`, `scope: dependencies`, `scope: refactor`. Add `status: blocked` when a `Blocked by` section exists. Match the strings exactly, including the space after the colon.
- **Milestone.** Work shipped by a package release goes in the version milestone `vX.Y.Z`. Work that spans releases and comes from an RFC gets a milestone named after the feature, with the RFC in its description. Create a missing milestone with `gh api repos/{owner}/{repo}/milestones -f title=... -f description=...`.
- **Project board.** Every issue goes to the user project "JS Boundaries" (number 7) with `Status` set to `Backlog`: `gh project item-add 7 --owner javierbrea --url <issue url> --format json --jq .id` returns the item id, then `gh project item-edit --project-id <project id> --id <item id> --field-id <status field id> --single-select-option-id <backlog option id>`. The project id comes from `gh project view 7 --owner javierbrea --format json --jq .id`, and the `Status` field and `Backlog` option ids from `gh project field-list 7 --owner javierbrea --format json`; the commands need the `project` token scope (`gh auth refresh -s project`). Leave the board's `Priority` and `Size` fields to the maintainer.
- **Assignee.** `--assignee` on creation.
- **Parent issue.** A sub-issue is attached to its parent with the GraphQL mutation `addSubIssue(input: { issueId, subIssueId })`, using the node ids from `gh issue view N --json id`; `gh issue create` has no option for it.

## Procedure

1. Resolve the inputs and search for duplicates.
2. Draft every issue: title, body, labels, milestone, assignee, parent.
3. Show a preview of all of them and ask for explicit confirmation. Nothing is created before it.
4. Create the issues in dependency order (parents and blockers first, so that their numbers can be referenced), then do the bookkeeping of each one.
5. When a tracking issue gets new sub-issues, update its `Plan` section with their numbers.
6. Report the URLs, the milestone and the board column.

Prefer the GitHub MCP tools when they are available and fall back to `gh`. Treat an authentication or authorization error as terminal: stop, report it, and include the drafted titles and bodies in the response so that they can be filed by hand.

## Notes

- One issue per deliverable that gets its own pull request. Research that only informs a decision is a comment on the tracking issue, not an issue, unless it is more than a day of work.
- The issue is not the plan: steps, file maps and commands that only the implementer needs go to `.agents/plans/` (`write-plan` skill), and the issue links the plan's branch when one exists.
