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
    bar: new TopBarPom({ testId: overrides.testId }),
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

    it("should say what the caller says about the evaluation instead of counting the problems", () => {
      // Arrange
      const { bar } = renderBar({
        problems: 2,
        evaluation: { text: "evaluating…", tone: "faint" },
      });

      // Act
      const { statusText, problemsText } = bar;

      // Assert
      expect(statusText).toBe("6 files · 9 dependencies · evaluating…");
      expect(problemsText).toBe("evaluating…");
      expect(statusText).not.toContain("2 problems");
    });

    it("should say what the caller says about the evaluation instead of that the config has errors", () => {
      // Arrange
      const { bar } = renderBar({
        configHasErrors: true,
        evaluation: { text: "evaluation stopped", tone: "warn" },
      });

      // Act
      const { statusText, problemsText } = bar;

      // Assert
      expect(statusText).toBe("6 files · 9 dependencies · evaluation stopped");
      expect(problemsText).toBe("evaluation stopped");
      expect(statusText).not.toContain("config has errors");
    });

    it("should say only the files and the dependencies before the problems are known", () => {
      // Arrange
      const { bar } = renderBar({ problems: undefined });

      // Act
      const { statusText, hasProblems } = bar;

      // Assert
      expect(statusText).toBe("6 files · 9 dependencies");
      expect(hasProblems).toBe(false);
    });

    it("should say that the config has errors before the problems are known", () => {
      // Arrange
      const { bar } = renderBar({ problems: undefined, configHasErrors: true });

      // Act
      const { statusText, problemsText } = bar;

      // Assert
      expect(statusText).toBe("6 files · 9 dependencies · config has errors");
      expect(problemsText).toBe("config has errors");
    });

    it("should say what the caller says about the evaluation before the problems are known", () => {
      // Arrange
      const { bar } = renderBar({
        problems: undefined,
        evaluation: { text: "evaluation failed", tone: "bad" },
      });

      // Act
      const { statusText, problemsText } = bar;

      // Assert
      expect(statusText).toBe("6 files · 9 dependencies · evaluation failed");
      expect(problemsText).toBe("evaluation failed");
    });

    it("should say the problems again when the caller stops saying anything about the evaluation", () => {
      // Arrange
      const { bar, update } = renderBar({
        problems: 2,
        evaluation: { text: "evaluating…", tone: "faint" },
      });

      // Act
      update({ evaluation: undefined });

      // Assert
      expect(bar.statusText).toBe("6 files · 9 dependencies · 2 problems");
    });
  });

  describe("colors", () => {
    it("should draw the problems in the color of their tone", () => {
      // Arrange
      const { bar } = renderBar({ problems: 2, tone: "warn" });

      // Act
      const { problemsColor } = bar;

      // Assert
      expect(problemsColor).toBe(
        "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"
      );
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
      expect(problemsColor).toBe(
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
      );
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

    it("should draw the problems in the color of their tone until the caller says something about the evaluation", () => {
      // Arrange
      const { bar, update } = renderBar({ problems: 2, tone: "warn" });

      // Act
      const { problemsColor: counted } = bar;
      update({ evaluation: { text: "evaluating…", tone: "faint" } });
      const { problemsColor: evaluating } = bar;

      // Assert
      expect(counted).toBe(
        "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"
      );
      expect(evaluating).toBe("var(--jsb-muted)");
    });

    it.each<["ok" | "bad" | "warn" | "faint", string, string]>([
      [
        "ok",
        "color-mix(in srgb, var(--jsb-ok) 85%, var(--jsb-ink))",
        "var(--jsb-ok)",
      ],
      [
        "bad",
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))",
        "var(--jsb-bad)",
      ],
      [
        "warn",
        "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))",
        "var(--jsb-warn)",
      ],
      ["faint", "var(--jsb-muted)", "var(--jsb-faint)"],
    ])(
      "should draw what the caller says about the evaluation, and the dot, in the color of the tone %s",
      (tone, textColor, dotColor) => {
        // Arrange
        const { bar } = renderBar({
          problems: 2,
          evaluation: { text: "evaluating…", tone },
        });

        // Act
        const { problemsColor, dotColor: dot } = bar;

        // Assert
        expect(problemsColor).toBe(textColor);
        expect(dot).toBe(dotColor);
      }
    );

    it("should draw the dot in the color of the evaluation, and not red, while the config has errors", () => {
      // Arrange
      const { bar } = renderBar({
        configHasErrors: true,
        evaluation: { text: "evaluating…", tone: "faint" },
      });

      // Act
      const { dotColor } = bar;

      // Assert
      expect(dotColor).toBe("var(--jsb-faint)");
    });

    it("should draw an ok dot whatever the number of problems", () => {
      // Arrange
      const { bar } = renderBar({ problems: 2, tone: "bad" });

      // Act
      const { dotColor } = bar;

      // Assert
      expect(dotColor).toBe("var(--jsb-ok)");
    });

    it("should draw a faint dot before the problems are known", () => {
      // Arrange
      const { bar } = renderBar({ problems: undefined });

      // Act
      const { dotColor } = bar;

      // Assert
      expect(dotColor).toBe("var(--jsb-faint)");
    });

    it("should draw a red dot while the config has errors, also before the problems are known", () => {
      // Arrange
      const { bar } = renderBar({ problems: undefined, configHasErrors: true });

      // Act
      const { dotColor } = bar;

      // Assert
      expect(dotColor).toBe("var(--jsb-bad)");
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

  describe("slots", () => {
    it("should place the start before the status and the end after it, in order", () => {
      // Arrange
      const { bar } = renderBar({
        start: <button type="button">Pick</button>,
        end: (
          <>
            <button type="button">Help</button>
            <button type="button">Share</button>
          </>
        ),
      });

      // Act
      const { startTexts, endTexts } = bar;

      // Assert
      expect(startTexts).toEqual(["Pick"]);
      expect(endTexts).toEqual(["Help", "Share"]);
    });

    it("should place nothing around the status when it is given nothing", () => {
      // Arrange
      const { bar } = renderBar();

      // Act
      const { startTexts, endTexts } = bar;

      // Assert
      expect(startTexts).toEqual([]);
      expect(endTexts).toEqual([]);
    });

    it("should take the room that is left between the status and the end, to push the end to the far side", () => {
      // Arrange
      const { bar } = renderBar({ end: <button type="button">Share</button> });

      // Act
      const { spacerGrow } = bar;

      // Assert
      expect(spacerGrow).toBe("1");
    });
  });

  describe("fit", () => {
    it("should keep the size of the start, the status and the end when there is not room for all of them", () => {
      // Arrange
      const { bar } = renderBar({
        start: <button type="button">Pick</button>,
        end: <button type="button">Share</button>,
      });

      // Act
      const { itemShrinks } = bar;

      // Assert
      expect(itemShrinks).toEqual(["0", "0", "0"]);
    });
  });

  describe("props", () => {
    it("should not pass the color or the tone to the DOM", () => {
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
    it("should render the test id of the top bar by default", () => {
      // Arrange
      renderBar();

      // Act
      const { isRendered } = new TopBarPom({ testId: "top-bar" });

      // Assert
      expect(isRendered).toBe(true);
    });

    it("should render the test id of the component that is the bar in place of its own", () => {
      // Arrange
      const { bar } = renderBar({ testId: "shell-top-bar" });

      // Act
      const { isRendered } = bar;

      // Assert
      expect(isRendered).toBe(true);
      expect(new TopBarPom().isRendered).toBe(false);
    });
  });
});
