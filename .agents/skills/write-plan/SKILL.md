---
name: write-plan
description: Write or update an implementation plan in .agents/plans/ for work that spans several pull requests or sessions — an index plus one file per phase, each self-contained for an agent with no other context — including how the plan is shared on an integration branch, removed before merging into release, and re-analyzed and updated at the start of every phase with a preview for the maintainer. Use when asked to plan a feature, break an RFC or an issue into phases, write or update a plan, or start a phase of an existing plan.
argument-hint: "[plan name] [phase]"
---

# Write plan

## When to use this skill

Use it for any work that needs more than one pull request, or that more than one session will implement. A single-PR task that one session implements does not need a plan: its issue is enough. Write every file with the `writing-style` skill.

## Layout

```
.agents/plans/<name>.md             index
.agents/plans/<name>/00-shared.md   facts two or more phases need (optional)
.agents/plans/<name>/NN-<phase>.md  one file per phase
.agents/plans/<name>/<assets>       mockups, renders, data the phases need
```

`<name>` is the feature in kebab-case (`website-redesign`, `playground`). Phases are numbered in the order they are expected to run; a phase that is dropped keeps its number out of the sequence rather than renumbering the rest.

## Where it lives

`.agents/plans/` is git-ignored (root `AGENTS.md`) and a plan is a working document, not a committed artifact: no committed file may depend on it.

A plan that several sessions share is committed on the feature's integration branch, never on `release` or `master`:

1. Replace `.agents/plans/` in `.gitignore` with `.agents/plans/*` followed by `!.agents/plans/<name>.md` and `!.agents/plans/<name>/`, with a comment saying the plan is removed before the branch merges into `release`.
2. The last phase of the plan moves any fact that must outlive it into an `AGENTS.md`, a rule or a skill, then removes the plan and the `.gitignore` exception, in its own pull request against the integration branch, merged last.
3. Plan edits are their own commits on the integration branch (`chore(<scope>): update the <name> plan after phase N`), pushed so that every session sees them, never only on a phase branch.
4. A phase branch starts from the branch its pull request targets. A phase that targets `release` never commits plan files; its session reads the plan from the integration branch (`git show origin/<branch>:.agents/plans/<name>.md`).

## The index

The index is what a session reads first. It holds, in this order:

- A status line with the date and what is merged, open or pending. It is rewritten at every update, never appended to.
- Where the plan lives (its integration branch) and a pointer to the "Where it lives" and "Starting a phase" sections of this skill.
- A table of the files with "read it when".
- A table of the phases: phase, issue, branch, depends on, PR target and title.
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
- **Hand-offs**: facts later phases take from this one (names, interfaces, decisions to confirm).
- **Open points**: what the implementing session must decide or ask, with the default to take when nobody answers.

`00-shared.md` holds every fact that two or more phases need (environment, commands, branching, conventions specific to the plan, quality gates, definition of done). Phase files add only what is specific to them.

## Starting a phase

The first task of every phase is to bring the plan up to date, because what earlier phases found changes what later ones must do:

1. Re-read the phase's sources (RFC, issue, the code it touches, what the previous phases' pull requests recorded) and extend or correct the phase file: missing steps, wrong facts, decisions that are now taken.
2. Check that the later phases still fit, and adjust them: scope moved, preconditions changed, hand-offs renamed.
3. Rewrite the index status line and anything in the index the changes affect.
4. Show the maintainer the diff of the plan with a short explanation of what changes and why, and wait for approval. Nothing of the plan is committed before it.
5. Commit the approved edit on the integration branch and push it, then start the implementation on the phase branch.

During the phase, a deviation from the plan is recorded in the pull request description and in the plan (same procedure: preview, then commit on the integration branch). The next phase starts from a plan that is already true.

## Notes

- Dates are absolute (`2026-10-25`), never relative.
- A plan names only what exists or what it creates; a renamed file or command is renamed in the plan in the same change.
- Facts that stay true after the work is done (layering, constraints, conventions) do not belong in the plan: they go to the project's `AGENTS.md`, a rule or a skill as part of the phase that establishes them, and the plan points there.
