// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests report
import { act } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { EVALUATION_DELAY } from "@/domains/session/data/store";
import { renderInSession } from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";

import { ProblemsPane } from "./ProblemsPane";
import { ProblemsPanePom } from "./ProblemsPane.pom";

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

/** What {@link renderPane} returns: the render of the session, and the page object of the pane. */
type PaneRender = SessionRender & { readonly pane: ProblemsPanePom };

/**
 * Renders the problems pane in a session.
 * @param sketch The sketch to start from.
 * @returns The render, the store, the spy of the sketches and the page object of the pane.
 */
function renderPane(sketch: Sketch = QUICK_START): PaneRender {
  return {
    ...renderInSession(<ProblemsPane />, { sketch }),
    pane: new ProblemsPanePom(),
  };
}

/**
 * Reads the tabs of the panel.
 * @param pane The problems pane.
 * @returns The text of each tab, with `*` after the selected one.
 */
function getTabs(pane: ProblemsPanePom): string[] {
  return pane.panel.tabs.map(
    (tab) => `${tab.text}${tab.isSelected ? "*" : ""}`
  );
}

describe("ProblemsPane", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("the sketch", () => {
    it("should have only the tab of the sketch, selected, when nothing is open", () => {
      // Act
      const { pane } = renderPane();

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch*"]);
      expect(pane.list.emptyText).toBe("No problems in the sketch.");
    });

    it("should list the problems of the config with the count of the tab", () => {
      // Act
      const { pane } = renderPane(MISTAKES);

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch2*"]);
      expect(pane.list.row("eslint.config.js:15:16").message).toContain(
        "Invalid rule options."
      );
      expect(pane.list.row("eslint.config.js:5:7").message).toContain(
        "Some element descriptors are invalid and will be ignored."
      );
    });

    it("should say that the rules are not evaluated while their options are invalid", () => {
      // Act
      const { pane } = renderPane(MISTAKES);

      // Assert
      expect(pane.note.text).toBe(NOTE_TEXT);
    });

    it("should not say it when the options of the rules are valid, even if the config has a warning", () => {
      // Act
      const { pane } = renderPane(WARNING_ONLY);

      // Assert
      expect(pane.note.isRendered).toBe(false);
    });

    it("should not say it for a config without problems", () => {
      // Act
      const { pane } = renderPane();

      // Assert
      expect(pane.note.isRendered).toBe(false);
    });

    it("should list the problems of the config a moment after the config is edited", () => {
      // Arrange
      jest.useFakeTimers();
      const { store, pane } = renderPane();

      // Act
      act(() => store.changeConfig(MISTAKES.config));
      const before = getTabs(pane);
      act(() => {
        jest.advanceTimersByTime(EVALUATION_DELAY);
      });

      // Assert
      expect(before).toEqual(["Sketch*"]);
      expect(getTabs(pane)).toEqual(["Sketch2*"]);
    });
  });

  describe("the rows of the config", () => {
    it("should open the config at the range of the problem when a row is pressed", () => {
      // Arrange
      const { store, pane } = renderPane(MISTAKES);

      // Act
      pane.list.row("eslint.config.js:15:16").press();

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
      const { pane } = renderPane(MISTAKES);

      // Act
      pane.list.row("eslint.config.js:5:7").press();

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch2", "eslint.config.js2*"]);
      expect(pane.note.isRendered).toBe(true);
      expect(pane.list.row("eslint.config.js:15:16").isRendered).toBe(true);
    });

    it("should ask for a new scroll each time the same row is pressed", () => {
      // Arrange
      const { store, pane } = renderPane(MISTAKES);
      pane.list.row("eslint.config.js:15:16").press();
      const first = store.getState().reveal;

      // Act
      pane.list.row("eslint.config.js:15:16").press();

      // Assert
      expect(first?.key).toBe(1);
      expect(store.getState().reveal?.key).toBe(2);
    });

    it("should open the config from a file that was open", () => {
      // Arrange
      const { store, pane } = renderPane(MISTAKES);
      act(() => store.open({ kind: "file", path: FILE }));
      pane.panel.tab(/Sketch/).select();

      // Act
      pane.list.row("eslint.config.js:5:7").press();

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
    function typeLines(store: SessionRender["store"], text: string): void {
      act(() => store.setView("text"));
      act(() => store.setTextDraft(text));
    }

    it("should list the lines that cannot be read in the sketch tab, with their count", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      typeLines(store, "src/index.js\nsrc/../outside.js\n");

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch1*"]);
      expect(pane.list.row("Project text:2").message).toContain(
        "The path cannot have `.` or `..` segments."
      );
    });

    it("should show the line as it was written below the reason", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      typeLines(store, "src/index.js\n  import x from 'y';\n");

      // Assert
      expect(pane.list.row("Project text:2").message).toContain(
        "Dependencies are not written in text mode yet."
      );
      expect(pane.list.row("Project text:2").meta).toContain(
        "  import x from 'y';"
      );
    });

    it("should list them as plain content, and not as buttons", () => {
      // Arrange
      const { store, pane } = renderPane(MISTAKES);

      // Act
      typeLines(store, "src/../outside.js\n");

      // Assert
      expect(pane.list.row("Project text:1").opens).toBe(false);
      expect(pane.list.row("eslint.config.js:15:16").opens).toBe(true);
    });

    it("should open nothing when a line is pressed", () => {
      // Arrange
      const { store, pane } = renderPane();
      typeLines(store, "src/../outside.js\n");
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      pane.list.row("Project text:1").press();

      // Assert
      expect(listener).not.toHaveBeenCalled();
      expect(store.getState().focus).toEqual({ kind: "none" });
    });

    it("should list them together with the problems of the config", () => {
      // Arrange
      const { store, pane } = renderPane(WARNING_ONLY);

      // Act
      typeLines(store, "src/../outside.js\n");

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch2*"]);
      expect(pane.list.rowCount).toBe(2);
    });

    it("should stop listing them when the project goes back to the tree", () => {
      // Arrange
      const { store, pane } = renderPane();
      typeLines(store, "src/../outside.js\n");

      // Act
      act(() => store.setView("tree"));

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch*"]);
      expect(pane.list.emptyText).toBe("No problems in the sketch.");
    });
  });

  describe("a file", () => {
    it("should add its tab and select it", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch", "checkout/index.js*"]);
      expect(pane.list.emptyText).toBe("No problems in this file.");
    });

    it("should change to the tab of another file when another file is opened", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() =>
        store.open({ kind: "file", path: "src/helpers/format/index.js" })
      );

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch", "format/index.js*"]);
    });

    it("should show the body of the tab that the user selects", () => {
      // Arrange
      const { store, pane } = renderPane(MISTAKES);
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      pane.panel.tab(/Sketch/).select();

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch2*", "checkout/index.js"]);
      expect(pane.list.row("eslint.config.js:5:7").isRendered).toBe(true);
      expect(pane.list.emptyText).toBeNull();
    });

    it("should go back to the tab of the file when the user selects it", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      pane.panel.tab(/Sketch/).select();

      // Act
      pane.panel.tab("checkout/index.js").select();

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch", "checkout/index.js*"]);
    });

    it("should leave the tab of the sketch selected when the file is renamed", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      pane.panel.tab(/Sketch/).select();

      // Act
      act(() => {
        store.renameNode("src/modules", "features");
      });

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch*", "checkout/index.js"]);
    });

    it("should go back to the tab of the sketch alone when the file is removed", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch*"]);
    });
  });

  describe("the config", () => {
    it("should add its tab with the count of its problems, and list only those", () => {
      // Arrange
      const { store, pane } = renderPane(MISTAKES);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch2", "eslint.config.js2*"]);
      expect(pane.list.rowCount).toBe(2);
    });

    it("should say there are none in the config when it has no problems", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch", "eslint.config.js*"]);
      expect(pane.list.emptyText).toBe("No problems in the config.");
    });

    it("should not list the lines of text mode in the tab of the config", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.setView("text"));
      act(() => store.setTextDraft("src/../outside.js\n"));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch1", "eslint.config.js*"]);
      expect(pane.list.emptyText).toBe("No problems in the config.");
    });

    it("should say the rules are not evaluated in the tab of the config too", () => {
      // Arrange
      const { store, pane } = renderPane(MISTAKES);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(pane.note.text).toBe(NOTE_TEXT);
    });

    it("should not say it in the tab of a file", () => {
      // Arrange
      const { store, pane } = renderPane(MISTAKES);

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(pane.note.isRendered).toBe(false);
    });

    it("should switch between the tab of a file and the one of the config", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch", "eslint.config.js*"]);
    });
  });

  describe("collapsing", () => {
    it("should show only the head when the user collapses the panel", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      pane.panel.toggle.press();

      // Assert
      expect(store.getState().problemsCollapsed).toBe(true);
      expect(pane.panel.tabPanel().isRendered).toBe(false);
    });

    it("should show the body again when the user expands the panel", () => {
      // Arrange
      const { store, pane } = renderPane();
      pane.panel.toggle.press();

      // Act
      pane.panel.toggle.press();

      // Assert
      expect(store.getState().problemsCollapsed).toBe(false);
      expect(pane.panel.tabPanel().isRendered).toBe(true);
    });

    it("should expand the panel when the selected tab is pressed", () => {
      // Arrange
      const { pane } = renderPane();
      pane.panel.toggle.press();

      // Act
      pane.panel.tab(/Sketch/).select();

      // Assert
      expect(pane.panel.tabPanel().isRendered).toBe(true);
    });

    it("should expand the panel and select the tab that is pressed when it is another one", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      pane.panel.toggle.press();

      // Act
      pane.panel.tab(/Sketch/).select();

      // Assert
      expect(getTabs(pane)).toEqual(["Sketch*", "checkout/index.js"]);
      expect(pane.panel.tabPanel().isRendered).toBe(true);
    });

    it("should leave the panel collapsed when a file is opened, and select its tab", () => {
      // Arrange
      const { store, pane } = renderPane();
      pane.panel.toggle.press();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(pane.panel.tabPanel().isRendered).toBe(false);
      expect(getTabs(pane)).toEqual(["Sketch", "checkout/index.js*"]);
    });
  });
});
