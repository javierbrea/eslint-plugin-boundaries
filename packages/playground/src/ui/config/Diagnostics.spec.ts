// cspell:ignore patern -- a deliberate typo, the mistake of the config that the tests report
import type { EditorView } from "@codemirror/view";

import type { ConfigProblem, TextRange } from "../../engine";

import { fitToDocument, toDiagnostics } from "./Diagnostics";

const RANGE: TextRange = { from: 10, to: 24, line: 2, column: 5 };

const LINK = "https://www.jsboundaries.dev/docs/settings/";

/**
 * Creates a problem of the config.
 * @param overrides What differs from a warning at `RANGE` with only a title.
 * @returns The problem.
 */
function createProblem(overrides: Partial<ConfigProblem> = {}): ConfigProblem {
  return {
    level: "warning",
    title: "Some element descriptors are invalid and will be ignored.",
    path: ["settings", "boundaries/elements", 1],
    range: RANGE,
    source: "config",
    ...overrides,
  };
}

/**
 * Draws the message of a diagnostic, as the tooltip of the editor does.
 * @param problem The problem whose diagnostic is drawn.
 * @returns The element that the tooltip would show.
 */
function renderMessage(problem: ConfigProblem): HTMLElement {
  const [diagnostic] = toDiagnostics([problem], 1000);
  const view = { dom: document.createElement("div") } as unknown as EditorView;
  return (diagnostic.renderMessage as (view: EditorView) => HTMLElement)(view);
}

describe("Diagnostics", () => {
  describe("fitToDocument", () => {
    it("should keep a range that is inside the document", () => {
      // Arrange
      const range = { from: 3, to: 8 };

      // Act
      const fitted = fitToDocument(range, 20);

      // Assert
      expect(fitted).toEqual({ from: 3, to: 8 });
    });

    it("should cut a range at the end of the document", () => {
      // Arrange
      const range = { from: 15, to: 30 };

      // Act
      const fitted = fitToDocument(range, 20);

      // Assert
      expect(fitted).toEqual({ from: 15, to: 20 });
    });

    it("should move a range that starts after the end of the document to the end", () => {
      // Arrange
      const range = { from: 40, to: 50 };

      // Act
      const fitted = fitToDocument(range, 20);

      // Assert
      expect(fitted).toEqual({ from: 20, to: 20 });
    });
  });

  describe("toDiagnostics", () => {
    it("should place each diagnostic at the range of its problem, in order", () => {
      // Arrange
      const problems = [
        createProblem({ range: { from: 2, to: 5, line: 1, column: 3 } }),
        createProblem({ range: { from: 30, to: 42, line: 4, column: 1 } }),
      ];

      // Act
      const diagnostics = toDiagnostics(problems, 100);

      // Assert
      expect(diagnostics.map(({ from, to }) => ({ from, to }))).toEqual([
        { from: 2, to: 5 },
        { from: 30, to: 42 },
      ]);
    });

    it("should keep the diagnostics inside a document that is shorter than the text that was evaluated", () => {
      // Arrange
      const problems = [
        createProblem({ range: { ...RANGE, from: 60, to: 80 } }),
      ];

      // Act
      const [diagnostic] = toDiagnostics(problems, 50);

      // Assert
      expect({ from: diagnostic.from, to: diagnostic.to }).toEqual({
        from: 50,
        to: 50,
      });
    });

    it.each([
      ["error", "error"],
      ["warning", "warning"],
      ["deprecation", "warning"],
    ] as const)(
      "should show the %s level as a %s",
      (level, expectedSeverity) => {
        // Arrange
        const problems = [createProblem({ level })];

        // Act
        const [diagnostic] = toDiagnostics(problems, 100);

        // Assert
        expect(diagnostic.severity).toBe(expectedSeverity);
      }
    );

    it("should use the title as the message of a problem without detail", () => {
      // Arrange
      const problems = [createProblem({ title: "Unexpected token." })];

      // Act
      const [diagnostic] = toDiagnostics(problems, 100);

      // Assert
      expect(diagnostic.message).toBe("Unexpected token.");
    });

    it("should put the detail under the title in the message of a problem that has one", () => {
      // Arrange
      const problems = [
        createProblem({ title: "Invalid.", detail: "Fix it." }),
      ];

      // Act
      const [diagnostic] = toDiagnostics(problems, 100);

      // Assert
      expect(diagnostic.message).toBe("Invalid.\nFix it.");
    });
  });

  describe("renderMessage", () => {
    it("should draw the title in bold and nothing else for a problem without detail", () => {
      // Arrange
      const problem = createProblem({ title: "Unexpected token." });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.innerHTML).toBe("<strong>Unexpected token.</strong>");
    });

    it("should draw the detail below the title", () => {
      // Arrange
      const problem = createProblem({
        title: "Invalid.",
        detail: "Value should be one of the allowed values.",
      });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.innerHTML).toBe(
        "<strong>Invalid.</strong><div>Value should be one of the allowed values.</div>"
      );
    });

    it("should replace the docs link of the detail, and the label that introduces it, with a More info link", () => {
      // Arrange
      const problem = createProblem({
        title: "Invalid.",
        detail: `Value "x" should be one of the allowed values.\nMore info: ${LINK}`,
      });

      // Act
      const message = renderMessage(problem);

      // Assert
      const link = message.querySelector("a") as HTMLAnchorElement;

      expect(message.querySelector("div")?.textContent).toBe(
        'Value "x" should be one of the allowed values. More info'
      );
      expect(link.textContent).toBe("More info");
      expect(link.href).toBe(LINK);
    });

    it("should open the link in a new tab without giving the page to the site it opens", () => {
      // Arrange
      const problem = createProblem({ detail: `More info: ${LINK}` });

      // Act
      const message = renderMessage(problem);

      // Assert
      const link = message.querySelector("a") as HTMLAnchorElement;

      expect([link.target, link.rel]).toEqual(["_blank", "noreferrer"]);
    });

    it("should keep a sentence that follows a link, and the lines of the detail", () => {
      // Arrange
      const problem = createProblem({
        detail: `First line.\nSecond line. More info: ${LINK} Then more text.`,
      });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.querySelector("div")?.innerHTML).toBe(
        `First line.\nSecond line. <a href="${LINK}" target="_blank" rel="noreferrer">More info</a> Then more text.`
      );
    });

    it("should link a URL that has no label before it", () => {
      // Arrange
      const problem = createProblem({ detail: `Read ${LINK}` });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.querySelector("a")?.textContent).toBe("More info");
    });

    it("should separate two links with a space", () => {
      // Arrange
      const problem = createProblem({ detail: `${LINK} ${LINK}other` });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.querySelector("div")?.textContent).toBe(
        "More info More info"
      );
    });

    it("should not draw a text node for an empty piece around a link", () => {
      // Arrange
      const problem = createProblem({ detail: LINK });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.querySelector("div")?.childNodes).toHaveLength(1);
    });

    it("should not draw a link for text that is not an http or https URL", () => {
      // Arrange
      const problem = createProblem({
        detail: "Use javascript:alert(1) or ftp://x.dev",
      });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.querySelector("a")).toBeNull();
    });
  });
});
