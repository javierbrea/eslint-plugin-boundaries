// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests show
import { EditorView } from "@codemirror/view";
import {
  act,
  fireEvent,
  render,
  screen as view,
  waitForElementToBeRemoved,
  within,
} from "@testing-library/react";

import type { ProjectCapabilities, Sketch } from "../contract";
import { evaluate } from "../engine";
import { QUICK_START_EXAMPLE } from "../examples";

import { stubResizeObserver } from "./layout/StubResizeObserver";
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

    it("should carry the note for narrow screens, which the CSS shows below the breakpoint", () => {
      // Act
      renderWorkbench();

      // Assert
      expect(
        view.getByText(
          "The playground needs a wider screen. Open this page on a desktop browser to use it."
        )
      ).toBeTruthy();
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

    it("should count the problems of a config that has only warnings, and not say it has errors", () => {
      // Act
      renderWorkbench({ initialSketch: WARNING_ONLY });

      // Assert
      expect(getStatus()).toBe("6 files · 1 problem");
    });

    it("should count the files with the sketch that an edit makes, a moment after it", () => {
      // Arrange
      useFakeTimeouts();
      renderWorkbench();

      // Act
      fireEvent.click(view.getByLabelText("Delete src/index.js"));
      const before = getStatus();
      wait(EVALUATION_WAIT);

      // Assert
      expect(before).toBe("6 files · 0 problems");
      expect(getStatus()).toBe("5 files · 0 problems");
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
      expect(within(getProject()).getByTitle("new-file.js")).toBeTruthy();
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect(
        (onSketchChange.mock.calls[0][0] as Sketch).tree.map(({ path }) => path)
      ).toContain("new-file.js");
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

    it("should not scroll the editor to an old range when the config is opened again", () => {
      // Arrange
      const { container } = renderWorkbench({ initialSketch: MISTAKES });
      fireEvent.click(getProblemRow("eslint.config.js:15:16"));
      openFile(FILE);

      // Act
      openConfig();

      // Assert
      expect(getCursor(container)).toBe(0);
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
      wait(EVALUATION_WAIT);

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
      expect(getProblemRow("Project text:9").textContent).toContain(
        "The path cannot have `.` or `..` segments."
      );
    });

    it("should open nothing when a line that could not be read is pressed", () => {
      // Arrange
      renderWorkbench();
      fireEvent.click(view.getByRole("button", { name: "Text" }));
      typeProjectText(`${getProjectText().value}\nsrc/../outside.js`);
      fireEvent.blur(getProjectText());

      // Act
      fireEvent.click(getProblemRow("Project text:9"));

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

    it("should describe the renamed file in the inspector a moment after the rename", () => {
      // Arrange
      useFakeTimeouts();
      renderWorkbench();
      openFile(FILE);

      // Act
      rename("src/modules", "features");
      const inspector = view.getByRole("complementary", { name: "Inspector" });
      const before = within(inspector).queryByText("element");
      wait(EVALUATION_WAIT);

      // Assert
      expect(before).toBeNull();
      expect(within(inspector).getByText("element")).toBeTruthy();
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
});
