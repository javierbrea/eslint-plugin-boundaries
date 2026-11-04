import { render, screen as view, within } from "@testing-library/react";

import type { Sketch } from "../../contract";
import type { CountBadge } from "../common";
import type { ProblemCounts } from "../state";

import type { getProjectItems } from "./ProjectItems";
import { ProjectTree } from "./ProjectTree";
import type { ProjectTreeProps } from "./ProjectTree.types";

const TREE: Sketch["tree"] = [
  { path: "src/components/Button.js", kind: "file" },
  { path: "src/index.js", kind: "file" },
  { path: "index.js", kind: "file" },
];

const NO_COUNTS: ProblemCounts = {
  config: 0,
  configHasErrors: false,
  byPath: new Map(),
};

/**
 * Creates the props of the tree, with stable handlers as the project pane gives them.
 * @param overrides What differs from an editable tree with no problems and nothing selected.
 * @returns The props.
 */
function createProps(
  overrides: Partial<ProjectTreeProps> = {}
): ProjectTreeProps {
  return {
    tree: TREE,
    counts: NO_COUNTS,
    editable: true,
    selectedId: null,
    collapsed: new Set(),
    renaming: undefined,
    focusRequest: undefined,
    onFocusDone: jest.fn(),
    onSelect: jest.fn(),
    onToggle: jest.fn(),
    onRename: jest.fn(),
    onRenameCommit: jest.fn(),
    onRenameCancel: jest.fn(),
    onDelete: jest.fn(),
    ...overrides,
  };
}

/**
 * Gets the item of the tree that has a node's name.
 * @param path The path of the node.
 * @returns The element of the item.
 */
function getItem(path: string): HTMLElement {
  return view.getByTitle(path).closest("[role='treeitem']") as HTMLElement;
}

describe("ProjectTree", () => {
  describe("badges", () => {
    it("should show the failing dependencies of a folder and of a file", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([
          ["src", 2],
          ["src/index.js", 1],
        ]),
      };
      render(<ProjectTree {...createProps({ counts })} />);

      // Act
      const folderBadge = within(getItem("src")).getAllByRole("img", {
        name: "2 failing dependencies",
      });
      const fileBadge = within(getItem("src/index.js")).getByRole("img", {
        name: "1 failing dependency",
      });

      // Assert
      expect(folderBadge.map((badge) => badge.textContent)).toEqual(["2"]);
      expect(fileBadge.textContent).toBe("1");
      expect(getComputedStyle(fileBadge).color).toBe("var(--jsb-bad)");
    });

    it("should mark a file with failures with its name in red and a cross", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([["src/index.js", 1]]),
      };
      render(<ProjectTree {...createProps({ counts })} />);

      // Act
      const failing = getItem("src/index.js");
      const passing = getItem("index.js");

      // Assert
      expect(failing.querySelector("[data-bad]")?.tagName).toBe("DIV");
      expect(failing.querySelector("svg")).not.toBeNull();
      expect(passing.querySelector("[data-bad]")).toBeNull();
    });

    it("should not turn a folder with failures red", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([["src", 1]]),
      };
      render(<ProjectTree {...createProps({ counts })} />);

      // Act
      const folderRow = getItem("src").firstElementChild;

      // Assert
      expect(folderRow?.hasAttribute("data-bad")).toBe(false);
    });

    it("should draw no badge on a node that has no failures", () => {
      // Arrange
      render(<ProjectTree {...createProps()} />);

      // Act
      const badges = view.queryAllByRole("img");

      // Assert
      expect(badges).toEqual([]);
    });

    it("should show the problems of the config, in red only when it has errors", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 3,
        configHasErrors: true,
        byPath: new Map(),
      };
      const { rerender } = render(<ProjectTree {...createProps({ counts })} />);
      const red = getComputedStyle(
        within(getItem("eslint.config.js")).getByRole("img", {
          name: "3 problems",
        })
      ).color;

      // Act
      rerender(
        <ProjectTree
          {...createProps({ counts: { ...counts, configHasErrors: false } })}
        />
      );
      const warn = getComputedStyle(
        within(getItem("eslint.config.js")).getByRole("img", {
          name: "3 problems",
        })
      ).color;

      // Assert
      expect(red).toBe("var(--jsb-bad)");
      expect(warn).toBe("var(--jsb-warn)");
    });
  });

  describe("items", () => {
    let spy: jest.SpiedFunction<typeof getProjectItems>;

    beforeEach(() => {
      // The tree reads the function from the module each time it renders
      spy = jest.spyOn(
        jest.requireActual<{ getProjectItems: typeof getProjectItems }>(
          "./ProjectItems"
        ),
        "getProjectItems"
      );
    });

    afterEach(() => {
      spy.mockRestore();
    });

    it("should build the items once for the same tree, however many times it renders", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ProjectTree {...props} />);

      // Act
      rerender(<ProjectTree {...props} />);
      rerender(<ProjectTree {...props} selectedId="index.js" />);

      // Assert
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(TREE);
    });

    it("should build the items again when the tree changes", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ProjectTree {...props} />);

      // Act
      rerender(
        <ProjectTree
          {...props}
          tree={[...TREE, { path: "docs", kind: "folder" }]}
        />
      );

      // Assert
      expect(spy).toHaveBeenCalledTimes(2);
      expect(view.getByTitle("docs")).toBeTruthy();
    });

    it("should hide the children of the folders that are closed", () => {
      // Arrange
      const props = createProps({ collapsed: new Set(["src/components"]) });

      // Act
      render(<ProjectTree {...props} />);

      // Assert
      expect(view.queryByTitle("src/components/Button.js")).toBeNull();
      expect(view.getByTitle("src/index.js")).toBeTruthy();
    });
  });

  describe("context", () => {
    const counts: ProblemCounts = {
      config: 1,
      configHasErrors: false,
      byPath: new Map(),
    };
    let badge: jest.SpiedFunction<typeof CountBadge>;

    beforeEach(() => {
      // An item that has a problem draws one badge each time it renders, which is the only trace of a render that a test can count
      badge = jest.spyOn(
        jest.requireActual<{ CountBadge: typeof CountBadge }>(
          "../common/CountBadge"
        ),
        "CountBadge"
      );
    });

    afterEach(() => {
      badge.mockRestore();
    });

    it("should not render the items again when it renders with the same props", () => {
      // Arrange
      const props = createProps({ counts });
      const { rerender } = render(<ProjectTree {...props} />);
      const drawn = badge.mock.calls.length;

      // Act
      rerender(<ProjectTree {...props} />);

      // Assert
      expect(drawn).toBeGreaterThan(0);
      expect(badge).toHaveBeenCalledTimes(drawn);
    });

    it("should render the items again when what they show changes", () => {
      // Arrange
      const props = createProps({ counts });
      const { rerender } = render(<ProjectTree {...props} />);
      const drawn = badge.mock.calls.length;

      // Act
      rerender(<ProjectTree {...props} counts={{ ...counts, config: 2 }} />);

      // Assert
      expect(badge.mock.calls.length).toBeGreaterThan(drawn);
      expect(
        within(getItem("eslint.config.js")).getByRole("img").textContent
      ).toBe("2");
    });
  });
});
