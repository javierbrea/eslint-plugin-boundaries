import { render, screen as view } from "@testing-library/react";

import { Icon } from "./Icon";
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

/**
 * Reads the attributes of an element.
 * @param element The element.
 * @returns Each attribute name with its value.
 */
function getAttributes(element: Element | null): Record<string, string> {
  return Object.fromEntries(
    Array.from(element?.attributes ?? []).map((attribute) => [
      attribute.name,
      attribute.value,
    ])
  );
}

describe("Icon", () => {
  it.each(ICON_NAMES)("should draw a path for %s", (iconName) => {
    // Arrange
    const { container } = render(<Icon name={iconName} />);

    // Act
    const path = container.querySelector("svg > path");

    // Assert
    expect(path?.getAttribute("d")).toMatch(/^M[\w.\s-]+$/);
  });

  it("should draw each icon in a 16 by 16 view box with a 2 px round stroke in the current color", () => {
    // Arrange
    const { container } = render(<Icon name="check" />);

    // Act
    const attributes = getAttributes(container.querySelector("svg"));

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
    const { container } = render(<Icon name="check" />);

    // Act
    const svg = container.querySelector("svg");

    // Assert
    expect(svg?.getAttribute("width")).toBe("14");
    expect(svg?.getAttribute("height")).toBe("14");
  });

  it("should be as big as the size says", () => {
    // Arrange
    const { container } = render(<Icon name="check" size={16} />);

    // Act
    const svg = container.querySelector("svg");

    // Assert
    expect(svg?.getAttribute("width")).toBe("16");
    expect(svg?.getAttribute("height")).toBe("16");
  });

  it("should not shrink inside a flex container", () => {
    // Arrange
    const { container } = render(<Icon name="check" />);

    // Act
    const svg = container.querySelector("svg") as SVGSVGElement;

    // Assert
    expect(svg.style.flexShrink).toBe("0");
  });

  it("should be hidden from assistive technology when it has no label", () => {
    // Arrange
    const { container } = render(<Icon name="check" />);

    // Act
    const svg = container.querySelector("svg");

    // Assert
    expect(svg?.getAttribute("aria-hidden")).toBe("true");
    expect(svg?.getAttribute("role")).toBeNull();
    expect(view.queryByRole("img")).toBeNull();
  });

  it("should be an image named by its label when it has one", () => {
    // Arrange
    render(<Icon name="cross" label="Disallowed" />);

    // Act
    const image = view.getByRole("img", { name: "Disallowed" });

    // Assert
    expect(image.getAttribute("aria-hidden")).toBeNull();
  });

  it("should not be focusable in old browsers that make an SVG a tab stop", () => {
    // Arrange
    const { container } = render(<Icon name="check" />);

    // Act
    const svg = container.querySelector("svg");

    // Assert
    expect(svg?.getAttribute("focusable")).toBe("false");
  });
});
