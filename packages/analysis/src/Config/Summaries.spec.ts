// cspell:ignore patern -- deliberate typos, the mistakes of the config that the tests summarize
import { normalizeConfig } from "@boundaries/config";

import { areRulesValid } from "../Shared";

import type { ConfigPath, ProjectConfig } from "./Config.types";
import { selectRule } from "./EvaluatedRule";
import {
  summarizeElementTypes,
  summarizeFileCategories,
  summarizeRules,
} from "./Summaries";
import type { SummariesInput } from "./Summaries.types";

const HELPER_DESCRIPTOR = { type: "helper", pattern: "helpers/*" };

const COMPONENT_DESCRIPTOR = { type: "component", pattern: "components/*/*" };

const MODULE_DESCRIPTOR = { type: "module", pattern: "modules/*" };

const TEST_FILES_DESCRIPTOR = { pattern: "**/*.spec.js", category: "test" };

const STYLE_FILES_DESCRIPTOR = { pattern: "**/*.css", category: "style" };

const QUICK_START_DEPENDENCIES_ENTRY = [
  2,
  {
    default: "disallow",
    policies: [
      {
        from: { element: { type: "component" } },
        allow: { to: { element: { type: "helper" } } },
      },
      {
        from: { element: { type: "module" } },
        allow: { to: { element: { types: ["component", "helper"] } } },
      },
      { disallow: { to: { file: { categories: "test" } } } },
    ],
  },
];

const QUICK_START_CONFIG: ProjectConfig = {
  settings: {
    "boundaries/elements": [
      HELPER_DESCRIPTOR,
      COMPONENT_DESCRIPTOR,
      MODULE_DESCRIPTOR,
    ],
    "boundaries/files": [TEST_FILES_DESCRIPTOR, STYLE_FILES_DESCRIPTOR],
  },
  rules: {
    "boundaries/dependencies": QUICK_START_DEPENDENCIES_ENTRY,
    "import/no-cycle": 2,
  },
};

/**
 * Builds the input of the summaries the way the analysis does.
 * @param config The config object, as written.
 * @returns The input of the summaries.
 */
function createInput(config: ProjectConfig): SummariesInput {
  const { value, diagnostics } = normalizeConfig({
    settings: config.settings,
    rules: config.rules,
  });
  return {
    config,
    settings: value.settings,
    diagnostics,
    evaluatedRuleName: selectRule({
      config,
      rules: value.rules,
      rulesValid: areRulesValid(diagnostics),
    }).ruleName,
  };
}

/**
 * Reads the value that a path points to in a config object.
 * @param config The config object, as written.
 * @param path The path from the root of the config object.
 * @returns The value written at the path, or `undefined` when nothing is written there.
 */
function valueAt(config: ProjectConfig, path: ConfigPath): unknown {
  return path.reduce<unknown>(
    (value, key) =>
      (value as Record<string | number, unknown> | undefined)?.[key],
    config
  );
}

describe("Summaries", () => {
  describe("summarizeElementTypes", () => {
    it("should summarize each element descriptor", () => {
      // Arrange
      const input = createInput(QUICK_START_CONFIG);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(
        summaries.map(({ index, type, patterns, ignored }) => ({
          index,
          type,
          patterns,
          ignored,
        }))
      ).toEqual([
        {
          index: 0,
          type: "helper",
          patterns: ["helpers/*"],
          ignored: false,
        },
        {
          index: 1,
          type: "component",
          patterns: ["components/*/*"],
          ignored: false,
        },
        {
          index: 2,
          type: "module",
          patterns: ["modules/*"],
          ignored: false,
        },
      ]);
    });

    it("should give the path of each summary to its descriptor", () => {
      // Arrange
      const input = createInput(QUICK_START_CONFIG);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(
        summaries.map(({ path }) => valueAt(QUICK_START_CONFIG, path))
      ).toEqual([HELPER_DESCRIPTOR, COMPONENT_DESCRIPTOR, MODULE_DESCRIPTOR]);
      expect(summaries[1].path).toEqual(["settings", "boundaries/elements", 1]);
    });

    it("should mark as ignored the descriptors that a diagnostic says are invalid", () => {
      // Arrange
      const input = createInput({
        settings: {
          "boundaries/elements": [
            HELPER_DESCRIPTOR,
            { type: "component", patern: "components/*/*" },
          ],
        },
      });

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({ type: "helper", ignored: false }),
        expect.objectContaining({
          index: 1,
          type: "component",
          patterns: [],
          ignored: true,
        }),
      ]);
    });

    it("should not mark as ignored a valid descriptor that has a warning about one of its options", () => {
      // Arrange
      const input = createInput({
        settings: {
          "boundaries/elements": [{ type: "helper", pattern: "helpers/*.js" }],
        },
      });

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(input.diagnostics.map(({ title }) => title)).toContain(
        "Some element descriptors appear to use file patterns."
      );
      expect(summaries).toEqual([
        expect.objectContaining({ type: "helper", ignored: false }),
      ]);
    });

    it("should name a descriptor without a type by its index", () => {
      // Arrange
      const input = createInput({
        settings: {
          "boundaries/elements": [
            HELPER_DESCRIPTOR,
            { category: "legacy", pattern: ["legacy/*", "old/*"] },
          ],
        },
      });

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries[1]).toEqual(
        expect.objectContaining({
          index: 1,
          type: "#1",
          patterns: ["legacy/*", "old/*"],
          ignored: false,
        })
      );
    });

    it("should summarize each descriptor on its own when descriptors share a type", () => {
      // Arrange
      const input = createInput({
        settings: {
          "boundaries/elements": [
            HELPER_DESCRIPTOR,
            { type: "helper", pattern: "utils/*" },
            MODULE_DESCRIPTOR,
          ],
        },
      });

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries.map(({ index, type }) => [index, type])).toEqual([
        [0, "helper"],
        [1, "helper"],
        [2, "module"],
      ]);
    });

    it("should name an entry that is not an object by its index, as ignored", () => {
      // Arrange
      const input = createInput({
        settings: {
          "boundaries/elements": [5, null, { type: 3, pattern: ["a", 3] }],
        },
      });

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({ type: "#0", patterns: [], ignored: true }),
        expect.objectContaining({ type: "#1", patterns: [], ignored: true }),
        expect.objectContaining({ type: "#2", patterns: ["a"], ignored: true }),
      ]);
    });

    it("should read the legacy descriptors written as strings, in the deprecated setting", () => {
      // Arrange
      const config = {
        settings: { "boundaries/types": ["helper", "component"] },
      };
      const input = createInput(config);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({
          index: 0,
          type: "helper",
          patterns: ["helper/*"],
          ignored: false,
        }),
        expect.objectContaining({ index: 1, type: "component" }),
      ]);
      expect(valueAt(config, summaries[1].path)).toBe("component");
      expect(summaries[1].path).toEqual(["settings", "boundaries/types", 1]);
    });

    it("should prefer boundaries/elements over the deprecated boundaries/types", () => {
      // Arrange
      const input = createInput({
        settings: {
          "boundaries/elements": [{ type: "new", pattern: "new/*" }],
          "boundaries/types": ["old"],
        },
      });

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries.map(({ type }) => type)).toEqual(["new"]);
    });

    it.each([
      ["settings that are not written", {}],
      ["settings that are an array", { settings: [] }],
      ["settings that are null", { settings: null }],
      ["settings that are a string", { settings: "boundaries" }],
      ["no element descriptors", { settings: {} }],
      [
        "element descriptors that are not an array",
        { settings: { "boundaries/elements": "helper" } },
      ],
    ])("should return no summaries for %s", (_title, config) => {
      // Arrange
      const input = createInput(config);

      // Act
      const summaries = summarizeElementTypes(input);

      // Assert
      expect(summaries).toEqual([]);
    });
  });

  describe("summarizeFileCategories", () => {
    it("should summarize each file descriptor, with its path", () => {
      // Arrange
      const input = createInput(QUICK_START_CONFIG);

      // Act
      const summaries = summarizeFileCategories(input);

      // Assert
      expect(
        summaries.map(({ index, category, patterns, path }) => ({
          index,
          category,
          patterns,
          path,
          written: valueAt(QUICK_START_CONFIG, path),
        }))
      ).toEqual([
        {
          index: 0,
          category: "test",
          patterns: ["**/*.spec.js"],
          path: ["settings", "boundaries/files", 0],
          written: TEST_FILES_DESCRIPTOR,
        },
        {
          index: 1,
          category: "style",
          patterns: ["**/*.css"],
          path: ["settings", "boundaries/files", 1],
          written: STYLE_FILES_DESCRIPTOR,
        },
      ]);
    });

    it("should leave out the invalid descriptors and keep the index that the valid ones have in the config object", () => {
      // Arrange
      const input = createInput({
        settings: {
          "boundaries/files": [
            { pattern: "**/*.spec.js" },
            { pattern: ["**/*.css", "**/*.scss"], category: "style" },
            { pattern: "**/*.md", category: 1 },
            { pattern: "**/*.js", category: "script" },
          ],
        },
      });

      // Act
      const summaries = summarizeFileCategories(input);

      // Assert
      expect(
        summaries.map(({ index, category, patterns, path }) => ({
          index,
          category,
          patterns,
          path,
        }))
      ).toEqual([
        {
          index: 1,
          category: "style",
          patterns: ["**/*.css", "**/*.scss"],
          path: ["settings", "boundaries/files", 1],
        },
        {
          index: 3,
          category: "script",
          patterns: ["**/*.js"],
          path: ["settings", "boundaries/files", 3],
        },
      ]);
    });

    it("should summarize each descriptor on its own when descriptors share a category", () => {
      // Arrange
      const input = createInput({
        settings: {
          "boundaries/files": [
            STYLE_FILES_DESCRIPTOR,
            { pattern: "**/*.scss", category: "style" },
          ],
        },
      });

      // Act
      const summaries = summarizeFileCategories(input);

      // Assert
      expect(summaries.map(({ index, category }) => [index, category])).toEqual(
        [
          [0, "style"],
          [1, "style"],
        ]
      );
    });

    it.each([
      ["no file descriptors", { settings: {} }],
      [
        "file descriptors that are not an array",
        { settings: { "boundaries/files": { category: "test" } } },
      ],
      ["settings that are not written", {}],
    ])("should return no summaries for %s", (_title, config) => {
      // Arrange
      const input = createInput(config);

      // Act
      const summaries = summarizeFileCategories(input);

      // Assert
      expect(summaries).toEqual([]);
    });
  });

  describe("summarizeRules", () => {
    it("should summarize the rules of the plugin, and no other", () => {
      // Arrange
      const input = createInput(QUICK_START_CONFIG);

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([
        {
          name: "boundaries/dependencies",
          policies: 3,
          valid: true,
          evaluated: true,
          path: ["rules", "boundaries/dependencies"],
        },
      ]);
      expect(valueAt(QUICK_START_CONFIG, summaries[0].path)).toBe(
        QUICK_START_DEPENDENCIES_ENTRY
      );
    });

    it.each([
      [
        "both are written",
        {
          rules: {
            "boundaries/element-types": 2,
            "boundaries/dependencies": 2,
            "boundaries/no-private": 2,
          },
        },
        [
          ["boundaries/element-types", false],
          ["boundaries/dependencies", true],
          ["boundaries/no-private", false],
        ],
      ],
      [
        "only the deprecated one is written",
        {
          rules: {
            "boundaries/no-private": 2,
            "boundaries/element-types": 2,
          },
        },
        [
          ["boundaries/no-private", false],
          ["boundaries/element-types", true],
        ],
      ],
      [
        "neither is written",
        { rules: { "boundaries/no-private": 2, "import/no-cycle": 2 } },
        [["boundaries/no-private", false]],
      ],
      [
        "the one that is written fails its schema, so that the normalized config leaves it out",
        {
          rules: {
            "boundaries/element-types": 2,
            "boundaries/dependencies": [2, { default: "maybe" }],
          },
        },
        [
          ["boundaries/element-types", false],
          ["boundaries/dependencies", true],
        ],
      ],
    ])(
      "should mark as evaluated the dependencies rule before the deprecated one when %s",
      (_title, config, expected) => {
        // Arrange
        const input = createInput(config);

        // Act
        const summaries = summarizeRules(input);

        // Assert
        expect(
          summaries.map(({ name: ruleName, evaluated }) => [
            ruleName,
            evaluated,
          ])
        ).toEqual(expected);
      }
    );

    it.each([
      [
        "the dependencies rule is off",
        {
          rules: {
            "boundaries/dependencies": "off",
            "boundaries/element-types": [2, {}],
          },
        },
        [
          ["boundaries/dependencies", false],
          ["boundaries/element-types", true],
        ],
      ],
      [
        "the dependencies rule has no options",
        {
          rules: {
            "boundaries/element-types": [2, {}],
            "boundaries/dependencies": [2],
          },
        },
        [
          ["boundaries/element-types", true],
          ["boundaries/dependencies", false],
        ],
      ],
      [
        "the deprecated rule is off",
        {
          rules: {
            "boundaries/element-types": 0,
            "boundaries/dependencies": [2, {}],
          },
        },
        [
          ["boundaries/element-types", false],
          ["boundaries/dependencies", true],
        ],
      ],
      [
        "neither of them runs",
        {
          rules: {
            "boundaries/element-types": 2,
            "boundaries/dependencies": 0,
          },
        },
        [
          ["boundaries/element-types", false],
          ["boundaries/dependencies", true],
        ],
      ],
    ])(
      "should mark as evaluated the first of the two rules that ESLint runs, and the dependencies rule when neither does: %s",
      (_title, config, expected) => {
        // Arrange
        const input = createInput(config);

        // Act
        const summaries = summarizeRules(input);

        // Assert
        expect(
          summaries.map(({ name: ruleName, evaluated }) => [
            ruleName,
            evaluated,
          ])
        ).toEqual(expected);
      }
    );

    it("should mark as evaluated the rule that it is given, whatever the config says", () => {
      // Arrange
      const input: SummariesInput = {
        ...createInput({
          rules: {
            "boundaries/dependencies": [2, {}],
            "boundaries/element-types": [2, {}],
          },
        }),
        evaluatedRuleName: "boundaries/element-types",
      };

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(
        summaries.map(({ name: ruleName, evaluated }) => [ruleName, evaluated])
      ).toEqual([
        ["boundaries/dependencies", false],
        ["boundaries/element-types", true],
      ]);
    });

    it("should count the policies of the options, or the deprecated rules", () => {
      // Arrange
      const input = createInput({
        rules: {
          "boundaries/dependencies": [
            "error",
            { policies: [{ allow: "a" }, { allow: "b" }] },
          ],
          "boundaries/element-types": [
            "warn",
            { rules: [{ from: "a", allow: "b" }] },
          ],
          "boundaries/no-unknown-files": 2,
          "boundaries/no-unknown": ["error"],
          "boundaries/no-private": ["error", { allowUncles: false }],
        },
      });

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(
        summaries.map(({ name: ruleName, policies, valid }) => [
          ruleName,
          policies,
          valid,
        ])
      ).toEqual([
        ["boundaries/dependencies", 2, true],
        ["boundaries/element-types", 1, true],
        ["boundaries/no-unknown-files", 0, true],
        ["boundaries/no-unknown", 0, true],
        ["boundaries/no-private", 0, true],
      ]);
    });

    it("should mark a rule whose options fail the schema as not valid, and count its policies as written", () => {
      // Arrange
      const input = createInput({
        rules: {
          "boundaries/dependencies": [
            2,
            { default: "maybe", policies: [{}, {}, {}] },
          ],
        },
      });

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({
          name: "boundaries/dependencies",
          policies: 3,
          valid: false,
        }),
      ]);
    });

    it("should count no policies when they are not a list", () => {
      // Arrange
      const input = createInput({
        rules: { "boundaries/dependencies": [2, { policies: "all" }] },
      });

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({ policies: 0, valid: false }),
      ]);
    });

    it("should mark as not valid a rule that does not exist and a severity that is not known", () => {
      // Arrange
      const input = createInput({
        rules: {
          "boundaries/typo": 2,
          "boundaries/no-private": "on",
          "boundaries/external": 0,
        },
      });

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(
        summaries.map(({ name: ruleName, valid }) => [ruleName, valid])
      ).toEqual([
        ["boundaries/typo", false],
        ["boundaries/no-private", false],
        ["boundaries/external", true],
      ]);
    });

    it("should not mark as not valid a rule that is off with options that fail the schema, as ESLint does not validate it", () => {
      // Arrange
      const input = createInput({
        rules: { "boundaries/dependencies": ["off", { default: "maybe" }] },
      });

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({
          name: "boundaries/dependencies",
          valid: true,
        }),
      ]);
    });

    it.each([
      ["rules that are not written", {}],
      ["rules that are not an object", { rules: [2] }],
      ["rules of other plugins", { rules: { "import/no-cycle": 2 } }],
    ])("should return no summaries for %s", (_title, config) => {
      // Arrange
      const input = createInput(config);

      // Act
      const summaries = summarizeRules(input);

      // Assert
      expect(summaries).toEqual([]);
    });
  });
});
