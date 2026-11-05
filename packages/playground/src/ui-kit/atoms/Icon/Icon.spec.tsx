import { render } from "@testing-library/react";

import { Icon } from "./Icon";
import { IconPom } from "./Icon.pom";
import type { IconName } from "./Icon.types";

const ICON_NAMES: readonly IconName[] = [
  "check",
  "cross",
  "warn",
  "skip",
  "chevron-right",
  "chevron-down",
  "plus",
  "edit",
  "trash",
  "arrow",
  "share",
  "reset",
  "collapse",
  "info",
  "help",
];

describe("Icon", () => {
  it.each(ICON_NAMES)("should draw a path for %s", (iconName) => {
    // Arrange
    render(<Icon name={iconName} />);
    const icon = new IconPom();

    // Act
    const { pathData } = icon;

    // Assert
    expect(pathData).toMatch(/^M[\w.\s-]+$/);
  });

  it("should draw each icon in a 16 by 16 view box with a 2 px round stroke in the current color", () => {
    // Arrange
    render(<Icon name="check" />);
    const icon = new IconPom();

    // Act
    const { attributes } = icon;

    // Assert
    expect(attributes).toMatchObject({
      viewBox: "0 0 16 16",
      fill: "none",
      stroke: "currentColor",
      "stroke-width": "2",
      "stroke-linecap": "round",
      "stroke-linejoin": "round",
    });
  });

  it("should be 14 px by default", () => {
    // Arrange
    render(<Icon name="check" />);
    const icon = new IconPom();

    // Act
    const { width, height } = icon;

    // Assert
    expect(width).toBe(14);
    expect(height).toBe(14);
  });

  it("should be as big as the size says", () => {
    // Arrange
    render(<Icon name="check" size={16} />);
    const icon = new IconPom();

    // Act
    const { width, height } = icon;

    // Assert
    expect(width).toBe(16);
    expect(height).toBe(16);
  });

  it("should not shrink inside a flex container", () => {
    // Arrange
    render(<Icon name="check" />);
    const icon = new IconPom();

    // Act
    const { flexShrink } = icon;

    // Assert
    expect(flexShrink).toBe("0");
  });

  it("should be hidden from assistive technology when it has no label", () => {
    // Arrange
    render(<Icon name="check" />);
    const icon = new IconPom();

    // Act
    const { isHidden, role, isImage } = icon;

    // Assert
    expect(isHidden).toBe(true);
    expect(role).toBeNull();
    expect(isImage).toBe(false);
  });

  it("should be an image named by its label when it has one", () => {
    // Arrange
    render(<Icon name="cross" label="Disallowed" />);
    const icon = new IconPom({ name: "Disallowed" });

    // Act
    const { isRendered, isHidden, label } = icon;

    // Assert
    expect(isRendered).toBe(true);
    expect(isHidden).toBe(false);
    expect(label).toBe("Disallowed");
  });

  it("should not be focusable in old browsers that make an SVG a tab stop", () => {
    // Arrange
    render(<Icon name="check" />);
    const icon = new IconPom();

    // Act
    const { focusable } = icon;

    // Assert
    expect(focusable).toBe("false");
  });
});
