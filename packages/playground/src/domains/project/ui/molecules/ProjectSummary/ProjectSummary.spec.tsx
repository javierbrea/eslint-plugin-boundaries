import { render } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { ProjectSummary } from "./ProjectSummary";
import { ProjectSummaryPom } from "./ProjectSummary.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const { evaluate } = createEngine();

/** A policy the config accepts, to count it */
const POLICY =
  '{ from: { element: { type: "a" } }, allow: { to: { element: { type: "b" } } } }';

/**
 * Renders the summary.
 * @param evaluation What the engine says. The quick-start project by default.
 * @returns The page object of the summary.
 */
function renderSummary(
  evaluation: Evaluation = evaluate(QUICK_START)
): ProjectSummaryPom {
  render(<ProjectSummary evaluation={evaluation} />);
  return new ProjectSummaryPom();
}

describe("ProjectSummary", () => {
  it("should show the sketch with the numbers of its files, dependencies, element types, file categories, policies and disallowed dependencies", () => {
    // Arrange
    const summary = renderSummary();

    // Act
    const { numbers, title } = summary;

    // Assert
    expect(title.text).toBe("Sketch");
    expect(title.tagName).toBe("DIV");
    expect(numbers).toEqual([
      "6files",
      "9dependencies",
      "3element types",
      "2file categories",
      "3policies",
      "2disallowed",
    ]);
  });

  it("should count the policies of the evaluated rule only, and not the ones of the other rules of the plugin", () => {
    // Arrange
    const sketch: Sketch = {
      config: `{
          settings: {},
          rules: {
            "boundaries/dependencies": [2, { default: "allow", policies: [${POLICY}, ${POLICY}] }],
            "boundaries/no-unknown": 2,
            "boundaries/element-types": [2, { default: "disallow", rules: [{ from: "a", allow: ["b"] }] }],
          },
        }`,
      tree: [],
      dependencies: [],
    };
    const summary = renderSummary(evaluate(sketch));

    // Act
    const { numbers } = summary;

    // Assert
    expect(numbers[4]).toBe("2policies");
  });

  it("should count the policies of the deprecated rule when it is the one that is evaluated", () => {
    // Arrange
    const sketch: Sketch = {
      config: `{
          settings: {},
          rules: {
            "boundaries/element-types": [2, { default: "disallow", rules: [{ from: "a", allow: ["b"] }] }],
          },
        }`,
      tree: [],
      dependencies: [],
    };
    const summary = renderSummary(evaluate(sketch));

    // Act
    const { numbers } = summary;

    // Assert
    expect(numbers[4]).toBe("1policies");
  });

  it("should count no policy when no rule is evaluated, though another rule of the plugin has some", () => {
    // Arrange
    const sketch: Sketch = {
      config: `{
          settings: {},
          rules: {
            "boundaries/no-unknown": 2,
            "boundaries/entry-point": [2, { default: "disallow", rules: [{ target: "a", allow: "*.js" }] }],
          },
        }`,
      tree: [],
      dependencies: [],
    };
    const summary = renderSummary(evaluate(sketch));

    // Act
    const { numbers } = summary;

    // Assert
    expect(numbers[4]).toBe("0policies");
  });

  it("should show zeros for a config that cannot be read, and the files all the same", () => {
    // Arrange
    const sketch: Sketch = { ...QUICK_START, config: "{ settings: " };
    const summary = renderSummary(evaluate(sketch));

    // Act
    const { numbers } = summary;

    // Assert
    expect(numbers).toEqual([
      "6files",
      "9dependencies",
      "0element types",
      "0file categories",
      "0policies",
      "0disallowed",
    ]);
  });

  it("should count no files for a sketch that has none", () => {
    // Arrange
    const summary = renderSummary(evaluate({ ...QUICK_START, tree: [] }));

    // Act
    const { numbers } = summary;

    // Assert
    expect(numbers[0]).toBe("0files");
  });

  describe("the dependencies", () => {
    it("should count the dependencies of the quick-start example by what the engine decided", () => {
      // Arrange
      const summary = renderSummary();

      // Act
      const { verdictCounts, verdictsLine } = summary;

      // Assert
      expect(verdictCounts.map(({ text }) => text)).toEqual([
        "3 allowed",
        "4 not checked",
      ]);
      expect(verdictsLine).toBe("3 allowed4 not checked");
    });

    it("should draw the allowed dependencies in the color of the allowed ones, and the ones not checked in the faint one", () => {
      // Arrange
      const summary = renderSummary();

      // Act
      const colors = summary.verdictCounts.map(({ color }) => color);

      // Assert
      expect(colors).toEqual(["var(--jsb-ok)", "var(--jsb-faint)"]);
    });

    it("should mark the allowed with a check and the ones not checked with a skip", () => {
      // Arrange
      const summary = renderSummary();

      // Act
      const paths = summary.verdictCounts.map(({ iconPath }) => iconPath);

      // Assert
      expect(paths).toEqual([ICON_PATHS.check, ICON_PATHS.skip]);
    });

    it("should draw the disallowed dependencies in the color of errors when there are any", () => {
      // Arrange
      const summary = renderSummary();

      // Act
      const color = summary.countColor("disallowed");

      // Assert
      expect(color).toBe("var(--jsb-bad)");
    });

    it("should draw the disallowed dependencies in the color of warnings when the rule is a warning", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["warn",'
      );
      const summary = renderSummary(evaluate({ ...QUICK_START, config }));

      // Act
      const color = summary.countColor("disallowed");

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(summary.count("disallowed")).toBe("2");
      expect(color).toBe("var(--jsb-warn)");
    });

    it("should draw the disallowed dependencies as the other numbers when there are none", () => {
      // Arrange
      const sketch: Sketch = { ...QUICK_START, dependencies: [] };
      const summary = renderSummary(evaluate(sketch));

      // Act
      const disallowed = summary.countColor("disallowed");
      const files = summary.countColor("files");

      // Assert
      expect(summary.count("disallowed")).toBe("0");
      expect(disallowed).toBe(files);
      expect(disallowed).not.toBe("var(--jsb-bad)");
    });

    it("should draw no other number in the color of errors", () => {
      // Arrange
      const summary = renderSummary();
      const labels = [
        "files",
        "dependencies",
        "element types",
        "file categories",
        "policies",
        "disallowed",
      ];

      // Act
      const colors = labels.map((label) => summary.countColor(label));

      // Assert
      expect(
        labels.filter((_label, index) => colors[index] === "var(--jsb-bad)")
      ).toEqual(["disallowed"]);
    });

    it("should count a dependency that a warning disallows as disallowed", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["warn",'
      );
      const summary = renderSummary(evaluate({ ...QUICK_START, config }));

      // Act
      const disallowed = summary.count("disallowed");

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(disallowed).toBe("2");
    });

    it("should say that the dependencies are not evaluated, with no counts, while the rule is off", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["off",'
      );
      const summary = renderSummary(evaluate({ ...QUICK_START, config }));

      // Act
      const { verdictsLine, verdictCounts, numbers } = summary;

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(verdictsLine).toBe("not evaluated");
      expect(verdictCounts).toEqual([]);
      expect(numbers[1]).toBe("9dependencies");
      expect(numbers[5]).toBe("0disallowed");
    });

    it("should count zero allowed and zero not checked for a sketch with no dependencies", () => {
      // Arrange
      const sketch: Sketch = { ...QUICK_START, dependencies: [] };
      const summary = renderSummary(evaluate(sketch));

      // Act
      const { verdictCounts } = summary;

      // Assert
      expect(verdictCounts.map(({ text }) => text)).toEqual([
        "0 allowed",
        "0 not checked",
      ]);
    });
  });
});
