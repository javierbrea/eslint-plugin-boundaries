---
paths:
  - "packages/playground/src/**/*.spec.ts"
  - "packages/playground/src/**/*.spec.tsx"
  - "packages/playground/src/**/*.pom.ts"
  - "packages/playground/src/**/*.mock.ts"
  - "packages/playground/src/**/*.mock.tsx"
  - "packages/playground/src/**/*.constants.ts"
  - "packages/playground/src/shared/testing/**"
---

# Playground tests and page objects

The tests of `packages/playground/src` reach the DOM only through page objects, so a spec reads as behavior and the queries of a component live in one place. The structure of a test (Arrange, Act, Assert, `describe` per component, `it`) is in `.agents/rules/unit-testing.md`; the files and layers of an element are in `.agents/rules/playground-components.md`. The import limits and the syntax guards below are enforced by `packages/playground/eslint.config.mjs`.

## The page object base

`src/shared/testing/pom` exports the base every page object extends (`Pom`) and `FixturePom`, the page object of the probe markup of a spec. Its TSDoc documents every member and option; read it before writing a page object. The facts that decide how to write one:

- The `PomOptions` select the root element: a `testId`, a `name`, an `index`, a text it is `containing`, a `parent`, an explicit `root` or `portal` for an overlay outside the parent. The root is resolved on every access and never cached.
- A composite takes `defaultTestId` from its constants file. An atom sets `defaultTestId = ""` and overrides `findRoot()` to find its root by role and name, or by text, within `searchBase`, passing the candidates through `pickMatch(...)` so that `index` and `containing` still apply; `findRootBySelector(...)` does that for a CSS selector.
- A child is built with `childPom(Ctor, options)`, which sets the parent.

## Page objects

- Every `ui-kit`, `ui`, module and `app` component has `<Name>.pom.ts` exporting `class <Name>Pom extends Pom`.
- Getters read state and child page objects (`get rows()`, `get isCollapsed()`); methods act (`open(index)`, `rename(name)`). Actions use `fireEvent`, and `act` when timers are involved. The package does not use `@testing-library/user-event`. Getters and methods return plain values (strings, booleans, numbers, child page objects), so specs assert on values.
- A page object of a part of a component that is not an element (a tab, a row) lives in that component's `.pom.ts`, is built by the component's page object with `childPom`, and is exported only as a type (`export type { ProblemRowPom };` of a class that is not exported), so no other page object builds it over the whole document.
- A page object never repeats a query that another element's page object owns: it composes that page object with `this.childPom(ChildPom, options)`. A chain stays at two or three levels; a parent may expose a shortcut for a grandchild it uses often.
- MUI overlays render inside the playground root (`packages/playground/AGENTS.md`, "Stack"), so a page object uses `portal: true` only when the overlay is outside its parent's root.
- Style assertions go through page object getters, which read `getComputedStyle` and use `src/shared/testing/emittedStyle` only for the rules that apply on hover or focus. A spec never reads CSS itself.
- A page object, a constants file or a mock of another element is imported by file (`@/ui-kit/atoms/Icon/Icon.pom`), never through a barrel: barrels are production code. Production code never imports a page object.

Illustrative composite, with the names of the project tree:

```ts
// src/domains/project/ui/organisms/ProjectTree/ProjectTree.pom.ts
import { ProjectTreeItemPom } from "@/domains/project/ui/molecules/ProjectTreeItem/ProjectTreeItem.pom";
import { Pom } from "@/shared/testing/pom";

import { PROJECT_TREE_TEST_ID } from "./ProjectTree.constants";

export class ProjectTreePom extends Pom {
  protected readonly defaultTestId = PROJECT_TREE_TEST_ID;

  get itemCount(): number {
    return this.childPom(ProjectTreeItemPom).count;
  }

  item(path: string): ProjectTreeItemPom {
    return this.childPom(ProjectTreeItemPom, { name: path });
  }
}
```

## Specs

- A spec mounts with `render`, `renderInRoot` (`src/shared/testing/renderInRoot`) or `renderInSession` (`src/domains/session/data/store/store.mock.tsx`), builds page objects and asserts on what they return. It never imports `screen`, `within` or `fireEvent`, never takes `container` or a query from `render()`, and never calls `document.querySelector`. `render`, `renderHook`, `act`, `waitFor` and Jest's timers are allowed.
- The specs under `helpers/`, `data/`, `contexts/` and `hooks/` folders, `src/shared/testing/` and `src/contract/` test no component, so they are exempt by path. They may drive probe components, through `FixturePom` when they render one.
- A spec never asserts the value its page object used to find the root (a text, a role name, a test id constant), since that check cannot fail; it asserts something the component produced. A landmark or a named role is checked by its accessible name, not by its `aria-label` attribute.
- A spec of a module renders its real children inside `renderInSession`: it does not `jest.mock` a child module. A component's spec covers its own props, and a module's spec keeps the cases that need the store.
- jsdom has no `Worker`: `jest.setup.cjs` installs one that runs the script of the evaluation worker in the thread of the tests and answers before `postMessage` returns, so a spec sees the evaluation of its sketch as soon as it renders. A spec that needs an evaluation to wait, be late, stop or fail holds or fails the workers with `src/shared/testing/inlineWorker` and Jest's fake timers, through the helpers of `src/domains/session/data/store/store.mock.tsx`.
- `jest.mock` and `jest.requireActual` take the `@/` path of the module.
- Mocks (`<name>.mock.ts(x)`) live in the element they wrap and are imported only by specs: lint fails a page object, another mock or production code that imports one.
- Barrels, page objects, mocks and `src/shared/testing` are left out of coverage in `packages/playground/jest.config.cjs`; everything else stays at 100%.

Illustrative spec of the page object above, where `PROPS` holds the props of a tree with a file at `index.js`:

```tsx
// src/domains/project/ui/organisms/ProjectTree/ProjectTree.spec.tsx
import { renderInRoot } from "@/shared/testing/renderInRoot";

import { ProjectTree } from "./ProjectTree";
import { ProjectTreePom } from "./ProjectTree.pom";

describe("ProjectTree", () => {
  describe("when the sketch has a file at index.js", () => {
    it("should render an item for it", () => {
      // Arrange
      renderInRoot(<ProjectTree {...PROPS} />);
      const tree = new ProjectTreePom();

      // Act
      const { isRendered } = tree.item("index.js");

      // Assert
      expect(isRendered).toBe(true);
    });
  });
});
```
