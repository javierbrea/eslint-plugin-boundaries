// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests report
import { act, fireEvent, screen as view, within } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/examples";
import { EVALUATION_DELAY } from "@/ui/state";
import { renderInWorkbench } from "@/ui/state/__fixtures__/RenderInWorkbench";
import type { WorkbenchRender } from "@/ui/state/__fixtures__/RenderInWorkbench";

import { ProblemsPane } from "./ProblemsPane";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const FILE = "src/modules/checkout/index.js";

const NOTE_TEXT =
  "Dependencies are not evaluated while the rule options are invalid: ESLint does not run a rule whose options fail its schema.";

/** The quick-start config with a wrong option of the rule, which is an error, and a wrong key of an element descriptor, which is a warning */
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

/**
 * Renders the problems pane in a workbench.
 * @param sketch The sketch to start from.
 * @returns The render, the store and the spy of the sketches.
 */
function renderPane(sketch: Sketch = QUICK_START): WorkbenchRender {
  return renderInWorkbench(<ProblemsPane />, { sketch });
}

/**
 * Reads the tabs of the panel.
 * @returns The text of each tab, with `*` after the selected one.
 */
function getTabs(): string[] {
  return view
    .getAllByRole("tab")
    .map(
      (tab) =>
        `${tab.textContent}${tab.getAttribute("aria-selected") === "true" ? "*" : ""}`
    );
}

/**
 * Gets the row of the list that starts with a location, whether it opens something or not.
 * @param startsWith What the row says first, such as `eslint.config.js:15:16`.
 * @returns The item of the list.
 */
function getItem(startsWith: string): HTMLElement {
  return view
    .getAllByRole("listitem")
    .find((item) => item.textContent?.startsWith(startsWith)) as HTMLElement;
}

/**
 * Gets the button of a row that opens something.
 * @param startsWith What the row says first, such as `eslint.config.js:15:16`.
 * @returns The button.
 */
function getRow(startsWith: string): HTMLElement {
  return within(getItem(startsWith)).getByRole("button");
}

describe("ProblemsPane", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("the sketch", () => {
    it("should have only the tab of the sketch, selected, when nothing is open", () => {
      // Act
      renderPane();

      // Assert
      expect(getTabs()).toEqual(["Sketch*"]);
      expect(view.getByText("No problems in the sketch.")).toBeTruthy();
    });

    it("should list the problems of the config with the count of the tab", () => {
      // Act
      renderPane(MISTAKES);

      // Assert
      expect(getTabs()).toEqual(["Sketch2*"]);
      expect(getRow("eslint.config.js:15:16").textContent).toContain(
        "Invalid rule options."
      );
      expect(getRow("eslint.config.js:5:7").textContent).toContain(
        "Some element descriptors are invalid and will be ignored."
      );
    });

    it("should say that the rules are not evaluated while their options are invalid", () => {
      // Act
      renderPane(MISTAKES);

      // Assert
      expect(view.getByRole("note").textContent).toBe(NOTE_TEXT);
    });

    it("should not say it when the options of the rules are valid, even if the config has a warning", () => {
      // Act
      renderPane(WARNING_ONLY);

      // Assert
      expect(view.queryByRole("note")).toBeNull();
    });

    it("should not say it for a config without problems", () => {
      // Act
      renderPane();

      // Assert
      expect(view.queryByRole("note")).toBeNull();
    });

    it("should list the problems of the config a moment after the config is edited", () => {
      // Arrange
      jest.useFakeTimers();
      const { store } = renderPane();

      // Act
      act(() => store.changeConfig(MISTAKES.config));
      const before = getTabs();
      act(() => {
        jest.advanceTimersByTime(EVALUATION_DELAY);
      });

      // Assert
      expect(before).toEqual(["Sketch*"]);
      expect(getTabs()).toEqual(["Sketch2*"]);
    });
  });

  describe("the rows of the config", () => {
    it("should open the config at the range of the problem when a row is pressed", () => {
      // Arrange
      const { store } = renderPane(MISTAKES);

      // Act
      fireEvent.click(getRow("eslint.config.js:15:16"));

      // Assert
      const state = store.getState();

      expect(state.focus).toEqual({ kind: "config" });
      expect(state.tab).toBe("node");
      expect(state.reveal?.range).toEqual(
        expect.objectContaining({
          from: MISTAKES.config.indexOf('"dissallow"'),
          line: 15,
          column: 16,
        })
      );
    });

    it("should select the tab of the config, and keep the problems and the note in it", () => {
      // Arrange
      renderPane(MISTAKES);

      // Act
      fireEvent.click(getRow("eslint.config.js:5:7"));

      // Assert
      expect(getTabs()).toEqual(["Sketch2", "eslint.config.js2*"]);
      expect(view.getByRole("note")).toBeTruthy();
      expect(getRow("eslint.config.js:15:16")).toBeTruthy();
    });

    it("should ask for a new scroll each time the same row is pressed", () => {
      // Arrange
      const { store } = renderPane(MISTAKES);
      fireEvent.click(getRow("eslint.config.js:15:16"));
      const first = store.getState().reveal;

      // Act
      fireEvent.click(getRow("eslint.config.js:15:16"));

      // Assert
      expect(first?.key).toBe(1);
      expect(store.getState().reveal?.key).toBe(2);
    });

    it("should open the config from a file that was open", () => {
      // Arrange
      const { store } = renderPane(MISTAKES);
      act(() => store.open({ kind: "file", path: FILE }));
      fireEvent.click(view.getByRole("tab", { name: /Sketch/ }));

      // Act
      fireEvent.click(getRow("eslint.config.js:5:7"));

      // Assert
      expect(store.getState().focus).toEqual({ kind: "config" });
    });
  });

  describe("the rows of text mode", () => {
    /**
     * Types lines that cannot be read in the text of the project.
     * @param store The store of the render.
     * @param text The whole text.
     */
    function typeLines(store: WorkbenchRender["store"], text: string): void {
      act(() => store.setView("text"));
      act(() => store.setTextDraft(text));
    }

    it("should list the lines that cannot be read in the sketch tab, with their count", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      typeLines(store, "src/index.js\nsrc/../outside.js\n");

      // Assert
      expect(getTabs()).toEqual(["Sketch1*"]);
      expect(getItem("Project text:2").textContent).toContain(
        "The path cannot have `.` or `..` segments."
      );
    });

    it("should show the line as it was written below the reason", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      typeLines(store, "src/index.js\n  import x from 'y';\n");

      // Assert
      expect(getItem("Project text:2").textContent).toContain(
        "Dependencies are not written in text mode yet."
      );
      expect(getItem("Project text:2").textContent).toContain(
        "  import x from 'y';"
      );
    });

    it("should list them as plain content, and not as buttons", () => {
      // Arrange
      const { store } = renderPane(MISTAKES);

      // Act
      typeLines(store, "src/../outside.js\n");

      // Assert
      expect(
        within(getItem("Project text:1")).queryByRole("button")
      ).toBeNull();
      expect(
        within(getItem("eslint.config.js:15:16")).getByRole("button")
      ).toBeTruthy();
    });

    it("should open nothing when a line is pressed", () => {
      // Arrange
      const { store } = renderPane();
      typeLines(store, "src/../outside.js\n");
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      fireEvent.click(getItem("Project text:1"));

      // Assert
      expect(listener).not.toHaveBeenCalled();
      expect(store.getState().focus).toEqual({ kind: "none" });
    });

    it("should list them together with the problems of the config", () => {
      // Arrange
      const { store } = renderPane(WARNING_ONLY);

      // Act
      typeLines(store, "src/../outside.js\n");

      // Assert
      expect(getTabs()).toEqual(["Sketch2*"]);
      expect(view.getAllByRole("listitem")).toHaveLength(2);
    });

    it("should stop listing them when the project goes back to the tree", () => {
      // Arrange
      const { store } = renderPane();
      typeLines(store, "src/../outside.js\n");

      // Act
      act(() => store.setView("tree"));

      // Assert
      expect(getTabs()).toEqual(["Sketch*"]);
      expect(view.getByText("No problems in the sketch.")).toBeTruthy();
    });
  });

  describe("a file", () => {
    it("should add its tab and select it", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(getTabs()).toEqual(["Sketch", "checkout/index.js*"]);
      expect(view.getByText("No problems in this file.")).toBeTruthy();
    });

    it("should change to the tab of another file when another file is opened", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() =>
        store.open({ kind: "file", path: "src/helpers/format/index.js" })
      );

      // Assert
      expect(getTabs()).toEqual(["Sketch", "format/index.js*"]);
    });

    it("should show the body of the tab that the user selects", () => {
      // Arrange
      const { store } = renderPane(MISTAKES);
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      fireEvent.click(view.getByRole("tab", { name: /Sketch/ }));

      // Assert
      expect(getTabs()).toEqual(["Sketch2*", "checkout/index.js"]);
      expect(getRow("eslint.config.js:5:7")).toBeTruthy();
      expect(view.queryByText("No problems in this file.")).toBeNull();
    });

    it("should go back to the tab of the file when the user selects it", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      fireEvent.click(view.getByRole("tab", { name: /Sketch/ }));

      // Act
      fireEvent.click(view.getByRole("tab", { name: "checkout/index.js" }));

      // Assert
      expect(getTabs()).toEqual(["Sketch", "checkout/index.js*"]);
    });

    it("should leave the tab of the sketch selected when the file is renamed", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      fireEvent.click(view.getByRole("tab", { name: /Sketch/ }));

      // Act
      act(() => {
        store.renameNode("src/modules", "features");
      });

      // Assert
      expect(getTabs()).toEqual(["Sketch*", "checkout/index.js"]);
    });

    it("should go back to the tab of the sketch alone when the file is removed", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(getTabs()).toEqual(["Sketch*"]);
    });
  });

  describe("the config", () => {
    it("should add its tab with the count of its problems, and list only those", () => {
      // Arrange
      const { store } = renderPane(MISTAKES);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getTabs()).toEqual(["Sketch2", "eslint.config.js2*"]);
      expect(view.getAllByRole("listitem")).toHaveLength(2);
    });

    it("should say there are none in the config when it has no problems", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getTabs()).toEqual(["Sketch", "eslint.config.js*"]);
      expect(view.getByText("No problems in the config.")).toBeTruthy();
    });

    it("should not list the lines of text mode in the tab of the config", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.setView("text"));
      act(() => store.setTextDraft("src/../outside.js\n"));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getTabs()).toEqual(["Sketch1", "eslint.config.js*"]);
      expect(view.getByText("No problems in the config.")).toBeTruthy();
    });

    it("should say the rules are not evaluated in the tab of the config too", () => {
      // Arrange
      const { store } = renderPane(MISTAKES);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(view.getByRole("note").textContent).toBe(NOTE_TEXT);
    });

    it("should not say it in the tab of a file", () => {
      // Arrange
      const { store } = renderPane(MISTAKES);

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(view.queryByRole("note")).toBeNull();
    });

    it("should switch between the tab of a file and the one of the config", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getTabs()).toEqual(["Sketch", "eslint.config.js*"]);
    });
  });

  describe("collapsing", () => {
    it("should show only the head when the user collapses the panel", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      fireEvent.click(
        view.getByRole("button", { name: "Collapse the problems" })
      );

      // Assert
      expect(store.getState().problemsCollapsed).toBe(true);
      expect(view.queryByRole("tabpanel")).toBeNull();
    });

    it("should show the body again when the user expands the panel", () => {
      // Arrange
      const { store } = renderPane();
      fireEvent.click(
        view.getByRole("button", { name: "Collapse the problems" })
      );

      // Act
      fireEvent.click(
        view.getByRole("button", { name: "Expand the problems" })
      );

      // Assert
      expect(store.getState().problemsCollapsed).toBe(false);
      expect(view.getByRole("tabpanel")).toBeTruthy();
    });

    it("should expand the panel when the selected tab is pressed", () => {
      // Arrange
      renderPane();
      fireEvent.click(
        view.getByRole("button", { name: "Collapse the problems" })
      );

      // Act
      fireEvent.click(view.getByRole("tab", { name: /Sketch/ }));

      // Assert
      expect(view.getByRole("tabpanel")).toBeTruthy();
    });

    it("should expand the panel and select the tab that is pressed when it is another one", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      fireEvent.click(
        view.getByRole("button", { name: "Collapse the problems" })
      );

      // Act
      fireEvent.click(view.getByRole("tab", { name: /Sketch/ }));

      // Assert
      expect(getTabs()).toEqual(["Sketch*", "checkout/index.js"]);
      expect(view.getByRole("tabpanel")).toBeTruthy();
    });

    it("should leave the panel collapsed when a file is opened, and select its tab", () => {
      // Arrange
      const { store } = renderPane();
      fireEvent.click(
        view.getByRole("button", { name: "Collapse the problems" })
      );

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(view.queryByRole("tabpanel")).toBeNull();
      expect(getTabs()).toEqual(["Sketch", "checkout/index.js*"]);
    });
  });
});
