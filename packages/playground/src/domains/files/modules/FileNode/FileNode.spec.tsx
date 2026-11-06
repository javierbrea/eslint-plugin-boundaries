import { act } from "@testing-library/react";
import { Profiler as RenderProfiler } from "react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import {
  NO_CAPABILITIES,
  renderInSession,
  waitForEvaluation,
} from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";

import { FileNode } from "./FileNode";
import { FileNodePom } from "./FileNode.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const FILE = "src/modules/checkout/index.js";

const FORMAT = "src/helpers/format/index.js";

const ENTRY = "src/index.js";

const FRAME_LABEL = "Pane under test";

/** The four lines of the file of the quick start, as the mockup draws them: a number, the statement and the verdict. */
const CHECKOUT_LINES = [
  '1import { Button } from "../../components/atoms/Button";policy 1',
  '2import { format } from "../../helpers/format";policy 1',
  '3import { renderButton } from "../../components/atoms/Button/Button.spec";policy 2',
  '4import React from "react";not checked · external',
];

/** What {@link renderNode} returns: the render of the session, the page object of the node and the spy of the renders. */
type NodeRender = SessionRender & {
  readonly node: FileNodePom;
  readonly onRender: jest.Mock;
};

/**
 * Renders the file node in a session, in the root element of the playground, as the shell renders it.
 * @param options What differs from an editable node of the checkout file in the quick start.
 * @param options.path The path of the file.
 * @param options.sketch The sketch to start from.
 * @param options.capabilities What the user can change.
 * @returns The render, the store, the spy of the sketches, the page object of the node and the spy of the renders of the node.
 */
function renderNode({
  path = FILE,
  sketch = QUICK_START,
  capabilities,
}: {
  path?: string;
  sketch?: Sketch;
  capabilities?: ProjectCapabilities;
} = {}): NodeRender {
  const onRender = jest.fn();

  return {
    ...renderInSession(
      <ThemeRoot>
        <RenderProfiler id="file-node" onRender={onRender}>
          <FileNode path={path} frameLabel={FRAME_LABEL} />
        </RenderProfiler>
      </ThemeRoot>,
      { sketch, capabilities }
    ),
    node: new FileNodePom(),
    onRender,
  };
}

/**
 * Adds `import format, { round } from "../../helpers/format";` to the open file with the picker, as the user does, and waits for the picker to be gone: while it fades out, the pane behind it is hidden from assistive technology.
 * @param node The page object of the node.
 * @returns A promise that settles when the picker is gone.
 */
async function addMockupDependency(node: FileNodePom): Promise<void> {
  const { picker } = node;

  node.addButton.press();
  picker.file.open();
  picker.file.choose(FORMAT);
  picker.names.openEditor();
  picker.names.chooseKind("default");
  picker.names.typeName("format");
  picker.names.confirm();
  picker.names.openEditor();
  picker.names.chooseKind("named");
  picker.names.typeName("round");
  picker.names.confirm();
  picker.confirm();
  await picker.waitUntilGone();
}

describe("FileNode", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  describe("testId", () => {
    it("should render its own test id on the pane, in place of the one of the pane", () => {
      // Arrange
      renderNode();

      // Act
      const { isRendered } = new FileNodePom({ testId: "file-node" });

      // Assert
      expect(isRendered).toBe(true);
      expect(new FileNodePom({ testId: "file-pane" }).isRendered).toBe(false);
    });
  });

  describe("the pane", () => {
    it("should be the landmark that the label it is given names", () => {
      // Act
      const { node } = renderNode();

      // Assert
      expect(node.frame.isRegionNamed(FRAME_LABEL)).toBe(true);
    });

    it("should show the path of the file", () => {
      // Act
      const { node } = renderNode();

      // Assert
      expect(node.head.label).toBe("File");
      expect(node.head.path).toBe(FILE);
    });
  });

  describe("the dependencies", () => {
    it("should show one line for each dependency of the file, with its statement and the verdict of the engine", () => {
      // Act
      const { node } = renderNode();

      // Assert
      expect(node.lines.lineTexts).toEqual(CHECKOUT_LINES);
    });

    it("should show the verdict of a dependency that is disallowed in the color of an error, and not the others", () => {
      // Arrange
      const { node } = renderNode();
      const [allowed, , disallowed, skipped] = node.lines.lines.map(
        ({ verdict }) => verdict.color
      );

      // Assert
      expect(disallowed).not.toBe(allowed);
      expect(skipped).not.toBe(allowed);
      expect(skipped).not.toBe(disallowed);
    });

    it("should say why a dependency is not checked when the pointer is over its verdict", async () => {
      // Arrange
      const { node } = renderNode();

      // Act
      node.lines.line(3).verdict.hover();
      await node.lines.tooltip.waitUntilShown();

      // Assert
      expect(node.lines.tooltip.text).toBe(
        "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins."
      );
    });

    it("should show no line for a file without dependencies", () => {
      // Act
      const { node } = renderNode({
        path: "src/components/atoms/Button/Button.css",
      });

      // Assert
      expect(node.lines.isRendered).toBe(false);
    });

    it("should show the lines that the store has after a dependency is removed", () => {
      // Arrange
      const { node, store } = renderNode();

      // Act
      act(() => store.removeDependency({ path: FILE, index: 2 }));

      // Assert
      expect(node.lines.lineTexts).toEqual([
        CHECKOUT_LINES[0],
        CHECKOUT_LINES[1],
        '3import React from "react";not checked · external',
      ]);
    });

    it("should show the verdicts again a moment after the config changes", () => {
      // Arrange
      jest.useFakeTimers();
      const { node, store } = renderNode();

      // Act
      act(() =>
        store.changeConfig(
          QUICK_START.config.replace(
            'types: ["component", "helper"]',
            'types: ["helper"]'
          )
        )
      );
      waitForEvaluation();

      // Assert
      expect(node.lines.lineTexts[0]).toBe(
        '1import { Button } from "../../components/atoms/Button";default'
      );
    });
  });

  describe("the line in focus", () => {
    it("should mark none while nothing of the file is in focus", () => {
      // Act
      const { node } = renderNode();

      // Assert
      expect(node.lines.lines.map(({ isSelected }) => isSelected)).toEqual([
        false,
        false,
        false,
        false,
      ]);
    });

    it("should mark the dependency of the file that is in focus", () => {
      // Arrange
      const { node, store } = renderNode();

      // Act
      act(() => store.open({ kind: "dependency", path: FILE, index: 2 }));

      // Assert
      expect(node.lines.lines.map(({ isSelected }) => isSelected)).toEqual([
        false,
        false,
        true,
        false,
      ]);
    });

    it("should mark none when the dependency in focus belongs to another file", () => {
      // Arrange
      const { node, store } = renderNode();

      // Act
      act(() => store.open({ kind: "dependency", path: ENTRY, index: 0 }));

      // Assert
      expect(node.lines.lines.map(({ isSelected }) => isSelected)).toEqual([
        false,
        false,
        false,
        false,
      ]);
    });

    it("should put a dependency in focus, and select its tab of the problems, when its line is clicked", () => {
      // Arrange
      const { node, store } = renderNode();

      // Act
      node.lines.line(2).click();

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "dependency",
        path: FILE,
        index: 2,
      });
      expect(store.getState().tab).toBe("dependency");
      expect(node.lines.line(2).isSelected).toBe(true);
    });

    it("should keep the same line marked when a line before it is removed", () => {
      // Arrange
      const { node } = renderNode();
      node.lines.line(3).click();

      // Act
      node.lines.line(0).deleteAction.press();

      // Assert
      expect(node.lines.lines.map(({ isSelected }) => isSelected)).toEqual([
        false,
        false,
        true,
      ]);
    });
  });

  describe("adding a dependency", () => {
    it("should not draw the picker until the user asks for it", () => {
      // Act
      const { node } = renderNode();

      // Assert
      expect(node.picker.isRendered).toBe(false);
    });

    it("should open the picker for the file from + Dependency", () => {
      // Arrange
      const { node } = renderNode();

      // Act
      node.addButton.press();

      // Assert
      expect(node.picker.title).toBe("Add a dependency");
      expect(node.picker.fromText).toBe(`to ${FILE}`);
    });

    it("should add the line with the verdict of the engine when the user confirms the picker", async () => {
      // Arrange
      const { node } = renderNode();

      // Act
      await addMockupDependency(node);

      // Assert
      expect(node.lines.lineTexts).toEqual([
        ...CHECKOUT_LINES,
        '5import format, { round } from "../../helpers/format";policy 1',
      ]);
    });

    it("should put the line it adds in focus", async () => {
      // Arrange
      const { node, store } = renderNode();

      // Act
      await addMockupDependency(node);

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "dependency",
        path: FILE,
        index: 4,
      });
      expect(node.lines.line(4).isSelected).toBe(true);
    });

    it("should close the picker once the dependency is added", async () => {
      // Arrange
      const { node } = renderNode();

      // Act
      await addMockupDependency(node);

      // Assert
      expect(node.picker.isRendered).toBe(false);
    });

    it("should add nothing, and close the picker, when the user gives up", async () => {
      // Arrange
      const { node, store } = renderNode();
      const { sketch } = store.getState();
      node.addButton.press();

      // Act
      node.picker.cancel();
      await node.picker.waitUntilGone();

      // Assert
      expect(store.getState().sketch).toBe(sketch);
      expect(node.lines.lineTexts).toEqual(CHECKOUT_LINES);
    });

    it("should start from an empty draft each time the picker opens", async () => {
      // Arrange
      const { node } = renderNode();
      node.addButton.press();
      node.picker.target.select("An external module");
      node.picker.typeModule("lodash");
      node.picker.cancel();
      await node.picker.waitUntilGone();

      // Act
      node.addButton.press();

      // Assert
      expect(node.picker.target.checked).toBe("A file of the sketch");
      expect(node.picker.file.value).toBe("");
    });
  });

  describe("editing a dependency", () => {
    it("should open the picker with the dependency of the line from its edit action", () => {
      // Arrange
      const { node } = renderNode();

      // Act
      node.lines.line(1).editAction.press();

      // Assert
      expect(node.picker.title).toBe("Edit a dependency");
      expect(node.picker.file.value).toBe(FORMAT);
      expect(node.picker.names.chipTexts).toEqual(["named format"]);
    });

    it("should replace the line, in its position, with an external module and its verdict", async () => {
      // Arrange
      const { node } = renderNode();
      node.lines.line(1).editAction.press();

      // Act
      node.picker.target.select("An external module");
      node.picker.typeModule("lodash");
      node.picker.confirm();
      await node.picker.waitUntilGone();

      // Assert
      expect(node.lines.lineTexts).toEqual([
        CHECKOUT_LINES[0],
        '2import { format } from "lodash";not checked · external',
        CHECKOUT_LINES[2],
        CHECKOUT_LINES[3],
      ]);
    });

    it("should keep the line in focus when it is the one that is edited", async () => {
      // Arrange
      const { node, store } = renderNode();
      node.lines.line(1).click();
      node.lines.line(1).editAction.press();

      // Act
      node.picker.target.select("An external module");
      node.picker.typeModule("lodash");
      node.picker.confirm();
      await node.picker.waitUntilGone();

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "dependency",
        path: FILE,
        index: 1,
      });
    });

    it("should keep the title while the picker fades out after the dependency is saved", () => {
      // Arrange
      const { node } = renderNode();
      node.lines.line(1).editAction.press();

      // Act
      node.picker.confirm();

      // Assert
      expect(node.picker.title).toBe("Edit a dependency");
    });

    it("should offer to add again after an edit", async () => {
      // Arrange
      const { node } = renderNode();
      node.lines.line(1).editAction.press();
      node.picker.cancel();
      await node.picker.waitUntilGone();

      // Act
      node.addButton.press();

      // Assert
      expect(node.picker.title).toBe("Add a dependency");
    });
  });

  describe("removing a dependency", () => {
    it("should remove the line at once, without asking", () => {
      // Arrange
      const { node, store } = renderNode();

      // Act
      node.lines.line(2).deleteAction.press();

      // Assert
      expect(node.picker.isRendered).toBe(false);
      expect(node.lines.lineTexts).toEqual([
        CHECKOUT_LINES[0],
        CHECKOUT_LINES[1],
        '3import React from "react";not checked · external',
      ]);
      expect(store.getState().sketch.dependencies).toHaveLength(8);
    });
  });

  describe("the keyboard focus after a dependency is removed", () => {
    it("should go to the line that takes the number of the one removed", () => {
      // Arrange
      const { node } = renderNode();
      node.lines.line(1).deleteAction.focus();

      // Act
      node.lines.line(1).deleteAction.press();

      // Assert
      expect(node.lines.line(1).isFocused).toBe(true);
    });

    it("should go to the line before when the one removed was the last", () => {
      // Arrange
      const { node } = renderNode();
      node.lines.line(3).deleteAction.focus();

      // Act
      node.lines.line(3).deleteAction.press();

      // Assert
      expect(node.lines.line(2).isFocused).toBe(true);
    });

    it("should go to + Dependency when the file has no line left", () => {
      // Arrange
      const { node } = renderNode({ path: FORMAT });
      node.lines.line(0).deleteAction.focus();

      // Act
      node.lines.line(0).deleteAction.press();

      // Assert
      expect(node.lines.isRendered).toBe(false);
      expect(node.addButton.isFocused).toBe(true);
    });
  });

  describe("when the dependencies cannot be edited", () => {
    it("should show the lines, and no button that adds one, no hint and no actions", () => {
      // Act
      const { node } = renderNode({ capabilities: NO_CAPABILITIES });

      // Assert
      expect(node.lines.lineTexts).toEqual(CHECKOUT_LINES);
      expect(node.addButton.isRendered).toBe(false);
      expect(node.hint).toBeNull();
      expect(node.lines.lines.map(({ actionNames }) => actionNames)).toEqual([
        [],
        [],
        [],
        [],
      ]);
    });

    it("should still put a dependency in focus when its line is clicked", () => {
      // Arrange
      const { node, store } = renderNode({ capabilities: NO_CAPABILITIES });

      // Act
      node.lines.line(0).click();

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "dependency",
        path: FILE,
        index: 0,
      });
    });
  });

  describe("rendering", () => {
    it("should not render again when a dependency of another file takes the focus", () => {
      // Arrange
      const { store, onRender } = renderNode();
      const renders = onRender.mock.calls.length;

      // Act
      act(() => store.open({ kind: "dependency", path: ENTRY, index: 0 }));

      // Assert
      expect(onRender).toHaveBeenCalledTimes(renders);
    });

    it("should render again when a line changes", () => {
      // Arrange
      const { store, onRender } = renderNode();
      const renders = onRender.mock.calls.length;

      // Act
      act(() => store.removeDependency({ path: FILE, index: 0 }));

      // Assert
      expect(onRender.mock.calls.length).toBeGreaterThan(renders);
    });
  });
});
