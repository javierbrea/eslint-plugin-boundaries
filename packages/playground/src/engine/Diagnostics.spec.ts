// cspell:ignore patern -- deliberate typos, the mistakes of the config that the tests evaluate
import type { Diagnostic } from "@boundaries/config";
import { parse } from "@humanwhocodes/momoa";

import {
  areRulesValid,
  hasErrorUnder,
  pointsTo,
  toConfigProblems,
} from "./Diagnostics";

const TEXT = [
  "{",
  "  settings: {",
  '    "boundaries/elements": [{ type: "helper" }, { patern: "x" }],',
  "  },",
  "  rules: {",
  '    "boundaries/dependencies": [2, { default: "maybe" }],',
  "  },",
  "}",
].join("\n");

const TREE = parse(TEXT, { mode: "json5" });

const SETTINGS_WARNING: Diagnostic = {
  level: "warning",
  title: "Some element descriptors are invalid and will be ignored.",
  detail: "Invalid descriptors: [].",
  paths: [["settings", "boundaries/elements", 1]],
};

const RULE_ERROR: Diagnostic = {
  level: "error",
  title: "[boundaries/dependencies] Invalid rule options.",
  paths: [["rules", "boundaries/dependencies", 1, "default"]],
};

const RULE_DEPRECATION: Diagnostic = {
  level: "deprecation",
  title: "Legacy selectors.",
  detail: "Replace them.",
  paths: [["rules", "boundaries/dependencies", 1]],
};

describe("Diagnostics", () => {
  describe("toConfigProblems", () => {
    it("should place the problem of a diagnostic at the value of its path", () => {
      // Arrange
      const diagnostics = [SETTINGS_WARNING];

      // Act
      const problems = toConfigProblems(diagnostics, TREE);

      // Assert
      const element = '{ patern: "x" }';

      expect(problems).toEqual([
        {
          level: "warning",
          title: "Some element descriptors are invalid and will be ignored.",
          detail: "Invalid descriptors: [].",
          links: [],
          path: ["settings", "boundaries/elements", 1],
          range: {
            from: TEXT.indexOf(element),
            to: TEXT.indexOf(element) + element.length,
            line: 3,
            column: 49,
          },
          source: "config",
        },
      ]);
    });

    it("should return a problem for each path of a diagnostic, in the order of the diagnostics", () => {
      // Arrange
      const diagnostics: Diagnostic[] = [
        {
          level: "warning",
          title: "Several entries",
          paths: [["settings"], ["rules"], []],
        },
        RULE_ERROR,
      ];

      // Act
      const problems = toConfigProblems(diagnostics, TREE);

      // Assert
      expect(
        problems.map(({ title, path, range }) => [title, path, range.line])
      ).toEqual([
        ["Several entries", ["settings"], 2],
        ["Several entries", ["rules"], 5],
        ["Several entries", [], 1],
        [
          RULE_ERROR.title,
          ["rules", "boundaries/dependencies", 1, "default"],
          6,
        ],
      ]);
    });

    it("should keep the level and leave the detail out when there is none", () => {
      // Arrange
      const diagnostics = [RULE_ERROR, RULE_DEPRECATION];

      // Act
      const problems = toConfigProblems(diagnostics, TREE);

      // Assert
      expect(
        problems.map(({ level, detail, links }) => [level, detail, links])
      ).toEqual([
        ["error", undefined, []],
        ["deprecation", "Replace them.", []],
      ]);
    });

    it.each([
      [
        "after the text on the same line",
        "Use 'policies' instead. More info: https://www.jsboundaries.dev/docs/rules/dependencies/",
        "Use 'policies' instead.",
        ["https://www.jsboundaries.dev/docs/rules/dependencies/"],
      ],
      [
        "on a line of its own",
        'Value "deny" should be equal to one of the allowed values.\nMore info: https://www.jsboundaries.dev/docs/rules/dependencies/#options',
        'Value "deny" should be equal to one of the allowed values.',
        ["https://www.jsboundaries.dev/docs/rules/dependencies/#options"],
      ],
      [
        "without the label",
        "Read https://www.jsboundaries.dev/docs/settings/",
        "Read",
        ["https://www.jsboundaries.dev/docs/settings/"],
      ],
      [
        "in the middle of the text",
        "First line.\nSecond line. More info: https://example.com/one Then more text.",
        "First line.\nSecond line. Then more text.",
        ["https://example.com/one"],
      ],
      [
        "twice, in the order they were written",
        "See https://example.com/one and More info: https://example.com/two for more.",
        "See and for more.",
        ["https://example.com/one", "https://example.com/two"],
      ],
    ])(
      "should split a detail with a link %s into its text and its links",
      (_case, detail, text, links) => {
        // Arrange
        const diagnostics: Diagnostic[] = [{ ...SETTINGS_WARNING, detail }];

        // Act
        const [problem] = toConfigProblems(diagnostics, TREE);

        // Assert
        expect(problem.detail).toBe(text);
        expect(problem.links).toEqual(links);
      }
    );

    it("should leave no detail for a detail that is only a link", () => {
      // Arrange
      const diagnostics: Diagnostic[] = [
        {
          ...SETTINGS_WARNING,
          detail: "More info: https://www.jsboundaries.dev/docs/settings/",
        },
      ];

      // Act
      const [problem] = toConfigProblems(diagnostics, TREE);

      // Assert
      expect(problem.detail).toBeUndefined();
      expect(problem.links).toEqual([
        "https://www.jsboundaries.dev/docs/settings/",
      ]);
    });

    it("should leave no detail for a detail that is empty", () => {
      // Arrange
      const diagnostics: Diagnostic[] = [{ ...SETTINGS_WARNING, detail: " " }];

      // Act
      const [problem] = toConfigProblems(diagnostics, TREE);

      // Assert
      expect(problem.detail).toBeUndefined();
      expect(problem.links).toEqual([]);
    });

    it("should keep a text that is not a http or https URL as part of the detail", () => {
      // Arrange
      const detail = "Use javascript:alert(1) or ftp://x.dev";
      const diagnostics: Diagnostic[] = [{ ...SETTINGS_WARNING, detail }];

      // Act
      const [problem] = toConfigProblems(diagnostics, TREE);

      // Assert
      expect(problem.detail).toBe(detail);
      expect(problem.links).toEqual([]);
    });

    it("should give every problem of a diagnostic the same detail and links", () => {
      // Arrange
      const diagnostics: Diagnostic[] = [
        {
          ...SETTINGS_WARNING,
          detail: "Fix it. More info: https://www.jsboundaries.dev/docs/",
          paths: [["settings"], ["rules"]],
        },
      ];

      // Act
      const problems = toConfigProblems(diagnostics, TREE);

      // Assert
      expect(problems.map(({ detail, links }) => [detail, links])).toEqual([
        ["Fix it.", ["https://www.jsboundaries.dev/docs/"]],
        ["Fix it.", ["https://www.jsboundaries.dev/docs/"]],
      ]);
    });

    it("should return no problems when there are no diagnostics", () => {
      // Arrange
      // Act
      const problems = toConfigProblems([], TREE);

      // Assert
      expect(problems).toEqual([]);
    });
  });

  describe("pointsTo", () => {
    it("should be true when a diagnostic has exactly the path", () => {
      // Arrange
      const diagnostics = [RULE_ERROR, SETTINGS_WARNING];

      // Act
      const result = pointsTo(diagnostics, [
        "settings",
        "boundaries/elements",
        1,
      ]);

      // Assert
      expect(result).toBe(true);
    });

    it("should be false when the paths of the diagnostics are longer than the path", () => {
      // Arrange
      const diagnostics = [
        {
          ...SETTINGS_WARNING,
          paths: [["settings", "boundaries/elements", 1, "mode"]],
        },
      ];

      // Act
      const result = pointsTo(diagnostics, [
        "settings",
        "boundaries/elements",
        1,
      ]);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when the paths of the diagnostics are shorter than the path", () => {
      // Arrange
      const diagnostics = [{ ...SETTINGS_WARNING, paths: [["settings"]] }];

      // Act
      const result = pointsTo(diagnostics, [
        "settings",
        "boundaries/elements",
        1,
      ]);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when the path is another entry", () => {
      // Arrange
      const diagnostics = [SETTINGS_WARNING];

      // Act
      const result = pointsTo(diagnostics, [
        "settings",
        "boundaries/elements",
        0,
      ]);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false without diagnostics", () => {
      // Arrange
      // Act
      const result = pointsTo([], ["settings"]);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("hasErrorUnder", () => {
    it("should be true when an error has a path inside the path", () => {
      // Arrange
      const diagnostics = [SETTINGS_WARNING, RULE_ERROR];

      // Act
      const result = hasErrorUnder(diagnostics, [
        "rules",
        "boundaries/dependencies",
      ]);

      // Assert
      expect(result).toBe(true);
    });

    it("should be true when an error has exactly the path", () => {
      // Arrange
      const diagnostics = [{ ...RULE_ERROR, paths: [["rules"]] }];

      // Act
      const result = hasErrorUnder(diagnostics, ["rules"]);

      // Assert
      expect(result).toBe(true);
    });

    it("should be false when the diagnostics inside the path are not errors", () => {
      // Arrange
      const diagnostics = [RULE_DEPRECATION, SETTINGS_WARNING];

      // Act
      const result = hasErrorUnder(diagnostics, ["rules"]);

      // Assert
      expect(result).toBe(false);
    });

    it("should be false when the errors are about another entry", () => {
      // Arrange
      const diagnostics = [RULE_ERROR];

      // Act
      const result = hasErrorUnder(diagnostics, [
        "rules",
        "boundaries/no-private",
      ]);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("areRulesValid", () => {
    it("should be false when an error is about a rule", () => {
      // Arrange
      const diagnostics = [SETTINGS_WARNING, RULE_ERROR];

      // Act
      const result = areRulesValid(diagnostics);

      // Assert
      expect(result).toBe(false);
    });

    it("should be true when the only error is about the settings", () => {
      // Arrange
      const diagnostics: Diagnostic[] = [
        { level: "error", title: "Key settings", paths: [["settings"]] },
        RULE_DEPRECATION,
      ];

      // Act
      const result = areRulesValid(diagnostics);

      // Assert
      expect(result).toBe(true);
    });
  });
});
