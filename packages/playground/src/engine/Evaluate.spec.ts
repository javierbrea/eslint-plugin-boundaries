// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests evaluate
import { normalizeConfig } from "@boundaries/config";
import type { EntityDescription } from "@boundaries/elements";
import { describeEntity } from "@boundaries/policies";

import type { Sketch, SketchNode } from "../contract";

import { QUICK_START_DESCRIPTIONS } from "./__fixtures__/quickStartDescriptions";
import { evaluate } from "./Evaluate";

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

// Settings and rules of the quick-start scenario of the browser e2e tests (test/browser-e2e/src/scenarios/quick-start.js)
const QUICK_START_SETTINGS = {
  "boundaries/elements": [
    { type: "helper", pattern: "helpers/*" },
    { type: "component", pattern: "components/*/*" },
    { type: "module", pattern: "modules/*" },
  ],
  "boundaries/files": [
    { pattern: "**/*.spec.js", category: "test" },
    { pattern: "**/*.css", category: "style" },
  ],
};

const QUICK_START_RULES = {
  "boundaries/dependencies": [
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
        {
          disallow: { to: { file: { categories: "test" } } },
        },
      ],
    },
  ],
};

const QUICK_START_FILES = [
  "src/helpers/format/index.js",
  "src/components/atoms/Button/index.js",
  "src/components/atoms/Button/Button.spec.js",
  "src/components/atoms/Button/Button.css",
  "src/modules/checkout/index.js",
  "src/index.js",
];

const QUICK_START_CONFIG = JSON.stringify(
  { settings: QUICK_START_SETTINGS, rules: QUICK_START_RULES },
  null,
  2
);

// The config of the `config` state of the mockup: `patern` in the second element descriptor and `"dissallow"` as the default
const MOCKUP_CONFIG = [
  "{",
  "  settings: {",
  '    "boundaries/elements": [',
  '      { type: "helper", pattern: "helpers/*" },',
  '      { type: "component", patern: "components/*/*" },',
  '      { type: "module", pattern: "modules/*" },',
  "    ],",
  '    "boundaries/files": [',
  '      { pattern: "**/*.spec.js", category: "test" },',
  '      { pattern: "**/*.css", category: "style" },',
  "    ],",
  "  },",
  "  rules: {",
  '    "boundaries/dependencies": [2, {',
  '      default: "dissallow",',
  "      policies: [",
  "        {",
  '          from: { element: { type: "component" } },',
  '          allow: { to: { element: { type: "helper" } } },',
  "        },",
  "        {",
  '          from: { element: { type: "module" } },',
  '          allow: { to: { element: { types: ["component", "helper"] } } },',
  "        },",
  "        {",
  "          // No element may import a test file, whatever element it belongs to",
  '          disallow: { to: { file: { categories: "test" } } },',
  "        },",
  "      ],",
  "    }],",
  "  },",
  "}",
].join("\n");

// The quick-start config with a policy that is half typed: `@boundaries/elements` cannot normalize an empty `disallow`
const THROWING_POLICY = "{ disallow: {} }";

const THROWING_CONFIG = QUICK_START_CONFIG.replace(
  '"policies": [',
  `"policies": [\n${THROWING_POLICY},`
);

/**
 * Creates a sketch with the files that are given and no dependencies.
 * @param config The config text.
 * @param files The paths of the files, whose folders are added.
 * @returns The sketch.
 */
function createSketch(config: string, files: readonly string[] = []): Sketch {
  const folders = new Set(
    files.flatMap((file) =>
      file
        .split("/")
        .slice(0, -1)
        .map((_segment, index, segments) =>
          segments.slice(0, index + 1).join("/")
        )
    )
  );
  const tree: SketchNode[] = [
    ...[...folders].map((path): SketchNode => ({ path, kind: "folder" })),
    ...files.map((path): SketchNode => ({ path, kind: "file" })),
  ];
  return { config, tree, dependencies: [] };
}

/**
 * Picks the properties of a description that the plugin's debug output is compared by.
 * @param description The description of a file.
 * @param description.element
 * @param description.file
 * @param description.module
 * @returns Its element types, element path, captured values, file categories and module origin.
 */
function pickDescribed({
  element,
  file,
  module: moduleDescription,
}: EntityDescription) {
  return {
    types: element.types,
    path: element.path,
    captured: element.captured,
    categories: file.categories,
    origin: moduleDescription.origin,
  };
}

describe("Evaluate", () => {
  describe("evaluate", () => {
    describe("with the quick-start config", () => {
      it("should return the sketch it evaluated", () => {
        // Arrange
        const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect(evaluation.sketch).toBe(sketch);
      });

      it("should read the config and find no problems", () => {
        // Arrange
        const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect(evaluation.configParsed).toBe(true);
        expect(evaluation.problems).toEqual([]);
        expect(evaluation.rulesValid).toBe(true);
      });

      it("should describe the six files, and no folder", () => {
        // Arrange
        const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect([...evaluation.files.keys()]).toEqual(QUICK_START_FILES);
      });

      it.each(QUICK_START_FILES)(
        "should describe %s as the plugin does",
        (path) => {
          // Arrange
          const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

          // Act
          const description = evaluate(sketch).files.get(path);

          // Assert
          expect(description).toBeDefined();
          expect(pickDescribed(description!)).toEqual(
            pickDescribed(QUICK_START_DESCRIPTIONS[path])
          );
        }
      );

      it("should describe a relative path as the plugin describes an absolute one under a root path", () => {
        // Arrange
        const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);
        const { settings } = normalizeConfig(
          { settings: QUICK_START_SETTINGS, rules: QUICK_START_RULES },
          { rootPath: "/project" }
        ).value;

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect(evaluation.files).toEqual(
          new Map(
            QUICK_START_FILES.map((path) => [
              path,
              describeEntity(settings, `/project/${path}`),
            ])
          )
        );
      });

      it("should describe the files as it does without a root path when the root path is absolute, because the sketch is the project at that path", () => {
        // Arrange
        const sketch = createSketch(
          JSON.stringify({
            settings: {
              ...QUICK_START_SETTINGS,
              "boundaries/root-path": "/project",
              "boundaries/flag-as-external": { outsideRootPath: true },
            },
            rules: QUICK_START_RULES,
          }),
          QUICK_START_FILES
        );

        // Act
        const { files } = evaluate(sketch);

        // Assert
        expect(
          QUICK_START_FILES.map((path) => pickDescribed(files.get(path)!))
        ).toEqual(
          QUICK_START_FILES.map((path) =>
            pickDescribed(QUICK_START_DESCRIPTIONS[path])
          )
        );
      });

      it("should describe the files under a relative root path as the plugin does with that path under the root of the project", () => {
        // Arrange
        const rootPathSettings = {
          ...QUICK_START_SETTINGS,
          "boundaries/root-path": "./src/",
          "boundaries/flag-as-external": { outsideRootPath: true },
        };
        const sketch = createSketch(
          JSON.stringify({
            settings: rootPathSettings,
            rules: QUICK_START_RULES,
          }),
          [...QUICK_START_FILES, "scripts/build.js"]
        );
        const { settings } = normalizeConfig(
          { settings: rootPathSettings, rules: QUICK_START_RULES },
          { rootPath: "/project/src" }
        ).value;

        // Act
        const { files } = evaluate(sketch);

        // Assert
        expect(
          QUICK_START_FILES.map((path) => pickDescribed(files.get(path)!))
        ).toEqual(
          QUICK_START_FILES.map((path) =>
            pickDescribed(describeEntity(settings, `/project/${path}`))
          )
        );
        expect(files.get("src/index.js")!.module.origin).toBe("local");
        expect(files.get("scripts/build.js")!.module.origin).toBe("external");
      });

      it("should say which files each element type matches", () => {
        // Arrange
        const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

        // Act
        const { elementTypes } = evaluate(sketch);

        // Assert
        expect(
          elementTypes.map(({ type, patterns, files, ignored }) => [
            type,
            patterns,
            files,
            ignored,
          ])
        ).toEqual([
          ["helper", ["helpers/*"], 1, false],
          ["component", ["components/*/*"], 3, false],
          ["module", ["modules/*"], 1, false],
        ]);
      });

      it("should say which files each file category matches", () => {
        // Arrange
        const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

        // Act
        const { fileCategories } = evaluate(sketch);

        // Assert
        expect(
          fileCategories.map(({ category, patterns, files }) => [
            category,
            patterns,
            files,
          ])
        ).toEqual([
          ["test", ["**/*.spec.js"], 1],
          ["style", ["**/*.css"], 1],
        ]);
      });

      it("should summarize the rule with its policies", () => {
        // Arrange
        const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

        // Act
        const { rules } = evaluate(sketch);

        // Assert
        expect(rules).toEqual([
          {
            name: "boundaries/dependencies",
            policies: 3,
            valid: true,
            range: expect.objectContaining({ from: expect.any(Number) }),
          },
        ]);
      });
    });

    describe("with the problems of the config state of the mockup", () => {
      it("should place the warning of the invalid descriptor at its entry", () => {
        // Arrange
        const sketch = createSketch(MOCKUP_CONFIG, QUICK_START_FILES);

        // Act
        const { problems } = evaluate(sketch);

        // Assert
        const warning = problems.find(({ level }) => level === "warning");

        expect(warning).toEqual({
          level: "warning",
          title: "Some element descriptors are invalid and will be ignored.",
          detail: expect.stringContaining("patern"),
          path: ["settings", "boundaries/elements", 1],
          range: {
            from: MOCKUP_CONFIG.indexOf(
              '{ type: "component", patern: "components/*/*" }'
            ),
            to:
              MOCKUP_CONFIG.indexOf(
                '{ type: "component", patern: "components/*/*" }'
              ) + '{ type: "component", patern: "components/*/*" }'.length,
            line: 5,
            column: 7,
          },
          source: "config",
        });
      });

      it("should place the error of the rule options at their value", () => {
        // Arrange
        const sketch = createSketch(MOCKUP_CONFIG, QUICK_START_FILES);

        // Act
        const { problems } = evaluate(sketch);

        // Assert
        const error = problems.find(({ level }) => level === "error");

        expect(error).toEqual({
          level: "error",
          title: "[boundaries/dependencies] Invalid rule options.",
          detail: expect.stringContaining('Value "dissallow" should be equal'),
          path: ["rules", "boundaries/dependencies", 1, "default"],
          range: {
            from: MOCKUP_CONFIG.indexOf('"dissallow"'),
            to: MOCKUP_CONFIG.indexOf('"dissallow"') + '"dissallow"'.length,
            line: 15,
            column: 16,
          },
          source: "config",
        });
      });

      it("should return the two problems in the order of normalizeConfig", () => {
        // Arrange
        const sketch = createSketch(MOCKUP_CONFIG, QUICK_START_FILES);

        // Act
        const { problems } = evaluate(sketch);

        // Assert
        expect(problems.map(({ level, source }) => [level, source])).toEqual([
          ["warning", "config"],
          ["error", "config"],
        ]);
      });

      it("should say that the rules are not valid, and that the rule is not valid and has three policies", () => {
        // Arrange
        const sketch = createSketch(MOCKUP_CONFIG, QUICK_START_FILES);

        // Act
        const { rulesValid, rules } = evaluate(sketch);

        // Assert
        expect(rulesValid).toBe(false);
        expect(rules).toEqual([
          expect.objectContaining({
            name: "boundaries/dependencies",
            policies: 3,
            valid: false,
          }),
        ]);
      });

      it("should say that the descriptor is ignored, and still describe the files with the valid ones", () => {
        // Arrange
        const sketch = createSketch(MOCKUP_CONFIG, QUICK_START_FILES);

        // Act
        const { elementTypes, files } = evaluate(sketch);

        // Assert
        expect(
          elementTypes.map(({ type, ignored, files: count }) => [
            type,
            ignored,
            count,
          ])
        ).toEqual([
          ["helper", false, 1],
          ["component", true, 0],
          ["module", false, 1],
        ]);
        expect(
          files.get("src/components/atoms/Button/index.js")?.element.types
        ).toBeNull();
        expect(files.get("src/helpers/format/index.js")?.element.types).toEqual(
          ["helper"]
        );
      });
    });

    describe("when a policy has a selector that cannot be normalized", () => {
      it("should return an evaluation instead of throwing", () => {
        // Arrange
        const sketch = createSketch(THROWING_CONFIG, QUICK_START_FILES);

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect(evaluation.sketch).toBe(sketch);
        expect(evaluation.configParsed).toBe(true);
      });

      it("should place the warning and the error at the range of the policy", () => {
        // Arrange
        const sketch = createSketch(THROWING_CONFIG, QUICK_START_FILES);
        const from = THROWING_CONFIG.indexOf(THROWING_POLICY);
        const range = {
          from,
          to: from + THROWING_POLICY.length,
          line: 34,
          column: 1,
        };
        const path = ["rules", "boundaries/dependencies", 1, "policies", 0];

        // Act
        const { problems } = evaluate(sketch);

        // Assert
        expect(problems).toEqual([
          {
            level: "warning",
            title:
              "[boundaries/dependencies] Detected an unrecognized selector shape in 1 policy at indices: 0.",
            detail: expect.stringContaining("Check the 'disallow' property."),
            path,
            range,
            source: "config",
          },
          {
            level: "error",
            title: "Invalid entity selector.",
            detail:
              "ESLint stops with this error at the first dependency that the rule checks.",
            path,
            range,
            source: "config",
          },
        ]);
      });

      it("should say that the rules are not valid and that the rule is not valid", () => {
        // Arrange
        const sketch = createSketch(THROWING_CONFIG, QUICK_START_FILES);

        // Act
        const { rulesValid, rules } = evaluate(sketch);

        // Assert
        expect(rulesValid).toBe(false);
        expect(rules).toEqual([
          expect.objectContaining({
            name: "boundaries/dependencies",
            policies: 4,
            valid: false,
          }),
        ]);
      });

      it("should describe the files and summarize the settings as it does without the policy", () => {
        // Arrange
        const sketch = createSketch(THROWING_CONFIG, QUICK_START_FILES);
        const withoutPolicy = evaluate(
          createSketch(QUICK_START_CONFIG, QUICK_START_FILES)
        );

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect(evaluation.files).toEqual(withoutPolicy.files);
        expect(evaluation.elementTypes).toEqual(
          withoutPolicy.elementTypes.map((summary) => ({
            ...summary,
            range: expect.objectContaining({ from: expect.any(Number) }),
          }))
        );
        expect(evaluation.fileCategories).toHaveLength(2);
      });

      it("should return an error for each policy of the entry that throws", () => {
        // Arrange
        const config = THROWING_CONFIG.replace(
          THROWING_POLICY,
          `${THROWING_POLICY}, { allow: {} }`
        );
        const sketch = createSketch(config, QUICK_START_FILES);

        // Act
        const { problems } = evaluate(sketch);

        // Assert
        expect(
          problems
            .filter(({ level }) => level === "error")
            .map(({ path, range }) => [
              path,
              config.slice(range.from, range.to),
            ])
        ).toEqual([
          [
            ["rules", "boundaries/dependencies", 1, "policies", 0],
            THROWING_POLICY,
          ],
          [
            ["rules", "boundaries/dependencies", 1, "policies", 1],
            "{ allow: {} }",
          ],
        ]);
      });

      it("should keep the problems of the rest of the config before those of the entry that throws", () => {
        // Arrange
        const config = `{
  settings: { "boundaries/elements": [{ type: "helper", patern: "helpers/*" }] },
  rules: {
    "boundaries/dependencies": [2, { policies: [{ disallow: {} }] }],
    "boundaries/element-types": ["error", { default: "dissallow" }],
  },
}`;
        const sketch = createSketch(config, QUICK_START_FILES);

        // Act
        const { problems, rules } = evaluate(sketch);

        // Assert
        expect(problems.map(({ path }) => path)).toEqual([
          ["settings", "boundaries/elements", 0],
          ["settings"],
          ["rules", "boundaries/element-types", 1, "default"],
          ["rules", "boundaries/dependencies", 1, "policies", 0],
          ["rules", "boundaries/dependencies", 1, "policies", 0],
        ]);
        expect(
          rules.map(({ name: ruleName, valid }) => [ruleName, valid])
        ).toEqual([
          ["boundaries/dependencies", false],
          ["boundaries/element-types", false],
        ]);
      });

      it("should place the problems of the legacy rules option at the policy", () => {
        // Arrange
        const config = `{
  rules: {
    "boundaries/element-types": [2, { rules: [{ allow: {} }] }],
  },
}`;
        const sketch = createSketch(config, QUICK_START_FILES);
        const from = config.indexOf("{ allow: {} }");

        // Act
        const { problems, rulesValid } = evaluate(sketch);

        // Assert
        expect(rulesValid).toBe(false);
        expect(
          problems
            .filter(({ source }) => source === "config")
            .map(({ level, path, range }) => [level, path, range.from])
        ).toEqual([
          ["warning", ["settings"], 0],
          [
            "warning",
            ["rules", "boundaries/element-types", 1, "rules", 0],
            from,
          ],
          [
            "deprecation",
            ["rules", "boundaries/element-types", 1, "rules"],
            from - 1,
          ],
          ["error", ["rules", "boundaries/element-types", 1, "rules", 0], from],
        ]);
      });

      it("should not count a rule that is off as invalid", () => {
        // Arrange
        const config = `{
  settings: { "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }] },
  rules: {
    "boundaries/dependencies": ["off", { policies: [{ disallow: {} }] }],
  },
}`;
        const sketch = createSketch(config, QUICK_START_FILES);

        // Act
        const { problems, rulesValid, rules } = evaluate(sketch);

        // Assert
        expect(problems).toEqual([]);
        expect(rulesValid).toBe(true);
        expect(rules.map(({ valid }) => valid)).toEqual([true]);
      });
    });

    describe("when the config has keys other than settings and rules", () => {
      it("should warn about them before the diagnostics of the config", () => {
        // Arrange
        const config = `{
  plugins: { boundaries: true },
  settings: { "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }], "boundaries/cache": "yes" },
}`;
        const sketch = createSketch(config, QUICK_START_FILES);

        // Act
        const { configParsed, problems } = evaluate(sketch);

        // Assert
        expect(configParsed).toBe(true);
        expect(problems.map(({ path, level }) => [path, level])).toEqual([
          [["plugins"], "warning"],
          [["settings", "boundaries/cache"], "warning"],
        ]);
      });
    });

    describe("when the config is not one JSON5 object", () => {
      it.each([
        [
          "a syntax error",
          "{\n  settings: {\n    a: 1\n    b: 2\n  }\n}",
          "Unexpected token Identifier found. (4:5)",
        ],
        [
          "a whole eslint.config.js",
          'import boundaries from "eslint-plugin-boundaries";\n\nexport default [{ plugins: { boundaries } }];\n',
          "Unexpected token Identifier found. (1:1)",
        ],
        [
          "a spread",
          "{ ...boundaries.configs.recommended.rules, settings: {} }",
          "Unexpected token Number found. (1:5)",
        ],
        ["a top-level array", "[{ settings: {} }]", "The text is an array."],
      ])(
        "should report only the parse problem for %s",
        (_title, config, detail) => {
          // Arrange
          const sketch = createSketch(config, QUICK_START_FILES);

          // Act
          const evaluation = evaluate(sketch);

          // Assert
          expect(evaluation.configParsed).toBe(false);
          expect(evaluation.problems).toEqual([
            expect.objectContaining({
              level: "error",
              title:
                "The config must be one JSON5 object with settings and rules.",
              detail,
              path: [],
              source: "parse",
            }),
          ]);
        }
      );

      it("should still describe the files, as an empty config does", () => {
        // Arrange
        const sketch = createSketch("{ settings: ", QUICK_START_FILES);

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect([...evaluation.files.keys()]).toEqual(QUICK_START_FILES);
        expect(
          [...evaluation.files.values()].map(({ element }) => element.types)
        ).toEqual([null, null, null, null, null, null]);
      });

      it("should have nothing to summarize, and the rules are not at fault", () => {
        // Arrange
        const sketch = createSketch("{ settings: ", QUICK_START_FILES);

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect([
          evaluation.elementTypes,
          evaluation.fileCategories,
          evaluation.rules,
        ]).toEqual([[], [], []]);
        expect(evaluation.rulesValid).toBe(true);
      });

      it("should not place any path in the text", () => {
        // Arrange
        const sketch = createSketch("[]", QUICK_START_FILES);

        // Act
        const { rangeOf } = evaluate(sketch);

        // Assert
        expect(rangeOf([])).toBeUndefined();
        expect(rangeOf(["settings"])).toBeUndefined();
      });
    });

    describe("rangeOf", () => {
      it("should return the range of the value at a path of the config", () => {
        // Arrange
        const sketch = createSketch(MOCKUP_CONFIG);

        // Act
        const range = evaluate(sketch).rangeOf([
          "rules",
          "boundaries/dependencies",
          1,
          "policies",
          2,
        ]);

        // Assert
        expect(range?.line).toBe(25);
        expect(range?.column).toBe(9);
        expect(
          MOCKUP_CONFIG.slice(range?.from, range?.to).startsWith("{\n")
        ).toBe(true);
      });

      it("should return the range of the deepest value reached when the path is not written", () => {
        // Arrange
        const sketch = createSketch(MOCKUP_CONFIG);
        const { rangeOf } = evaluate(sketch);

        // Act
        const range = rangeOf([
          "rules",
          "boundaries/no-private",
          "allowUncles",
        ]);

        // Assert
        expect(range).toEqual(rangeOf(["rules"]));
      });

      it("should return the whole config for an empty path", () => {
        // Arrange
        const sketch = createSketch(MOCKUP_CONFIG);

        // Act
        const range = evaluate(sketch).rangeOf([]);

        // Assert
        expect(range).toEqual({
          from: 0,
          to: MOCKUP_CONFIG.length,
          line: 1,
          column: 1,
        });
      });
    });

    describe("with an empty tree", () => {
      it("should describe no files and keep the config problems", () => {
        // Arrange
        const sketch = createSketch(MOCKUP_CONFIG);

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect(evaluation.files.size).toBe(0);
        expect(evaluation.problems).toHaveLength(2);
        expect(evaluation.elementTypes.map(({ files }) => files)).toEqual([
          0, 0, 0,
        ]);
      });

      it("should evaluate an empty config", () => {
        // Arrange
        const sketch = createSketch("{}");

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect(evaluation.configParsed).toBe(true);
        expect(evaluation.files.size).toBe(0);
        expect(evaluation.problems).toEqual([
          expect.objectContaining({
            level: "warning",
            path: ["settings"],
            range: { from: 0, to: 2, line: 1, column: 1 },
          }),
        ]);
      });
    });

    describe("memoization", () => {
      it("should return the same evaluation for the same sketch", () => {
        // Arrange
        const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

        // Act
        const first = evaluate(sketch);
        const second = evaluate(sketch);

        // Assert
        expect(second).toBe(first);
      });

      it("should return another evaluation for another sketch, even when it is equal", () => {
        // Arrange
        const first = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);
        const second = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

        // Act
        const evaluation = evaluate(second);

        // Assert
        expect(evaluation).not.toBe(evaluate(first));
        expect(evaluation).toEqual({
          ...evaluate(first),
          sketch: second,
          rangeOf: expect.any(Function),
        });
      });

      it("should not normalize the config again when an edit of the tree leaves its text as it was", () => {
        // Arrange
        const config =
          '{ settings: { "boundaries/cache": true } } // memoization';
        const before = createSketch(config, ["src/a.js"]);
        const after = createSketch(config, ["src/a.js", "src/b.js"]);

        // Act
        const evaluationBefore = evaluate(before);
        const evaluationAfter = evaluate(after);

        // Assert
        expect(normalizeConfig).toHaveBeenCalledTimes(1);
        expect([...evaluationBefore.files.keys()]).toEqual(["src/a.js"]);
        expect([...evaluationAfter.files.keys()]).toEqual([
          "src/a.js",
          "src/b.js",
        ]);
      });

      it("should keep the problems of the config in their place when an edit of the tree leaves its text as it was", () => {
        // Arrange
        const config =
          '{ settings: { "boundaries/cache": "yes" } } // problems';
        const before = createSketch(config, ["src/a.js"]);
        const after = createSketch(config, ["src/b.js"]);

        // Act
        const evaluationBefore = evaluate(before);
        const evaluationAfter = evaluate(after);

        // Assert
        expect(evaluationAfter.problems).toBe(evaluationBefore.problems);
      });

      it("should normalize the config again when its text changes, and remember only the last text", () => {
        // Arrange
        const first = createSketch("{ settings: {} } // first");
        const second = createSketch("{ settings: {} } // second");
        const firstAgain = createSketch("{ settings: {} } // first");

        // Act
        evaluate(first);
        evaluate(second);
        evaluate(firstAgain);

        // Assert
        expect(normalizeConfig).toHaveBeenCalledTimes(3);
      });

      it("should return the same evaluation for the same sketch when the config has a policy that cannot be normalized", () => {
        // Arrange
        const sketch = createSketch(THROWING_CONFIG, QUICK_START_FILES);

        // Act
        const first = evaluate(sketch);
        const second = evaluate(sketch);

        // Assert
        expect(second).toBe(first);
      });

      it("should not normalize a config with a policy that cannot be normalized again when an edit of the tree leaves its text as it was", () => {
        // Arrange
        const before = createSketch(THROWING_CONFIG, ["src/a.js"]);
        const after = createSketch(THROWING_CONFIG, ["src/a.js", "src/b.js"]);
        const evaluationBefore = evaluate(before);
        const normalizations = jest.mocked(normalizeConfig).mock.calls.length;

        // Act
        const evaluationAfter = evaluate(after);

        // Assert
        expect(jest.mocked(normalizeConfig)).toHaveBeenCalledTimes(
          normalizations
        );
        expect(evaluationAfter.problems).toBe(evaluationBefore.problems);
        expect([...evaluationAfter.files.keys()]).toEqual([
          "src/a.js",
          "src/b.js",
        ]);
      });

      it("should not read an unparsable text again either", () => {
        // Arrange
        const config = "{ settings: // unparsable";
        const before = createSketch(config, ["src/a.js"]);
        const after = createSketch(config, ["src/b.js"]);

        // Act
        evaluate(before);
        evaluate(after);

        // Assert
        expect(normalizeConfig).toHaveBeenCalledTimes(1);
      });
    });
  });
});
