import { fireEvent, render, screen as view } from "@testing-library/react";

import { renderInRoot } from "@/theme/__fixtures__/RenderInRoot";

import { EmptyPane } from "./EmptyPane";
import type { EmptyPaneProps } from "./EmptyPane.types";

/**
 * Creates the props of the pane.
 * @param overrides What differs from a project that can have files added.
 * @returns The props.
 */
function createProps(overrides: Partial<EmptyPaneProps> = {}): EmptyPaneProps {
  return {
    canAddFile: true,
    onOpenConfig: jest.fn(),
    onAddFile: jest.fn(),
    ...overrides,
  };
}

describe("EmptyPane", () => {
  it("should be the landmark of the node in focus", () => {
    // Arrange
    render(<EmptyPane {...createProps()} />);

    // Act
    const landmark = view.getByRole("region", { name: "Node in focus" });

    // Assert
    expect(landmark.tagName).toBe("SECTION");
  });

  it("should say in the head that nothing is open", () => {
    // Arrange
    render(<EmptyPane {...createProps()} />);

    // Act
    const label = view.getByText("Nothing open");

    // Assert
    expect(label.tagName).toBe("SPAN");
  });

  it("should ask the user to open a file or the config", () => {
    // Arrange
    render(<EmptyPane {...createProps()} />);

    // Act
    const title = view.getByRole("heading", {
      name: "Open a file or the config",
    });

    // Assert
    expect(title.tagName).toBe("H2");
  });

  it("should explain what each way to start shows, with the name of the config in mono", () => {
    // Arrange
    render(<EmptyPane {...createProps()} />);

    // Act
    const text = view.getByText(/Pick a file in the project/);

    // Assert
    expect(text.textContent).toBe(
      "Pick a file in the project to see its dependencies and their verdicts, or open eslint.config.js to edit the settings and the rules."
    );
    expect(text.querySelector("code")?.textContent).toBe("eslint.config.js");
  });

  it("should keep the name of the config free of the box that a host gives to code", () => {
    // Arrange
    render(<EmptyPane {...createProps()} />);

    // Act
    const style = getComputedStyle(
      view.getByText("eslint.config.js", { selector: "code" })
    );

    // Assert
    expect(style.padding).toBe("0px");
    expect(style.backgroundColor).toBe("rgba(0, 0, 0, 0)");
    expect(style.fontSize).toBe("inherit");
    expect(style.fontFamily).toBe("var(--jsb-font-mono)");
  });

  it("should keep the title free of the letter spacing that a host gives to headings", () => {
    // Arrange
    renderInRoot(<EmptyPane {...createProps()} />);

    // Act
    const style = getComputedStyle(view.getByRole("heading"));

    // Assert
    expect(style.letterSpacing).toBe("normal");
  });

  it("should draw the title in the display font, 16 px and bold", () => {
    // Arrange
    renderInRoot(<EmptyPane {...createProps()} />);

    // Act
    const style = getComputedStyle(view.getByRole("heading"));

    // Assert
    expect(style.fontFamily).toBe("var(--jsb-font-display)");
    expect(style.fontSize).toBe("16px");
    expect(style.fontWeight).toBe("600");
  });

  it("should call onOpenConfig when the user chooses to open the config", () => {
    // Arrange
    const props = createProps();
    render(<EmptyPane {...props} />);

    // Act
    fireEvent.click(
      view.getByRole("button", { name: "Open eslint.config.js" })
    );

    // Assert
    expect(props.onOpenConfig).toHaveBeenCalledTimes(1);
    expect(props.onAddFile).not.toHaveBeenCalled();
  });

  it("should call onAddFile when the user chooses to add a file", () => {
    // Arrange
    const props = createProps();
    render(<EmptyPane {...props} />);

    // Act
    fireEvent.click(view.getByRole("button", { name: "File" }));

    // Assert
    expect(props.onAddFile).toHaveBeenCalledTimes(1);
    expect(props.onOpenConfig).not.toHaveBeenCalled();
  });

  it("should draw the plus icon in the button that adds a file, hidden from assistive technology", () => {
    // Arrange
    render(<EmptyPane {...createProps()} />);

    // Act
    const icon = view
      .getByRole("button", { name: "File" })
      .querySelector("svg");

    // Assert
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
  });

  it("should not offer to add a file when the project cannot have files added", () => {
    // Arrange
    render(<EmptyPane {...createProps({ canAddFile: false })} />);

    // Act
    const buttons = view.getAllByRole("button");

    // Assert
    expect(buttons.map((button) => button.textContent)).toEqual([
      "Open eslint.config.js",
    ]);
  });
});
