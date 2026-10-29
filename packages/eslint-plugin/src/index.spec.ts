import path from "node:path";

import ts from "typescript";

import { RULE_NAMES_MAP, RULE_SHORT_NAMES_MAP } from "./Public";

import plugin from "./index";

/**
 * What the consumers of a type see: its type parameters, its TSDoc and its tags, with the whitespace of the texts collapsed so that the line wrapping does not count.
 */
type TypeDeclarationSummary = {
  typeParameters: string[];
  documentation: string;
  tags: string[];
};

/**
 * Collapses the whitespace of a text into single spaces.
 * @param text - Text to collapse.
 * @returns The text with its whitespace collapsed.
 */
function collapseWhitespace(text: string): string {
  return text.replaceAll(/\s+/g, " ").trim();
}

/**
 * Reads the type exports of a module with the TypeScript checker, following `export *` chains and the namespace merged with an `export =` value.
 * @param fileName - Path of the module, relative to the folder of this file.
 * @returns The summary of each type export, by name.
 */
function getTypeExports(
  fileName: string
): Record<string, TypeDeclarationSummary> {
  const filePath = path.join(__dirname, fileName);
  const configPath = path.join(__dirname, "..", "tsconfig.code.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const parsedConfig = ts.parseJsonConfigFileContent(
    configFile.config,
    ts.sys,
    path.dirname(configPath)
  );
  const program = ts.createProgram({
    rootNames: [filePath],
    options: { ...parsedConfig.options, noEmit: true },
  });
  const checker = program.getTypeChecker();
  const sourceFile = program.getSourceFile(filePath);
  const moduleSymbol = sourceFile && checker.getSymbolAtLocation(sourceFile);
  if (!moduleSymbol) {
    throw new Error(`Could not resolve the module symbol of ${fileName}`);
  }

  const summaries: Record<string, TypeDeclarationSummary> = {};
  for (const exportSymbol of checker.getExportsOfModule(moduleSymbol)) {
    const symbol =
      exportSymbol.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exportSymbol)
        : exportSymbol;
    const declaration = symbol.declarations?.[0];
    if (symbol.flags & ts.SymbolFlags.Type && declaration) {
      const typeParameters =
        ts.isTypeAliasDeclaration(declaration) ||
        ts.isInterfaceDeclaration(declaration)
          ? (declaration.typeParameters ?? [])
          : [];
      summaries[exportSymbol.getName()] = {
        typeParameters: typeParameters.map((typeParameter) =>
          [
            typeParameter.name.getText(),
            typeParameter.constraint &&
              checker.typeToString(
                checker.getTypeAtLocation(typeParameter.constraint)
              ),
            typeParameter.default &&
              checker.typeToString(
                checker.getTypeAtLocation(typeParameter.default)
              ),
          ].join(" ")
        ),
        documentation: collapseWhitespace(
          ts.displayPartsToString(symbol.getDocumentationComment(checker))
        ),
        tags: symbol
          .getJsDocTags(checker)
          .map(
            (tag) =>
              `@${tag.name} ${collapseWhitespace(ts.displayPartsToString(tag.text))}`
          ),
      };
    }
  }
  return summaries;
}

describe("package", () => {
  describe("type exports", () => {
    it("should declare every public type in the namespace of the plugin object, with the same type parameters, TSDoc and tags", () => {
      // Arrange
      const publicTypes = getTypeExports("Public/index.ts");

      // Act
      const pluginTypes = getTypeExports("index.ts");

      // Assert
      expect(Object.keys(publicTypes).length).toBeGreaterThan(0);
      expect(pluginTypes).toEqual(publicTypes);
    });
  });

  describe("rules property", () => {
    it.each(Object.values(RULE_SHORT_NAMES_MAP))(
      "should contain rule '%s' with a defined create function",
      (ruleName) => {
        expect(plugin.rules[ruleName].create).toBeDefined();
      }
    );

    it.each([
      [
        RULE_SHORT_NAMES_MAP.ELEMENT_TYPES,
        RULE_NAMES_MAP.DEPENDENCIES,
      ] as const,
      [RULE_SHORT_NAMES_MAP.ENTRY_POINT, RULE_NAMES_MAP.DEPENDENCIES] as const,
      [RULE_SHORT_NAMES_MAP.EXTERNAL, RULE_NAMES_MAP.DEPENDENCIES] as const,
      [RULE_SHORT_NAMES_MAP.NO_PRIVATE, RULE_NAMES_MAP.DEPENDENCIES] as const,
      [
        RULE_SHORT_NAMES_MAP.NO_IGNORED,
        RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES,
      ] as const,
      [
        RULE_SHORT_NAMES_MAP.NO_UNKNOWN,
        RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES,
      ] as const,
    ])(
      "should mark deprecated rule '%s' as replaced by '%s' in its meta",
      (ruleName, replacedBy) => {
        expect(plugin.rules[ruleName].meta?.deprecated).toEqual(
          expect.objectContaining({
            replacedBy: [
              expect.objectContaining({
                rule: expect.objectContaining({ name: replacedBy }),
              }),
            ],
          })
        );
      }
    );

    it.each([
      RULE_SHORT_NAMES_MAP.DEPENDENCIES,
      RULE_SHORT_NAMES_MAP.NO_IGNORED_DEPENDENCIES,
      RULE_SHORT_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES,
      RULE_SHORT_NAMES_MAP.NO_UNKNOWN_FILES,
    ])("should not mark canonical rule '%s' as deprecated", (ruleName) => {
      expect(plugin.rules[ruleName].meta?.deprecated).toBeUndefined();
    });
  });

  describe("recommended config", () => {
    it("should enable only the canonical 'dependencies' rule, not the deprecated element-types/entry-point/external rules", () => {
      const rules = plugin.configs.recommended.rules ?? {};

      expect(rules[RULE_NAMES_MAP.DEPENDENCIES]).toBeDefined();
      expect(rules[RULE_NAMES_MAP.ELEMENT_TYPES]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.ENTRY_POINT]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.EXTERNAL]).toBeUndefined();
    });
  });

  describe("strict config", () => {
    it("should not enable the deprecated element-types/entry-point/external rules either", () => {
      const rules = plugin.configs.strict.rules ?? {};

      expect(rules[RULE_NAMES_MAP.DEPENDENCIES]).toBeDefined();
      expect(rules[RULE_NAMES_MAP.ELEMENT_TYPES]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.ENTRY_POINT]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.EXTERNAL]).toBeUndefined();
    });

    it("should enable the canonical 'no-ignored-dependencies' and 'no-unknown-dependencies' rules, not their deprecated aliases", () => {
      const rules = plugin.configs.strict.rules ?? {};

      expect(rules[RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES]).toBe(2);
      expect(rules[RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES]).toBe(2);
      expect(rules[RULE_NAMES_MAP.NO_IGNORED]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.NO_UNKNOWN]).toBeUndefined();
    });
  });

  describe("strict-legacy config", () => {
    it("should not enable the deprecated element-types/entry-point/external rules either", () => {
      const rules = plugin.configs["strict-legacy"].rules ?? {};

      expect(rules[RULE_NAMES_MAP.DEPENDENCIES]).toBeDefined();
      expect(rules[RULE_NAMES_MAP.ELEMENT_TYPES]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.ENTRY_POINT]).toBeUndefined();
      expect(rules[RULE_NAMES_MAP.EXTERNAL]).toBeUndefined();
    });

    it("should enable the deprecated 'no-ignored' and 'no-unknown' rule names instead of their canonical replacements", () => {
      const rules = plugin.configs["strict-legacy"].rules ?? {};

      expect(rules[RULE_NAMES_MAP.NO_IGNORED]).toBe(2);
      expect(rules[RULE_NAMES_MAP.NO_UNKNOWN]).toBe(2);
      // Inherited from the recommended config, disabled by default
      expect(rules[RULE_NAMES_MAP.NO_IGNORED_DEPENDENCIES]).toBe(0);
      expect(rules[RULE_NAMES_MAP.NO_UNKNOWN_DEPENDENCIES]).toBe(0);
    });

    it("should otherwise be identical to the strict config", () => {
      const { rules: strictLegacyRules, ...strictLegacyRest } =
        plugin.configs["strict-legacy"];
      const { rules: strictRules, ...strictRest } = plugin.configs.strict;

      expect(strictLegacyRest).toEqual(strictRest);
      expect(strictLegacyRules?.[RULE_NAMES_MAP.NO_UNKNOWN_FILES]).toEqual(
        strictRules?.[RULE_NAMES_MAP.NO_UNKNOWN_FILES]
      );
    });
  });
});
