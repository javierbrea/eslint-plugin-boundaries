// cspell:ignore patern -- a deliberate typo, the mistake of the config that the test reports
import { act, fireEvent, screen as view, within } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { EVALUATION_DELAY } from "@/domains/session/data/store";
import { renderInSession } from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";

import { InspectorPane } from "./InspectorPane";

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

/**
 * Renders the inspector pane in a session.
 * @param sketch The sketch to start from.
 * @returns The render, the store and the spy of the sketches.
 */
function renderPane(sketch: Sketch = QUICK_START): SessionRender {
  return renderInSession(<InspectorPane />, { sketch });
}

/**
 * Reads how many files the sketch inspector counts.
 * @returns The number next to the `files` label.
 */
function getFileCount(): string | null | undefined {
  return view.getByText("files").previousElementSibling?.textContent;
}

/**
 * Reads how many element types the sketch inspector counts.
 * @returns The number next to the `element types` label.
 */
function getElementTypeCount(): string | null | undefined {
  return view.getByText("element types").previousElementSibling?.textContent;
}

describe("InspectorPane", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("should be the landmark of the inspector", () => {
    // Act
    renderPane();

    // Assert
    expect(view.getByRole("complementary", { name: "Inspector" })).toBeTruthy();
  });

  describe("nothing in focus", () => {
    it("should describe the sketch with the numbers of the evaluation", () => {
      // Act
      renderPane();

      // Assert
      expect(view.getByText("Sketch")).toBeTruthy();
      expect(getFileCount()).toBe("6");
    });

    it("should count the files at once after a node is removed", () => {
      // Arrange
      jest.useFakeTimers();
      const { store } = renderPane();

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(getFileCount()).toBe("5");
    });

    it("should count the files at once after the text of the project is read", () => {
      // Arrange
      jest.useFakeTimers();
      const { store } = renderPane();
      act(() => store.setView("text"));
      act(() => store.setTextDraft("src/a.js\nsrc/b.js\n"));

      // Act
      act(() => store.settleText());

      // Assert
      expect(getFileCount()).toBe("2");
    });

    it("should count the elements of the config a moment after the config is edited", () => {
      // Arrange
      jest.useFakeTimers();
      const { store } = renderPane();

      // Act
      act(() => store.changeConfig("{ settings: {}, rules: {} }"));
      act(() => {
        jest.advanceTimersByTime(EVALUATION_DELAY - 1);
      });
      const whileWaiting = getElementTypeCount();
      act(() => {
        jest.advanceTimersByTime(1);
      });

      // Assert
      expect(whileWaiting).toBe("3");
      expect(getElementTypeCount()).toBe("0");
    });
  });

  describe("a file", () => {
    it("should describe the file in focus as the plugin does", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(view.getByText(FILE)).toBeTruthy();
      expect(view.getByText("element")).toBeTruthy();
      expect(view.getByText('[ "module" ]')).toBeTruthy();
    });

    it("should describe the renamed file at once, without lagging behind the rename", () => {
      // Arrange
      jest.useFakeTimers();
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => {
        store.renameNode("src/modules", "features");
      });

      // Assert
      expect(view.getByText("src/features/checkout/index.js")).toBeTruthy();
      expect(view.getByText("element")).toBeTruthy();
    });

    it("should describe the sketch again when the file in focus is removed", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(view.getByText("Sketch")).toBeTruthy();
    });
  });

  describe("the config", () => {
    it("should list the entries of the config", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(view.getByText("Element types")).toBeTruthy();
      expect(view.getByText("File categories")).toBeTruthy();
      expect(view.getByText("Policies")).toBeTruthy();
    });

    it("should open the config at the entry of the row that is pressed", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "config" }));
      const [, component] = evaluate(QUICK_START).elementTypes;

      // Act
      fireEvent.click(view.getByRole("button", { name: /^component/ }));

      // Assert
      expect(store.getState().focus).toEqual({ kind: "config" });
      expect(store.getState().reveal?.range).toEqual(component.range);
    });

    it("should ask for a new scroll each time a row is pressed", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "config" }));
      fireEvent.click(view.getByRole("button", { name: /^component/ }));
      const first = store.getState().reveal?.key;

      // Act
      fireEvent.click(view.getByRole("button", { name: /^component/ }));

      // Assert
      expect(first).toBe(1);
      expect(store.getState().reveal?.key).toBe(2);
    });

    it("should open the config at the descriptor that is ignored, where the mistake is", () => {
      // Arrange
      const { store } = renderPane(WITH_IGNORED);
      act(() => store.open({ kind: "config" }));

      // Act
      fireEvent.click(view.getByRole("button", { name: /^component/ }));

      // Assert
      expect(store.getState().reveal?.range).toEqual(
        expect.objectContaining({ line: 5 })
      );
    });

    it("should open the config at the rule that is pressed", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "config" }));

      // Act
      fireEvent.click(
        within(view.getByRole("complementary")).getByRole("button", {
          name: /^boundaries\/dependencies/,
        })
      );

      // Assert
      expect(store.getState().reveal?.range).toEqual(
        evaluate(QUICK_START).rules[0].range
      );
    });
  });
});
