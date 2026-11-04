<!-- cspell:disable -->
# T5: the project pane

Goal: `ProjectPane`, the left pane: the tree of the sketch with `eslint.config.js` pinned first, add, rename and delete, and text mode, both editing the same sketch through `src/sketch/`.

Read first: `README.md` of this folder (`Focus`, `ProblemCounts`, `TreeItem`, `TextProblem`, `EditResult`); the sketch functions of T1 (`src/sketch/`, committed) and the UI foundation of T3 (`src/theme/Theme.ts`, `src/ui/icons/`, `src/ui/common/`); `../00-shared.md` section 6 ("Widgets", the tree and the switch; "Panes", the project pane; "Focus"); the mockup's `file`, `config`, `dependency` and `text` states (`../mockups/*.png` and the `.tree`, `.project-foot`, `.segmented`, `.text-mode` rules of `../mockups/playground.html`); the `RichTreeView` docs and types in `packages/playground/node_modules/@mui/x-tree-view` (label editing, item customization, selection, expansion).

## Files

- `src/ui/project/ProjectPane.types.ts`: `ProjectPaneProps = { sketch: Sketch; focus: Focus; view: "tree" | "text"; counts: ProblemCounts; capabilities: ProjectCapabilities; onViewChange: (view: "tree" | "text") => void; onSketchChange: (sketch: Sketch) => void; onFocus: (focus: Focus) => void; onTextProblems: (problems: readonly TextProblem[]) => void }`.
- `src/ui/project/ProjectPane.tsx`: the pane: `PaneHead` `Project` (with the hint `One path per line` in text mode; `· dependencies indented` comes in phase 6), the tree or the text, and the 44 px foot with `+ File`, `+ Folder` (small text buttons) and the `Tree` / `Text` switch.
- `src/ui/project/ProjectTree.tsx`: `RichTreeView` over `buildTree(sketch)`:
  - `eslint.config.js` is the first item, in `--jsb-accent` with the `{}` glyph and a separator below; it has no rename or delete. It shows `counts.config` as a badge, red when `counts.configHasErrors`.
  - Folders show their name with a trailing `/`, expand and collapse, and start expanded; files select. Selecting a file calls `onFocus({ kind: "file", path })`, the config `onFocus({ kind: "config" })`. The selected item follows `focus`.
  - A row shows its count from `counts.byPath` (empty in M1: the slot exists, phase 6 fills it) and, on hover and focus, `IconButton`s `Rename` and `Delete` (small, with tooltips; the mockup draws no row actions, so they follow the dependency lines' actions).
  - Rename edits the label in place (label editing of the tree view, or F2): the new name goes through `renameNode`; a refused name keeps the old one and shows the reason in a tooltip or helper text next to the field. Delete calls `removeNode`; a folder with files asks first in a small `Dialog` (`Delete src/ and its 6 files?`). The Delete key on a selected item does the same.
  - `+ File` and `+ Folder` add a node with `getUniquePath` in the folder of the selected item (the folder itself, the parent of a file, or the root), select it, and start renaming it.
  - When the focused file is renamed, focus follows it (`onFocus` with the new path); when it is removed, focus becomes `none`.
- `src/ui/project/TextMode.tsx`: a textarea with `toText(sketch)`: mono 12/20 px on `--jsb-paper-2` with the inset accent ring. It keeps a draft while it is focused; 300 ms after the last keystroke and on blur it runs `fromText(draft, sketch)`, calls `onSketchChange` when the sketch changes and `onTextProblems` with the problems (an empty list when there are none). Lines with problems stay in the draft until the text is valid or the view goes back to the tree, which drops them (and calls `onTextProblems([])`).
- `src/ui/project/index.ts`.
- `capabilities.editTree === false`: no `+ File`, `+ Folder`, rename or delete, and the textarea is read only.
- Specs: selecting files and the config; folders expand; rename (valid, refused); delete (file, folder with confirmation, focused file); `+ File` and `+ Folder` placement; text mode round trip through the UI (type a path, blur, `onSketchChange` gets it; an invalid line is reported and kept in the draft); read-only capabilities; the focus follows a rename.

## Notes

Widths are the workbench's (T8): this pane fills its panel. Long names cut with an ellipsis and show the full path in a `title`.
