// cspell:ignore patern -- a deliberate typo, the mistake of the config that the tests analyze
import { normalizeConfig } from "@boundaries/config";

import { analyzeConfig } from "./Config";
import type { ProjectConfig } from "./Config.types";

// The real normalization, which the tests only count
jest.mock<{ normalizeConfig: typeof normalizeConfig }>(
  "@boundaries/config",
  () => {
    const actual = jest.requireActual<{
      normalizeConfig: typeof normalizeConfig;
    }>("@boundaries/config");
    return { ...actual, normalizeConfig: jest.fn(actual.normalizeConfig) };
  }
);

/** The real normalization, which the tests compare with */
const { normalizeConfig: actualNormalizeConfig } = jest.requireActual<{
  normalizeConfig: typeof normalizeConfig;
}>("@boundaries/config");

const QUICK_START_SETTINGS = {
  "boundaries/elements": [
    { type: "helper", pattern: "helpers/*" },
    { type: "component", patern: "components/*/*" },
  ],
  "boundaries/files": [{ pattern: "**/*.spec.js", category: "test" }],
};

const QUICK_START_RULES = {
  "boundaries/dependencies": [
    "warn",
    {
      default: "allow",
      policies: [
        {
          from: { element: { type: "component" } },
          allow: { to: { element: { type: "helper" } } },
        },
      ],
    },
  ],
  "boundaries/no-private": 2,
};

const QUICK_START_CONFIG: ProjectConfig = {
  settings: QUICK_START_SETTINGS,
  rules: QUICK_START_RULES,
};

const DEPENDENCIES_OPTIONS_PATH = ["rules", "boundaries/dependencies", 1];

describe("Config", () => {
  describe("analyzeConfig", () => {
    describe("when a rule is evaluated", () => {
      it("should return the rule, with the paths of its policies, and no reason", () => {
        // Act
        const analysis = analyzeConfig(QUICK_START_CONFIG);

        // Assert
        expect(analysis.notEvaluated).toBeUndefined();
        expect(analysis.rule).toEqual({
          level: "warning",
          options: expect.objectContaining({ default: "allow" }),
          policies: [
            { index: 0, path: [...DEPENDENCIES_OPTIONS_PATH, "policies", 0] },
          ],
          defaultPolicy: {
            index: null,
            path: [...DEPENDENCIES_OPTIONS_PATH, "default"],
          },
        });
      });

      it("should summarize the policies of the rule and its default", () => {
        // Act
        const { policies } = analyzeConfig(QUICK_START_CONFIG);

        // Assert
        expect(policies).toEqual([
          {
            index: 0,
            action: "allow",
            from: ["component"],
            to: ["helper"],
            path: [...DEPENDENCIES_OPTIONS_PATH, "policies", 0],
          },
          {
            index: null,
            action: "allow",
            from: [],
            to: [],
            path: [...DEPENDENCIES_OPTIONS_PATH, "default"],
          },
        ]);
      });

      it("should say that the rules are valid", () => {
        // Act
        const { rulesValid } = analyzeConfig(QUICK_START_CONFIG);

        // Assert
        expect(rulesValid).toBe(true);
      });
    });

    describe("the summaries of the config", () => {
      it("should summarize the element descriptors, marking as ignored those that the diagnostics say are invalid", () => {
        // Act
        const { elementTypes } = analyzeConfig(QUICK_START_CONFIG);

        // Assert
        expect(elementTypes).toEqual([
          {
            index: 0,
            type: "helper",
            patterns: ["helpers/*"],
            ignored: false,
            path: ["settings", "boundaries/elements", 0],
          },
          {
            index: 1,
            type: "component",
            patterns: [],
            ignored: true,
            path: ["settings", "boundaries/elements", 1],
          },
        ]);
      });

      it("should summarize the file descriptors of the normalized settings", () => {
        // Act
        const { fileCategories } = analyzeConfig(QUICK_START_CONFIG);

        // Assert
        expect(fileCategories).toEqual([
          {
            index: 0,
            category: "test",
            patterns: ["**/*.spec.js"],
            path: ["settings", "boundaries/files", 0],
          },
        ]);
      });

      it("should summarize the rules of the plugin, marking the one that is evaluated", () => {
        // Act
        const { rules } = analyzeConfig(QUICK_START_CONFIG);

        // Assert
        expect(rules).toEqual([
          {
            name: "boundaries/dependencies",
            policies: 1,
            valid: true,
            evaluated: true,
            path: ["rules", "boundaries/dependencies"],
          },
          {
            name: "boundaries/no-private",
            policies: 0,
            valid: true,
            evaluated: false,
            path: ["rules", "boundaries/no-private"],
          },
        ]);
      });
    });

    describe("when no rule is evaluated", () => {
      it.each([
        [
          "rules-invalid",
          false,
          { "boundaries/dependencies": [2, { default: "maybe" }] },
        ],
        ["no-rule", true, { "boundaries/no-private": 2 }],
        [
          "rule-off",
          true,
          { "boundaries/dependencies": ["off", { default: "maybe" }] },
        ],
        ["no-options", true, { "boundaries/dependencies": 2 }],
      ])(
        "should return no rule and no policies, and the reason %s",
        (reason, rulesValid, rules) => {
          // Act
          const analysis = analyzeConfig({
            settings: QUICK_START_SETTINGS,
            rules,
          });

          // Assert
          expect(analysis.rule).toBeUndefined();
          expect(analysis.notEvaluated).toBe(reason);
          expect(analysis.policies).toEqual([]);
          expect(analysis.rulesValid).toBe(rulesValid);
        }
      );

      it("should still mark the rule that says why, and summarize the settings", () => {
        // Act
        const { rules, elementTypes } = analyzeConfig({
          settings: QUICK_START_SETTINGS,
          rules: { "boundaries/dependencies": 0 },
        });

        // Assert
        expect(rules).toEqual([
          expect.objectContaining({
            name: "boundaries/dependencies",
            evaluated: true,
          }),
        ]);
        expect(elementTypes.map(({ type }) => type)).toEqual([
          "helper",
          "component",
        ]);
      });
    });

    describe("the reading of the dependency nodes", () => {
      it.each<[string, ProjectConfig]>([
        ["the quick-start config", QUICK_START_CONFIG],
        ["a config with no settings", { rules: QUICK_START_RULES }],
        ["a config with empty settings and rules", { settings: {}, rules: {} }],
        ["a config whose settings are a list", { settings: [] }],
        ["a config whose settings are a number", { settings: 5 }],
        [
          "a config whose additional nodes repeat a built-in selector with its name and kind",
          {
            settings: {
              ...QUICK_START_SETTINGS,
              "boundaries/additional-dependency-nodes": [
                {
                  selector: "ImportDeclaration[importKind=type] > Literal",
                  kind: "type",
                  name: "import",
                },
              ],
            },
          },
        ],
      ])(
        "should say that the analysis reads the dependency nodes as ESLint does for %s",
        (_title, config) => {
          // Act
          const { dependencyNodesReadAsESLint } = analyzeConfig(config);

          // Assert
          expect(dependencyNodesReadAsESLint).toBe(true);
        }
      );

      it.each([
        [
          "has a selector that is not built-in",
          {
            selector: "ImportDeclaration > Literal",
            kind: "value",
            name: "custom",
          },
        ],
        [
          "gives a built-in selector another name than the other built-in selectors of its syntax and import kind have",
          {
            selector: "ExportNamedDeclaration:not([exportKind=type]) > Literal",
            kind: "value",
            name: "reexport",
          },
        ],
      ])(
        "should say that the analysis does not read the dependency nodes as ESLint does when an additional node %s",
        (_title, node) => {
          // Act
          const { dependencyNodesReadAsESLint } = analyzeConfig({
            settings: {
              ...QUICK_START_SETTINGS,
              "boundaries/additional-dependency-nodes": [node],
            },
            rules: QUICK_START_RULES,
          });

          // Assert
          expect(dependencyNodesReadAsESLint).toBe(false);
        }
      );
    });

    describe("the normalized config", () => {
      it("should return the settings and the diagnostics that normalizeConfig returns", () => {
        // Arrange
        const expected = actualNormalizeConfig(
          { settings: QUICK_START_SETTINGS, rules: QUICK_START_RULES },
          { rootPath: "" }
        );

        // Act
        const { settings, diagnostics } = analyzeConfig(QUICK_START_CONFIG);

        // Assert
        expect(settings).toEqual(expected.value.settings);
        expect(diagnostics).toEqual(expected.diagnostics);
        expect(diagnostics).toEqual([
          expect.objectContaining({
            level: "warning",
            paths: [["settings", "boundaries/elements", 1]],
          }),
        ]);
      });

      it("should return an error at a policy that cannot be normalized instead of throwing, and say that the rules are not valid", () => {
        // Act
        const { diagnostics, rulesValid, notEvaluated, rules } = analyzeConfig({
          rules: {
            "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
          },
        });

        // Assert
        expect(diagnostics).toContainEqual(
          expect.objectContaining({
            level: "error",
            title: "Invalid entity selector.",
            paths: [[...DEPENDENCIES_OPTIONS_PATH, "policies", 0]],
          })
        );
        expect(rulesValid).toBe(false);
        expect(notEvaluated).toBe("rules-invalid");
        expect(rules).toEqual([
          expect.objectContaining({
            name: "boundaries/dependencies",
            policies: 1,
            valid: false,
            evaluated: true,
          }),
        ]);
      });

      it.each([
        ["relative to the root of the project", "./src/", "src"],
        ["not written", undefined, ""],
        ["absolute", "/project/src", ""],
        ["above the root of the project", "../app", ""],
      ])(
        "should normalize the settings with the root path resolved against the root of the project when it is %s",
        (_title, rootPath, expected) => {
          // Act
          const { settings } = analyzeConfig({
            settings: {
              ...QUICK_START_SETTINGS,
              "boundaries/root-path": rootPath,
            },
          });

          // Assert
          expect(settings.rootPath).toBe(expected);
          expect(normalizeConfig).toHaveBeenCalledWith(expect.anything(), {
            rootPath: expected,
          });
        }
      );

      it("should normalize only the settings and the rules of the config object", () => {
        // Arrange
        const config = {
          settings: QUICK_START_SETTINGS,
          rules: QUICK_START_RULES,
          plugins: { boundaries: {} },
        };

        // Act
        analyzeConfig(config);

        // Assert
        expect(normalizeConfig).toHaveBeenCalledWith(
          { settings: QUICK_START_SETTINGS, rules: QUICK_START_RULES },
          { rootPath: "" }
        );
      });

      it("should normalize the config once each time it is called, keeping nothing between calls", () => {
        // Act
        const first = analyzeConfig(QUICK_START_CONFIG);
        const normalizations = jest.mocked(normalizeConfig).mock.calls.length;
        const second = analyzeConfig(QUICK_START_CONFIG);

        // Assert
        expect(normalizations).toBe(1);
        expect(normalizeConfig).toHaveBeenCalledTimes(2);
        expect(second).toEqual(first);
        expect(second).not.toBe(first);
      });
    });
  });
});
