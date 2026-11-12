// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests report
import { act } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { LATE_AFTER } from "@/domains/evaluation/helpers/evaluator";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { EVALUATION_DELAY } from "@/domains/session/data/store";
import {
  failEvaluation,
  leaveNothingOpen,
  releaseEvaluation,
  renderInSession,
  waitUntilEvaluationIsLate,
  waitUntilEvaluationStops,
} from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";
import type { PolicyHighlight } from "@/domains/session/helpers/focus";
import { holdInlineWorkers } from "@/shared/testing/inlineWorker";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { ProblemsPane } from "./ProblemsPane";
import { ProblemsPanePom } from "./ProblemsPane.pom";

/** The quick start with its nine dependencies, two of which fail */
const FULL_QUICK_START = QUICK_START_EXAMPLE.sketch;

/** The quick start without dependencies, so that the config and the tree are what the pane lists */
const QUICK_START: Sketch = { ...FULL_QUICK_START, dependencies: [] };

const FORMAT = "src/helpers/format/index.js";

const BUTTON_SOURCE = "../../components/atoms/Button/index.js";

const BUTTON_SPEC_SOURCE = "../../components/atoms/Button/Button.spec.js";

const TEST_MESSAGE =
  'Dependencies to file of category "test" are not allowed. Denied by policy at index 2';

const DEFAULT_MESSAGE =
  'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"';

const FILE = "src/modules/checkout/index.js";

/** A file that a sketch is given, to be opened and removed so that nothing is open */
const SPARE_FILE = "spare.js";

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
 * Adds a spare file to a sketch, which a spec opens and removes with `leaveNothingOpen` to leave nothing open: the sketch that is left is the one given.
 * @param sketch The sketch.
 * @returns The sketch with a file more, at the end of its tree.
 */
function withSpareFile(sketch: Sketch): Sketch {
  return {
    ...sketch,
    tree: [...sketch.tree, { path: SPARE_FILE, kind: "file" }],
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

  describe("the panel", () => {
    it("should be the landmark of the problems", () => {
      // Act
      const { pane } = renderPane();

      // Assert
      expect(pane.panel.isRegionNamed("Problems")).toBe(true);
    });
  });

  describe("the sketch", () => {
    it("should have only the tab of the sketch, selected, when nothing is open", () => {
      // Arrange
      const { store, pane } = renderPane(withSpareFile(QUICK_START));

      // Act
      leaveNothingOpen(store, SPARE_FILE);

      // Assert
      expect(getTabs(pane)).toEqual(["Project*"]);
      expect(pane.list.emptyText).toBe("No problems in the project.");
    });

    it("should list the problems of the config with the count of the tab", () => {
      // Act
      const { pane } = renderPane(MISTAKES);

      // Assert
      expect(getTabs(pane)).toEqual(["Project2*", "eslint.config.js2"]);
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
      expect(before).toEqual(["Project*", "eslint.config.js"]);
      expect(getTabs(pane)).toEqual(["Project2*", "eslint.config.js2"]);
    });
  });

  describe("the rows of the config", () => {
    it("should open the config at the range of the problem when a row is pressed", () => {
      // Arrange
      const { store, pane } = renderPane(withSpareFile(MISTAKES));

      leaveNothingOpen(store, SPARE_FILE);

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
      expect(getTabs(pane)).toEqual(["Project2", "eslint.config.js2*"]);
      expect(pane.note.isRendered).toBe(true);
      expect(pane.list.row("eslint.config.js:15:16").opens).toBe(true);
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
      pane.panel.tab(/Project/).select();

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
      expect(getTabs(pane)).toEqual(["Project1*", "eslint.config.js"]);
      expect(pane.list.row("Project text:2").message).toContain(
        "The path cannot have `.` or `..` segments."
      );
    });

    it("should show the line as it was written below the reason", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      typeLines(store, "src/index.js\n  import x from './y';\n");

      // Assert
      expect(pane.list.row("Project text:2").message).toContain(
        '"./y" does not resolve to a file of the project.'
      );
      expect(pane.list.row("Project text:2").meta).toContain(
        "  import x from './y';"
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

    it("should open nothing, and leave the config in focus, when a line is pressed", () => {
      // Arrange
      const { store, pane } = renderPane();
      typeLines(store, "src/../outside.js\n");
      const listener = jest.fn();

      store.subscribe(listener);

      // Act
      pane.list.row("Project text:1").press();

      // Assert
      expect(listener).not.toHaveBeenCalled();
      expect(store.getState().focus).toEqual({ kind: "config" });
    });

    it("should list them together with the problems of the config", () => {
      // Arrange
      const { store, pane } = renderPane(WARNING_ONLY);

      // Act
      typeLines(store, "src/../outside.js\n");

      // Assert
      expect(getTabs(pane)).toEqual(["Project2*", "eslint.config.js1"]);
      expect(pane.list.rowCount).toBe(2);
    });

    it("should stop listing them when the project goes back to the tree", () => {
      // Arrange
      const { store, pane } = renderPane();
      typeLines(store, "src/../outside.js\n");

      // Act
      act(() => store.setView("tree"));

      // Assert
      expect(getTabs(pane)).toEqual(["Project*", "eslint.config.js"]);
      expect(pane.list.emptyText).toBe("No problems in the project.");
    });
  });

  describe("a file", () => {
    it("should add its tab and select it", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(getTabs(pane)).toEqual(["Project", "checkout/index.js*"]);
      expect(pane.list.emptyText).toBe("No problems in this file.");
      expect(pane.panel.holds("No problems in this file.")).toBe(true);
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
      expect(getTabs(pane)).toEqual(["Project", "format/index.js*"]);
    });

    it("should show the body of the tab that the user selects", () => {
      // Arrange
      const { store, pane } = renderPane(MISTAKES);
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      pane.panel.tab(/Project/).select();

      // Assert
      expect(getTabs(pane)).toEqual(["Project2*", "checkout/index.js"]);
      expect(pane.list.row("eslint.config.js:5:7").opens).toBe(true);
      expect(pane.panel.holds("No problems in this file.")).toBe(false);
    });

    it("should go back to the tab of the file when the user selects it", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      pane.panel.tab(/Project/).select();

      // Act
      pane.panel.tab("checkout/index.js").select();

      // Assert
      expect(getTabs(pane)).toEqual(["Project", "checkout/index.js*"]);
    });

    it("should leave the tab of the sketch selected when the file is renamed", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      pane.panel.tab(/Project/).select();

      // Act
      act(() => {
        store.renameNode("src/modules", "features");
      });

      // Assert
      expect(getTabs(pane)).toEqual(["Project*", "checkout/index.js"]);
    });

    it("should go back to the tab of the sketch alone when the file is removed", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(getTabs(pane)).toEqual(["Project*"]);
    });
  });

  describe("the config", () => {
    it("should add its tab with the count of its problems, and list only those", () => {
      // Arrange
      const { store, pane } = renderPane(withSpareFile(MISTAKES));

      leaveNothingOpen(store, SPARE_FILE);

      const before = getTabs(pane);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(before).toEqual(["Project2*"]);
      expect(getTabs(pane)).toEqual(["Project2", "eslint.config.js2*"]);
      expect(pane.list.rowCount).toBe(2);
    });

    it("should say there are none in the config when it has no problems", () => {
      // Arrange
      const { store, pane } = renderPane();

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getTabs(pane)).toEqual(["Project", "eslint.config.js*"]);
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
      expect(getTabs(pane)).toEqual(["Project1", "eslint.config.js*"]);
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
      expect(getTabs(pane)).toEqual(["Project", "eslint.config.js*"]);
    });
  });

  describe("the failing dependencies", () => {
    describe("under the sketch's tab", () => {
      it("should count them in the tab and list them after the problems, as the mockup does", () => {
        // Act
        const { pane } = renderPane(FULL_QUICK_START);

        // Assert
        expect(getTabs(pane)).toEqual(["Project2*", "eslint.config.js"]);
        expect(pane.list.rows.map((row) => row.locationWithPosition)).toEqual([
          `${FORMAT}:1 → ${BUTTON_SOURCE}`,
          `${FILE}:3 → ${BUTTON_SPEC_SOURCE}`,
        ]);
      });

      it("should say the message of the plugin and the policy that disallowed each", () => {
        // Act
        const { pane } = renderPane(FULL_QUICK_START);

        // Assert
        expect(pane.list.row(`${FORMAT}:1`).message).toBe(DEFAULT_MESSAGE);
        expect(pane.list.row(`${FORMAT}:1`).meta).toBe("disallowed · default");
        expect(pane.list.row(`${FILE}:3`).message).toBe(TEST_MESSAGE);
        expect(pane.list.row(`${FILE}:3`).meta).toBe("disallowed · policy 2");
      });

      it("should draw each with the cross of an error", () => {
        // Act
        const { pane } = renderPane(FULL_QUICK_START);

        // Assert
        const { icon } = pane.list.row(`${FILE}:3`);

        expect(icon.pathData).toBe(ICON_PATHS.cross);
        expect(icon.wrapperStyle.color).toBe("var(--jsb-bad)");
      });

      it("should list them together with the problems of the config", () => {
        // Act
        const { pane } = renderPane({
          ...FULL_QUICK_START,
          config: MISTAKES.config,
        });

        // Assert
        expect(getTabs(pane)).toEqual(["Project2*", "eslint.config.js2"]);
        expect(pane.list.row("eslint.config.js:5:7").opens).toBe(true);
      });

      it("should draw the failing dependency as a warning when the rule is one, and not count it as an error", () => {
        // Act
        const { pane } = renderPane({
          ...FULL_QUICK_START,
          config: FULL_QUICK_START.config.replace(
            '"boundaries/dependencies": [2,',
            '"boundaries/dependencies": [1,'
          ),
        });

        // Assert
        expect(pane.list.row(`${FILE}:3`).icon.pathData).toBe(ICON_PATHS.warn);
        expect(pane.list.row(`${FILE}:3`).icon.wrapperStyle.color).toBe(
          "var(--jsb-warn)"
        );
        expect(pane.panel.tab(/Project/).badge.isRendered).toBe(true);
      });

      it("should put the dependency in focus when its row is pressed, and select the tab of the dependency", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        pane.list.row(`${FILE}:3`).press();

        // Assert
        expect(store.getState().focus).toEqual({
          kind: "dependency",
          path: FILE,
          index: 2,
        });
        expect(getTabs(pane)).toEqual([
          "Project2",
          "checkout/index.js1",
          "line 3*",
        ]);
      });

      it("should say nothing about dependencies when the sketch has none that fail", () => {
        // Act
        const { pane } = renderPane({
          ...FULL_QUICK_START,
          dependencies: FULL_QUICK_START.dependencies.slice(0, 3),
        });

        // Assert
        expect(getTabs(pane)).toEqual(["Project*", "eslint.config.js"]);
        expect(pane.list.emptyText).toBe("No problems in the project.");
      });
    });

    describe("under the tab of a file", () => {
      it("should count the failing dependencies of the file and list them with the line and the source", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        act(() => store.open({ kind: "file", path: FILE }));

        // Assert
        expect(getTabs(pane)).toEqual(["Project2", "checkout/index.js1*"]);
        expect(pane.list.rows.map((row) => row.text)).toEqual([
          `:3 ${BUTTON_SPEC_SOURCE}${TEST_MESSAGE}disallowed · policy 2`,
        ]);
        expect(pane.list.row(":3").location).toBe("");
        expect(pane.list.row(":3").source).toBe(`${BUTTON_SPEC_SOURCE}`);
      });

      it("should not list the failing dependencies of other files", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        act(() => store.open({ kind: "file", path: FORMAT }));

        // Assert
        expect(pane.list.rowCount).toBe(1);
        expect(pane.list.row(":1").meta).toBe("disallowed · default");
      });

      it("should say there are no problems in a file that has no failing dependency", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        act(() => store.open({ kind: "file", path: "src/index.js" }));

        // Assert
        expect(getTabs(pane)).toEqual(["Project2", "src/index.js*"]);
        expect(pane.list.emptyText).toBe("No problems in this file.");
      });

      it("should put the dependency in focus when a row is pressed", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        act(() => store.open({ kind: "file", path: FILE }));

        // Act
        pane.list.row(":3").press();

        // Assert
        expect(getTabs(pane)).toEqual([
          "Project2",
          "checkout/index.js1",
          "line 3*",
        ]);
      });
    });

    describe("under the tab of a dependency", () => {
      /**
       * Puts a dependency of the quick start in focus.
       * @param store The store of the render.
       * @param path The file that has it.
       * @param index Its position among the dependencies of the file.
       */
      function focusDependency(
        store: SessionRender["store"],
        path: string,
        index: number
      ): void {
        act(() => store.open({ kind: "dependency", path, index }));
      }

      it("should add the tab of the dependency after the one of its file, with the icon of its verdict and no count, and select it", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        focusDependency(store, FILE, 2);

        // Assert
        expect(getTabs(pane)).toEqual([
          "Project2",
          "checkout/index.js1",
          "line 3*",
        ]);
        expect(pane.panel.tab("line 3").icon.pathData).toBe(ICON_PATHS.cross);
        expect(pane.panel.tab("line 3").icon.wrapperStyle.color).toBe(
          "var(--jsb-bad)"
        );
        expect(pane.panel.tab("line 3").hasBadge).toBe(false);
      });

      it("should say the verdict, where the dependency is and the message", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        focusDependency(store, FILE, 2);

        // Assert
        expect(pane.detail.verdictText).toBe("disallowed · policy 2");
        expect(pane.detail.verdictColor).toBe("var(--jsb-bad)");
        expect(pane.detail.locationText).toBe(
          `${FILE}:3 → ${BUTTON_SPEC_SOURCE}`
        );
        expect(pane.detail.message).toBe(TEST_MESSAGE);
      });

      it("should say where the dependency is as its row in the list of the sketch does", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        const { locationWithPosition } = pane.list.row(`${FILE}:3`);

        // Act
        focusDependency(store, FILE, 2);

        // Assert
        expect(pane.detail.locationText).toBe(locationWithPosition);
      });

      it("should name the policy that decided it, and show it as it is written in the config", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        focusDependency(store, FILE, 2);

        // Assert
        expect(pane.detail.policyHeadTexts).toEqual([
          "Policy",
          "policies[2]",
          "Open in config",
        ]);
        expect(pane.detail.policyCardText).toBe(
          [
            "{",
            "  // No element may import a test file, whatever element it belongs to",
            '  disallow: { to: { file: { categories: "test" } } },',
            "}",
          ].join("\n")
        );
      });

      it("should name the default as the policy and show it when the default decided", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        focusDependency(store, FORMAT, 0);

        // Assert
        expect(pane.detail.verdictText).toBe("disallowed · default");
        expect(pane.detail.policyHeadTexts).toEqual([
          "Policy",
          "default",
          "Open in config",
        ]);
        expect(pane.detail.policyCardText).toBe('"disallow"');
      });

      it("should say that an allowed dependency is allowed, with its policy and no message", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        focusDependency(store, FILE, 0);

        // Assert
        expect(pane.detail.verdictText).toBe("allowed · policy 1");
        expect(pane.detail.verdictColor).toBe("var(--jsb-ok)");
        expect(pane.detail.message).toBeNull();
        expect(pane.panel.tab("line 1").icon.pathData).toBe(ICON_PATHS.check);
        expect(pane.panel.tab("line 1").icon.wrapperStyle.color).toBe(
          "var(--jsb-ok)"
        );
      });

      it("should say why a dependency is not checked, in the faint tone of a skipped verdict", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        focusDependency(store, FILE, 3);

        // Assert
        expect(pane.detail.verdictText).toBe("not checked · external");
        expect(pane.detail.verdictColor).toBe("var(--jsb-faint)");
        expect(pane.detail.message).toContain("the dependency is not local");
        expect(pane.panel.tab("line 4").icon.pathData).toBe(ICON_PATHS.skip);
      });

      it("should offer no policy for a dependency that is not checked, and say the module it imports", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);

        // Act
        focusDependency(store, FILE, 3);

        // Assert
        expect(pane.detail.locationText).toBe(`${FILE}:4 → react`);
        expect(pane.detail.hasPolicyColumn).toBe(false);
        expect(pane.detail.canOpenPolicy).toBe(false);
        expect(pane.detail.policyCardText).toBeNull();
      });

      it("should say that a dependency is not evaluated while no rule is written", () => {
        // Arrange
        const { store, pane } = renderPane({
          ...FULL_QUICK_START,
          config: "{ settings: {}, rules: {} }",
        });

        // Act
        focusDependency(store, FILE, 2);

        // Assert
        expect(pane.detail.verdictText).toBe("not evaluated");
        expect(pane.detail.hasPolicyColumn).toBe(false);
        expect(pane.detail.canOpenPolicy).toBe(false);
        expect(pane.panel.tab("line 3").icon.pathData).toBe(ICON_PATHS.skip);
      });

      it("should open the config at the policy when Open in config is pressed, keeping where it came from", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);

        // Act
        pane.detail.openPolicy();

        // Assert
        const state = store.getState();

        expect(state.focus).toEqual({ kind: "config" });
        expect(state.highlight?.dependency).toEqual({ path: FILE, index: 2 });
        expect(state.highlight?.range).toEqual(state.reveal?.range);
        expect(state.highlight?.range.from).toBe(
          FULL_QUICK_START.config.indexOf(
            "{\n          // No element may import a test file"
          )
        );
      });

      it("should name the dependency in the note of the config tab, which has no problems", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);

        // Act
        pane.detail.openPolicy();

        // Assert
        expect(getTabs(pane)).toEqual(["Project2", "eslint.config.js*"]);
        expect(pane.notes.map((note) => note.text)).toEqual([
          `No problems in the config. Policy 2 is highlighted, opened from the dependency at line 3 of ${FILE}.`,
        ]);
        expect(pane.list.isRendered).toBe(false);
      });

      it("should say the default is highlighted when the default decided", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FORMAT, 0);

        // Act
        pane.detail.openPolicy();

        // Assert
        expect(pane.note.text).toBe(
          `No problems in the config. The default is highlighted, opened from the dependency at line 1 of ${FORMAT}.`
        );
      });

      it("should keep the note while the config stays in focus, and drop it when a file opens", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);
        pane.detail.openPolicy();

        // Act
        pane.panel.tab(/Project/).select();
        const keptWhileSketchShows = store.getState().highlight !== undefined;
        pane.panel.tab("eslint.config.js").select();
        const noteAfterReturn = pane.note.isRendered;
        act(() => store.open({ kind: "file", path: FILE }));
        act(() => store.open({ kind: "config" }));

        // Assert
        expect(keptWhileSketchShows).toBe(true);
        expect(noteAfterReturn).toBe(true);
        expect(pane.note.isRendered).toBe(false);
      });

      it("should keep naming the policy when the config is edited before it", () => {
        // Arrange
        jest.useFakeTimers();
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);
        pane.detail.openPolicy();
        const comment = "// A comment before everything\n";
        const { range } = store.getState().highlight as PolicyHighlight;

        // Act
        // The editor reports the range of the policy, moved by the edit, with the text
        act(() =>
          store.changeConfig(`${comment}${FULL_QUICK_START.config}`, {
            ...range,
            from: range.from + comment.length,
            to: range.to + comment.length,
            line: range.line + 1,
          })
        );
        act(() => {
          jest.advanceTimersByTime(EVALUATION_DELAY);
        });

        // Assert
        expect(pane.note.text).toBe(
          `No problems in the config. Policy 2 is highlighted, opened from the dependency at line 3 of ${FILE}.`
        );
      });

      it("should name the policy by its new index when a policy is put before it", () => {
        // Arrange
        jest.useFakeTimers();
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);
        pane.detail.openPolicy();
        const { range } = store.getState().highlight as PolicyHighlight;
        const policy =
          '        { allow: { to: { element: { type: "helper" } } } },\n';
        const at = FULL_QUICK_START.config.lastIndexOf("        {", range.from);

        // Act
        act(() =>
          store.changeConfig(
            FULL_QUICK_START.config.slice(0, at) +
              policy +
              FULL_QUICK_START.config.slice(at),
            {
              ...range,
              from: range.from + policy.length,
              to: range.to + policy.length,
              line: range.line + 1,
            }
          )
        );
        act(() => {
          jest.advanceTimersByTime(EVALUATION_DELAY);
        });

        // Assert
        expect(pane.note.text).toBe(
          `No problems in the config. Policy 3 is highlighted, opened from the dependency at line 3 of ${FILE}.`
        );
      });

      it("should leave the number out when no policy starts where the highlight is after the config is evaluated", () => {
        // Arrange
        jest.useFakeTimers();
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);
        pane.detail.openPolicy();

        // Act
        // A text that does not come from the editor says nothing of where the policy went
        act(() =>
          store.changeConfig(
            `// A comment before everything\n${FULL_QUICK_START.config}`
          )
        );
        act(() => {
          jest.advanceTimersByTime(EVALUATION_DELAY);
        });

        // Assert
        expect(pane.note.text).toBe(
          `No problems in the config. A policy is highlighted, opened from the dependency at line 3 of ${FILE}.`
        );
      });

      it("should say it above the problems of the config when the config has some", () => {
        // Arrange
        const { store, pane } = renderPane({
          ...FULL_QUICK_START,
          config: FULL_QUICK_START.config.replace(
            'pattern: "components/*/*"',
            'patern: "components/*/*"'
          ),
        });
        focusDependency(store, FILE, 2);

        // Act
        pane.detail.openPolicy();

        // Assert
        expect(pane.note.text).toBe(
          `Policy 2 is highlighted, opened from the dependency at line 3 of ${FILE}.`
        );
        expect(pane.list.rowCount).toBe(1);
      });

      it("should show the list of the file when the tab of the file is selected, and the body again when the tab of the dependency is", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);

        // Act
        pane.panel.tab(/checkout/).select();
        const listOfFile = pane.list.rowCount;
        const bodyHidden = pane.detail.isRendered;
        pane.panel.tab("line 3").select();

        // Assert
        expect(listOfFile).toBe(1);
        expect(bodyHidden).toBe(false);
        expect(pane.detail.isRendered).toBe(true);
        expect(getTabs(pane)).toEqual([
          "Project2",
          "checkout/index.js1",
          "line 3*",
        ]);
      });

      it("should show the list of the sketch when the tab of the sketch is selected, with the dependency still in focus", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);

        // Act
        pane.panel.tab(/Project/).select();

        // Assert
        expect(pane.list.rowCount).toBe(2);
        expect(store.getState().focus).toEqual({
          kind: "dependency",
          path: FILE,
          index: 2,
        });
        expect(getTabs(pane)).toEqual([
          "Project2*",
          "checkout/index.js1",
          "line 3",
        ]);
      });

      it("should go back to the tab of the file, without the one of the dependency, when the file is opened", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);

        // Act
        act(() => store.open({ kind: "file", path: FILE }));

        // Assert
        expect(getTabs(pane)).toEqual(["Project2", "checkout/index.js1*"]);
      });

      it("should move to the next dependency of the file when the one before it is removed", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);

        // Act
        act(() => store.removeDependency({ path: FILE, index: 0 }));

        // Assert
        expect(getTabs(pane)).toEqual([
          "Project2",
          "checkout/index.js1",
          "line 2*",
        ]);
        expect(pane.detail.verdictText).toBe("disallowed · policy 2");
      });

      it("should go back to the tab of the file when the dependency in focus is removed", () => {
        // Arrange
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);

        // Act
        act(() => store.removeDependency({ path: FILE, index: 2 }));

        // Assert
        expect(getTabs(pane)).toEqual(["Project1", "checkout/index.js*"]);
      });

      it("should follow the evaluation of the config", () => {
        // Arrange
        jest.useFakeTimers();
        const { store, pane } = renderPane(FULL_QUICK_START);
        focusDependency(store, FILE, 2);

        // Act
        act(() =>
          store.changeConfig(
            FULL_QUICK_START.config.replace(
              'categories: "test"',
              'categories: "style"'
            )
          )
        );
        act(() => {
          jest.advanceTimersByTime(EVALUATION_DELAY);
        });

        // Assert
        expect(pane.detail.verdictText).toBe("allowed · policy 1");
        expect(pane.panel.tab(/line 3/).icon.pathData).toBe(ICON_PATHS.check);
      });
    });
  });

  describe("before the first evaluation", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      holdInlineWorkers();
    });

    it("should say nothing about the evaluation while it is not late, and show the body in full", () => {
      // Arrange
      const { pane } = renderPane(MISTAKES);

      // Act
      act(() => {
        jest.advanceTimersByTime(LATE_AFTER - 1);
      });

      // Assert
      expect(getTabs(pane)).toEqual(["Project*", "eslint.config.js"]);
      expect(pane.tabPanel.noticeTexts).toEqual([]);
      expect(pane.tabPanel.bodyOpacity).toBe(1);
    });

    it("should not say that the project has no problems, which it does not know yet, and say it once the evaluation arrives", () => {
      // Arrange
      const { pane } = renderPane();

      waitUntilEvaluationIsLate();
      const listedBefore = pane.list.isRendered;

      // Act
      releaseEvaluation();

      // Assert
      expect(listedBefore).toBe(false);
      expect(pane.list.emptyText).toBe("No problems in the project.");
    });

    it("should say that the project is being evaluated once the evaluation is late, and show the body in full", () => {
      // Arrange
      const { pane } = renderPane(MISTAKES);

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(pane.tabPanel.noticeTexts).toEqual(["Evaluating the project…"]);
      expect(pane.tabPanel.noticeOpacities).toEqual([1]);
      expect(pane.tabPanel.bodyOpacity).toBe(1);
    });

    it("should say that the evaluation was stopped when it takes longer than the limit, and show the body in full", () => {
      // Arrange
      const { pane } = renderPane(MISTAKES);

      // Act
      waitUntilEvaluationStops();

      // Assert
      expect(pane.tabPanel.noticeTexts).toEqual([
        "The evaluation took longer than 30 seconds and was stopped. Edit the project to evaluate it again.",
      ]);
      expect(pane.tabPanel.noticeOpacities).toEqual([1]);
      expect(pane.tabPanel.bodyOpacity).toBe(1);
    });

    it("should say that the evaluation could not run when its worker fails, and show the body in full", () => {
      // Arrange
      const { pane } = renderPane(MISTAKES);

      // Act
      failEvaluation();

      // Assert
      expect(pane.tabPanel.noticeTexts).toEqual([
        "The evaluation could not run. Edit the project to try again.",
      ]);
      expect(pane.tabPanel.noticeOpacities).toEqual([1]);
      expect(pane.tabPanel.bodyOpacity).toBe(1);
    });

    it("should list the problems of the evaluation, and drop the notice, when it arrives", () => {
      // Arrange
      const { pane } = renderPane(MISTAKES);
      waitUntilEvaluationIsLate();
      const whileLate = pane.tabPanel.noticeTexts;

      // Act
      releaseEvaluation();

      // Assert
      expect(whileLate).toEqual(["Evaluating the project…"]);
      expect(pane.tabPanel.noticeTexts).toEqual([]);
      expect(getTabs(pane)).toEqual(["Project2*", "eslint.config.js2"]);
    });
  });

  describe("a dependency that no evaluation has decided yet", () => {
    /** The tab of the dependency that {@link renderPending} adds after the four of the file. */
    const ADDED_TAB = "line 5";

    /**
     * Renders the pane with the evaluation of the quick start, and then adds a dependency to a file while the worker holds the request of the new sketch. Adding it puts it in focus.
     * @returns The render of the pane.
     */
    function renderPending(): PaneRender {
      jest.useFakeTimers();

      const render = renderPane(FULL_QUICK_START);

      holdInlineWorkers();
      act(() =>
        render.store.addDependency({
          from: FILE,
          target: { kind: "external", name: "lodash" },
          syntax: "import",
          importKind: "value",
          specifiers: [],
        })
      );
      return render;
    }

    it("should draw no verdict in its tab and no icon on the tab while the evaluation is not late, as its line in the file pane", () => {
      // Arrange
      const { pane } = renderPending();

      // Act
      act(() => {
        jest.advanceTimersByTime(LATE_AFTER - 1);
      });

      // Assert
      expect(getTabs(pane)).toEqual([
        "Project2",
        "checkout/index.js1",
        `${ADDED_TAB}*`,
      ]);
      expect(pane.panel.tab(ADDED_TAB).icon.isRendered).toBe(false);
      expect(pane.detail.verdictText).toBe("");
      expect(pane.detail.verdictIcon.isRendered).toBe(false);
      expect(pane.detail.locationText).toBe(`${FILE}:5 → lodash`);
    });

    it("should say that it is being evaluated once the evaluation is late, with the faint icon of a skipped verdict in its tab too", () => {
      // Arrange
      const { pane } = renderPending();

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(pane.detail.verdictText).toBe("evaluating…");
      expect(pane.detail.verdictIcon.pathData).toBe(ICON_PATHS.skip);
      expect(pane.panel.tab(ADDED_TAB).icon.pathData).toBe(ICON_PATHS.skip);
      expect(pane.panel.tab(ADDED_TAB).icon.wrapperStyle.color).toBe(
        "var(--jsb-faint)"
      );
    });

    it("should say that it was not evaluated when the evaluation is stopped", () => {
      // Arrange
      const { pane } = renderPending();

      // Act
      waitUntilEvaluationStops();

      // Assert
      expect(pane.detail.verdictText).toBe("not evaluated");
      expect(pane.panel.tab(ADDED_TAB).icon.pathData).toBe(ICON_PATHS.skip);
    });

    it("should say its verdict when the evaluation arrives", () => {
      // Arrange
      const { pane } = renderPending();
      waitUntilEvaluationIsLate();

      // Act
      releaseEvaluation();

      // Assert
      expect(pane.detail.verdictText).toBe("not checked · external");
      expect(pane.panel.tab(ADDED_TAB).icon.pathData).toBe(ICON_PATHS.skip);
    });
  });

  describe("an evaluation that is out of date", () => {
    /**
     * Renders the pane with the evaluation of a sketch whose config has mistakes, and then removes a node while the worker holds the request of the new sketch.
     * @returns The render of the pane.
     */
    function renderOutOfDate(): PaneRender {
      jest.useFakeTimers();

      const render = renderPane(MISTAKES);

      holdInlineWorkers();
      act(() => render.store.removeNode(FILE));
      return render;
    }

    it("should keep the body in full, with no notice, while a newer evaluation is on its way and not late", () => {
      // Arrange
      const { pane } = renderOutOfDate();

      // Act
      act(() => {
        jest.advanceTimersByTime(LATE_AFTER - 1);
      });

      // Assert
      expect(pane.tabPanel.noticeTexts).toEqual([]);
      expect(pane.tabPanel.bodyOpacity).toBe(1);
      expect(getTabs(pane)).toEqual(["Project2*", "eslint.config.js2"]);
    });

    it("should fade the body, with no notice, once the evaluation is late", () => {
      // Arrange
      const { pane } = renderOutOfDate();

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(pane.tabPanel.noticeTexts).toEqual([]);
      expect(pane.tabPanel.bodyOpacity).toBe(0.5);
      expect(pane.tabPanel.bodyText).toContain("Invalid rule options.");
    });

    it("should fade the body, and say above it that the evaluation was stopped", () => {
      // Arrange
      const { pane } = renderOutOfDate();

      // Act
      waitUntilEvaluationStops();

      // Assert
      expect(pane.tabPanel.noticeTexts).toEqual([
        "The evaluation took longer than 30 seconds and was stopped. Edit the project to evaluate it again.",
      ]);
      expect(pane.tabPanel.noticeOpacities).toEqual([1]);
      expect(pane.tabPanel.bodyOpacity).toBe(0.5);
    });

    it("should fade the body, and say above it that the evaluation could not run", () => {
      // Arrange
      const { pane } = renderOutOfDate();

      // Act
      failEvaluation();

      // Assert
      expect(pane.tabPanel.noticeTexts).toEqual([
        "The evaluation could not run. Edit the project to try again.",
      ]);
      expect(pane.tabPanel.noticeOpacities).toEqual([1]);
      expect(pane.tabPanel.bodyOpacity).toBe(0.5);
    });

    it("should keep the notes of the tab inside the body, apart from the notice", () => {
      // Arrange
      const { pane } = renderOutOfDate();

      // Act
      waitUntilEvaluationStops();

      // Assert
      expect(pane.tabPanel.bodyText).toContain(NOTE_TEXT);
      expect(pane.tabPanel.noticeTexts).not.toContain(NOTE_TEXT);
      expect(pane.noteCount).toBe(2);
    });

    it("should fade the body of the file in focus, and keep its tabs in full", () => {
      // Arrange
      const { pane, store } = renderOutOfDate();
      act(() => store.open({ kind: "file", path: FORMAT }));

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(getTabs(pane)).toEqual(["Project2", "format/index.js*"]);
      expect(pane.tabPanel.bodyOpacity).toBe(0.5);
      expect(pane.tabs.map((tab) => tab.opacity)).toEqual([1, 1]);
    });

    it("should show the body in full, and drop the notice, when the evaluation arrives", () => {
      // Arrange
      const { pane } = renderOutOfDate();
      waitUntilEvaluationIsLate();
      const whileLate = pane.tabPanel.bodyOpacity;

      // Act
      releaseEvaluation();

      // Assert
      expect(whileLate).toBe(0.5);
      expect(pane.tabPanel.noticeTexts).toEqual([]);
      expect(pane.tabPanel.bodyOpacity).toBe(1);
    });

    it("should drop the notice of a stopped evaluation and keep the body faded when the sketch is edited again, until the new evaluation arrives", () => {
      // Arrange
      const { pane, store } = renderOutOfDate();
      waitUntilEvaluationStops();

      // Act
      act(() => store.removeNode(FORMAT));
      const whileWaiting = [
        pane.tabPanel.noticeTexts,
        pane.tabPanel.bodyOpacity,
      ];
      releaseEvaluation();

      // Assert
      expect(whileWaiting).toEqual([[], 0.5]);
      expect(pane.tabPanel.noticeTexts).toEqual([]);
      expect(pane.tabPanel.bodyOpacity).toBe(1);
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
      pane.panel.tab(/Project/).select();

      // Assert
      expect(pane.panel.tabPanel().isRendered).toBe(true);
    });

    it("should expand the panel and select the tab that is pressed when it is another one", () => {
      // Arrange
      const { store, pane } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      pane.panel.toggle.press();

      // Act
      pane.panel.tab(/Project/).select();

      // Assert
      expect(getTabs(pane)).toEqual(["Project*", "checkout/index.js"]);
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
      expect(getTabs(pane)).toEqual(["Project", "checkout/index.js*"]);
    });
  });
});
