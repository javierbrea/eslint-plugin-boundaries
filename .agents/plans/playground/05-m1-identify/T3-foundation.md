<!-- cspell:disable -->
# T3: UI foundation

Goal: the look that every pane shares, in place before the panes: the MUI theme overrides of `00-shared.md` section 6, the icons, three small shared components and the focus types. After this task, a pane that uses an MUI `Button`, `IconButton`, `Tooltip`, `Tabs`, `ToggleButtonGroup`, `Dialog` or `TextField` gets the mockup's look without styling it.

Read first: `README.md` of this folder; `../00-shared.md` section 6 ("Type", "Color", "Icons", "Widgets"); the mockup's CSS (`../mockups/playground.html`, the `.btn`, `.icon-btn`, `.segmented`, `.tab`, `.dialog`, `.field`, `.pane-head`, `.count`, `.problems-note` rules and the `<symbol>` icons) and its renders; `packages/playground/src/theme/Theme.ts`, `Root.tsx` and `packages/playground/AGENTS.md` ("Stack": styles follow the color scheme through CSS only, never `useTheme().palette`); decision 15 of `../../playground.md`.

## Files

- `src/theme/Theme.ts`: extends `createPlaygroundTheme` (keep everything it does):
  - typography: base 13 px body; buttons 600 12.5 px with no text transform;
  - `MuiButtonBase`: no ripple; a visible focus ring on `:focus-visible` (2 px `--jsb-accent` outline, 2 px offset) for every button, tab and toggle;
  - `MuiButton`: 30 px tall, `size="small"` 26 px, radius `--jsb-radius`; outlined, contained and text variants as section 6 says; disabled at 45% opacity;
  - `MuiIconButton`: 30×30 by default (top bar), `size="small"` 24×24 with a 4 px radius (row actions); hover `--jsb-accent-soft`;
  - `MuiTooltip`: background `--jsb-ink`, text `--jsb-paper`, body 12 px, 4 px radius, 4×8 px padding, no arrow;
  - `MuiTabs` / `MuiTab`: 34 px tall, 2 px `--jsb-accent` indicator, 500 12.5 px with no transform, selected `--jsb-ink`, others `--jsb-muted`, 12 px side padding, no minimum width;
  - `MuiToggleButtonGroup` / `MuiToggleButton`: the `.segmented` look (22 px buttons, 2 px group padding, `--jsb-line` border, selected `--jsb-accent-soft` with `--jsb-accent`);
  - `MuiDialog` and `MuiPaper`: `--jsb-card`, 1 px `--jsb-line`, radius `--jsb-radius-xl` for dialogs, no elevation overlay in the dark scheme (`backgroundImage: none`), the backdrop colors of section 6;
  - `MuiOutlinedInput` / `MuiInputBase`: mono 12.5 px, 1 px `--jsb-line-strong`, `--jsb-accent` with a 3 px `--jsb-accent-soft` ring when focused, as the `.field` rule; the dense size the tree's rename field uses (20 px tall).
  Values are `var(--jsb-*)` strings; nothing reads the palette at runtime.
- `src/ui/icons/Icon.types.ts` and `Icon.tsx`: `<Icon name="check" size={14} />`, `IconName` the union of the 15 names of section 6 ("Icons"), the paths of the mockup's symbols, `aria-hidden` unless a `label` is given (then `role="img"` and `aria-label`).
- `src/ui/common/PaneHead.tsx`: the 34 px head: `label`, optional `path` (mono, ellipsis, `title` with the full path), optional `hint`, optional `end` slot (buttons, tabs).
- `src/ui/common/CountBadge.tsx`: the 18 px pill, `count` and `tone: "bad" | "warn"`, with an `aria-label` such as `2 problems` passed by the caller.
- `src/ui/common/Note.tsx`: the dashed note with the info icon (`.problems-note`).
- `src/ui/common/index.ts`, `src/ui/icons/index.ts`.
- `src/ui/state/Focus.types.ts`: `Focus` and `ProblemCounts` as the design says.
- Specs: the theme (the overrides are present, the root scoping still works: the existing `src/Playground.spec.tsx` keeps passing), the icon (every name renders a path, the label variant), the three components.

## Checks

The theme must not leak out of the root (the existing tests in `src/Playground.spec.tsx` check the scoping; run them). Every color is a token (section 6, "Color").
