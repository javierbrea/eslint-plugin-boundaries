import { render } from "@testing-library/react";

import { PaneFrame } from "./PaneFrame";
import { PaneFramePom } from "./PaneFrame.pom";

/**
 * Renders a frame around the head and the body of a pane.
 * @returns The page object of the frame.
 */
function renderFrame(): PaneFramePom {
  render(
    <PaneFrame>
      <header>Head of the pane</header>
      <div>Body of the pane</div>
    </PaneFrame>
  );

  return new PaneFramePom();
}

describe("PaneFrame", () => {
  it("should be a landmark that holds the head and the body, in order", () => {
    // Arrange
    const frame = renderFrame();

    // Act
    const { isRendered, childTexts } = frame;

    // Assert
    expect(isRendered).toBe(true);
    expect(childTexts).toEqual(["Head of the pane", "Body of the pane"]);
  });

  it("should be a column as tall as its container", () => {
    // Arrange
    const frame = renderFrame();

    // Act
    const { display, flexDirection, height, boxSizing } = frame;

    // Assert
    expect(display).toBe("flex");
    expect(flexDirection).toBe("column");
    expect(height).toBe("100%");
    expect(boxSizing).toBe("border-box");
  });

  it("should not grow past its container with its content, so that the body scrolls on its own", () => {
    // Arrange
    const frame = renderFrame();

    // Act
    const { minWidth, minHeight } = frame;

    // Assert
    expect(minWidth).toBe("0");
    expect(minHeight).toBe("0");
  });
});
