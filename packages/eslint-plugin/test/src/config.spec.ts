import plugin from "../../src";
import {
  createConfig,
  PLUGIN_NAME,
  RULE_SHORT_NAMES_MAP,
  RULE_NAMES_MAP,
  isRuleShortName,
  isRuleName,
  IMPORT_KINDS_MAP,
  isImportKind,
  DEPENDENCY_NODE_KEYS_MAP,
  isDependencyNodeKey,
  SETTINGS_KEYS_MAP,
  isSettingsKey,
  ELEMENT_DESCRIPTOR_MODES_MAP,
  isElementDescriptorMode,
  RULE_POLICIES_MAP,
  isRulePolicy,
} from "../../src/Config/Config";

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
          "boundaries/no-ignored": [0],
          "boundaries/no-private": [2, { allowUncles: false }],
          "boundaries/no-unknown-files": [1],
          "boundaries/no-unknown": [2],
        },
      };

      // @ts-expect-error - Testing with intentionally incorrect rule format
      const config = createConfig(inputConfig, customName);

      expect(config.rules).toEqual({
        "myBoundaries/element-types": [2, { default: "disallow" }],
        "myBoundaries/entry-point": [1],
        "myBoundaries/external": [2, { forbid: ["lodash"] }],
        "myBoundaries/no-ignored": [0],
        "myBoundaries/no-private": [2, { allowUncles: false }],
        "myBoundaries/no-unknown-files": [1],
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
  describe("PLUGIN_NAME", () => {
    it("should be defined as a string", () => {
      expect(PLUGIN_NAME).toBeDefined();
      expect(typeof PLUGIN_NAME).toBe("string");
      expect(PLUGIN_NAME).toBe("boundaries");
    });
  });

  describe("RULE_SHORT_NAMES_MAP", () => {
    it("should be defined as a string key/value map", () => {
      expect(RULE_SHORT_NAMES_MAP).toBeDefined();
      expect(typeof RULE_SHORT_NAMES_MAP).toBe("object");
      Object.entries(RULE_SHORT_NAMES_MAP).forEach(([key, value]) => {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
      });

      expect(RULE_SHORT_NAMES_MAP.ELEMENT_TYPES).toBe("element-types");
      expect(RULE_SHORT_NAMES_MAP.ENTRY_POINT).toBe("entry-point");
      expect(RULE_SHORT_NAMES_MAP.EXTERNAL).toBe("external");
      expect(RULE_SHORT_NAMES_MAP.NO_IGNORED).toBe("no-ignored");
      expect(RULE_SHORT_NAMES_MAP.NO_PRIVATE).toBe("no-private");
      expect(RULE_SHORT_NAMES_MAP.NO_UNKNOWN_FILES).toBe("no-unknown-files");
      expect(RULE_SHORT_NAMES_MAP.NO_UNKNOWN).toBe("no-unknown");
    });
  });

  describe("RULE_NAMES_MAP", () => {
    it("should be defined as a string key/value map", () => {
      expect(RULE_NAMES_MAP).toBeDefined();
      expect(typeof RULE_NAMES_MAP).toBe("object");

      Object.entries(RULE_NAMES_MAP).forEach(([key, value]) => {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
      });

      expect(RULE_NAMES_MAP.ELEMENT_TYPES).toBe("boundaries/element-types");
      expect(RULE_NAMES_MAP.ENTRY_POINT).toBe("boundaries/entry-point");
      expect(RULE_NAMES_MAP.EXTERNAL).toBe("boundaries/external");
      expect(RULE_NAMES_MAP.NO_IGNORED).toBe("boundaries/no-ignored");
      expect(RULE_NAMES_MAP.NO_PRIVATE).toBe("boundaries/no-private");
      expect(RULE_NAMES_MAP.NO_UNKNOWN_FILES).toBe(
        "boundaries/no-unknown-files"
      );
      expect(RULE_NAMES_MAP.NO_UNKNOWN).toBe("boundaries/no-unknown");
    });
  });

  describe("IMPORT_KINDS_MAP", () => {
    it("should be defined as a string key/value map", () => {
      expect(IMPORT_KINDS_MAP).toBeDefined();
      expect(typeof IMPORT_KINDS_MAP).toBe("object");

      Object.entries(IMPORT_KINDS_MAP).forEach(([key, value]) => {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
      });

      expect(IMPORT_KINDS_MAP.TYPE).toBe("type");
      expect(IMPORT_KINDS_MAP.VALUE).toBe("value");
    });
  });

  describe("DEPENDENCY_NODE_KEYS_MAP", () => {
    it("should be defined as a string key/value map", () => {
      expect(DEPENDENCY_NODE_KEYS_MAP).toBeDefined();
      expect(typeof DEPENDENCY_NODE_KEYS_MAP).toBe("object");

      Object.entries(DEPENDENCY_NODE_KEYS_MAP).forEach(([key, value]) => {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
      });

      expect(DEPENDENCY_NODE_KEYS_MAP.REQUIRE).toBe("require");
      expect(DEPENDENCY_NODE_KEYS_MAP.IMPORT).toBe("import");
      expect(DEPENDENCY_NODE_KEYS_MAP.DYNAMIC_IMPORT).toBe("dynamic-import");
      expect(DEPENDENCY_NODE_KEYS_MAP.EXPORT).toBe("export");
    });
  });

  describe("SETTINGS_KEYS_MAP", () => {
    it("should be defined as a string key/value map", () => {
      expect(SETTINGS_KEYS_MAP).toBeDefined();
      expect(typeof SETTINGS_KEYS_MAP).toBe("object");

      Object.entries(SETTINGS_KEYS_MAP).forEach(([key, value]) => {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
      });

      expect(SETTINGS_KEYS_MAP.ELEMENTS).toBe("boundaries/elements");
      expect(SETTINGS_KEYS_MAP.IGNORE).toBe("boundaries/ignore");
      expect(SETTINGS_KEYS_MAP.INCLUDE).toBe("boundaries/include");
      expect(SETTINGS_KEYS_MAP.ROOT_PATH).toBe("boundaries/root-path");
      expect(SETTINGS_KEYS_MAP.DEPENDENCY_NODES).toBe(
        "boundaries/dependency-nodes"
      );
      expect(SETTINGS_KEYS_MAP.ADDITIONAL_DEPENDENCY_NODES).toBe(
        "boundaries/additional-dependency-nodes"
      );
      expect(SETTINGS_KEYS_MAP.TYPES).toBe("boundaries/types");
      expect(SETTINGS_KEYS_MAP.ALIAS).toBe("boundaries/alias");
    });
  });

  describe("ELEMENT_DESCRIPTOR_MODES_MAP", () => {
    it("should be defined as a string key/value map", () => {
      expect(ELEMENT_DESCRIPTOR_MODES_MAP).toBeDefined();
      expect(typeof ELEMENT_DESCRIPTOR_MODES_MAP).toBe("object");

      Object.entries(ELEMENT_DESCRIPTOR_MODES_MAP).forEach(([key, value]) => {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
      });

      expect(ELEMENT_DESCRIPTOR_MODES_MAP.FOLDER).toBe("folder");
      expect(ELEMENT_DESCRIPTOR_MODES_MAP.FILE).toBe("file");
      expect(ELEMENT_DESCRIPTOR_MODES_MAP.FULL).toBe("full");
    });
  });

  describe("RULE_POLICIES_MAP", () => {
    it("should be defined as a string key/value map", () => {
      expect(RULE_POLICIES_MAP).toBeDefined();
      expect(typeof RULE_POLICIES_MAP).toBe("object");

      Object.entries(RULE_POLICIES_MAP).forEach(([key, value]) => {
        expect(typeof key).toBe("string");
        expect(typeof value).toBe("string");
      });

      expect(RULE_POLICIES_MAP.ALLOW).toBe("allow");
      expect(RULE_POLICIES_MAP.DISALLOW).toBe("disallow");
    });
  });
});

describe("Type Guard Functions", () => {
  describe("isRuleShortName", () => {
    it("should return true for valid rule short names", () => {
      expect(isRuleShortName("element-types")).toBe(true);
      expect(isRuleShortName("entry-point")).toBe(true);
      expect(isRuleShortName("external")).toBe(true);
      expect(isRuleShortName("no-ignored")).toBe(true);
      expect(isRuleShortName("no-private")).toBe(true);
      expect(isRuleShortName("no-unknown-files")).toBe(true);
      expect(isRuleShortName("no-unknown")).toBe(true);
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
    it("should return true for valid rule names with prefix", () => {
      expect(isRuleName("boundaries/element-types")).toBe(true);
      expect(isRuleName("boundaries/entry-point")).toBe(true);
      expect(isRuleName("boundaries/external")).toBe(true);
      expect(isRuleName("boundaries/no-ignored")).toBe(true);
      expect(isRuleName("boundaries/no-private")).toBe(true);
      expect(isRuleName("boundaries/no-unknown-files")).toBe(true);
      expect(isRuleName("boundaries/no-unknown")).toBe(true);
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

  describe("isImportKind", () => {
    it("should return true for valid import kinds", () => {
      expect(isImportKind("type")).toBe(true);
      expect(isImportKind("value")).toBe(true);
    });

    it("should return false for invalid import kinds", () => {
      expect(isImportKind("invalid")).toBe(false);
      expect(isImportKind("TYPE")).toBe(false);
      expect(isImportKind("VALUE")).toBe(false);
      expect(isImportKind("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isImportKind(null)).toBe(false);
      expect(isImportKind(undefined)).toBe(false);
      expect(isImportKind(123)).toBe(false);
      expect(isImportKind({})).toBe(false);
      expect(isImportKind([])).toBe(false);
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
    it("should return true for valid settings keys", () => {
      expect(isSettingsKey("boundaries/elements")).toBe(true);
      expect(isSettingsKey("boundaries/ignore")).toBe(true);
      expect(isSettingsKey("boundaries/include")).toBe(true);
      expect(isSettingsKey("boundaries/root-path")).toBe(true);
      expect(isSettingsKey("boundaries/dependency-nodes")).toBe(true);
      expect(isSettingsKey("boundaries/additional-dependency-nodes")).toBe(
        true
      );
      expect(isSettingsKey("boundaries/types")).toBe(true);
      expect(isSettingsKey("boundaries/alias")).toBe(true);
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

  describe("isElementDescriptorMode", () => {
    it("should return true for valid element descriptor modes", () => {
      expect(isElementDescriptorMode("folder")).toBe(true);
      expect(isElementDescriptorMode("file")).toBe(true);
      expect(isElementDescriptorMode("full")).toBe(true);
    });

    it("should return false for invalid element descriptor modes", () => {
      expect(isElementDescriptorMode("invalid")).toBe(false);
      expect(isElementDescriptorMode("FOLDER")).toBe(false);
      expect(isElementDescriptorMode("FILE")).toBe(false);
      expect(isElementDescriptorMode("")).toBe(false);
    });

    it("should return false for non-string values", () => {
      expect(isElementDescriptorMode(null)).toBe(false);
      expect(isElementDescriptorMode(undefined)).toBe(false);
      expect(isElementDescriptorMode(123)).toBe(false);
      expect(isElementDescriptorMode({})).toBe(false);
      expect(isElementDescriptorMode([])).toBe(false);
    });
  });

  describe("isRulePolicy", () => {
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
  });
});
