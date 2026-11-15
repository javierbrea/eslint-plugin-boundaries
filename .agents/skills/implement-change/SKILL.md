---
name: implement-change
description: Runs a change of the code from its goal to its review — the main session agrees it with the user and coordinates, a coder subagent implements each task, and other subagents review it before it is shown. Use for every change of the code, the tests or the configs of the repository, whoever asks for it and however small
---

# Implement a change

## When to use

For every change of a file under `packages/`, `examples/`, `support/`, `test/`, `scripts/`, `.github/workflows/` or `.husky/`, or of a config at the root. A release is run by the `release` skill instead.

## Sizing the change

| The change | Size | Designed by | Agreed with the user | Reviewed by |
| --- | --- | --- | --- | --- |
| Stays inside one element of one project, after a pattern the project already has | Contained | The main session | Only what the request leaves open | `reviewer` |
| Crosses a boundary between projects or between the elements of one, after an existing pattern | Architectural | `architect` | Always, as [`references/agreeing-the-change.md`](references/agreeing-the-change.md) says | `reviewer` and `architecture-reviewer` |
| Adds a package, an element type, a public export, an entry point, a dependency between packages or a pattern, or changes an invariant or a decision of the plan | Architectural and new | `architect`, then `skeptic` | Always, the same way | `reviewer` and `architecture-reviewer` |

- **When in doubt, the change is of the larger size.**
- **A contained change that turns out to cross a boundary stops**, and starts again as architectural.

## Who does what

- **The main session coordinates the whole change** and keeps its context, which no subagent sees. It delegates the code, never the judgment of the design, and does not write the code itself.
- **A subagent sees only its brief.** Whatever it needs from the conversation goes in it.
- **A `coder` never commits and never decides a placement.** The other subagents edit nothing.
- **Only the main session commits**, what passed its review, and only when the user or the plan asks for it. Before each commit, `git diff --cached --name-only` lists only the files intended.

## Procedure

1. **Understand the change.** Read the request, the phase of the plan when the session belongs to one, and the `AGENTS.md` of each project the change touches. Size it.
2. **Agree it.** An architectural change follows [`references/agreeing-the-change.md`](references/agreeing-the-change.md): no code is written before the user approves its goal, its design and how it is accepted. A contained one is placed by the session after the `AGENTS.md` of its project, and the user is asked only what the request leaves open.
   - Either way, this step ends with the goal, how the change is accepted, and a list of tasks, each with its files, the interfaces it crosses and its tests. The `CHANGELOG.md` entries that `.agents/rules/changelog-and-versioning.md` requires belong to the tasks.
3. **Implement it.** Delegate each task to a `coder`, with the brief below. Two tasks run at once only when they share no file and neither of their projects depends on the other; the others run in the order of the design.
4. **Read what each coder returns.** A deviation from the brief is accepted with its reason or sent back. A question is answered from the docs or taken to the user, never guessed.
5. **Run the checks**: `pnpm nx affected -t check:all --base=<the branch the change started from>`; `pnpm lint` and `pnpm check:spell` at the root, which no Nx target runs; and, for each changed source file of a package with `test:mutation`, specs excluded, the run scoped to it that `.agents/rules/mutation-testing.md` gives. A failing check goes back to a `coder`, and so does each surviving mutant, until it is killed or commented as that rule says.
6. **Review the whole change yourself**, reading its full diff against the design:
   - Each file is where the design placed it, and the change crosses only the interfaces of the design.
   - Nothing changed outside the tasks, such as a script or a broken behavior left behind by a coder.
   - The agent docs and the `README.md` of each project touched are still true, or are updated now.
7. **Have it reviewed** by the subagents its size asks for, at once, each with what the change is for, how it is accepted, its design and the range of the diff. Never give them what the coder concluded or what you expect them to find.
8. **Check each finding before acting on it**, yours included, as "Checking a finding" says.
9. **Fix what is true.** Send the true findings to a `coder`, each with its evidence, run the checks of step 5 again, and have the reviewer that raised each one review only what the fix changed.
   - Stop after the third round that still leaves a `blocking` finding, and tell the user what is left and why it does not converge.
10. **Check each item of how it is accepted.**
11. **Report** what "The report" lists.

## The brief of a coder

- **The goal**, and what it is for, in two sentences.
- **The files to create or edit**, each with its project and its element, and the example to copy as a path.
- **The interfaces the task crosses**, with their exact shape.
- **What it must not touch**, such as the files of a task that runs at once.
- **The tests**: each behavior to cover, and each existing test to rewrite or move.
- **A folder of its own for scripts and temporary files**, outside the repository, so that coders running at once never share one.
- **How it is accepted**: the commands that must pass.
- **In a round of fixes**: each finding with its `file:line` and its evidence.

## Checking a finding

A finding is a claim about the code, and whoever raises it can be wrong. Check it by the cheapest way that can show it false:

| The finding says | Check it by |
| --- | --- |
| The code does something wrong | A test or a command that shows the wrong result |
| A rule or an invariant is broken | Reading the rule, and the line that breaks it |
| A boundary is crossed | The lint of the project, or its `eslint.config.*` when the lint cannot see it |
| A test proves nothing | Breaking the behavior and running the test |
| A case is not handled | Running that case |
| A library or a tool behaves in some way | Its source, its types or a run of it, never what it is known for |

Each finding ends as one of three:

- **True**: it goes to the round of fixes, or changes the design.
- **False**: it is dropped, and kept with its evidence for the report.
- **A matter of taste, or a change of what was agreed**: decided from the docs when they settle it, and asked to the user when they do not.

- **A check that changes a file is undone**, such as a behavior broken to try a test.
- **Never drop a finding because fixing it is expensive**, and never fix one that was not checked.

## The report

- **What changed**, by project, and the design decisions behind it.
- **Each item of how it is accepted, with its result.**
- **The findings fixed**, and those dropped, each with its evidence.
- **The checks run, with their real result.**
- **What is left**: what could not be checked, what was found outside the change, and what waits for the user.
