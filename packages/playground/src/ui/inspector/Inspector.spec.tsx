// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests report
import { fireEvent, render, screen as view } from "@testing-library/react";

import type { Sketch } from "../../contract";
import { createEngine } from "../../engine";
import type { Evaluation } from "../../engine";
import { QUICK_START_EXAMPLE } from "../../examples";
import type { Focus } from "../state/Focus.types";

import { Inspector } from "./Inspector";
import type { InspectorProps } from "./Inspector.types";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const { evaluate } = createEngine();

const NOTHING: Focus = { kind: "none" };
const CONFIG: Focus = { kind: "config" };

/**
 * Creates a sketch of the quick-start project with its config changed.
 * @param changes The text to look for in the config and what replaces it, once each.
 * @returns The sketch.
 */
function createSketchWithConfig(changes: [string, string][]): Sketch {
  const config = changes.reduce((text, [from, to]) => {
    expect(text).toContain(from);

    return text.replace(from, to);
  }, QUICK_START.config);
  return { ...QUICK_START, config };
}

/** The quick-start config with the two mistakes of the mockup: a descriptor with `patern`, and a `default` that is not an option. */
const WITH_PROBLEMS = createSketchWithConfig([
  ['pattern: "components/*/*"', 'patern: "components/*/*"'],
  ['default: "disallow"', 'default: "dissallow"'],
]);

/** A policy the config accepts, to count it */
const POLICY =
  '{ from: { element: { type: "a" } }, allow: { to: { element: { type: "b" } } } }';

/**
 * Renders the inspector.
 * @param current What is in focus.
 * @param evaluation What the engine says. The quick-start project by default.
 * @returns The props it was rendered with.
 */
function renderInspector(
  current: Focus,
  evaluation: Evaluation = evaluate(QUICK_START)
): InspectorProps {
  const props = { focus: current, evaluation, onReveal: jest.fn() };
  render(<Inspector {...props} />);
  return props;
}

/**
 * Reads a facet of the description of a file.
 * @param facetName The name of the facet, such as `element`.
 * @returns Its keys and the text of each value.
 */
function getFacet(facetName: string): Record<string, string | null> {
  const facet = view.getByText(facetName, { selector: "b" })
    .parentElement as HTMLElement;
  return Object.fromEntries(
    Array.from(facet.querySelectorAll("dt")).map((key) => [
      key.textContent,
      key.nextElementSibling?.textContent ?? null,
    ])
  );
}

/**
 * Reads the rows of a group of the config inspector.
 * @param label The name of the group, such as `Element types`.
 * @returns The text of each row: its name, what is at its end and what is below.
 */
function getRows(label: string): string[] {
  const list = view.getByRole("heading", { name: label })
    .nextElementSibling as HTMLElement;
  return Array.from(list.querySelectorAll("button")).map((button) =>
    Array.from(button.children)
      .map((part) => part.textContent)
      .join(" | ")
  );
}

/**
 * Reads the numbers of the sketch.
 * @returns Each number with its label, in the order of the grid.
 */
function getNumbers(): string[] {
  const tiles = view.getByText("files").parentElement
    ?.parentElement as HTMLElement;
  return Array.from(tiles.children).map((tile) => tile.textContent as string);
}

describe("Inspector", () => {
  describe("pane", () => {
    it("should be the landmark of the inspector, with its label in the head", () => {
      // Arrange
      renderInspector(NOTHING);

      // Act
      const landmark = view.getByRole("complementary", { name: "Inspector" });

      // Assert
      expect(landmark.textContent).toContain("Inspector");
    });
  });

  describe("a file", () => {
    const FOCUS: Focus = {
      kind: "file",
      path: "src/modules/checkout/index.js",
    };

    it("should show the path of the file", () => {
      // Arrange
      renderInspector(FOCUS);

      // Act
      const title = view.getByText("src/modules/checkout/index.js");

      // Assert
      expect(title.tagName).toBe("DIV");
    });

    it("should show the element facet with its types, path and captured values", () => {
      // Arrange
      renderInspector(FOCUS);

      // Act
      const facet = getFacet("element");

      // Assert
      expect(facet).toEqual({
        types: '[ "module" ]',
        path: '"src/modules/checkout"',
        captured: "null",
      });
    });

    it("should show the file facet with its categories", () => {
      // Arrange
      renderInspector({
        kind: "file",
        path: "src/components/atoms/Button/Button.spec.js",
      });

      // Act
      const facet = getFacet("file");

      // Assert
      expect(facet).toEqual({ categories: '[ "test" ]' });
    });

    it("should show the module facet with its origin", () => {
      // Arrange
      renderInspector(FOCUS);

      // Act
      const facet = getFacet("module");

      // Assert
      expect(facet).toEqual({ origin: '"local"' });
    });

    it("should show the facets in the order of the plugin: element, file, module", () => {
      // Arrange
      renderInspector(FOCUS);

      // Act
      const names = view
        .getAllByText(/^(element|file|module)$/, { selector: "b" })
        .map((facetLabel) => facetLabel.textContent);

      // Assert
      expect(names).toEqual(["element", "file", "module"]);
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
      renderInspector(
        { kind: "file", path: "components/Price/index.js" },
        evaluate(sketch)
      );

      // Act
      const facet = getFacet("element");

      // Assert
      expect(facet.captured).toBe('{ name: "Price" }');
    });

    it("should show a file outside every element with null types and path", () => {
      // Arrange
      renderInspector({ kind: "file", path: "src/index.js" });

      // Act
      const facet = getFacet("element");

      // Assert
      expect(facet).toEqual({ types: "null", path: "null", captured: "null" });
    });

    it("should draw a null value apart from the others", () => {
      // Arrange
      renderInspector(FOCUS);
      const values = view
        .getAllByText(/./, { selector: "dd" })
        .map((value) => getComputedStyle(value).color);

      // Act
      const [types, path, captured] = values;

      // Assert
      expect(captured).toBe("var(--jsb-faint)");
      expect(types).not.toBe(captured);
      expect(path).not.toBe(captured);
    });

    it("should show the path alone when the evaluation does not know the file", () => {
      // Arrange
      renderInspector({ kind: "file", path: "src/removed.js" });

      // Act
      const names = view.queryAllByText(/^(element|file|module)$/, {
        selector: "b",
      });

      // Assert
      expect(view.getByText("src/removed.js").tagName).toBe("DIV");
      expect(names).toHaveLength(0);
    });
  });

  describe("the config", () => {
    it("should show the name of the file and the three groups", () => {
      // Arrange
      renderInspector(CONFIG);

      // Act
      const labels = view
        .getAllByRole("heading")
        .map((heading) => heading.textContent);

      // Assert
      expect(view.getByText("eslint.config.js").tagName).toBe("DIV");
      expect(labels).toEqual(["Element types", "File categories", "Policies"]);
    });

    it("should list each element type with its files and its patterns", () => {
      // Arrange
      renderInspector(CONFIG);

      // Act
      const rows = getRows("Element types");

      // Assert
      expect(rows).toEqual([
        "helper | 1 file | helpers/*",
        "component | 3 files | components/*/*",
        "module | 1 file | modules/*",
      ]);
    });

    it("should list each file category with its files and its patterns", () => {
      // Arrange
      renderInspector(CONFIG);

      // Act
      const rows = getRows("File categories");

      // Assert
      expect(rows).toEqual([
        "test | 1 file | **/*.spec.js",
        "style | 1 file | **/*.css",
      ]);
    });

    it("should list each rule with its policies", () => {
      // Arrange
      renderInspector(CONFIG);

      // Act
      const rows = getRows("Policies");

      // Assert
      expect(rows).toEqual(["boundaries/dependencies | 3 policies"]);
    });

    it("should join the patterns of a descriptor that has several", () => {
      // Arrange
      const sketch = createSketchWithConfig([
        ['pattern: "helpers/*"', 'pattern: ["helpers/*", "utils/*"]'],
      ]);
      renderInspector(CONFIG, evaluate(sketch));

      // Act
      const rows = getRows("Element types");

      // Assert
      expect(rows[0]).toBe("helper | 1 file | helpers/*, utils/*");
    });

    it("should write one policy in the singular", () => {
      // Arrange
      const sketch: Sketch = {
        config: `{
          settings: {},
          rules: {
            "boundaries/dependencies": [2, { default: "allow", policies: [${POLICY}] }],
            "boundaries/no-unknown": 2,
          },
        }`,
        tree: [],
        dependencies: [],
      };
      renderInspector(CONFIG, evaluate(sketch));

      // Act
      const rows = getRows("Policies");

      // Assert
      expect(rows).toEqual([
        "boundaries/dependencies | 1 policy",
        "boundaries/no-unknown | 0 policies",
      ]);
    });

    it("should say that a descriptor with a mistake is ignored, and where it is", () => {
      // Arrange
      renderInspector(CONFIG, evaluate(WITH_PROBLEMS));

      // Act
      const rows = getRows("Element types");

      // Assert
      expect(rows).toEqual([
        "helper | 1 file | helpers/*",
        "component | ignored | invalid descriptor, line 5",
        "module | 1 file | modules/*",
      ]);
    });

    it("should say that a rule with invalid options is not evaluated", () => {
      // Arrange
      renderInspector(CONFIG, evaluate(WITH_PROBLEMS));

      // Act
      const rows = getRows("Policies");

      // Assert
      expect(rows).toEqual([
        "boundaries/dependencies | not evaluated | 3 policies · invalid options",
      ]);
    });

    it("should draw what is wrong in the colors of a warning and an error, and the counts apart", () => {
      // Arrange
      renderInspector(CONFIG, evaluate(WITH_PROBLEMS));

      // Act
      const ignored = getComputedStyle(view.getByText("ignored")).color;
      const ignoredName = getComputedStyle(
        view.getByRole("button", { name: /^component/ }).children[0]
      ).color;
      const notEvaluated = getComputedStyle(
        view.getByText("not evaluated")
      ).color;
      const count = getComputedStyle(
        view.getByRole("button", { name: /^helper/ }).children[1]
      ).color;

      // Assert
      expect(ignored).toBe("var(--jsb-warn)");
      expect(ignoredName).toBe("var(--jsb-warn)");
      expect(notEvaluated).toBe("var(--jsb-bad)");
      expect(count).toBe("var(--jsb-muted)");
    });

    it("should keep the file categories while a descriptor of the elements is ignored", () => {
      // Arrange
      renderInspector(CONFIG, evaluate(WITH_PROBLEMS));

      // Act
      const rows = getRows("File categories");

      // Assert
      expect(rows).toHaveLength(2);
    });

    it("should reveal the entry of an element type when its row is chosen", () => {
      // Arrange
      const evaluation = evaluate(QUICK_START);
      const props = renderInspector(CONFIG, evaluation);

      // Act
      fireEvent.click(view.getByRole("button", { name: /^component/ }));

      // Assert
      expect(props.onReveal).toHaveBeenCalledTimes(1);
      expect(props.onReveal).toHaveBeenCalledWith(
        evaluation.elementTypes[1].range
      );
    });

    it("should reveal the entry of a file category when its row is chosen", () => {
      // Arrange
      const evaluation = evaluate(QUICK_START);
      const props = renderInspector(CONFIG, evaluation);

      // Act
      fireEvent.click(view.getByRole("button", { name: /^style/ }));

      // Assert
      expect(props.onReveal).toHaveBeenCalledTimes(1);
      expect(props.onReveal).toHaveBeenCalledWith(
        evaluation.fileCategories[1].range
      );
    });

    it("should reveal the entry of a rule when its row is chosen", () => {
      // Arrange
      const evaluation = evaluate(QUICK_START);
      const props = renderInspector(CONFIG, evaluation);

      // Act
      fireEvent.click(
        view.getByRole("button", { name: /^boundaries\/dependencies/ })
      );

      // Assert
      expect(props.onReveal).toHaveBeenCalledTimes(1);
      expect(props.onReveal).toHaveBeenCalledWith(evaluation.rules[0].range);
    });

    it("should reveal the descriptor that is ignored, where the mistake is", () => {
      // Arrange
      const evaluation = evaluate(WITH_PROBLEMS);
      const props = renderInspector(CONFIG, evaluation);

      // Act
      fireEvent.click(view.getByRole("button", { name: /^component/ }));

      // Assert
      expect(props.onReveal).toHaveBeenCalledWith(
        expect.objectContaining({ line: 5 })
      );
    });

    it("should say that a group has nothing when the config has no entries for it", () => {
      // Arrange
      const sketch: Sketch = {
        ...QUICK_START,
        config: "{ settings: {}, rules: {} }",
      };
      renderInspector(CONFIG, evaluate(sketch));

      // Act
      const nothing = view.getAllByText("None");

      // Assert
      expect(nothing).toHaveLength(3);
      expect(view.queryAllByRole("button")).toHaveLength(0);
    });

    it("should say that every group has nothing when the config cannot be read", () => {
      // Arrange
      const sketch: Sketch = { ...QUICK_START, config: "{ settings: " };
      renderInspector(CONFIG, evaluate(sketch));

      // Act
      const nothing = view.getAllByText("None");

      // Assert
      expect(nothing).toHaveLength(3);
    });
  });

  describe("nothing in focus", () => {
    it("should show the sketch with the numbers of its files, element types, file categories and policies", () => {
      // Arrange
      renderInspector(NOTHING);

      // Act
      const numbers = getNumbers();

      // Assert
      expect(view.getByText("Sketch").tagName).toBe("DIV");
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
      renderInspector(NOTHING, evaluate(sketch));

      // Act
      const numbers = getNumbers();

      // Assert
      expect(numbers[3]).toBe("3policies");
    });

    it("should show zeros for a config that cannot be read, and the files all the same", () => {
      // Arrange
      const sketch: Sketch = { ...QUICK_START, config: "{ settings: " };
      renderInspector(NOTHING, evaluate(sketch));

      // Act
      const numbers = getNumbers();

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
      renderInspector(NOTHING, evaluate({ ...QUICK_START, tree: [] }));

      // Act
      const numbers = getNumbers();

      // Assert
      expect(numbers[0]).toBe("0files");
    });
  });
});
