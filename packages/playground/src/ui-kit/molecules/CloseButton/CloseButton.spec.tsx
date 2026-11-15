import { render } from "@testing-library/react";

import { renderInRoot } from "@/shared/testing/renderInRoot";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { CloseButton } from "./CloseButton";
import { CloseButtonPom } from "./CloseButton.pom";

describe("CloseButton", () => {
  it("should be a button named Close and what it closes", () => {
    // Arrange
    render(<CloseButton subject="src/index.js" onClose={jest.fn()} />);
    const button = new CloseButtonPom();

    // Act
    const isNamed = button.isButtonNamed("Close src/index.js");

    // Assert
    expect(isNamed).toBe(true);
  });

  it("should draw a cross in the small icon button", () => {
    // Arrange
    renderInRoot(<CloseButton subject="src/index.js" onClose={jest.fn()} />);
    const button = new CloseButtonPom();

    // Act
    const { icon, isSmall } = button;

    // Assert
    expect(icon.pathData).toBe(ICON_PATHS.cross);
    expect(isSmall).toBe(true);
  });

  it("should call onClose when it is pressed", () => {
    // Arrange
    const onClose = jest.fn();
    render(<CloseButton subject="src/index.js" onClose={onClose} />);
    const button = new CloseButtonPom();

    // Act
    button.press();

    // Assert
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("should say Close in a tooltip when the pointer is on it", async () => {
    // Arrange
    renderInRoot(<CloseButton subject="src/index.js" onClose={jest.fn()} />);
    const button = new CloseButtonPom();

    // Act
    await button.hover();
    const tooltip = await button.waitForTooltip();

    // Assert
    expect(tooltip).toBe("Close");
  });
});
