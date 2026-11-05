// cspell:ignore patern -- a deliberate typo, the mistake of the config that the tests report
import type { EditorView } from "@codemirror/view";

import type {
  ConfigProblem,
  TextRange,
} from "@/domains/evaluation/helpers/engine";

import { fitToDocument, toDiagnostics } from "./editorDiagnostics";

const RANGE: TextRange = { from: 10, to: 24, line: 2, column: 5 };

const LINK = "https://www.jsboundaries.dev/docs/settings/";

const OTHER_LINK = "https://www.jsboundaries.dev/docs/rules/dependencies/";

/**
 * Creates a problem of the config.
 * @param overrides What differs from a warning at `RANGE` with only a title.
 * @returns The problem.
 */
function createProblem(overrides: Partial<ConfigProblem> = {}): ConfigProblem {
  return {
    level: "warning",
    title: "Some element descriptors are invalid and will be ignored.",
    links: [],
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

    it("should put the links under the detail in the message, one on each line", () => {
      // Arrange
      const problems = [
        createProblem({
          title: "Invalid.",
          detail: "Fix it.",
          links: [LINK, OTHER_LINK],
        }),
      ];

      // Act
      const [diagnostic] = toDiagnostics(problems, 100);

      // Assert
      expect(diagnostic.message).toBe(
        `Invalid.\nFix it.\n${LINK}\n${OTHER_LINK}`
      );
    });

    it("should put the links under the title in the message of a problem without detail", () => {
      // Arrange
      const problems = [createProblem({ title: "Invalid.", links: [LINK] })];

      // Act
      const [diagnostic] = toDiagnostics(problems, 100);

      // Assert
      expect(diagnostic.message).toBe(`Invalid.\n${LINK}`);
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

    it("should draw the links after the detail, each as a More info link", () => {
      // Arrange
      const problem = createProblem({
        title: "Invalid.",
        detail: 'Value "x" should be one of the allowed values.',
        links: [LINK],
      });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.querySelector("div")?.innerHTML).toBe(
        `Value "x" should be one of the allowed values. <a href="${LINK}" target="_blank" rel="noreferrer">More info</a>`
      );
    });

    it("should keep the lines of the detail", () => {
      // Arrange
      const problem = createProblem({
        detail: "First line.\nSecond line.",
        links: [LINK],
      });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.querySelector("div")?.textContent).toBe(
        "First line.\nSecond line. More info"
      );
    });

    it("should open the link in a new tab without giving the page to the site it opens", () => {
      // Arrange
      const problem = createProblem({ links: [LINK] });

      // Act
      const message = renderMessage(problem);

      // Assert
      const link = message.querySelector("a") as HTMLAnchorElement;

      expect([link.href, link.target, link.rel]).toEqual([
        LINK,
        "_blank",
        "noreferrer",
      ]);
    });

    it("should separate each link from what comes before it with a space", () => {
      // Arrange
      const problem = createProblem({
        detail: "Fix it.",
        links: [LINK, OTHER_LINK],
      });

      // Act
      const message = renderMessage(problem);

      // Assert
      const links = [...message.querySelectorAll("a")];

      expect(message.querySelector("div")?.textContent).toBe(
        "Fix it. More info More info"
      );
      expect(links.map(({ href }) => href)).toEqual([LINK, OTHER_LINK]);
    });

    it("should draw a link alone, without a space before it, when there is no detail", () => {
      // Arrange
      const problem = createProblem({ title: "Invalid.", links: [LINK] });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.innerHTML).toBe(
        `<strong>Invalid.</strong><div><a href="${LINK}" target="_blank" rel="noreferrer">More info</a></div>`
      );
    });

    it("should draw only the space between two links when there is no detail", () => {
      // Arrange
      const problem = createProblem({ links: [LINK, OTHER_LINK] });

      // Act
      const message = renderMessage(problem);

      // Assert
      expect(message.querySelector("div")?.childNodes).toHaveLength(3);
      expect(message.querySelector("div")?.textContent).toBe(
        "More info More info"
      );
    });
  });
});
