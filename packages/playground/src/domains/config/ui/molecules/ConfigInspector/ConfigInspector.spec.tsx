// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests report
import { render } from "@testing-library/react";

import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type { Evaluation } from "@/domains/evaluation/helpers/engine";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";

import { ConfigInspector } from "./ConfigInspector";
import { ConfigInspectorPom } from "./ConfigInspector.pom";
import type { ConfigInspectorProps } from "./ConfigInspector.types";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const { evaluate } = createEngine();

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

/** What {@link renderInspector} returns: the props it rendered the inspector with, and its page object. */
type InspectorRender = {
  readonly props: ConfigInspectorProps;
  readonly inspector: ConfigInspectorPom;
};

/**
 * Renders the inspector of the config.
 * @param evaluation What the engine says. The quick-start project by default.
 * @returns The props it was rendered with and its page object.
 */
function renderInspector(
  evaluation: Evaluation = evaluate(QUICK_START)
): InspectorRender {
  const props = { evaluation, onOpen: jest.fn() };
  render(<ConfigInspector {...props} />);
  return { props, inspector: new ConfigInspectorPom() };
}

describe("ConfigInspector", () => {
  it("should show the name of the file and the three groups", () => {
    // Arrange
    const { inspector } = renderInspector();

    // Act
    const { title, groupLabels } = inspector;

    // Assert
    expect(title.text).toBe("eslint.config.js");
    expect(title.tagName).toBe("DIV");
    expect(groupLabels).toEqual([
      "Element types",
      "File categories",
      "Policies",
    ]);
  });

  it("should draw the headings of the groups as h2, which follow the h1 of the host page without skipping a level", () => {
    // Arrange
    const { inspector } = renderInspector();

    // Act
    const { groupTags } = inspector;

    // Assert
    expect(groupTags).toEqual(["H2", "H2", "H2"]);
  });

  it("should list each element type with its files and its patterns", () => {
    // Arrange
    const { inspector } = renderInspector();

    // Act
    const { rowTexts } = inspector.group("Element types");

    // Assert
    expect(rowTexts).toEqual([
      "helper | 1 file | helpers/*",
      "component | 3 files | components/*/*",
      "module | 1 file | modules/*",
    ]);
  });

  it("should list each file category with its files and its patterns", () => {
    // Arrange
    const { inspector } = renderInspector();

    // Act
    const { rowTexts } = inspector.group("File categories");

    // Assert
    expect(rowTexts).toEqual([
      "test | 1 file | **/*.spec.js",
      "style | 1 file | **/*.css",
    ]);
  });

  it("should list each policy of the rule with the dependencies it decided, and the default", () => {
    // Arrange
    const { inspector } = renderInspector();

    // Act
    const { rowTexts } = inspector.group("Policies");

    // Assert
    expect(rowTexts).toEqual([
      "0 · component → helper | 1 dependency",
      "1 · module → component, helper | 2 dependencies",
      "2 · disallow → test | 1 dependency",
      "default · disallow | 1 dependency",
    ]);
  });

  it("should draw in the color of errors the dependencies of a policy that disallowed any, and the others apart", () => {
    // Arrange
    const { inspector } = renderInspector();

    // Act
    const allowing = inspector.row(/^0 · component/).statusColor;
    const disallowing = inspector.row(/^2 · disallow/).statusColor;
    const byDefault = inspector.row(/^default/).statusColor;

    // Assert
    expect(allowing).toBe("var(--jsb-muted)");
    expect(disallowing).toBe(
      "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
    );
    expect(byDefault).toBe(
      "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
    );
  });

  it("should lay a row out as two columns, the name wrapping in the first and the count staying at the top of the second, with the detail under both", () => {
    // Arrange
    const { inspector } = renderInspector();
    const row = inspector.row(/^1 · module/);

    // Act
    const { display, gridTemplateColumns, alignItems, gap } = row.layout;
    const { detailColumn } = inspector.row(/^helper/);

    // Assert
    expect(display).toBe("grid");
    expect(gridTemplateColumns).toBe("minmax(0, 1fr) auto");
    expect(alignItems).toBe("start");
    expect(gap).toBe("2px 10px");
    expect(detailColumn).toBe("1/-1");
  });

  it("should join the patterns of a descriptor that has several", () => {
    // Arrange
    const sketch = createSketchWithConfig([
      ['pattern: "helpers/*"', 'pattern: ["helpers/*", "utils/*"]'],
    ]);
    const { inspector } = renderInspector(evaluate(sketch));

    // Act
    const { rowTexts } = inspector.group("Element types");

    // Assert
    expect(rowTexts[0]).toBe("helper | 1 file | helpers/*, utils/*");
  });

  it("should list the policies of the rule, and say that the other rules are not evaluated here", () => {
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
    const { inspector } = renderInspector(evaluate(sketch));

    // Act
    const { rowTexts } = inspector.group("Policies");

    // Assert
    expect(rowTexts).toEqual([
      "0 · a → b | 0 dependencies",
      "default · allow | 0 dependencies",
      "boundaries/no-unknown | not evaluated here",
    ]);
  });

  it("should say that the rule is off in place of its policies", () => {
    // Arrange
    const sketch = createSketchWithConfig([
      ['"boundaries/dependencies": [2,', '"boundaries/dependencies": ["off",'],
    ]);
    const { inspector } = renderInspector(evaluate(sketch));

    // Act
    const { rowTexts } = inspector.group("Policies");

    // Assert
    expect(rowTexts).toEqual(["boundaries/dependencies | not evaluated | off"]);
  });

  it("should say that a descriptor with a mistake is ignored, and where it is", () => {
    // Arrange
    const { inspector } = renderInspector(evaluate(WITH_PROBLEMS));

    // Act
    const { rowTexts } = inspector.group("Element types");

    // Assert
    expect(rowTexts).toEqual([
      "helper | 1 file | helpers/*",
      "component | ignored | invalid descriptor, line 5",
      "module | 1 file | modules/*",
    ]);
  });

  it("should say that a rule with invalid options is not evaluated", () => {
    // Arrange
    const { inspector } = renderInspector(evaluate(WITH_PROBLEMS));

    // Act
    const { rowTexts } = inspector.group("Policies");

    // Assert
    expect(rowTexts).toEqual([
      "boundaries/dependencies | not evaluated | 3 policies · invalid options",
    ]);
  });

  it("should draw what is wrong in the colors of a warning and an error, and the counts apart", () => {
    // Arrange
    const { inspector } = renderInspector(evaluate(WITH_PROBLEMS));

    // Act
    const ignored = inspector.row(/^component/).statusColor;
    const ignoredName = inspector.row(/^component/).nameColor;
    const notEvaluated = inspector.row(/^boundaries\/dependencies/).statusColor;
    const count = inspector.row(/^helper/).statusColor;

    // Assert
    expect(ignored).toBe(
      "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"
    );
    expect(ignoredName).toBe(
      "color-mix(in srgb, var(--jsb-warn) 85%, var(--jsb-ink))"
    );
    expect(notEvaluated).toBe(
      "color-mix(in srgb, var(--jsb-bad) 85%, var(--jsb-ink))"
    );
    expect(count).toBe("var(--jsb-muted)");
  });

  it("should keep the file categories while a descriptor of the elements is ignored", () => {
    // Arrange
    const { inspector } = renderInspector(evaluate(WITH_PROBLEMS));

    // Act
    const { rowTexts } = inspector.group("File categories");

    // Assert
    expect(rowTexts).toHaveLength(2);
  });

  it("should open the config at the entry of an element type when its row is chosen", () => {
    // Arrange
    const evaluation = evaluate(QUICK_START);
    const { props, inspector } = renderInspector(evaluation);

    // Act
    inspector.row(/^component/).press();

    // Assert
    expect(props.onOpen).toHaveBeenCalledTimes(1);
    expect(props.onOpen).toHaveBeenCalledWith({
      kind: "config",
      range: evaluation.elementTypes[1].range,
    });
  });

  it("should open the config at the entry of a file category when its row is chosen", () => {
    // Arrange
    const evaluation = evaluate(QUICK_START);
    const { props, inspector } = renderInspector(evaluation);

    // Act
    inspector.row(/^style/).press();

    // Assert
    expect(props.onOpen).toHaveBeenCalledTimes(1);
    expect(props.onOpen).toHaveBeenCalledWith({
      kind: "config",
      range: evaluation.fileCategories[1].range,
    });
  });

  it("should open the config at the policy when its row is chosen", () => {
    // Arrange
    const evaluation = evaluate(QUICK_START);
    const { props, inspector } = renderInspector(evaluation);

    // Act
    inspector.row(/^2 · disallow/).press();

    // Assert
    expect(props.onOpen).toHaveBeenCalledTimes(1);
    expect(props.onOpen).toHaveBeenCalledWith({
      kind: "config",
      range: evaluation.policies[2].range,
    });
  });

  it("should open the config at the default when its row is chosen", () => {
    // Arrange
    const evaluation = evaluate(QUICK_START);
    const { props, inspector } = renderInspector(evaluation);

    // Act
    inspector.row(/^default/).press();

    // Assert
    expect(props.onOpen).toHaveBeenCalledTimes(1);
    expect(props.onOpen).toHaveBeenCalledWith({
      kind: "config",
      range: evaluation.policies[3].range,
    });
  });

  it("should open the config at the entry of a rule that is not evaluated when its row is chosen", () => {
    // Arrange
    const evaluation = evaluate(WITH_PROBLEMS);
    const { props, inspector } = renderInspector(evaluation);

    // Act
    inspector.row(/^boundaries\/dependencies/).press();

    // Assert
    expect(props.onOpen).toHaveBeenCalledTimes(1);
    expect(props.onOpen).toHaveBeenCalledWith({
      kind: "config",
      range: evaluation.rules[0].range,
    });
  });

  it("should open the config at the descriptor that is ignored, where the mistake is", () => {
    // Arrange
    const evaluation = evaluate(WITH_PROBLEMS);
    const { props, inspector } = renderInspector(evaluation);

    // Act
    inspector.row(/^component/).press();

    // Assert
    expect(props.onOpen).toHaveBeenCalledWith({
      kind: "config",
      range: expect.objectContaining({ line: 5 }),
    });
  });

  it("should say that a group has nothing when the config has no entries for it", () => {
    // Arrange
    const sketch: Sketch = {
      ...QUICK_START,
      config: "{ settings: {}, rules: {} }",
    };
    const { inspector } = renderInspector(evaluate(sketch));

    // Act
    const { noneMessages, rowTexts } = inspector;

    // Assert
    expect(noneMessages).toHaveLength(3);
    expect(rowTexts).toHaveLength(0);
  });

  it("should say that every group has nothing when the config cannot be read", () => {
    // Arrange
    const sketch: Sketch = { ...QUICK_START, config: "{ settings: " };
    const { inspector } = renderInspector(evaluate(sketch));

    // Act
    const { noneMessages } = inspector;

    // Assert
    expect(noneMessages).toHaveLength(3);
  });
});
