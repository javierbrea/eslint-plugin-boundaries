import { parse } from "@humanwhocodes/momoa";
import type { DocumentNode } from "@humanwhocodes/momoa";

import { getRangeOf, toTextRange } from "./locations";

const TEXT = [
  "{",
  "  settings: {",
  '    "boundaries/elements": [',
  '      { type: "helper" },',
  "      { 'type': \"component\" },",
  "    ],",
  "  },",
  "  rules: {},",
  "}",
].join("\n");

const parseText = (text: string): DocumentNode =>
  parse(text, { mode: "json5" });

describe("Locations", () => {
  describe("toTextRange", () => {
    it("should read the offsets of the node and the line and column of its start", () => {
      // Arrange
      const tree = parseText(TEXT);

      // Act
      const range = toTextRange(tree.body);

      // Assert
      expect(range).toEqual({ from: 0, to: TEXT.length, line: 1, column: 1 });
    });
  });

  describe("getRangeOf", () => {
    it("should return the whole root value for an empty path", () => {
      // Arrange
      const comment = "// a comment\n";
      const tree = parseText(`${comment}${TEXT}\n`);

      // Act
      const range = getRangeOf(tree, []);

      // Assert
      expect(range).toEqual({
        from: comment.length,
        to: comment.length + TEXT.length,
        line: 2,
        column: 1,
      });
    });

    it("should find a member whose key is an identifier", () => {
      // Arrange
      const tree = parseText(TEXT);

      // Act
      const range = getRangeOf(tree, ["rules"]);

      // Assert
      expect(range).toEqual({
        from: TEXT.indexOf("{}"),
        to: TEXT.indexOf("{}") + 2,
        line: 8,
        column: 10,
      });
    });

    it("should find a member whose key is a string", () => {
      // Arrange
      const tree = parseText(TEXT);

      // Act
      const range = getRangeOf(tree, ["settings", "boundaries/elements"]);

      // Assert
      expect(range).toEqual({
        from: TEXT.indexOf("["),
        to: TEXT.indexOf("]") + 1,
        line: 3,
        column: 28,
      });
    });

    it("should find an element of an array by its index", () => {
      // Arrange
      const tree = parseText(TEXT);
      const element = "{ 'type': \"component\" }";

      // Act
      const range = getRangeOf(tree, ["settings", "boundaries/elements", 1]);

      // Assert
      expect(range).toEqual({
        from: TEXT.indexOf(element),
        to: TEXT.indexOf(element) + element.length,
        line: 5,
        column: 7,
      });
    });

    it("should find a value inside an element of an array", () => {
      // Arrange
      const tree = parseText(TEXT);

      // Act
      const range = getRangeOf(tree, [
        "settings",
        "boundaries/elements",
        0,
        "type",
      ]);

      // Assert
      expect(range).toEqual({
        from: TEXT.indexOf('"helper"'),
        to: TEXT.indexOf('"helper"') + '"helper"'.length,
        line: 4,
        column: 15,
      });
    });

    it("should find the last value of a key that is written twice, as the evaluated object has it", () => {
      // Arrange
      const text = "{ a: 1, a: [2] }";
      const tree = parseText(text);

      // Act
      const range = getRangeOf(tree, ["a"]);

      // Assert
      expect(range).toEqual({ from: 11, to: 14, line: 1, column: 12 });
    });

    it("should return the deepest value reached when a key is not written", () => {
      // Arrange
      const tree = parseText(TEXT);

      // Act
      const range = getRangeOf(tree, ["settings", "boundaries/files", 0]);

      // Assert
      expect(range).toEqual({
        from: TEXT.indexOf("{", TEXT.indexOf("settings")),
        to: TEXT.indexOf("}", TEXT.indexOf("]")) + 1,
        line: 2,
        column: 13,
      });
    });

    it("should return the array when its index is out of range", () => {
      // Arrange
      const tree = parseText(TEXT);

      // Act
      const range = getRangeOf(tree, ["settings", "boundaries/elements", 7]);

      // Assert
      expect(range).toEqual(
        getRangeOf(tree, ["settings", "boundaries/elements"])
      );
    });

    it("should return the array when the key that follows it is not an index", () => {
      // Arrange
      const tree = parseText(TEXT);

      // Act
      const range = getRangeOf(tree, ["settings", "boundaries/elements", "0"]);

      // Assert
      expect(range).toEqual(
        getRangeOf(tree, ["settings", "boundaries/elements"])
      );
    });

    it("should return the value reached when the path goes on through a value that has no children", () => {
      // Arrange
      const tree = parseText(TEXT);

      // Act
      const range = getRangeOf(tree, [
        "settings",
        "boundaries/elements",
        0,
        "type",
        "length",
      ]);

      // Assert
      expect(range).toEqual(
        getRangeOf(tree, ["settings", "boundaries/elements", 0, "type"])
      );
    });
  });
});
