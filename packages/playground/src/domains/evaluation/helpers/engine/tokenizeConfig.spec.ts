import type { ConfigToken } from "./engine.types";
import { tokenizeConfig } from "./tokenizeConfig";

/** Policy 2 of the quick start, as the config writes it and as the policy card of the dependency tab shows it: a comment, a key without quotes and a string */
const POLICY_TWO = `{
  // No element may import a test file, whatever element it belongs to
  disallow: { to: { file: { categories: "test" } } },
}`;

/**
 * Lists the pieces of a text as `kind text`, to compare what the user would see colored.
 * @param text The text to split.
 * @returns One entry per piece, in order, without the white space between them.
 */
function listPieces(text: string): string[] {
  return tokenizeConfig(text)
    .filter(({ text: piece }) => piece.trim() !== "")
    .map(({ kind, text: piece }) => `${kind} ${piece}`);
}

/**
 * Joins the pieces of a text.
 * @param pieces The pieces.
 * @returns The text that they make.
 */
function join(pieces: readonly ConfigToken[]): string {
  return pieces.map(({ text }) => text).join("");
}

describe("TokenizeConfig", () => {
  describe("tokenizeConfig", () => {
    it("should tell the comment, the keys without quotes and the string of policy 2 of the quick start", () => {
      // Act
      const pieces = listPieces(POLICY_TWO);

      // Assert
      expect(pieces).toEqual([
        "punctuation {",
        "comment // No element may import a test file, whatever element it belongs to",
        "key disallow",
        "punctuation :",
        "punctuation {",
        "key to",
        "punctuation :",
        "punctuation {",
        "key file",
        "punctuation :",
        "punctuation {",
        "key categories",
        "punctuation :",
        'string "test"',
        "punctuation }",
        "punctuation }",
        "punctuation }",
        "punctuation ,",
        "punctuation }",
      ]);
    });

    it("should keep the white space between the pieces as plain text, so that the pieces joined are the text", () => {
      // Act
      const pieces = tokenizeConfig(POLICY_TWO);

      // Assert
      expect(join(pieces)).toBe(POLICY_TWO);
      expect(pieces[1]).toEqual({ kind: "plain", text: "\n  " });
    });

    it("should keep the white space before the first piece and after the last one", () => {
      // Act
      const pieces = tokenizeConfig("  { }\n");

      // Assert
      expect(pieces[0]).toEqual({ kind: "plain", text: "  " });
      expect(pieces.at(-1)).toEqual({ kind: "plain", text: "\n" });
      expect(join(pieces)).toBe("  { }\n");
    });

    it("should tell numbers, with their sign, their exponent and Infinity and NaN, from the strings", () => {
      // Act
      const pieces = listPieces(
        '[ 2, -1.5e3, +7, 0x1F, .5, Infinity, -Infinity, NaN, "2" ]'
      );

      // Assert
      expect(pieces).toEqual([
        "punctuation [",
        "number 2",
        "punctuation ,",
        "number -1.5e3",
        "punctuation ,",
        "number +7",
        "punctuation ,",
        "number 0x1F",
        "punctuation ,",
        "number .5",
        "punctuation ,",
        "number Infinity",
        "punctuation ,",
        "number -Infinity",
        "punctuation ,",
        "number NaN",
        "punctuation ,",
        'string "2"',
        "punctuation ]",
      ]);
    });

    it("should tell true, false and null as literals", () => {
      // Act
      const pieces = listPieces("{ a: true, b: false, c: null }");

      // Assert
      expect(pieces).toEqual([
        "punctuation {",
        "key a",
        "punctuation :",
        "literal true",
        "punctuation ,",
        "key b",
        "punctuation :",
        "literal false",
        "punctuation ,",
        "key c",
        "punctuation :",
        "literal null",
        "punctuation }",
      ]);
    });

    it("should tell a key written with quotes from a string value, with either kind of quote", () => {
      // Act
      const pieces = listPieces(
        '{ "to": \'file\', \'from\': "element", "list": [ "a" ] }'
      );

      // Assert
      expect(pieces).toEqual([
        "punctuation {",
        'key "to"',
        "punctuation :",
        "string 'file'",
        "punctuation ,",
        "key 'from'",
        "punctuation :",
        'string "element"',
        "punctuation ,",
        'key "list"',
        "punctuation :",
        "punctuation [",
        'string "a"',
        "punctuation ]",
        "punctuation }",
      ]);
    });

    it("should tell a string that holds a colon from a key", () => {
      // Act
      const pieces = listPieces('{ message: "a: b" }');

      // Assert
      expect(pieces).toEqual([
        "punctuation {",
        "key message",
        "punctuation :",
        'string "a: b"',
        "punctuation }",
      ]);
    });

    it("should tell line comments and block comments, which end where they end", () => {
      // Act
      const pieces = tokenizeConfig("// first\n{ /* second */ a: 1 } // third");

      // Assert
      expect(
        pieces.filter(({ kind }) => kind === "comment").map(({ text }) => text)
      ).toEqual(["// first", "/* second */", "// third"]);
      expect(join(pieces)).toBe("// first\n{ /* second */ a: 1 } // third");
    });

    it("should read a key that a comment separates from its colon as a key", () => {
      // Act
      const pieces = listPieces('{ a /* why */ : 1, "b" // note\n : 2 }');

      // Assert
      expect(pieces).toEqual([
        "punctuation {",
        "key a",
        "comment /* why */",
        "punctuation :",
        "number 1",
        "punctuation ,",
        'key "b"',
        "comment // note",
        "punctuation :",
        "number 2",
        "punctuation }",
      ]);
    });

    it("should leave an identifier that is not a key as plain text", () => {
      // Act
      const pieces = listPieces("{ a: undefined }");

      // Assert
      expect(pieces).toEqual([
        "punctuation {",
        "key a",
        "punctuation :",
        "plain undefined",
        "punctuation }",
      ]);
    });

    it("should not take a string for a key when no key comes before the colon", () => {
      // Act
      const pieces = listPieces(": 1");

      // Assert
      expect(pieces).toEqual(["punctuation :", "number 1"]);
    });

    it("should read a text that is not a whole config, such as the default of the options", () => {
      // Act
      const pieces = listPieces('"disallow"');

      // Assert
      expect(pieces).toEqual(['string "disallow"']);
    });

    it("should place the pieces after a character of two code units where they are written", () => {
      // Arrange
      const text = '{ "😀": "😀 x", n: 1 }';

      // Act
      const pieces = tokenizeConfig(text);

      // Assert
      expect(listPieces(text)).toEqual([
        "punctuation {",
        'key "😀"',
        "punctuation :",
        'string "😀 x"',
        "punctuation ,",
        "key n",
        "punctuation :",
        "number 1",
        "punctuation }",
      ]);
      expect(join(pieces)).toBe(text);
    });

    it("should give no piece for an empty text", () => {
      // Act
      const pieces = tokenizeConfig("");

      // Assert
      expect(pieces).toEqual([]);
    });

    it("should give one plain piece for a text of white space only", () => {
      // Act
      const pieces = tokenizeConfig(" \n ");

      // Assert
      expect(pieces).toEqual([{ kind: "plain", text: " \n " }]);
    });

    it.each([
      ["a character that JSON5 does not have", "{ a: 1 } @"],
      ["a string that never ends", '{ a: "open'],
      ["a block comment that never ends", "{ a: 1 } /* open"],
      [
        "a variable between backticks, as a script would write it",
        "{ a: `b` }",
      ],
    ])(
      "should give the text as one plain piece, and not throw, for %s",
      (_name, text) => {
        // Act
        const pieces = tokenizeConfig(text);

        // Assert
        expect(pieces).toEqual([{ kind: "plain", text }]);
      }
    );
  });
});
