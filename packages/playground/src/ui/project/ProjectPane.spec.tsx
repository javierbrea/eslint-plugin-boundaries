import {
  act,
  fireEvent,
  render,
  screen as view,
  waitFor,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";
import { useState } from "react";
import type { ReactNode } from "react";

import type { ProjectCapabilities, Sketch } from "../../contract";
import type { Focus, ProblemCounts } from "../state/Focus.types";

import { ProjectPane } from "./ProjectPane";
import type { ProjectPaneProps, ProjectView } from "./ProjectPane.types";

const SKETCH: Sketch = {
  config: "{ settings: {}, rules: {} }",
  tree: [
    { path: "src/components/Button.js", kind: "file" },
    { path: "src/components/Price.js", kind: "file" },
    { path: "src/index.js", kind: "file" },
    { path: "index.js", kind: "file" },
  ],
  dependencies: [
    {
      from: "src/index.js",
      target: { kind: "node", path: "src/components/Button.js" },
      syntax: "import",
      importKind: "value",
      specifiers: [],
    },
    {
      from: "index.js",
      target: { kind: "external", name: "react" },
      syntax: "import",
      importKind: "value",
      specifiers: [],
    },
  ],
};

const NO_FOCUS: Focus = { kind: "none" };

const NO_COUNTS: ProblemCounts = {
  config: 0,
  configHasErrors: false,
  byPath: new Map(),
};

const EDITABLE: ProjectCapabilities = {
  editTree: true,
  editDependencies: true,
  editConfig: true,
};

const READ_ONLY: ProjectCapabilities = {
  editTree: false,
  editDependencies: false,
  editConfig: false,
};

/** The callbacks of the pane, to see what it asked for */
type Spies = {
  onViewChange: jest.Mock<void, [ProjectView]>;
  onSketchChange: jest.Mock<void, [Sketch]>;
  onFocus: jest.Mock<void, [Focus]>;
  onTextProblems: jest.Mock;
};

/**
 * Creates the callbacks of the pane.
 * @returns Spies that do nothing.
 */
function createSpies(): Spies {
  return {
    onViewChange: jest.fn(),
    onSketchChange: jest.fn(),
    onFocus: jest.fn(),
    onTextProblems: jest.fn(),
  };
}

/**
 * Creates the props of the pane, with spies for its callbacks.
 * @param overrides What differs from an editable pane that shows the tree with nothing in focus.
 * @returns The props.
 */
function createProps(
  overrides: Partial<Omit<ProjectPaneProps, keyof Spies>> = {}
): ProjectPaneProps & Spies {
  return {
    sketch: SKETCH,
    focus: NO_FOCUS,
    view: "tree",
    counts: NO_COUNTS,
    capabilities: EDITABLE,
    ...createSpies(),
    ...overrides,
  };
}

/** What the harness starts with */
type HarnessProps = {
  spies: Spies;
  sketch?: Sketch;
  focus?: Focus;
  view?: ProjectView;
  counts?: ProblemCounts;
};

/**
 * Holds the sketch, the focus and the view as the workbench does, so that an edit shows in the next render, and reports each change to the spies.
 * @param props The first state, and the spies.
 * @param props.spies
 * @param props.sketch
 * @param props.focus
 * @param props.view
 * @param props.counts
 * @returns The pane.
 */
function Harness({
  spies,
  sketch: firstSketch = SKETCH,
  focus: firstFocus = NO_FOCUS,
  view: firstView = "tree",
  counts = NO_COUNTS,
}: Readonly<HarnessProps>): ReactNode {
  const [sketch, setSketch] = useState(firstSketch);
  const [openNode, setOpenNode] = useState(firstFocus);
  const [projectView, setProjectView] = useState(firstView);

  return (
    <ProjectPane
      sketch={sketch}
      focus={openNode}
      view={projectView}
      counts={counts}
      capabilities={EDITABLE}
      onSketchChange={(next) => {
        spies.onSketchChange(next);
        setSketch(next);
      }}
      onFocus={(next) => {
        spies.onFocus(next);
        setOpenNode(next);
      }}
      onViewChange={(next) => {
        spies.onViewChange(next);
        setProjectView(next);
      }}
      onTextProblems={spies.onTextProblems}
    />
  );
}

/**
 * Reads the paths of the files and folders of the tree the pane shows, in order.
 * @returns The `title` of each row but the config's: the path of its node.
 */
function getPaths(): (string | null)[] {
  return view
    .getAllByRole("treeitem")
    .slice(1)
    .map(
      (item) => item.querySelector("[title]")?.getAttribute("title") ?? null
    );
}

/**
 * Gets the row of a node.
 * @param path The path of the node.
 * @returns The element of the row that shows the node: its name.
 */
function getRow(path: string): HTMLElement {
  return view.getByTitle(path);
}

/**
 * Gets the item of the tree that has a node's name.
 * @param path The path of the node.
 * @returns The element of the item.
 */
function getItem(path: string): HTMLElement {
  return getRow(path).closest("[role='treeitem']") as HTMLElement;
}

/**
 * Gets the field that renames a node.
 * @param path The path of the node being renamed.
 * @returns The field.
 */
function getField(path: string): HTMLInputElement {
  return view.getByRole("textbox", {
    name: `New name of ${path}`,
  }) as HTMLInputElement;
}

/**
 * Gets the item whose name is being edited.
 * @param path The path of the node being renamed.
 * @returns The element of the item, which holds the field in place of the name.
 */
function getRenamingItem(path: string): HTMLElement {
  return view
    .getByRole("textbox", { name: `New name of ${path}` })
    .closest("[role='treeitem']") as HTMLElement;
}

/**
 * Types a name in the field that renames a node.
 * @param path The path of the node being renamed.
 * @param typed What to type.
 * @returns The field.
 */
function typeName(path: string, typed: string): HTMLElement {
  const field = getField(path);

  fireEvent.change(field, { target: { value: typed } });
  return field;
}

/**
 * Moves the keyboard focus out of the tree, to the button of the Tree view, as a click or the Tab key outside the tree does. `fireEvent.blur` only dispatches the event and never moves the focus, so it cannot tell where the focus ends.
 * @returns The element that has the focus now.
 */
function moveFocusAway(): HTMLElement {
  const other = view.getByRole("button", { name: "Tree" });

  act(() => other.focus());
  return other;
}

/**
 * Waits until the focus is on an element, which is when the tree took it back after the rename or the dialog went. The focus is on the body until then.
 */
async function waitForFocus(): Promise<void> {
  await waitFor(() => expect(document.activeElement).not.toBe(document.body));
}

/**
 * Lets the timers that are already set run. An item takes the keyboard back one task after a rename, to see where the focus went, so a test that expects it to stay where the user put it waits for that task.
 */
async function settleFocus(): Promise<void> {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

/**
 * Opens the confirmation dialog of a folder the way a keyboard user does: the item of the folder has the focus, and Delete is pressed.
 * @param path The path of the folder.
 */
function askToDelete(path: string): void {
  act(() => getItem(path).focus());
  fireEvent.keyDown(getItem(path), { key: "Delete" });
}

/**
 * Gets the paths of the nodes of a sketch.
 * @param sketch The sketch.
 * @returns The path of each node of its tree.
 */
function getTreePaths(sketch: Sketch): string[] {
  return sketch.tree.map((node) => node.path);
}

/**
 * Gets the latest sketch a spy received.
 * @param spy The spy of `onSketchChange`.
 * @returns The sketch.
 */
function getLastSketch(spy: Spies["onSketchChange"]): Sketch {
  return spy.mock.calls[spy.mock.calls.length - 1][0];
}

describe("ProjectPane", () => {
  describe("tree", () => {
    it("should name the pane Project", () => {
      // Arrange
      render(<ProjectPane {...createProps()} />);

      // Act
      const pane = view.getByRole("region", { name: "Project" });

      // Assert
      expect(within(pane).getByText("Project").textContent).toBe("Project");
    });

    it("should pin eslint.config.js first and put folders before files, each by name", () => {
      // Arrange
      render(<ProjectPane {...createProps()} />);

      // Act
      const names = view
        .getAllByRole("treeitem")
        .map((item) => item.getAttribute("aria-labelledby"))
        .map((id) => document.getElementById(id as string)?.textContent);

      // Assert
      expect(names).toEqual([
        "eslint.config.js",
        "src/",
        "components/",
        "Button.js",
        "Price.js",
        "index.js",
        "index.js",
      ]);
    });

    it("should show the full path of a node as the title of its name", () => {
      // Arrange
      render(<ProjectPane {...createProps()} />);

      // Act
      const paths = getPaths();

      // Assert
      expect(paths).toEqual([
        "src",
        "src/components",
        "src/components/Button.js",
        "src/components/Price.js",
        "src/index.js",
        "index.js",
      ]);
    });

    it("should start with every folder open", () => {
      // Arrange
      render(<ProjectPane {...createProps()} />);

      // Act
      const folders = view
        .getAllByRole("treeitem")
        .filter((item) => item.hasAttribute("aria-expanded"));

      // Assert
      expect(
        folders.map((folder) => folder.getAttribute("aria-expanded"))
      ).toEqual(["true", "true"]);
    });

    it("should close a folder when it is clicked, and open it when it is clicked again", () => {
      // Arrange
      const props = createProps();
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.click(getRow("src/components"));
      const pathsClosed = getPaths();
      fireEvent.click(getRow("src/components"));
      const pathsOpen = getPaths();

      // Assert
      expect(pathsClosed).not.toContain("src/components/Button.js");
      expect(pathsOpen).toContain("src/components/Button.js");
    });

    it("should not open anything when a folder is clicked", () => {
      // Arrange
      const props = createProps({ focus: { kind: "file", path: "index.js" } });
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.click(getRow("src"));

      // Assert
      expect(props.onFocus).not.toHaveBeenCalled();
    });

    it("should open a file when it is clicked", () => {
      // Arrange
      const props = createProps();
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.click(getRow("src/index.js"));

      // Assert
      expect(props.onFocus).toHaveBeenCalledWith({
        kind: "file",
        path: "src/index.js",
      });
    });

    it("should open the config when it is clicked", () => {
      // Arrange
      const props = createProps();
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.click(getRow("eslint.config.js"));

      // Assert
      expect(props.onFocus).toHaveBeenCalledWith({ kind: "config" });
    });

    it("should select the file that is in focus", () => {
      // Arrange
      const props = createProps({
        focus: { kind: "file", path: "src/index.js" },
      });
      render(<ProjectPane {...props} />);

      // Act
      const selected = view
        .getAllByRole("treeitem")
        .filter((item) => item.getAttribute("aria-selected") === "true");

      // Assert
      expect(selected).toEqual([getItem("src/index.js")]);
    });

    it("should select the config when it is in focus", () => {
      // Arrange
      const props = createProps({ focus: { kind: "config" } });
      render(<ProjectPane {...props} />);

      // Act
      const config = getItem("eslint.config.js");

      // Assert
      expect(config.getAttribute("aria-selected")).toBe("true");
    });

    it("should select nothing when nothing is in focus", () => {
      // Arrange
      render(<ProjectPane {...createProps()} />);

      // Act
      const selected = view
        .getAllByRole("treeitem")
        .filter((item) => item.getAttribute("aria-selected") === "true");

      // Assert
      expect(selected).toEqual([]);
    });

    it("should select a folder the user clicked, and keep what is in focus", () => {
      // Arrange
      const props = createProps({ focus: { kind: "file", path: "index.js" } });
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.click(getRow("src"));

      // Assert
      expect(getItem("src").getAttribute("aria-selected")).toBe("true");
      expect(getItem("index.js").getAttribute("aria-selected")).toBe("false");
    });

    it("should select the file again when it is clicked after a folder", () => {
      // Arrange
      const props = createProps({ focus: { kind: "file", path: "index.js" } });
      render(<ProjectPane {...props} />);
      fireEvent.click(getRow("src"));

      // Act
      fireEvent.click(getRow("index.js"));

      // Assert
      expect(getItem("index.js").getAttribute("aria-selected")).toBe("true");
      expect(getItem("src").getAttribute("aria-selected")).toBe("false");
    });

    it("should drop the selected folder when something else takes the focus", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ProjectPane {...props} />);
      fireEvent.click(getRow("src"));

      // Act
      rerender(<ProjectPane {...props} focus={{ kind: "config" }} />);

      // Assert
      expect(getItem("src").getAttribute("aria-selected")).toBe("false");
      expect(getItem("eslint.config.js").getAttribute("aria-selected")).toBe(
        "true"
      );
    });

    it("should keep what is in focus when the keyboard clears the selection", () => {
      // Arrange
      const props = createProps({ focus: { kind: "file", path: "index.js" } });
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: " " });

      // Assert
      expect(props.onFocus).not.toHaveBeenCalled();
      expect(getItem("index.js").getAttribute("aria-selected")).toBe("true");
    });

    it("should open the folders above a file that takes the focus", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ProjectPane {...props} />);
      fireEvent.click(getRow("src/components"));
      fireEvent.click(getRow("src"));

      // Act
      rerender(
        <ProjectPane
          {...props}
          focus={{ kind: "file", path: "src/components/Button.js" }}
        />
      );

      // Assert
      expect(getPaths()).toContain("src/components/Button.js");
    });

    it("should show where it is when the focus goes to nothing", () => {
      // Arrange
      const props = createProps({ focus: { kind: "file", path: "index.js" } });
      const { rerender } = render(<ProjectPane {...props} />);

      // Act
      rerender(<ProjectPane {...props} focus={NO_FOCUS} />);

      // Assert
      expect(getItem("index.js").getAttribute("aria-selected")).toBe("false");
    });
  });

  describe("badges", () => {
    it("should show the problems of the config in red when it has errors", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 2,
        configHasErrors: true,
        byPath: new Map(),
      };
      render(<ProjectPane {...createProps({ counts })} />);

      // Act
      const badge = within(getItem("eslint.config.js")).getByRole("img", {
        name: "2 problems",
      });

      // Assert
      expect(badge.textContent).toBe("2");
      expect(getComputedStyle(badge).color).toBe("var(--jsb-bad)");
    });

    it("should show the problems of the config in the warning color when it has no errors", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 1,
        configHasErrors: false,
        byPath: new Map(),
      };
      render(<ProjectPane {...createProps({ counts })} />);

      // Act
      const badge = within(getItem("eslint.config.js")).getByRole("img", {
        name: "1 problem",
      });

      // Assert
      expect(getComputedStyle(badge).color).toBe("var(--jsb-warn)");
    });

    it("should draw no badge when the config has no problems", () => {
      // Arrange
      render(<ProjectPane {...createProps()} />);

      // Act
      const badges = within(getItem("eslint.config.js")).queryAllByRole("img");

      // Assert
      expect(badges).toEqual([]);
    });

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
      render(<ProjectPane {...createProps({ counts })} />);

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
    });

    it("should mark a file with failures with its name in red and a cross", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([["src/index.js", 1]]),
      };
      render(<ProjectPane {...createProps({ counts })} />);

      // Act
      const failing = getItem("src/index.js");
      const passing = getItem("index.js");

      // Assert
      expect(failing.querySelector("[data-bad]")?.tagName).toBe("DIV");
      expect(passing.querySelector("[data-bad]")).toBeNull();
    });

    it("should not turn a folder with failures red", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 0,
        configHasErrors: false,
        byPath: new Map([["src", 1]]),
      };
      render(<ProjectPane {...createProps({ counts })} />);

      // Act
      const folderRow = getItem("src").firstElementChild;

      // Assert
      expect(folderRow?.hasAttribute("data-bad")).toBe(false);
    });

    it("should turn the config red when it has errors, and not otherwise", () => {
      // Arrange
      const counts: ProblemCounts = {
        config: 1,
        configHasErrors: true,
        byPath: new Map(),
      };
      const { rerender } = render(<ProjectPane {...createProps({ counts })} />);

      // Act
      const withErrors = getItem("eslint.config.js").firstElementChild;
      const withErrorsBad = withErrors?.hasAttribute("data-bad");
      rerender(
        <ProjectPane
          {...createProps({ counts: { ...counts, configHasErrors: false } })}
        />
      );
      const withoutErrors = getItem("eslint.config.js").firstElementChild;

      // Assert
      expect(withErrorsBad).toBe(true);
      expect(withoutErrors?.hasAttribute("data-bad")).toBe(false);
    });
  });

  describe("rename", () => {
    beforeEach(() => {
      jest.restoreAllMocks();
    });

    it("should rename a file in place from its row action", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByLabelText("Rename src/index.js"));
      const field = typeName("src/index.js", "main.js");
      fireEvent.keyDown(field, { key: "Enter" });

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "src/main.js"
      );
      expect(getPaths()).toContain("src/main.js");
      expect(view.queryByRole("textbox")).toBeNull();
    });

    it("should start the rename on double click", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.doubleClick(getRow("src/index.js"));

      // Assert
      expect(getField("src/index.js").value).toBe("index.js");
    });

    it("should start the rename with F2", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Assert
      expect(getField("src/index.js").value).toBe("index.js");
    });

    it("should start with the current name, selected, without the slash of a folder", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.doubleClick(getRow("src/components"));
      const field = view.getByRole("textbox", {
        name: "New name of src/components",
      }) as HTMLInputElement;

      // Assert
      expect(field.value).toBe("components");
      expect([field.selectionStart, field.selectionEnd]).toEqual([0, 10]);
    });

    it("should not open or select the row when the field is clicked", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.doubleClick(getRow("src/components"));

      // Act
      fireEvent.click(
        view.getByRole("textbox", { name: "New name of src/components" })
      );

      // Assert
      expect(getPaths()).toContain("src/components/Button.js");
      expect(spies.onFocus).not.toHaveBeenCalled();
    });

    it("should not pass the keys of the field to the tree", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.doubleClick(getRow("src/index.js"));
      const field = view.getByRole("textbox", {
        name: "New name of src/index.js",
      });

      // Act
      fireEvent.keyDown(field, { key: " " });

      // Assert
      expect(spies.onFocus).not.toHaveBeenCalled();
    });

    it("should follow the rename with the focus", () => {
      // Arrange
      const spies = createSpies();
      render(
        <Harness spies={spies} focus={{ kind: "file", path: "src/index.js" }} />
      );

      // Act
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      fireEvent.keyDown(typeName("src/index.js", "main.js"), { key: "Enter" });

      // Assert
      expect(spies.onFocus).toHaveBeenCalledWith({
        kind: "file",
        path: "src/main.js",
      });
      expect(getItem("src/main.js").getAttribute("aria-selected")).toBe("true");
    });

    it("should follow the rename of a folder with the file in focus inside it", () => {
      // Arrange
      const spies = createSpies();
      render(
        <Harness
          spies={spies}
          focus={{ kind: "file", path: "src/components/Button.js" }}
        />
      );

      // Act
      fireEvent.keyDown(getItem("src"), { key: "F2" });
      fireEvent.keyDown(typeName("src", "lib"), { key: "Enter" });

      // Assert
      expect(spies.onFocus).toHaveBeenCalledWith({
        kind: "file",
        path: "lib/components/Button.js",
      });
    });

    it("should leave the focus alone when the renamed node is not the file in focus", () => {
      // Arrange
      const spies = createSpies();
      render(
        <Harness spies={spies} focus={{ kind: "file", path: "index.js" }} />
      );

      // Act
      fireEvent.keyDown(getItem("src"), { key: "F2" });
      fireEvent.keyDown(typeName("src", "lib"), { key: "Enter" });

      // Assert
      expect(spies.onFocus).not.toHaveBeenCalled();
    });

    it("should keep a renamed folder closed, and keep its children's dependencies", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(getRow("src/components"));

      // Act
      fireEvent.keyDown(getItem("src"), { key: "F2" });
      fireEvent.keyDown(typeName("src", "lib"), { key: "Enter" });

      // Assert
      expect(getPaths()).toEqual([
        "lib",
        "lib/components",
        "lib/index.js",
        "index.js",
      ]);
      expect(getLastSketch(spies.onSketchChange).dependencies[0]).toMatchObject(
        {
          from: "lib/index.js",
          target: { kind: "node", path: "lib/components/Button.js" },
        }
      );
    });

    it("should keep the selected folder selected when it is renamed", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(getRow("src"));

      // Act
      fireEvent.keyDown(getItem("src"), { key: "F2" });
      fireEvent.keyDown(typeName("src", "lib"), { key: "Enter" });

      // Assert
      expect(getItem("lib").getAttribute("aria-selected")).toBe("true");
    });

    it("should rename a file inside a folder, keeping the folder", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.keyDown(getItem("src/components/Price.js"), { key: "F2" });
      fireEvent.keyDown(typeName("src/components/Price.js", "Cost.js"), {
        key: "Enter",
      });

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "src/components/Cost.js"
      );
    });

    it("should move a node into a folder when the name has a path", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      fireEvent.keyDown(typeName("src/index.js", "./app/main.js"), {
        key: "Enter",
      });

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "src/app/main.js"
      );
    });

    it("should open the closed folder that a node moves into, and give the keyboard to the node", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(getRow("src/components"));
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "components/moved.js"), {
        key: "Enter",
      });
      await waitForFocus();

      // Assert
      expect(getItem("src/components").getAttribute("aria-expanded")).toBe(
        "true"
      );
      expect(getPaths()).toContain("src/components/moved.js");
      expect(document.activeElement).toBe(getItem("src/components/moved.js"));
    });

    it("should rename when the field loses the focus, and leave the focus where the user put it", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      typeName("src/index.js", "main.js");

      // Act
      const other = moveFocusAway();
      await settleFocus();

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "src/main.js"
      );
      expect(spies.onSketchChange).toHaveBeenCalledTimes(1);
      expect(getPaths()).toContain("src/main.js");
      expect(document.activeElement).toBe(other);
    });

    it("should give up when Escape is pressed", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      const field = typeName("src/index.js", "main.js");

      // Act
      fireEvent.keyDown(field, { key: "Escape" });
      fireEvent.blur(field);

      // Assert
      expect(spies.onSketchChange).not.toHaveBeenCalled();
      expect(view.queryByRole("textbox")).toBeNull();
      expect(getPaths()).toContain("src/index.js");
    });

    it("should ignore the other keys", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "main.js"), { key: "a" });

      // Assert
      expect(getField("src/index.js").value).toBe("main.js");
      expect(spies.onSketchChange).not.toHaveBeenCalled();
    });

    it("should close the field without an edit when the name did not change", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "  index.js "), {
        key: "Enter",
      });

      // Assert
      expect(spies.onSketchChange).not.toHaveBeenCalled();
      expect(view.queryByRole("textbox")).toBeNull();
    });

    it("should refuse a name that is taken, say why next to the field and keep the field open", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/components/Price.js"), { key: "F2" });

      // Act
      const field = typeName("src/components/Price.js", "Button.js");
      fireEvent.keyDown(field, { key: "Enter" });

      // Assert
      expect(view.getByRole("tooltip").textContent).toBe(
        "That path already exists."
      );
      expect(field.getAttribute("aria-invalid")).toBe("true");
      expect(field.getAttribute("aria-describedby")).toBe(
        view.getByRole("tooltip").id
      );
      expect(spies.onSketchChange).not.toHaveBeenCalled();
      expect(view.getByRole("textbox")).toBe(field);
    });

    it("should clear the reason when the user types again, and rename with the fixed name", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/components/Price.js"), { key: "F2" });
      const field = typeName("src/components/Price.js", "Button.js");
      fireEvent.keyDown(field, { key: "Enter" });

      // Act
      fireEvent.change(field, { target: { value: "Cost.js" } });
      const invalidAfterTyping = field.getAttribute("aria-invalid");
      const describedAfterTyping = field.getAttribute("aria-describedby");
      const titleAfterTyping = field
        .closest(".MuiInputBase-root")
        ?.getAttribute("title");
      fireEvent.keyDown(field, { key: "Enter" });

      // Assert
      expect(invalidAfterTyping).toBe("false");
      expect(describedAfterTyping).toBeNull();
      expect(titleAfterTyping).toBeNull();
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "src/components/Cost.js"
      );
    });

    it("should refuse an empty name, in a folder and at the root", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      fireEvent.keyDown(typeName("src/index.js", " "), { key: "Enter" });
      const reasonInFolder = view.getByRole("tooltip").textContent;
      fireEvent.keyDown(typeName("src/index.js", "index.js"), {
        key: "Escape",
      });
      fireEvent.keyDown(getItem("index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("index.js", ""), { key: "Enter" });

      // Assert
      expect(reasonInFolder).toBe("The path is empty.");
      expect(view.getByRole("tooltip").textContent).toBe("The path is empty.");
    });

    it("should refuse a folder that would move into itself", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src", "src/inner"), { key: "Enter" });

      // Assert
      expect(spies.onSketchChange).not.toHaveBeenCalled();
      expect(view.getByRole("tooltip").textContent).not.toBe("");
    });

    it("should give up when the field loses the focus with a refused name, and leave the focus where the user put it", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/components/Price.js"), { key: "F2" });
      typeName("src/components/Price.js", "Button.js");

      // Act
      const other = moveFocusAway();
      await settleFocus();

      // Assert
      expect(view.queryByRole("textbox")).toBeNull();
      expect(spies.onSketchChange).not.toHaveBeenCalled();
      expect(getPaths()).toContain("src/components/Price.js");
      expect(document.activeElement).toBe(other);
    });

    it("should close the field and leave the focus where the user put it when the name did not change", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      const other = moveFocusAway();
      await settleFocus();

      // Assert
      expect(view.queryByRole("textbox")).toBeNull();
      expect(spies.onSketchChange).not.toHaveBeenCalled();
      expect(document.activeElement).toBe(other);
    });

    it("should not touch the item while the focus is on its way to where the user clicked", async () => {
      // Arrange
      const focusSpy = jest.spyOn(HTMLElement.prototype, "focus");
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });
      const field = typeName("src/index.js", "main.js");
      const other = view.getByRole("button", { name: "Tree" });
      focusSpy.mockClear();

      // Act
      // A browser runs the handlers of the blur while the focus is on the body, and puts it on its target when they return
      act(() => {
        fireEvent.blur(field);
      });
      act(() => other.focus());
      await settleFocus();

      // Assert
      const roles = focusSpy.mock.contexts.map((element) =>
        element.getAttribute("role")
      );

      expect(roles).not.toContain("treeitem");
      expect(document.activeElement).toBe(other);
    });

    it("should give the keyboard back to the renamed item", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "main.js"), { key: "Enter" });
      await waitForFocus();

      // Assert
      expect(document.activeElement).toBe(getItem("src/main.js"));
    });

    it("should give the keyboard back to the item when the user gives up", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.keyDown(getItem("src/index.js"), { key: "F2" });

      // Act
      fireEvent.keyDown(typeName("src/index.js", "main.js"), { key: "Escape" });
      await waitForFocus();

      // Assert
      expect(document.activeElement).toBe(getItem("src/index.js"));
    });

    it("should announce the F2 and Delete shortcuts on the rows that can be edited, and not on the config", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      const shortcuts = ["src", "src/index.js", "eslint.config.js"].map(
        (path) => getItem(path).getAttribute("aria-keyshortcuts")
      );

      // Assert
      expect(shortcuts).toEqual(["F2 Delete", "F2 Delete", null]);
    });

    it("should have no row actions, rename or delete for the config", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      const config = getItem("eslint.config.js");
      fireEvent.keyDown(config, { key: "F2" });
      fireEvent.keyDown(config, { key: "Delete" });
      fireEvent.doubleClick(getRow("eslint.config.js"));

      // Assert
      expect(within(config).queryAllByRole("button")).toEqual([]);
      expect(view.queryByRole("textbox")).toBeNull();
      expect(spies.onSketchChange).not.toHaveBeenCalled();
    });

    it("should not open the row when its action is clicked", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByLabelText("Rename src/index.js"));

      // Assert
      expect(spies.onFocus).not.toHaveBeenCalled();
    });

    it("should ignore the keys that come from inside the item", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.keyDown(view.getByLabelText("Rename src/index.js"), {
        key: "F2",
      });
      fireEvent.keyDown(getItem("src/components/Button.js"), { key: "F2" });

      // Assert: the field is the one of the child, not of src/ that holds it
      expect(view.getAllByRole("textbox")).toHaveLength(1);
      expect(getField("src/components/Button.js").value).toBe("Button.js");
    });
  });

  describe("delete", () => {
    it("should remove a file right away from its row action", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).not.toContain(
        "src/index.js"
      );
      expect(getPaths()).not.toContain("src/index.js");
    });

    it("should remove the dependencies of the file with it", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Assert
      expect(getLastSketch(spies.onSketchChange).dependencies).toHaveLength(1);
    });

    it("should remove a file with the Delete key", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: "Delete" });

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).not.toContain(
        "index.js"
      );
    });

    it("should leave the other keys alone", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: "Backspace" });

      // Assert
      expect(spies.onSketchChange).not.toHaveBeenCalled();
    });

    it("should put nothing in focus when the file in focus is removed", () => {
      // Arrange
      const spies = createSpies();
      render(
        <Harness spies={spies} focus={{ kind: "file", path: "index.js" }} />
      );

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: "Delete" });

      // Assert
      expect(spies.onFocus).toHaveBeenCalledWith({ kind: "none" });
    });

    it("should leave the focus when another file is removed", () => {
      // Arrange
      const spies = createSpies();
      render(
        <Harness spies={spies} focus={{ kind: "file", path: "index.js" }} />
      );

      // Act
      fireEvent.keyDown(getItem("src/index.js"), { key: "Delete" });

      // Assert
      expect(spies.onFocus).not.toHaveBeenCalled();
    });

    it("should ask before it removes a folder with files", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByLabelText("Delete src"));

      // Assert
      const dialog = view.getByRole("dialog");

      expect(dialog.textContent).toContain("Delete src/ and its 3 files?");
      expect(spies.onSketchChange).not.toHaveBeenCalled();
    });

    it("should say file, not files, for a folder with one", () => {
      // Arrange
      const spies = createSpies();
      const sketch: Sketch = {
        ...SKETCH,
        tree: [...SKETCH.tree, { path: "docs/readme.md", kind: "file" }],
      };
      render(<Harness spies={spies} sketch={sketch} />);

      // Act
      fireEvent.click(view.getByLabelText("Delete docs"));

      // Assert
      expect(view.getByRole("dialog").textContent).toContain(
        "Delete docs/ and its 1 file?"
      );
    });

    it("should count the files of the folder at any depth, and not the folders", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByLabelText("Delete src/components"));

      // Assert
      expect(view.getByRole("dialog").textContent).toContain(
        "Delete src/components/ and its 2 files?"
      );
    });

    it("should name the dialog by its title", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByLabelText("Delete src"));

      // Assert
      const title = view.getByText("Delete src/ and its 3 files?");

      expect(view.getByRole("dialog").getAttribute("aria-labelledby")).toBe(
        title.id
      );
    });

    it("should remove the folder and its files when the user confirms", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(view.getByLabelText("Delete src"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toEqual([
        "index.js",
      ]);
      expect(getPaths()).toEqual(["index.js"]);
    });

    it("should give the keyboard to the parent of the folder once the dialog is gone", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      askToDelete("src/components");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));
      await waitForFocus();

      // Assert
      expect(getPaths()).not.toContain("src/components");
      expect(document.activeElement).toBe(getItem("src"));
    });

    it("should give the keyboard to the nearest folder that is left when the parent goes with it", async () => {
      // Arrange
      const spies = createSpies();
      const sketch: Sketch = {
        ...SKETCH,
        tree: [
          { path: "a/b/c/x.js", kind: "file" },
          { path: "a/y.js", kind: "file" },
        ],
      };
      render(<Harness spies={spies} sketch={sketch} />);
      askToDelete("a/b/c");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));
      await waitForFocus();

      // Assert
      expect(getPaths()).toEqual(["a", "a/y.js"]);
      expect(document.activeElement).toBe(getItem("a"));
    });

    it("should give the keyboard to the config when no folder is left above the removed one", async () => {
      // Arrange
      const spies = createSpies();
      const sketch: Sketch = {
        ...SKETCH,
        tree: [
          { path: "docs/guide/a.md", kind: "file" },
          { path: "index.js", kind: "file" },
        ],
      };
      render(<Harness spies={spies} sketch={sketch} />);
      askToDelete("docs/guide");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));
      await waitForFocus();

      // Assert
      expect(getPaths()).toEqual(["index.js"]);
      expect(document.activeElement).toBe(getItem("eslint.config.js"));
    });

    it("should leave the keyboard on the folder when the user cancels", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      askToDelete("src/components");

      // Act
      fireEvent.click(view.getByRole("button", { name: "Cancel" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));
      await waitForFocus();

      // Assert
      expect(document.activeElement).toBe(getItem("src/components"));
    });

    it("should keep the folder when the user cancels", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(view.getByLabelText("Delete src"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Cancel" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));

      // Assert
      expect(spies.onSketchChange).not.toHaveBeenCalled();
      expect(getPaths()).toContain("src");
    });

    it("should put nothing in focus when the file in focus was inside the removed folder", () => {
      // Arrange
      const spies = createSpies();
      render(
        <Harness
          spies={spies}
          focus={{ kind: "file", path: "src/components/Button.js" }}
        />
      );
      fireEvent.keyDown(getItem("src"), { key: "Delete" });

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));

      // Assert
      expect(spies.onFocus).toHaveBeenCalledWith({ kind: "none" });
    });

    it("should drop the selection of a folder that is removed", async () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(getRow("src/components"));
      fireEvent.keyDown(getItem("src/components"), { key: "Delete" });

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));

      // Assert
      const selected = view
        .getAllByRole("treeitem")
        .filter((item) => item.getAttribute("aria-selected") === "true");

      expect(selected).toEqual([]);
    });

    it("should keep the selection of a folder when another is removed", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(getRow("src"));

      // Act
      fireEvent.click(view.getByLabelText("Delete index.js"));

      // Assert
      expect(getItem("src").getAttribute("aria-selected")).toBe("true");
    });

    it("should remove a folder with no files without asking", () => {
      // Arrange
      const spies = createSpies();
      const sketch: Sketch = {
        ...SKETCH,
        tree: [...SKETCH.tree, { path: "docs", kind: "folder" }],
      };
      render(<Harness spies={spies} sketch={sketch} />);

      // Act
      fireEvent.click(view.getByLabelText("Delete docs"));

      // Assert
      expect(view.queryByRole("dialog")).toBeNull();
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).not.toContain(
        "docs"
      );
    });

    it("should ignore a confirmation for a folder that is gone", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ProjectPane {...props} />);
      fireEvent.click(view.getByLabelText("Delete src"));
      rerender(<ProjectPane {...props} sketch={{ ...SKETCH, tree: [] }} />);

      // Act
      fireEvent.click(view.getByRole("button", { name: "Delete" }));

      // Assert
      expect(props.onSketchChange).not.toHaveBeenCalled();
    });
  });

  describe("add", () => {
    it("should add a file at the root and start renaming it", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "new-file.js"
      );
      expect(getField("new-file.js").value).toBe("new-file.js");
    });

    it("should select the new file, open it and focus its field", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(spies.onFocus).toHaveBeenCalledWith({
        kind: "file",
        path: "new-file.js",
      });
      expect(getRenamingItem("new-file.js").getAttribute("aria-selected")).toBe(
        "true"
      );
      expect(document.activeElement).toBe(
        view.getByRole("textbox", { name: "New name of new-file.js" })
      );
    });

    it("should add the file in the folder of the file in focus", () => {
      // Arrange
      const spies = createSpies();
      render(
        <Harness
          spies={spies}
          focus={{ kind: "file", path: "src/components/Button.js" }}
        />
      );

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "src/components/new-file.js"
      );
    });

    it("should add the file at the root when the config is in focus", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} focus={{ kind: "config" }} />);

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "new-file.js"
      );
    });

    it("should add the file inside the folder that is selected", () => {
      // Arrange
      const spies = createSpies();
      render(
        <Harness spies={spies} focus={{ kind: "file", path: "index.js" }} />
      );
      fireEvent.click(getRow("src/components"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "src/components/new-file.js"
      );
    });

    it("should add the file at the root when the selected folder is gone", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ProjectPane {...props} />);
      fireEvent.click(getRow("src/components"));
      rerender(
        <ProjectPane
          {...props}
          sketch={{ ...SKETCH, tree: [{ path: "index.js", kind: "file" }] }}
        />
      );

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(props.onSketchChange))).toContain(
        "new-file.js"
      );
    });

    it("should add the file at the root when the selected folder became a file", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ProjectPane {...props} />);
      fireEvent.click(getRow("src/components"));
      rerender(
        <ProjectPane
          {...props}
          sketch={{
            ...SKETCH,
            tree: [
              { path: "src/components", kind: "file" },
              { path: "index.js", kind: "file" },
            ],
          }}
        />
      );

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(props.onSketchChange).toHaveBeenCalledTimes(1);
      expect(getTreePaths(getLastSketch(props.onSketchChange))).toContain(
        "new-file.js"
      );
      expect(props.onFocus).toHaveBeenCalledWith({
        kind: "file",
        path: "new-file.js",
      });
    });

    it("should pick a free name when the first one is taken", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(view.getByRole("button", { name: "Add file" }));
      fireEvent.keyDown(
        view.getByRole("textbox", { name: "New name of new-file.js" }),
        { key: "Escape" }
      );

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getField("new-file-2.js").value).toBe("new-file-2.js");
    });

    it("should add a folder, select it and start renaming it", () => {
      // Arrange
      const spies = createSpies();
      render(
        <Harness spies={spies} focus={{ kind: "file", path: "index.js" }} />
      );

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add folder" }));

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "new-folder"
      );
      expect(getRenamingItem("new-folder").getAttribute("aria-selected")).toBe(
        "true"
      );
      expect(getField("new-folder").value).toBe("new-folder");
      expect(spies.onFocus).not.toHaveBeenCalled();
    });

    it("should add the next node inside the folder it just added", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(view.getByRole("button", { name: "Add folder" }));
      fireEvent.keyDown(
        view.getByRole("textbox", { name: "New name of new-folder" }),
        { key: "Enter" }
      );

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getTreePaths(getLastSketch(spies.onSketchChange))).toContain(
        "new-folder/new-file.js"
      );
    });

    it("should open the folders above the new node", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);
      fireEvent.click(getRow("src/components"));
      fireEvent.click(getRow("src"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(getField("src/new-file.js").value).toBe("new-file.js");
      expect(getItem("src").getAttribute("aria-expanded")).toBe("true");
    });

    it("should show the tree, where the node is renamed, when it adds from the text", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} view="text" />);

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));

      // Assert
      expect(spies.onViewChange).toHaveBeenCalledWith("tree");
      expect(getField("new-file.js").value).toBe("new-file.js");
    });

    it("should not change the view when it adds from the tree", () => {
      // Arrange
      const spies = createSpies();
      render(<Harness spies={spies} />);

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add folder" }));

      // Assert
      expect(spies.onViewChange).not.toHaveBeenCalled();
    });
  });

  describe("view", () => {
    it("should offer the tree and the text, with the current view pressed", () => {
      // Arrange
      render(<ProjectPane {...createProps({ view: "text" })} />);

      // Act
      const group = view.getByRole("group", { name: "Project view" });
      const buttons = within(group).getAllByRole("button");

      // Assert
      expect(
        buttons.map((button) => [
          button.textContent,
          button.getAttribute("aria-pressed"),
        ])
      ).toEqual([
        ["Tree", "false"],
        ["Text", "true"],
      ]);
    });

    it("should ask for the other view when its button is pressed", () => {
      // Arrange
      const props = createProps();
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.click(view.getByRole("button", { name: "Text" }));

      // Assert
      expect(props.onViewChange).toHaveBeenCalledWith("text");
    });

    it("should ask for nothing when the current view is pressed again", () => {
      // Arrange
      const props = createProps();
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.click(view.getByRole("button", { name: "Tree" }));

      // Assert
      expect(props.onViewChange).not.toHaveBeenCalled();
    });

    it("should show the text, with the hint, instead of the tree", () => {
      // Arrange
      render(<ProjectPane {...createProps({ view: "text" })} />);

      // Act
      const text = view.getByRole("textbox", { name: "Project as text" });

      // Assert
      expect((text as HTMLTextAreaElement).value).toBe(
        [
          "eslint.config.js",
          "src/components/Button.js",
          "src/components/Price.js",
          "src/index.js",
          "index.js",
          "",
        ].join("\n")
      );
      expect(view.getByText("One path per line").textContent).toBe(
        "One path per line"
      );
      expect(view.queryByRole("tree")).toBeNull();
    });

    it("should show no hint with the tree", () => {
      // Arrange
      render(<ProjectPane {...createProps()} />);

      // Act
      const hint = view.queryByText("One path per line");

      // Assert
      expect(hint).toBeNull();
    });

    it("should keep the closed folders when the text is shown and the tree comes back", () => {
      // Arrange
      const props = createProps();
      const { rerender } = render(<ProjectPane {...props} />);
      fireEvent.click(getRow("src/components"));

      // Act
      rerender(<ProjectPane {...props} view="text" />);
      rerender(<ProjectPane {...props} view="tree" />);

      // Assert
      expect(getPaths()).not.toContain("src/components/Button.js");
    });

    it("should read the text and report its problems through the pane", () => {
      // Arrange
      const props = createProps({ view: "text" });
      render(<ProjectPane {...props} />);
      const text = view.getByRole("textbox", { name: "Project as text" });

      // Act
      fireEvent.change(text, { target: { value: "a.js\n  indented\n" } });
      fireEvent.blur(text);

      // Assert
      expect(props.onSketchChange).toHaveBeenCalledTimes(1);
      expect(getTreePaths(getLastSketch(props.onSketchChange))).toEqual([
        "a.js",
      ]);
      expect(props.onTextProblems).toHaveBeenCalledWith([
        {
          line: 2,
          text: "  indented",
          reason: "Dependencies are not written in text mode yet.",
        },
      ]);
    });

    it("should drop the lines that were not read when the view goes back to the tree", () => {
      // Arrange
      const props = createProps({ view: "text" });
      const { rerender } = render(<ProjectPane {...props} />);
      fireEvent.change(view.getByRole("textbox", { name: "Project as text" }), {
        target: { value: "  indented\n" },
      });
      fireEvent.blur(view.getByRole("textbox", { name: "Project as text" }));
      props.onTextProblems.mockClear();

      // Act
      rerender(<ProjectPane {...props} view="tree" />);

      // Assert
      expect(props.onTextProblems).toHaveBeenCalledWith([]);
    });
  });

  describe("without edit capabilities", () => {
    it("should draw no add buttons", () => {
      // Arrange
      render(<ProjectPane {...createProps({ capabilities: READ_ONLY })} />);

      // Act
      const buttons = view
        .getAllByRole("button")
        .map((button) => button.textContent);

      // Assert
      expect(buttons).toEqual(["Tree", "Text"]);
    });

    it("should draw no row actions", () => {
      // Arrange
      render(<ProjectPane {...createProps({ capabilities: READ_ONLY })} />);

      // Act
      const actions = view.queryByLabelText("Rename src/index.js");

      // Assert
      expect(actions).toBeNull();
    });

    it("should announce no shortcuts on the rows", () => {
      // Arrange
      render(<ProjectPane {...createProps({ capabilities: READ_ONLY })} />);

      // Act
      const shortcuts = view
        .getAllByRole("treeitem")
        .map((item) => item.getAttribute("aria-keyshortcuts"));

      // Assert
      expect(shortcuts.every((keys) => keys === null)).toBe(true);
    });

    it("should neither rename nor remove with the keyboard or the mouse", () => {
      // Arrange
      const props = createProps({ capabilities: READ_ONLY });
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.keyDown(getItem("index.js"), { key: "F2" });
      fireEvent.keyDown(getItem("index.js"), { key: "Delete" });
      fireEvent.doubleClick(getRow("index.js"));

      // Assert
      expect(view.queryByRole("textbox")).toBeNull();
      expect(props.onSketchChange).not.toHaveBeenCalled();
    });

    it("should still open files and the config", () => {
      // Arrange
      const props = createProps({ capabilities: READ_ONLY });
      render(<ProjectPane {...props} />);

      // Act
      fireEvent.click(getRow("index.js"));

      // Assert
      expect(props.onFocus).toHaveBeenCalledWith({
        kind: "file",
        path: "index.js",
      });
    });

    it("should show the text read only", () => {
      // Arrange
      render(
        <ProjectPane
          {...createProps({ capabilities: READ_ONLY, view: "text" })}
        />
      );

      // Act
      const text = view.getByRole("textbox", { name: "Project as text" });

      // Assert
      expect((text as HTMLTextAreaElement).readOnly).toBe(true);
    });

    it("should leave the text editable with edit capabilities", () => {
      // Arrange
      render(<ProjectPane {...createProps({ view: "text" })} />);

      // Act
      const text = view.getByRole("textbox", { name: "Project as text" });

      // Assert
      expect((text as HTMLTextAreaElement).readOnly).toBe(false);
    });
  });
});
