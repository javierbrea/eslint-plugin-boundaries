import { render } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

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
    expect(title.text).toBe(FILE);
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
  });
});
