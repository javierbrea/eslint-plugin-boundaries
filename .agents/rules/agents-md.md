---
paths:
  - "**/AGENTS.md"
  - "**/CLAUDE.md"
  - ".agents/rules/**/*.md"
  - ".agents/skills/**/*.md"
  - ".agents/agents/**/*.md"
  - ".claude/rules/**/*.md"
  - ".claude/skills/**/*.md"
  - ".claude/agents/**/*.md"
---

# Writing agent configuration

This covers every file that configures an agent: `AGENTS.md` (and the `CLAUDE.md` that loads it), rules, skills and subagent definitions. These files are loaded into the context of sessions that have not started yet, so a line only pays for itself if it changes what a **future** agent does — and every line added dilutes the ones already there.

## For every agent file

- **It is not an ADR.** No decision record, no alternatives considered, no "we chose X over Y", no change history. Keep a rationale clause only where an agent that did not know the reason would undo the rule — one clause, never a paragraph; anything longer goes in the commit message, the PR, or the code it explains.
- **It is not a status report.** Nothing about what exists "today", what is not scaffolded yet, or what is still pending. Such notes go stale silently and keep reading as normative. Write only what stays true after the next refactor.
- **It does not restate the code.** Point at a folder or file instead of listing its contents, exports or rules, and let the agent read it. For lint, state the intent in one line and point at the `eslint.config.*` that enforces it.
- **It does not reconcile itself with another document.** If two files' rules appear to conflict, reword the rules so they do not, instead of adding a section explaining why the conflict is fine.
- **Each fact lives in one file.** The others point to it by path. Before adding a fact, search `AGENTS.md` and `.agents/` for it.
- **It names only what exists.** Every path, command, setting and tool it mentions is real. A change that renames or removes one updates the agent files that name it in the same change.
- **It uses a plain register.** State the rule and, when it is not obvious, its reason. No `CRITICAL`, `MUST ALWAYS` or "this is a mandatory requirement": emphasis on some rules makes the rest read as optional.
- **It is normative and checkable.** Every statement is a rule ("source may never import `test` files"), never advice ("consider…").
- **It changes by rewriting.** Rewrite the affected section rather than appending a caveat to it — growth by accretion is what turns these files into ADRs.

## `AGENTS.md`

Keep each project's file **under 200 lines**; past that, something in it belongs in one of the tiers below.

### What belongs here — and what belongs elsewhere

An `AGENTS.md` holds a project's own layering, its hard constraints, and the entry points an agent needs to find its way: what is left after the other tiers take theirs. Before adding a section, check it is not one of these:

- **A convention governing a nameable set of files** (a naming pattern, a layer's import rules, a test shape) → a `.agents/rules/*.md` with a `paths` glob. If the scope can be written as a glob it is a rule, not an `AGENTS.md` section — and a rule only loads for the files it governs.
- **Architecture that spans projects** (the dependency graph between packages) → the `repo-architecture` skill. **The release procedure** → `.github/CONTRIBUTING.md`, run by the `release` skill. **Long-form reference material** (a rule's full documented behavior, an ADR, the contributing workflow) → `docs/`.
- **Why one specific file is written the way it is** → that file's own TSDoc or comments, with at most a one-line pointer to it from here. If the code is self-explanatory enough, the comment is unnecessary; if it is not, the comment belongs in the code, not here.

### Editing one

Every `CLAUDE.md` is a one-line `@AGENTS.md` import, so edit `AGENTS.md`.

## Rules

A rule file holds one convention. Its `paths` glob matches that convention's real scope, and the text never claims a different scope than the glob.

## Skills

- The front matter `description` says what the skill does and when to use it, because it is what decides whether the skill loads.
- Exact step lists are for fragile operations (git, releases, publishing). Otherwise state the outcomes and let the agent choose the steps.
- Examples are varied and labeled illustrative, so an agent does not read one as the complete set.

## Subagents

- `model:` uses an alias (`opus`, `sonnet`, `haiku`), never a pinned model ID.
- `tools:` lists only tools a subagent receives; see <https://code.claude.com/docs/en/sub-agents.md> and <https://code.claude.com/docs/en/tools-reference.md>. `TodoWrite` and `ExitPlanMode` are not available to subagents by default.
- The body never contradicts the front matter: an agent that "never edits" gets no `Write` or `Edit`.
