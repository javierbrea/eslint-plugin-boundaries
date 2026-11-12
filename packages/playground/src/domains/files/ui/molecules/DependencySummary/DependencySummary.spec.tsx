import { render } from "@testing-library/react";

import { createEngine } from "@/domains/evaluation/helpers/engine";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { DependencySummary } from "./DependencySummary";
import { DependencySummaryPom } from "./DependencySummary.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const { evaluate } = createEngine();

const FILE = "src/modules/checkout/index.js";

/**
 * Renders the summary of the dependencies of a file.
 * @param path The path of the file.
 * @param evaluation What the engine says. The quick-start project by default.
 * @returns The page object of the summary.
 */
function renderSummary(
  path: string,
  evaluation: Evaluation = evaluate(QUICK_START)
): DependencySummaryPom {
  render(
    <DependencySummary
      results={evaluation.dependencies.filter(({ ref }) => ref.path === path)}
      isEvaluated={evaluation.notEvaluated === undefined}
    />
  );
  return new DependencySummaryPom();
}

/**
 * Evaluates the quick-start project with another severity for the rule.
 * @param severity The severity to write in the config, such as `"warn"`.
 * @returns The evaluation, whose config differs from the quick-start one.
 * @throws When the quick-start config has no such rule to change.
 */
function evaluateWithSeverity(severity: string): Evaluation {
  const config = QUICK_START.config.replace(
    '"boundaries/dependencies": [2,',
    `"boundaries/dependencies": ["${severity}",`
  );

  if (config === QUICK_START.config) {
    throw new Error(
      "The quick-start config has no rule to change the severity of"
    );
  }

  return evaluate({ ...QUICK_START, config });
}

describe("DependencySummary", () => {
  it("should say how many dependencies the file has and what the engine decided about them", () => {
    // Arrange
    const summary = renderSummary(FILE);

    // Act
    const { total, countTexts, totalColor } = summary;

    // Assert
    expect(total).toBe("4 dependencies");
    expect(totalColor).toBe("var(--jsb-muted)");
    expect(countTexts).toEqual([
      { text: "2", color: "var(--jsb-ok)" },
      { text: "1", color: "var(--jsb-bad)" },
      { text: "1 not checked", color: "var(--jsb-faint)" },
    ]);
  });

  it("should write the words of the counts in the text colors of their verdicts, which the icons do not take", () => {
    // Arrange
    const summary = renderSummary(FILE);

    // Act
    const { countTextColors } = summary;

    // Assert
    expect(countTextColors).toEqual([
      "color-mix(in srgb, var(--jsb-ok) 85%, var(--jsb-ink))",
      "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))",
      "var(--jsb-muted)",
    ]);
  });

  it("should mark the counts with the check, the cross and the skip", () => {
    // Arrange
    const summary = renderSummary(FILE);

    // Act
    const paths = summary.counts.map(({ icon }) => icon.pathData);

    // Assert
    expect(paths).toEqual([
      ICON_PATHS.check,
      ICON_PATHS.cross,
      ICON_PATHS.skip,
    ]);
  });

  it("should name each count by its verdict for assistive technology, with the icon of the verdict before its number", () => {
    // Arrange
    const summary = renderSummary(FILE);

    // Act
    const { total, countReadings } = summary;

    // Assert
    expect(total).toBe("4 dependencies");
    expect(countReadings).toEqual([
      { iconName: "allowed", text: "2" },
      { iconName: "disallowed", text: "1" },
      { iconName: undefined, text: "1 not checked" },
    ]);
  });

  it("should leave out a count that is 0", () => {
    // Arrange
    const summary = renderSummary("src/components/atoms/Button/index.js");

    // Act
    const { total, countTexts } = summary;

    // Assert
    expect(total).toBe("2 dependencies");
    expect(countTexts).toEqual([
      { text: "1", color: "var(--jsb-ok)" },
      { text: "1 not checked", color: "var(--jsb-faint)" },
    ]);
  });

  it("should say 1 dependency in the singular", () => {
    // Arrange
    const summary = renderSummary("src/helpers/format/index.js");

    // Act
    const { total, countTexts } = summary;

    // Assert
    expect(total).toBe("1 dependency");
    expect(countTexts).toEqual([{ text: "1", color: "var(--jsb-bad)" }]);
  });

  it("should say 0 dependencies, and count nothing, for a file with none", () => {
    // Arrange
    const summary = renderSummary("src/components/atoms/Button/Button.css");

    // Act
    const { total, countTexts } = summary;

    // Assert
    expect(total).toBe("0 dependencies");
    expect(countTexts).toEqual([]);
  });

  it("should count only the dependencies of the file it is given", () => {
    // Arrange
    const summary = renderSummary("src/index.js");

    // Act
    const { total, countTexts } = summary;

    // Assert
    expect(total).toBe("1 dependency");
    expect(countTexts).toEqual([
      { text: "1 not checked", color: "var(--jsb-faint)" },
    ]);
  });

  it("should say that they are not evaluated, with no counts, while the rule is off", () => {
    // Arrange
    const summary = renderSummary(FILE, evaluateWithSeverity("off"));

    // Act
    const { total, countTexts } = summary;

    // Assert
    expect(total).toBe("4 dependencies · not evaluated");
    expect(countTexts).toEqual([]);
  });

  it("should count the dependencies that a warning disallows as disallowed", () => {
    // Arrange
    const summary = renderSummary(FILE, evaluateWithSeverity("warn"));

    // Act
    const { countTexts } = summary;

    // Assert
    expect(countTexts[1].text).toBe("1");
  });

  it("should draw the dependencies that a warning disallows in the color of warnings, with the triangle of the line", () => {
    // Arrange
    const summary = renderSummary(FILE, evaluateWithSeverity("warn"));

    // Act
    const { countTexts, counts } = summary;

    // Assert
    expect(countTexts[1]).toEqual({ text: "1", color: "var(--jsb-warn)" });
    expect(counts[1].textColor).toBe(
      "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"
    );
    expect(counts[1].icon.pathData).toBe(ICON_PATHS.warn);
  });

  it("should name the dependencies that a warning disallows as disallowed, as a warning, for assistive technology", () => {
    // Arrange
    const summary = renderSummary(FILE, evaluateWithSeverity("warn"));

    // Act
    const { countReadings } = summary;

    // Assert
    expect(countReadings[1]).toEqual({
      iconName: "disallowed, as a warning",
      text: "1",
    });
  });

  it("should put the class it is given on its root, and take the test id it is given", () => {
    // Arrange
    render(
      <DependencySummary
        results={[]}
        isEvaluated
        className="placed"
        testId="summary-of-file"
      />
    );

    // Act
    const summary = new DependencySummaryPom({ testId: "summary-of-file" });

    // Assert
    expect(summary.classNames).toContain("placed");
    expect(new DependencySummaryPom().isRendered).toBe(false);
  });
});
