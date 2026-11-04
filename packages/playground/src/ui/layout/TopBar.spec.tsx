import { render, screen as view } from "@testing-library/react";

import { TopBar } from "./TopBar";
import type { TopBarProps } from "./TopBar.types";

/**
 * Creates the props of a bar that shows a sketch with no problems.
 * @param overrides What differs.
 * @returns The props.
 */
function createProps(overrides: Partial<TopBarProps> = {}): TopBarProps {
  return {
    files: 6,
    problems: 0,
    tone: "bad",
    configHasErrors: false,
    ...overrides,
  };
}

/**
 * Gets the element that holds the count of problems, or what stands in its place.
 * @param text What the element says.
 * @returns The element.
 */
function getCount(text: string): HTMLElement {
  return view.getByText(text);
}

describe("TopBar", () => {
  describe("status", () => {
    it("should say how many files and problems the sketch has", () => {
      // Arrange
      render(<TopBar {...createProps({ files: 6, problems: 2 })} />);

      // Act
      const text = getCount("2 problems").parentElement;

      // Assert
      expect(text?.textContent).toBe("6 files · 2 problems");
    });

    it("should say one file and one problem in the singular", () => {
      // Arrange
      render(<TopBar {...createProps({ files: 1, problems: 1 })} />);

      // Act
      const text = getCount("1 problem").parentElement;

      // Assert
      expect(text?.textContent).toBe("1 file · 1 problem");
    });

    it("should say 0 problems when there are none", () => {
      // Arrange
      render(<TopBar {...createProps({ files: 0, problems: 0 })} />);

      // Act
      const text = getCount("0 problems").parentElement;

      // Assert
      expect(text?.textContent).toBe("0 files · 0 problems");
    });

    it("should say that the config has errors instead of counting the problems", () => {
      // Arrange
      render(
        <TopBar {...createProps({ problems: 2, configHasErrors: true })} />
      );

      // Act
      const text = getCount("config has errors").parentElement;

      // Assert
      expect(text?.textContent).toBe("6 files · config has errors");
      expect(view.queryByText("2 problems")).toBeNull();
    });
  });

  describe("colors", () => {
    it("should draw the problems in the color of their tone", () => {
      // Arrange
      render(<TopBar {...createProps({ problems: 2, tone: "warn" })} />);

      // Act
      const style = getComputedStyle(getCount("2 problems"));

      // Assert
      expect(style.color).toBe("var(--jsb-warn)");
    });

    it("should draw no problems in the color of the rest of the status", () => {
      // Arrange
      render(<TopBar {...createProps({ problems: 0, tone: "bad" })} />);

      // Act
      const style = getComputedStyle(getCount("0 problems"));

      // Assert
      expect(style.color).not.toBe("var(--jsb-bad)");
    });

    it("should draw the config errors in the color of errors", () => {
      // Arrange
      render(<TopBar {...createProps({ configHasErrors: true })} />);

      // Act
      const style = getComputedStyle(getCount("config has errors"));

      // Assert
      expect(style.color).toBe("var(--jsb-bad)");
    });

    it("should draw an ok dot when the config has no errors, and a red one when it has", () => {
      // Arrange
      const { container, rerender } = render(<TopBar {...createProps()} />);
      const getDot = (): HTMLElement =>
        container.querySelector("[aria-hidden='true']") as HTMLElement;

      // Act
      const ok = getComputedStyle(getDot()).backgroundColor;
      rerender(<TopBar {...createProps({ configHasErrors: true })} />);
      const bad = getComputedStyle(getDot()).backgroundColor;

      // Assert
      expect(ok).toBe("var(--jsb-ok)");
      expect(bad).toBe("var(--jsb-bad)");
    });

    it("should hide the dot from assistive technology", () => {
      // Arrange
      const { container } = render(<TopBar {...createProps()} />);

      // Act
      const dot = container.querySelector("span[aria-hidden='true']");

      // Assert
      expect(dot).not.toBeNull();
    });
  });

  describe("props", () => {
    it("should not pass the color or the failing state to the DOM", () => {
      // Arrange
      const { container } = render(
        <TopBar {...createProps({ problems: 1 })} />
      );

      // Act
      const withColor = container.querySelectorAll("[color], [failing]");

      // Assert
      expect(withColor).toHaveLength(0);
    });
  });
});
