// cspell:ignore patern dissallow -- deliberate typos, the mistakes of the config that the tests evaluate
import { normalizeConfig } from "@boundaries/config";
import type { EntityDescription } from "@boundaries/elements";
import { describeEntity } from "@boundaries/policies";

import type { Sketch, SketchDependency, SketchNode } from "@/contract";

import type {
  DependencyResult,
  Engine,
  FileDescription,
  PolicyRef,
  TextRange,
} from "./engine.types";
import { createEngine } from "./evaluate";
import { QUICK_START_DESCRIPTIONS } from "./quickStartDescriptions.mock";

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

const QUICK_START_OPTIONS = {
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
};

const QUICK_START_RULES = {
  "boundaries/dependencies": [2, QUICK_START_OPTIONS],
};

const QUICK_START_FILES = [
  "src/helpers/format/index.js",
  "src/components/atoms/Button/index.js",
  "src/components/atoms/Button/Button.spec.js",
  "src/components/atoms/Button/Button.css",
  "src/modules/checkout/index.js",
  "src/index.js",
];

// The same files in the order of the tree, which is the order of the files of an evaluation: folders first, then files, each by name
const QUICK_START_FILES_IN_TREE_ORDER = [
  "src/components/atoms/Button/Button.css",
  "src/components/atoms/Button/Button.spec.js",
  "src/components/atoms/Button/index.js",
  "src/helpers/format/index.js",
  "src/modules/checkout/index.js",
  "src/index.js",
];

const QUICK_START_CONFIG = JSON.stringify(
  { settings: QUICK_START_SETTINGS, rules: QUICK_START_RULES },
  null,
  2
);

// The docs pages that the diagnostics of `@boundaries/config` point to
const ELEMENTS_LINK = "https://www.jsboundaries.dev/docs/settings/";
const DEPENDENCIES_LINK =
  "https://www.jsboundaries.dev/docs/rules/dependencies/";

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

// The quick-start config with a capture that is not a list in the helper descriptor, which made describing the files throw until `normalizeConfig` reported it as invalid
const CAPTURE_CONFIG = QUICK_START_CONFIG.replace(
  '"pattern": "helpers/*"',
  '"pattern": "helpers/*",\n        "capture": "name"'
);

/**
 * Creates a sketch with the files that are given.
 * @param config The config text.
 * @param files The paths of the files, whose folders are added.
 * @param dependencies The dependencies of the sketch, none by default.
 * @returns The sketch.
 */
function createSketch(
  config: string,
  files: readonly string[] = [],
  dependencies: readonly SketchDependency[] = []
): Sketch {
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
  return { config, tree, dependencies };
}

/**
 * Builds an import of a value with no names.
 * @param from The path of the file that has it.
 * @param to The path of the file it points to.
 * @returns The dependency.
 */
function importOf(from: string, to: string): SketchDependency {
  return {
    from,
    target: { kind: "node", path: to },
    syntax: "import",
    importKind: "value",
    specifiers: [],
  };
}

/**
 * Reads the text a range covers.
 * @param text The config text.
 * @param range A range of the text.
 * @param range.from
 * @param range.to
 * @returns The text in the range.
 */
function slice(text: string, { from, to }: TextRange): string {
  return text.slice(from, to);
}

/**
 * Writes the config of the quick start with the rule entry that is given.
 * @param ruleName The key of the rule in `rules`.
 * @param entry The entry of the rule.
 * @returns The config text.
 */
function configWithRule(ruleName: string, entry: unknown): string {
  return JSON.stringify(
    { settings: QUICK_START_SETTINGS, rules: { [ruleName]: entry } },
    null,
    2
  );
}

/** The files of the dependencies of the checkout module, a helper, a component and a test file */
const CHECKOUT_FILES = [
  "src/helpers/format/index.js",
  "src/components/atoms/Button/index.js",
  "src/components/atoms/Button/Button.spec.js",
  "src/modules/checkout/index.js",
];

/** The module imports the component, the module imports the test file of the component, and the helper imports the component */
const CHECKOUT_DEPENDENCIES = [
  importOf(
    "src/modules/checkout/index.js",
    "src/components/atoms/Button/index.js"
  ),
  importOf(
    "src/modules/checkout/index.js",
    "src/components/atoms/Button/Button.spec.js"
  ),
  importOf(
    "src/helpers/format/index.js",
    "src/components/atoms/Button/index.js"
  ),
];

/** The files of the quick-start project in the order of the statements of `QUICK_START_STATEMENTS`, which the dependencies below write */
const BUTTON = "src/components/atoms/Button/index.js";
const BUTTON_SPEC = "src/components/atoms/Button/Button.spec.js";
const BUTTON_CSS = "src/components/atoms/Button/Button.css";
const FORMAT = "src/helpers/format/index.js";
const CHECKOUT = "src/modules/checkout/index.js";
const INDEX = "src/index.js";

/** The nine dependencies of the quick-start project, file by file and in the order of their statements, so that the line of each one is the one ESLint reports */
const QUICK_START_DEPENDENCIES: readonly SketchDependency[] = [
  importOf(BUTTON_SPEC, BUTTON),
  importOf(BUTTON, FORMAT),
  importOf(BUTTON, BUTTON_CSS),
  importOf(FORMAT, BUTTON),
  importOf(CHECKOUT, BUTTON),
  importOf(CHECKOUT, FORMAT),
  importOf(CHECKOUT, BUTTON_SPEC),
  {
    ...importOf(CHECKOUT, BUTTON),
    target: { kind: "external", name: "react" },
  },
  importOf(INDEX, CHECKOUT),
];

/**
 * What ESLint 9.39.5 reports for the six files of the quick start, with the statements of `QUICK_START_DEPENDENCIES`, when the options of the quick start are the ones of the rule `boundaries/element-types` and `boundaries/dependencies` is off or has no options, and when it is `boundaries/dependencies` that has them. Both rules print the same messages. It is data only, measured on 2026-11-06 with the workspace build of `@boundaries/eslint-plugin` 7.4.2 and the settings of the quick start, as `QUICK_START_MESSAGES` is.
 */
const ESLINT_REPORTS = [
  {
    path: FORMAT,
    line: 1,
    message:
      'There is no policy allowing dependencies from elements of type "helper" to elements of type "component"',
    level: "error",
  },
  {
    path: CHECKOUT,
    line: 3,
    message:
      'Dependencies to file of category "test" are not allowed. Denied by policy at index 2',
    level: "error",
  },
];

/**
 * Lists the dependencies that were disallowed.
 * @param results The dependencies with their verdicts.
 * @returns For each one that was disallowed, sorted by file and line, its file, its line, its message and its level.
 */
function listDisallowed(results: readonly DependencyResult[]): {
  path: string;
  line: number;
  message: string;
  level: "error" | "warning";
}[] {
  return results
    .flatMap(({ ref, verdict }) =>
      verdict.status === "disallowed"
        ? [
            {
              path: ref.path,
              line: ref.index + 1,
              message: verdict.message,
              level: verdict.level,
            },
          ]
        : []
    )
    .sort((a, b) => a.path.localeCompare(b.path) || a.line - b.line);
}

/**
 * Gets the policy that decided a dependency.
 * @param result The dependency with its verdict.
 * @param result.verdict
 * @returns The policy, or `undefined` when the dependency is not allowed or disallowed by one.
 */
function policyOf({ verdict }: DependencyResult): PolicyRef | undefined {
  return verdict.status === "allowed" || verdict.status === "disallowed"
    ? verdict.policy
    : undefined;
}

/**
 * Picks what the engine keeps of a description of the plugin: the properties that the plugin's debug output is compared by.
 * @param description The description of a file, as `describeEntity` or the plugin gives it.
 * @param description.element The element of the file.
 * @param description.file The file itself.
 * @param description.module The module of the file.
 * @returns Its element types, element path, captured values, file categories and module origin, in the facets of the plugin.
 */
function pickDescribed({
  element,
  file,
  module: moduleDescription,
}: EntityDescription): FileDescription {
  return {
    element: {
      types: element.types,
      path: element.path,
      captured: element.captured,
    },
    file: { categories: file.categories },
    module: { origin: moduleDescription.origin },
  };
}

describe("Evaluate", () => {
  describe("createEngine", () => {
    it("should not share the evaluation of a sketch between engines", () => {
      // Arrange
      const config = '{ settings: { "boundaries/cache": true } } // engines';
      const sketch = createSketch(config, ["src/a.js"]);
      const first = createEngine();
      const second = createEngine();

      // Act
      const evaluationOfFirst = first.evaluate(sketch);
      const evaluationOfSecond = second.evaluate(sketch);

      // Assert
      expect(evaluationOfSecond).not.toBe(evaluationOfFirst);
      expect(evaluationOfSecond).toEqual(evaluationOfFirst);
      expect(normalizeConfig).toHaveBeenCalledTimes(2);
    });

    it("should not share the memory of the last config text between engines", () => {
      // Arrange
      const config = '{ settings: { "boundaries/cache": true } } // last text';
      const first = createEngine();
      const second = createEngine();
      first.evaluate(createSketch(config, ["src/a.js"]));

      // Act
      second.evaluate(createSketch(config, ["src/b.js"]));
      first.evaluate(createSketch(config, ["src/c.js"]));

      // Assert
      expect(normalizeConfig).toHaveBeenCalledTimes(2);
    });
  });

  describe("evaluate", () => {
    let evaluate: Engine["evaluate"];

    beforeEach(() => {
      evaluate = createEngine().evaluate;
    });

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

      it("should describe the six files, and no folder, in the order of the tree", () => {
        // Arrange
        const sketch = createSketch(QUICK_START_CONFIG, QUICK_START_FILES);

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect([...evaluation.files.keys()]).toEqual(
          QUICK_START_FILES_IN_TREE_ORDER
        );
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
          expect(description).toEqual(
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
              pickDescribed(describeEntity(settings, `/project/${path}`)),
            ])
          )
        );
      });

      it.each([
        ["absolute", "/project"],
        ["above the root of the sketch", ".."],
      ])(
        "should describe the files as it does without a root path when the root path is %s, because the sketch is the project at that path",
        (_title, rootPath) => {
          // Arrange
          const sketch = createSketch(
            JSON.stringify({
              settings: {
                ...QUICK_START_SETTINGS,
                "boundaries/root-path": rootPath,
                "boundaries/flag-as-external": { outsideRootPath: true },
              },
              rules: QUICK_START_RULES,
            }),
            QUICK_START_FILES
          );

          // Act
          const { files } = evaluate(sketch);

          // Assert
          expect(QUICK_START_FILES.map((path) => files.get(path))).toEqual(
            QUICK_START_FILES.map((path) =>
              pickDescribed(QUICK_START_DESCRIPTIONS[path])
            )
          );
        }
      );

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
        expect(QUICK_START_FILES.map((path) => files.get(path))).toEqual(
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
            evaluated: true,
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
          links: [ELEMENTS_LINK],
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
          links: [DEPENDENCIES_LINK],
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
            links: [DEPENDENCIES_LINK],
            path,
            range,
            source: "config",
          },
          {
            level: "error",
            title: "Invalid entity selector.",
            detail:
              "ESLint stops with this error at the first dependency that the rule checks.",
            links: [],
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

    describe("when a descriptor has a capture that is not a list", () => {
      it("should place the warning of the invalid descriptor at its entry, as the plugin does, instead of throwing", () => {
        // Arrange
        const sketch = createSketch(CAPTURE_CONFIG, QUICK_START_FILES);
        const descriptor = [
          "{",
          '        "type": "helper",',
          '        "pattern": "helpers/*",',
          '        "capture": "name"',
          "      }",
        ].join("\n");
        const from = CAPTURE_CONFIG.indexOf(descriptor);

        // Act
        const { problems } = evaluate(sketch);

        // Assert
        expect(problems).toEqual([
          {
            level: "warning",
            title: "Some element descriptors are invalid and will be ignored.",
            detail: expect.stringContaining('"capture":"name"'),
            links: [ELEMENTS_LINK],
            path: ["settings", "boundaries/elements", 0],
            range: {
              from,
              to: from + descriptor.length,
              line: 4,
              column: 7,
            },
            source: "config",
          },
        ]);
      });

      it("should describe the files and count them with the other descriptors", () => {
        // Arrange
        const sketch = createSketch(CAPTURE_CONFIG, QUICK_START_FILES);

        // Act
        const { files, elementTypes } = evaluate(sketch);

        // Assert
        expect(
          files.get("src/helpers/format/index.js")?.element.types
        ).toBeNull();
        expect(
          files.get("src/modules/checkout/index.js")?.element.types
        ).toEqual(["module"]);
        expect(
          elementTypes.map(({ type, files: count, ignored }) => [
            type,
            count,
            ignored,
          ])
        ).toEqual([
          ["helper", 0, true],
          ["component", 3, false],
          ["module", 1, false],
        ]);
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

    describe("when boundaries/additional-dependency-nodes keeps a valid node", () => {
      const NODES = `[{ selector: "ImportDeclaration > Literal", kind: "value", name: "custom" }]`;

      const NODES_CONFIG = `{
  settings: {
    "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
    "boundaries/additional-dependency-nodes": ${NODES},
  },
}`;

      it("should warn that the playground does not run the selectors, at the setting", () => {
        // Arrange
        const sketch = createSketch(NODES_CONFIG, QUICK_START_FILES);

        // Act
        const { problems } = evaluate(sketch);

        // Assert
        expect(problems).toEqual([
          {
            level: "warning",
            title:
              'The playground does not run the selectors of "boundaries/additional-dependency-nodes".',
            detail:
              'A statement that only one of them reads is not checked as ESLint checks it: the playground reads a statement only through the built-in selectors of "boundaries/dependency-nodes".',
            links: [],
            path: ["settings", "boundaries/additional-dependency-nodes"],
            range: expect.objectContaining({ line: 4, column: 47 }),
            source: "config",
          },
        ]);
        expect(slice(NODES_CONFIG, problems[0].range)).toBe(NODES);
      });

      it("should return the warning after the problems of the text and the diagnostics of the config", () => {
        // Arrange
        const config = `{
  other: true,
  settings: {
    "boundaries/elements": [{ type: "helper", patern: "helpers/*" }],
    "boundaries/additional-dependency-nodes": ${NODES},
    "boundaries/cache": "yes",
  },
}`;
        const sketch = createSketch(config, QUICK_START_FILES);

        // Act
        const { problems } = evaluate(sketch);

        // Assert
        expect(problems.map(({ path }) => path)).toEqual([
          ["other"],
          ["settings", "boundaries/elements", 0],
          ["settings"],
          ["settings", "boundaries/cache"],
          ["settings", "boundaries/additional-dependency-nodes"],
        ]);
      });

      it("should warn once when several nodes are valid, and still evaluate the dependencies", () => {
        // Arrange
        const config = JSON.stringify(
          {
            settings: {
              ...QUICK_START_SETTINGS,
              "boundaries/additional-dependency-nodes": [
                {
                  selector: "ImportDeclaration > Literal",
                  kind: "value",
                  name: "custom",
                },
                {
                  selector: "ExportAllDeclaration > Literal",
                  kind: "type",
                  name: "other",
                },
              ],
            },
            rules: QUICK_START_RULES,
          },
          null,
          2
        );
        const sketch = createSketch(
          config,
          QUICK_START_FILES,
          QUICK_START_DEPENDENCIES
        );

        // Act
        const { problems, notEvaluated, dependencies } = evaluate(sketch);

        // Assert
        expect(problems).toHaveLength(1);
        expect(notEvaluated).toBeUndefined();
        expect(listDisallowed(dependencies)).toEqual(ESLINT_REPORTS);
      });

      it("should not warn when every node is invalid, and leave the diagnostics of the nodes to the config", () => {
        // Arrange
        const config = NODES_CONFIG.replace(NODES, '[{ kind: "value" }]');
        const sketch = createSketch(config, QUICK_START_FILES);

        // Act
        const { problems } = evaluate(sketch);

        // Assert
        expect(problems.map(({ path }) => path)).toEqual([
          ["settings", "boundaries/additional-dependency-nodes", 0],
          ["settings", "boundaries/additional-dependency-nodes", 0],
        ]);
        expect(problems.map(({ level }) => level)).toEqual([
          "warning",
          "warning",
        ]);
        expect(
          problems.some(({ title }) => title.startsWith("The playground"))
        ).toBe(false);
      });

      it("should not warn when the setting is not written", () => {
        // Act
        const { problems } = evaluate(
          createSketch(QUICK_START_CONFIG, QUICK_START_FILES)
        );

        // Assert
        expect(problems).toEqual([]);
      });

      it("should read a syntax only through the built-in selectors, and check the others as not read", () => {
        // Arrange
        const config = JSON.stringify(
          {
            settings: {
              ...QUICK_START_SETTINGS,
              "boundaries/dependency-nodes": ["import"],
              "boundaries/additional-dependency-nodes": [
                {
                  selector: "CallExpression[callee.name='jest.mock'] > Literal",
                  kind: "value",
                  name: "require",
                },
              ],
            },
            rules: QUICK_START_RULES,
          },
          null,
          2
        );
        const sketch = createSketch(config, QUICK_START_FILES, [
          importOf(FORMAT, BUTTON),
          { ...importOf(FORMAT, BUTTON), syntax: "require" },
        ]);

        // Act
        const { dependencies } = evaluate(sketch);

        // Assert
        expect(dependencies.map(({ verdict }) => verdict.status)).toEqual([
          "disallowed",
          "not-checked",
        ]);
        expect(dependencies[1].verdict).toEqual({
          status: "not-checked",
          reason: "not-read",
        });
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
        expect([...evaluation.files.keys()]).toEqual(
          QUICK_START_FILES_IN_TREE_ORDER
        );
        expect(
          [...evaluation.files.values()].map(({ element }) => element.types)
        ).toEqual([null, null, null, null, null, null]);
      });

      it("should not evaluate the dependencies, whose files and sources it still describes", () => {
        // Arrange
        const sketch = createSketch(
          "{ settings: ",
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect(evaluation.notEvaluated).toBe("config-unparsed");
        expect(evaluation.policies).toEqual([]);
        expect(
          evaluation.dependencies.map(({ ref, source, verdict }) => [
            ref.path,
            ref.index,
            source,
            verdict.status,
          ])
        ).toEqual([
          [
            "src/modules/checkout/index.js",
            0,
            "../../components/atoms/Button",
            "not-evaluated",
          ],
          [
            "src/modules/checkout/index.js",
            1,
            "../../components/atoms/Button/Button.spec",
            "not-evaluated",
          ],
          [
            "src/helpers/format/index.js",
            0,
            "../../components/atoms/Button",
            "not-evaluated",
          ],
        ]);
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
    });

    describe("when the config nests deeper than the stack goes", () => {
      // momoa reads and evaluates the text recursively. In Node.js, a list some 2500 to 3500 levels deep was read by \`parse\` and ran out of stack in \`evaluate\`, and a deeper one runs out in \`parse\`
      it.each([2500, 3000, 3500, 4000, 6000])(
        "should return an evaluation instead of throwing, with a list %d levels deep",
        (depth) => {
          // Arrange
          const sketch = createSketch(
            `{ settings: { "boundaries/elements": ${"[".repeat(depth)}${"]".repeat(depth)} } }`,
            QUICK_START_FILES
          );

          // Act
          const evaluateSketch = () => evaluate(sketch);

          // Assert
          expect(evaluateSketch).not.toThrow();
        }
      );
    });

    describe("with a file node that has nodes under it", () => {
      it("should describe the files that the tree shows, as the sketch counts them", () => {
        // Arrange
        const sketch: Sketch = {
          config: QUICK_START_CONFIG,
          tree: [
            { path: "a", kind: "file" },
            { path: "a/b.js", kind: "file" },
          ],
          dependencies: [],
        };

        // Act
        const { files } = evaluate(sketch);

        // Assert
        expect([...files.keys()]).toEqual(["a/b.js"]);
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

    describe("with the rule that is evaluated", () => {
      it("should evaluate the deprecated element-types rule when the dependencies rule is not written, placing its policies at rules", () => {
        // Arrange
        const config = configWithRule("boundaries/element-types", [
          2,
          {
            default: QUICK_START_OPTIONS.default,
            rules: QUICK_START_OPTIONS.policies,
          },
        ]);
        const sketch = createSketch(
          config,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );

        // Act
        const { dependencies, policies, rules, notEvaluated } =
          evaluate(sketch);

        // Assert
        expect(notEvaluated).toBeUndefined();
        expect(dependencies.map(({ verdict }) => verdict.status)).toEqual([
          "allowed",
          "disallowed",
          "disallowed",
        ]);
        expect(
          rules.map(({ name: ruleName, evaluated }) => [ruleName, evaluated])
        ).toEqual([["boundaries/element-types", true]]);
        expect(
          policies.map(({ index, decided, disallowed }) => [
            index,
            decided,
            disallowed,
          ])
        ).toEqual([
          [0, 0, 0],
          [1, 1, 0],
          [2, 1, 1],
          [null, 1, 1],
        ]);
        expect(slice(config, policies[2].range).replace(/\s+/g, " ")).toBe(
          '{ "disallow": { "to": { "file": { "categories": "test" } } } }'
        );
      });

      it("should evaluate the dependencies rule and not the deprecated one when both are written", () => {
        // Arrange
        const config = JSON.stringify({
          settings: QUICK_START_SETTINGS,
          rules: {
            "boundaries/element-types": [2, { default: "allow" }],
            "boundaries/dependencies": [2, { default: "disallow" }],
          },
        });
        const sketch = createSketch(
          config,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );

        // Act
        const { dependencies, rules } = evaluate(sketch);

        // Assert
        expect(dependencies.map(({ verdict }) => verdict.status)).toEqual([
          "disallowed",
          "disallowed",
          "disallowed",
        ]);
        expect(
          rules.map(({ name: ruleName, evaluated }) => [ruleName, evaluated])
        ).toEqual([
          ["boundaries/element-types", false],
          ["boundaries/dependencies", true],
        ]);
      });

      it.each([
        ["off", "off"],
        ["off by its number", 0],
        ["written with only a severity", [2]],
        ["written with only a severity as a number", 2],
      ])(
        "should evaluate the deprecated element-types rule, as ESLint reports through it, when the dependencies rule is %s",
        (_title, entry) => {
          // Arrange
          const config = JSON.stringify(
            {
              settings: QUICK_START_SETTINGS,
              rules: {
                "boundaries/dependencies": entry,
                "boundaries/element-types": [2, QUICK_START_OPTIONS],
              },
            },
            null,
            2
          );
          const sketch = createSketch(
            config,
            QUICK_START_FILES,
            QUICK_START_DEPENDENCIES
          );

          // Act
          const { dependencies, policies, rules, notEvaluated } =
            evaluate(sketch);

          // Assert
          expect(notEvaluated).toBeUndefined();
          expect(listDisallowed(dependencies)).toEqual(ESLINT_REPORTS);
          expect(
            rules.map(({ name: ruleName, evaluated }) => [ruleName, evaluated])
          ).toEqual([
            ["boundaries/dependencies", false],
            ["boundaries/element-types", true],
          ]);
          expect(
            policies.map(({ index, decided, disallowed }) => [
              index,
              decided,
              disallowed,
            ])
          ).toEqual([
            [0, 1, 0],
            [1, 2, 0],
            [2, 1, 1],
            [null, 1, 1],
          ]);
          expect(slice(config, policies[2].range).replace(/\s+/g, " ")).toBe(
            '{ "disallow": { "to": { "file": { "categories": "test" } } } }'
          );
        }
      );

      it.each([
        ["off", "off"],
        ["off by its number", 0],
      ])(
        "should evaluate the dependencies rule, as ESLint reports through it, when the deprecated rule is %s",
        (_title, entry) => {
          // Arrange
          const config = JSON.stringify(
            {
              settings: QUICK_START_SETTINGS,
              rules: {
                "boundaries/element-types": entry,
                "boundaries/dependencies": [2, QUICK_START_OPTIONS],
              },
            },
            null,
            2
          );
          const sketch = createSketch(
            config,
            QUICK_START_FILES,
            QUICK_START_DEPENDENCIES
          );

          // Act
          const { dependencies, rules, notEvaluated } = evaluate(sketch);

          // Assert
          expect(notEvaluated).toBeUndefined();
          expect(listDisallowed(dependencies)).toEqual(ESLINT_REPORTS);
          expect(
            rules.map(({ name: ruleName, evaluated }) => [ruleName, evaluated])
          ).toEqual([
            ["boundaries/element-types", false],
            ["boundaries/dependencies", true],
          ]);
        }
      );

      it.each([
        ["rule-off", "the dependencies rule is off", "off", [2]],
        ["rule-off", "both rules are off", "off", "off"],
        ["rule-off", "the deprecated rule has no options", 0, 2],
        [
          "no-options",
          "the dependencies rule has no options and the deprecated rule is off",
          2,
          "off",
        ],
      ])(
        "should say %s, as the dependencies rule, when no rule runs because %s",
        (reason, _title, dependenciesEntry, elementTypesEntry) => {
          // Arrange
          const config = JSON.stringify(
            {
              settings: QUICK_START_SETTINGS,
              rules: {
                "boundaries/element-types": elementTypesEntry,
                "boundaries/dependencies": dependenciesEntry,
              },
            },
            null,
            2
          );
          const sketch = createSketch(
            config,
            QUICK_START_FILES,
            QUICK_START_DEPENDENCIES
          );

          // Act
          const { dependencies, rules, notEvaluated } = evaluate(sketch);

          // Assert
          expect(notEvaluated).toBe(reason);
          expect(
            dependencies.every(
              ({ verdict }) => verdict.status === "not-evaluated"
            )
          ).toBe(true);
          expect(
            rules.map(({ name: ruleName, evaluated }) => [ruleName, evaluated])
          ).toEqual([
            ["boundaries/element-types", false],
            ["boundaries/dependencies", true],
          ]);
        }
      );

      it("should disallow with the level warning when the severity is warn", () => {
        // Arrange
        const config = configWithRule("boundaries/dependencies", [
          "warn",
          QUICK_START_OPTIONS,
        ]);
        const sketch = createSketch(
          config,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );

        // Act
        const { dependencies } = evaluate(sketch);

        // Assert
        expect(dependencies[0].verdict.status).toBe("allowed");
        expect(listDisallowed(dependencies).map(({ level }) => level)).toEqual([
          "warning",
          "warning",
        ]);
      });

      it("should render the custom message of the home for the policy that decides", () => {
        // Arrange
        const config = configWithRule("boundaries/dependencies", [
          2,
          {
            ...QUICK_START_OPTIONS,
            policies: [
              ...QUICK_START_OPTIONS.policies.slice(0, 2),
              {
                ...QUICK_START_OPTIONS.policies[2],
                message:
                  "Never import test files from {{ from.element.types.[0] }}s",
              },
            ],
          },
        ]);
        const sketch = createSketch(config, CHECKOUT_FILES, [
          CHECKOUT_DEPENDENCIES[1],
        ]);

        // Act
        const { dependencies } = evaluate(sketch);

        // Assert
        expect(dependencies[0].verdict).toMatchObject({
          status: "disallowed",
          policy: { index: 2 },
          message: "Never import test files from modules",
        });
      });

      it("should disallow with the error and no policy when a custom message fails to render, and count it for no policy", () => {
        // Arrange
        const config = configWithRule("boundaries/dependencies", [
          2,
          {
            ...QUICK_START_OPTIONS,
            policies: [
              ...QUICK_START_OPTIONS.policies.slice(0, 2),
              {
                ...QUICK_START_OPTIONS.policies[2],
                message: "Never import {{ unknownHelper from }}",
              },
            ],
          },
        ]);
        const sketch = createSketch(
          config,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );

        // Act
        const { dependencies, policies } = evaluate(sketch);

        // Assert
        expect(dependencies[1].verdict).toEqual({
          status: "disallowed",
          policy: undefined,
          message: expect.stringContaining(
            'The custom message "Never import {{ unknownHelper from }}" of the policy at index 2 failed to render'
          ),
          level: "error",
        });
        expect(
          policies.map(({ index, decided, disallowed }) => [
            index,
            decided,
            disallowed,
          ])
        ).toEqual([
          [0, 0, 0],
          [1, 1, 0],
          [2, 0, 0],
          [null, 1, 1],
        ]);
      });

      it("should disallow with the message that says it renders empty, and count it for the policy that decided", () => {
        // Arrange
        const config = configWithRule("boundaries/dependencies", [
          2,
          {
            ...QUICK_START_OPTIONS,
            policies: [
              ...QUICK_START_OPTIONS.policies.slice(0, 2),
              {
                ...QUICK_START_OPTIONS.policies[2],
                message: "{{from.element.parents.[0].type}}",
              },
            ],
          },
        ]);
        const sketch = createSketch(
          config,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );

        // Act
        const { dependencies, policies } = evaluate(sketch);

        // Assert
        expect(dependencies[1].verdict).toEqual({
          status: "disallowed",
          policy: { index: 2, range: policies[2].range },
          message:
            'The custom message "{{from.element.parents.[0].type}}" of the policy at index 2 renders to an empty text for this dependency, and ESLint stops with an error when a rule reports a problem with no message.',
          level: "error",
        });
        expect(
          policies.map(({ index, decided, disallowed, errors }) => [
            index,
            decided,
            disallowed,
            errors,
          ])
        ).toEqual([
          [0, 0, 0, 0],
          [1, 1, 0, 0],
          [2, 1, 1, 1],
          [null, 1, 1, 1],
        ]);
      });

      it("should pass the exported name of an export from with an alias to the policies", () => {
        // Arrange
        const config = configWithRule("boundaries/dependencies", [
          2,
          {
            default: "allow",
            policies: [
              {
                disallow: {
                  to: { element: { type: "helper" } },
                  dependency: { specifiers: "round" },
                },
              },
            ],
          },
        ]);
        const aliased: SketchDependency = {
          ...importOf(
            "src/modules/checkout/index.js",
            "src/helpers/format/index.js"
          ),
          syntax: "export-from",
          specifiers: [{ kind: "named", name: "floor", alias: "round" }],
        };
        const renamed: SketchDependency = {
          ...aliased,
          specifiers: [{ kind: "named", name: "round", alias: "r" }],
        };
        const sketch = createSketch(
          config,
          ["src/modules/checkout/index.js", "src/helpers/format/index.js"],
          [aliased, renamed]
        );

        // Act
        const { dependencies } = evaluate(sketch);

        // Assert
        expect(dependencies.map(({ verdict }) => verdict.status)).toEqual([
          "disallowed",
          "allowed",
        ]);
      });
    });

    describe("while no dependency is evaluated", () => {
      it.each([
        [
          "config-unparsed",
          "it is not one JSON5 object",
          "{ settings: // unparsable",
        ],
        ["rules-invalid", "a default fails the schema", MOCKUP_CONFIG],
        ["rules-invalid", "a policy cannot be normalized", THROWING_CONFIG],
        [
          "no-rule",
          "no rule is written",
          JSON.stringify({ settings: QUICK_START_SETTINGS, rules: {} }),
        ],
        [
          "no-rule",
          "only another rule of the plugin is written",
          configWithRule("boundaries/no-private", [2, { allowUncles: false }]),
        ],
        [
          "rule-off",
          "the dependencies rule is off by its number",
          configWithRule("boundaries/dependencies", 0),
        ],
        [
          "rule-off",
          "the dependencies rule is off with options",
          configWithRule("boundaries/dependencies", [
            "off",
            QUICK_START_OPTIONS,
          ]),
        ],
        [
          "rule-off",
          "the deprecated rule is the one written, and it is off",
          configWithRule("boundaries/element-types", [
            "off",
            QUICK_START_OPTIONS,
          ]),
        ],
        [
          "no-options",
          "the dependencies rule is only a severity",
          configWithRule("boundaries/dependencies", 2),
        ],
        [
          "no-options",
          "the dependencies rule is a list with only a severity",
          configWithRule("boundaries/dependencies", ["warn"]),
        ],
      ])(
        "should say %s and give every dependency the verdict not evaluated when %s",
        (reason, _title, config) => {
          // Arrange
          const sketch = createSketch(config, CHECKOUT_FILES, [
            CHECKOUT_DEPENDENCIES[0],
            CHECKOUT_DEPENDENCIES[2],
          ]);

          // Act
          const evaluation = evaluate(sketch);

          // Assert
          expect(evaluation.notEvaluated).toBe(reason);
          expect(evaluation.policies).toEqual([]);
          expect(evaluation.dependencies).toEqual([
            {
              dependency: CHECKOUT_DEPENDENCIES[0],
              ref: { path: "src/modules/checkout/index.js", index: 0 },
              source: "../../components/atoms/Button",
              verdict: { status: "not-evaluated" },
            },
            {
              dependency: CHECKOUT_DEPENDENCIES[2],
              ref: { path: "src/helpers/format/index.js", index: 0 },
              source: "../../components/atoms/Button",
              verdict: { status: "not-evaluated" },
            },
          ]);
        }
      );

      it("should keep saying that the rules are valid when the dependencies are not evaluated for another reason", () => {
        // Arrange
        const sketch = createSketch(
          configWithRule("boundaries/dependencies", 0),
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );

        // Act
        const evaluation = evaluate(sketch);

        // Assert
        expect(evaluation.rulesValid).toBe(true);
        expect(evaluation.rules).toEqual([
          expect.objectContaining({
            name: "boundaries/dependencies",
            evaluated: true,
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

      it("should return the same dependencies and policies for the same sketch", () => {
        // Arrange
        const sketch = createSketch(
          QUICK_START_CONFIG,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );

        // Act
        const first = evaluate(sketch);
        const second = evaluate(sketch);

        // Assert
        expect(second.dependencies).toBe(first.dependencies);
        expect(second.policies).toBe(first.policies);
      });

      it("should evaluate the new dependencies of a sketch that keeps the config text, without normalizing the config again", () => {
        // Arrange
        const before = createSketch(
          QUICK_START_CONFIG,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES.slice(0, 1)
        );
        const after = createSketch(
          QUICK_START_CONFIG,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );
        const evaluationBefore = evaluate(before);

        // Act
        const evaluationAfter = evaluate(after);

        // Assert
        expect(normalizeConfig).toHaveBeenCalledTimes(1);
        expect(evaluationBefore.dependencies).toHaveLength(1);
        expect(evaluationAfter.dependencies).toHaveLength(3);
        expect(evaluationAfter.dependencies[0].verdict.status).toBe("allowed");
      });

      it("should give the verdicts of two sketches with the same config text the same reference to the policy that decided", () => {
        // Arrange
        const before = createSketch(
          QUICK_START_CONFIG,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES
        );
        const after = createSketch(
          QUICK_START_CONFIG,
          CHECKOUT_FILES,
          CHECKOUT_DEPENDENCIES.slice(0, 2)
        );
        const decidedBefore = evaluate(before).dependencies.map(policyOf);

        // Act
        const decidedAfter = evaluate(after).dependencies.map(policyOf);

        // Assert
        expect(decidedBefore[0]).toBeDefined();
        expect(decidedAfter[0]).toBe(decidedBefore[0]);
        expect(decidedAfter[1]).toBe(decidedBefore[1]);
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
