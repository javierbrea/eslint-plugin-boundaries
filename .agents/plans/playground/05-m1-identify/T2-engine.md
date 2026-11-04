<!-- cspell:disable -->
# T2: the engine

Goal: `evaluate(sketch)` turns a sketch into an `Evaluation` (README, "Shared types"): the config parsed with locations, its problems placed in the text, and every file described as the plugin describes it. Pure TypeScript over `@boundaries/config` and `@boundaries/policies`, consumed through their public exports only.

Read first: `README.md` of this folder; `../05-m1-identify.md` step 2 and the open point on `rootPath`; research note 3 on #539 (`gh api repos/javierbrea/eslint-plugin-boundaries/issues/comments/6577804232 --jq .body`); `packages/config/README.md` ("Diagnostics", "Diagnostic Paths", `normalizeConfig` and its `rootPath` option) and `packages/config/AGENTS.md`; `packages/policies/README.md` (`describeEntity`); the momoa README in `packages/playground/node_modules/@humanwhocodes/momoa`; the `config` state of the mockup for how problems read (`../mockups/config-light.png`, the problems list and the lint tooltip).

## Files

- `src/engine/Engine.types.ts`: the types of the design, exactly; a change to them is a deviation the report names, because T3 to T8 build on them.
- `src/engine/ParseConfig.ts`: parses the config text with momoa (`mode: "json5"`, with ranges) into its value (momoa's `evaluate`) and its document. A syntax error, or a value that is not one object, is one `ConfigProblem` with `source: "parse"`, `level: "error"`, at the position momoa gives (a range of one character, or the whole text when momoa gives none). momoa's messages name tokens (`Unexpected token Identifier found.`), so the title says what the config accepts and the detail carries momoa's message and position, for example title `The config must be one JSON5 object with settings and rules.` and detail `Unexpected token Identifier found. (1:1)`. Keys of the root other than `settings` and `rules` are a `warning` with `source: "config"`: they are ignored.
- `src/engine/Locations.ts`: `getRangeOf(document, path)`: walks a diagnostic path down the momoa tree (object members by key, whether the key is an identifier or a string; array elements by index) and returns the range of the value node at the path. When the path stops matching, it returns the range of the deepest node it reached; `[]` is the whole root value. Offsets, line and column as `TextRange` says.
- `src/engine/Diagnostics.ts`: maps the `diagnostics` of `normalizeConfig` to `ConfigProblem`s, one per path of each diagnostic (`title`, `detail`, `level` as they come).
- `src/engine/Evaluate.ts`: `evaluate(sketch)`:
  - parses the config and calls `normalizeConfig({ settings, rules })` of `@boundaries/config` (an unparsable config is evaluated as `{ settings: {}, rules: {} }`, so that the files are still described);
  - describes every file of the tree with `describeEntity` of `@boundaries/policies` and the normalized settings. The sketch paths are relative to its root and every file is `local` (research note 1). Check the open point of the phase file: whether `normalizeConfig` needs a `rootPath` for relative paths; the session that wrote the mockup found that relative paths without `rootPath` give the same descriptions as absolute ones with it (2026-11-03); confirm it in a test;
  - fills `elementTypes`, `fileCategories` and `rules` from the parsed value and the descriptions (an element type matches a file when its `type` is in `element.types` of the file's description; a category when it is in `file.categories`); `ignored` is true when a `warning` or `error` diagnostic has a path to that descriptor;
  - sets `rulesValid` to false when a diagnostic of a rule entry says its options fail the schema (read how `config` reports it), and `configParsed`;
  - is memoized: the same sketch object returns the same `Evaluation` (a `WeakMap`), and the parse and normalization are cached by config text (the last one is enough), so that an edit of the tree does not parse the config again.
- `src/engine/index.ts`: exports `evaluate` and the types.
- Specs colocated for each file.

## The fixture test

The descriptions must be the plugin's: run the plugin once on a fixture of the quick-start example with its debug setting on (`boundaries/debug`, see `packages/config/src/Shared/Settings.types.ts` and how the plugin prints it), capture what it prints for each of the six files of `QUICK_START_FILES` (`test/browser-e2e/src/scenarios/quick-start.js`) into `src/engine/__fixtures__/quickStartDescriptions.ts` with a comment saying how it was produced (command, date, plugin version), and test that `evaluate` returns the same `element.types`, `element.path`, `element.captured`, `file.categories` and `module.origin` for each. The capture script stays out of the package (scratchpad); the comment says how to repeat it. The fixture is under `src/engine/`, so it belongs to the `engine` element and the spec imports it as an internal file; it counts for coverage, so it holds data only.

The quick-start config of this test is the one of `QUICK_START_EXAMPLE` (T1, `src/examples/QuickStart.ts`); T1 runs at the same time, so inline the settings and rules of the scenario file in the spec instead of importing the example.

## Cases the specs cover

The quick-start config (no problems, six descriptions); a syntax error (missing comma), a whole `eslint.config.js` pasted, a spread, a top-level array; the two problems of the mockup's `config` state (`patern` in the second element descriptor: a warning at `settings › boundaries/elements › 1`, line 5; `"dissallow"` as `default`: an error at `rules › boundaries/dependencies › 1 › default`, line 15 column 16 in the mockup's text), with their ranges; `rulesValid` false in that case; memoization by sketch and by config text; an unknown root key; an empty tree.
