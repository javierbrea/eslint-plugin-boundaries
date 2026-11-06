// cspell:ignore patern -- a deliberate typo, the mistake of the config that the test reports
import { act } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { EVALUATION_DELAY } from "@/domains/session/data/store";
import { renderInSession } from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";

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
      const { pane } = renderPane();

      // Assert
      expect(pane.shown).toBe("project");
      expect(pane.project.title.text).toBe("Sketch");
      expect(pane.project.count("files")).toBe("6");
    });

    it("should count the dependencies of the sketch and what the engine decided about them", () => {
      // Act
      const { pane } = renderPane();

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
      const { pane, store } = renderPane();

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(pane.project.count("files")).toBe("5");
    });

    it("should count the files at once after the text of the project is read", () => {
      // Arrange
      jest.useFakeTimers();
      const { pane, store } = renderPane();
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
      const { pane, store } = renderPane();

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
      expect(pane.file.title(FILE).isRendered).toBe(true);
      expect(pane.file.facet("element").isRendered).toBe(true);
      expect(pane.file.facet("element").entries.types).toBe('[ "module" ]');
    });

    it("should count the dependencies of the file in focus and what the engine decided about them", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(pane.file.summary.total).toBe("4 dependencies");
      expect(pane.file.summary.countTexts.map(({ text }) => text)).toEqual([
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
      expect(pane.file.title(FILE).isRendered).toBe(true);
      expect(pane.file.summary.total).toBe("4 dependencies");
    });

    it("should describe the file of a dependency that is in focus when no file was open", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() =>
        store.open({
          kind: "dependency",
          path: "src/helpers/format/index.js",
          index: 0,
        })
      );

      // Assert
      expect(pane.shown).toBe("file");
      expect(pane.file.title("src/helpers/format/index.js").isRendered).toBe(
        true
      );
      expect(pane.file.facet("element").entries.types).toBe('[ "helper" ]');
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
      expect(pane.file.title("src/features/checkout/index.js").isRendered).toBe(
        true
      );
      expect(pane.file.facet("element").isRendered).toBe(true);
    });

    it("should describe the sketch again when the file in focus is removed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(pane.shown).toBe("project");
      expect(pane.project.title.text).toBe("Sketch");
    });
  });

  describe("the config", () => {
    it("should list the entries of the config", () => {
      // Arrange
      const { pane, store } = renderPane();

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
});
