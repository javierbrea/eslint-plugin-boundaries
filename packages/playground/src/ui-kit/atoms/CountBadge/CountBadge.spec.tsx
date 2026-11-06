import { render } from "@testing-library/react";

import { renderInRoot } from "@/shared/testing/renderInRoot";

import { CountBadge } from "./CountBadge";
import { CountBadgePom } from "./CountBadge.pom";

describe("CountBadge", () => {
  it("should show the count", () => {
    // Arrange
    render(<CountBadge count={2} tone="bad" label="2 problems" />);
    const badge = new CountBadgePom({ name: "2 problems" });

    // Act
    const { count } = badge;

    // Assert
    expect(count).toBe("2");
  });

  it("should set the count in the smallest mono text, medium and on a line as tall as the text", () => {
    // Arrange
    renderInRoot(<CountBadge count={2} tone="bad" label="2 problems" />);
    const badge = new CountBadgePom({ name: "2 problems" });

    // Act
    const { fontFamily, fontSize, fontWeight, lineHeight } = badge;

    // Assert
    expect(fontFamily).toBe("var(--jsb-font-mono)");
    expect(fontSize).toBe("11px");
    expect(fontWeight).toBe("500");
    expect(lineHeight).toBe("1");
  });

  it("should be read as what it counts, not as the bare number", () => {
    // Arrange
    render(<CountBadge count={1} tone="warn" label="1 warning" />);
    const badge = new CountBadgePom();

    // Act
    const isNamedImage = badge.isImageNamed("1 warning");

    // Assert
    expect(isNamedImage).toBe(true);
  });

  it("should not pass its tone to the DOM", () => {
    // Arrange
    render(<CountBadge count={2} tone="bad" label="2 problems" />);
    const badge = new CountBadgePom();

    // Act
    const { hasToneAttribute } = badge;

    // Assert
    expect(hasToneAttribute).toBe(false);
  });

  it.each([
    ["bad", "var(--jsb-bad)"],
    ["warn", "var(--jsb-warn)"],
  ] as const)(
    "should draw the count in the color of the %s tone",
    (tone, expected) => {
      // Arrange
      render(<CountBadge count={3} tone={tone} label="3 problems" />);
      const badge = new CountBadgePom();

      // Act
      const { color } = badge;

      // Assert
      expect(color).toBe(expected);
    }
  );
});
