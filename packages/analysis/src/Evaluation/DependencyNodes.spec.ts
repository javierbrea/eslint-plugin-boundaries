import { normalizeConfig } from "@boundaries/config";

import { getReadNodeKinds } from "./DependencyNodes";

/**
 * Writes settings with the nodes settings that are given.
 * @param nodes The `boundaries/dependency-nodes` setting, or `undefined` to leave it out.
 * @param additional The `boundaries/additional-dependency-nodes` setting, or `undefined` to leave it out.
 * @returns The settings as written.
 */
function settingsWith(
  nodes?: unknown,
  additional?: unknown
): Record<string, unknown> {
  return {
    "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
    ...(nodes === undefined ? {} : { "boundaries/dependency-nodes": nodes }),
    ...(additional === undefined
      ? {}
      : { "boundaries/additional-dependency-nodes": additional }),
  };
}

/**
 * Lists the node kinds that are read with some settings, normalized as the analysis normalizes them, sorted.
 * @param settings The settings as written.
 * @returns The names of the node kinds.
 */
function readKindsOf(settings: Record<string, unknown>): string[] {
  const { value } = normalizeConfig({ settings, rules: {} });
  return [...getReadNodeKinds(value.settings)].sort((a, b) =>
    a.localeCompare(b)
  );
}

describe("DependencyNodes", () => {
  describe("getReadNodeKinds", () => {
    it("should read the four kinds while the setting is not written", () => {
      // Act
      const kinds = readKindsOf(settingsWith());

      // Assert
      expect(kinds).toEqual(["dynamic-import", "export", "import", "require"]);
    });

    it.each([
      [["import"], ["import"]],
      [
        ["require", "export"],
        ["export", "require"],
      ],
      [
        ["dynamic-import", "import", "require", "export"],
        ["dynamic-import", "export", "import", "require"],
      ],
      [[], []],
    ])("should read only the kinds of the setting %j", (nodes, expected) => {
      // Act
      const kinds = readKindsOf(settingsWith(nodes));

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
        const additional = [{ selector, kind: "value", name: nodeName }];

        // Act
        const kinds = readKindsOf(settingsWith([], additional));

        // Assert
        expect(kinds).toEqual([nodeName]);
      }
    );

    it("should not read a kind through a selector of an additional node that is not a built-in one, even when it has the name of the kind", () => {
      // Arrange
      const additional = [
        {
          selector: "CallExpression[callee.name='jest.mock'] > Literal",
          kind: "value",
          name: "require",
        },
      ];

      // Act
      const kinds = readKindsOf(settingsWith(["import"], additional));

      // Assert
      expect(kinds).toEqual(["import"]);
    });

    it("should not read a kind through a built-in selector that an additional node gives another name", () => {
      // Arrange
      const additional = [
        {
          selector: "CallExpression[callee.name=require] > Literal",
          kind: "value",
          name: "custom",
        },
      ];

      // Act
      const kinds = readKindsOf(settingsWith([], additional));

      // Assert
      expect(kinds).toEqual([]);
    });

    it("should not read a kind through a built-in selector that an additional node gives no name", () => {
      // Arrange
      const additional = [
        {
          selector: "CallExpression[callee.name=require] > Literal",
          kind: "value",
        },
      ];

      // Act
      const kinds = readKindsOf(settingsWith([], additional));

      // Assert
      expect(kinds).toEqual([]);
    });

    it("should not read a kind through the selector of another kind that an additional node names after this kind", () => {
      // Arrange
      const additional = [
        {
          selector: "ImportExpression > Literal",
          kind: "value",
          name: "import",
        },
      ];

      // Act
      const kinds = readKindsOf(settingsWith([], additional));

      // Assert
      expect(kinds).toEqual([]);
    });
  });
});
