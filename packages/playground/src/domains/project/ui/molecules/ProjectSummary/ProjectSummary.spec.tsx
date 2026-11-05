import { render } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

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
  it("should show the sketch with the numbers of its files, element types, file categories and policies", () => {
    // Arrange
    const summary = renderSummary();

    // Act
    const { numbers, title } = summary;

    // Assert
    expect(title.text).toBe("Sketch");
    expect(title.tagName).toBe("DIV");
    expect(numbers).toEqual([
      "6files",
      "3element types",
      "2file categories",
      "3policies",
    ]);
  });

  it("should add the policies of every rule of the plugin", () => {
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
    expect(numbers[3]).toBe("3policies");
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
      "0element types",
      "0file categories",
      "0policies",
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
});
