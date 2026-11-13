import { render } from "@testing-library/react";

import type { Sketch } from "@/contract";
import type { ProblemCounts } from "@/domains/problems/helpers/problemSelectors";
import type { getProjectItems } from "@/domains/project/ui/helpers/projectItems";
import { renderInRoot } from "@/shared/testing/renderInRoot";
import type { CountBadge } from "@/ui-kit/atoms/CountBadge";
import { COUNT_BADGE_TEXT_COLORS } from "@/ui-kit/atoms/CountBadge/CountBadge.constants";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { FOCUS_RING, HOVER_BACKGROUND } from "@/ui-kit/helpers/theme";

import { ProjectTree } from "./ProjectTree";
import { ProjectTreePom } from "./ProjectTree.pom";
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
    target: undefined,
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
    onOpenMenu: jest.fn(),
    ...overrides,
  };
}

describe("ProjectTree", () => {
  describe("tree", () => {
    it("should be named Project files for assistive technology", () => {
      // Arrange
      renderInRoot(<ProjectTree {...createProps()} />);

      // Act
      const isNamedTree = new ProjectTreePom().isTreeNamed("Project files");

      // Assert
      expect(isNamedTree).toBe(true);
    });
  });

  describe("rows", () => {
    it("should set the name of a row in mono text, on a line as tall as the row", () => {
      // Arrange
      renderInRoot(<ProjectTree {...createProps()} />);

      // Act
      const { fontFamily, fontSize, lineHeight } = new ProjectTreePom().item(
        "src/index.js"
      ).row.textStyle;

      // Assert
      expect(fontFamily).toBe("var(--jsb-font-mono)");
      expect(fontSize).toBe("12.5px");
      expect(lineHeight).toBe("26px");
    });

    it("should draw the focus ring of the theme on the row, inside it", () => {
      // Arrange
      renderInRoot(<ProjectTree {...createProps()} />);

      // Act
      const style = new ProjectTreePom().item("src/index.js").focusRingStyle;

      // Assert
      expect(style).toEqual({ outline: FOCUS_RING, "outline-offset": "-2px" });
    });

    it("should highlight a row on hover with the hover of the theme", () => {
      // Arrange
      renderInRoot(<ProjectTree {...createProps()} />);

      // Act
      const style = new ProjectTreePom().item("src/index.js").row.hoverStyle;

      // Assert
      expect(style.background).toBe(HOVER_BACKGROUND);
    });

    it("should set the glyph of the config in the size of a badge, with the weight and the line height of the row", () => {
      // Arrange
      renderInRoot(<ProjectTree {...createProps()} />);

      // Act
      const { fontSize, fontWeight, lineHeight } = new ProjectTreePom().item(
        "eslint.config.js"
      ).row.glyphStyle;

      // Assert
      expect(fontSize).toBe("11px");
      expect(fontWeight).toBe("inherit");
      expect(lineHeight).toBe("inherit");
    });
  });

  describe("badges", () => {
    it("should show the failing dependencies of a folder and of a file", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([
          ["src", { count: 2, hasErrors: true }],
          ["src/index.js", { count: 1, hasErrors: true }],
        ]),
      };
      render(<ProjectTree {...createProps({ counts })} />);

      const tree = new ProjectTreePom();

      // Act
      const folderRow = tree.item("src").row;
      const fileBadge = tree
        .item("src/index.js")
        .row.badge("1 failing dependency");

      // Assert
      expect(folderRow.badge("2 failing dependencies").count).toBe("2");
      expect(folderRow.badgeNames).toEqual(["2 failing dependencies"]);
      expect(fileBadge.count).toBe("1");
      expect(fileBadge.color).toBe(COUNT_BADGE_TEXT_COLORS.bad);
    });

    it("should mark a file with failures with its name in red and a cross", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([["src/index.js", { count: 1, hasErrors: true }]]),
      };
      render(<ProjectTree {...createProps({ counts })} />);

      const tree = new ProjectTreePom();

      // Act
      const failing = tree.item("src/index.js").row;
      const passing = tree.item("index.js").row;

      // Assert
      expect(failing.isBad).toBe(true);
      expect(failing.tagName).toBe("DIV");
      expect(failing.iconPaths).toContain(ICON_PATHS.cross);
      expect(passing.isBad).toBe(false);
      expect(passing.iconPaths).not.toContain(ICON_PATHS.cross);
    });

    it("should not turn a folder with failures red", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([["src", { count: 1, hasErrors: true }]]),
      };
      render(<ProjectTree {...createProps({ counts })} />);

      // Act
      const folderRow = new ProjectTreePom().item("src").row;

      // Assert
      expect(folderRow.isBad).toBe(false);
    });

    it("should draw no badge on a node that has no failures", () => {
      // Arrange
      render(<ProjectTree {...createProps()} />);

      // Act
      const badges = new ProjectTreePom().badgeNames;

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
      const badge = new ProjectTreePom()
        .item("eslint.config.js")
        .row.badge("3 problems");
      const red = badge.color;

      // Act
      rerender(
        <ProjectTree
          {...createProps({ counts: { ...counts, configHasErrors: false } })}
        />
      );
      const warn = badge.color;

      // Assert
      expect(red).toBe(COUNT_BADGE_TEXT_COLORS.bad);
      expect(warn).toBe(COUNT_BADGE_TEXT_COLORS.warn);
    });
  });

  describe("items", () => {
    let spy: jest.SpiedFunction<typeof getProjectItems>;

    beforeEach(() => {
      // The tree reads the function from the module each time it renders
      spy = jest.spyOn(
        jest.requireActual<{ getProjectItems: typeof getProjectItems }>(
          "@/domains/project/ui/helpers/projectItems/projectItems"
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
      expect(new ProjectTreePom().item("docs").isRendered).toBe(true);
    });

    it("should list the config first and the folders before the files, each by name", () => {
      // Arrange
      render(<ProjectTree {...createProps()} />);

      // Act
      const tree = new ProjectTreePom();
      const { itemCount, itemPaths, itemNames } = tree;

      // Assert
      expect(itemCount).toBe(6);
      expect(itemPaths).toEqual([
        "eslint.config.js",
        "src",
        "src/components",
        "src/components/Button.js",
        "src/index.js",
        "index.js",
      ]);
      expect(itemNames).toEqual([
        "eslint.config.js",
        "src/",
        "components/",
        "Button.js",
        "index.js",
        "index.js",
      ]);
    });

    it("should keep the path of the item whose node is being renamed", () => {
      // Arrange
      render(<ProjectTree {...createProps({ renaming: "src/index.js" })} />);

      // Act
      const { itemPaths } = new ProjectTreePom();

      // Assert
      expect(itemPaths).toEqual([
        "eslint.config.js",
        "src",
        "src/components",
        "src/components/Button.js",
        "src/index.js",
        "index.js",
      ]);
    });

    it("should list only the items of the open folders", () => {
      // Arrange
      render(
        <ProjectTree
          {...createProps({ collapsed: new Set(["src/components"]) })}
        />
      );

      // Act
      const { itemCount, itemPaths } = new ProjectTreePom();

      // Assert
      expect(itemCount).toBe(5);
      expect(itemPaths).not.toContain("src/components/Button.js");
    });

    it("should hide the children of the folders that are closed", () => {
      // Arrange
      const props = createProps({ collapsed: new Set(["src/components"]) });

      // Act
      render(<ProjectTree {...props} />);
      const tree = new ProjectTreePom();

      // Assert
      expect(tree.item("src/components/Button.js").isRendered).toBe(false);
      expect(tree.item("src/index.js").isRendered).toBe(true);
    });
  });

  describe("target", () => {
    it("should outline and tag the item that the dependency in focus points to", () => {
      // Arrange
      renderInRoot(
        <ProjectTree {...createProps({ target: "src/index.js" })} />
      );
      const tree = new ProjectTreePom();

      // Act
      const { isTarget, targetTag, targetStyle } =
        tree.item("src/index.js").row;

      // Assert
      expect(isTarget).toBe(true);
      expect(targetTag).toBe("target");
      expect(targetStyle).toEqual({
        outline: "1px dashed var(--jsb-accent)",
        outlineOffset: "-1px",
      });
    });

    it("should write the tag in the mono text of 10.5 px", () => {
      // Arrange
      renderInRoot(
        <ProjectTree {...createProps({ target: "src/index.js" })} />
      );
      const tree = new ProjectTreePom();

      // Act
      const { fontFamily, fontSize, fontWeight } =
        tree.item("src/index.js").row.targetTagStyle;

      // Assert
      expect(fontFamily).toBe("var(--jsb-font-mono)");
      expect(fontSize).toBe("10.5px");
      expect(fontWeight).toBe("400");
    });

    it("should outline no other item", () => {
      // Arrange
      renderInRoot(
        <ProjectTree {...createProps({ target: "src/index.js" })} />
      );
      const tree = new ProjectTreePom();

      // Act
      const others = [
        "eslint.config.js",
        "src",
        "src/components",
        "src/components/Button.js",
        "index.js",
      ].map((path) => tree.item(path).row.isTarget);

      // Assert
      expect(others).toEqual([false, false, false, false, false]);
    });

    it("should outline no item while no dependency is in focus", () => {
      // Arrange
      renderInRoot(<ProjectTree {...createProps()} />);
      const tree = new ProjectTreePom();

      // Act
      const targets = ["src/index.js", "index.js"].map(
        (path) => tree.item(path).row.isTarget
      );

      // Assert
      expect(targets).toEqual([false, false]);
    });

    it("should move the outline when the dependency in focus changes", () => {
      // Arrange
      const props = createProps({ target: "src/index.js" });
      const { rerender } = render(<ProjectTree {...props} />);
      const tree = new ProjectTreePom();

      // Act
      rerender(<ProjectTree {...props} target="index.js" />);

      // Assert
      expect(tree.item("src/index.js").row.isTarget).toBe(false);
      expect(tree.item("index.js").row.isTarget).toBe(true);
    });
  });

  describe("menu", () => {
    it("should ask for the menu of the root where the pointer is on a right click on its empty space, in place of the menu of the browser", () => {
      // Arrange
      const props = createProps();
      renderInRoot(<ProjectTree {...props} />);

      // Act
      const isPrevented = new ProjectTreePom().rightClickEmptySpace({
        x: 50,
        y: 300,
      });

      // Assert
      expect(isPrevented).toBe(true);
      expect(props.onOpenMenu).toHaveBeenCalledTimes(1);
      expect(props.onOpenMenu).toHaveBeenCalledWith(
        { kind: "folder", path: "" },
        { top: 300, left: 50 }
      );
    });

    it("should ask only for the menu of the node on a right click on its row", () => {
      // Arrange
      const props = createProps();
      renderInRoot(<ProjectTree {...props} />);

      // Act
      new ProjectTreePom().item("src").row.rightClickName({ x: 20, y: 40 });

      // Assert
      expect(props.onOpenMenu).toHaveBeenCalledTimes(1);
      expect(props.onOpenMenu).toHaveBeenCalledWith(
        { kind: "folder", path: "src" },
        { top: 40, left: 20 }
      );
    });

    it("should keep the menu of the browser on its empty space when nodes cannot be edited", () => {
      // Arrange
      const props = createProps({ editable: false });
      renderInRoot(<ProjectTree {...props} />);

      // Act
      const isPrevented = new ProjectTreePom().rightClickEmptySpace();

      // Assert
      expect(isPrevented).toBe(false);
      expect(props.onOpenMenu).not.toHaveBeenCalled();
    });

    it("should keep the menu of the browser on the row of the config", () => {
      // Arrange
      const props = createProps();
      renderInRoot(<ProjectTree {...props} />);

      // Act
      const isPrevented = new ProjectTreePom()
        .item("eslint.config.js")
        .row.rightClickName();

      // Assert
      expect(isPrevented).toBe(false);
      expect(props.onOpenMenu).not.toHaveBeenCalled();
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
          "@/ui-kit/atoms/CountBadge/CountBadge"
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
        new ProjectTreePom().item("eslint.config.js").row.badge().count
      ).toBe("2");
    });
  });
});
