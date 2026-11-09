import type { Sketch } from "@/contract";
import { createEngine } from "@/domains/evaluation/helpers/engine";
import type {
  DependencyDescription,
  Evaluation,
} from "@/domains/evaluation/helpers/engine";
import { createEntityDescription } from "@/domains/evaluation/helpers/engine/entityDescription.mock";
import { QUICK_START_EXAMPLE } from "@/domains/examples/data/examples";
import { getOpenPlaces } from "@/domains/files/ui/helpers/inspectorPlaces";
import type {
  InspectorChoices,
  InspectorPlace,
} from "@/domains/files/ui/helpers/inspectorPlaces";
import { renderInRoot } from "@/shared/testing/renderInRoot";

import { FileInspector } from "./FileInspector";
import { FileInspectorPom } from "./FileInspector.pom";

const QUICK_START = QUICK_START_EXAMPLE.sketch;

const { evaluate } = createEngine();

const EVALUATION = evaluate(QUICK_START);

const FILE = "src/modules/checkout/index.js";

/** The dependencies of the file, in the order of the tree: Button, format, the test of Button and react. */
const [BUTTON, FORMAT, BUTTON_SPEC, REACT] = [0, 1, 2, 3];

/** What `renderInspector` takes besides the path. */
type InspectorOptions = {
  /** What the engine says. The quick-start project by default. */
  readonly evaluation?: Evaluation;
  /** The dependency in focus. None by default. */
  readonly dependencyIndex?: number;
  /** What the user chose to open or fold. Nothing by default. */
  readonly choices?: InspectorChoices;
  /** Receives the places whose headers are pressed. */
  readonly onToggle?: (place: InspectorPlace) => void;
};

/**
 * Renders the inspector of a file inside the root of the playground, where its text styles apply.
 * @param path The path of the file in focus.
 * @param options What differs from the defaults.
 * @param options.evaluation
 * @param options.dependencyIndex
 * @param options.choices
 * @param options.onToggle
 * @returns The page object of the inspector.
 */
function renderInspector(
  path: string,
  {
    evaluation = EVALUATION,
    dependencyIndex,
    choices = {},
    onToggle = jest.fn(),
  }: InspectorOptions = {}
): FileInspectorPom {
  renderInRoot(
    <FileInspector
      path={path}
      evaluation={evaluation}
      dependencyIndex={dependencyIndex}
      openPlaces={getOpenPlaces(choices)}
      onToggle={onToggle}
    />
  );
  return new FileInspectorPom();
}

/**
 * Replaces what the engine says about the description of a dependency.
 * @param evaluation What the engine says.
 * @param path The file that has the dependency.
 * @param index The position of the dependency among the ones of the file.
 * @param description What the plugin describes of it, or `undefined` when it does not read it.
 * @returns The evaluation with that description.
 */
function describeDependency(
  evaluation: Evaluation,
  path: string,
  index: number,
  description: DependencyDescription | undefined
): Evaluation {
  return {
    ...evaluation,
    dependencies: evaluation.dependencies.map((result) =>
      result.ref.path === path && result.ref.index === index
        ? { ...result, description }
        : result
    ),
  };
}

describe("FileInspector", () => {
  describe("a file in focus", () => {
    it("should draw the section from, and no other, while no dependency is in focus", () => {
      // Arrange
      const inspector = renderInspector(FILE);

      // Act
      const { sectionNames } = inspector;

      // Assert
      expect(sectionNames).toEqual(["from"]);
    });

    it("should put the path of the file in the header of from, in the ink color, with the full path as its tooltip", () => {
      // Arrange
      const from = renderInspector(FILE).section("from");

      // Act
      const { summary, summaryTitle, summaryColor } = from;

      // Assert
      expect(summary).toBe(FILE);
      expect(summaryTitle).toBe(FILE);
      expect(summaryColor).toBe("var(--jsb-ink)");
    });

    it("should say how many dependencies the file has, and what the engine decided about them, before the boxes", () => {
      // Arrange
      const from = renderInspector(FILE).section("from");

      // Act
      const { total, countTexts } = from.dependencies;

      // Assert
      expect(total).toBe("4 dependencies");
      expect(countTexts).toEqual([
        { text: "2", color: "var(--jsb-ok)" },
        { text: "1", color: "var(--jsb-bad)" },
        { text: "1 not checked", color: "var(--jsb-faint)" },
      ]);
      expect(from.parts).toEqual(["summary", "boxes"]);
    });

    it("should line up the counts with the label of the section, after its chevron", () => {
      // Arrange
      const from = renderInspector(FILE).section("from");

      // Act
      const { paddingLeft } = from.dependencies;

      // Assert
      expect(paddingLeft).toBe("20px");
    });

    it("should count the dependencies of the file in focus only", () => {
      // Arrange
      const from = renderInspector("src/index.js").section("from");

      // Act
      const { total } = from.dependencies;

      // Assert
      expect(total).toBe("1 dependency");
    });

    it("should say that they are not evaluated while the rule is off", () => {
      // Arrange
      const config = QUICK_START.config.replace(
        '"boundaries/dependencies": [2,',
        '"boundaries/dependencies": ["off",'
      );
      const from = renderInspector(FILE, {
        evaluation: evaluate({ ...QUICK_START, config }),
      }).section("from");

      // Act
      const { total, countTexts } = from.dependencies;

      // Assert
      expect(total).toBe("4 dependencies · not evaluated");
      expect(countTexts).toEqual([]);
    });

    it("should list every property of the element of the file in the box element", () => {
      // Arrange
      const from = renderInspector(FILE).section("from");

      // Act
      const { entries } = from.boxes.box("element");

      // Assert
      expect(entries).toEqual({
        types: '[ "module" ]',
        path: '"src/modules/checkout"',
        fileInternalPath: '"index.js"',
        captured: "null",
        parents: "[]",
        isIgnored: "false",
        isUnknown: "false",
      });
    });

    it("should list every property of the file in the box file", () => {
      // Arrange
      const from = renderInspector(
        "src/components/atoms/Button/Button.spec.js"
      ).section("from");

      // Act
      const { entries } = from.boxes.box("file");

      // Assert
      expect(entries).toEqual({
        categories: '[ "test" ]',
        path: '"src/components/atoms/Button/Button.spec.js"',
        captured: "null",
        isIgnored: "false",
        isUnknown: "false",
      });
    });

    it("should list every property of the module in the box module, once it is open", () => {
      // Arrange
      const from = renderInspector(FILE, {
        choices: { "from.module": true },
      }).section("from");

      // Act
      const { entries } = from.boxes.box("module");

      // Assert
      expect(entries).toEqual({
        origin: '"local"',
        source: "null",
        internalPath: "null",
      });
    });

    it("should show what the config captures from the path, the elements that contain the file and its categories, as the plugin gives them", () => {
      // Arrange
      const sketch: Sketch = {
        config: `{
          settings: {
            "boundaries/elements": [
              { type: "module", pattern: "modules/*", capture: ["name"] },
              { type: "component", pattern: "components/*", capture: ["component"] },
            ],
            "boundaries/files": [
              { category: "test", pattern: "**/*.spec.js", capture: ["base"] },
            ],
          },
          rules: {},
        }`,
        tree: [
          { path: "src/modules/a/components/b/index.spec.js", kind: "file" },
        ],
        dependencies: [],
      };
      const from = renderInspector("src/modules/a/components/b/index.spec.js", {
        evaluation: evaluate(sketch),
      }).section("from");

      // Act
      const element = from.boxes.box("element").entries;
      const file = from.boxes.box("file").entries;

      // Assert
      expect(element.captured).toBe('{ component: "b" }');
      expect(element.parents).toBe(
        '[ { types: [ "module" ], path: "src/modules/a", captured: { name: "a" } } ]'
      );
      expect(file.categories).toBe('[ "test" ]');
      expect(file.captured).toBe('{ base: "src/modules/a/components/b" }');
    });

    it("should show a file outside every element with null types and path, and as unknown", () => {
      // Arrange
      const from = renderInspector("src/index.js").section("from");

      // Act
      const { entries } = from.boxes.box("element");

      // Assert
      expect(entries).toEqual({
        types: "null",
        path: "null",
        fileInternalPath: "null",
        captured: "null",
        parents: "[]",
        isIgnored: "false",
        isUnknown: "true",
      });
    });

    it("should draw a null value apart from the others", () => {
      // Arrange
      const element = renderInspector(FILE)
        .section("from")
        .boxes.box("element");

      // Act
      const captured = element.valueColor("captured");
      const types = element.valueColor("types");
      const path = element.valueColor("path");

      // Assert
      expect(captured).toBe("var(--jsb-faint)");
      expect(types).not.toBe(captured);
      expect(path).not.toBe(captured);
    });

    it("should draw the boxes in the order of the plugin: element, file, module", () => {
      // Arrange
      const from = renderInspector(FILE).section("from");

      // Act
      const { boxNames } = from.boxes;

      // Assert
      expect(boxNames).toEqual(["element", "file", "module"]);
    });

    it("should show the path alone when the evaluation does not know the file", () => {
      // Arrange
      const inspector = renderInspector("src/removed.js");

      // Act
      const { sectionNames, rows } = inspector;

      // Assert
      expect(rows.rows).toEqual([{ label: "from", text: "src/removed.js" }]);
      expect(sectionNames).toEqual([]);
      expect(inspector.section("from").isRendered).toBe(false);
    });
  });

  describe("no dependency in focus", () => {
    it("should read a dash under to and dependency, in the faint color", () => {
      // Arrange
      const { rows } = renderInspector(FILE);

      // Act
      const { rows: texts } = rows;
      const colors = ["to", "dependency"].map((label) => rows.textColor(label));

      // Assert
      expect(texts).toEqual([
        { label: "to", text: "—" },
        { label: "dependency", text: "—" },
      ]);
      expect(colors).toEqual(["var(--jsb-faint)", "var(--jsb-faint)"]);
    });

    it("should say how to describe a dependency, in a dashed hint under them", () => {
      // Arrange
      const inspector = renderInspector(FILE);

      // Act
      const { hint, hintStyle } = inspector;

      // Assert
      expect(hint).toBe(
        "Click a line of the file to describe the dependency and the file it points to, with the properties the selectors match."
      );
      expect(hintStyle).toEqual({
        borderStyle: "dashed",
        borderRadius: "var(--jsb-radius)",
        color: "var(--jsb-muted)",
        margin: "4px 0px 0px 20px",
        padding: "8px 10px",
      });
    });

    it("should say it as well when the dependency in focus is not one of the file, such as a line the evaluation does not know yet", () => {
      // Arrange
      const inspector = renderInspector(FILE, { dependencyIndex: 9 });

      // Act
      const { sectionNames, hint } = inspector;

      // Assert
      expect(sectionNames).toEqual(["from"]);
      expect(hint).toContain("Click a line of the file");
    });
  });

  describe("a dependency to a file in focus", () => {
    it("should draw the sections from, to and dependency, in that order, with no rows or hint", () => {
      // Arrange
      const inspector = renderInspector(FILE, { dependencyIndex: BUTTON_SPEC });

      // Act
      const { sectionNames, hint } = inspector;

      // Assert
      expect(sectionNames).toEqual(["from", "to", "dependency"]);
      expect(hint).toBeNull();
      expect(inspector.rows.isRendered).toBe(false);
    });

    it("should keep describing the open file in from", () => {
      // Arrange
      const inspector = renderInspector(FILE, { dependencyIndex: BUTTON_SPEC });

      // Act
      const { summary } = inspector.section("from");

      // Assert
      expect(summary).toBe(FILE);
      expect(inspector.section("from").dependencies.total).toBe(
        "4 dependencies"
      );
    });

    it("should put the path of the file it points to in the header of to, in the ink color, with the full path as its tooltip", () => {
      // Arrange
      const to = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
      }).section("to");

      // Act
      const { summary, summaryTitle, summaryColor } = to;

      // Assert
      expect(summary).toBe("src/components/atoms/Button/Button.spec.js");
      expect(summaryTitle).toBe("src/components/atoms/Button/Button.spec.js");
      expect(summaryColor).toBe("var(--jsb-ink)");
    });

    it("should list every property of the file it points to in the boxes of to", () => {
      // Arrange
      const to = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
      }).section("to");

      // Act
      const element = to.boxes.box("element").entries;
      const file = to.boxes.box("file").entries;

      // Assert
      expect(element).toEqual({
        types: '[ "component" ]',
        path: '"src/components/atoms/Button"',
        fileInternalPath: '"Button.spec.js"',
        captured: "null",
        parents: "[]",
        isIgnored: "false",
        isUnknown: "false",
      });
      expect(file).toEqual({
        categories: '[ "test" ]',
        path: '"src/components/atoms/Button/Button.spec.js"',
        captured: "null",
        isIgnored: "false",
        isUnknown: "false",
      });
    });

    it("should list the module of the file it points to, once it is open", () => {
      // Arrange
      const to = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
        choices: { "to.module": true },
      }).section("to");

      // Act
      const { entries } = to.boxes.box("module");

      // Assert
      expect(entries).toEqual({
        origin: '"local"',
        source: "null",
        internalPath: "null",
      });
    });

    it("should put the line of the dependency in the header of dependency, in the muted color", () => {
      // Arrange
      const dependency = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
      }).section("dependency");

      // Act
      const { summary, summaryColor } = dependency;

      // Assert
      expect(summary).toBe("line 3");
      expect(summaryColor).toBe("var(--jsb-muted)");
    });

    it.each([
      [BUTTON, "src/components/atoms/Button/index.js", "line 1"],
      [FORMAT, "src/helpers/format/index.js", "line 2"],
    ])(
      "should describe the dependency at the position %i of the file, and no other",
      (dependencyIndex, target, line) => {
        // Arrange
        const inspector = renderInspector(FILE, { dependencyIndex });

        // Act
        const to = inspector.section("to").summary;
        const dependency = inspector.section("dependency").summary;

        // Assert
        expect([to, dependency]).toEqual([target, line]);
      }
    );

    it("should list kind, nodeKind, source, specifiers and relationship in one box with no name, with from and to under the relationship", () => {
      // Arrange
      const { properties } = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
      }).section("dependency");

      // Act
      const { entries } = properties;

      // Assert
      expect(entries).toEqual({
        kind: '"value"',
        nodeKind: '"import"',
        source: '"../../components/atoms/Button/Button.spec.js"',
        specifiers: '[ "renderButton" ]',
        relationship: "",
        from: "null",
        to: "null",
      });
    });

    it("should indent from and to under the relationship, and draw their null apart from the other values", () => {
      // Arrange
      const { properties } = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
      }).section("dependency");

      // Act
      const indents = ["relationship", "from", "to"].map((key) =>
        properties.keyIndent(key)
      );
      const colors = [
        properties.valueColor("kind"),
        properties.valueColor("from"),
      ];

      // Assert
      expect(indents).toEqual(["0px", "14px", "14px"]);
      expect(colors).toEqual(["var(--jsb-ink)", "var(--jsb-faint)"]);
    });

    it("should frame the properties of the dependency in a box of its own, which has no title", () => {
      // Arrange
      const dependency = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
      }).section("dependency");

      // Act
      const { frame } = dependency.properties;

      // Assert
      expect(frame.borderStyle).toBe("solid");
      expect(dependency.hasBody).toBe(true);
      expect(dependency.bodyText).not.toContain("dependency");
    });

    it("should give the relationship the values that the plugin gives it", () => {
      // Arrange
      const evaluation = describeDependency(EVALUATION, FILE, BUTTON_SPEC, {
        to: createEntityDescription(),
        dependency: {
          kind: "type",
          nodeKind: "import",
          source: "../../components/atoms/Button/Button.spec.js",
          specifiers: ["renderButton", "ButtonProps"],
          relationship: { from: "uncle", to: "nephew" },
        },
      });
      const { properties } = renderInspector(FILE, {
        evaluation,
        dependencyIndex: BUTTON_SPEC,
      }).section("dependency");

      // Act
      const { entries } = properties;

      // Assert
      expect(entries).toEqual({
        kind: '"type"',
        nodeKind: '"import"',
        source: '"../../components/atoms/Button/Button.spec.js"',
        specifiers: '[ "renderButton", "ButtonProps" ]',
        relationship: "",
        from: '"uncle"',
        to: '"nephew"',
      });
    });
  });

  describe("a dependency to an external module in focus", () => {
    it("should put the name of the module in the header of to", () => {
      // Arrange
      const to = renderInspector(FILE, { dependencyIndex: REACT }).section(
        "to"
      );

      // Act
      const { summary, summaryTitle } = to;

      // Assert
      expect(summary).toBe("react");
      expect(summaryTitle).toBe("react");
    });

    it("should list the module as external, with the name of its source, and no element or file", () => {
      // Arrange
      const to = renderInspector(FILE, {
        dependencyIndex: REACT,
        choices: { "to.module": true },
      }).section("to");

      // Act
      const element = to.boxes.box("element").entries;
      const file = to.boxes.box("file").entries;
      const moduleEntries = to.boxes.box("module").entries;

      // Assert
      expect(element).toEqual({
        types: "null",
        path: "null",
        fileInternalPath: "null",
        captured: "null",
        parents: "[]",
        isIgnored: "false",
        isUnknown: "true",
      });
      expect(file).toEqual({
        categories: "null",
        path: "null",
        captured: "null",
        isIgnored: "false",
        isUnknown: "true",
      });
      expect(moduleEntries).toEqual({
        origin: '"external"',
        source: '"react"',
        internalPath: "null",
      });
    });

    it("should put the line of the dependency in the header of dependency", () => {
      // Arrange
      const dependency = renderInspector(FILE, {
        dependencyIndex: REACT,
      }).section("dependency");

      // Act
      const { summary } = dependency;

      // Assert
      expect(summary).toBe("line 4");
    });
  });

  describe("a dependency that the plugin does not read in focus", () => {
    const NOT_READ = evaluate({
      ...QUICK_START,
      config: QUICK_START.config.replace(
        "settings: {",
        'settings: {\n    "boundaries/dependency-nodes": ["require"],'
      ),
    });

    it("should read its target and its line in rows, and keep the section from", () => {
      // Arrange
      const inspector = renderInspector(FILE, {
        evaluation: NOT_READ,
        dependencyIndex: BUTTON_SPEC,
      });

      // Act
      const { rows, sectionNames } = inspector;

      // Assert
      expect(sectionNames).toEqual(["from"]);
      expect(rows.rows).toEqual([
        { label: "to", text: "src/components/atoms/Button/Button.spec.js" },
        { label: "dependency", text: "line 3" },
      ]);
      expect(rows.textColor("to")).toBe("var(--jsb-ink)");
      expect(rows.textColor("dependency")).toBe("var(--jsb-muted)");
    });

    it("should name the external module it points to", () => {
      // Arrange
      const { rows } = renderInspector(FILE, {
        evaluation: NOT_READ,
        dependencyIndex: REACT,
      });

      // Act
      const { rows: texts } = rows;

      // Assert
      expect(texts[0]).toEqual({ label: "to", text: "react" });
    });

    it("should say in a note that the plugin does not read it, instead of the properties of to and dependency", () => {
      // Arrange
      const inspector = renderInspector(FILE, {
        evaluation: NOT_READ,
        dependencyIndex: BUTTON_SPEC,
      });

      // Act
      const { note } = inspector;

      // Assert
      expect(note.role).toBe("note");
      expect(note.text).toBe(
        "Not checked: the plugin never reads this kind of statement, because boundaries/dependency-nodes leaves its syntax out."
      );
      expect(inspector.hint).toBeNull();
      expect(inspector.section("to").isRendered).toBe(false);
      expect(inspector.section("dependency").isRendered).toBe(false);
    });

    it("should place the note under the rows, as it places the hint", () => {
      // Arrange
      const { note } = renderInspector(FILE, {
        evaluation: NOT_READ,
        dependencyIndex: BUTTON_SPEC,
      });

      // Act
      const { margin } = note;

      // Assert
      expect(margin).toBe("4px 0px 0px 20px");
    });

    it("should draw no note for a dependency that the plugin reads", () => {
      // Arrange
      const inspector = renderInspector(FILE, { dependencyIndex: BUTTON_SPEC });

      // Act
      const { note } = inspector;

      // Assert
      expect(note.isRendered).toBe(false);
    });
  });

  describe("what is open", () => {
    /** Whether each box of the inspector is open, by place. */
    type BoxStates = Record<
      | "from.element"
      | "from.file"
      | "from.module"
      | "to.element"
      | "to.file"
      | "to.module",
      boolean
    >;

    /**
     * Reads whether each box of the inspector is open.
     * @param inspector The page object of the inspector.
     * @returns Whether each box is open, by place.
     */
    function readBoxes(inspector: FileInspectorPom): BoxStates {
      const [from, to] = [inspector.section("from"), inspector.section("to")];

      return {
        "from.element": from.boxes.box("element").isOpen,
        "from.file": from.boxes.box("file").isOpen,
        "from.module": from.boxes.box("module").isOpen,
        "to.element": to.boxes.box("element").isOpen,
        "to.file": to.boxes.box("file").isOpen,
        "to.module": to.boxes.box("module").isOpen,
      };
    }

    it("should open every section and every box but the two of the module, until the user chooses", () => {
      // Arrange
      const inspector = renderInspector(FILE, { dependencyIndex: BUTTON_SPEC });

      // Act
      const sections = ["from", "to", "dependency"].map(
        (sectionName) => inspector.section(sectionName).isOpen
      );
      const boxes = readBoxes(inspector);

      // Assert
      expect(sections).toEqual([true, true, true]);
      expect(boxes).toEqual({
        "from.element": true,
        "from.file": true,
        "from.module": false,
        "to.element": true,
        "to.file": true,
        "to.module": false,
      });
    });

    it("should say that each section is expanded, and control the body that holds what it folds", () => {
      // Arrange
      const inspector = renderInspector(FILE, { dependencyIndex: BUTTON_SPEC });

      // Act
      const sections = ["from", "to", "dependency"].map((sectionName) =>
        inspector.section(sectionName)
      );

      // Assert
      expect(sections.map(({ isOpen }) => isOpen)).toEqual([true, true, true]);
      expect(sections.map(({ bodyId }) => bodyId)).not.toContain(null);
    });

    it("should say that each box is expanded, and control the body that lists its properties, while it is open", () => {
      // Arrange
      const from = renderInspector(FILE).section("from");

      // Act
      const { isOpen, bodyId } = from.boxes.box("file");

      // Assert
      expect(isOpen).toBe(true);
      expect(bodyId).not.toBeNull();
    });

    it("should fold the section from, and keep its header, when the user folded it", () => {
      // Arrange
      const inspector = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
        choices: { from: false },
      });

      // Act
      const from = inspector.section("from");
      const to = inspector.section("to");

      // Assert
      expect(from.isOpen).toBe(false);
      expect(from.hasBody).toBe(false);
      expect(from.summary).toBe(FILE);
      expect(to.isOpen).toBe(true);
      expect(to.hasBody).toBe(true);
    });

    it("should fold the section to without folding the others", () => {
      // Arrange
      const inspector = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
        choices: { to: false },
      });

      // Act
      const states = ["from", "to", "dependency"].map(
        (sectionName) => inspector.section(sectionName).isOpen
      );

      // Assert
      expect(states).toEqual([true, false, true]);
    });

    it("should fold the section dependency, and open the boxes that the user chose, which are not the default", () => {
      // Arrange
      const inspector = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
        choices: {
          dependency: false,
          "from.module": true,
          "to.element": false,
        },
      });

      // Act
      const dependency = inspector.section("dependency");
      const boxes = readBoxes(inspector);

      // Assert
      expect(dependency.isOpen).toBe(false);
      expect(dependency.hasBody).toBe(false);
      expect(boxes["from.module"]).toBe(true);
      expect(boxes["to.element"]).toBe(false);
      expect(boxes["to.module"]).toBe(false);
    });

    it("should show the first property after the name of a folded box, in the muted color", () => {
      // Arrange
      const inspector = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
        choices: { "from.element": false, "to.file": false },
      });

      // Act
      const fromElement = inspector.section("from").boxes.box("element");
      const fromModule = inspector.section("from").boxes.box("module");
      const toFile = inspector.section("to").boxes.box("file");

      // Assert
      expect(fromElement.summary).toBe('[ "module" ]');
      expect(fromElement.summaryColor).toBe("var(--jsb-muted)");
      expect(fromModule.summary).toBe('"local"');
      expect(toFile.summary).toBe('[ "test" ]');
    });

    it("should show null as the digest of a folded file box that no category matches", () => {
      // Arrange
      const from = renderInspector(FILE, {
        choices: { "from.file": false },
      }).section("from");

      // Act
      const { summary } = from.boxes.box("file");

      // Assert
      expect(summary).toBe("null");
    });

    it("should show the origin as the digest of the folded module of an external module", () => {
      // Arrange
      const to = renderInspector(FILE, { dependencyIndex: REACT }).section(
        "to"
      );

      // Act
      const { summary } = to.boxes.box("module");

      // Assert
      expect(summary).toBe('"external"');
    });

    it("should call onToggle with the place of each header that is pressed", () => {
      // Arrange
      const onToggle = jest.fn<void, [InspectorPlace]>();
      const inspector = renderInspector(FILE, {
        dependencyIndex: BUTTON_SPEC,
        onToggle,
      });

      // Act
      inspector.section("from").toggle();
      inspector.section("to").toggle();
      inspector.section("dependency").toggle();
      inspector.section("from").boxes.box("element").toggle();
      inspector.section("to").boxes.box("file").toggle();
      inspector.section("to").boxes.box("module").toggle();

      // Assert
      expect(onToggle.mock.calls).toEqual([
        ["from"],
        ["to"],
        ["dependency"],
        ["from.element"],
        ["to.file"],
        ["to.module"],
      ]);
    });
  });

  describe("the spacing of the parts", () => {
    it("should pad the parts of the sketch and separate each one from the one before by a line, except the first, which starts where the content does", () => {
      // Arrange
      const inspector = renderInspector(FILE, { dependencyIndex: BUTTON_SPEC });

      // Act
      const spacing = inspector.partSpacing;

      // Assert
      expect(spacing).toHaveLength(3);
      expect(spacing[0]).toMatchObject({
        paddingTop: "0px",
        paddingBottom: "6px",
      });
      expect(spacing[0].borderTopStyle).not.toBe("solid");
      expect(spacing.slice(1)).toEqual([
        { paddingTop: "6px", paddingBottom: "6px", borderTopStyle: "solid" },
        { paddingTop: "6px", paddingBottom: "6px", borderTopStyle: "solid" },
      ]);
    });

    it("should separate the rows with nothing to fold from from the same way", () => {
      // Arrange
      const inspector = renderInspector(FILE);

      // Act
      const spacing = inspector.partSpacing;

      // Assert
      expect(spacing).toHaveLength(2);
      expect(spacing[1]).toEqual({
        paddingTop: "6px",
        paddingBottom: "6px",
        borderTopStyle: "solid",
      });
    });
  });
});
