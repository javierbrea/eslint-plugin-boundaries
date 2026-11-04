<!-- cspell:disable -->
# T1: sketch operations and the quick-start example

Goal: pure functions over a `Sketch` that the project pane and the workbench call for every edit, text mode included, and the default sketch of the playground. No React, no DOM.

Read first: `README.md` of this folder (design, shared types, how a task runs); `packages/playground/src/contract/Sketch.types.ts`; `../00-shared.md` section 6 ("Panes", the project pane and text mode); the `text` state of the mockup (`../mockups/text-light.png`).

## Files

- `src/sketch/Sketch.types.ts`: `TreeItem`, `TextProblem`, `EditResult` as the design says.
- `src/sketch/Paths.ts`: `CONFIG_PATH = "eslint.config.js"`; `normalizePath(input)` (trims, turns `\` into `/`, collapses repeated `/`, drops a leading `./` or `/`; a trailing `/` marks a folder and is returned apart: `{ path, isFolder }`); `getPathError(path)` (the reason a path is invalid, or `undefined`: empty, an empty, `.` or `..` segment, a control character, or `eslint.config.js` at the root, which is the config node); `getParentPath`, `getName`.
- `src/sketch/Tree.ts`: `buildTree(sketch)` returns the root `TreeItem`s: folders are implied by the files under them, and a `folder` node of the sketch adds an empty folder; folders first, then files, each sorted by name with `localeCompare(…, "en", { numeric: true, sensitivity: "base" })`. `getFiles(sketch)` returns the file paths, sorted. `hasNode(sketch, path)`.
- `src/sketch/Edit.ts`, each returning an `EditResult` and never changing its input:
  - `addNode(sketch, path, kind)`: refuses an invalid path, an existing node, a path under a file, and a file where a folder exists. Adding a file under an empty folder node removes that folder node (the file implies it).
  - `renameNode(sketch, path, newPath)`: renames a file or a folder; a folder moves everything under it. The `from` of the dependencies and the `path` of their `node` targets follow. Refuses what `addNode` refuses at the new path, and renaming a folder into itself.
  - `removeNode(sketch, path)`: removes a file, or a folder and everything under it. Dependencies from or to a removed file are removed (phase 6 may keep the ones to it as broken).
  - `setConfig(sketch, config)`: replaces the config text.
  - `getUniquePath(sketch, folder, base)`: the first free `base`, `base-2`, `base-3`… in a folder, for `+ File` (`new-file.js`) and `+ Folder` (`new-folder`).
- `src/sketch/TextMode.ts`:
  - `toText(sketch)`: `eslint.config.js` as the first line, then one line per file and per empty folder (with a trailing `/`), sorted by full path as the mockup's `text` state shows, ending with a newline. No dependency lines in M1.
  - `fromText(text, sketch)`: returns `{ sketch, problems }`. Blank lines and the `eslint.config.js` line are skipped; every other line goes through `normalizePath` and `getPathError`; a line indented with spaces or tabs is a problem ("Dependencies are not written in text mode yet"); a duplicate, an invalid path, or a path under a file is a problem with its line number, and is left out. The new tree is made of the valid lines; the config is kept; dependencies are kept when their `from` and their `node` target are still in the tree.
  - `fromText(toText(sketch), sketch)` returns a sketch equal to the input (same files and folders, same config, same dependencies) for any valid sketch: test it with the quick-start example and with sketches with empty folders.
- `src/sketch/index.ts`: exports the above.
- `src/examples/Example.types.ts`: `Example = { id: string; title: string; sketch: Sketch }`.
- `src/examples/QuickStart.ts`: `QUICK_START_EXAMPLE` (`id: "quick-start"`, `title: "Quick start"`): the six files of `QUICK_START_FILES` in `test/browser-e2e/src/scenarios/quick-start.js`, no dependencies (phase 6 adds them), and as config the JSON5 text of the final config of `packages/website/docs/quick-start.mdx` reduced to `{ settings, rules }`: its comments kept, unquoted keys as the mockup's `config` state shows them (`../mockups/playground.html`, the `editor` block, without the two typos of that state), no spread of the recommended rules. A test checks that its parsed value deep-equals `QUICK_START_SETTINGS` and `QUICK_START_RULES` of that scenario, parsed with `@humanwhocodes/momoa` in `json5` mode and its `evaluate` function (read the momoa README in `node_modules/@humanwhocodes/momoa`). The expected values are inlined in the spec with a comment naming the scenario file: a relative import out of `src/` is a lint error (`checkUnknownLocals`).
- `src/examples/index.ts`: exports `QUICK_START_EXAMPLE`, the `Example` type and `EXAMPLES` (`[QUICK_START_EXAMPLE]`, the list phase 7's picker shows).
- Specs colocated: `Paths.spec.ts`, `Tree.spec.ts`, `Edit.spec.ts`, `TextMode.spec.ts`, `QuickStart.spec.ts`.

## Not in this task

The entry (`src/index.ts`) and the hosts pass the example in T8. Error messages are short sentences for the user, in English, ending with a period.
