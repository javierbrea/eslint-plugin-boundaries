import { render } from "@testing-library/react";

import type { StatementToken } from "@/domains/project/helpers/sketch";

import { Statement } from "./Statement";
import { StatementPom } from "./Statement.pom";

/** The statement of the mockup: `import format, { round } from "../../helpers/format";`. */
const MOCKUP_TOKENS: readonly StatementToken[] = [
  { kind: "keyword", text: "import" },
  { kind: "text", text: " format, { round } " },
  { kind: "keyword", text: "from" },
  { kind: "text", text: " " },
  { kind: "source", text: '"../../helpers/format"' },
  { kind: "text", text: ";" },
];

/**
 * Renders a statement inside an element that sets the color of a code area, which the plain text of the statement must inherit.
 * @param tokens The pieces of the statement.
 * @returns The page object of the statement.
 */
function renderStatement(tokens: readonly StatementToken[]): StatementPom {
  render(
    <p style={{ color: "var(--jsb-code-fg)" }}>
      <Statement tokens={tokens} />
    </p>
  );

  return new StatementPom();
}

describe("Statement", () => {
  describe("text", () => {
    it("should draw the pieces joined, as the statement reads", () => {
      // Arrange
      const statement = renderStatement(MOCKUP_TOKENS);

      // Act
      const { text } = statement;

      // Assert
      expect(text).toBe(
        'import format, { round } from "../../helpers/format";'
      );
    });

    it("should draw nothing for a statement with no pieces", () => {
      // Arrange
      const statement = renderStatement([]);

      // Act
      const { text, parts } = statement;

      // Assert
      expect(text).toBe("");
      expect(parts).toEqual([]);
    });
  });

  describe("colors", () => {
    it("should draw the keywords in the keyword color and the source in the string color, and leave the rest in the color around it", () => {
      // Arrange
      const statement = renderStatement(MOCKUP_TOKENS);

      // Act
      const { parts } = statement;

      // Assert
      expect(parts).toEqual([
        { text: "import", color: "var(--jsb-code-keyword)" },
        { text: " format, { round } ", color: "var(--jsb-code-fg)" },
        { text: "from", color: "var(--jsb-code-keyword)" },
        { text: " ", color: "var(--jsb-code-fg)" },
        { text: '"../../helpers/format"', color: "var(--jsb-code-string)" },
        { text: ";", color: "var(--jsb-code-fg)" },
      ]);
    });
  });

  describe("box", () => {
    it("should take the font of its surroundings, with no box of its own that a host would give a code element", () => {
      // Arrange
      const statement = renderStatement(MOCKUP_TOKENS);

      // Act
      const { fontFamily, fontSize, lineHeight, backgroundColor } = statement;

      // Assert
      expect(fontFamily).toBe("inherit");
      expect(fontSize).toBe("inherit");
      expect(lineHeight).toBe("inherit");
      expect(backgroundColor).toBe("rgba(0, 0, 0, 0)");
    });

    it("should sit on the baseline of its line, where a host that aligns its code elements to the middle would make the line taller", () => {
      // Arrange
      const statement = renderStatement(MOCKUP_TOKENS);

      // Act
      const { verticalAlign } = statement;

      // Assert
      expect(verticalAlign).toBe("baseline");
    });
  });
});
