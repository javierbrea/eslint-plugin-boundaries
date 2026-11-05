import type { ConfigProblem } from "@/domains/evaluation/helpers/engine";
import type { TextProblem } from "@/domains/project/helpers/sketch";

import {
  getConfigProblemItems,
  getCountTone,
  getTabLabel,
  getTextProblemItems,
} from "./ProblemItems";

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

describe("ProblemItems", () => {
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
      const tone = getCountTone(["warning", "error", "deprecation"]);

      // Assert
      expect(tone).toBe("bad");
    });

    it("should be warn when there are only warnings and deprecations", () => {
      // Act
      const tone = getCountTone(["warning", "deprecation"]);

      // Assert
      expect(tone).toBe("warn");
    });

    it("should be warn when there are no problems", () => {
      // Act
      const tone = getCountTone([]);

      // Assert
      expect(tone).toBe("warn");
    });
  });
});
