---
paths:
  - "packages/playground/src/**/*.ts"
  - "packages/playground/src/**/*.tsx"
---

# Playground elements and components

How the files of `packages/playground/src` are organized and written. The layers, the domains and where a new element goes are in `packages/playground/AGENTS.md` ("Layering"). The import policy and the syntax guards are enforced by `packages/playground/eslint.config.mjs`, which is the ground truth over this file. Specs, page objects, mocks and test support are in `.agents/rules/playground-testing.md`.

## Files of an element

- An element is one folder with an `index.ts` that only re-exports its public API, values and types: `export { X } from "./X";`, `export type { XProps } from "./X.types";`. No logic, no `export *`, no import.
- A component file and a component element are PascalCase (`ProjectTree/ProjectTree.tsx`, `store/SessionProvider.tsx`). Every other element and file is camelCase (`helpers/sketch/tree.ts`), and hooks are `useX`.
- Sibling files of `<name>`: `<name>.types.ts` (exported types, see `.agents/rules/typescript-conventions.md`), `<name>.constants.ts`, `<name>.hooks.ts` (the React hooks of a `data` element), `<name>.pom.ts`, `<name>.spec.ts(x)` and `<name>.mock.ts(x)`. An element that holds several modules keeps one camelCase file per module (`helpers/engine/parseConfig.ts`).
- The script of a web worker is a `*.worker.ts` file of the element that creates the worker. No production file imports it: only the `new URL` of the factory names it (lint-enforced).
- The only subfolders inside an element are a module's own hooks: `modules/<Name>/hooks/<useX>/`, for a hook that only that module uses. A hook a second module needs moves to `modules/hooks/<useX>/` of the domain.

## Components

- A component file exports exactly one thing: the component, a function or `memo(...)` named as the file. Its props type goes to `<Name>.types.ts` and its constants to `<Name>.constants.ts`. Private `styled` parts stay in the file unexported. Any other function component with its own state or hooks becomes its own element.
- A literal constant that another file, a page object or a spec needs (test ids, delays, class names) lives in `<name>.constants.ts` and is re-exported from `index.ts`.
- Every molecule, organism, template, module and `app` renders `data-testid` on its root element and nowhere else, from a `<NAME>_TEST_ID` constant (`export const PROJECT_TREE_TEST_ID = "project-tree";`). Atoms have no default test id.
  - A component rendered several times at once, or rendered as the root of another component that carries its own test id, takes an optional `testId` prop that defaults to the constant.
  - A component that a library renders once per item, and so cannot receive props from its parent (the tree items that `@mui/x-tree-view` renders), renders the constant on each root, and its page object picks one by its content.
  - A component that would render a fragment of several elements wraps them in a private `styled("div")({ display: "contents" })` root that carries the test id, so its parent's layout still places the children.
  - A component whose root is one of its children, next to children that render in a portal (a module that renders a layout and a dialog), puts the test id on that child and needs no wrapper.
  - A component that renders no element of its own, such as a module that returns one of several panes (`NodePane`), has no test id: its page object finds the root of whichever pane is rendered.
- A component sits in the sub-layer its imports put it in. An atom composes no `ui` component (it may use `ui-kit` atoms), a molecule composes atoms, an organism composes molecules or organisms, and a template arranges slots (`children`, `ReactNode` props) into a layout. A lint error is fixed by moving the component to the sub-layer its imports put it in, never by importing differently to stay put.
- A module never imports `@mui/*`, never styles and never writes user-facing text: it reads the store through data hooks and module-hooks, and renders `ui` and `ui-kit` components with props and callbacks. A pane that reads the store stays `memo(...)`.
- A `ui` component never imports `data`, not even a type. A vocabulary that `data` and `ui` must agree on (`Focus`, `Target`, `ProblemsTabId`) lives in the `helpers/` of its domain.
- Helpers, data and module-hooks return facts (counts, levels, booleans, paths). `ui/helpers` turn facts into tones, icons and display text.
- A component that names no playground concept belongs to `ui-kit`. A component that needs the store is a module.
- Styling follows `packages/playground/AGENTS.md` ("Stack"): theme tokens, `theme.typography.<variant>`, and `FOCUS_RING` and `HOVER_BACKGROUND` from the theme.

## Imports

- Another element is imported through its entry with the `@/` alias for `src/`: `import { useSessionSelector } from "@/domains/session/data/store";`, never a file inside it. The exceptions are page objects, constants and mocks, which specs and page objects import by file.
- A file of the same element is imported relative and same-directory: `./tree`. Never `../`: a module imports its own hooks as `./hooks/<useX>`, their entry, and a hook imports the files of its module through `@/`.
- `import/order` groups external modules, then `@/` imports, then relative ones; `eslint --fix` sorts them.
