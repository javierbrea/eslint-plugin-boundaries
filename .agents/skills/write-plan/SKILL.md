---
name: write-plan
description: Write or update an implementation plan in .agents/plans/ for work that spans several pull requests or sessions — an index plus one file per phase, each self-contained for an agent with no other context — including how the plan is shared on an integration branch, checked at the start of every phase with a preview for the maintainer, left ready for the next phase by the pull request of each phase, which deletes the file of that phase, and removed before merging into release. Use when asked to plan a feature, break an RFC or an issue into phases, write or update a plan, or start or finish a phase of an existing plan.
argument-hint: "[plan name] [phase]"
---

# Write plan

## When to use this skill

Use it for any work that needs more than one pull request, or that more than one session will implement. A single-PR task that one session implements does not need a plan: its issue is enough. Write every file with the `writing-style` skill.

## Layout

```
.agents/plans/<name>.md             index
.agents/plans/<name>/00-shared.md   facts two or more phases need (optional)
.agents/plans/<name>/NN-<phase>.md  one file per phase not merged yet
.agents/plans/<name>/<assets>       mockups, renders, data the phases need
```

`<name>` is the feature in kebab-case (`website-redesign`, `playground`). Phases are numbered in the order they are expected to run; the number of a dropped or merged phase is never reused, and the rest are not renumbered.

## Where it lives

`.agents/plans/` is git-ignored (root `AGENTS.md`) and a plan is a working document, not a committed artifact: no committed file may depend on it.

A plan that several sessions share is committed on the feature's integration branch, never on `release` or `master`:

1. Replace `.agents/plans/` in `.gitignore` with `.agents/plans/*` followed by `!.agents/plans/<name>.md` and `!.agents/plans/<name>/`, with a comment saying the plan is removed before the branch merges into `release`.
2. The last phase of the plan moves any fact that must outlive it into an `AGENTS.md`, a rule or a skill, then removes the plan and the `.gitignore` exception, in its own pull request against the integration branch, merged last.
3. A phase branch starts from the branch its pull request targets. The plan edits of a phase that targets the integration branch are commits of its own pull request, so that merging it leaves the plan ready for the next phase.
4. A phase that targets `release` never commits plan files. Its session reads the plan from the integration branch (`git show origin/<branch>:.agents/plans/<name>.md`), and its plan edits are their own commits on the integration branch (`chore(<scope>): update the <name> plan for phase N`), pushed once the maintainer approves them.

## The index

The index is what a session reads first. It holds, in this order:

- A status line with the date and what is merged, open or pending. It is rewritten at every update, never appended to.
- Where the plan lives (its integration branch) and a pointer to the "Where it lives", "Starting a phase" and "Finishing a phase" sections of this skill.
- A table of the files with "read it when".
- A table of the phases: phase, issue, branch, depends on, PR target, PR title and, once it is opened, the pull request.
- The integration plan: which branches exist, what merges where and when, and what is released or deployed by which merge. Point to `.github/CONTRIBUTING.md` for the branching model instead of restating it.
- Decisions already taken, numbered, each in one sentence with a link to where it was taken (RFC, issue, review). A session does not reopen them.
- Open questions, each with who decides it and the phase that needs the answer.

## A phase file

Written so that an agent can implement the phase with no other context than this file, the index, `00-shared.md` and the repository's own agent files. It holds:

- **Goal**: one paragraph, what exists when the phase is done.
- **Issue and PR**: the issue it closes, the branch name, the PR target and title, the changelog entries expected, what the PR description must show (screenshots, measurements, checklists).
- **Read first**: the repository files and external documents the phase depends on, each with why.
- **Preconditions**: what must be merged or decided before it starts.
- **Scope**: what is in, what is out, and what is handed to a later phase.
- **Steps**: grouped by concern, each naming the files it creates or changes and the behavior expected, in enough detail to be verified but without copying code the agent can read in the repository. Point to an existing file as the model to follow when there is one.
- **Verification**: the commands and quality gates that must pass, and how each acceptance criterion of the issue is checked.
- **Hand-offs**: facts later phases take from this one (names, interfaces, decisions to confirm). The pull request of the phase moves them to the files of those phases ("Finishing a phase").
- **Open points**: what the implementing session must decide or ask, with the default to take when nobody answers.

`00-shared.md` holds every fact that two or more phases need (environment, commands, branching, conventions specific to the plan, quality gates, definition of done). Phase files add only what is specific to them.

## Starting a phase

The pull request of the previous phase left the plan ready, so a phase starts by checking that it still holds:

1. Finish any merged or done phase that still has a file ("Finishing a phase").
2. Re-read the phase's sources (RFC, issue, the code it touches, what merged since the plan was last edited) and correct the phase file and the later phases where they no longer fit: missing steps, wrong facts, decisions now taken, scope moved, preconditions changed.
3. When the plan changes, rewrite the index status line and anything else in the index the changes affect, show the maintainer the diff with a short explanation of what changes and why, and wait for approval. Then commit it where "Where it lives" says and start the implementation.

During the phase, a deviation that changes what a later phase does is written into the index, `00-shared.md` or that phase's file, with the same preview; any other deviation goes in the pull request description. The phase's own file is not kept up to date after its implementation starts, because its pull request deletes it.

## Finishing a phase

The code, the `AGENTS.md` files and the pull request record what a phase did, so the file of a merged phase has no reader left. The pull request of a phase leaves the plan ready for the next phase, and keeps it ready through its review:

1. Each hand-off, as the implementation left it, is in the file of the phase that needs it, or in `00-shared.md` when two or more phases need it. The ones that no later phase uses are dropped.
2. Every pointer to the phase file from the other files is replaced with the fact it pointed to, or with a pointer to the code or the `AGENTS.md` that now holds it.
3. The phase file, the assets that only it used and its row in the files table of the index are deleted.
4. The status line of the index is rewritten, and the row of the phase in the phases table names its pull request. The row stays.

A phase that targets `release`, or that has no pull request (an RFC, a decision), is finished with a commit on the integration branch once it merges or the index records it as done.

## Notes

- Dates are absolute (`2026-10-25`), never relative.
- A plan names only what exists or what it creates; a renamed file or command is renamed in the index, `00-shared.md` and the files of the later phases in the same change.
- Facts that stay true after the work is done (layering, constraints, conventions) do not belong in the plan: they go to the project's `AGENTS.md`, a rule or a skill as part of the phase that establishes them, and the plan points there.
