import { act } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { ConfigEditorSnapshotProvider } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import type { TextRange } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import {
  leaveNothingOpen,
  renderInSession,
} from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";
import { NODE_FRAME_LABEL } from "@/domains/shell/ui/helpers/nodeFrame";

import { NodePane } from "./NodePane";
import { NodePanePom } from "./NodePane.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const FILE = "src/modules/checkout/index.js";

const OTHER_FILE = "src/helpers/format/index.js";

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
 * Renders the node pane the way a user leaves it with nothing open: the instance starts with the config in focus, which is closed.
 * @returns The render, the store, the spy of the sketches and the page object of the pane.
 */
function renderWithNothingOpen(): PaneRender {
  const render = renderPane();

  leaveNothingOpen(render.store);
  return render;
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
      const { pane } = renderWithNothingOpen();

      // Act
      const isNamedRegion = pane.frame.isRegionNamed(NODE_FRAME_LABEL);

      // Assert
      expect(pane.shown).toBe("empty");
      expect(isNamedRegion).toBe(true);
    });

    it("should be named after the node in focus when a file is open", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      const isNamedRegion = pane.frame.isRegionNamed(NODE_FRAME_LABEL);

      // Assert
      expect(isNamedRegion).toBe(true);
    });

    it("should be named after the node in focus when the config is open", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
      act(() => store.open({ kind: "config" }));

      // Act
      const isNamedRegion = pane.frame.isRegionNamed(NODE_FRAME_LABEL);

      // Assert
      expect(pane.shown).toBe("config");
      expect(isNamedRegion).toBe(true);
    });
  });

  describe("nothing open", () => {
    it("should offer to open a file or the config", () => {
      // Act
      const { pane } = renderWithNothingOpen();

      // Assert
      expect(pane.shown).toBe("empty");
      expect(pane.empty.title).toBe("Open a file or the config");
    });

    it("should open the config from its button", () => {
      // Arrange
      const { pane, store } = renderWithNothingOpen();

      // Act
      pane.empty.openConfigButton.press();

      // Assert
      expect(store.getState().focus).toEqual({ kind: "config" });
      expect(pane.shown).toBe("config");
      expect(pane.config.editorNamed("eslint.config.js").isRendered).toBe(true);
    });

    it("should show the file it adds in the pane of the file", () => {
      // Arrange
      const { pane } = renderWithNothingOpen();

      // Act
      pane.empty.addFileButton.press();

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
      expect(pane.empty.title).toBe("Open a file or the config");
    });
  });

  describe("the close button", () => {
    it("should close the config, and give the keyboard focus to the button that opens it again", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      pane.config.pane.closeButton.press();

      // Assert
      expect(store.getState().focus).toEqual({ kind: "none" });
      expect(pane.shown).toBe("empty");
      expect(pane.empty.openConfigButton.isFocused).toBe(true);
    });

    it("should close the file in focus, and give the keyboard focus to the button that opens the config", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "dependency", path: FILE, index: 0 }));

      // Act
      pane.file.closeButton.press();

      // Assert
      expect(store.getState().focus).toEqual({ kind: "none" });
      expect(pane.shown).toBe("empty");
      expect(pane.empty.openConfigButton.isFocused).toBe(true);
    });

    it("should not give the keyboard focus to the pane that a removal shows later, once something was open again after a close", () => {
      // Arrange
      const { pane, store } = renderPane();
      pane.config.pane.closeButton.press();
      const focusedAfterClose = pane.empty.openConfigButton.isFocused;
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(focusedAfterClose).toBe(true);
      expect(pane.shown).toBe("empty");
      expect(pane.empty.openConfigButton.isFocused).toBe(false);
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

  describe("the dependencies of a file", () => {
    it("should list the dependencies of the file in focus with their verdicts", () => {
      // Arrange
      const { pane, store } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(pane.file.lines.lineTexts).toEqual([
        '1import { Button } from "../../components/atoms/Button/index.js";policy 1',
        '2import { format } from "../../helpers/format/index.js";policy 1',
        '3import { renderButton } from "../../components/atoms/Button/Button.spec.js";policy 2',
        '4import React from "react";not checked · external',
      ]);
    });

    it("should list the dependencies of another file when it takes the focus", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.open({ kind: "file", path: OTHER_FILE }));

      // Assert
      expect(pane.file.head.path).toBe(OTHER_FILE);
      expect(pane.file.lines.lineTexts).toEqual([
        '1import { Button } from "../../components/atoms/Button/index.js";default',
      ]);
    });

    it("should keep the file pane, and mark the line, when a dependency of the file takes the focus", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.open({ kind: "dependency", path: FILE, index: 2 }));

      // Assert
      expect(pane.shown).toBe("file");
      expect(pane.file.head.path).toBe(FILE);
      expect(pane.file.lines.line(2).isSelected).toBe(true);
    });

    it("should show the file of a dependency that is in focus when nothing else was open", () => {
      // Arrange
      const { pane, store } = renderWithNothingOpen();
      const shownBefore = pane.shown;

      // Act
      act(() => store.open({ kind: "dependency", path: OTHER_FILE, index: 0 }));

      // Assert
      expect(shownBefore).toBe("empty");
      expect(pane.shown).toBe("file");
      expect(pane.file.head.path).toBe(OTHER_FILE);
      expect(pane.file.lines.line(0).isSelected).toBe(true);
    });

    it("should put the dependency of a line that is clicked in focus", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      pane.file.lines.line(3).click();

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "dependency",
        path: FILE,
        index: 3,
      });
      expect(pane.file.lines.line(3).isSelected).toBe(true);
    });

    it("should show the empty pane when the file of the dependency in focus is removed", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "dependency", path: FILE, index: 0 }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(pane.shown).toBe("empty");
    });
  });

  describe("the config", () => {
    it("should put the cursor at the start of the range that a target points at", () => {
      // Arrange
      const { pane, store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));
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
