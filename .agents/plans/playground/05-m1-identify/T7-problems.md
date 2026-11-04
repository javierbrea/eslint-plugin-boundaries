<!-- cspell:disable -->
# T7: the problems panel

Goal: `ProblemsPanel`, the bottom pane: a strip of any number of tabs with counts, a collapse button, and the problem list and notes that the tabs show; plus the functions that turn config and text problems into rows.

Read first: `README.md` of this folder (`ConfigProblem`, `TextProblem`, `Focus`); the foundation (T3: `PaneHead`, `CountBadge`, `Note`, the icons, the `MuiTabs` overrides), committed; `../00-shared.md` section 6 ("Panes": problems and the dependency tab; "Focus", which tab is selected); RFC #538, Interface decision 6 (`gh api graphql` or the discussion page: https://github.com/javierbrea/eslint-plugin-boundaries/discussions/538); the mockup's `empty`, `file`, `config` and `policy` states and the `.problems`, `.tabs`, `.tab`, `.problem`, `.problems-note` rules of `../mockups/playground.html`.

## Files

- `src/ui/problems/Problems.types.ts`:
  - `ProblemsTab = { id: string; label: string; mono?: boolean; count?: number; tone?: "bad" | "warn"; icon?: IconName }`;
  - `ProblemItem = { id: string; level: "error" | "warning" | "deprecation"; location: string; position?: string; message: string; meta: string }` (`location` `eslint.config.js`, `position` `:15:16`, the meta line `error · rules › boundaries/dependencies › 1 › default`);
  - `ProblemsPanelProps = { tabs: readonly ProblemsTab[]; selected: string; onSelect: (id: string) => void; collapsed: boolean; onCollapsedChange: (collapsed: boolean) => void; children: ReactNode }` (the body of the selected tab).
- `src/ui/problems/ProblemsPanel.tsx`: `PaneHead` `Problems` with the tabs in its end slot (MUI `Tabs`, each tab with its `CountBadge` and, for `icon`, the icon in its tone), a spacer and the collapse `IconButton` (`Collapse the problems` / `Expand the problems`, the chevron turning). Collapsed, only the head shows; the workbench resizes the panel (T8). The tab panel has `role="tabpanel"` labelled by its tab.
- `src/ui/problems/ProblemList.tsx`: `{ items: readonly ProblemItem[]; onOpen: (id: string) => void; empty: string }`: one row per item as `.problem` (icon by level: ✕ `--jsb-bad`, ▲ `--jsb-warn` for warnings and deprecations; location and position in mono; message in the body font; meta in `--jsb-muted`), each row a button that calls `onOpen`. No items shows `empty` (`No problems.`) in `--jsb-muted`.
- `src/ui/problems/Items.ts`: `getConfigProblemItems(problems)` and `getTextProblemItems(problems)` (location `Project text`, position `:<line>`, the reason as message, the line text in the meta); `getTabLabel(path)` for a file tab (the parent folder and the name, `checkout/index.js`; the name alone at the root); `getCountTone(levels)` (`bad` when any is an error).
- `src/ui/problems/index.ts`; the note is `Note` of `src/ui/common/` (the text `Dependencies are not evaluated while the rule options are invalid: ESLint does not run a rule whose options fail its schema.` is composed by T8).
- Specs: tabs render with counts and select; the selected tab follows `selected`; collapse toggles and its label changes; rows by level; `onOpen` with the id; the empty text; the item builders for the mockup's two config problems and a text problem; `getTabLabel`.
