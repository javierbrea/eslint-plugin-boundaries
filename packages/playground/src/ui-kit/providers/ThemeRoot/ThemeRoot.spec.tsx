import { render } from "@testing-library/react";

import { ThemeRoot } from "./ThemeRoot";
import { ThemeRootPom } from "./ThemeRoot.pom";

/**
 * Renders content inside the root element.
 * @returns The page object of the root element.
 */
function renderRoot(): ThemeRootPom {
  render(
    <ThemeRoot>
      <p>Content of the playground</p>
    </ThemeRoot>
  );

  return new ThemeRootPom();
}

describe("ThemeRoot", () => {
  it("should hold its content in an element with the class of the root", () => {
    // Arrange
    const root = renderRoot();

    // Act
    const holdsContent = root.holds("Content of the playground");

    // Assert
    expect(holdsContent).toBe(true);
  });

  it("should give the playground the card and the ink of the host's tokens", () => {
    // Arrange
    const root = renderRoot();

    // Act
    const { backgroundColor, color } = root;

    // Assert
    expect(backgroundColor).toBe("var(--jsb-card)");
    expect(color).toBe("var(--jsb-ink)");
  });

  it("should give the playground a 13 px body font with a 1.45 line height", () => {
    // Arrange
    const root = renderRoot();

    // Act
    const { fontFamily, fontSize, lineHeight } = root;

    // Assert
    expect(fontFamily).toBe("var(--jsb-font-body)");
    expect(fontSize).toBe("13px");
    expect(lineHeight).toBe("1.45");
  });

  it("should be as tall as its container", () => {
    // Arrange
    const root = renderRoot();

    // Act
    const { height } = root;

    // Assert
    expect(height).toBe("100%");
  });

  it("should count the border in its size", () => {
    // Arrange
    const root = renderRoot();

    // Act
    const { boxSizing } = root;

    // Assert
    expect(boxSizing).toBe("border-box");
  });
});
