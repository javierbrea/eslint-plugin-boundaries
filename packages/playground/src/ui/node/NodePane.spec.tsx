// cspell:ignore dissallow -- a deliberate typo, the mistake of the config that the test reports
import { undo } from "@codemirror/commands";
import { EditorSelection } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { act, fireEvent, screen as view } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { ConfigEditorSnapshotProvider } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import type { TextRange } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import {
  NO_CAPABILITIES,
  renderInSession,
} from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";

import { NodePane } from "./NodePane";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const FILE = "src/modules/checkout/index.js";

/** The quick-start config with an option that is not valid: one error, placed at `"dissallow"`. */
const WITH_ERROR: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config.replace(
    'default: "disallow"',
    'default: "dissallow"'
  ),
};

/**
 * Renders the node pane in a session, with the snapshot of the config editor that the workbench provides.
 * @param sketch The sketch to start from.
 * @param capabilities What the user can change; everything when it is unset.
 * @returns The render, the store and the spy of the sketches.
 */
function renderPane(
  sketch: Sketch = QUICK_START,
  capabilities?: Parameters<typeof renderInSession>[1]["capabilities"]
): SessionRender {
  return renderInSession(
    <ConfigEditorSnapshotProvider>
      <NodePane />
    </ConfigEditorSnapshotProvider>,
    { sketch, capabilities }
  );
}

/**
 * Finds the CodeMirror view of the editor.
 * @param container The element the pane was rendered in.
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

/**
 * Types in the editor, as the user does.
 * @param container The element the pane was rendered in.
 * @param insert What to insert at the start of the text.
 */
function typeInEditor(container: HTMLElement, insert: string): void {
  act(() => {
    getEditorView(container).dispatch({
      changes: { from: 0, insert },
      userEvent: "input.type",
    });
  });
}

describe("NodePane", () => {
  describe("nothing open", () => {
    it("should offer to open a file or the config", () => {
      // Act
      renderPane();

      // Assert
      expect(view.getByText("Open a file or the config")).toBeTruthy();
    });

    it("should open the config from its button", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      fireEvent.click(
        view.getByRole("button", { name: "Open eslint.config.js" })
      );

      // Assert
      expect(store.getState().focus).toEqual({ kind: "config" });
      expect(
        view.getByRole("textbox", { name: "eslint.config.js" })
      ).toBeTruthy();
    });

    it("should not scroll the editor to anything when the config is opened from its button", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      fireEvent.click(
        view.getByRole("button", { name: "Open eslint.config.js" })
      );

      // Assert
      expect(store.getState().reveal).toBeUndefined();
    });

    it("should add a file at the root, open it and start renaming it", () => {
      // Arrange
      const { store, onSketchChange } = renderPane();

      // Act
      fireEvent.click(view.getByRole("button", { name: "File" }));

      // Assert
      const state = store.getState();

      expect(state.sketch.tree.map(({ path }) => path)).toContain(
        "new-file.js"
      );
      expect(state.focus).toEqual({ kind: "file", path: "new-file.js" });
      expect(state.renaming).toBe("new-file.js");
      expect(onSketchChange).toHaveBeenCalledTimes(1);
    });

    it("should show the file it adds in the pane of the file", () => {
      // Arrange
      renderPane();

      // Act
      fireEvent.click(view.getByRole("button", { name: "File" }));

      // Assert
      expect(view.getByText("new-file.js")).toBeTruthy();
      expect(view.queryByText("Open a file or the config")).toBeNull();
    });

    it("should show the tree when the project was shown as text, so that the name can be edited", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.setView("text"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "File" }));

      // Assert
      expect(store.getState().view).toBe("tree");
    });

    it("should add the file in the folder that the user picked in the tree", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.selectItem("src/modules"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "File" }));

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "file",
        path: "src/modules/new-file.js",
      });
      expect(store.getState().renaming).toBe("src/modules/new-file.js");
    });

    it("should add the file at the root when the folder that was picked is gone", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.selectItem("src/modules"));
      act(() => store.removeNode("src/modules"));

      // Act
      fireEvent.click(view.getByRole("button", { name: "File" }));

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "file",
        path: "new-file.js",
      });
    });

    it("should give the file it adds a name that is free", () => {
      // Arrange
      const { store } = renderPane({
        ...QUICK_START,
        tree: [...QUICK_START.tree, { path: "new-file.js", kind: "file" }],
      });

      // Act
      fireEvent.click(view.getByRole("button", { name: "File" }));

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "file",
        path: "new-file-2.js",
      });
    });

    it("should not offer to add a file when the tree cannot be edited, and still offer the config", () => {
      // Act
      renderPane(QUICK_START, NO_CAPABILITIES);

      // Assert
      expect(view.queryByRole("button", { name: "File" })).toBeNull();
      expect(
        view.getByRole("button", { name: "Open eslint.config.js" })
      ).toBeTruthy();
    });

    it("should be the pane again when the file in focus is removed", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.removeNode(FILE));

      // Assert
      expect(view.getByText("Open a file or the config")).toBeTruthy();
    });
  });

  describe("a file", () => {
    it("should show the path of the file in focus", () => {
      // Arrange
      const { store } = renderPane();

      // Act
      act(() => store.open({ kind: "file", path: FILE }));

      // Assert
      expect(view.getByText("File")).toBeTruthy();
      expect(view.getByText(FILE)).toBeTruthy();
    });

    it("should follow the file when it is renamed", () => {
      // Arrange
      const { store } = renderPane();
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => {
        store.renameNode("src/modules", "features");
      });

      // Assert
      expect(view.getByText("src/features/checkout/index.js")).toBeTruthy();
    });
  });

  describe("the config", () => {
    it("should show the text of the config in the editor", () => {
      // Arrange
      const { container, store } = renderPane();

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getEditorView(container).state.doc.toString()).toBe(
        QUICK_START.config
      );
    });

    it("should let the user edit the text when the config can be edited", () => {
      // Arrange
      const { container, store } = renderPane();

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getEditorView(container).state.readOnly).toBe(false);
    });

    it("should read the text only when the config cannot be edited", () => {
      // Arrange
      const { container, store } = renderPane(QUICK_START, NO_CAPABILITIES);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getEditorView(container).state.readOnly).toBe(true);
    });

    it("should change the config of the store after an edit, and report the sketch", () => {
      // Arrange
      const { container, store, onSketchChange } = renderPane();
      act(() => store.open({ kind: "config" }));

      // Act
      typeInEditor(container, "// note\n");

      // Assert
      expect(store.getState().sketch.config).toBe(
        `// note\n${QUICK_START.config}`
      );
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect((onSketchChange.mock.calls[0][0] as Sketch).tree).toBe(
        QUICK_START.tree
      );
    });

    it("should show the text that another pane changes", () => {
      // Arrange
      const { container, store } = renderPane();
      act(() => store.open({ kind: "config" }));

      // Act
      act(() => store.changeConfig("{}"));

      // Assert
      expect(getEditorView(container).state.doc.toString()).toBe("{}");
    });

    it("should mark the problems of the config at their ranges", () => {
      // Arrange
      const { container, store } = renderPane(WITH_ERROR);

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(container.querySelector(".cm-lintRange-error")?.textContent).toBe(
        '"dissallow"'
      );
    });

    it("should put the cursor at the start of the range that a target points at", () => {
      // Arrange
      const { container, store } = renderPane();
      const range = rangeOf('"boundaries/dependencies"');

      // Act
      act(() => store.open({ kind: "config", range }));

      // Assert
      expect(getEditorView(container).state.selection.main.head).toBe(
        range.from
      );
    });

    it("should put the cursor at the start of a range again when it is requested again", () => {
      // Arrange
      const { container, store } = renderPane();
      const range = rangeOf('"boundaries/dependencies"');
      act(() => store.open({ kind: "config", range }));
      act(() => {
        getEditorView(container).dispatch({ selection: { anchor: 0 } });
      });

      // Act
      act(() => store.open({ kind: "config", range }));

      // Assert
      expect(getEditorView(container).state.selection.main.head).toBe(
        range.from
      );
    });
  });

  describe("going back to the config", () => {
    it("should keep the undo history of the editor", () => {
      // Arrange
      const { container, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      typeInEditor(container, "// note\n");
      act(() => store.open({ kind: "file", path: FILE }));
      act(() => store.open({ kind: "config" }));
      const editor = getEditorView(container);
      let undone = false;

      // Act
      act(() => {
        undone = undo(editor);
      });

      // Assert
      expect(undone).toBe(true);
      expect(editor.state.doc.toString()).toBe(QUICK_START.config);
      expect(store.getState().sketch.config).toBe(QUICK_START.config);
    });

    it("should keep the text and the selection of the editor", () => {
      // Arrange
      const { container, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      typeInEditor(container, "// note\n");
      act(() => {
        getEditorView(container).dispatch({
          selection: EditorSelection.range(12, 20),
        });
      });
      act(() => store.open({ kind: "file", path: FILE }));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      const { state } = getEditorView(container);

      expect(state.doc.toString()).toBe(`// note\n${QUICK_START.config}`);
      expect([state.selection.main.anchor, state.selection.main.head]).toEqual([
        12, 20,
      ]);
    });

    it("should report the edits of the editor that opens again, and only once each", () => {
      // Arrange
      const { container, store, onSketchChange } = renderPane();
      act(() => store.open({ kind: "config" }));
      act(() => store.open({ kind: "file", path: FILE }));
      act(() => store.open({ kind: "config" }));

      // Act
      typeInEditor(container, " ");

      // Assert
      expect(onSketchChange).toHaveBeenCalledTimes(1);
      expect((onSketchChange.mock.calls[0][0] as Sketch).config).toBe(
        ` ${QUICK_START.config}`
      );
    });

    it("should start from the text of the store when it changed while the config was closed", () => {
      // Arrange
      const { container, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      act(() => store.open({ kind: "file", path: FILE }));
      act(() => store.changeConfig("{}"));

      // Act
      act(() => store.open({ kind: "config" }));

      // Assert
      expect(getEditorView(container).state.doc.toString()).toBe("{}");
    });

    it("should scroll to the range of a request that comes with the config", () => {
      // Arrange
      const { container, store } = renderPane();
      act(() => store.open({ kind: "config" }));
      act(() => store.open({ kind: "file", path: FILE }));
      const range = rangeOf('"boundaries/dependencies"');

      // Act
      act(() => store.open({ kind: "config", range }));

      // Assert
      expect(getEditorView(container).state.selection.main.head).toBe(
        range.from
      );
    });
  });
});
