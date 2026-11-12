import { render } from "@testing-library/react";

import { renderInRoot } from "@/shared/testing/renderInRoot";

import { EmptyNode } from "./EmptyNode";
import { EmptyNodePom } from "./EmptyNode.pom";
import type { EmptyNodeProps } from "./EmptyNode.types";

const FRAME_LABEL = "Pane under test";

/**
 * Creates the props of the pane.
 * @param overrides What differs from a project that can have files added.
 * @returns The props.
 */
function createProps(overrides: Partial<EmptyNodeProps> = {}): EmptyNodeProps {
  return {
    canAddFile: true,
    onOpenConfig: jest.fn(),
    onAddFile: jest.fn(),
    frameLabel: FRAME_LABEL,
    ...overrides,
  };
}

describe("EmptyNode", () => {
  it("should be the landmark that its label names", () => {
    // Arrange
    render(<EmptyNode {...createProps()} />);
    const pane = new EmptyNodePom();

    // Act
    const { frame } = pane;
    const { tagName } = frame;
    const isNamedRegion = frame.isRegionNamed(FRAME_LABEL);

    // Assert
    expect(isNamedRegion).toBe(true);
    expect(tagName).toBe("SECTION");
  });

  it("should say in the head that nothing is open", () => {
    // Arrange
    render(<EmptyNode {...createProps()} />);
    const pane = new EmptyNodePom();

    // Act
    const { label, labelTag } = pane.head;

    // Assert
    expect(label).toBe("Nothing open");
    expect(labelTag).toBe("SPAN");
  });

  it("should ask the user to open a file or the config", () => {
    // Arrange
    render(<EmptyNode {...createProps()} />);
    const pane = new EmptyNodePom();

    // Act
    const { title, titleTag } = pane;

    // Assert
    expect(title).toBe("Open a file or the config");
    expect(titleTag).toBe("H2");
  });

  it("should explain what each way to start shows, with the name of the config in mono", () => {
    // Arrange
    render(<EmptyNode {...createProps()} />);
    const pane = new EmptyNodePom();

    // Act
    const { message, code } = pane;

    // Assert
    expect(message).toBe(
      "Pick a file in the project to see its dependencies and their verdicts, or open eslint.config.js to edit the settings and the rules."
    );
    expect(code.text).toBe("eslint.config.js");
  });

  it("should keep the name of the config free of the box that a host gives to code", () => {
    // Arrange
    render(<EmptyNode {...createProps()} />);
    const { code } = new EmptyNodePom();

    // Act
    const { padding, backgroundColor, fontSize, fontFamily } = code;

    // Assert
    expect(padding).toBe("0px");
    expect(backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(fontSize).toBe("inherit");
    expect(fontFamily).toBe("var(--jsb-font-mono)");
  });

  it("should keep the title free of the letter spacing that a host gives to headings", () => {
    // Arrange
    renderInRoot(<EmptyNode {...createProps()} />);
    const pane = new EmptyNodePom();

    // Act
    const { letterSpacing } = pane.titleStyle;

    // Assert
    expect(letterSpacing).toBe("normal");
  });

  it("should draw the title in the display font, 16 px and bold", () => {
    // Arrange
    renderInRoot(<EmptyNode {...createProps()} />);
    const pane = new EmptyNodePom();

    // Act
    const { fontFamily, fontSize, fontWeight } = pane.titleStyle;

    // Assert
    expect(fontFamily).toBe("var(--jsb-font-display)");
    expect(fontSize).toBe("16px");
    expect(fontWeight).toBe("600");
  });

  it("should call onOpenConfig when the user chooses to open the config", () => {
    // Arrange
    const props = createProps();
    render(<EmptyNode {...props} />);
    const pane = new EmptyNodePom();

    // Act
    pane.openConfigButton.press();

    // Assert
    expect(props.onOpenConfig).toHaveBeenCalledTimes(1);
    expect(props.onAddFile).not.toHaveBeenCalled();
  });

  it("should call onAddFile when the user chooses to add a file", () => {
    // Arrange
    const props = createProps();
    render(<EmptyNode {...props} />);
    const pane = new EmptyNodePom();

    // Act
    pane.addFileButton.press();

    // Assert
    expect(props.onAddFile).toHaveBeenCalledTimes(1);
    expect(props.onOpenConfig).not.toHaveBeenCalled();
  });

  it("should draw the plus icon in the button that adds a file, hidden from assistive technology", () => {
    // Arrange
    render(<EmptyNode {...createProps()} />);
    const pane = new EmptyNodePom();

    // Act
    const { isHidden } = pane.addFileButton.icon;

    // Assert
    expect(isHidden).toBe(true);
  });

  it("should not offer to add a file when the project cannot have files added", () => {
    // Arrange
    render(<EmptyNode {...createProps({ canAddFile: false })} />);
    const pane = new EmptyNodePom();

    // Act
    const { buttonTexts } = pane;

    // Assert
    expect(buttonTexts).toEqual(["Open eslint.config.js"]);
  });
});
