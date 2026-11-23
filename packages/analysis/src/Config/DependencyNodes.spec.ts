import { SETTINGS, normalizeConfig } from "@boundaries/config";

import {
  areDependencyNodesReadAsESLint,
  getReadNodes,
} from "./DependencyNodes";
import type { ReadNode } from "./DependencyNodes.types";

/** The built-in selector of `import x from 'source'` */
const IMPORT_VALUE = "ImportDeclaration:not([importKind=type]) > Literal";

/** The built-in selector of `import type x from 'source'` */
const IMPORT_TYPE = "ImportDeclaration[importKind=type] > Literal";

/** The built-in selector of `require('source')`, the first of the value selectors of `require` */
const REQUIRE_CALL = "CallExpression[callee.name=require] > Literal";

/** The built-in selector of `import x = require('source')`, the last of the value selectors of `require` */
const REQUIRE_EQUALS =
  "TSImportEqualsDeclaration:not([importKind=type]) > TSExternalModuleReference > Literal";

/** The built-in selector of `export { x } from 'source'` */
const EXPORT_NAMED_VALUE =
  "ExportNamedDeclaration:not([exportKind=type]) > Literal";

/** The built-in selector of `export * from 'source'` */
const EXPORT_ALL_VALUE =
  "ExportAllDeclaration:not([exportKind=type]) > Literal";

/** The other import kind of each kind of the built-in nodes, to give an additional node with a built-in selector a kind that its built-in node does not have */
const OTHER_KIND = { value: "type", type: "value" } as const;

/** Each built-in node of `@boundaries/config`, with the number of built-in selectors of its syntax and its import kind, its own included */
const BUILT_IN_NODES = Object.values(SETTINGS.DEFAULT_DEPENDENCY_NODES).flatMap(
  (builtIns) =>
    builtIns.map((node) => ({
      node,
      selectorsOfItsKind: builtIns.filter(({ kind }) => kind === node.kind)
        .length,
    }))
);

/** The built-in nodes of each syntax and each import kind, in the order of `DEFAULT_DEPENDENCY_NODES` */
const BUILT_IN_NODES_BY_SYNTAX_AND_KIND = Object.entries(
  SETTINGS.DEFAULT_DEPENDENCY_NODES
).flatMap(([syntax, builtIns]) =>
  (["value", "type"] as const).map((kind) => ({
    syntax,
    kind,
    nodes: builtIns.filter((node) => node.kind === kind),
  }))
);

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
 * Lists the nodes that read each syntax and each import kind with some settings, normalized as the analysis normalizes them.
 * @param settings The settings as written.
 * @returns For each syntax that is read, by the key of its built-in nodes, the node of each import kind that is read.
 */
function readNodesOf(
  settings: Record<string, unknown>
): Record<string, Record<string, ReadNode>> {
  const { value } = normalizeConfig({ settings, rules: {} });
  return Object.fromEntries(
    [...getReadNodes(value.settings)].map(([syntax, byImportKind]) => [
      syntax,
      Object.fromEntries(byImportKind),
    ])
  );
}

/**
 * Tells whether the analysis reads the dependency nodes of some settings as ESLint does, normalized as the analysis normalizes them.
 * @param settings The settings as written, which may be no object.
 * @returns What `areDependencyNodesReadAsESLint` says of the normalized settings.
 */
function isReadAsESLint(settings: unknown): boolean {
  const { value } = normalizeConfig({ settings, rules: {} });
  return areDependencyNodesReadAsESLint(value.settings);
}

/**
 * Writes the nodes that the built-in selectors of a syntax give, which read both import kinds.
 * @param name The name of the built-in nodes of the syntax.
 * @returns The node of each import kind, with the name of the syntax and the kind of the selector.
 */
function builtInNodes(name: string): Record<string, ReadNode> {
  return {
    value: { name, kind: "value" },
    type: { name, kind: "type" },
  };
}

describe("DependencyNodes", () => {
  describe("getReadNodes", () => {
    it("should read both import kinds of the four syntaxes, with the built-in nodes, while the setting is not written", () => {
      // Act
      const readNodes = readNodesOf(settingsWith());

      // Assert
      expect(readNodes).toStrictEqual({
        import: builtInNodes("import"),
        export: builtInNodes("export"),
        require: builtInNodes("require"),
        "dynamic-import": builtInNodes("dynamic-import"),
      });
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
    ])(
      "should read both import kinds of only the syntaxes of the setting %j",
      (nodes, expected) => {
        // Act
        const readNodes = readNodesOf(settingsWith(nodes));

        // Assert
        expect(readNodes).toStrictEqual(
          Object.fromEntries(
            expected.map((syntax) => [syntax, builtInNodes(syntax)])
          )
        );
      }
    );

    it.each([
      ["import", IMPORT_VALUE, "import", "value"],
      ["import, by its type selector", IMPORT_TYPE, "import", "type"],
      [
        "export, by a selector that is not the first of its value selectors",
        "ExportNamedDeclaration:not([exportKind=type]) > Literal",
        "export",
        "value",
      ],
      ["require", REQUIRE_CALL, "require", "value"],
      [
        "require, by a value selector that is not the first of the syntax",
        REQUIRE_EQUALS,
        "require",
        "value",
      ],
      [
        "require, by a selector that is not the first of the syntax",
        "TSImportEqualsDeclaration[importKind=type] > TSExternalModuleReference > Literal",
        "require",
        "type",
      ],
      [
        "dynamic-import",
        "ImportExpression > Literal",
        "dynamic-import",
        "value",
      ],
    ])(
      "should read only the import kind of a built-in selector that an additional node repeats, through that node: %s",
      (_title, selector, syntax, importKind) => {
        // Arrange
        const additional = [{ selector, kind: "value", name: syntax }];

        // Act
        const readNodes = readNodesOf(settingsWith([], additional));

        // Assert
        expect(readNodes).toStrictEqual({
          [syntax]: { [importKind]: { name: syntax, kind: "value" } },
        });
      }
    );

    it("should not read a syntax through a selector of an additional node that is not a built-in one, even when it has the name of the syntax", () => {
      // Arrange
      const additional = [
        {
          selector: "CallExpression[callee.name='jest.mock'] > Literal",
          kind: "value",
          name: "require",
        },
      ];

      // Act
      const readNodes = readNodesOf(settingsWith(["import"], additional));

      // Assert
      expect(readNodes).toStrictEqual({ import: builtInNodes("import") });
    });

    it("should read nothing through a selector of an additional node that is not a built-in one when the setting is empty", () => {
      // Arrange
      const additional = [
        {
          selector: "ImportDeclaration > Literal",
          kind: "value",
          name: "import",
        },
      ];

      // Act
      const readNodes = readNodesOf(settingsWith([], additional));

      // Assert
      expect(readNodes).toStrictEqual({});
    });

    it.each<[string, Record<string, unknown>, ReadNode]>([
      [
        "another name",
        { kind: "value", name: "custom" },
        { name: "custom", kind: "value" },
      ],
      ["no name", { kind: "value" }, { name: undefined, kind: "value" }],
      [
        "the kind type",
        { kind: "type", name: "require" },
        { name: "require", kind: "type" },
      ],
      [
        "the kind typeof",
        { kind: "typeof", name: "require" },
        { name: "require", kind: "typeof" },
      ],
      ["no kind", { name: "require" }, { name: "require", kind: undefined }],
    ])(
      "should read a syntax through a built-in selector that an additional node gives %s, with the name and the kind of that node",
      (_title, node, expected) => {
        // Arrange
        const additional = [{ selector: REQUIRE_CALL, ...node }];

        // Act
        const readNodes = readNodesOf(settingsWith([], additional));

        // Assert
        expect(readNodes).toStrictEqual({ require: { value: expected } });
      }
    );

    it("should read a syntax through the selector of another syntax that an additional node names after the first one, as the other syntax", () => {
      // Arrange
      const additional = [
        {
          selector: "ImportExpression > Literal",
          kind: "value",
          name: "import",
        },
      ];

      // Act
      const readNodes = readNodesOf(settingsWith([], additional));

      // Assert
      expect(readNodes).toStrictEqual({
        "dynamic-import": { value: { name: "import", kind: "value" } },
      });
    });

    it("should read an import kind through an additional node that repeats its built-in selector, which replaces the built-in node, and the other import kind through the built-in node", () => {
      // Arrange
      const additional = [
        { selector: IMPORT_VALUE, kind: "type", name: "custom" },
      ];

      // Act
      const readNodes = readNodesOf(settingsWith(["import"], additional));

      // Assert
      expect(readNodes).toStrictEqual({
        import: {
          value: { name: "custom", kind: "type" },
          type: { name: "import", kind: "type" },
        },
      });
    });

    it("should read through the last of two additional nodes with the same selector", () => {
      // Arrange
      const additional = [
        { selector: IMPORT_TYPE, kind: "type", name: "first" },
        { selector: IMPORT_TYPE, kind: "value", name: "last" },
      ];

      // Act
      const readNodes = readNodesOf(settingsWith([], additional));

      // Assert
      expect(readNodes).toStrictEqual({
        import: { type: { name: "last", kind: "value" } },
      });
    });

    it("should read through the node of the first built-in selector of the syntax and the import kind when the nodes of two of them disagree, whatever the order of the nodes", () => {
      // Arrange
      const additional = [
        { selector: REQUIRE_EQUALS, kind: "value", name: "equals" },
        { selector: REQUIRE_CALL, kind: "value", name: "call" },
      ];

      // Act
      const readNodes = readNodesOf(settingsWith([], additional));

      // Assert
      expect(readNodes).toStrictEqual({
        require: { value: { name: "call", kind: "value" } },
      });
    });

    it("should read through a built-in node of the first selector rather than an additional node of a later selector of the same syntax and import kind", () => {
      // Arrange
      const additional = [
        { selector: REQUIRE_EQUALS, kind: "type", name: "equals" },
      ];

      // Act
      const readNodes = readNodesOf(settingsWith(["require"], additional));

      // Assert
      expect(readNodes).toStrictEqual({ require: builtInNodes("require") });
    });
  });

  describe("areDependencyNodesReadAsESLint", () => {
    it("should be false when a valid additional node has a selector that is not built-in", () => {
      // Arrange
      const additional = [
        {
          selector: "ImportDeclaration > Literal",
          kind: "value",
          name: "custom",
        },
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith(undefined, additional));

      // Assert
      expect(readAsESLint).toBe(false);
    });

    it("should be false when several valid additional nodes have selectors that are not built-in", () => {
      // Arrange
      const additional = [
        { selector: "A > Literal", kind: "value", name: "a" },
        { selector: "B > Literal", kind: "type" },
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith(["import"], additional));

      // Assert
      expect(readAsESLint).toBe(false);
    });

    it("should be false when only one of the additional nodes is valid, and its selector is not built-in", () => {
      // Arrange
      const additional = [
        { kind: "value" },
        { selector: "A > Literal", kind: "value", name: "a" },
        "ImportDeclaration",
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith(undefined, additional));

      // Assert
      expect(readAsESLint).toBe(false);
    });

    it.each<[string, unknown]>([
      ["the setting is not written", undefined],
      ["the setting is empty", []],
      [
        "every additional node is invalid",
        [{ kind: "value" }, "ImportDeclaration", 3],
      ],
      ["the setting is not a list", { selector: "A > Literal", kind: "value" }],
      [
        "every additional node with a selector that is not built-in is invalid",
        [
          { selector: "A > Literal", kind: "other" },
          { selector: "B > Literal", kind: "value", name: 3 },
        ],
      ],
    ])("should be true when %s", (_title, additional) => {
      // Act
      const readAsESLint = isReadAsESLint(settingsWith(undefined, additional));

      // Assert
      expect(readAsESLint).toBe(true);
    });

    it("should be true when an additional node repeats a built-in selector that the setting selects too", () => {
      // Arrange
      const additional = [
        { selector: IMPORT_VALUE, kind: "value", name: "import" },
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith(["import"], additional));

      // Assert
      expect(readAsESLint).toBe(true);
    });

    it.each<[string, unknown[]]>([
      ...BUILT_IN_NODES.filter(
        ({ selectorsOfItsKind }) => selectorsOfItsKind === 1
      ).map(({ node: { selector, kind } }): [string, unknown[]] => [
        `the built-in selector ${selector} of the kind ${kind}, the only one of its syntax and import kind, with another name and the other kind`,
        [{ selector, kind: OTHER_KIND[kind], name: "custom" }],
      ]),
      [
        "the only built-in selector of its syntax and import kind, of several syntaxes, with other names and kinds",
        [
          { selector: IMPORT_TYPE, kind: "value", name: "custom" },
          { selector: IMPORT_VALUE, kind: "type", name: "other" },
          {
            selector:
              ":matches(TSImportType > Literal, TSImportType > TSLiteralType > Literal)",
            kind: "value",
            name: "dynamic-import",
          },
          {
            selector:
              "TSImportEqualsDeclaration[importKind=type] > TSExternalModuleReference > Literal",
            kind: "value",
            name: "custom",
          },
        ],
      ],
    ])(
      "should be true when every additional node has %s",
      (_title, additional) => {
        // Act
        const readAsESLint = isReadAsESLint(settingsWith([], additional));

        // Assert
        expect(readAsESLint).toBe(true);
      }
    );

    it.each<[string, unknown[]]>([
      ...BUILT_IN_NODES.filter(
        ({ selectorsOfItsKind }) => selectorsOfItsKind > 1
      ).map(({ node: { selector, kind } }): [string, unknown[]] => [
        `the built-in selector ${selector} of the kind ${kind}, with another name and the other kind, and the other built-in selectors of its syntax and import kind have none`,
        [{ selector, kind: OTHER_KIND[kind], name: "custom" }],
      ]),
      [
        "a built-in selector, of several syntaxes, with other names and kinds, and the other built-in selectors of the syntax and import kind of some of them have none",
        [
          { selector: IMPORT_TYPE, kind: "value", name: "custom" },
          { selector: EXPORT_ALL_VALUE, kind: "type", name: "other" },
          {
            selector: "ImportExpression > Literal",
            kind: "value",
            name: "dynamic-import",
          },
        ],
      ],
    ])(
      "should be false when every additional node has %s",
      (_title, additional) => {
        // Act
        const readAsESLint = isReadAsESLint(settingsWith([], additional));

        // Assert
        expect(readAsESLint).toBe(false);
      }
    );

    it.each(
      BUILT_IN_NODES_BY_SYNTAX_AND_KIND.map(({ syntax, kind, nodes }) => [
        syntax,
        kind,
        nodes,
      ])
    )(
      "should be true when the additional nodes repeat every built-in selector of %s of the kind %s with its name and kind",
      (_syntax, _kind, nodes) => {
        // Act
        const readAsESLint = isReadAsESLint(settingsWith([], nodes));

        // Assert
        expect(readAsESLint).toBe(true);
      }
    );

    it.each(
      BUILT_IN_NODES_BY_SYNTAX_AND_KIND.map(({ syntax, kind, nodes }) => [
        syntax,
        kind,
        nodes,
      ])
    )(
      "should be true when the additional nodes repeat every built-in selector of %s of the kind %s with one other name and the other kind",
      (_syntax, _kind, nodes) => {
        // Arrange
        const additional = nodes.map(({ selector, kind }) => ({
          selector,
          kind: OTHER_KIND[kind],
          name: "custom",
        }));

        // Act
        const readAsESLint = isReadAsESLint(settingsWith([], additional));

        // Assert
        expect(readAsESLint).toBe(true);
      }
    );

    it("should be true when the additional nodes give every built-in selector of a syntax and import kind that boundaries/dependency-nodes selects one other name", () => {
      // Arrange
      const additional = [
        { selector: EXPORT_ALL_VALUE, kind: "value", name: "reexport" },
        { selector: EXPORT_NAMED_VALUE, kind: "value", name: "reexport" },
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith(["export"], additional));

      // Assert
      expect(readAsESLint).toBe(true);
    });

    it("should be true when the last node with a built-in selector gives it the name and kind of the others of its syntax and import kind, because ESLint runs the last node with a selector", () => {
      // Arrange
      const additional = [
        { selector: EXPORT_ALL_VALUE, kind: "value", name: "reexport" },
        { selector: EXPORT_NAMED_VALUE, kind: "value", name: "export" },
        { selector: EXPORT_NAMED_VALUE, kind: "value", name: "reexport" },
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith([], additional));

      // Assert
      expect(readAsESLint).toBe(true);
    });

    it.each<[string, unknown[], unknown[]]>([
      [
        "no kind, and the other has the kind value",
        ["export"],
        [{ selector: EXPORT_ALL_VALUE, name: "export" }],
      ],
      [
        "an empty kind, and the other has the kind value",
        ["export"],
        [{ selector: EXPORT_NAMED_VALUE, kind: "", name: "export" }],
      ],
      [
        "an empty name, and the other has no name",
        [],
        [
          { selector: EXPORT_ALL_VALUE, kind: "value", name: "" },
          { selector: EXPORT_NAMED_VALUE, kind: "value" },
        ],
      ],
    ])(
      "should be true when the node of one built-in selector of a syntax and import kind has %s, because the plugin describes the dependencies of both alike",
      (_title, nodes, additional) => {
        // Act
        const readAsESLint = isReadAsESLint(settingsWith(nodes, additional));

        // Assert
        expect(readAsESLint).toBe(true);
      }
    );

    // ESLint 9.39.5 reads `export * from` through `export` and `export { f } from` through `reexport`, and the analysis reads both through `export` (measured on 2026-11-23 with the workspace builds of `@boundaries/eslint-plugin` 7.4.4 and `@boundaries/analysis`)
    it("should be false when an additional node gives a built-in selector another name than the other built-in selectors of its syntax and import kind have", () => {
      // Arrange
      const additional = [
        { selector: EXPORT_NAMED_VALUE, kind: "value", name: "reexport" },
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith(["export"], additional));

      // Assert
      expect(readAsESLint).toBe(false);
    });

    it("should be false when an additional node gives a built-in selector another kind than the other built-in selectors of its syntax and import kind have", () => {
      // Arrange
      const additional = [
        { selector: EXPORT_NAMED_VALUE, kind: "type", name: "export" },
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith(["export"], additional));

      // Assert
      expect(readAsESLint).toBe(false);
    });

    it.each<[string, unknown[]]>([
      [
        "an additional node repeats only one of the built-in selectors of its syntax and import kind, through which the analysis reads every statement of them",
        [{ selector: REQUIRE_CALL, kind: "value", name: "require" }],
      ],
      // ESLint 9.39.5 does not read `export * from`, and the analysis reads it through `export` (measured on 2026-11-23 with the workspace builds of `@boundaries/eslint-plugin` 7.4.4 and `@boundaries/analysis`)
      [
        "the only node of a syntax and import kind has one of its built-in selectors, with the built-in name and kind",
        [{ selector: EXPORT_NAMED_VALUE, kind: "value", name: "export" }],
      ],
      // ESLint 9.39.5 does not read `require("…")`, and the analysis reads it through `require` (measured on 2026-11-23 with the workspace builds of `@boundaries/eslint-plugin` 7.4.4 and `@boundaries/analysis`)
      [
        "the only node of the value requires has the built-in selector of import x = require()",
        [{ selector: REQUIRE_EQUALS, kind: "value", name: "require" }],
      ],
      [
        "the additional nodes give the same node to only some of the built-in selectors of a syntax and import kind",
        [
          { selector: REQUIRE_CALL, kind: "value", name: "require" },
          {
            selector:
              "CallExpression[callee.name=require] > TemplateLiteral[expressions.length=0]",
            kind: "value",
            name: "require",
          },
        ],
      ],
      [
        "an additional node with neither name nor kind has one of the built-in selectors of a syntax and import kind, and the others have no node",
        [{ selector: EXPORT_NAMED_VALUE }],
      ],
    ])("should be false when %s", (_title, additional) => {
      // Act
      const readAsESLint = isReadAsESLint(settingsWith([], additional));

      // Assert
      expect(readAsESLint).toBe(false);
    });

    it("should be false when one additional node has a selector that is not built-in, between nodes that repeat built-in selectors", () => {
      // Arrange
      const additional = [
        { selector: IMPORT_TYPE, kind: "type", name: "a" },
        {
          selector: "ImportDeclaration > Literal",
          kind: "value",
          name: "custom",
        },
        { selector: "ImportExpression > Literal", kind: "value", name: "b" },
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith([], additional));

      // Assert
      expect(readAsESLint).toBe(false);
    });

    it("should be false for a selector that differs from a built-in one only in its spaces, because the analysis compares the selectors as they are written", () => {
      // Arrange
      const additional = [
        {
          selector: "ImportDeclaration[importKind=type]  >  Literal",
          kind: "type",
          name: "custom",
        },
      ];

      // Act
      const readAsESLint = isReadAsESLint(settingsWith([], additional));

      // Assert
      expect(readAsESLint).toBe(false);
    });

    it.each<[string, unknown]>([
      ["no additional node", undefined],
      ["only invalid additional nodes", [{ kind: "value" }]],
    ])(
      "should be true when boundaries/dependency-nodes selects the nodes and there is %s",
      (_title, additional) => {
        // Act
        const readAsESLint = isReadAsESLint(
          settingsWith(["import"], additional)
        );

        // Assert
        expect(readAsESLint).toBe(true);
      }
    );

    it.each<[string, unknown]>([
      ["a list", []],
      ["a number", 5],
    ])(
      "should be true when the settings are %s, which is no object",
      (_title, settings) => {
        // Act
        const readAsESLint = isReadAsESLint(settings);

        // Assert
        expect(readAsESLint).toBe(true);
      }
    );
  });
});
