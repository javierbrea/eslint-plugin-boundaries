import { getAdditionalNodesProblems } from "./dependencyNodes";
import { parseConfig } from "./parseConfig";
import type { ConfigRead } from "./parseConfig.types";

/**
 * Reads a config text as one JSON5 object, as the engine does.
 * @param text The config text.
 * @returns The config as written.
 */
function read(text: string): ConfigRead {
  const config = parseConfig(text);
  if (!config.parsed) {
    throw new Error("The config text should be one JSON5 object");
  }
  return config;
}

/**
 * Writes a config text with the nodes settings that are given.
 * @param nodes The text of the `boundaries/dependency-nodes` setting, or `undefined` to leave it out.
 * @param additional The text of the `boundaries/additional-dependency-nodes` setting, or `undefined` to leave it out.
 * @returns The config text.
 */
function configWith(nodes?: string, additional?: string): string {
  return `{
  settings: {
    "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],${
      nodes === undefined
        ? ""
        : `\n    "boundaries/dependency-nodes": ${nodes},`
    }${
      additional === undefined
        ? ""
        : `\n    "boundaries/additional-dependency-nodes": ${additional},`
    }
  },
}`;
}

/** Additional nodes with a selector that is not built-in, which the analysis does not read as ESLint does */
const CUSTOM_SELECTOR_NODES =
  '[{ selector: "ImportDeclaration > Literal", kind: "value", name: "custom" }]';

/** Additional nodes that repeat a built-in selector with its name and kind, which the analysis reads as ESLint does */
const BUILT_IN_SELECTOR_NODES =
  '[{ selector: "ImportDeclaration:not([importKind=type]) > Literal", kind: "value", name: "import" }]';

describe("DependencyNodes", () => {
  describe("getAdditionalNodesProblems", () => {
    const WARNING = {
      level: "warning",
      title:
        'The playground may not read statements as ESLint does with "boundaries/additional-dependency-nodes".',
      detail:
        "It runs only the built-in selectors, and reads every statement of a syntax and import kind through one node, so a statement that another selector reads, or that the built-in selectors of its syntax and import kind read through different nodes or leave out, is not checked as ESLint checks it.",
      links: [],
      path: ["settings", "boundaries/additional-dependency-nodes"],
      source: "config",
    };

    it("should warn once at the setting when the analysis does not read the dependency nodes as ESLint does", () => {
      // Arrange
      const text = configWith(undefined, CUSTOM_SELECTOR_NODES);

      // Act
      const problems = getAdditionalNodesProblems(read(text), {
        dependencyNodesReadAsESLint: false,
      });

      // Assert
      expect(problems).toEqual([
        { ...WARNING, range: expect.objectContaining({ line: 4, column: 47 }) },
      ]);
      expect(text.slice(problems[0].range.from, problems[0].range.to)).toBe(
        CUSTOM_SELECTOR_NODES
      );
    });

    it("should place the warning at the setting after boundaries/dependency-nodes when the config writes both", () => {
      // Arrange
      const text = configWith('["export"]', CUSTOM_SELECTOR_NODES);

      // Act
      const problems = getAdditionalNodesProblems(read(text), {
        dependencyNodesReadAsESLint: false,
      });

      // Assert
      expect(problems).toEqual([
        { ...WARNING, range: expect.objectContaining({ line: 5 }) },
      ]);
      expect(text.slice(problems[0].range.from, problems[0].range.to)).toBe(
        CUSTOM_SELECTOR_NODES
      );
    });

    it("should warn whatever the nodes are when the analysis says that it does not read them as ESLint does, because the analysis decides it", () => {
      // Arrange
      const text = configWith("[]", BUILT_IN_SELECTOR_NODES);

      // Act
      const problems = getAdditionalNodesProblems(read(text), {
        dependencyNodesReadAsESLint: false,
      });

      // Assert
      expect(problems).toEqual([
        { ...WARNING, range: expect.objectContaining({ line: 5 }) },
      ]);
    });

    it.each([
      ["nodes with a selector that is not built-in", CUSTOM_SELECTOR_NODES],
      ["nodes that repeat a built-in selector", BUILT_IN_SELECTOR_NODES],
      ["no additional nodes", undefined],
    ])(
      "should not warn when the analysis reads the dependency nodes as ESLint does, whatever the config writes, such as %s",
      (_title, additional) => {
        // Arrange
        const text = configWith(undefined, additional);

        // Act
        const problems = getAdditionalNodesProblems(read(text), {
          dependencyNodesReadAsESLint: true,
        });

        // Assert
        expect(problems).toEqual([]);
      }
    );
  });
});
