import type {
  ConfigProblem,
  DependencyVerdict,
  NotEvaluatedReason,
  TextRange,
} from "@/domains/evaluation/helpers/engine";
import type {
  DependencyDetailFacts,
  FailingDependency,
  ProblemRowsFacts,
  ProblemTabFacts,
} from "@/domains/problems/helpers/problemSelectors";
import type { TextProblem } from "@/domains/project/helpers/sketch";

import {
  getConfigProblemItems,
  getCountTone,
  getDependencyProblemItems,
  getTabLabel,
  getTextProblemItems,
  toProblemListContent,
  toProblemsTabs,
} from "./problemItems";

/** The two problems of the mockup's config state, as the engine returns them. */
const INVALID_OPTIONS: ConfigProblem = {
  level: "error",
  title: "[boundaries/dependencies] Invalid rule options.",
  detail: 'Value "dissallow" should be equal to one of the allowed values.',
  links: ["https://www.jsboundaries.dev/docs/rules/dependencies/#options"],
  path: ["rules", "boundaries/dependencies", 1, "default"],
  range: { from: 380, to: 391, line: 15, column: 16 },
  source: "config",
};

const IGNORED_DESCRIPTORS: ConfigProblem = {
  level: "warning",
  title: "Some element descriptors are invalid and will be ignored.",
  links: [],
  path: ["settings", "boundaries/elements", 1],
  range: { from: 120, to: 170, line: 5, column: 7 },
  source: "config",
};

const POLICY_RANGE: TextRange = { from: 40, to: 90, line: 3, column: 9 };

/**
 * Builds a dependency that the rule disallows.
 * @param path The file that has it.
 * @param index Its position among the dependencies of the file.
 * @param overrides What differs from a dependency that policy 2 disallowed as an error, with the source `../../components/atoms/Button`.
 * @returns The dependency with its verdict.
 */
function failing(
  path: string,
  index: number,
  overrides: Partial<FailingDependency["verdict"]> = {}
): FailingDependency {
  return {
    dependency: {
      from: path,
      target: { kind: "node", path: "src/components/atoms/Button/index.js" },
      syntax: "import",
      importKind: "value",
      specifiers: [],
    },
    ref: { path, index },
    source: "../../components/atoms/Button",
    verdict: {
      status: "disallowed",
      policy: { index: 2, range: POLICY_RANGE },
      message: 'Dependencies to file of category "test" are not allowed.',
      level: "error",
      ...overrides,
    },
  };
}

const CHECKOUT = "src/modules/checkout/index.js";

describe("problemItems", () => {
  describe("getConfigProblemItems", () => {
    it("should build the rows of the mockup's config state", () => {
      // Arrange
      const problems = [INVALID_OPTIONS, IGNORED_DESCRIPTORS];

      // Act
      const items = getConfigProblemItems(problems);

      // Assert
      expect(items).toEqual([
        {
          key: "config:0",
          level: "error",
          location: "eslint.config.js",
          position: ":15:16",
          message:
            '[boundaries/dependencies] Invalid rule options. Value "dissallow" should be equal to one of the allowed values.',
          meta: "error · rules › boundaries/dependencies › 1 › default",
          target: { kind: "config", range: INVALID_OPTIONS.range },
        },
        {
          key: "config:1",
          level: "warning",
          location: "eslint.config.js",
          position: ":5:7",
          message: "Some element descriptors are invalid and will be ignored.",
          meta: "warning · settings › boundaries/elements › 1",
          target: { kind: "config", range: IGNORED_DESCRIPTORS.range },
        },
      ]);
    });

    it("should give no rows for no problems", () => {
      // Act
      const items = getConfigProblemItems([]);

      // Assert
      expect(items).toEqual([]);
    });

    it("should give each row a key of its own, by its position", () => {
      // Arrange
      const problems = [IGNORED_DESCRIPTORS, IGNORED_DESCRIPTORS];

      // Act
      const keys = getConfigProblemItems(problems).map(({ key }) => key);

      // Assert
      expect(keys).toEqual(["config:0", "config:1"]);
    });

    it("should make each row open the config at the range of its problem", () => {
      // Arrange
      const problems = [INVALID_OPTIONS, IGNORED_DESCRIPTORS];

      // Act
      const targets = getConfigProblemItems(problems).map(
        ({ target }) => target
      );

      // Assert
      expect(targets).toEqual([
        { kind: "config", range: { from: 380, to: 391, line: 15, column: 16 } },
        { kind: "config", range: { from: 120, to: 170, line: 5, column: 7 } },
      ]);
    });

    it("should keep the level of a deprecation", () => {
      // Arrange
      const problem: ConfigProblem = {
        ...IGNORED_DESCRIPTORS,
        level: "deprecation",
      };

      // Act
      const [item] = getConfigProblemItems([problem]);

      // Assert
      expect(item?.level).toBe("deprecation");
      expect(item?.meta).toBe(
        "deprecation · settings › boundaries/elements › 1"
      );
    });

    it.each([
      [
        "a detail",
        "The config takes only the keys settings and rules.",
        [],
        "Some element descriptors are invalid and will be ignored. The config takes only the keys settings and rules.",
      ],
      [
        "a detail and links, which are left out",
        "Value is not valid.",
        ["https://www.jsboundaries.dev/docs/"],
        "Some element descriptors are invalid and will be ignored. Value is not valid.",
      ],
      [
        "links and no detail, which are left out",
        undefined,
        ["https://www.jsboundaries.dev/docs/", "https://example.com/"],
        "Some element descriptors are invalid and will be ignored.",
      ],
      [
        "no detail",
        undefined,
        [],
        "Some element descriptors are invalid and will be ignored.",
      ],
    ])(
      "should write the message of a problem with %s",
      (_case, detail, links, message) => {
        // Arrange
        const problem: ConfigProblem = {
          ...IGNORED_DESCRIPTORS,
          detail,
          links,
        };

        // Act
        const [item] = getConfigProblemItems([problem]);

        // Assert
        expect(item?.message).toBe(message);
      }
    );

    it("should give the level alone as the meta of a problem about the whole config", () => {
      // Arrange
      const problem: ConfigProblem = {
        level: "error",
        title: "The config is one JSON5 object { settings, rules }.",
        detail: "Unexpected token Number found.",
        links: [],
        path: [],
        range: { from: 4, to: 5, line: 1, column: 5 },
        source: "parse",
      };

      // Act
      const [item] = getConfigProblemItems([problem]);

      // Assert
      expect(item).toEqual({
        key: "config:0",
        level: "error",
        location: "eslint.config.js",
        position: ":1:5",
        message:
          "The config is one JSON5 object { settings, rules }. Unexpected token Number found.",
        meta: "error",
        target: { kind: "config", range: problem.range },
      });
    });
  });

  describe("getTextProblemItems", () => {
    it("should place the problem in the project text, with the line and the reason", () => {
      // Arrange
      const problems: TextProblem[] = [
        {
          line: 4,
          text: "src//index.js",
          reason: "The path has an empty segment.",
        },
      ];

      // Act
      const items = getTextProblemItems(problems);

      // Assert
      expect(items).toEqual([
        {
          key: "text:0",
          level: "error",
          location: "Project text",
          position: ":4",
          message: "The path has an empty segment.",
          meta: "src//index.js",
        },
      ]);
    });

    it("should keep the line as it was written, indentation included", () => {
      // Arrange
      const problems: TextProblem[] = [
        {
          line: 2,
          text: "  import { format } from './format'",
          reason: "Dependencies are not written in text mode yet.",
        },
      ];

      // Act
      const [item] = getTextProblemItems(problems);

      // Assert
      expect(item?.meta).toBe("  import { format } from './format'");
    });

    it("should give each row a key of its own, by its position", () => {
      // Arrange
      const problems: TextProblem[] = [
        { line: 1, text: "a", reason: "First." },
        { line: 3, text: "b", reason: "Second." },
      ];

      // Act
      const keys = getTextProblemItems(problems).map(({ key }) => key);

      // Assert
      expect(keys).toEqual(["text:0", "text:1"]);
    });

    it("should make no row open anything, because the line is already in front of the user", () => {
      // Arrange
      const problems: TextProblem[] = [
        { line: 1, text: "a", reason: "First." },
      ];

      // Act
      const [item] = getTextProblemItems(problems);

      // Assert
      expect(item).not.toHaveProperty("target");
    });

    it("should give no rows for no problems", () => {
      // Act
      const items = getTextProblemItems([]);

      // Assert
      expect(items).toEqual([]);
    });
  });

  describe("getDependencyProblemItems", () => {
    it("should build the rows of the sketch as the mockup does, with the file, the line and the source", () => {
      // Act
      const items = getDependencyProblemItems([failing(CHECKOUT, 2)], true);

      // Assert
      expect(items).toEqual([
        {
          key: `dependency:${CHECKOUT}:2`,
          level: "error",
          location: CHECKOUT,
          position: ":3",
          source: "../../components/atoms/Button",
          message: 'Dependencies to file of category "test" are not allowed.',
          meta: "disallowed · policy 2",
          target: { kind: "dependency", path: CHECKOUT, index: 2 },
        },
      ]);
    });

    it("should build the rows of a file without the file, which the list is about", () => {
      // Act
      const [item] = getDependencyProblemItems([failing(CHECKOUT, 2)], false);

      // Assert
      expect(item).not.toHaveProperty("location");
      expect(item.position).toBe(":3");
      expect(item.source).toBe("../../components/atoms/Button");
    });

    it("should number the lines from 1, whatever the index", () => {
      // Act
      const positions = getDependencyProblemItems(
        [failing(CHECKOUT, 0), failing(CHECKOUT, 7)],
        false
      ).map(({ position }) => position);

      // Assert
      expect(positions).toEqual([":1", ":8"]);
    });

    it("should give each row a key of its own, by its file and its index", () => {
      // Act
      const keys = getDependencyProblemItems(
        [
          failing(CHECKOUT, 0),
          failing(CHECKOUT, 1),
          failing("src/index.js", 0),
        ],
        true
      ).map(({ key }) => key);

      // Assert
      expect(keys).toEqual([
        `dependency:${CHECKOUT}:0`,
        `dependency:${CHECKOUT}:1`,
        "dependency:src/index.js:0",
      ]);
    });

    it("should take the level of the verdict, and the meta of the policy that decided", () => {
      // Act
      const items = getDependencyProblemItems(
        [
          failing(CHECKOUT, 0, {
            level: "warning",
            policy: { index: null, range: POLICY_RANGE },
          }),
          failing(CHECKOUT, 1, { policy: undefined }),
        ],
        true
      );

      // Assert
      expect(items.map(({ level, meta }) => [level, meta])).toEqual([
        ["warning", "disallowed · default"],
        ["error", "disallowed · custom message"],
      ]);
    });

    it("should give no rows for no dependencies", () => {
      // Act
      const items = getDependencyProblemItems([], true);

      // Assert
      expect(items).toEqual([]);
    });
  });

  describe("getTabLabel", () => {
    it("should name a file by its folder and its name", () => {
      // Act
      const label = getTabLabel("src/modules/checkout/index.js");

      // Assert
      expect(label).toBe("checkout/index.js");
    });

    it("should name a file in a folder of the root by the folder and the name", () => {
      // Act
      const label = getTabLabel("src/index.js");

      // Assert
      expect(label).toBe("src/index.js");
    });

    it("should name a file at the root by its name alone", () => {
      // Act
      const label = getTabLabel("index.js");

      // Assert
      expect(label).toBe("index.js");
    });

    it("should name the config by its name", () => {
      // Act
      const label = getTabLabel("eslint.config.js");

      // Assert
      expect(label).toBe("eslint.config.js");
    });
  });

  describe("getCountTone", () => {
    it("should be bad when any problem is an error", () => {
      // Act
      const tone = getCountTone(true);

      // Assert
      expect(tone).toBe("bad");
    });

    it("should be warn when there are only warnings and deprecations, or no problems", () => {
      // Act
      const tone = getCountTone(false);

      // Assert
      expect(tone).toBe("warn");
    });
  });

  describe("toProblemsTabs", () => {
    const SKETCH_TAB: ProblemTabFacts = {
      id: "sketch",
      subject: { kind: "sketch" },
      badge: { count: 3, hasErrors: true },
    };

    it("should give no tabs for no facts", () => {
      // Act
      const tabs = toProblemsTabs([]);

      // Assert
      expect(tabs).toEqual([]);
    });

    it("should label the tab of the sketch, count its problems and tone the badge by its errors", () => {
      // Act
      const tabs = toProblemsTabs([SKETCH_TAB]);

      // Assert
      expect(tabs).toEqual([
        { id: "sketch", label: "Sketch", count: 3, tone: "bad" },
      ]);
    });

    it("should tone the badge of a tab without errors as a warning", () => {
      // Act
      const tabs = toProblemsTabs([
        { ...SKETCH_TAB, badge: { count: 3, hasErrors: false } },
      ]);

      // Assert
      expect(tabs).toEqual([
        { id: "sketch", label: "Sketch", count: 3, tone: "warn" },
      ]);
    });

    it("should label the tab of the config with its path in mono, with its own count and tone", () => {
      // Act
      const tabs = toProblemsTabs([
        SKETCH_TAB,
        {
          id: "node",
          subject: { kind: "config" },
          badge: { count: 2, hasErrors: false },
        },
      ]);

      // Assert
      expect(tabs).toEqual([
        { id: "sketch", label: "Sketch", count: 3, tone: "bad" },
        {
          id: "node",
          label: "eslint.config.js",
          mono: true,
          count: 2,
          tone: "warn",
        },
      ]);
    });

    it("should name the tab of the file by its folder and its name in mono, without a count", () => {
      // Act
      const tabs = toProblemsTabs([
        SKETCH_TAB,
        {
          id: "node",
          subject: { kind: "file", path: "src/modules/checkout/index.js" },
        },
      ]);

      // Assert
      expect(tabs).toEqual([
        { id: "sketch", label: "Sketch", count: 3, tone: "bad" },
        { id: "node", label: "checkout/index.js", mono: true },
      ]);
      expect(tabs[1]).not.toHaveProperty("count");
      expect(tabs[1]).not.toHaveProperty("tone");
    });

    it("should label the tab of a file with the count of its failing dependencies", () => {
      // Act
      const tabs = toProblemsTabs([
        {
          id: "node",
          subject: { kind: "file", path: "src/modules/checkout/index.js" },
          badge: { count: 1, hasErrors: true },
        },
      ]);

      // Assert
      expect(tabs).toEqual([
        {
          id: "node",
          label: "checkout/index.js",
          mono: true,
          count: 1,
          tone: "bad",
        },
      ]);
    });

    describe("the tab of a dependency", () => {
      /**
       * Builds the facts of the tab of a dependency.
       * @param index Its position among the dependencies of the file.
       * @param verdict What the engine says about it.
       * @returns The facts.
       */
      function dependencyTab(
        index: number,
        verdict?: DependencyVerdict
      ): ProblemTabFacts {
        return {
          id: "dependency",
          subject: { kind: "dependency", ref: { path: CHECKOUT, index } },
          verdict,
        };
      }

      it.each<[string, DependencyVerdict, string, string]>([
        [
          "disallowed as an error",
          failing(CHECKOUT, 2).verdict,
          "cross",
          "bad",
        ],
        [
          "disallowed as a warning",
          failing(CHECKOUT, 2, { level: "warning" }).verdict,
          "warn",
          "warn",
        ],
        [
          "allowed",
          { status: "allowed", policy: { index: 1, range: POLICY_RANGE } },
          "check",
          "ok",
        ],
        [
          "not checked",
          { status: "not-checked", reason: "not-local" },
          "skip",
          "faint",
        ],
        ["not evaluated", { status: "not-evaluated" }, "skip", "faint"],
      ])(
        "should be `line 3` in mono with the icon and the tone of a dependency that is %s, and no count",
        (_title, verdict, icon, iconTone) => {
          // Act
          const [tab] = toProblemsTabs([dependencyTab(2, verdict)]);

          // Assert
          expect(tab).toEqual({
            id: "dependency",
            label: "line 3",
            mono: true,
            icon,
            iconTone,
          });
        }
      );

      it("should number the line from 1", () => {
        // Act
        const [tab] = toProblemsTabs([
          dependencyTab(0, { status: "not-evaluated" }),
        ]);

        // Assert
        expect(tab.label).toBe("line 1");
      });

      it("should draw no icon for a dependency that the evaluation does not know", () => {
        // Act
        const [tab] = toProblemsTabs([dependencyTab(2)]);

        // Assert
        expect(tab).toEqual({ id: "dependency", label: "line 3", mono: true });
      });
    });
  });

  describe("toProblemListContent", () => {
    const TEXT_LINE = {
      line: 2,
      text: "  import { a } from './b'",
      reason: "Dependencies are not written in text mode yet.",
    };
    const SKETCH_FACTS: ProblemRowsFacts = {
      subject: { kind: "sketch" },
      configProblems: [INVALID_OPTIONS],
      textProblems: [TEXT_LINE],
      dependencies: [],
      notEvaluated: undefined,
      highlight: undefined,
    };
    const CONFIG_FACTS: ProblemRowsFacts = {
      subject: { kind: "config" },
      configProblems: [],
      textProblems: [],
      dependencies: [],
      notEvaluated: undefined,
      highlight: undefined,
    };
    const HIGHLIGHT = {
      policy: 2,
      dependency: { path: CHECKOUT, index: 2 },
    };

    it("should list the problems of the config and then the lines of text under the sketch", () => {
      // Act
      const content = toProblemListContent(SKETCH_FACTS);

      // Assert
      expect(content.items.map(({ key }) => key)).toEqual([
        "config:0",
        "text:0",
      ]);
      expect(content.empty).toBe("No problems in the sketch.");
      expect(content.notes).toEqual([]);
    });

    it("should list the failing dependencies after the problems of the config and the lines of text, with the file of each", () => {
      // Act
      const content = toProblemListContent({
        ...SKETCH_FACTS,
        dependencies: [failing(CHECKOUT, 2), failing("src/index.js", 0)],
      });

      // Assert
      expect(content.items.map(({ key }) => key)).toEqual([
        "config:0",
        "text:0",
        `dependency:${CHECKOUT}:2`,
        "dependency:src/index.js:0",
      ]);
      expect(content.items[2].location).toBe(CHECKOUT);
    });

    it("should list the problems of the config alone under the config", () => {
      // Act
      const content = toProblemListContent({
        ...CONFIG_FACTS,
        configProblems: [INVALID_OPTIONS, IGNORED_DESCRIPTORS],
      });

      // Assert
      expect(content.items.map(({ key }) => key)).toEqual([
        "config:0",
        "config:1",
      ]);
      expect(content.empty).toBe("No problems in the config.");
      expect(content.notes).toEqual([]);
    });

    it("should open each problem of the config at its range", () => {
      // Act
      const content = toProblemListContent(SKETCH_FACTS);

      // Assert
      expect(content.items[0].target).toEqual({
        kind: "config",
        range: INVALID_OPTIONS.range,
      });
    });

    it("should open no line of text", () => {
      // Act
      const content = toProblemListContent({
        ...SKETCH_FACTS,
        configProblems: [],
      });

      // Assert
      expect(content.items[0].target).toBeUndefined();
    });

    it("should open the dependency of a failing dependency", () => {
      // Act
      const content = toProblemListContent({
        ...SKETCH_FACTS,
        configProblems: [],
        textProblems: [],
        dependencies: [failing(CHECKOUT, 2)],
      });

      // Assert
      expect(content.items[0].target).toEqual({
        kind: "dependency",
        path: CHECKOUT,
        index: 2,
      });
    });

    it("should say that nothing is listed for a file", () => {
      // Act
      const content = toProblemListContent({
        subject: { kind: "file", path: "src/index.js" },
        configProblems: [],
        textProblems: [],
        dependencies: [],
        notEvaluated: undefined,
        highlight: undefined,
      });

      // Assert
      expect(content).toEqual({
        items: [],
        empty: "No problems in this file.",
        notes: [],
        detail: undefined,
      });
    });

    it("should list the failing dependencies of a file without the file, starting at the line", () => {
      // Act
      const content = toProblemListContent({
        subject: { kind: "file", path: CHECKOUT },
        configProblems: [],
        textProblems: [],
        dependencies: [failing(CHECKOUT, 2)],
        notEvaluated: undefined,
        highlight: undefined,
      });

      // Assert
      expect(content.items).toHaveLength(1);
      expect(content.items[0]).not.toHaveProperty("location");
      expect(content.items[0].position).toBe(":3");
    });

    it.each<[NotEvaluatedReason, string]>([
      [
        "config-unparsed",
        "Dependencies are not evaluated while the config cannot be read: without its rules, ESLint checks no dependency.",
      ],
      [
        "rules-invalid",
        "Dependencies are not evaluated while the rule options are invalid: ESLint does not run a rule whose options fail its schema.",
      ],
      [
        "no-rule",
        "Dependencies are not evaluated while neither boundaries/dependencies nor boundaries/element-types is in the rules: ESLint runs no rule that checks them.",
      ],
      [
        "rule-off",
        "Dependencies are not evaluated while the rule is off: ESLint does not run a rule whose severity is off.",
      ],
      [
        "no-options",
        "Dependencies are not evaluated while the rule has no options: it checks nothing until its entry has an options object, even an empty one.",
      ],
    ])(
      "should say why dependencies are not evaluated when the reason is %s",
      (reason, sentence) => {
        // Act
        const content = toProblemListContent({
          ...SKETCH_FACTS,
          notEvaluated: reason,
        });

        // Assert
        expect(content.notes).toEqual([sentence]);
      }
    );

    describe("the note about the highlighted policy", () => {
      it("should say which policy is highlighted and where it came from, after saying there are no problems in the config, in one note", () => {
        // Act
        const content = toProblemListContent({
          ...CONFIG_FACTS,
          highlight: HIGHLIGHT,
        });

        // Assert
        expect(content.notes).toEqual([
          "No problems in the config. Policy 2 is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js.",
        ]);
        expect(content.empty).toBeUndefined();
      });

      it("should say it for the default", () => {
        // Act
        const content = toProblemListContent({
          ...CONFIG_FACTS,
          highlight: {
            policy: null,
            dependency: { path: "src/index.js", index: 0 },
          },
        });

        // Assert
        expect(content.notes).toEqual([
          "No problems in the config. The default is highlighted, opened from the dependency at line 1 of src/index.js.",
        ]);
      });

      it("should say only which policy is highlighted when the config has problems, which the rows list", () => {
        // Act
        const content = toProblemListContent({
          ...CONFIG_FACTS,
          configProblems: [INVALID_OPTIONS],
          highlight: HIGHLIGHT,
        });

        // Assert
        expect(content.notes).toEqual([
          "Policy 2 is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js.",
        ]);
        expect(content.items).toHaveLength(1);
        expect(content.empty).toBe("No problems in the config.");
      });

      it("should come after the note about dependencies that are not evaluated", () => {
        // Act
        const content = toProblemListContent({
          ...CONFIG_FACTS,
          notEvaluated: "rule-off",
          highlight: HIGHLIGHT,
        });

        // Assert
        expect(content.notes).toEqual([
          "Dependencies are not evaluated while the rule is off: ESLint does not run a rule whose severity is off.",
          "No problems in the config. Policy 2 is highlighted, opened from the dependency at line 3 of src/modules/checkout/index.js.",
        ]);
      });
    });

    describe("a dependency", () => {
      const DETAIL: DependencyDetailFacts = {
        subject: { kind: "dependency", ref: { path: CHECKOUT, index: 2 } },
        result: failing(CHECKOUT, 2),
        description: undefined,
        policy: {
          index: 2,
          range: POLICY_RANGE,
          tokens: [{ kind: "punctuation", text: "{}" }],
        },
      };

      it("should give its body in place of rows and notes", () => {
        // Act
        const content = toProblemListContent(DETAIL);

        // Assert
        expect(content.items).toEqual([]);
        expect(content.notes).toEqual([]);
        expect(content.empty).toBeUndefined();
        expect(content.detail?.verdict.text).toBe("disallowed · policy 2");
      });

      it("should give no body for the other lists", () => {
        // Act
        const content = toProblemListContent(SKETCH_FACTS);

        // Assert
        expect(content.detail).toBeUndefined();
      });
    });
  });
});
