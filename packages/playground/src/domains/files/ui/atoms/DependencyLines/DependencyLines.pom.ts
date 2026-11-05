import { Pom } from "@/shared/testing/pom";

/** Page object of a line of the dependency list, a part of the list: the page object of the list builds it, so it is exported only as a type. It has no test id: it finds the list items within its parent, and the `index` option picks one. */
class DependencyLinePom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("listitem"),
      'the role "listitem"'
    );
  }

  /**
   * How many lines its parent holds, whatever the `index` option. A page object that lists them builds one `DependencyLinePom` per index below this number.
   * @returns The number of list items within the parent.
   */
  get count(): number {
    return this.searchBase.queryAllByRole("listitem").length;
  }

  /**
   * Everything the line says, which is its number followed by its statement.
   * @returns The text of the line.
   */
  get text(): string {
    return this.root.textContent;
  }

  /**
   * The number of the line.
   * @returns The text of the first element of the line.
   */
  get number(): string | null {
    return this.root.firstElementChild?.textContent ?? null;
  }

  /**
   * The tag of the element that the statement holds, when the statement is not plain text. The statement is the last element of the line.
   * @returns The tag name in upper case, or null when the statement is text.
   */
  get statementElementTag(): string | null {
    return this.root.lastElementChild?.firstElementChild?.tagName ?? null;
  }
}

/** Page object of the dependency list of a file. It has no test id: it finds the list within its parent, which is not rendered for an empty list. */
export class DependencyLinesPom extends Pom {
  protected readonly defaultTestId = "";

  /** @inheritdoc */
  protected findRoot(): HTMLElement {
    return this.pickMatch(
      this.searchBase.queryAllByRole("list"),
      'the role "list"'
    );
  }

  /**
   * The lines of the list, in order.
   * @returns One page object for each line.
   */
  get lines(): DependencyLinePom[] {
    const { count } = this.childPom(DependencyLinePom);

    return Array.from({ length: count }, (_, index) =>
      this.childPom(DependencyLinePom, { index })
    );
  }

  /**
   * What each line says, in order.
   * @returns The number of the line followed by its statement.
   */
  get lineTexts(): string[] {
    return this.lines.map(({ text }) => text);
  }

  /**
   * The number of each line, in order.
   * @returns The text of each line number.
   */
  get lineNumbers(): (string | null)[] {
    return this.lines.map(({ number }) => number);
  }
}

export type { DependencyLinePom };
