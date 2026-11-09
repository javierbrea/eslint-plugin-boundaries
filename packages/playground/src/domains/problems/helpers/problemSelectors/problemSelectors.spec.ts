import type {
  ConfigProblem,
  ConfigToken,
  DependencyResult,
  DependencyVerdict,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import type { Focus, ProblemsTabId } from "@/domains/session/helpers/focus";

import {
  createProblemCountsReader,
  getProblemCounts,
  getProblemList,
  getProblemTabs,
  getShownTab,
  getTextProblems,
  summarizeProblems,
} from "./problemSelectors";
import type {
  ProblemEvaluation,
  ProblemListFacts,
  ProblemListInputs,
  ProblemRowsFacts,
  ProblemSummary,
} from "./problemSelectors.types";

const ERROR: ConfigProblem = {
  level: "error",
  title: "[boundaries/dependencies] Invalid rule options.",
  detail: 'Value "dissallow" should be equal to one of the allowed values.',
  links: [],
  path: ["rules", "boundaries/dependencies", 1, "default"],
  range: { from: 380, to: 391, line: 15, column: 16 },
  source: "config",
};

const WARNING: ConfigProblem = {
  level: "warning",
  title: "Some element descriptors are invalid and will be ignored.",
  links: [],
  path: ["settings", "boundaries/elements", 1],
  range: { from: 120, to: 170, line: 5, column: 7 },
  source: "config",
};

const DEPRECATION: ConfigProblem = {
  ...WARNING,
  level: "deprecation",
  title: "This option is deprecated.",
};

const UNREADABLE_LINE = "  import { a } from './b'";

const TEXT_PROBLEM: TextProblem = {
  line: 2,
  text: UNREADABLE_LINE,
  reason: '"./b" does not resolve to a file of the project.',
};

const NO_FOCUS: Focus = { kind: "none" };

const CONFIG_FOCUS: Focus = { kind: "config" };

const FILE_FOCUS: Focus = {
  kind: "file",
  path: "src/modules/checkout/index.js",
};

const FORMAT = "src/helpers/format/index.js";

const CHECKOUT = "src/modules/checkout/index.js";

const BUTTON = "src/components/atoms/Button/index.js";

const POLICY_RANGE: TextRange = { from: 40, to: 90, line: 3, column: 9 };

const DEFAULT_RANGE: TextRange = { from: 100, to: 110, line: 8, column: 5 };

/**
 * Builds the verdict of a dependency that the rule disallows.
 * @param level The severity of the rule.
 * @param index The policy that disallowed it, or `null` for the default.
 * @returns The verdict.
 */
function disallowed(
  level: "error" | "warning" = "error",
  index: number | null = 2
): DependencyVerdict {
  return {
    status: "disallowed",
    policy: { index, range: index === null ? DEFAULT_RANGE : POLICY_RANGE },
    message: "Not allowed.",
    level,
  };
}

const ALLOWED: DependencyVerdict = {
  status: "allowed",
  policy: { index: 1, range: POLICY_RANGE },
};

/**
 * Builds a dependency of the sketch with its verdict.
 * @param path The file that has it.
 * @param index Its position among the dependencies of the file.
 * @param verdict What the engine says about it.
 * @param to Where it points to.
 * @returns The result.
 */
function result(
  path: string,
  index: number,
  verdict: DependencyVerdict,
  to = BUTTON
): DependencyResult {
  return {
    dependency: {
      from: path,
      target: { kind: "node", path: to },
      syntax: "import",
      importKind: "value",
      specifiers: [],
    },
    ref: { path, index },
    source: "./x",
    description: undefined,
    verdict,
  };
}

/** The dependencies of the quick start that fail, plus the ones that do not: the order is the one of the sketch */
const DEPENDENCIES: readonly DependencyResult[] = [
  result("src/components/atoms/Button/Button.spec.js", 0, ALLOWED),
  result(FORMAT, 0, disallowed("error", null)),
  result(CHECKOUT, 0, ALLOWED),
  result(CHECKOUT, 1, ALLOWED, FORMAT),
  result(CHECKOUT, 2, disallowed("warning")),
  result(CHECKOUT, 3, { status: "not-checked", reason: "not-local" }),
];

/**
 * Builds what the lists read of an evaluation.
 * @param overrides What differs from an evaluation of an empty sketch.
 * @returns The evaluation.
 */
function createEvaluation(
  overrides: Partial<ProblemEvaluation> = {}
): ProblemEvaluation {
  return {
    sketch: { config: "{}", tree: [], dependencies: [] },
    problems: [],
    dependencies: [],
    notEvaluated: undefined,
    ...overrides,
  };
}

/**
 * Builds what `getProblemList` reads.
 * @param tab The tab that shows.
 * @param openNode What is in focus.
 * @param overrides What differs from an empty evaluation, no lines of text and no highlight.
 * @returns The inputs.
 */
function inputs(
  tab: ProblemsTabId,
  openNode: Focus,
  overrides: Partial<ProblemListInputs> = {}
): ProblemListInputs {
  return {
    tab,
    openNode,
    evaluation: createEvaluation(),
    textProblems: [],
    highlight: undefined,
    ...overrides,
  };
}

/**
 * Narrows the facts of a list to the ones of a list of rows.
 * @param facts The facts that `getProblemList` returned.
 * @returns The facts, which are not the body of a dependency.
 */
function getRows(facts: ProblemListFacts): ProblemRowsFacts {
  if ("result" in facts) {
    throw new Error("The facts are the body of a dependency.");
  }
  return facts;
}

describe("problemSelectors", () => {
  describe("getTextProblems", () => {
    it("should give no lines when there is no draft", () => {
      // Act
      const problems = getTextProblems(undefined, true);

      // Assert
      expect(problems).toEqual([]);
    });

    it("should give the same array each time there is no draft", () => {
      // Act
      const first = getTextProblems(undefined, true);
      const second = getTextProblems(undefined, true);

      // Assert
      expect(second).toBe(first);
    });

    it("should give the lines of the draft that cannot be read", () => {
      // Act
      const problems = getTextProblems(`main.js\n${UNREADABLE_LINE}\n`, true);

      // Assert
      expect(problems).toEqual([TEXT_PROBLEM]);
    });

    it("should give no lines for a draft that can be read", () => {
      // Act
      const problems = getTextProblems("main.js\nsrc/index.js\n", true);

      // Assert
      expect(problems).toEqual([]);
    });

    it("should not give the dependency lines when the dependencies are not read", () => {
      // Act
      const problems = getTextProblems(
        `main.js\n${UNREADABLE_LINE}\n  import { b } from 'lodash'\n  import bad\n`,
        false
      );

      // Assert
      expect(problems).toEqual([]);
    });

    it("should give the lines of nodes that cannot be read when the dependencies are not read", () => {
      // Act
      const problems = getTextProblems(
        `main.js\n${UNREADABLE_LINE}\nmain.js\n  import bad\n`,
        false
      );

      // Assert
      expect(problems).toEqual([
        {
          line: 3,
          text: "main.js",
          reason: "That path already exists.",
        },
      ]);
    });

    it("should give the dependency lines that cannot be read when the dependencies are read", () => {
      // Act
      const problems = getTextProblems(
        `main.js\n${UNREADABLE_LINE}\n  import bad\n`,
        true
      );

      // Assert
      expect(problems.map(({ line }) => line)).toEqual([2, 3]);
    });
  });

  describe("summarizeProblems", () => {
    it("should count nothing and have no errors when there are no problems", () => {
      // Act
      const summary = summarizeProblems([], [], []);

      // Assert
      expect(summary).toEqual({
        configCount: 0,
        configHasErrors: false,
        total: 0,
        hasErrors: false,
      });
    });

    it("should have no errors when the problems are warnings and deprecations", () => {
      // Act
      const summary = summarizeProblems([WARNING, DEPRECATION], [], []);

      // Assert
      expect(summary).toEqual({
        configCount: 2,
        configHasErrors: false,
        total: 2,
        hasErrors: false,
      });
    });

    it("should have errors when a problem of the config is an error", () => {
      // Act
      const summary = summarizeProblems([WARNING, ERROR], [], []);

      // Assert
      expect(summary).toEqual({
        configCount: 2,
        configHasErrors: true,
        total: 2,
        hasErrors: true,
      });
    });

    it("should count a line that cannot be read as an error that is not of the config", () => {
      // Act
      const summary = summarizeProblems([], [TEXT_PROBLEM], []);

      // Assert
      expect(summary).toEqual({
        configCount: 0,
        configHasErrors: false,
        total: 1,
        hasErrors: true,
      });
    });

    it("should add the lines to the problems of the config for the total", () => {
      // Act
      const summary = summarizeProblems(
        [WARNING],
        [TEXT_PROBLEM, { ...TEXT_PROBLEM, line: 4 }],
        []
      );

      // Assert
      expect(summary).toEqual({
        configCount: 1,
        configHasErrors: false,
        total: 3,
        hasErrors: true,
      });
    });

    it("should count the dependencies that the rule disallows, and not the ones that are allowed or not checked", () => {
      // Arrange
      const dependencies = [
        result(FORMAT, 0, disallowed()),
        result(CHECKOUT, 0, ALLOWED),
        result(CHECKOUT, 1, { status: "not-checked", reason: "internal" }),
        result(CHECKOUT, 2, { status: "not-evaluated" }),
        result(CHECKOUT, 3, disallowed("error", null)),
      ];

      // Act
      const summary = summarizeProblems([WARNING], [], dependencies);

      // Assert
      expect(summary).toEqual({
        configCount: 1,
        configHasErrors: false,
        total: 3,
        hasErrors: true,
      });
    });

    it("should keep the count of the config apart from the failing dependencies", () => {
      // Act
      const summary = summarizeProblems(
        [],
        [],
        [result(FORMAT, 0, disallowed())]
      );

      // Assert
      expect(summary.configCount).toBe(0);
      expect(summary.configHasErrors).toBe(false);
    });

    it("should have no errors when the only failing dependencies are warnings", () => {
      // Act
      const summary = summarizeProblems(
        [],
        [],
        [
          result(FORMAT, 0, disallowed("warning")),
          result(CHECKOUT, 0, disallowed("warning")),
        ]
      );

      // Assert
      expect(summary).toEqual({
        configCount: 0,
        configHasErrors: false,
        total: 2,
        hasErrors: false,
      });
    });
  });

  describe("getProblemCounts", () => {
    it("should give the problems of the config", () => {
      // Act
      const counts = getProblemCounts(3, true, []);

      // Assert
      expect(counts.config).toBe(3);
      expect(counts.configHasErrors).toBe(true);
    });

    it("should give no problems for the paths when no dependency fails", () => {
      // Act
      const counts = getProblemCounts(0, false, [
        result(CHECKOUT, 0, ALLOWED),
        result(CHECKOUT, 1, { status: "not-checked", reason: "internal" }),
      ]);

      // Assert
      expect(counts.byPath.size).toBe(0);
    });

    it("should share the empty map of the paths, so that a count that changes does not change it", () => {
      // Act
      const first = getProblemCounts(1, false, []);
      const second = getProblemCounts(2, true, []);

      // Assert
      expect(second.byPath).toBe(first.byPath);
    });

    it("should count the failing dependencies of each file and, summed, of each folder above it", () => {
      // Act
      const counts = getProblemCounts(0, false, DEPENDENCIES);

      // Assert
      expect(Object.fromEntries(counts.byPath)).toEqual({
        [FORMAT]: { count: 1, hasErrors: true },
        "src/helpers/format": { count: 1, hasErrors: true },
        "src/helpers": { count: 1, hasErrors: true },
        [CHECKOUT]: { count: 1, hasErrors: false },
        "src/modules/checkout": { count: 1, hasErrors: false },
        "src/modules": { count: 1, hasErrors: false },
        src: { count: 2, hasErrors: true },
      });
    });

    it("should count each failing dependency of a file, whatever its level", () => {
      // Act
      const counts = getProblemCounts(0, false, [
        result("main.js", 0, disallowed()),
        result("main.js", 1, disallowed("warning")),
        result("main.js", 2, ALLOWED),
      ]);

      // Assert
      expect(Object.fromEntries(counts.byPath)).toEqual({
        "main.js": { count: 2, hasErrors: true },
      });
    });

    it("should say that a path has errors only when one of its failing dependencies is an error, in a file and in the folders above it", () => {
      // Act
      const counts = getProblemCounts(0, false, [
        result("src/a/one.js", 0, disallowed("warning")),
        result("src/a/two.js", 0, disallowed("warning")),
        result("src/a/two.js", 1, disallowed("error")),
        result("src/b/three.js", 0, disallowed("warning")),
      ]);

      // Assert
      expect(Object.fromEntries(counts.byPath)).toEqual({
        "src/a/one.js": { count: 1, hasErrors: false },
        "src/a/two.js": { count: 2, hasErrors: true },
        "src/a": { count: 3, hasErrors: true },
        "src/b/three.js": { count: 1, hasErrors: false },
        "src/b": { count: 1, hasErrors: false },
        src: { count: 4, hasErrors: true },
      });
    });
  });

  describe("createProblemCountsReader", () => {
    it("should give the counts that getProblemCounts gives", () => {
      // Arrange
      const read = createProblemCountsReader();

      // Act
      const counts = read(2, true, DEPENDENCIES);

      // Assert
      expect(counts).toEqual(getProblemCounts(2, true, DEPENDENCIES));
    });

    it("should give the same object when the new counts say what the last ones said, though the verdicts are other objects", () => {
      // Arrange
      const read = createProblemCountsReader();
      const first = read(2, true, DEPENDENCIES);

      // Act
      const second = read(
        2,
        true,
        DEPENDENCIES.map((dependency) => ({ ...dependency }))
      );

      // Assert
      expect(second).toBe(first);
    });

    it("should give the same object while no dependency fails", () => {
      // Arrange
      const read = createProblemCountsReader();
      const first = read(0, false, []);

      // Act
      const second = read(0, false, [result(CHECKOUT, 0, ALLOWED)]);

      // Assert
      expect(second).toBe(first);
    });

    it.each<[string, number, boolean, readonly DependencyResult[]]>([
      ["the problems of the config", 3, true, DEPENDENCIES],
      ["whether the config has errors", 2, false, DEPENDENCIES],
      [
        "the count of a file",
        2,
        true,
        [...DEPENDENCIES, result(FORMAT, 1, disallowed())],
      ],
      [
        "whether the failing dependencies of a file are errors, with the same counts",
        2,
        true,
        [
          result(FORMAT, 0, disallowed("warning", null)),
          result(CHECKOUT, 0, disallowed("warning")),
        ],
      ],
      [
        "the files that fail, with as many failing dependencies",
        2,
        true,
        [
          result(FORMAT, 0, disallowed("error", null)),
          result("main.js", 0, disallowed()),
          result("src/index.js", 0, disallowed()),
        ],
      ],
      [
        "the files that fail, with the same total",
        2,
        true,
        [
          result(FORMAT, 0, disallowed("error", null)),
          result(CHECKOUT, 0, disallowed()),
          result(CHECKOUT, 1, disallowed()),
        ],
      ],
    ])(
      "should give new counts when %s changes",
      (_title, count, hasErrors, dependencies) => {
        // Arrange
        const read = createProblemCountsReader();
        const first = read(2, true, DEPENDENCIES);

        // Act
        const second = read(count, hasErrors, dependencies);

        // Assert
        expect(second).not.toBe(first);
        expect(second).toEqual(
          getProblemCounts(count, hasErrors, dependencies)
        );
      }
    );

    it("should compare with the last counts it gave, and not with the first ones", () => {
      // Arrange
      const read = createProblemCountsReader();
      read(2, true, DEPENDENCIES);
      const changed = read(2, true, [result(FORMAT, 0, disallowed())]);

      // Act
      const same = read(2, true, [result(FORMAT, 0, disallowed("error", 1))]);

      // Assert
      expect(same).toBe(changed);
    });
  });

  describe("getShownTab", () => {
    const DEPENDENCY_FOCUS: Focus = {
      kind: "dependency",
      path: CHECKOUT,
      index: 2,
    };

    it.each<[ProblemsTabId, Focus, ProblemsTabId]>([
      ["node", NO_FOCUS, "sketch"],
      ["sketch", NO_FOCUS, "sketch"],
      ["dependency", NO_FOCUS, "sketch"],
      ["node", CONFIG_FOCUS, "node"],
      ["sketch", CONFIG_FOCUS, "sketch"],
      ["node", FILE_FOCUS, "node"],
      ["sketch", FILE_FOCUS, "sketch"],
      ["node", DEPENDENCY_FOCUS, "node"],
      ["sketch", DEPENDENCY_FOCUS, "sketch"],
      ["dependency", DEPENDENCY_FOCUS, "dependency"],
      ["dependency", CONFIG_FOCUS, "node"],
      ["dependency", FILE_FOCUS, "node"],
    ])(
      "should show the %s tab selected with %j in focus as %s",
      (tab, openNode, shown) => {
        // Act
        const shownTab = getShownTab(openNode, tab);

        // Assert
        expect(shownTab).toBe(shown);
      }
    );
  });

  describe("getProblemTabs", () => {
    const SUMMARY: ProblemSummary = {
      configCount: 2,
      configHasErrors: false,
      total: 3,
      hasErrors: true,
    };

    const SKETCH_TAB = {
      id: "sketch",
      subject: { kind: "sketch" },
      badge: { count: 3, hasErrors: true },
    };

    it("should give the tab of the sketch alone when nothing is in focus", () => {
      // Act
      const tabs = getProblemTabs(NO_FOCUS, SUMMARY, DEPENDENCIES);

      // Assert
      expect(tabs).toEqual([SKETCH_TAB]);
    });

    it("should add the tab of the config with its own count and errors", () => {
      // Act
      const tabs = getProblemTabs(CONFIG_FOCUS, SUMMARY, DEPENDENCIES);

      // Assert
      expect(tabs).toEqual([
        SKETCH_TAB,
        {
          id: "node",
          subject: { kind: "config" },
          badge: { count: 2, hasErrors: false },
        },
      ]);
    });

    it("should add the tab of the file in focus, named by its path, with the failing dependencies of the file", () => {
      // Act
      const tabs = getProblemTabs(FILE_FOCUS, SUMMARY, DEPENDENCIES);

      // Assert
      expect(tabs).toEqual([
        SKETCH_TAB,
        {
          id: "node",
          subject: { kind: "file", path: CHECKOUT },
          badge: { count: 1, hasErrors: false },
        },
      ]);
    });

    it("should count a failing dependency as an error in the tab of the file when the rule says error", () => {
      // Act
      const tabs = getProblemTabs(
        { kind: "file", path: FORMAT },
        SUMMARY,
        DEPENDENCIES
      );

      // Assert
      expect(tabs[1].badge).toEqual({ count: 1, hasErrors: true });
    });

    it("should give the tab of a file with no failing dependency a count of zero", () => {
      // Act
      const tabs = getProblemTabs(
        { kind: "file", path: "src/index.js" },
        SUMMARY,
        DEPENDENCIES
      );

      // Assert
      expect(tabs[1].badge).toEqual({ count: 0, hasErrors: false });
    });

    it("should add the tab of the file and the one of the dependency, with the verdict of the dependency and no count", () => {
      // Act
      const tabs = getProblemTabs(
        { kind: "dependency", path: CHECKOUT, index: 2 },
        SUMMARY,
        DEPENDENCIES
      );

      // Assert
      expect(tabs).toEqual([
        SKETCH_TAB,
        {
          id: "node",
          subject: { kind: "file", path: CHECKOUT },
          badge: { count: 1, hasErrors: false },
        },
        {
          id: "dependency",
          subject: { kind: "dependency", ref: { path: CHECKOUT, index: 2 } },
          verdict: disallowed("warning"),
        },
      ]);
      expect(tabs[2]).not.toHaveProperty("badge");
    });

    it("should give the verdict of the dependency in focus when it is allowed or not checked", () => {
      // Act
      const allowed = getProblemTabs(
        { kind: "dependency", path: CHECKOUT, index: 0 },
        SUMMARY,
        DEPENDENCIES
      );
      const skipped = getProblemTabs(
        { kind: "dependency", path: CHECKOUT, index: 3 },
        SUMMARY,
        DEPENDENCIES
      );

      // Assert
      expect(allowed[2].verdict).toEqual(ALLOWED);
      expect(skipped[2].verdict).toEqual({
        status: "not-checked",
        reason: "not-local",
      });
    });

    it("should give the tab of a dependency that the evaluation does not have no verdict", () => {
      // Act
      const tabs = getProblemTabs(
        { kind: "dependency", path: CHECKOUT, index: 9 },
        SUMMARY,
        DEPENDENCIES
      );

      // Assert
      expect(tabs[2]).toEqual({
        id: "dependency",
        subject: { kind: "dependency", ref: { path: CHECKOUT, index: 9 } },
        verdict: undefined,
      });
    });
  });

  describe("getProblemList", () => {
    describe("the sketch", () => {
      it("should list the problems of the config and the lines of text under the sketch's tab", () => {
        // Act
        const facts = getProblemList(
          inputs("sketch", NO_FOCUS, {
            evaluation: createEvaluation({ problems: [ERROR] }),
            textProblems: [TEXT_PROBLEM],
          })
        );

        // Assert
        expect(facts).toEqual({
          subject: { kind: "sketch" },
          configProblems: [ERROR],
          textProblems: [TEXT_PROBLEM],
          dependencies: [],
          notEvaluated: undefined,
          highlight: undefined,
        });
      });

      it("should list the sketch whatever the tab when nothing is in focus", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("node", NO_FOCUS, {
              evaluation: createEvaluation({ problems: [ERROR] }),
            })
          )
        );

        // Assert
        expect(facts.subject).toEqual({ kind: "sketch" });
        expect(facts.configProblems).toEqual([ERROR]);
      });

      it("should list the sketch under the sketch's tab although something is in focus", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("sketch", CONFIG_FOCUS, {
              evaluation: createEvaluation({ problems: [ERROR] }),
              textProblems: [TEXT_PROBLEM],
            })
          )
        );

        // Assert
        expect(facts.subject).toEqual({ kind: "sketch" });
        expect(facts.configProblems).toEqual([ERROR]);
        expect(facts.textProblems).toEqual([TEXT_PROBLEM]);
      });

      it("should hold each line of text as it was read", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("sketch", NO_FOCUS, { textProblems: [TEXT_PROBLEM] })
          )
        );

        // Assert
        expect(facts.textProblems[0]).toBe(TEXT_PROBLEM);
      });

      it("should list the failing dependencies of every file, in the order of the sketch, and not the others", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("sketch", NO_FOCUS, {
              evaluation: createEvaluation({ dependencies: DEPENDENCIES }),
            })
          )
        );

        // Assert
        expect(facts.dependencies.map(({ ref }) => ref)).toEqual([
          { path: FORMAT, index: 0 },
          { path: CHECKOUT, index: 2 },
        ]);
      });

      it("should hold each failing dependency as the engine gave it, with its verdict", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("sketch", NO_FOCUS, {
              evaluation: createEvaluation({ dependencies: DEPENDENCIES }),
            })
          )
        );

        // Assert
        expect(facts.dependencies[0]).toBe(DEPENDENCIES[1]);
        expect(facts.dependencies[1]).toBe(DEPENDENCIES[4]);
      });

      it("should list the problems of the config, the lines of text and the dependencies together", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("sketch", NO_FOCUS, {
              evaluation: createEvaluation({
                problems: [WARNING],
                dependencies: DEPENDENCIES,
              }),
              textProblems: [TEXT_PROBLEM],
            })
          )
        );

        // Assert
        expect(facts.configProblems).toHaveLength(1);
        expect(facts.textProblems).toHaveLength(1);
        expect(facts.dependencies).toHaveLength(2);
      });

      it("should not highlight a policy under the sketch's tab", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("sketch", CONFIG_FOCUS, {
              highlight: {
                range: POLICY_RANGE,
                policy: 2,
                dependency: { path: CHECKOUT, index: 2 },
              },
            })
          )
        );

        // Assert
        expect(facts.highlight).toBeUndefined();
      });
    });

    describe("the config", () => {
      it("should list the problems of the config alone under the tab of the config", () => {
        // Act
        const facts = getProblemList(
          inputs("node", CONFIG_FOCUS, {
            evaluation: createEvaluation({
              problems: [ERROR, WARNING],
              dependencies: DEPENDENCIES,
            }),
            textProblems: [TEXT_PROBLEM],
          })
        );

        // Assert
        expect(facts).toEqual({
          subject: { kind: "config" },
          configProblems: [ERROR, WARNING],
          textProblems: [],
          dependencies: [],
          notEvaluated: undefined,
          highlight: undefined,
        });
      });

      it("should hold each problem of the config as the engine gave it, with its range", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("node", CONFIG_FOCUS, {
              evaluation: createEvaluation({ problems: [ERROR] }),
            })
          )
        );

        // Assert
        expect(facts.configProblems[0]).toBe(ERROR);
        expect(facts.configProblems[0].range).toEqual(ERROR.range);
      });

      it("should give the policy that the highlight names and the dependency it was opened from", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("node", CONFIG_FOCUS, {
              highlight: {
                range: POLICY_RANGE,
                policy: 2,
                dependency: { path: CHECKOUT, index: 2 },
              },
            })
          )
        );

        // Assert
        expect(facts.highlight).toEqual({
          policy: 2,
          dependency: { path: CHECKOUT, index: 2 },
        });
      });

      it("should give the default as the policy that is highlighted when the highlight names it", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("node", CONFIG_FOCUS, {
              highlight: {
                range: DEFAULT_RANGE,
                policy: null,
                dependency: { path: FORMAT, index: 0 },
              },
            })
          )
        );

        // Assert
        expect(facts.highlight).toEqual({
          policy: null,
          dependency: { path: FORMAT, index: 0 },
        });
      });

      it("should keep naming the policy after the config was edited before it, though its range is not at any policy of the evaluation any more", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("node", CONFIG_FOCUS, {
              highlight: {
                range: {
                  ...POLICY_RANGE,
                  from: POLICY_RANGE.from - 7,
                  to: POLICY_RANGE.to - 7,
                },
                policy: 2,
                dependency: { path: CHECKOUT, index: 2 },
              },
            })
          )
        );

        // Assert
        expect(facts.highlight).toEqual({
          policy: 2,
          dependency: { path: CHECKOUT, index: 2 },
        });
      });

      it("should give no index when the highlight does not know the policy, which the note leaves out", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("node", CONFIG_FOCUS, {
              highlight: {
                range: POLICY_RANGE,
                policy: undefined,
                dependency: { path: CHECKOUT, index: 2 },
              },
            })
          )
        );

        // Assert
        expect(facts.highlight).toEqual({
          policy: undefined,
          dependency: { path: CHECKOUT, index: 2 },
        });
        expect(facts.highlight).toHaveProperty("policy", undefined);
      });

      it("should give no highlight when there is none", () => {
        // Act
        const facts = getRows(getProblemList(inputs("node", CONFIG_FOCUS, {})));

        // Assert
        expect(facts.highlight).toBeUndefined();
      });
    });

    describe("the note about dependencies that are not evaluated", () => {
      it.each<[ProblemsTabId, Focus]>([
        ["sketch", NO_FOCUS],
        ["node", CONFIG_FOCUS],
      ])(
        "should give the reason under the %s tab with %j in focus",
        (tab, openNode) => {
          // Act
          const facts = getRows(
            getProblemList(
              inputs(tab, openNode, {
                evaluation: createEvaluation({ notEvaluated: "rules-invalid" }),
              })
            )
          );

          // Assert
          expect(facts.notEvaluated).toBe("rules-invalid");
        }
      );

      it("should give no reason under the tab of a file, whatever the evaluation says", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("node", FILE_FOCUS, {
              evaluation: createEvaluation({ notEvaluated: "rule-off" }),
            })
          )
        );

        // Assert
        expect(facts.notEvaluated).toBeUndefined();
      });
    });

    describe("a file", () => {
      it("should list no problem of the config and no line of text under the tab of a file, and no failing dependency when it has none", () => {
        // Act
        const facts = getProblemList(
          inputs("node", FILE_FOCUS, {
            evaluation: createEvaluation({ problems: [ERROR] }),
            textProblems: [TEXT_PROBLEM],
          })
        );

        // Assert
        expect(facts).toEqual({
          subject: { kind: "file", path: CHECKOUT },
          configProblems: [],
          textProblems: [],
          dependencies: [],
          notEvaluated: undefined,
          highlight: undefined,
        });
      });

      it("should list the failing dependencies of the file, in order, and not the ones of other files", () => {
        // Arrange
        const dependencies = [
          ...DEPENDENCIES,
          result(CHECKOUT, 4, disallowed("error", 0)),
        ];

        // Act
        const facts = getRows(
          getProblemList(
            inputs("node", FILE_FOCUS, {
              evaluation: createEvaluation({ dependencies }),
            })
          )
        );

        // Assert
        expect(facts.dependencies.map(({ ref }) => ref)).toEqual([
          { path: CHECKOUT, index: 2 },
          { path: CHECKOUT, index: 4 },
        ]);
      });

      it("should list the failing dependencies of the file under its tab while a dependency of it is in focus", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs(
              "node",
              { kind: "dependency", path: CHECKOUT, index: 2 },
              { evaluation: createEvaluation({ dependencies: DEPENDENCIES }) }
            )
          )
        );

        // Assert
        expect(facts.subject).toEqual({ kind: "file", path: CHECKOUT });
        expect(facts.dependencies.map(({ ref }) => ref)).toEqual([
          { path: CHECKOUT, index: 2 },
        ]);
      });
    });

    describe("a dependency", () => {
      const CONFIG = `{
  rules: {
    "boundaries/dependencies": [2, {
      policies: [
        {
          disallow: { to: { file: { categories: "test" } } },
        },
      ],
    }],
  },
}`;
      const POLICY_AT: TextRange = {
        from: CONFIG.indexOf("{\n          disallow"),
        to: CONFIG.indexOf("},\n      ],") + 1,
        line: 5,
        column: 9,
      };
      const DECIDED: DependencyResult = result(CHECKOUT, 2, {
        status: "disallowed",
        policy: { index: 0, range: POLICY_AT },
        message: 'Dependencies to file of category "test" are not allowed.',
        level: "error",
      });
      const FOCUS: Focus = { kind: "dependency", path: CHECKOUT, index: 2 };

      /**
       * Gets the facts of the body of the dependency tab.
       * @param overrides What differs from the evaluation with the dependency that policy 0 disallowed.
       * @returns The facts, which are the body of a dependency.
       */
      function getDetail(
        overrides: Partial<ProblemEvaluation> = {}
      ): Extract<ProblemListFacts, { result: DependencyResult }> {
        const facts = getProblemList(
          inputs("dependency", FOCUS, {
            evaluation: createEvaluation({
              sketch: { config: CONFIG, tree: [], dependencies: [] },
              dependencies: [DECIDED],
              ...overrides,
            }),
          })
        );

        if (!("result" in facts)) {
          throw new Error("The facts are not the body of a dependency.");
        }
        return facts;
      }

      /**
       * Joins the pieces of the policy that a body holds.
       * @param facts The body of a dependency.
       * @param facts.policy
       * @returns The text of the policy, or `undefined` when no policy decided the dependency.
       */
      function joinPolicy({
        policy: decisive,
      }: {
        policy: { tokens: readonly ConfigToken[] } | undefined;
      }): string | undefined {
        return decisive?.tokens.map(({ text }) => text).join("");
      }

      it("should give the dependency with its verdict and the text of its policy", () => {
        // Act
        const facts = getDetail();

        // Assert
        expect(facts.subject).toEqual({
          kind: "dependency",
          ref: { path: CHECKOUT, index: 2 },
        });
        expect(facts.result).toBe(DECIDED);
        expect(facts.policy).toMatchObject({ index: 0, range: POLICY_AT });
        expect(joinPolicy(facts)).toBe(
          '{\n  disallow: { to: { file: { categories: "test" } } },\n}'
        );
      });

      it("should read the text of the policy at its range in the config of the evaluation, and take the column of the range off every line after the first", () => {
        // Act
        const facts = getDetail();

        // Assert
        expect(joinPolicy(facts)?.split("\n")).toEqual([
          "{",
          '  disallow: { to: { file: { categories: "test" } } },',
          "}",
        ]);
      });

      it("should take only the whitespace that the column says off a line that is indented less", () => {
        // Arrange
        const config = "[\n    {\n  x: 1,\n      y: 2,\n    },\n]";
        const range: TextRange = {
          from: config.indexOf("{"),
          to: config.indexOf("},") + 1,
          line: 2,
          column: 5,
        };

        // Act
        const facts = getDetail({
          sketch: { config, tree: [], dependencies: [] },
          dependencies: [
            result(CHECKOUT, 2, {
              status: "allowed",
              policy: { index: 1, range },
            }),
          ],
        });

        // Assert
        expect(joinPolicy(facts)).toBe("{\nx: 1,\n  y: 2,\n}");
      });

      it("should read the text of the default when the dependency was decided by it", () => {
        // Arrange
        const config = '{ default: "disallow" }';
        const range: TextRange = {
          from: config.indexOf('"disallow"'),
          to: config.indexOf(" }"),
          line: 1,
          column: 12,
        };

        // Act
        const facts = getDetail({
          sketch: { config, tree: [], dependencies: [] },
          dependencies: [
            result(CHECKOUT, 2, {
              status: "disallowed",
              policy: { index: null, range },
              message: "No.",
              level: "error",
            }),
          ],
        });

        // Assert
        expect(facts.policy?.index).toBeNull();
        expect(facts.policy?.range).toEqual(range);
        expect(joinPolicy(facts)).toBe('"disallow"');
      });

      it("should split the text of the policy into the pieces that the card colors, with the comments inside it", () => {
        // Arrange
        const COLORED_KINDS = new Set([
          "comment",
          "key",
          "number",
          "literal",
          "string",
        ]);
        const config =
          '[\n  {\n    // why\n    a: 1,\n    "b": true,\n    c: "s",\n  },\n]';
        const range: TextRange = {
          from: config.indexOf("{"),
          to: config.indexOf("},") + 1,
          line: 2,
          column: 3,
        };

        // Act
        const facts = getDetail({
          sketch: { config, tree: [], dependencies: [] },
          dependencies: [
            result(CHECKOUT, 2, {
              status: "allowed",
              policy: { index: 1, range },
            }),
          ],
        });

        // Assert
        expect(
          facts.policy?.tokens
            .filter(({ kind }) => COLORED_KINDS.has(kind))
            .map(({ kind, text }) => `${kind} ${text}`)
        ).toEqual([
          "comment // why",
          "key a",
          "number 1",
          'key "b"',
          "literal true",
          "key c",
          'string "s"',
        ]);
      });

      it("should give the text of a policy that cannot be tokenized as one plain piece", () => {
        // Arrange
        const config = "{ rules: @ }";
        const range: TextRange = {
          from: config.indexOf("@"),
          to: config.indexOf("@") + 1,
          line: 1,
          column: 10,
        };

        // Act
        const facts = getDetail({
          sketch: { config, tree: [], dependencies: [] },
          dependencies: [
            result(CHECKOUT, 2, {
              status: "allowed",
              policy: { index: 1, range },
            }),
          ],
        });

        // Assert
        expect(facts.policy?.tokens).toEqual([{ kind: "plain", text: "@" }]);
      });

      it("should give the policy of an allowed dependency", () => {
        // Act
        const facts = getDetail({
          dependencies: [
            result(CHECKOUT, 2, {
              status: "allowed",
              policy: { index: 1, range: POLICY_AT },
            }),
          ],
        });

        // Assert
        expect(facts.policy?.index).toBe(1);
      });

      it.each<[string, DependencyVerdict]>([
        ["not checked", { status: "not-checked", reason: "internal" }],
        ["not evaluated", { status: "not-evaluated" }],
        [
          "disallowed by a custom message that failed to render",
          {
            status: "disallowed",
            policy: undefined,
            message: "Message failed.",
            level: "error",
          },
        ],
      ])(
        "should give no policy for a dependency that is %s",
        (_title, verdict) => {
          // Act
          const facts = getDetail({
            dependencies: [result(CHECKOUT, 2, verdict)],
          });

          // Assert
          expect(facts.policy).toBeUndefined();
        }
      );

      it("should list the file of the dependency under its tab when the evaluation does not have the dependency", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("dependency", FOCUS, {
              evaluation: createEvaluation({ dependencies: [] }),
            })
          )
        );

        // Assert
        expect(facts.subject).toEqual({ kind: "file", path: CHECKOUT });
      });

      it("should list the file under the node's tab, whatever the dependency", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("node", FOCUS, {
              evaluation: createEvaluation({ dependencies: [DECIDED] }),
            })
          )
        );

        // Assert
        expect(facts.subject).toEqual({ kind: "file", path: CHECKOUT });
        expect(facts.dependencies).toEqual([DECIDED]);
      });

      it("should list the file under the tab of a dependency while a file without one is in focus", () => {
        // Act
        const facts = getRows(
          getProblemList(
            inputs("dependency", FILE_FOCUS, {
              evaluation: createEvaluation({ dependencies: [DECIDED] }),
            })
          )
        );

        // Assert
        expect(facts.subject).toEqual({ kind: "file", path: CHECKOUT });
      });
    });
  });
});
