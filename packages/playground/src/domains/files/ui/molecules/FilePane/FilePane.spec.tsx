import { render } from "@testing-library/react";

import { FilePane } from "./FilePane";
import { FilePanePom } from "./FilePane.pom";

const PATH = "src/modules/checkout/index.js";

const FRAME_LABEL = "Pane under test";

/**
 * Renders the pane.
 * @returns The page object of the pane.
 */
function renderPane(): FilePanePom {
  render(<FilePane path={PATH} frameLabel={FRAME_LABEL} />);

  return new FilePanePom();
}

describe("FilePane", () => {
  it("should be the landmark that its label names", () => {
    // Arrange
    const pane = renderPane();

    // Act
    const { isLandmark, label, tagName } = pane.frame;

    // Assert
    expect(isLandmark).toBe(true);
    expect(label).toBe(FRAME_LABEL);
    expect(tagName).toBe("SECTION");
  });

  it("should show the file label and its path in the head", () => {
    // Arrange
    const pane = renderPane();

    // Act
    const { label, labelTag, path, pathTitle } = pane.head;

    // Assert
    expect(label).toBe("File");
    expect(labelTag).toBe("SPAN");
    expect(path).toBe(PATH);
    expect(pathTitle).toBe(PATH);
  });

  it("should say that the file has no dependencies yet", () => {
    // Arrange
    const pane = renderPane();

    // Act
    const { message, messageTag } = pane;

    // Assert
    expect(message).toBe("No dependencies yet.");
    expect(messageTag).toBe("P");
  });

  it("should draw no list of dependencies", () => {
    // Arrange
    const pane = renderPane();

    // Act
    const { isRendered } = pane.lines;

    // Assert
    expect(isRendered).toBe(false);
  });

  it("should draw the button that adds a dependency, disabled", () => {
    // Arrange
    const pane = renderPane();

    // Act
    const { isDisabled, icon } = pane.addButton;

    // Assert
    expect(isDisabled).toBe(true);
    expect(icon.isHidden).toBe(true);
  });

  it("should show why the button is disabled when the pointer is over it", async () => {
    // Arrange
    const pane = renderPane();

    // Act
    pane.addButton.hover();
    await pane.tooltip.waitUntilShown();

    // Assert
    expect(pane.tooltip.text).toBe("Dependencies arrive in the next milestone");
  });

  it("should show why the button is disabled when the keyboard focus reaches it", async () => {
    // Arrange
    const pane = renderPane();

    // Act
    pane.addButton.focusSlot();
    await pane.tooltip.waitUntilShown();

    // Assert
    expect(pane.addButton.slotTabIndex).toBe(0);
    expect(pane.tooltip.text).toBe("Dependencies arrive in the next milestone");
  });
});
