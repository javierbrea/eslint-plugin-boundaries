import { moveTextLine } from "./textLines";

/**
 * Writes a text from its lines.
 * @param items The lines, in order. An empty one is a blank line, and a last empty one is the line break that ends a text.
 * @returns The text.
 */
function write(...items: string[]): string {
  return items.join("\n");
}

describe("TextLines", () => {
  describe("moveTextLine", () => {
    describe("when the text did not change", () => {
      it("should keep every line where it is, the first and the last included", () => {
        // Arrange
        const text = write("a", "b", "c", "");

        // Act
        const lines = [1, 2, 3, 4].map((line) =>
          moveTextLine(text, text, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, 3, 4]);
      });

      it("should keep the line of a text that is a single empty line", () => {
        // Act
        const line = moveTextLine("", "", 1);

        // Assert
        expect(line).toBe(1);
      });
    });

    describe("when the user types", () => {
      it("should keep the line that is edited in place", () => {
        // Arrange
        const before = write("a", "bb", "c");
        const after = write("a", "bbx", "c");

        // Act
        const line = moveTextLine(before, after, 2);

        // Assert
        expect(line).toBe(2);
      });

      it("should keep the line that is edited in place when the whole line is replaced", () => {
        // Arrange
        const before = write("a", "bb", "c");
        const after = write("a", "xyz", "c");

        // Act
        const line = moveTextLine(before, after, 2);

        // Assert
        expect(line).toBe(2);
      });

      it("should keep the lines when another line is edited in place", () => {
        // Arrange
        const before = write("a", "b", "c");
        const after = write("a", "bx", "c");

        // Act
        const lines = [1, 3].map((line) => moveTextLine(before, after, line));

        // Assert
        expect(lines).toEqual([1, 3]);
      });

      it("should keep the first line and the last line when they are edited", () => {
        // Arrange
        const before = write("a", "b", "c", "");
        const edited = write("ax", "b", "c", "");
        const appended = write("a", "b", "c", "x");

        // Act
        const first = moveTextLine(before, edited, 1);
        const last = moveTextLine(before, appended, 4);

        // Assert
        expect(first).toBe(1);
        expect(last).toBe(4);
      });

      it("should keep the line when Enter is pressed at its end, and move the lines below it", () => {
        // Arrange
        const before = write("a", "b", "c");
        const after = write("a", "b", "", "c");

        // Act
        const lines = [1, 2, 3].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, 4]);
      });

      it("should move the line down when Enter is pressed at its start", () => {
        // Arrange
        const before = write("a", "b", "c");
        const after = write("a", "", "b", "c");

        // Act
        const lines = [1, 2, 3].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 3, 4]);
      });

      it("should keep the first part of a line that is split in the middle", () => {
        // Arrange
        const before = write("a", "bc", "d");
        const after = write("a", "b", "c", "d");

        // Act
        const lines = [1, 2, 3].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, 4]);
      });
    });

    describe("when lines are added or deleted", () => {
      it("should move the lines below the ones that were inserted above", () => {
        // Arrange
        const before = write("a", "b", "c");
        const after = write("x", "y", "a", "b", "c");

        // Act
        const lines = [1, 2, 3].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([3, 4, 5]);
      });

      it("should keep the lines above the ones that were inserted below", () => {
        // Arrange
        const before = write("a", "b", "c");
        const after = write("a", "b", "c", "x", "y");

        // Act
        const lines = [1, 2, 3].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, 3]);
      });

      it("should move the lines below the ones that were inserted in the middle, and keep the ones above", () => {
        // Arrange
        const before = write("a", "b", "c", "d");
        const after = write("a", "b", "x", "y", "c", "d");

        // Act
        const lines = [1, 2, 3, 4].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, 5, 6]);
      });

      it("should move the lines below the ones that were deleted above, and keep the ones above", () => {
        // Arrange
        const before = write("a", "b", "c", "d");
        const after = write("a", "c", "d");

        // Act
        const lines = [1, 3, 4].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, 3]);
      });

      it("should keep the lines above the ones that were deleted below", () => {
        // Arrange
        const before = write("a", "b", "c", "d");
        const after = write("a", "b");

        // Act
        const lines = [1, 2].map((line) => moveTextLine(before, after, line));

        // Assert
        expect(lines).toEqual([1, 2]);
      });

      it("should lose the line that was deleted", () => {
        // Arrange
        const before = write("a", "b", "c");
        const after = write("a", "c");

        // Act
        const line = moveTextLine(before, after, 2);

        // Assert
        expect(line).toBeUndefined();
      });

      it("should lose the line that was deleted with the lines around it", () => {
        // Arrange
        const before = write("a", "b", "c", "d", "e");
        const after = write("a", "e");

        // Act
        const lines = [2, 3, 4].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([undefined, undefined, undefined]);
      });

      it("should lose the line that was joined into the line before it, and keep the one it was joined into", () => {
        // Arrange
        const before = write("a", "b", "c");
        const after = write("ab", "c");

        // Act
        const lines = [1, 2, 3].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, undefined, 2]);
      });

      it("should move the line that was joined to an empty line before it", () => {
        // Arrange
        const before = write("a", "", "b", "c");
        const after = write("a", "b", "c");

        // Act
        const lines = [1, 2, 3, 4].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, undefined, 2, 3]);
      });
    });

    describe("when a block of lines is replaced", () => {
      it("should keep the place of a line inside a block that is replaced by a longer one", () => {
        // Arrange
        const before = write("a", "b", "c", "d");
        const after = write("a", "x", "y", "z", "d");

        // Act
        const lines = [1, 2, 3, 4].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, 3, 5]);
      });

      it("should lose the lines that the shorter block that replaces them does not reach", () => {
        // Arrange
        const before = write("a", "b", "c", "d", "e");
        const after = write("a", "x", "e");

        // Act
        const lines = [1, 2, 3, 4, 5].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, undefined, undefined, 3]);
      });

      it("should keep the place of every line when the whole text is replaced by one of the same length", () => {
        // Arrange
        const before = write("a", "b", "c");
        const after = write("x", "y", "z");

        // Act
        const lines = [1, 2, 3].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, 3]);
      });
    });

    describe("when two equal lines are next to each other", () => {
      it("should keep the earlier one and lose the later one when one is deleted", () => {
        // Arrange
        const before = write("a", "b", "b", "c");
        const after = write("a", "b", "c");

        // Act
        const lines = [1, 2, 3, 4].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, undefined, 3]);
      });

      it("should keep both when a third equal line is added", () => {
        // Arrange
        const before = write("a", "b", "b", "c");
        const after = write("a", "b", "b", "b", "c");

        // Act
        const lines = [1, 2, 3, 4].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([1, 2, 3, 5]);
      });
    });

    describe("when the line is not in the text before", () => {
      it("should lose a line before the first and a line after the last", () => {
        // Arrange
        const before = write("a", "b");

        // Act
        const lines = [0, -1, 3].map((line) =>
          moveTextLine(before, before, line)
        );

        // Assert
        expect(lines).toEqual([undefined, undefined, undefined]);
      });
    });

    describe("with Windows line breaks", () => {
      it("should number the lines as they are written", () => {
        // Arrange
        const before = "a\r\nb\r\nc";
        const after = "x\r\na\r\nb\r\nc";

        // Act
        const lines = [1, 2, 3].map((line) =>
          moveTextLine(before, after, line)
        );

        // Assert
        expect(lines).toEqual([2, 3, 4]);
      });
    });
  });
});
