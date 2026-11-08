import { render } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { ICON_PATHS } from "@/ui-kit/atoms/Icon/Icon.constants";

import { FileInspector } from "./FileInspector";
import { FileInspectorPom } from "./FileInspector.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const { evaluate } = createEngine();

const FILE = "src/modules/checkout/index.js";

/**
 * Renders the inspector of a file.
 * @param path The path of the file in focus.
 * @param evaluation What the engine says. The quick-start project by default.
 * @returns The page object of the inspector.
 */
function renderInspector(
  path: string,
  evaluation: Evaluation = evaluate(QUICK_START)
): FileInspectorPom {
  render(<FileInspector path={path} evaluation={evaluation} />);
  return new FileInspectorPom();
}

describe("FileInspector", () => {
  it("should show the path of the file", () => {
    // Arrange
    const inspector = renderInspector(FILE);

    // Act
    const title = inspector.title(FILE);

    // Assert
    expect(title.tagName).toBe("DIV");
  });

  it("should show the element facet with its types, path and captured values", () => {
    // Arrange
    const inspector = renderInspector(FILE);

    // Act
    const { entries } = inspector.facet("element");

    // Assert
    expect(entries).toEqual({
      types: '[ "module" ]',
      path: '"src/modules/checkout"',
      captured: "null",
    });
  });

  it("should show the file facet with its categories", () => {
    // Arrange
    const inspector = renderInspector(
      "src/components/atoms/Button/Button.spec.js"
    );

    // Act
    const { entries } = inspector.facet("file");

    // Assert
    expect(entries).toEqual({ categories: '[ "test" ]' });
  });

  it("should show the module facet with its origin", () => {
    // Arrange
    const inspector = renderInspector(FILE);

    // Act
    const { entries } = inspector.facet("module");

    // Assert
    expect(entries).toEqual({ origin: '"local"' });
  });

  it("should show the facets in the order of the plugin: element, file, module", () => {
    // Arrange
    const inspector = renderInspector(FILE);

    // Act
    const { facetNames } = inspector;

    // Assert
    expect(facetNames).toEqual(["element", "file", "module"]);
  });

  it("should show the values that the config captures from the path, as an object", () => {
    // Arrange
    const sketch: Sketch = {
      config: `{
          settings: {
            "boundaries/elements": [
              { type: "component", pattern: "components/*", capture: ["name"] },
            ],
          },
          rules: {},
        }`,
      tree: [{ path: "components/Price/index.js", kind: "file" }],
      dependencies: [],
    };
    const inspector = renderInspector(
      "components/Price/index.js",
      evaluate(sketch)
    );

    // Act
    const { entries } = inspector.facet("element");

    // Assert
    expect(entries.captured).toBe('{ name: "Price" }');
  });

  it("should show a file outside every element with null types and path", () => {
    // Arrange
    const inspector = renderInspector("src/index.js");

    // Act
    const { entries } = inspector.facet("element");

    // Assert
    expect(entries).toEqual({ types: "null", path: "null", captured: "null" });
  });

  it("should draw a null value apart from the others", () => {
    // Arrange
    const inspector = renderInspector(FILE);
    const facet = inspector.facet("element");

    // Act
    const types = facet.valueColor("types");
    const path = facet.valueColor("path");
    const captured = facet.valueColor("captured");

    // Assert
    expect(captured).toBe("var(--jsb-faint)");
    expect(types).not.toBe(captured);
    expect(path).not.toBe(captured);
  });

  it("should show the path alone when the evaluation does not know the file", () => {
    // Arrange
    const inspector = renderInspector("src/removed.js");

    // Act
    const { facetNames } = inspector;

    // Assert
    expect(inspector.title("src/removed.js").tagName).toBe("DIV");
    expect(facetNames).toHaveLength(0);
    expect(inspector.summary.isRendered).toBe(false);
  });

  describe("the dependencies", () => {
    it("should say how many dependencies the file has and what the engine decided about them", () => {
      // Arrange
      const inspector = renderInspector(FILE);

      // Act
      const { total, countTexts, totalColor } = inspector.summary;

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
      const inspector = renderInspector(FILE);

      // Act
      const { countTextColors } = inspector.summary;

      // Assert
      expect(countTextColors).toEqual([
        "color-mix(in srgb, var(--jsb-ok) 85%, var(--jsb-ink))",
        "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))",
        "var(--jsb-muted)",
      ]);
    });

    it("should mark the counts with the check, the cross and the skip", () => {
      // Arrange
      const inspector = renderInspector(FILE);

      // Act
      const paths = inspector.summary.counts.map(({ icon }) => icon.pathData);

      // Assert
      expect(paths).toEqual([
        ICON_PATHS.check,
        ICON_PATHS.cross,
        ICON_PATHS.skip,
      ]);
    });

    it("should name each count by its verdict for assistive technology, with the icon of the verdict before its number", () => {
      // Arrange
      const inspector = renderInspector(FILE);

      // Act
      const { total, countReadings } = inspector.summary;

      // Assert
      expect(total).toBe("4 dependencies");
      expect(countReadings).toEqual([
        { iconName: "allowed", text: "2" },
        { iconName: "disallowed", text: "1" },
        { iconName: undefined, text: "1 not checked" },
      ]);
    });

    it("should place the summary after the three facets", () => {
      // Arrange
      const inspector = renderInspector(FILE);

      // Act
      const { isLast } = inspector.summary;

      // Assert
      expect(inspector.facetNames).toEqual(["element", "file", "module"]);
      expect(isLast).toBe(true);
    });

    it("should leave out a count that is 0", () => {
      // Arrange
      const inspector = renderInspector("src/components/atoms/Button/index.js");

      // Act
      const { total, countTexts } = inspector.summary;

      // Assert
      expect(total).toBe("2 dependencies");
      expect(countTexts).toEqual([
        { text: "1", color: "var(--jsb-ok)" },
        { text: "1 not checked", color: "var(--jsb-faint)" },
      ]);
    });

    it("should say 1 dependency in the singular", () => {
      // Arrange
      const inspector = renderInspector("src/helpers/format/index.js");

      // Act
      const { total, countTexts } = inspector.summary;

      // Assert
      expect(total).toBe("1 dependency");
      expect(countTexts).toEqual([{ text: "1", color: "var(--jsb-bad)" }]);
    });

    it("should say 0 dependencies, and count nothing, for a file with none", () => {
      // Arrange
      const inspector = renderInspector(
        "src/components/atoms/Button/Button.css"
      );

      // Act
      const { total, countTexts } = inspector.summary;

      // Assert
      expect(total).toBe("0 dependencies");
      expect(countTexts).toEqual([]);
    });

    it("should count only the dependencies of the file in focus", () => {
      // Arrange
      const inspector = renderInspector("src/index.js");

      // Act
      const { total, countTexts } = inspector.summary;

      // Assert
      expect(total).toBe("1 dependency");
      expect(countTexts).toEqual([
        { text: "1 not checked", color: "var(--jsb-faint)" },
      ]);
    });

    it("should say that they are not evaluated, with no counts, while the rule is off", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["off",'
      );
      const inspector = renderInspector(
        FILE,
        evaluate({ ...QUICK_START, config })
      );

      // Act
      const { total, countTexts } = inspector.summary;

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(total).toBe("4 dependencies · not evaluated");
      expect(countTexts).toEqual([]);
    });

    it("should count the dependencies that a warning disallows as disallowed", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["warn",'
      );
      const inspector = renderInspector(
        FILE,
        evaluate({ ...QUICK_START, config })
      );

      // Act
      const { countTexts } = inspector.summary;

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(countTexts[1].text).toBe("1");
    });

    it("should draw the dependencies that a warning disallows in the color of warnings, with the triangle of the line", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["warn",'
      );
      const inspector = renderInspector(
        FILE,
        evaluate({ ...QUICK_START, config })
      );

      // Act
      const { countTexts, counts } = inspector.summary;

      // Assert
      expect(countTexts[1]).toEqual({ text: "1", color: "var(--jsb-warn)" });
      expect(counts[1].textColor).toBe(
        "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"
      );
      expect(counts[1].icon.pathData).toBe(ICON_PATHS.warn);
    });

    it("should name the dependencies that a warning disallows as disallowed, as a warning, for assistive technology", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["warn",'
      );
      const inspector = renderInspector(
        FILE,
        evaluate({ ...QUICK_START, config })
      );

      // Act
      const { countReadings } = inspector.summary;

      // Assert
      expect(config).not.toBe(QUICK_START.config);
      expect(countReadings[1]).toEqual({
        iconName: "disallowed, as a warning",
        text: "1",
      });
    });
  });
});
