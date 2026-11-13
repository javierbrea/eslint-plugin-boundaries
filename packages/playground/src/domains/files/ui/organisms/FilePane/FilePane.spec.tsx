import { createEngine } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { getDependencyLines } from "@/domains/files/ui/helpers/dependencyLines";
import { renderInRoot } from "@/shared/testing/renderInRoot";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { FilePane } from "./FilePane";
import { FilePanePom } from "./FilePane.pom";
import type { FilePaneProps } from "./FilePane.types";

const PATH = "src/modules/checkout/index.js";

const FRAME_LABEL = "Pane under test";

/** The four lines of the mockup: the dependencies of `src/modules/checkout/index.js` in the quick-start project. */
const LINES = getDependencyLines(
  createEngine()
    .evaluate(QUICK_START_EXAMPLE.sketch)
    .dependencies.filter(({ ref }) => ref.path === PATH),
  "current"
);

/** What {@link renderPane} returns: the props it rendered the pane with, and its page object. */
type PaneRender = {
  readonly props: FilePaneProps;
  readonly pane: FilePanePom;
};

/**
 * Renders the pane.
 * @param overrides What differs from an editable pane of the four lines of the checkout file with none selected.
 * @returns The props it was rendered with and the page object of the pane.
 */
function renderPane(overrides: Partial<FilePaneProps> = {}): PaneRender {
  const props: FilePaneProps = {
    path: PATH,
    frameLabel: FRAME_LABEL,
    lines: LINES,
    selectedIndex: undefined,
    editable: true,
    onSelect: jest.fn(),
    onEdit: jest.fn(),
    onRemove: jest.fn(),
    onAdd: jest.fn(),
    onClose: jest.fn(),
    ...overrides,
  };

  renderInRoot(<FilePane {...props} />);

  return { props, pane: new FilePanePom() };
}

describe("FilePane", () => {
  describe("testId", () => {
    it("should render the test id of the pane by default", () => {
      // Arrange
      renderPane();

      // Act
      const { isRendered } = new FilePanePom({ testId: "file-pane" });

      // Assert
      expect(isRendered).toBe(true);
    });

    it("should render the test id of a module that is the pane in place of its own", () => {
      // Arrange
      renderPane({ testId: "other-pane" });

      // Act
      const { isRendered } = new FilePanePom({ testId: "other-pane" });

      // Assert
      expect(isRendered).toBe(true);
      expect(new FilePanePom({ testId: "file-pane" }).isRendered).toBe(false);
    });
  });

  it("should be the landmark that its label names", () => {
    // Arrange
    const { pane } = renderPane();

    // Act
    const { frame } = pane;
    const { tagName } = frame;
    const isNamedRegion = frame.isRegionNamed(FRAME_LABEL);

    // Assert
    expect(isNamedRegion).toBe(true);
    expect(tagName).toBe("SECTION");
  });

  it("should show the file label and its path in the head", () => {
    // Arrange
    const { pane } = renderPane();

    // Act
    const { label, labelTag, path, pathTitle } = pane.head;

    // Assert
    expect(label).toBe("File");
    expect(labelTag).toBe("SPAN");
    expect(path).toBe(PATH);
    expect(pathTitle).toBe(PATH);
  });

  it("should draw the button that closes the file right after its path, named after the file", () => {
    // Arrange
    const { pane } = renderPane();

    // Act
    const { itemTexts } = pane.head;
    const isNamed = pane.closeButton.isButtonNamed(`Close ${PATH}`);

    // Assert
    expect(itemTexts).toEqual(["File", PATH, ""]);
    expect(isNamed).toBe(true);
  });

  it("should report that the user pressed the close button", () => {
    // Arrange
    const { pane, props } = renderPane();

    // Act
    pane.closeButton.press();

    // Assert
    expect(props.onClose).toHaveBeenCalledTimes(1);
  });

  describe("the dependencies", () => {
    it("should draw a line for each dependency of the file with its verdict", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { lineTexts } = pane.lines;

      // Assert
      expect(lineTexts).toEqual([
        '1import { Button } from "../../components/atoms/Button/index.js";policy 1',
        '2import { format } from "../../helpers/format/index.js";policy 1',
        '3import { renderButton } from "../../components/atoms/Button/Button.spec.js";policy 2',
        '4import React from "react";not checked · external',
      ]);
    });

    it("should say that no dependency is in focus when no line is selected", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const selected = pane.lines.lines.map(({ isSelected }) => isSelected);

      // Assert
      expect(selected).toEqual([false, false, false, false]);
    });

    it("should mark the line that is selected", () => {
      // Arrange
      const { pane } = renderPane({ selectedIndex: 2 });

      // Act
      const selected = pane.lines.lines.map(({ isSelected }) => isSelected);

      // Assert
      expect(selected).toEqual([false, false, true, false]);
    });

    it("should report the line that the user chooses", () => {
      // Arrange
      const { props, pane } = renderPane();

      // Act
      pane.lines.line(1).click();

      // Assert
      expect(props.onSelect).toHaveBeenCalledWith(1);
    });

    it("should report the edit and the delete actions of a line", () => {
      // Arrange
      const { props, pane } = renderPane();

      // Act
      pane.lines.line(2).editAction.press();
      pane.lines.line(3).deleteAction.press();

      // Assert
      expect(props.onEdit).toHaveBeenCalledWith(2);
      expect(props.onRemove).toHaveBeenCalledWith(3);
    });

    it("should draw no list for a file with no dependencies, and keep the button that adds one with its hint", () => {
      // Arrange
      const { pane } = renderPane({ lines: [] });

      // Act
      const { isRendered } = pane.lines;
      const { hint } = pane;

      // Assert
      expect(isRendered).toBe(false);
      expect(hint).toBe(
        "Dependencies are added and edited with the picker. Click a line to see its verdict in Problems."
      );
      expect(pane.addButton.isRendered).toBe(true);
    });
  });

  describe("the button that adds a dependency", () => {
    it("should be drawn with a plus, enabled and with a dashed border", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { isDisabled, borderStyle, icon } = pane.addButton;

      // Assert
      expect(isDisabled).toBe(false);
      expect(borderStyle).toBe("dashed");
      expect(icon.pathData).toBe(ICON_PATHS.plus);
      expect(icon.isHidden).toBe(true);
    });

    it("should be 28 px tall, 18 px under the last line, on the baseline of its line", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { height, marginTop, verticalAlign } = pane.addButton.box;

      // Assert
      expect(height).toBe("28px");
      expect(marginTop).toBe("18px");
      expect(verticalAlign).toBe("baseline");
    });

    it("should write its label in the medium weight of 12.5 px", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { fontFamily, fontSize, fontWeight } = pane.addButton.textStyle;

      // Assert
      expect(fontFamily).toBe("var(--jsb-font-body)");
      expect(fontSize).toBe("12.5px");
      expect(fontWeight).toBe("500");
    });

    it("should call onAdd when it is pressed", () => {
      // Arrange
      const { props, pane } = renderPane();

      // Act
      pane.addButton.press();

      // Assert
      expect(props.onAdd).toHaveBeenCalledTimes(1);
    });

    it("should not be drawn while the dependencies cannot be edited", () => {
      // Arrange
      const { pane } = renderPane({ editable: false });

      // Act
      const { isRendered } = pane.addButton;

      // Assert
      expect(isRendered).toBe(false);
    });
  });

  describe("the hint", () => {
    it("should tell how dependencies are added and where their verdicts are", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { hint } = pane;

      // Assert
      expect(hint).toBe(
        "Dependencies are added and edited with the picker. Click a line to see its verdict in Problems."
      );
    });

    it("should be drawn as a comment of the code area", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { hintColor } = pane;

      // Assert
      expect(hintColor).toBe("var(--jsb-code-comment)");
    });

    it("should have a line of 1.5 times its 12 px, which is 18 px, and sit 18 px under the button", () => {
      // Arrange
      const { pane } = renderPane();

      // Act
      const { lineHeight, marginTop } = pane.hintBox;

      // Assert
      expect(lineHeight).toBe("1.5");
      expect(marginTop).toBe("18px");
    });

    it("should not be drawn while the dependencies cannot be edited", () => {
      // Arrange
      const { pane } = renderPane({ editable: false });

      // Act
      const { hint } = pane;

      // Assert
      expect(hint).toBeNull();
    });
  });

  describe("while the dependencies cannot be edited", () => {
    it("should draw the lines with their verdicts and no actions", () => {
      // Arrange
      const { pane } = renderPane({ editable: false });

      // Act
      const { lineTexts } = pane.lines;
      const actions = pane.lines.lines.map(({ actionNames }) => actionNames);

      // Assert
      expect(lineTexts).toHaveLength(4);
      expect(actions).toEqual([[], [], [], []]);
    });
  });
});
