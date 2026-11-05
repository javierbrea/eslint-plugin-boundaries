import type { ConfigProblem } from "@/domains/evaluation/helpers/engine";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import type { Focus } from "@/domains/session/helpers/focus";

import {
  getProblemCounts,
  getProblemList,
  getProblemTabs,
  getShownTab,
  getTextProblems,
  summarizeProblems,
} from "./problemSelectors";
import type { ProblemSummary } from "./problemSelectors.types";

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
  reason: "Dependencies are not written in text mode yet.",
};

const NO_FOCUS: Focus = { kind: "none" };

const CONFIG_FOCUS: Focus = { kind: "config" };

const FILE_FOCUS: Focus = {
  kind: "file",
  path: "src/modules/checkout/index.js",
};

describe("problemSelectors", () => {
  describe("getTextProblems", () => {
    it("should give no lines when there is no draft", () => {
      // Act
      const problems = getTextProblems(undefined);

      // Assert
      expect(problems).toEqual([]);
    });

    it("should give the same array each time there is no draft", () => {
      // Act
      const first = getTextProblems(undefined);
      const second = getTextProblems(undefined);

      // Assert
      expect(second).toBe(first);
    });

    it("should give the lines of the draft that cannot be read", () => {
      // Act
      const problems = getTextProblems(`main.js\n${UNREADABLE_LINE}\n`);

      // Assert
      expect(problems).toEqual([TEXT_PROBLEM]);
    });

    it("should give no lines for a draft that can be read", () => {
      // Act
      const problems = getTextProblems("main.js\nsrc/index.js\n");

      // Assert
      expect(problems).toEqual([]);
    });
  });

  describe("summarizeProblems", () => {
    it("should count nothing and have no errors when there are no problems", () => {
      // Act
      const summary = summarizeProblems([], []);

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
      const summary = summarizeProblems([WARNING, DEPRECATION], []);

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
      const summary = summarizeProblems([WARNING, ERROR], []);

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
      const summary = summarizeProblems([], [TEXT_PROBLEM]);

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
        [TEXT_PROBLEM, { ...TEXT_PROBLEM, line: 4 }]
      );

      // Assert
      expect(summary).toEqual({
        configCount: 1,
        configHasErrors: false,
        total: 3,
        hasErrors: true,
      });
    });
  });

  describe("getProblemCounts", () => {
    it("should give the problems of the config", () => {
      // Act
      const counts = getProblemCounts(3, true);

      // Assert
      expect(counts.config).toBe(3);
      expect(counts.configHasErrors).toBe(true);
    });

    it("should give no problems for the paths until dependencies are evaluated", () => {
      // Act
      const counts = getProblemCounts(0, false);

      // Assert
      expect(counts.byPath.size).toBe(0);
    });

    it("should share the empty map of the paths, so that a count that changes does not change it", () => {
      // Act
      const first = getProblemCounts(1, false);
      const second = getProblemCounts(2, true);

      // Assert
      expect(second.byPath).toBe(first.byPath);
    });
  });

  describe("getShownTab", () => {
    it.each<["sketch" | "node", Focus, "sketch" | "node"]>([
      ["node", NO_FOCUS, "sketch"],
      ["sketch", NO_FOCUS, "sketch"],
      ["node", CONFIG_FOCUS, "node"],
      ["sketch", CONFIG_FOCUS, "sketch"],
      ["node", FILE_FOCUS, "node"],
      ["sketch", FILE_FOCUS, "sketch"],
    ])(
      "should show the %s tab selected with %j in focus as %s",
      (tab, openNode, shown) => {
        // Act
        const result = getShownTab(openNode, tab);

        // Assert
        expect(result).toBe(shown);
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

    it("should give the tab of the sketch alone when nothing is in focus", () => {
      // Act
      const tabs = getProblemTabs(NO_FOCUS, SUMMARY);

      // Assert
      expect(tabs).toEqual([
        {
          id: "sketch",
          subject: { kind: "sketch" },
          count: 3,
          hasErrors: true,
        },
      ]);
    });

    it("should add the tab of the config with its own count and errors", () => {
      // Act
      const tabs = getProblemTabs(CONFIG_FOCUS, SUMMARY);

      // Assert
      expect(tabs).toEqual([
        {
          id: "sketch",
          subject: { kind: "sketch" },
          count: 3,
          hasErrors: true,
        },
        {
          id: "node",
          subject: { kind: "config" },
          count: 2,
          hasErrors: false,
        },
      ]);
    });

    it("should add the tab of the file in focus, named by its path, without a count", () => {
      // Act
      const tabs = getProblemTabs(FILE_FOCUS, SUMMARY);

      // Assert
      expect(tabs).toEqual([
        {
          id: "sketch",
          subject: { kind: "sketch" },
          count: 3,
          hasErrors: true,
        },
        {
          id: "node",
          subject: { kind: "file", path: "src/modules/checkout/index.js" },
        },
      ]);
      expect(tabs[1]).not.toHaveProperty("count");
      expect(tabs[1]).not.toHaveProperty("hasErrors");
    });
  });

  describe("getProblemList", () => {
    it("should list the problems of the config and the lines of text under the sketch's tab", () => {
      // Act
      const facts = getProblemList("sketch", NO_FOCUS, [ERROR], true, [
        TEXT_PROBLEM,
      ]);

      // Assert
      expect(facts).toEqual({
        subject: { kind: "sketch" },
        configProblems: [ERROR],
        textProblems: [TEXT_PROBLEM],
        rulesNote: false,
      });
    });

    it("should list the sketch whatever the tab when nothing is in focus", () => {
      // Act
      const facts = getProblemList("node", NO_FOCUS, [ERROR], true, []);

      // Assert
      expect(facts.subject).toEqual({ kind: "sketch" });
      expect(facts.configProblems).toEqual([ERROR]);
    });

    it("should list the sketch under the sketch's tab although something is in focus", () => {
      // Act
      const facts = getProblemList("sketch", CONFIG_FOCUS, [ERROR], true, [
        TEXT_PROBLEM,
      ]);

      // Assert
      expect(facts.subject).toEqual({ kind: "sketch" });
      expect(facts.configProblems).toEqual([ERROR]);
      expect(facts.textProblems).toEqual([TEXT_PROBLEM]);
    });

    it("should list the problems of the config alone under the tab of the config", () => {
      // Act
      const facts = getProblemList(
        "node",
        CONFIG_FOCUS,
        [ERROR, WARNING],
        true,
        [TEXT_PROBLEM]
      );

      // Assert
      expect(facts).toEqual({
        subject: { kind: "config" },
        configProblems: [ERROR, WARNING],
        textProblems: [],
        rulesNote: false,
      });
    });

    it("should hold each problem of the config as the engine gave it, with its range", () => {
      // Act
      const facts = getProblemList("node", CONFIG_FOCUS, [ERROR], true, []);

      // Assert
      expect(facts.configProblems[0]).toBe(ERROR);
      expect(facts.configProblems[0].range).toEqual(ERROR.range);
    });

    it("should hold each line of text as it was read", () => {
      // Act
      const facts = getProblemList("sketch", NO_FOCUS, [], true, [
        TEXT_PROBLEM,
      ]);

      // Assert
      expect(facts.textProblems[0]).toBe(TEXT_PROBLEM);
    });

    it.each<["sketch" | "node", Focus]>([
      ["sketch", NO_FOCUS],
      ["node", CONFIG_FOCUS],
    ])(
      "should say that the rule options are invalid under the %s tab with %j in focus",
      (tab, openNode) => {
        // Act
        const facts = getProblemList(tab, openNode, [], false, []);

        // Assert
        expect(facts.rulesNote).toBe(true);
      }
    );

    it("should list nothing under the tab of a file until dependencies are evaluated", () => {
      // Act
      const facts = getProblemList("node", FILE_FOCUS, [ERROR], true, [
        TEXT_PROBLEM,
      ]);

      // Assert
      expect(facts).toEqual({
        subject: { kind: "file", path: "src/modules/checkout/index.js" },
        configProblems: [],
        textProblems: [],
        rulesNote: false,
      });
    });

    it("should not say that the rule options are invalid under the tab of a file", () => {
      // Act
      const facts = getProblemList("node", FILE_FOCUS, [], false, []);

      // Assert
      expect(facts.rulesNote).toBe(false);
    });
  });
});
