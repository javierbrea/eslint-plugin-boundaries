import plugin from "..";

import {
  createConfig,
  PLUGIN_NAME,
  RULE_SHORT_NAMES_MAP,
  RULE_NAMES_MAP,
  isRuleShortName,
  isRuleName,
  DEPENDENCY_KINDS_MAP,
  isDependencyKind,
  DEPENDENCY_NODE_KEYS_MAP,
  isDependencyNodeKey,
  SETTINGS_KEYS_MAP,
  isSettingsKey,
  ELEMENT_DESCRIPTOR_MODES_MAP,
  RULE_EFFECTS_MAP,
  RULE_POLICIES_MAP,
  isRuleEffect,
  isRulePolicy,
} from "./Config";

describe("createConfig", () => {
  describe("with default configuration", () => {
    it("should return config with default plugin name", () => {
      const config = createConfig({});

      expect(config.plugins).toEqual({
        [PLUGIN_NAME]: plugin,
      });
    });

    it("should include default file patterns", () => {
      const config = createConfig({});

      expect(config.files).toEqual([
        "**/*.js",
        "**/*.jsx",
        "**/*.ts",
        "**/*.tsx",
        "**/*.mjs",
        "**/*.cjs",
      ]);
    });

    it("should preserve empty rules when no rules provided", () => {
      const config = createConfig({});

      expect(config.rules).toEqual({});
    });

    it("should preserve provided settings", () => {
      const settings = {
        "boundaries/elements": [
          {
            type: "component",
            pattern: "src/components/*",
          },
        ],
      };
      const config = createConfig({ settings });

      expect(config.settings).toEqual(settings);
    });
  });

  describe("with custom plugin name", () => {
    it("should register plugin with custom name", () => {
      const customName = "customBoundaries";
      const config = createConfig({}, customName);

      expect(config.plugins).toEqual({
        [customName]: plugin,
      });
    });

    it("should rename plugin rules to use custom name", () => {
      const customName = "customBoundaries";
      const inputConfig = {
        rules: {
          "boundaries/element-types": [2],
          "boundaries/no-private": [1, { allowUncles: true }],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      const config = createConfig(inputConfig, customName);

      expect(config.rules).toEqual({
        "customBoundaries/element-types": [2],
        "customBoundaries/no-private": [1, { allowUncles: true }],
      });
    });

    it("should throw error when non-plugin rules are provided", () => {
      const customName = "customBoundaries";
      const inputConfig = {
        rules: {
          "boundaries/element-types": [2],
          "no-console": [1],
          "import/order": [2],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      expect(() => createConfig(inputConfig, customName)).toThrow(
        'Invalid rule key "no-console". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "boundaries/", or with the provided plugin name "customBoundaries/".'
      );
    });

    it("should handle empty rules with custom plugin name", () => {
      const customName = "customBoundaries";
      const config = createConfig({ rules: {} }, customName);

      expect(config.rules).toEqual({});
    });
  });

  describe("with complex configuration", () => {
    it("should preserve all config properties except plugins and rules", () => {
      const inputConfig = {
        files: ["**/*.custom.js"],
        languageOptions: {
          ecmaVersion: 2022,
          sourceType: "module",
        },
        settings: {
          "boundaries/elements": [
            {
              type: "module",
              pattern: "src/modules/*",
            },
          ],
        },
        rules: {
          "boundaries/element-types": [2],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      const config = createConfig(inputConfig);

      expect(config.languageOptions).toEqual(inputConfig.languageOptions);
      expect(config.settings).toEqual(inputConfig.settings);
      // files from input should be preserved due to spread operator
      expect(config.files).toEqual(["**/*.custom.js"]);
    });

    it("should handle all plugin rules with custom name", () => {
      const customName = "myBoundaries";
      const inputConfig = {
        rules: {
          "boundaries/element-types": [2, { default: "disallow" }],
          "boundaries/entry-point": [1],
          "boundaries/external": [2, { forbid: ["lodash"] }],
          "boundaries/no-ignored-dependencies": [0],
          "boundaries/no-ignored": [0],
          "boundaries/no-private": [2, { allowUncles: false }],
          "boundaries/no-unknown-files": [1],
          "boundaries/no-unknown-dependencies": [2],
          "boundaries/no-unknown": [2],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      const config = createConfig(inputConfig, customName);

      expect(config.rules).toEqual({
        "myBoundaries/element-types": [2, { default: "disallow" }],
        "myBoundaries/entry-point": [1],
        "myBoundaries/external": [2, { forbid: ["lodash"] }],
        "myBoundaries/no-ignored-dependencies": [0],
        "myBoundaries/no-ignored": [0],
        "myBoundaries/no-private": [2, { allowUncles: false }],
        "myBoundaries/no-unknown-files": [1],
        "myBoundaries/no-unknown-dependencies": [2],
        "myBoundaries/no-unknown": [2],
      });
    });
  });

  describe("settings validation", () => {
    it("should allow valid plugin settings", () => {
      const validSettings = {
        "boundaries/elements": [
          {
            type: "component",
            pattern: "src/components/*",
          },
        ],
        "boundaries/ignore": ["**/*.test.js"],
        "boundaries/include": ["src/**/*"],
        "boundaries/root-path": "./src",
      };

      expect(() => createConfig({ settings: validSettings })).not.toThrow();
    });

    it("should throw error when invalid settings key is provided", () => {
      const invalidSettings = {
        "boundaries/elements": [{ type: "component", pattern: "src/*" }],
        "import/resolver": { node: true }, // Invalid - not a boundaries setting
      };

      expect(() => createConfig({ settings: invalidSettings })).toThrow(
        'Invalid settings key "import/resolver". When using createConfig, all settings keys must belong to eslint-plugin-boundaries.'
      );
    });

    it("should throw error when multiple invalid settings keys are provided", () => {
      const invalidSettings = {
        "boundaries/elements": [{ type: "component", pattern: "src/*" }],
        "eslint-plugin-import/resolver": { node: true },
        "typescript-eslint/prefer-readonly": true,
      };

      expect(() => createConfig({ settings: invalidSettings })).toThrow(
        'Invalid settings key "eslint-plugin-import/resolver". When using createConfig, all settings keys must belong to eslint-plugin-boundaries.'
      );
    });

    it("should allow deprecated settings keys", () => {
      const deprecatedSettings = {
        "boundaries/types": [{ type: "legacy", pattern: "legacy/*" }],
        "boundaries/alias": { "@": "./src" },
      };

      expect(() =>
        createConfig({ settings: deprecatedSettings })
      ).not.toThrow();
    });

    it("should handle empty settings object", () => {
      const emptySettings = {};

      expect(() => createConfig({ settings: emptySettings })).not.toThrow();
    });

    it("should handle null settings", () => {
      // @ts-expect-error - Testing with intentionally incorrect rule format
      expect(() => createConfig({ settings: null })).not.toThrow();
    });

    it("should handle undefined settings", () => {
      expect(() => createConfig({ settings: undefined })).not.toThrow();
    });

    it("should throw error for non-boundaries settings even with valid boundaries settings", () => {
      const mixedSettings = {
        "boundaries/elements": [{ type: "component", pattern: "src/*" }],
        "boundaries/ignore": ["test/**/*"],
        "react/jsx-runtime": "automatic", // Invalid - not a boundaries setting
        "boundaries/root-path": "./src",
      };

      expect(() => createConfig({ settings: mixedSettings })).toThrow(
        'Invalid settings key "react/jsx-runtime". When using createConfig, all settings keys must belong to eslint-plugin-boundaries.'
      );
    });

    it("should validate settings with custom plugin name", () => {
      const customName = "customBoundaries";
      const validSettings = {
        "boundaries/elements": [{ type: "component", pattern: "src/*" }],
      };

      expect(() =>
        createConfig({ settings: validSettings }, customName)
      ).not.toThrow();
    });

    it("should throw error for invalid settings with custom plugin name", () => {
      const customName = "customBoundaries";
      const invalidSettings = {
        "boundaries/elements": [{ type: "component", pattern: "src/*" }],
        "custom/setting": "value", // Invalid - not a boundaries setting
      };

      expect(() =>
        createConfig({ settings: invalidSettings }, customName)
      ).toThrow(
        'Invalid settings key "custom/setting". When using createConfig, all settings keys must belong to eslint-plugin-boundaries.'
      );
    });

    it("should allow all valid boundaries settings keys", () => {
      const allValidSettings = {
        "boundaries/elements": [{ type: "component", pattern: "src/*" }],
        "boundaries/ignore": ["test/**/*"],
        "boundaries/include": ["src/**/*"],
        "boundaries/root-path": "./src",
        "boundaries/dependency-nodes": ["import", "require"],
        "boundaries/additional-dependency-nodes": [
          { selector: "CallExpression", kind: "value" },
        ],
        "boundaries/types": [{ type: "legacy", pattern: "legacy/*" }], // deprecated
        "boundaries/alias": { "@": "./src" }, // deprecated
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      expect(() => createConfig({ settings: allValidSettings })).not.toThrow();
    });
  });

  describe("edge cases", () => {
    it("should handle undefined rules", () => {
      const config = createConfig({ rules: undefined });

      expect(config.rules).toEqual({});
    });

    it("should throw error when mixed plugin and non-plugin rules are provided", () => {
      const inputConfig = {
        rules: {
          "boundaries/element-types": [2],
          "eslint-comments/no-unused-disable": [1],
          "import/no-unresolved": [2],
          "boundaries/no-private": [1],
          "@typescript-eslint/no-unused-vars": [2],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      expect(() => createConfig(inputConfig)).toThrow(
        'Invalid rule key "eslint-comments/no-unused-disable". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "boundaries/", or with the provided plugin name "boundaries/".'
      );
    });

    it("should throw error when plugin name is a substring of another plugin rule", () => {
      const inputConfig = {
        rules: {
          "boundaries/element-types": [2],
          "boundaries-extra/some-rule": [1], // This should throw error
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      expect(() => createConfig(inputConfig, "myPlugin")).toThrow(
        'Invalid rule key "boundaries-extra/some-rule". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "boundaries/", or with the provided plugin name "myPlugin/".'
      );
    });

    it("should preserve file patterns when provided in input", () => {
      const inputConfig = {
        files: ["**/*.tsx", "**/*.jsx"],
        rules: {
          "boundaries/element-types": [2],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      const config = createConfig(inputConfig);

      // Input files should be preserved due to spread operator
      expect(config.files).toEqual(["**/*.tsx", "**/*.jsx"]);
    });

    it("should handle null rules", () => {
      // @ts-expect-error - Testing with intentionally incorrect rule format
      const config = createConfig({ rules: null });

      expect(config.rules).toEqual({});
    });

    it("should handle empty plugin name", () => {
      const config = createConfig({}, "");

      expect(config.plugins).toEqual({
        "": plugin,
      });
    });

    it("should work with TypeScript strict mode configuration", () => {
      const inputConfig = {
        rules: {
          "boundaries/element-types": [2, { default: "disallow" }],
          "boundaries/no-private": [2, { allowUncles: false }],
        },
        settings: {
          "boundaries/elements": [
            {
              type: "component",
              pattern: "src/components/*.tsx",
              mode: "file",
            },
          ],
        },
        languageOptions: {
          parser: "@typescript-eslint/parser",
          parserOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
          },
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      const config = createConfig(inputConfig);

      expect(config.rules).toEqual({
        "boundaries/element-types": [2, { default: "disallow" }],
        "boundaries/no-private": [2, { allowUncles: false }],
      });
      expect(config.settings).toEqual(inputConfig.settings);
      expect(config.languageOptions).toEqual(inputConfig.languageOptions);
    });

    it("should throw error when plugins property is provided", () => {
      const inputConfig = {
        plugins: {
          boundaries: {},
        },
        rules: {
          "boundaries/element-types": [2],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      expect(() => createConfig(inputConfig)).toThrow(
        "The 'plugins' field is managed by createConfig and should not be provided in the config argument."
      );
    });

    it("should preserve rules with custom plugin name prefix", () => {
      const customName = "customBoundaries";
      const inputConfig = {
        rules: {
          "customBoundaries/element-types": [2, { default: "disallow" }],
          "customBoundaries/no-private": [1, { allowUncles: true }],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      const config = createConfig(inputConfig, customName);

      expect(config.rules).toEqual({
        "customBoundaries/element-types": [2, { default: "disallow" }],
        "customBoundaries/no-private": [1, { allowUncles: true }],
      });
    });

    it("should throw error when non-existent plugin rule name is provided", () => {
      const inputConfig = {
        rules: {
          "boundaries/non-existent-rule": [2],
          "boundaries/element-types": [1],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      expect(() => createConfig(inputConfig)).toThrow(
        'Invalid rule name "non-existent-rule". When using createConfig, all rules must belong to eslint-plugin-boundaries.'
      );
    });

    it("should throw error when invalid rule name is provided with custom plugin name", () => {
      const customName = "myBoundaries";
      const inputConfig = {
        rules: {
          "myBoundaries/invalid-rule-name": [2],
          "myBoundaries/element-types": [1],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      expect(() => createConfig(inputConfig, customName)).toThrow(
        'Invalid rule name "invalid-rule-name". When using createConfig, all rules must belong to eslint-plugin-boundaries.'
      );
    });
  });
});

describe("Constants", () => {
  it("should define PLUGIN_NAME as boundaries", () => {
    expect(typeof PLUGIN_NAME).toBe("string");
    expect(PLUGIN_NAME).toBe("boundaries");
  });

  it.each([
    ["RULE_SHORT_NAMES_MAP", RULE_SHORT_NAMES_MAP],
    ["RULE_NAMES_MAP", RULE_NAMES_MAP],
    ["DEPENDENCY_KINDS_MAP", DEPENDENCY_KINDS_MAP],
    ["DEPENDENCY_NODE_KEYS_MAP", DEPENDENCY_NODE_KEYS_MAP],
    ["SETTINGS_KEYS_MAP", SETTINGS_KEYS_MAP],
    ["ELEMENT_DESCRIPTOR_MODES_MAP", ELEMENT_DESCRIPTOR_MODES_MAP],
    ["RULE_EFFECTS_MAP", RULE_EFFECTS_MAP],
    ["RULE_POLICIES_MAP", RULE_POLICIES_MAP],
  ])("should define %s as a string key/value map", (_name, map) => {
    expect(typeof map).toBe("object");

    expect(
      Object.keys(map).filter((key) => typeof key !== "string")
    ).toStrictEqual([]);
    expect(
      Object.values(map).filter((value) => typeof value !== "string")
    ).toStrictEqual([]);
  });

  it("should define the short name of each rule in RULE_SHORT_NAMES_MAP", () => {
    expect(RULE_SHORT_NAMES_MAP).toMatchObject({
      ELEMENT_TYPES: "element-types",
      ENTRY_POINT: "entry-point",
      EXTERNAL: "external",
      NO_IGNORED_DEPENDENCIES: "no-ignored-dependencies",
      NO_IGNORED: "no-ignored",
      NO_PRIVATE: "no-private",
      NO_UNKNOWN_FILES: "no-unknown-files",
      NO_UNKNOWN_DEPENDENCIES: "no-unknown-dependencies",
      NO_UNKNOWN: "no-unknown",
    });
  });

  it("should define the name of each rule in RULE_NAMES_MAP", () => {
    expect(RULE_NAMES_MAP).toMatchObject({
      ELEMENT_TYPES: "boundaries/element-types",
      ENTRY_POINT: "boundaries/entry-point",
      EXTERNAL: "boundaries/external",
      NO_IGNORED_DEPENDENCIES: "boundaries/no-ignored-dependencies",
      NO_IGNORED: "boundaries/no-ignored",
      NO_PRIVATE: "boundaries/no-private",
      NO_UNKNOWN_FILES: "boundaries/no-unknown-files",
      NO_UNKNOWN_DEPENDENCIES: "boundaries/no-unknown-dependencies",
      NO_UNKNOWN: "boundaries/no-unknown",
    });
  });

  it("should define the dependency kinds in DEPENDENCY_KINDS_MAP", () => {
    expect(DEPENDENCY_KINDS_MAP).toMatchObject({
      TYPE: "type",
      VALUE: "value",
      TYPE_OF: "typeof",
    });
  });

  it("should define the dependency node keys in DEPENDENCY_NODE_KEYS_MAP", () => {
    expect(DEPENDENCY_NODE_KEYS_MAP).toMatchObject({
      REQUIRE: "require",
      IMPORT: "import",
      DYNAMIC_IMPORT: "dynamic-import",
      EXPORT: "export",
    });
  });

  it("should define the settings keys in SETTINGS_KEYS_MAP", () => {
    expect(SETTINGS_KEYS_MAP).toMatchObject({
      ELEMENTS: "boundaries/elements",
      IGNORE: "boundaries/ignore",
      INCLUDE: "boundaries/include",
      ROOT_PATH: "boundaries/root-path",
      DEPENDENCY_NODES: "boundaries/dependency-nodes",
      ADDITIONAL_DEPENDENCY_NODES: "boundaries/additional-dependency-nodes",
      DEBUG: "boundaries/debug",
      TYPES: "boundaries/types",
      ALIAS: "boundaries/alias",
    });
  });

  it("should define the element descriptor modes in ELEMENT_DESCRIPTOR_MODES_MAP", () => {
    expect(ELEMENT_DESCRIPTOR_MODES_MAP).toMatchObject({
      FOLDER: "folder",
      FILE: "file",
      FULL: "full",
    });
  });

  it("should define the rule effects in RULE_EFFECTS_MAP", () => {
    expect(RULE_EFFECTS_MAP).toMatchObject({
      ALLOW: "allow",
      DISALLOW: "disallow",
    });
  });

  it("should define the rule effects in RULE_POLICIES_MAP, its deprecated alias", () => {
    expect(RULE_POLICIES_MAP).toMatchObject({
      ALLOW: "allow",
      DISALLOW: "disallow",
    });
  });

  it("should define RULE_POLICIES_MAP as the same object as RULE_EFFECTS_MAP", () => {
    expect(RULE_POLICIES_MAP).toBe(RULE_EFFECTS_MAP);
  });
});

describe("Type Guard Functions", () => {
  describe("isRuleShortName", () => {
    it.each([
      "element-types",
      "entry-point",
      "external",
      "no-ignored-dependencies",
      "no-ignored",
      "no-private",
      "no-unknown-files",
      "no-unknown-dependencies",
      "no-unknown",
    ])("should return true for the valid rule short name %s", (name) => {
      expect(isRuleShortName(name)).toBe(true);
    });

    it("should return false for invalid rule short names", () => {
      expect(isRuleShortName("invalid-rule")).toBe(false);
      expect(isRuleShortName("boundaries/element-types")).toBe(false);
      expect(isRuleShortName("")).toBe(false);
      expect(isRuleShortName("element_types")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isRuleShortName(null)).toBe(false);
      expect(isRuleShortName(undefined)).toBe(false);
      expect(isRuleShortName(123)).toBe(false);
      expect(isRuleShortName({})).toBe(false);
      expect(isRuleShortName([])).toBe(false);
    });
  });

  describe("isRuleName", () => {
    it.each([
      "boundaries/element-types",
      "boundaries/entry-point",
      "boundaries/external",
      "boundaries/no-ignored-dependencies",
      "boundaries/no-ignored",
      "boundaries/no-private",
      "boundaries/no-unknown-files",
      "boundaries/no-unknown-dependencies",
      "boundaries/no-unknown",
    ])("should return true for the valid rule name with prefix %s", (name) => {
      expect(isRuleName(name)).toBe(true);
    });

    it("should return false for rule short names without prefix", () => {
      expect(isRuleName("element-types")).toBe(false);
      expect(isRuleName("entry-point")).toBe(false);
      expect(isRuleName("external")).toBe(false);
    });

    it("should return false for invalid rule names", () => {
      expect(isRuleName("boundaries/invalid-rule")).toBe(false);
      expect(isRuleName("other-plugin/element-types")).toBe(false);
      expect(isRuleName("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isRuleName(null)).toBe(false);
      expect(isRuleName(undefined)).toBe(false);
      expect(isRuleName(123)).toBe(false);
      expect(isRuleName({})).toBe(false);
      expect(isRuleName([])).toBe(false);
    });
  });

  describe("isDependencyKind", () => {
    it("should return true for valid dependency kinds", () => {
      expect(isDependencyKind("type")).toBe(true);
      expect(isDependencyKind("value")).toBe(true);
      expect(isDependencyKind("typeof")).toBe(true);
    });

    it("should return false for invalid dependency kinds", () => {
      expect(isDependencyKind("invalid")).toBe(false);
      expect(isDependencyKind("TYPE")).toBe(false);
      expect(isDependencyKind("VALUE")).toBe(false);
      expect(isDependencyKind("TYPEOF")).toBe(false);
      expect(isDependencyKind("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isDependencyKind(null)).toBe(false);
      expect(isDependencyKind(undefined)).toBe(false);
      expect(isDependencyKind(123)).toBe(false);
      expect(isDependencyKind({})).toBe(false);
      expect(isDependencyKind([])).toBe(false);
    });
  });

  describe("isDependencyNodeKey", () => {
    it("should return true for valid dependency node keys", () => {
      expect(isDependencyNodeKey("require")).toBe(true);
      expect(isDependencyNodeKey("import")).toBe(true);
      expect(isDependencyNodeKey("dynamic-import")).toBe(true);
      expect(isDependencyNodeKey("export")).toBe(true);
    });

    it("should return false for invalid dependency node keys", () => {
      expect(isDependencyNodeKey("invalid")).toBe(false);
      expect(isDependencyNodeKey("REQUIRE")).toBe(false);
      expect(isDependencyNodeKey("IMPORT")).toBe(false);
      expect(isDependencyNodeKey("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isDependencyNodeKey(null)).toBe(false);
      expect(isDependencyNodeKey(undefined)).toBe(false);
      expect(isDependencyNodeKey(123)).toBe(false);
      expect(isDependencyNodeKey({})).toBe(false);
      expect(isDependencyNodeKey([])).toBe(false);
    });
  });

  describe("isSettingsKey", () => {
    it.each([
      "boundaries/elements",
      "boundaries/ignore",
      "boundaries/include",
      "boundaries/root-path",
      "boundaries/dependency-nodes",
      "boundaries/additional-dependency-nodes",
      "boundaries/debug",
      "boundaries/types",
      "boundaries/alias",
    ])("should return true for the valid settings key %s", (name) => {
      expect(isSettingsKey(name)).toBe(true);
    });

    it("should return false for invalid settings keys", () => {
      expect(isSettingsKey("boundaries/invalid")).toBe(false);
      expect(isSettingsKey("other-plugin/elements")).toBe(false);
      expect(isSettingsKey("elements")).toBe(false);
      expect(isSettingsKey("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isSettingsKey(null)).toBe(false);
      expect(isSettingsKey(undefined)).toBe(false);
      expect(isSettingsKey(123)).toBe(false);
      expect(isSettingsKey({})).toBe(false);
      expect(isSettingsKey([])).toBe(false);
    });
  });

  describe("isRuleEffect", () => {
    it("should return true for valid rule effects", () => {
      expect(isRuleEffect("allow")).toBe(true);
      expect(isRuleEffect("disallow")).toBe(true);
    });

    it("should return false for invalid rule effects", () => {
      expect(isRuleEffect("invalid")).toBe(false);
      expect(isRuleEffect("ALLOW")).toBe(false);
      expect(isRuleEffect("DISALLOW")).toBe(false);
      expect(isRuleEffect("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isRuleEffect(null)).toBe(false);
      expect(isRuleEffect(undefined)).toBe(false);
      expect(isRuleEffect(123)).toBe(false);
      expect(isRuleEffect({})).toBe(false);
      expect(isRuleEffect([])).toBe(false);
    });
  });

  describe("isRulePolicy (deprecated alias of isRuleEffect)", () => {
    it("should return true for valid rule policies", () => {
      expect(isRulePolicy("allow")).toBe(true);
      expect(isRulePolicy("disallow")).toBe(true);
    });

    it("should return false for invalid rule policies", () => {
      expect(isRulePolicy("invalid")).toBe(false);
      expect(isRulePolicy("ALLOW")).toBe(false);
      expect(isRulePolicy("DISALLOW")).toBe(false);
      expect(isRulePolicy("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isRulePolicy(null)).toBe(false);
      expect(isRulePolicy(undefined)).toBe(false);
      expect(isRulePolicy(123)).toBe(false);
      expect(isRulePolicy({})).toBe(false);
      expect(isRulePolicy([])).toBe(false);
    });

    it("is the same function as isRuleEffect", () => {
      expect(isRulePolicy).toBe(isRuleEffect);
    });
  });
});
