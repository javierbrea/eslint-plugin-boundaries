import { render, screen as view } from "@testing-library/react";

import { CountBadge } from "./CountBadge";

describe("CountBadge", () => {
  it("should show the count", () => {
    // Arrange
    render(<CountBadge count={2} tone="bad" label="2 problems" />);

    // Act
    const badge = view.getByRole("img", { name: "2 problems" });

    // Assert
    expect(badge.textContent).toBe("2");
  });

  it("should be read as what it counts, not as the bare number", () => {
    // Arrange
    render(<CountBadge count={1} tone="warn" label="1 warning" />);

    // Act
    const badge = view.getByRole("img");

    // Assert
    expect(badge.getAttribute("aria-label")).toBe("1 warning");
  });

  it("should not pass its tone to the DOM", () => {
    // Arrange
    render(<CountBadge count={2} tone="bad" label="2 problems" />);

    // Act
    const badge = view.getByRole("img");

    // Assert
    expect(badge.hasAttribute("tone")).toBe(false);
  });
});
