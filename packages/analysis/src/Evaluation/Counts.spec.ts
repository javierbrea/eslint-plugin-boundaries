// cspell:ignore patern -- deliberate typos, the mistakes of the config that the tests count the files of
import { analyzeConfig } from "../Config";
import type {
  ConfigAnalysis,
  ElementTypeSummary,
  EvaluatedRule,
  FileCategorySummary,
  ProjectConfig,
} from "../Config";

import {
  addElementTypeFiles,
  addFileCategoryFiles,
  addPolicyDecisions,
} from "./Counts";
import { describeFiles } from "./DescribeFiles";
import type {
  DependencyResult,
  DependencyVerdict,
  ProjectDependency,
} from "./Evaluation.types";
import { getPolicies } from "./PoliciesInstances";

const QUICK_START_CONFIG: ProjectConfig = {
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: "helpers/*" },
      { type: "component", pattern: "components/*/*" },
      { type: "module", pattern: "modules/*" },
    ],
    "boundaries/files": [
      { pattern: "**/*.spec.js", category: "test" },
      { pattern: "**/*.css", category: "style" },
    ],
  },
  rules: {
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
          { disallow: { to: { file: { categories: "test" } } } },
        ],
      },
    ],
    "import/no-cycle": 2,
  },
};

const QUICK_START_FILES = [
  "src/helpers/format/index.js",
  "src/components/atoms/Button/index.js",
  "src/components/atoms/Button/Button.spec.js",
  "src/components/atoms/Button/Button.css",
  "src/modules/checkout/index.js",
  "src/index.js",
];

const DEPENDENCY: ProjectDependency = {
  from: "src/a.js",
  target: { kind: "file", path: "src/b.js" },
  syntax: "import",
  importKind: "value",
  specifiers: [],
  source: "./b",
};

/**
 * Adds the files of a project to the summaries of the element descriptors, with the config analyzed and the files described as the evaluation does.
 * @param config The config object, as written.
 * @param files The paths of the files of the project.
 * @returns The summaries of the element descriptors with their files.
 */
function countElementTypes(
  config: ProjectConfig,
  files: readonly string[] = []
): ElementTypeSummary[] {
  const { settings, elementTypes } = analyzeConfig(config);
  return addElementTypeFiles(
    elementTypes,
    describeFiles(getPolicies(settings), settings, files).elementDescriptorFiles
  );
}

/**
 * Adds the files of a project to the summaries of the file descriptors, with the config analyzed and the files described as the evaluation does.
 * @param config The config object, as written.
 * @param files The paths of the files of the project.
 * @returns The summaries of the file descriptors with their files.
 */
function countFileCategories(
  config: ProjectConfig,
  files: readonly string[] = []
): FileCategorySummary[] {
  const { settings, fileCategories } = analyzeConfig(config);
  return addFileCategoryFiles(
    fileCategories,
    describeFiles(getPolicies(settings), settings, files).fileDescriptorFiles
  );
}

/**
 * Analyzes a config object that has a rule to evaluate, as the evaluation receives it.
 * @param config The config object, as written.
 * @returns The rule that is evaluated and the summaries of its policies, without the dependencies they decided.
 */
function analyzeRule(config: ProjectConfig): {
  rule: EvaluatedRule;
  policies: ConfigAnalysis["policies"];
} {
  const { rule, policies } = analyzeConfig(config);
  if (rule === undefined) {
    throw new Error("The config object should have a rule to evaluate");
  }
  return { rule, policies };
}

/**
 * Builds the result of a dependency with the verdict that it is given.
 * @param verdict What the analysis says about it.
 * @returns The result.
 */
function resultOf(verdict: DependencyVerdict): DependencyResult {
  return {
    dependency: DEPENDENCY,
    ref: { path: DEPENDENCY.from, index: 0 },
    description: undefined,
    verdict,
  };
}

/**
 * Builds the result of a dependency that a policy allowed.
 * @param rule The rule.
 * @param index The index of the policy, or `null` for the default.
 * @returns The result.
 */
function allowedBy(rule: EvaluatedRule, index: number | null) {
  return resultOf({
    status: "allowed",
    policy: index === null ? rule.defaultPolicy : rule.policies[index],
  });
}

/**
 * Builds the result of a dependency that a policy disallowed.
 * @param rule The rule.
 * @param index The index of the policy, or `null` for the default.
 * @param level The level of the verdict: `error` unless the rule is a warning.
 * @returns The result.
 */
function disallowedBy(
  rule: EvaluatedRule,
  index: number | null,
  level: "error" | "warning" = "error"
) {
  return resultOf({
    status: "disallowed",
    policy: index === null ? rule.defaultPolicy : rule.policies[index],
    message: "Not allowed",
    level,
  });
}

describe("Counts", () => {
  describe("addElementTypeFiles", () => {
    it("should add to each element descriptor the files whose element it gives its type to", () => {
      // Act
      const summaries = countElementTypes(
        QUICK_START_CONFIG,
        QUICK_START_FILES
      );

      // Assert
      expect(
        summaries.map(({ index, type, patterns, files, ignored }) => ({
          index,
          type,
          patterns,
          files,
          ignored,
        }))
      ).toEqual([
        {
          index: 0,
          type: "helper",
          patterns: ["helpers/*"],
          files: 1,
          ignored: false,
        },
        {
          index: 1,
          type: "component",
          patterns: ["components/*/*"],
          files: 3,
          ignored: false,
        },
        {
          index: 2,
          type: "module",
          patterns: ["modules/*"],
          files: 1,
          ignored: false,
        },
      ]);
    });

    it("should count no files for the descriptors that a diagnostic says are invalid", () => {
      // Arrange
      const config = {
        settings: {
          "boundaries/elements": [
            { type: "helper", pattern: "helpers/*" },
            { type: "component", patern: "components/*/*" },
          ],
        },
      };

      // Act
      const summaries = countElementTypes(config, QUICK_START_FILES);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({ type: "helper", files: 1, ignored: false }),
        expect.objectContaining({
          index: 1,
          type: "component",
          patterns: [],
          files: 0,
          ignored: true,
        }),
      ]);
    });

    it("should give each descriptor after an ignored one the files of its own", () => {
      // Arrange
      const config = {
        settings: {
          "boundaries/elements": [
            { type: "helper", pattern: "helpers/*" },
            { type: "component", patern: "components/*/*" },
            { type: "module", pattern: "modules/*" },
          ],
        },
      };

      // Act
      const summaries = countElementTypes(config, [
        "src/helpers/format/index.js",
        "src/components/atoms/Button/index.js",
        "src/modules/checkout/index.js",
        "src/modules/cart/index.js",
      ]);

      // Assert
      expect(
        summaries.map(({ type, files, ignored }) => [type, files, ignored])
      ).toEqual([
        ["helper", 1, false],
        ["component", 0, true],
        ["module", 2, false],
      ]);
    });

    it("should count the files that a descriptor without a type matches", () => {
      // Arrange
      const config = {
        settings: {
          "boundaries/elements": [
            { type: "helper", pattern: "helpers/*" },
            { category: "legacy", pattern: ["legacy/*", "old/*"] },
          ],
        },
      };

      // Act
      const summaries = countElementTypes(config, [
        "src/legacy/a/index.js",
        "src/helpers/format/index.js",
      ]);

      // Assert
      expect(summaries[1]).toEqual(
        expect.objectContaining({
          index: 1,
          type: "#1",
          patterns: ["legacy/*", "old/*"],
          files: 1,
          ignored: false,
        })
      );
    });

    it("should count the files of each descriptor when descriptors share a type", () => {
      // Arrange
      const config = {
        settings: {
          "boundaries/elements": [
            { type: "helper", pattern: "helpers/*" },
            { type: "helper", pattern: "utils/*" },
            { type: "module", pattern: "modules/*" },
          ],
        },
      };

      // Act
      const summaries = countElementTypes(config, [
        "src/helpers/format/index.js",
        "src/utils/dates/index.js",
        "src/utils/numbers/index.js",
      ]);

      // Assert
      expect(summaries.map(({ type, files }) => [type, files])).toEqual([
        ["helper", 1],
        ["helper", 2],
        ["module", 0],
      ]);
    });

    it.each([
      [
        "only for the first one, which is the only one that labels it",
        {},
        [1, 0],
      ],
      [
        "for each one when elements-single-match is off",
        { "boundaries/elements-single-match": false },
        [1, 1],
      ],
    ])(
      "should count a file that two descriptors match %s",
      (_title, singleMatch, expected) => {
        // Arrange
        const config = {
          settings: {
            ...singleMatch,
            "boundaries/elements": [
              { type: "helper", pattern: "helpers/*" },
              { type: "helper", pattern: "helpers/*" },
            ],
          },
        };

        // Act
        const summaries = countElementTypes(config, [
          "src/helpers/format/index.js",
        ]);

        // Assert
        expect(summaries.map(({ files }) => files)).toEqual(expected);
      }
    );

    it("should count the files of the legacy descriptors written as strings, in the deprecated setting", () => {
      // Arrange
      const config = {
        settings: { "boundaries/types": ["helper", "component"] },
      };

      // Act
      const summaries = countElementTypes(config, [
        "src/helper/format/index.js",
      ]);

      // Assert
      expect(summaries).toEqual([
        expect.objectContaining({
          index: 0,
          type: "helper",
          patterns: ["helper/*"],
          files: 1,
          ignored: false,
        }),
        expect.objectContaining({ index: 1, type: "component", files: 0 }),
      ]);
    });

    it("should keep everything else of each summary", () => {
      // Arrange
      const { elementTypes } = analyzeConfig(QUICK_START_CONFIG);

      // Act
      const summaries = addElementTypeFiles(elementTypes, [4, 5, 6]);

      // Assert
      expect(summaries).toEqual(
        elementTypes.map((summary, index) => ({
          ...summary,
          files: [4, 5, 6][index],
        }))
      );
    });
  });

  describe("addFileCategoryFiles", () => {
    it("should add to each file descriptor the files it gives its category to", () => {
      // Act
      const summaries = countFileCategories(
        QUICK_START_CONFIG,
        QUICK_START_FILES
      );

      // Assert
      expect(
        summaries.map(({ index, category, patterns, files, path }) => ({
          index,
          category,
          patterns,
          files,
          path,
        }))
      ).toEqual([
        {
          index: 0,
          category: "test",
          patterns: ["**/*.spec.js"],
          files: 1,
          path: ["settings", "boundaries/files", 0],
        },
        {
          index: 1,
          category: "style",
          patterns: ["**/*.css"],
          files: 1,
          path: ["settings", "boundaries/files", 1],
        },
      ]);
    });

    it("should count the files of the valid descriptors, which keep the index they have in the config object, leaving out the invalid ones", () => {
      // Arrange
      const config = {
        settings: {
          "boundaries/files": [
            { pattern: "**/*.spec.js" },
            { pattern: ["**/*.css", "**/*.scss"], category: "style" },
            { pattern: "**/*.md", category: 1 },
            { pattern: "**/*.js", category: "script" },
          ],
        },
      };

      // Act
      const summaries = countFileCategories(config, [
        "a.css",
        "b.scss",
        "c.js",
      ]);

      // Assert
      expect(
        summaries.map(({ index, category, patterns, files, path }) => ({
          index,
          category,
          patterns,
          files,
          path,
        }))
      ).toEqual([
        {
          index: 1,
          category: "style",
          patterns: ["**/*.css", "**/*.scss"],
          files: 2,
          path: ["settings", "boundaries/files", 1],
        },
        {
          index: 3,
          category: "script",
          patterns: ["**/*.js"],
          files: 1,
          path: ["settings", "boundaries/files", 3],
        },
      ]);
    });

    it("should count the files of each descriptor when descriptors share a category", () => {
      // Arrange
      const config = {
        settings: {
          "boundaries/files": [
            { pattern: "**/*.css", category: "style" },
            { pattern: "**/*.scss", category: "style" },
          ],
        },
      };

      // Act
      const summaries = countFileCategories(config, [
        "a.css",
        "b.scss",
        "c.scss",
      ]);

      // Assert
      expect(summaries.map(({ category, files }) => [category, files])).toEqual(
        [
          ["style", 1],
          ["style", 2],
        ]
      );
    });
  });

  describe("addPolicyDecisions", () => {
    it("should count the dependencies that each policy and the default decided, and the ones they disallowed", () => {
      // Arrange
      const { rule, policies } = analyzeRule(QUICK_START_CONFIG);
      const results = [
        allowedBy(rule, 0),
        allowedBy(rule, 1),
        allowedBy(rule, 1),
        disallowedBy(rule, 2),
        disallowedBy(rule, null),
      ];

      // Act
      const summaries = addPolicyDecisions(policies, results);

      // Assert
      expect(
        summaries.map(({ index, decided, disallowed }) => [
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
    });

    it("should count a policy that decided both an allowed and a disallowed dependency once for each", () => {
      // Arrange
      const { rule, policies } = analyzeRule(QUICK_START_CONFIG);
      const results = [
        allowedBy(rule, 2),
        disallowedBy(rule, 2),
        disallowedBy(rule, 2),
      ];

      // Act
      const summaries = addPolicyDecisions(policies, results);

      // Assert
      expect(summaries[2]).toMatchObject({ decided: 3, disallowed: 2 });
    });

    it("should count how many of the dependencies that a policy disallowed are errors, the others being warnings", () => {
      // Arrange
      const { rule, policies } = analyzeRule(QUICK_START_CONFIG);
      const results = [
        disallowedBy(rule, 2, "warning"),
        disallowedBy(rule, 2, "error"),
        disallowedBy(rule, null, "warning"),
        allowedBy(rule, 1),
      ];

      // Act
      const summaries = addPolicyDecisions(policies, results);

      // Assert
      expect(
        summaries.map(({ index, disallowed, errors }) => [
          index,
          disallowed,
          errors,
        ])
      ).toEqual([
        [0, 0, 0],
        [1, 0, 0],
        [2, 2, 1],
        [null, 1, 0],
      ]);
    });

    it("should count nothing for a policy that decided no dependency", () => {
      // Arrange
      const { rule, policies } = analyzeRule(QUICK_START_CONFIG);

      // Act
      const summaries = addPolicyDecisions(policies, [allowedBy(rule, 1)]);

      // Assert
      expect(
        summaries.map(({ index, decided, disallowed }) => [
          index,
          decided,
          disallowed,
        ])
      ).toEqual([
        [0, 0, 0],
        [1, 1, 0],
        [2, 0, 0],
        [null, 0, 0],
      ]);
    });

    it("should count no dependency that is not checked, not evaluated, or disallowed with no policy", () => {
      // Arrange
      const { policies } = analyzeRule(QUICK_START_CONFIG);
      const results = [
        resultOf({ status: "not-checked", reason: "internal" }),
        resultOf({ status: "not-checked", reason: "not-read" }),
        resultOf({ status: "not-evaluated" }),
        resultOf({
          status: "disallowed",
          policy: undefined,
          message: "Invalid custom message",
          level: "error",
        }),
      ];

      // Act
      const summaries = addPolicyDecisions(policies, results);

      // Assert
      expect(
        summaries.map(({ decided, disallowed }) => [decided, disallowed])
      ).toEqual([
        [0, 0],
        [0, 0],
        [0, 0],
        [0, 0],
      ]);
    });

    it("should count the dependencies of the default for a rule with no policies", () => {
      // Arrange
      const { rule, policies } = analyzeRule({
        rules: { "boundaries/dependencies": [2, {}] },
      });

      // Act
      const summaries = addPolicyDecisions(policies, [allowedBy(rule, null)]);

      // Assert
      expect(summaries).toEqual([
        {
          index: null,
          action: "disallow",
          from: [],
          to: [],
          decided: 1,
          disallowed: 0,
          errors: 0,
          path: rule.defaultPolicy.path,
        },
      ]);
    });

    it("should keep everything else of each summary, in the same order", () => {
      // Arrange
      const { rule, policies } = analyzeRule(QUICK_START_CONFIG);

      // Act
      const summaries = addPolicyDecisions(policies, [disallowedBy(rule, 0)]);

      // Assert
      expect(summaries).toEqual([
        { ...policies[0], decided: 1, disallowed: 1, errors: 1 },
        { ...policies[1], decided: 0, disallowed: 0, errors: 0 },
        { ...policies[2], decided: 0, disallowed: 0, errors: 0 },
        { ...policies[3], decided: 0, disallowed: 0, errors: 0 },
      ]);
    });

    it("should summarize no policy when the analysis summarizes none", () => {
      // Act
      const summaries = addPolicyDecisions(
        [],
        [resultOf({ status: "not-evaluated" })]
      );

      // Assert
      expect(summaries).toEqual([]);
    });
  });
});
