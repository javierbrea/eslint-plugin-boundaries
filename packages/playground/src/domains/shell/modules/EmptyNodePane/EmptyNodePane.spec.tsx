import { act } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import {
  NO_CAPABILITIES,
  renderInSession,
} from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";

import { EmptyNodePane } from "./EmptyNodePane";
import { EmptyNodePanePom } from "./EmptyNodePane.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const FRAME_LABEL = "Node in focus";

/** What {@link renderPane} returns: the render of the session, and the page object of the pane. */
type PaneRender = SessionRender & { readonly pane: EmptyNodePanePom };

/**
 * Renders the empty node pane in a session.
 * @param sketch The sketch to start from.
 * @param capabilities What the user can change; everything when it is unset.
 * @returns The render, the store, the spy of the sketches and the page object of the pane.
 */
function renderPane(
  sketch: Sketch = QUICK_START,
  capabilities?: Parameters<typeof renderInSession>[1]["capabilities"]
): PaneRender {
  return {
    ...renderInSession(<EmptyNodePane frameLabel={FRAME_LABEL} />, {
      sketch,
      capabilities,
    }),
    pane: new EmptyNodePanePom(),
  };
}

describe("EmptyNodePane", () => {
  it("should be the landmark that the label it is given names", () => {
    // Arrange
    const { pane } = renderPane();

    // Act
    const { isLandmark, label } = pane.node.frame;

    // Assert
    expect(isLandmark).toBe(true);
    expect(label).toBe(FRAME_LABEL);
  });

  it("should put the config in focus when the user chooses to open it", () => {
    // Arrange
    const { pane, store } = renderPane();

    // Act
    pane.node.openConfigButton.press();

    // Assert
    expect(store.getState().focus).toEqual({ kind: "config" });
  });

  it("should not scroll the editor to anything when the config is opened from its button", () => {
    // Arrange
    const { pane, store } = renderPane();

    // Act
    pane.node.openConfigButton.press();

    // Assert
    expect(store.getState().reveal).toBeUndefined();
  });

  it("should add a file at the root, open it and start renaming it", () => {
    // Arrange
    const { pane, store, onSketchChange } = renderPane();

    // Act
    pane.node.addFileButton.press();

    // Assert
    const state = store.getState();

    expect(state.sketch.tree.map(({ path }) => path)).toContain("new-file.js");
    expect(state.focus).toEqual({ kind: "file", path: "new-file.js" });
    expect(state.renaming).toBe("new-file.js");
    expect(onSketchChange).toHaveBeenCalledTimes(1);
  });

  it("should show the tree when the project was shown as text, so that the name can be edited", () => {
    // Arrange
    const { pane, store } = renderPane();
    act(() => store.setView("text"));

    // Act
    pane.node.addFileButton.press();

    // Assert
    expect(store.getState().view).toBe("tree");
  });

  it("should add the file in the folder that the user picked in the tree", () => {
    // Arrange
    const { pane, store } = renderPane();
    act(() => store.selectItem("src/modules"));

    // Act
    pane.node.addFileButton.press();

    // Assert
    expect(store.getState().focus).toEqual({
      kind: "file",
      path: "src/modules/new-file.js",
    });
    expect(store.getState().renaming).toBe("src/modules/new-file.js");
  });

  it("should add the file at the root when the folder that was picked is gone", () => {
    // Arrange
    const { pane, store } = renderPane();
    act(() => store.selectItem("src/modules"));
    act(() => store.removeNode("src/modules"));

    // Act
    pane.node.addFileButton.press();

    // Assert
    expect(store.getState().focus).toEqual({
      kind: "file",
      path: "new-file.js",
    });
  });

  it("should give the file it adds a name that is free", () => {
    // Arrange
    const { pane, store } = renderPane({
      ...QUICK_START,
      tree: [...QUICK_START.tree, { path: "new-file.js", kind: "file" }],
    });

    // Act
    pane.node.addFileButton.press();

    // Assert
    expect(store.getState().focus).toEqual({
      kind: "file",
      path: "new-file-2.js",
    });
  });

  it("should not offer to add a file when the tree cannot be edited, and still offer the config", () => {
    // Arrange
    const { pane } = renderPane(QUICK_START, NO_CAPABILITIES);

    // Act
    const { addFileButton, openConfigButton } = pane.node;

    // Assert
    expect(addFileButton.isRendered).toBe(false);
    expect(openConfigButton.isRendered).toBe(true);
  });
});
