import { act } from "@testing-library/react";
import { Profiler as RenderProfiler } from "react";

import type { ProjectCapabilities, Sketch } from "@/contract";
import { LATE_AFTER } from "@/domains/evaluation/helpers/evaluator";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import {
  NO_CAPABILITIES,
  failEvaluation,
  releaseEvaluation,
  renderInSession,
  waitForEvaluation,
  waitUntilEvaluationIsLate,
  waitUntilEvaluationStops,
} from "@/domains/session/data/store/store.mock";
import type { SessionRender } from "@/domains/session/data/store/store.mock";
import { holdInlineWorkers } from "@/shared/testing/inlineWorker";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
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
  '1import { Button } from "../../components/atoms/Button/index.js";policy 1',
  '2import { format } from "../../helpers/format/index.js";policy 1',
  '3import { renderButton } from "../../components/atoms/Button/Button.spec.js";policy 2',
  '4import React from "react";not checked · external',
];

/** The four lines of the same file before any evaluation decides them: the statements, with no verdict. */
const CHECKOUT_STATEMENTS = [
  '1import { Button } from "../../components/atoms/Button/index.js";',
  '2import { format } from "../../helpers/format/index.js";',
  '3import { renderButton } from "../../components/atoms/Button/Button.spec.js";',
  '4import React from "react";',
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
 * Adds `import formatDefault, { round } from "../../helpers/format/index.js";` to the open file with the picker, as the user does, and waits for the picker to be gone: while it fades out, the pane behind it is hidden from assistive technology.
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
  picker.names.typeName("formatDefault");
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

      // Act
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
        '1import { Button } from "../../components/atoms/Button/index.js";default'
      );
    });
  });

  describe("before the first evaluation", () => {
    beforeEach(() => {
      jest.useFakeTimers();
      holdInlineWorkers();
    });

    it("should show the statements of the sketch with an empty verdict, in full, while the evaluation is not late", () => {
      // Arrange
      const { node } = renderNode();

      // Act
      act(() => {
        jest.advanceTimersByTime(LATE_AFTER - 1);
      });
      const { lines } = node.lines;

      // Assert
      expect(node.lines.lineTexts).toEqual(CHECKOUT_STATEMENTS);
      expect(lines.map(({ verdict }) => verdict.icon.isRendered)).toEqual([
        false,
        false,
        false,
        false,
      ]);
      expect(lines.map(({ verdict }) => verdict.opacity)).toEqual([
        "1",
        "1",
        "1",
        "1",
      ]);
    });

    it("should let the line in focus be chosen, though no verdict is there to explain", () => {
      // Arrange
      const { node, store } = renderNode();

      // Act
      node.lines.line(1).click();

      // Assert
      expect(store.getState().focus).toEqual({
        kind: "dependency",
        path: FILE,
        index: 1,
      });
      expect(node.lines.line(1).isSelected).toBe(true);
    });

    it("should say that each dependency is being evaluated once the evaluation is late, with the verdicts faded", () => {
      // Arrange
      const { node } = renderNode();

      // Act
      waitUntilEvaluationIsLate();
      const { lines } = node.lines;

      // Assert
      expect(lines.map(({ verdict }) => verdict.text)).toEqual(
        Array.from({ length: 4 }, () => "evaluating…")
      );
      expect(lines.map(({ verdict }) => verdict.icon.pathData)).toEqual(
        Array.from({ length: 4 }, () => ICON_PATHS.skip)
      );
      expect(lines.map(({ verdict }) => verdict.opacity)).toEqual(
        Array.from({ length: 4 }, () => "0.5")
      );
    });

    it("should say that each dependency was not evaluated when the evaluation is stopped", () => {
      // Arrange
      const { node } = renderNode();

      // Act
      waitUntilEvaluationStops();
      const { lines } = node.lines;

      // Assert
      expect(lines.map(({ verdict }) => verdict.text)).toEqual(
        Array.from({ length: 4 }, () => "not evaluated")
      );
      expect(lines.map(({ verdict }) => verdict.opacity)).toEqual(
        Array.from({ length: 4 }, () => "0.5")
      );
    });

    it("should say that each dependency was not evaluated when the evaluation could not run", () => {
      // Arrange
      const { node } = renderNode();

      // Act
      failEvaluation();
      const { lines } = node.lines;

      // Assert
      expect(lines.map(({ verdict }) => verdict.text)).toEqual(
        Array.from({ length: 4 }, () => "not evaluated")
      );
      expect(lines.map(({ verdict }) => verdict.opacity)).toEqual(
        Array.from({ length: 4 }, () => "0.5")
      );
    });

    it("should show the verdicts of the engine, in full, when the evaluation arrives", () => {
      // Arrange
      const { node } = renderNode();
      waitUntilEvaluationIsLate();

      // Act
      releaseEvaluation();

      // Assert
      expect(node.lines.lineTexts).toEqual(CHECKOUT_LINES);
      expect(node.lines.lines.map(({ verdict }) => verdict.opacity)).toEqual([
        "1",
        "1",
        "1",
        "1",
      ]);
    });
  });

  describe("an evaluation that is out of date", () => {
    /** The line that {@link renderOutOfDate} adds after the four of the file. */
    const ADDED_LINE = '5import "lodash";';

    /**
     * Renders the node with the evaluation of the sketch, and then adds a dependency to the file while the worker holds the request of the new sketch.
     * @returns The render of the node.
     */
    function renderOutOfDate(): NodeRender {
      jest.useFakeTimers();

      const render = renderNode();

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

    it("should show the dependency that the evaluation has not decided with an empty verdict, and keep the others, in full", () => {
      // Arrange
      const { node } = renderOutOfDate();

      // Act
      act(() => {
        jest.advanceTimersByTime(LATE_AFTER - 1);
      });
      const { lines } = node.lines;

      // Assert
      expect(node.lines.lineTexts).toEqual([...CHECKOUT_LINES, ADDED_LINE]);
      expect(lines[4].verdict.icon.isRendered).toBe(false);
      expect(lines.map(({ verdict }) => verdict.opacity)).toEqual(
        Array.from({ length: 5 }, () => "1")
      );
    });

    it("should say that the new dependency is being evaluated once the evaluation is late, and fade every verdict", () => {
      // Arrange
      const { node } = renderOutOfDate();

      // Act
      waitUntilEvaluationIsLate();
      const { lines } = node.lines;

      // Assert
      expect(node.lines.lineTexts).toEqual([
        ...CHECKOUT_LINES,
        `${ADDED_LINE}evaluating…`,
      ]);
      expect(lines[4].verdict.icon.pathData).toBe(ICON_PATHS.skip);
      expect(lines.map(({ verdict }) => verdict.opacity)).toEqual(
        Array.from({ length: 5 }, () => "0.5")
      );
    });

    it("should say that the new dependency was not evaluated when the evaluation is stopped, and keep fading the others", () => {
      // Arrange
      const { node } = renderOutOfDate();

      // Act
      waitUntilEvaluationStops();
      const { lines } = node.lines;

      // Assert
      expect(node.lines.lineTexts).toEqual([
        ...CHECKOUT_LINES,
        `${ADDED_LINE}not evaluated`,
      ]);
      expect(lines.map(({ verdict }) => verdict.opacity)).toEqual(
        Array.from({ length: 5 }, () => "0.5")
      );
    });

    it("should say that the new dependency was not evaluated when the evaluation could not run, and keep fading the others", () => {
      // Arrange
      const { node } = renderOutOfDate();

      // Act
      failEvaluation();
      const { lines } = node.lines;

      // Assert
      expect(node.lines.lineTexts).toEqual([
        ...CHECKOUT_LINES,
        `${ADDED_LINE}not evaluated`,
      ]);
      expect(lines.map(({ verdict }) => verdict.opacity)).toEqual(
        Array.from({ length: 5 }, () => "0.5")
      );
    });

    it("should show the verdict of the new dependency, and every verdict in full, when the evaluation arrives", () => {
      // Arrange
      const { node } = renderOutOfDate();
      waitUntilEvaluationIsLate();

      // Act
      releaseEvaluation();
      const { lines } = node.lines;

      // Assert
      expect(lines[4].verdict.text).toBe("not checked · external");
      expect(lines.map(({ verdict }) => verdict.opacity)).toEqual(
        Array.from({ length: 5 }, () => "1")
      );
    });

    it("should fade the verdicts that stay while the evaluation of a removed dependency is late, and keep what they say", () => {
      // Arrange
      jest.useFakeTimers();
      const { node, store } = renderNode();
      holdInlineWorkers();
      act(() => store.removeDependency({ path: FILE, index: 2 }));
      const whileOnItsWay = node.lines.lines.map(
        ({ verdict }) => verdict.opacity
      );

      // Act
      waitUntilEvaluationIsLate();

      // Assert
      expect(whileOnItsWay).toEqual(["1", "1", "1"]);
      expect(node.lines.lineTexts).toEqual([
        CHECKOUT_LINES[0],
        CHECKOUT_LINES[1],
        '3import React from "react";not checked · external',
      ]);
      expect(node.lines.lines.map(({ verdict }) => verdict.opacity)).toEqual([
        "0.5",
        "0.5",
        "0.5",
      ]);
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
        '5import formatDefault, { round } from "../../helpers/format/index.js";policy 1',
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

    it("should not refuse the dependency it added while the picker fades out", () => {
      // Arrange
      const { node } = renderNode();
      const { picker } = node;
      node.addButton.press();
      picker.target.select("An external module");
      picker.typeModule("lodash");
      picker.names.openEditor();
      picker.names.typeName("debounce");
      picker.names.confirm();

      // Act
      picker.confirm();

      // Assert
      expect(picker.isRendered).toBe(true);
      expect(picker.refusal).toBeNull();
      expect(picker.isConfirmEnabled).toBe(true);
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
      expect(node.picker.target.checked).toBe("A file of the project");
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
