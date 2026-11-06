import { Pom } from "@/shared/testing/pom";

import type { StatementPart } from "./Statement.types";

/** The selector of the element a statement is drawn in. */
const STATEMENT_SELECTOR = "code";

/** Page object of a statement. It has no role, label or test id: it finds the `code` element within its parent, and the `containing` option picks the one with a given text. */
export class StatementPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.findRootBySelector(STATEMENT_SELECTOR);
  }

  /**
   * The statement as it reads.
   * @returns The text of the element, with the pieces joined.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The pieces of the statement with the color each one is drawn in.
   * @returns For each piece, in order, its text and its computed color. A piece with no element of its own, which is plain text, has the color it inherits from the statement.
   */
  get parts(): StatementPart[] {
    const inherited = getComputedStyle(this.root).color;

    return Array.from(this.root.childNodes, (node) => ({
      text: String(node.textContent),
      color:
        node instanceof HTMLElement ? getComputedStyle(node).color : inherited,
    }));
  }

  /**
   * The font family of the statement.
   * @returns The computed value.
   */
  get fontFamily(): string {
    return getComputedStyle(this.root).fontFamily;
  }

  /**
   * The font size of the statement.
   * @returns The computed value.
   */
  get fontSize(): string {
    return getComputedStyle(this.root).fontSize;
  }

  /**
   * The line height of the statement.
   * @returns The computed value.
   */
  get lineHeight(): string {
    return getComputedStyle(this.root).lineHeight;
  }

  /**
   * The background of the box of the statement, which a host may fill.
   * @returns The computed background color.
   */
  get backgroundColor(): string {
    return getComputedStyle(this.root).backgroundColor;
  }
}
