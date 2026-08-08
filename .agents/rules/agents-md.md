---
paths:
  - "**/AGENTS.md"
  - "**/CLAUDE.md"
---

# Writing an `AGENTS.md`

An `AGENTS.md` is loaded in full into the context of a session that has not started yet, so a line only pays for itself if it changes what a **future** agent does — and every line added dilutes the ones already there. Keep each project's file **under 200 lines**; past that, something in it belongs in one of the tiers below.

## What belongs here — and what belongs elsewhere

An `AGENTS.md` holds a project's own layering, its hard constraints, and the entry points an agent needs to find its way: what is left after the other tiers take theirs. Before adding a section, check it is not one of these:

- **A convention governing a nameable set of files** (a naming pattern, a layer's import rules, a test shape) → a `.agents/rules/*.md` with a `paths` glob. If the scope can be written as a glob it is a rule, not an `AGENTS.md` section — and a rule only loads for the files it governs.
- **Architecture that spans projects** (the dependency graph between packages, the release flow) → the `repo-architecture` skill. **Long-form reference material** (a rule's full documented behavior, an ADR, the contributing workflow) → `docs/`.
- **Why one specific file is written the way it is** → that file's own TSDoc or comments, with at most a one-line pointer to it from here. If the code is self-explanatory enough, the comment is unnecessary; if it is not, the comment belongs in the code, not here.

## Never in an `AGENTS.md`

- **It is not an ADR.** No decision record, no alternatives considered, no "we chose X over Y", no change history. Keep a rationale clause only where an agent that did not know the reason would undo the rule — one clause, never a paragraph; anything longer goes in the commit message, the PR, or the code it explains.
- **It is not a status report.** Nothing about what exists "today", what is not scaffolded yet, or what is still pending. Such notes go stale silently and keep reading as normative. Write only what stays true after the next refactor.
- **It does not restate the code.** No exhaustive list of a folder's files, a module's exports, or a config's every rule — name the file and let the agent read it. Same for lint: state the intent in one line and point at the `eslint.config.*` that enforces it.
- **It does not reconcile itself with another document.** If two files' rules appear to conflict, reword the rules so they do not, instead of adding a section explaining why the conflict is fine.

## Editing one

Rewrite the affected section rather than appending a caveat to it — growth by accretion is what turns these files into ADRs. Every statement is normative and checkable ("source may never import `test` files"), never advisory ("consider…"). `CLAUDE.md` is a symlink to `AGENTS.md` everywhere, so always edit `AGENTS.md`.
