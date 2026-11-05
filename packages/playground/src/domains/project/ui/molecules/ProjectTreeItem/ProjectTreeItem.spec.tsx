import { RichTreeView } from "@mui/x-tree-view/RichTreeView";
import { act, render } from "@testing-library/react";
import type { ReactNode } from "react";

import type { Sketch } from "@/contract";
import type { ProblemCounts } from "@/domains/problems/helpers/problemSelectors";
import { ProjectTreeProvider } from "@/domains/project/ui/contexts/ProjectTreeContext";
import type { ProjectTreeContextValue } from "@/domains/project/ui/contexts/ProjectTreeContext";
import {
  getFolderIds,
  getProjectItems,
} from "@/domains/project/ui/helpers/projectItems";
import type { ProjectItem } from "@/domains/project/ui/helpers/projectItems";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { ProjectTreeItem } from "./ProjectTreeItem";
import { ProjectTreeItemPom } from "./ProjectTreeItem.pom";

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

/** What a spec gets from the tree it renders. */
type Page = {
  /** What the items take from the tree, with the spies of its handlers. */
  context: ProjectTreeContextValue;
  /** The spy of the selection of the tree view, which an item reaches by its click. */
  onSelect: jest.Mock<void, [string | null]>;
  /** Renders the tree again with another value of the context. */
  update: (changes: Partial<ProjectTreeContextValue>) => void;
  /** Removes the tree from the page. */
  unmount: () => void;
};

/**
 * Creates the page object of an item.
 * @param path The path of its node, or `eslint.config.js` for the config.
 * @returns The page object.
 */
function item(path: string): ProjectTreeItemPom {
  return new ProjectTreeItemPom({ name: path });
}

/**
 * Renders the tree view of the sketch with the items of the project tree, as `ProjectTree` does, and nothing else around them.
 * @param changes What differs from a tree whose nodes can be edited, with no problems and no node being renamed.
 * @param isOpen Whether the folders are open.
 * @returns The context, the spies and the functions that update the tree.
 */
function renderItems(
  changes: Partial<ProjectTreeContextValue> = {},
  isOpen = true
): Page {
  const items = getProjectItems(TREE);
  const onSelect = jest.fn<void, [string | null]>();
  const initial: ProjectTreeContextValue = {
    counts: NO_COUNTS,
    editable: true,
    renaming: undefined,
    focusRequest: undefined,
    onFocusDone: jest.fn(),
    onRename: jest.fn(),
    onRenameCommit: jest.fn(),
    onRenameCancel: jest.fn(),
    onDelete: jest.fn(),
    ...changes,
  };
  const tree = (context: ProjectTreeContextValue): ReactNode => (
    <ProjectTreeProvider value={context}>
      <RichTreeView<ProjectItem, false>
        aria-label="Items under test"
        items={items}
        slots={{ item: ProjectTreeItem }}
        expandedItems={isOpen ? getFolderIds(items) : []}
        onSelectedItemsChange={(_event, id) => onSelect(id)}
      />
    </ProjectTreeProvider>
  );
  const { rerender, unmount } = render(tree(initial));

  return {
    context: initial,
    onSelect,
    update: (next) => rerender(tree({ ...initial, ...next })),
    unmount,
  };
}

describe("ProjectTreeItem", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("item", () => {
    it("should be named by its own row, and not by the items inside it", () => {
      // Arrange
      renderItems();

      // Act
      const labels = ["eslint.config.js", "src", "src/index.js"].map(
        (path) => item(path).label
      );

      // Assert
      expect(labels).toEqual(["eslint.config.js", "src/", "index.js"]);
    });

    it("should set the kind of its node", () => {
      // Arrange
      renderItems();

      // Act
      const kinds = ["eslint.config.js", "src", "src/index.js"].map(
        (path) => item(path).kind
      );

      // Assert
      expect(kinds).toEqual(["config", "folder", "file"]);
    });

    it("should mark only the config with a glyph", () => {
      // Arrange
      renderItems();

      // Act
      const glyphs = ["eslint.config.js", "src", "src/index.js"].map(
        (path) => item(path).row.hasGlyph
      );

      // Assert
      expect(glyphs).toEqual([true, false, false]);
    });

    it("should draw a chevron that points down on an open folder, and none on a file", () => {
      // Arrange
      renderItems({ editable: false });

      // Act
      const folder = item("src").row.iconPaths;
      const file = item("src/index.js").row.iconPaths;

      // Assert
      expect(folder).toEqual([ICON_PATHS["chevron-down"]]);
      expect(file).toEqual([]);
    });

    it("should draw a chevron that points right on a closed folder", () => {
      // Arrange
      renderItems({ editable: false }, false);

      // Act
      const { iconPaths } = item("src").row;

      // Assert
      expect(iconPaths).toEqual([ICON_PATHS["chevron-right"]]);
    });
  });

  describe("counts", () => {
    it("should count the problems of the config, and say so to assistive technology", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 2,
        configHasErrors: false,
        byPath: new Map(),
      };
      renderItems({ counts });

      // Act
      const { row } = item("eslint.config.js");

      // Assert
      expect(row.badgeLabels).toEqual(["2 problems"]);
      expect(row.badge().count).toBe("2");
    });

    it("should say problem, not problems, for one", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 1,
        configHasErrors: false,
        byPath: new Map(),
      };
      renderItems({ counts });

      // Act
      const { badgeLabels } = item("eslint.config.js").row;

      // Assert
      expect(badgeLabels).toEqual(["1 problem"]);
    });

    it("should count the failing dependencies of a file and of a folder", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([
          ["src", 3],
          ["src/index.js", 1],
        ]),
      };
      renderItems({ counts });

      // Act
      const folder = item("src").row;
      const file = item("src/index.js").row;

      // Assert
      expect(folder.badgeLabels).toEqual(["3 failing dependencies"]);
      expect(folder.badge().count).toBe("3");
      expect(file.badgeLabels).toEqual(["1 failing dependency"]);
      expect(file.badge().count).toBe("1");
    });

    it("should draw no badge on a node without problems or failing dependencies", () => {
      // Arrange
      renderItems({ editable: false });

      // Act
      const labels = ["eslint.config.js", "src", "src/index.js"].map(
        (path) => item(path).row.badgeLabels
      );

      // Assert
      expect(labels).toEqual([[], [], []]);
    });

    it("should draw a cross on a file with failing dependencies, and not on a folder", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([
          ["src", 1],
          ["src/index.js", 1],
        ]),
      };
      renderItems({ counts, editable: false });

      // Act
      const file = item("src/index.js").row.iconPaths;
      const folder = item("src").row.iconPaths;

      // Assert
      expect(file).toEqual([ICON_PATHS.cross]);
      expect(folder).not.toContain(ICON_PATHS.cross);
    });

    it("should draw the row of a failing file in red, and the row of the config only when it has errors", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 1,
        configHasErrors: true,
        byPath: new Map([["src/index.js", 1]]),
      };
      const page = renderItems({ counts });
      const redFile = item("src/index.js").row.isBad;
      const redConfigWithErrors = item("eslint.config.js").row.isBad;

      // Act
      page.update({ counts: { ...counts, configHasErrors: false } });

      // Assert
      expect(redFile).toBe(true);
      expect(redConfigWithErrors).toBe(true);
      expect(item("eslint.config.js").row.isBad).toBe(false);
    });
  });

  describe("editable", () => {
    it("should offer to rename and to remove a file or a folder, with an icon each", () => {
      // Arrange
      renderItems();

      // Act
      const file = item("src/index.js");
      const folder = item("src");

      // Assert
      expect(file.row.buttonLabels).toEqual([
        "Rename src/index.js",
        "Delete src/index.js",
      ]);
      expect(file.row.iconPaths).toEqual([ICON_PATHS.edit, ICON_PATHS.trash]);
      expect(folder.row.buttonLabels).toEqual(["Rename src", "Delete src"]);
    });

    it("should announce the keys that rename and remove, on a file and on a folder", () => {
      // Arrange
      renderItems();

      // Act
      const shortcuts = ["src", "src/index.js"].map(
        (path) => item(path).keyShortcuts
      );

      // Assert
      expect(shortcuts).toEqual(["F2 Delete", "F2 Delete"]);
    });

    it("should offer nothing on the config, which can be neither renamed nor removed", () => {
      // Arrange
      renderItems();

      // Act
      const config = item("eslint.config.js");

      // Assert
      expect(config.row.buttonLabels).toEqual([]);
      expect(config.keyShortcuts).toBeNull();
    });

    it("should offer nothing when nodes cannot be edited", () => {
      // Arrange
      renderItems({ editable: false });

      // Act
      const file = item("src/index.js");

      // Assert
      expect(file.row.buttonLabels).toEqual([]);
      expect(file.keyShortcuts).toBeNull();
    });
  });

  describe("rename", () => {
    it("should ask to rename the node with F2", () => {
      // Arrange
      const { context } = renderItems();

      // Act
      item("src/index.js").pressKey("F2");

      // Assert
      expect(context.onRename).toHaveBeenCalledTimes(1);
      expect(context.onRename).toHaveBeenCalledWith("src/index.js");
    });

    it("should ask to rename the node with a double click on its name", () => {
      // Arrange
      const { context } = renderItems();

      // Act
      item("src/index.js").row.doubleClickName();

      // Assert
      expect(context.onRename).toHaveBeenCalledTimes(1);
      expect(context.onRename).toHaveBeenCalledWith("src/index.js");
    });

    it("should ask to rename the node with its action, without selecting it", () => {
      // Arrange
      const { context, onSelect } = renderItems();

      // Act
      item("src/index.js").renameAction.press();

      // Assert
      expect(context.onRename).toHaveBeenCalledTimes(1);
      expect(context.onRename).toHaveBeenCalledWith("src/index.js");
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("should not ask to rename the config", () => {
      // Arrange
      const { context } = renderItems();

      // Act
      item("eslint.config.js").pressKey("F2");
      item("eslint.config.js").row.doubleClickName();

      // Assert
      expect(context.onRename).not.toHaveBeenCalled();
    });

    it("should not ask to rename a node when nodes cannot be edited", () => {
      // Arrange
      const { context } = renderItems({ editable: false });

      // Act
      item("src/index.js").pressKey("F2");
      item("src/index.js").row.doubleClickName();

      // Assert
      expect(context.onRename).not.toHaveBeenCalled();
    });

    it("should not ask to rename the node when the key comes from an action of its row", () => {
      // Arrange
      const { context } = renderItems();

      // Act
      item("src/index.js").renameAction.pressKey("F2");

      // Assert
      expect(context.onRename).not.toHaveBeenCalled();
    });

    it("should not ask to rename a folder when the key comes from an item inside it", () => {
      // Arrange
      const { context } = renderItems();

      // Act
      item("src/index.js").pressKey("F2");

      // Assert
      expect(context.onRename).toHaveBeenCalledTimes(1);
      expect(context.onRename).not.toHaveBeenCalledWith("src");
    });

    it("should replace the name with the field while the node is renamed", () => {
      // Arrange
      renderItems({ renaming: "src/index.js" });

      // Act
      const { field, row } = item("src/index.js");

      // Assert
      expect(field.value).toBe("index.js");
      expect(row.buttonLabels).toEqual([]);
      expect(item("index.js").field.isRendered).toBe(false);
    });

    it("should give the rename of a folder the name without its slash", () => {
      // Arrange
      renderItems({ renaming: "src/components" });

      // Act
      const { field } = item("src/components");

      // Assert
      expect(field.value).toBe("components");
      expect(field.selection).toEqual({ start: 0, end: 10 });
    });

    it("should report the name that was typed, and giving up", () => {
      // Arrange
      const { context } = renderItems({ renaming: "src/index.js" });
      const { field } = item("src/index.js");
      field.type("main.js");

      // Act
      field.pressKey("Enter");
      field.pressKey("Escape");

      // Assert
      expect(context.onRenameCommit).toHaveBeenCalledWith(
        "src/index.js",
        "main.js"
      );
      expect(context.onRenameCancel).toHaveBeenCalledTimes(1);
    });
  });

  describe("remove", () => {
    it("should ask to remove the node with Delete", () => {
      // Arrange
      const { context } = renderItems();

      // Act
      item("src").pressKey("Delete");

      // Assert
      expect(context.onDelete).toHaveBeenCalledTimes(1);
      expect(context.onDelete).toHaveBeenCalledWith("src");
    });

    it("should ask to remove the node with its action, without selecting it", () => {
      // Arrange
      const { context, onSelect } = renderItems();

      // Act
      item("src/index.js").deleteAction.press();

      // Assert
      expect(context.onDelete).toHaveBeenCalledTimes(1);
      expect(context.onDelete).toHaveBeenCalledWith("src/index.js");
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("should not ask to remove the config", () => {
      // Arrange
      const { context } = renderItems();

      // Act
      item("eslint.config.js").pressKey("Delete");

      // Assert
      expect(context.onDelete).not.toHaveBeenCalled();
    });

    it("should not ask to remove a node when nodes cannot be edited", () => {
      // Arrange
      const { context } = renderItems({ editable: false });

      // Act
      item("src/index.js").pressKey("Delete");

      // Assert
      expect(context.onDelete).not.toHaveBeenCalled();
    });

    it("should not ask to remove the node for another key", () => {
      // Arrange
      const { context } = renderItems();

      // Act
      item("src/index.js").pressKey("a");

      // Assert
      expect(context.onDelete).not.toHaveBeenCalled();
    });
  });

  describe("keyboard focus", () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    /** Lets the timer that the item sets after it mounts or after the request changes. */
    function settle(): void {
      act(() => {
        jest.runOnlyPendingTimers();
      });
    }

    it("should take the keyboard focus when it is requested and nobody has it, and say it is done", () => {
      // Arrange
      const { context } = renderItems({ focusRequest: "src/index.js" });

      // Act
      settle();

      // Assert
      expect(item("src/index.js").isFocused).toBe(true);
      expect(context.onFocusDone).toHaveBeenCalledTimes(1);
    });

    it("should not take the keyboard focus from the element the user moved it to, but say it is done", () => {
      // Arrange
      const page = renderItems();
      item("index.js").focus();
      page.update({ focusRequest: "src/index.js" });

      // Act
      settle();

      // Assert
      expect(item("index.js").isFocused).toBe(true);
      expect(item("src/index.js").isFocused).toBe(false);
      expect(page.context.onFocusDone).toHaveBeenCalledTimes(1);
    });

    it("should leave the other items alone", () => {
      // Arrange
      renderItems({ focusRequest: "src/index.js" });

      // Act
      settle();

      // Assert
      expect(item("index.js").isFocused).toBe(false);
      expect(item("src").isFocused).toBe(false);
    });

    it("should not ask for the keyboard focus when nothing requests it", () => {
      // Arrange
      const { context } = renderItems();

      // Act
      settle();

      // Assert
      expect(context.onFocusDone).not.toHaveBeenCalled();
    });

    it("should drop the request when the item goes before the timer runs", () => {
      // Arrange
      const { context, unmount } = renderItems({
        focusRequest: "src/index.js",
      });
      unmount();

      // Act
      settle();

      // Assert
      expect(context.onFocusDone).not.toHaveBeenCalled();
    });
  });
});
