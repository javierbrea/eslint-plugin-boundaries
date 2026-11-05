import type { ConfigProblem } from "@/domains/evaluation/helpers/engine";
import type { TextProblem } from "@/domains/project/helpers/sketch";
import type { Focus } from "@/domains/session/helpers/focus";

import type { ProblemSummary } from "./Problems.types";
import {
  getProblemCounts,
  getProblemList,
  getProblemTabs,
  getShownTab,
  getTextProblems,
  summarizeProblems,
} from "./Selectors";

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

describe("Selectors", () => {
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
    it("should count nothing and be a warning tone when there are no problems", () => {
      // Act
      const summary = summarizeProblems([], []);

      // Assert
      expect(summary).toEqual({
        configCount: 0,
        configTone: "warn",
        total: 0,
        tone: "warn",
        configHasErrors: false,
      });
    });

    it("should be a warning tone when the problems are warnings and deprecations", () => {
      // Act
      const summary = summarizeProblems([WARNING, DEPRECATION], []);

      // Assert
      expect(summary).toEqual({
        configCount: 2,
        configTone: "warn",
        total: 2,
        tone: "warn",
        configHasErrors: false,
      });
    });

    it("should be a bad tone and have errors when a problem of the config is an error", () => {
      // Act
      const summary = summarizeProblems([WARNING, ERROR], []);

      // Assert
      expect(summary).toEqual({
        configCount: 2,
        configTone: "bad",
        total: 2,
        tone: "bad",
        configHasErrors: true,
      });
    });

    it("should count a line that cannot be read as an error that is not of the config", () => {
      // Act
      const summary = summarizeProblems([], [TEXT_PROBLEM]);

      // Assert
      expect(summary).toEqual({
        configCount: 0,
        configTone: "warn",
        total: 1,
        tone: "bad",
        configHasErrors: false,
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
        configTone: "warn",
        total: 3,
        tone: "bad",
        configHasErrors: false,
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
      configTone: "warn",
      total: 3,
      tone: "bad",
      configHasErrors: false,
    };

    it("should give the tab of the sketch alone when nothing is in focus", () => {
      // Act
      const tabs = getProblemTabs(NO_FOCUS, SUMMARY);

      // Assert
      expect(tabs).toEqual([
        { id: "sketch", label: "Sketch", count: 3, tone: "bad" },
      ]);
    });

    it("should add the tab of the config with its own count and tone", () => {
      // Act
      const tabs = getProblemTabs(CONFIG_FOCUS, SUMMARY);

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

    it("should add the tab of the file in focus, named by its folder and its name, without a count", () => {
      // Act
      const tabs = getProblemTabs(FILE_FOCUS, SUMMARY);

      // Assert
      expect(tabs).toEqual([
        { id: "sketch", label: "Sketch", count: 3, tone: "bad" },
        { id: "node", label: "checkout/index.js", mono: true },
      ]);
    });
  });

  describe("getProblemList", () => {
    it("should list the problems of the config and the lines of text under the sketch's tab", () => {
      // Act
      const content = getProblemList("sketch", NO_FOCUS, [ERROR], true, [
        TEXT_PROBLEM,
      ]);

      // Assert
      expect(content.items.map(({ key }) => key)).toEqual([
        "config:0",
        "text:0",
      ]);
      expect(content.empty).toBe("No problems in the sketch.");
      expect(content.rulesNote).toBe(false);
    });

    it("should list the sketch whatever the tab when nothing is in focus", () => {
      // Act
      const content = getProblemList("node", NO_FOCUS, [ERROR], true, []);

      // Assert
      expect(content.items.map(({ key }) => key)).toEqual(["config:0"]);
      expect(content.empty).toBe("No problems in the sketch.");
    });

    it("should list the sketch under the sketch's tab although something is in focus", () => {
      // Act
      const content = getProblemList("sketch", CONFIG_FOCUS, [ERROR], true, [
        TEXT_PROBLEM,
      ]);

      // Assert
      expect(content.items).toHaveLength(2);
      expect(content.empty).toBe("No problems in the sketch.");
    });

    it("should list the problems of the config alone under the tab of the config", () => {
      // Act
      const content = getProblemList(
        "node",
        CONFIG_FOCUS,
        [ERROR, WARNING],
        true,
        [TEXT_PROBLEM]
      );

      // Assert
      expect(content.items.map(({ key }) => key)).toEqual([
        "config:0",
        "config:1",
      ]);
      expect(content.empty).toBe("No problems in the config.");
      expect(content.rulesNote).toBe(false);
    });

    it("should open each problem of the config at its range", () => {
      // Act
      const content = getProblemList("node", CONFIG_FOCUS, [ERROR], true, []);

      // Assert
      expect(content.items[0].target).toEqual({
        kind: "config",
        range: ERROR.range,
      });
    });

    it("should open no line of text", () => {
      // Act
      const content = getProblemList("sketch", NO_FOCUS, [], true, [
        TEXT_PROBLEM,
      ]);

      // Assert
      expect(content.items[0].target).toBeUndefined();
    });

    it.each<["sketch" | "node", Focus]>([
      ["sketch", NO_FOCUS],
      ["node", CONFIG_FOCUS],
    ])(
      "should say that the rule options are invalid under the %s tab with %j in focus",
      (tab, openNode) => {
        // Act
        const content = getProblemList(tab, openNode, [], false, []);

        // Assert
        expect(content.rulesNote).toBe(true);
      }
    );

    it("should list nothing under the tab of a file until dependencies are evaluated", () => {
      // Act
      const content = getProblemList("node", FILE_FOCUS, [ERROR], true, [
        TEXT_PROBLEM,
      ]);

      // Assert
      expect(content).toEqual({
        items: [],
        empty: "No problems in this file.",
        rulesNote: false,
      });
    });

    it("should not say that the rule options are invalid under the tab of a file", () => {
      // Act
      const content = getProblemList("node", FILE_FOCUS, [], false, []);

      // Assert
      expect(content.rulesNote).toBe(false);
    });
  });
});
