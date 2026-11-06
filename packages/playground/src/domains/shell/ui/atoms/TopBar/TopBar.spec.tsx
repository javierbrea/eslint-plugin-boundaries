import { render } from "@testing-library/react";

import { TopBar } from "./TopBar";
import { TopBarPom } from "./TopBar.pom";
import type { TopBarProps } from "./TopBar.types";

/**
 * Creates the props of a bar that shows a sketch with no problems.
 * @param overrides What differs.
 * @returns The props.
 */
function createProps(overrides: Partial<TopBarProps> = {}): TopBarProps {
  return {
    files: 6,
    dependencies: 9,
    problems: 0,
    tone: "bad",
    configHasErrors: false,
    ...overrides,
  };
}

/**
 * Renders the bar.
 * @param overrides What differs from a bar that shows a sketch with no problems.
 * @returns The page object of the bar, and a function that renders it again with other props.
 */
function renderBar(overrides: Partial<TopBarProps> = {}): {
  bar: TopBarPom;
  update: (next: Partial<TopBarProps>) => void;
} {
  const { rerender } = render(<TopBar {...createProps(overrides)} />);

  return {
    bar: new TopBarPom(),
    update: (next) =>
      rerender(<TopBar {...createProps({ ...overrides, ...next })} />),
  };
}

describe("TopBar", () => {
  beforeEach(() => {
    // React logs a prop that a styled part leaks to the DOM as an attribute it does not know, once for each name
    jest.spyOn(console, "error").mockReturnValue(undefined);
  });

  afterEach(() => {
    const logged = [...jest.mocked(console.error).mock.calls];

    jest.mocked(console.error).mockRestore();

    if (logged.length > 0) {
      throw new Error(`React logged to the console: ${JSON.stringify(logged)}`);
    }
  });

  describe("status", () => {
    it("should say how many files, dependencies and problems the sketch has", () => {
      // Arrange
      const { bar } = renderBar({ files: 6, dependencies: 9, problems: 2 });

      // Act
      const { statusText, problemsText } = bar;

      // Assert
      expect(statusText).toBe("6 files · 9 dependencies · 2 problems");
      expect(problemsText).toBe("2 problems");
    });

    it("should say one file, one dependency and one problem in the singular", () => {
      // Arrange
      const { bar } = renderBar({ files: 1, dependencies: 1, problems: 1 });

      // Act
      const { statusText, problemsText } = bar;

      // Assert
      expect(statusText).toBe("1 file · 1 dependency · 1 problem");
      expect(problemsText).toBe("1 problem");
    });

    it("should say 0 problems when there are none", () => {
      // Arrange
      const { bar } = renderBar({ files: 0, dependencies: 0, problems: 0 });

      // Act
      const { statusText, problemsText } = bar;

      // Assert
      expect(statusText).toBe("0 files · 0 dependencies · 0 problems");
      expect(problemsText).toBe("0 problems");
    });

    it("should say that the config has errors instead of counting the problems", () => {
      // Arrange
      const { bar } = renderBar({ problems: 2, configHasErrors: true });

      // Act
      const { statusText, problemsText } = bar;

      // Assert
      expect(statusText).toBe("6 files · 9 dependencies · config has errors");
      expect(problemsText).toBe("config has errors");
      expect(statusText).not.toContain("2 problems");
    });
  });

  describe("colors", () => {
    it("should draw the problems in the color of their tone", () => {
      // Arrange
      const { bar } = renderBar({ problems: 2, tone: "warn" });

      // Act
      const { problemsColor } = bar;

      // Assert
      expect(problemsColor).toBe("var(--jsb-warn)");
    });

    it("should draw no problems in the color of the rest of the status", () => {
      // Arrange
      const { bar } = renderBar({ problems: 0, tone: "bad" });

      // Act
      const { problemsColor } = bar;

      // Assert
      expect(problemsColor).toBe("var(--jsb-muted)");
    });

    it("should draw the config errors in the color of errors", () => {
      // Arrange
      const { bar } = renderBar({ configHasErrors: true, tone: "warn" });

      // Act
      const { problemsColor } = bar;

      // Assert
      expect(problemsColor).toBe("var(--jsb-bad)");
    });

    it("should draw an ok dot when the config has no errors, and a red one when it has", () => {
      // Arrange
      const { bar, update } = renderBar();

      // Act
      const { dotColor: ok } = bar;
      update({ configHasErrors: true });
      const { dotColor: bad } = bar;

      // Assert
      expect(ok).toBe("var(--jsb-ok)");
      expect(bad).toBe("var(--jsb-bad)");
    });

    it("should hide the dot from assistive technology", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      const { dotTagName, isDotHidden } = bar;

      // Assert
      expect(dotTagName).toBe("SPAN");
      expect(isDotHidden).toBe(true);
    });
  });

  describe("props", () => {
    it("should not pass the color or the failing state to the DOM", () => {
      // Arrange
      const { bar } = renderBar({ problems: 1 });

      // Act
      const { leakedPropAttributes } = bar;
      const logged = jest.mocked(console.error).mock.calls;

      // Assert
      expect(leakedPropAttributes).toEqual([]);
      expect(logged).toEqual([]);
    });
  });

  describe("testId", () => {
    it("should render the test id of the component that is the bar", () => {
      // Arrange
      const { bar } = renderBar({ testId: "shell-top-bar" });

      // Act
      const { renderedTestId } = bar;

      // Assert
      expect(renderedTestId).toBe("shell-top-bar");
    });

    it("should render no test id when it is given none", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      const { renderedTestId } = bar;

      // Assert
      expect(renderedTestId).toBeNull();
    });
  });
});
