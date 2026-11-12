import { normalizeConfig } from "@boundaries/config";
import type { SettingsNormalized } from "@boundaries/config";

import {
  getAdditionalNodesProblems,
  getReadNodeKinds,
} from "./dependencyNodes";
import { parseConfig } from "./parseConfig";
import type { ConfigRead } from "./parseConfig.types";

/**
 * Reads a config text as one JSON5 object and normalizes its settings, as the engine does.
 * @param text The config text.
 * @returns The config as written and its normalized settings.
 */
function analyze(text: string): {
  config: ConfigRead;
  settings: SettingsNormalized;
} {
  const config = parseConfig(text);
  if (!config.parsed) {
    throw new Error("The config text should be one JSON5 object");
  }
  const { value } = normalizeConfig({
    settings: config.value.settings,
    rules: {},
  });
  return { config, settings: value.settings };
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

/**
 * Lists the node kinds that are read, sorted.
 * @param text The config text.
 * @returns The names of the node kinds.
 */
function readKindsOf(text: string): string[] {
  return [...getReadNodeKinds(analyze(text).settings)].sort((a, b) =>
    a.localeCompare(b)
  );
}

describe("DependencyNodes", () => {
  describe("getReadNodeKinds", () => {
    it("should read the four kinds while the setting is not written", () => {
      // Act
      const kinds = readKindsOf(configWith());

      // Assert
      expect(kinds).toEqual(["dynamic-import", "export", "import", "require"]);
    });

    it.each([
      ['["import"]', ["import"]],
      ['["require", "export"]', ["export", "require"]],
      [
        '["dynamic-import", "import", "require", "export"]',
        ["dynamic-import", "export", "import", "require"],
      ],
      ["[]", []],
    ])("should read only the kinds of the setting %s", (nodes, expected) => {
      // Act
      const kinds = readKindsOf(configWith(nodes));

      // Assert
      expect(kinds).toEqual(expected);
    });

    it.each([
      [
        "import",
        "ImportDeclaration:not([importKind=type]) > Literal",
        "import",
      ],
      [
        "import, by its type selector",
        "ImportDeclaration[importKind=type] > Literal",
        "import",
      ],
      [
        "export",
        "ExportNamedDeclaration:not([exportKind=type]) > Literal",
        "export",
      ],
      ["require", "CallExpression[callee.name=require] > Literal", "require"],
      [
        "require, by a selector that is not the first of the kind",
        "TSImportEqualsDeclaration[importKind=type] > TSExternalModuleReference > Literal",
        "require",
      ],
      ["dynamic-import", "ImportExpression > Literal", "dynamic-import"],
    ])(
      "should read the kind of a built-in selector that an additional node repeats: %s",
      (_title, selector, nodeName) => {
        // Arrange
        const additional = `[{ selector: ${JSON.stringify(selector)}, kind: "value", name: "${nodeName}" }]`;

        // Act
        const kinds = readKindsOf(configWith("[]", additional));

        // Assert
        expect(kinds).toEqual([nodeName]);
      }
    );

    it("should not read a kind through a selector of an additional node that is not a built-in one, even when it has the name of the kind", () => {
      // Arrange
      const additional = `[{ selector: "CallExpression[callee.name='jest.mock'] > Literal", kind: "value", name: "require" }]`;

      // Act
      const kinds = readKindsOf(configWith('["import"]', additional));

      // Assert
      expect(kinds).toEqual(["import"]);
    });

    it("should not read a kind through a built-in selector that an additional node gives another name", () => {
      // Arrange
      const additional = `[{ selector: "CallExpression[callee.name=require] > Literal", kind: "value", name: "custom" }]`;

      // Act
      const kinds = readKindsOf(configWith("[]", additional));

      // Assert
      expect(kinds).toEqual([]);
    });

    it("should not read a kind through a built-in selector that an additional node gives no name", () => {
      // Arrange
      const additional = `[{ selector: "CallExpression[callee.name=require] > Literal", kind: "value" }]`;

      // Act
      const kinds = readKindsOf(configWith("[]", additional));

      // Assert
      expect(kinds).toEqual([]);
    });

    it("should not read a kind through the selector of another kind that an additional node names after this kind", () => {
      // Arrange
      const additional = `[{ selector: "ImportExpression > Literal", kind: "value", name: "import" }]`;

      // Act
      const kinds = readKindsOf(configWith("[]", additional));

      // Assert
      expect(kinds).toEqual([]);
    });
  });

  describe("getAdditionalNodesProblems", () => {
    const WARNING = {
      level: "warning",
      title:
        'The playground does not run the selectors of "boundaries/additional-dependency-nodes".',
      detail:
        'A statement that only one of them reads is not checked as ESLint checks it: the playground reads a statement only through the built-in selectors of "boundaries/dependency-nodes".',
      links: [],
      path: ["settings", "boundaries/additional-dependency-nodes"],
      source: "config",
    };

    it("should warn at the setting when an additional node is valid", () => {
      // Arrange
      const additional =
        '[{ selector: "ImportDeclaration > Literal", kind: "value", name: "custom" }]';
      const text = configWith(undefined, additional);
      const { config, settings } = analyze(text);

      // Act
      const problems = getAdditionalNodesProblems(config, settings);

      // Assert
      expect(problems).toEqual([
        { ...WARNING, range: expect.objectContaining({ line: 4, column: 47 }) },
      ]);
      expect(text.slice(problems[0].range.from, problems[0].range.to)).toBe(
        additional
      );
    });

    it("should warn once when several additional nodes are valid", () => {
      // Arrange
      const additional =
        '[{ selector: "A > Literal", kind: "value", name: "a" }, { selector: "B > Literal", kind: "type" }]';
      const { config, settings } = analyze(
        configWith('["import"]', additional)
      );

      // Act
      const problems = getAdditionalNodesProblems(config, settings);

      // Assert
      expect(problems).toHaveLength(1);
    });

    it("should warn when only one of the additional nodes is valid", () => {
      // Arrange
      const additional =
        '[{ kind: "value" }, { selector: "A > Literal", kind: "value", name: "a" }, "ImportDeclaration"]';
      const { config, settings } = analyze(configWith(undefined, additional));

      // Act
      const problems = getAdditionalNodesProblems(config, settings);

      // Assert
      expect(problems).toEqual([
        { ...WARNING, range: expect.objectContaining({ line: 4 }) },
      ]);
    });

    it.each([
      ["the setting is not written", undefined],
      ["the setting is empty", "[]"],
      [
        "every additional node is invalid",
        '[{ kind: "value" }, "ImportDeclaration", 3]',
      ],
      [
        "the setting is not a list",
        '{ selector: "A > Literal", kind: "value" }',
      ],
    ])("should not warn when %s", (_title, additional) => {
      // Arrange
      const { config, settings } = analyze(configWith(undefined, additional));

      // Act
      const problems = getAdditionalNodesProblems(config, settings);

      // Assert
      expect(problems).toEqual([]);
    });

    it("should warn about an additional node that repeats a built-in selector, which is a valid node that the config keeps", () => {
      // Arrange
      const additional =
        '[{ selector: "CallExpression[callee.name=require] > Literal", kind: "value", name: "require" }]';
      const { config, settings } = analyze(configWith("[]", additional));

      // Act
      const problems = getAdditionalNodesProblems(config, settings);

      // Assert
      expect(problems).toEqual([
        { ...WARNING, range: expect.objectContaining({ line: 5 }) },
      ]);
    });

    it("should warn about an additional node that repeats a built-in selector that the setting selects too", () => {
      // Arrange
      const additional =
        '[{ selector: "ImportDeclaration:not([importKind=type]) > Literal", kind: "value", name: "import" }]';
      const { config, settings } = analyze(
        configWith('["import"]', additional)
      );

      // Act
      const problems = getAdditionalNodesProblems(config, settings);

      // Assert
      expect(problems).toHaveLength(1);
    });

    it.each([
      ["no additional node", undefined],
      ["only invalid additional nodes", '[{ kind: "value" }]'],
    ])(
      "should not warn when boundaries/dependency-nodes selects the nodes and there is %s",
      (_title, additional) => {
        // Arrange
        const { config, settings } = analyze(
          configWith('["import"]', additional)
        );

        // Act
        const problems = getAdditionalNodesProblems(config, settings);

        // Assert
        expect(problems).toEqual([]);
      }
    );

    it("should not warn when the settings are not an object", () => {
      // Arrange
      const { config, settings } = analyze("{ settings: [] }");

      // Act
      const problems = getAdditionalNodesProblems(config, settings);

      // Assert
      expect(problems).toEqual([]);
    });
  });
});
