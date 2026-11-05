// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests show
import { undo } from "@codemirror/commands";
import { EditorView } from "@codemirror/view";
import {
  act,
  fireEvent,
  render,
  screen as view,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import { createEngine } from "@/engine";
import { QUICK_START_EXAMPLE } from "@/examples";
import { stubResizeObserver } from "@/shared/testing/resizeObserver";

import { Workbench } from "./Workbench";
import type { WorkbenchProps } from "./Workbench.types";

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

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const { evaluate } = createEngine();

const FILE = "src/modules/checkout/index.js";

const OTHER_FILE = "src/helpers/format/index.js";

/** The quick-start config with the two mistakes of the mockup: a wrong option of the rule, which is an error, and a wrong key of an element descriptor, which is a warning */
const MISTAKES: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config
    .replace('default: "disallow"', 'default: "dissallow"')
    .replace('pattern: "components/*/*"', 'patern: "components/*/*"'),
};

/** The quick-start config with the mistake that is only a warning */
const WARNING_ONLY: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config.replace(
    'pattern: "components/*/*"',
    'patern: "components/*/*"'
  ),
};

/** The quick-start config with a capture that is not a list, which makes describing the files throw */
const CAPTURE_NOT_A_LIST: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config.replace(
    'pattern: "helpers/*"',
    'pattern: "helpers/*", capture: "name"'
  ),
};

const NOTE_TEXT =
  "Dependencies are not evaluated while the rule options are invalid: ESLint does not run a rule whose options fail its schema.";

const EVALUATION_WAIT = 150;

const TEXT_READ_WAIT = 300;

/**
 * Renders the workbench.
 * @param overrides What differs from an editable workbench of the quick-start sketch.
 * @returns The container, and the mock that receives each new sketch.
 */
function renderWorkbench(overrides: Partial<WorkbenchProps> = {}): {
  container: HTMLElement;
  onSketchChange: jest.Mock;
} {
  const onSketchChange = jest.fn();
  const { container } = render(
    <Workbench
      initialSketch={QUICK_START}
      capabilities={EDITABLE}
      onSketchChange={onSketchChange}
      {...overrides}
    />
  );

  return { container, onSketchChange };
}

/**
 * Gets the project pane.
 * @returns The landmark.
 */
function getProject(): HTMLElement {
  return view.getByRole("region", { name: "Project" });
}

/**
 * Opens a file by its row in the tree.
 * @param path The path of the file.
 */
function openFile(path: string): void {
  fireEvent.click(within(getProject()).getByTitle(path));
}

/** Opens the config by its row in the tree. */
function openConfig(): void {
  fireEvent.click(within(getProject()).getByText("eslint.config.js"));
}

/** Everything that `jest.useFakeTimers` fakes but the timeouts: CodeMirror measures in animation frames, which jsdom cannot, and the tests need only the delays of the workbench */
const REAL_TIMERS = [
  "Date",
  "hrtime",
  "nextTick",
  "performance",
  "queueMicrotask",
  "requestAnimationFrame",
  "cancelAnimationFrame",
  "requestIdleCallback",
  "cancelIdleCallback",
  "setImmediate",
  "clearImmediate",
  "setInterval",
  "clearInterval",
] as const;

/** Fakes the timeouts, which are the delays of the workbench: 150 ms to evaluate and 300 ms to read the text */
function useFakeTimeouts(): void {
  jest.useFakeTimers({ doNotFake: [...REAL_TIMERS] });
}

/**
 * Gets the pane of the node in focus.
 * @returns The landmark.
 */
function getNodePane(): HTMLElement {
  return view.getByRole("region", { name: "Node in focus" });
}

/**
 * Gets the problems panel.
 * @returns The landmark.
 */
function getProblems(): HTMLElement {
  return view.getByRole("region", { name: "Problems" });
}

/**
 * Reads the tabs of the problems panel.
 * @returns The text of each tab, with `*` after the selected one.
 */
function getTabs(): string[] {
  return within(getProblems())
    .getAllByRole("tab")
    .map(
      (tab) =>
        `${tab.textContent}${tab.getAttribute("aria-selected") === "true" ? "*" : ""}`
    );
}

/**
 * Gets the status of the top bar.
 * @returns The text of the status.
 */
function getStatus(): string {
  return view.getByText(/^\d+ files? ·/).textContent as string;
}

/**
 * Finds the CodeMirror view of the editor.
 * @param container The element the workbench was rendered in.
 * @returns The view.
 */
function getEditorView(container: HTMLElement): EditorView {
  const found = EditorView.findFromDOM(
    container.querySelector(".cm-editor") as HTMLElement
  );

  expect(found).not.toBeNull();

  return found as EditorView;
}

/**
 * Gets the textarea of the project as text.
 * @returns The element.
 */
function getProjectText(): HTMLTextAreaElement {
  return view.getByRole("textbox", {
    name: "Project as text",
  }) as HTMLTextAreaElement;
}

/**
 * Types in the project as text, as the user does.
 * @param value The whole text after the keystroke.
 */
function typeProjectText(value: string): void {
  fireEvent.change(getProjectText(), { target: { value } });
}

/**
 * Gets the item of the tree that has a node's name.
 * @param path The path of the node.
 * @returns The element of the item.
 */
function getItem(path: string): HTMLElement {
  return within(getProject())
    .getByTitle(path)
    .closest("[role='treeitem']") as HTMLElement;
}

/**
 * Renames a node of the tree, as the user does with the keyboard.
 * @param path The path of the node.
 * @param newName The new name.
 */
function rename(path: string, newName: string): void {
  fireEvent.keyDown(getItem(path), { key: "F2" });
  const field = view.getByRole("textbox", { name: `New name of ${path}` });

  fireEvent.change(field, { target: { value: newName } });
  fireEvent.keyDown(field, { key: "Enter" });
}

/**
 * Gets the row of the problem list that starts with a location.
 * @param startsWith What the row says first, such as `eslint.config.js:15:16`.
 * @returns The button of the row.
 */
function getProblemRow(startsWith: string): HTMLElement {
  return within(getProblems())
    .getAllByRole("button")
    .find((button) =>
      button.textContent?.startsWith(startsWith)
    ) as HTMLElement;
}

/**
 * Gets the item of the problem list that starts with a location, whether it opens something or not.
 * @param startsWith What the item says first, such as `Project text:9`.
 * @returns The item.
 */
function getProblemItem(startsWith: string): HTMLElement {
  return within(getProblems())
    .getAllByRole("listitem")
    .find((item) => item.textContent?.startsWith(startsWith)) as HTMLElement;
}

/**
 * Lets the delays of the workbench go by.
 * @param milliseconds How long.
 */
function wait(milliseconds: number): void {
  act(() => {
    jest.advanceTimersByTime(milliseconds);
  });
}

/**
 * Puts the cursor of the editor somewhere else.
 * @param container The element the workbench was rendered in.
 * @param offset Where to put it.
 */
function moveCursor(container: HTMLElement, offset: number): void {
  act(() => {
    getEditorView(container).dispatch({ selection: { anchor: offset } });
  });
}

/**
 * Gets where the cursor of the editor is.
 * @param container The element the workbench was rendered in.
 * @returns The offset of the cursor.
 */
function getCursor(container: HTMLElement): number {
  return getEditorView(container).state.selection.main.anchor;
}

describe("Workbench", () => {
  beforeEach(() => {
    stubResizeObserver();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("layout", () => {
    it("should lay out the project, the node in focus, the inspector and the problems", () => {
      // Act
      renderWorkbench();

      // Assert
      expect(view.getByRole("region", { name: "Playground" })).toBeTruthy();
      expect(getProject()).toBeTruthy();
      expect(getNodePane()).toBeTruthy();
      expect(
        view.getByRole("complementary", { name: "Inspector" })
      ).toBeTruthy();
      expect(getProblems()).toBeTruthy();
    });

    it("should separate the regions with separators the keyboard reaches", () => {
      // Act
      renderWorkbench();

      // Assert
      expect(view.getAllByRole("separator")).toHaveLength(3);
    });

    it("should leave the decision about narrow screens to the host", () => {
      // Act
      renderWorkbench();

      // Assert
      expect(view.queryByText(/needs a wider screen/)).toBeNull();
    });
  });

  describe("status", () => {
    it("should count the files and the problems of the sketch", () => {
      // Act
      renderWorkbench();

      // Assert
      expect(getStatus()).toBe("6 files · 0 problems");
    });

    it("should say that the config has errors when it has", () => {
      // Act
      renderWorkbench({ initialSketch: MISTAKES });

      // Assert
      expect(getStatus()).toBe("6 files · config has errors");
    });

    it("should say that the config has errors when a descriptor makes describing the files throw", () => {
      // Act
      renderWorkbench({ initialSketch: CAPTURE_NOT_A_LIST });

      // Assert
      expect(getStatus()).toBe("6 files · config has errors");
    });

    it("should count the problems of a config that has only warnings, and not say it has errors", () => {
      // Act
      renderWorkbench({ initialSketch: WARNING_ONLY });

      // Assert
      expect(getStatus()).toBe("6 files · 1 problem");
    });

    it("should count the files with the sketch that an edit of the tree makes, at once", () => {
      // Arrange
      useFakeTimeouts();
      renderWorkbench();

      // Act
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Assert
      expect(getStatus()).toBe("5 files · 0 problems");
    });

    it("should count the files at once after a node is added and after one is renamed", () => {
      // Arrange
      useFakeTimeouts();
      renderWorkbench();

      // Act
      fireEvent.click(view.getByRole("button", { name: "Add file" }));
      const added = getStatus();
      fireEvent.keyDown(
        view.getByRole("textbox", { name: "New name of new-file.js" }),
        { key: "Escape" }
      );
      rename("src/index.js", "main.spec.js");

      // Assert
      expect(added).toBe("7 files · 0 problems");
      expect(getStatus()).toBe("7 files · 0 problems");
      expect(within(getProject()).getByTitle("src/main.spec.js")).toBeTruthy();
    });

    it("should count the files at once after the text of the project is read", () => {
      // Arrange
      useFakeTimeouts();
      renderWorkbench();
      fireEvent.click(view.getByRole("button", { name: "Text" }));

      // Act
      typeProjectText(`${getProjectText().value}\nsrc/extra.js`);
      wait(TEXT_READ_WAIT);

      // Assert
      expect(getStatus()).toBe("7 files · 0 problems");
    });

    it("should evaluate the config together with the tree when an edit of the tree comes before the config is evaluated", () => {
      // Arrange
      useFakeTimeouts();
      const { container } = renderWorkbench();
      openConfig();
      const editor = getEditorView(container);
      const at = QUICK_START.config.indexOf('"disallow"');

      // Act
      act(() => {
        editor.dispatch({
          changes: {
            from: at,
            to: at + '"disallow"'.length,
            insert: '"dissallow"',
          },
        });
      });
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Assert
      expect(getStatus()).toBe("5 files · config has errors");
    });
  });

  describe("nothing open", () => {
    it("should start with nothing open", () => {
      // Act
      renderWorkbench();

      // Assert
      expect(
        within(getNodePane()).getByText("Open a file or the config")
      ).toBeTruthy();
    });

    it("should describe the sketch in the inspector", () => {
      // Act
      renderWorkbench();

      // Assert
      const inspector = view.getByRole("complementary", { name: "Inspector" });

      expect(within(inspector).getByText("Sketch")).toBeTruthy();
      expect(within(inspector).getByText("files")).toBeTruthy();
    });

    it("should have the sketch tab only, selected, with no problems", () => {
      // Act
      renderWorkbench();

      // Assert
      expect(getTabs()).toEqual(["Sketch*"]);
      expect(
        within(getProblems()).getByText("No problems in the sketch.")
      ).toBeTruthy();
    });

    it("should open the config from the button of the empty pane", () => {
      // Arrange
      renderWorkbench();

      // Act
      fireEvent.click(
        view.getByRole("button", { name: "Open eslint.config.js" })
      );

      // Assert
      expect(
        view.getByRole("textbox", { name: "eslint.config.js" })
      ).toBeTruthy();
      expect(getTabs()).toEqual(["Sketch", "eslint.config.js*"]);
    });

    it("should add a file at the root and open it from the button of the empty pane", () => {
      // Arrange
      const { onSketchChange } = renderWorkbench();

      // Act
      fireEvent.click(
        within(getNodePane()).getByRole("button", { name: "File" })
      );

      // Assert
      expect(within(getNodePane()).getByText("new-file.js")).toBeTruthy();
      expect(
        view.getByRole("textbox", { name: "New name of new-file.js" })
      ).toBeTruthy();
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(
        (onSketchChange.mock.calls[0][0] as Sketch).tree.map(({ path }) => path)
      ).toContain("new-file.js");
    });

    it("should add the file the way the tree does: opened, with the tree showing and its name being edited", () => {
      // Arrange
      renderWorkbench();

      // Act
      fireEvent.click(
        within(getNodePane()).getByRole("button", { name: "File" })
      );

      // Assert
      const field = view.getByRole("textbox", {
        name: "New name of new-file.js",
      });

      expect(field).toBe(document.activeElement);
      expect(getTabs()).toEqual(["Sketch", "new-file.js*"]);
      expect(
        field.closest("[role='treeitem']")?.getAttribute("aria-selected")
      ).toBe("true");
    });

    it("should add the file in the folder that the user picked in the tree", () => {
      // Arrange
      const { onSketchChange } = renderWorkbench();
      fireEvent.click(within(getProject()).getByTitle("src/modules"));

      // Act
      fireEvent.click(
        within(getNodePane()).getByRole("button", { name: "File" })
      );

      // Assert
      expect(
        (onSketchChange.mock.lastCall?.[0] as Sketch).tree.map(
          ({ path }) => path
        )
      ).toContain("src/modules/new-file.js");
      expect(
        within(getNodePane()).getByText("src/modules/new-file.js")
      ).toBeTruthy();
    });

    it("should add the file at the root when no folder is picked", () => {
      // Arrange
      const { onSketchChange } = renderWorkbench();

      // Act
      fireEvent.click(
        within(getNodePane()).getByRole("button", { name: "File" })
      );

      // Assert
      expect(
        (onSketchChange.mock.lastCall?.[0] as Sketch).tree.map(
          ({ path }) => path
        )
      ).toContain("new-file.js");
    });

    it("should show the tree, where the name is edited, when the project was shown as text", () => {
      // Arrange
      renderWorkbench();
      fireEvent.click(view.getByRole("button", { name: "Text" }));

      // Act
      fireEvent.click(
        within(getNodePane()).getByRole("button", { name: "File" })
      );

      // Assert
      expect(
        view.queryByRole("textbox", { name: "Project as text" })
      ).toBeNull();
      expect(
        view.getByRole("textbox", { name: "New name of new-file.js" })
      ).toBeTruthy();
    });

    it("should count the new file at once", () => {
      // Arrange
      useFakeTimeouts();
      renderWorkbench();

      // Act
      fireEvent.click(
        within(getNodePane()).getByRole("button", { name: "File" })
      );

      // Assert
      expect(getStatus()).toBe("7 files · 0 problems");
    });

    it("should give the file it adds a name that is free", () => {
      // Arrange
      renderWorkbench({
        initialSketch: {
          ...QUICK_START,
          tree: [...QUICK_START.tree, { path: "new-file.js", kind: "file" }],
        },
      });

      // Act
      fireEvent.click(
        within(getNodePane()).getByRole("button", { name: "File" })
      );

      // Assert
      expect(within(getNodePane()).getByText("new-file-2.js")).toBeTruthy();
    });

    it("should not offer to add a file when the project cannot be edited", () => {
      // Act
      renderWorkbench({ capabilities: READ_ONLY });

      // Assert
      expect(
        within(getNodePane()).queryByRole("button", { name: "File" })
      ).toBeNull();
    });
  });

  describe("a file", () => {
    it("should open it in the node pane from the tree", () => {
      // Arrange
      renderWorkbench();

      // Act
      openFile(FILE);

      // Assert
      const pane = getNodePane();

      expect(within(pane).getByText("File")).toBeTruthy();
      expect(within(pane).getByText(FILE)).toBeTruthy();
    });

    it("should describe it in the inspector", () => {
      // Arrange
      renderWorkbench();

      // Act
      openFile(FILE);

      // Assert
      const inspector = view.getByRole("complementary", { name: "Inspector" });

      expect(within(inspector).getByText(FILE)).toBeTruthy();
      expect(within(inspector).getByText("element")).toBeTruthy();
      expect(within(inspector).getByText('[ "module" ]')).toBeTruthy();
    });

    it("should add its tab to the problems and select it", () => {
      // Arrange
      renderWorkbench();

      // Act
      openFile(FILE);

      // Assert
      expect(getTabs()).toEqual(["Sketch", "checkout/index.js*"]);
      expect(
        within(getProblems()).getByText("No problems in this file.")
      ).toBeTruthy();
    });

    it("should change to the tab of another file when another file is opened", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);

      // Act
      openFile(OTHER_FILE);

      // Assert
      expect(getTabs()).toEqual(["Sketch", "format/index.js*"]);
    });
  });

  describe("the config", () => {
    it("should open the editor from the tree", () => {
      // Arrange
      const { container } = renderWorkbench();

      // Act
      openConfig();

      // Assert
      expect(getEditorView(container).state.doc.toString()).toBe(
        QUICK_START.config
      );
    });

    it("should describe it in the inspector", () => {
      // Arrange
      renderWorkbench();

      // Act
      openConfig();

      // Assert
      const inspector = view.getByRole("complementary", { name: "Inspector" });

      expect(within(inspector).getByText("Element types")).toBeTruthy();
    });

    it("should add its tab to the problems and select it", () => {
      // Arrange
      renderWorkbench();

      // Act
      openConfig();

      // Assert
      expect(getTabs()).toEqual(["Sketch", "eslint.config.js*"]);
      expect(
        within(getProblems()).getByText("No problems in the config.")
      ).toBeTruthy();
    });

    it("should let the editor change the text when the config can be edited", () => {
      // Arrange
      const { container } = renderWorkbench();

      // Act
      openConfig();

      // Assert
      expect(getEditorView(container).state.readOnly).toBe(false);
    });

    it("should read the text only, when the config cannot be edited", () => {
      // Arrange
      const { container } = renderWorkbench({ capabilities: READ_ONLY });

      // Act
      openConfig();

      // Assert
      expect(getEditorView(container).state.readOnly).toBe(true);
    });

    it("should report the sketch that an edit makes, with the same tree", () => {
      // Arrange
      const { container, onSketchChange } = renderWorkbench();
      openConfig();
      const editor = getEditorView(container);

      // Act
      act(() => {
        editor.dispatch({
          changes: { from: 0, to: editor.state.doc.length, insert: "{}" },
        });
      });

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);

      const sketch = onSketchChange.mock.calls[0][0] as Sketch;

      expect(sketch.config).toBe("{}");
      expect(sketch.tree).toBe(QUICK_START.tree);
    });

    it("should show the problems of an edit a moment after it", () => {
      // Arrange
      useFakeTimeouts();
      const { container } = renderWorkbench();
      openConfig();
      const editor = getEditorView(container);
      const at = QUICK_START.config.indexOf('"disallow"');

      // Act
      act(() => {
        editor.dispatch({
          changes: {
            from: at,
            to: at + '"disallow"'.length,
            insert: '"dissallow"',
          },
        });
      });
      const before = getStatus();
      wait(EVALUATION_WAIT);

      // Assert
      expect(before).toBe("6 files · 0 problems");
      expect(getStatus()).toBe("6 files · config has errors");
      expect(getTabs()).toEqual(["Sketch1", "eslint.config.js1*"]);
    });
  });

  describe("the problems of the config", () => {
    it("should wait for the last keystroke before the config is evaluated", () => {
      // Arrange
      useFakeTimeouts();
      const { container } = renderWorkbench();
      openConfig();
      const editor = getEditorView(container);
      const at = QUICK_START.config.indexOf('"disallow"');

      // Act
      act(() => {
        editor.dispatch({
          changes: { from: at + 1, insert: "x" },
          userEvent: "input.type",
        });
      });
      wait(EVALUATION_WAIT - 50);
      act(() => {
        editor.dispatch({
          changes: { from: at + 2, insert: "y" },
          userEvent: "input.type",
        });
      });
      wait(EVALUATION_WAIT - 1);
      const beforeTheLastDelay = getStatus();
      wait(1);

      // Assert
      expect(beforeTheLastDelay).toBe("6 files · 0 problems");
      expect(getStatus()).toBe("6 files · config has errors");
    });

    it("should show the error of an edit that makes describing the files throw, a moment after it", () => {
      // Arrange
      useFakeTimeouts();
      const { container } = renderWorkbench();
      openConfig();
      const editor = getEditorView(container);
      const at =
        QUICK_START.config.indexOf('pattern: "helpers/*"') +
        'pattern: "helpers/*"'.length;

      // Act
      act(() => {
        editor.dispatch({ changes: { from: at, insert: ', capture: "name"' } });
      });
      wait(EVALUATION_WAIT);

      // Assert
      expect(getStatus()).toBe("6 files · config has errors");
      expect(getProblemRow("eslint.config.js:4:7").textContent).toContain(
        "descriptor.capture.join is not a function."
      );
    });

    it("should list them in the sketch tab with their count", () => {
      // Act
      renderWorkbench({ initialSketch: MISTAKES });

      // Assert
      expect(getTabs()).toEqual(["Sketch2*"]);
      expect(getProblemRow("eslint.config.js:15:16")).toBeTruthy();
      expect(getProblemRow("eslint.config.js:5:7")).toBeTruthy();
    });

    it("should say that the rules are not evaluated while their options are invalid", () => {
      // Act
      renderWorkbench({ initialSketch: MISTAKES });

      // Assert
      expect(within(getProblems()).getByRole("note").textContent).toBe(
        NOTE_TEXT
      );
    });

    it("should not say it when the options of the rules are valid, even if the config has a warning", () => {
      // Act
      renderWorkbench({ initialSketch: WARNING_ONLY });

      // Assert
      expect(within(getProblems()).queryByRole("note")).toBeNull();
    });

    it("should not say it for a config without problems", () => {
      // Act
      renderWorkbench();

      // Assert
      expect(within(getProblems()).queryByRole("note")).toBeNull();
    });

    it("should open the editor at the range of a problem when its row is pressed", () => {
      // Arrange
      const { container } = renderWorkbench({ initialSketch: MISTAKES });

      // Act
      fireEvent.click(getProblemRow("eslint.config.js:15:16"));

      // Assert
      expect(getCursor(container)).toBe(MISTAKES.config.indexOf('"dissallow"'));
      expect(
        view.getByRole("textbox", { name: "eslint.config.js" })
      ).toBeTruthy();
    });

    it("should select the tab of the config and keep the problems and the note in it", () => {
      // Arrange
      renderWorkbench({ initialSketch: MISTAKES });

      // Act
      fireEvent.click(getProblemRow("eslint.config.js:5:7"));

      // Assert
      expect(getTabs()).toEqual(["Sketch2", "eslint.config.js2*"]);
      expect(within(getProblems()).getByRole("note")).toBeTruthy();
      expect(getProblemRow("eslint.config.js:15:16")).toBeTruthy();
    });

    it("should open the config from a file that was open", () => {
      // Arrange
      const { container } = renderWorkbench({ initialSketch: MISTAKES });
      openFile(FILE);
      fireEvent.click(
        within(getProblems()).getByRole("tab", { name: /Sketch/ })
      );

      // Act
      fireEvent.click(getProblemRow("eslint.config.js:5:7"));

      // Assert
      expect(getCursor(container)).toBe(
        MISTAKES.config.indexOf('{ type: "component"')
      );
      expect(within(getNodePane()).queryByText(FILE)).toBeNull();
    });

    it("should scroll to the range again when the same problem is pressed after the user moved away", () => {
      // Arrange
      const { container } = renderWorkbench({ initialSketch: MISTAKES });
      fireEvent.click(getProblemRow("eslint.config.js:15:16"));
      moveCursor(container, 0);

      // Act
      fireEvent.click(
        within(getProblems()).getByRole("tab", { name: /Sketch/ })
      );
      fireEvent.click(getProblemRow("eslint.config.js:15:16"));

      // Assert
      expect(getCursor(container)).toBe(MISTAKES.config.indexOf('"dissallow"'));
    });

    it("should not scroll the editor to an old range when the config is opened again, and leave the cursor where the user put it", () => {
      // Arrange
      const { container } = renderWorkbench({ initialSketch: MISTAKES });
      fireEvent.click(getProblemRow("eslint.config.js:15:16"));
      moveCursor(container, 3);
      openFile(FILE);

      // Act
      openConfig();

      // Assert
      expect(getCursor(container)).toBe(3);
    });

    it("should open the config at the range of a problem that is pressed while the config is open", () => {
      // Arrange
      const { container } = renderWorkbench({ initialSketch: MISTAKES });
      openConfig();
      moveCursor(container, 0);

      // Act
      fireEvent.click(getProblemRow("eslint.config.js:15:16"));

      // Assert
      expect(getCursor(container)).toBe(MISTAKES.config.indexOf('"dissallow"'));
    });

    it("should keep the undo history of the config when a file is opened and the config comes back", () => {
      // Arrange
      const { container, onSketchChange } = renderWorkbench();
      openConfig();
      act(() => {
        getEditorView(container).dispatch({
          changes: { from: 0, insert: "// note\n" },
          userEvent: "input.type",
        });
      });
      openFile(FILE);
      openConfig();
      const editor = getEditorView(container);

      // Act
      let undone = false;

      act(() => {
        undone = undo(editor);
      });

      // Assert
      expect(undone).toBe(true);
      expect(editor.state.doc.toString()).toBe(QUICK_START.config);
      expect((onSketchChange.mock.lastCall?.[0] as Sketch).config).toBe(
        QUICK_START.config
      );
    });

    it("should keep the text that the user typed when a file is opened and the config comes back", () => {
      // Arrange
      const { container } = renderWorkbench();
      openConfig();
      act(() => {
        getEditorView(container).dispatch({
          changes: { from: 0, insert: "// note\n" },
          userEvent: "input.type",
        });
      });
      openFile(FILE);

      // Act
      openConfig();

      // Assert
      expect(getEditorView(container).state.doc.toString()).toBe(
        `// note\n${QUICK_START.config}`
      );
    });

    it("should report the edits of the editor that opens again, and only once", () => {
      // Arrange
      const { container, onSketchChange } = renderWorkbench();
      openConfig();
      openFile(FILE);
      openConfig();

      // Act
      act(() => {
        getEditorView(container).dispatch({
          changes: { from: 0, insert: " " },
          userEvent: "input.type",
        });
      });

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect((onSketchChange.mock.calls[0][0] as Sketch).config).toBe(
        ` ${QUICK_START.config}`
      );
    });

    it("should open the config at an entry that the inspector points at", () => {
      // Arrange
      const { container } = renderWorkbench({ initialSketch: MISTAKES });
      openConfig();
      const [ignored] = evaluate(MISTAKES).elementTypes.filter(
        ({ ignored: isIgnored }) => isIgnored
      );

      // Act
      fireEvent.click(
        within(
          view.getByRole("complementary", { name: "Inspector" })
        ).getByRole("button", { name: /component/ })
      );

      // Assert
      expect(getCursor(container)).toBe(ignored.range.from);
    });

    it("should open the config at an entry that the inspector points at when a file was open", () => {
      // Arrange
      const { container } = renderWorkbench({ initialSketch: MISTAKES });
      openConfig();
      const [ignored] = evaluate(MISTAKES).elementTypes.filter(
        ({ ignored: isIgnored }) => isIgnored
      );
      openFile(FILE);
      openConfig();
      moveCursor(container, 0);

      // Act
      fireEvent.click(
        within(
          view.getByRole("complementary", { name: "Inspector" })
        ).getByRole("button", { name: /component/ })
      );

      // Assert
      expect(getCursor(container)).toBe(ignored.range.from);
    });
  });

  describe("text mode", () => {
    it("should show the project as a path per line, with the config first", () => {
      // Arrange
      renderWorkbench();

      // Act
      fireEvent.click(view.getByRole("button", { name: "Text" }));

      // Assert
      const lines = getProjectText().value.split("\n");

      expect(lines[0]).toBe("eslint.config.js");
      expect(lines).toContain(FILE);
    });

    it("should read the lines the user types into the sketch, and show them in the tree", () => {
      // Arrange
      useFakeTimeouts();
      const { onSketchChange } = renderWorkbench();
      fireEvent.click(view.getByRole("button", { name: "Text" }));

      // Act
      typeProjectText(`${getProjectText().value}\nsrc/extra.js`);
      wait(TEXT_READ_WAIT);
      fireEvent.click(view.getByRole("button", { name: "Tree" }));

      // Assert
      expect(within(getProject()).getByTitle("src/extra.js")).toBeTruthy();
      expect(getStatus()).toBe("7 files · 0 problems");
      expect(
        (onSketchChange.mock.calls.at(-1)?.[0] as Sketch).tree.map(
          ({ path }) => path
        )
      ).toContain("src/extra.js");
    });

    it("should keep the lines that could not be read in the sketch tab, with their count", () => {
      // Arrange
      renderWorkbench();
      fireEvent.click(view.getByRole("button", { name: "Text" }));
      const text = getProjectText();

      // Act
      typeProjectText(`${text.value}\nsrc/../outside.js`);
      fireEvent.blur(text);

      // Assert
      expect(getTabs()).toEqual(["Sketch1*"]);
      expect(getStatus()).toBe("6 files · 1 problem");
      expect(getProblemItem("Project text:9").textContent).toContain(
        "The path cannot have `.` or `..` segments."
      );
    });

    it("should list a line that could not be read as plain content, and not as a button", () => {
      // Arrange
      renderWorkbench({ initialSketch: MISTAKES });
      fireEvent.click(view.getByRole("button", { name: "Text" }));

      // Act
      typeProjectText(`${getProjectText().value}\nsrc/../outside.js`);
      fireEvent.blur(getProjectText());

      // Assert
      expect(
        within(getProblemItem("Project text:9")).queryByRole("button")
      ).toBeNull();
      expect(getProblemItem("Project text:9").tagName).toBe("LI");
      // The rows of the config are still buttons
      expect(getProblemRow("eslint.config.js:15:16")).toBeTruthy();
    });

    it("should open nothing when a line that could not be read is pressed", () => {
      // Arrange
      renderWorkbench();
      fireEvent.click(view.getByRole("button", { name: "Text" }));
      typeProjectText(`${getProjectText().value}\nsrc/../outside.js`);
      fireEvent.blur(getProjectText());

      // Act
      fireEvent.click(getProblemItem("Project text:9"));

      // Assert
      expect(
        within(getNodePane()).getByText("Open a file or the config")
      ).toBeTruthy();
      expect(getTabs()).toEqual(["Sketch1*"]);
    });

    it("should drop the lines that could not be read when the tree comes back", () => {
      // Arrange
      renderWorkbench();
      fireEvent.click(view.getByRole("button", { name: "Text" }));
      typeProjectText(`${getProjectText().value}\nsrc/../outside.js`);
      fireEvent.blur(getProjectText());

      // Act
      fireEvent.click(view.getByRole("button", { name: "Tree" }));

      // Assert
      expect(getTabs()).toEqual(["Sketch*"]);
      expect(getStatus()).toBe("6 files · 0 problems");
    });

    it("should leave nothing in focus when the file in focus is no longer in the text", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);
      fireEvent.click(view.getByRole("button", { name: "Text" }));
      const text = getProjectText();

      // Act
      typeProjectText(
        text.value
          .split("\n")
          .filter((line) => line !== FILE)
          .join("\n")
      );
      fireEvent.blur(text);

      // Assert
      expect(
        within(getNodePane()).getByText("Open a file or the config")
      ).toBeTruthy();
      expect(getTabs()).toEqual(["Sketch*"]);
    });

    it("should keep the file in focus when the text still has it", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);
      fireEvent.click(view.getByRole("button", { name: "Text" }));
      const text = getProjectText();

      // Act
      typeProjectText(`${text.value}\nsrc/extra.js`);
      fireEvent.blur(text);

      // Assert
      expect(within(getNodePane()).getByText(FILE)).toBeTruthy();
      expect(getTabs()).toEqual(["Sketch", "checkout/index.js*"]);
    });
  });

  describe("focus", () => {
    it("should follow a file that is renamed", () => {
      // Arrange
      renderWorkbench();
      openFile("src/index.js");

      // Act
      rename("src/index.js", "main.js");

      // Assert
      expect(within(getNodePane()).getByText("src/main.js")).toBeTruthy();
      expect(getTabs()).toEqual(["Sketch", "src/main.js*"]);
    });

    it("should follow a folder that holds the file and is renamed", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);

      // Act
      rename("src/modules", "features");

      // Assert
      expect(
        within(getNodePane()).getByText("src/features/checkout/index.js")
      ).toBeTruthy();
      expect(getTabs()).toEqual(["Sketch", "checkout/index.js*"]);
    });

    it("should describe the renamed file in the inspector at once, without lagging behind the rename", () => {
      // Arrange
      useFakeTimeouts();
      renderWorkbench();
      openFile(FILE);

      // Act
      rename("src/modules", "features");

      // Assert
      const inspector = view.getByRole("complementary", { name: "Inspector" });

      expect(
        within(inspector).getByText("src/features/checkout/index.js")
      ).toBeTruthy();
      expect(within(inspector).getByText("element")).toBeTruthy();
    });

    it("should show the status of the renamed project at once", () => {
      // Arrange
      useFakeTimeouts();
      renderWorkbench();
      openFile(FILE);

      // Act
      rename("src/modules", "features");

      // Assert
      expect(getStatus()).toBe("6 files · 0 problems");
    });

    it("should keep the tab of the sketch when the file in focus is renamed while that tab is selected", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);
      fireEvent.click(
        within(getProblems()).getByRole("tab", { name: /Sketch/ })
      );

      // Act
      rename("src/modules", "features");

      // Assert
      expect(getTabs()).toEqual(["Sketch*", "checkout/index.js"]);
      expect(
        within(getNodePane()).getByText("src/features/checkout/index.js")
      ).toBeTruthy();
    });

    it("should keep the tab of the file when the file in focus is renamed while that tab is selected", () => {
      // Arrange
      renderWorkbench();
      openFile("src/index.js");

      // Act
      rename("src/index.js", "main.js");

      // Assert
      expect(getTabs()).toEqual(["Sketch", "src/main.js*"]);
    });

    it("should leave nothing in focus when the file in focus is removed", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);

      // Act
      fireEvent.click(view.getByLabelText(`Delete ${FILE}`));

      // Assert
      expect(
        within(getNodePane()).getByText("Open a file or the config")
      ).toBeTruthy();
      expect(getTabs()).toEqual(["Sketch*"]);
    });

    it("should leave nothing in focus when a folder that holds the file in focus is removed", async () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);

      // Act
      fireEvent.click(view.getByLabelText("Delete src/modules"));
      fireEvent.click(view.getByRole("button", { name: "Delete" }));
      await waitForElementToBeRemoved(() => view.queryByRole("dialog"));

      // Assert
      expect(
        within(getNodePane()).getByText("Open a file or the config")
      ).toBeTruthy();
    });

    it("should keep the file in focus when another file is removed", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);

      // Act
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Assert
      expect(within(getNodePane()).getByText(FILE)).toBeTruthy();
    });

    it("should describe the sketch in the inspector at once after a file is removed", () => {
      // Arrange
      useFakeTimeouts();
      renderWorkbench();

      // Act
      fireEvent.click(view.getByLabelText(`Delete ${FILE}`));

      // Assert
      const inspector = view.getByRole("complementary", { name: "Inspector" });

      expect(
        within(inspector).getByText("files").previousSibling?.textContent
      ).toBe("5");
    });
  });

  describe("tabs", () => {
    it("should select the tab of the node when it is opened, and the sketch's when nothing is", () => {
      // Arrange
      renderWorkbench();

      // Act
      openFile(FILE);
      const opened = getTabs();
      fireEvent.click(view.getByLabelText(`Delete ${FILE}`));

      // Assert
      expect(opened).toEqual(["Sketch", "checkout/index.js*"]);
      expect(getTabs()).toEqual(["Sketch*"]);
    });

    it("should show the body of the tab that the user selects", () => {
      // Arrange
      renderWorkbench({ initialSketch: MISTAKES });
      openFile(FILE);

      // Act
      fireEvent.click(
        within(getProblems()).getByRole("tab", { name: /Sketch/ })
      );

      // Assert
      expect(getTabs()).toEqual(["Sketch2*", "checkout/index.js"]);
      expect(getProblemRow("eslint.config.js:5:7")).toBeTruthy();
      expect(
        within(getProblems()).queryByText("No problems in this file.")
      ).toBeNull();
    });

    it("should go back to the tab of the node when the user selects it", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);
      fireEvent.click(
        within(getProblems()).getByRole("tab", { name: /Sketch/ })
      );

      // Act
      fireEvent.click(
        within(getProblems()).getByRole("tab", { name: "checkout/index.js" })
      );

      // Assert
      expect(getTabs()).toEqual(["Sketch", "checkout/index.js*"]);
      expect(
        within(getProblems()).getByText("No problems in this file.")
      ).toBeTruthy();
    });

    it("should select the tab of the node again when another node is opened", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);
      fireEvent.click(
        within(getProblems()).getByRole("tab", { name: /Sketch/ })
      );

      // Act
      openFile(OTHER_FILE);

      // Assert
      expect(getTabs()).toEqual(["Sketch", "format/index.js*"]);
    });

    it("should switch between the tab of a file and the one of the config", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);

      // Act
      openConfig();

      // Assert
      expect(getTabs()).toEqual(["Sketch", "eslint.config.js*"]);
    });
  });

  describe("collapsing the problems", () => {
    it("should show only the head when the user collapses the panel", () => {
      // Arrange
      renderWorkbench();

      // Act
      fireEvent.click(
        within(getProblems()).getByRole("button", {
          name: "Collapse the problems",
        })
      );

      // Assert
      expect(within(getProblems()).queryByRole("tabpanel")).toBeNull();
      expect(
        within(getProblems()).getByRole("button", {
          name: "Expand the problems",
        })
      ).toBeTruthy();
    });

    it("should show the body again when the user expands the panel", () => {
      // Arrange
      renderWorkbench();
      fireEvent.click(
        within(getProblems()).getByRole("button", {
          name: "Collapse the problems",
        })
      );

      // Act
      fireEvent.click(
        within(getProblems()).getByRole("button", {
          name: "Expand the problems",
        })
      );

      // Assert
      expect(within(getProblems()).getByRole("tabpanel")).toBeTruthy();
    });

    it("should expand the panel when the selected tab is pressed", () => {
      // Arrange
      renderWorkbench();
      fireEvent.click(
        within(getProblems()).getByRole("button", {
          name: "Collapse the problems",
        })
      );

      // Act
      fireEvent.click(
        within(getProblems()).getByRole("tab", { name: /Sketch/ })
      );

      // Assert
      expect(within(getProblems()).getByRole("tabpanel")).toBeTruthy();
    });

    it("should expand the panel and select the tab that is pressed when it is another one", () => {
      // Arrange
      renderWorkbench();
      openFile(FILE);
      fireEvent.click(
        within(getProblems()).getByRole("button", {
          name: "Collapse the problems",
        })
      );

      // Act
      fireEvent.click(
        within(getProblems()).getByRole("tab", { name: /Sketch/ })
      );

      // Assert
      expect(getTabs()).toEqual(["Sketch*", "checkout/index.js"]);
      expect(within(getProblems()).getByRole("tabpanel")).toBeTruthy();
    });

    it("should leave the panel collapsed when a file is opened, and select its tab", () => {
      // Arrange
      renderWorkbench();
      fireEvent.click(
        within(getProblems()).getByRole("button", {
          name: "Collapse the problems",
        })
      );

      // Act
      openFile(FILE);

      // Assert
      expect(within(getProblems()).queryByRole("tabpanel")).toBeNull();
      expect(getTabs()).toEqual(["Sketch", "checkout/index.js*"]);
    });
  });

  describe("saving", () => {
    it("should not report the sketch it started from", () => {
      // Act
      const { onSketchChange } = renderWorkbench();

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should not report what is not an edit of the sketch", () => {
      // Arrange
      const { onSketchChange } = renderWorkbench();

      // Act
      openFile(FILE);
      openConfig();
      fireEvent.click(view.getByRole("button", { name: "Text" }));

      // Assert
      expect(onSketchChange).not.toHaveBeenCalled();
    });

    it("should not report the sketch again when it renders with another callback", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const props: WorkbenchProps = {
        initialSketch: QUICK_START,
        capabilities: EDITABLE,
        onSketchChange: first,
      };
      const { rerender } = render(<Workbench {...props} />);
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Act
      rerender(<Workbench {...props} onSketchChange={second} />);

      // Assert
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });

    it("should report the next edit to the callback it renders with", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      const props: WorkbenchProps = {
        initialSketch: QUICK_START,
        capabilities: EDITABLE,
        onSketchChange: first,
      };
      const { rerender } = render(<Workbench {...props} />);
      rerender(<Workbench {...props} onSketchChange={second} />);

      // Act
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Assert
      expect(first).not.toHaveBeenCalled();
      expect(second).toHaveBeenCalledTimes(1);
    });

    it("should report the sketch after an edit of the tree", () => {
      // Arrange
      const { onSketchChange } = renderWorkbench();

      // Act
      fireEvent.click(view.getByLabelText("Delete src/index.js"));

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(
        (onSketchChange.mock.calls[0][0] as Sketch).tree.map(({ path }) => path)
      ).not.toContain("src/index.js");
    });
  });

  describe("instances", () => {
    it("should not share the edits of its sketch with another workbench on the page", () => {
      // Arrange
      const first = jest.fn();
      const second = jest.fn();
      render(
        <>
          <section aria-label="First">
            <Workbench
              initialSketch={QUICK_START}
              capabilities={EDITABLE}
              onSketchChange={first}
            />
          </section>
          <section aria-label="Second">
            <Workbench
              initialSketch={QUICK_START}
              capabilities={EDITABLE}
              onSketchChange={second}
            />
          </section>
        </>
      );
      const [firstProject] = view.getAllByRole("region", { name: "Project" });

      // Act
      fireEvent.click(within(firstProject).getByLabelText(`Delete ${FILE}`));

      // Assert
      expect(
        view.getAllByText(/^\d+ files? ·/).map((bar) => bar.textContent)
      ).toEqual(["5 files · 0 problems", "6 files · 0 problems"]);
      expect(first).toHaveBeenCalledTimes(1);
      expect(second).not.toHaveBeenCalled();
    });

    it("should not share how the project is shown with another workbench on the page", () => {
      // Arrange
      render(
        <>
          <section aria-label="First">
            <Workbench
              initialSketch={QUICK_START}
              capabilities={EDITABLE}
              onSketchChange={jest.fn()}
            />
          </section>
          <section aria-label="Second">
            <Workbench
              initialSketch={QUICK_START}
              capabilities={EDITABLE}
              onSketchChange={jest.fn()}
            />
          </section>
        </>
      );
      const [firstProject, secondProject] = view.getAllByRole("region", {
        name: "Project",
      });

      // Act
      fireEvent.click(
        within(firstProject).getByRole("button", { name: "Text" })
      );

      // Assert
      expect(
        within(firstProject).queryByRole("tree", { name: "Project files" })
      ).toBeNull();
      expect(
        within(secondProject).getByRole("tree", { name: "Project files" })
      ).toBeTruthy();
    });

    it("should not share the open node or the tabs with another workbench", () => {
      // Arrange
      render(
        <>
          <section aria-label="First">
            <Workbench
              initialSketch={QUICK_START}
              capabilities={EDITABLE}
              onSketchChange={jest.fn()}
            />
          </section>
          <section aria-label="Second">
            <Workbench
              initialSketch={MISTAKES}
              capabilities={EDITABLE}
              onSketchChange={jest.fn()}
            />
          </section>
        </>
      );
      const [firstProject] = view.getAllByRole("region", { name: "Project" });

      // Act
      fireEvent.click(within(firstProject).getByTitle(FILE));

      // Assert
      const [firstProblems, secondProblems] = view.getAllByRole("region", {
        name: "Problems",
      });

      expect(
        within(firstProblems)
          .getAllByRole("tab")
          .map((tab) => tab.textContent)
      ).toEqual(["Sketch", "checkout/index.js"]);
      expect(
        within(secondProblems)
          .getAllByRole("tab")
          .map((tab) => tab.textContent)
      ).toEqual(["Sketch2"]);
      expect(
        within(
          view.getAllByRole("region", { name: "Node in focus" })[1]
        ).getByText("Open a file or the config")
      ).toBeTruthy();
    });

    it("should evaluate each workbench with its own sketch", () => {
      // Arrange
      useFakeTimeouts();

      // Act
      render(
        <>
          <section aria-label="First">
            <Workbench
              initialSketch={QUICK_START}
              capabilities={EDITABLE}
              onSketchChange={jest.fn()}
            />
          </section>
          <section aria-label="Second">
            <Workbench
              initialSketch={MISTAKES}
              capabilities={EDITABLE}
              onSketchChange={jest.fn()}
            />
          </section>
        </>
      );

      // Assert
      expect(
        view.getAllByText(/^\d+ files? ·/).map((bar) => bar.textContent)
      ).toEqual(["6 files · 0 problems", "6 files · config has errors"]);
    });

    it("should ignore a sketch that comes after the first, as the workbench owns it from then on", () => {
      // Arrange
      const props: WorkbenchProps = {
        initialSketch: QUICK_START,
        capabilities: EDITABLE,
        onSketchChange: jest.fn(),
      };
      const { rerender } = render(<Workbench {...props} />);

      // Act
      rerender(<Workbench {...props} initialSketch={MISTAKES} />);

      // Assert
      expect(getStatus()).toBe("6 files · 0 problems");
    });
  });
});
