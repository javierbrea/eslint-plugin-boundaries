import { render } from "@testing-library/react";

import { PaneFrame } from "./PaneFrame";
import { PaneFramePom } from "./PaneFrame.pom";

const LABEL = "Node in focus";

/**
 * Renders a frame around the head and the body of a pane.
 * @param testId The test id of the frame, when it has one.
 * @returns The page object of the frame.
 */
function renderFrame(testId?: string): PaneFramePom {
  render(
    <PaneFrame label={LABEL} testId={testId}>
      <header>Head of the pane</header>
      <div>Body of the pane</div>
    </PaneFrame>
  );

  return new PaneFramePom({ name: LABEL });
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

  it("should be a region named after its label", () => {
    // Arrange
    const frame = renderFrame();

    // Act
    const { isLandmark, label } = frame;

    // Assert
    expect(isLandmark).toBe(true);
    expect(label).toBe(LABEL);
  });

  it("should not be found by the label of another landmark", () => {
    // Arrange
    renderFrame();
    const other = new PaneFramePom({ name: "Another pane" });

    // Act
    const { isRendered } = other;

    // Assert
    expect(isRendered).toBe(false);
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

  it("should render the test id of the component that is the frame", () => {
    // Arrange
    const frame = renderFrame("file-pane");

    // Act
    const { renderedTestId } = frame;

    // Assert
    expect(renderedTestId).toBe("file-pane");
  });

  it("should render no test id when it is given none", () => {
    // Arrange
    const frame = renderFrame();

    // Act
    const { renderedTestId } = frame;

    // Assert
    expect(renderedTestId).toBeNull();
  });
});
