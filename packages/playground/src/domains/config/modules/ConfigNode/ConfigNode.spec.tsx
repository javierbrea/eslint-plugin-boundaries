// cspell:ignore dissallow -- a deliberate typo, the mistake of the config that the test reports
import { act } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { ConfigEditorSnapshotProvider } from "@/domains/config/ui/contexts/ConfigEditorSnapshotContext";
import type { TextRange } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import {
  NO_CAPABILITIES,
  renderInSession,
} from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";

import { ConfigNode } from "./ConfigNode";
import { ConfigNodePom } from "./ConfigNode.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const FRAME_LABEL = "Node in focus";

/** The quick-start config with an option that is not valid: one error, placed at `"dissallow"`. */
const WITH_ERROR: Sketch = {
  ...QUICK_START,
  config: QUICK_START.config.replace(
    'default: "disallow"',
    'default: "dissallow"'
  ),
};

/** What {@link renderNode} returns: the render of the session, and the page object of the node. */
type NodeRender = SessionRender & { readonly node: ConfigNodePom };

/**
 * Renders the config node in a session, with the snapshot of the config editor that the shell provides.
 * @param sketch The sketch to start from.
 * @param capabilities What the user can change; everything when it is unset.
 * @returns The render, the store, the spy of the sketches and the page object of the node.
 */
function renderNode(
  sketch: Sketch = QUICK_START,
  capabilities?: Parameters<typeof renderInSession>[1]["capabilities"]
): NodeRender {
  return {
    ...renderInSession(
      <ConfigEditorSnapshotProvider>
        <ConfigNode frameLabel={FRAME_LABEL} />
      </ConfigEditorSnapshotProvider>,
      { sketch, capabilities }
    ),
    node: new ConfigNodePom(),
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

describe("ConfigNode", () => {
  it("should be the landmark that the label it is given names", () => {
    // Arrange
    const { node } = renderNode();

    // Act
    const { isLandmark, label } = node.pane.frame;

    // Assert
    expect(isLandmark).toBe(true);
    expect(label).toBe(FRAME_LABEL);
  });

  it("should show the text of the config in the editor", () => {
    // Arrange
    const { node } = renderNode();

    // Act
    const { text } = node.editor;

    // Assert
    expect(text).toBe(QUICK_START.config);
  });

  it("should let the user edit the text when the config can be edited", () => {
    // Arrange
    const { node } = renderNode();

    // Act
    const { isReadOnly } = node.editor;

    // Assert
    expect(isReadOnly).toBe(false);
  });

  it("should read the text only when the config cannot be edited", () => {
    // Arrange
    const { node } = renderNode(QUICK_START, NO_CAPABILITIES);

    // Act
    const { isReadOnly } = node.editor;

    // Assert
    expect(isReadOnly).toBe(true);
  });

  it("should change the config of the store after an edit, and report the sketch", () => {
    // Arrange
    const { node, store, onSketchChange } = renderNode();

    // Act
    node.editor.typeAt(0, "// note\n");

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
    const { node, store } = renderNode();

    // Act
    act(() => store.changeConfig("{}"));

    // Assert
    expect(node.editor.text).toBe("{}");
  });

  it("should mark the problems of the config at their ranges", () => {
    // Arrange
    const { node } = renderNode(WITH_ERROR);

    // Act
    const underlined = node.editor.underlinedText("error");

    // Assert
    expect(underlined).toBe('"dissallow"');
  });

  it("should put the cursor at the start of the range that a target points at", () => {
    // Arrange
    const { node, store } = renderNode();
    const range = rangeOf('"boundaries/dependencies"');

    // Act
    act(() => store.open({ kind: "config", range }));

    // Assert
    expect(node.editor.cursor).toBe(range.from);
  });

  it("should put the cursor at the start of a range again when it is requested again", () => {
    // Arrange
    const { node, store } = renderNode();
    const range = rangeOf('"boundaries/dependencies"');
    act(() => store.open({ kind: "config", range }));
    node.editor.moveCursor(0);

    // Act
    act(() => store.open({ kind: "config", range }));

    // Assert
    expect(node.editor.cursor).toBe(range.from);
  });
});
