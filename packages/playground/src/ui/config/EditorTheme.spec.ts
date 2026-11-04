import { syntaxHighlighting } from "@codemirror/language";
import { EditorView } from "@codemirror/view";
import { tags } from "@lezer/highlight";

import { editorTheme, highlightStyle } from "./EditorTheme";

/**
 * Mounts an editor with the theme, so that CodeMirror inserts its styles, and reads them.
 * @returns The CSS text of every style element of the document.
 */
function mountAndReadCss(): string {
  const view = new EditorView({
    doc: "{}",
    parent: document.body,
    extensions: [editorTheme, syntaxHighlighting(highlightStyle)],
  });
  view.destroy();
  return Array.from(document.querySelectorAll("style"))
    .map((style) => style.textContent)
    .join("\n");
}

/**
 * Finds the rule of the theme for a selector. The theme is inserted after the base themes of CodeMirror, so the last rule of a selector is the one that applies.
 * @param css The CSS text of the document.
 * @param selector The selector, without the class of the editor that CodeMirror puts before it.
 * @returns The declarations of the rule.
 */
function getDeclarations(css: string, selector: string): string {
  const rules = css.split("\n").filter((candidate) => {
    // CodeMirror puts the class of the theme before each selector of a list
    const selectors = candidate.slice(0, candidate.indexOf(" {")).split(", ");
    return (
      selectors.map((part) => part.replace(/^\.\S+ /, "")).join(", ") ===
      selector
    );
  });

  expect(rules.length).toBeGreaterThan(0);

  const rule = rules[rules.length - 1];
  return rule.slice(rule.indexOf(" {") + 2, rule.lastIndexOf("}"));
}

/**
 * Finds the rules of the theme of the playground: the ones in the class that its highlight rule is in.
 * @param css The CSS text of the document.
 * @returns The text of those rules.
 */
function getThemeRules(css: string): string[] {
  const themeClass = /^(\.\S+) .*cm-jsb-highlight/m.exec(css)?.[1] as string;
  return css
    .split("\n")
    .filter(
      (rule) =>
        rule.startsWith(`${themeClass} `) || rule.startsWith(`${themeClass}.`)
    );
}

describe("EditorTheme", () => {
  describe("editorTheme", () => {
    it("should draw the editor as a code area with the tokens of the host", () => {
      // Arrange
      const css = mountAndReadCss();

      // Act
      const editor = css
        .split("\n")
        .find((rule) => rule.includes("{height: 100%;"));

      // Assert
      expect(editor).toContain("background-color: var(--jsb-code)");
      expect(editor).toContain("color: var(--jsb-code-fg)");
    });

    it("should set the code in the mono text of the type scale, 12.5 px on a line of 22 px", () => {
      // Arrange
      const css = mountAndReadCss();

      // Act
      const editor = css
        .split("\n")
        .find((rule) => rule.includes("{height: 100%;"));
      const scroller = getDeclarations(css, ".cm-scroller");

      // Assert
      expect(editor).toContain("font-size: 12.5px");
      expect(scroller).toContain("font-family: var(--jsb-font-mono)");
      expect(scroller).toContain("line-height: 22px");
    });

    it("should set the line numbers a notch smaller than the code", () => {
      // Arrange
      const css = mountAndReadCss();

      // Act
      const numbers = getDeclarations(css, ".cm-lineNumbers .cm-gutterElement");

      // Assert
      expect(numbers).toContain("font-size: 11.5px");
    });

    it("should set the tooltip of a problem in the small body text, with the title of the problem in bold", () => {
      // Arrange
      const css = mountAndReadCss();

      // Act
      const card = getDeclarations(css, ".cm-tooltip");
      const title = getDeclarations(css, ".cm-diagnosticText strong");

      // Assert
      expect(card).toContain("font-family: var(--jsb-font-body)");
      expect(card).toContain("font-size: 12.5px");
      expect(card).toContain("font-weight: 400");
      expect(card).toContain("line-height: 1.45");
      expect(title).toContain("font-weight: 600");
    });

    it("should use only the tokens of the host as colors", () => {
      // Arrange
      const css = mountAndReadCss();

      // Act
      const rules = getThemeRules(css);

      // Assert
      expect(rules.length).toBeGreaterThan(20);
      expect(
        rules.filter((rule) => /#[0-9a-f]{3,8}\b|rgba?\(|hsla?\(/i.test(rule))
      ).toEqual([]);
    });

    it.each([
      ["error", "--jsb-code-error", "M4%204l8%208M12%204l-8%208"],
      ["warning", "--jsb-code-number", "M8%202.5l6%2011H2z"],
    ])(
      "should draw the %s marker of the gutter as the icon of the mockup in the color of the %s token",
      (severity, token, encodedPath) => {
        // Arrange
        const css = mountAndReadCss();

        // Act
        const declarations = getDeclarations(
          css,
          `.cm-lint-marker-${severity}`
        );

        // Assert
        expect(declarations).toContain(`background-color: var(${token})`);
        expect(declarations).toContain('mask-image: url("data:image/svg+xml,');
        expect(declarations).toContain(encodedPath);
      }
    );

    it("should replace the image of the markers of the gutter by their mask", () => {
      // Arrange
      const css = mountAndReadCss();

      // Act
      const declarations = getDeclarations(
        css,
        ".cm-lint-marker-error, .cm-lint-marker-warning"
      );

      // Assert
      expect(declarations).toContain("content: normal");
      expect(declarations).toContain("width: 12px");
      expect(declarations).toContain("height: 12px");
    });

    it.each([
      ["error", "--jsb-code-error"],
      ["warning", "--jsb-code-number"],
    ])(
      "should underline the %s problems with a wavy line in the color of the %s token",
      (severity, token) => {
        // Arrange
        const css = mountAndReadCss();

        // Act
        const declarations = getDeclarations(css, `.cm-lintRange-${severity}`);

        // Assert
        expect(declarations).toContain("text-decoration-style: wavy");
        expect(declarations).toContain(`text-decoration-color: var(${token})`);
        expect(declarations).toContain("background-image: none");
      }
    );

    it.each([
      ["error", "--jsb-bad"],
      ["warning", "--jsb-warn"],
    ])(
      "should draw the tooltip of a %s as a card with a 3 px bar in the color of the %s token",
      (severity, token) => {
        // Arrange
        const css = mountAndReadCss();

        // Act
        const card = getDeclarations(css, ".cm-tooltip");
        const bar = getDeclarations(css, `.cm-diagnostic-${severity}`);

        // Assert
        expect(card).toContain("background-color: var(--jsb-card)");
        expect(card).toContain("color: var(--jsb-ink)");
        expect(card).toContain("border: 1px solid var(--jsb-line-strong)");
        expect(bar).toContain(`border-left: 3px solid var(${token})`);
      }
    );

    it("should mark the highlighted lines with 13% of the keyword color, and a 3 px bar on the first gutter", () => {
      // Arrange
      const css = mountAndReadCss();

      // Act
      const lines = getDeclarations(
        css,
        ".cm-line.cm-jsb-highlight, .cm-gutterElement.cm-jsb-highlight"
      );
      const bar = getDeclarations(
        css,
        ".cm-gutter-lint .cm-gutterElement.cm-jsb-highlight"
      );

      // Assert
      expect(lines).toContain(
        "color-mix(in srgb, var(--jsb-code-keyword) 13%, transparent)"
      );
      expect(bar).toContain("inset 3px 0 0 var(--jsb-code-keyword)");
    });
  });

  describe("highlightStyle", () => {
    it.each([
      ["keys", [tags.propertyName], "--jsb-code-fg"],
      ["strings", [tags.string], "--jsb-code-string"],
      ["numbers", [tags.number], "--jsb-code-number"],
      ["booleans", [tags.bool], "--jsb-code-number"],
      ["null", [tags.null], "--jsb-code-number"],
      ["line comments", [tags.lineComment], "--jsb-code-comment"],
      ["block comments", [tags.blockComment], "--jsb-code-comment"],
      ["separators", [tags.separator], "--jsb-code-fg"],
      ["brackets", [tags.squareBracket], "--jsb-code-fg"],
      ["braces", [tags.brace], "--jsb-code-fg"],
    ])("should color the %s with the %s token", (_name, tokenTags, token) => {
      // Arrange
      const css = mountAndReadCss();
      const className = highlightStyle.style(tokenTags) as string;

      // Act
      const rule = css
        .split("\n")
        .find((line) => line.startsWith(`.${className} {`));

      // Assert
      expect(rule).toContain(`color: var(${token})`);
    });
  });
});
