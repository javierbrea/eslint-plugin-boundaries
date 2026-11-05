import { act } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { ConfigEditorSnapshotProvider } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import type { TextRange } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { renderInSession } from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";
import { NODE_FRAME_LABEL } from "@/domains/shell/ui/helpers/nodeFrame";

import { NodePane } from "./NodePane";
import { NodePanePom } from "./NodePane.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const FILE = "src/modules/checkout/index.js";

/** What {@link renderPane} returns: the render of the session, and the page object of the pane. */
type PaneRender = SessionRender & { readonly pane: NodePanePom };

/**
 * Renders the node pane in a session, with the snapshot of the config editor that the shell provides.
 * @param sketch The sketch to start from.
 * @returns The render, the store, the spy of the sketches and the page object of the pane.
 */
function renderPane(sketch: Sketch = QUICK_START): PaneRender {
  return {
    ...renderInSession(
      <ConfigEditorSnapshotProvider>
        <NodePane />
      </ConfigEditorSnapshotProvider>,
      { sketch }
    ),
    pane: new NodePanePom(),
  };
}

/**
 * Finds a snippet of the config text.
 * @param snippet The text to look for, once in the config.
 * @returns Its range, as the engine places a problem.
 */
function rangeOf(snippet: string): TextRange {
  const from = QUICK_START.config.indexOf(snippet);
  const before = QUICK_START.config.slice(0, from).split("\n");

  return {
    from,
    to: from + snippet.length,
    line: before.length,
    column: before[before.length - 1].length + 1,
  };
}

describe("NodePane", () => {
  describe("the landmark", () => {
    it("should be named after the node in focus when nothing is open", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { isLandmark, label } = pane.frame;

      // Assert
      expect(isLandmark).toBe(true);
      expect(label).toBe(NODE_FRAME_LABEL);
    });

    it("should be named after the node in focus when a file is open", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      const { isLandmark, label } = pane.frame;

      // Assert
      expect(isLandmark).toBe(true);
      expect(label).toBe(NODE_FRAME_LABEL);
    });

    it("should be named after the node in focus when the config is open", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "config" }));

      // Act
      const { isLandmark, label } = pane.frame;

      // Assert
      expect(isLandmark).toBe(true);
      expect(label).toBe(NODE_FRAME_LABEL);
    });
  });

  describe("nothing open", () => {
    it("should offer to open a file or the config", () => {
      // Act
      const { pane } = renderPane();

      // Assert
      expect(pane.shown).toBe("empty");
      expect(pane.empty.node.title).toBe("Open a file or the config");
    });

    it("should open the config from its button", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      pane.empty.node.openConfigButton.press();

      // Assert
      expect(store.getState().focus).toEqual({ kind: "config" });
      expect(pane.shown).toBe("config");
      expect(pane.config.pane.editorNamed("eslint.config.js").isRendered).toBe(
        true
      );
    });

    it("should show the file it adds in the pane of the file", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      pane.empty.node.addFileButton.press();

      // Assert
      expect(pane.shown).toBe("file");
      expect(pane.file.head.path).toBe("new-file.js");
    });

    it("should be the pane again when the file in focus is removed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(pane.shown).toBe("empty");
      expect(pane.empty.node.title).toBe("Open a file or the config");
    });
  });

  describe("a file", () => {
    it("should show the path of the file in focus", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(pane.shown).toBe("file");
      expect(pane.file.head.label).toBe("File");
      expect(pane.file.head.path).toBe(FILE);
    });

    it("should follow the file when it is renamed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => {
        store.renameNode("src/modules", "features");
      });

      // Assert
      expect(pane.file.head.path).toBe("src/features/checkout/index.js");
    });
  });

  describe("the config", () => {
    it("should put the cursor at the start of the range that a target points at", () => {
      // Arrange
      const { pane, store } = renderPane();
      const range = rangeOf('"boundaries/dependencies"');

      // Act
      act(() => store.open({ kind: "config", range }));

      // Assert
      expect(pane.shown).toBe("config");
      expect(pane.config.editor.cursor).toBe(range.from);
    });
  });

  describe("going back to the config", () => {
    it("should keep the undo history of the editor", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      pane.config.editor.typeAt(0, "// note\n");
      act(() => store.open({ kind: "file", path: FILE }));
      act(() => store.open({ kind: "config" }));
      const { editor } = pane.config;

      // Act
      const undone = editor.undo();

      // Assert
      expect(undone).toBe(true);
      expect(editor.text).toBe(QUICK_START.config);
      expect(store.getState().sketch.config).toBe(QUICK_START.config);
    });

    it("should keep the text and the selection of the editor", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      pane.config.editor.typeAt(0, "// note\n");
      pane.config.editor.select(12, 20);
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      const { text, selection } = pane.config.editor;

      expect(text).toBe(`// note\n${QUICK_START.config}`);
      expect(selection).toEqual({ anchor: 12, head: 20 });
    });

    it("should report the edits of the editor that opens again, and only once each", () => {
      // Arrange
      const { pane, store, onSketchChange } = renderPane();
      act(() => store.open({ kind: "config" }));
      act(() => store.open({ kind: "file", path: FILE }));
      act(() => store.open({ kind: "config" }));

      // Act
      pane.config.editor.typeAt(0, " ");

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect((onSketchChange.mock.calls[0][0] as Sketch).config).toBe(
        ` ${QUICK_START.config}`
      );
    });

    it("should start from the text of the store when it changed while the config was closed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      act(() => store.open({ kind: "file", path: FILE }));
      act(() => store.changeConfig("{}"));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(pane.config.editor.text).toBe("{}");
    });

    it("should scroll to the range of a request that comes with the config", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      act(() => store.open({ kind: "file", path: FILE }));
      const range = rangeOf('"boundaries/dependencies"');

      // Act
      act(() => store.open({ kind: "config", range }));

      // Assert
      expect(pane.config.editor.cursor).toBe(range.from);
    });
  });
});
