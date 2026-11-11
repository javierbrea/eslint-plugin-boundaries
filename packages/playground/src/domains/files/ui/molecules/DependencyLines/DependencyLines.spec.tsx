import { act, render } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { getDependencyLines } from "@/domains/files/ui/helpers/dependencyLines";
import type { DependencyLine } from "@/domains/files/ui/helpers/dependencyLines";
import { renderInRoot } from "@/shared/testing/renderInRoot";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";
import { ThemeRoot } from "@/ui-kit/providers/ThemeRoot";
import { ThemeRootPom } from "@/ui-kit/providers/ThemeRoot/ThemeRoot.pom";

import { DependencyLines } from "./DependencyLines";
import { DependencyLinesPom } from "./DependencyLines.pom";
import type { DependencyLinesProps } from "./DependencyLines.types";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const CHECKOUT = "src/modules/checkout/index.js";

const { evaluate } = createEngine();

/**
 * Writes the lines of a file of a sketch, as the file pane does.
 * @param path The path of the file.
 * @param sketch The sketch to evaluate. The quick-start project by default.
 * @returns The lines, in the order of the file.
 */
function getLines(
  path: string,
  sketch: Sketch = QUICK_START
): DependencyLine[] {
  return getDependencyLines(
    evaluate(sketch).dependencies.filter(({ ref }) => ref.path === path),
    "current"
  );
}

/** The four lines of `src/modules/checkout/index.js` of the quick-start project: the mockup draws them. */
const LINES = getLines(CHECKOUT);

/** What {@link renderLines} returns: the props it rendered the list with, its page object and the function that renders it again with other props. */
type LinesRender = {
  readonly props: DependencyLinesProps;
  readonly list: DependencyLinesPom;
  readonly update: (changes: Partial<DependencyLinesProps>) => void;
};

/**
 * Renders the list.
 * @param overrides What differs from an editable list of the four lines of the checkout file with none selected.
 * @returns The props it was rendered with, its page object and the function that updates it.
 */
function renderLines(
  overrides: Partial<DependencyLinesProps> = {}
): LinesRender {
  const props: DependencyLinesProps = {
    lines: LINES,
    selectedIndex: undefined,
    editable: true,
    onSelect: jest.fn(),
    onEdit: jest.fn(),
    onRemove: jest.fn(),
    ...overrides,
  };

  const { rerender } = render(
    <ThemeRoot>
      <DependencyLines {...props} />
    </ThemeRoot>
  );

  return {
    props,
    list: new DependencyLinesPom(),
    update: (changes) =>
      rerender(
        <ThemeRoot>
          <DependencyLines {...props} {...changes} />
        </ThemeRoot>
      ),
  };
}

describe("DependencyLines", () => {
  beforeEach(() => {
    // React logs a prop that a styled part leaks to the DOM as an attribute it does not know, once for each name, so every test of the file watches for it
    jest.spyOn(console, "error").mockReturnValue(undefined);
  });

  afterEach(() => {
    const logged = [...jest.mocked(console.error).mock.calls];

    jest.useRealTimers();
    jest.mocked(console.error).mockRestore();

    if (logged.length > 0) {
      throw new Error(`React logged to the console: ${JSON.stringify(logged)}`);
    }
  });

  // React logs a leaked prop once for each name, so the test that looks for it runs before any other test of the file renders the component
  describe("props", () => {
    it("should not pass the dimmed state of a verdict to the DOM", () => {
      // Arrange
      renderLines({ lines: LINES.map((line) => ({ ...line, dimmed: true })) });

      // Act
      const logged = jest.mocked(console.error).mock.calls;

      // Assert
      expect(logged).toEqual([]);
    });
  });

  describe("the list", () => {
    it("should draw nothing for an empty list", () => {
      // Arrange
      const props: DependencyLinesProps = {
        lines: [],
        selectedIndex: undefined,
        editable: true,
        onSelect: jest.fn(),
        onEdit: jest.fn(),
        onRemove: jest.fn(),
      };
      renderInRoot(<DependencyLines {...props} />);
      const root = new ThemeRootPom();

      // Act
      const { isEmpty } = root;

      // Assert
      expect(isEmpty).toBe(true);
    });

    it("should draw one line for each dependency, in order, with its number, its statement and its verdict", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { lineTexts } = list;

      // Assert
      expect(lineTexts).toEqual([
        '1import { Button } from "../../components/atoms/Button/index.js";policy 1',
        '2import { format } from "../../helpers/format/index.js";policy 1',
        '3import { renderButton } from "../../components/atoms/Button/Button.spec.js";policy 2',
        '4import React from "react";not checked · external',
      ]);
    });

    it("should number the lines from 1, as the editor numbers them", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { lineNumbers } = list;

      // Assert
      expect(lineNumbers).toEqual(["1", "2", "3", "4"]);
    });
  });

  describe("the grid", () => {
    it("should lay out the number, the statement, the actions and the verdict of a line in four columns", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { columns } = list.line(0);

      // Assert
      expect(columns).toBe("44px minmax(0, 1fr) 64px 176px");
    });

    it("should let a long statement wrap instead of cutting it", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { statementWrap } = list.line(2);

      // Assert
      expect(statementWrap).toBe("anywhere");
    });

    it("should align the verdict to the end of its column, in the small mono text of the code area", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { alignment, fontSize } = list.line(3).verdict;

      // Assert
      expect(alignment).toBe("flex-end");
      expect(fontSize).toBe("11.5px");
    });
  });

  describe("the statement", () => {
    it("should color the keywords and the source of the statement, and leave the rest to the code area", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { statementParts } = list.line(1);

      // Assert
      expect(statementParts).toEqual([
        { text: "import", color: "var(--jsb-code-keyword)" },
        { text: " { format } ", color: expect.not.stringContaining("--jsb-") },
        { text: "from", color: "var(--jsb-code-keyword)" },
        { text: " ", color: expect.not.stringContaining("--jsb-") },
        {
          text: '"../../helpers/format/index.js"',
          color: "var(--jsb-code-string)",
        },
        { text: ";", color: expect.not.stringContaining("--jsb-") },
      ]);
    });
  });

  describe("the verdict", () => {
    it("should read the policy that decided, or that the dependency is not checked and why", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const verdicts = list.lines.map(({ verdict }) => verdict.text);

      // Assert
      expect(verdicts).toEqual([
        "policy 1",
        "policy 1",
        "policy 2",
        "not checked · external",
      ]);
    });

    it("should draw each verdict in the color of a code area: allowed, disallowed and not checked", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const colors = list.lines.map(({ verdict }) => verdict.color);

      // Assert
      expect(colors).toEqual([
        "var(--jsb-code-string)",
        "var(--jsb-code-string)",
        "var(--jsb-code-error)",
        "var(--jsb-code-comment)",
      ]);
    });

    it("should draw the check, the cross and the skip, and say allowed and disallowed to assistive technology", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const icons = list.lines.map(({ verdict }) => verdict.icon);

      // Assert
      expect(icons.map(({ pathData }) => pathData)).toEqual([
        ICON_PATHS.check,
        ICON_PATHS.check,
        ICON_PATHS.cross,
        ICON_PATHS.skip,
      ]);
      expect(icons.map((icon) => icon.isImageNamed("allowed"))).toEqual([
        true,
        true,
        false,
        false,
      ]);
      expect(icons.map((icon) => icon.isImageNamed("disallowed"))).toEqual([
        false,
        false,
        true,
        false,
      ]);
      expect(icons[3].isHidden).toBe(true);
    });

    it("should draw a dependency that a warning disallows in the color of warnings", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["warn",'
      );
      const { list } = renderLines({
        lines: getLines(CHECKOUT, { ...QUICK_START, config }),
      });

      // Act
      const { verdict } = list.line(2);

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(verdict.color).toBe("var(--jsb-code-number)");
      expect(verdict.icon.pathData).toBe(ICON_PATHS.warn);
      expect(verdict.icon.isImageNamed("disallowed, as a warning")).toBe(true);
    });

    it("should read not evaluated, in the color of a comment, while the rule is off", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["off",'
      );
      const { list } = renderLines({
        lines: getLines(CHECKOUT, { ...QUICK_START, config }),
      });

      // Act
      const verdicts = list.lines.map(({ verdict }) => [
        verdict.text,
        verdict.color,
      ]);

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(verdicts).toEqual(
        Array.from({ length: 4 }, () => [
          "not evaluated",
          "var(--jsb-code-comment)",
        ])
      );
    });

    it("should explain in a tooltip why a dependency is not checked", async () => {
      // Arrange
      const { list } = renderLines();

      // Act
      list.line(3).verdict.hover();
      await list.tooltip.waitUntilShown();

      // Assert
      expect(list.tooltip.text).toBe(
        "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins."
      );
    });

    it("should explain it when the verdict takes the keyboard focus, and not only under the pointer", async () => {
      // Arrange
      const { list } = renderLines();

      // Act
      list.line(3).verdict.focus();
      await list.tooltip.waitUntilShown();

      // Assert
      expect(list.line(3).verdict.isFocused).toBe(true);
      expect(list.tooltip.text).toBe(
        "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins."
      );
    });

    it("should be a tab stop only when the verdict has a sentence to explain", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const stops = list.lines.map(({ verdict }) => verdict.isTabStop);

      // Assert
      expect(stops).toEqual([false, false, false, true]);
    });

    it("should keep the text of the verdict as its name, and give the sentence as its description", async () => {
      // Arrange
      const { list } = renderLines();
      const sentence =
        "Not checked: the dependency is not local, and the rule checks external and core modules only with checkAllOrigins.";
      const beforeFocus = [
        list.line(3).verdict.hasLabel,
        list.line(3).verdict.description,
      ];

      // Act
      list.line(3).verdict.focus();
      await list.tooltip.waitUntilShown();

      // Assert
      expect(beforeFocus).toEqual([false, sentence]);
      expect(list.line(3).verdict.hasLabel).toBe(false);
      expect(list.line(3).verdict.description).toBe(sentence);
      expect(list.line(3).verdict.text).toBe("not checked · external");
    });

    it("should show no tooltip on the verdict of an allowed dependency", () => {
      // Arrange
      jest.useFakeTimers();
      const { list } = renderLines();

      // Act
      list.line(0).verdict.hover();
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      // Assert
      expect(list.tooltip.isRendered).toBe(false);
    });
  });

  describe("a verdict that is out of date", () => {
    it("should show the verdicts in full when none of the lines is dimmed", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const opacities = list.lines.map(({ verdict }) => verdict.opacity);

      // Assert
      expect(opacities).toEqual(["1", "1", "1", "1"]);
    });

    it("should fade the verdict of the lines that are dimmed, and no other", () => {
      // Arrange
      const { list } = renderLines({
        lines: [
          LINES[0],
          { ...LINES[1], dimmed: true },
          LINES[2],
          { ...LINES[3], dimmed: true },
        ],
      });

      // Act
      const opacities = list.lines.map(({ verdict }) => verdict.opacity);

      // Assert
      expect(opacities).toEqual(["1", "0.5", "1", "0.5"]);
    });

    it("should keep what the faded verdict says", () => {
      // Arrange
      const { list } = renderLines({
        lines: LINES.map((line) => ({ ...line, dimmed: true })),
      });

      // Act
      const verdicts = list.lines.map(({ verdict }) => [
        verdict.text,
        verdict.color,
        verdict.opacity,
      ]);

      // Assert
      expect(verdicts).toEqual([
        ["policy 1", "var(--jsb-code-string)", "0.5"],
        ["policy 1", "var(--jsb-code-string)", "0.5"],
        ["policy 2", "var(--jsb-code-error)", "0.5"],
        ["not checked · external", "var(--jsb-code-comment)", "0.5"],
      ]);
    });

    it("should show the verdict in full again when the line is no longer dimmed", () => {
      // Arrange
      const { list, update } = renderLines({
        lines: LINES.map((line) => ({ ...line, dimmed: true })),
      });
      const whileDimmed = list.line(0).verdict.opacity;

      // Act
      update({ lines: LINES });

      // Assert
      expect(whileDimmed).toBe("0.5");
      expect(list.line(0).verdict.opacity).toBe("1");
    });
  });

  describe("a line with no verdict yet", () => {
    /** The line of a dependency that no evaluation has decided yet, before it is late. */
    const UNDECIDED: DependencyLine = {
      ...LINES[0],
      icon: undefined,
      iconLabel: undefined,
      tone: "faint",
      label: "",
      hint: undefined,
    };

    it("should draw no icon and no text where the verdict goes", () => {
      // Arrange
      const { list } = renderLines({ lines: [UNDECIDED] });

      // Act
      const { verdict } = list.line(0);

      // Assert
      expect(verdict.icon.isRendered).toBe(false);
      expect(verdict.text).toBe("");
    });

    it("should keep the statement of the line and the verdicts of the other lines", () => {
      // Arrange
      const { list } = renderLines({ lines: [UNDECIDED, ...LINES.slice(1)] });

      // Act
      const { lineTexts } = list;

      // Assert
      expect(lineTexts).toEqual([
        '1import { Button } from "../../components/atoms/Button/index.js";',
        '2import { format } from "../../helpers/format/index.js";policy 1',
        '3import { renderButton } from "../../components/atoms/Button/Button.spec.js";policy 2',
        '4import React from "react";not checked · external',
      ]);
    });

    it("should draw the verdict with its icon once the line says that it is evaluating", () => {
      // Arrange
      const { list } = renderLines({
        lines: [{ ...UNDECIDED, icon: "skip", label: "evaluating…" }],
      });

      // Act
      const { verdict } = list.line(0);

      // Assert
      expect(verdict.text).toBe("evaluating…");
      expect(verdict.icon.pathData).toBe(ICON_PATHS.skip);
      expect(verdict.color).toBe("var(--jsb-code-comment)");
    });

    it("should not be a tab stop, as it has no sentence to explain", () => {
      // Arrange
      const { list } = renderLines({ lines: [UNDECIDED] });

      // Act
      const { isTabStop } = list.line(0).verdict;

      // Assert
      expect(isTabStop).toBe(false);
    });
  });

  describe("selection", () => {
    it("should call onSelect with the position of the line that is clicked", () => {
      // Arrange
      const { props, list } = renderLines();

      // Act
      list.line(2).click();

      // Assert
      expect(props.onSelect).toHaveBeenCalledTimes(1);
      expect(props.onSelect).toHaveBeenCalledWith(2);
    });

    it("should call onSelect when Enter is pressed on a line", () => {
      // Arrange
      const { props, list } = renderLines();
      const line = list.line(1);
      line.focus();

      // Act
      line.pressKey("Enter");

      // Assert
      expect(props.onSelect).toHaveBeenCalledTimes(1);
      expect(props.onSelect).toHaveBeenCalledWith(1);
    });

    it("should call onSelect when Space is pressed on a line, once it is released", () => {
      // Arrange
      const { props, list } = renderLines();
      const line = list.line(3);
      line.focus();

      // Act
      line.pressKey(" ");
      const calledWhilePressed = jest.mocked(props.onSelect).mock.calls.length;
      line.releaseKey(" ");

      // Assert
      expect(calledWhilePressed).toBe(0);
      expect(props.onSelect).toHaveBeenCalledTimes(1);
      expect(props.onSelect).toHaveBeenCalledWith(3);
    });

    it("should not select a line with any other key", () => {
      // Arrange
      const { props, list } = renderLines();
      const line = list.line(1);
      line.focus();

      // Act
      line.pressKey("a");
      line.releaseKey("a");

      // Assert
      expect(props.onSelect).not.toHaveBeenCalled();
    });

    it("should mark only the line in focus as the current one", () => {
      // Arrange
      const { list } = renderLines({ selectedIndex: 2 });

      // Act
      const selected = list.lines.map(({ isSelected }) => isSelected);

      // Assert
      expect(selected).toEqual([false, false, true, false]);
    });

    it("should mark no line while the dependency in focus is not one of the file", () => {
      // Arrange
      const { list } = renderLines({ selectedIndex: undefined });

      // Act
      const selected = list.lines.map(({ isSelected }) => isSelected);

      // Assert
      expect(selected).toEqual([false, false, false, false]);
    });

    it("should highlight the line in focus with 66% of the line color of a code area and a bar on its left", () => {
      // Arrange
      const { list } = renderLines({ selectedIndex: 2 });

      // Act
      const { backgroundColor, boxShadow } = list.line(2);
      const other = list.line(1);

      // Assert
      expect(backgroundColor).toBe(
        "color-mix(in srgb, var(--jsb-code-line) 66%, transparent)"
      );
      expect(boxShadow).toBe("inset 2px 0 0 var(--jsb-code-keyword)");
      expect(other.backgroundColor).not.toBe(backgroundColor);
      expect(other.boxShadow).toBe("");
    });

    it("should highlight a line under the pointer as the selected one", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { hoverStyle } = list.line(0);

      // Assert
      expect(hoverStyle["background-color"]).toBe(
        "color-mix(in srgb, var(--jsb-code-line) 66%, transparent)"
      );
    });
  });

  describe("actions", () => {
    it("should offer to edit and to delete a line, by names that say which line", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { actionNames } = list.line(2);

      // Assert
      expect(actionNames).toEqual([
        "Edit the dependency at line 3",
        "Delete the dependency at line 3",
      ]);
    });

    it("should not nest the actions in the button that selects the line", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const nested = list.lines.map(
        ({ nestedButtonCount }) => nestedButtonCount
      );

      // Assert
      expect(nested).toEqual([0, 0, 0, 0]);
    });

    it("should call onEdit with the position of the line, and nothing else", () => {
      // Arrange
      const { props, list } = renderLines();

      // Act
      list.line(2).editAction.press();

      // Assert
      expect(props.onEdit).toHaveBeenCalledTimes(1);
      expect(props.onEdit).toHaveBeenCalledWith(2);
      expect(props.onRemove).not.toHaveBeenCalled();
      expect(props.onSelect).not.toHaveBeenCalled();
    });

    it("should call onRemove with the position of the line, and nothing else", () => {
      // Arrange
      const { props, list } = renderLines();

      // Act
      list.line(3).deleteAction.press();

      // Assert
      expect(props.onRemove).toHaveBeenCalledTimes(1);
      expect(props.onRemove).toHaveBeenCalledWith(3);
      expect(props.onEdit).not.toHaveBeenCalled();
      expect(props.onSelect).not.toHaveBeenCalled();
    });

    describe("the keyboard focus after a line is removed", () => {
      it("should go to the line that takes the number of the one removed", () => {
        // Arrange
        const { list, update } = renderLines();
        list.line(1).deleteAction.focus();

        // Act
        list.line(1).deleteAction.press();
        update({ lines: [LINES[0], LINES[2], LINES[3]] });

        // Assert
        expect(list.line(1).isFocused).toBe(true);
      });

      it("should go to the line before when the one removed was the last", () => {
        // Arrange
        const { list, update } = renderLines();
        list.line(3).deleteAction.focus();

        // Act
        list.line(3).deleteAction.press();
        update({ lines: LINES.slice(0, 3) });

        // Assert
        expect(list.line(2).isFocused).toBe(true);
      });

      it("should go to the first line when the first one was removed", () => {
        // Arrange
        const { list, update } = renderLines();
        list.line(0).deleteAction.focus();

        // Act
        list.line(0).deleteAction.press();
        update({ lines: LINES.slice(1) });

        // Assert
        expect(list.line(0).isFocused).toBe(true);
      });

      it("should be asked to take the focus elsewhere only when no line is left", () => {
        // Arrange
        const onEmptied = jest.fn();
        const { list, update } = renderLines({
          lines: LINES.slice(0, 2),
          onEmptied,
        });
        list.line(0).deleteAction.press();
        update({ lines: LINES.slice(1, 2) });
        const afterFirst = onEmptied.mock.calls.length;

        // Act
        list.line(0).deleteAction.press();
        update({ lines: [] });

        // Assert
        expect(afterFirst).toBe(0);
        expect(onEmptied).toHaveBeenCalledTimes(1);
      });

      it("should do nothing when the last line goes and nobody listens", () => {
        // Arrange
        const { list, update } = renderLines({ lines: LINES.slice(0, 1) });
        list.line(0).deleteAction.press();

        // Act
        update({ lines: [] });

        // Assert
        expect(list.isRendered).toBe(false);
      });

      it("should not move the focus when the lines change without a removal", () => {
        // Arrange
        const { list, update } = renderLines();
        list.line(3).focus();

        // Act
        update({ lines: LINES.slice(0, 3) });

        // Assert
        expect(list.line(2).isFocused).toBe(false);
      });

      it("should move it once, not each time the lines change afterwards", () => {
        // Arrange
        const { list, update } = renderLines();
        list.line(1).deleteAction.press();
        update({ lines: [LINES[0], LINES[2], LINES[3]] });
        list.line(3 - 1).focus();

        // Act
        update({ lines: [LINES[0], LINES[2]] });

        // Assert
        expect(list.line(1).isFocused).toBe(false);
      });
    });

    it("should draw the pencil and the trash can", () => {
      // Arrange
      const { list } = renderLines();
      const line = list.line(0);

      // Act
      const edit = line.editAction.icon.pathData;
      const remove = line.deleteAction.icon.pathData;

      // Assert
      expect(edit).toBe(ICON_PATHS.edit);
      expect(remove).toBe(ICON_PATHS.trash);
    });

    it("should explain the actions in a tooltip", async () => {
      // Arrange
      const { list } = renderLines();

      // Act
      list.line(0).editAction.hover();
      await list.tooltip.waitUntilShown();

      // Assert
      expect(list.tooltip.text).toBe("Edit");
    });

    it("should explain the delete action in a tooltip", async () => {
      // Arrange
      const { list } = renderLines();

      // Act
      list.line(0).deleteAction.hover();
      await list.tooltip.waitUntilShown();

      // Assert
      expect(list.tooltip.text).toBe("Delete");
    });

    it("should dim the actions of a line that is not selected, and show those of the selected one", () => {
      // Arrange
      const { list } = renderLines({ selectedIndex: 2 });

      // Act
      const { actionsSelectedStyle } = list.line(2);
      const other = list.line(1).editAction.holderOpacity;

      // Assert
      expect(actionsSelectedStyle).toEqual({ opacity: "1" });
      expect(other).toBe("0");
    });

    it("should show the actions of a line under the pointer", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { actionsHoverStyle } = list.line(0);

      // Assert
      expect(actionsHoverStyle).toEqual({ opacity: "1" });
    });

    it("should show the actions of a line while the keyboard is inside it", () => {
      // Arrange
      const { list } = renderLines();

      // Act
      const { actionsFocusStyle } = list.line(0);

      // Assert
      expect(actionsFocusStyle).toEqual({ opacity: "1" });
    });

    it("should let the keyboard reach the actions while they are dimmed", () => {
      // Arrange
      const { list } = renderLines();
      const { editAction } = list.line(0);

      // Act
      editAction.focus();

      // Assert
      expect(editAction.holderOpacity).toBe("0");
      expect(editAction.isFocused).toBe(true);
    });

    it("should draw no actions when the dependencies cannot be edited", () => {
      // Arrange
      const { list } = renderLines({ editable: false });

      // Act
      const names = list.lines.map(({ actionNames }) => actionNames);

      // Assert
      expect(names).toEqual([[], [], [], []]);
    });

    it("should keep the verdict in its column when the line has no actions", () => {
      // Arrange
      const { list } = renderLines({ editable: false });

      // Act
      const verdicts = list.lines.map(({ verdict }) => verdict.text);

      // Assert
      expect(verdicts).toEqual([
        "policy 1",
        "policy 1",
        "policy 2",
        "not checked · external",
      ]);
    });
  });
});
