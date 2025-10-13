import { PLUGIN_NAME } from "../../src/constants/plugin";

const { createConfig } = require("../../src/configs/config");
const plugin = require("../../src/index");

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

      expect(() => createConfig(inputConfig, customName)).toThrow(
        'Invalid rule key "no-console". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "boundaries/", or with the provided plugin name "customBoundaries/".',
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

      expect(() => createConfig(inputConfig)).toThrow(
        'Invalid rule key "eslint-comments/no-unused-disable". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "boundaries/", or with the provided plugin name "boundaries/".',
      );
    });

    it("should throw error when plugin name is a substring of another plugin rule", () => {
      const inputConfig = {
        rules: {
          "boundaries/element-types": [2],
          "boundaries-extra/some-rule": [1], // This should throw error
        },
      };

      expect(() => createConfig(inputConfig, "myPlugin")).toThrow(
        'Invalid rule key "boundaries-extra/some-rule". When using createConfig, all rules must belong to eslint-plugin-boundaries. You can prefix them with the original plugin name "boundaries/", or with the provided plugin name "myPlugin/".',
      );
    });

    it("should preserve file patterns when provided in input", () => {
      const inputConfig = {
        files: ["**/*.tsx", "**/*.jsx"],
        rules: {
          "boundaries/element-types": [2],
        },
      };

      const config = createConfig(inputConfig);

      // Input files should be preserved due to spread operator
      expect(config.files).toEqual(["**/*.tsx", "**/*.jsx"]);
    });

    it("should handle null rules", () => {
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

      expect(() => createConfig(inputConfig)).toThrow(
        "The 'plugins' field is managed by createConfig and should not be provided in the config argument.",
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

      const config = createConfig(inputConfig, customName);

      expect(config.rules).toEqual({
        "customBoundaries/element-types": [2, { default: "disallow" }],
        "customBoundaries/no-private": [1, { allowUncles: true }],
      });
    });
  });
});
