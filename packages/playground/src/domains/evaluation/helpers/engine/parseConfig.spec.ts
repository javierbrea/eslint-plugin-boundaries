import { evaluate, parse } from "@humanwhocodes/momoa";

import type { ConfigProblem } from "./engine.types";
import { parseConfig } from "./parseConfig";

// The real parser, except where a test makes it throw what momoa does not, or what it throws only on a text too long to write in a test
jest.mock<{ parse: typeof parse; evaluate: typeof evaluate }>(
  "@humanwhocodes/momoa",
  () => {
    const actual = jest.requireActual<{
      parse: typeof parse;
      evaluate: typeof evaluate;
    }>("@humanwhocodes/momoa");
    return {
      ...actual,
      parse: jest.fn(actual.parse),
      evaluate: jest.fn(actual.evaluate),
    };
  }
);

const ACCEPTS = "The config must be one JSON5 object with settings and rules.";

const QUICK_START_CONFIG = `// The boundaries part of an ESLint config
{
  settings: {
    "boundaries/elements": [
      { type: "helper", pattern: 'helpers/*' },
    ],
  },
  rules: {
    "boundaries/dependencies": [2, { default: "disallow" }],
  },
}
`;

/**
 * Reads a text that is not one JSON5 object.
 * @param text The config text.
 * @returns Its only problem.
 */
function getParseProblem(text: string): ConfigProblem {
  const parsed = parseConfig(text);
  if (parsed.parsed) {
    throw new Error("The text should not be one JSON5 object");
  }
  return parsed.problems[0];
}

describe("ParseConfig", () => {
  describe("parseConfig", () => {
    it("should read the object that a JSON5 text writes, with comments, unquoted keys, single quotes and trailing commas", () => {
      // Arrange
      const text = QUICK_START_CONFIG;

      // Act
      const parsed = parseConfig(text);

      // Assert
      expect(parsed).toEqual({
        parsed: true,
        ast: expect.objectContaining({ type: "Document" }),
        value: {
          settings: {
            "boundaries/elements": [{ type: "helper", pattern: "helpers/*" }],
          },
          rules: {
            "boundaries/dependencies": [2, { default: "disallow" }],
          },
        },
        problems: [],
      });
    });

    it("should ask momoa for JSON5", () => {
      // Arrange
      const text = "{}";

      // Act
      parseConfig(text);

      // Assert
      expect(parse).toHaveBeenCalledWith(text, { mode: "json5" });
    });

    it("should read an object without settings and rules", () => {
      // Arrange
      const text = "{}";

      // Act
      const parsed = parseConfig(text);

      // Assert
      expect(parsed).toEqual(
        expect.objectContaining({ parsed: true, value: {}, problems: [] })
      );
    });

    describe("when the text has a syntax error", () => {
      it("should report what the config accepts and the message and position of the parser, at the character where it stopped", () => {
        // Arrange
        const text = "{\n  settings: {\n    a: 1\n    b: 2\n  }\n}";

        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem).toEqual({
          level: "error",
          title: ACCEPTS,
          detail: "Unexpected token Identifier found. (4:5)",
          links: [],
          path: [],
          range: { from: 29, to: 30, line: 4, column: 5 },
          source: "parse",
        });
        expect(text.slice(problem.range.from, problem.range.to)).toBe("b");
      });

      it("should report a whole eslint.config.js pasted", () => {
        // Arrange
        const text = [
          'import boundaries from "eslint-plugin-boundaries";',
          "",
          "export default [{ plugins: { boundaries } }];",
        ].join("\n");

        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem).toEqual(
          expect.objectContaining({
            title: ACCEPTS,
            detail: "Unexpected token Identifier found. (1:1)",
            range: { from: 0, to: 1, line: 1, column: 1 },
            source: "parse",
          })
        );
      });

      it("should report a spread", () => {
        // Arrange
        const text =
          "{ ...boundaries.configs.recommended.rules, settings: {} }";

        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem).toEqual(
          expect.objectContaining({
            title: ACCEPTS,
            detail: "Unexpected token Number found. (1:5)",
            range: { from: 4, to: 5, line: 1, column: 5 },
          })
        );
      });

      it("should report an empty text at its start, which has no character", () => {
        // Arrange
        const text = "";

        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem).toEqual(
          expect.objectContaining({
            detail: "Unexpected end of input found. (1:1)",
            range: { from: 0, to: 0, line: 1, column: 1 },
          })
        );
      });

      it("should report a text that ends too soon at the position that momoa gives", () => {
        // Arrange
        const text = "{\n  settings:";

        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem).toEqual(
          expect.objectContaining({
            detail: "Unexpected end of input found. (1:1)",
            range: { from: 0, to: 1, line: 1, column: 1 },
          })
        );
      });

      it("should report an error without a position at the whole text", () => {
        // Arrange
        const text = "{\n  settings: {},\n}";
        jest.mocked(parse).mockImplementationOnce(() => {
          throw new Error("The parser broke");
        });

        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem).toEqual({
          level: "error",
          title: ACCEPTS,
          detail: "The parser broke",
          links: [],
          path: [],
          range: { from: 0, to: text.length, line: 1, column: 1 },
          source: "parse",
        });
      });

      it("should report something thrown that is not an error at the whole text", () => {
        // Arrange
        const text = "{}";
        jest.mocked(parse).mockImplementationOnce(() => {
          throw "The parser broke";
        });

        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem).toEqual(
          expect.objectContaining({
            detail: "The parser broke",
            range: { from: 0, to: 2, line: 1, column: 1 },
          })
        );
      });
    });

    describe("when momoa cannot evaluate the object it read", () => {
      it("should report what the config accepts and the message of momoa at the whole text, as it does when the text nests deeper than the stack goes", () => {
        // Arrange
        const text = "{ settings: {} }";
        jest.mocked(evaluate).mockImplementationOnce(() => {
          throw new RangeError("Maximum call stack size exceeded");
        });

        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem).toEqual({
          level: "error",
          title: ACCEPTS,
          detail: "Maximum call stack size exceeded",
          links: [],
          path: [],
          range: { from: 0, to: text.length, line: 1, column: 1 },
          source: "parse",
        });
      });
    });

    describe("when the text is a value that is not an object", () => {
      it("should report a top-level array at the whole array", () => {
        // Arrange
        const text = '\n[{ type: "helper" }]\n';

        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem).toEqual({
          level: "error",
          title: ACCEPTS,
          detail: "The text is an array.",
          links: [],
          path: [],
          range: { from: 1, to: 21, line: 2, column: 1 },
          source: "parse",
        });
      });

      it.each([
        ['"settings"', "a string"],
        ["3", "a number"],
        ["Infinity", "a number"],
        ["NaN", "a number"],
        ["true", "a boolean"],
        ["null", "null"],
      ])("should name %s as %s", (text, valueName) => {
        // Arrange
        // Act
        const problem = getParseProblem(text);

        // Assert
        expect(problem.detail).toBe(`The text is ${valueName}.`);
        expect(problem.range).toEqual({
          from: 0,
          to: text.length,
          line: 1,
          column: 1,
        });
      });
    });

    describe("when the object has keys other than settings and rules", () => {
      it("should warn about each of them, at its value", () => {
        // Arrange
        const text = [
          "{",
          "  files: ['**/*.js'],",
          "  settings: {},",
          "  plugins: { boundaries: true },",
          "}",
        ].join("\n");

        // Act
        const parsed = parseConfig(text);

        // Assert
        expect(parsed).toEqual(
          expect.objectContaining({
            parsed: true,
            problems: [
              {
                level: "warning",
                title:
                  'The key "files" is not part of the config and is ignored.',
                detail:
                  'The config takes only the keys "settings" and "rules".',
                links: [],
                path: ["files"],
                range: {
                  from: text.indexOf("["),
                  to: text.indexOf("]") + 1,
                  line: 2,
                  column: 10,
                },
                source: "config",
              },
              {
                level: "warning",
                title:
                  'The key "plugins" is not part of the config and is ignored.',
                detail:
                  'The config takes only the keys "settings" and "rules".',
                links: [],
                path: ["plugins"],
                range: {
                  from: text.indexOf("{ boundaries"),
                  to: text.indexOf("}", text.indexOf("{ boundaries")) + 1,
                  line: 4,
                  column: 12,
                },
                source: "config",
              },
            ],
          })
        );
      });
    });
  });
});
