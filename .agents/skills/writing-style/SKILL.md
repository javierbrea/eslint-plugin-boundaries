---
name: writing-style
description: Style for everything written for people on GitHub or in plans — issue bodies, pull request descriptions, RFCs, review and issue comments, release notes and the files under .agents/plans/. Load before drafting any of them, and before reviewing one for style.
---

# Writing style

Everything published from this repository is read by someone who was not in the session: a contributor picking up an issue, a reviewer, the community reading an RFC, or an agent implementing a plan with no other context. Write for that reader.

## Shape

- Lead with what the reader needs to know or decide. Context comes second, history last or not at all.
- One idea per paragraph, and a paragraph is at most four or five lines. Anything longer is split or becomes a list.
- Use a bulleted list for parallel items (criteria, steps, files, options, findings) and prose for an argument. A bullet is one or two sentences; a bullet that needs a paragraph is a section.
- Use a numbered list only when the order matters.
- Use a table to compare things along two or more attributes. Three rows or fewer with one attribute is a list, not a table.
- Use a checklist (`- [ ]`) only for items that get ticked off: acceptance criteria, task lists. Never for prose.
- Headings (`##`, `###`) name what the section holds (`Context`, `Proposal`, `Acceptance criteria`), not what the writer did. A text under about fifteen lines has no headings.
- Do not hard-wrap paragraphs. One paragraph is one line; blank lines separate paragraphs. GitHub renders single line breaks as breaks.

## Register

- English, plain and direct. State facts and decisions: "the playground is its own package", not "we could consider making the playground its own package". A real open question is written as a question under `Open questions`.
- Say what and why. Leave out how the text was produced ("I checked", "after looking at", "it seems that").
- Be concrete: name the file, the command, the number, the issue. `#N` for issues and pull requests, the full URL for a discussion, backticks for paths, commands, options and code, a fenced block for anything multi-line.
- Link instead of restating. One link per fact, placed where the fact is used. When a fact already lives in a repository file, point to the file.
- No emphasis for urgency (`IMPORTANT`, bold sentences, exclamation marks) and no emojis. The only exception is the status marker on the first line of an RFC (`**Status:** 🟡 Draft`, `✅ Done`).
- Expand an acronym the first time it appears unless it is a common one in this repository (ESLint, RFC, PR, CI, URL).

## Length

- An issue says what, why and how it is accepted. It fits on one screen when the task is one day's work. Details that only the implementer needs go to the plan or to the pull request.
- A pull request description says what changed for its users and what the reviewer must look at. Evidence (benchmarks, screenshots, profiles) goes in its own section after the summary.
- A plan file is as long as the task needs, but it points at repository files instead of copying them.
- Delete a sentence that does not change what the reader does or decides.

## Per artifact

| Artifact | Reader | Structure |
| --- | --- | --- |
| Issue | A contributor or agent picking it up | `create-issue` skill |
| Pull request | A reviewer | `.github/PULL_REQUEST_TEMPLATE.md`, filled by the `create-pr` skill |
| RFC | The community, before the decision | `docs/contributing-workflow.md`, step 1 |
| Plan | An agent with no other context | `write-plan` skill |
| Changelog entry | A user of the package | `.agents/rules/changelog-and-versioning.md`, "Entry style" |
| Review or issue comment | The author of the change | Finding first, then the reason, then the suggestion; one comment per finding |
