<!-- cspell:disable -->
# Phase 5 tasks: the M1 components

Work breakdown of the implementation part of phase 5 (`../05-m1-identify.md`, steps 2 to 4), so that each task runs in its own subagent or session. It is temporary: the PR of phase 5 deletes this folder with the phase file.

Status (2026-11-04): the mockup is approved and committed (`ed7185ab`); the setup (libraries and element types), T1 to T6 and T10 are committed. Next: T7, in progress, and then T8.

## How a task runs

A task is implemented by one agent with no other context than: this file, its task file, `../05-m1-identify.md`, `../00-shared.md` (section 6 is the interface), the mockup (`../mockups/playground.html` and its renders), `packages/playground/AGENTS.md`, `packages/playground/eslint.config.mjs` and the rules in `.agents/rules/` (`typescript-conventions.md`, `unit-testing.md`).

- It writes only the files its task names, plus words in `packages/playground/cspell.config.cjs` (read the file right before editing it: another agent may have changed it). It never edits `package.json`, `eslint.config.mjs`, `pnpm-lock.yaml` or the files of another task; if it needs a change there, it says so in its report.
- It does not commit, push or create branches; the coordinator reviews and commits each task.
- Another agent may be working in the same checkout at the same time, so it does not run Nx (two Nx runs at once rebuild the same packages) and does not run the whole test suite. The packages it depends on are already built. From `packages/playground`, after `source ~/.nvm/nvm.sh && nvm use` (Node 24):

```bash
pnpm exec jest <spec-files> --coverage=false                                      # while working
pnpm exec jest <task-folder> --collectCoverageFrom='<task-folder>/**'              # at the end: 100% of its files
pnpm exec eslint <files> --fix
pnpm exec tsc --noEmit -p tsconfig.eslint.json                                    # errors in its own files only
pnpm exec cspell --quiet <files>
```

- The coverage threshold is 100% for statements, branches, functions and lines (`jest.config.cjs`). A branch that cannot happen is removed, not ignored.
- Code and tests follow the existing files of the package as the model (`src/Playground.tsx`, `src/contract/*`, `src/theme/*`): TSDoc on every exported symbol and on internal functions, types in a colocated `*.types.ts`, `type` over `interface`, no `any`, comments that say why.
- Its report lists: the files created or changed, the public API it exports (names and signatures), every deviation from this design and why, what it could not do, and the output of the last run of each command above.

## Tasks

| Task | File | Folder | Depends on | Wave | Status |
| --- | --- | --- | --- | --- | --- |
| T1 Sketch operations and the example | `T1-sketch.md` | `src/sketch/`, `src/examples/` | setup | 1 | Done |
| T2 Engine | `T2-engine.md` | `src/engine/` | setup | 1 | Done |
| T3 UI foundation | `T3-foundation.md` | `src/theme/Theme.ts`, `src/ui/icons/`, `src/ui/common/`, `src/ui/state/Focus.types.ts` | setup | 2 | Done |
| T4 Config editor | `T4-config-editor.md` | `src/ui/config/` | T2 | 2 | Done |
| T5 Project pane | `T5-project.md` | `src/ui/project/` | T1, T3 | 3 | Done |
| T6 Node panes and inspector | `T6-node-inspector.md` | `src/ui/node/`, `src/ui/inspector/` | T2, T3, T4 | 3 | Done |
| T7 Problems panel | `T7-problems.md` | `src/ui/problems/` | T2, T3 | 4 | |
| T10 A selector that the engine cannot normalize | `T10-engine-throw.md` | `src/engine/` | T2 | 4 | Done |
| T8 Workbench, page and harness | `T8-workbench.md` | `src/ui/Workbench*`, `src/ui/state/`, `src/ui/layout/`, `src/theme/Root.tsx`, `src/Playground.tsx`, `src/index.ts`, `dev/`, the website page | all | 5 | |
| T9 Verification and PR | `T9-verification.md` | none | T8 | 6 | |

Two agents at most at a time (user rule), so a wave is two tasks. The coordinator reviews each task when it ends, commits it (`feat(#552): ...`), ticks it here and starts the next one.

## Design

### Element types

Declared in `packages/playground/eslint.config.mjs` (setup):

- `contract` (exists): `Sketch`, sources and stores.
- `sketch` (`src/sketch/`, new): pure operations on a `Sketch`: paths, the tree, edits, text mode. Imports `contract` only.
- `engine` (`src/engine/`): parses the config and describes the files with `@boundaries/config` and `@boundaries/policies`. Imports `contract` only.
- `examples` (`src/examples/`, new): sketches the playground ships with. Imports `contract` only; the entry exports them.
- `ui` (`src/ui/`): every component. Imports `contract`, `sketch`, `engine` and `theme`.
- `theme` (exists): the MUI theme and the root element.

`src/Playground.tsx` (category `app`) imports `contract`, `ui` and `theme`; `src/index.ts` (category `entry`) imports the app, `contract` and `examples`.

### Shared types

The task named in brackets creates each type; the others import it.

```ts
// src/engine/Engine.types.ts [T2]

/** A range of the config text: offsets for the editor, and the line and column of its start for the problem list */
export type TextRange = {
  readonly from: number; // offset of the first character, from 0
  readonly to: number; // offset after the last character
  readonly line: number; // line of `from`, from 1
  readonly column: number; // column of `from`, from 1
};

/** A problem of the config, placed in its text */
export type ConfigProblem = {
  readonly level: "error" | "warning" | "deprecation";
  readonly title: string; // the diagnostic title, or what the config accepts for a parse error (momoa's message goes to `detail`)
  readonly detail?: string;
  readonly path: readonly (string | number)[]; // the entry it is about, from the config object; [] for the whole config
  readonly range: TextRange; // the value at `path`; the parse position for a parse error
  readonly source: "parse" | "config";
};

/** An element descriptor of the settings, with how many files of the sketch it matches */
export type ElementTypeSummary = {
  readonly index: number; // position in settings["boundaries/elements"]
  readonly type: string; // its `type`, or `#<index>` when it has none
  readonly patterns: readonly string[];
  readonly files: number;
  readonly ignored: boolean; // a diagnostic of `config` says it is invalid and ignored
  readonly range: TextRange;
};

/** A file category of the settings, with how many files of the sketch it matches */
export type FileCategorySummary = {
  readonly index: number; // position in settings["boundaries/files"]
  readonly category: string;
  readonly patterns: readonly string[];
  readonly files: number;
  readonly range: TextRange;
};

/** A rule of the plugin in `rules` */
export type RuleSummary = {
  readonly name: string; // as written, such as `boundaries/dependencies`
  readonly policies: number; // policies of its options, 0 when it has none
  readonly valid: boolean; // its options pass the rule schema
  readonly range: TextRange;
};

/** What the engine says about a sketch */
export type Evaluation = {
  readonly sketch: Sketch;
  readonly configParsed: boolean;
  readonly problems: readonly ConfigProblem[]; // one per diagnostic path, parse problem first, in the order of `normalizeConfig`
  readonly rulesValid: boolean; // false when an entry of a rule of the plugin fails its schema: dependencies are not evaluated
  readonly files: ReadonlyMap<string, EntityDescription>; // every file of the tree, by path
  readonly elementTypes: readonly ElementTypeSummary[];
  readonly fileCategories: readonly FileCategorySummary[];
  readonly rules: readonly RuleSummary[];
  readonly rangeOf: (path: readonly (string | number)[]) => TextRange | undefined; // the value at a path of the config; phase 6 places policies with it
};
```

`EntityDescription` is the type of `@boundaries/elements` that `describeEntity` of `@boundaries/policies` returns (`element.types`, `element.path`, `element.captured`, `file.categories`, `module.origin`).

```ts
// src/sketch/Sketch.types.ts [T1] (names of the sketch element, beside the contract's Sketch)

/** A node of the tree as the project pane shows it: folders are implied by the paths of their files */
export type TreeItem = {
  readonly path: string; // the id
  readonly name: string; // last segment
  readonly kind: "file" | "folder";
  readonly children: readonly TreeItem[]; // folders first, then files, each by name
};

/** A line of text mode that could not be read */
export type TextProblem = {
  readonly line: number; // from 1
  readonly text: string;
  readonly reason: string;
};

/** The result of an edit: the new sketch, or why the edit is refused */
export type EditResult = { readonly sketch: Sketch } | { readonly error: string };
```

```ts
// src/ui/state/Focus.types.ts [T3]

/** What is in focus: nothing, the config node or a file. Phase 6 adds a dependency of the open file */
export type Focus =
  | { readonly kind: "none" }
  | { readonly kind: "config" }
  | { readonly kind: "file"; readonly path: string };

/** Problems per node of the tree, for its badge */
export type ProblemCounts = {
  readonly config: number; // problems of the config
  readonly configHasErrors: boolean; // the config node turns red
  readonly byPath: ReadonlyMap<string, number>; // failing dependencies per file and folder; empty until phase 6
};
```

### Data flow

`Playground` loads the sketch (as now) and renders `Workbench`, which owns the state: the sketch, the focus, the project view (`tree` or `text`), the selected problems tab, whether the problems panel is collapsed, and the text-mode problems. Every edit goes through a function of `src/sketch/` and produces a new `Sketch`; `Workbench` calls `evaluate` of the engine 150 ms after the last edit and passes the `Evaluation` down. Panes are presentational: they receive data and callbacks, and none of them keeps a copy of the sketch, except the draft of text mode while it has unread lines. `Playground` saves each new sketch to the store, never the loaded one.

### Phase 6 seams

Kept so that phase 6 adds to them without rewriting: `Focus` gains a dependency variant; `ProblemCounts.byPath` gets values; the problems panel takes a list of tabs; the config editor takes a `highlight` range; `Evaluation` gains the verdicts; text mode keeps the dependencies of files it does not touch.
