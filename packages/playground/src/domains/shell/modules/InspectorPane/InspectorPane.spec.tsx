// cspell:ignore patern -- a deliberate typo, the mistake of the config that the test reports
import { act } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
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
import { holdInlineWorkers } from "@/shared/testing/inlineWorker";

import { InspectorPane } from "./InspectorPane";
import { InspectorPanePom } from "./InspectorPane.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const FILE = "src/modules/checkout/index.js";

const { evaluate } = createEngine();

/** The quick-start config with a wrong key of an element descriptor, which makes the descriptor ignored */
const WITH_IGNORED: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config.replace(
    'pattern: "components/*/*"',
    'patern: "components/*/*"'
  ),
};

/** The quick-start project whose plugin reads only `require`, so that it does not read the `import` statements of the files */
const WITH_NOT_READ: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config.replace(
    "settings: {",
    'settings: {\n    "boundaries/dependency-nodes": ["require"],'
  ),
};

/** The position of the import of the test of Button, the 3rd of the dependencies of the file: Button, format, the test of Button and react */
const BUTTON_SPEC_LINE = 2;

const REACT_LINE = 3;

/** A file with a dependency of its own, for the focus to move to */
const BUTTON = "src/components/atoms/Button/index.js";

/** What {@link renderPane} returns: the render of the session, and the page object of the pane. */
type PaneRender = SessionRender & { readonly pane: InspectorPanePom };

/**
 * Renders the inspector pane in a session.
 * @param sketch The sketch to start from.
 * @returns The render, the store, the spy of the sketches and the page object of the pane.
 */
function renderPane(sketch: Sketch = QUICK_START): PaneRender {
  return {
    ...renderInSession(<InspectorPane />, { sketch }),
    pane: new InspectorPanePom(),
  };
}

/**
 * Renders the inspector pane with nothing in focus, the way the user leaves it: the instance starts with the config in focus, which is closed.
 * @param sketch The sketch to start from.
 * @returns The render, the store, the spy of the sketches and the page object of the pane.
 */
function renderWithNothingInFocus(sketch: Sketch = QUICK_START): PaneRender {
  const render = renderPane(sketch);

  leaveNothingOpen(render.store);
  return render;
}

describe("InspectorPane", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("should be the landmark of the inspector", () => {
    // Act
    const { pane } = renderPane();

    // Assert
    expect(pane.layout.isComplementaryNamed("Inspector")).toBe(true);
  });

  describe("nothing in focus", () => {
    it("should describe the sketch with the numbers of the evaluation", () => {
      // Act
      const { pane } = renderWithNothingInFocus();

      // Assert
      expect(pane.shown).toBe("project");
      expect(pane.project.title.text).toBe("Project");
      expect(pane.project.count("files")).toBe("6");
    });

    it("should count the dependencies of the sketch and what the engine decided about them", () => {
      // Act
      const { pane } = renderWithNothingInFocus();

      // Assert
      expect(pane.project.count("dependencies")).toBe("9");
      expect(pane.project.count("disallowed")).toBe("2");
      expect(pane.project.verdictCounts.map(({ text }) => text)).toEqual([
        "3 allowed",
        "4 not checked",
      ]);
    });

    it("should count the files at once after a node is removed", () => {
      // Arrange
      jest.useFakeTimers();
      const { pane, store } = renderWithNothingInFocus();

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(pane.project.count("files")).toBe("5");
    });

    it("should count the files at once after the text of the project is read", () => {
      // Arrange
      jest.useFakeTimers();
      const { pane, store } = renderWithNothingInFocus();
      act(() => store.setView("text"));
      act(() => store.setTextDraft("src/a.js\nsrc/b.js\n"));

      // Act
      act(() => store.settleText());

      // Assert
      expect(pane.project.count("files")).toBe("2");
    });

    it("should count the elements of the config a moment after the config is edited", () => {
      // Arrange
      jest.useFakeTimers();
      const { pane, store } = renderWithNothingInFocus();

      // Act
      act(() => store.changeConfig("{ settings: {}, rules: {} }"));
      act(() => {
        jest.advanceTimersByTime(EVALUATION_DELAY - 1);
      });
      const whileWaiting = pane.project.count("element types");
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // Assert
      expect(whileWaiting).toBe("3");
      expect(pane.project.count("element types")).toBe("0");
    });
  });

  describe("a file", () => {
    it("should describe the file in focus as the plugin does", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(pane.shown).toBe("file");
      expect(pane.file.section("from").summary).toBe(FILE);
      expect(pane.file.section("from").boxes.box("element").isRendered).toBe(
        true
      );
      expect(pane.file.section("from").boxes.box("element").entries.types).toBe(
        '[ "module" ]'
      );
    });

    it("should count the dependencies of the file in focus and what the engine decided about them", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      const { dependencies } = pane.file.section("from");

      expect(dependencies.total).toBe("4 dependencies");
      expect(dependencies.countTexts.map(({ text }) => text)).toEqual([
        "2",
        "1",
        "1 not checked",
      ]);
    });

    it("should keep describing the file when one of its dependencies takes the focus", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.open({ kind: "dependency", path: FILE, index: 2 }));

      // Assert
      expect(pane.shown).toBe("file");
      expect(pane.file.section("from").summary).toBe(FILE);
      expect(pane.file.section("from").dependencies.total).toBe(
        "4 dependencies"
      );
    });

    it("should describe the file of a dependency that is in focus when no file was open", () => {
      // Arrange
      const { pane, store } = renderWithNothingInFocus();
      const shownBefore = pane.shown;

      // Act
      act(() =>
        store.open({
          kind: "dependency",
          path: "src/helpers/format/index.js",
          index: 0,
        })
      );

      // Assert
      expect(shownBefore).toBe("project");
      expect(pane.shown).toBe("file");
      expect(pane.file.section("from").summary).toBe(
        "src/helpers/format/index.js"
      );
      expect(pane.file.section("from").boxes.box("element").entries.types).toBe(
        '[ "helper" ]'
      );
    });

    it("should describe the renamed file at once, without lagging behind the rename", () => {
      // Arrange
      jest.useFakeTimers();
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => {
        store.renameNode("src/modules", "features");
      });

      // Assert
      expect(pane.file.section("from").summary).toBe(
        "src/features/checkout/index.js"
      );
      expect(pane.file.section("from").boxes.box("element").isRendered).toBe(
        true
      );
    });

    it("should describe the sketch again when the file in focus is removed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(pane.shown).toBe("project");
      expect(pane.project.title.text).toBe("Project");
    });
  });

  describe("a dependency in focus", () => {
    it("should describe what the dependency points to and the dependency, next to the file", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: BUTTON_SPEC_LINE })
      );

      // Assert
      expect(pane.shown).toBe("file");
      expect(pane.file.sectionNames).toEqual(["from", "to", "dependency"]);
      expect(pane.file.section("from").summary).toBe(FILE);
      expect(pane.file.section("to").summary).toBe(
        "src/components/atoms/Button/Button.spec.js"
      );
      expect(pane.file.section("dependency").summary).toBe("line 3");
    });

    it("should list the properties of the dependency in the section dependency", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: BUTTON_SPEC_LINE })
      );

      // Assert
      expect(pane.file.section("dependency").properties.entries.source).toBe(
        '"../../components/atoms/Button/Button.spec.js"'
      );
    });

    it("should describe the external module that the dependency points to", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: REACT_LINE })
      );

      // Assert
      expect(pane.file.section("to").summary).toBe("react");
      expect(
        pane.file.section("to").boxes.box("element").entries.isUnknown
      ).toBe("true");
    });

    it("should say that the plugin does not read a dependency, instead of describing it", () => {
      // Arrange
      const { pane, store } = renderPane(WITH_NOT_READ);

      // Act
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: BUTTON_SPEC_LINE })
      );

      // Assert
      expect(pane.file.sectionNames).toEqual(["from"]);
      expect(pane.file.note.text).toContain(
        "the plugin never reads this kind of statement"
      );
      expect(pane.file.rows.rows).toEqual([
        { label: "to", text: "src/components/atoms/Button/Button.spec.js" },
        { label: "dependency", text: "line 3" },
      ]);
    });

    it("should describe the other dependency when the focus moves to it", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "dependency", path: FILE, index: 0 }));

      // Act
      act(() => store.open({ kind: "dependency", path: FILE, index: 1 }));

      // Assert
      expect(pane.file.section("to").summary).toBe(
        "src/helpers/format/index.js"
      );
      expect(pane.file.section("dependency").summary).toBe("line 2");
    });

    it("should wait for a line again when the focus goes back to the file", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: BUTTON_SPEC_LINE })
      );

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(pane.file.sectionNames).toEqual(["from"]);
      expect(pane.file.hint).toContain("Click a line of the file");
    });
  });

  describe("what the user folded or opened", () => {
    it("should start with every section and box open but the module boxes", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: BUTTON_SPEC_LINE })
      );

      // Assert
      const [from, to] = [pane.file.section("from"), pane.file.section("to")];

      expect([
        from.isOpen,
        from.boxes.box("element").isOpen,
        from.boxes.box("file").isOpen,
        from.boxes.box("module").isOpen,
        to.isOpen,
        to.boxes.box("element").isOpen,
        to.boxes.box("file").isOpen,
        to.boxes.box("module").isOpen,
        pane.file.section("dependency").isOpen,
      ]).toEqual([true, true, true, false, true, true, true, false, true]);
    });

    it("should fold and open a box when its header is pressed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      const element = pane.file.section("from").boxes.box("element");

      // Act
      element.toggle();
      const whileFolded = [element.isOpen, element.summary];
      element.toggle();

      // Assert
      expect(whileFolded).toEqual([false, '[ "module" ]']);
      expect(element.isOpen).toBe(true);
    });

    it("should keep a box folded after the focus moves to another dependency", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: BUTTON_SPEC_LINE })
      );
      pane.file.section("to").boxes.box("element").toggle();

      // Act
      act(() => store.open({ kind: "dependency", path: FILE, index: 0 }));

      // Assert
      const to = pane.file.section("to");

      expect(to.boxes.box("element").isOpen).toBe(false);
      expect(to.boxes.box("file").isOpen).toBe(true);
    });

    it("should keep a box folded after the focus moves to another file", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: BUTTON_SPEC_LINE })
      );
      pane.file.section("from").boxes.box("file").toggle();
      pane.file.section("to").boxes.box("element").toggle();

      // Act
      act(() => store.open({ kind: "dependency", path: BUTTON, index: 0 }));

      // Assert
      expect(pane.file.section("from").summary).toBe(BUTTON);
      expect(pane.file.section("from").boxes.box("file").isOpen).toBe(false);
      expect(pane.file.section("to").boxes.box("element").isOpen).toBe(false);
    });

    it("should keep a section folded after the focus moves to another dependency and to another file", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: BUTTON_SPEC_LINE })
      );
      pane.file.section("dependency").toggle();
      pane.file.section("from").toggle();

      // Act
      act(() => store.open({ kind: "dependency", path: FILE, index: 0 }));
      const afterDependency = [
        pane.file.section("from").isOpen,
        pane.file.section("dependency").isOpen,
      ];
      act(() => store.open({ kind: "dependency", path: BUTTON, index: 0 }));

      // Assert
      expect(afterDependency).toEqual([false, false]);
      expect(pane.file.section("from").isOpen).toBe(false);
      expect(pane.file.section("dependency").isOpen).toBe(false);
      expect(pane.file.section("to").isOpen).toBe(true);
    });

    it("should keep a module box that the user opened open after the focus moves", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: BUTTON_SPEC_LINE })
      );
      pane.file.section("to").boxes.box("module").toggle();

      // Act
      act(() =>
        store.open({ kind: "dependency", path: FILE, index: REACT_LINE })
      );

      // Assert
      const moduleBox = pane.file.section("to").boxes.box("module");

      expect(moduleBox.isOpen).toBe(true);
      expect(moduleBox.entries.origin).toBe('"external"');
    });

    it("should keep them while the config is in focus, which shows another inspector", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      pane.file.section("from").boxes.box("element").toggle();

      // Act
      act(() => store.open({ kind: "config" }));
      const whileConfig = pane.shown;
      act(() => store.open({ kind: "file", path: BUTTON }));

      // Assert
      expect(whileConfig).toBe("config");
      expect(pane.file.section("from").boxes.box("element").isOpen).toBe(false);
    });

    it("should keep them while nothing is in focus, which shows the numbers of the project", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      pane.file.section("from").toggle();

      // Act
      act(() => store.removeNode(FILE));
      const whileNothing = pane.shown;
      act(() => store.open({ kind: "file", path: BUTTON }));

      // Assert
      expect(whileNothing).toBe("project");
      expect(pane.file.section("from").isOpen).toBe(false);
    });

    it("should not keep them in the store", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      const before = store.getState();

      // Act
      pane.file.section("from").boxes.box("module").toggle();
      pane.file.section("from").toggle();

      // Assert
      expect(store.getState()).toBe(before);
    });
  });

  describe("the config", () => {
    it("should list the entries of the config", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(pane.shown).toBe("config");
      expect(pane.config.group("Element types").isRendered).toBe(true);
      expect(pane.config.group("File categories").isRendered).toBe(true);
      expect(pane.config.group("Policies").isRendered).toBe(true);
    });

    it("should list the policies of the rule with the dependencies each decided", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(pane.config.group("Policies").rowTexts).toEqual([
        "0 · component → helper | 1 dependency",
        "1 · module → component, helper | 2 dependencies",
        "2 · disallow → test | 1 dependency",
        "default · disallow | 1 dependency",
      ]);
    });

    it("should open the config at the entry of the row that is pressed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      const [, component] = evaluate(QUICK_START).elementTypes;

      // Act
      pane.config.row(/^component/).press();

      // Assert
      expect(store.getState().focus).toEqual({ kind: "config" });
      expect(store.getState().reveal?.range).toEqual(component.range);
    });

    it("should ask for a new scroll each time a row is pressed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      pane.config.row(/^component/).press();
      const first = store.getState().reveal?.key;

      // Act
      pane.config.row(/^component/).press();

      // Assert
      expect(first).toBe(1);
      expect(store.getState().reveal?.key).toBe(2);
    });

    it("should open the config at the descriptor that is ignored, where the mistake is", () => {
      // Arrange
      const { pane, store } = renderPane(WITH_IGNORED);
      act(() => store.open({ kind: "config" }));

      // Act
      pane.config.row(/^component/).press();

      // Assert
      expect(store.getState().reveal?.range).toEqual(
        expect.objectContaining({ line: 5 })
      );
    });

    it("should open the config at the policy that is pressed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "config" }));

      // Act
      pane.config.row(/^2 · disallow/).press();

      // Assert
      expect(store.getState().reveal?.range).toEqual(
        evaluate(QUICK_START).policies[2].range
      );
    });
  });

  describe("before the first evaluation", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      holdInlineWorkers();
    });

    it("should describe nothing and say nothing while the evaluation is not late", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      act(() => {
        jest.advanceTimersByTime(LATE_AFTER - 1);
      });

      // Assert
      expect(pane.layout.isComplementaryNamed("Inspector")).toBe(true);
      expect(pane.hasInspector).toBe(false);
      expect(pane.note.isRendered).toBe(false);
      expect(pane.layout.contentOpacity).toBe("1");
    });

    it("should say that the project is being evaluated once the evaluation is late", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(pane.note.text).toBe("Evaluating the project…");
      expect(pane.hasInspector).toBe(false);
      expect(pane.layout.contentOpacity).toBe("1");
    });

    it("should say that the evaluation was stopped when it takes longer than the limit", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      waitUntilEvaluationStops();

      // Assert
      expect(pane.note.text).toBe(
        "The evaluation took longer than 30 seconds and was stopped. Edit the project to evaluate it again."
      );
      expect(pane.hasInspector).toBe(false);
      expect(pane.layout.contentOpacity).toBe("1");
    });

    it("should say that the evaluation could not run when its worker fails", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      failEvaluation();

      // Assert
      expect(pane.note.text).toBe(
        "The evaluation could not run. Edit the project to try again."
      );
      expect(pane.hasInspector).toBe(false);
      expect(pane.layout.contentOpacity).toBe("1");
    });

    it("should describe the project, and drop the note, when the evaluation arrives", () => {
      // Arrange
      const { pane } = renderWithNothingInFocus();
      waitUntilEvaluationIsLate();
      const whileLate = pane.note.text;

      // Act
      releaseEvaluation();

      // Assert
      expect(whileLate).toBe("Evaluating the project…");
      expect(pane.note.isRendered).toBe(false);
      expect(pane.shown).toBe("project");
      expect(pane.project.count("files")).toBe("6");
    });
  });

  describe("an evaluation that is out of date", () => {
    /**
     * Renders the pane with the evaluation of the sketch, and then removes a node while the worker holds the request of the new sketch.
     * @returns The render of the pane.
     */
    function renderOutOfDate(): PaneRender {
      jest.useFakeTimers();

      const render = renderWithNothingInFocus();

      holdInlineWorkers();
      act(() => render.store.removeNode(FILE));
      return render;
    }

    it("should describe the new sketch in full while the evaluation is on its way and not late", () => {
      // Arrange
      const { pane } = renderOutOfDate();

      // Act
      act(() => {
        jest.advanceTimersByTime(LATE_AFTER - 1);
      });

      // Assert
      expect(pane.shown).toBe("project");
      expect(pane.project.count("files")).toBe("5");
      expect(pane.layout.contentOpacity).toBe("1");
    });

    it("should fade what it describes once the evaluation is late, and keep describing it", () => {
      // Arrange
      const { pane } = renderOutOfDate();

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(pane.layout.contentOpacity).toBe("0.5");
      expect(pane.shown).toBe("project");
      expect(pane.project.count("files")).toBe("5");
      expect(pane.note.isRendered).toBe(false);
    });

    it("should fade it when the evaluation was stopped", () => {
      // Arrange
      const { pane } = renderOutOfDate();

      // Act
      waitUntilEvaluationStops();

      // Assert
      expect(pane.layout.contentOpacity).toBe("0.5");
      expect(pane.shown).toBe("project");
      expect(pane.note.isRendered).toBe(false);
    });

    it("should fade it when the evaluation could not run", () => {
      // Arrange
      const { pane } = renderOutOfDate();

      // Act
      failEvaluation();

      // Assert
      expect(pane.layout.contentOpacity).toBe("0.5");
      expect(pane.shown).toBe("project");
      expect(pane.note.isRendered).toBe(false);
    });

    it("should fade the file in focus too", () => {
      // Arrange
      const { pane, store } = renderOutOfDate();
      act(() => store.open({ kind: "file", path: BUTTON }));

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(pane.shown).toBe("file");
      expect(pane.file.section("from").summary).toBe(BUTTON);
      expect(pane.layout.contentOpacity).toBe("0.5");
    });

    it("should show it in full again when the evaluation arrives", () => {
      // Arrange
      const { pane } = renderOutOfDate();
      waitUntilEvaluationIsLate();
      const whileLate = pane.layout.contentOpacity;

      // Act
      releaseEvaluation();

      // Assert
      expect(whileLate).toBe("0.5");
      expect(pane.layout.contentOpacity).toBe("1");
      expect(pane.project.count("files")).toBe("5");
    });
  });
});
